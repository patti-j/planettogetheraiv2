# Bryntum Scheduler Pro - PlanetTogether Data Mapping Guide

## High-Level Architecture

```
PlanetTogether DB                                Bryntum ProjectModel stores
──────────────────────────────────────────       ─────────────────────────────────────────────
ptresources ───────────────┐                    resourceStore
                           │                      id            ← r.resource_id   (STRING, canonical)
ptplants        (join)     ├──►  Resources   ───  name          ← r.name
                           │                      category      ← p.name / r.area / etc.
                           └───────────────┐       active        ← r.active
                                           │
ptjoboperations ───────────────────────────┼──►  Events (Operations)
ptjobs               (join)               │       id            ← jo.id
ptjobactivities      (join, optional)     │       name          ← jo.name
                                           │      startDate     ← jo.scheduled_start
                                           │      endDate       ← jo.scheduled_end
                                           │      percentDone   ← jo.percent_finished
                                           │      …(custom fields for tooltips/columns)
                                           │
ptjobresources (primary assignment) ──────┘     assignmentStore
                                                  eventId       ← jo.id
                                                  resourceId    ← r.resource_id  (STRING)

ptoperation_dependencies / links  ───────────►  dependencyStore
(or similar)                                     fromEvent     ← predecessor jo.id
                                                 toEvent       ← successor   jo.id
                                                 lag, lagUnit  ← (if available)
                                                 type          ← FinishToStart (default)
```

## Key Principle
**Make `ptresources.resource_id` (string) your canonical Bryntum `resourceStore.id` AND your `assignmentStore.resourceId`. Keep numeric PKs (`r.id`) internal.**

## Resources → `resourceStore`

### Source Tables
* `ptresources r`
* `ptplants p` (for category/plant grouping, optional)

### Field Mapping

| Bryntum resourceStore field | PT source |
|---------------------------|-----------|
| `id` (string, canonical) | `r.resource_id` *(string!)* |
| `name` | `r.name` |
| `category` (optional) | `p.name` (plant) or `r.area` / `r.department` |
| `active` (optional) | `r.active` (bool) |
| any custom props | `r.bottleneck`, `r.description`, etc. |

### SQL Query
```sql
SELECT
  r.resource_id            AS resource_id,      -- canonical STRING id for Bryntum
  r.name                   AS resource_name,
  COALESCE(p.name, 'Default') AS category,
  r.active                 AS resource_active,
  r.bottleneck             AS is_bottleneck,
  r.description            AS resource_description
FROM ptresources r
LEFT JOIN ptplants p ON p.id = r.plant_id
WHERE r.active = true;
```

### JSON Result
```json
[
  { "id": "8", "name": "Whirlpool Tank 1", "category": "Brewhouse", "active": true },
  { "id": "22", "name": "Packaging Line 3", "category": "Packaging", "active": true }
]
```

## Operations → `eventStore`

### Source Tables
* `ptjoboperations jo`
* `ptjobs j` (job context for tooltips/columns)
* `ptjobactivities ja` (optional, progress/status)

### Field Mapping

| Bryntum eventStore field | PT source |
|------------------------|-----------|
| `id` | `jo.id` |
| `name` | `jo.name` (fallback: base operation name / `jo.operation_id`) |
| `startDate` | `jo.scheduled_start` |
| `endDate` | `jo.scheduled_end` |
| `percentDone` | `jo.percent_finished` |
| `duration` (optional) | derive if no end: `jo.cycle_hrs + setup + post_processing` |
| custom fields (optional) | `j.name` (job), `j.priority`, `ja.production_status`, etc. |

### SQL Query
```sql
SELECT
  jo.id                        AS event_id,
  jo.name                      AS event_name,
  jo.scheduled_start           AS start_date,
  jo.scheduled_end             AS end_date,
  jo.percent_finished          AS percent_done,
  j.id                         AS job_id,
  j.name                       AS job_name,
  j.priority                   AS job_priority,
  ja.production_status         AS activity_status
FROM ptjoboperations jo
LEFT JOIN ptjobs j        ON j.id  = jo.job_id
LEFT JOIN ptjobactivities ja ON ja.operation_id = jo.id;
```

### JSON Result
```json
[
  {
    "id": 61,
    "name": "Milling",
    "startDate": "2025-09-05T07:00:00Z",
    "endDate": "2025-09-05T10:00:00Z",
    "percentDone": 15,
    "jobName": "Batch 1249",
    "jobPriority": 2
  }
]
```

**Important:** Do NOT put `resourceId` on events when using AssignmentStore. Keep the mapping in `assignmentStore`.

## Operation↔Resource Linkage → `assignmentStore`

### Source Table
* `ptjobresources jr` (the assignment/primary resource)
  Ensure you join via the string key: `jr.default_resource_id = r.resource_id`

### Field Mapping

| Bryntum assignmentStore field | PT source |
|------------------------------|-----------|
| `eventId` | `jo.id` |
| `resourceId` | **`r.resource_id` (string)** |
| `id` (optional) | synthetic like `a_${jo.id}` |

### SQL Query (Primary Assignments Only)
```sql
SELECT
  jo.id            AS event_id,
  r.resource_id    AS resource_id   -- STRING id that matches resourceStore.id
FROM ptjobresources jr
JOIN ptjoboperations jo ON jo.id = jr.operation_id
JOIN ptresources r      ON r.resource_id = jr.default_resource_id
WHERE jr.is_primary = true;
```

### JSON Result
```json
[
  { "eventId": 61, "resourceId": "5" },   // Milling → Lauter Tun 1
  { "eventId": 62, "resourceId": "8" }    // Mashing → Whirlpool Tank 1
]
```

## Precedence/Routing → `dependencyStore`

### Expected Fields

| Bryntum dependencyStore field | Typical PT source |
|------------------------------|-------------------|
| `fromEvent` | predecessor op → `prev_op_id` (i.e., `jo.id`) |
| `toEvent` | successor op → `next_op_id` (i.e., `jo.id`) |
| `type` | 2 = Finish-to-Start (default); map if you store types |
| `lag` | integer hours/mins |
| `lagUnit` | `'hour'` or `'minute'` |

### SQL Query
```sql
SELECT
  d.predecessor_operation_id AS from_event,
  d.successor_operation_id   AS to_event,
  COALESCE(d.lag_hours, 0)   AS lag,
  'hour'                     AS lag_unit,
  2                          AS type -- FinishToStart
FROM ptoperation_dependencies d;
```

### JSON Result
```json
[
  { "fromEvent": 61, "toEvent": 62, "type": 2, "lag": 2, "lagUnit": "hour" }
]
```

## Common Gotchas to Avoid

1. **ID Domain Mismatch**
   - Use `ptresources.resource_id` (string) as the ONLY id in Bryntum
   - `resourceStore.id` and `assignmentStore.resourceId` MUST be the same string values
   - Keep the numeric `r.id` internal only

2. **Events Carrying resourceId**
   - If using `assignmentStore`, DON'T set `event.resourceId`
   - That's a different model (no-assignment) and causes issues

3. **Unmatched Assignments**
   - If `assignment.resourceId` doesn't exist in `resourceStore`, event appears Unscheduled
   - Add explicit "Unscheduled" row if you want to show orphans

4. **Visual Misreads**
   - Small row height + no striping can make adjacent rows look like one
   - Use `rowHeight: 60–80` and `features.stripe: true`

## Bryntum Project Setup

```ts
new SchedulerPro({
  project: {
    resourceStore:   { data: resources },    // from ptresources
    eventStore:      { data: events },       // from ptjoboperations (+joins)
    assignmentStore: { data: assignments },  // from ptjobresources join ptresources
    dependencyStore: { data: dependencies }  // from ptoperation_dependencies (optional)
  },
  rowHeight: 80,
  features: { stripe: true, dependencies: true, percentBar: true }
});
```

## Sample JSON After ETL

```json
{
  "resources": [
    { "id": "8", "name": "Whirlpool Tank 1", "category": "Brewhouse" },
    { "id": "22", "name": "Packaging Line 3", "category": "Packaging" }
  ],
  "events": [
    { "id": 61, "name": "Milling", "startDate": "2025-09-05T07:00:00Z", "endDate": "2025-09-05T10:00:00Z", "percentDone": 15 },
    { "id": 62, "name": "Mashing", "startDate": "2025-09-05T10:00:00Z", "endDate": "2025-09-05T13:00:00Z", "percentDone": 5 }
  ],
  "assignments": [
    { "eventId": 61, "resourceId": "5" },
    { "eventId": 62, "resourceId": "8" }
  ],
  "dependencies": [
    { "fromEvent": 61, "toEvent": 62, "type": 2, "lag": 2, "lagUnit": "hour" }
  ]
}
```

## Optional Refinements

* **Multi-plant view:** Add `plant_id` to resources and use top-level filter to switch plants without reloading
* **Alt resources:** If allowing alternates, add more assignment rows for same event; Bryntum supports multi-assign
* **Progress source:** If `ptjobactivities` has more accurate progress than `jo.percent_finished`, map to `percentDone`
* **Constraints:** If storing "must start on/finish no earlier than," map to `event.constraintType`/`constraintDate`