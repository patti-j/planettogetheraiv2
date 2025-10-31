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
-   **Authentication System**: Unified role-based permissions system with JWT authentication. **Development Mode Enhancement (10/29/2025)**: Auto-login respects explicit logouts - when users log out in development, they stay logged out until manually logging in again, allowing testing with different users. Fresh preview starts continue to auto-login with the most recent user.
-   **AI Integration**: OpenAI GPT-4o for NLP, intelligent data generation, custom metric calculation, AI-powered modifications, and dynamic content creation.
-   **Hint System Service**: Intelligent contextual hints with user interaction tracking.

### Core System Design & Features
-   **Navigation**: Unified layout system with consistent header/navigation for desktop and footer bar for mobile.
-   **Data Model**: Comprehensive database schema, including SAP-compliant production version architecture and migration to integer foreign keys. Exclusively uses PT (PlanetTogether) tables for manufacturing data.
-   **Inventory Management**: Stock-centric system tracking specific records.
-   **Master Data Management**: Unified interface with AI-powered modification and validation.
-   **Algorithm Requirements Management System (NEW 10/29/2025)**: Comprehensive requirements management for optimization algorithms with distinction between functional (physical/production constraints) and policy (relaxable management decisions) requirements. Features include:
    - **Requirement Definition**: Support for functional vs policy requirements with categories (capacity, timing, sequencing, resource), priority levels, and validation rules
    - **Algorithm Association**: Link requirements to algorithms with enforcement levels (strict, soft, warning) and custom parameters
    - **Validation Tracking**: Automated validation results with performance metrics, violation details, and test run associations
    - **Database Schema**: Three tables (algorithmRequirements, algorithmRequirementAssociations, algorithmRequirementValidations) for complete requirement lifecycle management
    - **API Endpoints**: Full CRUD operations for requirements, associations, and validations with filtering capabilities
-   **Production Scheduling**: Visual Gantt chart, operation sequencer, scheduling algorithms (ASAP, ALAP, Drum/TOC). **Dependency System**: Dependencies are VISUAL ONLY - they create lines on the Gantt chart for visualization but DO NOT constrain scheduling. All scheduling algorithms ignore dependencies and use only job priority (1=highest) and operation sequence numbers. **Visual-Only Implementation (Fixed 10/29/2025)**: Visual dependency store creation wrapped in try-catch to handle missing DependencyStore class. DependencyStore checked in multiple namespaces (bryntum.schedulerpro, SchedulerPro, bryntum.gantt). System continues without visual dependencies if DependencyStore unavailable - scheduling algorithms unaffected as they never use dependencies. **Bryntum Dependencies**: Optional visual-only feature with separate store binding, graceful fallback if unavailable. **Constraint Mode**: Bryntum's constraintsMode set to 'none' to disable dependency enforcement. **ASAP Algorithm**: Forward schedules from today (or manufacturing_release_date) by job priority, operations run in sequence order. **Critical Fix (10/30/2025)**: Fixed bin packing algorithm `findEarliestSlot` function to strictly enforce sequence constraints - operations now properly wait for predecessors to complete before scheduling, maintaining correct brewing process order. **ALAP Algorithm**: Backward schedules from need-by dates with jobs sorted by priority DESCENDING (5,4,3,2,1) so Priority 1 gets scheduled last and receives the earliest/best position. Priority lookup fixed (10/30/2025) to use jobPriorityMap from PTJOBS table instead of operation properties. **Critical Fix (10/30/2025)**: Applied sequence constraint enforcement to ALAP backwards scheduling - all operations now use `findLatestFreeSlotOnResource` with sequence-constrained end dates, ensuring operations never schedule after their successors need to start. The finish() helper clamps slots to respect latestEnd boundaries, maintaining proper brewing sequence order when scheduling backwards. **Drum/TOC Algorithm**: Identifies bottleneck resource, optimizes around it with longest operations first. **Auto-Save System**: Comprehensive auto-save for all manual changes (drag/drop, resize, edit) with `manually_scheduled` flag preservation - manual positions are protected from future algorithmic optimizations. **Calendar Management**: UI for working hours and maintenance periods configuration. **Theme System**: Bryntum native theme switching for Classic Light and Classic Dark themes with proper iframe synchronization. **Save Functionality**: Save button directly updates ptjoboperations table with new scheduled times while automatically creating version snapshots for history tracking. **Version Control System**: Comprehensive schedule versioning with automatic snapshots, optimistic concurrency control, timeline view, version comparison, and rollback capabilities. Tracks all schedule changes with full audit history. **Planning Area Filter**: Dropdown and "Apply Filter" button in scheduler toolbar to filter resources by planning area WITHOUT rescheduling operations - only affects resource visibility.
-   **Dashboarding & Analytics**: UI Design Studio for custom visualizations, AI-powered dashboard generation, and a drag-and-drop designer with widget library and professional templates.
-   **Role-Based Access Control**: Unified permission system with feature-action permissions.
-   **User Experience**: Session persistence for UI preferences, intelligent auto-fit, filter-specific layout persistence, and comprehensive error handling.
-   **Communication & Collaboration**: Integrated chat, feedback system, and email notifications. Max AI service provides real-time production intelligence, status monitoring, schedule analysis, bottleneck detection, resource conflict detection, and optimization recommendations.
-   **AI Alert System**: Configurable AI analysis triggers with OpenAI GPT-4o integration.
-   **AI Workflow Automation**: Natural language-powered workflow creation system that enables users to describe automation tasks in plain text. AI generates complete workflows with steps, conditions, and triggers. Features include template library, visual workflow builder, execution history tracking, and support for scheduled, event-driven, and manual workflows. Integrated at `/workflows` with full CRUD operations and execution engine.
-   **AI Agents Control Panel**: Centralized management interface for all AI agents.
-   **AI Automation Rules System (NEW 10/31/2025)**: Comprehensive automation system allowing users to enable automatic resolution of recurring issues directly from AI recommendations. Features include:
    - **Inline Enablement**: Reusable `AutomationToggle` component embedded in AI recommendation modals with toggle switch for instant automation
    - **Advanced Options**: Custom rule names, manual approval requirements, collapsible configuration
    - **Rule Management**: Dedicated management page at `/automation-rules` for viewing, enabling/disabling, and deleting rules
    - **Safety Features**: Rules can be paused without deletion, approval workflows for sensitive actions, comprehensive audit logging
    - **Execution History**: Full audit trail with outcomes, errors, and timestamps for all automated actions
    - **Issue Types**: Supports at-risk jobs, buffer shortages, resource conflicts, quality holds, deadline risks, capacity overloads, and material shortages
    - **Database Schema**: Two tables (automation_rules, automation_executions) with proper indexing and constraints
    - **Security**: Field-level validation on updates, SQL-based filtering for execution history, ownership verification
-   **AI Recommendations Resolution**: Interactive resolution workflows with "Resolve Now" (immediate execution) and "Show Plan First" (preview implementation steps before applying) features. Plan preview shows detailed steps, affected entities, estimated impact, potential risks, and rollback strategy.
-   **Global Control Tower**: Enhanced with KPI target management, weighted performance tracking, autonomous optimization, and real-time plant monitoring.
-   **Production Scheduler Architecture**: Uses a hybrid iframe/React architecture where a React wrapper component loads a standalone HTML file containing the Bryntum Scheduler Pro via a backend API route. **Important Fix (10/24/2025)**: Removed duplicate event listener for Apply Scheduling button that was causing infinite ASAP scheduling loops. Only one event listener at line 3198 should exist.
-   **Voice Chat**: Integrates real-time voice chat with OpenAI's gpt-realtime-mini model, featuring WebSocket architecture, SSE for audio/transcript streaming, and automatic pause detection.
-   **Demand Forecasting**: Native React-based forecasting application with SQL Server integration, featuring dynamic table/column selection, auto-detection of date/quantity columns, item-level filtering, and time-series forecasting with Recharts visualization. Fully embedded at `/demand-forecasting` with header and sidebar visible. Includes intermittent demand handling that detects and preserves zero-demand days in forecasts, preventing inflated predictions for items with sporadic orders. Random Forest and Linear Regression models now apply intelligent thresholding and pattern analysis to generate realistic forecasts with appropriate zeros.
-   **Dynamic Paginated Reports**: Enhanced page at `/paginated-reports` supporting both SQL Server tables and Power BI datasets (semantic models) as data sources. Features include:
    - **Dual Data Sources**: Toggle between Analytics SQL Database and Power BI Datasets
    - **Power BI Integration**: Workspace selection, real-time dataset fetching, and dataset details display
    - **Dataset Information**: Shows dataset properties (name, ID, refreshable status, storage mode) and table schema
    - **SQL Server Support**: Full table browsing with pagination, filtering, sorting, and search capabilities
    - **Security**: Table/schema validation against `INFORMATION_SCHEMA` whitelist to prevent SQL injection
    - **API Endpoints**: `/api/powerbi/workspaces/:workspaceId/datasets` for dataset listing, `/api/powerbi/workspaces/:workspaceId/datasets/:datasetId/tables` for schema information

## External Dependencies

-   **Database Provider**: Neon Database (serverless PostgreSQL)
-   **AI/ML**: OpenAI API (GPT-4o, Whisper, TTS-1, gpt-realtime-mini)
-   **UI Libraries**: Radix UI, Shadcn/UI, Bryntum Scheduler Pro (Licensed v6.3.3 - installed via npm from @bryntum/schedulerpro using ES modules)
-   **Styling**: Tailwind CSS
-   **State Management**: TanStack Query (React Query)
-   **Routing**: Wouter
-   **Drag & Drop**: react-dnd
-   **Form Management**: React Hook Form with Zod validation
-   **Date Handling**: date-fns
-   **Charting**: Recharts, Chart.js
-   **Session Management**: connect-pg-simple
-   **SQL Server**: mssql package for SQL Server connection pooling