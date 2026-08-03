import React from 'react';

interface ResumeHeaderProps {
  personalInfo: any;
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: string;
}

export const ResumeHeader: React.FC<ResumeHeaderProps> = ({ personalInfo, colors, fonts, layout }) => {
  if (!personalInfo) return null;
  const name = personalInfo.name || personalInfo.candidateName || '';
  const email = personalInfo.email || '';
  const phone = personalInfo.phone || '';
  const location = personalInfo.location || personalInfo.address || '';
  const links = personalInfo.portfolioLinks || [];
  
  const isCentered = layout === 'single-column' || layout === 'minimal' || layout === 'corporate';

  return (
    <div 
      className={`border-b-2 pb-4 mb-5 flex flex-col ${isCentered ? 'items-center text-center' : 'items-start text-left'}`}
      style={{ 
        borderColor: colors.primary,
        fontFamily: fonts.heading 
      }}
    >
      <h1 
        className="text-3xl font-extrabold tracking-tight uppercase"
        style={{ color: colors.primary }}
      >
        {name}
      </h1>
      
      <div 
        className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2 text-[10.5px] font-semibold text-slate-500 justify-center"
        style={{ fontFamily: fonts.body, color: colors.secondary }}
      >
        {email && <span>{email}</span>}
        {phone && (
          <>
            {email && <span>•</span>}
            <span>{phone}</span>
          </>
        )}
        {location && (
          <>
            {(email || phone) && <span>•</span>}
            <span>{location}</span>
          </>
        )}
        {links.map((link: string, idx: number) => (
          <React.Fragment key={idx}>
            <span>•</span>
            <span className="underline">{link}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
