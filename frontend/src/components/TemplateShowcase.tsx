import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Check, Sparkles, Download, X, 
  Award, FileText, ArrowRight, Flame
} from 'lucide-react';
import { Button } from './Button';

// Mock sample data to render in the miniature resume previews
const sampleResumeData = {
  name: "John Anderson",
  title: "Senior Product Designer",
  contact: "San Francisco, CA • john.anderson@email.com • (555) 019-2834",
  summary: "Award-winning Product Designer with 6+ years of experience leading cross-functional teams to design scalable mobile and web SaaS platforms. Expert in user research, design systems, interactive prototyping, and front-end frameworks.",
  skills: ["UX/UI Design", "Figma", "Design Systems", "HTML/CSS/JS", "Framer Motion", "User Testing", "SaaS Strategy"],
  experience: [
    { role: "Lead UI/UX Designer", company: "Stripe", date: "2022 - Present", desc: "Redesigned checkout flows, increasing transaction conversion rate by 14.8%. Led a design system scaling to 50+ engineers." },
    { role: "Senior Product Designer", company: "Linear", date: "2020 - 2022", desc: "Designed developer collaboration dashboards. Reduced user-reported interface friction by 32%." }
  ],
  education: { degree: "B.S. in Human-Computer Interaction", school: "UC Berkeley", date: "2016 - 2020" }
};

interface Template {
  id: string;
  name: string;
  description: string;
  style: string;
  tags: string[];
  atsScore: number;
  usersCount: string;
  popularity: 'Trending' | 'Popular' | 'Standard' | 'Hot';
  badge: 'PRO' | 'AI Optimized' | 'Popular' | 'New' | 'Free';
  badgeColor: string;
  // A custom render function to display its specific miniature resume layout
  renderPreview: (zoom?: boolean) => React.ReactNode;
}

export const TemplateShowcase: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Popularity');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('celestial');
  const [previewingTemplate, setPreviewingTemplate] = useState<Template | null>(null);
  const [zoomLevel, setZoomLevel] = useState<100 | 125 | 150>(100);

  const categories = [
    'All', 'ATS', 'Modern', 'Minimal', 'Creative', 'Corporate', 
    'Academic', 'Simple', 'Executive', 'Two Column', 'One Column'
  ];

  const templates: Template[] = [
    {
      id: 'cosmos',
      name: 'Cosmos Pro',
      description: 'Elegant, modern layout with high readability',
      style: 'Modern & Compact',
      tags: ['Modern', 'One Page', 'SaaS'],
      atsScore: 98,
      usersCount: '42,000+',
      popularity: 'Trending',
      badge: 'PRO',
      badgeColor: 'from-purple-500 to-indigo-500',
      renderPreview: (zoom = false) => (
        <div className={`w-full h-full flex flex-col bg-white text-slate-800 ${zoom ? 'p-8' : 'p-3'} text-[5px] leading-tight select-none`}>
          {/* Header */}
          <div className="border-b-[0.5px] border-slate-200 pb-1 mb-1">
            <h4 className={`${zoom ? 'text-2xl' : 'text-[9px]'} font-extrabold text-slate-900 tracking-tight`}>{sampleResumeData.name}</h4>
            <p className={`${zoom ? 'text-sm' : 'text-[5px]'} text-blue-600 font-bold tracking-wide uppercase mt-0.5`}>{sampleResumeData.title}</p>
            <p className={`${zoom ? 'text-[10px]' : 'text-[3.5px]'} text-slate-400 font-medium mt-0.5`}>{sampleResumeData.contact}</p>
          </div>
          {/* Summary */}
          <div className="mb-1">
            <p className={`${zoom ? 'text-xs' : 'text-[4px]'} text-slate-500 italic`}>{sampleResumeData.summary}</p>
          </div>
          {/* Main Layout Grid */}
          <div className="grid grid-cols-3 gap-1.5 mt-1">
            <div className="col-span-2 flex flex-col gap-1 border-r-[0.5px] border-slate-100 pr-1">
              <h5 className="font-bold border-b-[0.5px] border-slate-150 text-slate-700">EXPERIENCE</h5>
              {sampleResumeData.experience.map((exp, idx) => (
                <div key={idx} className="flex flex-col gap-0.5">
                  <div className="flex justify-between font-semibold">
                    <span>{exp.role}</span>
                    <span className="text-slate-400">{exp.date}</span>
                  </div>
                  <span className="text-slate-500 font-medium">{exp.company}</span>
                  <p className="text-slate-400 scale-[0.9] origin-left">{exp.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <h5 className="font-bold border-b-[0.5px] border-slate-150 text-slate-700">SKILLS</h5>
              <div className="flex flex-wrap gap-0.5">
                {sampleResumeData.skills.map((sk) => (
                  <span key={sk} className="bg-slate-100 px-0.8 py-0.2 rounded-sm text-slate-600 font-medium scale-[0.9] origin-left">{sk}</span>
                ))}
              </div>
              <h5 className="font-bold border-b-[0.5px] border-slate-150 text-slate-700 mt-1">EDUCATION</h5>
              <div className="flex flex-col text-slate-500 scale-[0.9] origin-left">
                <span className="font-semibold">{sampleResumeData.education.degree}</span>
                <span>{sampleResumeData.education.school}</span>
                <span className="text-slate-400">{sampleResumeData.education.date}</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'celestial',
      name: 'Celestial ATS',
      description: 'Strictly formatted to maximize ATS matching score',
      style: 'Recruiter Approved',
      tags: ['ATS', 'Two Column', 'Clean'],
      atsScore: 99,
      usersCount: '58,000+',
      popularity: 'Trending',
      badge: 'AI Optimized',
      badgeColor: 'from-emerald-500 to-teal-500',
      renderPreview: (zoom = false) => (
        <div className={`w-full h-full grid grid-cols-3 bg-white text-slate-900 ${zoom ? 'p-8' : 'p-3'} text-[5px] leading-tight select-none gap-2`}>
          {/* Sidebar */}
          <div className="col-span-1 bg-slate-50 rounded-lg p-1.5 flex flex-col gap-1.5 border-r-[0.5px] border-slate-100">
            <div className="flex flex-col gap-0.5">
              <h4 className={`${zoom ? 'text-lg' : 'text-[8px]'} font-extrabold text-slate-800`}>J. Anderson</h4>
              <span className="text-slate-400 tracking-wider text-[3.5px] uppercase font-bold">Designer</span>
            </div>
            <div className="flex flex-col gap-0.8 text-slate-500 text-[3.5px]">
              <span className="font-semibold text-slate-600">CONTACT</span>
              <span>San Francisco, CA</span>
              <span>john.anderson@email.com</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-slate-600">KEY SKILLS</span>
              {sampleResumeData.skills.slice(0, 5).map((sk) => (
                <span key={sk} className="bg-blue-50/50 text-blue-700 px-0.8 py-0.2 rounded-sm font-semibold scale-[0.85] origin-left">{sk}</span>
              ))}
            </div>
          </div>
          {/* Main Panel */}
          <div className="col-span-2 flex flex-col gap-1.5 pt-0.5">
            <div>
              <h3 className={`${zoom ? 'text-xl' : 'text-[9px]'} font-extrabold text-slate-950`}>{sampleResumeData.name}</h3>
              <p className="text-slate-500 font-semibold">{sampleResumeData.title}</p>
            </div>
            <p className="text-slate-500 scale-[0.95] origin-top-left leading-normal">{sampleResumeData.summary}</p>
            <div className="flex flex-col gap-1">
              <h5 className="font-extrabold text-slate-800 border-b-[0.5px] border-slate-200 pb-0.2">WORK EXPERIENCE</h5>
              {sampleResumeData.experience.map((exp, idx) => (
                <div key={idx} className="flex flex-col gap-0.2">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>{exp.role} @ {exp.company}</span>
                    <span className="text-slate-400 font-normal">{exp.date}</span>
                  </div>
                  <p className="text-slate-500 scale-[0.9] origin-left">{exp.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'galaxy',
      name: 'Galaxy Professional',
      description: 'Densely structured standard for technical roles',
      style: 'Technical Density',
      tags: ['ATS', 'One Column', 'Minimal'],
      atsScore: 97,
      usersCount: '34,000+',
      popularity: 'Popular',
      badge: 'Popular',
      badgeColor: 'from-blue-500 to-cyan-500',
      renderPreview: (zoom = false) => (
        <div className={`w-full h-full flex flex-col bg-white text-slate-800 ${zoom ? 'p-8' : 'p-3'} text-[5px] leading-tight select-none gap-1.5`}>
          {/* Header Centered */}
          <div className="text-center">
            <h3 className={`${zoom ? 'text-2xl' : 'text-[10px]'} font-extrabold text-slate-900`}>{sampleResumeData.name}</h3>
            <p className="text-slate-400 tracking-wide mt-0.5">{sampleResumeData.contact}</p>
          </div>
          {/* Professional Summary */}
          <div className="border-t-[0.5px] border-b-[0.5px] border-slate-200 py-1">
            <p className="text-slate-500 text-center leading-normal italic">{sampleResumeData.summary}</p>
          </div>
          {/* Work Experience */}
          <div className="flex flex-col gap-1">
            <h5 className="font-bold text-slate-800 border-b-[0.5px] border-slate-250 pb-0.2">PROFESSIONAL EXPERIENCE</h5>
            {sampleResumeData.experience.map((exp, idx) => (
              <div key={idx} className="flex flex-col gap-0.3">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>{exp.role} — {exp.company}</span>
                  <span className="text-slate-400">{exp.date}</span>
                </div>
                <p className="text-slate-500 scale-[0.9] origin-left leading-normal">{exp.desc}</p>
              </div>
            ))}
          </div>
          {/* Skills Grid */}
          <div className="flex flex-col gap-0.5">
            <h5 className="font-bold text-slate-800 border-b-[0.5px] border-slate-250 pb-0.2">TECHNICAL STACK</h5>
            <p className="text-slate-500 font-semibold scale-[0.95] origin-left">
              Languages & Tools: <span className="font-normal">{sampleResumeData.skills.join(', ')}</span>
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'astral',
      name: 'Astral Creative',
      description: 'Vibrant headings perfect for design & creative roles',
      style: 'Bold Headings & Accents',
      tags: ['Creative', 'Modern', 'Two Column'],
      atsScore: 95,
      usersCount: '21,000+',
      popularity: 'Hot',
      badge: 'New',
      badgeColor: 'from-pink-500 to-rose-500',
      renderPreview: (zoom = false) => (
        <div className={`w-full h-full flex flex-col bg-slate-950 text-white ${zoom ? 'p-8' : 'p-3'} text-[5px] leading-tight select-none`}>
          {/* Custom Dark Header with Blue Gradient Overlay */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-2 flex justify-between items-center mb-1.5">
            <div>
              <h3 className={`${zoom ? 'text-2xl' : 'text-[10px]'} font-extrabold text-white`}>{sampleResumeData.name}</h3>
              <p className="text-blue-100 font-medium scale-[0.9] origin-left">{sampleResumeData.title}</p>
            </div>
            <p className="text-blue-200 text-right text-[3px] scale-[0.8] origin-right max-w-[40%]">{sampleResumeData.contact}</p>
          </div>
          {/* Body */}
          <div className="grid grid-cols-3 gap-1.5 flex-grow">
            {/* Left side */}
            <div className="col-span-2 flex flex-col gap-1">
              <h5 className="font-extrabold text-blue-400 border-b-[0.5px] border-slate-800 pb-0.2 uppercase tracking-wide">Work History</h5>
              {sampleResumeData.experience.map((exp, idx) => (
                <div key={idx} className="flex flex-col gap-0.3">
                  <div className="flex justify-between font-bold text-slate-200">
                    <span>{exp.role}</span>
                    <span className="text-slate-500 font-normal">{exp.date}</span>
                  </div>
                  <span className="text-blue-300/80 font-medium scale-[0.95] origin-left">{exp.company}</span>
                  <p className="text-slate-400 scale-[0.88] origin-left leading-normal">{exp.desc}</p>
                </div>
              ))}
            </div>
            {/* Right side */}
            <div className="flex flex-col gap-1.5 bg-slate-900/60 rounded-md p-1 border border-slate-800">
              <div>
                <h5 className="font-extrabold text-blue-400 border-b-[0.5px] border-slate-800 pb-0.2 uppercase tracking-wide">Skills</h5>
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {sampleResumeData.skills.map((sk) => (
                    <span key={sk} className="bg-indigo-950/80 text-blue-300 border border-blue-900/40 px-0.8 py-0.2 rounded-sm font-semibold scale-[0.85] origin-left">{sk}</span>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="font-extrabold text-blue-400 border-b-[0.5px] border-slate-800 pb-0.2 uppercase tracking-wide">Education</h5>
                <p className="text-slate-300 scale-[0.9] origin-left mt-0.5">{sampleResumeData.education.degree}</p>
                <p className="text-slate-500 scale-[0.85] origin-left">{sampleResumeData.education.school}</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'astralis',
      name: 'Astralis Corporate',
      description: 'Highly polished template preferred by managers',
      style: 'Modern & Compact',
      tags: ['Corporate', 'Executive', 'One Column'],
      atsScore: 98,
      usersCount: '19,000+',
      popularity: 'Standard',
      badge: 'Free',
      badgeColor: 'from-slate-500 to-slate-600',
      renderPreview: (zoom = false) => (
        <div className={`w-full h-full flex flex-col bg-white text-slate-850 ${zoom ? 'p-8' : 'p-3'} text-[5px] leading-tight select-none gap-1`}>
          <div className="flex justify-between items-end border-b-[0.8px] border-slate-800 pb-1 mb-1">
            <div>
              <h3 className={`${zoom ? 'text-2xl' : 'text-[10px]'} font-black text-slate-900 uppercase`}>{sampleResumeData.name}</h3>
              <p className="text-slate-500 tracking-wider font-bold scale-[0.95] origin-left uppercase">{sampleResumeData.title}</p>
            </div>
            <p className="text-slate-400 text-[3.5px] text-right font-medium">{sampleResumeData.contact}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-col gap-0.8">
              <h5 className="font-extrabold text-slate-800 uppercase tracking-widest text-[4.5px]">Experience</h5>
              {sampleResumeData.experience.map((exp, idx) => (
                <div key={idx} className="pl-1 border-l border-slate-300 flex flex-col gap-0.2">
                  <div className="flex justify-between font-bold">
                    <span>{exp.role} | {exp.company}</span>
                    <span className="text-slate-500 font-normal">{exp.date}</span>
                  </div>
                  <p className="text-slate-600 scale-[0.9] origin-left">{exp.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-0.5 border-t border-slate-100">
              <div className="w-[60%]">
                <h5 className="font-extrabold text-slate-800 uppercase tracking-widest text-[4px]">Education</h5>
                <span className="font-semibold">{sampleResumeData.education.degree}</span>
              </div>
              <div className="w-[35%]">
                <h5 className="font-extrabold text-slate-800 uppercase tracking-widest text-[4px]">Design Skills</h5>
                <span className="text-slate-500 scale-[0.9] origin-left block">{sampleResumeData.skills.slice(0,4).join(', ')}</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'pulsar',
      name: 'Pulsar Two Column',
      description: 'Elegant dual-colored layout optimized for UX and tech professionals',
      style: 'Elegant Layout',
      tags: ['Creative', 'Two Column', 'Modern'],
      atsScore: 96,
      usersCount: '27,000+',
      popularity: 'Trending',
      badge: 'AI Optimized',
      badgeColor: 'from-emerald-500 to-teal-500',
      renderPreview: (zoom = false) => (
        <div className={`w-full h-full grid grid-cols-4 bg-white text-slate-800 ${zoom ? 'p-8' : 'p-3'} text-[5px] leading-tight select-none`}>
          {/* Darker Column */}
          <div className="col-span-1 bg-slate-900 text-white p-1.5 flex flex-col gap-1.5 rounded-l-lg">
            <div className="text-center pb-1 border-b border-slate-800">
              <h4 className={`${zoom ? 'text-lg' : 'text-[7px]'} font-extrabold tracking-tight`}>J. Anderson</h4>
              <p className="text-slate-500 text-[3px] scale-[0.8] origin-center uppercase mt-0.5">Product</p>
            </div>
            <div className="flex flex-col gap-0.8 text-[3px]">
              <span className="font-bold text-blue-400">CONTACT</span>
              <span className="scale-[0.85] origin-left">SF, California</span>
              <span className="scale-[0.85] origin-left">john.a@email.com</span>
            </div>
            <div className="flex flex-col gap-0.5 text-[3px]">
              <span className="font-bold text-blue-400">SKILLS</span>
              {sampleResumeData.skills.slice(0, 5).map((sk) => (
                <span key={sk} className="bg-slate-800 px-1 py-0.2 rounded-sm text-slate-300 font-medium scale-[0.85] origin-left">{sk}</span>
              ))}
            </div>
          </div>
          {/* Main White Column */}
          <div className="col-span-3 p-2 flex flex-col gap-1">
            <div>
              <h3 className={`${zoom ? 'text-xl' : 'text-[9px]'} font-extrabold text-slate-900`}>{sampleResumeData.name}</h3>
              <p className="text-blue-600 font-semibold">{sampleResumeData.title}</p>
            </div>
            <p className="text-slate-500 italic scale-[0.9] origin-left mb-0.5">{sampleResumeData.summary}</p>
            <div className="flex flex-col gap-0.8">
              <h5 className="font-bold text-slate-800 border-b-[0.5px] border-slate-200 pb-0.2">PROFESSIONAL EXPERIENCE</h5>
              {sampleResumeData.experience.map((exp, idx) => (
                <div key={idx} className="flex flex-col gap-0.2">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>{exp.role} @ {exp.company}</span>
                    <span className="text-slate-400 font-normal">{exp.date}</span>
                  </div>
                  <p className="text-slate-500 scale-[0.85] origin-left leading-normal">{exp.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'eclipse',
      name: 'Eclipse Executive',
      description: 'Sophisticated typography standard for managers & leads',
      style: 'Executive Standard',
      tags: ['Executive', 'One Column', 'Academic'],
      atsScore: 99,
      usersCount: '15,000+',
      popularity: 'Popular',
      badge: 'PRO',
      badgeColor: 'from-purple-500 to-indigo-500',
      renderPreview: (zoom = false) => (
        <div className={`w-full h-full flex flex-col bg-stone-50 text-stone-900 ${zoom ? 'p-8' : 'p-3'} text-[5px] leading-tight select-none gap-1.5`}>
          <div className="text-center pb-1 border-b-[0.8px] border-stone-300">
            <h3 className={`${zoom ? 'text-2xl' : 'text-[10px]'} font-extrabold text-stone-950 tracking-wider uppercase serif`}>{sampleResumeData.name}</h3>
            <p className="text-stone-600 font-bold scale-[0.9] uppercase tracking-widest">{sampleResumeData.title}</p>
            <p className="text-stone-400 text-[3.5px] mt-0.5">{sampleResumeData.contact}</p>
          </div>
          <p className="text-stone-600 leading-normal italic scale-[0.95] origin-top text-center">{sampleResumeData.summary}</p>
          <div className="flex flex-col gap-1">
            <h5 className="font-bold text-stone-850 border-b-[0.5px] border-stone-300 pb-0.2 tracking-wider">CHRONOLOGICAL HISTORY</h5>
            {sampleResumeData.experience.map((exp, idx) => (
              <div key={idx} className="flex flex-col gap-0.2">
                <div className="flex justify-between font-bold text-stone-800">
                  <span>{exp.role} — {exp.company}</span>
                  <span className="text-stone-450 font-normal">{exp.date}</span>
                </div>
                <p className="text-stone-600 scale-[0.88] origin-left leading-normal">{exp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }
  ];

  // Filters, search, and sort logic
  const filteredTemplates = useMemo(() => {
    return templates
      .filter((tpl) => {
        // Search filter
        const matchesSearch = tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tpl.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        // Category filter
        if (selectedCategory === 'All') return matchesSearch;
        
        // Match specific categories (which could map to tags, style properties, etc.)
        const categoryLower = selectedCategory.toLowerCase();
        const matchesCategory = 
          tpl.tags.some(tag => tag.toLowerCase() === categoryLower) ||
          tpl.style.toLowerCase().includes(categoryLower) ||
          (selectedCategory === 'One Column' && tpl.tags.includes('One Column')) ||
          (selectedCategory === 'Two Column' && tpl.tags.includes('Two Column')) ||
          (selectedCategory === 'Executive' && tpl.tags.includes('Executive'));

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'ATS Score') {
          return b.atsScore - a.atsScore;
        }
        if (sortBy === 'Popularity') {
          // Compare approximate counts
          const numA = parseInt(a.usersCount.replace(/[^0-9]/g, ''));
          const numB = parseInt(b.usersCount.replace(/[^0-9]/g, ''));
          return numB - numA;
        }
        return a.name.localeCompare(b.name);
      });
  }, [searchQuery, selectedCategory, sortBy]);

  // Framer Motion viewport animation configs
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants: any = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const handleDownloadSample = (template: Template) => {
    alert(`Downloading Sample Resume PDF for: ${template.name}`);
  };

  return (
    <section id="templates" className="py-24 bg-[#0B1220] text-white relative z-10 font-sans">
      {/* Background radial effects */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[30%] h-[30%] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-[#4F7CFF] mb-4"
          >
            <Sparkles size={12} />
            ATS Friendly Templates
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4"
          >
            Professional Resume Templates
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-slate-400 text-base md:text-lg leading-relaxed"
          >
            Accelerate your career path with premium, recruiter-approved formats engineered to land interviews and clear ATS screening checks seamlessly.
          </motion.p>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 mb-10 flex flex-col gap-5">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text"
                placeholder="Search premium templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:border-[#4F7CFF] focus:outline-none text-sm text-slate-100 placeholder:text-slate-600 transition-smooth"
              />
            </div>

            {/* Sort Selection */}
            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
              <span className="text-xs text-slate-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-350 focus:border-[#4F7CFF] focus:outline-none cursor-pointer transition-smooth"
              >
                <option value="Popularity">Popularity</option>
                <option value="ATS Score">ATS Match Score</option>
                <option value="Alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Category Chips Container */}
          <div className="border-t border-slate-800/80 pt-4 overflow-x-auto no-scrollbar flex items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-smooth ${
                  selectedCategory === cat 
                    ? 'bg-[#4F7CFF] text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-slate-950/40 text-slate-400 border border-slate-800/60 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((tpl) => {
              const isSelected = selectedTemplate === tpl.id;
              return (
                <motion.div
                  key={tpl.id}
                  layout
                  variants={cardVariants}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`group relative rounded-3xl bg-slate-900/35 border p-4.5 flex flex-col justify-between overflow-hidden cursor-pointer h-[420px] transition-all duration-250 ease-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 ${
                    isSelected 
                      ? 'border-[#4F7CFF] bg-[#4F7CFF]/5 shadow-lg shadow-[#4F7CFF]/15' 
                      : 'border-slate-800/80 hover:border-[#4F7CFF]/50'
                  }`}
                >
                  {/* Selected Indicator Banner */}
                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-[#4F7CFF] text-white px-3 py-1 rounded-bl-xl text-[10px] font-extrabold flex items-center gap-1 shadow-md z-20 animate-pulse">
                      <Check size={10} strokeWidth={3} /> Selected
                    </div>
                  )}

                  {/* Header / Badges */}
                  <div className="flex justify-between items-start mb-3 z-10">
                    <span className={`bg-gradient-to-r ${tpl.badgeColor} text-white text-[9px] font-black tracking-wider uppercase px-2 py-0.8 rounded-md shadow`}>
                      {tpl.badge}
                    </span>
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] font-semibold bg-slate-950/40 px-2 py-0.8 rounded-md border border-slate-800">
                      <Award size={10} className="text-[#4F7CFF]" /> ATS {tpl.atsScore}%
                    </div>
                  </div>

                  {/* High Quality miniature Resume Preview */}
                  <div className="relative flex-grow rounded-2xl overflow-hidden border border-slate-800/80 shadow bg-slate-950/80 group-hover:border-[#4F7CFF]/30 transition-all duration-250">
                    {/* Render specific template preview layout */}
                    <div className="w-full h-full transform transition-transform duration-250 group-hover:scale-105">
                      {tpl.renderPreview(false)}
                    </div>

                    {/* Gradient Overlay for Unselected or Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-60 pointer-events-none" />

                    {/* Active Gradient Overlay on Selected */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#4F7CFF]/5 border border-[#4F7CFF]/10 pointer-events-none" />
                    )}

                    {/* Action buttons sliding upwards on Hover */}
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col justify-center gap-2.5 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-250">
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewingTemplate(tpl);
                        }}
                        variant="outline" 
                        size="sm" 
                        className="w-full py-2 text-xs font-bold border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
                      >
                        Preview Design
                      </Button>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(tpl.id);
                        }}
                        variant="primary" 
                        size="sm" 
                        className="w-full py-2 text-xs font-bold bg-[#4F7CFF] hover:bg-blue-600 shadow shadow-blue-500/10 gap-1.5"
                      >
                        Use Template <ArrowRight size={12} />
                      </Button>
                    </div>
                  </div>

                  {/* Bottom details block */}
                  <div className="mt-3.5 pt-3 border-t border-slate-800/60 z-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-100 group-hover:text-[#4F7CFF] transition-smooth">{tpl.name}</h4>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{tpl.style}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black text-slate-400 block tracking-wide uppercase">Used By</span>
                        <span className="text-[10px] font-extrabold text-slate-200">{tpl.usersCount}</span>
                      </div>
                    </div>

                    {/* Tags row */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {tpl.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[9px] font-semibold bg-slate-950/50 text-slate-550 border border-slate-800/40 px-2 py-0.5 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty Placeholder State */}
        {filteredTemplates.length === 0 && (
          <div className="bg-slate-900/35 border border-slate-800 rounded-3xl p-16 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
            <div className="w-14 h-14 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-500 mb-2">
              <FileText size={24} />
            </div>
            <h4 className="text-lg font-bold text-slate-200">No Premium Templates Match Your Filters</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              We couldn't find any templates for "{searchQuery}" matching your current selection. Try broadening your criteria or reset the search.
            </p>
            <Button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              variant="outline"
              size="sm"
              className="mt-2 text-xs font-bold border-slate-800 text-slate-350 hover:bg-slate-800"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {/* Fullscreen Preview Modal */}
      <AnimatePresence>
        {previewingTemplate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-[#0B1220] border border-slate-800 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative shadow-blue-500/5"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
                <div>
                  <h3 className="font-extrabold text-lg text-white">{previewingTemplate.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{previewingTemplate.description}</p>
                </div>

                {/* Controls & Zoom Panel */}
                <div className="flex items-center gap-4">
                  {/* Zoom Controls */}
                  <div className="hidden md:flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1 gap-1">
                    <button 
                      onClick={() => setZoomLevel(100)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-smooth ${zoomLevel === 100 ? 'bg-[#4F7CFF] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      100%
                    </button>
                    <button 
                      onClick={() => setZoomLevel(125)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-smooth ${zoomLevel === 125 ? 'bg-[#4F7CFF] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      125%
                    </button>
                    <button 
                      onClick={() => setZoomLevel(150)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-smooth ${zoomLevel === 150 ? 'bg-[#4F7CFF] text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      150%
                    </button>
                  </div>

                  {/* Actions */}
                  <Button 
                    onClick={() => handleDownloadSample(previewingTemplate)}
                    variant="outline" 
                    size="sm" 
                    className="gap-2 border-slate-800 text-slate-200 hover:bg-slate-900"
                  >
                    <Download size={14} /> <span className="hidden sm:inline">Download Sample PDF</span>
                  </Button>
                  
                  {/* Close button */}
                  <button 
                    onClick={() => setPreviewingTemplate(null)}
                    className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-smooth cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Content Scroll Area */}
              <div className="flex-grow p-6 md:p-10 overflow-y-auto bg-slate-950/20 no-scrollbar flex justify-center items-start">
                <div 
                  className="w-full max-w-2xl bg-white rounded-2xl shadow-xl transition-all duration-300"
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                >
                  <div className="aspect-[1/1.414]">
                    {previewingTemplate.renderPreview(true)}
                  </div>
                </div>
              </div>

              {/* Modal Bottom Bar */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex justify-between items-center">
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1"><Award size={13} className="text-[#4F7CFF]" /> ATS Optimized {previewingTemplate.atsScore}%</span>
                  <span className="flex items-center gap-1"><Flame size={13} className="text-orange-500" /> {previewingTemplate.popularity}</span>
                </div>
                <Button
                  onClick={() => {
                    setSelectedTemplate(previewingTemplate.id);
                    setPreviewingTemplate(null);
                  }}
                  variant="primary"
                  size="sm"
                  className="bg-[#4F7CFF] hover:bg-blue-600 gap-1.5"
                >
                  Use This Template <ArrowRight size={14} />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
export default TemplateShowcase;
