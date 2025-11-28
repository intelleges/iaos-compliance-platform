import { eventBus } from './eventBus';
import { logAudit } from '../services/audit';
import { sendEmail } from '../services/sendgrid';
import { notifyOwner } from '../_core/notification';
import { generateQuestionnairePDF } from '../services/pdf';
import { storagePut } from '../storage';
import { getDb } from '../db';
import { partnerQuestionnaires, documents } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Event Handlers for Assignment Lifecycle
 * Based on INT.DOC.11 Section 2 - Event Handlers
 * 
 * These handlers respond to events emitted by the event bus and perform
 * side effects like sending emails, logging audits, and triggering notifications.
 */

/**
 * Initialize all event handlers
 * Call this once at server startup
 */
export function registerEventHandlers() {
  // ============================================================================
  // ASSIGNMENT LIFECYCLE EVENTS
  // ============================================================================

  /**
   * assignment.created - New assignment created
   */
  eventBus.on('assignment.created', async (event) => {
    await logAudit({
      action: 'ASSIGNMENT_CREATED',
      entityType: 'assignment',
      entityId: event.assignmentId,
      actorType: 'user',
      actorId: event.createdBy,
      enterpriseId: event.enterpriseId,
      metadata: {
        partnerId: event.partnerId,
        touchpointId: event.touchpointId,
      },
    });
  });

  /**
   * assignment.invited - Invitation email sent to supplier
   */
  eventBus.on('assignment.invited', async (event) => {
    await logAudit({
      action: 'ASSIGNMENT_INVITED',
      entityType: 'assignment',
      entityId: event.assignmentId,
      actorType: 'user',
      actorId: event.invitedBy,
      enterpriseId: event.enterpriseId,
      metadata: {
        partnerId: event.partnerId,
        email: event.email,
        accessCode: event.accessCode,
        dueDate: event.dueDate,
      },
    });
  });

  /**
   * assignment.accessed - Supplier opened the questionnaire
   */
  eventBus.on('assignment.accessed', async (event) => {
    await logAudit({
      action: 'ASSIGNMENT_ACCESSED',
      entityType: 'assignment',
      entityId: event.assignmentId,
      actorType: 'supplier',
      actorId: event.partnerId,
      enterpriseId: event.enterpriseId,
      metadata: {
        accessCode: event.accessCode,
        firstAccess: event.firstAccess,
      },
    });
  });

  /**
   * assignment.started - Supplier began filling out the questionnaire
   */
  eventBus.on('assignment.started', async (event) => {
    await logAudit({
      action: 'ASSIGNMENT_STARTED',
      entityType: 'assignment',
      entityId: event.assignmentId,
      actorType: 'supplier',
      actorId: event.partnerId,
      enterpriseId: event.enterpriseId,
    });
  });

  /**
   * assignment.submitted - Supplier submitted the questionnaire
   * This is a critical event that triggers multiple side effects
   */
  eventBus.on('assignment.submitted', async (event) => {
    // 1. Log audit
    await logAudit({
      action: 'ASSIGNMENT_SUBMITTED',
      entityType: 'assignment',
      entityId: event.assignmentId,
      actorType: 'supplier',
      actorId: event.partnerId,
      enterpriseId: event.enterpriseId,
      metadata: {
        score: event.score,
        zcode: event.zcode,
        completedDate: event.completedDate,
      },
    });

    // 2. Send confirmation email to supplier
    if (event.email) {
      try {
        await sendEmail({
          to: event.email,
          subject: 'Questionnaire Submitted Successfully',
          templateId: 'QUESTIONNAIRE_CONFIRMATION',
          dynamicTemplateData: {
            partnerName: event.partnerName,
            touchpointTitle: event.touchpointTitle,
            completedDate: event.completedDate,
          },
        });
      } catch (error) {
        console.error('[Event Handler] Failed to send confirmation email:', error);
      }
    }

    // 3. Notify touchpoint owner
    try {
      await notifyOwner({
        title: `Questionnaire Submitted: ${event.partnerName}`,
        content: `${event.partnerName} has submitted their questionnaire for ${event.touchpointTitle}. Score: ${event.score}`,
      });
    } catch (error) {
      console.error('[Event Handler] Failed to notify owner:', error);
    }

    // 4. Generate signed PDF and store in S3
    try {
      const pdfBuffer = await generateQuestionnairePDF(event.assignmentId);
      const pdfKey = `questionnaires/${event.enterpriseId}/${event.assignmentId}/submission-${Date.now()}.pdf`;
      const { url: pdfUrl } = await storagePut(pdfKey, pdfBuffer, 'application/pdf');

      // Update assignment with PDF URL
      const db = await getDb();
      if (db) {
        await db
          .update(partnerQuestionnaires)
          .set({ pdfUrl })
          .where(eq(partnerQuestionnaires.id, event.assignmentId));

        // Create document record
        await db.insert(documents).values({
          partnerQuestionnaireId: event.assignmentId,
          fileName: `Questionnaire Submission - ${event.partnerName}.pdf`,
          fileUrl: pdfUrl,
          fileType: 'application/pdf',
          documentType: 'Questionnaire Submission',
          description: `Signed questionnaire submission PDF for ${event.partnerName}`,
          uploadedBy: event.partnerId,
        });
      }

      console.log(`[Event Handler] Generated PDF for assignment ${event.assignmentId}: ${pdfUrl}`);
    } catch (error) {
      console.error('[Event Handler] Failed to generate PDF:', error);
    }

    // 5. TODO: Check spinoff triggers (if score < threshold, create follow-up assignment)
    // 6. TODO: Process Z-Code for eSRS reporting
  });

  /**
   * assignment.delegated - Assignment delegated to another contact
   */
  eventBus.on('assignment.delegated', async (event) => {
    // 1. Log audit
    await logAudit({
      action: 'ASSIGNMENT_DELEGATED',
      entityType: 'assignment',
      entityId: event.assignmentId,
      actorType: 'supplier',
      actorId: event.partnerId,
      enterpriseId: event.enterpriseId,
      metadata: {
        originalContact: event.originalContact,
        newContact: event.newContact,
        newEmail: event.newEmail,
        reason: event.reason,
      },
    });

    // 2. Send invitation to new contact
    if (event.newEmail) {
      try {
        await sendEmail({
          to: event.newEmail,
          subject: `Questionnaire Delegated to You: ${event.touchpointTitle}`,
          templateId: 'QUESTIONNAIRE_DELEGATION',
          dynamicTemplateData: {
            newContactName: event.newContact,
            originalContactName: event.originalContact,
            touchpointTitle: event.touchpointTitle,
            accessCode: event.newAccessCode,
            dueDate: event.dueDate,
          },
        });
      } catch (error) {
        console.error('[Event Handler] Failed to send delegation email:', error);
      }
    }
  });

  /**
   * assignment.pastDue - Assignment is past due
   */
  eventBus.on('assignment.pastDue', async (event) => {
    await logAudit({
      action: 'ASSIGNMENT_PAST_DUE',
      entityType: 'assignment',
      entityId: event.assignmentId,
      actorType: 'system',
      enterpriseId: event.enterpriseId,
      metadata: {
        partnerId: event.partnerId,
        dueDate: event.dueDate,
        daysOverdue: event.daysOverdue,
      },
    });

    // Notify touchpoint owner
    try {
      await notifyOwner({
        title: `Assignment Past Due: ${event.partnerName}`,
        content: `${event.partnerName}'s questionnaire for ${event.touchpointTitle} is ${event.daysOverdue} days overdue.`,
      });
    } catch (error) {
      console.error('[Event Handler] Failed to notify owner:', error);
    }
  });

  // ============================================================================
  // EMAIL EVENTS (from SendGrid webhooks)
  // ============================================================================

  /**
   * email.delivered - Email successfully delivered
   */
  eventBus.on('email.delivered', async (event) => {
    await logAudit({
      action: 'EMAIL_DELIVERED',
      entityType: 'email',
      entityId: 0, // No entity ID for emails
      actorType: 'system',
      metadata: {
        email: event.email,
        messageId: event.messageId,
        assignmentId: event.assignmentId,
      },
    });
  });

  /**
   * email.opened - Email opened by recipient
   */
  eventBus.on('email.opened', async (event) => {
    await logAudit({
      action: 'EMAIL_OPENED',
      entityType: 'email',
      entityId: 0,
      actorType: 'system',
      metadata: {
        email: event.email,
        messageId: event.messageId,
        assignmentId: event.assignmentId,
      },
    });
  });

  /**
   * email.clicked - Link clicked in email
   */
  eventBus.on('email.clicked', async (event) => {
    await logAudit({
      action: 'EMAIL_CLICKED',
      entityType: 'email',
      entityId: 0,
      actorType: 'system',
      metadata: {
        email: event.email,
        messageId: event.messageId,
        url: event.url,
        assignmentId: event.assignmentId,
      },
    });
  });

  /**
   * email.bounced - Email bounced (delivery failed)
   * This is critical - we need to notify the touchpoint owner
   */
  eventBus.on('email.bounced', async (event) => {
    await logAudit({
      action: 'EMAIL_BOUNCED',
      entityType: 'email',
      entityId: 0,
      actorType: 'system',
      metadata: {
        email: event.email,
        messageId: event.messageId,
        reason: event.reason,
        bounce_classification: event.bounce_classification,
        assignmentId: event.assignmentId,
      },
    });

    // If this was an assignment invitation, notify the owner
    if (event.assignmentId) {
      try {
        await notifyOwner({
          title: `Email Bounced: ${event.email}`,
          content: `Assignment invitation email bounced. Reason: ${event.reason}. Please verify the supplier's email address.`,
        });
      } catch (error) {
        console.error('[Event Handler] Failed to notify owner:', error);
      }
    }
  });

  // ============================================================================
  // TOUCHPOINT EVENTS
  // ============================================================================

  /**
   * touchpoint.created - New touchpoint created
   */
  eventBus.on('touchpoint.created', async (event) => {
    await logAudit({
      action: 'TOUCHPOINT_CREATED',
      entityType: 'touchpoint',
      entityId: event.touchpointId,
      actorType: 'user',
      actorId: event.createdBy,
      enterpriseId: event.enterpriseId,
      metadata: {
        title: event.title,
        protocolId: event.protocolId,
      },
    });
  });

  /**
   * touchpoint.activated - Touchpoint activated (invitations sent)
   */
  eventBus.on('touchpoint.activated', async (event) => {
    await logAudit({
      action: 'TOUCHPOINT_ACTIVATED',
      entityType: 'touchpoint',
      entityId: event.touchpointId,
      actorType: 'user',
      actorId: event.activatedBy,
      enterpriseId: event.enterpriseId,
      metadata: {
        assignmentCount: event.assignmentCount,
      },
    });
  });

  /**
   * touchpoint.closed - Touchpoint closed (no more submissions accepted)
   */
  eventBus.on('touchpoint.closed', async (event) => {
    await logAudit({
      action: 'TOUCHPOINT_CLOSED',
      entityType: 'touchpoint',
      entityId: event.touchpointId,
      actorType: 'user',
      actorId: event.closedBy,
      enterpriseId: event.enterpriseId,
      metadata: {
        completionRate: event.completionRate,
      },
    });
  });

  console.log('[Event Handlers] All event handlers registered successfully');
}
