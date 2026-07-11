import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, BookOpen } from 'lucide-react';
import { Button } from '../../components/Button';
import { adminService } from '../../services/admin';
import type { SubjectData, DepartmentData } from '../../services/admin';

export const SubjectsModule: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    id: 0,
    code: '',
    name: '',
    department_code: '',
    semester: 3,
    credits: 3,
    faculty_name: ''
  });

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateNew = () => {
    const defaultDept = departments.length > 0 ? departments[0].code : '';
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
      } else {
        await adminService.createSubject(form);
      }
      setIsOpen(false);
      fetchData();
    } catch (err) {
      alert("Failed to save curriculum subject.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Permanently delete this curriculum subject from database?")) return;
    try {
      await adminService.deleteSubject(id);
      fetchData();
    } catch (err) {
      alert("Delete failed.");
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await adminService.archiveSubject(id);
      fetchData();
    } catch (err) {
      alert("Failed to archive subject.");
    }
  };

  if (isLoading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-6 animate-fadeIn text-left">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Institutional Subject Catalog</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Configure study course credits faculty mapping and syllabus modules</p>
        </div>

        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 rounded-xl hover:bg-slate-50 border border-slate-200 text-slate-500 cursor-pointer">
            <RefreshCw size={13} />
          </button>
          <Button onClick={handleCreateNew} variant="primary" size="sm" className="bg-blue-600 font-bold gap-1 text-[11px]">
            <Plus size={14} /> Add Subject
          </Button>
        </div>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto no-scrollbar border border-slate-100 rounded-2xl">
        <table className="w-full text-left text-xs font-medium border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
              <th className="py-3 px-4">Subject identity</th>
              <th className="py-3 px-4">Academic Division</th>
              <th className="py-3 px-4">Semester Level</th>
              <th className="py-3 px-4">Credits Rating</th>
              <th className="py-3 px-4">Faculty instructor</th>
              <th className="py-3 px-4 text-right">Actions Panel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subjects.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                  No courses registered in college catalog databases.
                </td>
              </tr>
            ) : (
              subjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/50 transition-smooth">
                  <td className="py-3.5 px-4 font-bold text-slate-750">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-slate-400" />
                      <div>
                        <span>{sub.name}</span>
                        <span className="text-[9px] text-slate-400 block font-black uppercase mt-0.5">{sub.code}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-500">{sub.department_code}</td>
                  <td className="py-3.5 px-4 font-semibold">Sem {sub.semester}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-600">{sub.credits} credits</td>
                  <td className="py-3.5 px-4 text-slate-500 font-bold">{sub.faculty_name || 'Not assigned'}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end gap-2 items-center">
                      <button onClick={() => handleEdit(sub)} className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">Edit</button>
                      <button onClick={() => handleArchive(sub.id)} className="text-[10px] text-orange-500 font-bold hover:underline cursor-pointer" title="Archive Subject">Archive</button>
                      <button onClick={() => handleDelete(sub.id)} className="text-[10px] text-red-650 font-bold hover:underline cursor-pointer">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-xl text-left">
            <h4 className="text-sm font-extrabold text-slate-800 mb-4">{form.id > 0 ? "Edit Curriculum Subject" : "Create Subject Details"}</h4>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Subject Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                  placeholder="e.g. CS-301"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Subject Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                  placeholder="e.g. Data Structures & Algorithms"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Department Division</label>
                <select
                  value={form.department_code}
                  onChange={(e) => setForm({ ...form, department_code: e.target.value })}
                  className="w-full pl-3 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 cursor-pointer"
                  required
                >
                  {departments.map(d => (
                    <option key={d.code} value={d.code}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Semester</label>
                  <input
                    type="number"
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) })}
                    className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                    min={1}
                    max={8}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Credits Weight</label>
                  <input
                    type="number"
                    value={form.credits}
                    onChange={(e) => setForm({ ...form, credits: parseInt(e.target.value) })}
                    className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                    min={1}
                    max={6}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Faculty In Charge</label>
                <input
                  type="text"
                  value={form.faculty_name}
                  onChange={(e) => setForm({ ...form, faculty_name: e.target.value })}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-bold"
                  placeholder="e.g. Prof. Marvin Minsky"
                />
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
                Save Subject
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default SubjectsModule;
