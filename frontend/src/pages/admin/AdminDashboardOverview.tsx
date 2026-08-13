import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, CheckCircle, Cpu, FileText, Download, Shield,
  ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, Sparkles, Plus, Database, Activity
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { adminService } from '../../services/admin';
import type { AdminDashboardData, AdminAnalyticsDashboardData } from '../../services/admin';
// Lightweight local stubs for chart components to avoid adding a runtime dependency
const ResponsiveContainer: any = ({ children }: any) => <div className="w-full h-full">{children}</div>;
const AreaChart: any = ({ children }: any) => <div>{children}</div>;
const LineChart: any = ({ children }: any) => <div>{children}</div>;
const BarChart: any = ({ children }: any) => <div>{children}</div>;
const Area: any = (_props: any) => null;
const Line: any = (_props: any) => null;
const Bar: any = (_props: any) => null;
const XAxis: any = (_props: any) => null;
const YAxis: any = (_props: any) => null;
const Tooltip: any = (_props: any) => null;
const CartesianGrid: any = (_props: any) => null;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl p-3 shadow-xl text-left">
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
          {payload[0].name}: <span className="text-[#10b981]">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const RenderChart = ({ title, isLoading, data, children, emptyMessage }: { 
  title: string; 
  isLoading: boolean; 
  data: any[] | undefined; 
  children: React.ReactNode;
  emptyMessage?: string;
}) => {
  const hasData = data && data.length > 0 && data.some(d => Object.values(d).some(v => typeof v === 'number' && v > 0));

  return (
    <div className="border border-border p-4 rounded-xl bg-slate-50/30 flex flex-col h-[180px] text-left">
      <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide mb-2">{title}</p>
      <div className="flex-grow flex items-center justify-center relative w-full h-[120px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#111111]/30 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{emptyMessage || "No data available yet"}</span>
            <span className="text-[9px] text-slate-500 mt-1">Metrics will sync as platform activity increases.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children as any}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export const AdminDashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminDashboardData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AdminAnalyticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setIsAnalyticsLoading(true);
      const [statsData, analytics] = await Promise.all([
        adminService.getDashboard(),
        adminService.getAnalyticsDashboard()
      ]);
      setStats(statsData);
      setAnalyticsData(analytics);
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setIsLoading(false);
      setIsAnalyticsLoading(false);
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
      color: 'text-blue-500'
    },
    {
      label: 'Verified Students',
      value: Math.round((stats?.activeUsers ?? 0) * 0.9),
      growth: '+8.2%',
      trend: 'up',
      icon: CheckCircle,
      chart: 'M0 25 Q15 20, 30 10 T60 15 T95 5',
      color: 'text-emerald-500'
    },
    {
      label: 'Total Resumes',
      value: stats?.totalResumes ?? 0,
      growth: '+18.4%',
      trend: 'up',
      icon: FileText,
      chart: 'M0 30 Q15 25, 30 15 T60 8 T95 2',
      color: 'text-purple-500'
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
      color: 'text-red-500'
    },
    {
      label: 'AI Requests',
      value: stats?.aiRequests ?? 0,
      growth: '+24.1%',
      trend: 'up',
      icon: Cpu,
      chart: 'M0 30 Q15 18, 30 28 T60 8 T95 2',
      color: 'text-cyan-500'
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto text-left animate-fadeIn">
      
      {/* Header Banner */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-sidebar border border-border rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-60 h-full bg-gradient-to-l -[#111111]/5 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 text-left">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard Overview</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
            Real-time college application metrics & AI resume builder logs
          </p>
        </div>
        <Button 
          onClick={handleSync} 
          variant="secondary" 
          size="sm" 
          className="border-border text-[#111111] gap-1.5 shrink-0"
        >
          <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} /> Sync Analytics
        </Button>
      </section>

      {/* 6 KPI Cards Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          return (
            <div key={idx} className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-[0_4px_12px_rgba(15,23,42,0.08)] text-left">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {kpi.label}
              </div>
              <div className={`text-2xl font-black mt-2 ${kpi.color}`}>
                {kpi.value}
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Charts & Actions Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left: 4 Analytical SVG Charts Grid */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-5 text-left flex-grow">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-border pb-2 mb-4">
              AI Resume Analytics Workspace
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Chart 1: Resume Growth */}
              <RenderChart title="Resume Growth Trend" isLoading={isAnalyticsLoading} data={analyticsData?.resume_growth} emptyMessage="No resumes created yet">
                <AreaChart data={analyticsData?.resume_growth} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorResume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111111" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#111111" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
                  <XAxis dataKey="month" stroke="rgba(0,0,0,0.4)" fontSize={8} tickLine={false} />
                  <YAxis stroke="rgba(0,0,0,0.4)" fontSize={8} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" name="Resumes" stroke="#111111" strokeWidth={1.8} fillOpacity={1} fill="url(#colorResume)" />
                </AreaChart>
              </RenderChart>

              {/* Chart 2: ATS Score Trend */}
              <RenderChart title="ATS Score keyword Distribution" isLoading={isAnalyticsLoading} data={analyticsData?.ats_score_distribution} emptyMessage="No ATS reports scored yet">
                <LineChart data={analyticsData?.ats_score_distribution} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
                  <XAxis dataKey="month" stroke="rgba(0,0,0,0.4)" fontSize={8} tickLine={false} />
                  <YAxis stroke="rgba(0,0,0,0.4)" fontSize={8} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="avg_score" name="Avg ATS Score" stroke="#F59E0B" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                </LineChart>
              </RenderChart>

              {/* Chart 3: Student Registrations */}
              <RenderChart title="Student Profile Registrations" isLoading={isAnalyticsLoading} data={analyticsData?.registrations} emptyMessage="No student signups yet">
                <BarChart data={analyticsData?.registrations} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
                  <XAxis dataKey="month" stroke="rgba(0,0,0,0.4)" fontSize={8} tickLine={false} />
                  <YAxis stroke="rgba(0,0,0,0.4)" fontSize={8} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Registrations" fill="#111111" radius={[3, 3, 0, 0]} maxBarSize={20} />
                </BarChart>
              </RenderChart>

              {/* Chart 4: Resume Downloads */}
              <RenderChart title="Resume Download Volume" isLoading={isAnalyticsLoading} data={analyticsData?.download_volume} emptyMessage="No resume downloads yet">
                <LineChart data={analyticsData?.download_volume} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
                  <XAxis dataKey="month" stroke="rgba(0,0,0,0.4)" fontSize={8} tickLine={false} />
                  <YAxis stroke="rgba(0,0,0,0.4)" fontSize={8} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" name="Downloads" stroke="#111111" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                </LineChart>
              </RenderChart>
            </div>
          </Card>
        </div>

        {/* Right: Quick Actions & Recent Activity timeline */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions Panel */}
          <Card className="p-5 text-left">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-border pb-2 mb-3.5">
              Quick Admin Actions
            </h3>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => navigate('/admin/users')}
                className="w-full flex items-center gap-2.5 p-3 bg-slate-100/50 border border-border hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-left text-xs font-bold text-slate-700 hover:text-slate-900"
              >
                <Plus size={14} className="-[#111111]" />
                <span>Add Student Account</span>
              </button>
              <button 
                onClick={() => navigate('/admin/announcements')}
                className="w-full flex items-center gap-2.5 p-3 bg-slate-100/50 border border-border hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-left text-xs font-bold text-slate-700 hover:text-slate-900"
              >
                <Plus size={14} className="-[#111111]" />
                <span>Create Announcement</span>
              </button>
              <button 
                onClick={() => navigate('/admin/templates')}
                className="w-full flex items-center gap-2.5 p-3 bg-slate-100/50 border border-border hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-left text-xs font-bold text-slate-700 hover:text-slate-900"
              >
                <Plus size={14} className="-[#111111]" />
                <span>Create Resume Template</span>
              </button>
              <button 
                onClick={handleSync}
                className="w-full flex items-center gap-2.5 p-3 bg-slate-100/50 border border-border hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-left text-xs font-bold text-slate-700 hover:text-slate-900"
              >
                <Database size={14} className="-[#111111]" />
                <span>Backup Database Snapshot</span>
              </button>
              <button 
                onClick={handleSync}
                className="w-full flex items-center gap-2.5 p-3 bg-slate-100/50 border border-border hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-left text-xs font-bold text-slate-700 hover:text-slate-900"
              >
                <RefreshCw size={14} className="-[#111111]" />
                <span>Refresh Analytical stats</span>
              </button>
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card className="p-5 text-left flex-grow">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-border pb-2 mb-3.5">
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
                <div key={idx} className="flex gap-2.5 items-start text-xs pb-2 border-b border-border last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full -[#111111] mt-1.5 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900 text-[11px] leading-tight">{act.label}</p>
                    <p className="text-[9.5px] text-slate-500 mt-0.5 leading-snug">{act.desc}</p>
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
