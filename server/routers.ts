import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { communicationRouter } from "./routers/communication";
import { dashboardRouter } from "./routers/dashboard";
import { approvalRouter } from "./routers/approval";
import { auditRouter } from "./routers/audit";
import { touchpointRouter } from "./routers/touchpoint";
import { supplierRouter } from './routers/supplier';
import { partnerSearchRouter } from './routers/partner-search';
import { questionnaireBuilderRouter } from './routers/questionnaire-builder';
import { partnerBatchRouter } from './routers/partner-batch';
import { userBatchRouter } from './routers/user-batch';
import { assignmentBatchRouter } from './routers/assignment-batch';
import { cmsBatchRouter } from './routers/cms-batch';
import { amsBatchRouter } from './routers/ams-batch';
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import * as partnerAuth from "./db-partner-auth";
import { 
  getDb,
  getUsersByEnterprise,
  getAllEnterprises,
  getEnterpriseById,
  getPartnersByEnterprise,
  getPartnerById,
  getProtocolsByEnterprise,
  getProtocolById,
  getTouchpointsByProtocol,
  getTouchpointById,
  getAllTouchpoints,
  createTouchpoint,
  updateTouchpoint,
  archiveTouchpoint,
  getQuestionnairesByEnterprise,
  getQuestionnaireById,
  getGroupsByEnterprise,
  getGroupById,
  getRolesByEnterprise,
  validateEnterpriseAccess
} from "./db";
import { enterprises, partners, protocols, touchpoints, questionnaires, groups } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * RBAC Middleware for Federal Compliance Platform
 * 
 * Role Hierarchy:
 * - admin (Super Admin): Full access to all enterprises
 * - enterprise_owner: Full access to their enterprise
 * - compliance_officer: Manage protocols, touchpoints, questionnaires
 * - procurement_team: Manage partners, send invitations
 * - supplier: External users (read-only access to assigned questionnaires)
 * - user: Default role
 */

/**
 * Admin-only procedure (Super Admin)
 */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Admin access required'
    });
  }
  return next({ ctx });
});

/**
 * Enterprise-scoped procedure
 * Validates user has access to their enterprise data
 */
const enterpriseProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role === 'admin') {
    // Super admins can access all enterprises
    return next({ ctx });
  }
  
  if (!ctx.user.enterpriseId) {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'No enterprise assigned to user'
    });
  }
  
  return next({ 
    ctx: {
      ...ctx,
      enterpriseId: ctx.user.enterpriseId
    }
  });
});

/**
 * Enterprise owner procedure
 */
const enterpriseOwnerProcedure = enterpriseProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'enterprise_owner') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Enterprise owner access required'
    });
  }
  return next({ ctx });
});

/**
 * Compliance officer procedure (can manage protocols/questionnaires)
 */
const complianceOfficerProcedure = enterpriseProcedure.use(({ ctx, next }) => {
  const allowedRoles = ['admin', 'enterprise_owner', 'compliance_officer'];
  if (!allowedRoles.includes(ctx.user.role)) {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Compliance officer access required'
    });
  }
  return next({ ctx });
});

/**
 * Procurement team procedure (can manage partners)
 */
const procurementProcedure = enterpriseProcedure.use(({ ctx, next }) => {
  const allowedRoles = ['admin', 'enterprise_owner', 'compliance_officer', 'procurement_team'];
  if (!allowedRoles.includes(ctx.user.role)) {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Procurement team access required'
    });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  audit: auditRouter,
  touchpoint: touchpointRouter,
  supplier: supplierRouter,
  partnerSearch: partnerSearchRouter,
  questionnaireBuilder: questionnaireBuilderRouter,
  partnerBatch: partnerBatchRouter,
  userBatch: userBatchRouter,
  assignmentBatch: assignmentBatchRouter,
  cmsBatch: cmsBatchRouter,
  amsBatch: amsBatchRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================================================
  // ENTERPRISE MANAGEMENT (Admin & Enterprise Owner)
  // ============================================================================
  
  enterprises: router({
    list: adminProcedure.query(async () => {
      return await getAllEnterprises();
    }),
    
    get: enterpriseProcedure.input(z.object({ id: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      const enterpriseId = input?.id || ctx.user.enterpriseId;
      if (!enterpriseId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Enterprise ID required' });
      }
      
      // Validate access
      if (ctx.user.role !== 'admin' && ctx.user.enterpriseId !== enterpriseId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }
      
      return await getEnterpriseById(enterpriseId);
    }),
    
    create: adminProcedure.input(z.object({
      description: z.string(),
      companyName: z.string().optional(),
      instanceName: z.string().optional(),
    })).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      
      const [result] = await database.insert(enterprises).values({
        description: input.description,
        companyName: input.companyName,
        instanceName: input.instanceName,
        active: true,
      });
      
      return { id: Number(result.insertId) };
    }),
    
    update: enterpriseOwnerProcedure.input(z.object({
      id: z.number(),
      description: z.string(),
      companyName: z.string().optional(),
      instanceName: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      
      // Validate access
      if (ctx.user.role !== 'admin' && ctx.user.enterpriseId !== input.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }
      
      await database
        .update(enterprises)
        .set({
          description: input.description,
          companyName: input.companyName,
          instanceName: input.instanceName,
          updatedAt: new Date(),
        })
        .where(eq(enterprises.id, input.id));
      
      return { success: true };
    }),
    
    archive: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      
      await database
        .update(enterprises)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(enterprises.id, input.id));
      
      return { success: true };
    }),
  }),

  // ============================================================================
  // PARTNER (SUPPLIER) MANAGEMENT
  // ============================================================================
  
  partners: router({
    list: procurementProcedure.input(z.object({ enterpriseId: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      const enterpriseId = ctx.user.role === 'admin' 
        ? input?.enterpriseId 
        : ctx.user.enterpriseId;
        
      if (!enterpriseId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Enterprise ID required' });
      }
      
      return await getPartnersByEnterprise(enterpriseId);
    }),
    
    get: procurementProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      const partner = await getPartnerById(input.id);
      if (!partner) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Partner not found' });
      }
      
      // Validate access
      if (ctx.user.role !== 'admin' && partner.enterpriseId !== ctx.user.enterpriseId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }
      
      return partner;
    }),
    
    create: procurementProcedure.input(z.object({
      enterpriseId: z.number().optional(),
      name: z.string(),
      email: z.string().email().optional(),
      internalId: z.string().optional(),
      dunsNumber: z.string().optional(),
      federalId: z.string().optional(),
      address1: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipcode: z.string().optional(),
      countryCode: z.string().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      title: z.string().optional(),
      phone: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      
      const enterpriseId = ctx.user.role === 'admin' 
        ? input.enterpriseId 
        : ctx.user.enterpriseId;
        
      if (!enterpriseId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Enterprise ID required' });
      }
      
      const [result] = await database.insert(partners).values({
        enterpriseId,
        name: input.name,
        email: input.email,
        internalId: input.internalId,
        dunsNumber: input.dunsNumber,
        federalId: input.federalId,
        address1: input.address1,
        city: input.city,
        state: input.state,
        zipcode: input.zipcode,
        countryCode: input.countryCode,
        firstName: input.firstName,
        lastName: input.lastName,
        title: input.title,
        phone: input.phone,
        active: true,
      });
      
      return { id: Number(result.insertId) };
    }),
    
    update: procurementProcedure.input(z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().email().optional(),
      internalId: z.string().optional(),
      dunsNumber: z.string().optional(),
      federalId: z.string().optional(),
      address1: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipcode: z.string().optional(),
      countryCode: z.string().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      title: z.string().optional(),
      phone: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      
      // Validate access
      const partner = await getPartnerById(input.id);
      if (!partner) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Partner not found' });
      }
      
      if (ctx.user.role !== 'admin' && partner.enterpriseId !== ctx.user.enterpriseId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }
      
      await database
        .update(partners)
        .set({
          name: input.name,
          email: input.email,
          internalId: input.internalId,
          dunsNumber: input.dunsNumber,
          federalId: input.federalId,
          address1: input.address1,
          city: input.city,
          state: input.state,
          zipcode: input.zipcode,
          countryCode: input.countryCode,
          firstName: input.firstName,
          lastName: input.lastName,
          title: input.title,
          phone: input.phone,
          updatedAt: new Date(),
        })
        .where(eq(partners.id, input.id));
      
      return { success: true };
    }),
    
    archive: procurementProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      
      // Validate access
      const partner = await getPartnerById(input.id);
      if (!partner) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Partner not found' });
      }
      
      if (ctx.user.role !== 'admin' && partner.enterpriseId !== ctx.user.enterpriseId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }
      
      await database
        .update(partners)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(partners.id, input.id));
      
      return { success: true };
    }),
  }),

  // ============================================================================
  // PROTOCOL (COMPLIANCE CAMPAIGN) MANAGEMENT
  // ============================================================================
  
  protocols: router({
    list: complianceOfficerProcedure.input(z.object({ enterpriseId: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      const enterpriseId = ctx.user.role === 'admin' 
        ? input?.enterpriseId 
        : ctx.user.enterpriseId;
        
      if (!enterpriseId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Enterprise ID required' });
      }
      
      return await getProtocolsByEnterprise(enterpriseId);
    }),
    
    get: complianceOfficerProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      const protocol = await getProtocolById(input.id);
      if (!protocol) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Protocol not found' });
      }
      
      // Validate access
      if (ctx.user.role !== 'admin' && protocol.enterpriseId !== ctx.user.enterpriseId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }
      
      return protocol;
    }),
    
    create: complianceOfficerProcedure.input(z.object({
      enterpriseId: z.number().optional(),
      name: z.string(),
      description: z.string().optional(),
      abbreviation: z.string().optional(),
      purpose: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      
      const enterpriseId = ctx.user.role === 'admin' 
        ? input.enterpriseId 
        : ctx.user.enterpriseId;
        
      if (!enterpriseId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Enterprise ID required' });
      }
      
      const [result] = await database.insert(protocols).values({
        enterpriseId,
        name: input.name,
        description: input.description,
        abbreviation: input.abbreviation,
        purpose: input.purpose,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        active: true,
      });
      
      return { id: Number(result.insertId) };
    }),
    
    update: complianceOfficerProcedure.input(z.object({
      id: z.number(),
      name: z.string(),
      description: z.string().optional(),
      abbreviation: z.string().optional(),
      purpose: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      
      // Validate access
      const protocol = await getProtocolById(input.id);
      if (!protocol) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Protocol not found' });
      }
      
      if (ctx.user.role !== 'admin' && protocol.enterpriseId !== ctx.user.enterpriseId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }
      
      await database
        .update(protocols)
        .set({
          name: input.name,
          description: input.description,
          abbreviation: input.abbreviation,
          purpose: input.purpose,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(protocols.id, input.id));
      
      return { success: true };
    }),
    
    archive: complianceOfficerProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      
      // Validate access
      const protocol = await getProtocolById(input.id);
      if (!protocol) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Protocol not found' });
      }
      
      if (ctx.user.role !== 'admin' && protocol.enterpriseId !== ctx.user.enterpriseId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }
      
      await database
        .update(protocols)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(protocols.id, input.id));
      
      return { success: true };
    }),
  }),

  // ============================================================================
  // TOUCHPOINT (SUPPLIER INTERACTION) MANAGEMENT
  // ============================================================================
  
  touchpoints: router({
    list: complianceOfficerProcedure.input(z.object({ enterpriseId: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      const enterpriseId = ctx.user.role === 'admin' 
        ? input?.enterpriseId 
        : (ctx.user.enterpriseId ?? undefined);
      return await getAllTouchpoints(enterpriseId);
    }),
    
    listByProtocol: complianceOfficerProcedure.input(z.object({ protocolId: z.number() })).query(async ({ input }) => {
      return await getTouchpointsByProtocol(input.protocolId);
    }),
    
    get: complianceOfficerProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const touchpoint = await getTouchpointById(input.id);
      if (!touchpoint) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Touchpoint not found' });
      }
      return touchpoint;
    }),
    
    create: complianceOfficerProcedure.input(z.object({
      protocolId: z.number(),
      title: z.string(),
      description: z.string().optional(),
      abbreviation: z.string().optional(),
      purpose: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      target: z.number().optional(),
      automaticReminder: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      return await createTouchpoint(input);
    }),
    
    update: complianceOfficerProcedure.input(z.object({
      id: z.number(),
      protocolId: z.number().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      abbreviation: z.string().optional(),
      purpose: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      target: z.number().optional(),
      automaticReminder: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      return await updateTouchpoint(input.id, input);
    }),
    
    archive: complianceOfficerProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      return await archiveTouchpoint(input.id);
    }),
  }),

  // ============================================================================
  // QUESTIONNAIRE MANAGEMENT
  // ============================================================================
  
  questionnaires: router({
    list: complianceOfficerProcedure.input(z.object({ enterpriseId: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      const enterpriseId = ctx.user.role === 'admin' 
        ? input?.enterpriseId 
        : ctx.user.enterpriseId;
        
      if (!enterpriseId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Enterprise ID required' });
      }
      
      return await getQuestionnairesByEnterprise(enterpriseId);
    }),
    
    get: complianceOfficerProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      const questionnaire = await getQuestionnaireById(input.id);
      if (!questionnaire) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Questionnaire not found' });
      }
      
      // Validate access
      if (ctx.user.role !== 'admin' && questionnaire.enterpriseId !== ctx.user.enterpriseId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }
      
      return questionnaire;
    }),
  }),

  // ============================================================================
  // GROUP MANAGEMENT
  // ============================================================================
  
  groups: router({
    list: enterpriseProcedure.input(z.object({ enterpriseId: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      const enterpriseId = ctx.user.role === 'admin' 
        ? input?.enterpriseId 
        : ctx.user.enterpriseId;
        
      if (!enterpriseId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Enterprise ID required' });
      }
      
      return await getGroupsByEnterprise(enterpriseId);
    }),
  }),

  // ============================================================================
  // PARTNER AUTHENTICATION (No OAuth - Access Code + Email Verification)
  // ============================================================================
  
  partner: router({
    /**
     * Step 1: Validate access code and return partner email
     */
    validateAccessCode: publicProcedure
      .input(z.object({ accessCode: z.string() }))
      .mutation(async ({ input }) => {
        const accessCodeData = await partnerAuth.validatePartnerAccessCode(input.accessCode);
        
        if (!accessCodeData) {
          throw new TRPCError({ 
            code: 'NOT_FOUND', 
            message: 'Invalid access code. Please check your invitation email.' 
          });
        }
        
        if (accessCodeData.expiresAt && accessCodeData.expiresAt < new Date()) {
          throw new TRPCError({ 
            code: 'FORBIDDEN', 
            message: 'This access code has expired. Please contact your administrator.' 
          });
        }
        
        if (accessCodeData.usedAt) {
          throw new TRPCError({ 
            code: 'FORBIDDEN', 
            message: 'This access code has already been used.' 
          });
        }
        
        // Send verification code to partner's email
        if (!accessCodeData.partnerEmail) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Partner email not found' });
        }
        await partnerAuth.sendPartnerVerificationCode(input.accessCode, accessCodeData.partnerEmail);
        
        return { 
          email: accessCodeData.partnerEmail,
          partnerName: accessCodeData.partnerName 
        };
      }),
    
    /**
     * Step 2: Send/resend email verification code
     */
    sendVerificationCode: publicProcedure
      .input(z.object({ accessCode: z.string() }))
      .mutation(async ({ input }) => {
        const accessCodeData = await partnerAuth.validatePartnerAccessCode(input.accessCode);
        
        if (!accessCodeData) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid access code' });
        }
        
        if (!accessCodeData.partnerEmail) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Partner email not found' });
        }
        
        await partnerAuth.sendPartnerVerificationCode(input.accessCode, accessCodeData.partnerEmail);
        
        return { success: true };
      }),
    
    /**
     * Step 3: Verify email code and create partner session
     */
    verifyEmailCode: publicProcedure
      .input(z.object({ 
        accessCode: z.string(),
        verificationCode: z.string() 
      }))
      .mutation(async ({ input, ctx }) => {
        const isValid = await partnerAuth.verifyPartnerEmailCode(input.accessCode, input.verificationCode);
        
        if (!isValid) {
          throw new TRPCError({ 
            code: 'UNAUTHORIZED', 
            message: 'Invalid verification code. Please try again.' 
          });
        }
        
        // Create partner session
        const session = await partnerAuth.createPartnerSession(input.accessCode);
        
        if (!session) {
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: 'Failed to create session' 
          });
        }
        
        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie('partner_session', session.sessionToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        
        return { 
          success: true,
          sessionToken: session.sessionToken 
        };
      }),

    /**
     * Get questionnaire for partner to complete
     */
    getQuestionnaire: publicProcedure
      .input(z.object({ accessCode: z.string() }))
      .query(async ({ input }) => {
        // TODO: Implement actual questionnaire loading from database
        // For now, return mock questionnaire data
        return {
          id: 1,
          title: "Federal Compliance Questionnaire 2025",
          description: "Please complete the following questions regarding your company's compliance status.",
          footer: "Thank you for your participation. All information will be kept confidential.",
          partnerName: "Sample Partner Company",
          questions: [
            {
              id: 1,
              title: "Company Information",
              question: "Please provide your company's full legal name",
              responseType: 1, // TEXT_SHORT
              commentType: null,
              required: true,
              hintText: "This should match your official business registration",
              tag: "company_info",
              skipLogicAnswer: null,
              skipLogicJump: null,
              options: [],
            },
            {
              id: 2,
              title: "FAR Compliance Status",
              question: "Is your company currently compliant with FAR regulations?",
              responseType: 5, // YES_NO
              commentType: 2, // Show comment when No
              required: true,
              hintText: null,
              tag: "compliance",
              skipLogicAnswer: 0, // If No, skip to question 5
              skipLogicJump: "5",
              options: [],
            },
            {
              id: 3,
              title: "Compliance Certification",
              question: "Please upload your current FAR compliance certification",
              responseType: 7, // FILE_UPLOAD
              commentType: null,
              required: true,
              hintText: "Accepted formats: PDF, DOC, DOCX",
              tag: "documents",
              skipLogicAnswer: null,
              skipLogicJump: null,
              options: [],
            },
            {
              id: 4,
              title: "Certification Date",
              question: "When was your certification issued?",
              responseType: 9, // DATE
              commentType: null,
              required: true,
              hintText: null,
              tag: "compliance",
              skipLogicAnswer: null,
              skipLogicJump: null,
              options: [],
            },
            {
              id: 5,
              title: "Non-Compliance Reason",
              question: "Please explain why your company is not currently compliant",
              responseType: 2, // TEXT_LONG
              commentType: null,
              required: false,
              hintText: "Provide as much detail as possible",
              tag: "compliance",
              skipLogicAnswer: null,
              skipLogicJump: null,
              options: [],
            },
            {
              id: 6,
              title: "Supplier Category",
              question: "Which category best describes your company?",
              responseType: 4, // RADIO
              commentType: null,
              required: true,
              hintText: null,
              tag: "classification",
              skipLogicAnswer: null,
              skipLogicJump: null,
              options: [
                { id: 1, description: "Small Business", zcode: "SB" },
                { id: 2, description: "Large Business", zcode: "LB" },
                { id: 3, description: "Non-Profit", zcode: "NP" },
                { id: 4, description: "Government Entity", zcode: "GE" },
              ],
            },
            {
              id: 7,
              title: "Services Provided",
              question: "Select all services your company provides",
              responseType: 6, // CHECKBOX
              commentType: null,
              required: true,
              hintText: "Select all that apply",
              tag: "services",
              skipLogicAnswer: null,
              skipLogicJump: null,
              options: [
                { id: 5, description: "Manufacturing", zcode: "MFG" },
                { id: 6, description: "IT Services", zcode: "IT" },
                { id: 7, description: "Consulting", zcode: "CON" },
                { id: 8, description: "Logistics", zcode: "LOG" },
                { id: 9, description: "Construction", zcode: "CST" },
              ],
            },
          ],
        };
      }),

    /**
     * Save draft responses (auto-save)
     */
    saveDraft: publicProcedure
      .input(z.object({
        accessCode: z.string(),
        answers: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ input }) => {
        // TODO: Implement draft saving to database
        // Saving draft for access code: input.accessCode
        return { success: true };
      }),

    /**
     * Submit final questionnaire
     */
    /**
     * Validate questionnaire for submission
     * Business Rule: Pre-submission validation per INT.DOC.12 Section 5.1
     */
    validateSubmission: publicProcedure
      .input(z.object({
        accessCode: z.string(),
      }))
      .query(async ({ input }) => {
        const { validateForSubmission } = await import('./services/validation');
        const assignment = await partnerAuth.getAssignmentByAccessCode(input.accessCode);
        
        if (!assignment) {
          const { ERROR_CODES, createError } = await import('./constants/errorCodes');
          return {
            valid: false,
            errors: [createError(ERROR_CODES.AUTH_ACCESSCODE_NOT_FOUND)],
          };
        }
        
        return await validateForSubmission(assignment.id);
      }),

    /**
     * Submit questionnaire with validation
     * Business Rules:
     * - Pre-submission validation (INT.DOC.12 Section 5.1)
     * - Event emission (INT.DOC.11 assignment.submitted)
     */
    submitQuestionnaire: publicProcedure
      .input(z.object({
        accessCode: z.string(),
        eSignature: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { validateForSubmission } = await import('./services/validation');
        const { ERROR_CODES, createError } = await import('./constants/errorCodes');
        const { eventBus } = await import('./events/eventBus');
        
        // 1. Get assignment by access code
        const assignment = await partnerAuth.getAssignmentByAccessCode(input.accessCode);
        
        if (!assignment) {
          throw new Error(createError(ERROR_CODES.AUTH_ACCESSCODE_NOT_FOUND).message);
        }
        
        // 2. Validate for submission
        const validation = await validateForSubmission(assignment.id);
        
        if (!validation.valid) {
          return {
            success: false,
            errors: validation.errors,
          };
        }
        
        // 3. Check e-signature if required
        // TODO: Check questionnaire settings for e-signature requirement
        
        // 4. Update assignment status to submitted
        const database = await getDb();
        if (!database) {
          throw new Error(createError(ERROR_CODES.INTERNAL_SERVER_ERROR).message);
        }
        
        const { partnerQuestionnaires } = await import('../drizzle/schema');
        const now = new Date();
        
        await database
          .update(partnerQuestionnaires)
          .set({
            status: 4, // SUBMITTED
            completedDate: now,
            updatedAt: now,
          })
          .where(eq(partnerQuestionnaires.id, assignment.id));
        
        // 5. Emit assignment.submitted event
        // TODO: Calculate score, Z-Code, and fetch additional fields
        eventBus.emit('assignment.submitted', {
          assignmentId: assignment.id,
          touchpointId: assignment.touchpointQuestionnaireId, // TODO: Get actual touchpointId
          partnerId: assignment.partnerId,
          partnerName: '', // TODO: Fetch partner name
          touchpointTitle: '', // TODO: Fetch touchpoint title
          contactId: assignment.partnerId, // TODO: Get actual contactId
          email: undefined,
          questionnaireId: 0, // TODO: Get actual questionnaireId
          eSignature: input.eSignature || '',
          score: 0, // TODO: Calculate score
          zcode: '', // TODO: Calculate Z-Code
          zCodeValues: {}, // TODO: Extract Z-Code values
          progress: 100,
          completedDate: now.toISOString().split('T')[0],
          submittedAt: now,
          enterpriseId: 0, // TODO: Get enterpriseId
        });
        
        return { success: true };
      }),
  }),

  // ============================================================================
  // RESPONSE TRACKING DASHBOARD
  // ============================================================================
  
  responseTracking: router({
    /**
     * Get response tracking grid data aggregated by group and partner type
     */
    getGrid: enterpriseProcedure
      .input(z.object({
        protocolId: z.number().optional(),
        touchpointId: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) return [];

        // For now, return mock data structure
        // TODO: Implement actual database aggregation query
        const mockData = [
          {
            groupName: "Brockton",
            partnerType: "Internal Supplier",
            statuses: {
              "G": 50,
              "U": 5,
              "R": 3,
              "C": 42,
              "N/R": 10,
              "R/I": 8,
              "R/C": 24,
              "T": 42
            },
            total: 50
          },
          {
            groupName: "Brockton",
            partnerType: "FAR 15",
            statuses: {
              "G": 120,
              "U": 12,
              "R": 8,
              "C": 100,
              "N/R": 25,
              "R/I": 30,
              "R/C": 45,
              "T": 100
            },
            total: 120
          },
          {
            groupName: "CNO",
            partnerType: "Internal Supplier",
            statuses: {
              "G": 75,
              "U": 8,
              "R": 5,
              "C": 62,
              "N/R": 15,
              "R/I": 12,
              "R/C": 35,
              "T": 62
            },
            total: 75
          },
          {
            groupName: "CSP",
            partnerType: "FAR 12",
            statuses: {
              "G": 200,
              "U": 20,
              "R": 15,
              "C": 165,
              "N/R": 40,
              "R/I": 50,
              "R/C": 75,
              "T": 165
            },
            total: 200
          },
          {
            groupName: "Maple Grove",
            partnerType: "Other",
            statuses: {
              "G": 30,
              "U": 3,
              "R": 2,
              "C": 25,
              "N/R": 5,
              "R/I": 8,
              "R/C": 12,
              "T": 25
            },
            total: 30
          },
          {
            groupName: "Richardson",
            partnerType: "Internal Supplier",
            statuses: {
              "G": 90,
              "U": 9,
              "R": 6,
              "C": 75,
              "N/R": 18,
              "R/I": 20,
              "R/C": 37,
              "T": 75
            },
            total: 90
          }
        ];

        return mockData;
       }),
  }),

  // ============================================================================
  // COMMUNICATION (Buyer-to-Supplier Contact)
  // ============================================================================
  
  communication: communicationRouter,

  // ============================================================================
  // DASHBOARD (Compliance Metrics & Reporting)
  // ============================================================================
  
  dashboard: dashboardRouter,
  
  // Approval workflow router (flag for review, approve/reject)
  approval: approvalRouter,
});
export type AppRouter = typeof appRouter;
