import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Cpu, RefreshCw, Lock, Play, Eye, EyeOff, Key, Save, HelpCircle, 
  History, Sparkles, CheckCircle, ChevronDown, BarChart3, Clock, 
  DollarSign, Activity, FileText, Bot, Brain, LayoutList, AlertTriangle, 
  RotateCcw, Search, Filter, Shield, Info, Trash2
} from 'lucide-react';
import { aiAdminService } from '../../services/aiAdmin';
import type { AIProviderData, AIAnalyticsData } from '../../services/aiAdmin';
import { Button } from '../../components/Button';

const SUPPORTED_LIST = [
  { name: 'Gemini', slug: 'gemini', logo: '♊', models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'] },
  { name: 'OpenRouter', slug: 'openrouter', logo: '🌐', models: ['deepseek/deepseek-chat', 'meta-llama/llama-3-8b', 'qwen/qwen-2.5-72b'] },
  { name: 'Groq', slug: 'groq', logo: '⚡', models: ['llama-3.3-70b', 'mixtral-8x7b', 'gemma2-9b'] },
  { name: 'OpenAI', slug: 'openai', logo: '🤖', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] },
  { name: 'Claude', slug: 'claude', logo: '🎭', models: ['claude-3-5-sonnet', 'claude-3-haiku', 'claude-3-opus'] },
  { name: 'DeepSeek', slug: 'deepseek', logo: '🐳', models: ['deepseek-chat', 'deepseek-coder'] },
  { name: 'Mistral', slug: 'mistral', logo: '🌪️', models: ['mistral-large-latest', 'open-mixtral-8b'] }
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
  const [isSuperAdmin, setIsSuperAdmin] = useState(true);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'enabled', 'disabled', 'connected'

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

  // Toast Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Local state for inline provider configurations
  const [providerStates, setProviderStates] = useState<Record<string, {
    id?: number;
    api_key: string;
    model: string;
    is_active: boolean;
    priority: number;
    fallback_enabled: boolean;
    temperature: number;
    max_tokens: number;
    timeout: number;
    retry_attempts: number;
    rate_limit: number;
    status: string;
    latency_ms: number;
    masked_key: string;
  }>>({});

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load configuration
  const loadConfig = async () => {
    try {
      setIsLoading(true);
      
      let p: AIProviderData[] = [];
      try {
        p = await aiAdminService.getProviders();
        if (p.length > 0 && p[0].priority === undefined) {
          setIsSuperAdmin(false);
        }
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
          id: dbProv?.id,
          api_key: '',
          model: dbProv ? (dbProv.model_name || item.models[0]) : item.models[0],
          is_active: dbProv ? dbProv.is_enabled : false,
          priority: dbProv ? dbProv.priority : 5,
          fallback_enabled: dbProv ? dbProv.fallback_enabled ?? true : true,
          temperature: dbProv ? dbProv.temperature ?? 0.7 : 0.7,
          max_tokens: dbProv ? dbProv.max_tokens ?? 4096 : 4096,
          timeout: dbProv ? dbProv.timeout ?? 30 : 30,
          retry_attempts: dbProv ? dbProv.retry_attempts ?? 3 : 3,
          rate_limit: dbProv ? dbProv.rate_limit ?? 60 : 60,
          status: dbProv ? dbProv.connection_status : 'Not Configured',
          latency_ms: dbProv && (dbProv as any).latency_ms ? (dbProv as any).latency_ms : 0,
          masked_key: dbProv ? dbProv.masked_key : 'Not Configured'
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
    if (!pState) return;
    const providerId = pState.id;
    
    // If not in database yet, super_admin must save first to get an ID
    if (!providerId) {
      showToast(`Please save the configuration for ${slug} first before testing.`, 'error');
      return;
    }

    const keyToTest = pState.api_key || undefined;
    try {
      setTestingSlugs(prev => ({ ...prev, [slug]: true }));
      setTestStatuses(prev => ({ ...prev, [slug]: 'Testing...' }));
      
      const res = await aiAdminService.testProvider(providerId, keyToTest);
      
      setTestStatuses(prev => ({ ...prev, [slug]: '🟢 Connected' }));
      showToast(`Test Success! Connection to ${slug} is online.`, 'success');
      loadConfig();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || `Connection failed.`;
      setTestStatuses(prev => ({ ...prev, [slug]: errMsg }));
      showToast(`Verification Failed: ${errMsg}`, 'error');
      loadConfig();
    } finally {
      setTestingSlugs(prev => ({ ...prev, [slug]: false }));
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
      showToast(`AI Model mapping saved for ${feature}`, 'success');
      loadConfig();
    } catch (err) {
      showToast("Failed to save model mapping.", 'error');
    }
  };

  const handleSavePrompt = async () => {
    if (!selectedPromptFeature || !promptText) return;
    try {
      await aiAdminService.savePrompt({
        feature: selectedPromptFeature,
        prompt_text: promptText
      });
      showToast("System prompt template updated.", 'success');
      loadConfig();
    } catch (err) {
      showToast("Failed to save prompt template.", 'error');
    }
  };

  const handleSaveGlobalSettings = async (field: string, val: any) => {
    try {
      const updated = { ...securitySettings, [field]: val };
      await aiAdminService.saveSettings(updated);
      setSecuritySettings(updated);
      showToast("Global strategy updated.", 'success');
    } catch (err) {
      showToast("Failed to save settings.", 'error');
    }
  };

  // Filter provider list
  const filteredList = SUPPORTED_LIST.filter(item => {
    const state = providerStates[item.slug];
    if (!state) return false;
    
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          state.model.toLowerCase().includes(searchQuery.toLowerCase());
                          
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'enabled') return matchesSearch && state.is_active;
    if (statusFilter === 'disabled') return matchesSearch && !state.is_active;
    if (statusFilter === 'connected') return matchesSearch && (state.status.includes('Connected') || state.status.includes('Healthy'));
    return matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 w-full text-left bg-white text-slate-900 min-h-screen px-6 py-6 border border-slate-100 rounded-3xl shadow-sm selection:bg-emerald-500/10">
      
      {/* Toast Notification Container */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl transition-all animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
        }`}>
          {toast.type === 'success' && <CheckCircle size={16} />}
          {toast.type === 'error' && <AlertTriangle size={16} />}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">AI Configuration Console</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Configure LLM routing fallback queues and security parameters</p>
        </div>
        {!isSuperAdmin && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold">
            <Shield size={14} />
            <span>Viewer Access (Admin Mode)</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto no-scrollbar">
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
              className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold tracking-wide border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isSelected 
                  ? 'border-emerald-600 text-emerald-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-200'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-50 border border-slate-100 rounded-3xl animate-pulse" />
          <div className="h-48 bg-slate-50 border border-slate-100 rounded-3xl animate-pulse" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* TAB 1: GENERAL */}
          {currentTab === 'general' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Requests Today', value: `${analytics?.requestsToday ?? 0} calls`, desc: 'Realtime telemetry active', icon: Activity, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                  { label: 'Avg Response', value: analytics?.averageResponse ?? '0s', desc: 'Latency optimization enabled', icon: Clock, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                  { label: 'Gateway Success', value: analytics?.successRate ?? '100%', desc: 'Automatic routing enabled', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                  { label: 'Active Providers', value: `${analytics?.providersOnline ?? 0} online`, desc: 'Configured & active in DB', icon: Cpu, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
                ].map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
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

              {/* Graphic Overview Chart */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">AI Request Volume Telemetry</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Calculated across active gateway failover routes</p>
                </div>
                <div className="h-48 relative bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex flex-col justify-end">
                  <svg className="w-full h-36" viewBox="0 0 600 160">
                    <defs>
                      <linearGradient id="dashboardGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M 0 120 L 100 80 L 200 95 L 300 50 L 400 70 L 500 40 L 600 20 L 600 160 L 0 160 Z" fill="url(#dashboardGradient)" />
                    <path d="M 0 120 L 100 80 L 200 95 L 300 50 L 400 70 L 500 40 L 600 20" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
                    {[0, 100, 200, 300, 400, 500, 600].map((x, i) => (
                      <circle key={i} cx={x} cy={[120, 80, 95, 50, 70, 40, 20][i]} r="3.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2" />
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
              
              {/* Search & Filters */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search by provider or model..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-1.8 text-xs text-slate-700 font-semibold focus:outline-emerald-600"
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto justify-end">
                  <button 
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    All Providers
                  </button>
                  <button 
                    onClick={() => setStatusFilter('enabled')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'enabled' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Enabled
                  </button>
                  <button 
                    onClick={() => setStatusFilter('connected')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'connected' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Connected
                  </button>
                </div>
              </div>

              {/* Providers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredList.map((item) => {
                  const state = providerStates[item.slug];
                  if (!state) return null;
                  const isRevealed = !!revealingKeys[item.slug];
                  
                  return (
                    <div key={item.slug} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4 text-xs">
                      
                      {/* Card Header */}
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl shrink-0">
                            {item.logo}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-900">{item.name}</h3>
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block mt-0.5">
                              Status: {testStatuses[item.slug] || (state.status.includes('Connected') || state.status.includes('Healthy') ? '🟢 Connected' : '⚪ Not Configured')}
                            </span>
                          </div>
                        </div>

                        {/* Enable Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-[11px] text-slate-700">
                          <input
                            type="checkbox"
                            disabled={!isSuperAdmin}
                            checked={state.is_active}
                            onChange={(e) => setProviderStates(prev => ({
                              ...prev,
                              [item.slug]: { ...prev[item.slug], is_active: e.target.checked }
                            }))}
                            className="w-4 h-4 text-emerald-600 rounded bg-slate-50 border-slate-200 cursor-pointer disabled:opacity-50"
                          />
                          Enabled
                        </label>
                      </div>

                      {/* Fields Form */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                        
                        {/* Model Dropdown */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Default Model</label>
                          <select
                            disabled={true}
                            value={state.model}
                            onChange={() => {}}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-not-allowed font-bold text-slate-500 w-full focus:outline-none"
                          >
                            {item.models.map((mOpt) => (
                              <option key={mOpt} value={mOpt}>{mOpt}</option>
                            ))}
                          </select>
                        </div>

                        {/* Priority */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Routing Priority</label>
                          <input
                            type="number"
                            disabled={true}
                            value={state.priority}
                            onChange={() => {}}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-bold text-slate-500 w-full focus:outline-none cursor-not-allowed"
                          />
                        </div>

                        {/* Fallback Toggle */}
                        <div className="flex flex-col gap-1 justify-center sm:col-span-2">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Fallback / Failover Route</span>
                          <label className="flex items-center gap-2 cursor-not-allowed font-bold select-none text-[11px] text-slate-500 mt-1">
                            <input
                              type="checkbox"
                              disabled={true}
                              checked={state.fallback_enabled}
                              onChange={() => {}}
                              className="w-4 h-4 text-emerald-600 rounded bg-slate-50 border-slate-200 cursor-not-allowed disabled:opacity-50"
                            />
                            Failover routing fallback enabled
                          </label>
                        </div>

                        {/* Temperature */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Temperature</label>
                          <input
                            type="number"
                            step="0.1"
                            disabled={true}
                            value={state.temperature}
                            onChange={() => {}}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-bold text-slate-500 w-full focus:outline-none cursor-not-allowed"
                          />
                        </div>

                        {/* Max Tokens */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Max Tokens Limit</label>
                          <input
                            type="number"
                            disabled={true}
                            value={state.max_tokens}
                            onChange={() => {}}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-bold text-slate-500 w-full focus:outline-none cursor-not-allowed"
                          />
                        </div>

                        {/* Timeout */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Timeout (sec)</label>
                          <input
                            type="number"
                            disabled={true}
                            value={state.timeout}
                            onChange={() => {}}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-bold text-slate-500 w-full focus:outline-none cursor-not-allowed"
                          />
                        </div>

                        {/* Retry Attempts */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Retry Attempts</label>
                          <input
                            type="number"
                            disabled={true}
                            value={state.retry_attempts}
                            onChange={() => {}}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-bold text-slate-500 w-full focus:outline-none cursor-not-allowed"
                          />
                        </div>

                        {/* Rate Limit */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Rate Limit (req/min)</label>
                          <input
                            type="number"
                            disabled={true}
                            value={state.rate_limit}
                            onChange={() => {}}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-bold text-slate-500 w-full focus:outline-none cursor-not-allowed"
                          />
                        </div>

                      </div>

                      {/* Card Actions */}
                      {isSuperAdmin && (
                        <div className="flex gap-2 border-t border-slate-100 pt-4 mt-2">
                          <button
                            type="button"
                            disabled={testingSlugs[item.slug]}
                            onClick={() => handleTestConnection(item.slug)}
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white cursor-pointer text-center transition-colors"
                          >
                            {testingSlugs[item.slug] ? 'Testing Connection...' : 'Test Connection'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Global settings */}
              {securitySettings && isSuperAdmin && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-5 mt-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Global API Gateway Failover Settings</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Control strategy fallback behaviour across providers</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Automatic Failover Redundancy</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Route requests to backups if primary provider degrades</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={securitySettings.fallback}
                        onChange={(e) => handleSaveGlobalSettings('fallback', e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded bg-slate-50 border-slate-200 cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Telemetry Tracking Logs</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Track latency, failure rates, and auto-retry metrics</p>
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

          {/* TAB 3: MODELS */}
          {currentTab === 'models' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Feature Model Router</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Bind AI features in Bimba AI to specific provider LLM configurations</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[10px]">
                      <th className="py-3 px-2">Bimba AI Feature</th>
                      <th className="py-3 px-2">Target Provider</th>
                      <th className="py-3 px-2">Target Model</th>
                      <th className="py-3 px-2">Temperature</th>
                      <th className="py-3 px-2">Max Tokens</th>
                      {isSuperAdmin && <th className="py-3 px-2 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((model) => (
                      <tr key={model.feature} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3.5 px-2 font-bold text-slate-800">{model.feature}</td>
                        <td className="py-3.5 px-2 font-bold">
                          <select
                            disabled={!isSuperAdmin}
                            value={model.provider_slug}
                            onChange={(e) => {
                              const updated = models.map(m => m.feature === model.feature ? { ...m, provider_slug: e.target.value } : m);
                              setModels(updated);
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-bold text-slate-700 cursor-pointer focus:outline-emerald-600"
                          >
                            {SUPPORTED_LIST.map(p => (
                              <option key={p.slug} value={p.slug}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-2 font-bold">
                          <input
                            type="text"
                            disabled={!isSuperAdmin}
                            value={model.model_name}
                            onChange={(e) => {
                              const updated = models.map(m => m.feature === model.feature ? { ...m, model_name: e.target.value } : m);
                              setModels(updated);
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 w-36 font-semibold focus:outline-emerald-600"
                          />
                        </td>
                        <td className="py-3.5 px-2 font-bold">
                          <input
                            type="number"
                            step="0.1"
                            disabled={!isSuperAdmin}
                            value={model.temperature}
                            onChange={(e) => {
                              const updated = models.map(m => m.feature === model.feature ? { ...m, temperature: parseFloat(e.target.value) || 0.7 } : m);
                              setModels(updated);
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 w-16 focus:outline-emerald-600"
                          />
                        </td>
                        <td className="py-3.5 px-2 font-bold">
                          <input
                            type="number"
                            disabled={!isSuperAdmin}
                            value={model.max_tokens}
                            onChange={(e) => {
                              const updated = models.map(m => m.feature === model.feature ? { ...m, max_tokens: parseInt(e.target.value) || 2048 } : m);
                              setModels(updated);
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 w-20 focus:outline-emerald-600"
                          />
                        </td>
                        {isSuperAdmin && (
                          <td className="py-3.5 px-2 text-right">
                            <button
                              onClick={() => handleSaveModelMapping(model.feature, model.provider_slug, model.model_name, model.temperature, model.max_tokens)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 ml-auto cursor-pointer text-[11px]"
                            >
                              <Save size={12} />
                              Save
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PROMPTS */}
          {currentTab === 'prompts' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">System Prompts Configuration</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Control the core system instructions for different features</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-2">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Select AI Feature</span>
                  <div className="flex flex-col gap-1">
                    {prompts.map(pr => (
                      <button
                        key={pr.feature}
                        onClick={() => {
                          setSelectedPromptFeature(pr.feature);
                          setPromptText(pr.prompt_text);
                        }}
                        className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedPromptFeature === pr.feature 
                            ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600' 
                            : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-100'
                        }`}
                      >
                        {pr.feature}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">System Instruction Rules Editor</span>
                    {isSuperAdmin && (
                      <button
                        onClick={handleSavePrompt}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save size={14} />
                        Save Prompt
                      </button>
                    )}
                  </div>
                  <textarea
                    disabled={!isSuperAdmin}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    className="w-full min-h-[300px] bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-700 focus:outline-emerald-600 font-mono disabled:opacity-75"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: USAGE */}
          {currentTab === 'usage' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Today Total Tokens', value: '14,205,800', icon: Brain },
                  { label: 'Daily Cost Cap', value: '$25.00 limit', icon: DollarSign },
                  { label: 'Remaining Credits', value: 'Unlimited', icon: Shield }
                ].map((usageCard, i) => {
                  const Icon = usageCard.icon;
                  return (
                    <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                      <div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{usageCard.label}</span>
                        <h3 className="text-xl font-black text-slate-900 mt-1">{usageCard.value}</h3>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
                        <Icon size={16} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Usage chart mockup */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="font-extrabold text-sm text-slate-900 mb-4">Request Logs Overview</h3>
                <div className="h-64 flex items-end gap-3 justify-between bg-slate-50/50 rounded-2xl border border-slate-100 p-6">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                    const heightPercent = [40, 60, 45, 80, 70, 95, 30][i];
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <div 
                          style={{ height: `${heightPercent}%` }} 
                          className="w-full bg-emerald-600 rounded-t-lg hover:bg-emerald-700 transition-all cursor-pointer relative group"
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {heightPercent * 2500} tokens
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: LOGS */}
          {currentTab === 'logs' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">AI Gateway Logs Trail</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Realtime monitoring and failover metrics logs</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[10px]">
                      <th className="py-3 px-2">Timestamp</th>
                      <th className="py-3 px-2">Provider</th>
                      <th className="py-3 px-2">Gateway Route</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2">Latency</th>
                      <th className="py-3 px-2">Initiated By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 px-2 text-slate-400 font-semibold">{new Date(log.time).toLocaleString()}</td>
                        <td className="py-3 px-2 font-bold text-slate-800">{log.provider}</td>
                        <td className="py-3 px-2 text-slate-600 font-semibold">{log.feature}</td>
                        <td className="py-3 px-2 font-bold">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            log.status === 'Success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-bold text-slate-700">{log.latency}</td>
                        <td className="py-3 px-2 font-bold text-slate-500">{log.user}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                          No gateway traffic logs recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}



    </div>
  );
};
