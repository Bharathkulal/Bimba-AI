import React, { useState, useEffect } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { Button } from '../../components/Button';
import { adminService } from '../../services/admin';
import type { AdminSettingsData } from '../../services/admin';

export const SettingsModule: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error("Failed to load settings data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setSaving(true);
      await adminService.saveSettings(settings);
      alert("System configuration updated successfully.");
      fetchSettings();
    } catch (err) {
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-6 animate-fadeIn text-left max-w-2xl mx-auto">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">System Configuration Settings</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Configure brand identity sessions timeouts and active deployment properties</p>
        </div>
        <button onClick={fetchSettings} className="p-2 rounded-xl hover:bg-slate-50 border border-slate-200 text-slate-500 cursor-pointer">
          <RefreshCw size={13} />
        </button>
      </div>

      {settings && (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">College Identity / App Name</label>
            <input
              type="text"
              value={settings.app_name}
              onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
              className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
              placeholder="e.g. Bimba AI College Admin"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Session timeout (Minutes)</label>
              <input
                type="number"
                value={settings.session_timeout}
                onChange={(e) => setSettings({ ...settings, session_timeout: parseInt(e.target.value) })}
                className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                min={5}
                max={120}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Outbox SMTP Host Address</label>
              <input
                type="text"
                value={settings.smtp_host}
                onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                required
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center mt-3">
            <div>
              <h4 className="text-[11px] font-bold text-slate-800">Undergraduate Maintenance Mode</h4>
              <p className="text-[9px] text-slate-450 mt-1 font-semibold">Toggles public portal availability to execute system database overrides</p>
            </div>
            <select
              value={settings.maintenance_mode ? 'Enabled' : 'Disabled'}
              onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.value === 'Enabled' })}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-semibold text-slate-750 focus:outline-none cursor-pointer"
            >
              <option value="Disabled">Disabled (Live app)</option>
              <option value="Enabled">Enabled (Maintenance screen)</option>
            </select>
          </div>

          <Button type="submit" disabled={saving} variant="primary" className="bg-blue-600 font-bold gap-1 text-[11px] mt-6 w-full py-3 rounded-2xl justify-center shadow-md">
            <Save size={14} /> {saving ? 'Saving Settings...' : 'Save Configuration Changes'}
          </Button>
        </form>
      )}
    </div>
  );
};
export default SettingsModule;
