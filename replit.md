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
-   **Gantt Chart**: Bryntum Scheduler Pro for production scheduling visualization, including optimization engines (ASAP, ALAP, Critical Path, Resource Leveling), drag-and-drop rescheduling, and real-time synchronization.
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

## Recent Fixes

### October 11, 2025 - Infinite Re-Render Loop Fix (Page Freeze on Load)
- **Issue**: Page freezing on load with excessive memory usage, even without user interaction
- **Root Cause**: Infinite re-render loop in customizable-header.tsx useEffect hook - TWO separate issues
  1. **Density sync issue**: useEffect synced density state with context but `density` was NOT in dependency array, causing infinite re-renders
  2. **CurrentRole recreation**: `currentRole` was computed fresh on every render with `.find()`, creating new object references that triggered useEffect infinitely
  - Browser console showed: "Maximum update depth exceeded" error in DropdownMenu component stack
- **Fix**: Two-part solution
  1. Removed problematic density context sync from useEffect (only sets local state now)
  2. Used `useMemo()` to memoize `currentRole` value, preventing new object creation on each render
- **Result**: Page loads without freezing, no more infinite re-render errors, browser console is clean

### October 11, 2025 - Chart Generation Wrong Data Type Fix
- **Issue**: Chart title correct ("Jobs by Need Date") but plotted wrong data (priority instead of need_date_time)
- **Root Cause Part 1**: Chart generation catalog was missing critical columns from database schema
  - ptjobs table has `need_date_time` column but catalog only listed: id, name, priority, scheduled_status, external_id
  - Other tables (ptresources, ptjoboperations) were also missing important columns
- **Fix Part 1**: Updated complete catalog schema with all important columns for chart generation
  - Added need_date_time, description, created_at, updated_at to ptjobs catalog
  - Added bottleneck, capacity_type, hourly_cost, and other key fields to ptresources catalog
  - Added cycle_hrs, setup_hours, required_finish_qty to ptjoboperations catalog
  - Added timestamp handling: DATE() wrapper for timestamp columns to group by date without time
  - Updated example queries to show proper usage of need_date_time and other new columns
- **Root Cause Part 2**: OpenAI intent extraction prompt was too vague
  - Prompt didn't emphasize using the EXACT column names from catalog examples
  - When user said "need date", OpenAI guessed "priority" instead of matching to "need_date_time" example
- **Fix Part 2**: Enhanced OpenAI prompt with explicit mapping rules
  - Added "CRITICAL MAPPING RULES" section with specific term-to-column mappings
  - Explicitly listed: "need date" → need_date_time, "priority" → priority, "status" → scheduled_status
  - Added example responses showing exact JSON structure with correct column names
  - Emphasized using catalog's example queries section for exact matches
- **Result**: Chart generation now correctly maps user requests to actual database columns and plots correct data

### October 11, 2025 - AI Query Filtering Fix
- **Issue**: Asked for "priority 8 jobs" but all 37 jobs were displayed instead of filtering
- **Root Cause**: Max AI table queries had hardcoded SQL without WHERE clause - filters were never extracted from user query
  - Query ran: `SELECT * FROM ptjobs ORDER BY id DESC LIMIT 100` (no filter applied!)
  - Both `getJobsTableData` and `getEntityTableData` ignored filter keywords in user queries
- **Fix Part 1**: Added `extractTableFilters()` method to parse filters from user query
  - Extracts priority filter: "priority 8", "priority=8", "priority: 8"
  - Extracts status filter: "status scheduled", "status: in progress"
  - Extracts ID filter: "id 5", "id=10"
- **Fix Part 2**: Fixed SQL parameter binding error
  - Initial fix used `sql.raw(queryStr, params)` which doesn't support parameter binding
  - Error: "bind message supplies 0 parameters, but prepared statement requires 1"
  - Solution: Use Drizzle's sql template literals for proper parameter binding: `sql\`${sql.raw(column)} = ${value}\``
- **Result**: Queries now properly filter data based on user request with correct parameter binding

### October 11, 2025 - Canvas UI Lag Fix
- **Issue**: Canvas page lagging after data loads (lag only started AFTER canvas was shown, not before)
- **Root Cause**: Debug console.log statements with large data objects (37 rows) running on every React re-render
  - `console.log('🔍 Canvas Debug - Raw canvasWidgets:', canvasWidgets)` - logs entire dataset on each render
  - Logging large objects to console is extremely expensive and causes UI lag
  - Happened after canvas shown because that's when data loads and logs start executing
- **Fix**: Removed all debug console.log statements from canvas.tsx
- **Result**: Canvas renders smoothly without performance degradation

### October 11, 2025 - Recent Pages Icon Display Fix (Product Wheels)
- **Issue**: Product Wheels showed FileText icon instead of wheel/disc icon in recent pages menu
- **Root Cause**: Navigation menu was passing React component object (Disc component) instead of string name "Disc"
  - `addRecentPage(item.href, item.label, item.icon)` passed the component object
  - Navigation context checked `typeof finalIcon !== 'string'` and defaulted to 'FileText'
  - Icon was stored as object in state, not as string name
- **Fix**: Extract icon name from React component before passing to addRecentPage
  - Added: `const iconName = item.icon?.displayName || item.icon?.name || 'FileText'`
  - Now passes string name: `addRecentPage(item.href, item.label, iconName)`
- **Result**: Product Wheels and all pages now display correct icons in recent pages menu