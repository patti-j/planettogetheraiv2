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
-   **Gantt Chart**: Bryntum Scheduler Pro for production scheduling visualization.
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
-   **Data Model**: Comprehensive database schema, including SAP-compliant production version architecture and migration to integer foreign keys. Exclusively uses PT (PlanetTogether) tables for manufacturing data.
-   **Inventory Management**: Stock-centric system tracking specific records.
-   **Master Data Management**: Unified interface with AI-powered modification and validation.
-   **Production Scheduling**: Visual Gantt chart, operation sequencer, scheduling algorithms (ASAP, ALAP, Critical Path, Resource Leveling, Theory of Constraints/DBR, PERT), and constraints management, including PT Resource Capabilities System for resource-operation matching. Auto zoom-to-fit on initial load only. **Constraint Resolution**: Bryntum Scheduler Pro's constraint engine now properly resolves overlaps and dependencies using forward/backward scheduling directions based on algorithm type (ASAP uses Forward, ALAP uses Backward). **Manual vs Programmatic Scheduling**: Clear distinction between user manual changes (marked as `manually_scheduled` via drag/drop/resize) and programmatic optimization (not marked as manual, allowing Bryntum's engine to apply constraints). **Auto-Save System**: Comprehensive auto-save for all manual changes (drag/drop, resize, edit) with `manually_scheduled` flag preservation - manual positions are protected from future algorithmic optimizations. **Calendar Management**: UI for working hours and maintenance periods configuration. **Theme System**: Bryntum native theme switching for Classic Light and Classic Dark themes with proper iframe synchronization. **Save Functionality**: Save button directly updates ptjoboperations table with new scheduled times while automatically creating version snapshots for history tracking. **Version Control System**: Comprehensive schedule versioning with automatic snapshots, optimistic concurrency control, timeline view, version comparison, and rollback capabilities. Tracks all schedule changes with full audit history. **Planning Area Filter**: Dropdown and "Apply Filter" button in scheduler toolbar to filter resources by planning area WITHOUT rescheduling operations - only affects resource visibility. **ALAP Priority Scheduling**: ALAP algorithm schedules jobs based on priority (1=highest, 5=lowest) first, then by due date, ensuring high-priority jobs get scheduled first for optimal resource allocation.
-   **Dashboarding & Analytics**: UI Design Studio for custom visualizations, AI-powered dashboard generation, and a drag-and-drop designer with widget library and professional templates.
-   **Role-Based Access Control**: Unified permission system with feature-action permissions.
-   **User Experience**: Session persistence for UI preferences, intelligent auto-fit, filter-specific layout persistence, and comprehensive error handling.
-   **Communication & Collaboration**: Integrated chat, feedback system, and email notifications. Max AI service provides real-time production intelligence, status monitoring, schedule analysis, bottleneck detection, resource conflict detection, and optimization recommendations.
-   **AI Alert System**: Configurable AI analysis triggers with OpenAI GPT-4o integration.
-   **AI Agents Control Panel**: Centralized management interface for all AI agents.
-   **AI Recommendations Resolution**: Interactive resolution workflows with "Resolve Now" (immediate execution) and "Show Plan First" (preview implementation steps before applying) features. Plan preview shows detailed steps, affected entities, estimated impact, potential risks, and rollback strategy.
-   **Global Control Tower**: Enhanced with KPI target management, weighted performance tracking, autonomous optimization, and real-time plant monitoring.
-   **Production Scheduler Architecture**: Uses a hybrid iframe/React architecture where a React wrapper component loads a standalone HTML file containing the Bryntum Scheduler Pro via a backend API route. **Important Fix (10/24/2025)**: Removed duplicate event listener for Apply Scheduling button that was causing infinite ASAP scheduling loops. Only one event listener at line 3198 should exist.
-   **Voice Chat**: Integrates real-time voice chat with OpenAI's gpt-realtime-mini model, featuring WebSocket architecture, SSE for audio/transcript streaming, and automatic pause detection.
-   **Demand Forecasting**: Native React-based forecasting application with SQL Server integration, featuring dynamic table/column selection, auto-detection of date/quantity columns, item-level filtering, and time-series forecasting with Recharts visualization. Fully embedded at `/demand-forecasting` with header and sidebar visible.
-   **Dynamic Paginated Reports**: Dedicated page at `/paginated-reports` for viewing data from any SQL Server table with pagination, filtering, sorting, and search capabilities. Security ensures table/schema validation against an `INFORMATION_SCHEMA` whitelist to prevent SQL injection, and schema caching improves performance.

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