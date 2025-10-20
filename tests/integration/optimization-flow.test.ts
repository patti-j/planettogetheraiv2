import { describe, test, expect } from '@jest/globals';

// Simplified integration test for optimization workflow
describe('Optimization Workflow Integration', () => {
  
  // Mock job service
  class MockOptimizationJobService {
    private jobs = new Map<string, any>();
    private jobCounter = 0;

    async submitJob(request: any) {
      const runId = `opt_run_${++this.jobCounter}`;
      const job = {
        runId,
        status: 'queued',
        request,
        progress: 0,
        submittedAt: new Date().toISOString(),
        result: null
      };
      
      this.jobs.set(runId, job);
      
      // Simulate async processing
      setTimeout(() => this.processJob(runId), 100);
      
      return { runId, status: 'queued', submittedAt: job.submittedAt };
    }

    private async processJob(runId: string) {
      const job = this.jobs.get(runId);
      if (!job) return;

      // Transition to running
      job.status = 'running';
      job.progress = 25;

      // Simulate progress
      await new Promise(resolve => setTimeout(resolve, 50));
      job.progress = 50;

      await new Promise(resolve => setTimeout(resolve, 50));
      job.progress = 75;

      // Complete
      job.status = 'completed';
      job.progress = 100;
      job.result = {
        versionId: `v_${Date.now()}`,
        changedEvents: job.request.scheduleData?.events?.map((e: any) => e.id) || [],
        metrics: {
          makespan: 480,
          resourceUtilization: 0.85
        }
      };
    }

    async getJobStatus(runId: string) {
      return this.jobs.get(runId) || null;
    }

    async cancelJob(runId: string) {
      const job = this.jobs.get(runId);
      if (!job) return false;
      
      if (job.status === 'queued' || job.status === 'running') {
        job.status = 'cancelled';
        job.progress = 0;
        job.result = null;
        return true;
      }
      
      return false;
    }
  }

  test('complete optimization lifecycle', async () => {
    const service = new MockOptimizationJobService();
    
    // 1. Submit job
    const request = {
      algorithmId: 'forward-scheduling',
      scheduleData: {
        events: [
          { id: 'E1', startDate: '2024-01-01T10:00:00Z' },
          { id: 'E2', startDate: '2024-01-01T12:00:00Z' }
        ],
        resources: [{ id: 'R1', name: 'Machine 1' }]
      }
    };
    
    const response = await service.submitJob(request);
    
    expect(response.runId).toMatch(/^opt_run_\d+$/);
    expect(response.status).toBe('queued');
    
    // 2. Check initial status
    let status = await service.getJobStatus(response.runId);
    expect(status).toBeDefined();
    expect(status.status).toBe('queued');
    
    // 3. Wait for processing to start
    await new Promise(resolve => setTimeout(resolve, 150));
    
    status = await service.getJobStatus(response.runId);
    expect(status.status).toBe('running');
    expect(status.progress).toBeGreaterThan(0);
    
    // 4. Wait for completion
    await new Promise(resolve => setTimeout(resolve, 200));
    
    status = await service.getJobStatus(response.runId);
    expect(status.status).toBe('completed');
    expect(status.progress).toBe(100);
    expect(status.result).toBeDefined();
    expect(status.result.versionId).toMatch(/^v_\d+$/);
    expect(status.result.changedEvents).toEqual(['E1', 'E2']);
    expect(status.result.metrics.makespan).toBe(480);
    expect(status.result.metrics.resourceUtilization).toBe(0.85);
  });

  test('job cancellation', async () => {
    const service = new MockOptimizationJobService();
    
    // Submit job
    const response = await service.submitJob({
      algorithmId: 'resource-leveling',
      scheduleData: { events: [], resources: [] }
    });
    
    // Cancel immediately
    const cancelled = await service.cancelJob(response.runId);
    expect(cancelled).toBe(true);
    
    // Verify cancelled status
    const status = await service.getJobStatus(response.runId);
    expect(status.status).toBe('cancelled');
    expect(status.result).toBeNull();
  });

  test('cannot cancel completed job', async () => {
    const service = new MockOptimizationJobService();
    
    // Submit and wait for completion
    const response = await service.submitJob({
      algorithmId: 'critical-path',
      scheduleData: { events: [], resources: [] }
    });
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Try to cancel completed job
    const cancelled = await service.cancelJob(response.runId);
    expect(cancelled).toBe(false);
    
    // Status should remain completed
    const status = await service.getJobStatus(response.runId);
    expect(status.status).toBe('completed');
  });

  test('handles job not found', async () => {
    const service = new MockOptimizationJobService();
    
    const status = await service.getJobStatus('non-existent-id');
    expect(status).toBeNull();
    
    const cancelled = await service.cancelJob('non-existent-id');
    expect(cancelled).toBe(false);
  });
});

describe('Rate Limiting Simulation', () => {
  
  class MockRateLimiter {
    private requests: Map<string, number[]> = new Map();
    private windowMs = 60000; // 1 minute
    private maxRequests = 10;

    isAllowed(clientId: string): boolean {
      const now = Date.now();
      const requests = this.requests.get(clientId) || [];
      
      // Remove old requests outside window
      const validRequests = requests.filter(time => now - time < this.windowMs);
      
      if (validRequests.length >= this.maxRequests) {
        return false;
      }
      
      validRequests.push(now);
      this.requests.set(clientId, validRequests);
      return true;
    }
  }

  test('enforces rate limit', () => {
    const limiter = new MockRateLimiter();
    const clientId = 'test-client';
    
    // First 10 requests should succeed
    for (let i = 0; i < 10; i++) {
      expect(limiter.isAllowed(clientId)).toBe(true);
    }
    
    // 11th request should be blocked
    expect(limiter.isAllowed(clientId)).toBe(false);
    expect(limiter.isAllowed(clientId)).toBe(false);
  });

  test('different clients have separate limits', () => {
    const limiter = new MockRateLimiter();
    
    // Client 1 uses their limit
    for (let i = 0; i < 10; i++) {
      expect(limiter.isAllowed('client1')).toBe(true);
    }
    expect(limiter.isAllowed('client1')).toBe(false);
    
    // Client 2 should still be allowed
    for (let i = 0; i < 10; i++) {
      expect(limiter.isAllowed('client2')).toBe(true);
    }
    expect(limiter.isAllowed('client2')).toBe(false);
  });
});