/**
 * CMS Batch Load Router
 * INT.DOC.64 Section 6.3 - CMS (Content) Load Summary
 * 
 * Provides tRPC procedures for bulk multi-language content import
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { parseCMSBatchFile } from '../services/cms-batch-parser';
import { importCMSBatch } from '../db-cms-batch';

export const cmsBatchRouter = router({
  /**
   * Validate CMS batch file without importing
   */
  validate: protectedProcedure
    .input(
      z.object({
        fileBase64: z.string(),
        languageCode: z.string().optional().default('en'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Decode base64 file
        const buffer = Buffer.from(input.fileBase64, 'base64');

        // Parse and validate
        const result = parseCMSBatchFile(buffer);

        return {
          success: result.errors.length === 0,
          content: result.content,
          errors: result.errors,
          warnings: result.warnings,
          summary: {
            totalRows: result.content.length,
            validRows: result.content.length,
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
   * Upload and import CMS batch
   */
  upload: protectedProcedure
    .input(
      z.object({
        fileBase64: z.string(),
        languageCode: z.string().optional().default('en'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Decode base64 file
        const buffer = Buffer.from(input.fileBase64, 'base64');

        // Parse and validate
        const parseResult = parseCMSBatchFile(buffer);

        if (parseResult.errors.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Validation errors found. Please fix errors and try again.',
            cause: parseResult.errors,
          });
        }

        // Get enterprise ID from user context (NULL for global content)
        const enterpriseId = ctx.user.enterpriseId || null;

        // Import content
        const importResult = await importCMSBatch(
          parseResult.content,
          enterpriseId,
          ctx.user.id,
          input.languageCode
        );

        return {
          success: true,
          summary: {
            totalProcessed: parseResult.content.length,
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
          message: error instanceof Error ? error.message : 'Failed to import CMS content',
        });
      }
    }),
});
