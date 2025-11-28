import { describe, expect, it } from "vitest";
import {
  evaluateCondition,
  evaluateSkipLogic,
  type Question,
  type ResponseMap,
} from "./utils/skip-logic";

/**
 * Skip Logic Evaluation Tests per INT.DOC.22 Section 4
 * 
 * Test Coverage: 18 tests, 100% coverage required
 */

describe("SkipLogicService", () => {
  describe("evaluateCondition", () => {
    it("should evaluate equals (=) correctly", () => {
      expect(evaluateCondition('1', '=', '1')).toBe(true);
      expect(evaluateCondition('0', '=', '1')).toBe(false);
    });

    it("should evaluate not equals (!=) correctly", () => {
      expect(evaluateCondition('1', '!=', '0')).toBe(true);
      expect(evaluateCondition('1', '!=', '1')).toBe(false);
    });

    it("should evaluate contains correctly", () => {
      expect(evaluateCondition('hello world', 'contains', 'world')).toBe(true);
      expect(evaluateCondition('hello', 'contains', 'world')).toBe(false);
    });

    it("should evaluate empty correctly", () => {
      expect(evaluateCondition('', 'empty', '')).toBe(true);
      expect(evaluateCondition(null, 'empty', '')).toBe(true);
      expect(evaluateCondition('value', 'empty', '')).toBe(false);
    });
  });

  describe("evaluateSkipLogic", () => {
    const mockResponses: ResponseMap = {
      1: { responseValue: '1' },  // Yes
      2: { responseValue: '0' },  // No
      3: { responseValue: 'AA' }, // Dropdown option AA
    };

    it("should return visible:true when no skip logic", () => {
      const question: Question = { qid: 5, skipLogic: null };
      const result = evaluateSkipLogic(question, mockResponses);

      expect(result.visible).toBe(true);
      expect(result.skipTo).toBeNull();
    });

    describe("ShowIf", () => {
      it("should handle ShowIf - show when condition met", () => {
        const question: Question = {
          qid: 5,
          skipLogic: {
            type: 'ShowIf',
            triggerQid: 1,
            operator: '=',
            value: '1',
          },
        };

        const result = evaluateSkipLogic(question, mockResponses);
        expect(result.visible).toBe(true);
      });

      it("should handle ShowIf - hide when condition not met", () => {
        const question: Question = {
          qid: 5,
          skipLogic: {
            type: 'ShowIf',
            triggerQid: 2,
            operator: '=',
            value: '1',
          },
        };

        const result = evaluateSkipLogic(question, mockResponses);
        expect(result.visible).toBe(false);
      });
    });

    describe("HideIf", () => {
      it("should handle HideIf - hide when condition met", () => {
        const question: Question = {
          qid: 5,
          skipLogic: {
            type: 'HideIf',
            triggerQid: 1,
            operator: '=',
            value: '1',
          },
        };

        const result = evaluateSkipLogic(question, mockResponses);
        expect(result.visible).toBe(false);
      });

      it("should handle HideIf - show when condition not met", () => {
        const question: Question = {
          qid: 5,
          skipLogic: {
            type: 'HideIf',
            triggerQid: 2,
            operator: '=',
            value: '1',
          },
        };

        const result = evaluateSkipLogic(question, mockResponses);
        expect(result.visible).toBe(true);
      });
    });

    describe("AND/OR Logic", () => {
      it("should handle AND logic (all conditions must be true)", () => {
        const question: Question = {
          qid: 5,
          skipLogic: {
            type: 'ShowIf',
            conditions: [
              { triggerQid: 1, operator: '=', value: '1' },
              { triggerQid: 3, operator: '=', value: 'AA' },
            ],
            logic: 'AND',
          },
        };

        const result = evaluateSkipLogic(question, mockResponses);
        expect(result.visible).toBe(true);

        // Test when one condition fails
        const question2: Question = {
          qid: 5,
          skipLogic: {
            type: 'ShowIf',
            conditions: [
              { triggerQid: 1, operator: '=', value: '1' },
              { triggerQid: 2, operator: '=', value: '1' }, // This is false
            ],
            logic: 'AND',
          },
        };

        const result2 = evaluateSkipLogic(question2, mockResponses);
        expect(result2.visible).toBe(false);
      });

      it("should handle OR logic (any condition can be true)", () => {
        const question: Question = {
          qid: 5,
          skipLogic: {
            type: 'ShowIf',
            conditions: [
              { triggerQid: 1, operator: '=', value: '1' }, // True
              { triggerQid: 2, operator: '=', value: '1' }, // False
            ],
            logic: 'OR',
          },
        };

        const result = evaluateSkipLogic(question, mockResponses);
        expect(result.visible).toBe(true);
      });
    });

    describe("SkipToQuestion", () => {
      it("should return skipTo QID for SkipToQuestion", () => {
        const question: Question = {
          qid: 3,
          skipLogic: {
            type: 'SkipToQuestion',
            triggerQid: 1,
            operator: '=',
            value: '0',
            targetQid: 10,
          },
        };

        const responses: ResponseMap = { 1: { responseValue: '0' } };
        const result = evaluateSkipLogic(question, responses);
        expect(result.skipTo).toBe(10);
      });

      it("should return END_SECTION for SkipToEnd", () => {
        const question: Question = {
          qid: 3,
          skipLogic: {
            type: 'SkipToEnd',
            triggerQid: 1,
            operator: '=',
            value: '0',
          },
        };

        const responses: ResponseMap = { 1: { responseValue: '0' } };
        const result = evaluateSkipLogic(question, responses);
        expect(result.skipTo).toBe('END_SECTION');
      });

      it("should not skip when condition not met", () => {
        const question: Question = {
          qid: 3,
          skipLogic: {
            type: 'SkipToEnd',
            triggerQid: 1,
            operator: '=',
            value: '0',
          },
        };

        const responses: ResponseMap = { 1: { responseValue: '1' } };
        const result = evaluateSkipLogic(question, responses);
        expect(result.skipTo).toBeNull();
        expect(result.visible).toBe(true);
      });
    });

    describe("Edge Cases", () => {
      it("should handle missing response values", () => {
        const question: Question = {
          qid: 5,
          skipLogic: {
            type: 'ShowIf',
            triggerQid: 99, // Non-existent question
            operator: '=',
            value: '1',
          },
        };

        const result = evaluateSkipLogic(question, mockResponses);
        expect(result.visible).toBe(false);
      });

      it("should handle dropdown multi-select contains", () => {
        const responses: ResponseMap = {
          1: { responseValue: 'AA,BB,CC' }, // Multi-select dropdown
        };

        const question: Question = {
          qid: 5,
          skipLogic: {
            type: 'ShowIf',
            triggerQid: 1,
            operator: 'contains',
            value: 'BB',
          },
        };

        const result = evaluateSkipLogic(question, responses);
        expect(result.visible).toBe(true);
      });

      it("should handle YesNo question responses (1=Yes, 0=No)", () => {
        const responses: ResponseMap = {
          1: { responseValue: 1 },
          2: { responseValue: 0 },
        };

        const questionYes: Question = {
          qid: 5,
          skipLogic: {
            type: 'ShowIf',
            triggerQid: 1,
            operator: '=',
            value: 1,
          },
        };

        expect(evaluateSkipLogic(questionYes, responses).visible).toBe(true);

        const questionNo: Question = {
          qid: 6,
          skipLogic: {
            type: 'ShowIf',
            triggerQid: 2,
            operator: '=',
            value: 0,
          },
        };

        expect(evaluateSkipLogic(questionNo, responses).visible).toBe(true);
      });

      it("should handle YesNoNA question responses (1=Yes, 0=No, 2=NA)", () => {
        const responses: ResponseMap = {
          1: { responseValue: 2 }, // NA
        };

        const question: Question = {
          qid: 5,
          skipLogic: {
            type: 'HideIf',
            triggerQid: 1,
            operator: '=',
            value: 2,
          },
        };

        const result = evaluateSkipLogic(question, responses);
        expect(result.visible).toBe(false);
      });
    });
  });
});
