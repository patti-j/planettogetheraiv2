/**
 * Data Transfer Objects (DTOs) for Bryntum Scheduler Pro + Optimization Studio Integration
 * These types define the contract between the visualization layer (Bryntum) and computation layer (Optimizer)
 */

// ============== Schedule Data Export (Client → Server) ==============

export interface ScheduleDataDTO {
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

export interface ResourceDTO {
  id: string;
  name: string;
  type: string;
  calendar?: string;
  capacity?: number;
  attributes?: Record<string, any>;
}

export interface EventDTO {
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

export interface DependencyDTO {
  id: string;
  fromEvent: string;
  toEvent: string;
  type: number;               // 0: Start-to-Start, 1: Start-to-Finish, 2: Finish-to-Start, 3: Finish-to-Finish
  lag?: number;
  lagUnit?: string;
}

export interface ConstraintDTO {
  id: string;
  type: 'muststarton' | 'mustfinishon' | 'startnoearlierthan' | 'startnolaterthan' | 'finishnoearlierthan' | 'finishnolaterthan';
  date: string;
  eventId: string;
}

// ============== Optimization Request ==============

export interface OptimizationRequestDTO {
  scheduleData: ScheduleDataDTO;
  algorithmId: number;
  profileId?: number;
  options: OptimizationOptions;
  locks: OptimizationLocks;
}

export interface OptimizationOptions {
  objective: OptimizationObjective;
  timeLimit?: number;        // seconds
  incrementalMode?: boolean;
  warmStart?: boolean;
  solverSettings?: Record<string, any>;
}

export type OptimizationObjective = 
  | 'minimize_makespan' 
  | 'maximize_throughput' 
  | 'minimize_cost' 
  | 'balance_resources'
  | 'minimize_setup_time'
  | 'minimize_changeovers';

export interface OptimizationLocks {
  events: string[];           // Event IDs that must not be moved
  resourceIntervals: ResourceIntervalLock[];
}

export interface ResourceIntervalLock {
  resourceId: string;
  start: string;              // ISO 8601
  end: string;                // ISO 8601
  reason?: string;
}

// ============== Optimization Response ==============

export interface OptimizationResponseDTO {
  runId: string;
  status: OptimizationStatus;
  progress?: OptimizationProgress;
  result?: OptimizationResult;
  error?: OptimizationError;
}

export type OptimizationStatus = 
  | 'queued' 
  | 'running' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface OptimizationProgress {
  percentage: number;
  currentStep?: string;
  estimatedTimeRemaining?: number; // seconds
  iterationCount?: number;
  bestObjectiveValue?: number;
}

export interface OptimizationResult {
  versionId: string;
  events: OptimizedEventDTO[];
  metrics: OptimizationMetrics;
  warnings?: string[];
  appliedConstraints: string[];
  relaxedConstraints?: string[];
}

export interface OptimizedEventDTO {
  id: string;
  resourceId: string;
  startDate: string;          // ISO 8601
  endDate: string;            // ISO 8601
  changed: boolean;
  changeReason?: string;
}

export interface OptimizationMetrics {
  makespan: number;           // Total schedule duration in hours
  resourceUtilization: number; // Percentage 0-100
  totalSetupTime?: number;    // Hours
  totalChangeovers?: number;  // Count
  constraintViolations: number;
  improvementPercentage: number;
  objectiveValue: number;
  computationTime: number;    // Seconds
}

export interface OptimizationError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
}

// ============== Job Management ==============

export interface OptimizationJob {
  id: string;
  scheduleId: string;
  algorithmId: number;
  profileId?: number;
  status: OptimizationStatus;
  startedAt?: string;
  completedAt?: string;
  progressPercentage: number;
  inputHash: string;
  lockSet: OptimizationLocks;
  baseVersionId: string;
  resultVersionId?: string;
  metrics?: OptimizationMetrics;
  error?: OptimizationError;
}

// ============== Schedule Versioning ==============

export interface ScheduleVersion {
  id: string;
  scheduleId: string;
  parentVersionId?: string;
  data: ScheduleDataDTO;
  diffFromParent?: ScheduleDiff;
  createdAt: string;
  createdBy: string;
  source: 'manual' | 'optimization' | 'import';
  metrics?: OptimizationMetrics;
  description?: string;
}

export interface ScheduleDiff {
  addedEvents: string[];
  removedEvents: string[];
  modifiedEvents: Array<{
    id: string;
    changes: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
  }>;
}

// ============== Error Codes ==============

export const OPTIMIZATION_ERROR_CODES = {
  INVALID_SCHEDULE: 'E001',
  SOLVER_TIMEOUT: 'E002',
  INFEASIBLE_PROBLEM: 'E003',
  VERSION_CONFLICT: 'E004',
  RESOURCE_LOCKED: 'E005',
  ALGORITHM_NOT_FOUND: 'E006',
  INSUFFICIENT_DATA: 'E007',
  CONSTRAINT_VIOLATION: 'E008',
  MEMORY_LIMIT_EXCEEDED: 'E009',
  CANCELLED_BY_USER: 'E010',
} as const;

// ============== Utility Types ==============

export type OptimizationErrorCode = typeof OPTIMIZATION_ERROR_CODES[keyof typeof OPTIMIZATION_ERROR_CODES];

export interface OptimizationConfig {
  maxJobsPerUser: number;
  defaultTimeLimit: number;
  maxProblemSize: number;
  enableIncrementalMode: boolean;
  enableParallelProcessing: boolean;
}

// ============== WebSocket/SSE Event Types ==============

export interface OptimizationProgressEvent {
  type: 'progress';
  runId: string;
  data: OptimizationProgress;
}

export interface OptimizationCompleteEvent {
  type: 'complete';
  runId: string;
  data: OptimizationResult;
}

export interface OptimizationErrorEvent {
  type: 'error';
  runId: string;
  data: OptimizationError;
}

export type OptimizationEvent = 
  | OptimizationProgressEvent 
  | OptimizationCompleteEvent 
  | OptimizationErrorEvent;