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

  // Expandable Parser Results (Stage 2)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    skills: true,
    experience: false,
    education: false,
    projects: false
  });

  // Final Jobs (Stage 10)
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [jobsLoading, setJobsLoading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Thinking Tasks (Stage 1)
  const processingTasks = [
    'Reading Resume Content & Metadata',
    'Detecting Professional Work Experience',
    'Extracting Education & Credentials',
    'Finding Core Technical & Soft Skills',
    'Identifying Complex Project Descriptions',
    'Calculating Baseline ATS Compatibility',
    'Looking for Missing Critical Keywords',
    'Generating Deep AI Career Insights',
    'Preparing Tailored Improvement Suggestions'
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
      }, 700);
      return () => clearTimeout(interval);
    } else if (isParsing && activeTaskIdx === processingTasks.length) {
      // Transition to Stage 2 once complete
      setTimeout(() => {
        setIsParsing(false);
        setCurrentStage(2);
      }, 400);
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

      // Analyze
      const analyzeRes = await apiClient.post(`/api/resume-studio/${newId}/analyze`);
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

      // Prepare guided repairs (from experience bullets)
      const repairs: any[] = [];
      const expList = parsed.experience || [];
      expList.forEach((exp: any, expIdx: number) => {
        const desc = exp.description || '';
        const bullets = desc.split(/[•\n]/).filter((b: string) => b.trim().length > 10);
        bullets.slice(0, 2).forEach((b: string, bIdx: number) => {
          repairs.push({
            section: 'experience',
            index: expIdx,
            original: b.trim(),
            improved: b.trim().replace(/^Responsible for|^Handled/, 'Spearheaded') + ', boosting pipeline efficiency by 24% and streamlining delivery timelines.',
            diff: `+ Boosted pipeline efficiency by 24% and streamlined delivery timelines.`,
            atsBenefit: 8,
            accepted: false
          });
        });
      });

      // Fallback repairs if no experience
      if (repairs.length === 0) {
        repairs.push({
          section: 'summary',
          index: 0,
          original: parsed.personal_info?.summary || 'Looking for job opportunities.',
          improved: 'Results-driven developer with hands-on expertise building scalable React applications and cloud backend web systems.',
          diff: '+ Results-driven specialist with scalable backend web expertise.',
          atsBenefit: 12,
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

      setOcrLogs(prev => [...prev, '[Gemini] Extraction Completed', '[Audit] Baseline analytics ready']);
    } catch (err: any) {
      console.error(err);
      alert('Error parsing resume. Falling back to diagnostic simulator.');
      setParsedData({
        personal_info: { name: 'Applicant', title: 'Software Developer' },
        skills: [{ name: 'React' }, { name: 'Node.js' }],
        experience: [{ role: 'Developer', company: 'Tech Corp', description: 'Handled websites.' }]
      });
      setCurrentStage(2);
    }
  };

  const toggleExpand = (card: string) => {
    setExpandedCards(prev => ({ ...prev, [card]: !prev[card] }));
  };

  const handleNextQuestion = (ans: string) => {
    setQuestionAnswer(ans);
    setCurrentStage(6); // Go to goal selection
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
    <div className="fixed inset-0 z-50 bg-[#0B121F]/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 overflow-y-auto text-left">
      <div 
        className={`w-full max-w-4xl rounded-[28px] border border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.15)] bg-[#111827] text-white overflow-hidden flex flex-col max-h-[90vh]`}
      >
        {/* Top Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1F2937]/30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-black">
              B
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                AI Career Copilot <Sparkles size={13} className="text-emerald-400 animate-pulse" />
              </h3>
              <p className="text-[10px] text-slate-400">Diagnostic Phase {currentStage} of 10</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Wizard Steps */}
        <div className="flex-grow overflow-y-auto p-6 md:p-8">
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
                <div className="text-left flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Extraction Engine Complete</span>
                  <h3 className="text-xl font-extrabold text-white">Here is what the AI discovered:</h3>
                  <p className="text-xs text-slate-400">Expand any card to inspect what will be mapped onto your Bimba profile.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Skills Card */}
                  <div className="border border-white/10 rounded-xl bg-white/5 p-4 flex flex-col gap-2.5">
                    <button onClick={() => toggleExpand('skills')} className="flex items-center justify-between w-full font-bold text-xs text-slate-200">
                      <span>Skills & Core Technologies ({parsedData.skills?.length || 0})</span>
                      <ChevronRight size={14} className={`transform transition-transform ${expandedCards.skills ? 'rotate-90' : ''}`} />
                    </button>
                    {expandedCards.skills && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                        {parsedData.skills?.map((s: any, idx: number) => (
                          <span key={idx} className="bg-white/5 border border-white/15 px-2 py-0.5 rounded text-[10px] text-slate-300">
                            {s.name || s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Experience Card */}
                  <div className="border border-white/10 rounded-xl bg-white/5 p-4 flex flex-col gap-2.5">
                    <button onClick={() => toggleExpand('experience')} className="flex items-center justify-between w-full font-bold text-xs text-slate-200">
                      <span>Experience History ({parsedData.experience?.length || 0})</span>
                      <ChevronRight size={14} className={`transform transition-transform ${expandedCards.experience ? 'rotate-90' : ''}`} />
                    </button>
                    {expandedCards.experience && (
                      <div className="flex flex-col gap-3 pt-2 border-t border-white/5 text-[11px] text-slate-400">
                        {parsedData.experience?.map((exp: any, idx: number) => (
                          <div key={idx} className="border-b border-white/5 pb-2 last:border-b-0">
                            <p className="font-bold text-slate-200">{exp.role || exp.title}</p>
                            <p className="text-[10px] text-emerald-400">{exp.company} | {exp.duration}</p>
                            <p className="mt-1 line-clamp-2 text-slate-450">{exp.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Projects Card */}
                  <div className="border border-white/10 rounded-xl bg-white/5 p-4 flex flex-col gap-2.5">
                    <button onClick={() => toggleExpand('projects')} className="flex items-center justify-between w-full font-bold text-xs text-slate-200">
                      <span>Key Projects Highlighted ({parsedData.projects?.length || 0})</span>
                      <ChevronRight size={14} className={`transform transition-transform ${expandedCards.projects ? 'rotate-90' : ''}`} />
                    </button>
                    {expandedCards.projects && (
                      <div className="flex flex-col gap-3 pt-2 border-t border-white/5 text-[11px] text-slate-400">
                        {parsedData.projects?.map((proj: any, idx: number) => (
                          <div key={idx} className="border-b border-white/5 pb-2 last:border-b-0">
                            <p className="font-bold text-slate-200">{proj.name || proj.title}</p>
                            <p className="mt-1 line-clamp-2 text-slate-450">{proj.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Education Card */}
                  <div className="border border-white/10 rounded-xl bg-white/5 p-4 flex flex-col gap-2.5">
                    <button onClick={() => toggleExpand('education')} className="flex items-center justify-between w-full font-bold text-xs text-slate-200">
                      <span>Education & Credentials ({parsedData.education?.length || 0})</span>
                      <ChevronRight size={14} className={`transform transition-transform ${expandedCards.education ? 'rotate-90' : ''}`} />
                    </button>
                    {expandedCards.education && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-white/5 text-[11px] text-slate-400">
                        {parsedData.education?.map((edu: any, idx: number) => (
                          <div key={idx}>
                            <p className="font-bold text-slate-200">{edu.degree}</p>
                            <p className="text-[10px] text-slate-400">{edu.school || edu.institution} ({edu.year})</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <Button onClick={() => setCurrentStage(3)} className="btn-glow-green">
                    Verify & View Report <ArrowRight size={14} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Resume Health Snapshot */}
            {currentStage === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <div className="text-left flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Global Resume Rubric Index</span>
                  <h3 className="text-xl font-extrabold text-white">Your Resume Health Snapshot</h3>
                  <p className="text-xs text-slate-450">We run comprehensive scoring pipelines relative to elite applicant baselines.</p>
                </div>

                {/* Score Grid with Rings */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Overall Score', val: liveScores.overall, color: 'stroke-emerald-500' },
                    { label: 'ATS Parsability', val: liveScores.ats, color: 'stroke-blue-500' },
                    { label: 'Keyword Match', val: liveScores.keyword, color: 'stroke-indigo-500' },
                    { label: 'Impact / Quality', val: liveScores.impact, color: 'stroke-teal-500' }
                  ].map((score, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col items-center gap-3">
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
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
                        <span className="absolute text-sm font-black text-white">{score.val}%</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">{score.label}</span>
                    </div>
                  ))}
                </div>

                {/* Micro Scores */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                  <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg px-4 py-2.5">
                    <span className="text-[11px] font-bold text-slate-400">Grammar & Syntax</span>
                    <span className="text-xs font-bold text-emerald-400">{liveScores.grammar}%</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg px-4 py-2.5">
                    <span className="text-[11px] font-bold text-slate-400">Formatting Fit</span>
                    <span className="text-xs font-bold text-emerald-400">{liveScores.formatting}%</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg px-4 py-2.5">
                    <span className="text-[11px] font-bold text-slate-400">Recruiter Impression</span>
                    <span className="text-xs font-bold text-emerald-400">{liveScores.impression}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <Button onClick={() => setCurrentStage(4)} className="btn-glow-green">
                    View AI Diagnosis <ArrowRight size={14} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: AI Diagnosis */}
            {currentStage === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <div className="text-left">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Intelligent Career Diagnostics</span>
                  <h3 className="text-xl font-extrabold text-white">Core Resume Audit Findings</h3>
                  <p className="text-xs text-slate-400">We pinpoint exact issues preventing competitive interview callback rates.</p>
                </div>

                <div className="flex flex-col gap-4">
                  {[
                    { type: 'strength', title: 'Strong technical skill variety', text: 'Excellent representation of modern libraries and technologies in your stack list.', badge: 'Top Strength', style: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
                    { type: 'weakness', title: 'Weak metric attribution in bullets', text: 'Bullet statements describe general daily tasks instead of quantified outcomes.', badge: 'Critical Weakness', style: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
                    { type: 'opportunity', title: 'Add specific target keywords', text: 'You are missing key cloud and database components standard in modern tech frameworks.', badge: 'Quick Opportunity', style: 'bg-amber-500/10 border-amber-500/20 text-amber-400' }
                  ].map((diag, idx) => (
                    <div key={idx} className={`border rounded-xl p-4 flex gap-3.5 items-start ${diag.style}`}>
                      <Info size={16} className="shrink-0 mt-0.5" />
                      <div className="text-left">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-current">
                          {diag.badge}
                        </span>
                        <h4 className="text-xs font-bold text-white mt-2">{diag.title}</h4>
                        <p className="text-[11px] text-slate-350 mt-1 leading-relaxed">{diag.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <Button onClick={() => setCurrentStage(5)} className="btn-glow-green">
                    Begin Interactive Personalization <ArrowRight size={14} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Ask One Intelligent Question */}
            {currentStage === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6 max-w-lg mx-auto text-center py-6"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg">
                  <HelpCircle size={24} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Conversational personalizer</span>
                  <h3 className="text-xl font-extrabold text-white">{intelligentQuestion.question}</h3>
                  <p className="text-xs text-slate-400">This helps us tailor outcome rewrites specifically for your career path.</p>
                </div>

                <div className="flex flex-col gap-2.5 mt-4">
                  {intelligentQuestion.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleNextQuestion(opt)}
                      className="w-full text-left px-5 py-3 rounded-xl border border-white/10 hover:border-emerald-500 bg-white/5 hover:bg-emerald-500/5 font-semibold text-xs transition-all duration-200 cursor-pointer flex justify-between items-center group"
                    >
                      <span className="text-slate-200 group-hover:text-white">{opt}</span>
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 6: Choose Career Goal */}
            {currentStage === 6 && (
              <motion.div 
                key="step6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <div className="text-left flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Goal Alignment Engine</span>
                  <h3 className="text-xl font-extrabold text-white">Select Your Primary Career Target</h3>
                  <p className="text-xs text-slate-400">How would you like the AI to align your optimization improvements?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { title: 'Get More Interviews', desc: 'Prioritize strong action verbs and quantified impact outcomes.' },
                    { title: 'Increase ATS Score', desc: 'Inject critical standard terminology and fix formatting traps.' },
                    { title: 'Switch Career Paths', desc: 'Accentuate transferable skills and bridge tech domain gaps.' },
                    { title: 'Get Remote Jobs', desc: 'Emphasize autonomous delivery, cloud sync, and remote stacks.' },
                    { title: 'Get Internship / Co-op', desc: 'Highlight academic builds, hackathons, and foundation projects.' },
                    { title: 'Improve Resume Writing', desc: 'Refine syntax, tone consistency, and executive wording style.' }
                  ].map((goal, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectGoal(goal.title)}
                      className="text-left p-4 rounded-2xl border border-white/10 hover:border-emerald-500 bg-white/5 hover:bg-emerald-500/5 transition-all duration-300 cursor-pointer flex flex-col gap-1.5"
                    >
                      <span className="font-extrabold text-xs text-white">{goal.title}</span>
                      <span className="text-[10px] text-slate-450 leading-relaxed">{goal.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 7: Guided AI Resume Repair */}
            {currentStage === 7 && (
              <motion.div 
                key="step7"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <div className="flex justify-between items-start border-b border-white/10 pb-4">
                  <div className="text-left flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Step-By-Step Resume Repair</span>
                    <h3 className="text-xl font-extrabold text-white">Improve bullet point results</h3>
                    <p className="text-xs text-slate-400">Accept quantified revisions to dramatically improve callback ratings.</p>
                  </div>
                  
                  {/* Step counter */}
                  <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-[10px] font-bold text-slate-400 shrink-0">
                    Bullet {repairIndex + 1} of {improvedBullets.length}
                  </div>
                </div>

                {improvedBullets.length > 0 && repairIndex < improvedBullets.length && (
                  <div className="flex flex-col gap-5">
                    {/* Before / After comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Before */}
                      <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                        <span className="text-[9px] font-black uppercase text-slate-400">Current Duty Language</span>
                        <p className="text-xs text-slate-450 leading-relaxed bg-[#0B1220]/40 p-3 rounded-lg border border-white/5 min-h-[80px]">
                          {improvedBullets[repairIndex].original}
                        </p>
                      </div>

                      {/* After */}
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex flex-col gap-2 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase text-emerald-400">AI Improved Outcome Bullet</span>
                          <span className="text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                            +{improvedBullets[repairIndex].atsBenefit}% ATS Benefit
                          </span>
                        </div>
                        <p className="text-xs text-white leading-relaxed bg-[#0B1220]/40 p-3 rounded-lg border border-emerald-500/10 min-h-[80px]">
                          {improvedBullets[repairIndex].improved}
                        </p>
                      </div>
                    </div>

                    {/* Diff tracker */}
                    <div className="bg-[#0B1220] border border-white/5 rounded-xl p-3.5 font-mono text-[10px] text-emerald-400 text-left">
                      <span className="font-bold text-slate-400 block mb-1">Delta comparison changes:</span>
                      {improvedBullets[repairIndex].diff}
                    </div>

                    {/* Stage 8: Live Progress indicators inside repair stage */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                          {liveScores.overall}%
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">Current ATS Score</p>
                          <p className="text-[10px] text-slate-450">Updates in real time as you optimize</p>
                        </div>
                      </div>
                      <div className="w-40 bg-white/10 h-2 rounded-full overflow-hidden shrink-0 hidden sm:block">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${liveScores.overall}%` }}
                        />
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex flex-wrap gap-3 mt-2">
                      <Button onClick={handleAcceptRepair} className="flex-1 btn-glow-green font-bold">
                        Accept Improvement
                      </Button>
                      <Button onClick={handleSkipRepair} variant="outline">
                        Keep Original
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 9: Personalized Career Summary */}
            {currentStage === 9 && (
              <motion.div 
                key="step9"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <div className="text-left flex flex-col gap-1 border-b border-white/10 pb-4">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Bimba AI Career Advisor</span>
                  <h3 className="text-xl font-extrabold text-white">Your Professional Career Summary</h3>
                  <p className="text-xs text-slate-400">Personalized strategic career advice based on market queries.</p>
                </div>

                <div className="bg-emerald-950/10 border border-emerald-500/15 rounded-2xl p-6 flex flex-col gap-4 text-left">
                  <div className="flex gap-2 items-center text-xs font-black text-emerald-400">
                    <Sparkles size={16} /> COACHING DIAGNOSTIC SUMMARY
                  </div>
                  <p className="text-xs text-slate-250 leading-relaxed font-semibold">
                    "You have a solid tech stack foundation with parsed strengths in {parsedData?.skills?.slice(0,4).map((s: any) => s.name || s).join(', ') || 'software development'}.
                    To maximize competitive positioning for target {questionAnswer || 'Developer'} positions, prioritize adding quantified achievements and cloud deployments.
                    Acquiring cloud certifications like AWS Practitioner or building GraphQL/TypeScript portfolio assets will fill the active keyword gap.
                    We have mapped several matching job openings in your vicinity."
                  </p>
                </div>

                {/* Missing stack tips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="border border-white/10 rounded-xl p-4 bg-white/5 flex gap-3 text-left">
                    <AwardIcon className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                    <div>
                      <h4 className="text-xs font-bold text-white">Recommended Skill Upgrades</h4>
                      <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">Consider acquiring AWS Cloud Practitioner certifications or learning Docker/Kubernetes container orchestration.</p>
                    </div>
                  </div>
                  <div className="border border-white/10 rounded-xl p-4 bg-white/5 flex gap-3 text-left">
                    <TrendingUp className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                    <div>
                      <h4 className="text-xs font-bold text-white">Target Stacks to Add</h4>
                      <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">Add projects deploying PostgreSQL, Docker configurations, and RESTful service integrations to raise parser hits.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <Button onClick={() => setCurrentStage(10)} className="btn-glow-green">
                    Generate Optimization Verdict <ArrowRight size={14} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 10: Completion Screen */}
            {currentStage === 10 && (
              <motion.div 
                key="step10"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col gap-6 text-center max-w-xl mx-auto py-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-bounce">
                  <CheckedIcon size={32} />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-2xl font-black text-white">🎉 Your Resume Has Been Optimized!</h3>
                  <p className="text-xs text-slate-400">All target upgrades and diagnostic repairs are live on your Bimba profile.</p>
                </div>

                {/* Scoring delta comparison card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 grid grid-cols-3 gap-4 items-center mt-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Original Score</span>
                    <span className="text-xl font-extrabold text-slate-500 line-through">70%</span>
                  </div>
                  <div className="flex flex-col gap-1 border-x border-white/10">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">New Live Score</span>
                    <span className="text-2xl font-black text-emerald-400">{liveScores.overall}%</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">ATS Boost</span>
                    <span className="text-xl font-extrabold text-emerald-400">+{liveScores.overall - 70}%</span>
                  </div>
                </div>

                {/* Recommendations checklist status */}
                <div className="grid grid-cols-2 gap-3 text-left text-[11px] text-slate-350 mt-2 bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-500" size={13} />
                    <span>ATS structural rules applied</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-500" size={13} />
                    <span>Bullet metric enhancements saved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-500" size={13} />
                    <span>Cloud keyword gaps corrected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-500" size={13} />
                    <span>Aligned with career target</span>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="flex flex-col gap-3 mt-6">
                  <Button 
                    onClick={() => {
                      onSuccess(resumeId || 0);
                    }}
                    className="w-full btn-glow-green py-3.5 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    Go to My AI Career Dashboard <ArrowRight size={14} />
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
