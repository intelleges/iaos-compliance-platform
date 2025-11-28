import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(role: "admin" | "user" = "admin", enterpriseId: number | null = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@intelleges.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    enterpriseId,
    firstName: null,
    lastName: null,
    title: null,
    phone: null,
    internalId: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Touchpoint Management", () => {
  it("should list all touchpoints for admin", async () => {
    const ctx = createTestContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.touchpoints.list();

    expect(Array.isArray(result)).toBe(true);
    // Result may be empty or contain touchpoints depending on database state
  });

  it("should list touchpoints by protocol", async () => {
    const ctx = createTestContext("admin");
    const caller = appRouter.createCaller(ctx);

    // Use protocol ID 1 if it exists
    const result = await caller.touchpoints.listByProtocol({ protocolId: 1 });

    expect(Array.isArray(result)).toBe(true);
    // All touchpoints should belong to protocol 1
    result.forEach(touchpoint => {
      expect(touchpoint.protocolId).toBe(1);
    });
  });

  it("should require compliance officer role or higher for touchpoint operations", async () => {
    const ctx = createTestContext("user", 1);
    const caller = appRouter.createCaller(ctx);

    // Regular users should not be able to list touchpoints
    await expect(caller.touchpoints.list()).rejects.toThrow();
  });

  it("should create, update, and archive a touchpoint (integration test)", async () => {
    const ctx = createTestContext("admin", 1);
    const caller = appRouter.createCaller(ctx);

    // Get existing protocols to use for test
    const protocols = await caller.protocols.list({ enterpriseId: 1 });
    
    if (protocols.length === 0) {
      console.log("Skipping integration test: no protocols available");
      return;
    }

    const testProtocolId = protocols[0]!.id;

    // Create touchpoint
    const created = await caller.touchpoints.create({
      protocolId: testProtocolId,
      title: "Test Touchpoint " + Date.now(),
      description: "Test description",
      abbreviation: "TEST",
      purpose: "Testing purposes",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      target: 50,
      automaticReminder: true,
    });

    expect(created).toBeDefined();
    expect(created.title).toContain("Test Touchpoint");
    expect(created.protocolId).toBe(testProtocolId);
    expect(created.active).toBe(true);

    const touchpointId = created.id;

    // Get touchpoint
    const retrieved = await caller.touchpoints.get({ id: touchpointId });
    expect(retrieved.id).toBe(touchpointId);
    expect(retrieved.title).toBe(created.title);

    // Update touchpoint
    const updated = await caller.touchpoints.update({
      id: touchpointId,
      title: "Updated Test Touchpoint",
      target: 100,
      automaticReminder: false,
    });

    expect(updated.title).toBe("Updated Test Touchpoint");
    expect(updated.target).toBe(100);
    expect(updated.automaticReminder).toBe(false);

    // Archive touchpoint
    await caller.touchpoints.archive({ id: touchpointId });

    // Verify it's no longer in active list
    const activeTouchpoints = await caller.touchpoints.list();
    const archivedTouchpoint = activeTouchpoints.find((t) => t.id === touchpointId);
    expect(archivedTouchpoint).toBeUndefined();
  });
});
