import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import nodemailer from 'nodemailer'
import * as admin from 'firebase-admin'
import { getAuth } from 'firebase-admin/auth'
import fs from 'fs'
import path from 'path'

// ── Firebase Admin SDK ────────────────────────────────────────────────────────
// Initialised lazily on first use so the dev server starts even when the
// service account is not yet configured.
let adminApp: admin.App | null = null;

function getAdminApp(env: Record<string, string>): admin.App {
  if (adminApp) return adminApp;

  // Check if already initialized globally (prevents duplicate app errors on HMR reload)
  const apps = admin.getApps();
  if (apps.length > 0 && apps[0]) {
    adminApp = apps[0];
    return adminApp;
  }

  // Option 1: Try to load 'service-account.json' directly from project root (zero-config helper)
  const localSaPath = path.resolve(process.cwd(), 'service-account.json');
  if (fs.existsSync(localSaPath)) {
    try {
      const sa = JSON.parse(fs.readFileSync(localSaPath, 'utf8'));
      adminApp = admin.initializeApp({ credential: admin.cert(sa) });
      return adminApp;
    } catch (err: any) {
      console.warn('[ViteConfig] Failed to load local service-account.json:', err.message);
    }
  }

  // Option 2: full service account JSON encoded as Base64 env var
  const saBase64 = env.FIREBASE_SERVICE_ACCOUNT_BASE64 || process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (saBase64) {
    const sa = JSON.parse(Buffer.from(saBase64, 'base64').toString('utf8'));
    adminApp = admin.initializeApp({ credential: admin.cert(sa) });
    return adminApp;
  }

  // Option 3: path to service-account JSON file
  const saPath = env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (saPath) {
    try {
      const absolutePath = path.resolve(process.cwd(), saPath);
      const sa = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
      adminApp = admin.initializeApp({ credential: admin.cert(sa) });
      return adminApp;
    } catch (err: any) {
      console.warn(`[ViteConfig] Failed to load service account from path "${saPath}":`, err.message);
    }
  }

  // Option 4: Application Default Credentials (e.g. gcloud auth login)
  try {
    adminApp = admin.initializeApp({ credential: admin.applicationDefault() });
    return adminApp;
  } catch {
    throw new Error(
      'Firebase Admin SDK is not configured.\n\n' +
      'To fix this, do either of the following:\n' +
      '1. Go to Firebase Console → Project Settings → Service accounts → click "Generate new private key".\n' +
      '   Download the JSON file, rename it to "service-account.json", and save it in the root directory of this project.\n' +
      '2. Base64-encode your service account JSON and set it as FIREBASE_SERVICE_ACCOUNT_BASE64 in your .env file.'
    );
  }
}


function setupSmsEndpoint(middlewares: any, env: Record<string, string>) {
  middlewares.use('/api/sms/send', (req: any, res: any) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', async () => {
      try {
        const { to, message } = JSON.parse(body);

        // Security check: validate phone number format (must start with + followed by 10-15 digits)
        const phoneRegex = /^\+[1-9]\d{9,14}$/;
        if (!to || !message) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Recipient phone number and message are required.' }));
          return;
        }

        if (!phoneRegex.test(to)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid phone number format. Please provide a valid international phone number (e.g., +233244000000).' }));
          return;
        }

        // Fetch credentials from loaded environment
        const apiKey = env.SMS_API_KEY || process.env.SMS_API_KEY;
        const senderId = env.SMS_SENDER_ID || process.env.SMS_SENDER_ID || '';

        if (!apiKey) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'SMS service configuration is missing on the server.' }));
          return;
        }

        // Build URL encoded request params
        const params = new URLSearchParams({
          action: 'send-sms',
          api_key: apiKey,
          to: to,
          from: senderId,
          sms: message
        });

        // Dispatch POST request to G Online Sites SMS API (using HTTPS)
        const apiResponse = await fetch('https://sms.gonlinesites.com/app/sms/api', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });

        if (!apiResponse.ok) {
          throw new Error(`SMS Gateway HTTP error: ${apiResponse.status}`);
        }

        const textResponse = await apiResponse.text();
        let apiData;
        try {
          apiData = JSON.parse(textResponse);
        } catch {
          throw new Error(`Failed to parse gateway response: ${textResponse.substring(0, 100)}`);
        }

        res.setHeader('Content-Type', 'application/json');

        if (apiData.code === 'OK') {
          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            messageId: apiData.message_id
          }));
        } else {
          // Map numeric/string error codes to user-friendly messages
          const errorCode = String(apiData.code);
          let userMessage = 'Failed to send SMS due to a gateway error.';

          switch (errorCode) {
            case '100':
              userMessage = 'Bad gateway request. Please verify the API configuration.';
              break;
            case '101':
              userMessage = 'Invalid gateway action configured.';
              break;
            case '102':
              userMessage = 'SMS gateway authentication failed. Please contact the administrator.';
              break;
            case '103':
              userMessage = 'The recipient phone number is invalid. Use international format (e.g. +233XXXXXXXXX).';
              break;
            case '104':
              userMessage = 'SMS coverage is not active or available for the destination network.';
              break;
            case '105':
              userMessage = 'SMS gateway balance is insufficient to send this message.';
              break;
            case '106':
              userMessage = 'The Sender ID is invalid or not registered/approved.';
              break;
            case '109':
              userMessage = 'The schedule time for the SMS is invalid.';
              break;
            case '111':
              userMessage = 'The message was flagged as spam by the SMS gateway filter.';
              break;
            default:
              if (apiData.message) {
                userMessage = apiData.message;
              }
              break;
          }

          res.statusCode = 400;
          res.end(JSON.stringify({
            success: false,
            error: userMessage
          }));
        }
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal server error processing the SMS delivery request.' }));
      }
    });
  });
}

// Rate limiting storage for email sending: client IP -> array of timestamps
const emailRateLimits = new Map<string, number[]>();

function checkEmailRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1-minute window
  const maxRequests = 5;      // max 5 requests per window

  let timestamps = emailRateLimits.get(ip) || [];
  timestamps = timestamps.filter(ts => now - ts < windowMs);
  if (timestamps.length >= maxRequests) return false;
  timestamps.push(now);
  emailRateLimits.set(ip, timestamps);
  return true;
}

/** Classify SMTP errors into safe, user-readable messages without leaking credentials */
function classifySmtpError(err: any): { statusCode: number; message: string } {
  const raw: string = (err?.message || err?.code || '').toLowerCase();
  if (raw.includes('invalid login') || raw.includes('badcredentials') || raw.includes('535') || raw.includes('username and password not accepted')) {
    return { statusCode: 401, message: 'SMTP authentication failed. Check that your Google App Password is correct and that 2-Step Verification is enabled on your Google account.' };
  }
  if (raw.includes('econnrefused') || raw.includes('etimedout') || raw.includes('enotfound')) {
    return { statusCode: 503, message: 'Cannot reach the SMTP server. Check SMTP_HOST and SMTP_PORT, and make sure port 465 (SSL) is not blocked by a firewall.' };
  }
  if (raw.includes('self signed') || raw.includes('unable to verify')) {
    return { statusCode: 502, message: 'TLS/SSL certificate error connecting to SMTP server.' };
  }
  return { statusCode: 500, message: 'Email sending failed. Check server logs for the non-sensitive diagnostic.' };
}

/** Build a nodemailer transport config.
 *  Tries platform-specific vars first (TIKTOK_SMTP_* / SNAPCHAT_SMTP_*),
 *  then falls back to the shared SMTP_* vars. */
function buildTransporter(env: Record<string, string>, platform?: string) {
  const pfx = platform ? `${platform.toUpperCase()}_SMTP` : null;

  const host = (pfx && (env[`${pfx}_HOST`] || process.env[`${pfx}_HOST`]))
    || env.SMTP_HOST || process.env.SMTP_HOST || '';
  const port = parseInt(
    (pfx && (env[`${pfx}_PORT`] || process.env[`${pfx}_PORT`]))
    || env.SMTP_PORT || process.env.SMTP_PORT || '465', 10);
  const user = (pfx && (env[`${pfx}_USER`] || process.env[`${pfx}_USER`]))
    || env.SMTP_USER || process.env.SMTP_USER || '';
  const pass = (pfx && (env[`${pfx}_PASSWORD`] || process.env[`${pfx}_PASSWORD`]))
    || env.SMTP_PASSWORD || process.env.SMTP_PASSWORD || '';

  return { host, port, user, pass, configured: !!(host && user && pass) };
}

function setupEmailEndpoint(middlewares: any, env: Record<string, string>) {
  // ── Run connection verification on startup for both platforms ─────────────
  for (const platform of ['tiktok', 'snapchat']) {
    const { host: h, port: p, user: u, pass: pw, configured: c } = buildTransporter(env, platform);
    if (c) {
      console.info(`[EmailService] Testing ${platform.toUpperCase()} SMTP with Host: ${h}, Port: ${p}, User: ${u}`);
      const transporter = nodemailer.createTransport({ host: h, port: p, secure: true, auth: { user: u, pass: pw } });
      transporter.verify().then(() => {
        console.info(`[EmailService] ✓ ${platform.toUpperCase()} SMTP connection verified. Ready to send from:`, u);
      }).catch((err: any) => {
        const { message } = classifySmtpError(err);
        console.warn(`[EmailService] ✗ ${platform.toUpperCase()} SMTP verification failed on startup:`, message);
        console.warn(`[EmailService]   Detail: ${err.message} | Code: ${err.code || 'n/a'} | Command: ${err.command || 'n/a'}`);
      });
    } else {
      console.warn(`[EmailService] ${platform.toUpperCase()} SMTP not configured in .env`);
    }
  }

  // ── GET /api/email/config ──────────────────────────────────────────────────
  // Returns safe, non-secret sender information to the frontend
  middlewares.use('/api/email/config', (req: any, res: any) => {
    if (req.method !== 'GET') {
      res.statusCode = 405; res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' })); return;
    }
    const tk = buildTransporter(env, 'tiktok');
    const sc = buildTransporter(env, 'snapchat');

    res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      tiktok:   { displayName: 'Team TikTok',   email: tk.user, configured: tk.configured, smtpHost: tk.host },
      snapchat: { displayName: 'Team Snapchat', email: sc.user, configured: sc.configured, smtpHost: sc.host },
    }));
  });

  // ── GET /api/email/status ──────────────────────────────────────────────────
  // Runs a live SMTP verify() and returns connection health
  middlewares.use('/api/email/status', async (req: any, res: any) => {
    if (req.method !== 'GET') {
      res.statusCode = 405; res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' })); return;
    }
    const checkPlatform = async (platform: string) => {
      const { host: h, port: p, user: u, pass: pw, configured: c } = buildTransporter(env, platform);
      if (!c) {
        return { status: 'not_configured', error: `Missing ${platform.toUpperCase()} configuration variables in .env` };
      }
      try {
        const transporter = nodemailer.createTransport({ host: h, port: p, secure: true, auth: { user: u, pass: pw }, connectionTimeout: 6000 });
        await transporter.verify();
        return { status: 'connected' };
      } catch (err: any) {
        const { message } = classifySmtpError(err);
        return { status: 'disconnected', error: message };
      }
    };

    try {
      const [tiktokStatus, snapchatStatus] = await Promise.all([
        checkPlatform('tiktok'),
        checkPlatform('snapchat')
      ]);
      res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ tiktok: tiktokStatus, snapchat: snapchatStatus }));
    } catch (e) {
      res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal server error checking connection status.' }));
    }
  });

  // ── POST /api/email/test ───────────────────────────────────────────────────
  // Development-only endpoint: sends a plain test email
  middlewares.use('/api/email/test', (req: any, res: any) => {
    if (req.method !== 'POST') {
      res.statusCode = 405; res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' })); return;
    }
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', async () => {
      try {
        const { testRecipient, platform } = JSON.parse(body);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!testRecipient || !emailRegex.test(testRecipient)) {
          res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'A valid testRecipient email address is required.' })); return;
        }
        
        const platformKey = platform === 'tiktok' ? 'tiktok' : 'snapchat';
        const displayName = platformKey === 'tiktok' ? 'Team TikTok' : 'Team Snapchat';

        // Test using specific platform SMTP configuration
        const { host: h, port: p, user: u, pass: pw, configured: c } = buildTransporter(env, platformKey);
        if (!c) {
          res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `${displayName} SMTP not configured in .env. Please configure and restart the server.` })); return;
        }
        const transporter = nodemailer.createTransport({ host: h, port: p, secure: true, auth: { user: u, pass: pw } });
        const info = await transporter.sendMail({
          from: `"${displayName} Test" <${u}>`,
          to: testRecipient,
          subject: 'SMTP Test',
          text: `This is a test email from the application. The Gmail SMTP connection for ${displayName} is working correctly.`,
        });
        console.info(`[EmailService] ${displayName} Test email sent to:`, testRecipient, '| messageId:', info.messageId);
        res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, messageId: info.messageId }));
      } catch (err: any) {
        const { statusCode, message } = classifySmtpError(err);
        console.error('[EmailService] Test email failed:', message);
        res.statusCode = statusCode; res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: message }));
      }
    });
  });

  // ── POST /api/email/send ───────────────────────────────────────────────────
  middlewares.use('/api/email/send', (req: any, res: any) => {
    if (req.method !== 'POST') {
      res.statusCode = 405; res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' })); return;
    }
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    if (!checkEmailRateLimit(clientIp)) {
      res.statusCode = 429; res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Rate limit exceeded. Max 5 emails per minute.' })); return;
    }
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', async () => {
      try {
        const { campaignId, recipient, subject, message, templateId } = JSON.parse(body);

        // Validate all required fields
        if (!campaignId || !recipient || !subject || !message || !templateId) {
          res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Fields campaignId, recipient, subject, message, templateId are all required.' })); return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipient)) {
          res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid recipient email address format.' })); return;
        }
        if (/[\r\n]/.test(subject)) {
          res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Subject contains invalid characters.' })); return;
        }

        // Determine which platform credentials to load based on template
        let displayName = 'Security Awareness Training';
        let platformKey = '';
        if (templateId.includes('tiktok')) {
          displayName = 'Team TikTok';
          platformKey = 'tiktok';
        } else if (templateId.includes('snapchat')) {
          displayName = 'Team Snapchat';
          platformKey = 'snapchat';
        } else if (templateId.includes('facebook')) {
          displayName = 'Team Facebook';
          platformKey = 'snapchat'; // Fallback
        }

        const { host: h, port: p, user: u, pass: pw, configured: c } = buildTransporter(env, platformKey);
        if (!c) {
          res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `SMTP server configuration for ${displayName} is incomplete.` })); return;
        }

        const convertMarkdownToHtml = (text: string) => {
          let html = text.replace(/\n/g, '<br/>');
          html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" style="color: #2563eb; font-weight: 600; text-decoration: underline;">$1</a>');
          return html;
        };

        const transporter = nodemailer.createTransport({ host: h, port: p, secure: true, auth: { user: u, pass: pw } });
        const info = await transporter.sendMail({
          from: `"${displayName}" <${u}>`,
          to: recipient,
          subject,
          text: message, // Plain text fallback
          html: convertMarkdownToHtml(message), // Rich HTML body
        });

        // Safe log — no password, partially masked recipient
        console.info('[EmailService] Email sent:', {
          campaignId,
          recipient: recipient.replace(/./g, (c: string, i: number) => (i < 3 || c === '@' ? c : '*')),
          displayName,
          messageId: info.messageId,
        });

        res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, messageId: info.messageId }));
      } catch (err: any) {
        const { statusCode, message } = classifySmtpError(err);
        console.error('[EmailService] Send failed:', message);
        res.statusCode = statusCode; res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: message }));
      }
    });
  });
}

// ── Auth API endpoints ────────────────────────────────────────────────────────
function setupAuthEndpoints(middlewares: any, env: Record<string, string>) {

  // POST /api/auth/send-reset-otp
  // Sends a 6-digit OTP code to the given email via SMTP.
  middlewares.use('/api/auth/send-reset-otp', (req: any, res: any) => {
    if (req.method !== 'POST') {
      res.statusCode = 405; res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' })); return;
    }
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', async () => {
      try {
        const { email, code } = JSON.parse(body);
        if (!email || !code) {
          res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'email and code are required.' })); return;
        }

        // Use whichever SMTP creds are configured (prefer tiktok, fall back to snapchat)
        const tk = buildTransporter(env, 'tiktok');
        const sc = buildTransporter(env, 'snapchat');
        const { host: h, port: p, user: u, pass: pw, configured: c } = tk.configured ? tk : sc;
        if (!c) {
          res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'SMTP is not configured. Add SMTP credentials to .env to send OTP emails.' })); return;
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
        res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
      } catch (err: any) {
        const { statusCode, message } = classifySmtpError(err);
        console.error('[AuthService] OTP email failed:', message);
        res.statusCode = statusCode; res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: message }));
      }
    });
  });

  // POST /api/auth/reset-password
  // Uses Firebase Admin SDK to update the user's password.
  // Requires OTP verification to have already been completed on the frontend.
  middlewares.use('/api/auth/reset-password', (req: any, res: any) => {
    if (req.method !== 'POST') {
      res.statusCode = 405; res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' })); return;
    }
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', async () => {
      try {
        const { email, newPassword, resetToken } = JSON.parse(body);
        if (!email || !newPassword || !resetToken) {
          res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'email, newPassword, and resetToken are required.' })); return;
        }
        if (newPassword.length < 8) {
          res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Password must be at least 8 characters.' })); return;
        }
        // Validate the reset token (it must decode to the correct email)
        let tokenEmail: string;
        try {
          tokenEmail = Buffer.from(resetToken, 'base64').toString('utf8').split(':')[0];
        } catch {
          res.statusCode = 400; res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid reset token.' })); return;
        }
        if (tokenEmail.toLowerCase() !== email.toLowerCase()) {
          res.statusCode = 403; res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Reset token does not match the provided email.' })); return;
        }

        try {
          const app = getAdminApp(env);
          const auth = getAuth(app);
          const userRecord = await auth.getUserByEmail(email);
          await auth.updateUser(userRecord.uid, { password: newPassword });
          console.info('[AuthService] Password updated for:', email.replace(/./g, (c: string, i: number) => (i < 3 || c === '@' ? c : '*')));
          res.statusCode = 200; res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (adminErr: any) {
          console.error('[AuthService] Firebase Admin error:', adminErr.message);
          res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
          // Return the exact error message so that the developer gets direct debug visibility
          res.end(JSON.stringify({ error: adminErr.message }));
        }
      } catch (err: any) {
        console.error('[AuthService] reset-password error:', err);
        res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal server error.' }));
      }
    });
  });
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-backend-proxy',
        configureServer(server) {
          setupSmsEndpoint(server.middlewares, env);
          setupEmailEndpoint(server.middlewares, env);
          setupAuthEndpoints(server.middlewares, env);
        },
        configurePreviewServer(server) {
          setupSmsEndpoint(server.middlewares, env);
          setupEmailEndpoint(server.middlewares, env);
          setupAuthEndpoints(server.middlewares, env);
        }
      }
    ],
  }
})

