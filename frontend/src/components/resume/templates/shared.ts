import type { ResumeBuilderData, SkillCategoryItem } from '../../../store/resumeBuilderStore';

export function normalizeSkillsList(data: ResumeBuilderData): SkillCategoryItem[] {
  if (!data) return [];
  const result: SkillCategoryItem[] = [];
  const rawCategories = data.skill_categories || [];
  const rawSkills = data.technicalSkills || data.skills || [];

  if (Array.isArray(rawCategories) && rawCategories.length > 0) {
    for (const cat of rawCategories) {
      if (!cat) continue;
      const categoryName = cat.category || (cat as any).name || 'Technical Skills';
      let items: string[] = [];
      if (Array.isArray(cat.skills)) items = cat.skills;
      else if (Array.isArray((cat as any).items)) items = (cat as any).items;
      else if (typeof cat.skills === 'string') items = (cat.skills as string).split(',').map(s => s.trim());
      const filtered = items.map(s => typeof s === 'string' ? s.trim() : (s as any)?.name || String(s)).filter(Boolean);
      if (filtered.length > 0) {
        result.push({ category: categoryName, skills: filtered });
      }
    }
  }

  if (result.length === 0 && Array.isArray(rawSkills) && rawSkills.length > 0) {
    const uncatMap: Record<string, string[]> = {};
    for (const item of rawSkills) {
      if (!item) continue;
      if (typeof item === 'object') {
        const cat = item.category || 'Technical Skills';
        const name = item.name || item.skill || item.value || '';
        const items = Array.isArray(item.skills) ? item.skills : (Array.isArray(item.items) ? item.items : [name]);
        if (!uncatMap[cat]) uncatMap[cat] = [];
        uncatMap[cat].push(...items.filter(Boolean));
      } else if (typeof item === 'string') {
        const val = item.trim();
        if (val.includes(':')) {
          const parts = val.split(':');
          const cat = parts[0].trim();
          const items = parts.slice(1).join(':').split(',').map(x => x.trim()).filter(Boolean);
          if (!uncatMap[cat]) uncatMap[cat] = [];
          uncatMap[cat].push(...items);
        } else {
          if (!uncatMap['Technical Skills']) uncatMap['Technical Skills'] = [];
          uncatMap['Technical Skills'].push(val);
        }
      }
    }
    for (const [cat, items] of Object.entries(uncatMap)) {
      if (items.length > 0) {
        result.push({ category: cat, skills: Array.from(new Set(items)) });
      }
    }
  } else if (result.length === 0 && typeof rawSkills === 'string' && (rawSkills as string).trim()) {
    result.push({ category: 'Technical Skills', skills: (rawSkills as string).split(',').map(s => s.trim()).filter(Boolean) });
  }

  return result;
}

export function normalizePersonalSkillsList(data: ResumeBuilderData): string[] {
  if (!data) return [];
  const raw = data.personalSkills || (data as any).personal_skills || (data as any).soft_skills || data.softSkills || [];
  if (Array.isArray(raw)) {
    return raw.map(s => typeof s === 'string' ? s.trim() : (s as any)?.name || String(s)).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

export function getPersonalDetailsEntries(data: ResumeBuilderData): { label: string; value: string }[] {
  if (!data) return [];
  const pd = data.personal_details || {};
  const entries: { label: string; value: string }[] = [];
  if (pd.date_of_birth) entries.push({ label: 'Date of Birth', value: pd.date_of_birth });
  if (pd.gender) entries.push({ label: 'Gender', value: pd.gender });
  if (pd.marital_status) entries.push({ label: 'Marital Status', value: pd.marital_status });
  if (pd.nationality) entries.push({ label: 'Nationality', value: pd.nationality });
  if (pd.languages_known && (Array.isArray(pd.languages_known) ? pd.languages_known.length : pd.languages_known)) {
    entries.push({ label: 'Languages Known', value: Array.isArray(pd.languages_known) ? pd.languages_known.join(', ') : String(pd.languages_known) });
  }
  if (pd.passport_number) entries.push({ label: 'Passport No.', value: pd.passport_number });
  if (pd.permanent_address) entries.push({ label: 'Permanent Address', value: pd.permanent_address });
  return entries;
}

export function getHobbies(data: ResumeBuilderData): string[] {
  if (!data) return [];
  const raw = data.hobbies_interests || data.hobbies || (data as any).interests || [];
  if (Array.isArray(raw)) return raw.map(h => String(h).trim()).filter(Boolean);
  if (typeof raw === 'string' && raw.trim()) return raw.split(',').map(h => h.trim()).filter(Boolean);
  return [];
}

export function parseBullets(description?: string | string[]): string[] {
  if (!description) return [];
  if (Array.isArray(description)) return description.map(b => String(b).trim()).filter(Boolean);
  return description.split(/[•\n]/).map(b => b.trim()).filter(Boolean);
}
