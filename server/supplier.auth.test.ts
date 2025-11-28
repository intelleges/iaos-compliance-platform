import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { partnerQuestionnaires, partners, touchpoints, questionnaires, touchpointQuestionnaires } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Supplier Authentication Flow Tests
 * 
 * Tests the complete supplier authentication workflow:
 * 1. validateAccessCode - creates session and returns token
 * 2. getSession - validates session from cookie or Authorization header
 * 3. getQuestionnaire - fetches questionnaire data with valid session
 */

describe("Supplier Authentication Flow", () => {
  let testAccessCode: string;
  let testAssignmentId: number;
  let sessionToken: string;

  beforeAll(async () => {
    // Find an existing test assignment with INVITED status
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const assignments = await db
      .select()
      .from(partnerQuestionnaires)
      .where(eq(partnerQuestionnaires.status, 6)) // INVITED
      .limit(1);

    if (assignments.length === 0) {
      throw new Error("No test assignment found with INVITED status. Run create-test-assignment.ts first.");
    }

    testAssignmentId = assignments[0]!.id;
    testAccessCode = assignments[0]!.accessCode!;
  });

  it("validateAccessCode creates session and returns token", async () => {
    // Create mock context
    const mockReq = {
      protocol: "https",
      headers: {},
      cookies: {},
    } as any;

    const mockRes = {
      cookie: (name: string, value: string, options: any) => {
        // Store cookie for later verification
        mockReq.cookies[name] = value;
      },
      clearCookie: (name: string, options?: any) => {
        delete mockReq.cookies[name];
      },
    } as any;

    const ctx: TrpcContext = {
      user: null,
      req: mockReq,
      res: mockRes,
    };

    const caller = appRouter.createCaller(ctx);

    // Call validateAccessCode
    const result = await caller.supplier.validateAccessCode({
      accessCode: testAccessCode,
    });

    // Verify response
    expect(result.success).toBe(true);
    expect(result.sessionToken).toBeDefined();
    expect(typeof result.sessionToken).toBe("string");
    expect(result.assignment).toBeDefined();
    expect(result.assignment.id).toBe(testAssignmentId);

    // Store session token for next tests
    sessionToken = result.sessionToken;

    // Verify session token is valid JSON
    const session = JSON.parse(sessionToken);
    expect(session.assignmentId).toBe(testAssignmentId);
    expect(session.accessCode).toBe(testAccessCode);
    expect(session.createdAt).toBeDefined();
    // Note: lastActivity might not be in the session object depending on implementation

    // Verify cookie was set
    expect(mockReq.cookies.supplier_session).toBe(sessionToken);
  });

  it("getSession validates session from cookie", async () => {
    // Create mock context with session cookie
    const mockReq = {
      protocol: "https",
      headers: {},
      cookies: {
        supplier_session: sessionToken,
      },
    } as any;

    const mockRes = {
      cookie: (name: string, value: string, options?: any) => {},
      clearCookie: (name: string, options?: any) => {},
    } as any;

    const ctx: TrpcContext = {
      user: null,
      req: mockReq,
      res: mockRes,
    };

    const caller = appRouter.createCaller(ctx);

    // Call getSession
    const result = await caller.supplier.getSession();

    // Verify response
    expect(result.authenticated).toBe(true);
    expect(result.assignment).toBeDefined();
    expect(result.assignment?.id).toBe(testAssignmentId);
  });

  it("getSession validates session from Authorization header (localStorage fallback)", async () => {
    // Create mock context with Authorization header (simulating localStorage approach)
    const mockReq = {
      protocol: "https",
      headers: {
        authorization: `Bearer ${sessionToken}`,
      },
      cookies: {},
    } as any;

    const mockRes = {
      cookie: (name: string, value: string, options?: any) => {},
      clearCookie: (name: string, options?: any) => {},
    } as any;

    const ctx: TrpcContext = {
      user: null,
      req: mockReq,
      res: mockRes,
    };

    const caller = appRouter.createCaller(ctx);

    // Call getSession
    const result = await caller.supplier.getSession();

    // Verify response
    expect(result.authenticated).toBe(true);
    expect(result.assignment).toBeDefined();
    expect(result.assignment?.id).toBe(testAssignmentId);
  });

  it("getSession returns unauthenticated when no session provided", async () => {
    // Create mock context without session
    const mockReq = {
      protocol: "https",
      headers: {},
      cookies: {},
    } as any;

    const mockRes = {
      cookie: (name: string, value: string, options?: any) => {},
      clearCookie: (name: string, options?: any) => {},
    } as any;

    const ctx: TrpcContext = {
      user: null,
      req: mockReq,
      res: mockRes,
    };

    const caller = appRouter.createCaller(ctx);

    // Call getSession
    const result = await caller.supplier.getSession();

    // Verify response
    expect(result.authenticated).toBe(false);
    expect(result.assignment).toBeUndefined();
  });

  it("getQuestionnaire returns questions with valid session", async () => {
    // Create mock context with session
    const mockReq = {
      protocol: "https",
      headers: {
        authorization: `Bearer ${sessionToken}`,
      },
      cookies: {},
    } as any;

    const mockRes = {
      cookie: (name: string, value: string, options?: any) => {},
      clearCookie: (name: string, options?: any) => {},
    } as any;

    const ctx: TrpcContext = {
      user: null,
      req: mockReq,
      res: mockRes,
    };

    const caller = appRouter.createCaller(ctx);

    // Call getQuestionnaire
    const result = await caller.supplier.getQuestionnaire();

    // Verify response
    expect(result.questions).toBeDefined();
    expect(Array.isArray(result.questions)).toBe(true);
    expect(result.questions.length).toBeGreaterThan(0);

    // Verify question structure
    const firstQuestion = result.questions[0];
    expect(firstQuestion).toBeDefined();
    expect(firstQuestion?.id).toBeDefined();
    expect(firstQuestion?.question).toBeDefined();
    expect(firstQuestion?.responseType).toBeDefined();
  });

  it("getQuestionnaire fails without valid session", async () => {
    // Create mock context without session
    const mockReq = {
      protocol: "https",
      headers: {},
      cookies: {},
    } as any;

    const mockRes = {
      cookie: (name: string, value: string, options?: any) => {},
      clearCookie: (name: string, options?: any) => {},
    } as any;

    const ctx: TrpcContext = {
      user: null,
      req: mockReq,
      res: mockRes,
    };

    const caller = appRouter.createCaller(ctx);

    // Call getQuestionnaire - should fail
    await expect(caller.supplier.getQuestionnaire()).rejects.toThrow();
  });
});
