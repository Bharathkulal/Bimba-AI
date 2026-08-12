import React, { useState } from 'react';
import { useIsMobileViewport } from '../../features/resume-builder/hooks/useIsMobileViewport';
import { useCreateFromScratch, type StepId } from './useCreateFromScratch';
import { TemplateRegistry } from './templates';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
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
  X,
  AlertTriangle
} from 'lucide-react';

interface CreateFromScratchWizardProps {
  initialContact?: any;
  initialData?: any;
  resumeId?: number | null;
  isDark?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const templatesList = [
  { id: 'harvard', name: 'Classic Serif', audience: 'All Candidates, 100% ATS Compliant' },
  { id: 'jakes', name: 'Jake\'s Classic', audience: 'Software Engineers' },
  { id: 'stanford', name: 'Stanford Executive', audience: 'Corporate Careers' },
  { id: 'minimalist-modern', name: 'Minimal Modern', audience: 'Creative & Tech' },
  { id: 'microsoft', name: 'Microsoft Standard', audience: 'General Industry' }
];

export const CreateFromScratchWizard: React.FC<CreateFromScratchWizardProps> = ({
  initialContact,
  initialData,
  resumeId,
  isDark,
  onClose,
  onSuccess
}) => {
  const isMobile = useIsMobileViewport();
  const {
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
  } = useCreateFromScratch({
    initialContact,
    initialData,
    resumeId,
    onClose,
    onSuccess
  });

  const [desktopShowPreviewPanel, setDesktopShowPreviewPanel] = useState(false);

  const isStepCompleted = (stepId: StepId) => {
    if (stepId === 'setup') return Boolean(draft.selectedTemplate);
    if (stepId === 'contact') return contactComplete;
    if (stepId === 'experience') return hasExperience;
    if (stepId === 'education') return hasEducation;
    if (stepId === 'skills') return draft.data.skills.length > 0;
    if (stepId === 'extras') {
      return (
        draft.data.projects.length > 0 ||
        (draft.data.certifications || []).length > 0 ||
        (draft.data.portfolioLinks || []).length > 0
      );
    }
    if (stepId === 'summary') return Boolean(draft.data.summary && draft.data.summary.trim().length > 0);
    return false;
  };

  const getStepIcon = (stepId: StepId) => {
    if (stepId === 'setup') return LayoutTemplate;
    if (stepId === 'contact') return UserRound;
    if (stepId === 'experience') return Briefcase;
    if (stepId === 'education') return GraduationCap;
    if (stepId === 'skills') return Wrench;
    if (stepId === 'extras') return FolderOpen;
    return FileText;
  };

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
      heading: 'Technical skills',
      description: 'Add skills that should appear in your ATS-friendly summary. Type and press Enter or comma.'
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

  // Render inline preview element
  const TemplateComponent = TemplateRegistry[draft.selectedTemplate] || TemplateRegistry.harvard;

  // Header components
  const renderHeaderAutosaveStatus = () => {
    if (autosaveStatus === 'saving') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-500 animate-pulse">
          <Save size={12} />
          Saving...
        </span>
      );
    }
    if (autosaveStatus === 'saved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#517A3F] transition-opacity duration-300">
          <CheckCircle2 size={12} />
          Saved
        </span>
      );
    }
    return null;
  };

  // Render components for steps
  const renderStepForm = () => {
    switch (activeStep) {
      case 'setup':
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templatesList.map((tpl) => {
              const isSelected = draft.selectedTemplate === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => selectTemplate(tpl.id)}
                  className={`relative rounded-xl border text-left p-4 transition-all duration-200 flex flex-col gap-3 group cursor-pointer ${
                    isSelected
                      ? 'border-[#173404] ring-2 ring-[#173404]/15 bg-[#F1F8EA]'
                      : 'border-slate-200 bg-white hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{tpl.name}</span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 bg-[#173404] text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  {/* Skeleton Preview */}
                  <div className="h-28 w-full bg-slate-50 rounded-lg p-2.5 flex flex-col gap-1.5 border border-slate-100 overflow-hidden group-hover:bg-slate-100/50 transition">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-2 w-16 bg-slate-300 rounded" />
                      <div className="h-1 w-24 bg-slate-200 rounded" />
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="h-1.5 w-8 bg-slate-350 rounded" />
                      <div className="h-0.5 w-full bg-slate-200 rounded" />
                      <div className="flex justify-between mt-0.5">
                        <div className="h-1 w-20 bg-slate-200 rounded" />
                        <div className="h-1 w-10 bg-slate-200 rounded" />
                      </div>
                      <div className="h-1 w-full bg-slate-150 rounded" />
                      <div className="h-1 w-3/4 bg-slate-150 rounded" />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 leading-normal">
                    {tpl.audience}
                  </span>
                </button>
              );
            })}
          </div>
        );

      case 'contact':
        return (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Full name</span>
                <input
                  type="text"
                  value={draft.data.personal_info.name}
                  onChange={(e) => updateContactField('name', e.target.value)}
                  onBlur={() => blurContactField('name')}
                  className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:ring-2 focus:ring-[#173404]/10 min-h-[44px] ${
                    touchedFields.name && errors.name
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-200 focus:border-[#173404]'
                  }`}
                  placeholder="Srajan Kharvi"
                />
                {touchedFields.name && errors.name && (
                  <p className="text-xs font-semibold text-rose-500">{errors.name}</p>
                )}
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Email</span>
                <input
                  type="email"
                  value={draft.data.personal_info.email}
                  onChange={(e) => updateContactField('email', e.target.value)}
                  onBlur={() => blurContactField('email')}
                  className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:ring-2 focus:ring-[#173404]/10 min-h-[44px] ${
                    touchedFields.email && errors.email
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-200 focus:border-[#173404]'
                  }`}
                  placeholder="you@example.com"
                />
                {touchedFields.email && errors.email && (
                  <p className="text-xs font-semibold text-rose-500">{errors.email}</p>
                )}
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Phone</span>
                <input
                  type="text"
                  value={draft.data.personal_info.phone}
                  onChange={(e) => updateContactField('phone', e.target.value)}
                  onBlur={() => blurContactField('phone')}
                  className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:ring-2 focus:ring-[#173404]/10 min-h-[44px] ${
                    touchedFields.phone && errors.phone
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-200 focus:border-[#173404]'
                  }`}
                  placeholder="+91 90000 00000"
                />
                {touchedFields.phone && errors.phone && (
                  <p className="text-xs font-semibold text-rose-500">{errors.phone}</p>
                )}
              </label>

              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Location</span>
                <input
                  type="text"
                  value={draft.data.personal_info.location}
                  onChange={(e) => updateContactField('location', e.target.value)}
                  onBlur={() => blurContactField('location')}
                  className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:ring-2 focus:ring-[#173404]/10 min-h-[44px] ${
                    touchedFields.location && errors.location
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-200 focus:border-[#173404]'
                  }`}
                  placeholder="City, State"
                />
                {touchedFields.location && errors.location && (
                  <p className="text-xs font-semibold text-rose-500">{errors.location}</p>
                )}
              </label>
            </div>
          </div>
        );

      case 'experience':
        return (
          <div className="flex flex-col gap-4">
            {draft.data.experience.length === 0 ? (
              <button
                type="button"
                onClick={addExperience}
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-slate-400 bg-white rounded-2xl p-8 transition cursor-pointer text-center"
              >
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 mb-3 text-slate-500">
                  <Briefcase size={20} />
                </div>
                <h4 className="text-sm font-black text-slate-800">Add your first role</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-normal">
                  Add work history details. If you are a student or fresher, you can satisfy requirements with Education instead.
                </p>
              </button>
            ) : (
              <div className="flex flex-col gap-4">
                {draft.data.experience.map((exp, idx) => (
                  <EntryCard
                    key={idx}
                    title={`Experience ${idx + 1}`}
                    onRemove={() => removeExperience(idx)}
                  >
                    <div className="grid gap-4 sm:grid-cols-2 mt-4">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Position</span>
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => updateExperience(idx, 'position', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-850 outline-none focus:border-[#173404] focus:ring-2 focus:ring-[#173404]/10 bg-white min-h-[44px]"
                          placeholder="Software Engineer"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Company</span>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-855 outline-none focus:border-[#173404] focus:ring-2 focus:ring-[#173404]/10 bg-white min-h-[44px]"
                          placeholder="Acme Corp"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5 sm:col-span-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Duration</span>
                        <input
                          type="text"
                          value={exp.duration}
                          onChange={(e) => updateExperience(idx, 'duration', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-856 outline-none focus:border-[#173404] focus:ring-2 focus:ring-[#173404]/10 bg-white min-h-[44px]"
                          placeholder="Jan 2024 - Present"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5 sm:col-span-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Description / Bullets</span>
                        <textarea
                          value={exp.description}
                          onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                          rows={4}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-857 outline-none focus:border-[#173404] focus:ring-2 focus:ring-[#173404]/10 bg-white resize-none"
                          placeholder="Designed and maintained web applications..."
                        />
                      </label>
                    </div>
                  </EntryCard>
                ))}
                <button
                  type="button"
                  onClick={addExperience}
                  className="flex items-center justify-center gap-2 py-3 border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black text-slate-700 transition cursor-pointer"
                >
                  <Plus size={14} />
                  Add another role
                </button>
              </div>
            )}
          </div>
        );

      case 'education':
        return (
          <div className="flex flex-col gap-4">
            {draft.data.education.length === 0 ? (
              <button
                type="button"
                onClick={addEducation}
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-slate-400 bg-white rounded-2xl p-8 transition cursor-pointer text-center"
              >
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 mb-3 text-slate-500">
                  <GraduationCap size={20} />
                </div>
                <h4 className="text-sm font-black text-slate-800">Add education</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-normal">
                  Add high school, undergraduate, or master details.
                </p>
              </button>
            ) : (
              <div className="flex flex-col gap-4">
                {draft.data.education.map((edu, idx) => (
                  <EntryCard
                    key={idx}
                    title={`Education ${idx + 1}`}
                    onRemove={() => removeEducation(idx)}
                  >
                    <div className="grid gap-4 sm:grid-cols-2 mt-4">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Degree</span>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-858 outline-none focus:border-[#173404] focus:ring-2 focus:ring-[#173404]/10 bg-white min-h-[44px]"
                          placeholder="Bachelor of Science in Computer Science"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Institution</span>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-859 outline-none focus:border-[#173404] focus:ring-2 focus:ring-[#173404]/10 bg-white min-h-[44px]"
                          placeholder="Stanford University"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5 sm:col-span-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Graduation year</span>
                        <input
                          type="text"
                          value={edu.year}
                          onChange={(e) => updateEducation(idx, 'year', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-860 outline-none focus:border-[#173404] focus:ring-2 focus:ring-[#173404]/10 bg-white min-h-[44px]"
                          placeholder="2026"
                        />
                      </label>
                    </div>
                  </EntryCard>
                ))}
                <button
                  type="button"
                  onClick={addEducation}
                  className="flex items-center justify-center gap-2 py-3 border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black text-slate-700 transition cursor-pointer"
                >
                  <Plus size={14} />
                  Add education card
                </button>
              </div>
            )}
          </div>
        );

      case 'skills':
        return (
          <SkillsChipInput
            label="Technical skills"
            skills={draft.data.skills}
            onChange={updateSkills}
            placeholder="e.g. React, Python, Java"
          />
        );

      case 'extras':
        return (
          <div className="flex flex-col gap-4">
            <CollapsibleSection title="Projects">
              <div className="flex flex-col gap-4 mt-2">
                {draft.data.projects.length === 0 ? (
                  <button
                    type="button"
                    onClick={addProject}
                    className="flex items-center justify-center gap-2 p-4 border border-dashed border-slate-200 hover:border-slate-350 bg-slate-50 rounded-xl text-xs font-black text-slate-650 cursor-pointer"
                  >
                    <Plus size={14} />
                    Add project
                  </button>
                ) : (
                  <>
                    {draft.data.projects.map((proj, idx) => (
                      <EntryCard
                        key={idx}
                        title={`Project ${idx + 1}`}
                        onRemove={() => removeProject(idx)}
                      >
                        <div className="grid gap-4 sm:grid-cols-2 mt-2">
                          <label className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Title</span>
                            <input
                              type="text"
                              value={proj.title}
                              onChange={(e) => updateProject(idx, 'title', e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-861 outline-none focus:border-[#173404] bg-white min-h-[44px]"
                              placeholder="Resume Builder Tool"
                            />
                          </label>
                          <label className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Technologies</span>
                            <input
                              type="text"
                              value={proj.technologies}
                              onChange={(e) => updateProject(idx, 'technologies', e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-862 outline-none focus:border-[#173404] bg-white min-h-[44px]"
                              placeholder="React, TailwindCSS"
                            />
                          </label>
                          <label className="flex flex-col gap-1.5 sm:col-span-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Description</span>
                            <textarea
                              value={proj.description}
                              onChange={(e) => updateProject(idx, 'description', e.target.value)}
                              rows={3}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-863 outline-none focus:border-[#173404] bg-white resize-none"
                              placeholder="Describe your role and impact in the project..."
                            />
                          </label>
                        </div>
                      </EntryCard>
                    ))}
                    <button
                      type="button"
                      onClick={addProject}
                      className="flex items-center justify-center gap-2 py-2 border border-slate-200 hover:border-slate-350 bg-slate-50 rounded-xl text-xs font-black text-slate-700 cursor-pointer"
                    >
                      <Plus size={12} />
                      Add another project
                    </button>
                  </>
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Certifications">
              <div className="flex flex-col gap-4 mt-2">
                {(draft.data.certifications || []).length === 0 ? (
                  <button
                    type="button"
                    onClick={addCertification}
                    className="flex items-center justify-center gap-2 p-4 border border-dashed border-slate-200 hover:border-slate-350 bg-slate-50 rounded-xl text-xs font-black text-slate-650 cursor-pointer"
                  >
                    <Plus size={14} />
                    Add certification
                  </button>
                ) : (
                  <>
                    {(draft.data.certifications || []).map((cert: any, idx: number) => (
                      <EntryCard
                        key={idx}
                        title={`Certification ${idx + 1}`}
                        onRemove={() => removeCertification(idx)}
                      >
                        <div className="grid gap-4 sm:grid-cols-2 mt-2">
                          <label className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Name</span>
                            <input
                              type="text"
                              value={cert.name || ''}
                              onChange={(e) => updateCertification(idx, 'name', e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-864 outline-none focus:border-[#173404] bg-white min-h-[44px]"
                              placeholder="AWS Solutions Architect"
                            />
                          </label>
                          <label className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Organization</span>
                            <input
                              type="text"
                              value={cert.organization || ''}
                              onChange={(e) => updateCertification(idx, 'organization', e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-865 outline-none focus:border-[#173404] bg-white min-h-[44px]"
                              placeholder="Amazon Web Services"
                            />
                          </label>
                          <label className="flex flex-col gap-1.5 sm:col-span-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Issue date</span>
                            <input
                              type="text"
                              value={cert.issue_date || ''}
                              onChange={(e) => updateCertification(idx, 'issue_date', e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-866 outline-none focus:border-[#173404] bg-white min-h-[44px]"
                              placeholder="May 2024"
                            />
                          </label>
                        </div>
                      </EntryCard>
                    ))}
                    <button
                      type="button"
                      onClick={addCertification}
                      className="flex items-center justify-center gap-2 py-2 border border-slate-200 hover:border-slate-350 bg-slate-50 rounded-xl text-xs font-black text-slate-700 cursor-pointer"
                    >
                      <Plus size={12} />
                      Add another certification
                    </button>
                  </>
                )}
              </div>
            </CollapsibleSection>

            <label className="flex flex-col gap-1.5 border border-slate-150 rounded-xl p-4 bg-slate-50/50">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Portfolio & Web links</span>
              <textarea
                value={(draft.data.portfolioLinks || []).join(', ')}
                onChange={(e) => updatePortfolioLinks(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-867 outline-none focus:border-[#173404] bg-white resize-none mt-2"
                placeholder="https://github.com/username, https://portfolio.dev"
              />
            </label>
          </div>
        );

      case 'summary':
        return (
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Professional summary</span>
              <textarea
                value={draft.data.summary}
                onChange={(e) => updateSummary(e.target.value)}
                rows={8}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-868 outline-none focus:border-[#173404] bg-white resize-none leading-relaxed"
                placeholder="Detail-oriented software engineer with 2+ years of experience building reliable web products. Passionate about frontend architecture, code quality, and responsive user experiences..."
              />
            </label>
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-semibold text-slate-400">
                Aim for 3–5 lines summarizing your key credentials and specialization.
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {draft.data.summary?.length || 0} characters
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // RENDER PORTRAIT LAYOUTS (MOBILE VS DESKTOP)
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[80] flex flex-col bg-[#F8F7F2] text-left">
        {/* Header bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-450 hover:text-slate-700 cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <span className="block text-[11px] font-black uppercase tracking-wider text-[#173404]">
                {stepCopy[activeStep].heading}
              </span>
              <span className="block text-[10px] text-slate-400 font-bold">
                Step {activeIndex + 1} / {steps.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {renderHeaderAutosaveStatus()}
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Progress bar */}
        <div className="h-1 bg-slate-150 w-full shrink-0">
          <div
            className="h-full bg-[#173404] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Dot Indicator */}
        <div className="flex items-center justify-center gap-1.5 py-3 border-b border-slate-100 bg-[#FAFAF8] shrink-0">
          {steps.map((st, i) => {
            const isCurrent = activeStep === st.id;
            const isCompleted = isStepCompleted(st.id);
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  if (isCompleted || i <= activeIndex) {
                    setActiveStep(st.id);
                  }
                }}
                className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
                  isCurrent
                    ? 'bg-[#173404] ring-2 ring-[#173404]/20 scale-110'
                    : isCompleted
                      ? 'bg-[#517A3F]'
                      : 'bg-slate-200'
                }`}
                aria-label={`Go to step ${st.label}`}
              />
            );
          })}
        </div>

        {/* Form area scrollable */}
        <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 leading-tight">
              {stepCopy[activeStep].heading}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-1 leading-normal mb-5">
              {stepCopy[activeStep].description}
            </p>
            {renderStepForm()}
          </div>
        </main>

        {/* Sticky bottom bar */}
        <footer className="sticky bottom-0 bg-white border-t border-slate-200 p-4 shrink-0 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDesktopShowPreviewPanel(true)}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-black text-slate-700 transition cursor-pointer text-center"
          >
            Preview
          </button>
          
          {activeIndex === steps.length - 1 ? (
            <button
              type="button"
              onClick={handleContinue}
              className="flex-2 py-3 px-5 rounded-xl bg-[#173404] hover:bg-[#214807] text-white text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow"
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Setting up editor...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Continue to editor
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="flex-2 py-3 px-5 rounded-xl bg-[#173404] hover:bg-[#214807] text-white text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              Next
              <ArrowRight size={14} />
            </button>
          )}
        </footer>

        {/* Mobile Full Screen Preview Sheet */}
        {desktopShowPreviewPanel && (
          <div className="fixed inset-0 z-[90] flex flex-col bg-slate-950/40 backdrop-blur-sm">
            <div className="mt-auto h-[90vh] bg-white rounded-t-[28px] border-t border-slate-200 flex flex-col overflow-hidden shadow-2xl">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Sparkles size={15} className="text-[#173404]" />
                  Live Preview
                </span>
                <button
                  onClick={() => setDesktopShowPreviewPanel(false)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-slate-100 p-4 flex justify-center">
                <div className="w-[800px] origin-top scale-[0.43] rounded-xl bg-white shadow-xl max-h-[85vh] overflow-y-auto mb-20">
                  <TemplateComponent data={previewData} fontFamily={draft.fontFamily} fontSize={draft.fontSize} />
                </div>
              </div>
              <div className="p-4 bg-white border-t border-slate-100 flex justify-center shrink-0">
                <button
                  onClick={() => setDesktopShowPreviewPanel(false)}
                  className="w-full max-w-xs py-3 bg-[#173404] text-white font-black text-xs rounded-xl shadow cursor-pointer"
                >
                  Back to Editing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error notice */}
        {errorMsg && (
          <div className="fixed bottom-20 left-4 right-4 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start gap-2 shadow z-50">
            <AlertTriangle size={15} className="text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-rose-700 leading-normal">{errorMsg}</p>
          </div>
        )}
      </div>
    );
  }

  // DESKTOP VIEW
  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#F8F7F2]">
      {/* Header bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl border border-[#DDE9D5] bg-[#EEF6E8] text-[#173404]">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-tight">Create From Scratch</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Draft builds automatically and promotes to the resume studio workspace.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {renderHeaderAutosaveStatus()}
          
          <button
            type="button"
            onClick={() => setDesktopShowPreviewPanel(!desktopShowPreviewPanel)}
            className="px-4 py-2 text-xs font-black border border-slate-200 rounded-xl hover:bg-slate-50 transition shrink-0 cursor-pointer"
          >
            {desktopShowPreviewPanel ? 'Hide Preview' : 'Show Preview'}
          </button>

          {activeIndex === steps.length - 1 ? (
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173404] hover:bg-[#214807] px-6 py-2.5 text-xs font-black text-white shadow-md transition shrink-0 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Setting up editor...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Continue to editor
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173404] hover:bg-[#214807] px-6 py-2.5 text-xs font-black text-white shadow-md transition shrink-0 cursor-pointer"
            >
              Continue to editor
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900 cursor-pointer shadow-sm"
          >
            <X size={15} />
          </button>
        </div>
      </header>

      {/* Progress indicator */}
      <div className="h-1 bg-slate-150 w-full shrink-0">
        <div
          className="h-full bg-[#173404] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Three-column layout body */}
      <div className="flex-1 overflow-hidden grid grid-cols-[160px_1fr_auto]">
        {/* Left sidebar: fixed 150px sticky */}
        <aside className="border-r border-slate-200 bg-[#FAFAF8] p-4 flex flex-col gap-5 overflow-y-auto">
          {/* Labeled Step Groups */}
          <div className="flex flex-col gap-4">
            <div>
              <span className="block text-[9px] font-black uppercase tracking-widest text-[#173404]/60 mb-2 px-1">
                Required
              </span>
              <div className="flex flex-col gap-1">
                {steps.slice(0, 4).map((st, i) => {
                  const Icon = getStepIcon(st.id);
                  const isCurrent = activeStep === st.id;
                  const isCompleted = isStepCompleted(st.id);
                  const hasErr = st.id === 'contact' && contactHasPartialError;

                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        if (isCompleted || i <= activeIndex) {
                          setActiveStep(st.id);
                        }
                      }}
                      className={`flex items-center gap-2 rounded-xl p-2 text-left transition ${
                        isCurrent
                          ? 'border border-[#173404] bg-white shadow-sm'
                          : 'border border-transparent hover:bg-slate-200/50'
                      }`}
                    >
                      <span className={`h-6 w-6 flex items-center justify-center rounded-lg ${
                        isCurrent
                          ? 'bg-[#EEF6E8] text-[#173404]'
                          : 'bg-white text-slate-400 border border-slate-200'
                      }`}>
                        <Icon size={12} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-black text-slate-800 leading-none">
                          {st.label}
                        </span>
                      </span>
                      {hasErr ? (
                        <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                      ) : isCompleted ? (
                        <CheckCircle2 size={13} className="text-[#517A3F] shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-[9px] font-black uppercase tracking-widest text-[#173404]/60 mb-2 px-1">
                Optional
              </span>
              <div className="flex flex-col gap-1">
                {steps.slice(4).map((st, i) => {
                  const idx = i + 4;
                  const Icon = getStepIcon(st.id);
                  const isCurrent = activeStep === st.id;
                  const isCompleted = isStepCompleted(st.id);

                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        if (isCompleted || idx <= activeIndex) {
                          setActiveStep(st.id);
                        }
                      }}
                      className={`flex items-center gap-2 rounded-xl p-2 text-left transition ${
                        isCurrent
                          ? 'border border-[#173404] bg-white shadow-sm'
                          : 'border border-transparent hover:bg-slate-200/50'
                      }`}
                    >
                      <span className={`h-6 w-6 flex items-center justify-center rounded-lg ${
                        isCurrent
                          ? 'bg-[#EEF6E8] text-[#173404]'
                          : 'bg-white text-slate-400 border border-slate-200'
                      }`}>
                        <Icon size={12} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-black text-slate-800 leading-none">
                          {st.label}
                        </span>
                      </span>
                      {isCompleted ? (
                        <CheckCircle2 size={13} className="text-[#517A3F] shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Validation Help Alert Card */}
          <div className={`mt-auto rounded-xl border p-3 ${
            canContinue ? 'border-[#DDE9D5] bg-[#F1F8EA]' : 'border-[#E7DFC8] bg-[#FFF9E8]'
          }`}>
            <div className="flex gap-2">
              <Info size={13} className={`shrink-0 mt-0.5 ${canContinue ? 'text-[#517A3F]' : 'text-amber-600'}`} />
              <div>
                <p className="text-[10px] font-black text-slate-800">
                  {canContinue ? 'Foundation complete' : 'Foundation incomplete'}
                </p>
                <p className="text-[9px] font-semibold leading-relaxed text-slate-500 mt-0.5">
                  {canContinue
                    ? 'All required sections are ready. Click Continue to Editor.'
                    : 'Required: Setup, Contact details, and at least one role/education card.'}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Center: active step's form */}
        <main className="flex-1 overflow-y-auto p-8 flex justify-center bg-[#F8F7F2]">
          <div className="w-full max-w-[580px] flex flex-col gap-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#517A3F]">
                Step {activeIndex + 1} of {steps.length}
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
                {stepCopy[activeStep].heading}
              </h3>
              <p className="text-sm font-semibold leading-relaxed text-slate-500 mt-1">
                {stepCopy[activeStep].description}
              </p>
            </div>

            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-5">
              {renderStepForm()}

              <div className="mt-8 flex justify-between items-center border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={activeIndex === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 hover:border-slate-350 bg-white px-5 py-2.5 text-xs font-black text-slate-700 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>

                {activeIndex === steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173404] hover:bg-[#214807] px-6 py-2.5 text-xs font-black text-white shadow-sm transition cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Setting up editor...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        Continue to editor
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173404] hover:bg-[#214807] px-6 py-2.5 text-xs font-black text-white shadow-sm transition cursor-pointer"
                  >
                    Next
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </section>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start gap-2 shadow-sm mt-2">
                <AlertTriangle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-rose-700 leading-normal">{errorMsg}</p>
              </div>
            )}
          </div>
        </main>

        {/* Right rail: fixed 220px inline preview (expanded/collapsed depending on toggle) */}
        {(!desktopShowPreviewPanel) ? (
          <aside className="border-l border-slate-200 bg-white p-5 flex flex-col shrink-0 w-[240px] items-center overflow-y-auto">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-4 self-start">
              Live Preview
            </span>
            <div className="w-[190px] border border-slate-200 bg-slate-50 p-2.5 rounded-xl shadow-inner min-h-[300px] flex items-start justify-center overflow-hidden">
              <div className="w-[800px] origin-top scale-[0.22] bg-white shadow-lg">
                <TemplateComponent data={previewData} fontFamily={draft.fontFamily} fontSize={draft.fontSize} />
              </div>
            </div>
            <p className="text-[9px] text-slate-400 mt-4 leading-relaxed text-center">
              Preview updates live as you type at the autosave boundary.
            </p>
          </aside>
        ) : (
          /* Slide-over panel if preview is expanded or screen width fits but user wants overlay */
          <aside className="fixed right-0 top-[73px] bottom-0 w-[420px] bg-slate-100 border-l border-slate-200 shadow-2xl z-[85] flex flex-col animate-slide-in">
            <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <span className="text-sm font-black text-slate-800">Visual Live Preview</span>
              <button
                onClick={() => setDesktopShowPreviewPanel(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-450"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 flex justify-center bg-slate-100">
              <div className="w-[800px] origin-top scale-[0.45] bg-white shadow-xl mb-40">
                <TemplateComponent data={previewData} fontFamily={draft.fontFamily} fontSize={draft.fontSize} />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

// COMPONENT HELPER FOR CHIP SKILLS INPUT
const SkillsChipInput: React.FC<{
  label: string;
  skills: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
}> = ({ label, skills, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = (value: string) => {
    const newSkills = value
      .split(/[,,]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !skills.includes(s));
    
    if (newSkills.length > 0) {
      onChange([...skills, ...newSkills]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAdd(inputValue);
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(skills.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-[#173404] bg-white min-h-[44px]"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => handleAdd(inputValue)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 text-xs font-black text-white cursor-pointer"
        >
          Add
        </button>
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 border border-slate-200/50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
            >
              {skill}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// COMPONENT HELPER FOR COLLAPSIBLE SEGMENTS IN EXTRAS
const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100/60 transition text-left cursor-pointer"
      >
        <span className="text-xs font-black text-slate-700">{title}</span>
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-500">
          {!isOpen && <span className="text-[10px] font-black text-[#173404]">+ Add</span>}
          <ChevronDown size={14} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isOpen && <div className="p-4 border-t border-slate-100 bg-white">{children}</div>}
    </div>
  );
};

// COMPONENT HELPER FOR CARD ENTRYS WITH DOUBLE CONFIRM TO DELETE
const EntryCard: React.FC<{
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}> = ({ title, onRemove, children }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 relative">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {confirmDelete ? (
          <div className="flex gap-1.5 items-center">
            <button
              type="button"
              onClick={onRemove}
              className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black px-2.5 py-1 rounded shadow cursor-pointer"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="bg-white border border-slate-200 text-slate-500 text-[10px] font-black px-2.5 py-1 rounded shadow cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-white text-rose-500 hover:bg-rose-50 transition cursor-pointer"
            aria-label={`Remove ${title}`}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <div className="mb-2">
        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">{title}</h4>
      </div>
      {children}
    </div>
  );
};

export default CreateFromScratchWizard;
