import { htmlShell, esc, bulletList, getExpTitle, getExpCompany, getExpDuration, getExpBullets, getProjTitle, getProjTech, getProjDesc, getEduDegree, getEduSchool, getEduYear } from './shared.mjs';

export function renderClassicSerif(data, fontFamily, fontSize) {
  const p = data.personal_info || {};
  const name = (p.name || 'Candidate Name').toUpperCase();

  // Address line
  const locationLine = (p.location || p.address) ? `<p class="text-[11px] text-slate-600 mt-2 font-medium tracking-wide">${esc(p.location || p.address)}</p>` : '';

  // Contact line with | separator
  const contactParts = [];
  if (p.phone) contactParts.push(p.phone);
  if (p.email) contactParts.push(p.email);
  if (p.linkedin) contactParts.push(p.linkedin);
  if (p.portfolio || p.github) contactParts.push(p.portfolio || p.github);
  const contactLine = contactParts.length ? `
    <div class="text-[11px] text-slate-600 mt-1 font-medium tracking-wide flex justify-center items-center gap-2 flex-wrap">
      ${contactParts.map((item, idx) => idx > 0 ? `<span class="text-slate-400">|</span><span>${esc(item)}</span>` : `<span>${esc(item)}</span>`).join('')}
    </div>` : '';

  // Summary
  const summaryText = data.summary || data.objective || '';
  const summary = summaryText ? `
    <div class="mb-5">
      <h3 class="text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-2" style="font-family: Georgia, serif;">Profile</h3>
      <p class="text-[11px] text-[#333333] leading-relaxed">${esc(summaryText)}</p>
    </div>` : '';

  // Experience
  const expList = data.experience || [];
  const experience = expList.length ? `
    <div class="mb-5">
      <h3 class="text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-3" style="font-family: Georgia, serif;">Experience</h3>
      <div class="space-y-4">
        ${expList.map(exp => {
          const comp = getExpCompany(exp);
          const pos = getExpTitle(exp);
          const dur = getExpDuration(exp);
          const b = getExpBullets(exp);
          return `
          <div class="space-y-1">
            <div class="flex justify-between items-baseline text-[11px] font-bold text-black">
              <span class="font-extrabold">${esc(comp)}</span>
              <span class="font-semibold text-slate-600">${esc(exp.location || '')}</span>
            </div>
            <div class="flex justify-between items-baseline text-[11.5px] text-[#333333]">
              <span class="italic font-medium">${esc(pos)}</span>
              <span class="text-[10px] text-slate-500 font-semibold">${esc(dur)}</span>
            </div>
            ${bulletList(b, 'text-[11px] text-[#444444]')}
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // Projects
  const projList = data.projects || [];
  const projects = projList.length ? `
    <div class="mb-5">
      <h3 class="text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-3" style="font-family: Georgia, serif;">Projects</h3>
      <div class="space-y-3">
        ${projList.map(proj => {
          const title = getProjTitle(proj);
          const tech = getProjTech(proj);
          const desc = getProjDesc(proj);
          return `
          <div class="space-y-1">
            <div class="flex justify-between items-baseline text-[11.5px] font-bold text-black">
              <span>${esc(title)} ${tech ? `<span class="text-[10px] text-slate-500 font-normal">(${esc(tech)})</span>` : ''}</span>
              <span class="text-[10px] text-slate-500 font-semibold">${esc(proj.duration || proj.year || '')}</span>
            </div>
            ${bulletList(desc, 'text-[11px] text-[#444444]')}
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // Education
  const eduList = data.education || [];
  const education = eduList.length ? `
    <div class="mb-5">
      <h3 class="text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-3" style="font-family: Georgia, serif;">Education</h3>
      <div class="space-y-3">
        ${eduList.map(edu => `
        <div class="space-y-0.5">
          <div class="flex justify-between items-baseline text-[11px] font-bold text-black">
            <span class="font-extrabold">${esc(getEduDegree(edu))}</span>
            <span class="font-semibold text-slate-600">${esc(getEduYear(edu))}</span>
          </div>
          <div class="flex justify-between items-baseline text-[10.5px] text-[#444444]">
            <span>${esc(getEduSchool(edu))}</span>
            <span class="text-slate-500 italic">${esc(edu.location || '')}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>` : '';

  // Skills
  const rawSkills = data.technicalSkills || data.skills || [];
  const skillsStr = Array.isArray(rawSkills) 
    ? rawSkills.map(s => typeof s === 'object' ? (s.name || s.category || s.skill || JSON.stringify(s)) : String(s)).join(', ')
    : String(rawSkills);
  const skills = skillsStr ? `
    <div class="mb-5">
      <h3 class="text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-2" style="font-family: Georgia, serif;">Skills</h3>
      <p class="text-[11px] text-[#333333] leading-relaxed">${esc(skillsStr)}</p>
    </div>` : '';

  // Certifications
  const certList = data.certifications || data.certificates || [];
  const certifications = certList.length ? `
    <div class="mb-5">
      <h3 class="text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-2" style="font-family: Georgia, serif;">Certifications</h3>
      <div class="space-y-2">
        ${certList.map(cert => `
        <div class="flex justify-between items-baseline text-[11px] text-[#333333]">
          <span class="font-bold">${esc(cert.name || cert.title)}${cert.organization ? ` — ${esc(cert.organization)}` : ''}</span>
          <span class="text-[10px] text-slate-500">${esc(cert.issue_date || cert.year || '')}</span>
        </div>`).join('')}
      </div>
    </div>` : '';

  // Achievements
  const achList = data.achievements || [];
  const achievements = achList.length ? `
    <div class="mb-5">
      <h3 class="text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-2" style="font-family: Georgia, serif;">Awards & Achievements</h3>
      ${bulletList(achList, 'text-[11px] text-[#333333]')}
    </div>` : '';

  // Languages
  const langList = data.languages || [];
  const languages = langList.length ? `
    <div class="mb-5">
      <h3 class="text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-2" style="font-family: Georgia, serif;">Languages</h3>
      <p class="text-[11px] text-[#333333]">${esc(Array.isArray(langList) ? langList.join(', ') : langList)}</p>
    </div>` : '';

  // Custom Sections
  const customSecs = data.custom_sections || data.customSections || [];
  const customHtml = customSecs.length ? customSecs.map(c => `
    <div class="mb-5">
      <h3 class="text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-2" style="font-family: Georgia, serif;">${esc(c.section_name || c.title || 'Additional Section')}</h3>
      ${bulletList(c.content || c.description, 'text-[11px] text-[#333333]')}
    </div>`).join('') : '';

  const body = `
  <div class="p-12 bg-white text-[#111111] max-w-[800px] mx-auto text-left leading-relaxed">
    <div class="text-center pb-6">
      <h1 class="text-3xl font-bold text-black tracking-wide uppercase" style="font-family: Georgia, 'Times New Roman', serif;">${esc(name)}</h1>
      ${locationLine}
      ${contactLine}
    </div>
    ${summary}
    ${skills}
    ${experience}
    ${projects}
    ${education}
    ${certifications}
    ${achievements}
    ${languages}
    ${customHtml}
  </div>`;

  return htmlShell(body, fontFamily || 'Georgia', fontSize);
}
