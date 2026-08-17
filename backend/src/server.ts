import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// Also load from current folder .env if it exists
dotenv.config();

import emailRoutes from './routes/emailRoutes';
import smsRoutes from './routes/smsRoutes';
import authRoutes from './routes/authRoutes';
import { verifyAllSmtpOnStartup } from './services/emailService';

const app = express();
const port = process.env.PORT || 5000;

// Configure CORS
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed origin, localhost, vercel.app or netlify.app
    if (
      origin === allowedOrigin || 
      origin === 'http://localhost:5173' ||
      /\.vercel\.app$/.test(origin) ||
      /\.netlify\.app$/.test(origin) ||
      /^https?:\/\/localhost:\d+$/.test(origin)
    ) {
      return callback(null, true);
    }
    
    console.warn(`[CORS] Request from blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));

app.use(express.json());

// API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mount Routes
app.use('/api/email', emailRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/auth', authRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ServerError] Global error handler caught error:', err.message || err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred on the backend.'
  });
});

// Run SMTP transporter tests on startup
verifyAllSmtpOnStartup();

// Only listen locally, Vercel hosts the app serverless
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.info(`[Server] Phishing Awareness Backend listening on port ${port}`);
    console.info(`[Server] CORS configured to accept requests from: ${allowedOrigin}`);

    // Keep-alive: ping own health endpoint every 14 minutes to prevent
    // Render free-tier from spinning down (it sleeps after 15 min of inactivity).
    const selfUrl = process.env.RENDER_EXTERNAL_URL
      ? `${process.env.RENDER_EXTERNAL_URL}/api/health`
      : null;

    if (selfUrl) {
      setInterval(() => {
        fetch(selfUrl)
          .then(() => console.info('[KeepAlive] Self-ping OK'))
          .catch((err: any) => console.warn('[KeepAlive] Self-ping failed:', err.message));
      }, 14 * 60 * 1000); // every 14 minutes
      console.info(`[KeepAlive] Self-ping scheduled every 14 min → ${selfUrl}`);
    }
  });
}

export default app;
