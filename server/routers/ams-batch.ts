/**
 * AMS Batch Load Router
 * INT.DOC.64 Section 6.4 - AMS (AutoMail) Load Summary
 * 
 * Provides tRPC procedures for bulk email template import
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { parseAMSBatchFile } from '../services/ams-batch-parser';
import { importAMSBatch } from '../db-ams-batch';

export const amsBatchRouter = router({
  /**
   * Validate AMS batch file without importing
   */
  validate: protectedProcedure
    .input(
      z.object({
        fileBase64: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Decode base64 file
        const buffer = Buffer.from(input.fileBase64, 'base64');

        // Parse and validate
        const result = parseAMSBatchFile(buffer);

        return {
          success: result.errors.length === 0,
          templates: result.templates,
          errors: result.errors,
          warnings: result.warnings,
          summary: {
            totalRows: result.templates.length,
            validRows: result.templates.length,
            errorRows: result.errors.length,
            warningRows: result.warnings.length,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error instanceof Error ? error.message : 'Failed to parse file',
        });
      }
    }),

  /**
   * Upload and import AMS batch
   */
  upload: protectedProcedure
    .input(
      z.object({
        fileBase64: z.string(),
        touchpointQuestionnaireId: z.number().optional().default(0),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Decode base64 file
        const buffer = Buffer.from(input.fileBase64, 'base64');

        // Parse and validate
        const parseResult = parseAMSBatchFile(buffer);

        if (parseResult.errors.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Validation errors found. Please fix errors and try again.',
            cause: parseResult.errors,
          });
        }

        // Import templates
        const importResult = await importAMSBatch(
          parseResult.templates,
          input.touchpointQuestionnaireId
        );

        return {
          success: true,
          summary: {
            totalProcessed: parseResult.templates.length,
            created: importResult.created,
            updated: importResult.updated,
            skipped: importResult.skipped,
            errors: importResult.errors.length,
          },
          errors: importResult.errors,
          warnings: parseResult.warnings,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to import email templates',
        });
      }
    }),
});
