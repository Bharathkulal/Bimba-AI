import React from 'react';

interface ResumeSectionProps {
  title: string;
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
    divider?: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  fontSize?: number;
  spacing?: number;
  children: React.ReactNode;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({
  title,
  colors,
  fonts,
  fontSize = 13,
  spacing = 14,
  children
}) => {
  return (
    <div className="text-left" style={{ marginBottom: `${spacing}px` }}>
      <h3 
        className="font-black uppercase tracking-wider border-b pb-1 mb-2.5"
        style={{ 
          color: colors.primary, 
          fontFamily: fonts.heading,
          fontSize: `${fontSize}px`,
          borderColor: colors.divider || '#E5E7EB'
        }}
      >
        {title}
      </h3>
      <div style={{ fontFamily: fonts.body }}>
        {children}
      </div>
    </div>
  );
};
