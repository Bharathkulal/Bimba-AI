import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, AlertTriangle, ArrowLeft, Check, Plus, Trash2, ChevronLeft, ChevronRight, FileText, Loader2, Sparkles, Download, CheckCircle2, X } from 'lucide-react';
import { useResumeUpload } from '../hooks/useResumeUpload';
import { MobileFileDropZone } from './components/MobileFileDropZone';
import { useResumeBuilderContext } from '../../../components/resume-builder/ResumeBuilderContext';
import { WelcomeStep } from '../../../components/resume-builder/steps/WelcomeStep';
import { DocumentIngestionStep } from '../../../components/resume-builder/steps/DocumentIngestionStep';
import { ParsingProgressStep } from '../../../components/resume-builder/steps/ParsingProgressStep';
import { SnapshotEditorStep } from '../../../components/resume-builder/steps/SnapshotEditorStep';
import { TemplateSelectionStep } from '../../../components/resume-builder/steps/TemplateSelectionStep';
import { CoachInterviewStep } from '../../../components/resume-builder/steps/CoachInterviewStep';
import { GenerationCompleteStep } from '../../../components/resume-builder/steps/GenerationCompleteStep';
import { AtsScoreStep } from '../../../components/resume-builder/steps/AtsScoreStep';
import { AiPolishStep } from '../../../components/resume-builder/steps/AiPolishStep';
import { StructuralAuditStep } from '../../../components/resume-builder/steps/StructuralAuditStep';
import { ExportStep } from '../../../components/resume-builder/steps/ExportStep';
import { JobMatchesStep } from '../../../components/resume-builder/steps/JobMatchesStep';
import { ApplicationTrackerStep } from '../../../components/resume-builder/steps/ApplicationTrackerStep';
import { apiClient } from '../../../services/api';
import type { ResumeBuilderData, ExperienceItem, EducationItem } from '../../../store/resumeBuilderStore';

interface UploadResumeMobileProps {
  onSwitchToScratch: () => void;
  initialMode?: 'upload' | 'scratch';
  onClose?: () => void;
}

export const UploadResumeMobile: React.FC<UploadResumeMobileProps> = ({
  onSwitchToScratch,
  initialMode,
  onClose
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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

  const { 
    currentStep, 
    setStep: setCurrentStep, 
    resumeId, 
    setResumeId 
  } = useResumeBuilderContext();
  const [localUploadState, setLocalUploadState] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error' | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editedData, setEditedData] = useState<ResumeBuilderData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');

  // AI & ATS score/analysis states
  const [atsScore, setAtsScore] = useState<number>(75);
  const [atsScorecard, setAtsScorecard] = useState<any>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [improvementText, setImprovementText] = useState<{original: string, improved: string} | null>(null);
  const [selectedStyleColor, setSelectedStyleColor] = useState('indigo');
  const [selectedStyleFont, setSelectedStyleFont] = useState('Georgia');
  const [selectedStyleSpacing, setSelectedStyleSpacing] = useState('Balanced');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);

  const templatesList = [
    { id: 'harvard', name: 'Classic Serif', desc: 'Centered classic layout with Georgia headers, standard rule breaks, and bulleted summaries.' },
    { id: 'jakes', name: 'Jake\'s Classic', desc: 'Minimalist double-row layout for software engineers.' },
    { id: 'stanford', name: 'Stanford Executive', desc: 'High-contrast professional layout for corporate careers.' },
    { id: 'minimalist-modern', name: 'Minimal Modern', desc: 'Sleek dark-toned layout optimized for ATS scanners.' }
  ];

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
          // Start at step 4 if already uploaded
          setCurrentStep(4);
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

  // Auto-initialize scratch resume if URL mode is 'scratch'
  const modeParam = searchParams.get('mode') || initialMode;
  useEffect(() => {
    if (modeParam === 'scratch' && !resumeId && !queryResumeId && !isSaving) {
      handleCreateFromScratch();
    }
  }, [modeParam, resumeId, queryResumeId]);

  const resetUpload = () => {
    setResumeId(null);
    setLocalUploadState(null);
    setEditedData(null);
    setSelectedFile(null);
    hookResetUpload();
    setCurrentStep(1);
    if (queryResumeId) {
      navigate('/resume-builder');
    }
  };

  // Sync upload results into form editor state
  useEffect(() => {
    if (initialParsedData) {
      setEditedData(initialParsedData);
      // Auto advance to analysis step
      setCurrentStep(2);
    }
  }, [initialParsedData]);

  // Debounced autosave to database during editing
  useEffect(() => {
    if (!resumeId || !editedData) return;
    const timer = setTimeout(async () => {
      try {
        const payload = {
          ...editedData,
          name: editedData.personal_info?.name || 'Parsed Resume',
          template_id: templatesList[selectedTemplateIndex].id,
          selected_template: templatesList[selectedTemplateIndex].id,
          color_theme: selectedStyleColor,
          font_family: selectedStyleFont
        };
        await apiClient.put(`/api/resume-studio/${resumeId}/update`, payload);
      } catch (err) {
        console.error('[Autosave] Failed to sync parsed edits:', err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [editedData, resumeId, selectedTemplateIndex, selectedStyleColor, selectedStyleFont]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    uploadFile(file);
  };

  const handleCreateFromScratch = async () => {
    try {
      setIsSaving(true);
      const res = await apiClient.post('/api/resume-studio/create', {
        name: 'New Scratch Resume'
      });
      if (res.data && res.data.id) {
        setResumeId(res.data.id);
        setEditedData({
          personal_info: { name: '', email: '', phone: '', address: '', linkedin: '', github: '', portfolio: '', title: '' },
          summary: '',
          objective: '',
          education: [],
          experience: [],
          projects: [],
          skills: [],
          technicalSkills: []
        });
        setLocalUploadState('success');
        setCurrentStep(4); // Choose template
      }
    } catch (e) {
      setSaveError('Failed to initialize a scratch resume. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Run AI analysis
  const runAnalysis = async () => {
    if (!resumeId) return;
    setLocalUploadState('processing');
    try {
      const res = await apiClient.post(`/api/resume-studio/${resumeId}/analyze`, {});
      const details = await apiClient.get(`/api/resume-studio/${resumeId}`);
      if (details.data) {
        setAtsScore(details.data.ats_score || 72);
        setAtsScorecard(details.data.ats);
      }
      setLocalUploadState('success');
      setCurrentStep(3); // Go to ATS Score step
    } catch (e) {
      console.error('Analysis failed, using fallback metrics', e);
      setLocalUploadState('success');
      setCurrentStep(3);
    }
  };

  // Run AI Rewrite
  const fetchRewrite = async (section: string, text: string) => {
    if (!resumeId) return;
    try {
      const res = await apiClient.post(`/api/resume-studio/${resumeId}/ai/rewrite`, {
        section,
        text
      });
      if (res.data) {
        setImprovementText({
          original: text,
          improved: res.data.rewritten_text || 'Optimized professional highlight with strong action verbs and clean metrics.'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Spacing helper css mapping
  const getSpacingClass = () => {
    if (selectedStyleSpacing === 'Compact') return 'space-y-1';
    if (selectedStyleSpacing === 'Spacious') return 'space-y-4';
    return 'space-y-2';
  };

  // UI Handlers
  const handleContinue = () => {
    if (currentStep < 13) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      if (onClose) {
        onClose();
      } else {
        navigate(-1);
      }
    }
  };

  // Progress bar rendering
  const renderProgressBar = () => {
    const dots = [];
    for (let i = 1; i <= 13; i++) {
      dots.push(
        <span 
          key={i} 
          className={`h-2 w-2 rounded-full transition-all ${
            i <= currentStep ? 'bg-[#10B981]' : 'bg-slate-200 dark:bg-white/10'
          }`}
        />
      );
    }
    return <div className="flex justify-center gap-1.5 py-3">{dots}</div>;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white w-screen h-screen overflow-hidden">
      {/* Top Header Navigation */}
      <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-slate-800 shrink-0">
        <button onClick={handleBack} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <span className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white">Resume Builder</span>
        <div className="flex items-center gap-2">
          <span className="font-black text-xs text-slate-400">{currentStep}/13</span>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 ml-1">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {renderProgressBar()}

      {/* Main Content Body Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col bg-slate-50 dark:bg-slate-900 pb-28">
        <div className="w-full max-w-5xl mx-auto flex-grow flex flex-col justify-start">
          {currentStep === 1 && <WelcomeStep />}
          {currentStep === 2 && <DocumentIngestionStep />}
          {currentStep === 3 && <ParsingProgressStep />}
          {currentStep === 4 && <SnapshotEditorStep />}
          {currentStep === 5 && <TemplateSelectionStep />}
          {currentStep === 6 && <CoachInterviewStep />}
          {currentStep === 7 && <GenerationCompleteStep />}
          {currentStep === 8 && <AtsScoreStep />}
          {currentStep === 9 && <AiPolishStep />}
          {currentStep === 10 && <StructuralAuditStep />}
          {currentStep === 11 && <ExportStep />}
          {currentStep === 12 && <JobMatchesStep />}
          {currentStep === 13 && <ApplicationTrackerStep />}
        </div>
      </div>

      {/* Persistent Bottom Action Bar */}
      {currentStep < 13 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-white/10 flex gap-3 items-center shrink-0">
          <button 
            onClick={handleBack} 
            className="flex-1 py-3.5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl text-xs font-black text-slate-500 dark:text-slate-400 cursor-pointer transition"
          >
            ← Back
          </button>
          <button 
            onClick={handleContinue}
            disabled={currentStep === 1 && !resumeId}
            className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black disabled:opacity-50 cursor-pointer transition"
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadResumeMobile;
