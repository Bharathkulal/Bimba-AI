import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Briefcase, MapPin, Calendar, ClipboardList, CheckCircle2, 
  ChevronRight, ArrowRight, Eye, Check, X, Building, Trash2
} from 'lucide-react';
import { jobsService } from '../../services/jobs';
import type { JobApplication } from '../../services/jobs';

export const Applications: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await jobsService.getApplications();
      setApplications(data);
    } catch (err) {
      showToast('Error loading application history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case 'Applied': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Interview': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Offer': return 'bg-teal-50 text-teal-700 border-teal-200 font-extrabold';
      case 'Accepted': return 'bg-emerald-50 text-emerald-800 border-emerald-250 font-black';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Group applications by categories for summary
  const appliedCount = applications.filter(a => a.status === 'Applied').length;
  const interviewCount = applications.filter(a => a.status === 'Interview').length;
  const offerCount = applications.filter(a => a.status === 'Offer' || a.status === 'Accepted').length;
  const rejectedCount = applications.filter(a => a.status === 'Rejected').length;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-1 md:px-4">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-xl transition-all duration-300 transform scale-100 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-[22px] p-6 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Application Tracker <ClipboardList className="text-blue-500" size={24} />
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-semibold mt-1">Track interview stages, offers, notes, and milestones for applied jobs.</p>
        </div>

        {/* Modular Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl self-stretch md:self-auto justify-around">
          <Link to="/jobs" className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all duration-200">
            Find Jobs
          </Link>
          <Link to="/jobs/saved" className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all duration-200">
            Saved Jobs
          </Link>
          <Link to="/jobs/applications" className="px-4 py-2 rounded-lg text-xs font-black bg-white text-blue-600 shadow-sm transition-all duration-200">
            Applications
          </Link>
        </div>
      </div>

      {/* QUICK SUMMARY BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Applied', val: appliedCount, col: 'text-blue-600', bg: 'bg-blue-500/5' },
          { label: 'Interviews', val: interviewCount, col: 'text-purple-650', bg: 'bg-purple-500/5' },
          { label: 'Offers / Hired', val: offerCount, col: 'text-emerald-600', bg: 'bg-emerald-500/5' },
          { label: 'Archived / Rejected', val: rejectedCount, col: 'text-rose-500', bg: 'bg-rose-500/5' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white border border-slate-200/60 rounded-[18px] p-4.5 flex justify-between items-center shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-full ${s.bg} blur-xl`} />
            <div className="text-left">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{s.label}</span>
              <h4 className={`text-xl font-black ${s.col} mt-1.5 leading-none`}>{s.val}</h4>
            </div>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.bg} shrink-0`}>
              <Briefcase size={14} className={s.col} />
            </div>
          </div>
        ))}
      </div>

      {/* APPLICATIONS SWIMLANES / KANBAN BOARD */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-48 animate-pulse bg-slate-100 rounded-[22px]" />
      ) : applications.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200/60 rounded-[22px] p-12 text-center shadow-sm flex flex-col items-center gap-4 max-w-xl mx-auto mt-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-inner">
            <ClipboardList size={28} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800">No Job Applications Yet</h3>
            <p className="text-xs text-slate-450 mt-1 max-w-xs mx-auto leading-relaxed">
              When applying to jobs from the Dashboard, we automatically create a tracking record. Browse our listings and start applying!
            </p>
          </div>
          <Link 
            to="/jobs"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-xl shadow-sm transition-all duration-200 cursor-pointer text-center font-sans"
          >
            Find Your Dream Job
          </Link>
        </div>
      ) : (
        /* Board/List View of Tracked Apps */
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-slate-200/60 rounded-[22px] p-5 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-[9.5px] font-black text-slate-400 uppercase tracking-widest pl-2">Job / Company</th>
                    <th className="pb-3 text-[9.5px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Applied Date</th>
                    <th className="pb-3 text-[9.5px] font-black text-slate-400 uppercase tracking-widest text-center">Stage Status</th>
                    <th className="pb-3 text-[9.5px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell pl-4">Application Notes Log</th>
                    <th className="pb-3 text-[9.5px] font-black text-slate-400 tracking-widest text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="group hover:bg-slate-50/50 transition-all duration-250">
                      {/* Logo & Company */}
                      <td className="py-4 pl-2 text-left">
                        <div className="flex items-center gap-3">
                          {app.logo ? (
                            <img 
                              src={app.logo} 
                              alt={app.company} 
                              className="w-10 h-10 rounded-lg object-cover border border-slate-100 shadow-sm shrink-0" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=60';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-inner shrink-0">
                              <Building size={16} />
                            </div>
                          )}
                          <div className="leading-tight text-left">
                            <h4 className="font-extrabold text-xs text-slate-800 group-hover:text-blue-600 transition-smooth">{app.title}</h4>
                            <p className="text-[10px] text-slate-450 font-bold mt-0.5">{app.company} <span className="font-medium text-slate-400">({app.location || 'Remote'})</span></p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 text-xs font-bold text-slate-500 hidden sm:table-cell">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(app.application_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-full border shadow-sm ${getStageColor(app.status)}`}>
                          <span className="w-1 h-1 rounded-full bg-current" />
                          {app.status}
                        </span>
                      </td>

                      {/* Notes */}
                      <td className="py-4 hidden lg:table-cell max-w-xs pl-4 text-left">
                        <p className="text-[10.5px] font-medium text-slate-450 truncate" title={app.notes || ''}>
                          {app.notes || 'No tracking notes added.'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-4 text-right pr-2">
                        <button 
                          onClick={() => navigate(`/jobs/${app.job_id}`)}
                          className="px-3.5 py-2 border border-slate-205 hover:bg-white bg-slate-50 text-slate-700 font-extrabold text-[10px] rounded-xl shadow-sm hover:shadow transition-all duration-200 cursor-pointer hover:scale-102 flex items-center gap-1 ml-auto"
                        >
                          <Eye size={12} /> Manage Log
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
