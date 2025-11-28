# IAOS Federal Compliance Platform

**Enterprise-grade compliance management system for federal contractors and suppliers**

[![Production](https://img.shields.io/badge/Production-Live-success)](https://iaos-compliance-platform-production.up.railway.app)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Team Collaboration](#team-collaboration)

---

## 🎯 Overview

The IAOS Federal Compliance Platform is a comprehensive solution for managing compliance requirements across federal contracting relationships. It provides enterprise groups with tools to create, distribute, and track compliance questionnaires while maintaining strict security and audit controls.

**Production URL:** https://iaos-compliance-platform-production.up.railway.app

---

## ✨ Features

### Core Functionality

- **📝 Questionnaire Builder**
  - Visual questionnaire creation interface
  - Excel import/export for bulk question management
  - 7 question types (Text, Radio, Checkbox, Yes/No, File Upload, Date, etc.)
  - Skip logic and conditional branching
  - Multi-language support

- **👥 Partner Management**
  - Supplier/partner database with DUNS and Federal ID tracking
  - Batch import via Excel
  - Contact information management
  - Partnership status tracking

- **🔐 Role-Based Access Control (RBAC)**
  - 5 role types: Admin, Enterprise Owner, Compliance Officer, Procurement Team, Supplier
  - Enterprise-scoped data isolation
  - Granular permission controls
  - Audit logging for all actions

- **📊 Assignment Workflow**
  - Protocol and Touchpoint-based assignment system
  - Batch assignment creation
  - Status tracking (Pending, In Progress, Submitted, Approved, Rejected)
  - Email notifications and reminders

- **🔍 Supplier Portal**
  - Secure access code-based authentication
  - Mobile-responsive questionnaire interface
  - File upload with virus scanning
  - Progress saving and submission

- **📈 Dashboard & Reporting**
  - Real-time compliance status overview
  - Assignment completion metrics
  - Approval workflow tracking
  - Audit trail visualization

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  - TypeScript, TailwindCSS, shadcn/ui                       │
│  - tRPC React Query integration                              │
│  - Role-based routing and UI                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ tRPC over HTTP
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                Backend (Node.js + Express)                   │
│  - tRPC API layer                                            │
│  - Authentication & session management                       │
│  - Business logic & validation                               │
│  - Event-driven architecture                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Drizzle ORM
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Database (TiDB Cloud)                       │
│  - MySQL-compatible distributed SQL                          │
│  - Multi-tenant data isolation                               │
│  - ACID compliance                                           │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

**Key Entities:**
- **Enterprises** - Top-level organizational units
- **Users** - Enterprise users with RBAC roles
- **Partners** - External suppliers/contractors
- **Protocols** - Compliance frameworks (e.g., CMMC, NIST)
- **Touchpoints** - Specific compliance checkpoints
- **Questionnaires** - Compliance assessment forms
- **Questions** - Individual questionnaire items
- **Assignments** - Questionnaire assignments to partners
- **Responses** - Partner-submitted answers
- **Audit Logs** - Complete activity trail

---

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript 5.7** - Type safety
- **Vite 7** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing
- **Lucide React** - Icon library

### Backend
- **Node.js 22** - Runtime environment
- **Express** - Web framework
- **tRPC** - Type-safe API layer
- **Drizzle ORM** - Database toolkit
- **Zod** - Schema validation
- **SuperJSON** - Enhanced JSON serialization
- **Express Session** - Session management

### Database
- **TiDB Cloud** - Distributed SQL database
- **MySQL 8.0 compatible** - Standard SQL syntax

### Infrastructure
- **Railway** - Production hosting
- **Vercel** - Alternative deployment (optional)
- **GitHub** - Version control
- **pnpm** - Package management

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing
- **TypeScript** - Static type checking

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22+ (with Corepack enabled)
- pnpm 10.4.1+
- TiDB Cloud account (or MySQL 8.0+)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/intelleges/iaos-compliance-platform.git
   cd iaos-compliance-platform
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=mysql://user:password@host:port/database
   
   # Session
   SESSION_SECRET=your-secure-random-string-here
   
   # Email (SendGrid)
   SENDGRID_API_KEY=your-sendgrid-api-key
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   
   # SMS (Twilio) - Optional
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   TWILIO_PHONE_NUMBER=+1234567890
   
   # Frontend
   VITE_APP_TITLE=IAOS Compliance Platform
   VITE_APP_LOGO=/logo.png
   ```

4. **Run database migrations**
   ```bash
   pnpm db:push
   ```

5. **Seed test data (optional)**
   ```bash
   pnpm db:seed
   ```

6. **Start development server**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:5173`

---

## 📦 Deployment

### Railway (Production)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Link to project**
   ```bash
   railway link
   ```

4. **Deploy**
   ```bash
   railway up
   ```

### Environment Variables (Railway)

Set these in Railway dashboard:
- `DATABASE_URL` - TiDB Cloud connection string
- `SESSION_SECRET` - Secure random string
- `SENDGRID_API_KEY` - Email service key
- `SENDGRID_FROM_EMAIL` - Sender email address
- `NODE_ENV=production`

### Build Commands

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview

# Run tests
pnpm test

# Type check
pnpm typecheck
```

---

## 📚 Documentation

### Project Documentation

All documentation is located in the project shared files:

- **INT.DOC.00A** - Documentation Index
- **INT.DOC.01** - Global Standards
- **INT.DOC.03** - ERD Physical Model
- **INT.DOC.04** - Data Dictionary
- **INT.DOC.05** - API Documentation
- **INT.DOC.11** - Event Architecture
- **INT.DOC.12** - Business Rules & Process Flows
- **INT.DOC.20** - RBAC Security Model
- **INT.DOC.60** - Stakeholder Document Access Matrix
- **INT.DOC.67** - AI Orchestration Operating Model

### Key Files

- `/drizzle/schema.ts` - Database schema definitions
- `/server/routers.ts` - Main API router
- `/server/routers/questionnaire-builder.ts` - Questionnaire management API
- `/server/services/qms-parser.ts` - Excel import parser
- `/client/src/App.tsx` - Frontend routing
- `/client/src/pages/` - Page components

---

## 👥 Team Collaboration

### AI Team Structure

This project uses an AI orchestration model with three specialized agents:

1. **ChatGPT (Strategy & Planning)**
   - Product roadmap and feature prioritization
   - Business requirements and user stories
   - Strategic decision-making

2. **Claude (Architecture & Specifications)**
   - Technical specifications and design documents
   - Code reviews and quality assurance
   - Compliance validation

3. **Manus (Implementation & Deployment)**
   - Feature development and bug fixes
   - Testing and deployment
   - Build automation

### Collaboration Workflow

1. **ChatGPT** defines the feature requirements
2. **Claude** creates technical specifications
3. **Manus** implements and deploys
4. **John (Human)** validates and approves

### GitHub Access

To share this repository with Claude and ChatGPT:

1. **For Claude:**
   - Share repository URL: `https://github.com/intelleges/iaos-compliance-platform`
   - Claude can read public repositories or you can share specific files

2. **For ChatGPT:**
   - Share repository URL in conversation
   - ChatGPT can browse the repository if it's public
   - For private repos, share specific file contents as needed

3. **Making Repository Public (Optional):**
   ```bash
   # Via GitHub web interface:
   # Settings → Danger Zone → Change visibility → Make public
   ```

---

## 🔒 Security

### Authentication & Authorization

- Session-based authentication with secure cookies
- RBAC with 5 role levels
- Enterprise-scoped data isolation
- Supplier access codes with expiration
- Audit logging for all actions

### Data Protection

- TLS encryption in transit
- Database encryption at rest (TiDB Cloud)
- Input validation and sanitization
- SQL injection prevention (Drizzle ORM)
- XSS protection (React)

### Compliance

- CMMC compliance framework support
- NIST 800-171 questionnaire templates
- CUI (Controlled Unclassified Information) handling
- Audit trail for compliance reporting

---

## 📊 Current Status

### Production Deployment

- **Status:** ✅ Live
- **URL:** https://iaos-compliance-platform-production.up.railway.app
- **Database:** TiDB Cloud (8 enterprise groups, 2,922 assignments)
- **Last Deploy:** November 28, 2025

### Known Issues

- ⚠️ File upload in questionnaire import needs testing
- ⚠️ Supplier portal mobile responsiveness needs optimization
- ⚠️ Email notification templates need customization

### Roadmap

- [ ] Complete QG2 validation testing
- [ ] Implement real-time notifications
- [ ] Add dashboard analytics
- [ ] Mobile app for suppliers
- [ ] API documentation with Swagger
- [ ] Automated testing suite expansion

---

## 🤝 Contributing

This is a proprietary project. For internal team members:

1. Create a feature branch from `main`
2. Make your changes
3. Submit a pull request
4. Wait for review from Claude or John
5. Merge after approval

---

## 📝 License

Proprietary - All rights reserved by INTELLEGES IAOS

---

## 📞 Support

For technical support or questions:

- **Project Lead:** John (Human Validator)
- **Implementation:** Manus AI
- **Architecture:** Claude AI
- **Strategy:** ChatGPT

---

## 🙏 Acknowledgments

- **TiDB Cloud** for database infrastructure
- **Railway** for hosting platform
- **shadcn/ui** for component library
- **Manus AI Platform** for development automation

---

**Last Updated:** November 28, 2025  
**Version:** 2.3.0  
**Repository:** https://github.com/intelleges/iaos-compliance-platform
