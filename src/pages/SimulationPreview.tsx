import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTemplateBySlug } from '../services/templateService';
import PlatformIcon from '../components/PlatformIcon';
import Button from '../components/Button';

// Mockup styling and settings
const platformBg: Record<string, string> = {
  Facebook: 'bg-blue-600',
  TikTok:   'bg-slate-900',
  Snapchat: 'bg-yellow-400',
  Gmail:    'bg-white',
};

const platformText: Record<string, string> = {
  Facebook: 'text-white',
  TikTok:   'text-white',
  Snapchat: 'text-slate-900',
  Gmail:    'text-slate-800',
};

export default function SimulationPreview() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const template = templateId ? getTemplateBySlug(templateId) : undefined;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showOutcome, setShowOutcome] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  if (!template) {
    return (
      <div className="p-6 text-center max-w-md mx-auto mt-12 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800">Template Not Found</h3>
        <p className="text-slate-500 text-sm mt-2">The requested template slug "{templateId}" could not be loaded.</p>
        <Button variant="primary" className="mt-4" onClick={() => navigate('/templates')}>
          Back to Templates
        </Button>
      </div>
    );
  }

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Log the simulation attempt event safely (discarding credentials)
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [
      `[${timestamp}] EVENT LOGGED: simulation_attempt`,
      `[${timestamp}] INFO: Input submitted - Username: "${username}", Password length: ${password.length} (Password value discarded safely)`,
      ...prev,
    ]);

    // Show educational outcome screen
    setShowOutcome(true);
    // Clear credentials safely
    setUsername('');
    setPassword('');
  };

  const resetSimulation = () => {
    setShowOutcome(false);
    setUsername('');
    setPassword('');
  };

  const bg = platformBg[template.platform] ?? 'bg-slate-100';
  const text = platformText[template.platform] ?? 'text-slate-800';

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Admin Review Header Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-bold text-amber-800">Admin Simulation Preview</h3>
            <p className="text-xs text-amber-700 mt-0.5">
              This is a secure training mockup of the <strong>{template.name}</strong> landing page.
              Enter credentials below to test the educational redirect flow safely.
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => navigate('/templates')}>
            Back to Templates
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate(`/campaigns/create?template=${template.slug}`)}>
            Use Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left/Middle Column: Simulation Layout */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-200 rounded-t-xl px-4 py-2 border border-slate-300 border-b-0 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">User Facing Viewport</span>
            <div className="w-3 h-3 rounded-full bg-slate-400" />
          </div>

          <div className="border border-slate-300 bg-slate-100 rounded-b-xl p-4 sm:p-8 flex justify-center min-h-[500px] items-center">
            {!showOutcome ? (
              /* Simulation Form Card */
              <div className="bg-white rounded-xl border border-slate-200 shadow-md w-full max-w-md overflow-hidden">
                {/* Platform Header */}
                <div className={`${bg} px-6 py-8 text-center`}>
                  <div className={`flex justify-center mb-2 ${template.iconColor}`}>
                    <PlatformIcon platform={template.platform} className="w-12 h-12" />
                  </div>
                  <p className={`text-xl font-bold ${text}`}>{template.platform}</p>
                </div>

                {/* Form area */}
                <form onSubmit={handleSimulateSubmit} className="p-6 space-y-4">
                  <div className="text-center">
                    <p className="text-xs font-bold text-blue-600 tracking-wider uppercase">Cybersecurity Awareness Simulation</p>
                    <p className="text-sm text-slate-500 mt-1">Sign in with your social account to verify identity</p>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder={`Email address or phone number`}
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full text-center py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                    style={{ backgroundColor: template.brandColor === '#FFFC00' ? '#d97706' : template.brandColor }}
                  >
                    Continue to platform
                  </button>

                  <p className="text-center text-[10px] text-slate-400">
                    Your organisation tests your security awareness. No data is stored.
                  </p>
                </form>
              </div>
            ) : (
              /* Educational Redirect Screen */
              <div className="bg-white rounded-xl border border-slate-200 shadow-md w-full max-w-lg p-6 text-center space-y-5">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-800">It's a Phishing Awareness Test!</h3>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto">
                    Had this been a real attack, your credentials would have been stolen.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left text-xs text-slate-600 space-y-2.5">
                  <p className="font-bold text-slate-700">What went wrong?</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>The domain name (in the browser bar above) was not the official site's domain.</li>
                    <li>The login request came from an unexpected source (e.g. unsolicited link).</li>
                    <li>Always verify double authentication requirements via original apps directly.</li>
                  </ul>
                </div>

                <div className="flex gap-2 justify-center">
                  <Button variant="secondary" onClick={resetSimulation}>
                    Try Again
                  </Button>
                  <Button variant="primary" onClick={() => navigate('/templates')}>
                    Finish Preview
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Simulation Controller & Logs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Simulation Controls</h3>
            <p className="text-xs text-slate-400 mt-0.5">Control and verify simulated telemetry events.</p>
          </div>

          {/* Direct trigger simulation_attempt event */}
          <Button
            variant="secondary"
            className="w-full justify-center text-xs"
            onClick={() => {
              const timestamp = new Date().toLocaleTimeString();
              setLogs((prev) => [`[${timestamp}] EVENT LOGGED: simulation_attempt (Direct trigger)`, ...prev]);
            }}
          >
            Trigger Safe Attempt Event
          </Button>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Preview Event Log</label>
            <div className="bg-slate-900 text-slate-300 font-mono text-[10px] rounded-lg p-3 h-56 overflow-y-auto space-y-1.5 leading-normal">
              {logs.length === 0 ? (
                <span className="text-slate-500 italic">No events triggered yet. Interact with the form mockup on the left or click trigger.</span>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className={log.includes('EVENT LOGGED') ? 'text-emerald-400 font-semibold' : ''}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
