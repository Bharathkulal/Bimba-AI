import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Globe, MapPin, Search } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { placementService } from '../../services/placement';
import type { PlacementCompany } from '../../services/placement';

export const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<PlacementCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Active');

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      const data = await placementService.getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const openCreateModal = () => {
    setIsEditMode(false);
    setName('');
    setIndustry('');
    setLocation('');
    setWebsite('');
    setDescription('');
    setStatus('Active');
    setIsModalOpen(true);
  };

  const openEditModal = (company: PlacementCompany) => {
    setIsEditMode(true);
    setEditingId(company.id);
    setName(company.name);
    setIndustry(company.industry);
    setLocation(company.location);
    setWebsite(company.website);
    setDescription(company.description);
    setStatus(company.status);
    setIsModalOpen(true);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, industry, location, website, description, status };

    try {
      if (isEditMode && editingId !== null) {
        await placementService.updateCompany(editingId, payload);
      } else {
        await placementService.createCompany(payload);
      }
      setIsModalOpen(false);
      fetchCompanies();
    } catch (err) {
      console.error(err);
      alert("Failed to save company profile.");
    }
  };

  const handleDeleteCompany = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this company? All associated drives may be orphaned.")) return;
    try {
      await placementService.deleteCompany(id);
      fetchCompanies();
    } catch (err) {
      console.error(err);
      alert("Failed to delete company.");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Partner Companies</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
            Maintain list of corporations visiting campus for placements
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-250/20 cursor-pointer"
        >
          <Plus size={14} /> Add Partner Company
        </Button>
      </div>

      {/* Grid of Companies */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading companies directory...</div>
      ) : companies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Card key={company.id} className="flex flex-col justify-between gap-4 hover:border-[#D1D5DB] dark:hover:border-white/10 transition-all">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 shrink-0">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{company.name}</h3>
                      <span className="text-[10px] bg-slate-100 dark:bg-white/5 text-slate-500 px-2 py-0.5 rounded border border-slate-200/50 dark:border-white/10 font-bold uppercase tracking-wider">
                        {company.industry}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                    company.status === 'Active' 
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
                  }`}>
                    {company.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">
                  {company.description || "No description provided."}
                </p>

                <div className="flex flex-col gap-1.5 text-xs text-slate-450 font-semibold border-t border-slate-100 dark:border-white/5 pt-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span>{company.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe size={13} className="text-slate-400 shrink-0" />
                    {company.website ? (
                      <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
                        {company.website}
                      </a>
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-slate-100 dark:border-white/5 pt-4">
                <button
                  onClick={() => openEditModal(company)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-emerald-500 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <Edit size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDeleteCompany(company.id)}
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
          No partner companies listed yet.
        </div>
      )}

      {/* Save Company Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? "Edit Company Profile" : "Add Partner Company"}
      >
        <form onSubmit={handleSaveCompany} className="flex flex-col gap-4 text-left">
          <div>
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
              Company Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Google"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
                Industry
              </label>
              <Input
                type="text"
                placeholder="e.g. Fintech"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
                Location
              </label>
              <Input
                type="text"
                placeholder="e.g. Bangalore, India"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
                Website URL
              </label>
              <Input
                type="text"
                placeholder="e.g. google.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500 text-slate-600 dark:text-slate-200"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1.5">
              Description
            </label>
            <textarea
              placeholder="e.g. Google is a global technology leader..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-xl bg-transparent text-xs outline-none focus:border-emerald-500 text-slate-655 dark:text-slate-350 min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700">
              {isEditMode ? "Save Changes" : "Save Company"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default CompanyManagement;
