import React from 'react';

interface TemplateProps {
  data: any;
  fontFamily: string;
  fontSize: string;
}

export const HarvardTemplate: React.FC<TemplateProps> = ({ data, fontFamily, fontSize }) => {
  if (!data) return null;
  const pInfo = data.personal_info || {};
  const contactParts = [pInfo.email, pInfo.phone, pInfo.location].filter(Boolean);

  const getFontClass = () => {
    switch (fontFamily) {
      case 'Calibri': return 'font-sans';
      case 'Arial': return 'font-sans';
      case 'Helvetica': return 'font-sans';
      case 'Roboto': return 'font-sans';
      case 'Times New Roman': return 'font-serif';
      default: return 'font-sans'; // Inter
    }
  };

  const fontClass = getFontClass();

  return (
    <div className={`p-8 bg-white text-[#111111] max-w-[800px] mx-auto text-left ${fontClass} leading-normal`}>
      {/* Header */}
      <div className="text-center border-b-2 border-slate-900 pb-3 mb-6">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-slate-900">{pInfo.name || 'Candidate Name'}</h1>
        <div className="text-[11px] text-slate-650 font-semibold tracking-wide mt-1.5 flex flex-wrap justify-center gap-2">
          {contactParts.map((item, idx) => (
            <span key={idx}>
              {idx > 0 && <span className="mx-2 text-slate-350">•</span>}
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-5">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">Professional Summary</h3>
          <p className="text-[11.5px] text-slate-700 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">Technical Skills</h3>
          <p className="text-[11.5px] text-slate-700 leading-relaxed">
            {Array.isArray(data.skills) ? data.skills.join(', ') : data.skills}
          </p>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">Work Experience</h3>
          <div className="space-y-4">
            {data.experience.map((exp: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-[12px] font-black text-slate-800">{exp.position}</h4>
                  <span className="text-[10.5px] font-semibold text-slate-500">{exp.duration}</span>
                </div>
                <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-600">
                  <span>{exp.company}</span>
                </div>
                {exp.description && (
                  <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px] text-slate-650">
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
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">Academic & Personal Projects</h3>
          <div className="space-y-3">
            {data.projects.map((proj: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-[12px] font-black text-slate-800">{proj.title}</h4>
                  <span className="text-[10px] text-slate-450">({proj.technologies})</span>
                </div>
                {proj.description && <p className="text-[11px] text-slate-650">{proj.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">Education</h3>
          <div className="space-y-3">
            {data.education.map((edu: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-[11.5px] font-black text-slate-800">{edu.degree}</h4>
                  <span className="text-[10.5px] font-semibold text-slate-500">{edu.year}</span>
                </div>
                <p className="text-[11px] text-slate-600 font-bold">{edu.institution}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
