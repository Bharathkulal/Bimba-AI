import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface SectionManagerProps {
  enabledSections: Record<string, boolean>;
  setEnabledSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const SectionManager: React.FC<SectionManagerProps> = ({
  enabledSections,
  setEnabledSections
}) => {
  const sections = [
    { id: 'summary', name: 'Professional Summary' },
    { id: 'experience', name: 'Experience' },
    { id: 'projects', name: 'Projects' },
    { id: 'education', name: 'Education' },
    { id: 'skills', name: 'Skills' },
    { id: 'certifications', name: 'Certificates' }
  ];

  const toggleSection = (id: string) => {
    setEnabledSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Hide / Show Sections</label>
      {sections.map(sec => {
        const isVisible = enabledSections[sec.id] !== false;
        return (
          <div key={sec.id} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0 text-left">
            <span className="font-bold text-[11px] text-slate-700">{sec.name}</span>
            <button
              onClick={() => toggleSection(sec.id)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isVisible 
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600' 
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}
            >
              {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default SectionManager;
