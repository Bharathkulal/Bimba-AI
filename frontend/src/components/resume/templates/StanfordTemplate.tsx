import React from 'react';

interface TemplateProps {
  data: any;
  fontFamily: string;
  fontSize: string;
}

export const StanfordTemplate: React.FC<TemplateProps> = ({ data, fontFamily, fontSize }) => {
  if (!data) return null;
  const pInfo = data.personal_info || {};
  const contactParts = [pInfo.email, pInfo.phone, pInfo.location].filter(Boolean);

  return (
    <div className="p-8 bg-white text-[#1E293B] max-w-[800px] mx-auto text-left font-serif leading-relaxed">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-red-800">{pInfo.name || ''}</h1>
        <div className="text-[11px] text-slate-500 font-semibold mt-1 tracking-wider uppercase flex flex-wrap justify-center gap-3">
          {contactParts.map((item, idx) => (
            <span key={idx}>
              {idx > 0 && <span className="mx-1.5 text-red-800">•</span>}
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-5">
          <h3 className="text-[12px] font-black uppercase tracking-wider text-red-800 border-b-2 border-red-800/10 pb-0.5 mb-2">Professional Summary</h3>
          <p className="text-[11px] text-slate-700 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[12px] font-black uppercase tracking-wider text-red-800 border-b-2 border-red-800/10 pb-0.5 mb-2">Education</h3>
          <div className="space-y-3">
            {data.education.map((edu: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
                  <span>{edu.institution}</span>
                  <span className="font-medium text-[10.5px] text-slate-500">{edu.year}</span>
                </div>
                <p className="text-[10.5px] text-slate-650 italic">{edu.degree}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[12px] font-black uppercase tracking-wider text-red-800 border-b-2 border-red-800/10 pb-0.5 mb-2">Academic & Research Experience</h3>
          <div className="space-y-4">
            {data.experience.map((exp: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-baseline text-[11.5px] font-bold text-slate-850">
                  <span>{exp.position}</span>
                  <span className="font-semibold text-[10px] text-slate-500">{exp.duration}</span>
                </div>
                <div className="text-[10.5px] text-slate-600 italic font-medium">{exp.company}</div>
                {exp.description && (
                  <ul className="list-disc pl-4 space-y-1 mt-1 text-[10.5px] text-slate-650">
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
        <div className="mb-5">
          <h3 className="text-[12px] font-black uppercase tracking-wider text-red-800 border-b-2 border-red-800/10 pb-0.5 mb-2">Projects & Publications</h3>
          <div className="space-y-3">
            {data.projects.map((proj: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-850">
                  <span>{proj.title}</span>
                  <span className="font-normal text-[9.5px] text-slate-450">({proj.technologies})</span>
                </div>
                {proj.description && <p className="text-[10.5px] text-slate-650">{proj.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Skills */}
      {data.skills && data.skills.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[12px] font-black uppercase tracking-wider text-red-800 border-b-2 border-red-800/10 pb-0.5 mb-2">Technical Skills</h3>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            {Array.isArray(data.skills) ? data.skills.join(', ') : data.skills}
          </p>
        </div>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[12px] font-black uppercase tracking-wider text-red-800 border-b-2 border-red-800/10 pb-0.5 mb-2">Certifications</h3>
          <div className="space-y-3">
            {data.certifications.map((cert: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
                  <span>{cert.name}{cert.organization ? ` — ${cert.organization}` : ''}</span>
                  <span className="font-medium text-[10.5px] text-slate-500">{cert.issue_date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio */}
      {data.portfolioLinks && data.portfolioLinks.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[12px] font-black uppercase tracking-wider text-red-800 border-b-2 border-red-800/10 pb-0.5 mb-2">Portfolio</h3>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            {data.portfolioLinks.join('  •  ')}
          </p>
        </div>
      )}
    </div>
  );
};
