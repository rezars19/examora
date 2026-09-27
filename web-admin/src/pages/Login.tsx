import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, User, School, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import logoImg from '../assets/logo.png';

export const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg('Identifier/Username dan Password wajib diisi.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/login', {
        identifier,
        password,
        schoolCode: schoolCode || undefined,
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
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Login gagal. Periksa koneksi ke server VPS.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick preset autofill helper
  const setPreset = (id: string, pass: string, code: string = '') => {
    setIdentifier(id);
    setPassword(pass);
    setSchoolCode(code);
  };

  return (
    <div className="min-h-screen bg-[#080C15] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00E5FF]/10 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[#2563EB]/15 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-block relative mb-3">
            <div className="absolute inset-0 bg-[#00E5FF] blur-xl opacity-40 rounded-full"></div>
            <img src={logoImg} alt="Examora Logo" className="w-20 h-20 relative mx-auto object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Examora Admin</h1>
          <p className="text-sm text-slate-400 mt-1">Platform Manajemen Ujian Digital Terpadu</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0E1424] border border-[#222F4C] p-8 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username / Email / NIP
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: superadmin atau NIP guru"
                  className="w-full pl-10 pr-4 py-3 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kode Sekolah <span className="text-slate-500 font-normal">(Opsional jika Super Admin)</span>
              </label>
              <div className="relative">
                <School size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: DARULULUM"
                  className="w-full pl-10 pr-4 py-3 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 uppercase outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-[#00E5FF] to-[#0284C7] hover:from-[#00cce6] hover:to-[#0274b0] text-[#080C15] font-extrabold text-sm rounded-xl transition shadow-[0_0_20px_rgba(0,229,255,0.3)] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#080C15] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Masuk Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick presets for testing */}
          <div className="mt-6 pt-5 border-t border-[#222F4C]">
            <p className="text-[11px] text-slate-400 font-semibold mb-2.5 text-center">Akun Akses Cepat:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreset('superadmin', 'AdminExamora2026!')}
                className="p-2 rounded-lg bg-[#141C30] hover:bg-[#1A243D] border border-[#222F4C] text-[11px] text-amber-400 font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Sparkles size={12} />
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => setPreset('guru_mtk', 'solihin123', 'DARULULUM')}
                className="p-2 rounded-lg bg-[#141C30] hover:bg-[#1A243D] border border-[#222F4C] text-[11px] text-cyan-400 font-bold flex items-center justify-center gap-1.5 transition"
              >
                <ShieldCheck size={12} />
                Guru Darul Ulum
              </button>
            </div>
          </div>
        </div>

        {/* Register School Link */}
        <div className="text-center mt-6">
          <Link
            to="/register-school"
            className="text-xs font-semibold text-slate-400 hover:text-[#00E5FF] transition flex items-center justify-center gap-1.5"
          >
            <span>Sekolah Anda belum terdaftar?</span>
            <span className="text-[#00E5FF] underline">Daftarkan Sekolah Baru</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
