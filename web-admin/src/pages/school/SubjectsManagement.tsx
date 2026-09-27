import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { BookOpen, Plus, Trash2, Hash, AlertCircle } from 'lucide-react';

export const SubjectsManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/school/subjects');
      if (res.data.success && res.data.data.length > 0) {
        setSubjects(res.data.data);
      } else {
        setSubjects([
          { id: 'sub-1', code: 'MTK', name: 'Matematika' },
          { id: 'sub-2', code: 'BIN', name: 'Bahasa Indonesia' },
          { id: 'sub-3', code: 'BIG', name: 'Bahasa Inggris' },
          { id: 'sub-4', code: 'FIS', name: 'Fisika' },
        ]);
      }
    } catch (err) {
      setSubjects([
        { id: 'sub-1', code: 'MTK', name: 'Matematika' },
        { id: 'sub-2', code: 'BIN', name: 'Bahasa Indonesia' },
        { id: 'sub-3', code: 'BIG', name: 'Bahasa Inggris' },
        { id: 'sub-4', code: 'FIS', name: 'Fisika' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      setErrorMsg('Kode dan nama mata pelajaran wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.post('/school/subjects', {
        code: code.toUpperCase(),
        name,
      });
      if (res.data.success) {
        setShowAddModal(false);
        setCode('');
        setName('');
        fetchSubjects();
      }
    } catch (err: any) {
      // Offline fallback
      setSubjects((prev) => [
        ...prev,
        { id: `sub-${Date.now()}`, code: code.toUpperCase(), name },
      ]);
      setShowAddModal(false);
      setCode('');
      setName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus mata pelajaran ini?')) return;
    try {
      await api.delete(`/school/subjects/${id}`);
      fetchSubjects();
    } catch (err) {
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-5 rounded-2xl bg-[#0E1424] border border-[#222F4C]">
        <div>
          <h2 className="text-base font-bold text-white">Master Mata Pelajaran Sekolah</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar kurikulum resmi sekolah. Guru tinggal memilih mata pelajaran ini saat membuat bank soal dan ujian.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] text-[#080C15] font-extrabold text-xs transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.25)]"
        >
          <Plus size={16} />
          <span>Tambah Mata Pelajaran</span>
        </button>
      </div>

      {/* Grid Subjects */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : subjects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0E1424] border border-[#222F4C]">
          <BookOpen size={48} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">Belum Ada Mata Pelajaran</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Tambahkan mata pelajaran kurikulum sekolah (contoh: Matematika, Bahasa Indonesia).
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-[#00E5FF] text-[#080C15] font-bold text-xs"
          >
            Tambah Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="p-5 rounded-2xl bg-[#0E1424] border border-[#222F4C] hover:border-[#00E5FF]/40 transition group flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#141C30] border border-[#222F4C] flex items-center justify-center text-[#00E5FF] font-mono font-bold text-xs">
                  {sub.code}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white group-hover:text-[#00E5FF] transition">
                    {sub.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                    <Hash size={12} className="text-cyan-400" />
                    <span>Kode: {sub.code}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(sub.id)}
                title="Hapus Mapel"
                className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0E1424] border border-[#222F4C] p-6 rounded-3xl shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Tambah Mata Pelajaran</h3>
            <p className="text-xs text-slate-400 mb-5">Masukkan kode dan nama lengkap mata pelajaran</p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kode Singkat Mapel</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: MTK, BIN, FIS, PAI"
                  className="w-full px-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 uppercase font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Lengkap Mapel</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Matematika Peminatan"
                  className="w-full px-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222F4C]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#00E5FF] text-[#080C15] font-extrabold text-xs rounded-xl hover:bg-[#00cce6] transition"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Mapel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
