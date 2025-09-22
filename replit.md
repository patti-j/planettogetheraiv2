# PlanetTogether - Manufacturing SCM + APS System

## Overview
PlanetTogether is an AI-first Factory Optimization Platform, a full-stack manufacturing SCM + APS system specializing in production scheduling with a visual Gantt chart interface. Its vision is to leverage AI for optimized production planning, dynamic resource allocation, and intelligent dashboarding. The system provides complete supply chain visibility from procurement through production to sales, with traceability, quality management, and financial integration, emphasizing data integrity, real-time optimization, and comprehensive reporting for pharmaceutical, chemical, and industrial manufacturing. It aims to provide an enterprise-grade production deployment with unlimited horizontal scaling.

**Latest Update (September 22, 2025)**: Enhanced Agent Chat Panel:
- **Multi-Agent Support**: Chat panel now supports switching between all customer-facing agents (Max AI Assistant and AI Scheduling Agent)
- **Unified Agent Mode**: New unified mode allows posting a message that gets routed to all relevant agents simultaneously
- **Visual Agent Indicators**: Each message clearly shows which agent responded with color-coded badges
- **Agent Dropdown Selector**: Easy switching between agents via dropdown menu in the chat header
- **Intelligent Routing**: Messages automatically route to appropriate backend endpoints based on selected agent
- **Context Preservation**: Each agent maintains its own conversation history and context

**Previous Update (September 10, 2025)**: Completed Week 4 of Modular Federation Strategy:
- **Integration Testing**: Implemented comprehensive test harness with 115 tests (100% passing) covering all 8 modules
- **Performance Optimization**: Added performance monitoring system with module load tracking, memory usage metrics, and performance budgets (<200ms core, <500ms non-core)
- **Data Persistence**: Connected all federation modules to real PT database tables with real-time data synchronization
- **UI Integration**: Created Federation Dashboard with live module status, shop floor widget, quality widget, and inventory widget
- **Error Handling**: Implemented robust error recovery with circuit breakers, exponential backoff retries, and health monitoring dashboard
- **Module Status**: All 8 modules (core-platform, agent-system, production-scheduling, shop-floor, quality-management, inventory-planning, analytics-reporting, shared-components) are fully operational with database integration

**Previous Update (September 10, 2025, Week 1)**: Completed Week 1 of Modular Federation Strategy:
- Created packages/ directory with 8 specialized modules: core-platform, agent-system, production-scheduling, shop-floor, quality-management, inventory-planning, analytics-reporting, shared-components
- Established comprehensive TypeScript interfaces for inter-module communication with 200+ type definitions
- Implemented federation registry with event bus, module lifecycle management, and contract validation
- Set up workspace configuration with module boundaries, shared dependencies, and build targets
- Created development infrastructure for distributed team collaboration

**Previous Update (September 2, 2025)**: Implemented code quality improvements:
- Moved backup files (.bak, .backup, .old) to ../backups directory outside source tree for cleaner codebase
- Enabled TypeScript strict mode for better type safety and early error detection
- Note: CI type checking script (npm run check) should use "tsc --noEmit" for proper type validation

**Previous Update (August 29, 2025)**: Successfully migrated from PT Import tables to PT Publish tables. Removed all 61 PT Import tables and imported 60+ PT Publish tables converted from MSSQL to PostgreSQL. Updated all non-PT manufacturing table references to use PT equivalents (plants→ptPlants, resources→ptResources, capabilities→ptCapabilities, customers→ptCustomers, items→ptItems, inventory→ptInventories). Added comprehensive table relations using numeric PT IDs for efficient database joins.

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

## Recent Updates

**Latest Update (September 19, 2025)**: Fixed brewery operation dependencies and UI controls:
- **Dependency Generation Fixed**: Updated to use jobExternalId for grouping operations since jobId is null in PT database
- **Proper Job Isolation**: Dependencies correctly link operations within the same job/batch (e.g., JOB-HKN-003-00013)
- **Partial Process Chains**: Dependencies work correctly but PT database has fragmented data - job HKN-003-00013 only has Milling→Mashing→Lautering→Boiling (no later operations exist)
- **Data Limitation**: No single job in PT database contains the complete 7-step brewery process - operations are spread across different jobs
- **Console Logging**: Added debug logging but note that scheduler runs in iframe - use iframe context in browser DevTools to see logs
- **Fit to View Fix**: Enhanced the zoom-to-fit functionality with proper margins and fallback logic to ensure all scheduled operations are visible in the viewport

**Previous Update (September 19, 2025)**: Implemented AI Scheduling Agent:
- **AI Agent Integration**: Added comprehensive scheduling AI agent accessible from production schedule page via floating action button (FAB)
- **Backend Service**: Created scheduling-ai.ts service with OpenAI GPT-4o integration, comprehensive PlanetTogether knowledge base, and conversation management
- **API Endpoints**: Implemented /api/ai/schedule/* endpoints with robust authentication, rate limiting (20 req/min), and conversation persistence
- **Frontend Component**: Built SchedulingAgent.tsx with chat interface, conversation history, and real-time message updates using TanStack Query
- **Authentication Fix**: Updated requireAuth middleware to handle token reconstruction from database, ensuring persistence across server restarts
- **Knowledge Base**: AI trained on PlanetTogether concepts (finite capacity, pegging, what-if scenarios), Bryntum features, and general APS best practices

## System Architecture

### Design Principles & Guidelines
- **User Experience First**: Prioritize intuitive interfaces and responsive design.
- **Data Integrity**: Always connect to real data sources.
- **Performance**: Optimize for fast loading and smooth interactions.
- **Accessibility**: Ensure mobile-responsive design with proper touch targets.
- **Consistency**: Maintain uniform styling, patterns, and user flows.
- **Quality Assurance**: Always test fixes and check for runtime errors before completing tasks. Restart workflows to verify server-side changes and monitor console logs for errors.

### Frontend Architecture
- **Framework**: React 18 with TypeScript (strict mode enabled).
- **UI Framework**: Shadcn/UI components built on Radix UI primitives.
- **Styling**: Tailwind CSS with custom CSS variables.
- **State Management**: TanStack Query (React Query) for server state.
- **Routing**: Wouter.
- **Drag & Drop**: react-dnd with HTML5 backend.
- **Gantt Chart**: Bryntum Scheduler Pro for production scheduling visualization, including optimization engines (ASAP, ALAP, Critical Path, Resource Leveling), drag-and-drop rescheduling, and real-time synchronization.
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
- **Navigation Architecture**: Unified layout system with consistent header/navigation for desktop and footer bar for mobile.
- **Data Model**: Comprehensive database schema for manufacturing, emphasizing normalized relationships, including SAP-compliant production version architecture and extensive migration from external text IDs to integer foreign keys for performance and integrity.
- **Inventory Management**: Stock-centric system tracking specific records.
- **Master Data Management**: Unified interface with AI-powered modification and validation.
- **Production Scheduling**: Visual Gantt chart, operation sequencer, advanced scheduling algorithms (ASAP, ALAP, Critical Path, Resource Leveling, Drum/TOC), and constraints management.
- **Dashboarding & Analytics**: UI Design Studio for custom visualizations, AI-powered dashboard generation, live data previews, and visual drag-and-drop dashboard designer with widget library and professional templates.
- **Role-Based Access Control**: Unified permission system with feature-action permissions.
- **User Experience**: Session persistence for UI preferences, intelligent auto-fit, filter-specific layout persistence, comprehensive error handling, and reusable widget system.
- **Communication & Collaboration**: Integrated chat, feedback system, visual factory displays, and email notifications. Max AI service provides real-time production intelligence, status monitoring, schedule analysis, bottleneck detection, resource conflict detection, and optimization recommendations.
- **Mobile Responsiveness**: Mobile-first design with enhanced login page accessibility and proper viewport handling.
- **AI Alert System**: Configurable AI analysis triggers (scheduled, event-based, threshold-based, continuous) with OpenAI GPT-4o integration.
- **Data Schema Visualization**: Interactive lasso selection tool for focused analysis of table groups.
- **PT Table Structure Integrity**: 
  - **🚨 CRITICAL RULE**: **We EXCLUSIVELY use PT (PlanetTogether) tables for ALL manufacturing-related data. NO EXCEPTIONS.**
  - **DEPRECATED TABLES TO IGNORE**: The following legacy tables are COMPLETELY DEPRECATED and MUST NEVER BE USED:
    - `operations` → use `ptjoboperations`
    - `dependencies` → use `ptjobsuccessormanufacturingorders`
    - `discrete_operations` → use `ptjoboperations`
    - `process_operations` → use `ptjoboperations`
    - `production_orders` → use `ptjobs`
    - `work_centers` → use `ptresources`
    - ANY non-PT manufacturing table → find the PT equivalent
  - **REQUIRED PT TABLES FOR MANUFACTURING**:
    - Operations: `ptjoboperations`
    - Jobs/Orders: `ptjobs`
    - Resources: `ptresources`
    - Resource Assignments: `ptjobresources`
    - Dependencies: `ptjobsuccessormanufacturingorders`
    - Manufacturing Orders: `ptmanufacturingorders`
    - Activities: `ptjobactivities`
  - **MODIFICATION RULES**: 
    - ✅ OK: Add columns to PT tables for additional functionality
    - ❌ FORBIDDEN: Delete any PT tables or columns without explicit approval
    - ❌ FORBIDDEN: Use any non-PT table for manufacturing data
  - **INTEGRATION NOTES**: Map to PT column names, accept complex joins, use PT's specific timestamp names and external_id fields when integrating with PT Publish tables.
- **External Partners Portal**: Single multi-tenant portal architecture serving suppliers, customers, and OEM partners with an AI-first approach (intelligent onboarding, natural language interfaces, predictive analytics, role-based experiences).
- **AI Agents Control Panel**: Centralized management interface for all AI agents (Max AI Assistant, System Monitoring Agent, Production Optimization Agent, Quality Analysis Agent, Predictive Maintenance Agent) with status, configuration, frequency, and performance controls.
- **Global Control Tower**: Enhanced with KPI target management, weighted performance tracking, autonomous optimization configuration, performance visualization, and real-time plant monitoring with automated algorithm selection and parameter tuning.

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