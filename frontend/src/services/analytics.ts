import { apiClient } from './api';

export interface DashboardData {
  resumes: {
    total: number;
    drafts: number;
    completed: number;
    archived: number;
    averageCompletion: number;
  };
  streak: {
    current: number;
    longest: number;
    activeDays: number;
  };
  timeSavedMinutes: number;
  editingTime: {
    totalMinutes: number;
    todayMinutes: number;
    longestMinutes: number;
  };
  heatmap: Array<{ date: string; count: number }>;
}

export interface AtsData {
  has_resumes: boolean;
  bestResume?: {
    id: number;
    name: string;
    atsScore: number;
  };
  sections?: {
    personalInfo: number;
    summary: number;
    experience: number;
    education: number;
    skills: number;
    projects: number;
    certifications: number;
  };
  formattingScore?: number;
  readabilityScore?: number;
  keywordMatch?: number;
  missingKeywords?: string[];
  recommendations?: string[];
  history?: Array<{
    version: string;
    atsScore: number;
    date: string;
  }>;
}

export interface ActivityTimelineItem {
  id: number;
  activity: string;
  timestamp: string;
}

export interface ResumeAnalyticsItem {
  id: number;
  name: string;
  template: string;
  atsScore: number;
  completion: number;
  sections: Record<string, boolean>;
  versionsCount: number;
  status: string;
  lastEdited: string;
}

export interface DownloadsData {
  counts: Record<string, number>;
  trend: Array<{ date: string; downloads: number }>;
}

export interface AiUsageData {
  counts: Record<string, number>;
  trend: Array<{ date: string; requests: number }>;
}

export const analyticsService = {
  getDashboard: async (): Promise<DashboardData> => {
    const res = await apiClient.get<DashboardData>('/api/analytics/dashboard');
    return res.data;
  },

  getAts: async (): Promise<AtsData> => {
    const res = await apiClient.get<AtsData>('/api/analytics/ats');
    return res.data;
  },

  getActivity: async (): Promise<ActivityTimelineItem[]> => {
    const res = await apiClient.get<ActivityTimelineItem[]>('/api/analytics/activity');
    return res.data;
  },

  getResumes: async (): Promise<ResumeAnalyticsItem[]> => {
    const res = await apiClient.get<ResumeAnalyticsItem[]>('/api/analytics/resumes');
    return res.data;
  },

  getDownloads: async (): Promise<DownloadsData> => {
    const res = await apiClient.get<DownloadsData>('/api/analytics/downloads');
    return res.data;
  },

  getAiUsage: async (): Promise<AiUsageData> => {
    const res = await apiClient.get<AiUsageData>('/api/analytics/ai-usage');
    return res.data;
  },

  trackAction: async (params: {
    action_type: 'ai_use' | 'download' | 'edit' | 'session' | 'activity';
    detail: string;
    format?: string;
    duration_seconds?: number;
    ats_score?: number;
  }): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post('/api/analytics/track', params);
    return res.data;
  }
};
