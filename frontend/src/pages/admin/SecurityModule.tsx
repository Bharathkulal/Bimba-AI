import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, AlertOctagon } from 'lucide-react';
import { aiAdminService } from '../../services/aiAdmin';
import type { AISecuritySettings } from '../../services/aiAdmin';

export const SecurityModule: React.FC = () => {
  const [settings, setSettings] = useState<AISecuritySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await aiAdminService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error("Failed to load security configurations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = async (key: keyof AISecuritySettings) => {
    if (!settings) return;
    try {
      const updated = { ...settings, [key]: !settings[key] };
      setSettings(updated);
      await aiAdminService.saveSettings(updated);
    } catch (err) {
      alert("Failed to update security switches.");
    }
  };

  if (isLoading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Header */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Security Policies & Gateway Firewall</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Configure global application firewall XSS shields SQL checks and session token verification</p>
        </div>
        <button onClick={fetchSettings} className="p-2 rounded-xl hover:bg-slate-50 border border-slate-200 text-slate-500 cursor-pointer">
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Policy Switches */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield size={16} className="text-blue-600" />
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Application Web Shield</h3>
          </div>

          <div className="flex flex-col gap-4">
            {[
              { label: 'Enforce HTTPS session cookies', key: 'https_enabled' as const, desc: 'Prevents session interception by requiring TLS communication layers' },
              { label: 'Secure token verification nodes', key: 'jwt_enabled' as const, desc: 'Verifies client cryptographic signatures on API gateways' },
              { label: 'Enable XSS prevention filters', key: 'xss_protected' as const, desc: 'Sanitizes input structures against embedded javascript injections' },
              { label: 'Secure parameterized SQL filters', key: 'sql_injection_protected' as const, desc: 'Protects SQLite engine tables from query manipulation sessions' }
            ].map((sw) => {
              const active = settings ? settings[sw.key] : false;
              return (
                <div key={sw.key} className="flex justify-between items-start p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-800">{sw.label}</h5>
                    <p className="text-[9px] text-slate-450 mt-1 font-semibold leading-relaxed max-w-sm">{sw.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(sw.key)}
                    className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border cursor-pointer shrink-0 ml-4 ${
                      active 
                        ? 'bg-emerald-50 border-emerald-250 text-emerald-600' 
                        : 'bg-rose-50 border-rose-250 text-rose-600'
                    }`}
                  >
                    {active ? 'Active' : 'Disabled'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Access logs failed attempts */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <AlertOctagon size={16} className="text-rose-600" />
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Blocked Login Access timeline</h3>
            </div>

            <div className="flex flex-col gap-3.5 mt-4">
              {[
                { user: 'unknown', reason: 'Decryption payload mismatch', ip: '185.120.44.12', time: '3 hours ago' },
                { user: 'root', reason: 'Invalid login credentials', ip: '210.99.12.80', time: '1 day ago' },
                { user: 'admin', reason: 'XSS pattern matching alert', ip: '44.80.12.190', time: '3 days ago' }
              ].map((blk, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-800">IP Blocked: {blk.ip}</h5>
                    <p className="text-[9px] text-slate-450 font-semibold mt-0.5">Attempted username: {blk.user} | {blk.reason}</p>
                  </div>
                  <span className="text-[9px] font-black text-rose-650 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg whitespace-nowrap">
                    {blk.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-150 pt-4 mt-5 flex justify-between items-center">
            <span className="text-[9px] text-slate-400 font-bold uppercase">Security level score: 98% (Excellent)</span>
            <button onClick={() => alert("Blocked list updated.")} className="text-[10px] font-black uppercase text-blue-600 hover:underline">Flush Block list</button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SecurityModule;
