import React from 'react';
import { LayoutGrid, GraduationCap, Briefcase, Globe2, Compass } from 'lucide-react';

interface TemplateCategoriesProps {
  categories: string[];
  activeCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

export const TemplateCategories: React.FC<TemplateCategoriesProps> = ({
  categories,
  activeCategory,
  onCategorySelect,
}) => {
  const getIconForCategory = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'professional':
        return Briefcase;
      case 'student':
        return GraduationCap;
      case 'minimal':
        return LayoutGrid;
      case 'international':
        return Globe2;
      default:
        return Compass;
    }
  };

  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
      <button
        onClick={() => onCategorySelect(null)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer ${
          activeCategory === null
            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <LayoutGrid size={14} />
        <span>All Categories</span>
      </button>

      {categories.map((category) => {
        const Icon = getIconForCategory(category);
        const isActive = activeCategory === category;

        return (
          <button
            key={category}
            onClick={() => onCategorySelect(category)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer ${
              isActive
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon size={14} />
            <span>{category}</span>
          </button>
        );
      })}
    </div>
  );
};
