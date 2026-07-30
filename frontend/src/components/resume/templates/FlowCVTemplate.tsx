import React from 'react';

interface TemplateProps {
  data: any;
  fontFamily: string;
  fontSize: string;
}

export const FlowCVTemplate: React.FC<TemplateProps> = ({ data, fontFamily, fontSize }) => {
  if (!data) return null;
  const pInfo = data.personal_info || {};
  const contactParts = [pInfo.email, pInfo.phone, pInfo.location].filter(Boolean);

  return (
    <div className="p-8 bg-white text-[#2D3748] max-w-[800px] mx-auto text-left font-sans leading-normal">
      {/* Header - Flowy Minimalist */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-[#1A202C] tracking-tight">{pInfo.name || 'Candidate Name'}</h1>
        <div className="text-[10.5px] text-slate-500 font-semibold tracking-wide mt-1.5 flex flex-wrap gap-3">
          {contactParts.map((item, idx) => (
            <span key={idx}>
              {idx > 0 && <span className="mr-3 text-slate-300">/</span>}
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-5">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#4A5568] border-b border-slate-100 pb-1 mb-2">About</h3>
          <p className="text-[11px] text-slate-650 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#4A5568] border-b border-slate-100 pb-1 mb-2.5">Experience</h3>
          <div className="space-y-3.5">
            {data.experience.map((exp: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
                  <span>{exp.position}</span>
                  <span className="font-semibold text-[9.5px] text-slate-400">{exp.duration}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-bold">{exp.company}</div>
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
        <div className="mb-5">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#4A5568] border-b border-slate-100 pb-1 mb-2.5">Projects</h3>
          <div className="space-y-2.5">
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

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#4A5568] border-b border-slate-100 pb-1 mb-2">Skills</h3>
          <p className="text-[10.5px] text-slate-650 leading-relaxed">
            {Array.isArray(data.skills) ? data.skills.join(', ') : data.skills}
          </p>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#4A5568] border-b border-slate-100 pb-1 mb-2">Education</h3>
          <div className="space-y-2">
            {data.education.map((edu: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
                  <span>{edu.degree} — {edu.institution}</span>
                  <span className="font-semibold text-[9.5px] text-slate-450">{edu.year}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
