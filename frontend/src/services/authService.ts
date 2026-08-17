import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import type { AdminUser } from '../types/user';

// Fallback credentials for local testing loaded from environment variables
const MOCK_ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string) || '';
const MOCK_ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD as string) || '';

// In-memory session state when Firebase is not active
let mockCurrentUser: AdminUser | null = null;
const mockListeners: ((user: AdminUser | null) => void)[] = [];

function triggerMockListeners() {
  mockListeners.forEach(listener => listener(mockCurrentUser));
}

export async function loginAdmin(email: string, password: string): Promise<AdminUser> {
  const normalisedEmail = email.toLowerCase().trim();
  if (normalisedEmail !== 'kingsleyanaab604@gmail.com') {
    throw new Error('Unauthorized: Only kingsleyanaab604@gmail.com is authorized to log in.');
  }

  if (isFirebaseConfigured) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (user.email?.toLowerCase().trim() !== 'kingsleyanaab604@gmail.com') {
        await signOut(auth);
        throw new Error('Unauthorized: Only kingsleyanaab604@gmail.com is authorized to log in.');
      }

      return {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Admin User',
      };
    } catch (error: any) {
      console.error("Firebase Login failed. Attempting Mock Login fallback.", error);
      if (error.message && error.message.includes('Unauthorized')) {
        throw error;
      }
      // Fallback if Firebase is configured but offline or has setup issues, 
      // or if it's the specific test account.
    }
  }

  // Fallback Local Login (only if env credentials are set and non-empty)
  const localPassword = localStorage.getItem('cybermonitor_local_password') || MOCK_ADMIN_PASSWORD;
  if (MOCK_ADMIN_EMAIL && localPassword && normalisedEmail === MOCK_ADMIN_EMAIL.toLowerCase().trim() && password === localPassword) {
    mockCurrentUser = {
      uid: 'local-admin-uid',
      email: MOCK_ADMIN_EMAIL,
      displayName: 'Local Administrator',
    };
    triggerMockListeners();
    // Also save in localStorage to persist local logins on reload
    localStorage.setItem('cybermonitor_local_user', JSON.stringify(mockCurrentUser));
    return mockCurrentUser;
  }

  throw new Error('Invalid email or password.');
}

export async function logoutAdmin(): Promise<void> {
  if (isFirebaseConfigured) {
    await signOut(auth);
  }
  mockCurrentUser = null;
  localStorage.removeItem('cybermonitor_local_user');
  triggerMockListeners();
}

/** Subscribe to admin state changes. Returns unsubscribe function. */
export function subscribeToAuthChanges(callback: (user: AdminUser | null) => void): () => void {
  if (isFirebaseConfigured) {
    return onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user) {
        if (user.email?.toLowerCase().trim() !== 'kingsleyanaab604@gmail.com') {
          signOut(auth);
          callback(null);
          return;
        }
        callback({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Admin User',
        });
      } else {
        // Check if there is a local session user persisted
        const saved = localStorage.getItem('cybermonitor_local_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.email?.toLowerCase().trim() !== 'kingsleyanaab604@gmail.com') {
            localStorage.removeItem('cybermonitor_local_user');
            callback(null);
          } else {
            mockCurrentUser = parsed;
            callback(mockCurrentUser);
          }
        } else {
          callback(null);
        }
      }
    });
  }

  // Local fallback session check
  const saved = localStorage.getItem('cybermonitor_local_user');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.email?.toLowerCase().trim() !== 'kingsleyanaab604@gmail.com') {
      localStorage.removeItem('cybermonitor_local_user');
      mockCurrentUser = null;
    } else {
      mockCurrentUser = parsed;
    }
  }
  
  mockListeners.push(callback);
  // Send current state to newly registered listener
  callback(mockCurrentUser);

  return () => {
    const idx = mockListeners.indexOf(callback);
    if (idx !== -1) {
      mockListeners.splice(idx, 1);
    }
  };
}
