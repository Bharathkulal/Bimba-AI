import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2, RefreshCw, AlertTriangle, Check, BookOpen, Key, Zap, ShieldCheck, TrendingUp } from 'lucide-react';
import { useResumeImprovementStore } from '../../store/resumeImprovementStore';
import type { ImprovementItem } from '../../store/resumeImprovementStore';
import { Button } from '../Button';

interface ResumeImprovementProps {
  resumeId: number;
  onChangesApplied?: () => void;
}

const diffWords = (orig: string, imp: string) => {
  if (!orig) return { origHtml: '', impHtml: <span>{imp}</span> };
  
  const origWords = orig.split(/\s+/);
  const impWords = imp.split(/\s+/);
  
  const origSet = new Set(origWords.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')));
  const impSet = new Set(impWords.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')));
  
  const origHtml = origWords.map((word, idx) => {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isRemoved = !impSet.has(cleanWord);
    return (
      <React.Fragment key={idx}>
        <span className={isRemoved ? 'text-rose-500 line-through font-semibold' : ''}>
          {word}
        </span>
        {" "}
      </React.Fragment>
    );
  });

  const impHtml = impWords.map((word, idx) => {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isAdded = !origSet.has(cleanWord);
    return (
      <React.Fragment key={idx}>
        <span className={isAdded ? 'text-emerald-600 dark:text-emerald-450 underline decoration-emerald-500/50 font-extrabold' : ''}>
          {word}
        </span>
        {" "}
      </React.Fragment>
    );
  });

  return { origHtml, impHtml };
};

export const ResumeImprovement: React.FC<ResumeImprovementProps> = ({
  resumeId,
  onChangesApplied
}) => {
  const { improvements, loading, applying, error, fetchImprovements, applyAllImprovements } = useResumeImprovementStore();
  const [activeTab, setActiveTab] = useState<'summary' | 'projects' | 'experience' | 'skills'>('summary');
  const [appliedAll, setAppliedAll] = useState<boolean>(false);
  const [appliedSections, setAppliedSections] = useState<string[]>([]);

  useEffect(() => {
    if (resumeId) {
      fetchImprovements(resumeId);
    }
  }, [resumeId, fetchImprovements]);

  const handleApplySingle = async (sectionKey: string) => {
    setAppliedSections(prev => [...prev, sectionKey]);
    const success = await applyAllImprovements(resumeId, [sectionKey]);
    if (success && onChangesApplied) {
      onChangesApplied();
    }
  };

  const handleApplyAll = async () => {
    const success = await applyAllImprovements(resumeId);
    if (success) {
      setAppliedAll(true);
      setAppliedSections(['summary', 'projects', 'experience', 'skills']);
      if (onChangesApplied) {
        onChangesApplied();
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-5 animate-pulse p-4">
        <div className="h-24 bg-slate-200 dark:bg-white/5 rounded-2xl w-full" />
        <div className="h-8 bg-slate-200 dark:bg-white/5 rounded-lg w-40" />
        <div className="h-44 bg-slate-200 dark:bg-white/5 rounded-2xl w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-8 px-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl max-w-md mx-auto flex flex-col items-center gap-2">
        <AlertTriangle size={28} className="text-rose-500" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Groq AI Optimization Failed</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{error}</p>
      </div>
    );
  }

  if (!improvements) {
    return (
      <div className="w-full text-center py-8 text-slate-400 font-bold text-xs">
        No improvements generated yet. Click "Improve My Resume" to generate 95%+ ATS optimization.
      </div>
    );
  }

  const targetScore = improvements.target_ats_score || 97;
  const scoreBefore = improvements.ats_score_before || 72;
  const delta = targetScore - scoreBefore;

  const isApplied = (key: string) => appliedAll || appliedSections.includes(key);

  const renderComparisonCard = (item: ImprovementItem, key: string) => {
    const applied = isApplied(key);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(() => {
            const { origHtml, impHtml } = diffWords(item.original || '', item.improved || '');
            return (
              <>
                {/* Before */}
                <div className="flex flex-col gap-2 p-3.5 bg-rose-50 dark:bg-rose-500/5 border border-rose-200/60 dark:border-rose-500/10 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-wider text-rose-500">Original Content</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {item.original ? origHtml : "Empty or missing content"}
                  </p>
                </div>

                {/* After */}
                <div className="flex flex-col gap-2 p-3.5 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200/60 dark:border-emerald-500/10 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-450 flex items-center gap-1">
                    <Zap size={11} /> AI-Polished Version
                  </span>
                  <p className="text-xs text-slate-900 dark:text-white leading-relaxed font-medium">
                    {impHtml}
                  </p>
                </div>
              </>
            );
          })()}
        </div>

        {/* Reason card */}
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-3 rounded-xl flex items-start gap-2">
          <Sparkles size={14} className="text-emerald-500 mt-0.5 shrink-0" />
          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
            <span className="font-bold text-slate-800 dark:text-slate-200">Groq AI Optimization:</span> {item.reason}
          </div>
        </div>

        {/* Apply button */}
        <div className="flex justify-end mt-1">
          <Button
            onClick={() => handleApplySingle(key)}
            variant={applied ? 'outline' : 'primary'}
            size="sm"
            className="font-bold gap-1.5"
            disabled={applied || applying}
            icon={applied ? <Check size={13} /> : <Sparkles size={13} className="fill-current" />}
          >
            {applied ? 'Applied to Profile' : 'Apply Section Rewrite'}
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-5 text-left max-w-3xl mx-auto px-2">

      {/* 95%+ ATS Score Upgrade Banner — Clean card matching website theme */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-white/5 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
      >
        {/* Subtle background glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-400/5 dark:bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck size={30} className="text-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={11} /> AI-Powered Resume Polish
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
              Resume Improvement Suggestions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 max-w-md leading-relaxed">
              {improvements.overall_improvement_summary || "Grammar corrections, stronger action verbs, and improved sentence structure for better ATS readability."}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end shrink-0 gap-3 w-full md:w-auto relative z-10">
          {/* Score Display */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5">
            <div className="text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Before</span>
              <span className="text-lg font-black text-slate-400 line-through">{scoreBefore}%</span>
            </div>
            <ArrowRight size={16} className="text-emerald-500" />
            <div className="text-center">
              <span className="text-[9px] font-bold text-emerald-500 uppercase block">After</span>
              <span className="text-2xl font-black text-emerald-500">{targetScore}%</span>
            </div>
            {delta > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                <TrendingUp size={10} /> +{delta}%
              </span>
            )}
          </div>

          <Button
            onClick={handleApplyAll}
            disabled={appliedAll || applying}
            className="btn-glow-green text-xs font-black py-2.5 px-5 w-full md:w-auto flex items-center justify-center gap-2"
          >
            {applying ? (
              <><RefreshCw size={14} className="animate-spin" /> Applying Changes...</>
            ) : appliedAll ? (
              <><CheckCircle2 size={14} className="text-emerald-300" /> Improvements Applied!</>
            ) : (
              <><Zap size={14} className="fill-current" /> Apply All Improvements</>
            )}
          </Button>
        </div>
      </motion.div>

      {appliedAll && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            Your active resume has been updated to {targetScore}% ATS Compatibility!
          </span>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-white/10 pb-1 flex-wrap">
        {[
          { id: 'summary', label: 'Summary' },
          { id: 'projects', label: 'Projects' },
          { id: 'experience', label: 'Experience' },
          { id: 'skills', label: 'Skills & Keywords' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[250px]">
        <AnimatePresence mode="popLayout">

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
                    <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Project #{idx + 1}</span>
                    {renderComparisonCard(proj, `project_${idx}`)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
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
                    <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Experience Entry #{idx + 1}</span>
                    {renderComparisonCard(exp, `experience_${idx}`)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
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
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <BookOpen size={14} className="text-emerald-500" /> Skill Integration Recommendations
                </h4>
                <ul className="flex flex-col gap-2">
                  {improvements.skill_recommendations.map((rec, idx) => (
                    <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold flex items-start gap-2 bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
                      <Zap size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ATS Keywords */}
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Key size={14} className="text-emerald-500" /> Recommended ATS Keywords Integrated
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {improvements.ats_keywords.map((kw, idx) => (
                    <span key={idx} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-xl text-[10px]">
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
