import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    enterpriseId: null,
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

function createEnterpriseOwnerContext(enterpriseId: number): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "enterprise-owner",
    email: "owner@enterprise.com",
    name: "Enterprise Owner",
    loginMethod: "manus",
    role: "enterprise_owner",
    enterpriseId,
    firstName: "Enterprise",
    lastName: "Owner",
    title: "CEO",
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

function createRegularUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 3,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    enterpriseId: 1,
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("enterprises.list", () => {
  it("allows admin to list all enterprises", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.enterprises.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("denies non-admin access to enterprise list", async () => {
    const { ctx } = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.enterprises.list()).rejects.toThrow("Admin access required");
  });
});

describe("partners.list", () => {
  it("allows procurement team to list partners", async () => {
    const { ctx } = createEnterpriseOwnerContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.partners.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("scopes partners to user's enterprise", async () => {
    const { ctx } = createEnterpriseOwnerContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.partners.list();

    // All partners should belong to the user's enterprise
    result.forEach(partner => {
      expect(partner.enterpriseId).toBe(1);
    });
  });
});

describe("protocols.list", () => {
  it("allows compliance officer to list protocols", async () => {
    const { ctx } = createEnterpriseOwnerContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.protocols.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("scopes protocols to user's enterprise", async () => {
    const { ctx } = createEnterpriseOwnerContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.protocols.list();

    // All protocols should belong to the user's enterprise
    result.forEach(protocol => {
      expect(protocol.enterpriseId).toBe(1);
    });
  });
});

describe("RBAC enforcement", () => {
  it("admin can access all enterprise data", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Admin should be able to list enterprises
    const enterprises = await caller.enterprises.list();
    expect(Array.isArray(enterprises)).toBe(true);
  });

  it("enterprise owner cannot access enterprise list", async () => {
    const { ctx } = createEnterpriseOwnerContext(1);
    const caller = appRouter.createCaller(ctx);

    // Enterprise owner should NOT be able to list all enterprises
    await expect(caller.enterprises.list()).rejects.toThrow("Admin access required");
  });

  it("regular user cannot access partner management", async () => {
    const { ctx } = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);

    // Regular user should NOT be able to list partners
    await expect(caller.partners.list()).rejects.toThrow("Procurement team access required");
  });
});

describe("Multi-tenant data isolation", () => {
  it("enforces row-level security for partners", async () => {
    const { ctx } = createEnterpriseOwnerContext(1);
    const caller = appRouter.createCaller(ctx);

    const partners = await caller.partners.list();

    // Verify all partners belong to enterprise 1
    partners.forEach(partner => {
      expect(partner.enterpriseId).toBe(1);
      expect(partner.active).toBe(true); // Only active records
    });
  });

  it("enforces row-level security for protocols", async () => {
    const { ctx } = createEnterpriseOwnerContext(1);
    const caller = appRouter.createCaller(ctx);

    const protocols = await caller.protocols.list();

    // Verify all protocols belong to enterprise 1
    protocols.forEach(protocol => {
      expect(protocol.enterpriseId).toBe(1);
      expect(protocol.active).toBe(true); // Only active records
    });
  });
});
