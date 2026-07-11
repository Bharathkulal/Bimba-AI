import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, Lock, Play } from 'lucide-react';
import { aiAdminService } from '../../services/aiAdmin';
import type { AIProviderData, AIAnalyticsData } from '../../services/aiAdmin';

export const AiGatewayModule: React.FC = () => {
  const [providers, setProviders] = useState<AIProviderData[]>([]);
  const [analytics, setAnalytics] = useState<AIAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Testing connection states
  const [testingSlug, setTestingSlug] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Reveal Key Modal
  const [isRevealOpen, setIsRevealOpen] = useState(false);
  const [revealSlug, setRevealSlug] = useState<string | null>(null);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [p, a] = await Promise.all([
        aiAdminService.getProviders(),
        aiAdminService.getAnalytics()
      ]);
      setProviders(p);
      setAnalytics(a);
    } catch (err) {
      console.error("Failed to load AI Gateway configuration:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Countdown timer for key concealment
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && revealedKey) {
      setRevealedKey(null);
    }
  }, [countdown, revealedKey]);

  const handleTestConnection = async (slug: string) => {
    try {
      setTestingSlug(slug);
      const res = await aiAdminService.testProvider(slug);
      setTestResults(prev => ({ ...prev, [slug]: res }));
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [slug]: { success: false, status: 'Failed', latency: 'Timeout', quota: 'Exceeded' }
      }));
    } finally {
      setTestingSlug(null);
    }
  };

  const handleToggleProvider = async (slug: string, isActive: boolean) => {
    try {
      await aiAdminService.updateProvider({ slug, is_active: !isActive });
      alert("Provider status updated.");
      const updated = await aiAdminService.getProviders();
      setProviders(updated);
    } catch (err) {
      alert("Failed to modify provider status.");
    }
  };

  const triggerRevealKey = (slug: string) => {
    setRevealSlug(slug);
    setVerifyPassword('');
    setRevealedKey(null);
    setIsRevealOpen(true);
  };

  const submitReveal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revealSlug || !verifyPassword) return;
    try {
      const key = await aiAdminService.revealKey(revealSlug, verifyPassword);
      setRevealedKey(key);
      setCountdown(10);
      setIsRevealOpen(false);
    } catch (err) {
      alert("Key decryption failed. Invalid Admin credentials.");
    }
  };

  const handleSavePriority = async (slug: string, newPriority: number) => {
    try {
      await aiAdminService.updateProvider({ slug, priority: newPriority });
      const updated = await aiAdminService.getProviders();
      setProviders(updated);
    } catch (err) {
      alert("Priority order save operation failed.");
    }
  };

  if (isLoading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Analytics header cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Active LLM Providers', val: analytics?.providersOnline ?? 0, desc: 'Operational endpoints' },
          { label: 'Today Gateway Queries', val: analytics?.requestsToday ?? 0, desc: 'Total AI credits consumed' },
          { label: 'Avg Latency Speed', val: analytics?.averageResponse ?? '1.2s', desc: 'Weighted average time' },
          { label: 'Fallback Executions', val: analytics?.fallbackUsed ?? 0, desc: 'Alternative route sessions' }
        ].map((card, idx) => (
          <div key={idx} className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">{card.label}</span>
            <h3 className="text-xl font-black text-slate-800 mt-1">{card.val}</h3>
            <p className="text-[9px] text-slate-450 mt-2 font-bold">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Providers Cards Grid */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-850">Connected AI Providers Engines</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Configure credentials priorities & fallback thresholds</p>
          </div>
          <button onClick={loadData} className="p-2 rounded-xl hover:bg-slate-50 border border-slate-200/60 text-slate-500">
            <RefreshCw size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {providers.map((p) => {
            const hasTest = testResults[p.slug];
            return (
              <div key={p.slug} className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-5 flex flex-col justify-between min-h-64">
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Cpu size={16} className="text-blue-600" />
                      <h4 className="font-extrabold text-sm text-slate-800">{p.name}</h4>
                    </div>
                    <button
                      onClick={() => handleToggleProvider(p.slug, p.is_active)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {p.is_active ? (
                        <span className="text-[9px] font-black text-emerald-600 uppercase border border-emerald-100 bg-emerald-50 px-2 py-0.5 rounded-lg">Active</span>
                      ) : (
                        <span className="text-[9px] font-black text-slate-400 uppercase border border-slate-200 bg-slate-100 px-2 py-0.5 rounded-lg">Disabled</span>
                      )}
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Decrypted Key</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono text-slate-600 font-bold">{revealedKey && revealSlug === p.slug ? revealedKey : p.masked_key}</span>
                        <button
                          onClick={() => triggerRevealKey(p.slug)}
                          className="text-blue-600 hover:text-blue-700 text-[10px] font-extrabold cursor-pointer"
                        >
                          Reveal
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Gateway Priority</span>
                      <select
                        value={p.priority}
                        onChange={(e) => handleSavePriority(p.slug, parseInt(e.target.value))}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="1">Priority 1 (Primary)</option>
                        <option value="2">Priority 2 (Secondary)</option>
                        <option value="3">Priority 3 (Tertiary)</option>
                      </select>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Requests Total</span>
                      <span className="text-[10px] font-bold text-slate-700">{p.today_requests} requests</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Latency ms</span>
                      <span className="text-[10px] font-bold text-slate-700">{p.latency_ms}ms</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200/60 flex justify-between items-center">
                  <button
                    onClick={() => handleTestConnection(p.slug)}
                    disabled={testingSlug === p.slug}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-750 text-white font-bold text-[10px] uppercase shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Play size={10} /> {testingSlug === p.slug ? 'Testing...' : 'Test Connection'}
                  </button>

                  {hasTest && (
                    <span className={`text-[9px] font-black uppercase ${hasTest.success ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {hasTest.status} ({hasTest.latency}ms)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reveal Password Modal */}
      {isRevealOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <form onSubmit={submitReveal} className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="text-blue-600" size={18} />
              <h4 className="text-sm font-extrabold text-slate-800">Secure Decryption verification</h4>
            </div>
            
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-4 text-left">
              Confirm your administrator account password to temporarily view API secrets in plaintext context.
            </p>

            <input
              type="password"
              placeholder="Admin password credential..."
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold mb-5"
              required
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRevealOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-xs font-bold text-white shadow cursor-pointer"
              >
                Decrypt API Key
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Revealed Key Banner Banner */}
      {revealedKey && (
        <div className="bg-slate-800 border border-slate-700 text-white rounded-2xl p-4 flex justify-between items-center shadow-lg">
          <div>
            <span className="text-[8px] uppercase tracking-wider font-black text-slate-400 block">Plaintext Decrypted Secret API Key</span>
            <span className="text-xs font-mono font-bold select-all mt-1 block">{revealedKey}</span>
          </div>
          <span className="text-[10px] font-black uppercase text-rose-500 bg-rose-50 border border-rose-100 px-3 py-1 rounded-xl">
            Conceals in {countdown}s
          </span>
        </div>
      )}
    </div>
  );
};
export default AiGatewayModule;
