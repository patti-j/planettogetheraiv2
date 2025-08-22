# PT Tables Behavior Notes

## Resource Assignment Logic

### Key Scheduling Concepts
1. **Default Resource (Preference)**: Set in `ptjobresources.default_resource_id`
   - Represents the preferred resource for an operation
   - Scheduler prioritizes this resource when available
   - Can be overridden by constraints or availability

2. **Capabilities**: Stored in jobresourcecapabilities
   - Specify which capabilities a resource must have to be able to have an activity scheduled on it
   - Can be overridden by default resource (ie. The default resource does not have to have the specified capabilities to be eligible)

3. **Resources scheduled (Outcome)**: Stored in `ptjobresourceblocks`
   - Records which resource(s) are scheduled to perform the operation activity
   - Populated after scheduling is complete


 

### Table Relationships and Behaviors

## 1. ptjobresources (Resource Requirements)
**Purpose**: Defines resource requirements and preferences for operations
- `default_resource_id`: Links to ptresources.resource_id (preferred resource)
- `is_primary`: Boolean indicating if this is the primary resource requirement
- `resource_requirement_id`: Unique identifier for this requirement
- One operation can have multiple resource requirements (primary + secondaries)

## 2. ptresourcecapabilities (Resource Capabilities)
- are used to link ptjobresources to the eligible available resources that can be used to schedule the requirement

## 3. ptjoboperations (Operations)
**Purpose**: Contains the scheduled operations with their resource assignments
- provide information such as run rates for use in scheduling the resource requirements
- related to paths which provide precedence constraints and to manufacturing orders to which the operations belong which are then related to jobs 

## 4. ptjobactivities (Activites)
- each Operation must have one or more activities to schedule; an operation has one activity unless it is split into multiple activities
- each activity is scheduled on one or more resources (based on jobResources, and jobResourceCapabilities or default resource)

## 5. ptresources (Available Resources)
**Purpose**: Master list of all available resources/machines
- `resource_id`: Unique identifier for the resource
- `department_name`: Department/work center this resource belongs to
- `bottleneck`: Boolean indicating if this is a bottleneck resource
- `active`: Boolean indicating if resource is available for scheduling
- references capacity intervals and recurring capacity intervals to determine available working capacity over time


## Data Flow and Relationships

### Scheduling Process:
1. **Input Phase**:
   - Operations defined in `ptjoboperations` 
   - Activities defined in 'ptJobactivities'
   - Resource requirements defined in `ptjobresources` with `default_resource_id`
   - Required capabilities defined in 'ptjobresourcecapabilities'
   - Available resources listed in `ptresources` with their capabilities defined in jobresourcecapabilities

2. **Scheduling Phase**:
   - Scheduler considers `default_resource_id` as preference if set (it is optional)
   - Checks resource availability and constraints
   - May assign alternative eligible resource if default is null or unavailable within timing threshold

3. **Output Phase**:
   - 'ptjobresourceblocks' defines which resources are used at which time intervals; one for each jobresource
   - 'ptjobresourceblockintervals' defines the various contiguous time segments of the block (setup, run, post processing, etc).


### Key Business Rules:

1. **Resource Eligibility**:
   - Resource must be active (`ptresources.active = true`)
   - Resource capabilities must match job operation resource required capabilities (unless using default resource)



## Data Integrity Requirements

1. **Foreign Key Relationships**:
   - `ptjobresources.default_resource_id` → `ptresources.resource_id`
   - `ptjoboperations.primary_resource_requirement_id` → `ptjobresources.resource_requirement_id` (defines which job resource is the primary, which can determine run rate)

2. **Consistency Checks**:
   - Resources in ptjobresourceblocks should exist in ptresources
   - Primary resource requirements should have is_primary = true
   - Job resource block segments in ptjobresourceblockintervals should all be contained within their parent ptjobresourceblock from a start to end duration perspective
   - Block intervals should be contiguous and non-overlapping within each resource block


3. **Scheduling Validation**:
   - Operations with ptjobresourceblocks should have scheduled times
   - Resources in ptjobresourceblocks should be active
   - Each ptjobresourceblock should have corresponding ptjobresourceblockintervals
   - Block intervals should cover setup, run, and post-processing phases as appropriate
 
## Gantt Chart Display Logic

- **Row Organization**: Each resource gets its own row
- **Operation Blocks**: Display on the resource row based on `ptjobresourceblocks` data
- **Block Segments**: Individual segments (setup, run, post-processing) displayed based on `ptjobresourceblockintervals`
- **Time Position**: Based on scheduled_start and scheduled_end from blocks and intervals
- **Color Coding**: Can indicate block type (setup/run/cleanup) and if using default vs alternative resource
- **Drag-Drop**: Moving updates both time and potentially resource assignment in both blocks and intervals tables