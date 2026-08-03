import React from 'react';

interface SkillSectionProps {
  items: string[];
  columns?: number;
  colors: any;
  fonts: any;
}

export const SkillSection: React.FC<SkillSectionProps> = ({ items = [], columns = 1, colors, fonts }) => {
  if (!items.length) return null;

  if (columns > 1) {
    const colCount = columns;
    const itemsPerCol = Math.ceil(items.length / colCount);
    const cols = Array.from({ length: colCount }, (_, i) => 
      items.slice(i * itemsPerCol, (i + 1) * itemsPerCol)
    );

    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}>
        {cols.map((col, colIdx) => (
          <ul key={colIdx} className="list-disc pl-4 space-y-1 text-[11px] text-slate-650 leading-relaxed">
            {col.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>
        ))}
      </div>
    );
  }

  return (
    <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">
      {items.join(', ')}
    </p>
  );
};
