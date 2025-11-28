# Intelleges Federal Compliance Management Platform
## Global Standards & Conventions
### Platform Development Standards

**Document Reference:** COMP.DOC.01  
**Version:** 1.0  
**Date:** November 27, 2025  
**Author:** Intelleges Technical Team  
**Status:** Final

---

## Executive Summary

This document establishes the comprehensive technical standards and conventions for the Intelleges Federal Compliance Management Platform. These standards ensure consistency, maintainability, and scalability across the entire codebase while supporting multi-enterprise operations and supplier compliance tracking.

---

## 1. Naming Conventions

### 1.1 Database Schema

The database layer follows a consistent naming pattern that prioritizes clarity and maintains compatibility with both the ORM (Drizzle) and direct SQL queries.

**Table Names:** All database tables use camelCase naming with descriptive, plural nouns for collections and singular nouns for junction or configuration tables.

Examples include:
- `users` - System users (Intelleges admins, enterprise users, suppliers)
- `partners` - Supplier/partner organizations
- `enterprises` - Client enterprise organizations
- `protocols` - Compliance protocols/frameworks
- `touchpoints` - Compliance assessment touchpoints
- `questionnaires` - Compliance questionnaires
- `questionnaireResponses` - Submitted questionnaire responses
- `documents` - Uploaded compliance documents
- `certifications` - Compliance certifications
- `complianceScores` - Calculated compliance scores

**Column Names:** Database columns use camelCase to match JavaScript property access patterns.

Timestamp fields consistently use:
- `createdAt` - Record creation timestamp
- `updatedAt` - Last modification timestamp  
- `submittedAt` - Questionnaire submission timestamp
- `approvedAt` - Approval timestamp
- `rejectedAt` - Rejection timestamp
- `expiresAt` - Expiration timestamp

Foreign key columns explicitly include the referenced table name:
- `userId`, `partnerId`, `enterpriseId`
- `protocolId`, `touchpointId`, `questionnaireId`

**Enum Values:** Enumerated types use lowercase with underscores for multi-word values.

Status enums include:
- `pending`, `in_progress`, `completed`, `approved`, `rejected`, `expired`

Role enums distinguish between:
- `intelleges_admin`, `enterprise_admin`, `enterprise_user`, `supplier`

Compliance status values include:
- `compliant`, `non_compliant`, `pending_review`, `needs_attention`

Notification channels use:
- `email`, `whatsapp`, `both`

### 1.2 TypeScript/JavaScript Code

**File Names:**
- Component files use PascalCase: `ComplianceDashboard.tsx`, `PartnerGrid.tsx`, `QuestionnaireForm.tsx`
- Utility and service files use camelCase: `emailTemplates.ts`, `whatsappTemplates.ts`, `notificationService.ts`
- Router files use descriptive names: `routers.ts`, `partners.ts`, `questionnaires.ts`, `documents.ts`
- Test files append `.test.ts`: `partners.test.ts`, `questionnaires.test.ts`

**Variables and Functions:**
- Local variables and function names use camelCase: `partnerId`, `enterpriseId`, `calculateComplianceScore`, `sendWhatsAppNotification`
- Boolean variables use descriptive prefixes: `isCompliant`, `hasPermission`, `canApprove`
- Constants use UPPER_SNAKE_CASE: `APP_TITLE`, `APP_LOGO`, `COOKIE_NAME`, `MAX_UPLOAD_SIZE`

**React Components:**
- Component names use PascalCase: `PartnerDetail`, `QuestionnaireSubmission`, `DocumentVerification`
- Custom hooks use camelCase with `use` prefix: `useAuth`, `useCompliance`, `useTheme`
- Context providers append `Provider`: `ComplianceProvider`, `ThemeProvider`

**tRPC Procedures:**
- Procedure names use camelCase describing the action: `getPartners`, `createQuestionnaire`, `updateComplianceScore`, `approveDocument`
- Nested routers group related procedures: `auth.me`, `auth.logout`, `partners.list`, `questionnaires.submit`, `documents.approve`

### 1.3 API Endpoints

**REST Endpoints:** All REST endpoints use kebab-case with clear resource hierarchy.

Webhook endpoints follow the pattern `/api/webhooks/{service}`:
- `/api/webhooks/sendgrid` - SendGrid email webhooks
- `/api/webhooks/twilio` - Twilio WhatsApp webhooks

OAuth callbacks use:
- `/api/oauth/callback` - Manus OAuth callback

**tRPC Endpoints:** All tRPC procedures route through `/api/trpc` with automatic type safety.

The router structure mirrors the business domain:
- `partners.*` - Partner/supplier management
- `enterprises.*` - Enterprise client management
- `protocols.*` - Compliance protocol management
- `touchpoints.*` - Touchpoint management
- `questionnaires.*` - Questionnaire operations
- `documents.*` - Document management
- `certifications.*` - Certification tracking
- `compliance.*` - Compliance scoring and reporting

---

## 2. API Patterns

### 2.1 tRPC Architecture

The platform uses tRPC 11 as the primary API layer, providing end-to-end type safety between the Express backend and React frontend. This architecture eliminates the need for manual API client code and ensures that type changes propagate automatically.

**Router Structure:** The main application router (`appRouter`) composes domain-specific sub-routers:

- `auth` router - Authentication state with `me` and `logout` procedures
- `partners` router - Supplier/partner management operations
- `enterprises` router - Enterprise client operations
- `protocols` router - Compliance protocol management
- `touchpoints` router - Touchpoint lifecycle management
- `questionnaires` router - Questionnaire submission and tracking
- `documents` router - Document upload and verification
- `certifications` router - Certification management
- `compliance` router - Compliance scoring and analytics
- `notifications` router - Email and WhatsApp notifications

**Procedure Types:**

- **Public procedures** (`publicProcedure`) - Allow unauthenticated access for operations like partner login or checking authentication status
- **Protected procedures** (`protectedProcedure`) - Require valid authentication and inject `ctx.user` into the context
- **Admin procedures** (`adminProcedure`) - Extend protected procedures with role validation, ensuring only users with `role: 'intelleges_admin'` can execute sensitive operations
- **Enterprise procedures** (`enterpriseProcedure`) - Validate enterprise user permissions
- **Supplier procedures** (`supplierProcedure`) - Validate supplier access and scope

**Input Validation:** All procedures use Zod schemas for runtime input validation.

Simple inputs use inline schemas:
```typescript
z.object({ partnerId: z.number() })
```

Complex inputs define reusable schemas in shared files. Validation errors automatically return structured error responses with field-level details.

**Superjson Serialization:** The tRPC configuration uses Superjson for automatic serialization of complex types. Date objects remain as Date instances across the wire. BigInt values serialize correctly. Undefined values preserve semantic meaning.

### 2.2 Response Envelope

**Success Responses:** tRPC procedures return data directly without wrapping in envelope objects.

Query procedures return the requested data:
```typescript
return partner;
return partners;
```

Mutation procedures return success indicators and relevant data:
```typescript
return { success: true, id: newId };
```

**Error Responses:** The platform uses tRPC's built-in error handling with structured error codes:

- `UNAUTHORIZED` - Authentication failures
- `FORBIDDEN` - Authorization failures
- `BAD_REQUEST` - Validation errors
- `NOT_FOUND` - Missing resources
- `INTERNAL_SERVER_ERROR` - Unexpected failures

Error messages provide actionable information without exposing sensitive implementation details.

**Pagination Pattern:** List endpoints that support pagination accept `limit` and `offset` parameters.

Responses include the data array and optional metadata:
```typescript
{ items: [...], total: 150, hasMore: true }
```

Default limits prevent excessive data transfer: typically 20-50 items per page.

### 2.3 Database Query Patterns

**Separation of Concerns:** Database queries live in `server/db.ts`, separated from business logic in routers. Query functions accept typed parameters and return typed results.

**Query Functions:** Each database operation has a dedicated function with a descriptive name:

- Read operations use `get` prefix: `getPartnerById`, `getQuestionnairesByPartnerId`, `getComplianceScoreByEnterprise`
- Create operations use `create` prefix: `createPartner`, `createQuestionnaire`, `createDocument`
- Update operations use `update` prefix: `updatePartner`, `updateComplianceScore`
- Delete operations use `delete` prefix: `deleteDocument`, `archivePartner`

**Transaction Handling:** Complex operations that modify multiple tables use Drizzle's transaction API. Critical workflows like questionnaire submission, document approval, and compliance score calculation wrap multiple operations in transactions to maintain data consistency.

**Optimistic Locking:** The platform uses timestamp-based optimistic locking for concurrent updates. The `updatedAt` field automatically updates on every modification.

---

## 3. Error Handling Rules

### 3.1 Error Classification

**Client Errors (4xx):**
- `BAD_REQUEST` - Input validation fails, with detailed field-level error messages
- `UNAUTHORIZED` - Missing or invalid authentication credentials
- `FORBIDDEN` - Authenticated users lack permission for the requested operation
- `NOT_FOUND` - Requested resource does not exist

**Server Errors (5xx):**
- `INTERNAL_SERVER_ERROR` - Unexpected failures like database connection issues, external API failures, or unhandled exceptions

### 3.2 Error Response Format

tRPC automatically formats errors with consistent structure:
- `code` field - Semantic error type
- `message` field - Human-readable description
- `data` field (optional) - Additional context like validation errors or field-specific messages

### 3.3 Error Logging

**Console Logging:** Development environments log all errors to the console with full stack traces. Sensitive information like passwords or API keys is redacted from logs.

**Production Logging:** Production environments should integrate with external logging services (Sentry, LogRocket, or similar). Error logs include correlation IDs for tracing requests across services.

**Database Errors:** Database errors are caught and wrapped in appropriate tRPC errors. Connection failures return `INTERNAL_SERVER_ERROR`. Constraint violations return `BAD_REQUEST` with field-specific messages.

### 3.4 Frontend Error Handling

**React Error Boundaries:** The application wraps the entire component tree in an `ErrorBoundary` that catches rendering errors and displays a user-friendly fallback UI.

**Query Error Handling:** tRPC queries expose error states through the `error` property. Components check `isError` and display appropriate messages.

**Toast Notifications:** User-facing errors display as toast notifications using the Sonner library:
- Success operations show green toasts
- Errors show red toasts with actionable messages
- Warning states use yellow toasts

---

## 4. Folder Structure

### 4.1 Project Root

```
/home/ubuntu/compliance-platform/
├── client/          # Frontend React application
├── server/          # Backend Express + tRPC application
├── drizzle/         # Database schema and migrations
├── shared/          # Shared types and constants
├── storage/         # S3 storage helpers
├── docs/            # Technical documentation
├── package.json     # Project dependencies and scripts
├── tsconfig.json    # TypeScript configuration
└── vite.config.ts   # Vite build configuration
```

### 4.2 Client Structure

```
client/
├── public/                    # Static assets
│   └── assets/               # Images, logos, icons
├── src/
│   ├── _core/                # Core utilities and hooks
│   │   └── hooks/            # Shared React hooks (useAuth, useCompliance)
│   ├── components/           # Reusable UI components
│   │   ├── ui/               # shadcn/ui component library
│   │   ├── DashboardLayout.tsx
│   │   └── ErrorBoundary.tsx
│   ├── contexts/             # React context providers
│   │   └── ThemeContext.tsx
│   ├── pages/                # Page-level components
│   │   ├── admin/            # Intelleges admin pages
│   │   ├── enterprise/       # Enterprise user pages
│   │   ├── partner/          # Supplier portal pages
│   │   ├── Home.tsx
│   │   ├── ComplianceDashboard.tsx
│   │   ├── PartnerGrid.tsx
│   │   ├── QuestionnaireForm.tsx
│   │   └── DocumentVerification.tsx
│   ├── lib/                  # Library configurations
│   │   └── trpc.ts           # tRPC client setup
│   ├── App.tsx               # Main application component with routing
│   ├── main.tsx              # Application entry point
│   ├── index.css             # Global styles and Tailwind configuration
│   └── const.ts              # Frontend constants (APP_TITLE, APP_LOGO)
└── index.html                # HTML template
```

### 4.3 Server Structure

```
server/
├── _core/                            # Core framework code
│   ├── index.ts                      # Express server setup
│   ├── trpc.ts                       # tRPC initialization
│   ├── context.ts                    # Request context builder
│   ├── cookies.ts                    # Cookie management
│   ├── env.ts                        # Environment variable validation
│   ├── oauth.ts                      # Manus OAuth integration
│   ├── llm.ts                        # LLM integration helpers
│   ├── email.ts                      # SendGrid email service
│   ├── whatsapp.ts                   # Twilio WhatsApp service
│   ├── emailTemplates.ts             # Email template library
│   ├── whatsappTemplates.ts          # WhatsApp message templates
│   ├── notificationService.ts        # Unified notification dispatcher
│   └── systemRouter.ts               # System-level procedures
├── routers/                          # Domain-specific tRPC routers
│   ├── partners.ts                   # Partner/supplier operations
│   ├── enterprises.ts                # Enterprise operations
│   ├── protocols.ts                  # Protocol management
│   ├── touchpoints.ts                # Touchpoint management
│   ├── questionnaires.ts             # Questionnaire operations
│   ├── documents.ts                  # Document management
│   ├── certifications.ts             # Certification tracking
│   └── compliance.ts                 # Compliance scoring
├── webhooks/                         # External service webhooks
│   ├── sendgrid.ts                   # SendGrid email webhooks
│   └── twilio.ts                     # Twilio WhatsApp webhooks
├── db.ts                             # Database query functions
├── routers.ts                        # Main application router
├── storage.ts                        # S3 storage helpers
└── *.test.ts                         # Vitest unit tests
```

### 4.4 Database Structure

```
drizzle/
├── schema.ts                         # Complete database schema definition
└── migrations/                       # SQL migration files (auto-generated)
```

### 4.5 Documentation Structure

```
docs/
├── 00-documentation-index.md
├── 01-global-standards.md
├── 02-erd-logical-model.md
├── 03-erd-physical-model.md
├── 04-data-dictionary.md
├── 05-api-documentation.md
├── 06-system-architecture.md
├── 07-service-layer-documentation.md
├── 08-frontend-component-documentation.md
├── 09-data-flow-sequence-diagrams.md
├── 10-error-code-dictionary.md
├── 11-event-webhook-architecture.md
├── 12-business-rules-process-flows.md
├── 13-compliance-flow-manual.md
├── 14-partner-management-manual.md
├── 15-admin-operations-manual.md
├── 16-reporting-manual.md
├── 17-supplier-user-guide.md
├── 18-enterprise-user-guide.md
├── 19-admin-dashboard-guide.md
├── 20-rbac-security-documentation.md
├── 21-test-strategy-plan.md
├── 22-unit-test-specifications.md
├── 23-integration-test-specifications.md
├── 24-e2e-test-scenarios.md
├── 25-security-policy.md
├── 26-data-privacy-compliance.md
├── 27-disaster-recovery-plan.md
└── 28-audit-procedures.md
```

---

## 5. Component Naming Rules

### 5.1 React Components

**Page Components:** Top-level page components use descriptive names matching their route:
- `Home`, `ComplianceDashboard`, `PartnerGrid`, `QuestionnaireForm`, `DocumentVerification`

**Admin pages** namespace with `admin/` prefix:
- `admin/Dashboard`, `admin/Partners`, `admin/ComplianceReports`

**Enterprise pages** namespace with `enterprise/` prefix:
- `enterprise/Dashboard`, `enterprise/Suppliers`, `enterprise/Reports`

**Supplier pages** namespace with `partner/` prefix:
- `partner/Dashboard`, `partner/Questionnaires`, `partner/Documents`

**Layout Components:** Layout components that wrap page content use the `Layout` suffix:
- `DashboardLayout`, `AdminLayout`, `SupplierLayout`

**Feature Components:** Components that implement specific features use descriptive names:
- `PartnerCard`, `PartnerGrid`, `QuestionnaireItem`, `ComplianceScorecard`, `DocumentUpload`

**UI Components:** Generic UI components from shadcn/ui live in `components/ui/` and use lowercase names:
- `button`, `card`, `dialog`, `select`, `input`, `table`

### 5.2 Component File Organization

Each component file exports a single default component. Related types and helper functions can be defined in the same file if they're only used by that component. Shared types move to separate files.

Complex components may have associated test files:
- `PartnerGrid.tsx` and `PartnerGrid.test.tsx`

---

## 6. Security Standards

### 6.1 Authentication

- All API endpoints require authentication except public procedures
- Manus OAuth handles authentication flow
- Session cookies use secure, httpOnly, sameSite settings
- JWT tokens expire after configurable period

### 6.2 Authorization

- Role-based access control (RBAC) enforces permissions
- Roles: `intelleges_admin`, `enterprise_admin`, `enterprise_user`, `supplier`
- Each procedure validates user role and scope
- Suppliers can only access their own data
- Enterprise users can only access their enterprise's data

### 6.3 Data Protection

- All sensitive data encrypted at rest
- TLS/SSL for all network communication
- S3 buckets use non-enumerable paths
- File uploads validated for type and size
- SQL injection prevention via parameterized queries
- XSS prevention via React's built-in escaping

### 6.4 Audit Logging

- All critical operations logged with user, timestamp, action
- Audit logs immutable and retained per compliance requirements
- Failed authentication attempts tracked
- Data access logged for compliance auditing

---

## 7. Code Style Guidelines

### 7.1 TypeScript

- Strict mode enabled
- No implicit `any` types
- Explicit return types for public functions
- Interface over type for object shapes
- Enum for fixed sets of values

### 7.2 React

- Functional components with hooks
- Props destructured in function signature
- Custom hooks for reusable logic
- Memoization for expensive computations
- Error boundaries for error handling

### 7.3 Testing

- Unit tests for all business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Minimum 80% code coverage
- Test files colocated with source files

---

## 8. Performance Standards

### 8.1 Frontend

- Code splitting for route-based chunks
- Lazy loading for heavy components
- Image optimization and lazy loading
- Debouncing for search inputs
- Virtualization for large lists

### 8.2 Backend

- Database query optimization with indexes
- Connection pooling for database
- Caching for frequently accessed data
- Pagination for large result sets
- Background jobs for heavy processing

### 8.3 Monitoring

- Application performance monitoring (APM)
- Error tracking and alerting
- Database query performance tracking
- API endpoint response time monitoring
- User experience metrics

---

## Document Maintenance

**Version Control:** All code and documentation stored in version control with meaningful commit messages.

**Review Schedule:**
- Quarterly: Review all procedural documentation
- Semi-annually: Review technical documentation
- Annually: Comprehensive review of all standards

**Update Process:**
1. Identify need for update
2. Draft changes
3. Technical review
4. Stakeholder approval
5. Publish updated version
6. Notify affected teams

---

**Document Classification:** Internal Use Only

**End of Document**
