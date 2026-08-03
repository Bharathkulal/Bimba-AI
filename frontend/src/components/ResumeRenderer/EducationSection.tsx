import React from 'react';

interface EducationItem {
  degree: string;
  institution: string;
  year: string;
}

interface EducationSectionProps {
  items: EducationItem[];
  colors: any;
  fonts: any;
}

export const EducationSection: React.FC<EducationSectionProps> = ({ items = [], colors, fonts }) => {
  if (!items.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex flex-col gap-0.5">
          <div className="flex justify-between items-baseline">
            <h4 
              className="text-[11.5px] font-black text-slate-800"
              style={{ color: colors.primary, fontFamily: fonts.heading }}
            >
              {item.degree}
            </h4>
            <span className="text-[10px] font-semibold text-slate-500">{item.year}</span>
          </div>
          <p className="text-[11px] text-slate-650 font-bold leading-none">{item.institution}</p>
        </div>
      ))}
    </div>
  );
};
