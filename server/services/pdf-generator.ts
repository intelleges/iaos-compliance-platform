import PDFDocument from 'pdfkit';
import { getDb } from '../db';
import { partnerQuestionnaires, partners, touchpointQuestionnaires, questionnaires, touchpoints } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate a PDF receipt for a questionnaire submission
 * 
 * @param assignmentId - Partner questionnaire assignment ID
 * @returns PDF buffer
 */
export async function generateSubmissionReceipt(assignmentId: number): Promise<Buffer> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  // Fetch submission data with all related information
  const submissions = await db
    .select({
      assignment: partnerQuestionnaires,
      partner: partners,
      touchpointQuestionnaire: touchpointQuestionnaires,
      questionnaire: questionnaires,
      touchpoint: touchpoints,
    })
    .from(partnerQuestionnaires)
    .leftJoin(partners, eq(partnerQuestionnaires.partnerId, partners.id))
    .leftJoin(touchpointQuestionnaires, eq(partnerQuestionnaires.touchpointQuestionnaireId, touchpointQuestionnaires.id))
    .leftJoin(questionnaires, eq(touchpointQuestionnaires.questionnaireId, questionnaires.id))
    .leftJoin(touchpoints, eq(touchpointQuestionnaires.touchpointId, touchpoints.id))
    .where(eq(partnerQuestionnaires.id, assignmentId))
    .limit(1);

  if (!submissions || submissions.length === 0) {
    throw new Error('Submission not found');
  }

  const data = submissions[0];
  const assignment = data.assignment;
  const partner = data.partner;
  const questionnaire = data.questionnaire;
  const touchpoint = data.touchpoint;

  // Parse e-signature data from eSignature field (stores metadata as JSON)
  let signatureData: any = null;
  try {
    if (assignment.eSignature) {
      // eSignature field contains JSON with signature metadata
      signatureData = JSON.parse(assignment.eSignature);
    }
  } catch (error) {
    console.error('Failed to parse signature data:', error);
  }

  // Generate confirmation number
  const confirmationNumber = `${assignmentId}-${assignment.completedDate ? new Date(assignment.completedDate).getTime() : Date.now()}`;

  // Create PDF document
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('Questionnaire Submission Receipt', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').fillColor('#666666').text('Federal Compliance Management System', { align: 'center' });
  doc.moveDown(2);

  // Confirmation Number (prominent)
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text('Confirmation Number:', { continued: false });
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#2563eb').text(confirmationNumber, { align: 'center' });
  doc.moveDown(2);

  // Submission Details Section
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('Submission Details');
  doc.moveDown(0.5);
  drawHorizontalLine(doc);
  doc.moveDown(0.5);

  doc.fontSize(10).font('Helvetica');
  addField(doc, 'Submitted Date:', assignment.completedDate ? new Date(assignment.completedDate).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }) : 'N/A');
  
  addField(doc, 'Questionnaire:', questionnaire?.title || 'N/A');
  addField(doc, 'Touchpoint:', touchpoint?.title || 'N/A');
  addField(doc, 'Status:', 'SUBMITTED');
  addField(doc, 'Progress:', '100%');
  doc.moveDown(1);

  // Company Information Section
  doc.fontSize(14).font('Helvetica-Bold').text('Company Information');
  doc.moveDown(0.5);
  drawHorizontalLine(doc);
  doc.moveDown(0.5);

  doc.fontSize(10).font('Helvetica');
  addField(doc, 'Company Name:', partner?.name || 'N/A');
  addField(doc, 'CAGE Code:', partner?.cageCode || 'N/A');
  addField(doc, 'DUNS Number:', partner?.dunsNumber || 'N/A');
  
  if (partner?.address1) {
    const addressParts = [
      partner.address1,
      partner.address2,
      [partner.city, partner.state, partner.zipcode].filter(Boolean).join(', '),
      partner.countryCode
    ].filter(Boolean);
    addField(doc, 'Address:', addressParts.join('\n           '));
  }
  doc.moveDown(1);

  // Contact Information Section
  doc.fontSize(14).font('Helvetica-Bold').text('Contact Information');
  doc.moveDown(0.5);
  drawHorizontalLine(doc);
  doc.moveDown(0.5);

  doc.fontSize(10).font('Helvetica');
  if (partner?.firstName || partner?.lastName) {
    addField(doc, 'Contact Name:', `${partner.firstName || ''} ${partner.lastName || ''}`.trim());
  }
  addField(doc, 'Email:', partner?.email || 'N/A');
  addField(doc, 'Phone:', partner?.phone || 'N/A');
  if (partner?.title) {
    addField(doc, 'Job Title:', partner.title);
  }
  doc.moveDown(1);

  // E-Signature Section
  if (signatureData) {
    doc.fontSize(14).font('Helvetica-Bold').text('Electronic Signature');
    doc.moveDown(0.5);
    drawHorizontalLine(doc);
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica');
    addField(doc, 'Signed By:', `${signatureData.firstName || ''} ${signatureData.lastName || ''}`.trim());
    addField(doc, 'Email:', signatureData.email || 'N/A');
    addField(doc, 'Signature Date:', signatureData.timestamp ? new Date(signatureData.timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }) : 'N/A');
    addField(doc, 'IP Address:', signatureData.ipAddress || 'N/A');
    doc.moveDown(0.5);

    // Attestation statement
    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666666');
    doc.text('The signer hereby certifies that they are an authorized representative and that the information provided in this questionnaire is true, accurate, and complete to the best of their knowledge. This electronic signature has the same legal effect as a handwritten signature.', {
      align: 'justify',
      width: 500
    });
    doc.moveDown(1);
  }

  // Footer
  doc.fontSize(8).fillColor('#999999').font('Helvetica');
  const footerY = doc.page.height - 80;
  doc.y = footerY;
  drawHorizontalLine(doc);
  doc.moveDown(0.3);
  doc.text('This is an official receipt for your questionnaire submission. Please retain this document for your records.', { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleString('en-US')}`, { align: 'center' });
  doc.text('Federal Compliance Management System - Intelleges', { align: 'center' });

  // Finalize PDF
  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);
  });
}

/**
 * Helper function to add a labeled field to the PDF
 */
function addField(doc: PDFKit.PDFDocument, label: string, value: string) {
  const x = doc.x;
  const y = doc.y;
  
  doc.font('Helvetica-Bold').fillColor('#000000').text(label, x, y, { width: 120, continued: false });
  doc.font('Helvetica').fillColor('#333333').text(value, x + 120, y, { width: 380 });
  doc.moveDown(0.3);
}

/**
 * Helper function to draw a horizontal line
 */
function drawHorizontalLine(doc: PDFKit.PDFDocument) {
  const y = doc.y;
  doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
}
