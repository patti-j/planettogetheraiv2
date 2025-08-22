# CRITICAL CONSTRAINT: PT Table Structure Integrity

## Core Principle
**PT tables should maintain their original structure as defined in the creation script. ALWAYS ASK PERMISSION before making any changes to PT tables.**

## What This Means

### ❌ STRICTLY PROHIBITED WITHOUT EXPLICIT APPROVAL:
- Add new columns to PT tables
- Remove existing columns from PT tables
- Modify column data types
- Change column constraints
- Alter foreign key relationships
- Rename columns or tables
- Add or remove indexes (except for performance)
- **NEVER change how resources are assigned or timings decided**
- **NEVER modify the resource assignment logic in ptjobresourceblocks/ptjobresourceblockintervals**

### ✅ APPROVED VARIATIONS (Case-by-Case):
- Adding essential columns for data migration when extension tables are insufficient
- Preserving critical business data that cannot be stored elsewhere
- Modifications required for system integration
**All variations must be documented and approved before implementation**

### ✅ ALWAYS DO:
- **ASK PERMISSION before any PT table modifications**
- Adapt application queries to work with existing PT structure
- Create complex joins and subqueries as needed
- Handle missing data in application layer
- Map old column names to PT equivalents in queries
- Transform data in the application, not the database
- Use computed columns in SELECT statements rather than adding to tables
- **PRESERVE existing resource assignment and timing logic**

## Common Migration Patterns

### Column Name Differences
```sql
-- Old query:
SELECT due_date FROM production_orders

-- PT Adapted query:
SELECT need_date_time as due_date FROM pt_publish_jobs
```

### Missing Columns
```sql
-- If PT doesn't have resource_type column:
-- DON'T: ALTER TABLE pt_publish_resources ADD COLUMN resource_type
-- DO: Use application logic or join with lookup table
```

### Complex Relationships
```sql
-- PT requires more joins due to normalized structure
SELECT 
  j.name as job_name,
  jo.name as operation_name,
  r.name as resource_name
FROM pt_publish_job_operations jo
LEFT JOIN pt_publish_jobs j ON jo.job_id = j.id
LEFT JOIN pt_publish_job_resources jr ON jr.operation_id = jo.id
LEFT JOIN pt_publish_resources r ON jr.default_resource_id = r.id
```

## Rationale
1. **External System Compatibility**: PT tables interface with PlanetTogether system
2. **Data Integrity**: Structure matches production PlanetTogether installations
3. **Upgrade Path**: Future PT updates expect original structure
4. **Audit Compliance**: Structure matches documented specifications

## Developer Notes
- When stuck with complex queries, ask for help adapting them
- Document all query mappings for future reference
- Test thoroughly when migrating from old to PT tables
- Performance optimization via indexes is allowed, structure changes are not

**This constraint is non-negotiable and overrides all other considerations.**