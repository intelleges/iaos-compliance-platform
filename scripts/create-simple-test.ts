/**
 * Create minimal test assignment for questionnaire display testing
 * 
 * Usage: pnpm tsx scripts/create-simple-test.ts
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { 
  partnerQuestionnaires,
  touchpointQuestionnaires,
  questionnaires
} from '../drizzle/schema';
import { generateAccessCode } from '../server/utils/access-code';

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);
  
  console.log('=== Creating Minimal Test Assignment ===\n');
  
  // Get questionnaire ID
  const questionnaire = await db.select().from(questionnaires).limit(1);
  if (questionnaire.length === 0) {
    throw new Error('No questionnaire found. Run import-questionnaire.ts first.');
  }
  const questionnaireId = questionnaire[0].id;
  console.log(`✓ Found questionnaire: ${questionnaire[0].title} (ID: ${questionnaireId})`);
  
  // Create touchpoint-questionnaire link (minimal fields)
  const tqResult = await db.insert(touchpointQuestionnaires).values({
    touchpointId: 1, // Assuming touchpoint ID 1 exists
    questionnaireId,
    partnerTypeId: 1, // Assuming partner type ID 1 exists
    active: true,
  });
  const touchpointQuestionnaireId = Number(tqResult[0].insertId);
  console.log(`✓ Created touchpoint-questionnaire link (ID: ${touchpointQuestionnaireId})`);
  
  // Generate access code
  const accessCode = generateAccessCode();
  console.log(`✓ Generated access code: ${accessCode}`);
  
  // Create partner assignment (minimal fields)
  const assignmentResult = await db.insert(partnerQuestionnaires).values({
    partnerId: 1, // Assuming partner ID 1 exists
    touchpointQuestionnaireId,
    accessCode,
    invitedBy: 1,
    invitedDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 6, // 6 = INVITED (will change to 7 = IN_PROGRESS on first access)
    progress: 0,
    active: true,
  });
  const assignmentId = Number(assignmentResult[0].insertId);
  console.log(`✓ Created assignment (ID: ${assignmentId})`);
  
  console.log('\n=== Test Assignment Created Successfully ===');
  console.log(`\nTest URL: https://3000-idwfa9fysjh5vw062hpg7-f5daaa6a.manusvm.computer/supplier/login`);
  console.log(`Access Code: ${accessCode}`);
  console.log(`\nQuestionnaire: ${questionnaire[0].title}`);
  console.log(`Total Questions: 82`);
  console.log(`\nNext: Navigate to the URL above and enter the access code to test questionnaire display`);
  
  await connection.end();
  process.exit(0);
}

main().catch(error => {
  console.error('Failed to create test assignment:', error);
  process.exit(1);
});
