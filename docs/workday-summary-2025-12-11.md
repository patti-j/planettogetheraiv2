# Workday Summary - December 11, 2025

## Overview
Focused on fixing AI agent functionality, specifically the Ad-Hoc Reporting Agent display issues and GPT-5.1 configuration.

## Completed Tasks

### 1. GPT-5.1 Token Configuration Fix
- **Issue**: AI responses were coming back empty
- **Root Cause**: `max_completion_tokens` was set to 800, but GPT-5.1's adaptive reasoning consumes tokens before generating output
- **Fix**: Increased `max_completion_tokens` to 4096 in `server/config/ai-model.ts`
- **Technical Note**: GPT-5.1 uses `max_completion_tokens` parameter (not `max_tokens`). When `finish_reason: "length"` appears, it indicates token exhaustion.

### 2. Stop Button for AI Responses
- **Feature**: Added ability to cancel AI requests mid-flight
- **Implementation**: 
  - Send button transforms to red stop button when `isSendingCommand=true`
  - Uses AbortController to cancel the fetch request
  - Calls `cancelMaxRequest()` on click
- **File**: `client/src/components/navigation/ai-left-panel.tsx`

### 3. Ad-Hoc Report Display Fix (4-Part Fix)
Reports were only showing as text in chat instead of visual tables on Canvas.

#### Fix 3a: Agent Registration Order
- **File**: `server/services/agents/agent-registry.ts`
- **Change**: Ad-Hoc Reporting Agent now registered FIRST (before Production Scheduling Agent)
- **Reason**: Report requests were being captured by Production Scheduling Agent which doesn't return `open_report` actions

#### Fix 3b: Action Passthrough in Backend
- **File**: `server/ai-agent.ts`
- **Change**: Added `action: agentResponse.action` to the return object
- **Reason**: The `open_report` action was not being passed through to the frontend

#### Fix 3c: Frontend Action Handling
- **File**: `client/src/components/navigation/ai-left-panel.tsx`
- **Change**: Added handling for `result.action?.type === 'open_report'` in `handleSendMessage`
- **Behavior**: Creates table widget, saves to canvas, navigates to Canvas page

#### Fix 3d: SQL Query Column Name
- **File**: `server/services/agents/adhoc-reporting-agent.service.ts`
- **Change**: Changed `j.status` to `j.scheduled_status` in Late Jobs query
- **Reason**: The `ptjobs` table doesn't have a `status` column - it's called `scheduled_status`

### 4. Knowledge Base System Verification
- Confirmed 184 articles and 1,035 searchable chunks are working with GPT-5.1
- RAG system operational with source citations in UI

## Report Action Flow (Technical Reference)
```
User: "run Late Jobs Overview"
    ↓
Backend: Ad-Hoc Reporting Agent processes request
    ↓
Backend returns: { action: { type: 'open_report', data: {...} } }
    ↓
Frontend: handleSendMessage detects open_report action
    ↓
Frontend: Creates table widget with report data
    ↓
Frontend: Saves widget to canvas database
    ↓
Frontend: Navigates to /canvas page
    ↓
User sees: Visual table with Late Jobs data
```

## Files Modified
- `server/config/ai-model.ts` - Token configuration
- `server/services/agents/agent-registry.ts` - Agent registration order
- `server/ai-agent.ts` - Action passthrough
- `server/services/agents/adhoc-reporting-agent.service.ts` - SQL column fix
- `client/src/components/navigation/ai-left-panel.tsx` - Stop button, action handling

## Max AI Queries Tested (Before Ad-Hoc Reports)

### 1. Job Status Queries
| Query | Expected Behavior |
|-------|-------------------|
| `"job 64"` | Returns job status with progress, on-time status |
| `"status of job 64"` | Returns detailed job information |
| `"what about the wheat beer job"` | Searches by job name, returns status |
| `"Porter batch 105"` | Searches by batch name with number |
| `"list jobs"` | Lists all jobs in the system |

### 2. Knowledge Base Queries  
| Query | Expected Behavior |
|-------|-------------------|
| `"What is PlanetTogether?"` | RAG response with KB sources |
| `"How does ASAP scheduling work?"` | KB article with citations |
| General product questions | GPT-5.1 synthesized answer from KB chunks |

### 3. Scheduling Commands
| Query | Expected Behavior |
|-------|-------------------|
| `"run ASAP"` | Applies ASAP scheduling algorithm (forward) |
| `"apply ALAP"` | Applies ALAP scheduling algorithm (backward) |
| `"run ASAP backward"` | ASAP with backward direction |
| `"refresh the scheduler"` | Refreshes production scheduler view |

### 4. Navigation Commands
| Query | Expected Behavior |
|-------|-------------------|
| `"take me to production scheduler"` | Navigates to /production-scheduler |
| `"go to dashboard"` | Navigates to /home |
| `"open control tower"` | Navigates to /control-tower |
| `"go to jobs"` | Navigates to /jobs |
| `"open master data"` | Navigates to /master-data |

### 5. Chart/Visualization Queries
| Query | Expected Behavior |
|-------|-------------------|
| `"plot jobs by priority"` | Creates chart widget on canvas |
| `"create a chart of resource utilization"` | Dynamic chart generation |
| `"visualize production schedule"` | Chart with SQL generation |

### 6. Agent Switching
| Query | Expected Behavior |
|-------|-------------------|
| `"speak to production scheduling agent"` | Switches active agent |
| `"talk to quality analysis"` | Switches to quality agent |

---

## General Max AI Query Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER PROMPT                                       │
│              (typed in Max AI panel or voice input)                         │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (ai-left-panel.tsx)                           │
│  handleSendMessage() → POST /api/ai-agent/command                           │
│  - Sends: { command: "user prompt", attachments: [...] }                    │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BACKEND ROUTER (routes.ts)                             │
│  POST /api/ai-agent/command → processCommand()                              │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      COMMAND PROCESSOR (ai-agent.ts)                        │
│  processCommand() - Main orchestration function                             │
│                                                                             │
│  STEP 1: isSpecificAgentQuery() - Pattern matching                          │
│    Patterns: /job\s+\d+/, /run\s+asap/, /generate\s+report/, etc.           │
│    If TRUE → Route to Agent Registry                                        │
│    If FALSE → Skip to Step 2                                                │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
              ▼                                               ▼
┌─────────────────────────────────┐         ┌─────────────────────────────────┐
│    AGENT REGISTRY               │         │    DIRECT JOB LOOKUP            │
│    (agent-registry.ts)          │         │    (ai-agent.ts)                │
│                                 │         │                                 │
│  findBestAgent() checks:        │         │  Pattern: /job[-\s#]*(\d+)/     │
│  1. Ad-Hoc Reporting Agent      │         │  If match → getJobStatus()      │
│  2. FPA Agent                   │         │  Returns job details directly   │
│  3. Production Scheduling Agent │         │                                 │
│                                 │         │  If no match → Fall through     │
│  Returns specialized response   │         │                                 │
│  OR falls through               │         │                                 │
└────────────────┬────────────────┘         └────────────────┬────────────────┘
                 │                                           │
                 └───────────────────┬───────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MAX AI SERVICE (max-ai-service.ts)                     │
│                      generateResponse() - Main AI orchestration             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PRIORITY 0: DETERMINISTIC NAVIGATION                               │    │
│  │ detectNavigationIntent() - Rule-based, no OpenAI                   │    │
│  │ "go to dashboard" → { action: 'navigate', target: '/home' }        │    │
│  │ "take me to production scheduler" → /production-scheduler          │    │
│  │ If match → RETURN IMMEDIATELY (no OpenAI call)                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     │                                       │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PRIORITY 0.5: DETERMINISTIC SCHEDULING                             │    │
│  │ detectSchedulingActionIntent() - Rule-based, no OpenAI             │    │
│  │ "run ASAP" → { action: 'apply_algorithm', data: {algorithm:'ASAP'}}│    │
│  │ "apply ALAP" → { action: 'apply_algorithm', data: {algorithm:'ALAP'}}   │
│  │ "refresh scheduler" → { action: 'refresh_scheduler' }              │    │
│  │ If match → RETURN IMMEDIATELY (no OpenAI call)                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     │                                       │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PRIORITY 1: CHART/VISUALIZATION KEYWORDS                           │    │
│  │ Keywords: 'plot', 'graph', 'chart', 'visualize'                    │    │
│  │ getDynamicChart() → OpenAI for intent extraction + SQL generation  │    │
│  │ If match → Create chart widget, RETURN                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     │                                       │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PRIORITY 2: KNOWLEDGE BASE CHECK                                   │    │
│  │ isKnowledgeQuestion() - Check if question about PlanetTogether     │    │
│  │ knowledgeRetrievalService.search() → Semantic + keyword search     │    │
│  │ Returns KB chunks with embeddings similarity scores                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     │                                       │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PRIORITY 3: INTERNAL DATA QUERY                                    │    │
│  │ analyzeInternalDataQuery() - Job status, resource info, etc.       │    │
│  │ Patterns: job numbers, batch names, "list jobs", "show resources"  │    │
│  │ Database queries → Return formatted response                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     │                                       │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PRIORITY 4: AI INTENT ANALYSIS                                     │    │
│  │ analyzeUserIntentWithAI() → OpenAI call to determine intent        │    │
│  │ Intent types: navigate, show_data, create_chart, switch_agent      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     │                                       │
│                                     ▼                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPENAI API CALL                                     │
│                         (ai-model.ts config)                                │
│                                                                             │
│  Model: gpt-5.1                                                             │
│  Parameters:                                                                │
│    - max_completion_tokens: 4096 (increased from 800)                       │
│    - reasoning_effort: "low" | "medium" | "high" (adaptive reasoning)       │
│    - temperature: 0.7                                                       │
│                                                                             │
│  Request body:                                                              │
│  {                                                                          │
│    model: "gpt-5.1",                                                        │
│    messages: [                                                              │
│      { role: "system", content: "You are Max AI..." },                      │
│      { role: "user", content: "<user prompt>" },                            │
│      ...conversation history...                                             │
│    ],                                                                        │
│    max_completion_tokens: 4096                                              │
│  }                                                                          │
│                                                                             │
│  For KB questions, system prompt includes:                                  │
│    - Retrieved KB chunks (RAG context)                                      │
│    - Source citations                                                       │
│    - Instructions to synthesize answer                                      │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPENAI RESPONSE                                     │
│                                                                             │
│  {                                                                          │
│    choices: [{                                                              │
│      message: { content: "AI generated response..." },                      │
│      finish_reason: "stop" | "length"                                       │
│    }],                                                                      │
│    usage: { completion_tokens: X, prompt_tokens: Y }                        │
│  }                                                                          │
│                                                                             │
│  Note: finish_reason: "length" = token exhaustion (increase max_tokens)     │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RESPONSE FORMATTING                                 │
│                         (max-ai-service.ts)                                 │
│                                                                             │
│  {                                                                          │
│    content: "Formatted response with markdown...",                          │
│    action: { type: 'navigate' | 'open_report' | ... },                      │
│    data: { sources: [...KB sources...] },                                   │
│    agentId: 'max',                                                          │
│    agentName: 'Max'                                                         │
│  }                                                                          │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND DISPLAY                                    │
│                         (ai-left-panel.tsx)                                 │
│                                                                             │
│  1. Add message to chat history                                             │
│  2. Display with markdown rendering                                         │
│  3. Show KB source citations if present                                     │
│  4. Handle actions (navigate, open_report, etc.)                            │
│  5. Optional: Text-to-speech via OpenAI TTS-1                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Ad-Hoc Report Queries (Current Focus)

### Primary Test Query
```
"run Late Jobs Overview"
```
This was the main test case that revealed the SQL column name bug (`j.status` → `j.scheduled_status`).

### Available Ad-Hoc Report Queries (12 total)

| Report | Example Queries |
|--------|----------------|
| Late Jobs Overview | "run Late Jobs Overview", "show me late jobs", "which jobs are behind schedule" |
| Late Jobs by Customer | "show late jobs by customer", "overdue orders by customer" |
| Bottleneck Operations | "show bottleneck operations", "where are my bottlenecks", "longest operations" |
| Resource Utilization | "show resource utilization", "how busy are my machines", "capacity usage report" |
| WIP Aging | "show WIP aging report", "work in progress aging", "WIP summary" |
| On-Time Delivery (OTD) | "show on time delivery report", "OTD summary", "service level report" |
| Setup vs Run Time | "show setup vs run time", "changeover time report", "setup time analysis" |
| Capacity Load vs Available | "show capacity load report", "load vs capacity", "capacity analysis" |
| Changeover Time by Resource | "show changeover times by resource" |
| Inventory Coverage | "show inventory coverage report" |
| Schedule Stability | "show schedule stability report" |
| OEE Summary | "show OEE summary", "overall equipment effectiveness" |

## Query Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INPUT                                        │
│                    "run Late Jobs Overview"                                 │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (ai-left-panel.tsx)                           │
│  handleSendMessage() → POST /api/ai-agent/command                           │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (ai-agent.ts)                                  │
│  processCommand() → isSpecificAgentQuery() returns TRUE                     │
│  Pattern matched: /late\s+jobs|bottleneck|capacity\s+load/i                 │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   AGENT REGISTRY (agent-registry.ts)                        │
│  findBestAgent() → Checks agents in registration order:                     │
│    1. Ad-Hoc Reporting Agent ← MATCHES (has "late jobs" trigger)            │
│    2. FPA Agent                                                             │
│    3. Production Scheduling Agent                                           │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              AD-HOC REPORTING AGENT (adhoc-reporting-agent.service.ts)      │
│  canHandle() → TRUE (ACTION_SYNONYMS has "run", triggerKeywords has "late") │
│  process() → pickBestTemplate() → "late_jobs_overview"                      │
│  executeReport() → executeLateJobsReport()                                  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE QUERY                                      │
│  SELECT j.id, j.external_id as job_number, j.name as job_name,              │
│         j.need_date_time as need_date, j.priority,                          │
│         j.scheduled_status as status,  ← FIXED (was j.status)               │
│         MAX(jo.scheduled_end) as scheduled_end,                             │
│         GREATEST(0, EXTRACT(DAY FROM ...)) as days_late                     │
│  FROM ptjobs j LEFT JOIN ptjoboperations jo ON j.id = jo.job_id             │
│  WHERE j.need_date_time IS NOT NULL                                         │
│  GROUP BY ... HAVING MAX(jo.scheduled_end) > j.need_date_time               │
│  ORDER BY days_late DESC LIMIT 20                                           │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AGENT RESPONSE                                           │
│  {                                                                          │
│    content: "**Late Jobs Report**\n\n...",                                  │
│    action: {                                                                │
│      type: "open_report",                                                   │
│      data: {                                                                │
│        reportId: "late_jobs_overview",                                      │
│        reportName: "Late Jobs Overview",                                    │
│        data: [ {job_number, job_name, need_date, days_late, ...}, ... ],    │
│        columns: [ {id, label, format}, ... ]                                │
│      }                                                                      │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   BACKEND PASSTHROUGH (ai-agent.ts)                         │
│  return {                                                                   │
│    success: true,                                                           │
│    message: agentResponse.content,                                          │
│    action: agentResponse.action  ← ADDED (was missing)                      │
│  }                                                                          │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   FRONTEND HANDLER (ai-left-panel.tsx)                      │
│  handleSendMessage() receives response                                      │
│  if (result.action?.type === 'open_report') {  ← ADDED                      │
│    1. Create tableItem with report data                                     │
│    2. setCanvasItems(prev => [...prev, tableItem])                          │
│    3. POST /api/canvas/widgets (save to DB)                                 │
│    4. navigate('/canvas')                                                   │
│  }                                                                          │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CANVAS PAGE                                         │
│  User sees: Visual table widget with Late Jobs data                         │
│  Columns: Job #, Job Name, Need Date, Scheduled End, Days Late, Priority    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Testing Notes
- Login credentials: admin/admin123, Jim/planettogether, patti/planettogether
- Test command: "run Late Jobs Overview" should display table on Canvas
- KB import command: `npx tsx scripts/import-knowledge-base.ts <file> --clear`

## Next Steps / Known Issues
- Monitor for any additional report types that may need similar SQL column fixes
- Consider adding more detailed error messages when reports fail to generate
