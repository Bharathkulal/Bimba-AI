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
    { id: 'typography', label: 'Type' },
    { id: 'layout', label: 'Layout' },
    { id: 'sections', label: 'Sections' }
  ];

  return (
    <div className="w-full bg-white border border-[#E5E5E2] rounded-2xl flex flex-col h-full overflow-hidden text-left">
      <div className="p-4 border-b border-[#E5E5E2] shrink-0">
        <h3 className="font-extrabold text-[#1A1A1A] text-sm">Style</h3>
      </div>

      <div className="flex gap-4 px-4 border-b border-[#E5E5E2] bg-white shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 text-[11px] font-extrabold transition-all cursor-pointer border-b-2 ${
              activeTab === tab.id
                ? 'border-[#0F4A3C] text-[#0F4A3C]'
                : 'border-transparent text-[#6B6B68] hover:text-[#1A1A1A]'
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
