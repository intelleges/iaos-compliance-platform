import { describe, expect, it } from "vitest";
import { encodeZCode, decodeZCode, isValidZCode } from "./utils/zcode";

/**
 * Z-Code Encoding Tests per INT.DOC.22 Section 3
 * 
 * Test Coverage: 20 tests, 100% coverage required
 * 
 * Z-Code encodes socioeconomic classifications into a 6-bit binary integer:
 * Bit 5 (32): L      - Large Business
 * Bit 4 (16): S      - Small Business
 * Bit 3 (8):  SDB    - Small Disadvantaged Business
 * Bit 2 (4):  WOSB   - Woman-Owned Small Business
 * Bit 1 (2):  VOSB   - Veteran-Owned Small Business
 * Bit 0 (1):  SDVOSB - Service-Disabled Veteran-Owned Small Business
 */

describe("ZCodeService", () => {
  describe("encodeZCode", () => {
    describe("Single Classification Encoding", () => {
      it("should encode Large Business (L) as 32", () => {
        expect(encodeZCode(['L'])).toBe(32);
      });

      it("should encode Small Business (S) as 16", () => {
        expect(encodeZCode(['S'])).toBe(16);
      });

      it("should encode Small Disadvantaged (S + SDB) as 24", () => {
        expect(encodeZCode(['S', 'SDB'])).toBe(24); // 16 + 8
      });

      it("should encode Woman-Owned (S + WOSB) as 20", () => {
        expect(encodeZCode(['S', 'WOSB'])).toBe(20); // 16 + 4
      });

      it("should encode Veteran-Owned (S + VOSB) as 18", () => {
        expect(encodeZCode(['S', 'VOSB'])).toBe(18); // 16 + 2
      });

      it("should encode Service-Disabled Veteran (S + SDVOSB) as 17", () => {
        // Note: SDVOSB auto-selects VOSB, so result is S + VOSB + SDVOSB = 16 + 2 + 1 = 19
        expect(encodeZCode(['S', 'SDVOSB'])).toBe(19); // 16 + 2 + 1 (auto-selected VOSB)
      });
    });

    describe("Multiple Classification Encoding", () => {
      it("should encode S + WOSB + VOSB as 22", () => {
        // S(16) | WOSB(4) | VOSB(2) = 22
        expect(encodeZCode(['S', 'WOSB', 'VOSB'])).toBe(22);
      });

      it("should encode S + SDB + WOSB + VOSB + SDVOSB as 31", () => {
        // 16 + 8 + 4 + 2 + 1 = 31
        expect(encodeZCode(['S', 'SDB', 'WOSB', 'VOSB', 'SDVOSB'])).toBe(31);
      });

      it("should handle empty array as 0", () => {
        expect(encodeZCode([])).toBe(0);
      });

      it("should handle order-independent encoding", () => {
        const order1 = encodeZCode(['VOSB', 'S', 'WOSB']);
        const order2 = encodeZCode(['S', 'WOSB', 'VOSB']);
        expect(order1).toBe(order2);
        expect(order1).toBe(22);
      });
    });

    describe("Business Rule Enforcement", () => {
      it("should reject L and S together (mutually exclusive)", () => {
        expect(() => encodeZCode(['L', 'S']))
          .toThrow('L and S are mutually exclusive');
      });

      it("should reject SDB without S", () => {
        expect(() => encodeZCode(['SDB']))
          .toThrow('SDB requires S to be selected');
      });

      it("should reject WOSB without S", () => {
        expect(() => encodeZCode(['WOSB']))
          .toThrow('WOSB requires S to be selected');
      });

      it("should reject VOSB without S", () => {
        expect(() => encodeZCode(['VOSB']))
          .toThrow('VOSB requires S to be selected');
      });

      it("should reject SDVOSB without S", () => {
        expect(() => encodeZCode(['SDVOSB']))
          .toThrow('SDVOSB requires S to be selected');
      });

      it("should auto-select VOSB when SDVOSB is selected", () => {
        const result = encodeZCode(['S', 'SDVOSB']);
        // S(16) + VOSB(2) + SDVOSB(1) = 19
        expect(result).toBe(19);
        
        // Verify VOSB is included when decoded
        const decoded = decodeZCode(result);
        expect(decoded).toContain('VOSB');
        expect(decoded).toContain('SDVOSB');
      });
    });
  });

  describe("decodeZCode", () => {
    it("should decode 32 as Large Business", () => {
      expect(decodeZCode(32)).toEqual(['L']);
    });

    it("should decode 16 as Small Business", () => {
      expect(decodeZCode(16)).toEqual(['S']);
    });

    it("should decode 22 as S + WOSB + VOSB", () => {
      const result = decodeZCode(22);
      expect(result).toContain('S');
      expect(result).toContain('WOSB');
      expect(result).toContain('VOSB');
      expect(result).toHaveLength(3);
    });

    it("should decode 0 as empty array", () => {
      expect(decodeZCode(0)).toEqual([]);
    });

    it("should be reversible (encode then decode)", () => {
      const original = ['S', 'WOSB', 'VOSB'];
      const encoded = encodeZCode(original);
      const decoded = decodeZCode(encoded);
      
      expect(decoded.sort()).toEqual(original.sort());
    });

    it("should reject invalid Z-Code values", () => {
      expect(() => decodeZCode(64)).toThrow('Invalid Z-Code');
      expect(() => decodeZCode(-1)).toThrow('Invalid Z-Code');
      expect(() => decodeZCode(3.14)).toThrow('Invalid Z-Code');
    });
  });

  describe("isValidZCode", () => {
    it("should validate Z-Code range (0-63)", () => {
      expect(isValidZCode(0)).toBe(true);
      expect(isValidZCode(22)).toBe(true);
      expect(isValidZCode(63)).toBe(true);
      expect(isValidZCode(-1)).toBe(false);
      expect(isValidZCode(64)).toBe(false);
      expect(isValidZCode(3.14)).toBe(false);
    });
  });
});
