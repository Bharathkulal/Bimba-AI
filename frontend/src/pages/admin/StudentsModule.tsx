import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Activity, GraduationCap, Award, Compass, Search, UserPlus, 
  Edit, Trash2, Key, ToggleLeft, ToggleRight, CheckCircle2, 
  AlertTriangle, Phone, Mail, Calendar, User, BookOpen, Layers, CheckSquare
} from 'lucide-react';
import { adminService } from '../../services/admin';
import type { AdminUserData } from '../../services/admin';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export const StudentsModule: React.FC = () => {
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AdminUserData | null>(null);

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
      student_name: student.student_name,
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
      showToast("Student account created successfully! Initial password set to DOB.", "success");
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
      showToast("Student account updated successfully.", "success");
      setIsEditModalOpen(false);
      fetchAll();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to update student.", "error");
    }
  };

  const handleDeleteStudent = async (rollNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete student ${rollNumber}? This action is permanent.`)) {
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
    if (!window.confirm(`Reset password for student ${rollNumber} back to their Date of Birth?`)) {
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
      showToast(`Student status toggled to ${res.status}.`, "success");
      fetchAll();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to change student status.", "error");
    }
  };

  // Filter students
  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    return (
      u.roll_number.toLowerCase().includes(query) ||
      u.student_name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.department.toLowerCase().includes(query)
    );
  });

  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return 'Never Logged In';
    return new Date(isoStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && users.length === 0) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn font-sans relative px-2">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-xl animate-fadeIn ${
          toast.type === 'success' 
            ? 'bg-emerald-50/90 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50/90 border-rose-100 text-rose-800'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
          ) : (
            <AlertTriangle className="text-rose-500 shrink-0" size={20} />
          )}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Selector Header */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-850">Student Management Directory</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
            Create, edit, suspend, or delete student accounts and reset default credentials
          </p>
        </div>
        
        <Button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-md shadow-blue-500/10"
        >
          <UserPlus size={16} /> Add New Student
        </Button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/70 border border-slate-200/50 rounded-2xl p-4">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by Roll Number, Name, Email, or Department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-blue-500 transition-smooth placeholder:text-slate-400"
          />
        </div>
        
        <div className="flex gap-4 text-xs font-bold text-slate-500 shrink-0">
          <div>Total: <span className="text-slate-850 font-black">{users.length}</span></div>
          <div className="h-4 w-px bg-slate-200" />
          <div>Active: <span className="text-emerald-600 font-black">{users.filter(u => u.status === 'Active').length}</span></div>
          <div className="h-4 w-px bg-slate-200" />
          <div>Suspended: <span className="text-rose-600 font-black">{users.filter(u => u.status === 'Suspended').length}</span></div>
        </div>
      </div>

      {/* Main Student Table */}
      <Card className="bg-white border border-slate-200/60 shadow-sm rounded-3xl overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Student ID / Roll</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">DOB</th>
                <th className="py-4 px-6">Email / Phone</th>
                <th className="py-4 px-6">Dept / Sem</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Last Login</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* ID / Roll */}
                    <td className="py-4 px-6">
                      <span className="font-extrabold text-slate-850 block">{user.roll_number}</span>
                      <span className="text-[10px] text-slate-400">Database ID: {user.id}</span>
                    </td>
                    {/* Name */}
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {user.full_name || user.student_name}
                    </td>
                    {/* DOB */}
                    <td className="py-4 px-6 text-slate-500">
                      {user.dob}
                    </td>
                    {/* Email / Phone */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-650 flex items-center gap-1"><Mail size={12} className="text-slate-400" />{user.email}</span>
                        {user.phone && <span className="text-slate-400 flex items-center gap-1"><Phone size={12} className="text-slate-350" />{user.phone}</span>}
                      </div>
                    </td>
                    {/* Dept / Sem */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-slate-800">{user.department}</span>
                        <span className="text-[10px] text-slate-400 font-bold">Semester {user.semester}</span>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.8 rounded-lg text-[9px] font-black uppercase border ${
                        user.status === 'Active' 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                          : 'bg-rose-50 border-rose-100 text-rose-600'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    {/* Last Login */}
                    <td className="py-4 px-6 text-slate-450 font-semibold">
                      {formatDate(user.last_login)}
                    </td>
                    {/* Actions */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(user)}
                          title="Edit Student"
                          className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer border border-slate-100"
                        >
                          <Edit size={14} />
                        </button>
                        {/* Reset Password */}
                        <button
                          onClick={() => handleResetPassword(user.roll_number)}
                          title="Reset Password to DOB"
                          className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-all cursor-pointer border border-slate-100"
                        >
                          <Key size={14} />
                        </button>
                        {/* Toggle Status */}
                        <button
                          onClick={() => handleToggleStatus(user.roll_number)}
                          title={user.status === 'Active' ? 'Deactivate Student' : 'Activate Student'}
                          className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer border border-slate-100"
                        >
                          {user.status === 'Active' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteStudent(user.roll_number)}
                          title="Delete Student"
                          className="p-2 rounded-lg bg-slate-50 text-slate-505 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer border border-slate-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold text-xs">
                    No students match your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal 1: Add Student */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Student">
        <form onSubmit={handleAddStudent} className="flex flex-col gap-4 text-left">
          <Input 
            id="roll_number"
            name="roll_number"
            label="Roll Number (Unique)*"
            type="text"
            placeholder="e.g. 23BCA045"
            value={formData.roll_number}
            onChange={handleInputChange}
            required
          />
          <Input 
            id="student_name"
            name="student_name"
            label="Student Full Name*"
            type="text"
            placeholder="e.g. Rohan Sharma"
            value={formData.student_name}
            onChange={handleInputChange}
            required
          />
          <Input 
            id="email"
            name="email"
            label="Student Email Address*"
            type="email"
            placeholder="e.g. rohan@bimba.ai"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <Input 
            id="dob"
            name="dob"
            label="Date of Birth (Initial Password)*"
            type="text"
            placeholder="DD-MM-YYYY"
            helperText="Format: DD-MM-YYYY (e.g., 29-05-2007)"
            value={formData.dob}
            onChange={handleInputChange}
            required
          />
          <Input 
            id="phone"
            name="phone"
            label="Phone Number"
            type="text"
            placeholder="e.g. +91 9876543210"
            value={formData.phone}
            onChange={handleInputChange}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="department" className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Department*</label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/70 text-slate-800 text-sm shadow-sm focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="CS">Computer Science</option>
                <option value="BCA">Computer Applications</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="semester" className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Semester Level*</label>
              <select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/70 text-slate-800 text-sm shadow-sm focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {[1,2,3,4,5,6,7,8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3.5 border-t border-slate-100 pt-5 mt-3">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
              Register Student
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Edit Student */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Student Details: ${selectedStudent?.roll_number}`}>
        <form onSubmit={handleEditStudent} className="flex flex-col gap-4 text-left">
          <Input 
            id="roll_number_edit"
            name="roll_number"
            label="Roll Number"
            type="text"
            value={formData.roll_number}
            disabled
            className="bg-slate-50 cursor-not-allowed text-slate-400"
          />
          <Input 
            id="student_name_edit"
            name="student_name"
            label="Student Full Name*"
            type="text"
            placeholder="e.g. Rohan Sharma"
            value={formData.student_name}
            onChange={handleInputChange}
            required
          />
          <Input 
            id="email_edit"
            name="email"
            label="Student Email Address*"
            type="email"
            placeholder="e.g. rohan@bimba.ai"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <Input 
            id="dob_edit"
            name="dob"
            label="Date of Birth*"
            type="text"
            placeholder="DD-MM-YYYY"
            value={formData.dob}
            onChange={handleInputChange}
            required
          />
          <Input 
            id="phone_edit"
            name="phone"
            label="Phone Number"
            type="text"
            placeholder="e.g. +91 9876543210"
            value={formData.phone}
            onChange={handleInputChange}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="department_edit" className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Department*</label>
              <select
                id="department_edit"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/70 text-slate-800 text-sm shadow-sm focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="CS">Computer Science</option>
                <option value="BCA">Computer Applications</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="semester_edit" className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Semester Level*</label>
              <select
                id="semester_edit"
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/70 text-slate-800 text-sm shadow-sm focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {[1,2,3,4,5,6,7,8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status_edit" className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Account Status*</label>
            <select
              id="status_edit"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/70 text-slate-800 text-sm shadow-sm focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <div className="flex justify-end gap-3.5 border-t border-slate-100 pt-5 mt-3">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
export default StudentsModule;
