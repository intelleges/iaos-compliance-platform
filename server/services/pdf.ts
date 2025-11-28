import PDFDocument from "pdfkit";
import { getDb } from "../db";
import { partnerQuestionnaires, questions, questionnaireResponses, partners, questionnaires } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface QuestionnaireData {
  assignmentId: number;
  partnerName: string;
  questionnaireName: string;
  submittedAt: Date;
  eSignature: string | null;
  questions: Array<{
    id: number;
    text: string;
    responseType: number | null;
    required: boolean | null;
    response: string | null;
    comment: string | null;
  }>;
}

/**
 * Generate PDF for submitted questionnaire
 * Per INT.DOC.12 Section 5.3: Create signed PDF for compliance audit trail
 */
export async function generateQuestionnairePDF(assignmentId: number): Promise<Buffer> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Fetch assignment data
  const assignment = await db
    .select()
    .from(partnerQuestionnaires)
    .where(eq(partnerQuestionnaires.id, assignmentId))
    .limit(1);

  if (!assignment || assignment.length === 0) {
    throw new Error(`Assignment ${assignmentId} not found`);
  }

  const assignmentData = assignment[0];

  // Fetch partner data
  const partner = await db
    .select()
    .from(partners)
    .where(eq(partners.id, assignmentData.partnerId))
    .limit(1);

  if (!partner || partner.length === 0) {
    throw new Error(`Partner not found for assignment ${assignmentId}`);
  }

  const partnerData = partner[0];

  // Fetch questionnaire data (need to join through touchpointQuestionnaires)
  // For now, use a placeholder - this would need proper join logic
  const questionnaireName = "Federal Compliance Questionnaire";

  // Fetch all responses for this assignment
  const responses = await db
    .select()
    .from(questionnaireResponses)
    .where(eq(questionnaireResponses.partnerQuestionnaireId, assignmentId));

  // Fetch all questions (simplified - would need proper join)
  const allQuestions = await db
    .select()
    .from(questions)
    .limit(100); // Placeholder

  // Map responses to questions
  const questionData = allQuestions.map(q => {
    const response = responses.find(r => r.questionId === q.id);
    return {
      id: q.id,
      text: q.question || q.title || "Question",
      responseType: q.responseType,
      required: q.required,
      response: response?.value?.toString() || null,
      comment: response?.comment || null,
    };
  });

  // Create PDF
  return createPDF({
    assignmentId,
    partnerName: partnerData.name || "Unknown Partner",
    questionnaireName: questionnaireName || "Unknown Questionnaire",
    submittedAt: assignmentData.completedDate || new Date(),
    eSignature: assignmentData.eSignature || null,
    questions: questionData,
  });
}

/**
 * Create PDF document from questionnaire data
 */
function createPDF(data: QuestionnaireData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "LETTER", margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("Federal Compliance Questionnaire", { align: "center" });

      doc.moveDown();

      // Metadata
      doc
        .fontSize(12)
        .font("Helvetica")
        .text(`Partner: ${data.partnerName}`)
        .text(`Questionnaire: ${data.questionnaireName}`)
        .text(`Submitted: ${data.submittedAt.toLocaleString()}`)
        .text(`Assignment ID: ${data.assignmentId}`);

      doc.moveDown(2);

      // Questions and Responses
      doc.fontSize(14).font("Helvetica-Bold").text("Responses", { underline: true });
      doc.moveDown();

      data.questions.forEach((q, index) => {
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(`${index + 1}. ${q.text}${q.required ? " *" : ""}`, {
            continued: false,
          });

        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#666666")
          .text(`Type: ${q.responseType}`, { indent: 20 });

        if (q.response) {
          doc
            .fillColor("#000000")
            .font("Helvetica")
            .text(`Answer: ${q.response}`, { indent: 20 });
        } else {
          doc
            .fillColor("#999999")
            .font("Helvetica-Oblique")
            .text("No response provided", { indent: 20 });
        }

        if (q.comment) {
          doc
            .fillColor("#000000")
            .font("Helvetica-Oblique")
            .text(`Comment: ${q.comment}`, { indent: 20 });
        }

        doc.moveDown();

        // Page break if needed
        if (doc.y > 700) {
          doc.addPage();
        }
      });

      // E-Signature
      if (data.eSignature) {
        doc.addPage();
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor("#000000")
          .text("Electronic Signature", { underline: true });

        doc.moveDown();

        doc
          .fontSize(10)
          .font("Helvetica")
          .text(
            "I certify that the information provided in this questionnaire is accurate and complete to the best of my knowledge."
          );

        doc.moveDown();

        // Add signature image
        try {
          const base64Data = data.eSignature.replace(/^data:image\/\w+;base64,/, "");
          const imageBuffer = Buffer.from(base64Data, "base64");
          doc.image(imageBuffer, {
            fit: [200, 100],
          });
        } catch (err) {
          doc
            .fontSize(10)
            .font("Helvetica-Oblique")
            .fillColor("#999999")
            .text("[Signature image could not be embedded]");
        }

        doc.moveDown();
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#000000")
          .text(`Signed on: ${data.submittedAt.toLocaleString()}`);
      }

      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .font("Helvetica")
          .fillColor("#666666")
          .text(
            `Page ${i + 1} of ${pageCount} | Generated: ${new Date().toLocaleString()}`,
            50,
            doc.page.height - 50,
            { align: "center" }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
