import React from 'react';
import { useResumeBuilderContext } from '../ResumeBuilderContext';
import { Card } from '../../Card';
import { Button } from '../../Button';
import { Award, Check, Plus, AlertCircle } from 'lucide-react';

export const AtsScoreStep: React.FC = () => {
  const { atsScore, setAtsScore, parsedData, triggerAutosave } = useResumeBuilderContext();

  const subScores = [
    { label: 'Keyword Match', score: 78 },
    { label: 'Formatting Hierarchy', score: 92 },
    { label: 'Section Completeness', score: 85 },
    { label: 'Skill Gap Alignment', score: 68 }
  ];

  const matchedSkills = parsedData?.technicalSkills?.slice(0, 5) || ['React', 'JavaScript', 'HTML', 'CSS', 'Tailwind'];
  const missingSkills = ['Node.js', 'MongoDB', 'Docker', 'RESTful APIs', 'TypeScript'];

  const handleAddSkill = async (skill: string) => {
    if (!parsedData) return;
    const current = parsedData.technicalSkills || [];
    if (!current.includes(skill)) {
      const updated = [...current, skill];
      await triggerAutosave({ technicalSkills: updated });
    }
  };

  return (
    <div className="max-w-5xl w-full flex flex-col gap-6 py-4 text-left">
      
      {/* ATS score hero segment */}
      <Card className="p-6 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-md grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* Score gauge circle */}
        <div className="flex flex-col items-center justify-center text-center gap-2 border-r-0 md:border-r border-slate-100 dark:border-white/5 pr-0 md:pr-6 py-2">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Simple circular background outline */}
            <div className="absolute inset-0 rounded-full border-8 border-slate-100 dark:border-white/5" />
            {/* Accent score circle */}
            <div className="absolute inset-0 rounded-full border-8 border-emerald-500 border-t-transparent border-r-transparent transform -rotate-45" />
            <span className="text-3xl font-black text-slate-800 dark:text-white">{atsScore}%</span>
          </div>
          <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Overall ATS Score</span>
        </div>

        {/* Subscore bars */}
        <div className="md:col-span-2 space-y-3.5">
          {subScores.map((sub, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>{sub.label}</span>
                <span>{sub.score}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${sub.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Matched vs Missing Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Matched Skills */}
        <Card className="p-5 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-sm space-y-3">
          <h4 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Check size={14} className="text-emerald-500" /> Matched Skills Identified
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.map((skill, idx) => (
              <span key={idx} className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold px-2.5 py-1 rounded-xl text-[10px] flex items-center gap-1">
                <Check size={10} /> {skill}
              </span>
            ))}
          </div>
        </Card>

        {/* Missing Skills */}
        <Card className="p-5 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-sm space-y-3">
          <h4 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle size={14} className="text-rose-500" /> Missing ATS Target Keywords
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {missingSkills.map((skill, idx) => (
              <button
                key={idx}
                onClick={() => handleAddSkill(skill)}
                className="bg-slate-50 hover:bg-emerald-500/10 border border-slate-200 dark:border-white/5 dark:bg-white/5 text-slate-600 hover:text-emerald-500 dark:text-slate-300 font-bold px-2.5 py-1 rounded-xl text-[10px] flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus size={10} /> {skill}
              </button>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
};
export default AtsScoreStep;
