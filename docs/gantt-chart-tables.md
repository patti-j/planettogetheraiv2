# Production Scheduler Gantt Chart - Database Tables & Fields

This document describes the database tables and fields used by the Production Scheduler Gantt chart.

---

## Core Tables

### 1. `ptjobs` - Production Jobs

The main jobs table containing production orders to be scheduled.

| Field | Type | Description |
|-------|------|-------------|
| `id` | serial (PK) | Unique job identifier |
| `external_id` | varchar | External system reference ID |
| `name` | varchar | Job name (required) |
| `description` | text | Job description |
| `priority` | integer | Scheduling priority (default: 1) |
| `need_date_time` | timestamp | Required completion date (for ALAP scheduling) |
| `manufacturing_release_date` | timestamp | Earliest start date (for ASAP scheduling) |
| `scheduled_status` | varchar | Current status (scheduled, in-progress, completed) |
| `created_at` | timestamp | Record creation date |
| `updated_at` | timestamp | Last update date |

---

### 2. `ptjoboperations` - Job Operations

Individual operations/tasks within each job, displayed as bars on the Gantt chart.

| Field | Type | Description |
|-------|------|-------------|
| `id` | serial (PK) | Unique operation identifier |
| `job_id` | integer (FK) | Reference to ptjobs.id |
| `external_id` | varchar | External system reference ID |
| `name` | varchar | Operation name (required) |
| `description` | text | Operation description |
| `operation_id` | varchar | Operation code/identifier |
| `base_operation_id` | varchar | Template operation reference |
| `required_finish_qty` | numeric | Quantity to produce |
| `cycle_hrs` | numeric | Production time per unit |
| `setup_hours` | numeric | Machine setup time |
| `post_processing_hours` | numeric | Post-operation time |
| `scheduled_start` | timestamp | Gantt bar start time |
| `scheduled_end` | timestamp | Gantt bar end time |
| `percent_finished` | numeric | Completion percentage (0-100) |
| `manually_scheduled` | boolean | If true, not auto-rescheduled |
| `sequence_number` | integer | Order in production sequence |

**Constraint Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `constraint_type` | varchar(10) | MSO, MFO, SNET, FNET, SNLT, FNLT |
| `constraint_date` | timestamp | Date for constraint |

**PERT Estimation Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `time_optimistic` | decimal(10,4) | Best case duration |
| `time_most_likely` | decimal(10,4) | Expected duration |
| `time_pessimistic` | decimal(10,4) | Worst case duration |
| `time_expected` | decimal(10,4) | Calculated: (O + 4M + P) / 6 |
| `time_variance` | decimal(10,6) | Calculated: ((P - O) / 6)² |
| `time_std_dev` | decimal(10,4) | Calculated: (P - O) / 6 |

---

### 3. `ptresources` - Production Resources

Machines, work centers, and other resources shown as rows on the Gantt chart.

| Field | Type | Description |
|-------|------|-------------|
| `id` | serial (PK) | Unique resource identifier |
| `publish_date` | timestamp | Data publish date |
| `instance_id` | varchar(38) | Instance identifier |
| `plant_id` | integer | Plant reference |
| `department_id` | integer | Department reference |
| `resource_id` | integer | Resource reference number |
| `name` | text | Resource name (displayed on Gantt) |
| `description` | text | Resource description |
| `notes` | text | Additional notes |
| `bottleneck` | boolean | Is this a bottleneck resource? |
| `buffer_hours` | numeric | Buffer time to add |
| `capacity_type` | text | Capacity measurement type |
| `drum` | boolean | Is this the drum (constraint)? |
| `overtime_hourly_cost` | numeric | Overtime cost per hour |
| `standard_hourly_cost` | numeric | Standard cost per hour |
| `resource_type` | varchar(50) | Type: machine, labor, etc. |
| `capacity` | numeric | Maximum capacity |
| `available_hours` | numeric | Available hours per day |
| `efficiency` | numeric | Efficiency factor (default: 1.0) |
| `is_active` | boolean | Is resource active? |
| `deployment_order` | integer | Order in production flow |
| `created_at` | timestamp | Record creation date |
| `updated_at` | timestamp | Last update date |

---

## Key Relationships

```
ptjobs (1) ───────────< (many) ptjoboperations
   │                           │
   │                           │ scheduled on
   │                           ↓
   └─────────────────────> ptresources
```

- Each **job** has multiple **operations**
- Each **operation** is scheduled on a **resource**
- The Gantt displays operations as horizontal bars on their assigned resource rows

---

## Scheduling Algorithms

| Algorithm | Key Field Used |
|-----------|---------------|
| **ASAP** (As Soon As Possible) | `manufacturing_release_date` - schedules forward from this date |
| **ALAP** (As Late As Possible) | `need_date_time` - schedules backward from this date |
| **Drum/TOC** | `drum` field on resources identifies the constraint |

---

## Gantt Chart Data Flow

1. **Resources** → Gantt rows (Y-axis)
2. **Operations** → Gantt bars (positioned by `scheduled_start` / `scheduled_end`)
3. **Jobs** → Grouping/filtering of operations
4. **Sequence Number** → Operation order within a job

---

## Constraint Types

| Code | Meaning |
|------|---------|
| MSO | Must Start On |
| MFO | Must Finish On |
| SNET | Start No Earlier Than |
| FNET | Finish No Earlier Than |
| SNLT | Start No Later Than |
| FNLT | Finish No Later Than |
