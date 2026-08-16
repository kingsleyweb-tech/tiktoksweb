import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { verifyResetCode } from '../services/passwordResetService';

export default function VerifyResetCode() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem('pr_email') || '';
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown for resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setInterval(() => setResendCountdown((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [resendCountdown]);

  // Redirect if no email in session
  useEffect(() => {
    if (!email) navigate('/forgot-password', { replace: true });
  }, [email, navigate]);

  const handleDigit = (i: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError('');
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const valid = await verifyResetCode(email, code);
      if (!valid) {
        setError('Invalid or expired code. Please check the code and try again, or request a new one.');
        setLoading(false);
        return;
      }
      // OTP verified — store a short-lived reset token for the next step
      const resetToken = btoa(email + ':' + Date.now());
      sessionStorage.setItem('pr_token', resetToken);
      navigate('/reset-password');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <Link to="/forgot-password" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mb-6 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Enter Verification Code</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Code sent to <span className="font-semibold text-slate-700">{email}</span>
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-6">
          Enter the 6-digit code from your email. The code expires in <strong>10 minutes</strong>.
        </p>

        <form onSubmit={handleVerify} className="space-y-6" noValidate>
          <div className="flex gap-2 justify-between" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                id={`otp-digit-${i}`}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none
                  ${d ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-300 bg-white text-slate-800'}
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-100`}
              />
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          <button
            id="verify-code-btn"
            type="submit"
            disabled={loading || digits.join('').length < 6}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            {loading ? 'Verifying…' : 'Verify & Send Reset Link'}
          </button>
        </form>

        <div className="mt-5 text-center">
          {resendCountdown > 0 ? (
            <p className="text-xs text-slate-400">
              Resend available in <span className="font-semibold text-slate-600">{resendCountdown}s</span>
            </p>
          ) : (
            <Link
              to="/forgot-password"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Resend verification code →
            </Link>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
