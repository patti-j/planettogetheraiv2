# Workday Log

## December 9, 2025

### Max AI Stop Button ✅
Added a visible stop button when Max AI is processing a request.

**Changes:**
- Added thinking indicator with animated bouncing dots
- Red "Stop" button appears during processing
- Clicking Stop cancels the request via AbortController
- Shows "Request cancelled." message when stopped

**Files Modified:**
- `client/src/components/navigation/ai-left-panel.tsx` - Added thinking UI with stop button

### Knowledge Base RAG Integration ✅
Integrated knowledge base retrieval-augmented generation (RAG) into Max AI for documentation-based responses.

**RAG Architecture:**
- Added `isKnowledgeQuestion()` to detect help/how-to queries (how, what, explain, guide, etc.)
- Created `generateKBResponse()` method for KB-augmented answers
- Uses `knowledgeRetrievalService.search()` with 0.3 score threshold
- Builds prompt with retrieved passages and citation markers [1], [2], [3]

**Max AI Integration:**
- KB check happens after playbooks but before internal data analysis
- Successful KB hits return early with sources array
- Response includes `sources: KBSource[]` for citation display

**Frontend UI Changes:**
- Updated `MaxResponse` interface with `sources?: KBSource[]` field
- AI panel displays "Sources" section with BookOpen icon for KB responses
- External links have ExternalLink icon and open in new tab
- Shows top 3 sources as clickable citations

**HubSpot KB Import:**
- Created `scripts/import-knowledge-base.ts` for monthly refresh
- Handles UTF-16 encoded HubSpot TSV exports
- Strips HTML, chunks content (~400 tokens), creates DB records
- Successfully imported 168 articles from HubSpot export
- Created documentation: `docs/KNOWLEDGE-BASE-IMPORT.md`

**Files Created:**
- `scripts/import-knowledge-base.ts` - Reusable import script
- `docs/KNOWLEDGE-BASE-IMPORT.md` - Monthly refresh documentation

**Files Modified:**
- `server/services/max-ai-service.ts` - RAG import, KBSource interface, isKnowledgeQuestion(), generateKBResponse(), flow integration
- `client/src/components/navigation/ai-left-panel.tsx` - Sources display, ExternalLink import, addMessage with sources

### Ad-Hoc Reporting Agent Implementation ✅
Implemented a new specialized agent for on-demand report generation.

**Agent Features:**
- Template-based report system with 7 report types
- Trigger keyword matching with action/report synonyms
- Filter extraction (date ranges, priority, top N)
- Direct database queries with proper schema joins

**Report Types Implemented:**
1. Late Jobs Overview - Jobs past need date with days late
2. Bottleneck Operations - Top operations by duration
3. Resource Utilization - Scheduled hours and utilization %
4. WIP Aging - In-progress jobs bucketed by age
5. On-Time Delivery - OTD% with at-risk detection
6. Setup vs Run Time - Setup percentage by resource
7. Capacity Load vs Available - Overload detection

**Schema Compliance:**
- Uses `ptresources.name` (not resource_name)
- Joins on `ptresources.id::text = ptjobresources.default_resource_id`
- CTEs for complex aggregations (OTD report)

**Frontend Integration:**
- New `open_report` action type in MaxResponse
- AI panel handler creates canvas table widgets
- Session storage for report data persistence

**Files Created:**
- `server/services/agents/adhoc-reporting-templates.ts`
- `server/services/agents/adhoc-reporting-agent.service.ts`
- `server/training/agents/adhoc-reporting-agent.md`

**Files Modified:**
- `server/services/agents/agent-registry.ts` - Register agent
- `server/services/max-ai-service.ts` - Add open_report action
- `client/src/components/navigation/ai-left-panel.tsx` - Handle open_report

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
