export type LayoutType = 'single-column' | 'two-column' | 'projects-first' | 'minimal';
export type FontType = 'sans' | 'serif' | 'mono';

export interface TemplateConfig {
  slug: string;
  name: string;
  category: string;
  layoutType: LayoutType;
  defaultColor: string;
  fontFamily: FontType;
  hasBorder: boolean;
  hasHeaderBg: boolean;
}

export const TEMPLATE_REGISTRY: Record<string, TemplateConfig> = {
  // Free templates
  modern: { slug: 'modern', name: 'Modern Professional', category: 'Professional', layoutType: 'single-column', defaultColor: 'blue', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  harvard: { slug: 'harvard', name: 'Harvard Resume', category: 'Minimalist', layoutType: 'minimal', defaultColor: 'slate', fontFamily: 'serif', hasBorder: false, hasHeaderBg: false },
  google: { slug: 'google', name: 'Google Resume', category: 'Minimalist', layoutType: 'minimal', defaultColor: 'slate', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  faang: { slug: 'faang', name: 'FAANG Resume', category: 'Technical', layoutType: 'projects-first', defaultColor: 'slate', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  fresher: { slug: 'fresher', name: 'Fresher Resume', category: 'Entry Level', layoutType: 'single-column', defaultColor: 'emerald', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  experienced: { slug: 'experienced', name: 'Experienced Resume', category: 'Professional', layoutType: 'single-column', defaultColor: 'indigo', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  executive: { slug: 'executive', name: 'Executive Resume', category: 'Executive', layoutType: 'two-column', defaultColor: 'blue', fontFamily: 'sans', hasBorder: true, hasHeaderBg: false },
  creative: { slug: 'creative', name: 'Creative ATS Resume', category: 'Creative', layoutType: 'single-column', defaultColor: 'emerald', fontFamily: 'sans', hasBorder: false, hasHeaderBg: true },
  minimal: { slug: 'minimal', name: 'Minimal Resume', category: 'Minimalist', layoutType: 'minimal', defaultColor: 'slate', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  twocolumn: { slug: 'twocolumn', name: 'Two Column ATS Resume', category: 'Modern', layoutType: 'two-column', defaultColor: 'blue', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },

  // Premium templates
  stanford: { slug: 'stanford', name: 'Stanford Resume', category: 'Academic', layoutType: 'projects-first', defaultColor: 'red', fontFamily: 'serif', hasBorder: false, hasHeaderBg: false },
  oxford: { slug: 'oxford', name: 'Oxford Resume', category: 'Academic', layoutType: 'minimal', defaultColor: 'blue', fontFamily: 'serif', hasBorder: true, hasHeaderBg: false },
  ivyleague: { slug: 'ivyleague', name: 'Ivy League Resume', category: 'Executive', layoutType: 'two-column', defaultColor: 'indigo', fontFamily: 'serif', hasBorder: true, hasHeaderBg: true },
  corporate: { slug: 'corporate', name: 'Corporate Resume', category: 'Professional', layoutType: 'single-column', defaultColor: 'slate', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  startup: { slug: 'startup', name: 'Startup Resume', category: 'Creative', layoutType: 'two-column', defaultColor: 'purple', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  developer: { slug: 'developer', name: 'Developer Resume', category: 'Technical', layoutType: 'projects-first', defaultColor: 'slate', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  datascientist: { slug: 'datascientist', name: 'Data Scientist Resume', category: 'Technical', layoutType: 'projects-first', defaultColor: 'blue', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  aiengineer: { slug: 'aiengineer', name: 'AI Engineer Resume', category: 'Technical', layoutType: 'projects-first', defaultColor: 'emerald', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  cybersecurity: { slug: 'cybersecurity', name: 'Cyber Security Resume', category: 'Technical', layoutType: 'projects-first', defaultColor: 'red', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  devops: { slug: 'devops', name: 'DevOps Resume', category: 'Technical', layoutType: 'projects-first', defaultColor: 'orange', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  cloudengineer: { slug: 'cloudengineer', name: 'Cloud Engineer Resume', category: 'Technical', layoutType: 'projects-first', defaultColor: 'blue', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  businessanalyst: { slug: 'businessanalyst', name: 'Business Analyst Resume', category: 'Professional', layoutType: 'single-column', defaultColor: 'slate', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  finance: { slug: 'finance', name: 'Finance Resume', category: 'Professional', layoutType: 'single-column', defaultColor: 'blue', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  marketing: { slug: 'marketing', name: 'Marketing Resume', category: 'Creative', layoutType: 'single-column', defaultColor: 'pink', fontFamily: 'sans', hasBorder: false, hasHeaderBg: true },
  sales: { slug: 'sales', name: 'Sales Resume', category: 'Professional', layoutType: 'single-column', defaultColor: 'orange', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  hr: { slug: 'hr', name: 'HR Resume', category: 'Professional', layoutType: 'single-column', defaultColor: 'purple', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  teacher: { slug: 'teacher', name: 'Teacher Resume', category: 'Entry Level', layoutType: 'single-column', defaultColor: 'green', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  medical: { slug: 'medical', name: 'Medical Resume', category: 'Professional', layoutType: 'single-column', defaultColor: 'blue', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  mba: { slug: 'mba', name: 'MBA Resume', category: 'Executive', layoutType: 'two-column', defaultColor: 'blue', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  law: { slug: 'law', name: 'Law Resume', category: 'Academic', layoutType: 'minimal', defaultColor: 'slate', fontFamily: 'serif', hasBorder: false, hasHeaderBg: false },
  research: { slug: 'research', name: 'Research Resume', category: 'Academic', layoutType: 'minimal', defaultColor: 'slate', fontFamily: 'serif', hasBorder: false, hasHeaderBg: false },
  productmanager: { slug: 'productmanager', name: 'Product Manager Resume', category: 'Executive', layoutType: 'two-column', defaultColor: 'blue', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  uiuxdesigner: { slug: 'uiuxdesigner', name: 'UI UX Designer Resume', category: 'Creative', layoutType: 'two-column', defaultColor: 'purple', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  graphicdesigner: { slug: 'graphicdesigner', name: 'Graphic Designer Resume', category: 'Creative', layoutType: 'two-column', defaultColor: 'pink', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  consultant: { slug: 'consultant', name: 'Consultant Resume', category: 'Professional', layoutType: 'single-column', defaultColor: 'slate', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  government: { slug: 'government', name: 'Government Resume', category: 'Minimalist', layoutType: 'minimal', defaultColor: 'slate', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  international: { slug: 'international', name: 'International Resume', category: 'Professional', layoutType: 'single-column', defaultColor: 'blue', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  internship: { slug: 'internship', name: 'Internship Resume', category: 'Entry Level', layoutType: 'single-column', defaultColor: 'emerald', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  graduate: { slug: 'graduate', name: 'Graduate Resume', category: 'Entry Level', layoutType: 'single-column', defaultColor: 'blue', fontFamily: 'sans', hasBorder: false, hasHeaderBg: false },
  academic_cv: { slug: 'academic_cv', name: 'Academic CV', category: 'Academic', layoutType: 'minimal', defaultColor: 'slate', fontFamily: 'serif', hasBorder: false, hasHeaderBg: false }
};

export const COLOR_THEMES: Record<string, { primary: string; text: string; border: string; bg: string }> = {
  blue: { primary: 'text-blue-700 dark:text-blue-400', text: 'text-slate-800', border: 'border-blue-200 dark:border-blue-900/40', bg: 'bg-blue-50/10' },
  emerald: { primary: 'text-emerald-700 dark:text-emerald-400', text: 'text-slate-800', border: 'border-emerald-200 dark:border-emerald-900/40', bg: 'bg-emerald-50/10' },
  indigo: { primary: 'text-indigo-700 dark:text-indigo-400', text: 'text-slate-800', border: 'border-indigo-200 dark:border-indigo-900/40', bg: 'bg-indigo-50/10' },
  slate: { primary: 'text-slate-800 dark:text-slate-200', text: 'text-slate-800', border: 'border-slate-300 dark:border-slate-700', bg: 'bg-slate-50/50' },
  red: { primary: 'text-rose-700 dark:text-rose-400', text: 'text-slate-800', border: 'border-rose-200 dark:border-rose-900/40', bg: 'bg-rose-50/10' },
  purple: { primary: 'text-purple-700 dark:text-purple-400', text: 'text-slate-800', border: 'border-purple-200 dark:border-purple-900/40', bg: 'bg-purple-50/10' },
  orange: { primary: 'text-orange-700 dark:text-orange-400', text: 'text-slate-800', border: 'border-orange-200 dark:border-orange-900/40', bg: 'bg-orange-50/10' },
  pink: { primary: 'text-pink-700 dark:text-pink-400', text: 'text-slate-800', border: 'border-pink-200 dark:border-pink-900/40', bg: 'bg-pink-50/10' },
  green: { primary: 'text-green-700 dark:text-green-400', text: 'text-slate-800', border: 'border-green-200 dark:border-green-900/40', bg: 'bg-green-50/10' }
};

export const FONTS: Record<string, string> = {
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono'
};
