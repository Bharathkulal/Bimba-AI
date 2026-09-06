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

export function renderJakes(data, fontFamily, fontSize) {
  if (!data) return '';
  const p = data.personal_info || {};
  const contactParts = [
    p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : '',
    p.phone ? esc(p.phone) : '',
    p.location || p.address ? esc(p.location || p.address) : '',
    p.linkedin ? `<a href="${p.linkedin.startsWith('http') ? esc(p.linkedin) : 'https://' + esc(p.linkedin)}" target="_blank">LinkedIn</a>` : '',
    p.github ? `<a href="${p.github.startsWith('http') ? esc(p.github) : 'https://' + esc(p.github)}" target="_blank">GitHub</a>` : '',
    p.portfolio || p.website ? `<a href="${(p.portfolio || p.website).startsWith('http') ? esc(p.portfolio || p.website) : 'https://' + esc(p.portfolio || p.website)}" target="_blank">Portfolio</a>` : '',
  ].filter(Boolean);

  const fontClass = fontFamily === 'Times New Roman' ? 'font-serif' : 'font-sans';
  const name = esc((p.name || 'Candidate Name').toUpperCase());

  const sectionH3 = 'text-[12px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 mt-3';

  // 1. Objective & Summary
  const objective = data.objective ? `
    <div class="mb-3">
      <h3 class="${sectionH3}">Objective</h3>
      <p class="text-[10.5px] text-slate-700 leading-relaxed text-justify">${esc(data.objective)}</p>
    </div>` : '';

  const summary = data.summary ? `
    <div class="mb-3">
      <h3 class="${sectionH3}">Summary</h3>
      <p class="text-[10.5px] text-slate-700 leading-relaxed text-justify">${esc(data.summary)}</p>
    </div>` : '';

  // 2. Education
  const eduList = data.education || [];
  const education = eduList.length ? `
    <div class="mb-3">
      <h3 class="${sectionH3}">Education</h3>
      <div class="space-y-1.5">
        ${eduList.map(edu => {
          const deg = getEduDegree(edu);
          const school = getEduSchool(edu);
          const yr = getEduYear(edu);
          const score = getEduScore(edu);
          const spec = getEduSpecialization(edu);
          const loc = getEduLocation(edu);
          return `
          <div class="entry-block space-y-0.5">
            <div class="flex justify-between items-baseline text-[11px] font-black text-slate-900">
              <span>${esc(school)}${loc ? ` &mdash; ${esc(loc)}` : ''}</span>
              <span class="font-medium text-[10px] text-slate-600">${esc(yr)}</span>
            </div>
            <div class="flex justify-between items-baseline text-[10.5px] text-slate-700">
              <span class="italic">${esc(deg)}${spec ? ` in ${esc(spec)}` : ''}</span>
              ${score ? `<span class="font-semibold text-slate-800">CGPA/Score: ${esc(score)}</span>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // 3. Experience
  const expList = data.experience || [];
  const experience = expList.length ? `
    <div class="mb-3">
      <h3 class="${sectionH3}">Experience</h3>
      <div class="space-y-2.5">
        ${expList.map(exp => {
          const comp = getExpCompany(exp);
          const pos = getExpTitle(exp);
          const dur = getExpDuration(exp);
          const loc = getExpLocation(exp);
          const b = getExpBullets(exp);
          return `
          <div class="entry-block space-y-0.5">
            <div class="flex justify-between items-baseline text-[11px] font-black text-slate-900">
              <span>${esc(pos)}</span>
              <span class="font-medium text-[10px] text-slate-600">${esc(dur)}</span>
            </div>
            <div class="flex justify-between items-baseline text-[10.5px] font-bold text-slate-700">
              <span>${esc(comp)}</span>
              ${loc ? `<span class="font-medium text-[10px] text-slate-500 italic">${esc(loc)}</span>` : ''}
            </div>
            ${bulletList(b, 'text-[10px] text-slate-700')}
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // 4. Internships
  const internshipList = getInternshipsList(data);
  const internships = internshipList.length ? `
    <div class="mb-3">
      <h3 class="${sectionH3}">Internships</h3>
      <div class="space-y-2.5">
        ${internshipList.map(item => {
          const role = item.role || item.position || item.title || 'Intern';
          const comp = item.company || item.organization || '';
          const dur = item.duration || (item.start_date ? (item.end_date ? `${item.start_date} – ${item.end_date}` : item.start_date) : '');
          const loc = item.location || '';
          const desc = item.description || item.responsibilities || '';
          return `
          <div class="entry-block space-y-0.5">
            <div class="flex justify-between items-baseline text-[11px] font-black text-slate-900">
              <span>${esc(role)}</span>
              <span class="font-medium text-[10px] text-slate-600">${esc(dur)}</span>
            </div>
            <div class="flex justify-between items-baseline text-[10.5px] font-bold text-slate-700">
              <span>${esc(comp)}</span>
              ${loc ? `<span class="font-medium text-[10px] text-slate-500 italic">${esc(loc)}</span>` : ''}
            </div>
            ${bulletList(desc, 'text-[10px] text-slate-700')}
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // 5. Projects
  const projList = data.projects || [];
  const projects = projList.length ? `
    <div class="mb-3">
      <h3 class="${sectionH3}">Projects</h3>
      <div class="space-y-2">
        ${projList.map(proj => {
          const title = getProjTitle(proj);
          const tech = getProjTech(proj);
          const dur = getProjDuration(proj);
          const url = getProjUrl(proj);
          const desc = getProjDesc(proj);
          return `
          <div class="entry-block space-y-0.5">
            <div class="flex justify-between items-baseline text-[11px] font-black text-slate-900">
              <span>
                ${esc(title)}
                ${tech ? `<span class="font-normal text-[9.5px] text-slate-600"> | <em>${esc(tech)}</em></span>` : ''}
              </span>
              <div class="flex items-center gap-2">
                ${url ? `<a href="${url.startsWith('http') ? esc(url) : 'https://' + esc(url)}" target="_blank" class="text-[9.5px] text-blue-600 font-semibold hover:underline">Link</a>` : ''}
                ${dur ? `<span class="font-medium text-[10px] text-slate-600">${esc(dur)}</span>` : ''}
              </div>
            </div>
            ${bulletList(desc, 'text-[10px] text-slate-700 leading-normal')}
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // 6. Skills
  const skillCategories = normalizeSkills(data);
  const skills = skillCategories.length ? `
    <div class="mb-3">
      <h3 class="${sectionH3}">Technical Skills</h3>
      <div class="space-y-1 text-[10.5px] text-slate-700 leading-relaxed">
        ${skillCategories.map(cat => `
          <div><strong class="text-slate-900">${esc(cat.category)}:</strong> ${esc(cat.items.join(', '))}</div>
        `).join('')}
      </div>
    </div>` : '';

  // 7. Personal Skills
  const personalSkillsList = normalizePersonalSkills(data);
  const personalSkills = personalSkillsList.length ? `
    <div class="mb-3">
      <h3 class="${sectionH3}">Personal Skills</h3>
      <p class="text-[10.5px] text-slate-700 leading-relaxed">${esc(personalSkillsList.join(', '))}</p>
    </div>` : '';

  // 8. Certifications
  const certList = data.certifications || data.certificates || [];
  const certifications = certList.length ? `
    <div class="mb-3">
      <h3 class="${sectionH3}">Certifications</h3>
      <div class="space-y-1.5">
        ${certList.map(cert => `
        <div class="entry-block flex justify-between items-baseline text-[10.5px] font-bold text-slate-800">
          <span>${esc(cert.name || cert.title)}${cert.organization || cert.issuer ? ` &mdash; ${esc(cert.organization || cert.issuer)}` : ''}</span>
          <span class="font-medium text-[10px] text-slate-500">${esc(cert.issue_date || cert.year || '')}</span>
        </div>`).join('')}
      </div>
    </div>` : '';

  // 9. Publications
  const pubList = getPublicationsList(data);
  const publications = pubList.length ? `
    <div class="mb-3">
      <h3 class="${sectionH3}">Publications</h3>
      <div class="space-y-1.5 text-[10.5px] text-slate-700">
        ${pubList.map(pub => `
        <div class="entry-block">
          <span class="font-bold text-slate-900">${esc(pub.title)}</span>
          ${pub.journal || pub.publisher ? ` &mdash; <em>${esc(pub.journal || pub.publisher)}</em>` : ''}
          ${pub.year ? ` (${esc(pub.year)})` : ''}
        </div>`).join('')}
      </div>
    </div>` : '';

  // 10. Achievements
  const achList = getAchievementsList(data);
  const achievements = achList.length ? `
    <div class="mb-3">
      <h3 class="${sectionH3}">Awards & Achievements</h3>
      <div class="space-y-1 text-[10.5px] text-slate-700">
        ${achList.map(ach => {
          if (typeof ach === 'string') return `<p>• ${esc(ach)}</p>`;
          return `<div class="entry-block flex justify-between items-baseline">
            <span>• <strong>${esc(ach.title || ach.name)}</strong>${ach.issuer ? ` &mdash; ${esc(ach.issuer)}` : ''}</span>
            ${ach.year || ach.date ? `<span class="text-[10px] text-slate-500">${esc(ach.year || ach.date)}</span>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // 11. Leadership
  const leadList = getLeadershipList(data);
  const leadership = leadList.length ? `
    <div class="mb-3">
      <h3 class="${sectionH3}">Leadership & Activities</h3>
      <div class="space-y-1 text-[10.5px] text-slate-700">
        ${leadList.map(item => `
        <div class="entry-block flex justify-between items-baseline">
          <span><strong>${esc(item.role || item.title)}</strong>${item.organization ? ` &mdash; ${esc(item.organization)}` : ''}</span>
          <span class="text-[10px] text-slate-500">${esc(item.duration || item.year || '')}</span>
        </div>`).join('')}
      </div>
    </div>` : '';

  // 12. Hobbies
  const hobbiesList = getHobbiesList(data);
  const hobbies = hobbiesList.length ? `
    <div class="mb-3">
      <h3 class="${sectionH3}">Hobbies & Interests</h3>
      <p class="text-[10.5px] text-slate-700 leading-relaxed">${esc(hobbiesList.join(', '))}</p>
    </div>` : '';

  // 13. Personal Details
  const personalDetailsList = getPersonalDetailsList(data);
  const personalDetails = personalDetailsList.length ? `
    <div class="mb-3">
      <h3 class="${sectionH3}">Personal Details</h3>
      <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[10.5px] text-slate-700">
        ${personalDetailsList.map(item => `
          <div><strong class="text-slate-900">${esc(item.label)}:</strong> ${esc(item.value)}</div>
        `).join('')}
      </div>
    </div>` : '';

  // 14. Custom Sections
  const customList = getAdditionalInfoList(data);
  const customSections = customList.length ? customList.map(sec => `
    <div class="mb-3">
      <h3 class="${sectionH3}">${esc(sec.section_name || sec.title || 'Additional Information')}</h3>
      ${bulletList(sec.content || sec.description, 'text-[10.5px] text-slate-700')}
    </div>`).join('') : '';

  const body = `
  <div class="p-8 bg-white text-[#111111] max-w-[800px] mx-auto text-left ${fontClass} leading-normal">
    <div class="text-center mb-4">
      <h1 class="text-2xl font-bold tracking-wide uppercase text-slate-900">${name}</h1>
      <div class="text-[10px] text-slate-600 font-medium tracking-wide mt-1.5 flex flex-wrap justify-center gap-1.5">
        ${contactParts.join(' <span class="text-slate-350">|</span> ')}
      </div>
    </div>
    ${objective}
    ${summary}
    ${education}
    ${experience}
    ${internships}
    ${projects}
    ${skills}
    ${personalSkills}
    ${certifications}
    ${publications}
    ${achievements}
    ${leadership}
    ${hobbies}
    ${personalDetails}
    ${customSections}
  </div>`;

  return htmlShell(body, fontFamily, fontSize);
}
