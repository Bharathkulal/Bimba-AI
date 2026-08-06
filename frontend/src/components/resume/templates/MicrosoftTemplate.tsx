import React from 'react';

interface TemplateProps {
  data: any;
  fontFamily: string;
  fontSize: string;
}

export const MicrosoftTemplate: React.FC<TemplateProps> = ({ data, fontFamily, fontSize }) => {
  if (!data) return null;
  const pInfo = data.personal_info || {};
  const contactParts = [pInfo.email, pInfo.phone, pInfo.location].filter(Boolean);

  return (
    <div className="p-8 bg-white text-[#111111] max-w-[800px] mx-auto text-left font-sans leading-normal">
      {/* Header - Left Aligned */}
      <div className="border-b-4 border-slate-900 pb-3 mb-5">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{pInfo.name || ''}</h1>
        <div className="text-[10px] text-slate-500 font-bold tracking-wide mt-1 flex flex-wrap gap-2.5">
          {contactParts.map((item, idx) => (
            <span key={idx}>
              {idx > 0 && <span className="mr-2 text-slate-300">|</span>}
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-4.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5 mb-1.5">Professional Summary</h3>
          <p className="text-[10.5px] text-slate-650 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <div className="mb-4.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5 mb-1.5">Core Competencies</h3>
          <p className="text-[10.5px] text-slate-650 leading-relaxed">
            {Array.isArray(data.skills) ? data.skills.join(', ') : data.skills}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-4.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5 mb-1.5">Work History</h3>
          <div className="space-y-3">
            {data.experience.map((exp: any, idx: number) => (
              <div key={idx} className="space-y-0.5 text-left">
                <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
                  <span>{exp.position} — {exp.company}</span>
                  <span className="font-medium text-[10px] text-slate-500">{exp.duration}</span>
                </div>
                {exp.description && (
                  <ul className="list-disc pl-4 space-y-0.5 mt-1 text-[10px] text-slate-600">
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
        <div className="mb-4.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5 mb-1.5">Technical Projects</h3>
          <div className="space-y-2">
            {data.projects.map((proj: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
                  <span>{proj.title}</span>
                  <span className="font-normal text-[9.5px] text-slate-450">({proj.technologies})</span>
                </div>
                {proj.description && <p className="text-[10px] text-slate-600 leading-normal">{proj.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-4.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5 mb-1.5">Education</h3>
          <div className="space-y-2">
            {data.education.map((edu: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
                  <span>{edu.degree}</span>
                  <span className="font-medium text-[10px] text-slate-500">{edu.year}</span>
                </div>
                <p className="text-[10px] text-slate-550">{edu.institution}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <div className="mb-4.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5 mb-1.5">Certifications</h3>
          <div className="space-y-2">
            {data.certifications.map((cert: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
                  <span>{cert.name}{cert.organization ? ` — ${cert.organization}` : ''}</span>
                  <span className="font-medium text-[10px] text-slate-500">{cert.issue_date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio */}
      {data.portfolioLinks && data.portfolioLinks.length > 0 && (
        <div className="mb-4.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5 mb-1.5">Portfolio</h3>
          <p className="text-[10.5px] text-slate-650 leading-relaxed">
            {data.portfolioLinks.join('  •  ')}
          </p>
        </div>
      )}
    </div>
  );
};
