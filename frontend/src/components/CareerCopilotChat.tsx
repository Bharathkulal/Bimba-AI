import React, { useState, useEffect, useRef } from 'react';
import { SendHorizontal, Sparkles, ChevronDown, Check, RefreshCw, X, Copy, Mail } from 'lucide-react';
import { apiClient } from '../services/api';

interface ActionItem {
  type: 'apply_rewrite' | 'generate_cover_letter' | 'mock_question';
  original?: string;
  suggested?: string;
  reason?: string;
  draft?: string;
}

interface ChatMessage {
  id?: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp?: string;
  mode?: string;
  actions?: ActionItem[];
}

interface CareerCopilotChatProps {
  resumeId: number;
  onUpdateResume?: () => void;
}

export const CareerCopilotChat: React.FC<CareerCopilotChatProps> = ({ resumeId, onUpdateResume }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [activeMode, setActiveMode] = useState('Career Copilot');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const modes = [
    { name: 'Career Copilot', command: '/copilot' },
    { name: 'Analyst', command: '/analyst' },
    { name: 'JD Tailoring', command: '/tailor' },
    { name: 'Interview Prep', command: '/interview' },
    { name: 'Gap Conversation', command: '/gaps' },
    { name: 'Profile Sync', command: '/sync' },
    { name: 'Application Tracker', command: '/tracker' }
  ];

  // Fetch Chat History
  const fetchHistory = async () => {
    try {
      const res = await apiClient.get(`/api/resume-studio/${resumeId}/chat/history`);
      if (res.data && res.data.length > 0) {
        setMessages(res.data);
      } else {
        // Welcome State referencing the resume context
        setMessages([
          {
            sender: 'ai',
            text: "Hi! I'm your Career Copilot. I've analyzed your resume and target role. Ask me to rewrite bullet points with metrics, prep you for interviews, or tailor your resume to a job description!",
            mode: 'Career Copilot'
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [resumeId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    // Check if slash command is used to set mode
    let messageText = textToSend;
    let targetMode = activeMode;
    
    for (const m of modes) {
      if (msgStartsWithCommand(messageText, m.command)) {
        targetMode = m.name;
        messageText = messageText.substring(m.command.length).trim();
        setActiveMode(m.name);
        break;
      }
    }

    const userMsg: ChatMessage = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setStatusText('Classifying query and gathering context...');

    // Simulate multi-stage logging states
    setTimeout(() => setStatusText('Querying LLM provider chain...'), 1000);
    setTimeout(() => setStatusText('Analyzing resume keywords matches...'), 2500);

    try {
      const res = await apiClient.post('/api/resume-studio/chat', {
        resume_id: resumeId,
        message: messageText,
        mode: targetMode
      });

      const aiMsg: ChatMessage = {
        sender: 'ai',
        text: res.data.response,
        mode: res.data.inferred_mode,
        actions: res.data.actions
      };

      if (res.data.inferred_mode) {
        setActiveMode(res.data.inferred_mode);
      }

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: `Sorry, chat processing encountered an error: ${err.message || 'Unknown'}` }
      ]);
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  const handleApplyRewrite = async (original: string, suggested: string) => {
    try {
      await apiClient.post(`/api/resume-studio/${resumeId}/chat/apply-rewrite`, {
        original,
        suggested
      });
      alert('Rewrite applied successfully to your resume!');
      if (onUpdateResume) onUpdateResume();
    } catch (err: any) {
      alert(`Failed to apply rewrite: ${err.response?.data?.detail || err.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="flex flex-col h-[550px] bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-slate-100 tracking-wider">CAREER COPILOT</span>
        </div>
        
        {/* Mode Selector */}
        <div className="relative">
          <button 
            onClick={() => setShowModeDropdown(!showModeDropdown)}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-[10px] font-bold rounded-lg border border-white/5 transition-all cursor-pointer"
          >
            <Sparkles size={10} className="text-emerald-400" />
            {activeMode}
            <ChevronDown size={10} />
          </button>
          
          {showModeDropdown && (
            <div className="absolute right-0 mt-1.5 w-44 bg-slate-950 border border-white/10 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
              {modes.map((m) => (
                <button
                  key={m.name}
                  onClick={() => {
                    setActiveMode(m.name);
                    setShowModeDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-[10px] font-medium transition-colors hover:bg-white/5 ${
                    activeMode === m.name ? 'text-emerald-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-3 text-[11px] leading-relaxed shadow-sm ${
              msg.sender === 'user'
                ? 'bg-emerald-600 text-white rounded-tr-none'
                : 'bg-slate-950/70 border border-white/5 text-slate-200 rounded-tl-none'
            }`}>
              {msg.text}
              
              {/* Inline Action Cards */}
              {msg.actions && msg.actions.map((act, aIdx) => (
                <div key={aIdx} className="mt-3.5 pt-3 border-t border-white/10 flex flex-col gap-2">
                  {act.type === 'apply_rewrite' && (
                    <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex flex-col gap-2">
                      <div className="text-[10px] text-red-400 line-through font-mono">
                        {act.original}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        {act.suggested}
                      </div>
                      {act.reason && (
                        <div className="text-[9px] text-slate-400 italic">
                          Reason: {act.reason}
                        </div>
                      )}
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => handleApplyRewrite(act.original!, act.suggested!)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] rounded-lg transition-colors cursor-pointer"
                        >
                          <Check size={10} />
                          Apply Rewrite
                        </button>
                      </div>
                    </div>
                  )}

                  {act.type === 'generate_cover_letter' && (
                    <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex flex-col gap-2">
                      <div className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">
                        Cover Letter Draft Generated
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(act.draft!)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white font-bold text-[9px] rounded-lg transition-colors cursor-pointer"
                        >
                          <Copy size={10} />
                          Copy Draft
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {msg.mode && (
              <span className="text-[8px] text-slate-500 font-mono mt-1 px-1">
                mode: {msg.mode}
              </span>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex flex-col gap-1.5 items-start">
            <div className="bg-slate-950/70 border border-white/5 rounded-2xl rounded-tl-none p-3 max-w-[85%] flex items-center gap-2">
              <RefreshCw className="animate-spin text-emerald-400" size={12} />
              <span className="text-[10px] text-slate-400 italic font-mono">{statusText}</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Chips */}
      <div className="px-4 py-1.5 bg-slate-950/40 border-t border-white/5 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none z-10">
        <button 
          onClick={() => handleSendMessage("Tailor my resume for a job description")}
          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[9px] font-bold rounded-lg border border-white/5 transition-colors cursor-pointer"
        >
          🎯 Tailor to Job
        </button>
        <button 
          onClick={() => handleSendMessage("Prep me for an interview")}
          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[9px] font-bold rounded-lg border border-white/5 transition-colors cursor-pointer"
        >
          🎙️ Mock Interview
        </button>
        <button 
          onClick={() => handleSendMessage("Explain my employment gaps")}
          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[9px] font-bold rounded-lg border border-white/5 transition-colors cursor-pointer"
        >
          ⏳ Gap Strategy
        </button>
      </div>

      {/* Input Form */}
      <div className="p-4 bg-slate-950 border-t border-white/5 flex items-center gap-2.5 z-10">
        <input 
          type="text"
          placeholder="Ask Copilot (e.g. /interview prep me)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-grow pl-4 pr-3 py-2 rounded-xl bg-slate-900 border border-white/5 focus:border-emerald-500/50 focus:outline-none text-[11px] text-slate-200 font-medium placeholder-slate-500"
        />
        <button 
          onClick={() => handleSendMessage()}
          className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-md"
        >
          <SendHorizontal size={12} />
        </button>
      </div>
    </div>
  );
};

function msgStartsWithCommand(text: string, cmd: string): boolean {
  return text.toLowerCase().startsWith(cmd.toLowerCase());
}
