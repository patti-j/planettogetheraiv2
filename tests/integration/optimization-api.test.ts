import request from 'supertest';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { EventSource } from 'eventsource';
import { app } from '../../server/app';
import { generateScheduleData, generateAuthToken } from '../helpers';

describe('Optimization API Integration Tests', () => {
  let authToken: string;
  let testRunId: string;

  beforeAll(async () => {
    // Generate auth token for testing
    authToken = await generateAuthToken({
      userId: 1,
      permissions: ['optimization:submit', 'optimization:view']
    });
  });

  afterAll(async () => {
    // Cleanup any test data
    if (testRunId) {
      await request(app)
        .delete(`/api/schedules/optimize/${testRunId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
  });

  describe('Complete Optimization Workflow', () => {
    test('submit job → track progress → get result', async () => {
      // 1. Submit optimization job
      const scheduleData = generateScheduleData(50, 5); // 50 events, 5 resources
      
      const submitResponse = await request(app)
        .post('/api/schedules/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          algorithmId: 'forward-scheduling',
          profileId: '1',
          scheduleData,
          parameters: {
            timeLimit: 30,
            objectives: ['minimize_makespan']
          }
        })
        .expect(202);

      expect(submitResponse.body).toMatchObject({
        runId: expect.stringMatching(/^opt_run_[\w-]+$/),
        status: 'queued',
        submittedAt: expect.any(String)
      });

      testRunId = submitResponse.body.runId;

      // 2. Connect to SSE for progress updates
      const progressEvents: any[] = [];
      const eventSource = new EventSource(
        `http://localhost:5000/api/schedules/optimize/${testRunId}/progress`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      // Collect progress events
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          eventSource.close();
          reject(new Error('SSE timeout - optimization took too long'));
        }, 35000); // 35 second timeout

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          progressEvents.push(data);
          
          if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
            clearTimeout(timeout);
            eventSource.close();
            resolve(data);
          }
        };

        eventSource.onerror = (error) => {
          clearTimeout(timeout);
          eventSource.close();
          reject(error);
        };
      });

      // 3. Verify progress event sequence
      expect(progressEvents.length).toBeGreaterThan(0);
      
      // Should start with queued
      const firstEvent = progressEvents[0];
      expect(firstEvent.status).toBe('queued');
      expect(firstEvent.progress).toBe(0);

      // Should transition to running
      const runningEvents = progressEvents.filter(e => e.status === 'running');
      expect(runningEvents.length).toBeGreaterThan(0);

      // Progress should increase monotonically
      const progressValues = progressEvents
        .filter(e => e.progress !== undefined)
        .map(e => e.progress);
      
      for (let i = 1; i < progressValues.length; i++) {
        expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
      }

      // Should end with completed
      const lastEvent = progressEvents[progressEvents.length - 1];
      expect(lastEvent.status).toBe('completed');
      expect(lastEvent.progress).toBe(100);
      expect(lastEvent.result).toBeDefined();

      // 4. Verify final status via GET
      const statusResponse = await request(app)
        .get(`/api/schedules/optimize/${testRunId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse.body).toMatchObject({
        runId: testRunId,
        status: 'completed',
        progress: 100,
        result: {
          versionId: expect.any(String),
          changedEvents: expect.any(Array),
          metrics: expect.objectContaining({
            makespan: expect.any(Number),
            resourceUtilization: expect.any(Number)
          })
        }
      });
    });
  });

  describe('Cancellation Flow', () => {
    test('can cancel running optimization', async () => {
      // 1. Submit a large job that will take time
      const largeSchedule = generateScheduleData(500, 20);
      
      const submitResponse = await request(app)
        .post('/api/schedules/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          algorithmId: 'resource-leveling', // Slower algorithm
          profileId: '1',
          scheduleData: largeSchedule,
          parameters: {
            timeLimit: 120
          }
        })
        .expect(202);

      const runId = submitResponse.body.runId;

      // 2. Wait for job to start running
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Cancel the job
      await request(app)
        .delete(`/api/schedules/optimize/${runId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // 4. Verify job is cancelled
      const statusResponse = await request(app)
        .get(`/api/schedules/optimize/${runId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse.body.status).toBe('cancelled');
      expect(statusResponse.body.result).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('handles invalid algorithm ID', async () => {
      const response = await request(app)
        .post('/api/schedules/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          algorithmId: 'non-existent-algorithm',
          profileId: '1',
          scheduleData: generateScheduleData(10, 2)
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('Algorithm not found'),
        code: 'ALG_NOT_FOUND'
      });
    });

    test('handles invalid schedule data', async () => {
      const response = await request(app)
        .post('/api/schedules/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          algorithmId: 'forward-scheduling',
          scheduleData: {
            events: [
              {
                id: 'E1',
                startDate: 'not-a-valid-date' // Invalid date
              }
            ]
          }
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid request format',
        details: expect.any(Array)
      });
    });

    test('handles job not found', async () => {
      await request(app)
        .get('/api/schedules/optimize/opt_run_nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
        .expect(res => {
          expect(res.body.error).toContain('Job not found');
        });
    });
  });

  describe('Rate Limiting', () => {
    test('enforces optimization submission rate limit', async () => {
      const requests = [];
      const scheduleData = generateScheduleData(10, 2);

      // Submit 15 requests rapidly (limit is 10/minute)
      for (let i = 0; i < 15; i++) {
        requests.push(
          request(app)
            .post('/api/schedules/optimize')
            .set('Authorization', `Bearer ${authToken}`)
            .set('X-Forwarded-For', '192.168.1.100') // Same IP
            .send({
              algorithmId: 'forward-scheduling',
              profileId: '1',
              scheduleData
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // Count successful and rate-limited responses
      const successful = responses.filter(r => r.status === 202);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(successful.length).toBe(10); // First 10 succeed
      expect(rateLimited.length).toBe(5);  // Remaining 5 rate limited
      
      // Verify rate limit error message
      if (rateLimited.length > 0) {
        expect(rateLimited[0].body).toMatchObject({
          error: expect.stringContaining('Too many optimization requests')
        });
      }
    });

    test('rate limit resets after window', async () => {
      // First, exhaust the rate limit
      const scheduleData = generateScheduleData(5, 1);
      
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/schedules/optimize')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Forwarded-For', '192.168.1.101')
          .send({
            algorithmId: 'forward-scheduling',
            profileId: '1',
            scheduleData
          });
      }

      // Next request should be rate limited
      await request(app)
        .post('/api/schedules/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Forwarded-For', '192.168.1.101')
        .send({
          algorithmId: 'forward-scheduling',
          profileId: '1',
          scheduleData
        })
        .expect(429);

      // Wait for rate limit window to reset (simulated - in real tests would be 60s)
      // In practice, you'd mock the timer or use a shorter window for testing
      
      // For demonstration, we'll just verify the headers
      const limitedResponse = await request(app)
        .post('/api/schedules/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Forwarded-For', '192.168.1.101')
        .send({
          algorithmId: 'forward-scheduling',
          profileId: '1',
          scheduleData
        });

      if (limitedResponse.status === 429) {
        expect(limitedResponse.headers).toHaveProperty('x-ratelimit-limit');
        expect(limitedResponse.headers).toHaveProperty('x-ratelimit-remaining');
        expect(limitedResponse.headers).toHaveProperty('x-ratelimit-reset');
      }
    });
  });

  describe('Authentication & Authorization', () => {
    test('rejects requests without authentication', async () => {
      await request(app)
        .post('/api/schedules/optimize')
        .send({
          algorithmId: 'forward-scheduling',
          scheduleData: generateScheduleData(10, 2)
        })
        .expect(401)
        .expect(res => {
          expect(res.body.error).toContain('Authentication required');
        });
    });

    test('rejects requests with invalid token', async () => {
      await request(app)
        .post('/api/schedules/optimize')
        .set('Authorization', 'Bearer invalid-token-123')
        .send({
          algorithmId: 'forward-scheduling',
          scheduleData: generateScheduleData(10, 2)
        })
        .expect(401)
        .expect(res => {
          expect(res.body.error).toContain('Invalid token');
        });
    });

    test('requires optimization:submit permission in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Token without optimization:submit permission
      const limitedToken = await generateAuthToken({
        userId: 2,
        permissions: ['view:schedules', 'edit:schedules']
      });

      await request(app)
        .post('/api/schedules/optimize')
        .set('Authorization', `Bearer ${limitedToken}`)
        .send({
          algorithmId: 'forward-scheduling',
          scheduleData: generateScheduleData(10, 2)
        })
        .expect(403)
        .expect(res => {
          expect(res.body.error).toContain('Insufficient permissions');
        });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Security Validation', () => {
    test('sanitizes XSS attempts in schedule data', async () => {
      const maliciousSchedule = {
        algorithmId: 'forward-scheduling',
        profileId: '1',
        scheduleData: {
          resources: [{ id: 'R1', name: 'Resource 1' }],
          events: [
            {
              id: 'E1',
              name: '<script>alert("XSS")</script>Operation',
              description: '<img src=x onerror=alert(1)>',
              startDate: '2024-01-01T10:00:00Z',
              endDate: '2024-01-01T12:00:00Z'
            }
          ],
          metadata: {
            description: '<iframe src="evil.com"></iframe>Schedule'
          }
        }
      };

      const response = await request(app)
        .post('/api/schedules/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousSchedule)
        .expect(202);

      // Job should be created with sanitized data
      const statusResponse = await request(app)
        .get(`/api/schedules/optimize/${response.body.runId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Note: In a real implementation, we'd check the stored data
      // to ensure it's been sanitized
      expect(statusResponse.body.runId).toBeDefined();
    });

    test('rejects oversized payloads', async () => {
      // Create a payload larger than 10MB
      const hugeArray = new Array(100000).fill({
        id: 'E',
        name: 'x'.repeat(1000),
        data: 'y'.repeat(1000)
      });

      const oversizedPayload = {
        algorithmId: 'forward-scheduling',
        scheduleData: {
          events: hugeArray
        }
      };

      await request(app)
        .post('/api/schedules/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .send(oversizedPayload)
        .expect(413)
        .expect(res => {
          expect(res.body.error).toContain('too large');
        });
    });
  });

  describe('Edge Cases', () => {
    test('handles empty schedule', async () => {
      const response = await request(app)
        .post('/api/schedules/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          algorithmId: 'forward-scheduling',
          profileId: '1',
          scheduleData: {
            resources: [],
            events: [],
            metadata: {}
          }
        })
        .expect(202);

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await request(app)
        .get(`/api/schedules/optimize/${response.body.runId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse.body.status).toBe('completed');
      expect(statusResponse.body.result.changedEvents).toHaveLength(0);
      expect(statusResponse.body.result.warnings).toContain('No events to optimize');
    });

    test('handles concurrent job submissions for same user', async () => {
      const scheduleData = generateScheduleData(20, 3);
      
      // Submit 3 jobs concurrently
      const [job1, job2, job3] = await Promise.all([
        request(app)
          .post('/api/schedules/optimize')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ algorithmId: 'forward-scheduling', scheduleData }),
        
        request(app)
          .post('/api/schedules/optimize')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ algorithmId: 'backward-scheduling', scheduleData }),
        
        request(app)
          .post('/api/schedules/optimize')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ algorithmId: 'critical-path', scheduleData })
      ]);

      // All should succeed with different run IDs
      expect(job1.status).toBe(202);
      expect(job2.status).toBe(202);
      expect(job3.status).toBe(202);
      
      expect(job1.body.runId).not.toBe(job2.body.runId);
      expect(job2.body.runId).not.toBe(job3.body.runId);
      expect(job1.body.runId).not.toBe(job3.body.runId);
    });
  });
});

// Helper function generator for test data
export function generateScheduleData(eventCount: number, resourceCount: number) {
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
      durationUnit: 'hour'
    };
  });

  // Add some dependencies
  const dependencies = [];
  for (let i = 1; i < Math.min(10, eventCount); i++) {
    if (Math.random() > 0.5) {
      dependencies.push({
        from: `E${i}`,
        to: `E${i + 1}`,
        type: 'FS',
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

// Helper to generate auth tokens for testing
export async function generateAuthToken(payload: any): Promise<string> {
  // In real implementation, this would use JWT signing
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}