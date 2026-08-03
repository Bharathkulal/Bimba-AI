import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Check, Trash, Search, Pin, X, 
  Settings, ExternalLink, RefreshCw, Archive, 
  Clock
} from 'lucide-react';
import type { NotificationItem } from '../../services/notifications';
import { useNotificationStore } from '../../store/notificationStore';
import { useThemeStore } from '../../store/themeStore';

// --- Category Helpers ---
const CATEGORIES = [
  { value: 'All', label: 'All' },
  { value: 'Unread', label: 'Unread' },
  { value: 'Resume', label: 'Resume' },
  { value: 'Jobs', label: 'Jobs' },
  { value: 'Placement', label: 'Placement' },
  { value: 'Interview', label: 'Interview' },
  { value: 'AI', label: 'AI' },
  { value: 'System', label: 'System' }
];

export const getCategoryIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'resume': return '📄';
    case 'jobs': return '💼';
    case 'placement': return '🏢';
    case 'interview': return '📅';
    case 'ai': return '🤖';
    case 'announcement': return '📢';
    case 'system': return '⚙️';
    case 'success': return '✅';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    default: return '⚙️';
  }
};

export const getPriorityClass = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'low': return 'border-slate-200 dark:border-slate-800';
    case 'medium': return 'border-blue-450 dark:border-blue-500';
    case 'high': return 'border-orange-450 dark:border-orange-500';
    case 'critical': return 'border-red-550 dark:border-red-500';
    default: return 'border-slate-200 dark:border-slate-800';
  }
};

// --- Helper relative time string ---
export const timeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// --- Empty State ---
export const NotificationEmpty: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 animate-bounce">
      <Bell size={28} />
    </div>
    <h5 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">You're all caught up!</h5>
    <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1 max-w-[220px]">No notifications yet. Check back later for placement updates.</p>
    <button 
      onClick={onRefresh}
      className="mt-4 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-350 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
    >
      <RefreshCw size={11} /> Refresh
    </button>
  </div>
);

// --- Skeleton Loaders ---
export const NotificationSkeleton: React.FC = () => (
  <div className="flex flex-col gap-3 p-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex gap-3 p-3 border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 rounded-xl animate-pulse">
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 shrink-0" />
        <div className="flex-grow flex flex-col gap-1.5">
          <div className="w-2/3 h-3 bg-slate-200 dark:bg-white/10 rounded" />
          <div className="w-full h-2.5 bg-slate-200 dark:bg-white/10 rounded" />
          <div className="w-1/3 h-2 bg-slate-200 dark:bg-white/10 rounded mt-1" />
        </div>
      </div>
    ))}
  </div>
);

// --- Notification Card Component ---
export const NotificationCard: React.FC<{
  item: NotificationItem;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
  onArchive: (id: number) => void;
  onPin: (id: number, pin: boolean) => void;
}> = ({ item, onRead, onDelete, onArchive, onPin }) => {
  const navigate = useNavigate();
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`p-3.5 border-l-4 rounded-xl border bg-white dark:bg-slate-900 shadow-sm flex gap-3 text-left relative group/card transition-all duration-200 hover:shadow-md hover:-translate-y-[1px] ${getPriorityClass(item.priority)} ${
        item.isRead ? 'opacity-70 border-slate-200/50 dark:border-slate-800/50' : 'bg-emerald-500/[0.01] border-emerald-500/10'
      }`}
    >
      {/* Category Icon */}
      <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center text-sm shrink-0">
        {item.icon || getCategoryIcon(item.type)}
      </div>

      <div className="flex-grow flex flex-col gap-0.5 pr-6">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.type}</span>
          {item.isPinned && <Pin size={9} className="text-slate-400 rotate-45" />}
          {!item.isRead && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
        </div>

        <h6 className="text-[11.5px] font-bold text-slate-900 dark:text-white leading-tight">{item.title}</h6>
        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal font-medium">{item.description}</p>
        
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-50 dark:border-white/2">
          <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-extrabold flex items-center gap-1">
            <Clock size={10} /> {timeAgo(item.createdAt)}
          </span>
          {item.actionUrl && (
            <button
              onClick={() => {
                if (item.actionUrl?.startsWith('http')) {
                  window.open(item.actionUrl, '_blank');
                } else {
                  navigate(item.actionUrl || '/');
                }
              }}
              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer"
            >
              Action <ExternalLink size={9} />
            </button>
          )}
        </div>
      </div>

      {/* Hover Action Overlay Panel */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 bg-white/90 dark:bg-slate-900/90 py-0.5 px-1.5 rounded-lg border border-slate-100 dark:border-white/5">
        {!item.isRead && (
          <button 
            onClick={() => onRead(item.id)}
            className="p-1 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer" 
            title="Mark read"
          >
            <Check size={11} />
          </button>
        )}
        <button 
          onClick={() => onPin(item.id, !item.isPinned)}
          className={`p-1 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer ${item.isPinned ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-700'}`} 
          title={item.isPinned ? "Unpin" : "Pin"}
        >
          <Pin size={11} className={item.isPinned ? '' : 'rotate-45'} />
        </button>
        <button 
          onClick={() => onArchive(item.id)}
          className="p-1 text-slate-400 hover:text-blue-500 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer" 
          title="Archive"
        >
          <Archive size={11} />
        </button>
        <button 
          onClick={() => onDelete(item.id)}
          className="p-1 text-slate-400 hover:text-rose-500 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer" 
          title="Delete"
        >
          <Trash size={11} />
        </button>
      </div>
    </motion.div>
  );
};

// --- Main Dropdown Component ---
export const NotificationDropdown: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync initial list when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Filtering
  const filtered = notifications.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                          n.description.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === 'All') return matchesSearch;
    if (activeTab === 'Unread') return !n.isRead && matchesSearch;
    return n.type.toLowerCase() === activeTab.toLowerCase() && matchesSearch;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          ref={dropdownRef}
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.15 }}
          className={`absolute right-0 mt-3.5 w-[360px] md:w-[410px] h-[550px] rounded-2xl shadow-2xl border flex flex-col z-50 overflow-hidden font-sans ${
            isDark 
              ? 'bg-[#0B0F19]/95 backdrop-blur-xl border-white/10 text-white shadow-black/40' 
              : 'bg-white/95 backdrop-blur-xl border-slate-200/80 text-slate-800 shadow-slate-200'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <Bell size={14} className="text-emerald-500" />
              <span className="text-xs font-black uppercase tracking-wider">Notifications</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => markAllRead()}
                className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 cursor-pointer uppercase tracking-wider"
              >
                Mark all as read
              </button>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 shrink-0 relative">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input 
              type="text" 
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filter Tabs */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 flex gap-1 overflow-x-auto no-scrollbar shrink-0">
            {CATEGORIES.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase shrink-0 transition-all cursor-pointer ${
                  activeTab === tab.value 
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/10' 
                    : 'text-slate-450 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List Content */}
          <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3 no-scrollbar">
            {loading ? (
              <NotificationSkeleton />
            ) : filtered.length === 0 ? (
              <NotificationEmpty onRefresh={fetchNotifications} />
            ) : (
              <AnimatePresence initial={false}>
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
              </AnimatePresence>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 flex items-center justify-between shrink-0">
            <button
              onClick={() => {
                navigate('/settings');
                onClose();
              }}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Settings size={11} /> Preferences
            </button>
            <button
              onClick={() => {
                navigate('/notifications');
                onClose();
              }}
              className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 cursor-pointer uppercase tracking-wider"
            >
              View All Notifications →
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
