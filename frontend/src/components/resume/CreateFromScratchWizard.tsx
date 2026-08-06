import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  FolderOpen,
  GraduationCap,
  Info,
  LayoutTemplate,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  UserRound,
  Wrench,
  X
} from 'lucide-react';
import { apiClient } from '../../services/api';
import type {
  EducationItem,
  ExperienceItem,
  PersonalInfo,
  ProjectItem,
  ResumeBuilderData
} from '../../store/resumeBuilderStore';
import { TemplateRegistry, templateMetadata } from './templates';

const DRAFT_KEY = 'bimba.createFromScratchDraft.v1';
const STUDIO_PREFS_KEY = 'bimba.resumeStudioPreferences.v1';
const DEFAULT_TEMPLATE = 'microsoft';

type StepId = 'setup' | 'contact' | 'experience' | 'education' | 'skills' | 'extras' | 'summary';

interface ScratchDraft {
  resumeId: number | null;
  selectedTemplate: string;
  fontFamily: string;
  fontSize: string;
  data: ResumeBuilderData;
}

interface CreateFromScratchWizardProps {
  initialContact?: Partial<PersonalInfo>;
  isDark?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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

const formatSavedAt = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const hasText = (value?: string) => Boolean(value && value.trim().length > 0);

const isFilledExperience = (item: ExperienceItem) =>
  hasText(item.position) || hasText(item.company) || hasText(item.duration) || hasText(item.description);

const isFilledEducation = (item: EducationItem) =>
  hasText(item.degree) || hasText(item.institution) || hasText(item.year);

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#173404] focus:ring-2 focus:ring-[#173404]/10';
const labelClass = 'text-[10px] font-black uppercase tracking-wider text-slate-500';

export const CreateFromScratchWizard: React.FC<CreateFromScratchWizardProps> = ({
  initialContact,
  onClose,
  onSuccess
}) => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ScratchDraft>(() => loadDraft(initialContact));
  const [activeStep, setActiveStep] = useState<StepId>('contact');
  const [savedAt, setSavedAt] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const steps = useMemo(
    () => [
      { id: 'setup' as const, label: 'Quick Setup', sublabel: 'Template', icon: LayoutTemplate },
      { id: 'contact' as const, label: 'Contact', sublabel: 'Required', icon: UserRound },
      { id: 'experience' as const, label: 'Experience', sublabel: 'Repeatable', icon: Briefcase },
      { id: 'education' as const, label: 'Education', sublabel: 'Repeatable', icon: GraduationCap },
      { id: 'skills' as const, label: 'Skills', sublabel: 'Repeatable', icon: Wrench },
      { id: 'extras' as const, label: 'Extras', sublabel: 'Optional', icon: FolderOpen },
      { id: 'summary' as const, label: 'Summary', sublabel: 'Last Pass', icon: FileText }
    ],
    []
  );

  const personalInfo = draft.data.personal_info;
  const contactComplete =
    hasText(personalInfo.name) && hasText(personalInfo.email) && hasText(personalInfo.phone) && hasText(personalInfo.location);
  const hasExperience = draft.data.experience.some(isFilledExperience);
  const hasEducation = draft.data.education.some(isFilledEducation);
  const canContinue = contactComplete && (hasExperience || hasEducation);

  const completedSteps = [
    Boolean(draft.selectedTemplate),
    contactComplete,
    hasExperience,
    hasEducation,
    draft.data.skills.length > 0,
    draft.data.projects.length > 0 || (draft.data.certifications || []).length > 0 || (draft.data.portfolioLinks || []).length > 0,
    hasText(draft.data.summary)
  ].filter(Boolean).length;
  const progress = Math.round((completedSteps / steps.length) * 100);
  const activeIndex = steps.findIndex((step) => step.id === activeStep);

  useEffect(() => {
    setIsSaving(true);
    const timer = window.setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setSavedAt(new Date());
      setIsSaving(false);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [draft]);

  const updateData = (updater: (prev: ResumeBuilderData) => ResumeBuilderData) => {
    setDraft((prev) => ({
      ...prev,
      data: updater(prev.data)
    }));
  };

  const updateContact = (field: keyof PersonalInfo, value: string) => {
    updateData((prev) => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        [field]: value
      }
    }));
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

  const addCertification = () => {
    updateData((prev) => ({
      ...prev,
      certifications: [...(prev.certifications || []), { name: '', organization: '', issue_date: '' }]
    }));
  };

  const updateCertification = (index: number, field: string, value: string) => {
    updateData((prev) => {
      const next = [...(prev.certifications || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, certifications: next };
    });
  };

  const removeCertification = (index: number) => {
    updateData((prev) => ({ ...prev, certifications: (prev.certifications || []).filter((_, idx) => idx !== index) }));
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
    if (!canContinue) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const resumeId = await ensureRemoteDraft();
      persistStudioPreferences();
      localStorage.removeItem(DRAFT_KEY);
      onSuccess?.();
      navigate(`/resume-builder?id=${resumeId}`);
    } catch (err) {
      console.error("Failed to navigate to editor:", err);
      setErrorMsg('Could not open the resume editor. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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

  const TemplateComponent = TemplateRegistry[draft.selectedTemplate] || TemplateRegistry.harvard;

  const stepCopy: Record<StepId, { heading: string; description: string }> = {
    setup: {
      heading: 'Choose a starting template',
      description: 'Pick the ATS-safe layout your draft should use in the preview and editor.'
    },
    contact: {
      heading: 'Contact information',
      description: 'This is the only personal section needed before opening the full editor.'
    },
    experience: {
      heading: 'Work experience',
      description: 'Add roles, dates, and bullets now, or leave room to refine them in the editor.'
    },
    education: {
      heading: 'Education',
      description: 'Add at least one education entry if you do not have work experience yet.'
    },
    skills: {
      heading: 'Technical Skills',
      description: 'Add skills that should appear in your ATS-friendly summary. Type and press Enter or click Add.'
    },
    extras: {
      heading: 'Extras',
      description: 'Capture projects, certifications, and links that can strengthen the resume.'
    },
    summary: {
      heading: 'Professional summary',
      description: 'Write a final pass after the rest of the content is in place.'
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="flex h-[85vh] w-[min(1560px,calc(100vw-32px))] flex-col overflow-hidden rounded-[28px] border border-white/80 bg-[#F8F7F2] text-left shadow-2xl">
        <header className="bg-white px-5 py-4 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#DDE9D5] bg-[#EEF6E8] text-[#173404]">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950">Create From Scratch</h2>
                <p className="mt-0.5 text-sm font-semibold text-slate-500">
                  Draft autosaves locally and opens in the same resume editor as uploads.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600">
                <Save size={12} />
                {isSaving ? 'Saving...' : `Saved ${formatSavedAt(savedAt)}`}
              </span>
              <button
                type="button"
                onClick={handleBack}
                disabled={activeIndex === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={activeIndex === steps.length - 1}
                className="inline-flex items-center gap-2 rounded-xl bg-[#173404] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#214807] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Next
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-slate-900"
                aria-label="Close create from scratch wizard"
              >
                <X size={17} />
              </button>
            </div>
          </div>
        </header>

        <div className="h-1 bg-slate-200">
          <div className="h-full bg-[#173404] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[260px_minmax(480px,1fr)_430px]">
          <aside className="hidden min-h-0 flex-col border-r border-slate-200 bg-[#FAFAF7] p-5 xl:flex">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Progress</span>
              <span className="text-sm font-black text-[#173404]">{progress}%</span>
            </div>

            <div className="flex flex-col gap-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === step.id;
                const complete =
                  (step.id === 'setup' && Boolean(draft.selectedTemplate)) ||
                  (step.id === 'contact' && contactComplete) ||
                  (step.id === 'experience' && hasExperience) ||
                  (step.id === 'education' && hasEducation) ||
                  (step.id === 'skills' && draft.data.skills.length > 0) ||
                  (step.id === 'extras' &&
                    (draft.data.projects.length > 0 ||
                      (draft.data.certifications || []).length > 0 ||
                      (draft.data.portfolioLinks || []).length > 0)) ||
                  (step.id === 'summary' && hasText(draft.data.summary));

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                      isActive ? 'border-[#173404] bg-white shadow-sm' : 'border-transparent hover:bg-white/70'
                    }`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-black text-slate-800">{step.label}</span>
                      <span className="block text-[9px] font-black uppercase tracking-wider text-slate-500">
                        {step.sublabel}
                      </span>
                    </span>
                    {complete && index <= activeIndex ? (
                      <CheckCircle2 size={15} className="text-[#517A3F]" />
                    ) : (
                      <ChevronRight size={15} className="text-slate-400" />
                    )}
                  </button>
                );
              })}
            </div>

            <div
              className={`mt-auto rounded-2xl border p-4 ${
                canContinue ? 'border-[#DDE9D5] bg-[#F1F8EA]' : 'border-[#E7DFC8] bg-[#FFF9E8]'
              }`}
            >
              <div className="flex items-start gap-2">
                {canContinue ? (
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#517A3F]" />
                ) : (
                  <Info size={15} className="mt-0.5 shrink-0 text-amber-600" />
                )}
                <div>
                  <p className="text-[11px] font-black text-slate-800">
                    {canContinue ? 'Ready for editor' : 'Needed for editor'}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500">
                    {canContinue
                      ? 'Your required contact and resume foundation are in place.'
                      : 'Add at least one experience or education entry.'}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto p-5 sm:p-7">
            <div className="mb-5 xl:hidden">
              <select
                value={activeStep}
                onChange={(event) => setActiveStep(event.target.value as StepId)}
                className={`${fieldClass} bg-white`}
              >
                {steps.map((step) => (
                  <option key={step.id} value={step.id}>
                    {step.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#517A3F]">Create From Scratch</p>
              <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{stepCopy[activeStep].heading}</h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">{stepCopy[activeStep].description}</p>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {activeStep === 'setup' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {templateMetadata.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, selectedTemplate: template.id }))}
                      className={`rounded-2xl border p-4 text-left transition ${
                        draft.selectedTemplate === template.id
                          ? 'border-[#173404] bg-[#F1F8EA] shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-black text-slate-900">{template.name}</h4>
                        {draft.selectedTemplate === template.id && <CheckCircle2 size={17} className="text-[#173404]" />}
                      </div>
                      <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">{template.audience}</p>
                    </button>
                  ))}
                </div>
              )}

              {activeStep === 'contact' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 sm:col-span-2">
                    <span className={labelClass}>Full Name</span>
                    <input
                      type="text"
                      value={personalInfo.name}
                      onChange={(event) => updateContact('name', event.target.value)}
                      className={fieldClass}
                      placeholder="Srajan Kharvi"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>Email</span>
                    <input
                      type="email"
                      value={personalInfo.email}
                      onChange={(event) => updateContact('email', event.target.value)}
                      className={fieldClass}
                      placeholder="you@example.com"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>Phone</span>
                    <input
                      type="text"
                      value={personalInfo.phone}
                      onChange={(event) => updateContact('phone', event.target.value)}
                      className={fieldClass}
                      placeholder="+91 90000 00000"
                    />
                  </label>
                  <label className="flex flex-col gap-2 sm:col-span-2">
                    <span className={labelClass}>Location</span>
                    <input
                      type="text"
                      value={personalInfo.location}
                      onChange={(event) => updateContact('location', event.target.value)}
                      className={fieldClass}
                      placeholder="City, State"
                    />
                  </label>
                </div>
              )}

              {activeStep === 'experience' && (
                <RepeatableSection
                  addLabel="Add Experience"
                  isEmpty={draft.data.experience.length === 0}
                  emptyText="Add your first role to unlock Continue to Editor."
                  onAdd={addExperience}
                >
                  {draft.data.experience.map((experience, index) => (
                    <EntryCard key={index} title={`Experience ${index + 1}`} onRemove={() => removeExperience(index)}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InputField
                          label="Position"
                          value={experience.position}
                          onChange={(value) => updateExperience(index, 'position', value)}
                        />
                        <InputField
                          label="Company"
                          value={experience.company}
                          onChange={(value) => updateExperience(index, 'company', value)}
                        />
                        <InputField
                          label="Duration"
                          value={experience.duration}
                          onChange={(value) => updateExperience(index, 'duration', value)}
                          className="sm:col-span-2"
                          placeholder="Jan 2024 - Present"
                        />
                        <TextAreaField
                          label="Description / Bullets"
                          value={experience.description}
                          onChange={(value) => updateExperience(index, 'description', value)}
                          className="sm:col-span-2"
                          rows={4}
                        />
                      </div>
                    </EntryCard>
                  ))}
                </RepeatableSection>
              )}

              {activeStep === 'education' && (
                <RepeatableSection
                  addLabel="Add Education"
                  isEmpty={draft.data.education.length === 0}
                  emptyText="Education can satisfy the editor requirement if experience is not ready."
                  onAdd={addEducation}
                >
                  {draft.data.education.map((education, index) => (
                    <EntryCard key={index} title={`Education ${index + 1}`} onRemove={() => removeEducation(index)}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InputField
                          label="Degree"
                          value={education.degree}
                          onChange={(value) => updateEducation(index, 'degree', value)}
                        />
                        <InputField
                          label="Institution"
                          value={education.institution}
                          onChange={(value) => updateEducation(index, 'institution', value)}
                        />
                        <InputField
                          label="Year"
                          value={education.year}
                          onChange={(value) => updateEducation(index, 'year', value)}
                          className="sm:col-span-2"
                        />
                      </div>
                    </EntryCard>
                  ))}
                </RepeatableSection>
              )}

              {activeStep === 'skills' && (
                <SkillsChipInput
                  label="Technical Skills"
                  skills={draft.data.skills}
                  onChange={(nextSkills) => {
                    updateData((prev) => ({
                      ...prev,
                      skills: nextSkills,
                      technicalSkills: nextSkills
                    }));
                  }}
                  placeholder="e.g. React, Python, Java"
                />
              )}

              {activeStep === 'extras' && (
                <div className="flex flex-col gap-6">
                  <RepeatableSection
                    addLabel="Add Project"
                    isEmpty={draft.data.projects.length === 0}
                    emptyText="Projects are optional, but useful for fresher and portfolio resumes."
                    onAdd={addProject}
                  >
                    {draft.data.projects.map((project, index) => (
                      <EntryCard key={index} title={`Project ${index + 1}`} onRemove={() => removeProject(index)}>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <InputField label="Title" value={project.title} onChange={(value) => updateProject(index, 'title', value)} />
                          <InputField
                            label="Technologies"
                            value={project.technologies}
                            onChange={(value) => updateProject(index, 'technologies', value)}
                          />
                          <TextAreaField
                            label="Description"
                            value={project.description}
                            onChange={(value) => updateProject(index, 'description', value)}
                            className="sm:col-span-2"
                            rows={3}
                          />
                        </div>
                      </EntryCard>
                    ))}
                  </RepeatableSection>

                  <RepeatableSection
                    addLabel="Add Certification"
                    isEmpty={(draft.data.certifications || []).length === 0}
                    emptyText="Certifications are optional and will carry into the saved draft."
                    onAdd={addCertification}
                  >
                    {(draft.data.certifications || []).map((certification: any, index: number) => (
                      <EntryCard key={index} title={`Certification ${index + 1}`} onRemove={() => removeCertification(index)}>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <InputField
                            label="Name"
                            value={certification.name || ''}
                            onChange={(value) => updateCertification(index, 'name', value)}
                          />
                          <InputField
                            label="Organization"
                            value={certification.organization || ''}
                            onChange={(value) => updateCertification(index, 'organization', value)}
                          />
                          <InputField
                            label="Issue Date"
                            value={certification.issue_date || ''}
                            onChange={(value) => updateCertification(index, 'issue_date', value)}
                            className="sm:col-span-2"
                          />
                        </div>
                      </EntryCard>
                    ))}
                  </RepeatableSection>

                  <TextAreaField
                    label="Portfolio Links"
                    value={(draft.data.portfolioLinks || []).join(', ')}
                    onChange={(value) => {
                      const links = value.split(',').map((link) => link.trim()).filter(Boolean);
                      updateData((prev) => ({ ...prev, portfolioLinks: links }));
                    }}
                    rows={3}
                    placeholder="https://github.com/yourname, https://portfolio.dev"
                  />
                </div>
              )}

              {activeStep === 'summary' && (
                <TextAreaField
                  label="Professional Summary"
                  value={draft.data.summary}
                  onChange={(value) => updateData((prev) => ({ ...prev, summary: value }))}
                  rows={9}
                  placeholder="Detail-oriented frontend developer with experience building reliable, measurable products..."
                />
              )}
            </section>
          </main>

          <aside className="hidden min-h-0 flex-col border-l border-slate-200 bg-white p-5 xl:flex">
            <div className="min-h-0 flex-1 overflow-auto rounded-[24px] border border-slate-200 bg-[#EEF1F5] p-5 shadow-inner">
              <div className="w-[800px] origin-top-left scale-[0.48] rounded-xl bg-white shadow-xl">
                <TemplateComponent data={draft.data} fontFamily={draft.fontFamily} fontSize={draft.fontSize} />
              </div>
            </div>
          </aside>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex flex-col">
            <p className="text-xs font-semibold text-slate-500">
              Continue is available from any section once contact plus experience or education is present.
            </p>
            {errorMsg && <p className="mt-1 text-xs font-bold text-rose-500">{errorMsg}</p>}
          </div>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue || submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173404] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#214807] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            Continue to Editor
          </button>
        </footer>
      </div>
    </div>
  );
};

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}> = ({ label, value, onChange, className = '', placeholder }) => (
  <label className={`flex flex-col gap-2 ${className}`}>
    <span className={labelClass}>{label}</span>
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={fieldClass}
      placeholder={placeholder}
    />
  </label>
);

const TextAreaField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  rows?: number;
  placeholder?: string;
}> = ({ label, value, onChange, className = '', rows = 4, placeholder }) => (
  <label className={`flex flex-col gap-2 ${className}`}>
    <span className={labelClass}>{label}</span>
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      className={`${fieldClass} resize-none leading-relaxed`}
      placeholder={placeholder}
    />
  </label>
);

const EntryCard: React.FC<{
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}> = ({ title, onRemove, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">{title}</h4>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-white text-rose-500 transition hover:bg-rose-50"
        aria-label={`Remove ${title}`}
      >
        <Trash2 size={14} />
      </button>
    </div>
    {children}
  </div>
);

const RepeatableSection: React.FC<{
  addLabel: string;
  emptyText: string;
  isEmpty: boolean;
  onAdd: () => void;
  children: React.ReactNode;
}> = ({ addLabel, emptyText, isEmpty, onAdd, children }) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs font-semibold text-slate-500">{isEmpty ? emptyText : 'Add, edit, or remove entries as needed.'}</p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-black text-white transition hover:bg-slate-800"
      >
        <Plus size={13} />
        {addLabel}
      </button>
    </div>
    {children}
  </div>
);

const SkillsChipInput: React.FC<{
  label: string;
  skills: string[];
  onChange: (skills: string[]) => void;
  className?: string;
  placeholder?: string;
}> = ({ label, skills, onChange, className = '', placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = (value: string) => {
    const newSkills = value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !skills.includes(s));
    
    if (newSkills.length > 0) {
      onChange([...skills, ...newSkills]);
    }
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(inputValue);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    handleAdd(pasted);
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(skills.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <label className="flex flex-col gap-2">
        <span className={labelClass}>{label}</span>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className={`${fieldClass} flex-1`}
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => handleAdd(inputValue)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[11px] font-black text-white transition hover:bg-slate-800"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </label>
      
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
            >
              {skill}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                aria-label={`Remove ${skill}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreateFromScratchWizard;
