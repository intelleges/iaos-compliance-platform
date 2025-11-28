# Intelleges Federal Compliance Management Platform
## API Documentation
### tRPC Procedures Reference

**Document Reference:** COMP.DOC.05  
**Version:** 1.0  
**Date:** November 27, 2025  
**Author:** Intelleges Technical Team  
**Status:** Final

---

## Executive Summary

This document provides comprehensive API documentation for all tRPC procedures in the Intelleges Federal Compliance Management Platform. The API uses tRPC 11 for end-to-end type safety between the Express backend and React frontend.

---

## API Architecture

**Protocol:** tRPC 11  
**Transport:** HTTP/HTTPS  
**Base URL:** `/api/trpc`  
**Serialization:** Superjson  
**Authentication:** Manus OAuth (session cookies)

---

## Authentication Endpoints

### `auth.me`
Get current authenticated user.

**Type:** Query  
**Access:** Public  
**Input:** None  
**Output:** `User | null`

### `auth.logout`
Logout current user.

**Type:** Mutation  
**Access:** Public  
**Input:** None  
**Output:** `{ success: true }`

---

## Partner Management

### `partners.list`
List all partners (filtered by enterprise for enterprise users).

**Type:** Query  
**Access:** Protected  
**Input:** `{ limit?, offset?, status?, tier? }`  
**Output:** `{ items: Partner[], total: number }`

### `partners.getById`
Get partner by ID.

**Type:** Query  
**Access:** Protected  
**Input:** `{ id: number }`  
**Output:** `Partner`

### `partners.create`
Create new partner.

**Type:** Mutation  
**Access:** Admin  
**Input:** `{ name, contactEmail, assignedEnterpriseId, ... }`  
**Output:** `{ success: true, id: number }`

### `partners.update`
Update partner.

**Type:** Mutation  
**Access:** Admin  
**Input:** `{ id, ...updates }`  
**Output:** `{ success: true }`

### `partners.validateAccessCode`
Validate partner access code for login.

**Type:** Mutation  
**Access:** Public  
**Input:** `{ accessCode: string }`  
**Output:** `{ valid: boolean, partnerId?: number }`

---

## Questionnaire Operations

### `questionnaires.list`
List questionnaires (filtered by partner for suppliers).

**Type:** Query  
**Access:** Protected  
**Input:** `{ partnerId?, status?, limit?, offset? }`  
**Output:** `{ items: Questionnaire[], total: number }`

### `questionnaires.getById`
Get questionnaire by ID.

**Type:** Query  
**Access:** Protected  
**Input:** `{ id: number }`  
**Output:** `Questionnaire`

### `questionnaires.submit`
Submit questionnaire responses.

**Type:** Mutation  
**Access:** Supplier  
**Input:** `{ questionnaireId, responses: JSON }`  
**Output:** `{ success: true, score: number }`

### `questionnaires.approve`
Approve questionnaire submission.

**Type:** Mutation  
**Access:** Enterprise Admin  
**Input:** `{ id, reviewNotes? }`  
**Output:** `{ success: true }`

### `questionnaires.reject`
Reject questionnaire submission.

**Type:** Mutation  
**Access:** Enterprise Admin  
**Input:** `{ id, reviewNotes }`  
**Output:** `{ success: true }`

---

## Document Management

### `documents.upload`
Upload compliance document.

**Type:** Mutation  
**Access:** Supplier  
**Input:** `{ partnerId, touchpointId?, file: File }`  
**Output:** `{ success: true, documentId: number, fileUrl: string }`

### `documents.list`
List documents (filtered by partner for suppliers).

**Type:** Query  
**Access:** Protected  
**Input:** `{ partnerId?, status?, limit?, offset? }`  
**Output:** `{ items: Document[], total: number }`

### `documents.approve`
Approve document.

**Type:** Mutation  
**Access:** Enterprise Admin  
**Input:** `{ id, reviewNotes? }`  
**Output:** `{ success: true }`

### `documents.reject`
Reject document.

**Type:** Mutation  
**Access:** Enterprise Admin  
**Input:** `{ id, rejectionReason }`  
**Output:** `{ success: true }`

---

## Compliance Scoring

### `compliance.getScore`
Get compliance score for partner.

**Type:** Query  
**Access:** Protected  
**Input:** `{ partnerId, scoreType? }`  
**Output:** `ComplianceScore`

### `compliance.recalculate`
Recalculate compliance scores.

**Type:** Mutation  
**Access:** Admin  
**Input:** `{ partnerId }`  
**Output:** `{ success: true, score: number }`

---

## Deadline Extensions

### `extensions.request`
Request deadline extension.

**Type:** Mutation  
**Access:** Supplier  
**Input:** `{ touchpointId, daysRequested, requestReason }`  
**Output:** `{ success: true, autoApproved: boolean }`

### `extensions.approve`
Approve extension request.

**Type:** Mutation  
**Access:** Enterprise Admin  
**Input:** `{ id, approvalNotes? }`  
**Output:** `{ success: true }`

### `extensions.reject`
Reject extension request.

**Type:** Mutation  
**Access:** Enterprise Admin  
**Input:** `{ id, rejectionReason }`  
**Output:** `{ success: true }`

---

## Notifications

### `notifications.sendEmail`
Send email notification.

**Type:** Mutation  
**Access:** Admin  
**Input:** `{ toEmail, templateId, templateData }`  
**Output:** `{ success: true, messageId: string }`

### `notifications.sendWhatsApp`
Send WhatsApp message.

**Type:** Mutation  
**Access:** Admin  
**Input:** `{ phoneNumber, messageBody }`  
**Output:** `{ success: true, messageSid: string }`

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `BAD_REQUEST` | 400 | Invalid input |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

---

**Document Classification:** Internal Use Only

**End of Document**
