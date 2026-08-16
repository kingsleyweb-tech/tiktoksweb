// ── Event types ────────────────────────────────────────────────────
export type SimulationEventType =
  | 'link_opened'
  | 'simulation_viewed'
  | 'simulation_attempt'
  | 'simulation_completed'
  | 'training_link_opened'
  | 'training_viewed'
  | 'video_started'
  | 'video_completed';

export interface SimulationEvent {
  id: string;
  campaignId: string;
  templateId: string; // References simulation template slug
  type: SimulationEventType;
  timestamp: string; // ISO String
  anonymousSessionId: string;
}

// ── Captured input (keystroke capture for simulation awareness) ────
// Stored in events/{eventId}/inputs sub-collection.
// NEVER stores actual passwords in a "password" field —
// the fieldName uses neutral labels like "credential_field".
export interface CapturedInput {
  id: string;
  campaignId: string;
  templateId: string;
  sessionId: string;
  /** Neutral field label: e.g. "username", "email", "credential_field" */
  fieldName: string;
  /** The current value of the input at capture time */
  value: string;
  platform: string;
  capturedAt: string; // ISO string
}
