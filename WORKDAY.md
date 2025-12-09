# Workday Log

## December 9, 2025

### Max AI Agent System - Three-Phase Implementation ✅
Collaborated with ChatGPT 5.1 to implement systematic agent improvements.

- **Phase 1**: Routing & Connectivity - verified `/api/ai-agent/command` and `/api/max-ai/chat`
- **Phase 2**: Agent Attribution (`agentId`/`agentName`) + Navigation detection (11 pages)
- **Phase 3**: Tool-calling actions (`apply_algorithm`, `refresh_scheduler`)

Files: `server/services/max-ai-service.ts`

### Browser Console Fixes
- Fixed `QuotaExceededError` in localStorage - store minimal user object instead of full userData
- Vite HMR connection errors (port 24678) - dev-only, not affecting production

Files: `client/src/App.tsx`

### URL Investigation
- Verified scheduler uses relative paths (`/api/resources`, `/api/pt-operations`, etc.)
- No hardcoded Replit URLs found in `public/production-scheduler.html`
- Connection errors are Vite HMR (Hot Module Replacement), not API failures

### Job Name/Batch Search Enhancement ✅
Updated Max AI to recognize jobs by name and batch references, not just IDs.

**Changes:**
- Added `searchJobByName()` method to Production Scheduling Agent
- Updated `handleJobQuery()` to detect name-based status queries before falling back to generic status
- Flexible search pattern removes `#`, `-`, `_` for fuzzy matching

**Supported queries:**
- "What is the status of Porter Batch 105?" → Finds "Porter Batch #105"
- "What is the status of Dark Stout?" → Finds "Dark Stout #103"
- "What is the status of batch 105?" → Finds matching batch

Files: `server/services/agents/production-scheduling-agent.service.ts`, `server/services/max-ai-service.ts`

### SQL Query Schema Fixes ✅
Fixed critical SQL errors in Max AI resource, bottleneck, and location queries.

**Root Cause:**
- `ptresources` table uses `name` column (not `resource_name`)
- `ptjobresources.default_resource_id` (varchar) references `ptresources.id` (not `resource_id`)
- Plants are accessed via `ptplants` join on `plant_id`, not `plant_name` column

**Fixes Applied:**
- All resource queries use `r.name as resource_name` 
- Changed joins from `r.resource_id::text` to `r.id::text` for proper matching
- Added `ptplants` join for plant-based queries
- Used `resource_type` as department proxy (no departments table exists)

**Working Queries Now:**
- "resource utilization" - Shows busy/idle resources
- "bottleneck operations" - Shows longest operations with resource names
- "jobs by plant" - Shows job counts per plant (Amsterdam Brewery: 5)
- "jobs at plant Amsterdam" - Lists jobs at specific plant
- "jobs by department" - Uses resource_type as fallback

Files: `server/services/agents/production-scheduling-agent.service.ts`
