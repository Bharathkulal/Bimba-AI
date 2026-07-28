import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Award, ShieldCheck, CheckCircle2, AlertTriangle, Compass, BookOpen, 
  Sparkles, Briefcase, FileText, ChevronRight 
} from 'lucide-react';
import { useResumeHealthStore } from '../../store/resumeHealthStore';
import { useUserStore } from '../../store/userStore';

interface ResumeHealthDashboardProps {
  resumeId: number;
  onImproveClick?: () => void;
}

export const ResumeHealthDashboard: React.FC<ResumeHealthDashboardProps> = ({
  resumeId,
  onImproveClick
}) => {
  const { healthData, loading, error, fetchHealthData } = useResumeHealthStore();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (resumeId) {
      fetchHealthData(resumeId);
    }
  }, [resumeId, fetchHealthData]);

  // Render skeleton loading state
  if (loading) {
    return (
      <div className="w-full flex flex-col gap-6 animate-pulse p-4">
        <div className="h-10 bg-slate-200 dark:bg-white/5 rounded-xl w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-white/5 rounded-2xl col-span-1" />
          <div className="h-64 bg-slate-200 dark:bg-white/5 rounded-2xl col-span-1" />
          <div className="h-64 bg-slate-200 dark:bg-white/5 rounded-2xl col-span-1" />
        </div>
        <div className="h-40 bg-slate-200 dark:bg-white/5 rounded-2xl w-full" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="w-full text-center py-12 px-6 bg-rose-500/5 border border-rose-500/15 rounded-2xl max-w-lg mx-auto flex flex-col items-center gap-3">
        <AlertTriangle size={36} className="text-rose-500" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">Failed to load Dashboard</h3>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{error}</p>
      </div>
    );
  }

  if (!healthData) return null;

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-emerald-500 stroke-emerald-500';
    if (score >= 60) return 'text-amber-500 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/5 border-emerald-500/10';
    if (score >= 60) return 'bg-amber-500/5 border-amber-500/10';
    return 'bg-rose-500/5 border-rose-500/10';
  };

  // Circular progress helpers
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthData.overall_score / 100) * circumference;

  // Split technical skills list from student store (for comparison)
  const currentSkills = user?.skills 
    ? user.skills.split(',').map(s => s.trim()).filter(Boolean) 
    : ['React', 'Python', 'MongoDB']; // Default fallback if empty

  return (
    <div className="w-full flex flex-col gap-6 text-left max-w-6xl mx-auto px-1 sm:px-4 py-2">
      
      {/* Upper Grid: Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Resume Health Circular Score Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 dark:bg-[#1F2937]/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400">Resume Health</h3>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle 
                cx="72" cy="72" r={radius} 
                className="stroke-slate-100 dark:stroke-white/5" 
                strokeWidth="10" fill="transparent" 
              />
              <motion.circle 
                cx="72" cy="72" r={radius} 
                className={getScoreColorClass(healthData.overall_score)}
                strokeWidth="10" fill="transparent" 
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">
                {healthData.overall_score}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 font-bold">/ 100</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${getScoreBgClass(healthData.overall_score)} ${getScoreColorClass(healthData.overall_score)}`}>
              {healthData.rating}
            </span>
          </div>
        </motion.div>

        {/* 2. ATS Score Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 dark:bg-[#1F2937]/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col gap-2">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400">ATS Compatibility</h3>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-5xl font-black text-slate-800 dark:text-white leading-none">
                {healthData.ats_score}%
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-white/5 p-3.5 rounded-2xl border border-slate-100 dark:border-white/5">
              <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={16} />
              <p className="text-[11px] text-slate-550 dark:text-slate-400 font-semibold leading-relaxed">
                {healthData.ats_score >= 80 
                  ? "Your resume is highly optimized and likely to pass automated recruiter screening systems."
                  : "Your resume template is readable, but structural keyterm adjustments are required to guarantee match success."}
              </p>
            </div>
            <div className="text-[10px] text-emerald-500 dark:text-emerald-400 font-extrabold flex items-center gap-1">
              <Sparkles size={11} /> Standard ATS Parser compliant
            </div>
          </div>
        </motion.div>

        {/* 3. Section Performance Progress bars */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 dark:bg-[#1F2937]/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-4 relative overflow-hidden"
        >
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400">Section Performance</h3>
          
          <div className="flex flex-col gap-3.5 mt-1">
            {Object.entries(healthData.section_scores).map(([section, score], idx) => (
              <div key={section} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[11px] font-extrabold">
                  <span className="capitalize text-slate-700 dark:text-slate-300">{section}</span>
                  <span className={score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-rose-500'}>
                    {score}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1.0, delay: idx * 0.1 }}
                    className={`h-full rounded-full ${
                      score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Middle Grid: Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 4. Strengths Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6 flex flex-col gap-4 shadow-sm"
        >
          <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-1.5 uppercase tracking-wider">
            <Award size={15} /> Your Resume Strengths
          </h4>
          <div className="flex flex-col gap-3">
            {healthData.strengths.map((str, idx) => (
              <div key={idx} className="flex items-start gap-2.5 bg-white/40 dark:bg-white/5 p-3 rounded-2xl border border-emerald-500/10">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-relaxed">{str}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 5. Improvement Areas */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 flex flex-col gap-4 shadow-sm"
        >
          <h4 className="text-xs font-bold text-amber-600 dark:text-amber-455 flex items-center gap-1.5 uppercase tracking-wider">
            <AlertTriangle size={15} /> Improve These Areas
          </h4>
          <div className="flex flex-col gap-3">
            {healthData.weaknesses.map((weak, idx) => (
              <div key={idx} className="flex items-start gap-2.5 bg-white/40 dark:bg-white/5 p-3 rounded-2xl border border-amber-500/10">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={14} />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-relaxed">{weak}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Lower Grid: Skill Gaps & AI Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 6. Skill Gap Analysis (2 columns width on desktop) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 dark:bg-[#1F2937]/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-xl col-span-1 md:col-span-2 flex flex-col gap-4"
        >
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <BookOpen size={14} /> Skill Gap Analysis
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {/* Current skills */}
            <div className="flex flex-col gap-2.5 bg-slate-50/50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Skills (Extracted)</span>
              <div className="flex flex-wrap gap-1.5">
                {currentSkills.map((skill, idx) => (
                  <span key={idx} className="bg-slate-250 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded text-[10px]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Recommended/Missing skills */}
            <div className="flex flex-col gap-2.5 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Recommended Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {healthData.missing_skills.length > 0 ? (
                  healthData.missing_skills.map((skill, idx) => (
                    <span key={idx} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border border-emerald-500/10 font-bold px-2 py-0.5 rounded text-[10px]">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-455 font-bold">No critical skill gaps identified</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Suggestions / Recommendations Checklist */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 dark:bg-[#1F2937]/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-xl col-span-1 flex flex-col gap-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Compass size={14} /> AI Recommendations
          </h3>
          
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[180px] mt-1 pr-1">
            {healthData.improvement_suggestions.map((sug, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                <span className="bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{sug}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* 7. Action Controls Buttons Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200/80 dark:border-white/10 pt-6 mt-2"
      >
        <button 
          onClick={onImproveClick}
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all text-xs"
        >
          <Sparkles size={14} className="fill-current" /> Improve My Resume
        </button>
        <button className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-bold px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all text-xs">
          <FileText size={14} /> Generate ATS Resume
        </button>
        <button className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-bold px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all text-xs">
          <Briefcase size={14} /> Find Matching Jobs <ChevronRight size={14} className="ml-1" />
        </button>
      </motion.div>

    </div>
  );
};
