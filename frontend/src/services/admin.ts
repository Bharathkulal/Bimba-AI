import { apiClient } from './api';

export interface AdminDashboardData {
  totalUsers: number;
  todaySignups: number;
  activeUsers: number;
  aiRequests: number;
  totalResumes: number;
  downloads: number;
  atsReports: number;
  averageAtsScore: number;
}

export interface AdminUserData {
  id: number;
  roll_number: string;
  email: string;
  department: string;
  semester: number;
  status: string;
  is_activated: boolean;
  resumes_count: number;
  last_activity: string;
}

export interface AdminResumeData {
  id: number;
  name: string;
  student_roll: string;
  template: string;
  ats_score: number;
  last_edited: string;
  status: string;
}

export interface AdminTemplateData {
  id: number;
  name: string;
  category: string;
  score: number;
  is_active: boolean;
  description: string;
}

export interface AdminSettingsData {
  app_name: string;
  session_timeout: number;
  smtp_host: string;
  maintenance_mode: boolean;
  theme: string;
  version: string;
}

export const adminService = {
  login: async (username: string, password: string): Promise<{ success: boolean; token: string }> => {
    const res = await apiClient.post<{ success: boolean; token: string }>('/api/admin/login', { username, password });
    if (res.data.success && res.data.token) {
      localStorage.setItem('admin_token', res.data.token);
      // Setup auth header on apiClient as well
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    }
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    delete apiClient.defaults.headers.common['Authorization'];
  },

  getDashboard: async (): Promise<AdminDashboardData> => {
    const res = await apiClient.get<AdminDashboardData>('/api/admin/dashboard');
    return res.data;
  },

  getUsers: async (): Promise<AdminUserData[]> => {
    const res = await apiClient.get<AdminUserData[]>('/api/admin/users');
    return res.data;
  },

  modifyUser: async (rollNumber: string, action: 'suspend' | 'activate' | 'delete' | 'reset_password'): Promise<void> => {
    await apiClient.post('/api/admin/users/modify', { roll_number: rollNumber, action });
  },

  getResumes: async (): Promise<AdminResumeData[]> => {
    const res = await apiClient.get<AdminResumeData[]>('/api/admin/resumes');
    return res.data;
  },

  deleteResume: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/resumes/${id}`);
  },

  getTemplates: async (): Promise<AdminTemplateData[]> => {
    const res = await apiClient.get<AdminTemplateData[]>('/api/admin/templates');
    return res.data;
  },

  getSettings: async (): Promise<AdminSettingsData> => {
    const res = await apiClient.get<AdminSettingsData>('/api/admin/settings');
    return res.data;
  },

  saveSettings: async (settings: Partial<AdminSettingsData>): Promise<void> => {
    await apiClient.put('/api/admin/settings', settings);
  }
};
