import { create } from 'zustand';
import { apiClient } from '../services/api';

export interface ResumeHealthData {
  overall_score: number;
  ats_score: number;
  rating: 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor';
  section_scores: {
    summary: number;
    skills: number;
    experience: number;
    projects: number;
  };
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  improvement_suggestions: string[];
}

interface ResumeHealthState {
  healthData: ResumeHealthData | null;
  loading: boolean;
  error: string | null;
  fetchHealthData: (resumeId: number) => Promise<void>;
  clearHealthData: () => void;
}

export const useResumeHealthStore = create<ResumeHealthState>((set) => ({
  healthData: null,
  loading: false,
  error: null,
  
  fetchHealthData: async (resumeId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get(`/api/resume/health/${resumeId}`);
      if (response.data.success) {
        set({ healthData: response.data.resume_health, loading: false });
      } else {
        set({ error: response.data.message || 'Failed to load health data', loading: false });
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Error fetching resume health metrics';
      set({ error: msg, loading: false });
    }
  },
  
  clearHealthData: () => set({ healthData: null, error: null, loading: false }),
}));
