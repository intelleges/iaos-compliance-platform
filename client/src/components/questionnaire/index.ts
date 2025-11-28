/**
 * Questionnaire Engine Components
 * Centralized export for all questionnaire-related components and utilities
 */

// Main factory component
export { QuestionFactory } from './QuestionFactory';

// Individual question components
export { YesNoQuestion } from './YesNoQuestion';
export { YesNoNAQuestion } from './YesNoNAQuestion';
export { DropdownQuestion } from './DropdownQuestion';
export { TextQuestion } from './TextQuestion';
export { NumberQuestion } from './NumberQuestion';
export { DateQuestion } from './DateQuestion';
export { CheckboxQuestion } from './CheckboxQuestion';
export { List2ListQuestion } from './List2ListQuestion';

// Conditional widgets
export { CommentWidget, shouldShowComment } from './CommentWidget';
export { UploadWidget, shouldShowUpload } from './UploadWidget';
export { DueDateWidget, shouldShowDueDate } from './DueDateWidget';

// Z-Code utilities
export {
  encodeZCode,
  decodeZCode,
  getZCodeLabels,
  isValidZCode,
  formatZCodeBinary,
} from './zcode';

// Questionnaire utilities
export {
  useAutoSave,
  evaluateSkipLogic,
  validateResponse,
  calculateProgress,
  getNextUnansweredQuestion,
} from './utils';

// Types
export type {
  QuestionData,
  QuestionResponse,
  QuestionComponentProps,
  QuestionOption,
  ZCodeOption,
} from './types';

export { ResponseType, CommentType, ZCODE_OPTIONS } from './types';
