import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FileQuestion, CalendarCheck, ArrowRight, BookOpen, Sparkles } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user, school } = useAuth();

  const assignedSubjectName = user?.subject?.name || 'Matematika';
  const assignedSubjectCode = user?.subject?.code || 'MTK';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#0E1424] via-[#141C30] to-[#1E2B4D] border border-[#222F4C] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-3">
            <Sparkles size={12} />
            <span>Portal Pengajar Digital</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Selamat Datang, {user?.fullName}!</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Anda login sebagai Guru di <span className="text-white font-semibold">{school?.name || 'Sekolah'}</span>.
            Mata pelajaran Anda telah disetel otomatis oleh Admin Sekolah. Anda tinggal membuat butir soal dan merilis token ujian.
          </p>
        </div>

        {/* Assigned Subject Card */}
        <div className="p-5 rounded-2xl bg-[#080C15]/80 border border-[#00E5FF]/40 shadow-[0_0_20px_rgba(0,229,255,0.15)] shrink-0 min-w-[240px]">
          <div className="flex items-center gap-2.5 text-xs text-slate-400 font-semibold mb-2">
            <BookOpen size={16} className="text-[#00E5FF]" />
            <span>MATA PELAJARAN ANDA</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">{assignedSubjectName}</h2>
          <div className="inline-block mt-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#00E5FF]/10 text-[#00E5FF]">
            Kode: {assignedSubjectCode}
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#0E1424] border border-[#222F4C] hover:border-[#00E5FF]/40 transition space-y-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 flex items-center justify-center">
            <FileQuestion size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Bank Soal {assignedSubjectName}</h3>
            <p className="text-xs text-slate-400 mt-1">
              Buat paket soal {assignedSubjectName} (Pilihan Ganda & Essay) beserta kunci jawaban dan gambar soal.
            </p>
          </div>
          <Link
            to="/teacher/question-banks"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#00E5FF] hover:underline"
          >
            <span>Kelola Bank Soal</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-[#0E1424] border border-[#222F4C] hover:border-[#00E5FF]/40 transition space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-400/10 border border-blue-400/30 text-blue-400 flex items-center justify-center">
            <CalendarCheck size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Jadwal & Token Ujian</h3>
            <p className="text-xs text-slate-400 mt-1">
              Terbitkan jadwal ujian {assignedSubjectName} untuk kelas siswa, rilis 6 digit token, dan pantau peserta live.
            </p>
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
