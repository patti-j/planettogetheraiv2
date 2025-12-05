# Azure Database Migration Requirements
## PlanetTogether APS Platform

**Document Version:** 1.0  
**Date:** December 5, 2025  
**Prepared For:** Cloud Database Administrator  
**Prepared By:** PlanetTogether Development Team

---

## Executive Summary

PlanetTogether is an AI-first Factory Optimization Platform that requires migration from Neon Serverless PostgreSQL to Azure Database for PostgreSQL. This document outlines the technical requirements and specifications needed to provision and configure the Azure database infrastructure.

---

## 1. Current Database Architecture

### 1.1 Source Database
| Property | Value |
|----------|-------|
| **Current Provider** | Neon Serverless PostgreSQL |
| **PostgreSQL Version** | 16 (recommend matching or newer) |
| **ORM** | Drizzle ORM |
| **Connection Method** | HTTP/WebSocket via `@neondatabase/serverless` |
| **Session Storage** | PostgreSQL (`connect-pg-simple`) |

### 1.2 Connection Configuration
```
Environment Variables Required:
- DATABASE_URL (development)
- PRODUCTION_DATABASE_URL (production)

Connection String Format:
postgresql://user:password@host:5432/database?sslmode=require
```

### 1.3 Current Database Tables (Core Schema)

| Table Category | Tables | Estimated Rows |
|----------------|--------|----------------|
| **Authentication** | users, roles, permissions, role_permissions, user_roles | 100-1,000 |
| **OAuth/API** | oauth_clients, oauth_tokens, api_keys, agent_connections | 50-500 |
| **Production Data** | ptjobs, ptjoboperations, ptresources, ptplants | 1,000-100,000 |
| **Scheduling** | schedule_versions, schedule_snapshots | 100-10,000 |
| **Configuration** | widgets, optimization_algorithms, optimization_profiles | 100-1,000 |
| **Tracking** | production_orders, inventory, alerts | 1,000-50,000 |
| **Multi-tenant** | tenant_registry, tenant_databases (future) | 10-1,000 |

---

## 2. Azure Database Recommendation

### 2.1 Recommended Service
**Azure Database for PostgreSQL - Flexible Server**

> Note: Azure Single Server retired March 2025. Flexible Server is the only option.

### 2.2 Compute Tier Recommendation

| Environment | Tier | SKU | vCores | Memory | Rationale |
|-------------|------|-----|--------|--------|-----------|
| **Development** | Burstable | B1ms | 1 | 2 GB | Cost-effective for dev/test |
| **Staging** | General Purpose | D2s_v3 | 2 | 8 GB | Production-like testing |
| **Production** | General Purpose | D4s_v3 | 4 | 16 GB | AI workloads, concurrent users |
| **Production (Scale)** | Memory Optimized | E4s_v3 | 4 | 32 GB | Heavy analytics, large datasets |

### 2.3 Storage Requirements

| Environment | Initial Size | Auto-grow | IOPS |
|-------------|--------------|-----------|------|
| **Development** | 32 GB | Enabled | 120 |
| **Staging** | 64 GB | Enabled | 240 |
| **Production** | 128 GB | Enabled | 500+ |

> **Important:** Storage cannot be reduced after provisioning. Start with production estimate + 25% buffer.

---

## 3. PostgreSQL Configuration Requirements

### 3.1 Required PostgreSQL Version
- **Minimum:** PostgreSQL 14
- **Recommended:** PostgreSQL 16 or 17

### 3.2 Required Extensions
Enable these extensions in Azure Portal → Server Parameters → azure.extensions:

```sql
-- Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- Password hashing
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Query analytics

-- Optional but Recommended
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- Text search optimization
```

### 3.3 Server Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `max_connections` | 200 | Handle concurrent app connections |
| `shared_buffers` | 25% of RAM | Query caching |
| `work_mem` | 64MB | Complex query operations |
| `effective_cache_size` | 75% of RAM | Query planner optimization |
| `log_min_duration_statement` | 1000 | Log slow queries (>1s) |
| `timezone` | UTC | Consistent timestamps |
| `password_encryption` | md5 | Required for migration tools |

### 3.4 Connection Pooling
- Enable **PgBouncer** connection pooler (built into Flexible Server)
- Mode: Transaction pooling
- Pool size: 50-100 connections

---

## 4. Security Requirements

### 4.1 Network Configuration

| Requirement | Configuration |
|-------------|---------------|
| **Public Access** | Enabled (for initial migration and app access) |
| **Firewall Rules** | Whitelist application IPs only |
| **Private Endpoint** | Recommended for production (VNet integration) |
| **SSL/TLS** | Enforce SSL (minimum TLS 1.2) |

### 4.2 Authentication

| Type | Requirement |
|------|-------------|
| **Admin Account** | PostgreSQL native authentication |
| **Application User** | Dedicated service account with limited privileges |
| **Azure AD Integration** | Optional - for enterprise SSO |

### 4.3 Required Database Users

```sql
-- Application Service Account
CREATE USER planettogether_app WITH PASSWORD '<secure_password>';
GRANT CONNECT ON DATABASE planettogether TO planettogether_app;
GRANT USAGE ON SCHEMA public TO planettogether_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO planettogether_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO planettogether_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO planettogether_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO planettogether_app;

-- Read-Only Reporting Account
CREATE USER planettogether_readonly WITH PASSWORD '<secure_password>';
GRANT CONNECT ON DATABASE planettogether TO planettogether_readonly;
GRANT USAGE ON SCHEMA public TO planettogether_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO planettogether_readonly;
```

---

## 5. High Availability & Backup

### 5.1 High Availability Configuration

| Environment | HA Configuration | SLA |
|-------------|------------------|-----|
| **Development** | None | N/A |
| **Staging** | None | N/A |
| **Production** | Zone-redundant HA | 99.99% |

### 5.2 Backup Configuration

| Setting | Value |
|---------|-------|
| **Backup Retention** | 35 days (production) |
| **Geo-Redundant Backup** | Enabled (production) |
| **Point-in-Time Recovery** | Enabled |
| **Backup Window** | 2:00 AM - 4:00 AM UTC |

### 5.3 Maintenance Window
- **Preferred Window:** Sunday 2:00 AM - 4:00 AM UTC
- **Custom maintenance:** Enabled

---

## 6. Migration Requirements

### 6.1 Migration Method
**Recommended:** Azure Database Migration Service (Online Migration)

This allows minimal downtime with continuous replication until cutover.

### 6.2 Source Database Prerequisites
```sql
-- Enable logical replication on source (Neon)
-- These are typically managed by Neon, verify settings:
SHOW wal_level;          -- Should be 'logical'
SHOW max_wal_senders;    -- Should be >= 10
SHOW max_replication_slots; -- Should be >= 10
```

### 6.3 Migration Steps Summary
1. **Pre-migration validation** - Run Azure migration validator
2. **Provision target** - Create Flexible Server with higher SKU
3. **Schema migration** - Export and apply schema
4. **Data migration** - Use Azure Migration Service
5. **Validation** - Verify row counts and data integrity
6. **Cutover** - Update application connection strings
7. **Post-migration** - Scale down to production SKU

### 6.4 Estimated Migration Time

| Database Size | Offline Migration | Online Migration |
|---------------|-------------------|------------------|
| < 10 GB | 30 minutes | 1-2 hours |
| 10-50 GB | 1-2 hours | 2-4 hours |
| 50-100 GB | 2-4 hours | 4-8 hours |

---

## 7. Monitoring & Alerting

### 7.1 Azure Monitor Metrics to Track
- CPU Percentage
- Memory Percentage
- Storage Percentage
- Active Connections
- Failed Connections
- Read/Write IOPS
- Replication Lag (if using read replicas)

### 7.2 Recommended Alerts

| Metric | Threshold | Severity |
|--------|-----------|----------|
| CPU > 80% | 5 min average | Warning |
| CPU > 95% | 5 min average | Critical |
| Memory > 85% | 5 min average | Warning |
| Storage > 80% | - | Warning |
| Storage > 90% | - | Critical |
| Failed Connections > 10 | 5 min | Warning |

---

## 8. Application Configuration Changes

### 8.1 Connection String Update
```
# Current (Neon)
postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

# New (Azure)
postgresql://user:pass@planettogether.postgres.database.azure.com/planettogether?sslmode=require
```

### 8.2 Application Code Changes Required
The application currently uses `@neondatabase/serverless` driver which is Neon-specific. For Azure, we need to switch to a standard PostgreSQL driver:

**Option A: Standard pg driver (Recommended)**
```typescript
// Current
import { neon } from '@neondatabase/serverless';

// Change to
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
```

**Option B: Keep HTTP driver compatibility**
- Azure supports standard PostgreSQL connections
- May require minimal Drizzle configuration changes

### 8.3 Environment Variables
```bash
# Production Secrets (Azure Key Vault recommended)
AZURE_DATABASE_URL=postgresql://...
DATABASE_SSL_MODE=require
```

---

## 9. Cost Estimate (Monthly)

| Component | Dev | Staging | Production |
|-----------|-----|---------|------------|
| **Compute** | ~$15 | ~$100 | ~$200-400 |
| **Storage (128GB)** | ~$12 | ~$12 | ~$15 |
| **Backup Storage** | ~$5 | ~$5 | ~$15 |
| **HA (Zone-redundant)** | - | - | ~$200 |
| **Total Estimate** | ~$32 | ~$117 | ~$430-630 |

> Prices are approximate. Use [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/) for accurate estimates.

---

## 10. Timeline & Milestones

| Phase | Duration | Activities |
|-------|----------|------------|
| **Phase 1: Setup** | 1 week | Provision Azure resources, configure networking |
| **Phase 2: Test Migration** | 1 week | Migrate to staging, validate functionality |
| **Phase 3: App Update** | 1-2 weeks | Update connection drivers, test application |
| **Phase 4: Production Migration** | 1 day | Online migration with minimal downtime |
| **Phase 5: Validation** | 1 week | Monitor performance, tune configuration |

---

## 11. Contacts & Escalation

| Role | Contact | Responsibility |
|------|---------|----------------|
| **Development Lead** | TBD | Application changes, testing |
| **Cloud DB Admin** | TBD | Azure provisioning, migration |
| **DevOps** | TBD | CI/CD updates, secrets management |
| **Project Manager** | TBD | Timeline, coordination |

---

## 12. Appendix

### A. Current Schema Export Command
```bash
# Export schema from Neon
pg_dump --schema-only -d $DATABASE_URL > schema.sql

# Export data
pg_dump --data-only -d $DATABASE_URL > data.sql
```

### B. Useful Azure CLI Commands
```bash
# Create Flexible Server
az postgres flexible-server create \
  --resource-group planettogether-rg \
  --name planettogether-db \
  --location eastus \
  --admin-user ptadmin \
  --admin-password <password> \
  --sku-name Standard_D4s_v3 \
  --tier GeneralPurpose \
  --version 16 \
  --storage-size 128 \
  --high-availability ZoneRedundant

# Enable extensions
az postgres flexible-server parameter set \
  --resource-group planettogether-rg \
  --server-name planettogether-db \
  --name azure.extensions \
  --value "uuid-ossp,pgcrypto,pg_stat_statements"
```

### C. References
- [Azure Database for PostgreSQL Documentation](https://learn.microsoft.com/en-us/azure/postgresql/)
- [Migration Service Overview](https://learn.microsoft.com/en-us/azure/postgresql/migrate/migration-service/overview-migration-service-postgresql)
- [Best Practices for Migration](https://learn.microsoft.com/en-us/azure/postgresql/migrate/migration-service/best-practices-migration-service-postgresql)
- [Drizzle ORM PostgreSQL Guide](https://orm.drizzle.team/docs/get-started-postgresql)

---

**Document Status:** Ready for Review  
**Next Steps:** Cloud DB Admin to review and schedule provisioning discussion
