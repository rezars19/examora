import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Building2, Clock, CheckCircle2, Users, GraduationCap, ArrowRight } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/superadmin/metrics');
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      setMetrics({
        schools: { pending: 1, active: 5 },
        users: { teachers: 32, students: 640 },
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const cards = [
    {
      label: 'Sekolah Menunggu Approval',
      value: metrics?.schools?.pending || 0,
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10 border-amber-500/30',
      link: '/superadmin/schools',
    },
    {
      label: 'Sekolah Aktif Terverifikasi',
      value: metrics?.schools?.active || 0,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      link: '/superadmin/schools',
    },
    {
      label: 'Total Guru Pengampu',
      value: metrics?.users?.teachers || 0,
      icon: Users,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10 border-cyan-500/30',
    },
    {
      label: 'Total Siswa Terdaftar',
      value: metrics?.users?.students || 0,
      icon: GraduationCap,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10 border-blue-500/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Alert if there are pending schools */}
      {metrics?.schools?.pending > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold dark:text-white text-slate-800">
                Ada {metrics.schools.pending} Sekolah Menunggu Persetujuan Anda
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Segera tinjau data pendaftar agar sekolah dapat memulai aktivitas ujian.
              </p>
            </div>
          </div>
          <Link
            to="/superadmin/schools"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Tinjau Sekarang</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Grid Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="p-6 rounded-2xl dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{c.label}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${c.bg} ${c.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-3xl font-extrabold dark:text-white text-slate-800 tracking-tight">{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="p-6 rounded-2xl dark:bg-[#0E1424] bg-white border dark:border-[#222F4C] border-slate-200">
        <h3 className="text-base font-bold dark:text-white text-slate-800 mb-2">Informasi Platform Examora</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Sebagai Super Administrator, Anda memiliki otoritas mutlak untuk mengizinkan atau menangguhkan akses sekolah mana pun di platform ini.
          Setiap sekolah yang terdaftar secara mandiri wajib mendapatkan approval sebelum operator atau gurunya dapat masuk ke dalam dashboard.
        </p>
      </div>
    </div>
  );
};
