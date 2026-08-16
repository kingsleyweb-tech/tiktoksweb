import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';

// ── Firebase configuration ────────────────────────────────────────
// All values are loaded exclusively from Vite environment variables.
// Never hard-code credentials here. Fill in .env.local (git-ignored).
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             as string,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     as string | undefined,
};

// ── Guard: warn clearly in the console if env vars are missing ────
const missingKeys = Object.entries(firebaseConfig)
  .filter(([key, val]) => key !== 'measurementId' && !val)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.warn(
    '[Firebase] The following environment variables are not set:\n' +
    missingKeys.map((k) => `  • VITE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`).join('\n') +
    '\nFill in .env.local and restart the dev server.'
  );
}

// ── Initialize Firebase (once) ────────────────────────────────────
// getApps() prevents duplicate initialization during HMR reloads.
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ── Service exports ───────────────────────────────────────────────
export const auth: Auth            = getAuth(app);
export const db:   Firestore       = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// ── Convenience flag for feature-gating ──────────────────────────
// True only when all required env vars are present and non-empty.
export const isFirebaseConfigured: boolean = missingKeys.length === 0;

export default app;
