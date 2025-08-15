import { OpenAI } from 'openai';
import { db } from '../db';
import { 
  productionOrders, 
  operations, 
  resources, 
  alerts,
  discreteOperations,
  processOperations,
  resourceRequirements,
  productionSchedules,
  capacityPlans
} from '@shared/schema';
import { eq, and, or, gte, lte, isNull, sql, desc, asc } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MaxContext {
  userId: number;
  userRole: string;
  currentPage: string;
  selectedData?: any;
  recentActions?: string[];
}

interface ProductionInsight {
  type: 'bottleneck' | 'conflict' | 'optimization' | 'quality' | 'maintenance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  actionable: boolean;
  data?: any;
}

export class MaxAIService {
  // Get real-time production status
  async getProductionStatus(context: MaxContext) {
    const [orders, ops, res, alertList] = await Promise.all([
      // Active production orders
      db.select().from(productionOrders)
        .where(eq(productionOrders.status, 'in-progress'))
        .limit(10),
      
      // Current operations
      db.select().from(discreteOperations)
        .where(eq(discreteOperations.status, 'in-progress'))
        .limit(10),
      
      // Resource utilization
      db.select().from(resources),
      
      // Active alerts - selecting only columns that exist in database
      db.select({
        id: alerts.id,
        title: alerts.title,
        description: alerts.description,
        severity: alerts.severity,
        status: alerts.status,
        type: alerts.type
      }).from(alerts)
        .where(eq(alerts.status, 'active'))
        .limit(5)
    ]);

    return {
      activeOrders: orders.length,
      runningOperations: ops.length,
      resourceUtilization: this.calculateUtilization(res),
      criticalAlerts: alertList.filter(a => a.severity === 'critical'),
      summary: `${orders.length} active orders, ${ops.length} running operations, ${alertList.length} active alerts`
    };
  }

  // Analyze production schedule for conflicts and bottlenecks
  async analyzeSchedule(context: MaxContext): Promise<ProductionInsight[]> {
    const insights: ProductionInsight[] = [];
    
    // Get operations for next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const upcomingOps = await db.select()
      .from(discreteOperations)
      .where(
        and(
          gte(discreteOperations.startTime, now),
          lte(discreteOperations.startTime, tomorrow)
        )
      )
      .orderBy(asc(discreteOperations.startTime));

    // Check for resource conflicts
    const resourceConflicts = this.findResourceConflicts(upcomingOps);
    if (resourceConflicts.length > 0) {
      insights.push({
        type: 'conflict',
        severity: 'high',
        title: 'Resource Scheduling Conflict Detected',
        description: `${resourceConflicts.length} operations are scheduled for the same resource at overlapping times`,
        recommendation: 'Reschedule operations or assign alternative resources',
        actionable: true,
        data: resourceConflicts
      });
    }

    // Identify bottlenecks
    const bottlenecks = await this.identifyBottlenecks();
    if (bottlenecks.length > 0) {
      insights.push({
        type: 'bottleneck',
        severity: 'medium',
        title: 'Production Bottleneck Identified',
        description: `Resource ${bottlenecks[0].resourceName} is causing delays in multiple orders`,
        recommendation: 'Consider adding capacity or rebalancing workload',
        actionable: true,
        data: bottlenecks
      });
    }

    // Find optimization opportunities
    const optimizations = await this.findOptimizationOpportunities(upcomingOps);
    optimizations.forEach(opt => insights.push(opt));

    return insights;
  }

  // Generate contextual AI response based on user query and context
  async generateResponse(query: string, context: MaxContext) {
    // Enrich context with real-time data
    const productionData = await this.getProductionStatus(context);
    const insights = await this.analyzeSchedule(context);
    
    // Build context-aware prompt
    const systemPrompt = this.buildSystemPrompt(context);
    const enrichedQuery = this.enrichQuery(query, productionData, insights, context);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: enrichedQuery }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        functions: this.getAvailableFunctions(context),
        function_call: 'auto'
      });

      // Handle function calls if needed
      if (response.choices[0].message.function_call) {
        return await this.handleFunctionCall(
          response.choices[0].message.function_call,
          context
        );
      }

      return {
        content: response.choices[0].message.content,
        insights: insights.length > 0 ? insights : undefined,
        suggestions: await this.getContextualSuggestions(context),
        data: productionData
      };
    } catch (error) {
      console.error('Max AI response generation error:', error);
      return {
        content: 'I encountered an error while analyzing the data. Please try again.',
        error: true
      };
    }
  }

  // Build role and context-specific system prompt
  private buildSystemPrompt(context: MaxContext): string {
    const basePrompt = `You are Max, an intelligent manufacturing assistant for PlanetTogether ERP system. 
    You have deep knowledge of production scheduling, resource optimization, quality management, and supply chain operations.
    You provide actionable insights and can help optimize manufacturing processes.`;

    const rolePrompts: Record<string, string> = {
      'Production Manager': `Focus on schedule optimization, resource conflicts, and delivery commitments. 
        Prioritize production efficiency and on-time delivery.`,
      'Plant Manager': `Focus on overall plant KPIs, cost optimization, and strategic improvements. 
        Provide high-level insights and trends.`,
      'Operator': `Provide clear task guidance, safety reminders, and quality checks. 
        Use simple language and step-by-step instructions.`,
      'Quality Manager': `Focus on quality metrics, compliance, and deviation analysis. 
        Highlight quality risks and inspection priorities.`,
      'Administrator': `Provide system-level insights, user management guidance, and configuration recommendations.`
    };

    const pageContexts: Record<string, string> = {
      '/production-schedule': `User is viewing the production schedule. Focus on schedule optimization, 
        sequencing, and resource allocation.`,
      '/shop-floor': `User is on the shop floor. Provide real-time operational guidance and status updates.`,
      '/analytics': `User is analyzing data. Provide insights, trends, and predictive analytics.`,
      '/alerts': `User is managing alerts. Help prioritize and resolve issues efficiently.`,
      '/quality-control': `User is managing quality. Focus on quality metrics and compliance.`
    };

    return `${basePrompt}\n\nUser Role: ${context.userRole}\n${rolePrompts[context.userRole] || ''}\n\nCurrent Context: ${context.currentPage}\n${pageContexts[context.currentPage] || ''}`;
  }

  // Enrich user query with production context
  private enrichQuery(query: string, productionData: any, insights: ProductionInsight[], context: MaxContext): string {
    let enriched = query;
    
    // Add production status if relevant
    if (query.toLowerCase().includes('status') || query.toLowerCase().includes('production')) {
      enriched += `\n\nCurrent Production Status: ${productionData.summary}`;
    }

    // Add insights if available
    if (insights.length > 0) {
      enriched += `\n\nRelevant Insights:`;
      insights.slice(0, 3).forEach(insight => {
        enriched += `\n- ${insight.title}: ${insight.description}`;
      });
    }

    // Add selected data context
    if (context.selectedData) {
      enriched += `\n\nSelected Data: ${JSON.stringify(context.selectedData)}`;
    }

    return enriched;
  }

  // Find resource scheduling conflicts
  private findResourceConflicts(operations: any[]): any[] {
    const conflicts = [];
    const resourceSchedule = new Map();

    operations.forEach(op => {
      if (!op.workCenterId) return;
      
      if (!resourceSchedule.has(op.workCenterId)) {
        resourceSchedule.set(op.workCenterId, []);
      }
      
      const schedule = resourceSchedule.get(op.workCenterId);
      
      // Check for overlaps
      const overlap = schedule.find((scheduled: any) => 
        (op.startTime >= scheduled.startTime && op.startTime < scheduled.endTime) ||
        (op.endTime > scheduled.startTime && op.endTime <= scheduled.endTime)
      );
      
      if (overlap) {
        conflicts.push({
          operation1: op,
          operation2: overlap,
          resource: op.workCenterId,
          overlapStart: new Date(Math.max(op.startTime, overlap.startTime)),
          overlapEnd: new Date(Math.min(op.endTime, overlap.endTime))
        });
      }
      
      schedule.push(op);
    });

    return conflicts;
  }

  // Identify production bottlenecks
  private async identifyBottlenecks(): Promise<any[]> {
    // Query for resources with high utilization or queue
    const bottlenecks = await db.execute(sql`
      SELECT 
        r.id,
        r.name as resource_name,
        COUNT(DISTINCT d.id) as pending_operations,
        AVG(d.actual_duration - d.standard_duration) as avg_delay
      FROM resources r
      LEFT JOIN discrete_operations d ON d.work_center_id = r.id
      WHERE d.status IN ('pending', 'in-progress')
      GROUP BY r.id, r.name
      HAVING COUNT(DISTINCT d.id) > 3
      ORDER BY COUNT(DISTINCT d.id) DESC
      LIMIT 5
    `);

    return bottlenecks.rows.map(row => ({
      resourceId: row.id,
      resourceName: row.resource_name,
      pendingOperations: row.pending_operations,
      avgDelay: row.avg_delay
    }));
  }

  // Find optimization opportunities
  private async findOptimizationOpportunities(operations: any[]): Promise<ProductionInsight[]> {
    const opportunities: ProductionInsight[] = [];

    // Check for setup time reduction by grouping similar products
    const setupOptimization = this.analyzeSetupOptimization(operations);
    if (setupOptimization) {
      opportunities.push(setupOptimization);
    }

    // Check for parallel processing opportunities
    const parallelOps = this.findParallelizableOperations(operations);
    if (parallelOps.length > 0) {
      opportunities.push({
        type: 'optimization',
        severity: 'low',
        title: 'Parallel Processing Opportunity',
        description: `${parallelOps.length} operations can be processed in parallel`,
        recommendation: 'Schedule these operations simultaneously to reduce total lead time',
        actionable: true,
        data: parallelOps
      });
    }

    return opportunities;
  }

  // Analyze setup time optimization
  private analyzeSetupOptimization(operations: any[]): ProductionInsight | null {
    // Group operations by product type
    const productGroups = new Map();
    
    operations.forEach(op => {
      const key = op.productionOrderId;
      if (!productGroups.has(key)) {
        productGroups.set(key, []);
      }
      productGroups.get(key).push(op);
    });

    // Check if resequencing can reduce setup times
    let potentialSavings = 0;
    const resequenceOps: any[] = [];

    productGroups.forEach((ops, productId) => {
      if (ops.length > 1) {
        // Calculate potential setup time savings
        potentialSavings += (ops.length - 1) * 15; // Assume 15 min setup between different products
        resequenceOps.push(...ops);
      }
    });

    if (potentialSavings > 30) {
      return {
        type: 'optimization',
        severity: 'medium',
        title: 'Setup Time Reduction Opportunity',
        description: `Resequencing operations can save ${potentialSavings} minutes of setup time`,
        recommendation: 'Group similar products together to minimize changeovers',
        actionable: true,
        data: { operations: resequenceOps, savings: potentialSavings }
      };
    }

    return null;
  }

  // Find operations that can be parallelized
  private findParallelizableOperations(operations: any[]): any[] {
    const parallelizable = [];
    
    // Simple check: operations on different resources with no dependencies
    const resourceMap = new Map();
    
    operations.forEach(op => {
      if (!resourceMap.has(op.workCenterId)) {
        resourceMap.set(op.workCenterId, []);
      }
      resourceMap.get(op.workCenterId).push(op);
    });

    // If we have operations on different resources at similar times, they can be parallel
    const timeSlots = new Map();
    operations.forEach(op => {
      const timeKey = Math.floor(op.startTime.getTime() / (60 * 60 * 1000)); // Group by hour
      if (!timeSlots.has(timeKey)) {
        timeSlots.set(timeKey, []);
      }
      timeSlots.get(timeKey).push(op);
    });

    timeSlots.forEach(ops => {
      if (ops.length > 1) {
        const resources = new Set(ops.map((op: any) => op.workCenterId));
        if (resources.size > 1) {
          parallelizable.push(...ops);
        }
      }
    });

    return parallelizable;
  }

  // Calculate resource utilization
  private calculateUtilization(resources: any[]): number {
    if (resources.length === 0) return 0;
    
    const activeResources = resources.filter(r => r.status === 'active' || r.status === 'busy');
    return Math.round((activeResources.length / resources.length) * 100);
  }

  // Get contextual suggestions based on current page
  private async getContextualSuggestions(context: MaxContext): Promise<string[]> {
    const suggestions: Record<string, string[]> = {
      '/production-schedule': [
        'Check for resource conflicts in the next shift',
        'Optimize sequence to reduce setup times',
        'Review critical path for at-risk orders',
        'Analyze capacity utilization for bottlenecks'
      ],
      '/shop-floor': [
        'View current machine status',
        'Check quality metrics for active operations',
        'Review operator task assignments',
        'Monitor real-time production progress'
      ],
      '/analytics': [
        'Compare this week\'s KPIs to last week',
        'Identify top causes of production delays',
        'Analyze OEE trends by resource',
        'Review quality performance by product'
      ],
      '/alerts': [
        'Prioritize critical production alerts',
        'Group related alerts for batch resolution',
        'Analyze alert patterns for root causes',
        'Set up proactive alert thresholds'
      ]
    };

    return suggestions[context.currentPage] || [
      'Review production status',
      'Check for scheduling conflicts',
      'Analyze resource utilization',
      'Monitor quality metrics'
    ];
  }

  // Define available functions for OpenAI function calling
  private getAvailableFunctions(context: MaxContext) {
    return [
      {
        name: 'reschedule_operation',
        description: 'Reschedule a production operation to a new time',
        parameters: {
          type: 'object',
          properties: {
            operationId: { type: 'number' },
            newStartTime: { type: 'string', format: 'date-time' },
            reason: { type: 'string' }
          },
          required: ['operationId', 'newStartTime']
        }
      },
      {
        name: 'create_alert',
        description: 'Create a new alert for production issues',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            type: { type: 'string' }
          },
          required: ['title', 'description', 'severity']
        }
      },
      {
        name: 'optimize_schedule',
        description: 'Optimize production schedule for efficiency',
        parameters: {
          type: 'object',
          properties: {
            criteria: { type: 'string', enum: ['minimize_setup', 'maximize_throughput', 'balance_resources'] },
            timeRange: { type: 'string' }
          },
          required: ['criteria']
        }
      }
    ];
  }

  // Handle function calls from OpenAI
  private async handleFunctionCall(functionCall: any, context: MaxContext) {
    const { name, arguments: args } = functionCall;
    const parsedArgs = JSON.parse(args);

    switch (name) {
      case 'reschedule_operation':
        return await this.rescheduleOperation(parsedArgs, context);
      case 'create_alert':
        return await this.createAlert(parsedArgs, context);
      case 'optimize_schedule':
        return await this.optimizeSchedule(parsedArgs, context);
      default:
        return { content: 'Function not implemented yet', error: true };
    }
  }

  // Reschedule operation implementation
  private async rescheduleOperation(args: any, context: MaxContext) {
    try {
      // Update operation in database
      await db.update(discreteOperations)
        .set({
          startTime: new Date(args.newStartTime),
          updatedAt: new Date()
        })
        .where(eq(discreteOperations.id, args.operationId));

      return {
        content: `Successfully rescheduled operation ${args.operationId} to ${args.newStartTime}. ${args.reason || ''}`,
        success: true,
        action: 'reschedule'
      };
    } catch (error) {
      return {
        content: 'Failed to reschedule operation. Please check the operation ID and try again.',
        error: true
      };
    }
  }

  // Create alert implementation
  private async createAlert(args: any, context: MaxContext) {
    try {
      const [newAlert] = await db.insert(alerts).values({
        title: args.title,
        description: args.description,
        severity: args.severity,
        type: args.type || 'production',
        status: 'active',
        userId: context.userId,
        aiGenerated: true,
        aiModel: 'gpt-4o',
        aiConfidence: 0.9,
        detectedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return {
        content: `Alert created: "${args.title}". It has been added to the alerts dashboard with ${args.severity} priority.`,
        success: true,
        action: 'create_alert',
        data: newAlert
      };
    } catch (error) {
      return {
        content: 'Failed to create alert. Please try again.',
        error: true
      };
    }
  }

  // Optimize schedule implementation
  private async optimizeSchedule(args: any, context: MaxContext) {
    // This would integrate with your Bryntum scheduler
    // For now, return optimization recommendations
    
    const insights = await this.analyzeSchedule(context);
    const optimizations = insights.filter(i => i.type === 'optimization');

    return {
      content: `Schedule optimization analysis complete. Found ${optimizations.length} optimization opportunities for ${args.criteria}.`,
      insights: optimizations,
      action: 'optimize',
      suggestions: [
        'Apply recommended sequence changes',
        'Review resource allocation',
        'Adjust operation priorities'
      ]
    };
  }

  // Get proactive insights based on time and context
  async getProactiveInsights(context: MaxContext): Promise<ProductionInsight[]> {
    const insights: ProductionInsight[] = [];
    const hour = new Date().getHours();

    // Morning briefing (7-9 AM)
    if (hour >= 7 && hour <= 9) {
      const status = await this.getProductionStatus(context);
      if (status.criticalAlerts.length > 0) {
        insights.push({
          type: 'bottleneck',
          severity: 'high',
          title: 'Morning Alert Summary',
          description: `You have ${status.criticalAlerts.length} critical alerts requiring immediate attention`,
          recommendation: 'Review and address critical alerts before starting production',
          actionable: true
        });
      }
    }

    // Shift change (3-4 PM)
    if (hour >= 15 && hour <= 16) {
      insights.push({
        type: 'optimization',
        severity: 'medium',
        title: 'Shift Handover Preparation',
        description: 'Upcoming shift change - ensure all critical information is documented',
        recommendation: 'Update operation status and document any issues for the next shift',
        actionable: true
      });
    }

    // Always check for immediate issues
    const scheduleInsights = await this.analyzeSchedule(context);
    insights.push(...scheduleInsights.filter(i => i.severity === 'critical'));

    return insights;
  }
}

export const maxAI = new MaxAIService();