/**
 * Optimization Job Service
 * Manages the lifecycle of optimization jobs for Bryntum Scheduler integration
 */

import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'events';
import crypto from 'crypto';
import {
  OptimizationRequestDTO,
  OptimizationResponseDTO,
  OptimizationStatus,
  OptimizationJob,
  OptimizationProgress,
  OptimizationResult,
  OptimizationError,
  OPTIMIZATION_ERROR_CODES,
  ScheduleVersion,
  ScheduleDataDTO
} from '@shared/optimization-types';
import { storage } from '../storage';
import { AlgorithmRegistry } from './optimization/algorithm-registry';
import { ScheduleVersionService } from './schedule-version-service';

// Job state machine
export class OptimizationJobStateMachine {
  private status: OptimizationStatus = 'queued';
  private validTransitions: Record<OptimizationStatus, OptimizationStatus[]> = {
    'queued': ['running', 'cancelled'],
    'running': ['completed', 'failed', 'cancelled'],
    'completed': [],
    'failed': [],
    'cancelled': []
  };

  constructor(initialStatus?: OptimizationStatus) {
    if (initialStatus) {
      this.status = initialStatus;
    }
  }

  canTransitionTo(newStatus: OptimizationStatus): boolean {
    return this.validTransitions[this.status].includes(newStatus);
  }

  transition(newStatus: OptimizationStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Invalid transition from ${this.status} to ${newStatus}`);
    }
    this.status = newStatus;
  }

  getStatus(): OptimizationStatus {
    return this.status;
  }
}

// In-memory job storage (replace with database in production)
class JobStore {
  private jobs: Map<string, OptimizationJob> = new Map();
  private scheduleVersions: Map<string, ScheduleVersion> = new Map();

  async createJob(request: OptimizationRequestDTO): Promise<OptimizationJob> {
    const jobId = `opt_run_${uuidv4()}`;
    const job: OptimizationJob = {
      id: jobId,
      scheduleId: request.scheduleData.metadata?.plantId || '1',
      algorithmId: request.algorithmId,
      profileId: request.profileId,
      status: 'queued',
      progressPercentage: 0,
      inputHash: this.hashInput(request.scheduleData),
      lockSet: request.locks,
      baseVersionId: request.scheduleData.version || `v_${uuidv4()}`
    };

    this.jobs.set(jobId, job);
    return job;
  }

  async getJob(jobId: string): Promise<OptimizationJob | undefined> {
    return this.jobs.get(jobId);
  }

  async updateJob(jobId: string, updates: Partial<OptimizationJob>): Promise<OptimizationJob | undefined> {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

    const updatedJob = { ...job, ...updates };
    this.jobs.set(jobId, updatedJob);
    return updatedJob;
  }

  async createScheduleVersion(scheduleData: ScheduleDataDTO, source: 'manual' | 'optimization' | 'import'): Promise<string> {
    const versionId = `v_${uuidv4()}`;
    const version: ScheduleVersion = {
      id: versionId,
      scheduleId: scheduleData.metadata?.plantId || '1',
      parentVersionId: scheduleData.version,
      data: scheduleData,
      createdAt: new Date().toISOString(),
      createdBy: scheduleData.metadata?.userId || 'system',
      source
    };

    this.scheduleVersions.set(versionId, version);
    return versionId;
  }

  async getScheduleVersion(versionId: string): Promise<ScheduleVersion | undefined> {
    return this.scheduleVersions.get(versionId);
  }

  private hashInput(data: ScheduleDataDTO): string {
    // Use SHA-256 for secure hashing
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex').substring(0, 16);
  }
}

// Main Optimization Job Service
export class OptimizationJobService extends EventEmitter {
  private jobStore: JobStore;
  private algorithmRegistry: AlgorithmRegistry;
  private activeJobs: Map<string, OptimizationJobStateMachine> = new Map();

  constructor() {
    super();
    this.jobStore = new JobStore();
    this.algorithmRegistry = AlgorithmRegistry.getInstance();
  }

  /**
   * Submit a new optimization job
   */
  async submitJob(request: OptimizationRequestDTO): Promise<OptimizationResponseDTO> {
    try {
      // Validate algorithm exists
      const algorithm = await this.algorithmRegistry.getAlgorithm(request.algorithmId.toString());
      if (!algorithm) {
        throw this.createError(
          OPTIMIZATION_ERROR_CODES.ALGORITHM_NOT_FOUND,
          `Algorithm with ID ${request.algorithmId} not found`
        );
      }

      // Create job
      const job = await this.jobStore.createJob(request);
      const stateMachine = new OptimizationJobStateMachine('queued');
      this.activeJobs.set(job.id, stateMachine);

      // Start async processing
      this.processJobAsync(job.id, request);

      // Return immediate response
      return {
        runId: job.id,
        status: 'queued',
        progress: {
          percentage: 0,
          currentStep: 'Job queued for processing'
        }
      };
    } catch (error) {
      return {
        runId: 'error',
        status: 'failed',
        error: this.handleError(error)
      };
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(runId: string): Promise<OptimizationResponseDTO | undefined> {
    const job = await this.jobStore.getJob(runId);
    if (!job) return undefined;

    const response: OptimizationResponseDTO = {
      runId: job.id,
      status: job.status,
      progress: {
        percentage: job.progressPercentage,
        currentStep: this.getStepDescription(job.status)
      }
    };

    if (job.resultVersionId) {
      const version = await this.jobStore.getScheduleVersion(job.resultVersionId);
      if (version && job.metrics) {
        response.result = {
          versionId: job.resultVersionId,
          events: [], // Load from version data
          metrics: job.metrics,
          warnings: [],
          appliedConstraints: []
        };
      }
    }

    if (job.error) {
      response.error = job.error;
    }

    return response;
  }

  /**
   * Cancel a running job
   */
  async cancelJob(runId: string): Promise<boolean> {
    const job = await this.jobStore.getJob(runId);
    if (!job) return false;

    const stateMachine = this.activeJobs.get(runId);
    if (!stateMachine) return false;

    if (stateMachine.canTransitionTo('cancelled')) {
      stateMachine.transition('cancelled');
      await this.jobStore.updateJob(runId, {
        status: 'cancelled',
        completedAt: new Date().toISOString(),
        error: {
          code: OPTIMIZATION_ERROR_CODES.CANCELLED_BY_USER,
          message: 'Job cancelled by user',
          recoverable: false
        }
      });

      this.emit('job:cancelled', runId);
      return true;
    }

    return false;
  }

  /**
   * Apply optimization results to schedule
   */
  async applyResults(scheduleId: string, versionId: string): Promise<string> {
    const version = await this.jobStore.getScheduleVersion(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    // Create new version with applied results
    const newVersionId = await this.jobStore.createScheduleVersion(
      version.data,
      'optimization'
    );

    this.emit('results:applied', {
      scheduleId,
      oldVersionId: versionId,
      newVersionId
    });

    return newVersionId;
  }

  /**
   * Process job asynchronously
   */
  private async processJobAsync(jobId: string, request: OptimizationRequestDTO): Promise<void> {
    const stateMachine = this.activeJobs.get(jobId)!;
    
    try {
      // Transition to running
      stateMachine.transition('running');
      await this.jobStore.updateJob(jobId, {
        status: 'running',
        startedAt: new Date().toISOString(),
        progressPercentage: 10
      });
      
      this.emit('job:started', jobId);
      this.emitProgress(jobId, 10, 'Loading schedule data');

      // Simulate optimization steps
      await this.simulateOptimization(jobId, request);

      // Create schedule version in the actual database
      const versionService = ScheduleVersionService.getInstance();
      const scheduleId = parseInt(request.scheduleData.metadata?.plantId || '1', 10);
      const userId = parseInt(request.scheduleData.metadata?.userId || '1', 10);
      
      let versionId: number;
      try {
        // Create the version in the database
        versionId = await versionService.createVersion(
          scheduleId,
          userId,
          'optimization',
          `Optimization requested: ${request.algorithmId || 'default'}`,
          undefined // no tag
        );
        
        // Create version ID for the in-memory store
        const resultVersionId = `v_${versionId}`;
        
        // Update in-memory version store
        await this.jobStore.createScheduleVersion(
          request.scheduleData,
          'optimization'
        );

        // Transition to completed
        stateMachine.transition('completed');
        
        // Update job with completion
        await this.jobStore.updateJob(jobId, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          progressPercentage: 100,
          resultVersionId,
          metrics: {
            makespan: 120,
            resourceUtilization: 85,
            totalSetupTime: 10,
            totalChangeovers: 5,
            constraintViolations: 0,
            improvementPercentage: 15,
            objectiveValue: 0.85,
            computationTime: 5.2
          }
        });

        // Emit completion events
        this.emit('job:completed', jobId);
        this.emitProgress(jobId, 100, 'Optimization complete');
        
      } catch (versionError) {
        console.error('Failed to create schedule version:', versionError);
        throw new Error('Failed to save optimization results');
      }

    } catch (error) {
      console.error('Optimization job failed:', error);
      stateMachine.transition('failed');
      await this.jobStore.updateJob(jobId, {
        status: 'failed',
        completedAt: new Date().toISOString(),
        error: this.handleError(error)
      });

      this.emit('job:failed', { jobId, error });
    } finally {
      // Clean up after some time
      setTimeout(() => {
        this.activeJobs.delete(jobId);
      }, 3600000); // 1 hour
    }
  }

  /**
   * Simulate optimization process (replace with actual optimizer)
   */
  private async simulateOptimization(jobId: string, request: OptimizationRequestDTO): Promise<void> {
    const steps = [
      { progress: 20, step: 'Analyzing constraints', delay: 500 },
      { progress: 30, step: 'Building optimization model', delay: 700 },
      { progress: 50, step: 'Running solver', delay: 1500 },
      { progress: 70, step: 'Validating solution', delay: 800 },
      { progress: 90, step: 'Generating schedule', delay: 600 },
      { progress: 95, step: 'Finalizing optimization', delay: 400 }
    ];

    for (const { progress, step, delay } of steps) {
      await new Promise(resolve => setTimeout(resolve, delay));
      await this.jobStore.updateJob(jobId, { progressPercentage: progress });
      this.emitProgress(jobId, progress, step);
    }
  }

  /**
   * Emit progress event
   */
  private emitProgress(jobId: string, percentage: number, step: string): void {
    this.emit('job:progress', {
      runId: jobId,
      type: 'progress',
      data: {
        percentage,
        currentStep: step
      }
    });
  }

  /**
   * Get step description based on status
   */
  private getStepDescription(status: OptimizationStatus): string {
    const descriptions: Record<OptimizationStatus, string> = {
      'queued': 'Job queued for processing',
      'running': 'Optimization in progress',
      'completed': 'Optimization complete',
      'failed': 'Optimization failed',
      'cancelled': 'Job cancelled'
    };
    return descriptions[status];
  }

  /**
   * Create error object
   */
  private createError(code: string, message: string): OptimizationError {
    return {
      code,
      message,
      recoverable: false
    };
  }

  /**
   * Handle errors
   */
  private handleError(error: any): OptimizationError {
    if (error.code && error.message) {
      return error;
    }
    return {
      code: OPTIMIZATION_ERROR_CODES.INVALID_SCHEDULE,
      message: error.message || 'Unknown error occurred',
      details: error.stack,
      recoverable: false
    };
  }
}

// Export singleton instance
export const optimizationJobService = new OptimizationJobService();