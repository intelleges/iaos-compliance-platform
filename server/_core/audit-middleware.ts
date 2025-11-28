/**
 * tRPC Audit Logging Middleware
 * Automatically logs all mutations to audit trail per INT.DOC.25
 */

import { logAudit, type AuditAction, type EntityType, type ActorType } from "../utils/audit-logger";
import type { TrpcContext } from "./context";

/**
 * Middleware that logs all mutations to audit trail
 * Usage: Apply to procedures that modify data
 */
/**
 * Create audit logging middleware
 * Note: This should be applied using t.middleware in trpc.ts
 */
export function createAuditMiddleware() {
  return async (opts: {
    ctx: TrpcContext;
    next: () => Promise<any>;
    path: string;
    type: "query" | "mutation" | "subscription";
  }) => {
    const { ctx, next, path, type } = opts;
  // Only log mutations (not queries)
  if (type !== "mutation") {
    return next();
  }

  const result = await next();

  // Extract entity information from procedure path
  // Format: "router.action" e.g., "touchpoint.create", "partner.update"
  const [routerName, actionName] = path.split(".");
  
  // Map router names to entity types
  const entityTypeMap: Record<string, EntityType> = {
    touchpoint: "touchpoint",
    partner: "partner",
    assignment: "assignment",
    questionnaire: "questionnaire",
    response: "response",
    approval: "approval",
    user: "user",
    enterprise: "enterprise",
  };

  // Map action names to audit actions
  const actionMap: Record<string, string> = {
    create: "CREATED",
    update: "UPDATED",
    delete: "DELETED",
    submit: "SUBMITTED",
    approve: "APPROVED",
    reject: "REJECTED",
  };

  const entityType = entityTypeMap[routerName];
  const actionSuffix = actionMap[actionName];

  if (!entityType || !actionSuffix) {
    // Skip audit logging for unmapped procedures
    return result;
  }

  const auditAction = `${entityType.toUpperCase()}_${actionSuffix}` as AuditAction;

  // Extract entity ID from result (assuming result has an id field)
  const entityId = (result as any)?.id || (result as any)?.data?.id || 0;

  // Determine actor type
  const actorType: ActorType = ctx.user?.role === "supplier" ? "supplier" : "user";

  // Log the audit event (async, non-blocking)
  logAudit({
    action: auditAction,
    entityType,
    entityId,
    actorType,
    actorId: ctx.user?.id ?? undefined,
    enterpriseId: ctx.user?.enterpriseId ?? undefined,
    req: ctx.req,
  }).catch((error) => {
    console.error("[Audit Middleware] Failed to log audit event:", error);
  });

    return result;
  };
}

/**
 * Helper to manually log audit events within procedures
 * Use this for complex operations that need custom audit logging
 */
export async function logProcedureAudit(
  ctx: any,
  action: AuditAction,
  entityType: EntityType,
  entityId: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  const actorType: ActorType = ctx.user?.role === "supplier" ? "supplier" : "user";

  await logAudit({
    action,
    entityType,
    entityId,
    actorType,
    actorId: ctx.user?.id ?? undefined,
    enterpriseId: ctx.user?.enterpriseId ?? undefined,
    metadata,
    req: ctx.req,
  });
}
