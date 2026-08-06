import React from 'react';

interface LayoutSettingsProps {
  layoutColumns: number;
  setLayoutColumns: (c: number) => void;
  selectedMargin: number;
  setSelectedMargin: (m: number) => void;
  sectionDividerStyle: string;
  setSectionDividerStyle: (s: string) => void;
}

export const LayoutSettings: React.FC<LayoutSettingsProps> = ({
  layoutColumns,
  setLayoutColumns,
  selectedMargin,
  setSelectedMargin,
  sectionDividerStyle,
  setSectionDividerStyle
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Resume Width</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[
            { id: 1, label: 'One Column' },
            { id: 2, label: 'Two Column' }
          ].map(col => (
            <button
              key={col.id}
              onClick={() => setLayoutColumns(col.id)}
              className={`py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                layoutColumns === col.id
                  ? 'border-[#14532D] bg-[#14532D]/5 text-[#14532D]'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {col.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Margins: {selectedMargin}mm</label>
        <input
          type="range" min="10" max="30" value={selectedMargin}
          onChange={(e) => setSelectedMargin(parseInt(e.target.value))}
          className="w-full mt-2 accent-[#14532D]"
        />
      </div>

      <div>
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Section Dividers</label>
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {['solid', 'dashed', 'none'].map(div => (
            <button
              key={div}
              onClick={() => setSectionDividerStyle(div)}
              className={`py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer capitalize ${
                sectionDividerStyle === div
                  ? 'border-[#14532D] bg-[#14532D]/5 text-[#14532D]'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {div}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LayoutSettings;
