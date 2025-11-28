/**
 * CMS Batch Load Parser
 * INT.DOC.64 Section 6.3 - CMS (Content) Load Summary
 * 
 * Parses Excel files containing multi-language page content for bulk import
 * Template: 5 columns (questionnaireCMS, description, text, link, doc)
 */

import * as XLSX from 'xlsx';

export interface ParsedCMSRow {
  questionnaireCMS: string; // Page identifier number (1, 2, 3, 50...)
  description: string; // Page element type (ACCESS_CODE_TITLE, COMPANY_EDIT_PAGE_SUBTITLE, etc.)
  text?: string; // Display content (HTML allowed)
  link?: string; // Optional hyperlink URL
  doc?: string; // Optional document reference
  rowNumber: number;
}

export interface CMSValidationError {
  code: string;
  message: string;
  rowNumber: number;
  field?: string;
}

export interface CMSParseResult {
  content: ParsedCMSRow[];
  errors: CMSValidationError[];
  warnings: CMSValidationError[];
}

/**
 * Parse Excel file and validate CMS content data
 */
export function parseCMSBatchFile(buffer: Buffer): CMSParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      content: [],
      errors: [{ code: 'ERR-FILE-001', message: 'No worksheet found in file', rowNumber: 0 }],
      warnings: [],
    };
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });

  const content: ParsedCMSRow[] = [];
  const errors: CMSValidationError[] = [];
  const warnings: CMSValidationError[] = [];

  // Track duplicates
  const seenKeys = new Set<string>();

  rawData.forEach((row, index) => {
    const rowNumber = index + 2; // Excel row (1-indexed + header)

    // Parse row data
    const questionnaireCMS = String(row['questionnaireCMS'] || '').trim();
    const description = String(row['description'] || '').trim();
    const text = row['text'] ? String(row['text']).trim() : undefined;
    const link = row['link'] ? String(row['link']).trim() : undefined;
    const doc = row['doc'] ? String(row['doc']).trim() : undefined;

    // Validation: Required fields
    if (!questionnaireCMS) {
      errors.push({
        code: 'ERR-CMS-001',
        message: 'questionnaireCMS is required',
        rowNumber,
        field: 'questionnaireCMS',
      });
    }

    if (!description) {
      errors.push({
        code: 'ERR-CMS-002',
        message: 'description is required',
        rowNumber,
        field: 'description',
      });
    }

    // Validation: At least one content field must be present
    if (!text && !link && !doc) {
      errors.push({
        code: 'ERR-CMS-003',
        message: 'At least one of text, link, or doc must be provided',
        rowNumber,
      });
    }

    // Validation: Link format (if provided)
    if (link && !isValidURL(link)) {
      warnings.push({
        code: 'WARN-CMS-001',
        message: `Link may not be a valid URL: ${link}`,
        rowNumber,
        field: 'link',
      });
    }

    // Validation: HTML content safety check
    if (text && containsDangerousHTML(text)) {
      warnings.push({
        code: 'WARN-CMS-002',
        message: 'Text contains potentially dangerous HTML tags (script, iframe, etc.)',
        rowNumber,
        field: 'text',
      });
    }

    // Check for duplicate keys
    const contentKey = `${questionnaireCMS}|${description}`;
    if (seenKeys.has(contentKey)) {
      warnings.push({
        code: 'WARN-CMS-003',
        message: `Duplicate content: Page ${questionnaireCMS}, Element ${description}`,
        rowNumber,
      });
    } else {
      seenKeys.add(contentKey);
    }

    // Only add content if required fields are present
    if (questionnaireCMS && description) {
      content.push({
        questionnaireCMS,
        description,
        text,
        link,
        doc,
        rowNumber,
      });
    }
  });

  return { content, errors, warnings };
}

/**
 * Validate URL format (basic check)
 */
function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    // Allow relative URLs
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
  }
}

/**
 * Check for dangerous HTML tags
 */
function containsDangerousHTML(html: string): boolean {
  const dangerousTags = /<(script|iframe|object|embed|form|input)/i;
  return dangerousTags.test(html);
}
