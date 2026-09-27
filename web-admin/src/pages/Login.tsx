import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { mockDb } from '../services/mockDb';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShieldCheck, Lock, User, School, ArrowRight, Sparkles, AlertCircle, GraduationCap, Sun, Moon } from 'lucide-react';
import logoImg from '../assets/logo.png';

type LoginRoleTab = 'SUPERADMIN' | 'SCHOOL_ADMIN' | 'TEACHER';

export const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LoginRoleTab>('SUPERADMIN');
  const { theme, toggleTheme } = useTheme();

  // Input states
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [schoolCode, setSchoolCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const switchTab = (tab: LoginRoleTab) => {
    setActiveTab(tab);
    setErrorMsg('');

    if (tab === 'SUPERADMIN') {
      setIdentifier('admin');
      setPassword('admin');
      setSchoolCode('');
    } else if (tab === 'SCHOOL_ADMIN') {
      setIdentifier('admin');
      setPassword('admin');
      setSchoolCode('DARULULUM');
    } else if (tab === 'TEACHER') {
      setIdentifier('guru');
      setPassword('admin');
      setSchoolCode('DARULULUM');
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg('Username / ID dan Password wajib diisi.');
      return;
    }

    if (activeTab !== 'SUPERADMIN' && !schoolCode) {
      setErrorMsg('Kode Sekolah wajib diisi untuk Admin Sekolah & Guru.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/login', {
        identifier,
        password,
        schoolCode: activeTab === 'SUPERADMIN' ? undefined : schoolCode,
      });

      if (res.data.success) {
        login(res.data.data);
        const role = res.data.data.user.role;
        if (role === 'SUPERADMIN') {
          navigate('/superadmin/dashboard');
        } else if (role === 'SCHOOL_ADMIN') {
          navigate('/school/dashboard');
        } else if (role === 'TEACHER') {
          navigate('/teacher/dashboard');
        } else {
          navigate('/');
        }
        return;
      }
    } catch (err: any) {
      // 1. Fallback Superadmin
      if (
        (activeTab === 'SUPERADMIN' && identifier === 'admin' && password === 'admin') ||
        (activeTab === 'SUPERADMIN' && identifier === 'superadmin')
      ) {
        login({
          token: 'mock-superadmin-token',
          user: {
            id: 'superadmin-local',
            fullName: 'Super Administrator Examora',
            role: 'SUPERADMIN',
            identifier: 'admin',
          },
        });
        navigate('/superadmin/dashboard');
        return;
      }

      // 2. Fallback Admin Sekolah
      if (activeTab === 'SCHOOL_ADMIN' && identifier === 'admin' && password === 'admin') {
        login({
          token: 'mock-school-admin-token',
          user: {
            id: 'schooladmin-local',
            fullName: 'Admin SMA Darul Ulum',
            role: 'SCHOOL_ADMIN',
            identifier: 'admin',
            schoolId: 'darul-ulum',
          },
          school: {
            id: 'darul-ulum',
            code: schoolCode || 'DARULULUM',
            name: 'SMA Darul Ulum',
          },
        });
        navigate('/school/dashboard');
        return;
      }

      // 3. Fallback Guru (Cek database lokal mockDb untuk guru yang baru ditambahkan!)
      if (activeTab === 'TEACHER') {
        const found = mockDb.findTeacher(identifier, password);
        if (found) {
          login({
            token: `mock-teacher-${found.id}`,
            user: {
              id: found.id,
              fullName: found.fullName,
              role: 'TEACHER',
              identifier: found.identifier,
              schoolId: 'darul-ulum',
              subjectId: found.subjectId,
              subject: found.subject,
            },
            school: {
              id: 'darul-ulum',
              code: schoolCode || 'DARULULUM',
              name: 'SMA Darul Ulum',
            },
          });
          navigate('/teacher/dashboard');
          return;
        }
      }

      setErrorMsg('Akun tidak ditemukan atau password salah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-[#080C15] bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 relative transition-colors duration-200">
      {/* Top Bar Switcher (Day/Night Theme) */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Ganti ke Mode Siang' : 'Ganti ke Mode Malam'}
          className="p-2.5 rounded-xl border dark:border-[#222F4C] border-slate-200 dark:bg-[#0E1424] bg-white shadow-sm text-slate-700 dark:text-yellow-400 hover:scale-105 transition flex items-center gap-2 text-xs font-bold"
        >
          {theme === 'dark' ? (
            <>
              <Sun size={16} />
              <span className="hidden sm:inline text-white">Mode Siang</span>
            </>
          ) : (
            <>
              <Moon size={16} className="text-slate-700" />
              <span className="hidden sm:inline text-slate-800">Mode Malam</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-block relative mb-3">
            <img src={logoImg} alt="Examora Logo" className="w-16 h-16 sm:w-20 sm:h-20 relative mx-auto object-contain drop-shadow-md" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold dark:text-white text-slate-900 tracking-tight">
            Portal Manajemen Examora
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pilih portal peran Anda untuk masuk ke sistem</p>
        </div>

        {/* 3 Tab Switcher */}
        <div className="p-1.5 rounded-2xl dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200 grid grid-cols-3 gap-1.5 mb-5 shadow-sm">
          <button
            type="button"
            onClick={() => switchTab('SUPERADMIN')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'SUPERADMIN'
                ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/40'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'SUPERADMIN' ? 'text-amber-500' : ''} />
            <span>Super Admin</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('SCHOOL_ADMIN')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'SCHOOL_ADMIN'
                ? 'bg-cyan-500/20 text-cyan-600 dark:text-[#00E5FF] border border-cyan-500/40'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <School size={14} className={activeTab === 'SCHOOL_ADMIN' ? 'text-cyan-500' : ''} />
            <span>Admin Sekolah</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('TEACHER')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'TEACHER'
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap size={14} className={activeTab === 'TEACHER' ? 'text-emerald-500' : ''} />
            <span>Guru</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl transition-colors">
          {/* Role Description Header */}
          <div className="mb-6 pb-4 border-b dark:border-[#222F4C] border-slate-100">
            {activeTab === 'SUPERADMIN' && (
              <div className="flex items-center gap-2.5 text-xs text-amber-500 dark:text-amber-400">
                <Sparkles size={16} />
                <span className="font-semibold">Login Pemilik Platform (Approval Sekolah & Kelola Sistem)</span>
              </div>
            )}
            {activeTab === 'SCHOOL_ADMIN' && (
              <div className="flex items-center gap-2.5 text-xs text-cyan-600 dark:text-cyan-400">
                <ShieldCheck size={16} />
                <span className="font-semibold">Login Operator Sekolah (Kelola Kelas, Akun Guru & Siswa)</span>
              </div>
            )}
            {activeTab === 'TEACHER' && (
              <div className="flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                <GraduationCap size={16} />
                <span className="font-semibold">Login Guru Pengampu (Bank Soal, Token Ujian & Rekap Nilai)</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-3">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Field Kode Sekolah (Hanya untuk Admin Sekolah & Guru) */}
            {activeTab !== 'SUPERADMIN' && (
              <div>
                <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 mb-1.5">Kode Sekolah / NPSN</label>
                <div className="relative">
                  <School size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: DARULULUM"
                    className="w-full pl-10 pr-4 py-3 dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 focus:border-cyan-500 rounded-xl text-sm dark:text-white text-slate-900 placeholder-slate-400 uppercase outline-none transition font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {/* Field Username / Identifier */}
            <div>
              <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 mb-1.5">
                {activeTab === 'SUPERADMIN'
                  ? 'Username Super Admin'
                  : activeTab === 'SCHOOL_ADMIN'
                  ? 'Username / Email Admin Sekolah'
                  : 'NIP / Username Guru'}
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-3 dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 focus:border-cyan-500 rounded-xl text-sm dark:text-white text-slate-900 placeholder-slate-400 outline-none transition font-medium"
                />
              </div>
            </div>

            {/* Field Password */}
            <div>
              <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 focus:border-cyan-500 rounded-xl text-sm dark:text-white text-slate-900 placeholder-slate-400 outline-none transition"
                />
              </div>
            </div>

            {/* Button Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-3 py-3.5 px-4 font-extrabold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md ${
                activeTab === 'SUPERADMIN'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-900'
                  : activeTab === 'SCHOOL_ADMIN'
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>
                    Masuk sebagai {activeTab === 'SUPERADMIN' ? 'Super Admin' : activeTab === 'SCHOOL_ADMIN' ? 'Admin Sekolah' : 'Guru'}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Info Box */}
          <div className="mt-5 p-3 rounded-xl dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Akun Contoh Siap Uji:</span>
            <span className="font-mono dark:text-white text-slate-800 font-bold">
              {activeTab === 'SUPERADMIN' && 'admin / admin'}
              {activeTab === 'SCHOOL_ADMIN' && 'admin / admin (DARULULUM)'}
              {activeTab === 'TEACHER' && 'guru / admin (atau akun guru baru yang Anda buat)'}
            </span>
          </div>
        </div>

        {/* Register School Link */}
        <div className="text-center mt-6">
          <Link
            to="/register-school"
            className="text-xs font-semibold text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-[#00E5FF] transition inline-flex items-center gap-1.5"
          >
            <span>Sekolah Anda belum terdaftar di Examora?</span>
            <span className="text-cyan-600 dark:text-[#00E5FF] underline font-bold">Daftar Mandiri</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
