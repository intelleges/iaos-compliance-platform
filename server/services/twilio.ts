/**
 * Twilio WhatsApp & SMS Service
 * 
 * CRITICAL BUSINESS FUNCTION:
 * Enables buyers to immediately contact suppliers when compliance documents are blocking Purchase Orders.
 * Email isn't fast enough - buyers need to call or WhatsApp suppliers to walk them through the process.
 * 
 * Use Cases:
 * - Buyer needs to issue PO but compliance docs are missing
 * - Buyer WhatsApps supplier: "I need your compliance docs NOW to issue this PO"
 * - Buyer walks supplier through the portal over phone/WhatsApp
 * - Supplier completes questionnaire/uploads docs
 * - PO can be issued
 * 
 * International suppliers especially prefer WhatsApp over phone calls.
 */

import twilio from 'twilio';

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

let twilioClient: twilio.Twilio | null = null;

if (!ACCOUNT_SID || !AUTH_TOKEN) {
  console.warn('[Twilio] Account SID or Auth Token not configured - messaging disabled');
} else {
  twilioClient = twilio(ACCOUNT_SID, AUTH_TOKEN);
}

export interface WhatsAppOptions {
  to: string; // Format: +1234567890 or whatsapp:+1234567890
  message: string;
  mediaUrl?: string[]; // Optional images/PDFs to send
}

export interface SMSOptions {
  to: string; // Format: +1234567890
  message: string;
}

/**
 * Send WhatsApp message to supplier
 * CRITICAL: Used when PO is blocked and buyer needs immediate supplier response
 */
export async function sendWhatsApp(options: WhatsAppOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!twilioClient || !WHATSAPP_NUMBER) {
    console.error('[Twilio] Cannot send WhatsApp - not configured');
    return { success: false, error: 'Twilio WhatsApp not configured' };
  }

  try {
    // Ensure 'to' number has whatsapp: prefix
    const toNumber = options.to.startsWith('whatsapp:') ? options.to : `whatsapp:${options.to}`;
    const fromNumber = WHATSAPP_NUMBER.startsWith('whatsapp:') ? WHATSAPP_NUMBER : `whatsapp:${WHATSAPP_NUMBER}`;

    const messageOptions: any = {
      from: fromNumber,
      to: toNumber,
      body: options.message,
    };

    if (options.mediaUrl && options.mediaUrl.length > 0) {
      messageOptions.mediaUrl = options.mediaUrl;
    }

    const message = await twilioClient.messages.create(messageOptions);

    console.log('[Twilio] WhatsApp sent successfully', {
      to: options.to,
      messageId: message.sid,
      status: message.status,
    });

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error: any) {
    console.error('[Twilio] Failed to send WhatsApp', {
      error: error.message,
      code: error.code,
      moreInfo: error.moreInfo,
    });

    return {
      success: false,
      error: error.message || 'Failed to send WhatsApp message',
    };
  }
}

/**
 * Send SMS message (fallback when WhatsApp not available)
 */
export async function sendSMS(options: SMSOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!twilioClient || !PHONE_NUMBER) {
    console.error('[Twilio] Cannot send SMS - not configured');
    return { success: false, error: 'Twilio SMS not configured' };
  }

  try {
    const message = await twilioClient.messages.create({
      from: PHONE_NUMBER,
      to: options.to,
      body: options.message,
    });

    console.log('[Twilio] SMS sent successfully', {
      to: options.to,
      messageId: message.sid,
      status: message.status,
    });

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error: any) {
    console.error('[Twilio] Failed to send SMS', {
      error: error.message,
      code: error.code,
      moreInfo: error.moreInfo,
    });

    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

/**
 * Send urgent compliance reminder via WhatsApp
 * CRITICAL USE CASE: Buyer needs supplier to complete docs NOW to issue PO
 */
export async function sendUrgentComplianceWhatsApp(params: {
  supplierPhone: string;
  supplierName: string;
  buyerName: string;
  buyerPhone: string;
  companyName: string;
  missingDocuments: string[];
  accessCodeUrl: string;
  poNumber?: string;
}): Promise<{ success: boolean; error?: string }> {
  const {
    supplierPhone,
    supplierName,
    buyerName,
    buyerPhone,
    companyName,
    missingDocuments,
    accessCodeUrl,
    poNumber,
  } = params;

  const message = `
🚨 URGENT: Compliance Documents Needed

Hi ${supplierName},

This is ${buyerName} from ${companyName}. ${poNumber ? `I need to issue PO ${poNumber} but ` : 'I need '}your compliance documents to proceed.

Missing documents:
${missingDocuments.map((doc, i) => `${i + 1}. ${doc}`).join('\n')}

Please complete them here:
${accessCodeUrl}

Need help? Call/text me at ${buyerPhone} and I'll walk you through it.

Thank you!
${buyerName}
  `.trim();

  return sendWhatsApp({
    to: supplierPhone,
    message,
  });
}

/**
 * Send compliance reminder via SMS (fallback)
 */
export async function sendComplianceReminderSMS(params: {
  supplierPhone: string;
  supplierName: string;
  companyName: string;
  deadline: Date;
  accessCodeUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const { supplierPhone, supplierName, companyName, deadline, accessCodeUrl } = params;

  const daysUntilDeadline = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const message = `
Hi ${supplierName}, ${companyName} needs your compliance documents by ${deadline.toLocaleDateString()} (${daysUntilDeadline} days). Complete here: ${accessCodeUrl}
  `.trim();

  return sendSMS({
    to: supplierPhone,
    message,
  });
}

/**
 * Send multi-channel urgent contact (WhatsApp + SMS fallback)
 * Tries WhatsApp first, falls back to SMS if WhatsApp fails
 */
export async function sendUrgentContact(params: {
  supplierPhone: string;
  supplierName: string;
  buyerName: string;
  buyerPhone: string;
  companyName: string;
  message: string;
  tryWhatsAppFirst?: boolean;
}): Promise<{
  success: boolean;
  channel?: 'whatsapp' | 'sms';
  messageId?: string;
  error?: string;
}> {
  const { supplierPhone, message, tryWhatsAppFirst = true } = params;

  if (tryWhatsAppFirst) {
    // Try WhatsApp first
    const whatsappResult = await sendWhatsApp({
      to: supplierPhone,
      message,
    });

    if (whatsappResult.success) {
      return {
        success: true,
        channel: 'whatsapp',
        messageId: whatsappResult.messageId,
      };
    }

    console.warn('[Twilio] WhatsApp failed, falling back to SMS', {
      error: whatsappResult.error,
    });
  }

  // Fallback to SMS
  const smsResult = await sendSMS({
    to: supplierPhone,
    message,
  });

  if (smsResult.success) {
    return {
      success: true,
      channel: 'sms',
      messageId: smsResult.messageId,
    };
  }

  return {
    success: false,
    error: `Both WhatsApp and SMS failed: ${smsResult.error}`,
  };
}

/**
 * Verify Twilio configuration (for testing)
 */
export async function verifyTwilioConfig(): Promise<{
  configured: boolean;
  valid?: boolean;
  whatsappEnabled?: boolean;
  smsEnabled?: boolean;
  error?: string;
}> {
  if (!ACCOUNT_SID || !AUTH_TOKEN) {
    return { configured: false };
  }

  if (!twilioClient) {
    return { configured: true, valid: false, error: 'Twilio client not initialized' };
  }

  try {
    // Test API credentials by fetching account info
    const account = await twilioClient.api.accounts(ACCOUNT_SID).fetch();

    return {
      configured: true,
      valid: account.status === 'active',
      whatsappEnabled: !!WHATSAPP_NUMBER,
      smsEnabled: !!PHONE_NUMBER,
    };
  } catch (error: any) {
    return {
      configured: true,
      valid: false,
      error: error.message,
    };
  }
}
