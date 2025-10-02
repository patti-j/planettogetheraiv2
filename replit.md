# PlanetTogether - Manufacturing SCM + APS System

## Overview
PlanetTogether is an AI-first Factory Optimization Platform, a full-stack manufacturing SCM + APS system focused on production scheduling with a visual Gantt chart interface. Its purpose is to leverage AI for optimized production planning, dynamic resource allocation, and intelligent dashboarding, providing complete supply chain visibility from procurement through production to sales. The system emphasizes data integrity, real-time optimization, and comprehensive reporting for pharmaceutical, chemical, and industrial manufacturing, with an ambition for enterprise-grade production deployment and unlimited horizontal scaling. Key capabilities include multi-agent support in the chat panel with intelligent routing, modular federation for scalability, and advanced AI integration for scheduling and system intelligence.

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
The system prioritizes user experience, data integrity, performance, accessibility, and consistency. Quality assurance, including testing fixes and monitoring console logs, is crucial before completing tasks.

### Frontend Architecture
- **Framework**: React 18 with TypeScript (strict mode enabled).
- **UI Framework**: Shadcn/UI components built on Radix UI primitives.
- **Styling**: Tailwind CSS with custom CSS variables.
- **State Management**: TanStack Query (React Query) for server state.
- **Routing**: Wouter.
- **Drag & Drop**: react-dnd with HTML5 backend.
- **Gantt Chart**: Bryntum Scheduler Pro for production scheduling visualization, including optimization engines (ASAP, ALAP, Critical Path, Resource Leveling), drag-and-drop rescheduling, and real-time synchronization.
  - **Implementation Status (October 2, 2025)**: All scheduling algorithms updated to use Bryntum's native constraint-based scheduling engine
  - **ASAP**: Uses `startnoearlierthan` constraints with forward scheduling
  - **ALAP**: Uses `finishnolaterthan` constraints with backward scheduling  
  - **Critical Path**: Leverages dependency chains with visual highlighting
  - **Dependencies**: Automatically created between sequential operations to prevent overlaps
  - **Project Engine**: Properly configured with calendars, working hours, and auto-calculation enabled
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
- **AI Alert System**: Configurable AI analysis triggers (scheduled, event-based, threshold-based, continuous) with OpenAI GPT-4o integration.
- **Data Schema Visualization**: Interactive lasso selection tool for focused analysis of table groups.
- **PT Table Structure Integrity**: The system exclusively uses PT (PlanetTogether) tables for ALL manufacturing-related data. Legacy non-PT tables are deprecated and must not be used. Specific PT tables required include `ptjoboperations`, `ptjobs`, `ptresources`, `ptjobresources`, `ptjobsuccessormanufacturingorders`, `ptmanufacturingorders`, `ptjobactivities`, and `ptresourcecapabilities`. Adding columns to PT tables is allowed, but deleting PT tables or columns, or using non-PT tables for manufacturing data, is forbidden. Integration requires mapping to PT column names and using PT's specific timestamp names and external_id fields.
- **PT Resource Capabilities System**: Implemented proper resource-operation matching using the `ptresourcecapabilities` table with capability mappings (1=MILLING, 2=MASHING, 3=LAUTERING, 4=BOILING, 5=FERMENTATION, 6=CONDITIONING, 7=DRY_HOPPING, 8=PACKAGING, 9=PASTEURIZATION). This replaces hardcoded resource assignment logic and ensures operations are scheduled on appropriate equipment based on their capabilities.
- **External Database Integration**: Established connection to external PT database via `EXTERNAL_DATABASE_URL` for importing missing PT table data. Import script available at `server/scripts/import-external-tables.ts` for automated data migration from external sources when local tables are empty.
- **External Partners Portal**: Single multi-tenant portal architecture for suppliers, customers, and OEM partners, incorporating AI-first features like intelligent onboarding and predictive analytics.
- **AI Agents Control Panel**: Centralized management interface for all AI agents (Max AI Assistant, System Monitoring Agent, Production Optimization Agent, Quality Analysis Agent, Predictive Maintenance Agent) with status, configuration, frequency, and performance controls.
- **Global Control Tower**: Enhanced with KPI target management, weighted performance tracking, autonomous optimization, performance visualization, and real-time plant monitoring with automated algorithm selection and parameter tuning.

### Production Scheduler Architecture (CRITICAL)

The Production Scheduler uses a **hybrid iframe/React architecture** that requires careful routing configuration to maintain the application's unified navigation system. This architecture was chosen to integrate the powerful Bryntum Scheduler Pro library while maintaining the app's consistent UI/UX.

#### Architecture Pattern
1. **React Wrapper Component** (`client/src/pages/production-scheduler.tsx`):
   - This is the main React component that users navigate to via `/production-scheduler`
   - Contains an iframe that loads the Bryntum scheduler HTML
   - Wrapped by the app's `DesktopLayout` component which provides:
     - Hamburger menu navigation
     - Max AI panel integration  
     - Consistent header/footer
     - Theme support

2. **Standalone HTML File** (`public/production-scheduler.html`):
   - Contains the actual Bryntum Scheduler Pro implementation
   - Completely self-contained with NO navigation elements
   - Loads PT data via API calls to `/api/resources`, `/api/pt-operations`, etc.
   - Handles all scheduling logic, drag-drop, and Gantt visualization

3. **Backend API Route** (`server/routes.ts`):
   - MUST use `/api/production-scheduler` route (NOT `/production-scheduler`)
   - Serves the HTML file when requested by the iframe
   - Critical: Using `/production-scheduler` would bypass React routing!

#### Routing Configuration
- **Frontend Route**: `/production-scheduler` → React app with navigation wrapper
- **API Route**: `/api/production-scheduler` → Raw HTML for iframe
- **Why This Matters**: If the backend uses `/production-scheduler`, it serves raw HTML directly, bypassing the React wrapper and losing all navigation!

#### Key Components
- `ProductionScheduler` component: React wrapper with iframe
- `DesktopLayout`: Provides hamburger menu and AI panels
- `production-scheduler.html`: Bryntum implementation (NO navigation!)
- Backend route: Must use `/api/` prefix

#### Common Pitfalls to Avoid
1. **DO NOT** add navigation elements (hamburger menu, AI buttons) to `production-scheduler.html`
2. **DO NOT** use `/production-scheduler` as a backend route - always use `/api/production-scheduler`
3. **DO NOT** try to integrate Bryntum directly into React - the iframe approach is intentional
4. **ALWAYS** ensure the HTML file remains clean and focused only on the scheduler
5. **ALWAYS** let the React wrapper handle all navigation and UI chrome

#### Dependency Management
- The scheduler uses CASE statement ordering for operation-resource matching
- More specific patterns (e.g., "packaging") must come before general patterns
- Dependencies use `fromEvent`/`toEvent` fields in backend, mapped to `from`/`to` in frontend

## External Dependencies

- **Database Provider**: Neon Database (serverless PostgreSQL)
- **AI/ML**: OpenAI API (GPT-4o, Whisper, TTS-1)
- **UI Libraries**: Radix UI, Shadcn/UI, Bryntum Scheduler Pro
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Drag & Drop**: react-dnd
- **Form Management**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **Charting**: Recharts, Chart.js
- **Session Management**: connect-pg-simple

## Data Management & Import Procedures

### External Database Integration
**Environment Variable**: `EXTERNAL_DATABASE_URL` - Connection string to external PlanetTogether database for data import purposes.

**Import Script**: `server/scripts/import-external-tables.ts`
- **Purpose**: Generic script for importing PT table data from external databases
- **Usage**: `npx tsx server/scripts/import-external-tables.ts [table_name]`
- **Features**: 
  - Checks local vs external record counts
  - Prevents duplicate imports
  - Handles table schema validation
  - Supports custom default data creation for specific tables

### PT Resource Capabilities Implementation (September 2024)
**Problem**: Operations were being assigned to inappropriate resources due to hardcoded logic.
**Solution**: Implemented proper PT Resource Capabilities table with capability-based resource matching.

**Procedure**:
1. **External Data Check**: Connected to external database to check for existing `ptresourcecapabilities` data
2. **Capability Mapping**: Created standardized capability IDs:
   - 1 = MILLING (Grain Mill)
   - 2 = MASHING (Mash Tun)
   - 3 = LAUTERING (Lauter Tun)
   - 4 = BOILING (Brew Kettle)
   - 5 = FERMENTATION (Fermenter Tanks)
   - 6 = CONDITIONING (Bright Tanks)
   - 7 = DRY_HOPPING (Bright Tanks)
   - 8 = PACKAGING (Filler Lines)
   - 9 = PASTEURIZATION (Pasteurizer)
3. **Data Population**: Populated local `ptresourcecapabilities` table with proper capability assignments
4. **Query Update**: Modified `getDiscreteOperations()` to use capabilities-based JOINs instead of hardcoded LIKE patterns
5. **Testing**: Verified operations now match to appropriate resources based on their capabilities

**Result**: Operations are now properly scheduled on equipment that has the required capabilities, preventing resource mismatches and improving scheduling accuracy.