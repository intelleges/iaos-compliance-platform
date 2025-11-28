/**
 * CUI (Controlled Unclassified Information) Classification Tests
 * Per NIST 800-171 Section 3.1.13 - Employ cryptographic mechanisms to protect CUI
 * Per INT.DOC.25 Section 2.1 - Integrity controls and audit logging
 */

import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import { getDb } from "../db";
import { touchpoints, auditLogs } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// Helper to create admin context
function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@intelleges.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      enterpriseId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      active: true,
      firstName: "Admin",
      lastName: "User",
      title: null,
      phone: null,
      internalId: null,
    },
    req: {
      protocol: "https",
      headers: {
        "user-agent": "test-agent",
        "x-forwarded-for": "192.168.1.1",
      },
      get: (header: string) => {
        const headers: Record<string, string> = {
          "user-agent": "test-agent",
          "x-forwarded-for": "192.168.1.1",
        };
        return headers[header.toLowerCase()];
      },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

// Helper to create supplier context
function createSupplierContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "supplier-user",
      email: "supplier@example.com",
      name: "Supplier User",
      loginMethod: "access_code",
      role: "supplier",
      enterpriseId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      active: true,
      firstName: "Supplier",
      lastName: "User",
      title: null,
      phone: null,
      internalId: null,
    },
    req: {
      protocol: "https",
      headers: {
        "user-agent": "supplier-agent",
        "x-forwarded-for": "10.0.0.1",
      },
      get: (header: string) => {
        const headers: Record<string, string> = {
          "user-agent": "supplier-agent",
          "x-forwarded-for": "10.0.0.1",
        };
        return headers[header.toLowerCase()];
      },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("CUI Classification", () => {
  describe("Database Schema", () => {
    it("should have isCUI field in touchpoints table", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create a test touchpoint with isCUI=true
      const [result] = await db
        .insert(touchpoints)
        .values({
          title: "Test CUI Touchpoint",
          isCUI: true,
          active: true,
        })
        .$returningId();

      // Verify it was saved
      const [touchpoint] = await db
        .select()
        .from(touchpoints)
        .where(eq(touchpoints.id, result.id))
        .limit(1);

      expect(touchpoint).toBeDefined();
      expect(touchpoint.isCUI).toBe(true);

      // Cleanup
      await db.delete(touchpoints).where(eq(touchpoints.id, result.id));
    });

    it("should default isCUI to false for touchpoints", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create touchpoint without specifying isCUI
      const [result] = await db
        .insert(touchpoints)
        .values({
          title: "Test Non-CUI Touchpoint",
          active: true,
        })
        .$returningId();

      // Verify default is false
      const [touchpoint] = await db
        .select()
        .from(touchpoints)
        .where(eq(touchpoints.id, result.id))
        .limit(1);

      expect(touchpoint.isCUI).toBe(false);

      // Cleanup
      await db.delete(touchpoints).where(eq(touchpoints.id, result.id));
    });
  });

  describe("Touchpoint Router - CUI Access Logging", () => {
    let testTouchpointId: number;
    let nonCUITouchpointId: number;

    beforeEach(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create CUI touchpoint
      const [cuiResult] = await db
        .insert(touchpoints)
        .values({
          title: "CUI Test Touchpoint",
          abbreviation: "CUI-TEST",
          isCUI: true,
          active: true,
        })
        .$returningId();
      testTouchpointId = cuiResult.id;

      // Create non-CUI touchpoint
      const [nonCUIResult] = await db
        .insert(touchpoints)
        .values({
          title: "Non-CUI Test Touchpoint",
          abbreviation: "NON-CUI",
          isCUI: false,
          active: true,
        })
        .$returningId();
      nonCUITouchpointId = nonCUIResult.id;
    });

    it("should log CUI access when admin retrieves CUI touchpoint", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Retrieve CUI touchpoint
      const touchpoint = await caller.touchpoint.get({ id: testTouchpointId });

      expect(touchpoint).toBeDefined();
      expect(touchpoint.isCUI).toBe(true);

      // Verify audit log was created
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [auditLog] = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.entityType, "touchpoint"),
            eq(auditLogs.entityId, testTouchpointId),
            eq(auditLogs.action, "CUI_ACCESSED"),
            eq(auditLogs.actorId, ctx.user!.id)
          )
        )
        .orderBy(desc(auditLogs.timestamp))
        .limit(1);

      expect(auditLog).toBeDefined();
      expect(auditLog.isCUIAccess).toBe(true);
      expect(auditLog.actorType).toBe("user");
      expect(auditLog.ipAddress).toBe("192.168.1.1");
    });

    it("should log CUI access when supplier retrieves CUI touchpoint", async () => {
      const ctx = createSupplierContext();
      const caller = appRouter.createCaller(ctx);

      // Retrieve CUI touchpoint
      const touchpoint = await caller.touchpoint.get({ id: testTouchpointId });

      expect(touchpoint.isCUI).toBe(true);

      // Verify audit log was created with supplier actor type
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [auditLog] = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.entityType, "touchpoint"),
            eq(auditLogs.entityId, testTouchpointId),
            eq(auditLogs.action, "CUI_ACCESSED"),
            eq(auditLogs.actorId, ctx.user!.id)
          )
        )
        .orderBy(desc(auditLogs.timestamp))
        .limit(1);

      expect(auditLog).toBeDefined();
      expect(auditLog.actorType).toBe("supplier");
      expect(auditLog.isCUIAccess).toBe(true);
    });

    it("should NOT log CUI access when retrieving non-CUI touchpoint", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Count audit logs before retrieval
      const logsBefore = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.entityType, "touchpoint"),
            eq(auditLogs.entityId, nonCUITouchpointId),
            eq(auditLogs.action, "CUI_ACCESSED")
          )
        );

      // Retrieve non-CUI touchpoint
      const touchpoint = await caller.touchpoint.get({ id: nonCUITouchpointId });

      expect(touchpoint.isCUI).toBe(false);

      // Count audit logs after retrieval
      const logsAfter = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.entityType, "touchpoint"),
            eq(auditLogs.entityId, nonCUITouchpointId),
            eq(auditLogs.action, "CUI_ACCESSED")
          )
        );

      // Should be the same (no new CUI access log)
      expect(logsAfter.length).toBe(logsBefore.length);
    });

    it("should include touchpoint metadata in CUI access log", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Retrieve CUI touchpoint
      await caller.touchpoint.get({ id: testTouchpointId });

      // Verify metadata
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [auditLog] = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.entityType, "touchpoint"),
            eq(auditLogs.entityId, testTouchpointId),
            eq(auditLogs.action, "CUI_ACCESSED")
          )
        )
        .orderBy(desc(auditLogs.timestamp))
        .limit(1);

      expect(auditLog).toBeDefined();
      expect(auditLog.metadata).toBeDefined();
      const metadata = typeof auditLog.metadata === "string" 
        ? JSON.parse(auditLog.metadata) 
        : auditLog.metadata as Record<string, any>;
      expect(metadata.cuiType).toBe("touchpoint");
      expect(metadata.touchpointTitle).toBe("CUI Test Touchpoint");
      expect(metadata.touchpointAbbreviation).toBe("CUI-TEST");
      expect(metadata.message).toBe("User accessed CUI-classified touchpoint");
    });
  });

  describe("Touchpoint Router - CUI Classification Management", () => {
    it("should allow creating touchpoint with isCUI=true", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.touchpoint.create({
        protocolId: 1,
        title: "New CUI Touchpoint",
        isCUI: true,
      });

      expect(result.id).toBeDefined();
      expect(result.message).toContain("CUI-classified");

      // Verify in database
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [touchpoint] = await db
        .select()
        .from(touchpoints)
        .where(eq(touchpoints.id, result.id))
        .limit(1);

      expect(touchpoint.isCUI).toBe(true);

      // Cleanup
      await db.delete(touchpoints).where(eq(touchpoints.id, result.id));
    });

    it("should allow updating touchpoint CUI classification", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create non-CUI touchpoint
      const [created] = await db
        .insert(touchpoints)
        .values({
          title: "Upgrade to CUI",
          isCUI: false,
          active: true,
        })
        .$returningId();

      // Update to CUI
      await caller.touchpoint.update({
        id: created.id,
        isCUI: true,
      });

      // Verify update
      const [updated] = await db
        .select()
        .from(touchpoints)
        .where(eq(touchpoints.id, created.id))
        .limit(1);

      expect(updated.isCUI).toBe(true);

      // Cleanup
      await db.delete(touchpoints).where(eq(touchpoints.id, created.id));
    });

    it("should list touchpoints with CUI flags", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create mix of CUI and non-CUI touchpoints
      const [cui1] = await db
        .insert(touchpoints)
        .values({
          protocolId: 1,
          title: "CUI Touchpoint 1",
          isCUI: true,
          active: true,
        })
        .$returningId();

      const [cui2] = await db
        .insert(touchpoints)
        .values({
          protocolId: 1,
          title: "CUI Touchpoint 2",
          isCUI: true,
          active: true,
        })
        .$returningId();

      const [nonCUI] = await db
        .insert(touchpoints)
        .values({
          protocolId: 1,
          title: "Non-CUI Touchpoint",
          isCUI: false,
          active: true,
        })
        .$returningId();

      // List all touchpoints for protocol 1
      const touchpoints_list = await caller.touchpoint.list({ protocolId: 1 });

      const cuiTouchpoints = touchpoints_list.filter((t) => t.isCUI);
      const nonCUITouchpoints = touchpoints_list.filter((t) => !t.isCUI);

      expect(cuiTouchpoints.length).toBeGreaterThanOrEqual(2);
      expect(nonCUITouchpoints.length).toBeGreaterThanOrEqual(1);

      // Cleanup
      await db.delete(touchpoints).where(eq(touchpoints.id, cui1.id));
      await db.delete(touchpoints).where(eq(touchpoints.id, cui2.id));
      await db.delete(touchpoints).where(eq(touchpoints.id, nonCUI.id));
    });
  });

  describe("CUI Middleware Utilities", () => {
    it("should correctly identify CUI questions in a questionnaire", async () => {
      const { hasAnyCUIQuestions } = await import("../utils/cui-middleware");

      const questions = [
        { isCUI: false },
        { isCUI: false },
        { isCUI: true }, // One CUI question
        { isCUI: false },
      ];

      expect(hasAnyCUIQuestions(questions)).toBe(true);
    });

    it("should return false when no CUI questions exist", async () => {
      const { hasAnyCUIQuestions } = await import("../utils/cui-middleware");

      const questions = [
        { isCUI: false },
        { isCUI: false },
        { isCUI: false },
      ];

      expect(hasAnyCUIQuestions(questions)).toBe(false);
    });

    it("should mark assignment as CUI if touchpoint is CUI", async () => {
      const { shouldMarkAssignmentAsCUI } = await import("../utils/cui-middleware");

      expect(shouldMarkAssignmentAsCUI(true, false)).toBe(true);
    });

    it("should mark assignment as CUI if any question is CUI", async () => {
      const { shouldMarkAssignmentAsCUI } = await import("../utils/cui-middleware");

      expect(shouldMarkAssignmentAsCUI(false, true)).toBe(true);
    });

    it("should mark assignment as CUI if both touchpoint and questions are CUI", async () => {
      const { shouldMarkAssignmentAsCUI } = await import("../utils/cui-middleware");

      expect(shouldMarkAssignmentAsCUI(true, true)).toBe(true);
    });

    it("should NOT mark assignment as CUI if neither touchpoint nor questions are CUI", async () => {
      const { shouldMarkAssignmentAsCUI } = await import("../utils/cui-middleware");

      expect(shouldMarkAssignmentAsCUI(false, false)).toBe(false);
    });
  });
});
