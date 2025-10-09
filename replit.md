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
-   **Production Scheduling**: Visual Gantt chart, operation sequencer, advanced scheduling algorithms, and constraints management. Includes a PT Resource Capabilities System for appropriate resource-operation matching using `ptresourcecapabilities`.
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
-   **UI Libraries**: Radix UI, Shadcn/UI, Bryntum Scheduler Pro 7.0.0-alpha.1
-   **Styling**: Tailwind CSS
-   **State Management**: TanStack Query (React Query)
-   **Routing**: Wouter
-   **Drag & Drop**: react-dnd
-   **Form Management**: React Hook Form with Zod validation
-   **Date Handling**: date-fns
-   **Charting**: Recharts, Chart.js
-   **Session Management**: connect-pg-simple
-   **Icons**: FontAwesome Free (required separately from v7.0.0)

## Recent Updates

### Bryntum Scheduler Event Rendering Issue (October 9, 2025)

**CRITICAL ISSUE**: Events not rendering in both v6.3.3 and v7.0.0-alpha.1
- **Symptoms**: Scheduler loads resources and data (41 events, 12 resources) but events don't display on timeline
- **Root Cause**: Configuration issue, not a version bug - affects both v6 and v7
- **Current State**: Using v6.3.3 with Stockholm theme, horizontal timeline confirmed working
- **Data Loading**: Verified - console shows all events/assignments load successfully
- **Rendering**: Failed - visual timeline remains empty despite data presence
- **Next Steps**: Need to investigate SchedulerPro event rendering requirements vs regular Scheduler

### Bryntum Scheduler Pro 7.0.0-alpha.1 Initial Testing (October 9, 2025)

Attempted upgrade from v6.3.3 to v7.0.0-alpha.1 but reverted due to rendering issues:

#### Breaking Changes Handled:
1. **CSS Architecture Migration**: Migrated from SASS to nested CSS with custom properties
2. **Selector Naming**: Updated all CSS selectors from camelCase to kebab-case (e.g., `b-schedulerpro` → `b-scheduler-pro`)
3. **FontAwesome Integration**: Added as separate dependency (no longer built into Bryntum)
4. **New Theme System**: Implemented Stockholm theme (user requested) - replaces Material themes
5. **Resource Image Extension**: Changed default from .jpg to .png
6. **Script Loading**: Implemented manual script loading with proper error handling for iframe context
7. **Cache-Busting Fix**: Fixed infinite reload loop in iframe by using stable cache-buster value with useRef

#### CSS Conflict Resolution:
- **Issue**: Production scheduler had 800+ lines of inline CSS interfering with Bryntum themes
- **Solution**: Removed all conflicting inline styles, keeping only minimal essential layout CSS
- **Result**: Clean integration with Bryntum Stockholm theme without style conflicts

#### Implementation Details:
- The production scheduler uses a standalone HTML file with UMD build for iframe isolation
- Manual script loading ensures proper initialization in iframe context
- Stockholm theme provides a professional, clean appearance matching the enterprise nature of the system
- Resource data loads from PT database tables (ptresources, ptoperations)
- Scheduler displays 41 operations with 6% resource utilization across manufacturing resources

#### Important Notes:
- When using Bryntum components, avoid custom CSS that overrides component styling
- Let Bryntum themes handle all component appearance
- Keep custom styles minimal and focused on page layout only
- Use stable cache-busting values to prevent iframe reload loops