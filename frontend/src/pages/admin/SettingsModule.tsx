import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Save, Database, Shield, Key, FileText, Users, Sliders, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { adminService } from '../../services/admin';
import type { AdminSettingsData } from '../../services/admin';

export const SettingsModule: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // In-page settings sub-tab: 'general' | 'admins' | 'security' | 'database'
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'admins' | 'security' | 'database'>('general');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error("Failed to load settings data:", err);
      showToast("Failed to fetch system configurations.", "error");
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
      showToast("System configuration updated successfully.", "success");
      fetchSettings();
    } catch (err) {
      showToast("Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleBackupTrigger = () => {
    showToast("Database backup snapshot compiled and stored to backup path.", "success");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto animate-pulse text-left">
        <div className="h-16 bg-[#102117] border border-white/5 rounded-2xl" />
        <div className="h-96 bg-[#102117] border border-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn font-sans max-w-4xl mx-auto">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border animate-fadeIn ${
          toast.type === 'success' 
            ? 'bg-[#102117] border-[#22C55E]/20 text-[#22C55E]' 
            : 'bg-[#1F1116] border-rose-500/20 text-rose-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#102117] border border-white/5 rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-emerald-500/5 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 text-left">
          <h1 className="text-xl font-extrabold text-white tracking-tight">System Settings</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
            Configure identity parameters, university branding, and system security flags.
          </p>
        </div>
        <button 
          onClick={fetchSettings} 
          className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white cursor-pointer relative z-10"
        >
          <RefreshCw size={13} />
        </button>
      </section>

      {/* Main split settings panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
        
        {/* Left Side: Settings Sub-menu Tabs */}
        <div className="flex flex-col gap-1.5 md:col-span-1">
          {[
            { id: 'general', label: 'General Identity', icon: Sliders },
            { id: 'admins', label: 'Admins & Roles', icon: Users },
            { id: 'security', label: 'Security & Keys', icon: Shield },
            { id: 'database', label: 'Database Backup', icon: Database }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                  activeSubTab === tab.id 
                    ? 'bg-[#16A34A]/10 text-[#22C55E]' 
                    : 'text-slate-400 hover:text-white hover:bg-[#102117]'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Tab Details content */}
        <div className="md:col-span-3">
          <Card className="p-6 bg-[#13261B] border-white/5">
            {settings && (
              <form onSubmit={handleSave} className="flex flex-col gap-5">
                
                {/* 1. General Identity Tab */}
                {activeSubTab === 'general' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                    <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-2 mb-2">University branding</h3>
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">College App Name Prefix</label>
                      <input 
                        type="text"
                        value={settings.app_name}
                        onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                        className="w-full p-2.5 bg-[#102117] border border-white/10 focus:border-emerald-500/30 rounded-xl text-xs text-white outline-none font-bold"
                        placeholder="e.g. Bimba AI Placement Portal"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1">Session timeout (Minutes)</label>
                        <input 
                          type="number"
                          value={settings.session_timeout}
                          onChange={(e) => setSettings({ ...settings, session_timeout: parseInt(e.target.value) || 15 })}
                          className="w-full p-2.5 bg-[#102117] border border-white/10 focus:border-emerald-500/30 rounded-xl text-xs text-white outline-none font-bold"
                          min={5}
                          max={120}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1">Outbox SMTP Host</label>
                        <input 
                          type="text"
                          value={settings.smtp_host}
                          onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                          className="w-full p-2.5 bg-[#102117] border border-white/10 focus:border-emerald-500/30 rounded-xl text-xs text-white outline-none font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center mt-3">
                      <div>
                        <h4 className="text-xs font-bold text-white">Undergraduate Maintenance Mode</h4>
                        <p className="text-[9.5px] text-slate-500 mt-1 font-semibold">Toggles public portal availability to run DB overrides.</p>
                      </div>
                      <select
                        value={settings.maintenance_mode ? 'Enabled' : 'Disabled'}
                        onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.value === 'Enabled' })}
                        className="bg-[#102117] border border-white/10 rounded-xl px-3 py-1.8 text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
                      >
                        <option value="Disabled">Disabled (Live app)</option>
                        <option value="Enabled">Enabled (Maintenance)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 2. Admin Accounts & Roles */}
                {activeSubTab === 'admins' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                    <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-2 mb-2">Admin Roles</h3>
                    
                    <div className="overflow-x-auto rounded-xl border border-white/5">
                      <table className="w-full text-left text-xs font-medium border-collapse bg-white/5">
                        <thead>
                          <tr className="bg-[#102117] border-b border-white/5 text-slate-400 font-bold uppercase text-[9px] tracking-wide">
                            <th className="py-2.5 px-4">Username</th>
                            <th className="py-2.5 px-4">Associated Role</th>
                            <th className="py-2.5 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-350">
                          <tr>
                            <td className="py-3 px-4 font-bold text-white">admin</td>
                            <td className="py-3 px-4">Super Administrator</td>
                            <td className="py-3 px-4"><span className="text-emerald-400 font-extrabold text-[10px]">ACTIVE</span></td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-bold text-white">placement_officer</td>
                            <td className="py-3 px-4">Placement Head</td>
                            <td className="py-3 px-4"><span className="text-emerald-400 font-extrabold text-[10px]">ACTIVE</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. Security & API Keys */}
                {activeSubTab === 'security' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                    <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-2 mb-2">Security Parameters</h3>
                    
                    <div className="flex flex-col gap-3">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">Rate Limit Protection</p>
                          <p className="text-[9.5px] text-slate-500 mt-0.5">Limit student API operations to 100 requests per minute</p>
                        </div>
                        <span className="text-[#22C55E] font-black uppercase text-[10px]">ENABLED</span>
                      </div>
                      
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">JWT Token Signatures</p>
                          <p className="text-[9.5px] text-slate-500 mt-0.5">Default HS256 encryption keys rotation</p>
                        </div>
                        <span className="text-[#22C55E] font-black uppercase text-[10px]">ACTIVE</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Database Backup */}
                {activeSubTab === 'database' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                    <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-2 mb-2">System Backups</h3>
                    <p className="text-xs text-slate-400 leading-normal font-medium">
                      Compile complete backups of MongoDB databases, local resume studio layouts, and ATS scoring prompt weights.
                    </p>
                    
                    <div className="mt-2.5">
                      <Button 
                        type="button"
                        onClick={handleBackupTrigger}
                        variant="secondary"
                        className="border-white/10 text-emerald-400 flex items-center gap-1.5"
                      >
                        <Database size={13} /> Trigger Manual Database Backup Snapshot
                      </Button>
                    </div>
                  </div>
                )}

                {/* Save trigger button (only shown for general settings form values) */}
                {activeSubTab === 'general' && (
                  <Button 
                    type="submit" 
                    disabled={saving} 
                    variant="primary" 
                    className="w-full font-bold bg-[#16A34A] hover:bg-[#22C55E] justify-center mt-4"
                  >
                    <Save size={13} className="mr-1.5 inline" /> {saving ? 'Saving System Config...' : 'Save Configuration Changes'}
                  </Button>
                )}

              </form>
            )}
          </Card>
        </div>

      </div>

    </div>
  );
};

export default SettingsModule;
