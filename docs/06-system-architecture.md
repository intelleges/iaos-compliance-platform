# Intelleges Federal Compliance Management Platform
## System Architecture
### Technical Stack & Infrastructure

**Document Reference:** COMP.DOC.06  
**Version:** 1.0  
**Date:** November 27, 2025  
**Author:** Intelleges Technical Team  
**Status:** Final

---

## Executive Summary

This document describes the system architecture for the Intelleges Federal Compliance Management Platform, including technology stack, infrastructure, deployment model, and scalability considerations.

---

## Technology Stack

### Frontend
- **Framework:** React 19
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui
- **State Management:** TanStack Query (via tRPC)
- **Routing:** Wouter
- **Build Tool:** Vite
- **Language:** TypeScript

### Backend
- **Runtime:** Node.js 22
- **Framework:** Express 4
- **API Layer:** tRPC 11
- **ORM:** Drizzle
- **Language:** TypeScript

### Database
- **Primary:** MySQL 8.0+ / TiDB
- **Caching:** Application-level (in-memory)

### External Services
- **Authentication:** Manus OAuth
- **Email:** SendGrid
- **SMS/WhatsApp:** Twilio
- **File Storage:** AWS S3
- **Hosting:** Manus Cloud Platform

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React 19 + Tailwind 4 + shadcn/ui                     │ │
│  │  - Admin Dashboard (Intelleges)                        │ │
│  │  - Enterprise Portal (Client Users)                    │ │
│  │  - Supplier Portal (Partner Access)                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                       API GATEWAY                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  tRPC 11 (Type-Safe API)                               │ │
│  │  - /api/trpc/* → All RPC endpoints                     │ │
│  │  - /api/oauth/* → Authentication callbacks            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION TIER                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Express 4 + Node.js 22                                │ │
│  │  - Partner Management Service                          │ │
│  │  - Questionnaire Service                               │ │
│  │  - Document Service                                    │ │
│  │  - Compliance Scoring Service                          │ │
│  │  - Notification Service (Email + WhatsApp)             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                       DATA TIER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  MySQL/TiDB  │  │   AWS S3     │  │  External APIs   │  │
│  │  (Drizzle)   │  │ (Documents)  │  │  - SendGrid      │  │
│  │              │  │              │  │  - Twilio        │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Authentication Flow
1. User clicks login → Redirected to Manus OAuth portal
2. User authenticates → OAuth callback to `/api/oauth/callback`
3. Backend validates OAuth token → Creates session cookie
4. Subsequent requests include session cookie → Context includes user

### Authorization Model
- **Role-Based Access Control (RBAC)** - See document 07
- **Row-Level Security** - Enterprise users see only their partners
- **API-Level Guards** - `protectedProcedure` enforces authentication

### Data Security
- **Encryption in Transit:** TLS 1.3
- **Encryption at Rest:** Database encryption enabled
- **Secrets Management:** Environment variables (never committed)
- **File Storage:** S3 with private buckets + presigned URLs

---

## Scalability Considerations

### Horizontal Scaling
- Stateless application servers (session in cookies)
- Load balancer distributes traffic across multiple instances
- Database read replicas for query performance

### Vertical Scaling
- Increase server resources (CPU, RAM) as needed
- Database connection pooling (5-20 connections)

### Caching Strategy
- Reference data cached in-memory (protocols, touchpoints)
- Compliance scores cached for 5 minutes
- No caching for real-time data

---

## Deployment Model

### Environments
- **Development:** Local sandbox
- **Staging:** Manus staging environment
- **Production:** Manus production environment

### CI/CD Pipeline
1. Code commit → GitHub
2. Automated tests run → Vitest
3. Build artifacts created → Vite build
4. Deploy to staging → Manual approval
5. Deploy to production → Manus Publish button

### Monitoring
- **Application Logs:** Console logs captured
- **Error Tracking:** Error boundaries + logging
- **Performance Monitoring:** Built-in Manus analytics

---

## Disaster Recovery

### Backup Strategy
- **Database:** Daily full backups, hourly incremental
- **File Storage:** S3 versioning enabled
- **Code:** Git version control

### Recovery Procedures
- **Database:** Restore from backup (RPO: 1 hour, RTO: 4 hours)
- **Application:** Redeploy from Git (RTO: 30 minutes)
- **Files:** S3 version restore (RTO: 15 minutes)

---

**Document Classification:** Internal Use Only

**End of Document**
