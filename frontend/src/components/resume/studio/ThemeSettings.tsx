import React from 'react';
import { Check } from 'lucide-react';

interface ThemeSettingsProps {
  selectedColor: string;
  setSelectedColor: (c: string) => void;
  headerAlignment: string;
  setHeaderAlignment: (a: string) => void;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({
  selectedColor,
  setSelectedColor,
  headerAlignment,
  setHeaderAlignment
}) => {
  const colors = [
    { hex: '#14532D', label: 'Dark Green' },
    { hex: '#1E3A8A', label: 'Blue' },
    { hex: '#7C3AED', label: 'Purple' },
    { hex: '#4B5563', label: 'Gray' },
    { hex: '#0F172A', label: 'Professional Navy' }
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Primary Color</label>
        <div className="grid grid-cols-5 gap-2 mt-2">
          {colors.map(col => (
            <button
              key={col.hex}
              onClick={() => setSelectedColor(col.hex)}
              className={`aspect-square rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                selectedColor === col.hex ? 'border-[#14532D] scale-110 shadow-sm' : 'border-transparent opacity-85'
              }`}
              style={{ backgroundColor: col.hex }}
              title={col.label}
            >
              {selectedColor === col.hex && <Check size={12} className="text-white" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Header Style</label>
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {['left', 'center', 'right'].map(align => (
            <button
              key={align}
              onClick={() => setHeaderAlignment(align)}
              className={`py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer capitalize ${
                headerAlignment === align
                  ? 'border-[#14532D] bg-[#14532D]/5 text-[#14532D]'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {align === 'left' ? 'Classic' : align === 'center' ? 'Centered' : 'Modern'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
