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
  LogOut,
  School as SchoolIcon,
  BookOpen,
  X,
} from 'lucide-react';
import logoImg from '../assets/logo.png';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
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
    <aside className="w-64 dark:bg-[#0E1424] bg-white border-r dark:border-[#222F4C] border-slate-200 flex flex-col justify-between shrink-0 h-full transition-colors">
      <div className="overflow-y-auto">
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b dark:border-[#222F4C] border-slate-200">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Examora" className="w-9 h-9 object-contain" />
            <div>
              <h1 className="font-extrabold text-lg tracking-tight dark:text-white text-slate-900">
                Examora
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {user?.role === 'SUPERADMIN' ? 'Super Admin' : user?.role === 'SCHOOL_ADMIN' ? 'School Admin' : 'Portal Guru'}
              </p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Current Tenant Badge */}
        {school && (
          <div className="px-4 py-3 mx-3 my-3 dark:bg-[#141C30] bg-slate-100 rounded-xl border dark:border-[#222F4C] border-slate-200 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg dark:bg-[#1A243D] bg-white flex items-center justify-center text-cyan-600 dark:text-[#00E5FF] shadow-sm">
              <SchoolIcon size={16} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold dark:text-white text-slate-800 truncate">{school.name}</p>
              <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-bold">#{school.code}</p>
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
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? 'dark:bg-[#00E5FF]/15 bg-cyan-500/10 text-cyan-700 dark:text-[#00E5FF] border dark:border-[#00E5FF]/30 border-cyan-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:dark:text-white hover:text-slate-900 dark:hover:bg-[#141C30] hover:bg-slate-100'
                  }`
                }
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t dark:border-[#222F4C] border-slate-200">
        <div className="flex items-center justify-between p-2.5 rounded-xl dark:bg-[#141C30] bg-slate-100 border dark:border-[#222F4C] border-slate-200">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-cyan-500 text-slate-900 flex items-center justify-center font-extrabold text-xs shrink-0">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold dark:text-white text-slate-800 truncate">{user?.fullName}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.identifier}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar"
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
