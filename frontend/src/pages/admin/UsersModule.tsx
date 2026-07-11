import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, RefreshCw, Eye, ShieldAlert, KeyRound, Ban, CheckCircle } from 'lucide-react';
import { adminService } from '../../services/admin';
import type { AdminUserData } from '../../services/admin';

export const UsersModule: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load user directory:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = async (rollNumber: string, action: 'suspend' | 'activate' | 'delete' | 'reset_password') => {
    if (action === 'delete' && !window.confirm(`Delete user ${rollNumber}?`)) return;
    try {
      await adminService.modifyUser(rollNumber, action);
      alert(`Operation completed successfully.`);
      fetchUsers();
    } catch (err) {
      alert("Action failed to execute.");
    }
  };

  const departmentsList = Array.from(new Set(users.map(u => u.department))).filter(Boolean);

  const filteredUsers = users
    .filter(u => 
      u.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(u => statusFilter === 'All' || u.status === statusFilter)
    .filter(u => deptFilter === 'All' || u.department === deptFilter);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-6 animate-fadeIn text-left">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">User Directory Database</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Manage student accounts, portal permissions, and activation states</p>
        </div>
        <button onClick={fetchUsers} className="p-2 rounded-xl hover:bg-slate-50 border border-slate-200/60 text-slate-500">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" size={14} />
          <input
            type="text"
            placeholder="Search student names, emails, roll numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-250 focus:border-blue-500 focus:outline-none text-xs text-slate-700 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-semibold focus:outline-none text-slate-700 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active accounts</option>
            <option value="Suspended">Suspended accounts</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-semibold focus:outline-none text-slate-700 cursor-pointer"
          >
            <option value="All">All Departments</option>
            {departmentsList.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* DataTable */}
      <div className="overflow-x-auto no-scrollbar border border-slate-100 rounded-2xl">
        <table className="w-full text-left text-xs font-medium border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
              <th className="py-3 px-4">Student Identity</th>
              <th className="py-3 px-4">Department & Curriculum</th>
              <th className="py-3 px-4">Portfolios Count</th>
              <th className="py-3 px-4">Last Event Activity</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions Panel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-bold text-xs">
                  No records matching the current selection search pattern.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-smooth">
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-extrabold text-slate-800">{user.roll_number}</span>
                      <span className="text-[10px] text-slate-450 font-bold">{user.email}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-700">{user.department}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Semester {user.semester}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-lg text-[10px] font-black">
                      {user.resumes_count} resumes
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-500 font-bold text-[10px]">{user.last_activity || 'None registered'}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${
                      user.status === 'Active'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        : 'bg-rose-50 border-rose-100 text-rose-600'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/students?roll=${user.roll_number}`)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                        title="View Full Profile Details"
                      >
                        <Eye size={12} />
                      </button>

                      {user.status === 'Active' ? (
                        <button
                          onClick={() => handleAction(user.roll_number, 'suspend')}
                          className="p-1.5 rounded-lg border border-rose-250 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Suspend Login Session"
                        >
                          <Ban size={12} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(user.roll_number, 'activate')}
                          className="p-1.5 rounded-lg border border-emerald-250 text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                          title="Activate Session Credentials"
                        >
                          <CheckCircle size={12} />
                        </button>
                      )}

                      <button
                        onClick={() => handleAction(user.roll_number, 'reset_password')}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
                        title="Reset Credentials Password"
                      >
                        <KeyRound size={12} />
                      </button>

                      <button
                        onClick={() => handleAction(user.roll_number, 'delete')}
                        className="p-1.5 rounded-lg border border-rose-250 text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete Student from DB"
                      >
                        <ShieldAlert size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default UsersModule;
