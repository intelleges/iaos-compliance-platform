import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, date, decimal } from "drizzle-orm/mysql-core";

/**
 * Federal Compliance Management Platform Schema
 * Adapted from 25-year-old SQL Server schema for FAR/DFARS/eSRS reporting
 * 
 * ARCHITECTURE PRINCIPLES:
 * - Multi-tenant: All tables scoped by enterpriseId
 * - Archive pattern: `active` column (1=active, 0=archived) - NO hard deletes
 * - Row-level security: Enforced in tRPC procedures
 * - Audit trail: createdAt, updatedAt timestamps on all entities
 */

// ============================================================================
// CORE USER & AUTH TABLES
// ============================================================================

/**
 * Core user table backing auth flow.
 * Maps to legacy `person` table for internal users (procurement, compliance teams)
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "enterprise_owner", "compliance_officer", "procurement_team", "supplier"]).default("user").notNull(),
  
  // Multi-tenant scoping
  enterpriseId: int("enterpriseId"), // NULL for super admins
  
  // Legacy person fields
  firstName: varchar("firstName", { length: 200 }),
  lastName: varchar("lastName", { length: 200 }),
  title: varchar("title", { length: 50 }),
  phone: varchar("phone", { length: 100 }),
  internalId: varchar("internalId", { length: 20 }), // Legacy employee ID
  
  // Archive pattern
  active: boolean("active").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// MULTI-TENANT & ORGANIZATION TABLES
// ============================================================================

/**
 * Enterprise (Tenant) - like Honeywell, large federal contractors
 * Legacy: `enterprise` table
 */
export const enterprises = mysqlTable("enterprises", {
  id: int("id").autoincrement().primaryKey(),
  description: varchar("description", { length: 100 }).notNull(),
  companyName: varchar("companyName", { length: 50 }),
  instanceName: varchar("instanceName", { length: 50 }), // Subdomain/instance identifier
  
  // Subscription & limits
  userMax: int("userMax"),
  partnerMax: int("partnerMax"),
  subscriptionType: int("subscriptionType"),
  subscriptionStatus: int("subscriptionStatus"),
  licenseStartDate: date("licenseStartDate"),
  licenseEndDate: date("licenseEndDate"),
  
  // Configuration
  logo: text("logo"), // S3 URL
  applicationPath: varchar("applicationPath", { length: 500 }),
  
  // Archive pattern
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Enterprise = typeof enterprises.$inferSelect;
export type InsertEnterprise = typeof enterprises.$inferInsert;

/**
 * Roles - RBAC system
 * Legacy: `role` table
 */
export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  description: varchar("description", { length: 50 }),
  accessLevel: int("accessLevel"), // Hierarchical access (1=lowest, 10=highest)
  enterpriseId: int("enterpriseId"), // NULL for system roles
  
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

/**
 * User-Role mapping
 * Legacy: `personRole` table
 */
export const userRoles = mysqlTable("userRoles", {
  userId: int("userId").notNull(),
  roleId: int("roleId").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// PARTNER (SUPPLIER) TABLES
// ============================================================================

/**
 * Partner (Supplier) - external companies providing compliance data
 * Legacy: `partner` table
 */
export const partners = mysqlTable("partners", {
  id: int("id").autoincrement().primaryKey(),
  enterpriseId: int("enterpriseId").notNull(),
  
  // Identification
  internalId: varchar("internalId", { length: 255 }), // Client's internal supplier ID
  name: varchar("name", { length: 255 }),
  dunsNumber: varchar("dunsNumber", { length: 255 }),
  federalId: varchar("federalId", { length: 255 }), // EIN/TIN
  cageCode: varchar("cageCode", { length: 50 }), // CAGE code for federal contractors
  
  // Address
  address1: varchar("address1", { length: 255 }),
  address2: text("address2"),
  city: varchar("city", { length: 255 }),
  state: varchar("state", { length: 50 }),
  province: varchar("province", { length: 50 }),
  zipcode: varchar("zipcode", { length: 200 }),
  countryCode: varchar("countryCode", { length: 10 }),
  
  // Primary contact
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  title: varchar("title", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 100 }),
  fax: varchar("fax", { length: 100 }),
  
  // Status & classification
  status: int("status"), // Partner status (active, pending, suspended, etc.)
  partnerTypeId: int("partnerTypeId"), // Classification (direct supplier, subcontractor, etc.)
  
  // Archive pattern
  active: boolean("active").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;

/**
 * Partner Types - classification of suppliers
 * Legacy: `partnerType` table
 */
export const partnerTypes = mysqlTable("partnerTypes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }),
  alias: varchar("alias", { length: 50 }),
  description: varchar("description", { length: 50 }).notNull(),
  partnerClass: int("partnerClass"),
  enterpriseId: int("enterpriseId"),
  
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PartnerType = typeof partnerTypes.$inferSelect;
export type InsertPartnerType = typeof partnerTypes.$inferInsert;

/**
 * Partner Status lookup
 * Legacy: `partnerStatus` table
 */
export const partnerStatuses = mysqlTable("partnerStatuses", {
  id: int("id").autoincrement().primaryKey(),
  description: varchar("description", { length: 50 }).notNull(),
  
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PartnerStatus = typeof partnerStatuses.$inferSelect;

// ============================================================================
// PROTOCOL (COMPLIANCE CAMPAIGN) TABLES
// ============================================================================

/**
 * Protocol - compliance campaign (e.g., annual FAR/DFARS reporting cycle)
 * Legacy: `protocol` table
 */
export const protocols = mysqlTable("protocols", {
  id: int("id").autoincrement().primaryKey(),
  enterpriseId: int("enterpriseId"),
  
  name: varchar("name", { length: 50 }),
  description: varchar("description", { length: 100 }),
  abbreviation: varchar("abbreviation", { length: 50 }),
  
  // Campaign details
  background: varchar("background", { length: 500 }),
  purpose: varchar("purpose", { length: 500 }),
  summary: varchar("summary", { length: 500 }),
  
  // Ownership
  adminId: int("adminId"), // Protocol administrator
  sponsorId: int("sponsorId"), // Executive sponsor
  
  // Timeline
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  
  // Archive pattern
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Protocol = typeof protocols.$inferSelect;
export type InsertProtocol = typeof protocols.$inferInsert;

// ============================================================================
// TOUCHPOINT (SUPPLIER INTERACTION) TABLES
// ============================================================================

/**
 * Touchpoint - specific supplier interaction within a protocol
 * Legacy: `touchpoint` table
 */
export const touchpoints = mysqlTable("touchpoints", {
  id: int("id").autoincrement().primaryKey(),
  protocolId: int("protocolId"),
  
  title: varchar("title", { length: 50 }),
  description: text("description"),
  abbreviation: varchar("abbreviation", { length: 50 }),
  purpose: text("purpose"),
  
  // Ownership
  personId: int("personId"), // Touchpoint owner
  sponsorId: int("sponsorId"),
  adminId: int("adminId"),
  
  // Configuration
  target: int("target"), // Target response count
  automaticReminder: boolean("automaticReminder"),
  
  // Timeline
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  
  // CUI (Controlled Unclassified Information) classification
  // Per NIST 800-171 - marks touchpoint as containing CUI data
  isCUI: boolean("isCUI").default(false).notNull(),
  
  // Archive pattern
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Touchpoint = typeof touchpoints.$inferSelect;
export type InsertTouchpoint = typeof touchpoints.$inferInsert;

// ============================================================================
// QUESTIONNAIRE TABLES
// ============================================================================

/**
 * Questionnaire - compliance form template
 * Legacy: `questionnaire` table
 */
export const questionnaires = mysqlTable("questionnaires", {
  id: int("id").autoincrement().primaryKey(),
  enterpriseId: int("enterpriseId"),
  
  title: text("title"),
  description: text("description"),
  footer: varchar("footer", { length: 100 }),
  
  // Configuration
  locked: boolean("locked"), // Prevent editing if responses exist
  multiLanguage: boolean("multiLanguage"),
  levelType: int("levelType"), // Partner-level vs. location-level
  
  // Ownership
  personId: int("personId").notNull(), // Creator
  partnerTypeId: int("partnerTypeId").notNull(), // Target partner type
  
  // Archive pattern
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Questionnaire = typeof questionnaires.$inferSelect;
export type InsertQuestionnaire = typeof questionnaires.$inferInsert;

/**
 * Question - individual question in a questionnaire
 * Legacy: `question` table
 */
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  questionnaireId: int("questionnaireId").notNull(), // Links to questionnaires table
  
  question: text("question"), // Question text (can contain <hint> tags)
  name: text("name"), // Internal name/identifier
  title: text("title").notNull(), // Display title
  tag: text("tag"), // Categorization tag
  hintText: text("hintText"), // Tooltip definition for <hint> tags
  
  // Section & Organization (QMS Template fields)
  page: int("page"), // Page number grouping
  sectionCode: varchar("sectionCode", { length: 50 }), // Section identifier (e.g., "1. Response Types - Y/N")
  
  // Response configuration
  responseType: int("responseType"), // Text, dropdown, checkbox, date, file upload, etc.
  required: boolean("required"),
  weight: int("weight"), // For scoring (legacy - use qWeight instead)
  
  // Validation (QMS Template fields)
  minLength: int("minLength").default(0), // Minimum text length (0=no minimum)
  titleLength: int("titleLength").default(0), // Title length validation
  
  // Skip Logic (QMS Template fields - enhanced)
  hasSkipLogic: boolean("hasSkipLogic").default(false).notNull(), // Y/N flag for skip logic
  skipLogicTrigger: varchar("skipLogicTrigger", { length: 50 }), // Trigger value ("0"=NO, "1"=YES, "NA")
  skipLogicTarget: int("skipLogicTarget"), // Target question ID to jump to
  skipLogicAnswer: int("skipLogicAnswer"), // Legacy field - use skipLogicTrigger instead
  skipLogicJump: text("skipLogicJump"), // Legacy field - use skipLogicTarget instead
  
  // Conditional UI Messages (QMS Template fields)
  commentMessage: text("commentMessage"), // Message shown with comment box
  uploadMessage: text("uploadMessage"), // Message shown with file upload
  calendarMessage: text("calendarMessage"), // Message shown with date picker
  
  // Comment/upload options (legacy fields)
  commentRequired: boolean("commentRequired"),
  commentBoxTxt: text("commentBoxTxt"), // Legacy - use commentMessage instead
  commentUploadTxt: varchar("commentUploadTxt", { length: 500 }), // Legacy - use uploadMessage instead
  commentType: varchar("commentType", { length: 50 }), // YN_COMMENT_Y, YN_UPLOAD_Y, CALENDAR, etc.
  
  // Scoring (QMS Template fields)
  yesScore: int("yesScore").default(1), // Score for YES answer
  noScore: int("noScore").default(0), // Score for NO answer
  naScore: int("naScore").default(-1), // Score for N/A answer
  otherScore: int("otherScore").default(-1), // Score for OTHER answer
  qWeight: decimal("qWeight", { precision: 5, scale: 2 }).default("0.00"), // Question weight for scoring
  
  // Sub-Questionnaires (QMS Template fields)
  hasSpinoff: boolean("hasSpinoff").default(false).notNull(), // Y/N trigger sub-questionnaire
  spinoffId: varchar("spinoffId", { length: 100 }), // Sub-questionnaire ID reference (e.g., "1:5001")
  
  // Email Alerts (QMS Template fields)
  hasEmailAlert: boolean("hasEmailAlert").default(false).notNull(), // Y/N send email on answer
  emailAlertList: text("emailAlertList"), // Email addresses to notify (e.g., "1:alert@company.com")
  emailAlert: boolean("emailAlert"), // Legacy field - use hasEmailAlert instead
  
  // Access Control
  accessLevel: int("accessLevel").default(0), // Permission level required (0=all, 1+=restricted)
  
  // CUI (Controlled Unclassified Information) classification
  // Per NIST 800-171 - marks question as requesting CUI data
  isCUI: boolean("isCUI").default(false).notNull(),
  
  // Archive pattern
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

/**
 * Response options for questions
 * Legacy: `response` table
 */
export const responses = mysqlTable("responses", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("questionId"), // Foreign key to questions table (NULL for global responses)
  
  description: text("description").notNull(), // Response option text
  responseText: text("responseText"), // Alias for description (for compatibility)
  responseCode: varchar("responseCode", { length: 10 }), // Code for this response (e.g., "Y", "N", "NA")
  zcode: varchar("zcode", { length: 2 }), // Z-Code encoding for reporting (Y/N/NA/etc.)
  
  enterpriseId: int("enterpriseId"),
  
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Response = typeof responses.$inferSelect;
export type InsertResponse = typeof responses.$inferInsert;

/**
 * Partner-Questionnaire Assignment (PPTQ)
 * Legacy: `partnerPartnertypeTouchpointQuestionnaire` table
 * This is the core transaction table tracking supplier responses
 */
export const partnerQuestionnaires = mysqlTable("partnerQuestionnaires", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  touchpointQuestionnaireId: int("touchpointQuestionnaireId").notNull(), // Links to partnerTypeTouchpointQuestionnaire
  
  // Access & invitation
  accessCode: varchar("accessCode", { length: 12 }).notNull().unique(), // 12-char cryptographic code (A-HJ-NP-Z2-9)
  invitedBy: int("invitedBy").notNull(), // User who sent invitation
  invitedDate: date("invitedDate").notNull(),
  dueDate: date("dueDate"),
  completedDate: date("completedDate"),
  
  // Status tracking
  status: int("status").notNull(), // Invited, in progress, completed, etc.
  progress: int("progress"), // Percentage complete
  score: int("score"), // Calculated compliance score
  priority: int("priority"),
  
  // Response data
  zcode: varchar("zcode", { length: 500 }), // Encoded responses for reporting
  eSignature: text("eSignature"), // Base64 encoded signature image
  pdfUrl: text("pdfUrl"), // S3 URL to generated PDF
  docFolderAddress: varchar("docFolderAddress", { length: 500 }),
  
  // Approval workflow (INT.DOC.40 Section 4.1 - Preventive Controls)
  reviewerId: int("reviewerId"), // User who reviewed/approved the submission
  reviewedAt: timestamp("reviewedAt"), // When review was completed
  approvalNotes: text("approvalNotes"), // Reviewer comments (required for rejection)
  reviewStatus: mysqlEnum("reviewStatus", ["pending", "approved", "rejected"]), // Approval status
  
  // CUI (Controlled Unclassified Information) classification
  // Per NIST 800-171 - marks assignment as containing CUI data (inherited from touchpoint/questions)
  isCUI: boolean("isCUI").default(false).notNull(),
  
  // Grouping for bulk operations
  loadGroup: varchar("loadGroup", { length: 8 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PartnerQuestionnaire = typeof partnerQuestionnaires.$inferSelect;
export type InsertPartnerQuestionnaire = typeof partnerQuestionnaires.$inferInsert;

/**
 * Questionnaire responses - actual answers from partners
 * Legacy: `partnerPartnertypeTouchpointQuestionnaireQuestionResponse` table
 */
export const questionnaireResponses = mysqlTable("questionnaireResponses", {
  id: int("id").autoincrement().primaryKey(),
  partnerQuestionnaireId: int("partnerQuestionnaireId").notNull(),
  questionId: int("questionId").notNull(),
  responseId: int("responseId"), // Selected response option
  
  // Free-form data
  comment: text("comment"),
  value: int("value"), // Numeric value for calculations
  score: int("score"), // Question-level score
  
  // File uploads
  uploadedFileUrl: text("uploadedFileUrl"), // S3 URL
  uploadedFileType: varchar("uploadedFileType", { length: 500 }),
  
  actionDate: timestamp("actionDate"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;
export type InsertQuestionnaireResponse = typeof questionnaireResponses.$inferInsert;

// ============================================================================
// GROUP & ORGANIZATION TABLES
// ============================================================================

/**
 * Groups - organizational units (sites, divisions, projects)
 * Legacy: `group` table
 */
export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  enterpriseId: int("enterpriseId"),
  groupCollectionId: int("groupCollectionId").notNull(), // Parent collection
  groupType: int("groupType"),
  
  name: varchar("name", { length: 50 }),
  description: varchar("description", { length: 100 }),
  email: varchar("email", { length: 50 }),
  
  // Ownership
  authorId: int("authorId"),
  stateId: int("stateId"), // Geographic state
  
  // Archive pattern
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder"),
  
  dateCreated: timestamp("dateCreated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

/**
 * User-Group mapping
 * Legacy: `personGroup` table
 */
export const userGroups = mysqlTable("userGroups", {
  userId: int("userId").notNull(),
  groupId: int("groupId").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Group Collections - hierarchical organization of groups
 * Example: "North America Sites", "APAC Sites", "Europe Sites"
 */
export const groupCollections = mysqlTable("groupCollections", {
  id: int("id").autoincrement().primaryKey(),
  enterpriseId: int("enterpriseId"),
  
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  
  // Hierarchy support
  parentId: int("parentId"), // For nested collections
  
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GroupCollection = typeof groupCollections.$inferSelect;
export type InsertGroupCollection = typeof groupCollections.$inferInsert;

/**
 * Partner-Group mapping
 * Assigns partners to specific sites/locations
 */
export const partnerGroups = mysqlTable("partnerGroups", {
  partnerId: int("partnerId").notNull(),
  groupId: int("groupId").notNull(),
  
  // Assignment metadata
  assignedBy: int("assignedBy"), // User who made the assignment
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

/**
 * Touchpoint-Questionnaire Assignment
 * Defines which questionnaires are used for which partner types in which touchpoint
 * Referenced by partnerQuestionnaires.touchpointQuestionnaireId
 */
export const touchpointQuestionnaires = mysqlTable("touchpointQuestionnaires", {
  id: int("id").autoincrement().primaryKey(),
  
  touchpointId: int("touchpointId").notNull(),
  questionnaireId: int("questionnaireId").notNull(),
  partnerTypeId: int("partnerTypeId").notNull(),
  groupId: int("groupId"), // Optional: specific to a group/site
  
  // Campaign configuration
  dueDate: date("dueDate"),
  autoReminder: boolean("autoReminder").default(true),
  reminderDays: int("reminderDays"), // Days before due date to send reminder
  
  // Status
  active: boolean("active").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
});

export type TouchpointQuestionnaire = typeof touchpointQuestionnaires.$inferSelect;
export type InsertTouchpointQuestionnaire = typeof touchpointQuestionnaires.$inferInsert;

// ============================================================================
// EMAIL AUTOMATION TABLES
// ============================================================================

/**
 * Email templates for automated reminders
 * Legacy: `autoMailMessage` table
 */
export const emailTemplates = mysqlTable("emailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  
  subject: text("subject"),
  text: text("text"), // Email body
  footer1: text("footer1"),
  footer2: text("footer2"),
  
  // Scheduling
  sendDateCalcFactor: int("sendDateCalcFactor").notNull(), // Days offset from invitation
  sendDateSet: date("sendDateSet"), // Fixed send date
  mailType: int("mailType").notNull(), // Invitation, reminder, completion, etc.
  
  // Association
  touchpointQuestionnaireId: int("touchpointQuestionnaireId").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

/**
 * Email send log
 * Legacy: `eventNotification` table
 */
export const emailLogs = mysqlTable("emailLogs", {
  id: int("id").autoincrement().primaryKey(),
  messageId: varchar("messageId", { length: 255 }), // SendGrid message ID
  email: varchar("email", { length: 255 }),
  timestamp: timestamp("timestamp"),
  event: varchar("event", { length: 50 }).notNull(), // sent, delivered, bounced, opened, clicked
  status: varchar("status", { length: 50 }), // delivered, bounced, pending
  reason: text("reason"), // Bounce reason, error message
  bounceReason: text("bounceReason"), // Detailed bounce reason from SendGrid
  bounceClassification: varchar("bounceClassification", { length: 100 }), // hard/soft bounce
  url: varchar("url", { length: 500 }),
  category: varchar("category", { length: 500 }),
  accessCode: varchar("accessCode", { length: 50 }),
  
  // Tracking timestamps
  deliveredAt: timestamp("deliveredAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  
  enterpriseId: int("enterpriseId"),
  loadGroup: varchar("loadGroup", { length: 50 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

// ============================================================================
// PARTNER AUTHENTICATION (ACCESS CODE + EMAIL VERIFICATION)
// ============================================================================

/**
 * Partner Access Codes
 * Generated unique codes for partners to access their questionnaires
 * Partners do NOT get Manus OAuth login - they use access codes instead
 */
export const partnerAccessCodes = mysqlTable("partnerAccessCodes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(), // Unique access code
  
  // Links to partner and specific touchpoint
  partnerId: int("partnerId").notNull(),
  touchpointId: int("touchpointId"), // Optional: specific campaign
  
  // Expiration and usage tracking
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  used: boolean("used").default(false).notNull(),
  
  // Audit trail
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"), // User who generated the code
});

export type PartnerAccessCode = typeof partnerAccessCodes.$inferSelect;
export type InsertPartnerAccessCode = typeof partnerAccessCodes.$inferInsert;

/**
 * Email Verification Codes
 * Two-factor authentication for partners: access code + email verification
 */
export const emailVerificationCodes = mysqlTable("emailVerificationCodes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull(), // 6-digit verification code
  
  // Links to partner email and access code
  email: varchar("email", { length: 320 }).notNull(),
  accessCodeId: int("accessCodeId").notNull(), // FK to partnerAccessCodes
  
  // Verification status
  verified: boolean("verified").default(false).notNull(),
  verifiedAt: timestamp("verifiedAt"),
  
  // Expiration (short-lived, e.g., 15 minutes)
  expiresAt: timestamp("expiresAt").notNull(),
  
  // Audit trail
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }), // Track verification attempts
});

export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type InsertEmailVerificationCode = typeof emailVerificationCodes.$inferInsert;

/**
 * Partner Sessions
 * Track active partner sessions (separate from Manus OAuth sessions)
 */
export const partnerSessions = mysqlTable("partnerSessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),
  
  // Links to partner and access code
  partnerId: int("partnerId").notNull(),
  accessCodeId: int("accessCodeId").notNull(),
  
  // Session management
  expiresAt: timestamp("expiresAt").notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  
  // Audit trail
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
});

export type PartnerSession = typeof partnerSessions.$inferSelect;
export type InsertPartnerSession = typeof partnerSessions.$inferInsert;

// ============================================================================
// CMS (CONTENT MANAGEMENT SYSTEM)
// ============================================================================

/**
 * CMS Content - Multi-language content for supplier portal
 * Stores all text, labels, and messaging displayed in the questionnaire workflow
 * Each key can have multiple language versions
 */
export const cmsContent = mysqlTable("cmsContent", {
  id: int("id").autoincrement().primaryKey(),
  
  // Content identification
  key: varchar("key", { length: 100 }).notNull(), // e.g., 'SAVE_EXIT_DIALOG_TITLE'
  languageCode: varchar("languageCode", { length: 10 }).notNull().default('en'), // ISO 639-1 code
  
  // Content
  text: text("text").notNull(), // The actual content
  description: text("description"), // Admin notes about this content
  
  // Categorization
  page: varchar("page", { length: 50 }), // access_code, questionnaire, confirmation, etc.
  category: varchar("category", { length: 50 }), // button, label, message, instruction, etc.
  
  // Multi-tenant scoping
  enterpriseId: int("enterpriseId"), // NULL = global default, otherwise enterprise-specific
  
  // Version control
  version: int("version").default(1).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
});

export type CMSContent = typeof cmsContent.$inferSelect;
export type InsertCMSContent = typeof cmsContent.$inferInsert;

// ============================================================================
// LOOKUP TABLES
// ============================================================================

/**
 * Countries
 */
export const countries = mysqlTable("countries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 50 }),
  
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder"),
});

/**
 * US States
 */
export const states = mysqlTable("states", {
  id: int("id").autoincrement().primaryKey(),
  stateCode: varchar("stateCode", { length: 10 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder"),
});

/**
 * Documents - file uploads from partners (certifications, compliance docs)
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  partnerQuestionnaireId: int("partnerQuestionnaireId").notNull(),
  questionId: int("questionId"), // Optional: link to specific question
  
  // File metadata
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(), // S3 URL
  fileType: varchar("fileType", { length: 100 }), // MIME type
  fileSize: int("fileSize"), // Bytes
  
  // Classification
  documentType: varchar("documentType", { length: 100 }), // Certification, License, etc.
  description: text("description"),
  
  // Metadata
  uploadedBy: int("uploadedBy"), // User ID
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  
  // Archive pattern
  active: boolean("active").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Audit Log - comprehensive event tracking for compliance
 * Based on INT.DOC.11 Section 2.4
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Event identification
  action: varchar("action", { length: 100 }).notNull(), // QUESTIONNAIRE_SUBMITTED, ASSIGNMENT_DELEGATED, etc.
  entityType: varchar("entityType", { length: 50 }).notNull(), // assignment, touchpoint, partner, etc.
  entityId: int("entityId").notNull(), // ID of the affected entity
  
  // Actor information
  actorType: varchar("actorType", { length: 50 }), // user, supplier, system
  actorId: int("actorId"), // User ID or Partner ID
  
  // Event metadata (JSON)
  metadata: text("metadata"), // JSON string with event-specific data
  
  // Multi-tenant scoping
  enterpriseId: int("enterpriseId"),
  
  // Security tracking (INT.DOC.25)
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
  userAgent: text("userAgent"), // Browser/client identification
  isCUIAccess: boolean("isCUIAccess").default(false), // CUI data access flag
  
  // Timestamp
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Approval Permissions - granular RBAC for questionnaire review/approval
 * Based on INT.DOC.40 Section 4.1 (Preventive Controls - Approval workflows)
 * Based on INT.DOC.19 Section 5.2 (Response Actions - Flag for Review)
 * 
 * PERMISSION MODEL:
 * - Level 1: Role-based (only 'editor' or 'admin' roles can approve)
 * - Level 2: Granular scope (restrict to specific groups/protocols/touchpoints)
 * 
 * If no records exist for a user → enterprise-wide approval rights
 * If records exist → can ONLY approve those specific scopes
 */
export const approvalPermissions = mysqlTable("approvalPermissions", {
  id: int("id").autoincrement().primaryKey(),
  
  // User who has approval permission
  userId: int("userId").notNull(),
  
  // Multi-tenant scoping
  enterpriseId: int("enterpriseId").notNull(),
  
  // Granular scope (all nullable - if all NULL = enterprise-wide)
  groupId: int("groupId"), // Can approve submissions from this group
  protocolId: int("protocolId"), // Can approve submissions for this protocol
  touchpointId: int("touchpointId"), // Can approve submissions for this touchpoint
  
  // Metadata
  grantedBy: int("grantedBy"), // User who granted this permission
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
  
  // Archive pattern
  active: boolean("active").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApprovalPermission = typeof approvalPermissions.$inferSelect;
export type InsertApprovalPermission = typeof approvalPermissions.$inferInsert;

// Export all table types for use in queries
export type Tables = {
  users: typeof users;
  enterprises: typeof enterprises;
  roles: typeof roles;
  userRoles: typeof userRoles;
  partners: typeof partners;
  partnerTypes: typeof partnerTypes;
  partnerStatuses: typeof partnerStatuses;
  protocols: typeof protocols;
  touchpoints: typeof touchpoints;
  questionnaires: typeof questionnaires;
  questions: typeof questions;
  responses: typeof responses;
  partnerQuestionnaires: typeof partnerQuestionnaires;
  questionnaireResponses: typeof questionnaireResponses;
  groups: typeof groups;
  userGroups: typeof userGroups;
  groupCollections: typeof groupCollections;
  partnerGroups: typeof partnerGroups;
  touchpointQuestionnaires: typeof touchpointQuestionnaires;
  emailTemplates: typeof emailTemplates;
  emailLogs: typeof emailLogs;
  partnerAccessCodes: typeof partnerAccessCodes;
  emailVerificationCodes: typeof emailVerificationCodes;
  partnerSessions: typeof partnerSessions;
  cmsContent: typeof cmsContent;
  countries: typeof countries;
  states: typeof states;
  documents: typeof documents;
  auditLogs: typeof auditLogs;
  approvalPermissions: typeof approvalPermissions;
};
