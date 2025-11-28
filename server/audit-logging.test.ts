import { describe, expect, it, beforeEach } from "vitest";
import { logAudit, logAuthentication, logAccessCodeLogin, logDataModification, logCUIAccess, logApprovalAction } from "./utils/audit-logger";
import { getDb } from "./db";
import { auditLogs } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Audit Logging System (INT.DOC.25)", () => {
  beforeEach(async () => {
    // Clean up audit logs before each test
    const db = await getDb();
    if (db) {
      await db.delete(auditLogs);
    }
  });

  describe("Core Audit Logging", () => {
    it("should log audit events with all required fields", async () => {
      await logAudit({
        action: "USER_CREATED",
        entityType: "user",
        entityId: 123,
        actorType: "user",
        actorId: 1,
        enterpriseId: 999,
        metadata: { email: "test@example.com" },
      });

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db.select().from(auditLogs).where(eq(auditLogs.entityId, 123));
      
      expect(logs).toHaveLength(1);
      expect(logs[0]?.action).toBe("USER_CREATED");
      expect(logs[0]?.entityType).toBe("user");
      expect(logs[0]?.actorId).toBe(1);
      expect(logs[0]?.enterpriseId).toBe(999);
    });

    it("should capture IP address and user agent from request", async () => {
      const mockReq = {
        headers: {
          "x-forwarded-for": "192.168.1.100",
          "user-agent": "Mozilla/5.0 Test Browser",
        },
        ip: "127.0.0.1",
      } as any;

      await logAudit({
        action: "LOGIN_SUCCESS",
        entityType: "user",
        entityId: 1,
        actorType: "user",
        actorId: 1,
        req: mockReq,
      });

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db.select().from(auditLogs).where(eq(auditLogs.action, "LOGIN_SUCCESS"));
      
      expect(logs[0]?.ipAddress).toBe("192.168.1.100");
      expect(logs[0]?.userAgent).toBe("Mozilla/5.0 Test Browser");
    });

    it("should mark CUI access events", async () => {
      await logCUIAccess(
        "CUI_ACCESSED",
        "questionnaire",
        456,
        1,
        "user",
        999,
        { questionId: 789 }
      );

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db.select().from(auditLogs).where(eq(auditLogs.entityId, 456));
      
      expect(logs[0]?.isCUIAccess).toBe(true);
      expect(logs[0]?.action).toBe("CUI_ACCESSED");
    });
  });

  describe("Authentication Events", () => {
    it("should log successful login", async () => {
      await logAuthentication("LOGIN_SUCCESS", 1, 999);

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db.select().from(auditLogs).where(eq(auditLogs.action, "LOGIN_SUCCESS"));
      
      expect(logs).toHaveLength(1);
      expect(logs[0]?.actorType).toBe("user");
    });

    it("should log failed login attempts", async () => {
      await logAuthentication("LOGIN_FAILED", 1, 999);

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db.select().from(auditLogs).where(eq(auditLogs.action, "LOGIN_FAILED"));
      
      expect(logs).toHaveLength(1);
    });

    it("should log access code login success", async () => {
      await logAccessCodeLogin(true, 123, "ABC123DEF456");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db.select().from(auditLogs).where(eq(auditLogs.action, "ACCESS_CODE_LOGIN"));
      
      expect(logs).toHaveLength(1);
      expect(logs[0]?.actorType).toBe("supplier");
      expect(logs[0]?.entityType).toBe("partner");
    });

    it("should log access code login failure with code in metadata", async () => {
      await logAccessCodeLogin(false, 123, "INVALID_CODE");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db.select().from(auditLogs).where(eq(auditLogs.action, "ACCESS_CODE_FAILED"));
      
      expect(logs).toHaveLength(1);
      const metadata = JSON.parse(logs[0]?.metadata || "{}");
      expect(metadata.accessCode).toBe("INVALID_CODE");
    });
  });

  describe("Data Modification Events", () => {
    it("should log partner creation", async () => {
      await logDataModification(
        "CREATED",
        "partner",
        456,
        1,
        "user",
        999,
        { companyName: "Acme Corp" }
      );

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db.select().from(auditLogs).where(eq(auditLogs.entityId, 456));
      
      expect(logs[0]?.action).toBe("PARTNER_CREATED");
      const metadata = JSON.parse(logs[0]?.metadata || "{}");
      expect(metadata.companyName).toBe("Acme Corp");
    });

    it("should log touchpoint updates", async () => {
      await logDataModification(
        "UPDATED",
        "touchpoint",
        789,
        1,
        "user",
        999
      );

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db.select().from(auditLogs).where(eq(auditLogs.entityId, 789));
      
      expect(logs[0]?.action).toBe("TOUCHPOINT_UPDATED");
    });

    it("should log assignment deletions", async () => {
      await logDataModification(
        "DELETED",
        "assignment",
        111,
        1,
        "user",
        999
      );

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db.select().from(auditLogs).where(eq(auditLogs.entityId, 111));
      
      expect(logs[0]?.action).toBe("ASSIGNMENT_DELETED");
    });
  });

  describe("Approval Workflow Events", () => {
    it("should log submission flagged for review", async () => {
      await logApprovalAction(
        "FLAGGED_FOR_REVIEW",
        222,
        1,
        999,
        { reviewerCount: 3 }
      );

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db.select().from(auditLogs).where(eq(auditLogs.entityId, 222));
      
      expect(logs[0]?.action).toBe("FLAGGED_FOR_REVIEW");
      expect(logs[0]?.entityType).toBe("approval");
    });

    it("should log submission approval", async () => {
      await logApprovalAction(
        "SUBMISSION_APPROVED",
        333,
        1,
        999
      );

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db.select().from(auditLogs).where(eq(auditLogs.entityId, 333));
      
      expect(logs[0]?.action).toBe("SUBMISSION_APPROVED");
    });

    it("should log submission rejection with notes", async () => {
      await logApprovalAction(
        "SUBMISSION_REJECTED",
        444,
        1,
        999,
        { notes: "Missing required documentation" }
      );

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db.select().from(auditLogs).where(eq(auditLogs.entityId, 444));
      
      expect(logs[0]?.action).toBe("SUBMISSION_REJECTED");
      const metadata = JSON.parse(logs[0]?.metadata || "{}");
      expect(metadata.notes).toBe("Missing required documentation");
    });
  });

  describe("CUI Access Events", () => {
    it("should log CUI data access", async () => {
      await logCUIAccess(
        "CUI_ACCESSED",
        "questionnaire",
        555,
        1,
        "user",
        999,
        { questionId: 666 }
      );

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db.select().from(auditLogs).where(eq(auditLogs.entityId, 555));
      
      expect(logs[0]?.isCUIAccess).toBe(true);
      expect(logs[0]?.action).toBe("CUI_ACCESSED");
    });

    it("should log CUI data export", async () => {
      await logCUIAccess(
        "CUI_EXPORTED",
        "document",
        777,
        1,
        "user",
        999,
        { format: "PDF" }
      );

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db.select().from(auditLogs).where(eq(auditLogs.entityId, 777));
      
      expect(logs[0]?.isCUIAccess).toBe(true);
      expect(logs[0]?.action).toBe("CUI_EXPORTED");
    });
  });

  describe("Enterprise Scoping", () => {
    it("should scope audit logs to enterprise", async () => {
      await logAudit({
        action: "TOUCHPOINT_CREATED",
        entityType: "touchpoint",
        entityId: 888,
        actorType: "user",
        actorId: 1,
        enterpriseId: 999,
      });

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db.select().from(auditLogs).where(eq(auditLogs.enterpriseId, 999));
      
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]?.enterpriseId).toBe(999);
    });
  });
});
