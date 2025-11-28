/**
 * CUI (Controlled Unclassified Information) Access Logging Middleware
 * Per NIST 800-171 Section 3.1.13 - Employ cryptographic mechanisms to protect CUI
 * Per INT.DOC.25 Section 2.1 - Integrity controls and audit logging
 * 
 * Automatically logs CUI access events when users access touchpoints, questions,
 * or questionnaires marked with isCUI=true flag.
 */

import { logCUIAccess, type EntityType } from "./audit-logger";
import type { TrpcContext } from "../_core/context";

/**
 * Log CUI access for touchpoint retrieval
 */
export async function logTouchpointCUIAccess(
  ctx: TrpcContext,
  touchpointId: number,
  isCUI: boolean,
  metadata?: Record<string, any>
): Promise<void> {
  if (!isCUI || !ctx.user) return; // Only log if touchpoint contains CUI and user is authenticated

  await logCUIAccess(
    "CUI_ACCESSED",
    "touchpoint",
    touchpointId,
    ctx.user.id,
    ctx.user.role === "supplier" ? "supplier" : "user",
    ctx.user.enterpriseId || undefined,
    {
      ...metadata,
      cuiType: "touchpoint",
      message: "User accessed CUI-classified touchpoint",
    },
    ctx.req
  );
}

/**
 * Log CUI access for questionnaire retrieval
 */
export async function logQuestionnaireCUIAccess(
  ctx: TrpcContext,
  questionnaireId: number,
  isCUI: boolean,
  metadata?: Record<string, any>
): Promise<void> {
  if (!isCUI || !ctx.user) return; // Only log if questionnaire contains CUI and user is authenticated

  await logCUIAccess(
    "CUI_ACCESSED",
    "questionnaire",
    questionnaireId,
    ctx.user.id,
    ctx.user.role === "supplier" ? "supplier" : "user",
    ctx.user.enterpriseId || undefined,
    {
      ...metadata,
      cuiType: "questionnaire",
      message: "User accessed CUI-classified questionnaire",
    },
    ctx.req
  );
}

/**
 * Log CUI access for question retrieval
 */
export async function logQuestionCUIAccess(
  ctx: TrpcContext,
  questionId: number,
  isCUI: boolean,
  metadata?: Record<string, any>
): Promise<void> {
  if (!isCUI || !ctx.user) return; // Only log if question requests CUI and user is authenticated

  await logCUIAccess(
    "CUI_ACCESSED",
    "question",
    questionId,
    ctx.user.id,
    ctx.user.role === "supplier" ? "supplier" : "user",
    ctx.user.enterpriseId || undefined,
    {
      ...metadata,
      cuiType: "question",
      message: "User accessed CUI-classified question",
    },
    ctx.req
  );
}

/**
 * Log CUI access for partner questionnaire assignment retrieval
 */
export async function logAssignmentCUIAccess(
  ctx: TrpcContext,
  assignmentId: number,
  isCUI: boolean,
  metadata?: Record<string, any>
): Promise<void> {
  if (!isCUI || !ctx.user) return; // Only log if assignment contains CUI and user is authenticated

  await logCUIAccess(
    "CUI_ACCESSED",
    "assignment",
    assignmentId,
    ctx.user.id,
    ctx.user.role === "supplier" ? "supplier" : "user",
    ctx.user.enterpriseId || undefined,
    {
      ...metadata,
      cuiType: "assignment",
      message: "User accessed CUI-classified assignment",
    },
    ctx.req
  );
}

/**
 * Log CUI data modification (submission, update)
 */
export async function logCUIDataModification(
  ctx: TrpcContext,
  action: "CUI_ACCESSED" | "CUI_EXPORTED" | "CUI_SHARED",
  entityType: EntityType,
  entityId: number,
  isCUI: boolean,
  metadata?: Record<string, any>
): Promise<void> {
  if (!isCUI || !ctx.user) return; // Only log if entity contains CUI and user is authenticated

  await logCUIAccess(
    action,
    entityType,
    entityId,
    ctx.user.id,
    ctx.user.role === "supplier" ? "supplier" : "user",
    ctx.user.enterpriseId || undefined,
    {
      ...metadata,
      cuiType: entityType,
      message: `User modified CUI-classified ${entityType}`,
    },
    ctx.req
  );
}

/**
 * Check if any question in a questionnaire is CUI-classified
 * Used to determine if questionnaire access should be logged as CUI access
 */
export function hasAnyCUIQuestions(questions: Array<{ isCUI: boolean }>): boolean {
  return questions.some(q => q.isCUI === true);
}

/**
 * Determine if assignment should be marked as CUI based on touchpoint and questions
 * Used when creating new assignments
 */
export function shouldMarkAssignmentAsCUI(
  touchpointIsCUI: boolean,
  questionsHaveCUI: boolean
): boolean {
  return touchpointIsCUI || questionsHaveCUI;
}
