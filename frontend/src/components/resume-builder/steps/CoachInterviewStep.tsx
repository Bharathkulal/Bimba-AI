import React, { useState } from 'react';
import { useResumeBuilderContext } from '../ResumeBuilderContext';
import { Card } from '../../Card';
import { Button } from '../../Button';
import { Compass, Sparkles, Send, User } from 'lucide-react';
import { ResumePreview } from '../../resume/ResumePreview';

export const CoachInterviewStep: React.FC = () => {
  const { chatHistory, setChatHistory, parsedData, resumeId } = useResumeBuilderContext();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const quickReplies = [
    "Yes, add this to summary",
    "Let me rephrase",
    "Skip this section"
  ];

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    // Add User response
    setChatHistory(prev => [...prev, { sender: 'user', text }]);
    setInputText('');
    setLoading(true);

    // Simulate AI Coach reply
    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        { sender: 'ai', text: `Excellent suggestion. I've noted that. Let's inspect the Projects section next. Have you worked on any production React deployments or Python microservices?` }
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 py-4 text-left items-start">
      
      {/* Left panel: Chat Interface */}
      <Card className="p-5 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-md h-[460px] flex flex-col justify-between">
        
        {/* Chat header */}
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
              <Compass size={15} className="text-emerald-500" /> Bimba AI Career Coach
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Optimizing matched compatibility in real-time</p>
          </div>
        </div>

        {/* Chat messages scrollable */}
        <div className="flex-grow overflow-y-auto my-4 space-y-4 pr-1 flex flex-col">
          {chatHistory.map((msg, idx) => {
            const isAi = msg.sender === 'ai';
            return (
              <div key={idx} className={`flex items-start gap-2.5 max-w-[80%] ${isAi ? 'self-start' : 'self-end flex-row-reverse'}`}>
                {isAi ? (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Sparkles size={14} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/5 flex items-center justify-center shrink-0">
                    <User size={14} />
                  </div>
                )}
                <div className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                  isAi 
                    ? 'bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-200' 
                    : 'bg-emerald-500 text-white font-bold'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold self-start pl-10">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-75" />
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-150" />
            </div>
          )}
        </div>

        {/* Quick replies & TextInput */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply, i) => (
              <button
                key={i}
                onClick={() => handleSend(reply)}
                className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 border border-slate-200 dark:border-white/10 hover:border-emerald-500 rounded-xl bg-slate-50 hover:bg-emerald-500/5 dark:bg-white/5 text-slate-500 hover:text-emerald-500 cursor-pointer transition-all"
              >
                {reply}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputText);
            }}
            className="flex items-center gap-2 border border-slate-200 dark:border-white/10 rounded-2xl px-3 py-2 bg-slate-50 dark:bg-slate-900"
          >
            <input
              type="text"
              placeholder="Ask coach, rephrase, or accept rewrites..."
              className="flex-grow bg-transparent border-none outline-none text-xs font-semibold text-slate-800 dark:text-white"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-1.5 bg-emerald-500 text-white rounded-xl shadow-md cursor-pointer hover:opacity-90 transition-all shrink-0"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      </Card>

      {/* Right panel: Live Resume Preview */}
      <div className="hidden md:block">
        <ResumePreview />
      </div>

    </div>
  );
};
export default CoachInterviewStep;
