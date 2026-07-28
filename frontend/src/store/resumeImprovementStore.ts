import { create } from 'zustand';
import { apiClient } from '../services/api';

export interface ImprovementItem {
  original: string;
  improved: string;
  reason: string;
}

export interface ResumeImprovementsData {
  summary: ImprovementItem;
  projects: ImprovementItem[];
  experience: ImprovementItem[];
  skill_recommendations: string[];
  ats_keywords: string[];
}

interface ResumeImprovementState {
  improvements: ResumeImprovementsData | null;
  loading: boolean;
  error: string | null;
  fetchImprovements: (resumeId: number) => Promise<void>;
  applyImprovement: (section: 'summary' | 'projects' | 'experience', index?: number) => void;
  clearImprovements: () => void;
}

export const useResumeImprovementStore = create<ResumeImprovementState>((set) => ({
  improvements: null,
  loading: false,
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

  applyImprovement: (section, index) => {
    set((state) => {
      if (!state.improvements) return {};
      
      // Real implementation would send a request to update the resume contents in DB.
      // Here we just mark it as applied in frontend or clear it.
      logger.info(`Applied improvement for section: ${section} at index: ${index}`);
      return {};
    });
  },
  
  clearImprovements: () => set({ improvements: null, error: null, loading: false }),
}));

const logger = {
  info: (msg: string) => console.log(`[useResumeImprovementStore] ${msg}`)
};
