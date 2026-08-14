import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, CheckCircle, FileText, Briefcase, Building2, ClipboardList,
  RefreshCw, TrendingUp, Sparkles, Activity, Award, Percent, ChevronRight,
  Plus, Database, Target, ArrowUpRight
} from 'lucide-react';
import { Card } from '../../components/Card';
import { StatsCard } from '../../components/StatsCard';
import { placementService } from '../../services/placement';
import type { PlacementDashboardData } from '../../services/placement';
import { useThemeStore } from '../../store/themeStore';

export const PlacementDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState<PlacementDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const data = await placementService.getDashboard();
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

  const fetchAiSummary = async () => {
    try {
      setAiLoading(true);
      const res = await placementService.getAiDashboardSummary();
      setAiSummary(res.summary);
    } catch (err) {
      console.error(err);
      setAiSummary("Failed to fetch AI Insights. Please ensure API keys are configured.");
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse text-left">
        <div className="h-20 bg-slate-200 dark:bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-white/5 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-200 dark:bg-white/5 rounded-2xl" />
          <div className="h-80 bg-slate-200 dark:bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Calculate placement rate dynamically
  const totalPlaced = Object.values(stats?.branchBreakdown ?? {}).reduce((acc, curr) => acc + curr.placed, 0);
  const totalStudentsCount = stats?.totalStudents ?? 0;
  const placementRate = totalStudentsCount > 0 ? Math.round((totalPlaced / totalStudentsCount) * 100) : 0;

  const kpis = [
    { 
      label: 'Total Students', 
      value: stats?.totalStudents ?? 0, 
      icon: Users, 
      description: 'All branches registered',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-blue-100 dark:border-blue-900/30',
      chart: 'M0 25 Q15 15, 30 20 T60 5 T95 10',
      trend: '+4.2%'
    },
    { 
      label: 'Active Drives', 
      value: stats?.activeDrives ?? 0, 
      icon: Briefcase, 
      description: 'Ongoing campus drives',
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
      borderColor: 'border-indigo-100 dark:border-indigo-900/30',
      chart: 'M0 30 Q15 20, 30 25 T60 10 T95 15',
      trend: '+12.0%'
    },
    { 
      label: 'Applications', 
      value: stats?.applicationsInProgress ?? 0, 
      icon: ClipboardList, 
      description: 'In selection processes',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-100 dark:border-amber-900/30',
      chart: 'M0 20 Q15 25, 30 15 T60 30 T95 20',
      trend: '+8.3%'
    },
    { 
      label: 'Offers Made', 
      value: stats?.offersMade ?? 0, 
      icon: Award, 
      description: 'Selections recorded',
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-950/30',
      borderColor: 'border-pink-100 dark:border-pink-900/30',
      chart: 'M0 25 Q15 10, 30 15 T60 5 T95 8',
      trend: '+15.4%'
    },
    { 
      label: 'Total Apps', 
      value: stats?.totalApplications ?? (stats?.applicationsInProgress ?? 0) * 2, 
      icon: FileText, 
      description: 'Cumulative applications',
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
      borderColor: 'border-cyan-100 dark:border-cyan-900/30',
      chart: 'M0 30 Q15 25, 30 15 T60 10 T95 5',
      trend: '+6.5%'
    },
    { 
      label: 'Placement %', 
      value: `${placementRate}%`, 
      icon: Percent, 
      description: 'Overall success rate',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-100 dark:border-emerald-900/30',
      chart: 'M0 25 Q15 20, 30 10 T60 5 T95 2',
      trend: '+18.1%'
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Header Banner */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0B0F19] border border-slate-100 dark:border-white/10 rounded-2xl p-6 shadow-[0_4px_12px_rgba(15,23,42,0.03)] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-emerald-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 text-left">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Placement Command Center
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
              Console
            </span>
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
            Real-time recruiting metrics, department trends, and candidate flows
          </p>
        </div>
        
        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={fetchAiSummary}
            disabled={aiLoading}
            className="flex items-center gap-1.5 px-4 py-2 border border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold transition-all hover:bg-emerald-500/10 cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={13} className={aiLoading ? 'animate-pulse' : ''} />
            {aiLoading ? 'Analyzing...' : 'AI Insights'}
          </button>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-250/20 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </section>

      {/* AI Summary Section */}
      {aiSummary && (
        <Card className="border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/5 text-slate-800 dark:text-emerald-100 p-4.5 rounded-2xl flex items-start gap-3 animate-fadeIn">
          <Sparkles className="text-emerald-500 shrink-0 mt-0.5" size={16} />
          <div className="text-xs leading-relaxed font-semibold">
            <span className="text-[9.5px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
              AI Smart Summary
            </span>
            {aiSummary}
          </div>
        </Card>
      )}

      {/* 6 KPI Cards Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const IconComponent = kpi.icon;
          return (
            <div 
              key={idx} 
              className="bg-white dark:bg-[#0B0F19] rounded-2xl p-4 border border-slate-100 dark:border-white/10 shadow-[0_4px_12px_rgba(15,23,42,0.03)] text-left hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <span className="text-[9px] font-extrabold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  {kpi.trend}
                </span>
              </div>
              <div className={`text-2xl font-black mt-2 tracking-tight ${kpi.color}`}>
                {kpi.value}
              </div>
              
              <div className="flex items-end justify-between mt-3">
                <div className="text-[9px] text-slate-400 font-medium leading-tight max-w-[70%]">
                  {kpi.description}
                </div>
                <div className={`w-7 h-7 rounded-lg ${kpi.bgColor} border ${kpi.borderColor} flex items-center justify-center`}>
                  <IconComponent size={14} className={kpi.color} />
                </div>
              </div>
              
              {/* Mini Trend SVG sparkline */}
              <div className="mt-3.5 pt-2 border-t border-slate-50 dark:border-white/5">
                <svg className="w-full h-7 stroke-current text-slate-200 dark:text-slate-800" viewBox="0 0 100 30" fill="none">
                  <path d={kpi.chart} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={kpi.chart} className={`stroke-current ${kpi.color} opacity-40 group-hover:opacity-100 transition-opacity`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left Column: Department Breakdown & Pipeline Funnel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Department wise Placements Table */}
          <Card className="flex flex-col justify-between p-5">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Department wise Placements</h3>
                  <p className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">Summary of students placed by course</p>
                </div>
                <span className="text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
                  <TrendingUp size={12} /> Active
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 font-extrabold border-b border-slate-100 dark:border-white/5">
                      <th className="pb-3 uppercase tracking-wider">Branch</th>
                      <th className="pb-3 uppercase tracking-wider text-center">Total Students</th>
                      <th className="pb-3 uppercase tracking-wider text-center">Placed</th>
                      <th className="pb-3 uppercase tracking-wider text-right">Placement %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {stats && Object.entries(stats.branchBreakdown).map(([branch, info]) => {
                      const percentage = info.total > 0 ? Math.round((info.placed / info.total) * 100) : 0;
                      return (
                        <tr key={branch} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3 font-bold text-slate-800 dark:text-slate-200">{branch}</td>
                          <td className="py-3 text-center font-semibold text-slate-500 dark:text-slate-400">{info.total}</td>
                          <td className="py-3 text-center font-bold text-slate-900 dark:text-white">{info.placed}</td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              <span className="font-black text-slate-800 dark:text-slate-200">{percentage}%</span>
                              <div className="w-20 bg-slate-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Recruitment Funnel Pipeline */}
          <Card className="p-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Recruitment Pipeline Funnel</h3>
                <p className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">Conversion flow of students through stages</p>
              </div>
              <Target size={15} className="text-slate-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Registered candidates</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-white block mt-1">{stats?.totalStudents ?? 0}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-1 rounded-full overflow-hidden mt-3">
                  <div className="bg-blue-500 h-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Submitted Applications</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-white block mt-1">{stats?.totalApplications ?? (stats?.applicationsInProgress ?? 0) * 2}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-1 rounded-full overflow-hidden mt-3">
                  <div 
                    className="bg-indigo-500 h-full" 
                    style={{ width: `${Math.min(100, Math.round(((stats?.totalApplications ?? (stats?.applicationsInProgress ?? 0) * 2) / (stats?.totalStudents || 1)) * 100))}%` }} 
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Offers & Selections</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-white block mt-1">{stats?.offersMade ?? 0}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-1 rounded-full overflow-hidden mt-3">
                  <div 
                    className="bg-emerald-500 h-full" 
                    style={{ width: `${Math.min(100, Math.round(((stats?.offersMade ?? 0) / (stats?.totalStudents || 1)) * 100))}%` }} 
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Quick Actions & Recent Activity Feed */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions Panel */}
          <Card className="p-5 text-left">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3.5 mb-3.5">
              Quick Admin Actions
            </h3>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => navigate('/placement/drives')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-100 dark:border-white/5 rounded-xl transition-all cursor-pointer text-left text-xs font-bold text-slate-700 dark:text-slate-350 hover:text-slate-950 dark:hover:text-white group"
              >
                <div className="flex items-center gap-2.5">
                  <Plus size={14} className="text-emerald-500" />
                  <span>Schedule Campus Drive</span>
                </div>
                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                onClick={() => navigate('/placement/resume-verification')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-100 dark:border-white/5 rounded-xl transition-all cursor-pointer text-left text-xs font-bold text-slate-700 dark:text-slate-350 hover:text-slate-950 dark:hover:text-white group"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle size={14} className="text-blue-500" />
                  <span>Verify Student Resumes</span>
                </div>
                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                onClick={() => navigate('/placement/announcements')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-100 dark:border-white/5 rounded-xl transition-all cursor-pointer text-left text-xs font-bold text-slate-700 dark:text-slate-350 hover:text-slate-950 dark:hover:text-white group"
              >
                <div className="flex items-center gap-2.5">
                  <Plus size={14} className="text-indigo-500" />
                  <span>Broadcast Announcement</span>
                </div>
                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                onClick={() => navigate('/placement/reports')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-100 dark:border-white/5 rounded-xl transition-all cursor-pointer text-left text-xs font-bold text-slate-700 dark:text-slate-350 hover:text-slate-950 dark:hover:text-white group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={14} className="text-pink-500" />
                  <span>Generate Report & Export</span>
                </div>
                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                onClick={handleSync}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-100 dark:border-white/5 rounded-xl transition-all cursor-pointer text-left text-xs font-bold text-slate-700 dark:text-slate-350 hover:text-slate-950 dark:hover:text-white group"
              >
                <div className="flex items-center gap-2.5">
                  <Database size={14} className="text-cyan-500" />
                  <span>Refresh DB Cache</span>
                </div>
                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </Card>

          {/* Recent activity Feed */}
          <Card className="p-5 text-left flex-grow">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Recent Activity</h3>
                <p className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">Events from the recruiting system</p>
              </div>
              <Activity size={16} className="text-slate-400" />
            </div>

            <div className="flex flex-col gap-4">
              {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                stats.recentActivities.map((act) => (
                  <div key={act.id} className="flex gap-3 text-xs leading-relaxed">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      act.type === 'drive' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                    }`}>
                      {act.type === 'drive' ? <Briefcase size={14} /> : <ClipboardList size={14} />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{act.title}</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">{act.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-450 text-xs">
                  No recent activity recorded.
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default PlacementDashboard;
