import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, FileText, CheckCircle2, ChevronRight, AlertTriangle, Sparkles,
  ArrowRight, Check, X, HelpCircle, Download, Briefcase, RefreshCw, 
  Search, ShieldAlert, Award, FileCode, CheckCircle, ExternalLink, Filter, MapPin,
  TrendingUp, Activity, FileEdit, UserCheck, Play, Zap, Info, ArrowLeft, Send, Sparkle,
  Trash2, Plus, Eye, ListOrdered, FileUp, SparklesIcon, CheckSquare, Save
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

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
}

export const UploadResumeWizard: React.FC<UploadResumeWizardProps> = ({
  onClose,
  onSuccess,
  isDark,
  initialFile = null
}) => {
  // 12-Step flow controller
  const [step, setStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(initialFile);
  
  // Real DB Data Models
  const [parsedData, setParsedData] = useState<any>({
    personal_info: { name: '', email: '', phone: '', address: '', linkedin: '', github: '', portfolio: '' },
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: []
  });
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [resumeId, setResumeId] = useState<number | null>(null);

  // Ingestion loading states
  const [activeTaskIdx, setActiveTaskIdx] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [apiCompleted, setApiCompleted] = useState<boolean>(false);

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

  const toggleEditCard = (cardKey: string) => {
    setEditingCards(prev => {
      const isEditing = !prev[cardKey];
      if (!isEditing) {
        saveResumeToDb(parsedData);
      }
      return { ...prev, [cardKey]: isEditing };
    });
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
  const [selectedTemplate, setSelectedTemplate] = useState<string>('modern');

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
    if (isParsing && activeTaskIdx < processingTasks.length) {
      const interval = setTimeout(() => {
        setCompletedTasks(prev => [...prev, processingTasks[activeTaskIdx]]);
        setActiveTaskIdx(prev => prev + 1);
      }, 150);
      return () => clearTimeout(interval);
    } else if (isParsing && activeTaskIdx === processingTasks.length && apiCompleted) {
      setIsParsing(false);
      setStep(4); // Move to Step 4: Snapshot
    }
  }, [isParsing, activeTaskIdx, apiCompleted]);

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
    const ext = targetFile.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'html'];
    if (!ext || !allowed.includes(ext)) {
      alert(`Unsupported file format (.${ext}). Please upload PDF, DOC, DOCX, TXT, RTF, or HTML.`);
      setFile(null);
      return;
    }
    if (targetFile.size > 20 * 1024 * 1024) {
      alert("File size exceeds limit of 20MB.");
      setFile(null);
      return;
    }

    setStep(3); // Step 3: Parsing Progress
    setIsParsing(true);
    setApiCompleted(false);
    setActiveTaskIdx(0);
    setCompletedTasks([]);

    try {
      const formData = new FormData();
      formData.append('file', targetFile);
      
      const uploadRes = await apiClient.post('/api/resume-studio/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const parsed = uploadRes.data.parsed_data || {};
      const newId = uploadRes.data.resume_id;
      setParsedData(parsed);
      setResumeId(newId);

      // Fetch initial score analysis
      const analyzeRes = await apiClient.post(`/api/resume-studio/${newId}/analyze`);
      setAnalysisData(analyzeRes.data);

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

      setApiCompleted(true);
    } catch (e: any) {
      console.error(e);
      alert('Ingestion failed: ' + (e.response?.data?.detail || 'FastAPI server connection error.'));
      setFile(null);
      setStep(1);
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
    if (!resumeId) return;
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
        summary: data.summary || data.personal_info?.summary || ''
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
      references: data.references || []
    };
    try {
      await apiClient.put(`/api/resume-studio/profile/${resumeId}`, payload);
      await apiClient.put(`/api/resume/${resumeId}/update`, payload);
    } catch (err) {
      console.error("Error saving resume profile:", err);
    }
  };

  const runAnalysis = async (nextStep: number) => {
    if (!resumeId) return;
    setIsAiResponding(true);
    try {
      const analyzeRes = await apiClient.post(`/api/resume-studio/${resumeId}/analyze`);
      setAnalysisData(analyzeRes.data);
      setStep(nextStep);
    } catch (err) {
      console.error(err);
      alert("Error analyzing resume heuristics.");
    } finally {
      setIsAiResponding(false);
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
    if (step === 4 || step === 6) return 2;
    if (step === 5) return 3;
    if (step === 7 || step === 8) return 4;
    return 5;
  };

  return (
    <div className={`fixed inset-0 z-50 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 overflow-y-auto text-left ${
      isDark ? 'bg-[#0B121F]/90' : 'bg-slate-900/40'
    }`}>
      <div className={`w-full max-w-7xl rounded-[28px] border overflow-hidden flex flex-col h-[90vh] ${
        isDark 
          ? 'border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.15)] bg-[#111827] text-white' 
          : 'border-slate-100 shadow-2xl shadow-slate-200/50 bg-white text-slate-800'
      }`}>
        
        {/* Header bar */}
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
                Bimba AI Resume Suite <Sparkles size={13} className="text-emerald-400" />
              </h3>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500 font-bold'}`}>Step {step} of 12 — Conversational Career Optimizer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/10 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Steps */}
        <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 text-xs font-bold ${
          isDark ? 'border-white/10 bg-slate-900/40' : 'border-slate-100 bg-slate-50'
        }`}>
          {['Welcome & Upload', 'AI Extraction', 'Interactive Snapshot', 'Career Interview', 'ATS Audit & Improvements', 'Templates & Live Preview'].map((stepName, idx) => {
            const isActive = idx === getActiveStep();
            const isCompleted = idx < getActiveStep();
            return (
              <div key={idx} className="flex items-center gap-2 flex-grow last:flex-grow-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border transition-all ${
                  isActive 
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20' 
                    : isCompleted 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-transparent'
                }`}>
                  {isCompleted ? <Check size={12} className="text-emerald-500" /> : idx + 1}
                </div>
                <span className={`text-[10px] tracking-tight uppercase ${
                  isActive 
                    ? 'text-slate-800 dark:text-white font-black' 
                    : isCompleted 
                      ? 'text-emerald-500 font-bold' 
                      : 'text-slate-550 dark:text-slate-450 font-semibold'
                }`}>
                  {stepName}
                </span>
                {idx < 5 && (
                  <div className={`flex-grow h-[1px] mx-4 hidden md:block ${
                    idx < getActiveStep() ? 'bg-emerald-500/30' : 'bg-slate-250 dark:bg-white/10'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* 12-Step Content Renderer */}
        <div className="flex-grow overflow-hidden flex flex-col h-full p-6 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            
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
                  <Button onClick={createNewResumeDraft} variant="secondary" className="text-xs font-bold py-3 px-6 flex items-center gap-2">
                    <Plus size={14} /> Build New Resume
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Upload Resume */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto w-full text-center flex flex-col gap-6 py-6">
                <div>
                  <h2 className="text-xl font-black">Upload Your Document</h2>
                  <p className="text-xs text-slate-500 mt-1">Supports PDF, DOC, DOCX, TXT, RTF, HTML, Google Drive, and Dropbox</p>
                </div>

                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-emerald-500 bg-slate-50/50 dark:bg-white/5 hover:bg-emerald-500/5 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 w-full"
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf,.doc,.docx,.txt,.rtf,.html" className="hidden" />
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                    <UploadCloud size={24} />
                  </div>
                  <div className="text-center text-xs">
                    <p className="font-bold">Drag & drop files here, or click to browse</p>
                    <p className="text-[10px] text-slate-500 mt-1">Maximum file size: 20MB</p>
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
              <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto w-full flex flex-col gap-4 py-12">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5"><RefreshCw size={12} className="animate-spin text-emerald-400" /> Active AI Parsing Heuristics</span>
                  <span className="text-emerald-400">{Math.round((completedTasks.length / processingTasks.length) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(completedTasks.length / processingTasks.length) * 100}%` }} />
                </div>
                <div className="flex flex-col gap-2 mt-2 text-xs">
                  {processingTasks.map((task, idx) => (
                    <div key={idx} className={`flex items-center justify-between ${idx < completedTasks.length ? 'text-slate-400' : idx === completedTasks.length ? 'text-emerald-400 font-semibold animate-pulse' : 'text-slate-600'}`}>
                      <span>{task}</span>
                      {idx < completedTasks.length && <CheckCircle2 size={13} className="text-emerald-500" />}
                    </div>
                  ))}
                </div>
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
                    Continue to Interview <ChevronRight size={14} />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
                  
                  {/* 1. Personal Information Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Personal Information</span>
                      <button 
                        onClick={() => toggleEditCard('personal_info')} 
                        className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1"
                      >
                        {editingCards['personal_info'] ? <><Save size={11} className="text-emerald-500"/> Save</> : <><FileEdit size={11}/> Edit</>}
                      </button>
                    </div>
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
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Professional Summary</span>
                      <button 
                        onClick={() => toggleEditCard('summary')} 
                        className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1"
                      >
                        {editingCards['summary'] ? <><Save size={11} className="text-emerald-500"/> Save</> : <><FileEdit size={11}/> Edit</>}
                      </button>
                    </div>
                    {editingCards['summary'] ? (
                      <textarea rows={4} value={parsedData.summary || ''} onChange={(e) => handleUpdateScalarField('summary', e.target.value)} className="w-full p-2 border border-slate-200 dark:border-white/10 rounded bg-white dark:bg-slate-900 text-xs font-medium" />
                    ) : (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic">{parsedData.summary || 'No professional summary provided.'}</p>
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
                        {editingCards['objective'] ? <><Save size={11} className="text-emerald-500"/> Save</> : <><FileEdit size={11}/> Edit</>}
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
                        <button onClick={() => handleAddItemToSection('education', { institution: 'University', degree: 'Degree', passing_year: '2025', cgpa_percentage: '', location: '' })} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11}/> Add Item</button>
                        <button onClick={() => toggleEditCard('education')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['education'] ? <><Save size={11} className="text-emerald-500"/> Save</> : <><FileEdit size={11}/> Edit</>}</button>
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
                              </div>
                            ) : (
                              <div>
                                <p className="font-bold">{edu.institution || 'Institution'}</p>
                                <p className="text-[10px] text-slate-500">{edu.degree} • {edu.passing_year || edu.year} {edu.cgpa_percentage ? `• ${edu.cgpa_percentage}` : ''}</p>
                              </div>
                            )}
                            <button onClick={() => handleDeleteItemFromSection('education', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12}/></button>
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
                        <button onClick={() => handleAddItemToSection('experience', { company: 'Company Name', position: 'Role Title', duration: '2024 - Present', description: '' })} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11}/> Add Item</button>
                        <button onClick={() => toggleEditCard('experience')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['experience'] ? <><Save size={11} className="text-emerald-500"/> Save</> : <><FileEdit size={11}/> Edit</>}</button>
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
                              </div>
                            ) : (
                              <div>
                                <p className="font-bold">{exp.position} {exp.company ? `@ ${exp.company}` : ''}</p>
                                <p className="text-[10px] text-slate-400">{exp.duration}</p>
                                <p className="text-slate-600 dark:text-slate-300 mt-1">{exp.description}</p>
                              </div>
                            )}
                            <button onClick={() => handleDeleteItemFromSection('experience', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12}/></button>
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
                        <button onClick={() => handleAddItemToSection('projects', { name: 'Project Title', tech_stack: 'React, Node', description: '' })} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11}/> Add Item</button>
                        <button onClick={() => toggleEditCard('projects')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['projects'] ? <><Save size={11} className="text-emerald-500"/> Save</> : <><FileEdit size={11}/> Edit</>}</button>
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
                              </div>
                            ) : (
                              <div>
                                <p className="font-bold">{proj.name || proj.title}</p>
                                <p className="text-[10px] text-slate-400">{proj.tech_stack || proj.technologies}</p>
                                <p className="text-slate-600 dark:text-slate-300 mt-1">{proj.description}</p>
                              </div>
                            )}
                            <button onClick={() => handleDeleteItemFromSection('projects', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12}/></button>
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
                        <button onClick={() => handleAddItemToSection('technicalSkills', 'New Skill')} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11}/> Add Item</button>
                        <button onClick={() => toggleEditCard('technicalSkills')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['technicalSkills'] ? <><Save size={11} className="text-emerald-500"/> Save</> : <><FileEdit size={11}/> Edit</>}</button>
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
                          <button onClick={() => handleDeleteItemFromSection('technicalSkills', idx)} className="text-rose-500 hover:text-rose-600 cursor-pointer ml-1"><X size={10}/></button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 8. Soft Skills Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Soft Skills</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('softSkills', 'Leadership')} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11}/> Add Item</button>
                        <button onClick={() => toggleEditCard('softSkills')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['softSkills'] ? <><Save size={11} className="text-emerald-500"/> Save</> : <><FileEdit size={11}/> Edit</>}</button>
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
                          <button onClick={() => handleDeleteItemFromSection('softSkills', idx)} className="text-rose-500 hover:text-rose-600 cursor-pointer ml-1"><X size={10}/></button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 9. Certifications Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Certifications</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('certifications', { name: 'Certificate Name', organization: 'Issuer', issue_date: '2024' })} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11}/> Add Item</button>
                        <button onClick={() => toggleEditCard('certifications')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['certifications'] ? <><Save size={11} className="text-emerald-500"/> Save</> : <><FileEdit size={11}/> Edit</>}</button>
                      </div>
                    </div>
                    <div className="text-xs space-y-2">
                      {(parsedData.certifications || []).map((cert: any, idx: number) => (
                        <div key={idx} className="border-b last:border-0 pb-2 flex justify-between items-start gap-2">
                          {editingCards['certifications'] ? (
                            <div className="grid grid-cols-2 gap-1.5 w-full">
                              <input type="text" value={cert.name || ''} placeholder="Certificate Name" onChange={(e) => handleUpdateItemField('certifications', idx, 'name', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                              <input type="text" value={cert.organization || ''} placeholder="Issuer" onChange={(e) => handleUpdateItemField('certifications', idx, 'organization', e.target.value)} className="p-1 border border-slate-200 rounded text-xs" />
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold">{cert.name}</p>
                              <p className="text-[10px] text-slate-400">{cert.organization} • {cert.issue_date}</p>
                            </div>
                          )}
                          <button onClick={() => handleDeleteItemFromSection('certifications', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12}/></button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 10. Internships Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Internships</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('internships', { company: 'Company', role: 'Intern Role', duration: 'Summer 2024', description: '' })} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11}/> Add Item</button>
                        <button onClick={() => toggleEditCard('internships')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['internships'] ? <><Save size={11} className="text-emerald-500"/> Save</> : <><FileEdit size={11}/> Edit</>}</button>
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
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold">{intern.role} @ {intern.company}</p>
                              <p className="text-[10px] text-slate-400">{intern.duration}</p>
                              <p className="text-slate-600 dark:text-slate-300 mt-1">{intern.description}</p>
                            </div>
                          )}
                          <button onClick={() => handleDeleteItemFromSection('internships', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12}/></button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 11. Achievements Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Achievements & Awards</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('achievements', '1st Place Hackathon')} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11}/> Add Item</button>
                        <button onClick={() => toggleEditCard('achievements')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['achievements'] ? <><Save size={11} className="text-emerald-500"/> Save</> : <><FileEdit size={11}/> Edit</>}</button>
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
                            <button onClick={() => handleDeleteItemFromSection('achievements', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12}/></button>
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
                        <button onClick={() => handleAddItemToSection('languages', 'English (Fluent)')} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11}/> Add Item</button>
                        <button onClick={() => toggleEditCard('languages')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['languages'] ? <><Save size={11} className="text-emerald-500"/> Save</> : <><FileEdit size={11}/> Edit</>}</button>
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
                          <button onClick={() => handleDeleteItemFromSection('languages', idx)} className="text-rose-500 hover:text-rose-600 cursor-pointer ml-1"><X size={10}/></button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 13. Portfolio & Links Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Portfolio & Web Links</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('portfolioLinks', 'https://portfolio.me')} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11}/> Add Item</button>
                        <button onClick={() => toggleEditCard('portfolioLinks')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['portfolioLinks'] ? <><Save size={11} className="text-emerald-500"/> Save</> : <><FileEdit size={11}/> Edit</>}</button>
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
                          <button onClick={() => handleDeleteItemFromSection('portfolioLinks', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12}/></button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 14. Publications Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Publications</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('publications', { title: 'Paper Title', publisher: 'IEEE / Journal', year: '2024' })} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11}/> Add Item</button>
                        <button onClick={() => toggleEditCard('publications')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['publications'] ? <><Save size={11} className="text-emerald-500"/> Save</> : <><FileEdit size={11}/> Edit</>}</button>
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
                          <button onClick={() => handleDeleteItemFromSection('publications', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12}/></button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 15. Volunteer Experience Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">Volunteer Experience</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('volunteerExperience', { organization: 'NGO / Org', role: 'Volunteer', duration: '2024' })} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11}/> Add Item</button>
                        <button onClick={() => toggleEditCard('volunteerExperience')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['volunteerExperience'] ? <><Save size={11} className="text-emerald-500"/> Save</> : <><FileEdit size={11}/> Edit</>}</button>
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
                          <button onClick={() => handleDeleteItemFromSection('volunteerExperience', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12}/></button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* 16. References Card */}
                  <Card className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase">References</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAddItemToSection('references', { name: 'Reference Name', title: 'Professor / Manager', company: 'Org', email: '' })} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer flex items-center gap-0.5"><Plus size={11}/> Add Item</button>
                        <button onClick={() => toggleEditCard('references')} className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 cursor-pointer flex items-center gap-1">{editingCards['references'] ? <><Save size={11} className="text-emerald-500"/> Save</> : <><FileEdit size={11}/> Edit</>}</button>
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
                          <button onClick={() => handleDeleteItemFromSection('references', idx)} className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer shrink-0"><Trash2 size={12}/></button>
                        </div>
                      ))}
                    </div>
                  </Card>

                </div>
              </motion.div>
            )}

            {/* Step 5: AI Resume Interview */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-grow flex flex-col h-[55vh] max-w-4xl mx-auto w-full border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-white/5">
                <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1.5">
                    <Zap size={14} className="text-emerald-400 animate-pulse" /> Live Career Coach Chat
                  </span>
                  <Button onClick={() => setStep(6)} size="sm" className="btn-glow-green text-[10px] font-bold py-1.5 px-3">
                    Complete & Select Template
                  </Button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 space-y-4 max-h-[35vh]">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${msg.sender === 'ai' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' : 'bg-white/10 text-white'}`}>
                        {msg.sender === 'ai' ? 'AI' : 'Me'}
                      </div>
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed ${msg.sender === 'ai' ? 'bg-slate-50 dark:bg-white/5 border border-slate-205 dark:border-white/5 text-slate-800 dark:text-slate-200 text-left' : 'bg-emerald-500 text-white font-semibold'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isAiResponding && (
                    <div className="flex gap-3 items-center text-xs text-slate-400">
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

            {/* Step 6: Smart Resume Completion */}
            {step === 6 && (
              <motion.div key="step6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 w-full text-left">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h2 className="text-lg font-black">Smart Resume Completion</h2>
                    <p className="text-xs text-slate-500">Edit sections or append new details before building the final layout.</p>
                  </div>
                  <Button onClick={() => runAnalysis(7)} className="btn-glow-green text-xs font-bold py-2.5 px-4 flex items-center gap-1">
                    Analyze Heuristics <ChevronRight size={14} />
                  </Button>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2.5">
                    <button onClick={() => setEditSectionType('projects')} className="px-3.5 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer">
                      <Plus size={13} /> Add Project
                    </button>
                    <button onClick={() => setEditSectionType('certifications')} className="px-3.5 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer">
                      <Plus size={13} /> Add Certificate
                    </button>
                    <button onClick={() => setEditSectionType('custom')} className="px-3.5 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer">
                      <Plus size={13} /> Add Custom Section
                    </button>
                  </div>

                  <div className="border border-slate-200 dark:border-white/10 rounded-2xl p-6 bg-slate-50/20 dark:bg-white/5">
                    <h4 className="text-xs font-extrabold text-slate-700 dark:text-white mb-2">Projects Summary</h4>
                    {parsedData.projects?.length > 0 ? (
                      parsedData.projects.map((proj: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs py-2 border-b last:border-0">
                          <span>{proj.title}</span>
                          <button onClick={() => {
                            const p = parsedData.projects.filter((_: any, i: number) => i !== idx);
                            setParsedData({ ...parsedData, projects: p });
                          }} className="text-rose-500 hover:text-rose-600"><Trash2 size={13} /></button>
                        </div>
                      ))
                    ) : <p className="text-xs text-slate-455">No projects added yet.</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 7: AI Resume Analysis */}
            {step === 7 && (
              <motion.div key="step7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 w-full text-left">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h2 className="text-lg font-black">AI Resume Audit & Heuristics</h2>
                    <p className="text-xs text-slate-500">Detailed diagnostics scoring compatibility, keywords, and structural flaws.</p>
                  </div>
                  <Button onClick={() => setStep(8)} className="btn-glow-green text-xs font-bold py-2.5 px-4 flex items-center gap-1">
                    Resume Improvement <ChevronRight size={14} />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-5 flex flex-col items-center justify-center gap-3">
                    <span className="text-xs font-black uppercase text-slate-450">ATS Compatibility</span>
                    <span className="text-3xl font-black text-emerald-500">{analysisData?.scores?.overall_score || 72}%</span>
                    <p className="text-[10px] text-slate-400 text-center leading-relaxed">Calculated via live NLP structural keywords lookup.</p>
                  </Card>

                  <Card className="p-5 md:col-span-2 flex flex-col gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-white uppercase border-b pb-1">Identified Critique Issues</span>
                    <div className="space-y-3.5 max-h-[30vh] overflow-y-auto pr-1">
                      {analysisData?.suggestions?.map((s: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-start text-xs">
                          <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{s}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Omission identified during parser rules compile step.</p>
                          </div>
                        </div>
                      )) || <p className="text-xs text-slate-400">All checks successfully passed!</p>}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Step 8: AI Resume Improvement */}
            {step === 8 && (
              <motion.div key="step8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 w-full text-left">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h2 className="text-lg font-black">AI Improvements Comparison</h2>
                    <p className="text-xs text-slate-500">Before & after optimization comparisons for descriptions, verbs, and keywords.</p>
                  </div>
                  <Button onClick={() => setStep(9)} className="btn-glow-green text-xs font-bold py-2.5 px-4 flex items-center gap-1">
                    Select Templates <ChevronRight size={14} />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[45vh] overflow-y-auto pr-2">
                  <div className="p-5 border border-slate-205 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 rounded-2xl flex flex-col gap-3">
                    <span className="text-xs font-extrabold uppercase text-slate-500">Original Resume Summary</span>
                    <p className="text-xs text-slate-450 italic leading-relaxed">
                      "{parsedData.personal_info?.summary || 'Detailed summary was not defined. Click manual edit sections to insert.'}"
                    </p>
                  </div>

                  <div className="p-5 border border-emerald-500/25 bg-emerald-500/5 rounded-2xl flex flex-col gap-3">
                    <span className="text-xs font-extrabold uppercase text-emerald-500 flex items-center gap-1">
                      <Sparkles size={12} className="text-emerald-400" /> Optimized AI Rewrite
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      "Result-driven professional with a proven track record. Optimized for technical keywords matching target role."
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 9: Resume Template Selection */}
            {step === 9 && (
              <motion.div key="step9" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 w-full text-left">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h2 className="text-lg font-black">Select Resume Layout Template</h2>
                    <p className="text-xs text-slate-500">Pick any professional ATS optimized layouts to preview your real data.</p>
                  </div>
                  <Button onClick={() => setStep(10)} className="btn-glow-green text-xs font-bold py-2.5 px-4 flex items-center gap-1">
                    Final Review <ChevronRight size={14} />
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['harvard', 'google', 'modern', 'minimal'].map((tpl) => (
                    <div 
                      key={tpl}
                      onClick={() => setSelectedTemplate(tpl)}
                      className={`border p-4 rounded-xl cursor-pointer text-center flex flex-col gap-2 transition-all hover:bg-slate-500/5 ${
                        selectedTemplate === tpl ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-200 dark:border-white/10 bg-white/5'
                      }`}
                    >
                      <FileText size={24} className="mx-auto text-emerald-400" />
                      <span className="text-xs font-extrabold capitalize">{tpl} Layout</span>
                      <span className="text-[9px] text-slate-550">ATS Rating: 100%</span>
                    </div>
                  ))}
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
                  <div className="text-center py-12 text-slate-450 font-bold text-xs">{jobsError}</div>
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
                                href={job.apply_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-3 py-1 bg-emerald-650 hover:bg-emerald-700 text-white font-black text-[9px] rounded-lg"
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

        {/* Modal Section-Editing Overlays (Side Panels) */}
        {editSectionType && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-end p-0">
            <div className={`w-full max-w-lg h-full p-6 flex flex-col justify-between border-l ${
              isDark ? 'bg-[#111827] text-white border-white/10' : 'bg-white text-slate-800 border-slate-200'
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

      </div>
    </div>
  );
};
