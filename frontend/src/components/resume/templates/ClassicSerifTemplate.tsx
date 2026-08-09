import React from 'react';

interface TemplateProps {
  data: any;
  fontFamily?: string;
  fontSize?: string;
}

export const ClassicSerifTemplate: React.FC<TemplateProps> = ({ data, fontFamily = 'Times New Roman, serif', fontSize = '11pt' }) => {
  if (!data) return null;
  const pInfo = data.personal_info || {};
  
  // Format summary as bullet points (split by sentences or newlines or bullets if single string)
  const summaryBullets = data.summary
    ? data.summary
        .split(/[.\n•]/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 5)
    : [];

  return (
    <div 
      className="p-12 bg-white text-[#111111] max-w-[800px] mx-auto text-left leading-relaxed shadow-sm min-h-[1050px]"
      style={{ fontFamily: fontFamily || 'Times New Roman, Georgia, serif', fontSize }}
    >
      {/* Header - Centered Name & Address & Contact details */}
      <div className="text-center pb-6">
        <h1 
          className="text-3xl font-bold text-black tracking-wide uppercase"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {pInfo.name || 'Tina Miller'}
        </h1>
        
        {pInfo.location && (
          <p className="text-[11px] text-slate-655 mt-2 font-medium tracking-wide">
            {pInfo.location}
          </p>
        )}
        
        <div className="text-[11px] text-slate-655 mt-1 font-medium tracking-wide flex justify-center items-center gap-2">
          {pInfo.phone && <span>{pInfo.phone}</span>}
          {pInfo.phone && pInfo.email && <span className="text-slate-400">|</span>}
          {pInfo.email && <span>{pInfo.email}</span>}
          {pInfo.email && pInfo.linkedin && <span className="text-slate-400">|</span>}
          {pInfo.linkedin && <span>{pInfo.linkedin}</span>}
        </div>
      </div>

      {/* Profile/Summary Section */}
      {summaryBullets.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-2">
            Profile
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-[#333333]">
            {summaryBullets.map((bullet: string, idx: number) => (
              <li key={idx} className="leading-relaxed">{bullet}.</li>
            ))}
          </ul>
        </div>
      )}

      {/* Experience Section */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-3">
            Experience
          </h3>
          <div className="space-y-5">
            {data.experience.map((exp: any, idx: number) => {
              const bullets = exp.description 
                ? exp.description.split(/[•\n]/).map((b: string) => b.trim()).filter(Boolean)
                : [];
              return (
                <div key={idx} className="space-y-1.5">
                  {/* Row 1: Company / Location */}
                  <div className="flex justify-between items-baseline text-[11px] font-bold text-black">
                    <span className="font-extrabold">{exp.company}</span>
                    <span className="font-semibold text-slate-655">{exp.location || 'New York, NY'}</span>
                  </div>
                  {/* Row 2: Title / Duration */}
                  <div className="flex justify-between items-baseline text-[11.5px] text-[#333333]">
                    <span className="italic font-medium">{exp.position}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{exp.duration}</span>
                  </div>
                  {/* Bullet points */}
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#444444] mt-1">
                      {bullets.map((bullet: string, i: number) => (
                        <li key={i} className="leading-relaxed">{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Education Section */}
      {data.education && data.education.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-3">
            Education
          </h3>
          <div className="space-y-4">
            {data.education.map((edu: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-baseline text-[11px] font-bold text-black">
                  <span className="font-extrabold">{edu.degree}</span>
                  <span className="font-semibold text-slate-655">{edu.year}</span>
                </div>
                <div className="flex justify-between items-baseline text-[10.5px] text-[#444444]">
                  <span>{edu.institution}</span>
                  <span className="text-slate-500 italic">{edu.location || ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Section */}
      {(data.technicalSkills || data.skills) && (
        <div className="mb-6">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-2">
            Skills
          </h3>
          <p className="text-[11px] text-[#333333] leading-relaxed">
            {Array.isArray(data.technicalSkills || data.skills) 
              ? (data.technicalSkills || data.skills).join(', ') 
              : (data.technicalSkills || data.skills)}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClassicSerifTemplate;
