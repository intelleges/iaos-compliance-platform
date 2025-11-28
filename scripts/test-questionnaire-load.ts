import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { questions, responses, questionnaires } from '../drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * Test script to verify all 82 questions load correctly with their response options
 */
(async () => {
  console.log('=== Testing Questionnaire Data Load ===\n');
  
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(conn);
  
  // Get the Annual Reps & Certs questionnaire
  const [questionnaire] = await db
    .select()
    .from(questionnaires)
    .where(eq(questionnaires.id, 30003))
    .limit(1);
  
  if (!questionnaire) {
    console.error('❌ Questionnaire not found');
    await conn.end();
    return;
  }
  
  console.log(`✓ Found questionnaire: ${questionnaire.title}`);
  console.log(`  ID: ${questionnaire.id}`);
  console.log(`  Description: ${questionnaire.description}\n`);
  
  // Get all questions
  const allQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.questionnaireId, questionnaire.id))
    .orderBy(questions.sortOrder);
  
  console.log(`✓ Loaded ${allQuestions.length} questions\n`);
  
  // Get all response options
  const questionIds = allQuestions.map(q => q.id).filter((id): id is number => id !== null);
  const allResponses = questionIds.length > 0
    ? await db
        .select()
        .from(responses)
        .where(inArray(responses.questionId, questionIds))
    : [];
  
  console.log(`✓ Loaded ${allResponses.length} response options\n`);
  
  // Group responses by questionId
  const responsesByQuestion = new Map<number, typeof allResponses>();
  for (const response of allResponses) {
    const qid = response.questionId;
    if (qid !== null) {
      if (!responsesByQuestion.has(qid)) {
        responsesByQuestion.set(qid, []);
      }
      responsesByQuestion.get(qid)!.push(response);
    }
  }
  
  // Display summary by question type
  const typeStats = new Map<number, { count: number; withResponses: number }>();
  
  for (const question of allQuestions) {
    const type = question.responseType || 0;
    if (!typeStats.has(type)) {
      typeStats.set(type, { count: 0, withResponses: 0 });
    }
    const stats = typeStats.get(type)!;
    stats.count++;
    
    const questionResponses = responsesByQuestion.get(question.id) || [];
    if (questionResponses.length > 0) {
      stats.withResponses++;
    }
  }
  
  console.log('=== Question Type Summary ===');
  const typeNames: Record<number, string> = {
    1: 'Y/N',
    2: 'Y/N/NA',
    3: 'TEXT',
    4: 'DROPDOWN',
    5: 'DATE',
    6: 'CHECKBOX/LIST',
    7: 'CHECKBOX (single)',
    8: 'List2List',
  };
  
  for (const [type, stats] of Array.from(typeStats.entries()).sort((a, b) => a[0] - b[0])) {
    const typeName = typeNames[type] || `Type ${type}`;
    console.log(`  ${typeName.padEnd(20)} ${stats.count} questions, ${stats.withResponses} with response options`);
  }
  
  // Show first 5 questions with details
  console.log('\n=== Sample Questions ===');
  for (let i = 0; i < Math.min(5, allQuestions.length); i++) {
    const q = allQuestions[i];
    const qResponses = responsesByQuestion.get(q.id) || [];
    console.log(`\n${i + 1}. QID ${q.questionnaireId} (Type ${q.responseType}): ${q.title}`);
    console.log(`   Question: ${q.question?.substring(0, 100)}...`);
    if (qResponses.length > 0) {
      console.log(`   Response options (${qResponses.length}):`);
      qResponses.forEach((r, idx) => {
        console.log(`     ${idx + 1}. ${r.description} (code: ${r.zcode})`);
      });
    }
  }
  
  console.log('\n=== Test Complete ===');
  console.log(`✓ ${allQuestions.length}/82 questions loaded`);
  console.log(`✓ ${allResponses.length} response options loaded`);
  console.log(`✓ ${responsesByQuestion.size} questions have response options`);
  
  if (allQuestions.length === 82) {
    console.log('\n🎉 SUCCESS: All 82 questions imported and loadable!');
  } else {
    console.log(`\n⚠️  WARNING: Expected 82 questions, found ${allQuestions.length}`);
  }
  
  await conn.end();
})();
