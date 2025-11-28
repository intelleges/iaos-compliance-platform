/**
 * Session Management Rules per INT.DOC.12
 * Business Rule SE-001: Supplier sessions expire after 8 hours of inactivity
 * Business Rule SE-002: Admin sessions expire after 12 hours of inactivity
 * Business Rule SE-003: Session cookies must be HttpOnly and Secure
 * Business Rule SE-004: Only one active session per access code allowed
 */

export const SESSION_CONFIG = {
  SUPPLIER_EXPIRY_SECONDS: 8 * 60 * 60, // 8 hours = 28800 seconds
  ADMIN_EXPIRY_SECONDS: 12 * 60 * 60, // 12 hours = 43200 seconds
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: true, // Requires HTTPS
    sameSite: 'lax' as const,
  },
} as const;

/**
 * Get session expiry duration based on user role
 * @param {string} role - User role ('admin' or 'user')
 * @returns {number} Session expiry in seconds
 */
export function getSessionExpiry(role: 'admin' | 'user'): number {
  return role === 'admin' 
    ? SESSION_CONFIG.ADMIN_EXPIRY_SECONDS 
    : SESSION_CONFIG.SUPPLIER_EXPIRY_SECONDS;
}

/**
 * Check if session has expired
 * @param {Date} lastActivity - Last activity timestamp
 * @param {string} role - User role
 * @returns {boolean} True if session has expired
 */
export function isSessionExpired(lastActivity: Date, role: 'admin' | 'user'): boolean {
  const expirySeconds = getSessionExpiry(role);
  const expiryMs = expirySeconds * 1000;
  const now = Date.now();
  const lastActivityMs = lastActivity.getTime();
  
  return (now - lastActivityMs) > expiryMs;
}

/**
 * Calculate session expiry timestamp
 * @param {string} role - User role
 * @returns {Date} Expiry timestamp
 */
export function calculateSessionExpiry(role: 'admin' | 'user'): Date {
  const expirySeconds = getSessionExpiry(role);
  return new Date(Date.now() + expirySeconds * 1000);
}
