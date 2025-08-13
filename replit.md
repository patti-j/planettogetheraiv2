# PlanetTogether - Manufacturing ERP System

## Overview
PlanetTogether is an AI-first Factory Optimization Platform, a full-stack manufacturing ERP system. It specializes in production scheduling, managing production orders, operations, resources, and capabilities with a visual Gantt chart interface. The system emphasizes data integrity, real-time optimization, and comprehensive reporting tailored for pharmaceutical, chemical, and industrial manufacturing. Its vision is to transform traditional ERP into an AI-first approach, leveraging AI for optimized production planning, dynamic resource allocation, and intelligent dashboarding. It supports complete supply chain visibility from procurement through production to sales, with full traceability, quality management, and financial integration.

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

## Recent Changes & Fixes
- **Extended Full-Screen Layout to Marketing Pages** (Aug 13, 2025): Applied full-screen layout pattern (fixed inset-0 with z-[9999] and overflow-auto) to pricing, marketing home, and solutions comparison pages for consistent public-facing page experience
- **Added Layout Density Control System** (Aug 13, 2025): Implemented comprehensive layout density controls with compressed, standard, and comfortable options. Added LayoutDensityContext for managing font sizes and spacing across the application. Created density toggle control in desktop header with visual row icons (Rows2, Rows3, Rows4). Added CSS variables and classes for density-specific font sizes, spacing, and line heights with localStorage persistence
- **Fixed Data Schema Page Header Overflow** (Aug 13, 2025): Fixed header controls being pushed off the right side of the page by improving responsive layout, adding flex-shrink-0 to prevent control compression, using icon-only buttons on mobile to save space, and optimizing gap spacing
- **Cleaned Up Production Schedule Navigation** (Aug 13, 2025): Removed redundant /production-scheduling route and menu item, keeping only the valid /production-schedule route and "Production Schedule" menu item in the Planning & Scheduling section

## System Architecture

### Navigation Architecture
- **Unified Layout System**: Single consistent header/navigation for desktop (DesktopLayout), single consistent footer bar for mobile (MobileLayout). Headers/footers never change across pages.
- **Mobile Footer Bar**: Navigation positioned at bottom of screen for optimal thumb reach, featuring Home, Menu, Search, Recent, and Profile buttons. Uses flexbox layout for iOS Safari compatibility.
- **Desktop Navigation**: Left rail navigation with slide-out menu and resizable AI panel on the right
- **Client-Side Navigation**: Mobile navigation uses wouter for smooth client-side routing, preventing unnecessary page reloads and auth state checks

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Framework**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Drag & Drop**: react-dnd with HTML5 backend for operation scheduling
- **Gantt Chart**: Bryntum Gantt 6.3.1 Trial for production scheduling visualization
- **Build Tool**: Vite for development and production builds
- **Widget System**: Comprehensive reusable components for consistent UI patterns (e.g., FilterSearchWidget, MetricsCardWidget, DataTableWidget). Two types: System widgets (non-editable, controlled by system) and User widgets (editable/customizable by users).
- **Navigation**: Desktop features left rail navigation with integrated slide-out menu, workspace switching, recent pages, and resizable right-side AI panel. Menu slides out from left to maintain context, showing clear relationship to navigation rail. Mobile navigation uses bottom footer bar for easier thumb access, featuring Home, Menu, Search, Recent, and Profile buttons. Uses same centralized navigation-menu.ts configuration as desktop for consistency across platforms.
- **UI/UX Decisions**: Consistent color schemes, professional modal designs, responsive layouts for mobile and desktop, standardized button styling (AI gradient, primary blue), intuitive navigation, integrated workflow for dashboard and widget creation, Excel-like cell editing, user-configurable layouts with persistence, and centralized layout density controls for optimal data visibility (compressed/standard/comfortable modes).

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (Neon Database for serverless PostgreSQL)
- **Storage**: DatabaseStorage class implementing IStorage interface.
- **API Design**: RESTful API with JSON responses, role-based authentication.
- **Authentication System**: Unified role-based permissions system with detailed permissions structure.
- **Data Seeding**: Automatic database seeding with sample manufacturing data.
- **AI Integration**: OpenAI GPT-4o for natural language processing, intelligent data generation, custom metric calculation, AI-powered modifications, and dynamic content creation.

### Core System Design & Features
- **Data Model**: Comprehensive database schema covering production orders, sales orders, items, resources, capabilities, bills of material, recipes, inventory transactions, and relational tables. Emphasizes normalized relationships for data integrity.
- **Manufacturing Hierarchy**: SAP-compliant production version architecture.
- **Inventory Management**: Stock-centric system tracking specific stock records for transfers, materials, production outputs, purchases, sales, and forecasting.
- **Master Data Management**: Unified interface for importing, entering, and templating master data types, with AI-powered modification and validation.
- **Scheduling & Optimization**: Visual Gantt chart, operation sequencer, advanced scheduling algorithms with configurable profiles, trade-off analysis, resource requirements, and constraints management (Theory of Constraints/TOC).
- **Dashboarding & Analytics**: UI Design Studio for custom visualizations, AI-powered dashboard generation, live data previews, and multi-dashboard views. Renamed from "Universal Design Studio" to clarify its focus on user interface elements (distinguishing from other design studios like Algorithm Design Studio).
- **Role-Based Access Control**: Unified permission system using roles array structure with feature-action permissions.
- **User Experience**: Session persistence for UI preferences, intelligent auto-fit for schema views, filter-specific layout persistence, comprehensive error handling, and reusable widget system.
- **Communication & Collaboration**: Integrated chat, feedback system, visual factory displays, and email notifications.
- **Mobile Responsiveness**: Mobile-first design for all pages and components.
- **Scaling Strategy**: Enterprise-grade production deployment with unlimited horizontal scaling achieved through database optimization, caching, background jobs, monitoring, CDN, messaging, and database-per-tenant architecture.

## External Dependencies

- **Database Provider**: Neon Database (serverless PostgreSQL)
- **AI/ML**: OpenAI API (GPT-4o, Whisper, TTS-1)
- **UI Libraries**: Radix UI, Shadcn/UI
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Drag & Drop**: react-dnd
- **Form Management**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **Charting**: Recharts, Chart.js
- **Session Management**: connect-pg-simple