import { BaseAgent, AgentContext, AgentResponse } from './base-agent.interface';
import { sql } from 'drizzle-orm';
import { Database } from '../../../shared/types';
import { db } from '../../db';

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
      'what job', 'which job', 'show job', 'list job', 'all job'
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

  private async executeAlgorithm(message: string, context: AgentContext): Promise<AgentResponse> {
    // Determine which algorithm to run
    const algorithm = this.determineAlgorithm(message);
    
    this.log(`Executing ${algorithm} algorithm via client bridge`);
    
    // Return a response that includes scheduler-specific action
    return {
      content: `I'm executing the ${algorithm.toUpperCase()} scheduling algorithm. This will optimize your production schedule.`,
      requiresClientAction: true,
      clientActionType: 'EXECUTE_SCHEDULING_ALGORITHM',
      clientActionData: {
        algorithm: algorithm,
        targetPage: 'production-scheduler'
      },
      action: {
        type: 'scheduler_action',
        target: '/production-scheduler',
        schedulerCommand: {
          type: 'RUN_ALGORITHM',
          algorithm: algorithm.toUpperCase()
        }
      },
      error: false
    };
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
        const jobMatch = message.match(/operations?\s+(?:in|for|of)\s+(?:job\s+)?([A-Za-z0-9-]+)/i);
        if (jobMatch) {
          return await this.getJobOperations(jobMatch[1], context);
        }
      }
      
      // Default: show all jobs
      return await this.getAllJobs(context);
    } catch (error: any) {
      this.error(`Failed to handle job query: ${error.message}`, error);
      return {
        content: `Failed to retrieve job information: ${error.message}`,
        error: true
      };
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
      
      let response = `**${jobs.rows.length} active jobs. Filter needed?**\n\n`;
      
      // Group by priority
      const byPriority: any = {};
      for (const job of jobs.rows) {
        const p = job.priority || 999;
        if (!byPriority[p]) byPriority[p] = [];
        byPriority[p].push(job);
      }
      
      // Show summary
      for (const priority of Object.keys(byPriority).sort()) {
        const count = byPriority[priority].length;
        const label = priority === '1' ? 'highest' : 
                     priority === '2' ? 'high' :
                     priority === '3' ? 'medium' :
                     priority === '4' ? 'low' : 'lowest';
        response += `Priority ${priority} (${label}): ${count} jobs\n`;
      }
      
      return { content: response + '\nWant details?', error: false };
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
      response += '\nNeed details?';
      
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
        content: `Priority ${jobData.priority} (${priorityLabel})${dueDate}. More info?`,
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
      
      for (const day in byDay) {
        response += `${day}: ${byDay[day].length} jobs\n`;
      }
      response += '\nDetails?';
      
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
      response += '\nNeed details?';
      
      return { content: response, error: false };
    } catch (error: any) {
      throw error;
    }
  }
  
  private async getJobOperations(jobId: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // First get the job
      const job = await db.execute(sql`
        SELECT id, name FROM ptjobs
        WHERE name = ${jobId} OR external_id = ${jobId} OR id::text = ${jobId}
        LIMIT 1
      `);
      
      if (!job.rows || job.rows.length === 0) {
        return { content: `Job ${jobId} not found.`, error: false };
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
      
      let response = `**${operations.rows.length} ops:**\n`;
      const opNames = operations.rows.map(op => op.name).join('→');
      response += opNames;
      response += '. Timelines?';
      
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