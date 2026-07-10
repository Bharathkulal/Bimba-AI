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

export interface DatasetImportData {
  id: number;
  filename: string;
  import_type: string;
  total_records: number;
  imported_count: number;
  updated_count: number;
  skipped_count: number;
  failed_count: number;
  rollback_status: string;
  created_at: string;
}

export interface DepartmentData {
  id: number;
  code: string;
  name: string;
  description: string;
  hod_name: string;
  status: string;
  student_count: number;
  subject_count: number;
  faculty_count: number;
}

export interface SubjectData {
  id: number;
  code: string;
  name: string;
  department_code: string;
  semester: number;
  credits: number;
  faculty_name: string;
  status: string;
  students_enrolled: number;
}

export interface AnnouncementData {
  id: number;
  title: string;
  content: string;
  status: string;
  pinned: boolean;
  target_audience: string;
  target_value: string;
  delivery_status: string;
  read_count: number;
  created_at: string;
}

export interface EmailTemplateData {
  id: number;
  name: string;
  subject: string;
  body: string;
}

export interface EmailLogData {
  id: number;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  error_message: string;
  created_at: string;
}

export interface BackupData {
  id: number;
  filename: string;
  backup_type: string;
  size_bytes: number;
  status: string;
  created_at: string;
}

export interface AdminUserDataDetails {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login?: string;
}

export interface NotificationData {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SystemHealthData {
  status: string;
  cpu: number;
  ram: number;
  disk: number;
  uptime: string;
  history: Array<{
    timestamp: string;
    cpu: number;
    ram: number;
    latency: number;
    queries: number;
    rate: number;
  }>;
}

export const adminService = {
  login: async (username: string, password: string): Promise<{ success: boolean; token: string }> => {
    const res = await apiClient.post<{ success: boolean; token: string }>('/api/admin/login', { username, password });
    if (res.data.success && res.data.token) {
      localStorage.setItem('admin_token', res.data.token);
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
  },

  // Dataset Management
  getDatasets: async (): Promise<DatasetImportData[]> => {
    const res = await apiClient.get<DatasetImportData[]>('/api/admin/datasets');
    return res.data;
  },

  uploadDataset: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/api/admin/dataset/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  importDataset: async (filename: string, importType: 'merge' | 'replace', records: any[]): Promise<any> => {
    const res = await apiClient.post('/api/admin/dataset/import', {
      filename,
      import_type: importType,
      records
    });
    return res.data;
  },

  rollbackDataset: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/dataset?import_id=${id}`);
  },

  // Departments
  getDepartments: async (): Promise<DepartmentData[]> => {
    const res = await apiClient.get<DepartmentData[]>('/api/admin/departments');
    return res.data;
  },

  createDepartment: async (dept: Partial<DepartmentData>): Promise<void> => {
    await apiClient.post('/api/admin/departments', dept);
  },

  editDepartment: async (id: number, dept: Partial<DepartmentData>): Promise<void> => {
    await apiClient.put(`/api/admin/departments/${id}`, dept);
  },

  deleteDepartment: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/departments/${id}`);
  },

  // Subjects
  getSubjects: async (): Promise<SubjectData[]> => {
    const res = await apiClient.get<SubjectData[]>('/api/admin/subjects');
    return res.data;
  },

  createSubject: async (sub: Partial<SubjectData>): Promise<void> => {
    await apiClient.post('/api/admin/subjects', sub);
  },

  editSubject: async (id: number, sub: Partial<SubjectData>): Promise<void> => {
    await apiClient.put(`/api/admin/subjects/${id}`, sub);
  },

  deleteSubject: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/subjects/${id}`);
  },

  archiveSubject: async (id: number): Promise<void> => {
    await apiClient.post(`/api/admin/subjects/${id}/archive`);
  },

  // Announcements
  getAnnouncements: async (): Promise<AnnouncementData[]> => {
    const res = await apiClient.get<AnnouncementData[]>('/api/admin/announcements');
    return res.data;
  },

  createAnnouncement: async (ann: Partial<AnnouncementData>): Promise<void> => {
    await apiClient.post('/api/admin/announcements', ann);
  },

  editAnnouncement: async (id: number, ann: Partial<AnnouncementData>): Promise<void> => {
    await apiClient.put(`/api/admin/announcements/${id}`, ann);
  },

  deleteAnnouncement: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/announcements/${id}`);
  },

  // Email Center
  getEmailConfig: async (): Promise<any> => {
    const res = await apiClient.get('/api/admin/email/config');
    return res.data;
  },

  saveEmailConfig: async (config: any): Promise<void> => {
    await apiClient.post('/api/admin/email/config', config);
  },

  testEmailConfig: async (config: any): Promise<any> => {
    const res = await apiClient.post('/api/admin/email/test', config);
    return res.data;
  },

  getEmailTemplates: async (): Promise<EmailTemplateData[]> => {
    const res = await apiClient.get<EmailTemplateData[]>('/api/admin/email/templates');
    return res.data;
  },

  updateEmailTemplate: async (name: string, template: Partial<EmailTemplateData>): Promise<void> => {
    await apiClient.put(`/api/admin/email/templates/${name}`, template);
  },

  getEmailLogs: async (): Promise<EmailLogData[]> => {
    const res = await apiClient.get<EmailLogData[]>('/api/admin/email/logs');
    return res.data;
  },

  retryFailedEmails: async (): Promise<any> => {
    const res = await apiClient.post('/api/admin/email/retry-failed');
    return res.data;
  },

  // Backup & Restore
  getBackups: async (): Promise<BackupData[]> => {
    const res = await apiClient.get<BackupData[]>('/api/admin/backups');
    return res.data;
  },

  createBackup: async (): Promise<void> => {
    await apiClient.post('/api/admin/backups');
  },

  restoreBackup: async (id: number): Promise<void> => {
    await apiClient.post(`/api/admin/backups/${id}/restore`);
  },

  deleteBackup: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/backups/${id}`);
  },

  // Admins
  getAdmins: async (): Promise<AdminUserDataDetails[]> => {
    const res = await apiClient.get<AdminUserDataDetails[]>('/api/admin/admins');
    return res.data;
  },

  createAdmin: async (admin: any): Promise<void> => {
    await apiClient.post('/api/admin/admins', admin);
  },

  editAdmin: async (id: number, admin: any): Promise<void> => {
    await apiClient.put(`/api/admin/admins/${id}`, admin);
  },

  resetAdminPassword: async (id: number): Promise<any> => {
    const res = await apiClient.post(`/api/admin/admins/${id}/reset-password`);
    return res.data;
  },

  forceLogoutAdmin: async (id: number): Promise<void> => {
    await apiClient.post(`/api/admin/admins/${id}/force-logout`);
  },

  // Notifications
  getNotifications: async (): Promise<NotificationData[]> => {
    const res = await apiClient.get<NotificationData[]>('/api/admin/notifications');
    return res.data;
  },

  markNotificationRead: async (id: number): Promise<void> => {
    await apiClient.post(`/api/admin/notifications/${id}/read`);
  },

  deleteNotification: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/notifications/${id}`);
  },

  // System Monitor
  getSystemHealth: async (): Promise<SystemHealthData> => {
    const res = await apiClient.get<SystemHealthData>('/api/admin/monitor');
    return res.data;
  },

  // Global Search
  globalSearch: async (query: string): Promise<any> => {
    const res = await apiClient.get(`/api/admin/search?query=${query}`);
    return res.data;
  }
};
