import React from 'react';

interface TemplateProps {
  data: any;
  fontFamily: string;
  fontSize: string;
}

export const MinimalistModernTemplate: React.FC<TemplateProps> = ({ data, fontFamily, fontSize }) => {
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
      <div className="border-b-2 border-slate-900 pb-3 mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">{pInfo.name || ''}</h1>
        {pInfo.role && <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{pInfo.role}</p>}
        <div className="text-[11px] text-slate-650 font-semibold tracking-wide mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {contactParts.map((item, idx) => (
            <span key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <span className="text-slate-350">•</span>}
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">Profile</h3>
          <p className="text-[11px] text-slate-650 leading-relaxed font-medium">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">Work Experience</h3>
          <div className="space-y-4">
            {data.experience.map((exp: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-[11.5px] font-extrabold text-slate-900">{exp.position}</h4>
                  <span className="text-[10px] font-bold text-slate-450">{exp.duration}</span>
                </div>
                <div className="text-[10.5px] font-semibold text-slate-500">
                  <span>{exp.company}</span>
                </div>
                {exp.description && (
                  <ul className="list-disc pl-4 space-y-1 mt-1.5 text-[10.5px] text-slate-600 font-medium">
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

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">Education</h3>
          <div className="space-y-3">
            {data.education.map((edu: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-[11.5px] font-extrabold text-slate-900">{edu.institution}</h4>
                  <span className="text-[10px] font-bold text-slate-450">{edu.passing_year || edu.year}</span>
                </div>
                <div className="text-[10.5px] font-semibold text-slate-500">
                  {edu.degree} {edu.cgpa_percentage ? `• Grade: ${edu.cgpa_percentage}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2 text-[10.5px] font-semibold text-slate-650">
            {Array.isArray(data.skills) ? (
              data.skills.map((skill: any, idx: number) => (
                <span key={idx} className="bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded">
                  {typeof skill === 'object' ? skill.name : skill}
                </span>
              ))
            ) : (
              <span>{data.skills}</span>
            )}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">Projects</h3>
          <div className="space-y-3">
            {data.projects.map((proj: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-[11.5px] font-extrabold text-slate-900">{proj.name || proj.title}</h4>
                  {proj.duration && <span className="text-[10px] font-bold text-slate-450">{proj.duration}</span>}
                </div>
                {proj.tech_stack && <div className="text-[10px] font-bold text-emerald-600">{proj.tech_stack}</div>}
                {proj.description && <p className="text-[10.5px] text-slate-600 leading-relaxed font-medium mt-0.5">{proj.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">Certifications</h3>
          <div className="space-y-2">
            {data.certifications.map((cert: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-[11px] font-extrabold text-slate-900">{cert.name}</h4>
                  <span className="text-[10px] font-bold text-slate-450">{cert.issue_date}</span>
                </div>
                <div className="text-[10px] font-semibold text-slate-500">{cert.organization}</div>
                {cert.description && <p className="text-[10px] text-slate-600 leading-relaxed mt-0.5">{cert.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hobbies */}
      {data.hobbies && data.hobbies.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">Hobbies & Interests</h3>
          <div className="flex flex-wrap gap-2 text-[10.5px] font-semibold text-slate-650">
            {Array.isArray(data.hobbies) ? (
              data.hobbies.map((hobby: any, idx: number) => (
                <span key={idx} className="bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded">
                  {typeof hobby === 'object' ? hobby.name : hobby}
                </span>
              ))
            ) : (
              <span>{data.hobbies}</span>
            )}
          </div>
        </div>
      )}

      {/* Portfolio */}
      {data.portfolioLinks && data.portfolioLinks.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">Portfolio</h3>
          <p className="text-[10.5px] text-slate-650 leading-relaxed">
            {data.portfolioLinks.join('  •  ')}
          </p>
        </div>
      )}
    </div>
  );
};
