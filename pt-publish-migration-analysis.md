# PT Publish Tables Migration Analysis

## Executive Summary
This document identifies all queries and features in the PlanetTogether system that are still using old/legacy tables instead of the PT Publish tables. The PT Publish tables represent the correct, production-ready data source that should be used throughout the application.

## Current State Assessment

### 1. API Endpoints Still Using Old Tables

#### Resources Endpoints
- **GET /api/resources** - Uses `resources` table instead of `ptPublishResources`
- **GET /api/resources/:id** - Uses `resources` table
- **POST /api/resources** - Creates in `resources` table
- **PUT /api/resources/:id** - Updates `resources` table
- **DELETE /api/resources/:id** - Deletes from `resources` table
- **GET /api/resources/:resourceId/assignments** - Uses `resources` table

**Files affected:**
- `server/routes.ts` (lines 2097, 2106, etc.)
- `server/storage.ts` - All resource-related methods

#### Production Orders/Jobs Endpoints
- **GET /api/production-orders** - Uses `productionOrders` table instead of `ptPublishJobs`
- **GET /api/jobs** (legacy) - Uses `productionOrders` table
- **GET /api/production-orders/:id** - Uses `productionOrders` table
- **GET /api/jobs/:id** (legacy) - Uses `productionOrders` table
- **POST /api/production-orders** - Creates in `productionOrders` table
- **GET /api/production-orders/:productionOrderId/operations** - Uses old operations tables

**Files affected:**
- `server/routes.ts` (lines 2185, 2227, 2239, 2253, 2627, 2638)
- `server/storage.ts` - All production order related methods

### 2. Storage Layer Issues

#### Storage Methods Using Old Tables
The following storage methods in `server/storage.ts` are querying old tables:

**Resources:**
- `getResources()` - line ~2600
- `getResource(id)` 
- `createResource()`
- `updateResource()`
- `deleteResource()`

**Production Orders:**
- `getProductionOrders()` - Queries `productionOrders` instead of `ptPublishJobs`
- `getProductionOrder(id)`
- `createProductionOrder()`
- `updateProductionOrder()`
- `deleteProductionOrder()`

**Jobs (legacy compatibility):**
- `getJobs()` - Maps to `productionOrders`
- `getJob(id)`
- `createJob()`
- `updateJob()`
- `deleteJob()`

### 3. Service Layer Issues

#### Max AI Service
File: `server/services/max-ai-service.ts`
- Directly queries `resources` table
- Directly queries `productionOrders` table
- Should use PT Publish tables for data retrieval

### 4. Frontend Components Affected

The following React components are calling the old API endpoints:

#### Components Using /api/resources:
- `client/src/components/schedule-evaluation-system.tsx`
- `client/src/components/backwards-scheduling-algorithm.tsx`
- `client/src/components/onboarding-wizard.tsx`
- `client/src/components/job-form.tsx`
- `client/src/components/resource-form.tsx`
- `client/src/components/ai-agent.tsx`
- `client/src/components/scheduler-pro/BryntumSchedulerPro.tsx`
- `client/src/components/customizable-home-dashboard.tsx`

#### Components Using /api/jobs or /api/production-orders:
- `client/src/components/schedule-evaluation-system.tsx`
- `client/src/components/backwards-scheduling-algorithm.tsx`
- `client/src/components/onboarding-wizard.tsx`
- `client/src/components/job-form.tsx`
- `client/src/components/kanban-board.tsx`

#### Hooks Affected:
- `client/src/hooks/use-drag-drop.ts`
- `client/src/hooks/use-drag-drop-old.ts`

### 5. Database Seeding and Import

#### Seed Script
File: `server/seed.ts`
- Seeds data into old tables (`resources`, `productionOrders`)
- Should seed into PT Publish tables

#### Data Import Endpoints
File: `server/routes.ts` (lines 817-860)
- Imports data into old tables during AI generation
- Deletes from old tables during cleanup

### 6. PT Publish Tables Available But Unused

The following PT Publish methods exist in storage but have NO corresponding API endpoints:

**Available Methods:**
- `getPtPublishJobs()` - Returns jobs from PT Publish
- `getPtPublishManufacturingOrders()` - Returns manufacturing orders
- `getPtPublishJobOperations()` - Returns job operations
- `getPtPublishResources()` - Returns resources from PT Publish
- `getPtPublishJobActivities()` - Returns job activities

**Location:** `server/storage.ts` (lines 2749-2824)

## Migration Requirements

### Phase 1: Create New API Endpoints
1. Add `/api/pt-publish/jobs` endpoint
2. Add `/api/pt-publish/resources` endpoint
3. Add `/api/pt-publish/manufacturing-orders` endpoint
4. Add `/api/pt-publish/job-operations` endpoint
5. Add `/api/pt-publish/job-activities` endpoint

### Phase 2: Update Frontend Components
1. Create a configuration flag to switch between old and PT Publish endpoints
2. Update all React Query hooks to use new endpoints
3. Update data models to match PT Publish schema

### Phase 3: Deprecate Old Endpoints
1. Add deprecation warnings to old endpoints
2. Monitor usage and gradually phase out
3. Remove old table references from storage layer

## Critical Issues

### 1. Data Consistency
Currently, the system is writing to old tables but PT Publish tables exist with potentially different data. This creates:
- Data inconsistency risks
- Confusion about source of truth
- Potential for displaying outdated information

### 2. Missing CRUD Operations
PT Publish tables only have READ operations implemented. Missing:
- CREATE operations for PT Publish tables
- UPDATE operations for PT Publish tables  
- DELETE operations for PT Publish tables

### 3. Schema Mismatch
The old tables and PT Publish tables have different schemas:
- Old `productionOrders` vs PT Publish `ptPublishJobs`
- Old `resources` vs PT Publish `ptPublishResources`
- Field name differences need mapping

## Recommended Action Plan

### Immediate Actions
1. **Audit Data Sources**: Determine if PT Publish tables are the authoritative source
2. **Create Mapping Layer**: Build a translation layer between old and new schemas
3. **Add PT Publish Endpoints**: Expose PT Publish data via new API endpoints

### Short-term (1-2 weeks)
1. **Dual-mode Operation**: Allow system to read from both sources with a toggle
2. **Update Critical Paths**: Migrate production scheduling views to PT Publish
3. **Add Monitoring**: Track which endpoints are being used

### Long-term (1-3 months)
1. **Complete Migration**: Move all features to PT Publish tables
2. **Deprecate Old Tables**: Remove old table dependencies
3. **Update Documentation**: Ensure all docs reflect new architecture

## Files Requiring Updates

### Backend Files
- `server/routes.ts` - Add PT Publish endpoints
- `server/storage.ts` - Update methods to use PT Publish
- `server/storage-simple.ts` - Migrate to PT Publish
- `server/services/max-ai-service.ts` - Use PT Publish for queries
- `server/seed.ts` - Seed PT Publish tables

### Frontend Files  
- All components listed in Section 4
- Create new hooks for PT Publish data
- Update types/interfaces for PT Publish schema

## Testing Requirements

1. **Data Validation**: Ensure PT Publish data is complete and accurate
2. **Performance Testing**: Compare query performance between old and new tables
3. **Integration Testing**: Verify all features work with PT Publish data
4. **Regression Testing**: Ensure no functionality is lost during migration

## Conclusion

The system currently has a significant architectural issue where PT Publish tables exist but are not being utilized. This migration is critical for:
- Data consistency
- System reliability  
- Future scalability
- Proper integration with PlanetTogether APS system

The migration should be done incrementally with careful testing at each phase to ensure system stability.