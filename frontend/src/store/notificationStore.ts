import { create } from 'zustand';
import { notificationsService, NotificationItem } from '../services/notifications';
import { API_BASE_URL } from '../services/api';

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type: string;
  icon?: string;
  actionUrl?: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  toasts: ToastMessage[];
  ws: WebSocket | null;
  
  fetchNotifications: (params?: { category?: string; search?: string; unread_only?: boolean; archived_only?: boolean }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  archiveNotification: (id: number) => Promise<void>;
  pinNotification: (id: number, pin: boolean) => Promise<void>;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  initWebSocket: (token: string) => void;
  closeWebSocket: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  toasts: [],
  ws: null,

  fetchNotifications: async (params) => {
    set({ loading: true });
    try {
      const data = await notificationsService.getNotifications(params);
      set({ notifications: data });
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationsService.getUnreadCount();
      set({ unreadCount: count });
    } catch (err) {
      console.error(err);
    }
  },

  markRead: async (id) => {
    try {
      await notificationsService.markRead(id);
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        );
        const unreadCount = Math.max(0, state.unreadCount - 1);
        return { notifications: updated, unreadCount };
      });
    } catch (err) {
      console.error(err);
    }
  },

  markAllRead: async () => {
    try {
      await notificationsService.markAllRead();
      set((state) => {
        const updated = state.notifications.map((n) => ({ ...n, isRead: true }));
        return { notifications: updated, unreadCount: 0 };
      });
    } catch (err) {
      console.error(err);
    }
  },

  deleteNotification: async (id) => {
    try {
      await notificationsService.deleteNotification(id);
      set((state) => {
        const notif = state.notifications.find((n) => n.id === id);
        const updated = state.notifications.filter((n) => n.id !== id);
        const unreadCount = notif && !notif.isRead ? Math.max(0, state.unreadCount - 1) : state.unreadCount;
        return { notifications: updated, unreadCount };
      });
    } catch (err) {
      console.error(err);
    }
  },

  archiveNotification: async (id) => {
    try {
      await notificationsService.archive(id);
      set((state) => {
        const notif = state.notifications.find((n) => n.id === id);
        const updated = state.notifications.filter((n) => n.id !== id);
        const unreadCount = notif && !notif.isRead ? Math.max(0, state.unreadCount - 1) : state.unreadCount;
        return { notifications: updated, unreadCount };
      });
    } catch (err) {
      console.error(err);
    }
  },

  pinNotification: async (id, pin) => {
    try {
      await notificationsService.pin(id, pin);
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id ? { ...n, isPinned: pin } : n
        ).sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        return { notifications: updated };
      });
    } catch (err) {
      console.error(err);
    }
  },

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  },

  initWebSocket: (token) => {
    const currentWs = get().ws;
    if (currentWs) {
      currentWs.close();
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = API_BASE_URL.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}//${baseUrl}/api/v1/ws/notifications?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'new_notification') {
          const newNotif = msg.data as NotificationItem;
          
          // Prepend new notification to state
          set((state) => {
            const exists = state.notifications.some((n) => n.id === newNotif.id);
            if (exists) return {};
            
            const updated = [newNotif, ...state.notifications].sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            return {
              notifications: updated,
              unreadCount: state.unreadCount + 1
            };
          });

          // Show Toast notification
          get().addToast({
            title: newNotif.title,
            description: newNotif.description,
            type: newNotif.type,
            icon: newNotif.icon,
            actionUrl: newNotif.actionUrl
          });
        }
      } catch (err) {
        console.error("Failed to parse WS message:", err);
      }
    };

    ws.onclose = () => {
      set({ ws: null });
    };

    set({ ws });
  },

  closeWebSocket: () => {
    const currentWs = get().ws;
    if (currentWs) {
      currentWs.close();
      set({ ws: null });
    }
  }
}));
