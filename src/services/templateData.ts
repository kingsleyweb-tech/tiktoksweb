import type { SimulationTemplate } from '../types/template';

// ─── Simulation Template Registry ─────────────────────────────────────────────
// Add new templates to this array. The UI, service functions, and routing
// will pick them up automatically.

export const SIMULATION_TEMPLATES: SimulationTemplate[] = [
  {
    id: 'tpl-001',
    slug: 'facebook-security',
    name: 'Facebook Security Simulation',
    platform: 'Facebook',
    description: 'Simulates a Facebook security-alert login prompt to test employee vigilance against social-media phishing.',
    longDescription:
      'This simulation presents participants with a convincing Facebook-styled security-alert page that asks them to re-enter their credentials to "unlock" their account. It is designed to test awareness of social-media phishing tactics. No real credentials are collected — any input triggers an immediate educational redirect.',
    category: 'Social Media',
    status: 'Active',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    brandColor: '#1877F2',
    usageCount: 4,
    lastUsed: '2026-08-10',
  },
  {
    id: 'tpl-002',
    slug: 'tiktok-security',
    name: 'TikTok Security Simulation',
    platform: 'TikTok',
    description: 'Mimics a TikTok account-verification page to highlight risks of short-form video platform phishing.',
    longDescription:
      'Participants are shown a TikTok-styled verification page prompting them to confirm their identity. This tests awareness of phishing campaigns targeting younger users via popular video platforms. All input is immediately discarded — only a safe simulation_attempt event is logged.',
    category: 'Social Media',
    status: 'Active',
    iconBg: 'bg-slate-900',
    iconColor: 'text-white',
    brandColor: '#010101',
    usageCount: 2,
    lastUsed: '2026-07-22',
  },
  {
    id: 'tpl-003',
    slug: 'snapchat-security',
    name: 'Snapchat Security Simulation',
    platform: 'Snapchat',
    description: 'Replicates a Snapchat account-recovery flow to train staff on recognising messaging-app credential phishing.',
    longDescription:
      'This simulation displays a Snapchat-styled account-recovery page. It evaluates whether participants can identify phishing attempts disguised as familiar mobile-app authentication screens. No passwords are stored or transmitted — the page records only a simulation_attempt event.',
    category: 'Social Media',
    status: 'Active',
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-500',
    brandColor: '#FFFC00',
    usageCount: 1,
    lastUsed: '2026-06-05',
  },
];
