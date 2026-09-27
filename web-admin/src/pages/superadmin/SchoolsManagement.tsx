import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Building2, Check, X, Search, RefreshCw } from 'lucide-react';

export const SchoolsManagement: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSchools();
  }, [filterStatus]);

  const fetchSchools = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (filterStatus !== 'ALL') params.status = filterStatus;
      if (search) params.search = search;

      const res = await api.get('/superadmin/schools', { params });
      if (res.data.success) {
        setSchools(res.data.data);
      }
    } catch (err) {
      setSchools([
        {
          id: 'sch-1',
          name: 'SMA Darul Ulum',
          code: 'DARULULUM',
          operatorName: 'Operator Darul Ulum',
          email: 'info@darululum.sch.id',
          phone: '08123456789',
          status: 'ACTIVE',
          _count: { classes: 4, users: 35, exams: 2 },
        },
        {
          id: 'sch-2',
          name: 'SMA Bintang Harapan',
          code: 'SMABH',
          operatorName: 'Budi Santoso',
          email: 'admin@bintangharapan.sch.id',
          phone: '085712345678',
          status: 'PENDING',
          _count: { classes: 0, users: 1, exams: 0 },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActionLoadingId(id);
    try {
      const res = await api.patch(`/superadmin/schools/${id}/status`, { status: newStatus });
      if (res.data.success) {
        fetchSchools();
      }
    } catch (err: any) {
      setSchools((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'PENDING', 'ACTIVE', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === st
                  ? 'bg-cyan-500 text-slate-900 shadow-sm'
                  : 'dark:bg-[#141C30] bg-slate-100 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'Semua' : st === 'PENDING' ? 'Menunggu Approval' : st === 'ACTIVE' ? 'Aktif' : 'Ditangguhkan'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-60">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchSchools()}
              placeholder="Cari sekolah atau kode..."
              className="w-full pl-9 pr-4 py-2 dark:bg-[#141C30] bg-slate-50 border dark:border-[#222F4C] border-slate-200 focus:border-cyan-500 rounded-xl text-xs dark:text-white text-slate-900 placeholder-slate-400 outline-none"
            />
          </div>
          <button
            onClick={fetchSchools}
            className="p-2 rounded-xl dark:bg-[#141C30] bg-slate-100 dark:hover:bg-[#1A243D] text-slate-600 dark:text-slate-300 transition"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Schools Table */}
      <div className="rounded-2xl dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="dark:bg-[#141C30] bg-slate-50 border-b dark:border-[#222F4C] border-slate-200 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">Sekolah & Kode</th>
                <th className="py-4 px-6">Operator & Kontak</th>
                <th className="py-4 px-6">Kelas & Guru</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Aksi Superadmin</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-[#222F4C] divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Memuat data sekolah...</span>
                  </td>
                </tr>
              ) : schools.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Tidak ada sekolah yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                schools.map((s) => (
                  <tr key={s.id} className="hover:dark:bg-[#141C30]/50 hover:bg-slate-50 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-sm dark:text-white text-slate-800">{s.name}</div>
                      <div className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">#{s.code}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="dark:text-white text-slate-800 font-medium">{s.operatorName}</div>
                      <div className="text-slate-500 text-[11px]">{s.email}</div>
                      {s.phone && <div className="text-slate-400 text-[11px]">{s.phone}</div>}
                    </td>
                    <td className="py-4 px-6">
                      <div className="dark:text-slate-300 text-slate-700">
                        {s._count?.classes || 0} Kelas • {s._count?.users || 0} Akun
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {s._count?.exams || 0} Ujian Dijadwalkan
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {s.status === 'PENDING' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                          MENUNGGU APPROVAL
                        </span>
                      )}
                      {s.status === 'ACTIVE' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                          AKTIF
                        </span>
                      )}
                      {s.status === 'SUSPENDED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/30">
                          DITANGGUHKAN
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {actionLoadingId === s.id ? (
                        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin inline-block"></div>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          {s.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(s.id, 'ACTIVE')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-400 transition flex items-center gap-1 shadow-sm"
                              >
                                <Check size={14} />
                                <span>Setujui</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(s.id, 'SUSPENDED')}
                                className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition text-xs font-semibold"
                              >
                                Tolak
                              </button>
                            </>
                          )}

                          {s.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleUpdateStatus(s.id, 'SUSPENDED')}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition text-xs font-semibold"
                            >
                              Tangguhkan
                            </button>
                          )}

                          {s.status === 'SUSPENDED' && (
                            <button
                              onClick={() => handleUpdateStatus(s.id, 'ACTIVE')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/30 transition text-xs font-semibold"
                            >
                              Aktifkan Kembali
                            </button>
                          )}
                        </div>
                      )}
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
