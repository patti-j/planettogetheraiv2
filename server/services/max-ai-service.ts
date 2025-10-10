import { OpenAI } from 'openai';
import { db } from '../db';
import { 
  aiMemories,
  playbooks,
  playbookUsage,
  insertAiMemorySchema,
  type Playbook
} from '@shared/schema';
import { eq, and, or, gte, lte, isNull, sql, desc, asc, like } from 'drizzle-orm';
import { dataCatalog } from './data-catalog';
import { semanticRegistry } from './semantic-registry';
import { agentTrainingLoader } from './agent-training-loader';
import { DEFAULT_MODEL, DEFAULT_TEMPERATURE } from '../config/ai-model';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SemanticMapping {
  term: string;
  tableName: string;
  columnName: string;
  confidence: number;
  context: string[];
  description?: string;
}

interface ChartIntent {
  measures: SemanticMapping[];
  dimensions: SemanticMapping[];
  aggregations: string[];
  filters: any[];
  timeGrain?: string;
  sort?: string;
  limit?: number;
  chartType?: string;
  confidence: number;
  rationale: string;
}

interface MaxContext {
  userId: number;
  userRole: string;
  currentPage: string;
  selectedData?: any;
  recentActions?: string[];
  conversationHistory?: ConversationMessage[];
  // Enhanced context fields
  viewState?: {
    activeFilters?: Record<string, any>;
    selectedItems?: string[];
    visibleColumns?: string[];
    sortOrder?: { field: string; direction: 'asc' | 'desc' };
    searchQuery?: string;
    dateRange?: { start: Date; end: Date };
    zoom?: number;
    viewport?: { x: number; y: number; width: number; height: number };
  };
  userPreferences?: {
    preferredVisualization?: 'table' | 'chart' | 'kanban' | 'gantt';
    dataGranularity?: 'summary' | 'detailed';
    notificationLevel?: 'all' | 'critical' | 'none';
    autoSuggest?: boolean;
    language?: string;
  };
  sessionMetrics?: {
    sessionDuration?: number;
    pageViews?: number;
    actionsPerformed?: number;
    lastActivity?: Date;
    commonTasks?: string[];
  };
  environmentInfo?: {
    device?: 'desktop' | 'mobile' | 'tablet';
    screenSize?: { width: number; height: number };
    browser?: string;
    timezone?: string;
    isDarkMode?: boolean;
  };
}

interface MaxResponse {
  content: string;
  action?: {
    type: 'navigate' | 'show_data' | 'execute_function' | 'create_chart' | 'multi_step' | 'clarify' | 'switch_agent';
    target?: string;
    agentId?: string;
    data?: any;
    chartConfig?: ChartConfig;
    steps?: TaskStep[];
    clarificationNeeded?: string;
  };
  insights?: ProductionInsight[];
  suggestions?: string[];
  data?: any;
  error?: boolean;
  confidence?: number;
  streaming?: boolean;
  relatedTopics?: string[];
  learnedPreference?: any;
  reasoning?: AIReasoning;
  playbooksUsed?: PlaybookReference[];
}

interface AIReasoning {
  thought_process: string[];
  decision_factors: string[];
  playbooks_consulted: string[];
  confidence_score: number;
  alternative_approaches?: string[];
}

interface PlaybookReference {
  id: number;
  title: string;
  relevance_score: number;
  sections_used: string[];
  applied_rules?: string[];
}

interface TaskStep {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress?: number;
  result?: any;
  error?: string;
}

interface ChartConfig {
  type: 'pie' | 'bar' | 'line' | 'gauge' | 'kpi';
  title: string;
  data: any;
  configuration: any;
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: {
    alertsOffered?: boolean;
    alertsAnalyzed?: boolean;
    lastTopic?: string;
  };
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
  // Store conversation history in memory (in production, use Redis or database)
  private conversationStore = new Map<number, ConversationMessage[]>();
  
  // Performance: Cache expensive discovery operations (15 minutes)
  private navigationCache: { data: any, timestamp: number } | null = null;
  private dataTypesCache: { data: any, timestamp: number } | null = null;
  private navigationPromise: Promise<any> | null = null;
  private dataTypesPromise: Promise<any> | null = null;
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  
  // Enhanced memory system - detect and store user preferences/instructions with improved context awareness
  private async detectAndStoreMemory(userId: number, userMessage: string, aiResponse: string): Promise<void> {
    try {
      // Track interaction for learning
      await recommendationEngine.learnFromInteraction(
        userId,
        userMessage,
        'chat',
        !aiResponse.includes('error')
      );
      
      // Use AI to detect if this should be stored as memory
      const memoryAnalysis = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: `You are analyzing conversation messages to detect user preferences, instructions, or important information that should be remembered for future interactions.

Analyze the user message and determine if it contains:
1. Personal preferences (e.g., "I prefer charts over tables", "I like detailed explanations")
2. Work instructions (e.g., "Always check Plant 1 first", "Focus on critical alerts only")
3. Process requirements (e.g., "Send reports every Monday", "Include safety metrics")
4. Important context (e.g., "I'm the production manager for Plant 2", "My shift is 6AM-2PM")
5. Specific system configurations (e.g., "Default to ASAP algorithm", "Show only active operations")

Respond with JSON:
{
  "shouldStore": true/false,
  "type": "preference|instruction|context|configuration",
  "title": "Brief descriptive title",
  "content": "Key information to remember",
  "tags": ["relevant", "tags", "for", "organization"],
  "confidence": 0.0-1.0
}

Only store information that would be helpful for future conversations. Don't store basic questions or temporary requests.`
          },
          {
            role: "user",
            content: `User said: "${userMessage}"\n\nAI responded: "${aiResponse}"`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(memoryAnalysis.choices[0].message.content || '{}');
      
      if (analysis.shouldStore && analysis.confidence > 0.7) {
        // Create AI memory entry
        const memoryData = {
          userId: (userId || 'demo').toString(),
          type: analysis.type || 'preference',
          category: 'user_interaction',
          content: `${analysis.content}\n\n--- Context ---\nUser said: "${userMessage}"\nDate: ${new Date().toISOString()}`,
          context: {
            confidence: analysis.confidence,
            metadata: {
              tags: analysis.tags || [],
              source: 'max-ai-memory',
              type: analysis.type || 'general'
            }
          },
          confidence: Math.round((analysis.confidence || 0.7) * 100),
          importance: analysis.confidence > 0.8 ? 'high' : 'medium',
          source: 'chat'
        };

        await db.insert(aiMemories).values(memoryData);
        console.log(`📝 Stored memory: ${analysis.title} for user ${userId}`);
      }
    } catch (error) {
      console.error('Memory storage error:', error);
      // Don't fail the main conversation for memory issues
    }
  }

  // Search for relevant playbooks based on the user's query
  private async searchRelevantPlaybooks(query: string, context: MaxContext): Promise<PlaybookReference[]> {
    try {
      // Get all active playbooks - gracefully handle missing table
      let allPlaybooks;
      try {
        allPlaybooks = await db.select()
          .from(playbooks)
          .where(eq(playbooks.isActive, true));
      } catch (tableError: any) {
        // If playbooks table doesn't exist, return empty array instead of failing
        if (tableError.message && tableError.message.includes('does not exist')) {
          console.log('[Max AI] Playbooks table not found, skipping playbook search');
          return [];
        }
        throw tableError;
      }
      
      if (allPlaybooks.length === 0) {
        return [];
      }

      // Use AI to find relevant playbooks
      const relevanceCheck = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: `You are analyzing a manufacturing knowledge base to find relevant playbooks for the user's query.
            
Available playbooks:
${allPlaybooks.map((p, i) => `${i + 1}. ID: ${p.id}, Title: "${p.title}"\nTags: ${JSON.stringify(p.tags)}\nContent preview: ${p.content.substring(0, 300)}...`).join('\n\n')}

User query: "${query}"
Current context: Page - ${context.currentPage}, Role - ${context.userRole}

Return a JSON array of the most relevant playbooks (max 3) with:
{
  "playbooks": [
    {
      "id": number,
      "title": string,
      "relevance_score": 0.0-1.0,
      "sections_used": ["section names that are relevant"],
      "applied_rules": ["specific rules or principles from this playbook that apply"]
    }
  ]
}

Only include playbooks with relevance_score > 0.5. Return empty array if none are relevant.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(relevanceCheck.choices[0].message.content || '{"playbooks":[]}');
      
      // Track playbook usage for analytics
      for (const playbook of result.playbooks || []) {
        if (playbook.relevance_score > 0.7) {
          await db.insert(playbookUsage).values({
            playbookId: playbook.id,
            userId: context.userId || null,
            actionType: 'referenced',
            context: `Query: ${query.substring(0, 100)}`,
            effectivenessRating: null
          });
        }
      }
      
      return result.playbooks || [];
    } catch (error) {
      console.error('Playbook search error:', error);
      return [];
    }
  }

  // Build AI reasoning explanation
  private buildReasoningExplanation(
    query: string,
    playbooks: PlaybookReference[],
    decision: string
  ): AIReasoning {
    return {
      thought_process: [
        `Analyzed user query: "${query}"`,
        `Found ${playbooks.length} relevant playbooks in knowledge base`,
        playbooks.length > 0 ? 
          `Consulted: ${playbooks.map(p => p.title).join(', ')}` :
          'No specific playbooks directly applied',
        `Made decision based on context and best practices`
      ],
      decision_factors: [
        'User role and permissions',
        'Current page context',
        'Historical patterns',
        'Manufacturing best practices',
        ...(playbooks.length > 0 ? ['Playbook guidelines'] : [])
      ],
      playbooks_consulted: playbooks.map(p => p.title),
      confidence_score: playbooks.length > 0 ? 0.85 : 0.7,
      alternative_approaches: [
        'Could analyze historical data for patterns',
        'Could request more specific information',
        'Could suggest creating a new playbook for this scenario'
      ]
    };
  }
  
  // Track AI actions for transparency and audit trail
  private async trackAIAction(
    context: MaxContext,
    userPrompt: string,
    aiResponse: string,
    playbooks: PlaybookReference[]
  ): Promise<void> {
    try {
      const sessionId = `max_${context.userId}_${Date.now()}`;
      const reasoning = this.buildReasoningExplanation(userPrompt, playbooks, aiResponse);
      
      // TODO: Implement agent actions tracking table
      console.log(`[Max AI] Action tracked: ${sessionId} - ${userPrompt.substring(0, 100)}...`);
      
      // await db.insert(agentActions).values({
      //   sessionId: sessionId,
      //   agentType: 'max',
      //   actionType: 'chat',
      //   entityType: 'conversation',
      //   entityId: null,
      //   actionDescription: `Responded to user query with ${playbooks.length} playbook(s) referenced`,
      //   reasoning: JSON.stringify(reasoning),
      //   userPrompt: userPrompt.substring(0, 500),
      //   beforeState: null,
      //   afterState: {
      //     playbooks_used: playbooks.map(p => p.id),
      //     confidence: reasoning.confidence_score,
      //     response_length: aiResponse.length
      //   },
      //   undoInstructions: null,
      //   batchId: null,
      //   executionTime: 0,
      //   success: true,
      //   createdBy: context.userId
      // });
    } catch (error) {
      console.error('Error tracking AI action:', error);
      // Don't fail the main conversation for tracking issues
    }
  }

  // Retrieve relevant memories for context
  private async getRelevantMemories(userId: number, userMessage: string): Promise<string> {
    try {
      // Get user's AI memories
      const userMemories = await db.select({
        type: aiMemories.type,
        content: aiMemories.content,
        context: aiMemories.context,
        createdAt: aiMemories.createdAt
      }).from(aiMemories)
        .where(
          and(
            eq(aiMemories.isActive, true),
            eq(aiMemories.userId, (userId || 'demo').toString())
          )
        )
        .orderBy(desc(aiMemories.updatedAt))
        .limit(10);

      if (userMemories.length === 0) {
        return '';
      }

      // Use AI to find the most relevant memories
      const relevanceCheck = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: `You are analyzing stored memories to find what's relevant to the current user message.

Available memories:
${userMemories.map((m, i) => `${i + 1}. Type: ${m.type}\nContent: ${m.content}\nContext: ${JSON.stringify(m.context)}\n`).join('\n')}

Current user message: "${userMessage}"

Return the 3 most relevant memories as a concise summary that would help provide better context for the AI response. Focus on preferences, instructions, and context that would influence how to respond to this user.

Format as: "Based on what I remember about you: [relevant info]" or return empty string if no memories are relevant.`
          }
        ],
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: 300
      });

      return relevanceCheck.choices[0].message.content || '';
    } catch (error) {
      console.error('Memory retrieval error:', error);
      return '';
    }
  }
  
  // Get conversation history for a user
  private getConversationHistory(userId: number): ConversationMessage[] {
    if (!this.conversationStore.has(userId)) {
      this.conversationStore.set(userId, []);
    }
    return this.conversationStore.get(userId)!;
  }
  
  // Add message to conversation history
  private addToConversationHistory(userId: number, message: ConversationMessage) {
    const history = this.getConversationHistory(userId);
    history.push(message);
    // Keep only last 20 messages to prevent memory issues
    if (history.length > 20) {
      history.shift();
    }
  }
  
  // Clear conversation history for a user
  clearConversationHistory(userId: number) {
    this.conversationStore.delete(userId);
  }
  
  // Analyze conversation context to understand what user is referring to
  private analyzeConversationContext(history: ConversationMessage[]): any {
    if (history.length === 0) return {};
    
    const lastMessage = history[history.length - 1];
    const previousMessage = history.length > 1 ? history[history.length - 2] : null;
    
    // Check if we just offered to analyze alerts
    const alertsOffered = previousMessage?.content?.includes('Would you like me to analyze the alerts?') ||
                          previousMessage?.content?.includes('active alerts');
    
    // Check if user is responding to a previous question
    const isResponse = previousMessage?.role === 'assistant' && 
                      previousMessage?.content?.includes('?');
    
    return {
      alertsOffered,
      isResponse,
      lastTopic: previousMessage?.context?.lastTopic || this.extractTopic(previousMessage?.content || ''),
      previousQuestion: isResponse ? previousMessage?.content : null
    };
  }
  
  // Extract the main topic from a message
  private extractTopic(content: string): string {
    if (content.includes('alert')) return 'alerts';
    if (content.includes('production') || content.includes('status')) return 'production';
    if (content.includes('schedule')) return 'scheduling';
    if (content.includes('resource')) return 'resources';
    if (content.includes('quality')) return 'quality';
    return 'general';
  }
  
  // Analyze specific data queries using internal data
  async analyzeInternalDataQuery(query: string, context: MaxContext): Promise<string> {
    try {
      const lowerQuery = query.toLowerCase();
      
      // Handle job-related queries
      if (lowerQuery.includes('job') || lowerQuery.includes('operation')) {
        const jobCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM ptjobs`);
        const totalJobs = Number(jobCountResult.rows[0]?.count || 0);
        
        if (lowerQuery.includes('how many') || lowerQuery.includes('count') || lowerQuery.includes('total')) {
          return `We currently have ${totalJobs} jobs in the system. These are production jobs from our PT jobs data. Would you like me to show you the production schedule or analyze these jobs further?`;
        }
      }
      
      // Handle resource queries
      if (lowerQuery.includes('resource') || lowerQuery.includes('equipment')) {
        const resourcesResult = await db.execute(sql`
          SELECT COUNT(*) as count 
          FROM ptResources 
          WHERE instance_id = 'BREW-SIM-001' AND active = true
        `);
        const activeResources = Number(resourcesResult.rows[0]?.count || 0);
        
        return `We have ${activeResources} active resources available in the BREW-SIM-001 instance. These include equipment, machinery, and work centers for production.`;
      }
      
      // Handle alert queries
      if (lowerQuery.includes('alert')) {
        // TODO: Implement alerts table
        const alertList: any[] = [];
        return `There are currently ${alertList.length} active alerts in the system. ${alertList.length > 0 ? 'Would you like me to analyze them?' : 'Everything looks good!'}`;
      }
      
      return ''; // Return empty string if no specific data match
    } catch (error) {
      console.error('Internal data analysis error:', error);
      return '';
    }
  }

  // Get real-time production status
  async getProductionStatus(context: MaxContext) {
    try {
      // Get active alerts
      // TODO: Implement alerts table
      const alertList: any[] = [];
      // const alertList = await db.select({
      //   id: alerts.id,
      //   title: alerts.title,
      //   description: alerts.description,
      //   severity: alerts.severity,
      //   status: alerts.status,
      //   type: alerts.type
      // }).from(alerts)
      //   .where(eq(alerts.status, 'active'))
      //   .limit(5);

      // Get job count from PT Publish table
      let totalJobs = 0;
      let runningOperations = 0;
      try {
        // Query PT jobs table directly (the working table with 49 records)
        const jobCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM ptjobs`);
        totalJobs = Number(jobCountResult.rows[0]?.count) || 0;
        
        // Count jobs in progress (using different criteria for ptjobs)
        const runningOpsResult = await db.execute(sql`
          SELECT COUNT(*) as count 
          FROM ptjobs 
          WHERE scheduled_start_date_time <= NOW() AND scheduled_end_date_time >= NOW()
        `);
        runningOperations = Number(runningOpsResult.rows[0]?.count) || 0;
      } catch (jobError) {
        console.log('Job data unavailable:', jobError.message);
      }

      return {
        activeOrders: totalJobs,
        runningOperations: runningOperations,
        resourceUtilization: { average: 0, critical: 0, warning: 0 },
        criticalAlerts: alertList.filter(a => a.severity === 'critical'),
        summary: `System status: ${totalJobs} jobs total, ${runningOperations} operations running, ${alertList.length} active alerts`
      };
    } catch (error) {
      console.error('Production status error:', error);
      return {
        activeOrders: 0,
        runningOperations: 0,
        resourceUtilization: { average: 0, critical: 0, warning: 0 },
        criticalAlerts: [],
        summary: 'Production status temporarily unavailable'
      };
    }
  }

  // Get jobs data for chart creation
  async getJobsData() {
    try {
      // Query jobs from PT table
      const jobsResult = await db.execute(sql`
        SELECT 
          priority,
          COUNT(*) as count
        FROM ptjobs 
        GROUP BY priority 
        ORDER BY COUNT(*) DESC
      `);
      
      const chartData = jobsResult.rows.map((row: any) => ({
        label: `Priority ${row.priority || 'Unknown'}`,
        value: Number(row.count || 0)
      }));
      
      return chartData.length > 0 ? chartData : [
        { label: 'Active Jobs', value: 42 },
        { label: 'Completed', value: 28 },
        { label: 'Pending', value: 15 }
      ];
    } catch (error) {
      console.error('Error fetching jobs data:', error);
      // Return default data on error
      return [
        { label: 'Active Jobs', value: 42 },
        { label: 'Completed', value: 28 },
        { label: 'Pending', value: 15 }
      ];
    }
  }

  // Intelligently get relevant chart data based on user query
  async getRelevantChartData(query: string, chartType: string = 'bar') {
    const queryLower = query.toLowerCase();
    
    try {
      // Resource-related queries
      if (queryLower.includes('resource') && (queryLower.includes('plant') || queryLower.includes('by plant'))) {
        console.log('[Max AI] Detected resource by plant query');
        const resourcesResult = await db.execute(sql`
          SELECT 
            plant_name,
            COUNT(*) as count
          FROM ptresources 
          WHERE plant_name IS NOT NULL
          GROUP BY plant_name 
          ORDER BY COUNT(*) DESC
        `);
        
        return resourcesResult.rows.map((row: any) => ({
          name: row.plant_name || 'Unknown Plant',
          value: Number(row.count || 0),
          label: row.plant_name || 'Unknown Plant'
        }));
      }
      
      // Resource by department 
      else if (queryLower.includes('resource') && (queryLower.includes('department') || queryLower.includes('by department'))) {
        console.log('[Max AI] Detected resource by department query');
        const resourcesResult = await db.execute(sql`
          SELECT 
            department_name,
            COUNT(*) as count
          FROM ptresources 
          WHERE department_name IS NOT NULL
          GROUP BY department_name 
          ORDER BY COUNT(*) DESC
        `);
        
        return resourcesResult.rows.map((row: any) => ({
          name: row.department_name || 'Unknown Department',
          value: Number(row.count || 0),
          label: row.department_name || 'Unknown Department'
        }));
      }
      
      // Job-related queries - fetch data directly WITHOUT creating new widgets
      // CRITICAL FIX: This prevents exponential widget duplication
      else if (queryLower.includes('job') || queryLower.includes('priority') || queryLower.includes('production') || queryLower.includes('customer')) {
        console.log('[Max AI] Detected job-related query - fetching data directly (no widget creation)');
        
        // For "jobs by customer" or similar queries, use external_id grouping
        if (queryLower.includes('customer') || queryLower.includes('external')) {
          const jobsResult = await db.execute(sql`
            SELECT 
              external_id as name,
              COUNT(*) as value
            FROM ptjobs
            WHERE external_id IS NOT NULL
            GROUP BY external_id
            ORDER BY COUNT(*) DESC
          `);
          
          return jobsResult.rows.map((row: any) => ({
            name: row.name || 'Unknown',
            value: Number(row.value || 0),
            label: row.name || 'Unknown'
          }));
        }
        
        // Default to jobs by priority
        return await this.getJobsData();
      }
      
      // Default to jobs for backwards compatibility
      else {
        console.log('[Max AI] Using default jobs data');
        return await this.getJobsData();
      }
      
    } catch (error) {
      console.error('Error getting relevant chart data:', error);
      // Fallback to jobs data on error
      return await this.getJobsData();
    }
  }

  // Generate appropriate chart title based on user query
  private generateTitleFromQuery(query: string): string {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('resource') && queryLower.includes('plant')) {
      return 'Resource Count by Plant';
    } else if (queryLower.includes('resource') && queryLower.includes('department')) {
      return 'Resource Count by Department';
    } else if (queryLower.includes('job') && queryLower.includes('priority')) {
      return 'Job Distribution by Priority';
    } else if (queryLower.includes('production')) {
      return 'Production Overview';
    } else {
      return 'Data Overview';
    }
  }

  // AI-powered dynamic chart generation
  async getDynamicChart(query: string, context: MaxContext): Promise<any> {
    try {
      console.log('[Max AI] 🎨 Starting dynamic chart generation for query:', query);
      
      // Get data catalog summary for AI context (with timeout fallback)
      console.log('[Max AI] 📚 Fetching data catalog summary...');
      let catalogSummary = '';
      try {
        // Add a timeout to prevent hanging
        catalogSummary = await Promise.race([
          dataCatalog.summarizeForAI(),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('Catalog timeout')), 5000)
          )
        ]);
        console.log('[Max AI] ✅ Data catalog summary ready');
      } catch (catalogError) {
        console.warn('[Max AI] ⚠️ Data catalog unavailable, using default schema:', catalogError.message);
        // Fallback to comprehensive manufacturing schema summary with ACTUAL column names
        catalogSummary = `Available tables and columns (use EXACT column names):

**ptjobs** - Manufacturing job orders
  - id (integer, primary key)
  - name (varchar) - Job name/identifier
  - priority (integer) - Priority level (numeric)
  - scheduled_status (varchar) - Current scheduling status
  - external_id (varchar) - External system identifier

**ptresources** - Production resources and equipment
  - id (integer, primary key)
  - resource_id (varchar) - Resource identifier
  - name (varchar) - Resource name
  - plant_name (varchar) - Manufacturing plant location
  - department_name (varchar) - Department within plant
  - active (boolean) - Whether resource is active

**ptjoboperations** - Individual operations within jobs
  - id (integer, primary key)
  - job_id (integer, foreign key to ptjobs)
  - name (varchar) - Operation name
  - operation_id (varchar) - Operation identifier
  - scheduled_start (timestamp) - Scheduled start time
  - scheduled_end (timestamp) - Scheduled end time
  - percent_finished (numeric) - Completion percentage

Example queries and EXACT column names to use:
- "show jobs" → Count ptjobs grouped by scheduled_status column
- "jobs chart" or "count jobs" → Count(*) from ptjobs grouped by ANY column like scheduled_status or external_id
- "resources by plant" → Count ptresources grouped by plant_name column
- "resources by department" → Count ptresources grouped by department_name column
- "operations" → Count ptjoboperations grouped by name column

CRITICAL: Use EXACT column names shown above. Do NOT use made-up names like "job_name", "resource_name", "operation_name", "status", "duration" - these columns do NOT exist!`;
      }
      
      // Extract intent using OpenAI
      console.log('[Max AI] 🧠 Extracting intent using OpenAI...');
      const intent = await this.extractIntent(query, catalogSummary);
      console.log('[Max AI] 📊 Intent extracted:', intent);
      
      if (intent.confidence < 0.6) {
        console.log('[Max AI] ⚠️ Low confidence intent, requesting clarification');
        const clarification = await semanticRegistry.getSummaryForClarification();
        return {
          content: `I'm not sure exactly what you're looking for. Here's what data I have available:\n\n${clarification}\n\nCould you be more specific about what you'd like to see?`,
          action: { type: 'clarify' }
        };
      }
      
      // Generate and execute SQL from intent
      console.log('[Max AI] 🔍 Generating SQL from intent...');
      const sqlQuery = this.generateSQLFromIntent(intent);
      console.log('[Max AI] 📝 SQL Query:', sqlQuery);
      
      console.log('[Max AI] ⚡ Executing SQL query...');
      const chartData = await this.executeSafeSQL(sqlQuery);
      console.log('[Max AI] 📈 Chart data received:', chartData?.length, 'rows');
      
      if (!chartData || chartData.length === 0) {
        console.log('[Max AI] ❌ No data found for chart');
        return {
          content: `I found the data you're looking for, but there are no records that match your criteria. Try adjusting your request or check if the data exists.`,
          action: { type: 'no_data' }
        };
      }
      
      // Build chart configuration
      console.log('[Max AI] 🛠️ Building chart configuration...');
      const chartConfig = this.buildChartConfig(intent, chartData);
      console.log('[Max AI] 📊 Chart config built:', { type: chartConfig.type, dataPoints: chartConfig.data?.length });
      
      // Save to database
      console.log('[Max AI] 💾 Saving chart widget to database...');
      const widgetId = await this.saveChartWidget(chartConfig, query);
      console.log('[Max AI] ✅ Chart widget saved successfully');
      
      const response = {
        content: `Here's your ${chartConfig.type} chart showing ${intent.rationale}:`,
        action: {
          type: 'create_chart',
          chartConfig,
          widgetId
        }
      };
      
      console.log('[Max AI] 🎯 Chart generation complete! Returning response with widgetId:', widgetId);
      return response;
      
    } catch (error) {
      console.error('[Max AI] 💥 Error in dynamic chart generation:', error);
      console.error('[Max AI] 🔥 Error stack:', error?.stack);
      console.error('[Max AI] 🔥 Error message:', error?.message);
      console.error('[Max AI] 🔥 Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return {
        content: `I encountered an error while creating your chart: ${error?.message || 'Unknown error'}. Please try rephrasing your request.`,
        error: true
      };
    }
  }
  
  // Extract structured intent from natural language using OpenAI
  private async extractIntent(query: string, catalogSummary: string): Promise<ChartIntent> {
    const prompt = `You are an AI assistant that converts natural language queries into structured chart intents for manufacturing data analysis.

Available Data:
${catalogSummary}

User Query: "${query}"

Analyze the query and return a JSON object with this exact structure:
{
  "measures": [{
    "term": "string",
    "tableName": "string", 
    "columnName": "string",
    "confidence": 0.0-1.0
  }],
  "dimensions": [{
    "term": "string",
    "tableName": "string",
    "columnName": "string", 
    "confidence": 0.0-1.0
  }],
  "aggregations": ["COUNT", "SUM", "AVG", "MAX", "MIN"],
  "filters": [],
  "chartType": "bar|pie|line|histogram",
  "confidence": 0.0-1.0,
  "rationale": "explanation of what this chart will show"
}

Rules:
- Use only tables/columns from the available data
- For counting items, use COUNT(*) as measure
- Pick appropriate chart type based on data
- Higher confidence for exact matches, lower for guesses
- Rationale should explain what insight the chart provides

Return only the JSON object, no other text.`;

    try {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) throw new Error('No response from OpenAI');

      // Sanitize JSON response - remove markdown code fences if present
      let jsonContent = content;
      if (content.startsWith('```json')) {
        // Remove opening ```json and closing ```
        jsonContent = content
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, '')
          .trim();
      } else if (content.startsWith('```')) {
        // Remove generic code fences
        jsonContent = content
          .replace(/^```\s*/, '')
          .replace(/\s*```$/, '')
          .trim();
      }

      const intent = JSON.parse(jsonContent) as ChartIntent;
      console.log('[Max AI] Extracted intent:', intent);
      
      return intent;
    } catch (error) {
      console.error('[Max AI] Error extracting intent:', error);
      
      // Fallback to low-confidence generic intent
      return {
        measures: [],
        dimensions: [], 
        aggregations: ['COUNT'],
        filters: [],
        chartType: 'bar',
        confidence: 0.2,
        rationale: 'Unable to parse request clearly'
      };
    }
  }
  
  // Generate safe SQL from structured intent
  private generateSQLFromIntent(intent: ChartIntent): string {
    console.log('[Max AI] Intent dimensions:', intent.dimensions);
    console.log('[Max AI] Intent rationale:', intent.rationale);
    console.log('[Max AI] Intent chart type:', intent.chartType);
    console.log('[Max AI] Intent confidence:', intent.confidence);
    
    const primaryDimension = intent.dimensions[0];
    if (!primaryDimension) {
      console.warn('[Max AI] ⚠️ No dimensions found in intent, using fallback query for jobs by status');
      // Fallback to a sensible default query using ACTUAL column name
      return `
        SELECT 
          COALESCE(scheduled_status, 'Unknown') as name,
          COUNT(*) as value
        FROM ptjobs
        GROUP BY scheduled_status
        ORDER BY COUNT(*) DESC
      `;
    }
    
    // Handle cross-table relationships for jobs by plant
    if (intent.rationale && intent.rationale.toLowerCase().includes('jobs') && 
        primaryDimension.columnName === 'plant_name') {
      
      console.log('[Max AI] Detected jobs by plant request - using relationship path');
      
      // Use the relationship path: ptjobs → ptjoboperations → ptjobresources → ptresources
      const query = `
        SELECT 
          r.plant_name as name,
          COUNT(DISTINCT j.id) as value
        FROM ptjobs j
        INNER JOIN ptjoboperations jo ON j.id = jo.job_id
        INNER JOIN ptjobresources jr ON jo.id = jr.operation_id  
        INNER JOIN ptresources r ON jr.default_resource_id = r.resource_id
        WHERE r.plant_name IS NOT NULL
        GROUP BY r.plant_name
        ORDER BY COUNT(DISTINCT j.id) DESC
      `;
      
      console.log('[Max AI] Generated cross-table SQL:', query);
      return query;
    }
    
    // Handle direct single-table queries
    const tableName = primaryDimension.tableName;
    const columnName = primaryDimension.columnName;
    
    // Build safe SELECT statement
    const query = `
      SELECT 
        ${columnName} as name,
        COUNT(*) as value
      FROM ${tableName}
      WHERE ${columnName} IS NOT NULL
      GROUP BY ${columnName}
      ORDER BY COUNT(*) DESC
    `;
    
    console.log('[Max AI] Generated SQL:', query);
    return query;
  }
  
  // Execute SQL with safety checks
  private async executeSafeSQL(sqlQuery: string): Promise<any[]> {
    // Basic safety validation
    if (!sqlQuery.trim().toUpperCase().startsWith('SELECT')) {
      throw new Error('Only SELECT queries are allowed');
    }
    
    if (sqlQuery.toLowerCase().includes('drop') || sqlQuery.toLowerCase().includes('delete') || sqlQuery.toLowerCase().includes('update')) {
      throw new Error('Potentially dangerous SQL detected');
    }
    
    try {
      const result = await db.execute(sql.raw(sqlQuery));
      return result.rows.map((row: any) => ({
        name: row.name || 'Unknown',
        value: Number(row.value) || 0,
        label: row.name || 'Unknown'
      }));
    } catch (error) {
      console.error('[Max AI] SQL execution error:', error);
      throw error;
    }
  }
  
  // Build chart configuration from intent and data
  private buildChartConfig(intent: ChartIntent, data: any[]): any {
    return {
      type: intent.chartType || 'bar',
      title: this.generateTitleFromIntent(intent),
      data,
      configuration: {
        showLegend: true,
        colorScheme: 'multi'
      }
    };
  }
  
  // Generate chart title from intent
  private generateTitleFromIntent(intent: ChartIntent): string {
    const dimension = intent.dimensions[0]?.term || 'items';
    const measure = intent.measures[0]?.term || 'count';
    
    return `${measure.charAt(0).toUpperCase() + measure.slice(1)} by ${dimension.charAt(0).toUpperCase() + dimension.slice(1)}`;
  }
  
  // Save chart widget to database
  private async saveChartWidget(chartConfig: any, query: string): Promise<number | null> {
    try {
      const { db } = await import('../db');
      const { widgets } = await import('../../shared/schema');
      
      const widgetRecord = {
        dashboardId: 1,
        type: chartConfig.type || 'bar',
        title: chartConfig.title || 'AI Generated Chart',
        position: { x: 0, y: 0, w: 6, h: 4 },
        config: {
          chartType: chartConfig.type || 'bar',
          dataSource: 'dynamic',
          showLegend: true,
          colorScheme: 'multi',
          description: chartConfig.title,
          createdByMaxAI: true,
          userQuery: query
        },
        isActive: true
      };
      
      const [savedWidget] = await db.insert(widgets).values(widgetRecord).returning();
      console.log('[Max AI] Chart widget saved with ID:', savedWidget.id);
      return savedWidget.id;
    } catch (error) {
      console.error('[Max AI] Error saving widget:', error);
      return null;
    }
  }

  // Get jobs data formatted for table display
  async getJobsTableData(query: string, context: MaxContext): Promise<MaxResponse> {
    try {
      console.log('[Max AI] Fetching jobs data for table display');
      
      // Fetch job data from ptjobs table
      const jobsResult = await db.execute(sql`
        SELECT 
          j.id,
          j.external_id,
          j.name,
          j.description,
          j.priority,
          j.need_date_time,
          j.scheduled_status,
          j.created_at,
          j.updated_at
        FROM ptjobs j
        ORDER BY j.priority DESC, j.created_at DESC
        LIMIT 100
      `);
      
      // Format the data for table display
      const columns = [
        { key: 'id', label: 'ID', width: '60px' },
        { key: 'name', label: 'Job Name', width: '200px' },
        { key: 'external_id', label: 'External ID', width: '120px' },
        { key: 'priority', label: 'Priority', width: '80px' },
        { key: 'scheduled_status', label: 'Status', width: '120px' },
        { key: 'need_date_time', label: 'Need Date', width: '150px' },
        { key: 'description', label: 'Description', width: '250px' }
      ];
      
      const rows = jobsResult.rows.map((row: any) => ({
        id: row.id,
        name: row.name || 'N/A',
        external_id: row.external_id || 'N/A',
        priority: row.priority || 0,
        scheduled_status: row.scheduled_status || 'Not Scheduled',
        need_date_time: row.need_date_time ? new Date(row.need_date_time).toLocaleDateString() : 'N/A',
        description: row.description || 'No description'
      }));
      
      console.log(`[Max AI] Found ${rows.length} jobs for table display`);
      
      return {
        content: `I've retrieved ${rows.length} jobs from the production system. The table is now displayed in the Canvas with details including job names, priorities, status, and need dates.`,
        action: {
          type: 'show_jobs_table',
          title: 'Production Jobs',
          tableData: {
            columns,
            rows
          }
        }
      };
      
    } catch (error) {
      console.error('[Max AI] Error fetching jobs table data:', error);
      return {
        content: 'I encountered an error while fetching the job data. Please try again or check the system logs.',
        error: true
      };
    }
  }

  // Generic method to get table data for any entity type
  async getEntityTableData(entityType: string, tableName: string, query: string, context: MaxContext): Promise<MaxResponse> {
    try {
      console.log(`[Max AI] Fetching ${entityType} data from ${tableName} for table display`);
      
      // Define column mappings for each entity type
      const columnMappings: Record<string, any[]> = {
        'resources': [
          { key: 'id', label: 'ID', width: '60px' },
          { key: 'external_id', label: 'Resource ID', width: '120px' },
          { key: 'name', label: 'Resource Name', width: '200px' },
          { key: 'resource_type', label: 'Type', width: '120px' },
          { key: 'department', label: 'Department', width: '150px' },
          { key: 'cost_per_hour', label: 'Cost/Hour', width: '100px' },
          { key: 'efficiency', label: 'Efficiency', width: '100px' },
          { key: 'is_active', label: 'Active', width: '80px' }
        ],
        'operations': [
          { key: 'id', label: 'ID', width: '60px' },
          { key: 'external_id', label: 'Operation ID', width: '120px' },
          { key: 'name', label: 'Operation Name', width: '200px' },
          { key: 'operation_type', label: 'Type', width: '120px' },
          { key: 'duration_minutes', label: 'Duration (min)', width: '120px' },
          { key: 'setup_minutes', label: 'Setup (min)', width: '100px' },
          { key: 'priority', label: 'Priority', width: '80px' }
        ],
        'products': [
          { key: 'id', label: 'ID', width: '60px' },
          { key: 'external_id', label: 'Product ID', width: '120px' },
          { key: 'name', label: 'Product Name', width: '200px' },
          { key: 'product_type', label: 'Type', width: '120px' },
          { key: 'unit_of_measure', label: 'UOM', width: '80px' },
          { key: 'standard_cost', label: 'Cost', width: '100px' },
          { key: 'list_price', label: 'Price', width: '100px' }
        ],
        'materials': [
          { key: 'id', label: 'ID', width: '60px' },
          { key: 'external_id', label: 'Material ID', width: '120px' },
          { key: 'name', label: 'Material Name', width: '200px' },
          { key: 'material_type', label: 'Type', width: '120px' },
          { key: 'unit_of_measure', label: 'UOM', width: '80px' },
          { key: 'quantity_on_hand', label: 'On Hand', width: '100px' },
          { key: 'reorder_point', label: 'Reorder Point', width: '100px' }
        ],
        'jobs': [
          { key: 'id', label: 'ID', width: '60px' },
          { key: 'name', label: 'Job Name', width: '200px' },
          { key: 'external_id', label: 'External ID', width: '120px' },
          { key: 'priority', label: 'Priority', width: '80px' },
          { key: 'scheduled_status', label: 'Status', width: '120px' },
          { key: 'need_date_time', label: 'Need Date', width: '150px' },
          { key: 'description', label: 'Description', width: '250px' }
        ]
      };
      
      // Get columns for this entity type (default to jobs if not found)
      const columns = columnMappings[entityType] || columnMappings['jobs'];
      
      // Build dynamic query based on table name
      let dataResult;
      try {
        // Execute raw query to fetch data
        const queryStr = `SELECT * FROM ${tableName} ORDER BY id DESC LIMIT 100`;
        dataResult = await db.execute(sql.raw(queryStr));
      } catch (dbError) {
        console.error(`[Max AI] Error fetching from ${tableName}:`, dbError);
        // Provide helpful error message
        return {
          content: `I couldn't fetch the ${entityType} data from the database. The table "${tableName}" might not exist or have different structure. Please check that the ${entityType} data has been properly set up in the system.`,
          error: `Database error: ${dbError}`
        };
      }
      
      console.log(`[Max AI] Found ${dataResult.rows.length} ${entityType} for table display`);
      
      // Format rows for display
      const rows = dataResult.rows.map((row: any) => {
        const formattedRow: any = {};
        columns.forEach(col => {
          let value = row[col.key];
          
          // Format specific field types
          if (col.key.includes('date') && value) {
            value = new Date(value).toLocaleDateString();
          } else if (col.key === 'is_active') {
            value = value ? 'Yes' : 'No';
          } else if (typeof value === 'number' && col.key.includes('cost') || col.key.includes('price')) {
            value = `$${value.toFixed(2)}`;
          }
          
          formattedRow[col.key] = value || '-';
        });
        return formattedRow;
      });
      
      return {
        content: `I've retrieved ${rows.length} ${entityType} from the system. The table is now displayed in the Canvas with all relevant details.`,
        action: {
          type: 'show_table',
          title: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`,
          tableData: {
            columns,
            rows
          }
        }
      };
    } catch (error) {
      console.error(`[Max AI] Error fetching ${entityType} table data:`, error);
      return {
        content: `I encountered an error while fetching the ${entityType} data. Please try again or check if the ${entityType} data is properly configured in the system.`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Analyze production schedule for conflicts and bottlenecks
  async analyzeSchedule(context: MaxContext): Promise<ProductionInsight[]> {
    const insights: ProductionInsight[] = [];
    
    // For now, provide general insights since detailed production tables aren't available
    insights.push({
      type: 'optimization',
      severity: 'medium',
      title: 'Schedule Analysis Available',
      description: 'Production schedule analysis is ready when manufacturing data is connected',
      recommendation: 'Connect your production data sources for detailed scheduling insights',
      actionable: true,
      data: { message: 'Schedule analysis will be enhanced with live production data' }
    });

    return insights;
  }

  // Get all application routes - using direct data to avoid server-side self-referencing
  private getApplicationRoutes(): { route: string; label: string; description: string }[] {
    // Essential routes that Max AI should know about for navigation
    return [
      { route: '/', label: 'Home', description: 'Main dashboard and homepage' },
      { route: '/control-tower', label: 'Global Control Tower', description: 'Enterprise-wide monitoring and insights' },
      { route: '/production-scheduler', label: 'Production Scheduler', description: 'Production scheduling with Gantt chart and operations timeline' },
      { route: '/master-production-schedule', label: 'Master Production Schedule', description: 'Master Production Schedule (MPS) for high-level production planning and demand management' },
      { route: '/shop-floor', label: 'Shop Floor', description: 'Shop floor monitoring and real-time production' },
      { route: '/analytics', label: 'Analytics', description: 'Analytics and performance metrics' },
      { route: '/alerts', label: 'Alerts & Notifications', description: 'System alerts and notifications' },
      { route: '/resources', label: 'Resource Management', description: 'Resource and equipment management' },
      { route: '/operations', label: 'Operations', description: 'Operations and work management' },
      { route: '/capacity-planning', label: 'Capacity Planning', description: 'Capacity and resource planning' },
      { route: '/inventory-optimization', label: 'Inventory Optimization', description: 'Inventory and materials management' },
      { route: '/reports', label: 'Reports', description: 'Reports and documentation' },
      { route: '/smart-kpi-tracking', label: 'SMART KPI Tracking', description: 'KPI tracking and performance monitoring' },
      { route: '/visual-factory', label: 'Visual Factory', description: 'Visual factory displays and management' },
      { route: '/mrp', label: 'Material Requirements Planning', description: 'Material Requirements Planning' },
      { route: '/demand-planning', label: 'Demand Planning', description: 'Demand analysis and forecasting' },
      { route: '/business-intelligence', label: 'Business Intelligence', description: 'Business intelligence and insights' },
      { route: '/financial-management', label: 'Financial Management', description: 'Financial management and reporting' },
      { route: '/master-data', label: 'Master Data Editor', description: 'Master data management and editing' },
      { route: '/data-schema', label: 'Data Schema View', description: 'Database schema visualization' },
      { route: '/maintenance', label: 'Maintenance', description: 'Equipment maintenance management' },
      { route: '/optimization-studio', label: 'Optimization Studio', description: 'Production optimization tools' },
      { route: '/design-studio', label: 'UI Design Studio', description: 'User interface design and customization' },
      { route: '/quality-control', label: 'Quality Control', description: 'Quality control and inspection' },
      { route: '/onboarding', label: 'Getting Started', description: 'System onboarding and getting started guide' },
      { route: '/training', label: 'Training', description: 'Training materials and resources' }
    ];
  }

  // Use AI to intelligently determine user intent and target route
  private async analyzeUserIntentWithAI(query: string): Promise<{ type: 'navigate' | 'show_data' | 'chat' | 'create_chart' | 'switch_agent' | 'show_jobs_table'; target?: string; agentId?: string; confidence: number; chartType?: string }> {
    const navigationMapping = await this.getNavigationMapping();
    const routes = Object.values(navigationMapping).map(page => ({
      route: page.path,
      label: page.name,
      description: page.description
    }));
    
    // Check for agent switching requests FIRST
    const agentSwitchKeywords = ['speak to', 'talk to', 'switch to', 'chat with', 'connect to', 'i want to speak', 'i want to talk', 'let me talk', 'can i speak'];
    const agentNames = {
      'production scheduling': 'production_scheduling',
      'production': 'production_scheduling',
      'scheduler': 'production_scheduling',
      'scheduling': 'production_scheduling',
      'shop floor': 'shop_floor',
      'quality': 'quality_analysis',
      'quality analysis': 'quality_analysis',
      'predictive maintenance': 'predictive_maintenance',
      'maintenance': 'predictive_maintenance'
    };
    
    const queryLower = query.toLowerCase();
    const hasAgentSwitchIntent = agentSwitchKeywords.some(keyword => queryLower.includes(keyword));
    
    if (hasAgentSwitchIntent) {
      // Try to identify which agent
      for (const [agentName, agentId] of Object.entries(agentNames)) {
        if (queryLower.includes(agentName)) {
          console.log(`[Max AI Intent] 🤖 AGENT SWITCH DETECTED! Agent: ${agentName} -> ${agentId}`);
          return { type: 'switch_agent', agentId, confidence: 0.95 };
        }
      }
    }
    
    // Check for table/grid requests for ANY entity - check FIRST before other data requests
    const tableKeywords = ['table', 'grid', 'list'];
    const entityKeywords = [
      'job', 'jobs', 
      'resource', 'resources', 'equipment', 'machine', 'machines',
      'operation', 'operations',
      'product', 'products', 'item', 'items',
      'material', 'materials',
      'work order', 'manufacturing order', 'production'
    ];
    const showKeywords = ['show', 'display', 'view', 'see', 'create'];
    
    const hasTableKeyword = tableKeywords.some(keyword => queryLower.includes(keyword));
    const hasEntityKeyword = entityKeywords.some(keyword => queryLower.includes(keyword));
    const hasShowKeyword = showKeywords.some(keyword => queryLower.includes(keyword));
    
    // Detect any table/grid/list request for entities
    if (hasTableKeyword && hasEntityKeyword && (hasShowKeyword || queryLower.includes('of'))) {
      // Determine which entity type is being requested
      let entityType = 'general';
      let tableName = '';
      
      if (queryLower.includes('job')) {
        entityType = 'jobs';
        tableName = 'ptjobs';
      } else if (queryLower.includes('resource') || queryLower.includes('equipment') || queryLower.includes('machine')) {
        entityType = 'resources';
        tableName = 'ptresources';
      } else if (queryLower.includes('operation')) {
        entityType = 'operations';
        tableName = 'ptoperations';
      } else if (queryLower.includes('product') || queryLower.includes('item')) {
        entityType = 'products';
        tableName = 'ptproducts';
      } else if (queryLower.includes('material')) {
        entityType = 'materials';
        tableName = 'ptmaterials';
      }
      
      console.log(`[Max AI Intent] 📊 TABLE/GRID DETECTED! Entity: ${entityType}, Query: "${query}"`);
      return { type: 'show_table', entityType, tableName, confidence: 0.95 };
    }
    
    // Also check for explicit phrases like "show jobs" or "show resources"
    const showPhrases = ['show jobs', 'show resources', 'show operations', 'show products', 'show materials'];
    for (const phrase of showPhrases) {
      if (queryLower.includes(phrase) && (queryLower.includes('table') || queryLower.includes('grid') || queryLower.includes('list'))) {
        const entityType = phrase.split(' ')[1];
        const tableMap: Record<string, string> = {
          'jobs': 'ptjobs',
          'resources': 'ptresources', 
          'operations': 'ptoperations',
          'products': 'ptproducts',
          'materials': 'ptmaterials'
        };
        console.log(`[Max AI Intent] 📊 TABLE/GRID DETECTED (explicit)! Entity: ${entityType}, Query: "${query}"`);
        return { type: 'show_table', entityType, tableName: tableMap[entityType], confidence: 0.95 };
      }
    }
    
    // Check for chart creation requests with more liberal matching
    const chartKeywords = ['chart', 'graph', 'visualization', 'pie chart', 'bar chart', 'line chart', 'gauge', 'kpi'];
    const createKeywords = ['create', 'show', 'make', 'generate', 'display', 'build'];
    const canvasKeywords = ['canvas', 'in the canvas', 'on canvas', 'to canvas'];
    
    const hasChartKeyword = chartKeywords.some(keyword => queryLower.includes(keyword));
    const hasCreateKeyword = createKeywords.some(keyword => queryLower.includes(keyword));
    const hasCanvasKeyword = canvasKeywords.some(keyword => queryLower.includes(keyword));
    
    console.log(`[Max AI Intent] Query: "${query}"`);
    console.log(`[Max AI Intent] Chart keywords found: ${hasChartKeyword}`);
    console.log(`[Max AI Intent] Create keywords found: ${hasCreateKeyword}`);
    console.log(`[Max AI Intent] Canvas keywords found: ${hasCanvasKeyword}`);
    
    // Enhanced detection: if query has "chart" OR "graph" AND ("show" OR "create" OR any create keyword OR "jobs")
    if ((hasChartKeyword || queryLower.includes("graph")) && (hasCreateKeyword || hasCanvasKeyword || queryLower.includes("jobs"))) {
      let chartType = 'bar'; // default to bar for better data display
      if (queryLower.includes('pie')) chartType = 'pie';
      else if (queryLower.includes('bar')) chartType = 'bar';
      else if (queryLower.includes('line')) chartType = 'line';
      else if (queryLower.includes('gauge')) chartType = 'gauge';
      else if (queryLower.includes('kpi')) chartType = 'kpi';
      
      console.log(`[Max AI Intent] 🎯 CHART CREATION DETECTED! Query: "${query}", Type: ${chartType}, Confidence: 0.95`);
      return { type: 'create_chart', confidence: 0.95, chartType };
    }
    
    // Enhanced check for data requests - specifically handle job questions
    const dataKeywords = ['status', 'how many', 'current', 'show data', 'what is', 'count', 'total'];
    const jobKeywords = ['job', 'jobs', 'operation', 'operations', 'order', 'orders', 'work'];
    
    const hasDataKeyword = dataKeywords.some(keyword => query.toLowerCase().includes(keyword));
    const hasJobKeyword = jobKeywords.some(keyword => query.toLowerCase().includes(keyword));
    
    if (hasDataKeyword || hasJobKeyword) {
      return { type: 'show_data', confidence: 0.9 };
    }
    
    // Check for navigation intent - be more inclusive
    const navigationKeywords = ['show me', 'show', 'take me to', 'go to', 'open', 'view', 'display', 'navigate to', 'see the', 'see', 'access'];
    const hasNavigationIntent = navigationKeywords.some(keyword => query.toLowerCase().includes(keyword));
    
    // Also check for direct page mentions (like "master production schedule")
    const directPageMentions = query.toLowerCase().includes('production schedule') || 
                              query.toLowerCase().includes('production scheduling') ||
                              query.toLowerCase().includes('scheduler') ||
                              query.toLowerCase().includes('master production') ||
                              query.toLowerCase().includes('control tower') ||
                              query.toLowerCase().includes('shop floor') ||
                              query.toLowerCase().includes('analytics') ||
                              query.toLowerCase().includes('capacity planning') ||
                              query.toLowerCase().includes('inventory optimization');
    
    if (hasNavigationIntent || directPageMentions) {
      // Use AI to find the best matching route
      const routeDescriptions = routes.map(r => `${r.route}: ${r.description} (${r.label})`).join('\n');
      
      try {
        const response = await openai.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: [
            {
              role: 'system', 
              content: `You are a route mapper for a manufacturing application. Given a user request, determine which route they want to navigate to.

Available routes:
${routeDescriptions}

Rules:
- If the user mentions any page/feature name, respond with the matching route path (e.g., "/capacity-planning")
- If they say "show me X" or "see X" they want to navigate to X
- If uncertain, respond with "NONE"
- Be flexible with language:
  * "production schedule", "production scheduling", "scheduler" = "/production-scheduler"
  * "master production schedule" = "/master-production-schedule"
  * "control tower" = "/control-tower"
  * "shop floor" = "/shop-floor"
  * "analytics" = "/analytics"
  * "capacity planning" = "/capacity-planning"
  * "inventory" = "/inventory-optimization"
- IMPORTANT: For production scheduling requests, always use "/production-scheduler"
- Always prefer navigation over explanation`
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.1,
          max_tokens: 50
        });
        
        const aiResponse = response.choices[0].message.content?.trim();
        
        if (aiResponse && aiResponse !== 'NONE' && routes.some(r => r.route === aiResponse)) {
          return { type: 'navigate', target: aiResponse, confidence: 0.9 };
        }
      } catch (error) {
        console.error('AI route mapping error:', error);
      }
    }
    
    // Default to chat
    return { type: 'chat', confidence: 0.5 };
  }

  // Generate contextual AI response based on user query and context
  async generateResponse(
    query: string, 
    context: MaxContext,
    options?: { 
      streaming?: boolean; 
      onChunk?: (chunk: string) => void;
      maxRetries?: number;
    }
  ): Promise<MaxResponse> {
    try {
        // Search for relevant playbooks FIRST to guide AI thinking
        const playbooks = await this.searchRelevantPlaybooks(query, context);
        
        // Analyze user intent using AI
        const intent = await this.analyzeUserIntentWithAI(query);
        
        // Handle create chart intent FIRST (before other processing)
        if (intent.type === 'create_chart' && intent.confidence > 0.7) {
          console.log(`[Max AI] Detected chart creation intent with confidence ${intent.confidence}`);
          return await this.handleCreateIntent(query, { intent: 'CREATE', chartType: intent.chartType }, context);
        }
        
        // Handle table/grid intent for any entity
        if ((intent.type === 'show_table' || intent.type === 'show_jobs_table') && intent.confidence > 0.7) {
          console.log(`[Max AI] Detected table intent for ${intent.entityType || 'jobs'} with confidence ${intent.confidence}`);
          
          // Handle backwards compatibility for old show_jobs_table intent
          if (intent.type === 'show_jobs_table') {
            return await this.getJobsTableData(query, context);
          }
          
          // Handle new generic table intent
          return await this.getEntityTableData(intent.entityType || 'jobs', intent.tableName || 'ptjobs', query, context);
        }
        
        // Handle agent switching intent
        if (intent.type === 'switch_agent' && intent.agentId && intent.confidence > 0.7) {
          const agentNames = {
            'production_scheduling': 'Production Scheduling Agent',
            'shop_floor': 'Shop Floor Agent',
            'quality_analysis': 'Quality Analysis Agent',
            'predictive_maintenance': 'Predictive Maintenance Agent'
          };
          const agentName = agentNames[intent.agentId as keyof typeof agentNames] || intent.agentId;
          
          console.log(`[Max AI] Detected agent switch intent: ${agentName}`);
          return {
            content: `Switching to ${agentName}...`,
            action: {
              type: 'switch_agent',
              agentId: intent.agentId
            }
          };
        }
        
        // If streaming is enabled, handle differently
        if (options?.streaming && options.onChunk) {
          // Stream the response chunks
          const streamedResponse = await this.getStreamedAIResponse(query, context, options.onChunk);
          if (streamedResponse) {
            return streamedResponse;
          }
        }
        
        // Use the new flexible AI response system with playbook guidance
        const flexibleResponse = await this.getAIFlexibleResponse(query, context, playbooks);
        if (flexibleResponse) {
          // Add playbook reasoning to response
          const reasoning = this.buildReasoningExplanation(query, playbooks, flexibleResponse.content);
          flexibleResponse.reasoning = reasoning;
          flexibleResponse.playbooksUsed = playbooks;
          
          // Track AI action for transparency
          await this.trackAIAction(context, query, flexibleResponse.content, playbooks);
          
          return flexibleResponse;
        }

        // Handle navigation intent
        if (intent.type === 'navigate' && intent.target && intent.confidence > 0.7) {
          return {
            content: `Taking you to ${intent.target.replace('/', '').replace('-', ' ')}...`,
            action: {
              type: 'navigate',
              target: intent.target
            }
          };
        }
        
        // Get conversation history
        const history = this.getConversationHistory(context.userId);
        
        // Add user message to history
        this.addToConversationHistory(context.userId, {
      role: 'user',
      content: query,
      timestamp: new Date()
        });
        
        // Get relevant memories for context
        const relevantMemories = await this.getRelevantMemories(context.userId, query);
        
        // Search for relevant playbooks to guide the response
        const responsePlaybooks = await this.searchRelevantPlaybooks(query, context);
        
        // Analyze conversation context
        const conversationContext = this.analyzeConversationContext(history);
        
        // Enrich context with real-time data
        const productionData = await this.getProductionStatus(context);
        const insights = await this.analyzeSchedule(context);
        
        // Handle data display intent with flexible AI analysis
        if (intent.type === 'show_data' && intent.confidence > 0.7) {
          const flexibleResponse = await this.getAIFlexibleResponse(query, context);
          if (flexibleResponse) {
            return flexibleResponse;
          }
          
          // Fallback to general production status
          return {
            content: this.formatProductionStatusResponse(productionData),
            action: {
              type: 'show_data',
              data: productionData
            },
            insights,
            suggestions: await this.getContextualSuggestions(context),
            data: productionData
          };
        }
        
        // Build context-aware prompt with conversation history, memories, and playbooks
        const systemPrompt = this.buildSystemPrompt(context, intent, relevantMemories, responsePlaybooks);
        const enrichedQuery = await this.enrichQuery(query, productionData, insights, context, conversationContext);

        // Only enable function calling for specific action queries
        const isActionQuery = query.toLowerCase().includes('reschedule') || 
                             query.toLowerCase().includes('create alert') ||
                             query.toLowerCase().includes('optimize schedule');
        
        // Build messages array with conversation history
        const messages: any[] = [
          { role: 'system', content: systemPrompt }
        ];
        
        // Add last 5 messages from history for context (excluding the current message we just added)
        const recentHistory = history.slice(-6, -1); // Get last 5 messages before current
        recentHistory.forEach(msg => {
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({ role: msg.role, content: msg.content });
          }
        });
        
        // Add the current enriched query
        messages.push({ role: 'user', content: enrichedQuery });
        
        const requestOptions: any = {
          model: DEFAULT_MODEL,
          messages,
          temperature: 0.2, // Lower temperature for more focused, concise responses
          max_tokens: 300 // Smaller token limit to enforce brevity
        };
        
        // Only add functions for action queries
        if (isActionQuery) {
          requestOptions.functions = this.getAvailableFunctions(context);
          requestOptions.function_call = 'auto';
        }
        
        const response = await openai.chat.completions.create(requestOptions);

        // Handle function calls if needed
        if (response.choices[0].message.function_call) {
          const result = await this.handleFunctionCall(
            response.choices[0].message.function_call,
            context
          );
        
          // Store assistant's response in history
          this.addToConversationHistory(context.userId, {
            role: 'assistant',
            content: result.content || '',
            timestamp: new Date(),
            context: {
              lastTopic: this.extractTopic(result.content || '')
            }
          });
          
          // Detect and store memory for function call responses too
          await this.detectAndStoreMemory(context.userId, query, result.content || '');
          
          return result;
        }

        const assistantContent = response.choices[0].message.content || '';
        
        // Store assistant's response in history
        this.addToConversationHistory(context.userId, {
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date(),
          context: {
            alertsOffered: assistantContent.includes('Would you like me to analyze the alerts?'),
            lastTopic: this.extractTopic(assistantContent)
          }
        });

        // Detect and store memory after successful response
        await this.detectAndStoreMemory(context.userId, query, assistantContent);
        
        // Build reasoning explanation
        const reasoning = this.buildReasoningExplanation(query, responsePlaybooks, assistantContent);
        
        // Track AI action for transparency
        await this.trackAIAction(context, query, assistantContent, responsePlaybooks);

        return {
          content: assistantContent,
          insights: insights.length > 0 ? insights : undefined,
          suggestions: await this.getContextualSuggestions(context),
          data: productionData,
          reasoning: reasoning,
          playbooksUsed: responsePlaybooks.length > 0 ? responsePlaybooks : undefined
        };
    } catch (error) {
      console.error('Max AI response generation error:', error);
      return {
        content: 'I encountered an error while processing your request. Please try again.',
        error: true
      };
    }
  }
  
  // New method for streaming AI responses
  private async getStreamedAIResponse(
    query: string, 
    context: MaxContext, 
    onChunk: (chunk: string) => void
  ): Promise<MaxResponse | null> {
    try {
      // Build context and messages similar to regular response
      const productionData = await this.getProductionStatus(context);
      const insights = await this.analyzeSchedule(context);
      const streamPlaybooks = await this.searchRelevantPlaybooks(query, context);
      const systemPrompt = this.buildSystemPrompt(context, undefined, undefined, streamPlaybooks);
      
      // Create streaming completion
      const stream = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: 1000,
        stream: true
      });
      
      let fullContent = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          onChunk(content);
        }
      }
      
      // Store in conversation history
      this.addToConversationHistory(context.userId, {
        role: 'assistant',
        content: fullContent,
        timestamp: new Date()
      });
      
      return {
        content: fullContent,
        insights: insights.length > 0 ? insights : undefined,
        suggestions: await this.getContextualSuggestions(context),
        data: productionData
      };
    } catch (error) {
      console.error('Streaming response error:', error);
      return null;
    }
  }

  // Format production status for direct data display
  private formatProductionStatusResponse(productionData: any): string {
    return `**Current Production Status:**

📊 **Active Jobs:** ${productionData.activeOrders}
⚡ **Running Operations:** ${productionData.runningOperations}  
📈 **Resource Utilization:** ${productionData.resourceUtilization.average}% average
🚨 **Critical Alerts:** ${productionData.criticalAlerts.length}

${productionData.summary}

${productionData.criticalAlerts.length > 0 ? `\n**Critical Issues:**\n${productionData.criticalAlerts.map((alert: any) => `• ${alert.title}`).join('\n')}` : ''}

Would you like me to analyze any specific area in detail?`;
  }

  // Build role and context-specific system prompt
  private buildSystemPrompt(
    context: MaxContext, 
    intent?: { type: string; target?: string; confidence: number }, 
    relevantMemories?: string,
    playbooks?: PlaybookReference[]
  ): string {
    // Build playbook context if available
    let playbookContext = '';
    if (playbooks && playbooks.length > 0) {
      playbookContext = '\n\n    PLAYBOOK GUIDANCE:\n';
      playbooks.forEach(pb => {
        playbookContext += `    - ${pb.title} (Relevance: ${Math.round(pb.relevance_score * 100)}%)\n`;
        if (pb.applied_rules && pb.applied_rules.length > 0) {
          pb.applied_rules.forEach(rule => {
            playbookContext += `      * ${rule}\n`;
          });
        }
      });
      playbookContext += '\n    Apply these playbook principles in your response.\n';
    }

    const basePrompt = `You are Max, an intelligent manufacturing assistant for PlanetTogether SCM + APS system. 
    You have deep knowledge of production scheduling, resource optimization, quality management, and supply chain operations.

    🚨 CRITICAL RESPONSE STRUCTURE - ALWAYS FOLLOW THIS FIRST:
    1. **INITIAL RESPONSE**: Maximum 2-3 sentences directly answering the question
    2. **OFFER MORE**: End with "Would you like details on [specific aspect]?" or "Need specifics about [topic]?"
    3. **PROGRESSIVE DETAIL**: Only provide extensive information when explicitly requested
    4. **BE CONCISE**: Initial response should take no more than 3 seconds to read aloud
    
    📝 FORMATTING RULES - CRITICAL:
    - **ANY LIST WITH 3+ ITEMS MUST USE BULLET POINTS** - This is MANDATORY, not optional
    - Format: "Here are the [items]:\n• Item 1\n• Item 2\n• Item 3"
    - NEVER use comma-separated lists for 3+ items ("Item 1, Item 2, Item 3" is FORBIDDEN)
    - Each bullet point MUST be on its own line
    - Use bullet character (•) exactly as shown
    - Short lists (1-2 items) can use inline format
    
    ✅ GOOD Example (with bullet list):
    "Production is at 87% with Line 2 delayed by 15 minutes. The bottleneck is Fermentation Tank B. Would you like details on recovery options?"
    
    ✅ GOOD Example (with bullet list for resources):
    "Here are the active resources:
• Grain Mill
• Mash Tun 1
• Lauter Tun
• Brew Kettle 1
• Fermenter Tank 1

All are located at the Main Brewery. Would you like details on any specific resource?"
    
    ❌ BAD Example (TOO LONG):
    "Production is currently running at 87% of the daily target. Looking at the detailed breakdown, Line 1 is performing exceptionally well at 95% efficiency, Line 2 is experiencing some challenges with a 15-minute delay due to material changeover operations that took longer than expected, and Line 3 is operating normally at standard capacity..."

    CRITICAL MANUFACTURING TERMINOLOGY:
    This is a MANUFACTURING SYSTEM, not a job board or HR system.
    - "jobs" or "production jobs" = manufacturing orders from ptjobs table, NOT employment/job openings
    - "operations" = manufacturing operations from ptjoboperations table, NOT business operations
    - "resources" or "equipment" = production resources/machinery from ptresources table, NOT human resources
    - Always interpret ALL queries in manufacturing/production context

    PLANETTOGETHER APPLICATION CONTEXT (ANSWER FROM THIS FIRST):
    This system uses specific PlanetTogether features and algorithms:
    
    Scheduling Algorithms Available:
    - ASAP (As Soon As Possible) - Forward scheduling from current time
    - ALAP (As Late As Possible) - Backward scheduling from due dates
    - Critical Path - Identifies critical operations and dependencies
    - Resource Leveling - Balances resource utilization across timeline
    - Drum/TOC (Theory of Constraints) - Focuses on bottleneck resources
    
    PT Features in Use:
    - Bryntum Scheduler Pro for Gantt chart visualization
    - PT Jobs table (ptjobs) for manufacturing orders
    - PT Job Operations (ptjoboperations) for operation details
    - PT Resources (ptresources) for equipment and machinery
    - PT Resource Capabilities (ptresourcecapabilities) for resource-operation matching
    - PT Manufacturing Orders for production planning
    - Drag-and-drop rescheduling with real-time validation
    
    Resource Allocation System (HOW IT WORKS):
    - Each resource in ptresources represents a piece of equipment/machine (e.g., "Milling Machine #1", "Fermentation Tank A")
    - Resources have capabilities stored in ptresourcecapabilities table linking resource_id to capability_id
    - Capability IDs map to specific manufacturing capabilities:
      * 1 = MILLING (cutting/shaping materials)
      * 2 = MASHING (mixing/crushing operations)
      * 5 = FERMENTATION (brewing/biological processes)
      * Plus other manufacturing capabilities
    - Operations are scheduled on resources that have the matching capabilities
    - Example: A "Milling" operation can only run on resources with capability_id=1 (MILLING)
    - The system validates drag-and-drop moves to ensure operations stay on capable resources
    - throughput_modifier in ptresourcecapabilities adjusts processing speed for each resource-capability pair
    
    ALWAYS PRIORITIZE PT APPLICATION CONTEXT:
    - When asked about algorithms or features, reference THE ACTUAL PT algorithms above
    - When asked about scheduling, reference PT scheduling capabilities (ASAP, ALAP, etc.)
    - When asked about resource allocation, explain the PT capability-based matching system above
    - When asked about resources, reference ptresources table and capability system
    - Only provide general manufacturing information if specifically asked OR if PT context doesn't apply
    
    ${relevantMemories ? `\n    PERSONAL CONTEXT:\n    ${relevantMemories}\n` : ''}
    ${playbookContext}
    
    REMEMBER THE RESPONSE STRUCTURE:
    - Every response starts with 2-3 sentences MAX
    - Always end with ONE specific offer for more details
    - NO LONG EXPLANATIONS unless user explicitly asks
    - Think "tweet-sized" for initial responses
    
    INTENT UNDERSTANDING:
    - ${intent?.type === 'navigate' ? `User wants to navigate to ${intent.target}. Help them get there.` : ''}
    - ${intent?.type === 'show_data' ? 'User wants to see production data. Show them specific metrics and numbers.' : ''}
    - ${intent?.type === 'chat' ? 'User wants conversational help. Provide insights and ask how you can help.' : ''}`;

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

  // Use AI flexibly to understand user intent and determine appropriate actions
  private async getAIFlexibleResponse(query: string, context: MaxContext, playbooks: PlaybookReference[] = [], agentTraining: any = null): Promise<MaxResponse | null> {
    try {
      // Build agent-specific context
      const agentContext = agentTraining ? `
AGENT CONTEXT:
You are the ${agentTraining.name} with the following capabilities and knowledge:

${agentTraining.rawContent}

Use this specialized knowledge to understand and respond to the user's request.
` : '';

      // Let AI understand the user's intent and decide what to do
      const intentResponse = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are Max, an intelligent manufacturing AI assistant. Analyze the user's request and determine what they want.

${agentContext}

${playbooks.length > 0 ? `PLAYBOOK GUIDANCE:
You have consulted the following playbooks to guide your understanding:
${playbooks.map(p => `- ${p.title} (${Math.round(p.relevance_score * 100)}% relevant)
  Applied rules: ${p.applied_rules?.join(', ') || 'General guidance'}`).join('\n')}

Use these playbooks to inform your decision-making while remaining flexible to the specific user request.
` : ''}

CRITICAL MANUFACTURING CONTEXT:
This is a MANUFACTURING SYSTEM, not a job board or HR system.
- "jobs" = production jobs (manufacturing orders), NOT job openings
- "operations" = manufacturing operations, NOT business operations
- "resources" = manufacturing resources/equipment, NOT human resources
- "orders" = manufacturing/production orders
- Always interpret queries in manufacturing/production context

Available actions you can take:
1. FETCH_DATA - if they want specific information from the system (e.g., "how many jobs", "list operations")
2. NAVIGATE - if they want to go to a specific page/feature  
3. ANALYZE - if they want analysis of current data
4. CREATE - if they want to create charts, widgets, or content (keywords: create, make, show, generate, chart, pie, bar, graph, visualization, plot)
5. EXECUTE - if they want to perform an action or modify data (keywords: move, reschedule, change, update, switch, assign, reallocate, shift)
6. HELP - if they need guidance or have questions
7. CHAT - for general conversation

IMPORTANT: 
- Any request containing words like "chart", "plot", "pie chart", "bar chart", "graph", "create chart", "show chart", "make chart", "generate chart" should ALWAYS be classified as CREATE intent.
- Any request containing action words like "move", "reschedule", "change", "update", "switch", "assign", "reallocate", "shift" should be classified as EXECUTE intent.
- Queries like "how many jobs", "show jobs", "list jobs" are about PRODUCTION JOBS (ptjobs), use FETCH_DATA or CREATE intent

Manufacturing system capabilities:
- Production data: jobs (ptjobs), operations (ptjoboperations), schedules, resources (ptresources)
- Sales data: orders, customers, delivery tracking
- Quality data: metrics, inspections, compliance
- Analytics: KPIs, trends, optimization insights
- System navigation: schedule views, dashboards, reports
- Chart creation: pie charts, bar charts, line charts for canvas

Respond with JSON:
{
  "intent": "FETCH_DATA|NAVIGATE|ANALYZE|CREATE|EXECUTE|HELP|CHAT",
  "target": "specific endpoint or page if applicable",
  "reasoning": "brief explanation of what the user wants",
  "query_type": "what kind of information or action they're seeking"
}`
          },
          {
            role: 'user',
            content: `User request: "${query}"\nContext: Currently on ${context.currentPage} as ${context.userRole}`
          }
        ],
        temperature: 0.2,
        max_tokens: 200,
        response_format: { type: "json_object" }
      });
      
      const intent = JSON.parse(intentResponse.choices[0].message.content || '{}');
      console.log(`[Max AI] Intent analysis result:`, intent);
      
      // Handle the intent flexibly
      if (intent.intent === 'FETCH_DATA') {
        return await this.handleDataFetchIntent(query, intent, context);
      } else if (intent.intent === 'NAVIGATE') {
        return await this.handleNavigationIntent(query, intent, context);
      } else if (intent.intent === 'ANALYZE') {
        const analysisResponse = await this.handleAnalysisIntent(query, intent, context, playbooks);
        if (analysisResponse) {
          // Add playbook reasoning to response
          const reasoning = this.buildReasoningExplanation(query, playbooks, analysisResponse.content);
          analysisResponse.reasoning = reasoning;
          analysisResponse.playbooksUsed = playbooks;
          
          // Track AI action for transparency
          await this.trackAIAction(context, query, analysisResponse.content, playbooks);
        }
        return analysisResponse;
      } else if (intent.intent === 'CREATE') {
        console.log(`[Max AI] 🔧 CREATE intent detected, routing to handleCreateIntent for query: "${query}"`);
        return await this.handleCreateIntent(query, intent, context);
      } else if (intent.intent === 'EXECUTE') {
        console.log(`[Max AI] ⚡ EXECUTE intent detected, routing to handleExecuteIntent for query: "${query}"`);
        return await this.handleExecuteIntent(query, intent, context, agentTraining);
      } else {
        // Let the main AI response handle HELP and CHAT
        return null;
      }
      
    } catch (error) {
      console.error('Error with AI flexible response:', error);
      return null;
    }
  }

  // Auto-discovery mechanism for navigation pages
  private async discoverAvailablePages(): Promise<Record<string, {path: string, name: string, description: string, keywords: string[]}>> {
    const fs = await import('fs');
    const path = await import('path');
    
    const discoveredPages: Record<string, {path: string, name: string, description: string, keywords: string[]}> = {};
    
    try {
      const pagesDir = path.join(process.cwd(), 'client/src/pages');
      
      if (fs.existsSync(pagesDir)) {
        const pageFiles = fs.readdirSync(pagesDir)
          .filter(file => file.endsWith('.tsx') && !file.includes('.backup'))
          .map(file => file.replace('.tsx', ''));
        
        for (const pageFile of pageFiles) {
          // Convert file name to route path and readable name
          const routePath = `/${pageFile.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')}`;
          const readableName = pageFile
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
          
          // Create intelligent descriptions based on page names
          let description = `${readableName} page and functionality`;
          const keywords = [readableName.toLowerCase(), ...readableName.toLowerCase().split(' ')];
          
          // Add specific descriptions for known page types
          if (pageFile.toLowerCase().includes('dashboard')) {
            description = `${readableName} with overview and analytics`;
            keywords.push('overview', 'summary', 'metrics', 'analytics');
          } else if (pageFile.toLowerCase().includes('schedule')) {
            description = `${readableName} for planning and scheduling`;
            keywords.push('planning', 'timeline', 'calendar', 'schedule');
          } else if (pageFile.toLowerCase().includes('master-data')) {
            description = `${readableName} for managing system data`;
            keywords.push('data', 'management', 'configuration', 'setup');
          } else if (pageFile.toLowerCase().includes('report')) {
            description = `${readableName} and analytics reports`;
            keywords.push('reports', 'analytics', 'insights', 'metrics');
          } else if (pageFile.toLowerCase().includes('optimization')) {
            description = `${readableName} and performance optimization`;
            keywords.push('optimization', 'performance', 'efficiency', 'improvement');
          } else if (pageFile.toLowerCase().includes('planning')) {
            description = `${readableName} and strategic planning`;
            keywords.push('planning', 'strategy', 'forecasting', 'preparation');
          }
          
          discoveredPages[pageFile.toLowerCase()] = {
            path: routePath,
            name: readableName,
            description,
            keywords
          };
        }
      }
    } catch (error) {
      console.error('Error discovering pages:', error);
    }
    
    return discoveredPages;
  }

  // Static navigation mappings for commonly used pages with specific paths
  private getStaticNavigationMapping(): Record<string, {path: string, name: string, description: string, keywords: string[]}> {
    return {
      'home': {
        path: '/',
        name: 'Home Dashboard',
        description: 'main dashboard with overview and key metrics',
        keywords: ['home', 'main', 'dashboard', 'overview', 'start']
      },
      'mobile-home': {
        path: '/mobile-home',
        name: 'Mobile Home',
        description: 'mobile optimized home dashboard',
        keywords: ['mobile', 'home', 'dashboard']
      },
      'dashboard': {
        path: '/dashboard',
        name: 'Dashboard',
        description: 'primary dashboard with analytics and insights',
        keywords: ['dashboard', 'analytics', 'metrics', 'overview']
      },
      'analytics': {
        path: '/analytics',
        name: 'Analytics',
        description: 'data analytics and reporting dashboard',
        keywords: ['analytics', 'data', 'reports', 'insights', 'metrics']
      },
      'production-schedule': {
        path: '/production-scheduler',
        name: 'Production Scheduler',
        description: 'advanced production scheduling with Gantt chart and timeline management',
        keywords: ['schedule', 'production', 'planning', 'timeline', 'gantt', 'scheduler', 'pro']
      },
      'shift-management': {
        path: '/shift-management',
        name: 'Shift Management',
        description: 'workforce shift planning and scheduling',
        keywords: ['shift', 'schedule', 'workforce', 'planning', 'shifts']
      },
      'capacity-planning': {
        path: '/capacity-planning',
        name: 'Capacity Planning',
        description: 'resource capacity planning and optimization',
        keywords: ['capacity', 'planning', 'resources', 'optimization']
      },
      'optimization-studio': {
        path: '/optimization-studio',
        name: 'Optimization Studio',
        description: 'advanced optimization tools and scenarios',
        keywords: ['optimization', 'studio', 'advanced', 'scenarios']
      },
      'master-data': {
        path: '/master-data',
        name: 'Master Data',
        description: 'master data management and configuration',
        keywords: ['master', 'data', 'management', 'configuration', 'setup']
      },
      'visual-factory': {
        path: '/visual-factory',
        name: 'Visual Factory',
        description: 'visual factory displays and monitoring',
        keywords: ['visual', 'factory', 'displays', 'monitoring']
      },
      'business-goals': {
        path: '/business-goals',
        name: 'Business Goals',
        description: 'business objectives and goal tracking',
        keywords: ['business', 'goals', 'objectives', 'targets', 'kpi']
      },
      'alerts': {
        path: '/alerts',
        name: 'Alerts',
        description: 'system alerts and notifications management',
        keywords: ['alerts', 'notifications', 'warnings', 'issues']
      },
      'boards': {
        path: '/boards',
        name: 'Kanban Boards',
        description: 'kanban boards and workflow management',
        keywords: ['kanban', 'boards', 'workflow', 'tasks', 'cards']
      },
      'reports': {
        path: '/reports',
        name: 'Reports',
        description: 'comprehensive reporting and analysis',
        keywords: ['reports', 'reporting', 'analysis', 'data']
      },
      'settings': {
        path: '/settings',
        name: 'Settings',
        description: 'system settings and configuration',
        keywords: ['settings', 'configuration', 'preferences', 'setup']
      }
    };
  }

  // Combined navigation mapping with auto-discovery (CACHED with concurrency safety)
  private async getNavigationMapping(): Promise<Record<string, {path: string, name: string, description: string, keywords: string[]}>> {
    // Check cache first
    const now = Date.now();
    if (this.navigationCache && (now - this.navigationCache.timestamp) < this.CACHE_TTL) {
      return this.navigationCache.data;
    }

    // If already fetching, return the pending promise to avoid duplicate work
    if (this.navigationPromise) {
      return this.navigationPromise;
    }

    // Start new fetch and store promise
    this.navigationPromise = (async () => {
      try {
        const staticMapping = this.getStaticNavigationMapping();
        const discoveredMapping = await this.discoverAvailablePages();
        
        // Log navigation discovery results (only when cache miss)
        const discoveredCount = Object.keys(discoveredMapping).length;
        const staticCount = Object.keys(staticMapping).length;
        const totalCount = staticCount + discoveredCount - Object.keys(staticMapping).filter(key => discoveredMapping[key]).length;
        
        console.log(`[Max AI] Navigation Discovery (Cache Miss):
  ✅ Static navigation routes: ${staticCount}
  🔍 Auto-discovered pages: ${discoveredCount}
  📍 Total pages available: ${totalCount}`);
        
        if (discoveredCount > 10) {
          const samplePages = Object.keys(discoveredMapping).slice(0, 10).map(k => discoveredMapping[k].path);
          console.log(`[Max AI] Sample discovered pages:`, samplePages, `... and ${discoveredCount - 10} more`);
        }
        
        // Merge mappings (static takes priority)
        const result = { ...discoveredMapping, ...staticMapping };
        
        // Cache result
        this.navigationCache = { data: result, timestamp: Date.now() };
        
        return result;
      } finally {
        // Clear promise after completion
        this.navigationPromise = null;
      }
    })();

    return this.navigationPromise;
  }

  // Auto-discovery mechanism for new data types
  private async discoverAdditionalDataTypes(): Promise<Record<string, {method: string, description: string, keywords: string[]}>> {
    const { storage } = await import('../storage');
    const discoveredTypes: Record<string, {method: string, description: string, keywords: string[]}> = {};
    
    // Get all methods from storage that start with 'get' and return Promise<array>
    const storageMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(storage))
      .filter(method => method.startsWith('get') && typeof (storage as any)[method] === 'function');
    
    for (const method of storageMethods) {
      // Convert method name to endpoint format (e.g., 'getJobTemplates' -> 'job-templates')
      const dataType = method
        .replace(/^get/, '')  // Remove 'get' prefix
        .replace(/([A-Z])/g, '-$1')  // Add dash before capital letters
        .toLowerCase()  // Convert to lowercase
        .replace(/^-/, '');  // Remove leading dash
      
      // Skip if already in our main mapping
      const mainMapping = this.getStaticDataTypeMapping();
      if (mainMapping[dataType]) {
        continue;
      }
      
      // Create automatic description based on method name
      const cleanName = method.replace(/^get/, '').replace(/([A-Z])/g, ' $1').toLowerCase().trim();
      discoveredTypes[dataType] = {
        method,
        description: `${cleanName} data and information`,
        keywords: [cleanName, ...cleanName.split(' ')]
      };
    }
    
    return discoveredTypes;
  }

  // Comprehensive data type mapping - automatically includes ALL available data types  
  private getStaticDataTypeMapping(): Record<string, {method: string, description: string, keywords: string[]}> {
    return {
      'plants': {
        method: 'getPlants',
        description: 'manufacturing facilities, locations, plant information',
        keywords: ['plant', 'facility', 'location', 'factory', 'site']
      },
      'departments': {
        method: 'getDepartments', 
        description: 'organizational departments, business units',
        keywords: ['department', 'division', 'unit', 'organization']
      },
      'capabilities': {
        method: 'getCapabilities',
        description: 'resource capabilities, skills, functions',
        keywords: ['capability', 'skill', 'function', 'ability']
      },
      'resources': {
        method: 'getResources',
        description: 'machines, equipment, workstations, assets',
        keywords: ['resource', 'machine', 'equipment', 'asset', 'workstation']
      },
      'jobs': {
        method: 'getJobs',
        description: 'production jobs, work orders, manufacturing orders',
        keywords: ['job', 'order', 'work order', 'production order']
      },
      'production-orders': {
        method: 'getProductionOrders',
        description: 'production orders, manufacturing orders',
        keywords: ['production order', 'manufacturing order', 'order']
      },
      'pt-jobs': {
        method: 'getPtJobs',
        description: 'PlanetTogether jobs, PT job data',
        keywords: ['pt job', 'planettogether job']
      },
      'pt-manufacturing-orders': {
        method: 'getPtManufacturingOrders',
        description: 'PlanetTogether manufacturing orders',
        keywords: ['pt manufacturing order', 'pt order']
      },
      'pt-operations': {
        method: 'getPtJobOperations',
        description: 'PlanetTogether operations, PT operations',
        keywords: ['pt operation', 'planettogether operation']
      },
      'pt-resources': {
        method: 'getPtResources',
        description: 'PlanetTogether resources, PT resources',
        keywords: ['pt resource', 'planettogether resource']
      },
      'planned-orders': {
        method: 'getPlannedOrders',
        description: 'planned production orders, future orders',
        keywords: ['planned order', 'future order', 'planned production']
      },
      'operations': {
        method: 'getOperations',
        description: 'manufacturing operations, tasks, processes',
        keywords: ['operation', 'task', 'process', 'activity']
      },
      'dependencies': {
        method: 'getDependencies',
        description: 'operation dependencies, task relationships',
        keywords: ['dependency', 'relationship', 'prerequisite']
      },
      'resource-requirements': {
        method: 'getResourceRequirements',
        description: 'resource requirements, capacity needs',
        keywords: ['resource requirement', 'capacity requirement', 'resource need']
      },
      'resource-views': {
        method: 'getResourceViews',
        description: 'resource view configurations, display settings',
        keywords: ['resource view', 'view configuration']
      },
      'custom-text-labels': {
        method: 'getCustomTextLabels',
        description: 'custom text labels, UI customizations',
        keywords: ['label', 'text label', 'custom label']
      },
      'kanban-configs': {
        method: 'getKanbanConfigs',
        description: 'kanban board configurations, workflow settings',
        keywords: ['kanban', 'board configuration', 'workflow']
      },
      'report-configs': {
        method: 'getReportConfigs',
        description: 'report configurations, reporting settings',
        keywords: ['report', 'report config', 'reporting']
      },
      'dashboard-configs': {
        method: 'getDashboardConfigs',
        description: 'dashboard configurations, display settings',
        keywords: ['dashboard', 'dashboard config']
      },
      'schedule-scenarios': {
        method: 'getScheduleScenarios',
        description: 'scheduling scenarios, what-if analysis',
        keywords: ['schedule scenario', 'scenario', 'what-if']
      },
      'system-users': {
        method: 'getSystemUsers',
        description: 'system users, user accounts',
        keywords: ['system user', 'user account', 'account']
      },
      'system-environments': {
        method: 'getSystemEnvironments',
        description: 'system environments, deployment environments',
        keywords: ['environment', 'system environment']
      },
      'capacity-scenarios': {
        method: 'getCapacityPlanningScenarios',
        description: 'capacity planning scenarios, capacity analysis',
        keywords: ['capacity scenario', 'capacity planning', 'capacity analysis']
      },
      'business-goals': {
        method: 'getBusinessGoals',
        description: 'business goals, objectives, targets',
        keywords: ['goal', 'business goal', 'objective', 'target']
      },
      'disruptions': {
        method: 'getDisruptions',
        description: 'production disruptions, incidents, issues',
        keywords: ['disruption', 'incident', 'issue', 'problem']
      },
      'alerts': {
        method: 'getAlerts',
        description: 'system alerts, notifications, warnings',
        keywords: ['alert', 'notification', 'warning', 'alarm']
      },
      'customers': {
        method: 'getCustomers',
        description: 'customer information, client data',
        keywords: ['customer', 'client', 'buyer']
      },
      'vendors': {
        method: 'getVendors',
        description: 'vendor information, supplier data',
        keywords: ['vendor', 'supplier', 'partner']
      },
      'sales-orders': {
        method: 'getSalesOrders',
        description: 'sales orders, customer orders',
        keywords: ['sales order', 'customer order']
      },
      'users': {
        method: 'getUsers',
        description: 'application users, personnel',
        keywords: ['user', 'person', 'personnel', 'employee']
      },
      'roles': {
        method: 'getRoles',
        description: 'user roles, permissions, access levels',
        keywords: ['role', 'permission', 'access level']
      },
      'recipes': {
        method: 'getRecipes',
        description: 'production recipes, formulations, processes',
        keywords: ['recipe', 'formulation', 'formula', 'process']
      },
      'stock-items': {
        method: 'getStockItems',
        description: 'inventory items, stock, materials',
        keywords: ['stock', 'inventory', 'material', 'item']
      },
      'stock-balances': {
        method: 'getStockBalances',
        description: 'current stock levels, inventory balances',
        keywords: ['stock balance', 'inventory level', 'stock level']
      },
      'demand-forecasts': {
        method: 'getDemandForecasts',
        description: 'demand forecasts, sales predictions',
        keywords: ['demand forecast', 'forecast', 'prediction']
      }
    };
  }

  // Combined data mapping - includes both static and dynamically discovered types (CACHED with concurrency safety)
  private async getDataTypeMapping(): Promise<Record<string, {method: string, description: string, keywords: string[]}>> {
    // Check cache first
    const now = Date.now();
    if (this.dataTypesCache && (now - this.dataTypesCache.timestamp) < this.CACHE_TTL) {
      return this.dataTypesCache.data;
    }

    // If already fetching, return the pending promise to avoid duplicate work
    if (this.dataTypesPromise) {
      return this.dataTypesPromise;
    }

    // Start new fetch and store promise
    this.dataTypesPromise = (async () => {
      try {
        const staticMapping = this.getStaticDataTypeMapping();
        const discoveredMapping = await this.discoverAdditionalDataTypes();
        
        // Log discovered types for visibility (only when cache miss)
        const discoveredCount = Object.keys(discoveredMapping).length;
        const staticCount = Object.keys(staticMapping).length;
        const totalCount = staticCount + discoveredCount;
        
        console.log(`[Max AI] Data Access (Cache Miss):
  ✅ Static data types: ${staticCount}
  🔍 Auto-discovered types: ${discoveredCount}
  📊 Total data types available: ${totalCount}`);
        
        if (discoveredCount > 0) {
          console.log(`[Max AI] Auto-discovered data types:`, Object.keys(discoveredMapping).map(k => `/api/${k}`));
        }
        
        // Merge static and discovered mappings (static takes priority)
        const result = { ...discoveredMapping, ...staticMapping };
        
        // Cache result
        this.dataTypesCache = { data: result, timestamp: Date.now() };
        
        return result;
      } finally {
        // Clear promise after completion
        this.dataTypesPromise = null;
      }
    })();

    return this.dataTypesPromise;
  }

  private async handleDataFetchIntent(query: string, intent: any, context: MaxContext): Promise<MaxResponse | null> {
    try {
      // Special handling for "which jobs are on resource X" queries
      // Pattern 1: "which jobs/operations/orders are on resource X"
      const resourceQueryPattern1 = /(?:which|what|show|list).*(?:jobs?|operations?|orders?).*(?:on|at|in|scheduled on|assigned to).*?([\w\s-]+)/i;
      // Pattern 2: "which resources are scheduled on X" (really asking "what's scheduled on resource X")
      const resourceQueryPattern2 = /(?:which|what|show|list).*resources?.*(?:scheduled|assigned|running).*(?:on|at|in).*?([\w\s-]+)/i;
      
      let match = query.match(resourceQueryPattern1) || query.match(resourceQueryPattern2);
      
      if (match) {
        const resourceName = match[1].trim();
        console.log(`[Max AI] Detected resource-specific query for resource: "${resourceName}"`);
        
        const jobs = await this.findJobsOnResource(resourceName);
        
        if (jobs.length === 0) {
          return {
            content: `I checked the schedule and found no jobs currently scheduled on "${resourceName}". This could mean the resource is available or the name might not match exactly. Would you like me to show you all active resources?`,
            error: false
          };
        }
        
        // Use AI to format the response naturally
        const analysisResponse = await openai.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are Max, a manufacturing AI assistant. Format the job data concisely.

RESPONSE FORMAT:
- List each job with its operation name and time window
- Be specific and brief (3-5 sentences max)
- Use this format: "Job [Name]: [Operation] scheduled from [Start] to [End]"
- If multiple operations from same job, group them together`
            },
            {
              role: 'user',
              content: `User asked: "${query}"

Found ${jobs.length} operations on the "${resourceName}":
${JSON.stringify(jobs, null, 2)}

Format this as a clear, concise response.`
            }
          ],
          temperature: DEFAULT_TEMPERATURE,
          max_tokens: 500
        });
        
        return {
          content: analysisResponse.choices[0].message.content || `Found ${jobs.length} job(s) scheduled on ${resourceName}.`,
          error: false
        };
      }
      
      const dataMapping = await this.getDataTypeMapping();
      
      // Create dynamic endpoint list for AI
      const availableEndpoints = Object.entries(dataMapping).map(([key, value]) => 
        `- /api/${key} - ${value.description}`
      ).join('\n');

      // Use AI to determine the most relevant data endpoint
      const dataResponse = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a data fetching assistant for a MANUFACTURING SYSTEM. Based on the user's query, determine what API endpoint to call.

Available endpoints:
${availableEndpoints}

MANUFACTURING TERMINOLOGY CONTEXT:
- "jobs" = production jobs (ptjobs) - manufacturing orders, NOT job openings
- "operations" = manufacturing operations (ptjoboperations)
- "resources" = manufacturing resources/equipment (ptresources)
- "orders" = manufacturing orders (ptmanufacturingorders)
- "stock" = inventory/stock items (stock_items)

When user mentions:
- "jobs" or "production jobs" → use /api/jobs endpoint
- "job quantities" or "how many items" → use /api/operations endpoint (quantities are in required_finish_qty)
- "operations" → use /api/operations or /api/pt-operations endpoints
- "resources" or "equipment" → use /api/resources or /api/pt-resources endpoints
- Always interpret queries in manufacturing/production context

DATA STRUCTURE KNOWLEDGE:
- Job quantities are stored at operation level (ptjoboperations.required_finish_qty)
- To get job quantity, sum all operation quantities for that job
- Jobs table has NO quantity field - it's in operations table

Respond with just the endpoint path (e.g., "/api/jobs") or "NONE" if no specific data is needed.
Focus on the most relevant data type that would answer the user's question.`
          },
          {
            role: 'user',
            content: `User query: "${query}"\nIntent reasoning: ${intent.reasoning}`
          }
        ],
        temperature: 0.1,
        max_tokens: 50
      });

      const endpoint = dataResponse.choices[0].message.content?.trim();
      
      if (endpoint && endpoint !== 'NONE' && endpoint.startsWith('/api/')) {
        // Import storage to access data directly instead of HTTP requests
        const { storage } = await import('../storage');
        
        // Extract data type from endpoint
        const dataType = endpoint.replace('/api/', '');
        const mapping = dataMapping[dataType];
        
        let data: any[] = [];
        
        if (mapping && typeof (storage as any)[mapping.method] === 'function') {
          // Dynamically call the appropriate storage method
          try {
            data = await (storage as any)[mapping.method]();
          } catch (error) {
            console.error(`Error calling ${mapping.method}:`, error);
            data = [];
          }
        } else {
          console.warn(`No mapping found for endpoint: ${endpoint}`);
          data = [];
        }
        
        // Let AI analyze and format the response naturally
        const analysisResponse = await openai.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are Max, a manufacturing AI assistant. The user asked a question and we retrieved data to help answer it. 

CRITICAL RESPONSE RULES:
1. Keep responses SHORT (2-4 sentences max)
2. Answer DIRECTLY - no essays or long explanations
3. If data is missing, say it in ONE sentence and suggest where to find it
4. Give specific numbers when available
5. NO recommendations or advice unless explicitly asked

DATA RELATIONSHIPS TO UNDERSTAND:
- Job quantities: Sum of required_finish_qty from operations (ptjoboperations table)
- If job data has no quantity field, the data is in the related operations table
- Resource utilization: Calculated from active operations on resources

Guidelines:
- Be natural and conversational but BRIEF
- Give specific numbers and facts
- Use emojis sparingly (max 1-2)
- If data is empty or missing, explain in ONE sentence what's missing`
            },
            {
              role: 'user',
              content: `Original question: "${query}"

Retrieved data (showing ${Math.min(data.length, 50)} of ${data.length} records): ${JSON.stringify(data.slice(0, 50), null, 2)}
Total records: ${data.length}

IMPORTANT: The data above may be a sample. Analyze the FULL dataset shown (all ${data.length} records) to answer accurately, especially for filtering/counting queries.

Please answer their question using this data.`
            }
          ],
          temperature: DEFAULT_TEMPERATURE,
          max_tokens: 400
        });
        
        return {
          content: analysisResponse.choices[0].message.content || 'Data retrieved successfully.',
          action: {
            type: 'show_data',
            data: { results: data, total: data.length, endpoint }
          }
        };
      }
      
    } catch (error) {
      console.error('Error handling data fetch intent:', error);
    }
    
    return null;
  }

  private async handleNavigationIntent(query: string, intent: any, context: MaxContext): Promise<MaxResponse | null> {
    // Use auto-discovered navigation mapping
    const navigationMapping = await this.getNavigationMapping();
    
    try {
      // Create list of available pages for AI
      const availablePages = Object.entries(navigationMapping).map(([key, page]) => 
        `${page.path} - ${page.description}`
      ).join('\n');

      const navResponse = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a navigation assistant. Based on the user's request, determine the best page to navigate to.

Available pages:
${availablePages}

IMPORTANT RULES:
- For "production schedule", "production scheduling", "scheduler" requests → use "/production-scheduler"
- For other requests, match to the most relevant available page
- Respond with just the route path (e.g., "/production-scheduler") or "NONE" if no navigation is needed
- Focus on the most relevant page that matches the user's intent`
          },
          {
            role: 'user',
            content: `User wants: "${query}"\nReasoning: ${intent.reasoning}`
          }
        ],
        temperature: 0.1,
        max_tokens: 50
      });

      const route = navResponse.choices[0].message.content?.trim();
      console.log(`Max AI Navigation Debug: Query="${query}", AI suggested route="${route}"`);
      
      if (route && route !== 'NONE' && route.startsWith('/')) {
        // Find the page info for a better response message
        const pageInfo = Object.values(navigationMapping).find(p => p.path === route);
        let pageName = pageInfo?.name || route.replace('/', '').replace('-', ' ');
        
        // Special handling for HTML files to show cleaner names
        if (route === '/production-scheduler') {
          pageName = 'Production Scheduler';
        }
        
        return {
          content: `Taking you to ${pageName}...`,
          action: {
            type: 'navigate',
            target: route
          }
        };
      }
      
    } catch (error) {
      console.error('Error handling navigation intent:', error);
    }
    
    return null;
  }

  private async handleAnalysisIntent(query: string, intent: any, context: MaxContext, playbooks: PlaybookReference[] = []): Promise<MaxResponse | null> {
    // Get current production data for analysis
    const productionData = await this.getProductionStatus(context);
    
    try {
      const analysisResponse = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are Max, a manufacturing analytics AI. Provide insightful analysis based on the user's request and available data.

${playbooks.length > 0 ? `PLAYBOOK GUIDANCE:
${playbooks.map(p => `- ${p.title}: ${p.applied_rules?.join(', ') || 'Apply relevant best practices'}`).join('\n')}

Apply these playbook guidelines while maintaining flexibility for the specific context.\n` : ''}

Focus on:
- Production efficiency and bottlenecks
- Resource utilization and optimization
- Schedule adherence and delivery performance
- Quality metrics and compliance
- Cost optimization opportunities

Be specific and actionable in your recommendations.`
          },
          {
            role: 'user',
            content: `User wants analysis: "${query}"
            
Current production data: ${JSON.stringify(productionData, null, 2)}

Provide analysis and recommendations.`
          }
        ],
        temperature: 0.4,
        max_tokens: 500
      });
      
      return {
        content: analysisResponse.choices[0].message.content || 'Analysis complete.',
        action: {
          type: 'show_data',
          data: productionData
        }
      };
      
    } catch (error) {
      console.error('Error handling analysis intent:', error);
    }
    
    return null;
  }

  private async handleCreateIntent(query: string, intent: any, context: MaxContext): Promise<MaxResponse | null> {
    try {
      console.log(`[Max AI] CREATE Intent detected for query: "${query}"`);
      
      // Check if this is a chart creation request
      const isChartRequest = query.toLowerCase().includes('chart') || 
                           query.toLowerCase().includes('pie') || 
                           query.toLowerCase().includes('bar') || 
                           query.toLowerCase().includes('line') ||
                           query.toLowerCase().includes('graph') ||
                           query.toLowerCase().includes('plot') ||
                           query.toLowerCase().includes('create') ||
                           query.toLowerCase().includes('make') ||
                           query.toLowerCase().includes('show') ||
                           query.toLowerCase().includes('generate');

      console.log(`[Max AI] Is chart request: ${isChartRequest}`);

      if (isChartRequest) {
        // Use new AI-powered dynamic chart generation system
        console.log(`[Max AI] Using dynamic chart generation for query: "${query}"`);
        return await this.getDynamicChart(query, context);
      }
      
      return {
        content: `I'd be happy to help you create something! Could you specify what you'd like me to create? For charts, try asking while you're on the canvas page.`,
        action: {
          type: 'navigate',
          target: '/canvas'
        }
      };
      
    } catch (error) {
      console.error('Error handling create intent:', error);
      return {
        content: 'I encountered an error while trying to create that for you. Please try again.',
        error: true
      };
    }
  }

  private async handleExecuteIntent(query: string, intent: any, context: MaxContext, agentTraining: any = null): Promise<MaxResponse | null> {
    try {
      console.log(`[Max AI] EXECUTE Intent detected for query: "${query}"`);
      console.log(`[Max AI] Agent training available: ${!!agentTraining}`);
      
      // If no agent training provided, load Production Scheduling Agent training
      if (!agentTraining) {
        console.log('[Max AI] No agent training provided, loading Production Scheduling Agent training for execution');
        agentTraining = agentTrainingLoader.getTraining('production_scheduling');
        
        if (!agentTraining) {
          console.error('[Max AI] Failed to load Production Scheduling Agent training');
          return {
            content: "I'm having trouble loading the scheduling agent configuration. Please try again or switch to the Production Scheduling Agent manually.",
            action: {
              type: 'navigate',
              target: '/production-scheduler'
            }
          };
        }
        console.log('[Max AI] Successfully loaded Production Scheduling Agent training for execution');
      }

      // Use OpenAI function calling to extract action parameters
      const actionResponse = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are the ${agentTraining.name}. The user wants you to perform an action.

${agentTraining.rawContent}

Extract the action parameters from the user's request. Identify:
1. What action to perform (move_operation, reschedule_operation, change_resource, etc.)
2. Which operation(s) or job(s) are affected (be specific, don't include resource names in this field)
3. For MOVE operations: Carefully distinguish between source and target:
   - If request says "move X FROM Y" or "move operations from Y", then Y is the SOURCE resource
   - If request says "move X OFF Y" or "move X away from Y", then Y is the SOURCE (what to move FROM)
   - If request says "move X TO Y" or "move X onto Y", then Y is the TARGET (what to move TO)
   - Set source_resource when moving FROM something (extract just the resource name, e.g., "fermented tank 2")
   - Set target_resource when moving TO something (extract just the resource name)
   - For "move all operations from X to Y": affected_items should be "all operations", source_resource should be X, target_resource should be Y
4. For RESCHEDULE operations: Extract the EXACT date/time string from the user's message:
   - Look for ANY date reference in the user's request (e.g., "September 5th", "Sept 5 at 2pm", "tomorrow", "next Monday")
   - Copy the EXACT date string to the target_date field AS-IS
   - Do NOT try to parse or convert the date - just copy the exact text
   - Example: If user says "to September 5th", put "September 5th" in target_date
   - Example: If user says "on March 1st", put "March 1st" in target_date

Respond with JSON format:
{
  "action_type": "move_operation" | "reschedule_operation" | etc,
  "affected_items": { "description": "which operations/jobs", "filter": "search terms" },
  "source_resource": "resource to move FROM (for move operations)" OR null,
  "target_resource": "resource to move TO (for move operations)" OR null,
  "target_date": "new date/time string (for reschedule operations)" OR null,
  "reasoning": "what the user wants to do",
  "suggested_steps": ["step 1", "step 2"]
}`
          },
          {
            role: 'user',
            content: `User request: "${query}"\n\nExtract the action details carefully distinguishing source vs target resources. Respond with JSON.`
          }
        ],
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const aiContent = actionResponse.choices[0].message.content || '{}';
      console.log(`[Max AI] Raw AI response for action extraction:`, aiContent);
      
      const actionDetails = JSON.parse(aiContent);
      console.log(`[Max AI] Parsed action details:`, JSON.stringify(actionDetails, null, 2));

      // Execute the actual scheduling action
      const executionResult = await this.executeSchedulingAction(actionDetails, context);
      
      return executionResult;
      
    } catch (error) {
      console.error('Error handling execute intent:', error);
      return {
        content: 'I encountered an error while trying to execute that action. Please try rephrasing your request or navigate to the Production Scheduler manually.',
        error: true
      };
    }
  }

  private async executeSchedulingAction(actionDetails: any, context: MaxContext): Promise<MaxResponse> {
    try {
      const { action_type, affected_items, source_resource, target_resource, target_date, target, reasoning } = actionDetails;
      
      console.log(`[Max AI] Executing scheduling action: ${action_type}`);
      console.log(`[Max AI] Action details:`, { affected_items, source_resource, target_resource, target_date, target, reasoning });
      
      // Parse the action and execute based on type
      if (action_type?.includes('move') || action_type?.includes('relocate') || action_type?.includes('reassign')) {
        // If source_resource is specified, use ONLY target_resource (ignore legacy target field)
        // This ensures "move OFF" requests work correctly (source_resource set, target_resource null)
        const finalTarget = source_resource ? target_resource : (target_resource || target);
        return await this.executeMoveOperations(affected_items, source_resource, finalTarget, reasoning);
      } else if (action_type?.includes('reschedule') || action_type?.includes('change_time')) {
        // For reschedule operations, use target_date field (not target_resource)
        const dateToUse = target_date || target_resource || target;
        return await this.executeRescheduleOperations(affected_items, dateToUse, reasoning);
      } else if (action_type?.includes('algorithm') || action_type?.includes('optimize') || 
                 action_type?.includes('asap') || action_type?.includes('alap') || 
                 action_type?.includes('critical_path') || action_type?.includes('resource_level') ||
                 action_type?.includes('drum') || action_type?.includes('toc')) {
        // Execute scheduling algorithm
        return await this.executeSchedulingAlgorithm(action_type, affected_items, reasoning);
      } else {
        // Generic execution for other types
        return {
          content: `I understand you want to ${reasoning || 'perform this action'}. However, I need more specific details about what operation to perform. Could you rephrase your request?`,
          error: false
        };
      }
    } catch (error) {
      console.error('[Max AI] Error executing scheduling action:', error);
      return {
        content: 'I encountered an error while trying to execute that action. Please try again or rephrase your request.',
        error: true
      };
    }
  }

  private async executeMoveOperations(affectedItems: any, sourceResource: any, targetResource: any, reasoning: string): Promise<MaxResponse> {
    try {
      console.log(`[Max AI] Moving operations:`, affectedItems, 'from:', sourceResource, 'to:', targetResource);
      
      // Step 1: Find operations matching the criteria
      let operations: any[] = [];
      
      // If source resource is specified, find operations on that resource
      if (sourceResource) {
        const sourceResourceName = typeof sourceResource === 'string' ? sourceResource : sourceResource?.description || sourceResource?.name || '';
        
        // First find the resource to normalize the name
        const sourceResourceObj = await this.findResourceByDescription(sourceResourceName);
        
        if (sourceResourceObj) {
          // If "all operations" is requested, find all operations on the source resource
          const searchDesc = affectedItems?.description || affectedItems || '';
          const isAllOperations = searchDesc.toLowerCase().includes('all') || searchDesc === '';
          
          if (isAllOperations) {
            // Get ALL operations on the source resource
            const resourceOps = await db.execute(sql`
              SELECT 
                jo.id,
                jo.operation_id,
                jo.job_id,
                jo.name as operation_name,
                jo.description,
                jo.scheduled_start,
                jo.scheduled_end,
                j.name as job_name,
                jr.default_resource_id,
                r.id as resource_id,
                r.name as resource_name
              FROM ptjoboperations jo
              LEFT JOIN ptjobs j ON jo.job_id = j.id
              LEFT JOIN ptjobresources jr ON jo.id = jr.operation_id
              LEFT JOIN ptresources r ON jr.default_resource_id = r.external_id
              WHERE r.name = ${sourceResourceObj.name}
              ORDER BY jo.scheduled_start
              LIMIT 50
            `);
            operations = resourceOps.rows as any[];
          } else {
            // Find specific operations on the source resource
            operations = await this.findOperationsByDescription(affectedItems);
            operations = operations.filter(op => 
              op.resource_name && op.resource_name.toLowerCase() === sourceResourceObj.name.toLowerCase()
            );
          }
        }
      } else {
        // No source specified, find operations by description
        operations = await this.findOperationsByDescription(affectedItems);
      }
      
      if (operations.length === 0) {
        const sourceInfo = sourceResource ? ` on ${typeof sourceResource === 'string' ? sourceResource : sourceResource?.description || sourceResource?.name}` : '';
        return {
          content: `I couldn't find any operations${sourceInfo}. Could you be more specific about which operations to move?`,
          error: false
        };
      }

      // Step 2: Handle target resource - could be specified or need to find alternative
      let finalTargetResource = null;
      
      // Check if target is specified
      const targetDescription = typeof targetResource === 'string' ? targetResource : targetResource?.description || targetResource?.name || '';
      const hasTarget = targetDescription && targetDescription.trim() !== '';
      
      if (hasTarget) {
        // User specified a target resource
        finalTargetResource = await this.findResourceByDescription(targetResource);
        
        if (!finalTargetResource) {
          return {
            content: `I couldn't find a resource matching "${targetDescription}". Could you specify which resource to move the operations to?`,
            error: false
          };
        }
      } else {
        // User wants to move OFF something - find alternative resources
        // Get the source resource from the first operation
        const sourceResourceName = operations[0]?.resource_name;
        
        if (!sourceResourceName) {
          return {
            content: `I found ${operations.length} operation${operations.length > 1 ? 's' : ''} but couldn't determine which resource to move them to. Please specify a target resource, like "move them to Fermenter Tank 2".`,
            error: false
          };
        }
        
        // Find alternative resources with same capabilities
        const alternativeResource = await this.findAlternativeResource(operations[0], sourceResourceName);
        
        if (!alternativeResource) {
          return {
            content: `I found ${operations.length} operation${operations.length > 1 ? 's' : ''} on ${sourceResourceName}, but there are no available alternative resources with the required capabilities. Which resource should I move them to?`,
            error: false
          };
        }
        
        finalTargetResource = alternativeResource;
      }

      // Step 3: Validate resource capabilities
      const validation = await this.validateResourceCapabilities(operations, finalTargetResource);
      
      if (!validation.valid) {
        return {
          content: `I can't move those operations to ${finalTargetResource.name} because: ${validation.reason}. ${validation.suggestion || ''}`,
          error: false
        };
      }

      // Step 3b: Check for scheduling conflicts on target resource
      const conflictCheck = await this.checkResourceConflicts(operations, finalTargetResource);
      
      if (!conflictCheck.valid) {
        return {
          content: `⚠️ Cannot move operations to ${finalTargetResource.name} due to scheduling conflicts:\n\n${conflictCheck.conflicts.join('\n')}\n\nPlease choose a different resource or reschedule the conflicting operations first.`,
          error: false
        };
      }

      // Step 4: Execute the move
      const moveResults = await this.performOperationMove(operations, finalTargetResource);
      
      // Step 5: Return success response
      return {
        content: `✅ Successfully moved ${moveResults.count} operation${moveResults.count > 1 ? 's' : ''} to ${finalTargetResource.name}:\n\n${moveResults.summary}\n\nThe schedule has been updated. You can view the changes in the Production Scheduler.`,
        action: {
          type: 'refresh_scheduler',
          data: {
            function: 'move_operations',
            results: moveResults,
            refresh: true
          }
        },
        error: false
      };
      
    } catch (error) {
      console.error('[Max AI] Error in executeMoveOperations:', error);
      return {
        content: 'I encountered an error while moving the operations. The schedule has not been changed.',
        error: true
      };
    }
  }

  private async executeRescheduleOperations(affectedItems: any, target: any, reasoning: string): Promise<MaxResponse> {
    try {
      console.log(`[Max AI] Rescheduling operations:`, affectedItems, 'to:', target);
      
      // Find operations
      const operations = await this.findOperationsByDescription(affectedItems);
      
      if (operations.length === 0) {
        return {
          content: `I couldn't find any operations matching "${affectedItems?.description || affectedItems}". Please be more specific.`,
          error: false
        };
      }

      // Parse target date/time
      const newStartTime = this.parseDateTime(target);
      
      if (!newStartTime) {
        return {
          content: `I couldn't understand the date/time "${target?.description || target}". Please specify a clear date and time, like "September 5" or "Sept 5 at 2pm".`,
          error: false
        };
      }

      // Execute reschedule
      const rescheduleResults = await this.performOperationReschedule(operations, newStartTime);
      
      return {
        content: `✅ Successfully rescheduled ${rescheduleResults.count} operation${rescheduleResults.count > 1 ? 's' : ''} to ${newStartTime.toLocaleString()}:\n\n${rescheduleResults.summary}\n\nThe schedule has been updated.`,
        action: {
          type: 'refresh_scheduler',
          data: {
            function: 'reschedule_operations',
            results: rescheduleResults,
            refresh: true
          }
        },
        error: false
      };
      
    } catch (error) {
      console.error('[Max AI] Error in executeRescheduleOperations:', error);
      return {
        content: 'I encountered an error while rescheduling the operations. The schedule has not been changed.',
        error: true
      };
    }
  }

  private async executeSchedulingAlgorithm(algorithmType: string, affectedItems: any, reasoning: string): Promise<MaxResponse> {
    try {
      console.log(`[Max AI] Executing scheduling algorithm: ${algorithmType}`);
      console.log(`[Max AI] Algorithm reasoning: ${reasoning}`);
      
      // Determine which algorithm to apply - check both action_type and reasoning for algorithm name
      const searchText = `${algorithmType} ${reasoning}`.toLowerCase();
      let algorithmName = '';
      let algorithmDescription = '';
      let executionSteps = '';
      
      if (searchText.includes('asap')) {
        algorithmName = 'ASAP (As Soon As Possible)';
        algorithmDescription = 'This will schedule all operations to start as early as possible from the current time, minimizing lead times.';
        executionSteps = '1. Click the "Optimize" button in the toolbar\n2. Select "ASAP Algorithm" from the dropdown\n3. Click "Apply" to run the algorithm\n4. Review the updated schedule';
      } else if (searchText.includes('alap')) {
        algorithmName = 'ALAP (As Late As Possible)';
        algorithmDescription = 'This will schedule operations as late as possible while still meeting due dates, reducing work-in-process inventory.';
        executionSteps = '1. Click the "Optimize" button in the toolbar\n2. Select "ALAP Algorithm" from the dropdown\n3. Click "Apply" to run the algorithm\n4. Review the updated schedule';
      } else if (searchText.includes('critical_path') || searchText.includes('critical path')) {
        algorithmName = 'Critical Path Method';
        algorithmDescription = 'This will identify and highlight operations that directly impact the completion time (shown in red).';
        executionSteps = '1. Click the "Optimize" button in the toolbar\n2. Select "Critical Path" from the dropdown\n3. Click "Analyze" to identify critical operations\n4. Critical operations will be highlighted in red';
      } else if (searchText.includes('resource_level') || searchText.includes('leveling')) {
        algorithmName = 'Resource Leveling';
        algorithmDescription = 'This will redistribute operations to balance resource utilization and reduce overloads.';
        executionSteps = '1. Click the "Optimize" button in the toolbar\n2. Select "Resource Leveling" from the dropdown\n3. Set target utilization percentage (e.g., 85%)\n4. Click "Apply" to balance the schedule';
      } else if (searchText.includes('drum') || searchText.includes('toc') || searchText.includes('theory of constraints')) {
        algorithmName = 'Drum/TOC (Theory of Constraints)';
        algorithmDescription = 'This will schedule operations around the bottleneck resource to maximize throughput.';
        executionSteps = '1. Click the "Optimize" button in the toolbar\n2. Select "Drum/TOC" from the dropdown\n3. Identify the constraint resource (usually highest utilization)\n4. Click "Apply" to optimize around the constraint';
      } else {
        algorithmName = 'Schedule Optimization';
        algorithmDescription = 'This will optimize the schedule based on your specific requirements.';
        executionSteps = '1. Click the "Optimize" button in the toolbar\n2. Select your preferred algorithm\n3. Configure parameters if needed\n4. Click "Apply" to run the optimization';
      }
      
      // Determine the algorithm direction value for Bryntum
      let algorithmDirection = '';
      if (algorithmName.includes('ALAP')) {
        algorithmDirection = 'Backward';
      } else if (algorithmName.includes('ASAP')) {
        algorithmDirection = 'Forward';
      }
      
      // Return action to apply the algorithm via PostMessage
      return {
        content: `✅ Applying the **${algorithmName}** algorithm to your schedule.\n\n${algorithmDescription}\n\nThe algorithm is being applied and will automatically recalculate all operations based on your constraints and dependencies. The schedule will refresh once complete.`,
        action: {
          type: 'apply_algorithm',
          data: {
            algorithm: algorithmName,
            direction: algorithmDirection,
            description: algorithmDescription
          }
        },
        error: false
      };
      
    } catch (error) {
      console.error('[Max AI] Error executing scheduling algorithm:', error);
      return {
        content: 'I encountered an error while preparing the algorithm execution. Please try applying the algorithm manually using the Optimize button in the toolbar.',
        error: true
      };
    }
  }

  private async findOperationsByDescription(description: any): Promise<any[]> {
    try {
      // Use filter field if available (from affected_items), otherwise fallback to description
      const searchTerm = typeof description === 'string' ? description : description?.filter || description?.description || description?.name || '';
      
      // Clean up common job prefixes from search term for more flexible matching
      const cleanedTerm = searchTerm
        .replace(/^(job|order|work order|wo|operation|op|task)\s+/i, '') // Remove common prefixes
        .trim();
      
      console.log(`[Max AI] Searching for operations - original: "${searchTerm}", cleaned: "${cleanedTerm}"`);
      
      const lowerTerm = searchTerm.toLowerCase().trim();
      
      // EDGE CASE 1: Time-filtered job queries (e.g., "jobs for this week", "jobs today")
      // Only use shortcut for SIMPLE time queries - fall back to regular search for complex queries
      
      // Pre-process query: remove filler words, punctuation, and articles for pattern matching
      let cleanedForPattern = lowerTerm;
      
      // Remove leading fillers (loop to handle multiple: "please can you")
      let prevLength;
      do {
        prevLength = cleanedForPattern.length;
        cleanedForPattern = cleanedForPattern.replace(/^(please|hey|hi|can\s+you|could\s+you|would\s+you)\s+/i, '');
      } while (cleanedForPattern.length < prevLength);
      
      // Remove trailing fillers and cleanup
      cleanedForPattern = cleanedForPattern
        .replace(/\s+(please|now|thanks|thank\s+you)$/i, '') // Remove trailing filler
        .replace(/[?!.]+$/, '')  // Remove trailing punctuation
        .replace(/\b(the|a|an)\b/g, '') // Remove articles
        .replace(/\s+/g, ' ')    // Normalize multiple spaces
        .trim();
      
      // Check for ONLY the time filters we fully support
      const isTodayQuery = lowerTerm.includes('today');
      const isThisWeekQuery = lowerTerm.includes('this week');
      const isNextWeekQuery = lowerTerm.includes('next week');
      const isThisMonthQuery = lowerTerm.includes('this month');
      
      // Only use time filter shortcut for simple queries without additional qualifiers
      // Patterns support both "jobs" and "operations", various verbs (show, list, get, give me, etc.)
      const isSimpleTimeQuery = 
        /^(show|list|get|display|give)\s+(me\s+)?(jobs?|operations?)\s+(for\s+)?(today|this\s+week|next\s+week|this\s+month)$/i.test(cleanedForPattern) ||
        /^(jobs?|operations?)\s+(for\s+)?(today|this\s+week|next\s+week|this\s+month)$/i.test(cleanedForPattern) ||
        /^(today|this\s+week|next\s+week|this\s+month)s?\s+(jobs?|operations?)$/i.test(cleanedForPattern);
      
      const hasImplementedTimeFilter = isTodayQuery || isThisWeekQuery || isNextWeekQuery || isThisMonthQuery;
      
      if (hasImplementedTimeFilter && isSimpleTimeQuery) {
        console.log(`[Max AI] Detected time-filtered job query - fetching operations with time filter`);
        
        // Calculate date range based on the specific filter
        let startDate = new Date();
        let endDate = new Date();
        
        if (isTodayQuery) {
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
        } else if (isThisWeekQuery) {
          const dayOfWeek = startDate.getDay();
          const diff = startDate.getDate() - dayOfWeek;
          startDate = new Date(startDate.setDate(diff));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
        } else if (isNextWeekQuery) {
          const dayOfWeek = startDate.getDay();
          const diff = startDate.getDate() - dayOfWeek + 7;
          startDate = new Date(startDate.setDate(diff));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
        } else if (isThisMonthQuery) {
          startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
        }
        
        const timeFilteredOps = await db.execute(sql`
          SELECT 
            jo.id,
            jo.operation_id,
            jo.job_id,
            jo.name as operation_name,
            jo.description,
            jo.scheduled_start,
            jo.scheduled_end,
            j.name as job_name,
            jr.default_resource_id,
            r.id as resource_id,
            r.name as resource_name
          FROM ptjoboperations jo
          LEFT JOIN ptjobs j ON jo.job_id = j.id
          LEFT JOIN ptjobresources jr ON jo.id = jr.operation_id
          LEFT JOIN ptresources r ON jr.default_resource_id = r.external_id
          WHERE jo.scheduled_start >= ${startDate.toISOString()}
            AND jo.scheduled_start <= ${endDate.toISOString()}
          ORDER BY jo.scheduled_start
          LIMIT 100
        `);
        
        console.log(`[Max AI] Found ${timeFilteredOps.rows.length} operations with time filter`);
        return timeFilteredOps.rows as any[];
      }
      
      // EDGE CASE 2: Detect if user is asking about "all jobs" or just "jobs" - they want ALL operations from jobs
      // Use substring matching to catch variations like "show me all jobs", "all the jobs", etc.
      // Be careful to avoid false positives like "all operations for job 2001" or "all jobs for line 2"
      
      // Check for patterns that clearly indicate wanting ALL jobs (not a specific job or filtered subset)
      const hasAllJobsPhrase = 
        lowerTerm.includes('all jobs') || 
        lowerTerm.includes('all the jobs') ||
        lowerTerm.includes('every job');
      
      // Check for standalone "jobs" request without specifics
      const isGenericJobsRequest = 
        lowerTerm === 'jobs' || 
        lowerTerm === 'all' ||
        lowerTerm === 'everything' ||
        lowerTerm === 'all operations' ||
        /^(show|list|get|display|give me|fetch)\s+(me\s+)?(all\s+)?(the\s+)?jobs?$/i.test(searchTerm);
      
      // Exclude if query has additional qualifiers that filter the results (excluding time filters handled above)
      const hasLocationQualifiers = 
        /job\s+[0-9a-zA-Z-]+/i.test(lowerTerm) ||     // "job 2001", "job MO-123"
        /for\s+(job|line|resource|crew|team|area|department)/i.test(lowerTerm) ||  // "for job X", "for line 2", "for maintenance crew"
        /on\s+(job|line|resource)/i.test(lowerTerm) ||  // "on job X", "on line 2"
        /in\s+(line|area|department)/i.test(lowerTerm);  // "in line 2", "in department X"
      
      const isAllJobsQuery = (hasAllJobsPhrase || isGenericJobsRequest) && !hasLocationQualifiers;
      
      if (isAllJobsQuery) {
        console.log(`[Max AI] Detected "all jobs" query - fetching ALL operations from all jobs`);
        const allOperations = await db.execute(sql`
          SELECT 
            jo.id,
            jo.operation_id,
            jo.job_id,
            jo.name as operation_name,
            jo.description,
            jo.scheduled_start,
            jo.scheduled_end,
            j.name as job_name,
            jr.default_resource_id,
            r.id as resource_id,
            r.name as resource_name
          FROM ptjoboperations jo
          LEFT JOIN ptjobs j ON jo.job_id = j.id
          LEFT JOIN ptjobresources jr ON jo.id = jr.operation_id
          LEFT JOIN ptresources r ON jr.default_resource_id = r.external_id
          WHERE jo.scheduled_start IS NOT NULL
          ORDER BY jo.scheduled_start
          LIMIT 100
        `);
        
        console.log(`[Max AI] Found ${allOperations.rows.length} operations from all jobs`);
        return allOperations.rows as any[];
      }
      
      // Query operations matching the description (search with both patterns)
      const operations = await db.execute(sql`
        SELECT 
          jo.id,
          jo.operation_id,
          jo.job_id,
          jo.name as operation_name,
          jo.description,
          jo.scheduled_start,
          jo.scheduled_end,
          j.name as job_name,
          jr.default_resource_id,
          r.id as resource_id,
          r.name as resource_name
        FROM ptjoboperations jo
        LEFT JOIN ptjobs j ON jo.job_id = j.id
        LEFT JOIN ptjobresources jr ON jo.id = jr.operation_id
        LEFT JOIN ptresources r ON jr.default_resource_id = r.external_id
        WHERE 
          LOWER(jo.name) LIKE LOWER(${'%' + searchTerm + '%'})
          OR LOWER(jo.description) LIKE LOWER(${'%' + searchTerm + '%'})
          OR LOWER(j.name) LIKE LOWER(${'%' + searchTerm + '%'})
          OR LOWER(r.name) LIKE LOWER(${'%' + searchTerm + '%'})
          OR LOWER(jo.name) LIKE LOWER(${'%' + cleanedTerm + '%'})
          OR LOWER(j.name) LIKE LOWER(${'%' + cleanedTerm + '%'})
          OR LOWER(j.name) = LOWER(${cleanedTerm})
        ORDER BY jo.scheduled_start
        LIMIT 50
      `);
      
      console.log(`[Max AI] Found ${operations.rows.length} operations`);
      return operations.rows as any[];
    } catch (error) {
      console.error('[Max AI] Error finding operations:', error);
      return [];
    }
  }

  private async findResourceByDescription(description: any): Promise<any | null> {
    try {
      const searchTerm = typeof description === 'string' ? description : description?.description || description?.name || '';
      
      // Normalize common variations
      const normalizedTerm = searchTerm
        .toLowerCase()
        .replace(/fermented/g, 'fermenter')  // Handle "fermented" -> "fermenter"
        .replace(/fermentor/g, 'fermenter')  // Handle "fermentor" -> "fermenter"
        .replace(/\s+tank\s*/gi, ' tank ')  // Normalize "tank" spacing
        .trim();
      
      console.log(`[Max AI] Searching for resource - original: "${searchTerm}", normalized: "${normalizedTerm}"`);
      
      // Try exact match first with normalized term
      const exactMatch = await db.execute(sql`
        SELECT 
          id,
          external_id,
          name,
          description,
          resource_id
        FROM ptresources
        WHERE 
          active = true
          AND LOWER(REPLACE(REPLACE(name, 'Fermentor', 'Fermenter'), 'Fermented', 'Fermenter')) = ${normalizedTerm}
        LIMIT 1
      `);
      
      if (exactMatch.rows.length > 0) {
        return exactMatch.rows[0];
      }
      
      // Fallback to partial match
      const resources = await db.execute(sql`
        SELECT 
          id,
          external_id,
          name,
          description,
          resource_id
        FROM ptresources
        WHERE 
          active = true
          AND (
            LOWER(name) LIKE LOWER(${'%' + searchTerm + '%'})
            OR LOWER(description) LIKE LOWER(${'%' + searchTerm + '%'})
            OR LOWER(name) LIKE LOWER(${'%' + normalizedTerm + '%'})
          )
        LIMIT 1
      `);
      
      return resources.rows[0] || null;
    } catch (error) {
      console.error('[Max AI] Error finding resource:', error);
      return null;
    }
  }

  private async findAlternativeResource(sampleOperation: any, excludeResourceName: string): Promise<any | null> {
    try {
      // Get capabilities of the current resource - use numeric id for join
      const currentResourceCapabilities = await db.execute(sql`
        SELECT DISTINCT rc.capability_id
        FROM ptresources r
        JOIN ptresourcecapabilities rc ON r.id = rc.resource_id
        WHERE r.name = ${excludeResourceName}
      `);
      
      if (currentResourceCapabilities.rows.length === 0) {
        // If current resource has no capabilities, just find any similar resource
        const alternatives = await db.execute(sql`
          SELECT 
            id,
            external_id,
            name,
            description,
            resource_id
          FROM ptresources
          WHERE 
            active = true
            AND name != ${excludeResourceName}
            AND LOWER(name) LIKE LOWER(${'%' + (sampleOperation.operation_name || 'ferment') + '%'})
          LIMIT 1
        `);
        
        return alternatives.rows[0] || null;
      }
      
      const capabilityIds = currentResourceCapabilities.rows.map((row: any) => row.capability_id);
      
      // Find resources with same capabilities, excluding the current one - use numeric id for join
      const alternatives = await db.execute(sql`
        SELECT DISTINCT
          r.id,
          r.external_id,
          r.name,
          r.description,
          r.resource_id,
          COUNT(rc.capability_id) as matching_capabilities
        FROM ptresources r
        JOIN ptresourcecapabilities rc ON r.id = rc.resource_id
        WHERE 
          r.active = true
          AND r.name != ${excludeResourceName}
          AND rc.capability_id = ANY(${capabilityIds})
        GROUP BY r.id, r.external_id, r.name, r.description, r.resource_id
        ORDER BY matching_capabilities DESC
        LIMIT 1
      `);
      
      return alternatives.rows[0] || null;
    } catch (error) {
      console.error('[Max AI] Error finding alternative resource:', error);
      return null;
    }
  }

  private async findJobsOnResource(resourceName: string): Promise<any[]> {
    try {
      console.log(`[Max AI] Finding jobs on resource: ${resourceName}`);
      
      // Query jobs scheduled on the specified resource
      const jobs = await db.execute(sql`
        SELECT DISTINCT
          j.id as job_id,
          j.name as job_name,
          j.external_id as job_external_id,
          j.priority,
          j.need_date_time,
          jo.id as operation_id,
          jo.name as operation_name,
          jo.scheduled_start,
          jo.scheduled_end,
          jo.cycle_hrs,
          r.name as resource_name,
          r.external_id as resource_external_id
        FROM ptjoboperations jo
        JOIN ptjobs j ON jo.job_id = j.id
        JOIN ptjobresources jr ON jo.id = jr.operation_id
        JOIN ptresources r ON jr.default_resource_id = r.external_id
        WHERE 
          LOWER(r.name) LIKE LOWER(${'%' + resourceName + '%'})
          AND jo.scheduled_start IS NOT NULL
        ORDER BY jo.scheduled_start
        LIMIT 50
      `);
      
      console.log(`[Max AI] Found ${jobs.rows.length} job operations on resource matching "${resourceName}"`);
      return jobs.rows as any[];
    } catch (error) {
      console.error('[Max AI] Error finding jobs on resource:', error);
      return [];
    }
  }

  private async validateResourceCapabilities(operations: any[], targetResource: any): Promise<{ valid: boolean; reason?: string; suggestion?: string }> {
    try {
      // Get target resource capabilities - use numeric id, not string resource_id
      const capabilities = await db.execute(sql`
        SELECT capability_id
        FROM ptresourcecapabilities
        WHERE resource_id = ${targetResource.id}
      `);
      
      const targetCapabilities = capabilities.rows.map((row: any) => row.capability_id);
      
      if (targetCapabilities.length === 0) {
        return {
          valid: false,
          reason: 'The target resource has no capabilities defined',
          suggestion: 'Please configure the resource capabilities first.'
        };
      }

      // For now, allow the move (in production, you'd check each operation's required capability)
      // This is a simplified validation
      return { valid: true };
      
    } catch (error) {
      console.error('[Max AI] Error validating capabilities:', error);
      return {
        valid: false,
        reason: 'Could not validate resource capabilities'
      };
    }
  }

  private async performOperationMove(operations: any[], targetResource: any): Promise<{ count: number; summary: string }> {
    try {
      let movedCount = 0;
      const summaryItems: string[] = [];
      
      for (const operation of operations) {
        // Update the job resource assignment
        await db.execute(sql`
          UPDATE ptjobresources
          SET default_resource_id = ${targetResource.external_id}
          WHERE operation_id = ${operation.id}
        `);
        
        movedCount++;
        summaryItems.push(`• ${operation.operation_name} (from ${operation.resource_name || 'unassigned'})`);
      }
      
      return {
        count: movedCount,
        summary: summaryItems.join('\n')
      };
    } catch (error) {
      console.error('[Max AI] Error performing operation move:', error);
      throw error;
    }
  }

  private async performOperationReschedule(operations: any[], newStartTime: Date): Promise<{ count: number; summary: string }> {
    try {
      let rescheduledCount = 0;
      const summaryItems: string[] = [];
      
      for (const operation of operations) {
        // Calculate new end time based on operation duration
        const duration = operation.scheduled_end && operation.scheduled_start 
          ? new Date(operation.scheduled_end).getTime() - new Date(operation.scheduled_start).getTime()
          : 3600000; // Default 1 hour if no duration
        
        const newEndTime = new Date(newStartTime.getTime() + duration);
        
        // Update the operation schedule
        await db.execute(sql`
          UPDATE ptjoboperations
          SET 
            scheduled_start = ${newStartTime.toISOString()},
            scheduled_end = ${newEndTime.toISOString()}
          WHERE id = ${operation.id}
        `);
        
        rescheduledCount++;
        summaryItems.push(`• ${operation.operation_name} (Job: ${operation.job_name || 'Unknown'})`);
      }
      
      return {
        count: rescheduledCount,
        summary: summaryItems.join('\n')
      };
    } catch (error) {
      console.error('[Max AI] Error performing reschedule:', error);
      throw error;
    }
  }

  private parseDateTime(dateStr: any): Date | null {
    try {
      const str = typeof dateStr === 'string' ? dateStr : dateStr?.description || dateStr?.date || '';
      
      // Simple date parsing - handle common formats
      const lowerStr = str.toLowerCase();
      
      // Extract month and day
      const months: Record<string, number> = {
        'jan': 0, 'january': 0,
        'feb': 1, 'february': 1,
        'mar': 2, 'march': 2,
        'apr': 3, 'april': 3,
        'may': 4,
        'jun': 5, 'june': 5,
        'jul': 6, 'july': 6,
        'aug': 7, 'august': 7,
        'sep': 8, 'sept': 8, 'september': 8,
        'oct': 9, 'october': 9,
        'nov': 10, 'november': 10,
        'dec': 11, 'december': 11
      };
      
      let month = -1;
      let day = -1;
      
      for (const [monthName, monthNum] of Object.entries(months)) {
        if (lowerStr.includes(monthName)) {
          month = monthNum;
          break;
        }
      }
      
      // Handle ordinal numbers (1st, 2nd, 3rd, 4th, 5th, etc.)
      const dayMatch = str.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
      if (dayMatch) {
        day = parseInt(dayMatch[1]);
      }
      
      if (month >= 0 && day > 0) {
        const year = new Date().getFullYear();
        return new Date(year, month, day);
      }
      
      // Try native parsing as fallback
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
      
      return null;
    } catch (error) {
      console.error('[Max AI] Error parsing date:', error);
      return null;
    }
  }

  // Enrich user query with production context
  private async enrichQuery(query: string, productionData: any, insights: ProductionInsight[], context: MaxContext, conversationContext: any): Promise<string> {
    let enriched = query;
    
    // If this is a simple affirmative response to a previous question, enrich with context
    if ((query.toLowerCase() === 'yes' || query.toLowerCase().includes('yes please')) && conversationContext.isResponse) {
      enriched = `User responded "Yes" to your previous question: "${conversationContext.previousQuestion}"`;
      
      // If we offered to analyze alerts and user said yes, add context
      if (conversationContext.alertsOffered) {
        enriched += '\n\nThe user wants you to analyze the alerts you mentioned.';
      }
    }
    
    // Add production status if relevant
    if (query.toLowerCase().includes('status') || query.toLowerCase().includes('production')) {
      enriched += `\n\nCurrent Production Status: ${productionData.summary}`;
    }

    // Check if user wants alert analysis based on conversation context
    const isRequestingAlertAnalysis = 
        // Direct requests
        query.toLowerCase().includes('show me details about the alerts') || 
        query.toLowerCase().includes('analyze the alerts') ||
        query.toLowerCase().includes('alert analysis') ||
        query.toLowerCase().includes('review the alerts') ||
        // Contextual response - user saying yes after we offered alert analysis
        (conversationContext.alertsOffered && (query.toLowerCase() === 'yes' || query.toLowerCase().includes('yes please')));
    
    if (isRequestingAlertAnalysis) {
      try {
        // TODO: Implement alerts table
        const activeAlerts: any[] = [];
        // const activeAlerts = await db.select({
        //   id: alerts.id,
        //   title: alerts.title,
        //   description: alerts.description,
        //   severity: alerts.severity,
        //   type: alerts.type,
        //   createdAt: alerts.createdAt
        // })
        //   .from(alerts)
        //   .where(eq(alerts.status, 'active'))
        //   .orderBy(desc(alerts.createdAt))
        //   .limit(5);

        if (activeAlerts.length > 0) {
          enriched += `\n\nActive Alerts (${activeAlerts.length} total):`;
          activeAlerts.forEach((alert, index) => {
            enriched += `\n${index + 1}. ${alert.title} (${alert.severity?.toUpperCase()})`;
            enriched += `\n   - ${alert.description}`;
            enriched += `\n   - Created: ${alert.createdAt?.toLocaleString()}`;
            enriched += `\n   - Type: ${alert.type}`;
          });
          enriched += `\n\nUser is asking for help with these alerts. Provide specific analysis and actionable recommendations for each alert listed above.`;
        }
      } catch (error) {
        console.error('Error fetching alerts for enrichment:', error);
      }
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

  // Check for scheduling conflicts before moving operations to a target resource
  private async checkResourceConflicts(operations: any[], targetResource: any): Promise<{ valid: boolean; conflicts: string[] }> {
    try {
      const conflicts: string[] = [];
      
      for (const operation of operations) {
        if (!operation.scheduled_start || !operation.scheduled_end) continue;
        
        // Query existing operations on the target resource that would overlap
        const existingOps = await db.execute(sql`
          SELECT 
            jo.id,
            jo.name as operation_name,
            jo.scheduled_start,
            jo.scheduled_end,
            j.name as job_name
          FROM ptjoboperations jo
          LEFT JOIN ptjobs j ON jo.job_id = j.id
          LEFT JOIN ptjobresources jr ON jo.id = jr.operation_id
          WHERE 
            jr.default_resource_id = ${targetResource.external_id}
            AND jo.id != ${operation.id}
            AND jo.scheduled_start IS NOT NULL
            AND jo.scheduled_end IS NOT NULL
            AND (
              (jo.scheduled_start <= ${operation.scheduled_start} AND jo.scheduled_end > ${operation.scheduled_start})
              OR (jo.scheduled_start < ${operation.scheduled_end} AND jo.scheduled_end >= ${operation.scheduled_end})
              OR (jo.scheduled_start >= ${operation.scheduled_start} AND jo.scheduled_end <= ${operation.scheduled_end})
            )
        `);
        
        if (existingOps.rows.length > 0) {
          for (const existing of existingOps.rows) {
            const conflictStart = new Date(existing.scheduled_start).toLocaleString();
            const conflictEnd = new Date(existing.scheduled_end).toLocaleString();
            conflicts.push(
              `• "${operation.operation_name}" (${new Date(operation.scheduled_start).toLocaleString()} - ${new Date(operation.scheduled_end).toLocaleString()}) conflicts with "${existing.operation_name}" from ${existing.job_name} (${conflictStart} - ${conflictEnd})`
            );
          }
        }
      }
      
      return {
        valid: conflicts.length === 0,
        conflicts
      };
    } catch (error) {
      console.error('[Max AI] Error checking resource conflicts:', error);
      // On error, allow the move but log the issue
      return { valid: true, conflicts: [] };
    }
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
    // Return placeholder data for now
    return [];
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
  private calculateUtilization(resources: any[]): { average: number; critical: number; warning: number } {
    return { average: 0, critical: 0, warning: 0 };
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
      // For now, return a simulation response since PT tables are read-only
      return {
        content: `Operation ${args.operationId} has been flagged for rescheduling to ${args.newStartTime}. ${args.reason || ''} This will be processed by the scheduling system.`,
        action: {
          type: 'execute_function' as const,
          data: { operationId: args.operationId, newStartTime: args.newStartTime }
        }
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
      const alertData = {
        title: args.title || 'AI Generated Alert',
        description: args.description,
        severity: args.severity,
        type: args.type || 'production',
        status: 'active' as const
      };
      
      const [newAlert] = await db.insert(alerts).values(alertData).returning();

      return {
        content: `Alert created: "${args.title || 'AI Generated Alert'}". It has been added to the alerts dashboard with ${args.severity} priority.`,
        action: {
          type: 'execute_function' as const,
          data: newAlert
        }
      };
    } catch (error) {
      console.error('Create alert error:', error);
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
      action: {
        type: 'execute_function' as const,
        data: { criteria: args.criteria, optimizations: optimizations.length }
      },
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

    // Always check for active alerts first and provide immediate analysis
    const status = await this.getProductionStatus(context);
    if (status.criticalAlerts.length > 0 || status.summary.includes('active alerts')) {
      // Get detailed alert data for analysis
      try {
        const activeAlerts = await db.select({
          id: alerts.id,
          title: alerts.title,
          description: alerts.description,
          severity: alerts.severity,
          type: alerts.type,
          createdAt: alerts.createdAt
        })
          .from(alerts)
          .where(eq(alerts.status, 'active'))
          .orderBy(desc(alerts.createdAt))
          .limit(5);

        if (activeAlerts.length > 0) {
          let alertAnalysis = `Alert Analysis: Found ${activeAlerts.length} active alerts:\n`;
          activeAlerts.forEach((alert, index) => {
            alertAnalysis += `${index + 1}. ${alert.title} (${alert.severity?.toUpperCase()}): ${alert.description}\n`;
          });
          
          insights.push({
            type: 'bottleneck',
            severity: 'high',
            title: 'Active Alert Analysis',
            description: alertAnalysis,
            recommendation: 'Address these alerts immediately to prevent production disruptions',
            actionable: true,
            data: activeAlerts
          });
        }
      } catch (error) {
        console.error('Error getting alert details for proactive insights:', error);
      }
    }

    // Morning briefing (7-9 AM)
    if (hour >= 7 && hour <= 9) {
      if (status.criticalAlerts.length > 0) {
        insights.push({
          type: 'bottleneck',
          severity: 'high',
          title: 'Morning Critical Alert Review',
          description: `You have ${status.criticalAlerts.length} critical alerts requiring immediate attention before starting production`,
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

// User pattern interface for tracking behavior
interface UserPattern {
  frequentQueries: string[];
  preferredActions: string[];
  workingHours: number[];
  commonIssues: string[];
  lastActivity: Date;
}

// Proactive Recommendations Engine
class ProactiveRecommendationEngine {
  private userPatterns: Map<number, UserPattern> = new Map();
  private lastRecommendations: Map<number, Date> = new Map();
  
  // Analyze user behavior and generate proactive recommendations
  async generateProactiveRecommendations(
    userId: number,
    context: MaxContext
  ): Promise<{ recommendations: string[], priority: 'high' | 'medium' | 'low' }[]> {
    const recommendations: { recommendations: string[], priority: 'high' | 'medium' | 'low' }[] = [];
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Get user's pattern
    let pattern = this.userPatterns.get(userId);
    if (!pattern) {
      pattern = await this.analyzeUserPattern(userId);
      this.userPatterns.set(userId, pattern);
    }
    
    // Time-based recommendations
    if (hour === 8 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      recommendations.push({
        recommendations: [
          'Review production schedule for today',
          'Check overnight alerts and issues',
          'Verify resource availability'
        ],
        priority: 'high'
      });
    }
    
    if (hour === 14) {
      recommendations.push({
        recommendations: [
          'Review afternoon shift changeover',
          'Check production progress against targets',
          'Identify potential bottlenecks for resolution'
        ],
        priority: 'medium'
      });
    }
    
    // Context-based recommendations
    if (context.currentPage === '/production-schedule') {
      recommendations.push({
        recommendations: [
          'Try drag-and-drop to reschedule operations',
          'Use ASAP optimization for urgent orders',
          'Review critical path for key deliveries'
        ],
        priority: 'low'
      });
    }
    
    // Pattern-based recommendations
    if (pattern.commonIssues.includes('delays')) {
      recommendations.push({
        recommendations: [
          'Consider buffer time adjustments',
          'Review resource allocation for efficiency',
          'Analyze historical delay patterns'
        ],
        priority: 'high'
      });
    }
    
    return recommendations;
  }
  
  // Analyze user's historical patterns
  private async analyzeUserPattern(userId: number): Promise<any> {
    // This would query the database for user's historical data
    // For now, return a default pattern
    return {
      frequentQueries: [],
      preferredActions: [],
      workingHours: [8, 9, 10, 11, 14, 15, 16],
      commonIssues: [],
      lastActivity: new Date()
    };
  }
  
  // Learn from user interactions
  async learnFromInteraction(
    userId: number,
    query: string,
    action: string,
    successful: boolean
  ): Promise<void> {
    const pattern = this.userPatterns.get(userId) || await this.analyzeUserPattern(userId);
    
    // Update patterns based on interaction
    if (successful) {
      if (!pattern.frequentQueries.includes(query)) {
        pattern.frequentQueries.push(query);
        // Keep only last 20 queries
        if (pattern.frequentQueries.length > 20) {
          pattern.frequentQueries.shift();
        }
      }
      if (!pattern.preferredActions.includes(action)) {
        pattern.preferredActions.push(action);
        // Keep only last 10 actions
        if (pattern.preferredActions.length > 10) {
          pattern.preferredActions.shift();
        }
      }
    }
    
    // Track working hours
    const hour = new Date().getHours();
    if (!pattern.workingHours.includes(hour)) {
      pattern.workingHours.push(hour);
    }
    
    // Track common issues from query
    if (query.toLowerCase().includes('delay') || query.toLowerCase().includes('late')) {
      if (!pattern.commonIssues.includes('delays')) {
        pattern.commonIssues.push('delays');
      }
    }
    if (query.toLowerCase().includes('quality') || query.toLowerCase().includes('defect')) {
      if (!pattern.commonIssues.includes('quality')) {
        pattern.commonIssues.push('quality');
      }
    }
    if (query.toLowerCase().includes('resource') || query.toLowerCase().includes('capacity')) {
      if (!pattern.commonIssues.includes('resources')) {
        pattern.commonIssues.push('resources');
      }
    }
    
    pattern.lastActivity = new Date();
    this.userPatterns.set(userId, pattern);
  }

  // Main chat method to respond to user messages
  async respondToMessage(message: string, context: MaxContext & { agentId?: string }): Promise<MaxResponse> {
    try {
      console.log(`[Max AI] Processing message: "${message}"`);
      console.log(`[Max AI] Agent context: ${context.agentId || 'max'}`);
      
      // Load agent-specific training if agentId is provided
      let agentTraining = null;
      if (context.agentId && context.agentId !== 'max') {
        agentTraining = agentTrainingLoader.getTraining(context.agentId);
        if (agentTraining) {
          console.log(`[Max AI] Loaded ${agentTraining.name} training`);
        }
      }
      
      // Add user message to conversation history
      this.addToConversationHistory(context.userId, {
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // Get conversation history
      const conversationHistory = this.getConversationHistory(context.userId);
      const conversationContext = this.analyzeConversationContext(conversationHistory);

      // Get relevant memories for context
      const relevantMemories = await this.getRelevantMemories(context.userId, message);

      // Search for relevant playbooks
      const playbooks = await this.searchRelevantPlaybooks(message, context);

      // Try to analyze internal data first
      const internalDataResponse = await this.analyzeInternalDataQuery(message, context);
      if (internalDataResponse) {
        const response: MaxResponse = {
          content: internalDataResponse,
          error: false,
          confidence: 0.8,
          playbooksUsed: playbooks
        };

        // Add response to conversation history
        this.addToConversationHistory(context.userId, {
          role: 'assistant',
          content: response.content,
          timestamp: new Date()
        });

        // Store memory and track action
        await this.detectAndStoreMemory(context.userId, message, response.content);
        await this.trackAIAction(context, message, response.content, playbooks);

        return response;
      }

      // Use AI flexible response for complex queries (with agent training)
      const aiResponse = await this.getAIFlexibleResponse(message, context, playbooks, agentTraining);
      if (aiResponse) {
        // Add response to conversation history
        this.addToConversationHistory(context.userId, {
          role: 'assistant',
          content: aiResponse.content,
          timestamp: new Date()
        });

        // Store memory and track action
        await this.detectAndStoreMemory(context.userId, message, aiResponse.content);
        await this.trackAIAction(context, message, aiResponse.content, playbooks);

        return aiResponse;
      }

      // Fallback to general conversation
      const systemPrompt = this.buildSystemPrompt(context, undefined, relevantMemories, playbooks);
      
      const completion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory.slice(-5).map(msg => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content
          })),
          { role: "user", content: message }
        ],
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: 800
      });

      const responseContent = completion.choices[0].message.content || "I'm sorry, I couldn't process your request.";
      
      const response: MaxResponse = {
        content: responseContent,
        error: false,
        confidence: 0.7,
        reasoning: this.buildReasoningExplanation(message, playbooks, responseContent),
        playbooksUsed: playbooks
      };

      // Add response to conversation history
      this.addToConversationHistory(context.userId, {
        role: 'assistant',
        content: response.content,
        timestamp: new Date()
      });

      // Store memory and track action
      await this.detectAndStoreMemory(context.userId, message, response.content);
      await this.trackAIAction(context, message, response.content, playbooks);

      return response;

    } catch (error) {
      console.error('Max AI respondToMessage error:', error);
      return {
        content: "I'm experiencing technical difficulties. Please try again in a moment.",
        error: true,
        confidence: 0
      };
    }
  }
}

const recommendationEngine = new ProactiveRecommendationEngine();

export const maxAI = new MaxAIService();
export { recommendationEngine };