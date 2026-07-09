import { create } from 'zustand';

interface ResumeData {
  title: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    website?: string;
  };
  experience: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
  }>;
  skills: string[];
}

interface ResumeState {
  currentResume: ResumeData | null;
  resumes: ResumeData[];
  setCurrentResume: (resume: ResumeData | null) => void;
  setResumes: (resumes: ResumeData[]) => void;
  clearCurrentResume: () => void;
}

export const useResumeStore = create<ResumeState>((set) => ({
  currentResume: null,
  resumes: [],
  setCurrentResume: (resume) => set({ currentResume: resume }),
  setResumes: (resumes) => set({ resumes }),
  clearCurrentResume: () => set({ currentResume: null }),
}));
