import React, { useState, useEffect } from 'react';
import { Search, Trash2, RefreshCw, Plus, Edit3, Eye, Power, X } from 'lucide-react';
import { adminService } from '../../services/admin';
import type { AdminResumeData, AdminTemplateData } from '../../services/admin';
import { apiClient } from '../../services/api';

export const ResumeModule: React.FC = () => {
  const [resumes, setResumes] = useState<AdminResumeData[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
  const [templateForm, setTemplateForm] = useState({
    slug: '',
    name: '',
    category: 'Modern',
    ats_rating: 95,
    popularity: 100,
    color_theme: 'blue',
    thumbnail: '',
    is_enabled: true,
    is_premium: false,
    is_ats_optimized: true,
    html_content: '',
    reportlab_code: ''
  });

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteResume = async (id: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this resume portfolio from the system?")) return;
    try {
      await adminService.deleteResume(id);
      alert("Resume deleted.");
      fetchData();
    } catch (err) {
      alert("Failed to delete resume.");
    }
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      slug: '',
      name: '',
      category: 'Modern',
      ats_rating: 95,
      popularity: 100,
      color_theme: 'blue',
      thumbnail: '',
      is_enabled: true,
      is_premium: false,
      is_ats_optimized: true,
      html_content: '',
      reportlab_code: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (tpl: any) => {
    setEditingTemplate(tpl);
    setTemplateForm({
      slug: tpl.slug || '',
      name: tpl.name || '',
      category: tpl.category || 'Modern',
      ats_rating: tpl.score || 95,
      popularity: 100,
      color_theme: tpl.color_theme || 'blue',
      thumbnail: '',
      is_enabled: tpl.is_active || true,
      is_premium: tpl.is_premium || false,
      is_ats_optimized: true,
      html_content: tpl.html_content || '',
      reportlab_code: tpl.reportlab_code || ''
    });
    setShowModal(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await apiClient.put(`/api/admin/templates/${editingTemplate.id}`, templateForm);
        alert("Template updated successfully!");
      } else {
        await apiClient.post('/api/admin/templates', templateForm);
        alert("Template created successfully!");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to save template details.");
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template from database?")) return;
    try {
      await apiClient.delete(`/api/admin/templates/${id}`);
      alert("Template deleted successfully!");
      fetchData();
    } catch (err) {
      alert("Failed to delete template.");
    }
  };

  const handleToggleTemplate = async (id: number) => {
    try {
      await apiClient.post(`/api/admin/templates/${id}/toggle`);
      fetchData();
    } catch (err) {
      alert("Failed to toggle status.");
    }
  };

  const filteredResumes = resumes.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.student_roll.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fadeIn font-sans pb-12">
      {/* Templates Showcase Panel */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Standard Active Showcase Layouts</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Configure designer layouts and check parser compliance score levels</p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-755 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-smooth cursor-pointer"
          >
            <Plus size={14} /> Add Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {templates.map((tpl) => (
            <div 
              key={tpl.id} 
              className={`bg-slate-50/50 p-4.5 border rounded-2xl flex flex-col justify-between min-h-44 transition-all duration-200 ${
                tpl.is_active ? 'border-slate-200/70 hover:border-blue-400' : 'border-rose-200/60 bg-rose-50/10'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="bg-blue-50 border border-blue-100 text-blue-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                    {tpl.category}
                  </span>
                  <span className="text-[9px] font-black text-slate-400">ATS: {tpl.score}%</span>
                </div>
                <h4 className="font-extrabold text-xs text-slate-800 mt-3">{tpl.name}</h4>
                <p className="text-[9px] text-slate-450 mt-1 font-semibold leading-relaxed line-clamp-2">{tpl.description}</p>
                <div className="text-[9px] text-slate-400 mt-1.5">Theme: <span className="font-bold">{tpl.color_theme}</span></div>
              </div>
              
              <div className="flex justify-between items-center border-t border-slate-150 pt-3 mt-3">
                <span className="text-[8px] text-slate-400 font-bold uppercase flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${tpl.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {tpl.is_active ? 'Enabled' : 'Disabled'}
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setPreviewTemplate(tpl)}
                    className="p-1 rounded bg-white border border-slate-200 text-slate-550 hover:bg-slate-50 cursor-pointer"
                    title="Preview template codes"
                  >
                    <Eye size={10} />
                  </button>
                  <button 
                    onClick={() => handleOpenEdit(tpl)}
                    className="p-1 rounded bg-white border border-slate-200 text-slate-550 hover:bg-slate-50 cursor-pointer"
                    title="Edit metadata"
                  >
                    <Edit3 size={10} />
                  </button>
                  <button 
                    onClick={() => handleToggleTemplate(tpl.id)}
                    className={`p-1 rounded bg-white border cursor-pointer ${tpl.is_active ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                    title={tpl.is_active ? 'Disable' : 'Enable'}
                  >
                    <Power size={10} />
                  </button>
                  <button 
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="p-1 rounded bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumes Data List */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-850">Student Portfolio Document Archives</h3>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">Database record of resumes currently stored on backend servers</p>
          </div>
          
          <div className="flex gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search portfolios name, student roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.8 rounded-xl bg-slate-50 border border-slate-250 focus:border-blue-500 focus:outline-none text-xs text-slate-700 font-medium"
              />
            </div>
            <button onClick={fetchData} className="p-2 rounded-xl border border-slate-200 text-slate-550 hover:bg-slate-50">
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-150 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                <th className="py-3 px-4">Portfolio File Name</th>
                <th className="py-3 px-4">Author Student Roll</th>
                <th className="py-3 px-4">Design Layout template</th>
                <th className="py-3 px-4">ATS Compliance Score</th>
                <th className="py-3 px-4">State Status</th>
                <th className="py-3 px-4 text-right">Delete Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResumes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-450 font-bold">
                    No resume portfolio documents found.
                  </td>
                </tr>
              ) : (
                filteredResumes.map((resume) => (
                  <tr key={resume.id} className="hover:bg-slate-50/50 transition-smooth">
                    <td className="py-3.5 px-4 font-bold text-slate-750">{resume.name}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-550">{resume.student_roll}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-450">{resume.template}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-lg text-[9px] font-black">
                        ATS {resume.ats_score}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-450">{resume.status}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteResume(resume.id)}
                        className="p-1.5 rounded-lg border border-rose-250 text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer ml-auto block"
                        title="Delete resume from system database"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE & EDIT MODAL OVERLAY */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6.5 max-w-lg w-full shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto no-scrollbar text-xs font-semibold text-slate-700">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">{editingTemplate ? 'Edit Design Template' : 'Add Design Template'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800"><X size={16} /></button>
            </div>

            <form onSubmit={handleSaveTemplate} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Slug (Unique key ID)</label>
                  <input 
                    type="text" 
                    value={templateForm.slug} 
                    onChange={(e) => setTemplateForm({ ...templateForm, slug: e.target.value })} 
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    disabled={!!editingTemplate}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Template Name</label>
                  <input 
                    type="text" 
                    value={templateForm.name} 
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} 
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Category</label>
                  <input 
                    type="text" 
                    value={templateForm.category} 
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })} 
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">ATS Rating Score</label>
                  <input 
                    type="number" 
                    value={templateForm.ats_rating} 
                    onChange={(e) => setTemplateForm({ ...templateForm, ats_rating: parseInt(e.target.value) || 95 })} 
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Accent Theme Color</label>
                  <input 
                    type="text" 
                    value={templateForm.color_theme} 
                    onChange={(e) => setTemplateForm({ ...templateForm, color_theme: e.target.value })} 
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={templateForm.is_premium} 
                    onChange={(e) => setTemplateForm({ ...templateForm, is_premium: e.target.checked })} 
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Premium layout</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={templateForm.is_enabled} 
                    onChange={(e) => setTemplateForm({ ...templateForm, is_enabled: e.target.checked })} 
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Showcase Enabled</span>
                </label>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">HTML Preview template code</label>
                <textarea 
                  value={templateForm.html_content} 
                  onChange={(e) => setTemplateForm({ ...templateForm, html_content: e.target.value })} 
                  className="w-full p-2 font-mono text-[10px] bg-slate-50 border border-slate-200 rounded-xl"
                  rows={4}
                  placeholder="<div>Template structure details...</div>"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">ReportLab PDF Export Python Code</label>
                <textarea 
                  value={templateForm.reportlab_code} 
                  onChange={(e) => setTemplateForm({ ...templateForm, reportlab_code: e.target.value })} 
                  className="w-full p-2 font-mono text-[10px] bg-slate-50 border border-slate-200 rounded-xl"
                  rows={4}
                  placeholder="# Python ReportLab formatting classes..."
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-550 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm cursor-pointer"
                >
                  Save Template Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW TEMPLATE CODE MODAL */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6.5 max-w-2xl w-full shadow-2xl flex flex-col gap-4 max-h-[80vh] overflow-y-auto no-scrollbar text-xs font-semibold text-slate-700 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Preview Layout code: {previewTemplate.name}</h3>
              <button onClick={() => setPreviewTemplate(null)} className="text-slate-400 hover:text-slate-800"><X size={16} /></button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block mb-1.5">HTML Structure Layout</span>
                <pre className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-[9px] text-slate-600 overflow-x-auto max-h-40">
                  {previewTemplate.html_content || '<!-- No html layout specified -->'}
                </pre>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block mb-1.5">ReportLab PDF python builder code</span>
                <pre className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-[9px] text-slate-650 overflow-x-auto max-h-40">
                  {previewTemplate.reportlab_code || '# No reportlab code provided'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button 
                onClick={() => setPreviewTemplate(null)} 
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeModule;
