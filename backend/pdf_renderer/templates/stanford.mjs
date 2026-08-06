import { htmlShell, esc, bulletList } from './shared.mjs';

export function renderStanford(data, fontFamily, fontSize) {
  const p = data.personal_info || {};
  const contactParts = [p.email, p.phone, p.location].filter(Boolean);

  const contact = contactParts.map((item, idx) =>
    idx > 0
      ? `<span class="mx-1.5 text-red-800">•</span>${esc(item)}`
      : esc(item)
  ).join('');

  const sectionH3 = 'text-[12px] font-black uppercase tracking-wider text-red-800 border-b-2 border-red-200 pb-0.5 mb-2';

  const summary = data.summary ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">Professional Summary</h3>
      <p class="text-[11px] text-slate-700 leading-relaxed">${esc(data.summary)}</p>
    </div>` : '';

  const education = data.education?.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">Education</h3>
      <div class="space-y-3">
        ${data.education.map(edu => `
        <div class="space-y-0.5">
          <div class="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
            <span>${esc(edu.institution)}</span>
            <span class="font-medium text-[10.5px] text-slate-500">${esc(edu.year)}</span>
          </div>
          <p class="text-[10.5px] text-slate-600 italic">${esc(edu.degree)}</p>
        </div>`).join('')}
      </div>
    </div>` : '';

  const experience = data.experience?.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">Academic &amp; Research Experience</h3>
      <div class="space-y-4">
        ${data.experience.map(exp => `
        <div class="space-y-1">
          <div class="flex justify-between items-baseline text-[11.5px] font-bold text-slate-800">
            <span>${esc(exp.position)}</span>
            <span class="font-semibold text-[10px] text-slate-500">${esc(exp.duration)}</span>
          </div>
          <div class="text-[10.5px] text-slate-600 italic font-medium">${esc(exp.company)}</div>
          ${bulletList(exp.description, 'text-[10.5px] text-slate-650')}
        </div>`).join('')}
      </div>
    </div>` : '';

  const projects = data.projects?.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">Projects &amp; Publications</h3>
      <div class="space-y-3">
        ${data.projects.map(proj => `
        <div class="space-y-1">
          <div class="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
            <span>${esc(proj.title)}</span>
            <span class="font-normal text-[9.5px] text-slate-500">(${esc(proj.technologies)})</span>
          </div>
          ${proj.description ? `<p class="text-[10.5px] text-slate-650">${esc(proj.description)}</p>` : ''}
        </div>`).join('')}
      </div>
    </div>` : '';

  const skills = data.skills?.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">Technical Skills</h3>
      <p class="text-[11px] text-slate-700 leading-relaxed">${esc(Array.isArray(data.skills) ? data.skills.join(', ') : data.skills)}</p>
    </div>` : '';

  const certifications = data.certifications?.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">Certifications</h3>
      <div class="space-y-3">
        ${data.certifications.map(cert => `
        <div class="space-y-0.5">
          <div class="flex justify-between items-baseline text-[11px] font-bold text-slate-800">
            <span>${esc(cert.name)}${cert.organization ? ` &mdash; ${esc(cert.organization)}` : ''}</span>
            <span class="font-medium text-[10.5px] text-slate-500">${esc(cert.issue_date)}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>` : '';

  const portfolio = data.portfolioLinks?.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}">Portfolio</h3>
      <p class="text-[11px] text-slate-700 leading-relaxed">${data.portfolioLinks.map(l => esc(l)).join('  •  ')}</p>
    </div>` : '';

  const body = `
  <div class="p-8 bg-white text-[#1E293B] max-w-[800px] mx-auto text-left font-serif leading-relaxed">
    <div class="text-center mb-6">
      <h1 class="text-3xl font-extrabold tracking-tight text-red-800">${esc(p.name || '')}</h1>
      <div class="text-[11px] text-slate-500 font-semibold mt-1 tracking-wider uppercase flex flex-wrap justify-center gap-3">
        ${contact}
      </div>
    </div>
    ${summary}${education}${experience}${projects}${skills}${certifications}${portfolio}
  </div>`;

  return htmlShell(body, fontFamily, fontSize);
}
