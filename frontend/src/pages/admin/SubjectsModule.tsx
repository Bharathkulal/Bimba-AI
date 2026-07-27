import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, BookOpen, Edit3, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { adminService } from '../../services/admin';
import type { SubjectData, DepartmentData } from '../../services/admin';

export const SubjectsModule: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    id: 0,
    code: '',
    name: '',
    department_code: '',
    semester: 3,
    credits: 3,
    faculty_name: ''
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [subjData, deptData] = await Promise.all([
        adminService.getSubjects(),
        adminService.getDepartments()
      ]);
      setSubjects(subjData);
      setDepartments(deptData);
    } catch (err) {
      console.error("Failed to load subject index data:", err);
      showToast("Failed to retrieve academic subjects list.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateNew = () => {
    const defaultDept = departments.length > 0 ? departments[0].code : 'BCA';
    setForm({ id: 0, code: '', name: '', department_code: defaultDept, semester: 3, credits: 3, faculty_name: '' });
    setIsOpen(true);
  };

  const handleEdit = (subj: SubjectData) => {
    setForm({
      id: subj.id,
      code: subj.code,
      name: subj.name,
      department_code: subj.department_code,
      semester: subj.semester,
      credits: subj.credits,
      faculty_name: subj.faculty_name
    });
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (form.id > 0) {
        await adminService.editSubject(form.id, form);
        showToast("Subject curriculum details updated.", "success");
      } else {
        await adminService.createSubject(form);
        showToast("New subject added to academic curriculum.", "success");
      }
      setIsOpen(false);
      fetchData();
    } catch (err) {
      showToast("Failed to save curriculum subject.", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Permanently delete this subject from database?")) return;
    try {
      await adminService.deleteSubject(id);
      showToast("Subject deleted successfully.", "success");
      fetchData();
    } catch (err) {
      showToast("Failed to delete subject.", "error");
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
            ? 'bg-[#102117] border-[#111111]/20 text-[#111111]' 
            : 'bg-[#1F1116] border-rose-500/20 text-rose-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#102117] border border-white/5 rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l -[#111111]/5 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 text-left">
          <h1 className="text-xl font-extrabold text-white tracking-tight">Academic Subjects</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
            Configure semesters courses list, credits distribution, and assigned faculty.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 relative z-10">
          <button 
            onClick={fetchData} 
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
            <Plus size={15} /> Add Subject
          </Button>
        </div>
      </section>

      {/* Subjects Grid Table */}
      <Card className="bg-[#13261B] border-white/5 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102117] border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Subject Code</th>
                <th className="py-4 px-6">Subject Name</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Semester</th>
                <th className="py-4 px-6">Credits weight</th>
                <th className="py-4 px-6">Assigned Faculty</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
              {subjects.length > 0 ? (
                subjects.map((subj) => (
                  <tr key={subj.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-extrabold text-white">
                      {subj.code}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-200 flex items-center gap-2">
                      <BookOpen size={14} className="-[#111111] shrink-0" />
                      {subj.name}
                    </td>
                    <td className="py-4 px-6 font-black text-slate-350">
                      {subj.department_code}
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      Semester {subj.semester}
                    </td>
                    <td className="py-4 px-6">
                      <span className="-[#111111]/10 border -[#111111]/20 text-[#111111] px-2 py-0.5 rounded text-[10px] font-bold">
                        {subj.credits} Credits
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {subj.faculty_name || 'Not Configured'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(subj)}
                          className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:-[#111111]/30 transition-colors cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(subj.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                          title="Delete Subject"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-bold">
                    No curriculum subjects registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={form.id > 0 ? 'Edit Subject Details' : 'Create Curriculum Subject'}>
        <form onSubmit={handleSave} className="flex flex-col gap-4 text-left text-xs font-semibold text-slate-350">
          <Input 
            id="code"
            name="code"
            label="Subject Code*"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
            placeholder="e.g. 23BCA23T"
          />
          <Input 
            id="name"
            name="name"
            label="Subject Name*"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="e.g. Data Structures & Algorithms"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Target Department</label>
              <select
                value={form.department_code}
                onChange={(e) => setForm({ ...form, department_code: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#102117] border border-white/10 rounded-xl text-slate-200 outline-none"
              >
                {departments.map(d => <option key={d.code} value={d.code}>{d.code} - {d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Semester</label>
              <select
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2.5 bg-[#102117] border border-white/10 rounded-xl text-slate-200 outline-none"
              >
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input 
                id="credits"
                name="credits"
                label="Credits weight*"
                type="number"
                value={form.credits}
                onChange={(e) => setForm({ ...form, credits: parseInt(e.target.value) || 3 })}
                required
                min={1}
                max={6}
              />
            </div>
            <div>
              <Input 
                id="faculty_name"
                name="faculty_name"
                label="Assigned Faculty Name"
                value={form.faculty_name}
                onChange={(e) => setForm({ ...form, faculty_name: e.target.value })}
                placeholder="e.g. Dr. Rajesh Kumar"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Subject</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default SubjectsModule;
