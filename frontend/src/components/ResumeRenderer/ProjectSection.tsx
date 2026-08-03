import React from 'react';

interface ProjectItem {
  title: string;
  technologies: string;
  description: string;
}

interface ProjectSectionProps {
  items: ProjectItem[];
  colors: any;
  fonts: any;
}

export const ProjectSection: React.FC<ProjectSectionProps> = ({ items = [], colors, fonts }) => {
  if (!items.length) return null;

  return (
    <div className="flex flex-col gap-3.5">
      {items.map((item, idx) => (
        <div key={idx} className="flex flex-col gap-1">
          <div className="flex justify-between items-baseline">
            <h4 
              className="text-[12px] font-black text-slate-800"
              style={{ color: colors.primary, fontFamily: fonts.heading }}
            >
              {item.title}
              {item.technologies && (
                <span className="text-[10px] text-slate-450 font-semibold ml-1.5">
                  ({item.technologies})
                </span>
              )}
            </h4>
          </div>
          {item.description && (
            <p className="text-[11px] text-slate-655 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
