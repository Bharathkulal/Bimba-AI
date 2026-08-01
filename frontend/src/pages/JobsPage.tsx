import React, { useState, useEffect } from 'react';
import { useJobStore } from '../store/jobStore';
import { useResumeBuilderStore } from '../store/resumeBuilderStore';
import { JobRecommendationDashboard } from '../components/jobs/JobRecommendationDashboard';
import { JobFilters } from '../components/jobs/JobFilters';
import { JobCard } from '../components/jobs/JobCard';
import { SavedJobs } from '../components/jobs/SavedJobs';
import { PageHeader } from '../components/PageHeader';
import { Compass, Search, Bookmark, Briefcase, Sparkles } from 'lucide-react';

// Re-use mock resume store fetch pattern
import { create } from 'zustand';
import { apiClient } from '../services/api';

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

export const JobsPage: React.FC = () => {
  const { resumes, fetchResumes } = useLocalResumeStore();
  const { jobs, loading, clearJobStore } = useJobStore();
  const [activeTab, setActiveTab] = useState<'recommend' | 'search' | 'tracker'>('recommend');

  useEffect(() => {
    fetchResumes();
    return () => {
      clearJobStore();
    };
  }, [fetchResumes, clearJobStore]);

  // Find latest analyzed or completed resume
  const activeResume = resumes.find(r => r.status === 'ai_completed' || r.status === 'analyzed') || resumes.find(r => r.status === 'uploaded' || r.status === 'parsed') || resumes[0];

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col gap-6 text-left min-h-screen">
      
      {/* Page Header */}
      <PageHeader
        title="Bimba Job Studio"
        description="Discover matching tech careers, prepare tracking boards, and analyze ATS matches"
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/10 pb-1 gap-2 flex-wrap">
        {[
          { id: 'recommend', label: 'AI Matched Jobs', icon: Compass },
          { id: 'search', label: 'Manual Search', icon: Search },
          { id: 'tracker', label: 'Saved & Tracker', icon: Bookmark },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white border border-transparent'
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-2 min-h-[400px]">
        {activeTab === 'recommend' && (
          activeResume ? (
            <JobRecommendationDashboard resumeId={activeResume.id} />
          ) : (
            <div className="text-center py-16 text-slate-450 font-bold text-xs bg-slate-50/50 dark:bg-white/5 border border-dashed rounded-3xl max-w-lg mx-auto flex flex-col items-center gap-3">
              <Briefcase size={36} className="text-slate-400" />
              <span>Please upload and complete AI Analysis on your resume first to view matches.</span>
            </div>
          )
        )}

        {activeTab === 'search' && (
          <div className="flex flex-col gap-6">
            <JobFilters />
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="h-44 bg-slate-200 dark:bg-white/5 rounded-3xl w-full" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold text-xs">
                Enter keyword query and press search to locate job matches.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tracker' && (
          <SavedJobs />
        )}
      </div>

    </div>
  );
};
export default JobsPage;
