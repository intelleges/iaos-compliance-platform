/**
 * AMS Batch Load Parser
 * INT.DOC.64 Section 6.4 - AMS (AutoMail) Load Summary
 * 
 * Parses Excel files containing email templates for bulk import
 * Template: 7 columns (RID, Type, Subject, Text, Footer, Send_Date_Calc_Factor, Signature)
 */

import * as XLSX from 'xlsx';

export interface ParsedAMSRow {
  rid?: number; // Record ID (auto-assigned if not provided)
  type: number; // Email type code (1-1014)
  subject: string; // Email subject line
  text: string; // Email body (HTML allowed)
  footer?: string; // Email footer text
  sendDateCalcFactor?: number; // Days offset from due date
  signature?: string; // Email signature block
  rowNumber: number;
}

export interface AMSValidationError {
  code: string;
  message: string;
  rowNumber: number;
  field?: string;
}

export interface AMSParseResult {
  templates: ParsedAMSRow[];
  errors: AMSValidationError[];
  warnings: AMSValidationError[];
}

/**
 * Email type codes (INT.DOC.64 Section 6.4)
 */
const VALID_EMAIL_TYPES = new Set([
  1,    // Invitation
  2,    // Access Code
  3,    // Completion Confirmation
  1010, // Reminder 1 (7 days before due)
  1011, // Reminder 2 (3 days before due)
  1012, // Reminder 3 (1 day before due)
  1013, // Reminder 4 (Due date)
  1014, // Reminder 5 (After due date)
]);

/**
 * Parse Excel file and validate AMS email template data
 */
export function parseAMSBatchFile(buffer: Buffer): AMSParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      templates: [],
      errors: [{ code: 'ERR-FILE-001', message: 'No worksheet found in file', rowNumber: 0 }],
      warnings: [],
    };
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });

  const templates: ParsedAMSRow[] = [];
  const errors: AMSValidationError[] = [];
  const warnings: AMSValidationError[] = [];

  // Track duplicate RIDs
  const seenRIDs = new Set<number>();

  rawData.forEach((row, index) => {
    const rowNumber = index + 2; // Excel row (1-indexed + header)

    // Parse row data
    const rid = row['RID'] ? parseInt(String(row['RID'])) : undefined;
    const type = row['Type'] ? parseInt(String(row['Type'])) : NaN;
    const subject = String(row['Subject'] || '').trim();
    const text = String(row['Text'] || '').trim();
    const footer = row['Footer'] ? String(row['Footer']).trim() : undefined;
    const sendDateCalcFactor = row['Send_Date_Calc_Factor'] 
      ? parseInt(String(row['Send_Date_Calc_Factor'])) 
      : undefined;
    const signature = row['Signature'] ? String(row['Signature']).trim() : undefined;

    // Validation: Type is required
    if (isNaN(type)) {
      errors.push({
        code: 'ERR-AMS-001',
        message: 'Type is required and must be a number',
        rowNumber,
        field: 'Type',
      });
    } else if (!VALID_EMAIL_TYPES.has(type)) {
      errors.push({
        code: 'ERR-AMS-002',
        message: `Invalid Type: ${type}. Must be one of: 1, 2, 3, 1010-1014`,
        rowNumber,
        field: 'Type',
      });
    }

    // Validation: Subject is required
    if (!subject) {
      errors.push({
        code: 'ERR-AMS-003',
        message: 'Subject is required',
        rowNumber,
        field: 'Subject',
      });
    }

    // Validation: Text is required
    if (!text) {
      errors.push({
        code: 'ERR-AMS-004',
        message: 'Text (email body) is required',
        rowNumber,
        field: 'Text',
      });
    }

    // Validation: Send_Date_Calc_Factor format
    if (sendDateCalcFactor !== undefined && isNaN(sendDateCalcFactor)) {
      errors.push({
        code: 'ERR-AMS-005',
        message: 'Send_Date_Calc_Factor must be a number (days offset)',
        rowNumber,
        field: 'Send_Date_Calc_Factor',
      });
    }

    // Validation: RID uniqueness
    if (rid !== undefined) {
      if (seenRIDs.has(rid)) {
        errors.push({
          code: 'ERR-AMS-006',
          message: `Duplicate RID: ${rid}`,
          rowNumber,
          field: 'RID',
        });
      } else {
        seenRIDs.add(rid);
      }
    }

    // Warning: HTML content safety check
    if (text && containsDangerousHTML(text)) {
      warnings.push({
        code: 'WARN-AMS-001',
        message: 'Text contains potentially dangerous HTML tags (script, iframe, etc.)',
        rowNumber,
        field: 'Text',
      });
    }

    // Warning: Reminder type without Send_Date_Calc_Factor
    if (type >= 1010 && type <= 1014 && sendDateCalcFactor === undefined) {
      warnings.push({
        code: 'WARN-AMS-002',
        message: 'Reminder email type should have Send_Date_Calc_Factor defined',
        rowNumber,
        field: 'Send_Date_Calc_Factor',
      });
    }

    // Only add template if required fields are present
    if (!isNaN(type) && subject && text) {
      templates.push({
        rid,
        type,
        subject,
        text,
        footer,
        sendDateCalcFactor,
        signature,
        rowNumber,
      });
    }
  });

  return { templates, errors, warnings };
}

/**
 * Check for dangerous HTML tags
 */
function containsDangerousHTML(html: string): boolean {
  const dangerousTags = /<(script|iframe|object|embed|form|input)/i;
  return dangerousTags.test(html);
}
