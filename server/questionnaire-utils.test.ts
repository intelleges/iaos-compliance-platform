import { describe, expect, it } from "vitest";

/**
 * Questionnaire Utilities Tests
 * Skip logic, validation, and progress calculation
 * Based on INT.DOC.08 Section 3.3
 */

type QuestionData = {
  id: number;
  question: string;
  responseType: number;
  required: boolean;
  skipLogicAnswer: number | null;
  skipLogicJump: string | null;
};

type QuestionResponse = {
  responseText?: string | null;
  responseInt?: number | null;
  responseDate?: Date | null;
  uploadUrl?: string | null;
};

function evaluateSkipLogic(
  question: QuestionData,
  response: QuestionResponse
): string | null {
  if (question.skipLogicAnswer === null || !question.skipLogicJump) {
    return null;
  }

  const shouldSkip = response.responseInt === question.skipLogicAnswer;
  return shouldSkip ? question.skipLogicJump : null;
}

function validateResponse(
  question: QuestionData,
  response: QuestionResponse
): string | null {
  if (question.required) {
    const hasResponse = 
      response.responseText ||
      (response.responseInt !== null && response.responseInt !== undefined) ||
      response.responseDate ||
      response.uploadUrl;

    if (!hasResponse) {
      return 'This question is required';
    }
  }

  return null;
}

function calculateProgress(
  questions: QuestionData[],
  responses: Map<number, QuestionResponse>
): number {
  if (questions.length === 0) return 0;

  const answeredCount = questions.filter(q => {
    const response = responses.get(q.id);
    if (!response) return false;

    return (
      response.responseText ||
      (response.responseInt !== null && response.responseInt !== undefined) ||
      response.responseDate ||
      response.uploadUrl
    );
  }).length;

  return Math.round((answeredCount / questions.length) * 100);
}

describe("Skip Logic Evaluation", () => {
  it("returns null when no skip logic configured", () => {
    const question: QuestionData = {
      id: 1,
      question: "Do you have employees?",
      responseType: 5,
      required: true,
      skipLogicAnswer: null,
      skipLogicJump: null,
    };

    const response: QuestionResponse = { responseInt: 1 };
    expect(evaluateSkipLogic(question, response)).toBeNull();
  });

  it("returns jump target when skip condition is met", () => {
    const question: QuestionData = {
      id: 1,
      question: "Do you have employees?",
      responseType: 5,
      required: true,
      skipLogicAnswer: 0, // Skip if answer is No (0)
      skipLogicJump: "Q5", // Jump to question 5
    };

    const response: QuestionResponse = { responseInt: 0 };
    expect(evaluateSkipLogic(question, response)).toBe("Q5");
  });

  it("returns null when skip condition is not met", () => {
    const question: QuestionData = {
      id: 1,
      question: "Do you have employees?",
      responseType: 5,
      required: true,
      skipLogicAnswer: 0, // Skip if answer is No (0)
      skipLogicJump: "Q5",
    };

    const response: QuestionResponse = { responseInt: 1 }; // Answer is Yes
    expect(evaluateSkipLogic(question, response)).toBeNull();
  });

  it("handles multiple skip logic scenarios", () => {
    const testCases = [
      {
        question: { id: 1, question: "Q1", responseType: 5, required: true, skipLogicAnswer: 1, skipLogicJump: "Q10" },
        response: { responseInt: 1 },
        expected: "Q10",
      },
      {
        question: { id: 2, question: "Q2", responseType: 5, required: true, skipLogicAnswer: 1, skipLogicJump: "Q10" },
        response: { responseInt: 0 },
        expected: null,
      },
      {
        question: { id: 3, question: "Q3", responseType: 5, required: true, skipLogicAnswer: 2, skipLogicJump: "END" },
        response: { responseInt: 2 },
        expected: "END",
      },
    ];

    for (const { question, response, expected } of testCases) {
      expect(evaluateSkipLogic(question, response)).toBe(expected);
    }
  });
});

describe("Response Validation", () => {
  it("validates required text response", () => {
    const question: QuestionData = {
      id: 1,
      question: "Company Name",
      responseType: 1,
      required: true,
      skipLogicAnswer: null,
      skipLogicJump: null,
    };

    const emptyResponse: QuestionResponse = {};
    expect(validateResponse(question, emptyResponse)).toBe('This question is required');

    const validResponse: QuestionResponse = { responseText: "Acme Corp" };
    expect(validateResponse(question, validResponse)).toBeNull();
  });

  it("validates required numeric response", () => {
    const question: QuestionData = {
      id: 2,
      question: "Number of employees",
      responseType: 10,
      required: true,
      skipLogicAnswer: null,
      skipLogicJump: null,
    };

    const emptyResponse: QuestionResponse = {};
    expect(validateResponse(question, emptyResponse)).toBe('This question is required');

    const validResponse: QuestionResponse = { responseInt: 50 };
    expect(validateResponse(question, validResponse)).toBeNull();

    const zeroResponse: QuestionResponse = { responseInt: 0 };
    expect(validateResponse(question, zeroResponse)).toBeNull(); // 0 is valid
  });

  it("allows empty response for optional questions", () => {
    const question: QuestionData = {
      id: 3,
      question: "Additional comments",
      responseType: 2,
      required: false,
      skipLogicAnswer: null,
      skipLogicJump: null,
    };

    const emptyResponse: QuestionResponse = {};
    expect(validateResponse(question, emptyResponse)).toBeNull();
  });

  it("validates required date response", () => {
    const question: QuestionData = {
      id: 4,
      question: "Certification expiration date",
      responseType: 9,
      required: true,
      skipLogicAnswer: null,
      skipLogicJump: null,
    };

    const emptyResponse: QuestionResponse = {};
    expect(validateResponse(question, emptyResponse)).toBe('This question is required');

    const validResponse: QuestionResponse = { responseDate: new Date('2025-12-31') };
    expect(validateResponse(question, validResponse)).toBeNull();
  });

  it("validates required file upload", () => {
    const question: QuestionData = {
      id: 5,
      question: "Upload certificate",
      responseType: 7,
      required: true,
      skipLogicAnswer: null,
      skipLogicJump: null,
    };

    const emptyResponse: QuestionResponse = {};
    expect(validateResponse(question, emptyResponse)).toBe('This question is required');

    const validResponse: QuestionResponse = { uploadUrl: "https://storage.example.com/cert.pdf" };
    expect(validateResponse(question, validResponse)).toBeNull();
  });
});

describe("Progress Calculation", () => {
  const questions: QuestionData[] = [
    { id: 1, question: "Q1", responseType: 5, required: true, skipLogicAnswer: null, skipLogicJump: null },
    { id: 2, question: "Q2", responseType: 1, required: true, skipLogicAnswer: null, skipLogicJump: null },
    { id: 3, question: "Q3", responseType: 10, required: false, skipLogicAnswer: null, skipLogicJump: null },
    { id: 4, question: "Q4", responseType: 9, required: true, skipLogicAnswer: null, skipLogicJump: null },
  ];

  it("returns 0% for empty questionnaire", () => {
    const responses = new Map<number, QuestionResponse>();
    expect(calculateProgress([], responses)).toBe(0);
  });

  it("returns 0% when no questions answered", () => {
    const responses = new Map<number, QuestionResponse>();
    expect(calculateProgress(questions, responses)).toBe(0);
  });

  it("returns 25% when 1 of 4 questions answered", () => {
    const responses = new Map<number, QuestionResponse>([
      [1, { responseInt: 1 }],
    ]);
    expect(calculateProgress(questions, responses)).toBe(25);
  });

  it("returns 50% when 2 of 4 questions answered", () => {
    const responses = new Map<number, QuestionResponse>([
      [1, { responseInt: 1 }],
      [2, { responseText: "Acme Corp" }],
    ]);
    expect(calculateProgress(questions, responses)).toBe(50);
  });

  it("returns 100% when all questions answered", () => {
    const responses = new Map<number, QuestionResponse>([
      [1, { responseInt: 1 }],
      [2, { responseText: "Acme Corp" }],
      [3, { responseInt: 50 }],
      [4, { responseDate: new Date('2025-12-31') }],
    ]);
    expect(calculateProgress(questions, responses)).toBe(100);
  });

  it("rounds progress percentage correctly", () => {
    const threeQuestions = questions.slice(0, 3);
    const responses = new Map<number, QuestionResponse>([
      [1, { responseInt: 1 }],
    ]);
    // 1/3 = 33.333... should round to 33
    expect(calculateProgress(threeQuestions, responses)).toBe(33);
  });

  it("ignores empty response objects", () => {
    const responses = new Map<number, QuestionResponse>([
      [1, { responseInt: 1 }],
      [2, {}], // Empty response object should not count
    ]);
    expect(calculateProgress(questions, responses)).toBe(25);
  });
});

describe("Next Unanswered Question", () => {
  const questions: QuestionData[] = [
    { id: 1, question: "Q1", responseType: 5, required: true, skipLogicAnswer: null, skipLogicJump: null },
    { id: 2, question: "Q2", responseType: 1, required: true, skipLogicAnswer: null, skipLogicJump: null },
    { id: 3, question: "Q3", responseType: 10, required: false, skipLogicAnswer: null, skipLogicJump: null },
    { id: 4, question: "Q4", responseType: 9, required: true, skipLogicAnswer: null, skipLogicJump: null },
  ];

  function getNextUnansweredQuestion(
    questions: QuestionData[],
    responses: Map<number, QuestionResponse>,
    currentIndex: number
  ): number | null {
    for (let i = currentIndex + 1; i < questions.length; i++) {
      const question = questions[i];
      const response = responses.get(question.id);
      
      if (!response || (
        !response.responseText &&
        (response.responseInt === null || response.responseInt === undefined) &&
        !response.responseDate &&
        !response.uploadUrl
      )) {
        return i;
      }
    }
    return null;
  }

  it("returns next unanswered question index", () => {
    const responses = new Map<number, QuestionResponse>([
      [1, { responseInt: 1 }],
      // Q2 is unanswered
    ]);

    expect(getNextUnansweredQuestion(questions, responses, 0)).toBe(1);
  });

  it("returns null when all remaining questions are answered", () => {
    const responses = new Map<number, QuestionResponse>([
      [1, { responseInt: 1 }],
      [2, { responseText: "Acme" }],
      [3, { responseInt: 50 }],
      [4, { responseDate: new Date() }],
    ]);

    expect(getNextUnansweredQuestion(questions, responses, 0)).toBeNull();
  });

  it("skips already answered questions", () => {
    const responses = new Map<number, QuestionResponse>([
      [1, { responseInt: 1 }],
      [2, { responseText: "Acme" }],
      // Q3 is unanswered
      [4, { responseDate: new Date() }],
    ]);

    expect(getNextUnansweredQuestion(questions, responses, 1)).toBe(2);
  });

  it("returns null when at last question", () => {
    const responses = new Map<number, QuestionResponse>();
    expect(getNextUnansweredQuestion(questions, responses, 3)).toBeNull();
  });
});
