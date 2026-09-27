import { PrismaClient, QuestionType, SchoolStatus, UserRole, ExamStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

export async function runSeed() {
  console.log('=== Memulai Seeding Data Examora ===');

  const defaultAdminPassHash = await bcrypt.hash('admin', 10);
  const studentPassHash = await bcrypt.hash('solihin123', 10);

  // 1. Super Admin (Username: admin, Password: admin)
  let superadmin = await prisma.user.findFirst({
    where: { role: UserRole.SUPERADMIN, identifier: 'admin' },
  });

  if (!superadmin) {
    superadmin = await prisma.user.create({
      data: {
        role: UserRole.SUPERADMIN,
        identifier: 'admin',
        passwordHash: defaultAdminPassHash,
        fullName: 'Super Administrator Examora',
        isActive: true,
      },
    });
    console.log(`✓ Super Admin dibuat: admin / admin`);
  } else {
    await prisma.user.update({
      where: { id: superadmin.id },
      data: { passwordHash: defaultAdminPassHash },
    });
    console.log(`✓ Password Super Admin 'admin' diperbarui menjadi: admin`);
  }

  // Backup superadmin identifier
  let superadminLegacy = await prisma.user.findFirst({
    where: { role: UserRole.SUPERADMIN, identifier: 'superadmin' },
  });
  if (!superadminLegacy) {
    await prisma.user.create({
      data: {
        role: UserRole.SUPERADMIN,
        identifier: 'superadmin',
        passwordHash: defaultAdminPassHash,
        fullName: 'Super Administrator Examora (Backup)',
        isActive: true,
      },
    });
  }

  // 2. Sekolah: SMA Darul Ulum
  let school = await prisma.school.findUnique({
    where: { code: 'DARULULUM' },
  });

  if (!school) {
    school = await prisma.school.create({
      data: {
        code: 'DARULULUM',
        name: 'SMA Darul Ulum',
        operatorName: 'Operator Darul Ulum',
        email: 'info@darululum.sch.id',
        phone: '08123456789',
        status: SchoolStatus.ACTIVE,
      },
    });
    console.log(`✓ Sekolah SMA Darul Ulum dibuat (Kode: DARULULUM)`);
  }

  // 3. Admin Sekolah SMA Darul Ulum (Username: admin, Password: admin, Kode: DARULULUM)
  let schoolAdmin = await prisma.user.findFirst({
    where: { schoolId: school.id, identifier: 'admin' },
  });

  if (!schoolAdmin) {
    schoolAdmin = await prisma.user.create({
      data: {
        schoolId: school.id,
        role: UserRole.SCHOOL_ADMIN,
        identifier: 'admin',
        passwordHash: defaultAdminPassHash,
        fullName: 'Admin Sekolah SMA Darul Ulum',
        isActive: true,
      },
    });
    console.log(`✓ Admin Sekolah Darul Ulum dibuat: admin / admin`);
  } else {
    await prisma.user.update({
      where: { id: schoolAdmin.id },
      data: { passwordHash: defaultAdminPassHash, role: UserRole.SCHOOL_ADMIN },
    });
    console.log(`✓ Akun Admin Sekolah Darul Ulum diperbarui: admin / admin`);
  }

  // 4. Guru SMA Darul Ulum (Username: guru, Password: admin, Kode: DARULULUM)
  let teacher = await prisma.user.findFirst({
    where: { schoolId: school.id, identifier: 'guru' },
  });

  if (!teacher) {
    teacher = await prisma.user.create({
      data: {
        schoolId: school.id,
        role: UserRole.TEACHER,
        identifier: 'guru',
        passwordHash: defaultAdminPassHash,
        fullName: 'Drs. H. Ahmad Solihin, M.Pd.',
        isActive: true,
      },
    });
    console.log(`✓ Guru Darul Ulum dibuat: guru / admin`);
  } else {
    await prisma.user.update({
      where: { id: teacher.id },
      data: { passwordHash: defaultAdminPassHash, role: UserRole.TEACHER },
    });
    console.log(`✓ Akun Guru Darul Ulum diperbarui: guru / admin`);
  }

  // 5. Kelas: Kelas X IPA 1
  let targetClass = await prisma.class.findFirst({
    where: { schoolId: school.id, name: 'Kelas X IPA 1' },
  });

  if (!targetClass) {
    targetClass = await prisma.class.create({
      data: {
        schoolId: school.id,
        name: 'Kelas X IPA 1',
        academicYear: '2026/2027',
      },
    });
    console.log(`✓ Kelas X IPA 1 dibuat`);
  }

  // 6. Akun Siswa (NISN: 123456, Password: solihin123)
  const studentIdentifier = '123456';
  let student = await prisma.user.findFirst({
    where: { schoolId: school.id, identifier: studentIdentifier },
  });

  if (!student) {
    student = await prisma.user.create({
      data: {
        schoolId: school.id,
        role: UserRole.STUDENT,
        identifier: studentIdentifier,
        passwordHash: studentPassHash,
        fullName: 'Reza Riyadhusolihin',
        isActive: true,
      },
    });

    await prisma.studentClass.create({
      data: {
        studentId: student.id,
        classId: targetClass.id,
      },
    });
    console.log(`✓ Akun Siswa dibuat: NISN ${studentIdentifier} / solihin123`);
  } else {
    await prisma.user.update({
      where: { id: student.id },
      data: { passwordHash: studentPassHash, fullName: 'Reza Riyadhusolihin' },
    });
    console.log(`✓ Akun Siswa diperbarui: NISN ${studentIdentifier} / solihin123`);
  }

  // 7. Mata Pelajaran: Matematika
  let subject = await prisma.subject.findFirst({
    where: { schoolId: school.id, code: 'MTK-10' },
  });

  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        schoolId: school.id,
        code: 'MTK-10',
        name: 'Matematika',
      },
    });
    console.log(`✓ Mapel Matematika dibuat`);
  }

  // 8. Bank Soal & Butir Soal
  let bank = await prisma.questionBank.findFirst({
    where: { schoolId: school.id, subjectId: subject.id },
  });

  if (!bank) {
    bank = await prisma.questionBank.create({
      data: {
        schoolId: school.id,
        subjectId: subject.id,
        createdById: teacher.id,
        title: 'Bank Soal UTS Matematika Semester 1',
        description: 'Kumpulan soal pilihan ganda dan essay UTS',
      },
    });

    await prisma.question.create({
      data: {
        bankId: bank.id,
        type: QuestionType.SINGLE_CHOICE,
        content: 'Perhatikan gambar berikut! Berapa luas daerah yang ditunjukkan pada segitiga siku-siku dengan alas 8 cm dan tinggi 8 cm?',
        points: 50.0,
        options: [
          { id: 'A', text: '24 cm²', isCorrect: false },
          { id: 'B', text: '32 cm²', isCorrect: true },
          { id: 'C', text: '40 cm²', isCorrect: false },
          { id: 'D', text: '48 cm²', isCorrect: false },
        ],
      },
    });

    await prisma.question.create({
      data: {
        bankId: bank.id,
        type: QuestionType.ESSAY,
        content: 'Jelaskan rumus dan langkah pembuktian Teorema Pythagoras pada segitiga siku-siku!',
        points: 50.0,
      },
    });
    console.log(`✓ Soal ujian dibuat`);
  }

  // 9. Jadwal Ujian UTS
  let exam = await prisma.exam.findFirst({
    where: { schoolId: school.id, token: 'EXM24' },
  });

  if (!exam) {
    const now = new Date();
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + 30);

    exam = await prisma.exam.create({
      data: {
        schoolId: school.id,
        subjectId: subject.id,
        title: 'Ujian Tengah Semester',
        description: 'Ujian Tengah Semester Ganjil Kelas X Matematika',
        token: 'EXM24',
        proctorPin: '123456',
        durationMinutes: 60,
        startTime: now,
        endTime: endTime,
        randomizeQuestions: true,
        randomizeOptions: true,
        status: ExamStatus.PUBLISHED,
        examClasses: {
          create: [{ classId: targetClass.id }],
        },
      },
    });
    console.log(`✓ Jadwal Ujian UTS Matematika dibuat (Token: EXM24, PIN: 123456)`);
  }

  console.log('=== Seeding Selesai Sukses! ===');
}

runSeed()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
