/**
 * CMS Batch Load - Database Operations
 * INT.DOC.64 Section 6.3 - CMS (Content) Load Summary
 * 
 * Handles bulk import of multi-language content for supplier portal
 */

import { eq, and } from 'drizzle-orm';
import { getDb } from './db';
import { cmsContent } from '../drizzle/schema';
import type { ParsedCMSRow } from './services/cms-batch-parser';

export interface CMSBatchResult {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{
    questionnaireCMS: string;
    description: string;
    rowNumber: number;
    error: string;
  }>;
}

/**
 * Import CMS content with upsert logic
 * - If key+languageCode exists → UPDATE
 * - If key+languageCode doesn't exist → CREATE
 * - If content unchanged → SKIP
 */
export async function importCMSBatch(
  parsedContent: ParsedCMSRow[],
  enterpriseId: number | null,
  createdBy: number,
  languageCode: string = 'en'
): Promise<CMSBatchResult> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result: CMSBatchResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const row of parsedContent) {
    try {
      // Build content key from questionnaireCMS + description
      // e.g., "1_ACCESS_CODE_TITLE", "2_COMPANY_EDIT_PAGE_SUBTITLE"
      const key = `${row.questionnaireCMS}_${row.description}`;
      
      // Determine page category from questionnaireCMS
      const page = getPageCategory(row.questionnaireCMS);
      
      // Determine category from description
      const category = getCategoryFromDescription(row.description);
      
      // Build text content (combine text, link, doc)
      const textContent = buildTextContent(row);

      // Check if content already exists
      const existing = await db
        .select()
        .from(cmsContent)
        .where(
          and(
            eq(cmsContent.key, key),
            eq(cmsContent.languageCode, languageCode),
            enterpriseId ? eq(cmsContent.enterpriseId, enterpriseId) : eq(cmsContent.enterpriseId, null)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        const existingContent = existing[0]!;

        // Check if content has changed
        if (existingContent.text === textContent && existingContent.description === row.description) {
          result.skipped++;
          continue;
        }

        // UPDATE existing content
        await db
          .update(cmsContent)
          .set({
            text: textContent,
            description: row.description,
            page,
            category,
            version: (existingContent.version || 1) + 1,
            updatedAt: new Date(),
          })
          .where(eq(cmsContent.id, existingContent.id));

        result.updated++;
      } else {
        // CREATE new content
        await db.insert(cmsContent).values({
          key,
          languageCode,
          text: textContent,
          description: row.description,
          page,
          category,
          enterpriseId,
          createdBy,
          version: 1,
          isActive: true,
        });

        result.created++;
      }
    } catch (error) {
      result.errors.push({
        questionnaireCMS: row.questionnaireCMS,
        description: row.description,
        rowNumber: row.rowNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

/**
 * Determine page category from questionnaireCMS number
 */
function getPageCategory(questionnaireCMS: string): string {
  const pageNum = parseInt(questionnaireCMS);
  
  if (pageNum === 1) return 'access_code';
  if (pageNum === 2) return 'company_edit';
  if (pageNum === 3) return 'questionnaire';
  if (pageNum === 50) return 'confirmation';
  if (pageNum === 51) return 'save_exit';
  
  return `page_${questionnaireCMS}`;
}

/**
 * Determine category from description field
 */
function getCategoryFromDescription(description: string): string {
  const upper = description.toUpperCase();
  
  if (upper.includes('TITLE')) return 'title';
  if (upper.includes('SUBTITLE')) return 'subtitle';
  if (upper.includes('BUTTON')) return 'button';
  if (upper.includes('LABEL')) return 'label';
  if (upper.includes('MESSAGE')) return 'message';
  if (upper.includes('INSTRUCTION')) return 'instruction';
  if (upper.includes('HELP')) return 'help';
  if (upper.includes('ERROR')) return 'error';
  
  return 'content';
}

/**
 * Build combined text content from text, link, and doc fields
 */
function buildTextContent(row: ParsedCMSRow): string {
  const parts: string[] = [];
  
  if (row.text) {
    parts.push(row.text);
  }
  
  if (row.link) {
    parts.push(`[LINK:${row.link}]`);
  }
  
  if (row.doc) {
    parts.push(`[DOC:${row.doc}]`);
  }
  
  return parts.join(' ');
}
