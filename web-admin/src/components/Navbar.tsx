import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShieldCheck, UserCheck, Sparkles, Sun, Moon, Menu } from 'lucide-react';

interface NavbarProps {
  title?: string;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ title = 'Dashboard', onToggleMobileMenu }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'SUPERADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30">
            <Sparkles size={12} />
            SUPER ADMIN
          </span>
        );
      case 'SCHOOL_ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-[#00E5FF] border border-cyan-500/30">
            <ShieldCheck size={12} />
            ADMIN SEKOLAH
          </span>
        );
      case 'TEACHER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <UserCheck size={12} />
            GURU PENGAMPU
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="h-16 dark:bg-[#0E1424] bg-white border-b dark:border-[#222F4C] border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white dark:bg-[#141C30] bg-slate-100 transition"
          title="Buka Menu"
        >
          <Menu size={20} />
        </button>

        <h2 className="text-base md:text-lg font-bold dark:text-white text-slate-800 tracking-tight truncate max-w-[200px] sm:max-w-none">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Day / Night Theme Switcher */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Ganti ke Mode Siang' : 'Ganti ke Mode Malam'}
          className="p-2 rounded-xl border dark:border-[#222F4C] border-slate-200 dark:bg-[#141C30] bg-slate-100 text-slate-600 dark:text-yellow-400 hover:scale-105 transition"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} className="text-slate-700" />}
        </button>

        <div className="hidden sm:block">{getRoleBadge()}</div>

        {/* Server Status Dot */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full dark:bg-[#141C30] bg-slate-100 border dark:border-[#222F4C] border-slate-200 text-[11px] dark:text-slate-300 text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Online</span>
        </div>
      </div>
    </header>
  );
};
