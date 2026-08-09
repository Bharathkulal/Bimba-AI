import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, X, AlertCircle, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { useResumeForm } from '../hooks/useResumeForm';
import { StepProgressBar } from './components/StepProgressBar';
import { StickyActionBar } from './components/StickyActionBar';
import { TemplateRegistry } from '../../../components/resume/templates';

interface CreateFromScratchMobileProps {
  onBackToUpload: () => void;
}

export const CreateFromScratchMobile: React.FC<CreateFromScratchMobileProps> = ({ onBackToUpload }) => {
  const navigate = useNavigate();
  const {
    formData,
    currentStep,
    setCurrentStep,
    resumeId,
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
  } = useResumeForm();

  // Wizard state and validations
  const [skillInput, setSkillInput] = useState('');
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<{ type: 'experience' | 'education'; index: number } | null>(null);

  // Field validation functions
  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!formData.personal_info?.name?.trim()) {
      errors.name = 'Full Name is required.';
    }
    const email = formData.personal_info?.email || '';
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please provide a valid email structure.';
    }
    const phone = formData.personal_info?.phone || '';
    if (!phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else if (phone.replace(/\D/g, '').length < 8) {
      errors.phone = 'Phone number must be at least 8 digits.';
    }
    if (!formData.personal_info?.location?.trim()) {
      errors.location = 'Location (city) is required.';
    }
    
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      const isValid = validateStep1();
      if (!isValid) return;
    }
    
    // Autosave to database backend on step transition
    await saveDraftToBackend();
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBackStep = () => {
    if (currentStep === 1) {
      // Exit wizard verification if forms contain any text
      const info = formData.personal_info;
      const isDirty = !!(info?.name || info?.email || info?.phone || info?.location);
      if (isDirty) {
        setShowExitConfirm(true);
      } else {
        onBackToUpload();
      }
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepJump = (stepNum: number) => {
    if (stepNum < currentStep) {
      setCurrentStep(stepNum);
    }
  };

  // Delete confirmations for experience and education
  const triggerRemoveExperience = (index: number) => {
    const exp = formData.experience[index];
    const isFilled = exp.position || exp.company || exp.duration || exp.description;
    if (isFilled) {
      setDeleteConfirmIdx({ type: 'experience', index });
    } else {
      removeExperience(index);
    }
  };

  const triggerRemoveEducation = (index: number) => {
    const edu = formData.education[index];
    const isFilled = edu.degree || edu.institution || edu.year;
    if (isFilled) {
      setDeleteConfirmIdx({ type: 'education', index });
    } else {
      removeEducation(index);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmIdx) return;
    if (deleteConfirmIdx.type === 'experience') {
      removeExperience(deleteConfirmIdx.index);
    } else {
      removeEducation(deleteConfirmIdx.index);
    }
    setDeleteConfirmIdx(null);
  };

  // Skill chips methods
  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    const trimmed = skillInput.trim();
    const list = formData.skills || [];
    if (!list.includes(trimmed)) {
      updateSkills([...list, trimmed]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (index: number) => {
    const list = (formData.skills || []).filter((_, i) => i !== index);
    updateSkills(list);
  };

  // Generate / Compile Resume Finalization
  const handleGenerateResume = async () => {
    await saveDraftToBackend();
    if (resumeId) {
      clearForm();
      navigate(`/resume-builder?id=${resumeId}`);
    }
  };

  // Computed states
  const isStep1Complete = !!(
    formData.personal_info?.name?.trim() &&
    formData.personal_info?.email?.trim() &&
    formData.personal_info?.phone?.trim() &&
    formData.personal_info?.location?.trim()
  );
  
  const completedStepsList: number[] = [];
  if (isStep1Complete) completedStepsList.push(1);
  if (isStep1Complete) completedStepsList.push(2);
  if (isStep1Complete) completedStepsList.push(3);

  // Template render hook
  const TemplateComponent = TemplateRegistry.microsoft;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 pb-28 text-left">
      <header className="sticky top-0 z-30 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-white/10 px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBackStep}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-500 cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Resume Wizard
            </h1>
            <span className="text-[10px] text-slate-450 dark:text-slate-400 font-bold block mt-0.5">
              Step {currentStep} of 4: {currentStep === 1 ? 'Personal Info' : currentStep === 2 ? 'Experience' : currentStep === 3 ? 'Education & Skills' : 'Preview'}
            </span>
          </div>
        </div>
        
        <StepProgressBar
          currentStep={currentStep}
          totalSteps={4}
          completedSteps={completedStepsList}
          onStepClick={handleStepJump}
        />
      </header>

      <main className="p-4 flex flex-col gap-4">
        {/* STEP 1: PERSONAL INFORMATION */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-sm animate-fadeIn">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-2">
              Personal Information
            </h2>
            
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block mb-1">Full Name *</label>
                <input 
                  type="text"
                  value={formData.personal_info?.name || ''}
                  onChange={(e) => updatePersonalInfo('name', e.target.value)}
                  className={`w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-slate-850 ${stepErrors.name ? 'border-rose-500' : 'border-slate-200 dark:border-white/10'}`}
                  placeholder="e.g. Samantha Williams"
                />
                {stepErrors.name && <span className="text-[10px] font-bold text-rose-500 mt-1 block">{stepErrors.name}</span>}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-455 block mb-1">Email address *</label>
                <input 
                  type="email"
                  value={formData.personal_info?.email || ''}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  className={`w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-slate-850 ${stepErrors.email ? 'border-rose-500' : 'border-slate-200 dark:border-white/10'}`}
                  placeholder="e.g. samantha@example.com"
                />
                {stepErrors.email && <span className="text-[10px] font-bold text-rose-500 mt-1 block">{stepErrors.email}</span>}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-455 block mb-1">Phone Number *</label>
                <input 
                  type="tel"
                  value={formData.personal_info?.phone || ''}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  className={`w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-slate-850 ${stepErrors.phone ? 'border-rose-500' : 'border-slate-200 dark:border-white/10'}`}
                  placeholder="e.g. (123) 456-7890"
                />
                {stepErrors.phone && <span className="text-[10px] font-bold text-rose-500 mt-1 block">{stepErrors.phone}</span>}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-455 block mb-1">Location *</label>
                <input 
                  type="text"
                  value={formData.personal_info?.location || ''}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  className={`w-full p-3 border rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-slate-850 ${stepErrors.location ? 'border-rose-500' : 'border-slate-200 dark:border-white/10'}`}
                  placeholder="e.g. New York, NY"
                />
                {stepErrors.location && <span className="text-[10px] font-bold text-rose-500 mt-1 block">{stepErrors.location}</span>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: EXPERIENCE */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm text-left">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-2 mb-3">
                Work History
              </h2>
              
              {formData.experience.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <p className="text-xs font-bold">No experience items listed yet.</p>
                  <p className="text-[10px] text-slate-450 mt-1">Freshers can skip this section and proceed.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {formData.experience.map((exp, idx) => (
                    <div key={idx} className="p-4 border border-slate-250 dark:border-white/15 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl relative">
                      <button
                        onClick={() => triggerRemoveExperience(idx)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-rose-500 p-1 rounded"
                        title="Remove entry"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="flex flex-col gap-3 mt-2 pr-6">
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-wider block mb-0.5">Role / Position</label>
                          <input
                            type="text"
                            value={exp.position || ''}
                            onChange={(e) => updateExperience(idx, 'position', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                            placeholder="e.g. Software Engineer"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-wider block mb-0.5">Company</label>
                          <input
                            type="text"
                            value={exp.company || ''}
                            onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                            placeholder="e.g. Google"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-wider block mb-0.5">Duration</label>
                          <input
                            type="text"
                            value={exp.duration || ''}
                            onChange={(e) => updateExperience(idx, 'duration', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                            placeholder="e.g. Jan 2022 - Present"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-wider block mb-0.5">Description</label>
                          <textarea
                            rows={3}
                            value={exp.description || ''}
                            onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold outline-none resize-none leading-relaxed"
                            placeholder="Detail your achievements and core stack used..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={addExperience}
              className="w-full py-3.5 border border-dashed border-slate-300 dark:border-white/20 hover:border-slate-800 dark:hover:border-white rounded-xl text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 bg-white dark:bg-[#1f2937] active:bg-slate-50 dark:active:bg-white/5 cursor-pointer shadow-sm"
            >
              <Plus size={14} /> Add Experience
            </button>
          </div>
        )}

        {/* STEP 3: EDUCATION & SKILLS */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {/* Education Sub-section */}
            <div className="bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm text-left">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-2 mb-3">
                Education History
              </h2>

              {formData.education.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold py-4 text-center">No education listed yet.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {formData.education.map((edu, idx) => (
                    <div key={idx} className="p-4 border border-slate-250 dark:border-white/15 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl relative">
                      <button
                        onClick={() => triggerRemoveEducation(idx)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-rose-500 p-1 rounded"
                        title="Remove entry"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="flex flex-col gap-3 mt-2 pr-6">
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-wider block mb-0.5">Degree / Course</label>
                          <input
                            type="text"
                            value={edu.degree || ''}
                            onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                            placeholder="e.g. B.Tech Computer Science"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-wider block mb-0.5">Institution / School</label>
                          <input
                            type="text"
                            value={edu.institution || ''}
                            onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                            placeholder="e.g. Stanford University"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-wider block mb-0.5">Year</label>
                          <input
                            type="text"
                            value={edu.year || ''}
                            onChange={(e) => updateEducation(idx, 'year', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                            placeholder="e.g. 2024"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={addEducation}
                className="w-full py-3 border border-dashed border-slate-300 dark:border-white/20 hover:border-slate-800 dark:hover:border-white rounded-xl text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 active:bg-slate-50 dark:active:bg-white/5 cursor-pointer mt-3"
              >
                <Plus size={14} /> Add Education
              </button>
            </div>

            {/* Skills Sub-section */}
            <div className="bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm text-left">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-2 mb-3">
                Skills tags
              </h2>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ',') && (e.preventDefault(), handleAddSkill())}
                  placeholder="Type skill and press Enter"
                  className="flex-1 p-3 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-slate-800"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-extrabold active:opacity-90 cursor-pointer"
                >
                  Add
                </button>
              </div>

              {formData.skills && formData.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-4">
                  {formData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 bg-slate-105 dark:bg-white/5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-white/5 shadow-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(idx)}
                        className="text-slate-400 hover:text-rose-500 p-0.5 rounded"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 font-bold text-center py-4">No skills registered yet.</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: PREVIEW */}
        {currentStep === 4 && (
          <div className="bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm animate-fadeIn flex flex-col gap-4 text-left">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-2">
              Preview Resume Draft
            </h2>
            
            <div className="border border-slate-200 dark:border-white/10 rounded-xl p-3 bg-slate-100 dark:bg-slate-950 overflow-x-auto min-h-[300px]">
              <div className="w-[600px] origin-top-left scale-[0.58] bg-white text-slate-900 p-4 rounded shadow-sm">
                <TemplateComponent data={formData} fontFamily="Inter" fontSize="10pt" />
              </div>
            </div>
          </div>
        )}

        {/* Save/Autosave Status Messages */}
        {saveError && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-550/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 rounded-xl text-xs font-bold flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{saveError}</span>
          </div>
        )}
      </main>

      {/* Sticky Bottom Action bar */}
      <StickyActionBar
        primaryLabel={currentStep === 4 ? (isSaving ? 'Compiling...' : 'Generate resume') : 'Next'}
        onPrimaryClick={currentStep === 4 ? handleGenerateResume : handleNextStep}
        primaryLoading={isSaving}
        secondaryLabel={currentStep === 1 ? 'Exit' : 'Back'}
        onSecondaryClick={handleBackStep}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmIdx && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-xs w-full bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg text-center flex flex-col gap-4">
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/30">
              <Trash2 size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Confirm Removal</h3>
              <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1 font-semibold leading-relaxed">
                Are you sure you want to delete this filled entry? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmIdx(null)}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Safety Check Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-xs w-full bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg text-center flex flex-col gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-450 flex items-center justify-center mx-auto border border-amber-100 dark:border-amber-500/20">
              <AlertCircle size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Discard Draft?</h3>
              <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1 font-semibold leading-relaxed">
                You have unsaved changes. Discarding this draft will clear all entered form details.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
              >
                Keep Editing
              </button>
              <button
                onClick={() => {
                  clearForm();
                  setShowExitConfirm(false);
                  onBackToUpload();
                }}
                className="flex-1 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer hover:bg-rose-700"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateFromScratchMobile;
