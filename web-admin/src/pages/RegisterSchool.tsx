import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-[#080C15] flex flex-col justify-center items-center p-6 relative">
      <div className="w-full max-w-xl relative z-10">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-[#00E5FF] mb-6 transition"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Halaman Login</span>
        </Link>

        {isSuccess ? (
          <div className="bg-[#0E1424] border border-[#222F4C] p-10 rounded-3xl text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Pendaftaran Berhasil Dikirim!</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
              Sekolah <span className="text-white font-semibold">{name}</span> (Kode: {code}) telah masuk ke sistem dengan status <span className="text-amber-400 font-bold">PENDING</span>.
              Super Administrator akan memverifikasi dan menyetujui akun sekolah Anda dalam waktu singkat.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center py-3.5 px-8 bg-gradient-to-r from-[#00E5FF] to-[#0284C7] text-[#080C15] font-extrabold text-sm rounded-xl transition shadow-[0_0_20px_rgba(0,229,255,0.3)]"
            >
              Kembali ke Login
            </Link>
          </div>
        ) : (
          <div className="bg-[#0E1424] border border-[#222F4C] p-8 rounded-3xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <img src={logoImg} alt="Examora" className="w-12 h-12 object-contain" />
              <div>
                <h2 className="text-xl font-extrabold text-white">Daftarkan Sekolah Baru</h2>
                <p className="text-xs text-slate-400">Bergabung dengan platform ujian digital multi-sekolah Examora</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Resmi Sekolah</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: SMA Negeri 1 Bandung"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kode Unik / NPSN</label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: SMAN1BDG"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 uppercase outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Operator / Admin Sekolah</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="Nama lengkap penanggung jawab"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Administrator</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@sekolah.sch.id"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">No. WhatsApp / Telepon</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Buat Password Admin Sekolah</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-[#00E5FF] to-[#0284C7] text-[#080C15] font-extrabold text-sm rounded-xl transition shadow-[0_0_20px_rgba(0,229,255,0.3)] flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-[#080C15] border-t-transparent rounded-full animate-spin"></div>
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
