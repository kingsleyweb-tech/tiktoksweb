import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { API_BASE_URL } from './api';

export type DeliveryChannel = 'Email' | 'SMS';

export interface DeliveryResult {
  success: boolean;
  message: string;
  recipient: string;
  channel: DeliveryChannel;
  simulationUrl: string;
  timestamp: string;
  messageId?: string;
}

export interface EmailConfigResponse {
  tiktok: { displayName: string; email: string; configured: boolean };
  snapchat: { displayName: string; email: string; configured: boolean };
}

export interface EmailStatusResponse {
  tiktok: { status: 'connected' | 'disconnected' | 'not_configured'; error?: string };
  snapchat: { status: 'connected' | 'disconnected' | 'not_configured'; error?: string };
}

export interface EmailDeliveryLog {
  campaignId: string;
  recipientEmail: string;
  senderType: 'TikTok' | 'Snapchat';
  sentAt: string;
  deliveryStatus: 'success' | 'failed';
  messageId?: string;
}

/** Generate the public simulation URL for a campaign. */
export function generateSimulationUrl(campaignId: string, templateId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/simulate/${campaignId}/${templateId}`;
}

/** Log email delivery safely in Firestore or local fallback */
export async function logEmailDelivery(log: Omit<EmailDeliveryLog, 'sentAt'>): Promise<void> {
  const sentAt = new Date().toISOString();
  if (isFirebaseConfigured) {
    try {
      await addDoc(collection(db, 'email_deliveries'), {
        ...log,
        sentAt,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('[DeliveryService] Firestore error logging email delivery. Falling back to local store.', e);
      saveLocalEmailDelivery({ ...log, sentAt });
    }
  } else {
    saveLocalEmailDelivery({ ...log, sentAt });
  }
}

function saveLocalEmailDelivery(log: EmailDeliveryLog) {
  const key = 'cybermonitor_email_deliveries';
  const existing = JSON.parse(localStorage.getItem(key) || '[]') as EmailDeliveryLog[];
  existing.unshift(log);
  localStorage.setItem(key, JSON.stringify(existing.slice(0, 500)));
}

/** Get email sender configurations from backend */
export async function getEmailConfig(): Promise<EmailConfigResponse> {
  const response = await fetch(`${API_BASE_URL}/api/email/config`);
  if (!response.ok) {
    throw new Error('Failed to retrieve email configuration from backend.');
  }
  return response.json();
}

/** Get email connection status from backend */
export async function getEmailStatus(): Promise<EmailStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/email/status`);
  if (!response.ok) {
    throw new Error('Failed to retrieve email connection statuses.');
  }
  return response.json();
}

/** Send simulation email via the backend proxy and log to Firestore */
export async function sendSimulationEmail(params: {
  campaignId: string;
  recipient: string;
  subject: string;
  message: string;
  templateId: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    const senderType = params.templateId.includes('tiktok') ? 'TikTok' : 'Snapchat';

    if (!response.ok || !data.success) {
      const errorMsg = data.error || 'Failed to send simulation email through backend.';
      await logEmailDelivery({
        campaignId: params.campaignId,
        recipientEmail: params.recipient,
        senderType,
        deliveryStatus: 'failed',
      });
      return { success: false, error: errorMsg };
    }

    await logEmailDelivery({
      campaignId: params.campaignId,
      recipientEmail: params.recipient,
      senderType,
      deliveryStatus: 'success',
      messageId: data.messageId,
    });

    return { success: true, messageId: data.messageId };
  } catch (err: any) {
    const senderType = params.templateId.includes('tiktok') ? 'TikTok' : 'Snapchat';
    await logEmailDelivery({
      campaignId: params.campaignId,
      recipientEmail: params.recipient,
      senderType,
      deliveryStatus: 'failed',
    });
    return { success: false, error: err.message || 'Network error sending simulation email.' };
  }
}

/**
 * Sends the simulation link via the selected channel.
 * Email is composed and dispatched via the backend SMTP proxy.
 * SMS is dispatched via the backend SMS gateway proxy.
 */
export async function sendSimulationLink(
  channel: DeliveryChannel,
  recipient: string,
  campaignId: string,
  templateId: string,
  campaignName: string,
  customSmsMessage?: string,
): Promise<DeliveryResult> {
  const simulationUrl = generateSimulationUrl(campaignId, templateId);
  const timestamp = new Date().toISOString();

  if (channel === 'Email') {
    // Email is manual copy/paste to Gmail
    await new Promise((r) => setTimeout(r, 400));
    return {
      success: true,
      message: 'Email link prepared for manual copy. Send through your preferred client.',
      recipient,
      channel,
      simulationUrl,
      timestamp,
    };
  }

  // SMS: Dispatched through the secure backend proxy endpoint
  const defaultSmsText = `CyberSecurity Notice: Please review your profile security. Click the link to proceed: ${simulationUrl}`;
  const messageText = customSmsMessage || defaultSmsText;

  try {
    const response = await fetch(`${API_BASE_URL}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipient,
        message: messageText,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to dispatch SMS through backend.');
    }

    console.info('[DeliveryService] SMS successfully dispatched via backend:', {
      recipient: recipient.replace(/./g, (c, i) => (i < 3 ? c : '*')),
      campaignName,
    });

    return {
      success: true,
      message: `SMS successfully sent.`,
      recipient,
      channel,
      simulationUrl,
      timestamp,
      messageId: data.messageId,
    };
  } catch (err: any) {
    console.error('[DeliveryService] SMS delivery failed:', err);
    return {
      success: false,
      message: `Delivery failed: ${err.message}`,
      recipient,
      channel,
      simulationUrl,
      timestamp,
    };
  }
}

