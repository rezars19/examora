import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/superadmin/schools')) return 'Approval & Manajemen Sekolah';
    if (path.includes('/superadmin/dashboard')) return 'Statistik & Ringkasan Platform';
    if (path.includes('/school/subjects')) return 'Master Mata Pelajaran Sekolah';
    if (path.includes('/school/classes')) return 'Manajemen Kelas & Tahun Ajaran';
    if (path.includes('/school/teachers')) return 'Manajemen Akun Guru';
    if (path.includes('/school/dashboard')) return 'Dashboard Admin Sekolah';
    if (path.includes('/teacher/question-banks')) return 'Bank Soal & Butir Ujian';
    if (path.includes('/teacher/exams')) return 'Jadwal, Token & Monitoring Ujian';
    if (path.includes('/teacher/dashboard')) return 'Dashboard Pengajar';
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-[#080C15] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar title={getPageTitle()} />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
