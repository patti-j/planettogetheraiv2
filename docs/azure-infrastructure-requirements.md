# Azure Infrastructure Migration Requirements
## PlanetTogether APS Platform - Full Application Migration

**Document Version:** 1.0  
**Date:** December 5, 2025  
**Prepared For:** Cloud Administration Team  
**Prepared By:** PlanetTogether Development Team

---

## Executive Summary

PlanetTogether is an AI-first Factory Optimization Platform currently hosted on Replit. This document outlines requirements for migrating the complete application stack to Azure infrastructure, including compute, database, storage, and supporting services.

---

## 1. Current Application Architecture

### 1.1 Technology Stack

| Layer | Technology | Details |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | Vite build, Shadcn/UI, TailwindCSS |
| **Backend** | Express.js + TypeScript | RESTful API, WebSocket support |
| **Database** | PostgreSQL (Neon Serverless) | Drizzle ORM |
| **AI/ML** | OpenAI API | GPT-5.1, Whisper, TTS, Realtime API |
| **Session Storage** | PostgreSQL | connect-pg-simple |
| **Gantt Charts** | Bryntum Scheduler Pro | Licensed component |
| **Real-time** | WebSocket + SSE | Voice chat, live updates |

### 1.2 Application Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Express.js Server                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   REST API   │  │  WebSocket   │  │     SSE      │       │
│  │   Routes     │  │   Handler    │  │   Handler    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   AI Agents  │  │  Scheduling  │  │   Reports    │       │
│  │   (Max AI)   │  │  Algorithms  │  │   Generator  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│        PostgreSQL (Neon) OR Azure SQL Database              │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 External Service Dependencies

| Service | Purpose | Azure Alternative |
|---------|---------|-------------------|
| OpenAI API | AI chat, voice, scheduling | Azure OpenAI Service |
| Neon PostgreSQL | Primary database | Azure PostgreSQL / Azure SQL |
| Replit hosting | Compute, CDN | Azure App Service / AKS |

---

## 2. Azure Compute Options

### 2.1 Recommended: Azure App Service

**Best for:** Simplified deployment, auto-scaling, minimal DevOps overhead

| Setting | Development | Staging | Production |
|---------|-------------|---------|------------|
| **Plan** | B1 | S2 | P2v3 |
| **vCPUs** | 1 | 2 | 4 |
| **Memory** | 1.75 GB | 3.5 GB | 8 GB |
| **Instance Count** | 1 | 1-2 | 2-4 (auto-scale) |
| **Deployment Slots** | No | Yes (1) | Yes (2+) |

**Configuration Requirements:**
- Node.js 20 LTS runtime
- WebSocket support enabled
- Always On enabled (Production)
- 64-bit platform
- HTTPS Only

### 2.2 Alternative: Azure Container Apps

**Best for:** Container-based deployment, microservices readiness

| Setting | Development | Production |
|---------|-------------|------------|
| **Min Replicas** | 0 | 2 |
| **Max Replicas** | 1 | 10 |
| **CPU** | 0.5 | 2.0 |
| **Memory** | 1 GB | 4 GB |

### 2.3 Alternative: Azure Kubernetes Service (AKS)

**Best for:** Full container orchestration, multi-tenant isolation, maximum control

| Component | Specification |
|-----------|---------------|
| **Node Pool** | Standard_D4s_v3 (4 vCPU, 16 GB) |
| **Node Count** | 3 (production) |
| **Container Registry** | Azure Container Registry (Basic/Standard) |

---

## 3. Database Options

### DECISION REQUIRED: PostgreSQL vs Azure SQL Database

The Cloud Admin team should evaluate which database platform best fits enterprise requirements.

### 3.1 Option A: Azure Database for PostgreSQL (Flexible Server)

**Pros:**
- Minimal application code changes
- Drizzle ORM works natively
- Direct migration from Neon PostgreSQL
- Lower migration risk

**Cons:**
- Less integration with Power BI (needs gateway)
- Separate from Azure SQL ecosystem

| Environment | Tier | SKU | Storage |
|-------------|------|-----|---------|
| Development | Burstable | B1ms | 32 GB |
| Staging | General Purpose | D2s_v3 | 64 GB |
| Production | General Purpose | D4s_v3 | 128 GB |

**Code Changes Required:** Minimal - switch from `@neondatabase/serverless` to standard `pg` driver

### 3.2 Option B: Azure SQL Database

**Pros:**
- Native Power BI integration
- Tight Azure ecosystem integration
- Advanced security features (TDE, Always Encrypted)
- Familiar to enterprise DBAs

**Cons:**
- Requires schema conversion (PostgreSQL → T-SQL)
- Application code changes (Drizzle config, some SQL syntax)
- More complex migration

| Environment | Tier | DTUs/vCores | Storage |
|-------------|------|-------------|---------|
| Development | Basic | 5 DTU | 2 GB |
| Staging | Standard | S2 (50 DTU) | 250 GB |
| Production | Premium | P2 (250 DTU) | 500 GB |

**Code Changes Required:**
```typescript
// Current (PostgreSQL)
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

// Azure SQL Database
import { drizzle } from 'drizzle-orm/mssql';
import { sqlTable, int, nvarchar } from 'drizzle-orm/mssql-core';
```

**Schema Migration Considerations:**
| PostgreSQL | Azure SQL Equivalent |
|------------|---------------------|
| `serial` | `int IDENTITY(1,1)` |
| `text` | `nvarchar(max)` |
| `jsonb` | `nvarchar(max)` with JSON functions |
| `timestamp` | `datetime2` |
| `boolean` | `bit` |

---

## 4. Supporting Azure Services

### 4.1 Required Services

| Service | Purpose | Tier |
|---------|---------|------|
| **Azure Key Vault** | Secrets management (API keys, connection strings) | Standard |
| **Azure Application Insights** | Application monitoring, logging | Pay-as-you-go |
| **Azure Blob Storage** | File uploads, assets, backups | Standard LRS |
| **Azure CDN** | Static asset delivery | Standard Microsoft |

### 4.2 Recommended Services

| Service | Purpose | Tier |
|---------|---------|------|
| **Azure Cache for Redis** | Session caching, performance | Basic C0 (dev), Standard C1 (prod) |
| **Azure Front Door** | Global load balancing, WAF | Standard |
| **Azure OpenAI Service** | AI capabilities (optional migration from OpenAI) | Pay-as-you-go |

### 4.3 Optional Services

| Service | Purpose | When Needed |
|---------|---------|-------------|
| **Azure Service Bus** | Message queuing | Multi-region, async processing |
| **Azure Functions** | Serverless background tasks | Scheduled jobs, webhooks |
| **Azure Log Analytics** | Centralized logging | Compliance requirements |

---

## 5. Security Requirements

### 5.1 Identity & Access

| Requirement | Azure Service |
|-------------|---------------|
| Application Identity | Managed Identity (System-assigned) |
| User Authentication | Azure AD B2C (optional) |
| API Authentication | Azure AD App Registration |
| Secrets | Azure Key Vault |

### 5.2 Network Security

| Requirement | Configuration |
|-------------|---------------|
| **Virtual Network** | Dedicated VNet for production |
| **Private Endpoints** | Database, Key Vault, Storage |
| **NSG Rules** | Restrict inbound to HTTPS (443) |
| **WAF** | Azure Front Door WAF policies |
| **DDoS Protection** | Standard tier for production |

### 5.3 Data Security

| Requirement | Implementation |
|-------------|----------------|
| Encryption at Rest | Enabled by default (all services) |
| Encryption in Transit | TLS 1.2+ enforced |
| Database Encryption | TDE (Transparent Data Encryption) |
| Backup Encryption | Enabled with customer-managed keys |

---

## 6. Environment Configuration

### 6.1 Environment Variables / App Settings

```bash
# Database (Option A: PostgreSQL)
DATABASE_URL=postgresql://user:pass@server.postgres.database.azure.com/planettogether?sslmode=require

# Database (Option B: Azure SQL)
DATABASE_URL=Server=server.database.windows.net;Database=planettogether;User Id=user;Password=pass;Encrypt=true;

# AI Services
OPENAI_API_KEY=@Microsoft.KeyVault(SecretUri=https://vault.vault.azure.net/secrets/openai-key/)
# OR use Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=@Microsoft.KeyVault(...)

# Application
NODE_ENV=production
PORT=8080
SESSION_SECRET=@Microsoft.KeyVault(...)

# Storage
AZURE_STORAGE_CONNECTION_STRING=@Microsoft.KeyVault(...)
AZURE_STORAGE_CONTAINER=uploads

# Redis Cache (if used)
REDIS_URL=your-cache.redis.cache.windows.net:6380,password=...,ssl=True
```

### 6.2 Key Vault Secrets Required

| Secret Name | Description |
|-------------|-------------|
| `database-connection-string` | Full database connection string |
| `openai-api-key` | OpenAI or Azure OpenAI key |
| `session-secret` | Express session encryption key |
| `storage-connection-string` | Azure Blob Storage connection |
| `bryntum-license-key` | Bryntum Scheduler Pro license |

---

## 7. CI/CD Pipeline

### 7.1 Recommended: Azure DevOps or GitHub Actions

```yaml
# GitHub Actions Example
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install and Build
        run: |
          npm ci
          npm run build
          
      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v3
        with:
          app-name: 'planettogether-prod'
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
          package: .
```

### 7.2 Deployment Slots Strategy

| Slot | Purpose |
|------|---------|
| **Production** | Live traffic |
| **Staging** | Pre-production testing, swap target |
| **Development** | Feature testing |

---

## 8. Monitoring & Observability

### 8.1 Application Insights Configuration

| Metric Category | Tracked Items |
|-----------------|---------------|
| **Requests** | Response time, failure rate, throughput |
| **Dependencies** | Database calls, external API calls |
| **Exceptions** | Error stack traces, error rates |
| **Custom Events** | AI agent usage, scheduling runs |
| **Performance** | CPU, memory, WebSocket connections |

### 8.2 Alerting Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | >5% failures in 5 min | Critical |
| Slow Response | Avg response >3s | Warning |
| Database Latency | >500ms average | Warning |
| CPU High | >80% for 10 min | Warning |
| Memory High | >85% for 10 min | Warning |
| WebSocket Failures | >10 failures/min | Warning |

---

## 9. Cost Estimate (Monthly)

### 9.1 Development Environment

| Service | SKU | Estimated Cost |
|---------|-----|----------------|
| App Service | B1 | $13 |
| PostgreSQL Flexible | B1ms | $15 |
| *or* Azure SQL | Basic | $5 |
| Key Vault | Standard | $0.03/operation |
| Storage | LRS 10GB | $2 |
| **Total** | | **~$35-50** |

### 9.2 Production Environment

| Service | SKU | Estimated Cost |
|---------|-----|----------------|
| App Service | P2v3 (2 instances) | $400 |
| PostgreSQL Flexible | D4s_v3 + HA | $600 |
| *or* Azure SQL | P2 | $460 |
| Redis Cache | C1 Standard | $80 |
| Key Vault | Standard | $5 |
| Storage | LRS 100GB | $10 |
| CDN | Standard | $20 |
| Application Insights | Pay-as-you-go | $50 |
| **Total** | | **~$1,165-1,300** |

> Use [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/) for precise estimates.

---

## 10. Migration Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| **Phase 1: Planning** | 1 week | Finalize architecture decisions (DB choice), resource provisioning plan |
| **Phase 2: Infrastructure Setup** | 1-2 weeks | Provision Azure resources, configure networking, set up Key Vault |
| **Phase 3: Application Adaptation** | 2-3 weeks | Update code for Azure (DB driver, config), containerize if needed |
| **Phase 4: Test Migration** | 1-2 weeks | Deploy to staging, migrate test data, validate functionality |
| **Phase 5: Production Migration** | 1 week | Final data migration, DNS cutover, monitoring validation |
| **Phase 6: Optimization** | Ongoing | Performance tuning, cost optimization, scaling adjustments |

**Total Estimated Timeline: 6-10 weeks**

---

## 11. Questions for Cloud Admin

Please provide guidance on the following:

### Database Decision
1. **Can we use Azure Database for PostgreSQL?** This minimizes code changes and migration risk.
2. **Or must we migrate to Azure SQL Database?** This requires schema conversion and code changes but offers better Azure integration.

### Infrastructure
3. What Azure region(s) should we target?
4. Are there existing VNets we should integrate with?
5. What naming conventions should we follow?
6. Are there compliance requirements (HIPAA, SOC2, etc.)?

### Security
7. Should we integrate with Azure AD for user authentication?
8. Are there existing Azure Key Vault instances to use?
9. What backup retention policies are required?

### Operations
10. What monitoring/alerting systems are already in place?
11. Who will manage the Azure resources post-migration?
12. What is the change management process for production deployments?

---

## 12. Appendix

### A. Current Package Dependencies

Key packages that may need Azure-specific versions:
- `@neondatabase/serverless` → `pg` or `mssql`
- `connect-pg-simple` → may need `connect-mssql` for Azure SQL
- `drizzle-orm` → supports both PostgreSQL and MSSQL

### B. Resource Naming Convention (Suggested)

```
Format: {company}-{app}-{environment}-{resource}

Examples:
- pt-planettogether-prod-app (App Service)
- pt-planettogether-prod-db (Database)
- pt-planettogether-prod-kv (Key Vault)
- pt-planettogether-prod-st (Storage)
```

### C. References

- [Azure App Service Documentation](https://learn.microsoft.com/en-us/azure/app-service/)
- [Azure Database for PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/)
- [Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/)
- [Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/)
- [Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/)

---

**Document Status:** Ready for Cloud Admin Review  
**Key Decision Required:** Database platform selection (PostgreSQL vs Azure SQL)  
**Next Steps:** Schedule architecture review meeting with Cloud Admin team
