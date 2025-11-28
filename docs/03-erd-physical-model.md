# Intelleges Federal Compliance Management Platform
## ERD Physical Model
### Physical Database Implementation

**Document Reference:** COMP.DOC.03  
**Version:** 1.0  
**Date:** November 27, 2025  
**Author:** Intelleges Technical Team  
**Status:** Final

---

## Executive Summary

This document presents the physical database implementation for the Intelleges Federal Compliance Management Platform using MySQL/TiDB with Drizzle ORM. The physical model implements the logical design with optimized indexes, constraints, and performance tuning.

---

## Database Configuration

**Database Engine:** MySQL 8.0+ / TiDB  
**Character Set:** utf8mb4  
**Collation:** utf8mb4_unicode_ci  
**ORM:** Drizzle  
**Migration Tool:** Drizzle Kit  

---

## Schema Implementation

The complete physical schema is implemented in `/drizzle/schema.ts` using Drizzle ORM's declarative syntax. All tables use:

- **Primary Keys:** Auto-incrementing INT
- **Foreign Keys:** INT with ON DELETE CASCADE or RESTRICT
- **Timestamps:** TIMESTAMP with DEFAULT NOW() and ON UPDATE NOW()
- **Enums:** MySQL ENUM types for fixed value sets
- **JSON:** MySQL JSON type for flexible data structures

---

## Index Strategy

### Primary Indexes
- All tables have clustered index on `id` (primary key)

### Foreign Key Indexes
- All foreign key columns have non-clustered indexes for join performance

### Query Optimization Indexes
- Composite indexes on frequently queried column combinations
- Status + date indexes for filtered queries
- Partner + status indexes for dashboard queries

---

## Performance Optimization

### Connection Pooling
- Minimum connections: 5
- Maximum connections: 20
- Idle timeout: 30 seconds

### Query Optimization
- Use prepared statements for all queries
- Implement pagination for large result sets
- Use covering indexes where possible

### Caching Strategy
- Application-level caching for reference data (protocols, touchpoints)
- Query result caching for compliance scores (5-minute TTL)
- No caching for real-time data (questionnaire submissions, document uploads)

---

## Backup & Recovery

### Backup Schedule
- Full backup: Daily at 2:00 AM UTC
- Incremental backup: Every 6 hours
- Transaction log backup: Every hour

### Retention Policy
- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups: 7 years (compliance requirement)

### Recovery Objectives
- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 1 hour

---

## Migration Management

All schema changes managed through Drizzle Kit migrations:

```bash
# Generate migration
pnpm db:generate

# Apply migration
pnpm db:push

# Rollback migration
pnpm db:drop
```

Migration files stored in `/drizzle/migrations/` with sequential numbering.

---

**Document Classification:** Internal Use Only

**End of Document**
