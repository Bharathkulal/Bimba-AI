import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, CheckCircle, ShieldAlert } from 'lucide-react';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { adminService } from '../../services/api';

export const PlacementProfile: React.FC = () => {
  const [username, setUsername] = useState('placement');
  const [email, setEmail] = useState('placement@bimba.ai');
  const [role, setRole] = useState('placement_officer');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: "New passwords do not match", type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ text: "Password must be at least 6 characters", type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Since placement officer is part of admin system, we can update via change-password
      await adminService.post('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setMessage({ text: "Password updated successfully!", type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ text: err.response?.data?.detail || "Failed to update password.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold tracking-tight">Officer Profile</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
          Manage your account credentials and system settings
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs font-semibold animate-fadeIn ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-250 text-emerald-600' 
            : 'bg-rose-50 border-rose-250 text-rose-600'
        }`}>
          {message.type === 'success' ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <ShieldAlert size={16} className="shrink-0 mt-0.5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 flex flex-col gap-5">
          <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-650 flex items-center justify-center text-white font-black text-lg shadow-sm">
              P
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Placement Officer</h3>
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block mt-0.5">
                Bimba AI Administration
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-455">
              <User size={15} className="shrink-0" />
              <span>Username: <strong>{username}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-455">
              <Mail size={15} className="shrink-0" />
              <span>Email: <strong>{email}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-455">
              <Lock size={15} className="shrink-0" />
              <span>System Role: <strong className="text-emerald-500 uppercase">{role}</strong></span>
            </div>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card className="lg:col-span-2">
          <div className="border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Change Credentials</h3>
            <p className="text-[9px] text-slate-450 uppercase font-bold mt-0.5">Update account login password</p>
          </div>

          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
                Current Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
                  New Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button type="submit" variant="primary" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
export default PlacementProfile;
