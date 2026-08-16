import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

// ── Training Video types ──────────────────────────────────────────
export type TrainingVideoStatus = 'draft' | 'active';

export interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  templateId?: string; // Optionally scoped to a simulation template
  status: TrainingVideoStatus;
  createdBy?: string; // admin uid
  createdAt: string;  // ISO string
  updatedAt: string;  // ISO string
}

// ── Local fallback ────────────────────────────────────────────────
const STORAGE_KEY = 'cybermonitor_training_videos';

function getMockVideos(): TrainingVideo[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved) as TrainingVideo[];
  return [];
}

function saveMockVideos(videos: TrainingVideo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
}

// ── Service API ───────────────────────────────────────────────────

export async function createTrainingVideo(
  data: Omit<TrainingVideo, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<TrainingVideo> {
  const isoNow = new Date().toISOString();

  if (isFirebaseConfigured) {
    try {
      const payload = { ...data, createdAt: isoNow, updatedAt: isoNow, _serverCreatedAt: serverTimestamp() };
      const docRef = await addDoc(collection(db, 'trainingVideos'), payload);
      return { id: docRef.id, ...data, createdAt: isoNow, updatedAt: isoNow };
    } catch (e) {
      console.warn('[TrainingService] Firestore error creating video. Falling back to local store.', e);
    }
  }

  const list = getMockVideos();
  const video: TrainingVideo = {
    id: `tv-${Math.random().toString(36).substring(2, 9)}`,
    ...data,
    createdAt: isoNow,
    updatedAt: isoNow,
  };
  list.unshift(video);
  saveMockVideos(list);
  return video;
}

export async function getTrainingVideos(statusFilter?: TrainingVideoStatus): Promise<TrainingVideo[]> {
  if (isFirebaseConfigured) {
    try {
      const q = statusFilter
        ? query(collection(db, 'trainingVideos'), where('status', '==', statusFilter), orderBy('createdAt', 'desc'))
        : query(collection(db, 'trainingVideos'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TrainingVideo));
    } catch (e) {
      console.warn('[TrainingService] Firestore error reading videos. Falling back to local store.', e);
    }
  }

  const all = getMockVideos();
  return statusFilter ? all.filter((v) => v.status === statusFilter) : all;
}

export async function getTrainingVideo(id: string): Promise<TrainingVideo | undefined> {
  if (isFirebaseConfigured) {
    try {
      const docSnap = await getDoc(doc(db, 'trainingVideos', id));
      if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as TrainingVideo;
    } catch (e) {
      console.warn('[TrainingService] Firestore error reading video. Falling back to local store.', e);
    }
  }
  return getMockVideos().find((v) => v.id === id);
}

export async function updateTrainingVideo(
  id: string,
  updates: Partial<Omit<TrainingVideo, 'id' | 'createdAt'>>,
): Promise<void> {
  const isoNow = new Date().toISOString();

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, 'trainingVideos', id), {
        ...updates,
        updatedAt: isoNow,
        _serverUpdatedAt: serverTimestamp(),
      });
      return;
    } catch (e) {
      console.warn('[TrainingService] Firestore error updating video. Falling back to local store.', e);
    }
  }

  const list = getMockVideos();
  const idx = list.findIndex((v) => v.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates, updatedAt: isoNow };
    saveMockVideos(list);
  }
}

export async function deleteTrainingVideo(id: string): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'trainingVideos', id));
      return;
    } catch (e) {
      console.warn('[TrainingService] Firestore error deleting video. Falling back to local store.', e);
    }
  }

  saveMockVideos(getMockVideos().filter((v) => v.id !== id));
}
