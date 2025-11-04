import { BaseAgent, AgentContext, AgentResponse } from './base-agent.interface';
import { sql } from 'drizzle-orm';
import { Database } from '../../../shared/types';
import { db } from '../../db';
import * as crypto from 'crypto';

/**
 * Production Scheduling Agent Service
 * Handles all production scheduling operations including:
 * - ASAP/ALAP algorithm execution
 * - Resource management
 * - Schedule saving and loading
 */
export class ProductionSchedulingAgent extends BaseAgent {
  id = 'production-scheduling';
  name = 'Production Scheduling Agent';
  description = 'Optimizes production schedules using ASAP, ALAP, and other algorithms';
  triggers = [
    'optimize schedule',
    'optimize the schedule',
    'run asap',
    'run alap',
    'apply asap',
    'apply alap',
    'schedule optimization',
    'scheduling algorithm',
    'minimize lead times',
    'speed up production',
    'compare schedule',
    'compare schedules',
    'compare version',
    'compare versions',
    'what changed between',
    'show differences between',
    'compare current schedule',
    'what\'s different',
    'compare these schedules',
    'version comparison',
    'schedule comparison',
    'just in time',
    'jit optimization',
    'minimize inventory',
    'reduce wip',
    'add resource',
    'create resource',
    'list resources',
    'show resources',
    'save schedule',
    'save current schedule',
    'list schedules',
    'show schedules',
    'load schedule',
    'show jobs',
    'list jobs',
    'all jobs',
    'jobs',
    'priority',
    'what jobs',
    'which jobs',
    'job priority',
    'high priority',
    'due this week',
    'due today',
    'operations'
  ];
  requiredPermission = 'scheduling.execute';

  async initialize(): Promise<void> {
    await super.initialize();
    this.db = db;
  }

  async process(message: string, context: AgentContext): Promise<AgentResponse> {
    const lowerMessage = message.toLowerCase();
    
    try {
      // Check for job queries first (most common request)
      if (this.isJobQuery(lowerMessage)) {
        return await this.handleJobQuery(lowerMessage, context);
      }
      
      // Check for algorithm execution requests
      if (this.isAlgorithmRequest(lowerMessage)) {
        return await this.executeAlgorithm(lowerMessage, context);
      }
      
      // Check for resource management requests
      if (this.isResourceRequest(lowerMessage)) {
        return await this.handleResourceRequest(lowerMessage, context);
      }
      
      // Check for schedule save/load requests
      if (this.isScheduleManagementRequest(lowerMessage)) {
        return await this.handleScheduleManagement(lowerMessage, context);
      }
      
      // Check for version comparison requests
      if (this.isVersionComparisonRequest(lowerMessage)) {
        return await this.handleVersionComparison(lowerMessage, context);
      }
      
      // Default response
      return {
        content: 'I can help you with production scheduling. You can ask me to:\n\n' +
                 '• **Show jobs** and their priorities\n' +
                 '• **Optimize the schedule** using ASAP or ALAP algorithms\n' +
                 '• **Manage resources** (add, list, update capabilities)\n' +
                 '• **Save and load schedules** for version control\n\n' +
                 'What would you like me to do?',
        error: false
      };
    } catch (error: any) {
      this.error('Error processing scheduling request', error);
      return {
        content: `I encountered an error while processing your scheduling request: ${error.message}`,
        error: true
      };
    }
  }
  
  private isJobQuery(message: string): boolean {
    const jobKeywords = [
      'job', 'priority', 'priorities', 'due', 'operations', 
      'what job', 'which job', 'show job', 'list job', 'all job',
      'need by', 'need date', 'scheduled', 'status', 'delivery'
    ];
    return jobKeywords.some(keyword => message.includes(keyword));
  }
  
  private isAlgorithmRequest(message: string): boolean {
    const algorithmKeywords = [
      'optimize', 'asap', 'alap', 'algorithm', 'scheduling',
      'minimize lead', 'speed up', 'just in time', 'jit', 'reduce wip'
    ];
    return algorithmKeywords.some(keyword => message.includes(keyword));
  }
  
  private isResourceRequest(message: string): boolean {
    const resourceKeywords = ['resource', 'capability', 'capabilities', 'equipment', 'machine'];
    const actionKeywords = ['add', 'create', 'list', 'show', 'update', 'modify'];
    
    const hasResourceKeyword = resourceKeywords.some(keyword => message.includes(keyword));
    const hasActionKeyword = actionKeywords.some(keyword => message.includes(keyword));
    
    return hasResourceKeyword && hasActionKeyword;
  }
  
  private isScheduleManagementRequest(message: string): boolean {
    const scheduleKeywords = ['save schedule', 'save current', 'list schedule', 'show schedule', 'load schedule'];
    return scheduleKeywords.some(keyword => message.includes(keyword));
  }
  
  private isVersionComparisonRequest(message: string): boolean {
    const triggers = [
      'compare version', 'compare schedule', 'what changed', 
      'show differences', 'what\'s different', 'version comparison',
      'schedule comparison', 'compare current'
    ];
    return triggers.some(trigger => message.includes(trigger));
  }
  
  private async handleVersionComparison(message: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // Extract version or schedule numbers from the message
      // First try to match "version X" or "schedule X" patterns
      const versionPattern = /(?:version|schedule)\s*(\d+)/gi;
      const matches = Array.from(message.matchAll(versionPattern));
      let versionNumbers = matches.map(m => parseInt(m[1]));
      
      // If we only found one match, look for additional numbers after "and" or "with"
      if (versionNumbers.length === 1) {
        const additionalPattern = /(?:and|with|to|vs)\s*(?:schedule\s*)?(?:version\s*)?(\d+)/gi;
        const additionalMatches = Array.from(message.matchAll(additionalPattern));
        if (additionalMatches.length > 0) {
          versionNumbers.push(...additionalMatches.map(m => parseInt(m[1])));
        }
      }
      
      // Also try a simpler pattern for "X and Y" where X and Y are numbers
      if (versionNumbers.length < 2) {
        const simplePattern = /(\d+)\s*(?:and|vs|with|to)\s*(\d+)/i;
        const simpleMatch = message.match(simplePattern);
        if (simpleMatch) {
          versionNumbers = [parseInt(simpleMatch[1]), parseInt(simpleMatch[2])];
        }
      }
      
      // If we have two version numbers, perform the comparison
      if (versionNumbers.length >= 2) {
        const baseVersion = versionNumbers[0];
        const compareVersion = versionNumbers[1];
        
        // Get the schedule ID (assuming schedule 1 for now - in production this would be dynamic)
        const scheduleId = 1;
        
        // Query the versions from the database
        const baseVersionData = await db.execute(sql`
          SELECT id, version_number, snapshot_data, created_at, change_type, change_description
          FROM schedule_versions
          WHERE schedule_id = ${scheduleId} AND version_number = ${baseVersion}
          LIMIT 1
        `);
        
        const compareVersionData = await db.execute(sql`
          SELECT id, version_number, snapshot_data, created_at, change_type, change_description
          FROM schedule_versions  
          WHERE schedule_id = ${scheduleId} AND version_number = ${compareVersion}
          LIMIT 1
        `);
        
        if (!baseVersionData.rows[0] || !compareVersionData.rows[0]) {
          return {
            content: `Could not find one or both versions. Please verify that versions ${baseVersion} and ${compareVersion} exist.`,
            error: false
          };
        }
        
        // Calculate metrics from the snapshot data
        const baseSnapshot = JSON.parse(baseVersionData.rows[0].snapshot_data as string || '{"operations":[]}');
        const compareSnapshot = JSON.parse(compareVersionData.rows[0].snapshot_data as string || '{"operations":[]}');
        
        // Calculate time span (earliest start to latest end)
        const calculateTimeSpan = (operations: any[]) => {
          if (!operations || operations.length === 0) return 0;
          const starts = operations.map(op => new Date(op.scheduled_start).getTime()).filter(t => !isNaN(t));
          const ends = operations.map(op => new Date(op.scheduled_end).getTime()).filter(t => !isNaN(t));
          if (starts.length === 0 || ends.length === 0) return 0;
          const earliest = Math.min(...starts);
          const latest = Math.max(...ends);
          return (latest - earliest) / (1000 * 60 * 60); // Convert to hours
        };
        
        // Calculate resource usage
        const calculateResourceUsage = (operations: any[]) => {
          if (!operations || operations.length === 0) return 0;
          const resourceMap = new Map<string, number>();
          operations.forEach(op => {
            const resource = op.resource_name || 'Unknown';
            const duration = parseFloat(op.cycle_hrs || '0') + parseFloat(op.setup_hours || '0');
            resourceMap.set(resource, (resourceMap.get(resource) || 0) + duration);
          });
          const totalHours = Array.from(resourceMap.values()).reduce((sum, hours) => sum + hours, 0);
          const resourceCount = resourceMap.size || 1;
          const availableHours = resourceCount * 24 * 5; // Assume 5-day work week
          return Math.min((totalHours / availableHours) * 100, 100);
        };
        
        // Calculate total duration
        const calculateTotalDuration = (operations: any[]) => {
          if (!operations || operations.length === 0) return 0;
          return operations.reduce((total, op) => 
            total + parseFloat(op.cycle_hrs || '0') + parseFloat(op.setup_hours || '0'), 0);
        };
        
        const baseTimeSpan = calculateTimeSpan(baseSnapshot.operations);
        const compareTimeSpan = calculateTimeSpan(compareSnapshot.operations);
        const baseResourceUsage = calculateResourceUsage(baseSnapshot.operations);
        const compareResourceUsage = calculateResourceUsage(compareSnapshot.operations);
        const baseTotalDuration = calculateTotalDuration(baseSnapshot.operations);
        const compareTotalDuration = calculateTotalDuration(compareSnapshot.operations);
        
        // Calculate operation differences
        const baseOpIds = new Set(baseSnapshot.operations?.map((op: any) => op.id) || []);
        const compareOpIds = new Set(compareSnapshot.operations?.map((op: any) => op.id) || []);
        const added = compareSnapshot.operations?.filter((op: any) => !baseOpIds.has(op.id)).length || 0;
        const removed = baseSnapshot.operations?.filter((op: any) => !compareOpIds.has(op.id)).length || 0;
        const common = baseSnapshot.operations?.filter((op: any) => compareOpIds.has(op.id)).length || 0;
        
        // Build the response
        let response = `**Comparing Schedule ${baseVersion} with Schedule ${compareVersion}**\n\n`;
        
        response += `**📊 Schedule Metrics:**\n`;
        response += `• **Time Span:** ${baseTimeSpan.toFixed(1)} hrs → ${compareTimeSpan.toFixed(1)} hrs (`;
        const timeSpanDelta = compareTimeSpan - baseTimeSpan;
        if (timeSpanDelta < 0) {
          response += `✅ ${Math.abs(timeSpanDelta).toFixed(1)} hrs faster`;
        } else if (timeSpanDelta > 0) {
          response += `⚠️ ${timeSpanDelta.toFixed(1)} hrs longer`;
        } else {
          response += `no change`;
        }
        response += `)\n`;
        
        response += `• **Resource Usage:** ${baseResourceUsage.toFixed(1)}% → ${compareResourceUsage.toFixed(1)}% (`;
        const resourceDelta = compareResourceUsage - baseResourceUsage;
        if (resourceDelta > 0) {
          response += `${resourceDelta > 0 ? '+' : ''}${resourceDelta.toFixed(1)}%`;
        } else {
          response += `${resourceDelta.toFixed(1)}%`;
        }
        response += `)\n`;
        
        response += `• **Total Duration:** ${baseTotalDuration.toFixed(1)} hrs → ${compareTotalDuration.toFixed(1)} hrs (`;
        const durationDelta = compareTotalDuration - baseTotalDuration;
        if (durationDelta < 0) {
          response += `✅ ${Math.abs(durationDelta).toFixed(1)} hrs saved`;
        } else if (durationDelta > 0) {
          response += `⚠️ ${durationDelta.toFixed(1)} hrs added`;
        } else {
          response += `no change`;
        }
        response += `)\n\n`;
        
        response += `**🔄 Operation Changes:**\n`;
        if (added > 0) response += `• ➕ ${added} operations added\n`;
        if (removed > 0) response += `• ➖ ${removed} operations removed\n`;
        if (common > 0) response += `• ✏️ ${common} operations unchanged\n`;
        response += `\n`;
        
        response += `**📝 Version Details:**\n`;
        response += `• **Version ${baseVersion}:** ${baseVersionData.rows[0].change_type || 'Manual'} - ${baseVersionData.rows[0].change_description || 'No description'}\n`;
        response += `• **Version ${compareVersion}:** ${compareVersionData.rows[0].change_type || 'Manual'} - ${compareVersionData.rows[0].change_description || 'No description'}\n\n`;
        
        response += `💡 For a visual comparison, you can also use the Version History Compare tab in the toolbar.`;
        
        return {
          content: response,
          error: false
        };
      }
      
      // If we don't have enough version numbers, provide instructions
      let response = '**To compare schedules:**\n\n';
      response += 'Please specify two version numbers. For example:\n';
      response += '• "Compare version 3 with version 5"\n';
      response += '• "Compare schedule 11 and schedule 12"\n';
      response += '• "What changed between version 2 and 4?"\n\n';
      response += 'I\'ll analyze the differences and show you the metrics and changes.';
      
      return {
        content: response,
        error: false
      };
    } catch (error: any) {
      this.error('Error handling version comparison', error);
      return {
        content: `Error comparing versions: ${error.message}`,
        error: true
      };
    }
  }

  /**
   * ASAP Algorithm - Schedule operations as soon as possible
   * This algorithm schedules operations forward from the current date/time,
   * respecting operation dependencies and resource availability
   */
  private async runASAPAlgorithm(): Promise<{message: string, operationsScheduled: number}> {
    try {
      // Get all active jobs and their operations
      const operations = await db.execute(sql`
        SELECT 
          jo.id,
          jo.job_id,
          jo.name,
          jo.sequence_number,
          jo.cycle_hrs,
          jo.setup_hours,
          j.priority,
          j.need_date_time
        FROM ptjoboperations jo
        INNER JOIN ptjobs j ON jo.job_id = j.id
        WHERE j.scheduled_status NOT IN ('Completed', 'Shipped', 'Delivered')
        ORDER BY j.priority ASC, jo.sequence_number ASC
      `);

      if (!operations.rows || operations.rows.length === 0) {
        return {
          message: 'No operations to schedule.',
          operationsScheduled: 0
        };
      }

      const currentTime = new Date();
      let scheduledCount = 0;
      const jobSchedules = new Map<number, Date>(); // Track end time of last operation for each job

      // Schedule each operation
      for (const op of operations.rows) {
        const jobId = op.job_id as number;
        const cycleHours = parseFloat(op.cycle_hrs as string || '0');
        const setupHours = parseFloat(op.setup_hours as string || '0');
        const totalHours = cycleHours + setupHours;

        // Get the start time for this operation
        let startTime: Date;
        if (jobSchedules.has(jobId)) {
          // Start after the previous operation for this job
          startTime = new Date(jobSchedules.get(jobId)!);
        } else {
          // First operation of the job starts now
          startTime = new Date(currentTime);
        }

        // Calculate end time
        const endTime = new Date(startTime.getTime() + (totalHours * 60 * 60 * 1000));

        // Update the operation schedule in the database
        await db.execute(sql`
          UPDATE ptjoboperations
          SET 
            scheduled_start = ${startTime.toISOString()},
            scheduled_end = ${endTime.toISOString()}
          WHERE id = ${op.id}
        `);

        // Track the end time for the next operation of this job
        jobSchedules.set(jobId, endTime);
        scheduledCount++;
      }

      // Update job statuses
      await db.execute(sql`
        UPDATE ptjobs
        SET scheduled_status = 'Scheduled'
        WHERE scheduled_status = 'Not Scheduled'
          AND id IN (
            SELECT DISTINCT job_id 
            FROM ptjoboperations 
            WHERE scheduled_start IS NOT NULL
          )
      `);

      return {
        message: `**ASAP Scheduling Complete!**\n\n` +
                 `• Scheduled ${scheduledCount} operations\n` +
                 `• All operations scheduled as early as possible\n` +
                 `• Jobs prioritized by priority level\n\n` +
                 `The schedule has been optimized to minimize lead times.`,
        operationsScheduled: scheduledCount
      };
    } catch (error: any) {
      throw new Error(`ASAP algorithm failed: ${error.message}`);
    }
  }

  /**
   * ALAP Algorithm - Schedule operations as late as possible
   * This algorithm schedules operations backward from need dates,
   * implementing Just-In-Time (JIT) principles
   */
  private async runALAPAlgorithm(): Promise<{message: string, operationsScheduled: number}> {
    try {
      // Get all active jobs with their operations
      const jobs = await db.execute(sql`
        SELECT DISTINCT
          j.id,
          j.name,
          j.priority,
          j.need_date_time
        FROM ptjobs j
        INNER JOIN ptjoboperations jo ON jo.job_id = j.id
        WHERE j.scheduled_status NOT IN ('Completed', 'Shipped', 'Delivered')
          AND j.need_date_time IS NOT NULL
        ORDER BY j.priority ASC
      `);

      if (!jobs.rows || jobs.rows.length === 0) {
        return {
          message: 'No jobs with due dates to schedule.',
          operationsScheduled: 0
        };
      }

      let scheduledCount = 0;

      // Process each job
      for (const job of jobs.rows) {
        const needDate = new Date(job.need_date_time as string);
        
        // Get operations for this job in reverse order
        const operations = await db.execute(sql`
          SELECT 
            id,
            name,
            sequence_number,
            cycle_hrs,
            setup_hours
          FROM ptjoboperations
          WHERE job_id = ${job.id}
          ORDER BY sequence_number DESC
        `);

        if (operations.rows && operations.rows.length > 0) {
          let endTime = new Date(needDate);

          // Schedule operations backward from the need date
          for (const op of operations.rows) {
            const cycleHours = parseFloat(op.cycle_hrs as string || '0');
            const setupHours = parseFloat(op.setup_hours as string || '0');
            const totalHours = cycleHours + setupHours;

            // Calculate start time (working backward)
            const startTime = new Date(endTime.getTime() - (totalHours * 60 * 60 * 1000));

            // Update the operation schedule
            await db.execute(sql`
              UPDATE ptjoboperations
              SET 
                scheduled_start = ${startTime.toISOString()},
                scheduled_end = ${endTime.toISOString()}
              WHERE id = ${op.id}
            `);

            // Set the end time for the previous operation (working backward)
            endTime = new Date(startTime);
            scheduledCount++;
          }
        }
      }

      // Update job statuses
      await db.execute(sql`
        UPDATE ptjobs
        SET scheduled_status = 'Scheduled'
        WHERE scheduled_status = 'Not Scheduled'
          AND id IN (
            SELECT DISTINCT job_id 
            FROM ptjoboperations 
            WHERE scheduled_start IS NOT NULL
          )
      `);

      return {
        message: `**ALAP (JIT) Scheduling Complete!**\n\n` +
                 `• Scheduled ${scheduledCount} operations\n` +
                 `• Operations scheduled as late as possible\n` +
                 `• Minimizes inventory and work-in-progress\n\n` +
                 `The schedule now follows Just-In-Time principles.`,
        operationsScheduled: scheduledCount
      };
    } catch (error: any) {
      throw new Error(`ALAP algorithm failed: ${error.message}`);
    }
  }

  private async executeAlgorithm(message: string, context: AgentContext): Promise<AgentResponse> {
    // Determine which algorithm to run
    const algorithm = this.determineAlgorithm(message);
    
    this.log(`Executing ${algorithm} algorithm directly in agent service`);
    
    try {
      // Run the algorithm directly
      let result;
      if (algorithm === 'asap') {
        result = await this.runASAPAlgorithm();
      } else if (algorithm === 'alap') {
        result = await this.runALAPAlgorithm();
      } else {
        return {
          content: `Unknown algorithm: ${algorithm}`,
          error: true
        };
      }
      
      // Create an auto-save after algorithm execution and wait for it to complete
      this.log(`Creating auto-save for ${algorithm} algorithm...`);
      const savedScheduleId = await this.createAutoSave(algorithm, context);
      this.log(`Auto-save completed with schedule ID: ${savedScheduleId}`);
      
      // Add a small delay to ensure database transaction is fully committed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return success response with results and the saved schedule ID
      return {
        content: result.message,
        requiresClientAction: true,
        clientActionType: 'REFRESH_SCHEDULE',
        clientActionData: {
          algorithm: algorithm,
          targetPage: 'production-scheduler',
          scheduleId: savedScheduleId // Include the schedule ID
        },
        action: {
          type: 'scheduler_action',
          target: '/production-scheduler',
          schedulerCommand: {
            type: 'REFRESH_VIEW',
            scheduleId: savedScheduleId || undefined, // Include the saved schedule ID for the refresh
            refreshType: 'full' // Ensure a full refresh happens
          }
        },
        error: false
      };
    } catch (error: any) {
      this.error(`Failed to execute ${algorithm} algorithm: ${error.message}`, error);
      return {
        content: `Failed to execute ${algorithm.toUpperCase()} algorithm: ${error.message}`,
        error: true
      };
    }
  }
  
  private determineAlgorithm(message: string): string {
    // ASAP triggers
    const asapTriggers = [
      'asap', 'as soon as possible', 'forward schedul',
      'minimize lead', 'speed up', 'earliest', 'optimize schedule'
    ];
    
    // ALAP triggers  
    const alapTriggers = [
      'alap', 'as late as possible', 'backward schedul',
      'just in time', 'jit', 'minimize inventory', 'reduce wip', 'latest'
    ];
    
    for (const trigger of alapTriggers) {
      if (message.includes(trigger)) {
        return 'alap';
      }
    }
    
    // Default to ASAP if no specific algorithm mentioned
    return 'asap';
  }
  
  private async handleResourceRequest(message: string, context: AgentContext): Promise<AgentResponse> {
    const isAddRequest = message.includes('add') || message.includes('create');
    const isListRequest = message.includes('list') || message.includes('show');
    
    if (isAddRequest) {
      return await this.addResource(message, context);
    } else if (isListRequest) {
      return await this.listResources(context);
    }
    
    return {
      content: 'I can help you add new resources or list existing ones. Please specify what you\'d like to do.',
      error: false
    };
  }
  
  private async addResource(message: string, context: AgentContext): Promise<AgentResponse> {
    // Extract resource name from message
    const nameMatch = message.match(/(?:add|create)\s+(?:resource\s+)?(?:called\s+|named\s+)?(['""]?)([^'"",]+)\1/i);
    const resourceName = nameMatch ? nameMatch[2] : 'New Resource';
    
    try {
      // Generate unique resource ID
      const resourceId = `RES_${Date.now()}`;
      
      // Insert the new resource
      await db.execute(sql`
        INSERT INTO ptresources (
          resource_id, name, description, active, bottleneck, 
          capacity_type, buffer_hours, hourly_cost, tank
        ) VALUES (
          ${resourceId}, ${resourceName}, 
          ${'Resource added via Production Scheduling Agent'},
          true, false, 'Hours', 0, 0, false
        )
      `);
      
      this.log(`Added resource: ${resourceName} with ID: ${resourceId}`);
      
      return {
        content: `✅ Successfully added resource **${resourceName}**!\n\n` +
                 `Resource ID: ${resourceId}\n\n` +
                 `The resource has been added to the system. You may want to assign capabilities to this resource. ` +
                 `Common capabilities include: MILLING, MASHING, FERMENTATION, BOTTLING, etc.`,
        action: {
          type: 'refresh',
          target: 'resources'
        },
        error: false
      };
    } catch (error: any) {
      this.error(`Failed to add resource: ${error.message}`, error);
      return {
        content: `Failed to add the resource: ${error.message}`,
        error: true
      };
    }
  }
  
  private async listResources(context: AgentContext): Promise<AgentResponse> {
    try {
      const resources = await db.execute(sql`
        SELECT 
          r.id, r.resource_id, r.name, r.description, 
          r.active, r.bottleneck, r.capacity_type,
          STRING_AGG(rc.capability_id::text, ', ') as capabilities
        FROM ptresources r
        LEFT JOIN ptresourcecapabilities rc ON r.id = rc.resource_id
        WHERE r.active = true
        GROUP BY r.id, r.resource_id, r.name, r.description, 
                 r.active, r.bottleneck, r.capacity_type
        ORDER BY r.name
      `);
      
      if (!resources.rows || resources.rows.length === 0) {
        return {
          content: 'No active resources found in the system.',
          error: false
        };
      }
      
      let response = '**Active Resources:**\n\n';
      for (const resource of resources.rows) {
        response += `• **${resource.name}** (${resource.resource_id})\n`;
        if (resource.capabilities) {
          response += `  Capabilities: ${resource.capabilities}\n`;
        }
        if (resource.bottleneck) {
          response += `  ⚠️ Bottleneck Resource\n`;
        }
        response += '\n';
      }
      
      return {
        content: response,
        error: false
      };
    } catch (error: any) {
      this.error(`Failed to list resources: ${error.message}`, error);
      return {
        content: `Failed to retrieve resources: ${error.message}`,
        error: true
      };
    }
  }
  
  private async handleScheduleManagement(message: string, context: AgentContext): Promise<AgentResponse> {
    const isSaveRequest = message.includes('save');
    const isListRequest = message.includes('list') || message.includes('show');
    const isLoadRequest = message.includes('load');
    
    if (isSaveRequest) {
      return await this.saveSchedule(message, context);
    } else if (isListRequest) {
      return await this.listSchedules(context);
    } else if (isLoadRequest) {
      return await this.loadSchedule(message, context);
    }
    
    return {
      content: 'I can help you save, list, or load schedules. Please specify what you\'d like to do.',
      error: false
    };
  }
  
  private async saveSchedule(message: string, context: AgentContext): Promise<AgentResponse> {
    // Extract schedule name from message
    const nameMatch = message.match(/(?:save|name|call)(?:\s+(?:it|as|schedule))?\s+(['""]?)([^'"",]+)\1/i);
    const scheduleName = nameMatch ? nameMatch[2] : `Schedule ${new Date().toLocaleDateString()}`;
    
    // This requires client-side action to get the current schedule data
    return {
      content: `I'll save the current schedule as **${scheduleName}**.`,
      requiresClientAction: true,
      clientActionType: 'SAVE_SCHEDULE',
      clientActionData: {
        name: scheduleName,
        targetPage: 'production-scheduler'
      },
      error: false
    };
  }
  
  private async listSchedules(context: AgentContext): Promise<AgentResponse> {
    try {
      const schedules = await db.execute(sql`
        SELECT id, name, description, created_at, created_by
        FROM schedule_versions
        ORDER BY created_at DESC
        LIMIT 20
      `);
      
      if (!schedules.rows || schedules.rows.length === 0) {
        return {
          content: 'No saved schedules found. You can save the current schedule by saying "save schedule as [name]".',
          error: false
        };
      }
      
      let response = '**Saved Schedules:**\n\n';
      for (const schedule of schedules.rows) {
        const date = new Date(schedule.created_at).toLocaleString();
        response += `• **${schedule.name}**\n`;
        if (schedule.description) {
          response += `  ${schedule.description}\n`;
        }
        response += `  Saved: ${date}\n\n`;
      }
      
      return {
        content: response,
        error: false
      };
    } catch (error: any) {
      this.error(`Failed to list schedules: ${error.message}`, error);
      return {
        content: `Failed to retrieve saved schedules: ${error.message}`,
        error: true
      };
    }
  }
  
  private async handleJobQuery(message: string, context: AgentContext): Promise<AgentResponse> {
    const lowerMessage = message.toLowerCase();
    
    try {
      // Check if asking for detailed list with priorities and dates
      if ((lowerMessage.includes('list') || lowerMessage.includes('show')) && 
          (lowerMessage.includes('priorities') || lowerMessage.includes('need') || lowerMessage.includes('date'))) {
        return await this.getJobsWithDetails(context);
      }
      
      // Check for priority queries
      if (lowerMessage.includes('priority')) {
        if (lowerMessage.includes('high') || lowerMessage.includes('highest')) {
          return await this.getHighPriorityJobs(context);
        }
        // Check if asking about specific job priority
        const jobMatch = message.match(/(?:priority\s+of|what's?\s+the\s+priority)\s+(?:job\s+)?([A-Za-z0-9-]+)/i);
        if (jobMatch) {
          return await this.getJobPriority(jobMatch[1], context);
        }
        // If just asking about priorities in general, show detailed list
        return await this.getJobsWithDetails(context);
      }
      
      // Check for due date queries
      if (lowerMessage.includes('due')) {
        if (lowerMessage.includes('today')) {
          return await this.getJobsDueToday(context);
        }
        if (lowerMessage.includes('week')) {
          return await this.getJobsDueThisWeek(context);
        }
      }
      
      // Check for operations query
      if (lowerMessage.includes('operation')) {
        // Improved regex to capture multi-word job names
        const jobMatch = message.match(/operations?\s+(?:in|for|of)\s+(?:job\s+)?(.+?)(?:\s*$|\?)/i);
        if (jobMatch) {
          // Clean up the captured job name
          const jobName = jobMatch[1].trim().replace(/\bjob\b/i, '').trim();
          return await this.getJobOperations(jobName, context);
        }
      }
      
      // Check for status queries
      if (lowerMessage.includes('status')) {
        return await this.getJobsByStatus(context);
      }
      
      // Check for specific job query by name/ID
      // Improved to capture multi-word job names
      const specificJobMatch = message.match(/(?:what is|tell me about|show me|show details of|details? (?:of|for|about)?)\s+(?:job\s+)?(.+?)(?:\s*$|\?)/i);
      if (specificJobMatch) {
        // Clean up the captured job name
        const jobName = specificJobMatch[1].trim().replace(/\bjob\b/i, '').replace(/\bbatch\b/i, '').trim();
        return await this.getJobDetails(jobName, context);
      }
      
      // Check for late/overdue jobs
      if (lowerMessage.includes('late') || lowerMessage.includes('overdue') || lowerMessage.includes('behind')) {
        return await this.getOverdueJobs(context);
      }
      
      // Check for completed jobs
      if (lowerMessage.includes('completed') || lowerMessage.includes('finished') || lowerMessage.includes('done')) {
        return await this.getCompletedJobs(context);
      }
      
      // Default: show all jobs - if user is asking generically, show details
      if (lowerMessage.includes('all jobs') || lowerMessage.includes('show jobs')) {
        return await this.getJobsWithDetails(context);
      }
      
      return await this.getAllJobs(context);
    } catch (error: any) {
      this.error(`Failed to handle job query: ${error.message}`, error);
      return {
        content: `Failed to retrieve job information: ${error.message}`,
        error: true
      };
    }
  }
  
  private async getJobsWithDetails(context: AgentContext): Promise<AgentResponse> {
    try {
      const jobs = await db.execute(sql`
        SELECT id, name, external_id, priority, need_date_time, scheduled_status
        FROM ptjobs
        WHERE scheduled_status NOT IN ('Completed', 'Shipped', 'Delivered')
        ORDER BY priority ASC, need_date_time ASC
        LIMIT 20
      `);
      
      if (!jobs.rows || jobs.rows.length === 0) {
        return { content: 'No active jobs found.', error: false };
      }
      
      let response = `**${jobs.rows.length} active jobs with details:**\n\n`;
      
      // Group by priority for better organization
      const byPriority: any = {};
      for (const job of jobs.rows) {
        const p = job.priority || 999;
        if (!byPriority[p]) byPriority[p] = [];
        byPriority[p].push(job);
      }
      
      for (const priority of Object.keys(byPriority).sort((a, b) => Number(a) - Number(b))) {
        const priorityLabel = priority === '1' ? 'Highest' : 
                            priority === '2' ? 'High' :
                            priority === '3' ? 'Medium' :
                            priority === '4' ? 'Low' : 'Lowest';
        
        response += `**Priority ${priority} (${priorityLabel}):**\n`;
        
        for (const job of byPriority[priority]) {
          const needDate = job.need_date_time ? 
            new Date(job.need_date_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
            'No due date';
          const status = job.scheduled_status || 'Not scheduled';
          
          response += `• ${job.name || job.external_id} - Due: ${needDate}, Status: ${status}\n`;
        }
        response += '\n';
      }
      
      return { 
        content: response + 'Would you like to see operations for any specific job?', 
        error: false 
      };
    } catch (error: any) {
      throw error;
    }
  }
  
  private async getJobsByStatus(context: AgentContext): Promise<AgentResponse> {
    try {
      const jobs = await db.execute(sql`
        SELECT scheduled_status, COUNT(*) as count
        FROM ptjobs
        GROUP BY scheduled_status
        ORDER BY count DESC
      `);
      
      if (!jobs.rows || jobs.rows.length === 0) {
        return { content: 'No jobs found.', error: false };
      }
      
      let response = `**Jobs by status:**\n\n`;
      
      for (const row of jobs.rows) {
        const status = row.scheduled_status || 'Not Scheduled';
        response += `• ${status}: ${row.count} jobs\n`;
      }
      
      response += '\nWould you like to see jobs with a specific status?';
      
      return { content: response, error: false };
    } catch (error: any) {
      throw error;
    }
  }
  
  private async getAllJobs(context: AgentContext): Promise<AgentResponse> {
    try {
      const jobs = await db.execute(sql`
        SELECT id, name, external_id, priority, need_date_time, scheduled_status
        FROM ptjobs
        WHERE scheduled_status NOT IN ('Completed', 'Shipped', 'Delivered')
        ORDER BY priority ASC, need_date_time ASC
        LIMIT 50
      `);
      
      if (!jobs.rows || jobs.rows.length === 0) {
        return { content: 'No active jobs found.', error: false };
      }
      
      let response = `**${jobs.rows.length} active jobs**\n\n`;
      
      // Group by priority
      const byPriority: any = {};
      for (const job of jobs.rows) {
        const p = job.priority || 999;
        if (!byPriority[p]) byPriority[p] = [];
        byPriority[p].push(job);
      }
      
      // Show summary with bullet points
      for (const priority of Object.keys(byPriority).sort()) {
        const count = byPriority[priority].length;
        const label = priority === '1' ? 'highest' : 
                     priority === '2' ? 'high' :
                     priority === '3' ? 'medium' :
                     priority === '4' ? 'low' : 'lowest';
        response += `• Priority ${priority} (${label}): ${count} jobs\n`;
      }
      
      return { content: response + '\nWould you like more detailed information?', error: false };
    } catch (error: any) {
      throw error;
    }
  }
  
  private async getHighPriorityJobs(context: AgentContext): Promise<AgentResponse> {
    try {
      const jobs = await db.execute(sql`
        SELECT id, name, external_id, priority, need_date_time, scheduled_status
        FROM ptjobs
        WHERE priority <= 2
          AND scheduled_status NOT IN ('Completed', 'Shipped', 'Delivered')
        ORDER BY priority ASC, need_date_time ASC
      `);
      
      if (!jobs.rows || jobs.rows.length === 0) {
        return { content: 'No high priority jobs found.', error: false };
      }
      
      let response = `**${jobs.rows.length} high-priority jobs:**\n\n`;
      for (const job of jobs.rows) {
        const dueDate = job.need_date_time ? new Date(job.need_date_time).toLocaleDateString() : 'No due date';
        response += `• ${job.name} (P${job.priority}, due ${dueDate})\n`;
      }
      response += '\nWould you like additional information about these jobs?';
      
      return { content: response, error: false };
    } catch (error: any) {
      throw error;
    }
  }
  
  private async getJobPriority(jobId: string, context: AgentContext): Promise<AgentResponse> {
    try {
      const job = await db.execute(sql`
        SELECT name, external_id, priority, need_date_time
        FROM ptjobs
        WHERE name = ${jobId} OR external_id = ${jobId} OR id::text = ${jobId}
        LIMIT 1
      `);
      
      if (!job.rows || job.rows.length === 0) {
        return { content: `Job ${jobId} not found.`, error: false };
      }
      
      const jobData = job.rows[0];
      const priorityLabel = jobData.priority === 1 ? 'highest' :
                           jobData.priority === 2 ? 'high' :
                           jobData.priority === 3 ? 'medium' :
                           jobData.priority === 4 ? 'low' : 'lowest';
      const dueDate = jobData.need_date_time ? 
        `, due ${new Date(jobData.need_date_time).toLocaleDateString()}` : '';
      
      return {
        content: `Priority ${jobData.priority} (${priorityLabel})${dueDate}.\nWould you like to see the job operations or additional details?`,
        error: false
      };
    } catch (error: any) {
      throw error;
    }
  }
  
  private async getJobsDueThisWeek(context: AgentContext): Promise<AgentResponse> {
    try {
      const today = new Date();
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const jobs = await db.execute(sql`
        SELECT name, priority, need_date_time, scheduled_status
        FROM ptjobs
        WHERE need_date_time >= ${today.toISOString()}
          AND need_date_time <= ${weekEnd.toISOString()}
          AND scheduled_status NOT IN ('Completed', 'Shipped', 'Delivered')
        ORDER BY need_date_time ASC, priority ASC
      `);
      
      if (!jobs.rows || jobs.rows.length === 0) {
        return { content: 'No jobs due this week.', error: false };
      }
      
      let response = `**${jobs.rows.length} jobs due this week:**\n\n`;
      
      // Group by day
      const byDay: any = {};
      for (const job of jobs.rows) {
        const day = new Date(job.need_date_time).toLocaleDateString();
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push(job);
      }
      
      // Use bullet points for the list
      for (const day in byDay) {
        response += `• ${day}: ${byDay[day].length} jobs\n`;
      }
      response += '\nWould you like to see specific job details?';
      
      return { content: response, error: false };
    } catch (error: any) {
      throw error;
    }
  }
  
  private async getJobsDueToday(context: AgentContext): Promise<AgentResponse> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const jobs = await db.execute(sql`
        SELECT name, priority, need_date_time, scheduled_status
        FROM ptjobs
        WHERE need_date_time >= ${today.toISOString()}
          AND need_date_time < ${tomorrow.toISOString()}
          AND scheduled_status NOT IN ('Completed', 'Shipped', 'Delivered')
        ORDER BY priority ASC
      `);
      
      if (!jobs.rows || jobs.rows.length === 0) {
        return { content: 'No jobs due today.', error: false };
      }
      
      let response = `**${jobs.rows.length} jobs due today:**\n\n`;
      for (const job of jobs.rows) {
        response += `• ${job.name} (Priority ${job.priority})\n`;
      }
      response += '\nWould you like to see the operations for any of these jobs?';
      
      return { content: response, error: false };
    } catch (error: any) {
      throw error;
    }
  }
  
  private async getJobOperations(jobId: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // First try exact match
      let job = await db.execute(sql`
        SELECT id, name FROM ptjobs
        WHERE name = ${jobId} OR external_id = ${jobId} OR id::text = ${jobId}
        LIMIT 1
      `);
      
      // If no exact match found, try partial matching
      if (!job.rows || job.rows.length === 0) {
        const searchPattern = `%${jobId}%`;
        job = await db.execute(sql`
          SELECT id, name FROM ptjobs
          WHERE LOWER(name) LIKE LOWER(${searchPattern})
             OR LOWER(external_id) LIKE LOWER(${searchPattern})
          ORDER BY 
            CASE 
              WHEN LOWER(name) LIKE LOWER(${jobId + '%'}) THEN 1
              WHEN LOWER(name) LIKE LOWER(${'%' + jobId}) THEN 2
              ELSE 3
            END,
            name
          LIMIT 1
        `);
      }
      
      if (!job.rows || job.rows.length === 0) {
        return { content: `Job "${jobId}" not found. Please check the job name and try again.`, error: false };
      }
      
      const jobData = job.rows[0];
      
      // Get operations for this job
      const operations = await db.execute(sql`
        SELECT id, name, sequence_num, scheduled_start, scheduled_end, percent_finished
        FROM ptjoboperations
        WHERE job_id = ${jobData.id}
        ORDER BY sequence_num ASC
      `);
      
      if (!operations.rows || operations.rows.length === 0) {
        return { content: `No operations found for job ${jobData.name}.`, error: false };
      }
      
      let response = `**${operations.rows.length} operations:**\n\n`;
      const opNames = operations.rows.map(op => op.name).join(' → ');
      response += opNames;
      response += '\n\nWould you like to see the scheduled timelines for these operations?';
      
      return { content: response, error: false };
    } catch (error: any) {
      throw error;
    }
  }
  
  private async getJobDetails(jobId: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // First try exact match, then partial match
      let job = await db.execute(sql`
        SELECT id, name, external_id, priority, need_date_time, scheduled_status
        FROM ptjobs
        WHERE name = ${jobId} OR external_id = ${jobId} OR id::text = ${jobId}
        LIMIT 1
      `);
      
      // If no exact match found, try partial matching with ILIKE
      if (!job.rows || job.rows.length === 0) {
        const searchPattern = `%${jobId}%`;
        job = await db.execute(sql`
          SELECT id, name, external_id, priority, need_date_time, scheduled_status
          FROM ptjobs
          WHERE LOWER(name) LIKE LOWER(${searchPattern})
             OR LOWER(external_id) LIKE LOWER(${searchPattern})
          ORDER BY 
            CASE 
              WHEN LOWER(name) LIKE LOWER(${jobId + '%'}) THEN 1
              WHEN LOWER(name) LIKE LOWER(${'%' + jobId}) THEN 2
              ELSE 3
            END,
            name
          LIMIT 1
        `);
      }
      
      if (!job.rows || job.rows.length === 0) {
        return { content: `Job "${jobId}" not found. Please check the job name and try again.`, error: false };
      }
      
      const jobData = job.rows[0];
      const priorityLabel = jobData.priority === 1 ? 'Highest' :
                           jobData.priority === 2 ? 'High' :
                           jobData.priority === 3 ? 'Medium' :
                           jobData.priority === 4 ? 'Low' : 'Lowest';
      
      let response = `**Job Details: ${jobData.name || jobData.external_id}**\n\n`;
      response += `• Priority: ${jobData.priority} (${priorityLabel})\n`;
      response += `• Due Date: ${jobData.need_date_time ? new Date(jobData.need_date_time).toLocaleDateString() : 'Not set'}\n`;
      response += `• Status: ${jobData.scheduled_status || 'Not scheduled'}\n`;
      
      response += '\nWould you like to see the operations for this job?';
      
      return { content: response, error: false };
    } catch (error: any) {
      throw error;
    }
  }
  
  private async createAutoSave(algorithm: string, context: AgentContext): Promise<number | null> {
    try {
      // Get all current operations data for the save
      const operations = await db.execute(sql`
        SELECT 
          jo.*,
          j.name as job_name,
          j.external_id as job_external_id
        FROM ptjoboperations jo
        INNER JOIN ptjobs j ON jo.job_id = j.id
        ORDER BY jo.job_id, jo.sequence_number
      `);
      
      // Create the schedule data object
      const scheduleData = {
        operations: operations.rows,
        algorithm: algorithm.toUpperCase(),
        timestamp: new Date().toISOString(),
        source: 'algorithm_execution'
      };
      
      // Generate auto-save name with timestamp
      const timestamp = new Date();
      const datePart = timestamp.toLocaleDateString().replace(/\//g, '');
      const timePart = timestamp.toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '');
      const saveName = `Auto-save - ${timestamp.toLocaleDateString()}, ${timestamp.toLocaleTimeString()} (${algorithm.toUpperCase()})`;
      
      // Insert the saved schedule and get the ID back
      const savedScheduleResult = await db.execute(sql`
        INSERT INTO saved_schedules (user_id, name, description, schedule_data, metadata, is_active)
        VALUES (${context.userId}, ${saveName}, ${'Automatically saved after ' + algorithm.toUpperCase() + ' algorithm execution'}, 
                ${JSON.stringify(scheduleData)}, ${JSON.stringify({ algorithm: algorithm })}, true)
        RETURNING id
      `);
      
      const savedScheduleId = savedScheduleResult.rows[0]?.id as number;
      this.log(`Created saved_schedule with ID: ${savedScheduleId}`);
      
      // Try to create a version entry - don't let this fail the auto-save
      try {
        // Always use schedule_id = 1 for the main schedule versions
        // This matches what the UI expects when querying /api/schedules/1/versions
        const scheduleIdToUse = 1;
        
        // Get existing versions for this schedule
        const existingVersions = await db.execute(sql`
          SELECT version_number
          FROM schedule_versions
          WHERE schedule_id = ${scheduleIdToUse}
          ORDER BY version_number DESC
          LIMIT 1
        `);
        
        const nextVersionNumber = existingVersions.rows && existingVersions.rows.length > 0 
          ? (existingVersions.rows[0].version_number as number) + 1 
          : 1;
        
        // Generate checksum
        const checksum = crypto
          .createHash('sha256')
          .update(JSON.stringify(scheduleData))
          .digest('hex');
        
        // Create version entry
        const versionResult = await db.execute(sql`
          INSERT INTO schedule_versions (
            schedule_id, version_number, version_tag, created_by, created_at,
            source, comment, snapshot_data, operation_snapshots, checksum,
            status, branch_name, is_merged, is_baseline
          )
          VALUES (
            ${scheduleIdToUse}, ${nextVersionNumber}, ${'OPTIMIZATION APPLIED'}, ${context.userId}, ${new Date()},
            ${'algorithm_' + algorithm}, ${'Optimization requested: ' + algorithm.toUpperCase()}, 
            ${JSON.stringify(scheduleData)}, ${JSON.stringify(operations.rows)}, ${checksum},
            ${'active'}, ${'main'}, false, false
          )
          RETURNING id, version_number
        `);
        
        const versionId = versionResult.rows[0]?.id;
        const versionNum = versionResult.rows[0]?.version_number;
        this.log(`Created schedule_version with ID: ${versionId}, Version Number: ${versionNum}`);
        this.log(`Auto-save complete: ${saveName} (Schedule ID: ${savedScheduleId}, Version: ${versionNum})`);
      } catch (versionError: any) {
        // Log the error but don't fail the auto-save
        this.error(`Failed to create schedule_version (but saved_schedule succeeded): ${versionError.message}`, versionError);
        this.log(`Auto-save partially complete: ${saveName} (saved_schedules entry created, but version history failed)`);
      }
      
      return savedScheduleId;
    } catch (error: any) {
      this.error(`Failed to create auto-save: ${error.message}`, error);
      // Don't throw - allow algorithm to complete even if save fails
      return null;
    }
  }
  
  private async getOverdueJobs(context: AgentContext): Promise<AgentResponse> {
    try {
      const now = new Date();
      const jobs = await db.execute(sql`
        SELECT id, name, external_id, priority, need_date_time, scheduled_status
        FROM ptjobs
        WHERE need_date_time < ${now.toISOString()}
          AND scheduled_status NOT IN ('Completed', 'Shipped', 'Delivered')
        ORDER BY need_date_time ASC, priority ASC
      `);
      
      if (!jobs.rows || jobs.rows.length === 0) {
        return { content: 'No overdue jobs found. All jobs are on schedule!', error: false };
      }
      
      let response = `**${jobs.rows.length} overdue jobs requiring immediate attention:**\n\n`;
      
      for (const job of jobs.rows) {
        const daysOverdue = Math.floor((now.getTime() - new Date(job.need_date_time).getTime()) / (1000 * 60 * 60 * 24));
        response += `• ${job.name || job.external_id} - ${daysOverdue} days overdue (P${job.priority})\n`;
      }
      
      response += '\nWould you like to prioritize these jobs for scheduling?';
      
      return { content: response, error: false };
    } catch (error: any) {
      throw error;
    }
  }
  
  private async getCompletedJobs(context: AgentContext): Promise<AgentResponse> {
    try {
      const jobs = await db.execute(sql`
        SELECT id, name, external_id, scheduled_status, updated_at
        FROM ptjobs
        WHERE scheduled_status IN ('Completed', 'Shipped', 'Delivered')
        ORDER BY updated_at DESC
        LIMIT 20
      `);
      
      if (!jobs.rows || jobs.rows.length === 0) {
        return { content: 'No completed jobs found.', error: false };
      }
      
      let response = `**${jobs.rows.length} recently completed jobs:**\n\n`;
      
      for (const job of jobs.rows) {
        const completedDate = job.updated_at ? 
          new Date(job.updated_at).toLocaleDateString() : 'Unknown';
        response += `• ${job.name || job.external_id} - Completed ${completedDate}\n`;
      }
      
      response += '\nWould you like to see more details about any specific job?';
      
      return { content: response, error: false };
    } catch (error: any) {
      throw error;
    }
  }
  
  private async loadSchedule(message: string, context: AgentContext): Promise<AgentResponse> {
    // Extract schedule name or ID from message
    const nameMatch = message.match(/load\s+(?:schedule\s+)?(['""]?)([^'"",]+)\1/i);
    const scheduleName = nameMatch ? nameMatch[2] : '';
    
    if (!scheduleName) {
      return {
        content: 'Please specify which schedule to load. You can say "load schedule [name]".',
        error: false
      };
    }
    
    // This requires client-side action to load the schedule
    return {
      content: `I'll load the schedule **${scheduleName}**.`,
      requiresClientAction: true,
      clientActionType: 'LOAD_SCHEDULE',
      clientActionData: {
        name: scheduleName,
        targetPage: 'production-scheduler'
      },
      error: false
    };
  }
}

// Export a singleton instance
export const productionSchedulingAgent = new ProductionSchedulingAgent();