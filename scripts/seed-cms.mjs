import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

// CMS Content - Default English values
// These match the keys defined in IntellegesQMS.tsx
const defaultCMSContent = [
  // Access Code Page
  { key: 'ACCESS_CODE_TITLE', languageCode: 'en', text: '2025 Supplier Certifications and Assessment', page: 'access_code', category: 'title' },
  { key: 'ACCESS_CODE_SUBTITLE', languageCode: 'en', text: 'Complete your annual compliance verification', page: 'access_code', category: 'subtitle' },
  { key: 'ACCESS_CODE_PANEL_ONE', languageCode: 'en', text: 'The Supplier Certification and Assessment Questionnaire is designed to ensure our supply base can comply with several U.S. Government statutory/regulatory requirements.', page: 'access_code', category: 'instruction' },
  { key: 'ACCESS_CODE_PANEL_TWO', languageCode: 'en', text: '<b>Instructions:</b> Enter your Access Code from your invitation email in the applicable field below to begin the online questionnaire.', page: 'access_code', category: 'instruction' },
  { key: 'ACCESS_CODE_LABEL', languageCode: 'en', text: 'Access Code:', page: 'access_code', category: 'label' },
  { key: 'ACCESS_CODE_SUBMIT_TEXT', languageCode: 'en', text: 'SUBMIT', page: 'access_code', category: 'button' },
  
  // Save for Later
  { key: 'SAVE_FOR_LATER_TEXT', languageCode: 'en', text: 'SAVE FOR LATER', page: 'save_later', category: 'button' },
  { key: 'SAVE_EXIT_DIALOG_TITLE', languageCode: 'en', text: 'Save Progress & Exit', page: 'save_later', category: 'title' },
  { key: 'SAVE_EXIT_DIALOG_MESSAGE', languageCode: 'en', text: 'Your progress has been automatically saved. You can resume this questionnaire anytime using your access code.', page: 'save_later', category: 'message' },
  { key: 'SAVE_EXIT_RESUME_LABEL', languageCode: 'en', text: 'Your Access Code:', page: 'save_later', category: 'label' },
  { key: 'SAVE_EXIT_COPY_BUTTON', languageCode: 'en', text: 'Copy Access Code', page: 'save_later', category: 'button' },
  { key: 'SAVE_EXIT_COPIED_TOAST', languageCode: 'en', text: 'Access code copied to clipboard!', page: 'save_later', category: 'message' },
  { key: 'SAVE_EXIT_INSTRUCTIONS', languageCode: 'en', text: 'To resume later, simply return to the login page and enter this access code. All your responses will be preserved.', page: 'save_later', category: 'instruction' },
  { key: 'SAVE_EXIT_CLOSE_BUTTON', languageCode: 'en', text: 'Close & Exit', page: 'save_later', category: 'button' },
  
  // Questionnaire Page
  { key: 'QUESTIONNAIRE_PAGE_TITLE', languageCode: 'en', text: '2025 Supplier Certifications and Assessment', page: 'questionnaire', category: 'title' },
  { key: 'QUESTIONNAIRE_PDF', languageCode: 'en', text: 'Questionnaire (PDF)', page: 'questionnaire', category: 'link' },
  { key: 'QUESTIONNAIRE_FAQ', languageCode: 'en', text: 'FAQ', page: 'questionnaire', category: 'link' },
  
  // Company Page
  { key: 'COMPANY_PAGE_TITLE', languageCode: 'en', text: '2025 Supplier Certifications and Assessment', page: 'company_view', category: 'title' },
  { key: 'COMPANY_PAGE_NEXT_TEXT', languageCode: 'en', text: 'CORRECT', page: 'company_view', category: 'button' },
  { key: 'COMPANY_PAGE_PREVIOUS_TEXT', languageCode: 'en', text: 'MODIFY', page: 'company_view', category: 'button' },
  
  // Contact Page
  { key: 'CONTACT_PAGE_TITLE', languageCode: 'en', text: '2025 Supplier Certifications and Assessment', page: 'contact_view', category: 'title' },
  { key: 'CONTACT_PAGE_NEXT_TEXT', languageCode: 'en', text: 'CORRECT', page: 'contact_view', category: 'button' },
  { key: 'CONTACT_PAGE_PREVIOUS_TEXT', languageCode: 'en', text: 'MODIFY', page: 'contact_view', category: 'button' },
  
  // E-Signature Page
  { key: 'ESIGNATURE_PAGE_TITLE', languageCode: 'en', text: '2025 Supplier Certifications and Assessment', page: 'esignature', category: 'title' },
  { key: 'ESIGNATURE_PAGE_NEXT_TEXT', languageCode: 'en', text: 'SUBMIT', page: 'esignature', category: 'button' },
  { key: 'ESIGNATURE_PAGE_PREVIOUS_TEXT', languageCode: 'en', text: 'PREVIOUS', page: 'esignature', category: 'button' },
  
  // Confirmation Page
  { key: 'CONFIRMATION_PAGE_TITLE', languageCode: 'en', text: '2025 Supplier Certifications and Assessment', page: 'confirmation', category: 'title' },
  { key: 'CONFIRMATION_PAGE_HEADLINE', languageCode: 'en', text: 'Submission Complete', page: 'confirmation', category: 'title' },
  { key: 'CONFIRMATION_PAGE_NEXT_TEXT', languageCode: 'en', text: 'EXIT', page: 'confirmation', category: 'button' },
];

async function seedCMS() {
  console.log('🌱 Seeding CMS content...');
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);
  
  try {
    // Insert all CMS content
    for (const content of defaultCMSContent) {
      await connection.execute(
        `INSERT INTO cmsContent (\`key\`, languageCode, text, page, category, isActive, version)
         VALUES (?, ?, ?, ?, ?, true, 1)
         ON DUPLICATE KEY UPDATE text = VALUES(text), page = VALUES(page), category = VALUES(category)`,
        [content.key, content.languageCode, content.text, content.page, content.category]
      );
    }
    
    console.log(`✅ Successfully seeded ${defaultCMSContent.length} CMS entries`);
  } catch (error) {
    console.error('❌ Error seeding CMS:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedCMS()
  .then(() => {
    console.log('✅ CMS seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ CMS seed failed:', error);
    process.exit(1);
  });
