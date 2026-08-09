import React, { createContext, useContext, useState, useEffect } from 'react';
import { useResumeBuilderStore, type ResumeBuilderData } from '../../store/resumeBuilderStore';
import { useJobStore } from '../../store/jobStore';
import { useUserStore } from '../../store/userStore';
import { apiClient } from '../../services/api';

export interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
}

export interface PolishSuggestion {
  id: string;
  original: string;
  improved: string;
  reason: string;
  accepted?: boolean;
}

export interface ResumeBuilderContextType {
  currentStep: number;
  setStep: (step: number) => void;
  resumeMode: 'upload' | 'scratch' | null;
  setResumeMode: (mode: 'upload' | 'scratch' | null) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  resumeId: number | null;
  setResumeId: (id: number | null) => void;
  parsedData: ResumeBuilderData | null;
  setParsedData: (data: ResumeBuilderData | null) => void;
  selectedTemplate: string;
  setSelectedTemplate: (tpl: string) => void;
  stylePrefs: {
    primaryColor: string;
    secondaryColor: string;
    columns: number;
    fontFamily: string;
    fontSize: string;
    margin: number;
  };
  setStylePrefs: React.Dispatch<React.SetStateAction<ResumeBuilderContextType['stylePrefs']>>;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  atsScore: number;
  setAtsScore: (score: number) => void;
  suggestions: PolishSuggestion[];
  setSuggestions: React.Dispatch<React.SetStateAction<PolishSuggestion[]>>;
  isAutosaving: boolean;
  triggerAutosave: (updatedData: Partial<ResumeBuilderData>) => Promise<void>;
  resetBuilderState: () => void;
}

const ResumeBuilderContext = createContext<ResumeBuilderContextType | undefined>(undefined);

export const ResumeBuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setStepState] = useState<number>(() => {
    const saved = localStorage.getItem('bimba.resumeBuilder.step');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [resumeMode, setResumeMode] = useState<'upload' | 'scratch' | null>(() => {
    return localStorage.getItem('bimba.resumeBuilder.mode') as any || null;
  });
  const [file, setFile] = useState<File | null>(null);
  const [resumeId, setResumeIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem('bimba.resumeBuilder.resumeId');
    return saved ? parseInt(saved, 10) : null;
  });
  const [parsedData, setParsedDataState] = useState<ResumeBuilderData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('microsoft');
  const [stylePrefs, setStylePrefs] = useState({
    primaryColor: '#111827',
    secondaryColor: '#4B5563',
    columns: 1,
    fontFamily: 'Inter',
    fontSize: '11pt',
    margin: 32
  });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Hello! I am your Bimba Career Coach. Let us optimize your resume to align against matching role benchmarks. What career field or specific position are you targeting?' }
  ]);
  const [atsScore, setAtsScore] = useState(72);
  const [suggestions, setSuggestions] = useState<PolishSuggestion[]>([
    {
      id: '1',
      original: 'Responsible for writing javascript features and helper functions.',
      improved: 'Designed and deployed modular React state components and reusable utility microservices, reducing component load times by 15%.',
      reason: 'Replaces generic "responsible for" with strong action verbs and quantifies business impact.',
      accepted: undefined
    }
  ]);
  const [isAutosaving, setIsAutosaving] = useState(false);

  const { fetchBuilderData } = useResumeBuilderStore();

  const setStep = (step: number) => {
    setStepState(step);
    localStorage.setItem('bimba.resumeBuilder.step', step.toString());
  };

  const setResumeId = (id: number | null) => {
    setResumeIdState(id);
    if (id) {
      localStorage.setItem('bimba.resumeBuilder.resumeId', id.toString());
    } else {
      localStorage.removeItem('bimba.resumeBuilder.resumeId');
    }
  };

  useEffect(() => {
    if (resumeMode) {
      localStorage.setItem('bimba.resumeBuilder.mode', resumeMode);
    } else {
      localStorage.removeItem('bimba.resumeBuilder.mode');
    }
  }, [resumeMode]);

  // Load resume data on init
  useEffect(() => {
    if (resumeId) {
      const load = async () => {
        try {
          const res = await apiClient.get(`/api/resume-studio/profile/${resumeId}`);
          // DEBUG: log API response received for profile
          try {
            // print lightweight summary
            // eslint-disable-next-line no-console
            console.debug('[DEBUG RESUME FRONTEND] profile API response summary', {
              resumeId: resumeId,
              education_count: Array.isArray(res.data?.education) ? res.data.education.length : 0,
              certifications_count: Array.isArray(res.data?.certifications) ? res.data.certifications.length : 0,
              education_sample: res.data?.education?.slice(0,2) || [],
              certifications_sample: res.data?.certifications?.slice(0,2) || []
            });
          } catch (e) {
            // eslint-disable-next-line no-console
            console.debug('[DEBUG RESUME FRONTEND] Failed to log profile response', e);
          }
          setParsedDataState(res.data);
          await fetchBuilderData(resumeId);
        } catch (e) {
          console.error("Error loading resume details in builder:", e);
        }
      };
      load();
    }
  }, [resumeId, fetchBuilderData]);

  // Check query params and restore session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id');
    if (urlId) {
      const parsedUrlId = parseInt(urlId, 10);
      if (parsedUrlId && parsedUrlId !== resumeId) {
        setResumeId(parsedUrlId);
      }
      if (currentStep < 4) {
        setStep(4);
      }
    } else if (resumeId && currentStep < 4) {
      setStep(4);
    }
  }, [resumeId, currentStep]);

  const triggerAutosave = async (updatedData: Partial<ResumeBuilderData>) => {
    if (!resumeId || !parsedData) return;
    setIsAutosaving(true);
    try {
      const payload = { ...parsedData, ...updatedData };
      setParsedDataState(payload);
      await apiClient.put(`/api/resume-studio/update/${resumeId}`, payload);
    } catch (e) {
      console.error("[Autosave] Failed to sync data to backend:", e);
    } finally {
      setIsAutosaving(false);
    }
  };

  const resetBuilderState = () => {
    setStepState(1);
    setResumeMode(null);
    setFile(null);
    setResumeIdState(null);
    setParsedDataState(null);
    setChatHistory([
      { sender: 'ai', text: 'Hello! I am your Bimba Career Coach. Let us optimize your resume to align against matching role benchmarks. What career field or specific position are you targeting?' }
    ]);
    localStorage.removeItem('bimba.resumeBuilder.step');
    localStorage.removeItem('bimba.resumeBuilder.mode');
    localStorage.removeItem('bimba.resumeBuilder.resumeId');
  };

  return (
    <ResumeBuilderContext.Provider value={{
      currentStep,
      setStep,
      resumeMode,
      setResumeMode,
      file,
      setFile,
      resumeId,
      setResumeId,
      parsedData,
      setParsedData: setParsedDataState,
      selectedTemplate,
      setSelectedTemplate,
      stylePrefs,
      setStylePrefs,
      chatHistory,
      setChatHistory,
      atsScore,
      setAtsScore,
      suggestions,
      setSuggestions,
      isAutosaving,
      triggerAutosave,
      resetBuilderState
    }}>
      {children}
    </ResumeBuilderContext.Provider>
  );
};

export const useResumeBuilderContext = () => {
  const context = useContext(ResumeBuilderContext);
  if (!context) {
    throw new Error('useResumeBuilderContext must be used within ResumeBuilderProvider');
  }
  return context;
};
