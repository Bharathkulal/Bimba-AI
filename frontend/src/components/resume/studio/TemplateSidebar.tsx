import React, { useState } from 'react';
import TemplateCard from './TemplateCard';
import { Search } from 'lucide-react';

interface TemplateSidebarProps {
  selectedTemplate: string;
  onSelectTemplate: (id: string, color: string) => void;
}

export const TemplateSidebar: React.FC<TemplateSidebarProps> = ({
  selectedTemplate,
  onSelectTemplate,
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const templates = [
    {
      id: "harvard",
      name: "Classic Professional",
      atsScore: 98,
      category: "Professional",
      columns: "One Column",
      badge: "Recommended",
      color: "#1E3A8A",
      thumbnail: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "minimalist-modern",
      name: "Minimalist Modern",
      atsScore: 95,
      category: "Minimal",
      columns: "One Column",
      badge: "Clean Design",
      color: "#14532D",
      thumbnail: "https://images.unsplash.com/photo-1626379616459-b2ce1d9decbc?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "tech_creative",
      name: "Modern Executive",
      atsScore: 94,
      category: "Modern",
      columns: "Two Column",
      badge: "Trending",
      color: "#059669",
      thumbnail: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "marketing_professional",
      name: "Clean Designer",
      atsScore: 93,
      category: "Modern",
      columns: "One Column",
      badge: "",
      color: "#BE185D",
      thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=300&auto=format&fit=crop"
    },
    {
      id: "finance_professional",
      name: "Compact Elegant",
      atsScore: 92,
      category: "Professional",
      columns: "Two Column",
      badge: "",
      color: "#0F172A",
      thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=300&auto=format&fit=crop"
    }
  ];

  const categories = ["All", "Recommended", "Professional", "Student", "Minimal", "Modern", "Executive"];

  const filtered = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'All' || 
      (activeTab === 'Recommended' && t.badge === 'Recommended') ||
      t.category === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="w-[320px] bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col h-full overflow-hidden shadow-sm text-left">
      <h3 className="font-extrabold text-slate-800 text-base">Choose Template</h3>
      <p className="text-[10px] text-slate-400 font-bold mb-3.5">Choose one 100% ATS-friendly template.</p>
      
      {/* Search box */}
      <div className="relative mb-3.5 shrink-0">
        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
          <Search size={14} />
        </span>
        <input
          type="text"
          placeholder="Search template..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-400"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3.5 scrollbar-none shrink-0 border-b border-slate-100">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === cat 
                ? 'bg-[#14532D] text-white shadow-sm' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template list */}
      <div className="flex-grow overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {filtered.map(tpl => (
          <TemplateCard
            key={tpl.id}
            template={tpl}
            isSelected={selectedTemplate === tpl.id}
            onSelect={() => onSelectTemplate(tpl.id, tpl.color)}
          />
        ))}
      </div>

      <button className="w-full py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100 mt-4 shrink-0 transition-colors cursor-pointer">
        Load More Templates
      </button>
    </div>
  );
};

export default TemplateSidebar;
