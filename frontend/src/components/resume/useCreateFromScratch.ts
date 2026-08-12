import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api';
import type {
  EducationItem,
  ExperienceItem,
  PersonalInfo,
  ProjectItem,
  ResumeBuilderData
} from '../../store/resumeBuilderStore';

const DRAFT_KEY = 'bimba.createFromScratchDraft.v1';
const STUDIO_PREFS_KEY = 'bimba.resumeStudioPreferences.v1';
const DEFAULT_TEMPLATE = 'microsoft';

export type StepId = 'setup' | 'contact' | 'experience' | 'education' | 'skills' | 'extras' | 'summary';

export interface ScratchDraft {
  resumeId: number | null;
  selectedTemplate: string;
  fontFamily: string;
  fontSize: string;
  data: ResumeBuilderData;
}

const emptyResumeData = (initialContact?: Partial<PersonalInfo>): ResumeBuilderData => ({
  personal_info: {
    name: initialContact?.name || '',
    email: initialContact?.email || '',
    phone: initialContact?.phone || '',
    location: initialContact?.location || ''
  },
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

const createInitialDraft = (initialContact?: Partial<PersonalInfo>): ScratchDraft => ({
  resumeId: null,
  selectedTemplate: DEFAULT_TEMPLATE,
  fontFamily: 'Roboto',
  fontSize: '12pt',
  data: emptyResumeData(initialContact)
});

const normalizeDraft = (candidate: Partial<ScratchDraft> | null, initialContact?: Partial<PersonalInfo>): ScratchDraft => {
  const fresh = createInitialDraft(initialContact);
  if (!candidate || typeof candidate !== 'object') return fresh;

  return {
    resumeId: typeof candidate.resumeId === 'number' ? candidate.resumeId : null,
    selectedTemplate: candidate.selectedTemplate || fresh.selectedTemplate,
    fontFamily: candidate.fontFamily || fresh.fontFamily,
    fontSize: candidate.fontSize || fresh.fontSize,
    data: {
      ...fresh.data,
      ...(candidate.data || {}),
      personal_info: {
        ...fresh.data.personal_info,
        ...(candidate.data?.personal_info || {})
      },
      skills: Array.isArray(candidate.data?.skills) ? candidate.data.skills : [],
      technicalSkills: Array.isArray(candidate.data?.technicalSkills)
        ? candidate.data.technicalSkills
        : Array.isArray(candidate.data?.skills)
          ? candidate.data.skills
          : [],
      experience: Array.isArray(candidate.data?.experience) ? candidate.data.experience : [],
      projects: Array.isArray(candidate.data?.projects) ? candidate.data.projects : [],
      education: Array.isArray(candidate.data?.education) ? candidate.data.education : [],
      certifications: Array.isArray(candidate.data?.certifications) ? candidate.data.certifications : [],
      portfolioLinks: Array.isArray(candidate.data?.portfolioLinks) ? candidate.data.portfolioLinks : []
    }
  };
};

const loadDraft = (initialContact?: Partial<PersonalInfo>) => {
  try {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (!stored) return createInitialDraft(initialContact);
    return normalizeDraft(JSON.parse(stored), initialContact);
  } catch (err) {
    console.warn('Unable to restore scratch resume draft:', err);
    return createInitialDraft(initialContact);
  }
};

const hasText = (value?: string) => Boolean(value && value.trim().length > 0);

const isFilledExperience = (item: ExperienceItem) =>
  hasText(item.position) || hasText(item.company) || hasText(item.duration) || hasText(item.description);

const isFilledEducation = (item: EducationItem) =>
  hasText(item.degree) || hasText(item.institution) || hasText(item.year);

export interface CreateFromScratchProps {
  initialContact?: Partial<PersonalInfo>;
  initialData?: ResumeBuilderData | null;
  resumeId?: number | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const useCreateFromScratch = ({
  initialContact,
  initialData,
  resumeId,
  onClose,
  onSuccess
}: CreateFromScratchProps) => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ScratchDraft>(() => {
    if (initialData) {
      return normalizeDraft({
        resumeId: resumeId || null,
        data: initialData
      });
    }
    return loadDraft(initialContact);
  });

  const [activeStep, setActiveStep] = useState<StepId>('setup');
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Field validation and touched tracking for contact step
  const [touchedFields, setTouchedFields] = useState<Record<keyof PersonalInfo, boolean>>({
    name: false,
    email: false,
    phone: false,
    location: false
  });

  // Calculate errors
  const errors = useMemo(() => {
    const errs: Record<keyof PersonalInfo, string> = {
      name: '',
      email: '',
      phone: '',
      location: ''
    };
    const pi = draft.data.personal_info;

    if (!hasText(pi.name)) {
      errs.name = 'Full name is required';
    }
    if (!hasText(pi.email)) {
      errs.email = 'Email is required';
    } else if (!pi.email.includes('@')) {
      errs.email = 'Please enter a valid email address';
    }
    if (!hasText(pi.phone)) {
      errs.phone = 'Phone number is required';
    }
    if (!hasText(pi.location)) {
      errs.location = 'Location is required';
    }

    return errs;
  }, [draft.data.personal_info]);

  const contactComplete = !errors.name && !errors.email && !errors.phone && !errors.location;
  const hasExperience = draft.data.experience.some(isFilledExperience);
  const hasEducation = draft.data.education.some(isFilledEducation);
  const canContinue = contactComplete && (hasExperience || hasEducation);

  // Check visited steps with partial-error/incomplete states
  const contactVisited = touchedFields.name || touchedFields.email || touchedFields.phone || touchedFields.location;
  const contactHasPartialError = contactVisited && !contactComplete;

  // Live preview data (debounced alongside autosave)
  const [previewData, setPreviewData] = useState<ResumeBuilderData>(draft.data);

  // Autosave and Preview sync
  useEffect(() => {
    setAutosaveStatus('saving');
    const timer = window.setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setPreviewData(draft.data);
      setAutosaveStatus('saved');
      
      // Fade status indicator after 2s
      const fadeTimer = window.setTimeout(() => {
        setAutosaveStatus('idle');
      }, 2000);
      return () => window.clearTimeout(fadeTimer);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [draft]);

  const updateData = (updater: (prev: ResumeBuilderData) => ResumeBuilderData) => {
    setDraft((prev) => ({
      ...prev,
      data: updater(prev.data)
    }));
  };

  const updateContactField = (field: keyof PersonalInfo, value: string) => {
    updateData((prev) => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        [field]: value
      }
    }));
  };

  const blurContactField = (field: keyof PersonalInfo) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const updateExperience = (index: number, field: keyof ExperienceItem, value: string) => {
    updateData((prev) => {
      const next = [...prev.experience];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, experience: next };
    });
  };

  const addExperience = () => {
    updateData((prev) => ({
      ...prev,
      experience: [...prev.experience, { position: '', company: '', duration: '', description: '' }]
    }));
  };

  const removeExperience = (index: number) => {
    updateData((prev) => ({ ...prev, experience: prev.experience.filter((_, idx) => idx !== index) }));
  };

  const updateEducation = (index: number, field: keyof EducationItem, value: string) => {
    updateData((prev) => {
      const next = [...prev.education];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, education: next };
    });
  };

  const addEducation = () => {
    updateData((prev) => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', year: '' }]
    }));
  };

  const removeEducation = (index: number) => {
    updateData((prev) => ({ ...prev, education: prev.education.filter((_, idx) => idx !== index) }));
  };

  const updateProject = (index: number, field: keyof ProjectItem, value: string) => {
    updateData((prev) => {
      const next = [...prev.projects];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, projects: next };
    });
  };

  const addProject = () => {
    updateData((prev) => ({
      ...prev,
      projects: [...prev.projects, { title: '', technologies: '', description: '' }]
    }));
  };

  const removeProject = (index: number) => {
    updateData((prev) => ({ ...prev, projects: prev.projects.filter((_, idx) => idx !== index) }));
  };

  const updateCertification = (index: number, field: string, value: string) => {
    updateData((prev) => {
      const next = [...(prev.certifications || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, certifications: next };
    });
  };

  const addCertification = () => {
    updateData((prev) => ({
      ...prev,
      certifications: [...(prev.certifications || []), { name: '', organization: '', issue_date: '' }]
    }));
  };

  const removeCertification = (index: number) => {
    updateData((prev) => ({ ...prev, certifications: (prev.certifications || []).filter((_, idx) => idx !== index) }));
  };

  const updateSkills = (nextSkills: string[]) => {
    updateData((prev) => ({
      ...prev,
      skills: nextSkills,
      technicalSkills: nextSkills
    }));
  };

  const updatePortfolioLinks = (value: string) => {
    const links = value.split(',').map((link) => link.trim()).filter(Boolean);
    updateData((prev) => ({ ...prev, portfolioLinks: links }));
  };

  const updateSummary = (value: string) => {
    updateData((prev) => ({ ...prev, summary: value }));
  };

  const selectTemplate = (templateId: string) => {
    setDraft((prev) => ({ ...prev, selectedTemplate: templateId }));
  };

  const payloadForSave = () => ({
    ...draft.data,
    name: draft.data.personal_info.name || 'New Resume Draft',
    template_id: draft.selectedTemplate,
    selected_template: draft.selectedTemplate
  });

  const persistStudioPreferences = () => {
    localStorage.setItem(
      STUDIO_PREFS_KEY,
      JSON.stringify({
        selectedTemplate: draft.selectedTemplate,
        fontFamily: draft.fontFamily,
        fontSize: draft.fontSize
      })
    );
  };

  const ensureRemoteDraft = async () => {
    const payload = payloadForSave();
    if (draft.resumeId) {
      await apiClient.put(`/api/resume-studio/${draft.resumeId}/update`, payload);
      return draft.resumeId;
    }

    const response = await apiClient.post('/api/resume-studio/create', payload);
    const nextId = response.data?.id;
    if (!nextId) throw new Error('Resume draft was not created.');
    await apiClient.put(`/api/resume-studio/${nextId}/update`, payload);
    setDraft((prev) => ({ ...prev, resumeId: nextId }));
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, resumeId: nextId }));
    return nextId as number;
  };

  const handleContinue = async () => {
    if (!canContinue) {
      // Touch all contact fields to trigger validation errors immediately
      setTouchedFields({
        name: true,
        email: true,
        phone: true,
        location: true
      });
      // Navigate to the first unmet requirement
      if (!contactComplete) {
        setActiveStep('contact');
      } else {
        // Must be missing experience and education
        setActiveStep('experience');
      }
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const remoteId = await ensureRemoteDraft();
      persistStudioPreferences();
      localStorage.removeItem(DRAFT_KEY);
      onSuccess?.();
      navigate(`/resume-builder?id=${remoteId}`);
    } catch (err) {
      console.error("Failed to navigate to editor:", err);
      setErrorMsg('Could not open the resume editor. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { id: 'setup' as const, label: 'Quick Setup', sublabel: 'Template' },
    { id: 'contact' as const, label: 'Contact', sublabel: 'Required' },
    { id: 'experience' as const, label: 'Experience', sublabel: 'Repeatable' },
    { id: 'education' as const, label: 'Education', sublabel: 'Repeatable' },
    { id: 'skills' as const, label: 'Skills', sublabel: 'Repeatable' },
    { id: 'extras' as const, label: 'Extras', sublabel: 'Optional' },
    { id: 'summary' as const, label: 'Summary', sublabel: 'Last Pass' }
  ];

  const activeIndex = steps.findIndex((step) => step.id === activeStep);

  const handleNext = () => {
    if (activeIndex < steps.length - 1) {
      setActiveStep(steps[activeIndex + 1].id);
    }
  };

  const handleBack = () => {
    if (activeIndex > 0) {
      setActiveStep(steps[activeIndex - 1].id);
    }
  };

  // Progress is fraction of REQUIRED steps completed (setup and contact)
  const setupDone = Boolean(draft.selectedTemplate);
  const contactDone = contactComplete;
  const experienceDone = hasExperience;
  const educationDone = hasEducation;
  
  // Required is: Setup, Contact, plus at least one of Experience or Education
  const requiredCompleted = (setupDone ? 1 : 0) + (contactDone ? 1 : 0) + ((experienceDone || educationDone) ? 1 : 0);
  const progress = Math.round((requiredCompleted / 3) * 100);

  return {
    draft,
    previewData,
    activeStep,
    setActiveStep,
    steps,
    activeIndex,
    autosaveStatus,
    submitting,
    errorMsg,
    touchedFields,
    errors,
    contactComplete,
    contactHasPartialError,
    hasExperience,
    hasEducation,
    canContinue,
    progress,
    updateContactField,
    blurContactField,
    updateExperience,
    addExperience,
    removeExperience,
    updateEducation,
    addEducation,
    removeEducation,
    updateProject,
    addProject,
    removeProject,
    updateCertification,
    addCertification,
    removeCertification,
    updateSkills,
    updatePortfolioLinks,
    updateSummary,
    selectTemplate,
    handleContinue,
    handleNext,
    handleBack
  };
};
