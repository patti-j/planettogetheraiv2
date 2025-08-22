# PT Tables Behavior Notes

## Resource Assignment Logic

### Key Concepts
1. **Default Resource (Preference)**: Set in `ptjobresources.default_resource_id`
   - Represents the preferred resource for an operation
   - Scheduler prioritizes this resource when available
   - Can be overridden by constraints or availability

2. **Actual Resource Used (Outcome)**: Stored in `ptjoboperations.actual_resources_used`
   - Records which resource actually performed the operation
   - Populated after scheduling is complete
   - May differ from default if constraints require it

### Table Relationships and Behaviors

## 1. ptjobresources (Resource Requirements)
**Purpose**: Defines resource requirements and preferences for operations
- `default_resource_id`: Links to ptresources.resource_id (preferred resource)
- `is_primary`: Boolean indicating if this is the primary resource requirement
- `resource_requirement_id`: Unique identifier for this requirement
- One operation can have multiple resource requirements (primary + secondary)

## 2. ptjoboperations (Scheduled Operations)
**Purpose**: Contains the scheduled operations with their actual resource assignments
- `scheduled_primary_work_center_external_id`: The work center/department assigned
- `actual_resources_used`: The actual resource ID(s) used (after scheduling)
- `resources_used`: Additional resource information
- `primary_resource_requirement_id`: Links to ptjobresources.resource_requirement_id

## 3. ptresources (Available Resources)
**Purpose**: Master list of all available resources/machines
- `resource_id`: Unique identifier for the resource
- `department_name`: Department/work center this resource belongs to
- `bottleneck`: Boolean indicating if this is a bottleneck resource
- `active`: Boolean indicating if resource is available for scheduling

## 4. ptdepartments (Work Centers)
**Purpose**: Defines work centers/departments that contain resources
- `department_id`: Unique identifier for the department
- `work_center_id`: Same as department_id (for compatibility)
- `external_id`: External system identifier (e.g., DEPT-1)
- Resources are grouped within departments

## Data Flow and Relationships

### Scheduling Process:
1. **Input Phase**:
   - Operations defined in `ptjoboperations`
   - Resource requirements defined in `ptjobresources` with `default_resource_id`
   - Available resources listed in `ptresources`

2. **Scheduling Phase**:
   - Scheduler considers `default_resource_id` as preference
   - Checks resource availability and constraints
   - May assign alternative eligible resource if default is unavailable

3. **Output Phase**:
   - `actual_resources_used` populated with assigned resource
   - `scheduled_primary_work_center_external_id` set to department
   - Schedule times updated

### Key Business Rules:

1. **Resource Eligibility**:
   - Resource must be active (`ptresources.active = true`)
   - Resource must belong to appropriate department
   - Resource capabilities must match operation requirements

2. **Default vs Actual Assignment**:
   - If default resource is available → actual = default
   - If default resource is busy → actual = next eligible resource
   - If no eligible resources → operation remains unscheduled

3. **Department Assignment**:
   - Operations are assigned to departments (work centers)
   - Multiple resources can exist within a department
   - Department assignment constrains resource selection

4. **Resource Tracking**:
   - `ptjobresources.default_resource_id`: Planning preference
   - `ptjoboperations.actual_resources_used`: Execution reality
   - Both fields use resource IDs from `ptresources.resource_id`

## Data Integrity Requirements

1. **Foreign Key Relationships**:
   - `ptjobresources.default_resource_id` → `ptresources.resource_id`
   - `ptjoboperations.primary_resource_requirement_id` → `ptjobresources.resource_requirement_id`
   - `ptjoboperations.scheduled_primary_work_center_external_id` → `ptdepartments.external_id`

2. **Consistency Checks**:
   - Actual resources used should exist in ptresources
   - Department assignments should match resource departments
   - Primary resource requirements should have is_primary = true

3. **Scheduling Validation**:
   - Operations with actual_resources_used should have scheduled times
   - Resources assigned should be active
   - Bottleneck resources require special handling

## Gantt Chart Display Logic

- **Row Organization**: Each resource gets its own row
- **Operation Blocks**: Display on the resource row based on `actual_resources_used`
- **Time Position**: Based on scheduled_start and scheduled_end
- **Color Coding**: Can indicate if using default vs alternative resource
- **Drag-Drop**: Moving updates both time and potentially resource assignment