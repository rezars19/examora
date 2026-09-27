// Local database storage for offline resilience and instant local preview

const STORAGE_KEY_CLASSES = 'examora_db_classes';
const STORAGE_KEY_SUBJECTS = 'examora_db_subjects';
const STORAGE_KEY_TEACHERS = 'examora_db_teachers';
const STORAGE_KEY_BANKS = 'examora_db_question_banks';
const STORAGE_KEY_EXAMS = 'examora_db_exams';
const STORAGE_KEY_SCHOOLS = 'examora_db_schools';

export const mockDb = {
  // --- KELAS ---
  getClasses: () => {
    const raw = localStorage.getItem(STORAGE_KEY_CLASSES);
    if (raw) return JSON.parse(raw);
    const initial = [
      { id: 'c-1', name: 'Kelas X IPA 1', academicYear: '2026/2027', _count: { students: 32 } },
      { id: 'c-2', name: 'Kelas X IPA 2', academicYear: '2026/2027', _count: { students: 30 } },
      { id: 'c-3', name: 'Kelas X IPS 1', academicYear: '2026/2027', _count: { students: 28 } },
      { id: 'c-4', name: 'Kelas XI IPA 1', academicYear: '2026/2027', _count: { students: 31 } },
    ];
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(initial));
    return initial;
  },

  addClass: (data: { name: string; academicYear: string }) => {
    const list = mockDb.getClasses();
    const newClass = {
      id: `c-${Date.now()}`,
      name: data.name,
      academicYear: data.academicYear,
      _count: { students: 0 },
    };
    list.unshift(newClass);
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(list));
    return newClass;
  },

  deleteClass: (id: string) => {
    const list = mockDb.getClasses().filter((c: any) => c.id !== id);
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(list));
    return true;
  },

  // --- MATA PELAJARAN ---
  getSubjects: () => {
    const raw = localStorage.getItem(STORAGE_KEY_SUBJECTS);
    if (raw) return JSON.parse(raw);
    const initial = [
      { id: 'sub-1', code: 'MTK', name: 'Matematika' },
      { id: 'sub-2', code: 'BIN', name: 'Bahasa Indonesia' },
      { id: 'sub-3', code: 'BIG', name: 'Bahasa Inggris' },
      { id: 'sub-4', code: 'FIS', name: 'Fisika' },
      { id: 'sub-5', code: 'PAI', name: 'Pendidikan Agama Islam' },
    ];
    localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(initial));
    return initial;
  },

  addSubject: (data: { code: string; name: string }) => {
    const list = mockDb.getSubjects();
    const newSub = {
      id: `sub-${Date.now()}`,
      code: data.code.toUpperCase(),
      name: data.name,
    };
    list.unshift(newSub);
    localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(list));
    return newSub;
  },

  deleteSubject: (id: string) => {
    const list = mockDb.getSubjects().filter((s: any) => s.id !== id);
    localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(list));
    return true;
  },

  // --- GURU ---
  getTeachers: () => {
    const raw = localStorage.getItem(STORAGE_KEY_TEACHERS);
    if (raw) return JSON.parse(raw);
    const initial = [
      {
        id: 't-1',
        identifier: 'guru',
        fullName: 'Drs. H. Ahmad Solihin, M.Pd.',
        subjectId: 'sub-1',
        subject: { id: 'sub-1', code: 'MTK', name: 'Matematika' },
        isActive: true,
      },
      {
        id: 't-2',
        identifier: '198503152010012001',
        fullName: 'Siti Rahmawati, S.Si., M.Pd.',
        subjectId: 'sub-2',
        subject: { id: 'sub-2', code: 'BIN', name: 'Bahasa Indonesia' },
        isActive: true,
      },
      {
        id: 't-3',
        identifier: '199008202015021003',
        fullName: 'Bambang Triatmojo, S.Kom.',
        subjectId: 'sub-4',
        subject: { id: 'sub-4', code: 'FIS', name: 'Fisika' },
        isActive: true,
      },
    ];
    localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(initial));
    return initial;
  },

  addTeacher: (data: { identifier: string; fullName: string; subjectId?: string }) => {
    const list = mockDb.getTeachers();
    const subjects = mockDb.getSubjects();
    const matchedSubject = subjects.find((s: any) => s.id === data.subjectId);

    const newTeacher = {
      id: `t-${Date.now()}`,
      identifier: data.identifier,
      fullName: data.fullName,
      subjectId: data.subjectId || null,
      subject: matchedSubject || null,
      isActive: true,
    };
    list.unshift(newTeacher);
    localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(list));
    return newTeacher;
  },

  deleteTeacher: (id: string) => {
    const list = mockDb.getTeachers().filter((t: any) => t.id !== id);
    localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(list));
    return true;
  },

  // --- BANK SOAL & PERTANYAAN ---
  getQuestionBanks: () => {
    const raw = localStorage.getItem(STORAGE_KEY_BANKS);
    if (raw) return JSON.parse(raw);
    const initial = [
      {
        id: 'bank-1',
        title: 'Bank Soal UTS Matematika Semester 1',
        subjectId: 'sub-1',
        subject: { id: 'sub-1', code: 'MTK', name: 'Matematika' },
        _count: { questions: 2 },
        questions: [
          {
            id: 'q-1',
            type: 'SINGLE_CHOICE',
            points: 50,
            content: 'Perhatikan segitiga siku-siku berikut dengan alas 8 cm dan tinggi 8 cm. Berapa luas daerah segitiga tersebut?',
            options: [
              { id: 'A', text: '24 cm²', isCorrect: false },
              { id: 'B', text: '32 cm²', isCorrect: true },
              { id: 'C', text: '40 cm²', isCorrect: false },
              { id: 'D', text: '48 cm²', isCorrect: false },
            ],
          },
          {
            id: 'q-2',
            type: 'ESSAY',
            points: 50,
            content: 'Jelaskan rumus dan langkah pembuktian Teorema Pythagoras pada segitiga siku-siku!',
            options: [],
          },
        ],
      },
      {
        id: 'bank-2',
        title: 'Bank Soal Fisika Gelombang & Optik',
        subjectId: 'sub-4',
        subject: { id: 'sub-4', code: 'FIS', name: 'Fisika' },
        _count: { questions: 1 },
        questions: [
          {
            id: 'q-3',
            type: 'SINGLE_CHOICE',
            points: 100,
            content: 'Berapakah cepat rambat gelombang jika frekuensi 50 Hz dan panjang gelombang 2 meter?',
            options: [
              { id: 'A', text: '25 m/s', isCorrect: false },
              { id: 'B', text: '50 m/s', isCorrect: false },
              { id: 'C', text: '100 m/s', isCorrect: true },
              { id: 'D', text: '200 m/s', isCorrect: false },
            ],
          },
        ],
      },
    ];
    localStorage.setItem(STORAGE_KEY_BANKS, JSON.stringify(initial));
    return initial;
  },

  addQuestionBank: (data: { title: string; subjectId: string }) => {
    const list = mockDb.getQuestionBanks();
    const subjects = mockDb.getSubjects();
    const sub = subjects.find((s: any) => s.id === data.subjectId) || { id: data.subjectId, name: 'Mata Pelajaran', code: 'MAPEL' };

    const newBank = {
      id: `bank-${Date.now()}`,
      title: data.title,
      subjectId: data.subjectId,
      subject: sub,
      _count: { questions: 0 },
      questions: [],
    };
    list.unshift(newBank);
    localStorage.setItem(STORAGE_KEY_BANKS, JSON.stringify(list));
    return newBank;
  },

  getBankById: (bankId: string) => {
    const list = mockDb.getQuestionBanks();
    return list.find((b: any) => b.id === bankId) || null;
  },

  addQuestionToBank: (bankId: string, questionData: any) => {
    const list = mockDb.getQuestionBanks();
    const bank = list.find((b: any) => b.id === bankId);
    if (!bank) return null;

    const newQ = {
      id: `q-${Date.now()}`,
      type: questionData.type,
      points: Number(questionData.points) || 1,
      content: questionData.content,
      mediaUrl: questionData.mediaUrl || null,
      options: questionData.options || [],
    };

    if (!bank.questions) bank.questions = [];
    bank.questions.push(newQ);
    bank._count = { questions: bank.questions.length };

    localStorage.setItem(STORAGE_KEY_BANKS, JSON.stringify(list));
    return newQ;
  },

  deleteQuestion: (qId: string) => {
    const list = mockDb.getQuestionBanks();
    for (const b of list) {
      if (b.questions) {
        b.questions = b.questions.filter((q: any) => q.id !== qId);
        b._count = { questions: b.questions.length };
      }
    }
    localStorage.setItem(STORAGE_KEY_BANKS, JSON.stringify(list));
    return true;
  },

  // --- JADWAL UJIAN ---
  getExams: () => {
    const raw = localStorage.getItem(STORAGE_KEY_EXAMS);
    if (raw) return JSON.parse(raw);
    const initial = [
      {
        id: 'exam-1',
        title: 'Ujian Tengah Semester',
        subject: { name: 'Matematika', code: 'MTK' },
        durationMinutes: 60,
        token: 'EXM24',
        proctorPin: '123456',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        examClasses: [{ class: { name: 'Kelas X IPA 1' } }],
        attempts: [
          {
            id: 'att-1',
            studentId: 'std-1',
            status: 'SUBMITTED',
            violationCount: 0,
            score: 95.0,
            student: {
              fullName: 'Reza Riyadhusolihin',
              identifier: '123456',
              studentClasses: [{ class: { name: 'Kelas X IPA 1' } }],
            },
          },
          {
            id: 'att-2',
            studentId: 'std-2',
            status: 'IN_PROGRESS',
            violationCount: 1,
            score: null,
            student: {
              fullName: 'Ahmad Fauzi',
              identifier: '123457',
              studentClasses: [{ class: { name: 'Kelas X IPA 1' } }],
            },
          },
        ],
      },
    ];
    localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(initial));
    return initial;
  },

  addExam: (data: { title: string; subjectId: string; durationMinutes: number; classIds: string[]; startTime: string; endTime: string }) => {
    const list = mockDb.getExams();
    const subjects = mockDb.getSubjects();
    const classes = mockDb.getClasses();

    const sub = subjects.find((s: any) => s.id === data.subjectId) || { name: 'Mata Pelajaran', code: 'MAPEL' };
    const targetClasses = classes.filter((c: any) => data.classIds.includes(c.id)).map((c: any) => ({ class: { name: c.name } }));

    // Generate random 5-6 char token & PIN
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    const proctorPin = Math.floor(100000 + Math.random() * 900000).toString();

    const newExam = {
      id: `exam-${Date.now()}`,
      title: data.title,
      subject: sub,
      durationMinutes: data.durationMinutes,
      token,
      proctorPin,
      startTime: data.startTime,
      endTime: data.endTime,
      examClasses: targetClasses.length > 0 ? targetClasses : [{ class: { name: 'Semua Kelas' } }],
      attempts: [],
    };

    list.unshift(newExam);
    localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(list));
    return newExam;
  },

  getExamById: (examId: string) => {
    const list = mockDb.getExams();
    return list.find((e: any) => e.id === examId) || null;
  },

  resetStudentSession: (examId: string, studentId: string) => {
    const list = mockDb.getExams();
    const exam = list.find((e: any) => e.id === examId);
    if (exam && exam.attempts) {
      const att = exam.attempts.find((a: any) => a.studentId === studentId);
      if (att) {
        att.status = 'IN_PROGRESS';
        att.violationCount = 0;
      }
    }
    localStorage.setItem(STORAGE_KEY_EXAMS, JSON.stringify(list));
    return true;
  },

  // --- SEKOLAH (SUPERADMIN) ---
  getSchools: () => {
    const raw = localStorage.getItem(STORAGE_KEY_SCHOOLS);
    if (raw) return JSON.parse(raw);
    const initial = [
      {
        id: 'sch-1',
        name: 'SMA Darul Ulum',
        code: 'DARULULUM',
        operatorName: 'Operator Darul Ulum',
        email: 'info@darululum.sch.id',
        phone: '08123456789',
        status: 'ACTIVE',
        _count: { classes: 4, users: 35, exams: 2 },
      },
      {
        id: 'sch-2',
        name: 'SMA Bintang Harapan',
        code: 'SMABH',
        operatorName: 'Budi Santoso',
        email: 'admin@bintangharapan.sch.id',
        phone: '085712345678',
        status: 'PENDING',
        _count: { classes: 0, users: 1, exams: 0 },
      },
      {
        id: 'sch-3',
        name: 'SMK Teknologi Jakarta',
        code: 'SMKTJKT',
        operatorName: 'Hendro Wijaya',
        email: 'smkt@jakarta.sch.id',
        phone: '081298765432',
        status: 'ACTIVE',
        _count: { classes: 6, users: 48, exams: 5 },
      },
    ];
    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(initial));
    return initial;
  },

  updateSchoolStatus: (schoolId: string, status: string) => {
    const list = mockDb.getSchools();
    const school = list.find((s: any) => s.id === schoolId);
    if (school) {
      school.status = status;
    }
    localStorage.setItem(STORAGE_KEY_SCHOOLS, JSON.stringify(list));
    return school;
  },

  getMetrics: () => {
    const schools = mockDb.getSchools();
    const teachers = mockDb.getTeachers();
    const pending = schools.filter((s: any) => s.status === 'PENDING').length;
    const active = schools.filter((s: any) => s.status === 'ACTIVE').length;

    return {
      schools: { total: schools.length, pending, active },
      users: { teachers: teachers.length, students: 640 },
      exams: { total: 8 },
    };
  },
};
