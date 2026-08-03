import React, { useState } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Sun, Moon, Bell, Shield, Key } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export const PlacementSettings: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const isDark = theme === 'dark';
  const [activeCategory, setActiveCategory] = useState<'preferences' | 'notifications'>('preferences');

  const categories = [
    { id: 'preferences', label: 'System Preferences', icon: Sun, desc: 'Visual theme and style options' },
    { id: 'notifications', label: 'Notification Settings', icon: Bell, desc: 'Setup system alerts and communication channels' }
  ];

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold tracking-tight">System Settings</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
          Configure portal preferences, styling, and notification frequencies
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`flex items-start gap-3.5 p-3 rounded-2xl w-full text-left border transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow' 
                    : 'bg-white text-slate-650 hover:bg-slate-50 dark:bg-[#102117]/10 dark:text-slate-350 dark:hover:bg-white/5 border-slate-200/50 dark:border-white/5'
                }`}
              >
                <Icon size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold">{cat.label}</p>
                  <p className={`text-[10px] mt-0.5 ${isActive ? (isDark ? 'text-slate-500' : 'text-slate-400') : 'text-slate-450'}`}>
                    {cat.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Box */}
        <div className="flex-grow w-full">
          {activeCategory === 'preferences' && (
            <Card className="flex flex-col gap-5">
              <div className="border-b border-slate-100 dark:border-white/5 pb-4">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Visual Interface Theme</h3>
                <p className="text-[9px] text-slate-450 uppercase font-bold mt-0.5">Choose your preferred application style</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center justify-center p-6 border rounded-2xl cursor-pointer transition-all gap-2.5 ${
                    theme === 'light' 
                      ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 font-extrabold' 
                      : 'border-slate-200 dark:border-white/5 text-slate-450 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold'
                  }`}
                >
                  <Sun size={24} />
                  <span className="text-xs">Light Interface</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center justify-center p-6 border rounded-2xl cursor-pointer transition-all gap-2.5 ${
                    theme === 'dark' 
                      ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 font-extrabold' 
                      : 'border-slate-200 dark:border-white/5 text-slate-450 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold'
                  }`}
                >
                  <Moon size={24} />
                  <span className="text-xs">Dark Interface</span>
                </button>
              </div>
            </Card>
          )}

          {activeCategory === 'notifications' && (
            <Card className="flex flex-col gap-4">
              <div className="border-b border-slate-100 dark:border-white/5 pb-4">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Communication Feeds</h3>
                <p className="text-[9px] text-slate-450 uppercase font-bold mt-0.5">Toggle notification types</p>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-emerald-650 focus:ring-emerald-500" />
                  <span>Receive system updates on candidate resume submissions</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer mt-2">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-emerald-650 focus:ring-emerald-500" />
                  <span>Send digest summary emails every morning</span>
                </label>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
export default PlacementSettings;
