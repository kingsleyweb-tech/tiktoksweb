import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { getFirebaseAuth } from '../config/firebase';
import { buildTransporter, classifySmtpError } from '../services/emailService';

const router = Router();

// POST /api/auth/send-reset-otp
router.post('/send-reset-otp', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ error: 'email and code are required.' });
      return;
    }

    // Restrict reset verification code to kingsleyanaab604@gmail.com
    if (email.toLowerCase().trim() !== 'kingsleyanaab604@gmail.com') {
      res.status(403).json({ error: 'Unauthorized: Resetting password is only allowed for the primary administrator account (kingsleyanaab604@gmail.com).' });
      return;
    }

    // Use whichever SMTP creds are configured (prefer tiktok, fall back to snapchat)
    const tk = buildTransporter('tiktok');
    const sc = buildTransporter('snapchat');
    const { host: h, port: p, user: u, pass: pw, configured: c } = tk.configured ? tk : sc;
    if (!c) {
      res.status(500).json({ error: 'SMTP is not configured. Add SMTP credentials to env to send OTP emails.' });
      return;
    }

    const transporter = nodemailer.createTransport({ host: h, port: p, secure: true, auth: { user: u, pass: pw } });
    await transporter.sendMail({
      from: `"CyberMonitor GH Security" <${u}>`,
      to: email,
      subject: 'Your Password Reset Verification Code',
      text: `Your CyberMonitor GH password reset code is: ${code}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;background:#f8fafc;border-radius:12px;padding:32px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="width:48px;height:48px;border-radius:12px;background:#1d4ed8;display:inline-flex;align-items:center;justify-content:center;">
              <span style="font-size:24px;">🔒</span>
            </div>
          </div>
          <h2 style="color:#0f172a;font-size:18px;font-weight:700;text-align:center;margin:0 0 8px;">Password Reset Code</h2>
          <p style="color:#64748b;font-size:14px;text-align:center;margin:0 0 28px;">Enter this code in the CyberMonitor GH app to verify your identity.</p>
          <div style="background:#fff;border:2px solid #e2e8f0;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
            <span style="font-family:monospace;font-size:36px;font-weight:800;letter-spacing:10px;color:#1d4ed8;">${code}</span>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">⏱ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
          <p style="color:#94a3b8;font-size:11px;text-align:center;margin:0;">If you did not request a password reset, please ignore this email or contact your administrator.</p>
        </div>`,
    });

    console.info('[AuthService] OTP email sent to:', email.replace(/./g, (c: string, i: number) => (i < 3 || c === '@' ? c : '*')));
    res.status(200).json({ success: true });
  } catch (err: any) {
    const { statusCode, message } = classifySmtpError(err);
    console.error('[AuthService] OTP email failed:', message);
    res.status(statusCode).json({ error: message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, newPassword, resetToken } = req.body;
    if (!email || !newPassword || !resetToken) {
      res.status(400).json({ error: 'email, newPassword, and resetToken are required.' });
      return;
    }

    // Restrict reset password to kingsleyanaab604@gmail.com
    if (email.toLowerCase().trim() !== 'kingsleyanaab604@gmail.com') {
      res.status(403).json({ error: 'Unauthorized: Resetting password is only allowed for the primary administrator account (kingsleyanaab604@gmail.com).' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters.' });
      return;
    }
    // Validate the reset token
    let tokenEmail: string;
    try {
      tokenEmail = Buffer.from(resetToken, 'base64').toString('utf8').split(':')[0];
    } catch {
      res.status(400).json({ error: 'Invalid reset token.' });
      return;
    }
    if (tokenEmail.toLowerCase() !== email.toLowerCase()) {
      res.status(403).json({ error: 'Reset token does not match the provided email.' });
      return;
    }

    try {
      const auth = getFirebaseAuth();
      const userRecord = await auth.getUserByEmail(email);
      await auth.updateUser(userRecord.uid, { password: newPassword });
      console.info('[AuthService] Password updated for:', email.replace(/./g, (c: string, i: number) => (i < 3 || c === '@' ? c : '*')));
      res.status(200).json({ success: true });
    } catch (adminErr: any) {
      console.error('[AuthService] Firebase Admin error:', adminErr.message);
      let errMsg = adminErr.message;
      if (
        adminErr.message.includes('Project Id') || 
        adminErr.message.includes('credential') || 
        adminErr.message.includes('projectId') || 
        adminErr.message.includes('metadata server')
      ) {
        errMsg = 'Firebase Admin credentials are not set or incorrect in the backend environment. ' +
                 'Please ensure you have configured FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY ' +
                 'in your environment variables (e.g. Vercel dashboard).';
      }
      res.status(500).json({ error: errMsg });
    }
  } catch (err: any) {
    console.error('[AuthService] reset-password error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
