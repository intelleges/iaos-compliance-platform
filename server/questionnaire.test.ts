import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("partner.getQuestionnaire", () => {
  it("returns mock questionnaire data with all question types", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.partner.getQuestionnaire({ accessCode: "TEST123" });

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.title).toBe("Federal Compliance Questionnaire 2025");
    expect(result.partnerName).toBe("Sample Partner Company");
    expect(result.questions).toHaveLength(7);

    // Verify question types
    expect(result.questions[0]?.responseType).toBe(1); // TEXT_SHORT
    expect(result.questions[1]?.responseType).toBe(5); // YES_NO
    expect(result.questions[2]?.responseType).toBe(7); // FILE_UPLOAD
    expect(result.questions[3]?.responseType).toBe(9); // DATE
    expect(result.questions[4]?.responseType).toBe(2); // TEXT_LONG
    expect(result.questions[5]?.responseType).toBe(4); // RADIO
    expect(result.questions[6]?.responseType).toBe(6); // CHECKBOX
  });

  it("includes skip logic configuration", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.partner.getQuestionnaire({ accessCode: "TEST123" });

    // Question 2 has skip logic: if answer is No (0), skip to question 5
    const question2 = result.questions[1];
    expect(question2?.skipLogicAnswer).toBe(0);
    expect(question2?.skipLogicJump).toBe("5");
  });

  it("includes response options for radio and checkbox questions", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.partner.getQuestionnaire({ accessCode: "TEST123" });

    // Radio question (question 6) should have options
    const radioQuestion = result.questions[5];
    expect(radioQuestion?.options).toHaveLength(4);
    expect(radioQuestion?.options[0]?.description).toBe("Small Business");

    // Checkbox question (question 7) should have options
    const checkboxQuestion = result.questions[6];
    expect(checkboxQuestion?.options).toHaveLength(5);
    expect(checkboxQuestion?.options[0]?.description).toBe("Manufacturing");
  });
});

describe("partner.saveDraft", () => {
  it("accepts draft answers and returns success", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.partner.saveDraft({
      accessCode: "TEST123",
      answers: {
        "1": "Acme Corporation",
        "2": 1,
      },
    });

    expect(result.success).toBe(true);
  });
});

describe("partner.submitQuestionnaire", () => {
  it("accepts final questionnaire submission", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.partner.submitQuestionnaire({
      accessCode: "TEST123",
      answers: {
        "1": "Acme Corporation",
        "2": 1,
        "3": "certification.pdf",
        "4": "2024-01-15",
        "6": 1,
        "7": [5, 6],
      },
      fileUploads: {
        "3": "https://s3.example.com/certification.pdf",
      },
    });

    expect(result.success).toBe(true);
  });
});
