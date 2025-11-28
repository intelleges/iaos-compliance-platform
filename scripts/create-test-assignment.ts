/**
 * Create test assignment for questionnaire display testing
 * 
 * Usage: pnpm tsx scripts/create-test-assignment.ts
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { 
  enterprises, 
  partners, 
  protocols,
  touchpoints, 
  questionnaires,
  touchpointQuestionnaires,
  partnerQuestionnaires,
  partnerTypes,
  groups
} from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { generateAccessCode } from '../server/utils/access-code';

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);
  
  console.log('=== Creating Test Assignment ===\n');
  
  // 1. Create test enterprise (Celestica)
  const enterpriseResult = await db.insert(enterprises).values({
    description: 'Celestica Corporation',
    companyName: 'Celestica',
    instanceName: 'celestica',
    active: true,
  });
  const enterpriseId = Number(enterpriseResult[0].insertId);
  console.log(`✓ Created enterprise: Celestica (ID: ${enterpriseId})`);
  
  // 2. Create partner type (Supplier)
  const partnerTypeResult = await db.insert(partnerTypes).values({
    enterpriseId,
    name: 'Supplier',
    alias: 'SUP',
    description: 'Supplier partner type',
    active: true,
  });
  const partnerTypeId = Number(partnerTypeResult[0].insertId);
  console.log(`✓ Created partner type: Supplier (ID: ${partnerTypeId})`);
  
  // 3. Create group
  const groupResult = await db.insert(groups).values({
    enterpriseId,
    name: 'Test Group',
    alias: 'TEST',
    description: 'Test group for questionnaire testing',
    active: true,
  });
  const groupId = Number(groupResult[0].insertId);
  console.log(`✓ Created group: Test Group (ID: ${groupId})`);
  
  // 4. Create test partner
  const partnerResult = await db.insert(partners).values({
    enterpriseId,
    partnerTypeId,
    name: 'Test Supplier Inc.',
    cageCode: 'TEST123',
    address1: '123 Test Street',
    city: 'Test City',
    state: 'CA',
    zip: '12345',
    country: 'USA',
    contactName: 'John Doe',
    contactEmail: 'john.doe@testsupplier.com',
    contactPhone: '555-1234',
    active: true,
  });
  const partnerId = Number(partnerResult[0].insertId);
  console.log(`✓ Created partner: Test Supplier Inc. (ID: ${partnerId})`);
  
  // 5. Create protocol
  const protocolResult = await db.insert(protocols).values({
    enterpriseId,
    name: 'Annual Representations and Certifications',
    alias: 'Annual Reps & Certs',
    description: 'Annual supplier compliance questionnaire',
    active: true,
  });
  const protocolId = Number(protocolResult[0].insertId);
  console.log(`✓ Created protocol: Annual Reps & Certs (ID: ${protocolId})`);
  
  // 6. Create touchpoint
  const touchpointResult = await db.insert(touchpoints).values({
    enterpriseId,
    protocolId,
    title: 'Annual Reps & Certs 2025',
    abbreviation: 'ARC2025',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    targetResponses: 1000,
    automaticReminders: true,
    active: true,
  });
  const touchpointId = Number(touchpointResult[0].insertId);
  console.log(`✓ Created touchpoint: Annual Reps & Certs 2025 (ID: ${touchpointId})`);
  
  // 7. Get questionnaire ID
  const questionnaire = await db.select().from(questionnaires).limit(1);
  if (questionnaire.length === 0) {
    throw new Error('No questionnaire found. Run import-questionnaire.ts first.');
  }
  const questionnaireId = questionnaire[0].id;
  console.log(`✓ Found questionnaire: ${questionnaire[0].title} (ID: ${questionnaireId})`);
  
  // 8. Link questionnaire to touchpoint
  const tqResult = await db.insert(touchpointQuestionnaires).values({
    touchpointId,
    questionnaireId,
    partnerTypeId,
    active: true,
  });
  const touchpointQuestionnaireId = Number(tqResult[0].insertId);
  console.log(`✓ Linked questionnaire to touchpoint (ID: ${touchpointQuestionnaireId})`);
  
  // 9. Generate access code
  const accessCode = generateAccessCode();
  console.log(`✓ Generated access code: ${accessCode}`);
  
  // 10. Create partner assignment
  const assignmentResult = await db.insert(partnerQuestionnaires).values({
    partnerId,
    touchpointQuestionnaireId,
    accessCode,
    invitedBy: 1, // Admin user
    invitedDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: 'INVITED',
    progress: 0,
    active: true,
  });
  const assignmentId = Number(assignmentResult[0].insertId);
  console.log(`✓ Created assignment (ID: ${assignmentId})`);
  
  console.log('\n=== Test Assignment Created Successfully ===');
  console.log(`\nTest URL: /supplier/login`);
  console.log(`Access Code: ${accessCode}`);
  console.log(`\nPartner: Test Supplier Inc.`);
  console.log(`Contact: john.doe@testsupplier.com`);
  console.log(`Questionnaire: ${questionnaire[0].title}`);
  console.log(`Total Questions: 82`);
  
  await connection.end();
  process.exit(0);
}

main().catch(error => {
  console.error('Failed to create test assignment:', error);
  process.exit(1);
});
