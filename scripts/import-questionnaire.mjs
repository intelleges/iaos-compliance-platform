/**
 * Import Annual Reps & Certs questionnaire from JSON data
 * 
 * Usage: node scripts/import-questionnaire.mjs
 */

import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '../drizzle/schema.js';

const { questionnaires, questions, responses } = schema;

// Load questionnaire data
const data = JSON.parse(readFileSync('/home/ubuntu/upload/questionnaire_data.json', 'utf8'));

// Map Excel response types to database responseType IDs
const RESPONSE_TYPE_MAP = {
  'Y/N': 5,  // YES_NO
  'Y/N/NA': 5,  // YES_NO (with NA option)
  'CHECKBOX': 6,  // CHECKBOX
  'TEXT': 1,  // TEXT_SHORT
  'TEXTAREA': 2,  // TEXT_LONG
  'DROPDOWN': 4,  // RADIO (dropdown is single-choice)
  'RADIO': 4,  // RADIO
  'DATE': 9,  // DATE
  'FILE': 7,  // FILE_UPLOAD
  'NUMBER': 1,  // TEXT_SHORT (numbers stored as text)
  'DOLLAR': 1,  // TEXT_SHORT (dollar amounts stored as text)
  'TEXT_NUMBER_6': 1,  // TEXT_SHORT
  'TEXT_NUMBER_9': 1,  // TEXT_SHORT
  'TEXT_NUMBER_12': 1,  // TEXT_SHORT
  'LIST': 6,  // CHECKBOX (multi-select)
  'List2List': 6,  // CHECKBOX (multi-select with Z-Code encoding)
};

async function main() {
  // Connect to database
  const db = drizzle(process.env.DATABASE_URL);
  
  console.log('Starting questionnaire import...');
  console.log(`Total questions to import: ${data.questions.length}`);
  
  // Create questionnaire
  const [questionnaire] = await db.insert(questionnaires).values({
    name: data.questionnaire.name,
    description: data.questionnaire.description,
    protocol: data.questionnaire.protocol,
    active: true,
    locked: false,
  });
  
  const questionnaireId = Number(questionnaire.insertId);
  console.log(`Created questionnaire: ${data.questionnaire.name} (ID: ${questionnaireId})`);
  
  // Import questions
  let importedCount = 0;
  for (const q of data.questions) {
    try {
      // Determine responseType
      let responseType = RESPONSE_TYPE_MAP[q.responseType];
      if (!responseType) {
        // Handle complex dropdown/list types with options
        if (q.responseType.startsWith('DROPDOWN:')) {
          responseType = 4; // RADIO
        } else if (q.responseType.startsWith('LIST:')) {
          responseType = 6; // CHECKBOX
        } else if (q.responseType.startsWith('List2List:')) {
          responseType = 6; // CHECKBOX
        } else {
          console.warn(`Unknown response type: ${q.responseType}, defaulting to TEXT_SHORT`);
          responseType = 1;
        }
      }
      
      // Insert question
      const [question] = await db.insert(questions).values({
        questionnaireId,
        title: q.title || `Question ${q.qid}`,
        question: q.question,
        name: q.title,
        tag: q.section,
        responseType,
        required: q.required,
        weight: q.qWeight,
        hintText: q.commentBoxText || null,
        skipLogicAnswer: q.skipLogic ? q.skipLogicAnswer : null,
        skipLogicJump: q.skipLogic ? q.skipLogicJump : null,
        commentRequired: q.commentType ? true : false,
        commentBoxTxt: q.commentBoxText || null,
        commentType: q.commentType || null,
        isCUI: false,
        sortOrder: q.page || 0,
        active: true,
      });
      
      const questionId = Number(question.insertId);
      
      // Parse and insert response options for dropdown/list types
      if (q.responseType.startsWith('DROPDOWN:') || q.responseType.startsWith('LIST:')) {
        const optionsStr = q.responseType.split(':')[1];
        const options = optionsStr.split(';').map(opt => {
          const match = opt.match(/^(.+?)\(([A-Z]{2})\)$/);
          if (match) {
            return { text: match[1], code: match[2] };
          }
          return { text: opt, code: null };
        });
        
        for (let i = 0; i < options.length; i++) {
          await db.insert(responses).values({
            questionId,
            responseText: options[i].text,
            responseCode: options[i].code,
            sortOrder: i,
          });
        }
      }
      
      // Parse and insert List2List options with Z-Code encoding
      if (q.responseType.startsWith('List2List:')) {
        const optionsStr = q.responseType.split(':')[1];
        const options = optionsStr.split(';').map(opt => {
          const parts = opt.split('|');
          return {
            text: parts[0],
            description: parts[1],
            zCode: parseInt(parts[2]),
          };
        });
        
        for (let i = 0; i < options.length; i++) {
          await db.insert(responses).values({
            questionId,
            responseText: options[i].text,
            responseCode: options[i].zCode.toString(),
            sortOrder: i,
          });
        }
      }
      
      importedCount++;
      if (importedCount % 10 === 0) {
        console.log(`Imported ${importedCount}/${data.questions.length} questions...`);
      }
    } catch (error) {
      console.error(`Error importing question ${q.qid}:`, error.message);
    }
  }
  
  console.log(`\nImport complete!`);
  console.log(`Questionnaire ID: ${questionnaireId}`);
  console.log(`Questions imported: ${importedCount}/${data.questions.length}`);
  
  process.exit(0);
}

main().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});
