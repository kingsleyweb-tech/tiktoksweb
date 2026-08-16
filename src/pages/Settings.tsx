import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutAdmin } from '../services/authService';
import { getEmailConfig, getEmailStatus } from '../services/deliveryService';

type SettingToggle = {
  id: string;
  label: string;
  description: string;
  value: boolean;
};

export default function Settings() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    displayName: 'Admin User',
    email: 'admin@cybermonitor.gh',
    organisation: 'CyberMonitor GH',
  });

  const [smsSenderId, setSmsSenderId] = useState(
    localStorage.getItem('cybermonitor_sms_sender_id') || 'SecureOpps'
  );

  const [emailConfig, setEmailConfig] = useState<{
    tiktok: { displayName: string; email: string; configured: boolean };
    snapchat: { displayName: string; email: string; configured: boolean };
  } | null>(null);

  const [emailStatus, setEmailStatus] = useState<{
    tiktok: { status: string; error?: string };
    snapchat: { status: string; error?: string };
  } | null>(null);

  const [checkingStatus, setCheckingStatus] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testPlatform, setTestPlatform] = useState<'tiktok' | 'snapchat'>('snapchat');
  const [testState, setTestState] = useState<{ loading: boolean; result: string | null; ok: boolean | null }>({
    loading: false, result: null, ok: null
  });

  useEffect(() => {
    fetchEmailSettings();
  }, []);

  const fetchEmailSettings = async () => {
    setCheckingStatus(true);
    try {
      const [config, status] = await Promise.all([
        getEmailConfig(),
        getEmailStatus()
      ]);
      setEmailConfig(config);
      setEmailStatus(status);
    } catch (err) {
      console.error('[Settings] Error loading email credentials/status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const sendTestEmail = async () => {
    const email = testRecipient.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setTestState({ loading: false, result: 'Enter a valid email address first.', ok: false });
      return;
    }
    setTestState({ loading: true, result: null, ok: null });
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testRecipient: email, platform: testPlatform }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestState({ loading: false, result: `✓ Test email sent! Check your inbox at ${email}.`, ok: true });
      } else {
        setTestState({ loading: false, result: data.error || 'Unknown error.', ok: false });
      }
    } catch {
      setTestState({ loading: false, result: 'Network error — is the dev server running?', ok: false });
    }
  };

  const [toggles, setToggles] = useState<SettingToggle[]>([
    {
      id: 'sim-safety-banner',
      label: 'Show Safety Banner on Simulations',
      description: 'Displays the amber cybersecurity awareness header bar on all simulation pages.',
      value: true,
    },
    {
      id: 'admin-status-bar',
      label: 'Show Admin Status Bar on Simulations',
      description: 'Shows the dark "Simulation Environment Active" toolbar at the top of simulation pages.',
      value: true,
    },
    {
      id: 'event-logging',
      label: 'Enable Event Telemetry',
      description: 'Log safe, anonymous telemetry events (link_opened, simulation_attempt, etc.). No credentials are ever stored.',
      value: true,
    },
    {
      id: 'completion-screen',
      label: 'Show Educational Result Screen',
      description: 'After form submission in a simulation, redirect participant to the phishing awareness educational panel.',
      value: true,
    },
  ]);

  const flipToggle = (id: string) => {
    setToggles((t) => t.map((item) => item.id === id ? { ...item, value: !item.value } : item));
  };

  const handleSave = () => {
    localStorage.setItem('cybermonitor_sms_sender_id', smsSenderId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logoutAdmin();
    navigate('/login');
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your admin profile and platform configuration.
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">Admin Profile</h3>

        {['displayName', 'email', 'organisation'].map((field) => (
          <div key={field} className="space-y-1.5">
            <label htmlFor={`profile-${field}`} className="block text-sm font-medium text-slate-700 capitalize">
              {field === 'displayName' ? 'Display Name' : field === 'email' ? 'Email Address' : 'Organisation'}
            </label>
            <input
              id={`profile-${field}`}
              type={field === 'email' ? 'email' : 'text'}
              value={profile[field as keyof typeof profile]}
              onChange={(e) => setProfile((p) => ({ ...p, [field]: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}

        <button
          id="save-profile-btn"
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          {saved ? (
            <>
              <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </>
          ) : 'Save Profile'}
        </button>
      </div>

      {/* SMS Gateway Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">SMS Gateway Config</h3>
        <div className="space-y-1.5">
          <label htmlFor="settings-sms-sender-id" className="block text-sm font-medium text-slate-700">
            SMS Sender ID
          </label>
          <input
            id="settings-sms-sender-id"
            type="text"
            value={smsSenderId}
            onChange={(e) => setSmsSenderId(e.target.value)}
            placeholder="SecureOpps"
            className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[10px] text-slate-400">
            Configure the alphanumeric sender name used when sending links via the GOnlineSites API.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          {saved ? 'Saved!' : 'Save Gateway Config'}
        </button>
      </div>

      {/* Email SMTP Gateway Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-slate-700">Email Gateway Config (SMTP)</h3>
          <button
            onClick={fetchEmailSettings}
            disabled={checkingStatus}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
          >
            {checkingStatus ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-normal">
            SMTP credentials must be configured through backend environment variables on the server. Values are hidden from the browser for security.
          </p>

          {/* Shared SMTP Status */}
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Shared SMTP Account</span>
              {emailStatus?.tiktok.status === 'connected' ? (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              ) : emailStatus?.tiktok.status === 'disconnected' ? (
                <span
                  className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1"
                  title={emailStatus.tiktok.error}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Auth Failed
                </span>
              ) : emailStatus?.tiktok.status === 'not_configured' ? (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Not Configured
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Unknown
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-medium uppercase">Sender (TikTok)</p>
                <p className="text-xs font-semibold text-slate-800">Team TikTok</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-medium uppercase">Sender (Snapchat)</p>
                <p className="text-xs font-semibold text-slate-800">Team Snapchat</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-medium uppercase">SMTP Address (configured in .env)</p>
              <p className="text-xs font-mono text-slate-700 truncate">{emailConfig?.tiktok.email || 'Not set — fill SMTP_USER in .env'}</p>
            </div>

            {emailStatus?.tiktok.status === 'disconnected' && emailStatus.tiktok.error && (
              <p className="text-[10px] text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 leading-normal">
                {emailStatus.tiktok.error}
              </p>
            )}
            {emailStatus?.tiktok.status === 'not_configured' && (
              <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-normal">
                Fill in <code className="font-mono">SMTP_HOST</code>, <code className="font-mono">SMTP_USER</code>, and <code className="font-mono">SMTP_PASSWORD</code> in your <code className="font-mono">.env</code> file, then restart the dev server.
              </p>
            )}
          </div>

          {/* ── Test Email Connection ──────────────────────────────── */}
          <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/40 space-y-3">
            <h4 className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Test Email Connection
            </h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              Send a plain test message to verify the SMTP connection is working. Subject will be <em>"SMTP Test"</em>.
            </p>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-[11px] font-semibold text-slate-500 shrink-0">Test Identity:</label>
                <select
                  value={testPlatform}
                  onChange={(e) => setTestPlatform(e.target.value as any)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-slate-700 font-medium cursor-pointer"
                >
                  <option value="snapchat">Team Snapchat (teamsnapchatbusinessx@gmail.com)</option>
                  <option value="tiktok">Team TikTok (examsuite1@gmail.com)</option>
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  id="test-email-recipient"
                  type="email"
                  placeholder="Enter recipient email address"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendTestEmail()}
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                />
                <button
                  id="send-test-email-btn"
                  onClick={sendTestEmail}
                  disabled={testState.loading}
                  className="shrink-0 text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {testState.loading ? 'Sending…' : 'Send Test'}
                </button>
              </div>
            </div>
            {testState.result && (
              <p className={`text-[11px] font-medium rounded-lg px-3 py-2 leading-normal border ${
                testState.ok
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                  : 'text-rose-700 bg-rose-50 border-rose-100'
              }`}>
                {testState.result}
              </p>
            )}
          </div>

          <div className="border border-amber-100 rounded-xl p-4 bg-amber-50/50 space-y-2">
            <h4 className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Note on Sender Avatars / Profile Images
            </h4>
            <p className="text-[11px] text-slate-600 leading-normal">
              Email client avatars are controlled by the receiving and sending email hosts, not by the app. To configure a logo:
            </p>
            <ul className="list-disc list-inside text-[10px] text-slate-600 space-y-1">
              <li>Upload a profile picture in your Google account at <strong>myaccount.google.com</strong>.</li>
              <li>Or link the address to <strong>Gravatar</strong> (gravatar.com) using the TikTok/Snapchat logos.</li>
              <li>Or set up <strong>BIMI</strong> DNS records for your sender domain.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Simulation Settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">Simulation Settings</h3>

        <div className="space-y-4">
          {toggles.map((toggle) => (
            <div key={toggle.id} className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">{toggle.label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-normal">{toggle.description}</p>
              </div>
              <button
                id={`toggle-${toggle.id}`}
                onClick={() => flipToggle(toggle.id)}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${toggle.value ? 'bg-blue-600' : 'bg-slate-300'}`}
                role="switch"
                aria-checked={toggle.value}
                title={toggle.label}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${toggle.value ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">Security & Privacy</h3>

        <div className="space-y-2 text-xs text-slate-600 leading-normal">
          <p className="flex items-start gap-2">
            <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            No passwords or authentication tokens are ever stored in this platform.
          </p>
          <p className="flex items-start gap-2">
            <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Simulation events only record safe anonymous session IDs, campaign, and template references.
          </p>
          <p className="flex items-start gap-2">
            <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Firebase API keys are stored only as environment variables, never committed to version control.
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-6 space-y-3">
        <h3 className="text-sm font-semibold text-rose-700 border-b border-rose-100 pb-3">Account</h3>
        <p className="text-xs text-slate-500">Signing out will end your current admin session.</p>
        <button
          id="logout-btn"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 border border-rose-300 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-60"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {loggingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
}
