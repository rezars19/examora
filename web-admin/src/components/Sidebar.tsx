import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  FileQuestion,
  CalendarCheck,
  BarChart3,
  LogOut,
  ShieldCheck,
  School as SchoolIcon,
  BookOpen,
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export const Sidebar: React.FC = () => {
  const { user, school, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLinks = () => {
    if (user?.role === 'SUPERADMIN') {
      return [
        { to: '/superadmin/dashboard', label: 'Ringkasan Platform', icon: LayoutDashboard },
        { to: '/superadmin/schools', label: 'Approval Sekolah', icon: Building2 },
      ];
    }

    if (user?.role === 'SCHOOL_ADMIN') {
      return [
        { to: '/school/dashboard', label: 'Dashboard Sekolah', icon: LayoutDashboard },
        { to: '/school/subjects', label: 'Mata Pelajaran', icon: BookOpen },
        { to: '/school/classes', label: 'Manajemen Kelas', icon: GraduationCap },
        { to: '/school/teachers', label: 'Manajemen Guru', icon: Users },
      ];
    }

    if (user?.role === 'TEACHER') {
      return [
        { to: '/teacher/dashboard', label: 'Dashboard Guru', icon: LayoutDashboard },
        { to: '/teacher/question-banks', label: 'Bank Soal', icon: FileQuestion },
        { to: '/teacher/exams', label: 'Jadwal & Token Ujian', icon: CalendarCheck },
      ];
    }

    return [];
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-[#0E1424] border-r border-[#222F4C] flex flex-col justify-between shrink-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-[#222F4C]">
          <div className="relative">
            <div className="absolute inset-0 bg-[#00E5FF] blur-md opacity-30 rounded-full"></div>
            <img src={logoImg} alt="Examora" className="w-10 h-10 relative object-contain" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-cyan-200 to-[#00E5FF] bg-clip-text text-transparent">
              Examora
            </h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">
              {user?.role === 'SUPERADMIN' ? 'SUPER PORTAL' : 'EXAM PORTAL'}
            </p>
          </div>
        </div>

        {/* Current Tenant / School Badge */}
        {school && (
          <div className="px-5 py-4 mx-3 my-3 bg-[#141C30] rounded-xl border border-[#222F4C]/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1A243D] flex items-center justify-center text-[#00E5FF]">
              <SchoolIcon size={18} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{school.name}</p>
              <p className="text-[10px] text-cyan-400 font-mono">#{school.code}</p>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="p-3 space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00E5FF]/20 to-[#0284C7]/10 text-[#00E5FF] border border-[#00E5FF]/30 shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                      : 'text-slate-400 hover:text-white hover:bg-[#141C30]'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-[#222F4C]">
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#141C30] border border-[#222F4C]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00E5FF] to-[#1D4ED8] flex items-center justify-center font-bold text-[#080C15] shrink-0">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.identifier}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
