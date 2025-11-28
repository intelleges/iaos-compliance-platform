import { getDb } from '../db';
import { auditLogs } from '../../drizzle/schema';

/**
 * Audit Logging Service
 * Based on INT.DOC.11 Section 2.4 - Event Handlers
 * 
 * Provides comprehensive event tracking for compliance and security auditing.
 */

export interface AuditLogEntry {
  action: string; // QUESTIONNAIRE_SUBMITTED, ASSIGNMENT_DELEGATED, EMAIL_BOUNCED, etc.
  entityType: string; // assignment, touchpoint, partner, email, etc.
  entityId: number;
  actorType?: string; // user, supplier, system
  actorId?: number;
  metadata?: Record<string, unknown>; // Event-specific data
  enterpriseId?: number;
}

/**
 * Log an audit event to the database
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn('[Audit] Cannot log event: database not available');
    return;
  }

  try {
    await db.insert(auditLogs).values({
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      actorType: entry.actorType || null,
      actorId: entry.actorId || null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      enterpriseId: entry.enterpriseId || null,
    });

    console.log(`[Audit] ${entry.action} - ${entry.entityType}#${entry.entityId}`);
  } catch (error) {
    console.error('[Audit] Failed to log event:', error);
    // Don't throw - audit logging failures should not break business logic
  }
}

/**
 * Query audit logs for a specific entity
 */
export async function getAuditLogs(
  entityType: string,
  entityId: number,
  limit: number = 100
) {
  const db = await getDb();
  if (!db) return [];

  try {
    const { eq, and, desc } = await import('drizzle-orm');
    
    const logs = await db
      .select()
      .from(auditLogs)
      .where(and(
        eq(auditLogs.entityType, entityType),
        eq(auditLogs.entityId, entityId)
      ))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);

    return logs.map((log) => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }));
  } catch (error) {
    console.error('[Audit] Failed to query logs:', error);
    return [];
  }
}
