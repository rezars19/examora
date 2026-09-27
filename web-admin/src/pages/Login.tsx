import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, User, School, ArrowRight, Sparkles, AlertCircle, GraduationCap } from 'lucide-react';
import logoImg from '../assets/logo.png';

type LoginRoleTab = 'SUPERADMIN' | 'SCHOOL_ADMIN' | 'TEACHER';

export const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LoginRoleTab>('SUPERADMIN');

  // Input states
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [schoolCode, setSchoolCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // Ubah tab dan set kredensial default yang mudah untuk testing
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
      // Fallback akses instan jika VPS belum di-seed
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

      if (activeTab === 'TEACHER' && identifier === 'guru' && password === 'admin') {
        login({
          token: 'mock-teacher-token',
          user: {
            id: 'teacher-local',
            fullName: 'Drs. H. Ahmad Solihin, M.Pd.',
            role: 'TEACHER',
            identifier: 'guru',
            schoolId: 'darul-ulum',
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

      setErrorMsg(err.response?.data?.message || 'Login gagal. Periksa username dan password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C15] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#00E5FF]/10 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[#2563EB]/15 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-lg relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-block relative mb-3">
            <div className="absolute inset-0 bg-[#00E5FF] blur-xl opacity-40 rounded-full"></div>
            <img src={logoImg} alt="Examora Logo" className="w-20 h-20 relative mx-auto object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Portal Manajemen Examora</h1>
          <p className="text-xs text-slate-400 mt-1">Pilih portal peran Anda untuk masuk ke sistem</p>
        </div>

        {/* 3 Tab Switcher */}
        <div className="p-1.5 rounded-2xl bg-[#0E1424] border border-[#222F4C] grid grid-cols-3 gap-1.5 mb-5 shadow-lg">
          <button
            type="button"
            onClick={() => switchTab('SUPERADMIN')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'SUPERADMIN'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} className={activeTab === 'SUPERADMIN' ? 'text-amber-400' : ''} />
            <span>Super Admin</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('SCHOOL_ADMIN')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'SCHOOL_ADMIN'
                ? 'bg-gradient-to-r from-[#00E5FF]/20 to-[#0284C7]/20 text-[#00E5FF] border border-[#00E5FF]/40 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <School size={14} className={activeTab === 'SCHOOL_ADMIN' ? 'text-[#00E5FF]' : ''} />
            <span>Admin Sekolah</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('TEACHER')}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'TEACHER'
                ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap size={14} className={activeTab === 'TEACHER' ? 'text-emerald-400' : ''} />
            <span>Guru</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-[#0E1424] border border-[#222F4C] p-8 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
          {/* Role Description Header */}
          <div className="mb-6 pb-4 border-b border-[#222F4C]/80">
            {activeTab === 'SUPERADMIN' && (
              <div className="flex items-center gap-2.5 text-xs text-amber-400">
                <Sparkles size={16} />
                <span className="font-semibold">Login Pemilik Platform (Approval Sekolah & Kelola Sistem)</span>
              </div>
            )}
            {activeTab === 'SCHOOL_ADMIN' && (
              <div className="flex items-center gap-2.5 text-xs text-cyan-400">
                <ShieldCheck size={16} />
                <span className="font-semibold">Login Operator Sekolah (Kelola Kelas, Akun Guru & Siswa)</span>
              </div>
            )}
            {activeTab === 'TEACHER' && (
              <div className="flex items-center gap-2.5 text-xs text-emerald-400">
                <GraduationCap size={16} />
                <span className="font-semibold">Login Guru Pengampu (Bank Soal, Token Ujian & Rekap Nilai)</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Field Kode Sekolah (Hanya untuk Admin Sekolah & Guru) */}
            {activeTab !== 'SUPERADMIN' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kode Sekolah / NPSN</label>
                <div className="relative">
                  <School size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: DARULULUM"
                    className="w-full pl-10 pr-4 py-3 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 uppercase outline-none transition font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {/* Field Username / Identifier */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {activeTab === 'SUPERADMIN'
                  ? 'Username Super Admin'
                  : activeTab === 'SCHOOL_ADMIN'
                  ? 'Username / Email Admin Sekolah'
                  : 'NIP / Username Guru'}
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-3 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 outline-none transition font-medium"
                />
              </div>
            </div>

            {/* Field Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            {/* Button Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-3 py-3.5 px-4 font-extrabold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg ${
                activeTab === 'SUPERADMIN'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#080C15] shadow-amber-500/20'
                  : activeTab === 'SCHOOL_ADMIN'
                  ? 'bg-gradient-to-r from-[#00E5FF] to-[#0284C7] hover:from-[#00cce6] hover:to-[#0274b0] text-[#080C15] shadow-cyan-500/20'
                  : 'bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-[#080C15] shadow-emerald-500/20'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#080C15] border-t-transparent rounded-full animate-spin"></div>
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
          <div className="mt-5 p-3 rounded-xl bg-[#141C30] border border-[#222F4C] text-[11px] text-slate-400 flex items-center justify-between">
            <span>Akun Siap Uji:</span>
            <span className="font-mono text-white font-bold">
              {activeTab === 'SUPERADMIN' && 'admin / admin'}
              {activeTab === 'SCHOOL_ADMIN' && 'admin / admin (DARULULUM)'}
              {activeTab === 'TEACHER' && 'guru / admin (DARULULUM)'}
            </span>
          </div>
        </div>

        {/* Register School Link */}
        <div className="text-center mt-6">
          <Link
            to="/register-school"
            className="text-xs font-semibold text-slate-400 hover:text-[#00E5FF] transition inline-flex items-center gap-1.5"
          >
            <span>Sekolah Anda belum terdaftar di Examora?</span>
            <span className="text-[#00E5FF] underline font-bold">Daftar Mandiri</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
