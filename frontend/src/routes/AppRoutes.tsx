import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { apiClient } from '../services/api';

// Layouts
import { DefaultLayout } from '../layouts/DefaultLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Lazy Loaded Pages
const LandingPage = lazy(() => import('../pages/LandingPage').then(module => ({ default: module.LandingPage })));
const Login = lazy(() => import('../pages/Login').then(module => ({ default: module.Login })));
const Dashboard = lazy(() => import('../pages/Dashboard').then(module => ({ default: module.Dashboard })));
const ResumePage = lazy(() => import('../pages/ResumePage').then(module => ({ default: module.ResumePage })));
const ResumeBuilder = lazy(() => import('../pages/ResumeBuilder').then(module => ({ default: module.ResumeBuilder })));
const Profile = lazy(() => import('../pages/Profile').then(module => ({ default: module.Profile })));
const Settings = lazy(() => import('../pages/Settings').then(module => ({ default: module.Settings })));
const AdminLogin = lazy(() => import('../pages/AdminLogin').then(module => ({ default: module.AdminLogin })));
const NotFound = lazy(() => import('../pages/NotFound').then(module => ({ default: module.NotFound })));
const Notifications = lazy(() => import('../pages/Notifications').then(module => ({ default: module.Notifications })));

// Jobs Module Pages
const JobsDashboard = lazy(() => import('../pages/jobs/JobsDashboard').then(module => ({ default: module.JobsDashboard })));
const JobDetails = lazy(() => import('../pages/jobs/JobDetails').then(module => ({ default: module.JobDetails })));
const SavedJobs = lazy(() => import('../pages/jobs/SavedJobs').then(module => ({ default: module.SavedJobs })));
const Applications = lazy(() => import('../pages/jobs/Applications').then(module => ({ default: module.Applications })));

// Companies Page
const Companies = lazy(() => import('../pages/Companies').then(module => ({ default: module.Companies })));

// Modular Admin Pages
const AdminDashboardOverview = lazy(() => import('../pages/admin/AdminDashboardOverview').then(module => ({ default: module.AdminDashboardOverview })));
const UsersModule = lazy(() => import('../pages/admin/UsersModule').then(module => ({ default: module.UsersModule })));
const StudentsModule = lazy(() => import('../pages/admin/StudentsModule').then(module => ({ default: module.StudentsModule })));
const ResumeModule = lazy(() => import('../pages/admin/ResumeModule').then(module => ({ default: module.ResumeModule })));
const DatasetsModule = lazy(() => import('../pages/admin/DatasetsModule').then(module => ({ default: module.DatasetsModule })));
const DepartmentsModule = lazy(() => import('../pages/admin/DepartmentsModule').then(module => ({ default: module.DepartmentsModule })));
const SubjectsModule = lazy(() => import('../pages/admin/SubjectsModule').then(module => ({ default: module.SubjectsModule })));
const AnnouncementsModule = lazy(() => import('../pages/admin/AnnouncementsModule').then(module => ({ default: module.AnnouncementsModule })));
const EmailModule = lazy(() => import('../pages/admin/EmailModule').then(module => ({ default: module.EmailModule })));
const ReportsModule = lazy(() => import('../pages/admin/ReportsModule').then(module => ({ default: module.ReportsModule })));
const BackupsModule = lazy(() => import('../pages/admin/BackupsModule').then(module => ({ default: module.BackupsModule })));
const AdminRolesModule = lazy(() => import('../pages/admin/AdminRolesModule').then(module => ({ default: module.AdminRolesModule })));
const MonitorModule = lazy(() => import('../pages/admin/MonitorModule').then(module => ({ default: module.MonitorModule })));
const SecurityModule = lazy(() => import('../pages/admin/SecurityModule').then(module => ({ default: module.SecurityModule })));
const LogsModule = lazy(() => import('../pages/admin/LogsModule').then(module => ({ default: module.LogsModule })));
const SettingsModule = lazy(() => import('../pages/admin/SettingsModule').then(module => ({ default: module.SettingsModule })));
const AiGatewayModule = lazy(() => import('../pages/admin/AiGatewayModule').then(module => ({ default: module.AiGatewayModule })));

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
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
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

const SuspenseLoader: React.FC = () => (
  <div className="min-h-[400px] flex items-center justify-center w-full">
    <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<SuspenseLoader />}>
        <Routes>
          {/* Guest Routes */}
          <Route element={<GuestRoute />}>
            <Route element={<DefaultLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
            </Route>
          </Route>

          {/* Dashboard Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/resume" element={<ResumePage />} />
              <Route path="/resume-builder" element={<ResumeBuilder />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/companies" element={<Companies />} />
              
              {/* Jobs Routes */}
              <Route path="/jobs" element={<JobsDashboard />} />
              <Route path="/jobs/:id" element={<JobDetails />} />
              <Route path="/jobs/saved" element={<SavedJobs />} />
              <Route path="/jobs/applications" element={<Applications />} />
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
      </Suspense>
    </BrowserRouter>
  );
};
export default AppRoutes;
