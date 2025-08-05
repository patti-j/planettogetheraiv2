# PlanetTogether - Manufacturing ERP System

## Overview
PlanetTogether is an AI-first Factory Optimization Platform, a full-stack manufacturing ERP system built with React, TypeScript, Express, and PostgreSQL. It specializes in production scheduling, managing production orders, operations, resources, and capabilities with a visual Gantt chart interface and drag-and-drop functionality. The system emphasizes data integrity, real-time optimization, and comprehensive reporting capabilities tailored for pharmaceutical, chemical, and industrial manufacturing workflows. It aims to provide seamless deployment, advanced analytics, and AI-powered assistance for efficient factory operations. The platform's vision is to transform traditional ERP functionality into an AI-first approach, leveraging artificial intelligence for core differentiators like optimized production planning, dynamic resource allocation, and intelligent dashboarding. It supports complete supply chain visibility from procurement through production to sales, with full traceability, quality management, and financial integration.

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

**IMPORTANT AUTHENTICATION FIX COMPLETED (Aug 2025):**
- ✅ RESOLVED: Critical authentication bug where /api/auth/me returned demo_user instead of real admin
- Root cause: Storage layer schema mapping issue between database fields (is_active) and Drizzle mappings (isActive)
- Solution: Implemented direct database queries bypassing storage layer schema mapping issues
- Admin credentials: username="admin", password="password" 
- ✅ Authentication now correctly returns: admin user (ID: 1, Patti Administrator) with proper Administrator role permissions
- ✅ All API endpoints now receive correct authenticated user data instead of fallback demo_user

## Development Environment
- **Current Dev URL**: `https://61f90aef-5f5e-408c-ad3b-e3b748561a5b-00-32gbdm20d8sja.picard.replit.dev`
- **Note**: The dev URL changes when the workspace restarts, always check console logs for the current URL

Component terminology for reference:
- **Max mobile interface/panel**: Full-screen overlay component in mobile-home.tsx that appears when Max is opened on mobile

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Framework**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Drag & Drop**: react-dnd with HTML5 backend for operation scheduling
- **Build Tool**: Vite for development and production builds
- **Widget System**: Comprehensive reusable widget components (FilterSearchWidget, MetricsCardWidget, StatusIndicatorWidget, DataTableWidget, ActionButtonsWidget, KanbanCardWidget) for consistent UI patterns across all pages
- **UI/UX Decisions**: Consistent color schemes, professional modal designs, responsive layouts for mobile and desktop, standardized button styling (AI gradient, primary blue), intuitive navigation with clear labels and icons, integrated workflow for dashboard and widget creation, Excel-like cell editing, and user-configurable layouts with persistence.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (Neon Database for serverless PostgreSQL)
- **Storage**: DatabaseStorage class implementing IStorage interface with high-performance methods for large datasets.
- **API Design**: RESTful API with JSON responses, role-based authentication with proper roles array structure.
- **Authentication System**: Unified role-based permissions system without demo/non-demo distinction. All users have roles array with detailed permissions structure.
- **Data Seeding**: Automatic database seeding with sample manufacturing data.
- **AI Integration**: OpenAI GPT-4o for natural language processing, intelligent data generation, custom metric calculation, AI-powered modifications, collaborative algorithm development, and dynamic content creation (dashboards, widgets, tours, reports).

### Core System Design & Features
- **Data Model**: Comprehensive database schema covering production orders, sales orders, items, resources, capabilities, bills of material, recipes, inventory transactions, vendors, customers, departments, work centers, and various relational tables. Emphasizes normalized relationships with foreign key constraints for data integrity.
- **Manufacturing Hierarchy**: SAP-compliant production version architecture linking BOMs/Recipes to production orders through production versions.
- **Inventory Management**: Stock-centric system where transfers, materials, production outputs, purchases, sales, and forecasting all track specific stock records.
- **Master Data Management**: Unified interface for importing, entering, and templating all master data types. Includes AI-powered modification and data validation.
- **Scheduling & Optimization**: Visual Gantt chart, operation sequencer, advanced scheduling algorithms (backwards, planned order generator) with configurable profiles, trade-off analysis, resource requirements, and constraints management (Theory of Constraints/TOC implementation).
- **Dashboarding & Analytics**: Universal widget design studio for custom visualizations, AI-powered dashboard generation, live data previews, and multi-dashboard views.
- **Role-Based Access Control**: Unified permission system using roles array structure with feature-action permissions. Trainer role has comprehensive access for demonstrations, Production Scheduler has basic scheduling permissions.
- **User Experience**: Session persistence for UI preferences, intelligent auto-fit for schema views, filter-specific layout persistence, comprehensive error handling, and reusable widget system for consistent UX patterns.
- **Communication & Collaboration**: Integrated chat, feedback system, visual factory displays, and email notifications.
- **Mobile Responsiveness**: Mobile-first design for all pages and components, ensuring optimal experience on various devices.
- **Scaling Strategy**: ALL 3 PHASES COMPLETE (Aug 2025). Phase 1 Foundation: Database optimization and caching. Phase 2 Infrastructure: Background jobs, monitoring, CDN, messaging. Phase 3 Multi-Tenant: Database-per-tenant architecture with tenant management and isolation. System ready for enterprise-grade production deployment with unlimited horizontal scaling.

## External Dependencies

- **Database Provider**: Neon Database (serverless PostgreSQL)
- **AI/ML**: OpenAI API (GPT-4o for NLP, Whisper for speech-to-text, TTS-1 for text-to-speech)
- **UI Libraries**: Radix UI (primitives for accessible components), Shadcn/UI (React components)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Drag & Drop**: react-dnd
- **Form Management**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **Charting**: Recharts, Chart.js
- **Session Management**: connect-pg-simple (for PostgreSQL sessions)