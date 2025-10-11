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

## Recent Changes

### October 10, 2025 - AI Agent "Jobs" Terminology & Edge Case Enhancement
- **Original Issue**: Max AI and Production Scheduling Agent didn't understand "jobs" terminology. Query "all jobs" returned "I couldn't find any operations matching 'all jobs'".
- **Training Updates**:
  - Enhanced Max AI agent training with comprehensive "Understanding Jobs vs Operations" section
  - Added Production Scheduling Agent manufacturing terminology clarification at the top
  - Provided query translation examples (e.g., "all jobs" → fetch from ptjobs table)
- **Code Fixes - "All Jobs" Detection**:
  - Enhanced `findOperationsByDescription` method to detect "all jobs" queries and return ALL operations from jobs
  - Recognizes patterns like "all jobs", "show me all jobs", "every job"
  - Excludes qualified queries like "all jobs for line 2" to preserve location filters
- **Code Fixes - Time-Filtered Job Queries**:
  - Added optimized shortcut for simple time-based queries: "jobs today", "jobs this week", "operations next week", "jobs this month"
  - Comprehensive query preprocessing handles natural language variations:
    - **Leading fillers**: Iteratively removes "please", "hey", "hi", "can you", "could you", "would you" (handles multiple: "please can you")
    - **Trailing fillers**: Removes "please", "now", "thanks", "thank you"
    - **Punctuation**: Strips trailing ?, !, .
    - **Articles**: Removes "the", "a", "an"
    - **Spaces**: Normalizes multiple spaces
  - Conservative fallback: Complex queries (e.g., "jobs this week for line 2") safely fall back to regular search to preserve all qualifiers
- **Supported Patterns**:
  - ✅ "all jobs" → Returns ALL operations
  - ✅ "change start date on all jobs to oct 11" → Works correctly
  - ✅ "jobs today", "operations this week", "jobs next week", "jobs this month" → Time-filtered
  - ✅ "please show me jobs today?", "can you list operations this week" → Preprocessed and matched
  - ✅ "jobs this week for line 2" → Falls back to regular search (preserves location filter)
- **Known Limitations**: Some rare polite variations may fall back to regular search (which still works correctly). Only 4 time filters fully supported (today, this week, next week, this month).

### October 11, 2025 - Canvas Clearing Intelligence Enhancement
- **Issue**: Max AI didn't understand "clear the canvas" command, responded with "I need more specific details"
- **Training Enhancement**:
  - Added comprehensive "Canvas Management" section to Max AI agent training
  - Documented canvas as visualization workspace for tables, charts, and widgets
  - Provided clear examples mapping "clear canvas", "remove all widgets", "reset canvas" to clear_canvas action
- **Implementation**:
  - Added clear_canvas action handler in max-ai-service.ts executeSchedulingAction method
  - Properly scoped deletion to current user's widgets only (prevents cross-user data loss)
  - SQL: `DELETE FROM widgets WHERE dashboard_id IN (SELECT id FROM dashboards WHERE user_id = ${context.userId}) AND is_active = true`
  - Returns success message and action response for potential frontend refresh
- **Results**:
  - ✅ Max AI now understands canvas clearing commands
  - ✅ Secure deletion scoped to current user only
  - ✅ Clear confirmation message to user

### October 10, 2025 - Production Scheduler Auto-Refresh & Constraint Fixes (FINAL)
- **Issue 1 - No Auto-Refresh**: After AI agent rescheduled operations, production schedule didn't refresh automatically, requiring manual page refresh
- **Issue 2 - Constraint Violations**: Rescheduling set all operations to the same start time, causing overlaps on same resources across different jobs
- **Root Causes**:
  1. Floating AI in desktop-layout.tsx didn't handle refresh_scheduler action (was only in ai-left-panel.tsx)
  2. Reschedule logic sequenced operations within jobs but didn't track resource availability across jobs
- **Fixes Implemented**:
  - **Auto-Refresh System** (Floating AI):
    - Added refresh_scheduler handler in desktop-layout.tsx sendFloatingMessage.onSuccess (lines 422-445)
    - When refresh_scheduler action received, finds iframe by title and refreshes with cache busting
    - Shows success message with refresh confirmation to user
  - **Resource Conflict Prevention**:
    - Modified performOperationReschedule in max-ai-service.ts to use resourceSchedule Map (lines 3721-3799)
    - Tracks resource availability across ALL jobs, not just within each job
    - Before scheduling operation, checks if resource is busy and delays start if needed
    - After scheduling operation, marks resource as busy until operation ends
    - Maintains operation sequencing within each job while preventing cross-job resource conflicts
- **Results**: 
  - ✅ Schedule automatically refreshes after AI rescheduling (no manual refresh needed)
  - ✅ Operations properly sequenced within each job
  - ✅ Resource conflicts eliminated across all jobs (no overlapping operations on same resource)

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
-   **Production Scheduling**: Visual Gantt chart, operation sequencer, advanced scheduling algorithms, and constraints management. Includes a PT Resource Capabilities System for appropriate resource-operation matching using `ptresourcecapabilities`. Category column removed from resource grid for cleaner interface. Invalid drag operations show only tooltip message without duplicate error lines. Scheduling agent floating button removed for streamlined interface. Auto zoom-to-fit on initial load only, each view preset (Hour & Day, Day & Week, Week & Month, Month & Year) maintains its own natural zoom level. Manual zoom-to-fit button available in toolbar. View presets preserve current date context when switching, and initial date range displays current dates (2 weeks before to 6 weeks after today).
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