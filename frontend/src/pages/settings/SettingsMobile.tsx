import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Shield, Trash2, ArrowLeft, CheckCircle2, 
  Laptop, LogOut, Lock, ChevronRight
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useUserStore } from '../../store/userStore';

export const SettingsMobile: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useUserStore();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="container mx-auto px-2 py-4 flex flex-col gap-5 text-left min-h-screen pb-20">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border animate-fadeIn text-xs font-bold bg-slate-900 border-slate-800 text-white`}>
          <CheckCircle2 size={15} className="text-emerald-500" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">Customize preferences and account status</p>
        </div>
      </div>

      {/* Grouped Settings Cards */}
      <div className="flex flex-col gap-4">
        
        {/* Category 1: Preferences */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider px-1">App Preferences</h3>
          <div className="flex flex-col bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <Bell size={15} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Push Notifications</span>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-slate-900 dark:accent-white" />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Laptop size={15} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">System Theme Sync</span>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-slate-900 dark:accent-white" />
            </div>
          </div>
        </div>


        {/* Category 3: Danger Zone */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider px-1">Account Actions</h3>
          <div className="flex flex-col bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={handleLogout}
              className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 text-left text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <LogOut size={15} className="text-slate-500" />
                <span className="text-xs font-bold">Sign Out</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            <button
              onClick={() => {
                if (confirm("Delete your account?")) {
                  showToast("Deletion request queued.");
                }
              }}
              className="flex items-center justify-between p-4 hover:bg-rose-50/20 text-left text-rose-600 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Trash2 size={15} />
                <span className="text-xs font-bold">Delete Account</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
