import crypto from 'crypto';

/**
 * Business Rule AC-001: Access codes must be exactly 12 alphanumeric characters
 * Business Rule AC-003: Access codes are generated using cryptographic random
 * Business Rule AC-005: Access codes exclude confusing characters (0/O, 1/I/L)
 */

const ALLOWED_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Excludes 0,O,1,I,L
const ACCESS_CODE_LENGTH = 12;
// Regex excludes confusing characters: 0, O, 1, I, L (per AC-005)
const ACCESS_CODE_REGEX = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{12}$/;

/**
 * Generate a cryptographically secure 12-character access code
 * @returns {string} 12-character alphanumeric access code
 */
export function generateAccessCode(): string {
  const bytes = crypto.randomBytes(ACCESS_CODE_LENGTH);
  let code = '';
  
  for (let i = 0; i < ACCESS_CODE_LENGTH; i++) {
    const randomIndex = bytes[i]! % ALLOWED_CHARS.length;
    code += ALLOWED_CHARS[randomIndex];
  }
  
  return code;
}

/**
 * Validate access code format
 * Business Rule AC-001: Must be exactly 12 alphanumeric characters
 * @param {string} code - Access code to validate
 * @returns {boolean} True if valid format
 */
export function validateAccessCodeFormat(code: string): boolean {
  return ACCESS_CODE_REGEX.test(code);
}

/**
 * Generate unique access code with database uniqueness check
 * Business Rule AC-002: Access codes must be unique across all enterprises
 * @param {Function} checkUnique - Async function to check if code exists in database
 * @returns {Promise<string>} Unique access code
 */
export async function generateUniqueAccessCode(
  checkUnique: (code: string) => Promise<boolean>
): Promise<string> {
  let attempts = 0;
  const MAX_ATTEMPTS = 10;
  
  while (attempts < MAX_ATTEMPTS) {
    const code = generateAccessCode();
    const isUnique = await checkUnique(code);
    
    if (isUnique) {
      return code;
    }
    
    attempts++;
  }
  
  throw new Error('Failed to generate unique access code after ' + MAX_ATTEMPTS + ' attempts');
}
