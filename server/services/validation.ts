import { eq, and } from 'drizzle-orm';
import { getDb } from '../db';
import { partnerQuestionnaires, touchpointQuestionnaires, questions, questionnaireResponses, documents } from '../../drizzle/schema';
import { ERROR_CODES, createError, createValidationError, type ErrorCode } from '../constants/errorCodes';

/**
 * Pre-Submission Validation per INT.DOC.12 Section 5.1
 * 
 * Validates:
 * - Rule 1: Progress is 100%
 * - Rule 2: All required questions have valid responses
 * - Rule 3: Required comments are provided
 * - Rule 4: Required uploads are provided
 */

export interface ValidationError {
  code: ErrorCode;
  message: string;
  questionId?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate assignment for submission
 * @param {number} assignmentId - Partner assignment ID
 * @returns {Promise<ValidationResult>} Validation result with errors if any
 */
export async function validateForSubmission(assignmentId: number): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const db = await getDb();
  
  if (!db) {
    return {
      valid: false,
      errors: [createError(ERROR_CODES.INTERNAL_SERVER_ERROR)],
    };
  }

  // Get assignment
  const [assignment] = await db
    .select()
    .from(partnerQuestionnaires)
    .where(eq(partnerQuestionnaires.id, assignmentId))
    .limit(1);

  if (!assignment) {
    return {
      valid: false,
      errors: [createError(ERROR_CODES.ASSIGNMENT_NOT_FOUND)],
    };
  }

  // Rule 1: Check progress is 100%
  if ((assignment.progress || 0) < 100) {
    errors.push(createError(ERROR_CODES.SUBMIT_INCOMPLETE));
  }

  // Get touchpoint questionnaire to find questionnaireId
  const [tpq] = await db
    .select()
    .from(touchpointQuestionnaires)
    .where(eq(touchpointQuestionnaires.id, assignment.touchpointQuestionnaireId))
    .limit(1);

  if (!tpq) {
    return {
      valid: false,
      errors: [createError(ERROR_CODES.INTERNAL_SERVER_ERROR)],
    };
  }

  // Get all questions for this questionnaire
  const questionList = await db
    .select()
    .from(questions)
    .where(eq(questions.questionnaireId, tpq.questionnaireId));

  // Get all responses for this assignment
  const responseList = await db
    .select()
    .from(questionnaireResponses)
    .where(eq(questionnaireResponses.partnerQuestionnaireId, assignmentId));

  // Create response map for quick lookup
  const responseMap = new Map(
    responseList.map(r => [r.questionId, r])
  );

  // Rule 2: Check all required questions have valid responses
  for (const question of questionList) {
    if (question.required) {
      const response = responseMap.get(question.id);
      
      if (!response || !hasValidResponse(question, response)) {
        errors.push(createValidationError(ERROR_CODES.RESPONSE_VALIDATION_REQUIRED, question.id));
      }
    }
  }

  // Rule 3: Check required comments are provided
  for (const question of questionList) {
    if (question.commentRequired) {
      const response = responseMap.get(question.id);
      
      if (!response?.comment || response.comment.trim() === '') {
        errors.push(createValidationError(ERROR_CODES.COMMENT_REQUIRED, question.id));
      }
    }
  }

  // Rule 4: Check required uploads are provided
  for (const question of questionList) {
    // Check if response has uploaded file or if document exists
    const response = responseMap.get(question.id);
    
    // If commentUploadTxt is set, it means upload is expected
    if (question.commentUploadTxt) {
      const hasUpload = response?.uploadedFileUrl || false;
      
      if (!hasUpload) {
        // Check if document exists for this question
        const [doc] = await db
          .select()
          .from(documents)
          .where(
            and(
              eq(documents.partnerQuestionnaireId, assignmentId),
              eq(documents.questionId, question.id)
            )
          )
          .limit(1);
        
        if (!doc) {
          errors.push(createValidationError(ERROR_CODES.UPLOAD_REQUIRED, question.id));
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a response has a valid value based on question type
 * @param {object} question - Question object
 * @param {object} response - Response object
 * @returns {boolean} True if response is valid
 */
function hasValidResponse(question: any, response: any): boolean {
  if (!response) return false;
  
  // responseId is the selected response option ID
  const value = response.responseId?.toString() || '';
  const type = question.responseType;
  
  // Empty check
  if (value === null || value === undefined || value === '') {
    return false;
  }
  
  // Type-specific validation
  switch (type) {
    case 'Y/N':
    case 'Y/N/NA':
      return value === '0' || value === '1' || (type === 'Y/N/NA' && value === '2');
    
    case 'TEXT':
      return value.trim().length > 0 && value.length <= 4000;
    
    case 'NUMBER':
      const num = parseInt(value, 10);
      return !isNaN(num) && num >= 0;
    
    case 'DOLLAR':
      const dollar = parseFloat(value);
      return !isNaN(dollar) && dollar >= 0;
    
    case 'DATE':
      // YYYY-MM-DD format
      return /^\d{4}-\d{2}-\d{2}$/.test(value);
    
    case 'DROPDOWN':
    case 'LIST':
      // Must match one of the defined options
      return value.trim().length > 0;
    
    case 'LIST2LIST':
      // Z-Code format (e.g., "22=S+WOSB+VOSB")
      return /^\d{2}=/.test(value);
    
    default:
      return value.trim().length > 0;
  }
}

/**
 * Validate individual response value
 * @param {string} type - Response type
 * @param {string} value - Response value
 * @returns {ValidationError | null} Validation error if invalid, null if valid
 */
export function validateResponseValue(type: string, value: string): ValidationError | null {
  switch (type) {
    case 'TEXT':
      if (value.length > 4000) {
        return createError(ERROR_CODES.RESPONSE_VALIDATION_TEXT_TOO_LONG);
      }
      break;
    
    case 'NUMBER':
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 0) {
        return createError(ERROR_CODES.RESPONSE_VALIDATION_NUMBER_INVALID);
      }
      break;
    
    case 'DOLLAR':
      const dollar = parseFloat(value);
      if (isNaN(dollar) || dollar < 0) {
        return createError(ERROR_CODES.RESPONSE_VALIDATION_DOLLAR_INVALID);
      }
      break;
    
    case 'DATE':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return createError(ERROR_CODES.RESPONSE_VALIDATION_DATE_INVALID);
      }
      break;
    
    case 'Y/N':
      if (value !== '0' && value !== '1') {
        return createError(ERROR_CODES.RESPONSE_VALIDATION_YN_INVALID);
      }
      break;
    
    case 'Y/N/NA':
      if (value !== '0' && value !== '1' && value !== '2') {
        return createError(ERROR_CODES.RESPONSE_VALIDATION_YN_INVALID);
      }
      break;
  }
  
  return null;
}
