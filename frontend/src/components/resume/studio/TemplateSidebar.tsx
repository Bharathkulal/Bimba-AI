import React, { useState } from 'react';
import TemplateCard from './TemplateCard';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';

interface TemplateSidebarProps {
  selectedTemplate: string;
  onSelectTemplate: (id: string, color: string) => void;
}

export const TemplateSidebar: React.FC<TemplateSidebarProps> = ({
  selectedTemplate,
  onSelectTemplate,
}) => {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Professional': true,
    'Minimal': false,
    'Student': false,
    'Engineering': false,
    'Business': false,
    'Creative': false,
    'Academic': false,
    'ATS': false,
    'Corporate': false
  });

  const templates = [
    {
      id: "classic-professional",
      name: "Classic Professional",
      atsScore: 99,
      category: "Professional",
      columns: "One Column",
      badge: "Standard",
      color: "#1E3A8A",
      thumbnail: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "modern-professional",
      name: "Modern Professional",
      atsScore: 97,
      category: "Creative",
      columns: "One Column",
      badge: "Popular",
      color: "#14532D",
      thumbnail: "https://images.unsplash.com/photo-1626379616459-b2ce1d9decbc?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "minimal-professional",
      name: "Minimal Professional",
      atsScore: 96,
      category: "Minimal",
      columns: "One Column",
      badge: "Clean",
      color: "#4B5563",
      thumbnail: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "executive",
      name: "Modern Executive",
      atsScore: 98,
      category: "Business",
      columns: "One Column",
      badge: "Premium",
      color: "#0F172A",
      thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "software-engineer",
      name: "Software Engineer Spec",
      atsScore: 98,
      category: "Engineering",
      columns: "One Column",
      badge: "Tech Specific",
      color: "#059669",
      thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "business",
      name: "Corporate Business",
      atsScore: 95,
      category: "Business",
      columns: "One Column",
      badge: "Corporate",
      color: "#1E3A8A",
      thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "student",
      name: "Student Entry Level",
      atsScore: 94,
      category: "Student",
      columns: "One Column",
      badge: "Beginner",
      color: "#7C3AED",
      thumbnail: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "college-fresher",
      name: "College Fresher Classic",
      atsScore: 95,
      category: "Student",
      columns: "One Column",
      badge: "Academic",
      color: "#4B5563",
      thumbnail: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "simple-ats",
      name: "Simple ATS Standard",
      atsScore: 100,
      category: "ATS",
      columns: "One Column",
      badge: "Max Match",
      color: "#000000",
      thumbnail: "https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "corporate-ats",
      name: "Corporate ATS Professional",
      atsScore: 99,
      category: "Corporate",
      columns: "One Column",
      badge: "Formal",
      color: "#0F172A",
      thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "harvard-style",
      name: "Harvard Style Traditional",
      atsScore: 98,
      category: "Academic",
      columns: "One Column",
      badge: "Ivy League",
      color: "#000000",
      thumbnail: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "stanford-style",
      name: "Stanford Style Research",
      atsScore: 97,
      category: "Academic",
      columns: "One Column",
      badge: "Research Focus",
      color: "#990000",
      thumbnail: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "mit-style",
      name: "MIT Style Engineering",
      atsScore: 98,
      category: "Engineering",
      columns: "One Column",
      badge: "Highly Technical",
      color: "#8A1538",
      thumbnail: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "two-column-modern",
      name: "Two Column Modern",
      atsScore: 92,
      category: "Creative",
      columns: "Two Column",
      badge: "Visual Spacing",
      color: "#14532D",
      thumbnail: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "elegant-minimal",
      name: "Elegant Minimalist",
      atsScore: 95,
      category: "Minimal",
      columns: "One Column",
      badge: "Chic",
      color: "#4B5563",
      thumbnail: "https://images.unsplash.com/photo-1490100667990-4fced832c20c?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "reverse-chronological",
      name: "Standard Chronological",
      atsScore: 98,
      category: "Professional",
      columns: "One Column",
      badge: "ATS Favorite",
      color: "#1E3A8A",
      thumbnail: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "project-focused",
      name: "Project Focused Layout",
      atsScore: 96,
      category: "Professional",
      columns: "One Column",
      badge: "Project Primary",
      color: "#059669",
      thumbnail: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "research-resume",
      name: "Research Spec Layout",
      atsScore: 96,
      category: "Academic",
      columns: "One Column",
      badge: "Publications",
      color: "#0F172A",
      thumbnail: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "academic-cv",
      name: "Academic Curriculum Vitae",
      atsScore: 95,
      category: "Academic",
      columns: "One Column",
      badge: "Extended CV",
      color: "#000000",
      thumbnail: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "internship-resume",
      name: "Internship Target Spec",
      atsScore: 96,
      category: "Student",
      columns: "One Column",
      badge: "Career Start",
      color: "#7C3AED",
      thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=300&auto=format&fit=crop"
    }
  ];

  const categories = ["Professional", "Minimal", "Student", "Engineering", "Business", "Creative", "Academic", "ATS", "Corporate"];

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const getFilteredTemplates = (category: string) => {
    return templates.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = t.category === category;
      return matchesSearch && matchesCategory;
    });
  };

  return (
    <div className="w-[280px] bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col h-full overflow-hidden shadow-sm text-left">
      <div className="shrink-0 mb-3">
        <h3 className="font-extrabold text-slate-800 text-sm">Choose Template</h3>
        <p className="text-[9px] text-slate-400 font-bold">Choose a 100% ATS-friendly template.</p>
      </div>

      {/* Search box */}
      <div className="relative mb-3 shrink-0">
        <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400">
          <Search size={12} />
        </span>
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-400"
        />
      </div>

      {/* Accordion Categories */}
      <div className="flex-grow overflow-y-auto space-y-2 pr-0.5 scrollbar-thin">
        {categories.map(category => {
          const filteredItems = getFilteredTemplates(category);
          if (filteredItems.length === 0 && search) return null;

          const isExpanded = expandedCategories[category] || !!search;

          return (
            <div key={category} className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/20">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-3 py-2 flex items-center justify-between bg-slate-50 hover:bg-slate-100/75 transition-colors cursor-pointer text-left"
              >
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">{category}</span>
                {isExpanded ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
              </button>
              
              {isExpanded && (
                <div className="p-2.5 grid grid-cols-1 gap-2.5 bg-white border-t border-slate-100">
                  {filteredItems.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={selectedTemplate === template.id}
                      onSelect={() => onSelectTemplate(template.id, template.color)}
                    />
                  ))}
                  {filteredItems.length === 0 && (
                    <div className="text-[9px] text-slate-400 text-center py-2 font-bold">No templates in this category</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateSidebar;
