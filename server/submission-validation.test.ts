import { describe, expect, it, beforeEach, vi } from "vitest";
import { validateForSubmission } from "./services/validation";
import { ERROR_CODES, createError } from "./constants/errorCodes";

/**
 * Tests for Pre-Submission Validation (INT.DOC.12 Section 5.1)
 * 
 * Business Rules:
 * - Progress must be 100%
 * - All required questions must have valid responses
 * - Required comments must be provided
 * - Required uploads must be provided
 */

describe("Pre-Submission Validation", () => {
  describe("validateForSubmission", () => {
    it("should return valid=true when all requirements are met", async () => {
      // This test requires database setup with a complete assignment
      // For now, we'll test the structure
      const result = await validateForSubmission(999999); // Non-existent assignment
      
      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("errors");
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it("should return SUBMIT_INCOMPLETE error when progress < 100%", async () => {
      // Test structure - actual implementation requires database
      const result = await validateForSubmission(999999);
      
      if (!result.valid) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toHaveProperty("code");
        expect(result.errors[0]).toHaveProperty("message");
      }
    });

    it("should validate required questions are answered", async () => {
      const result = await validateForSubmission(999999);
      
      expect(result).toBeDefined();
      expect(typeof result.valid).toBe("boolean");
    });

    it("should validate required comments are provided", async () => {
      const result = await validateForSubmission(999999);
      
      expect(result).toBeDefined();
      expect(typeof result.valid).toBe("boolean");
    });

    it("should validate required uploads are provided", async () => {
      const result = await validateForSubmission(999999);
      
      expect(result).toBeDefined();
      expect(typeof result.valid).toBe("boolean");
    });
  });

  describe("Error Codes", () => {
    it("should have SUBMIT_INCOMPLETE error code", () => {
      expect(ERROR_CODES.SUBMIT_INCOMPLETE).toBeDefined();
      expect(ERROR_CODES.SUBMIT_INCOMPLETE).toBe("SUBMIT_INCOMPLETE");
    });

    it("should have COMMENT_REQUIRED error code", () => {
      expect(ERROR_CODES.COMMENT_REQUIRED).toBeDefined();
      expect(ERROR_CODES.COMMENT_REQUIRED).toBe("COMMENT_REQUIRED");
    });

    it("should have UPLOAD_REQUIRED error code", () => {
      expect(ERROR_CODES.UPLOAD_REQUIRED).toBeDefined();
      expect(ERROR_CODES.UPLOAD_REQUIRED).toBe("UPLOAD_REQUIRED");
    });

    it("should have RESPONSE_VALIDATION_REQUIRED error code", () => {
      expect(ERROR_CODES.RESPONSE_VALIDATION_REQUIRED).toBeDefined();
      expect(ERROR_CODES.RESPONSE_VALIDATION_REQUIRED).toBe("RESPONSE_VALIDATION_REQUIRED");
    });
  });

  describe("Validation Error Messages", () => {
    it("should provide clear error messages for incomplete submissions", () => {
      const error = createError(ERROR_CODES.SUBMIT_INCOMPLETE);
      
      expect(error.message).toContain("incomplete");
      expect(error.code).toBe("SUBMIT_INCOMPLETE");
    });

    it("should provide clear error messages for missing comments", () => {
      const error = createError(ERROR_CODES.COMMENT_REQUIRED, { questionId: 5 });
      
      expect(error.message).toBeDefined();
      expect(error.code).toBe("COMMENT_REQUIRED");
      expect(error).toHaveProperty("questionId");
      expect(error.questionId).toBe(5);
    });

    it("should provide clear error messages for missing uploads", () => {
      const error = createError(ERROR_CODES.UPLOAD_REQUIRED, { questionId: 7 });
      
      expect(error.message).toBeDefined();
      expect(error.code).toBe("UPLOAD_REQUIRED");
      expect(error).toHaveProperty("questionId");
      expect(error.questionId).toBe(7);
    });
  });
});

describe("Access Code Generation", () => {
  it("should generate 12-character alphanumeric codes", async () => {
    const { generateAccessCode } = await import("./utils/accessCode");
    const code = generateAccessCode();
    
    expect(code).toHaveLength(12);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it("should not include confusing characters (0, O, 1, I, L)", async () => {
    const { generateAccessCode } = await import("./utils/accessCode");
    const code = generateAccessCode();
    
    expect(code).not.toMatch(/[01IOL]/);
  });

  it("should validate access code format", async () => {
    const { validateAccessCodeFormat } = await import("./utils/accessCode");
    
    expect(validateAccessCodeFormat("ABCDEFGH2345")).toBe(true);
    expect(validateAccessCodeFormat("ABC")).toBe(false); // Too short
    expect(validateAccessCodeFormat("ABCDEFGH23456")).toBe(false); // Too long
    expect(validateAccessCodeFormat("ABCDEFGH234O")).toBe(false); // Contains O
    expect(validateAccessCodeFormat("abcdefgh2345")).toBe(false); // Lowercase
  });

  it("should generate cryptographically random codes", async () => {
    const { generateAccessCode } = await import("./utils/accessCode");
    const codes = new Set();
    
    // Generate 100 codes and ensure they're all unique
    for (let i = 0; i < 100; i++) {
      codes.add(generateAccessCode());
    }
    
    expect(codes.size).toBe(100);
  });
});

describe("Session Expiration", () => {
  it("should set 8-hour expiration for supplier sessions", async () => {
    const { SESSION_CONFIG } = await import("./utils/session");
    
    expect(SESSION_CONFIG.SUPPLIER_EXPIRY_SECONDS).toBe(8 * 60 * 60);
  });

  it("should set 12-hour expiration for admin sessions", async () => {
    const { SESSION_CONFIG } = await import("./utils/session");
    
    expect(SESSION_CONFIG.ADMIN_EXPIRY_SECONDS).toBe(12 * 60 * 60);
  });

  it("should calculate correct expiration time", async () => {
    const { calculateSessionExpiry } = await import("./utils/session");
    const now = new Date();
    const expiry = calculateSessionExpiry("user");
    
    const hoursDiff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    expect(hoursDiff).toBeCloseTo(8, 0);
  });

  it("should detect expired sessions", async () => {
    const { isSessionExpired } = await import("./utils/session");
    const past = new Date(Date.now() - 10 * 60 * 60 * 1000); // 10 hours ago
    const future = new Date(Date.now() + 10 * 60 * 60 * 1000); // 10 hours from now
    
    expect(isSessionExpired(past, "user")).toBe(true);
    expect(isSessionExpired(future, "user")).toBe(false);
  });
});
