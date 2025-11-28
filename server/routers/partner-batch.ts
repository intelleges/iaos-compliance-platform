/**
 * Partner Batch Upload tRPC Router
 * 
 * Handles bulk partner import from Excel files per INT.DOC.64
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { parsePartnerBatchFile } from '../services/partner-batch-parser';
import { loadPartnerBatch } from '../db-partner-batch';

export const partnerBatchRouter = router({
  /**
   * Upload and validate partner batch file
   * Returns validation results without importing
   */
  validate: protectedProcedure
    .input(z.object({
      fileBuffer: z.string(), // Base64 encoded file
    }))
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.fileBuffer, 'base64');
      const parseResult = parsePartnerBatchFile(buffer);
      
      return {
        success: parseResult.success,
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        invalidRows: parseResult.invalidRows,
        validationResults: parseResult.validationResults,
        errors: parseResult.errors,
      };
    }),

  /**
   * Upload and import partner batch file
   * Validates and imports partners into database
   */
  upload: protectedProcedure
    .input(z.object({
      fileBuffer: z.string(), // Base64 encoded file
    }))
    .mutation(async ({ input, ctx }) => {
      // Parse and validate file
      const buffer = Buffer.from(input.fileBuffer, 'base64');
      const parseResult = parsePartnerBatchFile(buffer);
      
      if (!parseResult.success) {
        return {
          success: false,
          message: 'Validation failed',
          totalRows: parseResult.totalRows,
          validRows: parseResult.validRows,
          invalidRows: parseResult.invalidRows,
          validationResults: parseResult.validationResults,
          errors: parseResult.errors,
        };
      }

      // Get enterprise ID from user context
      const enterpriseId = ctx.user.enterpriseId;
      if (!enterpriseId) {
        throw new Error('User must be associated with an enterprise');
      }

      // Load partners into database
      const loadResult = await loadPartnerBatch(parseResult.partners, enterpriseId);
      
      return {
        success: true,
        message: 'Partner batch upload completed',
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        invalidRows: parseResult.invalidRows,
        created: loadResult.created,
        updated: loadResult.updated,
        skipped: loadResult.skipped,
        reactivated: loadResult.reactivated,
        loadErrors: loadResult.errors,
      };
    }),
});
