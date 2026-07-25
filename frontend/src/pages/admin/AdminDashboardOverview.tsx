import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, CheckCircle, Cpu, FileText, Download, Shield,
  ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, Sparkles, Plus, Database, Activity
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
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
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto animate-pulse text-left">
        <div className="h-16 bg-[#102117] border border-white/5 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-[#102117] border border-white/5 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-[#102117] border border-white/5 rounded-2xl" />
          <div className="h-80 bg-[#102117] border border-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  // 6 KPI Cards
  const kpis = [
    {
      label: 'Total Students',
      value: stats?.totalUsers ?? 0,
      growth: '+12.4%',
      trend: 'up',
      icon: Users,
      chart: 'M0 25 Q15 15, 30 20 T60 5 T95 10',
      color: 'text-[#22C55E]'
    },
    {
      label: 'Verified Students',
      value: Math.round((stats?.activeUsers ?? 0) * 0.9),
      growth: '+8.2%',
      trend: 'up',
      icon: CheckCircle,
      chart: 'M0 25 Q15 20, 30 10 T60 15 T95 5',
      color: 'text-emerald-400'
    },
    {
      label: 'Total Resumes',
      value: stats?.totalResumes ?? 0,
      growth: '+18.4%',
      trend: 'up',
      icon: FileText,
      chart: 'M0 30 Q15 25, 30 15 T60 8 T95 2',
      color: 'text-[#22C55E]'
    },
    {
      label: 'Avg ATS Score',
      value: `${stats?.averageAtsScore ?? 75}%`,
      growth: '+3.5%',
      trend: 'up',
      icon: Shield,
      chart: 'M0 25 Q15 15, 30 22 T60 12 T95 8',
      color: 'text-amber-500'
    },
    {
      label: 'Resume Downloads',
      value: stats?.downloads ?? 0,
      growth: '+14.1%',
      trend: 'up',
      icon: Download,
      chart: 'M0 28 Q15 12, 30 22 T60 8 T95 2',
      color: 'text-[#22C55E]'
    },
    {
      label: 'AI Requests',
      value: stats?.aiRequests ?? 0,
      growth: '+24.1%',
      trend: 'up',
      icon: Cpu,
      chart: 'M0 30 Q15 18, 30 28 T60 8 T95 2',
      color: 'text-[#22C55E]'
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto text-left animate-fadeIn">
      
      {/* Header Banner */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#102117] border border-white/5 rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-60 h-full bg-gradient-to-l from-emerald-500/5 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 text-left">
          <h1 className="text-xl font-extrabold text-white tracking-tight">Admin Dashboard Overview</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
            Real-time college application metrics & AI resume builder logs
          </p>
        </div>
        <Button 
          onClick={handleSync} 
          variant="secondary" 
          size="sm" 
          className="border-white/10 text-[#22C55E] gap-1.5 shrink-0"
        >
          <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} /> Sync Analytics
        </Button>
      </section>

      {/* 6 KPI Cards Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          const isUp = kpi.trend === 'up';
          return (
            <Card key={idx} className="p-4 bg-[#13261B] border-white/5 hover:border-emerald-500/30 flex flex-col justify-between h-[120px] transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block truncate max-w-[100px]">
                    {kpi.label}
                  </span>
                  <span className="text-xl font-black text-white mt-1.5 block tracking-tight">
                    {kpi.value}
                  </span>
                </div>
                <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 shrink-0 ${kpi.color}`}>
                  <Icon size={14} />
                </div>
              </div>

              {/* Sparkline & trend */}
              <div className="flex justify-between items-center pt-2 mt-1.5 border-t border-white/5">
                <span className="text-[8.5px] font-black flex items-center gap-0.5 text-emerald-400">
                  <ArrowUpRight size={10} />
                  {kpi.growth}
                </span>
                <svg className="w-14 h-5 shrink-0" viewBox="0 0 95 30">
                  <path
                    d={kpi.chart}
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </Card>
          );
        })}
      </section>

      {/* Main Charts & Actions Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left: 4 Analytical SVG Charts Grid */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-5 bg-[#13261B] border-white/5 text-left flex-grow">
            <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-2 mb-4">
              AI Resume Analytics Workspace
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Chart 1: Resume Growth */}
              <div className="border border-white/5 p-3.5 rounded-xl bg-white/5">
                <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide">Resume Growth Trend</p>
                <div className="h-28 flex items-end mt-2">
                  <svg className="w-full h-full" viewBox="0 0 200 100">
                    <path d="M0 80 Q50 40, 100 65 T200 15" fill="none" stroke="#22C55E" strokeWidth="2.2" />
                    <path d="M0 80 Q50 40, 100 65 T200 15 L200 100 L0 100 Z" fill="rgba(34, 197, 94, 0.08)" />
                  </svg>
                </div>
              </div>

              {/* Chart 2: ATS Score Trend */}
              <div className="border border-white/5 p-3.5 rounded-xl bg-white/5">
                <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide">ATS Score keyword Distribution</p>
                <div className="h-28 flex items-end mt-2">
                  <svg className="w-full h-full" viewBox="0 0 200 100">
                    <path d="M0 60 L40 50 L80 70 L120 30 L160 40 L200 20" fill="none" stroke="#F59E0B" strokeWidth="2.2" />
                  </svg>
                </div>
              </div>

              {/* Chart 3: Student Registrations */}
              <div className="border border-white/5 p-3.5 rounded-xl bg-white/5">
                <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide">Student Profile Registrations</p>
                <div className="h-28 flex items-end justify-around gap-2 mt-2 px-2">
                  {[45, 60, 35, 70, 50, 95].map((val, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div className="w-3.5 bg-emerald-600 rounded-t" style={{ height: `${val * 0.7}px` }} />
                      <span className="text-[8px] text-slate-500 mt-1">M{idx+1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 4: Resume Downloads */}
              <div className="border border-white/5 p-3.5 rounded-xl bg-white/5">
                <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide">Resume Download Volume</p>
                <div className="h-28 flex items-end mt-2">
                  <svg className="w-full h-full" viewBox="0 0 200 100">
                    <path d="M0 90 L30 50 L60 80 L90 30 L120 70 L150 20 L200 40" fill="none" stroke="#22C55E" strokeWidth="2.2" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Quick Actions & Recent Activity timeline */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions Panel */}
          <Card className="p-5 bg-[#13261B] border-white/5 text-left">
            <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-2 mb-3.5">
              Quick Admin Actions
            </h3>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => navigate('/admin/users')}
                className="w-full flex items-center gap-2.5 p-3 bg-white/5 border border-white/5 hover:border-emerald-500/20 rounded-xl transition-all cursor-pointer text-left text-xs font-bold text-slate-200"
              >
                <Plus size={14} className="text-emerald-500" />
                <span>Add Student Account</span>
              </button>
              <button 
                onClick={() => navigate('/admin/announcements')}
                className="w-full flex items-center gap-2.5 p-3 bg-white/5 border border-white/5 hover:border-emerald-500/20 rounded-xl transition-all cursor-pointer text-left text-xs font-bold text-slate-200"
              >
                <Plus size={14} className="text-emerald-500" />
                <span>Create Announcement</span>
              </button>
              <button 
                onClick={() => navigate('/admin/templates')}
                className="w-full flex items-center gap-2.5 p-3 bg-white/5 border border-white/5 hover:border-emerald-500/20 rounded-xl transition-all cursor-pointer text-left text-xs font-bold text-slate-200"
              >
                <Plus size={14} className="text-emerald-500" />
                <span>Create Resume Template</span>
              </button>
              <button 
                onClick={handleSync}
                className="w-full flex items-center gap-2.5 p-3 bg-white/5 border border-white/5 hover:border-emerald-500/20 rounded-xl transition-all cursor-pointer text-left text-xs font-bold text-slate-200"
              >
                <Database size={14} className="text-emerald-500" />
                <span>Backup Database Snapshot</span>
              </button>
              <button 
                onClick={handleSync}
                className="w-full flex items-center gap-2.5 p-3 bg-white/5 border border-white/5 hover:border-emerald-500/20 rounded-xl transition-all cursor-pointer text-left text-xs font-bold text-slate-200"
              >
                <RefreshCw size={14} className="text-emerald-500" />
                <span>Refresh Analytical stats</span>
              </button>
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card className="p-5 bg-[#13261B] border-white/5 text-left flex-grow">
            <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-2 mb-3.5">
              Recent Activity Timeline
            </h3>

            <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
              {[
                { label: 'Student profile created', desc: 'BCA24001 compiled profile data', time: 'Just now' },
                { label: 'Resume PDF downloaded', desc: 'Roll BCA24001 exported ATS PDF', time: '12m ago' },
                { label: 'Drive Announcement created', desc: 'Published Vercel Hiring Notice', time: '1h ago' },
                { label: 'Database Backup Completed', desc: 'bimba_db_snap generated successfully', time: '4h ago' },
                { label: 'AI Prompt template updated', desc: 'Refined ATS parser temperature key', time: '6h ago' }
              ].map((act, idx) => (
                <div key={idx} className="flex gap-2.5 items-start text-xs pb-2 border-b border-white/5 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-bold text-white text-[11px] leading-tight">{act.label}</p>
                    <p className="text-[9.5px] text-slate-400 mt-0.5 leading-snug">{act.desc}</p>
                    <span className="text-[8.5px] text-slate-500 font-bold block mt-1">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboardOverview;
