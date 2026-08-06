import { htmlShell, esc, bulletList } from './shared.mjs';

export function renderIndeed(data, fontFamily, fontSize) {
  const p = data.personal_info || {};
  const contactParts = [p.email, p.phone, p.location].filter(Boolean);

  const sectionDiv = 'mb-3 border-t border-slate-200 pt-3';
  const sectionH3 = 'text-xs font-black uppercase text-slate-700 mb-1';

  const summary = data.summary ? `
    <div class="${sectionDiv}">
      <h3 class="${sectionH3}">About Me</h3>
      <p class="text-[10px] text-slate-600 leading-normal">${esc(data.summary)}</p>
    </div>` : '';

  const experience = data.experience?.length ? `
    <div class="${sectionDiv}">
      <h3 class="text-xs font-black uppercase text-slate-700 mb-2">Work Experience</h3>
      <div class="space-y-3">
        ${data.experience.map(exp => `
        <div class="space-y-0.5">
          <div class="flex justify-between items-baseline text-[10.5px] font-bold text-slate-800">
            <span>${esc(exp.position)}</span>
            <span class="font-normal text-[9.5px] text-slate-400">${esc(exp.duration)}</span>
          </div>
          <div class="text-[10px] text-slate-500 font-bold">${esc(exp.company)}</div>
          ${bulletList(exp.description, 'text-[9.5px] text-slate-500')}
        </div>`).join('')}
      </div>
    </div>` : '';

  const projects = data.projects?.length ? `
    <div class="${sectionDiv}">
      <h3 class="text-xs font-black uppercase text-slate-700 mb-2">Projects</h3>
      <div class="space-y-2">
        ${data.projects.map(proj => `
        <div class="space-y-0.5">
          <div class="flex justify-between items-baseline text-[10.5px] font-bold text-slate-800">
            <span>${esc(proj.title)}</span>
            <span class="font-normal text-[9px] text-slate-400">(${esc(proj.technologies)})</span>
          </div>
          ${proj.description ? `<p class="text-[9.5px] text-slate-500 leading-snug">${esc(proj.description)}</p>` : ''}
        </div>`).join('')}
      </div>
    </div>` : '';

  const skills = data.skills?.length ? `
    <div class="${sectionDiv}">
      <h3 class="${sectionH3}" style="margin-bottom:0.375rem">Skills</h3>
      <p class="text-[10px] text-slate-600 leading-relaxed">${esc(Array.isArray(data.skills) ? data.skills.join(', ') : data.skills)}</p>
    </div>` : '';

  const education = data.education?.length ? `
    <div class="${sectionDiv}">
      <h3 class="text-xs font-black uppercase text-slate-700 mb-2">Education</h3>
      <div class="space-y-2">
        ${data.education.map(edu => `
        <div class="space-y-0.5">
          <div class="flex justify-between items-baseline text-[10.5px] font-bold text-slate-800">
            <span>${esc(edu.degree)} &mdash; ${esc(edu.institution)}</span>
            <span class="font-semibold text-[9.5px] text-slate-400">${esc(edu.year)}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>` : '';

  const certifications = data.certifications?.length ? `
    <div class="${sectionDiv}">
      <h3 class="text-xs font-black uppercase text-slate-700 mb-2">Certifications</h3>
      <div class="space-y-2">
        ${data.certifications.map(cert => `
        <div class="space-y-0.5">
          <div class="flex justify-between items-baseline text-[10.5px] font-bold text-slate-800">
            <span>${esc(cert.name)}${cert.organization ? ` &mdash; ${esc(cert.organization)}` : ''}</span>
            <span class="font-semibold text-[9.5px] text-slate-400">${esc(cert.issue_date)}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>` : '';

  const portfolio = data.portfolioLinks?.length ? `
    <div class="${sectionDiv}">
      <h3 class="text-xs font-black uppercase text-slate-700 mb-2">Portfolio</h3>
      <p class="text-[10.5px] text-slate-600 leading-relaxed">${data.portfolioLinks.map(l => esc(l)).join('  •  ')}</p>
    </div>` : '';

  const body = `
  <div class="p-8 bg-white text-[#333333] max-w-[800px] mx-auto text-left font-sans leading-snug">
    <div class="mb-4">
      <h1 class="text-2xl font-black text-slate-800 tracking-tight">${esc(p.name || '')}</h1>
      <div class="text-[10px] text-slate-500 font-bold mt-1 flex flex-wrap gap-2">
        ${contactParts.map(c => `<span class="bg-slate-100 px-2 py-0.5 rounded">${esc(c)}</span>`).join('')}
      </div>
    </div>
    ${summary}${experience}${projects}${skills}${education}${certifications}${portfolio}
  </div>`;

  return htmlShell(body, fontFamily, fontSize);
}
