import { z } from 'zod';
import { router, publicProcedure } from '../_core/trpc';
import { appendFileSync } from 'fs';

function log(message: string) {
  const timestamp = new Date().toISOString();
  appendFileSync('/tmp/supplier-auth.log', `${timestamp} ${message}\n`);
  console.log(message);
}
import { TRPCError } from '@trpc/server';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db';
import { partnerQuestionnaires, partners, touchpointQuestionnaires, questionnaires, touchpoints } from '../../drizzle/schema';
import { isValidAccessCodeFormat } from '../utils/access-code';
import { createSupplierSession, validateSupplierSession, updateSessionActivity, type SupplierSession } from '../utils/supplier-session';
import { SUPPLIER_SESSION_COOKIE_NAME } from '../../shared/const';
import { getSessionCookieOptions } from '../_core/cookies';
import { sendEmail, getSupplierConfirmationEmailTemplate, getProcurementAlertEmailTemplate } from '../_core/email';
import { ENV } from '../_core/env';

/**
 * Supplier authentication and questionnaire access router
 * 
 * Handles:
 * - Access code validation
 * - Supplier session management (8-hour max, 1-hour idle)
 * - Questionnaire retrieval
 * - Response submission
 */
export const supplierRouter = router({
  /**
   * Validate access code and create supplier session
   * 
   * Business rules:
   * - Access code must be exactly 12 characters (A-HJ-NP-Z2-9)
   * - Assignment must exist and be active
   * - Assignment must not be SUBMITTED or DELEGATED (terminal states)
   * - Assignment must not be past due date
   * - Creates 8-hour session with 1-hour idle timeout
   */
  validateAccessCode: publicProcedure
    .input(z.object({ accessCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      log('[validateAccessCode] START - Access code: ' + input.accessCode);
      
      // Validate access code format
      if (!isValidAccessCodeFormat(input.accessCode)) {
        log('[validateAccessCode] FAILED - Invalid format');
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid access code format. Access codes must be exactly 12 characters (A-Z, 2-9, excluding O/0/I/1/L).',
        });
      }
      log('[validateAccessCode] Format validation passed');
      
      const db = await getDb();
      if (!db) {
        log('[validateAccessCode] FAILED - Database not available');
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      }
      log('[validateAccessCode] Database connection OK');
      
      // Find assignment by access code with joins
      const assignments = await db
        .select({
          assignment: partnerQuestionnaires,
          partner: partners,
          touchpointQuestionnaire: touchpointQuestionnaires,
          questionnaire: questionnaires,
          touchpoint: touchpoints,
        })
        .from(partnerQuestionnaires)
        .leftJoin(partners, eq(partnerQuestionnaires.partnerId, partners.id))
        .leftJoin(touchpointQuestionnaires, eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id))
        .leftJoin(questionnaires, eq(touchpointQuestionnaires.questionnaireId, questionnaires.id))
        .leftJoin(touchpoints, eq(touchpointQuestionnaires.touchpointId, touchpoints.id))
        .where(eq(partnerQuestionnaires.accessCode, input.accessCode))
        .limit(1);
      
      const result = assignments[0];
      log('[validateAccessCode] Query result: ' + (result ? 'Found' : 'Not found'));
      
      if (!result || !result.assignment) {
        log('[validateAccessCode] FAILED - Assignment not found');
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid access code. Please check your invitation email and try again.',
        });
      }
      log('[validateAccessCode] Assignment found, ID: ' + result.assignment.id);
      
      const assignment = result.assignment;
      
      // Check assignment status
      const TERMINAL_STATUSES = [8, 11]; // SUBMITTED=8, DELEGATED=11
      if (TERMINAL_STATUSES.includes(assignment.status)) {
        const statusMessage = assignment.status === 8
          ? 'This questionnaire has already been submitted.'
          : 'This questionnaire has been delegated to another contact.';
        
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: statusMessage,
        });
      }
      
      // Check due date
      if (assignment.dueDate && new Date(assignment.dueDate) < new Date()) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This questionnaire is past its due date. Please contact your procurement team for an extension.',
        });
      }
      
      // Update assignment status to IN_PROGRESS (7) if currently INVITED (6)
      if (assignment.status === 6) {
        await db.update(partnerQuestionnaires)
          .set({ status: 7 }) // IN_PROGRESS
          .where(eq(partnerQuestionnaires.id, assignment.id));
      }
      
      // Create supplier session
      log('[validateAccessCode] Creating session...');
      const session = createSupplierSession({
        assignmentId: assignment.id,
        accessCode: input.accessCode,
        partnerId: assignment.partnerId,
      });
      log('[validateAccessCode] Session created: ' + JSON.stringify(session));
      
      // Set session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      log('[validateAccessCode] Cookie options: ' + JSON.stringify(cookieOptions));
      ctx.res.cookie(SUPPLIER_SESSION_COOKIE_NAME, JSON.stringify(session), {
        ...cookieOptions,
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
      });
      log('[validateAccessCode] Cookie set successfully');
      
      log('[validateAccessCode] SUCCESS - Returning response');
      return {
        success: true,
        sessionToken: JSON.stringify(session), // Return session for client-side storage
        assignment: {
          id: assignment.id,
          partnerId: assignment.partnerId,
          partnerName: result.partner?.name || 'Unknown Partner',
          questionnaireName: result.questionnaire?.title || 'Questionnaire',
          touchpointName: result.touchpoint?.title || 'Touchpoint',
          dueDate: assignment.dueDate,
          progress: assignment.progress || 0,
        },
      };
    }),
  
  /**
   * Get current supplier session info
   * 
   * Validates session is still active (not expired, not idle)
   * Updates last activity timestamp
   */
  getSession: publicProcedure
    .query(async ({ ctx }) => {
      log('[getSession] START - Checking session');
      log('[getSession] Authorization header: ' + (ctx.req.headers.authorization || 'NONE'));
      log('[getSession] Cookies: ' + JSON.stringify(ctx.req.cookies));
      
      let sessionCookie = ctx.req.cookies?.[SUPPLIER_SESSION_COOKIE_NAME];
      log('[getSession] Cookie value: ' + (sessionCookie || 'NONE'));
      
      // Fallback: check Authorization header for localStorage-based session
      if (!sessionCookie) {
        log('[getSession] No cookie, checking Authorization header');
        const authHeader = ctx.req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          sessionCookie = authHeader.substring(7);
          log('[getSession] Session extracted from Authorization header, length: ' + sessionCookie.length);
        }
      }
      
      if (!sessionCookie) {
        log('[getSession] No session found, returning unauthenticated');
        return { authenticated: false };
      }
      
      log('[getSession] Session cookie found, attempting to parse...');
      
      try {
        const session: SupplierSession = JSON.parse(sessionCookie);
        log('[getSession] Session parsed: ' + JSON.stringify(session));
        
        // Validate session (throws if expired or idle)
        log('[getSession] Validating session...');
        validateSupplierSession(session);
        log('[getSession] Session validation passed');
        
        // Update activity timestamp
        const updatedSession = updateSessionActivity(session);
        
        // Update cookie with new activity timestamp (if cookie method exists)
        if (typeof ctx.res.cookie === 'function') {
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(SUPPLIER_SESSION_COOKIE_NAME, JSON.stringify(updatedSession), {
            ...cookieOptions,
            maxAge: 8 * 60 * 60 * 1000,
          });
        } else {
          log('[getSession] WARNING: ctx.res.cookie is not available, cannot update cookie');
        }
        
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        }
        
        // Get assignment details with joins
        const assignments = await db
          .select({
            assignment: partnerQuestionnaires,
            partner: partners,
            touchpointQuestionnaire: touchpointQuestionnaires,
            questionnaire: questionnaires,
            touchpoint: touchpoints,
          })
          .from(partnerQuestionnaires)
          .leftJoin(partners, eq(partnerQuestionnaires.partnerId, partners.id))
          .leftJoin(touchpointQuestionnaires, eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id))
          .leftJoin(questionnaires, eq(touchpointQuestionnaires.questionnaireId, questionnaires.id))
          .leftJoin(touchpoints, eq(touchpointQuestionnaires.touchpointId, touchpoints.id))
          .where(eq(partnerQuestionnaires.id, session.assignmentId))
          .limit(1);
        
        const result = assignments[0];
        
        if (!result || !result.assignment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Assignment not found' });
        }
        
        return {
          authenticated: true,
          assignment: {
            id: result.assignment.id,
            partnerId: result.assignment.partnerId,
            partnerName: result.partner?.name || 'Unknown Partner',
            questionnaireName: result.questionnaire?.title || 'Questionnaire',
            touchpointName: result.touchpoint?.title || 'Touchpoint',
            dueDate: result.assignment.dueDate,
            progress: result.assignment.progress || 0,
          },
        };
      } catch (error) {
        log('[getSession] ERROR: ' + (error instanceof Error ? error.message : String(error)));
        // Clear invalid session cookie
        if (ctx.res.clearCookie) {
          ctx.res.clearCookie(SUPPLIER_SESSION_COOKIE_NAME);
        }
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        return { authenticated: false };
      }
    }),
  
  /**
   * Get questionnaire with all questions and response options
   * 
   * Requires valid supplier session
   * Returns questionnaire metadata + all questions with responses
   */
  getQuestionnaire: publicProcedure
    .query(async ({ ctx }) => {
      log('[getQuestionnaire] START');
      let sessionCookie = ctx.req.cookies?.[SUPPLIER_SESSION_COOKIE_NAME];
      
      // Fallback: check Authorization header for localStorage-based session
      if (!sessionCookie) {
        const authHeader = ctx.req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          sessionCookie = authHeader.substring(7);
        }
      }
      
      if (!sessionCookie) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No active session' });
      }
      
      let session: SupplierSession;
      try {
        session = JSON.parse(sessionCookie);
      } catch {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid session' });
      }
      
      // Validate session (throws if expired or idle)
      try {
        validateSupplierSession(session);
      } catch (error) {
        ctx.res.clearCookie(SUPPLIER_SESSION_COOKIE_NAME);
        throw error;
      }
      
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      }
      
      // Get assignment with questionnaire info
      const assignments = await db
        .select({
          assignment: partnerQuestionnaires,
          touchpointQuestionnaire: touchpointQuestionnaires,
          questionnaire: questionnaires,
        })
        .from(partnerQuestionnaires)
        .leftJoin(touchpointQuestionnaires, eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id))
        .leftJoin(questionnaires, eq(touchpointQuestionnaires.questionnaireId, questionnaires.id))
        .where(eq(partnerQuestionnaires.id, session.assignmentId))
        .limit(1);
      
      const result = assignments[0];
      if (!result || !result.questionnaire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Questionnaire not found' });
      }
      
      // Get all questions for this questionnaire with their response options
      const { questions: questionsTable, responses: responsesTable } = await import('../../drizzle/schema');
      
      const allQuestions = await db
        .select()
        .from(questionsTable)
        .where(eq(questionsTable.questionnaireId, result.questionnaire.id))
        .orderBy(questionsTable.sortOrder);
      
      // Get all response options for all questions
      const { inArray } = await import('drizzle-orm');
      const questionIds = allQuestions.map(q => q.id).filter((id): id is number => id !== null);
      const allResponses = questionIds.length > 0
        ? await db
            .select()
            .from(responsesTable)
            .where(inArray(responsesTable.questionId, questionIds))
        : [];
      
      // Group response options by questionId
      const responsesByQuestion = new Map<number, typeof allResponses>();
      for (const response of allResponses) {
        const qid = response.questionId;
        if (qid !== null) {
          if (!responsesByQuestion.has(qid)) {
            responsesByQuestion.set(qid, []);
          }
          responsesByQuestion.get(qid)!.push(response);
        }
      }
      
      // Get saved responses for this assignment
      const { questionnaireResponses: savedResponsesTable } = await import('../../drizzle/schema');
      const savedResponses = await db
        .select()
        .from(savedResponsesTable)
        .where(eq(savedResponsesTable.partnerQuestionnaireId, session.assignmentId));
      
      // Group saved responses by questionId
      const savedResponsesByQuestion = new Map<number, typeof savedResponses[0]>();
      for (const response of savedResponses) {
        savedResponsesByQuestion.set(response.questionId, response);
      }
      
      return {
        questionnaire: result.questionnaire,
        assignment: result.assignment,
        questions: allQuestions.map(q => ({
          ...q,
          responseOptions: responsesByQuestion.get(q.id) || [],
        })),
        savedResponses: savedResponsesByQuestion,
      };
    }),
  
  /**
   * Save individual response (auto-save)
   * 
   * Requires valid supplier session
   * Upserts response for a single question
   */
  saveResponse: publicProcedure
    .input(z.object({
      questionId: z.number(),
      value: z.any(), // Can be string, number, array, etc.
    }))
    .mutation(async ({ ctx, input }) => {
      // Get session from cookie or Authorization header
      let sessionCookie = ctx.req.cookies?.[SUPPLIER_SESSION_COOKIE_NAME];
      
      if (!sessionCookie) {
        const authHeader = ctx.req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          sessionCookie = authHeader.substring(7);
        }
      }
      
      if (!sessionCookie) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No active session' });
      }
      
      let session: SupplierSession;
      try {
        session = JSON.parse(sessionCookie);
      } catch {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid session' });
      }
      
      // Validate session
      try {
        validateSupplierSession(session);
      } catch (error) {
        ctx.res.clearCookie(SUPPLIER_SESSION_COOKIE_NAME);
        throw error;
      }
      
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      }
      
      const { questionnaireResponses } = await import('../../drizzle/schema');
      
      // Check if response already exists
      const existing = await db
        .select()
        .from(questionnaireResponses)
        .where(
          and(
            eq(questionnaireResponses.partnerQuestionnaireId, session.assignmentId),
            eq(questionnaireResponses.questionId, input.questionId)
          )
        )
        .limit(1);
      
      // Prepare value data (common for insert and update)
      const valueData: any = {
        timestamp: new Date(),
      };
      
      // Store value based on type
      if (typeof input.value === 'number') {
        valueData.value = input.value;
        valueData.responseId = input.value; // For dropdown selections
      } else if (typeof input.value === 'string') {
        valueData.comment = input.value;
      } else if (Array.isArray(input.value)) {
        // For checkbox/multi-select, store as comma-separated IDs in comment
        valueData.comment = input.value.join(',');
      }
      
      if (existing.length > 0) {
        // Update existing response (only update value fields, not IDs)
        await db
          .update(questionnaireResponses)
          .set(valueData)
          .where(eq(questionnaireResponses.id, existing[0].id));
      } else {
        // Insert new response (include IDs)
        const insertData: any = {
          partnerQuestionnaireId: session.assignmentId,
          questionId: input.questionId,
          timestamp: valueData.timestamp,
        };
        
        if (valueData.value !== undefined) insertData.value = valueData.value;
        if (valueData.responseId !== undefined) insertData.responseId = valueData.responseId;
        if (valueData.comment !== undefined) insertData.comment = valueData.comment;
        
        await db.insert(questionnaireResponses).values(insertData);
      }
      
      return { success: true };
    }),
  
  /**
   * Submit questionnaire responses
   * 
   * Requires valid supplier session
   * Saves all responses and marks assignment as SUBMITTED
   */
  submitQuestionnaire: publicProcedure
    .input(z.object({
      responses: z.record(z.string(), z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get session from cookie or Authorization header
      let sessionCookie = ctx.req.cookies?.[SUPPLIER_SESSION_COOKIE_NAME];
      
      if (!sessionCookie) {
        const authHeader = ctx.req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          sessionCookie = authHeader.substring(7);
        }
      }
      
      if (!sessionCookie) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No active session' });
      }
      
      let session: SupplierSession;
      try {
        session = JSON.parse(sessionCookie);
      } catch {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid session' });
      }
      
      // Validate session
      try {
        validateSupplierSession(session);
      } catch (error) {
        ctx.res.clearCookie(SUPPLIER_SESSION_COOKIE_NAME);
        throw error;
      }
      
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      }
      
      // Get assignment details for emails
      const assignment = await db
        .select()
        .from(partnerQuestionnaires)
        .where(eq(partnerQuestionnaires.id, session.assignmentId))
        .limit(1);
      
      if (!assignment || assignment.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Assignment not found' });
      }
      
      // Get partner details
      const partner = await db
        .select()
        .from(partners)
        .where(eq(partners.id, session.partnerId))
        .limit(1);
      
      // Get touchpoint questionnaire to find questionnaire ID
      const touchpointQuestionnaire = await db
        .select()
        .from(touchpointQuestionnaires)
        .where(eq(touchpointQuestionnaires.id, assignment[0].touchpointQuestionnaireId))
        .limit(1);
      
      // Get questionnaire details
      let questionnaire: any[] = [];
      if (touchpointQuestionnaire && touchpointQuestionnaire.length > 0 && touchpointQuestionnaire[0].questionnaireId) {
        questionnaire = await db
          .select()
          .from(questionnaires)
          .where(eq(questionnaires.id, touchpointQuestionnaire[0].questionnaireId))
          .limit(1);
      }
      
      // Update assignment status to SUBMITTED
      const completedDate = new Date();
      await db
        .update(partnerQuestionnaires)
        .set({
          status: 8, // SUBMITTED
          completedDate,
          progress: 100,
        })
        .where(eq(partnerQuestionnaires.id, session.assignmentId));
      
      const partnerName = (partner && partner.length > 0 ? partner[0].name : null) || 'Supplier';
      const questionnaireName = (questionnaire && questionnaire.length > 0 ? questionnaire[0].title : null) || 'Questionnaire';
      const confirmationNumber = `${session.assignmentId}-${Date.now()}`;
      const submittedDate = completedDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Send confirmation email to supplier
      if (partner && partner.length > 0 && partner[0].email) {
        await sendEmail({
          to: partner[0].email,
          subject: `Questionnaire Submitted Successfully - ${questionnaireName}`,
          html: getSupplierConfirmationEmailTemplate({
            partnerName,
            questionnaireName,
            submittedDate,
            confirmationNumber,
          }),
        });
      }
      
      // Send alert email to procurement team (owner)
      const dashboardUrl = 'https://app.manus.space/admin/assignments';
      await sendEmail({
        to: process.env.OWNER_NAME || 'admin@intelleges.com',
        subject: `New Questionnaire Submission - ${partnerName}`,
        html: getProcurementAlertEmailTemplate({
          partnerName,
          questionnaireName,
          submittedDate,
          confirmationNumber,
          totalQuestions: 82, // TODO: Get actual count from questions table
          dashboardUrl,
        }),
      });
      
      // Clear session after successful submission
      ctx.res.clearCookie(SUPPLIER_SESSION_COOKIE_NAME, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: -1,
      });
      
      return { success: true, confirmationNumber };
    }),
  
  /**
   * Submit questionnaire with e-signature
   * 
   * Requires valid supplier session
   * Records e-signature data and marks assignment as SUBMITTED
   */
  submitWithSignature: publicProcedure
    .input(z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      acknowledged: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get session from cookie
      const sessionCookie = ctx.req.cookies?.[SUPPLIER_SESSION_COOKIE_NAME];
      if (!sessionCookie) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No active session' });
      }
      
      let session: SupplierSession;
      try {
        session = JSON.parse(sessionCookie);
      } catch {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid session' });
      }
      
      validateSupplierSession(session);
      
      if (!input.acknowledged) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Attestation must be acknowledged' });
      }
      
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      }
      
      // Get assignment details
      const assignment = await db
        .select()
        .from(partnerQuestionnaires)
        .where(eq(partnerQuestionnaires.id, session.assignmentId))
        .limit(1);
      
      if (!assignment || assignment.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Assignment not found' });
      }
      
      // Get partner details
      const partner = await db
        .select()
        .from(partners)
        .where(eq(partners.id, session.partnerId))
        .limit(1);
      
      // Get touchpoint questionnaire to find questionnaire ID
      const touchpointQuestionnaire = await db
        .select()
        .from(touchpointQuestionnaires)
        .where(eq(touchpointQuestionnaires.id, assignment[0].touchpointQuestionnaireId))
        .limit(1);
      
      // Get questionnaire details
      let questionnaire: any[] = [];
      if (touchpointQuestionnaire && touchpointQuestionnaire.length > 0 && touchpointQuestionnaire[0].questionnaireId) {
        questionnaire = await db
          .select()
          .from(questionnaires)
          .where(eq(questionnaires.id, touchpointQuestionnaire[0].questionnaireId))
          .limit(1);
      }
      
      // Update assignment status to SUBMITTED with e-signature data
      const completedDate = new Date();
      const ipAddress = ctx.req.ip || ctx.req.headers['x-forwarded-for'] || 'unknown';
      
      await db
        .update(partnerQuestionnaires)
        .set({
          status: 8, // SUBMITTED
          completedDate,
          progress: 100,
          // Store e-signature metadata in eSignature field
          eSignature: JSON.stringify({
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            timestamp: completedDate.toISOString(),
            ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress[0],
          }),
        })
        .where(eq(partnerQuestionnaires.id, session.assignmentId));
      
      const partnerName = (partner && partner.length > 0 ? partner[0].name : null) || 'Supplier';
      const questionnaireName = (questionnaire && questionnaire.length > 0 ? questionnaire[0].title : null) || 'Questionnaire';
      const confirmationNumber = `${session.assignmentId}-${Date.now()}`;
      const submittedDate = completedDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Send confirmation email to supplier
      if (input.email) {
        await sendEmail({
          to: input.email,
          subject: `Questionnaire Submitted Successfully - ${questionnaireName}`,
          html: getSupplierConfirmationEmailTemplate({
            partnerName,
            questionnaireName,
            submittedDate,
            confirmationNumber,
          }),
        });
      }
      
      // Send alert email to procurement team (owner)
      const dashboardUrl = 'https://app.manus.space/admin/assignments';
      await sendEmail({
        to: ENV.ownerName || 'admin@intelleges.com',
        subject: `New Questionnaire Submission - ${partnerName}`,
        html: getProcurementAlertEmailTemplate({
          partnerName,
          questionnaireName,
          submittedDate,
          confirmationNumber,
          totalQuestions: 82,
          dashboardUrl,
        }),
      });
      
      // Clear session after successful submission
      ctx.res.clearCookie(SUPPLIER_SESSION_COOKIE_NAME, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: -1,
      });
      
      return { success: true, confirmationNumber };
    }),
  
  /**
   * Get submission receipt PDF
   * 
   * Requires valid supplier session or assignment ID
   */
  getSubmissionReceipt: publicProcedure
    .input(z.object({
      assignmentId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      }
      
      let assignmentId: number;
      
      // If assignmentId is provided, use it directly
      if (input.assignmentId) {
        assignmentId = input.assignmentId;
      } else {
        // Otherwise, get from session
        const sessionCookie = ctx.req.cookies?.[SUPPLIER_SESSION_COOKIE_NAME];
        if (!sessionCookie) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No active session' });
        }
        
        let session: SupplierSession;
        try {
          session = JSON.parse(sessionCookie);
        } catch {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid session' });
        }
        
        validateSupplierSession(session);
        assignmentId = session.assignmentId;
      }
      
      // Generate PDF
      const { generateSubmissionReceipt } = await import('../services/pdf-generator');
      const pdfBuffer = await generateSubmissionReceipt(assignmentId);
      
      // Convert to base64 for transmission
      const pdfBase64 = pdfBuffer.toString('base64');
      
      return {
        success: true,
        pdf: pdfBase64,
        filename: `submission-receipt-${assignmentId}.pdf`,
      };
    }),
  
  /**
   * Update company information
   */
  updateCompanyInfo: publicProcedure
    .input(z.object({
      companyName: z.string(),
      addressLine1: z.string(),
      addressLine2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get session from cookie
      const sessionCookie = ctx.req.cookies?.[SUPPLIER_SESSION_COOKIE_NAME];
      if (!sessionCookie) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No active session' });
      }
      
      let session: SupplierSession;
      try {
        session = JSON.parse(sessionCookie);
      } catch {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid session' });
      }
      
      validateSupplierSession(session);
      
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      }
      
      // Update partner record
      await db.update(partners)
        .set({
          name: input.companyName,
          address1: input.addressLine1,
          address2: input.addressLine2 || null,
          city: input.city,
          state: input.state,
          zipcode: input.postalCode,
          countryCode: input.country,
          updatedAt: new Date(),
        })
        .where(eq(partners.id, session.partnerId));
      
      return { success: true };
    }),
  
  /**
   * Confirm company information without changes
   */
  confirmCompanyInfo: publicProcedure
    .mutation(async ({ ctx }) => {
      // Just validate session and proceed
      const sessionCookie = ctx.req.cookies?.[SUPPLIER_SESSION_COOKIE_NAME];
      if (!sessionCookie) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No active session' });
      }
      
      let session: SupplierSession;
      try {
        session = JSON.parse(sessionCookie);
      } catch {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid session' });
      }
      
      validateSupplierSession(session);
      
      return { success: true };
    }),
  
  /**
   * Update contact information
   */
  updateContactInfo: publicProcedure
    .input(z.object({
      firstName: z.string(),
      lastName: z.string(),
      jobTitle: z.string(),
      email: z.string().email(),
      phone: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get session from cookie
      const sessionCookie = ctx.req.cookies?.[SUPPLIER_SESSION_COOKIE_NAME];
      if (!sessionCookie) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No active session' });
      }
      
      let session: SupplierSession;
      try {
        session = JSON.parse(sessionCookie);
      } catch {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid session' });
      }
      
      validateSupplierSession(session);
      
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      }
      
      // Update partner contact information
      await db.update(partners)
        .set({
          firstName: input.firstName,
          lastName: input.lastName,
          title: input.jobTitle,
          email: input.email,
          phone: input.phone,
          updatedAt: new Date(),
        })
        .where(eq(partners.id, session.partnerId));
      
      return { success: true };
    }),
  
  /**
   * Confirm contact information without changes
   */
  confirmContactInfo: publicProcedure
    .mutation(async ({ ctx }) => {
      // Just validate session and proceed
      const sessionCookie = ctx.req.cookies?.[SUPPLIER_SESSION_COOKIE_NAME];
      if (!sessionCookie) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No active session' });
      }
      
      let session: SupplierSession;
      try {
        session = JSON.parse(sessionCookie);
      } catch {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid session' });
      }
      
      validateSupplierSession(session);
      
      return { success: true };
    }),
  
  /**
   * Get CMS content for supplier portal
   * 
   * Returns all CMS content for the specified language
   * Falls back to English if content not found
   */
  getCMSContent: publicProcedure
    .input(z.object({
      languageCode: z.string().default('en'),
    }))
    .query(async ({ input }) => {
      const { getCMSContent } = await import('../db-cms');
      const content = await getCMSContent(input.languageCode);
      return content;
    }),
  
  /**
   * Logout supplier (clear session)
   */
  logout: publicProcedure
    .mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(SUPPLIER_SESSION_COOKIE_NAME, {
        ...cookieOptions,
        maxAge: -1,
      });
      
      return { success: true };
    }),
});
