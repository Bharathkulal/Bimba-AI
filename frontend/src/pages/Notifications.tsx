import React, { useState, useEffect } from 'react';
import { 
  Bell, Award, FileText, CheckCircle, ShieldAlert, 
  Trash2, Eye, MailOpen, AlertCircle, Megaphone, Search, Filter 
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { adminService } from '../services/admin';

interface NotificationItem {
  id: number;
  category: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  target_audience: string;
  target_value?: string;
  pinned: boolean;
  created_at: string;
}

export const Notifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'announcements'>('notifications');
  
  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifSearch, setNotifSearch] = useState('');
  const [notifFilter, setNotifFilter] = useState('');
  
  // Announcements state
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [annSearch, setAnnSearch] = useState('');

  // Status indicators
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch Notifications
      const notifRes = await adminService.apiClient.get('/api/analytics/notifications', {
        params: {
          category: notifFilter || undefined,
          search: notifSearch || undefined
        }
      });
      setNotifications(notifRes.data.notifications || []);
      setUnreadCount(notifRes.data.unread_count || 0);

      // Fetch Announcements
      const annRes = await adminService.apiClient.get('/api/analytics/announcements', {
        params: {
          search: annSearch || undefined
        }
      });
      setAnnouncements(annRes.data || []);
    } catch (err) {
      setError('Failed to fetch communications feed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [notifSearch, notifFilter, annSearch]);

  // Mark notification as read
  const handleMarkAsRead = async (id: number) => {
    try {
      await adminService.apiClient.put(`/api/analytics/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await adminService.apiClient.put('/api/analytics/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete notification
  const handleDeleteNotif = async (id: number) => {
    try {
      const target = notifications.find(n => n.id === id);
      await adminService.apiClient.delete(`/api/analytics/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (target && !target.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper: get category colors & icons
  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case 'Resume':
        return { icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-100' };
      case 'Profile':
        return { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
      case 'Certificates':
        return { icon: Award, color: 'text-amber-600 bg-amber-50 border-amber-100' };
      case 'System':
        return { icon: ShieldAlert, color: 'text-rose-600 bg-rose-50 border-rose-100' };
      default:
        return { icon: Bell, color: 'text-slate-600 bg-slate-50 border-slate-100' };
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12 font-sans selection:bg-blue-500/15">
      <PageHeader
        title="Notifications & Announcements"
        description="Stay updated with placement news, resume analysis updates, and administrative posts."
      />

      {/* Tabs list */}
      <div className="flex gap-4 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 relative ${
            activeTab === 'notifications' 
              ? 'text-blue-600 bg-blue-50/50' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Notifications Feed {unreadCount > 0 && <span className="ml-1.5 px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black">{unreadCount}</span>}
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'announcements' 
              ? 'text-blue-600 bg-blue-50/50' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          College Announcements {announcements.length > 0 && <span className="ml-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[9px] font-black">{announcements.length}</span>}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {activeTab === 'notifications' ? (
        <div className="flex flex-col gap-6">
          {/* Notifications controls */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-grow md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" size={15} />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={notifSearch}
                  onChange={(e) => setNotifSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none text-xs text-slate-700"
                />
              </div>

              <div className="relative">
                <select
                  value={notifFilter}
                  onChange={(e) => setNotifFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-650 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">All Categories</option>
                  <option value="Resume">Resume</option>
                  <option value="Profile">Profile</option>
                  <option value="Certificates">Certificates</option>
                  <option value="System">System</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
              </div>
            </div>

            {unreadCount > 0 && (
              <Button onClick={handleMarkAllRead} variant="outline" size="sm" className="font-bold border-slate-250 hover:bg-slate-50 text-xs">
                Mark All Read
              </Button>
            )}
          </div>

          {/* Notifications feed list */}
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-100/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <AlertCircle size={36} className="text-slate-300 mb-3" />
              <h4 className="text-sm font-extrabold text-slate-800">Inbox is empty</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                You do not have any placement or resume alerts in your notifications inbox.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {notifications.map((n) => {
                const { icon: Icon, color } = getCategoryDetails(n.category);
                const dateText = new Date(n.created_at).toLocaleDateString(undefined, { 
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                });
                return (
                  <div 
                    key={n.id} 
                    className={`flex items-start justify-between p-4.5 rounded-2xl border transition-all duration-150 ${
                      n.is_read 
                        ? 'bg-white border-slate-200/50 opacity-75' 
                        : 'bg-blue-50/20 border-blue-200 shadow-sm shadow-blue-500/5'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center border shrink-0`}>
                        <Icon size={16} />
                      </div>
                      
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{n.category}</span>
                          {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mt-1">{n.message}</h4>
                        <span className="text-[9px] font-extrabold text-slate-400 block mt-1.5">{dateText}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!n.is_read && (
                        <button 
                          onClick={() => handleMarkAsRead(n.id)}
                          className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          <Eye size={12} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteNotif(n.id)}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-red-550 hover:bg-red-50 hover:border-red-200 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Announcements controls */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" size={15} />
            <input
              type="text"
              placeholder="Search announcements..."
              value={annSearch}
              onChange={(e) => setAnnSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none text-xs text-slate-700"
            />
          </div>

          {/* Announcements list */}
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map(i => (
                <div key={i} className="h-32 bg-slate-100/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <Megaphone size={36} className="text-slate-300 mb-3" />
              <h4 className="text-sm font-extrabold text-slate-800">No Announcements</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Administration has not published any announcements targeting your department or semester group yet.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {announcements.map((a) => {
                const dateText = new Date(a.created_at).toLocaleDateString(undefined, { 
                  year: 'numeric', month: 'short', day: 'numeric' 
                });
                return (
                  <Card 
                    key={a.id} 
                    className={`p-6 text-left border relative overflow-hidden bg-white shadow-sm flex flex-col gap-3 ${
                      a.pinned ? 'border-amber-250 shadow-amber-500/5' : 'border-slate-200/60'
                    }`}
                  >
                    {a.pinned && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-white font-extrabold text-[8px] uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-sm">
                        Pinned Post
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-extrabold text-blue-600 uppercase bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                          {a.target_audience}
                        </span>
                        <span className="text-[9px] font-black text-slate-400">{dateText}</span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 mt-1">{a.title}</h3>
                    </div>

                    <p className="text-xs text-slate-650 leading-relaxed border-t border-slate-100 pt-3">
                      {a.content}
                    </p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default Notifications;
