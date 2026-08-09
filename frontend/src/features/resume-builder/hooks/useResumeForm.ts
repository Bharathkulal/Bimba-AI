import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../services/api';
import type { ResumeBuilderData, PersonalInfo, ExperienceItem, EducationItem } from '../../../store/resumeBuilderStore';

const DRAFT_KEY = 'bimba.mobileCreateFromScratchDraft.v1';

const emptyResumeData = (): ResumeBuilderData => ({
  personal_info: { name: '', email: '', phone: '', location: '' },
  summary: '',
  objective: '',
  skills: [],
  technicalSkills: [],
  softSkills: [],
  experience: [],
  projects: [],
  education: [],
  certifications: [],
  internships: [],
  achievements: [],
  languages: [],
  portfolioLinks: [],
  publications: [],
  volunteerExperience: [],
  references: []
});

export const useResumeForm = () => {
  const [resumeId, setResumeIdState] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.resumeId === 'number') {
          return parsed.resumeId;
        }
      }
    } catch {}
    return null;
  });

  const [formData, setFormData] = useState<ResumeBuilderData>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data) {
          return parsed.data;
        }
      }
    } catch (e) {
      console.warn('Failed to parse mobile resume draft', e);
    }
    return emptyResumeData();
  });

  const [currentStep, setCurrentStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.currentStep === 'number') {
          return parsed.currentStep;
        }
      }
    } catch {}
    return 1;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const setResumeId = useCallback((id: number | null) => {
    setResumeIdState(id);
  }, []);
  
  // Autosave locally on state change (throttled/debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: formData, currentStep, resumeId }));
    }, 450);
    return () => clearTimeout(timer);
  }, [formData, currentStep, resumeId]);

  const updatePersonalInfo = useCallback((field: keyof PersonalInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        [field]: value
      }
    }));
  }, []);

  const addExperience = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { position: '', company: '', duration: '', description: '' }
      ]
    }));
  }, []);

  const updateExperience = useCallback((index: number, field: keyof ExperienceItem, value: string) => {
    setFormData((prev) => {
      const next = [...prev.experience];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, experience: next };
    });
  }, []);

  const removeExperience = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, idx) => idx !== index)
    }));
  }, []);

  const addEducation = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { degree: '', institution: '', year: '' }
      ]
    }));
  }, []);

  const updateEducation = useCallback((index: number, field: keyof EducationItem, value: string) => {
    setFormData((prev) => {
      const next = [...prev.education];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, education: next };
    });
  }, []);

  const removeEducation = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, idx) => idx !== index)
    }));
  }, []);

  const updateSkills = useCallback((skills: string[]) => {
    setFormData((prev) => ({
      ...prev,
      skills,
      technicalSkills: skills
    }));
  }, []);

  // Save draft to backend database
  const saveDraftToBackend = useCallback(async (customData?: ResumeBuilderData) => {
    setIsSaving(true);
    setSaveError(null);
    const dataToSave = customData || formData;
    try {
      const payload = {
        ...dataToSave,
        name: dataToSave.personal_info.name || 'Mobile Resume Draft',
        template_id: 'microsoft',
        selected_template: 'microsoft'
      };

      if (resumeId) {
        await apiClient.put(`/api/resume-studio/${resumeId}/update`, payload);
      } else {
        const response = await apiClient.post('/api/resume-studio/create', payload);
        const nextId = response.data?.id;
        if (nextId) {
          setResumeIdState(nextId);
          await apiClient.put(`/api/resume-studio/${nextId}/update`, payload);
        } else {
          throw new Error('No resume ID returned from create API');
        }
      }
    } catch (err: any) {
      console.error('Failed to autosave resume draft to server:', err);
      setSaveError(err.message || 'Server sync failed');
    } finally {
      setIsSaving(false);
    }
  }, [formData, resumeId]);

  const clearForm = useCallback(() => {
    setFormData(emptyResumeData());
    setResumeIdState(null);
    setCurrentStep(1);
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  return {
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    resumeId,
    setResumeId,
    isSaving,
    saveError,
    updatePersonalInfo,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    updateSkills,
    saveDraftToBackend,
    clearForm
  };
};
