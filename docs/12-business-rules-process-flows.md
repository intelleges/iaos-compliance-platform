# 12-Business Rules & Process Flows
## Federal Compliance Management Platform

**Document Version:** 1.0  
**Last Updated:** November 27, 2025  
**Author:** Manus AI  
**Status:** Production

---

## Table of Contents

1. [Overview](#overview)
2. [Compliance Status State Machine](#compliance-status-state-machine)
3. [Scorecard Calculation Rules](#scorecard-calculation-rules)
4. [Deadline & Reminder Rules](#deadline--reminder-rules)
5. [Approval Workflows](#approval-workflows)
6. [Alert & Notification Triggers](#alert--notification-triggers)
7. [Data Validation Rules](#data-validation-rules)
8. [Aggregation Logic](#aggregation-logic)
9. [eSRS Socioeconomic Rules](#esrs-socioeconomic-rules)
10. [Role-Based Business Rules](#role-based-business-rules)

---

## Overview

This document defines the core business logic that governs the federal compliance management platform. These rules determine how compliance status is calculated, when notifications are sent, what constitutes completion, and how data flows through the system from partner questionnaires to enterprise-wide compliance scorecards.

### Business Rule Categories

The platform implements four categories of business rules that work together to ensure compliance tracking accuracy and operational efficiency:

**Status Transition Rules** govern how compliance records move through their lifecycle from initial invitation to final confirmation. These rules ensure that only authorized users can perform specific transitions and that all required data is present before advancing to the next stage.

**Calculation Rules** define how numerical metrics are computed, including completion percentages, compliance health scores, and aggregate statistics. These calculations must be deterministic and auditable, producing the same result when given the same input data.

**Temporal Rules** control time-based behaviors such as deadline enforcement, reminder scheduling, and automatic escalations. These rules ensure that stakeholders receive timely notifications and that overdue items are properly flagged.

**Validation Rules** enforce data quality standards by rejecting invalid inputs, requiring specific field combinations, and maintaining referential integrity across related records.

### Core Principles

All business rules adhere to these foundational principles to maintain system integrity and user trust:

**Auditability** — Every status change, calculation, and decision is logged with timestamp, user identity, and reason. This audit trail enables compliance verification and troubleshooting.

**Determinism** — Given the same input data, the system always produces the same output. No randomness or time-dependent behavior affects core calculations.

**Idempotency** — Repeated execution of the same operation produces the same result. For example, recalculating a compliance score multiple times yields identical values.

**Fail-Safe Defaults** — When data is missing or ambiguous, the system defaults to the most conservative interpretation. For example, missing questionnaire responses are treated as "incomplete" rather than "not applicable."

---

## Compliance Status State Machine

The compliance status state machine defines all possible states for a partner questionnaire and the allowed transitions between them. This state machine ensures consistent status progression and prevents invalid state combinations.

### Status Definitions

The platform uses an 8-status model that maps to the compliance scorecard grid (G/U/R/C/N/R/R/I/R/C/T):

| Status Code | Status Name | Display Label | Description | Color |
|-------------|-------------|---------------|-------------|-------|
| **G** | Goal | Goal | Target number of partners expected to complete | Gray |
| **U** | Unconfirmed | Unconfirmed | Questionnaire sent but not yet started | Yellow |
| **R** | Reviewing | Reviewing | Questionnaire in progress, incomplete | Yellow |
| **C** | Confirmed | Confirmed | Questionnaire complete, pending admin review | Yellow |
| **N/R** | No Response | No Response | Deadline passed, no submission received | Red |
| **R/I** | Reviewing Incomplete | Reviewing - Incomplete | Under admin review, missing required information | Red |
| **R/C** | Reviewing Complete | Reviewing - Complete | Under admin review, all information provided | Blue |
| **T** | Total Sent | Total Sent | Count of all questionnaires distributed | Gray |

### State Transition Diagram

The following state transitions are permitted based on user role and questionnaire completion status:

```
[Initial State]
     |
     v
  [Goal (G)] ──────────────────────────────────────────────────────┐
     |                                                               |
     | (Questionnaire Created & Sent)                               |
     v                                                               |
[Unconfirmed (U)] ─────────────────────────────────────────────────┤
     |                                                               |
     | (Partner Starts Questionnaire)                               |
     v                                                               |
[Reviewing (R)] ───────────────────────────────────────────────────┤
     |                          |                                    |
     | (All Required            | (Deadline Passed,                 |
     |  Questions Answered)     |  No Submission)                   |
     v                          v                                    |
[Confirmed (C)]          [No Response (N/R)]                        |
     |                          |                                    |
     | (Admin Reviews)          | (Partner Submits Late)            |
     v                          v                                    |
[R/I or R/C] ────────────> [Reviewing (R)] ────────────────────────┤
     |                                                               |
     | (Admin Approves)                                             |
     v                                                               |
[Approved/Complete] ──────────────────────────────────────────────> [Total Sent (T)]
```

### Transition Rules

Each state transition has specific conditions that must be met before execution:

#### Unconfirmed → Reviewing

**Trigger:** Partner clicks "Start Questionnaire" or answers first question  
**Conditions:**
- Partner must be authenticated with valid access code
- Questionnaire must not be in "Locked" or "Archived" status
- Current timestamp must be before deadline (or grace period if configured)

**Actions:**
- Set `status = 'Reviewing'`
- Set `startedAt = NOW()`
- Log audit entry: `"Partner started questionnaire"`
- Send notification to admin (if configured): "Partner [Name] has started questionnaire"

#### Reviewing → Confirmed

**Trigger:** Partner clicks "Submit Questionnaire"  
**Conditions:**
- All required questions must have responses
- All required documents must be uploaded
- Completion percentage must be 100%
- Partner must confirm accuracy of responses

**Actions:**
- Set `status = 'Confirmed'`
- Set `submittedAt = NOW()`
- Calculate completion percentage (should be 100%)
- Log audit entry: `"Partner submitted questionnaire"`
- Send confirmation email to partner
- Send notification to admin: "New submission from [Partner Name]"

#### Reviewing → No Response (Automatic)

**Trigger:** Scheduled job runs daily at 00:00 UTC  
**Conditions:**
- Current date > deadline date
- Status is still 'Unconfirmed' or 'Reviewing'
- Completion percentage < 100%
- No grace period configured, or grace period has expired

**Actions:**
- Set `status = 'No Response'`
- Set `overdueAt = NOW()`
- Log audit entry: `"Questionnaire marked overdue - no response by deadline"`
- Send overdue notification to partner
- Send escalation notification to admin
- Increment `overdueCount` for partner

#### Confirmed → Reviewing/Incomplete (Admin Action)

**Trigger:** Admin clicks "Request More Information"  
**Conditions:**
- Current user has 'admin' role
- Status is 'Confirmed' or 'Reviewing Complete'
- Admin provides reason for request

**Actions:**
- Set `status = 'Reviewing Incomplete'`
- Set `requestedInfoAt = NOW()`
- Set `requestedBy = adminUserId`
- Set `requestReason = adminComment`
- Log audit entry: `"Admin requested additional information: [reason]"`
- Send notification to partner: "Additional information required for [touchpoint]"
- Add comment to questionnaire history

#### Confirmed → Reviewing/Complete (Admin Action)

**Trigger:** Admin clicks "Mark as Complete"  
**Conditions:**
- Current user has 'admin' role
- Status is 'Confirmed'
- All required information is present
- All documents are valid and not expired

**Actions:**
- Set `status = 'Reviewing Complete'`
- Set `reviewedAt = NOW()`
- Set `reviewedBy = adminUserId`
- Log audit entry: `"Admin marked questionnaire as complete"`
- Update compliance scorecard
- Send notification to partner: "Your questionnaire has been approved"

#### No Response → Reviewing (Late Submission)

**Trigger:** Partner submits questionnaire after deadline  
**Conditions:**
- Partner is authenticated
- Late submissions are allowed (configured per touchpoint)
- Questionnaire is not locked by admin

**Actions:**
- Set `status = 'Reviewing'`
- Set `lateSubmission = true`
- Set `submittedAt = NOW()`
- Log audit entry: `"Late submission received"`
- Send notification to admin: "Late submission from [Partner Name]"
- Flag questionnaire for admin review

---

## Scorecard Calculation Rules

The compliance scorecard displays an 8-column grid showing the distribution of partners across compliance statuses. Accurate calculation of these numbers is critical for enterprise-wide compliance visibility.

### Scorecard Structure

Each row in the scorecard represents a **Group** (e.g., CME, CMO, CMY, CNO, COV, CSP, NEW_HOPE, ROCHESTER). Each column represents a **Status** (G, U, R, C, N/R, R/I, R/C, T). The intersection shows the count of partners in that group with that status.

### Calculation Formulas

#### Goal (G) Column

The Goal column represents the target number of partners expected to complete the questionnaire for a given touchpoint.

**Formula:**
```
G = COUNT(DISTINCT partner_id)
WHERE pptq.touchpoint = [selected_touchpoint]
  AND pptq.group = [current_group]
  AND pptq.status IN ('Unconfirmed', 'Reviewing', 'Confirmed', 'No Response', 'R/I', 'R/C', 'Approved')
```

**Business Rule:** The Goal count includes all partners who have been assigned the questionnaire, regardless of their current completion status. This represents the denominator for completion percentage calculations.

#### Unconfirmed (U) Column

Partners who have been sent the questionnaire but have not yet started.

**Formula:**
```
U = COUNT(DISTINCT partner_id)
WHERE pptq.touchpoint = [selected_touchpoint]
  AND pptq.group = [current_group]
  AND pptq.status = 'Unconfirmed'
  AND pptq.startedAt IS NULL
```

**Business Rule:** A questionnaire remains "Unconfirmed" until the partner clicks "Start" or answers the first question. Simply viewing the questionnaire does not change the status.

#### Reviewing (R) Column

Partners who have started the questionnaire but have not yet submitted.

**Formula:**
```
R = COUNT(DISTINCT partner_id)
WHERE pptq.touchpoint = [selected_touchpoint]
  AND pptq.group = [current_group]
  AND pptq.status = 'Reviewing'
  AND pptq.startedAt IS NOT NULL
  AND pptq.submittedAt IS NULL
  AND pptq.completionPercent < 100
```

**Business Rule:** Completion percentage is calculated in real-time as partners answer questions. A questionnaire moves to "Confirmed" only when completion reaches 100% AND the partner clicks "Submit."

#### Confirmed (C) Column

Partners who have submitted complete questionnaires pending admin review.

**Formula:**
```
C = COUNT(DISTINCT partner_id)
WHERE pptq.touchpoint = [selected_touchpoint]
  AND pptq.group = [current_group]
  AND pptq.status = 'Confirmed'
  AND pptq.submittedAt IS NOT NULL
  AND pptq.completionPercent = 100
  AND pptq.reviewedAt IS NULL
```

**Business Rule:** "Confirmed" is a temporary state indicating the partner has done their part but admin review is pending. This state should be processed promptly to avoid bottlenecks.

#### No Response (N/R) Column

Partners who did not submit by the deadline.

**Formula:**
```
N/R = COUNT(DISTINCT partner_id)
WHERE pptq.touchpoint = [selected_touchpoint]
  AND pptq.group = [current_group]
  AND pptq.status = 'No Response'
  AND pptq.dueDate < CURRENT_DATE
  AND pptq.submittedAt IS NULL
```

**Business Rule:** The system automatically marks questionnaires as "No Response" at 00:00 UTC on the day after the deadline. Grace periods (if configured) delay this transition.

#### Reviewing Incomplete (R/I) Column

Questionnaires under admin review that are missing required information.

**Formula:**
```
R/I = COUNT(DISTINCT partner_id)
WHERE pptq.touchpoint = [selected_touchpoint]
  AND pptq.group = [current_group]
  AND pptq.status = 'Reviewing Incomplete'
  AND pptq.reviewedBy IS NOT NULL
  AND pptq.requestedInfoAt IS NOT NULL
```

**Business Rule:** Admin must provide a reason when marking a questionnaire as "Reviewing Incomplete." This reason is communicated to the partner to guide their response.

#### Reviewing Complete (R/C) Column

Questionnaires under admin review that have all required information.

**Formula:**
```
R/C = COUNT(DISTINCT partner_id)
WHERE pptq.touchpoint = [selected_touchpoint]
  AND pptq.group = [current_group]
  AND pptq.status = 'Reviewing Complete'
  AND pptq.reviewedAt IS NOT NULL
  AND pptq.completionPercent = 100
```

**Business Rule:** "Reviewing Complete" indicates the questionnaire is ready for final approval. This is the last step before marking the partner as fully compliant.

#### Total Sent (T) Column

Total number of questionnaires sent to partners in the group.

**Formula:**
```
T = G (Goal count)
```

**Business Rule:** Total Sent equals Goal because every partner in the goal set receives a questionnaire. This column provides a quick reference for the denominator in completion calculations.

### Completion Percentage Calculation

The overall completion percentage shown at the enterprise level is calculated as:

**Formula:**
```
Completion % = (R/C + Approved) / G × 100
```

Where:
- **R/C** = Count of partners in "Reviewing Complete" status
- **Approved** = Count of partners in final "Approved" status
- **G** = Total goal (all partners assigned the questionnaire)

**Example from Dashboard:**
```
66% Complete (1917/2922)
```

This means:
- 1917 partners have reached "Reviewing Complete" or "Approved" status
- 2922 partners were assigned the questionnaire (Goal)
- 1917 ÷ 2922 = 0.6562 = 66%

### Group-Level Completion Percentage

Each group displays its own completion percentage calculated independently:

**Formula:**
```
Group Completion % = (R/C_group + Approved_group) / G_group × 100
```

**Example from Dashboard:**
```
ROCHESTER: 53% (NEEDS ATTENTION - Lowest Completion)
```

This indicates:
- ROCHESTER group has only 53% completion
- This is the lowest among all groups
- System flags this group for admin attention

### Compliance Health Indicator

The dashboard shows an emoji-based health indicator based on completion percentage:

| Completion % | Health Status | Emoji | Color |
|--------------|---------------|-------|-------|
| 0-49% | Poor | 😟 | Red |
| 50-74% | Fair | 😐 | Yellow |
| 75-89% | Good | 🙂 | Light Green |
| 90-100% | Excellent | 😊 | Green |

**Business Rule:** Health status is calculated per partner based on their individual completion percentage, not the group average.

---

## Deadline & Reminder Rules

Deadline enforcement and reminder scheduling ensure that partners complete questionnaires on time and that admins are alerted to overdue items.

### Deadline Configuration

Each touchpoint has a configurable deadline that applies to all partners assigned to that touchpoint.

**Deadline Fields:**
- `dueDate` — Hard deadline (DATE)
- `gracePeriodDays` — Optional grace period after deadline (INTEGER, default: 0)
- `effectiveDeadline` — Calculated as `dueDate + gracePeriodDays`

**Business Rule:** Partners can submit questionnaires up to the `effectiveDeadline`. After this date, submissions are marked as "late" and require admin approval.

### Reminder Schedule

The system sends automatic reminders at predefined intervals before the deadline:

| Days Before Deadline | Reminder Type | Channels | Recipient |
|----------------------|---------------|----------|-----------|
| 14 days | Initial Reminder | Email | Partner |
| 7 days | First Warning | Email + WhatsApp | Partner |
| 3 days | Urgent Warning | Email + WhatsApp | Partner |
| 1 day | Final Warning | Email + WhatsApp + SMS | Partner |
| 0 days (deadline) | Deadline Passed | Email | Partner + Admin |
| 1 day overdue | Escalation | Email | Admin + Enterprise User |
| 7 days overdue | Final Escalation | Email | Admin + Enterprise Owner |

**Business Rule:** Reminders are sent at 09:00 local time in the partner's timezone (if configured) or 09:00 UTC if timezone is unknown.

### Reminder Suppression Rules

Reminders are NOT sent if:
- Partner has already submitted the questionnaire (`submittedAt IS NOT NULL`)
- Partner's questionnaire is in "Reviewing Complete" or "Approved" status
- Partner has opted out of reminder emails
- Touchpoint is marked as "Archived" or "Cancelled"
- Partner account is marked as "Inactive"

### Overdue Processing

The system runs a daily job at 00:00 UTC to identify and process overdue questionnaires:

**Overdue Detection Query:**
```sql
SELECT pptq.id, pptq.partner, pptq.touchpoint
FROM partnerPartnertypeTouchpointQuestionnaire pptq
WHERE pptq.dueDate + COALESCE(pptq.gracePeriodDays, 0) < CURRENT_DATE
  AND pptq.status IN ('Unconfirmed', 'Reviewing')
  AND pptq.submittedAt IS NULL
```

**Actions for Each Overdue Questionnaire:**
1. Set `status = 'No Response'`
2. Set `overdueAt = NOW()`
3. Increment `overdueCount` for partner
4. Send overdue notification to partner
5. Send escalation notification to admin
6. Log audit entry

---

## Approval Workflows

Approval workflows define who can approve questionnaires and under what conditions.

### Approval Levels

The platform supports three approval levels:

| Level | Role Required | Scope | Description |
|-------|---------------|-------|-------------|
| **L1** | Enterprise User | Group-specific | Can approve questionnaires for partners in their assigned groups |
| **L2** | Intelleges Admin | Enterprise-wide | Can approve any questionnaire across all enterprises |
| **L3** | System Admin | Platform-wide | Can override any approval and modify system rules |

### Approval Conditions

Before a questionnaire can be approved, the following conditions must be met:

**Data Completeness:**
- All required questions have valid responses
- All required documents are uploaded and not expired
- All validation rules pass (see Data Validation Rules section)

**Review Completeness:**
- Admin has reviewed all responses
- Any flagged items have been resolved
- Any requested additional information has been provided

**Authorization:**
- Approving user has appropriate role (L1, L2, or L3)
- Approving user has access to the partner's enterprise (for L1 users)
- Approving user is not the same person who submitted the questionnaire (separation of duties)

### Approval Process

**Step 1: Initial Review**
- Admin opens submitted questionnaire
- System displays all responses, documents, and calculated scores
- Admin can add comments, request more information, or proceed to approval

**Step 2: Validation Check**
- System runs all validation rules
- Any failures are displayed to admin with explanations
- Admin must resolve all validation errors before approval

**Step 3: Approval Decision**
- Admin clicks "Approve" or "Request More Information"
- If "Approve": questionnaire moves to "Reviewing Complete" status
- If "Request More Information": questionnaire moves to "Reviewing Incomplete" and partner is notified

**Step 4: Final Confirmation**
- For high-risk questionnaires (configurable), a second admin must confirm approval
- System logs approval with timestamp, user ID, and any comments
- Partner receives approval notification

### Bulk Approval

Admins can approve multiple questionnaires simultaneously if:
- All selected questionnaires pass validation
- All are from the same touchpoint
- Admin has approval authority for all selected partners
- No questionnaires require additional information

**Business Rule:** Bulk approval is limited to 100 questionnaires per operation to prevent accidental mass approvals.

---

## Alert & Notification Triggers

The platform sends automated alerts and notifications based on specific trigger conditions.

### Alert Categories

| Category | Priority | Channels | Recipient |
|----------|----------|----------|-----------|
| Deadline Approaching | Medium | Email, WhatsApp | Partner |
| Deadline Passed | High | Email, WhatsApp, SMS | Partner, Admin |
| New Submission | Medium | Email | Admin |
| Approval Required | Medium | Email | Admin |
| Document Expiring | High | Email, WhatsApp | Partner, Admin |
| Compliance Score Drop | High | Email | Admin, Enterprise User |
| System Error | Critical | Email, SMS | System Admin |

### Trigger Conditions

#### Deadline Approaching Alert

**Trigger:** Daily job at 09:00 UTC  
**Condition:**
```sql
dueDate - CURRENT_DATE IN (14, 7, 3, 1)
AND status IN ('Unconfirmed', 'Reviewing')
AND completionPercent < 100
```

**Notification:**
- **To:** Partner email + WhatsApp (if available)
- **Subject:** "Compliance Deadline: [X] Days Remaining"
- **Content:** Touchpoint name, due date, completion percentage, dashboard link

#### New Submission Alert

**Trigger:** Partner clicks "Submit Questionnaire"  
**Condition:**
```
status changed from 'Reviewing' to 'Confirmed'
AND submittedAt IS NOT NULL
```

**Notification:**
- **To:** Admin email
- **Subject:** "New Submission: [Partner Name] - [Touchpoint Name]"
- **Content:** Partner name, submission time, completion percentage, review link

#### Document Expiring Alert

**Trigger:** Daily job at 09:00 UTC  
**Condition:**
```sql
document.expirationDate - CURRENT_DATE IN (30, 14, 7, 1)
AND document.status = 'Valid'
```

**Notification:**
- **To:** Partner email + WhatsApp
- **Subject:** "Document Expiring Soon: [Document Type]"
- **Content:** Document name, expiration date, upload link

#### Compliance Score Drop Alert

**Trigger:** Scorecard recalculation  
**Condition:**
```
previousCompletionPercent - currentCompletionPercent >= 5
AND currentCompletionPercent < 75
```

**Notification:**
- **To:** Admin email + Enterprise User email
- **Subject:** "Compliance Alert: Score Dropped to [X]%"
- **Content:** Previous score, current score, affected groups, action items

### Notification Throttling

To prevent notification fatigue, the system implements throttling rules:

**Per-Partner Throttling:**
- Maximum 1 reminder per day per touchpoint
- Maximum 3 total notifications per day across all touchpoints
- No notifications between 22:00 and 08:00 local time (quiet hours)

**Per-Admin Throttling:**
- Batch multiple "New Submission" alerts into hourly digest
- Maximum 1 "Compliance Score Drop" alert per day per enterprise
- Critical alerts bypass throttling

---

## Data Validation Rules

Data validation ensures that questionnaire responses meet quality and completeness standards before approval.

### Question-Level Validation

Each question type has specific validation rules:

| Question Type | Validation Rules |
|---------------|------------------|
| **Text** | Min length, max length, regex pattern (if specified) |
| **Number** | Min value, max value, decimal places |
| **Date** | Valid date format, min date, max date, not in future (if specified) |
| **Email** | Valid email format, domain whitelist (if specified) |
| **Phone** | Valid E.164 format, country code required |
| **URL** | Valid URL format, HTTPS required (if specified) |
| **Single Choice** | One option selected from allowed list |
| **Multiple Choice** | At least one option selected, max selections enforced |
| **File Upload** | File size < 10MB, allowed MIME types, virus scan passed |

### Questionnaire-Level Validation

Before a questionnaire can be submitted:

**Completeness Check:**
```
All required questions have responses
AND All required documents are uploaded
AND completionPercent = 100
```

**Consistency Check:**
```
IF businessSize = 'Small Business'
THEN minorityOwned OR womenOwned OR veteranOwned MUST be answered
```

**Cross-Field Validation:**
```
IF certificationExpired = 'Yes'
THEN newCertificationUploadDate MUST be within 30 days
```

### Document Validation

Uploaded documents must pass these checks:

**File Validation:**
- File size ≤ 10MB
- MIME type in allowed list: `application/pdf`, `image/jpeg`, `image/png`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Virus scan passed (via ClamAV or similar)
- File is not password-protected

**Content Validation:**
- Document is readable (not corrupted)
- Document contains text (not blank)
- Document date is within acceptable range (if applicable)

**Expiration Validation:**
- If document has expiration date, it must be > 30 days in the future
- If document is expired, partner must upload replacement

---

## Aggregation Logic

Aggregation rules define how partner-level data rolls up to group, enterprise, and platform levels.

### Partner → Group Aggregation

Each group's metrics are calculated by aggregating all partners assigned to that group:

**Group Completion Percentage:**
```sql
SELECT 
  g.id,
  g.name,
  COUNT(DISTINCT CASE WHEN pptq.status IN ('R/C', 'Approved') THEN pptq.partner END) AS completed,
  COUNT(DISTINCT pptq.partner) AS total,
  ROUND(COUNT(DISTINCT CASE WHEN pptq.status IN ('R/C', 'Approved') THEN pptq.partner END) * 100.0 / 
        COUNT(DISTINCT pptq.partner), 1) AS completionPercent
FROM [group] g
INNER JOIN pptqGroup pg ON pg.group = g.id
INNER JOIN partnerPartnertypeTouchpointQuestionnaire pptq ON pptq.id = pg.pptq
WHERE pptq.touchpoint = [selected_touchpoint]
GROUP BY g.id, g.name
```

**Group Status Distribution:**
```sql
SELECT 
  g.name,
  SUM(CASE WHEN pptq.status = 'Unconfirmed' THEN 1 ELSE 0 END) AS U,
  SUM(CASE WHEN pptq.status = 'Reviewing' THEN 1 ELSE 0 END) AS R,
  SUM(CASE WHEN pptq.status = 'Confirmed' THEN 1 ELSE 0 END) AS C,
  SUM(CASE WHEN pptq.status = 'No Response' THEN 1 ELSE 0 END) AS NR,
  SUM(CASE WHEN pptq.status = 'Reviewing Incomplete' THEN 1 ELSE 0 END) AS RI,
  SUM(CASE WHEN pptq.status = 'Reviewing Complete' THEN 1 ELSE 0 END) AS RC
FROM [group] g
INNER JOIN pptqGroup pg ON pg.group = g.id
INNER JOIN partnerPartnertypeTouchpointQuestionnaire pptq ON pptq.id = pg.pptq
WHERE pptq.touchpoint = [selected_touchpoint]
GROUP BY g.name
```

### Group → Enterprise Aggregation

Enterprise-level metrics aggregate all groups within the enterprise:

**Enterprise Completion Percentage:**
```sql
SELECT 
  e.id,
  e.name,
  COUNT(DISTINCT CASE WHEN pptq.status IN ('R/C', 'Approved') THEN pptq.partner END) AS completed,
  COUNT(DISTINCT pptq.partner) AS total,
  ROUND(COUNT(DISTINCT CASE WHEN pptq.status IN ('R/C', 'Approved') THEN pptq.partner END) * 100.0 / 
        COUNT(DISTINCT pptq.partner), 1) AS completionPercent
FROM enterprise e
INNER JOIN partner p ON p.enterprise = e.id
INNER JOIN partnerPartnertypeTouchpointQuestionnaire pptq ON pptq.partner = p.id
WHERE pptq.touchpoint = [selected_touchpoint]
GROUP BY e.id, e.name
```

**Enterprise Totals (Bottom Row of Dashboard):**
```
ENTERPRISE TOTALS (8 Groups)
66% Complete
PRE-INVITE: U: 0  R: 9  C: 903
POST-INVITE: N/R: 284  R/I: 721  R/C: 1917
T: 2922
```

### Aggregation Rules

**Rule 1: No Double Counting**
- Each partner is counted exactly once per status
- Partners in multiple groups are counted in each group separately
- Enterprise totals use `DISTINCT partner_id` to prevent double counting

**Rule 2: Real-Time Updates**
- Aggregations are recalculated whenever a partner's status changes
- Cached values are invalidated immediately
- Dashboard displays real-time data (no batch processing delay)

**Rule 3: Historical Tracking**
- Daily snapshots of aggregated metrics are stored for trend analysis
- Historical data is never modified (append-only)
- Reports can show compliance trends over time

---

## eSRS Socioeconomic Rules

The eSRS (Electronic Subcontracting Reporting System) tracks socioeconomic classifications for federal compliance reporting.

### Socioeconomic Categories

Partners are classified into six socioeconomic categories based on questionnaire responses:

| Category | Question ID | Response = "Yes" | Bit Position | Decimal Value |
|----------|-------------|------------------|--------------|---------------|
| **L** (Large Business) | 1007 | "Large Business" | 0 | 32 |
| **S** (Small Business) | 1007 | "Small Business" | 1 | 16 |
| **SDB** (Small Disadvantaged) | 1012 | "Yes" | 2 | 8 |
| **WOSB** (Woman-Owned) | 1014 | "Yes" | 3 | 4 |
| **VOSB** (Veteran-Owned) | 1009 | "Yes" | 4 | 2 |
| **DVOSB** (Disabled Veteran) | 1010 | "Yes" | 5 | 1 |

### Z-Code Calculation

The Z-Code is a 6-bit binary string representing the partner's socioeconomic status:

**Binary Format:** `L S SDB WOSB VOSB DVOSB`

**Example Calculations:**

| Scenario | Binary | Decimal | Interpretation |
|----------|--------|---------|----------------|
| Large Business only | 100000 | 32 | Large, no special categories |
| Small Business only | 010000 | 16 | Small, no special categories |
| Small + SDB | 011000 | 24 | Small Disadvantaged Business |
| Small + WOSB + VOSB | 010110 | 22 | Small, Woman-Owned, Veteran-Owned |
| Small + All Categories | 011111 | 31 | Small with all special designations |

**Business Rule:** A partner cannot be both Large (L) and Small (S). If both are marked "Yes" in the questionnaire, the system flags this as a validation error.

### eSRS Reporting Rules

**Inclusion Criteria:**
- Partner must have completed questionnaire (status = 'R/C' or 'Approved')
- All socioeconomic questions (1007, 1009, 1010, 1012, 1014) must be answered
- Questionnaire must be for the selected touchpoint (e.g., "Annual Reps & Certs 2025")

**Exclusion Criteria:**
- Partners with incomplete questionnaires are excluded from eSRS reports
- Partners who answered "Prefer not to answer" are excluded
- Partners with invalid combinations (e.g., both L and S) are flagged for admin review

**Small Business Participation Calculation:**
```
Small Business % = (S + SDB + WOSB + VOSB + DVOSB) / Total Partners × 100
```

**Example from Dashboard:**
```
Small Business Participation: 71% (2168 of 3071 total subcontractors)
```

This means:
- 2168 partners are classified as Small Business or have special designations
- 3071 partners total have completed the questionnaire
- 2168 ÷ 3071 = 0.7058 = 71%

### eSRS Export Rules

**CSV Export Format:**
```
Internal ID,Decimal,Binary,L,S,SDB,WOSB,VOSB,DVOSB,Partner Name,Group Name
SUP-001,22,010110,0,1,0,1,1,0,Acme Corp,CMY
SUP-002,24,011000,0,1,1,0,0,0,Beta LLC,CME
```

**Excel Export Rules:**
- Color coding: SDB (red), WOSB (yellow), VOSB/DVOSB (blue)
- Bit position legend included in header
- Summary statistics at bottom
- Timestamp in filename: `zcode-export-2025-11-27T12-30-00.xlsx`

---

## Role-Based Business Rules

Different user roles have different permissions and see different data views.

### Role Definitions

| Role | Access Level | Capabilities |
|------|--------------|--------------|
| **Supplier** | Partner-specific | View own questionnaires, submit responses, upload documents |
| **Enterprise User** | Enterprise-specific | View all partners in assigned enterprise, generate reports |
| **Intelleges Admin** | Platform-wide | Manage all enterprises, approve questionnaires, configure touchpoints |
| **System Admin** | Platform-wide | All admin capabilities + system configuration, user management |

### Data Access Rules

**Supplier Role:**
- Can view only their own questionnaires
- Can view only their own documents
- Can view only their own compliance status
- Cannot view other partners' data
- Cannot view aggregate statistics

**Enterprise User Role:**
- Can view all partners in their assigned enterprise(s)
- Can view aggregate statistics for their enterprise
- Can generate reports for their enterprise
- Cannot view partners from other enterprises
- Cannot approve questionnaires (read-only)

**Intelleges Admin Role:**
- Can view all partners across all enterprises
- Can approve questionnaires for any partner
- Can configure touchpoints and deadlines
- Can generate platform-wide reports
- Can manage groups and assignments

**System Admin Role:**
- All Intelleges Admin capabilities
- Can create/edit/delete users
- Can modify system configuration
- Can access audit logs
- Can override business rules (with audit trail)

### Action Authorization Rules

Before any action is performed, the system checks:

**Authorization Check:**
```typescript
function canPerformAction(user: User, action: string, resource: Resource): boolean {
  // System Admin can do anything
  if (user.role === 'system_admin') return true;
  
  // Intelleges Admin can do most things
  if (user.role === 'intelleges_admin') {
    return action !== 'modify_system_config' && action !== 'manage_users';
  }
  
  // Enterprise User can only view their enterprise
  if (user.role === 'enterprise_user') {
    return action === 'view' && resource.enterprise === user.enterprise;
  }
  
  // Supplier can only view/edit their own data
  if (user.role === 'supplier') {
    return resource.partnerId === user.partnerId && 
           (action === 'view' || action === 'edit_own_data');
  }
  
  return false;
}
```

---

**Document Status:** Production Ready  
**Next Review:** December 2025  
**Maintained By:** Manus AI

