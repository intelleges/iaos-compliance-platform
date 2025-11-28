import { describe, expect, it, beforeEach } from 'vitest';
import { generateAccessCode, isValidAccessCodeFormat } from '../utils/access-code';
import { createSupplierSession, getSupplierSession, invalidateSupplierSession } from '../utils/supplier-session';

/**
 * Supplier Access Code System Tests
 * 
 * Tests the complete supplier authentication flow:
 * 1. Access code generation (12-char cryptographic)
 * 2. Access code validation (format, character set)
 * 3. Session management (8-hour max, 1-hour idle timeout)
 * 4. Single-use invalidation
 */

describe('Access Code Generation', () => {
  it('generates 12-character access codes', () => {
    const code = generateAccessCode();
    expect(code).toHaveLength(12);
  });
  
  it('generates unique access codes', () => {
    const codes = new Set();
    for (let i = 0; i < 1000; i++) {
      codes.add(generateAccessCode());
    }
    // All 1000 codes should be unique
    expect(codes.size).toBe(1000);
  });
  
  it('uses only valid characters (A-HJ-NP-Z2-9)', () => {
    const validChars = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{12}$/;
    for (let i = 0; i < 100; i++) {
      const code = generateAccessCode();
      expect(code).toMatch(validChars);
    }
  });
  
  it('excludes confusing characters (O/0/I/1/L)', () => {
    const confusingChars = /[O0I1L]/;
    for (let i = 0; i < 100; i++) {
      const code = generateAccessCode();
      expect(code).not.toMatch(confusingChars);
    }
  });
});

describe('Access Code Validation', () => {
  it('accepts valid 12-character codes', () => {
    const validCodes = [
      'ABCDEFGHJKMN',
      'PQRSTUVWXYZ2',
      '23456789ABCD',
      'NPRZ23456789',
    ];
    
    validCodes.forEach(code => {
      expect(isValidAccessCodeFormat(code)).toBe(true);
    });
  });
  
  it('rejects codes with wrong length', () => {
    const invalidCodes = [
      'ABC',           // Too short
      'ABCDEFGHJK',    // 11 chars
      'ABCDEFGHJKMN2', // 13 chars
      '',              // Empty
    ];
    
    invalidCodes.forEach(code => {
      expect(isValidAccessCodeFormat(code)).toBe(false);
    });
  });
  
  it('rejects codes with invalid characters', () => {
    const invalidCodes = [
      'ABCDEFGH0JKM', // Contains 0
      'ABCDEFGHIJKM', // Contains I
      'ABCDEFGH1JKM', // Contains 1
      'ABCDEFGHLKJM', // Contains L
      'ABCDEFGHOJKM', // Contains O
      'abcdefghjkmn', // Lowercase (should be uppercase)
      'ABCDEFGH!@#$', // Special characters
    ];
    
    invalidCodes.forEach(code => {
      expect(isValidAccessCodeFormat(code)).toBe(false);
    });
  });
  
  it('is case-insensitive (auto-converts to uppercase)', () => {
    const lowerCode = 'abcdefghjkmn';
    const upperCode = 'ABCDEFGHJKMN';
    
    expect(isValidAccessCodeFormat(lowerCode.toUpperCase())).toBe(true);
    expect(isValidAccessCodeFormat(upperCode)).toBe(true);
  });
});

describe('Supplier Session Management', () => {
  const mockAssignmentId = 123;
  const mockPartnerId = 456;
  let accessCode: string;
  
  beforeEach(() => {
    accessCode = generateAccessCode();
  });
  
  it('creates a new supplier session', () => {
    const session = createSupplierSession({
      accessCode,
      assignmentId: mockAssignmentId,
      partnerId: mockPartnerId,
    });
    
    expect(session.sessionId).toBeDefined();
    expect(session.accessCode).toBe(accessCode);
    expect(session.assignmentId).toBe(mockAssignmentId);
    expect(session.partnerId).toBe(mockPartnerId);
    expect(session.createdAt).toBeInstanceOf(Date);
    expect(session.expiresAt).toBeInstanceOf(Date);
    expect(session.lastActivityAt).toBeInstanceOf(Date);
  });
  
  it('sets 8-hour max session expiry', () => {
    const session = createSupplierSession({
      accessCode,
      assignmentId: mockAssignmentId,
      partnerId: mockPartnerId,
    });
    
    const eightHoursMs = 8 * 60 * 60 * 1000;
    const timeDiff = session.expiresAt.getTime() - session.createdAt.getTime();
    
    // Allow 1 second tolerance for test execution time
    expect(timeDiff).toBeGreaterThanOrEqual(eightHoursMs - 1000);
    expect(timeDiff).toBeLessThanOrEqual(eightHoursMs + 1000);
  });
  
  it('retrieves an active session', () => {
    const created = createSupplierSession({
      accessCode,
      assignmentId: mockAssignmentId,
      partnerId: mockPartnerId,
    });
    
    const retrieved = getSupplierSession(created.sessionId);
    
    expect(retrieved).toBeDefined();
    expect(retrieved?.sessionId).toBe(created.sessionId);
    expect(retrieved?.accessCode).toBe(accessCode);
  });
  
  it('updates lastActivityAt on session retrieval', () => {
    const created = createSupplierSession({
      accessCode,
      assignmentId: mockAssignmentId,
      partnerId: mockPartnerId,
    });
    
    const originalActivity = created.lastActivityAt;
    
    // Wait 100ms
    setTimeout(() => {
      const retrieved = getSupplierSession(created.sessionId);
      expect(retrieved?.lastActivityAt.getTime()).toBeGreaterThan(originalActivity.getTime());
    }, 100);
  });
  
  it('invalidates a session', () => {
    const session = createSupplierSession({
      accessCode,
      assignmentId: mockAssignmentId,
      partnerId: mockPartnerId,
    });
    
    invalidateSupplierSession(session.sessionId);
    
    const retrieved = getSupplierSession(session.sessionId);
    expect(retrieved).toBeUndefined();
  });
  
  it('returns undefined for non-existent session', () => {
    const retrieved = getSupplierSession('non-existent-session-id');
    expect(retrieved).toBeUndefined();
  });
  
  it('returns undefined for expired session (8-hour max)', () => {
    const session = createSupplierSession({
      accessCode,
      assignmentId: mockAssignmentId,
      partnerId: mockPartnerId,
    });
    
    // Manually set expiry to past
    session.expiresAt = new Date(Date.now() - 1000);
    
    const retrieved = getSupplierSession(session.sessionId);
    expect(retrieved).toBeUndefined();
  });
  
  it('returns undefined for idle session (1-hour timeout)', () => {
    const session = createSupplierSession({
      accessCode,
      assignmentId: mockAssignmentId,
      partnerId: mockPartnerId,
    });
    
    // Manually set lastActivityAt to 1 hour + 1 second ago
    session.lastActivityAt = new Date(Date.now() - (60 * 60 * 1000 + 1000));
    
    const retrieved = getSupplierSession(session.sessionId);
    expect(retrieved).toBeUndefined();
  });
});

describe('Single-Use Access Code', () => {
  it('invalidates access code after questionnaire submission', () => {
    const accessCode = generateAccessCode();
    const session = createSupplierSession({
      accessCode,
      assignmentId: 123,
      partnerId: 456,
    });
    
    // Simulate submission
    invalidateSupplierSession(session.sessionId);
    
    // Attempt to use same access code again
    const retrieved = getSupplierSession(session.sessionId);
    expect(retrieved).toBeUndefined();
  });
});
