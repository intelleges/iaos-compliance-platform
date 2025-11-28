import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@intelleges.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    enterpriseId: null,
    firstName: "Admin",
    lastName: "User",
    title: "System Administrator",
    phone: null,
    internalId: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { "x-forwarded-for": "192.168.1.100" },
      ip: "192.168.1.100",
      get: (header: string) => header === "user-agent" ? "Mozilla/5.0 Test" : undefined,
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createOfficerContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "officer-user",
    email: "officer@intelleges.com",
    name: "Compliance Officer",
    loginMethod: "manus",
    role: "compliance_officer",
    enterpriseId: 1,
    firstName: "Compliance",
    lastName: "Officer",
    title: "Compliance Officer",
    phone: null,
    internalId: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { "x-forwarded-for": "192.168.1.101" },
      ip: "192.168.1.101",
      get: (header: string) => header === "user-agent" ? "Mozilla/5.0 Test" : undefined,
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createSupplierContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 3,
    openId: "supplier-user",
    email: "supplier@partner.com",
    name: "Supplier User",
    loginMethod: "access_code",
    role: "supplier",
    enterpriseId: null,
    firstName: "Supplier",
    lastName: "User",
    title: "Supplier Contact",
    phone: null,
    internalId: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { "x-forwarded-for": "192.168.1.102" },
      ip: "192.168.1.102",
      get: (header: string) => header === "user-agent" ? "Mozilla/5.0 Test" : undefined,
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Audit Router", () => {
  describe("audit.getLogs - Query Endpoint", () => {
    it("should return audit logs for admin users", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.audit.getLogs({
        limit: 25,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.logs).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(typeof result.hasMore).toBe("boolean");
    });

    it("should throw FORBIDDEN for non-admin users", async () => {
      const ctx = createSupplierContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.audit.getLogs({ limit: 25, offset: 0 })
      ).rejects.toThrow("Only administrators can access audit logs");
    });

    it("should filter logs by date range", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const startDate = "2025-01-01T00:00:00.000Z";
      const endDate = "2025-12-31T23:59:59.999Z";

      const result = await caller.audit.getLogs({
        limit: 25,
        offset: 0,
        startDate,
        endDate,
      });

      expect(result).toBeDefined();
      expect(result.logs).toBeInstanceOf(Array);
      
      // All logs should be within date range
      result.logs.forEach(log => {
        const logDate = new Date(log.timestamp);
        expect(logDate.getTime()).toBeGreaterThanOrEqual(new Date(startDate).getTime());
        expect(logDate.getTime()).toBeLessThanOrEqual(new Date(endDate).getTime());
      });
    });

    it("should filter logs by action type", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.audit.getLogs({
        limit: 25,
        offset: 0,
        actions: ["LOGIN_SUCCESS"],
      });

      expect(result).toBeDefined();
      expect(result.logs).toBeInstanceOf(Array);
      
      // All logs should have action in the specified list
      result.logs.forEach(log => {
        expect(["LOGIN_SUCCESS"]).toContain(log.action);
      });
    });

    it("should filter logs by entity type", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.audit.getLogs({
        limit: 25,
        offset: 0,
        entityType: "partner",
      });

      expect(result).toBeDefined();
      expect(result.logs).toBeInstanceOf(Array);
      
      // All logs should have entityType = "partner"
      result.logs.forEach(log => {
        expect(log.entityType).toBe("partner");
      });
    });

    it("should filter logs by CUI access flag", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.audit.getLogs({
        limit: 25,
        offset: 0,
        isCUIAccess: true,
      });

      expect(result).toBeDefined();
      expect(result.logs).toBeInstanceOf(Array);
      
      // All logs should have isCUIAccess = true
      result.logs.forEach(log => {
        expect(log.isCUIAccess).toBe(true);
      });
    });

    it("should filter logs by IP address (partial match)", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const testIP = "192.168";

      const result = await caller.audit.getLogs({
        limit: 25,
        offset: 0,
        ipAddress: testIP,
      });

      expect(result).toBeDefined();
      expect(result.logs).toBeInstanceOf(Array);
      
      // All logs should have IP address containing the search string
      result.logs.forEach(log => {
        if (log.ipAddress) {
          expect(log.ipAddress).toContain(testIP);
        }
      });
    });

    it("should support pagination with offset", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const page1 = await caller.audit.getLogs({
        limit: 10,
        offset: 0,
      });

      const page2 = await caller.audit.getLogs({
        limit: 10,
        offset: 10,
      });

      expect(page1.logs).toBeInstanceOf(Array);
      expect(page2.logs).toBeInstanceOf(Array);
      
      // Pages should have different logs (if there are enough logs)
      if (page1.total > 10 && page1.logs.length > 0 && page2.logs.length > 0) {
        expect(page1.logs[0]?.id).not.toBe(page2.logs[0]?.id);
      }
    });

    it("should sort logs by timestamp descending by default", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.audit.getLogs({
        limit: 25,
        offset: 0,
        sortOrder: "desc",
      });

      expect(result.logs).toBeInstanceOf(Array);
      
      // Check that logs are sorted descending (newest first)
      for (let i = 0; i < result.logs.length - 1; i++) {
        const current = new Date(result.logs[i]!.timestamp).getTime();
        const next = new Date(result.logs[i + 1]!.timestamp).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it("should validate limit is within bounds", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.audit.getLogs({ limit: 0, offset: 0 })
      ).rejects.toThrow();

      await expect(
        caller.audit.getLogs({ limit: 101, offset: 0 })
      ).rejects.toThrow();
    });

    it("should validate offset is non-negative", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.audit.getLogs({ limit: 25, offset: -1 })
      ).rejects.toThrow();
    });
  });

  describe("audit.getStats - Statistics Endpoint", () => {
    it("should return audit statistics for admin users", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.audit.getStats({});

      expect(result).toBeDefined();
      expect(typeof result.totalEvents).toBe("number");
      expect(typeof result.cuiEvents).toBe("number");
      expect(typeof result.uniqueUsers).toBe("number");
      expect(typeof result.authEvents).toBe("number");
      expect(Array.isArray(result.topActions)).toBe(true);
    });

    it("should throw FORBIDDEN for non-admin users", async () => {
      const ctx = createSupplierContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.audit.getStats({})
      ).rejects.toThrow("Only administrators can access audit logs");
    });

    it("should filter stats by date range", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const startDate = "2025-01-01T00:00:00.000Z";
      const endDate = "2025-12-31T23:59:59.999Z";

      const result = await caller.audit.getStats({
        startDate,
        endDate,
      });

      expect(result).toBeDefined();
      expect(typeof result.totalEvents).toBe("number");
      expect(typeof result.cuiEvents).toBe("number");
      expect(typeof result.uniqueUsers).toBe("number");
      expect(typeof result.authEvents).toBe("number");
    });

    it("should count CUI access events correctly", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.audit.getStats({});

      expect(result.cuiEvents).toBeGreaterThanOrEqual(0);
      expect(result.cuiEvents).toBeLessThanOrEqual(result.totalEvents);
    });

    it("should count authentication events correctly", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.audit.getStats({});

      expect(result.authEvents).toBeGreaterThanOrEqual(0);
      expect(result.authEvents).toBeLessThanOrEqual(result.totalEvents);
    });

    it("should return top actions", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.audit.getStats({});

      expect(Array.isArray(result.topActions)).toBe(true);
      expect(result.topActions.length).toBeLessThanOrEqual(5);
      
      // Each top action should have action and count
      result.topActions.forEach(item => {
        expect(typeof item.action).toBe("string");
        expect(typeof item.count).toBe("number");
      });
    });
  });

  describe("audit.exportLogs - Export Endpoint", () => {
    it("should export logs as CSV for admin users", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.audit.exportLogs({
        format: "csv",
      });

      expect(result).toBeDefined();
      expect(result.format).toBe("csv");
      expect(result.data).toContain("ID");
      expect(result.data).toContain("Timestamp");
      expect(result.data).toContain("Action");
      expect(result.filename).toMatch(/audit-logs-.*\.csv/);
    });

    it("should export logs as JSON for admin users", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.audit.exportLogs({
        format: "json",
      });

      expect(result).toBeDefined();
      expect(result.format).toBe("json");
      
      // Should be valid JSON
      const parsed = JSON.parse(result.data);
      expect(Array.isArray(parsed)).toBe(true);
      expect(result.filename).toMatch(/audit-logs-.*\.json/);
    });

    it("should throw FORBIDDEN for non-admin users", async () => {
      const ctx = createSupplierContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.audit.exportLogs({ format: "csv" })
      ).rejects.toThrow("Only administrators can access audit logs");
    });

    it("should filter exported logs by date range", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const startDate = "2025-01-01T00:00:00.000Z";
      const endDate = "2025-12-31T23:59:59.999Z";

      const result = await caller.audit.exportLogs({
        format: "json",
        startDate,
        endDate,
      });

      expect(result).toBeDefined();
      
      const logs = JSON.parse(result.data);
      logs.forEach((log: any) => {
        const logDate = new Date(log.timestamp);
        expect(logDate.getTime()).toBeGreaterThanOrEqual(new Date(startDate).getTime());
        expect(logDate.getTime()).toBeLessThanOrEqual(new Date(endDate).getTime());
      });
    });

    it("should filter exported logs by action type", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.audit.exportLogs({
        format: "json",
        actions: ["LOGIN_SUCCESS"],
      });

      expect(result).toBeDefined();
      
      const logs = JSON.parse(result.data);
      logs.forEach((log: any) => {
        expect(["LOGIN_SUCCESS"]).toContain(log.action);
      });
    });

    it("should include all required fields in CSV export", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.audit.exportLogs({
        format: "csv",
      });

      expect(result.data).toContain("ID");
      expect(result.data).toContain("Timestamp");
      expect(result.data).toContain("Action");
      expect(result.data).toContain("Entity Type");
      expect(result.data).toContain("Entity ID");
      expect(result.data).toContain("IP Address");
      expect(result.data).toContain("User Agent");
      expect(result.data).toContain("CUI Access");
    });

    it("should include all required fields in JSON export", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.audit.exportLogs({
        format: "json",
      });

      const logs = JSON.parse(result.data);
      
      if (logs.length > 0) {
        const firstLog = logs[0];
        expect(firstLog).toHaveProperty("id");
        expect(firstLog).toHaveProperty("timestamp");
        expect(firstLog).toHaveProperty("action");
        expect(firstLog).toHaveProperty("entityType");
        expect(firstLog).toHaveProperty("actorId");
        expect(firstLog).toHaveProperty("isCUIAccess");
      }
    });

    it("should generate filenames with ISO timestamps", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.audit.exportLogs({ format: "csv" });

      expect(result.filename).toMatch(/audit-logs-\d{4}-\d{2}-\d{2}T.*\.csv/);
    });
  });

  describe("Permission Checks", () => {
    it("should allow admin users to access all audit endpoints", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.audit.getLogs({ limit: 25, offset: 0 })
      ).resolves.toBeDefined();

      await expect(
        caller.audit.getStats({})
      ).resolves.toBeDefined();

      await expect(
        caller.audit.exportLogs({ format: "csv" })
      ).resolves.toBeDefined();
    });

    it("should allow compliance officers to access audit endpoints", async () => {
      const ctx = createOfficerContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.audit.getLogs({ limit: 25, offset: 0 })
      ).resolves.toBeDefined();

      await expect(
        caller.audit.getStats({})
      ).resolves.toBeDefined();

      await expect(
        caller.audit.exportLogs({ format: "csv" })
      ).resolves.toBeDefined();
    });

    it("should deny supplier users access to audit endpoints", async () => {
      const ctx = createSupplierContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.audit.getLogs({ limit: 25, offset: 0 })
      ).rejects.toThrow("Only administrators can access audit logs");

      await expect(
        caller.audit.getStats({})
      ).rejects.toThrow("Only administrators can access audit logs");

      await expect(
        caller.audit.exportLogs({ format: "csv" })
      ).rejects.toThrow("Only administrators can access audit logs");
    });
  });
});
