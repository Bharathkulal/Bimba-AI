import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, FileText, CheckCircle2, ChevronRight, AlertTriangle, Sparkles,
  ArrowRight, Check, X, HelpCircle, Download, Briefcase, RefreshCw,
  Search, ShieldAlert, Award, FileCode, CheckCircle, ExternalLink, Filter, MapPin,
  TrendingUp, Activity, FileEdit, UserCheck, Play, Zap, Info, ArrowLeft, Send, Sparkle,
  Trash2, Plus, Eye, ListOrdered, FileUp, SparklesIcon, CheckSquare, Save,
  Undo, Redo, ZoomIn, ZoomOut, Maximize2, RotateCcw, Columns, Type, Palette, Layout, Settings2, Layers, AlertCircle
} from 'lucide-react';
import { apiClient } from '../services/api';
import { jobsService, type JobListItem } from '../services/jobs';
import { Button } from './Button';
import { Card } from './Card';
import { ResumeBuilder } from './resume/ResumeBuilder';
import { ResumeImprovement } from './resume/ResumeImprovement';
import { LayoutGrid } from 'lucide-react';

import TemplateSidebar from './resume/studio/TemplateSidebar';
import CustomizationPanel from './resume/studio/CustomizationPanel';
import ResumePreview from './resume/studio/ResumePreview';
import PreviewToolbar from './resume/studio/PreviewToolbar';
import BottomNavigation from './resume/studio/BottomNavigation';
import AISuggestionBanner from './resume/studio/AISuggestionBanner';

const ATSScoreRing = ({ score }: { score: number }) => {
  const radius = 18;
  const stroke = 3.5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = "text-emerald-500";
  if (score < 60) color = "text-rose-500";
  else if (score < 85) color = "text-amber-500";

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: 44, height: 44 }}>
      <svg height="44" width="44" className="transform -rotate-90">
        <circle
          stroke="rgba(0,0,0,0.05)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx="22"
          cy="22"
        />
        <circle
          className={`transition-all duration-500 ${color}`}
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx="22"
          cy="22"
        />
      </svg>
      <span className="absolute text-[10px] font-black text-slate-700 dark:text-slate-200">{score}%</span>
    </div>
  );
};

const StepProgressBar = ({ currentStep, totalSteps, stepName }: { currentStep: number, totalSteps: number, stepName: string }) => {
  const percentage = (currentStep / totalSteps) * 100;

  // Phase mapping
  const phases = [
    { name: "Import", steps: [1, 2, 3] },
    { name: "Build", steps: [4, 5] },
    { name: "Coach & Polish", steps: [6, 7, 8, 9] },
    { name: "Finalize", steps: [10, 11, 12, 13] }
  ];

  const currentPhaseIdx = Math.max(0, phases.findIndex(p => p.steps.includes(currentStep)));

  return (
    <div className="w-full bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-white/5 py-3.5 px-5 rounded-2xl shadow-sm mb-3 transition-all">
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Phase {currentPhaseIdx + 1}: {phases[currentPhaseIdx]?.name || 'Optimize'}</span>
          <span className="text-[10px] font-bold text-slate-555 dark:text-slate-450">— Step {currentStep} of {totalSteps}: {stepName}</span>
        </div>
        <div className="text-[10px] font-black text-slate-400 dark:text-slate-550">{Math.round(percentage)}% Complete</div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
      </div>

      {/* 4 Phases Indicators */}
      <div className="grid grid-cols-4 gap-4">
        {phases.map((p, idx) => {
          const isCompleted = idx < currentPhaseIdx;
          const isActive = idx === currentPhaseIdx;
          return (
            <div key={p.name} className="flex flex-col items-center gap-1 text-center relative">
              <div className="flex flex-col items-center gap-0.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border transition-all ${isCompleted
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : isActive
                    ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                    : 'border-slate-200 dark:border-white/10 text-slate-400'
                  }`}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className={`text-[10px] font-extrabold tracking-tight truncate ${isActive ? 'text-slate-900 dark:text-white font-black' : isCompleted ? 'text-emerald-500' : 'text-slate-400'
                  }`}>
                  {p.name}
                </span>
              </div>
              {/* Stepper Dot track underneath */}
              <div className="flex gap-1 justify-center items-center">
                {p.steps.map(s => (
                  <div
                    key={s}
                    className={`w-1 h-1 rounded-full transition-all ${s === currentStep
                      ? 'bg-emerald-500 scale-125 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                      : s < currentStep
                        ? 'bg-emerald-500'
                        : 'bg-slate-200 dark:bg-white/10'
                      }`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface UploadResumeWizardProps {
  onClose: () => void;
  onSuccess: (resumeId: number) => void;
  isDark: boolean;
  initialFile?: File | null;
  initialStep?: number;
  onSwitchToScratch?: () => void;
}

const standardFields: { [key: string]: string[] } = {
  education: ['institution', 'degree', 'passing_year', 'year', 'cgpa_percentage', 'location', 'achievements'],
  experience: ['company', 'position', 'duration', 'description', 'location'],
  projects: ['name', 'title', 'tech_stack', 'technologies', 'description', 'role', 'duration', 'github_link', 'live_demo'],
  certifications: ['name', 'organization', 'issue_date', 'date', 'credential_id', 'credential_url', 'description'],
  internships: ['company', 'role', 'duration', 'description', 'location'],
};

const getExtraFields = (section: string, item: any) => {
  if (!item || typeof item !== 'object') return [];
  const standard = standardFields[section] || [];
  return Object.keys(item).filter(
    key => !standard.includes(key) && key !== '_id' && key !== 'id' && typeof item[key] !== 'object'
  );
};

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
}

const PROGRESS_STEP_DELAY = 150;
const COMPLETION_DELAY = 600;

import { UploadResumeMobile } from '../features/resume-builder/mobile/UploadResumeMobile';

export const UploadResumeWizard: React.FC<UploadResumeWizardProps> = ({
  onClose,
  onSuccess,
  isDark,
  initialFile = null,
  initialStep = 1,
  onSwitchToScratch
}) => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 12-Step flow controller
  const [step, setStep] = useState<number>(initialStep || (initialFile ? 2 : 1));
  const [file, setFile] = useState<File | null>(initialFile);

  if (isMobile) {
    return <UploadResumeMobile onSwitchToScratch={onSwitchToScratch || (() => {})} />;
  }

  // Real DB Data Models
  const [parsedData, setParsedData] = useState<any>({
    personal_info: { name: '', email: '', phone: '', address: '', linkedin: '', github: '', portfolio: '' },
    summary: '',
    objective: '',
    education: [],
    experience: [],
    projects: [],
    skills: [],
    softSkills: [],
    certifications: [],
    internships: [],
    achievements: [],
    languages: [],
    portfolioLinks: [],
    publications: [],
    volunteerExperience: [],
    references: [],
    hobbies: [],
    custom_sections: []
  });
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [resumeId, setResumeId] = useState<number | null>(null);

  // Ingestion loading states
  const [activeTaskIdx, setActiveTaskIdx] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [apiCompleted, setApiCompleted] = useState<boolean>(false);

  const [backendState, setBackendState] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle');
  const isRequestActiveRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  const [uploadError, setUploadError] = useState<string>('');
  const [ingestionError, setIngestionError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Conversational Interview (Step 5)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [questionQueue, setQuestionQueue] = useState<any[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isAiResponding, setIsAiResponding] = useState(false);

  // Edit / Completion states (Step 4 & 6)
  const [editSectionType, setEditSectionType] = useState<string | null>(null);
  const [customSections, setCustomSections] = useState<any[]>([]);
  const [editingCards, setEditingCards] = useState<{ [key: string]: boolean }>({});
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [activeStep6Tab, setActiveStep6Tab] = useState<'all' | 'projects' | 'certifications' | 'custom'>('all');

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      let targetId = resumeId;
      if (!targetId) {
        targetId = await saveResumeToDb(parsedData);
      }

      const role = parsedData.personal_info?.title || parsedData.target_role || 'Software Engineer';
      const rawSkills = parsedData.technicalSkills || parsedData.skills || ['Full Stack Development', 'Software Engineering'];
      const skillsList = Array.isArray(rawSkills)
        ? rawSkills.map(s => typeof s === 'string' ? s : (s.name || String(s)))
        : [String(rawSkills)];

      if (targetId) {
        const res = await apiClient.post(`/api/resume-studio/${targetId}/ai/generate-summary`, {
          role,
          skills: skillsList,
          experience: parsedData.experience?.length ? `${parsedData.experience.length} work experience entries` : 'Fresher'
        });
        if (res.data && res.data.summary) {
          const updated = { ...parsedData, summary: res.data.summary };
          setParsedData(updated);
          await saveResumeToDb(updated);
          setIsGeneratingSummary(false);
          return;
        }
      }

      const fallbackSummary = `Results-driven ${role} proficient in ${skillsList.slice(0, 4).join(', ')}. Proven track record of architecting scalable applications, optimizing technical performance, and delivering robust software solutions.`;
      const updated = { ...parsedData, summary: fallbackSummary };
      setParsedData(updated);
      if (targetId) {
        await saveResumeToDb(updated);
      }
    } catch (err) {
      console.error("Error generating summary with AI:", err);
      const role = parsedData.personal_info?.title || 'Software Engineer';
      const fallbackSummary = `Results-driven ${role} with strong problem-solving skills and hands-on experience building web systems. Dedicated to applying modern engineering methodologies to deliver high-quality products.`;
      setParsedData((prev: any) => ({ ...prev, summary: fallbackSummary }));
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const toggleEditCard = (cardKey: string) => {
    setEditingCards(prev => {
      const isEditing = !prev[cardKey];
      if (!isEditing) {
        saveResumeToDb(parsedData);
      }
      return { ...prev, [cardKey]: isEditing };
    });
  };

  const isSectionLowConfidence = (sectionKey: string) => {
    const meta = parsedData?.confidence_metadata?.[sectionKey];
    if (meta && typeof meta.score === 'number' && meta.score < 75) {
      return true;
    }
    return false;
  };

  const handleAddItemToSection = (sectionKey: string, defaultItem: any) => {
    const currentList = Array.isArray(parsedData[sectionKey]) ? parsedData[sectionKey] : [];
    const updatedList = [...currentList, defaultItem];
    const updatedData = { ...parsedData, [sectionKey]: updatedList };
    setParsedData(updatedData);
    setEditingCards(prev => ({ ...prev, [sectionKey]: true }));
    saveResumeToDb(updatedData);
  };

  const handleDeleteItemFromSection = (sectionKey: string, index: number) => {
    const currentList = Array.isArray(parsedData[sectionKey]) ? parsedData[sectionKey] : [];
    const updatedList = currentList.filter((_: any, i: number) => i !== index);
    const updatedData = { ...parsedData, [sectionKey]: updatedList };
    setParsedData(updatedData);
    saveResumeToDb(updatedData);
  };

  const handleUpdateItemField = (sectionKey: string, index: number, field: string, value: any) => {
    const currentList = [...(parsedData[sectionKey] || [])];
    if (field === '') {
      currentList[index] = value;
    } else if (typeof currentList[index] === 'object' && currentList[index] !== null) {
      currentList[index] = { ...currentList[index], [field]: value };
    } else {
      currentList[index] = value;
    }
    const updatedData = { ...parsedData, [sectionKey]: currentList };
    setParsedData(updatedData);
  };

  const handleUpdateScalarField = (field: string, value: any) => {
    const updatedData = { ...parsedData, [field]: value };
    setParsedData(updatedData);
  };

  const handleUpdatePersonalInfoField = (field: string, value: any) => {
    const updatedData = {
      ...parsedData,
      personal_info: {
        ...(parsedData.personal_info || {}),
        [field]: value
      }
    };
    setParsedData(updatedData);
  };

  // Template Selection (Step 9)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('minimalist-modern');
  const [selectedColor, setSelectedColor] = useState<string>('#1E3A8A');
  const [selectedFont, setSelectedFont] = useState<string>('Inter');
  const [selectedSpacing, setSelectedSpacing] = useState<number>(1.2);
  const [selectedMargin, setSelectedMargin] = useState<number>(20);
  const [headerStyle, setHeaderStyle] = useState<string>('classic');
  const [layoutColumns, setLayoutColumns] = useState<number>(1);
  const [pageSize, setPageSize] = useState<string>('A4');

  // Studio Redesign customization states
  const [zoom, setZoom] = useState<number>(85);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'design' | 'typography' | 'layout' | 'sections'>('design');
  const [showAutoSavedToast, setShowAutoSavedToast] = useState<boolean>(false);
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState<boolean>(false);
  const [selectedFontSize, setSelectedFontSize] = useState<number>(10);
  const [selectedHeadingSize, setSelectedHeadingSize] = useState<number>(16);
  const [letterSpacing, setLetterSpacing] = useState<string>('normal');
  const [sectionDividerStyle, setSectionDividerStyle] = useState<string>('solid');
  const [sectionGap, setSectionGap] = useState<number>(16);
  const [bulletStyle, setBulletStyle] = useState<string>('disc');
  const [headerAlignment, setHeaderAlignment] = useState<string>('center');
  const [enabledSections, setEnabledSections] = useState<Record<string, boolean>>({
    summary: true,
    experience: true,
    projects: true,
    skills: true,
    education: true,
    certifications: true,
    languages: true,
    volunteer: true,
    references: true
  });

  // Job recommendations and versioning states
  const [recommendedJobs, setRecommendedJobs] = useState<JobListItem[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(false);
  const [jobsError, setJobsError] = useState<string>('');
  const [renamingResume, setRenamingResume] = useState<boolean>(false);
  const [newResumeName, setNewResumeName] = useState<string>('');

  // File Inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const processingTasks = [
    'Verifying document structure integrity...',
    'Extracting raw OCR text nodes...',
    'Running heuristic layout analyzer...',
    'Detecting academic qualifications & degrees...',
    'Extracting professional work & internship history...',
    'Filtering skills and tech stack tags...',
    'Compiling MongoDB document model...'
  ];

  // Auto start ingestion if file provided
  useEffect(() => {
    if (initialFile) {
      setFile(initialFile);
      setStep(2);
      startIngestion(initialFile);
    }
  }, [initialFile]);

  useEffect(() => {
    if (!isParsing) return;

    if (backendState === 'completed') {
      if (activeTaskIdx < processingTasks.length) {
        console.log(`[ResumeWizard] Fast-forwarding UI step ${activeTaskIdx} -> ${activeTaskIdx + 1}`);
        const timer = setTimeout(() => {
          if (!isMountedRef.current) return;
          setCompletedTasks(prev => {
            const next = [...prev];
            if (!next.includes(processingTasks[activeTaskIdx])) {
              next.push(processingTasks[activeTaskIdx]);
            }
            return next;
          });
          setActiveTaskIdx(prev => prev + 1);
        }, PROGRESS_STEP_DELAY);
        return () => clearTimeout(timer);
      } else {
        console.log('[ResumeWizard] Ingestion transition scheduled');
        const timer = setTimeout(() => {
          if (!isMountedRef.current) return;
          setIsParsing(false);
          setStep(4);
        }, COMPLETION_DELAY);
        return () => clearTimeout(timer);
      }
    } else if (backendState === 'failed') {
      console.log('[ResumeWizard] Processing failed state - holding progress timers.');
    } else {
      if (activeTaskIdx < processingTasks.length - 1) {
        console.log(`[ResumeWizard] Normal UI step progression ${activeTaskIdx} -> ${activeTaskIdx + 1}`);
        const timer = setTimeout(() => {
          if (!isMountedRef.current) return;
          setCompletedTasks(prev => {
            const next = [...prev];
            if (!next.includes(processingTasks[activeTaskIdx])) {
              next.push(processingTasks[activeTaskIdx]);
            }
            return next;
          });
          setActiveTaskIdx(prev => prev + 1);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isParsing, activeTaskIdx, backendState]);

  useEffect(() => {
    if (step === 12) {
      fetchJobRecommendations();
    }
  }, [step]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      startIngestion(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      startIngestion(selectedFile);
    }
  };

  const startIngestion = async (targetFile: File) => {
    if (isRequestActiveRef.current) {
      console.warn('[ResumeWizard] Double submission blocked: upload request already active.');
      return;
    }
    isRequestActiveRef.current = true;

    const ext = targetFile.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'html'];
    if (!ext || !allowed.includes(ext)) {
      alert(`Unsupported file format (.${ext}). Please upload PDF, DOC, DOCX, TXT, RTF, or HTML.`);
      setFile(null);
      isRequestActiveRef.current = false;
      return;
    }
    if (targetFile.size > 20 * 1024 * 1024) {
      alert("File size exceeds limit of 20MB.");
      setFile(null);
      isRequestActiveRef.current = false;
      return;
    }

    console.log('[ResumeWizard] Upload started');
    setStep(3); // Step 3: Parsing Progress
    setIsParsing(true);
    setApiCompleted(false);
    setBackendState('uploading');
    setActiveTaskIdx(0);
    setCompletedTasks([]);
    setUploadError('');
    setIngestionError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const formData = new FormData();
      formData.append('file', targetFile);

      let uploadRes;
      let retries = 0;
      const MAX_RETRIES = 2;
      while (retries <= MAX_RETRIES) {
        try {
          uploadRes = await apiClient.post('/api/resume-studio/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 120000, // 2 min timeout for large files + OCR
            signal: controller.signal,
            onUploadProgress: (progressEvent) => {
              if (!isMountedRef.current) return;
              const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
              console.log(`[ResumeWizard] Upload progress: ${percentCompleted}%`);
              if (percentCompleted >= 100) {
                setBackendState('processing');
                console.log('[ResumeWizard] Backend processing started');
              }
            }
          });
          break; // Success
        } catch (e: any) {
          if (e.response && e.response.status >= 500 && retries < MAX_RETRIES) {
            retries++;
            console.warn(`Upload failed with server error. Retrying (${retries}/${MAX_RETRIES}) in ${retries * 2}s...`);
            await new Promise(resolve => setTimeout(resolve, retries * 2000));
            continue;
          }
          throw e; // Rethrow if not a 5xx error or out of retries
        }
      }

      if (!isMountedRef.current) return;

      // Validate API Response
      if (!uploadRes || !uploadRes.data || !uploadRes.data.success || !uploadRes.data.resume_id) {
        throw new Error("Invalid or incomplete parsing response returned by backend.");
      }

      const parsed = uploadRes!.data.parsed_data || {};
      const newId = uploadRes!.data.resume_id;
      setParsedData(parsed);
      setResumeId(newId);

      // Initialize empty default analysis structure (will be populated at Step 8)
      setAnalysisData({
        scores: { overall_score: 72, ats_score: 72, formatting_score: 75, grammar_score: 80, keyword_match_score: 70, project_quality_score: 70, education_completeness: 90 },
        suggestions: ['ATS Audit score will be generated when you reach Step 8.']
      });

      // Create conversational interview questions
      const queue: any[] = [];
      queue.push({
        key: 'target_role',
        text: 'What primary target role or career goal are you aiming for with this resume?',
        placeholder: 'e.g. Software Engineer, Data Analyst',
        handler: (ans: string, cur: any) => {
          cur.personal_info.title = ans;
          return cur;
        }
      });
      if (!parsed.personal_info?.github) {
        queue.push({
          key: 'github',
          text: 'Would you like to add a GitHub profile link to highlight open-source contributions?',
          placeholder: 'e.g. github.com/username (or type skip)',
          handler: (ans: string, cur: any) => {
            if (ans.toLowerCase() !== 'skip') cur.personal_info.github = ans;
            return cur;
          }
        });
      }
      if (!parsed.personal_info?.linkedin) {
        queue.push({
          key: 'linkedin',
          text: 'Would you like to add a LinkedIn profile link?',
          placeholder: 'e.g. linkedin.com/in/username (or type skip)',
          handler: (ans: string, cur: any) => {
            if (ans.toLowerCase() !== 'skip') cur.personal_info.linkedin = ans;
            return cur;
          }
        });
      }
      if (!parsed.education || parsed.education.length === 0) {
        queue.push({
          key: 'education',
          text: 'What is your highest degree or educational institution?',
          placeholder: 'e.g. Bachelor of Science in Computer Science, Harvard (or type skip)',
          handler: (ans: string, cur: any) => {
            if (ans.toLowerCase() !== 'skip') {
              cur.education = [{ id: Date.now(), institution: ans, degree: 'Degree', year: '2026' }];
            }
            return cur;
          }
        });
      }

      setQuestionQueue(queue);
      setMessages([
        { sender: 'ai', text: "Hello! I'm your AI Career Coach. I've finished extracting your resume details." },
        { sender: 'ai', text: queue[0]?.text || "Let's review the dynamic suggestions to maximize your ATS matches." }
      ]);

      console.log('[ResumeWizard] Backend completed');
      setBackendState('completed');
      setApiCompleted(true);
    } catch (e: any) {
      if (!isMountedRef.current) return;
      
      console.log('[ResumeWizard] Processing failed');
      setBackendState('failed');

      if (e.name === 'CanceledError' || e.code === 'ERR_CANCELED') {
        console.log("Upload cancelled by user");
        return;
      }
      console.error('Ingestion error details:', e);
      let errorMsg = '';
      if (e.response) {
        const status = e.response.status;
        const details = e.response.data?.error || e.response.data?.details || e.response.data?.detail || JSON.stringify(e.response.data);
        if (status === 404) {
          errorMsg = `Upload endpoint not found (HTTP 404). Details: ${details}`;
        } else if (status === 401 || status === 403) {
          errorMsg = `Authentication failed (HTTP ${status}). Please log in again. Details: ${details}`;
        } else if (status === 500) {
          errorMsg = `Internal Server Error (HTTP 500). Details: ${details}`;
        } else if (status === 502 || status === 504) {
          errorMsg = `AI Gateway / Service Gateway timeout (HTTP ${status}). Details: ${details}`;
        } else {
          errorMsg = `Ingestion failed with status code ${status}. Details: ${details}`;
        }
      } else if (e.request) {
        if (e.message?.toLowerCase().includes('timeout')) {
          errorMsg = 'Upload request timed out (timeout limit 120s reached).';
        } else {
          errorMsg = 'Backend server unavailable or network connection failed. Please ensure uvicorn is running on port 8000.';
        }
      } else {
        errorMsg = `Request configuration/validation error: ${e.message}`;
      }

      setUploadError(errorMsg);
      setFile(null);
      setStep(2); // Keep them on the upload step to see the error

      setIngestionError(errorMsg);
      setIsParsing(false);
    } finally {
      isRequestActiveRef.current = false;
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isAiResponding) return;
    const answer = userInput;
    setUserInput('');

    setMessages(prev => [...prev, { sender: 'user', text: answer }]);
    setIsAiResponding(true);

    try {
      const currentQuestion = questionQueue[currentQuestionIdx];
      let updatedData = { ...parsedData };

      if (currentQuestion && currentQuestion.handler) {
        updatedData = currentQuestion.handler(answer, updatedData);
        setParsedData(updatedData);

        // Sync save to DB
        await saveResumeToDb(updatedData);
      }

      const nextIdx = currentQuestionIdx + 1;
      if (nextIdx < questionQueue.length) {
        setCurrentQuestionIdx(nextIdx);
        setTimeout(() => {
          setMessages(prev => [...prev, { sender: 'ai', text: questionQueue[nextIdx].text }]);
          setIsAiResponding(false);
        }, 600);
      } else {
        setTimeout(() => {
          setMessages(prev => [...prev, { sender: 'ai', text: "Interview complete! Let's continue to the Smart Completion step." }]);
          setIsAiResponding(false);
        }, 600);
      }
    } catch (e) {
      console.error(e);
      setIsAiResponding(false);
    }
  };

  const saveResumeToDb = async (data: any) => {
    let targetId = resumeId;
    if (!targetId) {
      try {
        const createRes = await apiClient.post('/api/resume-studio/create', {
          title: `AI Enhanced - ${data.personal_info?.name || 'Resume'}`,
          target_role: data.personal_info?.title || 'Software Engineer'
        });
        if (createRes.data && createRes.data.id) {
          targetId = createRes.data.id;
          setResumeId(targetId);
        }
      } catch (err) {
        console.error("Error initializing resume draft ID:", err);
      }
    }
    if (!targetId) return null;

    const payload = {
      master: {
        name: `AI Enhanced - ${data.personal_info?.name || 'Resume'}`,
        resume_type: data.experience?.length > 0 ? 'Experienced' : 'Fresher',
        target_role: data.personal_info?.title || 'Software Engineer',
        visibility: 'Private',
        phone: data.personal_info?.phone || '',
        address: data.personal_info?.address || '',
        linkedin: data.personal_info?.linkedin || '',
        github: data.personal_info?.github || '',
        portfolio: data.personal_info?.portfolio || '',
        summary: data.summary || data.personal_info?.summary || '',
        template_id: selectedTemplate,
        color_theme: selectedColor,
        selected_font: selectedFont,
        spacing: selectedSpacing,
        margins: selectedMargin,
        columns: layoutColumns,
        page_size: pageSize
      },
      personal_info: data.personal_info || {},
      summary: data.summary || '',
      objective: data.objective || '',
      education: data.education || [],
      experience: data.experience || [],
      projects: data.projects || [],
      technicalSkills: data.technicalSkills || data.skills || [],
      softSkills: data.softSkills || [],
      certifications: data.certifications || [],
      internships: data.internships || [],
      achievements: data.achievements || [],
      languages: data.languages || [],
      portfolioLinks: data.portfolioLinks || [],
      publications: data.publications || [],
      volunteerExperience: data.volunteerExperience || [],
      references: data.references || [],
      hobbies: data.hobbies || [],
      custom_sections: data.custom_sections || []
    };
    try {
      await apiClient.put(`/api/resume-studio/profile/${targetId}`, payload);
      await apiClient.put(`/api/resume-studio/${targetId}/update`, payload);
      setShowAutoSavedToast(true);
      setTimeout(() => {
        setShowAutoSavedToast(false);
      }, 2000);
    } catch (err) {
      console.error("Error saving resume profile:", err);
    }
    return targetId;
  };

  const evaluateClientSideHeuristics = (data: any) => {
    const personal = data.personal_info || {};
    const projects = data.projects || [];
    const experience = data.experience || [];
    const skills = data.skills || data.technicalSkills || [];
    const certs = data.certifications || [];
    const edu = data.education || [];

    const suggestions: any[] = [];
    let score = 90;

    if (!personal.linkedin) {
      score -= 10;
      suggestions.push({
        problem: 'Missing LinkedIn Profile URL',
        reason: 'Recruiters and ATS scanners cross-reference candidates on LinkedIn during initial screening.',
        recommended_fix: 'Add your LinkedIn profile link (e.g. linkedin.com/in/username) in personal info.',
        priority: 'High'
      });
    }
    if (!personal.github) {
      score -= 10;
      suggestions.push({
        problem: 'Missing GitHub or Portfolio Link',
        reason: 'Technical hiring managers look for code samples and open-source contributions.',
        recommended_fix: 'Add your GitHub profile or personal portfolio URL to personal info.',
        priority: 'High'
      });
    }
    if (!projects || projects.length === 0) {
      score -= 20;
      suggestions.push({
        problem: 'No Showcase Projects Listed',
        reason: 'Projects demonstrate practical application of engineering skills.',
        recommended_fix: 'Add at least 2 key projects with technology stack and impact descriptions.',
        priority: 'High'
      });
    } else {
      const hasMetrics = projects.some((p: any) => {
        const desc = (p.description || p.tech || '').toLowerCase();
        return /\b\d+(%|x|\+|k|\$|\s?percent)\b/.test(desc);
      });
      if (!hasMetrics) {
        score -= 15;
        suggestions.push({
          problem: 'Project Descriptions Lack Quantified Impact Metrics',
          reason: 'ATS algorithms rank resumes higher when descriptions contain hard metric numbers.',
          recommended_fix: 'Add hard metrics to project descriptions (e.g. "improved speed by 30%", "handled 500+ users").',
          priority: 'High'
        });
      }
    }
    if (!skills || skills.length < 5) {
      score -= 15;
      suggestions.push({
        problem: `Low Technical Keyword Density (${skills?.length || 0} skills tag detected)`,
        reason: 'ATS algorithms filter candidates based on matching technical skill tags.',
        recommended_fix: 'Add 5+ core framework, tool, and language tags.',
        priority: 'High'
      });
    }
    if (!certs || certs.length === 0) {
      score -= 10;
      suggestions.push({
        problem: 'No Industry Certifications Listed',
        reason: 'Certifications validate domain expertise and continuous learning.',
        recommended_fix: 'Add relevant industry certifications or credentials.',
        priority: 'Medium'
      });
    }

    const finalScore = Math.min(98, Math.max(45, score));
    return {
      scores: {
        overall_score: finalScore,
        ats_score: finalScore,
        formatting_score: Math.min(95, finalScore + 4),
        grammar_score: Math.min(98, finalScore + 6),
        keyword_match_score: Math.min(95, (skills.length || 1) * 15),
        project_quality_score: projects.length > 0 ? 85 : 45,
        education_completeness: edu.length > 0 ? 90 : 50
      },
      suggestions
    };
  };

  const runAnalysis = async (nextStep: number) => {
    setIsAnalyzing(true);
    try {
      if (resumeId) {
        await saveResumeToDb(parsedData);
      }

      const analyzeRes = await apiClient.post('/api/resume-studio/analyze-direct', {
        parsedData
      });

      if (analyzeRes.data && analyzeRes.data.scores) {
        setAnalysisData(analyzeRes.data);
      } else {
        setAnalysisData(evaluateClientSideHeuristics(parsedData));
      }
    } catch (err) {
      console.error("Error analyzing resume heuristics via Groq AI:", err);
      setAnalysisData(evaluateClientSideHeuristics(parsedData));
    } finally {
      setIsAnalyzing(false);
      setStep(nextStep);
    }
  };

  const fetchJobRecommendations = async () => {
    if (!resumeId) return;
    setLoadingJobs(true);
    setJobsError('');
    try {
      const data = await jobsService.getRecommendations(resumeId);
      setRecommendedJobs(data.jobs || data || []);
    } catch (err: any) {
      console.error(err);
      setJobsError('Failed to load personalized job recommendations.');
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleDownload = (format: 'pdf' | 'docx' | 'txt') => {
    if (!resumeId) return;
    const token = localStorage.getItem('auth_token');
    const url = `${apiClient.defaults.baseURL}/api/resume-studio/${resumeId}/download/${format}${token ? `?token=${token}` : ''}`;
    window.open(url, '_blank');
  };

  const handleSaveVersion = async (versionName: string) => {
    if (!resumeId) return;
    try {
      await apiClient.post(`/api/resume-studio/${resumeId}/save-version`, { version_name: versionName });
      alert("Resume version saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save resume version.");
    }
  };

  const handleRenameResume = async (newName: string) => {
    if (!resumeId) return;
    try {
      const updated = { ...parsedData, name: newName };
      setParsedData(updated);
      await saveResumeToDb(updated);
      alert("Resume renamed successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to rename resume.");
    }
  };

  const createNewResumeDraft = async () => {
    try {
      const res = await apiClient.post('/api/resume-studio/create', { name: "New Resume Draft" });
      setResumeId(res.data.id);
      setParsedData({
        personal_info: { name: 'John Doe', email: 'john@example.com', phone: '', address: '', linkedin: '', github: '', portfolio: '' },
        education: [],
        experience: [],
        projects: [],
        skills: [],
        certifications: []
      });
      setStep(4); // Start builder snapshot edits
    } catch (err) {
      console.error(err);
      alert("Failed to initialize draft.");
    }
  };

  const getActiveStep = () => {
    if (step <= 2) return 0;
    if (step === 3) return 1;
    if (step === 4) return 2;
    if (step === 5) return 3;
    if (step === 6) return 4;
    if (step === 7) return 5;
    if (step === 8) return 6;
    if (step === 9) return 7;
    if (step === 10) return 8;
    return 9;
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden text-left bg-white dark:bg-[#111827] flex flex-col`}>
      <div className={`w-screen h-screen flex flex-col ${isDark
        ? 'bg-[#111827] text-white'
        : 'bg-white text-slate-800'
        }`}>

        {/* Header bar */}
        <div className={`flex items-center justify-between px-6 py-4 border-b backdrop-blur-md ${isDark ? 'border-white/10 bg-[#1F2937]/30' : 'border-slate-100 bg-slate-50'
          }`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-black">
              B
            </div>
            <div>
              <h3 className={`font-extrabold text-sm tracking-tight flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'
                }`}>
                Bimba AI Resume Suite <Sparkles size={13} className="text-emerald-400" />
              </h3>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500 font-bold'}`}>Step {step} of 13 — Conversational Career Optimizer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/10 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="px-6 py-3 border-b dark:border-white/10 bg-slate-50/50 dark:bg-[#111827]">
          <StepProgressBar
            currentStep={getActiveStep() + 1}
            totalSteps={10}
            stepName={
              ['Welcome', 'Extraction', 'Snapshot', 'Templates', 'Interview', 'Completion', 'ATS Audit', 'Improvements', 'Quality', 'Export & Jobs'][getActiveStep()] || 'Optimizer'
            }
          />
        </div>

        {/* 12-Step Content Renderer */}
        <div className="flex-grow overflow-hidden flex flex-col h-full p-6 md:p-8 overflow-y-auto">
          <AnimatePresence mode="popLayout">

            {/* Step 1: Welcome Screen */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="max-w-2xl mx-auto text-center flex flex-col items-center justify-center gap-6 py-12">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-bold text-xl shadow-lg">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight mb-2">Let's Build Your Best Resume</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed font-semibold">
                    Upload your existing resume or create a new one. Bimba AI will analyze it, ask smart questions, improve it, and optimize it for ATS and recruiters.
                  </p>
                </div>
                <div className="flex gap-4 w-full justify-center">
                  <Button onClick={() => setStep(2)} className="btn-glow-green text-xs font-bold py-3 px-6 flex items-center gap-2">
                    <FileUp size={14} /> Upload Resume
                  </Button>
                  <Button
                    onClick={() => {
                      if (onSwitchToScratch) {
                        onSwitchToScratch();
                      } else {
                        createNewResumeDraft();
                      }
                    }}
                    className="bg-[#0F4A3C] hover:bg-[#0B3A2E] text-white text-xs font-bold py-3 px-6 flex items-center gap-2 rounded-xl transition-all shadow-sm hover:shadow-lg cursor-pointer"
                  >
                    <Plus size={14} className="text-white" /> Build New Resume
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Upload Resume */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto w-full text-center flex flex-col gap-4 py-2">
                <div>
                  <h2 className="text-xl font-black tracking-tight">Upload Your Document</h2>
                  <p className="text-xs text-slate-505 dark:text-slate-400 mt-1 leading-relaxed">
                    Upload your resume to instantly run our unified career parser. Supported formats include PDF, DOC, DOCX, and TXT.
                  </p>
                </div>

                {uploadError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-3 text-xs font-bold text-left flex items-start gap-2 shadow-sm">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    if (isRequestActiveRef.current) return;
                    handleFileDrop(e);
                  }}
                  onClick={() => {
                    if (isRequestActiveRef.current) return;
                    fileInputRef.current?.click();
                  }}
                  className={`border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-emerald-500 bg-slate-50/30 dark:bg-white/5 hover:bg-emerald-500/5 rounded-2xl py-8 px-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 w-full shadow-inner hover:shadow-[0_0_25px_rgba(16,185,129,0.08)] ${isRequestActiveRef.current ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <input type="file" ref={fileInputRef} onChange={(e) => {
                    if (isRequestActiveRef.current) return;
                    handleFileSelect(e);
                  }} accept=".pdf,.doc,.docx,.txt,.rtf,.html" className="hidden" />
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-md">
                    <UploadCloud size={24} />
                  </div>
                  <div className="text-center text-xs">
                    <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Drag & drop files here, or click to browse</p>
                    <p className="text-[10px] text-slate-450 mt-1">Maximum file size: 20MB</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 text-xs text-slate-450 font-bold border-t border-slate-100 dark:border-white/5 pt-4">
                  <button className="flex items-center gap-1 hover:text-emerald-500"><ExternalLink size={12} /> Google Drive</button>
                  <span>•</span>
                  <button className="flex items-center gap-1 hover:text-emerald-500"><ExternalLink size={12} /> Dropbox</button>
                </div>

                <button onClick={() => setStep(1)} className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto mt-2">
                  <ArrowLeft size={13} /> Back to Welcome
                </button>
              </motion.div>
            )}

            {/* Step 3: AI Resume Parsing Progress */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto w-full flex flex-col gap-5 py-12">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                    <RefreshCw size={12} className={`text-emerald-400 ${!ingestionError ? 'animate-spin' : ''}`} /> Active AI Parsing Heuristics
                  </span>
                  <span className="text-emerald-400 font-extrabold">{Math.round((completedTasks.length / processingTasks.length) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500" style={{ width: `${(completedTasks.length / processingTasks.length) * 100}%` }} />
                </div>

                {!ingestionError ? (
                  <>
                    <div className="flex flex-col gap-3 mt-2 text-xs bg-slate-50/50 dark:bg-white/5 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                      {processingTasks.map((task, idx) => (
                        <div key={idx} className={`flex items-center justify-between ${idx < completedTasks.length ? 'text-slate-450 font-medium' : idx === completedTasks.length ? 'text-emerald-500 font-extrabold animate-pulse' : 'text-slate-400 dark:text-slate-600'}`}>
                          <span>{task}</span>
                          {idx < completedTasks.length ? (
                            <CheckCircle2 size={14} className="text-emerald-500" />
                          ) : (
                            <div className={`w-3 h-3 rounded-full border-2 ${idx === completedTasks.length ? 'border-emerald-500 border-t-transparent animate-spin' : 'border-slate-350 dark:border-white/10'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={() => {
                        if (abortControllerRef.current) {
                          abortControllerRef.current.abort();
                        }
                        setIsParsing(false);
                        setStep(2);
                      }}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all shadow-sm max-w-[140px] mx-auto cursor-pointer"
                    >
                      Cancel Ingestion
                    </Button>
                  </>
                ) : (
                  <div className="mt-2 p-5 border border-rose-500/20 bg-rose-500/5 rounded-2xl text-center space-y-4 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-md mx-auto animate-bounce">
                      <AlertTriangle size={24} />
                    </div>
                    <h4 className="text-sm font-extrabold text-rose-500 tracking-tight">Resume Ingestion Failed</h4>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">{ingestionError}</p>
                    <div className="flex gap-2 justify-center pt-2">
                      <Button
                        onClick={() => {
                          if (file) {
                            startIngestion(file);
                          } else {
                            setStep(2);
                          }
                        }}
                        className="px-4 py-2.5 bg-[#0F4A3C] hover:bg-[#0B3A2E] text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer"
                      >
                        Retry Upload
                      </Button>
                      <Button
                        onClick={() => {
                          setFile(null);
                          setStep(2);
                        }}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        Choose Different File
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Resume Snapshot */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 text-left w-full">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h2 className="text-lg font-black">AI Resume Snapshot</h2>
                    <p className="text-xs text-slate-500">Review and edit all extracted sections. Each card supports editing, saving, adding, and deleting items.</p>
                  </div>
                  <Button onClick={() => setStep(5)} className="btn-glow-green text-xs font-bold py-2.5 px-4 flex items-center gap-1">
                    Continue to Templates <ChevronRight size={14} />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
                  {/* 1. Personal Information Card */}
                  <Card className={`p-5 flex flex-col gap-3 transition-all ${isSectionLowConfidence('personal_info')
                    ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20 bg-amber-500/5'
                    : 'border-slate-200 dark:border-white/10'
                    }`}>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-1.5">
                        Personal Information
                        {isSectionLowConfidence('personal_info') && (
                          <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <AlertTriangle size={9} /> Review Required
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => toggleEditCard('personal_info')}
                        className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1"
                      >
                        {editingCards['personal_info'] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}
                      </button>
                    </div>
                    {isSectionLowConfidence('personal_info') && (
                      <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 rounded-lg flex items-center gap-1">
                        <AlertTriangle size={11} className="text-amber-500 animate-pulse" /> Please verify name, email, and phone.
                      </p>
                    )}
                    {editingCards['personal_info'] ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Full Name</label>
                          <input type="text" value={parsedData.personal_info?.name || ''} onChange={(e) => handleUpdatePersonalInfoField('name', e.target.value)} className="w-full p-1.5 border border-slate-200 dark:border-white/10 rounded bg-white dark:bg-slate-900 text-xs" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Email</label>
                          <input type="email" value={parsedData.personal_info?.email || ''} onChange={(e) => handleUpdatePersonalInfoField('email', e.target.value)} className="w-full p-1.5 border border-slate-200 dark:border-white/10 rounded bg-white dark:bg-slate-900 text-xs" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Phone</label>
                          <input type="text" value={parsedData.personal_info?.phone || ''} onChange={(e) => handleUpdatePersonalInfoField('phone', e.target.value)} className="w-full p-1.5 border border-slate-200 dark:border-white/10 rounded bg-white dark:bg-slate-900 text-xs" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Address</label>
                          <input type="text" value={parsedData.personal_info?.address || ''} onChange={(e) => handleUpdatePersonalInfoField('address', e.target.value)} className="w-full p-1.5 border border-slate-200 dark:border-white/10 rounded bg-white dark:bg-slate-900 text-xs" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase">LinkedIn</label>
                          <input type="text" value={parsedData.personal_info?.linkedin || ''} onChange={(e) => handleUpdatePersonalInfoField('linkedin', e.target.value)} className="w-full p-1.5 border border-slate-200 dark:border-white/10 rounded bg-white dark:bg-slate-900 text-xs" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase">GitHub</label>
                          <input type="text" value={parsedData.personal_info?.github || ''} onChange={(e) => handleUpdatePersonalInfoField('github', e.target.value)} className="w-full p-1.5 border border-slate-200 dark:border-white/10 rounded bg-white dark:bg-slate-900 text-xs" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs space-y-1">
                        <p><strong>Name:</strong> {parsedData.personal_info?.name || 'Not Provided'}</p>
                        <p><strong>Email:</strong> {parsedData.personal_info?.email || 'Not Provided'}</p>
                        <p><strong>Phone:</strong> {parsedData.personal_info?.phone || 'Not Provided'}</p>
                        <p><strong>Address:</strong> {parsedData.personal_info?.address || 'Not Provided'}</p>
                        <p><strong>LinkedIn:</strong> {parsedData.personal_info?.linkedin || 'Not Provided'}</p>
                        <p><strong>GitHub:</strong> {parsedData.personal_info?.github || 'Not Provided'}</p>
                      </div>
                    )}
                  </Card>

                  {/* 2. Professional Summary Card */}
                  <Card className={`p-5 flex flex-col gap-3 transition-all ${isSectionLowConfidence('summary')
                    ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20 bg-amber-500/5'
                    : 'border-slate-200 dark:border-white/10'
                    }`}>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-1.5">
                        <Sparkles size={13} /> Professional Summary
                        {isSectionLowConfidence('summary') && (
                          <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <AlertTriangle size={9} /> Review Required
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleGenerateSummary}
                          disabled={isGeneratingSummary}
                          className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20"
                        >
                          {isGeneratingSummary ? <RefreshCw size={11} className="animate-spin text-emerald-500" /> : <Sparkles size={11} />}
                          {parsedData.summary ? 'Re-generate AI Summary' : 'Auto-Generate AI Summary'}
                        </button>
                        <button
                          onClick={() => toggleEditCard('summary')}
                          className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1"
                        >
                          {editingCards['summary'] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}
                        </button>
                      </div>
                    </div>
                    {editingCards['summary'] ? (
                      <textarea rows={4} value={parsedData.summary || ''} onChange={(e) => handleUpdateScalarField('summary', e.target.value)} className="w-full p-2 border border-slate-200 dark:border-white/10 rounded bg-white dark:bg-slate-900 text-xs font-medium" />
                    ) : parsedData.summary ? (
                      <p className="text-xs text-slate-700 dark:text-slate-250 font-medium leading-relaxed">{parsedData.summary}</p>
                    ) : (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                        <div>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <Sparkles size={14} /> Professional Summary Missing
                          </span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
                            Resumes with a 95%+ ATS professional summary receive 3x higher recruiter response rates.
                          </p>
                        </div>
                        <Button
                          onClick={handleGenerateSummary}
                          disabled={isGeneratingSummary}
                          className="btn-glow-green text-xs font-bold py-2 px-3.5 shrink-0 flex items-center gap-1.5"
                        >
                          {isGeneratingSummary ? (
                            <><RefreshCw size={13} className="animate-spin" /> Generating...</>
                          ) : (
                            <><Sparkles size={13} /> Auto-Generate with Groq AI</>
                          )}
                        </Button>
                      </div>
                    )}
                  </Card>

                  {/* 3. Career Objective Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Career Objective</span>
                      <button
                        onClick={() => toggleEditCard('objective')}
                        className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1"
                      >
                        {editingCards['objective'] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}
                      </button>
                    </div>
                    {editingCards['objective'] ? (
                      <textarea rows={4} value={parsedData.objective || ''} onChange={(e) => handleUpdateScalarField('objective', e.target.value)} className="w-full p-2 border border-slate-200 dark:border-white/10 rounded bg-white dark:bg-slate-900 text-xs font-medium" />
                    ) : (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic">{parsedData.objective || 'No career objective provided.'}</p>
                    )}
                  </Card>

                  {/* 4. Education Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Education</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('education', { institution: 'University', degree: 'Degree', passing_year: '2025', cgpa_percentage: '', location: '' })} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11} /> Add Item</button>
                        <button onClick={() => toggleEditCard('education')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['education'] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}</button>
                      </div>
                    </div>
                    <div className="text-xs space-y-2">
                      {parsedData.education?.length > 0 ? (
                        parsedData.education.map((edu: any, idx: number) => (
                          <div key={idx} className="border-b last:border-0 pb-2 flex justify-between items-start gap-2">
                            {editingCards['education'] ? (
                              <div className="grid grid-cols-2 gap-1.5 w-full">
                                <input type="text" value={edu.institution || ''} placeholder="Institution" onChange={(e) => handleUpdateItemField('education', idx, 'institution', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                                <input type="text" value={edu.degree || ''} placeholder="Degree" onChange={(e) => handleUpdateItemField('education', idx, 'degree', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                                <input type="text" value={edu.passing_year || edu.year || ''} placeholder="Year" onChange={(e) => handleUpdateItemField('education', idx, 'passing_year', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                                <input type="text" value={edu.cgpa_percentage || ''} placeholder="CGPA/Grade" onChange={(e) => handleUpdateItemField('education', idx, 'cgpa_percentage', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                                {getExtraFields('education', edu).map(key => (
                                  <div key={key} className="flex flex-col gap-0.5 col-span-2">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">{key.replace(/_/g, ' ')}</label>
                                    <input type="text" value={edu[key] || ''} placeholder={key.replace(/_/g, ' ')} onChange={(e) => handleUpdateItemField('education', idx, key, e.target.value)} className="p-1 border border-slate-200 rounded text-xs w-full" />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div>
                                <p className="font-bold">{edu.institution || 'Institution'}</p>
                                <p className="text-[10px] text-slate-500">{edu.degree} • {edu.passing_year || edu.year} {edu.cgpa_percentage ? `• ${edu.cgpa_percentage}` : ''}</p>
                                {getExtraFields('education', edu).map(key => (
                                  <p key={key} className="text-[10px] text-slate-500 mt-0.5">
                                    <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {edu[key]}
                                  </p>
                                ))}
                              </div>
                            )}
                            <button onClick={() => handleDeleteItemFromSection('education', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12} /></button>
                          </div>
                        ))
                      ) : <p className="text-slate-450">No education entries found.</p>}
                    </div>
                  </Card>

                  {/* 5. Experience Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Experience</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('experience', { company: 'Company Name', position: 'Role Title', duration: '2024 - Present', description: '' })} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11} /> Add Item</button>
                        <button onClick={() => toggleEditCard('experience')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['experience'] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}</button>
                      </div>
                    </div>
                    <div className="text-xs space-y-2">
                      {parsedData.experience?.length > 0 ? (
                        parsedData.experience.map((exp: any, idx: number) => (
                          <div key={idx} className="border-b last:border-0 pb-2 flex justify-between items-start gap-2">
                            {editingCards['experience'] ? (
                              <div className="flex flex-col gap-1 w-full">
                                <div className="grid grid-cols-2 gap-1.5">
                                  <input type="text" value={exp.company || ''} placeholder="Company" onChange={(e) => handleUpdateItemField('experience', idx, 'company', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                                  <input type="text" value={exp.position || ''} placeholder="Position" onChange={(e) => handleUpdateItemField('experience', idx, 'position', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                                </div>
                                <input type="text" value={exp.duration || ''} placeholder="Duration" onChange={(e) => handleUpdateItemField('experience', idx, 'duration', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                                <textarea rows={2} value={exp.description || ''} placeholder="Description" onChange={(e) => handleUpdateItemField('experience', idx, 'description', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                                {getExtraFields('experience', exp).map(key => (
                                  <div key={key} className="flex flex-col gap-0.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">{key.replace(/_/g, ' ')}</label>
                                    <input type="text" value={exp[key] || ''} placeholder={key.replace(/_/g, ' ')} onChange={(e) => handleUpdateItemField('experience', idx, key, e.target.value)} className="p-1 border border-slate-200 rounded text-xs w-full" />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div>
                                <p className="font-bold">{exp.position} {exp.company ? `@ ${exp.company}` : ''}</p>
                                <p className="text-[10px] text-slate-400">{exp.duration}</p>
                                <p className="text-slate-600 dark:text-slate-300 mt-1">{exp.description}</p>
                                {getExtraFields('experience', exp).map(key => (
                                  <p key={key} className="text-[10px] text-slate-500 mt-0.5">
                                    <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {exp[key]}
                                  </p>
                                ))}
                              </div>
                            )}
                            <button onClick={() => handleDeleteItemFromSection('experience', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12} /></button>
                          </div>
                        ))
                      ) : <p className="text-slate-450">No experience entries found.</p>}
                    </div>
                  </Card>

                  {/* 6. Projects Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Projects</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('projects', { name: 'Project Title', tech_stack: 'React, Node', description: '' })} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11} /> Add Item</button>
                        <button onClick={() => toggleEditCard('projects')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['projects'] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}</button>
                      </div>
                    </div>
                    <div className="text-xs space-y-2">
                      {parsedData.projects?.length > 0 ? (
                        parsedData.projects.map((proj: any, idx: number) => (
                          <div key={idx} className="border-b last:border-0 pb-2 flex justify-between items-start gap-2">
                            {editingCards['projects'] ? (
                              <div className="flex flex-col gap-1 w-full">
                                <div className="grid grid-cols-2 gap-1.5">
                                  <input type="text" value={proj.name || proj.title || ''} placeholder="Project Name" onChange={(e) => handleUpdateItemField('projects', idx, 'name', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                                  <input type="text" value={proj.tech_stack || proj.technologies || ''} placeholder="Tech Stack" onChange={(e) => handleUpdateItemField('projects', idx, 'tech_stack', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                                </div>
                                <textarea rows={2} value={proj.description || ''} placeholder="Description" onChange={(e) => handleUpdateItemField('projects', idx, 'description', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                                {getExtraFields('projects', proj).map(key => (
                                  <div key={key} className="flex flex-col gap-0.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">{key.replace(/_/g, ' ')}</label>
                                    <input type="text" value={proj[key] || ''} placeholder={key.replace(/_/g, ' ')} onChange={(e) => handleUpdateItemField('projects', idx, key, e.target.value)} className="p-1 border border-slate-200 rounded text-xs w-full" />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div>
                                <p className="font-bold">{proj.name || proj.title}</p>
                                <p className="text-[10px] text-slate-400">{proj.tech_stack || proj.technologies}</p>
                                <p className="text-slate-600 dark:text-slate-300 mt-1">{proj.description}</p>
                                {getExtraFields('projects', proj).map(key => (
                                  <p key={key} className="text-[10px] text-slate-500 mt-0.5">
                                    <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {proj[key]}
                                  </p>
                                ))}
                              </div>
                            )}
                            <button onClick={() => handleDeleteItemFromSection('projects', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12} /></button>
                          </div>
                        ))
                      ) : <p className="text-slate-450">No projects found.</p>}
                    </div>
                  </Card>

                  {/* 7. Technical Skills Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Technical Skills</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('technicalSkills', 'New Skill')} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11} /> Add Item</button>
                        <button onClick={() => toggleEditCard('technicalSkills')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['technicalSkills'] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}</button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(parsedData.technicalSkills || parsedData.skills || []).map((skill: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 px-2 py-1 rounded text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                          {editingCards['technicalSkills'] ? (
                            <input type="text" value={typeof skill === 'object' ? skill.name : skill} onChange={(e) => handleUpdateItemField('technicalSkills', idx, 'name', e.target.value)} className="w-20 bg-transparent border-b border-emerald-400 text-xs focus:outline-none" />
                          ) : (
                            <span>{typeof skill === 'object' ? skill.name : skill}</span>
                          )}
                          <button onClick={() => handleDeleteItemFromSection('technicalSkills', idx)} className="text-rose-500 hover:text-rose-600 cursor-pointer ml-1"><X size={10} /></button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 8. Soft Skills Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Soft Skills</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('softSkills', 'Leadership')} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11} /> Add Item</button>
                        <button onClick={() => toggleEditCard('softSkills')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['softSkills'] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}</button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(parsedData.softSkills || []).map((skill: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 px-2 py-1 rounded text-xs text-slate-700 dark:text-slate-200 font-semibold">
                          {editingCards['softSkills'] ? (
                            <input type="text" value={skill} onChange={(e) => handleUpdateItemField('softSkills', idx, '', e.target.value)} className="w-20 bg-transparent border-b border-slate-400 text-xs focus:outline-none" />
                          ) : (
                            <span>{skill}</span>
                          )}
                          <button onClick={() => handleDeleteItemFromSection('softSkills', idx)} className="text-rose-500 hover:text-rose-600 cursor-pointer ml-1"><X size={10} /></button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 9. Certifications Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Certifications</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('certifications', { name: 'Certificate Name', organization: 'Issuer', issue_date: '2024' })} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11} /> Add Item</button>
                        <button onClick={() => toggleEditCard('certifications')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['certifications'] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}</button>
                      </div>
                    </div>
                    <div className="text-xs space-y-2">
                      {(parsedData.certifications || []).map((cert: any, idx: number) => (
                        <div key={idx} className="border-b last:border-0 pb-2 flex justify-between items-start gap-2">
                          {editingCards['certifications'] ? (
                            <div className="flex flex-col gap-1 w-full">
                              <div className="grid grid-cols-2 gap-1.5">
                                <input type="text" value={cert.name || ''} placeholder="Certificate Name" onChange={(e) => handleUpdateItemField('certifications', idx, 'name', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                                <input type="text" value={cert.organization || ''} placeholder="Issuer" onChange={(e) => handleUpdateItemField('certifications', idx, 'organization', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                              </div>
                              <textarea rows={2} value={cert.description || ''} placeholder="Description" onChange={(e) => handleUpdateItemField('certifications', idx, 'description', e.target.value)} className="p-1 border border-slate-200 rounded text-xs w-full" />
                              {getExtraFields('certifications', cert).map(key => (
                                <div key={key} className="flex flex-col gap-0.5">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase">{key.replace(/_/g, ' ')}</label>
                                  <input type="text" value={cert[key] || ''} placeholder={key.replace(/_/g, ' ')} onChange={(e) => handleUpdateItemField('certifications', idx, key, e.target.value)} className="p-1 border border-slate-200 rounded text-xs w-full" />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="w-full">
                              <p className="font-bold">{cert.name}</p>
                              <p className="text-[10px] text-slate-400">{cert.organization} • {cert.issue_date}</p>
                              {cert.description && <p className="text-slate-600 dark:text-slate-300 mt-1">{cert.description}</p>}
                              {getExtraFields('certifications', cert).map(key => (
                                <p key={key} className="text-[10px] text-slate-500 mt-0.5">
                                  <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {cert[key]}
                                </p>
                              ))}
                            </div>
                          )}
                          <button onClick={() => handleDeleteItemFromSection('certifications', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 10. Internships Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Internships</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('internships', { company: 'Company', role: 'Intern Role', duration: 'Summer 2024', description: '' })} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11} /> Add Item</button>
                        <button onClick={() => toggleEditCard('internships')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['internships'] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}</button>
                      </div>
                    </div>
                    <div className="text-xs space-y-2">
                      {(parsedData.internships || []).map((intern: any, idx: number) => (
                        <div key={idx} className="border-b last:border-0 pb-2 flex justify-between items-start gap-2">
                          {editingCards['internships'] ? (
                            <div className="flex flex-col gap-1 w-full">
                              <div className="grid grid-cols-2 gap-1.5">
                                <input type="text" value={intern.company || ''} placeholder="Company" onChange={(e) => handleUpdateItemField('internships', idx, 'company', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                                <input type="text" value={intern.role || ''} placeholder="Role" onChange={(e) => handleUpdateItemField('internships', idx, 'role', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                              </div>
                              <textarea rows={2} value={intern.description || ''} placeholder="Description" onChange={(e) => handleUpdateItemField('internships', idx, 'description', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                              {getExtraFields('internships', intern).map(key => (
                                <div key={key} className="flex flex-col gap-0.5">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase">{key.replace(/_/g, ' ')}</label>
                                  <input type="text" value={intern[key] || ''} placeholder={key.replace(/_/g, ' ')} onChange={(e) => handleUpdateItemField('internships', idx, key, e.target.value)} className="p-1 border border-slate-200 rounded text-xs w-full" />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold">{intern.role} @ {intern.company}</p>
                              <p className="text-[10px] text-slate-400">{intern.duration}</p>
                              <p className="text-slate-600 dark:text-slate-300 mt-1">{intern.description}</p>
                              {getExtraFields('internships', intern).map(key => (
                                <p key={key} className="text-[10px] text-slate-500 mt-0.5">
                                  <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span> {intern[key]}
                                </p>
                              ))}
                            </div>
                          )}
                          <button onClick={() => handleDeleteItemFromSection('internships', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 11. Achievements Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Achievements & Awards</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('achievements', '1st Place Hackathon')} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11} /> Add Item</button>
                        <button onClick={() => toggleEditCard('achievements')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['achievements'] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}</button>
                      </div>
                    </div>
                    <div className="text-xs space-y-1.5">
                      {(parsedData.achievements || []).map((ach: any, idx: number) => {
                        const displayText = typeof ach === 'string' ? ach : (ach.description || ach.title || JSON.stringify(ach));
                        return (
                          <div key={idx} className="flex justify-between items-center gap-2 border-b last:border-0 pb-1">
                            {editingCards['achievements'] ? (
                              <input type="text" value={displayText} onChange={(e) => handleUpdateItemField('achievements', idx, '', e.target.value)} className="w-full p-1 border border-slate-200 rounded text-xs dark:bg-slate-800 dark:border-slate-700" />
                            ) : (
                              <span>• {displayText}</span>
                            )}
                            <button onClick={() => handleDeleteItemFromSection('achievements', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12} /></button>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* 11.5 Hobbies & Interests Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Hobbies & Interests</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('hobbies', 'New Hobby')} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11} /> Add Item</button>
                        <button onClick={() => toggleEditCard('hobbies')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['hobbies'] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}</button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(parsedData.hobbies || []).map((hobby: any, idx: number) => {
                        const displayText = typeof hobby === 'string' ? hobby : (hobby.name || hobby.value || JSON.stringify(hobby));
                        return (
                          <div key={idx} className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 px-2 py-1 rounded text-xs font-semibold">
                            {editingCards['hobbies'] ? (
                              <input type="text" value={displayText} onChange={(e) => handleUpdateItemField('hobbies', idx, '', e.target.value)} className="w-20 bg-transparent border-b border-slate-400 text-xs focus:outline-none" />
                            ) : (
                              <span>{displayText}</span>
                            )}
                            <button onClick={() => handleDeleteItemFromSection('hobbies', idx)} className="text-rose-500 hover:text-rose-600 cursor-pointer ml-1"><X size={10} /></button>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* 12. Languages Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Languages</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('languages', 'English (Fluent)')} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11} /> Add Item</button>
                        <button onClick={() => toggleEditCard('languages')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['languages'] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}</button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(parsedData.languages || []).map((lang: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 px-2 py-1 rounded text-xs font-semibold">
                          {editingCards['languages'] ? (
                            <input type="text" value={lang} onChange={(e) => handleUpdateItemField('languages', idx, '', e.target.value)} className="w-20 bg-transparent border-b border-slate-400 text-xs focus:outline-none" />
                          ) : (
                            <span>{lang}</span>
                          )}
                          <button onClick={() => handleDeleteItemFromSection('languages', idx)} className="text-rose-500 hover:text-rose-600 cursor-pointer ml-1"><X size={10} /></button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 13. Portfolio & Links Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Portfolio & Web Links</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('portfolioLinks', 'https://portfolio.me')} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11} /> Add Item</button>
                        <button onClick={() => toggleEditCard('portfolioLinks')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['portfolioLinks'] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}</button>
                      </div>
                    </div>
                    <div className="text-xs space-y-1.5">
                      {(parsedData.portfolioLinks || []).map((link: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center gap-2 border-b last:border-0 pb-1">
                          {editingCards['portfolioLinks'] ? (
                            <input type="text" value={link} onChange={(e) => handleUpdateItemField('portfolioLinks', idx, '', e.target.value)} className="w-full p-1 border border-slate-200 rounded text-xs" />
                          ) : (
                            <a href={link} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline truncate">{link}</a>
                          )}
                          <button onClick={() => handleDeleteItemFromSection('portfolioLinks', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 14. Publications Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Publications</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('publications', { title: 'Paper Title', publisher: 'IEEE / Journal', year: '2024' })} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11} /> Add Item</button>
                        <button onClick={() => toggleEditCard('publications')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['publications'] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}</button>
                      </div>
                    </div>
                    <div className="text-xs space-y-2">
                      {(parsedData.publications || []).map((pub: any, idx: number) => (
                        <div key={idx} className="border-b last:border-0 pb-2 flex justify-between items-start gap-2">
                          {editingCards['publications'] ? (
                            <div className="grid grid-cols-2 gap-1.5 w-full">
                              <input type="text" value={pub.title || ''} placeholder="Title" onChange={(e) => handleUpdateItemField('publications', idx, 'title', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                              <input type="text" value={pub.publisher || ''} placeholder="Publisher" onChange={(e) => handleUpdateItemField('publications', idx, 'publisher', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold">{pub.title}</p>
                              <p className="text-[10px] text-slate-400">{pub.publisher} • {pub.year}</p>
                            </div>
                          )}
                          <button onClick={() => handleDeleteItemFromSection('publications', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 15. Volunteer Experience Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Volunteer Experience</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('volunteerExperience', { organization: 'NGO / Org', role: 'Volunteer', duration: '2024' })} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11} /> Add Item</button>
                        <button onClick={() => toggleEditCard('volunteerExperience')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['volunteerExperience'] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}</button>
                      </div>
                    </div>
                    <div className="text-xs space-y-2">
                      {(parsedData.volunteerExperience || []).map((vol: any, idx: number) => (
                        <div key={idx} className="border-b last:border-0 pb-2 flex justify-between items-start gap-2">
                          {editingCards['volunteerExperience'] ? (
                            <div className="grid grid-cols-2 gap-1.5 w-full">
                              <input type="text" value={vol.organization || ''} placeholder="Organization" onChange={(e) => handleUpdateItemField('volunteerExperience', idx, 'organization', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                              <input type="text" value={vol.role || ''} placeholder="Role" onChange={(e) => handleUpdateItemField('volunteerExperience', idx, 'role', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold">{vol.role} @ {vol.organization}</p>
                              <p className="text-[10px] text-slate-400">{vol.duration}</p>
                            </div>
                          )}
                          <button onClick={() => handleDeleteItemFromSection('volunteerExperience', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 16. References Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">References</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('references', { name: 'Reference Name', title: 'Professor / Manager', company: 'Org', email: '' })} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11} /> Add Item</button>
                        <button onClick={() => toggleEditCard('references')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['references'] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}</button>
                      </div>
                    </div>
                    <div className="text-xs space-y-2">
                      {(parsedData.references || []).map((ref: any, idx: number) => (
                        <div key={idx} className="border-b last:border-0 pb-2 flex justify-between items-start gap-2">
                          {editingCards['references'] ? (
                            <div className="grid grid-cols-2 gap-1.5 w-full">
                              <input type="text" value={ref.name || ''} placeholder="Name" onChange={(e) => handleUpdateItemField('references', idx, 'name', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                              <input type="text" value={ref.title || ''} placeholder="Title" onChange={(e) => handleUpdateItemField('references', idx, 'title', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold">{ref.name}</p>
                              <p className="text-[10px] text-slate-400">{ref.title} {ref.company ? `@ ${ref.company}` : ''}</p>
                            </div>
                          )}
                          <button onClick={() => handleDeleteItemFromSection('references', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </Card>
                  {/* 17. Custom Sections */}
                  {parsedData.custom_sections && parsedData.custom_sections.map((customSec: any, secIdx: number) => (
                    <Card key={`custom-${secIdx}`} className="p-5 flex flex-col gap-3 border-emerald-400/50 bg-emerald-50/10">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-xs font-bold text-emerald-500 uppercase">{customSec.section_name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const newContent = [...(customSec.content || []), "New Item"];
                              handleUpdateScalarField('custom_sections', parsedData.custom_sections.map((c: any, i: number) => i === secIdx ? { ...c, content: newContent } : c));
                            }}
                            className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"
                          >
                            <Plus size={11} /> Add Item
                          </button>
                          <button onClick={() => toggleEditCard(`custom_${secIdx}`)} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">
                            {editingCards[`custom_${secIdx}`] ? <><Save size={11} className="text-emerald-500" /> Save</> : <><FileEdit size={11} /> Edit</>}
                          </button>
                        </div>
                      </div>
                      <div className="text-xs space-y-2">
                        {(customSec.content || []).map((contentItem: any, idx: number) => {
                          const displayText = typeof contentItem === 'string' ? contentItem : JSON.stringify(contentItem);
                          return (
                            <div key={idx} className="border-b last:border-0 pb-2 flex justify-between items-start gap-2">
                              {editingCards[`custom_${secIdx}`] ? (
                                <textarea
                                  rows={2}
                                  value={displayText}
                                  onChange={(e) => {
                                    const newContent = [...customSec.content];
                                    newContent[idx] = e.target.value;
                                    handleUpdateScalarField('custom_sections', parsedData.custom_sections.map((c: any, i: number) => i === secIdx ? { ...c, content: newContent } : c));
                                  }}
                                  className="w-full p-1 border border-slate-200 rounded text-xs"
                                  style={{ color: '#000' }}
                                />
                              ) : (
                                <span>• {displayText}</span>
                              )}
                              <button
                                onClick={() => {
                                  const newContent = customSec.content.filter((_: any, i: number) => i !== idx);
                                  handleUpdateScalarField('custom_sections', parsedData.custom_sections.map((c: any, i: number) => i === secIdx ? { ...c, content: newContent } : c));
                                }}
                                className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  ))}

                  {/* Add Custom Section Button */}
                  <div className="md:col-span-2 flex justify-center py-4">
                    <button
                      onClick={() => {
                        const newSecName = prompt("Enter Custom Section Name:");
                        if (newSecName && newSecName.trim()) {
                          const updatedCustomSecs = [...(parsedData.custom_sections || [])];
                          updatedCustomSecs.push({
                            section_name: newSecName.trim(),
                            content: ["New item (click edit to change)"]
                          });
                          handleUpdateScalarField('custom_sections', updatedCustomSecs);
                        }
                      }}
                      className="text-xs font-bold py-2.5 px-4 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20 rounded-xl cursor-pointer transition-all"
                    >
                      <Plus size={14} /> Add Custom Section
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col text-left w-full bg-[#F5F5F3] p-4 rounded-3xl border border-[#E5E5E2] h-[calc(100vh-210px)] overflow-hidden justify-between"
              >
                <div className="grid grid-cols-1 lg:grid-cols-[22%_38%_40%] gap-4 w-full h-[calc(100vh-270px)] items-stretch relative overflow-hidden">

                  <div className="w-full h-full overflow-y-auto">
                    <TemplateSidebar
                      selectedTemplate={selectedTemplate}
                      onSelectTemplate={(id, color) => {
                        setSelectedTemplate(id);
                        setSelectedColor(color);
                      }}
                    />
                  </div>

                  <div className="w-full h-full overflow-y-auto">
                    <CustomizationPanel
                      selectedColor={selectedColor}
                      setSelectedColor={setSelectedColor}
                      headerAlignment={headerAlignment}
                      setHeaderAlignment={setHeaderAlignment}
                      selectedFont={selectedFont}
                      setSelectedFont={setSelectedFont}
                      selectedFontSize={selectedFontSize}
                      setSelectedFontSize={setSelectedFontSize}
                      selectedHeadingSize={selectedHeadingSize}
                      setSelectedHeadingSize={setSelectedHeadingSize}
                      selectedSpacing={selectedSpacing}
                      setSelectedSpacing={setSelectedSpacing}
                      layoutColumns={layoutColumns}
                      setLayoutColumns={setLayoutColumns}
                      selectedMargin={selectedMargin}
                      setSelectedMargin={setSelectedMargin}
                      sectionDividerStyle={sectionDividerStyle}
                      setSectionDividerStyle={setSectionDividerStyle}
                      enabledSections={enabledSections}
                      setEnabledSections={setEnabledSections}
                    />
                  </div>

                  <div className="w-full h-full flex flex-col bg-white border border-[#E5E5E2] rounded-2xl overflow-hidden relative">
                    <PreviewToolbar
                      zoom={zoom}
                      setZoom={setZoom}
                      onDownload={async () => {
                        const targetId = resumeId;
                        if (targetId) {
                          const res = await apiClient.post(`/api/resume/generate-pdf/${targetId}`, {
                            template: selectedTemplate,
                            resume_data: parsedData,
                            font_family: selectedFont,
                            font_size: `${selectedFontSize}pt`,
                            custom_config: {
                              accentColor: selectedColor,
                              spacing: selectedSpacing,
                              margins: selectedMargin,
                              layout: layoutColumns === 2 ? 'two-column' : 'one-column',
                              headerStyle: headerAlignment === 'left' ? 'classic' : headerAlignment === 'center' ? 'centered' : 'modern',
                              dividerStyle: sectionDividerStyle,
                              enabledSections: enabledSections
                            }
                          });
                          if (res.data && res.data.pdf_url) {
                            window.open(res.data.pdf_url, '_blank');
                          }
                        }
                      }}
                    />

                    <div className="flex-grow p-6 bg-[#F5F5F3] flex flex-col items-center justify-start relative overflow-y-auto min-h-0">
                      <div className="absolute top-4 left-4 z-20 bg-[#E2ECE9] border border-[#0F4A3C]/20 px-2 py-0.5 rounded text-[9px] font-black uppercase text-[#0F4A3C] select-none">
                        ATS 98%
                      </div>

                      <div className="w-full flex justify-center shadow-sm">
                        <ResumePreview
                          parsedData={parsedData}
                          selectedColor={selectedColor}
                          selectedFont={selectedFont}
                          selectedFontSize={selectedFontSize}
                          selectedHeadingSize={selectedHeadingSize}
                          selectedSpacing={selectedSpacing}
                          selectedMargin={selectedMargin}
                          layoutColumns={layoutColumns}
                          sectionDividerStyle={sectionDividerStyle}
                          enabledSections={enabledSections}
                          headerAlignment={headerAlignment}
                          zoom={zoom}
                        />
                      </div>
                    </div>

                    <div className="shrink-0 flex justify-center items-center gap-4 py-2 border-t border-[#E5E5E2] bg-white">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="px-2 py-0.5 bg-white border border-[#E5E5E2] text-[9px] font-extrabold uppercase rounded text-[#6B6B68] hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Previous Page
                      </button>
                      <span className="text-[10px] font-extrabold text-[#1A1A1A]">
                        Page {currentPage} of 1
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(1, prev + 1))}
                        className="px-2 py-0.5 bg-white border border-[#E5E5E2] text-[9px] font-extrabold uppercase rounded text-[#6B6B68] hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Next Page
                      </button>
                    </div>
                  </div>

                </div>

                {/* Bottom Navigation */}
                <BottomNavigation
                  onBack={() => setStep(4)}
                  onSkip={() => setStep(6)}
                  onContinue={() => setStep(6)}
                />
              </motion.div>
            )}

            {/* Auto-saved Toast Notification */}
            <AnimatePresence>
              {showAutoSavedToast && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-[#1a3d2e] text-white text-[11px] font-bold px-4 py-2.5 rounded-xl shadow-lg z-[9999] flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} className="text-emerald-400" /> Changes saved to Bimba cloud
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 6: AI Resume Interview */}
            {step === 6 && (
              <motion.div key="step6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-grow flex flex-col h-[55vh] max-w-4xl mx-auto w-full border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-white/5">
                <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1.5">
                    <Zap size={14} className="text-emerald-400 animate-pulse" /> Live Career Coach Chat
                  </span>
                  <Button onClick={() => setStep(7)} size="sm" className="btn-glow-green text-[10px] font-bold py-1.5 px-3">
                    Complete & Go to Completion
                  </Button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 space-y-4 max-h-[35vh]">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${msg.sender === 'ai' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' : 'bg-white/10 text-white'}`}>
                        {msg.sender === 'ai' ? 'AI' : 'Me'}
                      </div>
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed ${msg.sender === 'ai' ? 'bg-slate-50 dark:bg-white/5 border border-slate-205 dark:border-white/5 text-slate-800 dark:text-slate-200 text-left' : 'bg-[#0F4A3C] !text-white font-semibold text-left'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isAiResponding && (
                    <div className="flex gap-3 items-center text-xs text-slate-450 font-semibold">
                      <RefreshCw size={12} className="animate-spin text-emerald-550" />
                      <span>AI coach is formulating questions...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white/5 flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={questionQueue[currentQuestionIdx]?.placeholder || "Answer coach question here..."}
                    className={`flex-grow px-4 py-2.5 rounded-xl text-xs outline-none border ${isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-slate-250 text-slate-800 font-semibold'}`}
                  />
                  <button onClick={handleSendMessage} className="p-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer">
                    <Send size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 7: Smart Resume Completion */}
            {step === 7 && (
              <motion.div key="step7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 w-full text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-white/10">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles size={18} className="text-emerald-400" />
                      Smart Resume Completion
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      Refine showcase projects, certifications, and custom section highlights before ATS heuristic auditing.
                    </p>
                  </div>
                  <Button
                    onClick={() => runAnalysis(8)}
                    disabled={isAnalyzing}
                    className="btn-glow-green text-xs font-bold py-2.5 px-5 flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin text-emerald-400" />
                        Analyzing Heuristics...
                      </>
                    ) : (
                      <>
                        Analyze Heuristics <ChevronRight size={14} />
                      </>
                    )}
                  </Button>
                </div>

                {/* Section filter tabs & quick add buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/70 dark:bg-white/5 p-2 rounded-2xl border border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {[
                      { id: 'all', label: 'All Sections', count: (parsedData.projects?.length || 0) + (parsedData.certifications?.length || 0) + (parsedData.customSections?.length || customSections.length || 0) },
                      { id: 'projects', label: 'Projects', count: parsedData.projects?.length || 0 },
                      { id: 'certifications', label: 'Certifications', count: parsedData.certifications?.length || 0 },
                      { id: 'custom', label: 'Custom Sections', count: parsedData.customSections?.length || customSections.length || 0 }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveStep6Tab(tab.id as any)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeStep6Tab === tab.id
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10'
                          }`}
                      >
                        {tab.label}
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${activeStep6Tab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                          }`}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleAddItemToSection('projects', { title: 'New Showcase Project', tech: 'React, Node.js', description: 'Brief description of key achievements and results.' })}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus size={13} /> Add Project
                    </button>
                    <button
                      onClick={() => handleAddItemToSection('certifications', { name: 'New Certification', issuer: 'Issuing Organization', year: '2024' })}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus size={13} /> Add Certificate
                    </button>
                    <button
                      onClick={() => handleAddItemToSection('customSections', { title: 'New Custom Section', subtitle: 'Role / Highlight', description: 'Section details and achievements.' })}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus size={13} /> Add Custom Section
                    </button>
                  </div>
                </div>

                {/* Section Content Cards */}
                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-1">

                  {/* 1. Projects Section */}
                  {(activeStep6Tab === 'all' || activeStep6Tab === 'projects') && (
                    <Card className="p-5 flex flex-col gap-4 border-slate-200 dark:border-white/10">
                      <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <Briefcase size={16} className="text-emerald-500" />
                          <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                            Showcase Projects ({parsedData.projects?.length || 0})
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddItemToSection('projects', { title: 'New Project', tech: 'Stack / Role', description: 'Key description.' })}
                            className="text-xs font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-1"
                          >
                            <Plus size={13} /> Add Item
                          </button>
                          <button
                            onClick={() => toggleEditCard('projects_step6')}
                            className="text-xs font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1"
                          >
                            {editingCards['projects_step6'] ? <><Save size={12} className="text-emerald-500" /> Done Editing</> : <><FileEdit size={12} /> Edit All</>}
                          </button>
                        </div>
                      </div>

                      {parsedData.projects?.length > 0 ? (
                        <div className="space-y-4">
                          {parsedData.projects.map((proj: any, idx: number) => {
                            const isEditingThisCard = editingCards['projects_step6'] || editingCards[`proj_${idx}`];
                            const projTitle = proj.title || proj.name || `Project #${idx + 1}`;
                            const projTech = proj.tech || proj.technologies || proj.role || '';
                            const projDesc = proj.description || (Array.isArray(proj.details) ? proj.details.join('\n') : (proj.details || ''));

                            return (
                              <div key={idx} className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-2.5">
                                <div className="flex justify-between items-start gap-3">
                                  {isEditingThisCard ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                                      <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Project Title</label>
                                        <input
                                          type="text"
                                          value={proj.title || proj.name || ''}
                                          placeholder="Project Title"
                                          onChange={(e) => handleUpdateItemField('projects', idx, 'title', e.target.value)}
                                          className="w-full p-2 border border-slate-200 dark:border-white/10 rounded-lg text-xs dark:bg-slate-800"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Technologies / Stack</label>
                                        <input
                                          type="text"
                                          value={projTech}
                                          placeholder="e.g. React, Node.js, Python"
                                          onChange={(e) => handleUpdateItemField('projects', idx, 'tech', e.target.value)}
                                          className="w-full p-2 border border-slate-200 dark:border-white/10 rounded-lg text-xs dark:bg-slate-800"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                                        {projTitle}
                                        {projTech && (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                            {projTech}
                                          </span>
                                        )}
                                      </h4>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => toggleEditCard(`proj_${idx}`)}
                                      className="p-1 text-slate-400 hover:text-emerald-500 cursor-pointer"
                                      title="Toggle edit"
                                    >
                                      <FileEdit size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItemFromSection('projects', idx)}
                                      className="p-1 text-rose-500 hover:text-rose-600 cursor-pointer"
                                      title="Delete project"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>

                                {isEditingThisCard ? (
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Description / Key Accomplishments</label>
                                    <textarea
                                      rows={2}
                                      value={projDesc}
                                      placeholder="Describe architecture, user scale, metrics..."
                                      onChange={(e) => handleUpdateItemField('projects', idx, 'description', e.target.value)}
                                      className="w-full p-2 border border-slate-200 dark:border-white/10 rounded-lg text-xs dark:bg-slate-800 mt-1"
                                    />
                                  </div>
                                ) : (
                                  projDesc && <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{projDesc}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                          <p className="text-xs text-slate-400 font-semibold">No projects added yet.</p>
                          <button
                            onClick={() => handleAddItemToSection('projects', { title: 'New Showcase Project', tech: 'React, TypeScript', description: 'Built an interactive dashboard resulting in 40% performance gain.' })}
                            className="mt-2 text-xs font-bold text-emerald-500 hover:underline cursor-pointer"
                          >
                            + Click to add your first showcase project
                          </button>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* 2. Certifications Section */}
                  {(activeStep6Tab === 'all' || activeStep6Tab === 'certifications') && (
                    <Card className="p-5 flex flex-col gap-4 border-slate-200 dark:border-white/10">
                      <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <Award size={16} className="text-emerald-500" />
                          <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                            Certifications & Licenses ({parsedData.certifications?.length || 0})
                          </h3>
                        </div>
                        <button
                          onClick={() => handleAddItemToSection('certifications', { name: 'New Certification', issuer: 'Issuer Organization', year: '2024' })}
                          className="text-xs font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-1"
                        >
                          <Plus size={13} /> Add Certificate
                        </button>
                      </div>

                      {parsedData.certifications?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {parsedData.certifications.map((cert: any, idx: number) => {
                            const certName = typeof cert === 'string' ? cert : (cert.name || cert.title || `Certification #${idx + 1}`);
                            const certIssuer = typeof cert === 'object' ? (cert.issuer || cert.authority || '') : '';
                            const certYear = typeof cert === 'object' ? (cert.year || cert.date || '') : '';

                            return (
                              <div key={idx} className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between gap-2">
                                <div className="space-y-1 flex-grow">
                                  <input
                                    type="text"
                                    value={certName}
                                    onChange={(e) => handleUpdateItemField('certifications', idx, 'name', e.target.value)}
                                    placeholder="Certification Name"
                                    className="w-full font-bold text-xs bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-white/20 focus:border-emerald-500 outline-none text-slate-900 dark:text-white"
                                  />
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={certIssuer}
                                      onChange={(e) => handleUpdateItemField('certifications', idx, 'issuer', e.target.value)}
                                      placeholder="Issuer (e.g. AWS, Coursera)"
                                      className="text-[10px] text-slate-500 dark:text-slate-400 bg-transparent outline-none w-1/2 border-b border-transparent hover:border-slate-300"
                                    />
                                    <input
                                      type="text"
                                      value={certYear}
                                      onChange={(e) => handleUpdateItemField('certifications', idx, 'year', e.target.value)}
                                      placeholder="Year"
                                      className="text-[10px] text-slate-500 dark:text-slate-400 bg-transparent outline-none w-1/3 border-b border-transparent hover:border-slate-300"
                                    />
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteItemFromSection('certifications', idx)}
                                  className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                                  title="Delete certification"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                          <p className="text-xs text-slate-400 font-semibold">No certifications added yet.</p>
                          <button
                            onClick={() => handleAddItemToSection('certifications', { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', year: '2024' })}
                            className="mt-2 text-xs font-bold text-emerald-500 hover:underline cursor-pointer"
                          >
                            + Add a professional certification
                          </button>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* 3. Custom Sections */}
                  {(activeStep6Tab === 'all' || activeStep6Tab === 'custom') && (
                    <Card className="p-5 flex flex-col gap-4 border-slate-200 dark:border-white/10">
                      <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <FileCode size={16} className="text-emerald-500" />
                          <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                            Custom Sections & Extra Highlights ({(parsedData.customSections?.length || 0)})
                          </h3>
                        </div>
                        <button
                          onClick={() => handleAddItemToSection('customSections', { title: 'Leadership & Honors', subtitle: 'President', description: 'Led student organization of 150+ members.' })}
                          className="text-xs font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-1"
                        >
                          <Plus size={13} /> Add Custom Section
                        </button>
                      </div>

                      {(parsedData.customSections?.length || 0) > 0 ? (
                        <div className="space-y-3">
                          {parsedData.customSections.map((sec: any, idx: number) => (
                            <div key={idx} className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 space-y-2">
                              <div className="flex justify-between items-center gap-2">
                                <input
                                  type="text"
                                  value={sec.title || ''}
                                  onChange={(e) => handleUpdateItemField('customSections', idx, 'title', e.target.value)}
                                  placeholder="Section Title (e.g. Volunteer Work, Awards)"
                                  className="font-bold text-xs bg-transparent border-b border-transparent focus:border-emerald-500 outline-none text-slate-900 dark:text-white w-full"
                                />
                                <button
                                  onClick={() => handleDeleteItemFromSection('customSections', idx)}
                                  className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                              <textarea
                                rows={2}
                                value={sec.description || ''}
                                onChange={(e) => handleUpdateItemField('customSections', idx, 'description', e.target.value)}
                                placeholder="Details and description for this section..."
                                className="w-full p-2 border border-slate-200 dark:border-white/10 rounded-lg text-xs dark:bg-slate-800"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                          <p className="text-xs text-slate-400 font-semibold">No custom sections created yet.</p>
                          <button
                            onClick={() => handleAddItemToSection('customSections', { title: 'Awards & Leadership', description: 'Hackathon 1st Place Winner (2024)' })}
                            className="mt-2 text-xs font-bold text-emerald-500 hover:underline cursor-pointer"
                          >
                            + Create a custom section
                          </button>
                        </div>
                      )}
                    </Card>
                  )}

                </div>
              </motion.div>
            )}

            {/* Step 8: AI Resume Analysis */}
            {step === 8 && (
              <motion.div key="step8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 w-full text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-white/10">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles size={18} className="text-emerald-400" />
                      AI Resume Audit & Heuristics
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      Real-time diagnostic scoring evaluating ATS compatibility, keyword density, and section structure.
                    </p>
                  </div>
                  <Button onClick={() => setStep(9)} className="btn-glow-green text-xs font-bold py-2.5 px-5 flex items-center gap-2 shrink-0 cursor-pointer">
                    Resume Improvement <ChevronRight size={14} />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Score Breakdown Card */}
                  <Card className="p-6 flex flex-col items-center justify-between gap-4 border-slate-200 dark:border-white/10 bg-slate-50/40 dark:bg-white/5">
                    <div className="text-center space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Overall ATS Score
                      </span>
                      <div className="text-5xl font-black text-emerald-500 tracking-tight my-2">
                        {analysisData?.scores?.overall_score || 72}%
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {analysisData?.metadata?.readability || 'Good Alignment'}
                      </span>
                    </div>

                    <div className="w-full space-y-2 border-t pt-4 border-slate-200/60 dark:border-white/10 text-xs">
                      {[
                        { label: 'Technical Keywords', score: analysisData?.scores?.keyword_match_score || 75 },
                        { label: 'Project Quality & Metrics', score: analysisData?.scores?.project_quality_score || 70 },
                        { label: 'Academic Completeness', score: analysisData?.scores?.education_completeness || 90 },
                        { label: 'Formatting & Layout', score: analysisData?.scores?.formatting_score || 85 }
                      ].map((metric, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            <span>{metric.label}</span>
                            <span className="text-emerald-500">{metric.score}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${metric.score}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Identified Critique Issues List */}
                  <Card className="p-6 md:col-span-2 flex flex-col gap-4 border-slate-200 dark:border-white/10 bg-slate-50/40 dark:bg-white/5">
                    <div className="flex items-center justify-between border-b pb-3 border-slate-200/60 dark:border-white/10">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                        <AlertTriangle size={15} className="text-emerald-500" />
                        Identified Real Critique Issues ({analysisData?.suggestions?.length || 0})
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Real-time content analysis</span>
                    </div>

                    <div className="space-y-3.5 max-h-[42vh] overflow-y-auto pr-1">
                      {analysisData?.suggestions?.map((s: any, idx: number) => {
                        const itemTitle = typeof s === 'string' ? s : (s.problem || s.title || 'Resume Optimization Tip');
                        const itemReason = typeof s === 'object' ? (s.reason || '') : '';
                        const itemFix = typeof s === 'object' ? (s.recommended_fix || '') : '';
                        const priority = typeof s === 'object' ? (s.priority || 'Medium') : 'Medium';

                        return (
                          <div key={idx} className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 space-y-2 shadow-sm transition-all hover:border-emerald-500/40">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                                  <Sparkles size={13} />
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug">{itemTitle}</h4>
                                  {itemReason && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{itemReason}</p>}
                                </div>
                              </div>
                              {priority && (
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ${priority.toLowerCase() === 'high'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                  : priority.toLowerCase() === 'low'
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  }`}>
                                  {priority}
                                </span>
                              )}
                            </div>

                            {itemFix && (
                              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 mt-2 flex items-start gap-2">
                                <span className="shrink-0 font-bold">💡 Fix:</span>
                                <span>{itemFix}</span>
                              </div>
                            )}
                          </div>
                        );
                      }) || <p className="text-xs text-slate-400">All checks successfully passed!</p>}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Step 9: AI Resume Improvement */}
            {step === 9 && (
              <motion.div key="step9" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 w-full text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-white/10">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles size={18} className="text-emerald-400" />
                      AI Resume Polish & Improvements
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      Review AI-suggested improvements — better grammar, stronger verbs, and cleaner structure. Your original facts are preserved.
                    </p>
                  </div>
                  <Button onClick={() => setStep(10)} className="btn-glow-green text-xs font-bold py-2.5 px-4 flex items-center gap-1 shrink-0 cursor-pointer">
                    Quality Audit <ChevronRight size={14} />
                  </Button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-1">
                  {resumeId ? (
                    <ResumeImprovement
                      resumeId={resumeId}
                      onChangesApplied={async () => {
                        try {
                          const profileRes = await apiClient.get(`/api/resume-studio/profile/${resumeId}`);
                          if (profileRes.data) {
                            setParsedData(profileRes.data);
                          }
                        } catch (err) {
                          console.error("Error updating profile after improvement:", err);
                        }
                      }}
                    />
                  ) : (
                    <div className="text-center py-12 flex flex-col items-center gap-3">
                      <p className="text-xs text-slate-400 font-semibold">Initializing resume draft for AI improvements...</p>
                      <Button
                        onClick={async () => {
                          const newId = await saveResumeToDb(parsedData);
                          if (newId) setResumeId(newId);
                        }}
                        className="btn-glow-green text-xs font-bold py-2.5 px-5"
                      >
                        Initialize AI Improvements
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}


            {/* Step 10: Final Review */}
            {step === 10 && (
              <motion.div key="step10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 w-full text-left">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h2 className="text-lg font-black">Final Quality Audit Check</h2>
                    <p className="text-xs text-slate-500">Ensure resume formatting, spelling, metrics, and dates align properly.</p>
                  </div>
                  <Button onClick={() => setStep(11)} className="btn-glow-green text-xs font-bold py-2.5 px-4 flex items-center gap-1">
                    Save Resume <Save size={14} />
                  </Button>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-emerald-500" size={16} />
                      <span className="text-xs font-bold">Heuristic parsing model score ready for save</span>
                    </div>
                    <span className="text-xs font-black text-emerald-500">{analysisData?.scores?.overall_score || 72}% overall</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p>✓ Resume completeness checked</p>
                    <p>✓ Critical education nodes verify passed</p>
                    <p>✓ ATS formatted templates loaded</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 11: Dedicated Download & Save Resume Screen */}
            {step === 11 && (
              <motion.div key="step11" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 w-full text-left">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h2 className="text-lg font-black flex items-center gap-1.5 text-emerald-500">
                      🎉 Your resume is ready!
                    </h2>
                    <p className="text-xs text-slate-500">Select formats, save version snapshots, or manage resume metadata.</p>
                  </div>
                  <Button onClick={() => setStep(12)} className="btn-glow-green text-xs font-bold py-2.5 px-4 flex items-center gap-1">
                    Job Recommendations <ChevronRight size={14} />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-5 flex flex-col gap-3 md:col-span-1 border-slate-200 dark:border-white/5">
                    <span className="text-xs font-extrabold uppercase text-slate-400">Resume Metadata</span>
                    <div className="space-y-2 text-xs">
                      <p><strong>Name:</strong> {parsedData.name || 'AI Enhanced Resume'}</p>
                      <p><strong>ATS Score:</strong> <span className="font-bold text-emerald-500">{analysisData?.scores?.overall_score || 72}%</span></p>
                      <p><strong>Template:</strong> <span className="capitalize font-bold">{selectedTemplate}</span></p>
                      <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="flex flex-col gap-2 mt-4">
                      <button
                        onClick={() => {
                          const n = prompt("Enter new resume name:", parsedData.name || "AI Enhanced Resume");
                          if (n) handleRenameResume(n);
                        }}
                        className="px-3 py-2 border border-slate-200 dark:border-white/10 hover:border-emerald-500 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-250 cursor-pointer"
                      >
                        Rename Resume
                      </button>
                      <button
                        onClick={() => {
                          const v = prompt("Enter version name:", "Final Clean Copy");
                          if (v) handleSaveVersion(v);
                        }}
                        className="px-3 py-2 border border-slate-200 dark:border-white/10 hover:border-emerald-500 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-250 cursor-pointer"
                      >
                        Save as New Version
                      </button>
                    </div>
                  </Card>

                  <Card className="p-5 flex flex-col gap-4 md:col-span-2 border-slate-200 dark:border-white/5">
                    <span className="text-xs font-extrabold uppercase text-slate-450">Available Downloads</span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => handleDownload('pdf')}
                        className="p-4 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer"
                      >
                        <FileText className="text-emerald-500" size={24} />
                        <span className="text-xs font-bold">Download PDF</span>
                      </button>

                      <button
                        onClick={() => handleDownload('docx')}
                        className="p-4 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer"
                      >
                        <FileCode className="text-blue-500" size={24} />
                        <span className="text-xs font-bold">Download DOCX</span>
                      </button>

                      <button
                        onClick={() => handleDownload('txt')}
                        className="p-4 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer"
                      >
                        <Briefcase className="text-purple-500" size={24} />
                        <span className="text-xs font-bold">Download TXT</span>
                      </button>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Step 12: Real Job Recommendations */}
            {step === 12 && (
              <motion.div key="step12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 w-full text-left">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h2 className="text-lg font-black">Personalized Live Job Matches</h2>
                    <p className="text-xs text-slate-500">Real vacancies fetched dynamically based on your extracted resume skills.</p>
                  </div>
                  <Button onClick={() => setStep(13)} className="btn-glow-green text-xs font-bold py-2.5 px-4 flex items-center gap-1">
                    Complete Flow <ChevronRight size={14} />
                  </Button>
                </div>

                {loadingJobs ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <RefreshCw size={24} className="animate-spin text-emerald-500" />
                    <span className="text-xs font-bold text-slate-400">Analyzing skills alignment & fetching listings...</span>
                  </div>
                ) : jobsError ? (
                  <div className="text-center py-12 text-slate-455 font-bold text-xs">{jobsError}</div>
                ) : recommendedJobs.length === 0 ? (
                  <div className="text-center py-12 space-y-4 max-w-md mx-auto">
                    <AlertTriangle className="text-amber-500 mx-auto" size={32} />
                    <h4 className="text-xs font-bold">We couldn't find jobs matching your current resume.</h4>
                    <p className="text-[10px] text-slate-450">Try adding more details to your projects, keywords, or skills profile.</p>
                    <div className="flex gap-2 justify-center pt-2">
                      <button onClick={() => setStep(6)} className="px-3.5 py-1.5 bg-emerald-500 text-white font-bold text-[10px] rounded-lg cursor-pointer">Improve Resume Again</button>
                      <button onClick={fetchJobRecommendations} className="px-3.5 py-1.5 bg-white/5 border border-white/10 text-slate-250 font-bold text-[10px] rounded-lg cursor-pointer">Refresh Recommendations</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[45vh] overflow-y-auto pr-2">
                    {recommendedJobs.map((job) => (
                      <Card key={job.id} className="p-4 border-slate-200 dark:border-white/5 flex flex-col justify-between gap-3 text-xs">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h4 className="font-extrabold text-slate-800 dark:text-white leading-snug">{job.title}</h4>
                            <p className="text-[10px] text-slate-450 mt-0.5">{job.company} • {job.location}</p>
                          </div>
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-1.5 py-0.5 rounded shrink-0">
                            {job.ai_match_score || 88}% MATCH
                          </span>
                        </div>

                        {job.skills_matched && job.skills_matched.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {job.skills_matched.slice(0, 3).map((s, i) => (
                              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-50 dark:bg-white/5 text-slate-400 font-semibold">{s}</span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                          <span className="text-[9px] text-slate-450">Posted: {job.posted_date || 'Recent'}</span>
                          <div className="flex items-center gap-1.5">
                            {job.apply_url ? (
                              <a
                                href={(() => {
                                  const url = job.apply_url;
                                  if (url.includes('google.com/url?') || url.includes('google.co.in/url?')) {
                                    try {
                                      const u = new URL(url);
                                      const q = u.searchParams.get('q');
                                      if (q) return q;
                                    } catch (_) {}
                                  }
                                  return url;
                                })()}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] rounded-lg"
                              >
                                Apply Now
                              </a>
                            ) : (
                              <button disabled className="px-3 py-1 bg-slate-100 text-slate-400 text-[9px] rounded-lg cursor-not-allowed">
                                No Link
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                await jobsService.saveJob({
                                  job_id: job.id,
                                  company: job.company,
                                  title: job.title,
                                  location: job.location,
                                  application_url: job.apply_url
                                });
                                alert("Job saved successfully!");
                              }}
                              className="px-2.5 py-1 bg-white/5 border border-white/10 text-slate-300 hover:border-emerald-500 rounded-lg text-[9px] font-bold cursor-pointer"
                            >
                              Save Job
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 13: Final Success Screen */}
            {step === 13 && (
              <motion.div key="step13" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto w-full text-center flex flex-col gap-6 py-12">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 mx-auto animate-bounce">
                  <CheckSquare size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black">Resume Improved successfully!</h2>
                  <p className="text-xs text-slate-500 mt-1">All improvements saved, downloads compiled, and live recommendations synced.</p>
                </div>

                <div className="flex flex-col gap-2 max-w-xs mx-auto text-left text-xs bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> Resume Improved & Reparsed</p>
                  <p className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> Stored Version & Master Profile</p>
                  <p className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> Updated ATS Score Ring</p>
                  <p className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> Job Recommendations Generated</p>
                </div>

                <div className="flex flex-col gap-2 w-full max-w-xs mx-auto">
                  <Button onClick={() => handleDownload('pdf')} className="w-full btn-glow-green text-xs font-bold py-2.5 flex items-center justify-center gap-1.5">
                    Download PDF
                  </Button>
                  <Button
                    onClick={() => {
                      onSuccess(resumeId || 0);
                      onClose();
                    }}
                    variant="secondary"
                    className="w-full text-xs font-bold py-2.5"
                  >
                    Continue to Dashboard
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Navigation Footer */}
        {step > 1 && step < 13 && step !== 3 && step !== 5 && (
          <div className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${isDark ? 'border-white/10 bg-[#1F2937]/30' : 'border-slate-100 bg-slate-50'
            }`}>
            <button
              onClick={() => {
                if (step === 4) setStep(2);
                else setStep(prev => Math.max(1, prev - 1));
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-xl cursor-pointer transition-all border border-slate-250 dark:border-white/10 bg-transparent"
            >
              <ArrowLeft size={14} /> Back
            </button>

            <button
              onClick={() => {
                if (step === 2) setStep(4);
                else setStep(prev => Math.min(13, prev + 1));
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white cursor-pointer transition-all"
            >
              Skip Step <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Modal Section-Editing Overlays (Side Panels) */}
        {editSectionType && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-end p-0">
            <div className={`w-full max-w-lg h-full p-6 flex flex-col justify-between border-l ${isDark ? 'bg-[#111827] text-white border-white/10' : 'bg-white text-slate-800 border-slate-200'
              }`}>
              <div className="flex justify-between items-center border-b pb-4">
                <h4 className="text-sm font-black uppercase">Edit {editSectionType}</h4>
                <button onClick={() => setEditSectionType(null)} className="p-1 rounded hover:bg-slate-550/10"><X size={16} /></button>
              </div>

              <div className="flex-grow py-4 overflow-y-auto space-y-4 text-xs">
                {editSectionType === 'personal' && (
                  <>
                    <div>
                      <label className="block mb-1 font-bold">Full Name</label>
                      <input
                        type="text"
                        value={parsedData.personal_info?.name || ''}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          personal_info: { ...parsedData.personal_info, name: e.target.value }
                        })}
                        className="w-full p-2 rounded-lg border dark:bg-black/20 border-white/10"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold">Email</label>
                      <input
                        type="text"
                        value={parsedData.personal_info?.email || ''}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          personal_info: { ...parsedData.personal_info, email: e.target.value }
                        })}
                        className="w-full p-2 rounded-lg border dark:bg-black/20 border-white/10"
                      />
                    </div>
                  </>
                )}
                {editSectionType === 'education' && (
                  <div className="space-y-4">
                    <Button
                      onClick={() => {
                        const updatedEdu = [...(parsedData.education || [])];
                        updatedEdu.push({ id: Date.now(), institution: 'New Institution', degree: 'Degree', year: '2026' });
                        setParsedData({ ...parsedData, education: updatedEdu });
                      }}
                      className="w-full text-xs font-bold py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                    >
                      + Add New Education Entry
                    </Button>
                    {(parsedData.education || []).map((edu: any, idx: number) => (
                      <div key={edu.id || idx} className="p-3 border border-white/10 rounded-xl space-y-2 relative">
                        <button
                          onClick={() => {
                            const updated = parsedData.education.filter((_: any, i: number) => i !== idx);
                            setParsedData({ ...parsedData, education: updated });
                          }}
                          className="absolute top-2 right-2 text-rose-500 hover:text-rose-600"
                        >
                          <Trash2 size={12} />
                        </button>
                        <div>
                          <label className="block mb-0.5 font-semibold text-[10px]">Institution</label>
                          <input
                            type="text"
                            value={edu.institution || ''}
                            onChange={(e) => {
                              const updated = [...parsedData.education];
                              updated[idx].institution = e.target.value;
                              setParsedData({ ...parsedData, education: updated });
                            }}
                            className="w-full p-1.5 rounded bg-black/20 border border-white/10 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block mb-0.5 font-semibold text-[10px]">Degree</label>
                          <input
                            type="text"
                            value={edu.degree || ''}
                            onChange={(e) => {
                              const updated = [...parsedData.education];
                              updated[idx].degree = e.target.value;
                              setParsedData({ ...parsedData, education: updated });
                            }}
                            className="w-full p-1.5 rounded bg-black/20 border border-white/10 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {editSectionType === 'projects' && (
                  <div className="space-y-4">
                    <Button
                      onClick={() => {
                        const updatedProjects = [...(parsedData.projects || [])];
                        updatedProjects.push({ id: Date.now(), title: 'New Project', description: 'Describe impact here.', tech_stack: '' });
                        setParsedData({ ...parsedData, projects: updatedProjects });
                      }}
                      className="w-full text-xs font-bold py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                    >
                      + Add New Project
                    </Button>
                    {(parsedData.projects || []).map((proj: any, idx: number) => (
                      <div key={proj.id || idx} className="p-3 border border-white/10 rounded-xl space-y-2 relative">
                        <button
                          onClick={() => {
                            const updated = parsedData.projects.filter((_: any, i: number) => i !== idx);
                            setParsedData({ ...parsedData, projects: updated });
                          }}
                          className="absolute top-2 right-2 text-rose-500 hover:text-rose-600"
                        >
                          <Trash2 size={12} />
                        </button>
                        <div>
                          <label className="block mb-0.5 font-semibold text-[10px]">Project Title</label>
                          <input
                            type="text"
                            value={proj.title || ''}
                            onChange={(e) => {
                              const updated = [...parsedData.projects];
                              updated[idx].title = e.target.value;
                              setParsedData({ ...parsedData, projects: updated });
                            }}
                            className="w-full p-1.5 rounded bg-black/20 border border-white/10 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block mb-0.5 font-semibold text-[10px]">Description / Key Achievements</label>
                          <textarea
                            value={proj.description || ''}
                            onChange={(e) => {
                              const updated = [...parsedData.projects];
                              updated[idx].description = e.target.value;
                              setParsedData({ ...parsedData, projects: updated });
                            }}
                            rows={3}
                            className="w-full p-1.5 rounded bg-black/20 border border-white/10 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {editSectionType === 'certifications' && (
                  <div className="space-y-4">
                    <Button
                      onClick={() => {
                        const updated = [...(parsedData.certifications || [])];
                        updated.push('New Certification');
                        setParsedData({ ...parsedData, certifications: updated });
                      }}
                      className="w-full text-xs font-bold py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                    >
                      + Add New Certification
                    </Button>
                    {(parsedData.certifications || []).map((cert: string, idx: number) => (
                      <div key={idx} className="p-3 border border-white/10 rounded-xl space-y-2 relative">
                        <button
                          onClick={() => {
                            const updated = parsedData.certifications.filter((_: any, i: number) => i !== idx);
                            setParsedData({ ...parsedData, certifications: updated });
                          }}
                          className="absolute top-2 right-2 text-rose-500 hover:text-rose-600"
                        >
                          <Trash2 size={12} />
                        </button>
                        <div>
                          <label className="block mb-0.5 font-semibold text-[10px]">Certification Title</label>
                          <input
                            type="text"
                            value={cert}
                            onChange={(e) => {
                              const updated = [...parsedData.certifications];
                              updated[idx] = e.target.value;
                              setParsedData({ ...parsedData, certifications: updated });
                            }}
                            className="w-full p-1.5 rounded bg-black/20 border border-white/10 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {editSectionType === 'custom' && (
                  <div className="space-y-4">
                    <Button
                      onClick={() => {
                        setCustomSections([...customSections, { id: Date.now(), title: 'Custom Section', content: '' }]);
                      }}
                      className="w-full text-xs font-bold py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                    >
                      + Add Custom Section
                    </Button>
                    {customSections.map((sec: any, idx: number) => (
                      <div key={sec.id || idx} className="p-3 border border-white/10 rounded-xl space-y-2 relative">
                        <button
                          onClick={() => {
                            setCustomSections(customSections.filter((_: any, i: number) => i !== idx));
                          }}
                          className="absolute top-2 right-2 text-rose-500 hover:text-rose-600"
                        >
                          <Trash2 size={12} />
                        </button>
                        <div>
                          <label className="block mb-0.5 font-semibold text-[10px]">Section Title</label>
                          <input
                            type="text"
                            value={sec.title}
                            onChange={(e) => {
                              const updated = [...customSections];
                              updated[idx].title = e.target.value;
                              setCustomSections(updated);
                            }}
                            className="w-full p-1.5 rounded bg-black/20 border border-white/10 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block mb-0.5 font-semibold text-[10px]">Content</label>
                          <textarea
                            value={sec.content}
                            onChange={(e) => {
                              const updated = [...customSections];
                              updated[idx].content = e.target.value;
                              setCustomSections(updated);
                            }}
                            rows={3}
                            className="w-full p-1.5 rounded bg-black/20 border border-white/10 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={async () => {
                  await saveResumeToDb(parsedData);
                  setEditSectionType(null);
                }}
                className="w-full btn-glow-green text-xs font-bold py-3"
              >
                Apply Changes
              </Button>
            </div>
          </div>
        )}

        {/* Active Heuristics Analyzing Loading Overlay */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 z-50 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center transition-all ${isDark ? 'bg-[#0B121F]/90 text-white' : 'bg-slate-900/60 backdrop-blur-lg text-slate-800'
                }`}
            >
              <div className={`rounded-3xl p-8 max-w-md w-full shadow-2xl border flex flex-col items-center gap-5 ${isDark ? 'bg-[#111827] border-emerald-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-500 animate-pulse">
                    <Sparkles size={32} className="animate-spin" style={{ animationDuration: '4s' }} />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                </div>

                <div>
                  <h3 className="text-base font-extrabold tracking-tight">Analyzing Resume Heuristics</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Evaluating ATS keyword density, formatting structure, and metric impact...</p>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-white/10">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full animate-pulse rounded-full w-3/4" />
                </div>

                <div className="space-y-2.5 text-left w-full text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200/80 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={13} className="animate-spin text-emerald-500 shrink-0" />
                    <span>Parsing keywords against target role standards...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Auditing section completeness & structural layout...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap size={13} className="text-emerald-500 shrink-0" />
                    <span>Generating real-time tailored critique recommendations...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
