# Bryntum Scheduler Pro + Optimization Studio Integration Architecture

## Overview

This document outlines the recommended architecture for integrating Bryntum Scheduler Pro (visualization layer) with the Optimization Studio (computation layer). The design maintains clear separation of concerns while enabling seamless data flow between the two systems.

## Architecture Principles

### 1. Separation of Concerns
- **Bryntum Scheduler Pro**: Visualization and user interaction only
- **Optimization Studio**: Heavy computation and constraint solving
- **API Layer**: Clean contract between frontend and backend
- **Database**: Versioned schedule storage and optimization history

### 2. Data Flow Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Scheduler UI   │────▶│   API Gateway    │────▶│  Optimization    │
│  (Bryntum Pro)   │     │  /api/optimize   │     │     Studio       │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         ▲                        │                         │
         │                        ▼                         ▼
         │               ┌──────────────────┐     ┌──────────────────┐
         └───────────────│   Job Status     │────▶│    Database      │
                        │   (SSE/WebSocket) │     │   (Versions)     │
                        └──────────────────┘     └──────────────────┘
```

## Phase 1: Core Integration

### Data Transfer Objects (DTOs)

#### Schedule Data Export (Client → Server)
```typescript
interface ScheduleDataDTO {
  version: string;              // Current schedule version ID
  snapshot: {
    resources: ResourceDTO[];
    events: EventDTO[];
    dependencies: DependencyDTO[];
    constraints: ConstraintDTO[];
  };
  metadata: {
    plantId: string;
    timestamp: string;
    userId: string;
  };
}

interface ResourceDTO {
  id: string;
  name: string;
  type: string;
  calendar?: string;
  capacity?: number;
  attributes?: Record<string, any>;
}

interface EventDTO {
  id: string;
  name: string;
  resourceId: string;
  startDate: string;          // ISO 8601
  endDate: string;            // ISO 8601
  duration: number;           // milliseconds
  manuallyScheduled: boolean;
  locked: boolean;
  priority?: number;
  attributes?: Record<string, any>;
}

interface DependencyDTO {
  id: string;
  fromEvent: string;
  toEvent: string;
  type: number;               // 0: Start-to-Start, 1: Start-to-Finish, 2: Finish-to-Start, 3: Finish-to-Finish
  lag?: number;
  lagUnit?: string;
}
```

#### Optimization Request
```typescript
interface OptimizationRequestDTO {
  scheduleData: ScheduleDataDTO;
  algorithmId: number;
  profileId?: number;
  options: {
    objective: 'minimize_makespan' | 'maximize_throughput' | 'minimize_cost' | 'balance_resources';
    timeLimit?: number;        // seconds
    incrementalMode?: boolean;
    warmStart?: boolean;
  };
  locks: {
    events: string[];           // Event IDs that must not be moved
    resourceIntervals: Array<{
      resourceId: string;
      start: string;
      end: string;
    }>;
  };
}
```

#### Optimization Response
```typescript
interface OptimizationResponseDTO {
  runId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: {
    percentage: number;
    currentStep?: string;
    estimatedTimeRemaining?: number;
  };
  result?: {
    versionId: string;
    events: Array<{
      id: string;
      resourceId: string;
      startDate: string;
      endDate: string;
      changed: boolean;
    }>;
    metrics: {
      makespan: number;
      resourceUtilization: number;
      totalSetupTime?: number;
      constraintViolations: number;
      improvementPercentage: number;
    };
    warnings?: string[];
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### Job State Machine

```
┌─────────┐      ┌─────────┐      ┌───────────┐      ┌───────────┐
│ QUEUED  │─────▶│ RUNNING │─────▶│ COMPLETED │      │  FAILED   │
└─────────┘      └─────────┘      └───────────┘      └───────────┘
                      │                                      ▲
                      │            ┌───────────┐            │
                      └───────────▶│ CANCELLED │────────────┘
                                  └───────────┘
```

### API Endpoints

#### 1. Submit Optimization Job
```
POST /api/schedules/optimize
Content-Type: application/json
Authorization: Bearer <token>

Request Body: OptimizationRequestDTO
Response: 202 Accepted
{
  "runId": "opt_run_12345",
  "status": "queued",
  "estimatedStartTime": "2025-10-20T10:30:00Z"
}
```

#### 2. Get Job Status
```
GET /api/schedules/optimize/{runId}
Response: 200 OK
Body: OptimizationResponseDTO
```

#### 3. Cancel Job
```
DELETE /api/schedules/optimize/{runId}
Response: 204 No Content
```

#### 4. Apply Optimization Results
```
POST /api/schedules/{scheduleId}/versions/{versionId}/apply
Response: 200 OK
{
  "scheduleId": "schedule_123",
  "newVersionId": "v_456",
  "appliedAt": "2025-10-20T10:35:00Z"
}
```

#### 5. Real-time Progress (Server-Sent Events)
```
GET /api/schedules/optimize/{runId}/progress
Content-Type: text/event-stream

data: {"progress": 25, "step": "Loading constraints"}
data: {"progress": 50, "step": "Running solver"}
data: {"progress": 100, "step": "Complete", "versionId": "v_789"}
```

## Phase 2: Version Management

### Database Schema

```sql
-- Schedule versions table
CREATE TABLE schedule_versions (
  id UUID PRIMARY KEY,
  schedule_id UUID REFERENCES schedules(id),
  parent_version_id UUID REFERENCES schedule_versions(id),
  data JSONB NOT NULL,
  diff_from_parent JSONB,
  created_at TIMESTAMP NOT NULL,
  created_by UUID REFERENCES users(id),
  source VARCHAR(50), -- 'manual', 'optimization', 'import'
  metrics JSONB
);

-- Optimization runs table
CREATE TABLE optimization_runs (
  id UUID PRIMARY KEY,
  schedule_id UUID REFERENCES schedules(id),
  algorithm_id INT REFERENCES algorithms(id),
  profile_id INT REFERENCES algorithm_profiles(id),
  status VARCHAR(20) NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  progress_percentage INT,
  input_hash VARCHAR(64),
  lock_set JSONB,
  base_version_id UUID REFERENCES schedule_versions(id),
  result_version_id UUID REFERENCES schedule_versions(id),
  metrics JSONB,
  error JSONB
);
```

### Applying Optimized Results

```javascript
async function applyOptimizationResults(scheduler, optimizedData) {
  // Suspend auto-commit to batch updates
  scheduler.project.suspendAutoCommit();
  
  try {
    // Apply optimized dates to events
    for (const optEvent of optimizedData.events) {
      const event = scheduler.eventStore.getById(optEvent.id);
      if (event && optEvent.changed) {
        // Set the optimized values
        event.set({
          startDate: new Date(optEvent.startDate),
          endDate: new Date(optEvent.endDate),
          resourceId: optEvent.resourceId
        });
        
        // CRITICAL: Mark as manually scheduled to prevent engine override
        event.manuallyScheduled = true;
        
        // Add visual indicator
        event.cls = 'optimized-event';
      }
    }
    
    // Resume and propagate changes
    scheduler.project.resumeAutoCommit();
    await scheduler.project.commitAsync();
    
    // Update UI indicators
    showOptimizationMetrics(optimizedData.metrics);
    
  } catch (error) {
    scheduler.project.resumeAutoCommit();
    throw error;
  }
}
```

## Phase 3: Production Hardening

### Security Considerations

1. **iframe Communication Security**
```javascript
// Replace wildcard origin with specific domain
window.postMessage(data, 'https://your-domain.com');

// Validate message origin
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://your-domain.com') return;
  // Process message
});
```

2. **API Security**
- Rate limiting: Max 10 optimization requests per minute per user
- Authentication: JWT tokens with proper expiration
- Input validation: Max problem size limits
- CSRF protection for session-based auth

### Error Handling

```javascript
class OptimizationError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

// Error codes
const ERROR_CODES = {
  INVALID_SCHEDULE: 'E001',
  SOLVER_TIMEOUT: 'E002',
  INFEASIBLE_PROBLEM: 'E003',
  VERSION_CONFLICT: 'E004',
  RESOURCE_LOCKED: 'E005'
};
```

### Conflict Resolution

```javascript
async function handleVersionConflict(baseVersion, currentVersion, proposedChanges) {
  // Get diff between versions
  const diff = await getDiff(baseVersion, currentVersion);
  
  // Identify conflicts
  const conflicts = findConflicts(diff, proposedChanges);
  
  if (conflicts.length > 0) {
    // Show conflict resolution UI
    const resolution = await showConflictDialog(conflicts, {
      options: ['accept_theirs', 'accept_mine', 'merge', 'rerun']
    });
    
    switch (resolution.action) {
      case 'merge':
        return mergeChanges(currentVersion, proposedChanges, resolution.selections);
      case 'rerun':
        return rerunOptimization(currentVersion, resolution.locks);
      // ...
    }
  }
  
  return proposedChanges;
}
```

## Implementation Checklist

### Phase 1: Core Integration ✅
- [ ] Define DTOs and TypeScript interfaces
- [ ] Create optimization API endpoints
- [ ] Implement job state machine
- [ ] Add optimization trigger to scheduler UI
- [ ] Wire up Optimization Studio to submit jobs
- [ ] Test end-to-end flow

### Phase 2: Version Management
- [ ] Design and create database schema
- [ ] Implement schedule versioning
- [ ] Add diff/comparison views
- [ ] Apply manuallyScheduled flag correctly
- [ ] Build rollback functionality

### Phase 3: Production Hardening
- [ ] Secure iframe communication
- [ ] Add rate limiting and auth
- [ ] Implement comprehensive error handling
- [ ] Build conflict resolution UI
- [ ] Add monitoring and metrics
- [ ] Performance optimization

## Success Metrics

1. **Performance**
   - Optimization job submission < 500ms
   - Results application < 2 seconds
   - UI remains responsive during optimization

2. **Reliability**
   - Zero data loss during optimization
   - Graceful handling of solver failures
   - Automatic recovery from network issues

3. **User Experience**
   - Clear progress indication
   - Intuitive conflict resolution
   - Visual diff of changes
   - One-click rollback capability

## Next Steps

1. Start with Phase 1 implementation
2. Set up development environment with test data
3. Create integration tests
4. Document API contracts in OpenAPI/Swagger
5. Plan user training and documentation