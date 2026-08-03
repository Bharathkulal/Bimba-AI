import React from 'react';

interface CertificationItem {
  name: string;
  organization?: string;
  issue_date?: string;
}

interface CertificationSectionProps {
  items: CertificationItem[] | string[];
  colors: any;
  fonts: any;
}

export const CertificationSection: React.FC<CertificationSectionProps> = ({ items = [], colors, fonts }) => {
  if (!items.length) return null;

  return (
    <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-650 leading-relaxed">
      {items.map((item, idx) => {
        if (typeof item === 'string') {
          return <li key={idx}>{item}</li>;
        }
        
        const org = item.organization ? ` — ${item.organization}` : '';
        const date = item.issue_date ? ` (${item.issue_date})` : '';
        return (
          <li key={idx}>
            <span className="font-bold text-slate-800" style={{ color: colors.primary }}>{item.name}</span>
            <span>{org}{date}</span>
          </li>
        );
      })}
    </ul>
  );
};
