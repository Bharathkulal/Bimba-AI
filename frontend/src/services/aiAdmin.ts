import { apiClient } from './api';

export interface AIProviderData {
  name: string;
  slug: string;
  masked_key: string;
  priority: number;
  is_active: boolean;
  status: string;
  today_requests: number;
  latency_ms: number;
  success_rate: number;
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

  createProvider: async (provider: { name: string; slug: string; api_key: string; priority: number }): Promise<void> => {
    await apiClient.post('/api/admin/ai/provider', provider);
  },

  updateProvider: async (provider: { slug: string; api_key?: string; is_active?: boolean; priority?: number }): Promise<void> => {
    await apiClient.put('/api/admin/ai/provider/update', provider);
  },

  revealKey: async (slug: string, adminPassword: string): Promise<string> => {
    const res = await apiClient.post<{ api_key: string }>('/api/admin/ai/provider/reveal', { slug, password: adminPassword });
    return res.data.api_key;
  },

  testProvider: async (slug: string): Promise<{ success: boolean; status: string; latency: string; quota: string }> => {
    const res = await apiClient.post('/api/admin/ai/test', { slug });
    return res.data;
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
  }
};
