import { describe, expect, it } from "vitest";
import {
  parseQMSExcel,
  validateQMSRow,
  qmsRowToQuestion,
  qmsRowToQuestionUpdate,
  convertResponseType,
  type QMSRow,
} from "./services/qms-parser";
import * as XLSX from "xlsx";

/**
 * Unit tests for QMS Excel Parser
 *
 * Tests the parsing, validation, and conversion logic for QMS Excel imports.
 * Expected: 82 questions from intelleges_qms_reference.xlsx template
 */

// Helper to create a mock QMS row
function createMockQMSRow(overrides: Partial<QMSRow> = {}): QMSRow {
  return {
    QID: 1,
    Page: 1,
    Surveyset: "1. Response Types",
    Survey: "Test Questionnaire",
    Question: "What is your company name?",
    Response: "TEXT",
    Title: "company_name",
    Required: 1,
    Length: 0,
    titleLength: 0,
    skipLogic: "",
    skipLogicAnswer: "",
    skipLogicJump: 0,
    CommentBoxMessageText: "",
    UploadMessageText: "",
    CalendarMessageText: "",
    CommentType: "",
    yValue: 1,
    nValue: 0,
    naValue: -1,
    otherValue: -1,
    qWeight: 1.0,
    spinOffQuestionnaire: "",
    spinoffid: "",
    emailalert: "",
    emailalertlist: "",
    accessLevel: 0,
    ...overrides,
  };
}

// Helper to create a mock Excel buffer from rows
function createMockExcelBuffer(rows: QMSRow[]): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  return Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
}

describe("QMS Parser - parseQMSExcel", () => {
  it("parses Excel buffer and returns rows", () => {
    const mockRows = [
      createMockQMSRow({ QID: 1, Question: "Question 1" }),
      createMockQMSRow({ QID: 2, Question: "Question 2" }),
    ];
    const buffer = createMockExcelBuffer(mockRows);

    const result = parseQMSExcel(buffer);

    expect(result).toHaveLength(2);
    expect(result[0]?.Question).toBe("Question 1");
    expect(result[1]?.Question).toBe("Question 2");
  });

  it("returns empty array for empty Excel file", () => {
    const buffer = createMockExcelBuffer([]);
    const result = parseQMSExcel(buffer);
    expect(result).toHaveLength(0);
  });
});

describe("QMS Parser - validateQMSRow", () => {
  it("validates a complete row with no errors", () => {
    const row = createMockQMSRow();
    const errors = validateQMSRow(row, 2);
    expect(errors).toHaveLength(0);
  });

  it("reports error for missing QID", () => {
    const row = createMockQMSRow({ QID: 0 });
    const errors = validateQMSRow(row, 2);
    expect(errors).toContainEqual(
      expect.objectContaining({
        field: "QID",
        code: "ERR-QMS-001",
      })
    );
  });

  it("reports error for missing Survey", () => {
    const row = createMockQMSRow({ Survey: "" });
    const errors = validateQMSRow(row, 2);
    expect(errors).toContainEqual(
      expect.objectContaining({
        field: "Survey",
        code: "ERR-QMS-002",
      })
    );
  });

  it("reports error for missing Question", () => {
    const row = createMockQMSRow({ Question: "" });
    const errors = validateQMSRow(row, 2);
    expect(errors).toContainEqual(
      expect.objectContaining({
        field: "Question",
        code: "ERR-QMS-003",
      })
    );
  });

  it("reports error for missing Response type", () => {
    const row = createMockQMSRow({ Response: "" });
    const errors = validateQMSRow(row, 2);
    expect(errors).toContainEqual(
      expect.objectContaining({
        field: "Response",
        code: "ERR-QMS-004",
      })
    );
  });

  it("reports error for missing Title", () => {
    const row = createMockQMSRow({ Title: "" });
    const errors = validateQMSRow(row, 2);
    expect(errors).toContainEqual(
      expect.objectContaining({
        field: "Title",
        code: "ERR-QMS-005",
      })
    );
  });

  it("validates skip logic requires skipLogicAnswer when enabled", () => {
    const row = createMockQMSRow({
      skipLogic: "Y",
      skipLogicAnswer: "",
      skipLogicJump: 5,
    });
    const errors = validateQMSRow(row, 2);
    expect(errors).toContainEqual(
      expect.objectContaining({
        field: "skipLogicAnswer",
        code: "ERR-QMS-006",
      })
    );
  });

  it("validates skip logic requires skipLogicJump when enabled", () => {
    const row = createMockQMSRow({
      skipLogic: "Y",
      skipLogicAnswer: "0",
      skipLogicJump: 0,
    });
    const errors = validateQMSRow(row, 2);
    expect(errors).toContainEqual(
      expect.objectContaining({
        field: "skipLogicJump",
        code: "ERR-QMS-007",
      })
    );
  });

  it("validates email alert requires emailalertlist when enabled", () => {
    const row = createMockQMSRow({
      emailalert: "Y",
      emailalertlist: "",
    });
    const errors = validateQMSRow(row, 2);
    expect(errors).toContainEqual(
      expect.objectContaining({
        field: "emailalertlist",
        code: "ERR-QMS-008",
      })
    );
  });

  it("validates spinoff requires spinoffid when enabled", () => {
    const row = createMockQMSRow({
      spinOffQuestionnaire: "Y",
      spinoffid: "",
    });
    const errors = validateQMSRow(row, 2);
    expect(errors).toContainEqual(
      expect.objectContaining({
        field: "spinoffid",
        code: "ERR-QMS-009",
      })
    );
  });
});

describe("QMS Parser - qmsRowToQuestion", () => {
  it("converts QMS row to question object for INSERT (no id field)", () => {
    const row = createMockQMSRow({
      QID: 42,
      Question: "Test question",
      Title: "test_q",
      Response: "Y/N",
      Required: 1,
    });

    const result = qmsRowToQuestion(row, 100);

    // Should NOT have id field for insert
    expect(result).not.toHaveProperty("id");
    expect(result.questionnaireId).toBe(100);
    expect(result.question).toBe("Test question");
    expect(result.title).toBe("test_q");
    expect(result.responseType).toBe(1); // Y/N = 1
    expect(result.required).toBe(true);
    expect(result.sortOrder).toBe(42); // QID used for ordering
    expect(result.active).toBe(true);
  });

  it("correctly maps skip logic fields", () => {
    const row = createMockQMSRow({
      skipLogic: "Y",
      skipLogicAnswer: "0",
      skipLogicJump: 10,
    });

    const result = qmsRowToQuestion(row, 1);

    expect(result.hasSkipLogic).toBe(true);
    expect(result.skipLogicTrigger).toBe("0");
    expect(result.skipLogicTarget).toBe(10);
  });

  it("correctly maps scoring fields", () => {
    const row = createMockQMSRow({
      yValue: 5,
      nValue: 0,
      naValue: -1,
      otherValue: 2,
      qWeight: 1.5,
    });

    const result = qmsRowToQuestion(row, 1);

    expect(result.yesScore).toBe(5);
    expect(result.noScore).toBe(0);
    expect(result.naScore).toBe(-1);
    expect(result.otherScore).toBe(2);
    expect(result.qWeight).toBe("1.5");
  });

  it("correctly maps email alert fields", () => {
    const row = createMockQMSRow({
      emailalert: "Y",
      emailalertlist: "admin@example.com",
    });

    const result = qmsRowToQuestion(row, 1);

    expect(result.hasEmailAlert).toBe(true);
    expect(result.emailAlertList).toBe("admin@example.com");
  });

  it("correctly maps spinoff fields", () => {
    const row = createMockQMSRow({
      spinOffQuestionnaire: "Y",
      spinoffid: "1:5001",
    });

    const result = qmsRowToQuestion(row, 1);

    expect(result.hasSpinoff).toBe(true);
    expect(result.spinoffId).toBe("1:5001");
  });
});

describe("QMS Parser - qmsRowToQuestionUpdate", () => {
  it("includes id field for UPDATE operations", () => {
    const row = createMockQMSRow({ QID: 42 });

    const result = qmsRowToQuestionUpdate(row, 100);

    expect(result.id).toBe(42);
    expect(result.questionnaireId).toBe(100);
  });
});

describe("QMS Parser - convertResponseType", () => {
  it("converts Y/N to response type 1", () => {
    expect(convertResponseType("Y/N")).toBe(1);
  });

  it("converts Y/N/NA to response type 2", () => {
    expect(convertResponseType("Y/N/NA")).toBe(2);
  });

  it("converts CHECKBOX to response type 3", () => {
    expect(convertResponseType("CHECKBOX")).toBe(3);
  });

  it("converts TEXT to response type 4", () => {
    expect(convertResponseType("TEXT")).toBe(4);
  });

  it("converts DATE to response type 5", () => {
    expect(convertResponseType("DATE")).toBe(5);
  });

  it("converts NUMBER to response type 6", () => {
    expect(convertResponseType("NUMBER")).toBe(6);
  });

  it("converts DROPDOWN to response type 7", () => {
    expect(convertResponseType("DROPDOWN")).toBe(7);
  });

  it("converts MULTI to response type 8", () => {
    expect(convertResponseType("MULTI")).toBe(8);
  });

  it("converts FILE to response type 9", () => {
    expect(convertResponseType("FILE")).toBe(9);
  });

  it("converts LIST2LIST to response type 10", () => {
    expect(convertResponseType("LIST2LIST")).toBe(10);
  });

  it("converts TEXT_NUMBER_6 to response type 11", () => {
    expect(convertResponseType("TEXT_NUMBER_6")).toBe(11);
  });

  it("defaults unknown types to TEXT (4)", () => {
    expect(convertResponseType("UNKNOWN")).toBe(4);
    expect(convertResponseType("")).toBe(4);
  });
});

describe("QMS Parser - 82 Questions Import Simulation", () => {
  it("parses 82 questions from mock data matching expected template structure", () => {
    // Create 82 mock questions to simulate the intelleges_qms_reference.xlsx
    const mockQuestions: QMSRow[] = [];
    for (let i = 1; i <= 82; i++) {
      mockQuestions.push(
        createMockQMSRow({
          QID: i,
          Page: Math.ceil(i / 10),
          Surveyset: `Section ${Math.ceil(i / 10)}`,
          Survey: "Federal Compliance Questionnaire",
          Question: `Question ${i}: Sample compliance question text`,
          Response: i % 3 === 0 ? "Y/N" : i % 3 === 1 ? "TEXT" : "CHECKBOX",
          Title: `q_${i}`,
          Required: i <= 50 ? 1 : 0, // First 50 required
        })
      );
    }

    const buffer = createMockExcelBuffer(mockQuestions);
    const result = parseQMSExcel(buffer);

    expect(result).toHaveLength(82);
    expect(result[0]?.QID).toBe(1);
    expect(result[81]?.QID).toBe(82);

    // Validate all rows
    let totalErrors = 0;
    result.forEach((row, index) => {
      const errors = validateQMSRow(row, index + 2);
      totalErrors += errors.length;
    });

    expect(totalErrors).toBe(0);

    // Convert all to question objects
    const questions = result.map((row) => qmsRowToQuestion(row, 1));

    expect(questions).toHaveLength(82);
    // Verify no question has an id field (for insert mode)
    questions.forEach((q) => {
      expect(q).not.toHaveProperty("id");
      expect(q.questionnaireId).toBe(1);
    });
  });
});
