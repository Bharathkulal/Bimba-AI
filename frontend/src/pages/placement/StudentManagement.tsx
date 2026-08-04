import React, { useState, useEffect } from 'react';
import { GraduationCap, Search, Filter, Edit, CheckCircle, X, ShieldAlert } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { placementService } from '../../services/placement';
import type { PlacementStudent } from '../../services/placement';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<PlacementStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedEligibility, setSelectedEligibility] = useState('All');
  const [selectedPlacement, setSelectedPlacement] = useState('All');

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<PlacementStudent | null>(null);
  const [editCGPA, setEditCGPA] = useState('');
  const [editEligibility, setEditEligibility] = useState('Eligible');
  const [editPlacement, setEditPlacement] = useState('Unplaced');

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const data = await placementService.getStudents();
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleEditClick = (student: PlacementStudent) => {
    setEditingStudent(student);
    setEditCGPA(student.cgpa.toString());
    setEditEligibility(student.eligibility_status);
    setEditPlacement(student.placement_status);
    setIsEditModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      await placementService.updateStudent(editingStudent.roll_number, {
        cgpa: parseFloat(editCGPA),
        eligibility_status: editEligibility,
        placement_status: editPlacement
      });
      setIsEditModalOpen(false);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert("Failed to update student profile.");
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      (s.student_name || s.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesDept = selectedDept === 'All' || s.department === selectedDept;
    const matchesEligibility = selectedEligibility === 'All' || s.eligibility_status === selectedEligibility;
    const matchesPlacement = selectedPlacement === 'All' || s.placement_status === selectedPlacement;

    return matchesSearch && matchesDept && matchesEligibility && matchesPlacement;
  });

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold tracking-tight">Student Directory</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
          Review, search, and update eligibility status and placement results
        </p>
      </div>

      {/* Filters Box */}
      <Card className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="flex-grow relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by student name or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500 text-slate-600 dark:text-slate-200"
          >
            <option value="All">All Departments</option>
            <option value="CS">CS</option>
            <option value="BCA">BCA</option>
            <option value="ECE">ECE</option>
            <option value="MECH">MECH</option>
          </select>

          <select
            value={selectedEligibility}
            onChange={(e) => setSelectedEligibility(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500 text-slate-600 dark:text-slate-200"
          >
            <option value="All">All Eligibility</option>
            <option value="Eligible">Eligible</option>
            <option value="Not Eligible">Not Eligible</option>
          </select>

          <select
            value={selectedPlacement}
            onChange={(e) => setSelectedPlacement(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500 text-slate-600 dark:text-slate-200"
          >
            <option value="All">All Statuses</option>
            <option value="Unplaced">Unplaced</option>
            <option value="Placed">Placed</option>
          </select>
        </div>
      </Card>

      {/* Directory Table */}
      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading student profiles...</div>
        ) : filteredStudents.length > 0 ? (
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 font-extrabold uppercase bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4 text-center">CGPA</th>
                <th className="px-6 py-4 text-center">Eligibility</th>
                <th className="px-6 py-4 text-center">Placement Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredStudents.map((student) => (
                <tr key={student.roll_number} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{student.student_name || student.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{student.roll_number} • Sem {student.semester}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-550 dark:text-slate-350">{student.department}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-200">
                    {student.cgpa !== null && student.cgpa !== undefined ? student.cgpa : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                      student.eligibility_status === 'Eligible' 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600'
                    }`}>
                      {student.eligibility_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                      student.placement_status === 'Placed' 
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' 
                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
                    }`}>
                      {student.placement_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEditClick(student)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-emerald-500 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center border border-slate-200 dark:border-white/10"
                    >
                      <Edit size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-20 text-center text-xs text-slate-400">No student records found.</div>
        )}
      </Card>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Placement Profile"
      >
        {editingStudent && (
          <form onSubmit={handleSaveStudent} className="flex flex-col gap-4 text-left">
            <div>
              <p className="text-xs text-slate-400">Student Name</p>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                {editingStudent.student_name || editingStudent.full_name}
              </h4>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
                Academic CGPA
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={editCGPA}
                onChange={(e) => setEditCGPA(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
                Eligibility Status
              </label>
              <select
                value={editEligibility}
                onChange={(e) => setEditEligibility(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500 text-slate-600 dark:text-slate-200"
              >
                <option value="Eligible">Eligible</option>
                <option value="Not Eligible">Not Eligible</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
                Placement Status
              </label>
              <select
                value={editPlacement}
                onChange={(e) => setEditPlacement(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500 text-slate-600 dark:text-slate-200"
              >
                <option value="Unplaced">Unplaced</option>
                <option value="Placed">Placed</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700">
                Save Profile
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
export default StudentManagement;
