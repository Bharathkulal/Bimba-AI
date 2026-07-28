import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2, ChevronRight, RefreshCw, AlertTriangle, Check, BookOpen, Key } from 'lucide-react';
import { useResumeImprovementStore } from '../../store/resumeImprovementStore';
import type { ImprovementItem } from '../../store/resumeImprovementStore';
import { Button } from '../Button';

interface ResumeImprovementProps {
  resumeId: number;
  onChangesApplied?: () => void;
}

export const ResumeImprovement: React.FC<ResumeImprovementProps> = ({
  resumeId,
  onChangesApplied
}) => {
  const { improvements, loading, error, fetchImprovements } = useResumeImprovementStore();
  const [activeTab, setActiveTab] = useState<'summary' | 'projects' | 'experience' | 'skills'>('summary');
  const [appliedSections, setAppliedSections] = useState<string[]>([]);

  useEffect(() => {
    if (resumeId) {
      fetchImprovements(resumeId);
    }
  }, [resumeId, fetchImprovements]);

  const handleApply = (sectionKey: string) => {
    setAppliedSections(prev => [...prev, sectionKey]);
    if (onChangesApplied) {
      onChangesApplied();
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-5 animate-pulse p-4">
        <div className="h-8 bg-slate-200 dark:bg-white/5 rounded-lg w-40" />
        <div className="h-44 bg-slate-200 dark:bg-white/5 rounded-2xl w-full" />
        <div className="h-20 bg-slate-200 dark:bg-white/5 rounded-2xl w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-8 px-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl max-w-md mx-auto flex flex-col items-center gap-2">
        <AlertTriangle size={28} className="text-rose-500" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Optimization Failed</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
      </div>
    );
  }

  if (!improvements) {
    return (
      <div className="w-full text-center py-8 text-slate-400 font-bold text-xs">
        No improvements available. Click "Improve My Resume" on the Dashboard.
      </div>
    );
  }

  const isApplied = (key: string) => appliedSections.includes(key);

  const renderComparisonCard = (item: ImprovementItem, key: string) => {
    const applied = isApplied(key);
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 bg-white/50 dark:bg-[#1F2937]/50 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-md relative overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Before */}
          <div className="flex flex-col gap-2 p-3 bg-rose-500/5 dark:bg-rose-950/10 border border-rose-500/10 rounded-xl relative">
            <span className="text-[9px] font-black uppercase tracking-wider text-rose-500">Original Content</span>
            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
              {item.original || "Empty or missing content"}
            </p>
          </div>

          {/* After */}
          <div className="flex flex-col gap-2 p-3 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/10 rounded-xl relative">
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500">AI Improved</span>
            <p className="text-xs text-slate-800 dark:text-white leading-relaxed font-bold">
              {item.improved}
            </p>
          </div>
        </div>

        {/* Reason card */}
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-3 rounded-xl flex items-start gap-2">
          <Sparkles size={14} className="text-emerald-500 mt-0.5 shrink-0" />
          <div className="text-[11px] text-slate-550 dark:text-slate-400 font-semibold leading-relaxed">
            <span className="font-bold text-slate-700 dark:text-slate-300">Optimization reason:</span> {item.reason}
          </div>
        </div>

        {/* Apply button */}
        <div className="flex justify-end mt-1">
          <Button
            onClick={() => handleApply(key)}
            variant={applied ? 'outline' : 'primary'}
            size="sm"
            className="font-bold gap-1.5"
            disabled={applied}
            icon={applied ? <Check size={13} /> : <Sparkles size={13} className="fill-current" />}
          >
            {applied ? 'Changes Applied' : 'Apply AI Rewrite'}
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-5 text-left max-w-3xl mx-auto px-2">
      
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Sparkles className="text-emerald-500" size={18} /> AI Resume Optimization
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-bold">Audit gaps matched and re-written silently</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200/80 dark:border-white/10 pb-1 flex-wrap">
        {[
          { id: 'summary', label: 'Summary' },
          { id: 'projects', label: 'Projects' },
          { id: 'experience', label: 'Experience' },
          { id: 'skills', label: 'Skills & Keywords' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[250px]">
        <AnimatePresence mode="wait">
          
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <motion.div
              key="summary-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              {renderComparisonCard(improvements.summary, 'summary')}
            </motion.div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <motion.div
              key="projects-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5"
            >
              {improvements.projects.length > 0 ? (
                improvements.projects.map((proj, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Project #{idx + 1}</span>
                    {renderComparisonCard(proj, `project_${idx}`)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-450 text-xs font-bold bg-slate-50/50 dark:bg-white/5 border rounded-2xl">
                  No project descriptions detected in profile.
                </div>
              )}
            </motion.div>
          )}

          {/* Experience Tab */}
          {activeTab === 'experience' && (
            <motion.div
              key="experience-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5"
            >
              {improvements.experience.length > 0 ? (
                improvements.experience.map((exp, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Experience Job Entry #{idx + 1}</span>
                    {renderComparisonCard(exp, `experience_${idx}`)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-455 text-xs font-bold bg-slate-50/50 dark:bg-white/5 border rounded-2xl">
                  No experience entries detected in profile.
                </div>
              )}
            </motion.div>
          )}

          {/* Skills & Keywords Tab */}
          {activeTab === 'skills' && (
            <motion.div
              key="skills-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5"
            >
              {/* Skill Gaps recommendations */}
              <div className="bg-white/50 dark:bg-[#1F2937]/50 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <BookOpen size={14} className="text-emerald-500" /> Skill Integration recommendations
                </h4>
                <ul className="flex flex-col gap-2">
                  {improvements.skill_recommendations.map((rec, idx) => (
                    <li key={idx} className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold flex items-start gap-2 bg-slate-50 dark:bg-white/5 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                      <ChevronRight size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ATS Keywords */}
              <div className="bg-white/50 dark:bg-[#1F2937]/50 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Key size={14} className="text-emerald-500" /> Recommended ATS Keywords
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {improvements.ats_keywords.map((kw, idx) => (
                    <span key={idx} className="bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-450 font-bold px-2.5 py-1 rounded-xl text-[10px]">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
};
