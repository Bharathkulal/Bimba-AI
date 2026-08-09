import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, AlertTriangle, ArrowLeft, RefreshCw, CheckCircle2, Plus, Trash2, X } from 'lucide-react';
import { useResumeUpload } from './hooks/useResumeUpload';
import { MobileFileDropZone } from './components/MobileFileDropZone';
import { AccordionSection } from './components/AccordionSection';
import { StickyActionBar } from './components/StickyActionBar';
import { apiClient } from '../../services/api';
import type { ResumeBuilderData, ExperienceItem, EducationItem } from '../../store/resumeBuilderStore';

interface UploadResumeMobileProps {
  onSwitchToScratch: () => void;
}

export const UploadResumeMobile: React.FC<UploadResumeMobileProps> = ({ onSwitchToScratch }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const queryResumeId = queryId ? parseInt(queryId, 10) : null;

  const {
    isUploading,
    uploadProgress,
    uploadState: hookUploadState,
    uploadError,
    parsedData: initialParsedData,
    resumeId: hookResumeId,
    uploadFile,
    resetUpload: hookResetUpload
  } = useResumeUpload();

  const [resumeId, setResumeId] = useState<number | null>(null);
  const [localUploadState, setLocalUploadState] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error' | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editedData, setEditedData] = useState<ResumeBuilderData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');

  const uploadState = localUploadState || hookUploadState;

  // Handle loading existing resume if id parameter is present
  useEffect(() => {
    if (queryResumeId) {
      const loadExisting = async () => {
        try {
          const res = await apiClient.get(`/api/resume-studio/profile/${queryResumeId}`);
          setEditedData(res.data);
          setResumeId(queryResumeId);
          setLocalUploadState('success');
        } catch (e) {
          console.error("Failed to load existing resume", e);
        }
      };
      loadExisting();
    }
  }, [queryResumeId]);

  // Sync hook variables to local state
  useEffect(() => {
    if (hookResumeId) {
      setResumeId(hookResumeId);
    }
  }, [hookResumeId]);

  const resetUpload = () => {
    setResumeId(null);
    setLocalUploadState(null);
    setEditedData(null);
    setSelectedFile(null);
    hookResetUpload();
    if (queryResumeId) {
      navigate('/resume-builder');
    }
  };

  // Sync upload results into form editor state
  useEffect(() => {
    if (initialParsedData) {
      setEditedData(initialParsedData);
    }
  }, [initialParsedData]);

  // Debounced autosave to database during the editing phase
  useEffect(() => {
    if (!resumeId || !editedData) return;
    const timer = setTimeout(async () => {
      try {
        const payload = {
          ...editedData,
          name: editedData.personal_info?.name || 'Parsed Resume',
          template_id: 'microsoft',
          selected_template: 'microsoft'
        };
        await apiClient.put(`/api/resume-studio/${resumeId}/update`, payload);
      } catch (err) {
        console.error('[Autosave] Failed to sync parsed edits:', err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [editedData, resumeId]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    uploadFile(file);
  };

  const handleRetry = () => {
    if (selectedFile) {
      uploadFile(selectedFile);
    }
  };

  // Inline edit handlers
  const updatePersonalInfo = (field: string, value: string) => {
    if (!editedData) return;
    setEditedData({
      ...editedData,
      personal_info: {
        ...editedData.personal_info,
        [field]: value
      }
    });
  };

  const updateExperience = (index: number, field: keyof ExperienceItem, value: string) => {
    if (!editedData) return;
    const list = [...(editedData.experience || [])];
    list[index] = { ...list[index], [field]: value };
    setEditedData({ ...editedData, experience: list });
  };

  const addExperience = () => {
    if (!editedData) return;
    const list = [...(editedData.experience || []), { position: '', company: '', duration: '', description: '' }];
    setEditedData({ ...editedData, experience: list });
  };

  const removeExperience = (index: number) => {
    if (!editedData) return;
    const list = (editedData.experience || []).filter((_, i) => i !== index);
    setEditedData({ ...editedData, experience: list });
  };

  const updateEducation = (index: number, field: keyof EducationItem, value: string) => {
    if (!editedData) return;
    const list = [...(editedData.education || [])];
    list[index] = { ...list[index], [field]: value };
    setEditedData({ ...editedData, education: list });
  };

  const addEducation = () => {
    if (!editedData) return;
    const list = [...(editedData.education || []), { degree: '', institution: '', year: '' }];
    setEditedData({ ...editedData, education: list });
  };

  const removeEducation = (index: number) => {
    if (!editedData) return;
    const list = (editedData.education || []).filter((_, i) => i !== index);
    setEditedData({ ...editedData, education: list });
  };

  const addSkill = () => {
    if (!editedData || !skillInput.trim()) return;
    const trimmed = skillInput.trim();
    const list = editedData.skills || [];
    if (!list.includes(trimmed)) {
      setEditedData({
        ...editedData,
        skills: [...list, trimmed],
        technicalSkills: [...(editedData.technicalSkills || []), trimmed]
      });
    }
    setSkillInput('');
  };

  const removeSkill = (index: number) => {
    if (!editedData) return;
    const list = (editedData.skills || []).filter((_, i) => i !== index);
    setEditedData({
      ...editedData,
      skills: list,
      technicalSkills: list
    });
  };

  const isSectionLowConfidence = (sectionKey: string) => {
    const meta = (editedData as any)?.confidence_metadata?.[sectionKey];
    if (meta && typeof meta.score === 'number' && meta.score < 75) {
      return true;
    }
    return false;
  };

  const isDataThin = !editedData || (
    (!editedData.personal_info?.name) &&
    (!editedData.experience || editedData.experience.length === 0) &&
    (!editedData.education || editedData.education.length === 0) &&
    (!editedData.skills || editedData.skills.length === 0)
  );

  // Validation rules
  const nameExists = !!editedData?.personal_info?.name?.trim();
  const contactExists = !!(editedData?.personal_info?.email?.trim() || editedData?.personal_info?.phone?.trim());
  const canSubmit = nameExists && contactExists;

  const getDisabledReason = () => {
    if (!nameExists) return 'Full Name is required.';
    if (!contactExists) return 'At least one contact method (email or phone) is required.';
    return '';
  };

  const handleConfirmSubmit = async () => {
    if (!canSubmit || !editedData || !resumeId) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const payload = {
        ...editedData,
        name: editedData.personal_info.name || 'Parsed Resume',
        template_id: 'microsoft',
        selected_template: 'microsoft'
      };
      await apiClient.put(`/api/resume-studio/${resumeId}/update`, payload);
      // Navigate to builder studio preview
      navigate(`/resume-builder?id=${resumeId}`);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to submit modifications. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 pb-28 text-left">
      <header className="sticky top-0 z-30 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-white/10 px-4 py-4 flex items-center gap-3">
        <button 
          onClick={() => navigate('/resume')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-500 cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            Upload Resume
          </h1>
          <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold mt-0.5">
            AI-POWERED PARSING HUBS
          </p>
        </div>
      </header>

      <main className="p-4 flex flex-col gap-4">
        {/* Screen 1: Idle Drop Zone */}
        {uploadState === 'idle' && (
          <div className="flex flex-col gap-5">
            <MobileFileDropZone onFileSelect={handleFileSelect} />
            
            <div className="flex items-center justify-center gap-3 text-slate-400 my-1">
              <span className="h-px bg-slate-200 dark:bg-white/10 flex-grow" />
              <span className="text-[10px] font-black uppercase tracking-widest">or</span>
              <span className="h-px bg-slate-200 dark:bg-white/10 flex-grow" />
            </div>

            <button
              onClick={onSwitchToScratch}
              className="w-full min-h-[46px] flex items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 bg-white dark:bg-[#1f2937] font-black text-xs transition active:bg-slate-50 dark:active:bg-white/5 cursor-pointer shadow-sm"
            >
              Create from scratch
            </button>
          </div>
        )}

        {/* Screen 2: Uploading / Processing */}
        {(uploadState === 'uploading' || uploadState === 'processing') && (
          <div className="bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-white/10 rounded-2xl p-8 text-center flex flex-col items-center gap-5 shadow-sm">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-white/5 border-t-slate-800 dark:border-t-white animate-spin" />
              <RefreshCw size={24} className="text-slate-500 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {uploadState === 'uploading' ? `Uploading (${uploadProgress}%)` : 'Reading your resume'}
              </h3>
              <p className="text-xs text-slate-450 dark:text-slate-450 mt-1 font-semibold leading-relaxed">
                Extracting experience, skills and education
              </p>
            </div>
          </div>
        )}

        {/* Screen 2: Upload Failure */}
        {uploadState === 'error' && (
          <div className="bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center flex flex-col items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-450 flex items-center justify-center border border-rose-100 dark:border-rose-500/20">
              <AlertCircle size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Upload & Parsing Failed</h3>
              <p className="text-[11px] text-slate-500 mt-1 font-semibold leading-relaxed">
                {uploadError || 'A network error or timeout occurred.'}
              </p>
            </div>
            <div className="flex gap-2 w-full mt-2">
              <button
                onClick={resetUpload}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold active:bg-slate-50 dark:active:bg-white/5 cursor-pointer"
              >
                Choose Another
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold active:opacity-90 cursor-pointer"
              >
                Retry Upload
              </button>
            </div>
          </div>
        )}

        {/* Screen 3: Review & Edit */}
        {uploadState === 'success' && editedData && (
          <div className="flex flex-col gap-3 animate-fadeIn">
            {/* Thin Data / OCR Warning */}
            {isDataThin && (
              <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-amber-600 dark:text-amber-450 shrink-0 mt-0.5" />
                <div className="text-xs text-left">
                  <h4 className="font-extrabold text-slate-900 dark:text-amber-400">Low Extraction Volume detected</h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 font-semibold leading-relaxed">
                    This file might be a scanned PDF image. Review the sections below carefully or switch to Create from Scratch.
                  </p>
                </div>
              </div>
            )}

            {/* Extraction Incomplete Warning */}
            {(editedData as any).extraction_incomplete && (
              <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-rose-600 dark:text-rose-450 shrink-0 mt-0.5" />
                <div className="text-xs text-left">
                  <h4 className="font-extrabold text-slate-900 dark:text-rose-400">Incomplete Extraction Warning</h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 font-semibold leading-relaxed">
                    {(editedData as any).extraction_incomplete_reason || 'Parsed content density is low compared to the source file text layer. Please review carefully.'}
                  </p>
                </div>
              </div>
            )}

            {/* Form Fields Accordion Groups */}
            <AccordionSection title="Personal Information" isLowConfidence={isSectionLowConfidence('personal_info')}>
              <div className="flex flex-col gap-3.5 text-left">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-450 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editedData.personal_info?.name || ''}
                    onChange={(e) => updatePersonalInfo('name', e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-slate-800 dark:focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-450 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editedData.personal_info?.email || ''}
                    onChange={(e) => updatePersonalInfo('email', e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-slate-800 dark:focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-450 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editedData.personal_info?.phone || ''}
                    onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-slate-800 dark:focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-450 block mb-1">Location</label>
                  <input
                    type="text"
                    value={editedData.personal_info?.location || ''}
                    onChange={(e) => updatePersonalInfo('location', e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-slate-800 dark:focus:border-white"
                  />
                </div>
              </div>
            </AccordionSection>

            <AccordionSection title="Work Experience" isLowConfidence={isSectionLowConfidence('experience')}>
              <div className="flex flex-col gap-4 text-left">
                {editedData.experience?.map((exp, idx) => (
                  <div key={idx} className="p-4 border border-slate-250 dark:border-white/15 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl relative">
                    <button
                      onClick={() => removeExperience(idx)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-rose-500 p-1 rounded-lg"
                      title="Remove entry"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="flex flex-col gap-3 mt-2 pr-6">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Role / Position</label>
                        <input
                          type="text"
                          value={exp.position || ''}
                          onChange={(e) => updateExperience(idx, 'position', e.target.value)}
                          className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Company</label>
                        <input
                          type="text"
                          value={exp.company || ''}
                          onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                          className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Duration</label>
                        <input
                          type="text"
                          value={exp.duration || ''}
                          onChange={(e) => updateExperience(idx, 'duration', e.target.value)}
                          className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                          placeholder="e.g. June 2021 - Present"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Description</label>
                        <textarea
                          rows={3}
                          value={exp.description || ''}
                          onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                          className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold outline-none resize-none leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addExperience}
                  className="w-full py-3 border border-dashed border-slate-300 dark:border-white/20 hover:border-slate-800 dark:hover:border-white rounded-xl text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 active:bg-slate-50 dark:active:bg-white/5 cursor-pointer"
                >
                  <Plus size={14} /> Add Experience
                </button>
              </div>
            </AccordionSection>

            <AccordionSection title="Education" isLowConfidence={isSectionLowConfidence('education')}>
              <div className="flex flex-col gap-4 text-left">
                {editedData.education?.map((edu, idx) => (
                  <div key={idx} className="p-4 border border-slate-250 dark:border-white/15 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl relative">
                    <button
                      onClick={() => removeEducation(idx)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-rose-500 p-1 rounded-lg"
                      title="Remove entry"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="flex flex-col gap-3 mt-2 pr-6">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Degree / Course</label>
                        <input
                          type="text"
                          value={edu.degree || ''}
                          onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                          className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Institution / School</label>
                        <input
                          type="text"
                          value={edu.institution || ''}
                          onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                          className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Year</label>
                        <input
                          type="text"
                          value={edu.year || ''}
                          onChange={(e) => updateEducation(idx, 'year', e.target.value)}
                          className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addEducation}
                  className="w-full py-3 border border-dashed border-slate-300 dark:border-white/20 hover:border-slate-800 dark:hover:border-white rounded-xl text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 active:bg-slate-50 dark:active:bg-white/5 cursor-pointer"
                >
                  <Plus size={14} /> Add Education
                </button>
              </div>
            </AccordionSection>

            <AccordionSection title="Technical & Soft Skills" isLowConfidence={isSectionLowConfidence('skills')}>
              <div className="flex flex-col gap-4 text-left">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                    placeholder="Type skill and press Enter"
                    className="flex-1 p-3 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-slate-800"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-extrabold active:opacity-90 cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {editedData.skills && editedData.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {editedData.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5 shadow-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(idx)}
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
            </AccordionSection>

            {saveError && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-550/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 rounded-xl text-xs font-bold flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Sticky Action Footer */}
            <StickyActionBar
              primaryLabel={isSaving ? 'Submitting...' : 'Looks good, continue'}
              onPrimaryClick={handleConfirmSubmit}
              primaryDisabled={!canSubmit}
              primaryLoading={isSaving}
              secondaryLabel="Exit Review"
              onSecondaryClick={resetUpload}
            />

            {/* Inline warning context description if the save action is currently disabled */}
            {!canSubmit && (
              <div className="fixed bottom-24 left-4 right-4 bg-amber-50 dark:bg-amber-550/15 border border-amber-200 dark:border-amber-500/25 p-3 rounded-xl z-30 shadow-md flex items-start gap-2">
                <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <span className="text-[10px] text-slate-650 dark:text-slate-400 font-bold leading-normal">
                  {getDisabledReason()} Fill in these details in the Accordions above.
                </span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default UploadResumeMobile;
