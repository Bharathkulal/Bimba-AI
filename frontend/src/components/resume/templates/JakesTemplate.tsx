import React from 'react';

interface TemplateProps {
  data: any;
  fontFamily: string;
  fontSize: string;
}

export const JakesTemplate: React.FC<TemplateProps> = ({ data, fontFamily, fontSize }) => {
  if (!data) return null;
  const pInfo = data.personal_info || {};
  const contactParts = [pInfo.email, pInfo.phone, pInfo.location].filter(Boolean);

  const getFontClass = () => {
    switch (fontFamily) {
      case 'Times New Roman': return 'font-serif';
      default: return 'font-sans'; // Inter / Arial etc.
    }
  };

  return (
    <div className={`p-8 bg-white text-[#111111] max-w-[800px] mx-auto text-left ${getFontClass()} leading-normal`}>
      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="text-2xl font-bold tracking-wide uppercase">{pInfo.name || ''}</h1>
        <div className="text-[10px] text-slate-500 font-medium tracking-wide mt-1.5 flex flex-wrap justify-center gap-1.5">
          {contactParts.map((item, idx) => (
            <span key={idx}>
              {idx > 0 && <span className="mx-1 text-slate-350">|</span>}
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-4">
          <h3 className="text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">Summary</h3>
          <p className="text-[10.5px] text-slate-650 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-4">
          <h3 className="text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">Experience</h3>
          <div className="space-y-3">
            {data.experience.map((exp: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[11px] font-black text-slate-800">
                  <span>{exp.position}</span>
                  <span className="font-medium text-[10px] text-slate-500">{exp.duration}</span>
                </div>
                <div className="flex justify-between items-baseline text-[10.5px] font-bold text-slate-600">
                  <span>{exp.company}</span>
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
        <div className="mb-4">
          <h3 className="text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">Projects</h3>
          <div className="space-y-2">
            {data.projects.map((proj: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[11px] font-black text-slate-800">
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
        <div className="mb-4">
          <h3 className="text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">Skills</h3>
          <p className="text-[10.5px] text-slate-650 leading-relaxed">
            {Array.isArray(data.skills) ? data.skills.join(', ') : data.skills}
          </p>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-4">
          <h3 className="text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">Education</h3>
          <div className="space-y-2">
            {data.education.map((edu: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[11px] font-black text-slate-800">
                  <span>{edu.degree} — {edu.institution}</span>
                  <span className="font-medium text-[10px] text-slate-500">{edu.year}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
