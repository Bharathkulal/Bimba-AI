import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Sparkles, CheckCircle2, AlertTriangle, ShieldAlert, BookOpen, Compass, Award } from 'lucide-react';
import { apiClient } from '../../services/api';
import { Button } from '../Button';

interface ResumeAIAnalysisProps {
  resumeId: number;
  initialAnalysis?: any;
  onAnalysisComplete?: () => void;
}

export const ResumeAIAnalysis: React.FC<ResumeAIAnalysisProps> = ({
  resumeId,
  initialAnalysis,
  onAnalysisComplete
}) => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>(
    initialAnalysis ? 'success' : 'idle'
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [analysis, setAnalysis] = useState<any>(initialAnalysis || null);

  const startAiAnalysis = async () => {
    if (!resumeId) return;
    setStatus('processing');
    setErrorMessage('');

    try {
      const response = await apiClient.post(`/api/resume/analyze/${resumeId}`);
      const resData = response.data;
      
      if (resData.success) {
        setAnalysis(resData.analysis);
        setStatus('success');
        if (onAnalysisComplete) {
          onAnalysisComplete();
        }
      } else {
        throw new Error(resData.message || 'AI Analysis failed.');
      }
    } catch (err: any) {
      console.error('Resume AI analysis error:', err);
      const detailMsg = err.response?.data?.detail || err.message || 'AI service temporarily unavailable';
      setErrorMessage(detailMsg);
      setStatus('error');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
    if (score >= 60) return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
    return 'text-rose-500 border-rose-500/20 bg-rose-500/5';
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/70 dark:bg-[#1F2937]/75 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300">
      <AnimatePresence mode="wait">
        
        {/* Idle State */}
        {status === 'idle' && (
          <motion.div
            key="idle-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4 text-center py-6"
          >
            <div className="flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-md">
                <Sparkles size={26} className="animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white mt-4">
                Run AI Recruiter Audit
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                Scan your resume using the Bimba AI Intelligence Engine. Evaluates keyword matches, structure, impact metrics, and builds a personalized career optimization scorecard.
              </p>
            </div>

            <Button onClick={startAiAnalysis} className="w-full sm:max-w-xs mx-auto font-bold mt-4 flex items-center justify-center gap-2">
              <Sparkles size={14} className="fill-current" /> Analyze My Resume
            </Button>
          </motion.div>
        )}

        {/* Processing State */}
        {status === 'processing' && (
          <motion.div
            key="processing-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-10 gap-4 text-center"
          >
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-white/5 border-t-emerald-500 animate-spin" />
              <Sparkles size={24} className="text-emerald-500 animate-pulse" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">AI is analyzing your resume...</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-455 mt-1.5 max-w-sm leading-relaxed">Evaluating professional experience, scorecards, skills coverage, and ATS keyword densities</p>
            </div>
          </motion.div>
        )}

        {/* Success State */}
        {status === 'success' && analysis && (
          <motion.div
            key="success-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6 text-left"
          >
            {/* Header / Scores */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-500" size={20} /> AI Recruiter Scorecard
                </h3>
                <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1">Audit complete — assessment stored in candidate hub</p>
              </div>
              
              <div className="flex gap-3">
                <div className={`border rounded-xl px-4 py-2 text-center min-w-[100px] ${getScoreColor(analysis.overall_score)}`}>
                  <div className="text-[10px] uppercase tracking-wider font-bold opacity-75">Health</div>
                  <div className="text-2xl font-black mt-0.5">{analysis.overall_score}%</div>
                </div>
                <div className={`border rounded-xl px-4 py-2 text-center min-w-[100px] ${getScoreColor(analysis.ats_score)}`}>
                  <div className="text-[10px] uppercase tracking-wider font-bold opacity-75">ATS Match</div>
                  <div className="text-2xl font-black mt-0.5">{analysis.ats_score}%</div>
                </div>
              </div>
            </div>

            {/* Strengths & Weaknesses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Strengths */}
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 uppercase tracking-wider">
                  <Award size={14} /> Key Strengths
                </h4>
                <ul className="flex flex-col gap-2">
                  {analysis.strengths.map((str: string, idx: number) => (
                    <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-rose-600 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle size={14} /> Critical Gaps
                </h4>
                <ul className="flex flex-col gap-2">
                  {analysis.weaknesses.map((weak: string, idx: number) => (
                    <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-start gap-2">
                      <span className="text-rose-500 mt-0.5">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Missing Skills */}
            {analysis.missing_skills && analysis.missing_skills.length > 0 && (
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-650 dark:text-slate-350 flex items-center gap-1.5 uppercase tracking-wider">
                  <BookOpen size={14} /> Missing Skills (Recommended)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missing_skills.map((skill: string, idx: number) => (
                    <span key={idx} className="bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Suggestions */}
            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-655 dark:text-slate-350 flex items-center gap-1.5 uppercase tracking-wider">
                  <Compass size={14} /> AI Optimization Steps
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {analysis.suggestions.map((sug: string, idx: number) => (
                    <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-start gap-2.5">
                      <span className="bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={() => setStatus('idle')} variant="outline" className="w-full font-bold border border-slate-200 dark:border-white/15">
              Re-run Recruiter Audit
            </Button>
          </motion.div>
        )}

        {/* Error State */}
        {status === 'error' && errorMessage && (
          <motion.div
            key="error-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4 text-center py-6"
          >
            <div className="flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-md">
                <ShieldAlert size={26} />
              </div>
              <h3 className="text-lg font-black text-rose-500 mt-4">
                Analysis Service Interrupted
              </h3>
              <p className="text-xs text-slate-500 mt-2 px-4 leading-relaxed max-w-md mx-auto">
                {errorMessage}
              </p>
            </div>

            <div className="flex justify-center gap-3 mt-4">
              <Button onClick={startAiAnalysis} className="font-bold px-6">
                Retry Analysis
              </Button>
              <Button onClick={() => setStatus('idle')} variant="outline" className="font-bold border border-slate-250">
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
