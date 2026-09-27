import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { RegisterSchool } from './pages/RegisterSchool';
import { DashboardLayout } from './components/DashboardLayout';

import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';
import { SchoolsManagement } from './pages/superadmin/SchoolsManagement';

import { SchoolDashboard } from './pages/school/SchoolDashboard';
import { ClassesManagement } from './pages/school/ClassesManagement';
import { TeachersManagement } from './pages/school/TeachersManagement';

import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { QuestionBanks } from './pages/teacher/QuestionBanks';
import { ExamsManagement } from './pages/teacher/ExamsManagement';
import { ExamRecap } from './pages/teacher/ExamRecap';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080C15] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'SUPERADMIN') return <Navigate to="/superadmin/dashboard" replace />;
  if (user.role === 'SCHOOL_ADMIN') return <Navigate to="/school/dashboard" replace />;
  if (user.role === 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register-school" element={<RegisterSchool />} />

          {/* Protected Dashboard Layout */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Super Admin Routes */}
            <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/superadmin/schools" element={<SchoolsManagement />} />

            {/* School Admin Routes */}
            <Route path="/school/dashboard" element={<SchoolDashboard />} />
            <Route path="/school/classes" element={<ClassesManagement />} />
            <Route path="/school/teachers" element={<TeachersManagement />} />

            {/* Teacher Routes */}
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/question-banks" element={<QuestionBanks />} />
            <Route path="/teacher/exams" element={<ExamsManagement />} />
            <Route path="/teacher/exams/:id/recap" element={<ExamRecap />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
