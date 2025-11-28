/**
 * Skip Logic Evaluation Service
 * Based on INT.DOC.22 Section 4 - Skip Logic Evaluation Tests
 * 
 * Supports:
 * - Operators: equals (=), not equals (!=), contains, empty
 * - Actions: ShowIf, HideIf, SkipToQuestion, SkipToEnd
 * - Logic: AND, OR, nested conditions
 */

export type SkipLogicOperator = '=' | '!=' | 'contains' | 'empty';
export type SkipLogicType = 'ShowIf' | 'HideIf' | 'SkipToQuestion' | 'SkipToEnd';

export interface SkipLogicCondition {
  triggerQid: number;
  operator: SkipLogicOperator;
  value: string | number;
}

export interface SkipLogic {
  type: SkipLogicType;
  triggerQid?: number;
  operator?: SkipLogicOperator;
  value?: string | number;
  targetQid?: number;
  conditions?: SkipLogicCondition[];
  logic?: 'AND' | 'OR';
}

export interface Question {
  qid: number;
  skipLogic?: SkipLogic | null;
}

export interface ResponseMap {
  [qid: number]: {
    responseValue: string | number;
  };
}

export interface SkipLogicResult {
  visible: boolean;
  skipTo: number | 'END_SECTION' | null;
}

/**
 * Evaluate a single condition
 */
export function evaluateCondition(
  actualValue: string | number | null | undefined,
  operator: SkipLogicOperator,
  expectedValue: string | number
): boolean {
  // Handle empty operator
  if (operator === 'empty') {
    return actualValue === null || actualValue === undefined || actualValue === '';
  }

  // Convert to strings for comparison
  const actual = String(actualValue ?? '');
  const expected = String(expectedValue);

  switch (operator) {
    case '=':
      return actual === expected;
    case '!=':
      return actual !== expected;
    case 'contains':
      return actual.includes(expected);
    default:
      return false;
  }
}

/**
 * Evaluate skip logic for a question
 */
export function evaluateSkipLogic(
  question: Question,
  responses: ResponseMap
): SkipLogicResult {
  // Default: question is visible, no skip
  const defaultResult: SkipLogicResult = {
    visible: true,
    skipTo: null,
  };

  if (!question.skipLogic) {
    return defaultResult;
  }

  const { type, triggerQid, operator, value, targetQid, conditions, logic } = question.skipLogic;

  // Handle simple single-condition skip logic
  if (triggerQid !== undefined && operator && value !== undefined) {
    const response = responses[triggerQid];
    const conditionMet = evaluateCondition(response?.responseValue, operator, value);

    switch (type) {
      case 'ShowIf':
        return {
          visible: conditionMet,
          skipTo: null,
        };
      case 'HideIf':
        return {
          visible: !conditionMet,
          skipTo: null,
        };
      case 'SkipToQuestion':
        return {
          visible: true,
          skipTo: conditionMet && targetQid ? targetQid : null,
        };
      case 'SkipToEnd':
        return {
          visible: true,
          skipTo: conditionMet ? 'END_SECTION' : null,
        };
    }
  }

  // Handle complex multi-condition skip logic
  if (conditions && conditions.length > 0) {
    const results = conditions.map(cond => {
      const response = responses[cond.triggerQid];
      return evaluateCondition(response?.responseValue, cond.operator, cond.value);
    });

    const conditionMet = logic === 'OR'
      ? results.some(r => r)
      : results.every(r => r);

    switch (type) {
      case 'ShowIf':
        return {
          visible: conditionMet,
          skipTo: null,
        };
      case 'HideIf':
        return {
          visible: !conditionMet,
          skipTo: null,
        };
      case 'SkipToQuestion':
        return {
          visible: true,
          skipTo: conditionMet && targetQid ? targetQid : null,
        };
      case 'SkipToEnd':
        return {
          visible: true,
          skipTo: conditionMet ? 'END_SECTION' : null,
        };
    }
  }

  return defaultResult;
}
