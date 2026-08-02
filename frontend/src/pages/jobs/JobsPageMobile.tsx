import React, { useState, useEffect } from 'react';
import { useJobStore } from '../../store/jobStore';
import { useResumeBuilderStore } from '../../store/resumeBuilderStore';
import { JobFilters } from '../../components/jobs/JobFilters';
import { JobCard } from '../../components/jobs/JobCard';
import { SavedJobs } from '../../components/jobs/SavedJobs';
import { PageHeader } from '../../components/PageHeader';
import { Compass, Search, Bookmark, Briefcase, Filter, X, Building } from 'lucide-react';
import { create } from 'zustand';
import { apiClient } from '../../services/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';

interface Resume {
  id: number;
  name: string;
  filename?: string;
  status: string;
  resume_type?: string;
  target_role?: string;
}

const useLocalResumeStore = create<{
  resumes: Resume[];
  fetchResumes: () => Promise<void>;
}>((set) => ({
  resumes: [],
  fetchResumes: async () => {
    try {
      const res = await apiClient.get('/api/resume-studio/all');
      set({ resumes: res.data });
    } catch (e) {
      console.error(e);
    }
  }
}));

export const JobsPageMobile: React.FC = () => {
  const navigate = useNavigate();
  const { resumes, fetchResumes } = useLocalResumeStore();
  const { jobs, loading, clearJobStore, searchJobs } = useJobStore();
  const [activeTab, setActiveTab] = useState<'recommend' | 'search' | 'tracker'>('recommend');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchResumes();
    return () => {
      clearJobStore();
    };
  }, [fetchResumes, clearJobStore]);

  const activeResume = resumes.find(r => r.status === 'ai_completed' || r.status === 'analyzed') || resumes.find(r => r.status === 'uploaded' || r.status === 'parsed') || resumes[0];

  return (
    <div className="container mx-auto px-2 py-4 flex flex-col gap-5 text-left min-h-screen pb-20">
      
      {/* Mobile top filter control header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Bimba Jobs
          </h1>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">Find your next tech career match</p>
        </div>
        
        {activeTab === 'search' && (
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 text-xs font-bold shadow-sm cursor-pointer"
          >
            <Filter size={14} /> Filter
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/10 pb-1 gap-1 w-full justify-around">
        {[
          { id: 'recommend', label: 'AI Matched', icon: Compass },
          { id: 'search', label: 'Search', icon: Search },
          { id: 'tracker', label: 'Saved', icon: Bookmark },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2.5 rounded-xl font-bold text-[11px] cursor-pointer transition-all flex items-center gap-1 flex-1 justify-center ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={12} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content cards list view */}
      <div className="mt-1">
        {activeTab === 'recommend' && (
          activeResume ? (
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="flex flex-col gap-3 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-slate-200 dark:bg-white/5 rounded-2xl w-full" />
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 text-xs font-bold text-slate-400">
                  No matches found. Ensure your resume key achievements are complete.
                </div>
              ) : (
                jobs.map((job) => (
                  <Card
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="p-4 bg-white dark:bg-[#1E293B] border-slate-250 dark:border-white/5 shadow-sm text-left flex flex-col gap-3.5"
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 text-slate-500">
                        <Building size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{job.title}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">{job.company} • {job.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-2.5">
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                        {job.match_score || 80}% Match
                      </span>
                      <span className="text-[9px] text-slate-900 dark:text-white font-extrabold">View & Apply →</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 font-bold text-xs bg-white border border-dashed rounded-3xl p-6 flex flex-col items-center gap-3">
              <Briefcase size={36} />
              <span>Please upload and complete AI Analysis on your resume first to view matches.</span>
            </div>
          )
        )}

        {activeTab === 'search' && (
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex flex-col gap-3 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-slate-200 dark:bg-white/5 rounded-2xl w-full" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold text-xs">
                Enter keyword query above to search.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {jobs.map((job) => (
                  <Card
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="p-4 bg-white dark:bg-[#1E293B] border-slate-250 dark:border-white/5 shadow-sm text-left flex flex-col gap-3.5"
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 text-slate-500">
                        <Building size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{job.title}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">{job.company} • {job.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-2.5">
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                        {job.match_score || 80}% Match
                      </span>
                      <span className="text-[9px] text-slate-900 dark:text-white font-extrabold">View details →</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tracker' && (
          <SavedJobs />
        )}
      </div>

      {/* 4. Bottom Sheet Filters */}
      {showFilters && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-end justify-center transition-all duration-300">
          <div className="bg-white dark:bg-[#1E293B] border-t border-slate-200 dark:border-white/10 rounded-t-3xl w-full p-6 flex flex-col gap-5 max-w-md shadow-2xl animate-slideUp">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Filter Recommendations</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-450 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <JobFilters />
            
            <Button
              onClick={() => setShowFilters(false)}
              className="w-full py-4 font-bold text-xs bg-slate-900 text-white rounded-xl min-h-[48px] flex items-center justify-center mt-2"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};
