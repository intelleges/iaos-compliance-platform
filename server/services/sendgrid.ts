/**
 * SendGrid Email Service
 * 
 * Handles all email communications for the Intelleges FCMS platform.
 * Critical for compliance reminders and supplier notifications when POs are blocked.
 * 
 * Use Cases:
 * - Automated compliance deadline reminders
 * - Questionnaire invitation emails
 * - Document upload confirmations
 * - Buyer-initiated urgent supplier contact
 */

import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@intelleges.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Intelleges FCMS';

if (!SENDGRID_API_KEY) {
  console.warn('[SendGrid] API key not configured - email sending disabled');
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  from?: {
    email: string;
    name: string;
  };
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    content: string; // Base64 encoded
    filename: string;
    type?: string;
    disposition?: 'attachment' | 'inline';
  }>;
}

/**
 * Send a single email
 */
export async function sendEmail(options: EmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!SENDGRID_API_KEY) {
    console.error('[SendGrid] Cannot send email - API key not configured');
    return { success: false, error: 'SendGrid API key not configured' };
  }

  try {
    const msg: any = {
      to: options.to,
      from: options.from || {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: options.subject,
      ...(options.replyTo && { replyTo: options.replyTo }),
      ...(options.cc && { cc: options.cc }),
      ...(options.bcc && { bcc: options.bcc }),
      ...(options.attachments && { attachments: options.attachments }),
    };

    // Use dynamic template if provided
    if (options.templateId) {
      msg.templateId = options.templateId;
      msg.dynamicTemplateData = options.dynamicTemplateData || {};
    } else {
      // Use plain text/HTML
      if (options.html) {
        msg.html = options.html;
      }
      if (options.text) {
        msg.text = options.text;
      }
    }

    const [response] = await sgMail.send(msg);
    
    console.log('[SendGrid] Email sent successfully', {
      to: options.to,
      subject: options.subject,
      statusCode: response.statusCode,
    });

    return {
      success: true,
      messageId: response.headers['x-message-id'] as string,
    };
  } catch (error: any) {
    console.error('[SendGrid] Failed to send email', {
      error: error.message,
      code: error.code,
      response: error.response?.body,
    });

    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send compliance reminder email to supplier
 * Critical use case: Buyer needs supplier to complete docs before PO can be issued
 */
export async function sendComplianceReminder(params: {
  supplierEmail: string;
  supplierName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  companyName: string;
  deadline: Date;
  missingDocuments: string[];
  accessCodeUrl: string;
  urgency?: 'normal' | 'urgent' | 'critical';
}): Promise<{ success: boolean; error?: string }> {
  const {
    supplierEmail,
    supplierName,
    buyerName,
    buyerEmail,
    buyerPhone,
    companyName,
    deadline,
    missingDocuments,
    accessCodeUrl,
    urgency = 'normal',
  } = params;

  const urgencyPrefix = urgency === 'critical' ? '🚨 URGENT: ' : urgency === 'urgent' ? '⚠️ ' : '';
  const daysUntilDeadline = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const subject = `${urgencyPrefix}Compliance Documents Required for ${companyName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .urgent { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
        .docs-list { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .cta-button { display: inline-block; background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .contact-box { background: #dbeafe; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Intelleges FCMS</h1>
          <p>Federal Compliance Management System</p>
        </div>
        <div class="content">
          <h2>Hello ${supplierName},</h2>
          
          ${urgency === 'critical' ? `
            <div class="urgent">
              <strong>⚠️ URGENT ACTION REQUIRED</strong><br>
              This compliance submission is blocking a Purchase Order. Please complete immediately.
            </div>
          ` : ''}
          
          <p>
            ${buyerName} from ${companyName} needs you to complete your compliance documentation.
            ${urgency === 'critical' ? 'This is blocking a Purchase Order and requires immediate attention.' : ''}
          </p>
          
          <p><strong>Deadline:</strong> ${deadline.toLocaleDateString()} (${daysUntilDeadline} days remaining)</p>
          
          <div class="docs-list">
            <h3>Missing Documents:</h3>
            <ul>
              ${missingDocuments.map(doc => `<li>${doc}</li>`).join('')}
            </ul>
          </div>
          
          <p>Please click the button below to access the compliance portal and submit your documents:</p>
          
          <a href="${accessCodeUrl}" class="cta-button">Access Compliance Portal</a>
          
          <div class="contact-box">
            <h3>Need Help?</h3>
            <p>Contact ${buyerName} directly:</p>
            <ul>
              <li>Email: <a href="mailto:${buyerEmail}">${buyerEmail}</a></li>
              ${buyerPhone ? `<li>Phone: ${buyerPhone}</li>` : ''}
            </ul>
            <p><em>They can walk you through the process if needed.</em></p>
          </div>
          
          <p>Thank you for your prompt attention to this matter.</p>
          
          <p>
            Best regards,<br>
            ${buyerName}<br>
            ${companyName}
          </p>
        </div>
        <div class="footer">
          <p>This is an automated message from Intelleges FCMS. Please do not reply to this email.</p>
          <p>For technical support, contact your compliance administrator.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hello ${supplierName},

${buyerName} from ${companyName} needs you to complete your compliance documentation.
${urgency === 'critical' ? 'This is blocking a Purchase Order and requires immediate attention.' : ''}

Deadline: ${deadline.toLocaleDateString()} (${daysUntilDeadline} days remaining)

Missing Documents:
${missingDocuments.map(doc => `- ${doc}`).join('\n')}

Please access the compliance portal here: ${accessCodeUrl}

Need help? Contact ${buyerName}:
- Email: ${buyerEmail}
${buyerPhone ? `- Phone: ${buyerPhone}` : ''}

Thank you for your prompt attention.

Best regards,
${buyerName}
${companyName}
  `.trim();

  return sendEmail({
    to: supplierEmail,
    subject,
    html,
    text,
    replyTo: buyerEmail,
  });
}

/**
 * Send questionnaire invitation email
 */
export async function sendQuestionnaireInvitation(params: {
  supplierEmail: string;
  supplierName: string;
  companyName: string;
  questionnaireName: string;
  deadline: Date;
  accessCodeUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const { supplierEmail, supplierName, companyName, questionnaireName, deadline, accessCodeUrl } = params;

  const subject = `Compliance Questionnaire: ${questionnaireName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hello ${supplierName},</h2>
        <p>${companyName} has requested that you complete the following compliance questionnaire:</p>
        <p><strong>${questionnaireName}</strong></p>
        <p><strong>Deadline:</strong> ${deadline.toLocaleDateString()}</p>
        <p>
          <a href="${accessCodeUrl}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Start Questionnaire
          </a>
        </p>
        <p>If you have any questions, please contact your ${companyName} representative.</p>
        <p>Thank you,<br>Intelleges FCMS</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: supplierEmail,
    subject,
    html,
  });
}

/**
 * Verify SendGrid configuration (for testing)
 */
export async function verifySendGridConfig(): Promise<{
  configured: boolean;
  valid?: boolean;
  error?: string;
}> {
  if (!SENDGRID_API_KEY) {
    return { configured: false };
  }

  try {
    // Test API key by making a simple API call
    const response = await fetch('https://api.sendgrid.com/v3/scopes', {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      },
    });

    if (response.ok) {
      return { configured: true, valid: true };
    } else {
      const error = await response.text();
      return { configured: true, valid: false, error };
    }
  } catch (error: any) {
    return { configured: true, valid: false, error: error.message };
  }
}
