import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, Sparkles, Bell } from 'lucide-react';

export const Navbar: React.FC<{ title?: string }> = ({ title = 'Dashboard' }) => {
  const { user, school } = useAuth();

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'SUPERADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Sparkles size={12} />
            SUPER ADMIN
          </span>
        );
      case 'SCHOOL_ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-cyan-400 border border-cyan-500/30">
            <ShieldCheck size={12} />
            ADMIN SEKOLAH
          </span>
        );
      case 'TEACHER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <UserCheck size={12} />
            GURU PENGAMPU
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="h-16 bg-[#0E1424]/80 backdrop-blur-md border-b border-[#222F4C] px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {getRoleBadge()}

        {/* Server Connected Dot */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#141C30] border border-[#222F4C] text-[11px] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>VPS Active (43.157.203.140)</span>
        </div>
      </div>
    </header>
  );
};
