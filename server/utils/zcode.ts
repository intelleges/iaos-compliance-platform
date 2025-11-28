/**
 * Z-Code Encoding Service
 * Based on INT.DOC.08 Section 4.4 and INT.DOC.22 Section 3
 * 
 * Z-Code encodes socioeconomic classifications into a 6-bit binary integer:
 * Bit 5 (32): L      - Large Business
 * Bit 4 (16): S      - Small Business
 * Bit 3 (8):  SDB    - Small Disadvantaged Business
 * Bit 2 (4):  WOSB   - Woman-Owned Small Business
 * Bit 1 (2):  VOSB   - Veteran-Owned Small Business
 * Bit 0 (1):  SDVOSB - Service-Disabled Veteran-Owned Small Business
 * 
 * Business Rules:
 * - L and S are mutually exclusive
 * - SDB, WOSB, VOSB, SDVOSB require S to be selected
 * - SDVOSB auto-selects VOSB (all service-disabled veterans are veterans)
 */

export const ZCODE_OPTIONS = [
  { code: 'L', label: 'Large Business', weight: 32 },
  { code: 'S', label: 'Small Business', weight: 16 },
  { code: 'SDB', label: 'Small Disadvantaged Business', weight: 8 },
  { code: 'WOSB', label: 'Woman-Owned Small Business', weight: 4 },
  { code: 'VOSB', label: 'Veteran-Owned Small Business', weight: 2 },
  { code: 'SDVOSB', label: 'Service-Disabled Veteran-Owned Small Business', weight: 1 },
] as const;

export type ZCodeOption = 'L' | 'S' | 'SDB' | 'WOSB' | 'VOSB' | 'SDVOSB';

/**
 * Encode socioeconomic classifications to Z-Code integer
 * @param selectedCodes - Array of classification codes
 * @returns Z-Code integer (0-63)
 * @throws Error if business rules are violated
 */
export function encodeZCode(selectedCodes: string[]): number {
  // Validate business rules
  const hasL = selectedCodes.includes('L');
  const hasS = selectedCodes.includes('S');
  const hasSDB = selectedCodes.includes('SDB');
  const hasWOSB = selectedCodes.includes('WOSB');
  const hasVOSB = selectedCodes.includes('VOSB');
  const hasSDVOSB = selectedCodes.includes('SDVOSB');

  // Rule 1: L and S are mutually exclusive
  if (hasL && hasS) {
    throw new Error('L and S are mutually exclusive');
  }

  // Rule 2: SDB, WOSB, VOSB, SDVOSB require S
  if (hasSDB && !hasS) {
    throw new Error('SDB requires S to be selected');
  }
  if (hasWOSB && !hasS) {
    throw new Error('WOSB requires S to be selected');
  }
  if (hasVOSB && !hasS) {
    throw new Error('VOSB requires S to be selected');
  }
  if (hasSDVOSB && !hasS) {
    throw new Error('SDVOSB requires S to be selected');
  }

  // Rule 3: SDVOSB auto-selects VOSB
  const codes = [...selectedCodes];
  if (hasSDVOSB && !hasVOSB) {
    codes.push('VOSB');
  }

  // Encode to binary
  let zcode = 0;
  for (const code of codes) {
    const option = ZCODE_OPTIONS.find(opt => opt.code === code);
    if (option) {
      zcode |= option.weight;
    }
  }

  return zcode;
}

/**
 * Decode Z-Code integer to socioeconomic classifications
 * @param zcode - Z-Code integer (0-63)
 * @returns Array of classification codes
 * @throws Error if Z-Code is invalid
 */
export function decodeZCode(zcode: number): string[] {
  // Validate Z-Code range
  if (!Number.isInteger(zcode) || zcode < 0 || zcode > 63) {
    throw new Error('Invalid Z-Code');
  }

  const codes: string[] = [];
  for (const option of ZCODE_OPTIONS) {
    if ((zcode & option.weight) !== 0) {
      codes.push(option.code);
    }
  }
  return codes;
}

/**
 * Validate Z-Code integer
 * @param zcode - Z-Code integer
 * @returns true if valid
 */
export function isValidZCode(zcode: number): boolean {
  return Number.isInteger(zcode) && zcode >= 0 && zcode <= 63;
}
