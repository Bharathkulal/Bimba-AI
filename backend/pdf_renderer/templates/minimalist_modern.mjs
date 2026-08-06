import { htmlShell, esc, bulletList } from './shared.mjs';

export function renderMinimalistModern(data, fontFamily, fontSize) {
  const p = data.personal_info || {};
  const contactParts = [p.email, p.phone, p.location].filter(Boolean);

  const contact = contactParts.map((item, idx) =>
    idx > 0
      ? `<span class="text-slate-350">•</span><span>${esc(item)}</span>`
      : `<span>${esc(item)}</span>`
  ).join('');

  const sectionH3 = 'text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2';

  const summary = data.summary ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">Profile</h3>
      <p class="text-[11px] text-slate-600 leading-relaxed font-medium">${esc(data.summary)}</p>
    </div>` : '';

  const experience = data.experience?.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">Work Experience</h3>
      <div class="space-y-4">
        ${data.experience.map(exp => `
        <div class="space-y-1">
          <div class="flex justify-between items-baseline">
            <h4 class="text-[11.5px] font-extrabold text-slate-900">${esc(exp.position)}</h4>
            <span class="text-[10px] font-bold text-slate-500">${esc(exp.duration)}</span>
          </div>
          <div class="text-[10.5px] font-semibold text-slate-500">${esc(exp.company)}</div>
          ${bulletList(exp.description, 'text-[10.5px] text-slate-600 font-medium')}
        </div>`).join('')}
      </div>
    </div>` : '';

  const education = data.education?.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">Education</h3>
      <div class="space-y-3">
        ${data.education.map(edu => `
        <div class="space-y-1">
          <div class="flex justify-between items-baseline">
            <h4 class="text-[11.5px] font-extrabold text-slate-900">${esc(edu.institution)}</h4>
            <span class="text-[10px] font-bold text-slate-500">${esc(edu.year || edu.passing_year)}</span>
          </div>
          <div class="text-[10.5px] font-semibold text-slate-500">${esc(edu.degree)}</div>
        </div>`).join('')}
      </div>
    </div>` : '';

  const skills = data.skills?.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">Skills</h3>
      <div class="flex flex-wrap gap-2 text-[10.5px] font-semibold text-slate-600">
        ${(Array.isArray(data.skills) ? data.skills : [data.skills])
          .map(s => `<span class="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">${esc(s)}</span>`)
          .join('')}
      </div>
    </div>` : '';

  const projects = data.projects?.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">Projects</h3>
      <div class="space-y-3">
        ${data.projects.map(proj => `
        <div class="space-y-1">
          <div class="flex justify-between items-baseline">
            <h4 class="text-[11.5px] font-extrabold text-slate-900">${esc(proj.title || proj.name)}</h4>
            ${proj.duration ? `<span class="text-[10px] font-bold text-slate-500">${esc(proj.duration)}</span>` : ''}
          </div>
          ${(proj.technologies || proj.tech_stack) ? `<div class="text-[10px] font-bold text-emerald-600">${esc(proj.technologies || proj.tech_stack)}</div>` : ''}
          ${proj.description ? `<p class="text-[10.5px] text-slate-600 leading-relaxed font-medium mt-0.5">${esc(proj.description)}</p>` : ''}
        </div>`).join('')}
      </div>
    </div>` : '';

  const certifications = data.certifications?.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">Certifications</h3>
      <div class="space-y-2">
        ${data.certifications.map(cert => `
        <div class="space-y-0.5">
          <div class="flex justify-between items-baseline">
            <h4 class="text-[11px] font-extrabold text-slate-900">${esc(cert.name)}</h4>
            <span class="text-[10px] font-bold text-slate-500">${esc(cert.issue_date)}</span>
          </div>
          ${cert.organization ? `<div class="text-[10px] font-semibold text-slate-500">${esc(cert.organization)}</div>` : ''}
        </div>`).join('')}
      </div>
    </div>` : '';

  const hobbies = data.hobbies?.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">Hobbies &amp; Interests</h3>
      <div class="flex flex-wrap gap-2 text-[10.5px] font-semibold text-slate-600">
        ${(Array.isArray(data.hobbies) ? data.hobbies : [data.hobbies])
          .map(h => `<span class="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">${esc(h)}</span>`)
          .join('')}
      </div>
    </div>` : '';

  const portfolio = data.portfolioLinks?.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">Portfolio</h3>
      <p class="text-[10.5px] text-slate-600 leading-relaxed">${data.portfolioLinks.map(l => esc(l)).join('  •  ')}</p>
    </div>` : '';

  const body = `
  <div class="p-8 bg-white text-[#111111] max-w-[800px] mx-auto text-left font-sans leading-normal">
    <div class="border-b-2 border-slate-900 pb-3 mb-6">
      <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">${esc(p.name || '')}</h1>
      <div class="text-[11px] text-slate-600 font-semibold tracking-wide mt-2 flex flex-wrap gap-x-4 gap-y-1">
        ${contact}
      </div>
    </div>
    ${summary}${experience}${education}${skills}${projects}${certifications}${hobbies}${portfolio}
  </div>`;

  return htmlShell(body, fontFamily, fontSize);
}
