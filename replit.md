# PlanetTogether - Manufacturing Production Scheduler

## Overview

This is a full-stack manufacturing production scheduler application built with React, TypeScript, Express, PostgreSQL, and Drizzle ORM. The system manages production jobs, operations, resources, and capabilities in a manufacturing environment with a visual Gantt chart interface and drag-and-drop functionality. The application now uses persistent PostgreSQL database storage instead of in-memory storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Framework**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Drag & Drop**: react-dnd with HTML5 backend for operation scheduling
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Storage**: DatabaseStorage class implementing IStorage interface
- **API Design**: RESTful API with JSON responses
- **Development**: Hot module replacement via Vite integration
- **Data Seeding**: Automatic database seeding with sample manufacturing data

### Project Structure
```
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions
├── server/          # Express backend
│   ├── routes.ts    # API route definitions
│   ├── storage.ts   # Data access layer
│   └── vite.ts      # Vite integration
├── shared/          # Shared types and schemas
│   └── schema.ts    # Drizzle schema definitions
└── migrations/      # Database migrations
```

## Key Components

### Database Schema
- **Capabilities**: Skills/abilities that resources can have
- **Resources**: Manufacturing equipment, personnel, or facilities
- **Jobs**: High-level production orders
- **Operations**: Specific tasks within jobs that require certain capabilities
- **Dependencies**: Relationships between operations defining execution order

### Core Features
1. **Job Management**: Create and manage production jobs with priorities and due dates
2. **Resource Management**: Define resources with specific capabilities
3. **Operation Scheduling**: Visual Gantt chart with drag-and-drop assignment
4. **Capability Matching**: Automatic validation of resource-operation compatibility
5. **Real-time Updates**: Live dashboard with production metrics

### UI Components
- **Gantt Chart**: Custom component for visualizing operation timelines
- **Drag & Drop**: Operations can be dragged between resources
- **Forms**: Comprehensive forms for creating jobs, resources, and operations
- **Metrics Dashboard**: Real-time production statistics
- **Responsive Design**: Mobile-friendly interface

## Data Flow

1. **Job Creation**: Users create jobs through the job form
2. **Operation Planning**: Operations are added to jobs with capability requirements
3. **Resource Assignment**: Operations are assigned to resources via drag-and-drop
4. **Capability Validation**: System ensures resources have required capabilities
5. **Timeline Visualization**: Gantt chart displays operation schedules
6. **Real-time Updates**: React Query keeps data synchronized

## External Dependencies

### Frontend Dependencies
- **UI Framework**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: TanStack Query for server state
- **Drag & Drop**: react-dnd for interactive scheduling
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns for date manipulation

### Backend Dependencies
- **Database**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database serverless PostgreSQL
- **Session Management**: connect-pg-simple for PostgreSQL sessions
- **Schema Validation**: Zod for runtime type checking

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution with nodemon-like behavior
- **Database**: Drizzle Kit for schema management and migrations

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles server code for Node.js
- **Database**: Migrations applied via Drizzle Kit push command

### Environment Configuration
- **Database**: Configured via DATABASE_URL environment variable
- **Build Output**: Frontend assets in `dist/public`, server bundle in `dist/`
- **Static Serving**: Express serves built frontend in production

The application uses a modern full-stack architecture with strong typing throughout, real-time updates, and an intuitive drag-and-drop interface for manufacturing production scheduling.

## Recent Changes (July 13, 2025)

✓ **Database Integration**: 
- Successfully migrated from in-memory storage to PostgreSQL database
- Implemented DatabaseStorage class with full CRUD operations
- Added automatic database seeding with sample manufacturing data
- Schema migration completed using Drizzle Kit

✓ **Sample Data**: 
- Added sample jobs with customer information (Tech Corp, AutoParts Inc)
- Created 5 capabilities (CNC Machining, Welding, Assembly, Quality Control, Packaging)
- Configured 6 resources with appropriate capabilities
- Set up 5 operations with proper job assignments and capability requirements

✓ **Persistent Storage**: 
- All data now persists across application restarts
- Database automatically seeds on first run
- Full capability-based resource matching working with persistent data

✓ **AI Agent Feature**: 
- Implemented comprehensive AI assistant with OpenAI integration
- Added voice recognition using OpenAI Whisper for speech-to-text
- Natural language processing with GPT-4o for command interpretation
- Voice and text-based commands for creating jobs, operations, and resources
- AI assistant page added to navigation with chat interface
- Action execution with real-time feedback and system integration

✓ **Drag-and-Drop Functionality Fixed**: 
- Resolved critical API validation errors for operation updates
- Fixed schema validation for date fields in operations API
- Added proper string-to-Date conversion in operation routes
- Drag-and-drop now correctly updates operation assignments with time calculations
- Operations can be seamlessly moved between resources on the Gantt chart timeline
- All drag-and-drop actions persist correctly in the PostgreSQL database

✓ **AI Assistant Job Creation Fixed**: 
- Corrected schema field mismatch from "customerName" to "customer" in job creation
- Fixed AI agent job creation error that was preventing new job creation
- AI assistant now properly creates jobs with correct customer field mapping

✓ **Custom Metrics Feature**: 
- Added CREATE_CUSTOM_METRIC and CALCULATE_CUSTOM_METRIC actions to AI assistant
- Implemented comprehensive custom metrics calculation system
- Supports predefined metrics: average_job_duration, resource_utilization_by_type, jobs_by_priority, completion_rate, average_lead_time
- AI can now create and calculate custom manufacturing metrics on demand

✓ **Product Rebranding**: 
- Updated product name from "Production Scheduler Pro" to "PlanetTogether"
- Updated branding in sidebar, page title, and documentation
- Maintained all existing functionality with new branding

✓ **Enhanced Gantt Chart with Hybrid Drag-and-Scroll (July 13, 2025)**:
- Implemented advanced zoom functionality: hour → day → week time scales
- Added hybrid navigation system combining drag-to-scroll with traditional scrollbars
- Timeline supports both horizontal scrollbar and drag-to-scroll navigation
- Resource list supports both vertical scrollbar and drag-to-scroll navigation
- Enhanced zoom controls with visual feedback showing current time unit
- Smooth synchronization between drag position and scrollbar position
- Improved cursor feedback (grab/grabbing states) for better UX
- Timeline now supports up to 24-hour granularity for detailed scheduling
- Users can choose between traditional scrolling or intuitive drag navigation
- Maintains all existing drag-and-drop operation assignment functionality

✓ **Gantt Panel Maximize Feature (July 13, 2025)**:
- Added maximize button to expand Gantt chart to full screen for optimal scheduling view
- Floating AI Assistant remains accessible in maximized mode with enhanced styling
- Seamless transition between normal and maximized views preserving all functionality
- Backdrop blur effect and smooth animations for professional user experience
- Minimize button allows quick return to normal dashboard view
- All zoom controls, view switching, and drag-and-drop operations work in maximized mode
- Floating AI Assistant positioned in bottom-right corner with quick command input

✓ **Hybrid Scroll System Enhancement (July 13, 2025)**:
- Implemented CSS transform-based timeline positioning replacing scroll synchronization
- Added requestAnimationFrame for smooth, performance-optimized scroll updates
- Integrated polling mechanism (60fps) to detect small scroll movements that don't trigger events
- Maintains both drag-to-scroll and traditional scrollbar navigation
- Resolved fundamental issue where timeline containers had identical scrollWidth/clientWidth
- Enhanced responsiveness for both small and large scroll movements
- Proper cleanup mechanisms to prevent memory leaks

✓ **Drag-and-Drop Conflict Resolution (July 13, 2025)**:
- Fixed critical issue where scrollbar polling interfered with operation dragging
- Enhanced drag detection to check for both timeline and operation dragging states
- Updated all scroll handlers (scroll events, polling, timeline scroll) to pause during operation dragging
- Implemented reliable drag state detection using DOM element class and style checks
- Both scrollbar functionality and drag-and-drop operations now work seamlessly together
- Maintains smooth scrollbar synchronization while preserving drag-and-drop precision

✓ **Visual Jumping Fix (July 13, 2025)**:
- Fixed operation blocks jumping to front of schedule when any operation is dropped
- Implemented optimistic updates in mutation to prevent cache invalidation flicker
- Added useMemo to operation position calculation to prevent unnecessary re-renders
- Reduced cache invalidation scope to only essential queries instead of all queries
- Operations now maintain stable visual positions during drag-and-drop operations

✓ **Operation Block Width Calculation Fix (July 13, 2025)**:
- Fixed operation block widths to accurately reflect their duration relative to zoom level
- Updated width calculation to use operation duration in hours vs time unit scale in hours (durationRatio)
- Operations now visually represent their actual duration (e.g., 2hr vs 6hr operations show proportional widths)
- Improved time unit conversion logic for accurate scaling across different zoom levels
- Visual block lengths now correctly scale from hours to weeks/months based on current view
- Fixed zoom level scaling: operations maintain proportional width across all zoom levels (hour/day/week/month)
- Implemented adaptive minimum width constraints to prevent operations from becoming invisible at extreme zoom levels
- Day view: 6hr operation = 50px, 2hr operation = 17px (proper proportional scaling)
- Month view: 6hr operation = 2px, 2hr operation = 2px (constrained by minimum width but mathematically correct scaling)

✓ **Custom Resource View Management System (July 13, 2025)**:
- Implemented complete resource view management with database schema and API endpoints
- Added resource view form with drag-and-drop resource sequencing using react-dnd
- Created resource view manager for creating, editing, and deleting custom resource groupings
- Integrated view selector in Gantt chart header for easy switching between resource sequences
- Added default view functionality and automatic resource ordering based on selected view
- Fixed dialog height constraints with scrollable content areas for better UX
- Renamed "Resource View" to "Resource Gantt" and "Operations View" to "Job Gantt" throughout the UI
- Resource views now allow users to create custom resource sequences for optimized scheduling workflows

✓ **In-Gantt Resource Reordering (July 13, 2025)**:
- Implemented drag-and-drop resource reordering directly within the Resource Gantt view
- Added DraggableResourceRow component with grip handles for intuitive resource sequencing
- Combined operation drop zones with resource reordering for seamless dual functionality
- Added visual feedback with opacity changes and grip icons for better user experience
- Resource reordering only available when a custom resource view is selected
- Fixed dialog title redundancy to show specific view names in edit dialogs
- Real-time updates to resource sequence with database persistence and toast notifications

✓ **View Persistence and Adjustable Row Heights (July 13, 2025)**:
- Fixed view selection persistence across maximize/minimize operations
- Added adjustable row height slider (20px to 200px range) in Resource Gantt header
- Applied dynamic height to all resource rows and unscheduled operations section
- Row height and view selections now persist when switching between normal and maximized views
- Optimized for maximum flexibility with minimum 20px row height and 5px step increments
- State management moved to dashboard level for consistent behavior across view modes
- Fixed row height constraints by removing fixed padding that prevented rows from shrinking below 80px
- Added resource type icons (wrench for machines, users for people, building for facilities)
- Simplified resource display by removing "Type:" and "Capabilities:" labels for cleaner, more compact layout
- Fixed resource type detection to properly show Users icon for "Operator" type resources
- Removed redundant resource type text, now showing only icons with capabilities
- Stabilized zoom button positioning to prevent cursor jumping during repeated clicks

✓ **Resource Action Menus with Context-Aware Actions (July 13, 2025)**:
- Added comprehensive "..." action menus for each resource with 6 different actions
- Context-aware actions: Edit Resource, Schedule Operations, View Schedule, Schedule Maintenance, Add Operation, Delete Resource
- Actions tailored for different user types (operators, managers, maintenance staff)
- Proper icons and visual hierarchy for intuitive resource management
- Positioned optimally in resource headers for easy access during scheduling

✓ **Advanced Text Label System Enhancement (July 13, 2025)**:
- Expanded text labeling to support 15+ field types including all job, operation, and resource fields
- Added calculated fields: Slack Days, Days Late, Completion Percent, Start Time, End Time
- Enhanced text configuration dialog with support for all new label types
- Comprehensive label options: Operation Name, Job Name, Due Date, Priority, Status, Duration, Progress, Resource Name, Customer, Job Description, Operation Description, Resource Type, Capabilities, Start Time, End Time, Slack Days, Days Late, Completion Percent
- Updated database schema to support expanded label configurations
- Enhanced operation block rendering to display calculated fields with proper formatting

✓ **Resource Row Drag-and-Drop Functionality (July 13, 2025)**:
- Implemented working drag-and-drop functionality for resource rows in Resource Gantt view
- Added grip handles on the left edge of resource rows for intuitive dragging
- Combined operation assignment and resource reordering in single interface
- Resource reordering only available when custom resource view is selected
- Visual feedback during drag operations with opacity changes
- Real-time updates to resource sequence with database persistence

✓ **AI Assistant Advanced View Management (July 13, 2025)**:
- Added AI capability to create Kanban boards from natural language ("create a Kanban board to show jobs by status")
- Implemented AI-driven resource view creation with field-based configurations
- Added AI control over Gantt chart zoom levels (hour/day/week/month) and scroll positions
- Enhanced AI command processing with custom event system for real-time UI manipulation
- AI can now manipulate Gantt chart views, create custom boards, and manage resource sequences
- Voice and text commands support for advanced view creation and configuration

✓ **Text Labeling System Simplification (July 13, 2025)**:
- Simplified text labeling dropdown to show only custom text labels instead of individual field options
- Removed confusing individual field options (operation_name, job_name, both, duration, etc.)
- Added AI-powered custom text label creation feature with natural language prompt input
- Enhanced custom text label manager with "AI Create" button for intelligent label generation
- AI can analyze prompts and create multiple custom text labels with appropriate field configurations
- Improved user experience by focusing on custom label configurations rather than scattered field options
- Added CREATE_CUSTOM_TEXT_LABELS action to AI agent for automatic label creation from descriptions

✓ **Individual Text Label Styling Enhancement (July 13, 2025)**:
- Enhanced text labeling system to support individual font size and color styling for each label element
- Updated database schema to include fontSize and fontColor properties for each label element
- Modified custom text label manager UI with individual styling controls (size and color inputs)
- Updated operation-block rendering to apply individual styling to each text element using JSX
- Each element in custom text labels (job name, due date, operation name) can now have unique styling
- Enhanced drag-and-drop functionality for label ordering with per-element styling support

✓ **Kanban Board Crash Fix and AI Creation (July 13, 2025)**:
- Fixed critical Kanban board crash caused by undefined swimLanes property reference
- Corrected display logic to use swimLaneField instead of non-existent swimLanes array
- Added AI-powered Kanban board creation feature with natural language prompts
- Implemented "AI Create" button in Kanban configurator with Sparkles icon
- Added AI creation dialog with textarea for describing desired board configuration
- AI can now create Kanban boards from descriptions like "track jobs by priority with color coding"
- Enhanced Kanban configurator UI with improved button layout and AI integration