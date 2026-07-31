import React from 'react';

interface TemplateProps {
  data: any;
  fontFamily: string;
  fontSize: string;
}

export const ReactiveTemplate: React.FC<TemplateProps> = ({ data, fontFamily, fontSize }) => {
  if (!data) return null;
  const pInfo = data.personal_info || {};
  const contactParts = [pInfo.email, pInfo.phone, pInfo.location].filter(Boolean);

  return (
    <div className="p-8 bg-white text-[#1E293B] max-w-[800px] mx-auto text-left font-sans leading-normal">
      {/* Header */}
      <div className="mb-6 flex justify-between items-end border-b-2 border-indigo-600 pb-3">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">{pInfo.name || ''}</h1>
          <p className="text-[10px] text-indigo-650 font-bold uppercase tracking-wider mt-1">Professional Resume</p>
        </div>
        <div className="text-[10px] text-slate-500 font-semibold tracking-wide text-right space-y-0.5">
          {contactParts.map((item, idx) => (
            <div key={idx}>{item}</div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-4.5">
          <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-1.5">Summary</h3>
          <p className="text-[11px] text-slate-650 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-4.5">
          <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">Experience</h3>
          <div className="space-y-3">
            {data.experience.map((exp: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-850">
                  <span>{exp.position} at {exp.company}</span>
                  <span className="font-semibold text-[9.5px] text-slate-450">{exp.duration}</span>
                </div>
                {exp.description && (
                  <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-slate-600">
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
          <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">Projects</h3>
          <div className="space-y-2">
            {data.projects.map((proj: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-850">
                  <span>{proj.title}</span>
                  <span className="font-normal text-[9.5px] text-slate-450">({proj.technologies})</span>
                </div>
                {proj.description && <p className="text-[10px] text-slate-600">{proj.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Skills */}
      {data.skills && data.skills.length > 0 && (
        <div className="mb-4.5">
          <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-1.5">Skills</h3>
          <p className="text-[11px] text-slate-650 leading-relaxed">
            {Array.isArray(data.skills) ? data.skills.join(', ') : data.skills}
          </p>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-4.5">
          <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">Education</h3>
          <div className="space-y-2">
            {data.education.map((edu: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-850">
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
