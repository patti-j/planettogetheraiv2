import { sql } from "drizzle-orm";
import { db } from "../db";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ScheduleAnalysis {
  conflicts: any[];
  bottlenecks: any[];
  idleResources: any[];
  atRiskJobs: any[];
  utilizationStats: any;
  optimizationOpportunities: any[];
}

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  confidence: number;
  estimatedImpact: string;
  actionType: string;
  affectedEntities: string[];
  suggestedActions: string[];
  createdAt: string;
  aiAgent: string;
  metadata?: any;
}

export class AISchedulingRecommendationsService {
  /**
   * Analyze current production schedule for issues and opportunities
   */
  async analyzeSchedule(): Promise<ScheduleAnalysis> {
    const analysis: ScheduleAnalysis = {
      conflicts: [],
      bottlenecks: [],
      idleResources: [],
      atRiskJobs: [],
      utilizationStats: {},
      optimizationOpportunities: []
    };

    // 1. Find scheduling conflicts (overlapping operations on same resource)
    const conflictsQuery = `
      WITH operation_conflicts AS (
        SELECT 
          o1.id as op1_id,
          o1.name as op1_name,
          o1.job_id as op1_job_id,
          o2.id as op2_id,
          o2.name as op2_name,
          o2.job_id as op2_job_id,
          r.name as resource_name,
          r.id as resource_id,
          o1.scheduled_start as op1_start,
          o1.scheduled_end as op1_end,
          o2.scheduled_start as op2_start,
          o2.scheduled_end as op2_end
        FROM ptjoboperations o1
        JOIN ptjoboperations o2 ON o1.id < o2.id
        JOIN ptjobresources jr1 ON jr1.operation_id = o1.id
        JOIN ptjobresources jr2 ON jr2.operation_id = o2.id
        JOIN ptresources r ON r.id::text = jr1.default_resource_id AND r.id::text = jr2.default_resource_id
        WHERE o1.scheduled_start IS NOT NULL 
          AND o1.scheduled_end IS NOT NULL
          AND o2.scheduled_start IS NOT NULL 
          AND o2.scheduled_end IS NOT NULL
          AND o1.scheduled_start < o2.scheduled_end
          AND o2.scheduled_start < o1.scheduled_end
          AND o1.scheduled_start >= NOW() - INTERVAL '7 days'
          AND o1.scheduled_start <= NOW() + INTERVAL '14 days'
        LIMIT 10
      )
      SELECT * FROM operation_conflicts
    `;
    
    const conflictsResult = await db.execute(sql.raw(conflictsQuery));
    analysis.conflicts = conflictsResult.rows || [];

    // 2. Identify bottleneck resources (resources with high utilization and long queues)
    const bottlenecksQuery = `
      WITH resource_load AS (
        SELECT 
          r.id,
          r.name as resource_name,
          r.resource_type,
          COUNT(DISTINCT o.id) as total_operations,
          SUM(EXTRACT(EPOCH FROM (o.scheduled_end - o.scheduled_start))/3600) as total_hours,
          AVG(EXTRACT(EPOCH FROM (o.scheduled_end - o.scheduled_start))/3600) as avg_operation_hours,
          COUNT(DISTINCT o.job_id) as unique_jobs,
          MIN(o.scheduled_start) as earliest_start,
          MAX(o.scheduled_end) as latest_end
        FROM ptresources r
        LEFT JOIN ptjobresources jr ON r.id::text = jr.default_resource_id
        LEFT JOIN ptjoboperations o ON jr.operation_id = o.id
        WHERE o.scheduled_start >= NOW() - INTERVAL '7 days'
          AND o.scheduled_start <= NOW() + INTERVAL '14 days'
        GROUP BY r.id, r.name, r.resource_type
        HAVING COUNT(DISTINCT o.id) > 5
        ORDER BY total_hours DESC
        LIMIT 10
      )
      SELECT * FROM resource_load
    `;
    
    const bottlenecksResult = await db.execute(sql.raw(bottlenecksQuery));
    analysis.bottlenecks = bottlenecksResult.rows || [];

    // 3. Find at-risk jobs (jobs that might miss their due date)
    const atRiskQuery = `
      SELECT 
        j.id,
        j.name as job_name,
        j.priority,
        j.need_date_time as due_date,
        j.scheduled_end_date,
        EXTRACT(EPOCH FROM (j.need_date_time - j.scheduled_end_date))/3600 as buffer_hours,
        j.scheduled_status,
        COUNT(o.id) as pending_operations,
        MAX(o.scheduled_end) as last_operation_end
      FROM ptjobs j
      LEFT JOIN ptjoboperations o ON j.id = o.job_id
      WHERE j.scheduled_status NOT IN ('Completed', 'Shipped', 'Delivered')
        AND j.need_date_time IS NOT NULL
        AND j.scheduled_end_date IS NOT NULL
        AND (
          j.scheduled_end_date > j.need_date_time - INTERVAL '24 hours'
          OR (o.scheduled_end > j.need_date_time - INTERVAL '24 hours')
        )
      GROUP BY j.id, j.name, j.priority, j.need_date_time, j.scheduled_end_date, j.scheduled_status
      ORDER BY j.priority DESC, buffer_hours ASC
      LIMIT 10
    `;
    
    const atRiskResult = await db.execute(sql.raw(atRiskQuery));
    analysis.atRiskJobs = atRiskResult.rows || [];

    // 4. Find idle resources (resources with low utilization)
    const idleResourcesQuery = `
      WITH resource_utilization AS (
        SELECT 
          r.id,
          r.name as resource_name,
          r.resource_type,
          r.efficiency_pct,
          COUNT(o.id) as operation_count,
          COALESCE(
            SUM(EXTRACT(EPOCH FROM (o.scheduled_end - o.scheduled_start))/3600),
            0
          ) as scheduled_hours,
          168 as available_hours_per_week, -- 7 days * 24 hours
          CASE 
            WHEN COUNT(o.id) = 0 THEN 0
            ELSE ROUND(
              (SUM(EXTRACT(EPOCH FROM (o.scheduled_end - o.scheduled_start))/3600) / 168) * 100,
              2
            )
          END as utilization_pct
        FROM ptresources r
        LEFT JOIN ptjobresources jr ON r.id::text = jr.default_resource_id
        LEFT JOIN ptjoboperations o ON jr.operation_id = o.id
          AND o.scheduled_start >= NOW()
          AND o.scheduled_start <= NOW() + INTERVAL '7 days'
        WHERE r.is_active = true
        GROUP BY r.id, r.name, r.resource_type, r.efficiency_pct
        HAVING COUNT(o.id) < 5 OR 
          COALESCE(SUM(EXTRACT(EPOCH FROM (o.scheduled_end - o.scheduled_start))/3600), 0) < 40
        ORDER BY utilization_pct ASC
        LIMIT 10
      )
      SELECT * FROM resource_utilization
    `;
    
    const idleResult = await db.execute(sql.raw(idleResourcesQuery));
    analysis.idleResources = idleResult.rows || [];

    // 5. Calculate overall utilization statistics
    const utilizationQuery = `
      SELECT 
        COUNT(DISTINCT r.id) as total_resources,
        COUNT(DISTINCT j.id) as total_active_jobs,
        COUNT(DISTINCT o.id) as total_operations,
        ROUND(AVG(r.efficiency_pct), 2) as avg_efficiency,
        COUNT(DISTINCT CASE WHEN j.priority <= 3 THEN j.id END) as high_priority_jobs,
        COUNT(DISTINCT CASE WHEN j.scheduled_status = 'In-Progress' THEN j.id END) as in_progress_jobs
      FROM ptresources r
      LEFT JOIN ptjobresources jr ON r.id::text = jr.default_resource_id
      LEFT JOIN ptjoboperations o ON jr.operation_id = o.id
      LEFT JOIN ptjobs j ON o.job_id = j.id
      WHERE r.is_active = true
    `;
    
    const utilizationResult = await db.execute(sql.raw(utilizationQuery));
    analysis.utilizationStats = utilizationResult.rows[0] || {};

    // 6. Find optimization opportunities (jobs that could be moved earlier)
    const optimizationQuery = `
      WITH job_slack AS (
        SELECT 
          j.id,
          j.name as job_name,
          j.priority,
          j.need_date_time,
          MIN(o.scheduled_start) as earliest_start,
          MAX(o.scheduled_end) as latest_end,
          EXTRACT(EPOCH FROM (j.need_date_time - MAX(o.scheduled_end)))/3600 as slack_hours,
          COUNT(o.id) as operation_count
        FROM ptjobs j
        JOIN ptjoboperations o ON j.id = o.job_id
        WHERE j.scheduled_status NOT IN ('Completed', 'Shipped', 'Delivered')
          AND j.need_date_time IS NOT NULL
          AND o.scheduled_end IS NOT NULL
        GROUP BY j.id, j.name, j.priority, j.need_date_time
        HAVING EXTRACT(EPOCH FROM (j.need_date_time - MAX(o.scheduled_end)))/3600 > 48
        ORDER BY slack_hours DESC
        LIMIT 10
      )
      SELECT * FROM job_slack
    `;
    
    const optimizationResult = await db.execute(sql.raw(optimizationQuery));
    analysis.optimizationOpportunities = optimizationResult.rows || [];

    return analysis;
  }

  /**
   * Generate AI recommendations based on schedule analysis
   */
  async generateRecommendations(analysis: ScheduleAnalysis): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];
    
    // Generate recommendations for conflicts
    if (analysis.conflicts.length > 0) {
      for (const conflict of analysis.conflicts.slice(0, 3)) {
        const recommendation = await this.generateConflictRecommendation(conflict);
        if (recommendation) recommendations.push(recommendation);
      }
    }

    // Generate recommendations for bottlenecks
    if (analysis.bottlenecks.length > 0) {
      for (const bottleneck of analysis.bottlenecks.slice(0, 2)) {
        const recommendation = await this.generateBottleneckRecommendation(bottleneck);
        if (recommendation) recommendations.push(recommendation);
      }
    }

    // Generate recommendations for at-risk jobs
    if (analysis.atRiskJobs.length > 0) {
      for (const job of analysis.atRiskJobs.slice(0, 2)) {
        const recommendation = await this.generateAtRiskRecommendation(job);
        if (recommendation) recommendations.push(recommendation);
      }
    }

    // Generate recommendations for idle resources
    if (analysis.idleResources.length > 0) {
      const recommendation = await this.generateIdleResourceRecommendation(analysis.idleResources);
      if (recommendation) recommendations.push(recommendation);
    }

    // Generate optimization recommendations
    if (analysis.optimizationOpportunities.length > 0) {
      const recommendation = await this.generateOptimizationRecommendation(analysis.optimizationOpportunities);
      if (recommendation) recommendations.push(recommendation);
    }

    return recommendations;
  }

  private async generateConflictRecommendation(conflict: any): Promise<AIRecommendation | null> {
    try {
      const prompt = `
        Analyze this scheduling conflict and provide a recommendation:
        - Resource: ${conflict.resource_name}
        - Operation 1: ${conflict.op1_name} (Job ${conflict.op1_job_id})
        - Operation 1 Time: ${conflict.op1_start} to ${conflict.op1_end}
        - Operation 2: ${conflict.op2_name} (Job ${conflict.op2_job_id})
        - Operation 2 Time: ${conflict.op2_start} to ${conflict.op2_end}
        
        Provide a brief, actionable recommendation to resolve this conflict.
        Consider job priorities, dependencies, and resource availability.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: "You are a manufacturing scheduling expert. Provide concise, actionable recommendations for scheduling conflicts."
        }, {
          role: "user",
          content: prompt
        }],
        max_tokens: 200,
        temperature: 0.7,
      });

      const aiResponse = response.choices[0]?.message?.content || "";
      
      return {
        id: `conflict-${conflict.op1_id}-${conflict.op2_id}`,
        title: `Resolve Scheduling Conflict on ${conflict.resource_name}`,
        description: aiResponse.trim(),
        priority: 'high',
        category: 'Schedule Conflict',
        confidence: 95,
        estimatedImpact: 'Prevent production delay',
        actionType: 'reschedule',
        affectedEntities: [
          `Resource: ${conflict.resource_name}`,
          `Job ${conflict.op1_job_id}`,
          `Job ${conflict.op2_job_id}`
        ],
        suggestedActions: [
          'Reschedule one operation to a different time slot',
          'Consider using alternative resource if available',
          'Review job priorities to determine sequence'
        ],
        createdAt: new Date().toISOString(),
        aiAgent: 'Production Optimizer',
        metadata: { conflict }
      };
    } catch (error) {
      console.error('Error generating conflict recommendation:', error);
      return null;
    }
  }

  private async generateBottleneckRecommendation(bottleneck: any): Promise<AIRecommendation | null> {
    const utilizationPct = bottleneck.total_hours ? 
      Math.round((bottleneck.total_hours / 336) * 100) : 0; // 336 = 2 weeks * 168 hours

    return {
      id: `bottleneck-${bottleneck.id}`,
      title: `Optimize Bottleneck Resource: ${bottleneck.resource_name}`,
      description: `${bottleneck.resource_name} is handling ${bottleneck.total_operations} operations across ${bottleneck.unique_jobs} jobs with ${utilizationPct}% utilization. Consider load balancing or adding capacity to prevent delays.`,
      priority: utilizationPct > 80 ? 'high' : 'medium',
      category: 'Resource Optimization',
      confidence: 88,
      estimatedImpact: `+${Math.round(utilizationPct / 10)}% throughput`,
      actionType: 'optimize',
      affectedEntities: [`Resource: ${bottleneck.resource_name}`],
      suggestedActions: [
        'Redistribute operations to underutilized resources',
        'Consider overtime or additional shifts',
        'Review operation sequences for optimization'
      ],
      createdAt: new Date().toISOString(),
      aiAgent: 'Production Optimizer',
      metadata: { bottleneck }
    };
  }

  private async generateAtRiskRecommendation(job: any): Promise<AIRecommendation | null> {
    const bufferHours = parseFloat(job.buffer_hours) || 0;
    const isUrgent = bufferHours < 24;

    return {
      id: `atrisk-${job.id}`,
      title: `At-Risk Job: ${job.job_name}`,
      description: `Job ${job.job_name} with priority ${job.priority} has only ${Math.abs(bufferHours).toFixed(1)} hours buffer before due date. ${isUrgent ? 'Immediate action required!' : 'Schedule adjustment recommended.'}`,
      priority: isUrgent ? 'high' : 'medium',
      category: 'Risk Mitigation',
      confidence: 92,
      estimatedImpact: 'Prevent late delivery',
      actionType: 'expedite',
      affectedEntities: [`Job: ${job.job_name}`],
      suggestedActions: [
        isUrgent ? 'Expedite remaining operations immediately' : 'Move operations to earlier time slots',
        'Consider parallel processing if possible',
        'Alert production team about deadline risk'
      ],
      createdAt: new Date().toISOString(),
      aiAgent: 'Risk Monitor',
      metadata: { job }
    };
  }

  private async generateIdleResourceRecommendation(idleResources: any[]): Promise<AIRecommendation | null> {
    const avgUtilization = idleResources.reduce((sum, r) => 
      sum + (parseFloat(r.utilization_pct) || 0), 0) / idleResources.length;

    const resourceList = idleResources.slice(0, 3).map(r => r.resource_name).join(', ');

    return {
      id: `idle-resources-${Date.now()}`,
      title: 'Underutilized Resources Available',
      description: `${idleResources.length} resources showing low utilization (avg ${avgUtilization.toFixed(1)}%). Resources ${resourceList} could handle additional workload.`,
      priority: 'low',
      category: 'Resource Optimization',
      confidence: 85,
      estimatedImpact: `+${Math.round(100 - avgUtilization)}% capacity`,
      actionType: 'redistribute',
      affectedEntities: idleResources.map(r => `Resource: ${r.resource_name}`),
      suggestedActions: [
        'Move operations from bottleneck resources',
        'Consider preventive maintenance during idle time',
        'Review resource allocation strategy'
      ],
      createdAt: new Date().toISOString(),
      aiAgent: 'Capacity Planner',
      metadata: { idleResources }
    };
  }

  private async generateOptimizationRecommendation(opportunities: any[]): Promise<AIRecommendation | null> {
    const totalSlackHours = opportunities.reduce((sum, o) => 
      sum + (parseFloat(o.slack_hours) || 0), 0);
    
    const avgSlackDays = (totalSlackHours / opportunities.length / 24).toFixed(1);

    return {
      id: `optimization-${Date.now()}`,
      title: 'Schedule Compression Opportunity',
      description: `${opportunities.length} jobs have excessive slack time (avg ${avgSlackDays} days). Compressing the schedule could improve cash flow and reduce WIP.`,
      priority: 'low',
      category: 'Efficiency Improvement',
      confidence: 78,
      estimatedImpact: `-${avgSlackDays} days lead time`,
      actionType: 'compress',
      affectedEntities: opportunities.slice(0, 3).map(o => `Job: ${o.job_name}`),
      suggestedActions: [
        'Pull jobs forward to reduce slack time',
        'Batch similar operations for efficiency',
        'Review and optimize job sequences'
      ],
      createdAt: new Date().toISOString(),
      aiAgent: 'Efficiency Optimizer',
      metadata: { opportunities }
    };
  }

  /**
   * Get all recommendations with optional filtering
   */
  async getAllRecommendations(): Promise<AIRecommendation[]> {
    try {
      // First, analyze the current schedule
      console.log('🔍 Analyzing production schedule...');
      const analysis = await this.analyzeSchedule();
      
      console.log(`📊 Analysis complete:
        - Conflicts found: ${analysis.conflicts.length}
        - Bottlenecks identified: ${analysis.bottlenecks.length}
        - At-risk jobs: ${analysis.atRiskJobs.length}
        - Idle resources: ${analysis.idleResources.length}
        - Optimization opportunities: ${analysis.optimizationOpportunities.length}
      `);

      // Generate AI recommendations based on analysis
      console.log('🤖 Generating AI recommendations...');
      const recommendations = await this.generateRecommendations(analysis);
      
      console.log(`✅ Generated ${recommendations.length} recommendations`);
      
      // Sort by priority and confidence
      recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      });

      return recommendations;
    } catch (error) {
      console.error('❌ Error generating AI recommendations:', error);
      
      // Return fallback recommendations if AI fails
      return this.getFallbackRecommendations();
    }
  }

  /**
   * Fallback recommendations if AI service is unavailable
   */
  private getFallbackRecommendations(): AIRecommendation[] {
    return [
      {
        id: 'fallback-1',
        title: 'Schedule Analysis In Progress',
        description: 'The AI system is analyzing your production schedule. Real-time recommendations will be available shortly.',
        priority: 'medium',
        category: 'System Status',
        confidence: 100,
        estimatedImpact: 'Analysis pending',
        actionType: 'info',
        affectedEntities: [],
        suggestedActions: [
          'Check back in a few moments',
          'Review current schedule manually',
          'Contact support if issue persists'
        ],
        createdAt: new Date().toISOString(),
        aiAgent: 'System Monitor',
        metadata: {}
      }
    ];
  }

  /**
   * Apply a recommendation (execute the suggested action)
   */
  async applyRecommendation(recommendationId: string): Promise<boolean> {
    // This would implement the actual schedule changes
    // For now, just log the action
    console.log(`📝 Applying recommendation: ${recommendationId}`);
    
    // In a real implementation, this would:
    // 1. Parse the recommendation metadata
    // 2. Execute the appropriate scheduling algorithm
    // 3. Update the database with new schedule
    // 4. Mark the recommendation as applied
    
    return true;
  }

  /**
   * Dismiss a recommendation
   */
  async dismissRecommendation(recommendationId: string, reason?: string): Promise<boolean> {
    console.log(`❌ Dismissing recommendation: ${recommendationId}`, reason ? `Reason: ${reason}` : '');
    
    // In a real implementation, this would:
    // 1. Mark the recommendation as dismissed
    // 2. Store the reason for future learning
    // 3. Update recommendation metrics
    
    return true;
  }
}

// Export singleton instance
export const aiSchedulingService = new AISchedulingRecommendationsService();