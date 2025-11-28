import { drizzle } from 'drizzle-orm/mysql2';
import { eq, like } from 'drizzle-orm';
import { questions } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

async function fixAllYNQuestions() {
  console.log('Finding all Y/N questions with incorrect responseType...\n');
  
  // Get all questions for the questionnaire
  const allQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.questionnaireId, 30003));
  
  console.log(`Total questions in questionnaire: ${allQuestions.length}\n`);
  
  // Find Y/N questions (name starts with "yn" or contains "yn")
  const ynQuestions = allQuestions.filter(q => 
    q.name && (q.name.toLowerCase().startsWith('yn') || q.name.toLowerCase().includes('yn'))
  );
  
  console.log(`Found ${ynQuestions.length} Y/N questions:\n`);
  
  let fixedCount = 0;
  
  for (const q of ynQuestions) {
    const needsFix = q.responseType !== 1;
    console.log(`${q.name} (ID: ${q.id})`);
    console.log(`  Current responseType: ${q.responseType} ${needsFix ? '❌ WRONG' : '✅ CORRECT'}`);
    
    if (needsFix) {
      await db
        .update(questions)
        .set({ responseType: 1 })
        .where(eq(questions.id, q.id));
      console.log(`  → Fixed to responseType: 1`);
      fixedCount++;
    }
    console.log('');
  }
  
  console.log(`\n✅ Fixed ${fixedCount} out of ${ynQuestions.length} Y/N questions`);
  
  // Also check for questions that should be type 5 (Date) but aren't
  console.log('\n--- Checking Date questions ---');
  const dateQuestions = allQuestions.filter(q => 
    q.name && (
      q.name.toLowerCase().includes('date') || 
      q.name.toLowerCase().includes('calendar') ||
      q.name.toLowerCase().includes('duedate')
    )
  );
  
  console.log(`Found ${dateQuestions.length} potential date questions:\n`);
  
  for (const q of dateQuestions) {
    const isCorrect = q.responseType === 5 || q.responseType === 9;
    console.log(`${q.name} (ID: ${q.id}) - responseType: ${q.responseType} ${isCorrect ? '✅' : '⚠️'}`);
  }
  
  process.exit(0);
}

fixAllYNQuestions().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
