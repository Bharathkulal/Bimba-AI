import { create } from 'zustand';
import { apiClient } from '../services/api';

export interface ImprovementItem {
  original: string;
  improved: string;
  reason: string;
}

export interface ResumeImprovementsData {
  target_ats_score?: number;
  ats_score_before?: number;
  overall_improvement_summary?: string;
  summary: ImprovementItem;
  projects: ImprovementItem[];
  experience: ImprovementItem[];
  skill_recommendations: string[];
  ats_keywords: string[];
}

interface ResumeImprovementState {
  improvements: ResumeImprovementsData | null;
  loading: boolean;
  applying: boolean;
  error: string | null;
  fetchImprovements: (resumeId: number) => Promise<void>;
  applyAllImprovements: (resumeId: number) => Promise<boolean>;
  clearImprovements: () => void;
}

export const useResumeImprovementStore = create<ResumeImprovementState>((set, get) => ({
  improvements: null,
  loading: false,
  applying: false,
  error: null,
  
  fetchImprovements: async (resumeId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post(`/api/resume/improve/${resumeId}`);
      if (response.data.success) {
        set({ improvements: response.data.improvements, loading: false });
      } else {
        set({ error: response.data.message || 'Failed to load improvements', loading: false });
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Error generating improvements';
      set({ error: msg, loading: false });
    }
  },

  applyAllImprovements: async (resumeId: number) => {
    set({ applying: true, error: null });
    try {
      const currentImprovements = get().improvements;
      const response = await apiClient.post(`/api/resume/apply-improvements/${resumeId}`, {
        improvements: currentImprovements
      });
      set({ applying: false });
      return response.data.success || false;
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Error applying improvements';
      set({ error: msg, applying: false });
      return false;
    }
  },
  
  clearImprovements: () => set({ improvements: null, error: null, loading: false, applying: false }),
}));
