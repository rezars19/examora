import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { GraduationCap, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';

export const ClassesManagement: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/school/classes');
      if (res.data.success) {
        setClasses(res.data.data);
      }
    } catch (err) {
      setClasses([
        { id: 'c-1', name: 'Kelas X IPA 1', academicYear: '2026/2027', _count: { students: 32 } },
        { id: 'c-2', name: 'Kelas X IPA 2', academicYear: '2026/2027', _count: { students: 30 } },
        { id: 'c-3', name: 'Kelas XI IPA 1', academicYear: '2026/2027', _count: { students: 28 } },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !academicYear) {
      setErrorMsg('Nama kelas dan tahun ajaran wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.post('/school/classes', { name, academicYear });
      if (res.data.success) {
        setShowAddModal(false);
        setName('');
        fetchClasses();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal membuat kelas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kelas ini? Seluruh data siswa terkait akan terpengaruh.')) return;

    try {
      await api.delete(`/school/classes/${id}`);
      fetchClasses();
    } catch (err) {
      alert('Gagal menghapus kelas.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between p-5 rounded-2xl bg-[#0E1424] border border-[#222F4C]">
        <div>
          <h2 className="text-base font-bold text-white">Daftar Kelas Sekolah</h2>
          <p className="text-xs text-slate-400 mt-0.5">Siswa akan memilih salah satu kelas ini saat melakukan registrasi mandiri di aplikasi mobile.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] text-[#080C15] font-extrabold text-xs transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.25)]"
        >
          <Plus size={16} />
          <span>Tambah Kelas Baru</span>
        </button>
      </div>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : classes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0E1424] border border-[#222F4C]">
          <GraduationCap size={48} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">Belum Ada Kelas</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Buat kelas pertama Anda (contoh: Kelas X IPA 1) agar siswa dapat mendaftar dan mengikuti ujian.
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
          {classes.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-[#0E1424] border border-[#222F4C] hover:border-[#00E5FF]/40 transition group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#141C30] border border-[#222F4C] flex items-center justify-center text-[#00E5FF]">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-[#00E5FF] transition">{c.name}</h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <Calendar size={12} />
                      <span>{c.academicYear}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  title="Hapus Kelas"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-[#222F4C] flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Siswa Terdaftar:</span>
                <span className="font-bold text-white">{c._count?.students || 0} Siswa</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0E1424] border border-[#222F4C] p-6 rounded-3xl shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Tambah Kelas Baru</h3>
            <p className="text-xs text-slate-400 mb-5">Tentukan nama kelas dan tahun ajaran aktif</p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Kelas</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kelas X IPA 1 atau XII RPL 2"
                  className="w-full px-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tahun Ajaran</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="Contoh: 2026/2027"
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
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
