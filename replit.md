# PlanetTogether - Manufacturing SCM + APS System

## Overview
PlanetTogether is an AI-first Factory Optimization Platform, a full-stack manufacturing SCM + APS system focused on production scheduling with a visual Gantt chart interface. Its purpose is to leverage AI for optimized production planning, dynamic resource allocation, and intelligent dashboarding, providing complete supply chain visibility. The system emphasizes data integrity, real-time optimization, and comprehensive reporting for pharmaceutical, chemical, and industrial manufacturing, with an ambition for enterprise-grade production deployment and unlimited horizontal scaling. Key capabilities include multi-agent support, modular federation, and advanced AI integration for scheduling and system intelligence.

## Recent Changes

**October 6, 2025**
- **JWT Authentication Performance Optimization**: Replaced old requireAuth middleware (N+1 query problem with 10+ database queries per request) with optimized enhancedAuth middleware that uses JOIN queries. This reduces authentication overhead from 13+ queries to 1-2 queries per request, significantly improving page load performance. The new implementation maintains backwards compatibility with existing endpoints while supporting both JWT and API key authentication.
- **LSP Errors Fixed**: Removed duplicate drizzle-orm imports that were causing 112+ TypeScript LSP errors in server/routes.ts. Consolidated all imports and added enhanced-auth-middleware import.
- **PT Plants Database Schema Fix**: Fixed critical database error where ptplants table was missing columns defined in Drizzle schema. Made publishDate, instanceId, and plantId columns nullable in schema, then added all missing columns (publish_date, instance_id, plant_id, notes, bottleneck_threshold, heavy_load_threshold, department_count, stable_days, financial fields, location fields, capacity, and operational_metrics) via SQL ALTER TABLE. Verified fix resolves "column does not exist" errors in shop floor and plants management pages.
- **Intelligent Agent Switching**: Implemented voice and text command detection for switching between AI agents. Users can now say phrases like "speak to production scheduling agent", "talk to shop floor agent", "switch to quality agent" from any page. Backend detects switch intent with 95% confidence, returns switch_agent action with agentId, and frontend handles the switch by calling switchToAgent() and displaying confirmation. Supports Production Scheduling, Shop Floor, Quality Analysis, and Predictive Maintenance agents.
- **React Duplicate Key Warning Fix**: Fixed React duplicate key warnings in navigation-menu-content.tsx by using unique composite keys (`${page.path}-${pageIndex}`) instead of just `page.path`. This prevents warnings when the same path appears multiple times in recent pages array while maintaining proper React reconciliation.
- **Agent Consolidation**: Merged AI Scheduling Agent functionality into Production Scheduling Agent. The Production Scheduling Agent now handles both production optimization (schedule optimization, bottleneck analysis, resource allocation) and APS expertise (PlanetTogether concepts, Bryntum scheduler features, APS best practices, finite capacity planning). This consolidation provides users with a single, comprehensive agent for all scheduling-related tasks.
- **Plants Management Icon**: Fixed icon mapping for Plants Management page in recent pages navigation.

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
The system prioritizes user experience, data integrity, performance, accessibility, and consistency. Quality assurance, including testing fixes and monitoring console logs, is crucial.

### Frontend Architecture
- **Framework**: React 18 with TypeScript.
- **UI Framework**: Shadcn/UI built on Radix UI primitives.
- **Styling**: Tailwind CSS with custom CSS variables.
- **State Management**: TanStack Query (React Query) for server state.
- **Routing**: Wouter.
- **Drag & Drop**: react-dnd with HTML5 backend.
- **Gantt Chart**: Bryntum Scheduler Pro for production scheduling visualization, including optimization engines (ASAP, ALAP, Critical Path, Resource Leveling), drag-and-drop rescheduling, and real-time synchronization. Features include PercentBar, ResourceNonWorkingTime, TaskEdit, TimeSpanHighlight, Versions, and Drag-and-Drop Validation based on resource capabilities.
- **Build Tool**: Vite.
- **UI/UX Decisions**: Consistent color schemes, professional modal designs, responsive layouts, standardized button styling, intuitive navigation, integrated workflow for dashboard and widget creation, Excel-like cell editing, user-configurable layouts with persistence, and centralized layout density controls.

### Backend Architecture
- **Framework**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **Storage**: DatabaseStorage class implementing IStorage interface.
- **API Design**: RESTful API with JSON responses, role-based authentication.
- **Authentication System**: Unified role-based permissions system.
- **Data Seeding**: Automatic database seeding with sample manufacturing data.
- **AI Integration**: OpenAI GPT-4o for NLP, intelligent data generation, custom metric calculation, AI-powered modifications, and dynamic content creation. Max AI uses flexible AI-driven intent understanding.
- **Hint System Service**: Intelligent contextual hints with user interaction tracking.

### Core System Design & Features
- **Navigation**: Unified layout system with consistent header/navigation for desktop and footer bar for mobile.
- **Data Model**: Comprehensive database schema emphasizing normalized relationships, including SAP-compliant production version architecture and migration from external text IDs to integer foreign keys.
- **Inventory Management**: Stock-centric system tracking specific records.
- **Master Data Management**: Unified interface with AI-powered modification and validation.
- **Production Scheduling**: Visual Gantt chart, operation sequencer, advanced scheduling algorithms (ASAP, ALAP, Critical Path, Resource Leveling, Drum/TOC), and constraints management.
- **Dashboarding & Analytics**: UI Design Studio for custom visualizations, AI-powered dashboard generation, live data previews, and a drag-and-drop designer with widget library and professional templates.
- **Role-Based Access Control**: Unified permission system with feature-action permissions.
- **User Experience**: Session persistence for UI preferences, intelligent auto-fit, filter-specific layout persistence, comprehensive error handling, and reusable widget system.
- **Communication & Collaboration**: Integrated chat, feedback system, visual factory displays, and email notifications. Max AI service provides real-time production intelligence, status monitoring, schedule analysis, bottleneck detection, resource conflict detection, and optimization recommendations.
- **Mobile Responsiveness**: Mobile-first design with enhanced login page accessibility and proper viewport handling.
- **AI Alert System**: Configurable AI analysis triggers with OpenAI GPT-4o integration.
- **Data Schema Visualization**: Interactive lasso selection tool for focused analysis of table groups.
- **PT Table Structure Integrity**: The system exclusively uses PT (PlanetTogether) tables for ALL manufacturing-related data. Legacy non-PT tables are deprecated. Core PT tables include `ptjoboperations`, `ptjobs`, `ptresources`, `ptjobresources`, `ptjobsuccessormanufacturingorders`, `ptmanufacturingorders`, `ptjobactivities`, and `ptresourcecapabilities`. Adding columns is allowed; deleting tables/columns or using non-PT tables for manufacturing data is forbidden. Integration requires mapping to PT column names, timestamp names, and external_id fields.
- **PT Resource Capabilities System**: Implemented proper resource-operation matching using the `ptresourcecapabilities` table with predefined capability mappings (e.g., MILLING, MASHING, FERMENTATION). This ensures operations are scheduled on appropriate equipment.
- **External Database Integration**: Connection to external PT database via `EXTERNAL_DATABASE_URL` for importing missing PT table data using `server/scripts/import-external-tables.ts`.
- **External Partners Portal**: Single multi-tenant portal architecture for suppliers, customers, and OEM partners with AI-first features.
- **AI Agents Control Panel**: Centralized management interface for all AI agents (Max AI Assistant, System Monitoring, Production Optimization, Quality Analysis, Predictive Maintenance).
- **Global Control Tower**: Enhanced with KPI target management, weighted performance tracking, autonomous optimization, performance visualization, and real-time plant monitoring with automated algorithm selection and parameter tuning.

### Production Scheduler Architecture (CRITICAL)

The Production Scheduler uses a **hybrid iframe/React architecture** to integrate the Bryntum Scheduler Pro library while maintaining a unified UI/UX.
1.  **React Wrapper Component** (`client/src/pages/production-scheduler.tsx`): Main React component at `/production-scheduler` with an iframe loading the Bryntum scheduler. Wrapped by `DesktopLayout` for consistent navigation and AI panel integration.
2.  **Standalone HTML File** (`public/production-scheduler.html`): Self-contained Bryntum Scheduler Pro implementation (no navigation elements) that loads PT data via API calls.
3.  **Backend API Route** (`server/routes.ts`): Uses `/api/production-scheduler` to serve the HTML file to the iframe. This prefix is critical to prevent bypassing React routing.

## External Dependencies

-   **Database Provider**: Neon Database (serverless PostgreSQL)
-   **AI/ML**: OpenAI API (GPT-4o, Whisper, TTS-1)
-   **UI Libraries**: Radix UI, Shadcn/UI, Bryntum Scheduler Pro
-   **Styling**: Tailwind CSS
-   **State Management**: TanStack Query (React Query)
-   **Routing**: Wouter
-   **Drag & Drop**: react-dnd
-   **Form Management**: React Hook Form with Zod validation
-   **Date Handling**: date-fns
-   **Charting**: Recharts, Chart.js
-   **Session Management**: connect-pg-simple