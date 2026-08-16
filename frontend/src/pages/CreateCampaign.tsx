import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import { getAllTemplates, getTemplateBySlug } from '../services/templateService';
import { createCampaign } from '../services/campaignService';

// ─── Types ────────────────────────────────────────────────────────────────────
type DeliveryMethod = 'email' | 'sms' | '';
type CampaignStatus = 'draft' | 'active';

interface FormValues {
  name: string;
  template: string;
  deliveryMethod: DeliveryMethod;
  description: string;
  status: CampaignStatus;
}

interface FormErrors {
  name?: string;
  template?: string;
  deliveryMethod?: string;
}

// ─── Reusable Field Wrapper ───────────────────────────────────────────────────
function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-rose-600">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (hasError?: boolean) =>
  `w-full px-3 py-2.5 text-sm bg-white border rounded-lg text-slate-800 placeholder-slate-400
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
   ${hasError ? 'border-rose-400' : 'border-slate-300'}`;

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ name, onBack }: { name: string; onBack: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800">Campaign Created</h2>
        <p className="text-sm text-slate-500 mt-2">
          <span className="font-medium text-slate-700">"{name}"</span> has been successfully created and saved as a draft.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          No emails or links have been sent yet.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="secondary" onClick={onBack}>
            Back to Campaigns
          </Button>
          <Button variant="primary" onClick={onBack}>
            View Campaigns
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreateCampaign() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const allTemplates = getAllTemplates();

  const [values, setValues] = useState<FormValues>({
    name: '',
    template: '',
    deliveryMethod: '',
    description: '',
    status: 'draft',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // Pre-select template based on query parameter
  useEffect(() => {
    const templateSlug = searchParams.get('template');
    if (templateSlug) {
      const matchedTemplate = getTemplateBySlug(templateSlug);
      if (matchedTemplate) {
        setValues((v) => ({ ...v, template: matchedTemplate.name }));
      }
    }
  }, [searchParams]);

  // ── Field helpers ──
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
  };

  // ── Validation ──
  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!values.name.trim()) next.name = 'Campaign name is required.';
    if (!values.template)    next.template = 'Please select a simulation template.';
    if (!values.deliveryMethod) next.deliveryMethod = 'Please select a delivery method.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      try {
        const matched = allTemplates.find((t) => t.name === values.template);
        const templateId = matched ? matched.slug : 'facebook-security';

        await createCampaign({
          name: values.name,
          templateId,
          deliveryMethod: values.deliveryMethod as 'email' | 'sms',
          description: values.description,
          status: values.status,
          participants: 0,
        });
        setSubmitted(true);
      } catch (err) {
        console.error("Failed to create campaign:", err);
      }
    }
  };

  if (submitted) {
    return <SuccessScreen name={values.name} onBack={() => navigate('/campaigns')} />;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <button
          id="back-to-campaigns-btn"
          onClick={() => navigate('/campaigns')}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
          title="Back to Campaigns"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Create Campaign</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Set up an authorised cybersecurity awareness simulation for your organisation.
          </p>
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-blue-700">
          This creates an authorised phishing awareness simulation. No real credentials are collected
          and participants will be redirected to an educational page.
        </p>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">

          {/* Section: Basic Info */}
          <div className="px-6 py-5 space-y-5">
            <h3 className="text-sm font-semibold text-slate-700">Campaign Details</h3>

            <Field label="Campaign Name" required error={errors.name}>
              <input
                id="campaign-name"
                type="text"
                placeholder="e.g. Q4 HR Awareness Drive"
                value={values.name}
                onChange={(e) => set('name', e.target.value)}
                className={inputCls(!!errors.name)}
              />
            </Field>

            <Field label="Simulation Template" required error={errors.template}>
              <div className="relative">
                <select
                  id="campaign-template"
                  value={values.template}
                  onChange={(e) => set('template', e.target.value)}
                  className={`${inputCls(!!errors.template)} appearance-none pr-9 cursor-pointer`}
                >
                  <option value="">Select a template…</option>
                  {allTemplates.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
                <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </Field>

            <Field label="Campaign Description">
              <textarea
                id="campaign-description"
                rows={3}
                placeholder="Optional: describe the purpose or scope of this campaign…"
                value={values.description}
                onChange={(e) => set('description', e.target.value)}
                className={`${inputCls()} resize-none`}
              />
            </Field>
          </div>

          {/* Section: Delivery */}
          <div className="px-6 py-5 space-y-5">
            <h3 className="text-sm font-semibold text-slate-700">Delivery & Status</h3>

            <Field label="Delivery Method" required error={errors.deliveryMethod}>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: 'email', label: 'Email' },
                  { id: 'sms', label: 'SMS' }
                ] as const).map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    id={`delivery-${method.id}`}
                    onClick={() => set('deliveryMethod', method.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 text-sm font-medium transition-colors text-left
                      ${values.deliveryMethod === method.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : `border-slate-200 hover:border-slate-300 text-slate-700 ${errors.deliveryMethod ? 'border-rose-300' : ''}`
                      }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                      ${values.deliveryMethod === method.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      {method.id === 'email' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      )}
                    </span>
                    <div>
                      <p>{method.label}</p>
                      <p className="text-xs font-normal text-slate-400">
                        {method.id === 'email' ? 'Send via email link' : 'Send via SMS link'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              {errors.deliveryMethod && (
                <p className="flex items-center gap-1 text-xs text-rose-600 mt-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  {errors.deliveryMethod}
                </p>
              )}
            </Field>

            <Field label="Campaign Status">
              <div className="flex gap-3">
                {([
                  { id: 'draft', label: 'Draft' },
                  { id: 'active', label: 'Active' }
                ] as const).map((s) => (
                  <label
                    key={s.id}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer text-sm font-medium transition-colors
                      ${values.status === s.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={s.id}
                      checked={values.status === s.id}
                      onChange={() => set('status', s.id)}
                      className="sr-only"
                    />
                    <span className={`w-2 h-2 rounded-full ${s.id === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {s.label}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-slate-50 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button
              id="cancel-btn"
              type="button"
              variant="secondary"
              onClick={() => navigate('/campaigns')}
            >
              Cancel
            </Button>
            <Button
              id="create-campaign-submit-btn"
              type="submit"
              variant="primary"
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              Create Campaign
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
