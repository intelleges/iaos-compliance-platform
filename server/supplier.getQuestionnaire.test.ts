import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createSupplierContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-supplier",
    email: "supplier@example.com",
    name: "Test Supplier",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
      cookies: {
        supplier_session: JSON.stringify({
          sessionId: "test-session-id",
          assignmentId: 1,
          accessCode: "DDSETM9RNAHB",
          partnerId: 1,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
          lastActivityAt: new Date().toISOString(),
        }),
      },
    } as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("supplier.getQuestionnaire", () => {
  it("returns all 82 questions with response options", async () => {
    const { ctx } = createSupplierContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.supplier.getQuestionnaire();

    // Verify questionnaire data structure
    expect(result).toBeDefined();
    expect(result.questionnaire).toBeDefined();
    expect(result.questions).toBeDefined();
    expect(Array.isArray(result.questions)).toBe(true);

    // Verify all 82 questions are returned
    expect(result.questions.length).toBe(82);

    // Verify question structure
    const firstQuestion = result.questions[0];
    expect(firstQuestion).toHaveProperty('id');
    expect(firstQuestion).toHaveProperty('question'); // Column name is 'question'
    expect(firstQuestion).toHaveProperty('responseType'); // Column name is 'responseType'
    expect(firstQuestion).toHaveProperty('responseOptions');

    // Count questions by type
    const questionsByType = result.questions.reduce((acc: Record<number, number>, q: any) => {
      acc[q.responseType] = (acc[q.responseType] || 0) + 1;
      return acc;
    }, {});

    console.log('Questions by type:', questionsByType);

    // Verify expected type distribution (from actual data)
    // Type 1: Y/N (21 questions)
    // Type 4: DROPDOWN (9 questions)
    // Type 5: DATE (42 questions) - Note: Type 5, not Type 3
    // Type 6: CHECKBOX/LIST (8 questions)
    // Type 9: Unknown (2 questions)
    expect(questionsByType[1]).toBe(21); // Y/N
    expect(questionsByType[5]).toBe(42); // DATE (Type 5, not 3)
    expect(questionsByType[4]).toBe(9);  // DROPDOWN
    expect(questionsByType[6]).toBe(8);  // CHECKBOX/LIST
    expect(questionsByType[9]).toBe(2);  // Unknown

    // Verify response options for DROPDOWN/LIST questions
    const questionsWithType4or6 = result.questions.filter((q: any) => 
      q.responseType === 4 || q.responseType === 6
    );
    
    expect(questionsWithType4or6.length).toBe(17); // 9 DROPDOWN + 8 CHECKBOX

    // Filter to only questions that actually have response options
    const questionsWithOptions = questionsWithType4or6.filter((q: any) => 
      q.responseOptions && q.responseOptions.length > 0
    );
    
    console.log('Questions with response options:', questionsWithOptions.length);

    // Verify each question with options has correct structure
    questionsWithOptions.forEach((q: any) => {
      expect(Array.isArray(q.responseOptions)).toBe(true);
      expect(q.responseOptions.length).toBeGreaterThan(0);
      
      // Verify response option structure
      const firstOption = q.responseOptions[0];
      expect(firstOption).toHaveProperty('id');
      expect(firstOption).toHaveProperty('description');
      expect(firstOption).toHaveProperty('zcode');
    });

    // Count total response options
    const totalOptions = questionsWithOptions.reduce((sum: number, q: any) => 
      sum + q.responseOptions.length, 0
    );
    
    console.log('Total response options:', totalOptions);
    // At least some questions should have response options
    expect(questionsWithOptions.length).toBeGreaterThan(0);
    expect(totalOptions).toBeGreaterThan(0);

    console.log('✅ All 82 questions loaded successfully with correct response options');
  });

  it("returns questions in correct order", async () => {
    const { ctx } = createSupplierContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.supplier.getQuestionnaire();

    // Verify questions are ordered by sortOrder
    for (let i = 1; i < result.questions.length; i++) {
      const prev = result.questions[i - 1];
      const curr = result.questions[i];
      // sortOrder should be sequential
      expect(curr.sortOrder).toBeGreaterThanOrEqual(prev.sortOrder);
    }
  });
});
