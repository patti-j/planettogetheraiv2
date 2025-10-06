import OpenAI from "openai";
import { db } from "./db";
import { ptJobOperations, ptResources } from "../shared/schema";
// import { alerts } from "../shared/schema";
import { eq, sql, gte, lte, and, desc } from "drizzle-orm";
import { DEFAULT_MODEL, DEFAULT_TEMPERATURE } from "./config/ai-model";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface SystemMetrics {
  productionEfficiency: number;
  resourceUtilization: number;
  schedulingCompliance: number;
  qualityScore: number;
  inventoryLevels: number;
  activePlants: number;
  totalOperations: number;
  criticalAlerts: number;
  timestamp: Date;
}

export interface MonitoringRule {
  id: string;
  name: string;
  description: string;
  metric: keyof SystemMetrics;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export class SystemMonitoringAgent {
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private monitoringInterval = 5 * 60 * 1000; // 5 minutes

  private defaultRules: MonitoringRule[] = [
    {
      id: 'production-efficiency-low',
      name: 'Low Production Efficiency',
      description: 'Production efficiency has dropped below acceptable threshold',
      metric: 'productionEfficiency',
      threshold: 75,
      operator: 'lt',
      severity: 'medium',
      enabled: true
    },
    {
      id: 'resource-utilization-high',
      name: 'High Resource Utilization',
      description: 'Resource utilization is approaching capacity limits',
      metric: 'resourceUtilization',
      threshold: 90,
      operator: 'gt',
      severity: 'high',
      enabled: true
    },
    {
      id: 'scheduling-compliance-low',
      name: 'Poor Schedule Adherence',
      description: 'Schedule compliance has fallen below target',
      metric: 'schedulingCompliance',
      threshold: 80,
      operator: 'lt',
      severity: 'medium',
      enabled: true
    },
    {
      id: 'quality-score-critical',
      name: 'Critical Quality Issues',
      description: 'Quality score indicates serious production problems',
      metric: 'qualityScore',
      threshold: 70,
      operator: 'lt',
      severity: 'critical',
      enabled: true
    },
    {
      id: 'inventory-levels-low',
      name: 'Low Inventory Levels',
      description: 'Inventory levels are below safety stock thresholds',
      metric: 'inventoryLevels',
      threshold: 20,
      operator: 'lt',
      severity: 'high',
      enabled: true
    }
  ];

  constructor() {
    console.log('🤖 System Monitoring Agent initialized');
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Monitoring agent is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting System Monitoring Agent...');

    // Run initial check
    await this.performMonitoringCheck();

    // Set up periodic monitoring
    this.intervalId = setInterval(async () => {
      try {
        await this.performMonitoringCheck();
      } catch (error) {
        console.error('❌ Error in monitoring check:', error);
      }
    }, this.monitoringInterval);

    console.log(`✅ Monitoring agent started with ${this.monitoringInterval / 1000}s interval`);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    console.log('🛑 System Monitoring Agent stopped');
  }

  private async performMonitoringCheck(): Promise<void> {
    try {
      console.log('🔍 Performing system monitoring check...');

      // Collect system metrics
      const metrics = await this.collectSystemMetrics();
      
      // Analyze metrics with AI
      const analysis = await this.analyzeMetricsWithAI(metrics);
      
      // Check rules and generate alerts
      await this.checkRulesAndGenerateAlerts(metrics, analysis);
      
      console.log('✅ Monitoring check completed');
    } catch (error) {
      console.error('❌ Error in monitoring check:', error);
    }
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    try {
      // Get total plants count from actual database table
      const activePlantsResult = await db.execute(sql.raw('select count(*) from ptplants'));
      
      const activePlants = (activePlantsResult as any)[0]?.count || 0;

      // Get total operations count using raw query to match actual table name
      const totalOperationsResult = await db.execute(sql.raw('select count(*) from ptjoboperations'));
      
      const totalOperations = (totalOperationsResult as any)[0]?.count || 0;

      // Get critical alerts count (last 24 hours)
      const criticalAlertsResult = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(alerts)
        .where(
          and(
            eq(alerts.severity, 'critical'),
            gte(alerts.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
          )
        );
      
      const criticalAlerts = criticalAlertsResult[0]?.count || 0;

      // Calculate derived metrics (simulate real data)
      const productionEfficiency = Math.random() * 20 + 75; // 75-95%
      const resourceUtilization = Math.random() * 30 + 60; // 60-90%
      const schedulingCompliance = Math.random() * 25 + 70; // 70-95%
      const qualityScore = Math.random() * 20 + 75; // 75-95%
      const inventoryLevels = Math.random() * 50 + 25; // 25-75%

      return {
        productionEfficiency: Math.round(productionEfficiency),
        resourceUtilization: Math.round(resourceUtilization),
        schedulingCompliance: Math.round(schedulingCompliance),
        qualityScore: Math.round(qualityScore),
        inventoryLevels: Math.round(inventoryLevels),
        activePlants,
        totalOperations,
        criticalAlerts,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Error collecting system metrics:', error);
      throw error;
    }
  }

  private async analyzeMetricsWithAI(metrics: SystemMetrics): Promise<string> {
    try {
      const prompt = `
        You are an AI manufacturing system analyst. Analyze these current system metrics and provide insights:

        System Metrics:
        - Production Efficiency: ${metrics.productionEfficiency}%
        - Resource Utilization: ${metrics.resourceUtilization}%
        - Schedule Compliance: ${metrics.schedulingCompliance}%
        - Quality Score: ${metrics.qualityScore}%
        - Inventory Levels: ${metrics.inventoryLevels}%
        - Active Plants: ${metrics.activePlants}
        - Total Operations: ${metrics.totalOperations}
        - Critical Alerts (24h): ${metrics.criticalAlerts}

        Provide a concise analysis in JSON format with:
        {
          "overallHealth": "excellent|good|fair|poor|critical",
          "keyInsights": ["insight1", "insight2", "insight3"],
          "recommendations": ["rec1", "rec2", "rec3"],
          "riskLevel": "low|medium|high|critical",
          "priorityActions": ["action1", "action2"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 500
      });

      const analysis = response.choices[0].message.content || '{}';
      return analysis;
    } catch (error) {
      console.error('❌ Error in AI analysis:', error);
      return JSON.stringify({
        overallHealth: "unknown",
        keyInsights: ["Unable to perform AI analysis"],
        recommendations: ["Check system status manually"],
        riskLevel: "medium",
        priorityActions: ["Review monitoring configuration"]
      });
    }
  }

  private async checkRulesAndGenerateAlerts(metrics: SystemMetrics, analysis: string): Promise<void> {
    try {
      const aiAnalysis = JSON.parse(analysis);
      
      // Check each monitoring rule
      for (const rule of this.defaultRules) {
        if (!rule.enabled) continue;

        const metricValue = metrics[rule.metric] as number;
        let shouldAlert = false;

        switch (rule.operator) {
          case 'gt':
            shouldAlert = metricValue > rule.threshold;
            break;
          case 'lt':
            shouldAlert = metricValue < rule.threshold;
            break;
          case 'eq':
            shouldAlert = metricValue === rule.threshold;
            break;
        }

        if (shouldAlert) {
          await this.createAlert({
            type: 'system_monitoring',
            message: rule.description,
            severity: rule.severity as any,
            data: {
              rule: rule.name,
              metric: rule.metric,
              currentValue: metricValue,
              threshold: rule.threshold,
              analysis: aiAnalysis,
              timestamp: metrics.timestamp.toISOString()
            },
            plantId: null, // System-wide alert
            userId: 1 // System user
          });
        }
      }

      // Generate AI-driven alerts based on analysis
      if (aiAnalysis.riskLevel === 'critical' || aiAnalysis.overallHealth === 'critical') {
        await this.createAlert({
          type: 'ai_analysis',
          message: `Critical system condition detected: ${aiAnalysis.keyInsights.join(', ')}`,
          severity: 'critical',
          data: {
            analysis: aiAnalysis,
            metrics: metrics,
            timestamp: metrics.timestamp.toISOString()
          },
          plantId: null,
          userId: 1
        });
      } else if (aiAnalysis.riskLevel === 'high') {
        await this.createAlert({
          type: 'ai_analysis',
          message: `High risk condition identified: ${aiAnalysis.priorityActions.join(', ')}`,
          severity: 'high',
          data: {
            analysis: aiAnalysis,
            metrics: metrics,
            timestamp: metrics.timestamp.toISOString()
          },
          plantId: null,
          userId: 1
        });
      }

    } catch (error) {
      console.error('❌ Error checking rules and generating alerts:', error);
    }
  }

  private async createAlert(alertData: {
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    data: any;
    plantId: number | null;
    userId: number;
  }): Promise<void> {
    try {
      // Check if similar alert exists in last hour to avoid spam
      const recentAlerts = await db
        .select({
          id: alerts.id,
          type: alerts.type,
          description: alerts.description,
          createdAt: alerts.createdAt
        })
        .from(alerts)
        .where(
          and(
            eq(alerts.type, alertData.type as any),
            eq(alerts.description, alertData.message),
            gte(alerts.createdAt, new Date(Date.now() - 60 * 60 * 1000)) // Last hour
          )
        )
        .limit(1);

      if (recentAlerts.length > 0) {
        console.log('⚠️ Similar alert already exists, skipping...');
        return;
      }

      await db.insert(alerts).values({
        title: alertData.message.substring(0, 100), // Use first 100 chars as title
        description: alertData.message,
        severity: alertData.severity,
        status: 'active',
        type: alertData.type as any,
        metadata: alertData.data,
        plantId: alertData.plantId
      });

      console.log(`🚨 Alert created: ${alertData.message} (${alertData.severity})`);
    } catch (error) {
      console.error('❌ Error creating alert:', error);
    }
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      interval: this.monitoringInterval,
      rulesCount: this.defaultRules.length,
      enabledRules: this.defaultRules.filter(r => r.enabled).length
    };
  }

  public updateInterval(intervalMs: number) {
    this.monitoringInterval = intervalMs;
    if (this.isRunning) {
      this.stop();
      setTimeout(() => this.start(), 1000);
    }
  }

  public updateRule(ruleId: string, updates: Partial<MonitoringRule>) {
    const ruleIndex = this.defaultRules.findIndex(r => r.id === ruleId);
    if (ruleIndex >= 0) {
      this.defaultRules[ruleIndex] = { ...this.defaultRules[ruleIndex], ...updates };
    }
  }
}

// Export singleton instance
export const systemMonitoringAgent = new SystemMonitoringAgent();