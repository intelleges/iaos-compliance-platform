# Assignment Workflow Specification - Celestica Deployment

**Client**: Celestica  
**Go-Live**: November 30, 2025 (3 days)  
**Scale**: 1,000 suppliers, 100 enterprise users, 8 groups/locations  
**Protocol**: Annual Reps and Certs  
**Touchpoint**: 2025

---

## Executive Summary

This document specifies the exact implementation requirements for the Assignment Workflow to support Celestica's production deployment. The workflow must handle bulk assignment creation for 1,000 suppliers, automated access code generation, email invitation delivery, and real-time progress monitoring across 8 organizational groups.

---

## 1. Database Schema Changes

### Current Schema (Existing)

The `partnerQuestionnaires` table already exists with the following structure:

```typescript
// drizzle/schema.ts
export const partnerQuestionnaires = mysqlTable("partnerQuestionnaires", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  questionnaireId: int("questionnaireId").notNull(),
  touchpointId: int("touchpointId").notNull(),
  partnerTypeId: int("partnerTypeId").notNull(),
  groupId: int("groupId"),
  accessCode: varchar("accessCode", { length: 12 }),  // ⚠️ Need to add NOT NULL + UNIQUE
  invitedBy: int("invitedBy"),
  invitedDate: timestamp("invitedDate"),
  completedDate: timestamp("completedDate"),
  progress: int("progress").default(0),
  zCode: varchar("zCode", { length: 500 }),
  pdfUrl: text("pdfUrl"),
  docFolderUrl: text("docFolderUrl"),
  score: decimal("score", { precision: 5, scale: 2 }),
  status: int("status").default(1),  // ⚠️ Need to change to ENUM
  loadGroup: varchar("loadGroup", { length: 50 }),
  dueDate: timestamp("dueDate"),
  priority: int("priority"),
  enterpriseId: int("enterpriseId").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  isCUI: boolean("isCUI").default(false).notNull(),
});
```

### Required Schema Changes

**Change 1: Access Code Constraints**
```typescript
accessCode: varchar("accessCode", { length: 12 }).notNull().unique(),
```
- **Reason**: Every assignment must have a unique access code for supplier authentication
- **Impact**: Prevents duplicate codes, ensures supplier can access their questionnaire
- **Migration**: Add NOT NULL and UNIQUE constraints to existing column

**Change 2: Status Enum**
```typescript
status: mysqlEnum("status", [
  "PENDING",      // Created but invitation not sent
  "INVITED",      // Invitation email sent
  "IN_PROGRESS",  // Supplier accessed questionnaire
  "SUBMITTED",    // Supplier completed and signed
  "DELEGATED",    // Forwarded to another contact
  "EXPIRED"       // Past due date without submission
]).default("PENDING").notNull(),
```
- **Reason**: Type-safe status tracking, prevents invalid status values
- **Impact**: Enables proper status lifecycle enforcement
- **Migration**: Convert existing INT status values to ENUM (1→PENDING, 2→INVITED, etc.)

**Change 3: Invited By and Date**
```typescript
invitedBy: int("invitedBy").notNull(),
invitedDate: timestamp("invitedDate").notNull(),
```
- **Reason**: Audit trail for who sent invitation and when
- **Impact**: Compliance requirement, enables reminder email logic
- **Migration**: Set default values for existing rows (invitedBy = owner, invitedDate = createdAt)

---

## 2. Bulk Assignment Creation Workflow

### User Story

> **As a** Celestica procurement admin  
> **I want to** assign the Annual Reps and Certs questionnaire to all 1,000 suppliers in one operation  
> **So that** I can launch the compliance campaign quickly without manual data entry

### Acceptance Criteria

1. ✅ Admin can select touchpoint (2025), questionnaire (Annual Reps and Certs), and due date
2. ✅ Admin can import 1,000 suppliers from CSV file
3. ✅ System validates CSV data (required fields, format, duplicates)
4. ✅ System creates 1,000 assignments in < 30 seconds
5. ✅ System generates unique access code for each assignment
6. ✅ System sends 1,000 invitation emails via SendGrid
7. ✅ Admin sees progress indicator during bulk operation
8. ✅ Admin receives summary report (created, failed, duplicates)

### Implementation Specification

#### Step 1: CSV Import Validation

**CSV Format** (required columns):
```csv
internalID,name,email,firstName,lastName,title,phone,address1,city,state,zipcode,country,dunsNumber,groupName
SUP-001,Acme Corp,john@acme.com,John,Doe,Procurement Manager,555-1234,123 Main St,Boston,MA,02101,US,123456789,Boston Office
SUP-002,Beta Inc,jane@beta.com,Jane,Smith,Compliance Officer,555-5678,456 Oak Ave,Cambridge,MA,02139,US,987654321,Cambridge Office
```

**Validation Rules**:

| Field | Required | Format | Validation |
|-------|----------|--------|------------|
| internalID | Yes | Alphanumeric, max 20 chars | Unique within enterprise |
| name | Yes | Text, max 200 chars | Not empty |
| email | Yes | Valid email format | Valid email, unique per touchpoint |
| firstName | No | Text, max 200 chars | - |
| lastName | No | Text, max 200 chars | - |
| title | No | Text, max 50 chars | - |
| phone | No | Phone format | Valid phone if provided |
| address1 | No | Text, max 200 chars | - |
| city | No | Text, max 100 chars | - |
| state | No | 2-letter state code | Valid US state if provided |
| zipcode | No | 5 or 9 digit zipcode | Valid format if provided |
| country | No | 2-letter country code | Valid ISO country code |
| dunsNumber | No | 9 digits | Valid DUNS if provided |
| groupName | Yes | Text, max 100 chars | Must match existing group in enterprise |

**Validation Logic**:
```typescript
// server/routers/assignment.ts
export const assignmentRouter = router({
  validateCSV: protectedProcedure
    .input(z.object({
      csvData: z.array(z.object({
        internalID: z.string().max(20),
        name: z.string().min(1).max(200),
        email: z.string().email(),
        firstName: z.string().max(200).optional(),
        lastName: z.string().max(200).optional(),
        title: z.string().max(50).optional(),
        phone: z.string().optional(),
        address1: z.string().max(200).optional(),
        city: z.string().max(100).optional(),
        state: z.string().length(2).optional(),
        zipcode: z.string().optional(),
        country: z.string().length(2).optional(),
        dunsNumber: z.string().length(9).optional(),
        groupName: z.string().max(100),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const validRows = [];
      const invalidRows = [];
      const duplicates = [];
      
      for (const row of input.csvData) {
        // Check for duplicate internalID within enterprise
        const existingPartner = await db.query.partners.findFirst({
          where: and(
            eq(partners.internalID, row.internalID),
            eq(partners.enterpriseId, ctx.user.enterpriseId)
          ),
        });
        
        if (existingPartner) {
          duplicates.push({ row, reason: `Duplicate internalID: ${row.internalID}` });
          continue;
        }
        
        // Validate group exists
        const group = await db.query.groups.findFirst({
          where: and(
            eq(groups.name, row.groupName),
            eq(groups.enterpriseId, ctx.user.enterpriseId)
          ),
        });
        
        if (!group) {
          invalidRows.push({ row, reason: `Invalid group: ${row.groupName}` });
          continue;
        }
        
        validRows.push({ ...row, groupId: group.id });
      }
      
      return {
        valid: validRows.length,
        invalid: invalidRows.length,
        duplicates: duplicates.length,
        invalidRows,
        duplicates,
      };
    }),
});
```

#### Step 2: Bulk Partner Creation

**Create Partners in Batch**:
```typescript
// server/routers/partner.ts
export const partnerRouter = router({
  bulkCreate: protectedProcedure
    .input(z.object({
      partners: z.array(z.object({
        internalID: z.string(),
        name: z.string(),
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        title: z.string().optional(),
        phone: z.string().optional(),
        address1: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipcode: z.string().optional(),
        country: z.string().optional(),
        dunsNumber: z.string().optional(),
        groupId: z.number(),
      })),
      loadGroup: z.string(),  // Batch identifier for tracking
    }))
    .mutation(async ({ input, ctx }) => {
      const createdPartners = [];
      
      // Use database transaction for atomicity
      await db.transaction(async (tx) => {
        for (const partnerData of input.partners) {
          const [partner] = await tx.insert(partners).values({
            ...partnerData,
            enterpriseId: ctx.user.enterpriseId,
            partnerTypeId: 1,  // Supplier (default)
            status: 1,  // Loaded
            loadHistory: input.loadGroup,
            owner: ctx.user.id,
            author: ctx.user.id,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();
          
          createdPartners.push(partner);
        }
      });
      
      return { created: createdPartners.length, partners: createdPartners };
    }),
});
```

**Performance Optimization**:
- Use batch INSERT with 100 rows per query (10 batches for 1,000 suppliers)
- Estimated time: 100 rows × 0.1s = 10s per batch × 10 batches = **100 seconds total**
- Optimization: Use `db.insert().values([...])` for bulk insert → **< 10 seconds**

#### Step 3: Bulk Assignment Creation with Access Codes

**Create Assignments for All Partners**:
```typescript
// server/routers/assignment.ts
export const assignmentRouter = router({
  bulkCreate: protectedProcedure
    .input(z.object({
      partnerIds: z.array(z.number()),
      questionnaireId: z.number(),
      touchpointId: z.number(),
      dueDate: z.string().datetime(),
      priority: z.number().optional(),
      sendInvitations: z.boolean().default(false),  // Send later for performance
    }))
    .mutation(async ({ input, ctx }) => {
      const assignments = [];
      const accessCodes = new Set<string>();  // Track generated codes to ensure uniqueness
      
      // Generate unique access codes
      function generateUniqueAccessCode(): string {
        let code: string;
        do {
          code = generateAccessCode();  // 12-character crypto random
        } while (accessCodes.has(code));
        accessCodes.add(code);
        return code;
      }
      
      // Get questionnaire and touchpoint details
      const questionnaire = await db.query.questionnaires.findFirst({
        where: eq(questionnaires.id, input.questionnaireId),
      });
      
      const touchpoint = await db.query.touchpoints.findFirst({
        where: eq(touchpoints.id, input.touchpointId),
      });
      
      if (!questionnaire || !touchpoint) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Questionnaire or touchpoint not found' });
      }
      
      // Batch create assignments
      const assignmentValues = input.partnerIds.map(partnerId => ({
        partnerId,
        questionnaireId: input.questionnaireId,
        touchpointId: input.touchpointId,
        partnerTypeId: 1,  // Supplier
        accessCode: generateUniqueAccessCode(),
        invitedBy: ctx.user.id,
        invitedDate: new Date(),
        dueDate: new Date(input.dueDate),
        priority: input.priority || 1,
        status: 'PENDING' as const,
        progress: 0,
        enterpriseId: ctx.user.enterpriseId,
        active: true,
        isCUI: questionnaire.isCUI || false,
      }));
      
      // Insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < assignmentValues.length; i += batchSize) {
        const batch = assignmentValues.slice(i, i + batchSize);
        const created = await db.insert(partnerQuestionnaires).values(batch).returning();
        assignments.push(...created);
      }
      
      // Log audit event
      await logAudit({
        action: 'BULK_ASSIGNMENT_CREATED',
        entityType: 'assignment',
        entityId: null,
        userId: ctx.user.id,
        enterpriseId: ctx.user.enterpriseId,
        metadata: {
          count: assignments.length,
          questionnaireId: input.questionnaireId,
          touchpointId: input.touchpointId,
          dueDate: input.dueDate,
        },
      });
      
      return {
        created: assignments.length,
        assignments: assignments.map(a => ({
          id: a.id,
          partnerId: a.partnerId,
          accessCode: a.accessCode,
        })),
      };
    }),
});
```

**Performance Target**:
- 1,000 assignments × 12-byte access code generation = **< 1 second**
- 1,000 INSERT statements in 10 batches = **< 10 seconds**
- Total: **< 15 seconds**

#### Step 4: Bulk Email Invitation Sending

**Send Invitations via SendGrid**:
```typescript
// server/routers/assignment.ts
export const assignmentRouter = router({
  sendBulkInvitations: protectedProcedure
    .input(z.object({
      assignmentIds: z.array(z.number()),
    }))
    .mutation(async ({ input, ctx }) => {
      const sent = [];
      const failed = [];
      
      // Fetch assignments with partner and questionnaire details
      const assignments = await db.query.partnerQuestionnaires.findMany({
        where: inArray(partnerQuestionnaires.id, input.assignmentIds),
        with: {
          partner: true,
          questionnaire: true,
          touchpoint: true,
        },
      });
      
      // Send emails in batches of 100 (SendGrid rate limit)
      const batchSize = 100;
      for (let i = 0; i < assignments.length; i += batchSize) {
        const batch = assignments.slice(i, i + batchSize);
        
        for (const assignment of batch) {
          try {
            await sendInvitationEmail({
              to: assignment.partner.email,
              partnerName: assignment.partner.firstName || assignment.partner.name,
              companyName: assignment.partner.name,
              touchpointName: assignment.touchpoint.name,
              questionnaireName: assignment.questionnaire.name,
              accessCode: assignment.accessCode,
              portalUrl: `${process.env.VITE_APP_URL}/supplier/login?code=${assignment.accessCode}`,
              dueDate: assignment.dueDate,
              enterpriseName: ctx.user.enterprise.name,
            });
            
            // Update assignment status to INVITED
            await db.update(partnerQuestionnaires)
              .set({ status: 'INVITED', invitedDate: new Date() })
              .where(eq(partnerQuestionnaires.id, assignment.id));
            
            sent.push(assignment.id);
          } catch (error) {
            failed.push({ assignmentId: assignment.id, error: error.message });
          }
        }
        
        // Rate limiting: wait 1 second between batches
        if (i + batchSize < assignments.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Log audit event
      await logAudit({
        action: 'BULK_INVITATIONS_SENT',
        entityType: 'assignment',
        entityId: null,
        userId: ctx.user.id,
        enterpriseId: ctx.user.enterpriseId,
        metadata: {
          sent: sent.length,
          failed: failed.length,
          failedDetails: failed,
        },
      });
      
      return {
        sent: sent.length,
        failed: failed.length,
        failedDetails: failed,
      };
    }),
});
```

**Performance Target**:
- SendGrid rate limit: 100 emails/second
- 1,000 emails ÷ 100 emails/batch × 1 second/batch = **10 seconds**
- With error handling and retries: **< 30 seconds**

---

## 3. Assignment Status Tracking

### Status Lifecycle

The assignment status follows a strict lifecycle to ensure data integrity and compliance tracking:

```
PENDING → INVITED → IN_PROGRESS → SUBMITTED
   ↓         ↓            ↓
EXPIRED   EXPIRED    DELEGATED
```

### Status Transition Rules

| Current Status | Allowed Transitions | Trigger Event | Business Rule |
|----------------|---------------------|---------------|---------------|
| PENDING | INVITED | Invitation email sent | Cannot skip to IN_PROGRESS |
| PENDING | EXPIRED | Due date passed | System automatic check |
| INVITED | IN_PROGRESS | Supplier enters access code | First access logs timestamp |
| INVITED | EXPIRED | Due date passed | System automatic check |
| IN_PROGRESS | SUBMITTED | Supplier signs and submits | Access code invalidated |
| IN_PROGRESS | DELEGATED | Supplier forwards to another contact | New assignment created |
| IN_PROGRESS | EXPIRED | Due date passed | System automatic check |
| SUBMITTED | - | Terminal state | Cannot change status |
| DELEGATED | - | Terminal state | Cannot change status |
| EXPIRED | INVITED | Admin extends due date and resends | Manual intervention only |

### Status Update Implementation

**Automatic Status Transitions**:
```typescript
// server/jobs/assignment-status-checker.ts
export async function checkExpiredAssignments() {
  const now = new Date();
  
  // Find assignments past due date that are not SUBMITTED
  const expiredAssignments = await db.query.partnerQuestionnaires.findMany({
    where: and(
      lt(partnerQuestionnaires.dueDate, now),
      notInArray(partnerQuestionnaires.status, ['SUBMITTED', 'EXPIRED', 'DELEGATED'])
    ),
  });
  
  for (const assignment of expiredAssignments) {
    // Update status to EXPIRED
    await db.update(partnerQuestionnaires)
      .set({ status: 'EXPIRED' })
      .where(eq(partnerQuestionnaires.id, assignment.id));
    
    // Trigger event for notification
    eventBus.emit('assignment.pastDue', {
      assignmentId: assignment.id,
      partnerId: assignment.partnerId,
      touchpointId: assignment.touchpointId,
      dueDate: assignment.dueDate,
    });
  }
  
  return { expired: expiredAssignments.length };
}

// Run every hour
setInterval(checkExpiredAssignments, 60 * 60 * 1000);
```

**Manual Status Transitions**:
```typescript
// server/routers/assignment.ts
export const assignmentRouter = router({
  updateStatus: protectedProcedure
    .input(z.object({
      assignmentId: z.number(),
      newStatus: z.enum(['PENDING', 'INVITED', 'IN_PROGRESS', 'SUBMITTED', 'DELEGATED', 'EXPIRED']),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const assignment = await db.query.partnerQuestionnaires.findFirst({
        where: eq(partnerQuestionnaires.id, input.assignmentId),
      });
      
      if (!assignment) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      
      // Validate status transition
      const allowedTransitions: Record<string, string[]> = {
        'PENDING': ['INVITED', 'EXPIRED'],
        'INVITED': ['IN_PROGRESS', 'EXPIRED'],
        'IN_PROGRESS': ['SUBMITTED', 'DELEGATED', 'EXPIRED'],
        'SUBMITTED': [],  // Terminal state
        'DELEGATED': [],  // Terminal state
        'EXPIRED': ['INVITED'],  // Admin can resend
      };
      
      if (!allowedTransitions[assignment.status]?.includes(input.newStatus)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot transition from ${assignment.status} to ${input.newStatus}`,
        });
      }
      
      // Update status
      await db.update(partnerQuestionnaires)
        .set({ status: input.newStatus, updatedAt: new Date() })
        .where(eq(partnerQuestionnaires.id, input.assignmentId));
      
      // Log audit event
      await logAudit({
        action: 'ASSIGNMENT_STATUS_CHANGED',
        entityType: 'assignment',
        entityId: input.assignmentId,
        userId: ctx.user.id,
        enterpriseId: ctx.user.enterpriseId,
        metadata: {
          oldStatus: assignment.status,
          newStatus: input.newStatus,
          reason: input.reason,
        },
      });
      
      return { success: true };
    }),
});
```

---

## 4. Progress Monitoring Dashboard

### Real-Time Progress Tracking

**Dashboard Requirements**:
1. Show total assignments by status (PENDING, INVITED, IN_PROGRESS, SUBMITTED, EXPIRED)
2. Show completion percentage (SUBMITTED / TOTAL)
3. Show progress by group (8 groups for Celestica)
4. Show overdue assignments (past due date, not SUBMITTED)
5. Show average time to completion
6. Show daily submission rate

**Dashboard Query**:
```typescript
// server/routers/dashboard.ts
export const dashboardRouter = router({
  getAssignmentSummary: protectedProcedure
    .input(z.object({
      touchpointId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      // Get all assignments for touchpoint
      const assignments = await db.query.partnerQuestionnaires.findMany({
        where: and(
          eq(partnerQuestionnaires.touchpointId, input.touchpointId),
          eq(partnerQuestionnaires.enterpriseId, ctx.user.enterpriseId)
        ),
        with: {
          partner: true,
          group: true,
        },
      });
      
      // Calculate summary statistics
      const total = assignments.length;
      const byStatus = {
        PENDING: assignments.filter(a => a.status === 'PENDING').length,
        INVITED: assignments.filter(a => a.status === 'INVITED').length,
        IN_PROGRESS: assignments.filter(a => a.status === 'IN_PROGRESS').length,
        SUBMITTED: assignments.filter(a => a.status === 'SUBMITTED').length,
        DELEGATED: assignments.filter(a => a.status === 'DELEGATED').length,
        EXPIRED: assignments.filter(a => a.status === 'EXPIRED').length,
      };
      
      const completionPercentage = total > 0 ? (byStatus.SUBMITTED / total) * 100 : 0;
      
      // Calculate overdue assignments
      const now = new Date();
      const overdue = assignments.filter(a =>
        a.dueDate &&
        a.dueDate < now &&
        a.status !== 'SUBMITTED' &&
        a.status !== 'EXPIRED'
      ).length;
      
      // Calculate average time to completion
      const completedAssignments = assignments.filter(a => a.completedDate);
      const avgTimeToCompletion = completedAssignments.length > 0
        ? completedAssignments.reduce((sum, a) => {
            const days = Math.floor((a.completedDate!.getTime() - a.invitedDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / completedAssignments.length
        : 0;
      
      // Group by organizational unit
      const byGroup = assignments.reduce((acc, a) => {
        const groupName = a.group?.name || 'Unassigned';
        if (!acc[groupName]) {
          acc[groupName] = {
            total: 0,
            submitted: 0,
            inProgress: 0,
            overdue: 0,
          };
        }
        acc[groupName].total++;
        if (a.status === 'SUBMITTED') acc[groupName].submitted++;
        if (a.status === 'IN_PROGRESS') acc[groupName].inProgress++;
        if (a.dueDate && a.dueDate < now && a.status !== 'SUBMITTED') acc[groupName].overdue++;
        return acc;
      }, {} as Record<string, any>);
      
      return {
        total,
        byStatus,
        completionPercentage,
        overdue,
        avgTimeToCompletion,
        byGroup,
      };
    }),
});
```

**Dashboard UI Component**:
```typescript
// client/src/pages/AssignmentDashboard.tsx
export function AssignmentDashboard() {
  const [selectedTouchpoint, setSelectedTouchpoint] = useState(2025);
  
  const { data: summary, isLoading } = trpc.dashboard.getAssignmentSummary.useQuery({
    touchpointId: selectedTouchpoint,
  });
  
  if (isLoading) return <DashboardLayoutSkeleton />;
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{summary.completionPercentage.toFixed(1)}%</div>
              <Progress value={summary.completionPercentage} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600">{summary.overdue}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Avg. Time to Complete</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{summary.avgTimeToCompletion.toFixed(1)} days</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{summary.byStatus.PENDING}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.byStatus.INVITED}</div>
                <div className="text-sm text-muted-foreground">Invited</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{summary.byStatus.IN_PROGRESS}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.byStatus.SUBMITTED}</div>
                <div className="text-sm text-muted-foreground">Submitted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{summary.byStatus.DELEGATED}</div>
                <div className="text-sm text-muted-foreground">Delegated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.byStatus.EXPIRED}</div>
                <div className="text-sm text-muted-foreground">Expired</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Group Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Progress by Group</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>In Progress</TableHead>
                  <TableHead>Overdue</TableHead>
                  <TableHead>Completion %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(summary.byGroup).map(([groupName, stats]: [string, any]) => (
                  <TableRow key={groupName}>
                    <TableCell className="font-medium">{groupName}</TableCell>
                    <TableCell>{stats.total}</TableCell>
                    <TableCell className="text-green-600">{stats.submitted}</TableCell>
                    <TableCell className="text-orange-600">{stats.inProgress}</TableCell>
                    <TableCell className="text-red-600">{stats.overdue}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={(stats.submitted / stats.total) * 100} className="w-20" />
                        <span>{((stats.submitted / stats.total) * 100).toFixed(1)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

---

## 5. Celestica-Specific Configuration

### Pre-Configured Data

**Enterprise**:
```typescript
{
  id: 1,
  name: "Celestica",
  domain: "celestica.com",
  active: true,
}
```

**Groups** (8 locations):
```typescript
[
  { id: 1, name: "Boston Office", enterpriseId: 1 },
  { id: 2, name: "Cambridge Office", enterpriseId: 1 },
  { id: 3, name: "New York Office", enterpriseId: 1 },
  { id: 4, name: "Chicago Office", enterpriseId: 1 },
  { id: 5, name: "San Francisco Office", enterpriseId: 1 },
  { id: 6, name: "Austin Office", enterpriseId: 1 },
  { id: 7, name: "Seattle Office", enterpriseId: 1 },
  { id: 8, name: "Remote Workers", enterpriseId: 1 },
]
```

**Protocol**:
```typescript
{
  id: 1,
  name: "Annual Reps and Certs",
  description: "Annual compliance certification for suppliers",
  enterpriseId: 1,
  active: true,
}
```

**Touchpoint**:
```typescript
{
  id: 1,
  name: "2025",
  protocolId: 1,
  enterpriseId: 1,
  status: "ACTIVE",
  dueDate: new Date("2025-12-31"),
  active: true,
}
```

**Questionnaire**:
```typescript
{
  id: 1,
  name: "Annual Reps and Certs Questionnaire",
  protocolId: 1,
  touchpointId: 1,
  enterpriseId: 1,
  isCUI: false,
  active: true,
}
```

### Seed Data Script

```typescript
// server/scripts/seed-celestica.ts
import { db } from '../db';
import { enterprises, groups, protocols, touchpoints, questionnaires } from '../../drizzle/schema';

export async function seedCelesticaData() {
  // Create enterprise
  const [enterprise] = await db.insert(enterprises).values({
    name: "Celestica",
    domain: "celestica.com",
    active: true,
  }).returning();
  
  // Create groups
  const groupNames = [
    "Boston Office",
    "Cambridge Office",
    "New York Office",
    "Chicago Office",
    "San Francisco Office",
    "Austin Office",
    "Seattle Office",
    "Remote Workers",
  ];
  
  const createdGroups = [];
  for (const name of groupNames) {
    const [group] = await db.insert(groups).values({
      name,
      enterpriseId: enterprise.id,
      active: true,
    }).returning();
    createdGroups.push(group);
  }
  
  // Create protocol
  const [protocol] = await db.insert(protocols).values({
    name: "Annual Reps and Certs",
    description: "Annual compliance certification for suppliers",
    enterpriseId: enterprise.id,
    active: true,
  }).returning();
  
  // Create touchpoint
  const [touchpoint] = await db.insert(touchpoints).values({
    name: "2025",
    protocolId: protocol.id,
    enterpriseId: enterprise.id,
    status: "ACTIVE",
    dueDate: new Date("2025-12-31"),
    active: true,
  }).returning();
  
  // Create questionnaire
  const [questionnaire] = await db.insert(questionnaires).values({
    name: "Annual Reps and Certs Questionnaire",
    protocolId: protocol.id,
    touchpointId: touchpoint.id,
    enterpriseId: enterprise.id,
    isCUI: false,
    active: true,
  }).returning();
  
  console.log("Celestica seed data created successfully");
  console.log({
    enterprise: enterprise.id,
    groups: createdGroups.length,
    protocol: protocol.id,
    touchpoint: touchpoint.id,
    questionnaire: questionnaire.id,
  });
}
```

---

## 6. Performance Requirements

### Scalability Targets

| Operation | Target | Actual (Expected) |
|-----------|--------|-------------------|
| CSV validation (1,000 rows) | < 5 seconds | 3 seconds |
| Bulk partner creation (1,000) | < 30 seconds | 10 seconds |
| Bulk assignment creation (1,000) | < 30 seconds | 15 seconds |
| Access code generation (1,000) | < 5 seconds | 1 second |
| Bulk email sending (1,000) | < 60 seconds | 30 seconds |
| Dashboard query (1,000 assignments) | < 2 seconds | 1 second |
| **Total end-to-end time** | **< 3 minutes** | **< 2 minutes** |

### Database Indexing

**Required Indexes**:
```sql
-- partnerQuestionnaires table
CREATE INDEX idx_pq_touchpoint ON partnerQuestionnaires(touchpointId);
CREATE INDEX idx_pq_partner ON partnerQuestionnaires(partnerId);
CREATE INDEX idx_pq_status ON partnerQuestionnaires(status);
CREATE INDEX idx_pq_duedate ON partnerQuestionnaires(dueDate);
CREATE INDEX idx_pq_enterprise ON partnerQuestionnaires(enterpriseId);
CREATE UNIQUE INDEX idx_pq_accesscode ON partnerQuestionnaires(accessCode);

-- partners table
CREATE INDEX idx_partner_enterprise ON partners(enterpriseId);
CREATE INDEX idx_partner_internalid ON partners(internalID);
CREATE INDEX idx_partner_email ON partners(email);
CREATE INDEX idx_partner_group ON partners(groupId);
```

---

## 7. Testing Requirements

### Unit Tests

**Access Code Generation**:
```typescript
// server/tests/access-code.test.ts
describe('generateAccessCode', () => {
  it('should generate 12-character code', () => {
    const code = generateAccessCode();
    expect(code).toHaveLength(12);
  });
  
  it('should only use allowed characters', () => {
    const code = generateAccessCode();
    const allowedChars = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/;
    expect(code).toMatch(allowedChars);
  });
  
  it('should generate unique codes', () => {
    const codes = new Set();
    for (let i = 0; i < 1000; i++) {
      codes.add(generateAccessCode());
    }
    expect(codes.size).toBe(1000);
  });
});
```

**Bulk Assignment Creation**:
```typescript
// server/tests/assignment.test.ts
describe('assignment.bulkCreate', () => {
  it('should create 1000 assignments', async () => {
    const partnerIds = Array.from({ length: 1000 }, (_, i) => i + 1);
    const result = await caller.assignment.bulkCreate({
      partnerIds,
      questionnaireId: 1,
      touchpointId: 1,
      dueDate: new Date('2025-12-31').toISOString(),
    });
    expect(result.created).toBe(1000);
  });
  
  it('should generate unique access codes for all assignments', async () => {
    const partnerIds = Array.from({ length: 1000 }, (_, i) => i + 1);
    const result = await caller.assignment.bulkCreate({
      partnerIds,
      questionnaireId: 1,
      touchpointId: 1,
      dueDate: new Date('2025-12-31').toISOString(),
    });
    const accessCodes = result.assignments.map(a => a.accessCode);
    const uniqueCodes = new Set(accessCodes);
    expect(uniqueCodes.size).toBe(1000);
  });
});
```

### Integration Tests

**End-to-End Workflow**:
```typescript
// server/tests/assignment-workflow.test.ts
describe('Assignment Workflow - Celestica', () => {
  it('should complete full workflow from CSV import to email sending', async () => {
    // Step 1: Import 1000 suppliers from CSV
    const csvData = generateMockCSV(1000);
    const validation = await caller.assignment.validateCSV({ csvData });
    expect(validation.valid).toBe(1000);
    
    // Step 2: Create partners
    const partners = await caller.partner.bulkCreate({
      partners: csvData,
      loadGroup: 'celestica-2025-batch-1',
    });
    expect(partners.created).toBe(1000);
    
    // Step 3: Create assignments
    const assignments = await caller.assignment.bulkCreate({
      partnerIds: partners.partners.map(p => p.id),
      questionnaireId: 1,
      touchpointId: 1,
      dueDate: new Date('2025-12-31').toISOString(),
    });
    expect(assignments.created).toBe(1000);
    
    // Step 4: Send invitations
    const invitations = await caller.assignment.sendBulkInvitations({
      assignmentIds: assignments.assignments.map(a => a.id),
    });
    expect(invitations.sent).toBe(1000);
    
    // Step 5: Verify dashboard shows correct data
    const summary = await caller.dashboard.getAssignmentSummary({
      touchpointId: 1,
    });
    expect(summary.total).toBe(1000);
    expect(summary.byStatus.INVITED).toBe(1000);
  });
});
```

---

## 8. Implementation Timeline

### Day 2 Afternoon (4 hours)

**Hour 1: Database Schema Changes**
- ✅ Add NOT NULL and UNIQUE constraints to accessCode field
- ✅ Convert status from INT to ENUM
- ✅ Add NOT NULL constraints to invitedBy and invitedDate
- ✅ Run `pnpm db:push` to apply migrations
- ✅ Verify schema changes in database

**Hour 2: Bulk Assignment Creation**
- ✅ Implement `assignment.bulkCreate` tRPC procedure
- ✅ Implement access code generation with uniqueness check
- ✅ Add batch INSERT logic (100 rows per batch)
- ✅ Write 15 unit tests for bulk creation
- ✅ Test with 1,000 mock partner IDs

**Hour 3: Bulk Email Sending**
- ✅ Implement `assignment.sendBulkInvitations` tRPC procedure
- ✅ Add SendGrid batch sending logic (100 emails per batch)
- ✅ Implement rate limiting (1 second between batches)
- ✅ Add error handling and retry logic
- ✅ Test with 10 real email addresses

**Hour 4: Assignment Dashboard**
- ✅ Implement `dashboard.getAssignmentSummary` tRPC procedure
- ✅ Create AssignmentDashboard UI component
- ✅ Add summary cards (total, completion %, overdue, avg time)
- ✅ Add status breakdown chart
- ✅ Add group breakdown table
- ✅ Test dashboard with 1,000 mock assignments

---

## 9. Success Criteria

### Functional Requirements

- ✅ Admin can import 1,000 suppliers from CSV in < 30 seconds
- ✅ System validates CSV data and reports errors
- ✅ System creates 1,000 assignments with unique access codes in < 30 seconds
- ✅ System sends 1,000 invitation emails in < 60 seconds
- ✅ Dashboard shows real-time progress across 8 groups
- ✅ Assignment status transitions follow strict lifecycle rules
- ✅ Expired assignments automatically flagged by system

### Non-Functional Requirements

- ✅ All operations complete in < 3 minutes total
- ✅ Database queries return in < 2 seconds
- ✅ Zero duplicate access codes
- ✅ Email delivery rate > 95%
- ✅ 15+ unit tests passing for assignment workflow
- ✅ Integration test covering full CSV → email workflow passing

---

**Document Status**: ✅ Complete  
**Owner**: Giorgio Palmisano  
**Prepared By**: Manus AI Agent  
**Date**: November 27, 2025  
**Purpose**: Detailed specification for Celestica Assignment Workflow implementation
