/**
 * User Batch Load - Database Operations
 * INT.DOC.64 Section 3 - User Batch Load
 * 
 * Handles bulk user import with intelligent re-load behavior:
 * - Same USER_ID + different data → UPDATE
 * - Same USER_ID + same data → SKIP
 * - New USER_ID → CREATE
 * - Deactivated user + new load → REACTIVATE
 */

import { eq, and } from 'drizzle-orm';
import { getDb } from './db';
import { users } from '../drizzle/schema';
import type { ParsedUserRow } from './services/user-batch-parser';

export interface UserBatchResult {
  created: number;
  updated: number;
  skipped: number;
  reactivated: number;
  errors: Array<{
    userId: string;
    rowNumber: number;
    error: string;
  }>;
}

/**
 * Import users with intelligent re-load behavior
 */
export async function importUserBatch(
  parsedUsers: ParsedUserRow[],
  enterpriseId: number
): Promise<UserBatchResult> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result: UserBatchResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    reactivated: 0,
    errors: [],
  };

  for (const user of parsedUsers) {
    try {
      // Check if user exists by userId (unique identifier)
      const existing = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.enterpriseId, enterpriseId),
            eq(users.openId, user.userId) // Using openId as USER_ID storage
          )
        )
        .limit(1);

      if (existing.length === 0) {
        // CREATE: New user
        await db.insert(users).values({
          enterpriseId,
          openId: user.userId,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: mapRoleToSchema(user.role),
          active: user.isActive ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        });
        result.created++;
      } else {
        const existingUser = existing[0]!;

        // Check if user was deactivated
        if (!existingUser.active && (user.isActive ?? true)) {
          // REACTIVATE
          await db
            .update(users)
            .set({
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              role: mapRoleToSchema(user.role),
              active: true,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUser.id));
          result.reactivated++;
        } else {
          // Check if data has changed
          const hasChanges = detectUserChanges(existingUser, user);

          if (hasChanges) {
            // UPDATE: Data changed
            await db
              .update(users)
              .set({
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                role: mapRoleToSchema(user.role),
                active: user.isActive ?? existingUser.active,
                updatedAt: new Date(),
              })
              .where(eq(users.id, existingUser.id));
            result.updated++;
          } else {
            // SKIP: No changes
            result.skipped++;
          }
        }
      }
    } catch (error) {
      result.errors.push({
        userId: user.userId,
        rowNumber: user.rowNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

/**
 * Detect if user data has changed
 */
function detectUserChanges(
  existing: typeof users.$inferSelect,
  incoming: ParsedUserRow
): boolean {
  const incomingName = `${incoming.firstName} ${incoming.lastName}`;
  const incomingRole = mapRoleToSchema(incoming.role);
  const incomingActive = incoming.isActive ?? true;

  return (
    existing.name !== incomingName ||
    existing.email !== incoming.email ||
    existing.role !== incomingRole ||
    existing.active !== incomingActive
  );
}

/**
 * Map INT.DOC.64 role values to schema role enum
 * 
 * INT.DOC.64 Roles:
 * - ENTERPRISE_ADMIN, SITE_ADMIN, GROUP_ADMIN, PARTNERTYPE_ADMIN
 * - PROCUREMENT_DIRECTOR, PROCUREMENT_MANAGER, BUYER, PROCUREMENT_ANALYST
 * - COMPLIANCE_MANAGER, COMPLIANCE_SME, DATA_ADMIN, VIEWER
 * 
 * Schema Roles: 'user' | 'admin'
 * 
 * Mapping Strategy:
 * - ENTERPRISE_ADMIN → 'admin'
 * - All others → 'user' (granular permissions handled by role field in future)
 */
function mapRoleToSchema(docRole: string): 'user' | 'admin' {
  if (docRole === 'ENTERPRISE_ADMIN') {
    return 'admin';
  }
  return 'user';
}
