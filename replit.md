# PlanetTogether - Manufacturing ERP System

## Overview
PlanetTogether is an AI-first Factory Optimization Platform, a full-stack manufacturing ERP system. It specializes in production scheduling, managing production orders, operations, resources, and capabilities with a visual Gantt chart interface. The vision is to transform traditional ERP into an AI-first approach, leveraging AI for optimized production planning, dynamic resource allocation, and intelligent dashboarding. The system supports complete supply chain visibility from procurement through production to sales, with full traceability, quality management, and financial integration, emphasizing data integrity, real-time optimization, and comprehensive reporting for pharmaceutical, chemical, and industrial manufacturing.

## User Preferences
Preferred communication style: Simple, everyday language.

Multiple users working on project:
- JC = Jim
- PJ = Patti

Note on concurrent work:
- Jim and Patti work on different issues concurrently
- Each conversation/thread is independent - I don't retain context between different sessions
- Best practice: Start each request with your name/initials for clarity
- If continuing previous work, briefly mention what was done before

## Application Behavior Documentation

### Current Issues & Migration Status
- **Recent Menu Icons**: ✅ FIXED (2025-08-16) - Desktop Recent menu now shows properly colored icons in both top menu cards and slide-out navigation
- **PT Tables Renaming**: ✅ COMPLETE (2025-08-15) - All `pt_publish_*` tables renamed to `ptTableName` format (e.g., `ptJobs`, `ptResources`)
- **Table Names**: Switched from underscore format to camelCase (e.g., `pt_publish_jobs` → `ptjobs`)
- **Old Tables Archival**: ✅ COMPLETE (2025-08-15) - 47 old manufacturing tables archived with `archived_` prefix
- **API Endpoints**: PT operations and production orders working with sample data
- **Schema Files**: Updated both schema.ts and pt-publish-schema.ts to use new table names
- **Database Structure**: All PT tables retain original column structure with approved variations only
- **Current State**: 62 active PT tables with sample data, 47 archived legacy tables preserved
- **Dashboard Dialog Overflow**: ✅ FIXED (2025-08-16) - Dashboard descriptions now properly truncated in selection dialogs to prevent overflow
- **Visual Dashboard Designer**: ✅ ENHANCED (2025-08-16) - Now displays real widgets from database instead of static placeholders, with proper categorization and icons
- **Widget Studio Field Selection**: ✅ ENHANCED (2025-08-16) - X-axis, Y-axis, value field, and event field inputs now use dropdown selections with database table fields instead of free text entry
- **Widget Preview Fix**: ✅ FIXED (2025-08-16) - Preview dialogs now show proper content for all widget types instead of blank windows
- **Select.Item Error**: ✅ FIXED (2025-08-16) - Fixed "must have value prop" error in SMART KPI Widget Studio by adding fallback items for empty field lists
- **Sample Widgets Created**: ✅ ADDED (2025-08-16) - Created 8 sample widgets covering all types (KPI, Chart, Table, Gauge, Activity, Progress) for testing and demonstration

### ⚠️ CRITICAL CONSTRAINT: PT Table Structure Integrity
**Minimize modifications to PT Publish table structures.** The PT Publish tables should maintain their original structure, with approved variations only when absolutely necessary.
- ⚠️ Request approval before adding columns to PT tables
- ❌ Do NOT remove existing columns or change data types
- ❌ Do NOT alter core relationships or foreign keys
- ✅ DO adapt queries to work with existing structure when possible
- ✅ DO create extension tables for additional data when feasible
- ✅ DO document all approved variations with rationale
- ✅ DO preserve legacy tables by renaming rather than deletion

**Rationale**: PT tables represent the canonical PlanetTogether data model. While strict adherence is preferred, some variations may be necessary for business continuity and data preservation.

**Approved Variations (as of 2025-08-15)**:
- Plant table: Additional location and operational columns to preserve critical business data

### PT Table Migration & Query Adaptation Guidelines

#### Data Mapping
| Old Table | PT Publish Replacement | Key Differences |
|-----------|------------------------|-----------------|
| production_orders | pt_publish_jobs | Jobs have external_id, need_date_time (not due_date), scheduled_status |
| operations | pt_publish_job_operations | Operations linked via job_id, have scheduled times, phases |
| resources | pt_publish_resources | Resources have plant_id, no resource_type column, more attributes |
| discrete_operations | pt_publish_job_activities | Activities track actual vs scheduled, production_status field |
| process_operations | pt_publish_job_activities | Activities with activity_type field for process distinction |

#### Query Adaptation Rules
When migrating from old tables to PT Publish tables:
1. **Column Name Mapping**: Always map to PT column names (e.g., due_date → need_date_time, status → scheduled_status)
2. **Join Complexity**: Accept that PT tables require more complex joins due to normalized structure
3. **Missing Columns**: If PT lacks a column, compute it in application layer or use alternative columns
4. **Timestamp Handling**: Use PT's specific timestamp names (scheduled_start_date, actual_start, not start_date)
5. **External IDs**: Utilize external_id fields for system integration references
6. **Plant Relationships**: Join through plant_id when needing plant context

**Golden Rule**: Always adapt queries to fit PT tables. Never modify PT table structure to simplify queries.

### Design Principles & Guidelines
When writing code, always follow these core principles:
- **User Experience First**: Prioritize intuitive interfaces and responsive design
- **Data Integrity**: Never use mock data; always connect to real data sources
- **Performance**: Optimize for fast loading and smooth interactions
- **Accessibility**: Ensure mobile-responsive design with proper touch targets
- **Consistency**: Maintain uniform styling, patterns, and user flows across all features

### Feature Requirements & Specifications
Document specific feature requirements here:

#### Max AI Assistant
- **Behavior**: Conversational manufacturing intelligence with context awareness
- **Response Format**: Always include actionable suggestions and relevant data insights
- **UI Requirements**: Prominent thinking indicator, disabled input during processing
- **Integration**: Access to production data, alerts, scheduling information

#### Data Schema Visualization
- **Layout Algorithms**: Support circular, grid, hierarchical, and force-directed layouts
- **Interaction**: Lasso selection tool for focused analysis of table groups
- **Persistence**: Save custom positions per filter combination in localStorage
- **Performance**: Load schema data efficiently (2-3 seconds target)

#### Production Scheduling
- **Visualization**: Bryntum Gantt chart with drag-drop capabilities
- **Real-time Updates**: Live status monitoring and conflict detection
- **Optimization**: AI-powered scheduling recommendations and bottleneck analysis

### Code Standards & Patterns
- **React Patterns**: Use React Query for server state, proper hook dependencies
- **TypeScript**: Strong typing, no `any` types unless absolutely necessary
- **Error Handling**: Comprehensive error boundaries with user-friendly messages
- **State Management**: Local state for UI, React Query for server state
- **File Organization**: Group related components, use barrel exports

### Business Logic Requirements
Document domain-specific rules here:
- **Manufacturing Workflows**: Production order → Operations → Resources → Scheduling
- **Data Relationships**: Enforce foreign key constraints and referential integrity
- **Authorization**: Role-based permissions (Production Manager, Plant Manager, etc.)
- **Audit Trail**: Track all changes with timestamps and user attribution

## System Architecture

### Navigation Architecture
- **Unified Layout System**: Consistent header/navigation for desktop, consistent footer bar for mobile.
- **Mobile Footer Bar**: Navigation at bottom for optimal thumb reach (Home, Menu, Search, Recent, Profile).
- **Desktop Navigation**: Left rail navigation with slide-out menu and resizable AI panel.
- **Customizable Desktop Header**: Role-specific quick access items, user-configurable and persistent.
- **Client-Side Navigation**: Uses wouter for smooth routing.

### Frontend Architecture
- **Framework**: React 18 with TypeScript.
- **UI Framework**: Shadcn/UI components built on Radix UI primitives.
- **Styling**: Tailwind CSS with custom CSS variables.
- **State Management**: TanStack Query (React Query) for server state.
- **Routing**: Wouter.
- **Drag & Drop**: react-dnd with HTML5 backend.
- **Gantt Chart**: Bryntum Gantt for production scheduling visualization.
- **Build Tool**: Vite.
- **Widget System**: Reusable components for consistent UI patterns (System and User widgets).
- **UI/UX Decisions**: Consistent color schemes, professional modal designs, responsive layouts, standardized button styling, intuitive navigation, integrated workflow for dashboard and widget creation, Excel-like cell editing, user-configurable layouts with persistence, and centralized layout density controls.

### Backend Architecture
- **Framework**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM (Neon Database).
- **Storage**: DatabaseStorage class implementing IStorage interface.
- **API Design**: RESTful API with JSON responses, role-based authentication.
- **Authentication System**: Unified role-based permissions system.
- **Data Seeding**: Automatic database seeding with sample manufacturing data.
- **AI Integration**: OpenAI GPT-4o for natural language processing, intelligent data generation, custom metric calculation, AI-powered modifications, and dynamic content creation.

### Core System Design & Features
- **Data Model**: Comprehensive database schema for manufacturing, emphasizing normalized relationships, including SAP-compliant production version architecture.
- **Inventory Management**: Stock-centric system tracking specific records.
- **Master Data Management**: Unified interface with AI-powered modification and validation.
- **Scheduling & Optimization**: Visual Gantt chart, operation sequencer, advanced scheduling algorithms, and constraints management. Includes detailed analysis and strategy for Bryntum Scheduler Pro algorithms like ChronoGraph.
- **Dashboarding & Analytics**: UI Design Studio for custom visualizations, AI-powered dashboard generation, live data previews, and visual drag-and-drop dashboard designer with widget library.
- **Role-Based Access Control**: Unified permission system with feature-action permissions.
- **User Experience**: Session persistence for UI preferences, intelligent auto-fit, filter-specific layout persistence, comprehensive error handling, and reusable widget system.
- **Communication & Collaboration**: Integrated chat, feedback system, visual factory displays, and email notifications. Max AI service provides real-time production intelligence, status monitoring, schedule analysis, bottleneck detection, resource conflict detection, and optimization recommendations. It integrates OpenAI GPT-4o for context-aware responses and proactive insights.
- **Mobile Responsiveness**: Mobile-first design with enhanced login page accessibility and proper viewport handling.
- **Scaling Strategy**: Enterprise-grade production deployment with unlimited horizontal scaling.
- **AI Alert System**: Configurable AI analysis triggers (scheduled, event-based, threshold-based, continuous) with OpenAI GPT-4o integration, analysis scheduling, and management API endpoints.
- **Data Schema Visualization**: Interactive lasso selection tool for focused analysis of table groups.

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