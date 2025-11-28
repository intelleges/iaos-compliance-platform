import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { partners, partnerAccessCodes, emailVerificationCodes, partnerSessions } from "../drizzle/schema";
import crypto from "crypto";

// ============================================================================
// PARTNER AUTHENTICATION (Access Code + Email Verification)
// ============================================================================

/**
 * Validate partner access code and return partner information
 */
export async function validatePartnerAccessCode(accessCode: string): Promise<{
  partnerEmail: string | null;
  partnerName: string | null;
  partnerId: number;
  expiresAt: Date | null;
  usedAt: Date | null;
} | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      partnerEmail: partners.email,
      partnerName: partners.name,
      partnerId: partnerAccessCodes.partnerId,
      expiresAt: partnerAccessCodes.expiresAt,
      usedAt: partnerAccessCodes.usedAt,
    })
    .from(partnerAccessCodes)
    .innerJoin(partners, eq(partnerAccessCodes.partnerId, partners.id))
    .where(eq(partnerAccessCodes.code, accessCode.toUpperCase()))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Generate and send email verification code to partner
 */
export async function sendPartnerVerificationCode(
  accessCode: string,
  partnerEmail: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate 6-digit code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store in database (expires in 15 minutes)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  
  // First get the accessCodeId
  const accessCodeRecord = await db
    .select({ id: partnerAccessCodes.id })
    .from(partnerAccessCodes)
    .where(eq(partnerAccessCodes.code, accessCode.toUpperCase()))
    .limit(1);
  
  if (accessCodeRecord.length === 0) {
    throw new Error("Access code not found");
  }
  
  await db.insert(emailVerificationCodes).values({
    accessCodeId: accessCodeRecord[0].id,
    email: partnerEmail,
    code: verificationCode,
    expiresAt,
    verified: false,
  });

  // TODO: Send email via SendGrid
  console.log(`[Partner Auth] Verification code for ${partnerEmail}: ${verificationCode}`);
  console.log(`[Partner Auth] Code expires at: ${expiresAt.toISOString()}`);
  
  // For now, just log the code (will integrate SendGrid later)
  // await sendEmail({
  //   to: partnerEmail,
  //   subject: 'Your Verification Code',
  //   text: `Your verification code is: ${verificationCode}`,
  // });
}

/**
 * Verify email verification code
 */
export async function verifyPartnerEmailCode(
  accessCode: string,
  verificationCode: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // First get the accessCodeId
  const accessCodeRecord = await db
    .select({ id: partnerAccessCodes.id })
    .from(partnerAccessCodes)
    .where(eq(partnerAccessCodes.code, accessCode.toUpperCase()))
    .limit(1);
  
  if (accessCodeRecord.length === 0) return false;
  
  const result = await db
    .select()
    .from(emailVerificationCodes)
    .where(
      and(
        eq(emailVerificationCodes.accessCodeId, accessCodeRecord[0].id),
        eq(emailVerificationCodes.code, verificationCode),
        eq(emailVerificationCodes.verified, false)
      )
    )
    .limit(1);

  if (result.length === 0) return false;

  const record = result[0];
  
  // Check if expired
  if (record.expiresAt && record.expiresAt < new Date()) {
    return false;
  }

  // Mark as verified
  await db
    .update(emailVerificationCodes)
    .set({ verified: true, verifiedAt: new Date() })
    .where(eq(emailVerificationCodes.id, record.id));

  return true;
}

/**
 * Create partner session after successful verification
 */
export async function createPartnerSession(accessCode: string): Promise<{
  sessionToken: string;
  partnerId: number;
} | null> {
  const db = await getDb();
  if (!db) return null;

  // Get partner info from access code
  const accessCodeData = await validatePartnerAccessCode(accessCode);
  if (!accessCodeData) return null;

  // Generate session token
  const sessionToken = crypto.randomBytes(32).toString('hex');
  
  // Create session (expires in 7 days)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  // Get the accessCodeId
  const accessCodeRecord = await db
    .select({ id: partnerAccessCodes.id })
    .from(partnerAccessCodes)
    .where(eq(partnerAccessCodes.code, accessCode.toUpperCase()))
    .limit(1);
  
  if (accessCodeRecord.length === 0) return null;
  
  await db.insert(partnerSessions).values({
    partnerId: accessCodeData.partnerId,
    sessionToken,
    accessCodeId: accessCodeRecord[0].id,
    expiresAt,
  });

  // Mark access code as used
  await db
    .update(partnerAccessCodes)
    .set({ usedAt: new Date(), used: true })
    .where(eq(partnerAccessCodes.code, accessCode.toUpperCase()));

  return {
    sessionToken,
    partnerId: accessCodeData.partnerId,
  };
}

/**
 * Get partner questionnaire assignment by access code
 */
export async function getAssignmentByAccessCode(accessCode: string) {
  const db = await getDb();
  if (!db) return null;

  const { partnerQuestionnaires } = await import("../drizzle/schema");
  
  const result = await db
    .select()
    .from(partnerQuestionnaires)
    .where(eq(partnerQuestionnaires.accessCode, accessCode))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
