import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Users, ArrowRight, Building2, Sparkles, BookOpen } from 'lucide-react';

export const SchoolDashboard: React.FC = () => {
  const { user, school } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#0E1424] via-[#141C30] to-[#1E2B4D] border border-[#222F4C] relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-400/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-3">
            <Sparkles size={12} />
            <span>Portal Administrator Sekolah</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">{school?.name || 'Sekolah'}</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Kode Sekolah: <span className="font-mono text-cyan-400 font-bold">#{school?.code}</span> • Pengelola: {user?.fullName}
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0E1424] border border-[#222F4C] hover:border-[#00E5FF]/40 transition space-y-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Mata Pelajaran</h3>
            <p className="text-xs text-slate-400 mt-1">Daftar kurikulum resmi sekolah (Matematika, IPA, dll). Guru memilih dari sini.</p>
          </div>
          <Link
            to="/school/subjects"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#00E5FF] hover:underline"
          >
            <span>Kelola Mapel</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-[#0E1424] border border-[#222F4C] hover:border-[#00E5FF]/40 transition space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-400/10 border border-blue-400/30 text-blue-400 flex items-center justify-center">
            <GraduationCap size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Manajemen Kelas</h3>
            <p className="text-xs text-slate-400 mt-1">Buat dan atur daftar kelas (e.g. Kelas X IPA 1) untuk tempat registrasi siswa.</p>
          </div>
          <Link
            to="/school/classes"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#00E5FF] hover:underline"
          >
            <span>Kelola Kelas</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-[#0E1424] border border-[#222F4C] hover:border-[#00E5FF]/40 transition space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Manajemen Guru</h3>
            <p className="text-xs text-slate-400 mt-1">Tambah akun guru satuan atau impor massal puluhan guru menggunakan file Excel.</p>
          </div>
          <Link
            to="/school/teachers"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#00E5FF] hover:underline"
          >
            <span>Kelola Akun Guru</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};
