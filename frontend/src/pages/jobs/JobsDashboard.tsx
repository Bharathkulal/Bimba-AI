import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, MapPin, Briefcase, Sparkles, Bookmark, 
  ChevronLeft, ChevronRight, Clock, DollarSign,
  SlidersHorizontal, RefreshCw, X, Check, Eye
} from 'lucide-react';
import { jobsService } from '../../services/jobs';
import type { JobListItem } from '../../services/jobs';
import { useUserStore } from '../../store/userStore';

export const JobsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);

  // Search & Filter State
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [remote, setRemote] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState('relevant');
  
  // API States
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  
  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Debounced search helper or manual triggers
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await jobsService.searchJobs({
        keyword: keyword || undefined,
        location: location || undefined,
        page,
        experience: experience || undefined,
        remote: remote === null ? undefined : remote,
        employment_type: employmentType || undefined,
        limit: 8
      });
      
      // Sort jobs locally based on sortBy
      let sortedJobs = [...res.jobs];
      if (sortBy === 'newest') {
        // Just keep standard mock order or randomize slightly for demo
      } else if (sortBy === 'salary') {
        sortedJobs.sort((a, b) => {
          const aSal = parseInt(a.salary?.replace(/[^0-9]/g, '') || '0');
          const bSal = parseInt(b.salary?.replace(/[^0-9]/g, '') || '0');
          return bSal - aSal;
        });
      } else {
        // Sort by match score (Relevant)
        sortedJobs.sort((a, b) => (b.ai_match_score || 0) - (a.ai_match_score || 0));
      }

      setJobs(sortedJobs);
      setTotalJobs(res.total);
      setTotalPages(res.pages);
    } catch (err) {
      showToast('Failed to fetch jobs. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [keyword, location, page, experience, employmentType, remote, sortBy]);

  // Fetch saved jobs to highlight bookmarked cards
  const fetchSavedJobs = async () => {
    try {
      const saved = await jobsService.getSavedJobs();
      setSavedJobIds(saved.map(j => j.job_id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveToggle = async (job: JobListItem) => {
    const isSaved = savedJobIds.includes(job.id);
    try {
      if (isSaved) {
        await jobsService.unsaveJob(job.id);
        setSavedJobIds(prev => prev.filter(id => id !== job.id));
        showToast('Job removed from saved list.', 'success');
      } else {
        await jobsService.saveJob({
          job_id: job.id,
          company: job.company,
          title: job.title,
          location: job.location,
          logo: job.logo
        });
        setSavedJobIds(prev => [...prev, job.id]);
        showToast('Job saved successfully!', 'success');
      }
    } catch (err) {
      showToast('Could not update saved job.', 'error');
    }
  };

  const resetFilters = () => {
    setKeyword('');
    setLocation('');
    setExperience('');
    setEmploymentType('');
    setRemote(null);
    setSortBy('relevant');
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-1 md:px-4">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-xl transition-all duration-300 transform scale-100 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-[22px] p-6 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Find Your Dream Job <Sparkles className="text-blue-500 fill-blue-500 animate-pulse" size={24} />
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-semibold mt-1">Discover AI-recommended opportunities matched with your Resume skills.</p>
        </div>

        {/* Modular Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl self-stretch md:self-auto justify-around">
          <Link to="/jobs" className="px-4 py-2 rounded-lg text-xs font-black bg-white text-blue-600 shadow-sm transition-all duration-200">
            Find Jobs
          </Link>
          <Link to="/jobs/saved" className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all duration-200">
            Saved Jobs
          </Link>
          <Link to="/jobs/applications" className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all duration-200">
            Applications
          </Link>
        </div>
      </div>

      {/* UNIVERSAL SEARCH BAR */}
      <div className="bg-white border border-slate-200/60 rounded-[22px] p-5 shadow-sm">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchJobs(); }} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Keyword Search */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search jobs, companies, technologies..." 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:outline-none rounded-xl text-xs text-slate-700 font-semibold transition-all duration-200"
            />
          </div>

          {/* Location Search */}
          <div className="md:col-span-4 relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Location e.g. San Francisco, Bangalore..." 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:outline-none rounded-xl text-xs text-slate-700 font-semibold transition-all duration-200"
            />
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-3 flex gap-3">
            <button 
              type="submit" 
              className="flex-grow py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200"
            >
              <Search size={14} /> Search Jobs
            </button>
            <button 
              type="button" 
              onClick={resetFilters}
              title="Reset Filters"
              className="px-3 py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-550 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </form>
      </div>

      {/* FILTER CONTROLS & JOBS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sidebar Filters */}
        <div className="bg-white border border-slate-200/60 rounded-[22px] p-5 shadow-sm flex flex-col gap-5 sticky top-24">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-slate-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Filters</h3>
            </div>
            <button onClick={resetFilters} className="text-[10px] font-black text-blue-600 hover:underline">
              Clear All
            </button>
          </div>

          {/* Experience level */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience Level</label>
            <select 
              value={experience} 
              onChange={(e) => { setExperience(e.target.value); setPage(1); }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Levels</option>
              <option value="entry">Entry-level</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior-level</option>
            </select>
          </div>

          {/* Employment Type */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employment Type</label>
            <select 
              value={employmentType} 
              onChange={(e) => { setEmploymentType(e.target.value); setPage(1); }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
          </div>

          {/* Remote Option */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workplace Type</label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
              <button 
                type="button" 
                onClick={() => { setRemote(null); setPage(1); }}
                className={`py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition-all duration-200 ${remote === null ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                All
              </button>
              <button 
                type="button" 
                onClick={() => { setRemote(true); setPage(1); }}
                className={`py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition-all duration-200 ${remote === true ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Remote
              </button>
              <button 
                type="button" 
                onClick={() => { setRemote(false); setPage(1); }}
                className={`py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition-all duration-200 ${remote === false ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                On-site
              </button>
            </div>
          </div>

          {/* Sorting */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort By</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="relevant">Relevant (AI Match)</option>
              <option value="newest">Newest Posted</option>
              <option value="salary">Highest Salary</option>
            </select>
          </div>
        </div>

        {/* Jobs List Section */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          <div className="flex justify-between items-center px-1">
            <span className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">
              {loading ? 'Searching opportunities...' : `${totalJobs} Jobs Found`}
            </span>
          </div>

          {/* Loading Skeletons */}
          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-slate-200/50 rounded-[20px] p-5 flex flex-col gap-3 animate-pulse shadow-sm">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                    <div className="flex-grow flex flex-col gap-2">
                      <div className="h-4 bg-slate-150 rounded w-1/3" />
                      <div className="h-3 bg-slate-100 rounded w-1/4" />
                    </div>
                  </div>
                  <div className="h-10 bg-slate-100 rounded-xl mt-1" />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-slate-200/60 rounded-[22px] p-12 text-center shadow-sm flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-inner">
                <Briefcase size={28} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">No Matching Jobs Found</h3>
                <p className="text-xs text-slate-450 mt-1 max-w-sm mx-auto leading-relaxed">
                  We couldn't find any vacancies matching your filters. Try resetting search fields or altering your profile skills to match different roles.
                </p>
              </div>
              <button 
                onClick={resetFilters}
                className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-xl shadow-sm transition-all duration-200 cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            /* Jobs List */
            <div className="flex flex-col gap-4">
              {jobs.map((job) => {
                const isSaved = savedJobIds.includes(job.id);
                // Style match score badges dynamically
                const score = job.ai_match_score || 70;
                let scoreColor = 'bg-blue-50 text-blue-600 border-blue-200';
                if (score >= 90) {
                  scoreColor = 'bg-emerald-50 text-emerald-600 border-emerald-250 font-black';
                } else if (score >= 80) {
                  scoreColor = 'bg-teal-50 text-teal-650 border-teal-200';
                }

                return (
                  <div 
                    key={job.id} 
                    className="group relative bg-white border border-slate-200/60 rounded-[20px] p-5 shadow-sm hover:scale-[1.01] hover:shadow-md hover:border-slate-300 transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      {/* Logo and Job Info */}
                      <div className="flex gap-4">
                        {job.logo ? (
                          <img 
                            src={job.logo} 
                            alt={job.company} 
                            className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm shrink-0" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&auto=format&fit=crop&q=60';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-inner shrink-0">
                            <Briefcase size={20} />
                          </div>
                        )}
                        <div className="text-left">
                          <h3 className="font-extrabold text-sm text-slate-800 group-hover:text-blue-600 transition-all duration-200">
                            {job.title}
                          </h3>
                          <p className="text-xs text-slate-500 font-bold mt-0.5">{job.company}</p>
                          
                          {/* Badges list */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-450 bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                              <MapPin size={10} /> {job.location}
                            </span>
                            {job.salary && (
                              <span className="flex items-center gap-0.5 text-[10px] font-bold text-slate-450 bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                                <DollarSign size={10} /> {job.salary}
                              </span>
                            )}
                            {job.employment_type && (
                              <span className="text-[10px] font-bold text-slate-450 bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                                {job.employment_type}
                              </span>
                            )}
                            {job.remote && (
                              <span className="text-[10px] font-black text-blue-600 bg-blue-50/50 px-2.5 py-0.5 rounded border border-blue-150 uppercase tracking-wide">
                                Remote
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* AI Match Badge & Save */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-3 shrink-0 self-stretch sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                        {/* Match Score Badge */}
                        <div className={`flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-full border shadow-sm ${scoreColor}`}>
                          <Sparkles size={11} className="fill-current" />
                          <span>{score}% AI Match</span>
                        </div>
                        
                        {/* Posted date */}
                        {job.posted_date && (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                            <Clock size={10} /> {job.posted_date}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-between gap-3 border-t border-slate-100/70 pt-4 mt-4">
                      {/* Skills highlight */}
                      <div className="hidden md:flex items-center gap-1.5 text-left text-[9px] text-slate-450 font-bold max-w-md overflow-hidden whitespace-nowrap text-ellipsis">
                        <span className="font-extrabold text-slate-500 uppercase tracking-wider">Matched:</span>
                        {job.skills_matched && job.skills_matched.length > 0 ? (
                          <span className="text-emerald-600 font-semibold">{job.skills_matched.slice(0, 3).join(', ')}</span>
                        ) : (
                          <span className="text-slate-400 font-medium">None</span>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <button 
                          onClick={() => handleSaveToggle(job)}
                          className={`px-3 py-2 border rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm hover:scale-102 ${
                            isSaved 
                              ? 'bg-blue-50 border-blue-200 text-blue-600' 
                              : 'bg-white border-slate-200 text-slate-450 hover:bg-slate-50 hover:text-slate-700'
                          }`}
                          title={isSaved ? "Unsave Job" : "Save Job"}
                        >
                          <Bookmark size={14} className={isSaved ? "fill-current" : ""} />
                        </button>
                        <button 
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="flex items-center justify-center gap-1 px-4 py-2 border border-slate-250 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl shadow-sm hover:shadow transition-all duration-250 cursor-pointer hover:scale-102"
                        >
                          <Eye size={13} /> View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button 
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer transition-smooth"
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold border transition-smooth cursor-pointer ${
                    page === p 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/10' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button 
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer transition-smooth"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobsDashboard;
