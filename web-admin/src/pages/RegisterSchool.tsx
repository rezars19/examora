import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Building2, User, Mail, Phone, Lock, Hash, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import logoImg from '../assets/logo.png';

export const RegisterSchool: React.FC = () => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !operatorName || !email || !password) {
      setErrorMsg('Semua kolom wajib diisi kecuali nomor telepon.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/register-school', {
        name,
        code: code.toUpperCase(),
        operatorName,
        email,
        phone: phone || undefined,
        password,
      });

      if (res.data.success) {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Pendaftaran gagal. Periksa data kembali.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen dark:bg-[#080C15] bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 relative transition-colors duration-200">
      <div className="w-full max-w-xl relative z-10">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-[#00E5FF] mb-6 transition"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Halaman Login</span>
        </Link>

        {isSuccess ? (
          <div className="dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200 p-8 sm:p-10 rounded-3xl text-center shadow-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-2xl font-bold dark:text-white text-slate-800 mb-2">Pendaftaran Berhasil Dikirim!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
              Sekolah <span className="font-semibold dark:text-white text-slate-800">{name}</span> (Kode: {code}) telah masuk ke sistem dengan status <span className="text-amber-500 font-bold">PENDING</span>.
              Super Administrator akan memverifikasi dan menyetujui akun sekolah Anda dalam waktu singkat.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center py-3.5 px-8 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-extrabold text-sm rounded-xl transition shadow-md"
            >
              Kembali ke Login
            </Link>
          </div>
        ) : (
          <div className="dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <img src={logoImg} alt="Examora" className="w-12 h-12 object-contain" />
              <div>
                <h2 className="text-xl font-extrabold dark:text-white text-slate-800">Daftarkan Sekolah Baru</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Bergabung dengan platform ujian digital multi-sekolah Examora</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-3">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 mb-1.5">Nama Resmi Sekolah</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: SMA Negeri 1 Bandung"
                      className="w-full pl-10 pr-4 py-2.5 dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 focus:border-cyan-500 rounded-xl text-sm dark:text-white text-slate-900 placeholder-slate-400 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 mb-1.5">Kode Unik / NPSN</label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: SMAN1BDG"
                      className="w-full pl-10 pr-4 py-2.5 dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 focus:border-cyan-500 rounded-xl text-sm dark:text-white text-slate-900 placeholder-slate-400 uppercase outline-none transition font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 mb-1.5">Nama Operator / Admin Sekolah</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="Nama lengkap penanggung jawab"
                    className="w-full pl-10 pr-4 py-2.5 dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 focus:border-cyan-500 rounded-xl text-sm dark:text-white text-slate-900 placeholder-slate-400 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 mb-1.5">Email Administrator</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@sekolah.sch.id"
                      className="w-full pl-10 pr-4 py-2.5 dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 focus:border-cyan-500 rounded-xl text-sm dark:text-white text-slate-900 placeholder-slate-400 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 mb-1.5">No. WhatsApp / Telepon</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full pl-10 pr-4 py-2.5 dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 focus:border-cyan-500 rounded-xl text-sm dark:text-white text-slate-900 placeholder-slate-400 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 mb-1.5">Buat Password Admin Sekolah</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-4 py-2.5 dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 focus:border-cyan-500 rounded-xl text-sm dark:text-white text-slate-900 placeholder-slate-400 outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-extrabold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Kirim Pengajuan Pendaftaran</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
