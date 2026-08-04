import { apiClient } from './api';

export interface TemplateColors {
  primary: string;
  secondary: string;
}

export interface TemplateFont {
  family: string;
  heading: number;
  body: number;
}

export interface TemplateLayout {
  columns: number;
  header: string;
  spacing: number;
  margin: number;
}

export interface ResumeTemplate {
  id?: string;
  templateId: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  previewImage: string;
  thumbnail: string;
  coverImage: string;
  atsFriendly: boolean;
  atsScore: number;
  featured: boolean;
  premium: boolean;
  recommendedFor: string[];
  industry: string[];
  colors: TemplateColors;
  font: TemplateFont;
  layout: TemplateLayout;
  sections: string[];
  renderer: string;
  enabled: boolean;
  displayOrder: number;
  usageCount?: number;
  downloadCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateAnalytics {
  totalTemplates: number;
  enabled: number;
  disabled: number;
  featured: number;
  premium: number;
  averageAtsScore: number;
  downloads: number;
  pdfGenerations: number;
  averageSelectionTime: number;
  mostUsed: ResumeTemplate[];
  leastUsed: ResumeTemplate[];
  categoryPopularity: Record<string, number>;
  recentUpdates: ResumeTemplate[];
  storageUsage: string;
}

export const templateService = {
  getTemplates: async (params?: { category?: string; enabled?: boolean; premium?: boolean; q?: string }) => {
    const res = await apiClient.get<ResumeTemplate[]>('/api/templates', { params });
    return res.data;
  },

  getTemplateById: async (id: string) => {
    const res = await apiClient.get<ResumeTemplate>(`/api/templates/${id}`);
    return res.data;
  },

  getCategories: async () => {
    const res = await apiClient.get<string[]>('/api/templates/categories');
    return res.data;
  },

  getFeatured: async () => {
    const res = await apiClient.get<ResumeTemplate[]>('/api/templates/featured');
    return res.data;
  },

  getAtsFriendly: async () => {
    const res = await apiClient.get<ResumeTemplate[]>('/api/templates/ats');
    return res.data;
  },

  searchTemplates: async (q: string) => {
    const res = await apiClient.get<ResumeTemplate[]>('/api/templates/search', { params: { q } });
    return res.data;
  },

  createTemplate: async (data: Omit<ResumeTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await apiClient.post<ResumeTemplate>('/api/templates', data);
    return res.data;
  },

  updateTemplate: async (id: string, data: Partial<ResumeTemplate>) => {
    const res = await apiClient.put<ResumeTemplate>(`/api/templates/${id}`, data);
    return res.data;
  },

  deleteTemplate: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/api/templates/${id}`);
    return res.data;
  },

  reorderTemplates: async (templateIds: string[]) => {
    const res = await apiClient.patch<{ message: string }>('/api/templates/reorder', { templateIds });
    return res.data;
  },

  enableTemplates: async (templateIds: string[], enabled: boolean) => {
    const res = await apiClient.patch<{ message: string }>('/api/templates/enable', { templateIds, enabled });
    return res.data;
  },

  disableTemplates: async (templateIds: string[]) => {
    const res = await apiClient.patch<{ message: string }>('/api/templates/disable', { templateIds });
    return res.data;
  },

  getAnalytics: async () => {
    const res = await apiClient.get<TemplateAnalytics>('/api/templates/analytics/dashboard');
    return res.data;
  },

  trackSelection: async (templateId: string, action: 'select' | 'download' = 'select', selectionTime: number = 0) => {
    const res = await apiClient.post<{ message: string }>(`/api/templates/track/${templateId}`, null, {
      params: { action, selection_time: selectionTime },
    });
    return res.data;
  },
};
