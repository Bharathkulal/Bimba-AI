import React from 'react';

interface TemplateProps {
  data: any;
  fontFamily: string;
  fontSize: string;
}

export const IndeedTemplate: React.FC<TemplateProps> = ({ data, fontFamily, fontSize }) => {
  if (!data) return null;
  const pInfo = data.personal_info || {};
  const contactParts = [pInfo.email, pInfo.phone, pInfo.location].filter(Boolean);

  return (
    <div className="p-8 bg-white text-[#333333] max-w-[800px] mx-auto text-left font-sans leading-snug">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">{pInfo.name || ''}</h1>
        <div className="text-[10px] text-slate-500 font-bold mt-1 flex flex-wrap gap-2">
          {contactParts.map((item, idx) => (
            <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-3.5 border-t border-slate-200 pt-3">
          <h3 className="text-xs font-black uppercase text-slate-700 mb-1">About Me</h3>
          <p className="text-[10px] text-slate-600 leading-normal">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-3.5 border-t border-slate-200 pt-3">
          <h3 className="text-xs font-black uppercase text-slate-700 mb-2">Work Experience</h3>
          <div className="space-y-3">
            {data.experience.map((exp: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[10.5px] font-bold text-slate-800">
                  <span>{exp.position}</span>
                  <span className="font-normal text-[9.5px] text-slate-400">{exp.duration}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-bold">{exp.company}</div>
                {exp.description && (
                  <ul className="list-disc pl-4 space-y-0.5 mt-1 text-[9.5px] text-slate-500">
                    {exp.description.split('•').map((bullet: string) => bullet.trim()).filter(Boolean).map((bullet: string, i: number) => (
                      <li key={i}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div className="mb-3.5 border-t border-slate-200 pt-3">
          <h3 className="text-xs font-black uppercase text-slate-700 mb-2">Projects</h3>
          <div className="space-y-2">
            {data.projects.map((proj: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[10.5px] font-bold text-slate-850">
                  <span>{proj.title}</span>
                  <span className="font-normal text-[9px] text-slate-400">({proj.technologies})</span>
                </div>
                {proj.description && <p className="text-[9.5px] text-slate-500 leading-snug">{proj.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <div className="mb-3.5 border-t border-slate-200 pt-3">
          <h3 className="text-xs font-black uppercase text-slate-700 mb-1.5">Skills</h3>
          <p className="text-[10px] text-slate-600 leading-relaxed">
            {Array.isArray(data.skills) ? data.skills.join(', ') : data.skills}
          </p>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-3.5 border-t border-slate-200 pt-3">
          <h3 className="text-xs font-black uppercase text-slate-700 mb-2">Education</h3>
          <div className="space-y-2">
            {data.education.map((edu: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[10.5px] font-bold text-slate-800">
                  <span>{edu.degree} — {edu.institution}</span>
                  <span className="font-semibold text-[9.5px] text-slate-400">{edu.year}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <div className="mb-3.5 border-t border-slate-200 pt-3">
          <h3 className="text-xs font-black uppercase text-slate-700 mb-2">Certifications</h3>
          <div className="space-y-2">
            {data.certifications.map((cert: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[10.5px] font-bold text-slate-800">
                  <span>{cert.name}{cert.organization ? ` — ${cert.organization}` : ''}</span>
                  <span className="font-semibold text-[9.5px] text-slate-400">{cert.issue_date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio */}
      {data.portfolioLinks && data.portfolioLinks.length > 0 && (
        <div className="mb-3.5 border-t border-slate-200 pt-3">
          <h3 className="text-xs font-black uppercase text-slate-700 mb-2">Portfolio</h3>
          <p className="text-[10.5px] text-slate-600 leading-relaxed">
            {data.portfolioLinks.join('  •  ')}
          </p>
        </div>
      )}
    </div>
  );
};
