/**
 * Touchpoint Assignment Batch Load Router
 * INT.DOC.64 Section 4 - Touchpoint Assignment Load
 * 
 * Provides tRPC procedures for bulk partner-to-touchpoint assignments
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { parseAssignmentBatchFile } from '../services/assignment-batch-parser';
import { importAssignmentBatch } from '../db-assignment-batch';

export const assignmentBatchRouter = router({
  /**
   * Validate assignment batch file without importing
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
        const result = parseAssignmentBatchFile(buffer);

        return {
          success: result.errors.length === 0,
          assignments: result.assignments,
          errors: result.errors,
          warnings: result.warnings,
          summary: {
            totalRows: result.assignments.length,
            validRows: result.assignments.length,
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
   * Upload and import assignment batch
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
        const parseResult = parseAssignmentBatchFile(buffer);

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
            message: 'User must belong to an enterprise to import assignments',
          });
        }

        // Import assignments
        const importResult = await importAssignmentBatch(
          parseResult.assignments,
          enterpriseId,
          ctx.user.id
        );

        return {
          success: true,
          summary: {
            totalProcessed: parseResult.assignments.length,
            assigned: importResult.assigned,
            reassigned: importResult.reassigned,
            skipped: importResult.skipped,
            invitationsSent: importResult.invitationsSent,
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
          message: error instanceof Error ? error.message : 'Failed to import assignments',
        });
      }
    }),
});
