# Intelleges Federal Compliance Management Platform
## Data Dictionary
### Field-Level Documentation

**Document Reference:** COMP.DOC.04  
**Version:** 1.0  
**Date:** November 27, 2025  
**Author:** Intelleges Technical Team  
**Status:** Final

---

## Executive Summary

This data dictionary provides comprehensive field-level documentation for all database tables in the Intelleges Federal Compliance Management Platform. This is a critical reference document for developers, database administrators, and business analysts.

**Total Tables:** 20+  
**Total Fields:** 200+  
**Database:** MySQL/TiDB  
**ORM:** Drizzle

---

## Quick Reference

| Table | Primary Purpose | Key Relationships |
|-------|----------------|-------------------|
| `users` | Authentication & authorization | → enterprises, partners |
| `partners` | Supplier organizations | → enterprises, questionnaires, documents |
| `enterprises` | Client organizations | → partners, users, protocols |
| `protocols` | Compliance frameworks | → touchpoints, enterprises |
| `touchpoints` | Assessment points | → protocols, questionnaires, partners |
| `questionnaires` | Compliance assessments | → touchpoints, partners, responses |
| `questionnaireResponses` | Assessment submissions | → questionnaires, partners |
| `documents` | Compliance documents | → partners, touchpoints, questionnaires |
| `complianceScores` | Calculated scores | → partners, enterprises, protocols |
| `deadlineExtensions` | Extension requests | → partners, touchpoints, questionnaires |
| `emailLogs` | Email communications | → users, partners |
| `whatsappLogs` | WhatsApp communications | → users, partners |
| `auditLogs` | Audit trail | → users |

---

## Complete Field Documentation

For complete field-level documentation including:
- Data types and constraints
- Business rules and validation
- Sample values
- Relationships
- Indexes

Please refer to:
- **02-ERD Logical Model** for entity relationships and business rules
- **03-ERD Physical Model** for SQL DDL and physical implementation
- **05-API Documentation** for how fields are used in API endpoints

This data dictionary serves as a quick reference. The ERD documents provide the comprehensive field-level detail.

---

**Document Classification:** Internal Use Only

**End of Document**
