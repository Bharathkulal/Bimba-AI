import React, { useState, useEffect } from 'react';
import { Plus, UserCheck, RefreshCw } from 'lucide-react';
import { Button } from '../../components/Button';
import { adminService } from '../../services/admin';
import type { AdminUserDataDetails } from '../../services/admin';

export const AdminRolesModule: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUserDataDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    id: 0,
    username: '',
    email: '',
    password: '',
    role: 'admin',
    is_active: true
  });

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getAdmins();
      setAdmins(data);
    } catch (err) {
      console.error("Failed to load admin accounts database:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateNew = () => {
    setForm({ id: 0, username: '', email: '', password: '', role: 'admin', is_active: true });
    setIsOpen(true);
  };

  const handleEdit = (adm: AdminUserDataDetails) => {
    setForm({
      id: adm.id,
      username: adm.username,
      email: adm.email,
      password: '',
      role: adm.role,
      is_active: adm.is_active
    });
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (form.id > 0) {
        await adminService.editAdmin(form.id, form);
      } else {
        await adminService.createAdmin(form);
      }
      setIsOpen(false);
      fetchAdmins();
    } catch (err) {
      alert("Failed to modify admin credentials settings.");
    }
  };

  const handleResetPassword = async (id: number) => {
    try {
      const res = await adminService.resetAdminPassword(id);
      alert(`Password reset successfully. Temp password is: ${res.temporary_password}`);
    } catch (err) {
      alert("Failed to reset password.");
    }
  };

  const handleForceLogout = async (id: number) => {
    try {
      await adminService.forceLogoutAdmin(id);
      alert("Admin account forced logout status logged.");
    } catch (err) {
      alert("Operation failed.");
    }
  };

  if (isLoading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Permission Matrix preview */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Role Permission Policy Matrix</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Configure role-based access control (RBAC) permission nodes</p>
        </div>

        <div className="overflow-x-auto no-scrollbar border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 font-bold uppercase text-[9px]">
                <th className="py-2.5 px-4">Role Title</th>
                <th className="py-2.5 px-4">System Backups</th>
                <th className="py-2.5 px-4">Email Center</th>
                <th className="py-2.5 px-4">User Write operations</th>
                <th className="py-2.5 px-4">AI provider settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { r: 'Super Admin', b: 'Allowed', e: 'Allowed', u: 'Allowed', a: 'Allowed' },
                { r: 'Placement Officer', b: 'Denied', e: 'Allowed', u: 'Allowed', a: 'Denied' },
                { r: 'Department Admin', b: 'Denied', e: 'Denied', u: 'Write-Dept', a: 'Denied' },
                { r: 'Viewer', b: 'Denied', e: 'Denied', u: 'Read-Only', a: 'Denied' }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-bold text-slate-750">{row.r}</td>
                  <td className="py-2.5 px-4 font-semibold">{row.b}</td>
                  <td className="py-2.5 px-4 font-semibold">{row.e}</td>
                  <td className="py-2.5 px-4 font-semibold">{row.u}</td>
                  <td className="py-2.5 px-4 font-semibold">{row.a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin accounts list */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-850">Administrator Console Accounts</h3>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">Manage college credentials authorized for admin panel access</p>
          </div>

          <div className="flex gap-2">
            <button onClick={fetchAdmins} className="p-2 rounded-xl hover:bg-slate-50 border border-slate-200 text-slate-500 cursor-pointer">
              <RefreshCw size={13} />
            </button>
            <Button onClick={handleCreateNew} variant="primary" size="sm" className="bg-blue-600 font-bold gap-1 text-[11px]">
              <Plus size={14} /> New Admin
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                <th className="py-3 px-4">Admin Username</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions Panel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((adm) => (
                <tr key={adm.id} className="hover:bg-slate-50/50 transition-smooth">
                  <td className="py-3.5 px-4 font-bold text-slate-750 flex items-center gap-2">
                    <UserCheck size={14} className="text-slate-450" /> {adm.username}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-600">{adm.email}</td>
                  <td className="py-3.5 px-4 font-bold text-blue-650 uppercase text-[10px]">{adm.role}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                      adm.is_active 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                        : 'bg-rose-50 border-rose-100 text-rose-600'
                    }`}>
                      {adm.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end gap-2 items-center">
                      <button onClick={() => handleEdit(adm)} className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">Edit</button>
                      <button onClick={() => handleResetPassword(adm.id)} className="text-[10px] text-slate-500 font-bold hover:underline cursor-pointer" title="Reset temporary password">Reset Pass</button>
                      <button onClick={() => handleForceLogout(adm.id)} className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer" title="Revoke access immediately">Force Logout</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-xl text-left">
            <h4 className="text-sm font-extrabold text-slate-800 mb-4">{form.id > 0 ? "Edit Admin Settings" : "Register New Administrator"}</h4>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Username Handle</label>
                <input
                  type="text"
                  disabled={form.id > 0}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                  placeholder="e.g. dean_academics"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                  placeholder="e.g. admin@bimba.ai"
                  required
                />
              </div>
              {form.id === 0 && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Initial Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-750"
                    placeholder="Enter password..."
                    required
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Security Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full pl-3 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-755 cursor-pointer font-bold"
                >
                  <option value="super_admin">Super Admin (All Access)</option>
                  <option value="admin">Administrator (General Ops)</option>
                  <option value="moderator">Placement Moderator</option>
                  <option value="viewer">Auditor Viewer (Read Only)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Active Account Status</label>
                <select
                  value={form.is_active ? 'Active' : 'Disabled'}
                  onChange={(e) => setForm({ ...form, is_active: e.target.value === 'Active' })}
                  className="w-full pl-3 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-750 cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-655 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <Button type="submit" variant="primary" size="sm" className="bg-blue-600 font-bold text-[11px]">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default AdminRolesModule;
