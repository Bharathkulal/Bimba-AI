import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { apiClient } from '../services/api';

// Layouts
import { DefaultLayout } from '../layouts/DefaultLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Pages
import { LandingPage } from '../pages/LandingPage';
import { Login } from '../pages/Login';
import { Activate } from '../pages/Activate';
import { Dashboard } from '../pages/Dashboard';
import { ResumeBuilder } from '../pages/ResumeBuilder';
import { Profile } from '../pages/Profile';
import { Settings } from '../pages/Settings';
import { AdminLogin } from '../pages/AdminLogin';
import { NotFound } from '../pages/NotFound';
import { Notifications } from '../pages/Notifications';


// Modular Admin Pages
import { AdminDashboardOverview } from '../pages/admin/AdminDashboardOverview';
import { UsersModule } from '../pages/admin/UsersModule';
import { StudentsModule } from '../pages/admin/StudentsModule';
import { ResumeModule } from '../pages/admin/ResumeModule';
import { DatasetsModule } from '../pages/admin/DatasetsModule';
import { DepartmentsModule } from '../pages/admin/DepartmentsModule';
import { SubjectsModule } from '../pages/admin/SubjectsModule';
import { AnnouncementsModule } from '../pages/admin/AnnouncementsModule';
import { EmailModule } from '../pages/admin/EmailModule';
import { ReportsModule } from '../pages/admin/ReportsModule';
import { BackupsModule } from '../pages/admin/BackupsModule';
import { AdminRolesModule } from '../pages/admin/AdminRolesModule';
import { MonitorModule } from '../pages/admin/MonitorModule';
import { SecurityModule } from '../pages/admin/SecurityModule';
import { LogsModule } from '../pages/admin/LogsModule';
import { SettingsModule } from '../pages/admin/SettingsModule';
import { AiGatewayModule } from '../pages/admin/AiGatewayModule';

// Route Guards
const ProtectedRoute: React.FC = () => {
  const { user, token, setUser, logout } = useUserStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token && !user) {
        try {
          const res = await apiClient.get('/api/auth/me');
          setUser(res.data, token);
        } catch (err) {
          logout();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token, user, setUser, logout]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const GuestRoute: React.FC = () => {
  const token = useUserStore((state) => state.token);
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

const AdminProtectedRoute: React.FC = () => {
  const adminToken = localStorage.getItem('admin_token');
  if (!adminToken) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
};

const AdminGuestRoute: React.FC = () => {
  const adminToken = localStorage.getItem('admin_token');
  if (adminToken) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Outlet />;
};

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest Routes */}
        <Route element={<GuestRoute />}>
          <Route element={<DefaultLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/activate" element={<Activate />} />
          </Route>
        </Route>

        {/* Dashboard Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/resume-builder" element={<ResumeBuilder />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>
        </Route>

        {/* Admin Portal Layout */}
        <Route element={<AdminGuestRoute />}>
          <Route path="/admin/login" element={<AdminLogin />} />
        </Route>
        
        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardOverview />} />
            <Route path="/admin/users" element={<UsersModule />} />
            <Route path="/admin/students" element={<StudentsModule />} />
            <Route path="/admin/resumes" element={<ResumeModule />} />
            <Route path="/admin/datasets" element={<DatasetsModule />} />
            <Route path="/admin/departments" element={<DepartmentsModule />} />
            <Route path="/admin/subjects" element={<SubjectsModule />} />
            <Route path="/admin/announcements" element={<AnnouncementsModule />} />
            <Route path="/admin/email" element={<EmailModule />} />
            <Route path="/admin/reports" element={<ReportsModule />} />
            <Route path="/admin/backups" element={<BackupsModule />} />
            <Route path="/admin/admins" element={<AdminRolesModule />} />
            <Route path="/admin/monitor" element={<MonitorModule />} />
            <Route path="/admin/notifications" element={<MonitorModule />} />
            <Route path="/admin/templates" element={<ResumeModule />} />
            <Route path="/admin/ai" element={<AiGatewayModule />} />
            <Route path="/admin/analytics" element={<ReportsModule />} />
            <Route path="/admin/security" element={<SecurityModule />} />
            <Route path="/admin/logs" element={<LogsModule />} />
            <Route path="/admin/settings" element={<SettingsModule />} />
          </Route>
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRoutes;
