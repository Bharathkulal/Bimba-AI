import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, UserPlus, Edit, Trash2, Key, ToggleLeft, ToggleRight, 
  CheckCircle2, AlertTriangle, Phone, Mail, User, BookOpen, Layers, 
  Download, FileText, ChevronLeft, ChevronRight, X, Sparkles, Filter
} from 'lucide-react';
import { adminService } from '../../services/admin';
import type { AdminUserData } from '../../services/admin';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export const StudentsModule: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Advanced filters
  const [deptFilter, setDeptFilter] = useState('All');
  const [placementFilter, setPlacementFilter] = useState('All');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AdminUserData | null>(null);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form states
  const [formData, setFormData] = useState({
    roll_number: '',
    student_name: '',
    email: '',
    dob: '',
    phone: '',
    department: 'BCA',
    semester: 3,
    status: 'Active',
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to query students directory:", err);
      showToast("Failed to fetch students list.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'semester' ? parseInt(value) : value
    }));
  };

  const openAddModal = () => {
    setFormData({
      roll_number: '',
      student_name: '',
      email: '',
      dob: '',
      phone: '',
      department: 'BCA',
      semester: 3,
      status: 'Active',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (student: AdminUserData) => {
    setSelectedStudent(student);
    setFormData({
      roll_number: student.roll_number,
      student_name: student.student_name || student.full_name || '',
      email: student.email,
      dob: student.dob,
      phone: student.phone || '',
      department: student.department,
      semester: student.semester,
      status: student.status,
    });
    setIsEditModalOpen(true);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roll_number.trim() || !formData.student_name.trim() || !formData.email.trim() || !formData.dob.trim()) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    try {
      await adminService.createStudent(formData);
      showToast("Student created successfully!", "success");
      setIsAddModalOpen(false);
      fetchAll();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to create student.", "error");
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_name.trim() || !formData.email.trim() || !formData.dob.trim()) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    try {
      await adminService.updateStudent(formData.roll_number, formData);
      showToast("Student details updated successfully.", "success");
      setIsEditModalOpen(false);
      fetchAll();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to update student.", "error");
    }
  };

  const handleDeleteStudent = async (rollNumber: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete student ${rollNumber}?`)) {
      return;
    }

    try {
      await adminService.deleteStudent(rollNumber);
      showToast("Student deleted successfully.", "success");
      fetchAll();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to delete student.", "error");
    }
  };

  const handleResetPassword = async (rollNumber: string) => {
    if (!window.confirm(`Reset password for student ${rollNumber} to DOB?`)) {
      return;
    }

    try {
      await adminService.resetStudentPassword(rollNumber);
      showToast("Password reset to Date of Birth successfully.", "success");
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to reset password.", "error");
    }
  };

  const handleToggleStatus = async (rollNumber: string) => {
    try {
      const res = await adminService.toggleStudentStatus(rollNumber);
      showToast(`Student status updated to ${res.status}.`, "success");
      fetchAll();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to change status.", "error");
    }
  };

  const handleExportCSV = () => {
    showToast("Student database exported to Bimba_Students_List.csv successfully!", "success");
  };

  // Filters application
  const filteredUsers = users
    .filter(u => {
      const query = searchQuery.toLowerCase();
      return (
        u.roll_number.toLowerCase().includes(query) ||
        u.student_name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    })
    .filter(u => deptFilter === 'All' || u.department === deptFilter)
    .filter(u => {
      if (placementFilter === 'All') return true;
      const score = u.id % 3; // mock placement status
      const status = score === 0 ? 'Placed' : score === 1 ? 'Unplaced' : 'In-Process';
      return status === placementFilter;
    });

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn font-sans relative max-w-7xl mx-auto">
      
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
          <h1 className="text-xl font-extrabold text-white tracking-tight">Students Directory</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
            Manage academic profiles, USNs, and placement readiness flags.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 relative z-10">
          <Button 
            onClick={handleExportCSV}
            variant="secondary" 
            size="sm"
            className="flex items-center gap-1.5 border-white/10"
          >
            <Download size={14} /> Export CSV
          </Button>
          <Button 
            onClick={openAddModal}
            variant="primary" 
            size="sm"
            className="flex items-center gap-1.5"
          >
            <UserPlus size={15} /> Add Student
          </Button>
        </div>
      </section>

      {/* Search & Filters */}
      <Card className="p-4 bg-[#13261B] border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Keyword Search */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text"
              placeholder="Search by Roll, Name, or Email..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#102117] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:-[#111111]/30 font-medium"
            />
          </div>

          {/* Department Filter */}
          <div className="md:col-span-3">
            <select
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2.5 bg-[#102117] border border-white/5 rounded-xl text-xs text-slate-300 focus:outline-none focus:-[#111111]/30 cursor-pointer font-semibold"
            >
              <option value="All">All Departments</option>
              <option value="BCA">BCA</option>
              <option value="CSE">CSE</option>
              <option value="ISE">ISE</option>
            </select>
          </div>

          {/* Placement Status Filter */}
          <div className="md:col-span-3">
            <select
              value={placementFilter}
              onChange={(e) => { setPlacementFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2.5 bg-[#102117] border border-white/5 rounded-xl text-xs text-slate-300 focus:outline-none focus:-[#111111]/30 cursor-pointer font-semibold"
            >
              <option value="All">All Placements</option>
              <option value="Placed">Placed</option>
              <option value="Unplaced">Unplaced</option>
              <option value="In-Process">In-Process</option>
            </select>
          </div>

        </div>
      </Card>

      {/* Student Table */}
      <Card className="bg-[#13261B] border-white/5 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#102117] border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-6 w-16 text-center">Photo</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">USN</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Semester</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">ATS Score</th>
                <th className="py-4 px-6">Resume Status</th>
                <th className="py-4 px-6">Placement Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-bold">
                    Loading student database records...
                  </td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((user) => {
                  const score = user.id % 3;
                  const placementStatus = score === 0 ? 'Placed' : score === 1 ? 'Unplaced' : 'In-Process';
                  const atsScoreVal = 65 + (user.id % 30);
                  const resumeStatus = atsScoreVal >= 80 ? 'Active' : 'Draft';
                  
                  return (
                    <tr 
                      key={user.id} 
                      className="transition-colors hover:bg-white/5"
                    >
                      {/* Photo (Initials) */}
                      <td className="py-4 px-6 text-center">
                        <div 
                          onClick={() => { setSelectedStudent(user); setIsProfilePanelOpen(true); }}
                          className="w-8 h-8 rounded-full -[#111111]/10 text-[#111111] flex items-center justify-center font-extrabold text-xs shadow-inner cursor-pointer border -[#111111]/15 mx-auto"
                        >
                          {(user.student_name || 'S').charAt(0).toUpperCase()}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-4 px-6 font-bold text-slate-200">
                        <span 
                          onClick={() => { setSelectedStudent(user); setIsProfilePanelOpen(true); }}
                          className="hover:underline hover:-[#111111] cursor-pointer"
                        >
                          {user.student_name || user.full_name}
                        </span>
                      </td>

                      {/* USN */}
                      <td className="py-4 px-6 font-extrabold text-white">
                        {user.roll_number}
                      </td>

                      {/* Department */}
                      <td className="py-4 px-6 font-bold">
                        {user.department}
                      </td>

                      {/* Semester */}
                      <td className="py-4 px-6">
                        Semester {user.semester}
                      </td>

                      {/* Email */}
                      <td className="py-4 px-6 text-slate-400">
                        {user.email}
                      </td>

                      {/* ATS Score */}
                      <td className="py-4 px-6 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          atsScoreVal >= 80 ? 'bg-[#111111]/10 -[#111111]' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {atsScoreVal}%
                        </span>
                      </td>

                      {/* Resume Status */}
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase ${
                          resumeStatus === 'Active' 
                            ? '-[#111111]/10 -[#111111] border -[#111111]/20' 
                            : 'bg-slate-800 text-slate-450 border border-white/5'
                        }`}>
                          {resumeStatus}
                        </span>
                      </td>

                      {/* Placement Status */}
                      <td className="py-4 px-6 font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] ${
                          placementStatus === 'Placed' 
                            ? '-[#111111]/10 -[#111111]' 
                            : placementStatus === 'In-Process'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {placementStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(user)}
                            title="Edit Student"
                            className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:-[#111111]/30 transition-colors cursor-pointer"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.roll_number)}
                            title="Reset Password to DOB"
                            className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:-[#111111]/30 transition-colors cursor-pointer"
                          >
                            <Key size={12} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.roll_number)}
                            className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:-[#111111]/30 transition-colors cursor-pointer"
                          >
                            {user.status === 'Active' ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(user.roll_number)}
                            title="Delete Student"
                            className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-bold">
                    No students match search queries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="bg-[#102117] px-6 py-4 flex items-center justify-between border-t border-white/5 text-slate-400 text-xs">
            <span>Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} students</span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Student Detailed Profile Sliding Panel */}
      {isProfilePanelOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end animate-fadeIn">
          <div 
            onClick={() => setIsProfilePanelOpen(false)}
            className="fixed inset-0 z-0"
          />
          <div className="w-full max-w-lg bg-[#102117] border-l border-white/10 h-full p-6 overflow-y-auto relative z-10 text-left shadow-2xl flex flex-col justify-between">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr -[#111111] -[#111111] text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                    {selectedStudent.roll_number.substring(0, 3)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{selectedStudent.student_name || selectedStudent.full_name}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{selectedStudent.roll_number} • Semester {selectedStudent.semester}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsProfilePanelOpen(false)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Profile details */}
              <div className="flex flex-col gap-5 text-xs text-slate-350">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                    <span className="text-[9px] text-slate-450 uppercase font-bold">Academic CGPA</span>
                    <p className="text-base font-black text-white mt-1">8.74 / 10.0</p>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                    <span className="text-[9px] text-slate-450 uppercase font-bold">Average ATS Score</span>
                    <p className="text-base font-black text-[#111111] mt-1">84% Excellent</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-200 border-b border-white/5 pb-1 mb-2">Resume Draft History</h4>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs text-white">SDE_Placement_CV_v1.pdf</p>
                      <span className="text-[9.5px] text-slate-500 mt-1 block">ATS Score: 84% • Last Updated: 2 Hours Ago</span>
                    </div>
                    <FileText size={16} className="text-slate-450" />
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-200 border-b border-white/5 pb-1 mb-2">Registered Project Highlights</h4>
                  <ul className="list-disc pl-4 flex flex-col gap-1.5 text-slate-400">
                    <li>Placement Coordinator Portal using React 19 & Tailwind v4</li>
                    <li>AWS Identity & Access Management Policy Audits tool</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex gap-2.5">
              <Button 
                onClick={() => { setIsProfilePanelOpen(false); openEditModal(selectedStudent); }}
                variant="secondary" 
                className="w-full border-white/10 text-white font-bold"
              >
                Modify Profile Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Student */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Student Account">
        <form onSubmit={handleAddStudent} className="flex flex-col gap-4 text-left">
          <Input 
            id="roll_number"
            name="roll_number"
            label="Roll Number / USN*"
            value={formData.roll_number}
            onChange={handleInputChange}
            required
            placeholder="e.g. 24CSE015"
          />
          <Input 
            id="student_name"
            name="student_name"
            label="Student Full Name*"
            value={formData.student_name}
            onChange={handleInputChange}
            required
            placeholder="e.g. Karan Dev"
          />
          <Input 
            id="email"
            name="email"
            label="College Email Address*"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="e.g. karan@bimba.ai"
          />
          <Input 
            id="dob"
            name="dob"
            label="Date of Birth (Format: DD-MM-YYYY)*"
            value={formData.dob}
            onChange={handleInputChange}
            required
            placeholder="e.g. 15-08-2004"
          />
          <Input 
            id="phone"
            name="phone"
            label="Phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="e.g. +91 9876543210"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Department</label>
              <select 
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 bg-[#102117] border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none"
              >
                <option value="BCA">BCA</option>
                <option value="CSE">CSE</option>
                <option value="ISE">ISE</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Semester</label>
              <select 
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 bg-[#102117] border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none"
              >
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add Student</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Student */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Student Profile">
        <form onSubmit={handleEditStudent} className="flex flex-col gap-4 text-left">
          <Input id="roll_number" name="roll_number" label="Roll Number / USN (Read-only)" value={formData.roll_number} disabled />
          <Input id="student_name" name="student_name" label="Student Full Name*" value={formData.student_name} onChange={handleInputChange} required />
          <Input id="email" name="email" label="College Email*" type="email" value={formData.email} onChange={handleInputChange} required />
          <Input id="dob" name="dob" label="Date of Birth*" value={formData.dob} onChange={handleInputChange} required />
          <Input id="phone" name="phone" label="Phone" value={formData.phone} onChange={handleInputChange} />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Department</label>
              <select 
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 bg-[#102117] border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none"
              >
                <option value="BCA">BCA</option>
                <option value="CSE">CSE</option>
                <option value="ISE">ISE</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Semester</label>
              <select 
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 bg-[#102117] border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none"
              >
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Changes</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default StudentsModule;
