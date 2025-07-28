# Manufacturing ERP Database Redesign Plan

## Current Issues
- 177 database tables (excessive)
- 703 TypeScript diagnostics
- Circular references
- Type inconsistencies
- Over-engineered JSON schemas

## Core Manufacturing ERP Entities (Simplified)

### 1. Organization Structure (5 tables)
- plants: Manufacturing locations
- departments: Organizational units within plants
- work_centers: Production resources/stations
- users: System users
- user_roles: User permissions

### 2. Product & Process Definition (8 tables)
- items: Products/materials master data
- bills_of_material: Product structure
- bom_components: BOM line items
- routings: Manufacturing processes
- routing_operations: Process steps
- resources: Equipment/labor resources
- capabilities: What resources can do
- recipes: Process manufacturing formulas

### 3. Planning & Scheduling (6 tables)
- production_orders: Firm manufacturing orders
- planned_orders: MRP-generated planned orders
- operations: Work to be performed
- resource_assignments: Resource allocation
- schedules: Production schedules
- capacity_constraints: Resource limitations

### 4. Execution & Tracking (4 tables)
- work_orders: Shop floor execution
- time_tracking: Labor/machine time
- quality_records: Quality control data
- inventory_transactions: Material movements

### 5. Optimization & Analytics (3 tables)
- optimization_algorithms: Available algorithms
- algorithm_runs: Execution history
- performance_metrics: KPI tracking

## Benefits of Redesign
1. **Reduced Complexity**: 26 core tables vs 177 current
2. **Clear Relationships**: No circular references
3. **Type Safety**: Consistent TypeScript types
4. **Performance**: Optimized queries
5. **Maintainability**: Clear schema structure

## Migration Strategy
1. Create new clean schema
2. Migrate essential data
3. Update API endpoints
4. Update frontend components
5. Test core workflows

Would you like to proceed with this clean redesign approach?