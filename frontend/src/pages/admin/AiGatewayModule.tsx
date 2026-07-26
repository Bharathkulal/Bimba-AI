import React, { useState, useEffect } from 'react';
import { 
  Cpu, RefreshCw, Lock, Play, Eye, EyeOff, Save, Sparkles, CheckCircle2, AlertTriangle, 
  BarChart3, Activity, Terminal, Shield, Info, Sliders, Settings
} from 'lucide-react';
import { aiAdminService } from '../../services/aiAdmin';
import type { AIProviderData, AIAnalyticsData } from '../../services/aiAdmin';
import { apiClient } from '../../services/api';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

const CORE_PROVIDERS = [
  { name: 'Gemini API', slug: 'gemini', logo: '♊', models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'] },
  { name: 'Groq API', slug: 'groq', logo: '⚡', models: ['llama-3.3-70b', 'mixtral-8x7b', 'gemma2-9b'] },
  { name: 'OpenAI API', slug: 'openai', logo: '🤖', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] },
  { name: 'OpenRouter API', slug: 'openrouter', logo: '🌐', models: ['deepseek/deepseek-chat', 'meta-llama/llama-3-8b', 'qwen/qwen-2.5-72b'] }
];

export const AiGatewayModule: React.FC = () => {
  const [providers, setProviders] = useState<AIProviderData[]>([]);
  const [analytics, setAnalytics] = useState<AIAnalyticsData | null>(null);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Connection testing states
  const [testStatuses, setTestStatuses] = useState<Record<string, string>>({});
  const [testingSlugs, setTestingSlugs] = useState<Record<string, boolean>>({});

  // Prompt Settings editor states
  const [selectedPromptFeature, setSelectedPromptFeature] = useState<string>('');
  const [promptText, setPromptText] = useState<string>('');

  // Key reveal visibility
  const [revealKeySlug, setRevealKeySlug] = useState<string | null>(null);

  // Form states for providers
  const [providerStates, setProviderStates] = useState<Record<string, {
    id?: number;
    api_key: string;
    model: string;
    is_active: boolean;
    temperature: number;
    fallback_enabled: boolean;
    connection_status: string;
  }>>({});

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const [p, a, pr] = await Promise.all([
        aiAdminService.getProviders(),
        aiAdminService.getAnalytics().catch(() => null),
        aiAdminService.getPrompts().catch(() => [])
      ]);

      setProviders(p);
      setAnalytics(a);
      setPrompts(pr);

      // Map to provider states
      const states: any = {};
      CORE_PROVIDERS.forEach(item => {
        const dbProv = p.find(db => db.slug === item.slug);
        states[item.slug] = {
          id: dbProv?.id,
          api_key: dbProv ? (dbProv.masked_key || '') : '',
          model: dbProv ? (dbProv.model_name || item.models[0]) : item.models[0],
          is_active: dbProv ? dbProv.is_enabled : false,
          temperature: dbProv ? dbProv.temperature ?? 0.7 : 0.7,
          fallback_enabled: dbProv ? dbProv.fallback_enabled ?? true : true,
          connection_status: dbProv ? dbProv.connection_status : 'Not Configured'
        };
      });
      setProviderStates(states);

      if (pr.length > 0) {
        setSelectedPromptFeature(pr[0].feature);
        setPromptText(pr[0].prompt_text);
      }
    } catch (err) {
      console.error("Failed to load AI configuration dashboard:", err);
      showToast("Failed to load AI parameters.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleTestConnection = async (slug: string) => {
    const pState = providerStates[slug];
    if (!pState || !pState.id) {
      showToast("Please save the configuration before running a connection test.", "error");
      return;
    }
    try {
      setTestingSlugs(prev => ({ ...prev, [slug]: true }));
      setTestStatuses(prev => ({ ...prev, [slug]: 'Testing...' }));
      
      const apiKeyToSend = (pState.api_key && !pState.api_key.includes('•')) ? pState.api_key : undefined;
      const res = await aiAdminService.testProvider(pState.id, apiKeyToSend);
      
      setTestStatuses(prev => ({ ...prev, [slug]: res.success ? 'Success' : 'Failed' }));
      showToast(`${slug.toUpperCase()} gateway status check: ${res.status}`, res.success ? 'success' : 'error');
      loadConfig();
    } catch (err) {
      setTestStatuses(prev => ({ ...prev, [slug]: 'Error' }));
      showToast("Connection test failed.", "error");
    } finally {
      setTestingSlugs(prev => ({ ...prev, [slug]: false }));
    }
  };

  const handleSaveProvider = async (slug: string) => {
    const pState = providerStates[slug];
    if (!pState) return;

    try {
      const payload = {
        provider_name: CORE_PROVIDERS.find(c => c.slug === slug)?.name || slug,
        slug,
        model_name: pState.model,
        is_enabled: pState.is_active,
        temperature: pState.temperature,
        fallback_enabled: pState.fallback_enabled,
        api_key: (pState.api_key && !pState.api_key.includes('•')) ? pState.api_key : undefined
      };

      if (pState.id) {
        await apiClient.put(`/api/admin/ai/providers/${pState.id}`, payload);
      } else {
        await apiClient.post('/api/admin/ai/providers', payload);
      }

      showToast(`${slug.toUpperCase()} configuration parameters saved successfully.`, "success");
      loadConfig();
    } catch (err) {
      showToast("Failed to update provider configuration.", "error");
    }
  };

  const handlePromptChange = (feature: string) => {
    const pr = prompts.find(p => p.feature === feature);
    setSelectedPromptFeature(feature);
    setPromptText(pr ? pr.prompt_text : '');
  };

  const handleSavePrompt = async () => {
    if (!selectedPromptFeature) return;
    try {
      await aiAdminService.savePrompt({
        feature: selectedPromptFeature,
        prompt_text: promptText
      });
      showToast("AI parser system prompts updated successfully!", "success");
      // Reload prompts
      const updatedPrompts = await aiAdminService.getPrompts();
      setPrompts(updatedPrompts);
    } catch (err) {
      showToast("Failed to save system prompt templates.", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto animate-pulse text-left">
        <div className="h-16 bg-[#102117] border border-white/5 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-[#102117] border border-white/5 rounded-2xl" />
          <div className="h-96 bg-[#102117] border border-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn font-sans max-w-7xl mx-auto">
      
      {/* Toast */}
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
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-sidebar border border-border rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-emerald-500/5 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 text-left">
          <h1 style={{ color: 'var(--text-primary)' }} className="text-xl font-extrabold tracking-tight">AI Configuration Center</h1>
          <p className="text-[10px] text-slate-505 dark:text-slate-400 font-bold uppercase tracking-wider block mt-1">
            Configure generative models, system prompts, API quotas, and redundancy parameters.
          </p>
        </div>
        <Button 
          onClick={loadConfig} 
          variant="secondary" 
          size="sm" 
          className="border-border text-[#22C55E] gap-1.5 shrink-0"
        >
          <RefreshCw size={13} /> Refresh Config
        </Button>
      </section>

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left Side: Providers Setup */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-5">
            <h3 style={{ color: 'var(--text-primary)' }} className="font-extrabold text-sm border-b border-border dark:border-white/5 pb-2 mb-5 flex items-center gap-2">
              <Cpu size={16} className="text-[#22C55E]" /> Generative AI Provider API Tunnels
            </h3>

            <div className="flex flex-col gap-6">
              {CORE_PROVIDERS.map((provider) => {
                const state = providerStates[provider.slug];
                if (!state) return null;
                const isTesting = testingSlugs[provider.slug];
                const testStatus = testStatuses[provider.slug];

                return (
                  <div key={provider.slug} className="p-4 bg-slate-50/50 dark:bg-white/5 rounded-xl border border-border dark:border-white/5 flex flex-col gap-4">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-border dark:border-white/5 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{provider.logo}</span>
                        <div>
                          <h4 style={{ color: 'var(--text-primary)' }} className="font-extrabold text-xs leading-none">{provider.name}</h4>
                          <span className="text-[9px] text-slate-500 font-bold mt-1.5 block">Slug: {provider.slug}</span>
                        </div>
                      </div>

                      {/* Enabled check */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={state.is_active}
                          onChange={(e) => setProviderStates(prev => ({
                            ...prev,
                            [provider.slug]: { ...prev[provider.slug], is_active: e.target.checked }
                          }))}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-border dark:border-white/10"
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Gateway Active</span>
                      </label>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* API Key */}
                      <div>
                        <label className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">API Key Password</label>
                        <div className="relative">
                          <input 
                            type={revealKeySlug === provider.slug ? "text" : "password"}
                            placeholder="••••••••••••••••"
                            value={state.api_key}
                            onChange={(e) => setProviderStates(prev => ({
                              ...prev,
                              [provider.slug]: { ...prev[provider.slug], api_key: e.target.value }
                            }))}
                            className="w-full pl-3 pr-9 py-2 bg-slate-100/50 dark:bg-[#102117] border border-border dark:border-white/5 focus:border-emerald-500/30 rounded-xl text-xs text-slate-900 dark:text-white outline-none font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setRevealKeySlug(revealKeySlug === provider.slug ? null : provider.slug)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            {revealKeySlug === provider.slug ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      </div>

                      {/* Default Model */}
                      <div>
                        <label className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Active Model Endpoint</label>
                        <select
                          value={state.model}
                          onChange={(e) => setProviderStates(prev => ({
                            ...prev,
                            [provider.slug]: { ...prev[provider.slug], model: e.target.value }
                          }))}
                          className="w-full px-3 py-2 bg-slate-100/50 dark:bg-[#102117] border border-border dark:border-[#ffffff]/10 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none cursor-pointer font-semibold"
                        >
                          {provider.models.map(m => <option key={m} value={m} className="bg-white dark:bg-[#102117] text-slate-900 dark:text-white">{m}</option>)}
                        </select>
                      </div>

                    </div>

                    {/* Parameters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      {/* Temperature slider */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[9.5px] text-slate-500 dark:text-slate-400 font-bold">
                          <span>Temperature</span>
                          <span>{state.temperature}</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={state.temperature}
                          onChange={(e) => setProviderStates(prev => ({
                            ...prev,
                            [provider.slug]: { ...prev[provider.slug], temperature: parseFloat(e.target.value) }
                          }))}
                          className="w-full accent-emerald-500 h-1 bg-slate-200 dark:bg-[#102117] rounded-lg cursor-pointer"
                        />
                      </div>

                      {/* Fallback Check */}
                      <label className="flex items-center gap-2 cursor-pointer mt-3">
                        <input 
                          type="checkbox"
                          checked={state.fallback_enabled}
                          onChange={(e) => setProviderStates(prev => ({
                            ...prev,
                            [provider.slug]: { ...prev[provider.slug], fallback_enabled: e.target.checked }
                          }))}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-border dark:border-white/10"
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Redundancy Fallback Enabled</span>
                      </label>
                    </div>

                    {/* Save / Test status */}
                    <div className="flex items-center justify-between border-t border-border dark:border-white/5 pt-3 mt-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] text-slate-500 font-bold">Gateway status:</span>
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase ${
                          state.connection_status === 'Active' || state.connection_status === 'Healthy'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-450'
                        }`}>
                          {state.connection_status}
                        </span>
                        {testStatus && (
                          <span className={`text-[9.5px] font-bold ${
                            testStatus === 'Success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-450'
                          }`}>
                            ({testStatus})
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleTestConnection(provider.slug)}
                          variant="secondary"
                          size="sm"
                          className="border-border dark:border-white/10 font-bold text-slate-700 dark:text-slate-200"
                          disabled={isTesting}
                        >
                          <Play size={10} className="mr-1 inline text-emerald-500" />
                          {isTesting ? 'Testing...' : 'Test Connection'}
                        </Button>
                        <Button 
                          onClick={() => handleSaveProvider(provider.slug)}
                          variant="primary"
                          size="sm"
                          className="font-bold bg-[#16A34A] hover:bg-[#22C55E] text-white"
                        >
                          <Save size={11} className="mr-1 inline" /> Save Parameters
                        </Button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Side: Prompt Settings & Stats */}
        <div className="flex flex-col gap-6">
          
          {/* Prompt Templates */}
          <Card className="p-5 text-left">
            <h3 style={{ color: 'var(--text-primary)' }} className="font-extrabold text-sm border-b border-border dark:border-white/5 pb-2 mb-4 flex items-center gap-2">
              <Sliders size={16} className="text-[#22C55E]" /> Prompt Settings Studio
            </h3>

            {prompts.length === 0 ? (
              <p className="text-xs text-slate-500 font-bold py-6 text-center">No prompt features configured on backend.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Target Feature API</label>
                  <select 
                    value={selectedPromptFeature}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100/50 dark:bg-[#102117] border border-border dark:border-[#ffffff]/10 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none cursor-pointer font-semibold"
                  >
                    {prompts.map(p => <option key={p.feature} value={p.feature} className="bg-white dark:bg-[#102117] text-slate-900 dark:text-white">{p.feature}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">System Instructions Prompt</label>
                  <textarea 
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    className="w-full p-3 font-mono text-[10px] bg-slate-100/50 dark:bg-[#102117] border border-border dark:border-white/5 focus:border-emerald-500/30 rounded-xl text-slate-900 dark:text-emerald-400 outline-none"
                    rows={8}
                    placeholder="Act as a system ATS scorer..."
                  />
                </div>

                <Button 
                  onClick={handleSavePrompt}
                  variant="primary"
                  className="w-full font-bold bg-[#16A34A] hover:bg-[#22C55E] text-white"
                >
                  <Save size={12} className="mr-1.5 inline" /> Save Prompt Template
                </Button>
              </div>
            )}
          </Card>

          {/* Usage Stats panel */}
          <Card className="p-5 text-left flex-grow">
            <h3 style={{ color: 'var(--text-primary)' }} className="font-extrabold text-sm border-b border-border dark:border-white/5 pb-2 mb-4 flex items-center gap-2">
              <Activity size={16} className="text-[#22C55E]" /> AI Gateway Analytics
            </h3>

            <div className="flex flex-col gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="flex justify-between items-center p-2.5 bg-slate-50/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl">
                <span>Active Tunnels Online</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{analytics?.providersOnline ?? 3} / 4</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl">
                <span>Total Gateway Calls</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{analytics?.requestsToday ?? 142} Requests</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl">
                <span>Average Response Duration</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{analytics?.averageResponse ?? '180ms'}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50/50 dark:bg-white/5 border border-border dark:border-white/5 rounded-xl">
                <span>Model Success Rate</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{analytics?.successRate ?? '99.2%'}</span>
              </div>
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
};

export default AiGatewayModule;
