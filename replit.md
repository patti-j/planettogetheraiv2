# PlanetTogether - Manufacturing SCM + APS System

## Overview
PlanetTogether is an AI-first Factory Optimization Platform, a full-stack manufacturing SCM + APS system. Its core purpose is to leverage AI for optimized production planning, dynamic resource allocation, and intelligent dashboarding, providing complete supply chain visibility through a visual Gantt chart interface. The system is designed for enterprise-grade production deployment in pharmaceutical, chemical, and industrial manufacturing, emphasizing real-time optimization, data integrity, and comprehensive reporting. It supports multi-agent functionality, modular federation, and advanced AI integration for scheduling and system intelligence, aiming to be a global control tower for autonomous optimization and real-time plant monitoring.

## Recent Critical Fixes & Features (Nov 9, 2024)
- **Menu Favorites Persistence Fix**: Fixed authentication issue in PUT /api/user-preferences route. Changed from session-based to JWT authentication to properly save user favorites.
- **Operator Dashboard Avatar Fix**: Fixed NavigationAdapter trying to fetch user preferences with undefined user ID. Added guards to prevent queryKey formation with undefined ID and double-check user ID validity before API calls.
- **ALAP Scheduling Algorithm Improvements**: 
  - Removed legacy ALAP implementation that used projectEnd+30 days and ignored job due dates
  - Refactored window.alapScheduling to consistently use backward packer (findLatestFreeSlotOnResource) for ALL operations
  - Ensures last operations end exactly at job due dates when "Need Dates Required" is enabled
  - Fixed duplicate busy interval tracking that was causing scheduling conflicts
  - Implemented proper job priority-based interleaved scheduling (Priority 5 schedules first for latest position)
  - All operations now use unified backward scheduling approach with proper latestEnd constraints
- **Plant Onboarding System**: Created comprehensive plant-specific onboarding system with database tables, API endpoints, and Company Onboarding Overview page. Sample data populated for 5 brewery plants showing different onboarding statuses (completed, in-progress, paused, not-started).
- **Database Schema Updates**: Fixed ptPlants table references and added companyOnboardingOverview table to schema. All onboarding-related tables successfully created in production database.

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
The system prioritizes user experience, data integrity, performance, accessibility, and consistency, with a focus on quality assurance.

### Agent Architecture
The system uses a modular agent architecture designed for role-based access control and independent agent deployment. It features an Agent Registry Pattern for managing available agents, Agent Bridge Communication for real-time bidirectional interaction, and a Delegation Architecture where Max AI delegates to specialized, self-contained agents.

**CRITICAL**: Each agent has two synchronized files that MUST be kept in sync:
1. **Training Document** (`server/training/agents/[agent-name].md`) - Defines the agent's knowledge, personality, and behavior specifications.
2. **Service Implementation** (`server/services/agents/[agent-name].service.ts`) - Implements the actual code based on the training document.

These files must be synchronized for features like trigger arrays, handler methods, database queries, and response formatting.

### Frontend
-   **Framework**: React 18 with TypeScript.
-   **UI Framework**: Shadcn/UI built on Radix UI primitives.
-   **Styling**: Tailwind CSS.
-   **State Management**: TanStack Query (React Query).
-   **Routing**: Wouter.
-   **Gantt Chart**: Bryntum Scheduler Pro.
-   **UI/UX Decisions**: Consistent color schemes, professional modal designs, responsive layouts, standardized button styling, intuitive navigation, integrated workflow for dashboard and widget creation, Excel-like cell editing, user-configurable layouts with persistence, and centralized layout density controls.

### Backend
-   **Framework**: Express.js with TypeScript.
-   **Database**: PostgreSQL with Drizzle ORM.
-   **API Design**: RESTful API with JSON responses, role-based authentication.
-   **Authentication System**: Unified role-based permissions system with JWT authentication.
-   **AI Integration**: OpenAI GPT-4o for NLP, intelligent data generation, custom metric calculation, AI-powered modifications, and dynamic content creation, utilizing structured outputs with Zod schemas and retry logic.
-   **Hint System Service**: Intelligent contextual hints with user interaction tracking.
-   **Power BI Integration**: Complete feature parity with SQL Server for grouped data, using DAX SUMMARIZE queries.

### Core System Design & Features
-   **Navigation**: Unified layout with consistent header/navigation, organized into 11 functional groups.
-   **Data Model**: Comprehensive database schema using PT tables, including SAP-compliant production version architecture.
-   **Inventory Management**: Stock-centric system tracking specific records.
-   **Master Data Management**: Unified interface with AI-powered modification and validation.
-   **Algorithm Requirements Management System**: Manages optimization algorithms (functional/policy requirements, priorities, validation, API for CRUD).
-   **Resource Deployment Ordering**: Database-driven resource ordering system using deployment_order field in ptresources table. Resources are automatically ordered by their position in the production flow (milling → mashing → lautering → boiling → packaging, etc.). Management interface at `/resource-deployment-order` allows drag-and-drop reordering.
-   **Production Scheduling**: Visual Gantt chart with operation sequencer and algorithms (ASAP, ALAP, Drum/TOC), auto-save, calendar management, theme switching, and enhanced version control with snapshots, rollback, and comprehensive version comparison.
-   **Dashboarding & Analytics**: UI Design Studio for custom visualizations, AI-powered dashboard generation, and a drag-and-drop designer.
-   **Role-Based Access Control**: Unified permission system with feature-action permissions.
-   **AI Workflow Automation**: Natural language-powered workflow creation with template library, visual builder, and execution tracking.
-   **AI Agents Control Panel**: Centralized management interface for all AI agents.
-   **AI Automation Rules System**: Comprehensive system for automatic resolution of recurring issues from AI recommendations, with inline enablement, advanced options, rule management, and safety features.
-   **AI Recommendations Resolution**: Interactive resolution workflows with "Resolve Now" and "Show Plan First" options.
-   **Global Control Tower**: Enhanced with KPI target management, weighted performance tracking, autonomous optimization, and real-time plant monitoring.
-   **Plant-Specific Onboarding System**: Comprehensive onboarding assistant that tracks implementation progress by plant with template support, phase tracking, metrics monitoring, and progress visualization. Enables customers to onboard one plant at a time with reusable templates.
-   **Production Scheduler Architecture**: Hybrid iframe/React architecture loading Bryntum Scheduler Pro via a backend API route.
-   **Voice Chat**: Integrates real-time voice chat with OpenAI's gpt-realtime-mini model using WebSocket and SSE.
-   **Demand Forecasting**: Native React-based forecasting application with SQL Server integration, dynamic table/column selection, and time-series forecasting with Recharts visualization, including intermittent demand handling.
-   **Advanced Paginated Reports Designer**: Professional report builder with split-pane layout, resizable columns, "include totals row," an advanced column chooser, smart aggregation with "show distinct rows" (default), report templates, grouping and aggregation with subtotals, conditional formatting, save/load configurations, enhanced export capabilities (CSV, Excel, PDF with complete datasets and aggregation-aware headers), server-side totals and grouping, keyboard shortcuts, print preview, and full SQL Server/Power BI dataset support (pagination, filtering, sorting, DAX queries).

## Production Deployment Configuration
-   **Deployment Type**: Autoscale
-   **Environment Variables Required**: NODE_ENV=production, REPLIT_DEPLOYMENT=1
-   **Run Command**: `NODE_ENV=production REPLIT_DEPLOYMENT=1 node dist/index.js`
-   **Build Command**: `npm run build`
-   **Critical Fix (Nov 7, 2024)**: Must explicitly set NODE_ENV=production in run command to avoid server defaulting to development mode and looking for non-existent Vite dev server in production
-   **Database Configuration**: Production uses PRODUCTION_DATABASE_URL, development uses DATABASE_URL
-   **Required Secrets**: PRODUCTION_DATABASE_URL, JWT_SECRET, SESSION_SECRET, OPENAI_API_KEY

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
-   **SQL Server**: mssql package