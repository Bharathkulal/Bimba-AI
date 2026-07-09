import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

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
import { AdminDashboard } from '../pages/AdminDashboard';
import { NotFound } from '../pages/NotFound';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default / Guest Layout */}
        <Route element={<DefaultLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/activate" element={<Activate />} />
        </Route>

        {/* Dashboard Layout */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/resume-builder" element={<ResumeBuilder />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Admin Portal Layout */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminDashboard />} />
          <Route path="/admin/resumes" element={<AdminDashboard />} />
          <Route path="/admin/templates" element={<AdminDashboard />} />
          <Route path="/admin/ai" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<AdminDashboard />} />
          <Route path="/admin/security" element={<AdminDashboard />} />
          <Route path="/admin/logs" element={<AdminDashboard />} />
          <Route path="/admin/settings" element={<AdminDashboard />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRoutes;
