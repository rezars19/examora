import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../../database/prisma.js';
import { SchoolStatus, UserRole } from '@prisma/client';
import { z } from 'zod';

export async function authRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // 1. Register Sekolah Baru (Status PENDING)
  fastify.post('/register-school', async (request, reply) => {
    const registerSchema = z.object({
      name: z.string().min(3),
      code: z.string().min(2).max(20).toUpperCase(),
      operatorName: z.string().min(3),
      email: z.string().email(),
      phone: z.string().optional(),
      password: z.string().min(6),
    });

    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { name, code, operatorName, email, phone, password } = parsed.data;

    // Cek duplikasi kode sekolah atau email
    const existingSchool = await prisma.school.findFirst({
      where: {
        OR: [{ code }, { email }],
      },
    });

    if (existingSchool) {
      return reply.status(409).send({
        success: false,
        message: 'Kode sekolah atau email sudah terdaftar di sistem.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Buat Sekolah dan Akun Admin Sekolah dalam transaksi
    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name,
          code,
          operatorName,
          email,
          phone,
          status: SchoolStatus.PENDING,
        },
      });

      const adminUser = await tx.user.create({
        data: {
          schoolId: school.id,
          role: UserRole.SCHOOL_ADMIN,
          identifier: email,
          fullName: operatorName,
          passwordHash,
          isActive: true,
        },
      });

      return { school, adminUser };
    });

    return reply.status(201).send({
      success: true,
      message: 'Pendaftaran sekolah berhasil. Akun akan aktif setelah disetujui Super Admin.',
      data: {
        schoolId: result.school.id,
        schoolName: result.school.name,
        code: result.school.code,
        status: result.school.status,
      },
    });
  });

  // 2. Login Terpadu (Superadmin, Admin Sekolah, Guru, Siswa)
  fastify.post('/login', async (request, reply) => {
    const loginSchema = z.object({
      identifier: z.string().min(1),
      password: z.string().min(1),
      schoolCode: z.string().optional(),
    });

    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        message: 'Identifier dan password wajib diisi.',
      });
    }

    const { identifier, password, schoolCode } = parsed.data;

    // Cek kemungkinan Superadmin (jika tidak mengisi schoolCode atau login portal superadmin)
    if (!schoolCode) {
      const superadmin = await prisma.user.findFirst({
        where: {
          role: UserRole.SUPERADMIN,
          identifier,
        },
      });

      if (superadmin) {
        const validPass = await bcrypt.compare(password, superadmin.passwordHash);
        if (!validPass) {
          return reply.status(401).send({ success: false, message: 'Password salah.' });
        }

        const token = fastify.jwt.sign({
          id: superadmin.id,
          schoolId: null,
          role: superadmin.role,
          identifier: superadmin.identifier,
          fullName: superadmin.fullName,
        });

        return reply.send({
          success: true,
          message: 'Login Super Admin berhasil.',
          data: {
            token,
            user: {
              id: superadmin.id,
              fullName: superadmin.fullName,
              role: superadmin.role,
              identifier: superadmin.identifier,
            },
          },
        });
      }
    }

    // Jika bukan superadmin, cari sekolah target
    let targetSchoolId: string | undefined;

    if (schoolCode) {
      const school = await prisma.school.findUnique({
        where: { code: schoolCode.toUpperCase() },
      });
      if (!school) {
        return reply.status(404).send({ success: false, message: 'Kode sekolah tidak ditemukan.' });
      }
      targetSchoolId = school.id;
    }

    // Cari user berdasarkan identifier dan opsional schoolId
    const user = await prisma.user.findFirst({
      where: {
        identifier,
        ...(targetSchoolId ? { schoolId: targetSchoolId } : {}),
      },
      include: {
        school: true,
        subject: true,
      },
    });

    if (!user || !user.school) {
      return reply.status(401).send({
        success: false,
        message: 'Akun tidak ditemukan atau kode sekolah tidak sesuai.',
      });
    }

    // Cek status sekolah
    if (user.school.status === SchoolStatus.PENDING) {
      return reply.status(403).send({
        success: false,
        message: 'Pendaftaran sekolah ini masih menunggu persetujuan Super Admin.',
      });
    }

    if (user.school.status === SchoolStatus.SUSPENDED) {
      return reply.status(403).send({
        success: false,
        message: 'Akses sekolah ditangguhkan oleh Super Admin.',
      });
    }

    if (!user.isActive) {
      return reply.status(403).send({
        success: false,
        message: 'Akun dinonaktifkan oleh administrator.',
      });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return reply.status(401).send({ success: false, message: 'Password salah.' });
    }

    const token = fastify.jwt.sign({
      id: user.id,
      schoolId: user.schoolId,
      role: user.role,
      identifier: user.identifier,
      fullName: user.fullName,
      subjectId: user.subjectId,
      subjectName: user.subject?.name,
    });

    return reply.send({
      success: true,
      message: 'Login berhasil.',
      data: {
        token,
        user: {
          id: user.id,
          schoolId: user.schoolId,
          role: user.role,
          identifier: user.identifier,
          fullName: user.fullName,
          subjectId: user.subjectId,
          subject: user.subject ? { id: user.subject.id, code: user.subject.code, name: user.subject.name } : null,
        },
        school: {
          id: user.school.id,
          code: user.school.code,
          name: user.school.name,
        },
      },
    });
  });

  // 3. Dropdown Publik: Daftar Sekolah Aktif
  fastify.get('/schools', async (request, reply) => {
    const schools = await prisma.school.findMany({
      where: { status: SchoolStatus.ACTIVE },
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return reply.send({
      success: true,
      data: schools,
    });
  });

  // 4. Dropdown Publik: Daftar Kelas di Sekolah
  fastify.get('/schools/:schoolId/classes', async (request, reply) => {
    const { schoolId } = request.params as { schoolId: string };

    const classes = await prisma.class.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        academicYear: true,
      },
      orderBy: { name: 'asc' },
    });

    return reply.send({
      success: true,
      data: classes,
    });
  });

  // 5. Registrasi Mandiri Siswa
  fastify.post('/register-student', async (request, reply) => {
    const studentSchema = z.object({
      schoolId: z.string().uuid(),
      classId: z.string().uuid(),
      identifier: z.string().min(3), // NISN / No. Induk
      fullName: z.string().min(2),
      password: z.string().min(6),
    });

    const parsed = studentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        message: 'Validasi data siswa gagal.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { schoolId, classId, identifier, fullName, password } = parsed.data;

    // Pastikan sekolah aktif
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });
    if (!school || school.status !== SchoolStatus.ACTIVE) {
      return reply.status(400).send({
        success: false,
        message: 'Sekolah tidak ditemukan atau belum aktif.',
      });
    }

    // Pastikan kelas ada di sekolah tersebut
    const targetClass = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });
    if (!targetClass) {
      return reply.status(400).send({
        success: false,
        message: 'Kelas tidak valid untuk sekolah ini.',
      });
    }

    // Cek duplikasi NISN di sekolah yang sama
    const existingStudent = await prisma.user.findFirst({
      where: { schoolId, identifier },
    });
    if (existingStudent) {
      return reply.status(409).send({
        success: false,
        message: 'NISN sudah terdaftar di sekolah ini. Silakan login.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.user.create({
        data: {
          schoolId,
          role: UserRole.STUDENT,
          identifier,
          fullName,
          passwordHash,
          isActive: true,
        },
      });

      await tx.studentClass.create({
        data: {
          studentId: student.id,
          classId: targetClass.id,
        },
      });

      return student;
    });

    const token = fastify.jwt.sign({
      id: result.id,
      schoolId: result.schoolId,
      role: result.role,
      identifier: result.identifier,
      fullName: result.fullName,
    });

    return reply.status(201).send({
      success: true,
      message: 'Registrasi siswa berhasil.',
      data: {
        token,
        user: {
          id: result.id,
          schoolId: result.schoolId,
          role: result.role,
          identifier: result.identifier,
          fullName: result.fullName,
          className: targetClass.name,
        },
      },
    });
  });

  // 6. Profil Pengguna yang Sedang Login
  fastify.get(
    '/me',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const authUser = request.user;
      const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: {
          id: true,
          schoolId: true,
          subjectId: true,
          role: true,
          identifier: true,
          fullName: true,
          subject: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          school: {
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
            },
          },
          studentClasses: {
            include: {
              class: true,
            },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({ success: false, message: 'User tidak ditemukan.' });
      }

      return reply.send({
        success: true,
        data: user,
      });
    }
  );
}
