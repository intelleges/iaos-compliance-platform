import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { SUPPLIER_SESSION_COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { createSupplierSession } from "./utils/supplier-session";
import { getDb } from "./db";
import { questionnaireResponses } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

async function createSupplierContext(assignmentId: number): Promise<{ ctx: TrpcContext; sessionToken: string }> {
  const session = createSupplierSession({
    assignmentId,
    accessCode: 'TEST_CODE',
    partnerId: 1,
  });
  const sessionToken = JSON.stringify(session);

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {
        authorization: `Bearer ${sessionToken}`,
      },
      cookies: {
        [SUPPLIER_SESSION_COOKIE_NAME]: sessionToken,
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx, sessionToken };
}

describe("supplier.saveResponse", () => {
  const TEST_ASSIGNMENT_ID = 1; // Use existing test assignment
  const TEST_QUESTION_ID = 1; // First question in questionnaire

  beforeEach(async () => {
    // Clean up any existing test responses
    const db = await getDb();
    if (db) {
      await db
        .delete(questionnaireResponses)
        .where(
          and(
            eq(questionnaireResponses.partnerQuestionnaireId, TEST_ASSIGNMENT_ID),
            eq(questionnaireResponses.questionId, TEST_QUESTION_ID)
          )
        );
    }
  });

  it("saves a text response", async () => {
    const { ctx } = await createSupplierContext(TEST_ASSIGNMENT_ID);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.supplier.saveResponse({
      questionId: TEST_QUESTION_ID,
      value: "This is my answer",
    });

    expect(result).toEqual({ success: true });

    // Verify response was saved to database
    const db = await getDb();
    if (db) {
      const saved = await db
        .select()
        .from(questionnaireResponses)
        .where(
          and(
            eq(questionnaireResponses.partnerQuestionnaireId, TEST_ASSIGNMENT_ID),
            eq(questionnaireResponses.questionId, TEST_QUESTION_ID)
          )
        );

      expect(saved.length).toBe(1);
      expect(saved[0]?.comment).toBe("This is my answer");
    }
  });

  it("saves a numeric response", async () => {
    const { ctx } = await createSupplierContext(TEST_ASSIGNMENT_ID);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.supplier.saveResponse({
      questionId: TEST_QUESTION_ID,
      value: 42,
    });

    expect(result).toEqual({ success: true });

    // Verify response was saved
    const db = await getDb();
    if (db) {
      const saved = await db
        .select()
        .from(questionnaireResponses)
        .where(
          and(
            eq(questionnaireResponses.partnerQuestionnaireId, TEST_ASSIGNMENT_ID),
            eq(questionnaireResponses.questionId, TEST_QUESTION_ID)
          )
        );

      expect(saved.length).toBe(1);
      expect(saved[0]?.value).toBe(42);
      expect(saved[0]?.responseId).toBe(42);
    }
  });

  it("saves an array response (checkbox)", async () => {
    const { ctx } = await createSupplierContext(TEST_ASSIGNMENT_ID);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.supplier.saveResponse({
      questionId: TEST_QUESTION_ID,
      value: [1, 2, 3],
    });

    expect(result).toEqual({ success: true });

    // Verify response was saved
    const db = await getDb();
    if (db) {
      const saved = await db
        .select()
        .from(questionnaireResponses)
        .where(
          and(
            eq(questionnaireResponses.partnerQuestionnaireId, TEST_ASSIGNMENT_ID),
            eq(questionnaireResponses.questionId, TEST_QUESTION_ID)
          )
        );

      expect(saved.length).toBe(1);
      expect(saved[0]?.comment).toBe("1,2,3");
    }
  });

  it("updates existing response", async () => {
    const { ctx } = await createSupplierContext(TEST_ASSIGNMENT_ID);
    const caller = appRouter.createCaller(ctx);

    // Save initial response
    await caller.supplier.saveResponse({
      questionId: TEST_QUESTION_ID,
      value: "Initial answer",
    });

    // Update response
    await caller.supplier.saveResponse({
      questionId: TEST_QUESTION_ID,
      value: "Updated answer",
    });

    // Verify only one response exists with updated value
    const db = await getDb();
    if (db) {
      const saved = await db
        .select()
        .from(questionnaireResponses)
        .where(
          and(
            eq(questionnaireResponses.partnerQuestionnaireId, TEST_ASSIGNMENT_ID),
            eq(questionnaireResponses.questionId, TEST_QUESTION_ID)
          )
        );

      expect(saved.length).toBe(1);
      expect(saved[0]?.comment).toBe("Updated answer");
    }
  });

  it("restores saved responses in getQuestionnaire", async () => {
    const { ctx } = await createSupplierContext(TEST_ASSIGNMENT_ID);
    const caller = appRouter.createCaller(ctx);

    // Save some responses
    await caller.supplier.saveResponse({
      questionId: TEST_QUESTION_ID,
      value: "Saved answer",
    });

    // Get questionnaire
    const questionnaire = await caller.supplier.getQuestionnaire();

    expect(questionnaire.savedResponses).toBeDefined();
    expect(questionnaire.savedResponses.has(TEST_QUESTION_ID)).toBe(true);
    expect(questionnaire.savedResponses.get(TEST_QUESTION_ID)?.comment).toBe("Saved answer");
  });

  it("rejects unauthenticated requests", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
        cookies: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
        cookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.supplier.saveResponse({
        questionId: TEST_QUESTION_ID,
        value: "Test",
      })
    ).rejects.toThrow("No active session");
  });
});
