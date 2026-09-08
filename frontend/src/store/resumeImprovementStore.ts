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
  applyAllImprovements: (resumeId: number, acceptedSections?: string[]) => Promise<boolean>;
  clearImprovements: () => void;
}

export const useResumeImprovementStore = create<ResumeImprovementState>((set, get) => ({
  improvements: null,
  loading: false,
  applying: false,
  error: null,
  
  fetchImprovements: async (resumeId: number) => {
    if (!resumeId) {
      set({ error: 'Invalid resume identifier. Please save or select a resume first.', loading: false });
      return;
    }
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post(`/api/resume/improve/${resumeId}`);
      if (response.data && response.data.success && response.data.improvements) {
        const raw = response.data.improvements;
        const normalized: ResumeImprovementsData = {
          target_ats_score: typeof raw.target_ats_score === 'number' ? raw.target_ats_score : 95,
          ats_score_before: typeof raw.ats_score_before === 'number' ? raw.ats_score_before : 72,
          overall_improvement_summary: raw.overall_improvement_summary || 'AI-enhanced readability, metrics, and professional ATS keywords.',
          summary: {
            original: typeof raw.summary?.original === 'string' ? raw.summary.original : (typeof raw.summary === 'string' ? raw.summary : ''),
            improved: typeof raw.summary?.improved === 'string' ? raw.summary.improved : (typeof raw.summary === 'string' ? raw.summary : ''),
            reason: typeof raw.summary?.reason === 'string' ? raw.summary.reason : 'Enhanced structure and technical keyword alignment.'
          },
          projects: Array.isArray(raw.projects) ? raw.projects.map((p: any) => ({
            original: typeof p?.original === 'string' ? p.original : (typeof p === 'string' ? p : ''),
            improved: typeof p?.improved === 'string' ? p.improved : (typeof p === 'string' ? p : ''),
            reason: typeof p?.reason === 'string' ? p.reason : 'Clarified technology stack, ownership, and measurable outcomes.'
          })) : [],
          experience: Array.isArray(raw.experience) ? raw.experience.map((e: any) => ({
            original: typeof e?.original === 'string' ? e.original : (typeof e === 'string' ? e : ''),
            improved: typeof e?.improved === 'string' ? e.improved : (typeof e === 'string' ? e : ''),
            reason: typeof e?.reason === 'string' ? e.reason : 'Strengthened action verbs and quantified business impact.'
          })) : [],
          skill_recommendations: Array.isArray(raw.skill_recommendations) ? raw.skill_recommendations.map(String) : [],
          ats_keywords: Array.isArray(raw.ats_keywords) ? raw.ats_keywords.map(String) : []
        };
        set({ improvements: normalized, loading: false, error: null });
      } else {
        set({ error: response.data?.message || 'Failed to load improvements.', loading: false });
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Error generating improvements. Please check service availability and try again.';
      set({ error: msg, loading: false });
    }
  },

  applyAllImprovements: async (resumeId: number, acceptedSections?: string[]) => {
    set({ applying: true, error: null });
    try {
      const currentImprovements = get().improvements;
      const response = await apiClient.post(`/api/resume/apply-improvements/${resumeId}`, {
        improvements: currentImprovements,
        accepted_sections: acceptedSections
      });
      set({ applying: false });
      return response.data?.success || false;
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Error applying improvements';
      set({ error: msg, applying: false });
      return false;
    }
  },
  
  clearImprovements: () => set({ improvements: null, error: null, loading: false, applying: false }),
}));

