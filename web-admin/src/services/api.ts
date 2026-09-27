import axios from 'axios';
import { mockDb } from './mockDb';

const isLocalDev =
  typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' &&
  window.location.port === '5173';

const DEFAULT_API_URL = isLocalDev ? 'http://43.157.203.140:3000/api' : '/api';

export const API_URL = localStorage.getItem('examora_api_url') || DEFAULT_API_URL;

export const rawApi = axios.create({
  baseURL: API_URL,
  timeout: 4000,
});

rawApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('examora_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper for Mock DB handling
function handleMockRoute(method: string, url: string, data?: any) {
  const cleanUrl = url.split('?')[0];

  // 1. Classes
  if (cleanUrl === '/school/classes') {
    if (method === 'get') return { success: true, data: mockDb.getClasses() };
    if (method === 'post') return { success: true, message: 'Kelas berhasil dibuat.', data: mockDb.addClass(data) };
  }
  if (cleanUrl.startsWith('/school/classes/') && method === 'delete') {
    const id = cleanUrl.replace('/school/classes/', '');
    mockDb.deleteClass(id);
    return { success: true, message: 'Kelas berhasil dihapus.' };
  }

  // 2. Subjects
  if (cleanUrl === '/school/subjects') {
    if (method === 'get') return { success: true, data: mockDb.getSubjects() };
    if (method === 'post') return { success: true, message: 'Mata pelajaran berhasil ditambahkan.', data: mockDb.addSubject(data) };
  }
  if (cleanUrl.startsWith('/school/subjects/') && method === 'delete') {
    const id = cleanUrl.replace('/school/subjects/', '');
    mockDb.deleteSubject(id);
    return { success: true, message: 'Mata pelajaran berhasil dihapus.' };
  }

  // 3. Teachers
  if (cleanUrl === '/school/teachers') {
    if (method === 'get') return { success: true, data: mockDb.getTeachers() };
    if (method === 'post') return { success: true, message: 'Akun guru berhasil dibuat.', data: mockDb.addTeacher(data) };
  }
  if (cleanUrl.startsWith('/school/teachers/') && method === 'delete') {
    const id = cleanUrl.replace('/school/teachers/', '');
    mockDb.deleteTeacher(id);
    return { success: true, message: 'Akun guru berhasil dihapus.' };
  }
  if (cleanUrl === '/school/teachers/import-excel') {
    return {
      success: true,
      message: 'Berhasil mengimpor 3 akun guru.',
      data: { importedCount: 3, skippedCount: 0 },
    };
  }

  // 4. Question Banks
  if (cleanUrl === '/questions/banks') {
    if (method === 'get') return { success: true, data: mockDb.getQuestionBanks() };
    if (method === 'post') return { success: true, message: 'Bank soal berhasil dibuat.', data: mockDb.addQuestionBank(data) };
  }
  if (cleanUrl.startsWith('/questions/banks/') && cleanUrl.endsWith('/questions') && method === 'post') {
    const bankId = cleanUrl.replace('/questions/banks/', '').replace('/questions', '');
    const q = mockDb.addQuestionToBank(bankId, data);
    return { success: true, message: 'Butir soal berhasil ditambahkan.', data: q };
  }
  if (cleanUrl.startsWith('/questions/banks/') && method === 'get') {
    const bankId = cleanUrl.replace('/questions/banks/', '');
    return { success: true, data: mockDb.getBankById(bankId) };
  }
  if (cleanUrl.startsWith('/questions/questions/') && method === 'delete') {
    const qId = cleanUrl.replace('/questions/questions/', '');
    mockDb.deleteQuestion(qId);
    return { success: true, message: 'Butir soal berhasil dihapus.' };
  }
  if (cleanUrl === '/questions/upload-media' && method === 'post') {
    return {
      success: true,
      message: 'Gambar berhasil diunggah.',
      data: { url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600' },
    };
  }

  // 5. Exams
  if (cleanUrl === '/exams/list' && method === 'get') {
    return { success: true, data: mockDb.getExams() };
  }
  if (cleanUrl === '/exams/create' && method === 'post') {
    return { success: true, message: 'Jadwal ujian berhasil dibuat.', data: mockDb.addExam(data) };
  }
  if (cleanUrl.startsWith('/exams/') && cleanUrl.endsWith('/recap') && method === 'get') {
    const examId = cleanUrl.replace('/exams/', '').replace('/recap', '');
    return { success: true, data: mockDb.getExamById(examId) };
  }
  if (cleanUrl.startsWith('/exams/') && cleanUrl.endsWith('/reset-student-session') && method === 'post') {
    const examId = cleanUrl.replace('/exams/', '').replace('/reset-student-session', '');
    mockDb.resetStudentSession(examId, data?.studentId);
    return { success: true, message: 'Sesi siswa berhasil direset.' };
  }

  // 6. Superadmin
  if (cleanUrl === '/superadmin/schools') {
    if (method === 'get') return { success: true, data: mockDb.getSchools() };
  }
  if (cleanUrl.startsWith('/superadmin/schools/') && cleanUrl.endsWith('/status') && method === 'patch') {
    const schoolId = cleanUrl.replace('/superadmin/schools/', '').replace('/status', '');
    const updated = mockDb.updateSchoolStatus(schoolId, data?.status);
    return { success: true, message: 'Status sekolah berhasil diperbarui.', data: updated };
  }
  if (cleanUrl === '/superadmin/metrics' && method === 'get') {
    return { success: true, data: mockDb.getMetrics() };
  }

  return null;
}

// Resilient API Wrapper: Calls server first; if mock session or network/auth fails, falls back to MockDB
export const api = {
  get: async (url: string, config?: any) => {
    const token = localStorage.getItem('examora_token');
    const isMock = !token || token.startsWith('mock-');

    if (!isMock) {
      try {
        const res = await rawApi.get(url, config);
        if (res.data && res.data.success) return res;
      } catch (_) {
        // Fallback below
      }
    }

    const mockRes = handleMockRoute('get', url);
    if (mockRes) return { data: mockRes };
    return rawApi.get(url, config);
  },

  post: async (url: string, data?: any, config?: any) => {
    const token = localStorage.getItem('examora_token');
    const isMock = !token || token.startsWith('mock-');

    if (!isMock) {
      try {
        const res = await rawApi.post(url, data, config);
        if (res.data && res.data.success) return res;
      } catch (_) {
        // Fallback below
      }
    }

    const mockRes = handleMockRoute('post', url, data);
    if (mockRes) return { data: mockRes };
    return rawApi.post(url, data, config);
  },

  patch: async (url: string, data?: any, config?: any) => {
    const token = localStorage.getItem('examora_token');
    const isMock = !token || token.startsWith('mock-');

    if (!isMock) {
      try {
        const res = await rawApi.patch(url, data, config);
        if (res.data && res.data.success) return res;
      } catch (_) {
        // Fallback below
      }
    }

    const mockRes = handleMockRoute('patch', url, data);
    if (mockRes) return { data: mockRes };
    return rawApi.patch(url, data, config);
  },

  delete: async (url: string, config?: any) => {
    const token = localStorage.getItem('examora_token');
    const isMock = !token || token.startsWith('mock-');

    if (!isMock) {
      try {
        const res = await rawApi.delete(url, config);
        if (res.data && res.data.success) return res;
      } catch (_) {
        // Fallback below
      }
    }

    const mockRes = handleMockRoute('delete', url);
    if (mockRes) return { data: mockRes };
    return rawApi.delete(url, config);
  },
};
