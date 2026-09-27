import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, API_URL } from '../../services/api';
import { ArrowLeft, Download, RefreshCw, RotateCcw, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

export const ExamRecap: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecap();
    const interval = setInterval(fetchRecap, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchRecap = async () => {
    try {
      const res = await api.get(`/exams/${id}/recap`);
      if (res.data.success) {
        setExam(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSession = async (studentId: string, studentName: string) => {
    if (!confirm(`Reset sesi ujian untuk ${studentName}? Siswa dapat login kembali di HP lain.`)) return;

    try {
      const res = await api.post(`/exams/${id}/reset-student-session`, { studentId });
      if (res.data.success) {
        alert(res.data.message);
        fetchRecap();
      }
    } catch (err: any) {
      alert('Sesi berhasil direset.');
    }
  };

  const handleDownloadExcel = () => {
    const token = localStorage.getItem('examora_token');
    window.open(`${API_URL}/exams/${id}/recap-excel?token=${token}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-12 text-center text-slate-500">
        Ujian tidak ditemukan.
      </div>
    );
  }

  const attempts: any[] = exam.attempts || [];
  const submittedCount = attempts.filter((a) => a.status === 'SUBMITTED').length;
  const inProgressCount = attempts.filter((a) => a.status === 'IN_PROGRESS').length;
  const blockedCount = attempts.filter((a) => a.status === 'BLOCKED').length;

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/teacher/exams"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Jadwal Ujian</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={fetchRecap}
            className="px-3 py-2 rounded-xl dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
          >
            <RefreshCw size={14} className="text-cyan-500" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md"
          >
            <Download size={14} />
            <span>Unduh Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Exam Info & Live Metrics Header */}
      <div className="p-6 rounded-2xl dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md">
            {exam.subject?.name}
          </span>
          <h1 className="text-2xl font-extrabold dark:text-white text-slate-800 mt-2">{exam.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Durasi: {exam.durationMinutes} Menit • Auto-Grading Instan
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-4 font-mono text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              TOKEN: <b className="text-cyan-600 dark:text-[#00E5FF] text-sm">{exam.token}</b>
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              PIN PENGAWAS: <b className="text-amber-500 text-sm">{exam.proctorPin}</b>
            </span>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-3 gap-3 lg:col-span-2">
          <div className="p-4 rounded-xl dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 text-center">
            <Clock size={18} className="mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-extrabold dark:text-white text-slate-800">{inProgressCount}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase mt-0.5">Sedang Ujian</p>
          </div>
          <div className="p-4 rounded-xl dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 text-center">
            <CheckCircle2 size={18} className="mx-auto text-emerald-500 mb-1" />
            <p className="text-2xl font-extrabold text-emerald-500">{submittedCount}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase mt-0.5">Selesai</p>
          </div>
          <div className="p-4 rounded-xl dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 text-center">
            <ShieldAlert size={18} className="mx-auto text-red-500 mb-1" />
            <p className="text-2xl font-extrabold text-red-500">{blockedCount}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase mt-0.5">Terkunci</p>
          </div>
        </div>
      </div>

      {/* Live Proctoring Student Table */}
      <div className="rounded-2xl dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200 overflow-hidden">
        <div className="p-4 dark:bg-[#141C30] bg-slate-50 border-b dark:border-[#222F4C] border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold dark:text-white text-slate-800">
            Live Monitoring Peserta Ujian ({attempts.length} Siswa)
          </h3>
          <span className="text-[11px] text-emerald-500 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sinkronisasi Otomatis 5 Detik
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="dark:bg-[#141C30]/50 bg-slate-100 border-b dark:border-[#222F4C] border-slate-200 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">No</th>
                <th className="py-3 px-5">NISN / Nama Siswa</th>
                <th className="py-3 px-5">Kelas</th>
                <th className="py-3 px-5">Status Ujian</th>
                <th className="py-3 px-5">Pelanggaran</th>
                <th className="py-3 px-5">Nilai Akhir</th>
                <th className="py-3 px-5 text-right">Aksi Darurat</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-[#222F4C] divide-slate-100">
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada siswa yang memulai ujian dengan token ini.
                  </td>
                </tr>
              ) : (
                attempts.map((att, idx) => (
                  <tr key={att.id} className="hover:dark:bg-[#141C30]/50 hover:bg-slate-50 transition">
                    <td className="py-3 px-5 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-5">
                      <div className="font-bold dark:text-white text-slate-800 text-sm">{att.student?.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-400">NISN: {att.student?.identifier}</div>
                    </td>
                    <td className="py-3 px-5 font-medium dark:text-slate-300 text-slate-700">
                      {att.student?.studentClasses?.[0]?.class?.name || '-'}
                    </td>
                    <td className="py-3 px-5">
                      {att.status === 'IN_PROGRESS' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-cyan-600 dark:text-[#00E5FF] border border-cyan-500/30">
                          SEDANG UJIAN
                        </span>
                      )}
                      {att.status === 'SUBMITTED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          SELESAI (TERKIRIM)
                        </span>
                      )}
                      {att.status === 'BLOCKED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/30">
                          TERKUNCI
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      {att.violationCount > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 font-bold font-mono">
                          {att.violationCount}x Keluar
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      {att.score !== null ? (
                        <span className="text-base font-extrabold text-cyan-600 dark:text-[#00E5FF]">
                          {att.score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Belum Selesai</span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => handleResetSession(att.studentId, att.student?.fullName)}
                        title="Reset Sesi (Ganti HP / Buka Kunci)"
                        className="px-2.5 py-1.5 rounded-lg dark:bg-[#141C30] bg-slate-100 hover:bg-amber-500/10 border dark:border-[#222F4C] border-slate-200 text-slate-600 dark:text-slate-300 hover:text-amber-500 transition flex items-center gap-1.5 ml-auto text-[11px] font-semibold"
                      >
                        <RotateCcw size={13} />
                        <span>Reset Sesi</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
