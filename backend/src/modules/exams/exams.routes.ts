import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { randomBytes } from 'crypto';
import * as XLSX from 'xlsx';
import { prisma } from '../../database/prisma.js';
import { AttemptStatus, ExamStatus, Prisma, QuestionType, UserRole } from '@prisma/client';
import { z } from 'zod';

// Helper acak array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function examsRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // --- 1. RUTE GURU & ADMIN SEKOLAH (MANAJEMEN UJIAN) ---

  // List Ujian di Sekolah
  fastify.get(
    '/list',
    { preHandler: [fastify.authorizeRoles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN)] },
    async (request, reply) => {
      const schoolId = request.user.schoolId!;
      const exams = await prisma.exam.findMany({
        where: { schoolId },
        include: {
          subject: true,
          examClasses: {
            include: { class: true },
          },
          _count: {
            select: { attempts: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ success: true, data: exams });
    }
  );

  // Buat Jadwal Ujian Baru
  fastify.post(
    '/create',
    { preHandler: [fastify.authorizeRoles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN)] },
    async (request, reply) => {
      const schoolId = request.user.schoolId!;

      const schema = z.object({
        subjectId: z.string().uuid(),
        title: z.string().min(3),
        description: z.string().optional(),
        durationMinutes: z.number().int().min(5),
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
        randomizeQuestions: z.boolean().default(true),
        randomizeOptions: z.boolean().default(true),
        maxViolations: z.number().int().default(3),
        classIds: z.array(z.string().uuid()).min(1),
      });

      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          message: 'Validasi jadwal ujian gagal.',
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const {
        subjectId,
        title,
        description,
        durationMinutes,
        startTime,
        endTime,
        randomizeQuestions,
        randomizeOptions,
        maxViolations,
        classIds,
      } = parsed.data;

      // Generate 6-char token ujian dan 6-digit PIN pengawas
      const token = randomBytes(3).toString('hex').toUpperCase();
      const proctorPin = Math.floor(100000 + Math.random() * 900000).toString();

      const exam = await prisma.exam.create({
        data: {
          schoolId,
          subjectId,
          title,
          description,
          token,
          proctorPin,
          durationMinutes,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          randomizeQuestions,
          randomizeOptions,
          maxViolations,
          status: ExamStatus.PUBLISHED,
          examClasses: {
            create: classIds.map((cid) => ({ classId: cid })),
          },
        },
        include: {
          examClasses: { include: { class: true } },
        },
      });

      return reply.status(201).send({
        success: true,
        message: 'Jadwal ujian berhasil dibuat.',
        data: exam,
      });
    }
  );

  // Rekap Nilai Ujian (Tabel & Live Monitoring)
  fastify.get(
    '/:id/recap',
    { preHandler: [fastify.authorizeRoles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN)] },
    async (request, reply) => {
      const schoolId = request.user.schoolId!;
      const { id } = request.params as { id: string };

      const exam = await prisma.exam.findFirst({
        where: { id, schoolId },
        include: {
          subject: true,
          attempts: {
            include: {
              student: {
                select: {
                  id: true,
                  identifier: true,
                  fullName: true,
                  studentClasses: { include: { class: true } },
                },
              },
            },
            orderBy: { score: 'desc' },
          },
        },
      });

      if (!exam) {
        return reply.status(404).send({ success: false, message: 'Ujian tidak ditemukan.' });
      }

      return reply.send({ success: true, data: exam });
    }
  );

  // Export Rekap Nilai ke Excel (.xlsx)
  fastify.get(
    '/:id/recap-excel',
    { preHandler: [fastify.authorizeRoles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN)] },
    async (request, reply) => {
      const schoolId = request.user.schoolId!;
      const { id } = request.params as { id: string };

      const exam = await prisma.exam.findFirst({
        where: { id, schoolId },
        include: {
          subject: true,
          attempts: {
            include: {
              student: {
                select: {
                  identifier: true,
                  fullName: true,
                  studentClasses: { include: { class: true } },
                },
              },
            },
            orderBy: { score: 'desc' },
          },
        },
      });

      if (!exam) {
        return reply.status(404).send({ success: false, message: 'Ujian tidak ditemukan.' });
      }

      const rows = exam.attempts.map((att, idx) => ({
        No: idx + 1,
        NISN: att.student.identifier,
        'Nama Siswa': att.student.fullName,
        Kelas: att.student.studentClasses[0]?.class.name || '-',
        'Nilai Akhir': att.score !== null ? att.score : 'Belum Selesai',
        Status: att.status,
        Pelanggaran: att.violationCount,
        'Waktu Mulai': att.startTime.toLocaleString('id-ID'),
        'Waktu Selesai': att.submitTime ? att.submitTime.toLocaleString('id-ID') : '-',
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Nilai');

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      reply.header('Content-Disposition', `attachment; filename=Rekap_${exam.title.replace(/\s+/g, '_')}.xlsx`);
      return reply.send(excelBuffer);
    }
  );

  // Reset Sesi Siswa (Kendala HP Rusak / Lowbat)
  fastify.post(
    '/:id/reset-student-session',
    { preHandler: [fastify.authorizeRoles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN)] },
    async (request, reply) => {
      const schoolId = request.user.schoolId!;
      const { id: examId } = request.params as { id: string };

      const schema = z.object({
        studentId: z.string().uuid(),
      });

      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, message: 'Student ID wajib diisi.' });
      }

      const attempt = await prisma.examAttempt.findFirst({
        where: { examId, studentId: parsed.data.studentId, exam: { schoolId } },
      });

      if (!attempt) {
        return reply.status(404).send({ success: false, message: 'Sesi ujian siswa tidak ditemukan.' });
      }

      // Reset status kembali ke IN_PROGRESS jika terblokir atau reset device info
      await prisma.examAttempt.update({
        where: { id: attempt.id },
        data: {
          status: AttemptStatus.IN_PROGRESS,
          deviceInfo: Prisma.DbNull,
        },
      });

      return reply.send({ success: true, message: 'Sesi siswa berhasil direset. Siswa dapat login kembali.' });
    }
  );

  // --- 2. RUTE SISWA (MOBILE EXAM ENGINE) ---

  // Ambil Ujian yang Tersedia untuk Kelas Siswa
  fastify.get(
    '/student/available',
    { preHandler: [fastify.authorizeRoles(UserRole.STUDENT)] },
    async (request, reply) => {
      const studentId = request.user.id;
      const schoolId = request.user.schoolId!;

      const studentClass = await prisma.studentClass.findFirst({
        where: { studentId },
      });

      if (!studentClass) {
        return reply.status(400).send({ success: false, message: 'Siswa belum terdaftar di kelas manapun.' });
      }

      const now = new Date();

      const exams = await prisma.exam.findMany({
        where: {
          schoolId,
          status: ExamStatus.PUBLISHED,
          examClasses: { some: { classId: studentClass.classId } },
          endTime: { gte: now },
        },
        include: {
          subject: true,
          attempts: {
            where: { studentId },
            select: { id: true, status: true, score: true },
          },
        },
        orderBy: { startTime: 'asc' },
      });

      return reply.send({ success: true, data: exams });
    }
  );

  // Mulai Ujian (Validasi Token, Preload Soal, Acak Urutan)
  fastify.post(
    '/student/start',
    { preHandler: [fastify.authorizeRoles(UserRole.STUDENT)] },
    async (request, reply) => {
      const studentId = request.user.id;
      const schoolId = request.user.schoolId!;

      const schema = z.object({
        examId: z.string().uuid(),
        token: z.string().min(1).toUpperCase(),
        deviceInfo: z.record(z.any()).optional(),
      });

      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, message: 'Token ujian wajib diisi.' });
      }

      const { examId, token, deviceInfo } = parsed.data;

      const exam = await prisma.exam.findFirst({
        where: { id: examId, schoolId },
        include: {
          subject: {
            include: {
              questionBanks: {
                include: { questions: true },
              },
            },
          },
        },
      });

      if (!exam) {
        return reply.status(404).send({ success: false, message: 'Ujian tidak ditemukan.' });
      }

      if (exam.token !== token) {
        return reply.status(400).send({ success: false, message: 'Token ujian salah.' });
      }

      const now = new Date();
      if (now < exam.startTime || now > exam.endTime) {
        return reply.status(400).send({ success: false, message: 'Ujian belum dimulai atau sudah berakhir.' });
      }

      // Cek apakah sudah ada attempt sebelumnya
      let attempt = await prisma.examAttempt.findUnique({
        where: { examId_studentId: { examId, studentId } },
        include: { answers: true },
      });

      if (attempt) {
        if (attempt.status === AttemptStatus.SUBMITTED || attempt.status === AttemptStatus.FORCE_SUBMITTED) {
          return reply.status(400).send({ success: false, message: 'Ujian ini sudah diselesaikan.' });
        }
        if (attempt.status === AttemptStatus.BLOCKED) {
          return reply.status(403).send({
            success: false,
            message: 'Sesi terkunci karena pelanggaran. Hubungi pengawas.',
          });
        }
      } else {
        // Ambil semua soal dari bank soal yang terkait dengan mata pelajaran ujian
        const allQuestions = exam.subject.questionBanks.flatMap((b) => b.questions);

        if (allQuestions.length === 0) {
          return reply.status(400).send({ success: false, message: 'Bank soal masih kosong untuk mata pelajaran ini.' });
        }

        // Acak urutan soal jika opsi randomize diaktifkan
        let processedQuestions = exam.randomizeQuestions ? shuffleArray(allQuestions) : allQuestions;

        // Siapkan snapshot urutan soal & opsi (hilangkan flag isCorrect untuk dikirim ke mobile!)
        const sanitizedQuestions = processedQuestions.map((q) => {
          let opts: any[] = (q.options as any[]) || [];
          if (exam.randomizeOptions && q.type !== QuestionType.ESSAY) {
            opts = shuffleArray(opts);
          }

          return {
            id: q.id,
            type: q.type,
            content: q.content,
            mediaUrl: q.mediaUrl,
            points: q.points,
            options: opts.map((opt) => ({ id: opt.id, text: opt.text })), // Tanpa isCorrect!
          };
        });

        // Hitung deadline (sekarang + durationMinutes, tapi tidak boleh melebihi exam.endTime)
        const durationMs = exam.durationMinutes * 60 * 1000;
        let calculatedEnd = new Date(now.getTime() + durationMs);
        if (calculatedEnd > exam.endTime) {
          calculatedEnd = exam.endTime;
        }

        attempt = await prisma.examAttempt.create({
          data: {
            examId,
            studentId,
            startTime: now,
            endTime: calculatedEnd,
            status: AttemptStatus.IN_PROGRESS,
            questionOrder: sanitizedQuestions,
            deviceInfo: deviceInfo || {},
          },
          include: { answers: true },
        });
      }

      return reply.send({
        success: true,
        message: 'Mode ujian dimulai.',
        data: {
          attemptId: attempt.id,
          title: exam.title,
          durationMinutes: exam.durationMinutes,
          serverEndTime: attempt.endTime.toISOString(),
          questions: attempt.questionOrder,
          savedAnswers: attempt.answers.map((ans) => ({
            questionId: ans.questionId,
            selectedOptionIds: ans.selectedOptionIds,
            essayText: ans.essayText,
            isDoubtful: ans.isDoubtful,
          })),
        },
      });
    }
  );

  // Autosave Jawaban Siswa
  fastify.put(
    '/student/attempts/:id/answer',
    { preHandler: [fastify.authorizeRoles(UserRole.STUDENT)] },
    async (request, reply) => {
      const studentId = request.user.id;
      const { id: attemptId } = request.params as { id: string };

      const schema = z.object({
        questionId: z.string().uuid(),
        selectedOptionIds: z.array(z.string()).default([]),
        essayText: z.string().optional().nullable(),
        isDoubtful: z.boolean().default(false),
      });

      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, message: 'Format jawaban tidak valid.' });
      }

      const attempt = await prisma.examAttempt.findFirst({
        where: { id: attemptId, studentId },
      });

      if (!attempt || attempt.status !== AttemptStatus.IN_PROGRESS) {
        return reply.status(400).send({ success: false, message: 'Sesi ujian tidak aktif atau sudah selesai.' });
      }

      // Pastikan belum melewati server deadline
      if (new Date() > attempt.endTime) {
        return reply.status(403).send({ success: false, message: 'Waktu ujian sudah habis.' });
      }

      const { questionId, selectedOptionIds, essayText, isDoubtful } = parsed.data;

      const answer = await prisma.examAnswer.upsert({
        where: {
          attemptId_questionId: { attemptId, questionId },
        },
        create: {
          attemptId,
          questionId,
          selectedOptionIds,
          essayText,
          isDoubtful,
        },
        update: {
          selectedOptionIds,
          essayText,
          isDoubtful,
        },
      });

      return reply.send({ success: true, data: answer });
    }
  );

  // Catat Audit Log Keamanan Siswa (Keluar App / Background)
  fastify.post(
    '/student/attempts/:id/log',
    { preHandler: [fastify.authorizeRoles(UserRole.STUDENT)] },
    async (request, reply) => {
      const studentId = request.user.id;
      const { id: attemptId } = request.params as { id: string };

      const schema = z.object({
        eventType: z.string().min(1),
        payload: z.record(z.any()).optional(),
      });

      const parsed = schema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ success: false, message: 'Log event wajib diisi.' });
      }

      const attempt = await prisma.examAttempt.findFirst({
        where: { id: attemptId, studentId },
        include: { exam: true },
      });

      if (!attempt) {
        return reply.status(404).send({ success: false, message: 'Sesi tidak ditemukan.' });
      }

      await prisma.examLog.create({
        data: {
          attemptId,
          eventType: parsed.data.eventType,
          payload: parsed.data.payload || {},
        },
      });

      const updatedViolationCount = attempt.violationCount + 1;
      let newStatus = attempt.status;

      if (updatedViolationCount >= attempt.exam.maxViolations) {
        newStatus = AttemptStatus.BLOCKED;
      }

      await prisma.examAttempt.update({
        where: { id: attempt.id },
        data: {
          violationCount: updatedViolationCount,
          status: newStatus,
        },
      });

      return reply.send({
        success: true,
        violationCount: updatedViolationCount,
        isBlocked: newStatus === AttemptStatus.BLOCKED,
      });
    }
  );

  // Bypass PIN Darurat Pengawas di HP Siswa
  fastify.post(
    '/student/attempts/:id/bypass-pin',
    { preHandler: [fastify.authorizeRoles(UserRole.STUDENT)] },
    async (request, reply) => {
      const { id: attemptId } = request.params as { id: string };
      const schema = z.object({ pin: z.string().min(1) });
      const parsed = schema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({ success: false, message: 'PIN wajib diisi.' });
      }

      const attempt = await prisma.examAttempt.findUnique({
        where: { id: attemptId },
        include: { exam: true },
      });

      if (!attempt) {
        return reply.status(404).send({ success: false, message: 'Sesi tidak ditemukan.' });
      }

      if (attempt.exam.proctorPin !== parsed.data.pin) {
        return reply.status(400).send({ success: false, message: 'PIN pengawas salah.' });
      }

      // Catat log bypass PIN
      await prisma.examLog.create({
        data: {
          attemptId,
          eventType: 'PROCTOR_PIN_BYPASS',
          payload: { timestamp: new Date().toISOString() },
        },
      });

      return reply.send({ success: true, message: 'PIN pengawas terverifikasi. Kunci dibuka.' });
    }
  );

  // Submit Ujian & Auto-Grading Instan
  fastify.post(
    '/student/attempts/:id/submit',
    { preHandler: [fastify.authorizeRoles(UserRole.STUDENT)] },
    async (request, reply) => {
      const studentId = request.user.id;
      const { id: attemptId } = request.params as { id: string };

      const attempt = await prisma.examAttempt.findFirst({
        where: { id: attemptId, studentId },
        include: {
          answers: true,
          exam: {
            include: {
              subject: {
                include: {
                  questionBanks: {
                    include: { questions: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!attempt) {
        return reply.status(404).send({ success: false, message: 'Sesi ujian tidak ditemukan.' });
      }

      if (attempt.status === AttemptStatus.SUBMITTED || attempt.status === AttemptStatus.FORCE_SUBMITTED) {
        return reply.send({
          success: true,
          message: 'Ujian sudah diserahkan sebelumnya.',
          score: attempt.score,
        });
      }

      // Jalankan Auto-Grading
      const allQuestions = attempt.exam.subject.questionBanks.flatMap((b) => b.questions);
      const studentAnswersMap = new Map<string, string[]>();
      attempt.answers.forEach((ans) => {
        studentAnswersMap.set(ans.questionId, ans.selectedOptionIds);
      });

      let totalPointsEarned = 0;
      let totalMaxPoints = 0;

      for (const q of allQuestions) {
        totalMaxPoints += q.points;
        const studentAns = studentAnswersMap.get(q.id) || [];
        const options = (q.options as any[]) || [];

        if (q.type === QuestionType.SINGLE_CHOICE) {
          const correctOpt = options.find((o) => o.isCorrect === true);
          if (correctOpt && studentAns.length > 0 && studentAns[0] === correctOpt.id) {
            totalPointsEarned += q.points;
          }
        } else if (q.type === QuestionType.MULTIPLE_CHOICE) {
          const correctIds = options.filter((o) => o.isCorrect === true).map((o) => o.id).sort();
          const sortedStudent = [...studentAns].sort();
          if (JSON.stringify(correctIds) === JSON.stringify(sortedStudent)) {
            totalPointsEarned += q.points;
          }
        }
      }

      const finalScore = totalMaxPoints > 0 ? (totalPointsEarned / totalMaxPoints) * 100 : 0;
      const roundedScore = Math.round(finalScore * 100) / 100;

      const updated = await prisma.examAttempt.update({
        where: { id: attempt.id },
        data: {
          status: AttemptStatus.SUBMITTED,
          submitTime: new Date(),
          score: roundedScore,
        },
      });

      return reply.send({
        success: true,
        message: 'Ujian berhasil diserahkan. Nilai telah dihitung otomatis.',
        data: {
          attemptId: updated.id,
          score: updated.score,
          submitTime: updated.submitTime,
        },
      });
    }
  );
}
