import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '../../components/Button';
import { adminService } from '../../services/admin';
import type { DepartmentData } from '../../services/admin';

export const DepartmentsModule: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal Form States
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    id: 0,
    code: '',
    name: '',
    description: '',
    hod_name: '',
    status: 'Active'
  });

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error("Failed to fetch departments list:", err);
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
      } else {
        await adminService.createDepartment(form);
      }
      setIsOpen(false);
      fetchDepartments();
    } catch (err) {
      alert("Failed to save department configurations.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Permanently delete this department academic division?")) return;
    try {
      await adminService.deleteDepartment(id);
      fetchDepartments();
    } catch (err) {
      alert("Delete failed.");
    }
  };

  if (isLoading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Header section */}
      <div className="flex justify-between items-center bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Academic Divisions & Departments</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Manage institutional departments faculty metrics and curriculum groups</p>
        </div>
        
        <div className="flex gap-2">
          <button onClick={fetchDepartments} className="p-2 rounded-xl hover:bg-slate-50 border border-slate-200 text-slate-500 cursor-pointer">
            <RefreshCw size={13} />
          </button>
          <Button onClick={handleCreateNew} variant="primary" size="sm" className="bg-blue-600 font-bold gap-1 text-[11px]">
            <Plus size={14} /> Add Division
          </Button>
        </div>
      </div>

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {departments.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-12 text-center text-slate-400 col-span-full shadow-sm font-bold text-xs">
            No active departments found.
          </div>
        ) : (
          departments.map((d) => (
            <div key={d.id} className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between min-h-60 shadow-sm hover:shadow transition-all duration-200">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-base text-slate-800">{d.name}</h4>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">Division code: {d.code}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    d.status === 'Active' 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                      : 'bg-rose-50 border-rose-100 text-rose-600'
                  }`}>
                    {d.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed mt-4 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  {d.description || "No description provided."}
                </p>

                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Students</span>
                    <h5 className="text-sm font-black text-slate-700 mt-1">{d.student_count ?? 120}</h5>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Subjects</span>
                    <h5 className="text-sm font-black text-slate-700 mt-1">{d.subject_count ?? 8}</h5>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Faculty</span>
                    <h5 className="text-sm font-black text-slate-700 mt-1">{d.faculty_count ?? 6}</h5>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-450">HOD: {d.hod_name || "Not assigned"}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(d)} className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">Edit</button>
                  <button onClick={() => handleDelete(d.id)} className="text-[10px] text-red-650 font-bold hover:underline cursor-pointer">Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal Popup */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-xl text-left">
            <h4 className="text-sm font-extrabold text-slate-800 mb-4">{form.id > 0 ? "Modify Division Details" : "Create Academic Division"}</h4>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Department Code</label>
                <input
                  type="text"
                  disabled={form.id > 0}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                  placeholder="e.g. ME"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Department Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                  placeholder="e.g. Mechanical Engineering"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Description details</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-750"
                  placeholder="Enter details..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Head of Department (HOD)</label>
                <input
                  type="text"
                  value={form.hod_name}
                  onChange={(e) => setForm({ ...form, hod_name: e.target.value })}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                  placeholder="e.g. Dr. Ada Lovelace"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Status state</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full pl-3 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 cursor-pointer"
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
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50 cursor-pointer"
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
export default DepartmentsModule;
