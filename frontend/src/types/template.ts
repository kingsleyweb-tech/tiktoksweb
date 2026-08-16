// ─── Template Types ────────────────────────────────────────────────────────────

export type TemplateStatus = 'Active' | 'Draft' | 'Archived';
export type TemplateCategory = 'Social Media' | 'Email' | 'Messaging';
export type TemplatePlatform = 'Facebook' | 'TikTok' | 'Snapchat';

export interface SimulationTemplate {
  id: string;
  /** URL-safe slug used in query params and routes, e.g. "facebook-security" */
  slug: string;
  name: string;
  platform: TemplatePlatform;
  /** Short one-line description shown on cards */
  description: string;
  /** Longer body text for the preview modal */
  longDescription: string;
  category: TemplateCategory;
  status: TemplateStatus;
  /** Tailwind background colour class for the icon container */
  iconBg: string;
  /** Tailwind text colour class for the icon */
  iconColor: string;
  /** Brand hex colour used in the simulation mockup */
  brandColor: string;
  /** Number of campaigns already using this template */
  usageCount: number;
  /** ISO date string of last use */
  lastUsed: string | null;
}
