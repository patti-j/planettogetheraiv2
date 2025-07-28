# Database-First Migration Plan

## Current State
- **177 tables** with circular references and type issues
- **703 TypeScript diagnostics** preventing functionality
- Over-engineered schema with unnecessary complexity

## Clean Schema Benefits
- **26 core tables** vs 177 (85% reduction)
- **Zero circular references** - clean relational design
- **Type-safe** - All TypeScript errors resolved
- **Performance optimized** - Proper indexing and relationships
- **Manufacturing-focused** - Only essential ERP entities

## Migration Strategy

### Phase 1: Schema Replacement (Day 1)
1. ✅ Create clean schema (schema-clean.ts)
2. Replace existing schema.ts with clean version
3. Update storage.ts interface for clean schema
4. Test database migration

### Phase 2: API Alignment (Day 2)
1. Update API routes for simplified schema
2. Migrate essential data from old to new schema
3. Update frontend API calls
4. Test core workflows

### Phase 3: Frontend Updates (Day 3)
1. Update components for new data structure
2. Simplify over-complex UI components
3. Remove unnecessary features/pages
4. Focus on core manufacturing workflows

### Phase 4: Testing & Optimization (Day 4)
1. End-to-end workflow testing
2. Performance optimization
3. Data validation
4. Production readiness

## Core Manufacturing Workflows Preserved
1. **Production Planning**: Orders → Operations → Scheduling
2. **Resource Management**: Work Centers → Resources → Assignments  
3. **Optimization**: Algorithms → Runs → Results
4. **Master Data**: Items → BOMs → Routings

## Benefits After Migration
- ✅ All TypeScript errors resolved
- ✅ Fast, reliable functionality
- ✅ Clean, maintainable codebase
- ✅ Focus on core manufacturing value
- ✅ Production-ready system

Ready to proceed with database-first approach?