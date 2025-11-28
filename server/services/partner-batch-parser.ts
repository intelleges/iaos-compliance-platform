/**
 * Partner Batch Load Parser Service
 * 
 * Parses Excel files for bulk partner (supplier) import following INT.DOC.64 specification.
 * Supports 23-column template with validation engine and re-load behavior.
 * 
 * Template Sections:
 * 1. Partner Identification (A-D) - REQUIRED
 * 2. Primary Contact (E-I) - REQUIRED
 * 3. Address Information (J-Q) - RECOMMENDED
 * 4. Responsible Officer (R-T) - OPTIONAL
 * 5. Assignment & Configuration (U-W) - CONDITIONAL
 */

import * as XLSX from 'xlsx';

/**
 * Validation error codes per INT.DOC.64 Section 7.1
 */
export const PARTNER_VALIDATION_ERRORS = {
  'ERR-PART-001': 'Duplicate PARTNER_INTERNAL_ID',
  'ERR-PART-002': 'PARTNER_NAME is required',
  'ERR-PART-003': 'Invalid email format',
  'ERR-PART-004': 'Duplicate email address',
  'ERR-PART-005': 'Invalid DUNS format (must be 9 digits)',
  'ERR-PART-006': 'Invalid DUE_DATE format (must be YYYY-MM-DD)',
  'ERR-PART-007': 'Invalid PARTNER_STATE value',
  'ERR-PART-008': 'Invalid PRESELECTED value (must be Y, N, or empty)',
} as const;

export type PartnerValidationErrorCode = keyof typeof PARTNER_VALIDATION_ERRORS;

/**
 * Parsed partner record from Excel template
 */
export interface ParsedPartner {
  // Partner Identification (REQUIRED)
  partnerInternalId: string;
  partnerName: string;
  partnerDuns?: string;
  partnerSapId?: string;

  // Primary Contact (REQUIRED)
  pocFirstName: string;
  pocLastName: string;
  pocTitle?: string;
  pocPhone?: string;
  pocEmail: string;

  // Address Information (RECOMMENDED)
  addressOne?: string;
  addressTwo?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
  contactFax?: string;
  province?: string;

  // Responsible Officer (OPTIONAL)
  roFirstName?: string;
  roLastName?: string;
  roEmail?: string;

  // Assignment & Configuration (CONDITIONAL)
  dueDate?: Date;
  partnerGroupDescription?: string;
  preselected?: boolean;

  // Metadata
  rowNumber: number;
}

/**
 * Validation result for a single partner record
 */
export interface PartnerValidationResult {
  rowNumber: number;
  isValid: boolean;
  errors: Array<{
    code: PartnerValidationErrorCode;
    message: string;
    column: string;
  }>;
  warnings: Array<{
    message: string;
    column: string;
  }>;
  partner?: ParsedPartner;
}

/**
 * Overall parse result
 */
export interface PartnerParseResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  partners: ParsedPartner[];
  validationResults: PartnerValidationResult[];
  errors: string[];
}

/**
 * Valid US state names per INT.DOC.64 Section 8.2
 */
const VALID_US_STATES = new Set([
  'ALABAMA', 'ALASKA', 'ARIZONA', 'ARKANSAS', 'CALIFORNIA', 'COLORADO',
  'CONNECTICUT', 'DELAWARE', 'FLORIDA', 'GEORGIA', 'HAWAII', 'IDAHO',
  'ILLINOIS', 'INDIANA', 'IOWA', 'KANSAS', 'KENTUCKY', 'LOUISIANA',
  'MAINE', 'MARYLAND', 'MASSACHUSETTS', 'MICHIGAN', 'MINNESOTA',
  'MISSISSIPPI', 'MISSOURI', 'MONTANA', 'NEBRASKA', 'NEVADA',
  'NEW HAMPSHIRE', 'NEW JERSEY', 'NEW MEXICO', 'NEW YORK',
  'NORTH CAROLINA', 'NORTH DAKOTA', 'OHIO', 'OKLAHOMA', 'OREGON',
  'PENNSYLVANIA', 'RHODE ISLAND', 'SOUTH CAROLINA', 'SOUTH DAKOTA',
  'TENNESSEE', 'TEXAS', 'UTAH', 'VERMONT', 'VIRGINIA', 'WASHINGTON',
  'WEST VIRGINIA', 'WISCONSIN', 'WYOMING', 'NON-US'
]);

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Parse Excel file buffer into partner records
 */
export function parsePartnerBatchFile(fileBuffer: Buffer): PartnerParseResult {
  const result: PartnerParseResult = {
    success: false,
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    partners: [],
    validationResults: [],
    errors: [],
  };

  try {
    // Read Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      result.errors.push('Excel file contains no sheets');
      return result;
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      result.errors.push('Could not read worksheet');
      return result;
    }

    // Convert to JSON (array of objects with column headers as keys)
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      raw: false, // Get formatted values
      defval: '', // Default value for empty cells
    });

    result.totalRows = rows.length;

    if (rows.length === 0) {
      result.errors.push('Excel file contains no data rows');
      return result;
    }

    // Track seen IDs and emails for duplicate detection
    const seenInternalIds = new Set<string>();
    const seenEmails = new Set<string>();

    // Parse and validate each row
    rows.forEach((row, index) => {
      const rowNumber = index + 2; // Excel row number (1-indexed + header row)
      const validationResult = validatePartnerRow(row, rowNumber, seenInternalIds, seenEmails);
      
      result.validationResults.push(validationResult);

      if (validationResult.isValid && validationResult.partner) {
        result.validRows++;
        result.partners.push(validationResult.partner);
        seenInternalIds.add(validationResult.partner.partnerInternalId);
        seenEmails.add(validationResult.partner.pocEmail);
      } else {
        result.invalidRows++;
      }
    });

    result.success = result.invalidRows === 0;

  } catch (error) {
    result.errors.push(`Failed to parse Excel file: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * Validate a single partner row
 */
function validatePartnerRow(
  row: Record<string, any>,
  rowNumber: number,
  seenInternalIds: Set<string>,
  seenEmails: Set<string>
): PartnerValidationResult {
  const errors: PartnerValidationResult['errors'] = [];
  const warnings: PartnerValidationResult['warnings'] = [];

  // Extract values from row
  const partnerInternalId = String(row['PARTNER_INTERNAL_ID'] || '').trim();
  const partnerName = String(row['PARTNER_NAME'] || '').trim();
  const partnerDuns = String(row['PARTNER_DUNS'] || '').trim();
  const partnerSapId = String(row['PARTNER_SAP_ID'] || '').trim();
  
  const pocFirstName = String(row['PARTNER_POC_FIRST_NAME'] || '').trim();
  const pocLastName = String(row['PARTNER_POC_LAST_NAME'] || '').trim();
  const pocTitle = String(row['PARTNER_POC_TITLE'] || '').trim();
  const pocPhone = String(row['PARTNER_POC_PHONE_NUMBER'] || '').trim();
  const pocEmail = String(row['PARTNER_POC_EMAIL_ADDRESS'] || '').trim();
  
  const addressOne = String(row['PARTNER_ADDRESS_ONE'] || '').trim();
  const addressTwo = String(row['PARTNER_ADDRESS_TWO'] || '').trim();
  const city = String(row['PARTNER_CITY'] || '').trim();
  const state = String(row['PARTNER_STATE'] || '').trim().toUpperCase();
  const zipcode = String(row['PARTNER_ZIPCODE'] || '').trim();
  const country = String(row['PARTNER_COUNTRY'] || '').trim();
  const contactFax = String(row['PARTNER_CONTACT_FAX'] || '').trim();
  const province = String(row['PARTNER_PROVINCE'] || '').trim();
  
  const roFirstName = String(row['RO_FIRST_NAME'] || '').trim();
  const roLastName = String(row['RO_LAST_NAME'] || '').trim();
  const roEmail = String(row['RO_EMAIL'] || '').trim();
  
  const dueDateStr = String(row['DUE_DATE'] || '').trim();
  const partnerGroupDescription = String(row['PARTNER_GROUP_DESCRIPTION'] || '').trim();
  const preselectedStr = String(row['PRESELECTED'] || '').trim().toUpperCase();

  // Validation: ERR-PART-001 - Duplicate PARTNER_INTERNAL_ID
  if (!partnerInternalId) {
    errors.push({
      code: 'ERR-PART-002', // Actually missing ID, but we'll catch it below
      message: 'PARTNER_INTERNAL_ID is required',
      column: 'A',
    });
  } else if (seenInternalIds.has(partnerInternalId)) {
    errors.push({
      code: 'ERR-PART-001',
      message: PARTNER_VALIDATION_ERRORS['ERR-PART-001'],
      column: 'A',
    });
  }

  // Validation: ERR-PART-002 - Missing PARTNER_NAME
  if (!partnerName) {
    errors.push({
      code: 'ERR-PART-002',
      message: PARTNER_VALIDATION_ERRORS['ERR-PART-002'],
      column: 'B',
    });
  }

  // Validation: ERR-PART-003 - Invalid email format
  if (!pocEmail) {
    errors.push({
      code: 'ERR-PART-003',
      message: 'PARTNER_POC_EMAIL_ADDRESS is required',
      column: 'I',
    });
  } else if (!EMAIL_REGEX.test(pocEmail)) {
    errors.push({
      code: 'ERR-PART-003',
      message: PARTNER_VALIDATION_ERRORS['ERR-PART-003'],
      column: 'I',
    });
  }

  // Validation: ERR-PART-004 - Duplicate email address
  if (pocEmail && seenEmails.has(pocEmail)) {
    errors.push({
      code: 'ERR-PART-004',
      message: PARTNER_VALIDATION_ERRORS['ERR-PART-004'],
      column: 'I',
    });
  }

  // Validation: ERR-PART-005 - Invalid DUNS format
  if (partnerDuns && partnerDuns !== '999999999') {
    if (!/^\d{9}$/.test(partnerDuns)) {
      errors.push({
        code: 'ERR-PART-005',
        message: PARTNER_VALIDATION_ERRORS['ERR-PART-005'],
        column: 'C',
      });
    }
  }

  // Validation: ERR-PART-006 - Invalid DUE_DATE format
  let dueDate: Date | undefined;
  if (dueDateStr) {
    // Try to parse date in YYYY-MM-DD format
    const dateMatch = dueDateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateMatch) {
      dueDate = new Date(dueDateStr);
      if (isNaN(dueDate.getTime())) {
        errors.push({
          code: 'ERR-PART-006',
          message: PARTNER_VALIDATION_ERRORS['ERR-PART-006'],
          column: 'U',
        });
        dueDate = undefined;
      }
    } else {
      errors.push({
        code: 'ERR-PART-006',
        message: PARTNER_VALIDATION_ERRORS['ERR-PART-006'],
        column: 'U',
      });
    }
  }

  // Validation: ERR-PART-007 - Invalid PARTNER_STATE value
  if (state && !VALID_US_STATES.has(state)) {
    errors.push({
      code: 'ERR-PART-007',
      message: PARTNER_VALIDATION_ERRORS['ERR-PART-007'],
      column: 'M',
    });
  }

  // Validation: ERR-PART-008 - Invalid PRESELECTED value
  let preselected: boolean | undefined;
  if (preselectedStr) {
    if (preselectedStr === 'Y') {
      preselected = true;
    } else if (preselectedStr === 'N') {
      preselected = false;
    } else {
      errors.push({
        code: 'ERR-PART-008',
        message: PARTNER_VALIDATION_ERRORS['ERR-PART-008'],
        column: 'W',
      });
    }
  }

  // Warnings for recommended fields
  if (!addressOne) {
    warnings.push({
      message: 'PARTNER_ADDRESS_ONE is recommended',
      column: 'J',
    });
  }
  if (!city) {
    warnings.push({
      message: 'PARTNER_CITY is recommended',
      column: 'L',
    });
  }
  if (!state) {
    warnings.push({
      message: 'PARTNER_STATE is recommended',
      column: 'M',
    });
  }

  // Validate required contact fields
  if (!pocFirstName) {
    errors.push({
      code: 'ERR-PART-002',
      message: 'PARTNER_POC_FIRST_NAME is required',
      column: 'E',
    });
  }
  if (!pocLastName) {
    errors.push({
      code: 'ERR-PART-002',
      message: 'PARTNER_POC_LAST_NAME is required',
      column: 'F',
    });
  }

  const isValid = errors.length === 0;

  const partner: ParsedPartner | undefined = isValid ? {
    partnerInternalId,
    partnerName,
    partnerDuns: partnerDuns || undefined,
    partnerSapId: partnerSapId || undefined,
    pocFirstName,
    pocLastName,
    pocTitle: pocTitle || undefined,
    pocPhone: pocPhone || undefined,
    pocEmail,
    addressOne: addressOne || undefined,
    addressTwo: addressTwo || undefined,
    city: city || undefined,
    state: state || undefined,
    zipcode: zipcode || undefined,
    country: country || undefined,
    contactFax: contactFax || undefined,
    province: province || undefined,
    roFirstName: roFirstName || undefined,
    roLastName: roLastName || undefined,
    roEmail: roEmail || undefined,
    dueDate,
    partnerGroupDescription: partnerGroupDescription || undefined,
    preselected,
    rowNumber,
  } : undefined;

  return {
    rowNumber,
    isValid,
    errors,
    warnings,
    partner,
  };
}
