import React, { useState, useEffect } from 'react';
import { FileText, Check, X, Search, MessageSquare, AlertCircle } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { placementService } from '../../services/placement';
import type { VerificationResume } from '../../services/placement';

export const ResumeVerification: React.FC = () => {
  const [resumes, setResumes] = useState<VerificationResume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Verify Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<VerificationResume | null>(null);
  const [actionType, setActionType] = useState<'Approved' | 'Rejected'>('Approved');
  const [feedback, setFeedback] = useState('');

  const fetchResumes = async () => {
    try {
      setIsLoading(true);
      const data = await placementService.getResumes();
      setResumes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const openVerifyModal = (resume: VerificationResume, type: 'Approved' | 'Rejected') => {
    setSelectedResume(resume);
    setActionType(type);
    setFeedback('');
    setIsModalOpen(true);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResume) return;

    try {
      await placementService.verifyResume(selectedResume.id, actionType, feedback);
      setIsModalOpen(false);
      fetchResumes();
    } catch (err) {
      console.error(err);
      alert("Failed to submit verification.");
    }
  };

  const filteredResumes = resumes.filter(r => {
    const matchesSearch = 
      r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student_roll.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || r.verification_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold tracking-tight">Resume Verification</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
          Review student resumes and issue verification status and feedback
        </p>
      </div>

      {/* Filters */}
      <Card className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="flex-grow relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by student name, roll number, or resume title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500 text-slate-600 dark:text-slate-200"
        >
          <option value="All">All Verification States</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </Card>

      {/* Queue Table */}
      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading resume queue...</div>
        ) : filteredResumes.length > 0 ? (
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 font-extrabold uppercase bg-slate-50 dark:bg-white/2 border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Resume Title</th>
                <th className="px-6 py-4 text-center">ATS Score</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredResumes.map((resume) => (
                <tr key={resume.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{resume.student_name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{resume.student_roll}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-750 dark:text-slate-200">{resume.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-200">{resume.ats_score}%</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                      resume.verification_status === 'Approved' 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                        : resume.verification_status === 'Rejected'
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600'
                        : 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      {resume.verification_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {resume.verification_status === 'Pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openVerifyModal(resume, 'Approved')}
                          className="p-1.5 border border-emerald-100 dark:border-emerald-500/10 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-550/10 rounded-lg cursor-pointer transition-all"
                          title="Approve Resume"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => openVerifyModal(resume, 'Rejected')}
                          className="p-1.5 border border-rose-100 dark:border-rose-500/10 text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-550/10 rounded-lg cursor-pointer transition-all"
                          title="Reject Resume"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold italic">Verified</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-20 text-center text-xs text-slate-400">No resumes found matching the filters.</div>
        )}
      </Card>

      {/* Verify Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={actionType === 'Approved' ? "Approve Resume Submit" : "Reject Resume Submit"}
      >
        {selectedResume && (
          <form onSubmit={handleVerifySubmit} className="flex flex-col gap-4 text-left">
            <div className="flex items-start gap-3 bg-slate-50 dark:bg-white/2 border border-slate-200 dark:border-white/5 p-4.5 rounded-2xl">
              {actionType === 'Approved' ? (
                <Check size={18} className="text-emerald-500 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-rose-500 mt-0.5 shrink-0" />
              )}
              <div className="text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {actionType === 'Approved' ? 'Confirm Approval' : 'Confirm Rejection'} for {selectedResume.student_name}
                </p>
                <p className="text-slate-450 mt-1">
                  {actionType === 'Approved' 
                    ? 'Approving means the resume is verified for placement officer records and active drive applications.' 
                    : 'Rejection sends a notification request to the student to update and resubmit their resume.'}
                </p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
                Verification Feedback / Comments
              </label>
              <textarea
                placeholder="e.g. Grammar correction in Experience section required, or Verified successfully."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500 text-slate-655 dark:text-slate-350 min-h-[85px]"
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                className={actionType === 'Approved' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}
              >
                Confirm {actionType}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
export default ResumeVerification;
