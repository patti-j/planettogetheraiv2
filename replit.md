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

**IMPORTANT AUTHENTICATION & PERMISSIONS FIX COMPLETED (Aug 2025):**
- ✅ RESOLVED: Critical authentication bug where /api/auth/me returned demo_user instead of real admin
- ✅ RESOLVED: Missing permissions issue - admin user now has full access to schedule, analytics, reports
- Root cause: Two issues: 1) Storage layer schema mapping, 2) Hardcoded permissions in /api/auth/me endpoint
- Solution: 1) Direct database queries for authentication, 2) Dynamic permission loading from database
- Admin credentials: username="admin", password="password" 
- ✅ Authentication returns: admin user (ID: 1, Patti Administrator) with 34 comprehensive permissions
- ✅ All API endpoints receive correct authenticated user data with real database permissions
- ✅ Complete access to schedule (view/create/edit/delete), analytics (view/create/edit), reports (view/create)

**MOBILE NAVIGATION FIX COMPLETED (Aug 6, 2025):**
- ✅ RESOLVED: Mobile production navigation issue - Production button was redirecting back to mobile-home
- Root cause: App.tsx routing logic was blocking mobile users from accessing production routes
- Solution: Removed redirect logic that prevented mobile access to production pages
- Result: Mobile users can now navigate to production pages when clicking Production button
- Mobile-home page properly handles rendering production pages within mobile interface

**PRODUCTION-COCKPIT ROUTE FIX COMPLETED (Aug 6, 2025):**
- ✅ RESOLVED: Missing /production-cockpit route causing "no page" error from mobile navigation
- Root cause: ProductionCockpit component imported but /production-cockpit route not defined in App.tsx
- Solution: Added proper route definition with ProtectedRoute wrapper for production-cockpit feature
- Result: Users can now access production-cockpit page from mobile home navigation

**LOGIN IMPROVEMENTS (Aug 6, 2025):**
- ✅ ADDED: Case-insensitive username login
- Users can now log in with any case variation (e.g., "admin", "Admin", "ADMIN")
- Implementation: Using `ilike` comparison in login endpoint for case-insensitive matching
- Admin credentials remain: username="admin" (any case), password="password"

**LOGOUT IMPROVEMENTS (Aug 6, 2025):**
- ✅ FIXED: Logout race condition causing users to remain authenticated after logout
- Root cause: Authorization token persisting in localStorage during logout process 
- Solution: Clear auth token immediately at start of logout, before server requests
- Result: Users properly see landing page after logout + refresh, complete session cleanup

**CRITICAL SECURITY FIX (Aug 6, 2025):**
- ✅ FIXED: Authentication bypass vulnerability allowing unauthenticated access to production scheduling
- Root cause: /api/auth/me endpoint returning demo_user by default instead of 401 Unauthorized
- Solution: Removed all demo_user fallbacks, now returns 401 for any unauthenticated request
- Result: Unauthenticated users properly redirected to login page, no unauthorized access to protected routes

**UI IMPROVEMENTS (Aug 6, 2025):**
- ✅ FIXED: Better UI layout with hamburger menu on right, page controls just to its left
- Hamburger menu: Positioned at right-6 on all devices to avoid scrollbar overlap (moved from right-2)  
- Page controls: Export and Refresh buttons positioned just left of hamburger menu on desktop
- Result: No more overlapping UI elements, clean grouping of controls on right side
- Provides better UI balance and follows modern design conventions
- ✅ UNIFIED: Single hamburger menu for all devices
- Removed mobile-specific hamburger menu, desktop menu now shows on all screen sizes
- Provides consistent navigation experience across desktop and mobile
- ✅ FIXED: Hamburger menu visibility and functionality on mobile
- Button now visible with blue background (red when active) and white icon
- Fixed z-index layering (button at z-9999, menu at z-9998)
- Menu properly opens and closes when button is clicked
- ✅ FIXED: Desktop hamburger menu no longer overlaps with page refresh/maximize buttons
- ✅ FIXED: PT Logo display using actual favicon.svg file instead of generic Factory icon
- Logo now shows proper PlanetTogether branding with blue sections and gray geometric shapes
- ✅ ENHANCED: Theme toggle button visibility in light mode
- Added borders and better positioning at right-16 to avoid hamburger menu collision
- Button now clearly visible with proper contrast in both light and dark modes
- ✅ FIXED: Theme button overlap with hamburger menu close button
- Moved persistent theme toggle from left-6 to left-3 for better spacing
- Prevents overlap between theme button and hamburger close button
- ✅ FIXED: Production schedule page layout with proper theme toggle and hamburger menu positioning
- Theme toggle positioned to the left of hamburger menu (right-20) to avoid page title overlap
- Hamburger menu moved to right-8 for better scroll bar clearance (was right-6)
- Removed wrapper div from floating hamburger menu for cleaner code structure
- Updated header spacing to accommodate both theme toggle and hamburger menu on right side
- ✅ REMOVED: Global persistent theme toggle from left side to avoid duplicate theme toggles
- Page-specific theme toggle on production schedule replaces global positioning

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