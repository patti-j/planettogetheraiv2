/**
 * Zod Validation Schemas for Optimization Endpoints
 */

import { z } from 'zod';

// Resource schema
const ResourceSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  type: z.string().default('default'),
  capacity: z.number().positive().default(1)
});

// Event schema
const EventSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  resourceId: z.string().min(1).max(100),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  duration: z.number().nonnegative().default(0),
  manuallyScheduled: z.boolean().default(false),
  locked: z.boolean().default(false),
  priority: z.number().int().min(0).max(10).default(0)
});

// Dependency schema
const DependencySchema = z.object({
  id: z.string().min(1).max(100),
  fromEvent: z.string().min(1).max(100),
  toEvent: z.string().min(1).max(100),
  type: z.number().int().min(0).max(3).default(2),
  lag: z.number().default(0),
  lagUnit: z.enum(['minute', 'hour', 'day', 'week']).default('hour')
});

// Constraint schema
const ConstraintSchema = z.object({
  type: z.enum(['resource_capacity', 'time_window', 'precedence', 'setup_time']),
  parameters: z.record(z.any())
});

// Schedule snapshot schema
const ScheduleSnapshotSchema = z.object({
  resources: z.array(ResourceSchema).max(1000),
  events: z.array(EventSchema).max(10000),
  dependencies: z.array(DependencySchema).max(20000),
  constraints: z.array(ConstraintSchema).max(100).optional()
});

// Schedule metadata schema
const ScheduleMetadataSchema = z.object({
  plantId: z.string().min(1).max(100),
  timestamp: z.string().datetime(),
  userId: z.string().min(1).max(100),
  description: z.string().max(500).optional()
});

// Schedule data payload schema
export const scheduleDataPayloadSchema = z.object({
  version: z.string().regex(/^v_[\w-]+$/).optional(),
  snapshot: ScheduleSnapshotSchema,
  metadata: ScheduleMetadataSchema
});

// Lock set schema
const LockSetSchema = z.object({
  events: z.array(z.string()).max(10000).default([]),
  resourceIntervals: z.array(z.object({
    resourceId: z.string(),
    start: z.string().datetime(),
    end: z.string().datetime()
  })).max(1000).default([])
});

// Optimization options schema
const OptimizationOptionsSchema = z.object({
  objective: z.enum([
    'minimize_makespan',
    'maximize_utilization', 
    'minimize_setup_time',
    'minimize_tardiness',
    'balanced_objectives'
  ]).default('minimize_makespan'),
  timeLimit: z.number().positive().max(300).default(30), // Max 5 minutes
  incrementalMode: z.boolean().default(false),
  warmStart: z.boolean().default(false),
  constraints: z.record(z.any()).optional()
});

// Main optimization request schema
export const optimizationRunRequestSchema = z.object({
  scheduleData: scheduleDataPayloadSchema,
  algorithmId: z.number().int().positive().max(100),
  profileId: z.string().max(100).optional(),
  options: OptimizationOptionsSchema.default({}),
  locks: LockSetSchema.default({
    events: [],
    resourceIntervals: []
  })
});

// Body size validation (to be used as middleware)
export const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB

// Validation helper
export function validateOptimizationRequest(data: unknown) {
  return optimizationRunRequestSchema.parse(data);
}

// Sanitization helper
export function sanitizeScheduleData(data: any): any {
  // Remove any potential XSS or injection vectors
  const sanitized = JSON.parse(JSON.stringify(data));
  
  // Recursively sanitize strings
  function sanitizeStrings(obj: any): any {
    if (typeof obj === 'string') {
      // Remove script tags and dangerous characters
      return obj.replace(/<script[^>]*>.*?<\/script>/gi, '')
                .replace(/[<>]/g, '')
                .trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeStrings);
    }
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        result[key] = sanitizeStrings(obj[key]);
      }
      return result;
    }
    return obj;
  }
  
  return sanitizeStrings(sanitized);
}