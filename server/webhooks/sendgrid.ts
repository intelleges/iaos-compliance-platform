import type { Request, Response } from 'express';
import { eventBus } from '../events/eventBus';
import { getDb } from '../db';
import { emailLogs } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * SendGrid Webhook Event Types
 * Based on INT.DOC.11 Section 3
 */
interface SendGridEvent {
  event: 'processed' | 'delivered' | 'open' | 'click' | 'bounce' | 'dropped' | 'spamreport' | 'unsubscribe';
  email: string;
  timestamp: number;
  'smtp-id': string;
  sg_message_id: string;
  sg_event_id: string;
  category?: string[];
  
  // Custom args passed when sending
  assignmentId?: string;
  templateCode?: string;
  enterpriseId?: string;
  
  // Bounce-specific
  bounce_classification?: string;
  reason?: string;
  
  // Click-specific
  url?: string;
}

/**
 * Verify SendGrid webhook signature
 * https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security
 */
function verifySignature(req: Request): boolean {
  // In production, verify the X-Twilio-Email-Event-Webhook-Signature header
  // For now, we'll accept all requests (SendGrid doesn't require signature by default)
  const signature = req.headers['x-twilio-email-event-webhook-signature'];
  
  if (!signature) {
    // No signature required in development
    return true;
  }
  
  // TODO: Implement ECDSA signature verification
  // const crypto = require('crypto');
  // const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;
  // return crypto.verify('sha256', req.body, publicKey, signature);
  
  return true;
}

/**
 * Process email delivered event
 */
async function handleDelivered(event: SendGridEvent) {
  const db = await getDb();
  if (!db) return;

  // Update email log
  await db
    .update(emailLogs)
    .set({
      status: 'delivered',
      deliveredAt: new Date(event.timestamp * 1000),
      updatedAt: new Date(),
    })
    .where(eq(emailLogs.messageId, event.sg_message_id));

  // Emit internal event
  eventBus.emit('email.delivered', {
    messageId: event['smtp-id'],
    email: event.email,
    timestamp: event.timestamp,
    sg_message_id: event.sg_message_id,
    sg_event_id: event.sg_event_id,
    assignmentId: event.assignmentId,
    templateCode: event.templateCode,
    enterpriseId: event.enterpriseId,
  });
}

/**
 * Process email opened event
 */
async function handleOpened(event: SendGridEvent) {
  const db = await getDb();
  if (!db) return;

  // Update email log
  await db
    .update(emailLogs)
    .set({
      openedAt: new Date(event.timestamp * 1000),
      updatedAt: new Date(),
    })
    .where(eq(emailLogs.messageId, event.sg_message_id));

  // Emit internal event
  eventBus.emit('email.opened', {
    messageId: event['smtp-id'],
    email: event.email,
    timestamp: event.timestamp,
    sg_message_id: event.sg_message_id,
    sg_event_id: event.sg_event_id,
    assignmentId: event.assignmentId,
    url: event.url,
  });
}

/**
 * Process email clicked event
 */
async function handleClicked(event: SendGridEvent) {
  const db = await getDb();
  if (!db) return;

  // Update email log
  await db
    .update(emailLogs)
    .set({
      clickedAt: new Date(event.timestamp * 1000),
      updatedAt: new Date(),
    })
    .where(eq(emailLogs.messageId, event.sg_message_id));

  // Emit internal event
  eventBus.emit('email.clicked', {
    messageId: event['smtp-id'],
    email: event.email,
    timestamp: event.timestamp,
    sg_message_id: event.sg_message_id,
    sg_event_id: event.sg_event_id,
    url: event.url,
    assignmentId: event.assignmentId,
  });
}

/**
 * Process email bounced event
 */
async function handleBounce(event: SendGridEvent) {
  const db = await getDb();
  if (!db) return;

  // Update email log
  await db
    .update(emailLogs)
    .set({
      status: 'bounced',
      bounceReason: event.reason,
      bounceClassification: event.bounce_classification,
      updatedAt: new Date(),
    })
    .where(eq(emailLogs.messageId, event.sg_message_id));

  // Emit internal event
  eventBus.emit('email.bounced', {
    messageId: event['smtp-id'],
    email: event.email,
    timestamp: event.timestamp,
    sg_message_id: event.sg_message_id,
    sg_event_id: event.sg_event_id,
    reason: event.reason,
    bounce_classification: event.bounce_classification,
    assignmentId: event.assignmentId,
    templateCode: event.templateCode,
    enterpriseId: event.enterpriseId,
  });
}

/**
 * Process individual SendGrid event
 */
async function processEmailEvent(event: SendGridEvent) {
  try {
    switch (event.event) {
      case 'delivered':
        await handleDelivered(event);
        break;

      case 'open':
        await handleOpened(event);
        break;

      case 'click':
        await handleClicked(event);
        break;

      case 'bounce':
        await handleBounce(event);
        break;

      case 'dropped':
      case 'spamreport':
      case 'unsubscribe':
        // Log these events but don't process them yet
        console.log(`[SendGrid Webhook] ${event.event}:`, event.email);
        break;

      default:
        console.log('[SendGrid Webhook] Unknown event type:', event.event);
    }
  } catch (error) {
    console.error('[SendGrid Webhook] Error processing event:', error);
    // Don't throw - we want to acknowledge receipt even if processing fails
  }
}

/**
 * SendGrid Webhook Handler
 * POST /api/webhooks/sendgrid
 */
export async function sendgridWebhookHandler(req: Request, res: Response) {
  try {
    // Verify webhook signature
    if (!verifySignature(req)) {
      console.warn('[SendGrid Webhook] Invalid signature');
      return res.status(401).send('Invalid signature');
    }

    // SendGrid sends an array of events
    const events: SendGridEvent[] = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).send('Invalid payload');
    }

    // Process each event
    for (const event of events) {
      await processEmailEvent(event);
    }

    // Acknowledge receipt
    res.status(200).send('OK');
  } catch (error) {
    console.error('[SendGrid Webhook] Error:', error);
    res.status(500).send('Processing error');
  }
}
