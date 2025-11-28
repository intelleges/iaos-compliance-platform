import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createEnterpriseContext(enterpriseId: number): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "user@test.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    enterpriseId: enterpriseId,
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
      cookie: () => {},
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Response Tracking Dashboard", () => {
  it("should return grid data with mock values", async () => {
    const ctx = createEnterpriseContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.responseTracking.getGrid({
      protocolId: 1,
      touchpointId: 1,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should return rows with required structure", async () => {
    const ctx = createEnterpriseContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.responseTracking.getGrid({
      protocolId: 1,
      touchpointId: 1,
    });

    const firstRow = result[0];
    expect(firstRow).toHaveProperty("groupName");
    expect(firstRow).toHaveProperty("partnerType");
    expect(firstRow).toHaveProperty("statuses");
    expect(firstRow).toHaveProperty("total");
  });

  it("should return all 8 status columns", async () => {
    const ctx = createEnterpriseContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.responseTracking.getGrid({
      protocolId: 1,
      touchpointId: 1,
    });

    const firstRow = result[0];
    const statuses = firstRow?.statuses;
    
    expect(statuses).toHaveProperty("G");
    expect(statuses).toHaveProperty("U");
    expect(statuses).toHaveProperty("R");
    expect(statuses).toHaveProperty("C");
    expect(statuses).toHaveProperty("N/R");
    expect(statuses).toHaveProperty("R/I");
    expect(statuses).toHaveProperty("R/C");
    expect(statuses).toHaveProperty("T");
  });

  it("should return valid numeric counts", async () => {
    const ctx = createEnterpriseContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.responseTracking.getGrid({
      protocolId: 1,
      touchpointId: 1,
    });

    result.forEach((row) => {
      expect(typeof row.total).toBe("number");
      expect(row.total).toBeGreaterThanOrEqual(0);
      
      Object.values(row.statuses).forEach((count) => {
        expect(typeof count).toBe("number");
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });
  });

  it("should work without optional filters", async () => {
    const ctx = createEnterpriseContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.responseTracking.getGrid({});

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});
