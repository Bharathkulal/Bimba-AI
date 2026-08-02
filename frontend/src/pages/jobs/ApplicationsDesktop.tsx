import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Briefcase, MapPin, Calendar, ClipboardList, CheckCircle2, 
  ChevronRight, ArrowRight, Eye, Check, X, Building, Trash2, 
  Plus, Search, DollarSign, UserCheck, AlertCircle, FileText, Send, Sparkles, Clock, Compass
} from 'lucide-react';
import { jobsService } from '../../services/jobs';
import type { JobApplication } from '../../services/jobs';

export const ApplicationsDesktop: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [analytics, setAnalytics] = useState<any>({
    total_applications: 0,
    waiting_for_response: 0,
    interviews_scheduled: 0,
    offers_received: 0,
    rejected_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');

  // Detail Modal & Drawer State
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [aiGuidance, setAiGuidance] = useState<string>('');
  const [loadingGuidance, setLoadingGuidance] = useState(false);
  const [newStatusLog, setNewStatusLog] = useState('');
  const [newStatusVal, setNewStatusVal] = useState('');
  const [statusPredictText, setStatusPredictText] = useState('');
  const [predictingStatus, setPredictingStatus] = useState(false);

  // Follow-up state
  const [followUpMethod, setFollowUpMethod] = useState('Email');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Add App Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newApp, setNewApp] = useState({
    company: '',
    title: '',
    job_url: '',
    location: 'Remote',
    salary_offered: 'Competitive',
    application_method: 'External Website',
    application_source: 'LinkedIn',
    status: 'Applied',
    notes: '',
    recruiter_name: '',
    recruiter_email: ''
  });

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await jobsService.getApplications();
      setApplications(data);
      const stats = await jobsService.getAnalytics();
      setAnalytics(stats);
    } catch (err) {
      showToast('Error loading application history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApp.company || !newApp.title) {
      showToast('Please enter both Company and Title.', 'error');
      return;
    }
    try {
      await jobsService.createApplication(newApp);
      showToast('Job application recorded successfully.');
      setIsAddOpen(false);
      // Reset form
      setNewApp({
        company: '',
        title: '',
        job_url: '',
        location: 'Remote',
        salary_offered: 'Competitive',
        application_method: 'External Website',
        application_source: 'LinkedIn',
        status: 'Applied',
        notes: '',
        recruiter_name: '',
        recruiter_email: ''
      });
      fetchApplications();
    } catch (err) {
      showToast('Failed to record application.', 'error');
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedApp || !newStatusVal) return;
    try {
      await jobsService.updateStatus(selectedApp.id, newStatusVal, newStatusLog);
      showToast('Application status updated successfully.');
      setNewStatusLog('');
      
      // Refresh current view details
      const refreshedList = await jobsService.getApplications();
      setApplications(refreshedList);
      const match = refreshedList.find(a => a.id === selectedApp.id);
      if (match) {
        setSelectedApp(match);
        // Fetch refreshed guidance
        fetchGuidance(match.id);
      }
      const stats = await jobsService.getAnalytics();
      setAnalytics(stats);
    } catch (err) {
      showToast('Status update failed.', 'error');
    }
  };

  const handlePredictStatus = async () => {
    if (!selectedApp || !statusPredictText) return;
    try {
      setPredictingStatus(true);
      const res = await jobsService.suggestStatus(selectedApp.id, statusPredictText);
      setNewStatusVal(res.suggested_status);
      setNewStatusLog(`AI Auto-suggested status update based on text: "${statusPredictText}"`);
      setStatusPredictText('');
      showToast('AI analysis complete. Recommended status applied below.');
    } catch (e) {
      showToast('AI status prediction unavailable.', 'error');
    } finally {
      setPredictingStatus(false);
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      await jobsService.recordFollowUp(selectedApp.id, followUpMethod, followUpNotes);
      showToast('Follow-up activity recorded.');
      setFollowUpNotes('');
      
      // Refresh details
      const refreshedList = await jobsService.getApplications();
      setApplications(refreshedList);
      const match = refreshedList.find(a => a.id === selectedApp.id);
      if (match) setSelectedApp(match);
    } catch (err) {
      showToast('Failed to record follow-up.', 'error');
    }
  };

  const fetchGuidance = async (id: number) => {
    try {
      setLoadingGuidance(true);
      const res = await jobsService.getGuidance(id);
      setAiGuidance(res.guidance);
    } catch (e) {
      setAiGuidance('Complete mock preparation. Keep applying to similar roles!');
    } finally {
      setLoadingGuidance(false);
    }
  };

  const openAppDetails = (app: JobApplication) => {
    setSelectedApp(app);
    setNewStatusVal(app.status);
    setAiGuidance('');
    fetchGuidance(app.id);
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case 'Applied': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Application Received': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Under Review': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Shortlisted': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Assessment Assigned': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Assessment Completed': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Technical Interview':
      case 'Manager Interview':
      case 'HR Interview':
      case 'Final Interview':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Offer Extended':
      case 'Offer Accepted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-extrabold';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Filter application items
  const filteredApps = applications.filter((app) => {
    const matchesSearch = app.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    const matchesCompany = companyFilter === 'All' || app.company === companyFilter;
    return matchesSearch && matchesStatus && matchesCompany;
  });

  const uniqueCompanies = Array.from(new Set(applications.map(a => a.company)));
  const uniqueStatuses = Array.from(new Set(applications.map(a => a.status)));

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-1 md:px-4 text-slate-800">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl transition-all duration-300 transform scale-100 bg-white ${
          toast.type === 'success' ? 'border-emerald-200 text-emerald-600' : 'border-rose-200 text-rose-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-[22px] p-6 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Personal Career CRM <ClipboardList className="text-emerald-500" size={24} />
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-semibold mt-1">
            Track interview pipelines, log follow-ups, and receive custom AI interview & negotiation guidance.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm hover:shadow transition-all duration-200 cursor-pointer w-full md:w-auto justify-center"
          >
            <Plus size={14} /> Add Application
          </button>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <Link to="/jobs" className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-all">
              Find Jobs
            </Link>
            <Link to="/jobs/saved" className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-all">
              Saved Jobs
            </Link>
            <Link to="/jobs/applications" className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-white text-emerald-600 shadow-sm transition-all">
              CRM Logs
            </Link>
          </div>
        </div>
      </div>

      {/* PIPELINE METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Tracked', val: analytics.total_applications || 0, color: 'text-slate-700', bg: 'bg-slate-500/5' },
          { label: 'Under Review', val: analytics.waiting_for_response || 0, color: 'text-blue-600', bg: 'bg-blue-500/5' },
          { label: 'Interviews Scheduled', val: analytics.interviews_scheduled || 0, color: 'text-purple-600', bg: 'bg-purple-500/5' },
          { label: 'Offers Extended', val: analytics.offers_received || 0, color: 'text-emerald-600', bg: 'bg-emerald-500/5' },
          { label: 'Archive / Rejected', val: analytics.rejected_count || 0, color: 'text-rose-500', bg: 'bg-rose-500/5' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200/60 rounded-[18px] p-4 flex flex-col justify-between shadow-sm relative overflow-hidden text-left">
            <div className={`absolute top-0 right-0 w-12 h-12 rounded-full ${stat.bg} blur-xl`} />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</span>
            <h4 className={`text-2xl font-black ${stat.color} mt-2.5 leading-none`}>{stat.val}</h4>
          </div>
        ))}
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white border border-slate-200/60 rounded-[22px] p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by role or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-initial px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 focus:bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Saved">Saved</option>
            <option value="Applied">Applied</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Assessment Assigned">Assessment Assigned</option>
            <option value="Technical Interview">Technical Interview</option>
            <option value="HR Interview">HR Interview</option>
            <option value="Offer Extended">Offer Extended</option>
            <option value="Offer Accepted">Offer Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select 
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="flex-1 md:flex-initial px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 focus:bg-white"
          >
            <option value="All">All Companies</option>
            {uniqueCompanies.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TRACKED APPLICATIONS PIPELINE TABLE */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-48 animate-pulse bg-slate-100 rounded-[22px]" />
      ) : filteredApps.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-[22px] p-12 text-center shadow-sm flex flex-col items-center gap-4 max-w-xl mx-auto mt-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
            <ClipboardList size={28} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800">No matching applications located</h3>
            <p className="text-xs text-slate-450 mt-1 max-w-xs mx-auto leading-relaxed">
              We couldn't find any job application records matching your current filter. Record an external submission manually or modify search filters!
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/60 rounded-[22px] p-5 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-[9.5px] font-black text-slate-400 uppercase tracking-widest pl-2">Job / Company</th>
                  <th className="pb-3 text-[9.5px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Applied Date</th>
                  <th className="pb-3 text-[9.5px] font-black text-slate-400 uppercase tracking-widest">Stage Status</th>
                  <th className="pb-3 text-[9.5px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell pl-4">Location & Salary</th>
                  <th className="pb-3 text-[9.5px] font-black text-slate-400 tracking-widest text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="group hover:bg-slate-50/50 transition-all duration-250">
                    <td className="py-4 pl-2 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner shrink-0">
                          <Building size={16} />
                        </div>
                        <div className="leading-tight text-left">
                          <h4 className="font-extrabold text-xs text-slate-800 group-hover:text-emerald-600 transition-smooth">{app.title}</h4>
                          <p className="text-[10px] text-slate-450 font-bold mt-0.5">{app.company} <span className="font-medium text-slate-400">({app.application_source || 'Direct'})</span></p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 text-xs font-bold text-slate-500 hidden sm:table-cell">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        {new Date(app.application_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>

                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-full border shadow-sm ${getStageColor(app.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {app.status}
                      </span>
                    </td>

                    <td className="py-4 hidden lg:table-cell pl-4 text-left">
                      <div className="leading-tight">
                        <p className="text-[10.5px] font-bold text-slate-600">{app.location || 'Remote'}</p>
                        <p className="text-[9.5px] text-slate-400 font-semibold">{app.salary_offered || 'Competitive'}</p>
                      </div>
                    </td>

                    <td className="py-4 text-right pr-2">
                      <button 
                        onClick={() => openAppDetails(app)}
                        className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 bg-white text-slate-700 font-extrabold text-[10px] rounded-xl shadow-sm hover:shadow transition-all duration-200 cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <Eye size={12} /> View Pipeline CRM
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRM DETAILS SIDE-SHEET/DRAWER DRAWER */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setSelectedApp(null)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
          />

          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 animate-slideLeft border-l border-slate-100">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between text-left">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Application Details</span>
                <h2 className="text-lg font-black text-slate-900 mt-1">{selectedApp.title}</h2>
                <p className="text-xs text-slate-500 font-bold mt-0.5">{selectedApp.company} • {selectedApp.location}</p>
              </div>
              <button 
                onClick={() => setSelectedApp(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
              {/* Section 1: Overview Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider">Salary Preference</span>
                  <p className="text-xs font-extrabold text-slate-700 mt-0.5">{selectedApp.salary_offered || 'Competitive'}</p>
                </div>
                <div>
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider">Source Channel</span>
                  <p className="text-xs font-extrabold text-slate-700 mt-0.5">{selectedApp.application_source || 'LinkedIn'}</p>
                </div>
                <div>
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider">Method</span>
                  <p className="text-xs font-extrabold text-slate-700 mt-0.5">{selectedApp.application_method || 'External Website'}</p>
                </div>
                <div>
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider">Recruiter</span>
                  <p className="text-xs font-extrabold text-slate-700 mt-0.5">
                    {selectedApp.recruiter_name ? `${selectedApp.recruiter_name} (${selectedApp.recruiter_email})` : 'Not recorded'}
                  </p>
                </div>
              </div>

              {/* Section 2: Interactive Status Update */}
              <div className="space-y-3 border-t border-slate-100 pt-5">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Compass size={14} className="text-emerald-500" /> Pipeline Stage Transition
                </h3>
                
                {/* AI Text Predictor */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[9.5px] font-extrabold text-slate-500">Analyze Communication (AI Status Suggester)</span>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. 'I passed technical interview and scheduled HR round next Tuesday'"
                      value={statusPredictText}
                      onChange={(e) => setStatusPredictText(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    />
                    <button 
                      type="button"
                      onClick={handlePredictStatus}
                      disabled={predictingStatus || !statusPredictText}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Sparkles size={11} /> Predict
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">Target Status</label>
                    <select 
                      value={newStatusVal}
                      onChange={(e) => setNewStatusVal(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Saved">Saved</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Ready To Apply">Ready To Apply</option>
                      <option value="Applied">Applied</option>
                      <option value="Application Received">Application Received</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Assessment Assigned">Assessment Assigned</option>
                      <option value="Assessment Completed">Assessment Completed</option>
                      <option value="Technical Interview">Technical Interview</option>
                      <option value="HR Interview">HR Interview</option>
                      <option value="Final Interview">Final Interview</option>
                      <option value="Offer Extended">Offer Extended</option>
                      <option value="Offer Accepted">Offer Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">Update Notes Log</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Recruiter called to arrange next interview..."
                      value={newStatusLog}
                      onChange={(e) => setNewStatusLog(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button 
                    onClick={handleStatusUpdate}
                    className="px-4.5 py-2.5 bg-slate-900 hover:bg-black text-white font-extrabold text-[11px] rounded-xl shadow-sm cursor-pointer shrink-0"
                  >
                    Transition Stage
                  </button>
                </div>
              </div>

              {/* Section 3: Smart AI Assistant Guidance */}
              <div className="border-t border-slate-100 pt-5 space-y-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-500" /> Smart AI Guidance (Contextual Action Plan)
                </h3>
                {loadingGuidance ? (
                  <div className="h-20 animate-pulse bg-slate-50 rounded-xl border border-slate-100" />
                ) : (
                  <div className="bg-indigo-50/40 p-4.5 rounded-2xl border border-indigo-100/50 text-xs leading-relaxed space-y-2 font-medium text-slate-700">
                    <div className="markdown" dangerouslySetInnerHTML={{ __html: aiGuidance.replace(/\n/g, '<br />') }} />
                  </div>
                )}
              </div>

              {/* Section 4: Visual History Timeline */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-500" /> Audited Timeline & History Events
                </h3>
                <div className="relative pl-6 space-y-4 border-l border-slate-200 ml-3.5 pt-2">
                  {selectedApp.timeline && selectedApp.timeline.length > 0 ? (
                    selectedApp.timeline.map((event, idx) => (
                      <div key={idx} className="relative text-left">
                        {/* Event bullet point */}
                        <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white" />
                        <div className="leading-tight">
                          <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider">{event.date} • {event.time}</span>
                          <h5 className="font-extrabold text-xs text-slate-800 mt-0.5">Transitioned to {event.status}</h5>
                          <p className="text-[10.5px] text-slate-500 font-semibold mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{event.notes}</p>
                          <span className="text-[9px] text-slate-400 font-bold block mt-1">Source: {event.source}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-semibold text-slate-400 pl-2">No timeline events recorded.</p>
                  )}
                </div>
              </div>

              {/* Section 5: Log Follow-Up Interaction */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Send size={14} className="text-blue-500" /> Log Follow-Up Contact
                </h3>
                <form onSubmit={handleFollowUpSubmit} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex gap-4">
                    <div className="w-1/3 text-left">
                      <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">Contact Method</label>
                      <select 
                        value={followUpMethod}
                        onChange={(e) => setFollowUpMethod(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Email">Email</option>
                        <option value="LinkedIn">LinkedIn Message</option>
                        <option value="Phone">Phone Call</option>
                      </select>
                    </div>
                    <div className="flex-1 text-left">
                      <label className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">Activity Notes / Outcome</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Sent standard 7-day follow-up template to recruiter..."
                        value={followUpNotes}
                        onChange={(e) => setFollowUpNotes(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg shadow-sm cursor-pointer block ml-auto"
                  >
                    Log Activity
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ADD APPLICATION CRM MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div 
            onClick={() => setIsAddOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />

          <div className="relative bg-white border border-slate-100 rounded-[24px] p-6 shadow-2xl max-w-lg w-full text-left animate-scale animate-duration-300">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 mb-4">
              Add External Job Submission <ClipboardList className="text-emerald-500" size={20} />
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Company Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. OpenAI"
                    value={newApp.company}
                    onChange={(e) => setNewApp({...newApp, company: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Job Title *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Full Stack Engineer"
                    value={newApp.title}
                    onChange={(e) => setNewApp({...newApp, title: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Bangalore, India (or Remote)"
                    value={newApp.location}
                    onChange={(e) => setNewApp({...newApp, location: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Salary Offered</label>
                  <input 
                    type="text" 
                    placeholder="e.g. ₹18,00,000 - ₹24,00,000"
                    value={newApp.salary_offered}
                    onChange={(e) => setNewApp({...newApp, salary_offered: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Source channel</label>
                  <input 
                    type="text" 
                    placeholder="e.g. LinkedIn, Indeed, Company Site"
                    value={newApp.application_source}
                    onChange={(e) => setNewApp({...newApp, application_source: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Job Link URL</label>
                  <input 
                    type="url" 
                    placeholder="https://company.com/jobs/..."
                    value={newApp.job_url}
                    onChange={(e) => setNewApp({...newApp, job_url: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Recruiter Name</label>
                  <input 
                    type="text" 
                    placeholder="Recruiter Name"
                    value={newApp.recruiter_name}
                    onChange={(e) => setNewApp({...newApp, recruiter_name: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Recruiter Email</label>
                  <input 
                    type="email" 
                    placeholder="recruiter@company.com"
                    value={newApp.recruiter_email}
                    onChange={(e) => setNewApp({...newApp, recruiter_email: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Notes / Logs</label>
                <textarea 
                  placeholder="Record key details like interviewers, tech stacks, cover letter notes..."
                  value={newApp.notes}
                  onChange={(e) => setNewApp({...newApp, notes: e.target.value})}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2.5 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  Save Submission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsDesktop;
