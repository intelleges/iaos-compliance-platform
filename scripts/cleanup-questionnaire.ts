/**
 * Cleanup existing questionnaire data before re-import
 * 
 * Usage: pnpm tsx scripts/cleanup-questionnaire.ts
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { questionnaires, questions, responses } from '../drizzle/schema';

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);
  
  console.log('Deleting existing questionnaire data...');
  
  await db.delete(responses);
  console.log('✓ Deleted responses');
  
  await db.delete(questions);
  console.log('✓ Deleted questions');
  
  await db.delete(questionnaires);
  console.log('✓ Deleted questionnaires');
  
  console.log('\nCleanup complete!');
  
  await connection.end();
  process.exit(0);
}

main().catch(error => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});
