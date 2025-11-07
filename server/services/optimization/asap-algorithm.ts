import type { ScheduleDataPayload } from '../../../shared/schema';

/**
 * ASAP (As Soon As Possible) Scheduling Algorithm
 * 
 * Schedules operations as early as possible while respecting:
 * - Operation sequence within jobs (operations must follow sequence_number order)
 * - Resource capacity constraints (no overlapping operations on the same resource)
 * - Operation durations
 */
export class ASAPAlgorithm {
  /**
   * Execute ASAP scheduling algorithm
   * Schedules operations in sequence order, ensuring predecessors complete before successors start
   */
  execute(scheduleData: ScheduleDataPayload): ScheduleDataPayload {
    console.log('[ASAP] Starting ASAP scheduling algorithm');
    console.log(`[ASAP] Processing ${scheduleData.operations.length} operations, ${scheduleData.resources.length} resources`);
    
    const { operations, resources } = scheduleData;
    
    // Group operations by job
    const jobOperations = new Map<string, any[]>();
    operations.forEach(op => {
      const jobId = op.jobId || op.job_id;
      if (!jobOperations.has(jobId)) {
        jobOperations.set(jobId, []);
      }
      jobOperations.get(jobId)!.push(op);
    });
    
    // Sort operations within each job by sequence number
    jobOperations.forEach((ops, jobId) => {
      ops.sort((a, b) => {
        const seqA = a.sequenceNumber || a.sequence_number || 0;
        const seqB = b.sequenceNumber || b.sequence_number || 0;
        return seqA - seqB;
      });
      console.log(`[ASAP] Job ${jobId}: ${ops.length} operations in sequence`);
    });
    
    // Track resource availability (end time of last operation on each resource)
    const resourceAvailability = new Map<string, Date>();
    resources.forEach(r => {
      resourceAvailability.set(r.id, new Date());
    });
    
    // Schedule operations for each job in sequence
    const scheduledOperations: any[] = [];
    
    jobOperations.forEach((ops, jobId) => {
      let previousEndTime: Date | null = null;
      
      ops.forEach((op, index) => {
        const resourceId = op.resourceId || op.resource_id || op.defaultResourceId;
        const duration = op.duration || 60; // Default 60 minutes if not specified
        
        // Get the earliest possible start time:
        // 1. After the previous operation in the job completes (if exists)
        // 2. After the resource becomes available
        const earliestJobTime = previousEndTime || new Date();
        const resourceAvailable = resourceAvailability.get(resourceId) || new Date();
        const startTime = new Date(Math.max(earliestJobTime.getTime(), resourceAvailable.getTime()));
        
        // Calculate end time based on duration
        const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
        
        // Update resource availability
        resourceAvailability.set(resourceId, endTime);
        
        // Store the scheduled times
        const scheduledOp = {
          ...op,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          scheduled_start: startTime.toISOString(),
          scheduled_end: endTime.toISOString()
        };
        
        scheduledOperations.push(scheduledOp);
        previousEndTime = endTime;
        
        const seqNum = op.sequenceNumber || op.sequence_number || index + 1;
        console.log(`[ASAP] Scheduled ${op.name} (seq ${seqNum}): ${startTime.toISOString().slice(0, 16)} - ${endTime.toISOString().slice(0, 16)}`);
      });
    });
    
    console.log(`[ASAP] Scheduling complete. All operations scheduled in proper sequence.`);
    
    return {
      ...scheduleData,
      operations: scheduledOperations
    };
  }
}