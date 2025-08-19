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
- **Gantt Chart**: Bryntum Gantt for production scheduling visualization.
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

### Core System Design & Features
- **Navigation Architecture**: Unified layout system with consistent header/navigation for desktop and footer bar for mobile. Client-side navigation uses wouter.
- **Data Model**: Comprehensive database schema for manufacturing, emphasizing normalized relationships, including SAP-compliant production version architecture.
- **Inventory Management**: Stock-centric system tracking specific records.
- **Master Data Management**: Unified interface with AI-powered modification and validation.
- **Production Scheduling**: Visual Gantt chart, operation sequencer, advanced scheduling algorithms, and constraints management. Includes detailed analysis and strategy for Bryntum Scheduler Pro algorithms like ChronoGraph.
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

## Bryntum Gantt Integration Guide

### Implementation Approach
- **Integration Method**: Using UMD build loaded via HTML script tags (due to trial version limitations)
- **Component**: BryntumSchedulerWrapper - custom wrapper component for Gantt integration
- **Data Source**: PT (PlanetTogether) database tables with 521+ brewery operations

### Key Technical Solutions

#### 1. Loading Strategy
- Load Bryntum Gantt UMD build in index.html via script tags
- Wait for window.bryntum.gantt to be available before initialization
- Use setTimeout retry pattern for library detection

#### 2. Configuration Approach
- Start with minimal configuration - avoid complex features initially
- Basic config includes: columns, tasks, startDate, endDate, height
- Add advanced features (eventDrag, eventResize) gradually after basic setup works

#### 3. Critical Fixes Applied
- **Dependency Array Fix**: Removed `isInitialized` from useEffect dependencies to prevent re-initialization loops
- **Instance Guard**: Added check for existing scheduler instance to prevent duplicate initializations
- **React Strict Mode**: Component handles double-mounting gracefully with proper cleanup

#### 4. Working Minimal Configuration
```javascript
const config = {
  appendTo: containerRef.current,
  height: 400,
  startDate: '2025-08-19',
  endDate: '2025-08-31',
  columns: [
    { type: 'name', text: 'Task', width: 250 }
  ],
  tasks: simpleTasks // Array of {id, name, startDate, duration, percentDone}
};
```

#### 5. Data Integration Pattern
- Fetch operations from `/api/pt-operations`
- Transform PT data to Gantt task format
- Load first 20-50 tasks initially for performance
- Update taskStore.data after initial render

#### 6. Console Indicators of Success
- "Bryntum.gantt available? true"
- "✅ Gantt created successfully!"
- "Loading real tasks: X tasks"
- "Scheduler initialized successfully"

### Common Issues & Solutions
1. **"Cannot read properties of undefined"**: Bryntum library not loaded yet - add wait/retry logic
2. **Component destroying immediately**: Fix dependency array in useEffect
3. **Multiple instances created**: Add instance guard check
4. **No visual output**: Check container height is set properly (use number not string)

## Recent Updates & Improvements

### August 19, 2025
- **Bryntum Scheduler Pro Integration**: ✅ COMPLETE - Successfully replaced Gantt with Scheduler Pro for resource-centered view
- **Resource-Centered Timeline**: ✅ IMPLEMENTED - Resources displayed on left axis with operations on timeline, showing 46 resources and 521 operations
- **Advanced Features Configuration**: ✅ ENHANCED - Added drag-drop, resize, enhanced tooltips, event selection, filtering, sorting, striping, and interactive event handlers
- **Fallback Configuration**: ✅ ADDED - Implemented automatic fallback to minimal config if advanced features fail
- **Interactive Event Handlers**: ✅ CONFIGURED - Added listeners for drag, resize, click, and double-click events on operations and resources

### August 19, 2025 (Earlier)
- **External Partners Portal**: ✅ NEW ARCHITECTURE - Built AI-first multi-tenant portal for suppliers, customers, and OEM partners
- **Portal Foundation**: ✅ IMPLEMENTED - Created portal database schema, authentication system, API routes, and frontend structure
- **AI Assistant Integration**: ✅ BUILT - Developed Max AI assistant with natural language capabilities, document intelligence, and predictive analytics
- **Supplier Dashboard**: ✅ CREATED - Built comprehensive supplier portal with purchase order management, delivery tracking, quality documents, and performance metrics
- **Unified Architecture Decision**: ✅ STRATEGIC - Chose single multi-tenant portal approach over separate portals for better AI learning and resource sharing
- **Portal API Integration**: ✅ COMPLETE - Fully integrated portal authentication and session management APIs with main server at `/api/portal/*` endpoints
- **Portal Security**: ✅ IMPLEMENTED - JWT-based authentication with bcrypt password hashing, session management, and role-based access control
- **Portal Routes Active**: ✅ LIVE - Portal login (`/api/portal/login`), registration (`/api/portal/register/*`), and session management endpoints fully operational

### August 18, 2025
- **Widget System Bug Fixes**: ✅ MAJOR FIX - Fixed critical JSON parse errors in mobile widgets endpoint that was returning HTML instead of JSON
- **API Endpoints Completion**: ✅ COMPLETE - Added missing /api/cockpit/widgets endpoint, validated all widget/dashboard endpoints working properly
- **TypeScript Compilation**: ✅ RESOLVED - Fixed 337+ LSP compilation errors across mobile-home.tsx and dashboards.tsx files
- **Mobile Widget Integration**: ✅ VALIDATED - Confirmed mobile widgets (4 types), mobile dashboards (5 types), cockpit widgets (2), and canvas widgets (27) all functioning
- **System Stability**: ✅ IMPROVED - All widget and dashboard systems now stable with proper error handling and data flow

### August 17, 2025
- **Welcome/Overview Screen**: ✅ NEW - Created comprehensive welcome screen for new users showing system capabilities, expected ROI (30-50% lead time reduction, 25% resource utilization increase), and 5-phase implementation timeline
- **Onboarding Enforcement**: ✅ ACTIVATED - Enabled automatic onboarding flow for new users. System now automatically redirects new users to welcome/onboarding screen until they complete company setup and feature selection
- **Onboarding Integration**: ✅ IMPROVED - Welcome overview now appears as first step in onboarding process, providing clear introduction before company setup

### August 16, 2025
- **Dashboard Data Loading Fix**: ✅ FIXED - Fixed dashboard configuration mapping issue causing all dashboards to show same content
- **Menu Organization Update**: ✅ IMPROVED - Moved SMART KPI Tracking from Planning & Scheduling to Business Management category, positioned directly under Business Goals
- **Planning Process Flow Organization**: ✅ IMPROVED - Reorganized Planning & Scheduling menu items to follow logical manufacturing planning process flow from demand planning through execution and optimization
- **Business Goals Dialog Tab Reordering**: ✅ IMPROVED - Moved Actions tab to immediately follow Overview tab in business goals dialog for better workflow sequence (Overview → Actions → Risks → Issues)