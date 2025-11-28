import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  touchpoints, 
  groups, 
  partners, 
  partnerQuestionnaires,
  partnerGroups,
  partnerTypes,
} from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Dashboard Router
 * Provides compliance metrics, group summaries, and partner data for IntellegesQMS
 */
export const dashboardRouter = router({
  /**
   * Get all touchpoints for the enterprise
   */
  getTouchpoints: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select({
        id: touchpoints.id,
        title: touchpoints.title,
        abbreviation: touchpoints.abbreviation,
        description: touchpoints.description,
        startDate: touchpoints.startDate,
        endDate: touchpoints.endDate,
        active: touchpoints.active,
      })
      .from(touchpoints)
      .where(eq(touchpoints.active, true))
      .orderBy(touchpoints.sortOrder);

    return result;
  }),

  /**
   * Get compliance status overview for a touchpoint
   */
  getComplianceStatus: protectedProcedure
    .input(z.object({ touchpointId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get total partners assigned to this touchpoint
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(partnerQuestionnaires)
        .where(eq(partnerQuestionnaires.touchpointQuestionnaireId, input.touchpointId));

      const total = Number(totalResult[0]?.count || 0);

      // Get completed count
      const completedResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(partnerQuestionnaires)
        .where(
          and(
            eq(partnerQuestionnaires.touchpointQuestionnaireId, input.touchpointId),
            sql`${partnerQuestionnaires.completedDate} IS NOT NULL`
          )
        );

      const completed = Number(completedResult[0]?.count || 0);

      // Get status breakdown (mock for now - will need status enum)
      const statusBreakdown = {
        goal: 0,
        unconfirmed: 0,
        reviewing: 0,
        confirmed: completed,
        noResponse: total - completed,
        incomplete: 0,
        complete: completed,
      };

      return {
        total,
        completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        statusBreakdown,
      };
    }),

  /**
   * Get group summaries for a touchpoint
   */
  getGroupSummaries: protectedProcedure
    .input(z.object({ touchpointId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all groups for the enterprise
      const groupsData = await db
        .select({
          id: groups.id,
          name: groups.name,
          description: groups.description,
        })
        .from(groups)
        .where(eq(groups.active, true))
        .orderBy(groups.sortOrder);

      // For each group, get partner counts
      const summaries = await Promise.all(
        groupsData.map(async (group) => {
          // Get partners in this group
          const partnerIds = await db
            .select({ partnerId: partnerGroups.partnerId })
            .from(partnerGroups)
            .where(eq(partnerGroups.groupId, group.id));

          const partnerIdList = partnerIds.map((p) => p.partnerId);

          if (partnerIdList.length === 0) {
            return {
              groupId: group.id,
              groupName: group.name,
              abbreviation: (group.name || "GRP").substring(0, 3).toUpperCase(),
              total: 0,
              goal: 0,
              unconfirmed: 0,
              reviewing: 0,
              confirmed: 0,
              noResponse: 0,
              incomplete: 0,
              complete: 0,
              completionRate: 0,
            };
          }

          // Get questionnaire assignments for these partners
          const assignments = await db
            .select({
              partnerId: partnerQuestionnaires.partnerId,
              completedDate: partnerQuestionnaires.completedDate,
              status: partnerQuestionnaires.status,
            })
            .from(partnerQuestionnaires)
            .where(
              and(
                eq(partnerQuestionnaires.touchpointQuestionnaireId, input.touchpointId),
                sql`${partnerQuestionnaires.partnerId} IN (${sql.join(partnerIdList, sql`, `)})`
              )
            );

          const total = assignments.length;
          const completed = assignments.filter((a) => a.completedDate !== null).length;
          const noResponse = total - completed;

          return {
            groupId: group.id,
            groupName: group.name,
            abbreviation: (group.name || "GRP").substring(0, 3).toUpperCase(),
            total,
            goal: 0,
            unconfirmed: 0,
            reviewing: 0,
            confirmed: completed,
            noResponse,
            incomplete: 0,
            complete: completed,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          };
        })
      );

      return summaries;
    }),

  /**
   * Get partner metrics for a specific group and touchpoint
   */
  getPartnerMetrics: protectedProcedure
    .input(
      z.object({
        touchpointId: z.number(),
        groupId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let partnerIdList: number[] = [];

      if (input.groupId) {
        // Get partners in this group
        const partnerIds = await db
          .select({ partnerId: partnerGroups.partnerId })
          .from(partnerGroups)
          .where(eq(partnerGroups.groupId, input.groupId));

        partnerIdList = partnerIds.map((p) => p.partnerId);

        if (partnerIdList.length === 0) {
          return [];
        }
      }

      // Build query for partners
      const baseQuery = db
        .select({
          partnerId: partners.id,
          partnerName: partners.name,
          partnerType: partnerTypes.description,
          internalId: partners.internalId,
          email: partners.email,
          phone: partners.phone,
          status: partners.status,
        })
        .from(partners)
        .leftJoin(partnerTypes, eq(partners.partnerTypeId, partnerTypes.id));

      const partnersData = partnerIdList.length > 0
        ? await baseQuery.where(
            and(
              eq(partners.active, true),
              sql`${partners.id} IN (${sql.join(partnerIdList, sql`, `)})`
            )
          )
        : await baseQuery.where(eq(partners.active, true));

      // For each partner, get their questionnaire status
      const metrics = await Promise.all(
        partnersData.map(async (partner) => {
          const assignment = await db
            .select({
              id: partnerQuestionnaires.id,
              status: partnerQuestionnaires.status,
              progress: partnerQuestionnaires.progress,
              completedDate: partnerQuestionnaires.completedDate,
              dueDate: partnerQuestionnaires.dueDate,
              accessCode: partnerQuestionnaires.accessCode,
            })
            .from(partnerQuestionnaires)
            .where(
              and(
                eq(partnerQuestionnaires.partnerId, partner.partnerId),
                eq(partnerQuestionnaires.touchpointQuestionnaireId, input.touchpointId)
              )
            )
            .limit(1);

          const assignmentData = assignment[0];

          return {
            partnerId: partner.partnerId,
            partnerName: partner.partnerName || "Unknown",
            partnerType: partner.partnerType || "Supplier",
            internalId: partner.internalId,
            email: partner.email,
            phone: partner.phone,
            status: assignmentData?.completedDate ? "Complete" : "No Response",
            progress: assignmentData?.progress || 0,
            dueDate: assignmentData?.dueDate,
            accessCode: assignmentData?.accessCode,
            assignmentId: assignmentData?.id,
          };
        })
      );

      return metrics;
    }),
});
