import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Users, FileText, Cpu, Shield, Download, Trash2, 
  CheckCircle, Search, Filter, Eye, EyeOff, Lock, RefreshCw,
  Plus, Edit3, Database, AlertCircle, Building2, BookOpen, Megaphone,
  Mail, Settings as SettingsIcon, DownloadCloud, Play, UserCheck, Activity, Bell, Check, Trash
} from 'lucide-react';
import { Button } from '../components/Button';
import { adminService } from '../services/admin';
import type { 
  AdminDashboardData, AdminUserData, AdminResumeData, AdminTemplateData, AdminSettingsData,
  DatasetImportData, DepartmentData, SubjectData, AnnouncementData, EmailTemplateData,
  EmailLogData, BackupData, AdminUserDataDetails, NotificationData, SystemHealthData
} from '../services/admin';
import { aiAdminService } from '../services/aiAdmin';
import type { AIProviderData, AIAnalyticsData, AISecuritySettings } from '../services/aiAdmin';

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Unified Loading
  const [isLoading, setIsLoading] = useState(true);
  
  // Dashboard overall stats
  const [stats, setStats] = useState<AdminDashboardData | null>(null);
  
  // Sub-sections lists
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [resumes, setResumes] = useState<AdminResumeData[]>([]);
  const [templates, setTemplates] = useState<AdminTemplateData[]>([]);
  const [systemSettings, setSystemSettings] = useState<AdminSettingsData | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  // AI Management sub-states
  const [aiProviders, setAiProviders] = useState<AIProviderData[]>([]);
  const [aiAnalytics, setAiAnalytics] = useState<AIAnalyticsData | null>(null);
  const [aiSettings, setAiSettings] = useState<AISecuritySettings | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [resumeSearch, setResumeSearch] = useState('');

  // Password Reveal Modal for API Keys
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [revealingSlug, setRevealingSlug] = useState<string | null>(null);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [keyCountdown, setKeyCountdown] = useState(0);

  // --- NEW STATES FOR ENTERPRISE MODULES ---
  const [datasets, setDatasets] = useState<DatasetImportData[]>([]);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateData[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogData[]>([]);
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [admins, setAdmins] = useState<AdminUserDataDetails[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);

  // Global Search
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<any>(null);

  // Modals / Form Dialog States
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isSubjModalOpen, setIsSubjModalOpen] = useState(false);
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isEmailTplModalOpen, setIsEmailTplModalOpen] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<any>(null);

  // Form Fields
  const [deptForm, setDeptForm] = useState({ id: 0, code: '', name: '', description: '', hod_name: '', status: 'Active' });
  const [subjForm, setSubjForm] = useState({ id: 0, code: '', name: '', department_code: '', semester: 3, credits: 3, faculty_name: '' });
  const [annForm, setAnnForm] = useState({ id: 0, title: '', content: '', status: 'Published', pinned: false, target_audience: 'Entire College', target_value: '' });
  const [adminForm, setAdminForm] = useState({ id: 0, username: '', email: '', password: '', role: 'admin', is_active: true });
  const [emailTplForm, setEmailTplForm] = useState({ name: '', subject: '', body: '' });

  // Fetch all admin data depending on route
  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      
      if (pathname === '/admin/dashboard') {
        const data = await adminService.getDashboard();
        setStats(data);
      } else if (pathname === '/admin/users') {
        const data = await adminService.getUsers();
        setUsers(data);
      } else if (pathname === '/admin/resumes') {
        const data = await adminService.getResumes();
        setResumes(data);
      } else if (pathname === '/admin/datasets') {
        const data = await adminService.getDatasets();
        setDatasets(data);
      } else if (pathname === '/admin/departments') {
        const data = await adminService.getDepartments();
        setDepartments(data);
      } else if (pathname === '/admin/subjects') {
        const data = await adminService.getSubjects();
        setSubjects(data);
      } else if (pathname === '/admin/announcements') {
        const data = await adminService.getAnnouncements();
        setAnnouncements(data);
      } else if (pathname === '/admin/email') {
        const [tpl, elogs] = await Promise.all([
          adminService.getEmailTemplates(),
          adminService.getEmailLogs()
        ]);
        setEmailTemplates(tpl);
        setEmailLogs(elogs);
      } else if (pathname === '/admin/backups') {
        const data = await adminService.getBackups();
        setBackups(data);
      } else if (pathname === '/admin/admins') {
        const data = await adminService.getAdmins();
        setAdmins(data);
      } else if (pathname === '/admin/monitor') {
        const data = await adminService.getSystemHealth();
        setSystemHealth(data);
      } else if (pathname === '/admin/notifications') {
        const data = await adminService.getNotifications();
        setNotifications(data);
      } else if (pathname === '/admin/templates') {
        const data = await adminService.getTemplates();
        setTemplates(data);
      } else if (pathname === '/admin/ai') {
        const [p, a, s] = await Promise.all([
          aiAdminService.getProviders(),
          aiAdminService.getAnalytics(),
          aiAdminService.getSettings()
        ]);
        setAiProviders(p);
        setAiAnalytics(a);
        setAiSettings(s);
      } else if (pathname === '/admin/logs') {
        const data = await aiAdminService.getLogs();
        setLogs(data);
      } else if (pathname === '/admin/security') {
        const s = await aiAdminService.getSettings();
        setAiSettings(s);
      } else if (pathname === '/admin/settings') {
        const s = await adminService.getSettings();
        setSystemSettings(s);
      }
    } catch (err) {
      console.error("Failed to retrieve admin records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [pathname]);

  // Key reveal countdown
  useEffect(() => {
    if (keyCountdown > 0) {
      const t = setTimeout(() => setKeyCountdown(keyCountdown - 1), 1000);
      return () => clearTimeout(t);
    } else if (keyCountdown === 0 && revealedKey) {
      setRevealedKey(null);
    }
  }, [keyCountdown, revealedKey]);

  // User Actions
  const handleUserAction = async (roll: string, action: 'suspend' | 'activate' | 'delete' | 'reset_password') => {
    if (action === 'delete' && !confirm(`Confirm deletion of user: ${roll}?`)) return;
    try {
      await adminService.modifyUser(roll, action);
      alert(`User action executed successfully.`);
      const updated = await adminService.getUsers();
      setUsers(updated);
    } catch (err) {
      alert("Failed to modify user status.");
    }
  };

  // Resume deletion
  const handleDeleteResume = async (id: number) => {
    if (!confirm("Are you sure you want to delete this resume from the system?")) return;
    try {
      await adminService.deleteResume(id);
      alert("Resume deleted.");
      const updated = await adminService.getResumes();
      setResumes(updated);
    } catch (err) {
      alert("Delete failed.");
    }
  };

  // --- DATASETS HANDLERS ---
  const handleDatasetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const preview = await adminService.uploadDataset(file);
      setUploadPreview(preview);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to upload and parse dataset file.");
    }
  };

  const commitDatasetImport = async (importType: 'merge' | 'replace') => {
    if (!uploadPreview) return;
    try {
      await adminService.importDataset(uploadPreview.filename, importType, uploadPreview.records);
      alert("Dataset imported successfully.");
      setUploadPreview(null);
      fetchAdminData();
    } catch (err) {
      alert("Failed to commit dataset import.");
    }
  };

  const handleRollbackImport = async (id: number) => {
    if (!confirm("Are you sure you want to rollback this import? All new records added during this import will be removed.")) return;
    try {
      await adminService.rollbackDataset(id);
      alert("Import rolled back successfully.");
      fetchAdminData();
    } catch (err) {
      alert("Rollback operation failed.");
    }
  };

  // --- DEPARTMENTS HANDLERS ---
  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (deptForm.id > 0) {
        await adminService.editDepartment(deptForm.id, deptForm);
      } else {
        await adminService.createDepartment(deptForm);
      }
      setIsDeptModalOpen(false);
      fetchAdminData();
    } catch (err) {
      alert("Save department operation failed.");
    }
  };

  const handleDeleteDept = async (id: number) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await adminService.deleteDepartment(id);
      fetchAdminData();
    } catch (err) {
      alert("Failed to delete department.");
    }
  };

  // --- SUBJECTS HANDLERS ---
  const handleSaveSubj = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (subjForm.id > 0) {
        await adminService.editSubject(subjForm.id, subjForm);
      } else {
        await adminService.createSubject(subjForm);
      }
      setIsSubjModalOpen(false);
      fetchAdminData();
    } catch (err) {
      alert("Save subject operation failed.");
    }
  };

  const handleDeleteSubj = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;
    try {
      await adminService.deleteSubject(id);
      fetchAdminData();
    } catch (err) {
      alert("Failed to delete subject.");
    }
  };

  const handleArchiveSubj = async (id: number) => {
    try {
      await adminService.archiveSubject(id);
      fetchAdminData();
    } catch (err) {
      alert("Failed to archive subject.");
    }
  };

  // --- ANNOUNCEMENTS HANDLERS ---
  const handleSaveAnn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (annForm.id > 0) {
        await adminService.editAnnouncement(annForm.id, annForm);
      } else {
        await adminService.createAnnouncement(annForm);
      }
      setIsAnnModalOpen(false);
      fetchAdminData();
    } catch (err) {
      alert("Save announcement operation failed.");
    }
  };

  const handleDeleteAnn = async (id: number) => {
    if (!confirm("Confirm deletion?")) return;
    try {
      await adminService.deleteAnnouncement(id);
      fetchAdminData();
    } catch (err) {
      alert("Failed to delete announcement.");
    }
  };

  // --- EMAIL TEMPLATE HANDLERS ---
  const handleSaveEmailTpl = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.updateEmailTemplate(emailTplForm.name, emailTplForm);
      setIsEmailTplModalOpen(false);
      fetchAdminData();
    } catch (err) {
      alert("Failed to save template.");
    }
  };

  const handleRetryEmails = async () => {
    try {
      const res = await adminService.retryFailedEmails();
      alert(`Retried ${res.retried} emails.`);
      fetchAdminData();
    } catch (err) {
      alert("Retry failed.");
    }
  };

  // --- BACKUPS HANDLERS ---
  const handleCreateBackup = async () => {
    try {
      await adminService.createBackup();
      alert("Backup created successfully.");
      fetchAdminData();
    } catch (err) {
      alert("Backup creation failed.");
    }
  };

  const handleRestoreBackup = async (id: number) => {
    if (!confirm("WARNING: Restoring will overwrite the current database. Proceed?")) return;
    try {
      await adminService.restoreBackup(id);
      alert("Database restored successfully.");
      fetchAdminData();
    } catch (err) {
      alert("Restore failed.");
    }
  };

  const handleDeleteBackup = async (id: number) => {
    if (!confirm("Delete backup file?")) return;
    try {
      await adminService.deleteBackup(id);
      fetchAdminData();
    } catch (err) {
      alert("Failed to delete backup.");
    }
  };

  // --- ADMINS HANDLERS ---
  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (adminForm.id > 0) {
        await adminService.editAdmin(adminForm.id, adminForm);
      } else {
        await adminService.createAdmin(adminForm);
      }
      setIsAdminModalOpen(false);
      fetchAdminData();
    } catch (err) {
      alert("Save admin account failed.");
    }
  };

  const handleResetAdminPass = async (id: number) => {
    try {
      const res = await adminService.resetAdminPassword(id);
      alert(`Password reset successfully. Temp password is: ${res.temporary_password}`);
    } catch (err) {
      alert("Failed to reset password.");
    }
  };

  const handleForceLogoutAdmin = async (id: number) => {
    try {
      await adminService.forceLogoutAdmin(id);
      alert("Admin forced logout success.");
    } catch (err) {
      alert("Force logout failed.");
    }
  };

  // --- GLOBAL SEARCH ---
  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearchQuery.trim()) return;
    try {
      const res = await adminService.globalSearch(globalSearchQuery);
      setGlobalSearchResults(res);
    } catch (err) {
      console.error(err);
    }
  };

  // Test provider connection
  const testProvider = async (slug: string) => {
    try {
      setTestingProvider(slug);
      setTestResult(null);
      const res = await aiAdminService.testProvider(slug);
      setTestResult(res);
    } catch (err) {
      setTestResult({ status: "Failed", latency: "Timeout", quota: "Exceeded" });
    } finally {
      setTestingProvider(null);
    }
  };

  // Key reveal submit
  const submitRevealKey = async () => {
    if (!revealingSlug || !verifyPassword.trim()) return;
    try {
      const rawKey = await aiAdminService.revealKey(revealingSlug, verifyPassword);
      setRevealedKey(rawKey);
      setKeyCountdown(10);
      setIsRevealModalOpen(false);
      setVerifyPassword('');
    } catch (err) {
      alert("Verification failed. Incorrect Admin password.");
    }
  };

  // Export logs CSV helper
  const handleExportCSV = () => {
    window.open('/api/admin/logs/export', '_blank');
  };

  // Toggles settings in security
  const handleSecurityToggle = async (key: keyof AISecuritySettings) => {
    if (!aiSettings) return;
    try {
      const updated = { ...aiSettings, [key]: !aiSettings[key] };
      setAiSettings(updated);
      await aiAdminService.saveSettings(updated);
    } catch (err) {
      console.error("Save settings toggle failed:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-10 min-h-screen pb-12 w-full">
        <div className="h-16 w-full bg-slate-200/50 rounded-3xl animate-pulse" />
        <div className="h-44 w-full bg-slate-200/50 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-72 bg-slate-200/50 rounded-3xl animate-pulse" />
          <div className="h-72 bg-slate-200/50 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">

      {/* GLOBAL SEARCH HEADER BAR */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
        <form onSubmit={handleGlobalSearch} className="flex gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Global System Search (Students, Departments, Announcements...)"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 focus:border-blue-500 focus:outline-none text-xs text-slate-700 font-medium transition-smooth"
            />
          </div>
          <Button type="submit" variant="primary" size="sm" className="bg-slate-800 hover:bg-slate-900 font-bold">
            Search
          </Button>
        </form>

        {globalSearchResults && (
          <div className="mt-5 border-t border-slate-100 pt-4 text-left">
            <div className="flex justify-between items-center mb-3">
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Results</h5>
              <button onClick={() => setGlobalSearchResults(null)} className="text-[10px] text-slate-450 hover:text-slate-700 font-bold uppercase">Clear</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Students</span>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {globalSearchResults.students.length === 0 ? <li className="text-[11px] text-slate-400">No students found</li> : 
                    globalSearchResults.students.map((s: any) => (
                      <li key={s.roll_number} className="p-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-700">
                        {s.student_name} ({s.roll_number}) - Dept: {s.department}
                      </li>
                    ))
                  }
                </ul>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Departments</span>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {globalSearchResults.departments.length === 0 ? <li className="text-[11px] text-slate-400">No departments found</li> : 
                    globalSearchResults.departments.map((d: any) => (
                      <li key={d.code} className="p-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-700">
                        {d.name} ({d.code})
                      </li>
                    ))
                  }
                </ul>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Announcements</span>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {globalSearchResults.announcements.length === 0 ? <li className="text-[11px] text-slate-400">No announcements found</li> : 
                    globalSearchResults.announcements.map((a: any) => (
                      <li key={a.id} className="p-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-700">
                        {a.title}
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DASHBOARD HEADER */}
      <header className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
        <div className="text-left">
          <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
            {pathname === '/admin/dashboard' && "SaaS Console Overview"}
            {pathname === '/admin/users' && "User Directory"}
            {pathname === '/admin/resumes' && "Resumes Library"}
            {pathname === '/admin/datasets' && "Dataset Management"}
            {pathname === '/admin/departments' && "Department Directory"}
            {pathname === '/admin/subjects' && "Subject Catalog"}
            {pathname === '/admin/announcements' && "Announcements & Delivery"}
            {pathname === '/admin/email' && "SMTP & Email Hub"}
            {pathname === '/admin/reports' && "Custom Analytics Reports"}
            {pathname === '/admin/backups' && "Backup Vault & Restore"}
            {pathname === '/admin/admins' && "Admin Roles & Permissions"}
            {pathname === '/admin/monitor' && "Real-Time System Monitoring"}
            {pathname === '/admin/notifications' && "System Notifications"}
            {pathname === '/admin/templates' && "Showcase Layouts"}
            {pathname === '/admin/ai' && "AI Provider Hub"}
            {pathname === '/admin/analytics' && "Gateway Analytics"}
            {pathname === '/admin/security' && "Security Management"}
            {pathname === '/admin/logs' && "Audit logs"}
            {pathname === '/admin/settings' && "System Configuration"}
          </h2>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
            Bimba AI administration workspace
          </span>
        </div>
        <Button onClick={fetchAdminData} variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50 gap-1.5 font-bold shrink-0">
          <RefreshCw size={14} /> Sync Database
        </Button>
      </header>

      {/* 1. OVERVIEW VIEW */}
      {pathname === '/admin/dashboard' && stats && (
        <div className="flex flex-col gap-8 animate-fadeIn">
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { label: 'Total Users', val: stats.totalUsers, icon: Users, desc: 'Registered Students' },
              { label: 'Active Sessions', val: stats.activeUsers, icon: CheckCircle, desc: 'Activated credentials' },
              { label: 'AI Requests', val: stats.aiRequests, icon: Cpu, desc: 'Gateway queries count' },
              { label: 'Created Resumes', val: stats.totalResumes, icon: FileText, desc: 'In database files' },
              { label: 'Downloads Triggered', val: stats.downloads, icon: Download, desc: 'PDF / DOCX formats' },
              { label: 'Average ATS Score', val: `${stats.averageAtsScore}%`, icon: Shield, desc: 'Portfolio standard' }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm hover:shadow transition-all duration-250">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{card.label}</span>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">{card.val}</h3>
                    </div>
                    <div className="w-10 h-10 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                      <Icon size={18} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-450 mt-3 font-semibold">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. USER MANAGEMENT VIEW */}
      {pathname === '/admin/users' && (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex flex-col gap-5 animate-fadeIn">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-grow max-w-md w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Search roll numbers, emails..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200/80 focus:border-blue-500 focus:outline-none text-xs text-slate-700 placeholder:text-slate-400 transition-smooth"
              />
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Filter size={14} className="text-slate-400" />
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-semibold focus:outline-none text-slate-700 cursor-pointer"
              >
                <option value="All">All States</option>
                <option value="Active">Active Status</option>
                <option value="Suspended">Suspended Status</option>
              </select>
            </div>
          </div>

          {/* User list table */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Dept / Semester</th>
                  <th className="py-3 px-4">Resumes</th>
                  <th className="py-3 px-4">State Status</th>
                  <th className="py-3 px-4 text-right">Actions Panel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users
                  .filter(u => u.roll_number.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                  .filter(u => userFilter === 'All' || u.status === userFilter)
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-smooth">
                      <td className="py-3.5 px-4 font-bold text-slate-750">{u.roll_number}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-650">{u.email}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-500">{u.department} (Sem {u.semester})</td>
                      <td className="py-3.5 px-4 font-bold text-slate-600">{u.resumes_count} resumes</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          u.status === 'Active' 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                            : 'bg-red-50 border-red-100 text-red-600'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right flex items-center justify-end gap-2">
                        {u.status === 'Active' ? (
                          <button 
                            onClick={() => handleUserAction(u.roll_number, 'suspend')}
                            className="px-2.5 py-1 rounded-lg border border-red-200 text-[10px] font-bold text-red-600 hover:bg-red-50 cursor-pointer transition-smooth"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleUserAction(u.roll_number, 'activate')}
                            className="px-2.5 py-1 rounded-lg border border-emerald-200 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-smooth"
                          >
                            Activate
                          </button>
                        )}
                        <button 
                          onClick={() => handleUserAction(u.roll_number, 'reset_password')}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-smooth"
                          title="Reset details"
                        >
                          Reset Pass
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. RESUMES MANAGEMENT VIEW */}
      {pathname === '/admin/resumes' && (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex flex-col gap-5 animate-fadeIn">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search resumes name, student roll..."
              value={resumeSearch}
              onChange={(e) => setResumeSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200/80 focus:border-blue-500 focus:outline-none text-xs text-slate-700 placeholder:text-slate-400 transition-smooth"
            />
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                  <th className="py-3 px-4">Resume Name</th>
                  <th className="py-3 px-4">Author Student</th>
                  <th className="py-3 px-4">Design Template</th>
                  <th className="py-3 px-4">ATS Match</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resumes
                  .filter(r => r.name.toLowerCase().includes(resumeSearch.toLowerCase()) || r.student_roll.toLowerCase().includes(resumeSearch.toLowerCase()))
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-smooth">
                      <td className="py-3.5 px-4 font-bold text-slate-750">{r.name}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600">{r.student_roll}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-500">{r.template}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-blue-50 border border-blue-100 text-blue-650 px-2 py-0.5 rounded text-[10px] font-bold">
                          ATS {r.ats_score}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-450">{r.status}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => handleDeleteResume(r.id)}
                          className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 text-red-650 hover:bg-red-500 hover:text-white transition-smooth flex items-center justify-center ml-auto cursor-pointer"
                          title="Delete from system"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DATASET MANAGER VIEW */}
      {pathname === '/admin/datasets' && (
        <div className="flex flex-col gap-8 animate-fadeIn text-left">
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex flex-col gap-5">
            <h3 className="font-extrabold text-sm text-slate-800">Upload Dataset (CSV or Excel)</h3>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-6 cursor-pointer w-full md:w-80 transition-smooth">
                <Database className="text-slate-400" size={24} />
                <span className="text-xs font-bold text-slate-600">Select CSV / XLSX File</span>
                <input type="file" accept=".csv,.xlsx" onChange={handleDatasetUpload} className="hidden" />
              </label>

              <a href="/api/admin/dataset/template" download className="text-xs font-bold text-blue-600 hover:underline">
                Download CSV Sample Template
              </a>
            </div>

            {uploadPreview && (
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs text-slate-700">Previewing File: {uploadPreview.filename}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Total Rows: {uploadPreview.total} | Valid: {uploadPreview.valid} | Issues: {uploadPreview.failed}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => commitDatasetImport('merge')} variant="primary" size="sm" className="bg-blue-600 font-bold">
                      Merge Import
                    </Button>
                    <Button onClick={() => commitDatasetImport('replace')} variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 font-bold">
                      Replace Import
                    </Button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto no-scrollbar border-t border-slate-200 pt-3">
                  <table className="w-full text-xs font-medium border-collapse text-left">
                    <thead>
                      <tr className="text-slate-400 font-bold uppercase text-[9px]">
                        <th className="py-2 px-3">Roll Number</th>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">DOB</th>
                        <th className="py-2 px-3">Dept</th>
                        <th className="py-2 px-3">Sem</th>
                        <th className="py-2 px-3">Validation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {uploadPreview.records.map((r: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-bold">{r.roll_number}</td>
                          <td className="py-2 px-3">{r.student_name}</td>
                          <td className="py-2 px-3">{r.email}</td>
                          <td className="py-2 px-3">{r.dob}</td>
                          <td className="py-2 px-3">{r.department}</td>
                          <td className="py-2 px-3">{r.semester}</td>
                          <td className="py-2 px-3">
                            {r.issues && r.issues.length > 0 ? (
                              <span className="text-rose-500 font-bold text-[10px]">{r.issues.join(", ")}</span>
                            ) : (
                              <span className="text-emerald-600 font-bold text-[10px]">Valid ({r.is_update ? 'Update' : 'New'})</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">Dataset Import History</h3>
            <table className="w-full text-xs text-left border-collapse font-medium">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Imported / Updated</th>
                  <th className="py-3 px-4">Skipped / Failed</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datasets.map((d) => (
                  <tr key={d.id}>
                    <td className="py-3.5 px-4 font-bold">{d.filename}</td>
                    <td className="py-3.5 px-4 uppercase">{d.import_type}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-600">+{d.imported_count} / ~{d.updated_count}</td>
                    <td className="py-3.5 px-4 font-semibold text-rose-500">{d.skipped_count} / {d.failed_count}</td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(d.created_at).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      {d.rollback_status === 'Active' ? (
                        <button onClick={() => handleRollbackImport(d.id)} className="text-[10px] text-red-650 hover:bg-red-50 border border-red-150 px-2 py-1 rounded-lg font-bold">
                          Rollback
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Rolled Back</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEPARTMENTS VIEW */}
      {pathname === '/admin/departments' && (
        <div className="flex flex-col gap-6 animate-fadeIn text-left">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-800">Academic Departments</h3>
            <Button onClick={() => {
              setDeptForm({ id: 0, code: '', name: '', description: '', hod_name: '', status: 'Active' });
              setIsDeptModalOpen(true);
            }} variant="primary" size="sm" className="bg-blue-600 gap-1.5 font-bold">
              <Plus size={14} /> Create Department
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {departments.map((d) => (
              <div key={d.id} className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between min-h-60 shadow-sm">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-base text-slate-850">{d.name}</h4>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">Code: {d.code}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${d.status === 'Active' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                      {d.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {d.description || "No description provided."}
                  </p>

                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Students</span>
                      <h5 className="text-sm font-black text-slate-700 mt-1">{d.student_count || 120}</h5>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Subjects</span>
                      <h5 className="text-sm font-black text-slate-700 mt-1">{d.subject_count || 8}</h5>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Faculty</span>
                      <h5 className="text-sm font-black text-slate-700 mt-1">{d.faculty_count || 6}</h5>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-450">HOD: {d.hod_name || "Unassigned"}</span>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setDeptForm({ id: d.id, code: d.code, name: d.name, description: d.description, hod_name: d.hod_name, status: d.status });
                      setIsDeptModalOpen(true);
                    }} className="text-[10px] text-blue-600 font-bold hover:underline">Edit</button>
                    <button onClick={() => handleDeleteDept(d.id)} className="text-[10px] text-red-600 font-bold hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Department Create/Edit Modal */}
          {isDeptModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
              <form onSubmit={handleSaveDept} className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-xl text-left">
                <h4 className="text-base font-extrabold text-slate-800 mb-4">{deptForm.id > 0 ? "Edit Department" : "Create Department"}</h4>
                
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Department Code</label>
                    <input type="text" disabled={deptForm.id > 0} value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" placeholder="e.g. CS" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Department Name</label>
                    <input type="text" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" placeholder="e.g. Computer Science" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Description</label>
                    <textarea value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" placeholder="..." rows={3} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">HOD Name</label>
                    <input type="text" value={deptForm.hod_name} onChange={(e) => setDeptForm({ ...deptForm, hod_name: e.target.value })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" placeholder="e.g. Dr. Alan Turing" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Status</label>
                    <select value={deptForm.status} onChange={(e) => setDeptForm({ ...deptForm, status: e.target.value })} className="w-full pl-3 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 cursor-pointer">
                      <option value="Active">Active</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setIsDeptModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50">Cancel</button>
                  <Button type="submit" variant="primary" size="sm" className="bg-blue-600 font-bold">Save Department</Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* SUBJECTS VIEW */}
      {pathname === '/admin/subjects' && (
        <div className="flex flex-col gap-6 animate-fadeIn text-left">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-800">Academic Subjects</h3>
            <Button onClick={() => {
              setSubjForm({ id: 0, code: '', name: '', department_code: '', semester: 3, credits: 3, faculty_name: '' });
              setIsSubjModalOpen(true);
            }} variant="primary" size="sm" className="bg-blue-600 gap-1.5 font-bold">
              <Plus size={14} /> Add Subject
            </Button>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
            <table className="w-full text-xs text-left border-collapse font-medium">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4">Dept / Semester</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4">Students Enrolled</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3.5 px-4 font-bold">{s.code}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-850">{s.name}</td>
                    <td className="py-3.5 px-4">{s.department_code} (Sem {s.semester})</td>
                    <td className="py-3.5 px-4 font-bold">{s.credits} Credits</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">{s.faculty_name || "Unassigned"}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-500">{s.students_enrolled || 0} students</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${s.status === 'Active' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right flex items-center justify-end gap-2">
                      <button onClick={() => {
                        setSubjForm({ id: s.id, code: s.code, name: s.name, department_code: s.department_code, semester: s.semester, credits: s.credits, faculty_name: s.faculty_name });
                        setIsSubjModalOpen(true);
                      }} className="text-[10px] text-blue-600 font-bold hover:underline">Edit</button>
                      {s.status === 'Active' && (
                        <button onClick={() => handleArchiveSubj(s.id)} className="text-[10px] text-amber-600 font-bold hover:underline">Archive</button>
                      )}
                      <button onClick={() => handleDeleteSubj(s.id)} className="text-[10px] text-red-650 font-bold hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subject Add/Edit Modal */}
          {isSubjModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
              <form onSubmit={handleSaveSubj} className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-xl text-left">
                <h4 className="text-base font-extrabold text-slate-800 mb-4">{subjForm.id > 0 ? "Edit Subject" : "Create Subject"}</h4>
                
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Subject Code</label>
                    <input type="text" disabled={subjForm.id > 0} value={subjForm.code} onChange={(e) => setSubjForm({ ...subjForm, code: e.target.value })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" placeholder="e.g. CS301" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Subject Name</label>
                    <input type="text" value={subjForm.name} onChange={(e) => setSubjForm({ ...subjForm, name: e.target.value })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" placeholder="e.g. Database Systems" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Department Code</label>
                    <input type="text" value={subjForm.department_code} onChange={(e) => setSubjForm({ ...subjForm, department_code: e.target.value })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" placeholder="e.g. CS" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Semester Assignment</label>
                    <input type="number" min={1} max={8} value={subjForm.semester} onChange={(e) => setSubjForm({ ...subjForm, semester: parseInt(e.target.value) })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Credits</label>
                    <input type="number" min={1} max={5} value={subjForm.credits} onChange={(e) => setSubjForm({ ...subjForm, credits: parseInt(e.target.value) })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Faculty In-Charge</label>
                    <input type="text" value={subjForm.faculty_name} onChange={(e) => setSubjForm({ ...subjForm, faculty_name: e.target.value })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" placeholder="Prof. Jane Doe" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setIsSubjModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50">Cancel</button>
                  <Button type="submit" variant="primary" size="sm" className="bg-blue-600 font-bold">Save Subject</Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ANNOUNCEMENTS VIEW */}
      {pathname === '/admin/announcements' && (
        <div className="flex flex-col gap-6 animate-fadeIn text-left">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-800">College Announcements</h3>
            <Button onClick={() => {
              setAnnForm({ id: 0, title: '', content: '', status: 'Published', pinned: false, target_audience: 'Entire College', target_value: '' });
              setIsAnnModalOpen(true);
            }} variant="primary" size="sm" className="bg-blue-600 gap-1.5 font-bold">
              <Plus size={14} /> Create Announcement
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {announcements.map((a) => (
              <div key={a.id} className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between min-h-60 shadow-sm relative overflow-hidden">
                {a.pinned && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-bl-xl tracking-wider">
                    Pinned
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-start pr-12">
                    <div>
                      <h4 className="font-extrabold text-base text-slate-850 leading-tight">{a.title}</h4>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">
                        Target: {a.target_audience} {a.target_value && `(${a.target_value})`}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mt-4 bg-slate-50 border border-slate-100 p-3.5 rounded-2xl max-h-36 overflow-y-auto no-scrollbar">
                    {a.content}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-450 uppercase mt-4">
                  <span>Reads: {a.read_count || 0} students</span>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setAnnForm({ id: a.id, title: a.title, content: a.content, status: a.status, pinned: a.pinned, target_audience: a.target_audience, target_value: a.target_value });
                      setIsAnnModalOpen(true);
                    }} className="text-[10px] text-blue-605 font-bold hover:underline">Edit</button>
                    <button onClick={() => handleDeleteAnn(a.id)} className="text-[10px] text-red-650 font-bold hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Announcement Create/Edit Modal */}
          {isAnnModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
              <form onSubmit={handleSaveAnn} className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-xl text-left">
                <h4 className="text-base font-extrabold text-slate-800 mb-4">{annForm.id > 0 ? "Edit Announcement" : "Create Announcement"}</h4>
                
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Announcement Title</label>
                    <input type="text" value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" placeholder="Enter headline..." required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Rich Text Content</label>
                    <textarea value={annForm.content} onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" placeholder="Type core updates details..." rows={5} required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Target Audience</label>
                      <select value={annForm.target_audience} onChange={(e) => setAnnForm({ ...annForm, target_audience: e.target.value })} className="w-full pl-3 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 cursor-pointer">
                        <option value="Entire College">Entire College</option>
                        <option value="Department">Department</option>
                        <option value="Semester">Semester</option>
                        <option value="Section">Section</option>
                        <option value="Individual Student">Individual Student</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Target Identifier / Value</label>
                      <input type="text" value={annForm.target_value} onChange={(e) => setAnnForm({ ...annForm, target_value: e.target.value })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" placeholder="e.g. CS, 3, BCA25008" />
                    </div>
                  </div>

                  <div className="flex gap-6 mt-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-650 cursor-pointer select-none">
                      <input type="checkbox" checked={annForm.pinned} onChange={(e) => setAnnForm({ ...annForm, pinned: e.target.checked })} className="rounded text-blue-600 focus:ring-blue-500" />
                      Pin Announcement to Top
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setIsAnnModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50">Cancel</button>
                  <Button type="submit" variant="primary" size="sm" className="bg-blue-600 font-bold">Publish / Save</Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* EMAIL CENTER VIEW */}
      {pathname === '/admin/email' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn text-left">
          
          {/* SMTP Config Panel */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
              <h3 className="font-extrabold text-sm text-slate-800">SMTP Core Configurations</h3>
              <div className="flex flex-col gap-3.5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Host Address</label>
                  <input type="text" className="w-full pl-4 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700" value="smtp.gmail.com" readOnly />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Port</label>
                    <input type="number" className="w-full pl-4 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700" value={587} readOnly />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Encryption</label>
                    <input type="text" className="w-full pl-4 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700" value="TLS" readOnly />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Username</label>
                  <input type="text" className="w-full pl-4 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700" value="admin@bimba.ai" readOnly />
                </div>
              </div>

              <div className="flex gap-3 mt-4 border-t border-slate-100 pt-4">
                <Button onClick={async () => {
                  const res = await adminService.testEmailConfig({});
                  alert(res.message);
                }} variant="primary" size="sm" className="bg-blue-600 font-bold flex-grow">
                  Test SMTP Connection
                </Button>
              </div>
            </div>

            {/* Email Templates list */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-800 mb-4">System Email Templates</h3>
              <div className="flex flex-col gap-3">
                {emailTemplates.map((t) => (
                  <div key={t.name} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-750">{t.name}</h4>
                      <p className="text-[10px] text-slate-450 mt-1 font-semibold">Subject: {t.subject}</p>
                    </div>
                    <button onClick={() => {
                      setEmailTplForm({ name: t.name, subject: t.subject, body: t.body });
                      setIsEmailTplModalOpen(true);
                    }} className="text-[10px] text-blue-600 font-bold hover:underline">Edit</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Email Delivery logs / queue */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-sm text-slate-800">Email Delivery Logs & Queue</h3>
                <button onClick={handleRetryEmails} className="text-[10px] border border-amber-200 text-amber-600 hover:bg-amber-50 px-2.5 py-1 rounded-xl font-bold">
                  Retry Failed
                </button>
              </div>

              <div className="max-h-[500px] overflow-y-auto no-scrollbar flex flex-col gap-3">
                {emailLogs.map((l) => (
                  <div key={l.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-left">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-slate-750">{l.recipient}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${l.status === 'Sent' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                        {l.status}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-700 mt-1">{l.subject}</h5>
                    {l.error_message && <p className="text-[9px] text-rose-500 font-bold mt-1 uppercase">Error: {l.error_message}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Email Template Edit Modal */}
          {isEmailTplModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
              <form onSubmit={handleSaveEmailTpl} className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-xl text-left">
                <h4 className="text-base font-extrabold text-slate-800 mb-4">Edit Email Template: {emailTplForm.name}</h4>
                
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Subject</label>
                    <input type="text" value={emailTplForm.subject} onChange={(e) => setEmailTplForm({ ...emailTplForm, subject: e.target.value })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Body Context</label>
                    <textarea value={emailTplForm.body} onChange={(e) => setEmailTplForm({ ...emailTplForm, body: e.target.value })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" rows={8} required />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setIsEmailTplModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50">Cancel</button>
                  <Button type="submit" variant="primary" size="sm" className="bg-blue-600 font-bold">Save Template</Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* REPORTS VIEW */}
      {pathname === '/admin/reports' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn text-left">
          {[
            { type: 'student', title: 'Student Enrollment Report', desc: 'Comprehensive list of registered students, status, dept, semester' },
            { type: 'resume', title: 'Resume Optimizations Report', desc: 'Summary of all CV files, template designs used, average ATS scores' },
            { type: 'ai_usage', title: 'AI Gateway Usage Report', desc: 'Request count per student, model cascades, average API latency' }
          ].map((rep) => (
            <div key={rep.type} className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between min-h-52 shadow-sm hover:shadow transition-all">
              <div>
                <h4 className="font-extrabold text-sm text-slate-800">{rep.title}</h4>
                <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {rep.desc}
                </p>
              </div>
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <Button onClick={() => window.open(`/api/admin/reports?report_type=${rep.type}&format=csv`, '_blank')} variant="primary" size="sm" className="bg-blue-600 font-bold flex-grow">
                  Download CSV Report
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BACKUPS VIEW */}
      {pathname === '/admin/backups' && (
        <div className="flex flex-col gap-6 animate-fadeIn text-left">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-800">Database Backup & Restore Vault</h3>
            <Button onClick={handleCreateBackup} variant="primary" size="sm" className="bg-blue-600 gap-1.5 font-bold">
              <DownloadCloud size={14} /> Create Manual Backup
            </Button>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
            <table className="w-full text-xs text-left border-collapse font-medium">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                  <th className="py-3 px-4">Backup Filename</th>
                  <th className="py-3 px-4">Backup Type</th>
                  <th className="py-3 px-4">Storage size</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backups.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{b.filename}</td>
                    <td className="py-3.5 px-4">{b.backup_type}</td>
                    <td className="py-3.5 px-4">{(b.size_bytes / 1024).toFixed(1)} KB</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${b.status === 'Success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(b.created_at).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right flex items-center justify-end gap-2">
                      <button onClick={() => handleRestoreBackup(b.id)} className="text-[10px] text-emerald-600 font-bold hover:underline">Restore</button>
                      <button onClick={() => handleDeleteBackup(b.id)} className="text-[10px] text-red-650 font-bold hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADMIN ROLES VIEW */}
      {pathname === '/admin/admins' && (
        <div className="flex flex-col gap-6 animate-fadeIn text-left">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-slate-800">Console Administrators Registry</h3>
            <Button onClick={() => {
              setAdminForm({ id: 0, username: '', email: '', password: '', role: 'admin', is_active: true });
              setIsAdminModalOpen(true);
            }} variant="primary" size="sm" className="bg-blue-600 gap-1.5 font-bold">
              <Plus size={14} /> Create Admin
            </Button>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
            <table className="w-full text-xs text-left border-collapse font-medium">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role Permission</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map((ad) => (
                  <tr key={ad.id}>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{ad.username}</td>
                    <td className="py-3.5 px-4">{ad.email}</td>
                    <td className="py-3.5 px-4 font-bold uppercase text-blue-600">{ad.role}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${ad.is_active ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                        {ad.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{ad.last_login ? new Date(ad.last_login).toLocaleString() : "Never"}</td>
                    <td className="py-3.5 px-4 text-right flex items-center justify-end gap-2">
                      <button onClick={() => {
                        setAdminForm({ id: ad.id, username: ad.username, email: ad.email, password: '', role: ad.role, is_active: ad.is_active });
                        setIsAdminModalOpen(true);
                      }} className="text-[10px] text-blue-600 font-bold hover:underline">Edit</button>
                      <button onClick={() => handleResetAdminPass(ad.id)} className="text-[10px] text-amber-600 font-bold hover:underline">Reset Pass</button>
                      <button onClick={() => handleForceLogoutAdmin(ad.id)} className="text-[10px] text-slate-500 font-bold hover:underline">Force Out</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Admin Create/Edit Modal */}
          {isAdminModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
              <form onSubmit={handleSaveAdmin} className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-xl text-left">
                <h4 className="text-base font-extrabold text-slate-800 mb-4">{adminForm.id > 0 ? "Edit Admin" : "Create Admin"}</h4>
                
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Username</label>
                    <input type="text" disabled={adminForm.id > 0} value={adminForm.username} onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" placeholder="admin_name" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Email</label>
                    <input type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" placeholder="admin@example.com" required />
                  </div>
                  {adminForm.id === 0 && (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Password</label>
                      <input type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700" required />
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Role Permission Matrix</label>
                    <select value={adminForm.role} onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })} className="w-full pl-3 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 cursor-pointer">
                      <option value="super_admin">Super Admin (Full Access)</option>
                      <option value="admin">Admin (Modify Academics/Users)</option>
                      <option value="moderator">Moderator (Edit Announcements/Templates)</option>
                      <option value="viewer">Viewer (Read-Only)</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-650 cursor-pointer select-none">
                      <input type="checkbox" checked={adminForm.is_active} onChange={(e) => setAdminForm({ ...adminForm, is_active: e.target.checked })} className="rounded text-blue-600" />
                      Account Active
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setIsAdminModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50">Cancel</button>
                  <Button type="submit" variant="primary" size="sm" className="bg-blue-600 font-bold">Save Admin</Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* SYSTEM MONITOR VIEW */}
      {pathname === '/admin/monitor' && systemHealth && (
        <div className="flex flex-col gap-8 animate-fadeIn text-left">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm text-center">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">CPU Usage</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{systemHealth.cpu}%</h3>
            </div>
            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm text-center">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">RAM Usage</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{systemHealth.ram}%</h3>
            </div>
            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm text-center">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Disk Partition</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{systemHealth.disk}%</h3>
            </div>
            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm text-center">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Server Uptime</span>
              <h3 className="text-[11px] font-black text-emerald-600 mt-2">{systemHealth.uptime}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-800 mb-4">Historical Monitor Logs</h3>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-xs text-left border-collapse font-medium">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px]">
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">CPU Usage</th>
                    <th className="py-3 px-4">Memory Usage</th>
                    <th className="py-3 px-4">API Latency</th>
                    <th className="py-3 px-4">DB Queries</th>
                    <th className="py-3 px-4">Request Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {systemHealth.history.map((h, idx) => (
                    <tr key={idx}>
                      <td className="py-3.5 px-4 font-semibold text-slate-450">{new Date(h.timestamp).toLocaleTimeString()}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">{h.cpu}%</td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">{h.ram}%</td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{h.latency}ms</td>
                      <td className="py-3.5 px-4 text-slate-650 font-bold">{h.queries} queries</td>
                      <td className="py-3.5 px-4 text-slate-500 font-semibold">{h.rate} req/s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS CENTER VIEW */}
      {pathname === '/admin/notifications' && (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm animate-fadeIn text-left">
          <h3 className="font-extrabold text-sm text-slate-800 mb-4">System Alerts & Notifications</h3>
          <div className="flex flex-col gap-3">
            {notifications.map((n) => (
              <div key={n.id} className={`flex justify-between items-center p-4 rounded-2xl border ${n.is_read ? 'bg-slate-50 border-slate-100 text-slate-500' : 'bg-blue-50/30 border-blue-100 text-slate-800'}`}>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider block text-slate-400">{n.type}</span>
                  <p className="text-xs font-semibold mt-1 leading-snug">{n.message}</p>
                </div>
                <div className="flex gap-2">
                  {!n.is_read && (
                    <button onClick={async () => {
                      await adminService.markNotificationRead(n.id);
                      fetchAdminData();
                    }} className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-sm">
                      <Check size={14} />
                    </button>
                  )}
                  <button onClick={async () => {
                    await adminService.deleteNotification(n.id);
                    fetchAdminData();
                  }} className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-red-650 shadow-sm">
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TEMPLATE MANAGEMENT VIEW */}
      {pathname === '/admin/templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          {templates.map((t) => (
            <div key={t.id} className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between h-56 shadow-sm hover:shadow transition-all duration-250">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800">{t.name}</h4>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 block">{t.category} template</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.8 rounded-lg border ${
                    t.is_active 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}>
                    {t.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-500 leading-relaxed mt-4 bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  {t.description}
                </p>
              </div>

              <div className="flex justify-between items-center pt-3.5 border-t border-slate-100 text-[10px] font-bold text-slate-450 uppercase">
                <span>ATS Quality: {t.score}%</span>
                <button className="text-blue-600 hover:text-blue-700 cursor-pointer">Configure</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. AI GATEWAY MANAGEMENT VIEW */}
      {pathname === '/admin/ai' && aiAnalytics && (
        <div className="flex flex-col gap-8 animate-fadeIn">
          {/* Mini Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/60 rounded-2xl p-4.5 text-center shadow-sm">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Connected Channels</span>
              <h3 className="text-xl font-black text-slate-800 mt-1">{aiAnalytics.providersOnline}</h3>
            </div>
            <div className="bg-white border border-slate-200/60 rounded-2xl p-4.5 text-center shadow-sm">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Daily Queries</span>
              <h3 className="text-xl font-black text-slate-800 mt-1">{aiAnalytics.requestsToday}</h3>
            </div>
            <div className="bg-white border border-slate-200/60 rounded-2xl p-4.5 text-center shadow-sm">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Avg Latency</span>
              <h3 className="text-xl font-black text-slate-800 mt-1">{aiAnalytics.averageResponse}</h3>
            </div>
            <div className="bg-white border border-slate-200/60 rounded-2xl p-4.5 text-center shadow-sm">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Cascades fallback</span>
              <h3 className="text-xl font-black text-rose-500 mt-1">{aiAnalytics.fallbackUsed}</h3>
            </div>
          </div>

          {/* AI Providers list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aiProviders.map((p) => {
              const isKeyShown = revealedKey && revealingSlug === p.slug;
              return (
                <div key={p.slug} className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between min-h-64 shadow-sm">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-850">{p.name}</h4>
                        <span className="text-[9px] font-black text-slate-400 uppercase mt-0.5 block">Priority {p.priority}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded border ${
                        p.status === 'Healthy' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                          : 'bg-blue-50 border-blue-200 text-blue-600'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    {/* Masked credentials block */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4.5 my-4">
                      <span className="text-[9px] font-black text-slate-400 uppercase font-sans text-left block">Encrypted Key</span>
                      <div className="flex items-center justify-between gap-3 mt-1.5">
                        <code className="text-xs font-bold text-slate-700 tracking-wider truncate flex-grow text-left">
                          {isKeyShown ? revealedKey : p.masked_key}
                        </code>
                        <button
                          onClick={() => {
                            if (isKeyShown) {
                              setRevealedKey(null);
                            } else {
                              setRevealingSlug(p.slug);
                              setIsRevealModalOpen(true);
                            }
                          }}
                          className="text-slate-400 hover:text-slate-700 transition-smooth p-1 cursor-pointer"
                        >
                          {isKeyShown ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {isKeyShown && (
                        <p className="text-[9px] text-orange-600 font-bold mt-2 uppercase text-left">
                          ⏳ Auto-hiding key in {keyCountdown}s
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button 
                      onClick={() => testProvider(p.slug)}
                      variant="primary" 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 font-bold"
                    >
                      Test Conn
                    </Button>
                    <Button variant="outline" size="sm" className="border-slate-200 text-slate-650 hover:bg-slate-50 font-bold">
                      Update Key
                    </Button>
                  </div>

                  {testingProvider === p.slug && (
                    <div className="mt-3.5 bg-blue-50 border border-blue-200 rounded-xl p-2 text-center text-xs font-bold text-blue-600 animate-pulse">
                      Testing Connection...
                    </div>
                  )}

                  {testResult && revealingSlug === p.slug && !testingProvider && (
                    <div className="mt-3 bg-emerald-50 border border-emerald-250 rounded-xl p-3 text-xs text-emerald-800 text-left">
                      <div className="flex justify-between items-center font-bold">
                        <span>Latency: {testResult.latency}</span>
                        <span>{testResult.status}</span>
                      </div>
                      <p className="text-[10px] text-slate-450 mt-1">Quota: {testResult.quota}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. ANALYTICS TABS */}
      {pathname === '/admin/analytics' && aiAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {/* Provider usage chart */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm text-left">
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Cascade split</span>
            <h4 className="font-extrabold text-sm text-slate-800 mt-1">Provider Requests split</h4>
            
            <div className="flex flex-col gap-4 mt-6">
              {Object.entries(aiAnalytics.usage).map(([name, count]) => {
                const total = Object.values(aiAnalytics.usage).reduce((a: number, b: number) => a + b, 0) || 1;
                const percent = Math.round((count / total) * 100);
                return (
                  <div key={name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 uppercase">{name}</span>
                      <span className="text-slate-400">{count} queries ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/10">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Features distribution */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm text-left">
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Features breakdown</span>
            <h4 className="font-extrabold text-sm text-slate-800 mt-1">AI features distribution</h4>
            
            <div className="flex flex-col gap-4 mt-6">
              {Object.entries(aiAnalytics.features).map(([feat, percent]) => (
                <div key={feat} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">{feat}</span>
                    <span className="text-slate-450">{percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/10">
                    <div className="bg-purple-650 h-full rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. SECURITY SETTINGS VIEW */}
      {pathname === '/admin/security' && aiSettings && (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm animate-fadeIn text-left">
          <div className="border-b border-slate-100 pb-3 mb-6">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gateway Firewall</span>
            <h4 className="text-base font-extrabold text-slate-800 mt-1">Backend Protection Filters</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'jwt_enabled', label: 'JWT Authorization signature enforce', desc: 'Require verification signature check on active user queries' },
              { key: 'https_enabled', label: 'HTTPS Protocol Redirect enforce', desc: 'Secure SSL tunnel redirects automatically' },
              { key: 'rate_limit_enabled', label: 'Rate Limiter', desc: 'Limit user queries to 50 requests per minute' },
              { key: 'firewall_enabled', label: 'Gateway Application Firewall', desc: 'Block dangerous scripts automatically' },
              { key: 'xss_protected', label: 'XSS Injection Shield', desc: 'Sanitize strings before routing' },
              { key: 'sql_injection_protected', label: 'SQL hijacking guard', desc: 'Parameterize all queries checks' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-6 p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
                <div className="text-left">
                  <h5 className="font-extrabold text-xs text-slate-800">{item.label}</h5>
                  <p className="text-[10px] text-slate-450 mt-1 leading-snug">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleSecurityToggle(item.key as any)}
                  className={`w-11 h-6 rounded-full transition-all duration-300 cursor-pointer p-0.5 ${
                    aiSettings[item.key as keyof AISecuritySettings] ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-all transform ${aiSettings[item.key as keyof AISecuritySettings] ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. AUDIT GATEWAY LOGS VIEW */}
      {pathname === '/admin/logs' && (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex flex-col gap-5 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Auditing Logs</span>
              <h4 className="font-extrabold text-sm text-slate-800 mt-1">Audit Gateway Logs</h4>
            </div>
            <Button onClick={handleExportCSV} variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50 gap-1.5 font-bold">
              <Download size={14} /> Export CSV
            </Button>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Admin User</th>
                  <th className="py-3 px-4">Operation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Affected Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log, idx) => {
                  const formatted = new Date(log.created_at || log.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-smooth">
                      <td className="py-3 px-4 font-semibold text-slate-450">{formatted}</td>
                      <td className="py-3 px-4 font-bold text-slate-700">{log.admin_username || log.provider}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{log.operation || log.feature}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'Success' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-rose-50 text-rose-600'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-500">{log.ip_address || log.latency}</td>
                      <td className="py-3 px-4 font-semibold text-slate-450">{log.affected_record || log.user}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. SETTINGS VIEW */}
      {pathname === '/admin/settings' && systemSettings && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm animate-fadeIn">
          <div className="border-b border-slate-100 pb-3 mb-6 text-left">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Console Config</span>
            <h4 className="text-base font-extrabold text-slate-800 mt-1">Application Settings</h4>
          </div>

          <div className="flex flex-col gap-4 text-left">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1.5 mb-1.5">Application Name</label>
              <input 
                type="text" 
                value={systemSettings.app_name}
                onChange={(e) => setSystemSettings({ ...systemSettings, app_name: e.target.value })}
                className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 focus:border-blue-500 focus:outline-none text-xs text-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1.5 mb-1.5">SMTP Host Address</label>
              <input 
                type="text" 
                value={systemSettings.smtp_host}
                onChange={(e) => setSystemSettings({ ...systemSettings, smtp_host: e.target.value })}
                className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 focus:border-blue-500 focus:outline-none text-xs text-slate-700 font-medium"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/50 rounded-2xl mt-2">
              <div className="text-left">
                <h5 className="font-extrabold text-xs text-slate-800">Maintenance Mode</h5>
                <p className="text-[10px] text-slate-450 mt-1 leading-snug">Lock user endpoints during upgrade works</p>
              </div>
              <button
                onClick={() => setSystemSettings({ ...systemSettings, maintenance_mode: !systemSettings.maintenance_mode })}
                className={`w-11 h-6 rounded-full transition-all duration-300 cursor-pointer p-0.5 ${
                  systemSettings.maintenance_mode ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-all transform ${systemSettings.maintenance_mode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <Button variant="primary" size="lg" className="bg-blue-600 hover:bg-blue-700 font-bold mt-4">
              Save Settings
            </Button>
          </div>
        </div>
      )}

      {/* REVEAL API KEY SECURITY PASSWORD CONFIRM MODAL */}
      {isRevealModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-xl text-left">
            <div className="flex items-center gap-3 text-blue-600">
              <Lock size={20} />
              <h4 className="text-base font-extrabold text-slate-800">API Key Security Verification</h4>
            </div>
            
            <p className="text-slate-500 text-xs mt-2.5 leading-relaxed">
              Confirm your Administrator credentials to temporarily decrypt and reveal the key.
            </p>

            <div className="mt-4.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1.5 mb-1.5">
                Admin Password
              </label>
              <input 
                type="password"
                placeholder="Enter password..."
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 focus:border-blue-500 focus:outline-none text-xs text-slate-700 mt-1"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => {
                  setIsRevealModalOpen(false);
                  setVerifyPassword('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <Button 
                onClick={submitRevealKey}
                variant="primary" 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 font-bold"
              >
                Reveal Secret Key
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default AdminDashboard;
