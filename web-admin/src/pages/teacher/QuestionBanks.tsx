import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { FileQuestion, Plus, Trash2, Image, Check, AlertCircle } from 'lucide-react';

export const QuestionBanks: React.FC = () => {
  const [banks, setBanks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Create Bank
  const [showBankModal, setShowBankModal] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [bankTitle, setBankTitle] = useState('');

  // Selected Bank Questions
  const [selectedBank, setSelectedBank] = useState<any | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  // Question Form
  const [qContent, setQContent] = useState('');
  const [qPoints, setQPoints] = useState(1);
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

      if (resBanks.data.success) setBanks(resBanks.data.data);
      if (resSubjects.data.success) {
        setSubjects(resSubjects.data.data);
        if (resSubjects.data.data.length > 0) setSubjectId(resSubjects.data.data[0].id);
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
        subjectId,
        title: bankTitle,
      });
      if (res.data.success) {
        setShowBankModal(false);
        setBankTitle('');
        fetchInitial();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membuat bank soal.');
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
      alert('Gagal mengunggah gambar.');
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
        { id: 'A', text: optA, isCorrect: correctOpt === 'A' },
        { id: 'B', text: optB, isCorrect: correctOpt === 'B' },
        { id: 'C', text: optC, isCorrect: correctOpt === 'C' },
        { id: 'D', text: optD, isCorrect: correctOpt === 'D' },
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
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menambahkan soal.');
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Hapus butir soal ini?')) return;
    try {
      await api.delete(`/questions/questions/${qId}`);
      if (selectedBank) openBankDetail(selectedBank.id);
    } catch (err) {
      alert('Gagal menghapus soal.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-5 rounded-2xl bg-[#0E1424] border border-[#222F4C]">
        <div>
          <h2 className="text-base font-bold text-white">Bank Soal & Butir Ujian</h2>
          <p className="text-xs text-slate-400 mt-0.5">Buat butir soal pilihan ganda atau essay dan unggah gambar pendukung.</p>
        </div>
        <button
          onClick={() => setShowBankModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] text-[#080C15] font-extrabold text-xs transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.25)]"
        >
          <Plus size={16} />
          <span>Buat Bank Soal Baru</span>
        </button>
      </div>

      {/* Main Grid: Banks List & Questions Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Banks List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Daftar Bank Soal</h3>
          {isLoading ? (
            <div className="text-center py-8 text-xs text-slate-500">Memuat bank soal...</div>
          ) : banks.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#0E1424] border border-[#222F4C] text-center text-xs text-slate-400">
              Belum ada bank soal. Klik tombol di atas untuk membuat.
            </div>
          ) : (
            banks.map((b) => (
              <div
                key={b.id}
                onClick={() => openBankDetail(b.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  selectedBank?.id === b.id
                    ? 'bg-[#141C30] border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                    : 'bg-[#0E1424] border-[#222F4C] hover:border-[#00E5FF]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-md">
                    {b.subject?.name || 'Mata Pelajaran'}
                  </span>
                  <span className="text-xs text-slate-400">{b._count?.questions || 0} Soal</span>
                </div>
                <h4 className="font-bold text-sm text-white">{b.title}</h4>
              </div>
            ))
          )}
        </div>

        {/* Right: Questions inside selected Bank */}
        <div className="lg:col-span-2">
          {selectedBank ? (
            <div className="p-6 rounded-2xl bg-[#0E1424] border border-[#222F4C] space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#222F4C]">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedBank.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Mapel: {selectedBank.subject?.name} • Total: {selectedBank.questions?.length || 0} Soal</p>
                </div>
                <button
                  onClick={() => setShowQuestionModal(true)}
                  className="px-3.5 py-2 bg-[#00E5FF] text-[#080C15] font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition"
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
                    <div key={q.id} className="p-4 rounded-xl bg-[#141C30] border border-[#222F4C] space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#1A243D] text-cyan-400 font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 uppercase">
                            {q.type === 'SINGLE_CHOICE' ? 'Pilihan Ganda' : 'Essay'} • {q.points} Poin
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <p className="text-sm text-white leading-relaxed">{q.content}</p>

                      {q.mediaUrl && (
                        <img
                          src={q.mediaUrl.startsWith('http') ? q.mediaUrl : `http://43.157.203.140:3000${q.mediaUrl}`}
                          alt="Soal"
                          className="max-h-48 rounded-xl border border-[#222F4C] object-contain bg-black/40"
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
                                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold'
                                  : 'bg-[#0E1424] border-[#222F4C] text-slate-300'
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-mono">
                                {opt.id}
                              </span>
                              <span>{opt.text}</span>
                              {opt.isCorrect && <Check size={14} className="ml-auto text-emerald-400" />}
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
            <div className="p-12 rounded-2xl bg-[#0E1424] border border-[#222F4C] text-center text-xs text-slate-400">
              Pilih salah satu bank soal di sebelah kiri untuk melihat dan menambahkan butir pertanyaan.
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Bank */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0E1424] border border-[#222F4C] p-6 rounded-3xl shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Buat Bank Soal Baru</h3>
            <form onSubmit={handleCreateBank} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mata Pelajaran</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white outline-none"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Judul Bank Soal</label>
                <input
                  type="text"
                  value={bankTitle}
                  onChange={(e) => setBankTitle(e.target.value)}
                  placeholder="Contoh: UTS Matematika Semester 1"
                  className="w-full px-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222F4C]">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#00E5FF] text-[#080C15] font-extrabold text-xs rounded-xl"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#0E1424] border border-[#222F4C] p-6 rounded-3xl shadow-2xl my-8">
            <h3 className="text-lg font-bold text-white mb-4">Tambah Butir Soal Ujian</h3>

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipe Soal</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white outline-none"
                  >
                    <option value="SINGLE_CHOICE">Pilihan Ganda (Single Choice)</option>
                    <option value="ESSAY">Essay / Uraian</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bobot Poin Soal</label>
                  <input
                    type="number"
                    value={qPoints}
                    onChange={(e) => setQPoints(Number(e.target.value))}
                    min="1"
                    className="w-full px-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pertanyaan / Narasi Soal</label>
                <textarea
                  rows={4}
                  value={qContent}
                  onChange={(e) => setQContent(e.target.value)}
                  placeholder="Ketik pertanyaan soal di sini..."
                  className="w-full px-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white outline-none"
                />
              </div>

              {/* Upload Image for Question */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sisipkan Gambar Soal (Opsional)</label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 bg-[#141C30] hover:bg-[#1A243D] border border-[#222F4C] rounded-xl text-xs font-bold text-white cursor-pointer flex items-center gap-2">
                    <Image size={14} className="text-cyan-400" />
                    <span>{isUploadingMedia ? 'Mengompres...' : 'Pilih Gambar (WebP)'}</span>
                    <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
                  </label>
                  {mediaUrl && (
                    <span className="text-xs text-emerald-400 font-mono">Gambar terunggah ✓</span>
                  )}
                </div>
              </div>

              {/* Options for Single Choice */}
              {qType === 'SINGLE_CHOICE' && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-300">Pilihan Jawaban (Centang Opsi yang Benar):</label>
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
                            ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                            : 'bg-[#141C30] text-slate-400 hover:text-white border border-[#222F4C]'
                        }`}
                      >
                        {o.id}
                      </button>
                      <input
                        type="text"
                        value={o.val}
                        onChange={(e) => o.set(e.target.value)}
                        placeholder={`Teks Opsi ${o.id}`}
                        className="flex-1 px-4 py-2 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-xs text-white outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222F4C]">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#00E5FF] text-[#080C15] font-extrabold text-xs rounded-xl"
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
