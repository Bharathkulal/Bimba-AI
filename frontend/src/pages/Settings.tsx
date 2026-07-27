import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { 
  Bell, Shield, Keyboard, Volume2, ArrowLeft, KeyRound, 
  CheckCircle2, AlertTriangle, ShieldCheck, Sun, Moon, Laptop,
  Eye, Lock, Trash2, Key, LogOut
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUserStore as useStore } from '../store/userStore';
import { apiClient } from '../services/api';

const changePasswordSchema = z.object({
  current_password: z.string().min(1, { message: 'Current password is required' }),
  new_password: z.string().min(8, { message: 'New password must be at least 8 characters long' }),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Confirm password doesn't match",
  path: ['confirm_password'],
});

type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;

export const Settings: React.FC = () => {
  const logout = useStore((state) => state.logout);
  const [activeCategory, setActiveCategory] = useState<'theme' | 'notifications' | 'security' | 'api' | 'danger'>('theme');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // RapidAPI config state
  const [rapidApiKey, setRapidApiKey] = useState('********************************');
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);

  // Form hooks
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUpdatePassword = async (data: ChangePasswordSchema) => {
    setIsLoading(true);
    try {
      await apiClient.post('/api/auth/change-password', {
        current_password: data.current_password,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });
      showToast('Password updated successfully.', 'success');
      reset();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    if (confirm("WARNING: Are you sure you want to permanently delete your Bimba AI account? This action is IRREVERSIBLE.")) {
      alert("Account deletion request submitted to the academic administrator.");
    }
  };

  const saveApiConfig = () => {
    showToast("API configurations saved successfully.", "success");
  };

  const categories = [
    { id: 'theme', label: 'Theme & Styling', icon: Sun, desc: 'Manage color preferences' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Alert and email updates' },
    { id: 'security', label: 'Password & Security', icon: Shield, desc: 'Change password and protect credentials' },
    { id: 'api', label: 'API Configuration', icon: Key, desc: 'Setup RapidAPI integrations' },
    { id: 'danger', label: 'Danger Zone', icon: Trash2, desc: 'Log out or delete account' },
  ];

  return (
    <div className="flex flex-col gap-6 text-left max-w-7xl mx-auto relative w-full">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border animate-fadeIn ${
          toast.type === 'success' 
            ? 'bg-[#F8F8F8] border-[#E5E7EB] -[#111111]' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="-[#111111] shrink-0" size={20} />
          ) : (
            <AlertTriangle className="text-rose-500 shrink-0" size={20} />
          )}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      <PageHeader
        title="Settings"
        description="Configure your workspace preferences, theme colors, passwords, and external API keys."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Category Navigator */}
        <div className="lg:col-span-4 flex flex-col gap-2.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`p-4 border rounded-2xl flex items-center gap-3.5 text-left cursor-pointer transition-all ${
                  isActive 
                    ? 'bg-[#F8F8F8] -[#111111] shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-slate-350'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-[#F8F8F8] -[#111111]' : 'bg-slate-50 text-slate-400'
                }`}>
                  <Icon size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">{cat.label}</h4>
                  <p className="text-[10px] text-slate-450 mt-0.5 font-semibold">{cat.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side: Active Settings Panel */}
        <div className="lg:col-span-8">
          <Card className="p-6 h-full flex flex-col justify-between gap-6 hover:border-slate-200">
            
            {/* Category Theme Panel */}
            {activeCategory === 'theme' && (
              <div className="flex flex-col gap-5 text-left">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Theme Preference</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">Select how Bimba AI is displayed on your screen.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 -[#111111] bg-[#F8F8F8] cursor-pointer">
                    <Sun className="-[#111111]" size={24} />
                    <span className="text-xs font-bold text-slate-855">Light Mode</span>
                  </button>
                  <button 
                    onClick={() => showToast("Dark Mode theme is handled globally. Switching is disabled.", "error")}
                    className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-slate-200 hover:border-slate-350 bg-white cursor-pointer"
                  >
                    <Moon className="text-slate-400" size={24} />
                    <span className="text-xs font-bold text-slate-700">Dark Mode</span>
                  </button>
                  <button 
                    onClick={() => showToast("System theme configuration is handled globally.", "error")}
                    className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-slate-200 hover:border-slate-350 bg-white cursor-pointer"
                  >
                    <Laptop className="text-slate-400" size={24} />
                    <span className="text-xs font-bold text-slate-700">System Mode</span>
                  </button>
                </div>
              </div>
            )}

            {/* Category Notifications Panel */}
            {activeCategory === 'notifications' && (
              <div className="flex flex-col gap-5 text-left">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Notification Preferences</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">Choose how and when you receive career alerts.</p>
                </div>

                <div className="flex flex-col gap-4">
                  {[
                    { id: 'jobs', label: 'New Recommended Jobs', desc: 'Alert me immediately when a high score match is found' },
                    { id: 'resume', label: 'ATS Analysis Complete', desc: 'Send notification when uploader parsing analysis finishes' },
                    { id: 'admin', label: 'Academic Placement Bulletins', desc: 'Receive campus recruitment alerts and announcements' }
                  ].map((notif) => (
                    <div key={notif.id} className="flex items-start justify-between p-4 border border-slate-150 rounded-xl">
                      <div className="text-left pr-4">
                        <p className="font-bold text-xs text-slate-800 leading-tight">{notif.label}</p>
                        <p className="text-[10px] text-slate-450 mt-1 font-semibold leading-relaxed">{notif.desc}</p>
                      </div>
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        className="w-4 h-4 rounded -[#111111] focus:-[#111111] border-slate-300 mt-0.5 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Security Panel */}
            {activeCategory === 'security' && (
              <div className="flex flex-col gap-5 text-left">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Change Password</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">Update your credentials to secure your student portal.</p>
                </div>

                <form onSubmit={handleSubmit(handleUpdatePassword)} className="flex flex-col gap-4">
                  <Input
                    id="current_password"
                    label="Current Password"
                    type="password"
                    placeholder="Enter current password"
                    error={errors.current_password?.message}
                    {...register('current_password')}
                  />
                  <Input
                    id="new_password"
                    label="New Password"
                    type="password"
                    placeholder="Enter new strong password"
                    error={errors.new_password?.message}
                    {...register('new_password')}
                  />
                  <Input
                    id="confirm_password"
                    label="Confirm Password"
                    type="password"
                    placeholder="Re-enter new password"
                    error={errors.confirm_password?.message}
                    {...register('confirm_password')}
                  />
                  <div className="flex justify-end pt-3">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      isLoading={isLoading}
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Category API Panel */}
            {activeCategory === 'api' && (
              <div className="flex flex-col gap-5 text-left">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">API Configuration</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">Setup access tokens for search and job APIs.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">RapidAPI Key (Host: linkedin-job-search-api)</label>
                    <div className="relative flex items-center">
                      <input
                        type={isApiKeyVisible ? 'text' : 'password'}
                        value={rapidApiKey}
                        onChange={(e) => setRapidApiKey(e.target.value)}
                        className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:-[#111111] font-semibold"
                      />
                      <button
                        onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                        className="absolute right-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <Button 
                      onClick={saveApiConfig}
                      variant="primary"
                    >
                      Save Configuration
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Category Danger Zone Panel */}
            {activeCategory === 'danger' && (
              <div className="flex flex-col gap-5 text-left">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-rose-600 uppercase tracking-wider">Danger Zone</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">High risk options. These operations are destructive.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="p-4 border border-rose-100 bg-rose-50/20 rounded-xl flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 leading-tight">Delete Account</h5>
                      <p className="text-[10px] text-slate-405 mt-1 font-medium">Permanently delete your profile and all resumes.</p>
                    </div>
                    <Button 
                      onClick={handleDeleteAccount}
                      variant="danger" 
                      size="sm"
                    >
                      Delete Account
                    </Button>
                  </div>

                  <div className="p-4 border border-slate-200 bg-slate-50/20 rounded-xl flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 leading-tight">Sign Out Session</h5>
                      <p className="text-[10px] text-slate-405 mt-1 font-medium">Log out of the current device portal.</p>
                    </div>
                    <Button 
                      onClick={() => logout()}
                      variant="secondary" 
                      size="sm"
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </Card>
        </div>

      </div>

    </div>
  );
};

export default Settings;
