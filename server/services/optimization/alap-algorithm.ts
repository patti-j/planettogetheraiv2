import type { ScheduleDataPayload } from '../../../shared/schema';

/**
 * ALAP (As Late As Possible) Scheduling Algorithm
 * 
 * Schedules operations as late as possible while still meeting due dates:
 * - Operations are scheduled backward from their due dates
 * - Respects operation sequence within jobs (operations must follow sequence_number order)
 * - Resource capacity constraints (no overlapping operations on the same resource)
 * - Minimizes work-in-progress inventory
 */
export class ALAPAlgorithm {
  /**
   * Execute ALAP scheduling algorithm
   * Schedules operations backward from due dates, ensuring operations complete just in time
   */
  execute(scheduleData: ScheduleDataPayload): ScheduleDataPayload {
    console.log('[ALAP] Starting ALAP scheduling algorithm');
    console.log(`[ALAP] Processing ${scheduleData.operations.length} operations, ${scheduleData.resources.length} resources`);
    
    const { operations, resources, jobs = [] } = scheduleData;
    
    // Create a map of job due dates
    const jobDueDates = new Map<string, Date>();
    jobs.forEach((job: any) => {
      if (job.needDateTime || job.dueDate || job.need_date_time) {
        const dueDate = new Date(job.needDateTime || job.dueDate || job.need_date_time);
        jobDueDates.set(job.id, dueDate);
      }
    });
    
    // Group operations by job
    const jobOperations = new Map<string, any[]>();
    operations.forEach(op => {
      const jobId = op.jobId || op.job_id;
      if (!jobOperations.has(jobId)) {
        jobOperations.set(jobId, []);
      }
      jobOperations.get(jobId)!.push(op);
    });
    
    // Sort operations within each job by sequence number (reverse for backward scheduling)
    jobOperations.forEach((ops, jobId) => {
      ops.sort((a, b) => {
        const seqA = a.sequenceNumber || a.sequence_number || 0;
        const seqB = b.sequenceNumber || b.sequence_number || 0;
        return seqB - seqA; // Reverse order for backward scheduling
      });
      console.log(`[ALAP] Job ${jobId}: ${ops.length} operations in reverse sequence`);
    });
    
    // Track resource availability (start time of earliest scheduled operation on each resource)
    const resourceAvailability = new Map<string, Date>();
    
    // Set default due date to 7 days from now if not specified
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 7);
    
    // Schedule operations for each job backward from due date
    const scheduledOperations: any[] = [];
    
    jobOperations.forEach((ops, jobId) => {
      const dueDate = jobDueDates.get(jobId) || defaultDueDate;
      let nextStartTime = dueDate;
      
      // Process operations in reverse order (last operation first)
      ops.forEach((op, index) => {
        const resourceId = op.resourceId || op.resource_id || op.defaultResourceId;
        const duration = op.duration || 60; // Default 60 minutes if not specified
        
        // Calculate the latest possible end time
        const latestEndTime = nextStartTime;
        
        // Calculate start time based on duration
        const startTime = new Date(latestEndTime.getTime() - duration * 60 * 1000);
        
        // Check if resource is already scheduled after this time
        const resourceScheduled = resourceAvailability.get(resourceId);
        let adjustedStartTime = startTime;
        let adjustedEndTime = latestEndTime;
        
        if (resourceScheduled && resourceScheduled < latestEndTime) {
          // Resource has conflict, need to schedule earlier
          adjustedEndTime = resourceScheduled;
          adjustedStartTime = new Date(adjustedEndTime.getTime() - duration * 60 * 1000);
        }
        
        // Update resource availability (earliest time this resource is occupied)
        resourceAvailability.set(resourceId, adjustedStartTime);
        
        // Store the scheduled times
        const scheduledOp = {
          ...op,
          startTime: adjustedStartTime.toISOString(),
          endTime: adjustedEndTime.toISOString(),
          scheduled_start: adjustedStartTime.toISOString(),
          scheduled_end: adjustedEndTime.toISOString()
        };
        
        scheduledOperations.unshift(scheduledOp); // Add to beginning since we're processing in reverse
        nextStartTime = adjustedStartTime; // Next operation must end before this one starts
        
        const seqNum = op.sequenceNumber || op.sequence_number || ops.length - index;
        console.log(`[ALAP] Scheduled ${op.name} (seq ${seqNum}): ${adjustedStartTime.toISOString().slice(0, 16)} - ${adjustedEndTime.toISOString().slice(0, 16)}`);
      });
    });
    
    console.log(`[ALAP] Scheduling complete. Operations scheduled just-in-time for due dates.`);
    
    return {
      ...scheduleData,
      operations: scheduledOperations
    };
  }
}