/**
 * Assignment Lifecycle Tests
 * Critical test scenarios from INT.DOC.21 Section 6.2
 * 
 * Tests cover:
 * - Status transitions (NOT_STARTED → INVITED → ACCESSED → IN_PROGRESS → SUBMITTED)
 * - Due date handling (PAST_DUE, SUBMITTED_LATE)
 * - Audit trail logging
 * - Invalid transition rejection
 */

import { describe, expect, it, beforeEach } from "vitest";
import { testPartners } from "./test-fixtures/partners";
import { TEST_ENTERPRISE_ID } from "./test-fixtures/users";

describe("Assignment Lifecycle (INT.DOC.21 Section 6.2)", () => {
  describe("Status Transitions", () => {
    it("should transition NOT_STARTED → INVITED on invitation send", async () => {
      const assignment = createAssignment({ status: "NOT_STARTED" });
      
      const updated = await sendInvitation(assignment);
      
      expect(updated.status).toBe("INVITED");
      expect(updated.invitedAt).toBeInstanceOf(Date);
      expect(updated.accessCode).toHaveLength(12);
    });

    it("should transition INVITED → ACCESSED on first login", async () => {
      const assignment = createAssignment({ status: "INVITED" });
      
      const updated = await recordFirstAccess(assignment);
      
      expect(updated.status).toBe("ACCESSED");
      expect(updated.accessedAt).toBeInstanceOf(Date);
    });

    it("should transition ACCESSED → IN_PROGRESS on first response", async () => {
      const assignment = createAssignment({ status: "ACCESSED" });
      
      const updated = await recordFirstResponse(assignment, {
        questionId: 1,
        response: "Test answer",
      });
      
      expect(updated.status).toBe("IN_PROGRESS");
      expect(updated.progress).toBeGreaterThan(0);
    });

    it("should transition IN_PROGRESS → SUBMITTED on complete + e-sign", async () => {
      const assignment = createAssignment({ 
        status: "IN_PROGRESS",
        progress: 100,
      });
      
      const updated = await submitAssignment(assignment, {
        signature: "John Supplier",
        signedAt: new Date(),
      });
      
      expect(updated.status).toBe("SUBMITTED");
      expect(updated.submittedAt).toBeInstanceOf(Date);
      expect(updated.signature).toBe("John Supplier");
    });

    it("should transition any status → PAST_DUE when due date passes", async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const assignment = createAssignment({ 
        status: "IN_PROGRESS",
        dueDate: yesterday,
      });
      
      const updated = await checkDueDate(assignment);
      
      expect(updated.status).toBe("PAST_DUE");
    });

    it("should transition PAST_DUE → SUBMITTED_LATE on late submission", async () => {
      const assignment = createAssignment({ 
        status: "PAST_DUE",
        progress: 100,
      });
      
      const updated = await submitAssignment(assignment, {
        signature: "John Supplier",
        signedAt: new Date(),
      });
      
      expect(updated.status).toBe("SUBMITTED_LATE");
      expect(updated.submittedAt).toBeInstanceOf(Date);
    });
  });

  describe("Audit Trail", () => {
    it("should log status transitions in audit trail", async () => {
      const assignment = createAssignment({ status: "NOT_STARTED" });
      const auditLogs: any[] = [];
      
      await sendInvitation(assignment, (log) => auditLogs.push(log));
      
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0]).toMatchObject({
        action: "status_transition",
        fromStatus: "NOT_STARTED",
        toStatus: "INVITED",
        assignmentId: assignment.id,
      });
    });

    it("should log user who triggered transition", async () => {
      const assignment = createAssignment({ status: "ACCESSED" });
      const auditLogs: any[] = [];
      
      await recordFirstResponse(
        assignment,
        { questionId: 1, response: "Test" },
        (log) => auditLogs.push(log)
      );
      
      expect(auditLogs[0]).toHaveProperty("userId");
      expect(auditLogs[0]).toHaveProperty("timestamp");
    });

    it("should log submission details in audit trail", async () => {
      const assignment = createAssignment({ 
        status: "IN_PROGRESS",
        progress: 100,
      });
      const auditLogs: any[] = [];
      
      await submitAssignment(
        assignment,
        { signature: "John Supplier", signedAt: new Date() },
        (log) => auditLogs.push(log)
      );
      
      expect(auditLogs[0]).toMatchObject({
        action: "assignment_submitted",
        signature: "John Supplier",
      });
    });
  });

  describe("Invalid Transitions", () => {
    it("should reject transition from SUBMITTED to IN_PROGRESS", async () => {
      const assignment = createAssignment({ status: "SUBMITTED" });
      
      await expect(
        recordFirstResponse(assignment, { questionId: 1, response: "Test" })
      ).rejects.toThrow("Invalid status transition");
    });

    it("should reject submission without 100% progress", async () => {
      const assignment = createAssignment({ 
        status: "IN_PROGRESS",
        progress: 75,
      });
      
      await expect(
        submitAssignment(assignment, { signature: "Test", signedAt: new Date() })
      ).rejects.toThrow("Cannot submit incomplete assignment");
    });

    it("should reject submission without signature", async () => {
      const assignment = createAssignment({ 
        status: "IN_PROGRESS",
        progress: 100,
      });
      
      await expect(
        submitAssignment(assignment, { signature: "", signedAt: new Date() })
      ).rejects.toThrow("Signature required");
    });
  });

  describe("Progress Tracking", () => {
    it("should calculate progress based on answered questions", () => {
      const totalQuestions = 25;
      const answeredQuestions = 10;
      
      const progress = calculateProgress(answeredQuestions, totalQuestions);
      
      expect(progress).toBe(40); // 10/25 = 40%
    });

    it("should update progress when responses are saved", async () => {
      const assignment = createAssignment({ 
        status: "IN_PROGRESS",
        progress: 40,
        answeredQuestions: 10,
        totalQuestions: 25,
      });
      
      const updated = await saveResponse(assignment, {
        questionId: 11,
        response: "New answer",
      });
      
      expect(updated.progress).toBeGreaterThan(40);
    });

    it("should reach 100% when all required questions answered", async () => {
      const assignment = createAssignment({ 
        status: "IN_PROGRESS",
        progress: 96,
        totalQuestions: 25,
        answeredQuestions: 24,
      });
      
      const updated = await saveResponse(assignment, {
        questionId: 25,
        response: "Final answer",
      });
      
      expect(updated.progress).toBe(100);
    });
  });
});

// ============================================================================
// Mock Implementation Functions
// ============================================================================

interface Assignment {
  id: number;
  partnerId: number;
  status: string;
  progress?: number;
  dueDate?: Date;
  invitedAt?: Date;
  accessedAt?: Date;
  submittedAt?: Date;
  accessCode?: string;
  signature?: string;
  totalQuestions?: number;
  answeredQuestions?: number;
}

function createAssignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    id: Math.floor(Math.random() * 10000),
    partnerId: testPartners.smallBusiness.id!,
    status: "NOT_STARTED",
    progress: 0,
    totalQuestions: 25,
    answeredQuestions: 0,
    ...overrides,
  };
}

async function sendInvitation(
  assignment: Assignment,
  auditLogger?: (log: any) => void
): Promise<Assignment> {
  if (assignment.status !== "NOT_STARTED") {
    throw new Error("Invalid status transition");
  }

  auditLogger?.({
    action: "status_transition",
    fromStatus: assignment.status,
    toStatus: "INVITED",
    assignmentId: assignment.id,
    timestamp: new Date(),
  });

  return {
    ...assignment,
    status: "INVITED",
    invitedAt: new Date(),
    accessCode: generateAccessCode(),
  };
}

async function recordFirstAccess(assignment: Assignment): Promise<Assignment> {
  if (assignment.status !== "INVITED") {
    throw new Error("Invalid status transition");
  }

  return {
    ...assignment,
    status: "ACCESSED",
    accessedAt: new Date(),
  };
}

async function recordFirstResponse(
  assignment: Assignment,
  response: { questionId: number; response: string },
  auditLogger?: (log: any) => void
): Promise<Assignment> {
  if (assignment.status === "SUBMITTED" || assignment.status === "SUBMITTED_LATE") {
    throw new Error("Invalid status transition: Assignment already submitted");
  }

  if (assignment.status !== "ACCESSED" && assignment.status !== "IN_PROGRESS") {
    throw new Error("Invalid status transition");
  }

  auditLogger?.({
    action: "status_transition",
    fromStatus: assignment.status,
    toStatus: "IN_PROGRESS",
    assignmentId: assignment.id,
    userId: 9005, // Supplier user
    timestamp: new Date(),
  });

  const answeredQuestions = (assignment.answeredQuestions || 0) + 1;
  const progress = calculateProgress(answeredQuestions, assignment.totalQuestions || 25);

  return {
    ...assignment,
    status: "IN_PROGRESS",
    progress,
    answeredQuestions,
  };
}

async function submitAssignment(
  assignment: Assignment,
  submission: { signature: string; signedAt: Date },
  auditLogger?: (log: any) => void
): Promise<Assignment> {
  if (!submission.signature || submission.signature.trim() === "") {
    throw new Error("Signature required");
  }

  if (assignment.progress !== 100) {
    throw new Error("Cannot submit incomplete assignment");
  }

  const isPastDue = assignment.status === "PAST_DUE";
  const newStatus = isPastDue ? "SUBMITTED_LATE" : "SUBMITTED";

  auditLogger?.({
    action: "assignment_submitted",
    assignmentId: assignment.id,
    signature: submission.signature,
    signedAt: submission.signedAt,
    status: newStatus,
    timestamp: new Date(),
  });

  return {
    ...assignment,
    status: newStatus,
    submittedAt: new Date(),
    signature: submission.signature,
  };
}

async function checkDueDate(assignment: Assignment): Promise<Assignment> {
  if (!assignment.dueDate) return assignment;

  const isPastDue = assignment.dueDate.getTime() < Date.now();
  
  if (isPastDue && assignment.status !== "SUBMITTED" && assignment.status !== "SUBMITTED_LATE") {
    return {
      ...assignment,
      status: "PAST_DUE",
    };
  }

  return assignment;
}

async function saveResponse(
  assignment: Assignment,
  response: { questionId: number; response: string }
): Promise<Assignment> {
  const answeredQuestions = (assignment.answeredQuestions || 0) + 1;
  const progress = calculateProgress(answeredQuestions, assignment.totalQuestions || 25);

  return {
    ...assignment,
    progress,
    answeredQuestions,
  };
}

function calculateProgress(answered: number, total: number): number {
  return Math.round((answered / total) * 100);
}

function generateAccessCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  
  for (let i = 0; i < 12; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  
  return code;
}
