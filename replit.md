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

## System Architecture

### Design Principles & Guidelines
The system prioritizes user experience, data integrity, performance, accessibility, and consistency, with a focus on quality assurance.

### Frontend Architecture
-   **Framework**: React 18 with TypeScript.
-   **UI Framework**: Shadcn/UI built on Radix UI primitives.
-   **Styling**: Tailwind CSS with custom CSS variables.
-   **State Management**: TanStack Query (React Query) for server state.
-   **Routing**: Wouter.
-   **Drag & Drop**: react-dnd.
-   **Gantt Chart**: Bryntum Scheduler Pro for production scheduling visualization, including optimization engines, drag-and-drop rescheduling, and real-time synchronization.
-   **UI/UX Decisions**: Consistent color schemes, professional modal designs, responsive layouts, standardized button styling, intuitive navigation, integrated workflow for dashboard and widget creation, Excel-like cell editing, user-configurable layouts with persistence, and centralized layout density controls.

### Backend Architecture
-   **Framework**: Express.js with TypeScript.
-   **Database**: PostgreSQL with Drizzle ORM.
-   **Storage**: DatabaseStorage class implementing IStorage interface.
-   **API Design**: RESTful API with JSON responses, role-based authentication.
-   **Authentication System**: Unified role-based permissions system with JWT authentication.
-   **AI Integration**: OpenAI GPT-4o for NLP, intelligent data generation, custom metric calculation, AI-powered modifications, and dynamic content creation.
-   **Hint System Service**: Intelligent contextual hints with user interaction tracking.

### Core System Design & Features
-   **Navigation**: Unified layout system with consistent header/navigation for desktop and footer bar for mobile.
-   **Data Model**: Comprehensive database schema emphasizing normalized relationships, including SAP-compliant production version architecture and migration from external text IDs to integer foreign keys. The system exclusively uses PT (PlanetTogether) tables for all manufacturing-related data.
-   **Inventory Management**: Stock-centric system tracking specific records.
-   **Master Data Management**: Unified interface with AI-powered modification and validation.
-   **Production Scheduling**: Visual Gantt chart, operation sequencer, advanced scheduling algorithms, and constraints management. Includes a PT Resource Capabilities System for appropriate resource-operation matching. Auto zoom-to-fit on initial load only, each view preset maintains its own natural zoom level.
-   **Dashboarding & Analytics**: UI Design Studio for custom visualizations, AI-powered dashboard generation, and a drag-and-drop designer with widget library and professional templates.
-   **Role-Based Access Control**: Unified permission system with feature-action permissions.
-   **User Experience**: Session persistence for UI preferences, intelligent auto-fit, filter-specific layout persistence, and comprehensive error handling.
-   **Communication & Collaboration**: Integrated chat, feedback system, and email notifications. Max AI service provides real-time production intelligence, status monitoring, schedule analysis, bottleneck detection, resource conflict detection, and optimization recommendations.
-   **AI Alert System**: Configurable AI analysis triggers with OpenAI GPT-4o integration.
-   **AI Agents Control Panel**: Centralized management interface for all AI agents.
-   **Global Control Tower**: Enhanced with KPI target management, weighted performance tracking, autonomous optimization, and real-time plant monitoring.
-   **Production Scheduler Architecture**: Uses a hybrid iframe/React architecture where a React wrapper component loads a standalone HTML file containing the Bryntum Scheduler Pro via a backend API route.
-   **Voice Chat**: Integrates real-time voice chat with OpenAI's gpt-realtime-mini model, featuring WebSocket architecture, SSE for audio/transcript streaming, and automatic pause detection for natural conversation flow.

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
## Recent Changes & Fixes

### October 11, 2025 - Chart Display Bug Fix (Data Extraction Issue)
- **Issue**: Charts showing "Item 1", "Item 2" instead of actual data labels (dates, categories, etc.)
- **Root Cause**: Canvas widget data extraction reading from non-existent `widget.data` column
  - Database schema has `widget.config` (JSONB) containing chart data at `config.chartConfig.data`
  - Canvas.tsx was trying to read `widget.data` which doesn't exist → undefined → fallback to generic "Item" labels
- **Fix**: Updated convertWidgetToCanvasItem() in canvas.tsx to properly extract chart data:
  1. `widget.configuration?.chartConfig?.data` (primary path for Max AI charts)
  2. `widget.configuration?.data` (fallback)
  3. `widget.data` (legacy fallback)
  4. `[]` (empty array as last resort)
- **Result**: Charts now display actual data labels (dates, categories) correctly

### October 11, 2025 - Chart Dimension Mapping Fix
- **Issue**: "Job quantities by need date" created chart grouped "by item" instead of "by need date"
- **Root Cause**: OpenAI misinterpreting "quantities" as item quantities rather than job counts
- **Fix**: Enhanced OpenAI prompt in extractIntent() with explicit rules:
  - "quantities/counts of JOBS" means counting jobs, NOT item quantities
  - Dimension (grouping field) is what comes AFTER "by" in the query
  - Added specific examples: "job quantities by need date" → group by need_date_time
- **Result**: Charts now correctly map to requested dimensions

### October 11, 2025 - Duplicate Chart Creation Fix (Two-Layer Bug)
- **Issue**: Asked for "jobs by need date" but TWO charts were created
- **Root Cause**: Two-layer duplication problem
  - **Layer 1 - AI Intent**: Two separate AI systems both detecting and creating charts
  - **Layer 2 - Frontend/Backend**: Chart saved twice to database
    - Backend: `getDynamicChart()` → `saveChartWidget()` → saves to database
    - Frontend: desktop-layout.tsx ALSO saved chart to database → duplicate
- **Fix**: 
  - Removed duplicate early chart detection in `generateResponse()`
  - Removed frontend chart saving since backend already saves to database
  - Now: Backend saves ONCE, frontend just invalidates cache and navigates to canvas
- **Result**: Chart requests now create exactly ONE chart with single database save

### October 11, 2025 - Chart Data Persistence Bug Fix
- **Issue**: Charts displaying generic "Item 1", "Item 2", "Item 3" labels instead of actual dates
- **Root Cause**: Chart data was NOT being saved to database at all
  - `saveChartWidget()` function was only saving metadata (chartType, dataSource, etc.)
  - The actual chart data array (dates, values, labels) was never persisted to `config` field
  - API was regenerating fresh data on every load using wrong query (priority instead of need_date)
- **Fix**: Updated `saveChartWidget()` to save complete `chartConfig` object:
  - `config.chartConfig.data` - The actual chart data array with dates/values
  - `config.chartConfig.type` - Chart type (bar, line, pie, etc.)
  - `config.chartConfig.title` - Chart title
  - `config.chartConfig.configuration` - Display settings
- **API Enhancement**: `/api/canvas/widgets` now prefers stored data with fallback chain:
  1. `config.chartConfig.data` (new saved data from Max AI)
  2. `config.data` (legacy fallback)
  3. Regeneration (only if no stored data exists)
- **Result**: Charts now persist their data correctly and display actual dates instead of generic labels
