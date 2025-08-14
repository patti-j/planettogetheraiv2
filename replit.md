# PlanetTogether - Manufacturing ERP System

## Overview
PlanetTogether is an AI-first Factory Optimization Platform, a full-stack manufacturing ERP system specializing in production scheduling, managing production orders, operations, resources, and capabilities with a visual Gantt chart interface. Its vision is to transform traditional ERP into an AI-first approach, leveraging AI for optimized production planning, dynamic resource allocation, and intelligent dashboarding. The system supports complete supply chain visibility from procurement through production to sales, with full traceability, quality management, and financial integration, emphasizing data integrity, real-time optimization, and comprehensive reporting for pharmaceutical, chemical, and industrial manufacturing.

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

## Recent Changes
**2025-08-14**: Complete PT Import Database Schema (59 tables)
- Added 4 missing PT import tables: ForecastShipments, JobSuccessorManufacturingOrders, Lots, and ManufacturingOrders
- Achieved complete 59-table coverage matching the full PlanetTogether SQL script
- Enhanced lot traceability capabilities for pharmaceutical/chemical manufacturing
- Improved manufacturing order relationships and job successor dependencies
- PT import database now fully compatible with complete PlanetTogether system architecture

**2025-08-14**: Algorithm Governance Integration into Optimization Studio
- Successfully merged algorithm governance functionality into optimization studio page for streamlined workflow
- Integrated algorithm versions, plant approvals, and deployment management as additional tabs within optimization studio
- Added governance overview dashboard with metrics for total versions, pending approvals, and active deployments
- Consolidated deployment management - both optimization deployments and governance deployments in one interface
- Removed standalone algorithm governance page and routes to simplify navigation architecture
- Enhanced optimization studio with plant filtering and approval workflow management
- Fixed access permissions by adding algorithm-governance permission to Administrator role
- Removed floating Max circle UI element that was appearing on desktop and mobile

**2025-08-14**: PT Import Tables Enhancement
- All PT import tables already include auto-incrementing ID columns as primary keys using serial("id").primaryKey()
- Tables include: pt_plants, pt_allowed_helpers, pt_attributes, pt_capabilities, pt_departments, pt_resources, and 30+ other import tables
- Each record gets an automatic integer ID when added to any PT import table

**2025-08-14**: Comprehensive Bryntum Scheduler Pro Algorithm Research & Strategy
- Completed detailed analysis of available Bryntum Scheduler Pro algorithms and features
- Documented ChronoGraph scheduling engine capabilities (20-30x performance boost)
- Identified current implementation limitations: no resource leveling, basic constraints only
- Created comprehensive 4-phase implementation strategy document
- Outlined integration points for advanced features: resource histogram, optimization algorithms, Timefold integration
- Established success metrics and risk mitigation strategies for manufacturing scheduling optimization

## System Architecture

### Navigation Architecture
- **Unified Layout System**: Consistent header/navigation for desktop, consistent footer bar for mobile.
- **Mobile Footer Bar**: Navigation at bottom for optimal thumb reach (Home, Menu, Search, Recent, Profile).
- **Desktop Navigation**: Left rail navigation with slide-out menu and resizable AI panel.
- **Customizable Desktop Header**: Role-specific quick access items that users can add, remove, and reorder. Saves with workspace preferences.
- **Client-Side Navigation**: Uses wouter for smooth routing, preventing unnecessary reloads.

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
- **UI/UX Decisions**: Consistent color schemes, professional modal designs, responsive layouts, standardized button styling, intuitive navigation, integrated workflow for dashboard and widget creation, Excel-like cell editing, user-configurable layouts with persistence, and centralized layout density controls (compressed/standard/comfortable modes).

### Backend Architecture
- **Framework**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM (Neon Database).
- **Storage**: DatabaseStorage class implementing IStorage interface.
- **API Design**: RESTful API with JSON responses, role-based authentication.
- **Authentication System**: Unified role-based permissions system.
- **Data Seeding**: Automatic database seeding with sample manufacturing data.
- **AI Integration**: OpenAI GPT-4o for natural language processing, intelligent data generation, custom metric calculation, AI-powered modifications, and dynamic content creation.

### Core System Design & Features
- **Data Model**: Comprehensive database schema for manufacturing, emphasizing normalized relationships.
- **Manufacturing Hierarchy**: SAP-compliant production version architecture.
- **Inventory Management**: Stock-centric system tracking specific records.
- **Master Data Management**: Unified interface with AI-powered modification and validation.
- **Scheduling & Optimization**: Visual Gantt chart, operation sequencer, advanced scheduling algorithms, and constraints management.
- **Dashboarding & Analytics**: UI Design Studio for custom visualizations, AI-powered dashboard generation, and live data previews.
- **Role-Based Access Control**: Unified permission system with feature-action permissions.
- **User Experience**: Session persistence for UI preferences, intelligent auto-fit, filter-specific layout persistence, comprehensive error handling, and reusable widget system.
- **Communication & Collaboration**: Integrated chat, feedback system, visual factory displays, and email notifications.
- **Mobile Responsiveness**: Mobile-first design with enhanced login page accessibility and proper viewport handling.
- **Scaling Strategy**: Enterprise-grade production deployment with unlimited horizontal scaling.

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