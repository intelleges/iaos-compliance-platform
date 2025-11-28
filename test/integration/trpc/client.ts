/**
 * tRPC Test Client Utilities
 * Based on INT.DOC.23 Section 2.1 - Test Client Setup
 * 
 * Provides helper functions to create authenticated test clients
 */

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../server/routers';
import jwt from 'jsonwebtoken';
import { ENV } from '../../../server/_core/env';

export interface TestTokenPayload {
  role: 'admin' | 'compliance_officer' | 'compliance_manager' | 'compliance_editor' | 'viewer' | 'supplier';
  enterpriseId: number;
  userId: number;
  type?: 'supplier' | 'admin';
}

/**
 * Generate a test JWT token for authentication
 */
export function generateTestToken(payload: TestTokenPayload): string {
  const expiresIn = payload.type === 'supplier' ? '8h' : '12h';
  
  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
      enterpriseId: payload.enterpriseId,
      type: payload.type || 'admin',
    },
    ENV.jwtSecret,
    { expiresIn }
  );
}

/**
 * Create a tRPC test client with optional session token
 */
export function createTestClient(sessionToken?: string) {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: 'http://localhost:3000/api/trpc',
        headers: sessionToken
          ? {
              Authorization: `Bearer ${sessionToken}`,
            }
          : {},
      }),
    ],
  });
}

/**
 * Create an admin session for enterprise
 */
export async function createAdminSession(enterpriseId: number = 1) {
  const token = generateTestToken({
    role: 'admin',
    enterpriseId,
    userId: 1,
  });

  return { client: createTestClient(token), token };
}

/**
 * Create a compliance officer session
 */
export async function createOfficerSession(enterpriseId: number = 1, userId: number = 2) {
  const token = generateTestToken({
    role: 'compliance_officer',
    enterpriseId,
    userId,
  });

  return { client: createTestClient(token), token };
}

/**
 * Create a compliance manager session
 */
export async function createManagerSession(enterpriseId: number = 1, userId: number = 3) {
  const token = generateTestToken({
    role: 'compliance_manager',
    enterpriseId,
    userId,
  });

  return { client: createTestClient(token), token };
}

/**
 * Create a compliance editor session
 */
export async function createEditorSession(enterpriseId: number = 1, userId: number = 4) {
  const token = generateTestToken({
    role: 'compliance_editor',
    enterpriseId,
    userId,
  });

  return { client: createTestClient(token), token };
}

/**
 * Create a supplier session with access code
 */
export async function createSupplierSession(accessCode: string) {
  const token = generateTestToken({
    role: 'supplier',
    enterpriseId: 1,
    userId: 999, // Supplier user ID
    type: 'supplier',
  });

  return { client: createTestClient(token), token };
}

/**
 * Create an unauthenticated client (no session)
 */
export function createUnauthenticatedClient() {
  return createTestClient();
}
