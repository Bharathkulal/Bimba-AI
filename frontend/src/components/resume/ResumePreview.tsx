import React from 'react';
import { useResumeBuilderStore } from '../../store/resumeBuilderStore';

export const ResumePreview: React.FC = () => {
  const { resumeData, selectedTemplate } = useResumeBuilderStore();

  if (!resumeData) return null;

  // Define styling themes matching selected templates
  const themeStyles = {
    ats_classic: {
      container: 'font-mono text-slate-900 bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-h-[70vh] overflow-y-auto',
      title: 'text-lg font-bold text-center border-b border-slate-300 pb-1 uppercase tracking-wider',
      contacts: 'text-[9px] text-center text-slate-500 mt-1 uppercase tracking-tight',
      h1: 'text-[11px] font-black border-b border-slate-200 pb-0.5 mt-4 mb-2 uppercase tracking-wide text-slate-800',
      body: 'text-[10px] text-slate-700 leading-normal mb-1.5',
      bullet: 'text-[10px] text-slate-700 ml-4 list-disc leading-relaxed',
      headerRow: 'flex justify-between items-baseline text-[10px] font-bold text-slate-800'
    },
    modern_dev: {
      container: 'font-sans text-slate-900 bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-h-[70vh] overflow-y-auto',
      title: 'text-xl font-black text-emerald-800 tracking-tight',
      contacts: 'text-[9.5px] text-emerald-600 mt-1.5 font-semibold',
      h1: 'text-[11.5px] font-bold border-l-3 border-emerald-500 pl-2 pb-0.5 mt-5 mb-2.5 uppercase tracking-wide text-emerald-800 bg-emerald-500/5 py-0.5',
      body: 'text-[10px] text-slate-650 leading-relaxed mb-2',
      bullet: 'text-[10px] text-slate-650 ml-4 list-disc leading-relaxed',
      headerRow: 'flex justify-between items-baseline text-[10px] font-bold text-emerald-850'
    },
    minimal_pro: {
      container: 'font-sans text-slate-900 bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-h-[70vh] overflow-y-auto',
      title: 'text-xl font-bold text-blue-900 tracking-wide',
      contacts: 'text-[9.5px] text-slate-500 mt-1 font-medium border-b border-slate-100 pb-2',
      h1: 'text-[11.5px] font-bold mt-5 mb-2 uppercase tracking-wide text-blue-900 border-b border-blue-900/10 pb-0.5',
      body: 'text-[10px] text-slate-700 leading-relaxed mb-2',
      bullet: 'text-[10px] text-slate-700 ml-4 list-disc leading-relaxed',
      headerRow: 'flex justify-between items-baseline text-[10px] font-semibold text-slate-800'
    },
    creative_portfolio: {
      container: 'font-sans text-slate-900 bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-h-[70vh] overflow-y-auto',
      title: 'text-xl font-black text-violet-800 tracking-tight bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent',
      contacts: 'text-[9.5px] text-pink-500 mt-1.5 font-semibold',
      h1: 'text-[11.5px] font-bold mt-5 mb-2.5 uppercase tracking-wider text-violet-700 border-b-2 border-pink-200 pb-0.5',
      body: 'text-[10px] text-slate-650 leading-relaxed mb-2',
      bullet: 'text-[10px] text-slate-650 ml-4 list-disc leading-relaxed',
      headerRow: 'flex justify-between items-baseline text-[10px] font-bold text-violet-850'
    }
  };

  const style = themeStyles[selectedTemplate as keyof typeof themeStyles] || themeStyles.ats_classic;

  const personalInfo = resumeData.personal_info;
  const contactParts = [personalInfo.email, personalInfo.phone, personalInfo.location];
  const contactStr = contactParts.filter(Boolean).join('  •  ');

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="border-b border-slate-200 dark:border-white/10 pb-2.5 text-left">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Live Template Preview
        </h4>
      </div>

      <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5">
        <div className={style.container}>
          {/* Header */}
          <div className="text-left">
            <h2 className={style.title}>{personalInfo.name || 'Your Name'}</h2>
            <div className={style.contacts}>{contactStr || 'Contact Information'}</div>
          </div>

          {/* Summary */}
          {resumeData.summary && (
            <div className="text-left">
              <h3 className={style.h1}>Professional Summary</h3>
              <p className={style.body}>{resumeData.summary}</p>
            </div>
          )}

          {/* Skills */}
          {resumeData.skills.length > 0 && (
            <div className="text-left">
              <h3 className={style.h1}>Technical Skills</h3>
              <p className={style.body}>{resumeData.skills.join(', ')}</p>
            </div>
          )}

          {/* Experience */}
          {resumeData.experience.length > 0 && (
            <div className="text-left">
              <h3 className={style.h1}>Professional Experience</h3>
              <div className="flex flex-col gap-3">
                {resumeData.experience.map((exp, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className={style.headerRow}>
                      <span>{exp.position} at {exp.company}</span>
                      <span className="font-normal text-[9px] text-slate-400">{exp.duration}</span>
                    </div>
                    {exp.description ? (
                      exp.description.includes('•') ? (
                        <ul className="list-disc pl-4 flex flex-col gap-0.5">
                          {exp.description.split('•').map(s => s.trim()).filter(Boolean).map((bullet, i) => (
                            <li key={i} className={style.bullet}>{bullet}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className={style.body}>{exp.description}</p>
                      )
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resumeData.projects.length > 0 && (
            <div className="text-left">
              <h3 className={style.h1}>Projects</h3>
              <div className="flex flex-col gap-3">
                {resumeData.projects.map((proj, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className={style.headerRow}>
                      <span>{proj.title}</span>
                      <span className="font-normal text-[9.5px] text-slate-450">({proj.technologies})</span>
                    </div>
                    <p className={style.body}>{proj.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resumeData.education.length > 0 && (
            <div className="text-left">
              <h3 className={style.h1}>Education</h3>
              <div className="flex flex-col gap-2">
                {resumeData.education.map((edu, idx) => (
                  <div key={idx} className={style.headerRow}>
                    <span>{edu.degree} — {edu.institution}</span>
                    <span className="font-normal text-[9.5px] text-slate-450">{edu.year}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
export default ResumePreview;
