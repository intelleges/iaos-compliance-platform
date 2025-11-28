import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { questionnaires, questions, responses, touchpointQuestionnaires } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Questionnaire Builder Router
 * 
 * Admin interface for creating and managing questionnaires
 * - Create/update/delete questionnaires
 * - Add/edit/delete questions
 * - Configure question types (7 types)
 * - Set up skip logic
 * - Manage response options
 */

// Question type constants
export const QUESTION_TYPES = {
  TEXT_SHORT: 1,
  TEXT_LONG: 2,
  RADIO: 4,
  YES_NO: 5,
  CHECKBOX: 6,
  FILE_UPLOAD: 7,
  DATE: 9,
} as const;

export const questionnaireBuilderRouter = router({
  /**
   * List all questionnaires for current enterprise
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    
    const enterpriseId = ctx.user.enterpriseId;
    if (!enterpriseId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Enterprise ID required' });
    }
    
    const result = await db
      .select()
      .from(questionnaires)
      .where(and(
        eq(questionnaires.enterpriseId, enterpriseId),
        eq(questionnaires.active, true)
      ))
      .orderBy(desc(questionnaires.createdAt));
    
    return result;
  }),
  
  /**
   * Get questionnaire with all questions
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      const enterpriseId = ctx.user.enterpriseId;
      if (!enterpriseId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Enterprise ID required' });
      }
      
      // Get questionnaire
      const questionnaire = await db
        .select()
        .from(questionnaires)
        .where(and(
          eq(questionnaires.id, input.id),
          eq(questionnaires.enterpriseId, enterpriseId),
          eq(questionnaires.active, true)
        ))
        .limit(1);
      
      if (!questionnaire[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Questionnaire not found' });
      }
      
      // Get questions
      const questionList = await db
        .select()
        .from(questions)
        .where(and(
          eq(questions.questionnaireId, input.id),
          eq(questions.active, true)
        ))
        .orderBy(questions.sortOrder);
      
      return {
        questionnaire: questionnaire[0],
        questions: questionList,
      };
    }),
  
  /**
   * Create new questionnaire
   */
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      footer: z.string().optional(),
      partnerTypeId: z.number(),
      multiLanguage: z.boolean().optional(),
      levelType: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      const enterpriseId = ctx.user.enterpriseId;
      if (!enterpriseId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Enterprise ID required' });
      }
      
      const result = await db.insert(questionnaires).values({
        enterpriseId,
        title: input.title,
        description: input.description || null,
        footer: input.footer || null,
        partnerTypeId: input.partnerTypeId,
        personId: ctx.user.id,
        multiLanguage: input.multiLanguage || false,
        levelType: input.levelType || 1, // Default to company level
        locked: false,
        active: true,
      });
      
      return {
        id: Number((result as any).insertId),
        success: true,
      };
    }),
  
  /**
   * Update questionnaire
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      footer: z.string().optional(),
      locked: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      const enterpriseId = ctx.user.enterpriseId;
      if (!enterpriseId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Enterprise ID required' });
      }
      
      // Verify ownership
      const existing = await db
        .select()
        .from(questionnaires)
        .where(and(
          eq(questionnaires.id, input.id),
          eq(questionnaires.enterpriseId, enterpriseId)
        ))
        .limit(1);
      
      if (!existing[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Questionnaire not found' });
      }
      
      if (existing[0].locked) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot edit locked questionnaire' });
      }
      
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.footer !== undefined) updateData.footer = input.footer;
      if (input.locked !== undefined) updateData.locked = input.locked;
      
      await db
        .update(questionnaires)
        .set(updateData)
        .where(eq(questionnaires.id, input.id));
      
      return { success: true };
    }),
  
  /**
   * Delete questionnaire (soft delete)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      const enterpriseId = ctx.user.enterpriseId;
      if (!enterpriseId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Enterprise ID required' });
      }
      
      // Verify ownership
      const existing = await db
        .select()
        .from(questionnaires)
        .where(and(
          eq(questionnaires.id, input.id),
          eq(questionnaires.enterpriseId, enterpriseId)
        ))
        .limit(1);
      
      if (!existing[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Questionnaire not found' });
      }
      
      if (existing[0].locked) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot delete locked questionnaire' });
      }
      
      // Soft delete
      await db
        .update(questionnaires)
        .set({ active: false })
        .where(eq(questionnaires.id, input.id));
      
      return { success: true };
    }),
  
  /**
   * Add question to questionnaire
   */
  addQuestion: protectedProcedure
    .input(z.object({
      questionnaireId: z.number(),
      title: z.string().min(1),
      question: z.string().optional(),
      name: z.string().optional(),
      tag: z.string().optional(),
      responseType: z.number().min(1).max(10),
      required: z.boolean().optional(),
      weight: z.number().optional(),
      hintText: z.string().optional(),
      skipLogicAnswer: z.number().optional(),
      skipLogicJump: z.string().optional(),
      commentRequired: z.boolean().optional(),
      commentBoxTxt: z.string().optional(),
      commentType: z.number().optional(),
      isCUI: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      const enterpriseId = ctx.user.enterpriseId;
      if (!enterpriseId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Enterprise ID required' });
      }
      
      // Verify questionnaire ownership
      const questionnaire = await db
        .select()
        .from(questionnaires)
        .where(and(
          eq(questionnaires.id, input.questionnaireId),
          eq(questionnaires.enterpriseId, enterpriseId)
        ))
        .limit(1);
      
      if (!questionnaire[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Questionnaire not found' });
      }
      
      if (questionnaire[0].locked) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot add questions to locked questionnaire' });
      }
      
      const result = await db.insert(questions).values({
        questionnaireId: input.questionnaireId,
        title: input.title,
        question: input.question || input.title,
        name: input.name || null,
        tag: input.tag || null,
        responseType: input.responseType,
        required: input.required || false,
        weight: input.weight || null,
        hintText: input.hintText || null,
        skipLogicAnswer: input.skipLogicAnswer || null,
        skipLogicJump: input.skipLogicJump || null,
        commentRequired: input.commentRequired || false,
        commentBoxTxt: input.commentBoxTxt || null,
        commentType: input.commentType || null,
        isCUI: input.isCUI || false,
        sortOrder: input.sortOrder || 0,
        active: true,
      });
      
      return {
        id: Number((result as any).insertId),
        success: true,
      };
    }),
  
  /**
   * Update question
   */
  updateQuestion: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      question: z.string().optional(),
      tag: z.string().optional(),
      responseType: z.number().optional(),
      required: z.boolean().optional(),
      hintText: z.string().optional(),
      skipLogicAnswer: z.number().optional(),
      skipLogicJump: z.string().optional(),
      isCUI: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      const enterpriseId = ctx.user.enterpriseId;
      if (!enterpriseId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Enterprise ID required' });
      }
      
      // Verify ownership through questionnaire
      const question = await db
        .select({
          questionId: questions.id,
          questionnaireId: questions.questionnaireId,
          locked: questionnaires.locked,
        })
        .from(questions)
        .innerJoin(questionnaires, eq(questions.questionnaireId, questionnaires.id))
        .where(and(
          eq(questions.id, input.id),
          eq(questionnaires.enterpriseId, enterpriseId)
        ))
        .limit(1);
      
      if (!question[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Question not found' });
      }
      
      if (question[0].locked) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot edit questions in locked questionnaire' });
      }
      
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.question !== undefined) updateData.question = input.question;
      if (input.tag !== undefined) updateData.tag = input.tag;
      if (input.responseType !== undefined) updateData.responseType = input.responseType;
      if (input.required !== undefined) updateData.required = input.required;
      if (input.hintText !== undefined) updateData.hintText = input.hintText;
      if (input.skipLogicAnswer !== undefined) updateData.skipLogicAnswer = input.skipLogicAnswer;
      if (input.skipLogicJump !== undefined) updateData.skipLogicJump = input.skipLogicJump;
      if (input.isCUI !== undefined) updateData.isCUI = input.isCUI;
      if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
      
      await db
        .update(questions)
        .set(updateData)
        .where(eq(questions.id, input.id));
      
      return { success: true };
    }),
  
  /**
   * Delete question (soft delete)
   */
  deleteQuestion: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      const enterpriseId = ctx.user.enterpriseId;
      if (!enterpriseId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Enterprise ID required' });
      }
      
      // Verify ownership through questionnaire
      const question = await db
        .select({
          questionId: questions.id,
          locked: questionnaires.locked,
        })
        .from(questions)
        .innerJoin(questionnaires, eq(questions.questionnaireId, questionnaires.id))
        .where(and(
          eq(questions.id, input.id),
          eq(questionnaires.enterpriseId, enterpriseId)
        ))
        .limit(1);
      
      if (!question[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Question not found' });
      }
      
      if (question[0].locked) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot delete questions in locked questionnaire' });
      }
      
      // Soft delete
      await db
        .update(questions)
        .set({ active: false })
        .where(eq(questions.id, input.id));
      
      return { success: true };
    }),
  
  /**
   * Reorder questions
   */
  reorderQuestions: protectedProcedure
    .input(z.object({
      questionnaireId: z.number(),
      questionIds: z.array(z.number()),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      const enterpriseId = ctx.user.enterpriseId;
      if (!enterpriseId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Enterprise ID required' });
      }
      
      // Verify questionnaire ownership
      const questionnaire = await db
        .select()
        .from(questionnaires)
        .where(and(
          eq(questionnaires.id, input.questionnaireId),
          eq(questionnaires.enterpriseId, enterpriseId)
        ))
        .limit(1);
      
      if (!questionnaire[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Questionnaire not found' });
      }
      
      if (questionnaire[0].locked) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot reorder questions in locked questionnaire' });
      }
      
      // Update sort order for each question
      for (let i = 0; i < input.questionIds.length; i++) {
        await db
          .update(questions)
          .set({ sortOrder: i })
          .where(eq(questions.id, input.questionIds[i]!));
      }
      
      return { success: true };
    }),
  
  /**
   * Upload QMS Excel template and import questions
   * 
   * @param questionnaireId - Target questionnaire ID
   * @param fileData - Base64 encoded Excel file
   * @param mode - 'insert' (new questions) or 'update' (replace existing)
   */
  uploadQMS: protectedProcedure
    .input(z.object({
      questionnaireId: z.number(),
      fileData: z.string(), // Base64 encoded Excel file
      mode: z.enum(['insert', 'update']).default('insert'),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      const enterpriseId = ctx.user.enterpriseId;
      if (!enterpriseId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Enterprise ID required' });
      }
      
      // Verify questionnaire exists and belongs to user's enterprise
      const questionnaire = await db
        .select()
        .from(questionnaires)
        .where(and(
          eq(questionnaires.id, input.questionnaireId),
          eq(questionnaires.enterpriseId, enterpriseId)
        ))
        .limit(1);
      
      if (questionnaire.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Questionnaire not found' });
      }
      
      if (questionnaire[0].locked) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot import questions into locked questionnaire' });
      }
      
      // Decode base64 file data
      const fileBuffer = Buffer.from(input.fileData, 'base64');
      
      // Import QMS Excel file
      const { importQMSExcel } = await import('../services/qms-parser');
      const result = await importQMSExcel(fileBuffer, input.questionnaireId, input.mode);
      
      if (!result.success) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.summary,
          cause: result.errors
        });
      }
      
      return result;
    }),
});
