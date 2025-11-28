/**
 * Approval Permissions Utilities
 * Based on INT.DOC.40 Section 4.1 (Preventive Controls - Approval workflows)
 * Based on INT.DOC.19 Section 5.2 (Response Actions - Flag for Review)
 * 
 * PERMISSION MODEL:
 * - Level 1: Role-based (only 'editor' or 'admin' roles can approve)
 * - Level 2: Granular scope (restrict to specific groups/protocols/touchpoints)
 */

import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import {
  users,
  approvalPermissions,
  partnerQuestionnaires,
  touchpointQuestionnaires,
  touchpoints,
  partnerGroups,
  partners,
  protocols,
} from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";

/**
 * Check if user has editor/admin role (Level 1 permission check)
 */
export function hasEditorRole(user: User): boolean {
  return (
    user.role === "admin" ||
    user.role === "enterprise_owner" ||
    user.role === "compliance_officer"
  );
}

/**
 * Check if user can approve a specific partner questionnaire
 * 
 * @param userId - User attempting to approve
 * @param partnerQuestionnaireId - ID of the submission to approve
 * @returns true if user has permission, false otherwise
 */
export async function canApproveSubmission(
  userId: number,
  partnerQuestionnaireId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Get user to check role
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return false;

  // Level 1: Check if user has editor/admin role
  if (!hasEditorRole(user)) {
    return false;
  }

  // Get submission with joined touchpoint questionnaire, touchpoint, and protocol
  const [submission] = await db
    .select({
      pqId: partnerQuestionnaires.id,
      partnerId: partnerQuestionnaires.partnerId,
      touchpointQuestionnaireId: partnerQuestionnaires.touchpointQuestionnaireId,
      touchpointId: touchpointQuestionnaires.touchpointId,
      groupId: touchpointQuestionnaires.groupId,
      protocolId: touchpoints.protocolId,
      enterpriseId: protocols.enterpriseId,
    })
    .from(partnerQuestionnaires)
    .innerJoin(
      touchpointQuestionnaires,
      eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id)
    )
    .innerJoin(touchpoints, eq(touchpointQuestionnaires.touchpointId, touchpoints.id))
    .innerJoin(
      protocols,
      eq(touchpoints.protocolId, protocols.id)
    )
    .where(eq(partnerQuestionnaires.id, partnerQuestionnaireId))
    .limit(1);

  if (!submission) return false;

  // Check enterprise match
  if (user.enterpriseId && user.enterpriseId !== submission.enterpriseId) {
    return false;
  }

  // Get partner's groups
  const partnerGroupIds = await db
    .select({ groupId: partnerGroups.groupId })
    .from(partnerGroups)
    .where(eq(partnerGroups.partnerId, submission.partnerId));

  // Level 2: Check granular permissions
  if (!submission.enterpriseId) {
    return false; // Cannot approve submissions without enterprise context
  }
  
  const userPermissions = await db
    .select()
    .from(approvalPermissions)
    .where(
      and(
        eq(approvalPermissions.userId, userId),
        eq(approvalPermissions.active, true),
        eq(approvalPermissions.enterpriseId, submission.enterpriseId)
      )
    );

  // If no granular permissions exist → enterprise-wide approval rights
  if (userPermissions.length === 0) {
    return true;
  }

  // Check if any permission matches the submission scope
  for (const perm of userPermissions) {
    // Enterprise-wide permission (all scopes null)
    if (!perm.groupId && !perm.protocolId && !perm.touchpointId) {
      return true;
    }

    // Touchpoint-specific permission
    if (perm.touchpointId === submission.touchpointId) {
      return true;
    }

    // Protocol-specific permission
    if (perm.protocolId === submission.protocolId) {
      return true;
    }

    // Group-specific permission
    if (perm.groupId) {
      // Check if submission is for this group (touchpointQuestionnaire.groupId)
      if (perm.groupId === submission.groupId) {
        return true;
      }
      // Or if partner belongs to this group
      if (partnerGroupIds.some((pg) => pg.groupId === perm.groupId)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get all submissions that a user can approve
 * Used for "My Pending Reviews" dashboard
 * 
 * @param userId - User ID
 * @param enterpriseId - Enterprise ID
 * @returns Array of partner questionnaire IDs
 */
export async function getUserApprovableSubmissions(
  userId: number,
  enterpriseId: number
): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  // Get user to check role
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !hasEditorRole(user)) {
    return [];
  }

  // Get user's permissions
  const userPermissions = await db
    .select()
    .from(approvalPermissions)
    .where(
      and(
        eq(approvalPermissions.userId, userId),
        eq(approvalPermissions.active, true),
        eq(approvalPermissions.enterpriseId, enterpriseId)
      )
    );

  // If no granular permissions → can approve all submissions in enterprise
  if (userPermissions.length === 0) {
    const allSubmissions = await db
      .select({ id: partnerQuestionnaires.id })
      .from(partnerQuestionnaires)
      .innerJoin(
        touchpointQuestionnaires,
        eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id)
      )
      .innerJoin(touchpoints, eq(touchpointQuestionnaires.touchpointId, touchpoints.id))
      .innerJoin(
        protocols,
        eq(touchpoints.protocolId, protocols.id)
      )
      .where(
        and(
          eq(protocols.enterpriseId, enterpriseId),
          eq(partnerQuestionnaires.reviewStatus, "pending")
        )
      );
    return allSubmissions.map((s) => s.id);
  }

  // Build list of approvable submission IDs based on permissions
  const approvableIds = new Set<number>();

  for (const perm of userPermissions) {
    // Enterprise-wide permission
    if (!perm.groupId && !perm.protocolId && !perm.touchpointId) {
      const allSubmissions = await db
        .select({ id: partnerQuestionnaires.id })
        .from(partnerQuestionnaires)
        .innerJoin(
          touchpointQuestionnaires,
          eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id)
        )
        .innerJoin(touchpoints, eq(touchpointQuestionnaires.touchpointId, touchpoints.id))
        .innerJoin(
          protocols,
          eq(touchpoints.protocolId, protocols.id)
        )
        .where(
          and(
            eq(protocols.enterpriseId, enterpriseId),
            eq(partnerQuestionnaires.reviewStatus, "pending")
          )
        );
      allSubmissions.forEach((s) => approvableIds.add(s.id));
      continue;
    }

    // Touchpoint-specific permission
    if (perm.touchpointId) {
      const submissions = await db
        .select({ id: partnerQuestionnaires.id })
        .from(partnerQuestionnaires)
        .innerJoin(
          touchpointQuestionnaires,
          eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id)
        )
        .where(
          and(
            eq(touchpointQuestionnaires.touchpointId, perm.touchpointId),
            eq(partnerQuestionnaires.reviewStatus, "pending")
          )
        );
      submissions.forEach((s) => approvableIds.add(s.id));
    }

    // Protocol-specific permission
    if (perm.protocolId) {
      const submissions = await db
        .select({ id: partnerQuestionnaires.id })
        .from(partnerQuestionnaires)
        .innerJoin(
          touchpointQuestionnaires,
          eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id)
        )
        .innerJoin(touchpoints, eq(touchpointQuestionnaires.touchpointId, touchpoints.id))
        .where(
          and(
            eq(touchpoints.protocolId, perm.protocolId),
            eq(partnerQuestionnaires.reviewStatus, "pending")
          )
        );
      submissions.forEach((s) => approvableIds.add(s.id));
    }

    // Group-specific permission
    if (perm.groupId) {
      // Get submissions where touchpointQuestionnaire.groupId matches
      const groupSubmissions = await db
        .select({ id: partnerQuestionnaires.id })
        .from(partnerQuestionnaires)
        .innerJoin(
          touchpointQuestionnaires,
          eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id)
        )
        .where(
          and(
            eq(touchpointQuestionnaires.groupId, perm.groupId),
            eq(partnerQuestionnaires.reviewStatus, "pending")
          )
        );
      groupSubmissions.forEach((s) => approvableIds.add(s.id));

      // Also get submissions where partner belongs to this group
      const partnersInGroup = await db
        .select({ partnerId: partnerGroups.partnerId })
        .from(partnerGroups)
        .where(eq(partnerGroups.groupId, perm.groupId));

      for (const pg of partnersInGroup) {
        const submissions = await db
          .select({ id: partnerQuestionnaires.id })
          .from(partnerQuestionnaires)
          .where(
            and(
              eq(partnerQuestionnaires.partnerId, pg.partnerId),
              eq(partnerQuestionnaires.reviewStatus, "pending")
            )
          );
        submissions.forEach((s) => approvableIds.add(s.id));
      }
    }
  }

  return Array.from(approvableIds);
}
