import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Users, ArrowRight, Sparkles, BookOpen } from 'lucide-react';

export const SchoolDashboard: React.FC = () => {
  const { user, school } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-[#00E5FF] text-xs font-bold mb-3">
            <Sparkles size={12} />
            <span>Portal Administrator Sekolah</span>
          </div>
          <h1 className="text-2xl font-extrabold dark:text-white text-slate-800">{school?.name || 'Sekolah'}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Kode Sekolah: <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">#{school?.code}</span> • Pengelola: {user?.fullName}
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200 hover:border-cyan-500/50 transition space-y-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-[#00E5FF] flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold dark:text-white text-slate-800">Mata Pelajaran</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Daftar kurikulum resmi sekolah (Matematika, IPA, dll). Guru memilih dari sini.
            </p>
          </div>
          <Link
            to="/school/subjects"
            className="inline-flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-[#00E5FF] hover:underline"
          >
            <span>Kelola Mapel</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="p-6 rounded-2xl dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200 hover:border-cyan-500/50 transition space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <GraduationCap size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold dark:text-white text-slate-800">Manajemen Kelas</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Buat dan atur daftar kelas (e.g. Kelas X IPA 1) untuk tempat registrasi siswa.
            </p>
          </div>
          <Link
            to="/school/classes"
            className="inline-flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-[#00E5FF] hover:underline"
          >
            <span>Kelola Kelas</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="p-6 rounded-2xl dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200 hover:border-cyan-500/50 transition space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold dark:text-white text-slate-800">Manajemen Guru</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tambah akun guru satuan atau impor massal puluhan guru menggunakan file Excel.
            </p>
          </div>
          <Link
            to="/school/teachers"
            className="inline-flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-[#00E5FF] hover:underline"
          >
            <span>Kelola Akun Guru</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};
