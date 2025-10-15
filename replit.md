# PlanetTogether - Manufacturing SCM + APS System

## Recent Changes

### October 15, 2025
- **Added Dynamic Paginated Reports with SQL Server Integration**: New dedicated page at `/paginated-reports` for viewing data from any SQL Server table with pagination, filtering, sorting, and search capabilities
  - **SQL Server Connection**: Created `sql-server-service.ts` with connection pooling using mssql package
  - **Security**: Table/schema validation against INFORMATION_SCHEMA whitelist to prevent SQL injection
  - **Performance**: Schema caching with 5-minute TTL to reduce redundant queries
  - **Backend API Endpoints**:
    - `/api/sql-tables`: Lists all tables in the SQL Server database
    - `/api/sql-tables/:schema/:table/schema`: Gets column metadata for a specific table
    - `/api/paginated-reports`: Fetches paginated data with search and sorting
  - **Frontend Features**:
    - Dynamic table selector from SQL Server database
    - Dynamic column rendering based on table schema
    - Search across all text columns
    - Sortable columns with visual indicators
    - Configurable page size (10, 25, 50, 100, 250 items)
    - Proper loading states and error handling
  - **Navigation**: Added "Paginated Reports" link in AI & Analytics menu section
  - **Environment Variables**: Uses SQL_SERVER, SQL_DATABASE, SQL_USERNAME, SQL_PASSWORD for secure connection

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
-   **Production Scheduling**: Visual Gantt chart, operation sequencer, scheduling algorithms (ASAP, ALAP, Critical Path, Resource Leveling, Theory of Constraints/DBR, PERT), and constraints management, including PT Resource Capabilities System for resource-operation matching. Auto zoom-to-fit on initial load only. **Auto-Save System**: Comprehensive auto-save for all manual changes (drag/drop, resize, edit) with `manually_scheduled` flag preservation - manual positions are protected from future algorithmic optimizations. **Calendar Management**: UI for working hours and maintenance periods configuration. **Theme System**: Bryntum native theme switching using DomHelper.setTheme() API for Classic Light and Classic Dark themes with proper iframe synchronization. See [Production Scheduler Documentation](./PRODUCTION_SCHEDULER_DOCUMENTATION.md) for complete implementation details.
-   **Dashboarding & Analytics**: UI Design Studio for custom visualizations, AI-powered dashboard generation, and a drag-and-drop designer with widget library and professional templates.
-   **Role-Based Access Control**: Unified permission system with feature-action permissions.
-   **User Experience**: Session persistence for UI preferences, intelligent auto-fit, filter-specific layout persistence, and comprehensive error handling.
-   **Communication & Collaboration**: Integrated chat, feedback system, and email notifications. Max AI service provides real-time production intelligence, status monitoring, schedule analysis, bottleneck detection, resource conflict detection, and optimization recommendations.
-   **AI Alert System**: Configurable AI analysis triggers with OpenAI GPT-4o integration.
-   **AI Agents Control Panel**: Centralized management interface for all AI agents.
-   **Global Control Tower**: Enhanced with KPI target management, weighted performance tracking, autonomous optimization, and real-time plant monitoring.
-   **Production Scheduler Architecture**: Uses a hybrid iframe/React architecture where a React wrapper component loads a standalone HTML file containing the Bryntum Scheduler Pro via a backend API route.
-   **Voice Chat**: Integrates real-time voice chat with OpenAI's gpt-realtime-mini model, featuring WebSocket architecture, SSE for audio/transcript streaming, and automatic pause detection.

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