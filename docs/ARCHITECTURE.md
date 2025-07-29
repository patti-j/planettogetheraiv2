# System Architecture

This document describes the technical architecture of the PlanetTogether Manufacturing ERP system.

## 🏗️ High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (React)       │◄──►│   (Express)     │◄──►│  (PostgreSQL)   │
│   Port: 5173    │    │   Port: 5000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐             │
         └──────────────►│   AI Services   │             │
                         │   (OpenAI)      │             │
                         └─────────────────┘             │
                                  │                      │
                         ┌─────────────────┐             │
                         │  External APIs  │             │
                         │  (Future)       │             │
                         └─────────────────┘             │
                                                         │
                                                ┌─────────────────┐
                                                │   File Storage  │
                                                │   (Local/Cloud) │
                                                └─────────────────┘
```

## 🎯 Frontend Architecture

### Technology Stack
- **React 18**: Component-based UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast development build tool
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality component library
- **React Query**: Data fetching and caching
- **React Flow**: Interactive schema visualization
- **Wouter**: Lightweight routing

### Component Structure
```
client/src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   ├── forms/          # Form components
│   ├── layouts/        # Layout components
│   └── visualizations/ # Chart and graph components
├── pages/              # Page components
│   ├── dashboard/      # Dashboard pages
│   ├── production/     # Production management
│   ├── inventory/      # Inventory management
│   ├── quality/        # Quality control
│   └── data-schema/    # Schema visualization
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── types/              # TypeScript type definitions
└── styles/             # Global styles
```

### State Management
- **React Query**: Server state management
- **React Hooks**: Local component state
- **Context API**: Global application state
- **Local Storage**: User preferences persistence

### Routing Strategy
```typescript
// Route structure
/                      → Dashboard
/production/orders     → Production Orders
/production/boms       → Bills of Material
/inventory/items       → Items Management
/inventory/stocks      → Stock Levels
/quality/inspections   → Quality Inspections
/data-schema          → Database Schema Visualization
/settings             → Application Settings
```

## 🔧 Backend Architecture

### Technology Stack
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **TypeScript**: Type-safe server code
- **Drizzle ORM**: Type-safe database operations
- **Passport.js**: Authentication middleware
- **Express Session**: Session management
- **bcryptjs**: Password hashing

### Service Layer Architecture
```
server/
├── index.ts           # Application entry point
├── routes.ts          # API route definitions
├── storage.ts         # Database operations
├── db.ts             # Database connection
├── auth/             # Authentication logic
├── middleware/       # Express middleware
├── services/         # Business logic services
├── utils/            # Utility functions
└── types/            # TypeScript types
```

### API Design Patterns
- **RESTful Architecture**: Standard HTTP methods and status codes
- **Resource-Based URLs**: Clear resource identification
- **Consistent Response Format**: Standardized JSON responses
- **Error Handling**: Comprehensive error responses
- **Input Validation**: Zod schema validation
- **Authentication**: Session-based security

### Middleware Stack
```typescript
// Middleware order
1. CORS configuration
2. Body parsing (JSON/URL-encoded)
3. Session management
4. Authentication
5. Request logging
6. Rate limiting
7. Route handlers
8. Error handling
```

## 🗄️ Database Architecture

### Database Design Principles
- **Normalized Structure**: Reduced data redundancy
- **Referential Integrity**: Foreign key constraints
- **Indexed Performance**: Strategic index placement
- **Audit Trails**: Change tracking capabilities
- **Flexible Schema**: Extensible table design

### Core Entity Relationships
```
Manufacturing Hierarchy:
Plants → Departments → Work Centers → Resources

Production Flow:
Production Orders → Production Versions → BOMs/Recipes → Operations

Inventory Flow:
Items → Stocks → Storage Locations → Transactions

Quality Flow:
Specifications → Inspections → Results → Corrective Actions
```

### Database Schema Categories

#### 1. Manufacturing Core (20+ tables)
- production_orders, production_versions
- bills_of_material, bom_items
- routings, routing_operations
- discrete_operations, discrete_operation_phases

#### 2. Process Manufacturing (15+ tables)
- recipes, recipe_phases
- formulations, formulation_details
- material_requirements
- process_operations

#### 3. Inventory Management (25+ tables)
- items, stocks, storage_locations
- inventory_transactions
- purchase_orders, purchase_order_lines
- sales_orders, sales_order_lines

#### 4. Resource Management (20+ tables)
- resources, capabilities, resource_capabilities
- work_centers, departments, plants
- resource_requirements, resource_shift_assignments

#### 5. Quality Control (15+ tables)
- quality_inspections, quality_specifications
- quality_results, corrective_actions
- batch_records, certificates_of_analysis

#### 6. Organization & Users (25+ tables)
- users, roles, permissions
- customers, vendors
- contacts, addresses

### Performance Optimizations
- **Strategic Indexing**: Primary keys, foreign keys, search fields
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Efficient JOIN operations
- **Caching Strategy**: Query result caching where appropriate

## 🔐 Security Architecture

### Authentication Flow
```
1. User login → Credential validation
2. Session creation → Server-side storage
3. Session cookie → HTTP-only cookie
4. Request authentication → Session validation
5. Authorization → Role-based permissions
```

### Security Measures
- **Password Hashing**: bcrypt with salt rounds
- **Session Security**: HTTP-only, secure cookies
- **CSRF Protection**: Cross-site request forgery prevention
- **Input Validation**: Server-side validation with Zod
- **SQL Injection Prevention**: Parameterized queries
- **Rate Limiting**: API request throttling

### Role-Based Access Control
```typescript
// Permission structure
interface Permission {
  feature: string;     // e.g., 'production-orders'
  action: string;      // e.g., 'create', 'read', 'update', 'delete'
  granted: boolean;
}

// Role hierarchy
Admin → Full system access
Manager → Department-level access
Operator → Limited operational access
Viewer → Read-only access
```

## 🤖 AI Integration Architecture

### OpenAI Integration
- **Service Layer**: Abstracted AI service calls
- **Prompt Engineering**: Optimized prompts for manufacturing
- **Response Processing**: Structured response handling
- **Error Handling**: Graceful AI service failures
- **Caching**: Response caching for efficiency

### AI Features
- **Production Scheduling**: Intelligent order sequencing
- **Resource Optimization**: Capacity planning recommendations
- **Predictive Analytics**: Demand forecasting
- **Quality Insights**: Pattern recognition in quality data

## 📊 Data Visualization Architecture

### React Flow Implementation
```typescript
// Schema visualization components
NodeTypes:
├── TableNode       # Database table representation
├── RelationshipEdge # Table relationships
└── CategoryNode    # Grouped table categories

Layout Algorithms:
├── Hierarchical    # Tree-based layout
├── Circular        # Circular arrangement
├── ForceDirected   # Physics-based positioning
└── Grid           # Grid-based layout
```

### Visualization Features
- **Interactive Exploration**: Clickable nodes and edges
- **Dynamic Layouts**: Multiple positioning algorithms
- **Content-Aware Sizing**: Smart node dimensioning
- **Relationship Filtering**: Focus on specific connections
- **Real-time Updates**: Live schema changes

## 🔄 Data Flow Architecture

### Request-Response Cycle
```
1. Frontend Request → API endpoint
2. Authentication → Session validation
3. Validation → Input validation with Zod
4. Business Logic → Service layer processing
5. Database Query → Drizzle ORM operations
6. Response Format → JSON serialization
7. Frontend Update → React Query cache update
8. UI Refresh → Component re-rendering
```

### Real-time Updates
- **WebSocket Integration**: Live data updates
- **Event-Driven Architecture**: State change notifications
- **Cache Invalidation**: Smart cache management
- **Optimistic Updates**: Immediate UI feedback

## 🏗️ Build and Deployment Architecture

### Development Build
```bash
Frontend: Vite dev server (HMR enabled)
Backend: tsx with hot reload
Database: Local PostgreSQL
```

### Production Build
```bash
Frontend: Vite production build → static files
Backend: esbuild → single executable
Database: Production PostgreSQL
```

### Environment Configuration
```typescript
// Environment-specific settings
Development: {
  database: local PostgreSQL
  cors: permissive
  logging: verbose
  debugging: enabled
}

Production: {
  database: cloud PostgreSQL
  cors: restricted
  logging: minimal
  security: hardened
}
```

## 📈 Scalability Considerations

### Horizontal Scaling
- **Stateless Backend**: Session store externalization
- **Database Sharding**: Table partitioning strategies
- **Load Balancing**: Multiple server instances
- **CDN Integration**: Static asset distribution

### Performance Monitoring
- **Metrics Collection**: Key performance indicators
- **Error Tracking**: Application error monitoring
- **Database Monitoring**: Query performance tracking
- **User Experience**: Frontend performance metrics

### Caching Strategy
```
Browser Cache → Static assets (CSS, JS, images)
React Query → API response caching
Redis Cache → Session storage (future)
Database → Query result caching
```

## 🔧 Development Tools Architecture

### Code Quality
- **TypeScript**: Compile-time type checking
- **ESLint**: Code linting (future implementation)
- **Prettier**: Code formatting (future implementation)
- **Husky**: Git hooks (future implementation)

### Testing Strategy (Future Implementation)
```
Unit Tests → Jest + Testing Library
Integration Tests → Supertest
E2E Tests → Playwright
Database Tests → Test database
```

### CI/CD Pipeline (Future Implementation)
```
1. Code Push → GitHub Actions trigger
2. Linting → Code quality checks
3. Testing → Automated test suite
4. Building → Production build
5. Deployment → Cloud platform deploy
6. Monitoring → Health checks
```

## 📱 Mobile Architecture

### Responsive Design
- **Mobile-First Approach**: Progressive enhancement
- **Breakpoint Strategy**: Tailwind CSS breakpoints
- **Touch Optimization**: Mobile-friendly interactions
- **Performance**: Optimized for mobile networks

### Future Mobile App
- **React Native**: Cross-platform mobile development
- **Shared Types**: Common TypeScript interfaces
- **API Reuse**: Same backend APIs
- **Offline Support**: Local data synchronization

---

This architecture provides a solid foundation for a scalable, maintainable manufacturing ERP system with room for future enhancements and integrations.