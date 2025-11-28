/**
 * AMS Batch Load - Database Operations
 * INT.DOC.64 Section 6.4 - AMS (AutoMail) Load Summary
 * 
 * Handles bulk import of email templates for automated reminders
 * 
 * NOTE: Email templates are tied to touchpointQuestionnaireId in the schema.
 * For batch import without specific touchpoint associations, we'll need to:
 * 1. Create templates for ALL active touchpointQuestionnaires, OR
 * 2. Store as global templates and associate later
 * 
 * Current implementation: Store with touchpointQuestionnaireId = 0 for global templates
 * that can be copied/associated to specific touchpoints later.
 */

import { eq, and } from 'drizzle-orm';
import { getDb } from './db';
import { emailTemplates } from '../drizzle/schema';
import type { ParsedAMSRow } from './services/ams-batch-parser';

export interface AMSBatchResult {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{
    type: number;
    subject: string;
    rowNumber: number;
    error: string;
  }>;
}

/**
 * Import AMS email templates with upsert logic
 * - If mailType exists for touchpoint → UPDATE
 * - If mailType doesn't exist → CREATE
 * - If content unchanged → SKIP
 * 
 * @param touchpointQuestionnaireId - If provided, associate templates with specific touchpoint.
 *                                     If 0 or undefined, create global templates.
 */
export async function importAMSBatch(
  parsedTemplates: ParsedAMSRow[],
  touchpointQuestionnaireId: number = 0
): Promise<AMSBatchResult> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result: AMSBatchResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const template of parsedTemplates) {
    try {
      // Check if template already exists for this mailType + touchpoint
      const existing = await db
        .select()
        .from(emailTemplates)
        .where(
          and(
            eq(emailTemplates.mailType, template.type),
            eq(emailTemplates.touchpointQuestionnaireId, touchpointQuestionnaireId)
          )
        )
        .limit(1);

      // Build combined footer
      const footer = buildFooter(template);

      if (existing.length > 0) {
        const existingTemplate = existing[0]!;

        // Check if content has changed
        if (
          existingTemplate.subject === template.subject &&
          existingTemplate.text === template.text &&
          existingTemplate.footer1 === footer &&
          existingTemplate.sendDateCalcFactor === (template.sendDateCalcFactor || 0)
        ) {
          result.skipped++;
          continue;
        }

        // UPDATE existing template
        await db
          .update(emailTemplates)
          .set({
            subject: template.subject,
            text: template.text,
            footer1: footer,
            sendDateCalcFactor: template.sendDateCalcFactor || 0,
            updatedAt: new Date(),
          })
          .where(eq(emailTemplates.id, existingTemplate.id));

        result.updated++;
      } else {
        // CREATE new template
        await db.insert(emailTemplates).values({
          subject: template.subject,
          text: template.text,
          footer1: footer,
          footer2: template.signature || null,
          sendDateCalcFactor: template.sendDateCalcFactor || 0,
          mailType: template.type,
          touchpointQuestionnaireId,
        });

        result.created++;
      }
    } catch (error) {
      result.errors.push({
        type: template.type,
        subject: template.subject,
        rowNumber: template.rowNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

/**
 * Build combined footer from footer and signature
 */
function buildFooter(template: ParsedAMSRow): string | null {
  const parts: string[] = [];
  
  if (template.footer) {
    parts.push(template.footer);
  }
  
  if (template.signature) {
    parts.push(template.signature);
  }
  
  return parts.length > 0 ? parts.join('\n\n') : null;
}
