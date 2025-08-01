# PlanetTogether - Manufacturing ERP System

## Overview

PlanetTogether is an AI-first Factory Optimization Platform, a full-stack manufacturing ERP system built with React, TypeScript, Express, and PostgreSQL. It specializes in production scheduling, managing production orders, operations, resources, and capabilities with a visual Gantt chart interface and drag-and-drop functionality. The system emphasizes data integrity, real-time optimization, and comprehensive reporting capabilities tailored for pharmaceutical, chemical, and industrial manufacturing workflows. It aims to provide seamless deployment, advanced analytics, and AI-powered assistance for efficient factory operations.

The platform's vision is to transform traditional ERP functionality into an AI-first approach, leveraging artificial intelligence for core differentiators like optimized production planning, dynamic resource allocation, and intelligent dashboarding. It supports complete supply chain visibility from procurement through production to sales, with full traceability, quality management, and financial integration.

## User Preferences

Preferred communication style: Simple, everyday language.

Multiple users working on project:
- JC = Jim
- PJ = Patti

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