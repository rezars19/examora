import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { CalendarCheck, Plus, Key, Shield, Clock, Users, ArrowRight, BarChart3, AlertCircle } from 'lucide-react';

export const ExamsManagement: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState(
    new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setIsLoading(true);
    try {
      const [resExams, resSubjects, resClasses] = await Promise.all([
        api.get('/exams/list'),
        api.get('/school/subjects').catch(() => ({ data: { success: true, data: [] } })),
        api.get('/school/classes').catch(() => ({ data: { success: true, data: [] } })),
      ]);

      if (resExams.data.success && resExams.data.data.length > 0) {
        setExams(resExams.data.data);
      } else {
        setExams([
          {
            id: 'exam-1',
            title: 'Ujian Tengah Semester',
            subject: { name: 'Matematika' },
            durationMinutes: 60,
            token: 'EXM24',
            proctorPin: '123456',
            examClasses: [{ class: { name: 'Kelas X IPA 1' } }],
          },
        ]);
      }
      if (resSubjects.data.success) {
        setSubjects(resSubjects.data.data);
        if (resSubjects.data.data.length > 0) setSubjectId(resSubjects.data.data[0].id);
      }
      if (resClasses.data.success) {
        setClasses(resClasses.data.data);
        if (resClasses.data.data.length > 0) setSelectedClassIds([resClasses.data.data[0].id]);
      }
    } catch (err) {
      setExams([
        {
          id: 'exam-1',
          title: 'Ujian Tengah Semester',
          subject: { name: 'Matematika' },
          durationMinutes: 60,
          token: 'EXM24',
          proctorPin: '123456',
          examClasses: [{ class: { name: 'Kelas X IPA 1' } }],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subjectId || selectedClassIds.length === 0) {
      setErrorMsg('Semua kolom wajib diisi dan pilih minimal satu kelas.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.post('/exams/create', {
        subjectId,
        title,
        durationMinutes: Number(durationMinutes),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        classIds: selectedClassIds,
      });

      if (res.data.success) {
        setShowModal(false);
        setTitle('');
        fetchExams();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menjadwalkan ujian.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleClass = (id: string) => {
    if (selectedClassIds.includes(id)) {
      setSelectedClassIds(selectedClassIds.filter((cid) => cid !== id));
    } else {
      setSelectedClassIds([...selectedClassIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-5 rounded-2xl bg-[#0E1424] border border-[#222F4C]">
        <div>
          <h2 className="text-base font-bold text-white">Jadwal Ujian & Token Rilis</h2>
          <p className="text-xs text-slate-400 mt-0.5">Siswa memasukkan 6 digit Token ini di aplikasi mobile untuk memulai ujian.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] text-[#080C15] font-extrabold text-xs transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.25)]"
        >
          <Plus size={16} />
          <span>Jadwalkan Ujian Baru</span>
        </button>
      </div>

      {/* Exams Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : exams.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0E1424] border border-[#222F4C]">
          <CalendarCheck size={48} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">Belum Ada Jadwal Ujian</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Buat jadwal ujian untuk kelas target dan dapatkan token rilis untuk siswa.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-[#00E5FF] text-[#080C15] font-bold text-xs"
          >
            Jadwalkan Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((ex) => (
            <div
              key={ex.id}
              className="p-6 rounded-2xl bg-[#0E1424] border border-[#222F4C] hover:border-[#00E5FF]/40 transition space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-400/10 text-[#00E5FF]">
                    {ex.subject?.name}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock size={12} />
                    <span>{ex.durationMinutes} Menit</span>
                  </div>
                </div>

                <h3 className="font-bold text-base text-white">{ex.title}</h3>

                {/* Target Classes */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {ex.examClasses?.map((ec: any) => (
                    <span key={ec.classId} className="px-2 py-0.5 rounded bg-[#141C30] text-[10px] text-slate-300">
                      {ec.class?.name}
                    </span>
                  ))}
                </div>

                {/* Token and PIN Cards */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#222F4C]">
                  <div className="p-3 rounded-xl bg-[#141C30] border border-[#222F4C]">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mb-1">
                      <Key size={12} className="text-[#00E5FF]" />
                      <span>TOKEN SISWA</span>
                    </div>
                    <p className="text-lg font-mono font-extrabold text-[#00E5FF] tracking-wider">{ex.token}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#141C30] border border-[#222F4C]">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mb-1">
                      <Shield size={12} className="text-amber-400" />
                      <span>PIN PENGAWAS</span>
                    </div>
                    <p className="text-lg font-mono font-extrabold text-amber-400 tracking-wider">{ex.proctorPin}</p>
                  </div>
                </div>
              </div>

              {/* Action Button: Live Monitoring & Rekap */}
              <Link
                to={`/teacher/exams/${ex.id}/recap`}
                className="w-full py-2.5 px-3 rounded-xl bg-[#141C30] hover:bg-[#1A243D] border border-[#222F4C] text-xs font-bold text-white transition flex items-center justify-center gap-2"
              >
                <BarChart3 size={15} className="text-cyan-400" />
                <span>Live Monitor & Rekap Nilai</span>
                <ArrowRight size={13} className="ml-auto text-slate-500" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0E1424] border border-[#222F4C] p-6 rounded-3xl shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Jadwalkan Ujian Baru</h3>
            <p className="text-xs text-slate-400 mb-5">Sistem akan men-generate Token Ujian dan PIN Pengawas secara otomatis.</p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Judul Ujian</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Ujian Tengah Semester Matematika"
                  className="w-full px-4 py-2 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mata Pelajaran</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-4 py-2 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-xs text-white outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Durasi (Menit)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    min="5"
                    className="w-full px-4 py-2 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Class Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pilih Kelas yang Diuji:</label>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[#141C30] border border-[#222F4C]">
                  {classes.map((c) => {
                    const isSelected = selectedClassIds.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleClass(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-[#00E5FF] text-[#080C15] font-bold'
                            : 'bg-[#1A243D] text-slate-300 hover:text-white'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mulai Ujian</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#141C30] border border-[#222F4C] rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Batas Akhir</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#141C30] border border-[#222F4C] rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222F4C]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#00E5FF] text-[#080C15] font-extrabold text-xs rounded-xl"
                >
                  {isSubmitting ? 'Membuat...' : 'Terbitkan Jadwal Ujian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
