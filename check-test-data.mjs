import { db } from './server/db/index.js';
import { partnerAccessCodes, partnerQuestionnaires } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

const accessCode = 'DDSETM9RNAHB';

console.log('Checking for test access code:', accessCode);

const codes = await db.select().from(partnerAccessCodes).where(eq(partnerAccessCodes.accessCode, accessCode));

if (codes.length === 0) {
  console.log('❌ No access code found in database!');
  console.log('Creating test data...\n');
  
  // Create a test partner questionnaire assignment
  const [assignment] = await db.insert(partnerQuestionnaires).values({
    enterpriseId: 999,
    partnerId: 1,
    touchpointQuestionnaireId: 1,
    status: 'ASSIGNED',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    progress: 0,
  }).returning();
  
  console.log('✅ Created test assignment:', assignment.id);
  
  // Create access code
  await db.insert(partnerAccessCodes).values({
    partnerQuestionnaireId: assignment.id,
    accessCode: accessCode,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    used: false,
  });
  
  console.log('✅ Created access code:', accessCode);
} else {
  console.log('✅ Access code found:', codes[0].id);
  console.log('   Partner Questionnaire ID:', codes[0].partnerQuestionnaireId);
  console.log('   Used:', codes[0].used);
  console.log('   Expires:', codes[0].expiresAt);
}

process.exit(0);
