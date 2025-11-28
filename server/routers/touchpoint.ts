/**
 * Touchpoint Router
 * Manages touchpoint (compliance campaign) operations with CUI access logging
 * Per NIST 800-171 Section 3.1.13 - Employ cryptographic mechanisms to protect CUI
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { touchpoints } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { logTouchpointCUIAccess } from "../utils/cui-middleware";

export const touchpointRouter = router({
  /**
   * Get touchpoint by ID with CUI access logging
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Fetch touchpoint
      const [touchpoint] = await db
        .select()
        .from(touchpoints)
        .where(eq(touchpoints.id, input.id))
        .limit(1);

      if (!touchpoint) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Touchpoint not found",
        });
      }

      // Log CUI access if touchpoint is CUI-classified
      await logTouchpointCUIAccess(ctx, touchpoint.id, touchpoint.isCUI, {
        touchpointTitle: touchpoint.title,
        touchpointAbbreviation: touchpoint.abbreviation,
      });

      return touchpoint;
    }),

  /**
   * List all active touchpoints with optional protocol filter
   */
  list: protectedProcedure
    .input(
      z.object({
        protocolId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const conditions = [eq(touchpoints.active, true)];

      if (input.protocolId) {
        conditions.push(eq(touchpoints.protocolId, input.protocolId));
      }

      const results = await db
        .select()
        .from(touchpoints)
        .where(and(...conditions))
        .orderBy(touchpoints.sortOrder);

      return results;
    }),

  /**
   * Create new touchpoint
   */
  create: protectedProcedure
    .input(
      z.object({
        protocolId: z.number(),
        title: z.string().max(50),
        description: z.string().optional(),
        abbreviation: z.string().max(50).optional(),
        purpose: z.string().optional(),
        target: z.number().optional(),
        automaticReminder: z.boolean().default(false),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        isCUI: z.boolean().default(false), // CUI classification flag
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Insert touchpoint
      const [newTouchpoint] = await db
        .insert(touchpoints)
        .values({
          protocolId: input.protocolId,
          title: input.title,
          description: input.description,
          abbreviation: input.abbreviation,
          purpose: input.purpose,
          target: input.target,
          automaticReminder: input.automaticReminder,
          startDate: input.startDate,
          endDate: input.endDate,
          isCUI: input.isCUI,
          active: true,
        })
        .$returningId();

      return {
        id: newTouchpoint.id,
        message: input.isCUI
          ? "CUI-classified touchpoint created successfully"
          : "Touchpoint created successfully",
      };
    }),

  /**
   * Update touchpoint
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().max(50).optional(),
        description: z.string().optional(),
        abbreviation: z.string().max(50).optional(),
        purpose: z.string().optional(),
        target: z.number().optional(),
        automaticReminder: z.boolean().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        isCUI: z.boolean().optional(), // Allow updating CUI classification
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const { id, ...updateData } = input;

      await db
        .update(touchpoints)
        .set(updateData)
        .where(eq(touchpoints.id, id));

      return {
        success: true,
        message: "Touchpoint updated successfully",
      };
    }),

  /**
   * Archive touchpoint (soft delete)
   */
  archive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      await db
        .update(touchpoints)
        .set({ active: false })
        .where(eq(touchpoints.id, input.id));

      return {
        success: true,
        message: "Touchpoint archived successfully",
      };
    }),
});
