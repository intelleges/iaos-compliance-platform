/**
 * Audit Log Router
 * Provides admin-only access to audit logs for compliance reporting
 * Per INT.DOC.25 Section 2.1 (Integrity) and Section 4.2 (Data Retention)
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { auditLogs } from "../../drizzle/schema";
import { and, eq, gte, lte, inArray, like, desc, asc, sql, count } from "drizzle-orm";

/**
 * Admin-only procedure - only admins can access audit logs
 */
const adminOnlyProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user || !["admin", "enterprise_owner", "compliance_officer"].includes(ctx.user.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only administrators can access audit logs",
    });
  }
  return next({ ctx });
});

export const auditRouter = router({
  /**
   * Get audit logs with filtering and pagination
   */
  getLogs: adminOnlyProcedure
    .input(
      z.object({
        // Pagination
        limit: z.number().min(1).max(100).default(25),
        offset: z.number().min(0).default(0),
        
        // Sorting
        sortBy: z.enum(["timestamp"]).default("timestamp"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        
        // Filters
        startDate: z.string().optional(), // ISO date string
        endDate: z.string().optional(),
        userId: z.number().optional(),
        actorType: z.enum(["user", "supplier", "system"]).optional(),
        actions: z.array(z.string()).optional(), // Array of action names
        entityType: z.string().optional(),
        enterpriseId: z.number().optional(),
        isCUIAccess: z.boolean().optional(),
        ipAddress: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Build filter conditions
      const conditions = [];

      // Enterprise scoping - admins can only see logs from their enterprise
      if (ctx.user.enterpriseId) {
        conditions.push(eq(auditLogs.enterpriseId, ctx.user.enterpriseId));
      } else if (input.enterpriseId) {
        // Super admins can filter by enterprise
        conditions.push(eq(auditLogs.enterpriseId, input.enterpriseId));
      }

      // Date range filter
      if (input.startDate) {
        conditions.push(gte(auditLogs.timestamp, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(auditLogs.timestamp, new Date(input.endDate)));
      }

      // User filter
      if (input.userId) {
        conditions.push(eq(auditLogs.actorId, input.userId));
      }

      // Actor type filter
      if (input.actorType) {
        conditions.push(eq(auditLogs.actorType, input.actorType));
      }

      // Action filter
      if (input.actions && input.actions.length > 0) {
        conditions.push(inArray(auditLogs.action, input.actions));
      }

      // Entity type filter
      if (input.entityType) {
        conditions.push(eq(auditLogs.entityType, input.entityType));
      }

      // CUI access filter
      if (input.isCUIAccess !== undefined) {
        conditions.push(eq(auditLogs.isCUIAccess, input.isCUIAccess));
      }

      // IP address filter (partial match)
      if (input.ipAddress) {
        conditions.push(like(auditLogs.ipAddress, `%${input.ipAddress}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [{ total }] = await db
        .select({ total: count() })
        .from(auditLogs)
        .where(whereClause);

      // Get logs with pagination
      const logs = await db
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(input.sortOrder === "desc" ? desc(auditLogs.timestamp) : asc(auditLogs.timestamp))
        .limit(input.limit)
        .offset(input.offset);

      return {
        logs,
        total: Number(total),
        hasMore: input.offset + input.limit < Number(total),
      };
    }),

  /**
   * Get audit log statistics for dashboard
   */
  getStats: adminOnlyProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        enterpriseId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Build filter conditions
      const conditions = [];

      // Enterprise scoping
      if (ctx.user.enterpriseId) {
        conditions.push(eq(auditLogs.enterpriseId, ctx.user.enterpriseId));
      } else if (input.enterpriseId) {
        conditions.push(eq(auditLogs.enterpriseId, input.enterpriseId));
      }

      // Date range
      if (input.startDate) {
        conditions.push(gte(auditLogs.timestamp, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(auditLogs.timestamp, new Date(input.endDate)));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Total events
      const [{ totalEvents }] = await db
        .select({ totalEvents: count() })
        .from(auditLogs)
        .where(whereClause);

      // CUI access events
      const [{ cuiEvents }] = await db
        .select({ cuiEvents: count() })
        .from(auditLogs)
        .where(and(...(whereClause ? [whereClause] : []), eq(auditLogs.isCUIAccess, true)));

      // Unique users
      const [{ uniqueUsers }] = await db
        .select({ uniqueUsers: sql<number>`COUNT(DISTINCT ${auditLogs.actorId})` })
        .from(auditLogs)
        .where(whereClause);

      // Authentication events
      const [{ authEvents }] = await db
        .select({ authEvents: count() })
        .from(auditLogs)
        .where(
          and(
            ...(whereClause ? [whereClause] : []),
            inArray(auditLogs.action, [
              "LOGIN_SUCCESS",
              "LOGIN_FAILED",
              "LOGOUT",
              "SESSION_EXPIRED",
              "ACCESS_CODE_LOGIN",
              "ACCESS_CODE_FAILED",
            ])
          )
        );

      // Top actions (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const topActions = await db
        .select({
          action: auditLogs.action,
          count: count(),
        })
        .from(auditLogs)
        .where(
          and(
            ...(whereClause ? [whereClause] : []),
            gte(auditLogs.timestamp, sevenDaysAgo)
          )
        )
        .groupBy(auditLogs.action)
        .orderBy(desc(count()))
        .limit(5);

      return {
        totalEvents: Number(totalEvents),
        cuiEvents: Number(cuiEvents),
        uniqueUsers: Number(uniqueUsers),
        authEvents: Number(authEvents),
        topActions,
      };
    }),

  /**
   * Export audit logs to CSV or JSON
   */
  exportLogs: adminOnlyProcedure
    .input(
      z.object({
        format: z.enum(["csv", "json"]),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        userId: z.number().optional(),
        actions: z.array(z.string()).optional(),
        enterpriseId: z.number().optional(),
        isCUIAccess: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Build filter conditions (same as getLogs)
      const conditions = [];

      if (ctx.user.enterpriseId) {
        conditions.push(eq(auditLogs.enterpriseId, ctx.user.enterpriseId));
      } else if (input.enterpriseId) {
        conditions.push(eq(auditLogs.enterpriseId, input.enterpriseId));
      }

      if (input.startDate) {
        conditions.push(gte(auditLogs.timestamp, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(auditLogs.timestamp, new Date(input.endDate)));
      }
      if (input.userId) {
        conditions.push(eq(auditLogs.actorId, input.userId));
      }
      if (input.actions && input.actions.length > 0) {
        conditions.push(inArray(auditLogs.action, input.actions));
      }
      if (input.isCUIAccess !== undefined) {
        conditions.push(eq(auditLogs.isCUIAccess, input.isCUIAccess));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get all matching logs (limit to 10,000 for safety)
      const logs = await db
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.timestamp))
        .limit(10000);

      if (input.format === "json") {
        return {
          format: "json" as const,
          data: JSON.stringify(logs, null, 2),
          filename: `audit-logs-${new Date().toISOString()}.json`,
        };
      } else {
        // CSV format
        const headers = [
          "ID",
          "Timestamp",
          "Action",
          "Entity Type",
          "Entity ID",
          "Actor Type",
          "Actor ID",
          "Enterprise ID",
          "IP Address",
          "User Agent",
          "CUI Access",
          "Metadata",
        ];

        const rows = logs.map((log) => [
          log.id,
          log.timestamp.toISOString(),
          log.action,
          log.entityType,
          log.entityId,
          log.actorType || "",
          log.actorId || "",
          log.enterpriseId || "",
          log.ipAddress || "",
          log.userAgent || "",
          log.isCUIAccess ? "Yes" : "No",
          log.metadata || "",
        ]);

        const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

        return {
          format: "csv" as const,
          data: csv,
          filename: `audit-logs-${new Date().toISOString()}.csv`,
        };
      }
    }),
});
