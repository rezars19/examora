import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/superadmin/schools')) return 'Approval Sekolah';
    if (path.includes('/superadmin/dashboard')) return 'Ringkasan Platform';
    if (path.includes('/school/subjects')) return 'Mata Pelajaran';
    if (path.includes('/school/classes')) return 'Manajemen Kelas';
    if (path.includes('/school/teachers')) return 'Manajemen Guru';
    if (path.includes('/school/dashboard')) return 'Dashboard Sekolah';
    if (path.includes('/teacher/question-banks')) return 'Bank Soal';
    if (path.includes('/teacher/exams')) return 'Jadwal & Token Ujian';
    if (path.includes('/teacher/dashboard')) return 'Dashboard Guru';
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen dark:bg-[#080C15] bg-[#F8FAFC] overflow-hidden transition-colors">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          ></div>
          <div className="relative z-10 w-64 h-full shadow-2xl">
            <Sidebar onCloseMobile={() => setIsMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          title={getPageTitle()}
          onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
