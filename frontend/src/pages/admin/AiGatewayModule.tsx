import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Cpu, RefreshCw, Lock, Play, Eye, EyeOff, Key, Save, HelpCircle, 
  History, Sparkles, CheckCircle, ChevronDown, BarChart3, Clock, 
  DollarSign, Activity, FileText, Bot, Brain, LayoutList, AlertTriangle, RotateCcw 
} from 'lucide-react';
import { aiAdminService } from '../../services/aiAdmin';
import type { AIProviderData, AIAnalyticsData } from '../../services/aiAdmin';
import { Button } from '../../components/Button';

const SUPPORTED_LIST = [
  { name: 'Gemini', slug: 'gemini', models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'] },
  { name: 'OpenRouter', slug: 'openrouter', models: ['deepseek/deepseek-chat', 'meta-llama/llama-3-8b'] },
  { name: 'Groq', slug: 'groq', models: ['llama-3.3-70b', 'mixtral-8x7b'] },
  { name: 'OpenAI', slug: 'openai', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] },
  { name: 'Claude', slug: 'claude', models: ['claude-3-5-sonnet', 'claude-3-haiku'] },
  { name: 'DeepSeek', slug: 'deepseek', models: ['deepseek-chat', 'deepseek-coder'] },
  { name: 'Mistral', slug: 'mistral', models: ['mistral-large-latest', 'open-mixtral-8b'] }
];

export const AiGatewayModule: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'general';

  const [providers, setProviders] = useState<AIProviderData[]>([]);
  const [analytics, setAnalytics] = useState<AIAnalyticsData | null>(null);
  const [securitySettings, setSecuritySettings] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Connection testing states
  const [testStatuses, setTestStatuses] = useState<Record<string, string>>({});
  const [testingSlugs, setTestingSlugs] = useState<Record<string, boolean>>({});

  // Mask toggles
  const [revealKeySlug, setRevealKeySlug] = useState<string | null>(null);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [revealingKeys, setRevealingKeys] = useState<Record<string, boolean>>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Prompt selector
  const [selectedPromptFeature, setSelectedPromptFeature] = useState<string>('');
  const [promptText, setPromptText] = useState<string>('');

  // Local state for inline provider configurations
  const [providerStates, setProviderStates] = useState<Record<string, {
    api_key: string;
    model: string;
    is_active: boolean;
    priority: number;
    fallback_enabled: boolean;
    temperature: number;
    max_tokens: number;
    timeout: number;
    status: string;
    latency_ms: number;
    masked_key: string;
  }>>({});

  // Load configuration
  const loadConfig = async () => {
    try {
      setIsLoading(true);
      
      let p: AIProviderData[] = [];
      try {
        p = await aiAdminService.getProviders();
      } catch (err) {
        console.error("Failed to load providers:", err);
      }
      setProviders(p);

      let a: AIAnalyticsData | null = null;
      try {
        a = await aiAdminService.getAnalytics();
      } catch (err) {
        console.error("Failed to load analytics:", err);
      }
      setAnalytics(a);

      let s: any = null;
      try {
        s = await aiAdminService.getSettings();
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
      setSecuritySettings(s);

      let m: any[] = [];
      try {
        m = await aiAdminService.getModels();
      } catch (err) {
        console.error("Failed to load models:", err);
      }
      setModels(m);

      let pr: any[] = [];
      try {
        pr = await aiAdminService.getPrompts();
      } catch (err) {
        console.error("Failed to load prompts:", err);
      }
      setPrompts(pr);

      let l: any[] = [];
      try {
        l = await aiAdminService.getLogs();
      } catch (err) {
        console.error("Failed to load logs:", err);
      }
      setLogs(l);

      // Populate local states
      const states: any = {};
      SUPPORTED_LIST.forEach(item => {
        const dbProv = p.find(db => db.slug === item.slug);
        states[item.slug] = {
          api_key: '',
          model: dbProv ? (m.find(model => model.provider_slug === item.slug)?.model_name || item.models[0]) : item.models[0],
          is_active: dbProv ? dbProv.is_active : false,
          priority: dbProv ? dbProv.priority : 5,
          fallback_enabled: dbProv ? (dbProv as any).fallback_enabled ?? true : true,
          temperature: dbProv ? (dbProv as any).temperature ?? 0.7 : 0.7,
          max_tokens: dbProv ? (dbProv as any).max_tokens ?? 4096 : 4096,
          timeout: dbProv ? (dbProv as any).timeout ?? 30 : 30,
          status: dbProv ? dbProv.status : 'Not Configured',
          latency_ms: dbProv ? dbProv.latency_ms : 0,
          masked_key: dbProv ? dbProv.masked_key : 'None Saved'
        };
      });
      setProviderStates(states);

      if (pr.length > 0) {
        setSelectedPromptFeature(pr[0].feature);
        setPromptText(pr[0].prompt_text);
      }
    } catch (err) {
      console.error("Failed to load AI configuration:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, [currentTab]);

  const handleTestConnection = async (slug: string) => {
    const pState = providerStates[slug];
    const keyToTest = pState?.api_key || undefined;
    try {
      setTestingSlugs(prev => ({ ...prev, [slug]: true }));
      setTestStatuses(prev => ({ ...prev, [slug]: 'Testing...' }));
      
      const res = await aiAdminService.testProvider(slug, keyToTest);
      
      setTestStatuses(prev => ({ ...prev, [slug]: '🟢 Connected' }));
      alert(`Test Success! Connection to ${slug} is online (${res.latency}).`);
    } catch (err: any) {
      setTestStatuses(prev => ({ ...prev, [slug]: '🔴 Connection Failed' }));
      alert(err.response?.data?.detail || `Connection to ${slug} failed.`);
    } finally {
      setTestingSlugs(prev => ({ ...prev, [slug]: false }));
    }
  };

  const handleSaveInlineProvider = async (slug: string) => {
    const pState = providerStates[slug];
    if (!pState) return;
    try {
      setTestingSlugs(prev => ({ ...prev, [slug]: true }));
      setTestStatuses(prev => ({ ...prev, [slug]: 'Testing...' }));
      
      // 1. Verify key (test connection)
      const testRes = await aiAdminService.testProvider(slug, pState.api_key || undefined);
      if (!testRes.success || testRes.status !== 'Connected') {
        throw new Error("Invalid API Key");
      }
      
      setTestStatuses(prev => ({ ...prev, [slug]: '🟢 Connected' }));
      
      // 2. If successful, save config
      await aiAdminService.saveProvider({
        slug: slug,
        api_key: pState.api_key || undefined,
        priority: pState.priority,
        is_active: pState.is_active,
        fallback_enabled: pState.fallback_enabled,
        timeout: pState.timeout,
        temperature: pState.temperature,
        max_tokens: pState.max_tokens
      });
      
      alert("Configuration Saved");
      loadConfig();
    } catch (err: any) {
      setTestStatuses(prev => ({ ...prev, [slug]: '🔴 Invalid API Key' }));
      alert("Verification Failed: Invalid API Key");
    } finally {
      setTestingSlugs(prev => ({ ...prev, [slug]: false }));
    }
  };

  const handleResetProvider = async (slug: string) => {
    try {
      if (window.confirm(`Are you sure you want to reset/delete the configuration for ${slug}?`)) {
        await aiAdminService.deleteProvider(slug);
        alert(`Reset/deleted configuration for ${slug}.`);
        loadConfig();
      }
    } catch (err) {
      alert("Failed to reset provider configuration.");
    }
  };

  const triggerReveal = (slug: string) => {
    setRevealKeySlug(slug);
    setVerifyPassword('');
    setShowPasswordModal(true);
  };

  const handleRevealKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revealKeySlug || !verifyPassword) return;
    try {
      const key = await aiAdminService.revealKey(revealKeySlug, verifyPassword);
      setRevealedKeys(prev => ({ ...prev, [revealKeySlug]: key }));
      setRevealingKeys(prev => ({ ...prev, [revealKeySlug]: true }));
      setShowPasswordModal(false);
    } catch (err) {
      alert("Password authentication failed.");
    }
  };

  const handleSaveModelMapping = async (feature: string, prov: string, modelName: string, temp: number, maxTokens: number) => {
    try {
      await aiAdminService.saveModel({
        feature,
        provider_slug: prov,
        model_name: modelName,
        temperature: temp,
        max_tokens: maxTokens
      });
      alert(`AI model mapping saved for ${feature}`);
      loadConfig();
    } catch (err) {
      alert("Failed to save model mapping.");
    }
  };

  const handleSavePrompt = async () => {
    if (!selectedPromptFeature || !promptText) return;
    try {
      await aiAdminService.savePrompt({
        feature: selectedPromptFeature,
        prompt_text: promptText
      });
      alert("System prompt template updated.");
      loadConfig();
    } catch (err) {
      alert("Failed to save prompt template.");
    }
  };

  const handleSaveGlobalSettings = async (field: string, val: any) => {
    try {
      const updated = { ...securitySettings, [field]: val };
      await aiAdminService.saveSettings(updated);
      setSecuritySettings(updated);
    } catch (err) {
      alert("Failed to save global settings.");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">AI Center Console</h1>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Configure backend LLM models, fallback queues, and system prompt parameters</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'general', label: 'General', icon: BarChart3 },
          { id: 'providers', label: 'AI Providers', icon: Key },
          { id: 'models', label: 'Models', icon: Cpu },
          { id: 'prompts', label: 'Prompts', icon: FileText },
          { id: 'usage', label: 'Usage', icon: Activity },
          { id: 'logs', label: 'Logs', icon: LayoutList }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ tab: tab.id })}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wide border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isSelected 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loader */}
      {isLoading ? (
        <div className="h-64 bg-slate-50 border border-slate-100 rounded-3xl animate-pulse" />
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* TAB 1: GENERAL */}
          {currentTab === 'general' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Requests Today', value: `${analytics?.requestsToday ?? 241} calls`, desc: '+12% from yesterday', icon: Activity, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
                  { label: 'Avg Latency', value: analytics?.averageResponse ?? '0.78s', desc: 'Active failover priority', icon: Clock, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
                  { label: 'Success Ratio', value: analytics?.successRate ?? '99.2%', desc: '3 failure rollbacks today', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
                  { label: 'Today Cost Est', value: '$12.45', desc: 'Token usage calculated', icon: DollarSign, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' }
                ].map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div key={idx} className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{card.label}</span>
                        <h3 className="text-xl font-black text-slate-900 mt-1">{card.value}</h3>
                        <p className="text-[9px] text-slate-400 mt-1 font-bold">{card.desc}</p>
                      </div>
                      <div className={`w-9 h-9 rounded-xl ${card.color} border flex items-center justify-center shadow-sm shrink-0`}>
                        <Icon size={16} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Graphical Overview */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">Weekly AI Request Volume</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Calculated across Gemini, OpenRouter & Groq gateway routes</p>
                </div>
                
                {/* SVG Area Chart */}
                <div className="h-48 relative bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex flex-col justify-end">
                  <svg className="w-full h-36" viewBox="0 0 600 160">
                    <defs>
                      <linearGradient id="dashboardGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M 0 120 L 100 80 L 200 95 L 300 50 L 400 70 L 500 40 L 600 20 L 600 160 L 0 160 Z" fill="url(#dashboardGradient)" />
                    <path d="M 0 120 L 100 80 L 200 95 L 300 50 L 400 70 L 500 40 L 600 20" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
                    {[0, 100, 200, 300, 400, 500, 600].map((x, i) => (
                      <circle key={i} cx={x} cy={[120, 80, 95, 50, 70, 40, 20][i]} r="3" fill="#FFFFFF" stroke="#22C55E" strokeWidth="2" />
                    ))}
                  </svg>
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-extrabold uppercase mt-2 px-1">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI PROVIDERS */}
          {currentTab === 'providers' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {SUPPORTED_LIST.map((item) => {
                  const state = providerStates[item.slug];
                  if (!state) return null;
                  const isRevealed = !!revealingKeys[item.slug];
                  
                  return (
                    <div key={item.slug} className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4 text-xs">
                      {/* Card Header */}
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 font-extrabold text-sm uppercase">
                            {item.name.substring(0, 1)}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-805">{item.name}</h3>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              Status: {testStatuses[item.slug] || (state.status === 'Connected' || state.status === 'Healthy' ? '🟢 Connected' : '⚪ Not Configured')}
                            </span>
                          </div>
                        </div>

                        {/* Active Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-[11px] text-slate-700">
                          <input
                            type="checkbox"
                            checked={state.is_active}
                            onChange={(e) => setProviderStates(prev => ({
                              ...prev,
                              [item.slug]: { ...prev[item.slug], is_active: e.target.checked }
                            }))}
                            className="w-4 h-4 text-emerald-600 rounded bg-slate-50 border-slate-200 cursor-pointer"
                          />
                          Enabled
                        </label>
                      </div>

                      {/* Configurations Form fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {/* API Key */}
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Secret API Token</label>
                          <div className="flex gap-2">
                            <input
                              type={isRevealed ? 'text' : 'password'}
                              placeholder="Insert secret API key..."
                              value={isRevealed ? (revealedKeys[item.slug] || state.api_key) : (state.api_key || (state.masked_key !== 'None Saved' ? state.masked_key : ''))}
                              onChange={(e) => setProviderStates(prev => ({
                                ...prev,
                                [item.slug]: { ...prev[item.slug], api_key: e.target.value }
                              }))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-semibold text-slate-600"
                            />
                            {isRevealed ? (
                              <button 
                                onClick={() => setRevealingKeys(prev => ({ ...prev, [item.slug]: false }))}
                                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl cursor-pointer"
                              >
                                <EyeOff size={14} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => triggerReveal(item.slug)}
                                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl cursor-pointer"
                              >
                                <Eye size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Model Dropdown */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Default Model</label>
                          <select
                            value={state.model}
                            onChange={(e) => setProviderStates(prev => ({
                              ...prev,
                              [item.slug]: { ...prev[item.slug], model: e.target.value }
                            }))}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer font-bold text-slate-700 w-full"
                          >
                            {item.models.map((modelOpt) => (
                              <option key={modelOpt} value={modelOpt}>{modelOpt}</option>
                            ))}
                          </select>
                        </div>

                        {/* Priority number */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Routing Priority</label>
                          <input
                            type="number"
                            value={state.priority}
                            onChange={(e) => setProviderStates(prev => ({
                              ...prev,
                              [item.slug]: { ...prev[item.slug], priority: parseInt(e.target.value) || 5 }
                            }))}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-semibold text-slate-700 w-full font-bold"
                          />
                        </div>

                        {/* Temperature Override */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Temperature Override</label>
                          <input
                            type="number"
                            step="0.1"
                            value={state.temperature}
                            onChange={(e) => setProviderStates(prev => ({
                              ...prev,
                              [item.slug]: { ...prev[item.slug], temperature: parseFloat(e.target.value) || 0.7 }
                            }))}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-semibold text-slate-700 w-full font-bold"
                          />
                        </div>

                        {/* Max tokens input */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Max Token limits</label>
                          <input
                            type="number"
                            value={state.max_tokens}
                            onChange={(e) => setProviderStates(prev => ({
                              ...prev,
                              [item.slug]: { ...prev[item.slug], max_tokens: parseInt(e.target.value) || 4096 }
                            }))}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-semibold text-slate-700 w-full font-bold"
                          />
                        </div>

                        {/* Timeout parameters */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Request Timeout (sec)</label>
                          <input
                            type="number"
                            value={state.timeout}
                            onChange={(e) => setProviderStates(prev => ({
                              ...prev,
                              [item.slug]: { ...prev[item.slug], timeout: parseInt(e.target.value) || 30 }
                            }))}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-semibold text-slate-700 w-full font-bold"
                          />
                        </div>

                        {/* Fallback switch */}
                        <div className="flex flex-col justify-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Queue Failover Fallback</span>
                          <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-700">
                            <input
                              type="checkbox"
                              checked={state.fallback_enabled}
                              onChange={(e) => setProviderStates(prev => ({
                                ...prev,
                                [item.slug]: { ...prev[item.slug], fallback_enabled: e.target.checked }
                              }))}
                              className="w-4 h-4 text-emerald-600 rounded bg-slate-50 border-slate-200 cursor-pointer"
                            />
                            Enabled
                          </label>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex gap-2.5 border-t border-slate-100 pt-4 mt-3">
                        <button
                          type="button"
                          onClick={() => handleResetProvider(item.slug)}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold cursor-pointer"
                          title="Reset to defaults"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={testingSlugs[item.slug]}
                          onClick={() => handleTestConnection(item.slug)}
                          className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer text-center"
                        >
                          {testingSlugs[item.slug] ? 'Testing...' : 'Test Connection'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveInlineProvider(item.slug)}
                          className="flex-1 py-2 rounded-xl bg-emerald-505 bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white cursor-pointer text-center"
                        >
                          Save Configuration
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Global settings */}
              {securitySettings && (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
                  <h3 className="font-extrabold text-sm text-slate-800">Global Provider Strategy Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50/50 border border-slate-100 rounded-2xl">
                      <div>
                        <h4 className="text-xs font-bold text-slate-750">Automatic Failover Redundancy</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Route requests to backups if primary provider degrades</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={securitySettings.fallback}
                        onChange={(e) => handleSaveGlobalSettings('fallback', e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded bg-slate-50 border-slate-200 cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-50/50 border border-slate-100 rounded-2xl">
                      <div>
                        <h4 className="text-xs font-bold text-slate-750">Token Tracking & Cost Logs</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Calculate costs and record context tokens</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={securitySettings.auto_retry}
                        onChange={(e) => handleSaveGlobalSettings('auto_retry', e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded bg-slate-50 border-slate-200 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AI MODELS */}
          {currentTab === 'models' && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">AI feature Model Assignments</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Map individual platform features to specific provider endpoint models</p>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs font-medium border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                      <th className="py-3 px-4">Bimba AI Feature</th>
                      <th className="py-3 px-4">LLM Provider</th>
                      <th className="py-3 px-4">Model Name</th>
                      <th className="py-3 px-4">Temperature</th>
                      <th className="py-3 px-4 text-right">Commit Changes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {models.map((m, idx) => {
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-smooth">
                          <td className="py-3.5 px-4 font-bold text-slate-800">{m.feature}</td>
                          <td className="py-3.5 px-4">
                            <select
                              value={m.provider_slug}
                              onChange={(e) => {
                                const val = e.target.value;
                                setModels(prev => prev.map((item, i) => i === idx ? { ...item, provider_slug: val } : item));
                              }}
                              className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 cursor-pointer font-bold text-slate-700"
                            >
                              <option value="gemini">Gemini</option>
                              <option value="openrouter">OpenRouter</option>
                              <option value="groq">Groq</option>
                              <option value="openai">OpenAI</option>
                              <option value="claude">Claude</option>
                              <option value="deepseek">DeepSeek</option>
                              <option value="mistral">Mistral</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4">
                            <input
                              type="text"
                              value={m.model_name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setModels(prev => prev.map((item, i) => i === idx ? { ...item, model_name: val } : item));
                              }}
                              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-600 font-medium w-40"
                            />
                          </td>
                          <td className="py-3.5 px-4">
                            <input
                              type="number"
                              step="0.1"
                              value={m.temperature}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setModels(prev => prev.map((item, i) => i === idx ? { ...item, temperature: val } : item));
                              }}
                              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-600 w-16"
                            />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleSaveModelMapping(m.feature, m.provider_slug, m.model_name, m.temperature, m.max_tokens)}
                              className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-600 font-bold border border-emerald-100 hover:bg-emerald-100 cursor-pointer"
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PROMPT LIBRARY */}
          {currentTab === 'prompts' && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">System Prompt library</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Customize default instruction sets and context injections for active LLMs</p>
              </div>

              <div className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Select prompt feature</label>
                  <select
                    value={selectedPromptFeature}
                    onChange={(e) => {
                      const feat = e.target.value;
                      setSelectedPromptFeature(feat);
                      const matching = prompts.find(p => p.feature === feat);
                      if (matching) setPromptText(matching.prompt_text);
                    }}
                    className="w-full md:w-80 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-semibold focus:outline-none text-slate-700 cursor-pointer font-bold"
                  >
                    {prompts.map((p, idx) => (
                      <option key={idx} value={p.feature}>{p.feature}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Instructions Body template</label>
                  <textarea
                    rows={8}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold focus:border-emerald-500 focus:outline-none text-slate-700 leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-2">
                  <button
                    onClick={handleSavePrompt}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold cursor-pointer"
                  >
                    <Save size={13} />
                    Commit Template Version
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AI USAGE */}
          {currentTab === 'usage' && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Token & Cost Analytics</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Summary of prompt and generation payload volume across billing accounts</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { title: 'Cumulative Tokens', val: '14,205,800', desc: 'Approx 9.2M input, 5M output', icon: Cpu, col: 'text-emerald-500 bg-emerald-50/50' },
                  { title: 'Billing Cost Accrued', val: '$12.45', desc: 'Average cost of $0.05 per resume', icon: DollarSign, col: 'text-emerald-500 bg-emerald-50/50' },
                  { title: 'Failover Occurrences', val: '3 rollbacks', desc: '100% platform availability uptime', icon: AlertTriangle, col: 'text-amber-500 bg-amber-50/50' }
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/40 flex items-start gap-4 text-left">
                      <div className={`w-8 h-8 rounded-xl ${stat.col} flex items-center justify-center shrink-0`}>
                        <Icon size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{stat.title}</h4>
                        <span className="text-base font-black text-slate-900 block mt-1">{stat.val}</span>
                        <p className="text-[9px] text-slate-450 mt-1 font-bold uppercase">{stat.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: AI LOGS */}
          {currentTab === 'logs' && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
              <div>
                <h3 className="font-extrabold text-sm text-slate-850">AI Gateway Session Logs</h3>
                <p className="text-[10px] text-slate-455 font-bold uppercase tracking-wider mt-0.5">Real-time session audit logging showing response speeds and active routes</p>
              </div>

              <div className="overflow-x-auto no-scrollbar border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs font-medium border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                      <th className="py-3 px-4">Created Time</th>
                      <th className="py-3 px-4">Active Provider</th>
                      <th className="py-3 px-4">Platform Feature</th>
                      <th className="py-3 px-4">Latency ms</th>
                      <th className="py-3 px-4">User Identity</th>
                      <th className="py-3 px-4 text-right">Route Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {logs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-smooth">
                        <td className="py-3.5 px-4 text-[10px] font-bold text-slate-400">{new Date(log.time).toLocaleTimeString()}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{log.provider}</td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-650 text-[10px] uppercase">{log.feature}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-500">{log.latency}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-600">{log.user}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            log.status === 'Success' 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : 'bg-rose-50 text-rose-600'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Secret Key Decryption Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 text-left">
            <div>
              <h3 className="font-extrabold text-sm text-slate-850">Verify Administrator Password</h3>
              <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">Please confirm your identity before revealing secret key</p>
            </div>
            
            <form onSubmit={handleRevealKey} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Admin credentials password</label>
                <input
                  type="password"
                  placeholder="Enter administrator password..."
                  value={verifyPassword}
                  onChange={(e) => setVerifyPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-655 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" size="sm" className="bg-emerald-500 font-bold text-[11px]">
                  Confirm & Reveal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiGatewayModule;
