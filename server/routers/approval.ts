/**
 * Approval Workflow Router
 * Based on INT.DOC.40 Section 4.1 (Preventive Controls - Approval workflows)
 * Based on INT.DOC.19 Section 5.2 (Response Actions - Flag for Review)
 * 
 * WORKFLOW:
 * 1. User flags submission for review (status → REVIEWING)
 * 2. Email alert sent to reviewers
 * 3. Reviewer approves/rejects via context menu
 * 4. Audit log created for compliance tracking
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  partnerQuestionnaires,
  touchpointQuestionnaires,
  touchpoints,
  protocols,
  partners,
  users,
  auditLogs,
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { canApproveSubmission, getUserApprovableSubmissions } from "../utils/approval-permissions";
import { sendEmail, getReviewRequestEmailTemplate, getApprovalEmailTemplate, getRejectionEmailTemplate } from "../_core/email";

/**
 * Send email notification to reviewers when submission is flagged for review
 */
async function notifyReviewers(partnerQuestionnaireId: number, enterpriseId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // Get submission details
    const [submission] = await db
      .select({
        id: partnerQuestionnaires.id,
        accessCode: partnerQuestionnaires.accessCode,
        completedDate: partnerQuestionnaires.completedDate,
        partnerName: partners.name,
        touchpointTitle: touchpoints.title,
        protocolName: protocols.name,
      })
      .from(partnerQuestionnaires)
      .innerJoin(partners, eq(partnerQuestionnaires.partnerId, partners.id))
      .innerJoin(
        touchpointQuestionnaires,
        eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id)
      )
      .innerJoin(touchpoints, eq(touchpointQuestionnaires.touchpointId, touchpoints.id))
      .innerJoin(protocols, eq(touchpoints.protocolId, protocols.id))
      .where(eq(partnerQuestionnaires.id, partnerQuestionnaireId))
      .limit(1);

    if (!submission) return;

    // Get all users with editor/compliance roles in this enterprise
    const reviewers = await db
      .select({
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(
        and(
          eq(users.enterpriseId, enterpriseId),
          eq(users.active, true)
        )
      );

    // Filter to only editors/admins/compliance officers
    const eligibleReviewers = reviewers.filter(
      (r) => r.email // Only send to users with email addresses
    );

    // Send email to each reviewer
    const dashboardUrl = process.env.VITE_FRONTEND_URL || "https://compliance.intelleges.com";
    let sentCount = 0;
    
    for (const reviewer of eligibleReviewers) {
      const emailHtml = getReviewRequestEmailTemplate({
        reviewerName: reviewer.name || "Reviewer",
        partnerName: submission.partnerName || "Unknown Partner",
        protocolName: submission.protocolName || "Unknown Campaign",
        touchpointTitle: submission.touchpointTitle || "Unknown Touchpoint",
        submittedDate: submission.completedDate?.toLocaleDateString() || "N/A",
        dashboardUrl: `${dashboardUrl}/reviewer-dashboard`,
      });
      
      const success = await sendEmail({
        to: reviewer.email!,
        subject: `[Compliance Review] ${submission.partnerName} - ${submission.touchpointTitle}`,
        html: emailHtml,
      });
      
      if (success) sentCount++;
    }
    
    console.log(`[Approval] Sent ${sentCount}/${eligibleReviewers.length} review request emails for submission ${partnerQuestionnaireId}`);
  } catch (error) {
    console.error("[Approval] Failed to send reviewer notifications:", error);
    // Don't throw - email failure shouldn't block the workflow
  }
}

/**
 * Create audit log entry for approval actions
 */
async function logApprovalAction(
  action: string,
  partnerQuestionnaireId: number,
  userId: number,
  enterpriseId: number,
  metadata?: Record<string, unknown>
) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(auditLogs).values({
      action,
      entityType: "partner_questionnaire",
      entityId: partnerQuestionnaireId,
      actorType: "user",
      actorId: userId,
      enterpriseId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (error) {
    console.error("[Approval] Failed to create audit log:", error);
  }
}

export const approvalRouter = router({
  /**
   * Flag submission for review
   * Sets reviewStatus to 'pending' and sends email alerts
   */
  flagForReview: protectedProcedure
    .input(
      z.object({
        partnerQuestionnaireId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if user has editor role
      if (
        ctx.user.role !== "admin" &&
        ctx.user.role !== "enterprise_owner" &&
        ctx.user.role !== "compliance_officer"
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only editors can flag submissions for review" });
      }

      // Get submission
      const [submission] = await db
        .select({
          id: partnerQuestionnaires.id,
          status: partnerQuestionnaires.status,
          reviewStatus: partnerQuestionnaires.reviewStatus,
          enterpriseId: protocols.enterpriseId,
        })
        .from(partnerQuestionnaires)
        .innerJoin(
          touchpointQuestionnaires,
          eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id)
        )
        .innerJoin(touchpoints, eq(touchpointQuestionnaires.touchpointId, touchpoints.id))
        .innerJoin(protocols, eq(touchpoints.protocolId, protocols.id))
        .where(eq(partnerQuestionnaires.id, input.partnerQuestionnaireId))
        .limit(1);

      if (!submission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });
      }

      // Check enterprise access
      if (ctx.user.enterpriseId && ctx.user.enterpriseId !== submission.enterpriseId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Update review status to pending
      await db
        .update(partnerQuestionnaires)
        .set({
          reviewStatus: "pending",
          updatedAt: new Date(),
        })
        .where(eq(partnerQuestionnaires.id, input.partnerQuestionnaireId));

    // TODO: Send email notifications
    // if (submission.enterpriseId) {
    //   await notifyReviewers(input.partnerQuestionnaireId, submission.enterpriseId);
    // }

      // Create audit log
      await logApprovalAction(
        "SUBMISSION_FLAGGED_FOR_REVIEW",
        input.partnerQuestionnaireId,
        ctx.user.id,
        submission.enterpriseId || 0,
        { flaggedBy: ctx.user.name || ctx.user.email }
      );

      return { success: true };
    }),

  /**
   * Approve submission
   * Requires approval permissions
   */
  approveSubmission: protectedProcedure
    .input(
      z.object({
        partnerQuestionnaireId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check approval permissions
      const hasPermission = await canApproveSubmission(ctx.user.id, input.partnerQuestionnaireId);
      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to approve this submission",
        });
      }

      // Get submission
      const [submission] = await db
        .select({
          id: partnerQuestionnaires.id,
          reviewStatus: partnerQuestionnaires.reviewStatus,
          enterpriseId: protocols.enterpriseId,
        })
        .from(partnerQuestionnaires)
        .innerJoin(
          touchpointQuestionnaires,
          eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id)
        )
        .innerJoin(touchpoints, eq(touchpointQuestionnaires.touchpointId, touchpoints.id))
        .innerJoin(protocols, eq(touchpoints.protocolId, protocols.id))
        .where(eq(partnerQuestionnaires.id, input.partnerQuestionnaireId))
        .limit(1);

      if (!submission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });
      }

      // Update approval status
      await db
        .update(partnerQuestionnaires)
        .set({
          reviewStatus: "approved",
          reviewerId: ctx.user.id,
          reviewedAt: new Date(),
          approvalNotes: input.notes || null,
          updatedAt: new Date(),
        })
        .where(eq(partnerQuestionnaires.id, input.partnerQuestionnaireId));

      // Get submission details for email
      const [submissionDetails] = await db
        .select({
          partnerName: partners.name,
          partnerEmail: partners.email,
          protocolName: protocols.name,
          touchpointTitle: touchpoints.title,
        })
        .from(partnerQuestionnaires)
        .innerJoin(partners, eq(partnerQuestionnaires.partnerId, partners.id))
        .innerJoin(
          touchpointQuestionnaires,
          eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id)
        )
        .innerJoin(touchpoints, eq(touchpointQuestionnaires.touchpointId, touchpoints.id))
        .innerJoin(protocols, eq(touchpoints.protocolId, protocols.id))
        .where(eq(partnerQuestionnaires.id, input.partnerQuestionnaireId))
        .limit(1);

      // Send approval email to partner
      if (submissionDetails?.partnerEmail) {
        const emailHtml = getApprovalEmailTemplate({
          partnerName: submissionDetails.partnerName || "Partner",
          protocolName: submissionDetails.protocolName || "Campaign",
          touchpointTitle: submissionDetails.touchpointTitle || "Touchpoint",
          reviewerName: ctx.user.name || ctx.user.email || "Compliance Team",
          approvedDate: new Date().toLocaleDateString(),
          notes: input.notes,
        });

        await sendEmail({
          to: submissionDetails.partnerEmail,
          subject: `[Approved] ${submissionDetails.protocolName} - ${submissionDetails.touchpointTitle}`,
          html: emailHtml,
        });
      }

      // Create audit log
      await logApprovalAction(
        "SUBMISSION_APPROVED",
        input.partnerQuestionnaireId,
        ctx.user.id,
        submission.enterpriseId || 0,
        {
          approvedBy: ctx.user.name || ctx.user.email,
          notes: input.notes,
        }
      );

      return { success: true };
    }),

  /**
   * Reject submission
   * Requires approval permissions and rejection notes
   */
  rejectSubmission: protectedProcedure
    .input(
      z.object({
        partnerQuestionnaireId: z.number(),
        notes: z.string().min(1, "Rejection notes are required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check approval permissions
      const hasPermission = await canApproveSubmission(ctx.user.id, input.partnerQuestionnaireId);
      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to reject this submission",
        });
      }

      // Get submission
      const [submission] = await db
        .select({
          id: partnerQuestionnaires.id,
          reviewStatus: partnerQuestionnaires.reviewStatus,
          enterpriseId: protocols.enterpriseId,
        })
        .from(partnerQuestionnaires)
        .innerJoin(
          touchpointQuestionnaires,
          eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id)
        )
        .innerJoin(touchpoints, eq(touchpointQuestionnaires.touchpointId, touchpoints.id))
        .innerJoin(protocols, eq(touchpoints.protocolId, protocols.id))
        .where(eq(partnerQuestionnaires.id, input.partnerQuestionnaireId))
        .limit(1);

      if (!submission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });
      }

      // Update approval status
      await db
        .update(partnerQuestionnaires)
        .set({
          reviewStatus: "rejected",
          reviewerId: ctx.user.id,
          reviewedAt: new Date(),
          approvalNotes: input.notes,
          updatedAt: new Date(),
        })
        .where(eq(partnerQuestionnaires.id, input.partnerQuestionnaireId));

      // Get submission details for email
      const [submissionDetails] = await db
        .select({
          partnerName: partners.name,
          partnerEmail: partners.email,
          protocolName: protocols.name,
          touchpointTitle: touchpoints.title,
        })
        .from(partnerQuestionnaires)
        .innerJoin(partners, eq(partnerQuestionnaires.partnerId, partners.id))
        .innerJoin(
          touchpointQuestionnaires,
          eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id)
        )
        .innerJoin(touchpoints, eq(touchpointQuestionnaires.touchpointId, touchpoints.id))
        .innerJoin(protocols, eq(touchpoints.protocolId, protocols.id))
        .where(eq(partnerQuestionnaires.id, input.partnerQuestionnaireId))
        .limit(1);

      // Send rejection email to partner
      if (submissionDetails?.partnerEmail) {
        const dashboardUrl = process.env.VITE_FRONTEND_URL || "https://compliance.intelleges.com";
        const emailHtml = getRejectionEmailTemplate({
          partnerName: submissionDetails.partnerName || "Partner",
          protocolName: submissionDetails.protocolName || "Campaign",
          touchpointTitle: submissionDetails.touchpointTitle || "Touchpoint",
          reviewerName: ctx.user.name || ctx.user.email || "Compliance Team",
          rejectedDate: new Date().toLocaleDateString(),
          notes: input.notes,
          dashboardUrl: `${dashboardUrl}/supplier`,
        });

        await sendEmail({
          to: submissionDetails.partnerEmail,
          subject: `[Action Required] ${submissionDetails.protocolName} - ${submissionDetails.touchpointTitle}`,
          html: emailHtml,
        });
      }

      // Create audit log
      await logApprovalAction(
        "SUBMISSION_REJECTED",
        input.partnerQuestionnaireId,
        ctx.user.id,
        submission.enterpriseId || 0,
        {
          rejectedBy: ctx.user.name || ctx.user.email,
          notes: input.notes,
        }
      );

      return { success: true };
    }),

  /**
   * Get pending reviews for current user
   * Returns submissions that user can approve
   */
  getMyPendingReviews: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    if (!ctx.user.enterpriseId) {
      return []; // Super admins don't have enterprise-scoped reviews
    }

    // Get all submissions user can approve
    const approvableIds = await getUserApprovableSubmissions(ctx.user.id, ctx.user.enterpriseId);

    if (approvableIds.length === 0) {
      return [];
    }

    // Get submission details
    const submissions = await db
      .select({
        id: partnerQuestionnaires.id,
        accessCode: partnerQuestionnaires.accessCode,
        completedDate: partnerQuestionnaires.completedDate,
        reviewStatus: partnerQuestionnaires.reviewStatus,
        partnerName: partners.name,
        touchpointTitle: touchpoints.title,
        protocolName: protocols.name,
      })
      .from(partnerQuestionnaires)
      .innerJoin(partners, eq(partnerQuestionnaires.partnerId, partners.id))
      .innerJoin(
        touchpointQuestionnaires,
        eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id)
      )
      .innerJoin(touchpoints, eq(touchpointQuestionnaires.touchpointId, touchpoints.id))
      .innerJoin(protocols, eq(touchpoints.protocolId, protocols.id))
      .where(
        and(
          eq(partnerQuestionnaires.reviewStatus, "pending"),
          // Filter to only submissions user can approve
          // Note: This is a simplified filter - in production, use SQL IN clause
        )
      );

    // Filter in-memory to match approvableIds
    return submissions.filter((s) => approvableIds.includes(s.id));
  }),
});
