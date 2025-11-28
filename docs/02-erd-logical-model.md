# Intelleges Federal Compliance Management Platform
## ERD Logical Model
### Entity-Relationship Design

**Document Reference:** COMP.DOC.02  
**Version:** 1.0  
**Date:** November 27, 2025  
**Author:** Intelleges Technical Team  
**Status:** Final

---

## Executive Summary

This document presents the logical data model for the Intelleges Federal Compliance Management Platform. The model supports comprehensive compliance operations including partner management, enterprise client management, protocol configuration, questionnaire administration, document verification, compliance scoring, and automated partner engagement through email and WhatsApp integration.

The logical model consists of 20+ core entities organized into seven functional domains: **User Management**, **Partner & Enterprise Management**, **Compliance Operations**, **Document Management**, **Scoring & Analytics**, **Communications**, and **Audit & Reporting**. The model implements sophisticated business rules for compliance scoring, deadline management, document expiration tracking, and partner segmentation.

---

## 1. Domain Overview

### 1.1 User Management Domain

This domain handles authentication, authorization, user profiles, and role-based access control.

#### Users Entity

The central entity for all platform users represents Intelleges administrators, enterprise users, and supplier contacts. Each user has a unique `openId` from the Manus OAuth system, which serves as the primary authentication mechanism.

**Key Fields:**
- `id` (PK) - Surrogate primary key
- `openId` (unique) - Manus OAuth identifier
- `email` - User email address
- `name` - Full name
- `role` - Enum: `intelleges_admin`, `enterprise_admin`, `enterprise_user`, `supplier`
- `enterpriseId` (FK, nullable) - Links enterprise users to their organization
- `partnerId` (FK, nullable) - Links supplier contacts to their partner organization
- `createdAt`, `updatedAt`, `lastSignedIn` - Audit timestamps

**Role-Based Access Control:**

The platform implements a four-tier role system:

1. **Intelleges Admin** - Full platform access including:
   - Partner and enterprise management
   - Protocol and touchpoint configuration
   - Document verification and approval
   - Compliance scoring configuration
   - System-wide reporting and analytics
   - User management

2. **Enterprise Admin** - Enterprise-scoped access including:
   - View all suppliers for their enterprise
   - Review questionnaire submissions
   - Approve/reject documents
   - Generate enterprise-level reports
   - Manage enterprise users
   - Configure enterprise-specific touchpoints

3. **Enterprise User** - Limited enterprise access including:
   - View assigned suppliers
   - Review questionnaire submissions
   - View compliance scores
   - Generate basic reports
   - No configuration or approval permissions

4. **Supplier** - Partner portal access including:
   - Complete assigned questionnaires
   - Upload compliance documents
   - View own compliance status
   - Request deadline extensions
   - Communicate via WhatsApp
   - Track certification status

**Communication Preferences:**

Users can configure notification preferences:
- `notificationChannel` - Enum: `email`, `whatsapp`, `both`
- `emailNotifications` - Boolean for email opt-in
- `whatsappNotifications` - Boolean for WhatsApp opt-in
- `language` - Preferred language (future enhancement)

**Audit Fields:**
- `createdAt` - Account creation timestamp
- `updatedAt` - Last profile modification
- `lastSignedIn` - Last authentication timestamp
- `isActive` - Account status flag

---

### 1.2 Partner & Enterprise Management Domain

This domain manages supplier/partner organizations and enterprise client organizations.

#### Partners Entity

Represents supplier/partner organizations subject to compliance requirements.

**Key Fields:**
- `id` (PK) - Surrogate primary key
- `name` - Partner organization name
- `accessCode` (unique) - Secure access code for supplier portal login
- `contactEmail` - Primary contact email
- `contactPhone` - Primary contact phone (for WhatsApp)
- `address`, `city`, `state`, `zipCode`, `country` - Physical address
- `website` - Company website URL
- `industryType` - Industry classification
- `companySize` - Employee count range
- `annualRevenue` - Revenue range
- `status` - Enum: `active`, `inactive`, `suspended`, `archived`
- `tier` - Enum: `standard`, `preferred`, `strategic` - Segmentation for prioritization
- `assignedEnterpriseId` (FK) - Primary enterprise client
- `createdAt`, `updatedAt` - Audit timestamps

**Partner Segmentation:**

The `tier` field enables prioritized compliance management:
- **Standard** - Basic compliance requirements
- **Preferred** - Enhanced monitoring and support
- **Strategic** - White-glove service with dedicated support

**Access Control:**

Partners access the supplier portal using a unique `accessCode` combined with email verification. This two-factor approach ensures security without requiring complex password management.

#### Enterprises Entity

Represents client organizations that require supplier compliance management.

**Key Fields:**
- `id` (PK) - Surrogate primary key
- `name` - Enterprise organization name
- `domain` - Email domain for user auto-assignment
- `contactEmail` - Primary contact email
- `contactPhone` - Primary contact phone
- `address`, `city`, `state`, `zipCode`, `country` - Physical address
- `website` - Company website URL
- `industryType` - Industry classification
- `contractStartDate` - Service agreement start date
- `contractEndDate` - Service agreement end date
- `isActive` - Active status flag
- `createdAt`, `updatedAt` - Audit timestamps

**Multi-Enterprise Support:**

The platform supports multiple enterprise clients, each with:
- Isolated partner lists
- Custom protocol configurations
- Separate compliance scoring rules
- Independent reporting dashboards
- Dedicated user accounts

---

### 1.3 Compliance Operations Domain

This domain handles protocols, touchpoints, questionnaires, and responses.

#### Protocols Entity

Represents compliance frameworks or regulatory standards (e.g., SOC 2, ISO 27001, GDPR, HIPAA).

**Key Fields:**
- `id` (PK) - Surrogate primary key
- `name` - Protocol name (e.g., "SOC 2 Type II")
- `code` - Short code (e.g., "SOC2")
- `description` - Detailed protocol description
- `regulatoryBody` - Issuing organization (e.g., "AICPA")
- `version` - Protocol version (e.g., "2017")
- `effectiveDate` - When protocol became effective
- `isActive` - Active status flag
- `createdAt`, `updatedAt` - Audit timestamps

**Protocol-Enterprise Mapping:**

Many-to-many relationship through `enterpriseProtocols` junction table:
- `enterpriseId` (FK) - Enterprise requiring this protocol
- `protocolId` (FK) - Required protocol
- `requiredForAllPartners` - Boolean flag
- `createdAt` - Assignment timestamp

#### Touchpoints Entity

Represents specific compliance assessment points within protocols (e.g., "Access Control", "Data Encryption", "Incident Response").

**Key Fields:**
- `id` (PK) - Surrogate primary key
- `protocolId` (FK) - Parent protocol
- `name` - Touchpoint name
- `code` - Short code for reporting
- `description` - Detailed touchpoint description
- `category` - Grouping category
- `weight` - Scoring weight (0-100)
- `criticalityLevel` - Enum: `low`, `medium`, `high`, `critical`
- `isActive` - Active status flag
- `displayOrder` - Sort order
- `createdAt`, `updatedAt` - Audit timestamps

**Touchpoint-Partner Mapping:**

Many-to-many relationship through `partnerTouchpoints` junction table:
- `partnerId` (FK) - Partner being assessed
- `touchpointId` (FK) - Required touchpoint
- `status` - Enum: `not_started`, `in_progress`, `completed`, `approved`, `rejected`
- `dueDate` - Compliance deadline
- `completedDate` - Completion timestamp
- `approvedDate` - Approval timestamp
- `assignedUserId` (FK) - Enterprise user assigned to review
- `createdAt`, `updatedAt` - Audit timestamps

#### Questionnaires Entity

Represents compliance questionnaires/assessments assigned to partners.

**Key Fields:**
- `id` (PK) - Surrogate primary key
- `touchpointId` (FK) - Associated touchpoint
- `partnerId` (FK) - Partner assigned to complete
- `title` - Questionnaire title
- `description` - Instructions and context
- `questions` - JSON array of question objects
- `status` - Enum: `draft`, `sent`, `in_progress`, `submitted`, `under_review`, `approved`, `rejected`
- `sentDate` - When questionnaire was sent to partner
- `dueDate` - Submission deadline
- `submittedDate` - When partner submitted
- `reviewedDate` - When review completed
- `reviewedByUserId` (FK) - User who reviewed
- `reviewNotes` - Reviewer comments
- `score` - Calculated compliance score (0-100)
- `createdAt`, `updatedAt` - Audit timestamps

**Question Structure (JSON):**

```json
{
  "id": "q1",
  "type": "multiple_choice|text|yes_no|file_upload|date|number|scale|matrix",
  "question": "Do you have a documented information security policy?",
  "required": true,
  "options": ["Yes", "No", "In Progress"],
  "weight": 10,
  "helpText": "Please provide details about your policy documentation."
}
```

**Question Types:**
1. **Multiple Choice** - Select one option
2. **Text** - Free-form text response
3. **Yes/No** - Boolean response
4. **File Upload** - Document attachment
5. **Date** - Date picker
6. **Number** - Numeric input
7. **Scale** - Rating scale (1-5, 1-10)
8. **Matrix** - Grid of questions with same response options

#### QuestionnaireResponses Entity

Stores partner responses to questionnaires.

**Key Fields:**
- `id` (PK) - Surrogate primary key
- `questionnaireId` (FK) - Parent questionnaire
- `partnerId` (FK) - Responding partner
- `responses` - JSON object with question ID → answer mappings
- `submittedByUserId` (FK) - User who submitted
- `submittedAt` - Submission timestamp
- `ipAddress` - Submission IP for audit
- `userAgent` - Browser info for audit
- `createdAt`, `updatedAt` - Audit timestamps

**Response Structure (JSON):**

```json
{
  "q1": {
    "answer": "Yes",
    "comment": "Policy documented in employee handbook",
    "attachments": ["s3://bucket/policy-doc.pdf"]
  },
  "q2": {
    "answer": "Annually",
    "comment": null,
    "attachments": []
  }
}
```

---

### 1.4 Document Management Domain

This domain manages compliance document uploads, verification, and expiration tracking.

#### Documents Entity

Represents compliance documents uploaded by partners.

**Key Fields:**
- `id` (PK) - Surrogate primary key
- `partnerId` (FK) - Partner who uploaded
- `touchpointId` (FK, nullable) - Associated touchpoint
- `questionnaireId` (FK, nullable) - Associated questionnaire
- `documentType` - Enum: `certificate`, `policy`, `audit_report`, `insurance`, `license`, `other`
- `title` - Document title
- `description` - Document description
- `fileName` - Original filename
- `fileKey` - S3 storage key
- `fileUrl` - S3 public URL
- `fileSizeBytes` - File size
- `mimeType` - File MIME type
- `uploadedByUserId` (FK) - User who uploaded
- `uploadedAt` - Upload timestamp
- `expiresAt` (nullable) - Document expiration date
- `status` - Enum: `pending_review`, `approved`, `rejected`, `expired`
- `reviewedByUserId` (FK, nullable) - User who reviewed
- `reviewedAt` (nullable) - Review timestamp
- `reviewNotes` (nullable) - Reviewer comments
- `rejectionReason` (nullable) - Why document was rejected
- `createdAt`, `updatedAt` - Audit timestamps

**Document Expiration Tracking:**

Documents with `expiresAt` dates trigger automated notifications:
- 90 days before expiration - First reminder
- 60 days before expiration - Second reminder
- 30 days before expiration - Urgent reminder
- On expiration date - Status changes to `expired`
- After expiration - Compliance score impacted

**Document Verification Workflow:**

1. Partner uploads document → Status: `pending_review`
2. Enterprise user or Intelleges admin reviews → Status: `approved` or `rejected`
3. If rejected, partner receives notification with `rejectionReason`
4. Partner can re-upload corrected document
5. Approved documents count toward compliance score

---

### 1.5 Scoring & Analytics Domain

This domain calculates and stores compliance scores at multiple levels.

#### ComplianceScores Entity

Stores calculated compliance scores for partners.

**Key Fields:**
- `id` (PK) - Surrogate primary key
- `partnerId` (FK) - Partner being scored
- `enterpriseId` (FK) - Enterprise client context
- `protocolId` (FK, nullable) - Protocol-specific score
- `touchpointId` (FK, nullable) - Touchpoint-specific score
- `scoreType` - Enum: `overall`, `protocol`, `touchpoint`, `category`
- `score` - Calculated score (0-100)
- `maxScore` - Maximum possible score
- `percentComplete` - Completion percentage
- `status` - Enum: `compliant`, `non_compliant`, `pending`, `needs_attention`
- `calculatedAt` - When score was calculated
- `validUntil` (nullable) - Score expiration date
- `createdAt`, `updatedAt` - Audit timestamps

**Scoring Logic:**

Compliance scores are calculated using weighted averages:

1. **Touchpoint Score** = (Completed Requirements / Total Requirements) × Touchpoint Weight
2. **Protocol Score** = Σ(Touchpoint Scores) / Σ(Touchpoint Weights)
3. **Overall Score** = Σ(Protocol Scores × Protocol Weights) / Σ(Protocol Weights)

**Status Determination:**

- **Compliant** - Score ≥ 90% and all critical touchpoints complete
- **Non-Compliant** - Score < 70% or any critical touchpoint incomplete
- **Needs Attention** - Score 70-89% or approaching deadline
- **Pending** - Assessment in progress, insufficient data

#### ComplianceHistory Entity

Tracks historical compliance scores for trend analysis.

**Key Fields:**
- `id` (PK) - Surrogate primary key
- `partnerId` (FK) - Partner
- `score` - Historical score
- `status` - Historical status
- `snapshotDate` - When snapshot was taken
- `notes` - Context notes
- `createdAt` - Audit timestamp

**Trend Analysis:**

Historical data enables:
- Month-over-month compliance trends
- Partner improvement tracking
- Risk identification (declining scores)
- Benchmarking across partner portfolio

---

### 1.6 Communications Domain

This domain manages automated partner communications through email and WhatsApp.

#### DeadlineExtensions Entity

Tracks partner requests to extend compliance deadlines.

**Key Fields:**
- `id` (PK) - Surrogate primary key
- `partnerId` (FK) - Requesting partner
- `touchpointId` (FK) - Touchpoint needing extension
- `questionnaireId` (FK, nullable) - Associated questionnaire
- `originalDueDate` - Current deadline
- `requestedDueDate` - Requested new deadline
- `daysRequested` - Number of additional days
- `requestSource` - Enum: `whatsapp`, `email`, `phone`, `portal`
- `requestReason` - Partner's explanation
- `status` - Enum: `pending`, `approved`, `rejected`, `cancelled`
- `reviewedByUserId` (FK, nullable) - User who reviewed
- `reviewedAt` (nullable) - Review timestamp
- `approvalNotes` (nullable) - Reviewer comments
- `rejectionReason` (nullable) - Why request was denied
- `createdAt`, `updatedAt` - Audit timestamps

**Auto-Approval Logic:**

Extensions are automatically approved if:
- Requested extension ≤ 7 days
- Partner has no overdue items
- Partner tier is `preferred` or `strategic`
- No conflicting enterprise deadlines

Otherwise, manual review required.

#### EmailLogs Entity

Tracks all email communications sent through SendGrid.

**Key Fields:**
- `id` (PK) - Surrogate primary key
- `userId` (FK, nullable) - Recipient user
- `partnerId` (FK, nullable) - Recipient partner
- `toEmail` - Recipient email address
- `fromEmail` - Sender email address
- `subject` - Email subject line
- `templateId` - SendGrid template ID
- `templateData` - JSON with template variables
- `sendgridMessageId` - SendGrid message ID for tracking
- `status` - Enum: `queued`, `sent`, `delivered`, `opened`, `clicked`, `bounced`, `failed`
- `sentAt` - When email was sent
- `deliveredAt` (nullable) - When email was delivered
- `openedAt` (nullable) - When email was opened
- `clickedAt` (nullable) - When link was clicked
- `bouncedAt` (nullable) - When email bounced
- `bounceReason` (nullable) - Why email bounced
- `createdAt`, `updatedAt` - Audit timestamps

**Email Templates:**

Common templates include:
- `questionnaire_assigned` - New questionnaire notification
- `deadline_reminder` - Upcoming deadline reminder
- `deadline_overdue` - Overdue notification
- `document_expiring` - Document expiration warning
- `extension_approved` - Deadline extension approval
- `extension_rejected` - Deadline extension rejection
- `compliance_report` - Monthly compliance summary

#### WhatsAppLogs Entity

Tracks all WhatsApp communications through Twilio.

**Key Fields:**
- `id` (PK) - Surrogate primary key
- `userId` (FK, nullable) - Associated user
- `partnerId` (FK, nullable) - Associated partner
- `phoneNumber` - WhatsApp phone number
- `direction` - Enum: `inbound`, `outbound`
- `messageBody` - Message content
- `twilioMessageSid` - Twilio message ID for tracking
- `status` - Enum: `queued`, `sent`, `delivered`, `read`, `failed`, `undelivered`
- `relatedQuestionnaireId` (FK, nullable) - Associated questionnaire
- `relatedExtensionId` (FK, nullable) - Associated extension request
- `sentAt` (nullable) - When message was sent
- `deliveredAt` (nullable) - When message was delivered
- `readAt` (nullable) - When message was read
- `failedAt` (nullable) - When delivery failed
- `failureReason` (nullable) - Why delivery failed
- `createdAt`, `updatedAt` - Audit timestamps

**WhatsApp Use Cases:**

1. **Deadline Reminders** - Automated reminders 7, 3, 1 days before deadline
2. **Extension Requests** - Partners can reply to reminders to request extensions
3. **Status Updates** - Real-time notifications of approvals/rejections
4. **Quick Questions** - Partners can ask questions via WhatsApp
5. **Document Requests** - Admins can request specific documents

---

### 1.7 Audit & Reporting Domain

This domain provides comprehensive audit trails and reporting capabilities.

#### AuditLogs Entity

Immutable audit trail of all critical platform actions.

**Key Fields:**
- `id` (PK) - Surrogate primary key
- `userId` (FK) - User who performed action
- `action` - Enum: `create`, `update`, `delete`, `approve`, `reject`, `login`, `logout`
- `entityType` - Enum: `partner`, `enterprise`, `user`, `questionnaire`, `document`, `touchpoint`, `protocol`
- `entityId` - ID of affected entity
- `changes` - JSON with before/after values
- `ipAddress` - User's IP address
- `userAgent` - User's browser info
- `timestamp` - When action occurred
- `createdAt` - Audit timestamp

**Audit Trail Use Cases:**

- Compliance audits (who approved what, when)
- Security investigations (unauthorized access attempts)
- Data change tracking (what changed, by whom)
- Regulatory reporting (SOC 2, ISO 27001 requirements)

**Retention Policy:**

Audit logs retained for minimum 7 years per compliance requirements.

---

## 2. Entity Relationships

### 2.1 User-Centric Relationships

**User → Partners (1:N)**  
Each supplier contact user links to one partner organization via `partnerId`. Partners can have multiple contact users.

**User → Enterprises (1:N)**  
Each enterprise user links to one enterprise organization via `enterpriseId`. Enterprises can have multiple users.

**User → Questionnaire Reviews (1:N)**  
Each user can review multiple questionnaires. Each questionnaire has one reviewer via `reviewedByUserId`.

**User → Document Reviews (1:N)**  
Each user can review multiple documents. Each document has one reviewer via `reviewedByUserId`.

**User → Audit Logs (1:N)**  
Each user generates multiple audit log entries. Each audit log entry has one user.

### 2.2 Partner-Centric Relationships

**Partner → Questionnaires (1:N)**  
Each partner can have multiple assigned questionnaires. Each questionnaire belongs to one partner.

**Partner → Documents (1:N)**  
Each partner can upload multiple documents. Each document belongs to one partner.

**Partner → ComplianceScores (1:N)**  
Each partner has multiple compliance scores (overall, per-protocol, per-touchpoint). Each score belongs to one partner.

**Partner → DeadlineExtensions (1:N)**  
Each partner can request multiple deadline extensions. Each extension request belongs to one partner.

**Partner → EmailLogs (1:N)**  
Each partner receives multiple emails. Each email log can link to one partner.

**Partner → WhatsAppLogs (1:N)**  
Each partner exchanges multiple WhatsApp messages. Each message log can link to one partner.

**Partner → Enterprise (N:1)**  
Each partner is assigned to one primary enterprise via `assignedEnterpriseId`. Enterprises can have multiple partners.

### 2.3 Enterprise-Centric Relationships

**Enterprise → Partners (1:N)**  
Each enterprise has multiple suppliers/partners. Each partner has one primary enterprise.

**Enterprise → Users (1:N)**  
Each enterprise has multiple users (admins and regular users). Each user belongs to one enterprise.

**Enterprise → Protocols (N:M)**  
Each enterprise requires multiple protocols. Each protocol can be required by multiple enterprises. Junction table: `enterpriseProtocols`.

**Enterprise → ComplianceScores (1:N)**  
Each enterprise has multiple compliance scores (aggregated across their partners). Each score belongs to one enterprise.

### 2.4 Protocol-Centric Relationships

**Protocol → Touchpoints (1:N)**  
Each protocol has multiple touchpoints/assessment areas. Each touchpoint belongs to one protocol.

**Protocol → Enterprises (N:M)**  
Each protocol can be required by multiple enterprises. Each enterprise requires multiple protocols. Junction table: `enterpriseProtocols`.

**Protocol → ComplianceScores (1:N)**  
Each protocol has multiple compliance scores (one per partner per enterprise). Each score can link to one protocol.

### 2.5 Touchpoint-Centric Relationships

**Touchpoint → Protocol (N:1)**  
Each touchpoint belongs to one protocol. Protocols have multiple touchpoints.

**Touchpoint → Partners (N:M)**  
Each touchpoint can be assigned to multiple partners. Each partner has multiple assigned touchpoints. Junction table: `partnerTouchpoints`.

**Touchpoint → Questionnaires (1:N)**  
Each touchpoint can have multiple questionnaires (versions over time). Each questionnaire belongs to one touchpoint.

**Touchpoint → Documents (1:N)**  
Each touchpoint can have multiple supporting documents. Each document can link to one touchpoint.

**Touchpoint → DeadlineExtensions (1:N)**  
Each touchpoint can have multiple deadline extension requests. Each extension request belongs to one touchpoint.

### 2.6 Questionnaire-Centric Relationships

**Questionnaire → Touchpoint (N:1)**  
Each questionnaire belongs to one touchpoint. Touchpoints can have multiple questionnaires.

**Questionnaire → Partner (N:1)**  
Each questionnaire is assigned to one partner. Partners can have multiple questionnaires.

**Questionnaire → QuestionnaireResponses (1:N)**  
Each questionnaire can have multiple response submissions (versions/revisions). Each response belongs to one questionnaire.

**Questionnaire → Documents (1:N)**  
Each questionnaire can have multiple supporting documents uploaded. Each document can link to one questionnaire.

**Questionnaire → DeadlineExtensions (1:N)**  
Each questionnaire can have multiple deadline extension requests. Each extension request can link to one questionnaire.

### 2.7 Document-Centric Relationships

**Document → Partner (N:1)**  
Each document is uploaded by one partner. Partners can upload multiple documents.

**Document → Touchpoint (N:1, optional)**  
Each document can be associated with one touchpoint. Touchpoints can have multiple documents.

**Document → Questionnaire (N:1, optional)**  
Each document can be associated with one questionnaire. Questionnaires can have multiple documents.

**Document → User (reviewer) (N:1, optional)**  
Each document can be reviewed by one user. Users can review multiple documents.

---

## 3. Business Rules

### 3.1 Partner Access Control

- Partners can only access their own data (questionnaires, documents, scores)
- Partners cannot view other partners' information
- Partners cannot modify approved documents or questionnaires
- Partners can request deadline extensions but cannot self-approve

### 3.2 Enterprise User Access Control

- Enterprise users can only access partners assigned to their enterprise
- Enterprise admins can approve/reject documents and questionnaires
- Enterprise users (non-admin) can view but not approve
- Enterprise users cannot access other enterprises' data

### 3.3 Intelleges Admin Access Control

- Intelleges admins have full platform access
- Intelleges admins can manage all partners and enterprises
- Intelleges admins can configure protocols and touchpoints
- Intelleges admins can override auto-approval rules

### 3.4 Compliance Scoring Rules

- Scores recalculated when questionnaires submitted
- Scores recalculated when documents approved/rejected
- Scores recalculated when documents expire
- Critical touchpoints have 2× weight in scoring
- Overdue items reduce score by 10% per week overdue

### 3.5 Deadline Management Rules

- Questionnaire deadlines set based on touchpoint due dates
- Extension requests ≤7 days auto-approved (if eligible)
- Extension requests >7 days require manual approval
- Maximum 2 extensions per questionnaire
- Overdue items trigger escalation notifications

### 3.6 Document Expiration Rules

- Documents with expiration dates tracked automatically
- Reminders sent 90, 60, 30 days before expiration
- Expired documents change status to `expired`
- Expired documents reduce compliance score
- Partners notified immediately upon expiration

### 3.7 Communication Rules

- Email is default notification channel
- WhatsApp requires opt-in from partner
- Critical notifications sent via both channels
- Partners can reply to WhatsApp messages
- Email bounces trigger fallback to WhatsApp

---

## 4. Data Integrity Constraints

### 4.1 Referential Integrity

All foreign key relationships enforce referential integrity:
- Cascade delete for dependent entities (e.g., deleting partner deletes their questionnaires)
- Restrict delete for referenced entities (e.g., cannot delete protocol if touchpoints exist)
- Set null for optional relationships (e.g., deleting reviewer user sets `reviewedByUserId` to null)

### 4.2 Unique Constraints

- `users.openId` - Unique per user
- `partners.accessCode` - Unique per partner
- `enterprises.domain` - Unique per enterprise
- `protocols.code` - Unique per protocol
- `touchpoints.code` - Unique within protocol

### 4.3 Check Constraints

- `complianceScores.score` - Between 0 and 100
- `complianceScores.percentComplete` - Between 0 and 100
- `touchpoints.weight` - Between 0 and 100
- `deadlineExtensions.daysRequested` - Greater than 0
- `documents.fileSizeBytes` - Less than 50MB

### 4.4 Not Null Constraints

Critical fields that cannot be null:
- All primary keys
- All foreign keys (unless explicitly optional)
- `users.openId`, `users.email`, `users.role`
- `partners.name`, `partners.accessCode`
- `questionnaires.status`, `questionnaires.dueDate`
- `documents.fileKey`, `documents.fileUrl`

---

## 5. Indexes and Performance

### 5.1 Primary Key Indexes

All tables have clustered indexes on primary key (`id`).

### 5.2 Foreign Key Indexes

All foreign key columns have non-clustered indexes for join performance.

### 5.3 Query Optimization Indexes

**Partners:**
- Index on `accessCode` for login lookups
- Index on `assignedEnterpriseId` for enterprise filtering
- Index on `status` for active partner queries

**Questionnaires:**
- Index on `partnerId` + `status` for partner dashboard
- Index on `dueDate` for deadline reminders
- Index on `touchpointId` for touchpoint reporting

**Documents:**
- Index on `partnerId` + `status` for partner document list
- Index on `expiresAt` for expiration tracking
- Index on `touchpointId` for touchpoint documents

**ComplianceScores:**
- Index on `partnerId` + `scoreType` for partner scores
- Index on `enterpriseId` + `calculatedAt` for enterprise reporting
- Index on `status` for compliance dashboard

**AuditLogs:**
- Index on `userId` + `timestamp` for user activity
- Index on `entityType` + `entityId` for entity history
- Index on `timestamp` for chronological queries

---

## 6. Data Archival Strategy

### 6.1 Soft Delete

Entities use soft delete (isActive flag) rather than hard delete:
- Partners, Enterprises, Users, Protocols, Touchpoints
- Allows historical reporting and audit trail preservation

### 6.2 Hard Delete

Entities that can be hard deleted:
- Draft questionnaires (before sending)
- Pending documents (before review)
- Cancelled extension requests

### 6.3 Archival Schedule

- Completed questionnaires: Archive after 7 years
- Approved documents: Archive after 7 years
- Audit logs: Archive after 7 years (regulatory requirement)
- Email/WhatsApp logs: Archive after 3 years

---

## Document Maintenance

**Version Control:** All schema changes tracked in Drizzle migrations with rollback capability.

**Review Schedule:**
- Quarterly: Review business rules and constraints
- Semi-annually: Review indexes and performance
- Annually: Comprehensive schema review

---

**Document Classification:** Internal Use Only

**End of Document**
