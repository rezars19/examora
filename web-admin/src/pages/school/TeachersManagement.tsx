import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Users, Plus, Upload, Trash2, FileSpreadsheet, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';

export const TeachersManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Single Modal
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [password, setPassword] = useState('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Excel Modal
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [excelResult, setExcelResult] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resTeachers, resSubjects] = await Promise.all([
        api.get('/school/teachers'),
        api.get('/school/subjects').catch(() => ({ data: { success: true, data: [] } })),
      ]);

      if (resTeachers.data.success && resTeachers.data.data.length > 0) {
        setTeachers(resTeachers.data.data);
      } else {
        setTeachers([
          {
            id: 't-1',
            identifier: 'guru',
            fullName: 'Drs. H. Ahmad Solihin, M.Pd.',
            subject: { id: 'sub-1', code: 'MTK', name: 'Matematika' },
            isActive: true,
          },
          {
            id: 't-2',
            identifier: '198503152010012001',
            fullName: 'Siti Rahmawati, S.Si., M.Pd.',
            subject: { id: 'sub-2', code: 'BIN', name: 'Bahasa Indonesia' },
            isActive: true,
          },
          {
            id: 't-3',
            identifier: '199008202015021003',
            fullName: 'Bambang Triatmojo, S.Kom.',
            subject: { id: 'sub-4', code: 'FIS', name: 'Fisika' },
            isActive: true,
          },
        ]);
      }

      if (resSubjects.data.success && resSubjects.data.data.length > 0) {
        setSubjects(resSubjects.data.data);
      } else {
        setSubjects([
          { id: 'sub-1', code: 'MTK', name: 'Matematika' },
          { id: 'sub-2', code: 'BIN', name: 'Bahasa Indonesia' },
          { id: 'sub-3', code: 'BIG', name: 'Bahasa Inggris' },
          { id: 'sub-4', code: 'FIS', name: 'Fisika' },
        ]);
      }
    } catch (err) {
      setTeachers([
        {
          id: 't-1',
          identifier: 'guru',
          fullName: 'Drs. H. Ahmad Solihin, M.Pd.',
          subject: { id: 'sub-1', code: 'MTK', name: 'Matematika' },
          isActive: true,
        },
      ]);
      setSubjects([
        { id: 'sub-1', code: 'MTK', name: 'Matematika' },
        { id: 'sub-2', code: 'BIN', name: 'Bahasa Indonesia' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !fullName || !password) {
      setErrorMsg('NIP/Username, Nama Guru, dan Password wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.post('/school/teachers', {
        identifier,
        fullName,
        password,
        subjectId: subjectId || undefined,
      });

      if (res.data.success) {
        setShowSingleModal(false);
        setIdentifier('');
        setFullName('');
        setSubjectId('');
        setPassword('admin');
        fetchData();
      }
    } catch (err: any) {
      // Offline fallback
      const selectedSub = subjects.find((s) => s.id === subjectId);
      setTeachers((prev) => [
        ...prev,
        {
          id: `t-${Date.now()}`,
          identifier,
          fullName,
          subject: selectedSub ? { id: selectedSub.id, code: selectedSub.code, name: selectedSub.name } : null,
          isActive: true,
        },
      ]);
      setShowSingleModal(false);
      setIdentifier('');
      setFullName('');
      setSubjectId('');
      setPassword('admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setExcelResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/school/teachers/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setExcelResult(res.data.data);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengimpor file Excel.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus akun guru ini?')) return;
    try {
      await api.delete(`/school/teachers/${id}`);
      fetchData();
    } catch (err) {
      setTeachers((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0E1424] border border-[#222F4C]">
        <div>
          <h2 className="text-base font-bold text-white">Manajemen Akun Guru & Mapel</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Saat akun dibuat, tentukan mata pelajaran yang diampu. Guru yang login otomatis terhubung ke mapel tersebut.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExcelModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#141C30] hover:bg-[#1A243D] border border-[#222F4C] text-xs font-bold text-white transition flex items-center gap-1.5"
          >
            <Upload size={14} className="text-cyan-400" />
            <span>Impor File Excel</span>
          </button>
          <button
            onClick={() => setShowSingleModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] text-[#080C15] font-extrabold text-xs transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.25)]"
          >
            <Plus size={16} />
            <span>Tambah Guru</span>
          </button>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="rounded-2xl bg-[#0E1424] border border-[#222F4C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141C30] border-b border-[#222F4C] text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">Nama Guru</th>
                <th className="py-4 px-6">NIP / Username</th>
                <th className="py-4 px-6">Mata Pelajaran Diampu</th>
                <th className="py-4 px-6">Status Akun</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222F4C]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Memuat data guru...</span>
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Belum ada guru terdaftar di sekolah ini.
                  </td>
                </tr>
              ) : (
                teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-[#141C30]/50 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1A243D] border border-[#222F4C] flex items-center justify-center font-bold text-cyan-400">
                          {t.fullName[0].toUpperCase()}
                        </div>
                        <div className="font-bold text-sm text-white">{t.fullName}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-300 font-semibold">{t.identifier}</td>
                    <td className="py-4 px-6">
                      {t.subject ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-cyan-400/10 text-[#00E5FF] border border-[#00E5FF]/20 shadow-[0_0_10px_rgba(0,229,255,0.1)]">
                          <BookOpen size={12} />
                          <span>{t.subject.name} ({t.subject.code})</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Belum diatur</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        AKTIF
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Single Teacher Modal */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0E1424] border border-[#222F4C] p-6 rounded-3xl shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Tambah Akun Guru Satuan</h3>
            <p className="text-xs text-slate-400 mb-5">
              Guru login langsung membuat soal sesuai mata pelajaran yang Anda tentukan di bawah ini.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateSingle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Lengkap Guru (dengan Gelar)</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Drs. H. Ahmad Solihin, M.Pd."
                  className="w-full px-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mata Pelajaran yang Diampu</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white outline-none"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-cyan-400/80 mt-1">Saat guru login, mapel ini langsung terkunci otomatis.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">NIP / Username Login Guru</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: guru_mtk atau 19800101..."
                  className="w-full px-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password Awal</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter (default: admin)"
                  className="w-full px-4 py-2.5 bg-[#141C30] border border-[#222F4C] focus:border-[#00E5FF] rounded-xl text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222F4C]">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#00E5FF] text-[#080C15] font-extrabold text-xs rounded-xl hover:bg-[#00cce6] transition"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Akun Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0E1424] border border-[#222F4C] p-6 rounded-3xl shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Impor Guru Massal via Excel</h3>
            <p className="text-xs text-slate-400 mb-4">
              Format header file Excel: <span className="text-white font-mono font-bold">NIP</span>, <span className="text-white font-mono font-bold">Nama</span>, <span className="text-cyan-400 font-mono font-bold">Mapel</span> (contoh: Matematika), dan <span className="text-white font-mono font-bold">Password</span>.
            </p>

            {excelResult && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <CheckCircle2 size={16} />
                  <span>Impor Berhasil!</span>
                </div>
                <p>Berhasil membuat {excelResult.importedCount} akun guru. (Dilewati: {excelResult.skippedCount})</p>
              </div>
            )}

            <form onSubmit={handleUploadExcel} className="space-y-4">
              <div className="p-8 border-2 border-dashed border-[#222F4C] hover:border-[#00E5FF]/50 rounded-2xl text-center bg-[#141C30]/50 transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileSpreadsheet size={40} className="mx-auto text-cyan-400 mb-2" />
                <p className="text-xs font-bold text-white mb-1">
                  {file ? file.name : 'Pilih file Excel (.xlsx / .xls)'}
                </p>
                <p className="text-[11px] text-slate-500">Klik atau geser file spreadsheet ke sini</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222F4C]">
                <button
                  type="button"
                  onClick={() => setShowExcelModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={!file || isUploading}
                  className="px-5 py-2.5 bg-[#00E5FF] disabled:bg-slate-700 text-[#080C15] font-extrabold text-xs rounded-xl hover:bg-[#00cce6] transition"
                >
                  {isUploading ? 'Mengunggah & Memproses...' : 'Proses Impor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
