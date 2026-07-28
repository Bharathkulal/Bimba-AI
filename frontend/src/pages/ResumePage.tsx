import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Plus, Sparkles, UploadCloud, Download, Edit3, Copy, Trash2, 
  Search, Scan, Brain, CheckCircle2, ChevronRight, Bot, SendHorizontal
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatsCard } from '../components/StatsCard';
import { useUserStore } from '../store/userStore';
import { useThemeStore } from '../store/themeStore';
import { apiClient, API_BASE_URL } from '../services/api';
import { analyticsService } from '../services/analytics';
import type { ResumeAnalyticsItem, AtsData } from '../services/analytics';
import { TemplateShowcase } from '../components/TemplateShowcase';
import { UploadResumeWizard } from '../components/UploadResumeWizard';
import { CareerCopilotChat } from '../components/CareerCopilotChat';
import { ResumeUpload } from '../components/resume/ResumeUpload';
import { Modal } from '../components/Modal';
import { ResumeAnalysisStatus } from '../components/resume/ResumeAnalysisStatus';
import { ResumeAIAnalysis } from '../components/resume/ResumeAIAnalysis';

export const ResumePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);

  const getDisplayName = () => {
    if (!user) return 'Student';
    const email = user.personal_email;
    const prefix = email.split('@')[0];
    const name = prefix.replace(/[0-9_.]/g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1).trim();
  };
  const displayName = getDisplayName();

  // Core Data States
  const [isLoading, setIsLoading] = useState(true);
  const [resumes, setResumes] = useState<ResumeAnalyticsItem[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [atsData, setAtsData] = useState<AtsData | null>(null);

  // Uploader & Actions
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated_at' | 'ats_score' | 'name'>('updated_at');
  const [filterBy, setFilterBy] = useState<string>('all');

  // Optimizer Chat
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string }>>([]);
  const [chatInput, setChatInput] = useState('');

  // Active Tab: 'resumes' | 'templates' | 'ats-scanner'
  const [activeSubTab, setActiveSubTab] = useState<'resumes' | 'templates' | 'ats-scanner'>('resumes');
  const [showWizard, setShowWizard] = useState(false);
  const [wizardFile, setWizardFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [activeAnalysisResumeId, setActiveAnalysisResumeId] = useState<number | null>(null);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    setChatMessages([
      { sender: 'ai', text: `Hello ${displayName}! I can help you optimize your resume. Type a prompt or use the quick actions below to make updates!` }
    ]);
  }, [displayName]);

  const fetchResumeData = async () => {
    try {
      setIsLoading(true);
      const [resList, tplRes, ats] = await Promise.all([
        analyticsService.getResumes(),
        apiClient.get('/api/resume-studio/templates'),
        analyticsService.getAts(),
      ]);
      setResumes(resList);
      setTemplates(tplRes.data || []);
      setAtsData(ats);
    } catch (err) {
      console.error("Error loading resume hub data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumeData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const query = new URLSearchParams(window.location.search);
      if (query.get('trigger_upload') === 'true') {
        // Clean up the URL search parameter so it doesn't trigger on reload
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        // Trigger file input click
        setTimeout(() => {
          document.getElementById('resume-page-upload-input')?.click();
        }, 100);
      }
    }
  }, [isLoading]);

  const handleTrackAction = async (
    type: 'ai_use' | 'download' | 'edit' | 'session' | 'activity',
    detail: string,
    format?: string,
    score?: number
  ) => {
    try {
      await analyticsService.trackAction({
        action_type: type,
        detail,
        format,
        ats_score: score
      });
      const [resList, ats] = await Promise.all([
        analyticsService.getResumes(),
        analyticsService.getAts(),
      ]);
      setResumes(resList);
      setAtsData(ats);
    } catch (err) {
      console.error("Action tracking failed:", err);
    }
  };

  const deleteResume = async (id: number) => {
    if (confirm("Are you sure you want to delete this resume?")) {
      try {
        await apiClient.delete(`/api/resume-studio/${id}`);
        await handleTrackAction('activity', `Deleted Resume ID: ${id}`);
        fetchResumeData();
      } catch (err) {
        alert("Failed to delete resume.");
      }
    }
  };

  const duplicateResume = async (id: number) => {
    const original = resumes.find(r => r.id === id);
    if (original) {
      try {
        await apiClient.post(`/api/resume-studio/${id}/duplicate`);
        await handleTrackAction('activity', `Duplicated Resume: ${original.name}`);
        fetchResumeData();
      } catch (err) {
        alert("Failed to duplicate resume.");
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx' && ext !== 'txt') {
      alert("Unsupported file format. Please upload PDF, DOCX or TXT.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds limit of 10MB.");
      return;
    }
    
    setWizardFile(file);
    setShowWizard(true);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    const promptText = chatInput;
    setChatInput('');

    await handleTrackAction('ai_use', 'chat');

    setTimeout(() => {
      let replyText = "I'm ready to help you optimize that! Let's scan your keywords or write a professional summary.";
      if (promptText.toLowerCase().includes('ats') || promptText.toLowerCase().includes('score')) {
        replyText = "To optimize your ATS score, consider adding keywords like 'RESTful APIs', 'CI/CD pipeline', and 'System Design' under your experience.";
      } else if (promptText.toLowerCase().includes('skills')) {
        replyText = "I suggest adding technical skills like Docker, Kubernetes, and Tailwind CSS to match current industry demands.";
      }
      setChatMessages(prev => [...prev, { sender: 'ai', text: replyText }]);
    }, 1000);
  };

  const handleFixSuggestion = async (suggestion: string) => {
    alert(`AI Triggered one-click fix for "${suggestion}". Optimization is now processing!`);
    await handleTrackAction('ai_use', `one_click_fix_${suggestion}`);
    fetchResumeData();
  };

  const bestResume = resumes.find(r => r.atsScore === Math.max(...resumes.map(x => x.atsScore))) || resumes[0];
  const resumeHealth = bestResume?.completion || 0;
  const atsScore = bestResume?.atsScore || 0;
  const suggestions = atsData?.recommendations || [];

  return (
    <div className="flex flex-col gap-6 text-left w-full max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l -[#111111]/5 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 text-left">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            My Resume
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Build, template, parse, and optimize your resumes using advanced ATS scoring.
          </p>
        </div>
        <div className="flex gap-3 shrink-0 relative z-10">
          <Button 
            onClick={() => setShowWizard(true)}
            variant="secondary" 
            size="sm"
            className="flex items-center gap-2"
          >
            <UploadCloud size={15} />
            Upload PDF/DOCX/TXT
          </Button>
          <Button 
            onClick={() => navigate('/resume-builder')}
            variant="primary" 
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Plus size={16} />
            Create From Scratch
          </Button>
        </div>
      </section>

      {/* Hidden File Input */}
      <input 
        type="file" 
        id="resume-page-upload-input" 
        accept=".pdf,.docx,.txt" 
        className="hidden" 
        onChange={handleFileUpload} 
      />

      {isUploading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-5">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin" />
              <Bot size={24} className="-[#111111] animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">AI Resume Parsing</h3>
              <p className="text-xs text-slate-500 mt-2 font-semibold leading-relaxed">{uploadProgress}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatsCard 
          label="Top Resume Score" 
          value={`${atsScore}%`} 
          percentage={atsScore} 
          description="Matched keywords to standard guidelines"
        />
        <StatsCard 
          label="Profile Completion" 
          value={`${resumeHealth}%`} 
          percentage={resumeHealth} 
          description="Average profile information filled"
        />
        <StatsCard 
          label="Active Resume Templates" 
          value={templates.length} 
          icon={FileText} 
          description="Ready styles and formats"
        />
      </section>

      {/* Section Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'resumes', label: 'My Resumes', icon: FileText },
          { id: 'templates', label: 'Resume Templates', icon: Sparkles },
          { id: 'ats-scanner', label: 'ATS Scorer & Optimizer', icon: Scan },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs cursor-pointer transition-colors ${
                isActive 
                  ? '-[#111111] -[#111111]' 
                  : 'border-transparent text-slate-500 hover:text-slate-850'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="mt-2">
        {activeSubTab === 'resumes' && (
          <div className="flex flex-col gap-6">
            <ResumeUpload 
              onUploadSuccess={(fileObj) => {
                setUploadedFile(fileObj);
                fetchResumeData();
              }}
              onAnalyzeClick={() => {
                if (uploadedFile) {
                  setWizardFile(uploadedFile);
                  setShowWizard(true);
                } else {
                  setShowWizard(true);
                }
              }}
            />
            
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text"
                  placeholder="Filter resumes by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:-[#111111] focus:ring-1 focus:-[#111111] font-medium"
                />
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:-[#111111] cursor-pointer font-semibold"
                >
                  <option value="updated_at">Last Updated</option>
                  <option value="ats_score">ATS Score</option>
                  <option value="name">Name</option>
                </select>
                
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:-[#111111] cursor-pointer font-semibold"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Resume Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {resumes.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-400 font-bold text-sm">
                  You have not created any resumes yet. Click "Create From Scratch" or "Upload PDF" to start!
                </div>
              ) : (
                resumes
                  .filter(res => {
                    const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesFilter = filterBy === 'all' || res.status.toLowerCase() === filterBy.toLowerCase();
                    return matchesSearch && matchesFilter;
                  })
                  .sort((a, b) => {
                    if (sortBy === 'ats_score') return b.atsScore - a.atsScore;
                    if (sortBy === 'name') return a.name.localeCompare(b.name);
                    return b.id - a.id;
                  })
                  .map((res) => {
                    if (res.status === 'uploaded') {
                      return (
                        <Card 
                          key={res.id} 
                          className="hover:border-emerald-500/30 flex flex-col justify-between gap-4 text-left border-slate-200 dark:border-white/10 dark:bg-[#1F2937]/75 backdrop-blur-md shadow-sm"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600">
                                <FileText size={18} />
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate max-w-[200px]">{res.name}</h4>
                                <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                                  Status: <span className="text-emerald-500 font-bold uppercase">{res.status}</span>
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right shrink-0">
                              <span className="text-[9px] text-slate-450 font-bold">Uploaded: {new Date(res.lastEdited).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-5 pt-3 border-t border-slate-100 dark:border-white/5 mt-1">
                            <span className="text-[10px] text-slate-400 font-medium">Original file stored securely</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button 
                                onClick={() => {
                                  setActiveAnalysisResumeId(res.id);
                                }}
                                className="px-3 py-1.5 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                              >
                                Analyze Resume
                              </button>
                              <button 
                                onClick={() => deleteResume(res.id)}
                                className="w-7.5 h-7.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-center text-rose-650 dark:text-rose-450 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </Card>
                      );
                    }
                    return (
                      <Card 
                        key={res.id} 
                        className="hover:border-[#E5E7EB] flex flex-col justify-between gap-4 text-left"
                      >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center -[#111111]">
                            <FileText size={18} />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-800">{res.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Template: <span className="capitalize">{res.template}</span> • Status: <span className="font-bold">{res.status}</span></p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="bg-[#F8F8F8] border border-[#E5E7EB] -[#111111] text-[10px] font-bold px-2 py-0.5 rounded">
                            ATS {res.atsScore}%
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold">Health: {res.completion}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-5 pt-3 border-t border-slate-100 mt-1">
                        <div className="flex items-center gap-1.5 flex-grow">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="-[#111111] h-full rounded-full transition-all duration-500" style={{ width: `${res.completion}%` }} />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button 
                            onClick={() => navigate(`/resume-builder?id=${res.id}`)}
                            className="w-7.5 h-7.5 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:-[#111111] hover:border-[#E5E7EB] transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button 
                            onClick={async () => {
                              await handleTrackAction('download', 'download_pdf', 'PDF');
                              const token = localStorage.getItem('auth_token');
                              window.open(`${API_BASE_URL}/api/resume-studio/${res.id}/pdf${token ? `?token=${token}` : ''}`, '_blank');
                            }}
                            className="w-7.5 h-7.5 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:-[#111111] hover:border-[#E5E7EB] transition-colors cursor-pointer"
                            title="Download PDF"
                          >
                            <Download size={12} />
                          </button>
                          <button 
                            onClick={() => duplicateResume(res.id)}
                            className="w-7.5 h-7.5 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:-[#111111] hover:border-[#E5E7EB] transition-colors cursor-pointer"
                            title="Duplicate"
                          >
                            <Copy size={12} />
                          </button>
                          <button 
                            onClick={() => deleteResume(res.id)}
                            className="w-7.5 h-7.5 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'templates' && (
          <Card className="p-6">
            <h3 className="text-base font-extrabold text-slate-900 mb-6 border-b border-slate-100 pb-2">
              Select a Premium Template
            </h3>
            {/* Inline template showcase layout wrapper */}
            <TemplateShowcase />
          </Card>
        )}

        {activeSubTab === 'ats-scanner' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* ATS critiques list */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <Card className="p-6">
                <h3 className="text-base font-extrabold text-slate-900 mb-4 border-b border-slate-100 pb-2">
                  Bimba AI Resume Critiques
                </h3>
                <div className="flex flex-col gap-4">
                  {suggestions.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 font-bold text-xs">
                      All audit reports passed. Your resume ATS compatibility looks outstanding!
                    </div>
                  ) : (
                    suggestions.map((sug: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="bg-slate-50/50 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between gap-3 text-left hover:border-[#E5E7EB] transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-xs text-slate-800">{sug.title}</h4>
                            <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-relaxed">{sug.reason}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase shrink-0 ${
                            sug.priority === 'High' ? 'bg-rose-50 border border-rose-100 text-rose-600' : 'bg-amber-50 border border-amber-100 text-amber-600'
                          }`}>
                            {sug.priority}
                          </span>
                        </div>
                        <div className="flex justify-end pt-2 border-t border-slate-100">
                          <button 
                            onClick={() => handleFixSuggestion(sug.title)}
                            className="px-3.5 py-1.5 -[#111111] hover:-[#111111] text-white font-bold text-[9px] rounded-lg transition-colors shadow-sm cursor-pointer"
                          >
                            One-Click Fix
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Embedded Optimizer chatbot panel */}
            <div className="flex flex-col gap-5">
              {bestResume && (
                <CareerCopilotChat 
                  resumeId={bestResume.id} 
                  onUpdateResume={fetchResumeData} 
                />
              )}
            </div>

          </div>
        )}
      </div>

      {showWizard && (
        <UploadResumeWizard 
          initialFile={wizardFile}
          onClose={() => {
            setShowWizard(false);
            setWizardFile(null);
            fetchResumeData();
          }}
          onSuccess={() => {
            setShowWizard(false);
            setWizardFile(null);
            fetchResumeData();
          }}
          isDark={isDark}
        />
      )}

      {activeAnalysisResumeId !== null && (() => {
        const selectedResume = resumes.find(r => r.id === activeAnalysisResumeId);
        const showAnalysis = selectedResume?.status === 'analyzed' || selectedResume?.status === 'ai_completed';
        
        return (
          <Modal 
            isOpen={activeAnalysisResumeId !== null} 
            onClose={() => setActiveAnalysisResumeId(null)}
            title={showAnalysis ? "AI Resume Scorecard" : "AI Text Extraction & Analysis"}
          >
            {showAnalysis ? (
              <ResumeAIAnalysis 
                resumeId={activeAnalysisResumeId} 
                onAnalysisComplete={fetchResumeData}
              />
            ) : (
              <ResumeAnalysisStatus 
                resumeId={activeAnalysisResumeId} 
                onAnalysisComplete={fetchResumeData}
              />
            )}
          </Modal>
        );
      })()}
    </div>
  );
};

export default ResumePage;
