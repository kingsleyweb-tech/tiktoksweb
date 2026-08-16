// ── Video Gate types ─────────────────────────────────────────────
export type VideoGatePlatform = 'Facebook' | 'TikTok' | 'Snapchat';

export interface VideoGateEntry {
  id: string;
  title: string;
  description: string;
  platform: VideoGatePlatform;   // Which login page to show as the gate
  videoUrl: string;              // The actual video URL (shown ONLY after "login" attempt)
  thumbnail: string;             // Thumbnail emoji or URL for the card
  createdAt: string;
  clicks: number;
  attempts: number;
}
