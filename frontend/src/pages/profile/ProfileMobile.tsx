import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, MapPin, Globe, Lock, Camera, 
  Trash2, Award, Settings, LogOut, ChevronRight, CheckCircle2
} from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { adminService } from '../../services/admin';

export const ProfileMobile: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, token, logout } = useUserStore();
  const [photo, setPhoto] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      setPhoto(user.profile_photo || '');
    }
  }, [user]);

  const getCompletionPercentage = () => {
    if (!user) return 0;
    const fields = [
      user.student_name, user.phone, user.gender, user.dob, user.address, 
      user.bio, user.linkedin, user.github, user.portfolio_website, 
      user.skills, user.languages, user.career_objective, user.profile_photo
    ];
    const completed = fields.filter(f => f && f.trim() !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setPhoto(base64String);
      try {
        await adminService.apiClient.post('/api/auth/profile/upload-photo', { photo: base64String });
        if (user && token) {
          setUser({ ...user, profile_photo: base64String }, token);
        }
        setMessage({ text: 'Photo updated!', type: 'success' });
        setTimeout(() => setMessage(null), 2500);
      } catch (err) {
        setMessage({ text: 'Failed to update photo.', type: 'error' });
        setTimeout(() => setMessage(null), 2500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="container mx-auto px-2 py-4 flex flex-col gap-5 text-left min-h-screen pb-20">
      
      {/* Toast Notification */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border animate-fadeIn text-xs font-bold ${
          message.type === 'success' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-rose-50 border-rose-100 text-rose-600'
        }`}>
          {message.type === 'success' && <CheckCircle2 size={15} className="text-emerald-500" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Header */}
      <h1 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white px-1">
        My Profile
      </h1>

      {/* User Card (Avatar + Name) */}
      <Card className="p-5 bg-white dark:bg-[#1E293B] border-slate-250 dark:border-white/5 shadow-md flex items-center gap-4 text-left">
        <div className="relative shrink-0">
          {photo ? (
            <img 
              src={photo} 
              alt="Profile" 
              className="w-16 h-16 rounded-2xl object-cover border border-slate-100 dark:border-white/10" 
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400">
              <User size={24} />
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-slate-900 dark:bg-[#97C459] text-white dark:text-[#173404] flex items-center justify-center shadow cursor-pointer">
            <Camera size={11} />
            <input type="file" onChange={handlePhotoUpload} className="hidden" accept="image/*" />
          </label>
        </div>

        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
            {user?.student_name || 'Bimba Student'}
          </h2>
          <p className="text-[10px] text-slate-400 mt-1 font-bold truncate max-w-[180px]">
            {user?.personal_email}
          </p>
        </div>
      </Card>

      {/* Profile Metrics (Resume Completion & ATS Score) */}
      <div className="grid grid-cols-2 gap-3.5">
        <Card className="p-4 bg-white dark:bg-[#1E293B] border-slate-250 dark:border-white/5 shadow-sm text-left flex flex-col justify-between h-24">
          <span className="text-[9px] uppercase font-bold text-slate-400">Completion</span>
          <span className="text-lg font-black text-slate-900 dark:text-white">{getCompletionPercentage()}%</span>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-1" style={{ width: `${getCompletionPercentage()}%` }} />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#1E293B] border-slate-250 dark:border-white/5 shadow-sm text-left flex flex-col justify-between h-24">
          <span className="text-[9px] uppercase font-bold text-slate-400">ATS Rank Score</span>
          <span className="text-lg font-black text-slate-900 dark:text-white">78/100</span>
          <span className="text-[8.5px] text-emerald-600 dark:text-[#97C459] font-bold">Good Match Fit</span>
        </Card>
      </div>

      {/* Account actions Grouped List */}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider px-1">Settings & Security</h3>
        <div className="flex flex-col bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
          
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/5 text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Settings size={15} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Account Preferences</span>
            </div>
            <ChevronRight size={14} className="text-slate-400" />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 text-left text-rose-600 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <LogOut size={15} />
              <span className="text-xs font-bold">Sign Out</span>
            </div>
            <ChevronRight size={14} className="text-slate-400" />
          </button>

        </div>
      </div>

    </div>
  );
};
