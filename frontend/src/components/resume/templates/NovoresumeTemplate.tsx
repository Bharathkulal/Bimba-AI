import React from 'react';

interface TemplateProps {
  data: any;
  fontFamily: string;
  fontSize: string;
}

export const NovoresumeTemplate: React.FC<TemplateProps> = ({ data, fontFamily, fontSize }) => {
  if (!data) return null;
  const pInfo = data.personal_info || {};
  const contactParts = [pInfo.email, pInfo.phone, pInfo.location].filter(Boolean);

  return (
    <div className="p-8 bg-white text-[#2C3E50] max-w-[800px] mx-auto text-left font-sans leading-normal">
      {/* Header - Colored Accent Box top border */}
      <div className="border-t-4 border-[#3498DB] pt-4 mb-5 text-center">
        <h1 className="text-2xl font-black tracking-tight text-slate-800 uppercase">{pInfo.name || 'Candidate Name'}</h1>
        <div className="text-[10px] text-slate-500 font-bold mt-1.5 flex flex-wrap justify-center gap-2">
          {contactParts.map((item, idx) => (
            <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-slate-650">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-4">
          <h3 className="text-xs font-black uppercase text-[#3498DB] border-b border-[#3498DB]/20 pb-0.5 mb-1.5">Profile</h3>
          <p className="text-[10.5px] text-slate-650 leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-black uppercase text-[#3498DB] border-b border-[#3498DB]/20 pb-0.5 mb-1.5">Work Experience</h3>
          <div className="space-y-3">
            {data.experience.map((exp: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
                  <span>{exp.position}</span>
                  <span className="font-semibold text-[9.5px] text-slate-500">{exp.duration}</span>
                </div>
                <div className="text-[10px] text-[#3498DB] font-semibold">{exp.company}</div>
                {exp.description && (
                  <ul className="list-disc pl-4 space-y-0.5 mt-1 text-[9.5px] text-slate-600">
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
          <h3 className="text-xs font-black uppercase text-[#3498DB] border-b border-[#3498DB]/20 pb-0.5 mb-1.5">Personal Projects</h3>
          <div className="space-y-2">
            {data.projects.map((proj: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
                  <span>{proj.title}</span>
                  <span className="font-normal text-[9.5px] text-slate-450">({proj.technologies})</span>
                </div>
                {proj.description && <p className="text-[9.5px] text-slate-600 leading-normal">{proj.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-black uppercase text-[#3498DB] border-b border-[#3498DB]/20 pb-0.5 mb-1.5">Skills</h3>
          <p className="text-[10.5px] text-slate-650 leading-relaxed">
            {Array.isArray(data.skills) ? data.skills.join(', ') : data.skills}
          </p>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-black uppercase text-[#3498DB] border-b border-[#3498DB]/20 pb-0.5 mb-1.5">Education</h3>
          <div className="space-y-2">
            {data.education.map((edu: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
                  <span>{edu.degree} — {edu.institution}</span>
                  <span className="font-semibold text-[9.5px] text-slate-500">{edu.year}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
