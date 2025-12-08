import { db } from "./db";
import { sql, eq, and, gte, lte, desc, isNull } from "drizzle-orm";
import OpenAI from "openai";
import { DEFAULT_MODEL } from "./config/ai-model";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface AnalysisConfig {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  triggerType: 'scheduled' | 'event_based' | 'threshold_based' | 'continuous';
  scheduleExpression: string;
  dataSources: string[];
  analysisScope: 'plant' | 'department' | 'resource' | 'global';
  lookbackHours: number;
  analysisPrompt: string;
  confidenceThreshold: number;
  minIntervalMinutes: number;
  maxAlertsPerRun: number;
  autoCreateAlerts: boolean;
  alertSeverity: string;
  alertType: string;
  lastAnalysisAt: Date | null;
  lastAlertCreatedAt: Date | null;
}

export class AIAnalysisService {
  
  // Get all AI analysis configurations
  async getAnalysisConfigs(activeOnly: boolean = true): Promise<AnalysisConfig[]> {
    let query = `
      SELECT id, name, description, is_active as "isActive", trigger_type as "triggerType",
             schedule_expression as "scheduleExpression", data_sources as "dataSources",
             analysis_scope as "analysisScope", lookback_hours as "lookbackHours",
             analysis_prompt as "analysisPrompt", confidence_threshold as "confidenceThreshold",
             min_interval_minutes as "minIntervalMinutes", max_alerts_per_run as "maxAlertsPerRun",
             auto_create_alerts as "autoCreateAlerts", alert_severity as "alertSeverity",
             alert_type as "alertType", last_analysis_at as "lastAnalysisAt",
             last_alert_created_at as "lastAlertCreatedAt"
      FROM ai_alert_analysis_config
    `;
    
    if (activeOnly) {
      query += ' WHERE is_active = true';
    }
    
    query += ' ORDER BY name';
    
    const result = await db.execute(sql.raw(query));
    return result.rows.map(row => ({
      id: Number(row.id),
      name: String(row.name),
      description: String(row.description || ''),
      isActive: Boolean(row.isActive),
      triggerType: String(row.triggerType) as 'scheduled' | 'event_based' | 'threshold_based' | 'continuous',
      scheduleExpression: String(row.scheduleExpression || ''),
      dataSources: Array.isArray(row.dataSources) ? row.dataSources : JSON.parse(String(row.dataSources)),
      analysisScope: String(row.analysisScope) as 'plant' | 'department' | 'resource' | 'global',
      lookbackHours: Number(row.lookbackHours),
      analysisPrompt: String(row.analysisPrompt),
      confidenceThreshold: Number(row.confidenceThreshold),
      minIntervalMinutes: Number(row.minIntervalMinutes),
      maxAlertsPerRun: Number(row.maxAlertsPerRun),
      autoCreateAlerts: Boolean(row.autoCreateAlerts),
      alertSeverity: String(row.alertSeverity),
      alertType: String(row.alertType),
      lastAnalysisAt: row.lastAnalysisAt ? new Date(String(row.lastAnalysisAt)) : null,
      lastAlertCreatedAt: row.lastAlertCreatedAt ? new Date(String(row.lastAlertCreatedAt)) : null
    }));
  }

  // Get configurations that are due for analysis
  async getDueConfigurations(): Promise<AnalysisConfig[]> {
    const configs = await this.getAnalysisConfigs(true);
    const now = new Date();
    
    return configs.filter(config => {
      if (!config.lastAnalysisAt) return true; // Never run before
      
      const timeSinceLastRun = now.getTime() - config.lastAnalysisAt.getTime();
      const minIntervalMs = config.minIntervalMinutes * 60 * 1000;
      
      return timeSinceLastRun >= minIntervalMs;
    });
  }

  // Run AI analysis for a specific configuration
  async runAnalysis(configId: number, triggerReason: string = 'manual'): Promise<any> {
    // Start analysis run record
    const runResult = await db.execute(sql.raw(`
      INSERT INTO ai_analysis_runs (config_id, trigger_reason, started_at, status)
      VALUES (${configId}, '${triggerReason}', NOW(), 'running')
      RETURNING id
    `));
    
    const runId = Number(runResult.rows[0].id);
    const startTime = Date.now();
    
    try {
      // Get configuration
      const configResult = await db.execute(sql.raw(`
        SELECT * FROM ai_alert_analysis_config WHERE id = ${configId}
      `));
      
      if (configResult.rows.length === 0) {
        throw new Error(`Configuration ${configId} not found`);
      }
      
      const config = configResult.rows[0] as any;
      
      // Gather data based on configuration
      const analysisData = await this.gatherAnalysisData(config);
      
      // Run AI analysis
      const aiResponse = await this.performAIAnalysis(config, analysisData);
      
      // Process results and create alerts if needed
      const alertsCreated = await this.processAnalysisResults(config, aiResponse, runId);
      
      // Update run record with success
      const executionTime = Date.now() - startTime;
      await db.execute(sql.raw(`
        UPDATE ai_analysis_runs 
        SET status = 'completed', completed_at = NOW(), 
            execution_time_ms = ${executionTime},
            data_points_analyzed = ${analysisData.dataPointCount || 0},
            alerts_created = ${alertsCreated},
            analysis_summary = '${(aiResponse.summary || '').replace(/'/g, "''")}'
        WHERE id = ${runId}
      `));
      
      // Update config last run time
      await db.execute(sql.raw(`
        UPDATE ai_alert_analysis_config 
        SET last_analysis_at = NOW(), total_analyses_run = total_analyses_run + 1
        WHERE id = ${configId}
      `));
      
      return {
        runId,
        alertsCreated,
        executionTime,
        summary: aiResponse.summary
      };
      
    } catch (error) {
      // Update run record with failure
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await db.execute(sql.raw(`
        UPDATE ai_analysis_runs 
        SET status = 'failed', completed_at = NOW(), 
            execution_time_ms = ${executionTime},
            error_message = '${errorMessage.replace(/'/g, "''")}'
        WHERE id = ${runId}
      `));
      
      throw error;
    }
  }

  // Gather data for analysis based on configuration
  private async gatherAnalysisData(config: any): Promise<any> {
    const dataSources = Array.isArray(config.data_sources) ? config.data_sources : JSON.parse(config.data_sources);
    const lookbackTime = new Date(Date.now() - (config.lookback_hours * 60 * 60 * 1000));
    
    const data: any = {
      timeRange: { start: lookbackTime, end: new Date() },
      dataPointCount: 0
    };
    
    // Gather operations data
    if (dataSources.includes('discrete_operations')) {
      const operationsResult = await db.execute(sql.raw(`
        SELECT id, production_order_id, operation_name, status, start_time, end_time,
               standard_duration, actual_duration, work_center_id, completion_percentage
        FROM discrete_operations 
        WHERE updated_at >= '${lookbackTime.toISOString()}'
        ORDER BY start_time DESC
        LIMIT 100
      `));
      data.operations = operationsResult.rows;
      data.dataPointCount += operationsResult.rows.length;
    }
    
    if (dataSources.includes('process_operations')) {
      const processResult = await db.execute(sql.raw(`
        SELECT id, production_order_id, operation_name, status, start_time, end_time,
               standard_duration, actual_duration, assigned_resource_id, completion_percentage,
               temperature, pressure, ph_level, batch_size
        FROM process_operations 
        WHERE updated_at >= '${lookbackTime.toISOString()}'
        ORDER BY start_time DESC
        LIMIT 100
      `));
      data.processOperations = processResult.rows;
      data.dataPointCount += processResult.rows.length;
    }

    // Gather resource data
    if (dataSources.includes('resources')) {
      const resourcesResult = await db.execute(sql.raw(`
        SELECT r.id, r.name, r.type, r.status, r.utilization,
               COUNT(po.id) as operation_count,
               AVG(po.completion_percentage) as avg_completion
        FROM resources r
        LEFT JOIN process_operations po ON r.id = po.assigned_resource_id 
          AND po.updated_at >= '${lookbackTime.toISOString()}'
        GROUP BY r.id, r.name, r.type, r.status, r.utilization
        ORDER BY r.name
      `));
      data.resources = resourcesResult.rows;
      data.dataPointCount += resourcesResult.rows.length;
    }

    // Gather recent alerts for context
    if (dataSources.includes('alerts')) {
      const alertsResult = await db.execute(sql.raw(`
        SELECT id, title, type, severity, status, detected_at, ai_generated
        FROM alerts 
        WHERE detected_at >= '${lookbackTime.toISOString()}'
        ORDER BY detected_at DESC
        LIMIT 50
      `));
      data.recentAlerts = alertsResult.rows;
      data.dataPointCount += alertsResult.rows.length;
    }
    
    return data;
  }

  // Perform AI analysis
  private async performAIAnalysis(config: any, data: any): Promise<any> {
    const systemPrompt = `You are an AI assistant specialized in manufacturing operations analysis. 
    You analyze production data to identify patterns, inefficiencies, quality issues, and optimization opportunities.
    
    Always respond with valid JSON containing:
    - summary: Brief overview of findings
    - insights: Array of detailed insights found
    - recommendations: Array of recommended actions
    - alertSuggestions: Array of specific alerts to create (each with title, description, severity, type)
    - confidence: Overall confidence score (0-100)
    `;

    const userPrompt = `${config.analysis_prompt}

    Analysis Data:
    ${JSON.stringify(data, null, 2)}
    
    Please analyze this manufacturing data and provide insights, recommendations, and any alerts that should be created.
    Focus on actionable insights that can help improve production efficiency, quality, and resource utilization.
    `;

    try {
      // Add timeout handling
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AI analysis timed out. This may be due to high server load.')), 30000); // 30 second timeout
      });

      const analysisPromise = openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_completion_tokens: 2000
      });

      const response = await Promise.race([analysisPromise, timeoutPromise]) as any;

      let content = response.choices[0].message.content;
      if (!content) throw new Error('No content in AI response');
      
      // Clean up content if it contains markdown code blocks
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Try to extract JSON if it's embedded in other text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }
      
      return JSON.parse(content);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Process AI analysis results and create alerts
  private async processAnalysisResults(config: any, aiResponse: any, runId: number): Promise<number> {
    if (!config.auto_create_alerts || !aiResponse.alertSuggestions) {
      return 0;
    }

    let alertsCreated = 0;
    const maxAlerts = Math.min(aiResponse.alertSuggestions.length, config.max_alerts_per_run);
    
    for (let i = 0; i < maxAlerts; i++) {
      const suggestion = aiResponse.alertSuggestions[i];
      
      // Check confidence threshold
      if (aiResponse.confidence < config.confidence_threshold) {
        continue;
      }

      try {
        // Create alert
        await db.execute(sql.raw(`
          INSERT INTO alerts (
            title, description, type, severity, status, source, ai_generated,
            ai_confidence, ai_model, ai_reasoning, detected_at, metadata
          ) VALUES (
            '${suggestion.title.replace(/'/g, "''")}',
            '${suggestion.description.replace(/'/g, "''")}',
            '${suggestion.type || config.alert_type}',
            '${suggestion.severity || config.alert_severity}',
            'active',
            'ai',
            true,
            ${aiResponse.confidence},
            'gpt-4o',
            '${(aiResponse.summary || '').replace(/'/g, "''")}',
            NOW(),
            '{"analysisRunId": ${runId}, "configId": ${config.id}}'
          )
        `));
        
        alertsCreated++;
      } catch (error) {
        console.error('Error creating alert:', error);
      }
    }
    
    // Update config if alerts were created
    if (alertsCreated > 0) {
      await db.execute(sql.raw(`
        UPDATE ai_alert_analysis_config 
        SET last_alert_created_at = NOW(), total_alerts_created = total_alerts_created + ${alertsCreated}
        WHERE id = ${config.id}
      `));
    }
    
    return alertsCreated;
  }

  // Create new analysis configuration
  async createAnalysisConfig(data: any): Promise<any> {
    const result = await db.execute(sql.raw(`
      INSERT INTO ai_alert_analysis_config (
        name, description, trigger_type, schedule_expression, data_sources,
        analysis_scope, lookback_hours, analysis_prompt, confidence_threshold,
        min_interval_minutes, max_alerts_per_run, auto_create_alerts,
        alert_severity, alert_type, created_by
      ) VALUES (
        '${data.name.replace(/'/g, "''")}',
        '${(data.description || '').replace(/'/g, "''")}',
        '${data.triggerType}',
        '${data.scheduleExpression || ''}',
        '${JSON.stringify(data.dataSources)}',
        '${data.analysisScope}',
        ${data.lookbackHours || 24},
        '${data.analysisPrompt.replace(/'/g, "''")}',
        ${data.confidenceThreshold || 75},
        ${data.minIntervalMinutes || 30},
        ${data.maxAlertsPerRun || 10},
        ${data.autoCreateAlerts !== false},
        '${data.alertSeverity || 'medium'}',
        '${data.alertType || 'ai_detected'}',
        ${data.createdBy}
      ) RETURNING id
    `));
    
    return result.rows[0];
  }

  // Get analysis run history
  async getAnalysisHistory(configId?: number, limit: number = 50): Promise<any[]> {
    let query = `
      SELECT ar.*, aac.name as config_name
      FROM ai_analysis_runs ar
      JOIN ai_alert_analysis_config aac ON ar.config_id = aac.id
    `;
    
    if (configId) {
      query += ` WHERE ar.config_id = ${configId}`;
    }
    
    query += ` ORDER BY ar.started_at DESC LIMIT ${limit}`;
    
    const result = await db.execute(sql.raw(query));
    return result.rows;
  }

  // Background scheduler - call this periodically
  async runScheduledAnalyses(): Promise<any> {
    try {
      const dueConfigs = await this.getDueConfigurations();
      const results = [];
      
      for (const config of dueConfigs) {
        try {
          const result = await this.runAnalysis(config.id, 'scheduled');
          results.push({
            configId: config.id,
            configName: config.name,
            success: true,
            ...result
          });
        } catch (error) {
          results.push({
            configId: config.id,
            configName: config.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      return {
        totalConfigs: dueConfigs.length,
        results
      };
    } catch (error) {
      console.error('Scheduled analysis error:', error);
      throw error;
    }
  }
}

export const aiAnalysisService = new AIAnalysisService();