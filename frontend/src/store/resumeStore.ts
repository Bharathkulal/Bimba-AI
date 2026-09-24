import { create } from 'zustand';
import type { ResumeData } from '../types/resume';

interface ResumeState {
  currentResume: ResumeData | null;
  resumes: ResumeData[];
  resumeData: any | null;
  setCurrentResume: (resume: ResumeData | null) => void;
  setResumes: (resumes: ResumeData[]) => void;
  setResume: (resume: any) => void;
  clearCurrentResume: () => void;
  clearResume: () => void;
}

export const useResumeStore = create<ResumeState>((set) => ({
  currentResume: null,
  resumes: [],
  resumeData: null,
  setCurrentResume: (resume) => set({ currentResume: resume }),
  setResumes: (resumes) => set({ resumes }),
  setResume: (resume) => set({ resumeData: resume }),
  clearCurrentResume: () => set({ currentResume: null }),
  clearResume: () => set({ resumeData: null }),
}));
