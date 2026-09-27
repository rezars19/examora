import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '../../database/prisma.js';
import { SchoolStatus, UserRole } from '@prisma/client';
import { z } from 'zod';

export async function superadminRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Hanya role SUPERADMIN yang boleh mengakses rute ini
  fastify.addHook('preHandler', fastify.authorizeRoles(UserRole.SUPERADMIN));

  // 1. Ambil Semua Sekolah (Bisa filter status PENDING/ACTIVE/SUSPENDED)
  fastify.get('/schools', async (request, reply) => {
    const querySchema = z.object({
      status: z.nativeEnum(SchoolStatus).optional(),
      search: z.string().optional(),
    });

    const parsed = querySchema.safeParse(request.query);
    const { status, search } = parsed.success ? parsed.data : { status: undefined, search: undefined };

    const schools = await prisma.school.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        _count: {
          select: {
            users: true,
            classes: true,
            exams: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({
      success: true,
      data: schools,
    });
  });

  // 2. Ubah Status Sekolah (Approve / Reject / Suspend)
  fastify.patch('/schools/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };

    const bodySchema = z.object({
      status: z.nativeEnum(SchoolStatus),
    });

    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        message: 'Status tidak valid. Pilihan: PENDING, ACTIVE, SUSPENDED.',
      });
    }

    const school = await prisma.school.findUnique({
      where: { id },
    });

    if (!school) {
      return reply.status(404).send({ success: false, message: 'Sekolah tidak ditemukan.' });
    }

    const updated = await prisma.school.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return reply.send({
      success: true,
      message: `Status sekolah ${updated.name} berhasil diubah menjadi ${updated.status}.`,
      data: updated,
    });
  });

  // 3. Statistik Platform Global
  fastify.get('/metrics', async (request, reply) => {
    const [totalSchools, pendingSchools, activeSchools, totalTeachers, totalStudents, totalExams] =
      await Promise.all([
        prisma.school.count(),
        prisma.school.count({ where: { status: SchoolStatus.PENDING } }),
        prisma.school.count({ where: { status: SchoolStatus.ACTIVE } }),
        prisma.user.count({ where: { role: UserRole.TEACHER } }),
        prisma.user.count({ where: { role: UserRole.STUDENT } }),
        prisma.exam.count(),
      ]);

    return reply.send({
      success: true,
      data: {
        schools: {
          total: totalSchools,
          pending: pendingSchools,
          active: activeSchools,
        },
        users: {
          teachers: totalTeachers,
          students: totalStudents,
        },
        exams: {
          total: totalExams,
        },
      },
    });
  });
}
