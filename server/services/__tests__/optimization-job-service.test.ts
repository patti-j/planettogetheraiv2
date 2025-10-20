import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { OptimizationJobService } from '../optimization-job-service';
import { OptimizationRequestDTO, OptimizationStatus } from '@shared/optimization-types';
import { AlgorithmRegistry } from '../optimization/algorithm-registry';

describe('OptimizationJobService', () => {
  let service: OptimizationJobService;
  
  beforeEach(() => {
    service = new OptimizationJobService();
    jest.clearAllMocks();
  });

  describe('submitJob', () => {
    const validRequest: OptimizationRequestDTO = {
      algorithmId: 'forward-scheduling',
      profileId: 1,
      scheduleData: {
        resources: [
          { id: 'R1', name: 'Machine 1', capacity: 1, availability: [] }
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
        constraints: {},
        metadata: {
          scheduleId: 'test-schedule',
          userId: 'test-user'
        }
      },
      parameters: {
        timeLimit: 60,
        objectives: ['minimize_makespan']
      }
    };

    test('creates job with unique ID and queued status', async () => {
      const response = await service.submitJob(validRequest);
      
      expect(response.runId).toMatch(/^opt_run_[\w-]+$/);
      expect(response.status).toBe('queued');
      expect(response.submittedAt).toBeDefined();
    });

    test('generates consistent hash for identical inputs', async () => {
      const response1 = await service.submitJob(validRequest);
      const response2 = await service.submitJob(validRequest);
      
      // Get jobs to compare input hashes
      const job1 = await service.getJobStatus(response1.runId);
      const job2 = await service.getJobStatus(response2.runId);
      
      expect(job1?.inputHash).toBe(job2?.inputHash);
    });

    test('generates different hash for different inputs', async () => {
      const modifiedRequest = {
        ...validRequest,
        scheduleData: {
          ...validRequest.scheduleData,
          events: [
            ...validRequest.scheduleData.events,
            {
              id: 'E2',
              name: 'Operation 2',
              resourceId: 'R1',
              startDate: '2024-01-01T14:00:00Z',
              endDate: '2024-01-01T16:00:00Z',
              duration: 2,
              durationUnit: 'hour'
            }
          ]
        }
      };
      
      const response1 = await service.submitJob(validRequest);
      const response2 = await service.submitJob(modifiedRequest);
      
      const job1 = await service.getJobStatus(response1.runId);
      const job2 = await service.getJobStatus(response2.runId);
      
      expect(job1?.inputHash).not.toBe(job2?.inputHash);
    });

    test('throws error if algorithm not found', async () => {
      const invalidRequest = {
        ...validRequest,
        algorithmId: 'non-existent-algorithm'
      };
      
      await expect(service.submitJob(invalidRequest)).rejects.toThrow('Algorithm not found');
    });
  });

  describe('State Machine', () => {
    test('allows valid transition: queued → running', async () => {
      const response = await service.submitJob(validRequest);
      
      // Simulate algorithm starting
      await service.updateJobStatus(response.runId, 'running', 10);
      
      const job = await service.getJobStatus(response.runId);
      expect(job?.status).toBe('running');
      expect(job?.progress).toBe(10);
    });

    test('allows valid transition: running → completed', async () => {
      const response = await service.submitJob(validRequest);
      
      // Start job
      await service.updateJobStatus(response.runId, 'running', 0);
      
      // Complete job with result
      const result = {
        versionId: 'v123',
        changedEvents: ['E1'],
        metrics: {
          makespan: 120,
          resourceUtilization: 0.85
        }
      };
      
      await service.completeJob(response.runId, result);
      
      const job = await service.getJobStatus(response.runId);
      expect(job?.status).toBe('completed');
      expect(job?.result).toEqual(result);
      expect(job?.progress).toBe(100);
    });

    test('rejects invalid transition: completed → running', async () => {
      const response = await service.submitJob(validRequest);
      
      // Complete the job
      await service.updateJobStatus(response.runId, 'running', 0);
      await service.completeJob(response.runId, {});
      
      // Try to move back to running
      await expect(
        service.updateJobStatus(response.runId, 'running', 50)
      ).rejects.toThrow(/Invalid transition/);
    });
  });

  describe('cancelJob', () => {
    test('cancels queued job successfully', async () => {
      const response = await service.submitJob(validRequest);
      
      const cancelled = await service.cancelJob(response.runId);
      expect(cancelled).toBe(true);
      
      const job = await service.getJobStatus(response.runId);
      expect(job?.status).toBe('cancelled');
    });

    test('cancels running job successfully', async () => {
      const response = await service.submitJob(validRequest);
      
      // Start the job
      await service.updateJobStatus(response.runId, 'running', 50);
      
      const cancelled = await service.cancelJob(response.runId);
      expect(cancelled).toBe(true);
      
      const job = await service.getJobStatus(response.runId);
      expect(job?.status).toBe('cancelled');
    });

    test('cannot cancel completed job', async () => {
      const response = await service.submitJob(validRequest);
      
      // Complete the job
      await service.updateJobStatus(response.runId, 'running', 0);
      await service.completeJob(response.runId, {});
      
      const cancelled = await service.cancelJob(response.runId);
      expect(cancelled).toBe(false);
      
      const job = await service.getJobStatus(response.runId);
      expect(job?.status).toBe('completed'); // Status unchanged
    });
  });

  describe('Progress Updates', () => {
    test('emits progress events through SSE', async () => {
      const response = await service.submitJob(validRequest);
      const events: any[] = [];
      
      // Subscribe to progress
      const unsubscribe = service.subscribeToProgress(response.runId, (data) => {
        events.push(data);
      });
      
      // Simulate progress updates
      await service.updateJobStatus(response.runId, 'running', 0);
      await service.updateJobProgress(response.runId, 25, 'Analyzing dependencies');
      await service.updateJobProgress(response.runId, 50, 'Optimizing schedule');
      await service.updateJobProgress(response.runId, 75, 'Finalizing results');
      await service.completeJob(response.runId, { versionId: 'v123' });
      
      // Verify events
      expect(events).toHaveLength(5);
      expect(events[0].status).toBe('running');
      expect(events[0].progress).toBe(0);
      expect(events[1].progress).toBe(25);
      expect(events[2].progress).toBe(50);
      expect(events[3].progress).toBe(75);
      expect(events[4].status).toBe('completed');
      expect(events[4].progress).toBe(100);
      
      unsubscribe();
    });

    test('handles multiple subscribers', async () => {
      const response = await service.submitJob(validRequest);
      const subscriber1Events: any[] = [];
      const subscriber2Events: any[] = [];
      
      // Multiple subscribers
      const unsub1 = service.subscribeToProgress(response.runId, (data) => {
        subscriber1Events.push(data);
      });
      
      const unsub2 = service.subscribeToProgress(response.runId, (data) => {
        subscriber2Events.push(data);
      });
      
      // Update progress
      await service.updateJobStatus(response.runId, 'running', 50);
      
      // Both subscribers should receive the event
      expect(subscriber1Events).toHaveLength(1);
      expect(subscriber2Events).toHaveLength(1);
      expect(subscriber1Events[0]).toEqual(subscriber2Events[0]);
      
      unsub1();
      unsub2();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty schedule gracefully', async () => {
      const emptyRequest: OptimizationRequestDTO = {
        ...validRequest,
        scheduleData: {
          resources: [],
          events: [],
          dependencies: [],
          constraints: {},
          metadata: { scheduleId: 'empty', userId: 'test' }
        }
      };
      
      const response = await service.submitJob(emptyRequest);
      expect(response.runId).toBeDefined();
      
      // Simulate optimization completing with no changes
      await service.updateJobStatus(response.runId, 'running', 0);
      await service.completeJob(response.runId, {
        versionId: 'v-empty',
        changedEvents: [],
        metrics: {},
        warnings: ['No events to optimize']
      });
      
      const job = await service.getJobStatus(response.runId);
      expect(job?.result?.changedEvents).toHaveLength(0);
      expect(job?.result?.warnings).toContain('No events to optimize');
    });

    test('handles job not found', async () => {
      const status = await service.getJobStatus('non-existent-job');
      expect(status).toBeNull();
      
      const cancelled = await service.cancelJob('non-existent-job');
      expect(cancelled).toBe(false);
    });

    test('cleans up old jobs from memory', async () => {
      // Submit multiple jobs
      const jobs = await Promise.all([
        service.submitJob(validRequest),
        service.submitJob(validRequest),
        service.submitJob(validRequest),
      ]);
      
      // Complete all jobs
      for (const job of jobs) {
        await service.updateJobStatus(job.runId, 'running', 0);
        await service.completeJob(job.runId, {});
      }
      
      // Simulate cleanup (would normally be on a timer)
      await service.cleanupOldJobs(0); // Clean up jobs older than 0ms
      
      // Jobs should be removed from memory
      for (const job of jobs) {
        const status = await service.getJobStatus(job.runId);
        expect(status).toBeNull();
      }
    });
  });
});