import { create } from 'zustand';
import { apiClient } from '../services/api';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source: string;
  match_score?: number;
  reason?: string;
  matched_skills?: string[];
  missing_skills?: string[];
  logo?: string;
}

export interface SavedJob {
  id: number;
  job_id: string;
  company: string;
  title: string;
  location: string;
  logo?: string;
  saved_at: string;
}

export interface JobApplication {
  id: number;
  job_id: string;
  company: string;
  title: string;
  status: 'saved' | 'applied' | 'interview' | 'rejected' | 'offer';
  notes?: string;
  application_date: string;
}

interface JobState {
  jobs: Job[];
  recommendations: Job[];
  savedJobs: SavedJob[];
  applications: JobApplication[];
  loading: boolean;
  errors: string | null;
  filters: {
    keyword: string;
    location: string;
    remote: boolean;
  };
  
  fetchRecommendations: (resumeId: number) => Promise<void>;
  generateRecommendations: (resumeId: number) => Promise<void>;
  searchJobs: (keyword: string, location?: string) => Promise<void>;
  fetchSavedJobs: () => Promise<void>;
  saveJob: (job: Job) => Promise<void>;
  removeSavedJob: (jobId: string) => Promise<void>;
  fetchApplications: () => Promise<void>;
  applyForJob: (job: Job, status?: 'saved' | 'applied' | 'interview', notes?: string) => Promise<void>;
  updateApplicationStatus: (appId: number, status: string, notes?: string) => Promise<void>;
  setFilters: (filters: Partial<JobState['filters']>) => void;
  clearJobStore: () => void;
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  recommendations: [],
  savedJobs: [],
  applications: [],
  loading: false,
  errors: null,
  filters: {
    keyword: '',
    location: 'India',
    remote: false
  },

  fetchRecommendations: async (resumeId: number) => {
    set({ loading: true, errors: null });
    try {
      const res = await apiClient.get(`/api/jobs/recommendations/${resumeId}`);
      if (res.data.success) {
        set({ recommendations: res.data.recommendations, loading: false });
      } else {
        set({ errors: 'Failed to retrieve recommendations', loading: false });
      }
    } catch (err: any) {
      set({ errors: err.response?.data?.detail || err.message, loading: false });
    }
  },

  generateRecommendations: async (resumeId: number) => {
    set({ loading: true, errors: null });
    try {
      const res = await apiClient.post(`/api/jobs/recommend/${resumeId}`);
      if (res.data.success) {
        set({ recommendations: res.data.recommendations, loading: false });
      } else {
        set({ errors: 'Failed to generate recommendations', loading: false });
      }
    } catch (err: any) {
      set({ errors: err.response?.data?.detail || err.message, loading: false });
    }
  },

  searchJobs: async (keyword: string, location = 'India') => {
    set({ loading: true, errors: null });
    try {
      const res = await apiClient.post('/api/jobs/search', { keyword, location });
      if (res.data.success) {
        set({ jobs: res.data.jobs, loading: false });
      } else {
        set({ errors: 'Search query failed', loading: false });
      }
    } catch (err: any) {
      set({ errors: err.response?.data?.detail || err.message, loading: false });
    }
  },

  fetchSavedJobs: async () => {
    try {
      const res = await apiClient.get('/api/jobs/saved');
      set({ savedJobs: res.data });
    } catch (err) {
      console.error('Error fetching saved jobs:', err);
    }
  },

  saveJob: async (job: Job) => {
    try {
      await apiClient.post('/api/jobs/save', {
        job_id: job.id,
        company: job.company,
        title: job.title,
        location: job.location,
        logo: job.logo || ''
      });
      await get().fetchSavedJobs();
    } catch (err) {
      console.error('Error saving job:', err);
    }
  },

  removeSavedJob: async (jobId: string) => {
    try {
      await apiClient.delete(`/api/jobs/save/${jobId}`);
      await get().fetchSavedJobs();
    } catch (err) {
      console.error('Error unsaving job:', err);
    }
  },

  fetchApplications: async () => {
    try {
      const res = await apiClient.get('/api/jobs/applications');
      set({ applications: res.data });
    } catch (err) {
      console.error('Error fetching job applications:', err);
    }
  },

  applyForJob: async (job: Job, status = 'applied', notes = '') => {
    try {
      await apiClient.post('/api/jobs/apply', {
        job_id: job.id,
        company: job.company,
        title: job.title,
        location: job.location,
        logo: job.logo || '',
        status,
        notes
      });
      await get().fetchApplications();
    } catch (err) {
      console.error('Error applying for job:', err);
    }
  },

  updateApplicationStatus: async (appId: number, status: string, notes = '') => {
    try {
      await apiClient.patch(`/api/jobs/applications/${appId}`, {
        status,
        notes
      });
      await get().fetchApplications();
    } catch (err) {
      console.error('Error updating application status:', err);
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  clearJobStore: () => set({
    jobs: [],
    recommendations: [],
    savedJobs: [],
    applications: [],
    loading: false,
    errors: null
  })
}));
