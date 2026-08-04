import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, UserPlus, Edit, Trash2, Key, Filter, Download, 
  Upload, FileText, ChevronLeft, ChevronRight, CheckCircle2, 
  AlertCircle, UploadCloud, X, RefreshCw, UserCheck, UserX
} from 'lucide-react';
import { adminService } from '../../services/admin';
import type { AdminUserData, StudentStatsData } from '../../services/admin';
import { Button } from '../../components/Button';

export const StudentsModule: React.FC = () => {
  const [students, setStudents] = useState<AdminUserData[]>([]);
  const [stats, setStats] = useState<StudentStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection & Bulk
  const [selectedRolls, setSelectedRolls] = useState<Set<string>>(new Set());
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Forms
  const [formData, setFormData] = useState({
    roll_number: '', student_name: '', email: '', dob: '', 
    password: '', phone: '', department: 'BCA', semester: 3, section: 'A'
  });
  
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<{status: 'idle'|'uploading'|'done'|'error', msg: string}>({status: 'idle', msg: ''});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statsData, studentsData] = await Promise.all([
        adminService.getStudentStats(),
        adminService.getUsers() // getting all students
      ]);
      setStats(statsData);
      setStudents(studentsData);
    } catch (err) {
      console.error("Failed to load students data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length > 2) {
      try {
        const res = await adminService.searchStudents(q);
        setStudents(res);
      } catch (err) {
        console.error(err);
      }
    } else if (q.length === 0) {
      fetchData();
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRolls(new Set(currentItems.map(s => s.roll_number)));
    } else {
      setSelectedRolls(new Set());
    }
  };

  const handleSelectOne = (roll: string) => {
    const next = new Set(selectedRolls);
    if (next.has(roll)) next.delete(roll);
    else next.add(roll);
    setSelectedRolls(next);
  };

  const executeBulkAction = async (action: string) => {
    if (selectedRolls.size === 0) return;
    if (!window.confirm(`Are you sure you want to ${action} ${selectedRolls.size} students?`)) return;
    try {
      await adminService.bulkActionStudents(Array.from(selectedRolls), action);
      setSelectedRolls(new Set());
      fetchData();
    } catch (err) {
      alert(`Failed to execute bulk action: ${action}`);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createStudent(formData);
      setIsAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to add student.");
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) return;
    setImportStatus({ status: 'uploading', msg: 'Importing students...' });
    try {
      const res = await adminService.importStudents(importFile);
      setImportStatus({ status: 'done', msg: res.message });
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportFile(null);
        setImportStatus({ status: 'idle', msg: '' });
        fetchData();
      }, 2000);
    } catch (err: any) {
      setImportStatus({ status: 'error', msg: err?.response?.data?.detail || 'Import failed.' });
    }
  };

  const handleExport = () => {
    window.open('/api/admin/students/export?format=csv', '_blank');
  };

  const handleDownloadTemplate = () => {
    window.open('/api/admin/students/template', '_blank');
  };

  const handleDelete = async (roll: string) => {
    if (window.confirm(`Delete student ${roll}?`)) {
      await adminService.deleteStudent(roll);
      fetchData();
    }
  };
  
  const handleToggleStatus = async (roll: string) => {
    await adminService.toggleStudentStatus(roll);
    fetchData();
  };

  const handleResetPassword = async (roll: string) => {
    if (window.confirm(`Reset password for ${roll} to their Date of Birth?`)) {
      await adminService.resetStudentPassword(roll);
      alert('Password reset successfully.');
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = students.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(students.length / itemsPerPage);

  // Helper for generating avatar initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';
  };

  if (isLoading && !students.length) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse text-left">
        <div className="h-28 bg-[#102117] rounded-2xl" />
        <div className="h-64 bg-[#102117] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      
      {/* Header & Stats Dashboard */}
      <div className="bg-[#102117] border border-white/5 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 border-b border-white/5 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Student Management</h1>
            <p className="text-xs text-slate-400 mt-1">Manage all student accounts, imports, and credentials.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="text-xs border-white/10 hover:bg-white/5">
              <FileText size={14} className="mr-2" /> Template
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="text-xs border-white/10 hover:bg-white/5">
              <Download size={14} className="mr-2" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)} className="text-xs border-white/10 hover:bg-white/5">
              <Upload size={14} className="mr-2" /> Import
            </Button>
            <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="text-xs bg-white text-black hover:bg-slate-200">
              <UserPlus size={14} className="mr-2" /> Add Student
            </Button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { label: 'Total Students', value: stats.total, color: 'text-blue-400' },
              { label: 'Active', value: stats.active, color: 'text-emerald-400' },
              { label: 'Inactive', value: stats.inactive, color: 'text-red-400' },
              { label: 'With Resume', value: stats.with_resume, color: 'text-purple-400' },
              { label: 'Without Resume', value: stats.without_resume, color: 'text-amber-400' },
              { label: 'Logged In Today', value: stats.logged_in_today, color: 'text-cyan-400' },
            ].map((s, i) => (
              <div key={i} className="bg-black/20 rounded-2xl p-4 border border-white/5">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</div>
                <div className={`text-2xl font-black mt-2 ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Table Area */}
      <div className="bg-[#102117] border border-white/5 rounded-3xl p-6 shadow-sm">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search by name, roll number, department..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {selectedRolls.size > 0 && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-semibold text-emerald-400 mr-2">
                {selectedRolls.size} selected
              </span>
              <button onClick={() => executeBulkAction('activate')} className="text-[10px] uppercase font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 bg-emerald-500/10 rounded-lg">Activate</button>
              <button onClick={() => executeBulkAction('deactivate')} className="text-[10px] uppercase font-bold text-amber-400 hover:text-amber-300 px-2 py-1 bg-amber-500/10 rounded-lg">Suspend</button>
              <button onClick={() => executeBulkAction('reset_password')} className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300 px-2 py-1 bg-blue-500/10 rounded-lg">Reset Pass</button>
              <button onClick={() => executeBulkAction('delete')} className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 px-2 py-1 bg-red-500/10 rounded-lg">Delete</button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-white/5">
                <th className="p-3 w-10 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-600 bg-slate-800 accent-emerald-500 w-4 h-4"
                    checked={currentItems.length > 0 && selectedRolls.size === currentItems.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-400">Student</th>
                <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-400">Roll Number</th>
                <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-400">Department</th>
                <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((student) => (
                <tr key={student.roll_number} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-3 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-600 bg-slate-800 accent-emerald-500 w-4 h-4"
                      checked={selectedRolls.has(student.roll_number)}
                      onChange={() => handleSelectOne(student.roll_number)}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                        {getInitials(student.full_name || student.student_name)}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">{student.full_name || student.student_name}</div>
                        <div className="text-xs text-slate-400">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm font-medium text-slate-300">{student.roll_number}</td>
                  <td className="p-3">
                    <div className="text-sm text-slate-300">{student.department}</div>
                    <div className="text-[10px] text-slate-500">Sem {student.semester}</div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                      student.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {student.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleResetPassword(student.roll_number)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Reset Password">
                        <Key size={14} />
                      </button>
                      <button onClick={() => handleToggleStatus(student.roll_number)} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors" title="Toggle Status">
                        {student.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                      <button onClick={() => handleDelete(student.roll_number)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                    No students found. Try adjusting your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <span className="text-xs text-slate-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, students.length)} of {students.length}
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-50"
              ><ChevronLeft size={16}/></button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-50"
              ><ChevronRight size={16}/></button>
            </div>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#102117] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Add New Student</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                  <input required value={formData.student_name} onChange={e=>setFormData({...formData, student_name: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Roll Number</label>
                  <input required value={formData.roll_number} onChange={e=>setFormData({...formData, roll_number: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                  <input type="email" required value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
                  <input type="password" required value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Date of Birth</label>
                  <input type="date" required value={formData.dob} onChange={e=>setFormData({...formData, dob: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Phone</label>
                  <input value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Department</label>
                  <select value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                    <option value="BCA">BCA</option>
                    <option value="CS">Computer Science</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Semester</label>
                  <input type="number" required min="1" max="8" value={formData.semester} onChange={e=>setFormData({...formData, semester: parseInt(e.target.value)})} className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)} className="border-white/10">Cancel</Button>
                <Button type="submit" className="bg-white text-black hover:bg-slate-200">Save Student</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Wizard Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#102117] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Import Students (CSV)</h2>
              <button onClick={() => {setIsImportModalOpen(false); setImportFile(null); setImportStatus({status:'idle', msg:''});}} className="text-slate-400 hover:text-white"><X size={18}/></button>
            </div>
            
            <div className="p-6 flex flex-col gap-6 text-center">
              {importStatus.status === 'idle' && (
                <>
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 hover:border-white/20 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <UploadCloud size={48} className="mx-auto text-emerald-400 mb-4" />
                    <p className="text-sm text-white font-semibold">Click to upload CSV file</p>
                    <p className="text-xs text-slate-500 mt-1">Template columns: name, rollnumber, dateofbirth</p>
                    <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
                  </div>
                  {importFile && (
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                      <span className="text-sm font-medium text-white truncate max-w-[80%]">{importFile.name}</span>
                      <button onClick={() => setImportFile(null)} className="text-slate-400 hover:text-red-400"><X size={14}/></button>
                    </div>
                  )}
                  <div className="flex justify-end gap-3 mt-2">
                    <Button variant="outline" type="button" onClick={() => setIsImportModalOpen(false)} className="border-white/10">Cancel</Button>
                    <Button onClick={handleImportSubmit} disabled={!importFile} className="bg-white text-black hover:bg-slate-200 disabled:opacity-50">Start Import</Button>
                  </div>
                </>
              )}

              {importStatus.status === 'uploading' && (
                <div className="py-12">
                  <RefreshCw className="animate-spin text-emerald-400 mx-auto mb-4" size={32} />
                  <p className="text-white font-semibold">{importStatus.msg}</p>
                </div>
              )}

              {importStatus.status === 'done' && (
                <div className="py-12">
                  <CheckCircle2 className="text-emerald-400 mx-auto mb-4" size={48} />
                  <p className="text-white font-semibold mb-2">{importStatus.msg}</p>
                  <Button onClick={() => setIsImportModalOpen(false)} className="mt-4 bg-white text-black">Done</Button>
                </div>
              )}

              {importStatus.status === 'error' && (
                <div className="py-12">
                  <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
                  <p className="text-red-400 font-semibold mb-2">Import Failed</p>
                  <p className="text-xs text-slate-400">{importStatus.msg}</p>
                  <Button variant="outline" onClick={() => setImportStatus({status:'idle', msg:''})} className="mt-4 border-white/10">Try Again</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
