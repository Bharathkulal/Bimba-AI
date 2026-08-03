import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, CheckCircle, FileText, Briefcase, Building2, ClipboardList,
  RefreshCw, TrendingUp, Sparkles, Activity, Award
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse text-left">
        <div className="h-16 bg-[#102117]/10 dark:bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-[#102117]/10 dark:bg-white/5 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-[#102117]/10 dark:bg-white/5 rounded-2xl" />
          <div className="h-80 bg-[#102117]/10 dark:bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  const kpiData = [
    { label: 'Total Students', value: stats?.totalStudents ?? 0, icon: Users, description: 'All departments registered' },
    { label: 'Active Drives', value: stats?.activeDrives ?? 0, icon: Briefcase, description: 'Ongoing campus recruitment' },
    { label: 'Applications', value: stats?.applicationsInProgress ?? 0, icon: ClipboardList, description: 'Active selection processes' },
    { label: 'Offers Made', value: stats?.offersMade ?? 0, icon: Award, description: 'Shortlists and selections' }
  ];

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Placement Dashboard</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
            Real-time recruiting metrics and student tracking
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-250/20 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing...' : 'Sync Data'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiData.map((kpi, idx) => (
          <StatsCard
            key={idx}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            description={kpi.description}
          />
        ))}
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Branch Breakdown Table */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
              <div>
                <h3 className="font-extrabold text-sm">Department wise Placements</h3>
                <p className="text-[9px] text-slate-450 uppercase font-bold mt-0.5">Summary of students placed by course</p>
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
                        <td className="py-3 font-bold">{branch}</td>
                        <td className="py-3 text-center font-semibold text-slate-500 dark:text-slate-400">{info.total}</td>
                        <td className="py-3 text-center font-bold text-slate-900 dark:text-white">{info.placed}</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <span className="font-black">{percentage}%</span>
                            <div className="w-16 bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full" style={{ width: `${percentage}%` }} />
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

        {/* Right: Recent activity Feed */}
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
            <div>
              <h3 className="font-extrabold text-sm">Recent Activity</h3>
              <p className="text-[9px] text-slate-450 uppercase font-bold mt-0.5">Events from the recruiting system</p>
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
                    <p className="font-semibold text-slate-750 dark:text-slate-200">{act.title}</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">{act.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No recent activity recorded.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
export default PlacementDashboard;
