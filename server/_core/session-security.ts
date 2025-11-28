/**
 * Session Security & Timeout Management
 * Implements INT.DOC.25 Section 3.1 Authentication Requirements
 * 
 * Session Duration Requirements:
 * - Admin Portal (SSO): 12 hours maximum, 2 hours idle timeout
 * - Supplier Portal (Access Code): 8 hours maximum, 1 hour idle timeout
 */

import type { Request, Response } from "express";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";

export interface SessionMetadata {
  createdAt: number; // Unix timestamp (ms)
  lastActivity: number; // Unix timestamp (ms)
  userType: "admin" | "supplier";
  userId: number;
  enterpriseId?: number;
}

/**
 * Session timeout limits per INT.DOC.25
 */
export const SESSION_LIMITS = {
  admin: {
    maxDuration: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
    idleTimeout: 2 * 60 * 60 * 1000,  // 2 hours in milliseconds
  },
  supplier: {
    maxDuration: 8 * 60 * 60 * 1000,  // 8 hours in milliseconds
    idleTimeout: 1 * 60 * 60 * 1000,  // 1 hour in milliseconds
  },
} as const;

/**
 * Check if session has expired based on max duration or idle timeout
 */
export function isSessionExpired(metadata: SessionMetadata): {
  expired: boolean;
  reason?: "max_duration" | "idle_timeout";
} {
  const now = Date.now();
  const limits = SESSION_LIMITS[metadata.userType];

  // Check max duration
  const sessionAge = now - metadata.createdAt;
  if (sessionAge > limits.maxDuration) {
    return { expired: true, reason: "max_duration" };
  }

  // Check idle timeout
  const idleTime = now - metadata.lastActivity;
  if (idleTime > limits.idleTimeout) {
    return { expired: true, reason: "idle_timeout" };
  }

  return { expired: false };
}

/**
 * Update session activity timestamp
 */
export function updateSessionActivity(metadata: SessionMetadata): SessionMetadata {
  return {
    ...metadata,
    lastActivity: Date.now(),
  };
}

/**
 * Create new session metadata
 */
export function createSessionMetadata(
  userId: number,
  userType: "admin" | "supplier",
  enterpriseId?: number
): SessionMetadata {
  const now = Date.now();
  return {
    createdAt: now,
    lastActivity: now,
    userType,
    userId,
    enterpriseId,
  };
}

/**
 * Clear expired session cookie
 */
export function clearExpiredSession(req: Request, res: Response): void {
  const cookieOptions = getSessionCookieOptions(req);
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
}

/**
 * Middleware to check session expiration on each request
 * Should be called in tRPC context creation
 */
export function validateSessionTimeout(
  sessionMetadata: SessionMetadata | null,
  req: Request,
  res: Response
): SessionMetadata | null {
  if (!sessionMetadata) {
    return null;
  }

  const { expired, reason } = isSessionExpired(sessionMetadata);

  if (expired) {
    console.log(`[Session] Session expired for user ${sessionMetadata.userId} (reason: ${reason})`);
    clearExpiredSession(req, res);
    return null;
  }

  // Update activity timestamp for valid session
  return updateSessionActivity(sessionMetadata);
}
