# Document 64 Analysis Report
## Enterprise Data Load Manual

**Document ID**: INT.DOC.64  
**Version**: 1.0  
**Pages**: 11  
**Analysis Date**: 2025-11-28

---

## Executive Summary

Document 64 specifies the **bulk data import system** for loading Partners, Users, Touchpoint Assignments, and Z-Codes via Excel spreadsheet templates. This complements the QMS (questionnaire) import system we just implemented and provides the complete data loading infrastructure for the platform.

---

## 1. Data Load Types Overview

The platform supports **4 batch data load types**:

| Load Type | Template | Description | Volume |
|-----------|----------|-------------|--------|
| **Partner Batch Load** | `Partner_Load_Template.xlsx` | Suppliers, vendors, subcontractors | 100-10,000+ |
| **User Batch Load** | `User_Load_Template.xlsx` | Enterprise users, contacts | 10-500 |
| **Touchpoint Assignment** | `Assignment_Template.xlsx` | Assign partners to touchpoints | 100-10,000+ |
| **Z-Code/ERP Feed** | `ZCode_Template.xlsx` | Socioeconomic classifications | As needed |

---

## 2. Partner Batch Load Specification

### 2.1 Template Structure (23 Columns)

#### **Section 1: Partner Identification (A-D)** - REQUIRED

| Col | Field Name | Type | Description | Example |
|-----|------------|------|-------------|---------|
| A | `PARTNER_INTERNAL_ID` | Text(50) | Internal partner ID | V1002, BP0000001 |
| B | `PARTNER_NAME` | Text(200) | Legal company name | Acme Manufacturing Inc. |
| C | `PARTNER_DUNS` | Text(9) | D-U-N-S Number | 123456789 |
| D | `PARTNER_SAP_ID` | Text(50) | SAP/ERP vendor number | V1002, 0001234567 |

#### **Section 2: Primary Contact (E-I)** - REQUIRED

| Col | Field Name | Type | Description | Example |
|-----|------------|------|-------------|---------|
| E | `PARTNER_POC_FIRST_NAME` | Text(50) | Contact first name | John |
| F | `PARTNER_POC_LAST_NAME` | Text(50) | Contact last name | Smith |
| G | `PARTNER_POC_TITLE` | Text(100) | Job title | Compliance Manager |
| H | `PARTNER_POC_PHONE_NUMBER` | Text(20) | Phone number | 555-123-4567 |
| I | `PARTNER_POC_EMAIL_ADDRESS` | Email | **Email (invitation sent here)** | john.smith@acme.com |

⚠️ **CRITICAL**: `PARTNER_POC_EMAIL_ADDRESS` is where questionnaire invitations are sent!

#### **Section 3: Address Information (J-Q)** - RECOMMENDED

| Col | Field Name | Type | Description | Example |
|-----|------------|------|-------------|---------|
| J | `PARTNER_ADDRESS_ONE` | Text(200) | Street address line 1 | 123 Industrial Way |
| K | `PARTNER_ADDRESS_TWO` | Text(200) | Street address line 2 | Suite 400 |
| L | `PARTNER_CITY` | Text(100) | City | Chicago |
| M | `PARTNER_STATE` | Text(50) | State/Province | ILLINOIS or NON-US |
| N | `PARTNER_ZIPCODE` | Text(20) | ZIP/Postal code | 60601 |
| O | `PARTNER_COUNTRY` | Text(100) | Country | UNITED STATES |
| P | `PARTNER_CONTACT_FAX` | Text(20) | Fax number | 555-123-4568 |
| Q | `PARTNER_PROVINCE` | Text(100) | Province (international) | Ontario |

#### **Section 4: Responsible Officer (R-T)** - OPTIONAL

| Col | Field Name | Type | Description | Example |
|-----|------------|------|-------------|---------|
| R | `RO_FIRST_NAME` | Text(50) | Internal buyer first name | Sarah |
| S | `RO_LAST_NAME` | Text(50) | Internal buyer last name | Johnson |
| T | `RO_EMAIL` | Text(200) | Internal contact email | sarah.johnson@enterprise.com |

#### **Section 5: Assignment & Configuration (U-W)** - CONDITIONAL

| Col | Field Name | Type | Description | Example |
|-----|------------|------|-------------|---------|
| U | `DUE_DATE` | Date | Response due date (YYYY-MM-DD) | 2025-03-15 |
| V | `PARTNER_GROUP_DESCRIPTION` | Text(200) | PartnerType assignment | Tier1-Manufacturing |
| W | `PRESELECTED` | Boolean | Auto-assign to default touchpoints | Y or N |

### 2.2 Validation Rules (8 Error Codes)

| Code | Check | Rule |
|------|-------|------|
| ERR-PART-001 | `PARTNER_INTERNAL_ID` unique | No duplicates in file |
| ERR-PART-002 | `PARTNER_NAME` not empty | Required field |
| ERR-PART-003 | `PARTNER_POC_EMAIL_ADDRESS` valid | Valid email format |
| ERR-PART-004 | `PARTNER_POC_EMAIL_ADDRESS` unique | No duplicate emails |
| ERR-PART-005 | `PARTNER_DUNS` format | 9 digits if provided |
| ERR-PART-006 | `DUE_DATE` format | YYYY-MM-DD if provided |
| ERR-PART-007 | `PARTNER_STATE` valid | US state name or NON-US |
| ERR-PART-008 | `PRESELECTED` value | Y, N, or empty |

### 2.3 Special Values

| Value | When to Use | System Behavior |
|-------|-------------|------------------|
| `NULL` | Field is empty/unknown | Field left blank |
| `NON-US` | Partner outside United States | State field for international |
| `UNKNOWN` | Title/role not available | Accepted but flagged |
| `999999999` | DUNS not available | Placeholder for update |

---

## 3. User Batch Load Specification

### 3.1 Template Structure (15 Columns)

#### **Section 1: User Identification (A-E)** - REQUIRED

| Col | Field Name | Type | Description | Example |
|-----|------------|------|-------------|---------|
| A | `USER_ID` | Text(50) | Unique user identifier | sjohnson, 12345 |
| B | `USER_FIRST_NAME` | Text(50) | First name | Sarah |
| C | `USER_LAST_NAME` | Text(50) | Last name | Johnson |
| D | `USER_EMAIL` | Email | Corporate email | sarah.johnson@enterprise.com |
| E | `USER_PHONE` | Text(20) | Phone number | 555-123-4567 |

#### **Section 2: Role & Access (F-I)** - REQUIRED

| Col | Field Name | Type | Description | Example |
|-----|------------|------|-------------|---------|
| F | `USER_ROLE` | Enum | System role assignment | ENTERPRISE_ADMIN, BUYER |
| G | `SITE_CODE` | Text(20) | Assigned site(s) | BROCKTON, ALL |
| H | `GROUP_CODE` | Text(50) | Department/group | PROCUREMENT, COMPLIANCE |
| I | `PARTNERTYPE_ACCESS` | Text(200) | PartnerTypes user can manage | TIER1-MFG, ALL |

#### **Section 3: Additional Fields (J-O)** - OPTIONAL

| Col | Field Name | Type | Description | Example |
|-----|------------|------|-------------|---------|
| J | `USER_TITLE` | Text(100) | Job title | Senior Buyer |
| K | `DEPARTMENT` | Text(100) | Department name | Procurement |
| L | `MANAGER_EMAIL` | Email | Manager's email | manager@enterprise.com |
| M | `SSO_ID` | Text(100) | Single Sign-On ID | sjohnson@corp.local |
| N | `IS_ACTIVE` | Boolean | Account status | Y or N |
| O | `NOTES` | Text(500) | Additional notes | Primary contact for IT |

### 3.2 User Role Reference (12 Roles)

| Role Code | Role Name | Permissions |
|-----------|-----------|-------------|
| `ENTERPRISE_ADMIN` | Enterprise Administrator | Full access to all sites, groups, partners, settings |
| `SITE_ADMIN` | Site Administrator | Full access within assigned site |
| `GROUP_ADMIN` | Group Administrator | Access within assigned group/department |
| `PARTNERTYPE_ADMIN` | PartnerType Administrator | Manage specific partner categories |
| `PROCUREMENT_DIRECTOR` | Procurement Director | View all, manage touchpoints, reports |
| `PROCUREMENT_MANAGER` | Procurement Manager | Manage touchpoints, view partners |
| `BUYER` | Buyer | Manage assigned partners, send invitations |
| `PROCUREMENT_ANALYST` | Procurement Analyst | View reports, compliance dashboards |
| `COMPLIANCE_MANAGER` | Compliance Manager | Manage compliance touchpoints, review responses |
| `COMPLIANCE_SME` | Compliance SME | Review and approve responses |
| `DATA_ADMIN` | Data Administrator | Manage data loads, partner records |
| `VIEWER` | Read-Only Viewer | View-only access to dashboards, reports |

### 3.3 Validation Rules (6 Error Codes)

| Code | Check | Rule |
|------|-------|------|
| ERR-USER-001 | `USER_ID` unique | No duplicates in file or system |
| ERR-USER-002 | `USER_EMAIL` unique | No duplicate emails |
| ERR-USER-003 | `USER_EMAIL` valid | Valid email format |
| ERR-USER-004 | `USER_ROLE` valid | Value in allowed list |
| ERR-USER-005 | `SITE_CODE` exists | Site must exist in system |
| ERR-USER-006 | `SSO_ID` format | Matches IdP format if SSO enabled |

---

## 4. Touchpoint Assignment Load Specification

### 4.1 Template Structure (5 Columns)

| Col | Field Name | Type | Description | Example |
|-----|------------|------|-------------|---------|
| A | `PARTNER_INTERNAL_ID` | Text(50) | Partner ID from partner load | V1002 |
| B | `TOUCHPOINT_CODE` | Text(50) | Touchpoint to assign | HON-CMMC-2024 |
| C | `DUE_DATE` | Date | Response due date | 2025-03-15 |
| D | `SEND_INVITE` | Boolean | Send invitation email now | Y or N |
| E | `RO_EMAIL` | Email | Override responsible officer | buyer@enterprise.com |

### 4.2 Assignment Logic

| Scenario | SEND_INVITE | Result |
|----------|-------------|--------|
| Initial assignment | Y | Partner assigned, invitation sent immediately |
| Initial assignment | N | Partner assigned, invitation held |
| Batch assignment | Y | All partners assigned, invitations sent in batch |
| Re-assignment | Y | Due date updated, new invitation sent |
| Already complete | — | Assignment skipped, warning logged |

---

## 5. Z-Code Classification System

### 5.1 Z-Code Values (11 Classifications)

| Z-Code | Classification | Description |
|--------|----------------|-------------|
| `L` | Large Business | Does not qualify as small business |
| `S` | Small Business | Qualifies under SBA size standards |
| `SDB` | Small Disadvantaged Business | 8(a) certified or SDB |
| `WOSB` | Woman-Owned Small Business | At least 51% woman-owned |
| `VOSB` | Veteran-Owned Small Business | At least 51% veteran-owned |
| `SDVOSB` | Service-Disabled Veteran-Owned SB | At least 51% SDVOSB-owned |
| `HUBZone` | HUBZone Small Business | Located in HUBZone area |
| `AABE` | Asian-American Business Enterprise | Minority classification |
| `ANB` | Alaska Native-Owned | ANB or ANC-owned business |
| `HBCU` | HBCU/MI | HBCU or Minority Institution |

### 5.2 Z-Code Template Structure (7 Columns)

| Col | Field Name | Type | Description | Example |
|-----|------------|------|-------------|---------|
| A | `PARTNER_INTERNAL_ID` | Text(50) | Partner ID | V1002 |
| B | `PARTNER_DUNS` | Text(9) | DUNS for verification | 123456789 |
| C | `ZCODE` | Text(10) | Classification code | SDB, WOSB, S |
| D | `CERTIFICATION_DATE` | Date | When certified | 2024-01-15 |
| E | `EXPIRATION_DATE` | Date | Certification expiry | 2027-01-14 |
| F | `CERTIFYING_AGENCY` | Text(100) | Agency that certified | SBA, SAM.gov |
| G | `SOURCE` | Text(50) | Data source | SAM.gov, Self-Reported |

---

## 6. Gap Analysis: Current vs. Required

### 6.1 Database Schema Comparison

#### **Partners Table**

| Document 64 Field | Current Schema Field | Status |
|-------------------|---------------------|--------|
| `PARTNER_INTERNAL_ID` | `internalId` | ✅ EXISTS |
| `PARTNER_NAME` | `name` | ✅ EXISTS |
| `PARTNER_DUNS` | `dunsNumber` | ✅ EXISTS |
| `PARTNER_SAP_ID` | `erpId` | ✅ EXISTS |
| `PARTNER_POC_FIRST_NAME` | `contactFirstName` | ✅ EXISTS |
| `PARTNER_POC_LAST_NAME` | `contactLastName` | ✅ EXISTS |
| `PARTNER_POC_TITLE` | ❌ MISSING | ❌ NEED TO ADD |
| `PARTNER_POC_PHONE_NUMBER` | `contactPhone` | ✅ EXISTS |
| `PARTNER_POC_EMAIL_ADDRESS` | `contactEmail` | ✅ EXISTS |
| `PARTNER_ADDRESS_ONE` | `address1` | ✅ EXISTS |
| `PARTNER_ADDRESS_TWO` | `address2` | ✅ EXISTS |
| `PARTNER_CITY` | `city` | ✅ EXISTS |
| `PARTNER_STATE` | `state` | ✅ EXISTS |
| `PARTNER_ZIPCODE` | `zipCode` | ✅ EXISTS |
| `PARTNER_COUNTRY` | `country` | ✅ EXISTS |
| `PARTNER_CONTACT_FAX` | `fax` | ✅ EXISTS |
| `PARTNER_PROVINCE` | `province` | ✅ EXISTS |
| `RO_FIRST_NAME` | ❌ MISSING | ❌ NEED TO ADD |
| `RO_LAST_NAME` | ❌ MISSING | ❌ NEED TO ADD |
| `RO_EMAIL` | ❌ MISSING | ❌ NEED TO ADD |
| `DUE_DATE` | (in partnerQuestionnaires) | ✅ EXISTS |
| `PARTNER_GROUP_DESCRIPTION` | `partnerTypeId` | ✅ EXISTS |
| `PRESELECTED` | ❌ MISSING | ❌ NEED TO ADD |

**Missing Fields**: 4 (contactTitle, roFirstName, roLastName, roEmail)

#### **Users Table**

| Document 64 Field | Current Schema Field | Status |
|-------------------|---------------------|--------|
| `USER_ID` | `id` | ✅ EXISTS |
| `USER_FIRST_NAME` | `name` (full name) | ⚠️ PARTIAL |
| `USER_LAST_NAME` | `name` (full name) | ⚠️ PARTIAL |
| `USER_EMAIL` | `email` | ✅ EXISTS |
| `USER_PHONE` | ❌ MISSING | ❌ NEED TO ADD |
| `USER_ROLE` | `role` | ✅ EXISTS |
| `SITE_CODE` | ❌ MISSING | ❌ NEED TO ADD |
| `GROUP_CODE` | ❌ MISSING | ❌ NEED TO ADD |
| `PARTNERTYPE_ACCESS` | ❌ MISSING | ❌ NEED TO ADD |
| `USER_TITLE` | ❌ MISSING | ❌ NEED TO ADD |
| `DEPARTMENT` | ❌ MISSING | ❌ NEED TO ADD |
| `MANAGER_EMAIL` | ❌ MISSING | ❌ NEED TO ADD |
| `SSO_ID` | ❌ MISSING | ❌ NEED TO ADD |
| `IS_ACTIVE` | `active` (exists in partners) | ⚠️ PARTIAL |
| `NOTES` | ❌ MISSING | ❌ NEED TO ADD |

**Missing Fields**: 10 (phone, siteCode, groupCode, partnerTypeAccess, title, department, managerEmail, ssoId, isActive, notes)

---

## 7. Implementation Requirements

### 7.1 Schema Updates Needed

#### **Partners Table** - Add 4 fields:
```sql
ALTER TABLE partners ADD COLUMN contactTitle VARCHAR(100);
ALTER TABLE partners ADD COLUMN roFirstName VARCHAR(50);
ALTER TABLE partners ADD COLUMN roLastName VARCHAR(50);
ALTER TABLE partners ADD COLUMN roEmail VARCHAR(200);
ALTER TABLE partners ADD COLUMN preselected BOOLEAN DEFAULT FALSE;
```

#### **Users Table** - Add 10 fields:
```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN siteCode VARCHAR(20);
ALTER TABLE users ADD COLUMN groupCode VARCHAR(50);
ALTER TABLE users ADD COLUMN partnerTypeAccess TEXT;
ALTER TABLE users ADD COLUMN title VARCHAR(100);
ALTER TABLE users ADD COLUMN department VARCHAR(100);
ALTER TABLE users ADD COLUMN managerEmail VARCHAR(200);
ALTER TABLE users ADD COLUMN ssoId VARCHAR(100);
ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN notes TEXT;
```

#### **New Tables Needed**:

1. **`partnerZCodes` table** - Store Z-Code classifications
```sql
CREATE TABLE partnerZCodes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  partnerId INT NOT NULL,
  zCode VARCHAR(10) NOT NULL,
  certificationDate DATE,
  expirationDate DATE,
  certifyingAgency VARCHAR(100),
  source VARCHAR(50),
  FOREIGN KEY (partnerId) REFERENCES partners(id)
);
```

### 7.2 Parser Services Needed

Following the QMS parser pattern, create:

1. **`server/services/partner-parser.ts`**
   - Parse Partner Excel template (23 columns)
   - Validate 8 error codes (ERR-PART-001 through ERR-PART-008)
   - Transform to database schema
   - Handle special values (NULL, NON-US, UNKNOWN, 999999999)

2. **`server/services/user-parser.ts`**
   - Parse User Excel template (15 columns)
   - Validate 6 error codes (ERR-USER-001 through ERR-USER-006)
   - Validate role codes against 12 allowed values
   - Handle SSO integration

3. **`server/services/assignment-parser.ts`**
   - Parse Assignment Excel template (5 columns)
   - Validate partner and touchpoint existence
   - Handle SEND_INVITE logic
   - Batch invitation sending

4. **`server/services/zcode-parser.ts`**
   - Parse Z-Code Excel template (7 columns)
   - Validate Z-Code values against 11 allowed codes
   - Handle certification dates and expiration

### 7.3 tRPC Procedures Needed

Add to appropriate routers:

```typescript
// Partner router
partner.uploadBatch: protectedProcedure
  .input(z.object({
    fileData: z.string(), // Base64 Excel
    mode: z.enum(['insert', 'update']),
  }))
  .mutation(async ({ input }) => {
    // Call partner-parser.ts
  });

// User router  
user.uploadBatch: protectedProcedure
  .input(z.object({
    fileData: z.string(),
    mode: z.enum(['insert', 'update']),
  }))
  .mutation(async ({ input }) => {
    // Call user-parser.ts
  });

// Touchpoint router
touchpoint.uploadAssignments: protectedProcedure
  .input(z.object({
    fileData: z.string(),
    sendInvites: z.boolean(),
  }))
  .mutation(async ({ input }) => {
    // Call assignment-parser.ts
  });

// Partner router
partner.uploadZCodes: protectedProcedure
  .input(z.object({
    fileData: z.string(),
  }))
  .mutation(async ({ input }) => {
    // Call zcode-parser.ts
  });
```

### 7.4 UI Components Needed

Following the QMSUploadDialog pattern, create:

1. **`PartnerUploadDialog.tsx`** - Partner batch upload UI
2. **`UserUploadDialog.tsx`** - User batch upload UI
3. **`AssignmentUploadDialog.tsx`** - Touchpoint assignment UI
4. **`ZCodeUploadDialog.tsx`** - Z-Code classification UI

---

## 8. Implementation Effort Estimate

| Component | Effort | Priority |
|-----------|--------|----------|
| **Partner Batch Load** | 3-4 days | HIGH |
| - Schema updates (4 fields) | 0.5 days | |
| - Partner parser service | 1.5 days | |
| - tRPC procedure | 0.5 days | |
| - PartnerUploadDialog UI | 1 day | |
| **User Batch Load** | 4-5 days | HIGH |
| - Schema updates (10 fields) | 1 day | |
| - User parser service | 1.5 days | |
| - tRPC procedure | 0.5 days | |
| - UserUploadDialog UI | 1 day | |
| **Touchpoint Assignment** | 2-3 days | MEDIUM |
| - Assignment parser | 1 day | |
| - tRPC procedure | 0.5 days | |
| - AssignmentUploadDialog UI | 1 day | |
| **Z-Code Classification** | 2-3 days | MEDIUM |
| - New table creation | 0.5 days | |
| - Z-Code parser | 1 day | |
| - tRPC procedure | 0.5 days | |
| - ZCodeUploadDialog UI | 1 day | |
| **Testing & Integration** | 2-3 days | HIGH |
| **TOTAL** | **13-18 days** | |

---

## 9. Recommendations

### 9.1 Implementation Priority

**Phase 1 (Critical):**
1. Partner Batch Load - Enables bulk supplier onboarding
2. User Batch Load - Enables enterprise user management

**Phase 2 (Important):**
3. Touchpoint Assignment - Automates questionnaire distribution
4. Z-Code Classification - Enables compliance reporting

**Phase 3 (Enhancement):**
5. ERP Integration - Real-time data sync
6. Template Generator - Auto-generate templates from system

### 9.2 Quick Wins

1. **Reuse QMS Parser Pattern** - Copy validation engine, error handling, UI components
2. **Leverage Existing UI** - "Add Spreadsheet" menu already exists in Partner/Person pages
3. **Database Schema** - Most fields already exist, only 14 total fields to add

### 9.3 Risk Mitigation

1. **Data Quality** - Implement strict validation before import
2. **Duplicate Prevention** - Check for existing records before insert
3. **Rollback Capability** - Track import batches for undo
4. **Audit Trail** - Log all imports with user, timestamp, record count

---

## 10. Cross-Reference to Other Documents

| Document | Relationship |
|----------|--------------|
| **INT.DOC.63** (Questionnaire Creation) | QMS template structure (27 columns) |
| **INT.DOC.17** (Supplier Partner Flow) | Partner workflow after import |
| **INT.DOC.60** (Stakeholder Access Matrix) | User role definitions |

---

## Conclusion

Document 64 provides comprehensive specifications for bulk data loading. The implementation follows the same pattern as the QMS import system we just built, making it straightforward to replicate for Partner, User, Assignment, and Z-Code imports.

**Key Insight**: The "Add Spreadsheet" menu option already exists in the UI - we just need to wire up the backend parsers and validation engines to make it functional.

**Next Step**: Implement Partner Batch Load first (highest priority, 3-4 days effort) to enable bulk supplier onboarding.
