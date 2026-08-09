import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Trash2, RefreshCw, Plus, Edit3, Eye, Power, X, 
  FileText, CheckCircle2, AlertTriangle, Sparkles, Download, Copy, Check
} from 'lucide-react';
import { adminService } from '../../services/admin';
import type { AdminResumeData } from '../../services/admin';
import { apiClient } from '../../services/api';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { ResumePreviewSheet } from '../../resume/ResumePreviewSheet';


const MOCK_PREVIEW_RESUME = {
  personalInfo: {
    name: "Bharath Kulal",
    email: "bharath.kulal@bimba.ai",
    phone: "+91 98765 43210",
    address: "Bangalore, India",
    linkedin: "linkedin.com/in/bharathkulal",
    github: "github.com/bharathkulal",
    summary: "Senior Full Stack Engineer & System Architect with 5+ years of experience building scalable web applications and enterprise-grade systems. Proficient in React, Node.js, Python, and cloud infrastructure optimization."
  },
  educationList: [
    { institution: "Indian Institute of Science (IISc)", degree: "B.Tech in Computer Science", passing_year: 2023, cgpa: 9.8, achievements: "Gold medalist in Systems Engineering specialization" }
  ],
  experienceList: [
    { position: "Senior Software Engineer", company: "BIMBA AI", duration: "2024 - Present", description: "Led development of real-time collaboration engines, optimizing WebSocket channels and state synchronization mechanisms. Reduced server-side bundle size by 40%." },
    { position: "Software Engineer", company: "TechCorp Labs", duration: "2023 - 2024", description: "Built microservice architectures handling 50k+ daily transactions. Programmed automated CI/CD pipelines using Docker and Kubernetes." }
  ],
  projectList: [
    { name: "ATS Optimization Scanner", duration: "3 Months", tech_stack: "Python, FastAPI, NLP", description: "Created an AI-driven parser analyzing resume readability compliance, scoring formats against industry guidelines with 99.8% precision." }
  ],
  skillList: [
    { name: "TypeScript", level: 5 },
    { name: "FastAPI", level: 5 },
    { name: "MongoDB", level: 4 },
    { name: "Docker", level: 4 }
  ],
  
  achievements: {
    hackathons: "Winner of Global AI Builders Hackathon 2025",
    awards: "Employee of the Year at Bimba AI",
    soft_skills: "Technical Leadership, Agile Methodologies, System Design"
  },
    sectionVisibility: {
    experience: true,
    projects: true,
    skills: true,
    certifications: true,
    achievements: true
  },
  certifications: [
    { name: "AWS Certified Solutions Architect", organization: "Amazon Web Services", issue_date: "Jan 2025" }
  ]
};

export const ResumeModule: React.FC = () => {
  const navigate = useNavigate();
  
  // Tabs: 'resumes' | 'templates'
  const [activeTab, setActiveTab] = useState<'resumes' | 'templates'>(
    window.location.pathname.includes('/templates') ? 'templates' : 'resumes'
  );

  const [resumes, setResumes] = useState<AdminResumeData[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Template Preview customization states
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile' | 'a4'>('a4');
  const [previewTheme, setPreviewTheme] = useState<string>('blue');
  const [viewingResume, setViewingResume] = useState<any | null>(null);
  const [isFetchingResume, setIsFetchingResume] = useState(false);

  const handleViewResume = async (resumeId: number, template: string) => {
    try {
      setIsFetchingResume(true);
      const res = await apiClient.get(`/api/resume/builder/${resumeId}`);
      if (res.data && res.data.success) {
        setViewingResume({
          ...res.data.extracted_data,
          templateId: template
        });
      } else {
        showToast("Failed to load resume details.", "error");
      }
    } catch (err) {
      showToast("Error loading resume details.", "error");
    } finally {
      setIsFetchingResume(false);
    }
  };

  const handleOpenPreview = (tpl: any) => {
    setPreviewTemplate(tpl);
    setPreviewTheme(tpl.color_theme || 'blue');
    setPreviewViewport('a4');
  };


  const [templateForm, setTemplateForm] = useState({
    slug: '',
    name: '',
    category: 'Modern',
    industry: 'Technology',
    ats_rating: 95,
    popularity: 100,
    color_theme: 'emerald',
    thumbnail: '',
    is_enabled: true,
    is_premium: false,
    is_ats_optimized: true,
    html_content: '',
    reportlab_code: ''
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [resData, tplRes] = await Promise.all([
        adminService.getResumes(),
        apiClient.get('/api/admin/templates')
      ]);
      setResumes(resData);
      setTemplates(tplRes.data);
    } catch (err) {
      console.error("Failed to fetch resume archive data:", err);
      showToast("Failed to fetch resumes archive.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteResume = async (id: number) => {
    if (!window.confirm("Permanently delete this resume from the system?")) return;
    try {
      await adminService.deleteResume(id);
      showToast("Resume deleted successfully.", "success");
      fetchData();
    } catch (err) {
      showToast("Failed to delete resume.", "error");
    }
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      slug: '',
      name: '',
      category: 'Modern',
      industry: 'Technology',
      ats_rating: 95,
      popularity: 100,
      color_theme: 'emerald',
      thumbnail: '',
      is_enabled: true,
      is_premium: false,
      is_ats_optimized: true,
      html_content: '<div className="p-6 bg-white text-slate-800 font-sans">\n  <h1>{{name}}</h1>\n</div>',
      reportlab_code: '# Python ReportLab builder script\nfrom reportlab.lib.pagesizes import letter'
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (tpl: any) => {
    setEditingTemplate(tpl);
    setTemplateForm({
      slug: tpl.slug || '',
      name: tpl.name || '',
      category: tpl.category || 'Modern',
      industry: tpl.industry || 'Technology',
      ats_rating: tpl.score || 95,
      popularity: 100,
      color_theme: tpl.color_theme || 'emerald',
      thumbnail: '',
      is_enabled: tpl.is_active ?? true,
      is_premium: tpl.is_premium ?? false,
      is_ats_optimized: true,
      html_content: tpl.html_content || '',
      reportlab_code: tpl.reportlab_code || ''
    });
    setShowFormModal(true);
  };

  const handleDuplicateTemplate = async (tpl: any) => {
    try {
      const copyForm = {
        slug: `${tpl.slug}_copy_${Date.now().toString().slice(-4)}`,
        name: `${tpl.name} (Copy)`,
        category: tpl.category,
        industry: tpl.industry || 'Technology',
        ats_rating: tpl.score || 95,
        popularity: 100,
        color_theme: tpl.color_theme || 'emerald',
        thumbnail: '',
        is_enabled: true,
        is_premium: tpl.is_premium || false,
        is_ats_optimized: true,
        html_content: tpl.html_content || '',
        reportlab_code: tpl.reportlab_code || ''
      };
      await apiClient.post('/api/admin/templates', copyForm);
      showToast("Template duplicated successfully!", "success");
      fetchData();
    } catch (err) {
      showToast("Failed to duplicate template.", "error");
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await apiClient.put(`/api/admin/templates/${editingTemplate.id}`, templateForm);
        showToast("Resume template layout updated successfully!", "success");
      } else {
        await apiClient.post('/api/admin/templates', templateForm);
        showToast("New resume template layout published!", "success");
      }
      setShowFormModal(false);
      fetchData();
    } catch (err) {
      showToast("Failed to save template layout details.", "error");
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("Permanently delete this design template?")) return;
    try {
      await apiClient.delete(`/api/admin/templates/${id}`);
      showToast("Template layout deleted.", "success");
      fetchData();
    } catch (err) {
      showToast("Failed to delete template.", "error");
    }
  };

  const handleToggleTemplate = async (id: number) => {
    try {
      await apiClient.post(`/api/admin/templates/${id}/toggle`);
      showToast("Template visibility status toggled.", "success");
      fetchData();
    } catch (err) {
      showToast("Failed to toggle status.", "error");
    }
  };

  const handleMockDownload = (name: string) => {
    showToast(`Downloading file: ${name}`, "success");
  };

  const filteredResumes = resumes.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.student_roll.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn font-sans max-w-7xl mx-auto">
      
      {/* Toast Notification */}
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

      {/* Header Panel */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#102117] border border-white/5 rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l -[#111111]/5 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 text-left">
          <h1 className="text-xl font-extrabold text-white tracking-tight">Resume Center</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
            Manage ATS formats, templates, and student document history.
          </p>
        </div>
        
        {/* Workspace selector tabs */}
        <div className="flex gap-1 bg-[#08130D] p-1 rounded-xl relative z-10 shrink-0 border border-white/5">
          <button
            onClick={() => { setActiveTab('resumes'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'resumes' ? '-[#111111] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Resumes
          </button>
          <button
            onClick={() => { setActiveTab('templates'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'templates' ? '-[#111111] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Resume Templates
          </button>
        </div>
      </section>

      {/* Search & Actions Bar */}
      <Card className="p-4 bg-[#13261B] border-white/5">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder={activeTab === 'resumes' ? "Search resumes by name or roll number..." : "Search templates by name or category..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#102117] border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:-[#111111]/30 font-medium"
            />
          </div>
          
          <div className="flex gap-2 shrink-0">
            {activeTab === 'templates' && (
              <Button 
                onClick={handleOpenCreate} 
                variant="primary" 
                size="sm"
                className="flex items-center gap-1.5"
              >
                <Plus size={15} /> Create Template
              </Button>
            )}
            <Button 
              onClick={fetchData} 
              variant="secondary" 
              size="sm" 
              className="border-white/10 text-slate-300 gap-1.5"
            >
              <RefreshCw size={13} /> Refresh Archives
            </Button>
          </div>
        </div>
      </Card>

      {/* Tab 1: All Resumes List */}
      {activeTab === 'resumes' && (
        <Card className="bg-[#13261B] border-white/5 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#102117] border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Portfolio Name</th>
                  <th className="py-4 px-6">Student USN</th>
                  <th className="py-4 px-6">Design Layout</th>
                  <th className="py-4 px-6">ATS Score</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Created Date</th>
                  <th className="py-4 px-6">Last Updated</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 font-bold">
                      Loading resume logs...
                    </td>
                  </tr>
                ) : filteredResumes.length > 0 ? (
                  filteredResumes.map((resume) => {
                    const createdDate = resume.id % 2 === 0 ? '22 Jul 2026' : '24 Jul 2026';
                    const updatedDate = resume.id % 2 === 0 ? '23 Jul 2026' : 'Just now';
                    
                    return (
                      <tr key={resume.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                          <FileText size={16} className="-[#111111] shrink-0" />
                          {resume.name}
                        </td>
                        <td className="py-4 px-6 font-extrabold text-slate-300">{resume.student_roll}</td>
                        <td className="py-4 px-6 text-slate-400">{resume.template}</td>
                        <td className="py-4 px-6 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            resume.ats_score >= 80 ? '-[#111111]/10 -[#111111]' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            ATS {resume.ats_score}%
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] -[#111111]/10 -[#111111]">
                            {resume.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-450">{createdDate}</td>
                        <td className="py-4 px-6 text-slate-450">{updatedDate}</td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleViewResume(resume.id, resume.template)}
                              className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-450 hover:text-white transition-colors cursor-pointer"
                              title="View Resume"
                              disabled={isFetchingResume}
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              onClick={() => handleMockDownload(resume.name)}
                              className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-450 hover:text-white transition-colors cursor-pointer"
                              title="Download PDF"
                            >
                              <Download size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteResume(resume.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                              title="Delete Portfolio"
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
                    <td colSpan={8} className="py-12 text-center text-slate-500 font-bold">
                      No resume portfolios found matching queries.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Resume Templates Gallery */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-slate-500 font-bold text-xs">
              Loading templates registry...
            </div>
          ) : filteredTemplates.length > 0 ? (
            filteredTemplates.map((tpl) => (
              <Card 
                key={tpl.id} 
                className={`p-5 flex flex-col justify-between min-h-[190px] bg-[#13261B] border-white/5 transition-all duration-200 hover:-[#111111]/30 relative overflow-hidden ${
                  !tpl.is_active ? 'opacity-60' : ''
                }`}
              >
                {/* Premium indicator tag */}
                <div className="absolute right-0 top-0 flex items-center">
                  {tpl.is_premium ? (
                    <span className="bg-amber-500 text-black text-[8px] font-black uppercase px-2.5 py-0.5 rounded-bl">Premium</span>
                  ) : (
                    <span className="-[#111111] text-white text-[8px] font-black uppercase px-2.5 py-0.5 rounded-bl">Free</span>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className="-[#111111]/10 border -[#111111]/20 text-[#111111] px-2 py-0.5 rounded text-[8px] font-black uppercase">
                      {tpl.category}
                    </span>
                    <span className="-[#111111]/10 border -[#111111]/20 text-[#111111] px-2 py-0.5 rounded text-[8px] font-black uppercase">
                      {tpl.industry || 'Tech'}
                    </span>
                  </div>
                  
                  <h4 className="font-extrabold text-xs text-white mt-4">{tpl.name}</h4>
                  <p className="text-[9.5px] text-slate-400 mt-1 font-semibold leading-relaxed line-clamp-2">{tpl.description || 'No description provided.'}</p>
                  
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="-[#111111]/10 border -[#111111]/25 -[#111111] text-[8.5px] font-bold px-1.5 py-0.5 rounded">
                      ATS Optimized
                    </span>
                    <span className="text-[9.5px] text-slate-500">ATS Target: {tpl.score || 95}%</span>
                  </div>
                </div>
                
                {/* Footer Controls */}
                <div className="flex justify-between items-center border-t border-white/5 pt-3.5 mt-3.5">
                  <span className="text-[8.5px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${tpl.is_active ? '-[#111111] animate-pulse' : 'bg-rose-500'}`} />
                    {tpl.is_active ? 'Published' : 'Draft'}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOpenPreview(tpl)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Live Preview"
                    >
                      <Eye size={11} />
                    </button>
                    <button 
                      onClick={() => handleOpenEdit(tpl)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Edit Template"
                    >
                      <Edit3 size={11} />
                    </button>
                    <button 
                      onClick={() => handleDuplicateTemplate(tpl)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-[#B3B3B3] hover:text-white transition-colors cursor-pointer"
                      title="Duplicate Template"
                    >
                      <Copy size={11} />
                    </button>
                    <button 
                      onClick={() => handleToggleTemplate(tpl.id)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={tpl.is_active ? 'Disable' : 'Enable'}
                    >
                      <Power size={11} />
                    </button>
                    <button 
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500 font-bold text-xs">
              No design templates found matching queries.
            </div>
          )}
        </div>
      )}

      {/* CREATE & EDIT TEMPLATE FORM MODAL */}
      <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)} title={editingTemplate ? 'Edit Design Template' : 'Add Design Template'}>
        <form onSubmit={handleSaveTemplate} className="flex flex-col gap-4 text-left text-xs font-semibold text-slate-350">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Slug (Unique key ID)</label>
              <input 
                type="text" 
                value={templateForm.slug} 
                onChange={(e) => setTemplateForm({ ...templateForm, slug: e.target.value })} 
                className="w-full p-2.5 bg-[#102117] border border-white/10 focus:-[#111111]/30 rounded-xl text-white outline-none"
                disabled={!!editingTemplate}
                required
                placeholder="e.g. elegant_minimalist"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Template Name</label>
              <input 
                type="text" 
                value={templateForm.name} 
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} 
                className="w-full p-2.5 bg-[#102117] border border-white/10 focus:-[#111111]/30 rounded-xl text-white outline-none"
                required
                placeholder="e.g. Elegant Minimalist"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Category</label>
              <input 
                type="text" 
                value={templateForm.category} 
                onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })} 
                className="w-full p-2.5 bg-[#102117] border border-white/10 focus:-[#111111]/30 rounded-xl text-white outline-none"
                required
                placeholder="e.g. Creative"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Industry</label>
              <input 
                type="text" 
                value={templateForm.industry} 
                onChange={(e) => setTemplateForm({ ...templateForm, industry: e.target.value })} 
                className="w-full p-2.5 bg-[#102117] border border-white/10 focus:-[#111111]/30 rounded-xl text-white outline-none"
                required
                placeholder="e.g. Tech / Business"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">ATS Target Score</label>
              <input 
                type="number" 
                value={templateForm.ats_rating} 
                onChange={(e) => setTemplateForm({ ...templateForm, ats_rating: parseInt(e.target.value) || 95 })} 
                className="w-full p-2.5 bg-[#102117] border border-white/10 focus:-[#111111]/30 rounded-xl text-white outline-none"
                required
              />
            </div>
          </div>

          {/* Premium & active flags */}
          <div className="flex items-center gap-5 bg-white/5 p-3 rounded-xl border border-white/5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={templateForm.is_premium} 
                onChange={(e) => setTemplateForm({ ...templateForm, is_premium: e.target.checked })} 
                className="w-4 h-4 rounded -[#111111] focus:-[#111111] border-white/10"
              />
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-300">Premium layout</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={templateForm.is_enabled} 
                onChange={(e) => setTemplateForm({ ...templateForm, is_enabled: e.target.checked })} 
                className="w-4 h-4 rounded -[#111111] focus:-[#111111] border-white/10"
              />
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-300">Publish immediately</span>
            </label>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">HTML Preview code</label>
            <textarea 
              value={templateForm.html_content} 
              onChange={(e) => setTemplateForm({ ...templateForm, html_content: e.target.value })} 
              className="w-full p-2.5 font-mono text-[10px] bg-[#102117] border border-white/10 focus:-[#111111]/30 rounded-xl -[#111111] outline-none animate-fadeIn"
              rows={4}
              placeholder="<div>Layout code here...</div>"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">ReportLab PDF Export Code</label>
            <textarea 
              value={templateForm.reportlab_code} 
              onChange={(e) => setTemplateForm({ ...templateForm, reportlab_code: e.target.value })} 
              className="w-full p-2.5 font-mono text-[10px] bg-[#102117] border border-white/10 focus:-[#111111]/30 rounded-xl -[#111111] outline-none animate-fadeIn"
              rows={4}
              placeholder="# Python formatting details..."
            />
          </div>

          <div className="flex gap-2.5 justify-end pt-3 border-t border-white/5">
            <Button type="button" variant="secondary" onClick={() => setShowFormModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Publish Template</Button>
          </div>
        </form>
      </Modal>

      {/* PREVIEW TEMPLATE DETAILS OVERLAY */}
      {previewTemplate && (
        <Modal 
          isOpen={!!previewTemplate} 
          onClose={() => setPreviewTemplate(null)} 
          title={`Dynamic Preview: ${previewTemplate.name}`}
        >
          <div className="flex flex-col gap-6 text-left text-xs font-semibold text-slate-300">
            {/* Template info bar */}
            <div className="flex flex-wrap justify-between items-center bg-[#102117] border border-white/5 p-4 rounded-2xl gap-4">
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider block">Template Metadata</span>
                <div className="flex items-center gap-2">
                  <span className="-[#111111]/10 border -[#111111]/20 text-[#111111] px-2 py-0.5 rounded text-[8px] font-black uppercase">
                    {previewTemplate.category}
                  </span>
                  <span className="-[#111111]/10 border -[#111111]/20 text-[#111111] px-2 py-0.5 rounded text-[8px] font-black uppercase">
                    {previewTemplate.industry || 'Tech'}
                  </span>
                  {previewTemplate.is_premium && (
                    <span className="bg-amber-500 text-black text-[8px] font-black uppercase px-2 py-0.5 rounded">Premium</span>
                  )}
                </div>
              </div>

              {/* Viewport simulation picker */}
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider block">Simulated Viewport</span>
                <div className="flex bg-[#08130D] border border-white/5 p-1 rounded-xl gap-1">
                  {(['desktop', 'tablet', 'mobile', 'a4'] as const).map((vp) => (
                    <button
                      key={vp}
                      type="button"
                      onClick={() => setPreviewViewport(vp)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                        previewViewport === vp ? '-[#111111] text-white shadow-md' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {vp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme switcher */}
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider block">Accent Theme</span>
                <div className="flex gap-1.5">
                  {['blue', 'emerald', 'indigo', 'slate', 'red', 'purple', 'orange', 'pink', 'green'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setPreviewTheme(col)}
                      className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${
                        col === 'blue' ? 'bg-blue-600' :
                        col === 'emerald' ? '-[#111111]' :
                        col === 'indigo' ? 'bg-indigo-600' :
                        col === 'slate' ? 'bg-slate-600' :
                        col === 'red' ? 'bg-red-600' :
                        col === 'purple' ? 'bg-purple-600' :
                        col === 'orange' ? 'bg-orange-600' :
                        col === 'pink' ? 'bg-pink-600' : '-[#111111]'
                      } ${
                        previewTheme === col ? 'border-white scale-110 shadow' : 'border-transparent hover:scale-105'
                      }`}
                      title={col}
                    />
                  ))}
                </div>
              </div>

              {/* ATS target meter */}
              <div className="flex items-center gap-3 bg-[#08130D] border border-white/5 px-4 py-2 rounded-2xl">
                <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle cx="16" cy="16" r="13" className="stroke-white/5 fill-none" strokeWidth="2.5" />
                    <circle cx="16" cy="16" r="13" className="-[#111111] fill-none" strokeWidth="2.5" strokeDasharray="81" strokeDashoffset={81 - (81 * (previewTemplate.ats_rating || 98)) / 100} strokeLinecap="round" />
                  </svg>
                  <span className="text-[8px] font-black text-white">{previewTemplate.ats_rating || 98}%</span>
                </div>
                <div className="text-left">
                  <span className="text-[8px] text-slate-455 uppercase font-black tracking-wider block">ATS Compliance</span>
                  <span className="text-[9px] text-[#111111] font-bold">Highly Optimized</span>
                </div>
              </div>
            </div>

            {/* Viewport Frame */}
            <div className="bg-[#08130D] border border-white/5 rounded-2xl p-6 flex justify-center items-center overflow-x-auto min-h-[450px]">
              <div 
                className={`transition-all duration-300 bg-slate-100/5 p-4 rounded-xl flex justify-center ${
                  previewViewport === 'desktop' ? 'w-full max-w-[900px] aspect-[16/10]' :
                  previewViewport === 'tablet' ? 'w-[680px] aspect-[4/3]' :
                  previewViewport === 'mobile' ? 'w-[360px] aspect-[9/16]' :
                  'w-full max-w-[500px]'
                }`}
              >
                <div className={`overflow-auto w-full flex justify-center items-start ${
                  previewViewport === 'mobile' ? 'scale-[0.65] origin-top' :
                  previewViewport === 'tablet' ? 'scale-[0.8] origin-top' : ''
                }`}>
                  <ResumePreviewSheet
                    personalInfo={MOCK_PREVIEW_RESUME.personalInfo}
                    educationList={MOCK_PREVIEW_RESUME.educationList}
                    experienceList={MOCK_PREVIEW_RESUME.experienceList}
                    projectList={MOCK_PREVIEW_RESUME.projectList}
                    skillList={MOCK_PREVIEW_RESUME.skillList}
                    certifications={MOCK_PREVIEW_RESUME.certifications}
                    achievements={MOCK_PREVIEW_RESUME.achievements}
                    sectionVisibility={MOCK_PREVIEW_RESUME.sectionVisibility}
                    templateId={previewTemplate.slug}
                    colorTheme={previewTheme}
                    zoomLevel={0.9}
                  />
                </div>
              </div>
            </div>

            {/* Close button */}
            <div className="flex gap-2.5 justify-end border-t border-white/5 pt-4">
              <Button onClick={() => setPreviewTemplate(null)} variant="primary">Close Preview</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* VIEW STUDENT RESUME PREVIEW MODAL */}
      {viewingResume && (
        <Modal
          isOpen={!!viewingResume}
          onClose={() => setViewingResume(null)}
          title={`Student Resume Preview: ${viewingResume.personal_info?.name || 'Resume'}`}
        >
          <div className="flex flex-col gap-4">
            <div className="bg-[#08130D] border border-white/5 rounded-2xl p-6 flex justify-center items-center overflow-x-auto min-h-[450px]">
              <div className="w-[800px] border border-slate-200 rounded-xl overflow-hidden shadow-2xl bg-white p-8 text-slate-800">
                <ResumePreviewSheet
                  personalInfo={{
                    name: viewingResume.personal_info?.name || viewingResume.name,
                    email: viewingResume.personal_info?.email,
                    phone: viewingResume.personal_info?.phone,
                    address: viewingResume.personal_info?.location,
                    summary: viewingResume.summary
                  }}
                  educationList={viewingResume.education?.map((edu: any) => ({
                    institution: edu.institution || edu.school,
                    degree: edu.degree,
                    passing_year: edu.year,
                    cgpa: edu.cgpa
                  })) || []}
                  experienceList={viewingResume.experience || []}
                  projectList={viewingResume.projects || []}
                  skillList={viewingResume.skills || []}
                  templateId={viewingResume.templateId}
                  colorTheme="blue"
                  zoomLevel={100}
                />
              </div>
            </div>
            <div className="flex gap-2.5 justify-end border-t border-white/5 pt-4">
              <Button onClick={() => setViewingResume(null)} variant="primary">Close Preview</Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default ResumeModule;
