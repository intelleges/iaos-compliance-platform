/**
 * Test Setup for Integration Tests
 * Based on INT.DOC.23 Section 1.2 - Test Database Setup
 * 
 * Cleans transactional tables before each test
 */

import { beforeEach } from 'vitest';
import { getDb } from '../../server/db';
import { sql } from 'drizzle-orm';

beforeEach(async () => {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection not available for integration tests');
  }

  // Clean test data (IDs >= 100 are reserved for tests)
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  
  try {
    // Clean in reverse dependency order
    await db.execute(sql`DELETE FROM approvalPermissions WHERE enterpriseId >= 100`);
    await db.execute(sql`DELETE FROM touchpoints WHERE enterpriseId >= 100`);
    await db.execute(sql`DELETE FROM partners WHERE enterpriseId >= 100`);
    await db.execute(sql`DELETE FROM users WHERE enterpriseId >= 100 OR id >= 1000`);
    await db.execute(sql`DELETE FROM enterprises WHERE id >= 100`);
  } finally {
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
  }
});
