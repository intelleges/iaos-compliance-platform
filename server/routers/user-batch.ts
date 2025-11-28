/**
 * User Batch Load Router
 * INT.DOC.64 Section 3 - User Batch Load
 * 
 * Provides tRPC procedures for bulk user import
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { parseUserBatchFile } from '../services/user-batch-parser';
import { importUserBatch } from '../db-user-batch';

export const userBatchRouter = router({
  /**
   * Validate user batch file without importing
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
        const result = parseUserBatchFile(buffer);

        return {
          success: result.errors.length === 0,
          users: result.users,
          errors: result.errors,
          warnings: result.warnings,
          summary: {
            totalRows: result.users.length,
            validRows: result.users.length,
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
   * Upload and import user batch
   */
  upload: protectedProcedure
    .input(
      z.object({
        fileBase64: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Decode base64 file
        const buffer = Buffer.from(input.fileBase64, 'base64');

        // Parse and validate
        const parseResult = parseUserBatchFile(buffer);

        if (parseResult.errors.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Validation errors found. Please fix errors and try again.',
            cause: parseResult.errors,
          });
        }

        // Get enterprise ID from user context
        const enterpriseId = ctx.user.enterpriseId;
        if (!enterpriseId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'User must belong to an enterprise to import users',
          });
        }

        // Import users
        const importResult = await importUserBatch(parseResult.users, enterpriseId);

        return {
          success: true,
          summary: {
            totalProcessed: parseResult.users.length,
            created: importResult.created,
            updated: importResult.updated,
            skipped: importResult.skipped,
            reactivated: importResult.reactivated,
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
          message: error instanceof Error ? error.message : 'Failed to import users',
        });
      }
    }),
});
