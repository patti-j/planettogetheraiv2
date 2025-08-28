# PlanetTogether - Manufacturing SCM + APS System

## Overview
PlanetTogether is an AI-first Factory Optimization Platform, a full-stack manufacturing SCM + APS system specializing in production scheduling with a visual Gantt chart interface. Its vision is to leverage AI for optimized production planning, dynamic resource allocation, and intelligent dashboarding. The system provides complete supply chain visibility from procurement through production to sales, with traceability, quality management, and financial integration, emphasizing data integrity, real-time optimization, and comprehensive reporting for pharmaceutical, chemical, and industrial manufacturing. It aims to provide an enterprise-grade production deployment with unlimited horizontal scaling.

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

## Recent Major Changes (August 2025)
- **Operator Dashboard Real Data Integration & UI Cleanup** (August 28, 2025): Fixed operator dashboard to display real PT Publish data instead of "Unknown Job/Resource" placeholders. Operations now show actual brewing job names like "JOB-NCB-001-00001" and descriptions like "Brewing 5804 liters of Newcastle Brown Ale", with real equipment names like "Brew Kettle 1". Added brewing-specific quality checks, materials, and tools based on operation type. Removed redundant maximize button since fullscreen functionality exists in header. Enhanced error handling with detailed debugging for operation control functionality.
- **Operator Dashboard Operation Control Completed** (August 28, 2025): Implemented comprehensive operation control functionality with start/pause/finish/hold buttons, real-time timing tracking, status-based actions, and professional confirmation dialogs. Added new `/api/operations/:id/control` backend endpoint for handling all operation control actions with audit trail logging. Fixed time tracking clock-out error by improving API endpoint to handle requests without specific entry IDs. Features color-coded control buttons (green start, orange pause, blue finish, red hold), timing information panels showing elapsed time and durations, and complete integration with existing operation management system.
- **Workspace Switcher & Role Management Fixed** (August 28, 2025): Fixed critical workspace switcher that was showing "No Workspace" by implementing proper role-based workspace mapping and multi-role assignment system. Added manufacturing-specific roles (Production Manager, Quality Manager, Maintenance Manager, Supply Chain Manager, Plant Manager) with workspace switching capabilities. Fixed role switching authentication issue that was logging out users by removing page reload and using React Query cache invalidation instead. Both Jim and admin users now have multiple roles for testing workspace switching functionality.
- **Control Tower KPI & Autonomous Optimization Enhancement** (August 28, 2025): Implemented comprehensive KPI target management system with weighted performance tracking, real-time performance visualization, and autonomous optimization configuration. Added ability to create, edit, and monitor multiple KPI targets per plant with customizable thresholds (excellent/good/warning/critical), performance history tracking over time, and autonomous algorithm selection with parameter tuning capabilities. Includes complete form interfaces for KPI target management and optimization configuration with support for multiple algorithms (ASAP, ALAP, Critical Path, Resource Leveling, Drum/TOC).
- **Homepage Authentication Routing Fixed** (August 27, 2025): Resolved critical routing issue where authenticated users visiting homepage (/) were seeing WebsiteApp instead of ApplicationApp. Updated App.tsx authentication logic to properly show full application interface with complete navigation menu for authenticated users.
- **AI Insights Dashboard**: Created comprehensive dedicated AI insights page with advanced filtering, search, statistics dashboard, and detailed insight cards replacing inline Max panel insights
- **Max AI Panel Enhancement**: Streamlined Max AI panel by removing insights tab and adding navigation button to dedicated AI Insights page
- **API Infrastructure**: Added comprehensive backend support for AI insights with /api/ai-insights endpoints and sample data including production optimization, quality alerts, and maintenance predictions
- **Navigation Integration**: Added AI Insights to the AI & Analytics menu section for easy access with gradient purple-pink styling
- **Role-Based Workspaces**: Created comprehensive sample workspaces for 10 key manufacturing roles including Production Manager, Quality Manager, Maintenance Manager, Supply Chain Manager, Plant Manager, Shift Operations, Production Planning, Engineering Support, Warehouse Operations, and Manufacturing Finance
- **Sample Data Implementation**: Successfully added comprehensive AI memories sample data including scheduling optimization, quality management, maintenance strategy, dashboard configuration, and inventory optimization preferences
- **Max AI Prompt Simplification**: Updated all user-facing prompts from "Ask Max AI anything..." to "Ask anything" for cleaner, more concise interface
- **AI Icon Standardization**: Completed comprehensive replacement of all Brain icons with Sparkles icons across the entire application for consistent AI branding (35+ files updated)
- **Authentication Enhancement**: Successfully added five admin users with "padres" password and Administrator roles
- **Route Security**: Fixed critical routing issue by adding /production-scheduler-js to publicPaths array
- **PlanetTogether Migration**: Completed v13-14 migration with all branding and authentication issues resolved
- **AI Design Consistency**: All AI-related features now use consistent Sparkles icon throughout navigation panels, dialogs, and interface elements. **Always use Sparkles icon for AI branding, never Brain or other icons.**
- **AI Agents Control Panel** (August 28, 2025): Added comprehensive AI Agents management interface in app settings with centralized control for all AI agents including Max AI Assistant, System Monitoring Agent, Production Optimization Agent, Quality Analysis Agent, and Predictive Maintenance Agent. Features include status overview, individual agent configuration, frequency settings, performance modes, and global agent controls.
- **Global Control Tower Advanced Features**: Enhanced with comprehensive KPI target management, weighted performance tracking, autonomous optimization configuration, performance visualization charts, and real-time plant monitoring with automated algorithm selection and parameter tuning capabilities

## System Architecture

### Design Principles & Guidelines
- **User Experience First**: Prioritize intuitive interfaces and responsive design.
- **Data Integrity**: Always connect to real data sources.
- **Performance**: Optimize for fast loading and smooth interactions.
- **Accessibility**: Ensure mobile-responsive design with proper touch targets.
- **Consistency**: Maintain uniform styling, patterns, and user flows.

### Frontend Architecture
- **Framework**: React 18 with TypeScript.
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
- **PT Table Structure Integrity**: Minimize modifications to PT Publish table structures; maintain original structure with documented variations. Preserve legacy tables by renaming. Map to PT column names, accept complex joins, and use PT's specific timestamp names and external_id fields when integrating with PT Publish tables.
- **External Partners Portal**: Single multi-tenant portal architecture serving suppliers, customers, and OEM partners with an AI-first approach (intelligent onboarding, natural language interfaces, predictive analytics, role-based experiences).

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