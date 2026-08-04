import React, { useState, useEffect } from 'react';
import { Columns, LayoutGrid, Eye, Columns2, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { templateService, ResumeTemplate } from '../services/templates';
import { TemplateCategories } from '../components/TemplateCategories';
import { TemplateSearch } from '../components/TemplateSearch';
import { TemplateFilters } from '../components/TemplateFilters';
import { TemplateGallery } from '../components/TemplateGallery';
import { TemplateCarousel } from '../components/TemplateCarousel';
import { TemplateCompare } from '../components/TemplateCompare';
import { TemplatePreview } from '../components/TemplatePreview';
import { TemplatePipeline } from '../components/TemplatePipeline';
import { useResumeBuilderStore } from '../store/resumeBuilderStore';

export const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'grid' | 'pipeline'>('grid');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [atsFriendlyOnly, setAtsFriendlyOnly] = useState<boolean>(false);
  const [premiumFilter, setPremiumFilter] = useState<boolean | null>(null);
  const [layoutTypeFilter, setLayoutTypeFilter] = useState<string | null>(null);

  // Comparison & Preview State
  const [comparingTemplates, setComparingTemplates] = useState<ResumeTemplate[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [previewingTemplate, setPreviewingTemplate] = useState<ResumeTemplate | null>(null);

  // Store connection
  const { selectedTemplate, setSelectedTemplate } = useResumeBuilderStore();

  const loadData = async () => {
    setLoading(true);
    try {
      const allTemplates = await templateService.getTemplates();
      setTemplates(allTemplates);
      
      const allCategories = await templateService.getCategories();
      setCategories(allCategories);
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectTemplate = async (template: ResumeTemplate) => {
    // Save to store
    setSelectedTemplate(template.slug);
    
    // Log selected action on backend tracking API
    try {
      await templateService.trackSelection(template.templateId, 'select', 0);
    } catch (e) {
      console.warn('Tracking failed:', e);
    }
  };

  const handleCompareTemplate = (template: ResumeTemplate) => {
    setComparingTemplates((prev) => {
      // Toggle
      if (prev.some((t) => t.templateId === template.templateId)) {
        return prev.filter((t) => t.templateId !== template.templateId);
      }
      if (prev.length >= 2) {
        // Replace second
        return [prev[0], template];
      }
      return [...prev, template];
    });
  };

  // Filter templates list
  const filteredTemplates = templates.filter((template) => {
    // Category match
    if (activeCategory && template.category.toLowerCase() !== activeCategory.toLowerCase()) {
      return false;
    }
    // Search query match
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = template.name.toLowerCase().includes(q);
      const descMatch = template.description?.toLowerCase().includes(q) || false;
      const roleMatch = template.recommendedFor?.some((r) => r.toLowerCase().includes(q)) || false;
      const indMatch = template.industry?.some((i) => i.toLowerCase().includes(q)) || false;
      if (!nameMatch && !descMatch && !roleMatch && !indMatch) {
        return false;
      }
    }
    // ATS match
    if (atsFriendlyOnly && (!template.atsFriendly || template.atsScore < 95)) {
      return false;
    }
    // Premium match
    if (premiumFilter !== null && template.premium !== premiumFilter) {
      return false;
    }
    // Columns layout match
    if (layoutTypeFilter !== null) {
      if (layoutTypeFilter === '1' && template.layout?.columns !== 1) return false;
      if (layoutTypeFilter === '2' && template.layout?.columns !== 2) return false;
    }
    return true;
  });

  const featuredTemplates = templates.filter((t) => t.featured && t.enabled);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="text-indigo-600 shrink-0" size={24} />
            <span>Select Resume Template</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Choose from professional, recruiter-approved layout architectures built to clear ATS scoring.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2 self-stretch md:self-auto">
          {comparingTemplates.length > 0 && (
            <button
              onClick={() => setIsCompareOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              <Columns size={14} />
              <span>Compare ({comparingTemplates.length}/2)</span>
            </button>
          )}

          <div className="flex items-center gap-1 rounded-2xl bg-white border border-slate-100 p-1 shadow-sm shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl cursor-pointer ${
                viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              className={`p-1.5 rounded-xl cursor-pointer ${
                viewMode === 'pipeline' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Layers size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Featured Carousel */}
      {featuredTemplates.length > 0 && (
        <TemplateCarousel
          templates={featuredTemplates}
          selectedTemplateId={selectedTemplate}
          onSelect={handleSelectTemplate}
          onPreview={(tpl) => setPreviewingTemplate(tpl)}
        />
      )}

      {/* Search and Categories controls */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mt-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <TemplateSearch value={searchQuery} onChange={setSearchQuery} />
          <TemplateFilters
            atsFriendly={atsFriendlyOnly}
            onAtsFriendlyChange={setAtsFriendlyOnly}
            premium={premiumFilter}
            onPremiumChange={setPremiumFilter}
            layoutType={layoutTypeFilter}
            onLayoutTypeChange={setLayoutTypeFilter}
          />
        </div>

        <TemplateCategories
          categories={categories}
          activeCategory={activeCategory}
          onCategorySelect={setActiveCategory}
        />

        {/* Core Gallery display */}
        {viewMode === 'grid' ? (
          <TemplateGallery
            templates={filteredTemplates}
            loading={loading}
            selectedTemplateId={selectedTemplate}
            onSelect={handleSelectTemplate}
            onPreview={(tpl) => setPreviewingTemplate(tpl)}
            onCompare={handleCompareTemplate}
            comparingTemplateIds={comparingTemplates.map((c) => c.templateId)}
          />
        ) : (
          <TemplatePipeline
            templates={filteredTemplates}
            selectedTemplateId={selectedTemplate}
            onSelect={handleSelectTemplate}
            onPreview={(tpl) => setPreviewingTemplate(tpl)}
            activeCategory={activeCategory}
          />
        )}
      </div>

      {/* Popups */}
      {previewingTemplate && (
        <TemplatePreview
          template={previewingTemplate}
          isSelected={selectedTemplate === previewingTemplate.slug || selectedTemplate === previewingTemplate.templateId}
          onClose={() => setPreviewingTemplate(null)}
          onSelect={handleSelectTemplate}
        />
      )}

      {isCompareOpen && (
        <TemplateCompare
          templates={comparingTemplates}
          onClose={() => setIsCompareOpen(false)}
          onSelect={(tpl) => {
            handleSelectTemplate(tpl);
            setIsCompareOpen(false);
          }}
          onRemove={(id) => setComparingTemplates((prev) => prev.filter((t) => t.templateId !== id))}
        />
      )}
    </div>
  );
};

export default Templates;
