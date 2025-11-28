#!/usr/bin/env node
/**
 * Test script to populate questionnaire responses for submission testing
 * This script fills out all 82 questions with sample data to test the submission workflow
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import { questionnaireResponses, questions } from '../drizzle/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('🔌 Connecting to database...');
const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

// Test data
const ASSIGNMENT_ID = 1; // Test assignment for Test Supplier Inc.
const QUESTIONNAIRE_ID = 30003; // Annual Reps and Certs

console.log('📋 Fetching all questions...');
const allQuestions = await db
  .select()
  .from(questions)
  .where(eq(questions.questionnaireId, QUESTIONNAIRE_ID))
  .orderBy(questions.sortOrder);

console.log(`✅ Found ${allQuestions.length} questions`);

// Generate sample responses based on question type
function generateSampleResponse(question) {
  const { responseType, question: questionText } = question;
  
  // Type 1: Y/N Radio
  if (responseType === 1) {
    return Math.random() > 0.5 ? 'Yes' : 'No';
  }
  
  // Type 2: Text (short or long)
  if (responseType === 2) {
    if (questionText.toLowerCase().includes('email')) {
      return 'test@example.com';
    }
    if (questionText.toLowerCase().includes('phone')) {
      return '555-123-4567';
    }
    if (questionText.toLowerCase().includes('address')) {
      return '123 Main Street, Suite 100';
    }
    if (questionText.toLowerCase().includes('number') || questionText.toLowerCase().includes('dollar')) {
      return '1000000';
    }
    return 'Sample text response for testing purposes';
  }
  
  // Type 4: Dropdown
  if (responseType === 4) {
    // Return first option if available
    return 'Option 1';
  }
  
  // Type 5 or 9: Date
  if (responseType === 5 || responseType === 9) {
    return '2025-12-31';
  }
  
  // Type 6: Checkbox/List
  if (responseType === 6) {
    return JSON.stringify(['Option 1', 'Option 2']);
  }
  
  // Type 7: File upload (skip for now)
  if (responseType === 7) {
    return null;
  }
  
  // Default
  return 'Sample response';
}

console.log('💾 Populating responses...');
let savedCount = 0;
let skippedCount = 0;

for (const question of allQuestions) {
  const response = generateSampleResponse(question);
  
  if (response === null) {
    console.log(`⏭️  Skipping question ${question.id} (${question.question}) - file upload`);
    skippedCount++;
    continue;
  }
  
  try {
    // Check if response already exists
    const existing = await db
      .select()
      .from(questionnaireResponses)
      .where(
        and(
          eq(questionnaireResponses.assignmentId, ASSIGNMENT_ID),
          eq(questionnaireResponses.questionId, question.id)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing response
      await db
        .update(questionnaireResponses)
        .set({
          response: response,
          updatedAt: new Date(),
        })
        .where(eq(questionnaireResponses.id, existing[0].id));
      
      console.log(`✏️  Updated Q${question.sortOrder}: ${question.question.substring(0, 40)}...`);
    } else {
      // Insert new response
      await db.insert(questionnaireResponses).values({
        assignmentId: ASSIGNMENT_ID,
        questionId: question.id,
        response: response,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log(`✅ Saved Q${question.sortOrder}: ${question.question.substring(0, 40)}...`);
    }
    
    savedCount++;
  } catch (error) {
    console.error(`❌ Error saving response for question ${question.id}:`, error.message);
  }
}

console.log('\n📊 Summary:');
console.log(`   Total questions: ${allQuestions.length}`);
console.log(`   Responses saved: ${savedCount}`);
console.log(`   Skipped: ${skippedCount}`);
console.log(`   Completion: ${Math.round((savedCount / allQuestions.length) * 100)}%`);

await connection.end();
console.log('\n✅ Done!');
