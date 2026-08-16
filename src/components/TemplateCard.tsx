import type { SimulationTemplate } from '../types/template';
import PlatformIcon from './PlatformIcon';
import Button from './Button';

interface TemplateCardProps {
  template: SimulationTemplate;
  onPreview: (template: SimulationTemplate) => void;
  onUse: (template: SimulationTemplate) => void;
}

export default function TemplateCard({ template, onPreview, onUse }: TemplateCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-150 flex flex-col h-full overflow-hidden">
      {/* Icon & Title Header */}
      <div className="p-5 flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${template.iconBg} ${template.iconColor}`}>
          <PlatformIcon platform={template.platform} className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            {template.category}
          </span>
          <h3 className="font-bold text-slate-800 truncate mt-0.5" title={template.name}>
            {template.name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Platform: {template.platform}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="px-5 pb-5 flex-1">
        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
          {template.description}
        </p>
      </div>

      {/* Footer Info */}
      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Used {template.usageCount} times</span>
        {template.status === 'Active' ? (
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        ) : (
          <span className="flex items-center gap-1 text-slate-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            Draft
          </span>
        )}
      </div>

      {/* Card Actions */}
      <div className="p-4 border-t border-slate-100 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 justify-center"
          onClick={() => onPreview(template)}
        >
          Preview
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-1 justify-center"
          onClick={() => onUse(template)}
        >
          Use Template
        </Button>
      </div>
    </div>
  );
}
