import { getDb } from '../server/db.js';
import { partnerQuestionnaires } from '../drizzle/schema.js';
import { generateAccessCode } from '../server/utils/access-code.js';

const db = await getDb();
if (!db) {
  console.error('Database not available');
  process.exit(1);
}

// Generate new access code
const newAccessCode = generateAccessCode();

// Create new assignment with INVITED status (6)
await db.insert(partnerQuestionnaires).values({
  partnerId: 1,
  touchpointQuestionnaireId: 1, // Required field
  accessCode: newAccessCode,
  status: 6, // INVITED
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  progress: 0,
});

console.log('✅ New test assignment created');
console.log('Access Code:', newAccessCode);
