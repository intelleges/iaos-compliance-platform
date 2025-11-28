import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { questions } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

async function fixResponseTypes() {
  console.log('Checking question responseType values...\n');
  
  // Get the first 10 questions
  const allQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.questionnaireId, 30003))
    .limit(15);
  
  console.log('First 15 questions:');
  allQuestions.forEach((q, idx) => {
    console.log(`${idx + 1}. ${q.title || q.name} - responseType: ${q.responseType}`);
  });
  
  console.log('\n--- Response Type Mapping ---');
  console.log('1 = Y/N Radio');
  console.log('2 = Text');
  console.log('4 = Dropdown');
  console.log('5 = Date');
  console.log('6 = Checkbox/List');
  console.log('9 = Date (alternative)');
  
  // The issue: questions with names like "ynExample" have responseType = 5 (Date)
  // but should have responseType = 1 (Y/N)
  
  console.log('\n--- Fixing incorrect responseType values ---');
  
  const fixes = [
    { name: 'ynExample', correctType: 1, reason: 'Y/N question' },
    { name: 'ynnaExample', correctType: 1, reason: 'Y/N question' },
    { name: 'checkboxExample', correctType: 6, reason: 'Checkbox question' },
  ];
  
  for (const fix of fixes) {
    const question = allQuestions.find(q => q.name === fix.name);
    if (question) {
      console.log(`\nFixing "${fix.name}":`);
      console.log(`  Current responseType: ${question.responseType}`);
      console.log(`  Correct responseType: ${fix.correctType} (${fix.reason})`);
      
      if (question.responseType !== fix.correctType) {
        await db
          .update(questions)
          .set({ responseType: fix.correctType })
          .where(eq(questions.id, question.id));
        console.log(`  ✅ Updated to ${fix.correctType}`);
      } else {
        console.log(`  ℹ️  Already correct`);
      }
    } else {
      console.log(`\n⚠️  Question "${fix.name}" not found`);
    }
  }
  
  console.log('\n✅ Response type fixes complete!');
  process.exit(0);
}

fixResponseTypes().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
