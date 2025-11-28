/**
 * Shared types for Questionnaire Engine Components
 * Based on INT.DOC.08 - Frontend Component Documentation
 */

export type QuestionOption = {
  id: number;
  description: string;
  zcode: string | null;
  code?: string;
  weight?: number;
};

export type QuestionData = {
  id: number;
  title: string;
  question: string;
  responseType: number;
  commentType: number | null;
  required: boolean;
  hintText: string | null;
  tag: string | null;
  skipLogicAnswer: number | null;
  skipLogicJump: string | null;
  options: QuestionOption[];
};

export type QuestionResponse = {
  responseText?: string | null;
  responseInt?: number | null;
  responseDate?: Date | null;
  comment?: string | null;
  uploadUrl?: string | null;
  dueDate?: Date | null;
};

export type QuestionComponentProps = {
  question: QuestionData;
  response: QuestionResponse;
  onChange: (response: Partial<QuestionResponse>) => void;
  disabled?: boolean;
};

// Response Types enum matching database
export enum ResponseType {
  TEXT_SHORT = 1,
  TEXT_LONG = 2,
  DROPDOWN = 3,
  RADIO = 4,
  YES_NO = 5,
  CHECKBOX = 6,
  FILE_UPLOAD = 7,
  LIST_TO_LIST = 8,
  DATE = 9,
  NUMBER = 10,
  DOLLAR = 11,
  YES_NO_NA = 12,
}

// Comment Types enum for conditional widgets
export enum CommentType {
  NONE = 0,
  YN_COMMENT_Y = 1,      // Show comment when Yes
  YN_COMMENT_N = 2,      // Show comment when No
  YN_UPLOAD_Y = 3,       // Show upload when Yes
  YN_UPLOAD_N = 4,       // Show upload when No
  YN_DUEDATE_Y = 5,      // Show due date when Yes
  COMMENTONLY = 6,       // Always show comment
  UPLOADONLY = 7,        // Always show upload
}

// Z-Code socioeconomic classifications
export type ZCodeOption = {
  code: string;
  label: string;
  weight: number;
  qWeight: number;
};

export const ZCODE_OPTIONS: ZCodeOption[] = [
  { code: 'L', label: 'Large Business', weight: 32, qWeight: 0 },
  { code: 'S', label: 'Small Business', weight: 16, qWeight: 1 },
  { code: 'SDB', label: 'Small Disadvantaged Business', weight: 8, qWeight: 2 },
  { code: 'WOSB', label: 'Woman-Owned Small Business', weight: 4, qWeight: 3 },
  { code: 'VOSB', label: 'Veteran-Owned Small Business', weight: 2, qWeight: 4 },
  { code: 'SDVOSB', label: 'Service-Disabled Veteran-Owned Small Business', weight: 1, qWeight: 5 },
];
