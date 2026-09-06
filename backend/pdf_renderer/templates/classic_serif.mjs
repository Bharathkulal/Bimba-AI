import { 
  htmlShell, 
  esc, 
  bulletList, 
  getExpTitle, 
  getExpCompany, 
  getExpDuration, 
  getExpLocation, 
  getExpBullets, 
  getProjTitle, 
  getProjTech, 
  getProjDuration, 
  getProjUrl, 
  getProjDesc, 
  getEduDegree, 
  getEduSchool, 
  getEduYear, 
  getEduScore, 
  getEduSpecialization, 
  getEduLocation, 
  normalizeSkills, 
  normalizePersonalSkills, 
  getPersonalDetailsList, 
  getInternshipsList, 
  getPublicationsList, 
  getAchievementsList, 
  getLeadershipList, 
  getHobbiesList, 
  getAdditionalInfoList 
} from './shared.mjs';

export function renderClassicSerif(data, fontFamily, fontSize) {
  if (!data) return '';
  const p = data.personal_info || {};
  const name = esc((p.name || 'Candidate Name').toUpperCase());
  const locationLine = (p.location || p.address) ? `<p class="text-[11px] text-slate-600 mt-2 font-medium tracking-wide">${esc(p.location || p.address)}</p>` : '';

  const contactParts = [];
  if (p.phone) contactParts.push(p.phone);
  if (p.email) contactParts.push(p.email);
  if (p.linkedin) contactParts.push(p.linkedin);
  if (p.portfolio || p.github || p.website) contactParts.push(p.portfolio || p.github || p.website);
  const contactLine = contactParts.length ? `
    <div class="text-[11px] text-slate-600 mt-1 font-medium tracking-wide flex justify-center items-center gap-2 flex-wrap">
      ${contactParts.map((item, idx) => idx > 0 ? `<span class="text-slate-400">|</span><span>${esc(item)}</span>` : `<span>${esc(item)}</span>`).join('')}
    </div>` : '';

  const sectionH3 = 'text-[13px] font-bold uppercase tracking-wider text-black border-b border-slate-300 pb-1 mb-2';

  // 1. Objective & Summary
  const objective = data.objective ? `
    <div class="mb-5">
      <h3 class="${sectionH3}" style="font-family: Georgia, serif;">Career Objective</h3>
      <p class="text-[11px] text-[#333333] leading-relaxed text-justify">${esc(data.objective)}</p>
    </div>` : '';

  const summary = data.summary ? `
    <div class="mb-5">
      <h3 class="${sectionH3}" style="font-family: Georgia, serif;">Professional Summary</h3>
      <p class="text-[11px] text-[#333333] leading-relaxed text-justify">${esc(data.summary)}</p>
    </div>` : '';

  // 2. Technical Skills
  const skillCategories = normalizeSkills(data);
  const skills = skillCategories.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}" style="font-family: Georgia, serif;">Technical Skills</h3>
      <div class="space-y-1 text-[11px] text-[#333333] leading-relaxed">
        ${skillCategories.map(cat => `
          <div><strong class="font-bold text-black">${esc(cat.category)}:</strong> ${esc(cat.items.join(', '))}</div>
        `).join('')}
      </div>
    </div>` : '';

  // 3. Personal Skills
  const personalSkillsList = normalizePersonalSkills(data);
  const personalSkills = personalSkillsList.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}" style="font-family: Georgia, serif;">Personal / Soft Skills</h3>
      <p class="text-[11px] text-[#333333] leading-relaxed">${esc(personalSkillsList.join(', '))}</p>
    </div>` : '';

  // 4. Experience
  const expList = data.experience || [];
  const experience = expList.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}" style="font-family: Georgia, serif;">Experience</h3>
      <div class="space-y-4">
        ${expList.map(exp => {
          const comp = getExpCompany(exp);
          const pos = getExpTitle(exp);
          const dur = getExpDuration(exp);
          const loc = getExpLocation(exp);
          const b = getExpBullets(exp);
          return `
          <div class="entry-block space-y-1">
            <div class="flex justify-between items-baseline text-[11px] font-bold text-black">
              <span class="font-extrabold">${esc(comp)}</span>
              <span class="font-semibold text-slate-600">${esc(loc)}</span>
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

  // 5. Internships
  const internshipList = getInternshipsList(data);
  const internships = internshipList.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}" style="font-family: Georgia, serif;">Internships</h3>
      <div class="space-y-4">
        ${internshipList.map(item => {
          const role = item.role || item.position || item.title || 'Intern';
          const comp = item.company || item.organization || '';
          const dur = item.duration || (item.start_date ? (item.end_date ? `${item.start_date} – ${item.end_date}` : item.start_date) : '');
          const loc = item.location || '';
          const desc = item.description || item.responsibilities || '';
          return `
          <div class="entry-block space-y-1">
            <div class="flex justify-between items-baseline text-[11px] font-bold text-black">
              <span class="font-extrabold">${esc(comp)}</span>
              <span class="font-semibold text-slate-600">${esc(loc)}</span>
            </div>
            <div class="flex justify-between items-baseline text-[11.5px] text-[#333333]">
              <span class="italic font-medium">${esc(role)}</span>
              <span class="text-[10px] text-slate-500 font-semibold">${esc(dur)}</span>
            </div>
            ${bulletList(desc, 'text-[11px] text-[#444444]')}
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // 6. Projects
  const projList = data.projects || [];
  const projects = projList.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}" style="font-family: Georgia, serif;">Projects</h3>
      <div class="space-y-3">
        ${projList.map(proj => {
          const title = getProjTitle(proj);
          const tech = getProjTech(proj);
          const dur = getProjDuration(proj);
          const desc = getProjDesc(proj);
          return `
          <div class="entry-block space-y-1">
            <div class="flex justify-between items-baseline text-[11.5px] font-bold text-black">
              <span>${esc(title)} ${tech ? `<span class="text-[10px] text-slate-500 font-normal">(${esc(tech)})</span>` : ''}</span>
              <span class="text-[10px] text-slate-500 font-semibold">${esc(dur)}</span>
            </div>
            ${bulletList(desc, 'text-[11px] text-[#444444]')}
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // 7. Education
  const eduList = data.education || [];
  const education = eduList.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}" style="font-family: Georgia, serif;">Education</h3>
      <div class="space-y-3">
        ${eduList.map(edu => {
          const deg = getEduDegree(edu);
          const school = getEduSchool(edu);
          const yr = getEduYear(edu);
          const score = getEduScore(edu);
          const spec = getEduSpecialization(edu);
          const loc = getEduLocation(edu);
          return `
          <div class="entry-block space-y-0.5">
            <div class="flex justify-between items-baseline text-[11px] font-bold text-black">
              <span class="font-extrabold">${esc(deg)}${spec ? ` in ${esc(spec)}` : ''}</span>
              <span class="font-semibold text-slate-600">${esc(yr)}</span>
            </div>
            <div class="flex justify-between items-baseline text-[10.5px] text-[#444444]">
              <span>${esc(school)}${loc ? ` &mdash; ${esc(loc)}` : ''}</span>
              ${score ? `<span class="font-semibold text-black">CGPA/Score: ${esc(score)}</span>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // 8. Certifications
  const certList = data.certifications || data.certificates || [];
  const certifications = certList.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}" style="font-family: Georgia, serif;">Certifications</h3>
      <div class="space-y-2">
        ${certList.map(cert => `
        <div class="entry-block flex justify-between items-baseline text-[11px] text-[#333333]">
          <span class="font-bold">${esc(cert.name || cert.title)}${cert.organization || cert.issuer ? ` — ${esc(cert.organization || cert.issuer)}` : ''}</span>
          <span class="text-[10px] text-slate-500">${esc(cert.issue_date || cert.year || cert.date || '')}</span>
        </div>`).join('')}
      </div>
    </div>` : '';

  // 9. Publications
  const pubList = getPublicationsList(data);
  const publications = pubList.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}" style="font-family: Georgia, serif;">Publications</h3>
      <div class="space-y-2">
        ${pubList.map(pub => `
        <div class="entry-block text-[11px] text-[#333333]">
          <div class="font-bold">${esc(pub.title)}</div>
          ${pub.authors ? `<div class="italic text-slate-600">${esc(pub.authors)}</div>` : ''}
          <div class="flex justify-between text-[10px] text-slate-500">
            <span>${esc(pub.journal || pub.publisher || pub.conference || '')}</span>
            <span>${esc(pub.year || pub.date || '')}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>` : '';

  // 10. Achievements
  const achList = getAchievementsList(data);
  const achievements = achList.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}" style="font-family: Georgia, serif;">Awards & Achievements</h3>
      ${bulletList(achList.map(a => typeof a === 'string' ? a : `${a.title || a.name}${a.issuer ? ' — ' + a.issuer : ''}${a.year ? ' (' + a.year + ')' : ''}`), 'text-[11px] text-[#333333]')}
    </div>` : '';

  // 11. Leadership
  const leadList = getLeadershipList(data);
  const leadership = leadList.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}" style="font-family: Georgia, serif;">Leadership & Activities</h3>
      <div class="space-y-2">
        ${leadList.map(item => `
        <div class="entry-block text-[11px] text-[#333333]">
          <div class="flex justify-between font-bold">
            <span>${esc(item.role || item.title)}${item.organization ? ` — ${esc(item.organization)}` : ''}</span>
            <span class="text-[10px] text-slate-500 font-normal">${esc(item.duration || item.year || '')}</span>
          </div>
          ${bulletList(item.description, 'text-[10.5px] text-[#444444]')}
        </div>`).join('')}
      </div>
    </div>` : '';

  // 12. Hobbies
  const hobbiesList = getHobbiesList(data);
  const hobbies = hobbiesList.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}" style="font-family: Georgia, serif;">Hobbies & Interests</h3>
      <p class="text-[11px] text-[#333333] leading-relaxed">${esc(hobbiesList.join(', '))}</p>
    </div>` : '';

  // 13. Personal Details
  const personalDetailsList = getPersonalDetailsList(data);
  const personalDetails = personalDetailsList.length ? `
    <div class="mb-5">
      <h3 class="${sectionH3}" style="font-family: Georgia, serif;">Personal Details</h3>
      <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[#333333]">
        ${personalDetailsList.map(item => `
          <div><strong class="font-bold text-black">${esc(item.label)}:</strong> ${esc(item.value)}</div>
        `).join('')}
      </div>
    </div>` : '';

  // 14. Custom Sections
  const customSecs = getAdditionalInfoList(data);
  const customHtml = customSecs.length ? customSecs.map(c => `
    <div class="mb-5">
      <h3 class="${sectionH3}" style="font-family: Georgia, serif;">${esc(c.section_name || c.title || 'Additional Information')}</h3>
      ${bulletList(c.content || c.description, 'text-[11px] text-[#333333]')}
    </div>`).join('') : '';

  const body = `
  <div class="p-10 bg-white text-[#111111] max-w-[800px] mx-auto text-left leading-relaxed">
    <div class="text-center pb-5 border-b border-slate-400 mb-5">
      <h1 class="text-3xl font-bold text-black tracking-wide uppercase" style="font-family: Georgia, 'Times New Roman', serif;">${name}</h1>
      ${locationLine}
      ${contactLine}
    </div>
    ${objective}
    ${summary}
    ${skills}
    ${personalSkills}
    ${experience}
    ${internships}
    ${projects}
    ${education}
    ${certifications}
    ${publications}
    ${achievements}
    ${leadership}
    ${hobbies}
    ${personalDetails}
    ${customHtml}
  </div>`;

  return htmlShell(body, fontFamily || 'Georgia', fontSize);
}
