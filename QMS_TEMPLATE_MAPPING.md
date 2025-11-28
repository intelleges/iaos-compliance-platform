# QMS Template to Database Schema Mapping

**Document**: QMS Template to Schema Mapping  
**Template**: intelleges_qms_reference.xlsx  
**Target Schema**: drizzle/schema.ts (questions table)  
**Date**: 2025-01-27

---

## Overview

This document maps the 27 columns in the QMS Excel template to the database schema fields in the `questions` table.

---

## Column Mapping Table

| # | Excel Column | Data Type | DB Field | DB Type | Status | Notes |
|---|--------------|-----------|----------|---------|--------|-------|
| 1 | `QID` | int64 | `id` | int | ✅ EXISTS | Primary key, auto-increment |
| 2 | `Page` | int64 | `page` | int | ❌ MISSING | Page number grouping |
| 3 | `Surveyset` | object | `sectionCode` | varchar(50) | ❌ MISSING | Section identifier |
| 4 | `Survey` | object | `questionnaireId` | int | ✅ EXISTS | FK to questionnaires table |
| 5 | `Question` | object | `questionText` | text | ✅ EXISTS | Question content (supports HTML) |
| 6 | `Response` | object | `responseType` | varchar(50) | ✅ EXISTS | Response type (Y/N, TEXT, etc.) |
| 7 | `Title` | object | `title` | varchar(200) | ✅ EXISTS | Internal reference name |
| 8 | `Required` | int64 | `isRequired` | boolean | ✅ EXISTS | 1=required, 0=optional |
| 9 | `Length` | int64 | `minLength` | int | ❌ MISSING | Minimum text length |
| 10 | `titleLength` | int64 | `titleLength` | int | ❌ MISSING | Title length validation |
| 11 | `skipLogic` | object | `hasSkipLogic` | boolean | ❌ MISSING | Y/N flag |
| 12 | `skipLogicAnswer` | object | `skipLogicTrigger` | varchar(50) | ❌ MISSING | Trigger value (0/1/NA) |
| 13 | `skipLogicJump` | float64 | `skipLogicTarget` | int | ❌ MISSING | Target question ID |
| 14 | `CommentBoxMessageText` | object | `commentMessage` | text | ❌ MISSING | Message shown with comment box |
| 15 | `UploadMessageText` | object | `uploadMessage` | text | ❌ MISSING | Message shown with file upload |
| 16 | `CalendarMessageText` | object | `calendarMessage` | text | ❌ MISSING | Message shown with date picker |
| 17 | `CommentType` | object | `commentType` | varchar(50) | ✅ EXISTS | When to show comment (YN_COMMENT_Y, etc.) |
| 18 | `yValue` | int64 | `yesScore` | int | ❌ MISSING | Score for YES answer |
| 19 | `nValue` | int64 | `noScore` | int | ❌ MISSING | Score for NO answer |
| 20 | `naValue` | int64 | `naScore` | int | ❌ MISSING | Score for N/A answer |
| 21 | `otherValue` | int64 | `otherScore` | int | ❌ MISSING | Score for OTHER answer |
| 22 | `qWeight` | int64 | `weight` | decimal(5,2) | ❌ MISSING | Question weight for scoring |
| 23 | `spinOffQuestionnaire` | object | `hasSpinoff` | boolean | ❌ MISSING | Y/N trigger sub-questionnaire |
| 24 | `spinoffid` | object | `spinoffId` | varchar(100) | ❌ MISSING | Sub-questionnaire ID reference |
| 25 | `emailalert` | object | `hasEmailAlert` | boolean | ❌ MISSING | Y/N send email on answer |
| 26 | `emailalertlist` | object | `emailAlertList` | text | ❌ MISSING | Email addresses to notify |
| 27 | `accessLevel` | int64 | `accessLevel` | int | ❌ MISSING | Permission level required (0=all) |

---

## Summary Statistics

- **Total Columns**: 27
- **Existing Fields**: 6 (22%)
- **Missing Fields**: 21 (78%)
- **Action Required**: Add 21 new columns to `questions` table

---

## Existing Fields (6)

These fields already exist in the current schema:

| DB Field | Excel Column | Type | Notes |
|----------|--------------|------|-------|
| `id` | `QID` | int | Primary key |
| `questionnaireId` | `Survey` | int | FK to questionnaires |
| `questionText` | `Question` | text | Question content |
| `responseType` | `Response` | varchar(50) | Response type |
| `title` | `Title` | varchar(200) | Internal name |
| `isRequired` | `Required` | boolean | Required flag |
| `commentType` | `CommentType` | varchar(50) | Comment behavior |

---

## Missing Fields (21)

These fields need to be added to the schema:

### **Section & Organization**
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `page` | int | YES | NULL | Page number grouping |
| `sectionCode` | varchar(50) | YES | NULL | Section identifier (e.g., "1. Response Types - Y/N") |

### **Validation**
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `minLength` | int | YES | 0 | Minimum text length (0=no minimum) |
| `titleLength` | int | YES | 0 | Title length validation |

### **Skip Logic**
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `hasSkipLogic` | boolean | NO | FALSE | Y/N flag for skip logic |
| `skipLogicTrigger` | varchar(50) | YES | NULL | Trigger value ("0"=NO, "1"=YES, "NA") |
| `skipLogicTarget` | int | YES | NULL | Target question ID to jump to |

### **Conditional UI Messages**
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `commentMessage` | text | YES | NULL | Message shown with comment box |
| `uploadMessage` | text | YES | NULL | Message shown with file upload |
| `calendarMessage` | text | YES | NULL | Message shown with date picker |

### **Scoring**
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `yesScore` | int | YES | 1 | Score for YES answer |
| `noScore` | int | YES | 0 | Score for NO answer |
| `naScore` | int | YES | -1 | Score for N/A answer |
| `otherScore` | int | YES | -1 | Score for OTHER answer |
| `weight` | decimal(5,2) | YES | 0.00 | Question weight for scoring |

### **Sub-Questionnaires**
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `hasSpinoff` | boolean | NO | FALSE | Y/N trigger sub-questionnaire |
| `spinoffId` | varchar(100) | YES | NULL | Sub-questionnaire ID reference (e.g., "1:5001") |

### **Email Alerts**
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `hasEmailAlert` | boolean | NO | FALSE | Y/N send email on answer |
| `emailAlertList` | text | YES | NULL | Email addresses to notify (e.g., "1:alert@company.com") |

### **Access Control**
| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `accessLevel` | int | YES | 0 | Permission level required (0=all, 1+=restricted) |

---

## Data Type Conversions

### Excel → MySQL Type Mapping

| Excel Type | MySQL Type | Notes |
|------------|------------|-------|
| `int64` | `int` | Standard integer |
| `object` (text) | `varchar(n)` or `text` | Depends on length |
| `object` (Y/N flag) | `boolean` | Convert "Y"→TRUE, "N"→FALSE |
| `float64` | `int` | Skip logic target is always integer (question ID) |
| `object` (email list) | `text` | Store as comma-separated or JSON |

---

## Special Handling Required

### 1. **Skip Logic Conversion**

**Excel Format:**
```
skipLogic: "Y"
skipLogicAnswer: "1"
skipLogicJump: 30004.0
```

**Database Storage:**
```sql
hasSkipLogic: TRUE
skipLogicTrigger: "1"
skipLogicTarget: 30004
```

**Logic:**
- If `skipLogic = "Y"`, set `hasSkipLogic = TRUE`
- Store `skipLogicAnswer` as string in `skipLogicTrigger` ("0", "1", "NA")
- Convert `skipLogicJump` from float to int for `skipLogicTarget`

### 2. **Comment Type Mapping**

**Excel Values:**
- `YN_COMMENT_Y` - Show comment when YES selected
- `YN_COMMENT_N` - Show comment when NO selected
- `YN_COMMENT_BOTH` - Show comment for both YES/NO
- `YNNA_COMMENT_Y` - Show comment when YES selected (Y/N/NA type)
- `YNNA_COMMENT_N` - Show comment when NO selected (Y/N/NA type)
- `YNNA_COMMENT_NA` - Show comment when N/A selected
- `TEXT_COMMENT` - Always show comment for text questions
- `NONE` - No comment box

**Database Storage:**
- Store as-is in `commentType` varchar(50) field

### 3. **Scoring Values**

**Excel Format:**
```
yValue: 1
nValue: 0
naValue: -1
otherValue: -1
qWeight: 0
```

**Database Storage:**
```sql
yesScore: 1
noScore: 0
naScore: -1
otherScore: -1
weight: 0.00
```

**Logic:**
- Direct mapping, no conversion needed
- `qWeight` stored as decimal(5,2) to support fractional weights

### 4. **Email Alert List**

**Excel Format:**
```
emailalert: "Y"
emailalertlist: "1:alert@company.com"
```

**Database Storage:**
```sql
hasEmailAlert: TRUE
emailAlertList: "1:alert@company.com"
```

**Logic:**
- If `emailalert = "Y"`, set `hasEmailAlert = TRUE`
- Store `emailalertlist` as-is (format: "groupId:email@domain.com")

### 5. **Spinoff Questionnaire**

**Excel Format:**
```
spinOffQuestionnaire: "Y"
spinoffid: "1:5001"
```

**Database Storage:**
```sql
hasSpinoff: TRUE
spinoffId: "1:5001"
```

**Logic:**
- If `spinOffQuestionnaire = "Y"`, set `hasSpinoff = TRUE`
- Store `spinoffid` as-is (format: "groupId:questionnaireId")

---

## Schema Update SQL (Drizzle ORM)

```typescript
// Add to drizzle/schema.ts - questions table

export const questions = mysqlTable("questions", {
  // ... existing fields ...
  
  // Section & Organization
  page: int("page"),
  sectionCode: varchar("sectionCode", { length: 50 }),
  
  // Validation
  minLength: int("minLength").default(0),
  titleLength: int("titleLength").default(0),
  
  // Skip Logic
  hasSkipLogic: boolean("hasSkipLogic").default(false).notNull(),
  skipLogicTrigger: varchar("skipLogicTrigger", { length: 50 }),
  skipLogicTarget: int("skipLogicTarget"),
  
  // Conditional UI Messages
  commentMessage: text("commentMessage"),
  uploadMessage: text("uploadMessage"),
  calendarMessage: text("calendarMessage"),
  
  // Scoring
  yesScore: int("yesScore").default(1),
  noScore: int("noScore").default(0),
  naScore: int("naScore").default(-1),
  otherScore: int("otherScore").default(-1),
  weight: decimal("weight", { precision: 5, scale: 2 }).default("0.00"),
  
  // Sub-Questionnaires
  hasSpinoff: boolean("hasSpinoff").default(false).notNull(),
  spinoffId: varchar("spinoffId", { length: 100 }),
  
  // Email Alerts
  hasEmailAlert: boolean("hasEmailAlert").default(false).notNull(),
  emailAlertList: text("emailAlertList"),
  
  // Access Control
  accessLevel: int("accessLevel").default(0),
});
```

---

## Import Validation Rules

When importing QMS Excel template, validate:

1. **Required Fields**: QID, Survey, Question, Response, Title, Required
2. **Data Types**: Ensure integers are integers, booleans are Y/N
3. **Skip Logic**: If `skipLogic="Y"`, then `skipLogicAnswer` and `skipLogicJump` must have values
4. **Email Alerts**: If `emailalert="Y"`, then `emailalertlist` must have value
5. **Spinoff**: If `spinOffQuestionnaire="Y"`, then `spinoffid` must have value
6. **Response Type**: Must be valid (Y/N, Y/N/NA, CHECKBOX, TEXT, etc.)
7. **Comment Type**: Must be valid (YN_COMMENT_Y, YN_COMMENT_N, NONE, etc.)
8. **Skip Logic Target**: Must reference existing question ID

---

## Import Process Flow

```
1. Upload Excel file
2. Parse all rows into JSON
3. Validate each row:
   - Check required fields
   - Validate data types
   - Check referential integrity (skip logic targets)
   - Validate enum values (responseType, commentType)
4. If validation passes:
   - Begin transaction
   - Insert/update questions table
   - Commit transaction
5. If validation fails:
   - Return error report with row numbers and issues
6. Return import summary:
   - Questions imported: X
   - Questions updated: Y
   - Errors: Z
```

---

## Next Steps

1. ✅ Create this mapping document
2. ⬜ Update `questions` table schema with 21 new fields
3. ⬜ Run `pnpm db:push` to apply schema changes
4. ⬜ Create QMS Excel parser service
5. ⬜ Implement validation engine
6. ⬜ Create tRPC upload procedure
7. ⬜ Build upload UI in admin dashboard
8. ⬜ Test with reference template (82 questions)
