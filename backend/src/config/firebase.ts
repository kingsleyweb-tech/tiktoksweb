import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let adminApp: App | null = null;

export function getAdminApp(): App {
  if (adminApp) return adminApp;

  // Check if already initialized globally
  const apps = getApps();
  if (apps.length > 0 && apps[0]) {
    adminApp = apps[0];
    return adminApp;
  }

  // Option 1: Try to load 'service-account.json' directly from project root (zero-config helper)
  const pathsToTry = [
    path.resolve(process.cwd(), 'service-account.json'),
    path.resolve(process.cwd(), 'backend', 'service-account.json'),
    path.resolve(__dirname, '..', '..', 'service-account.json'),
  ];

  for (const localSaPath of pathsToTry) {
    if (fs.existsSync(localSaPath)) {
      try {
        const sa = JSON.parse(fs.readFileSync(localSaPath, 'utf8'));
        adminApp = initializeApp({ credential: credential.cert(sa) });
        console.info(`[FirebaseConfig] Firebase Admin initialized using service-account from: ${localSaPath}`);
        return adminApp;
      } catch (err: any) {
        console.warn(`[FirebaseConfig] Failed to load service-account.json at ${localSaPath}:`, err.message);
      }
    }
  }

  // Option 2: full service account JSON encoded as Base64 env var
  const saBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (saBase64) {
    try {
      const sa = JSON.parse(Buffer.from(saBase64, 'base64').toString('utf8'));
      adminApp = initializeApp({ credential: credential.cert(sa) });
      console.info('[FirebaseConfig] Firebase Admin initialized using FIREBASE_SERVICE_ACCOUNT_BASE64');
      return adminApp;
    } catch (err: any) {
      console.warn('[FirebaseConfig] Failed to initialize via Base64 env var:', err.message);
    }
  }

  // Option 3: path to service-account JSON file
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (saPath) {
    try {
      const absolutePath = path.resolve(process.cwd(), saPath);
      const sa = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
      adminApp = initializeApp({ credential: credential.cert(sa) });
      console.info(`[FirebaseConfig] Firebase Admin initialized using path: ${absolutePath}`);
      return adminApp;
    } catch (err: any) {
      console.warn(`[FirebaseConfig] Failed to load service account from path "${saPath}":`, err.message);
    }
  }

  // Option 4: Try env credentials directly if provided separately
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    try {
      // Handle escaped newlines in private key
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
      adminApp = initializeApp({
        credential: credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
      });
      console.info('[FirebaseConfig] Firebase Admin initialized using separate env credentials');
      return adminApp;
    } catch (err: any) {
      console.warn('[FirebaseConfig] Failed to initialize via separate credentials:', err.message);
    }
  }

  // Option 5: Application Default Credentials
  try {
    adminApp = initializeApp();
    console.info('[FirebaseConfig] Firebase Admin initialized via Application Default Credentials');
    return adminApp;
  } catch (err: any) {
    console.warn('[FirebaseConfig] Application Default Credentials initialization failed:', err.message);
    throw new Error(
      'Firebase Admin SDK is not configured.\n\n' +
      'To fix this, do either of the following:\n' +
      '1. Download your service account JSON file, rename it to "service-account.json", and save it in backend/ directory.\n' +
      '2. Base64-encode your service account JSON and set it as FIREBASE_SERVICE_ACCOUNT_BASE64 in your .env file.\n' +
      '3. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env file.'
    );
  }
}

export function getFirebaseAuth(): Auth {
  const app = getAdminApp();
  return getAuth(app);
}
