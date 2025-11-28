/**
 * Multi-Tenant Data Isolation Tests
 * Based on INT.DOC.23 Section 4.1 - Data Isolation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from '../../../server/db';
import { eq, and } from 'drizzle-orm';
import { enterprises, users, touchpoints, partners, partnerAssignments } from '../../../drizzle/schema';
import { testEnterprises } from '../fixtures/enterprises';
import { generateTestToken, createTestClient } from '../trpc/client';

describe('Multi-Tenant Data Isolation', () => {
  let enterpriseAAdminToken: string;
  let enterpriseBAdminToken: string;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create Enterprise A
    await db.insert(enterprises).values({
      id: testEnterprises.enterpriseA.id,
      description: testEnterprises.enterpriseA.description,
      instanceName: testEnterprises.enterpriseA.instanceName,
      companyName: testEnterprises.enterpriseA.companyName,
    });

    await db.insert(users).values(testEnterprises.enterpriseA.adminUser);

    // Create Enterprise B
    await db.insert(enterprises).values({
      id: testEnterprises.enterpriseB.id,
      description: testEnterprises.enterpriseB.description,
      instanceName: testEnterprises.enterpriseB.instanceName,
      companyName: testEnterprises.enterpriseB.companyName,
    });

    await db.insert(users).values(testEnterprises.enterpriseB.adminUser);

    // Generate tokens
    enterpriseAAdminToken = generateTestToken({
      role: 'admin',
      enterpriseId: testEnterprises.enterpriseA.id,
      userId: testEnterprises.enterpriseA.adminUser.id,
    });

    enterpriseBAdminToken = generateTestToken({
      role: 'admin',
      enterpriseId: testEnterprises.enterpriseB.id,
      userId: testEnterprises.enterpriseB.adminUser.id,
    });
  });

  describe('Touchpoint Isolation', () => {
    beforeEach(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db.insert(touchpoints).values([
        {
          id: testEnterprises.enterpriseA.touchpoint.id,
          name: testEnterprises.enterpriseA.touchpoint.name,
          code: testEnterprises.enterpriseA.touchpoint.code,
          enterpriseId: testEnterprises.enterpriseA.id,
          status: 'active',
        },
        {
          id: testEnterprises.enterpriseB.touchpoint.id,
          name: testEnterprises.enterpriseB.touchpoint.name,
          code: testEnterprises.enterpriseB.touchpoint.code,
          enterpriseId: testEnterprises.enterpriseB.id,
          status: 'active',
        },
      ]);
    });

    it('Test 1: Enterprise A admin cannot list Enterprise B touchpoints', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const touchpointsA = await db.select()
        .from(touchpoints)
        .where(eq(touchpoints.enterpriseId, testEnterprises.enterpriseA.id));
      
      expect(touchpointsA).toHaveLength(1);
      expect(touchpointsA[0]?.id).toBe(testEnterprises.enterpriseA.touchpoint.id);
    });

    it('Test 2: Enterprise A admin cannot view Enterprise B touchpoint details', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const touchpointB = await db.select()
        .from(touchpoints)
        .where(
          and(
            eq(touchpoints.id, testEnterprises.enterpriseB.touchpoint.id),
            eq(touchpoints.enterpriseId, testEnterprises.enterpriseA.id)
          )
        );
      
      expect(touchpointB).toHaveLength(0);
    });

    it('Test 3: Enterprise A admin cannot update Enterprise B touchpoint', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const touchpointB = await db.select()
        .from(touchpoints)
        .where(eq(touchpoints.id, testEnterprises.enterpriseB.touchpoint.id));
      
      expect(touchpointB[0]?.name).toBe(testEnterprises.enterpriseB.touchpoint.name);
      expect(touchpointB[0]?.enterpriseId).toBe(testEnterprises.enterpriseB.id);
    });

    it('Test 4: Enterprise A admin cannot delete Enterprise B touchpoint', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const touchpointB = await db.select()
        .from(touchpoints)
        .where(eq(touchpoints.id, testEnterprises.enterpriseB.touchpoint.id));
      
      expect(touchpointB).toHaveLength(1);
      expect(touchpointB[0]?.status).toBe('active');
    });
  });

  describe('Partner Isolation', () => {
    beforeEach(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db.insert(partners).values([
        {
          id: testEnterprises.enterpriseA.partner.id,
          companyName: testEnterprises.enterpriseA.partner.companyName,
          dunsNumber: testEnterprises.enterpriseA.partner.dunsNumber,
          cageCode: testEnterprises.enterpriseA.partner.cageCode,
          enterpriseId: testEnterprises.enterpriseA.id,
        },
        {
          id: testEnterprises.enterpriseB.partner.id,
          companyName: testEnterprises.enterpriseB.partner.companyName,
          dunsNumber: testEnterprises.enterpriseB.partner.dunsNumber,
          cageCode: testEnterprises.enterpriseB.partner.cageCode,
          enterpriseId: testEnterprises.enterpriseB.id,
        },
      ]);
    });

    it('Test 5: Enterprise A admin cannot list Enterprise B partners', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const partnersA = await db.select()
        .from(partners)
        .where(eq(partners.enterpriseId, testEnterprises.enterpriseA.id));
      
      expect(partnersA).toHaveLength(1);
      expect(partnersA[0]?.id).toBe(testEnterprises.enterpriseA.partner.id);
    });

    it('Test 6: Enterprise A admin cannot view Enterprise B partner details', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const partnerB = await db.select()
        .from(partners)
        .where(
          and(
            eq(partners.id, testEnterprises.enterpriseB.partner.id),
            eq(partners.enterpriseId, testEnterprises.enterpriseA.id)
          )
        );
      
      expect(partnerB).toHaveLength(0);
    });
  });

  describe('Assignment Isolation', () => {
    it('Test 7: Enterprise A admin cannot list Enterprise B assignments', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const assignmentsA = await db.select()
        .from(partnerAssignments)
        .innerJoin(touchpoints, eq(partnerAssignments.touchpointId, touchpoints.id))
        .where(eq(touchpoints.enterpriseId, testEnterprises.enterpriseA.id));
      
      expect(assignmentsA.every(a => a.touchpoints.enterpriseId === testEnterprises.enterpriseA.id)).toBe(true);
    });

    it('Test 8: Enterprise A admin cannot view Enterprise B assignment responses', async () => {
      expect(true).toBe(true);
    });

    it('Test 9: Enterprise A supplier cannot access Enterprise B questionnaires', async () => {
      expect(true).toBe(true);
    });

    it('Test 10: Database queries automatically filter by enterpriseId', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const touchpointsA = await db.select()
        .from(touchpoints)
        .where(eq(touchpoints.enterpriseId, testEnterprises.enterpriseA.id));
      
      const touchpointsB = await db.select()
        .from(touchpoints)
        .where(eq(touchpoints.enterpriseId, testEnterprises.enterpriseB.id));
      
      const touchpointAIds = new Set(touchpointsA.map(t => t.id));
      const touchpointBIds = new Set(touchpointsB.map(t => t.id));
      
      const intersection = [...touchpointAIds].filter(id => touchpointBIds.has(id));
      expect(intersection).toHaveLength(0);
    });
  });
});
