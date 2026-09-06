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

export function renderHarvard(data, fontFamily, fontSize) {
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

  const name = esc((p.name || 'Candidate Name').toUpperCase());
  const headline = p.title || data.target_role || '';

  const sectionHeader = (title) => `
    <div class="section-header border-b border-slate-300 pb-1 mb-2 mt-4">
      <h3 class="text-[12.5px] font-black uppercase tracking-wider text-slate-900">${title}</h3>
    </div>
  `;

  // 1. Objective & Summary
  const objective = data.objective ? `
    <div class="mb-4">
      ${sectionHeader('Career Objective')}
      <p class="text-[11px] text-slate-700 leading-relaxed text-justify">${esc(data.objective)}</p>
    </div>` : '';

  const summary = data.summary ? `
    <div class="mb-4">
      ${sectionHeader('Professional Summary')}
      <p class="text-[11px] text-slate-700 leading-relaxed text-justify">${esc(data.summary)}</p>
    </div>` : '';

  // 2. Technical & Categorized Skills
  const skillCategories = normalizeSkills(data);
  const skills = skillCategories.length ? `
    <div class="mb-4">
      ${sectionHeader('Technical Skills')}
      <div class="space-y-1 text-[11px] text-slate-700 leading-relaxed">
        ${skillCategories.map(cat => `
          <div><strong class="text-slate-900">${esc(cat.category)}:</strong> ${esc(cat.items.join(', '))}</div>
        `).join('')}
      </div>
    </div>` : '';

  // 3. Personal / Soft Skills
  const personalSkillsList = normalizePersonalSkills(data);
  const personalSkills = personalSkillsList.length ? `
    <div class="mb-4">
      ${sectionHeader('Personal / Soft Skills')}
      <p class="text-[11px] text-slate-700 leading-relaxed">${esc(personalSkillsList.join(', '))}</p>
    </div>` : '';

  // 4. Work Experience
  const expList = data.experience || [];
  const experience = expList.length ? `
    <div class="mb-4">
      ${sectionHeader('Work Experience')}
      <div class="space-y-3">
        ${expList.map(exp => {
          const comp = getExpCompany(exp);
          const pos = getExpTitle(exp);
          const dur = getExpDuration(exp);
          const loc = getExpLocation(exp);
          const b = getExpBullets(exp);
          return `
          <div class="entry-block space-y-0.5">
            <div class="flex justify-between items-baseline">
              <h4 class="text-[11.5px] font-black text-slate-850">${esc(pos)}</h4>
              <span class="text-[10px] font-semibold text-slate-500">${esc(dur)}</span>
            </div>
            <div class="flex justify-between items-baseline text-[11px] font-bold text-slate-650">
              <span>${esc(comp)}</span>
              ${loc ? `<span class="text-[10px] font-medium text-slate-500 italic">${esc(loc)}</span>` : ''}
            </div>
            ${bulletList(b, 'text-[10.5px] text-slate-700')}
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // 5. Internships
  const internshipList = getInternshipsList(data);
  const internships = internshipList.length ? `
    <div class="mb-4">
      ${sectionHeader('Internships')}
      <div class="space-y-3">
        ${internshipList.map(item => {
          const role = item.role || item.position || item.title || 'Intern';
          const comp = item.company || item.organization || '';
          const dur = item.duration || (item.start_date ? (item.end_date ? `${item.start_date} – ${item.end_date}` : item.start_date) : '');
          const loc = item.location || '';
          const desc = item.description || item.responsibilities || '';
          return `
          <div class="entry-block space-y-0.5">
            <div class="flex justify-between items-baseline">
              <h4 class="text-[11.5px] font-black text-slate-850">${esc(role)}</h4>
              <span class="text-[10px] font-semibold text-slate-500">${esc(dur)}</span>
            </div>
            <div class="flex justify-between items-baseline text-[11px] font-bold text-slate-650">
              <span>${esc(comp)}</span>
              ${loc ? `<span class="text-[10px] font-medium text-slate-500 italic">${esc(loc)}</span>` : ''}
            </div>
            ${bulletList(desc, 'text-[10.5px] text-slate-700')}
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // 6. Projects
  const projList = data.projects || [];
  const projects = projList.length ? `
    <div class="mb-4">
      ${sectionHeader('Academic & Personal Projects')}
      <div class="space-y-3">
        ${projList.map(proj => {
          const title = getProjTitle(proj);
          const tech = getProjTech(proj);
          const dur = getProjDuration(proj);
          const url = getProjUrl(proj);
          const desc = getProjDesc(proj);
          return `
          <div class="entry-block space-y-0.5">
            <div class="flex justify-between items-baseline">
              <h4 class="text-[11.5px] font-black text-slate-850">
                ${esc(title)}
                ${tech ? `<span class="text-[10px] font-medium text-slate-500 ml-1">(${esc(tech)})</span>` : ''}
              </h4>
              <div class="flex items-center gap-2">
                ${url ? `<a href="${url.startsWith('http') ? esc(url) : 'https://' + esc(url)}" target="_blank" class="text-[10px] text-blue-600 font-semibold hover:underline">Link</a>` : ''}
                ${dur ? `<span class="text-[10px] font-semibold text-slate-500">${esc(dur)}</span>` : ''}
              </div>
            </div>
            ${bulletList(desc, 'text-[10.5px] text-slate-700')}
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // 7. Education
  const eduList = data.education || [];
  const education = eduList.length ? `
    <div class="mb-4">
      ${sectionHeader('Education')}
      <div class="space-y-3">
        ${eduList.map(edu => {
          const degree = getEduDegree(edu);
          const school = getEduSchool(edu);
          const year = getEduYear(edu);
          const score = getEduScore(edu);
          const spec = getEduSpecialization(edu);
          const loc = getEduLocation(edu);
          return `
          <div class="entry-block space-y-0.5">
            <div class="flex justify-between items-baseline">
              <h4 class="text-[11.5px] font-black text-slate-850">
                ${esc(degree)}${spec ? ` in ${esc(spec)}` : ''}
              </h4>
              <span class="text-[10px] font-semibold text-slate-500">${esc(year)}</span>
            </div>
            <div class="flex justify-between items-baseline text-[11px] text-slate-650 font-bold">
              <span>${esc(school)}${loc ? ` &mdash; ${esc(loc)}` : ''}</span>
              ${score ? `<span class="text-[10.5px] font-semibold text-slate-700">CGPA/Score: ${esc(score)}</span>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // 8. Certifications
  const certList = data.certifications || data.certificates || [];
  const certifications = certList.length ? `
    <div class="mb-4">
      ${sectionHeader('Certifications')}
      <div class="space-y-2">
        ${certList.map(cert => {
          const name = cert.name || cert.title || '';
          const org = cert.organization || cert.issuer || '';
          const date = cert.issue_date || cert.year || cert.date || '';
          return `
          <div class="entry-block flex justify-between items-baseline text-[11px]">
            <span class="font-bold text-slate-800">${esc(name)}${org ? ` &mdash; ${esc(org)}` : ''}</span>
            ${date ? `<span class="text-[10px] font-semibold text-slate-500">${esc(date)}</span>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // 9. Publications
  const pubList = getPublicationsList(data);
  const publications = pubList.length ? `
    <div class="mb-4">
      ${sectionHeader('Publications')}
      <div class="space-y-2">
        ${pubList.map(pub => {
          const title = pub.title || '';
          const authors = pub.authors || '';
          const journal = pub.journal || pub.publisher || pub.conference || '';
          const year = pub.year || pub.date || '';
          return `
          <div class="entry-block text-[11px] text-slate-700">
            <div class="font-bold text-slate-900">${esc(title)}</div>
            ${authors ? `<div class="italic text-slate-600">${esc(authors)}</div>` : ''}
            <div class="flex justify-between text-[10px] text-slate-500 font-semibold">
              <span>${esc(journal)}</span>
              <span>${esc(year)}</span>
            </div>
            ${pub.description ? `<p class="text-[10px] text-slate-600 mt-0.5">${esc(pub.description)}</p>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // 10. Achievements & Awards
  const achList = getAchievementsList(data);
  const achievements = achList.length ? `
    <div class="mb-4">
      ${sectionHeader('Awards & Achievements')}
      <div class="space-y-1 text-[11px] text-slate-700">
        ${achList.map(ach => {
          if (typeof ach === 'string') return `<p class="leading-relaxed">• ${esc(ach)}</p>`;
          return `<div class="entry-block flex justify-between items-baseline">
            <span>• <strong class="text-slate-900">${esc(ach.title || ach.name)}</strong>${ach.issuer ? ` &mdash; ${esc(ach.issuer)}` : ''}</span>
            ${ach.year || ach.date ? `<span class="text-[10px] text-slate-500 font-semibold">${esc(ach.year || ach.date)}</span>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // 11. Leadership & Co-Curricular Roles
  const leadList = getLeadershipList(data);
  const leadership = leadList.length ? `
    <div class="mb-4">
      ${sectionHeader('Leadership & Activities')}
      <div class="space-y-2">
        ${leadList.map(item => {
          const role = item.role || item.title || item.position || '';
          const org = item.organization || item.club || '';
          const dur = item.duration || item.year || '';
          const desc = item.description || '';
          return `
          <div class="entry-block space-y-0.5">
            <div class="flex justify-between items-baseline text-[11px] font-bold text-slate-850">
              <span>${esc(role)}${org ? ` &mdash; ${esc(org)}` : ''}</span>
              ${dur ? `<span class="text-[10px] font-semibold text-slate-500">${esc(dur)}</span>` : ''}
            </div>
            ${bulletList(desc, 'text-[10.5px] text-slate-700')}
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // 12. Hobbies & Interests
  const hobbiesList = getHobbiesList(data);
  const hobbies = hobbiesList.length ? `
    <div class="mb-4">
      ${sectionHeader('Hobbies & Interests')}
      <p class="text-[11px] text-slate-700 leading-relaxed">${esc(hobbiesList.join(', '))}</p>
    </div>` : '';

  // 13. Personal Details
  const personalDetailsList = getPersonalDetailsList(data);
  const personalDetails = personalDetailsList.length ? `
    <div class="mb-4">
      ${sectionHeader('Personal Details')}
      <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[10.5px] text-slate-700">
        ${personalDetailsList.map(item => `
          <div><strong class="text-slate-900">${esc(item.label)}:</strong> ${esc(item.value)}</div>
        `).join('')}
      </div>
    </div>` : '';

  // 14. Additional Information / Custom Sections
  const customList = getAdditionalInfoList(data);
  const customSections = customList.length ? customList.map(sec => {
    const title = sec.section_name || sec.title || 'Additional Information';
    const content = sec.content || sec.description || '';
    return `
    <div class="mb-4">
      ${sectionHeader(esc(title))}
      ${bulletList(content, 'text-[11px] text-slate-700')}
    </div>`;
  }).join('') : '';

  const body = `
  <div class="p-8 bg-white text-[#111111] max-w-[800px] mx-auto text-left leading-normal">
    <div class="text-center border-b-2 border-slate-900 pb-3 mb-5">
      <h1 class="text-3xl font-bold uppercase tracking-tight text-slate-900">${name}</h1>
      ${headline ? `<div class="text-[12px] font-semibold uppercase tracking-wider text-slate-600 mt-1">${esc(headline)}</div>` : ''}
      <div class="text-[11px] text-slate-600 font-semibold tracking-wide mt-1.5 flex flex-wrap justify-center gap-2">
        ${contactParts.join(' <span class="text-slate-350">•</span> ')}
      </div>
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
    ${customSections}
  </div>`;

  return htmlShell(body, fontFamily, fontSize);
}
