/**
 * Audit Logging Service
 * Implements INT.DOC.25 Section 2.1 (Integrity) and Section 4.2 (Data Retention)
 * 
 * Retention Requirements:
 * - Data modification logs: 10 years
 * - Authentication logs: 90 days
 * - CUI access logs: 10 years
 * 
 * Logging Requirements:
 * - All authentication events (login, logout, failed attempts)
 * - All data modification events (create, update, delete)
 * - All CUI access events
 * - All approval workflow actions
 * - IP address and user agent for security monitoring
 */

import type { Request } from "express";
import { auditLogs, type InsertAuditLog } from "../../drizzle/schema";
import { getDb } from "../db";

export type AuditAction =
  // Authentication events
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "SESSION_EXPIRED"
  | "ACCESS_CODE_LOGIN"
  | "ACCESS_CODE_FAILED"
  
  // User management
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DEACTIVATED"
  | "USER_ROLE_CHANGED"
  
  // Partner management
  | "PARTNER_CREATED"
  | "PARTNER_UPDATED"
  | "PARTNER_DELETED"
  
  // Touchpoint management
  | "TOUCHPOINT_CREATED"
  | "TOUCHPOINT_UPDATED"
  | "TOUCHPOINT_DELETED"
  
  // Assignment lifecycle
  | "ASSIGNMENT_CREATED"
  | "ASSIGNMENT_DELEGATED"
  | "ASSIGNMENT_ACCESSED"
  | "ASSIGNMENT_STARTED"
  | "ASSIGNMENT_SUBMITTED"
  
  // Questionnaire responses
  | "RESPONSE_CREATED"
  | "RESPONSE_UPDATED"
  | "RESPONSE_DELETED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_DOWNLOADED"
  
  // Approval workflow
  | "FLAGGED_FOR_REVIEW"
  | "SUBMISSION_APPROVED"
  | "SUBMISSION_REJECTED"
  
  // CUI access
  | "CUI_ACCESSED"
  | "CUI_EXPORTED"
  | "CUI_SHARED"
  | "TOUCHPOINT_ACCESSED"
  | "QUESTIONNAIRE_ACCESSED"
  | "QUESTION_ACCESSED"
  
  // System events
  | "DATA_EXPORTED"
  | "REPORT_GENERATED"
  | "SETTINGS_UPDATED";

export type EntityType =
  | "user"
  | "partner"
  | "touchpoint"
  | "assignment"
  | "questionnaire"
  | "question"
  | "response"
  | "document"
  | "approval"
  | "enterprise"
  | "system";

export type ActorType = "user" | "supplier" | "system";

export interface AuditLogParams {
  action: AuditAction;
  entityType: EntityType;
  entityId: number;
  actorType: ActorType;
  actorId?: number;
  enterpriseId?: number;
  metadata?: Record<string, unknown>;
  isCUIAccess?: boolean;
  req?: Request; // For extracting IP and user agent
}

/**
 * Extract IP address from request
 */
function getIpAddress(req?: Request): string | null {
  if (!req) return null;
  
  // Check for proxy headers first
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips?.split(",")[0]?.trim() || null;
  }
  
  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }
  
  return req.ip || req.socket?.remoteAddress || null;
}

/**
 * Extract user agent from request
 */
function getUserAgent(req?: Request): string | null {
  if (!req) return null;
  const userAgent = req.headers["user-agent"];
  return Array.isArray(userAgent) ? userAgent[0] : userAgent || null;
}

/**
 * Log an audit event
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Audit] Cannot log audit event: database not available");
    return;
  }

  try {
    const auditLog: InsertAuditLog = {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      actorType: params.actorType,
      actorId: params.actorId || null,
      enterpriseId: params.enterpriseId || null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      isCUIAccess: params.isCUIAccess || false,
      ipAddress: getIpAddress(params.req),
      userAgent: getUserAgent(params.req),
      timestamp: new Date(),
    };

    await db.insert(auditLogs).values(auditLog);

    console.log(`[Audit] ${params.action} by ${params.actorType}:${params.actorId} on ${params.entityType}:${params.entityId}`);
  } catch (error) {
    console.error("[Audit] Failed to log audit event:", error);
    // Don't throw - audit logging failures should not break application flow
  }
}

/**
 * Convenience functions for common audit events
 */

export async function logAuthentication(
  action: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGOUT" | "SESSION_EXPIRED",
  userId: number,
  enterpriseId: number | undefined,
  req?: Request
): Promise<void> {
  await logAudit({
    action,
    entityType: "user",
    entityId: userId,
    actorType: "user",
    actorId: userId,
    enterpriseId,
    req,
  });
}

export async function logAccessCodeLogin(
  success: boolean,
  partnerId: number,
  accessCode: string,
  req?: Request
): Promise<void> {
  await logAudit({
    action: success ? "ACCESS_CODE_LOGIN" : "ACCESS_CODE_FAILED",
    entityType: "partner",
    entityId: partnerId,
    actorType: "supplier",
    actorId: partnerId,
    metadata: { accessCode: success ? undefined : accessCode }, // Only log failed attempts
    req,
  });
}

export async function logDataModification(
  action: "CREATED" | "UPDATED" | "DELETED",
  entityType: EntityType,
  entityId: number,
  actorId: number,
  actorType: ActorType,
  enterpriseId: number | undefined,
  metadata?: Record<string, unknown>,
  req?: Request
): Promise<void> {
  const auditAction = `${entityType.toUpperCase()}_${action}` as AuditAction;
  
  await logAudit({
    action: auditAction,
    entityType,
    entityId,
    actorType,
    actorId,
    enterpriseId,
    metadata,
    req,
  });
}

export async function logCUIAccess(
  action: "CUI_ACCESSED" | "CUI_EXPORTED" | "CUI_SHARED",
  entityType: EntityType,
  entityId: number,
  actorId: number,
  actorType: ActorType,
  enterpriseId: number | undefined,
  metadata?: Record<string, unknown>,
  req?: Request
): Promise<void> {
  await logAudit({
    action,
    entityType,
    entityId,
    actorType,
    actorId,
    enterpriseId,
    metadata,
    isCUIAccess: true,
    req,
  });
}

export async function logApprovalAction(
  action: "FLAGGED_FOR_REVIEW" | "SUBMISSION_APPROVED" | "SUBMISSION_REJECTED",
  submissionId: number,
  reviewerId: number,
  enterpriseId: number | undefined,
  metadata?: Record<string, unknown>,
  req?: Request
): Promise<void> {
  await logAudit({
    action,
    entityType: "approval",
    entityId: submissionId,
    actorType: "user",
    actorId: reviewerId,
    enterpriseId,
    metadata,
    req,
  });
}
