import type { SimulationTemplate } from '../types/template';

interface SimulationResultProps {
  template: SimulationTemplate;
}

export default function SimulationResult({ template }: SimulationResultProps) {
  return (
    <div className="min-h-screen w-full bg-[#f0f2f5] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md w-full max-w-lg p-6 sm:p-8 text-center space-y-6">
        {/* Warning icon */}
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto shadow-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">This was a Phishing Simulation</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            You entered credentials on a simulated page. If this were a real attack, your account could have been compromised.
          </p>
        </div>

        {/* Key indicators */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs text-slate-600 space-y-3">
          <p className="font-bold text-slate-700 text-sm">Key Indicators to Spot this Attack:</p>
          <ul className="space-y-2 list-disc pl-4 leading-normal">
            <li>
              <strong className="text-slate-700">Check the URL:</strong> Phishing sites impersonating <span className="font-semibold">{template.platform}</span> will use domains that look slightly wrong (e.g. facebook-security-check.com instead of facebook.com).
            </li>
            <li>
              <strong className="text-slate-700">Unsolicited Prompts:</strong> Be highly suspicious of links sent via SMS or unexpected emails claiming your account is "suspended" or "needs verification".
            </li>
            <li>
              <strong className="text-slate-700">Login Portals:</strong> Always navigate to the official website directly by typing the address or using the official mobile app.
            </li>
          </ul>
        </div>

        {/* Password safety notice */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
          <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-left font-medium">
            <strong>Your password was NOT collected.</strong> Only a safe simulation event was registered. Your input was discarded immediately.
          </p>
        </div>

        <div className="text-xs text-slate-400">
          Thank you for completing this security drill. You may close this browser tab.
        </div>
      </div>
    </div>
  );
}
