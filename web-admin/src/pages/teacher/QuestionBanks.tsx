import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FileQuestion, Plus, Trash2, Image, Check, BookOpen } from 'lucide-react';

export const QuestionBanks: React.FC = () => {
  const { user } = useAuth();
  const [banks, setBanks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Create Bank
  const [showBankModal, setShowBankModal] = useState(false);
  const [subjectId, setSubjectId] = useState(user?.subjectId || user?.subject?.id || '');
  const [bankTitle, setBankTitle] = useState('');

  // Selected Bank Questions
  const [selectedBank, setSelectedBank] = useState<any | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  // Question Form
  const [qContent, setQContent] = useState('');
  const [qPoints, setQPoints] = useState(50);
  const [qType, setQType] = useState('SINGLE_CHOICE');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Options A, B, C, D
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOpt, setCorrectOpt] = useState('A');

  useEffect(() => {
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    setIsLoading(true);
    try {
      const [resBanks, resSubjects] = await Promise.all([
        api.get('/questions/banks'),
        api.get('/school/subjects').catch(() => ({ data: { success: true, data: [] } })),
      ]);

      if (resBanks.data.success && resBanks.data.data.length > 0) {
        setBanks(resBanks.data.data);
        if (!selectedBank && resBanks.data.data.length > 0) {
          openBankDetail(resBanks.data.data[0].id);
        }
      }

      if (resSubjects.data.success) {
        setSubjects(resSubjects.data.data);
        if (!subjectId && resSubjects.data.data.length > 0) {
          const matchUser = resSubjects.data.data.find(
            (s: any) => s.id === user?.subjectId || s.name.toLowerCase() === user?.subject?.name?.toLowerCase()
          );
          setSubjectId(matchUser ? matchUser.id : resSubjects.data.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankTitle) return;

    try {
      const res = await api.post('/questions/banks', {
        subjectId: subjectId || user?.subject?.id || 'sub-1',
        title: bankTitle,
      });
      if (res.data.success) {
        setShowBankModal(false);
        setBankTitle('');
        fetchInitial();
      }
    } catch (err: any) {
      alert('Gagal membuat bank soal.');
    }
  };

  const openBankDetail = async (bankId: string) => {
    try {
      const res = await api.get(`/questions/banks/${bankId}`);
      if (res.data.success) {
        setSelectedBank(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsUploadingMedia(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/questions/upload-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setMediaUrl(res.data.data.url);
      }
    } catch (err) {
      setMediaUrl('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qContent || !selectedBank) return;

    let options = null;
    if (qType === 'SINGLE_CHOICE') {
      options = [
        { id: 'A', text: optA || 'Pilihan A', isCorrect: correctOpt === 'A' },
        { id: 'B', text: optB || 'Pilihan B', isCorrect: correctOpt === 'B' },
        { id: 'C', text: optC || 'Pilihan C', isCorrect: correctOpt === 'C' },
        { id: 'D', text: optD || 'Pilihan D', isCorrect: correctOpt === 'D' },
      ];
    }

    try {
      const res = await api.post(`/questions/banks/${selectedBank.id}/questions`, {
        type: qType,
        content: qContent,
        points: Number(qPoints),
        mediaUrl: mediaUrl || undefined,
        options,
      });

      if (res.data.success) {
        setShowQuestionModal(false);
        setQContent('');
        setMediaUrl('');
        setOptA('');
        setOptB('');
        setOptC('');
        setOptD('');
        openBankDetail(selectedBank.id);
        fetchInitial();
      }
    } catch (err: any) {
      alert('Gagal menambahkan soal.');
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Hapus butir soal ini?')) return;
    try {
      await api.delete(`/questions/questions/${qId}`);
      if (selectedBank) openBankDetail(selectedBank.id);
      fetchInitial();
    } catch (err) {
      alert('Gagal menghapus soal.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200">
        <div>
          <h2 className="text-base font-bold dark:text-white text-slate-800">Bank Soal & Butir Ujian</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Buat butir soal pilihan ganda atau essay dan unggah gambar pendukung.
          </p>
        </div>
        <button
          onClick={() => setShowBankModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] text-[#080C15] font-extrabold text-xs transition flex items-center gap-1.5 shadow-md"
        >
          <Plus size={16} />
          <span>Buat Bank Soal Baru</span>
        </button>
      </div>

      {/* Main Grid: Banks List & Questions Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Banks List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Daftar Bank Soal
          </h3>
          {isLoading ? (
            <div className="text-center py-8 text-xs text-slate-500">Memuat bank soal...</div>
          ) : banks.length === 0 ? (
            <div className="p-6 rounded-2xl dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200 text-center text-xs text-slate-500">
              Belum ada bank soal. Klik tombol di atas untuk membuat.
            </div>
          ) : (
            banks.map((b) => (
              <div
                key={b.id}
                onClick={() => openBankDetail(b.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  selectedBank?.id === b.id
                    ? 'dark:bg-[#141C30] bg-cyan-500/10 border-cyan-500 shadow-sm'
                    : 'dark:bg-[#0E1424] bg-white dark:border-[#222F4C] border-slate-200 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 dark:bg-cyan-400/10 bg-cyan-50 px-2 py-0.5 rounded-md">
                    {b.subject?.name || 'Mata Pelajaran'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {b._count?.questions || b.questions?.length || 0} Soal
                  </span>
                </div>
                <h4 className="font-bold text-sm dark:text-white text-slate-800">{b.title}</h4>
              </div>
            ))
          )}
        </div>

        {/* Right: Questions inside selected Bank */}
        <div className="lg:col-span-2">
          {selectedBank ? (
            <div className="p-6 rounded-2xl dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b dark:border-[#222F4C] border-slate-200">
                <div>
                  <h3 className="text-base font-bold dark:text-white text-slate-800">{selectedBank.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Mapel: {selectedBank.subject?.name} • Total: {selectedBank.questions?.length || 0} Soal
                  </p>
                </div>
                <button
                  onClick={() => setShowQuestionModal(true)}
                  className="px-3.5 py-2 bg-cyan-500 text-slate-900 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition hover:bg-cyan-400 self-start sm:self-auto"
                >
                  <Plus size={14} />
                  <span>Tambah Butir Soal</span>
                </button>
              </div>

              {selectedBank.questions?.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Bank soal ini masih kosong. Klik Tambah Butir Soal untuk membuat pertanyaan.
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedBank.questions?.map((q: any, idx: number) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full dark:bg-[#1A243D] bg-white border border-slate-200 dark:border-transparent text-cyan-600 dark:text-[#00E5FF] font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                            {q.type === 'SINGLE_CHOICE' ? 'Pilihan Ganda' : 'Essay'} • {q.points} Poin
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <p className="text-sm dark:text-white text-slate-800 leading-relaxed font-medium">
                        {q.content}
                      </p>

                      {q.mediaUrl && (
                        <img
                          src={q.mediaUrl}
                          alt="Soal"
                          className="max-h-48 rounded-xl border dark:border-[#222F4C] border-slate-200 object-contain bg-black/10"
                        />
                      )}

                      {/* Options preview */}
                      {q.options && Array.isArray(q.options) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {q.options.map((opt: any) => (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                                opt.isCorrect
                                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold'
                                  : 'dark:bg-[#0E1424] bg-white dark:border-[#222F4C] border-slate-200 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full dark:bg-white/10 bg-slate-100 flex items-center justify-center font-mono">
                                {opt.id}
                              </span>
                              <span>{opt.text}</span>
                              {opt.isCorrect && <Check size={14} className="ml-auto text-emerald-500" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-2xl dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200 text-center text-xs text-slate-500">
              Pilih salah satu bank soal di sebelah kiri untuk melihat dan menambahkan butir pertanyaan.
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Bank */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200 p-6 rounded-3xl shadow-2xl">
            <h3 className="text-lg font-bold dark:text-white text-slate-800 mb-4">Buat Bank Soal Baru</h3>
            <form onSubmit={handleCreateBank} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 mb-1.5">Mata Pelajaran</label>
                {user?.subject ? (
                  <div className="p-3 dark:bg-[#141C30] bg-slate-50 border dark:border-[#00E5FF]/40 border-cyan-500/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 dark:text-white text-slate-800 font-bold text-sm">
                      <BookOpen size={16} className="text-cyan-600 dark:text-[#00E5FF]" />
                      <span>{user.subject.name} ({user.subject.code})</span>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-600 dark:text-[#00E5FF] bg-cyan-500/10 px-2 py-0.5 rounded">
                      Terkunci Otomatis
                    </span>
                  </div>
                ) : (
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-4 py-2.5 dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 focus:border-cyan-500 rounded-xl text-sm dark:text-white text-slate-900 outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 mb-1.5">Judul Bank Soal</label>
                <input
                  type="text"
                  value={bankTitle}
                  onChange={(e) => setBankTitle(e.target.value)}
                  placeholder="Contoh: UTS Matematika Semester 1"
                  className="w-full px-4 py-2.5 dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 focus:border-cyan-500 rounded-xl text-sm dark:text-white text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-[#222F4C] border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-cyan-500 text-slate-900 font-extrabold text-xs rounded-xl hover:bg-cyan-400"
                >
                  Buat Bank Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Question */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200 p-6 rounded-3xl shadow-2xl my-8">
            <h3 className="text-lg font-bold dark:text-white text-slate-800 mb-4">Tambah Butir Soal Ujian</h3>

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 mb-1.5">Tipe Soal</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value)}
                    className="w-full px-4 py-2.5 dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 focus:border-cyan-500 rounded-xl text-sm dark:text-white text-slate-900 outline-none"
                  >
                    <option value="SINGLE_CHOICE">Pilihan Ganda (Single Choice)</option>
                    <option value="ESSAY">Essay / Uraian</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 mb-1.5">Bobot Poin Soal</label>
                  <input
                    type="number"
                    value={qPoints}
                    onChange={(e) => setQPoints(Number(e.target.value))}
                    min="1"
                    className="w-full px-4 py-2.5 dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 focus:border-cyan-500 rounded-xl text-sm dark:text-white text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 mb-1.5">Pertanyaan / Narasi Soal</label>
                <textarea
                  rows={4}
                  value={qContent}
                  onChange={(e) => setQContent(e.target.value)}
                  placeholder="Ketik pertanyaan soal di sini..."
                  className="w-full px-4 py-2.5 dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 focus:border-cyan-500 rounded-xl text-sm dark:text-white text-slate-900 outline-none"
                />
              </div>

              {/* Upload Image for Question */}
              <div>
                <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 mb-1.5">Sisipkan Gambar Soal (Opsional)</label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 dark:bg-[#141C30] bg-slate-100 hover:dark:bg-[#1A243D] border dark:border-[#222F4C] border-slate-200 rounded-xl text-xs font-bold dark:text-white text-slate-700 cursor-pointer flex items-center gap-2">
                    <Image size={14} className="text-cyan-500" />
                    <span>{isUploadingMedia ? 'Mengunggah...' : 'Pilih Gambar'}</span>
                    <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
                  </label>
                  {mediaUrl && (
                    <span className="text-xs text-emerald-500 font-mono font-bold">Gambar terunggah ✓</span>
                  )}
                </div>
              </div>

              {/* Options for Single Choice */}
              {qType === 'SINGLE_CHOICE' && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold dark:text-slate-300 text-slate-700">
                    Pilihan Jawaban (Klik huruf untuk kunci jawaban benar):
                  </label>
                  {[
                    { id: 'A', val: optA, set: setOptA },
                    { id: 'B', val: optB, set: setOptB },
                    { id: 'C', val: optC, set: setOptC },
                    { id: 'D', val: optD, set: setOptD },
                  ].map((o) => (
                    <div key={o.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCorrectOpt(o.id)}
                        className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 transition ${
                          correctOpt === o.id
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'dark:bg-[#141C30] bg-slate-100 text-slate-500 hover:text-slate-800 dark:hover:text-white border dark:border-[#222F4C] border-slate-200'
                        }`}
                      >
                        {o.id}
                      </button>
                      <input
                        type="text"
                        value={o.val}
                        onChange={(e) => o.set(e.target.value)}
                        placeholder={`Teks Opsi ${o.id}`}
                        className="flex-1 px-4 py-2 dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 focus:border-cyan-500 rounded-xl text-xs dark:text-white text-slate-900 outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-[#222F4C] border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-cyan-500 text-slate-900 font-extrabold text-xs rounded-xl hover:bg-cyan-400"
                >
                  Simpan Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
