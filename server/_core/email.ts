/**
 * Email Service using SendGrid
 * 
 * Provides email sending functionality for approval workflow notifications
 * and other system communications.
 */

import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn("[Email] SENDGRID_API_KEY not found in environment variables");
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Send an email using SendGrid
 * 
 * @param options Email options (to, subject, html, from, cc, bcc)
 * @returns Promise<boolean> - true if sent successfully, false otherwise
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.error("[Email] Cannot send email: SENDGRID_API_KEY not configured");
    return false;
  }

  try {
    const msg = {
      to: options.to,
      from: options.from || "noreply@intelleges.com", // Default sender
      subject: options.subject,
      html: options.html,
      ...(options.cc && { cc: options.cc }),
      ...(options.bcc && { bcc: options.bcc }),
    };

    await sgMail.send(msg);
    console.log(`[Email] Sent successfully to: ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
    return true;
  } catch (error: any) {
    console.error("[Email] Failed to send email:", error.message);
    if (error.response) {
      console.error("[Email] SendGrid error response:", error.response.body);
    }
    return false;
  }
}

/**
 * Email Templates for Approval Workflow
 */

export function getReviewRequestEmailTemplate(data: {
  reviewerName: string;
  partnerName: string;
  protocolName: string;
  touchpointTitle: string;
  submittedDate: string;
  dashboardUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #3b82f6; }
        .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Compliance Review Required</h1>
        </div>
        <div class="content">
          <p>Hello ${data.reviewerName},</p>
          <p>A new questionnaire submission requires your review and approval:</p>
          
          <div class="details">
            <p><strong>Partner:</strong> ${data.partnerName}</p>
            <p><strong>Campaign:</strong> ${data.protocolName}</p>
            <p><strong>Touchpoint:</strong> ${data.touchpointTitle}</p>
            <p><strong>Submitted:</strong> ${data.submittedDate}</p>
          </div>
          
          <p>Please log in to the IntellegesQMS dashboard to review and approve or reject this submission.</p>
          
          <a href="${data.dashboardUrl}" class="button">Review Submission</a>
        </div>
        <div class="footer">
          <p>This is an automated notification from the Federal Compliance Management System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getApprovalEmailTemplate(data: {
  partnerName: string;
  protocolName: string;
  touchpointTitle: string;
  reviewerName: string;
  approvedDate: string;
  notes?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #10b981; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Submission Approved</h1>
        </div>
        <div class="content">
          <p>Dear ${data.partnerName},</p>
          <p>Your questionnaire submission has been approved:</p>
          
          <div class="details">
            <p><strong>Campaign:</strong> ${data.protocolName}</p>
            <p><strong>Touchpoint:</strong> ${data.touchpointTitle}</p>
            <p><strong>Reviewed by:</strong> ${data.reviewerName}</p>
            <p><strong>Approved on:</strong> ${data.approvedDate}</p>
            ${data.notes ? `<p><strong>Reviewer Notes:</strong> ${data.notes}</p>` : ""}
          </div>
          
          <p>Thank you for your compliance with our requirements.</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from the Federal Compliance Management System.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getRejectionEmailTemplate(data: {
  partnerName: string;
  protocolName: string;
  touchpointTitle: string;
  reviewerName: string;
  rejectedDate: string;
  notes: string;
  dashboardUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #ef4444; }
        .notes { background-color: #fef2f2; padding: 15px; margin: 15px 0; border-left: 4px solid #f87171; }
        .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Submission Requires Revision</h1>
        </div>
        <div class="content">
          <p>Dear ${data.partnerName},</p>
          <p>Your questionnaire submission has been reviewed and requires revision:</p>
          
          <div class="details">
            <p><strong>Campaign:</strong> ${data.protocolName}</p>
            <p><strong>Touchpoint:</strong> ${data.touchpointTitle}</p>
            <p><strong>Reviewed by:</strong> ${data.reviewerName}</p>
            <p><strong>Rejected on:</strong> ${data.rejectedDate}</p>
          </div>
          
          <div class="notes">
            <p><strong>Reason for Rejection:</strong></p>
            <p>${data.notes}</p>
          </div>
          
          <p>Please review the feedback above and resubmit your questionnaire with the necessary corrections.</p>
          
          <a href="${data.dashboardUrl}" class="button">Revise Submission</a>
        </div>
        <div class="footer">
          <p>This is an automated notification from the Federal Compliance Management System.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getSupplierConfirmationEmailTemplate(data: {
  partnerName: string;
  questionnaireName: string;
  submittedDate: string;
  confirmationNumber: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #10b981; }
        .confirmation { background-color: #d1fae5; padding: 15px; margin: 15px 0; text-align: center; font-size: 18px; font-weight: bold; color: #065f46; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Questionnaire Submitted Successfully</h1>
        </div>
        <div class="content">
          <p>Dear ${data.partnerName},</p>
          <p>Thank you for completing and submitting your questionnaire. We have successfully received your responses.</p>
          
          <div class="confirmation">
            Confirmation #: ${data.confirmationNumber}
          </div>
          
          <div class="details">
            <p><strong>Questionnaire:</strong> ${data.questionnaireName}</p>
            <p><strong>Submitted:</strong> ${data.submittedDate}</p>
          </div>
          
          <p>Your submission is now under review by our procurement team. You will receive a notification once the review is complete.</p>
          
          <p>If you have any questions, please contact your procurement representative.</p>
        </div>
        <div class="footer">
          <p>This is an automated confirmation from the Federal Compliance Management System.</p>
          <p>Please save this email for your records.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getProcurementAlertEmailTemplate(data: {
  partnerName: string;
  questionnaireName: string;
  submittedDate: string;
  confirmationNumber: string;
  totalQuestions: number;
  dashboardUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #3b82f6; }
        .stats { background-color: #dbeafe; padding: 15px; margin: 15px 0; }
        .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Questionnaire Submission</h1>
        </div>
        <div class="content">
          <p>A supplier has completed and submitted their questionnaire:</p>
          
          <div class="details">
            <p><strong>Supplier:</strong> ${data.partnerName}</p>
            <p><strong>Questionnaire:</strong> ${data.questionnaireName}</p>
            <p><strong>Submitted:</strong> ${data.submittedDate}</p>
            <p><strong>Confirmation #:</strong> ${data.confirmationNumber}</p>
          </div>
          
          <div class="stats">
            <p><strong>Completion Summary:</strong></p>
            <p>${data.totalQuestions} questions answered</p>
          </div>
          
          <p>Please review the submission in the dashboard and take appropriate action.</p>
          
          <a href="${data.dashboardUrl}" class="button">Review Submission</a>
        </div>
        <div class="footer">
          <p>This is an automated notification from the Federal Compliance Management System.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
