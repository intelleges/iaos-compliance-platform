import { TRPCError } from '@trpc/server';

/**
 * Supplier session configuration
 * - Max session duration: 8 hours
 * - Idle timeout: 1 hour
 * - Single-use access code (invalidated on submission)
 */
export const SESSION_CONFIG = {
  MAX_DURATION_MS: 8 * 60 * 60 * 1000,  // 8 hours
  IDLE_TIMEOUT_MS: 60 * 60 * 1000,       // 1 hour
} as const;

/**
 * Supplier session data stored in cookie/JWT
 */
export interface SupplierSession {
  sessionId: string;
  assignmentId: number;
  accessCode: string;
  partnerId: number;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
}

// In-memory session store (for testing - in production this would be Redis/database)
const sessionStore = new Map<string, SupplierSession>();

/**
 * Validate supplier session is still active
 * 
 * @param session - Supplier session data
 * @throws TRPCError if session expired or idle timeout exceeded
 */
export function validateSupplierSession(session: SupplierSession): void {
  const now = Date.now();
  
  // Convert Date fields to timestamps (handle both Date objects and ISO strings from JSON)
  const createdAt = typeof session.createdAt === 'string' 
    ? new Date(session.createdAt).getTime() 
    : (session.createdAt as unknown as number);
  
  const lastActivityAt = typeof session.lastActivityAt === 'string'
    ? new Date(session.lastActivityAt).getTime()
    : (session.lastActivityAt as unknown as number);
  
  // Check max session duration (8 hours)
  const sessionAge = now - createdAt;
  if (sessionAge > SESSION_CONFIG.MAX_DURATION_MS) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Session expired. Please enter your access code again.',
    });
  }
  
  // Check idle timeout (1 hour)
  const idleTime = now - lastActivityAt;
  if (idleTime > SESSION_CONFIG.IDLE_TIMEOUT_MS) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Session timed out due to inactivity. Please enter your access code again.',
    });
  }
}

/**
 * Create new supplier session
 * 
 * @param params - Session parameters
 * @returns Supplier session data
 */
export function createSupplierSession(params: {
  accessCode: string;
  assignmentId: number;
  partnerId: number;
}): SupplierSession {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_CONFIG.MAX_DURATION_MS);
  
  const session: SupplierSession = {
    sessionId: crypto.randomUUID(),
    assignmentId: params.assignmentId,
    accessCode: params.accessCode,
    partnerId: params.partnerId,
    createdAt: now,
    expiresAt,
    lastActivityAt: now,
  };
  
  // Store session
  sessionStore.set(session.sessionId, session);
  
  return session;
}

/**
 * Get supplier session by ID
 * 
 * @param sessionId - Session ID
 * @returns Supplier session data or undefined if not found/expired
 */
export function getSupplierSession(sessionId: string): SupplierSession | undefined {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    return undefined;
  }
  
  const now = new Date();
  
  // Check if session expired (8-hour max)
  if (now > session.expiresAt) {
    sessionStore.delete(sessionId);
    return undefined;
  }
  
  // Check if session idle (1-hour timeout)
  const idleTime = now.getTime() - session.lastActivityAt.getTime();
  if (idleTime > SESSION_CONFIG.IDLE_TIMEOUT_MS) {
    sessionStore.delete(sessionId);
    return undefined;
  }
  
  // Update last activity timestamp
  (session as any).lastActivityAt = now;
  sessionStore.set(sessionId, session);
  
  return session;
}

/**
 * Invalidate supplier session
 * 
 * @param sessionId - Session ID to invalidate
 */
export function invalidateSupplierSession(sessionId: string): void {
  sessionStore.delete(sessionId);
}

/**
 * Update last activity timestamp for session
 * 
 * @param session - Supplier session data
 * @returns Updated session data
 */
export function updateSessionActivity(session: SupplierSession): SupplierSession {
  return {
    ...session,
    lastActivityAt: Date.now() as any,
  };
}

/**
 * Check if session should be refreshed (activity update)
 * Refresh if last activity was more than 5 minutes ago
 * 
 * @param session - Supplier session data
 * @returns true if session should be refreshed
 */
export function shouldRefreshSession(session: SupplierSession): boolean {
  const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;  // 5 minutes
  const timeSinceActivity = Date.now() - (session.lastActivityAt as unknown as number);
  return timeSinceActivity > REFRESH_THRESHOLD_MS;
}
