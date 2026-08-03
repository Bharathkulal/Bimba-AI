import { apiClient } from './api';

export interface NotificationItem {
  _id?: string;
  id: number;
  userId: number;
  title: string;
  description: string;
  type: string; // "Resume" | "Jobs" | "Placement" | "Interview" | "AI" | "System" | "Announcement"
  priority: string; // "Low" | "Medium" | "High" | "Critical"
  icon?: string;
  actionUrl?: string;
  isRead: boolean;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface NotificationSettings {
  resumeUpdates: boolean;
  jobs: boolean;
  placement: boolean;
  aiSuggestions: boolean;
  interviewAlerts: boolean;
  announcements: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  desktopNotifications: boolean;
}

export const notificationsService = {
  getNotifications: async (params?: {
    category?: string;
    search?: string;
    unread_only?: boolean;
    archived_only?: boolean;
  }): Promise<NotificationItem[]> => {
    const res = await apiClient.get<NotificationItem[]>('/api/v1/notifications', { params });
    return res.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<{ unread_count: number }>('/api/v1/notifications/unread-count');
    return res.data.unread_count;
  },

  markRead: async (id: number): Promise<void> => {
    await apiClient.put(`/api/v1/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.put('/api/v1/notifications/read-all');
  },

  deleteNotification: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/notifications/${id}`);
  },

  archive: async (id: number): Promise<void> => {
    await apiClient.put(`/api/v1/notifications/${id}/archive`);
  },

  pin: async (id: number, pin: boolean): Promise<void> => {
    await apiClient.put(`/api/v1/notifications/${id}/pin`, null, {
      params: { pin }
    });
  },

  getSettings: async (): Promise<NotificationSettings> => {
    const res = await apiClient.get<NotificationSettings>('/api/v1/notifications/settings');
    return res.data;
  },

  updateSettings: async (settings: NotificationSettings): Promise<void> => {
    await apiClient.put('/api/v1/notifications/settings', settings);
  }
};
