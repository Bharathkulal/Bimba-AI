import { apiClient } from './api';

export interface AIProviderData {
  id?: number;
  provider_name: string;
  slug: string;
  masked_key: string;
  model_name: string;
  priority: number;
  temperature: number;
  top_p: number;
  max_tokens: number;
  timeout: number;
  retry_attempts: number;
  rate_limit: number;
  fallback_enabled: boolean;
  is_enabled: boolean;
  connection_status: string;
  last_tested_at?: string;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface AIAnalyticsData {
  providersOnline: number;
  requestsToday: number;
  averageResponse: string;
  successRate: string;
  fallbackUsed: number;
  activeProvider: string;
  usage: Record<string, number>;
  features: Record<string, number>;
}

export interface AIGatewayLogItem {
  time: string;
  provider: string;
  feature: string;
  status: string;
  latency: string;
  user: string;
}

export interface AIHealthItem {
  provider: string;
  slug: string;
  status: string;
  latency: string;
  api: string;
  lastCheck: string;
  quota: string;
}

export interface AISecuritySettings {
  auto_retry: boolean;
  fallback: boolean;
  ai_timeout: number;
  request_limit: number;
  log_retention: number;
  debug: boolean;
  
  jwt_enabled: boolean;
  https_enabled: boolean;
  rate_limit_enabled: boolean;
  firewall_enabled: boolean;
  validation_enabled: boolean;
  xss_protected: boolean;
  sql_injection_protected: boolean;
}

export const aiAdminService = {
  getProviders: async (): Promise<AIProviderData[]> => {
    const res = await apiClient.get<AIProviderData[]>('/api/admin/ai/providers');
    return res.data;
  },

  saveProvider: async (provider: Partial<AIProviderData>): Promise<void> => {
    await apiClient.post('/api/admin/ai/providers', provider);
  },

  updateProvider: async (id: number, provider: Partial<AIProviderData>): Promise<void> => {
    await apiClient.put(`/api/admin/ai/providers/${id}`, provider);
  },

  revealKey: async (slug: string, adminPassword: string): Promise<string> => {
    const res = await apiClient.post<{ api_key: string }>('/api/admin/ai/provider/reveal', { slug, password: adminPassword });
    return res.data.api_key;
  },

  testProvider: async (id: number, api_key?: string): Promise<{ success: boolean; status: string }> => {
    const res = await apiClient.post<{ success: boolean; status: string }>(`/api/admin/ai/providers/${id}/test`, { api_key });
    return res.data;
  },

  deleteProvider: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/ai/providers/${id}`);
  },

  getAnalytics: async (): Promise<AIAnalyticsData> => {
    const res = await apiClient.get<AIAnalyticsData>('/api/admin/ai/analytics');
    return res.data;
  },

  getLogs: async (): Promise<AIGatewayLogItem[]> => {
    const res = await apiClient.get<AIGatewayLogItem[]>('/api/admin/ai/logs');
    return res.data;
  },

  getHealth: async (): Promise<AIHealthItem[]> => {
    const res = await apiClient.get<AIHealthItem[]>('/api/admin/ai/health');
    return res.data;
  },

  savePriority: async (priorityOrder: string[]): Promise<void> => {
    await apiClient.put('/api/admin/ai/priority', { priority_order: priorityOrder });
  },

  getSettings: async (): Promise<AISecuritySettings> => {
    const res = await apiClient.get<AISecuritySettings>('/api/admin/ai/settings');
    return res.data;
  },

  saveSettings: async (settings: Partial<AISecuritySettings>): Promise<void> => {
    await apiClient.post('/api/admin/ai/security', settings);
  },

  getModels: async (): Promise<any[]> => {
    const res = await apiClient.get<any[]>('/api/admin/ai/models');
    return res.data;
  },

  saveModel: async (model: { feature: string; provider_slug: string; model_name: string; temperature: number; max_tokens: number }): Promise<void> => {
    await apiClient.put('/api/admin/ai/models', model);
  },

  getPrompts: async (): Promise<any[]> => {
    const res = await apiClient.get<any[]>('/api/admin/ai/prompts');
    return res.data;
  },

  savePrompt: async (prompt: { feature: string; prompt_text: string }): Promise<void> => {
    await apiClient.put('/api/admin/ai/prompts', prompt);
  },

  getUsageStats: async (): Promise<any> => {
    const res = await apiClient.get<any>('/api/admin/ai/usage');
    return res.data;
  }
};
