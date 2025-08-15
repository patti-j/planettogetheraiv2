import { db } from "./db";
import { 
  alerts, 
  alertRules, 
  alertHistory, 
  alertSubscriptions,
  alertAiTraining,
  type Alert,
  type InsertAlert,
  type AlertRule,
  type InsertAlertRule,
  type AlertHistory,
  type AlertSubscription,
  type AlertAiTraining
} from "@shared/alerts-schema";
import { eq, and, or, gte, lte, desc, asc, inArray, sql } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class AlertsService {
  // =============== ALERTS CRUD ===============
  async getAlerts(userId?: number, filters?: {
    status?: string;
    severity?: string;
    type?: string;
    plantId?: number;
    departmentId?: number;
  }) {
    let query = db.select().from(alerts);
    
    const conditions = [];
    if (userId) conditions.push(eq(alerts.userId, userId));
    if (filters?.status) conditions.push(eq(alerts.status, filters.status as any));
    if (filters?.severity) conditions.push(eq(alerts.severity, filters.severity as any));
    if (filters?.type) conditions.push(eq(alerts.type, filters.type as any));
    if (filters?.plantId) conditions.push(eq(alerts.plantId, filters.plantId));
    if (filters?.departmentId) conditions.push(eq(alerts.departmentId, filters.departmentId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(alerts.detectedAt));
  }

  async getAlertById(id: number) {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert;
  }

  async createAlert(data: InsertAlert) {
    const [newAlert] = await db.insert(alerts).values(data).returning();
    
    // Add to history
    await this.addAlertHistory(newAlert.id, 'created', data.userId, null, 'active', 'Alert created');
    
    // Trigger notifications
    await this.sendAlertNotifications(newAlert);
    
    return newAlert;
  }

  async updateAlert(id: number, data: Partial<InsertAlert>) {
    const [existingAlert] = await db.select().from(alerts).where(eq(alerts.id, id));
    const [updatedAlert] = await db.update(alerts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(alerts.id, id))
      .returning();
    
    // Track status changes
    if (existingAlert && data.status && existingAlert.status !== data.status) {
      await this.addAlertHistory(
        id, 
        `status_changed_to_${data.status}`,
        data.userId,
        existingAlert.status,
        data.status as any,
        `Status changed from ${existingAlert.status} to ${data.status}`
      );
    }
    
    return updatedAlert;
  }

  async acknowledgeAlert(id: number, userId: number, comment?: string) {
    const now = new Date();
    const [alert] = await db.update(alerts)
      .set({ 
        status: 'acknowledged',
        acknowledgedAt: now,
        acknowledgedBy: userId,
        updatedAt: now
      })
      .where(eq(alerts.id, id))
      .returning();
    
    await this.addAlertHistory(id, 'acknowledged', userId, 'active', 'acknowledged', comment);
    return alert;
  }

  async resolveAlert(id: number, userId: number, resolution: string, rootCause?: string) {
    const now = new Date();
    const [alert] = await db.update(alerts)
      .set({ 
        status: 'resolved',
        resolvedAt: now,
        resolvedBy: userId,
        resolution,
        rootCause,
        updatedAt: now
      })
      .where(eq(alerts.id, id))
      .returning();
    
    await this.addAlertHistory(id, 'resolved', userId, null, 'resolved', resolution);
    return alert;
  }

  async escalateAlert(id: number, escalateToUserId: number, userId: number, reason: string) {
    const now = new Date();
    const [alert] = await db.update(alerts)
      .set({ 
        status: 'escalated',
        escalatedAt: now,
        escalatedTo: escalateToUserId,
        updatedAt: now
      })
      .where(eq(alerts.id, id))
      .returning();
    
    await this.addAlertHistory(id, 'escalated', userId, null, 'escalated', reason);
    return alert;
  }

  // =============== ALERT RULES ===============
  async getAlertRules(isActive?: boolean) {
    let query = db.select().from(alertRules);
    if (isActive !== undefined) {
      query = query.where(eq(alertRules.isActive, isActive));
    }
    return query.orderBy(desc(alertRules.createdAt));
  }

  async createAlertRule(data: InsertAlertRule) {
    const [rule] = await db.insert(alertRules).values(data).returning();
    return rule;
  }

  async updateAlertRule(id: number, data: Partial<InsertAlertRule>) {
    const [rule] = await db.update(alertRules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(alertRules.id, id))
      .returning();
    return rule;
  }

  async deleteAlertRule(id: number) {
    await db.delete(alertRules).where(eq(alertRules.id, id));
  }

  // =============== AI FUNCTIONALITY ===============
  async analyzeWithAI(data: {
    type: string;
    context: any;
    metric?: string;
    value?: any;
    threshold?: any;
  }): Promise<{
    shouldAlert: boolean;
    confidence: number;
    severity: string;
    reasoning: string;
    suggestedActions?: string[];
    predictedImpact?: string;
  }> {
    try {
      const prompt = `
        Analyze the following manufacturing data for potential alerts:
        
        Type: ${data.type}
        Metric: ${data.metric || 'N/A'}
        Current Value: ${JSON.stringify(data.value)}
        Threshold: ${JSON.stringify(data.threshold)}
        Context: ${JSON.stringify(data.context)}
        
        Determine:
        1. Should an alert be generated? (true/false)
        2. Confidence level (0-100)
        3. Severity (critical/high/medium/low/info)
        4. Reasoning for the decision
        5. Suggested actions to take
        6. Predicted impact if not addressed
        
        Consider factors like:
        - Historical patterns
        - Business impact
        - Safety implications
        - Cost implications
        - Operational efficiency
        
        Respond in JSON format.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert manufacturing operations analyst with deep knowledge of production scheduling, quality control, and supply chain management. Analyze data and provide actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        shouldAlert: result.shouldAlert || false,
        confidence: result.confidence || 0,
        severity: result.severity || 'medium',
        reasoning: result.reasoning || 'No specific reasoning provided',
        suggestedActions: result.suggestedActions || [],
        predictedImpact: result.predictedImpact || 'Unknown impact'
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        shouldAlert: false,
        confidence: 0,
        severity: 'low',
        reasoning: 'AI analysis failed',
        suggestedActions: [],
        predictedImpact: 'Unknown'
      };
    }
  }

  async createAIAlert(data: {
    title: string;
    description: string;
    type: string;
    context: any;
    userId?: number;
  }) {
    const analysis = await this.analyzeWithAI({
      type: data.type,
      context: data.context
    });

    if (analysis.shouldAlert && analysis.confidence > 70) {
      const alert = await this.createAlert({
        title: data.title,
        description: `${data.description}\n\nAI Analysis: ${analysis.reasoning}`,
        type: data.type as any,
        severity: analysis.severity as any,
        status: 'active',
        source: 'ai',
        aiGenerated: true,
        aiConfidence: analysis.confidence,
        aiModel: 'gpt-4o',
        aiReasoning: analysis.reasoning,
        metadata: {
          suggestedActions: analysis.suggestedActions,
          predictedImpact: analysis.predictedImpact,
          context: data.context
        },
        userId: data.userId
      });

      return { alert, analysis };
    }

    return { alert: null, analysis };
  }

  async trainAIModel(alertId: number, feedback: {
    wasUseful: boolean;
    falsePositive?: boolean;
    falseNegative?: boolean;
    userFeedback?: string;
    userId: number;
  }) {
    const alert = await this.getAlertById(alertId);
    if (!alert) throw new Error('Alert not found');

    const training = await db.insert(alertAiTraining).values({
      alertId,
      inputData: alert.metadata || {},
      expectedOutput: feedback.wasUseful,
      actualOutput: true, // The alert was generated
      userFeedback: feedback.userFeedback,
      wasUseful: feedback.wasUseful,
      falsePositive: feedback.falsePositive,
      falseNegative: feedback.falseNegative,
      modelVersion: 'gpt-4o',
      confidence: alert.aiConfidence,
      userId: feedback.userId
    }).returning();

    return training[0];
  }

  async getAIInsights(timeRange: { start: Date; end: Date }) {
    const alertsData = await db.select()
      .from(alerts)
      .where(and(
        gte(alerts.detectedAt, timeRange.start),
        lte(alerts.detectedAt, timeRange.end)
      ));

    const prompt = `
      Analyze the following alerts data and provide insights:
      
      Alerts: ${JSON.stringify(alertsData.slice(0, 50))} // Limit to 50 for token management
      
      Provide:
      1. Pattern analysis - recurring issues
      2. Root cause trends
      3. Predictive insights - what might happen next
      4. Optimization recommendations
      5. Risk assessment
      
      Format as actionable business intelligence.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a manufacturing intelligence analyst. Analyze alert patterns and provide strategic insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 1500
    });

    return response.choices[0].message.content;
  }

  // =============== ALERT MONITORING ===============
  async checkAlertRules() {
    const activeRules = await this.getAlertRules(true);
    const now = new Date();
    
    for (const rule of activeRules) {
      // Check if cooldown period has passed
      if (rule.lastTriggered && rule.cooldownPeriod) {
        const cooldownEnd = new Date(rule.lastTriggered.getTime() + rule.cooldownPeriod * 60000);
        if (now < cooldownEnd) continue;
      }

      // Check if it's time to check this rule
      if (rule.lastChecked && rule.checkInterval) {
        const nextCheck = new Date(rule.lastChecked.getTime() + rule.checkInterval * 60000);
        if (now < nextCheck) continue;
      }

      // Evaluate rule condition
      const shouldTrigger = await this.evaluateRule(rule);
      
      if (shouldTrigger) {
        // Create alert based on rule
        await this.createAlertFromRule(rule);
        
        // Update rule timestamps
        await db.update(alertRules)
          .set({ 
            lastTriggered: now,
            lastChecked: now,
            updatedAt: now
          })
          .where(eq(alertRules.id, rule.id));
      } else {
        // Just update last checked
        await db.update(alertRules)
          .set({ 
            lastChecked: now,
            updatedAt: now
          })
          .where(eq(alertRules.id, rule.id));
      }
    }
  }

  private async evaluateRule(rule: AlertRule): Promise<boolean> {
    // This would contain complex logic to evaluate the rule condition
    // against current system state, database queries, etc.
    // For now, returning a simplified version
    
    if (rule.useAi) {
      const analysis = await this.analyzeWithAI({
        type: rule.type,
        context: rule.condition,
        metric: rule.metric,
        threshold: rule.threshold
      });
      
      return analysis.shouldAlert && 
             analysis.confidence >= (rule.aiThreshold || 70);
    }
    
    // Standard rule evaluation logic would go here
    return false;
  }

  private async createAlertFromRule(rule: AlertRule) {
    const alert = await this.createAlert({
      title: `[Auto] ${rule.name}`,
      description: rule.description || 'Automated alert triggered by rule',
      type: rule.type,
      severity: rule.severity,
      status: 'active',
      source: rule.useAi ? 'ai' : 'system',
      aiGenerated: rule.useAi,
      metadata: {
        ruleId: rule.id,
        ruleName: rule.name,
        condition: rule.condition
      }
    });
    
    return alert;
  }

  // =============== HELPER METHODS ===============
  private async addAlertHistory(
    alertId: number,
    action: string,
    userId: number | null,
    previousStatus: any,
    newStatus: any,
    comment?: string
  ) {
    await db.insert(alertHistory).values({
      alertId,
      action,
      userId,
      previousStatus,
      newStatus,
      comment
    });
  }

  private async sendAlertNotifications(alert: Alert) {
    // Get subscriptions for this alert type
    const subscriptions = await db.select()
      .from(alertSubscriptions)
      .where(
        and(
          eq(alertSubscriptions.isActive, true),
          or(
            eq(alertSubscriptions.alertType, alert.type),
            eq(alertSubscriptions.severity, alert.severity)
          )
        )
      );
    
    // Send notifications based on preferences
    for (const sub of subscriptions) {
      if (sub.inAppEnabled) {
        // Would integrate with notification system
        console.log(`Sending in-app notification to user ${sub.userId}`);
      }
      if (sub.emailEnabled) {
        // Would integrate with email service
        console.log(`Sending email notification to user ${sub.userId}`);
      }
      // etc. for other notification types
    }
  }

  // =============== SUBSCRIPTIONS ===============
  async getUserSubscriptions(userId: number) {
    return db.select()
      .from(alertSubscriptions)
      .where(eq(alertSubscriptions.userId, userId));
  }

  async updateSubscription(userId: number, data: Partial<AlertSubscription>) {
    const existing = await db.select()
      .from(alertSubscriptions)
      .where(eq(alertSubscriptions.userId, userId));
    
    if (existing.length > 0) {
      return db.update(alertSubscriptions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(alertSubscriptions.userId, userId))
        .returning();
    } else {
      return db.insert(alertSubscriptions)
        .values({ ...data, userId })
        .returning();
    }
  }

  // =============== STATISTICS ===============
  async getAlertStatistics(timeRange?: { start: Date; end: Date }) {
    const conditions = [];
    if (timeRange) {
      conditions.push(
        gte(alerts.detectedAt, timeRange.start),
        lte(alerts.detectedAt, timeRange.end)
      );
    }

    const stats = await db.select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where status = 'active')`,
      acknowledged: sql<number>`count(*) filter (where status = 'acknowledged')`,
      resolved: sql<number>`count(*) filter (where status = 'resolved')`,
      critical: sql<number>`count(*) filter (where severity = 'critical')`,
      high: sql<number>`count(*) filter (where severity = 'high')`,
      aiGenerated: sql<number>`count(*) filter (where ai_generated = true)`,
      avgResolutionTime: sql<number>`avg(EXTRACT(EPOCH FROM (resolved_at - detected_at))/3600) filter (where resolved_at is not null)`
    })
    .from(alerts)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

    return stats[0];
  }
}