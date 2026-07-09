import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Users, FileText, Cpu, Shield, Download, Trash2, 
  CheckCircle, Search, Filter, Eye, EyeOff, Lock, RefreshCw
} from 'lucide-react';
import { Button } from '../components/Button';
import { adminService } from '../services/admin';
import type { 
  AdminDashboardData, AdminUserData, AdminResumeData, AdminTemplateData, AdminSettingsData 
} from '../services/admin';
import { aiAdminService } from '../services/aiAdmin';
import type { AIProviderData, AIAnalyticsData, AISecuritySettings } from '../services/aiAdmin';

export const AdminDashboard: React.FC = () => {
  const location = useLocation();

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

  // Fetch all admin data
  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const pathname = location.pathname;
      
      if (pathname === '/admin/dashboard') {
        const data = await adminService.getDashboard();
        setStats(data);
      } else if (pathname === '/admin/users') {
        const data = await adminService.getUsers();
        setUsers(data);
      } else if (pathname === '/admin/resumes') {
        const data = await adminService.getResumes();
        setResumes(data);
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
      console.error("Failed to retrieve admin dashboard records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [location.pathname]);

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
      alert(`User ${roll} modified successfully.`);
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

  const pathname = location.pathname;

  return (
    <div className="flex flex-col gap-8 w-full">

      {/* DASHBOARD HEADER */}
      <header className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
        <div className="text-left">
          <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
            {pathname === '/admin/dashboard' && "SaaS Console Overview"}
            {pathname === '/admin/users' && "User Directory"}
            {pathname === '/admin/resumes' && "Resumes Library"}
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
                      <span className="text-[9px] font-black text-slate-400 uppercase">Encrypted Key</span>
                      <div className="flex items-center justify-between gap-3 mt-1.5">
                        <code className="text-xs font-bold text-slate-700 tracking-wider truncate flex-grow">
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
                        <p className="text-[9px] text-orange-600 font-bold mt-2 uppercase">
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
                    <div className="mt-3 bg-emerald-50 border border-emerald-250 rounded-xl p-3 text-xs text-emerald-800">
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
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Cascade split</span>
            <h4 className="font-extrabold text-sm text-slate-800 mt-1">Provider Requests split</h4>
            
            <div className="flex flex-col gap-4 mt-6">
              {Object.entries(aiAnalytics.usage).map(([name, count]) => {
                const total = Object.values(aiAnalytics.usage).reduce((a, b) => a + b, 0) || 1;
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
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
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
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm animate-fadeIn">
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
            <div>
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
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log, idx) => {
                  const formatted = new Date(log.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-smooth">
                      <td className="py-3 px-4 font-semibold text-slate-450">{formatted}</td>
                      <td className="py-3 px-4 font-bold text-slate-700">{log.provider}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{log.feature}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'Success' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-rose-50 text-rose-600'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-500">{log.latency}</td>
                      <td className="py-3 px-4 font-semibold text-slate-450">{log.user}</td>
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
          <div className="border-b border-slate-100 pb-3 mb-6">
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
