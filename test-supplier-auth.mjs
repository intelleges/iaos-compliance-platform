import { db } from './server/db/index.js';
import { partnerAccessCodes, partnerSessions } from './drizzle/schema.js';
import { eq, and } from 'drizzle-orm';

const accessCode = 'DDSETM9RNAHB';

console.log('Testing supplier authentication...\n');

// Check if access code exists
const codes = await db.select().from(partnerAccessCodes).where(eq(partnerAccessCodes.accessCode, accessCode));
console.log('Access code record:', JSON.stringify(codes, null, 2));

if (codes.length > 0) {
  const code = codes[0];
  
  // Check for existing sessions
  const sessions = await db.select().from(partnerSessions).where(eq(partnerSessions.partnerQuestionnaireId, code.partnerQuestionnaireId));
  console.log('\nExisting sessions:', JSON.stringify(sessions, null, 2));
}

process.exit(0);
