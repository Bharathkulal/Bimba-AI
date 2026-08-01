import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, Play, MessageSquare, Send, Sparkles, AlertCircle, 
  ArrowRight, ShieldCheck, Clock, CheckCircle, RotateCcw, BrainCircuit, User, Bot
} from 'lucide-react';
import { apiClient } from '../services/api';
import { useThemeStore } from '../store/themeStore';

interface ResumeListItem {
  id: number;
  name: string;
  target_role: string;
  ats_score: number;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const InterviewPrep: React.FC = () => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  // Navigation / Wizard State
  const [step, setStep] = useState<'config' | 'chat'>('config');
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [selectedRound, setSelectedRound] = useState<string>('Technical Round');
  const [loadingResumes, setLoadingResumes] = useState(true);

  // Chat Interface State
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const rounds = [
    { name: 'Technical Round', description: 'Deep-dive into core programming concepts, systems design, and technical skills listed on your resume.' },
    { name: 'HR Round', description: 'Assess cultural fit, career alignment, compensation expectations, and general professional background.' },
    { name: 'Behavioral Round', description: 'STAR-format scenarios (Situation, Task, Action, Result) focused on leadership, teamwork, and conflict resolution.' },
    { name: 'Coding Round', description: 'Algorithm execution, problem solving, complexities analysis, and dry-run reasoning.' },
  ];

  // Fetch student resumes on load
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoadingResumes(true);
        const res = await apiClient.get('/api/resume-studio/all');
        const data = res.data || [];
        setResumes(data);
        if (data.length > 0) {
          setSelectedResumeId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load resumes for mock interview:', err);
      } finally {
        setLoadingResumes(false);
      }
    };
    fetchResumes();
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const startInterview = async () => {
    if (!selectedResumeId) {
      alert('Please select or upload a resume first.');
      return;
    }
    setStep('chat');
    setSending(true);
    setChatMessages([]);
    setError(null);

    try {
      // Initialize the turn-by-turn mock interview session by prompting the AI to start
      const prompt = `Let's begin the ${selectedRound}. Please look at my resume and introduce yourself as the interviewer, then ask the first question.`;
      const res = await apiClient.post('/api/resume-studio/chat', {
        resume_id: selectedResumeId,
        message: prompt,
        mode: 'Interview Prep'
      });

      if (res.data && res.data.text) {
        setChatMessages([
          {
            sender: 'ai',
            text: res.data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error('Invalid AI response payload');
      }
    } catch (err: any) {
      setError('Failed to start interview session. Please try again.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || sending || !selectedResumeId) return;

    const userText = inputMessage;
    setInputMessage('');
    setSending(true);
    setError(null);

    const userMessageObj: Message = {
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMessageObj]);

    try {
      const res = await apiClient.post('/api/resume-studio/chat', {
        resume_id: selectedResumeId,
        message: userText,
        mode: 'Interview Prep'
      });

      if (res.data && res.data.text) {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: res.data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error('Invalid AI response payload');
      }
    } catch (err: any) {
      setError('Message delivery failed. Please check your connection and retry.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const resetInterview = () => {
    setStep('config');
    setChatMessages([]);
  };

  return (
    <div className="flex flex-col gap-6 text-left w-full max-w-[1440px] mx-auto py-2">
      {/* Header and Breadcrumb */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            <span>Bimba AI</span>
            <span>/</span>
            <span className="text-emerald-500">Interview Prep</span>
          </nav>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="text-emerald-500" /> AI Mock Interview Prep
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Practice mock interviews tailored specifically to your resume.
          </p>
        </div>
      </div>

      {step === 'config' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Form */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white dark:bg-[#1F2937] border border-slate-100 dark:border-white/5 p-6 rounded-[20px] shadow-sm flex flex-col gap-6">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BrainCircuit className="text-emerald-500" size={20} /> Configure Your Practice Session
              </h2>

              {/* Resume Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Select Resume for Context
                </label>
                {loadingResumes ? (
                  <div className="h-12 w-full bg-slate-50 dark:bg-white/5 animate-pulse rounded-xl" />
                ) : resumes.length === 0 ? (
                  <div className="border border-dashed border-slate-200 dark:border-white/10 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500">No resumes found. Please upload a resume in the Resume Studio first.</p>
                  </div>
                ) : (
                  <select
                    value={selectedResumeId || ''}
                    onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-150 dark:border-white/5 text-slate-800 dark:text-white p-3 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    {resumes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} - {r.target_role || 'General Role'} (ATS: {r.ats_score}%)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Round Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Choose Interview Round
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rounds.map((round) => (
                    <button
                      key={round.name}
                      onClick={() => setSelectedRound(round.name)}
                      className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedRound === round.name
                          ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                          : 'border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                      }`}
                    >
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1">
                        {round.name}
                      </h3>
                      <p className="text-xs text-slate-450 dark:text-slate-400 line-clamp-2">
                        {round.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trigger Button */}
              <button
                onClick={startInterview}
                disabled={resumes.length === 0}
                className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
              >
                <Play size={16} /> Start Mock Session <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Quick Guidance Info Panel */}
          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-[#1F2937] border border-slate-100 dark:border-white/5 p-6 rounded-[20px] shadow-sm flex flex-col gap-5">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">AI Interview Coach tips</h3>
              
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-blue-500/15 text-blue-500 shrink-0 h-fit">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-805 dark:text-slate-200">Tailored to You</h4>
                  <p className="text-xs text-slate-400 mt-1">Our agent classifies your resume bullet points and generates technical questions matching your experience profile.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-amber-500/15 text-amber-500 shrink-0 h-fit">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-805 dark:text-slate-200">STAR Phrasing</h4>
                  <p className="text-xs text-slate-400 mt-1">AI provides immediate STAR-format (Situation, Task, Action, Result) revisions for your verbal responses.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-500 shrink-0 h-fit">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-805 dark:text-slate-200">Turn-by-Turn</h4>
                  <p className="text-xs text-slate-400 mt-1">Interact step-by-step. Receive constructive evaluation before advancing to subsequent stages.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Chat Mock Session Interface */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Active Status Left Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-white dark:bg-[#1F2937] border border-slate-100 dark:border-white/5 p-5 rounded-[20px] shadow-sm flex flex-col gap-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-2">
                Session Active
              </h3>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Selected Round</p>
                <p className="text-sm font-extrabold text-emerald-500 mt-0.5">{selectedRound}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Context Resume</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                  {resumes.find(r => r.id === selectedResumeId)?.name}
                </p>
              </div>
              <hr className="border-slate-100 dark:border-white/5 my-1" />
              <button
                onClick={resetInterview}
                className="flex items-center justify-center gap-2 py-2 border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl font-bold text-xs text-rose-500 transition-colors cursor-pointer"
              >
                <RotateCcw size={14} /> End Practice Session
              </button>
            </div>
          </div>

          {/* Chat Pane */}
          <div className="lg:col-span-3 bg-white dark:bg-[#1F2937] border border-slate-100 dark:border-white/5 rounded-[20px] shadow-sm overflow-hidden flex flex-col h-[560px]">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-extrabold text-slate-800 dark:text-white">AI Interviewer</span>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {chatMessages.map((msg, index) => {
                const isAi = msg.sender === 'ai';
                return (
                  <div key={index} className={`flex gap-3 max-w-[85%] ${isAi ? 'self-start text-left' : 'self-end flex-row-reverse text-right'}`}>
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black ${
                      isAi ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border border-slate-800' : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                    }`}>
                      {isAi ? <Bot size={16} /> : <User size={16} />}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                        isAi 
                          ? 'bg-slate-55/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-100' 
                          : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      }`}>
                        {/* Preserve double newline spacing formatting */}
                        {msg.text.split('\n').map((line, lidx) => (
                          <p key={lidx} className={lidx > 0 ? 'mt-1.5' : ''}>{line}</p>
                        ))}
                      </div>
                      <span className="text-[9px] text-slate-400 font-semibold px-1">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div className="flex gap-3 max-w-[85%] self-start text-left">
                  <div className="w-8 h-8 rounded-full shrink-0 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white flex items-center justify-center animate-spin">
                    <RotateCcw size={16} />
                  </div>
                  <div className="p-3 bg-slate-50/50 dark:bg-white/[0.01] rounded-2xl">
                    <span className="text-xs text-slate-400 animate-pulse font-medium">Interviewer is thinking...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-center gap-2.5 text-xs text-rose-500 font-semibold">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 dark:border-white/5 flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your response here..."
                disabled={sending}
                className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-150 dark:border-white/5 text-slate-800 dark:text-white px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || sending}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center shrink-0"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPrep;
