# Federal Compliance Platform - Database Schema Relationships

## Core Entity Relationships

### 1. Protocol (Compliance Campaign)
**Table:** `protocols`

Represents a compliance program (e.g., Reps & Certs, Buy American Act, C-TPAT).

**Key Fields:**
- `id` - Primary key
- `enterpriseId` - Multi-tenant scoping (FK to enterprises)
- `name` - Protocol name (e.g., "Buy American Act")
- `description` - Campaign description
- `abbreviation` - Short code
- `adminId` - Protocol administrator (FK to users)
- `sponsorId` - Executive sponsor (FK to users)
- `startDate`, `endDate` - Campaign timeline
- `active` - Archive pattern (1=active, 0=archived)

**Relationships:**
- **Belongs to:** Enterprise (1:1)
- **Has many:** Touchpoints (1:N)

---

### 2. Touchpoint (Annual Cycle/Year)
**Table:** `touchpoints`

Represents a specific year or cycle within a protocol (e.g., "Reps & Certs 2025").

**Key Fields:**
- `id` - Primary key
- `protocolId` - Parent protocol (FK to protocols)
- `title` - Touchpoint name (e.g., "2025")
- `description` - Cycle description
- `personId` - Touchpoint owner (FK to users)
- `target` - Target response count
- `automaticReminder` - Enable auto-reminders
- `startDate`, `endDate` - Cycle timeline
- `active` - Archive pattern

**Relationships:**
- **Belongs to:** Protocol (N:1)
- **Has many:** Partner-Questionnaire assignments via junction table

---

### 3. Partner Type (Supplier Classification)
**Table:** `partnerTypes`

Classifies suppliers (e.g., FAR 15, FAR 12, Internal Supplier, Other).

**Key Fields:**
- `id` - Primary key
- `enterpriseId` - Multi-tenant scoping (FK to enterprises)
- `name` - Type name (e.g., "FAR 15 Suppliers")
- `alias` - Short name
- `description` - Type description
- `partnerClass` - Classification code
- `active` - Archive pattern

**Relationships:**
- **Belongs to:** Enterprise (N:1)
- **Has many:** Partners (1:N)
- **Has many:** Questionnaires (1:N) - questionnaires are designed for specific partner types

---

### 4. Group (Site/Location)
**Table:** `groups`

Represents organizational units, sites, or locations (e.g., Manila, Tucson, Japan).

**Key Fields:**
- `id` - Primary key
- `enterpriseId` - Multi-tenant scoping (FK to enterprises)
- `groupCollectionId` - Parent collection for hierarchical grouping
- `groupType` - Type of group (site, division, etc.)
- `name` - Group name (e.g., "Manila Site")
- `description` - Group description
- `email` - Group contact email
- `authorId` - Creator (FK to users)
- `stateId` - Geographic state (FK to states)
- `active` - Archive pattern

**Relationships:**
- **Belongs to:** Enterprise (N:1)
- **Belongs to:** Group Collection (N:1) - for hierarchical organization
- **Has many:** Partners (N:N via partner-group junction)
- **Has many:** Users (N:N via userGroups junction) - users assigned to specific groups

**Junction Table:** `userGroups`
- `userId` - FK to users
- `groupId` - FK to groups
- **Purpose:** Users only see partners in their assigned groups (row-level security)

---

### 5. Questionnaire (Compliance Form)
**Table:** `questionnaires`

Represents a compliance questionnaire/form template.

**Key Fields:**
- `id` - Primary key
- `enterpriseId` - Multi-tenant scoping (FK to enterprises)
- `title` - Questionnaire title
- `description` - Form description
- `locked` - Prevent editing if responses exist
- `multiLanguage` - Support multiple languages
- `levelType` - Partner-level vs. location-level
- `personId` - Creator (FK to users)
- `partnerTypeId` - Target partner type (FK to partnerTypes)
- `active` - Archive pattern

**Relationships:**
- **Belongs to:** Enterprise (N:1)
- **Belongs to:** Partner Type (N:1) - questionnaires target specific partner types
- **Has many:** Questions (1:N)
- **Has many:** Partner assignments via partnerQuestionnaires (1:N)

---

### 6. Partner (Supplier)
**Table:** `partners`

Represents actual suppliers/vendors.

**Key Fields:**
- `id` - Primary key
- `enterpriseId` - Multi-tenant scoping (FK to enterprises)
- `partnerTypeId` - Classification (FK to partnerTypes)
- `partnerStatusId` - Current status (FK to partnerStatuses)
- `companyName` - Supplier company name
- `email` - Primary contact email
- `contactFirstName`, `contactLastName` - Contact person
- `address`, `city`, `state`, `zip`, `country` - Location
- `active` - Archive pattern

**Relationships:**
- **Belongs to:** Enterprise (N:1)
- **Belongs to:** Partner Type (N:1)
- **Belongs to:** Partner Status (N:1)
- **Has many:** Questionnaire assignments via partnerQuestionnaires (1:N)

---

## The Assignment Model (PPTQ)

### Partner-Questionnaire Assignment
**Table:** `partnerQuestionnaires`

**Full Name:** Partner-PartnerType-Touchpoint-Questionnaire (PPTQ)

This is the **core transaction table** that ties everything together. It represents a specific supplier's assignment to complete a specific questionnaire for a specific compliance campaign cycle.

**Key Fields:**
- `id` - Primary key
- `partnerId` - The supplier (FK to partners)
- `touchpointQuestionnaireId` - Links to the Protocol-Touchpoint-PartnerType-Questionnaire combination
- `accessCode` - **Unique access code** for this partner to access this questionnaire
- `invitedBy` - User who sent the invitation (FK to users)
- `invitedDate` - When invitation was sent
- `dueDate` - Response deadline
- `completedDate` - When partner completed the questionnaire
- `status` - Current status (invited, in progress, completed, etc.)
- `progress` - Percentage complete (0-100)
- `score` - Calculated compliance score
- `pdfUrl` - S3 URL to generated PDF report
- `loadGroup` - Batch import group identifier

**Relationships:**
- **Belongs to:** Partner (N:1)
- **Belongs to:** Touchpoint-Questionnaire junction (N:1)
- **Has many:** Questionnaire responses (1:N) - actual answers to questions

---

## The Complete Workflow

### Campaign Assignment Flow

```
1. Enterprise (Honeywell)
   └── Protocol (Buy American Act)
       └── Touchpoint (2025)
           └── Partner Type (Internal Supplier)
               └── Group/Site (Japan)
                   └── Questionnaire (Buy American Compliance Form)
                       └── Partner (Acme Corp)
                           └── Access Code (ABC123XYZ)
```

### Assignment Logic

**Example:**
> For the **Buy American Act** protocol, in the **2025** touchpoint, all **Internal Suppliers** located in the **Japan** group should complete **Questionnaire A**.

**Database Operations:**
1. Create/select Protocol: `protocolId = 5` (Buy American Act)
2. Create/select Touchpoint: `touchpointId = 12` (2025, protocolId=5)
3. Filter Partners by:
   - `partnerTypeId = 3` (Internal Supplier)
   - Group assignment = Japan
4. Assign Questionnaire: `questionnaireId = 8` (designed for partnerTypeId=3)
5. For each matching Partner:
   - Generate unique `accessCode`
   - Create `partnerQuestionnaires` record
   - Send invitation email with access code

### User Access Control

**Row-Level Security via userGroups:**

Users are assigned to specific Groups/Sites via the `userGroups` junction table. When querying partners:

```sql
SELECT p.*
FROM partners p
INNER JOIN partnerGroups pg ON p.id = pg.partnerId
INNER JOIN userGroups ug ON pg.groupId = ug.groupId
WHERE ug.userId = :currentUserId
  AND p.enterpriseId = :userEnterpriseId
  AND p.active = 1
```

This ensures users only see partners in their assigned groups.

---

## Missing Junction Tables

### ⚠️ Required Additions

Based on the workflow, we need these junction tables:

1. **`touchpointQuestionnaires`** (or `partnerTypeTouchpointQuestionnaires`)
   - Links: Touchpoint + PartnerType + Questionnaire
   - Purpose: Define which questionnaires are used for which partner types in which touchpoint
   - Referenced by: `partnerQuestionnaires.touchpointQuestionnaireId`

2. **`partnerGroups`**
   - Links: Partner + Group
   - Purpose: Assign partners to specific sites/locations
   - Enables: Filtering partners by group/site

3. **`groupCollections`**
   - Hierarchical grouping (already referenced by `groups.groupCollectionId`)
   - Purpose: Organize groups into collections (e.g., "North America Sites", "APAC Sites")

---

## Summary

The schema implements a sophisticated multi-dimensional compliance tracking system where:

- **Enterprises** run **Protocols** (compliance programs)
- **Protocols** have **Touchpoints** (annual cycles)
- **Partners** are classified by **Partner Types** and organized into **Groups**
- **Questionnaires** are designed for specific **Partner Types**
- **Users** are scoped to specific **Groups** for row-level security
- **Access Codes** are generated per Partner-Questionnaire assignment
- The **partnerQuestionnaires** table is the central transaction log tracking all assignments and responses

This enables complex queries like:
> "Show me all Internal Suppliers in the Japan site who haven't completed their Buy American Act 2025 questionnaire"
