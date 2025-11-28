/**
 * Z-Code Binary Encoding Utilities
 * Based on INT.DOC.08 - Frontend Component Documentation
 * 
 * Z-Code encodes socioeconomic classifications into a 6-bit binary integer:
 * Bit 0 (32): L  - Large Business
 * Bit 1 (16): S  - Small Business
 * Bit 2 (8):  SDB - Small Disadvantaged Business
 * Bit 3 (4):  WOSB - Woman-Owned Small Business
 * Bit 4 (2):  VOSB - Veteran-Owned Small Business
 * Bit 5 (1):  SDVOSB - Service-Disabled Veteran-Owned Small Business
 * 
 * Example: S + WOSB + VOSB = 010110 binary = 22 decimal
 */

import { ZCODE_OPTIONS, type ZCodeOption } from './types';

/**
 * Encode selected classification codes into Z-Code integer
 * @param selectedCodes Array of classification codes (e.g., ['S', 'WOSB', 'VOSB'])
 * @returns Z-Code integer (e.g., 22)
 */
export function encodeZCode(selectedCodes: string[]): number {
  let zcode = 0;
  
  for (const code of selectedCodes) {
    const option = ZCODE_OPTIONS.find(opt => opt.code === code);
    if (option) {
      zcode |= option.weight; // Bitwise OR to set the bit
    }
  }
  
  return zcode;
}

/**
 * Decode Z-Code integer into array of classification codes
 * @param zcode Z-Code integer (e.g., 22)
 * @returns Array of classification codes (e.g., ['S', 'WOSB', 'VOSB'])
 */
export function decodeZCode(zcode: number): string[] {
  const codes: string[] = [];
  
  for (const option of ZCODE_OPTIONS) {
    if ((zcode & option.weight) !== 0) {
      codes.push(option.code);
    }
  }
  
  return codes;
}

/**
 * Get human-readable labels for Z-Code
 * @param zcode Z-Code integer
 * @returns Array of classification labels
 */
export function getZCodeLabels(zcode: number): string[] {
  const codes = decodeZCode(zcode);
  return codes.map(code => {
    const option = ZCODE_OPTIONS.find(opt => opt.code === code);
    return option?.label || code;
  });
}

/**
 * Validate Z-Code (must be 0-63 for 6-bit encoding)
 * @param zcode Z-Code integer
 * @returns true if valid
 */
export function isValidZCode(zcode: number): boolean {
  return Number.isInteger(zcode) && zcode >= 0 && zcode <= 63;
}

/**
 * Format Z-Code as binary string for debugging
 * @param zcode Z-Code integer
 * @returns Binary string (e.g., "010110")
 */
export function formatZCodeBinary(zcode: number): string {
  return zcode.toString(2).padStart(6, '0');
}
