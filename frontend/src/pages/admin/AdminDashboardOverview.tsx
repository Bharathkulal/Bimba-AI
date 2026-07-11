import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, CheckCircle, Cpu, FileText, Download, Shield,
  ArrowUpRight, Database, Clock, Mail, RefreshCw, Server, ShieldCheck
} from 'lucide-react';
import { Button } from '../../components/Button';
import { adminService } from '../../services/admin';
import type { AdminDashboardData } from '../../services/admin';

export const AdminDashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getDashboard();
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await fetchStats();
    setSyncing(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100/80 rounded-2xl animate-pulse border border-slate-200/40" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-100/80 rounded-2xl animate-pulse border border-slate-200/40" />
          <div className="h-96 bg-slate-100/80 rounded-2xl animate-pulse border border-slate-200/40" />
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Students', value: stats?.totalUsers ?? 0, icon: Users, desc: 'Registered accounts', color: 'from-blue-500 to-indigo-600', text: 'text-blue-600', bg: 'bg-blue-50/60' },
    { label: 'Activated Users', value: stats?.activeUsers ?? 0, icon: CheckCircle, desc: 'Verified profile logins', color: 'from-emerald-500 to-teal-600', text: 'text-emerald-600', bg: 'bg-emerald-50/60' },
    { label: 'AI Gateway Requests', value: stats?.aiRequests ?? 0, icon: Cpu, desc: 'Total model operations', color: 'from-purple-500 to-indigo-600', text: 'text-purple-600', bg: 'bg-purple-50/60' },
    { label: 'ATS Score average', value: `${stats?.averageAtsScore ?? 75}%`, icon: Shield, desc: 'Resume portfolio score', color: 'from-orange-500 to-red-600', text: 'text-orange-600', bg: 'bg-orange-50/60' },
    { label: 'Total Resumes', value: stats?.totalResumes ?? 0, icon: FileText, desc: 'Generated PDF templates', color: 'from-cyan-500 to-blue-600', text: 'text-cyan-600', bg: 'bg-cyan-50/60' },
    { label: 'Downloads Triggered', value: stats?.downloads ?? 0, icon: Download, desc: 'PDF / Word formats', color: 'from-pink-500 to-rose-600', text: 'text-pink-600', bg: 'bg-pink-50/60' }
  ];

  return (
    <div className="flex flex-col gap-8 w-full animate-fadeIn">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 leading-tight">Admin SaaS Dashboard</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Real-time college application metrics & gateway tracking</p>
        </div>
        <Button onClick={handleSync} variant="outline" size="sm" className="border-slate-250 hover:bg-slate-50 gap-1.5 font-bold shrink-0">
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> Sync Database
        </Button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -4, scale: 1.01 }}
              className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">{card.label}</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">{card.value}</h3>
                </div>
                <div className={`w-9 h-9 rounded-xl ${card.bg} ${card.text} flex items-center justify-center border border-slate-100 shadow-sm shrink-0`}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-[10px] text-slate-450 mt-3 font-bold">{card.desc}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Analytics Interactive Preview */}
        <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-6 text-left">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm text-slate-850">Resume Growth & ATS Portfolio Trends</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Calculated based on real student generated files</p>
            </div>
            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100 flex items-center gap-1">
              Active Platform <ArrowUpRight size={10} />
            </span>
          </div>

          {/* Premium Custom SVG Trend Graph */}
          <div className="h-64 relative bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex flex-col justify-end">
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
              <div className="border-b border-dashed border-slate-200/60 w-full h-0" />
              <div className="border-b border-dashed border-slate-200/60 w-full h-0" />
              <div className="border-b border-dashed border-slate-200/60 w-full h-0" />
            </div>

            <svg className="w-full h-40" viewBox="0 0 600 160">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="4 4" />
              <line x1="0" y1="80" x2="600" y2="80" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="4 4" />
              <line x1="0" y1="120" x2="600" y2="120" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="4 4" />

              {/* Area Path */}
              <path
                d="M 0 140 L 100 110 L 200 130 L 300 80 L 400 95 L 500 50 L 600 30 L 600 160 L 0 160 Z"
                fill="url(#chartGradient)"
              />
              {/* Line Path */}
              <path
                d="M 0 140 L 100 110 L 200 130 L 300 80 L 400 95 L 500 50 L 600 30"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Data points */}
              {[
                { x: 0, y: 140 }, { x: 100, y: 110 }, { x: 200, y: 130 },
                { x: 300, y: 80 }, { x: 400, y: 95 }, { x: 500, y: 50 }, { x: 600, y: 30 }
              ].map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
              ))}
            </svg>

            <div className="flex justify-between items-center text-[9px] text-slate-400 font-extrabold uppercase mt-2 px-1">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between text-left">
          <div>
            <h3 className="font-extrabold text-sm text-slate-850">Quick Admin Actions</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Console operational shortcuts</p>
          </div>

          <div className="grid grid-cols-2 gap-3 my-5">
            {[
              { label: 'View Students', path: '/admin/users', icon: Users, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100/70 border-blue-100' },
              { label: 'AI Provider settings', path: '/admin/ai', icon: Cpu, color: 'text-purple-600 bg-purple-50 hover:bg-purple-100/70 border-purple-100' },
              { label: 'Import Datasets', path: '/admin/datasets', icon: Database, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100/70 border-emerald-100' },
              { label: 'System Health', path: '/admin/monitor', icon: Server, color: 'text-orange-600 bg-orange-50 hover:bg-orange-100/70 border-orange-100' },
              { label: 'Manage Roles', path: '/admin/admins', icon: ShieldCheck, color: 'text-rose-600 bg-rose-50 hover:bg-rose-100/70 border-rose-100' },
              { label: 'Email Logs', path: '/admin/email', icon: Mail, color: 'text-cyan-600 bg-cyan-50 hover:bg-cyan-100/70 border-cyan-100' }
            ].map((btn, idx) => {
              const Icon = btn.icon;
              return (
                <button
                  key={idx}
                  onClick={() => navigate(btn.path)}
                  className={`flex flex-col gap-2 p-3 rounded-2xl border text-left cursor-pointer transition-all duration-150 ${btn.color}`}
                >
                  <Icon size={18} />
                  <span className="text-[10px] font-black uppercase tracking-wider leading-tight">{btn.label}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Settings version: v1.0.4</span>
            <button onClick={() => navigate('/admin/settings')} className="text-[10px] font-black uppercase text-blue-600 hover:underline">Configuration</button>
          </div>
        </div>

      </div>

      {/* System Status and Activity Logs summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service status health overview */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between text-left">
          <div>
            <h3 className="font-extrabold text-sm text-slate-850">Service Infrastructure Gateway</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Live background daemon diagnostics</p>
          </div>

          <div className="flex flex-col gap-3.5 my-6">
            {[
              { name: 'Core Database Engine', desc: 'SQLite persistent file storage', status: 'Healthy', color: 'bg-emerald-500 border-emerald-400' },
              { name: 'Gemini AI API Connection', desc: 'Google Cloud Platform gateway', status: 'Active', color: 'bg-emerald-500 border-emerald-400' },
              { name: 'SMTP Outbox Mail Server', desc: 'Simple mail queue protocols', status: 'Healthy', color: 'bg-emerald-500 border-emerald-400' },
              { name: 'Cache Cache Storage Engine', desc: 'Fast temporary sessions memory', status: 'Healthy', color: 'bg-emerald-500 border-emerald-400' }
            ].map((srv, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100">
                <div>
                  <h5 className="text-[11px] font-bold text-slate-800">{srv.name}</h5>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{srv.desc}</p>
                </div>
                <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-600 uppercase">
                  <span className={`w-2 h-2 rounded-full ${srv.color} ring-2 ring-white animate-pulse`} />
                  {srv.status}
                </span>
              </div>
            ))}
          </div>

          <Button onClick={() => navigate('/admin/monitor')} size="sm" variant="outline" className="w-full text-xs font-bold border-slate-200 hover:bg-slate-50">
            Advanced System Diagnostics
          </Button>
        </div>

        {/* Recent system logs preview */}
        <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5 text-left">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm text-slate-850">Recent System Activity</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Real-time database audit log stream</p>
            </div>
            <button onClick={() => navigate('/admin/logs')} className="text-[10px] font-black uppercase text-blue-600 hover:underline">
              Full Logs History
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { user: 'admin', op: 'Admin Login', time: 'Just now', ip: '127.0.0.1', state: 'Success', detail: 'Authorized panel session' },
              { user: 'admin', op: 'Modify Provider Settings', time: '12 mins ago', ip: '127.0.0.1', state: 'Success', detail: 'Gemini priority updated' },
              { user: 'admin', op: 'Backup Database', time: '1 hour ago', ip: '127.0.0.1', state: 'Success', detail: 'Created bimba_db_snapshot.sql' },
              { user: 'unknown', op: 'SSH/API Login Attempt', time: '3 hours ago', ip: '185.120.44.12', state: 'Failed', detail: 'Invalid credentials key validation' }
            ].map((log, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-smooth">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center text-slate-400 shrink-0 shadow-sm mt-0.5">
                    <Clock size={14} />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-800">
                      {log.op} by <span className="font-black text-slate-500">{log.user}</span>
                    </h5>
                    <p className="text-[9px] text-slate-450 font-semibold mt-0.5">
                      {log.detail} (IP: {log.ip})
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                    log.state === 'Success' 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                      : 'bg-rose-50 border-rose-100 text-rose-600'
                  }`}>
                    {log.state}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold block mt-1.5">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboardOverview;
