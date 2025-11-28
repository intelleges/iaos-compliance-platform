# INT.DOC Document Update Analysis

**Date**: November 27, 2025  
**Current Implementation**: compliance-platform (checkpoint c8b62ad1)  
**Reviewer**: Manus AI Agent

---

## Executive Summary

This analysis identifies which INT.DOC documents require updates based on the compliance gaps discovered during the INT.DOC.01 (Global Standards) review and the NDA template (INT.DOC.36) review. The analysis prioritizes documents by impact level and provides specific update requirements for each.

---

## Documents Uploaded & Reviewed

### ✅ INT.DOC.01 - Global Standards & Conventions
**Status**: Fully reviewed (19 pages, 14 sections)  
**Compliance**: 78% overall  
**Critical Gaps**: Multi-tenant isolation, supplier portal, RBAC, PII encryption  
**Action**: Compliance analysis document created at `/INT.DOC.01-COMPLIANCE-ANALYSIS.md`

### ✅ INT.DOC.36 - NDA Template
**Status**: Fully reviewed (12 pages, 8 sections + exhibits)  
**Purpose**: Legal template for employees, contractors, and free trial users  
**Platform Integration**: Not yet integrated into compliance platform  
**Action**: Requires implementation in platform (see recommendations below)

---

## Documents Requiring Updates (Priority Order)

### 🔴 CRITICAL PRIORITY - Security & Compliance

#### 1. INT.DOC.20 - RBAC Security
**Current Status**: Referenced but not implemented  
**Gap**: Only 2 of 7 roles implemented (admin, user)  
**Required Updates**:
- Document the 7-role hierarchy: Super Admin, Admin, Manager, Editor, Viewer, Supplier Contact, User
- Define permissions matrix for each role
- Document role assignment workflows
- Define role-based procedure middleware (adminProcedure, managerProcedure, etc.)
- Document cross-tenant access rules for Super Admin

**Impact**: **CRITICAL** - Security risk from insufficient access control

---

#### 2. INT.DOC.25 - Security Policy
**Current Status**: Partially implemented (CUI logging, audit trails)  
**Gap**: Supplier portal access code system NOT implemented  
**Required Updates**:
- Document 12-character cryptographic access code generation algorithm
- Define access code character set (A-HJ-NP-Z2-9, excluding 0/O/1/I/L)
- Document access code lifecycle (generation, validation, single-use invalidation)
- Define session management (8-hour duration, 1-hour idle timeout)
- Document access code audit logging requirements
- Update PII encryption section with per-enterprise key derivation

**Impact**: **CRITICAL** - Supplier portal cannot function without access codes

---

#### 3. INT.DOC.26 - Data Privacy & Compliance
**Current Status**: Referenced but not fully implemented  
**Gap**: Application-level PII encryption NOT implemented  
**Required Updates**:
- Document per-enterprise encryption key derivation strategy
- Define PII field encryption/decryption workflows
- Document key rotation procedures
- Define encrypted field storage format
- Update data retention policies (90-day auth logs, 30-day system logs, 10-year compliance logs)
- Document GDPR/CCPA compliance measures (if applicable)

**Impact**: **CRITICAL** - Compliance risk for PII handling

---

### 🟡 HIGH PRIORITY - Functionality & Architecture

#### 4. INT.DOC.02 - ERD Logical Model
**Current Status**: Adapted from original  
**Gap**: Multi-tenant isolation NOT enforced at ORM level  
**Required Updates**:
- Add automatic enterpriseId scope enforcement pattern
- Document tenant isolation strategy at database layer
- Update ERD to show enterpriseId foreign keys on all tenant-scoped tables
- Document cross-tenant access patterns for Super Admin
- Add isCUI flags to touchpoints, questions, partnerQuestionnaires tables
- Document audit log schema with CUI access tracking

**Impact**: **HIGH** - Security risk from potential cross-tenant data leakage

---

#### 5. INT.DOC.03 - ERD Physical Model
**Current Status**: Adapted from original  
**Gap**: Missing indexes for performance optimization  
**Required Updates**:
- Add index specifications:
  * idx_[table]_enterprise on all tenant-scoped tables
  * idx_assignments_accessCode for access code lookups
  * idx_touchpoints_status for status filtering
  * idx_responses_assignment_question for response queries
  * idx_auditLogs_created for time-based audit queries
- Document index naming conventions
- Add database performance optimization guidelines

**Impact**: **HIGH** - Performance degradation without proper indexes

---

#### 6. INT.DOC.04 - Data Dictionary
**Current Status**: Adapted from original  
**Gap**: Missing new fields and enums  
**Required Updates**:
- Add isCUI field definition (boolean, CUI classification flag)
- Add role enum values (super_admin, admin, manager, editor, viewer, supplier_contact, user)
- Add action type enum values for audit logging (TOUCHPOINT_ACCESSED, QUESTIONNAIRE_ACCESSED, QUESTION_ACCESSED, CUI_DATA_MODIFIED)
- Add entity type enum values (touchpoint, questionnaire, question, partner, assignment, response)
- Document access code field specifications (12-character, cryptographically random)

**Impact**: **HIGH** - Developer confusion without updated data dictionary

---

#### 7. INT.DOC.05 - API Documentation
**Current Status**: Adapted from original  
**Gap**: Missing routers and procedures  
**Required Updates**:
- Add touchpoint router documentation (touchpoint.get with CUI logging)
- Add audit router documentation (audit.getLogs, audit.exportLogs)
- Document missing routers: enterprises, assignments, responses, reports, automail
- Add supplierProcedure middleware documentation
- Add superAdminProcedure middleware documentation
- Document CUI access logging middleware
- Add error code dictionary (INT-[CATEGORY]-[SEQUENCE] format)

**Impact**: **HIGH** - API consumers cannot integrate without documentation

---

#### 8. INT.DOC.10 - Error Code Dictionary
**Current Status**: Referenced but NOT implemented  
**Gap**: Error codes do NOT follow INT-[CATEGORY]-[SEQUENCE] format  
**Required Updates**:
- Define error code categories (AUTH, RESP, ASSIGN, PARTNER, ADMIN, SYSTEM)
- Document error codes for each category:
  * INT-AUTH-001: Invalid session token
  * INT-AUTH-002: Insufficient permissions
  * INT-RESP-003: Invalid access code
  * INT-ASSIGN-004: Assignment not found
  * (etc.)
- Document error response structure
- Define error logging levels (INFO for 4xx, ERROR for 5xx)

**Impact**: **HIGH** - Inconsistent error handling without standardized codes

---

### 🟢 MEDIUM PRIORITY - Documentation & Operations

#### 9. INT.DOC.12 - Business Rules
**Current Status**: Adapted from original  
**Gap**: Missing CUI handling rules  
**Required Updates**:
- Document CUI classification rules (when to mark touchpoint/question as isCUI=true)
- Define CUI access logging triggers
- Document CUI export banner requirements
- Add US persons access restriction rules (if contract requires)
- Document questionnaire submission transaction rules
- Document partner delegation transaction rules

**Impact**: **MEDIUM** - Business logic inconsistencies without documented rules

---

#### 10. INT.DOC.13 - Compliance Flow Manual
**Current Status**: Not yet implemented  
**Gap**: End-to-end compliance workflow not documented  
**Required Updates**:
- Document touchpoint creation → questionnaire design → partner assignment → submission → audit workflow
- Add CUI classification workflow
- Document approval workflow (if INT.DOC.40 Section 4.1 implemented)
- Add audit log viewer usage instructions
- Document compliance reporting workflows

**Impact**: **MEDIUM** - User confusion without workflow documentation

---

#### 11. INT.DOC.28 - Audit Procedures
**Current Status**: Partially implemented (Audit Log Viewer Dashboard)  
**Gap**: Missing audit procedures documentation  
**Required Updates**:
- Document audit log viewer dashboard usage
- Add filtering instructions (date range, action type, entity type, CUI access, IP address)
- Document export procedures (CSV/JSON formats)
- Add audit log retention policies (10 years for compliance data)
- Document audit log review procedures for security monitoring

**Impact**: **MEDIUM** - Audit compliance risk without documented procedures

---

#### 12. INT.DOC.17 - Supplier User Guide
**Current Status**: Not yet implemented  
**Gap**: Supplier portal not documented  
**Required Updates**:
- Document access code entry workflow
- Add questionnaire completion instructions
- Document e-signature capture process
- Add delegation workflow instructions
- Document CUI access disclaimers

**Impact**: **MEDIUM** - Supplier confusion without user guide (once supplier portal implemented)

---

#### 13. INT.DOC.18 - Enterprise User Guide
**Current Status**: Not yet implemented  
**Gap**: Enterprise user workflows not documented  
**Required Updates**:
- Document SSO login process
- Add touchpoint creation instructions
- Document questionnaire design workflow
- Add partner management instructions
- Document assignment creation and tracking
- Add audit log viewer usage instructions

**Impact**: **MEDIUM** - User adoption risk without user guide

---

#### 14. INT.DOC.19 - Admin Dashboard Guide
**Current Status**: Not yet implemented  
**Gap**: Admin dashboard not documented  
**Required Updates**:
- Document admin dashboard layout and navigation
- Add user management instructions
- Document enterprise settings configuration
- Add role assignment procedures
- Document audit log monitoring procedures

**Impact**: **MEDIUM** - Admin confusion without dashboard guide

---

### 🟢 LOW PRIORITY - Testing & Quality

#### 15. INT.DOC.21 - Testing Strategy
**Current Status**: Not yet implemented  
**Gap**: E2E tests NOT implemented  
**Required Updates**:
- Document unit testing strategy (Vitest, 80% coverage minimum)
- Add integration testing guidelines (tRPC endpoint testing)
- Document E2E testing approach (Playwright for critical user journeys)
- Define test data management strategy
- Document CI/CD testing pipeline

**Impact**: **LOW** - Quality risk without documented testing strategy

---

#### 16. INT.DOC.22 - Unit Test Specifications
**Current Status**: Partially implemented (220 passing tests)  
**Gap**: Missing test specifications for new features  
**Required Updates**:
- Add CUI classification test specifications (15 tests implemented)
- Add audit router test specifications (28 tests implemented)
- Document test coverage requirements (80% minimum)
- Add test naming conventions
- Document mock data creation patterns

**Impact**: **LOW** - Test maintenance risk without specifications

---

#### 17. INT.DOC.23 - Integration Test Specifications
**Current Status**: Partially implemented  
**Gap**: Not all routers tested  
**Required Updates**:
- Add touchpoint router integration tests
- Add audit router integration tests
- Document missing router test specifications (enterprises, assignments, responses, reports, automail)
- Add supplier portal integration tests (once implemented)
- Document test data setup/teardown procedures

**Impact**: **LOW** - Integration risk without comprehensive tests

---

#### 18. INT.DOC.24 - E2E Test Specifications
**Current Status**: NOT implemented  
**Gap**: No E2E tests exist  
**Required Updates**:
- Define critical user journeys:
  * Admin: Create touchpoint → Design questionnaire → Assign to partner → Monitor submission
  * Supplier: Enter access code → Complete questionnaire → E-signature → Submit
  * Admin: View audit logs → Filter by CUI access → Export report
- Document Playwright test setup
- Add test environment configuration
- Define test data seeding strategy

**Impact**: **LOW** - User experience risk without E2E validation

---

### 🟢 LOW PRIORITY - Additional Documentation

#### 19. INT.DOC.08 - Frontend Components
**Current Status**: Not yet implemented  
**Gap**: Component library not documented  
**Required Updates**:
- Document shadcn/ui component usage
- Add custom component specifications (CUIBadge, CUIWarningBanner, DashboardLayout, AIChatBox)
- Document component props and variants
- Add component usage examples
- Document theme customization (light/dark mode)

**Impact**: **LOW** - Developer productivity risk without component docs

---

#### 20. INT.DOC.09 - Data Flow Diagrams
**Current Status**: Not yet implemented  
**Gap**: System architecture not visualized  
**Required Updates**:
- Create data flow diagrams for:
  * Touchpoint creation → Questionnaire design → Partner assignment → Submission
  * Access code generation → Supplier authentication → Questionnaire access
  * CUI data access → Audit logging → Audit log viewer
  * SSO authentication → Session management → Authorization
- Document tRPC request/response flow
- Add database query flow diagrams

**Impact**: **LOW** - Onboarding risk without visual documentation

---

#### 21. INT.DOC.14 - Partner Management Manual
**Current Status**: Not yet implemented  
**Gap**: Partner management workflows not documented  
**Required Updates**:
- Document partner creation workflow
- Add partner invitation process
- Document delegation workflow
- Add partner status tracking
- Document partner compliance history

**Impact**: **LOW** - User confusion without partner management docs

---

#### 22. INT.DOC.15 - Admin Operations Manual
**Current Status**: Not yet implemented  
**Gap**: Admin operations not documented  
**Required Updates**:
- Document user provisioning procedures
- Add role assignment workflows
- Document enterprise settings configuration
- Add audit log monitoring procedures
- Document data export procedures

**Impact**: **LOW** - Admin efficiency risk without operations manual

---

#### 23. INT.DOC.16 - Reporting Manual
**Current Status**: Not yet implemented  
**Gap**: Reporting features not documented  
**Required Updates**:
- Document audit log export procedures (CSV/JSON)
- Add compliance reporting workflows
- Document CUI access reports
- Add partner compliance status reports
- Document custom report creation

**Impact**: **LOW** - Reporting adoption risk without manual

---

#### 24. INT.DOC.27 - Disaster Recovery
**Current Status**: Not yet implemented  
**Gap**: DR procedures not documented  
**Required Updates**:
- Document database backup procedures
- Add recovery time objectives (RTO) and recovery point objectives (RPO)
- Document failover procedures
- Add data restoration workflows
- Document incident response procedures

**Impact**: **LOW** - Business continuity risk without DR plan

---

## INT.DOC.36 NDA Template - Platform Integration Requirements

The NDA template (INT.DOC.36) is a **legal document template** that requires integration into the compliance platform for the following use cases:

### Use Case 1: Free Trial User Onboarding
**Requirement**: Free trial users MUST sign NDA before accessing platform  
**Implementation Needed**:
- Add NDA acceptance workflow to free trial signup
- Store NDA signature records in database (ndaAgreements table)
- Add competitor certification checkboxes (Section 1.2)
- Implement electronic signature capture (DocuSign, HelloSign, or Adobe Sign integration)
- Add NDA status to user profile (signed/not signed, signature date)

### Use Case 2: Employee/Contractor Onboarding
**Requirement**: Employees and contractors MUST sign NDA before accessing confidential information  
**Implementation Needed**:
- Add NDA workflow to employee/contractor onboarding
- Store signed NDA records with relationship type (employee/contractor)
- Implement NDA expiration tracking (2 years for employees, 1 year for contractors)
- Add NDA renewal reminders

### Use Case 3: NDA Management Dashboard
**Requirement**: Admin dashboard to track NDA signatures and compliance  
**Implementation Needed**:
- Create NDA management page in admin dashboard
- Display NDA status for all users (signed/pending/expired)
- Add NDA export functionality (signed copies)
- Implement NDA violation tracking (if competitor certification changes)
- Add NDA renewal workflow

### Database Schema Updates Required

```typescript
// Add to drizzle/schema.ts
export const ndaAgreements = mysqlTable("ndaAgreements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  relationshipType: mysqlEnum("relationshipType", ["employee", "contractor", "free_trial", "other"]).notNull(),
  effectiveDate: timestamp("effectiveDate").notNull(),
  expirationDate: timestamp("expirationDate"), // 2 years for employees, 1 year for contractors/free trial
  competitorCertification: boolean("competitorCertification").default(false).notNull(), // Section 1.2
  freeTrialCertification: boolean("freeTrialCertification").default(false), // Section 1.3 (if free trial user)
  signatureMethod: varchar("signatureMethod", { length: 64 }), // DocuSign, HelloSign, Adobe Sign, etc.
  signatureId: varchar("signatureId", { length: 255 }), // External signature service ID
  signedDocumentUrl: text("signedDocumentUrl"), // S3 URL to signed PDF
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NDAgreement = typeof ndaAgreements.$inferSelect;
export type InsertNDAgreement = typeof ndaAgreements.$inferInsert;
```

### tRPC Router Required

```typescript
// server/routers/nda.ts
nda: router({
  // Get user's NDA status
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    // Return NDA status for current user
  }),
  
  // Sign NDA (create agreement record)
  sign: protectedProcedure
    .input(z.object({
      relationshipType: z.enum(["employee", "contractor", "free_trial", "other"]),
      competitorCertification: z.boolean(),
      freeTrialCertification: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create NDA agreement record
      // Trigger electronic signature workflow
      // Return signature URL or ID
    }),
  
  // Admin: List all NDA agreements
  listAll: adminProcedure
    .input(z.object({
      status: z.enum(["signed", "pending", "expired"]).optional(),
      page: z.number().default(1),
      pageSize: z.number().default(50),
    }))
    .query(async ({ input }) => {
      // Return paginated NDA agreements
    }),
  
  // Admin: Export signed NDA
  export: adminProcedure
    .input(z.object({ ndaId: z.number() }))
    .query(async ({ input }) => {
      // Return signed PDF URL from S3
    }),
}),
```

### Frontend Components Required

1. **NDASignatureModal** - Modal for NDA signature capture
2. **NDAStatusBadge** - Badge showing NDA status (signed/pending/expired)
3. **NDAManagementTable** - Admin table for NDA tracking
4. **CompetitorCertificationForm** - Form for Section 1.2 certification
5. **FreeTrialCertificationForm** - Form for Section 1.3 certification

---

## Document Update Priority Matrix

| Priority | Document | Impact | Effort | Timeline |
|----------|----------|--------|--------|----------|
| 🔴 CRITICAL | INT.DOC.20 (RBAC) | High | Medium | Sprint 1 |
| 🔴 CRITICAL | INT.DOC.25 (Security) | High | High | Sprint 1-2 |
| 🔴 CRITICAL | INT.DOC.26 (Privacy) | High | High | Sprint 2 |
| 🟡 HIGH | INT.DOC.02 (ERD Logical) | High | Medium | Sprint 2 |
| 🟡 HIGH | INT.DOC.03 (ERD Physical) | Medium | Low | Sprint 2 |
| 🟡 HIGH | INT.DOC.04 (Data Dictionary) | Medium | Low | Sprint 2 |
| 🟡 HIGH | INT.DOC.05 (API Docs) | High | High | Sprint 3 |
| 🟡 HIGH | INT.DOC.10 (Error Codes) | Medium | Medium | Sprint 3 |
| 🟢 MEDIUM | INT.DOC.12 (Business Rules) | Medium | Medium | Sprint 4 |
| 🟢 MEDIUM | INT.DOC.13 (Compliance Flow) | Medium | Medium | Sprint 4 |
| 🟢 MEDIUM | INT.DOC.28 (Audit Procedures) | Medium | Low | Sprint 4 |
| 🟢 MEDIUM | INT.DOC.17 (Supplier Guide) | Low | Medium | Sprint 5 |
| 🟢 MEDIUM | INT.DOC.18 (Enterprise Guide) | Low | Medium | Sprint 5 |
| 🟢 MEDIUM | INT.DOC.19 (Admin Guide) | Low | Medium | Sprint 5 |
| 🟢 LOW | INT.DOC.21-24 (Testing) | Medium | High | Sprint 6 |
| 🟢 LOW | INT.DOC.08-09 (Components/DFD) | Low | Medium | Sprint 7 |
| 🟢 LOW | INT.DOC.14-16 (Manuals) | Low | Low | Sprint 7 |
| 🟢 LOW | INT.DOC.27 (DR) | Medium | High | Sprint 8 |

---

## Recommended Action Plan

### Sprint 1 (Immediate - Next 2 Weeks)
1. Update **INT.DOC.20** (RBAC Security) - Define 7-role hierarchy and permissions matrix
2. Start **INT.DOC.25** (Security Policy) - Document access code system requirements
3. Implement automatic enterpriseId scope enforcement (update INT.DOC.02)

### Sprint 2 (Weeks 3-4)
1. Complete **INT.DOC.25** (Security Policy) - Access code system and PII encryption
2. Update **INT.DOC.26** (Data Privacy) - Per-enterprise encryption keys and retention policies
3. Update **INT.DOC.02-04** (ERD Logical, ERD Physical, Data Dictionary) - Add new fields and indexes

### Sprint 3 (Weeks 5-6)
1. Update **INT.DOC.05** (API Documentation) - Document all routers and procedures
2. Create **INT.DOC.10** (Error Code Dictionary) - Define INT-[CATEGORY]-[SEQUENCE] codes
3. Implement missing routers (enterprises, assignments, responses, reports, automail)

### Sprint 4 (Weeks 7-8)
1. Update **INT.DOC.12** (Business Rules) - CUI handling and transaction rules
2. Create **INT.DOC.13** (Compliance Flow Manual) - End-to-end workflow documentation
3. Update **INT.DOC.28** (Audit Procedures) - Audit log viewer usage and retention policies

### Sprint 5 (Weeks 9-10)
1. Create **INT.DOC.17** (Supplier User Guide) - Supplier portal documentation
2. Create **INT.DOC.18** (Enterprise User Guide) - Enterprise user workflows
3. Create **INT.DOC.19** (Admin Dashboard Guide) - Admin operations manual

### Sprint 6 (Weeks 11-12)
1. Update **INT.DOC.21-24** (Testing Strategy & Specs) - Comprehensive testing documentation
2. Implement E2E tests (Playwright)
3. Document test coverage and CI/CD pipeline

### Sprint 7 (Weeks 13-14)
1. Create **INT.DOC.08** (Frontend Components) - Component library documentation
2. Create **INT.DOC.09** (Data Flow Diagrams) - System architecture visualization
3. Create **INT.DOC.14-16** (Partner Management, Admin Operations, Reporting Manuals)

### Sprint 8 (Weeks 15-16)
1. Create **INT.DOC.27** (Disaster Recovery) - DR procedures and incident response
2. Final documentation review and updates
3. Compliance audit preparation

---

## INT.DOC.36 NDA Template Integration Timeline

### Sprint 3 (Weeks 5-6)
1. Design NDA database schema (ndaAgreements table)
2. Create NDA router (nda.getStatus, nda.sign, nda.listAll, nda.export)
3. Integrate electronic signature service (DocuSign/HelloSign/Adobe Sign)

### Sprint 4 (Weeks 7-8)
1. Build NDA signature modal component
2. Add NDA status badge to user profiles
3. Implement NDA management dashboard for admins

### Sprint 5 (Weeks 9-10)
1. Add NDA workflow to free trial signup
2. Add NDA workflow to employee/contractor onboarding
3. Implement NDA expiration tracking and renewal reminders

---

## Conclusion

**24 INT.DOC documents** require updates based on the compliance gaps identified. The updates are prioritized by impact level:

- **3 CRITICAL documents** (INT.DOC.20, 25, 26) - Security and compliance risks
- **6 HIGH documents** (INT.DOC.02-05, 10) - Functionality and architecture gaps
- **6 MEDIUM documents** (INT.DOC.12-13, 17-19, 28) - Documentation and operations
- **9 LOW documents** (INT.DOC.08-09, 14-16, 21-24, 27) - Testing, quality, and additional docs

**INT.DOC.36 NDA Template** requires platform integration with database schema, tRPC router, and frontend components.

The recommended 8-sprint action plan addresses critical security gaps first, followed by functionality completion, documentation updates, and quality improvements.

---

**Document Status**: ✅ Complete  
**Next Review**: After Sprint 1 completion  
**Owner**: Giorgio Palmisano  
**Reviewed By**: Manus AI Agent  
**Date**: November 27, 2025
