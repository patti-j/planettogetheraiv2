// Test helper utilities for optimization testing
import { OptimizationRequestDTO, ScheduleDataDTO } from '@shared/optimization-types';
import jwt from 'jsonwebtoken';

/**
 * Generates test schedule data with specified number of events and resources
 */
export function generateScheduleData(eventCount: number, resourceCount: number): ScheduleDataDTO {
  const resources = Array.from({ length: resourceCount }, (_, i) => ({
    id: `R${i + 1}`,
    name: `Resource ${i + 1}`,
    capacity: Math.floor(Math.random() * 3) + 1,
    availability: []
  }));

  const baseDate = new Date('2024-01-01T08:00:00Z');
  const events = Array.from({ length: eventCount }, (_, i) => {
    const startDate = new Date(baseDate);
    startDate.setHours(baseDate.getHours() + i * 2);
    
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + Math.floor(Math.random() * 4) + 1);

    return {
      id: `E${i + 1}`,
      name: `Operation ${i + 1}`,
      resourceId: resources[Math.floor(Math.random() * resourceCount)].id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      duration: (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60),
      durationUnit: 'hour' as const
    };
  });

  // Add some dependencies
  const dependencies = [];
  for (let i = 1; i < Math.min(10, eventCount); i++) {
    if (Math.random() > 0.5) {
      dependencies.push({
        from: `E${i}`,
        to: `E${i + 1}`,
        type: 'FS' as const,
        lag: 0
      });
    }
  }

  return {
    resources,
    events,
    dependencies,
    constraints: {
      maxMakespan: 720,
      minResourceUtilization: 0.3,
      maxResourceUtilization: 0.9
    },
    metadata: {
      scheduleId: `test-schedule-${Date.now()}`,
      userId: 'test-user',
      description: 'Generated test schedule'
    }
  };
}

/**
 * Generates a JWT token for testing authentication
 */
export async function generateAuthToken(payload: {
  userId: number;
  permissions?: string[];
  email?: string;
}): Promise<string> {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
  
  return jwt.sign(
    {
      id: payload.userId,
      email: payload.email || `user${payload.userId}@test.com`,
      permissions: payload.permissions || [],
      type: 'user'
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Generates schedule data with specific constraint scenarios
 */
export function generateConstrainedSchedule(
  scenario: 'feasible' | 'infeasible' | 'tight' | 'relaxed'
): ScheduleDataDTO {
  const baseSchedule = generateScheduleData(20, 5);

  switch (scenario) {
    case 'feasible':
      return {
        ...baseSchedule,
        constraints: {
          maxMakespan: 720,
          minResourceUtilization: 0.3,
          maxResourceUtilization: 0.9,
          maxWaitTime: 120
        }
      };
    
    case 'infeasible':
      return {
        ...baseSchedule,
        constraints: {
          maxMakespan: 1, // Impossible
          minResourceUtilization: 1.0, // Impossible
          maxSetupTime: 0 // Impossible with any setup
        }
      };
    
    case 'tight':
      return {
        ...baseSchedule,
        constraints: {
          maxMakespan: 100, // Very tight
          minResourceUtilization: 0.8, // High minimum
          maxResourceUtilization: 0.85, // Narrow band
          maxWaitTime: 5
        }
      };
    
    case 'relaxed':
      return {
        ...baseSchedule,
        constraints: {
          maxMakespan: 2000, // Very loose
          minResourceUtilization: 0.1,
          maxResourceUtilization: 1.0
        }
      };
  }
}

/**
 * Creates schedule data with circular dependencies for testing
 */
export function generateCircularDependencies(): ScheduleDataDTO {
  return {
    resources: [{ id: 'R1', name: 'Resource 1', capacity: 1 }],
    events: [
      {
        id: 'E1',
        name: 'Event 1',
        resourceId: 'R1',
        startDate: '2024-01-01T10:00:00Z',
        endDate: '2024-01-01T11:00:00Z'
      },
      {
        id: 'E2',
        name: 'Event 2',
        resourceId: 'R1',
        startDate: '2024-01-01T11:00:00Z',
        endDate: '2024-01-01T12:00:00Z'
      },
      {
        id: 'E3',
        name: 'Event 3',
        resourceId: 'R1',
        startDate: '2024-01-01T12:00:00Z',
        endDate: '2024-01-01T13:00:00Z'
      }
    ],
    dependencies: [
      { from: 'E1', to: 'E2', type: 'FS', lag: 0 },
      { from: 'E2', to: 'E3', type: 'FS', lag: 0 },
      { from: 'E3', to: 'E1', type: 'FS', lag: 0 } // Circular!
    ],
    constraints: {},
    metadata: {}
  };
}

/**
 * Creates schedule data with locked/manually scheduled events
 */
export function generateLockedSchedule(): ScheduleDataDTO {
  const schedule = generateScheduleData(10, 3);
  
  // Mark some events as locked
  return {
    ...schedule,
    events: schedule.events.map((event, index) => ({
      ...event,
      manuallyScheduled: index % 3 === 0, // Every third event is locked
      locked: index % 3 === 0
    }))
  };
}

/**
 * Test data for malicious input testing
 */
export const maliciousInputs = {
  xss: {
    script: '<script>alert("XSS")</script>',
    imgTag: '<img src=x onerror=alert(1)>',
    iframe: '<iframe src="evil.com"></iframe>',
    eventHandler: '<div onclick="hack()">Click</div>'
  },
  sqlInjection: {
    dropTable: "'; DROP TABLE users; --",
    orCondition: "1 OR 1=1",
    unionSelect: "' UNION SELECT * FROM passwords --"
  },
  commandInjection: {
    pipe: "test; cat /etc/passwd",
    backtick: "test`whoami`",
    dollar: "test$(ls -la)"
  }
};

/**
 * Wait for a specific job status
 */
export async function waitForJobStatus(
  app: any,
  runId: string,
  targetStatus: string,
  token: string,
  timeout: number = 10000
): Promise<any> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const response = await app
      .get(`/api/schedules/optimize/${runId}`)
      .set('Authorization', `Bearer ${token}`);
    
    if (response.body.status === targetStatus) {
      return response.body;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error(`Timeout waiting for status: ${targetStatus}`);
}

/**
 * Performance test helper - measures execution time
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = performance.now() - start;
      console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
    });
  }
  
  const duration = performance.now() - start;
  console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
  return result;
}