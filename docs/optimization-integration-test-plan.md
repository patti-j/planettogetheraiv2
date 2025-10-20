# Optimization Integration Test Plan
## Bryntum Scheduler Pro + Optimization Studio

### Executive Summary
This document outlines the systematic test plan for validating the integration between Bryntum Scheduler Pro (client-side visualization) and the Optimization Studio (server-side optimization engine). The plan covers unit, integration, security, performance, and end-to-end testing.

### Test Strategy Overview

| Test Level | Priority | Coverage | Tools |
|------------|----------|----------|-------|
| Unit Tests | P0 | Individual components | Jest, Vitest |
| Integration Tests | P0 | API + SSE workflows | Supertest, EventSource |
| Security Tests | P0 | Auth, validation, rate limiting | Jest, custom harness |
| Performance Tests | P1 | Load, throughput, memory | Artillery, K6 |
| End-to-End Tests | P0 | User workflows | Playwright/Cypress |
| Production Readiness | P0 | Config, monitoring, shutdown | Manual + automated |

---

## 1. Unit Tests (Priority: P0)

### 1.1 Client Bridge (`scheduler-optimization-bridge.ts`)

#### Test: collectSchedulerData
```typescript
describe('collectSchedulerData', () => {
  test('maps resources, events, dependencies correctly', () => {
    // Given: Mock scheduler store with 10 resources, 50 events, 5 dependencies
    // When: collectSchedulerData() called
    // Then: Output has correct counts, ISO dates, constraints only when present
    expect(result.resources).toHaveLength(10);
    expect(result.events).toHaveLength(50);
    expect(result.events[0].startDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
```

#### Test: applyOptimizationResults
```typescript
describe('applyOptimizationResults', () => {
  test('applies only changed items with manuallyScheduled flag', () => {
    // Given: Optimization result with 5 changed events
    // When: applyOptimizationResults() called
    // Then: Only changed events updated, manuallyScheduled=true, cls added
    expect(changedEvents).toHaveLength(5);
    expect(event.manuallyScheduled).toBe(true);
    expect(event.cls).toContain('optimized-event');
  });
  
  test('throws if no result provided', () => {
    // Given: Null optimization result
    // When: applyOptimizationResults(null)
    // Then: Throws error
    expect(() => applyOptimizationResults(null)).toThrow();
  });
});
```

### 1.2 State Machine (`OptimizationJobStateMachine`)

#### Test: Valid Transitions
```typescript
describe('State Machine Transitions', () => {
  test('allows valid transitions: queued→running→completed', () => {
    const machine = new OptimizationJobStateMachine();
    expect(() => machine.transition('queued', 'start')).not.toThrow();
    expect(() => machine.transition('running', 'complete')).not.toThrow();
  });
  
  test('rejects invalid transitions: completed→running', () => {
    const machine = new OptimizationJobStateMachine();
    machine.transition('queued', 'start');
    machine.transition('running', 'complete');
    expect(() => machine.transition('completed', 'start')).toThrow(/Invalid transition/);
  });
});
```

### 1.3 Validation Schemas (`optimization-schemas.ts`)

#### Test: Request Validation
```typescript
describe('Optimization Request Validation', () => {
  test('accepts valid payload', () => {
    const valid = {
      algorithmId: 'forward-scheduling',
      profileId: '1',
      scheduleData: {
        events: [{ id: '1', startDate: '2024-01-01T10:00:00Z' }],
        resources: [{ id: 'R1', name: 'Machine 1' }]
      }
    };
    expect(() => validateOptimizationRequest(valid)).not.toThrow();
  });
  
  test('rejects invalid ISO dates', () => {
    const invalid = { ...validPayload, scheduleData: { events: [{ startDate: 'not-a-date' }] }};
    expect(() => validateOptimizationRequest(invalid)).toThrow(/Invalid date format/);
  });
  
  test('rejects oversize arrays (>10000 items)', () => {
    const oversized = { ...validPayload, scheduleData: { events: new Array(10001).fill({}) }};
    expect(() => validateOptimizationRequest(oversized)).toThrow(/too many items/);
  });
});
```

#### Test: Sanitization
```typescript
describe('Schedule Data Sanitization', () => {
  test('strips XSS attempts from strings', () => {
    const malicious = {
      metadata: {
        description: '<script>alert("xss")</script>Normal text'
      }
    };
    const sanitized = sanitizeScheduleData(malicious);
    expect(sanitized.metadata.description).toBe('Normal text');
    expect(sanitized.metadata.description).not.toContain('<script>');
  });
});
```

---

## 2. Integration Tests (Priority: P0)

### 2.1 Happy Path Workflow

```typescript
describe('Optimization Workflow - Happy Path', () => {
  test('complete optimization lifecycle', async () => {
    // 1. Submit optimization job
    const response = await request(app)
      .post('/api/schedules/optimize')
      .set('Authorization', `Bearer ${validToken}`)
      .send(validScheduleData)
      .expect(202);
    
    const { runId } = response.body;
    expect(runId).toMatch(/^opt_run_/);
    
    // 2. Connect to SSE for progress updates
    const eventSource = new EventSource(`/api/schedules/optimize/${runId}/progress`);
    const events = [];
    
    await new Promise((resolve) => {
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        events.push(data);
        if (data.status === 'completed') {
          eventSource.close();
          resolve();
        }
      };
    });
    
    // 3. Verify progress sequence
    expect(events[0].status).toBe('queued');
    expect(events[events.length - 1].status).toBe('completed');
    expect(events[events.length - 1].result).toBeDefined();
    
    // 4. Verify final status
    const status = await request(app)
      .get(`/api/schedules/optimize/${runId}`)
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
    
    expect(status.body.status).toBe('completed');
    expect(status.body.result.versionId).toBeDefined();
    expect(status.body.result.metrics).toBeDefined();
  });
});
```

### 2.2 Cancellation Flow

```typescript
describe('Job Cancellation', () => {
  test('successfully cancels running job', async () => {
    // 1. Submit job
    const { runId } = await submitOptimizationJob(largeScheduleData);
    
    // 2. Wait for job to start running
    await waitForStatus(runId, 'running');
    
    // 3. Cancel the job
    await request(app)
      .delete(`/api/schedules/optimize/${runId}`)
      .set('Authorization', `Bearer ${validToken}`)
      .expect(204);
    
    // 4. Verify job is cancelled
    const status = await getJobStatus(runId);
    expect(status.status).toBe('cancelled');
    expect(status.result).toBeNull();
  });
});
```

---

## 3. Security Tests (Priority: P0)

### 3.1 Rate Limiting

```typescript
describe('Rate Limiting', () => {
  test('enforces job submission limits (10/min)', async () => {
    const requests = [];
    
    // Submit 15 requests rapidly
    for (let i = 0; i < 15; i++) {
      requests.push(
        request(app)
          .post('/api/schedules/optimize')
          .set('Authorization', `Bearer ${validToken}`)
          .send(validScheduleData)
      );
    }
    
    const responses = await Promise.all(requests);
    
    // First 10 should succeed (202)
    const successful = responses.filter(r => r.status === 202);
    expect(successful).toHaveLength(10);
    
    // Remaining 5 should be rate limited (429)
    const limited = responses.filter(r => r.status === 429);
    expect(limited).toHaveLength(5);
    expect(limited[0].body.error).toContain('Too many requests');
  });
  
  test('SSE connection limiting (5 concurrent)', async () => {
    const runId = 'opt_run_test';
    const connections = [];
    
    // Create 7 SSE connections
    for (let i = 0; i < 7; i++) {
      connections.push(new EventSource(`/api/schedules/optimize/${runId}/progress`));
    }
    
    // Wait and check connection states
    await sleep(1000);
    
    // First 5 should connect, last 2 should fail
    expect(connections.slice(0, 5).every(c => c.readyState === EventSource.OPEN)).toBe(true);
    expect(connections.slice(5).every(c => c.readyState === EventSource.CLOSED)).toBe(true);
  });
});
```

### 3.2 Authentication & Authorization

```typescript
describe('Authentication Requirements', () => {
  test('rejects requests without token', async () => {
    await request(app)
      .post('/api/schedules/optimize')
      .send(validScheduleData)
      .expect(401)
      .expect(res => {
        expect(res.body.error).toContain('Authentication required');
      });
  });
  
  test('requires optimization:submit permission in production', async () => {
    process.env.NODE_ENV = 'production';
    const limitedToken = generateToken({ permissions: ['view:schedules'] });
    
    await request(app)
      .post('/api/schedules/optimize')
      .set('Authorization', `Bearer ${limitedToken}`)
      .send(validScheduleData)
      .expect(403)
      .expect(res => {
        expect(res.body.error).toContain('Insufficient permissions');
      });
  });
});
```

### 3.3 Input Validation & Sanitization

```typescript
describe('Input Security', () => {
  test('rejects oversized payloads (>10MB)', async () => {
    const hugePayload = {
      scheduleData: {
        events: new Array(100000).fill({ data: 'x'.repeat(1000) })
      }
    };
    
    await request(app)
      .post('/api/schedules/optimize')
      .set('Authorization', `Bearer ${validToken}`)
      .send(hugePayload)
      .expect(413)
      .expect(res => {
        expect(res.body.error).toContain('Payload too large');
      });
  });
  
  test('sanitizes malicious input', async () => {
    const maliciousPayload = {
      algorithmId: 'forward-scheduling',
      scheduleData: {
        metadata: {
          description: '<img src=x onerror=alert(1)>',
          userId: '"><script>alert(1)</script>'
        }
      }
    };
    
    const response = await request(app)
      .post('/api/schedules/optimize')
      .set('Authorization', `Bearer ${validToken}`)
      .send(maliciousPayload)
      .expect(202);
    
    // Verify sanitized in job storage
    const job = await getJobById(response.body.runId);
    expect(job.scheduleData.metadata.description).not.toContain('<img');
    expect(job.scheduleData.metadata.description).not.toContain('onerror');
    expect(job.scheduleData.metadata.userId).not.toContain('<script>');
  });
});
```

---

## 4. Performance Tests (Priority: P1)

### 4.1 SSE Throughput

```yaml
# artillery-sse-test.yml
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 10
      rampTo: 50
  
scenarios:
  - name: "SSE Progress Stream"
    engine: "ws"
    flow:
      - connect: "/api/schedules/optimize/{{runId}}/progress"
      - think: 1
      - loop:
        - listen:
            channel: "message"
            capture:
              - json: "$.progress"
                as: "progress"
        - think: 0.5
        count: 100
```

### 4.2 Load Testing

```javascript
// k6-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
};

export default function () {
  const payload = JSON.stringify({
    algorithmId: 'forward-scheduling',
    scheduleData: generateSchedule(100, 20), // 100 events, 20 resources
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`,
    },
  };

  const response = http.post('http://localhost:5000/api/schedules/optimize', payload, params);
  
  check(response, {
    'status is 202': (r) => r.status === 202,
    'has runId': (r) => JSON.parse(r.body).runId !== undefined,
  });

  sleep(1);
}
```

---

## 5. End-to-End Tests (Priority: P0)

### 5.1 UI Optimization Flow

```typescript
// playwright/optimization-e2e.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Optimization UI Flow', () => {
  test('complete optimization from UI', async ({ page }) => {
    // 1. Navigate to Production Scheduler
    await page.goto('/production-scheduler');
    await page.waitForSelector('iframe#scheduler-frame');
    
    // 2. Switch to scheduler iframe context
    const frame = page.frameLocator('#scheduler-frame');
    
    // 3. Click Optimize button
    await frame.locator('[data-testid="optimize-button"]').click();
    
    // 4. Select algorithm in dialog
    await frame.locator('[data-testid="algorithm-select"]').selectOption('forward-scheduling');
    await frame.locator('[data-testid="confirm-optimize"]').click();
    
    // 5. Verify progress indicator appears
    await expect(frame.locator('[data-testid="optimization-progress"]')).toBeVisible();
    
    // 6. Wait for completion
    await expect(frame.locator('[data-testid="optimization-progress"]')).toContainText('100%', { timeout: 30000 });
    
    // 7. Verify events updated with optimized class
    const optimizedEvents = await frame.locator('.b-sch-event.optimized-event').count();
    expect(optimizedEvents).toBeGreaterThan(0);
    
    // 8. Verify metrics displayed
    await expect(frame.locator('[data-testid="optimization-metrics"]')).toBeVisible();
    await expect(frame.locator('[data-testid="metric-makespan"]')).toContainText(/\d+ hours/);
    await expect(frame.locator('[data-testid="metric-utilization"]')).toContainText(/\d+%/);
  });

  test('cancel optimization from UI', async ({ page }) => {
    // 1. Start optimization
    await page.goto('/production-scheduler');
    const frame = page.frameLocator('#scheduler-frame');
    await frame.locator('[data-testid="optimize-button"]').click();
    await frame.locator('[data-testid="confirm-optimize"]').click();
    
    // 2. Click cancel while in progress
    await expect(frame.locator('[data-testid="cancel-button"]')).toBeVisible();
    await frame.locator('[data-testid="cancel-button"]').click();
    
    // 3. Verify cancellation
    await expect(frame.locator('[data-testid="optimization-status"]')).toContainText('Cancelled');
    
    // 4. Verify no events updated
    const optimizedEvents = await frame.locator('.b-sch-event.optimized-event').count();
    expect(optimizedEvents).toBe(0);
  });
});
```

---

## 6. Error Handling & Edge Cases

### 6.1 Empty Schedule Handling

```typescript
test('handles empty schedule gracefully', async () => {
  const emptySchedule = {
    algorithmId: 'forward-scheduling',
    scheduleData: {
      events: [],
      resources: []
    }
  };
  
  const response = await submitOptimization(emptySchedule);
  expect(response.status).toBe(202);
  
  const result = await waitForCompletion(response.runId);
  expect(result.status).toBe('completed');
  expect(result.result.changedEvents).toHaveLength(0);
  expect(result.warnings).toContain('No events to optimize');
});
```

### 6.2 Constraint Violations

```typescript
test('handles infeasible constraints', async () => {
  const infeasibleSchedule = {
    algorithmId: 'critical-path',
    scheduleData: {
      events: createConflictingEvents(), // Events with impossible dependencies
      constraints: {
        maxMakespan: 1, // Impossible to achieve
      }
    }
  };
  
  const result = await runOptimization(infeasibleSchedule);
  expect(result.status).toBe('completed');
  expect(result.result.relaxedConstraints).toContain('maxMakespan');
  expect(result.warnings).toContain('Constraints relaxed to find feasible solution');
});
```

### 6.3 SSE Reconnection

```typescript
test('handles SSE disconnection gracefully', async () => {
  const runId = await startOptimization();
  const events = [];
  
  // Connect to SSE
  let eventSource = new EventSource(`/api/schedules/optimize/${runId}/progress`);
  
  eventSource.onmessage = (e) => events.push(JSON.parse(e.data));
  
  // Simulate disconnect after 2 seconds
  setTimeout(() => {
    eventSource.close();
    
    // Reconnect
    eventSource = new EventSource(`/api/schedules/optimize/${runId}/progress`);
    eventSource.onmessage = (e) => events.push(JSON.parse(e.data));
  }, 2000);
  
  await waitForCompletion(runId);
  
  // Should have received all critical updates despite disconnect
  expect(events.some(e => e.status === 'running')).toBe(true);
  expect(events.some(e => e.status === 'completed')).toBe(true);
});
```

---

## 7. Production Readiness Tests

### 7.1 Graceful Shutdown

```typescript
test('handles graceful shutdown', async () => {
  // Start multiple optimization jobs
  const jobs = await Promise.all([
    startOptimization(largeSchedule1),
    startOptimization(largeSchedule2),
    startOptimization(largeSchedule3),
  ]);
  
  // Trigger shutdown
  process.emit('SIGTERM');
  
  // Wait for graceful shutdown
  await sleep(5000);
  
  // Verify all jobs either completed or cancelled
  for (const job of jobs) {
    const status = await getJobStatus(job.runId);
    expect(['completed', 'cancelled', 'failed']).toContain(status.status);
  }
  
  // Verify no unhandled rejections
  expect(process.listenerCount('unhandledRejection')).toBe(0);
});
```

### 7.2 Configuration Validation

```typescript
describe('Production Configuration', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'production';
  });
  
  test('requires proper JWT secret', () => {
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.JWT_SECRET).not.toBe('dev-secret-key-change-in-production');
  });
  
  test('rate limits are production-appropriate', () => {
    const config = getRateLimitConfig();
    expect(config.optimization.windowMs).toBe(60000); // 1 minute
    expect(config.optimization.max).toBeLessThanOrEqual(10); // Max 10 per minute
    expect(config.sse.max).toBeLessThanOrEqual(5); // Max 5 concurrent SSE
  });
  
  test('auth middleware enforced on all routes', async () => {
    const protectedRoutes = [
      '/api/schedules/optimize',
      '/api/schedules/optimize/test-run-id',
      '/api/schedules/optimize/test-run-id/progress',
    ];
    
    for (const route of protectedRoutes) {
      const response = await request(app)
        .get(route)
        .expect(401);
      
      expect(response.body.error).toContain('Authentication required');
    }
  });
});
```

### 7.3 Observability

```typescript
test('logs critical events without sensitive data', async () => {
  const logSpy = jest.spyOn(console, 'log');
  const errorSpy = jest.spyOn(console, 'error');
  
  // Run optimization with sensitive data
  await runOptimization({
    algorithmId: 'forward-scheduling',
    scheduleData: {
      metadata: {
        apiKey: 'secret-key-123',
        password: 'user-password',
      }
    }
  });
  
  // Verify logs don't contain sensitive data
  const allLogs = [...logSpy.mock.calls, ...errorSpy.mock.calls].flat().join(' ');
  expect(allLogs).not.toContain('secret-key-123');
  expect(allLogs).not.toContain('user-password');
  
  // Verify critical events are logged
  expect(allLogs).toContain('Optimization job submitted');
  expect(allLogs).toContain('Optimization completed');
});
```

---

## Test Execution Plan

### Phase 1: Foundation (Week 1)
- [ ] Set up test infrastructure (Jest, Supertest, Playwright)
- [ ] Implement unit tests for critical components
- [ ] Fix type mismatches between shared/server schemas

### Phase 2: Integration (Week 2)
- [ ] Implement API integration tests
- [ ] Set up SSE testing harness
- [ ] Test cancellation flows

### Phase 3: Security & Performance (Week 3)
- [ ] Implement security test suite
- [ ] Set up performance testing with Artillery/K6
- [ ] Load test optimization algorithms

### Phase 4: E2E & Production (Week 4)
- [ ] Implement Playwright E2E tests
- [ ] Production readiness validation
- [ ] Documentation and CI/CD integration

---

## Success Criteria

### Coverage Targets
- Unit Test Coverage: >80%
- Integration Test Coverage: >70%
- E2E Critical Paths: 100%

### Performance Targets
- API Response Time (p95): <500ms
- SSE Latency (median): <200ms
- Memory Usage: <500MB under load
- Concurrent Jobs: Support 50+

### Security Requirements
- All endpoints authenticated ✓
- Rate limiting enforced ✓
- Input validation complete ✓
- No sensitive data in logs ✓

---

## Continuous Testing

### CI Pipeline Integration
```yaml
# .github/workflows/test.yml
name: Optimization Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Unit Tests
        run: npm run test:unit
        
      - name: Integration Tests
        run: npm run test:integration
        
      - name: Security Tests
        run: npm run test:security
        
      - name: E2E Tests
        run: npm run test:e2e
        
      - name: Coverage Report
        run: npm run coverage:report
```

### Monitoring & Alerting
- Set up production monitoring for optimization job metrics
- Alert on high failure rates (>10%)
- Monitor SSE connection health
- Track optimization performance trends

---

## Appendix: Test Data Generators

```typescript
// test/fixtures/schedule-generator.ts
export function generateSchedule(eventCount: number, resourceCount: number) {
  const resources = Array.from({ length: resourceCount }, (_, i) => ({
    id: `R${i}`,
    name: `Resource ${i}`,
    capacity: Math.floor(Math.random() * 3) + 1,
  }));
  
  const events = Array.from({ length: eventCount }, (_, i) => ({
    id: `E${i}`,
    name: `Operation ${i}`,
    resourceId: resources[Math.floor(Math.random() * resourceCount)].id,
    startDate: new Date(2024, 0, Math.floor(i / 10) + 1).toISOString(),
    duration: Math.floor(Math.random() * 8) + 1,
    durationUnit: 'hour',
  }));
  
  return { resources, events };
}

export function generateConstraints(type: 'feasible' | 'infeasible') {
  if (type === 'feasible') {
    return {
      maxMakespan: 720, // 30 days
      minResourceUtilization: 0.5,
      maxResourceUtilization: 0.95,
    };
  }
  
  return {
    maxMakespan: 1, // Impossible
    minResourceUtilization: 1.0, // Impossible
    maxSetupTime: 0, // Impossible
  };
}
```