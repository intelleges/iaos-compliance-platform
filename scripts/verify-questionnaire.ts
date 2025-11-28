/**
 * Verify questionnaire import results
 * 
 * Usage: pnpm tsx scripts/verify-questionnaire.ts
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { questionnaires, questions, responses } from '../drizzle/schema';
import { eq, count } from 'drizzle-orm';

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);
  
  console.log('=== Questionnaire Import Verification ===\n');
  
  // Count questionnaires
  const qCount = await db.select({ count: count() }).from(questionnaires);
  console.log(`✓ Questionnaires: ${qCount[0].count}`);
  
  // Count questions
  const questCount = await db.select({ count: count() }).from(questions);
  console.log(`✓ Questions: ${questCount[0].count}`);
  
  // Count responses
  const respCount = await db.select({ count: count() }).from(responses);
  console.log(`✓ Response options: ${respCount[0].count}`);
  
  // Get questionnaire details
  const q = await db.select().from(questionnaires).limit(1);
  console.log(`\n=== Questionnaire Details ===`);
  console.log(`Title: ${q[0].title}`);
  console.log(`ID: ${q[0].id}`);
  console.log(`Description: ${q[0].description}`);
  
  // Count questions by response type
  const questionsByType = await db
    .select({
      responseType: questions.responseType,
      count: count(),
    })
    .from(questions)
    .groupBy(questions.responseType);
  
  console.log(`\n=== Questions by Response Type ===`);
  questionsByType.forEach(qt => {
    console.log(`  Type ${qt.responseType}: ${qt.count} questions`);
  });
  
  // Count questions with response options
  const questionsWithResponses = await db
    .select({
      questionId: responses.questionId,
      count: count(),
    })
    .from(responses)
    .groupBy(responses.questionId);
  
  console.log(`\n=== Questions with Response Options ===`);
  console.log(`Total questions with options: ${questionsWithResponses.length}`);
  
  // Sample dropdown/list questions with their response options
  const dropdownQuestions = await db
    .select({
      id: questions.id,
      title: questions.title,
      responseType: questions.responseType,
    })
    .from(questions)
    .where(eq(questions.responseType, 4))
    .limit(3);
  
  console.log(`\n=== Sample Dropdown/Radio Questions (Type 4) ===`);
  for (const q of dropdownQuestions) {
    const opts = await db
      .select({
        description: responses.description,
        responseCode: responses.responseCode,
      })
      .from(responses)
      .where(eq(responses.questionId, q.id));
    
    console.log(`\nQ${q.id}: ${q.title}`);
    console.log(`  Options (${opts.length}):`);
    opts.forEach(opt => {
      console.log(`    - ${opt.description} (${opt.responseCode})`);
    });
  }
  
  // Sample checkbox/list questions
  const checkboxQuestions = await db
    .select({
      id: questions.id,
      title: questions.title,
      responseType: questions.responseType,
    })
    .from(questions)
    .where(eq(questions.responseType, 6))
    .limit(2);
  
  console.log(`\n=== Sample Checkbox/Multi-Select Questions (Type 6) ===`);
  for (const q of checkboxQuestions) {
    const opts = await db
      .select({
        description: responses.description,
        responseCode: responses.responseCode,
        zcode: responses.zcode,
      })
      .from(responses)
      .where(eq(responses.questionId, q.id));
    
    console.log(`\nQ${q.id}: ${q.title}`);
    console.log(`  Options (${opts.length}):`);
    opts.forEach(opt => {
      console.log(`    - ${opt.description} (code: ${opt.responseCode}, zcode: ${opt.zcode})`);
    });
  }
  
  console.log('\n=== Verification Complete ===');
  
  await connection.end();
  process.exit(0);
}

main().catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});
