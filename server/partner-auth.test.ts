import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { partners, partnerAccessCodes } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: undefined,
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

describe("Partner Authentication Flow", () => {
  let testAccessCode: string;
  let testPartnerId: number;
  
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test partner
    const [partnerResult] = await db.insert(partners).values({
      enterpriseId: 1,
      name: "Test Supplier Inc.",
      email: "supplier@test.com",
      internalId: "TEST-001",
      active: true,
    });
    
    testPartnerId = Number(partnerResult.insertId);

    // Create a test access code
    testAccessCode = "TEST1234";
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    await db.insert(partnerAccessCodes).values({
      code: testAccessCode,
      partnerId: testPartnerId,
      expiresAt,
      used: false,
    });
  });

  it("should validate a valid access code and return partner email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.partner.validateAccessCode({
      accessCode: testAccessCode,
    });

    expect(result).toBeDefined();
    expect(result.email).toBe("supplier@test.com");
    expect(result.partnerName).toBe("Test Supplier Inc.");
  });

  it("should reject an invalid access code", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.partner.validateAccessCode({
        accessCode: "INVALID123",
      })
    ).rejects.toThrow("Invalid access code");
  });

  it("should send verification code for valid access code", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.partner.sendVerificationCode({
      accessCode: testAccessCode,
    });

    expect(result.success).toBe(true);
  });

  it("should reject verification with invalid code", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.partner.verifyEmailCode({
        accessCode: testAccessCode,
        verificationCode: "000000",
      })
    ).rejects.toThrow("Invalid verification code");
  });

  it("should reject expired access code", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create an expired access code
    const expiredCode = "EXPIRED1";
    const expiredDate = new Date(Date.now() - 1000); // Already expired
    
    await db.insert(partnerAccessCodes).values({
      code: expiredCode,
      partnerId: testPartnerId,
      expiresAt: expiredDate,
      used: false,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.partner.validateAccessCode({
        accessCode: expiredCode,
      })
    ).rejects.toThrow("expired");
  });

  it("should reject already-used access code", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a used access code
    const usedCode = "USED1234";
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    await db.insert(partnerAccessCodes).values({
      code: usedCode,
      partnerId: testPartnerId,
      expiresAt,
      used: true,
      usedAt: new Date(),
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.partner.validateAccessCode({
        accessCode: usedCode,
      })
    ).rejects.toThrow("already been used");
  });
});
