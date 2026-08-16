import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTemplates } from '../services/templateService';
import type { SimulationTemplate, TemplateCategory } from '../types/template';
import TemplateCard from '../components/TemplateCard';
import TemplatePreviewModal from '../components/TemplatePreviewModal';

export default function Templates() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | TemplateCategory>('All');
  const [selectedPreview, setSelectedPreview] = useState<SimulationTemplate | null>(null);

  const templates = getAllTemplates();

  // Client-side filtering logic
  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch =
      tpl.name.toLowerCase().includes(search.toLowerCase()) ||
      tpl.description.toLowerCase().includes(search.toLowerCase()) ||
      tpl.platform.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || tpl.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: SimulationTemplate) => {
    // Navigate to create campaign page with the template slug passed as a query parameter
    navigate(`/campaigns/create?template=${template.slug}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Simulation Templates</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Select and preview pre-configured templates for your phishing simulation drills.
        </p>
      </div>

      {/* Controls: Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="search-templates"
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-1">
          {(['All', 'Social Media', 'Email'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm">No templates match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={setSelectedPreview}
              onUse={handleUseTemplate}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={selectedPreview}
        onClose={() => setSelectedPreview(null)}
        onUse={(tpl) => {
          setSelectedPreview(null);
          handleUseTemplate(tpl);
        }}
      />
    </div>
  );
}
