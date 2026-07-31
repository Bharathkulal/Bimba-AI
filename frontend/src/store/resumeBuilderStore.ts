import { create } from 'zustand';
import { apiClient } from '../services/api';

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
}

export interface ExperienceItem {
  position: string;
  company: string;
  duration: string;
  description: string;
}

export interface ProjectItem {
  title: string;
  technologies: string;
  description: string;
}

export interface EducationItem {
  degree: string;
  institution: string;
  year: string;
}

export interface ResumeBuilderData {
  personal_info: PersonalInfo;
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
}

export interface GeneratedVersion {
  id?: number;
  template: string;
  pdf_url: string;
  version: number;
  created_at: string;
}

interface ResumeBuilderState {
  resumeId: number | null;
  resumeData: ResumeBuilderData | null;
  aiImprovements: any | null;
  selectedTemplate: string;
  generatedFiles: GeneratedVersion[];
  loading: boolean;
  generating: boolean;
  errors: string | null;
  
  fetchBuilderData: (resumeId: number) => Promise<void>;
  updateResumeData: (updater: (prev: ResumeBuilderData) => ResumeBuilderData) => void;
  saveResumeData: () => Promise<void>;
  setSelectedTemplate: (template: string) => void;
  generatePdf: (resumeId: number) => Promise<{ pdf_url: string; pdf_base64?: string } | null>;
  fetchPreviousVersions: (resumeId: number) => Promise<void>;
  clearBuilderStore: () => void;
}

export const useResumeBuilderStore = create<ResumeBuilderState>((set, get) => ({
  resumeId: null,
  resumeData: null,
  aiImprovements: null,
  selectedTemplate: 'ats_classic',
  generatedFiles: [],
  loading: false,
  generating: false,
  errors: null,

  fetchBuilderData: async (resumeId: number) => {
    set({ loading: true, errors: null, resumeId });
    try {
      const response = await apiClient.get(`/api/resume/builder/${resumeId}`);
      if (response.data.success) {
        set({ 
          resumeData: response.data.extracted_data, 
          aiImprovements: response.data.ai_improvements,
          loading: false 
        });
      } else {
        set({ errors: response.data.message || 'Failed to load builder data', loading: false });
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Error fetching builder details';
      set({ errors: msg, loading: false });
    }
  },

  updateResumeData: (updater) => {
    set((state) => {
      if (!state.resumeData) return {};
      const nextData = updater(state.resumeData);
      
      // Auto-persist to MongoDB in background
      const resumeId = state.resumeId;
      if (resumeId) {
        apiClient.put(`/api/resume/${resumeId}/update`, nextData).catch(err => {
          console.error("Autosave failed:", err);
        });
      }
      
      return { resumeData: nextData };
    });
  },

  saveResumeData: async () => {
    const { resumeId, resumeData } = get();
    if (!resumeId || !resumeData) return;
    try {
      await apiClient.put(`/api/resume/${resumeId}/update`, resumeData);
    } catch (err: any) {
      console.error("Manual save failed:", err);
    }
  },

  setSelectedTemplate: (template) => set({ selectedTemplate: template }),

  generatePdf: async (resumeId: number) => {
    const { resumeData, selectedTemplate } = get();
    if (!resumeData) return null;

    set({ generating: true, errors: null });
    try {
      // Force save latest state before compiling PDF
      await apiClient.put(`/api/resume/${resumeId}/update`, resumeData);
      
      const response = await apiClient.post(`/api/resume/generate-pdf/${resumeId}`, {
        template: selectedTemplate,
        resume_data: resumeData
      });
      
      if (response.data.success) {
        set({ generating: false });
        // Refresh previous versions history list
        await get().fetchPreviousVersions(resumeId);
        return {
          pdf_url: response.data.pdf_url,
          pdf_base64: response.data.pdf_base64
        };
      } else {
        set({ errors: response.data.message || 'Failed to generate PDF', generating: false });
        return null;
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Error compiling PDF resume';
      set({ errors: msg, generating: false });
      return null;
    }
  },

  fetchPreviousVersions: async (resumeId: number) => {
    try {
      const response = await apiClient.get(`/api/resume/generated/${resumeId}`);
      set({ generatedFiles: response.data });
    } catch (err) {
      console.error('Failed to fetch previous generated versions:', err);
    }
  },

  clearBuilderStore: () => set({
    resumeId: null,
    resumeData: null,
    aiImprovements: null,
    selectedTemplate: 'ats_classic',
    generatedFiles: [],
    loading: false,
    generating: false,
    errors: null
  })
}));
