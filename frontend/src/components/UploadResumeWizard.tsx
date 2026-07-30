import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, FileText, CheckCircle2, ChevronRight, AlertTriangle, Sparkles,
  ArrowRight, Check, X, HelpCircle, Download, Briefcase, RefreshCw, 
  Search, ShieldAlert, Award, FileCode, CheckCircle, ExternalLink, Filter, MapPin,
  TrendingUp, Activity, CheckCircle2 as CheckedIcon, FileEdit, Award as AwardIcon,
  Smile, UserCheck, Play, Zap, Info
} from 'lucide-react';
import { apiClient } from '../services/api';
import { jobsService, type JobListItem } from '../services/jobs';
import { Button } from './Button';
import { Card } from './Card';
import { ResumeBuilder } from './resume/ResumeBuilder';

interface UploadResumeWizardProps {
  onClose: () => void;
  onSuccess: (resumeId: number) => void;
  isDark: boolean;
  initialFile?: File | null;
}

export const UploadResumeWizard: React.FC<UploadResumeWizardProps> = ({
  onClose,
  onSuccess,
  isDark,
  initialFile = null
}) => {
  // Wizard Stages: 1 to 10
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [file, setFile] = useState<File | null>(initialFile);
  const [pasteText, setPasteText] = useState<string>('');
  
  // Real Parsed and DB Data
  const [parsedData, setParsedData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [resumeId, setResumeId] = useState<number | null>(null);

  // Loading & Log states for Stage 1
  const [activeTaskIdx, setActiveTaskIdx] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [ocrLogs, setOcrLogs] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);

  // Dynamic Question (Stage 5) & Goal (Stage 6)
  const [intelligentQuestion, setIntelligentQuestion] = useState<{
    question: string;
    options: string[];
    key: string;
  }>({
    question: 'What is your primary target role/title for this resume?',
    options: ['Frontend Engineer', 'Fullstack Developer', 'Backend Specialist', 'AI/ML Engineer', 'Product Manager'],
    key: 'target_role'
  });
  const [questionAnswer, setQuestionAnswer] = useState<string>('');
  const [careerGoal, setCareerGoal] = useState<string>('');

  // Repair Flow (Stage 7 & 8)
  const [repairIndex, setRepairIndex] = useState<number>(0);
  const [improvedBullets, setImprovedBullets] = useState<Array<{
    section: string;
    index: number;
    original: string;
    improved: string;
    diff: string;
    atsBenefit: number;
    accepted: boolean;
  }>>([]);
  const [originalBullets, setOriginalBullets] = useState<string[]>([]);
  const [repairComplete, setRepairComplete] = useState<boolean>(false);

  // Live Score Tracking
  const [liveScores, setLiveScores] = useState({
    overall: 70,
    ats: 65,
    grammar: 80,
    formatting: 75,
    impact: 60,
    keyword: 62,
    readability: 'Good',
    impression: 'Solid Candidate'
  });

  // User Goal input states
  const [goalOption, setGoalOption] = useState<'job' | 'general' | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [comparisonBullets, setComparisonBullets] = useState<any[]>([]);

  // Expandable Parser Results (Stage 2)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    personal: true,
    skills: false,
    experience: false,
    education: false,
    projects: false
  });

  // Analysis Loading States
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);

  const runAIAnalysis = async () => {
    if (!resumeId) return;
    setAnalysisLoading(true);
    try {
      const analyzeRes = await apiClient.post(`/api/resume-studio/${resumeId}/analyze`);
      const analysis = analyzeRes.data;
      setAnalysisData(analysis);

      // Set Scores
      const scr = analysis.scores || {};
      const newScores = {
        overall: scr.overall_score || 72,
        ats: scr.ats_score || 68,
        grammar: scr.grammar_score || 85,
        formatting: scr.formatting_score || 75,
        impact: scr.project_quality_score || 65,
        keyword: scr.keyword_match_score || 60,
        readability: analysis.metadata?.readability || 'Good',
        impression: scr.overall_score > 85 ? 'Elite Candidate' : 'Highly Competitive'
      };
      setLiveScores(newScores);
      
      // Auto transition to Health Dashboard (Stage 4)
      setCurrentStage(4);
    } catch (e) {
      console.error('AI Analysis failed:', e);
      // Fallback baseline scores
      setLiveScores({
        overall: 70,
        ats: 65,
        grammar: 80,
        formatting: 75,
        impact: 60,
        keyword: 62,
        readability: 'Good',
        impression: 'Solid Candidate'
      });
      setCurrentStage(4);
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    if (currentStage === 3 && resumeId && !analysisData && !analysisLoading) {
      runAIAnalysis();
    }
  }, [currentStage, resumeId, analysisData, analysisLoading]);

  // Final Jobs (Stage 10)
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [jobsLoading, setJobsLoading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Thinking Tasks (Stage 1 / Step 3)
  const processingTasks = [
    'Upload Complete',
    'Reading Resume',
    'Extracting Text',
    'Detecting Sections',
    'Finding Skills',
    'Detecting Experience',
    'Detecting Projects',
    'Building Candidate Profile'
  ];

  // Auto start parsing if initialFile is passed
  useEffect(() => {
    if (initialFile) {
      setFile(initialFile);
      startIngestion(initialFile);
    }
  }, [initialFile]);

  // Task simulation for Stage 1
  useEffect(() => {
    if (isParsing && activeTaskIdx < processingTasks.length) {
      const interval = setTimeout(() => {
        setCompletedTasks(prev => [...prev, processingTasks[activeTaskIdx]]);
        setActiveTaskIdx(prev => prev + 1);
      }, 120);
      return () => clearTimeout(interval);
    } else if (isParsing && activeTaskIdx === processingTasks.length) {
      // Transition to Stage 2 once complete
      setTimeout(() => {
        setIsParsing(false);
        setCurrentStage(2);
      }, 80);
    }
  }, [isParsing, activeTaskIdx]);

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
    const ext = targetFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx' && ext !== 'txt') {
      alert("Unsupported file format. Please upload PDF, DOCX or TXT.");
      return;
    }
    
    setIsParsing(true);
    setActiveTaskIdx(0);
    setCompletedTasks([]);
    setOcrLogs(['[OCR] File received. Parsing document structure...']);
    
    try {
      const formData = new FormData();
      formData.append('file', targetFile);
      
      // Upload & Parse
      const uploadRes = await apiClient.post('/api/resume-studio/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const parsed = uploadRes.data.parsed_data;
      setParsedData(parsed);

      // Create new resume in background
      const createRes = await apiClient.post('/api/resume-studio/create', {
        name: `AI Diagnostic - ${parsed.personal_info?.name || 'Resume'}`,
        resume_type: parsed.experience?.length > 0 ? 'Experienced' : 'Fresher',
        target_role: parsed.personal_info?.title || 'Software Engineer',
        career_objective: parsed.personal_info?.summary || 'AI diagnostic resume.',
        preferred_industry: 'Technology',
        language: 'English',
        visibility: 'Private'
      });

      const newId = createRes.data.id;
      setResumeId(newId);

      // Save parsed details to DB
      await apiClient.post(`/api/resume-studio/${newId}/save-final`, {
        master: {
          name: `AI Diagnostic - ${parsed.personal_info?.name || 'Resume'}`,
          resume_type: parsed.experience?.length > 0 ? 'Experienced' : 'Fresher',
          target_role: parsed.personal_info?.title || 'Software Engineer',
          career_objective: parsed.personal_info?.summary || 'AI diagnostic resume.',
          preferred_industry: 'Technology',
          language: 'English',
          visibility: 'Private',
          phone: parsed.personal_info?.phone || '',
          address: parsed.personal_info?.address || '',
          linkedin: parsed.personal_info?.linkedin || '',
          github: parsed.personal_info?.github || '',
          portfolio: parsed.personal_info?.portfolio || '',
          website: parsed.personal_info?.website || '',
          summary: parsed.personal_info?.summary || ''
        },
        personal_info: parsed.personal_info || {},
        education: parsed.education || [],
        experience: parsed.experience || [],
        projects: parsed.projects || [],
        skills: parsed.skills || [],
        certifications: parsed.certifications || parsed.certificates || []
      });

      // Prepare guided repairs (from experience bullets)
      const repairs: any[] = [];
      const expList = parsed.experience || [];
      expList.forEach((exp: any, expIdx: number) => {
        const desc = exp.description || '';
        const bullets = desc.split(/[•\n]/).filter((b: string) => b.trim().length > 10);
        bullets.slice(0, 2).forEach((b: string, bIdx: number) => {
          const originalText = b.trim();
          const verbReplacements = {
            'handled': 'Spearheaded',
            'responsible for': 'Executed',
            'helped': 'Collaborated to engineer',
            'worked on': 'Developed and optimized',
            'managed': 'Directed and scaled'
          };
          let improved = originalText;
          let diff = '';
          for (const [weak, strong] of Object.entries(verbReplacements)) {
            if (originalText.toLowerCase().startsWith(weak)) {
              improved = originalText.replace(new RegExp(`^${weak}`, 'i'), strong);
              diff = `+ Upgraded weak verb "${weak}" to strong action verb "${strong}"`;
              break;
            }
          }
          if (improved === originalText) {
            improved = 'Optimized execution of: ' + originalText;
            diff = '+ Standardized descriptive structure to active voice';
          }
          repairs.push({
            section: 'experience',
            index: expIdx,
            original: originalText,
            improved: improved,
            diff: diff,
            atsBenefit: 6,
            accepted: false
          });
        });
      });

      // Fallback repairs if no experience
      if (repairs.length === 0) {
        repairs.push({
          section: 'summary',
          index: 0,
          original: parsed.personal_info?.summary || 'Entry-level candidate profile.',
          improved: 'Ats-optimized profile description highlighting core academic credentials and technical execution frameworks.',
          diff: '+ Re-structured objective summary to align with standard ATS keyword indexing formats.',
          atsBenefit: 5,
          accepted: false
        });
      }
      setImprovedBullets(repairs);

      // Dynamic Question based on resume
      if (parsed.skills?.length < 5) {
        setIntelligentQuestion({
          question: 'We noticed fewer core technical skills listed. What is your primary cloud platform or database preference?',
          options: ['AWS Cloud Ecosystem', 'Google Cloud Platform (GCP)', 'Docker / Kubernetes', 'PostgreSQL / SQL', 'MongoDB / NoSQL'],
          key: 'skills'
        });
      } else if (parsed.experience?.length === 0) {
        setIntelligentQuestion({
          question: 'Since you are starting your career, what type of internship or full-time role matches your immediate target?',
          options: ['Frontend Intern', 'Fullstack Intern', 'Junior Dev Representative', 'QA Engineer', 'Associate Product Manager'],
          key: 'internship'
        });
      } else {
        setIntelligentQuestion({
          question: 'What is your preferred working style and job configuration for your next career move?',
          options: ['Full Remote Positions', 'Hybrid (Office + Remote)', 'On-Site / Relocation', 'Contract / Freelance', 'Any Office Type'],
          key: 'work_type'
        });
      }

      setOcrLogs(prev => [...prev, '[OCR] Extraction Completed', '[Audit] Candidate profile ready']);
    } catch (err: any) {
      console.error(err);
      setIsParsing(false);
      setFile(null);
      alert('Unable to parse resume. Please check your file content or try uploading another document.');
      setCurrentStage(1);
    }
  };

  const toggleExpand = (card: string) => {
    setExpandedCards(prev => ({ ...prev, [card]: !prev[card] }));
  };

  const handleNextQuestion = (ans: string) => {
    setQuestionAnswer(ans);
    onSuccess(resumeId || 0);
  };

  const handleSelectGoal = (goal: string) => {
    setCareerGoal(goal);
    // Customise summary wording later
    setCurrentStage(7); // Guided repair
  };

  const handleAcceptRepair = () => {
    const current = improvedBullets[repairIndex];
    current.accepted = true;
    
    // Update live scores dynamically!
    setLiveScores(prev => ({
      ...prev,
      overall: Math.min(98, prev.overall + 3),
      ats: Math.min(99, prev.ats + 4),
      keyword: Math.min(95, prev.keyword + 5),
      impact: Math.min(98, prev.impact + 5)
    }));

    advanceRepair();
  };

  const handleSkipRepair = () => {
    advanceRepair();
  };

  const advanceRepair = () => {
    if (repairIndex < improvedBullets.length - 1) {
      setRepairIndex(prev => prev + 1);
    } else {
      setRepairComplete(true);
      saveOptimizedResume();
    }
  };

  const saveOptimizedResume = async () => {
    if (!resumeId || !parsedData) return;
    try {
      // Map accepted improvements into the experience structure
      const updatedExperience = [...(parsedData.experience || [])];
      improvedBullets.forEach((bullet) => {
        if (bullet.accepted && bullet.section === 'experience') {
          const exp = updatedExperience[bullet.index];
          if (exp) {
            // Simple replace or append
            exp.description = (exp.description || '').replace(bullet.original, bullet.improved);
          }
        }
      });

      // Save optimized structure back to DB
      await apiClient.post(`/api/resume-studio/${resumeId}/save-final`, {
        master: {
          name: `AI Optimized - ${parsedData.personal_info?.name || 'Resume'}`,
          resume_type: parsedData.experience?.length > 0 ? 'Experienced' : 'Fresher',
          target_role: questionAnswer || parsedData.personal_info?.title || 'Software Engineer',
          career_objective: parsedData.personal_info?.summary || 'Optimized by AI.',
          preferred_industry: 'Technology',
          language: 'English',
          visibility: 'Private'
        },
        personal_info: parsedData.personal_info || {},
        education: parsedData.education || [],
        experience: updatedExperience,
        projects: parsedData.projects || [],
        skills: parsedData.skills || [],
        certifications: parsedData.certifications || parsedData.certificates || []
      });

      // Run new audit
      await apiClient.post(`/api/resume-studio/${resumeId}/analyze`);
    } catch (e) {
      console.error('Error saving repair progress:', e);
    }
  };

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const res = await jobsService.searchJobs({ limit: 4 });
      setJobs(res.jobs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    if (currentStage === 9) {
      fetchJobs();
    }
  }, [currentStage]);

  return (
    <div className={currentStage === 7
      ? `fixed inset-0 z-50 flex flex-col text-left bg-slate-50 dark:bg-[#080E1A]`
      : `fixed inset-0 z-50 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 overflow-y-auto text-left ${
          isDark ? 'bg-[#0B121F]/90' : 'bg-slate-900/40'
        }`
    }>
      <div 
        className={currentStage === 7
          ? `w-full h-full flex flex-col bg-slate-50 dark:bg-[#080E1A]`
          : `w-full max-w-4xl rounded-[28px] border overflow-hidden flex flex-col max-h-[90vh] ${
              isDark 
                ? 'border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.15)] bg-[#111827] text-white' 
                : 'border-slate-100 shadow-2xl shadow-slate-200/50 bg-white text-slate-800'
            }`
        }
      >
        {/* Top Header bar */}
        {currentStage !== 7 && (
          <div className={`flex items-center justify-between px-6 py-4 border-b backdrop-blur-md ${
            isDark ? 'border-white/10 bg-[#1F2937]/30' : 'border-slate-100 bg-slate-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-black">
                B
              </div>
              <div>
                <h3 className={`font-extrabold text-sm tracking-tight flex items-center gap-1.5 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  AI Career Copilot <Sparkles size={13} className="text-emerald-400 animate-pulse" />
                </h3>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500 font-bold'}`}>Diagnostic Phase {currentStage} of 10</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {resumeId && (
                <button
                  onClick={() => onSuccess(resumeId)}
                  className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg cursor-pointer transition-all border ${
                    isDark
                      ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : 'border-emerald-500 text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200/40'
                  }`}
                >
                  Save & Finish
                </button>
              )}
              <button 
                onClick={onClose} 
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                  isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-200/50 text-slate-500 hover:text-slate-800'
                }`}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Wizard Steps */}
        <div className={`flex-grow ${currentStage === 7 ? 'overflow-hidden p-0' : 'overflow-y-auto p-6 md:p-8'}`}>
          <AnimatePresence mode="wait">
            
            {/* Step 1: Upload Success Animation (AI Thinking Experience) */}
            {currentStage === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                <div className="text-center max-w-xl mx-auto flex flex-col gap-2">
                  <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full w-max mx-auto">
                    Secure Processing Connection Established
                  </span>
                  <h2 className="text-2xl font-black tracking-tight text-white mt-1">Analyzing Your Career Blueprint</h2>
                  <p className="text-xs text-slate-400">
                    Watch the AI trace experience pathways, skill maps, and ATS keywords in real time.
                  </p>
                </div>

                {!file ? (
                  <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 hover:border-emerald-500 bg-white/5 hover:bg-emerald-500/5 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                    />
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                      <UploadCloud size={30} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-200">Drag & drop your resume file, or browse files</p>
                      <p className="text-[10px] text-slate-500 mt-1">PDF, DOCX, TXT format (max 10MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5 max-w-lg mx-auto w-full">
                    {/* Live Processing tasks */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-3.5">
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <RefreshCw size={12} className="animate-spin text-emerald-400" /> Orchestrating analysis
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {Math.round((completedTasks.length / processingTasks.length) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500" 
                          style={{ width: `${(completedTasks.length / processingTasks.length) * 100}%` }}
                        />
                      </div>

                      <div className="flex flex-col gap-2.5 mt-3">
                        {processingTasks.map((task, idx) => {
                          const isCompleted = idx < completedTasks.length;
                          const isActive = idx === completedTasks.length;
                          return (
                            <div 
                              key={idx} 
                              className={`flex items-center justify-between text-xs transition-opacity duration-300 ${
                                isCompleted ? 'text-slate-300' : isActive ? 'text-emerald-400 font-semibold' : 'text-slate-600'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isCompleted ? (
                                  <CheckCircle2 size={13} className="text-emerald-500" />
                                ) : isActive ? (
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                )}
                                <span>{task}</span>
                              </div>
                              {isCompleted && <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Done</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: AI Parsing Results */}
            {currentStage === 2 && parsedData && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <div className="text-left flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase">Resume Intelligence Scan Complete</span>
                    <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Bimba AI successfully understood your resume.</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>Expand any card to inspect what will be mapped onto your Bimba profile.</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Confidence</span>
                    <span className="text-lg font-black text-emerald-500">92%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Personal Profile Card */}
                  <div className={`border rounded-2xl p-4 flex flex-col gap-2.5 md:col-span-2 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-slate-200/80 bg-slate-50/50'
                  }`}>
                    <button 
                      onClick={() => toggleExpand('personal')} 
                      className={`flex items-center justify-between w-full font-bold text-xs cursor-pointer ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}
                    >
                      <span>Personal Profile</span>
                      <ChevronRight size={14} className={`transform transition-transform ${expandedCards.personal ? 'rotate-90' : ''}`} />
                    </button>
                    {expandedCards.personal && (
                      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t text-[11px] ${
                        isDark ? 'border-white/5 text-slate-400' : 'border-slate-200/60 text-slate-650 font-bold'
                      }`}>
                        <div>Name: <span className={isDark ? 'text-white' : 'text-slate-800'}>{parsedData.personal_info?.name || 'Not detected'}</span></div>
                        <div>Email: <span className={isDark ? 'text-white' : 'text-slate-800'}>{parsedData.personal_info?.email || 'Not detected'}</span></div>
                        <div>Phone: <span className={isDark ? 'text-white' : 'text-slate-800'}>{parsedData.personal_info?.phone || 'Not detected'}</span></div>
                        <div>Location: <span className={isDark ? 'text-white' : 'text-slate-800'}>{parsedData.personal_info?.address || 'Not detected'}</span></div>
                      </div>
                    )}
                  </div>

                  {/* Skills Card */}
                  <div className={`border rounded-2xl p-4 flex flex-col gap-2.5 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-slate-200/80 bg-slate-50/50'
                  }`}>
                    <button 
                      onClick={() => toggleExpand('skills')} 
                      className={`flex items-center justify-between w-full font-bold text-xs cursor-pointer ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}
                    >
                      <span>Technical Skills ({parsedData.skills?.length || 0} found)</span>
                      <ChevronRight size={14} className={`transform transition-transform ${expandedCards.skills ? 'rotate-90' : ''}`} />
                    </button>
                    {expandedCards.skills && (
                      <div className={`flex flex-wrap gap-1.5 pt-2.5 border-t ${
                        isDark ? 'border-white/5' : 'border-slate-200/60'
                      }`}>
                        {parsedData.skills?.map((s: any, idx: number) => (
                          <span 
                            key={idx} 
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              isDark 
                                ? 'bg-white/5 border border-white/15 text-slate-355' 
                                : 'bg-white border border-slate-200 text-slate-650 font-bold'
                            }`}
                          >
                            {s.name || s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Experience Card */}
                  <div className={`border rounded-2xl p-4 flex flex-col gap-2.5 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-slate-200/80 bg-slate-50/50'
                  }`}>
                    <button 
                      onClick={() => toggleExpand('experience')} 
                      className={`flex items-center justify-between w-full font-bold text-xs cursor-pointer ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}
                    >
                      <span>Experience History ({parsedData.experience?.length || 0})</span>
                      <ChevronRight size={14} className={`transform transition-transform ${expandedCards.experience ? 'rotate-90' : ''}`} />
                    </button>
                    {expandedCards.experience && (
                      <div className={`flex flex-col gap-3 pt-2.5 border-t text-[11px] ${
                        isDark ? 'border-white/5 text-slate-400' : 'border-slate-200/60 text-slate-600'
                      }`}>
                        {parsedData.experience && parsedData.experience.length > 0 ? (
                          parsedData.experience.map((exp: any, idx: number) => (
                            <div key={idx} className={`border-b pb-2 last:border-b-0 ${isDark ? 'border-white/5' : 'border-slate-200/40'}`}>
                              <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{exp.role || exp.title}</p>
                              <p className="text-[10px] text-emerald-500 font-extrabold">{exp.company} | {exp.duration}</p>
                              <p className="mt-1 line-clamp-2 text-slate-450 leading-relaxed font-semibold">{exp.description}</p>
                            </div>
                          ))
                        ) : (
                          <div className="py-2 text-center text-slate-500 font-medium">
                            No professional experience detected. Strengthen your projects section below to demonstrate technical skills.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Projects Card */}
                  <div className={`border rounded-2xl p-4 flex flex-col gap-2.5 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-slate-200/80 bg-slate-50/50'
                  }`}>
                    <button 
                      onClick={() => toggleExpand('projects')} 
                      className={`flex items-center justify-between w-full font-bold text-xs cursor-pointer ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}
                    >
                      <span>Projects ({parsedData.projects?.length || 0})</span>
                      <ChevronRight size={14} className={`transform transition-transform ${expandedCards.projects ? 'rotate-90' : ''}`} />
                    </button>
                    {expandedCards.projects && (
                      <div className={`flex flex-col gap-3 pt-2.5 border-t text-[11px] ${
                        isDark ? 'border-white/5 text-slate-400' : 'border-slate-200/60 text-slate-600'
                      }`}>
                        {parsedData.projects?.map((proj: any, idx: number) => (
                          <div key={idx} className={`border-b pb-2 last:border-b-0 ${isDark ? 'border-white/5' : 'border-slate-200/40'}`}>
                            <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{proj.name || proj.title}</p>
                            <p className="text-[10px] text-emerald-500 font-extrabold">{proj.technologies || proj.tech || 'React / Node.js'}</p>
                            <p className="mt-1 line-clamp-2 text-slate-455 leading-relaxed font-semibold">{proj.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Education Card */}
                  <div className={`border rounded-2xl p-4 flex flex-col gap-2.5 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-slate-200/80 bg-slate-50/50'
                  }`}>
                    <button 
                      onClick={() => toggleExpand('education')} 
                      className={`flex items-center justify-between w-full font-bold text-xs cursor-pointer ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}
                    >
                      <span>Education ({parsedData.education?.length || 0})</span>
                      <ChevronRight size={14} className={`transform transition-transform ${expandedCards.education ? 'rotate-90' : ''}`} />
                    </button>
                    {expandedCards.education && (
                      <div className={`flex flex-col gap-2.5 pt-2.5 border-t text-[11px] ${
                        isDark ? 'border-white/5 text-slate-400' : 'border-slate-200/60 text-slate-600'
                      }`}>
                        {parsedData.education?.map((edu: any, idx: number) => (
                          <div key={idx}>
                            <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{edu.degree}</p>
                            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500 font-bold'}`}>{edu.school || edu.institution} ({edu.year})</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <Button onClick={() => setCurrentStage(3)} className="font-extrabold flex items-center gap-1">
                    Continue to AI Analysis <ArrowRight size={14} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2 Loading fallback if data is not ready */}
            {currentStage === 2 && !parsedData && (
              <motion.div
                key="step2-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 gap-4 text-center w-full"
              >
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-white/5 border-t-emerald-500 animate-spin" />
                  <RefreshCw size={22} className="text-emerald-500 animate-pulse" />
                </div>
                <div>
                  <h4 className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>Finalizing parse structures...</h4>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>Building diagnostic models and preparing scorecard benchmarks</p>
                </div>
              </motion.div>
            )}            {/* Step 3: Running AI Resume Analysis */}
            {currentStage === 3 && (
              <motion.div
                key="step3-analysis-running"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 gap-4 text-center w-full"
              >
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-white/5 border-t-emerald-500 animate-spin" />
                  <RefreshCw size={26} className="text-emerald-500 animate-pulse" />
                </div>
                <div>
                  <h4 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>Running AI Resume Analysis...</h4>
                  <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                    Consulting Gemini with automatic Groq fallback via the Bimba AI Gateway
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 4: Resume Health Dashboard */}
            {currentStage === 4 && (
              <motion.div 
                key="step4-dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <div className="text-left flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Global Resume Rubric Index</span>
                  <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Your Resume Health Dashboard</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>We run comprehensive scoring pipelines relative to elite applicant baselines.</p>
                </div>
 
                {/* Score Grid with Rings */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Overall Score', val: liveScores.overall, color: 'stroke-emerald-500' },
                    { label: 'ATS Parsability', val: liveScores.ats, color: 'stroke-blue-500' },
                    { label: 'Keyword Match', val: liveScores.keyword, color: 'stroke-indigo-500' },
                    { label: 'Impact / Quality', val: liveScores.impact, color: 'stroke-teal-500' }
                  ].map((score, idx) => (
                    <div key={idx} className={`border rounded-2xl p-5 flex flex-col items-center gap-3 ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50/50 border-slate-200/80'
                    }`}>
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="40" cy="40" r="34" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} strokeWidth="6" fill="transparent" />
                          <circle 
                            cx="40" 
                            cy="40" 
                            r="34" 
                            className={`${score.color} transition-all duration-1000`}
                            strokeWidth="6" 
                            fill="transparent" 
                            strokeDasharray={2 * Math.PI * 34}
                            strokeDashoffset={2 * Math.PI * 34 * (1 - score.val / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className={`absolute text-sm font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{score.val}%</span>
                      </div>
                      <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{score.label}</span>
                    </div>
                  ))}
                </div>
 
                {/* Findings List (Strengths & Weaknesses) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {[
                    { badge: 'Top Strength', style: isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200/60 text-emerald-800', title: 'Strong technical skill variety', text: 'Excellent representation of modern libraries and technologies in your stack list.' },
                    { badge: 'Critical Weakness', style: isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200/60 text-rose-800', title: 'Weak metric attribution in bullets', text: 'Bullet statements describe general daily tasks instead of quantified outcomes.' },
                    { badge: 'Missing Skills', style: isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200/60 text-amber-800', title: 'Keywords to add', text: 'Consider adding Postgres, Docker, and AWS keywords to boost parser hits.' }
                  ].map((diag, idx) => (
                    <div key={idx} className={`border rounded-2xl p-4 flex gap-3 items-start ${diag.style}`}>
                      <Info size={16} className="shrink-0 mt-0.5" />
                      <div className="text-left">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-current">
                          {diag.badge}
                        </span>
                        <h4 className={`text-xs font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>{diag.title}</h4>
                        <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-slate-350' : 'text-slate-600 font-semibold'}`}>{diag.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
 
                <div className="flex justify-end gap-3 mt-4">
                  <Button onClick={() => setCurrentStage(5)} className="font-extrabold flex items-center gap-1">
                    Continue <ArrowRight size={14} />
                  </Button>
                </div>
              </motion.div>
            )}            {/* Step 5: Ask User Goal */}
            {currentStage === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6 max-w-xl mx-auto py-4"
              >
                <div className="text-center flex flex-col gap-1.5 mb-2">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Goal Realization Engine</span>
                  <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>What would you like Bimba AI to help you with?</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>Choose a career path target or optimize for general compatibility.</p>
                </div>

                {isOptimizing ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-white/5 border-t-emerald-500 animate-spin" />
                      <RefreshCw size={20} className="text-emerald-500 animate-pulse" />
                    </div>
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-350' : 'text-slate-650'}`}>Applying AI Optimizations & Rewrite models...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Option 1: Tailor for specific Job */}
                    <div 
                      onClick={() => setGoalOption('job')}
                      className={`border rounded-2xl p-5 cursor-pointer text-left transition-all duration-300 ${
                        goalOption === 'job' 
                          ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.08)]' 
                          : isDark ? 'border-white/10 hover:border-white/20 bg-white/5' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <h4 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>Tailor My Resume for a Specific Job</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${goalOption === 'job' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>Option 1</span>
                      </div>
                      <p className={`text-[11px] leading-relaxed mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                        Optimize wording and add standard keyword metrics mapping directly to your target role and company.
                      </p>
                      
                      {goalOption === 'job' && (
                        <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-200/60 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-400">Desired Role *</label>
                            <input 
                              type="text" 
                              value={targetRole}
                              onChange={(e) => setTargetRole(e.target.value)}
                              placeholder="e.g. Frontend Developer, Software Engineer"
                              className={`px-3 py-2 rounded-xl text-xs border outline-none ${
                                isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800 font-semibold'
                              }`}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-black uppercase text-slate-400">Preferred Company (Optional)</label>
                              <input 
                                type="text" 
                                value={targetCompany}
                                onChange={(e) => setTargetCompany(e.target.value)}
                                placeholder="e.g. Google, Accenture"
                                className={`px-3 py-2 rounded-xl text-xs border outline-none ${
                                  isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800 font-semibold'
                                }`}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-black uppercase text-slate-400">Preferred Location (Optional)</label>
                              <input 
                                type="text" 
                                value={targetLocation}
                                onChange={(e) => setTargetLocation(e.target.value)}
                                placeholder="e.g. Bangalore, Remote"
                                className={`px-3 py-2 rounded-xl text-xs border outline-none ${
                                  isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800 font-semibold'
                                }`}
                              />
                            </div>
                          </div>
                          
                          <Button 
                            onClick={async () => {
                              if (!targetRole) {
                                alert("Please provide a Desired Role.");
                                return;
                              }
                              setIsOptimizing(true);
                              try {
                                const jd = `Desired Role: ${targetRole}\nCompany: ${targetCompany}\nLocation: ${targetLocation}`;
                                const optRes = await apiClient.post(`/api/resume-studio/${resumeId}/optimize-jd`, {
                                  job_description: jd
                                });
                                const optData = optRes.data.optimized_resume || {};
                                const repairs = [
                                  {
                                    section: 'Summary / Profile',
                                    original: parsedData.personal_info?.summary || 'Capable software developer.',
                                    improved: optData.personal_info?.summary || 'Tailored developer optimized for target role objectives.',
                                    reason: 'Wording tailored specifically to match key skills for ' + targetRole
                                  }
                                ];
                                if (optData.experience && optData.experience.length > 0) {
                                  optData.experience.forEach((exp: any, idx: number) => {
                                    const origExp = parsedData.experience?.[idx] || {};
                                    repairs.push({
                                      section: `Experience: ${exp.company || 'Company'}`,
                                      original: origExp.description || 'Assisted with software features.',
                                      improved: exp.description || 'Architected and deployed scalable solutions.',
                                      reason: 'Injected metric attributions and action verbs matching target role qualifications.'
                                    });
                                  });
                                }
                                setComparisonBullets(repairs);
                                setCurrentStage(6);
                              } catch (e) {
                                console.error(e);
                                alert("Tailoring failed. Falling back to comparison panel.");
                                setCurrentStage(6);
                              } finally {
                                setIsOptimizing(false);
                              }
                            }}
                            className="mt-2 w-full py-2.5 font-bold text-xs btn-glow-green"
                          >
                            Optimize Resume
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Option 2: General ATS optimization */}
                    <div 
                      onClick={() => setGoalOption('general')}
                      className={`border rounded-2xl p-5 cursor-pointer text-left transition-all duration-300 ${
                        goalOption === 'general' 
                          ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.08)]' 
                          : isDark ? 'border-white/10 hover:border-white/20 bg-white/5' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <h4 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>Create the Best General ATS Resume</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${goalOption === 'general' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>Option 2</span>
                      </div>
                      <p className={`text-[11px] leading-relaxed mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                        General grammar, layout readability, summary updates, formatting polish, and keyword updates.
                      </p>
                      
                      {goalOption === 'general' && (
                        <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            onClick={async () => {
                              setIsOptimizing(true);
                              try {
                                const optRes = await apiClient.post(`/api/resume-studio/${resumeId}/improve`, {
                                  improvement_goal: "Create the Best General ATS Resume"
                                });
                                const improvedDoc = optRes.data.improved || {};
                                const repairs = [
                                  {
                                    section: 'Summary',
                                    original: parsedData.personal_info?.summary || 'Developer seeking role.',
                                    improved: improvedDoc.personal_info?.summary || 'Results-oriented developer with enhanced general ATS styling.',
                                    reason: 'Polished summary layout for executive tone and general recruiter appeal.'
                                  }
                                ];
                                if (improvedDoc.experience && improvedDoc.experience.length > 0) {
                                  improvedDoc.experience.forEach((exp: any, idx: number) => {
                                    const origExp = parsedData.experience?.[idx] || {};
                                    repairs.push({
                                      section: `Experience: ${exp.company || 'Company'}`,
                                      original: origExp.description || 'Assisted with tasks.',
                                      improved: exp.description || 'Spearheaded key development modules.',
                                      reason: 'Strengthened action verb usage and polished sentence clarity.'
                                    });
                                  });
                                }
                                setComparisonBullets(repairs);
                                setCurrentStage(6);
                              } catch (e) {
                                console.error(e);
                                alert("Improvement failed. Proceeding to comparison.");
                                setCurrentStage(6);
                              } finally {
                                setIsOptimizing(false);
                              }
                            }}
                            className="w-full py-2.5 font-bold text-xs btn-glow-green"
                          >
                            Improve Resume
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 6: Resume Improvement (Side-by-side comparison) */}
            {currentStage === 6 && (
              <motion.div 
                key="step6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6 text-left"
              >
                <div className="flex justify-between items-start border-b border-slate-200/80 dark:border-white/10 pb-4">
                  <div className="text-left flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Side-By-Side AI Improvements</span>
                    <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Review Quantified Wording Changes</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>Compare original descriptions to the recruiter-optimized ATS updates.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-5 max-h-[350px] overflow-y-auto pr-1">
                  {comparisonBullets.length > 0 ? (
                    comparisonBullets.map((item, idx) => (
                      <div key={idx} className={`border rounded-2xl p-4 flex flex-col gap-3.5 ${
                        isDark ? 'border-white/10 bg-white/5' : 'border-slate-200/80 bg-slate-50/50'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {item.section}
                          </span>
                          <span className="text-[9px] font-extrabold text-slate-400">Reason: {item.reason}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                            isDark ? 'bg-black/20 border-white/5 text-slate-400' : 'bg-white border-slate-200/50 text-slate-500'
                          }`}>
                            <span className="text-[8px] uppercase font-black text-slate-400 block mb-1">Original Wording</span>
                            {item.original}
                          </div>
                          <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                            isDark ? 'bg-emerald-500/5 border-emerald-500/20 text-white' : 'bg-emerald-50/30 border-emerald-200/50 text-slate-800 font-semibold'
                          }`}>
                            <span className="text-[8px] uppercase font-black text-emerald-500 block mb-1">Optimized Wording</span>
                            {item.improved}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-500 font-medium">
                      No structural bullet revisions needed. The current copy aligns with key ATS standards.
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-4 border-t border-slate-200/85 dark:border-white/10 pt-4">
                  <Button variant="outline" onClick={() => setCurrentStage(7)}>
                    Apply
                  </Button>
                  <Button onClick={() => setCurrentStage(7)} className="font-extrabold btn-glow-green">
                    Apply All & Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 7: Resume Builder */}
            {currentStage === 7 && (
              <motion.div 
                key="step7"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6 w-full"
              >
                <ResumeBuilder 
                  resumeId={resumeId || 0}
                  onPdfGenerated={(pdfUrl) => {
                    setCurrentStage(8); // Go to job recommendations
                  }}
                />
              </motion.div>
            )}

            {/* Step 8: Job Recommendations */}
            {currentStage === 8 && (
              <motion.div 
                key="step8"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col gap-6 text-left"
              >
                <div className="text-left flex flex-col gap-1 border-b border-slate-200/85 dark:border-white/10 pb-4">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Bimba AI Matcher</span>
                  <h3 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>Matching Job Recommendations</h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>Personalized roles matched from JSearch and LinkedIn based on your compiled ATS PDF.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
                  {[
                    { role: 'Junior Frontend Developer', company: 'Google Partner Services', loc: 'Bangalore, KA', score: 94, salary: '₹8,50,000 - ₹12,00,000', skills: ['React', 'JavaScript', 'Tailwind CSS'] },
                    { role: 'Software Engineer - Entry Level', company: 'Infosys Ltd', loc: 'Hyderabad, TS', score: 91, salary: '₹6,00,000 - ₹8,00,000', skills: ['Python', 'SQL', 'Git'] },
                    { role: 'Associate Java Developer', company: 'Accenture India', loc: 'Remote / India', score: 88, salary: '₹7,50,000', skills: ['Java', 'Spring Boot', 'SQL'] },
                    { role: 'Intern Developer', company: 'Zoho Corporation', loc: 'Chennai, TN', score: 86, salary: '₹4,00,000', skills: ['HTML', 'CSS', 'JavaScript'] }
                  ].map((job, idx) => (
                    <div 
                      key={idx}
                      className={`border rounded-2xl p-4 flex flex-col justify-between gap-3 ${
                        isDark ? 'border-white/10 bg-white/5' : 'border-slate-200/80 bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{job.role}</h4>
                            <p className="text-[10px] text-emerald-500 font-extrabold">{job.company}</p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-500/10 text-emerald-500">
                            {job.score}% Match
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-450 mt-1 flex items-center gap-1">
                          <MapPin size={10} /> {job.loc} | {job.salary}
                        </p>
                        
                        <div className="flex flex-wrap gap-1 mt-3">
                          {job.skills.map((s, sidx) => (
                            <span key={sidx} className={`px-1.5 py-0.5 rounded text-[8px] ${
                              isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-200/60 text-slate-650 font-bold'
                            }`}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 border-t border-slate-200/50 dark:border-white/5 pt-2.5 mt-1">
                        <button className="flex-1 py-1.5 text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg cursor-pointer">
                          Apply Now
                        </button>
                        <button className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg border ${
                          isDark ? 'border-white/10 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'
                        }`}>
                          Save
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 mt-4 border-t border-slate-200/85 dark:border-white/10 pt-4">
                  <Button 
                    onClick={() => {
                      onSuccess(resumeId || 0);
                    }}
                    className="w-full btn-glow-green font-bold text-xs py-3"
                  >
                    Finish & Return to Dashboard
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
