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
import type { Campaign, CampaignStatus } from '../types/campaign';

// ── Local storage fallback ───────────────────────────────────────────
// Used when Firebase is not configured. Campaigns are persisted in localStorage.
const STORAGE_KEY = 'cybermonitor_campaigns';

const INITIAL_CAMPAIGNS: Campaign[] = [];

function getLocalCampaigns(): Campaign[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved) as Campaign[];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CAMPAIGNS));
  return INITIAL_CAMPAIGNS;
}

function saveLocalCampaigns(camps: Campaign[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(camps));
}

// ── Service API ───────────────────────────────────────────────────

export async function getCampaigns(): Promise<Campaign[]> {
  if (isFirebaseConfigured) {
    try {
      const q = query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          templateId: data.templateId,
          deliveryMethod: data.deliveryMethod,
          description: data.description || '',
          status: data.status,
          simulationSlug: data.simulationSlug,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          participants: data.participants || 0,
        } as Campaign;
      });
    } catch (e) {
      console.warn('[CampaignService] Firestore error reading campaigns. Falling back to local store.', e);
    }
  }
  return getLocalCampaigns().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getCampaignById(id: string): Promise<Campaign | undefined> {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'campaigns', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name,
          templateId: data.templateId,
          deliveryMethod: data.deliveryMethod,
          description: data.description || '',
          status: data.status,
          simulationSlug: data.simulationSlug,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          participants: data.participants || 0,
        } as Campaign;
      }
    } catch (e) {
      console.warn('[CampaignService] Firestore error reading campaign. Falling back to local store.', e);
    }
  }
  return getLocalCampaigns().find((c) => c.id === id);
}

export async function createCampaign(
  campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Campaign> {
  const isoNow = new Date().toISOString();

  if (isFirebaseConfigured) {
    try {
      const payload = {
        ...campaign,
        createdAt: isoNow,
        updatedAt: isoNow,
        _serverCreatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'campaigns'), payload);
      return { id: docRef.id, ...campaign, createdAt: isoNow, updatedAt: isoNow };
    } catch (e) {
      console.warn('[CampaignService] Firestore error creating campaign. Falling back to local store.', e);
    }
  }

  const list = getLocalCampaigns();
  const newCamp: Campaign = {
    id: `c-${Math.random().toString(36).substring(2, 9)}`,
    ...campaign,
    createdAt: isoNow,
    updatedAt: isoNow,
  };
  list.push(newCamp);
  saveLocalCampaigns(list);
  return newCamp;
}

export async function updateCampaign(
  id: string,
  updates: Partial<Omit<Campaign, 'id' | 'createdAt'>>,
): Promise<void> {
  const isoNow = new Date().toISOString();

  if (isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, 'campaigns', id), {
        ...updates,
        updatedAt: isoNow,
        _serverUpdatedAt: serverTimestamp(),
      });
      return;
    } catch (e) {
      console.warn('[CampaignService] Firestore error updating campaign. Falling back to local store.', e);
    }
  }

  const list = getLocalCampaigns();
  const idx = list.findIndex((c) => c.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates, updatedAt: isoNow };
    saveLocalCampaigns(list);
  }
}

export async function updateCampaignStatus(id: string, status: CampaignStatus): Promise<void> {
  return updateCampaign(id, { status });
}

export async function deleteCampaign(id: string): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'campaigns', id));
      return;
    } catch (e) {
      console.warn('[CampaignService] Firestore error deleting campaign. Falling back to local store.', e);
    }
  }

  const list = getLocalCampaigns().filter((c) => c.id !== id);
  saveLocalCampaigns(list);
}

export async function getCampaignsByStatus(status: CampaignStatus): Promise<Campaign[]> {
  if (isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, 'campaigns'),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Campaign));
    } catch (e) {
      console.warn('[CampaignService] Firestore error filtering campaigns.', e);
    }
  }
  return getLocalCampaigns().filter((c) => c.status === status);
}

// ── Bulk delete campaigns ─────────────────────────────────────────
export async function deleteCampaigns(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await Promise.all(ids.map((id) => deleteCampaign(id)));
}
