# Legacy System Analysis - Business Rules Extraction

**Purpose**: Extract proven business logic from 25-year-old ASP.NET MVC system for modern TypeScript/React implementation

**Source**: C# codebase (generic.zip) + SQL Server schema (ha2MVCMTQa2.sql)

**Policy**: Use as REFERENCE ONLY - do not slavishly follow implementation details

---

## 1. Access Code System

### Legacy Implementation (REFERENCE)
```sql
-- pr_getAccesscode stored procedure
-- Format: {sequential_number}{2-letter-code}
-- Example: "12345AB"
SELECT @number = (SELECT Max(number) from numberSeed)
SET @number = @number + 1
SELECT @letter = (SELECT code from letterSeed l inner join numberSeed n on l.id=n.letter)
Select @accesscode = Convert(varchar, @number) + @letter
```

**Business Rules Extracted**:
- ✅ Access codes must be unique per assignment
- ✅ Access codes are generated at assignment creation time
- ✅ Access codes are stored in `partnerPartnertypeTouchpointQuestionnaire.accesscode` field
- ✅ Access codes are used for supplier authentication (no login required)
- ✅ Access codes are included in email invitations

### Modern Implementation (Quick Reference Guide)
```typescript
// 12-character cryptographic random codes
// Character set: A-HJ-NP-Z2-9 (excludes O/0/I/1/L)
// Session: 8 hours max, 1-hour idle timeout
// Single-use: Invalidated on submission

export function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(12);
  return Array.from(bytes)
    .map(byte => chars[byte % chars.length])
    .join('');
}
```

**Why the Change**:
- Legacy: Sequential codes are predictable (security risk)
- Modern: Cryptographic random codes prevent enumeration attacks
- Legacy: 2-letter suffix limits to ~676 combinations
- Modern: 12-character codes provide 32^12 = 1.2 × 10^18 combinations

---

## 2. Assignment Workflow

### Legacy Database Schema (REFERENCE)
```csharp
// partnerPartnertypeTouchpointQuestionnaire.cs
public int id { get; set; }
public int partner { get; set; }  // FK to partner table
public int partnerTypeTouchpointQuestionnaire { get; set; }  // FK to questionnaire
public string accesscode { get; set; }  // Unique access code
public int invitedBy { get; set; }  // Person who sent invitation
public DateTime invitedDate { get; set; }  // When invitation was sent
public Nullable<DateTime> completedDate { get; set; }  // When submitted
public Nullable<int> progress { get; set; }  // Completion percentage
public string zcode { get; set; }  // Socioeconomic classification
public byte[] pdf { get; set; }  // Generated PDF of responses
public string docFolderAddress { get; set; }  // File upload location
public Nullable<decimal> score { get; set; }  // Compliance score
public int status { get; set; }  // FK to partnerStatus
public string loadGroup { get; set; }  // Bulk import batch identifier
public Nullable<DateTime> dueDate { get; set; }  // Deadline
public Nullable<int> priority { get; set; }  // Urgency level
```

**Business Rules Extracted**:
- ✅ One assignment = one partner + one questionnaire + one touchpoint
- ✅ Assignment status lifecycle: PENDING → INVITED → IN_PROGRESS → SUBMITTED
- ✅ Progress tracking (0-100%)
- ✅ Due date enforcement
- ✅ Priority levels (for PO blocking scenarios)
- ✅ Load group for bulk operations tracking
- ✅ PDF generation on submission
- ✅ Document folder for file uploads
- ✅ Z-Code calculation for eSRS reporting

### Modern Implementation
```typescript
// drizzle/schema.ts - partnerQuestionnaires table
export const partnerQuestionnaires = mysqlTable("partnerQuestionnaires", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),  // FK to partners
  questionnaireId: int("questionnaireId").notNull(),  // FK to questionnaires
  touchpointId: int("touchpointId").notNull(),  // FK to touchpoints
  accessCode: varchar("accessCode", { length: 12 }).notNull().unique(),
  invitedBy: int("invitedBy").notNull(),  // FK to users
  invitedDate: timestamp("invitedDate").notNull(),
  completedDate: timestamp("completedDate"),
  progress: int("progress").default(0),
  zCode: varchar("zCode", { length: 500 }),
  pdfUrl: text("pdfUrl"),  // S3 URL instead of BLOB
  docFolderUrl: text("docFolderUrl"),  // S3 folder URL
  score: decimal("score", { precision: 5, scale: 2 }),
  status: mysqlEnum("status", ["PENDING", "INVITED", "IN_PROGRESS", "SUBMITTED", "DELEGATED", "EXPIRED"]).default("PENDING"),
  loadGroup: varchar("loadGroup", { length: 50 }),
  dueDate: timestamp("dueDate"),
  priority: int("priority"),
  enterpriseId: int("enterpriseId").notNull(),  // Multi-tenant isolation
  active: boolean("active").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
```

**Key Differences**:
- ✅ Added `enterpriseId` for multi-tenant isolation
- ✅ Changed `pdf` BLOB to `pdfUrl` (S3 storage)
- ✅ Changed `docFolderAddress` to `docFolderUrl` (S3 storage)
- ✅ Added `active` flag (archive pattern, no hard deletes)
- ✅ Added `createdAt`/`updatedAt` timestamps (audit trail)
- ✅ Changed status from INT to ENUM (type safety)

---

## 3. Assignment Status Reference

### Legacy Status Values (from Quick Reference Guide)
| Status | Indicator | Description |
|--------|-----------|-------------|
| PENDING | Yellow | Created but invitation not yet sent |
| INVITED | Blue | Invitation email sent, awaiting access |
| IN_PROGRESS | Orange | Supplier has accessed and started responding |
| SUBMITTED | Green | Response complete with e-signature |
| DELEGATED | Purple | Forwarded to another contact |
| EXPIRED | Red | Past due date without submission |

**Business Rules Extracted**:
- ✅ Status transitions are sequential (cannot skip states)
- ✅ PENDING → INVITED: When invitation email sent
- ✅ INVITED → IN_PROGRESS: When supplier enters access code
- ✅ IN_PROGRESS → SUBMITTED: When supplier signs and submits
- ✅ IN_PROGRESS → DELEGATED: When supplier forwards to another contact
- ✅ Any status → EXPIRED: When `dueDate < NOW()` and status != SUBMITTED

---

## 4. Questionnaire Builder

### Legacy Question Types (from Quick Reference Guide)
| Type | Input Format | Use Case |
|------|--------------|----------|
| Yes/No | Binary choice (Yes=1, No=2) | Simple compliance attestations |
| Yes/No/NA | Ternary choice (Yes=1, No=2, N/A=3) | Conditional compliance questions |
| List-to-List (Z-Code) | Multi-select with Z-code bitmask | Complex multi-option selections (socioeconomic) |
| Dollar | Numeric currency input | Revenue, contract values |
| Date | Date picker (ISO format) | Certification dates, deadlines |
| Text | Free-form text entry | Explanations, descriptions |
| File | Document upload (PDF, DOC, images) | Certifications, evidence |

**Business Rules Extracted**:
- ✅ Questions belong to questionnaires (1:N relationship)
- ✅ Questions have `qWeight` field for eSRS reporting
- ✅ Questions support skip logic (conditional display)
- ✅ Questions can require comments (`commentType` field)
- ✅ Questions can require file uploads (`uploadType` field)
- ✅ Questions can require due dates (`dueDateType` field)
- ✅ List-to-List questions use Z-Code encoding (bitmask for multi-select)

### Legacy Z-Code Encoding (REFERENCE)
```sql
-- Z-Code is a bitmask where each bit represents a selected option
-- Example: L=1, S=2, SDB=4, WOSB=8, VOSB=16, DVOSB=32, T=64
-- If supplier selects L + SDB + WOSB, Z-Code = 1 + 4 + 8 = 13
```

**Modern Implementation**:
```typescript
// Already implemented in client/src/components/questionnaire/utils.ts
export function encodeZCode(selectedOptions: string[]): number {
  const optionValues: Record<string, number> = {
    'L': 1, 'S': 2, 'SDB': 4, 'WOSB': 8, 'VOSB': 16, 'DVOSB': 32, 'T': 64
  };
  return selectedOptions.reduce((acc, opt) => acc + (optionValues[opt] || 0), 0);
}

export function decodeZCode(zCode: number): string[] {
  const options = [
    { value: 64, label: 'T' },
    { value: 32, label: 'DVOSB' },
    { value: 16, label: 'VOSB' },
    { value: 8, label: 'WOSB' },
    { value: 4, label: 'SDB' },
    { value: 2, label: 'S' },
    { value: 1, label: 'L' }
  ];
  const selected: string[] = [];
  let remaining = zCode;
  for (const opt of options) {
    if (remaining >= opt.value) {
      selected.unshift(opt.label);
      remaining -= opt.value;
    }
  }
  return selected;
}
```

---

## 5. Email Integration (AutoMail System)

### Legacy AutoMail Merge Tags (from Quick Reference Guide)
| Merge Tag | Replaced With |
|-----------|---------------|
| `{{partner.firstName}}` | Supplier contact's first name |
| `{{partner.company}}` | Supplier's company name |
| `{{touchpoint.name}}` | Name of the touchpoint/campaign |
| `{{assignment.dueDate}}` | Questionnaire due date |
| `{{assignment.accessCode}}` | 12-character unique access code |
| `{{assignment.portalUrl}}` | Direct link to supplier portal |
| `{{enterprise.name}}` | Enterprise/prime contractor name |
| `{{questionnaire.name}}` | Name of assigned questionnaire |

**Business Rules Extracted**:
- ✅ Email templates support merge tags for personalization
- ✅ Invitation emails include access code and direct link
- ✅ Reminder emails sent automatically based on due date
- ✅ Confirmation emails sent on submission
- ✅ Email tracking (sent, opened, clicked) via SendGrid webhooks

### Legacy Email Template Example (REFERENCE)
```html
<!-- Invitation Email -->
Dear {{partner.firstName}},

{{enterprise.name}} requires you to complete the {{questionnaire.name}} 
for the {{touchpoint.name}} compliance campaign.

Your unique access code is: {{assignment.accessCode}}

Click here to begin: {{assignment.portalUrl}}

Due date: {{assignment.dueDate}}

Thank you for your cooperation.
```

**Modern Implementation**:
```typescript
// server/services/sendgrid.ts - already implemented
export async function sendInvitationEmail(assignment: Assignment) {
  const mergeData = {
    'partner.firstName': assignment.partner.firstName,
    'partner.company': assignment.partner.name,
    'touchpoint.name': assignment.touchpoint.name,
    'assignment.dueDate': formatDate(assignment.dueDate),
    'assignment.accessCode': assignment.accessCode,
    'assignment.portalUrl': `${process.env.VITE_APP_URL}/supplier/login?code=${assignment.accessCode}`,
    'enterprise.name': assignment.enterprise.name,
    'questionnaire.name': assignment.questionnaire.name,
  };
  
  await sendEmail({
    to: assignment.partner.email,
    templateId: 'invitation_template',
    dynamicTemplateData: mergeData,
  });
}
```

---

## 6. Bulk Import/Export

### Legacy CSV Import Format (INFERRED from schema)
```csv
internalID,dunsNumber,name,address1,city,state,zipcode,country,firstName,lastName,title,phone,email
SUP-001,123456789,Acme Corp,123 Main St,Boston,MA,02101,US,John,Doe,Procurement Manager,555-1234,john@acme.com
SUP-002,987654321,Beta Inc,456 Oak Ave,Cambridge,MA,02139,US,Jane,Smith,Compliance Officer,555-5678,jane@beta.com
```

**Business Rules Extracted**:
- ✅ CSV import creates partners in bulk
- ✅ `loadGroup` field tracks which batch the partner came from
- ✅ Duplicate detection by `internalID` or `dunsNumber`
- ✅ Validation rules: required fields (name, email), format validation (email, phone)
- ✅ Error reporting: invalid rows logged, valid rows imported
- ✅ Assignments created automatically after import (if touchpoint/questionnaire specified)

### Legacy Bulk Assignment Logic (REFERENCE)
```csharp
// PartnerController.cs - bulk assignment creation
var objPartners = db.pr_getPartnerPartnertypeTouchpointQuestionnaireByLoadGroup(group.ToString()).ToList();
int ptq = db.pr_getPartnertypeTouchpointQuestionnaireByPartnertypeAndTouchpoint(partnertype, touchpoint).LastOrDefault().id;
string accessCode = "";
foreach (var partnerItem in objPartners)
{
    var pptq = db.pr_getpartnerPartnertypeTouchpointQuestionnaireByPartnerAndPTQ(partnerItem.partner, ptq).FirstOrDefault();
    accessCode = pptq.accesscode;
    db.pr_modifyPartnerPartnertypeTouchpointQuestionnaireStatus(pptq.id, 6);  // Status 6 = INVITED
}
```

**Modern Implementation**:
```typescript
// server/routers/assignment.ts - bulk create
export const assignmentRouter = router({
  bulkCreate: protectedProcedure
    .input(z.object({
      partnerIds: z.array(z.number()),
      questionnaireId: z.number(),
      touchpointId: z.number(),
      dueDate: z.date(),
      sendInvitations: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const assignments = [];
      for (const partnerId of input.partnerIds) {
        const accessCode = generateAccessCode();
        const assignment = await db.insert(partnerQuestionnaires).values({
          partnerId,
          questionnaireId: input.questionnaireId,
          touchpointId: input.touchpointId,
          accessCode,
          invitedBy: ctx.user.id,
          invitedDate: new Date(),
          dueDate: input.dueDate,
          status: 'PENDING',
          enterpriseId: ctx.user.enterpriseId,
        });
        assignments.push(assignment);
      }
      
      if (input.sendInvitations) {
        for (const assignment of assignments) {
          await sendInvitationEmail(assignment);
          await db.update(partnerQuestionnaires)
            .set({ status: 'INVITED' })
            .where(eq(partnerQuestionnaires.id, assignment.id));
        }
      }
      
      return { created: assignments.length };
    }),
});
```

---

## 7. E-Signature Capture

### Legacy E-Signature Schema (REFERENCE)
```csharp
// eSignature.cs
public int id { get; set; }
public int partnerPartnertypeTouchpointQuestionnaire { get; set; }  // FK to assignment
public string signature { get; set; }  // Base64 encoded signature image
public DateTime signatureDate { get; set; }
public string ipAddress { get; set; }
public string userAgent { get; set; }
public string certificationText { get; set; }  // Legal attestation text
```

**Business Rules Extracted**:
- ✅ E-signature required for submission (FAR compliance)
- ✅ Signature captured as base64 encoded image
- ✅ Audit trail: IP address, user agent, timestamp
- ✅ Certification text displayed before signature
- ✅ One signature per assignment (1:1 relationship)
- ✅ Signature cannot be modified after submission

### FAR-Compliant Certification Text (REFERENCE)
```
I certify that the information provided in this questionnaire is true, 
accurate, and complete to the best of my knowledge. I understand that 
providing false information may result in termination of business 
relationship and potential legal action.

Signature: ________________
Date: ________________
IP Address: ________________
```

**Modern Implementation**:
```typescript
// server/routers/assignment.ts - submit with e-signature
export const assignmentRouter = router({
  submit: protectedProcedure
    .input(z.object({
      assignmentId: z.number(),
      responses: z.array(z.object({
        questionId: z.number(),
        value: z.string(),
      })),
      signature: z.string(),  // Base64 encoded
      certificationAccepted: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate all required questions answered
      // Save responses
      // Create e-signature record
      await db.insert(eSignatures).values({
        assignmentId: input.assignmentId,
        signature: input.signature,
        signatureDate: new Date(),
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers['user-agent'],
        certificationText: CERTIFICATION_TEXT,
      });
      
      // Update assignment status
      await db.update(partnerQuestionnaires)
        .set({ 
          status: 'SUBMITTED',
          completedDate: new Date(),
          progress: 100,
        })
        .where(eq(partnerQuestionnaires.id, input.assignmentId));
      
      // Invalidate access code (single-use)
      // Send confirmation email
      // Trigger event: assignment.submitted
      
      return { success: true };
    }),
});
```

---

## 8. eSRS Reporting

### Legacy Z-Code Calculation (REFERENCE)
```sql
-- view_PartnerSocioeconomicCode
-- Aggregates Z-Code responses by partner and touchpoint
SELECT 
  p.id AS partnerId,
  p.name AS partnerName,
  t.id AS touchpointId,
  t.name AS touchpointName,
  SUM(CASE WHEN r.zcode & 1 = 1 THEN 1 ELSE 0 END) AS isLarge,
  SUM(CASE WHEN r.zcode & 2 = 2 THEN 1 ELSE 0 END) AS isSmall,
  SUM(CASE WHEN r.zcode & 4 = 4 THEN 1 ELSE 0 END) AS isSDB,
  SUM(CASE WHEN r.zcode & 8 = 8 THEN 1 ELSE 0 END) AS isWOSB,
  SUM(CASE WHEN r.zcode & 16 = 16 THEN 1 ELSE 0 END) AS isVOSB,
  SUM(CASE WHEN r.zcode & 32 = 32 THEN 1 ELSE 0 END) AS isDVOSB,
  SUM(CASE WHEN r.zcode & 64 = 64 THEN 1 ELSE 0 END) AS isTribal
FROM partners p
JOIN partnerQuestionnaires pq ON p.id = pq.partnerId
JOIN touchpoints t ON pq.touchpointId = t.id
JOIN responses r ON pq.id = r.assignmentId
WHERE r.questionType = 'List-to-List'
GROUP BY p.id, p.name, t.id, t.name
```

**Business Rules Extracted**:
- ✅ Z-Code bitmask decoding for eSRS categories
- ✅ Aggregation by group (organizational unit)
- ✅ Aggregation by touchpoint (reporting period)
- ✅ Export formats: CSV, Excel
- ✅ Column headers: L, S, SDB, WOSB, VOSB, DVOSB, T

### Modern Implementation
```typescript
// Already implemented in client/src/pages/EsrsReports.tsx
// Uses calculateZCode and getEsrsGroupTotals helpers
// Export functions: exportZCodeCSV, exportZCodeExcel
```

---

## 9. Session Management

### Legacy Session Logic (INFERRED)
**Business Rules Extracted**:
- ✅ Supplier sessions authenticated by access code only (no password)
- ✅ Session duration: 8 hours maximum
- ✅ Idle timeout: 1 hour of inactivity
- ✅ Session invalidation on submission
- ✅ Session invalidation on delegation
- ✅ Manual revocation allowed by admin

### Modern Implementation
```typescript
// server/_core/context.ts - supplier session middleware
export async function createSupplierContext(accessCode: string) {
  const assignment = await db.query.partnerQuestionnaires.findFirst({
    where: eq(partnerQuestionnaires.accessCode, accessCode),
  });
  
  if (!assignment) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid access code' });
  }
  
  if (assignment.status === 'SUBMITTED') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Questionnaire already submitted' });
  }
  
  if (assignment.status === 'DELEGATED') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Questionnaire delegated to another contact' });
  }
  
  if (assignment.dueDate && assignment.dueDate < new Date()) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Questionnaire expired' });
  }
  
  // Create session with 8-hour expiry
  const session = await createSession({
    assignmentId: assignment.id,
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),  // 8 hours
    idleTimeout: 60 * 60 * 1000,  // 1 hour
  });
  
  return { assignment, session };
}
```

---

## 10. Delegation Workflow

### Legacy Delegation Logic (REFERENCE)
**Business Rules Extracted**:
- ✅ Supplier can delegate questionnaire to another contact within same organization
- ✅ Delegation creates new assignment with new access code
- ✅ Original assignment status → DELEGATED
- ✅ New assignment status → PENDING
- ✅ Delegation email sent to new contact
- ✅ Original access code invalidated
- ✅ Audit log records delegation event

### Modern Implementation
```typescript
// server/routers/assignment.ts - delegate
export const assignmentRouter = router({
  delegate: protectedProcedure
    .input(z.object({
      assignmentId: z.number(),
      newContactEmail: z.string().email(),
      newContactName: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate current assignment
      const assignment = await db.query.partnerQuestionnaires.findFirst({
        where: eq(partnerQuestionnaires.id, input.assignmentId),
      });
      
      if (!assignment) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      if (assignment.status === 'SUBMITTED') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot delegate submitted questionnaire' });
      }
      
      // Create new assignment for delegated contact
      const newAccessCode = generateAccessCode();
      const newAssignment = await db.insert(partnerQuestionnaires).values({
        partnerId: assignment.partnerId,
        questionnaireId: assignment.questionnaireId,
        touchpointId: assignment.touchpointId,
        accessCode: newAccessCode,
        invitedBy: ctx.user.id,
        invitedDate: new Date(),
        dueDate: assignment.dueDate,
        status: 'PENDING',
        enterpriseId: assignment.enterpriseId,
      });
      
      // Update original assignment
      await db.update(partnerQuestionnaires)
        .set({ status: 'DELEGATED' })
        .where(eq(partnerQuestionnaires.id, input.assignmentId));
      
      // Send delegation email
      await sendDelegationEmail({
        to: input.newContactEmail,
        contactName: input.newContactName,
        accessCode: newAccessCode,
        reason: input.reason,
      });
      
      // Audit log
      await logAudit({
        action: 'ASSIGNMENT_DELEGATED',
        entityType: 'assignment',
        entityId: input.assignmentId,
        metadata: {
          newContactEmail: input.newContactEmail,
          newAssignmentId: newAssignment.id,
          reason: input.reason,
        },
      });
      
      return { success: true, newAssignmentId: newAssignment.id };
    }),
});
```

---

## Summary: Key Business Rules for Celestica Deployment

### Critical Path Features (Must Have for Go-Live)

1. **Access Code System** ✅
   - 12-character cryptographic random codes
   - Unique per assignment
   - Single-use (invalidated on submission)
   - 8-hour session, 1-hour idle timeout

2. **Assignment Workflow** ✅
   - Bulk create assignments (1,000 suppliers)
   - Status tracking (PENDING → INVITED → IN_PROGRESS → SUBMITTED)
   - Due date enforcement
   - Progress tracking (0-100%)

3. **Email Integration** ✅
   - Invitation emails with access code
   - Merge tags for personalization
   - SendGrid already configured

4. **Questionnaire Builder** 🔴 BLOCKER
   - 7 question types (Yes/No, Yes/No/NA, List-to-List, Dollar, Date, Text, File)
   - Section organization
   - Skip logic

5. **Supplier Portal** 🔴 BLOCKER
   - Access code entry
   - Questionnaire viewer (use existing QuestionFactory)
   - Auto-save (already implemented)
   - Progress indicator (already implemented)

6. **Submission Flow** 🔴 BLOCKER
   - E-signature capture
   - File upload to S3
   - Submission transaction
   - Confirmation email

7. **Bulk Import** 🔴 BLOCKER
   - CSV import (1,000 suppliers)
   - Validation and error reporting
   - Bulk assignment creation

8. **eSRS Reporting** ✅
   - Z-Code calculation (already implemented)
   - Export CSV/Excel (already implemented)

### Deferred Features (Post-Launch)

- ❌ Delegation workflow
- ❌ Mobile-responsive supplier portal
- ❌ Advanced reporting dashboard
- ❌ Multi-language support
- ❌ Real-time collaboration
- ❌ PII encryption at application level

---

**Document Status**: ✅ Complete  
**Owner**: Giorgio Palmisano  
**Prepared By**: Manus AI Agent  
**Date**: November 27, 2025  
**Purpose**: Extract business rules from 25-year-old legacy system for modern implementation
