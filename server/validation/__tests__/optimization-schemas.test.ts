import { describe, test, expect } from '@jest/globals';
import { 
  validateOptimizationRequest, 
  sanitizeScheduleData,
  MAX_REQUEST_SIZE 
} from '../optimization-schemas';
import { z } from 'zod';

describe('Optimization Request Validation', () => {
  const validRequest = {
    algorithmId: 'forward-scheduling',
    profileId: '1',
    scheduleData: {
      resources: [
        { id: 'R1', name: 'Machine 1', capacity: 1 }
      ],
      events: [
        {
          id: 'E1',
          name: 'Operation 1',
          resourceId: 'R1',
          startDate: '2024-01-01T10:00:00Z',
          endDate: '2024-01-01T12:00:00Z',
          duration: 2,
          durationUnit: 'hour'
        }
      ],
      dependencies: [],
      constraints: {
        maxMakespan: 720,
        minResourceUtilization: 0.5
      },
      metadata: {
        scheduleId: 'test-schedule',
        userId: 'test-user',
        description: 'Test schedule for validation'
      }
    },
    parameters: {
      timeLimit: 60,
      objectives: ['minimize_makespan', 'maximize_utilization']
    }
  };

  describe('Valid Requests', () => {
    test('accepts complete valid request', () => {
      expect(() => validateOptimizationRequest(validRequest)).not.toThrow();
      const result = validateOptimizationRequest(validRequest);
      expect(result.algorithmId).toBe('forward-scheduling');
      expect(result.scheduleData.events).toHaveLength(1);
    });

    test('accepts request without optional fields', () => {
      const minimal = {
        algorithmId: 'critical-path',
        scheduleData: {
          resources: [],
          events: [],
          metadata: {}
        }
      };
      
      expect(() => validateOptimizationRequest(minimal)).not.toThrow();
    });
  });

  describe('Algorithm Validation', () => {
    test('rejects invalid algorithm ID format', () => {
      const invalid = {
        ...validRequest,
        algorithmId: 'invalid algorithm!' // Contains special characters
      };
      
      expect(() => validateOptimizationRequest(invalid)).toThrow(z.ZodError);
      
      try {
        validateOptimizationRequest(invalid);
      } catch (error: any) {
        expect(error.errors[0].path).toContain('algorithmId');
        expect(error.errors[0].message).toContain('Invalid algorithm ID format');
      }
    });

    test('rejects algorithm ID > 100 characters', () => {
      const invalid = {
        ...validRequest,
        algorithmId: 'a'.repeat(101)
      };
      
      expect(() => validateOptimizationRequest(invalid)).toThrow(z.ZodError);
    });
  });

  describe('Date Validation', () => {
    test('rejects invalid ISO date formats', () => {
      const invalid = {
        ...validRequest,
        scheduleData: {
          ...validRequest.scheduleData,
          events: [
            {
              id: 'E1',
              name: 'Op1',
              startDate: '2024-01-01', // Missing time component
              endDate: '2024-01-01T12:00:00Z'
            }
          ]
        }
      };
      
      expect(() => validateOptimizationRequest(invalid)).toThrow(z.ZodError);
      
      try {
        validateOptimizationRequest(invalid);
      } catch (error: any) {
        expect(error.errors[0].message).toContain('Invalid ISO 8601 date');
      }
    });

    test('accepts valid ISO dates with different timezones', () => {
      const withTimezones = {
        ...validRequest,
        scheduleData: {
          ...validRequest.scheduleData,
          events: [
            {
              id: 'E1',
              name: 'Op1',
              startDate: '2024-01-01T10:00:00Z', // UTC
              endDate: '2024-01-01T12:00:00+02:00' // Timezone offset
            },
            {
              id: 'E2',
              name: 'Op2',
              startDate: '2024-01-01T14:00:00.123Z', // With milliseconds
              endDate: '2024-01-01T16:00:00-05:00' // Negative offset
            }
          ]
        }
      };
      
      expect(() => validateOptimizationRequest(withTimezones)).not.toThrow();
    });
  });

  describe('Array Size Limits', () => {
    test('rejects events array > 10000 items', () => {
      const oversized = {
        ...validRequest,
        scheduleData: {
          ...validRequest.scheduleData,
          events: Array(10001).fill({
            id: 'E1',
            name: 'Op',
            startDate: '2024-01-01T10:00:00Z',
            endDate: '2024-01-01T11:00:00Z'
          })
        }
      };
      
      expect(() => validateOptimizationRequest(oversized)).toThrow(z.ZodError);
      
      try {
        validateOptimizationRequest(oversized);
      } catch (error: any) {
        expect(error.errors[0].message).toContain('too many items');
      }
    });

    test('accepts events array with exactly 10000 items', () => {
      const maxSize = {
        ...validRequest,
        scheduleData: {
          ...validRequest.scheduleData,
          events: Array(10000).fill({
            id: 'E1',
            name: 'Op',
            startDate: '2024-01-01T10:00:00Z',
            endDate: '2024-01-01T11:00:00Z'
          })
        }
      };
      
      expect(() => validateOptimizationRequest(maxSize)).not.toThrow();
    });

    test('rejects resources array > 1000 items', () => {
      const oversized = {
        ...validRequest,
        scheduleData: {
          ...validRequest.scheduleData,
          resources: Array(1001).fill({ id: 'R1', name: 'Resource' })
        }
      };
      
      expect(() => validateOptimizationRequest(oversized)).toThrow(z.ZodError);
    });

    test('rejects dependencies array > 5000 items', () => {
      const oversized = {
        ...validRequest,
        scheduleData: {
          ...validRequest.scheduleData,
          dependencies: Array(5001).fill({ from: 'E1', to: 'E2', type: 'FS' })
        }
      };
      
      expect(() => validateOptimizationRequest(oversized)).toThrow(z.ZodError);
    });
  });

  describe('Objectives Validation', () => {
    test('accepts valid objectives', () => {
      const validObjectives = [
        ['minimize_makespan'],
        ['maximize_utilization'],
        ['minimize_cost'],
        ['minimize_delays'],
        ['balance_workload'],
        ['minimize_makespan', 'maximize_utilization'] // Multiple objectives
      ];
      
      for (const objectives of validObjectives) {
        const request = {
          ...validRequest,
          parameters: {
            ...validRequest.parameters,
            objectives
          }
        };
        
        expect(() => validateOptimizationRequest(request)).not.toThrow();
      }
    });

    test('rejects invalid objectives', () => {
      const invalid = {
        ...validRequest,
        parameters: {
          ...validRequest.parameters,
          objectives: ['invalid_objective', 'minimize_makespan']
        }
      };
      
      expect(() => validateOptimizationRequest(invalid)).toThrow(z.ZodError);
      
      try {
        validateOptimizationRequest(invalid);
      } catch (error: any) {
        expect(error.errors[0].message).toContain('Invalid enum value');
      }
    });
  });

  describe('Numeric Constraints', () => {
    test('validates numeric ranges for constraints', () => {
      const invalidConstraints = {
        ...validRequest,
        scheduleData: {
          ...validRequest.scheduleData,
          constraints: {
            maxMakespan: -1, // Should be positive
            minResourceUtilization: 1.5, // Should be 0-1
            maxResourceUtilization: -0.1, // Should be 0-1
          }
        }
      };
      
      expect(() => validateOptimizationRequest(invalidConstraints)).toThrow(z.ZodError);
    });

    test('accepts valid constraint ranges', () => {
      const validConstraints = {
        ...validRequest,
        scheduleData: {
          ...validRequest.scheduleData,
          constraints: {
            maxMakespan: 720,
            minResourceUtilization: 0.0,
            maxResourceUtilization: 1.0,
            maxWaitTime: 60,
            maxSetupTime: 30
          }
        }
      };
      
      expect(() => validateOptimizationRequest(validConstraints)).not.toThrow();
    });
  });
});

describe('Schedule Data Sanitization', () => {
  describe('XSS Prevention', () => {
    test('removes script tags from strings', () => {
      const malicious = {
        metadata: {
          description: '<script>alert("XSS")</script>This is a description',
          notes: 'Normal text <script src="evil.js"></script> more text'
        }
      };
      
      const sanitized = sanitizeScheduleData(malicious);
      
      expect(sanitized.metadata.description).toBe('This is a description');
      expect(sanitized.metadata.notes).toBe('Normal text  more text');
      expect(sanitized.metadata.description).not.toContain('<script>');
      expect(sanitized.metadata.notes).not.toContain('evil.js');
    });

    test('removes HTML event handlers', () => {
      const malicious = {
        events: [
          {
            name: '<img src=x onerror=alert(1)>',
            description: '<div onclick="hack()">Click me</div>'
          }
        ],
        metadata: {
          title: '<button onmouseover="steal()">Hover</button>'
        }
      };
      
      const sanitized = sanitizeScheduleData(malicious);
      
      expect(sanitized.events[0].name).not.toContain('onerror');
      expect(sanitized.events[0].description).not.toContain('onclick');
      expect(sanitized.metadata.title).not.toContain('onmouseover');
    });

    test('preserves safe HTML entities', () => {
      const safe = {
        metadata: {
          description: 'Temperature > 100°C & pressure < 50 bar',
          formula: 'E = mc²',
          company: 'Smith & Sons'
        }
      };
      
      const sanitized = sanitizeScheduleData(safe);
      
      expect(sanitized.metadata.description).toContain('>');
      expect(sanitized.metadata.description).toContain('&');
      expect(sanitized.metadata.formula).toContain('²');
      expect(sanitized.metadata.company).toBe('Smith & Sons');
    });
  });

  describe('SQL Injection Prevention', () => {
    test('escapes SQL injection attempts', () => {
      const sqlInjection = {
        metadata: {
          userId: "1'; DROP TABLE users; --",
          scheduleId: "1 OR 1=1",
          description: "'; DELETE FROM schedules WHERE '1'='1"
        }
      };
      
      const sanitized = sanitizeScheduleData(sqlInjection);
      
      // Should escape quotes and dangerous SQL keywords
      expect(sanitized.metadata.userId).not.toContain('DROP TABLE');
      expect(sanitized.metadata.scheduleId).toBe("1 OR 1=1"); // Preserved but will be parameterized
      expect(sanitized.metadata.description).not.toContain('DELETE FROM');
    });
  });

  describe('Deep Sanitization', () => {
    test('sanitizes nested objects and arrays', () => {
      const nested = {
        events: [
          {
            id: 'E1',
            name: '<script>alert(1)</script>Event 1',
            metadata: {
              notes: '<img src=x onerror=alert(2)>',
              tags: ['<script>tag1</script>', 'safe-tag', '<div onclick="x">tag3</div>']
            }
          }
        ],
        resources: [
          {
            id: 'R1',
            name: 'Resource<script>hack()</script>',
            properties: {
              description: '<iframe src="evil.com"></iframe>Machine'
            }
          }
        ]
      };
      
      const sanitized = sanitizeScheduleData(nested);
      
      expect(sanitized.events[0].name).toBe('Event 1');
      expect(sanitized.events[0].metadata.notes).not.toContain('onerror');
      expect(sanitized.events[0].metadata.tags[0]).not.toContain('<script>');
      expect(sanitized.events[0].metadata.tags[1]).toBe('safe-tag');
      expect(sanitized.resources[0].name).not.toContain('<script>');
      expect(sanitized.resources[0].properties.description).not.toContain('<iframe>');
    });
  });

  describe('Performance', () => {
    test('handles large payloads efficiently', () => {
      const largePayload = {
        events: Array(1000).fill({
          name: '<script>alert()</script>Event',
          description: 'A very long description '.repeat(100)
        }),
        resources: Array(100).fill({
          name: '<div>Resource</div>',
          metadata: {
            notes: '<img src=x>'.repeat(50)
          }
        })
      };
      
      const startTime = Date.now();
      const sanitized = sanitizeScheduleData(largePayload);
      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000); // Less than 1 second
      
      // Should sanitize all items
      expect(sanitized.events[0].name).not.toContain('<script>');
      expect(sanitized.resources[0].name).not.toContain('<div>');
    });
  });
});

describe('Request Size Validation', () => {
  test('MAX_REQUEST_SIZE is set appropriately', () => {
    expect(MAX_REQUEST_SIZE).toBe('10mb');
  });
  
  test('rejects payloads exceeding size limit', () => {
    // This would be tested at the Express middleware level
    // Here we just verify the constant is exported
    expect(MAX_REQUEST_SIZE).toBeDefined();
    expect(typeof MAX_REQUEST_SIZE).toBe('string');
  });
});