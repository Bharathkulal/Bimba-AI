import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, Calendar, MapPin, Edit, Trash2, Award, ClipboardList, Sparkles } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { placementService } from '../../services/placement';
import type { PlacementDrive, PlacementCompany } from '../../services/placement';

export const DriveManagement: React.FC = () => {
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [companies, setCompanies] = useState<PlacementCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // AI Rankings Modal state
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [rankingDrive, setRankingDrive] = useState<PlacementDrive | null>(null);
  const [rankedCandidates, setRankedCandidates] = useState<Array<{ roll_number: string; name: string; cgpa: number; score: number; reason: string }>>([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  const openRankingsModal = async (drive: PlacementDrive) => {
    setRankingDrive(drive);
    setRankedCandidates([]);
    setIsRankModalOpen(true);
    try {
      setRankingLoading(true);
      const res = await placementService.getAiRankCandidates(drive.id);
      setRankedCandidates(res);
    } catch (err) {
      console.error(err);
    } finally {
      setRankingLoading(false);
    }
  };

  // Form Fields
  const [companyId, setCompanyId] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [salaryPackage, setSalaryPackage] = useState('');
  const [eligibilityCriteria, setEligibilityCriteria] = useState('');
  const [minCgpa, setMinCgpa] = useState('6.0');
  const [branchesEligible, setBranchesEligible] = useState<string[]>(['CS', 'BCA']);
  const [driveDate, setDriveDate] = useState('');
  const [driveStatus, setDriveStatus] = useState('Active');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [driveData, companyData] = await Promise.all([
        placementService.getDrives(),
        placementService.getCompanies()
      ]);
      setDrives(driveData);
      setCompanies(companyData);
      if (companyData.length > 0) {
        setCompanyId(companyData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setIsEditMode(false);
    setTitle('');
    setJobRole('');
    setSalaryPackage('');
    setEligibilityCriteria('');
    setMinCgpa('6.0');
    setBranchesEligible(['CS', 'BCA']);
    setDriveDate('');
    setDriveStatus('Active');
    if (companies.length > 0) {
      setCompanyId(companies[0].id);
    }
    setIsModalOpen(true);
  };

  const openEditModal = (drive: PlacementDrive) => {
    setIsEditMode(true);
    setEditingId(drive.id);
    setCompanyId(drive.company_id);
    setTitle(drive.title);
    setJobRole(drive.job_role);
    setSalaryPackage(drive.salary_package);
    setEligibilityCriteria(drive.eligibility_criteria);
    setMinCgpa(drive.min_cgpa.toString());
    setBranchesEligible(drive.branches_eligible);
    setDriveDate(drive.drive_date);
    setDriveStatus(drive.status);
    setIsModalOpen(true);
  };

  const handleSaveDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    const company = companies.find(c => c.id === companyId);
    if (!company) {
      alert("Please select a valid company.");
      return;
    }

    const payload = {
      company_id: companyId,
      company_name: company.name,
      title,
      job_role: jobRole,
      salary_package: salaryPackage,
      eligibility_criteria: eligibilityCriteria,
      min_cgpa: parseFloat(minCgpa),
      branches_eligible: branchesEligible,
      drive_date: driveDate,
      status: driveStatus
    };

    try {
      if (isEditMode && editingId !== null) {
        await placementService.updateDrive(editingId, payload);
      } else {
        await placementService.createDrive(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to save campus drive.");
    }
  };

  const handleDeleteDrive = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this recruiting drive?")) return;
    try {
      await placementService.deleteDrive(id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete drive.");
    }
  };

  const handleBranchCheckbox = (branch: string) => {
    if (branchesEligible.includes(branch)) {
      setBranchesEligible(branchesEligible.filter(b => b !== branch));
    } else {
      setBranchesEligible([...branchesEligible, branch]);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Campus Drives</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
            Manage scheduling, roles, package and shortlist criteria
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-250/20 cursor-pointer"
        >
          <Plus size={14} /> New Campus Drive
        </Button>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading drives list...</div>
      ) : drives.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drives.map((drive) => (
            <Card key={drive.id} className="flex flex-col justify-between gap-5 relative hover:border-[#D1D5DB] dark:hover:border-white/10 transition-all">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{drive.company_name}</h3>
                    <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">{drive.title}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                    drive.status === 'Active' 
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
                  }`}>
                    {drive.status}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 text-xs text-slate-500 dark:text-slate-400 border-t border-b border-slate-100 dark:border-white/5 py-3">
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-slate-400" />
                    <span>Role: <strong className="text-slate-800 dark:text-slate-200">{drive.job_role}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award size={14} className="text-slate-400" />
                    <span>Package: <strong className="text-slate-800 dark:text-slate-200">{drive.salary_package}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClipboardList size={14} className="text-slate-400" />
                    <span>Min CGPA: <strong className="text-slate-800 dark:text-slate-200">{drive.min_cgpa}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span>Date: <strong className="text-slate-800 dark:text-slate-200">{drive.drive_date}</strong></span>
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Eligible Branches</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {drive.branches_eligible.map((branch) => (
                      <span key={branch} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-650 dark:text-slate-350 text-[10px] font-semibold border border-slate-200/50 dark:border-white/5">
                        {branch}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-slate-100 dark:border-white/5 pt-4">
                <button
                  onClick={() => openEditModal(drive)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-emerald-500 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <Edit size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDeleteDrive(drive.id)}
                  className="px-3 py-1.5 border border-rose-100 dark:border-rose-500/10 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-550/10 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-xs text-slate-400 bg-white dark:bg-[#102117]/10 border border-slate-200/60 dark:border-white/5 rounded-3xl">
          No campus recruitment drives listed yet.
        </div>
      )}

      {/* Save Drive Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? "Edit Campus Drive" : "Create Campus Drive"}
      >
        <form onSubmit={handleSaveDrive} className="flex flex-col gap-4 text-left">
          <div>
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
              Target Company
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(parseInt(e.target.value))}
              className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500 text-slate-600 dark:text-slate-200"
              required
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
              Drive Title
            </label>
            <Input
              type="text"
              placeholder="e.g. Graduate Engineering Trainee Recruiting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
                Job Role / Designation
              </label>
              <Input
                type="text"
                placeholder="e.g. Associate Developer"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
                Salary Package
              </label>
              <Input
                type="text"
                placeholder="e.g. 6.5 LPA"
                value={salaryPackage}
                onChange={(e) => setSalaryPackage(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
              Min CGPA Cutoff
            </label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={minCgpa}
              onChange={(e) => setMinCgpa(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
              Eligibility Details / Notes
            </label>
            <textarea
              placeholder="No active backlogs. Solid coding skill references required."
              value={eligibilityCriteria}
              onChange={(e) => setEligibilityCriteria(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500 text-slate-650 dark:text-slate-350 min-h-[60px]"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
              Eligible Branches
            </label>
            <div className="flex gap-4 text-xs font-semibold">
              {['CS', 'BCA', 'ECE', 'MECH'].map(branch => (
                <label key={branch} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={branchesEligible.includes(branch)}
                    onChange={() => handleBranchCheckbox(branch)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{branch}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
                Drive Date
              </label>
              <Input
                type="text"
                placeholder="e.g. 12-08-2026"
                value={driveDate}
                onChange={(e) => setDriveDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
                Status
              </label>
              <select
                value={driveStatus}
                onChange={(e) => setDriveStatus(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500 text-slate-600 dark:text-slate-200"
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700">
              {isEditMode ? "Save Changes" : "Publish Drive"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* AI Candidate Rankings Modal */}
      <Modal
        isOpen={isRankModalOpen}
        onClose={() => setIsRankModalOpen(false)}
        title={`AI Candidate Ranking: ${rankingDrive?.title || 'Drive'}`}
      >
        <div className="flex flex-col gap-4 text-left">
          <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl text-xs">
            <p className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide text-[10px] mb-1">
              <Sparkles size={13} /> Fit scoring criteria
            </p>
            Candidates are matched and ranked by checking resume skills, academic achievements, projects, and CGPA requirements against the job role description.
          </div>

          {rankingLoading ? (
            <div className="py-12 text-center text-xs text-slate-450 font-bold flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>Gemini AI is analyzing resumes and ranking candidates...</span>
            </div>
          ) : rankedCandidates.length > 0 ? (
            <div className="flex flex-col gap-3">
              {rankedCandidates.map((candidate, idx) => (
                <div key={candidate.roll_number} className="p-3.5 border border-slate-100 dark:border-white/5 rounded-xl flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-white/2 hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-350 flex items-center justify-center text-[10px] font-black">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">{candidate.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        Roll: {candidate.roll_number} • CGPA: {candidate.cgpa !== null && candidate.cgpa !== undefined ? candidate.cgpa : '-'}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 italic">Fit: {candidate.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-100 dark:border-emerald-500/10">
                      {candidate.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">No candidates meet the CGPA cutoff or branch eligibility.</div>
          )}

          <div className="flex justify-end mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsRankModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default DriveManagement;
