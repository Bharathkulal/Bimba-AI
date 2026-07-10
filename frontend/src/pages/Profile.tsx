import React from 'react';
import { User, Mail, BookOpen, GraduationCap } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { useUserStore } from '../store/userStore';

export const Profile: React.FC = () => {
  const user = useUserStore((state) => state.user);

  const getDisplayName = () => {
    if (!user) return 'Student';
    const email = user.personal_email;
    const prefix = email.split('@')[0];
    const name = prefix.replace(/[0-9_.]/g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1).trim();
  };

  const displayName = getDisplayName();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Profile"
        description="View and update your personal details"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="md:col-span-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-blue-500/20 mb-4">
            {displayName.split(' ').map(n => n[0]).join('').toUpperCase() || 'S'}
          </div>
          <h3 className="text-lg font-bold text-slate-800">{displayName}</h3>
          <p className="text-xs text-slate-400 font-medium">{user?.personal_email || 'student@bimbaai.com'}</p>
          <div className="px-3 py-1 bg-blue-50 text-primary text-[10px] font-bold rounded-lg mt-4 border border-blue-100 uppercase tracking-wider">
            Student Profile
          </div>
        </Card>

        {/* Details Form Card */}
        <Card className="md:col-span-2 flex flex-col gap-6">
          <h3 className="text-base font-bold text-slate-800">Account details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Roll Number</span>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-700 text-sm font-medium">
                <User size={16} className="text-slate-400" />
                <span>{user?.roll_number || 'N/A'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Email Address</span>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-700 text-sm font-medium">
                <Mail size={16} className="text-slate-400" />
                <span>{user?.personal_email || 'N/A'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Department</span>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-700 text-sm font-medium">
                <BookOpen size={16} className="text-slate-400" />
                <span>{user?.department || 'N/A'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Semester</span>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-700 text-sm font-medium">
                <GraduationCap size={16} className="text-slate-400" />
                <span>Semester {user?.semester || 'N/A'}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
export default Profile;
