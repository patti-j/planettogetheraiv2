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

## System Architecture

### Design Principles & Guidelines
- **User Experience First**: Prioritize intuitive interfaces and responsive design.
- **Data Integrity**: Never use mock data; always connect to real data sources.
- **Performance**: Optimize for fast loading and smooth interactions.
- **Accessibility**: Ensure mobile-responsive design with proper touch targets.
- **Consistency**: Maintain uniform styling, patterns, and user flows across all features.

### Frontend Architecture
- **Framework**: React 18 with TypeScript.
- **UI Framework**: Shadcn/UI components built on Radix UI primitives.
- **Styling**: Tailwind CSS with custom CSS variables.
- **State Management**: TanStack Query (React Query) for server state.
- **Routing**: Wouter.
- **Drag & Drop**: react-dnd with HTML5 backend.
- **Gantt Chart**: Bryntum Scheduler Pro (Full Licensed Version) for production scheduling visualization.
  - License: patti.jorgensen@planettogether.com
  - Features: Complete optimization engine with ASAP, ALAP, Critical Path, and Resource Leveling algorithms
  - Capabilities: Drag-and-drop rescheduling, resource allocation, constraint management, conflict detection
  - Integration: Real-time synchronization with PlanetTogether database tables
- **Build Tool**: Vite.
- **Widget System**: Reusable components for consistent UI patterns (System and User widgets).
- **UI/UX Decisions**: Consistent color schemes, professional modal designs, responsive layouts, standardized button styling, intuitive navigation, integrated workflow for dashboard and widget creation, Excel-like cell editing, user-configurable layouts with persistence, and centralized layout density controls.

### Backend Architecture
- **Framework**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **Storage**: DatabaseStorage class implementing IStorage interface.
- **API Design**: RESTful API with JSON responses, role-based authentication.
- **Authentication System**: Unified role-based permissions system.
- **Data Seeding**: Automatic database seeding with sample manufacturing data.
- **AI Integration**: OpenAI GPT-4o for natural language processing, intelligent data generation, custom metric calculation, AI-powered modifications, and dynamic content creation.
- **Hint System Service**: Intelligent contextual hints with user interaction tracking, prerequisites, and sequence management.

### Recent Updates (January 2025)
- **Bryntum Scheduler Pro Full Integration**: Complete optimization engine with all algorithms working (ASAP, ALAP, Critical Path, Resource Leveling)
- **Bryntum Chart.js Integration Demo**: Advanced scheduler demo with embedded utilization charts
  - Row expander feature showing real-time resource utilization
  - Advanced drag-and-drop with validation (capacity constraints, working hours)
  - Custom drag tooltips showing resource, time, and duration
  - Event resizing with duration display
  - Automatic chart updates on event movement
  - Page accessible at /bryntum-chart-demo
- **Intelligent Contextual Hint Bubbles**: Context-aware help system with user interaction tracking
  - Database tables: hint_configurations, user_hint_interactions, hint_sequences
  - React component: HintSystem integrated into main app layout
  - API endpoints: /api/hints for fetching and tracking hint interactions
  - Initial hints seeded for dashboard, schedule, resource timeline, optimization, and alerts
- **Resource Timeline Fixes**: Resolved hoisting issue with initializeSchedulerEngine function
- **External Partners Portal**: Multi-tenant architecture for suppliers, customers, and OEM partners

## Core System Design & Features
- **Navigation Architecture**: Unified layout system with consistent header/navigation for desktop and footer bar for mobile. Client-side navigation uses wouter.
- **Data Model**: Comprehensive database schema for manufacturing, emphasizing normalized relationships, including SAP-compliant production version architecture.
- **Inventory Management**: Stock-centric system tracking specific records.
- **Master Data Management**: Unified interface with AI-powered modification and validation.
- **Production Scheduling**: Visual Gantt chart, operation sequencer, advanced scheduling algorithms (ASAP, ALAP, Critical Path, Resource Leveling), and constraints management.
- **Dashboarding & Analytics**: UI Design Studio for custom visualizations, AI-powered dashboard generation, live data previews, and visual drag-and-drop dashboard designer with widget library.
- **Role-Based Access Control**: Unified permission system with feature-action permissions.
- **User Experience**: Session persistence for UI preferences, intelligent auto-fit, filter-specific layout persistence, comprehensive error handling, and reusable widget system.
- **Communication & Collaboration**: Integrated chat, feedback system, visual factory displays, and email notifications. Max AI service provides real-time production intelligence, status monitoring, schedule analysis, bottleneck detection, resource conflict detection, and optimization recommendations. It integrates OpenAI GPT-4o for context-aware responses and proactive insights.
- **Mobile Responsiveness**: Mobile-first design with enhanced login page accessibility and proper viewport handling.
- **Scaling Strategy**: Enterprise-grade production deployment with unlimited horizontal scaling.
- **AI Alert System**: Configurable AI analysis triggers (scheduled, event-based, threshold-based, continuous) with OpenAI GPT-4o integration, analysis scheduling, and management API endpoints.
- **Data Schema Visualization**: Interactive lasso selection tool for focused analysis of table groups.
- **PT Table Structure Integrity**: Minimize modifications to PT Publish table structures. PT tables should maintain their original structure with approved variations only. All approved variations must be documented. Preserve legacy tables by renaming rather than deletion.
- **PT Table Migration & Query Adaptation**: When migrating from old tables to PT Publish tables, always map to PT column names, accept more complex joins, compute missing columns in the application layer or use alternatives, use PT's specific timestamp names, utilize external_id fields, and join through plant_id for plant context. Never modify PT table structure to simplify queries.
- **External Partners Portal**: Single multi-tenant portal architecture serving suppliers, customers, and OEM partners with AI-first approach. Features intelligent onboarding, natural language interfaces, predictive analytics, and role-based experiences. Portal served from `/portal` route with separate authentication and company-based access control.

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