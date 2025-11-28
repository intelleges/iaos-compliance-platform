/**
 * Test Partner Fixtures
 * Predefined test partner data matching INT.DOC.21 Section 5.2
 */

import type { Partner } from "../../drizzle/schema";
import { TEST_ENTERPRISE_ID } from "./users";

export const testPartners = {
  smallBusiness: {
    id: 8001,
    enterpriseId: TEST_ENTERPRISE_ID,
    name: "Test Small Business LLC",
    dunsNumber: "123456789",
    cageCode: "1TST2",
    federalId: "12-3456789",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@smallbiz.com",
    phone: "+1-555-0100",
    address1: "123 Main St",
    address2: null,
    city: "Springfield",
    state: "VA",
    province: null,
    zipcode: "22150",
    countryCode: "US",
    status: 1, // Active
    partnerTypeId: 1,
    active: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  } satisfies Partial<Partner>,

  largeBusiness: {
    id: 8002,
    enterpriseId: TEST_ENTERPRISE_ID,
    name: "Test Large Corp Inc",
    dunsNumber: "987654321",
    cageCode: "2TST3",
    federalId: "98-7654321",
    firstName: "Robert",
    lastName: "Johnson",
    email: "robert@largecorp.com",
    phone: "+1-555-0200",
    address1: "456 Corporate Blvd",
    address2: "Suite 1000",
    city: "Arlington",
    state: "VA",
    province: null,
    zipcode: "22201",
    countryCode: "US",
    status: 1,
    partnerTypeId: 1,
    active: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  } satisfies Partial<Partner>,

  womanOwnedBusiness: {
    id: 8003,
    enterpriseId: TEST_ENTERPRISE_ID,
    name: "Women's Tech Solutions LLC",
    dunsNumber: "555123456",
    cageCode: "3TST4",
    federalId: "55-5123456",
    firstName: "Maria",
    lastName: "Garcia",
    email: "maria@womenstech.com",
    phone: "+1-555-0300",
    address1: "789 Innovation Dr",
    address2: null,
    city: "Alexandria",
    state: "VA",
    province: null,
    zipcode: "22314",
    countryCode: "US",
    status: 1,
    partnerTypeId: 1,
    active: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  } satisfies Partial<Partner>,

  veteranOwnedBusiness: {
    id: 8004,
    enterpriseId: TEST_ENTERPRISE_ID,
    name: "Veteran Services Inc",
    dunsNumber: "555789012",
    cageCode: "4TST5",
    federalId: "55-5789012",
    firstName: "James",
    lastName: "Miller",
    email: "james@vetservices.com",
    phone: "+1-555-0400",
    address1: "321 Veterans Way",
    address2: null,
    city: "Fairfax",
    state: "VA",
    province: null,
    zipcode: "22030",
    countryCode: "US",
    status: 1,
    partnerTypeId: 1,
    active: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  } satisfies Partial<Partner>,
};

/**
 * Z-Code Reference (from INT.DOC.21)
 * Socioeconomic classification encoding
 * 
 * Base values:
 * - S (Small Business): 2
 * - WOSB (Woman-Owned Small Business): 4
 * - VOSB (Veteran-Owned Small Business): 8
 * - HUBZone: 16
 * - Large Business: 32
 * 
 * Examples:
 * - 22 = S (2) + WOSB (4) + VOSB (8) + HUBZone (16) = Small, Woman, Veteran, HUBZone
 * - 12 = S (2) + WOSB (4) + VOSB (8) = Small, Woman, Veteran
 * - 10 = S (2) + VOSB (8) = Small, Veteran
 * - 32 = Large Business
 */
