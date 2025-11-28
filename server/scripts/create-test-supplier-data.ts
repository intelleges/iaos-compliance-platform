/**
 * Create Test Data for Supplier Portal End-to-End Testing
 * 
 * This script creates:
 * 1. Test enterprise (ID: 999)
 * 2. Test partner (Acme Corp)
 * 3. Test questionnaire (Annual Reps & Certs 2025)
 * 4. Test touchpoint
 * 5. Test assignment with access code DDSETM9RNAHB
 */

import { getDb } from '../db.js';
import {
  enterprises,
  partners,
  questionnaires,
  protocols,
  touchpoints,
  touchpointQuestionnaires,
  partnerQuestionnaires,
  users,
} from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

async function createTestData() {
  console.log('🚀 Creating test data for supplier portal...\n');
  
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection failed');
  }

  // 1. Check if test enterprise exists
  console.log('1. Checking test enterprise...');
  const existingEnterprise = await db.select().from(enterprises).where(eq(enterprises.id, 999)).limit(1);
  if (existingEnterprise.length === 0) {
    await db.insert(enterprises).values({
      id: 999,
      description: 'Test Enterprise for Supplier Portal',
      companyName: 'Test Corp',
      active: true,
    });
    console.log('   ✅ Enterprise created: ID 999\n');
  } else {
    console.log('   ℹ️  Enterprise already exists: ID 999\n');
  }

  // 2. Create test user for invitedBy field
  console.log('2. Creating test user...');
  const [user] = await db
    .insert(users)
    .values({
      openId: 'test-user-999',
      name: 'Test Admin',
      email: 'admin@testcorp.com',
      role: 'admin',
      enterpriseId: 999,
      active: true,
    });
  const userId = user?.insertId || 1;
  console.log(`   ✅ User created: ID ${userId}\n`);

  // 3. Create test partner
  console.log('3. Creating test partner...');
  const [partner] = await db
    .insert(partners)
    .values({
      enterpriseId: 999,
      name: 'Acme Corporation',
      cageCode: 'ACME1',
      email: 'supplier@acme.com',
      firstName: 'John',
      lastName: 'Supplier',
      phone: '555-1234',
      active: true,
    });
  const partnerId = partner?.insertId || 1;
  console.log(`   ✅ Partner created: ID ${partnerId}\n`);

  // 4. Create test protocol
  console.log('4. Creating test protocol...');
  const [protocol] = await db
    .insert(protocols)
    .values({
      enterpriseId: 999,
      name: 'Annual Representations & Certifications',
      abbreviation: 'REPS',
      description: 'FAR 52.204-8 Annual Representations and Certifications',
      active: true,
    });
  const protocolId = protocol?.insertId || 1;
  console.log(`   ✅ Protocol created: ID ${protocolId}\n`);

  // 5. Create test questionnaire
  console.log('5. Creating test questionnaire...');
  const [questionnaire] = await db
    .insert(questionnaires)
    .values({
      enterpriseId: 999,
      title: 'Annual Reps & Certs 2025',
      description: 'Annual supplier representations and certifications for federal compliance',
      personId: userId,
      partnerTypeId: 1,
      active: true,
    });
  const questionnaireId = questionnaire?.insertId || 1;
  console.log(`   ✅ Questionnaire created: ID ${questionnaireId}\n`);

  // 6. Create test touchpoint
  console.log('6. Creating test touchpoint...');
  const [touchpoint] = await db
    .insert(touchpoints)
    .values({
      protocolId: protocolId,
      title: 'Q1 2025 Annual Reps Collection',
      abbreviation: 'Q1-2025',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
      target: 100,
      active: true,
    });
  const touchpointId = touchpoint?.insertId || 1;
  console.log(`   ✅ Touchpoint created: ID ${touchpointId}\n`);

  // 7. Link touchpoint to questionnaire
  console.log('7. Linking touchpoint to questionnaire...');
  const [tq] = await db
    .insert(touchpointQuestionnaires)
    .values({
      touchpointId: touchpointId,
      questionnaireId: questionnaireId,
      partnerTypeId: 1, // Default partner type
      active: true,
    });
  const touchpointQuestionnaireId = tq?.insertId || 1;
  console.log(`   ✅ Touchpoint-Questionnaire link created: ID ${touchpointQuestionnaireId}\n`);

  // 8. Create partner questionnaire assignment with access code
  console.log('8. Creating partner questionnaire assignment...');
  const [assignment] = await db
    .insert(partnerQuestionnaires)
    .values({
      partnerId: partnerId,
      touchpointQuestionnaireId: touchpointQuestionnaireId,
      accessCode: 'DDSETM9RNAHB',
      invitedBy: userId,
      invitedDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 1, // ASSIGNED status
      progress: 0,
    });
  const assignmentId = assignment?.insertId || 1;
  console.log(`   ✅ Assignment created: ID ${assignmentId}\n`);

  console.log('✨ Test data creation complete!\n');
  console.log('📋 Summary:');
  console.log(`   Enterprise ID: 999`);
  console.log(`   Partner ID: ${partnerId}`);
  console.log(`   Questionnaire ID: ${questionnaireId}`);
  console.log(`   Touchpoint ID: ${touchpointId}`);
  console.log(`   Assignment ID: ${assignmentId}`);
  console.log(`   Access Code: DDSETM9RNAHB`);
  console.log(`\n🔗 Test URL: https://3000-i2mhawmxtaqwtnd8ebz6b-67285b4a.manusvm.computer/supplier/login`);
}

createTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  });
