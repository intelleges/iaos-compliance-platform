/**
 * Touchpoint Assignment Batch Load Parser
 * INT.DOC.64 Section 4 - Touchpoint Assignment Load
 * 
 * Parses Excel files containing partner-to-touchpoint assignments for bulk import
 * Template: 5 columns (PARTNER_INTERNAL_ID, TOUCHPOINT_CODE, DUE_DATE, SEND_INVITE, RO_EMAIL)
 */

import * as XLSX from 'xlsx';

export interface ParsedAssignmentRow {
  partnerInternalId: string;
  touchpointCode: string;
  dueDate: Date;
  sendInvite: boolean;
  roEmail?: string;
  rowNumber: number;
}

export interface AssignmentValidationError {
  code: string;
  message: string;
  rowNumber: number;
  field?: string;
}

export interface AssignmentParseResult {
  assignments: ParsedAssignmentRow[];
  errors: AssignmentValidationError[];
  warnings: AssignmentValidationError[];
}

/**
 * Parse Excel file and validate assignment data
 */
export function parseAssignmentBatchFile(buffer: Buffer): AssignmentParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      assignments: [],
      errors: [{ code: 'ERR-FILE-001', message: 'No worksheet found in file', rowNumber: 0 }],
      warnings: [],
    };
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });

  const assignments: ParsedAssignmentRow[] = [];
  const errors: AssignmentValidationError[] = [];
  const warnings: AssignmentValidationError[] = [];

  // Track duplicates
  const seenAssignments = new Set<string>();

  rawData.forEach((row, index) => {
    const rowNumber = index + 2; // Excel row (1-indexed + header)

    // Parse row data
    const partnerInternalId = String(row['PARTNER_INTERNAL_ID'] || '').trim();
    const touchpointCode = String(row['TOUCHPOINT_CODE'] || '').trim();
    const dueDateRaw = row['DUE_DATE'];
    const sendInviteRaw = String(row['SEND_INVITE'] || '').trim().toUpperCase();
    const roEmail = row['RO_EMAIL'] ? String(row['RO_EMAIL']).trim().toLowerCase() : undefined;

    // Validation: Required fields
    if (!partnerInternalId) {
      errors.push({
        code: 'ERR-ASSIGN-001',
        message: 'PARTNER_INTERNAL_ID is required',
        rowNumber,
        field: 'PARTNER_INTERNAL_ID',
      });
    }

    if (!touchpointCode) {
      errors.push({
        code: 'ERR-ASSIGN-002',
        message: 'TOUCHPOINT_CODE is required',
        rowNumber,
        field: 'TOUCHPOINT_CODE',
      });
    }

    if (!dueDateRaw) {
      errors.push({
        code: 'ERR-ASSIGN-003',
        message: 'DUE_DATE is required',
        rowNumber,
        field: 'DUE_DATE',
      });
    }

    // Parse due date
    let dueDate: Date | null = null;
    if (dueDateRaw) {
      // Try parsing as Excel serial date
      if (typeof dueDateRaw === 'number') {
        dueDate = excelDateToJSDate(dueDateRaw);
      } else {
        // Try parsing as string (YYYY-MM-DD)
        const dateStr = String(dueDateRaw).trim();
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          dueDate = parsedDate;
        } else {
          errors.push({
            code: 'ERR-ASSIGN-003',
            message: `Invalid DUE_DATE format: ${dateStr}. Expected YYYY-MM-DD or Excel date.`,
            rowNumber,
            field: 'DUE_DATE',
          });
        }
      }
    }

    // Validation: SEND_INVITE value
    let sendInvite = false;
    if (sendInviteRaw && sendInviteRaw !== 'Y' && sendInviteRaw !== 'N') {
      errors.push({
        code: 'ERR-ASSIGN-004',
        message: `Invalid SEND_INVITE value: ${sendInviteRaw}. Must be Y or N.`,
        rowNumber,
        field: 'SEND_INVITE',
      });
    } else {
      sendInvite = sendInviteRaw === 'Y';
    }

    // Validation: RO_EMAIL format
    if (roEmail && !isValidEmail(roEmail)) {
      errors.push({
        code: 'ERR-ASSIGN-005',
        message: `Invalid RO_EMAIL format: ${roEmail}`,
        rowNumber,
        field: 'RO_EMAIL',
      });
    }

    // Check for duplicate assignments
    const assignmentKey = `${partnerInternalId}|${touchpointCode}`;
    if (seenAssignments.has(assignmentKey)) {
      warnings.push({
        code: 'WARN-ASSIGN-001',
        message: `Duplicate assignment: Partner ${partnerInternalId} already assigned to ${touchpointCode}`,
        rowNumber,
      });
    } else {
      seenAssignments.add(assignmentKey);
    }

    // Only add assignment if required fields are present and valid
    if (partnerInternalId && touchpointCode && dueDate) {
      assignments.push({
        partnerInternalId,
        touchpointCode,
        dueDate,
        sendInvite,
        roEmail,
        rowNumber,
      });
    }
  });

  return { assignments, errors, warnings };
}

/**
 * Convert Excel serial date to JavaScript Date
 * Excel stores dates as number of days since 1900-01-01
 */
function excelDateToJSDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);
  return new Date(dateInfo.getFullYear(), dateInfo.getMonth(), dateInfo.getDate());
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
