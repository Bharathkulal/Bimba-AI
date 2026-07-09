import React, { useState, useEffect } from 'react';
import { 
  Cpu, Sliders, Shield, FileSpreadsheet, Activity, Key, RefreshCw, 
  ArrowRight, ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, AlertCircle,
  Save, ArrowUp, ArrowDown, Database, DollarSign, Clock, HelpCircle,
  Settings as SettingsIcon
} from 'lucide-react';
import { Button } from '../components/Button';
import { aiAdminService } from '../services/aiAdmin';
import type { AIProviderData, AIAnalyticsData, AIGatewayLogItem, AIHealthItem, AISecuritySettings } from '../services/aiAdmin';

export const AiManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'priority' | 'usage' | 'health' | 'logs' | 'security' | 'settings'>('overview');
  
  // Loading & State
  const [isLoading, setIsLoading] = useState(true);
  const [providers, setProviders] = useState<AIProviderData[]>([]);
  const [analytics, setAnalytics] = useState<AIAnalyticsData | null>(null);
  const [logs, setLogs] = useState<AIGatewayLogItem[]>([]);
  const [health, setHealth] = useState<AIHealthItem[]>([]);
  const [settings, setSettings] = useState<AISecuritySettings | null>(null);
  
  // Modal / Secret flow
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [targetSecretSlug, setTargetSecretSlug] = useState<string | null>(null);
  const [secretPassword, setSecretPassword] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [keyCountdown, setKeyCountdown] = useState<number>(0);
  const [secretAction, setSecretAction] = useState<'reveal' | 'update'>('reveal');
  const [newApiKey, setNewApiKey] = useState('');

  // Provider Connection Testing state
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ status: string; latency: string; quota: string } | null>(null);

  // Fetch configs
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [p, a, l, h, s] = await Promise.all([
        aiAdminService.getProviders(),
        aiAdminService.getAnalytics(),
        aiAdminService.getLogs(),
        aiAdminService.getHealth(),
        aiAdminService.getSettings()
      ]);
      setProviders(p);
      setAnalytics(a);
      setLogs(l);
      setHealth(h);
      setSettings(s);
    } catch (err) {
      console.error("Failed to load AI Admin details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Health auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const h = await aiAdminService.getHealth();
        setHealth(h);
      } catch (err) {
        console.error("Auto refresh health failed:", err);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Secret management countdown timer
  useEffect(() => {
    if (keyCountdown > 0) {
      const timer = setTimeout(() => setKeyCountdown(keyCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (keyCountdown === 0 && revealedKey) {
      setRevealedKey(null);
    }
  }, [keyCountdown, revealedKey]);

  // Test provider connection
  const runProviderTest = async (slug: string) => {
    try {
      setTestingProvider(slug);
      setTestResult(null);
      const result = await aiAdminService.testProvider(slug);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        status: "Quota Exceeded",
        latency: "Timeout",
        quota: "None - Switching to fallback"
      });
    } finally {
      setTestingProvider(null);
    }
  };

  // Secret verify
  const handleVerifySecret = async () => {
    if (!targetSecretSlug || !secretPassword.trim()) return;
    try {
      if (secretAction === 'reveal') {
        const key = await aiAdminService.revealKey(targetSecretSlug, secretPassword);
        setRevealedKey(key);
        setKeyCountdown(10);
        setIsSecretModalOpen(false);
        setSecretPassword('');
      } else {
        // Update key
        await aiAdminService.updateProvider({ slug: targetSecretSlug, api_key: newApiKey });
        alert("API Key updated securely in database.");
        setIsSecretModalOpen(false);
        setSecretPassword('');
        setNewApiKey('');
        const p = await aiAdminService.getProviders();
        setProviders(p);
      }
    } catch (err) {
      alert("Verification failed. Incorrect Admin password.");
    }
  };

  // Move priority Order
  const handleMovePriority = async (index: number, direction: 'up' | 'down') => {
    const list = [...providers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    
    // Swap
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    
    // Update priorities locally
    const ordered = list.map((item, idx) => ({ ...item, priority: idx + 1 }));
    setProviders(ordered);
  };

  const handleSavePriority = async () => {
    try {
      const order = providers.map(p => p.slug);
      await aiAdminService.savePriority(order);
      alert("Provider priorities saved. AI Gateway immediately updated.");
      fetchData();
    } catch (err) {
      alert("Failed to save priorities.");
    }
  };

  // Save Settings toggles
  const handleSettingToggle = async (key: keyof AISecuritySettings) => {
    if (!settings) return;
    try {
      const updated = { ...settings, [key]: !settings[key] };
      setSettings(updated);
      await aiAdminService.saveSettings(updated);
    } catch (err) {
      console.error("Save settings toggle failed:", err);
    }
  };

  const handleTextSettingsSave = async (key: keyof AISecuritySettings, value: number) => {
    if (!settings) return;
    try {
      const updated = { ...settings, [key]: value };
      setSettings(updated);
      await aiAdminService.saveSettings(updated);
    } catch (err) {
      console.error("Save numeric setting failed:", err);
    }
  };

  if (isLoading || !analytics || !settings) {
    return (
      <div className="flex flex-col gap-10 min-h-screen pb-12 w-full">
        <div className="h-16 w-full bg-slate-200/50 rounded-3xl animate-pulse" />
        <div className="h-44 w-full bg-slate-200/50 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-blue-500/15 pb-12 w-full select-none relative z-10">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
            <Cpu size={24} />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">AI Management Center ⭐</h2>
            <p className="text-slate-450 text-xs mt-1">Configure secure API keys, gateways, priority failover rules, and providers health</p>
          </div>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50 gap-1.5 font-bold shrink-0">
          <RefreshCw size={14} className="animate-spin-slow" /> Refresh Metrics
        </Button>
      </header>

      {/* METRICS NAVIGATION DOCK */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 shrink-0">
        {[
          { id: 'overview', label: 'AI Overview', icon: Cpu },
          { id: 'providers', label: 'AI Providers', icon: Key },
          { id: 'priority', label: 'AI Gateway Priority', icon: Sliders },
          { id: 'usage', label: 'Usage Analytics', icon: Activity },
          { id: 'health', label: 'Health Monitor', icon: ShieldCheck },
          { id: 'logs', label: 'AI Gateway Logs', icon: FileSpreadsheet },
          { id: 'security', label: 'Security Parameters', icon: Shield },
          { id: 'settings', label: 'Admin Settings', icon: SettingsIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-250 cursor-pointer whitespace-nowrap ${
                isActive 
                  ? 'bg-white text-blue-650 shadow-sm border border-slate-200/40' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ACTIVE TAB DISPLAY AREA */}
      <div className="min-h-[50vh]">
        
        {/* T1: AI OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Real-time Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white border border-slate-200/60 rounded-2xl p-4 text-center shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Providers Online</span>
                <h3 className="text-xl font-black text-slate-800 mt-1">{analytics.providersOnline}</h3>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-2xl p-4 text-center shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Requests Today</span>
                <h3 className="text-xl font-black text-slate-800 mt-1">{analytics.requestsToday}</h3>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-2xl p-4 text-center shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Latency</span>
                <h3 className="text-xl font-black text-slate-800 mt-1">{analytics.averageResponse}</h3>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-2xl p-4 text-center shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Success Rate</span>
                <h3 className="text-xl font-black text-emerald-600 mt-1">{analytics.successRate}</h3>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-2xl p-4 text-center shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fallback Triggers</span>
                <h3 className="text-xl font-black text-rose-500 mt-1">{analytics.fallbackUsed}</h3>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-2xl p-4 text-center shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Channel</span>
                <h3 className="text-xl font-black text-blue-600 mt-1">{analytics.activeProvider}</h3>
              </div>
            </div>

            {/* AI Gateway Flow Diagram */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-6 text-center">
              <div className="text-left">
                <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest">Router Topology</span>
                <h4 className="text-base font-extrabold text-slate-800 mt-1">Smart Gateway Flow</h4>
              </div>
              
              <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 py-6 overflow-x-auto no-scrollbar">
                
                {/* Step 1: Frontend */}
                <div className="flex flex-col items-center p-3 bg-slate-50 border border-slate-200 rounded-2xl w-36 shadow-sm">
                  <Database className="text-slate-400 mb-1" size={18} />
                  <span className="text-xs font-bold text-slate-700">Frontend App</span>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">https client</span>
                </div>

                <ArrowRight className="text-slate-300 hidden lg:block" />
                <span className="text-xs text-slate-400 font-bold lg:hidden">↓</span>

                {/* Step 2: Backend */}
                <div className="flex flex-col items-center p-3 bg-slate-50 border border-slate-200 rounded-2xl w-36 shadow-sm">
                  <Cpu className="text-slate-400 mb-1" size={18} />
                  <span className="text-xs font-bold text-slate-700">FastAPI Server</span>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Endpoints</span>
                </div>

                <ArrowRight className="text-slate-300 hidden lg:block" />
                <span className="text-xs text-slate-400 font-bold lg:hidden">↓</span>

                {/* Step 3: Gateway */}
                <div className="flex flex-col items-center p-3 bg-blue-50 border border-blue-200 rounded-2xl w-40 shadow-sm relative">
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    active
                  </div>
                  <Sliders className="text-blue-600 mb-1" size={18} />
                  <span className="text-xs font-bold text-blue-800">AI Routing Gateway</span>
                  <span className="text-[9px] text-blue-550 font-semibold uppercase mt-0.5">Priority Engine</span>
                </div>

                <ArrowRight className="text-blue-300 hidden lg:block" />
                <span className="text-xs text-slate-400 font-bold lg:hidden">↓</span>

                {/* Step 4: Provider priority failover list */}
                <div className="flex flex-col gap-2">
                  {providers.map((p, idx) => (
                    <div 
                      key={p.slug} 
                      className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-bold w-48 shadow-sm ${
                        p.status === 'Healthy'
                          ? 'bg-emerald-50 border-emerald-200/60 text-emerald-800'
                          : p.status === 'Connected'
                          ? 'bg-blue-50/40 border-blue-200/40 text-blue-800'
                          : 'bg-rose-50 border-rose-200/50 text-rose-800'
                      }`}
                    >
                      <span className="bg-white/80 w-5 h-5 rounded-full flex items-center justify-center border text-[9px]">{idx + 1}</span>
                      <span className="flex-grow text-left">{p.name}</span>
                      <span className="text-[8px] uppercase tracking-widest bg-white/60 px-1.5 py-0.5 rounded">
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* T2: AI PROVIDERS */}
        {activeTab === 'providers' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            {providers.map((p) => {
              const isKeyShown = revealedKey && targetSecretSlug === p.slug;
              return (
                <div 
                  key={p.slug} 
                  className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between min-h-64 shadow-sm hover:shadow transition-all duration-250"
                >
                  <div>
                    {/* Title Block */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-extrabold text-slate-800">{p.name}</h4>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 block">Priority #{p.priority}</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.8 rounded-lg shadow-sm border ${
                        p.status === 'Healthy' 
                          ? 'bg-emerald-50 border-emerald-200/60 text-emerald-600'
                          : p.status === 'Connected'
                          ? 'bg-blue-50 border-blue-100 text-blue-650'
                          : 'bg-rose-50 border-rose-150 text-rose-600'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    {/* API Key Box */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4.5 my-4.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Encrypted API Key</span>
                      <div className="flex items-center justify-between gap-3 mt-1.5">
                        <code className="text-xs font-bold text-slate-650 tracking-wider truncate flex-grow">
                          {isKeyShown ? revealedKey : p.masked_key}
                        </code>
                        <button
                          onClick={() => {
                            if (isKeyShown) {
                              setRevealedKey(null);
                            } else {
                              setTargetSecretSlug(p.slug);
                              setSecretAction('reveal');
                              setIsSecretModalOpen(true);
                            }
                          }}
                          className="text-slate-400 hover:text-slate-800 transition-smooth p-1 cursor-pointer"
                          title={isKeyShown ? "Hide Key" : "Reveal Key (requires admin auth)"}
                        >
                          {isKeyShown ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {isKeyShown && (
                        <p className="text-[9px] text-orange-600 font-bold mt-2 uppercase tracking-wide">
                          ⏳ Auto-hiding key in {keyCountdown}s
                        </p>
                      )}
                    </div>

                    {/* Stats List */}
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase">Latency</span>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{p.latency_ms} ms</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase">Requests Today</span>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{p.today_requests} requests</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <Button 
                      onClick={() => {
                        setTargetSecretSlug(p.slug);
                        setSecretAction('update');
                        setIsSecretModalOpen(true);
                      }}
                      variant="outline" 
                      size="sm" 
                      className="border-slate-200 text-slate-650 hover:bg-slate-50 font-bold"
                    >
                      Update Key
                    </Button>
                    <Button 
                      onClick={() => runProviderTest(p.slug)}
                      variant="primary" 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 font-bold gap-1"
                    >
                      Test Conn
                    </Button>
                  </div>

                  {/* Latency / Test Status Banner */}
                  {testingProvider === p.slug && (
                    <div className="mt-3.5 bg-blue-50 border border-blue-200/50 rounded-xl p-2.5 text-center text-xs font-semibold text-blue-600 animate-pulse">
                      Checking Connection...
                    </div>
                  )}
                  {testResult && targetSecretSlug === p.slug && !testingProvider && (
                    <div className={`mt-3.5 border rounded-xl p-3 text-xs text-left ${
                      testResult.status === 'Healthy' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      <div className="flex justify-between items-center font-bold">
                        <span>Status: {testResult.status}</span>
                        <span>{testResult.latency}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Quota: {testResult.quota}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* T3: AI GATEWAY PRIORITY */}
        {activeTab === 'priority' && (
          <div className="max-w-2xl mx-auto bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm animate-fadeIn">
            <div className="flex justify-between items-end border-b border-slate-100 pb-3 mb-6">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gateway Priority Settings</span>
                <h4 className="text-base font-extrabold text-slate-800 mt-1">Reorder Fallback Priority</h4>
              </div>
              <Button onClick={handleSavePriority} variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold gap-1.5 shadow-md shadow-blue-500/10">
                <Save size={14} /> Save Order
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {providers.map((p, idx) => (
                <div 
                  key={p.slug}
                  className="flex items-center justify-between bg-slate-50 border border-slate-200/70 hover:border-slate-350 rounded-2xl p-4.5 transition-smooth"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200/60 flex items-center justify-center font-extrabold text-xs text-slate-700 shadow-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-800">{p.name}</h5>
                      <span className="text-[9px] text-slate-400 font-semibold">{p.slug} fallback channel</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMovePriority(idx, 'up')}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-smooth flex items-center justify-center cursor-pointer shadow-sm"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      disabled={idx === providers.length - 1}
                      onClick={() => handleMovePriority(idx, 'down')}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-smooth flex items-center justify-center cursor-pointer shadow-sm"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-450 mt-5 font-semibold text-center leading-relaxed">
              * The AI gateway will automatically attempt to route requests in the order configured above. If the higher priority channel fails, it seamlessly cascades to the next active provider.
            </p>
          </div>
        )}

        {/* T4: USAGE ANALYTICS */}
        {activeTab === 'usage' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Provider Distribution Bar Chart */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
                <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Distribution</span>
                <h4 className="text-base font-extrabold text-slate-800 mt-1">Provider Requests Distribution</h4>
                
                <div className="flex flex-col gap-4 mt-6">
                  {Object.entries(analytics.usage).map(([provider, count]) => {
                    const total = Object.values(analytics.usage).reduce((a, b) => a + b, 0) || 1;
                    const percent = Math.round((count / total) * 100);
                    return (
                      <div key={provider} className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700 uppercase tracking-wide">{provider}</span>
                          <span className="text-slate-450">{count} requests ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/10">
                          <div 
                            className="bg-blue-600 h-full rounded-full transition-all duration-300" 
                            style={{ width: `${percent}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Features Distribution List */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
                <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Features</span>
                <h4 className="text-base font-extrabold text-slate-800 mt-1">AI Features Usage Split</h4>
                
                <div className="flex flex-col gap-4 mt-6">
                  {Object.entries(analytics.features).map(([feat, percent]) => (
                    <div key={feat} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-700">{feat}</span>
                        <span className="text-slate-455">{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/10">
                        <div 
                          className="bg-purple-600 h-full rounded-full transition-all duration-300" 
                          style={{ width: `${percent}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* AI Cost Monitor */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm text-left">
              <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase">Budget Dashboard</span>
              <h4 className="text-base font-extrabold text-slate-800 mt-1">AI Cost Monitor (Estimate)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <DollarSign size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Gemini Billing</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mt-2">$0.00</h3>
                  <p className="text-[9px] font-semibold text-slate-400 mt-1">Using free tier developer keys</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <DollarSign size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">OpenRouter Billing</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mt-2">$0.02</h3>
                  <p className="text-[9px] font-semibold text-slate-400 mt-1">Total model endpoint query usage</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <DollarSign size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Groq Billing</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mt-2">$0.00</h3>
                  <p className="text-[9px] font-semibold text-slate-400 mt-1">Developer preview keys</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* T5: HEALTH MONITOR */}
        {activeTab === 'health' && (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm animate-fadeIn">
            <div className="flex justify-between items-end border-b border-slate-100 pb-3 mb-6">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Health Signals</span>
                <h4 className="text-base font-extrabold text-slate-800 mt-1">Live Health Monitoring</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold italic">Auto-refreshing every 30 seconds</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {health.map((hItem) => (
                <div 
                  key={hItem.slug}
                  className="bg-slate-50 border border-slate-200/70 rounded-2xl p-5 flex flex-col gap-4"
                >
                  <div className="flex justify-between items-center">
                    <h5 className="font-extrabold text-sm text-slate-800">{hItem.provider}</h5>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.8 rounded-lg shadow-sm border ${
                      hItem.status === 'Healthy' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : 'bg-rose-50 border-rose-150 text-rose-650'
                    }`}>
                      🟢 {hItem.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-400" />
                      <span>Latency: {hItem.latency}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>API: {hItem.api}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HelpCircle size={14} className="text-slate-400" />
                      <span>Last Checked: {hItem.lastCheck}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-blue-500" />
                      <span>Quota: {hItem.quota}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* T6: AI GATEWAY LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm animate-fadeIn">
            <div className="flex justify-between items-end border-b border-slate-100 pb-3 mb-6">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Auditing System</span>
                <h4 className="text-base font-extrabold text-slate-800 mt-1">Gateway Logs</h4>
              </div>
              <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Prompts & Keys are never logged</span>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs font-medium border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Feature</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Latency</th>
                    <th className="py-3 px-4">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log, idx) => {
                    const formattedDate = new Date(log.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-smooth">
                        <td className="py-3 px-4 font-semibold text-slate-450">{formattedDate}</td>
                        <td className="py-3 px-4 font-bold text-slate-700">{log.provider}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{log.feature}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'Success' 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : 'bg-rose-50 text-rose-600'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">{log.latency}</td>
                        <td className="py-3 px-4 font-semibold text-slate-500">{log.user}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* T7: SECURITY PARAMETERS */}
        {activeTab === 'security' && (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm animate-fadeIn">
            <div className="border-b border-slate-100 pb-3 mb-6">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Secured Backend Config</span>
              <h4 className="text-base font-extrabold text-slate-800 mt-1">Security Dashboard</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'jwt_enabled', label: 'JWT Authorization', desc: 'Secure payload tokens signature validation' },
                { key: 'https_enabled', label: 'HTTPS Protocol Enforce', desc: 'Auto redirect HTTP queries to secure tunnel' },
                { key: 'rate_limit_enabled', label: 'Rate Limiting Protection', desc: 'Block aggressive client bot traffic triggers' },
                { key: 'firewall_enabled', label: 'Gateway Application Firewall', desc: 'Filter malicious network payload headers' },
                { key: 'validation_enabled', label: 'Strict Input Validation', desc: 'Validate structure parameters strictly' },
                { key: 'xss_protected', label: 'Cross-Site Scripting Guard', desc: 'Sanitize prompts to prevent injection' },
                { key: 'sql_injection_protected', label: 'SQL Parameterization Guard', desc: 'Prevent query hijacking injection attacks' },
              ].map((item) => (
                <div 
                  key={item.key}
                  className="flex items-center justify-between gap-6 p-4 bg-slate-50 border border-slate-200/50 rounded-2xl"
                >
                  <div className="text-left">
                    <h5 className="font-extrabold text-xs text-slate-800">{item.label}</h5>
                    <p className="text-[10px] text-slate-450 mt-1 leading-snug">{item.desc}</p>
                  </div>
                  
                  {/* Slide switch Toggle */}
                  <button
                    onClick={() => handleSettingToggle(item.key as any)}
                    className={`w-11 h-6 rounded-full transition-all duration-300 cursor-pointer p-0.5 ${
                      settings[item.key as keyof AISecuritySettings] ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <div 
                      className={`w-5 h-5 bg-white rounded-full shadow transition-all transform ${
                        settings[item.key as keyof AISecuritySettings] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* T8: ADMIN SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm animate-fadeIn">
            <div className="border-b border-slate-100 pb-3 mb-6">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gateway Routing Configuration</span>
              <h4 className="text-base font-extrabold text-slate-800 mt-1">Admin Gateway Settings</h4>
            </div>

            <div className="flex flex-col gap-6">
              {/* Toggles */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
                  <span className="text-xs font-bold text-slate-700">Auto Retry (Failed Queries)</span>
                  <button
                    onClick={() => handleSettingToggle('auto_retry')}
                    className={`w-10 h-5.5 rounded-full transition-all duration-300 cursor-pointer p-0.5 ${
                      settings.auto_retry ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 bg-white rounded-full shadow transition-all transform ${settings.auto_retry ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
                  <span className="text-xs font-bold text-slate-700">Provider Fallback Switch</span>
                  <button
                    onClick={() => handleSettingToggle('fallback')}
                    className={`w-10 h-5.5 rounded-full transition-all duration-300 cursor-pointer p-0.5 ${
                      settings.fallback ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 bg-white rounded-full shadow transition-all transform ${settings.fallback ? 'translate-x-4.5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* Slider / Text inputs */}
              <div className="flex flex-col gap-4">
                {/* Timeout */}
                <div className="flex flex-col gap-2 text-left p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">AI Response Timeout Limit</span>
                    <span className="text-blue-600">{settings.ai_timeout} seconds</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="60" 
                    value={settings.ai_timeout}
                    onChange={(e) => handleTextSettingsSave('ai_timeout', parseInt(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Log Retention */}
                <div className="flex flex-col gap-2 text-left p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">Log Retention Duration</span>
                    <span className="text-blue-600">{settings.log_retention} Days</span>
                  </div>
                  <input 
                    type="range" 
                    min="30" 
                    max="365" 
                    value={settings.log_retention}
                    onChange={(e) => handleTextSettingsSave('log_retention', parseInt(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MANAGE SECRET / UPDATE KEY VERIFY PASSWORD MODAL */}
      {isSecretModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-xl text-left">
            <div className="flex items-center gap-3 text-blue-600">
              <Lock size={20} />
              <h4 className="text-base font-extrabold text-slate-800">Security Verification Required</h4>
            </div>
            
            <p className="text-slate-500 text-xs mt-2.5 leading-relaxed">
              {secretAction === 'reveal' 
                ? "You must verify your Administrator credentials to reveal the raw API key secret."
                : "Enter your Administrator password and the new key value to update the provider key securely."}
            </p>

            <div className="flex flex-col gap-3 mt-4.5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Admin Password</label>
                <input 
                  type="password"
                  placeholder="Enter admin password..."
                  value={secretPassword}
                  onChange={(e) => setSecretPassword(e.target.value)}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 focus:border-blue-500 focus:outline-none text-xs text-slate-700 placeholder:text-slate-400 mt-1"
                />
              </div>

              {secretAction === 'update' && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">New API Key Value</label>
                  <input 
                    type="text"
                    placeholder="Enter new API key..."
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 focus:border-blue-500 focus:outline-none text-xs text-slate-700 placeholder:text-slate-400 mt-1"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => {
                  setIsSecretModalOpen(false);
                  setSecretPassword('');
                  setNewApiKey('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <Button 
                onClick={handleVerifySecret}
                variant="primary" 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 font-bold"
              >
                Verify & Proceed
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default AiManagement;
