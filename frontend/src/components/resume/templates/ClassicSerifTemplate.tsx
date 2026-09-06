import React from 'react';
import type { ResumeBuilderData } from '../../../store/resumeBuilderStore';
import { normalizeSkillsList, normalizePersonalSkillsList, getPersonalDetailsEntries, getHobbies, parseBullets } from './shared';

interface TemplateProps {
  data: ResumeBuilderData;
  fontFamily?: string;
  fontSize?: string;
}

export const ClassicSerifTemplate: React.FC<TemplateProps> = ({ 
  data, 
  fontFamily = 'Georgia, "Times New Roman", serif', 
  fontSize = '11pt' 
}) => {
  if (!data) return null;
  const pInfo = data.personal_info || {};
  const contactParts = [
    pInfo.phone,
    pInfo.email,
    pInfo.linkedin,
    pInfo.portfolio || pInfo.github || pInfo.website
  ].filter(Boolean) as string[];

  const skillCategories = normalizeSkillsList(data);
  const personalSkills = normalizePersonalSkillsList(data);
  const personalDetails = getPersonalDetailsEntries(data);
  const hobbies = getHobbies(data);
  const customSections = data.additional_information || data.custom_sections || data.customSections || [];

  const sectionH3 = 'text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-2';

  return (
    <div 
      className="p-10 bg-white text-[#111111] max-w-[800px] mx-auto text-left leading-relaxed shadow-sm min-h-[1050px]"
      style={{ fontFamily: fontFamily || 'Georgia, "Times New Roman", serif', fontSize }}
    >
      {/* Header */}
      <div className="text-center pb-5 border-b border-slate-400 mb-5">
        <h1 
          className="text-3xl font-bold text-black tracking-wide uppercase"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {pInfo.name || ''}
        </h1>
        
        {(pInfo.location || pInfo.address) && (
          <p className="text-[11px] text-slate-600 mt-1 font-medium tracking-wide">
            {pInfo.location || pInfo.address}
          </p>
        )}
        
        {contactParts.length > 0 && (
          <div className="text-[11px] text-slate-600 mt-1 font-medium tracking-wide flex justify-center items-center gap-2 flex-wrap">
            {contactParts.map((item, idx) => (
              <span key={idx}>
                {idx > 0 && <span className="text-slate-400 mr-2">|</span>}
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Objective */}
      {data.objective && (
        <div className="mb-5">
          <h3 className={sectionH3} style={{ fontFamily: 'Georgia, serif' }}>Career Objective</h3>
          <p className="text-[11px] text-[#333333] leading-relaxed text-justify">{data.objective}</p>
        </div>
      )}

      {/* Profile/Summary */}
      {data.summary && (
        <div className="mb-5">
          <h3 className={sectionH3} style={{ fontFamily: 'Georgia, serif' }}>Professional Summary</h3>
          <p className="text-[11px] text-[#333333] leading-relaxed text-justify">{data.summary}</p>
        </div>
      )}

      {/* Skills */}
      {skillCategories.length > 0 && (
        <div className="mb-5">
          <h3 className={sectionH3} style={{ fontFamily: 'Georgia, serif' }}>Technical Skills</h3>
          <div className="space-y-1 text-[11px] text-[#333333] leading-relaxed">
            {skillCategories.map((cat, idx) => (
              <div key={idx}>
                <strong className="font-bold text-black">{cat.category}:</strong> {cat.skills.join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Skills */}
      {personalSkills.length > 0 && (
        <div className="mb-5">
          <h3 className={sectionH3} style={{ fontFamily: 'Georgia, serif' }}>Personal / Soft Skills</h3>
          <p className="text-[11px] text-[#333333] leading-relaxed">{personalSkills.join(', ')}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-5">
          <h3 className={sectionH3} style={{ fontFamily: 'Georgia, serif' }}>Experience</h3>
          <div className="space-y-4">
            {data.experience.map((exp: any, idx: number) => {
              const bullets = parseBullets(exp.description || exp.responsibilities || exp.bullets);
              const dur = exp.duration || (exp.start_date ? (exp.is_current ? `${exp.start_date} – Present` : `${exp.start_date} – ${exp.end_date || ''}`) : '');
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-baseline text-[11px] font-bold text-black">
                    <span className="font-extrabold">{exp.company || exp.organization}</span>
                    {exp.location && <span className="font-semibold text-slate-600">{exp.location}</span>}
                  </div>
                  <div className="flex justify-between items-baseline text-[11.5px] text-[#333333]">
                    <span className="italic font-medium">{exp.position || exp.title || exp.job_title}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{dur}</span>
                  </div>
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#444444] mt-0.5">
                      {bullets.map((bullet, i) => (
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

      {/* Internships */}
      {data.internships && data.internships.length > 0 && (
        <div className="mb-5">
          <h3 className={sectionH3} style={{ fontFamily: 'Georgia, serif' }}>Internships</h3>
          <div className="space-y-4">
            {data.internships.map((item: any, idx: number) => {
              const bullets = parseBullets(item.description || item.responsibilities);
              const dur = item.duration || (item.start_date ? (item.is_current ? `${item.start_date} – Present` : `${item.start_date} – ${item.end_date || ''}`) : '');
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-baseline text-[11px] font-bold text-black">
                    <span className="font-extrabold">{item.company || item.organization}</span>
                    {item.location && <span className="font-semibold text-slate-600">{item.location}</span>}
                  </div>
                  <div className="flex justify-between items-baseline text-[11.5px] text-[#333333]">
                    <span className="italic font-medium">{item.role || item.position || item.title || 'Intern'}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{dur}</span>
                  </div>
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#444444] mt-0.5">
                      {bullets.map((bullet, i) => (
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

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <div className="mb-5">
          <h3 className={sectionH3} style={{ fontFamily: 'Georgia, serif' }}>Projects</h3>
          <div className="space-y-3">
            {data.projects.map((proj: any, idx: number) => {
              const tech = Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || (Array.isArray(proj.tech_stack) ? proj.tech_stack.join(', ') : proj.tech_stack));
              const bullets = parseBullets(proj.description || proj.responsibilities || proj.bullets);
              const dur = proj.duration || (proj.start_date ? `${proj.start_date} – ${proj.end_date || ''}` : '');
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-baseline text-[11.5px] font-bold text-black">
                    <span>{proj.title || proj.name} {tech ? <span className="text-[10px] text-slate-500 font-normal">({tech})</span> : ''}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{dur}</span>
                  </div>
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#444444]">
                      {bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div className="mb-5">
          <h3 className={sectionH3} style={{ fontFamily: 'Georgia, serif' }}>Education</h3>
          <div className="space-y-3">
            {data.education.map((edu: any, idx: number) => {
              const yr = edu.year || edu.passing_year || (edu.start_date ? `${edu.start_date} – ${edu.end_date || ''}` : '');
              const score = edu.cgpa_percentage || edu.score || edu.cgpa || edu.percentage || edu.gpa;
              const spec = edu.specialization || (edu.field_of_study && edu.degree && !edu.degree.includes(edu.field_of_study) ? edu.field_of_study : '');
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline text-[11px] font-bold text-black">
                    <span className="font-extrabold">{edu.degree || edu.field_of_study}{spec ? ` in ${spec}` : ''}</span>
                    <span className="font-semibold text-slate-600">{yr}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-[10.5px] text-[#444444]">
                    <span>{edu.institution || edu.school || edu.university}{edu.location ? ` — ${edu.location}` : ''}</span>
                    {score && <span className="font-semibold text-black">CGPA/Score: {score}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <div className="mb-5">
          <h3 className={sectionH3} style={{ fontFamily: 'Georgia, serif' }}>Certifications</h3>
          <div className="space-y-2">
            {data.certifications.map((cert: any, idx: number) => (
              <div key={idx} className="flex justify-between items-baseline text-[11px] text-[#333333]">
                <span className="font-bold">
                  {cert.name || cert.title}{(cert.organization || cert.issuer) ? ` — ${cert.organization || cert.issuer}` : ''}
                </span>
                <span className="text-[10px] text-slate-500">{cert.issue_date || cert.year || cert.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publications */}
      {data.publications && data.publications.length > 0 && (
        <div className="mb-5">
          <h3 className={sectionH3} style={{ fontFamily: 'Georgia, serif' }}>Publications</h3>
          <div className="space-y-2">
            {data.publications.map((pub: any, idx: number) => (
              <div key={idx} className="text-[11px] text-[#333333]">
                <div className="font-bold">{pub.title}</div>
                {pub.authors && <div className="italic text-slate-600">{pub.authors}</div>}
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{pub.journal || pub.publisher || pub.conference}</span>
                  <span>{pub.year || pub.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {data.achievements && data.achievements.length > 0 && (
        <div className="mb-5">
          <h3 className={sectionH3} style={{ fontFamily: 'Georgia, serif' }}>Awards &amp; Achievements</h3>
          <div className="space-y-1 text-[11px] text-[#333333]">
            {data.achievements.map((ach: any, idx: number) => {
              if (typeof ach === 'string') return <p key={idx}>• {ach}</p>;
              return (
                <div key={idx} className="flex justify-between items-baseline">
                  <span>• <strong>{ach.title || ach.name}</strong>{ach.issuer ? ` — ${ach.issuer}` : ''}</span>
                  {(ach.year || ach.date) && <span className="text-[10px] text-slate-500">{ach.year || ach.date}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leadership */}
      {data.leadership && data.leadership.length > 0 && (
        <div className="mb-5">
          <h3 className={sectionH3} style={{ fontFamily: 'Georgia, serif' }}>Leadership &amp; Activities</h3>
          <div className="space-y-2">
            {data.leadership.map((item: any, idx: number) => {
              const bullets = parseBullets(item.description);
              return (
                <div key={idx} className="text-[11px] text-[#333333]">
                  <div className="flex justify-between font-bold">
                    <span>{item.role || item.title || item.position}{(item.organization || item.club) ? ` — ${item.organization || item.club}` : ''}</span>
                    <span className="text-[10px] text-slate-500 font-normal">{item.duration || item.year}</span>
                  </div>
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-5 space-y-0.5 text-[10.5px] text-[#444444] mt-0.5">
                      {bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hobbies */}
      {hobbies.length > 0 && (
        <div className="mb-5">
          <h3 className={sectionH3} style={{ fontFamily: 'Georgia, serif' }}>Hobbies &amp; Interests</h3>
          <p className="text-[11px] text-[#333333] leading-relaxed">{hobbies.join(', ')}</p>
        </div>
      )}

      {/* Personal Details */}
      {personalDetails.length > 0 && (
        <div className="mb-5">
          <h3 className={sectionH3} style={{ fontFamily: 'Georgia, serif' }}>Personal Details</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[#333333]">
            {personalDetails.map((item, idx) => (
              <div key={idx}><strong className="font-bold text-black">{item.label}:</strong> {item.value}</div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Sections */}
      {customSections.length > 0 && customSections.map((sec: any, idx: number) => {
        const bullets = parseBullets(sec.content || sec.description);
        return (
          <div key={idx} className="mb-5">
            <h3 className={sectionH3} style={{ fontFamily: 'Georgia, serif' }}>
              {sec.section_name || sec.title || 'Additional Information'}
            </h3>
            {bullets.length > 0 && (
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-[#333333]">
                {bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ClassicSerifTemplate;
