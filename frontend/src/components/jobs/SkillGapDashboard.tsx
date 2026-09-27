import React, { useEffect, useState } from 'react';
import { jobsService } from '../../services/jobs';
import { useResumeStore } from '../../store/resumeStore';
import { Card } from '../Card';
import { Target, AlertCircle, Compass, Zap, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

export const SkillGapDashboard: React.FC = () => {
  const { currentResume } = useResumeStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentResume?.resume_id) {
        setLoading(false);
        setError("Please select or create an active resume to view career intelligence.");
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const result = await jobsService.getCareerIntelligence(currentResume.resume_id);
        if (result.status === "insufficient_data") {
          setError(result.message);
        } else {
          setData(result);
        }
      } catch (err) {
        setError("Failed to load career intelligence. Ensure backend is reachable.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentResume]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-4">
        <div className="h-32 bg-slate-100 rounded-2xl w-full"></div>
        <div className="h-64 bg-slate-100 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-[22px] border border-slate-200 m-4 flex flex-col items-center justify-center min-h-[300px]">
        <AlertCircle size={40} className="text-amber-500 mb-4" />
        <h3 className="text-base font-black text-slate-800">Insufficient Data</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-md">{error || "Unable to load intelligence data."}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Current Skills Summary */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Layers size={16} className="text-blue-500" /> Your Recognized Skills
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
              {data.current_skills?.length || 0} Skills
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.current_skills?.map((skill: str, i: number) => (
              <span key={i} className="text-[10px] font-bold bg-[#F8F8F8] text-[#111111] border border-[#E5E7EB] px-2.5 py-1 rounded-lg">
                {skill}
              </span>
            ))}
          </div>
        </Card>

        {/* Missing Priority Skills */}
        <Card className="p-6">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <Target size={16} className="text-rose-500" /> Priority Skill Gaps
          </h3>
          <div className="flex flex-col gap-4">
            {data.skill_gaps?.length > 0 ? (
              data.skill_gaps.map((gap: any, i: number) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xs font-black text-slate-800">{gap.skill}</h4>
                      {gap.required_count > 0 && (
                        <span className="text-[8px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">Required</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">{gap.reason}</p>
                  </div>
                  <div className="flex flex-col gap-1 sm:text-right">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Action Plan</span>
                    <p className="text-[10px] text-blue-600 font-bold max-w-[200px] leading-tight whitespace-pre-line text-left sm:text-right">
                      {gap.learning_action}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-6">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No major skill gaps identified!</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        {/* Career Role Recommendations */}
        <Card className="p-6 bg-gradient-to-br from-slate-900 to-[#111111] text-white border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Compass size={80} />
          </div>
          <h3 className="text-sm font-black text-white/90 flex items-center gap-2 mb-5 relative z-10">
            <Zap size={16} className="text-yellow-400" /> Career Alignment
          </h3>
          <div className="flex flex-col gap-5 relative z-10">
            {data.career_recommendations?.map((rec: any, i: number) => (
              <div key={i} className="flex flex-col bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-black text-white">{rec.role_title}</h4>
                  <span className="text-[10px] font-black bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-lg border border-blue-500/30">
                    {rec.match_score}% Match
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed mb-3 font-medium">
                  {rec.reason}
                </p>
                {rec.next_skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {rec.next_skills.map((s: string, idx: number) => (
                      <span key={idx} className="text-[9px] font-bold bg-white/10 text-white/80 px-2 py-0.5 rounded border border-white/10">
                        + {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Roadmap */}
        {data.learning_roadmap?.length > 0 && (
          <Card className="p-6 border-blue-100 bg-blue-50/30">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4 border-b border-blue-100 pb-3">
              <BookOpen size={16} className="text-blue-500" /> Suggested Roadmap
            </h3>
            <div className="flex flex-col gap-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-blue-200">
              {data.learning_roadmap.map((step: string, i: number) => (
                <div key={i} className="flex items-center gap-3 relative z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    i === 0 ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' :
                    i === data.learning_roadmap.length - 1 ? 'bg-blue-600 text-white shadow-md' :
                    'bg-white text-slate-600 border-2 border-blue-200'
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs font-bold ${
                    i === 0 ? 'text-emerald-700' :
                    i === data.learning_roadmap.length - 1 ? 'text-blue-700 text-sm' :
                    'text-slate-700'
                  }`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
