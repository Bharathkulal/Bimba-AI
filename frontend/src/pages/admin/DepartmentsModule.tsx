import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Edit3, Trash2, Building, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { adminService } from '../../services/admin';
import type { DepartmentData } from '../../services/admin';

export const DepartmentsModule: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal Form States
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [form, setForm] = useState({
    id: 0,
    code: '',
    name: '',
    description: '',
    hod_name: '',
    status: 'Active'
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error("Failed to fetch departments list:", err);
      showToast("Failed to retrieve departments list.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateNew = () => {
    setForm({ id: 0, code: '', name: '', description: '', hod_name: '', status: 'Active' });
    setIsOpen(true);
  };

  const handleEdit = (dept: DepartmentData) => {
    setForm({
      id: dept.id,
      code: dept.code,
      name: dept.name,
      description: dept.description,
      hod_name: dept.hod_name,
      status: dept.status
    });
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (form.id > 0) {
        await adminService.editDepartment(form.id, form);
        showToast("Department configuration updated successfully.", "success");
      } else {
        await adminService.createDepartment(form);
        showToast("New academic division created successfully.", "success");
      }
      setIsOpen(false);
      fetchDepartments();
    } catch (err) {
      showToast("Failed to save department configurations.", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Permanently delete this department division from academic records?")) return;
    try {
      await adminService.deleteDepartment(id);
      showToast("Department deleted successfully.", "success");
      fetchDepartments();
    } catch (err) {
      showToast("Failed to delete department.", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto animate-pulse text-left">
        <div className="h-16 bg-[#102117] border border-white/5 rounded-2xl" />
        <div className="h-72 bg-[#102117] border border-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn font-sans max-w-5xl mx-auto">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border animate-fadeIn ${
          toast.type === 'success' 
            ? 'bg-[#102117] border-[#22C55E]/20 text-[#22C55E]' 
            : 'bg-[#1F1116] border-rose-500/20 text-rose-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#102117] border border-white/5 rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-emerald-500/5 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 text-left">
          <h1 className="text-xl font-extrabold text-white tracking-tight">Academic Departments</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
            Manage college departments, branches, HOD details, and curriculum codes.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 relative z-10">
          <button 
            onClick={fetchDepartments} 
            className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white cursor-pointer"
          >
            <RefreshCw size={13} />
          </button>
          <Button 
            onClick={handleCreateNew} 
            variant="primary" 
            size="sm" 
            className="flex items-center gap-1.5"
          >
            <Plus size={15} /> Add Department
          </Button>
        </div>
      </section>

      {/* Departments Table */}
      <Card className="bg-[#13261B] border-white/5 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102117] border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Dept Code</th>
                <th className="py-4 px-6">Department Name</th>
                <th className="py-4 px-6">Head of Department (HOD)</th>
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6">System Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
              {departments.length > 0 ? (
                departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-extrabold text-white">
                      {dept.code}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-200 flex items-center gap-2">
                      <Building size={14} className="text-emerald-500 shrink-0" />
                      {dept.name}
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {dept.hod_name || 'Not Configured'}
                    </td>
                    <td className="py-4 px-6 text-slate-450 truncate max-w-xs">
                      {dept.description || 'No description provided.'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase ${
                        dept.status === 'Active' 
                          ? 'bg-[#16A34A]/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}>
                        {dept.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(dept)}
                          className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:border-emerald-500/30 transition-colors cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(dept.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                          title="Delete Department"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-bold">
                    No academic divisions registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={form.id > 0 ? 'Edit Academic Department' : 'Create Academic Department'}>
        <form onSubmit={handleSave} className="flex flex-col gap-4 text-left text-xs font-semibold text-slate-350">
          <Input 
            id="code"
            name="code"
            label="Department Code*"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
            placeholder="e.g. BCA"
          />
          <Input 
            id="name"
            name="name"
            label="Department Name*"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="e.g. Bachelor of Computer Applications"
          />
          <Input 
            id="hod_name"
            name="hod_name"
            label="HOD Full Name"
            value={form.hod_name}
            onChange={(e) => setForm({ ...form, hod_name: e.target.value })}
            placeholder="e.g. Dr. Satish Kumar"
          />
          <div>
            <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Description</label>
            <textarea 
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-2.5 bg-[#102117] border border-white/10 focus:border-emerald-500/30 rounded-xl text-white outline-none"
              rows={3}
              placeholder="e.g. Core computing division"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2.5 bg-[#102117] border border-white/10 rounded-xl text-slate-200 outline-none"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Department</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default DepartmentsModule;
