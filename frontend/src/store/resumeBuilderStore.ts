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
  objective?: string;
  skills: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications?: any[];
  internships?: any[];
  achievements?: string[];
  languages?: string[];
  portfolioLinks?: string[];
  publications?: any[];
  volunteerExperience?: any[];
  references?: any[];
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
  templatesList: any[];
  fetchTemplates: () => Promise<void>;
  fetchBuilderData: (resumeId: number) => Promise<void>;
  updateResumeData: (updater: (prev: ResumeBuilderData) => ResumeBuilderData) => void;
  saveResumeData: () => Promise<void>;
  setSelectedTemplate: (template: string) => void;
  generatePdf: (resumeId: number) => Promise<{ pdf_url?: string; pdf_base64?: string; error?: string } | null>;
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
  templatesList: [],

  fetchTemplates: async () => {
    try {
      const response = await apiClient.get('/api/templates');
      set({ templatesList: response.data || [] });
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  },


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
        apiClient.put(`/api/resume-studio/${resumeId}/update`, nextData).catch(err => {
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
      await apiClient.put(`/api/resume-studio/${resumeId}/update`, resumeData);
    } catch (err: any) {
      console.error("Manual save failed:", err);
    }
  },

  setSelectedTemplate: (template) => set({ selectedTemplate: template }),

  generatePdf: async (resumeId: number) => {
    const { resumeData, selectedTemplate } = get();
    if (!resumeData) return null;

    // Read typography prefs saved by ResumePreview
    let fontFamily = 'Inter';
    let fontSize = '11pt';
    try {
      const stored = localStorage.getItem('bimba.resumeStudioPreferences.v1');
      if (stored) {
        const prefs = JSON.parse(stored);
        fontFamily = prefs.fontFamily || fontFamily;
        fontSize = prefs.fontSize || fontSize;
      }
    } catch (_) {}

    set({ generating: true });
    // 35-second AbortController timeout — Playwright browser render can take up to 5–8s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    try {
      // Force save latest state before compiling PDF
      await apiClient.put(`/api/resume-studio/${resumeId}/update`, resumeData);

      const response = await apiClient.post(
        `/api/resume/generate-pdf/${resumeId}`,
        {
          template: selectedTemplate,
          resume_data: resumeData,
          font_family: fontFamily,
          font_size: fontSize
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (response.data.success) {
        set({ generating: false });
        await get().fetchPreviousVersions(resumeId);
        return {
          pdf_url: response.data.pdf_url,
          pdf_base64: response.data.pdf_base64
        };
      } else {
        set({ generating: false });
        return { error: response.data.message || 'Failed to generate PDF' };
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      set({ generating: false });
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        return { error: 'PDF generation timed out (35s). The renderer may be starting up — please try again in a moment.' };
      }
      const detail = err.response?.data?.detail;
      if (detail?.includes('PDF renderer unavailable')) {
        return { error: 'PDF renderer not running. Please start it: cd backend/pdf_renderer && node server.mjs' };
      }
      return { error: detail || err.message || 'Error compiling PDF resume' };
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
