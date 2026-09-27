import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { prisma } from '../../database/prisma.js';
import { QuestionType, UserRole } from '@prisma/client';
import { z } from 'zod';

export async function questionsRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Akses oleh Guru dan Admin Sekolah
  fastify.addHook('preHandler', fastify.authorizeRoles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN));

  const getSchoolId = (request: any): string => request.user.schoolId;
  const getUserId = (request: any): string => request.user.id;

  // --- 1. UPLOAD MEDIA GAMBAR DENGAN KOMPRESI SHARP WEBP ---
  fastify.post('/upload-media', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ success: false, message: 'File gambar wajib diunggah.' });
    }

    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!existsSync(uploadDir)) {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const buffer = await data.toBuffer();
    const filename = `${randomUUID()}.webp`;
    const outputPath = path.join(uploadDir, filename);

    // Kompresi WebP: max width 1200px, quality 80% (turun dari 4-5MB jadi ~80-120KB)
    await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    const mediaUrl = `/uploads/${filename}`;

    return reply.status(201).send({
      success: true,
      message: 'Gambar berhasil diunggah dan dikompresi ke WebP.',
      data: {
        url: mediaUrl,
        filename,
      },
    });
  });

  // --- 2. BANK SOAL ---
  fastify.get('/banks', async (request, reply) => {
    const schoolId = getSchoolId(request);
    const banks = await prisma.questionBank.findMany({
      where: { schoolId },
      include: {
        subject: true,
        createdBy: {
          select: { id: true, fullName: true },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: banks });
  });

  fastify.post('/banks', async (request, reply) => {
    const schoolId = getSchoolId(request);
    const userId = getUserId(request);

    const schema = z.object({
      subjectId: z.string().uuid(),
      title: z.string().min(3),
      description: z.string().optional(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, message: 'Data bank soal tidak lengkap.' });
    }

    const bank = await prisma.questionBank.create({
      data: {
        schoolId,
        subjectId: parsed.data.subjectId,
        createdById: userId,
        title: parsed.data.title,
        description: parsed.data.description,
      },
    });

    return reply.status(201).send({ success: true, message: 'Bank soal berhasil dibuat.', data: bank });
  });

  fastify.get('/banks/:id', async (request, reply) => {
    const schoolId = getSchoolId(request);
    const { id } = request.params as { id: string };

    const bank = await prisma.questionBank.findFirst({
      where: { id, schoolId },
      include: {
        subject: true,
        questions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!bank) {
      return reply.status(404).send({ success: false, message: 'Bank soal tidak ditemukan.' });
    }

    return reply.send({ success: true, data: bank });
  });

  fastify.delete('/banks/:id', async (request, reply) => {
    const schoolId = getSchoolId(request);
    const { id } = request.params as { id: string };

    await prisma.questionBank.deleteMany({
      where: { id, schoolId },
    });

    return reply.send({ success: true, message: 'Bank soal berhasil dihapus.' });
  });

  // --- 3. BUTIR SOAL ---
  fastify.post('/banks/:bankId/questions', async (request, reply) => {
    const schoolId = getSchoolId(request);
    const { bankId } = request.params as { bankId: string };

    const bank = await prisma.questionBank.findFirst({
      where: { id: bankId, schoolId },
    });

    if (!bank) {
      return reply.status(404).send({ success: false, message: 'Bank soal tidak ditemukan.' });
    }

    const schema = z.object({
      type: z.nativeEnum(QuestionType),
      content: z.string().min(1),
      mediaUrl: z.string().optional().nullable(),
      points: z.number().default(1.0),
      options: z
        .array(
          z.object({
            id: z.string(),
            text: z.string(),
            isCorrect: z.boolean(),
          })
        )
        .optional()
        .nullable(),
      explanation: z.string().optional().nullable(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi butir soal gagal.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const question = await prisma.question.create({
      data: {
        bankId,
        type: parsed.data.type,
        content: parsed.data.content,
        mediaUrl: parsed.data.mediaUrl,
        points: parsed.data.points,
        options: parsed.data.options ? JSON.parse(JSON.stringify(parsed.data.options)) : undefined,
        explanation: parsed.data.explanation,
      },
    });

    return reply.status(201).send({ success: true, message: 'Butir soal berhasil ditambahkan.', data: question });
  });

  fastify.delete('/questions/:id', async (request, reply) => {
    const schoolId = getSchoolId(request);
    const { id } = request.params as { id: string };

    // Pastikan pertanyaan berasal dari bank soal milik sekolah ini
    const question = await prisma.question.findFirst({
      where: { id, bank: { schoolId } },
    });

    if (!question) {
      return reply.status(404).send({ success: false, message: 'Butir soal tidak ditemukan.' });
    }

    await prisma.question.delete({ where: { id } });

    return reply.send({ success: true, message: 'Butir soal berhasil dihapus.' });
  });
}
