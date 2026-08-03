import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Check, Trash, Search, Shield, Pin, X, Eye, 
  Settings, ExternalLink, RefreshCw, Archive, Megaphone, 
  Clock, AlertTriangle, FileText, CheckCircle2, Inbox, 
  Trash2, ArchiveRestore, SlidersHorizontal, ArrowUpDown
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useNotificationStore } from '../store/notificationStore';
import { useThemeStore } from '../store/themeStore';
import { 
  getCategoryIcon, getPriorityClass, timeAgo, 
  NotificationCard, NotificationSkeleton, NotificationEmpty 
} from '../components/notifications/NotificationDropdown';

const PAGE_TABS = [
  { value: 'All', label: 'All Notifications' },
  { value: 'Unread', label: 'Unread' },
  { value: 'Pinned', label: 'Pinned' },
  { value: 'Archived', label: 'Archived' },
  { value: 'Resume', label: 'Resume' },
  { value: 'Jobs', label: 'Jobs' },
  { value: 'Placement', label: 'Placement' },
  { value: 'Interview', label: 'Interview' },
  { value: 'AI', label: 'AI suggestions' },
  { value: 'System', label: 'System' }
];

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { 
    notifications, fetchNotifications, loading, 
    markRead, markAllRead, deleteNotification, 
    archiveNotification, pinNotification 
  } = useNotificationStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');

  useEffect(() => {
    // If viewing archived, fetch archived notifications
    fetchNotifications({
      archived_only: activeTab === 'Archived'
    });
  }, [activeTab]);

  const handleRefresh = () => {
    fetchNotifications({
      archived_only: activeTab === 'Archived'
    });
  };

  // Mark all read
  const handleMarkAllRead = () => {
    markAllRead();
  };

  // Delete all shown notifications
  const handleDeleteAll = async () => {
    if (window.confirm("Are you sure you want to delete all notifications on this list?")) {
      for (const n of filtered) {
        await deleteNotification(n.id);
      }
    }
  };

  // Filter & Sort
  const filtered = notifications.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                          n.description.toLowerCase().includes(search.toLowerCase()) ||
                          n.type.toLowerCase().includes(search.toLowerCase());

    if (activeTab === 'All') return matchesSearch;
    if (activeTab === 'Unread') return !n.isRead && matchesSearch;
    if (activeTab === 'Pinned') return n.isPinned && matchesSearch;
    if (activeTab === 'Archived') return n.isArchived && matchesSearch;
    return n.type.toLowerCase() === activeTab.toLowerCase() && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'priority') {
      const priorityMap: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      const pA = priorityMap[a.priority.toLowerCase()] || 0;
      const pB = priorityMap[b.priority.toLowerCase()] || 0;
      return pB - pA;
    }
    return 0;
  });

  return (
    <div className="flex flex-col gap-6 w-full text-left font-sans animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Notification Center</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
            View alerts, campus drives, and Copilot suggestions
          </p>
        </div>

        <div className="flex gap-2.5">
          <Button 
            onClick={handleMarkAllRead} 
            variant="outline" 
            size="sm" 
            className="font-bold text-xs flex items-center gap-1.5 border-slate-200"
          >
            <CheckCircle2 size={13} /> Mark All Read
          </Button>
          <Button 
            onClick={handleDeleteAll} 
            variant="secondary" 
            size="sm" 
            className="font-bold text-xs flex items-center gap-1.5 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
          >
            <Trash2 size={13} /> Clear All
          </Button>
          <Button 
            onClick={handleRefresh} 
            variant="secondary" 
            size="sm" 
            className="font-bold text-xs flex items-center gap-1.5"
          >
            <RefreshCw size={13} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Filters column */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="p-4 flex flex-col gap-2">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Categories</h5>
            <div className="flex flex-col gap-1">
              {PAGE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    activeTab === tab.value 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                      : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.value === 'Unread' && notifications.filter(n => !n.isRead).length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeTab === 'Unread' ? 'bg-white text-emerald-600' : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300'}`}>
                      {notifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Search & List column */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Controls Bar */}
          <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/2 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <ArrowUpDown size={12} /> Sort by
              </span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-655 focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Priority Level</option>
              </select>
            </div>
          </Card>

          {/* List display */}
          <div className="flex flex-col gap-3.5">
            {loading ? (
              <NotificationSkeleton />
            ) : filtered.length === 0 ? (
              <Card className="flex flex-col items-center justify-center p-16 text-center text-slate-450">
                <Inbox size={42} className="text-slate-300 dark:text-slate-600 mb-4 animate-pulse" />
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">Nothing in this category</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  You don't have any alerts matching this category. Feel free to refresh the feeds.
                </p>
                <button 
                  onClick={handleRefresh}
                  className="mt-5 px-5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white dark:bg-transparent text-slate-700 dark:text-slate-300"
                >
                  Refresh Feed
                </button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filtered.map((item) => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    onRead={markRead}
                    onArchive={archiveNotification}
                    onPin={pinNotification}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
