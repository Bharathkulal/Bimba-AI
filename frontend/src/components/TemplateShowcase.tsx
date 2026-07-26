import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Check, Sparkles, Download, X, 
  Award, FileText, ArrowRight, Flame
} from 'lucide-react';
import { Button } from './Button';
import { apiClient } from '../services/api';
import { ResumePreviewSheet } from '../resume/ResumePreviewSheet';

const MOCK_STUDENT_RESUME = {
  personalInfo: {
    name: "John Anderson",
    email: "john.anderson@email.com",
    phone: "(555) 019-2834",
    address: "San Francisco, CA",
    linkedin: "linkedin.com/in/johnanderson",
    github: "github.com/johnanderson",
    summary: "Award-winning Product Designer with 6+ years of experience leading cross-functional teams to design scalable mobile and web SaaS platforms. Expert in user research, design systems, interactive prototyping, and front-end frameworks."
  },
  educationList: [
    { institution: "UC Berkeley", degree: "B.S. in Human-Computer Interaction", passing_year: 2020 }
  ],
  experienceList: [
    { position: "Lead UI/UX Designer", company: "Stripe", duration: "2022 - Present", description: "Redesigned checkout flows, increasing transaction conversion rate by 14.8%. Led a design system scaling to 50+ engineers." },
    { position: "Senior Product Designer", company: "Linear", duration: "2020 - 2022", description: "Designed developer collaboration dashboards. Reduced user-reported interface friction by 32%." }
  ],
  projectList: [
    { name: "SaaS Analytics Dashboard", duration: "3 Months", tech_stack: "React, TailwindCSS", description: "Created an interactive reporting interface allowing customers to track metrics in real time with high accessibility." }
  ],
  skillList: [
    { name: "UX/UI Design", level: 5 },
    { name: "Figma", level: 5 },
    { name: "Design Systems", level: 4 },
    { name: "HTML/CSS/JS", level: 4 }
  ],
  certificateList: [
    { name: "Certified Scrum Master", organization: "Scrum Alliance" }
  ],
  achievements: {
    hackathons: "Linear Design Hackathon Winner 2021",
    awards: "Stripe Design Innovation Award 2023",
    soft_skills: "Collaborative Leadership, Fast Prototyping"
  },
  sectionVisibility: {
    experience: true,
    projects: true,
    skills: true,
    certificates: true,
    achievements: true
  }
};

export const TemplateShowcase: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Popularity');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('modern');
  const [previewingTemplate, setPreviewingTemplate] = useState<any | null>(null);
  const [zoomLevel, setZoomLevel] = useState<100 | 125 | 150>(100);
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    'All', 'ATS', 'Modern', 'Minimalist', 'Creative', 'Professional', 'Academic', 'Entry Level'
  ];

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await apiClient.get('/api/resume-studio/templates');
        setTemplates(res.data || []);
      } catch (err) {
        console.error("Error loading templates in student showcase:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates
      .filter((tpl) => tpl.is_enabled)
      .filter((tpl) => {
        const matchesSearch = tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tpl.category.toLowerCase().includes(searchQuery.toLowerCase());

        if (selectedCategory === 'All') return matchesSearch;
        const matchesCategory = tpl.category.toLowerCase() === selectedCategory.toLowerCase();

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'ATS Score') {
          return b.ats_rating - a.ats_rating;
        }
        if (sortBy === 'Popularity') {
          return b.popularity - a.popularity;
        }
        return a.name.localeCompare(b.name);
      });
  }, [templates, searchQuery, selectedCategory, sortBy]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const cardVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  const handleDownloadSample = (template: any) => {
    alert(`Downloading Sample Resume PDF for: ${template.name}`);
  };

  return (
    <section id="templates" className="py-24 bg-white text-slate-800 relative z-10 font-sans border-t border-slate-100">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[30%] h-[30%] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-55 border border-blue-200 text-xs font-semibold text-blue-600 mb-4"
          >
            <Sparkles size={12} />
            ATS Friendly Templates
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4"
          >
            Professional Resume Templates
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-slate-500 text-base md:text-lg leading-relaxed"
          >
            Accelerate your career path with premium, recruiter-approved formats engineered to land interviews and clear ATS screening checks seamlessly.
          </motion.p>
        </div>

        <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-5 mb-10 flex flex-col gap-5">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:w-96 text-left">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" size={16} />
              <input 
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200/80 focus:border-blue-500 focus:outline-none text-sm text-slate-700 placeholder:text-slate-450 transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
              <span className="text-xs text-slate-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-650 focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="Popularity">Popularity</option>
                <option value="ATS Score">ATS Match Score</option>
                <option value="Alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-4 overflow-x-auto no-scrollbar flex items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow shadow-blue-500/10' 
                    : 'bg-white text-slate-550 border border-slate-200/60 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500 font-bold text-xs">
            Loading design registry...
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((tpl) => {
                const isSelected = selectedTemplate === tpl.slug;
                return (
                  <motion.div
                    key={tpl.id}
                    layout
                    variants={cardVariants}
                    onClick={() => setSelectedTemplate(tpl.slug)}
                    className={`group relative rounded-3xl bg-white border p-4.5 flex flex-col justify-between overflow-hidden cursor-pointer h-[420px] transition-all duration-250 ease-out hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-200/50 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/5 shadow-md shadow-blue-500/5' 
                        : 'border-slate-200/60 hover:border-blue-500/50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 rounded-bl-xl text-[10px] font-extrabold flex items-center gap-1 shadow z-20">
                        <Check size={10} strokeWidth={3} /> Selected
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-3 z-10">
                      <span className={`bg-gradient-to-r ${tpl.is_premium ? 'from-amber-500 to-orange-500' : 'from-blue-500 to-indigo-500'} text-white text-[9px] font-black tracking-wider uppercase px-2 py-0.8 rounded-md shadow`}>
                        {tpl.is_premium ? 'PREMIUM' : 'FREE'}
                      </span>
                      <div className="flex items-center gap-1 text-slate-550 text-[10px] font-semibold bg-slate-50 px-2 py-0.8 rounded-md border border-slate-200">
                        <Award size={10} className="text-blue-600" /> ATS {tpl.ats_rating}%
                      </div>
                    </div>

                    <div className="relative flex-grow rounded-2xl overflow-hidden border border-slate-200/60 shadow bg-slate-50 group-hover:border-blue-200 transition-all duration-250 h-[220px]">
                      <div className="w-full h-full transform transition-transform duration-250 group-hover:scale-105 overflow-hidden">
                        <div className="w-[540px] h-[756px] scale-[0.34] origin-top-left p-4">
                          <ResumePreviewSheet
                            personalInfo={MOCK_STUDENT_RESUME.personalInfo}
                            educationList={MOCK_STUDENT_RESUME.educationList}
                            experienceList={MOCK_STUDENT_RESUME.experienceList}
                            projectList={MOCK_STUDENT_RESUME.projectList}
                            skillList={MOCK_STUDENT_RESUME.skillList}
                            certificateList={MOCK_STUDENT_RESUME.certificateList}
                            achievements={MOCK_STUDENT_RESUME.achievements}
                            sectionVisibility={MOCK_STUDENT_RESUME.sectionVisibility}
                            templateId={tpl.slug}
                            colorTheme={tpl.color_theme || 'blue'}
                            zoomLevel={1}
                          />
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col justify-center gap-2.5 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-250">
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewingTemplate(tpl);
                          }}
                          variant="outline" 
                          size="sm" 
                          className="w-full py-2 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                        >
                          Preview Design
                        </Button>
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTemplate(tpl.slug);
                          }}
                          variant="primary" 
                          size="sm" 
                          className="w-full py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 shadow shadow-blue-500/5 gap-1.5"
                        >
                          Use Template <ArrowRight size={12} />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-100 z-10 text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800 group-hover:text-blue-600 transition-smooth">{tpl.name}</h4>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">{tpl.category} style</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-black text-slate-450 block tracking-wide uppercase">Popularity</span>
                          <span className="text-[10px] font-extrabold text-slate-700">{tpl.popularity * 12} Views</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {!isLoading && filteredTemplates.length === 0 && (
          <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-16 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl border border-slate-200/60 flex items-center justify-center text-slate-400 mb-2 shadow-sm">
              <FileText size={24} />
            </div>
            <h4 className="text-lg font-bold text-slate-800">No Templates Match Your Filters</h4>
            <p className="text-slate-550 text-sm leading-relaxed">
              We couldn't find any templates for "{searchQuery}" matching your current selection. Try broadening your criteria or reset the search.
            </p>
            <Button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              variant="outline"
              size="sm"
              className="mt-2 text-xs font-bold border-slate-200 text-slate-650 hover:bg-slate-50"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {previewingTemplate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative text-left"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <div className="text-left">
                  <h3 className="font-extrabold text-lg text-slate-900">{previewingTemplate.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{previewingTemplate.category} Style template</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 gap-1">
                    {[100, 125, 150].map((level) => (
                      <button 
                        key={level}
                        onClick={() => setZoomLevel(level as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${zoomLevel === level ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        {level}%
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => setPreviewingTemplate(null)}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-smooth cursor-pointer shadow-sm"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-grow p-6 md:p-10 overflow-y-auto bg-slate-100/10 no-scrollbar flex justify-center items-start">
                <div 
                  className="w-[540px] bg-white rounded-2xl shadow-xl transition-all duration-300 transform origin-top"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                >
                  <ResumePreviewSheet
                    personalInfo={MOCK_STUDENT_RESUME.personalInfo}
                    educationList={MOCK_STUDENT_RESUME.educationList}
                    experienceList={MOCK_STUDENT_RESUME.experienceList}
                    projectList={MOCK_STUDENT_RESUME.projectList}
                    skillList={MOCK_STUDENT_RESUME.skillList}
                    certificateList={MOCK_STUDENT_RESUME.certificateList}
                    achievements={MOCK_STUDENT_RESUME.achievements}
                    sectionVisibility={MOCK_STUDENT_RESUME.sectionVisibility}
                    templateId={previewingTemplate.slug}
                    colorTheme={previewingTemplate.color_theme || 'blue'}
                    zoomLevel={1}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1"><Award size={13} className="text-blue-600" /> ATS Optimized {previewingTemplate.ats_rating}%</span>
                </div>
                <Button
                  onClick={() => {
                    setSelectedTemplate(previewingTemplate.slug);
                    setPreviewingTemplate(null);
                  }}
                  variant="primary"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 gap-1.5"
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
