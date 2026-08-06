import React, { useState } from 'react';
import ThemeSettings from './ThemeSettings';
import TypographySettings from './TypographySettings';
import LayoutSettings from './LayoutSettings';
import SectionManager from './SectionManager';

interface CustomizationPanelProps {
  selectedColor: string;
  setSelectedColor: (c: string) => void;
  headerAlignment: string;
  setHeaderAlignment: (a: string) => void;
  selectedFont: string;
  setSelectedFont: (f: string) => void;
  selectedFontSize: number;
  setSelectedFontSize: (s: number) => void;
  selectedHeadingSize: number;
  setSelectedHeadingSize: (s: number) => void;
  selectedSpacing: number;
  setSelectedSpacing: (s: number) => void;
  layoutColumns: number;
  setLayoutColumns: (c: number) => void;
  selectedMargin: number;
  setSelectedMargin: (m: number) => void;
  sectionDividerStyle: string;
  setSectionDividerStyle: (s: string) => void;
  enabledSections: Record<string, boolean>;
  setEnabledSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  selectedColor,
  setSelectedColor,
  headerAlignment,
  setHeaderAlignment,
  selectedFont,
  setSelectedFont,
  selectedFontSize,
  setSelectedFontSize,
  selectedHeadingSize,
  setSelectedHeadingSize,
  selectedSpacing,
  setSelectedSpacing,
  layoutColumns,
  setLayoutColumns,
  selectedMargin,
  setSelectedMargin,
  sectionDividerStyle,
  setSectionDividerStyle,
  enabledSections,
  setEnabledSections
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'typography' | 'layout' | 'sections'>('theme');

  const tabs = [
    { id: 'theme', label: 'Theme' },
    { id: 'typography', label: 'Typography' },
    { id: 'layout', label: 'Layout' },
    { id: 'sections', label: 'Sections' }
  ];

  return (
    <div className="w-[340px] bg-white border border-slate-200/80 rounded-2xl flex flex-col h-full overflow-hidden shadow-sm text-left">
      <div className="p-4 border-b border-slate-100 shrink-0">
        <h3 className="font-extrabold text-slate-800 text-sm">Customize Style</h3>
        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Adjust color, font, spacing, and segments.</p>
      </div>

      <div className="grid grid-cols-4 gap-1 p-2 bg-slate-50 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#14532D] text-white shadow-sm'
                : 'text-slate-550 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-grow overflow-y-auto p-4 scrollbar-thin">
        {activeTab === 'theme' && (
          <ThemeSettings
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            headerAlignment={headerAlignment}
            setHeaderAlignment={setHeaderAlignment}
          />
        )}
        {activeTab === 'typography' && (
          <TypographySettings
            selectedFont={selectedFont}
            setSelectedFont={setSelectedFont}
            selectedFontSize={selectedFontSize}
            setSelectedFontSize={setSelectedFontSize}
            selectedHeadingSize={selectedHeadingSize}
            setSelectedHeadingSize={setSelectedHeadingSize}
            selectedSpacing={selectedSpacing}
            setSelectedSpacing={setSelectedSpacing}
          />
        )}
        {activeTab === 'layout' && (
          <LayoutSettings
            layoutColumns={layoutColumns}
            setLayoutColumns={setLayoutColumns}
            selectedMargin={selectedMargin}
            setSelectedMargin={setSelectedMargin}
            sectionDividerStyle={sectionDividerStyle}
            setSectionDividerStyle={setSectionDividerStyle}
          />
        )}
        {activeTab === 'sections' && (
          <SectionManager
            enabledSections={enabledSections}
            setEnabledSections={setEnabledSections}
          />
        )}
      </div>
    </div>
  );
};

export default CustomizationPanel;
