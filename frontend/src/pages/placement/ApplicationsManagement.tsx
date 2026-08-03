import React, { useState, useEffect } from 'react';
import { ClipboardList, Check, X, Search, Award, RefreshCw } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { placementService } from '../../services/placement';
import type { PlacementApplication } from '../../services/placement';

export const ApplicationsManagement: React.FC = () => {
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchApps = async () => {
    try {
      setIsLoading(true);
      const data = await placementService.getApplications();
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await placementService.updateApplicationStatus(id, newStatus);
      fetchApps();
    } catch (err) {
      console.error(err);
      alert("Failed to update application status.");
    }
  };

  const filteredApps = applications.filter(a => {
    const matchesSearch = 
      a.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.student_roll.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.drive_title.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold tracking-tight">Applications Tracking</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
          Monitor and update student applications progress per recruiting drive
        </p>
      </div>

      {/* Filters */}
      <Card className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="flex-grow relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by student name, roll number, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500 text-slate-600 dark:text-slate-200"
        >
          <option value="All">All Application States</option>
          <option value="Applied">Applied</option>
          <option value="Shortlisted">Shortlisted</option>
          <option value="Offered">Offered</option>
          <option value="Rejected">Rejected</option>
        </select>
      </Card>

      {/* Applications Table */}
      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading applications...</div>
        ) : filteredApps.length > 0 ? (
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 font-extrabold uppercase bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Company & Drive</th>
                <th className="px-6 py-4 text-center">Applied Date</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Selection Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredApps.map((app) => (
                <tr key={app._id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{app.student_name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{app.student_roll}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{app.company_name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{app.drive_title}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-550 dark:text-slate-350">{app.applied_at || 'Recently'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                      app.status === 'Offered' 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                        : app.status === 'Shortlisted'
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : app.status === 'Rejected'
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600'
                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {app.status === 'Applied' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdateStatus(app._id, 'Shortlisted')}
                          className="px-2.5 py-1 text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold border border-indigo-100 dark:border-indigo-500/10 cursor-pointer"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app._id, 'Rejected')}
                          className="px-2.5 py-1 text-[10px] bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-lg font-bold border border-rose-100 dark:border-rose-500/10 cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {app.status === 'Shortlisted' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdateStatus(app._id, 'Offered')}
                          className="px-2.5 py-1 text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg font-bold border border-emerald-100 dark:border-emerald-500/10 cursor-pointer"
                        >
                          Offer Made
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app._id, 'Rejected')}
                          className="px-2.5 py-1 text-[10px] bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-lg font-bold border border-rose-100 dark:border-rose-500/10 cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {(app.status === 'Offered' || app.status === 'Rejected') && (
                      <span className="text-[10px] text-slate-400 font-semibold italic">Process Finished</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-20 text-center text-xs text-slate-400">No applications matched filters.</div>
        )}
      </Card>
    </div>
  );
};
export default ApplicationsManagement;
