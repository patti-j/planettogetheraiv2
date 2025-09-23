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
- **PT Table Structure Integrity**: The system exclusively uses PT (PlanetTogether) tables for ALL manufacturing-related data. Legacy non-PT tables are deprecated and must not be used. Specific PT tables required include `ptjoboperations`, `ptjobs`, `ptresources`, `ptjobresources`, `ptjobsuccessormanufacturingorders`, `ptmanufacturingorders`, and `ptjobactivities`. Adding columns to PT tables is allowed, but deleting PT tables or columns, or using non-PT tables for manufacturing data, is forbidden. Integration requires mapping to PT column names and using PT's specific timestamp names and external_id fields.
- **External Partners Portal**: Single multi-tenant portal architecture for suppliers, customers, and OEM partners, incorporating AI-first features like intelligent onboarding and predictive analytics.
- **AI Agents Control Panel**: Centralized management interface for all AI agents (Max AI Assistant, System Monitoring Agent, Production Optimization Agent, Quality Analysis Agent, Predictive Maintenance Agent) with status, configuration, frequency, and performance controls.
- **Global Control Tower**: Enhanced with KPI target management, weighted performance tracking, autonomous optimization, performance visualization, and real-time plant monitoring with automated algorithm selection and parameter tuning.

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