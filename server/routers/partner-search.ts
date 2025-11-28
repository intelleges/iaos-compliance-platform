import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { eq, and, like, or, SQL } from 'drizzle-orm';
import { getDb } from '../db';
import { partners, partnerQuestionnaires, users, groups, touchpoints, partnerTypes } from '../../drizzle/schema';

/**
 * Partner search router - Dynamic search with 13 optional fields
 * 
 * Implements the legacy "Find Partner" form with flexible search criteria.
 * Users can fill any combination of fields and get filtered results.
 * 
 * Based on legacy pr_findPerson pattern with dynamic WHERE clause building.
 */
export const partnerSearchRouter = router({
  /**
   * Find partners with dynamic search criteria
   * 
   * Search fields (all optional):
   * - Dropdowns (exact match): touchpointId, partnerTypeId, status, groupId, countryId, ownerId
   * - Text fields (partial match): name, internalId, accessCode, contactEmail, hroEmail, dunsNumber, federalId, zipCode
   * 
   * Returns partners with their assignments, contact info, and status
   */
  findPartners: protectedProcedure
    .input(z.object({
      // Dropdown filters (exact match)
      touchpointId: z.number().optional(),
      partnerTypeId: z.number().optional(),
      status: z.number().optional(), // Assignment status
      
      // Text filters (partial match with LIKE)
      name: z.string().optional(),
      internalId: z.string().optional(), // EID - Enterprise Internal ID
      accessCode: z.string().optional(),
      contactEmail: z.string().optional(),
      dunsNumber: z.string().optional(),
      federalId: z.string().optional(), // CAGE code or Federal Tax ID
      zipCode: z.string().optional(),
      
      // Pagination
      page: z.number().default(1),
      pageSize: z.number().default(50),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      }
      
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      }
      
      // Build filters dynamically based on filled fields
      const filters: SQL[] = [];
      
      // Multi-tenant scoping - always filter by enterprise
      if (ctx.user.enterpriseId) {
        filters.push(eq(partners.enterpriseId, ctx.user.enterpriseId));
      }
      
      // Archive pattern - only show active partners
      filters.push(eq(partners.active, true));
      
      // Dropdown filters (exact match)
      if (input.partnerTypeId) {
        filters.push(eq(partners.partnerTypeId, input.partnerTypeId));
      }
      

      // Text filters (partial match with LIKE)
      if (input.name) {
        filters.push(like(partners.name, `%${input.name}%`));
      }
      
      if (input.internalId) {
        filters.push(like(partners.internalId, `%${input.internalId}%`));
      }
      
      if (input.contactEmail) {
        filters.push(like(partners.email, `%${input.contactEmail}%`));
      }
      

      if (input.dunsNumber) {
        filters.push(like(partners.dunsNumber, `%${input.dunsNumber}%`));
      }
      
      if (input.federalId) {
        filters.push(like(partners.cageCode, `%${input.federalId}%`));
      }
      
      if (input.zipCode) {
        filters.push(like(partners.zipcode, `%${input.zipCode}%`));
      }
      
      // For touchpoint and status filters, we need to join with partnerQuestionnaires
      // Build the base query
      let query = db
        .select({
          // Partner fields
          id: partners.id,
          name: partners.name,
          internalId: partners.internalId,
          email: partners.email,
          phone: partners.phone,
          dunsNumber: partners.dunsNumber,
          cageCode: partners.cageCode,
          address1: partners.address1,
          address2: partners.address2,
          city: partners.city,
          state: partners.state,
          zipcode: partners.zipcode,
          partnerTypeId: partners.partnerTypeId,
          
          // Assignment fields (if filtering by touchpoint/status)
          assignmentId: partnerQuestionnaires.id,
          accessCode: partnerQuestionnaires.accessCode,
          assignmentStatus: partnerQuestionnaires.status,
          invitedDate: partnerQuestionnaires.invitedDate,
          dueDate: partnerQuestionnaires.dueDate,
          completedDate: partnerQuestionnaires.completedDate,
          progress: partnerQuestionnaires.progress,
        })
        .from(partners);
      
      // If filtering by touchpoint or status, join with partnerQuestionnaires
      if (input.touchpointId || input.status || input.accessCode) {
        query = query.leftJoin(
          partnerQuestionnaires,
          eq(partners.id, partnerQuestionnaires.partnerId)
        );
        
        if (input.touchpointId) {
          // Need to join touchpointQuestionnaires to filter by touchpoint
          // For now, filter by touchpointQuestionnaireId (simplified)
          // TODO: Add proper touchpoint join when touchpointQuestionnaires relation is set up
        }
        
        if (input.status) {
          filters.push(eq(partnerQuestionnaires.status, input.status));
        }
        
        if (input.accessCode) {
          filters.push(eq(partnerQuestionnaires.accessCode, input.accessCode));
        }
      }
      
      // Apply all filters
      if (filters.length > 0) {
        query = query.where(and(...filters)) as typeof query;
      }
      
      // Calculate offset for pagination
      const offset = (input.page - 1) * input.pageSize;
      
      // Execute query with pagination
      const results = await query
        .limit(input.pageSize)
        .offset(offset);
      
      // Get total count for pagination
      const countQuery = await db
        .select({ count: partners.id })
        .from(partners)
        .where(filters.length > 0 ? and(...filters) : undefined);
      
      const totalCount = countQuery.length;
      
      return {
        partners: results,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / input.pageSize),
        },
      };
    }),
  
  /**
   * Get partner by ID with full details
   * 
   * Returns partner with all assignments, contact history, and documents
   */
  getPartnerById: protectedProcedure
    .input(z.object({
      partnerId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      }
      
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      }
      
      // Get partner with all related data
      const partnerResults = await db
        .select()
        .from(partners)
        .where(
          and(
            eq(partners.id, input.partnerId),
            ctx.user.enterpriseId ? eq(partners.enterpriseId, ctx.user.enterpriseId) : undefined
          )
        )
        .limit(1);
      
      const partner = partnerResults[0];
      
      if (!partner) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Partner not found' });
      }
      
      // Get all assignments for this partner
      const assignments = await db
        .select()
        .from(partnerQuestionnaires)
        .where(eq(partnerQuestionnaires.partnerId, input.partnerId))
        .orderBy(partnerQuestionnaires.invitedDate);
      
      return {
        partner,
        assignments,
      };
    }),
});
