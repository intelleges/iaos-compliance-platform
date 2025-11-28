/**
 * User Batch Load Parser
 * INT.DOC.64 Section 3 - User Batch Load
 * 
 * Parses Excel files containing user data for bulk import
 * Template: 15 columns across 3 sections
 */

import * as XLSX from 'xlsx';

// Valid role values per INT.DOC.64 Section 3.2.3
const VALID_ROLES = [
  'ENTERPRISE_ADMIN',
  'SITE_ADMIN',
  'GROUP_ADMIN',
  'PARTNERTYPE_ADMIN',
  'PROCUREMENT_DIRECTOR',
  'PROCUREMENT_MANAGER',
  'BUYER',
  'PROCUREMENT_ANALYST',
  'COMPLIANCE_MANAGER',
  'COMPLIANCE_SME',
  'DATA_ADMIN',
  'VIEWER',
] as const;

export type UserRole = typeof VALID_ROLES[number];

export interface ParsedUserRow {
  // Section 1: User Identification (REQUIRED)
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;

  // Section 2: Role & Access (REQUIRED)
  role: UserRole;
  siteCode?: string; // Comma-separated for multiple sites, or 'ALL'
  groupCode?: string; // Comma-separated for multiple groups
  partnerTypeAccess?: string; // Comma-separated or 'ALL'

  // Section 3: Additional Fields (OPTIONAL)
  title?: string;
  department?: string;
  managerEmail?: string;
  ssoId?: string;
  isActive?: boolean;
  notes?: string;

  // Metadata
  rowNumber: number;
}

export interface UserValidationError {
  code: string;
  message: string;
  rowNumber: number;
  field?: string;
}

export interface UserParseResult {
  users: ParsedUserRow[];
  errors: UserValidationError[];
  warnings: UserValidationError[];
}

/**
 * Parse Excel file and validate user data
 */
export function parseUserBatchFile(buffer: Buffer): UserParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      users: [],
      errors: [{ code: 'ERR-FILE-001', message: 'No worksheet found in file', rowNumber: 0 }],
      warnings: [],
    };
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });

  const users: ParsedUserRow[] = [];
  const errors: UserValidationError[] = [];
  const warnings: UserValidationError[] = [];

  // Track duplicates
  const seenUserIds = new Set<string>();
  const seenEmails = new Set<string>();

  rawData.forEach((row, index) => {
    const rowNumber = index + 2; // Excel row (1-indexed + header)

    // Parse row data
    const userId = String(row['USER_ID'] || '').trim();
    const firstName = String(row['USER_FIRST_NAME'] || '').trim();
    const lastName = String(row['USER_LAST_NAME'] || '').trim();
    const email = String(row['USER_EMAIL'] || '').trim().toLowerCase();
    const phone = row['USER_PHONE'] ? String(row['USER_PHONE']).trim() : undefined;

    const role = String(row['USER_ROLE'] || '').trim().toUpperCase();
    const siteCode = row['SITE_CODE'] ? String(row['SITE_CODE']).trim() : undefined;
    const groupCode = row['GROUP_CODE'] ? String(row['GROUP_CODE']).trim() : undefined;
    const partnerTypeAccess = row['PARTNERTYPE_ACCESS'] ? String(row['PARTNERTYPE_ACCESS']).trim() : undefined;

    const title = row['USER_TITLE'] ? String(row['USER_TITLE']).trim() : undefined;
    const department = row['DEPARTMENT'] ? String(row['DEPARTMENT']).trim() : undefined;
    const managerEmail = row['MANAGER_EMAIL'] ? String(row['MANAGER_EMAIL']).trim().toLowerCase() : undefined;
    const ssoId = row['SSO_ID'] ? String(row['SSO_ID']).trim() : undefined;
    const isActiveRaw = row['IS_ACTIVE'];
    const isActive = isActiveRaw === null || isActiveRaw === undefined ? true : 
                     (String(isActiveRaw).toUpperCase() === 'Y' || String(isActiveRaw).toUpperCase() === 'TRUE');
    const notes = row['NOTES'] ? String(row['NOTES']).trim() : undefined;

    // Validation: Required fields
    if (!userId) {
      errors.push({
        code: 'ERR-USER-001',
        message: 'USER_ID is required',
        rowNumber,
        field: 'USER_ID',
      });
    }

    if (!firstName) {
      errors.push({
        code: 'ERR-USER-002',
        message: 'USER_FIRST_NAME is required',
        rowNumber,
        field: 'USER_FIRST_NAME',
      });
    }

    if (!lastName) {
      errors.push({
        code: 'ERR-USER-002',
        message: 'USER_LAST_NAME is required',
        rowNumber,
        field: 'USER_LAST_NAME',
      });
    }

    if (!email) {
      errors.push({
        code: 'ERR-USER-002',
        message: 'USER_EMAIL is required',
        rowNumber,
        field: 'USER_EMAIL',
      });
    }

    if (!role) {
      errors.push({
        code: 'ERR-USER-004',
        message: 'USER_ROLE is required',
        rowNumber,
        field: 'USER_ROLE',
      });
    }

    // Validation: Email format
    if (email && !isValidEmail(email)) {
      errors.push({
        code: 'ERR-USER-003',
        message: `Invalid email format: ${email}`,
        rowNumber,
        field: 'USER_EMAIL',
      });
    }

    // Validation: Duplicate USER_ID
    if (userId && seenUserIds.has(userId)) {
      errors.push({
        code: 'ERR-USER-001',
        message: `Duplicate USER_ID: ${userId}`,
        rowNumber,
        field: 'USER_ID',
      });
    } else if (userId) {
      seenUserIds.add(userId);
    }

    // Validation: Duplicate email
    if (email && seenEmails.has(email)) {
      errors.push({
        code: 'ERR-USER-002',
        message: `Duplicate email address: ${email}`,
        rowNumber,
        field: 'USER_EMAIL',
      });
    } else if (email) {
      seenEmails.add(email);
    }

    // Validation: Role value
    if (role && !VALID_ROLES.includes(role as UserRole)) {
      errors.push({
        code: 'ERR-USER-004',
        message: `Invalid USER_ROLE: ${role}. Must be one of: ${VALID_ROLES.join(', ')}`,
        rowNumber,
        field: 'USER_ROLE',
      });
    }

    // Validation: Manager email format
    if (managerEmail && !isValidEmail(managerEmail)) {
      warnings.push({
        code: 'WARN-USER-001',
        message: `Invalid manager email format: ${managerEmail}`,
        rowNumber,
        field: 'MANAGER_EMAIL',
      });
    }

    // Validation: SSO ID format (if provided)
    if (ssoId && ssoId.length < 3) {
      errors.push({
        code: 'ERR-USER-006',
        message: `Invalid SSO_ID format: must be at least 3 characters`,
        rowNumber,
        field: 'SSO_ID',
      });
    }

    // Only add user if required fields are present
    if (userId && firstName && lastName && email && role) {
      users.push({
        userId,
        firstName,
        lastName,
        email,
        phone,
        role: role as UserRole,
        siteCode,
        groupCode,
        partnerTypeAccess,
        title,
        department,
        managerEmail,
        ssoId,
        isActive,
        notes,
        rowNumber,
      });
    }
  });

  return { users, errors, warnings };
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
