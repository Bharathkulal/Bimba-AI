import React from 'react';

interface TypographySettingsProps {
  selectedFont: string;
  setSelectedFont: (f: string) => void;
  selectedFontSize: number;
  setSelectedFontSize: (s: number) => void;
  selectedHeadingSize: number;
  setSelectedHeadingSize: (s: number) => void;
  selectedSpacing: number;
  setSelectedSpacing: (s: number) => void;
}

export const TypographySettings: React.FC<TypographySettingsProps> = ({
  selectedFont,
  setSelectedFont,
  selectedFontSize,
  setSelectedFontSize,
  selectedHeadingSize,
  setSelectedHeadingSize,
  selectedSpacing,
  setSelectedSpacing
}) => {
  const fonts = [
    { id: 'Inter', name: 'Inter' },
    { id: 'Roboto', name: 'Roboto' },
    { id: 'Poppins', name: 'Poppins' },
    { id: 'Lato', name: 'Lato' },
    { id: 'Open Sans', name: 'Open Sans' },
    { id: 'Merriweather', name: 'Merriweather' },
    { id: 'Georgia', name: 'Georgia' }
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Font Family</label>
        <select
          value={selectedFont}
          onChange={(e) => setSelectedFont(e.target.value)}
          className="w-full mt-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
        >
          {fonts.map(font => (
            <option key={font.id} value={font.id}>{font.name}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Font Size: {selectedFontSize}pt</label>
        </div>
        <input
          type="range" min="8" max="14" value={selectedFontSize}
          onChange={(e) => setSelectedFontSize(parseInt(e.target.value))}
          className="w-full mt-2 accent-[#14532D]"
        />
      </div>

      <div>
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Heading Size: {selectedHeadingSize}pt</label>
        </div>
        <input
          type="range" min="12" max="22" value={selectedHeadingSize}
          onChange={(e) => setSelectedHeadingSize(parseInt(e.target.value))}
          className="w-full mt-2 accent-[#14532D]"
        />
      </div>

      <div>
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Line Spacing: {selectedSpacing}x</label>
        </div>
        <input
          type="range" min="1.0" max="2.0" step="0.1" value={selectedSpacing}
          onChange={(e) => setSelectedSpacing(parseFloat(e.target.value))}
          className="w-full mt-2 accent-[#14532D]"
        />
      </div>
    </div>
  );
};

export default TypographySettings;
