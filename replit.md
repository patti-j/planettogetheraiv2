# PlanetTogether - Manufacturing SCM + APS System

## Overview
PlanetTogether is an AI-first Factory Optimization Platform, a full-stack manufacturing SCM + APS system. Its core purpose is to leverage AI for optimized production planning, dynamic resource allocation, and intelligent dashboarding, providing complete supply chain visibility through a visual Gantt chart interface. The system is designed for enterprise-grade production deployment in pharmaceutical, chemical, and industrial manufacturing, emphasizing real-time optimization, data integrity, and comprehensive reporting. It supports multi-agent functionality, modular federation, and advanced AI integration for scheduling and system intelligence.

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
The system uses a modular agent architecture designed for role-based access control and independent agent deployment. Core components include:
-   **Agent Services**: Base interface for agents, production scheduling logic, agent registry, and client-server communication bridge.
-   **Agent Registry Pattern**: Manages available agents based on user permissions.
-   **Agent Bridge Communication**: Enables server-side agents to trigger client-side actions and supports real-time bidirectional communication.
-   **Delegation Architecture**: Max AI delegates to specialized, self-contained agents for specific logic, allowing independent deployment and updates.

#### Agent Training Document and Service Implementation Synchronization

**CRITICAL**: Each agent has two synchronized files that MUST be kept in sync:
1. **Training Document** (`server/training/agents/[agent-name].md`) - Defines the agent's knowledge, personality, and behavior specifications
2. **Service Implementation** (`server/services/agents/[agent-name].service.ts`) - Implements the actual code based on the training document

**The Relationship:**
- **Training Document (`.md`)** = The blueprint/specification that defines:
  - Agent identity and communication style
  - Core knowledge and terminology understanding
  - Trigger phrases that activate features
  - Response templates and formatting rules
  - Database tables and relationships to query

- **Service Implementation (`.ts`)** = The engine that executes:
  - Trigger arrays derived from .md specifications
  - Handler methods implementing described functionality
  - Database queries using knowledge from .md
  - Response formatting following .md style guidelines

**Synchronization Rules:**
- When adding new capabilities to `.ts`, document them in `.md`
- When updating communication style in `.md`, update response formatting in `.ts`
- When adding trigger phrases in `.md`, add them to triggers array in `.ts`
- When changing database queries in `.ts`, update query examples in `.md`

**Example: Production Scheduling Agent**
- Training: `server/training/agents/production-scheduling-agent.md`
- Implementation: `server/services/agents/production-scheduling-agent.service.ts`
- Must stay synchronized for features like job queries, algorithm execution, and response formatting

### Frontend
-   **Framework**: React 18 with TypeScript.
-   **UI Framework**: Shadcn/UI built on Radix UI primitives.
-   **Styling**: Tailwind CSS.
-   **State Management**: TanStack Query (React Query).
-   **Routing**: Wouter.
-   **Gantt Chart**: Bryntum Scheduler Pro for production scheduling visualization.
-   **UI/UX Decisions**: Consistent color schemes, professional modal designs, responsive layouts, standardized button styling, intuitive navigation, integrated workflow for dashboard and widget creation, Excel-like cell editing, user-configurable layouts with persistence, and centralized layout density controls.

### Backend
-   **Framework**: Express.js with TypeScript.
-   **Database**: PostgreSQL with Drizzle ORM.
-   **API Design**: RESTful API with JSON responses, role-based authentication.
-   **Authentication System**: Unified role-based permissions system with JWT authentication, supporting explicit logouts in development.
-   **AI Integration**: OpenAI GPT-4o for NLP, intelligent data generation, custom metric calculation, AI-powered modifications, and dynamic content creation. Utilizes OpenAI structured outputs with Zod schemas and retry logic for data generation. Agents provide concise initial responses.
-   **Hint System Service**: Intelligent contextual hints with user interaction tracking.

### Core System Design & Features
-   **Navigation**: Unified layout with consistent header/navigation, organized into 11 functional groups.
-   **Data Model**: Comprehensive database schema using PT tables, including SAP-compliant production version architecture.
-   **Inventory Management**: Stock-centric system tracking specific records.
-   **Master Data Management**: Unified interface with AI-powered modification and validation.
-   **Algorithm Requirements Management System**: Manages optimization algorithms, including functional/policy requirements, priorities, validation, and API for CRUD operations.
-   **Production Scheduling**: Visual Gantt chart with operation sequencer and algorithms (ASAP, ALAP, Drum/TOC). Includes auto-save, calendar management, theme switching, and enhanced version control with snapshots, rollback, and comprehensive version comparison (metrics, resource usage, time span analysis).
-   **Dashboarding & Analytics**: UI Design Studio for custom visualizations, AI-powered dashboard generation, and a drag-and-drop designer.
-   **Role-Based Access Control**: Unified permission system with feature-action permissions.
-   **AI Workflow Automation**: Natural language-powered workflow creation with template library, visual builder, and execution tracking.
-   **AI Agents Control Panel**: Centralized management interface for all AI agents.
-   **AI Automation Rules System**: Comprehensive system for automatic resolution of recurring issues from AI recommendations, with inline enablement, advanced options, rule management, and safety features.
-   **AI Recommendations Resolution**: Interactive resolution workflows with "Resolve Now" and "Show Plan First" options, including plan previews.
-   **Global Control Tower**: Enhanced with KPI target management, weighted performance tracking, autonomous optimization, and real-time plant monitoring.
-   **Production Scheduler Architecture**: Hybrid iframe/React architecture loading Bryntum Scheduler Pro via a backend API route.
-   **Voice Chat**: Integrates real-time voice chat with OpenAI's gpt-realtime-mini model using WebSocket and SSE.
-   **Demand Forecasting**: Native React-based forecasting application with SQL Server integration, dynamic table/column selection, and time-series forecasting with Recharts visualization, including intermittent demand handling.
-   **Dynamic Paginated Reports**: Enhanced page supporting SQL Server tables and Power BI datasets as data sources, featuring workspace/dataset/table selection, data querying, and full table browsing with pagination, filtering, sorting, and search.

## Important Implementation Notes

### Agent File Synchronization (CRITICAL)
**Each AI agent requires TWO synchronized files that MUST be kept in sync:**
- **Training Document** (`server/training/agents/[agent-name].md`): Defines specifications
- **Service Implementation** (`server/services/agents/[agent-name].service.ts`): Executes the code

**When modifying agents, ALWAYS update both files:**
- Adding new features → Update both .md documentation AND .ts implementation
- Changing response style → Update .md guidelines AND .ts formatting code
- Adding triggers → Update .md trigger list AND .ts triggers array
- Modifying queries → Update .md examples AND .ts database code

**Failure to synchronize these files will cause:**
- Agent confusion (implementation differs from specification)
- Missing features (documented but not implemented)
- Unexpected behavior (implemented but not documented)

### Production Scheduling Agent Capabilities
The Production Scheduling Agent (`production-scheduling-agent.service.ts`) can:
- Query all job data from `ptjobs` table with detailed information
- Show jobs by priority, status, due dates, completion
- Execute ASAP and ALAP scheduling algorithms with intelligent suggestions
- Interactive optimization: detects current state and suggests opposite algorithm
- Provides detailed algorithm insights when asked
- Manage resources and capabilities
- Create and load schedule versions
- Compare schedule versions with metrics and differences
- Delete schedule versions (single, range, or list)
- Uses professional language with bullet points for lists

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