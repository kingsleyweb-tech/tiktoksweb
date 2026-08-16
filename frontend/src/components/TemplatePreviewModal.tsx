import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { SimulationTemplate } from '../types/template';
import PlatformIcon from './PlatformIcon';

interface TemplatePreviewModalProps {
  template: SimulationTemplate | null;
  onClose: () => void;
  onUse: (template: SimulationTemplate) => void;
}

// Visual brand colours used only for the mockup UI
const mockupBg: Record<string, string> = {
  Facebook: 'bg-blue-600',
  TikTok:   'bg-slate-900',
  Snapchat: 'bg-yellow-400',
  Gmail:    'bg-white',
};
const mockupText: Record<string, string> = {
  Facebook: 'text-white',
  TikTok:   'text-white',
  Snapchat: 'text-slate-900',
  Gmail:    'text-slate-800',
};

export default function TemplatePreviewModal({ template, onClose, onUse }: TemplatePreviewModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!template) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [template, onClose]);

  if (!template) return null;

  const bg   = mockupBg[template.platform]   ?? 'bg-slate-100';
  const text = mockupText[template.platform] ?? 'text-slate-800';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      {/* Panel */}
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${template.iconBg} ${template.iconColor}`}>
              <PlatformIcon platform={template.platform} className="w-5 h-5" />
            </div>
            <div>
              <h2 id="preview-modal-title" className="text-base font-semibold text-slate-800">
                {template.name}
              </h2>
              <p className="text-xs text-slate-400">{template.category} · {template.status}</p>
            </div>
          </div>
          <button
            id="close-preview-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Close preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Simulation Mockup */}
        <div className="px-6 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <Link
              to={`/simulation-preview/${template.slug}`}
              className="ml-2 flex-1 bg-slate-100 hover:bg-slate-200 transition-colors rounded px-3 py-1.5 text-xs text-blue-600 font-mono truncate flex items-center justify-between"
              title="Click to launch interactive simulation test"
            >
              <span>https://awareness.cybermonitor.gh/sim/{template.slug}</span>
              <span className="text-[10px] text-slate-400 underline font-sans font-normal ml-2">Launch simulator ↗</span>
            </Link>
          </div>

          {/* Mockup frame */}
          <div className={`rounded-xl border-2 border-slate-200 overflow-hidden`}>
            {/* Top bar */}
            <div className={`${bg} px-6 py-5 text-center`}>
              <div className={`flex justify-center mb-3 ${template.iconColor}`}>
                <PlatformIcon platform={template.platform} className="w-10 h-10" />
              </div>
              <p className={`text-lg font-semibold ${text}`}>{template.platform}</p>
            </div>

            {/* Form area */}
            <div className="bg-white px-6 py-6 space-y-4">
              {/* Safety banner */}
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-xs text-amber-700 font-medium">
                  ⚠ Cybersecurity Awareness Simulation — This is a training exercise.
                  No credentials are collected or stored.
                </p>
              </div>

              <p className="text-sm text-center text-slate-600 font-medium">
                Sign in to your account to continue
              </p>

              {/* Fake inputs — visual mockup only */}
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-400">
                  Email or phone number
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-400">
                  Password
                </div>
              </div>

              <div
                className="w-full text-center py-2.5 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: template.brandColor === '#FFFC00' ? '#f59e0b' : template.brandColor }}
              >
                Log In
              </div>

              <p className="text-center text-xs text-slate-400">
                Visual mockup only — form is non-functional.
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-6 py-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-1.5">About this simulation</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{template.longDescription}</p>
        </div>

        {/* Meta */}
        <div className="px-6 pb-5 grid grid-cols-3 gap-4">
          {[
            { label: 'Category',  value: template.category },
            { label: 'Status',    value: template.status },
            { label: 'Used in',   value: `${template.usageCount} campaign${template.usageCount !== 1 ? 's' : ''}` },
          ].map((m) => (
            <div key={m.label} className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
              <p className="text-xs text-slate-400">{m.label}</p>
              <p className="text-sm font-medium text-slate-700 mt-0.5">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <Link
            to={`/simulation-preview/${template.slug}`}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            onClick={onClose}
          >
            <span>Test Simulator</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            id="use-template-btn"
            onClick={() => onUse(template)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
}
