import {
  int,
  mysqlTable,
  varchar,
  text,
  timestamp,
  boolean,
  date,
  decimal,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

/**
 * Intelleges Federal Compliance Management System (FCMS)
 * Database Schema - MySQL/TiDB Implementation
 * 
 * Converted from SQL Server to MySQL using Drizzle ORM
 * Compatible with Manus platform stack
 */

// ============================================================================
// ENTERPRISE MANAGEMENT DOMAIN
// ============================================================================

/**
 * Enterprise Entity
 * Represents client organizations using the Intelleges FCMS platform.
 * Each enterprise operates as an isolated tenant with complete data segregation.
 */
export const enterprises = mysqlTable("enterprises", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 100 }), // Email domain for SSO
  industrySector: varchar("industry_sector", { length: 100 }),
  licenseTier: mysqlEnum("license_tier", ["trial", "professional", "enterprise"]).default("professional"),
  applicationBrandingUrl: varchar("application_branding_url", { length: 500 }),
  defaultLanguage: varchar("default_language", { length: 10 }).default("en"),
  defaultTimezone: varchar("default_timezone", { length: 50 }).default("America/New_York"),
  dateFormat: varchar("date_format", { length: 20 }).default("MM/DD/YYYY"),
  sendgridApiKey: varchar("sendgrid_api_key", { length: 500 }), // Encrypted
  contractExpiration: date("contract_expiration"),
  maxPartners: int("max_partners").default(1000),
  maxTouchpoints: int("max_touchpoints").default(100),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Enterprise = typeof enterprises.$inferSelect;
export type InsertEnterprise = typeof enterprises.$inferInsert;

/**
 * Person Entity
 * Represents authenticated users including Intelleges admins, enterprise users, and supplier contacts.
 * Uses Manus OAuth for authentication (openId field).
 */
export const persons = mysqlTable("persons", {
  id: int("id").autoincrement().primaryKey(),
  enterpriseId: int("enterprise_id"), // Nullable for Intelleges admins
  openId: varchar("open_id", { length: 64 }).notNull().unique(), // Manus OAuth identifier
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("password_hash", { length: 255 }), // For non-OAuth auth
  ssoToken: varchar("sso_token", { length: 500 }), // OAuth/SAML token
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  jobTitle: varchar("job_title", { length: 100 }),
  department: varchar("department", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  role: mysqlEnum("role", ["super_admin", "enterprise_admin", "group_manager", "compliance_officer", "viewer"]).default("viewer").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Person = typeof persons.$inferSelect;
export type InsertPerson = typeof persons.$inferInsert;

// ============================================================================
// PROTOCOL & TOUCHPOINT MANAGEMENT DOMAIN
// ============================================================================

/**
 * Protocol Entity
 * Represents compliance frameworks or regulatory standards (e.g., FAR, DFARS, ITAR).
 * Protocols define the overall purpose and regulatory framework for supplier compliance.
 */
export const protocols = mysqlTable("protocols", {
  id: int("id").autoincrement().primaryKey(),
  enterpriseId: int("enterprise_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }), // Short code (e.g., "FAR52")
  description: text("description"),
  complianceFramework: varchar("compliance_framework", { length: 100 }), // FAR, DFARS, ITAR
  isRecurring: boolean("is_recurring").default(false).notNull(), // Annual touchpoint creation
  defaultTemplateId: int("default_template_id"), // FK to AutoMail Template
  brandingLogoUrl: varchar("branding_logo_url", { length: 500 }),
  regulatoryReferences: text("regulatory_references"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Protocol = typeof protocols.$inferSelect;
export type InsertProtocol = typeof protocols.$inferInsert;

/**
 * Touchpoint Entity
 * Represents a specific instance of a protocol for a defined time period.
 * Each touchpoint has defined start/end dates, partner count targets, and completion deadlines.
 */
export const touchpoints = mysqlTable("touchpoints", {
  id: int("id").autoincrement().primaryKey(),
  enterpriseId: int("enterprise_id").notNull(),
  protocolId: int("protocol_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Annual Reps & Certs 2025"
  year: int("year").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  deadline: date("deadline").notNull(), // Supplier submission deadline
  status: mysqlEnum("status", ["draft", "active", "closed", "archived"]).default("draft").notNull(),
  partnerCountTarget: int("partner_count_target").default(0),
  completionTargetPercent: decimal("completion_target_percent", { precision: 5, scale: 2 }).default("95.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Touchpoint = typeof touchpoints.$inferSelect;
export type InsertTouchpoint = typeof touchpoints.$inferInsert;

/**
 * PartnerType Entity
 * Categorizes partners within a touchpoint (e.g., Supplier, Investor, Validator).
 * Partner types enable differentiated questionnaires and communication templates.
 */
export const partnerTypes = mysqlTable("partner_types", {
  id: int("id").autoincrement().primaryKey(),
  touchpointId: int("touchpoint_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Supplier"
  code: varchar("code", { length: 10 }).notNull(), // Short code (S, I, V) for access codes
  questionnaireId: int("questionnaire_id"), // FK to Questionnaire
  description: text("description"),
  sortOrder: int("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PartnerType = typeof partnerTypes.$inferSelect;
export type InsertPartnerType = typeof partnerTypes.$inferInsert;

// ============================================================================
// CONVERSION NOTES
// ============================================================================

/**
 * SQL Server → MySQL/TiDB Conversion Summary:
 * 
 * 1. Data Types:
 *    - NVARCHAR(MAX) → TEXT
 *    - NVARCHAR(n) → VARCHAR(n)
 *    - INT IDENTITY(1,1) → INT AUTO_INCREMENT
 *    - BIT → BOOLEAN
 *    - DATETIME2 → TIMESTAMP
 *    - DECIMAL(p,s) → DECIMAL(p,s) (same)
 * 
 * 2. Constraints:
 *    - PRIMARY KEY → .primaryKey()
 *    - NOT NULL → .notNull()
 *    - DEFAULT → .default()
 *    - UNIQUE → .unique()
 *    - FOREIGN KEY → Handled by Drizzle relations (separate file)
 * 
 * 3. Naming Conventions:
 *    - SQL Server uses [dbo].[TableName] schema prefix → Removed
 *    - Column names converted from PascalCase → snake_case for MySQL
 *    - Enum values converted to lowercase with underscores
 * 
 * 4. Indexes:
 *    - CREATE INDEX statements → Drizzle .index() (to be added)
 *    - Composite indexes → .index() with multiple columns
 * 
 * 5. Relationships:
 *    - Foreign key constraints → Defined in separate relations file
 *    - Cascade rules → Configured in Drizzle relations
 * 
 * Next Steps:
 * - Add remaining tables (Group, Partner, PartnerContact, PartnerAssignment)
 * - Add Questionnaire Engine tables (Questionnaire, Question)
 * - Add Response Collection tables (Response, ResponseComment, ResponseUpload, ResponseDate)
 * - Add Communication tables (AutoMailTemplate, CMSElement)
 * - Add Compliance Reporting tables (ComplianceScore, ComplianceHistory)
 * - Create relations file for foreign key definitions
 * - Add indexes for performance optimization
 * - Run `pnpm db:push` to apply schema to database
 */
