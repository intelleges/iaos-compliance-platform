import { eq, and, desc, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  enterprises,
  partners,
  protocols,
  touchpoints,
  questionnaires,
  partnerQuestionnaires,
  groups,
  roles,
  type User,
  type Enterprise,
  type Partner,
  type Protocol,
  type Touchpoint,
  type Questionnaire,
  type PartnerQuestionnaire,
  type Group,
  type Role
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "firstName", "lastName", "title", "phone", "internalId"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    
    if (user.enterpriseId !== undefined) {
      values.enterpriseId = user.enterpriseId;
      updateSet.enterpriseId = user.enterpriseId;
    }
    
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    
    if (user.active !== undefined) {
      values.active = user.active;
      updateSet.active = user.active;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all active users for an enterprise (multi-tenant scoped)
 */
export async function getUsersByEnterprise(enterpriseId: number): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(users)
    .where(and(
      eq(users.enterpriseId, enterpriseId),
      eq(users.active, true)
    ))
    .orderBy(desc(users.createdAt));
}

// ============================================================================
// ENTERPRISE MANAGEMENT
// ============================================================================

export async function getEnterpriseById(id: number): Promise<Enterprise | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(enterprises).where(eq(enterprises.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllEnterprises(): Promise<Enterprise[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(enterprises)
    .where(eq(enterprises.active, true))
    .orderBy(enterprises.companyName);
}

// ============================================================================
// PARTNER (SUPPLIER) MANAGEMENT
// ============================================================================

/**
 * Get all active partners for an enterprise (multi-tenant scoped)
 */
export async function getPartnersByEnterprise(enterpriseId: number): Promise<Partner[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(partners)
    .where(and(
      eq(partners.enterpriseId, enterpriseId),
      eq(partners.active, true)
    ))
    .orderBy(partners.name);
}

export async function getPartnerById(id: number, enterpriseId?: number): Promise<Partner | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const conditions = [eq(partners.id, id)];
  if (enterpriseId !== undefined) {
    conditions.push(eq(partners.enterpriseId, enterpriseId));
  }

  const result = await db
    .select()
    .from(partners)
    .where(and(...conditions))
    .limit(1);
    
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Search partners by email (for reference shadowing/deduplication)
 */
export async function getPartnersByEmail(email: string, enterpriseId: number): Promise<Partner[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(partners)
    .where(and(
      eq(partners.email, email),
      eq(partners.enterpriseId, enterpriseId),
      eq(partners.active, true)
    ));
}

// ============================================================================
// PROTOCOL (COMPLIANCE CAMPAIGN) MANAGEMENT
// ============================================================================

export async function getProtocolsByEnterprise(enterpriseId: number): Promise<Protocol[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(protocols)
    .where(and(
      eq(protocols.enterpriseId, enterpriseId),
      eq(protocols.active, true)
    ))
    .orderBy(desc(protocols.startDate));
}

export async function getProtocolById(id: number, enterpriseId?: number): Promise<Protocol | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const conditions = [eq(protocols.id, id)];
  if (enterpriseId !== undefined) {
    conditions.push(eq(protocols.enterpriseId, enterpriseId));
  }

  const result = await db
    .select()
    .from(protocols)
    .where(and(...conditions))
    .limit(1);
    
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// TOUCHPOINT (SUPPLIER INTERACTION) MANAGEMENT
// ============================================================================

export async function getTouchpointsByProtocol(protocolId: number): Promise<Touchpoint[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(touchpoints)
    .where(and(
      eq(touchpoints.protocolId, protocolId),
      eq(touchpoints.active, true)
    ))
    .orderBy(touchpoints.sortOrder);
}

export async function getTouchpointById(id: number): Promise<Touchpoint | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(touchpoints).where(eq(touchpoints.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllTouchpoints(enterpriseId?: number): Promise<Touchpoint[]> {
  const db = await getDb();
  if (!db) return [];

  // For now, return all touchpoints (enterprise filtering can be added via protocol join later)
  return await db
    .select()
    .from(touchpoints)
    .where(eq(touchpoints.active, true))
    .orderBy(desc(touchpoints.createdAt));
}

export async function createTouchpoint(data: {
  protocolId: number;
  title: string;
  description?: string;
  abbreviation?: string;
  purpose?: string;
  startDate?: Date;
  endDate?: Date;
  target?: number;
  automaticReminder?: boolean;
}): Promise<Touchpoint> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result = await db.insert(touchpoints).values({
    protocolId: data.protocolId,
    title: data.title,
    description: data.description,
    abbreviation: data.abbreviation,
    purpose: data.purpose,
    startDate: data.startDate,
    endDate: data.endDate,
    target: data.target,
    automaticReminder: data.automaticReminder,
    active: true,
  });

  const insertedId = Number((result as any).insertId);
  const touchpoint = await getTouchpointById(insertedId);
  if (!touchpoint) throw new Error('Failed to retrieve created touchpoint');
  return touchpoint;
}

export async function updateTouchpoint(id: number, data: {
  protocolId?: number;
  title?: string;
  description?: string;
  abbreviation?: string;
  purpose?: string;
  startDate?: Date;
  endDate?: Date;
  target?: number;
  automaticReminder?: boolean;
}): Promise<Touchpoint> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(touchpoints).set(data).where(eq(touchpoints.id, id));

  const touchpoint = await getTouchpointById(id);
  if (!touchpoint) throw new Error('Touchpoint not found after update');
  return touchpoint;
}

export async function archiveTouchpoint(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.update(touchpoints).set({ active: false }).where(eq(touchpoints.id, id));
}

// ============================================================================
// QUESTIONNAIRE MANAGEMENT
// ============================================================================

export async function getQuestionnairesByEnterprise(enterpriseId: number): Promise<Questionnaire[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(questionnaires)
    .where(and(
      eq(questionnaires.enterpriseId, enterpriseId),
      eq(questionnaires.active, true)
    ))
    .orderBy(desc(questionnaires.createdAt));
}

export async function getQuestionnaireById(id: number, enterpriseId?: number): Promise<Questionnaire | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const conditions = [eq(questionnaires.id, id)];
  if (enterpriseId !== undefined) {
    conditions.push(eq(questionnaires.enterpriseId, enterpriseId));
  }

  const result = await db
    .select()
    .from(questionnaires)
    .where(and(...conditions))
    .limit(1);
    
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// PARTNER QUESTIONNAIRE (PPTQ) MANAGEMENT
// ============================================================================

/**
 * Get partner questionnaire by access code (for supplier portal)
 */
export async function getPartnerQuestionnaireByAccessCode(accessCode: string): Promise<PartnerQuestionnaire | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(partnerQuestionnaires)
    .where(eq(partnerQuestionnaires.accessCode, accessCode))
    .limit(1);
    
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all questionnaires assigned to a partner
 */
export async function getPartnerQuestionnairesByPartner(partnerId: number): Promise<PartnerQuestionnaire[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(partnerQuestionnaires)
    .where(eq(partnerQuestionnaires.partnerId, partnerId))
    .orderBy(desc(partnerQuestionnaires.invitedDate));
}

// ============================================================================
// GROUP MANAGEMENT
// ============================================================================

export async function getGroupsByEnterprise(enterpriseId: number): Promise<Group[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(groups)
    .where(and(
      eq(groups.enterpriseId, enterpriseId),
      eq(groups.active, true)
    ))
    .orderBy(groups.name);
}

export async function getGroupById(id: number, enterpriseId?: number): Promise<Group | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const conditions = [eq(groups.id, id)];
  if (enterpriseId !== undefined) {
    conditions.push(eq(groups.enterpriseId, enterpriseId));
  }

  const result = await db
    .select()
    .from(groups)
    .where(and(...conditions))
    .limit(1);
    
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// ROLE MANAGEMENT
// ============================================================================

export async function getRolesByEnterprise(enterpriseId: number | null): Promise<Role[]> {
  const db = await getDb();
  if (!db) return [];

  const condition = enterpriseId === null 
    ? isNull(roles.enterpriseId) 
    : eq(roles.enterpriseId, enterpriseId);

  return await db
    .select()
    .from(roles)
    .where(and(
      condition,
      eq(roles.active, true)
    ))
    .orderBy(roles.accessLevel);
}

export async function getRoleById(id: number): Promise<Role | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique access code for partner questionnaires
 */
export function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validate enterprise access for multi-tenant operations
 */
export function validateEnterpriseAccess(
  userEnterpriseId: number | null | undefined,
  resourceEnterpriseId: number | null | undefined,
  isSuperAdmin: boolean
): boolean {
  // Super admins can access all enterprises
  if (isSuperAdmin) return true;
  
  // Must have matching enterprise IDs
  return userEnterpriseId === resourceEnterpriseId;
}

