import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Eye, ShieldAlert, Check, Play, RefreshCw, 
  Settings, BarChart3, Database, Save, X, Search, FileText, ToggleLeft, ToggleRight, Sparkles, AlertTriangle, ArrowUp, ArrowDown, Download, Upload
} from 'lucide-react';
import { templateService, ResumeTemplate, TemplateAnalytics } from '../../services/templates';
import { TemplateBadge } from '../../components/TemplateBadge';
import { ATSBadge } from '../../components/ATSBadge';

export const TemplatesModule: React.FC = () => {
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [analytics, setAnalytics] = useState<TemplateAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Selected for Bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<ResumeTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<ResumeTemplate | null>(null);

  // Form State
  const [formState, setFormState] = useState<Omit<ResumeTemplate, 'id' | 'createdAt' | 'updatedAt'>>({
    templateId: '',
    name: '',
    slug: '',
    category: 'Professional',
    description: '',
    previewImage: '',
    thumbnail: '',
    coverImage: '',
    atsFriendly: true,
    atsScore: 95,
    featured: false,
    premium: false,
    recommendedFor: [],
    industry: [],
    colors: { primary: '#111111', secondary: '#666666' },
    font: { family: 'Inter', heading: 18, body: 11 },
    layout: { columns: 1, header: 'top', spacing: 16, margin: 32 },
    sections: ['header', 'summary', 'experience', 'projects', 'skills', 'education', 'certifications'],
    renderer: '',
    enabled: true,
    displayOrder: 1
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const tpls = await templateService.getTemplates();
      setTemplates(tpls);
      
      const stats = await templateService.getAnalytics();
      setAnalytics(stats);
    } catch (err) {
      console.error('Failed to load admin template details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOpenAdd = () => {
    setEditingTemplate(null);
    setFormState({
      templateId: '',
      name: '',
      slug: '',
      category: 'Professional',
      description: '',
      previewImage: '',
      thumbnail: '',
      coverImage: '',
      atsFriendly: true,
      atsScore: 95,
      featured: false,
      premium: false,
      recommendedFor: [],
      industry: [],
      colors: { primary: '#111111', secondary: '#666666' },
      font: { family: 'Inter', heading: 18, body: 11 },
      layout: { columns: 1, header: 'top', spacing: 16, margin: 32 },
      sections: ['header', 'summary', 'experience', 'projects', 'skills', 'education', 'certifications'],
      renderer: '',
      enabled: true,
      displayOrder: templates.length + 1
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (template: ResumeTemplate) => {
    setEditingTemplate(template);
    setFormState({
      templateId: template.templateId,
      name: template.name,
      slug: template.slug,
      category: template.category,
      description: template.description || '',
      previewImage: template.previewImage || '',
      thumbnail: template.thumbnail || '',
      coverImage: template.coverImage || '',
      atsFriendly: template.atsFriendly,
      atsScore: template.atsScore,
      featured: template.featured,
      premium: template.premium,
      recommendedFor: template.recommendedFor || [],
      industry: template.industry || [],
      colors: template.colors || { primary: '#111111', secondary: '#666666' },
      font: template.font || { family: 'Inter', heading: 18, body: 11 },
      layout: template.layout || { columns: 1, header: 'top', spacing: 16, margin: 32 },
      sections: template.sections || ['header', 'summary', 'experience', 'projects', 'skills', 'education', 'certifications'],
      renderer: template.renderer,
      enabled: template.enabled,
      displayOrder: template.displayOrder
    });
    setIsFormOpen(true);
  };

  const handleDuplicate = async (template: ResumeTemplate) => {
    try {
      const duplicateData = {
        ...template,
        templateId: `${template.templateId}_dup`,
        name: `${template.name} (Copy)`,
        slug: `${template.slug}-copy`,
        displayOrder: templates.length + 1,
      };
      delete (duplicateData as any).id;
      delete (duplicateData as any).createdAt;
      delete (duplicateData as any).updatedAt;
      
      await templateService.createTemplate(duplicateData);
      loadData();
    } catch (err) {
      alert('Failed to duplicate template');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.templateId || !formState.name || !formState.slug || !formState.renderer) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingTemplate) {
        await templateService.updateTemplate(editingTemplate.templateId, formState);
      } else {
        await templateService.createTemplate(formState);
      }
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      alert('Failed to save template details');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await templateService.deleteTemplate(templateId);
      loadData();
    } catch (err) {
      alert('Failed to delete template');
    }
  };

  const handleToggleEnable = async (template: ResumeTemplate) => {
    try {
      await templateService.updateTemplate(template.templateId, { enabled: !template.enabled });
      loadData();
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  const handleToggleFeatured = async (template: ResumeTemplate) => {
    try {
      await templateService.updateTemplate(template.templateId, { featured: !template.featured });
      loadData();
    } catch (err) {
      alert('Failed to update featured status');
    }
  };

  const handleReorder = async (template: ResumeTemplate, direction: 'up' | 'down') => {
    const currentIndex = templates.findIndex((t) => t.templateId === template.templateId);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === templates.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const reorderedList = [...templates];
    
    // Swap
    const temp = reorderedList[currentIndex];
    reorderedList[currentIndex] = reorderedList[targetIndex];
    reorderedList[targetIndex] = temp;

    const ids = reorderedList.map((t) => t.templateId);
    try {
      await templateService.reorderTemplates(ids);
      loadData();
    } catch (err) {
      alert('Reorder failed');
    }
  };

  // Bulk Actions
  const handleBulkEnable = async (enabled: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      await templateService.enableTemplates(selectedIds, enabled);
      setSelectedIds([]);
      loadData();
    } catch (err) {
      alert('Bulk action failed');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} templates?`)) return;
    try {
      await Promise.all(selectedIds.map((id) => templateService.deleteTemplate(id)));
      setSelectedIds([]);
      loadData();
    } catch (err) {
      alert('Bulk delete failed');
    }
  };

  const handleBulkExport = () => {
    const exportTemplates = templates.filter((t) => selectedIds.includes(t.templateId));
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportTemplates, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bimba_templates_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importList = Array.isArray(parsed) ? parsed : [parsed];
        
        for (const item of importList) {
          // Remove ID/timestamps
          delete item.id;
          delete item._id;
          delete item.createdAt;
          delete item.updatedAt;
          await templateService.createTemplate(item);
        }
        alert('Templates imported successfully');
        loadData();
      } catch (err) {
        alert('Failed to parse and import templates JSON');
      }
    };
    reader.readAsText(file);
  };

  // Filters
  const filteredTemplates = templates.filter((t) => {
    if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
    if (statusFilter === 'Enabled' && !t.enabled) return false;
    if (statusFilter === 'Disabled' && t.enabled) return false;
    if (statusFilter === 'Premium' && !t.premium) return false;
    if (statusFilter === 'Featured' && !t.featured) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.templateId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 w-full text-left">
      {/* Top Banner Controls */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Resume Templates</h1>
          <p className="text-slate-500 text-xs mt-1">Manage database-driven ATS-friendly templates and preview styling pipelines.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer ${
              refreshing ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw size={16} />
          </button>
          
          <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer">
            <Upload size={14} />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer shadow hover:bg-slate-800"
          >
            <Plus size={14} />
            <span>Add Template</span>
          </button>
        </div>
      </div>

      {/* Analytics Dashboard Grid */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Templates</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{analytics.totalTemplates}</h3>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Active / Disabled</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              <span className="text-emerald-600">{analytics.enabled}</span>
              <span className="text-slate-300 mx-1.5">/</span>
              <span className="text-rose-500">{analytics.disabled}</span>
            </h3>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Featured / Premium</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              <span className="text-indigo-600">{analytics.featured}</span>
              <span className="text-slate-300 mx-1.5">/</span>
              <span className="text-amber-500">{analytics.premium}</span>
            </h3>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Average ATS Rating</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{analytics.averageAtsScore}%</h3>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">PDF Generations</span>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">{analytics.pdfGenerations}</h3>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Filter controls bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 inset-y-0 my-auto text-slate-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-slate-400 text-xs w-48 font-bold"
              />
            </div>
            
            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none text-xs font-bold"
            >
              <option value="All">All Categories</option>
              <option value="Professional">Professional</option>
              <option value="Student">Student</option>
              <option value="Minimal">Minimal</option>
              <option value="International">International</option>
              <option value="Industry">Industry</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none text-xs font-bold"
            >
              <option value="All">All Statuses</option>
              <option value="Enabled">Active Only</option>
              <option value="Disabled">Disabled Only</option>
              <option value="Premium">Premium Only</option>
              <option value="Featured">Featured Only</option>
            </select>
          </div>

          {/* Bulk operations */}
          {selectedIds.length > 0 && (
            <div className="flex gap-2 items-center bg-indigo-50 border border-indigo-100 p-1.5 rounded-2xl">
              <span className="text-[10px] font-black text-indigo-700 px-2 uppercase">
                {selectedIds.length} Selected
              </span>
              <button
                onClick={() => handleBulkEnable(true)}
                className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                Enable
              </button>
              <button
                onClick={() => handleBulkEnable(false)}
                className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                Disable
              </button>
              <button
                onClick={handleBulkExport}
                className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                Export
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Templates Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredTemplates.length && filteredTemplates.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredTemplates.map((t) => t.templateId));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>
                <th className="p-4">Template details</th>
                <th className="p-4">Category</th>
                <th className="p-4">ATS compliance</th>
                <th className="p-4">Audience</th>
                <th className="p-4">Display order</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <Loader />
                  </td>
                </tr>
              ) : filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                    No templates registered. Add a new template or import a templates JSON.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => {
                  const isSelected = selectedIds.includes(template.templateId);
                  return (
                    <tr
                      key={template.templateId}
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-indigo-50/20' : ''
                      }`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, template.templateId]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== template.templateId));
                            }
                          }}
                        />
                      </td>

                      <td className="p-4 flex items-center gap-3">
                        {/* Thumbnail */}
                        <div className="w-10 h-14 rounded-lg bg-slate-100 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center">
                          {template.previewImage ? (
                            <img
                              src={template.previewImage}
                              alt=""
                              className="w-full h-full object-cover object-top"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <FileText size={16} className="text-slate-350" />
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-extrabold text-slate-900">{template.name}</h4>
                            {template.featured && <TemplateBadge type="featured" />}
                            {template.premium && <TemplateBadge type="premium" />}
                          </div>
                          <code className="text-[10px] text-slate-400 font-mono mt-0.5 block">{template.templateId}</code>
                        </div>
                      </td>

                      <td className="p-4 font-bold text-slate-600">{template.category}</td>

                      <td className="p-4">
                        <ATSBadge score={template.atsScore} size="sm" />
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {template.recommendedFor?.slice(0, 2).map((role) => (
                            <span key={role} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          <span>{template.displayOrder}</span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => handleReorder(template, 'up')}
                              className="p-0.5 hover:bg-slate-200 rounded cursor-pointer"
                            >
                              <ArrowUp size={10} />
                            </button>
                            <button
                              onClick={() => handleReorder(template, 'down')}
                              className="p-0.5 hover:bg-slate-200 rounded cursor-pointer"
                            >
                              <ArrowDown size={10} />
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleToggleEnable(template)}
                            className={`p-1.5 rounded-lg border cursor-pointer ${
                              template.enabled
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                : 'bg-rose-50 border-rose-100 text-rose-600'
                            }`}
                            title={template.enabled ? 'Disable Template' : 'Enable Template'}
                          >
                            <Check size={12} />
                          </button>
                          
                          <button
                            onClick={() => handleToggleFeatured(template)}
                            className={`p-1.5 rounded-lg border cursor-pointer ${
                              template.featured
                                ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                            title="Toggle Featured"
                          >
                            <Sparkles size={12} />
                          </button>

                          <button
                            onClick={() => {
                              setViewingTemplate(template);
                            }}
                            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                            title="Preview"
                          >
                            <Eye size={12} />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(template)}
                            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                            title="Edit"
                          >
                            <Edit size={12} />
                          </button>

                          <button
                            onClick={() => handleDuplicate(template)}
                            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                            title="Duplicate"
                          >
                            <Plus size={12} />
                          </button>

                          <button
                            onClick={() => handleDelete(template.templateId)}
                            className="p-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-extrabold text-slate-900 text-base">
                {editingTemplate ? 'Edit Template' : 'Add New Template'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer shadow-sm"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Template ID (Unique)</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTemplate}
                    value={formState.templateId}
                    onChange={(e) => setFormState({ ...formState, templateId: e.target.value })}
                    placeholder="e.g. standard_professional"
                    className="p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-xs font-semibold disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Slug (Unique URL)</label>
                  <input
                    type="text"
                    required
                    value={formState.slug}
                    onChange={(e) => setFormState({ ...formState, slug: e.target.value })}
                    placeholder="e.g. standard-professional"
                    className="p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Template Name</label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder="e.g. Standard Professional"
                    className="p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-xs font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Category</label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    className="p-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none text-xs font-semibold"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Student">Student</option>
                    <option value="Minimal">Minimal</option>
                    <option value="International">International</option>
                    <option value="Industry">Industry</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Description</label>
                <textarea
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  placeholder="Summarize layout features..."
                  rows={2}
                  className="p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-xs font-semibold resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Renderer Function Name</label>
                  <input
                    type="text"
                    required
                    value={formState.renderer}
                    onChange={(e) => setFormState({ ...formState, renderer: e.target.value })}
                    placeholder="e.g. classicProfessional"
                    className="p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-xs font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">ATS Rating Score (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={formState.atsScore}
                    onChange={(e) => setFormState({ ...formState, atsScore: parseInt(e.target.value) || 0 })}
                    className="p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-xs font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Display Order</label>
                  <input
                    type="number"
                    required
                    value={formState.displayOrder}
                    onChange={(e) => setFormState({ ...formState, displayOrder: parseInt(e.target.value) || 1 })}
                    className="p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Preview Image URL</label>
                  <input
                    type="text"
                    value={formState.previewImage}
                    onChange={(e) => setFormState({ ...formState, previewImage: e.target.value })}
                    placeholder="Cloudinary URL..."
                    className="p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-xs font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Cover Image URL</label>
                  <input
                    type="text"
                    value={formState.coverImage}
                    onChange={(e) => setFormState({ ...formState, coverImage: e.target.value })}
                    className="p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Layout Config */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Layout Configuration</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase">Columns</label>
                    <select
                      value={formState.layout.columns}
                      onChange={(e) => setFormState({
                        ...formState,
                        layout: { ...formState.layout, columns: parseInt(e.target.value) || 1 }
                      })}
                      className="p-2 border border-slate-250 bg-white rounded-lg text-xs font-semibold"
                    >
                      <option value={1}>1 Column</option>
                      <option value={2}>2 Columns</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase">Header Layout</label>
                    <input
                      type="text"
                      value={formState.layout.header}
                      onChange={(e) => setFormState({
                        ...formState,
                        layout: { ...formState.layout, header: e.target.value }
                      })}
                      className="p-2 border border-slate-250 bg-white rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase">Font Family</label>
                    <input
                      type="text"
                      value={formState.font.family}
                      onChange={(e) => setFormState({
                        ...formState,
                        font: { ...formState.font, family: e.target.value }
                      })}
                      className="p-2 border border-slate-250 bg-white rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                  <input
                    type="checkbox"
                    checked={formState.featured}
                    onChange={(e) => setFormState({ ...formState, featured: e.target.checked })}
                  />
                  <span>Featured Template</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                  <input
                    type="checkbox"
                    checked={formState.premium}
                    onChange={(e) => setFormState({ ...formState, premium: e.target.checked })}
                  />
                  <span>Premium Template</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                  <input
                    type="checkbox"
                    checked={formState.enabled}
                    onChange={(e) => setFormState({ ...formState, enabled: e.target.checked })}
                  />
                  <span>Enabled (Visible to Students)</span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 -mx-6 -mb-6 mt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer shadow hover:bg-slate-800"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Preview Modal */}
      {viewingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 md:p-6 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-500">
                  {viewingTemplate.category}
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{viewingTemplate.name}</h3>
              </div>
              <button
                onClick={() => setViewingTemplate(null)}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer shadow-sm"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="aspect-[3/4] w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-250 flex items-center justify-center">
                {viewingTemplate.previewImage ? (
                  <img
                    src={viewingTemplate.previewImage}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-slate-400 text-xs">No preview image registered.</span>
                )}
              </div>
              
              <div className="flex flex-col gap-2.5">
                <p className="text-xs text-slate-500 leading-relaxed font-bold">
                  {viewingTemplate.description || 'ATS friendly layout optimized for modern recruitment platforms.'}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
                  <div className="flex justify-between border-b border-slate-100 py-1.5">
                    <span>Template ID:</span>
                    <span className="text-slate-900">{viewingTemplate.templateId}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 py-1.5">
                    <span>ATS Score:</span>
                    <span className="text-indigo-600">{viewingTemplate.atsScore}%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 py-1.5">
                    <span>Layout:</span>
                    <span className="text-slate-900">{viewingTemplate.layout?.columns} Columns</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 py-1.5">
                    <span>Font Family:</span>
                    <span className="text-slate-900">{viewingTemplate.font?.family}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesModule;
