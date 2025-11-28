/**
 * Questionnaire Utilities
 * Auto-save, skip logic, and validation helpers
 */

import { useEffect, useRef, useCallback } from 'react';
import type { QuestionData, QuestionResponse } from './types';

/**
 * Debounced auto-save hook
 * Automatically saves responses after user stops typing (500ms delay)
 * Based on INT.DOC.08 Section 3.3 Features
 */
export function useAutoSave(
  onSave: (data: any) => Promise<void>,
  delay: number = 500
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveInProgressRef = useRef(false);

  const debouncedSave = useCallback(
    (data: any) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(async () => {
        if (saveInProgressRef.current) {
          return; // Skip if save already in progress
        }

        try {
          saveInProgressRef.current = true;
          await onSave(data);
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          saveInProgressRef.current = false;
        }
      }, delay);
    },
    [onSave, delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedSave;
}

/**
 * Evaluate skip logic for a question
 * Returns the next question ID to navigate to, or null if no skip
 * Based on INT.DOC.08 Section 3.3 Features
 */
export function evaluateSkipLogic(
  question: QuestionData,
  response: QuestionResponse
): string | null {
  // No skip logic configured (check for null explicitly to allow 0)
  if (question.skipLogicAnswer === null || !question.skipLogicJump) {
    return null;
  }

  // Check if response matches skip logic condition
  const shouldSkip = response.responseInt === question.skipLogicAnswer;

  return shouldSkip ? question.skipLogicJump : null;
}

/**
 * Validate question response
 * Returns error message if invalid, null if valid
 */
export function validateResponse(
  question: QuestionData,
  response: QuestionResponse
): string | null {
  // Check required field
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

  // Additional validation can be added here
  // - Email format
  // - Number ranges
  // - Date ranges
  // - File size/type

  return null;
}

/**
 * Calculate questionnaire progress percentage
 */
export function calculateProgress(
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

/**
 * Get next unanswered question index
 */
export function getNextUnansweredQuestion(
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
