import React from 'react';
import type { ResumeBuilderData } from '../../../store/resumeBuilderStore';
import { normalizeSkillsList, normalizePersonalSkillsList, getPersonalDetailsEntries, getHobbies, parseBullets } from './shared';

interface TemplateProps {
  data: ResumeBuilderData;
  fontFamily?: string;
  fontSize?: string;
}

export const HarvardTemplate: React.FC<TemplateProps> = ({ data, fontFamily = 'Inter', fontSize = '11pt' }) => {
  if (!data) return null;
  const pInfo = data.personal_info || {};
  const contactParts = [
    pInfo.email,
    pInfo.phone,
    pInfo.location || pInfo.address,
    pInfo.linkedin,
    pInfo.github,
    pInfo.portfolio || pInfo.website
  ].filter(Boolean) as string[];

  const skillCategories = normalizeSkillsList(data);
  const personalSkills = normalizePersonalSkillsList(data);
  const personalDetails = getPersonalDetailsEntries(data);
  const hobbies = getHobbies(data);
  const customSections = data.additional_information || data.custom_sections || data.customSections || [];

  return (
    <div 
      className="p-8 bg-white text-[#111111] max-w-[800px] mx-auto text-left leading-normal"
      style={{ fontFamily, fontSize }}
    >
      {/* Header */}
      <div className="text-center border-b-2 border-slate-900 pb-3 mb-5">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-slate-900">{pInfo.name || ''}</h1>
        {(pInfo.title || data.target_role) && (
          <div className="text-[12px] font-semibold uppercase tracking-wider text-slate-600 mt-1">
            {pInfo.title || data.target_role}
          </div>
        )}
        <div className="text-[11px] text-slate-650 font-semibold tracking-wide mt-1.5 flex flex-wrap justify-center gap-2">
          {contactParts.map((item, idx) => (
            <span key={idx}>
              {idx > 0 && <span className="mx-2 text-slate-350">•</span>}
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Objective */}
      {data.objective && (
        <div className="mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Career Objective</h3>
          <p className="text-[11px] text-slate-700 leading-relaxed text-justify">{data.objective}</p>
        </div>
      )}

      {/* Summary */}
      {data.summary && (
        <div className="mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Professional Summary</h3>
          <p className="text-[11px] text-slate-700 leading-relaxed text-justify">{data.summary}</p>
        </div>
      )}

      {/* Technical Skills */}
      {skillCategories.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Technical Skills</h3>
          <div className="space-y-1 text-[11px] text-slate-700 leading-relaxed">
            {skillCategories.map((cat, idx) => (
              <div key={idx}>
                <strong className="text-slate-900">{cat.category}:</strong> {cat.skills.join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal / Soft Skills */}
      {personalSkills.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Personal / Soft Skills</h3>
          <p className="text-[11px] text-slate-700 leading-relaxed">{personalSkills.join(', ')}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Work Experience</h3>
          <div className="space-y-3">
            {data.experience.map((exp: any, idx: number) => {
              const bullets = parseBullets(exp.description || exp.responsibilities || exp.bullets);
              const dur = exp.duration || (exp.start_date ? (exp.is_current ? `${exp.start_date} – Present` : `${exp.start_date} – ${exp.end_date || ''}`) : '');
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-[11.5px] font-black text-slate-800">{exp.position || exp.title || exp.job_title}</h4>
                    <span className="text-[10px] font-semibold text-slate-500">{dur}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-650">
                    <span>{exp.company || exp.organization}</span>
                    {exp.location && <span className="text-[10px] font-medium text-slate-500 italic">{exp.location}</span>}
                  </div>
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 mt-0.5 text-[10.5px] text-slate-700">
                      {bullets.map((b, i) => <li key={i}>{b}</li>)}
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
        <div className="mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Internships</h3>
          <div className="space-y-3">
            {data.internships.map((item: any, idx: number) => {
              const bullets = parseBullets(item.description || item.responsibilities);
              const dur = item.duration || (item.start_date ? (item.is_current ? `${item.start_date} – Present` : `${item.start_date} – ${item.end_date || ''}`) : '');
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-[11.5px] font-black text-slate-800">{item.role || item.position || item.title || 'Intern'}</h4>
                    <span className="text-[10px] font-semibold text-slate-500">{dur}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-[11px] font-bold text-slate-650">
                    <span>{item.company || item.organization}</span>
                    {item.location && <span className="text-[10px] font-medium text-slate-500 italic">{item.location}</span>}
                  </div>
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 mt-0.5 text-[10.5px] text-slate-700">
                      {bullets.map((b, i) => <li key={i}>{b}</li>)}
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
        <div className="mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Academic &amp; Personal Projects</h3>
          <div className="space-y-3">
            {data.projects.map((proj: any, idx: number) => {
              const tech = Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || (Array.isArray(proj.tech_stack) ? proj.tech_stack.join(', ') : proj.tech_stack));
              const bullets = parseBullets(proj.description || proj.responsibilities || proj.bullets);
              const dur = proj.duration || (proj.start_date ? `${proj.start_date} – ${proj.end_date || ''}` : '');
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-[11.5px] font-black text-slate-800">
                      {proj.title || proj.name}
                      {tech && <span className="text-[10px] font-medium text-slate-500 ml-1">({tech})</span>}
                    </h4>
                    <div className="flex items-center gap-2">
                      {(proj.url || proj.link || proj.github) && (
                        <a href={proj.url || proj.link || proj.github} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 font-semibold hover:underline">Link</a>
                      )}
                      {dur && <span className="text-[10px] font-semibold text-slate-500">{dur}</span>}
                    </div>
                  </div>
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 text-[10.5px] text-slate-700">
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
        <div className="mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Education</h3>
          <div className="space-y-3">
            {data.education.map((edu: any, idx: number) => {
              const yr = edu.year || edu.passing_year || (edu.start_date ? `${edu.start_date} – ${edu.end_date || ''}` : '');
              const score = edu.cgpa_percentage || edu.score || edu.cgpa || edu.percentage || edu.gpa;
              const spec = edu.specialization || (edu.field_of_study && edu.degree && !edu.degree.includes(edu.field_of_study) ? edu.field_of_study : '');
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-[11.5px] font-black text-slate-800">
                      {edu.degree || edu.field_of_study}{spec ? ` in ${spec}` : ''}
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-500">{yr}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-[11px] text-slate-650 font-bold">
                    <span>{edu.institution || edu.school || edu.university}{edu.location ? ` — ${edu.location}` : ''}</span>
                    {score && <span className="text-[10.5px] font-semibold text-slate-700">CGPA/Score: {score}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Certifications</h3>
          <div className="space-y-1.5">
            {data.certifications.map((cert: any, idx: number) => (
              <div key={idx} className="flex justify-between items-baseline text-[11px]">
                <span className="font-bold text-slate-800">
                  {cert.name || cert.title}{(cert.organization || cert.issuer) ? ` — ${cert.organization || cert.issuer}` : ''}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">{cert.issue_date || cert.year || cert.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publications */}
      {data.publications && data.publications.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Publications</h3>
          <div className="space-y-2">
            {data.publications.map((pub: any, idx: number) => (
              <div key={idx} className="text-[11px] text-slate-700">
                <div className="font-bold text-slate-900">{pub.title}</div>
                {pub.authors && <div className="italic text-slate-600">{pub.authors}</div>}
                <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                  <span>{pub.journal || pub.publisher || pub.conference}</span>
                  <span>{pub.year || pub.date}</span>
                </div>
                {pub.description && <p className="text-[10px] text-slate-600 mt-0.5">{pub.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {data.achievements && data.achievements.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Awards &amp; Achievements</h3>
          <div className="space-y-1 text-[11px] text-slate-700">
            {data.achievements.map((ach: any, idx: number) => {
              if (typeof ach === 'string') return <p key={idx}>• {ach}</p>;
              return (
                <div key={idx} className="flex justify-between items-baseline">
                  <span>• <strong className="text-slate-900">{ach.title || ach.name}</strong>{ach.issuer ? ` — ${ach.issuer}` : ''}</span>
                  {(ach.year || ach.date) && <span className="text-[10px] text-slate-500 font-semibold">{ach.year || ach.date}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leadership */}
      {data.leadership && data.leadership.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Leadership &amp; Activities</h3>
          <div className="space-y-2">
            {data.leadership.map((item: any, idx: number) => {
              const bullets = parseBullets(item.description);
              return (
                <div key={idx} className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between font-bold text-slate-850">
                    <span>{item.role || item.title || item.position}{(item.organization || item.club) ? ` — ${item.organization || item.club}` : ''}</span>
                    <span className="text-[10px] font-semibold text-slate-500">{item.duration || item.year}</span>
                  </div>
                  {bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 text-[10.5px] text-slate-700">
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
        <div className="mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Hobbies &amp; Interests</h3>
          <p className="text-[11px] text-slate-700 leading-relaxed">{hobbies.join(', ')}</p>
        </div>
      )}

      {/* Personal Details */}
      {personalDetails.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Personal Details</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10.5px] text-slate-700">
            {personalDetails.map((item, idx) => (
              <div key={idx}><strong className="text-slate-900">{item.label}:</strong> {item.value}</div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Sections */}
      {customSections.length > 0 && customSections.map((sec: any, idx: number) => {
        const bullets = parseBullets(sec.content || sec.description);
        return (
          <div key={idx} className="mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">
              {sec.section_name || sec.title || 'Additional Information'}
            </h3>
            {bullets.length > 0 && (
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-700">
                {bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HarvardTemplate;
