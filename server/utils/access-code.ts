import crypto from 'crypto';

/**
 * Generate cryptographic random access code for supplier authentication
 * 
 * Format: 12 characters, uppercase alphanumeric
 * Character set: A-HJ-NP-Z2-9 (excludes O/0/I/1/L for readability)
 * Entropy: 32^12 = 1.2 × 10^18 combinations
 * 
 * @returns 12-character access code (e.g., "A3B7CKMNPQRS")
 */
export function generateAccessCode(): string {
  // Exclude confusing characters: O/0 (looks like zero), I/1 (looks like one), L (looks like one)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const codeLength = 12;
  
  // Generate cryptographically secure random bytes
  const bytes = crypto.randomBytes(codeLength);
  
  // Map bytes to allowed character set
  let code = '';
  for (let i = 0; i < codeLength; i++) {
    const randomIndex = bytes[i]! % chars.length;
    code += chars[randomIndex];
  }
  
  return code;
}

/**
 * Validate access code format
 * 
 * @param code - Access code to validate
 * @returns true if code matches expected format
 */
export function isValidAccessCodeFormat(code: string): boolean {
  if (!code || code.length !== 12) {
    return false;
  }
  
  // Must only contain allowed characters
  const allowedChars = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{12}$/;
  return allowedChars.test(code);
}

/**
 * Generate multiple unique access codes in batch
 * 
 * @param count - Number of codes to generate
 * @returns Array of unique access codes
 */
export function generateAccessCodeBatch(count: number): string[] {
  const codes = new Set<string>();
  
  while (codes.size < count) {
    codes.add(generateAccessCode());
  }
  
  return Array.from(codes);
}
