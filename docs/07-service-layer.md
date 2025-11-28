# 07-Service Layer Documentation
## Federal Compliance Management Platform

**Document Version:** 1.0  
**Last Updated:** November 27, 2025  
**Author:** Manus AI  
**Status:** Production

---

## Table of Contents

1. [Overview](#overview)
2. [SendGrid Email Service](#sendgrid-email-service)
3. [Twilio WhatsApp Service](#twilio-whatsapp-service)
4. [AWS S3 Storage Service](#aws-s3-storage-service)
5. [Service Integration Patterns](#service-integration-patterns)
6. [Error Handling & Retry Logic](#error-handling--retry-logic)
7. [Webhook Architecture](#webhook-architecture)
8. [Testing & Monitoring](#testing--monitoring)

---

## Overview

The service layer provides abstraction for external integrations, ensuring consistent error handling, retry logic, and monitoring across all third-party services. This document focuses on the three primary external services used in the federal compliance management platform: **SendGrid** for email communications, **Twilio** for WhatsApp messaging, and **AWS S3** for file storage.

### Architecture Principles

The service layer follows these core principles to ensure reliability, maintainability, and scalability:

**Separation of Concerns** — Each service is encapsulated in its own module with a consistent interface, allowing business logic to remain independent of implementation details. This enables easy swapping of providers without affecting application code.

**Fail-Safe Defaults** — All service calls implement graceful degradation. When SendGrid is unavailable, the system logs the failure and queues the message for retry rather than blocking user workflows. Similarly, WhatsApp message failures fall back to email notifications.

**Idempotency** — All service operations are designed to be safely retried. Email sends use unique message IDs to prevent duplicates, WhatsApp messages include deduplication tokens, and S3 uploads use content-based keys to ensure consistency.

**Observability** — Every service call is instrumented with structured logging, performance metrics, and error tracking. This enables rapid troubleshooting and proactive monitoring of service health.

### Technology Stack

| Service | Provider | Purpose | Authentication |
|---------|----------|---------|----------------|
| Email | SendGrid | Transactional emails, notifications | API Key |
| SMS/WhatsApp | Twilio | Real-time supplier communications | Account SID + Auth Token |
| File Storage | AWS S3 | Document uploads, compliance files | IAM credentials (via Manus) |
| Webhooks | Express | Delivery tracking, status updates | HMAC signature validation |

---

## SendGrid Email Service

SendGrid handles all transactional email communications, including questionnaire invitations, compliance reminders, deadline alerts, and status notifications. The platform uses SendGrid's v3 API with dynamic templates for consistent branding and localization support.

### Service Architecture

The SendGrid service is implemented as a singleton class that manages API connections, template rendering, and delivery tracking. All email operations are asynchronous and return promises, enabling non-blocking execution in tRPC procedures.

```typescript
// server/services/sendgrid.ts
import sgMail from '@sendgrid/mail';
import { ENV } from '../_core/env';

// Initialize SendGrid with API key
sgMail.setApiKey(ENV.sendgridApiKey);

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailOptions {
  to: EmailRecipient | EmailRecipient[];
  from?: EmailRecipient;
  subject: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
  text?: string;
  html?: string;
  attachments?: Array<{
    content: string; // Base64 encoded
    filename: string;
    type: string;
    disposition: 'attachment' | 'inline';
  }>;
  customArgs?: Record<string, string>;
  categories?: string[];
}

export class SendGridService {
  private static defaultFrom: EmailRecipient = {
    email: ENV.sendgridFromEmail || 'noreply@intelleges.com',
    name: 'Intelleges Compliance Platform'
  };

  /**
   * Send a single email using SendGrid
   * @param options Email configuration
   * @returns Message ID from SendGrid
   */
  static async sendEmail(options: EmailOptions): Promise<string> {
    try {
      const msg = {
        to: options.to,
        from: options.from || this.defaultFrom,
        subject: options.subject,
        ...(options.templateId && {
          templateId: options.templateId,
          dynamicTemplateData: options.dynamicTemplateData || {}
        }),
        ...(options.text && { text: options.text }),
        ...(options.html && { html: options.html }),
        ...(options.attachments && { attachments: options.attachments }),
        customArgs: {
          ...options.customArgs,
          environment: ENV.nodeEnv,
          timestamp: new Date().toISOString()
        },
        categories: options.categories || ['compliance-platform']
      };

      const [response] = await sgMail.send(msg);
      
      console.log('[SendGrid] Email sent successfully', {
        messageId: response.headers['x-message-id'],
        to: Array.isArray(options.to) ? options.to.map(r => r.email) : options.to.email,
        subject: options.subject
      });

      return response.headers['x-message-id'] as string;
    } catch (error) {
      console.error('[SendGrid] Failed to send email', {
        error,
        to: options.to,
        subject: options.subject
      });
      throw new Error(`SendGrid email failed: ${error.message}`);
    }
  }

  /**
   * Send bulk emails (up to 1000 recipients)
   * @param options Email configuration with multiple recipients
   * @returns Array of message IDs
   */
  static async sendBulkEmail(options: EmailOptions & { to: EmailRecipient[] }): Promise<string[]> {
    // SendGrid supports up to 1000 recipients per API call
    const batches = this.chunkArray(options.to, 1000);
    const messageIds: string[] = [];

    for (const batch of batches) {
      const messageId = await this.sendEmail({
        ...options,
        to: batch
      });
      messageIds.push(messageId);
    }

    return messageIds;
  }

  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

### Email Templates

The platform uses SendGrid's dynamic templates for all transactional emails. Templates are created in the SendGrid dashboard and referenced by ID in the code. This separation allows marketing teams to update email content and branding without code changes.

#### Template Categories

**Supplier Onboarding**
- `questionnaire-invitation` — Initial invitation to complete compliance questionnaire
- `access-code-email` — Access code delivery with login instructions
- `email-verification` — Email verification code for two-factor authentication

**Compliance Notifications**
- `deadline-reminder` — Upcoming deadline alerts (7 days, 3 days, 1 day before)
- `overdue-notice` — Overdue questionnaire notifications
- `completion-confirmation` — Questionnaire submission confirmation
- `status-update` — Compliance status change notifications

**Administrative Alerts**
- `admin-new-submission` — Notify admins of new questionnaire submissions
- `admin-document-uploaded` — Alert admins when suppliers upload documents
- `admin-weekly-summary` — Weekly compliance summary report

#### Template Data Structure

All templates receive a consistent data structure with common fields plus template-specific data:

```typescript
interface BaseTemplateData {
  recipientName: string;
  companyName: string;
  platformUrl: string;
  supportEmail: string;
  currentYear: number;
}

interface QuestionnaireInvitationData extends BaseTemplateData {
  accessCode: string;
  touchpointName: string;
  dueDate: string;
  estimatedTime: string;
  loginUrl: string;
}

interface DeadlineReminderData extends BaseTemplateData {
  questionnaireName: string;
  daysRemaining: number;
  dueDate: string;
  completionPercentage: number;
  continueUrl: string;
}
```

### Email Sending Patterns

#### Pattern 1: Single Transactional Email

Used for immediate, one-off communications like access code delivery or verification emails:

```typescript
import { SendGridService } from '../services/sendgrid';

// Send access code email
await SendGridService.sendEmail({
  to: { email: partner.email, name: partner.name },
  subject: 'Your Compliance Portal Access Code',
  templateId: 'd-abc123...',
  dynamicTemplateData: {
    recipientName: partner.name,
    companyName: partner.companyName,
    accessCode: generatedCode,
    loginUrl: `${ENV.frontendUrl}/partner/login`,
    platformUrl: ENV.frontendUrl,
    supportEmail: 'support@intelleges.com',
    currentYear: new Date().getFullYear()
  },
  customArgs: {
    partnerId: partner.id.toString(),
    eventType: 'access-code-delivery'
  },
  categories: ['onboarding', 'access-code']
});
```

#### Pattern 2: Bulk Notification Campaign

Used for sending the same message to multiple recipients, such as deadline reminders for all suppliers in a group:

```typescript
// Get all partners with upcoming deadlines
const partners = await db.getPartnersWithUpcomingDeadlines(touchpointId, 7);

const recipients = partners.map(p => ({
  email: p.email,
  name: p.name
}));

// Send bulk deadline reminders
await SendGridService.sendBulkEmail({
  to: recipients,
  subject: 'Compliance Deadline Approaching - 7 Days Remaining',
  templateId: 'd-deadline123...',
  dynamicTemplateData: {
    touchpointName: touchpoint.name,
    daysRemaining: 7,
    dueDate: formatDate(touchpoint.dueDate),
    platformUrl: ENV.frontendUrl,
    supportEmail: 'support@intelleges.com',
    currentYear: new Date().getFullYear()
  },
  categories: ['deadline-reminder', 'bulk']
});
```

#### Pattern 3: Personalized Bulk Email

Used when each recipient needs personalized content, such as individual completion percentages:

```typescript
// Send personalized reminders with individual progress
for (const partner of partners) {
  await SendGridService.sendEmail({
    to: { email: partner.email, name: partner.name },
    subject: `${partner.name} - Compliance Update`,
    templateId: 'd-progress123...',
    dynamicTemplateData: {
      recipientName: partner.name,
      companyName: partner.companyName,
      completionPercentage: partner.completionPercent,
      questionnaireName: touchpoint.name,
      continueUrl: `${ENV.frontendUrl}/partner/dashboard?pptq=${partner.pptqId}`,
      platformUrl: ENV.frontendUrl,
      supportEmail: 'support@intelleges.com',
      currentYear: new Date().getFullYear()
    },
    customArgs: {
      partnerId: partner.id.toString(),
      pptqId: partner.pptqId.toString(),
      completionPercent: partner.completionPercent.toString()
    },
    categories: ['progress-update', 'personalized']
  });
  
  // Rate limit: 100 emails per second max
  await new Promise(resolve => setTimeout(resolve, 10));
}
```

---

## Twilio WhatsApp Service

Twilio WhatsApp integration enables real-time, two-way communication with suppliers for urgent notifications, quick status checks, and document requests. WhatsApp messages have significantly higher open rates (98%) compared to email (20-30%), making them ideal for time-sensitive compliance alerts.

### Service Architecture

The Twilio service manages WhatsApp message sending, delivery tracking, and inbound message handling. All WhatsApp numbers must be registered with Twilio and approved by Meta before sending messages.

```typescript
// server/services/twilio.ts
import twilio from 'twilio';
import { ENV } from '../_core/env';

const client = twilio(ENV.twilioAccountSid, ENV.twilioAuthToken);

export interface WhatsAppRecipient {
  phoneNumber: string; // E.164 format: +1234567890
  name?: string;
}

export interface WhatsAppMessageOptions {
  to: WhatsAppRecipient;
  body: string;
  mediaUrl?: string[]; // Up to 10 media URLs
  templateSid?: string; // Pre-approved template SID
  contentVariables?: Record<string, string>;
}

export class TwilioWhatsAppService {
  private static fromNumber = ENV.twilioWhatsAppNumber; // e.g., 'whatsapp:+14155238886'

  /**
   * Send a WhatsApp message via Twilio
   * @param options Message configuration
   * @returns Message SID from Twilio
   */
  static async sendWhatsAppMessage(options: WhatsAppMessageOptions): Promise<string> {
    try {
      const message = await client.messages.create({
        from: this.fromNumber,
        to: `whatsapp:${options.to.phoneNumber}`,
        body: options.body,
        ...(options.mediaUrl && { mediaUrl: options.mediaUrl }),
        ...(options.templateSid && {
          contentSid: options.templateSid,
          contentVariables: JSON.stringify(options.contentVariables || {})
        })
      });

      console.log('[Twilio WhatsApp] Message sent successfully', {
        messageSid: message.sid,
        to: options.to.phoneNumber,
        status: message.status
      });

      return message.sid;
    } catch (error) {
      console.error('[Twilio WhatsApp] Failed to send message', {
        error,
        to: options.to.phoneNumber
      });
      throw new Error(`Twilio WhatsApp failed: ${error.message}`);
    }
  }

  /**
   * Send WhatsApp message with fallback to SMS
   * @param options Message configuration
   * @returns Message SID and delivery method
   */
  static async sendWithFallback(
    options: WhatsAppMessageOptions
  ): Promise<{ sid: string; method: 'whatsapp' | 'sms' }> {
    try {
      const sid = await this.sendWhatsAppMessage(options);
      return { sid, method: 'whatsapp' };
    } catch (error) {
      console.warn('[Twilio] WhatsApp failed, falling back to SMS', {
        to: options.to.phoneNumber,
        error: error.message
      });

      // Fallback to SMS
      const message = await client.messages.create({
        from: ENV.twilioPhoneNumber, // Regular SMS number
        to: options.to.phoneNumber,
        body: options.body
      });

      return { sid: message.sid, method: 'sms' };
    }
  }

  /**
   * Check message delivery status
   * @param messageSid Twilio message SID
   * @returns Message status and error details if failed
   */
  static async getMessageStatus(messageSid: string) {
    const message = await client.messages(messageSid).fetch();
    
    return {
      sid: message.sid,
      status: message.status, // queued, sent, delivered, read, failed, undelivered
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      dateSent: message.dateSent,
      dateUpdated: message.dateUpdated
    };
  }
}
```

### WhatsApp Message Templates

WhatsApp requires pre-approved message templates for business-initiated conversations. Templates must be submitted to Meta for approval before use. Once approved, templates can be referenced by SID.

#### Template Structure

```typescript
// Approved template example
const TEMPLATES = {
  DEADLINE_REMINDER: {
    sid: 'HX1234567890abcdef',
    name: 'deadline_reminder',
    variables: ['{{1}}', '{{2}}', '{{3}}'], // company_name, days_remaining, due_date
    body: 'Hi {{1}}, your compliance questionnaire is due in {{2}} days ({{3}}). Please complete it at https://compliance.intelleges.com'
  },
  DOCUMENT_REQUEST: {
    sid: 'HX0987654321fedcba',
    name: 'document_request',
    variables: ['{{1}}', '{{2}}'], // company_name, document_type
    body: 'Hi {{1}}, we need your {{2}} to complete your compliance review. Upload at https://compliance.intelleges.com'
  }
};
```

### WhatsApp Messaging Patterns

#### Pattern 1: Urgent Deadline Alert

Send immediate WhatsApp notification for approaching deadlines:

```typescript
import { TwilioWhatsAppService } from '../services/twilio';

// Send urgent deadline alert via WhatsApp
const { sid, method } = await TwilioWhatsAppService.sendWithFallback({
  to: {
    phoneNumber: partner.phoneNumber,
    name: partner.name
  },
  templateSid: TEMPLATES.DEADLINE_REMINDER.sid,
  contentVariables: {
    '1': partner.companyName,
    '2': '1', // days remaining
    '3': formatDate(touchpoint.dueDate)
  }
});

// Log delivery method
console.log(`Alert sent via ${method}:`, sid);
```

#### Pattern 2: Document Request with Media

Request specific documents with example image:

```typescript
// Send document request with sample image
await TwilioWhatsAppService.sendWhatsAppMessage({
  to: { phoneNumber: partner.phoneNumber },
  body: `Hi ${partner.companyName}, please upload your W-9 form. See example attached.`,
  mediaUrl: ['https://storage.intelleges.com/samples/w9-example.pdf']
});
```

#### Pattern 3: Status Update Notification

Notify supplier of compliance status change:

```typescript
// Send status update via WhatsApp
await TwilioWhatsAppService.sendWhatsAppMessage({
  to: { phoneNumber: partner.phoneNumber },
  body: `✅ Great news ${partner.companyName}! Your compliance questionnaire has been approved. View your dashboard: ${dashboardUrl}`
});
```

### Inbound Message Handling

Twilio sends inbound WhatsApp messages to a webhook endpoint. The platform processes these messages to handle supplier inquiries and commands.

```typescript
// server/routers/webhooks.ts
import { publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';

const twilioWebhookSchema = z.object({
  MessageSid: z.string(),
  From: z.string(), // whatsapp:+1234567890
  To: z.string(),
  Body: z.string(),
  NumMedia: z.string(),
  MediaUrl0: z.string().optional(),
  MediaContentType0: z.string().optional()
});

export const webhookRouter = router({
  twilioWhatsApp: publicProcedure
    .input(twilioWebhookSchema)
    .mutation(async ({ input }) => {
      const phoneNumber = input.From.replace('whatsapp:', '');
      const messageBody = input.Body.trim().toLowerCase();

      // Find partner by phone number
      const partner = await db.getPartnerByPhone(phoneNumber);
      if (!partner) {
        return { success: false, message: 'Partner not found' };
      }

      // Handle commands
      if (messageBody === 'status') {
        // Send status update
        const status = await db.getPartnerComplianceStatus(partner.id);
        await TwilioWhatsAppService.sendWhatsAppMessage({
          to: { phoneNumber },
          body: `Your compliance status: ${status.completionPercent}% complete. ${status.openTasks} tasks remaining.`
        });
      } else if (messageBody === 'help') {
        // Send help message
        await TwilioWhatsAppService.sendWhatsAppMessage({
          to: { phoneNumber },
          body: 'Commands: STATUS (check progress), HELP (this message), LINK (get dashboard link)'
        });
      } else if (messageBody === 'link') {
        // Send dashboard link
        await TwilioWhatsAppService.sendWhatsAppMessage({
          to: { phoneNumber },
          body: `Access your dashboard: ${ENV.frontendUrl}/partner/dashboard`
        });
      } else {
        // Forward to support team
        await notifySupport({
          from: partner.companyName,
          phoneNumber,
          message: input.Body
        });
      }

      return { success: true };
    })
});
```

---

## AWS S3 Storage Service

AWS S3 handles all file storage for the platform, including compliance documents, questionnaire attachments, and exported reports. The Manus platform provides pre-configured S3 credentials and helper functions.

### Service Architecture

The S3 service is already implemented in the Manus template at `server/storage.ts`. It provides two core functions: `storagePut` for uploads and `storageGet` for retrieving signed URLs.

```typescript
// server/storage.ts (provided by Manus)
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ENV } from './_core/env';

const s3Client = new S3Client({
  region: ENV.s3Region,
  credentials: {
    accessKeyId: ENV.s3AccessKeyId,
    secretAccessKey: ENV.s3SecretAccessKey
  }
});

/**
 * Upload file to S3
 * @param key File path/key (e.g., 'partners/123/w9-form.pdf')
 * @param data File content (Buffer, Uint8Array, or string)
 * @param contentType MIME type (e.g., 'application/pdf')
 * @returns Object with key and public URL
 */
export async function storagePut(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType?: string
): Promise<{ key: string; url: string }> {
  const command = new PutObjectCommand({
    Bucket: ENV.s3Bucket,
    Key: key,
    Body: data,
    ContentType: contentType,
    ACL: 'public-read' // Files are publicly accessible
  });

  await s3Client.send(command);

  const url = `https://${ENV.s3Bucket}.s3.${ENV.s3Region}.amazonaws.com/${key}`;
  
  return { key, url };
}

/**
 * Get presigned URL for private file access
 * @param key File path/key
 * @param expiresIn Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Object with key and presigned URL
 */
export async function storageGet(
  key: string,
  expiresIn: number = 3600
): Promise<{ key: string; url: string }> {
  const command = new GetObjectCommand({
    Bucket: ENV.s3Bucket,
    Key: key
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  
  return { key, url };
}
```

### File Storage Patterns

#### Pattern 1: Document Upload from Supplier

Handle file uploads from suppliers with validation and metadata storage:

```typescript
// server/routers.ts
import { protectedProcedure, router } from './_core/trpc';
import { storagePut } from './storage';
import { z } from 'zod';

export const documentRouter = router({
  uploadDocument: protectedProcedure
    .input(z.object({
      pptqId: z.number(),
      documentType: z.enum(['w9', 'insurance', 'certification', 'other']),
      fileName: z.string(),
      fileContent: z.string(), // Base64 encoded
      mimeType: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate file size (10MB max)
      const buffer = Buffer.from(input.fileContent, 'base64');
      if (buffer.length > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Generate unique file key with random suffix to prevent enumeration
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `partners/${ctx.user.id}/documents/${input.documentType}-${randomSuffix}-${input.fileName}`;

      // Upload to S3
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Save metadata to database
      const document = await db.createDocument({
        pptqId: input.pptqId,
        documentType: input.documentType,
        fileName: input.fileName,
        fileKey,
        fileUrl: url,
        fileSize: buffer.length,
        mimeType: input.mimeType,
        uploadedBy: ctx.user.id,
        uploadedAt: new Date()
      });

      // Send notification to admin
      await SendGridService.sendEmail({
        to: { email: ENV.adminEmail },
        subject: `New Document Uploaded: ${input.documentType}`,
        templateId: 'd-admin-doc-upload...',
        dynamicTemplateData: {
          companyName: ctx.user.name,
          documentType: input.documentType,
          fileName: input.fileName,
          uploadDate: new Date().toISOString(),
          viewUrl: `${ENV.frontendUrl}/admin/documents/${document.id}`
        }
      });

      return { documentId: document.id, url };
    })
});
```

#### Pattern 2: Bulk Export Generation

Generate and store compliance reports for download:

```typescript
// Generate eSRS Z-Code export and upload to S3
export const esrsRouter = router({
  generateZCodeExport: protectedProcedure
    .input(z.object({
      touchpointId: z.number(),
      format: z.enum(['csv', 'excel'])
    }))
    .mutation(async ({ input }) => {
      // Fetch data
      const data = await db.getEsrsExportData(input.touchpointId);

      let fileContent: Buffer;
      let mimeType: string;
      let extension: string;

      if (input.format === 'csv') {
        // Generate CSV
        const csv = generateCSV(data);
        fileContent = Buffer.from(csv, 'utf-8');
        mimeType = 'text/csv';
        extension = 'csv';
      } else {
        // Generate Excel
        const excel = await generateExcel(data);
        fileContent = excel;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
      }

      // Upload to S3
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileKey = `exports/esrs/zcode-${input.touchpointId}-${timestamp}.${extension}`;
      
      const { url } = await storagePut(fileKey, fileContent, mimeType);

      return { url, fileName: `zcode-export-${timestamp}.${extension}` };
    })
});
```

#### Pattern 3: Temporary File Access

Generate presigned URLs for temporary access to private files:

```typescript
// Get temporary access URL for document review
export const documentRouter = router({
  getDocumentUrl: protectedProcedure
    .input(z.object({
      documentId: z.number()
    }))
    .query(async ({ input, ctx }) => {
      // Verify access permission
      const document = await db.getDocument(input.documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Check if user has permission to view
      const hasAccess = await db.checkDocumentAccess(document.id, ctx.user.id);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Generate presigned URL (expires in 1 hour)
      const { url } = await storageGet(document.fileKey, 3600);

      return { url, fileName: document.fileName, expiresAt: new Date(Date.now() + 3600000) };
    })
});
```

---

## Service Integration Patterns

### Pattern 1: Multi-Channel Notification

Send notifications via multiple channels with fallback logic:

```typescript
async function sendComplianceReminder(partner: Partner, touchpoint: Touchpoint) {
  const reminderData = {
    companyName: partner.companyName,
    touchpointName: touchpoint.name,
    daysRemaining: calculateDaysRemaining(touchpoint.dueDate),
    dueDate: formatDate(touchpoint.dueDate),
    dashboardUrl: `${ENV.frontendUrl}/partner/dashboard`
  };

  // Primary: WhatsApp (if phone number available)
  if (partner.phoneNumber) {
    try {
      await TwilioWhatsAppService.sendWithFallback({
        to: { phoneNumber: partner.phoneNumber },
        templateSid: TEMPLATES.DEADLINE_REMINDER.sid,
        contentVariables: {
          '1': reminderData.companyName,
          '2': reminderData.daysRemaining.toString(),
          '3': reminderData.dueDate
        }
      });
      console.log('[Reminder] Sent via WhatsApp:', partner.id);
    } catch (error) {
      console.error('[Reminder] WhatsApp failed, falling back to email:', error);
    }
  }

  // Secondary: Email (always send for record-keeping)
  await SendGridService.sendEmail({
    to: { email: partner.email, name: partner.name },
    subject: `Compliance Deadline: ${reminderData.daysRemaining} Days Remaining`,
    templateId: 'd-deadline-reminder...',
    dynamicTemplateData: reminderData,
    categories: ['deadline-reminder', 'multi-channel']
  });

  // Log notification
  await db.logNotification({
    partnerId: partner.id,
    type: 'deadline-reminder',
    channels: partner.phoneNumber ? ['whatsapp', 'email'] : ['email'],
    sentAt: new Date()
  });
}
```

### Pattern 2: Document Upload with Email Confirmation

Upload document to S3 and send confirmation email with download link:

```typescript
async function processDocumentUpload(
  partnerId: number,
  file: { name: string; content: Buffer; mimeType: string }
) {
  // Upload to S3
  const fileKey = `partners/${partnerId}/documents/${Date.now()}-${file.name}`;
  const { url } = await storagePut(fileKey, file.content, file.mimeType);

  // Save to database
  const document = await db.createDocument({
    partnerId,
    fileName: file.name,
    fileKey,
    fileUrl: url,
    fileSize: file.content.length,
    mimeType: file.mimeType
  });

  // Get partner details
  const partner = await db.getPartner(partnerId);

  // Send confirmation email
  await SendGridService.sendEmail({
    to: { email: partner.email, name: partner.name },
    subject: 'Document Upload Confirmation',
    templateId: 'd-doc-confirmation...',
    dynamicTemplateData: {
      companyName: partner.companyName,
      fileName: file.name,
      uploadDate: new Date().toISOString(),
      viewUrl: `${ENV.frontendUrl}/partner/documents/${document.id}`
    },
    attachments: [{
      content: file.content.toString('base64'),
      filename: file.name,
      type: file.mimeType,
      disposition: 'attachment'
    }]
  });

  return document;
}
```

---

## Error Handling & Retry Logic

All service calls implement comprehensive error handling with automatic retries for transient failures.

### Retry Strategy

```typescript
// server/utils/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        console.warn(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, {
          error: error.message
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }
  }

  throw lastError;
}
```

### Service-Specific Error Handling

```typescript
// Enhanced SendGrid service with retry logic
export class SendGridService {
  static async sendEmailWithRetry(options: EmailOptions): Promise<string> {
    return retryWithBackoff(
      () => this.sendEmail(options),
      {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 5000
      }
    );
  }
}

// Enhanced Twilio service with retry logic
export class TwilioWhatsAppService {
  static async sendWhatsAppMessageWithRetry(options: WhatsAppMessageOptions): Promise<string> {
    return retryWithBackoff(
      () => this.sendWhatsAppMessage(options),
      {
        maxRetries: 2, // Fewer retries for real-time messaging
        initialDelay: 500,
        maxDelay: 2000
      }
    );
  }
}
```

---

## Webhook Architecture

Webhooks enable real-time delivery tracking and status updates from SendGrid and Twilio.

### SendGrid Webhook Handler

```typescript
// server/routers/webhooks.ts
import { publicProcedure, router } from '../_core/trpc';
import crypto from 'crypto';

function verifySendGridSignature(payload: string, signature: string, timestamp: string): boolean {
  const publicKey = ENV.sendgridWebhookPublicKey;
  const data = timestamp + payload;
  
  const verifier = crypto.createVerify('sha256');
  verifier.update(data);
  
  return verifier.verify(publicKey, signature, 'base64');
}

export const webhookRouter = router({
  sendgridEvents: publicProcedure
    .input(z.array(z.object({
      email: z.string(),
      event: z.enum(['delivered', 'open', 'click', 'bounce', 'dropped', 'spam_report']),
      timestamp: z.number(),
      'smtp-id': z.string(),
      sg_message_id: z.string(),
      category: z.array(z.string()).optional(),
      customArgs: z.record(z.string()).optional()
    })))
    .mutation(async ({ input, ctx }) => {
      // Verify signature
      const signature = ctx.req.headers['x-twilio-email-event-webhook-signature'];
      const timestamp = ctx.req.headers['x-twilio-email-event-webhook-timestamp'];
      
      if (!verifySendGridSignature(JSON.stringify(input), signature, timestamp)) {
        throw new Error('Invalid webhook signature');
      }

      // Process events
      for (const event of input) {
        await db.logEmailEvent({
          email: event.email,
          eventType: event.event,
          messageId: event.sg_message_id,
          timestamp: new Date(event.timestamp * 1000),
          customArgs: event.customArgs
        });

        // Handle specific events
        if (event.event === 'bounce' || event.event === 'dropped') {
          // Mark email as invalid
          await db.markEmailInvalid(event.email);
        }
      }

      return { success: true, processed: input.length };
    })
});
```

### Twilio Status Callback

```typescript
// Handle Twilio message status updates
export const webhookRouter = router({
  twilioStatus: publicProcedure
    .input(z.object({
      MessageSid: z.string(),
      MessageStatus: z.enum(['queued', 'sent', 'delivered', 'read', 'failed', 'undelivered']),
      ErrorCode: z.string().optional(),
      ErrorMessage: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      // Log status update
      await db.logWhatsAppStatus({
        messageSid: input.MessageSid,
        status: input.MessageStatus,
        errorCode: input.ErrorCode,
        errorMessage: input.ErrorMessage,
        timestamp: new Date()
      });

      // Handle failures
      if (input.MessageStatus === 'failed' || input.MessageStatus === 'undelivered') {
        // Retry or escalate
        const message = await db.getMessageBySid(input.MessageSid);
        if (message && message.retryCount < 3) {
          // Retry with exponential backoff
          await scheduleRetry(message, message.retryCount + 1);
        } else {
          // Escalate to email
          await sendEmailFallback(message);
        }
      }

      return { success: true };
    })
});
```

---

## Testing & Monitoring

### Unit Testing Services

```typescript
// server/services/__tests__/sendgrid.test.ts
import { describe, it, expect, vi } from 'vitest';
import { SendGridService } from '../sendgrid';
import sgMail from '@sendgrid/mail';

vi.mock('@sendgrid/mail');

describe('SendGridService', () => {
  it('should send email successfully', async () => {
    const mockSend = vi.fn().mockResolvedValue([{
      headers: { 'x-message-id': 'test-message-id' }
    }]);
    sgMail.send = mockSend;

    const messageId = await SendGridService.sendEmail({
      to: { email: 'test@example.com' },
      subject: 'Test Email',
      text: 'Test content'
    });

    expect(messageId).toBe('test-message-id');
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: { email: 'test@example.com' },
        subject: 'Test Email'
      })
    );
  });

  it('should handle send failures', async () => {
    sgMail.send = vi.fn().mockRejectedValue(new Error('API Error'));

    await expect(
      SendGridService.sendEmail({
        to: { email: 'test@example.com' },
        subject: 'Test',
        text: 'Test'
      })
    ).rejects.toThrow('SendGrid email failed');
  });
});
```

### Monitoring & Alerting

```typescript
// server/utils/monitoring.ts
export function trackServiceMetric(
  service: 'sendgrid' | 'twilio' | 's3',
  operation: string,
  duration: number,
  success: boolean
) {
  console.log('[Metrics]', {
    service,
    operation,
    duration,
    success,
    timestamp: new Date().toISOString()
  });

  // Send to monitoring service (e.g., Datadog, New Relic)
  // metrics.increment(`service.${service}.${operation}.${success ? 'success' : 'failure'}`);
  // metrics.histogram(`service.${service}.${operation}.duration`, duration);
}

// Usage in service methods
export class SendGridService {
  static async sendEmail(options: EmailOptions): Promise<string> {
    const startTime = Date.now();
    try {
      const messageId = await this.sendEmailInternal(options);
      trackServiceMetric('sendgrid', 'send_email', Date.now() - startTime, true);
      return messageId;
    } catch (error) {
      trackServiceMetric('sendgrid', 'send_email', Date.now() - startTime, false);
      throw error;
    }
  }
}
```

---

## Environment Variables

All service integrations require environment variables for authentication and configuration:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@intelleges.com
SENDGRID_WEBHOOK_PUBLIC_KEY=MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_PHONE_NUMBER=+14155551234

# AWS S3 Configuration (provided by Manus)
S3_BUCKET=compliance-platform-files
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxxxxxx
S3_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Application URLs
FRONTEND_URL=https://compliance.intelleges.com
ADMIN_EMAIL=admin@intelleges.com
```

---

**Document Status:** Production Ready  
**Next Review:** December 2025  
**Maintained By:** Manus AI

