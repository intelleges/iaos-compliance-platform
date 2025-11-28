# Document 63 Analysis Report
## Questionnaire Creation & Configuration Manual Review

**Document**: INT.DOC.63 - Questionnaire Creation & Configuration Manual  
**Version**: 1.0  
**Pages**: 14  
**Analysis Date**: 2025-01-27

---

## Executive Summary

Document 63 provides comprehensive guidance for creating and configuring questionnaires in the Intelleges FCMS platform using three integrated systems: **QMS** (Questionnaire Management System), **CMS** (Content Management System), and **AMS** (AutoMail Management System). The document outlines a 7-phase workflow from protocol selection through go-live deployment.

---

## Key Findings

### 1. **Three-System Architecture**

The platform uses three distinct but integrated management systems:

| System | Purpose | Configuration Method |
|--------|---------|---------------------|
| **QMS** | Question content, logic, validation, skip rules | Spreadsheet upload (XLSX/CSV) |
| **CMS** | Page layout, instructions, help text, branding | Spreadsheet upload (XLSX/CSV) |
| **AMS** | Email templates, invitations, reminders, scheduling | Spreadsheet upload (XLSX/CSV) |

### 2. **End-to-End Workflow (7 Phases)**

| Phase | System | Key Activities | Deliverable |
|-------|--------|----------------|-------------|
| 1 | Planning | Select protocol, define scope, map requirements | Protocol-Touchpoint mapping |
| 2 | Assignment | Assign touchpoint to PartnerTypes | PartnerType configuration |
| 3 | **QMS** | Create questions, logic, validation | QMS spreadsheet upload |
| 4 | **CMS** | Create pages, instructions, help text | CMS spreadsheet upload |
| 5 | **AMS** | Configure emails, merge tags, schedule | AMS spreadsheet upload |
| 6 | Testing | End-to-end validation, UAT | Test results sign-off |
| 7 | Go-Live | Activate touchpoint, send invitations | Live questionnaire |

### 3. **Core Concepts**

#### **Protocol**
- Compliance framework or regulation requiring data collection
- Examples: CMMC, ISO 9001, HIPAA BAA
- Reference: INT.DOC.61 (Compliance Protocol Catalog) lists 80 supported protocols

#### **Touchpoint**
- Configured instance of a protocol for an enterprise
- Naming convention: `[ENTERPRISE_CODE]-[PROTOCOL_CODE]-[YEAR]-[VARIANT]`
- Examples: `HON-CMMC-2024`, `LMT-ISO9001-2024-MFG`

#### **PartnerType**
- Category of suppliers receiving the questionnaire
- Examples: Tier1-Manufacturing, IT-Services
- Each PartnerType assignment creates obligations for ALL partners in that type

---

## QMS (Questionnaire Management System) Details

### QMS Spreadsheet Structure

#### **Required Columns** (A-H)
| Column | Header | Data Type | Description | Example |
|--------|--------|-----------|-------------|---------|
| A | QuestionID | Integer | Unique question identifier | 1, 2, 3... |
| B | SectionCode | Text(20) | Groups questions into sections | SEC-01, SEC-02 |
| C | SectionName | Text(100) | Display name for section | Access Control |
| D | QuestionNumber | Text(20) | Display number (can include sub-numbers) | 3.1, 3.1.1 |
| E | QuestionText | Text(2000) | The actual question content | Does your organization... |
| F | ResponseType | Enum | Type of response expected | YN, YNC, TEXT... |
| G | IsRequired | Boolean | Whether response is mandatory | TRUE, FALSE |
| H | DisplayOrder | Integer | Sort order within section | 100, 200, 300 |

#### **Optional Columns** (I-W)
- **I**: HelpText - Explanatory text shown on hover/click
- **J**: PlaceholderText - Ghost text in input field
- **K**: ValidationRule - Custom validation expression
- **L**: ValidationMessage - Error message if validation fails
- **M**: CommentType - When comments are allowed/required
- **N**: SkipLogic - Conditional display logic
- **O-R**: File upload configuration (enabled, required, types, max size)
- **S**: RegulatoryRef - Reference to regulation clause
- **T**: ScoringWeight - Weight for scoring calculations
- **U**: DefaultValue - Pre-populated response value
- **V**: PartnerTypeFilter - Comma-separated PartnerType codes
- **W**: Tags - Categorization tags

### Response Types

| Code | Name | UI Element | Data Stored | Use Case |
|------|------|------------|-------------|----------|
| **YN** | Yes/No | Radio buttons | YES, NO | Simple binary questions |
| **YNC** | Yes/No/Comment | Radio + textarea | YES/NO + text | Binary with explanation |
| **YNNA** | Yes/No/N-A | Radio buttons | YES, NO, NA | When not applicable is valid |
| **YNCNA** | Yes/No/Comment/N-A | Radio + textarea | YES/NO/NA + text | Full flexibility |
| **TEXT** | Text Input | Textarea | Free text | Open-ended responses |
| **TEXTSHORT** | Short Text | Input field | Text (max 200) | Names, titles, short answers |
| **DATE** | Date Picker | Date input | YYYY-MM-DD | Dates (expiration, etc.) |
| **NUM** | Numeric | Number input | Integer/decimal | Counts, percentages |
| **DROP** | Dropdown | Select menu | Selected value | Single selection from list |
| **MULTI** | Multi-Select | Checkboxes | Array of values | Multiple selections |
| **FILE** | File Upload | File input | File reference | Document uploads |

### Comment Types

| Code | Name | Behavior |
|------|------|----------|
| **NONE** | No Comments | Comment field never shown |
| **OPT** | Optional Always | Comment field always shown, never required |
| **REQ** | Required Always | Comment field always shown, always required |
| **YO** | Yes-Optional | Comment shown only when YES selected, optional |
| **YR** | Yes-Required | Comment shown only when YES selected, required |
| **NO** | No-Optional | Comment shown only when NO selected, optional |
| **NR** | No-Required | Comment shown only when NO selected, required |
| **NAO** | N/A-Optional | Comment shown only when N/A selected, optional |
| **NAR** | N/A-Required | Comment shown only when N/A selected, required |

### Skip Logic Syntax

| Operator | Syntax | Description | Example |
|----------|--------|-------------|---------|
| SHOW_IF | `SHOW_IF:Qn=VALUE` | Show question if condition met | `SHOW_IF:Q5=YES` |
| HIDE_IF | `HIDE_IF:Qn=VALUE` | Hide question if condition met | `HIDE_IF:Q3=NO` |
| REQUIRE_IF | `REQUIRE_IF:Qn=VALUE` | Make required if condition met | `REQUIRE_IF:Q10=YES` |
| AND | `COND1 AND COND2` | Both conditions must be true | `SHOW_IF:Q5=YES AND Q6=YES` |
| OR | `COND1 OR COND2` | Either condition can be true | `SHOW_IF:Q5=YES OR Q5=NA` |
| NOT | `NOT Qn=VALUE` | Condition must be false | `SHOW_IF:NOT Q5=NO` |
| IN | `Qn IN (V1,V2,V3)` | Value in list | `SHOW_IF:Q7 IN (A,B,C)` |
| CONTAINS | `Qn CONTAINS VALUE` | Multi-select contains value | `SHOW_IF:Q8 CONTAINS OPT1` |

**⚠️ WARNING**: Skip logic is evaluated in QuestionID order. Ensure dependent questions have higher QuestionIDs than their triggers.

### QMS Best Practices

1. **Section Organization**
   - Group related questions into logical sections (5-15 questions per section)
   - Use consistent SectionCode format: SEC-01, SEC-02, etc.
   - Section names should be concise but descriptive

2. **Question Writing**
   - Start with action verbs: Does, Has, Is, Are, Do
   - Be specific and unambiguous—avoid 'etc.' or 'and/or'
   - One concept per question—split compound questions
   - Use consistent terminology throughout
   - Include regulatory reference in RegulatoryRef column

3. **Display Order Numbering**
   - Use gaps (increments of 100) to allow future insertions
   - Example: 100, 200, 300 for Q1, Q2, Q3
   - Allows inserting up to 99 questions between existing questions

---

## CMS (Content Management System) Details

### CMS Page Categories

| Category Code | Purpose | When Displayed |
|--------------|---------|----------------|
| **WELCOME** | Initial landing page, overview | First page after access code entry |
| **INSTRUCT** | How to complete the questionnaire | Before questions begin |
| **SECTION** | Introduction to each section | Before each question section |
| **HELP** | Detailed help and guidance | On-demand via help button |
| **REVIEW** | Summary before submission | After all questions answered |
| **CONFIRM** | Submission acknowledgment | After successful submission |

### CMS Spreadsheet Structure

#### **Required Columns**
- **PageID**: Unique page identifier
- **PageCategory**: Category code (WELCOME, INSTRUCT, SECTION, etc.)
- **PageCode**: Unique code for reference
- **PageTitle**: Display title
- **DisplayOrder**: Sort order within category
- **IsActive**: Whether page is shown

#### **Content Columns**
- **HeaderText**: Page header/subtitle
- **BodyContent**: Main page content (HTML allowed)
- **FooterText**: Footer content
- **ImageURL**: Optional image URL
- **VideoURL**: Optional video URL
- **ButtonText**: Primary button label
- **ButtonAction**: Button behavior (NEXT, SUBMIT, SAVE, LINK)
- **LinkURL**: URL if ButtonAction=LINK

#### **Section Columns**
- **SectionCode**: Links to QMS section
- **EstimatedTime**: Estimated completion time
- **RequiredDocs**: Documents needed for section

### HTML Support in BodyContent

Limited HTML tags supported:
- `<p>` - Paragraphs
- `<b>`, `<strong>` - Bold text
- `<i>`, `<em>` - Italic text
- `<ul>`, `<ol>`, `<li>` - Lists
- `<a href="">` - Links
- `<br>` - Line breaks

---

## Gap Analysis: Current Implementation vs. Document 63

### ✅ **Implemented Features**

1. **Database Schema**
   - ✅ `questionnaires` table exists
   - ✅ `questions` table with all required fields
   - ✅ `responses` table for answer options
   - ✅ `partnerQuestionnaires` (assignments/touchpoints)
   - ✅ `questionnaireResponses` for supplier answers
   - ✅ `touchpoints` table
   - ✅ `partnerTypes` table
   - ✅ `protocols` table

2. **Question Types**
   - ✅ YN (Yes/No) - Implemented as `ynExample`
   - ✅ YNNA (Yes/No/N-A) - Implemented as `ynnaExample`
   - ✅ YNC (Yes/No/Comment) - Implemented as `yncExample`
   - ✅ TEXT (Long text) - Implemented as `longTextExample`
   - ✅ TEXTSHORT (Short text) - Implemented as `shortTextExample`
   - ✅ DATE - Implemented as `dateExample`
   - ✅ NUM - Implemented as `numberExample`
   - ✅ DROP (Dropdown) - Implemented as `dropdownExample`
   - ✅ MULTI (Multi-select) - Implemented as `multiSelectExample`
   - ✅ FILE - Implemented as `fileUploadExample`

3. **Supplier Workflow**
   - ✅ Access code authentication
   - ✅ Company verification page
   - ✅ Contact verification page
   - ✅ Questionnaire completion with auto-save
   - ✅ E-signature capture
   - ✅ Confirmation page
   - ✅ PDF receipt generation

4. **Admin UI**
   - ✅ Questionnaire management (Questionnaires.tsx)
   - ✅ Touchpoint management (Touchpoint.tsx)
   - ✅ Partner management (Partner.tsx)
   - ✅ Protocol management (Protocol.tsx)
   - ✅ Enterprise management (Enterprise.tsx)

### ❌ **Missing Features**

1. **Spreadsheet Upload System**
   - ❌ QMS spreadsheet template download
   - ❌ QMS spreadsheet upload and validation
   - ❌ CMS spreadsheet template download
   - ❌ CMS spreadsheet upload and validation
   - ❌ AMS spreadsheet template download
   - ❌ AMS spreadsheet upload and validation
   - ❌ Bulk question import from Excel/CSV

2. **Advanced Question Features**
   - ❌ Skip logic engine (SHOW_IF, HIDE_IF, REQUIRE_IF)
   - ❌ Validation rules (custom expressions)
   - ❌ Comment type configuration (YO, YR, NO, NR, NAO, NAR)
   - ❌ PartnerType filtering (show questions only to specific types)
   - ❌ Scoring weights
   - ❌ Regulatory references display
   - ❌ Help text on hover/click
   - ❌ Placeholder text in inputs

3. **CMS System**
   - ❌ Welcome page configuration
   - ❌ Instructions page configuration
   - ❌ Section introduction pages
   - ❌ Help page system
   - ❌ Review/summary page before submission
   - ❌ Custom confirmation page content
   - ❌ HTML content support in pages
   - ❌ Image/video embedding

4. **AMS (Email Automation)**
   - ❌ Email template configuration UI
   - ❌ Reminder scheduling (14, 7, 3, 1 days before due)
   - ❌ Merge tags in emails
   - ❌ Email send log tracking
   - ❌ Bounce/delivery tracking
   - ❌ Automated reminder triggers

5. **PartnerType Assignment**
   - ❌ Touchpoint-to-PartnerType assignment matrix
   - ❌ Question variant filtering by PartnerType
   - ❌ Bulk assignment warnings (partner count validation)

6. **Validation & Testing**
   - ❌ Pre-upload validation (ERR-QMS-001 through ERR-QMS-009)
   - ❌ Test mode preview
   - ❌ UAT workflow
   - ❌ Go-live activation process

---

## Implementation Recommendations

### Priority 1: Critical Missing Features (High Impact)

1. **Skip Logic Engine** 🔴
   - **Impact**: Enables conditional questions, reduces supplier burden
   - **Effort**: Medium (2-3 days)
   - **Implementation**:
     - Add `skipLogic` field to `questions` table
     - Create skip logic parser/evaluator
     - Update frontend to hide/show questions dynamically
     - Support operators: SHOW_IF, HIDE_IF, REQUIRE_IF, AND, OR, NOT, IN, CONTAINS

2. **Spreadsheet Upload System** 🔴
   - **Impact**: Enables bulk question import, reduces manual data entry
   - **Effort**: High (5-7 days)
   - **Implementation**:
     - Create QMS/CMS template generation endpoints
     - Build Excel/CSV parser with validation
     - Implement error reporting (ERR-QMS-001 through ERR-QMS-009)
     - Add upload UI to admin dashboard

3. **Email Automation (AMS)** 🔴
   - **Impact**: Automates supplier engagement, reduces manual follow-up
   - **Effort**: Medium (3-4 days)
   - **Implementation**:
     - Create `emailTemplates` table (already exists in schema!)
     - Build template editor UI
     - Implement merge tag system
     - Add scheduled reminder jobs
     - Track email delivery/opens/clicks

### Priority 2: Important Enhancements (Medium Impact)

4. **CMS Page System** 🟡
   - **Impact**: Improves supplier experience, reduces support questions
   - **Effort**: Medium (3-4 days)
   - **Implementation**:
     - Use existing `cmsContent` table
     - Create page category system (WELCOME, INSTRUCT, SECTION, HELP, REVIEW, CONFIRM)
     - Build page editor UI with HTML support
     - Add section introduction pages

5. **Advanced Question Features** 🟡
   - **Impact**: Improves data quality, reduces errors
   - **Effort**: Medium (3-4 days)
   - **Implementation**:
     - Add `validationRule`, `validationMessage`, `helpText`, `placeholderText` fields
     - Implement comment type logic (YO, YR, NO, NR, NAO, NAR)
     - Add regulatory reference display
     - Support custom validation expressions

6. **PartnerType Filtering** 🟡
   - **Impact**: Enables targeted questionnaires, reduces irrelevant questions
   - **Effort**: Low (1-2 days)
   - **Implementation**:
     - Add `partnerTypeFilter` field to `questions` table
     - Filter questions on frontend based on supplier's PartnerType
     - Add PartnerType assignment matrix UI

### Priority 3: Nice-to-Have Features (Low Impact)

7. **Test Mode & UAT Workflow** 🟢
   - **Impact**: Reduces production errors, improves quality
   - **Effort**: Low (1-2 days)
   - **Implementation**:
     - Add `status` field to `touchpoints` (DRAFT, TESTING, ACTIVE, ARCHIVED)
     - Create test mode preview
     - Add UAT sign-off workflow

8. **Scoring System** 🟢
   - **Impact**: Enables automated compliance scoring
   - **Effort**: Medium (2-3 days)
   - **Implementation**:
     - Add `scoringWeight` field to `questions` table
     - Calculate total score on submission
     - Display score in admin dashboard

---

## Immediate Action Items

### Week 1: Foundation
1. ✅ Review Document 63 (COMPLETE)
2. ⬜ Add missing fields to `questions` table:
   - `skipLogic` TEXT
   - `validationRule` TEXT
   - `validationMessage` TEXT
   - `helpText` TEXT
   - `placeholderText` TEXT
   - `commentType` ENUM
   - `partnerTypeFilter` TEXT
   - `scoringWeight` DECIMAL
   - `regulatoryRef` TEXT
3. ⬜ Run database migration

### Week 2: Skip Logic
4. ⬜ Implement skip logic parser
5. ⬜ Update frontend to evaluate skip logic
6. ⬜ Test skip logic with sample questions

### Week 3: Spreadsheet Upload
7. ⬜ Create QMS template generator
8. ⬜ Build Excel/CSV parser
9. ⬜ Implement validation engine
10. ⬜ Add upload UI to admin dashboard

### Week 4: Email Automation
11. ⬜ Build email template editor
12. ⬜ Implement merge tag system
13. ⬜ Add scheduled reminder jobs
14. ⬜ Test email delivery

---

## Conclusion

Document 63 reveals a sophisticated questionnaire configuration system that goes far beyond the current implementation. The **spreadsheet-driven approach** (QMS/CMS/AMS) is the core differentiator, enabling rapid questionnaire creation without manual data entry.

**Key Takeaways:**

1. **Spreadsheet Upload is Critical**: The entire system is designed around Excel/CSV templates. Without this, questionnaire creation is extremely manual.

2. **Skip Logic is Essential**: Conditional questions reduce supplier burden and improve data quality. This should be the first enhancement.

3. **Email Automation (AMS) Drives Engagement**: Automated reminders significantly improve response rates. The `emailTemplates` table already exists in the schema!

4. **CMS System Improves UX**: Welcome pages, instructions, and help text reduce support burden and improve completion rates.

5. **The Platform is 60% Complete**: Core functionality exists (questions, responses, workflow), but advanced features (skip logic, spreadsheet upload, email automation) are missing.

**Recommended Next Steps:**

1. **Immediate**: Implement skip logic engine (2-3 days)
2. **Short-term**: Build spreadsheet upload system (5-7 days)
3. **Medium-term**: Add email automation (3-4 days)
4. **Long-term**: Implement CMS page system (3-4 days)

Total estimated effort: **15-20 days** to reach feature parity with Document 63 specifications.
