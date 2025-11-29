import * as XLSX from 'xlsx';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { questions } from '../../drizzle/schema';

/**
 * QMS Excel Template Parser
 * 
 * Parses the QMS reference Excel template and imports questions into the database.
 * Template structure: 82 rows × 27 columns
 * 
 * @see /home/ubuntu/compliance-platform/QMS_TEMPLATE_MAPPING.md for field mappings
 */

export interface QMSRow {
  // Core fields
  QID: number;
  Page: number;
  Surveyset: string;
  Survey: string;
  Question: string;
  Response: string;
  Title: string;
  Required: number;
  
  // Validation
  Length: number;
  titleLength: number;
  
  // Skip logic
  skipLogic: string;
  skipLogicAnswer: string;
  skipLogicJump: number;
  
  // Conditional messages
  CommentBoxMessageText: string;
  UploadMessageText: string;
  CalendarMessageText: string;
  CommentType: string;
  
  // Scoring
  yValue: number;
  nValue: number;
  naValue: number;
  otherValue: number;
  qWeight: number;
  
  // Advanced features
  spinOffQuestionnaire: string;
  spinoffid: string;
  emailalert: string;
  emailalertlist: string;
  accessLevel: number;
}

export interface QMSValidationError {
  row: number;
  field: string;
  message: string;
  code: string;
}

export interface QMSImportResult {
  success: boolean;
  questionsImported: number;
  questionsUpdated: number;
  errors: QMSValidationError[];
  summary: string;
}

/**
 * Parse QMS Excel file and return array of question rows
 */
export function parseQMSExcel(fileBuffer: Buffer): QMSRow[] {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with header row
  const rows: QMSRow[] = XLSX.utils.sheet_to_json(worksheet);
  
  return rows;
}

/**
 * Validate a single QMS row
 */
export function validateQMSRow(row: QMSRow, rowIndex: number): QMSValidationError[] {
  const errors: QMSValidationError[] = [];
  
  // Required fields validation
  if (!row.QID) {
    errors.push({
      row: rowIndex,
      field: 'QID',
      message: 'QID is required',
      code: 'ERR-QMS-001'
    });
  }
  
  if (!row.Survey) {
    errors.push({
      row: rowIndex,
      field: 'Survey',
      message: 'Survey (questionnaire title) is required',
      code: 'ERR-QMS-002'
    });
  }
  
  if (!row.Question) {
    errors.push({
      row: rowIndex,
      field: 'Question',
      message: 'Question text is required',
      code: 'ERR-QMS-003'
    });
  }
  
  if (!row.Response) {
    errors.push({
      row: rowIndex,
      field: 'Response',
      message: 'Response type is required',
      code: 'ERR-QMS-004'
    });
  }
  
  if (!row.Title) {
    errors.push({
      row: rowIndex,
      field: 'Title',
      message: 'Title (internal name) is required',
      code: 'ERR-QMS-005'
    });
  }
  
  // Skip logic validation
  if (row.skipLogic === 'Y') {
    if (!row.skipLogicAnswer) {
      errors.push({
        row: rowIndex,
        field: 'skipLogicAnswer',
        message: 'skipLogicAnswer is required when skipLogic=Y',
        code: 'ERR-QMS-006'
      });
    }
    
    if (!row.skipLogicJump) {
      errors.push({
        row: rowIndex,
        field: 'skipLogicJump',
        message: 'skipLogicJump is required when skipLogic=Y',
        code: 'ERR-QMS-007'
      });
    }
  }
  
  // Email alert validation
  if (row.emailalert === 'Y' && !row.emailalertlist) {
    errors.push({
      row: rowIndex,
      field: 'emailalertlist',
      message: 'emailalertlist is required when emailalert=Y',
      code: 'ERR-QMS-008'
    });
  }
  
  // Spinoff validation
  if (row.spinOffQuestionnaire === 'Y' && !row.spinoffid) {
    errors.push({
      row: rowIndex,
      field: 'spinoffid',
      message: 'spinoffid is required when spinOffQuestionnaire=Y',
      code: 'ERR-QMS-009'
    });
  }
  
  return errors;
}

/**
 * Convert QMS row to database question object for INSERT
 * Note: Does NOT set id field - let database auto-increment handle it
 */
export function qmsRowToQuestion(row: QMSRow, questionnaireId: number) {
  return {
    questionnaireId,

    // Core fields
    question: row.Question,
    name: row.Title, // Internal name
    title: row.Title, // Display title

    // Section & Organization
    page: row.Page || null,
    sectionCode: row.Surveyset || null,

    // Response configuration
    responseType: convertResponseType(row.Response),
    required: row.Required === 1,

    // Validation
    minLength: row.Length || 0,
    titleLength: row.titleLength || 0,

    // Skip Logic
    hasSkipLogic: row.skipLogic === 'Y',
    skipLogicTrigger: row.skipLogicAnswer || null,
    skipLogicTarget: row.skipLogicJump || null,

    // Conditional UI Messages
    commentMessage: row.CommentBoxMessageText || null,
    uploadMessage: row.UploadMessageText || null,
    calendarMessage: row.CalendarMessageText || null,
    commentType: row.CommentType || null,

    // Scoring
    yesScore: row.yValue ?? 1,
    noScore: row.nValue ?? 0,
    naScore: row.naValue ?? -1,
    otherScore: row.otherValue ?? -1,
    qWeight: row.qWeight?.toString() || '0.00',

    // Sub-Questionnaires
    hasSpinoff: row.spinOffQuestionnaire === 'Y',
    spinoffId: row.spinoffid || null,

    // Email Alerts
    hasEmailAlert: row.emailalert === 'Y',
    emailAlertList: row.emailalertlist || null,

    // Access Control
    accessLevel: row.accessLevel || 0,

    // Archive pattern
    active: true,
    sortOrder: row.QID, // Use QID from Excel for ordering
  };
}

/**
 * Convert QMS row to database question object for UPDATE
 * Includes id field for matching existing records
 */
export function qmsRowToQuestionUpdate(row: QMSRow, questionnaireId: number) {
  return {
    id: row.QID,
    ...qmsRowToQuestion(row, questionnaireId),
  };
}

/**
 * Convert Excel response type to database response type ID
 * 
 * Excel values: "Y/N", "Y/N/NA", "CHECKBOX", "TEXT", "DATE", etc.
 * Database values: 1, 2, 3, 4, 5, etc.
 */
export function convertResponseType(excelType: string): number {
  const typeMap: Record<string, number> = {
    'Y/N': 1,
    'Y/N/NA': 2,
    'CHECKBOX': 3,
    'TEXT': 4,
    'DATE': 5,
    'NUMBER': 6,
    'DROPDOWN': 7,
    'MULTI': 8,
    'FILE': 9,
    'LIST2LIST': 10,
    'TEXT_NUMBER_6': 11,
  };
  
  return typeMap[excelType] || 4; // Default to TEXT
}

/**
 * Import QMS Excel file into database
 * 
 * @param fileBuffer - Excel file buffer
 * @param questionnaireId - Target questionnaire ID
 * @param mode - 'insert' (new questions) or 'update' (replace existing)
 * @returns Import result with success status and error details
 */
export async function importQMSExcel(
  fileBuffer: Buffer,
  questionnaireId: number,
  mode: 'insert' | 'update' = 'insert'
): Promise<QMSImportResult> {
  const result: QMSImportResult = {
    success: false,
    questionsImported: 0,
    questionsUpdated: 0,
    errors: [],
    summary: ''
  };
  
  try {
    // Parse Excel file
    const rows = parseQMSExcel(fileBuffer);
    
    if (rows.length === 0) {
      result.errors.push({
        row: 0,
        field: 'file',
        message: 'No data found in Excel file',
        code: 'ERR-QMS-FILE-001'
      });
      return result;
    }
    
    // Validate all rows
    const allErrors: QMSValidationError[] = [];
    rows.forEach((row, index) => {
      const rowErrors = validateQMSRow(row, index + 2); // +2 for header row and 1-indexed
      allErrors.push(...rowErrors);
    });
    
    if (allErrors.length > 0) {
      result.errors = allErrors;
      result.summary = `Validation failed: ${allErrors.length} errors found`;
      return result;
    }
    
    // Get database connection
    const db = await getDb();
    if (!db) {
      result.errors.push({
        row: 0,
        field: 'database',
        message: 'Database connection not available',
        code: 'ERR-QMS-DB-001'
      });
      return result;
    }
    
    // Import questions
    for (const row of rows) {
      const questionData = qmsRowToQuestion(row, questionnaireId);
      
      if (mode === 'update') {
        // Update existing question
        await db
          .update(questions)
          .set(questionData)
          .where(eq(questions.id, row.QID));
        result.questionsUpdated++;
      } else {
        // Insert new question
        await db.insert(questions).values(questionData);
        result.questionsImported++;
      }
    }
    
    result.success = true;
    if (mode === 'update') {
      result.summary = `Successfully updated ${result.questionsUpdated} questions`;
    } else {
      result.summary = `Successfully imported ${result.questionsImported} questions`;
    }

  } catch (error) {
    result.errors.push({
      row: 0,
      field: 'system',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 'ERR-QMS-SYS-001'
    });
    result.summary = 'Import failed due to system error';
  }
  
  return result;
}
