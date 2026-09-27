import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FileQuestion, CalendarCheck, ArrowRight, Award, Sparkles } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user, school } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#0E1424] via-[#141C30] to-[#1E2B4D] border border-[#222F4C] relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-3">
            <Sparkles size={12} />
            <span>Portal Pengajar Digital</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Selamat Datang, {user?.fullName}!</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Anda login sebagai Guru di <span className="text-white font-semibold">{school?.name || 'Sekolah'}</span>.
            Kelola butir soal ujian, buat jadwal ujian baru, pantau siswa secara real-time, dan unduh rekap nilai instan.
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#0E1424] border border-[#222F4C] hover:border-[#00E5FF]/40 transition space-y-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 flex items-center justify-center">
            <FileQuestion size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Bank Soal & Media</h3>
            <p className="text-xs text-slate-400 mt-1">Buat soal pilihan ganda, essay, dan unggah gambar pendukung.</p>
          </div>
          <Link
            to="/teacher/question-banks"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#00E5FF] hover:underline"
          >
            <span>Buka Bank Soal</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-[#0E1424] border border-[#222F4C] hover:border-[#00E5FF]/40 transition space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-400/10 border border-blue-400/30 text-blue-400 flex items-center justify-center">
            <CalendarCheck size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Jadwal & Token Ujian</h3>
            <p className="text-xs text-slate-400 mt-1">Jadwalkan ujian kelas, rilis 6 digit token, dan pantau peserta live.</p>
          </div>
          <Link
            to="/teacher/exams"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#00E5FF] hover:underline"
          >
            <span>Buka Jadwal Ujian</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};
