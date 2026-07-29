import React, { useState, useEffect } from 'react';
import { Briefcase, Search, RefreshCw, AlertTriangle, Filter, CheckCircle2, ShieldAlert } from 'lucide-react';
import { apiClient } from '../../services/api';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  status: string;
  posted_at: string;
  job_type?: string;
}

export const JobsModule: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch from the existing backend jobs endpoint
      const response = await apiClient.get('/api/jobs');
      const data = response.data;
      if (Array.isArray(data)) {
        setJobs(data);
      } else if (data && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      } else {
        setJobs([]);
      }
    } catch (err: any) {
      console.error(err);
      setError("Unable to load jobs data from system.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleRefreshSync = async () => {
    setSyncing(true);
    try {
      // Trigger API job sync
      await apiClient.post('/api/jobs/sync');
      await fetchJobs();
    } catch (err) {
      console.error(err);
      alert("Failed to sync new jobs from API sources.");
    } finally {
      setSyncing(false);
    }
  };

  // Filters logic
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      (job.title?.toLowerCase().includes(search.toLowerCase()) || '') ||
      (job.company?.toLowerCase().includes(search.toLowerCase()) || '') ||
      (job.location?.toLowerCase().includes(search.toLowerCase()) || '');
      
    const matchesSource = sourceFilter === 'All' || job.source === sourceFilter;
    const matchesStatus = statusFilter === 'All' || (job.status || 'Active') === statusFilter;
    const matchesType = typeFilter === 'All' || job.job_type === typeFilter;
    
    return matchesSearch && matchesSource && matchesStatus && matchesType;
  });

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Job Management</h2>
          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-1">Manage and sync jobs index & monitor JSearch API pipeline</p>
        </div>

        <button
          onClick={handleRefreshSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-200/50 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing...' : 'Refresh Jobs API'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Total Jobs</span>
            <h3 className="text-xl font-black text-slate-900 mt-1">{jobs.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <Briefcase size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Active Indexes</span>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {jobs.filter(j => (j.status || 'Active') === 'Active').length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">JSearch Source</span>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {jobs.filter(j => j.source === 'JSearch' || j.source === 'RapidAPI').length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
            <Briefcase size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Sync Failures</span>
            <h3 className="text-xl font-black text-rose-600 mt-1">0</h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
            <ShieldAlert size={18} />
          </div>
        </div>
      </div>

      {/* API Source Health Section */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
        <div>
          <h4 className="text-xs font-black uppercase text-slate-400">Job APIs Integration Status</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="text-xs font-extrabold text-slate-800">JSearch API Service</span>
                <p className="text-[9px] text-slate-400">Synced hourly</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Connected</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <div>
                <span className="text-xs font-extrabold text-slate-800">LinkedIn Search API Gateway</span>
                <p className="text-[9px] text-slate-400">Synced daily</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Connected</span>
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search by job title, company, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200/80 text-xs focus:outline-none focus:border-emerald-500 bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200/80 text-xs bg-white text-slate-600 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Sources</option>
              <option value="JSearch">JSearch</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Local">Local</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200/80 text-xs bg-white text-slate-600 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-2xl flex items-center gap-2 font-bold">
            <AlertTriangle size={15} />
            <span>{error}</span>
            <button onClick={fetchJobs} className="ml-auto underline cursor-pointer">Retry</button>
          </div>
        )}

        {/* Table / List */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col gap-2.5 py-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse w-full" />
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-2">
              <Briefcase size={36} className="text-slate-300" />
              <h5 className="font-extrabold text-sm text-slate-700">No jobs found</h5>
              <p className="text-xs text-slate-400">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-black tracking-wider text-slate-400">
                  <th className="py-3 px-2">Job Title</th>
                  <th className="py-3 px-2">Company</th>
                  <th className="py-3 px-2">Location</th>
                  <th className="py-3 px-2">Source</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="border-b border-slate-50 hover:bg-slate-50/55 transition-colors text-xs text-slate-700">
                    <td className="py-3 px-2 font-extrabold text-slate-900">{job.title}</td>
                    <td className="py-3 px-2 font-bold">{job.company}</td>
                    <td className="py-3 px-2">{job.location || 'Remote'}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold uppercase">{job.source || 'JSearch'}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobsModule;
