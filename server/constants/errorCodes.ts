/**
 * Standardized Error Codes per INT.DOC.12 Section 4.2
 * All error codes follow the pattern: CATEGORY_SUBCATEGORY_SPECIFIC
 */

export const ERROR_CODES = {
  // Authentication & Access Code Errors (Section 2)
  AUTH_ACCESSCODE_INVALID: 'AUTH_ACCESSCODE_INVALID',
  AUTH_ACCESSCODE_NOT_FOUND: 'AUTH_ACCESSCODE_NOT_FOUND',
  AUTH_ACCESSCODE_DEACTIVATED: 'AUTH_ACCESSCODE_DEACTIVATED',
  TOUCHPOINT_NOT_ACTIVE: 'TOUCHPOINT_NOT_ACTIVE',
  ASSIGNMENT_ALREADY_SUBMITTED: 'ASSIGNMENT_ALREADY_SUBMITTED',
  
  // Response Validation Errors (Section 4.2)
  RESPONSE_VALIDATION_REQUIRED: 'RESPONSE_VALIDATION_REQUIRED',
  RESPONSE_VALIDATION_TEXT_TOO_LONG: 'RESPONSE_VALIDATION_TEXT_TOO_LONG',
  RESPONSE_VALIDATION_NUMBER_INVALID: 'RESPONSE_VALIDATION_NUMBER_INVALID',
  RESPONSE_VALIDATION_DOLLAR_INVALID: 'RESPONSE_VALIDATION_DOLLAR_INVALID',
  RESPONSE_VALIDATION_DATE_INVALID: 'RESPONSE_VALIDATION_DATE_INVALID',
  RESPONSE_VALIDATION_DROPDOWN_INVALID: 'RESPONSE_VALIDATION_DROPDOWN_INVALID',
  RESPONSE_VALIDATION_YN_INVALID: 'RESPONSE_VALIDATION_YN_INVALID',
  
  // Submission Validation Errors (Section 5)
  SUBMIT_INCOMPLETE: 'SUBMIT_INCOMPLETE',
  COMMENT_REQUIRED: 'COMMENT_REQUIRED',
  UPLOAD_REQUIRED: 'UPLOAD_REQUIRED',
  ESIGNATURE_REQUIRED: 'ESIGNATURE_REQUIRED',
  
  // Assignment Lifecycle Errors (Section 3)
  ASSIGNMENT_NOT_FOUND: 'ASSIGNMENT_NOT_FOUND',
  ASSIGNMENT_INVALID_STATUS: 'ASSIGNMENT_INVALID_STATUS',
  ASSIGNMENT_PAST_DUE: 'ASSIGNMENT_PAST_DUE',
  
  // General Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Error messages mapped to error codes
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Authentication & Access Code
  [ERROR_CODES.AUTH_ACCESSCODE_INVALID]: 'Access code format is invalid. Must be 12 alphanumeric characters.',
  [ERROR_CODES.AUTH_ACCESSCODE_NOT_FOUND]: 'Access code not found. Please check your code and try again.',
  [ERROR_CODES.AUTH_ACCESSCODE_DEACTIVATED]: 'This access code has been deactivated.',
  [ERROR_CODES.TOUCHPOINT_NOT_ACTIVE]: 'This touchpoint is not currently active.',
  [ERROR_CODES.ASSIGNMENT_ALREADY_SUBMITTED]: 'This questionnaire has already been submitted.',
  
  // Response Validation
  [ERROR_CODES.RESPONSE_VALIDATION_REQUIRED]: 'This question requires a response.',
  [ERROR_CODES.RESPONSE_VALIDATION_TEXT_TOO_LONG]: 'Text response cannot exceed 4000 characters.',
  [ERROR_CODES.RESPONSE_VALIDATION_NUMBER_INVALID]: 'Please enter a valid non-negative number.',
  [ERROR_CODES.RESPONSE_VALIDATION_DOLLAR_INVALID]: 'Please enter a valid dollar amount (e.g., 1500000.00).',
  [ERROR_CODES.RESPONSE_VALIDATION_DATE_INVALID]: 'Please enter a valid date in YYYY-MM-DD format.',
  [ERROR_CODES.RESPONSE_VALIDATION_DROPDOWN_INVALID]: 'Please select a valid option from the dropdown.',
  [ERROR_CODES.RESPONSE_VALIDATION_YN_INVALID]: 'Please select either Yes or No.',
  
  // Submission Validation
  [ERROR_CODES.SUBMIT_INCOMPLETE]: 'Questionnaire is incomplete. Please answer all required questions.',
  [ERROR_CODES.COMMENT_REQUIRED]: 'A comment is required for this question.',
  [ERROR_CODES.UPLOAD_REQUIRED]: 'A file upload is required for this question.',
  [ERROR_CODES.ESIGNATURE_REQUIRED]: 'Electronic signature is required to submit.',
  
  // Assignment Lifecycle
  [ERROR_CODES.ASSIGNMENT_NOT_FOUND]: 'Assignment not found.',
  [ERROR_CODES.ASSIGNMENT_INVALID_STATUS]: 'Assignment status does not allow this operation.',
  [ERROR_CODES.ASSIGNMENT_PAST_DUE]: 'This assignment is past due.',
  
  // General
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'An internal server error occurred. Please try again later.',
  [ERROR_CODES.UNAUTHORIZED]: 'You are not authorized to perform this action.',
  [ERROR_CODES.FORBIDDEN]: 'Access forbidden.',
};

/**
 * Create a standardized error response
 * @param {ErrorCode} code - Error code
 * @param {Record<string, unknown>} metadata - Additional error metadata
 * @returns {object} Standardized error object
 */
export function createError(code: ErrorCode, metadata?: Record<string, unknown>) {
  return {
    code,
    message: ERROR_MESSAGES[code],
    ...metadata,
  };
}

/**
 * Validation error with question ID
 * @param {ErrorCode} code - Validation error code
 * @param {number} questionId - Question ID that failed validation
 * @returns {object} Validation error object
 */
export function createValidationError(code: ErrorCode, questionId: number) {
  return createError(code, { questionId });
}
