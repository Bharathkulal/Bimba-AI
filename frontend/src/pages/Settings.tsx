import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Bell, Shield, Keyboard, Volume2, ArrowLeft, KeyRound, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'security'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
      showToast('Password updated successfully. Future logins must use your new password.', 'success');
      reset();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update password. Verify your current password.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const settingOptions = [
    { id: 'notifications', title: 'Notifications', desc: 'Manage your email and in-app alerts', icon: Bell },
    { id: 'security', title: 'Security', desc: 'Manage password, 2FA, and sessions', icon: Shield },
    { id: 'accessibility', title: 'Accessibility', desc: 'Shortcuts and UI preferences', icon: Keyboard },
    { id: 'sounds', title: 'Sounds & Haptics', desc: 'Interface audio cues', icon: Volume2 },
  ];

  return (
    <div className="flex flex-col gap-8 text-left max-w-4xl mx-auto relative px-4">
      
      {/* Toast Notification Container */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-xl animate-fadeIn ${
          toast.type === 'success' 
            ? 'bg-emerald-50/90 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50/90 border-rose-100 text-rose-800'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
          ) : (
            <AlertTriangle className="text-rose-500 shrink-0" size={20} />
          )}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {activeTab === 'overview' && (
        <>
          <PageHeader
            title="Settings"
            description="Configure your workspace and preferences"
          />

          <div className="flex flex-col gap-4">
            {settingOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <Card key={opt.id} className="flex items-center justify-between p-6 bg-white/70 border border-slate-200/50 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-smooth">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">{opt.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="hover:border-blue-600 hover:text-blue-600 font-semibold"
                    onClick={() => {
                      if (opt.id === 'security') {
                        setActiveTab('security');
                      } else {
                        showToast(`${opt.title} settings module is managed globally by the university.`, 'error');
                      }
                    }}
                  >
                    Configure
                  </Button>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'security' && (
        <>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('overview')}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <PageHeader
              title="Security Settings"
              description="Manage passwords and device sessions"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Info Card */}
            <Card className="md:col-span-1 p-6 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 border border-blue-100/50 rounded-2xl flex flex-col gap-4 text-slate-700">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm shadow-blue-500/5">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Security Recommendation</h4>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold">
                  By default, your password is initialized to your Date of Birth. It is highly recommended to update to a strong password to protect your academic records.
                </p>
              </div>
              <div className="text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-3 flex flex-col gap-1.5">
                <span>• Password must be at least 8 characters.</span>
                <span>• Avoid using common dates or names.</span>
              </div>
            </Card>

            {/* Change Password Form Card */}
            <Card className="md:col-span-2 p-8 bg-white border border-slate-200/60 shadow-lg shadow-slate-100/50 rounded-3xl backdrop-blur-md">
              <div className="flex items-center gap-2.5 mb-6 border-b border-slate-100 pb-4">
                <KeyRound className="text-slate-400" size={18} />
                <h3 className="font-extrabold text-base text-slate-800">Change Password</h3>
              </div>

              <form onSubmit={handleSubmit(handleUpdatePassword)} className="flex flex-col gap-5">
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
                  placeholder="Enter at least 8 characters"
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

                <div className="flex justify-end gap-3.5 border-t border-slate-100 pt-6 mt-2">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => setActiveTab('overview')}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    isLoading={isLoading}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </Card>

          </div>
        </>
      )}

    </div>
  );
};
export default Settings;
