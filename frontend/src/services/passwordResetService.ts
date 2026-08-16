import {
  collection, addDoc, query, where, getDocs,
  updateDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import {
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { db, auth, isFirebaseConfigured } from './firebase';
import { API_BASE_URL } from './api';

const COLLECTION = 'password_resets';
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/** SHA-256 hash using the browser's Web Crypto API. */
async function sha256(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Generate a cryptographically random 6-digit numeric code. */
export function generateOtpCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(100000 + (array[0] % 900000));
}

/** Store a hashed OTP in Firestore (or sessionStorage fallback) for the given email. */
export async function storeResetCode(email: string, plainCode: string): Promise<void> {
  const normalised = email.toLowerCase().trim();
  const codeHash = await sha256(plainCode + normalised); // salted with email
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS).toISOString();

  if (isFirebaseConfigured) {
    // Invalidate all existing unused codes for this email
    const existing = await getDocs(
      query(collection(db, COLLECTION), where('email', '==', normalised), where('used', '==', false))
    );
    await Promise.all(
      existing.docs.map((d) => updateDoc(doc(db, COLLECTION, d.id), { used: true }))
    );

    await addDoc(collection(db, COLLECTION), {
      email: normalised,
      codeHash,
      expiresAt,
      used: false,
      createdAt: serverTimestamp(),
    });
  } else {
    // Local fallback when Firestore is not active
    sessionStorage.setItem(
      'cybermonitor_reset_code',
      JSON.stringify({ email: normalised, codeHash, expiresAt, used: false })
    );
  }
}

/** Verify a plain OTP against the stored hash. Marks the code as used on success. */
export async function verifyResetCode(email: string, plainCode: string): Promise<boolean> {
  const normalised = email.toLowerCase().trim();
  const candidateHash = await sha256(plainCode + normalised);

  if (isFirebaseConfigured) {
    const snap = await getDocs(
      query(
        collection(db, COLLECTION),
        where('email', '==', normalised),
        where('used', '==', false),
      )
    );
    for (const d of snap.docs) {
      const data = d.data();
      if (data.codeHash !== candidateHash) continue;
      if (new Date(data.expiresAt).getTime() < Date.now()) continue;
      await updateDoc(doc(db, COLLECTION, d.id), { used: true });
      return true;
    }
    return false;
  } else {
    const raw = sessionStorage.getItem('cybermonitor_reset_code');
    if (!raw) return false;
    const record = JSON.parse(raw);
    if (record.email !== normalised) return false;
    if (record.used) return false;
    if (new Date(record.expiresAt).getTime() < Date.now()) return false;
    if (record.codeHash !== candidateHash) return false;
    record.used = true;
    sessionStorage.setItem('cybermonitor_reset_code', JSON.stringify(record));
    return true;
  }
}

/** Send the 6-digit OTP to the user's email via the SMTP backend. */
export async function sendResetCodeEmail(email: string, code: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/auth/send-reset-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to send reset code.' }));
    throw new Error(err.error || 'Failed to send reset code.');
  }
}

/** Call backend API to reset password or fallback to local storage if Firebase is offline/not configured. */
export async function resetPasswordViaBackend(
  email: string,
  newPassword: string,
  resetToken: string,
): Promise<void> {
  if (!isFirebaseConfigured) {
    // Local mock mode: Save password in localStorage override
    localStorage.setItem('cybermonitor_local_password', newPassword);
    return;
  }

  const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword, resetToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Password reset failed.' }));
    throw new Error(err.error || 'Password reset failed.');
  }
}

/**
 * After OTP verification succeeds, send a Firebase password reset link.
 * The link will redirect the user to /auth/action?mode=resetPassword&oobCode=...
 * where they can set their new password using confirmPasswordReset().
 * This is fully client-side — NO Firebase Admin SDK required.
 */
export async function triggerFirebasePasswordReset(email: string): Promise<void> {
  const actionCodeSettings = {
    // After the user clicks the link, Firebase redirects here with the oobCode
    url: `${window.location.origin}/auth/action`,
    handleCodeInApp: true,
  };
  await sendPasswordResetEmail(auth, email, actionCodeSettings);
}

/**
 * Verify the Firebase oobCode is still valid and return the associated email.
 */
export async function verifyOobCode(oobCode: string): Promise<string> {
  return verifyPasswordResetCode(auth, oobCode);
}

/**
 * Apply the new password using Firebase's built-in confirmPasswordReset.
 */
export async function applyNewPassword(oobCode: string, newPassword: string): Promise<void> {
  await confirmPasswordReset(auth, oobCode, newPassword);
}
