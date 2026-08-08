import React, { useState } from 'react';
import { useResumeBuilderContext } from '../ResumeBuilderContext';
import { Card } from '../../Card';
import { Button } from '../../Button';
import { Sparkles, Check, X, Edit3, Eye, Filter } from 'lucide-react';

export const AiPolishStep: React.FC = () => {
  const { suggestions, setSuggestions, triggerAutosave, parsedData } = useResumeBuilderContext();
  const [focusMode, setFocusMode] = useState(false);
  const [filterSection, setFilterSection] = useState('all');
  const [focusIndex, setFocusIndex] = useState(0);

  const handleAccept = async (id: string, improved: string) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, accepted: true } : s));
    if (parsedData) {
      // For demo, apply to summary
      await triggerAutosave({ summary: improved });
    }
  };

  const handleReject = (id: string) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, accepted: false } : s));
  };

  const handleAcceptAll = async () => {
    setSuggestions(prev => prev.map(s => ({ ...s, accepted: true })));
    if (parsedData && suggestions.length > 0) {
      await triggerAutosave({ summary: suggestions[0].improved });
    }
  };

  return (
    <div className="max-w-5xl w-full flex flex-col gap-6 py-4 text-left">
      
      {/* Diff Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={16} className="text-emerald-500" /> AI Resume Polish suggestions
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5 font-bold">Review and accept sentence rewrites to boost ATS score matching</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setFocusMode(prev => !prev)}
            className={`px-3 py-1.5 border rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
              focusMode 
                ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500' 
                : 'border-slate-200 dark:border-white/10 text-slate-500'
            }`}
          >
            <Eye size={12} /> Focus Mode
          </button>
          <Button onClick={handleAcceptAll} className="font-bold text-xs gap-1 py-1.5 px-4">
            Accept All Rewrites
          </Button>
        </div>
      </div>

      {/* Suggested diff list view */}
      <div className="flex flex-col gap-5">
        {suggestions.map((item, idx) => {
          if (focusMode && idx !== focusIndex) return null;
          const isResolved = item.accepted !== undefined;

          return (
            <Card key={item.id} className="p-5 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-sm flex flex-col gap-4">
              
              {/* Diff card columns layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Original Content */}
                <div className="flex flex-col gap-2 p-3.5 bg-rose-50 dark:bg-rose-500/5 border border-rose-200/60 dark:border-rose-500/10 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-wider text-rose-500">Original Content</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold line-through decoration-rose-500/60">
                    {item.original}
                  </p>
                </div>

                {/* AI-Polished Version */}
                <div className="flex flex-col gap-2 p-3.5 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200/60 dark:border-emerald-500/10 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-450 flex items-center gap-1">
                    <Sparkles size={11} /> AI-Polished Version
                  </span>
                  <p className="text-xs text-slate-900 dark:text-white leading-relaxed font-extrabold">
                    {item.improved}
                  </p>
                </div>
              </div>

              {/* Justification explanation */}
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-3 rounded-xl flex items-start gap-2">
                <Sparkles size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Justification:</span> {item.reason}
                </div>
              </div>

              {/* Card CTA Controls */}
              <div className="flex justify-between items-center border-t border-slate-100 dark:border-white/5 pt-3 mt-1">
                <span className="text-[10px] text-slate-400 font-bold">
                  {isResolved ? (item.accepted ? 'Applied to Resume' : 'Ignored') : 'Awaiting Review'}
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(item.id)}
                    disabled={isResolved}
                    className="p-2 border border-slate-250 dark:border-white/10 hover:border-rose-500 hover:bg-rose-500/5 text-slate-400 hover:text-rose-500 rounded-xl cursor-pointer transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <X size={13} />
                  </button>
                  <button
                    onClick={() => handleAccept(item.id, item.improved)}
                    disabled={isResolved}
                    className="p-2 bg-emerald-500 text-white rounded-xl shadow-md cursor-pointer hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1 text-[10px] font-bold px-3.5"
                  >
                    <Check size={13} /> Apply Rewrite
                  </button>
                </div>
              </div>

            </Card>
          );
        })}
      </div>

    </div>
  );
};
export default AiPolishStep;
