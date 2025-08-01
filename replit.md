# PlanetTogether - Manufacturing ERP System

## Overview

PlanetTogether is an AI-first Factory Optimization Platform, a full-stack manufacturing ERP system built with React, TypeScript, Express, and PostgreSQL. It specializes in production scheduling, managing production orders, operations, resources, and capabilities with a visual Gantt chart interface and drag-and-drop functionality. The system emphasizes data integrity, real-time optimization, and comprehensive reporting capabilities tailored for pharmaceutical, chemical, and industrial manufacturing workflows. It aims to provide seamless deployment, advanced analytics, and AI-powered assistance for efficient factory operations.

The platform's vision is to transform traditional ERP functionality into an AI-first approach, leveraging artificial intelligence for core differentiators like optimized production planning, dynamic resource allocation, and intelligent dashboarding. It supports complete supply chain visibility from procurement through production to sales, with full traceability, quality management, and financial integration.

## Recent Changes (August 1, 2025)
- Comprehensively updated data-import UI to align with current database schema after structural changes
- Added new data types to import system: plannedOrders, discreteOperations, processOperations, plantResources
- Added quality management data types: qualityTests, inspectionPlans, certificates
- Updated all import functionality including API endpoints, sheet name mappings, field definitions, and template configurations
- Enhanced operation types to support both discrete manufacturing and process industries
- Integrated production planning with planned orders capability for MRP functionality
- Updated feature-to-data-type mappings to reflect new manufacturing planning capabilities
- Aligned record counting system with new table structures and naming conventions
- Maintained backward compatibility while adding comprehensive new functionality
- Fixed hamburger menu mobile layout with proper card sizing and inline "Show More" buttons (Patti)
- Restored homepage to show marketing landing page instead of dashboard for authenticated users (Patti)
- **Database Schema Update**: Changed planned_orders table to use item_id (foreign key to items table) instead of item_number text field for proper relational integrity
- **Comprehensive Dark Mode Fixes**: Applied systematic dark mode support across 20+ components and pages including inventory-optimization, dashboard-manager-enhanced, billing, analytics, capacity-planning, data-import, ai-agent, guided-tour, integrated-ai-assistant, kanban-board, assigned-role-switcher, atp-ctp, boards, canvas, and analytics-new. Applied consistent patterns: bg-white → dark:bg-gray-800, text-gray-900 → dark:text-white, bg-gray-50 → dark:bg-gray-900, and colored backgrounds with appropriate dark variants
- **Hamburger Menu Dark Mode Fix**: Resolved persistent white background issue in hamburger menu feature cards. Root cause was inline styles overriding CSS classes. Fixed by removing hardcoded backgroundColor inline styles and using proper Tailwind classes (bg-gray-50 dark:bg-gray-700) for consistent dark mode support
- **Product Development Page Dark Mode**: Applied comprehensive dark mode support to Product Development page including all tabs (Strategy, Roadmap, Architecture, Development, Testing, Overview). Enhanced architecture tab with detailed component overview and testing tab with comprehensive metrics
- **Fixed Hamburger Menu Overlap**: Added proper left padding (pl-16) to Product Development page to prevent hamburger menu from overlapping page title and content
- **3-Level Scaling Strategy Implementation**: Added comprehensive Database-Per-Tenant scaling strategy across Strategy, Roadmap, and Architecture tabs. Includes Phase 1 (Foundation improvements - Q3 2025), Phase 2 (Infrastructure scaling - Q4 2025), and Phase 3 (Multi-tenant architecture - Q1-Q2 2026) with detailed implementation roadmap aligned to current date (August 1, 2025)
- **Phase 1 Foundation Implementation Started**: Began Phase 1 database-per-tenant scaling foundation work. Successfully implemented enhanced database connection pooling with monitoring endpoints (/api/system/db-health, /api/system/db-metrics, /api/system/performance), optimized pool configuration, and real-time connection tracking. Phase 1 progress: 25% complete (1 of 4 major items). Next: Redis caching implementation.

## User Preferences

Preferred communication style: Simple, everyday language.

Multiple users working on project:
- JC = Jim
- PJ = Patti

Note on concurrent work (August 1, 2025):
- Jim and Patti work on different issues concurrently
- Each conversation/thread is independent - I don't retain context between different sessions
- Best practice: Start each request with your name/initials for clarity
- If continuing previous work, briefly mention what was done before

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Framework**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Drag & Drop**: react-dnd with HTML5 backend for operation scheduling
- **Build Tool**: Vite for development and production builds
- **UI/UX Decisions**: Consistent color schemes, professional modal designs, responsive layouts for mobile and desktop, standardized button styling (AI gradient, primary blue), intuitive navigation with clear labels and icons, integrated workflow for dashboard and widget creation, Excel-like cell editing, and user-configurable layouts with persistence.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (Neon Database for serverless PostgreSQL)
- **Storage**: DatabaseStorage class implementing IStorage interface with high-performance methods for large datasets.
- **API Design**: RESTful API with JSON responses, robust authentication (session + token) and role-based access control.
- **Data Seeding**: Automatic database seeding with sample manufacturing data.
- **AI Integration**: OpenAI GPT-4o for natural language processing, intelligent data generation, custom metric calculation, AI-powered modifications, collaborative algorithm development, and dynamic content creation (dashboards, widgets, tours, reports).

### Core System Design & Features
- **Data Model**: Comprehensive database schema covering production orders, sales orders, items, resources, capabilities, bills of material, recipes, inventory transactions, vendors, customers, departments, work centers, and various relational tables. Emphasizes normalized relationships with foreign key constraints for data integrity.
- **Manufacturing Hierarchy**: SAP-compliant production version architecture linking BOMs/Recipes to production orders through production versions.
- **Inventory Management**: Stock-centric system where transfers, materials, production outputs, purchases, sales, and forecasting all track specific stock records.
- **Master Data Management**: Unified interface for importing, entering, and templating all master data types. Includes AI-powered modification and data validation.
- **Scheduling & Optimization**: Visual Gantt chart, operation sequencer, advanced scheduling algorithms (backwards, planned order generator) with configurable profiles, trade-off analysis, resource requirements, and constraints management (Theory of Constraints/TOC implementation).
- **Dashboarding & Analytics**: Universal widget design studio for custom visualizations, AI-powered dashboard generation, live data previews, and multi-dashboard views.
- **Role-Based Access Control**: Granular permission system for all features and routes, integrated with demo roles and training mode. System roles can be edited (as of July 31, 2025).
- **User Experience**: Session persistence for UI preferences, intelligent auto-fit for schema views, filter-specific layout persistence, and comprehensive error handling.
- **Communication & Collaboration**: Integrated chat, feedback system, visual factory displays, and email notifications.
- **Mobile Responsiveness**: Mobile-first design for all pages and components, ensuring optimal experience on various devices.

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