import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, CheckCircle2, ChevronRight, X, Building, 
  Search, Plus, Sparkles, Clock, AlertCircle
} from 'lucide-react';
import { jobsService } from '../../services/jobs';
import type { JobApplication } from '../../services/jobs';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return 'Just now';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch (e) {
    return 'Just now';
  }
};

export const ApplicationsMobile: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await jobsService.getApplications();
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const filteredApps = applications.filter(app => {
    const matchSearch = app.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        app.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="container mx-auto px-2 py-4 flex flex-col gap-5 text-left min-h-screen pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Applications
          </h1>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">Track your active recruitment pipelines</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
          <Search size={14} />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by company or role..."
          className="w-full pl-9 pr-4 py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 focus:border-slate-800 rounded-2xl text-xs font-bold text-slate-800 dark:text-white outline-none placeholder-slate-400 shadow-sm"
        />
      </div>

      {/* Cards List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-white/5 rounded-2xl w-full" />
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-bold text-xs bg-white border border-dashed rounded-3xl p-6 flex flex-col items-center gap-3">
            <Briefcase size={36} />
            <span>No job trackers found matching your search.</span>
          </div>
        ) : (
          filteredApps.map((app) => (
            <Card
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className="p-4 bg-white dark:bg-[#1E293B] border-slate-250 dark:border-white/5 shadow-sm text-left flex flex-col gap-3.5 active:scale-[0.98] transition-transform"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 text-slate-500">
                  <Building size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{app.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{app.company}</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-2.5">
                <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded uppercase">
                  {app.status}
                </span>
                <span className="text-[9px] text-slate-900 dark:text-white font-extrabold flex items-center gap-1">
                  Timeline Details <ChevronRight size={10} />
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Details bottom sheet modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-end justify-center transition-all duration-300">
          <div className="bg-white dark:bg-[#1E293B] border-t border-slate-200 dark:border-white/10 rounded-t-3xl w-full p-6 flex flex-col gap-5 max-w-md shadow-2xl animate-slideUp">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Application Detail</h3>
              <button 
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-450 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex flex-col gap-3 text-left">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                  <Building size={18} />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{selectedApp.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{selectedApp.company} • {selectedApp.location}</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5 mt-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Status History</span>
                <span className="text-xs font-black text-slate-800 dark:text-white block mt-1 uppercase">{selectedApp.status}</span>
                <p className="text-[10px] text-slate-450 mt-1">Last Updated: {formatTimeAgo(selectedApp.application_date)}</p>
              </div>

              {selectedApp.notes && (
                <div className="mt-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Notes</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">{selectedApp.notes}</p>
                </div>
              )}
            </div>
            
            <Button
              onClick={() => setSelectedApp(null)}
              className="w-full py-4 font-bold text-xs bg-slate-900 text-white rounded-xl min-h-[48px] flex items-center justify-center mt-2"
            >
              Done
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};
