import React from 'react';

interface ExperienceItem {
  position: string;
  company: string;
  duration: string;
  description: string;
}

interface ExperienceSectionProps {
  items: ExperienceItem[];
  colors: any;
  fonts: any;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ items = [], colors, fonts }) => {
  if (!items.length) return null;
  
  return (
    <div className="flex flex-col gap-4">
      {items.map((item, idx) => {
        const bullets = (item.description || '')
          .split(/[\*\u2022•\n]/)
          .map(b => b.trim())
          .filter(Boolean);

        return (
          <div key={idx} className="flex flex-col gap-1">
            <div className="flex justify-between items-baseline">
              <h4 
                className="text-[12px] font-black text-slate-800"
                style={{ color: colors.primary, fontFamily: fonts.heading }}
              >
                {item.position}
              </h4>
              <span className="text-[10px] font-semibold text-slate-500">{item.duration}</span>
            </div>
            <div className="text-[11px] font-bold text-slate-600 leading-none">
              {item.company}
            </div>
            {bullets.length > 0 ? (
              <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px] text-slate-650 leading-relaxed">
                {bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : (
              item.description && (
                <p className="text-[11px] text-slate-650 mt-1 leading-relaxed">
                  {item.description}
                </p>
              )
            )}
          </div>
        );
      })}
    </div>
  );
};
