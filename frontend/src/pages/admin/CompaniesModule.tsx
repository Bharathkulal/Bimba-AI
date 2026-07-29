import React, { useState, useEffect } from 'react';
import { Building2, Search, Filter, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../services/api';

interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  website?: string;
  jobs_count?: number;
  status?: string;
}

export const CompaniesModule: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/companies');
      if (Array.isArray(response.data)) {
        setCompanies(response.data);
      } else {
        setCompanies([]);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load company database records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      company.name.toLowerCase().includes(search.toLowerCase()) ||
      (company.location?.toLowerCase().includes(search.toLowerCase()) || '') ||
      (company.industry?.toLowerCase().includes(search.toLowerCase()) || '');
      
    const matchesIndustry = industryFilter === 'All' || company.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  const industries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean)));

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-base font-extrabold text-slate-900">Company Management</h2>
        <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-1">Monitor company profiles, industries, and open position metrics</p>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Total Companies</span>
            <h3 className="text-xl font-black text-slate-900 mt-1">{companies.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <Building2 size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Active Partners</span>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {companies.filter(c => (c.status || 'Active') === 'Active').length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Industries</span>
            <h3 className="text-xl font-black text-slate-900 mt-1">{industries.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
            <Building2 size={18} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Open Jobs Index</span>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {companies.reduce((acc, curr) => acc + (curr.jobs_count || 0), 0)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
            <Building2 size={18} />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search by company name, industry, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200/80 text-xs focus:outline-none focus:border-emerald-500 bg-slate-50/50"
            />
          </div>

          <div className="flex gap-2 shrink-0">
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200/80 text-xs bg-white text-slate-600 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Industries</option>
              {industries.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-2xl flex items-center gap-2 font-bold">
            <AlertTriangle size={15} />
            <span>{error}</span>
            <button onClick={fetchCompanies} className="ml-auto underline cursor-pointer">Retry</button>
          </div>
        )}

        {/* Table/List */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col gap-2.5 py-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse w-full" />
              ))}
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-2">
              <Building2 size={36} className="text-slate-300" />
              <h5 className="font-extrabold text-sm text-slate-700">No companies found</h5>
              <p className="text-xs text-slate-400">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-black tracking-wider text-slate-400">
                  <th className="py-3 px-2">Company</th>
                  <th className="py-3 px-2">Industry</th>
                  <th className="py-3 px-2">Location</th>
                  <th className="py-3 px-2">Open Jobs</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="border-b border-slate-50 hover:bg-slate-50/55 transition-colors text-xs text-slate-700">
                    <td className="py-3 px-2 font-extrabold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-[10px]">
                          {company.name.charAt(0)}
                        </div>
                        <div>
                          <span>{company.name}</span>
                          {company.website && (
                            <a href={company.website} target="_blank" rel="noreferrer" className="block text-[8px] text-slate-400 hover:underline">
                              {company.website}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-bold">{company.industry || 'Technology'}</td>
                    <td className="py-3 px-2">{company.location || 'Remote'}</td>
                    <td className="py-3 px-2 font-bold text-slate-550">{company.jobs_count || 0}</td>
                    <td className="py-3 px-2">
                      <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompaniesModule;
