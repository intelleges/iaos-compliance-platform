import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { partnerQuestionnaires, touchpointQuestionnaires, questionnaires, questions } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

async function fixQuestions() {
  console.log('Finding questionnaire ID for access code DDSETM9RNAHB...');
  
  // Get the assignment and questionnaire ID
  const assignments = await db
    .select({
      assignmentId: partnerQuestionnaires.id,
      touchpointQuestionnaireId: touchpointQuestionnaires.id,
      questionnaireId: touchpointQuestionnaires.questionnaireId,
      questionnaireTitle: questionnaires.title,
    })
    .from(partnerQuestionnaires)
    .leftJoin(touchpointQuestionnaires, eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id))
    .leftJoin(questionnaires, eq(touchpointQuestionnaires.questionnaireId, questionnaires.id))
    .where(eq(partnerQuestionnaires.accessCode, 'DDSETM9RNAHB'))
    .limit(1);
  
  if (assignments.length === 0) {
    console.error('No assignment found for access code DDSETM9RNAHB');
    process.exit(1);
  }
  
  const assignment = assignments[0];
  console.log('Assignment found:', assignment);
  
  const targetQuestionnaireId = assignment.questionnaireId;
  
  if (!targetQuestionnaireId) {
    console.error('Assignment has no questionnaire ID');
    process.exit(1);
  }
  
  console.log(`\nTarget questionnaire ID: ${targetQuestionnaireId}`);
  console.log(`Questionnaire title: ${assignment.questionnaireTitle}`);
  
  // Check how many questions are currently linked to this questionnaire
  const existingQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.questionnaireId, targetQuestionnaireId));
  
  console.log(`\nCurrent questions linked to questionnaire ${targetQuestionnaireId}: ${existingQuestions.length}`);
  
  if (existingQuestions.length > 0) {
    console.log('Questions already exist! Listing them:');
    existingQuestions.forEach((q, idx) => {
      console.log(`  ${idx + 1}. ${q.title} (ID: ${q.id}, Type: ${q.responseType})`);
    });
    console.log('\nNo fix needed - questions are already linked correctly.');
    process.exit(0);
  }
  
  // Find questions that might be linked to wrong questionnaire
  const allQuestions = await db
    .select()
    .from(questions)
    .limit(20);
  
  console.log(`\nTotal questions in database: ${allQuestions.length}`);
  
  if (allQuestions.length === 0) {
    console.log('No questions found in database. Creating sample questions...');
    
    // Insert sample questions
    await db.insert(questions).values([
      {
        questionnaireId: targetQuestionnaireId,
        title: 'Is your company classified as a small business?',
        responseType: 1, // Y/N
        required: true,
        sortOrder: 1,
      },
      {
        questionnaireId: targetQuestionnaireId,
        title: 'Please provide your CAGE code',
        responseType: 2, // Text
        required: true,
        sortOrder: 2,
      },
      {
        questionnaireId: targetQuestionnaireId,
        title: 'What is your fiscal year end date?',
        responseType: 3, // Date
        required: true,
        sortOrder: 3,
      },
      {
        questionnaireId: targetQuestionnaireId,
        title: 'Primary business type',
        responseType: 4, // Dropdown
        required: true,
        sortOrder: 4,
      },
      {
        questionnaireId: targetQuestionnaireId,
        title: 'Select all certifications held',
        responseType: 5, // Checkbox
        required: false,
        sortOrder: 5,
      },
    ]);
    
    console.log('✅ Created 5 sample questions');
  } else {
    console.log('\nUpdating existing questions to link to correct questionnaire...');
    
    // Update the first 5 questions to link to the target questionnaire
    const questionsToUpdate = allQuestions.slice(0, 5);
    
    for (const q of questionsToUpdate) {
      await db
        .update(questions)
        .set({ questionnaireId: targetQuestionnaireId })
        .where(eq(questions.id, q.id));
      console.log(`  Updated question ${q.id}: "${q.title}"`);
    }
    
    console.log(`\n✅ Updated ${questionsToUpdate.length} questions to link to questionnaire ${targetQuestionnaireId}`);
  }
  
  // Verify the fix
  const updatedQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.questionnaireId, targetQuestionnaireId));
  
  console.log(`\n✅ Final verification: ${updatedQuestions.length} questions now linked to questionnaire ${targetQuestionnaireId}`);
  
  process.exit(0);
}

fixQuestions().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
