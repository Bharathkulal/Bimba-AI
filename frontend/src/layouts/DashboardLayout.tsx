import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export const DashboardLayout: React.FC = () => {

  // For setup phase, let's allow viewing dashboard even without logging in.
  // We can mock it or check. To make it functional for preview, we can mock authenticated to true or bypass.
  // Let's bypass checks for now or initialize authenticated state as true in a mock way if needed, or simply not redirect.
  // Let's not redirect for the sake of demo, so the user can click around.
  
  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-grow pl-64 min-h-screen flex flex-col">
        <main className="p-8 flex-grow">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
