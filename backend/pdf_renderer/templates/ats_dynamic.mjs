import { esc } from './shared.mjs';

// Predefined presets for the 20 templates
export const TemplatePresets = {
  'classic-professional': {
    accentColor: '#1E3A8A',
    fontFamily: 'Georgia',
    spacing: 1.4,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'classic',
    dividerStyle: 'solid'
  },
  'modern-professional': {
    accentColor: '#14532D',
    fontFamily: 'Inter',
    spacing: 1.3,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'modern',
    dividerStyle: 'solid'
  },
  'minimal-professional': {
    accentColor: '#4B5563',
    fontFamily: 'Roboto',
    spacing: 1.35,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'classic',
    dividerStyle: 'none'
  },
  'executive': {
    accentColor: '#0F172A',
    fontFamily: 'Georgia',
    spacing: 1.4,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'modern',
    dividerStyle: 'solid'
  },
  'software-engineer': {
    accentColor: '#059669',
    fontFamily: 'Roboto',
    spacing: 1.3,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'classic',
    dividerStyle: 'solid'
  },
  'business': {
    accentColor: '#1E3A8A',
    fontFamily: 'Lato',
    spacing: 1.35,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'centered',
    dividerStyle: 'solid'
  },
  'student': {
    accentColor: '#7C3AED',
    fontFamily: 'Poppins',
    spacing: 1.35,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'classic',
    dividerStyle: 'dashed'
  },
  'college-fresher': {
    accentColor: '#4B5563',
    fontFamily: 'Inter',
    spacing: 1.3,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'centered',
    dividerStyle: 'solid'
  },
  'simple-ats': {
    accentColor: '#000000',
    fontFamily: 'Inter',
    spacing: 1.4,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'classic',
    dividerStyle: 'solid'
  },
  'corporate-ats': {
    accentColor: '#0F172A',
    fontFamily: 'Roboto',
    spacing: 1.35,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'classic',
    dividerStyle: 'solid'
  },
  'harvard-style': {
    accentColor: '#000000',
    fontFamily: 'Georgia',
    spacing: 1.4,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'centered',
    dividerStyle: 'solid'
  },
  'stanford-style': {
    accentColor: '#990000',
    fontFamily: 'Georgia',
    spacing: 1.4,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'classic',
    dividerStyle: 'solid'
  },
  'mit-style': {
    accentColor: '#8A1538',
    fontFamily: 'Roboto',
    spacing: 1.3,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'classic',
    dividerStyle: 'solid'
  },
  'two-column-modern': {
    accentColor: '#14532D',
    fontFamily: 'Inter',
    spacing: 1.3,
    margins: 15,
    layout: 'two-column',
    headerStyle: 'modern',
    dividerStyle: 'solid'
  },
  'elegant-minimal': {
    accentColor: '#4B5563',
    fontFamily: 'Georgia',
    spacing: 1.4,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'classic',
    dividerStyle: 'none'
  },
  'reverse-chronological': {
    accentColor: '#1E3A8A',
    fontFamily: 'Inter',
    spacing: 1.35,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'classic',
    dividerStyle: 'solid'
  },
  'project-focused': {
    accentColor: '#059669',
    fontFamily: 'Roboto',
    spacing: 1.35,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'classic',
    dividerStyle: 'solid'
  },
  'research-resume': {
    accentColor: '#0F172A',
    fontFamily: 'Georgia',
    spacing: 1.4,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'centered',
    dividerStyle: 'solid'
  },
  'academic-cv': {
    accentColor: '#000000',
    fontFamily: 'Georgia',
    spacing: 1.45,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'centered',
    dividerStyle: 'solid'
  },
  'internship-resume': {
    accentColor: '#7C3AED',
    fontFamily: 'Poppins',
    spacing: 1.35,
    margins: 15,
    layout: 'one-column',
    headerStyle: 'classic',
    dividerStyle: 'solid'
  }
};

export function renderAtsDynamic(data, presetName, customConfig = {}) {
  // Merge custom config options on top of the selected preset
  const preset = TemplatePresets[presetName] || TemplatePresets['classic-professional'];
  const config = { ...preset, ...customConfig };

  const p = data.personal_info || {};
  const name = esc(p.name || 'Your Full Name');
  const email = esc(p.email || '');
  const phone = esc(p.phone || '');
  const location = esc(p.location || p.address || '');
  
  const accentColor = config.accentColor || '#14532D';
  const fontFamily = config.fontFamily || 'Inter';
  const fontSize = config.fontSize || 11;
  const lineSpacing = config.spacing || 1.35;
  const margins = config.margins || 15; // in mm
  const layout = config.layout || 'one-column';
  const headerStyle = config.headerStyle || 'classic';
  const dividerStyle = config.dividerStyle || 'solid';
  const enabledSections = config.enabledSections || {
    summary: true,
    experience: true,
    projects: true,
    skills: true,
    education: true,
    certifications: true
  };

  const fontImportMap = {
    'Inter': 'Inter:wght@400;500;600;700;800;900',
    'Roboto': 'Roboto:wght@400;500;700;900',
    'Poppins': 'Poppins:wght@400;500;600;700',
    'Lato': 'Lato:wght@400;700',
    'Open Sans': 'Open+Sans:wght@400;600;700',
    'Merriweather': 'Merriweather:wght@450;700',
    'Georgia': 'Lora:wght@400;600;700',
  };

  const googleFontWeight = fontImportMap[fontFamily] || 'Inter:wght@400;500;600;700;800;900';
  const fontImport = `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${googleFontWeight}&display=swap" rel="stylesheet">`;

  const fontCssName = {
    'Inter': "'Inter', sans-serif",
    'Roboto': "'Roboto', sans-serif",
    'Poppins': "'Poppins', sans-serif",
    'Lato': "'Lato', sans-serif",
    'Open Sans': "'Open Sans', sans-serif",
    'Merriweather': "'Merriweather', serif",
    'Georgia': "'Lora', 'Georgia', serif",
  }[fontFamily] || "'Inter', sans-serif";

  // Header Style rendering
  let headerHtml = '';
  const contactParts = [email, phone, location].filter(Boolean);
  
  if (headerStyle === 'centered') {
    headerHtml = `
      <div class="text-center mb-6">
        <h1 class="font-extrabold uppercase tracking-wide leading-none" style="font-size: 28px; color: ${accentColor};">${name}</h1>
        <div class="text-[10px] text-slate-500 font-bold mt-2 flex flex-wrap justify-center gap-4">
          ${contactParts.map(c => `<span>${c}</span>`).join('')}
        </div>
      </div>
    `;
  } else if (headerStyle === 'modern') {
    headerHtml = `
      <div class="flex justify-between items-end border-b-2 pb-4 mb-6" style="border-color: ${accentColor}22;">
        <div class="text-left">
          <h1 class="font-black uppercase tracking-tight leading-none" style="font-size: 32px; color: ${accentColor};">${name}</h1>
          <p class="text-[11px] text-slate-450 font-black tracking-wider uppercase mt-1">Software Engineer</p>
        </div>
        <div class="text-right text-[10px] text-slate-500 font-bold space-y-0.5">
          ${contactParts.map(c => `<div>${c}</div>`).join('')}
        </div>
      </div>
    `;
  } else {
    headerHtml = `
      <div class="text-left mb-6">
        <h1 class="font-extrabold uppercase tracking-wide leading-none" style="font-size: 30px; color: ${accentColor};">${name}</h1>
        <div class="text-[10px] text-slate-555 font-bold mt-2 flex flex-wrap gap-4">
          ${contactParts.map(c => `<span>${c}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // Section title generator
  const renderSectionHeader = (title) => {
    if (dividerStyle === 'none') {
      return `<h3 class="font-black uppercase tracking-wider text-[13px] mb-2" style="color: ${accentColor};">${title}</h3>`;
    }
    const borderClass = dividerStyle === 'dashed' ? 'border-dashed' : 'border-solid';
    return `
      <div class="mb-3 mt-4">
        <h3 class="font-black uppercase tracking-wider text-[13px] mb-1" style="color: ${accentColor};">${title}</h3>
        <div class="border-b-2 ${borderClass}" style="border-color: ${accentColor}; opacity: 0.85;"></div>
      </div>
    `;
  };

  // 1. Summary
  const summaryHtml = (enabledSections.summary && data.summary) ? `
    <div class="mb-[18px]">
      ${renderSectionHeader('Professional Summary')}
      <p class="text-[11px] text-slate-700 leading-relaxed font-medium">${esc(data.summary)}</p>
    </div>
  ` : '';

  // 2. Experience
  let experienceHtml = '';
  if (enabledSections.experience && data.experience && data.experience.length > 0) {
    const listHtml = data.experience.map(exp => {
      const bullets = exp.description ? exp.description.split('•').map(b => b.trim()).filter(Boolean) : [];
      const bulletsList = bullets.map(b => `<li class="relative pl-3 text-slate-650 leading-relaxed font-medium before:content-['•'] before:absolute before:left-0 before:text-emerald-700">${esc(b)}</li>`).join('');
      return `
        <div class="mb-4">
          <div class="flex justify-between items-baseline">
            <span class="font-extrabold text-[12px] text-slate-900">${esc(exp.company)}</span>
            <span class="text-[10px] font-bold text-slate-450">${esc(exp.duration)}</span>
          </div>
          <div class="text-[11px] font-bold text-slate-600 mt-0.5">${esc(exp.position)}</div>
          ${bulletsList ? `<ul class="mt-1.5 space-y-1 text-[11px]">${bulletsList}</ul>` : `<p class="text-[11px] text-slate-650 mt-1">${esc(exp.description)}</p>`}
        </div>
      `;
    }).join('');
    
    experienceHtml = `
      <div class="mb-[18px]">
        ${renderSectionHeader('Work Experience')}
        <div class="space-y-4">${listHtml}</div>
      </div>
    `;
  }

  // 3. Projects
  let projectsHtml = '';
  if (enabledSections.projects && data.projects && data.projects.length > 0) {
    const listHtml = data.projects.map(proj => {
      return `
        <div class="mb-3">
          <div class="flex justify-between items-baseline">
            <span class="font-extrabold text-[12px] text-slate-900">${esc(proj.title || proj.name)}</span>
            ${proj.technologies ? `<span class="text-[10px] text-emerald-600 font-bold">(${esc(proj.technologies)})</span>` : ''}
          </div>
          ${proj.description ? `<p class="text-[11px] text-slate-655 mt-1 leading-relaxed">${esc(proj.description)}</p>` : ''}
        </div>
      `;
    }).join('');
    
    projectsHtml = `
      <div class="mb-[18px]">
        ${renderSectionHeader('Academic & Personal Projects')}
        <div class="space-y-3">${listHtml}</div>
      </div>
    `;
  }

  // 4. Skills
  let skillsHtml = '';
  if (enabledSections.skills && data.skills && data.skills.length > 0) {
    const skillList = Array.isArray(data.skills) ? data.skills : [data.skills];
    const skillItems = skillList.map(s => `
      <span class="inline-flex items-center text-[11px] font-bold text-slate-700">
        ${esc(s)}
      </span>
    `).join(' <span class="text-slate-300 mx-1.5">•</span> ');

    skillsHtml = `
      <div class="mb-[18px]">
        ${renderSectionHeader('Skills Profile')}
        <div class="flex flex-wrap items-center mt-1">${skillItems}</div>
      </div>
    `;
  }

  // 5. Education
  let educationHtml = '';
  if (enabledSections.education && data.education && data.education.length > 0) {
    const listHtml = data.education.map(edu => `
      <div class="mb-3 flex justify-between items-start">
        <div>
          <span class="font-extrabold text-[12px] text-slate-900">${esc(edu.institution)}</span>
          <div class="text-[11px] font-bold text-slate-600 mt-0.5">${esc(edu.degree)}</div>
        </div>
        <div class="text-right">
          <span class="text-[10.5px] font-bold text-slate-500">${esc(edu.year)}</span>
          ${edu.cgpa_percentage ? `<div class="text-[10px] text-slate-400 font-semibold mt-0.5">CGPA: ${esc(edu.cgpa_percentage)}</div>` : ''}
        </div>
      </div>
    `).join('');
    
    educationHtml = `
      <div class="mb-[18px]">
        ${renderSectionHeader('Education')}
        <div class="space-y-3">${listHtml}</div>
      </div>
    `;
  }

  // 6. Certifications
  let certificationsHtml = '';
  if (enabledSections.certifications && data.certifications && data.certifications.length > 0) {
    const listHtml = data.certifications.map(cert => `
      <div class="mb-2 flex justify-between items-baseline">
        <span class="font-extrabold text-[11.5px] text-slate-800">${esc(cert.name)} ${cert.organization ? `by ${esc(cert.organization)}` : ''}</span>
        <span class="text-[10px] font-bold text-slate-500">${esc(cert.issue_date || '')}</span>
      </div>
    `).join('');
    
    certificationsHtml = `
      <div class="mb-[18px]">
        ${renderSectionHeader('Certifications')}
        <div class="space-y-2">${listHtml}</div>
      </div>
    `;
  }

  // Assemble template content
  let contentHtml = '';
  if (layout === 'two-column') {
    contentHtml = `
      <div class="grid grid-cols-12 gap-6 mt-4">
        <div class="col-span-8 space-y-4">
          ${summaryHtml}
          ${experienceHtml}
          ${projectsHtml}
        </div>
        <div class="col-span-4 space-y-4">
          ${skillsHtml}
          ${educationHtml}
          ${certificationsHtml}
        </div>
      </div>
    `;
  } else {
    contentHtml = `
      <div class="space-y-4">
        ${summaryHtml}
        ${skillsHtml}
        ${experienceHtml}
        ${projectsHtml}
        ${educationHtml}
        ${certificationsHtml}
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${fontImport}
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: white; }
    body {
      font-family: ${fontCssName};
      font-size: ${fontSize}pt;
      line-height: ${lineSpacing};
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body class="bg-white">
  <div 
    style="
      width: 210mm;
      min-height: 297mm;
      padding: ${margins}mm;
      box-sizing: border-box;
      margin: 0 auto;
    "
  >
    ${headerHtml}
    ${contentHtml}
  </div>
</body>
</html>`;
}
