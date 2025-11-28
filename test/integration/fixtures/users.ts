/**
 * Test User Fixtures
 * Predefined test users matching INT.DOC.21 Section 5.1
 * Enterprise ID 999 is reserved for testing
 */

import type { User } from "../../drizzle/schema";

export const TEST_ENTERPRISE_ID = 999;

export const testUsers = {
  enterpriseAdmin: {
    id: 9001,
    openId: "test-admin-openid",
    email: "admin@test-enterprise.com",
    name: "Test Admin",
    firstName: "Test",
    lastName: "Admin",
    loginMethod: "manus",
    role: "admin" as const,
    enterpriseId: TEST_ENTERPRISE_ID,
    title: "System Administrator",
    phone: null,
    internalId: null,
    active: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    lastSignedIn: new Date("2025-01-01"),
  } satisfies User,

  complianceManager: {
    id: 9002,
    openId: "test-manager-openid",
    email: "manager@test-enterprise.com",
    name: "Test Manager",
    firstName: "Test",
    lastName: "Manager",
    loginMethod: "manus",
    role: "compliance_officer" as const,
    enterpriseId: TEST_ENTERPRISE_ID,
    title: "Compliance Manager",
    phone: null,
    internalId: null,
    active: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    lastSignedIn: new Date("2025-01-01"),
  } satisfies User,

  complianceEditor: {
    id: 9003,
    openId: "test-editor-openid",
    email: "editor@test-enterprise.com",
    name: "Test Editor",
    firstName: "Test",
    lastName: "Editor",
    loginMethod: "manus",
    role: "compliance_officer" as const,
    enterpriseId: TEST_ENTERPRISE_ID,
    title: "Compliance Editor",
    phone: null,
    internalId: null,
    active: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    lastSignedIn: new Date("2025-01-01"),
  } satisfies User,

  readOnlyViewer: {
    id: 9004,
    openId: "test-viewer-openid",
    email: "viewer@test-enterprise.com",
    name: "Test Viewer",
    firstName: "Test",
    lastName: "Viewer",
    loginMethod: "manus",
    role: "user" as const,
    enterpriseId: TEST_ENTERPRISE_ID,
    title: "Read Only Viewer",
    phone: null,
    internalId: null,
    active: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    lastSignedIn: new Date("2025-01-01"),
  } satisfies User,

  supplierContact: {
    id: 9005,
    openId: "test-supplier-openid",
    email: "supplier@acme-corp.com",
    name: "John Supplier",
    firstName: "John",
    lastName: "Supplier",
    loginMethod: "access_code",
    role: "supplier" as const,
    enterpriseId: null, // Suppliers are not scoped to enterprises
    title: "Procurement Contact",
    phone: "+1-555-0123",
    internalId: null,
    active: true,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    lastSignedIn: new Date("2025-01-01"),
  } satisfies User,
};

export const TEST_ACCESS_CODE = "TESTCODE1234";

/**
 * Helper to create test user context for tRPC procedures
 */
export function createTestUserContext(userType: keyof typeof testUsers) {
  const user = testUsers[userType];
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as any,
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as any,
  };
}

/**
 * Helper to create unauthenticated context
 */
export function createUnauthenticatedContext() {
  return {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as any,
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as any,
  };
}
