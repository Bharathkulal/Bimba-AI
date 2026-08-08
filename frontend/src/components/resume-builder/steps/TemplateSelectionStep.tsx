import React from 'react';
import { useResumeBuilderContext } from '../ResumeBuilderContext';
import { Card } from '../../Card';
import { Check, Columns, Sparkles, Type, Sliders } from 'lucide-react';

export const TemplateSelectionStep: React.FC = () => {
  const { selectedTemplate, setSelectedTemplate, stylePrefs, setStylePrefs, parsedData } = useResumeBuilderContext();

  const templates = [
    { id: 'microsoft', name: 'Microsoft ATS', category: 'ATS Standard' },
    { id: 'harvard', name: 'Harvard Business', category: 'Executive' },
    { id: 'minimalist-modern', name: 'Minimalist Modern', category: 'Premium' },
    { id: 'creative', name: 'Creative Designer', category: 'Modern' }
  ];

  const colors = ['#111827', '#0F766E', '#1D4ED8', '#6D28D9', '#BE185D'];

  const fontFamilies = ['Inter', 'Roboto', 'Outfit', 'Merriweather', 'Lora'];

  const handleStyleChange = (key: string, val: any) => {
    setStylePrefs(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 py-4 text-left items-start">
      
      {/* Left panel: Templates List Grid */}
      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
        {templates.map((tpl) => {
          const isSelected = tpl.id === selectedTemplate;
          return (
            <Card
              key={tpl.id}
              onClick={() => setSelectedTemplate(tpl.id)}
              className={`border-2 p-5 rounded-3xl cursor-pointer bg-white dark:bg-white/5 flex flex-col gap-3.5 transition-all ${
                isSelected 
                  ? 'border-emerald-500 shadow-md' 
                  : 'border-slate-200 dark:border-white/5 hover:border-emerald-500/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider">{tpl.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">{tpl.category}</p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <Check size={11} />
                  </div>
                )}
              </div>

              {/* Minimal preview mockup */}
              <div className="border border-slate-100 dark:border-white/5 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 text-[8px] font-medium leading-relaxed">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-250 dark:bg-white/10" />
                  <div className="h-1.5 w-1/3 bg-slate-250 dark:bg-white/10 rounded" />
                </div>
                <div className="h-1 bg-slate-250 dark:bg-white/5 rounded w-full" />
                <div className="h-1 bg-slate-250 dark:bg-white/5 rounded w-5/6" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Right panel: Style Drawer Controls */}
      <Card className="p-6 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-md flex flex-col gap-6">
        <div className="border-b border-slate-100 dark:border-white/5 pb-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <Sliders size={15} className="text-emerald-500" /> Styles & Themes
          </h3>
        </div>

        {/* Accent colors */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accent Color</label>
          <div className="flex items-center gap-2">
            {colors.map((c) => {
              const isActive = stylePrefs.primaryColor === c;
              return (
                <button
                  key={c}
                  onClick={() => handleStyleChange('primaryColor', c)}
                  className={`w-6 h-6 rounded-full cursor-pointer transition-all border ${
                    isActive ? 'scale-110 border-slate-900 dark:border-white shadow-sm' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              );
            })}
          </div>
        </div>

        {/* Layout columns */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Columns size={12} /> Columns Layout
          </label>
          <div className="flex gap-2">
            {[1, 2].map((cols) => {
              const isActive = stylePrefs.columns === cols;
              return (
                <button
                  key={cols}
                  onClick={() => handleStyleChange('columns', cols)}
                  className={`flex-1 py-2 font-bold text-xs rounded-xl border cursor-pointer transition-all ${
                    isActive 
                      ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' 
                      : 'border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {cols} Column{cols > 1 ? 's' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Font family */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Type size={12} /> Typography Font
          </label>
          <select
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
            value={stylePrefs.fontFamily}
            onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
          >
            {fontFamilies.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Margins */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Page Margins</span>
            <span>{stylePrefs.margin}px</span>
          </div>
          <input
            type="range"
            min="16"
            max="48"
            step="4"
            className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            value={stylePrefs.margin}
            onChange={(e) => handleStyleChange('margin', parseInt(e.target.value, 10))}
          />
        </div>

      </Card>

    </div>
  );
};
export default TemplateSelectionStep;
