import { User, Mail } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const Profile: React.FC = () => {
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
            DU
          </div>
          <h3 className="text-lg font-bold text-slate-800">Demo User</h3>
          <p className="text-xs text-slate-400 font-medium">demo@bimbaai.com</p>
          <div className="px-3 py-1 bg-blue-50 text-primary text-[10px] font-bold rounded-lg mt-4 border border-blue-100 uppercase tracking-wider">
            Premium Plan
          </div>
        </Card>

        {/* Details Form Card */}
        <Card className="md:col-span-2 flex flex-col gap-6">
          <h3 className="text-base font-bold text-slate-800">Account details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">First Name</span>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-700 text-sm font-medium">
                <User size={16} className="text-slate-400" />
                <span>Demo</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Last Name</span>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-700 text-sm font-medium">
                <User size={16} className="text-slate-400" />
                <span>User</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Email Address</span>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-slate-700 text-sm font-medium">
                <Mail size={16} className="text-slate-400" />
                <span>demo@bimbaai.com</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 pt-6">
            <Button variant="outline">Discard</Button>
            <Button variant="primary">Save Changes</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
