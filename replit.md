# PlanetTogether - Manufacturing SCM + APS System

## Overview
PlanetTogether is an AI-first Factory Optimization Platform, a full-stack manufacturing SCM + APS system. Its core purpose is to leverage AI for optimized production planning, dynamic resource allocation, and intelligent dashboarding, providing complete supply chain visibility through a visual Gantt chart interface. The system is designed for enterprise-grade production deployment in pharmaceutical, chemical, and industrial manufacturing, emphasizing real-time optimization, data integrity, and comprehensive reporting. Key capabilities include multi-agent support, modular federation, and advanced AI integration for scheduling and system intelligence.

## User Preferences
Preferred communication style: Simple, everyday language.

Multiple users working on project:
- JC = Jim
- PJ = Patti

**AI Branding Standard**: Always use Sparkles icon for AI-related features and branding. Never use Brain or other icons for AI functionality.

Note on concurrent work:
- Jim and Patti work on different issues concurrently
- Each conversation/thread is independent - I don't retain context between different sessions
- Best practice: Start each request with your name/initials for clarity
- If continuing previous work, briefly mention what was done before

## Recent Updates (November 3, 2025 - Evening - Part 2)
- **Version History Component Fix**: Fixed TypeError when accessing version history by adding null checks for changeType property and creating mock API endpoints for version data
- **Algorithm Execution Fix**: Fixed Production Scheduling Agent algorithm execution by updating API endpoint to check AlgorithmRegistry first instead of requiring database entries
- **Cleaned Up Non-Working Algorithms**: Removed stubs for Resource Leveling and Critical Path - only ASAP and ALAP are functional
- **Fixed Database Column Names**: Corrected `cycle_duration_hours` to `cycle_hrs` in Max AI service queries
- **Navigation Fix**: Fixed critical navigation issue where /home route was blanking screen due to hard redirect
- **Theory of Constraints Page Fix**: Fixed blank page issue by adding `/theory-of-constraints` route to publicPaths list in App.tsx
- **AI Agent Training Enhancement**: Production Scheduling Agent now recognizes natural language optimization requests:
  - ASAP Algorithm triggers: "optimize schedule", "minimize lead times", "speed up production"
  - ALAP Algorithm triggers: "JIT optimization", "minimize inventory", "reduce WIP"
- **Resource Management**: Production Scheduling Agent can now manage resources and capabilities:
  - Add new resources to ptresources table with natural language requests
  - Prompt users for resource capabilities (MILLING, MASHING, FERMENTATION, etc.)
  - List resources and their capabilities on request
  - API endpoints for resource CRUD operations
- **Schedule Saving**: Production Scheduling Agent can now save and manage named schedule versions:
  - Save current schedule with custom name
  - Prompt for schedule name if not provided
  - Optional description support
  - List all saved schedules
  - Load previously saved schedules
- **Algorithm Execution Bridge (Fixed November 3, 2025 - Evening)**: 
  - Production Scheduling Agent now properly executes ASAP/ALAP algorithms via client bridge
  - Server-side agent delegates to client-side Bryntum Scheduler Pro for actual optimization
  - Bidirectional communication via postMessage between server agent and client scheduler
  - **Critical Fix**: Refactored to use shared `applySelectedAlgorithm` function instead of synthetic button clicks
  - **Root Cause Resolved**: Synthetic clicks were blocked by Bryntum's `event.isTrusted` check
  - Agent now directly calls algorithm functions, ensuring save to database and version history creation
  - Both manual UI clicks and agent-triggered executions now use same code path
- **Manual Save Version History Fix (Fixed November 3, 2025 - Evening Part 2)**:
  - Fixed manual save button not creating version history entries
  - Manual save now creates both auto-save snapshot AND version history entry
  - Version history properly tracks manual saves with changeType 'manual_save'

## System Architecture
The system prioritizes user experience, data integrity, performance, accessibility, and consistency, with a focus on quality assurance.

### Agent Architecture (November 3, 2025)
The system now uses a **modular agent architecture** designed for role-based access control and independent agent deployment:

#### Core Components:
1. **Agent Services** (`server/services/agents/`)
   - `base-agent.interface.ts`: Base interface all agents must implement
   - `production-scheduling-agent.service.ts`: Scheduling-specific logic
   - `agent-registry.ts`: Manages available agents based on permissions
   - `agent-bridge.ts`: Handles client-server communication for agents

2. **Agent Registry Pattern**
   - Central registry manages all available agents
   - Loads agents based on user permissions
   - Enables future role-based access (e.g., some users only get Production Scheduling)

3. **Agent Bridge Communication**
   - Allows server-side agents to trigger client-side actions
   - Production Scheduling Agent can execute Bryntum algorithms via postMessage
   - Supports real-time bidirectional communication

4. **Delegation Architecture**
   - Max AI delegates to specialized agents when appropriate
   - Each agent is self-contained with its own logic
   - Agents can be independently deployed/updated

#### Benefits:
- **Separation of Concerns**: Each agent's logic is isolated
- **Role-Based Access**: Users can have access to specific agents only
- **Scalability**: New agents can be added without modifying core Max AI
- **Maintainability**: Agent-specific code is organized and modular

### Frontend
-   **Framework**: React 18 with TypeScript.
-   **UI Framework**: Shadcn/UI built on Radix UI primitives.
-   **Styling**: Tailwind CSS with custom CSS variables.
-   **State Management**: TanStack Query (React Query) for server state.
-   **Routing**: Wouter.
-   **Gantt Chart**: Bryntum Scheduler Pro for production scheduling visualization.
-   **UI/UX Decisions**: Consistent color schemes, professional modal designs, responsive layouts, standardized button styling, intuitive navigation, integrated workflow for dashboard and widget creation, Excel-like cell editing, user-configurable layouts with persistence, and centralized layout density controls.

### Backend
-   **Framework**: Express.js with TypeScript.
-   **Database**: PostgreSQL with Drizzle ORM.
-   **API Design**: RESTful API with JSON responses, role-based authentication.
-   **Authentication System**: Unified role-based permissions system with JWT authentication. **Development Mode Enhancement (10/29/2025)**: Auto-login respects explicit logouts - when users log out in development, they stay logged out until manually logging in again, allowing testing with different users. Fresh preview starts continue to auto-login with the most recent user.
-   **AI Integration**: OpenAI GPT-4o for NLP, intelligent data generation, custom metric calculation, AI-powered modifications, and dynamic content creation. **AI Sample Data Generation Fix (10/31/2025)**: Migrated from unreliable `response_format: { type: "json_object" }` to OpenAI structured outputs with Zod schemas. Implemented retry logic with exponential backoff (3 attempts: 1s, 2s, 4s delays) to handle transient failures. Uses strict JSON schema validation in `server/services/ai-sample-data-schema.ts` to prevent "string did not match expected pattern" errors. Provides user-friendly error messages for timeout, schema validation, and rate limit issues, with fallback to minimal dataset only after all retries fail. **Concise AI Responses (10/31/2025)**: Updated agent training documents for ultra-brief responses - Max AI and Production Scheduling Agent now provide 1-2 sentence initial responses with "Need details?" prompts, expanding only on explicit request.
-   **Hint System Service**: Intelligent contextual hints with user interaction tracking.

### Core System Design & Features
-   **Navigation**: Unified layout system with consistent header/navigation. Navigation menu organized into 11 groups: Business Management, Demand Planning (5 items), Supply Planning (7 items), Scheduling (9 items), Shop Floor (8 items), AI & Analytics, Data Management, Management & Administration, Training & Support, and Communication & Collaboration.
-   **Data Model**: Comprehensive database schema using PT (PlanetTogether) tables for manufacturing data, including SAP-compliant production version architecture.
-   **Inventory Management**: Stock-centric system tracking specific records.
-   **Master Data Management**: Unified interface with AI-powered modification and validation.
-   **Algorithm Requirements Management System**: Comprehensive management for optimization algorithms (functional vs. policy requirements, priority levels, validation, API for CRUD operations).
-   **Production Scheduling**: Visual Gantt chart with operation sequencer and algorithms (ASAP, ALAP, Drum/TOC). Dependencies are visual-only and do not constrain scheduling; algorithms use job priority and operation sequence. Includes comprehensive auto-save, calendar management, theme switching, and version control with automatic snapshots and rollback capabilities.
-   **Dashboarding & Analytics**: UI Design Studio for custom visualizations, AI-powered dashboard generation, and a drag-and-drop designer.
-   **Role-Based Access Control**: Unified permission system with feature-action permissions.
-   **AI Workflow Automation**: Natural language-powered workflow creation system with template library, visual builder, and execution tracking.
-   **AI Agents Control Panel**: Centralized management interface for all AI agents.
-   **AI Automation Rules System**: Comprehensive automation system to enable automatic resolution of recurring issues from AI recommendations, with inline enablement, advanced options, rule management, and safety features.
-   **AI Recommendations Resolution**: Interactive resolution workflows with "Resolve Now" and "Show Plan First" options, including plan previews with detailed steps, impact, risks, and rollback strategies.
-   **Global Control Tower**: Enhanced with KPI target management, weighted performance tracking, autonomous optimization, and real-time plant monitoring.
-   **Production Scheduler Architecture**: Hybrid iframe/React architecture loading Bryntum Scheduler Pro via a backend API route.
-   **Voice Chat**: Integrates real-time voice chat with OpenAI's gpt-realtime-mini model using WebSocket and SSE.
-   **Demand Forecasting**: Native React-based forecasting application with SQL Server integration, dynamic table/column selection, and time-series forecasting with Recharts visualization, including intermittent demand handling.
-   **Dynamic Paginated Reports**: Enhanced page supporting SQL Server tables and Power BI datasets as data sources, featuring workspace/dataset/table selection, data querying via DAX for Power BI, and full table browsing for SQL Server with pagination, filtering, sorting, and search.

## External Dependencies
-   **Database Provider**: Neon Database (serverless PostgreSQL)
-   **AI/ML**: OpenAI API (GPT-4o, Whisper, TTS-1, gpt-realtime-mini)
-   **UI Libraries**: Radix UI, Shadcn/UI, Bryntum Scheduler Pro
-   **Styling**: Tailwind CSS
-   **State Management**: TanStack Query (React Query)
-   **Routing**: Wouter
-   **Drag & Drop**: react-dnd
-   **Form Management**: React Hook Form with Zod validation
-   **Date Handling**: date-fns
-   **Charting**: Recharts, Chart.js
-   **Session Management**: connect-pg-simple
-   **SQL Server**: mssql package for SQL Server connection pooling