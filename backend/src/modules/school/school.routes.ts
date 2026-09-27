import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import { prisma } from '../../database/prisma.js';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

export async function schoolRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Hanya School Admin yang boleh mengelola data sekolahnya sendiri
  fastify.addHook('preHandler', fastify.authorizeRoles(UserRole.SCHOOL_ADMIN));

  // Helper untuk mendapatkan schoolId dari token JWT
  const getSchoolId = (request: any): string => {
    return request.user.schoolId;
  };

  // --- 1. KELOLA KELAS ---
  fastify.get('/classes', async (request, reply) => {
    const schoolId = getSchoolId(request);
    const classes = await prisma.class.findMany({
      where: { schoolId },
      include: {
        _count: {
          select: { students: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return reply.send({ success: true, data: classes });
  });

  fastify.post('/classes', async (request, reply) => {
    const schoolId = getSchoolId(request);
    const schema = z.object({
      name: z.string().min(1),
      academicYear: z.string().min(4),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, message: 'Nama kelas dan tahun ajaran wajib diisi.' });
    }

    const newClass = await prisma.class.create({
      data: {
        schoolId,
        name: parsed.data.name,
        academicYear: parsed.data.academicYear,
      },
    });

    return reply.status(201).send({ success: true, message: 'Kelas berhasil dibuat.', data: newClass });
  });

  fastify.delete('/classes/:id', async (request, reply) => {
    const schoolId = getSchoolId(request);
    const { id } = request.params as { id: string };

    await prisma.class.deleteMany({
      where: { id, schoolId },
    });

    return reply.send({ success: true, message: 'Kelas berhasil dihapus.' });
  });

  // --- 2. KELOLA MATA PELAJARAN ---
  fastify.get('/subjects', async (request, reply) => {
    const schoolId = getSchoolId(request);
    const subjects = await prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    });

    return reply.send({ success: true, data: subjects });
  });

  fastify.post('/subjects', async (request, reply) => {
    const schoolId = getSchoolId(request);
    const schema = z.object({
      code: z.string().min(1),
      name: z.string().min(2),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, message: 'Kode dan nama mata pelajaran wajib diisi.' });
    }

    const subject = await prisma.subject.create({
      data: {
        schoolId,
        code: parsed.data.code.toUpperCase(),
        name: parsed.data.name,
      },
    });

    return reply.status(201).send({ success: true, message: 'Mata pelajaran berhasil ditambahkan.', data: subject });
  });

  fastify.delete('/subjects/:id', async (request, reply) => {
    const schoolId = getSchoolId(request);
    const { id } = request.params as { id: string };

    await prisma.subject.deleteMany({
      where: { id, schoolId },
    });

    return reply.send({ success: true, message: 'Mata pelajaran berhasil dihapus.' });
  });

  // --- 3. KELOLA GURU (SATUAN & IMPORT EXCEL) ---
  fastify.get('/teachers', async (request, reply) => {
    const schoolId = getSchoolId(request);
    const teachers = await prisma.user.findMany({
      where: { schoolId, role: UserRole.TEACHER },
      select: {
        id: true,
        identifier: true,
        fullName: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return reply.send({ success: true, data: teachers });
  });

  // Input Guru Satuan
  fastify.post('/teachers', async (request, reply) => {
    const schoolId = getSchoolId(request);
    const schema = z.object({
      identifier: z.string().min(2), // NIP / Email Guru
      fullName: z.string().min(2),
      password: z.string().min(6),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, message: 'Data guru tidak lengkap atau password kurang dari 6 karakter.' });
    }

    const { identifier, fullName, password } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: { schoolId, identifier },
    });
    if (existing) {
      return reply.status(409).send({ success: false, message: 'NIP/Email guru sudah terdaftar di sekolah ini.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const teacher = await prisma.user.create({
      data: {
        schoolId,
        role: UserRole.TEACHER,
        identifier,
        fullName,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        identifier: true,
        fullName: true,
        isActive: true,
      },
    });

    return reply.status(201).send({ success: true, message: 'Akun guru berhasil dibuat.', data: teacher });
  });

  // Import Guru Massal via Excel
  fastify.post('/teachers/import-excel', async (request, reply) => {
    const schoolId = getSchoolId(request);
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ success: false, message: 'File Excel (.xlsx/.xls) wajib diunggah.' });
    }

    const buffer = await data.toBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<any>(worksheet);

    if (!rows || rows.length === 0) {
      return reply.status(400).send({ success: false, message: 'File Excel kosong atau format tidak sesuai.' });
    }

    const createdTeachers = [];
    const skipped = [];

    for (const row of rows) {
      const identifier = String(row['NIP'] || row['nip'] || row['Email'] || row['email'] || '').trim();
      const fullName = String(row['Nama'] || row['nama'] || row['FullName'] || '').trim();
      const password = String(row['Password'] || row['password'] || 'Guru12345').trim();

      if (!identifier || !fullName) {
        skipped.push({ row, reason: 'NIP atau Nama kosong' });
        continue;
      }

      const existing = await prisma.user.findFirst({
        where: { schoolId, identifier },
      });

      if (existing) {
        skipped.push({ identifier, reason: 'Sudah terdaftar' });
        continue;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const created = await prisma.user.create({
        data: {
          schoolId,
          role: UserRole.TEACHER,
          identifier,
          fullName,
          passwordHash,
          isActive: true,
        },
      });

      createdTeachers.push({
        id: created.id,
        identifier: created.identifier,
        fullName: created.fullName,
      });
    }

    return reply.send({
      success: true,
      message: `Berhasil mengimpor ${createdTeachers.length} guru. Terlewati: ${skipped.length}.`,
      data: {
        importedCount: createdTeachers.length,
        skippedCount: skipped.length,
        skippedDetails: skipped,
      },
    });
  });

  fastify.delete('/teachers/:id', async (request, reply) => {
    const schoolId = getSchoolId(request);
    const { id } = request.params as { id: string };

    await prisma.user.deleteMany({
      where: { id, schoolId, role: UserRole.TEACHER },
    });

    return reply.send({ success: true, message: 'Akun guru berhasil dihapus.' });
  });
}
