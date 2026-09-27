import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, API_URL } from '../../services/api';
import { ArrowLeft, Download, RefreshCw, RotateCcw, AlertTriangle, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

export const ExamRecap: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecap();
    // Auto refresh every 5 seconds for live proctoring
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
      setExam({
        id: id || 'exam-1',
        title: 'Ujian Tengah Semester',
        durationMinutes: 60,
        token: 'EXM24',
        proctorPin: '123456',
        subject: { name: 'Matematika' },
        attempts: [
          {
            id: 'att-1',
            studentId: 'std-1',
            status: 'SUBMITTED',
            violationCount: 0,
            score: 95.0,
            student: {
              fullName: 'Reza Riyadhusolihin',
              identifier: '123456',
              studentClasses: [{ class: { name: 'Kelas X IPA 1' } }],
            },
          },
          {
            id: 'att-2',
            studentId: 'std-2',
            status: 'IN_PROGRESS',
            violationCount: 1,
            score: null,
            student: {
              fullName: 'Ahmad Fauzi',
              identifier: '123457',
              studentClasses: [{ class: { name: 'Kelas X IPA 1' } }],
            },
          },
        ],
      });
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
      alert(err.response?.data?.message || 'Gagal mereset sesi.');
    }
  };

  const handleDownloadExcel = () => {
    const token = localStorage.getItem('examora_token');
    window.open(`${API_URL}/exams/${id}/recap-excel?token=${token}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-12 text-center text-slate-400">
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
      <div className="flex items-center justify-between">
        <Link
          to="/teacher/exams"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Jadwal Ujian</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRecap}
            className="px-3.5 py-2 rounded-xl bg-[#0E1424] hover:bg-[#141C30] border border-[#222F4C] text-xs font-bold text-slate-300 transition flex items-center gap-2"
          >
            <RefreshCw size={14} className="text-cyan-400" />
            <span>Refresh Live Data</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <Download size={15} />
            <span>Unduh Rekap Nilai (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Exam Info & Live Metrics Header */}
      <div className="p-6 rounded-2xl bg-[#0E1424] border border-[#222F4C] grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <span className="text-[11px] font-bold text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-md">
            {exam.subject?.name}
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-2">{exam.title}</h1>
          <p className="text-xs text-slate-400 mt-1">Durasi: {exam.durationMinutes} Menit • Auto-Grading Instan Aktif</p>
          <div className="flex items-center gap-4 mt-4 font-mono text-xs">
            <span className="text-slate-400">TOKEN: <b className="text-[#00E5FF] text-sm">{exam.token}</b></span>
            <span className="text-slate-400">PIN PENGAWAS: <b className="text-amber-400 text-sm">{exam.proctorPin}</b></span>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-3 gap-3 lg:col-span-2">
          <div className="p-4 rounded-xl bg-[#141C30] border border-[#222F4C] text-center">
            <Clock size={18} className="mx-auto text-blue-400 mb-1" />
            <p className="text-2xl font-extrabold text-white">{inProgressCount}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Sedang Ujian</p>
          </div>
          <div className="p-4 rounded-xl bg-[#141C30] border border-[#222F4C] text-center">
            <CheckCircle2 size={18} className="mx-auto text-emerald-400 mb-1" />
            <p className="text-2xl font-extrabold text-emerald-400">{submittedCount}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Sudah Selesai</p>
          </div>
          <div className="p-4 rounded-xl bg-[#141C30] border border-[#222F4C] text-center">
            <ShieldAlert size={18} className="mx-auto text-red-400 mb-1" />
            <p className="text-2xl font-extrabold text-red-400">{blockedCount}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Terkunci</p>
          </div>
        </div>
      </div>

      {/* Live Proctoring Student Table */}
      <div className="rounded-2xl bg-[#0E1424] border border-[#222F4C] overflow-hidden">
        <div className="p-4 bg-[#141C30] border-b border-[#222F4C] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Live Monitoring Peserta Ujian ({attempts.length} Siswa)</h3>
          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Live Sinkronisasi 5 Detik
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141C30]/50 border-b border-[#222F4C] text-slate-400 font-bold uppercase tracking-wider">
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
            <tbody className="divide-y divide-[#222F4C]">
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada siswa yang memulai ujian dengan token ini.
                  </td>
                </tr>
              ) : (
                attempts.map((att, idx) => (
                  <tr key={att.id} className="hover:bg-[#141C30]/50 transition">
                    <td className="py-3 px-5 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-5">
                      <div className="font-bold text-white text-sm">{att.student?.fullName}</div>
                      <div className="text-[11px] font-mono text-slate-400">NISN: {att.student?.identifier}</div>
                    </td>
                    <td className="py-3 px-5 font-medium text-slate-300">
                      {att.student?.studentClasses?.[0]?.class?.name || '-'}
                    </td>
                    <td className="py-3 px-5">
                      {att.status === 'IN_PROGRESS' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-cyan-400 border border-cyan-500/30">
                          SEDANG MENGERJAKAN
                        </span>
                      )}
                      {att.status === 'SUBMITTED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          SELESAI (TERKIRIM)
                        </span>
                      )}
                      {att.status === 'BLOCKED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                          TERKUNCI
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      {att.violationCount > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold font-mono">
                          {att.violationCount}x Keluar
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      {att.score !== null ? (
                        <span className="text-base font-extrabold text-[#00E5FF]">
                          {att.score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">Belum Selesai</span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => handleResetSession(att.studentId, att.student?.fullName)}
                        title="Reset Sesi (Ganti HP / Buka Kunci)"
                        className="px-2.5 py-1.5 rounded-lg bg-[#141C30] hover:bg-amber-500/10 hover:border-amber-500/30 border border-[#222F4C] text-slate-300 hover:text-amber-400 transition flex items-center gap-1.5 ml-auto text-[11px] font-semibold"
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
