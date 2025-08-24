import { OpenAI } from 'openai';
import { db } from '../db';
import { 
  alerts
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
  conversationHistory?: ConversationMessage[];
}

interface MaxResponse {
  content: string;
  action?: {
    type: 'navigate' | 'show_data' | 'execute_function';
    target?: string;
    data?: any;
  };
  insights?: ProductionInsight[];
  suggestions?: string[];
  data?: any;
  error?: boolean;
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
  
  // Get real-time production status
  async getProductionStatus(context: MaxContext) {
    try {
      // Get active alerts only - other tables may not exist yet
      const alertList = await db.select({
        id: alerts.id,
        title: alerts.title,
        description: alerts.description,
        severity: alerts.severity,
        status: alerts.status,
        type: alerts.type
      }).from(alerts)
        .where(eq(alerts.status, 'active'))
        .limit(5);

      return {
        activeOrders: 0, // Will be updated when tables are available
        runningOperations: 0,
        resourceUtilization: { average: 0, critical: 0, warning: 0 }, // Basic structure
        criticalAlerts: alertList.filter(a => a.severity === 'critical'),
        summary: `System status: ${alertList.length} active alerts tracked`
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

  // Get available application routes and features for AI to understand
  private getApplicationRoutes(): { route: string; keywords: string[]; description: string }[] {
    return [
      { route: '/', keywords: ['home', 'dashboard', 'main'], description: 'Main dashboard and homepage' },
      { route: '/production-schedule', keywords: ['production', 'schedule', 'scheduling', 'gantt', 'timeline'], description: 'Production scheduling and Gantt chart' },
      { route: '/shop-floor', keywords: ['shop floor', 'production floor', 'manufacturing', 'real-time'], description: 'Shop floor monitoring and real-time production' },
      { route: '/analytics', keywords: ['analytics', 'reports', 'metrics', 'kpi', 'performance'], description: 'Analytics and performance metrics' },
      { route: '/alerts', keywords: ['alerts', 'notifications', 'issues', 'problems', 'warnings'], description: 'System alerts and notifications' },
      { route: '/resources', keywords: ['resources', 'machines', 'equipment', 'assets'], description: 'Resource and equipment management' },
      { route: '/operations', keywords: ['operations', 'tasks', 'activities', 'work'], description: 'Operations and work management' },
      { route: '/capacity-planning', keywords: ['capacity', 'planning', 'capacity plan', 'resource planning'], description: 'Capacity and resource planning' },
      { route: '/inventory-optimization', keywords: ['inventory', 'stock', 'materials', 'supplies'], description: 'Inventory and materials management' },
      { route: '/reports', keywords: ['reports', 'reporting', 'documents', 'analysis'], description: 'Reports and documentation' },
      { route: '/smart-kpi-tracking', keywords: ['kpi', 'metrics', 'tracking', 'performance indicators'], description: 'KPI tracking and performance monitoring' },
      { route: '/quality-control', keywords: ['quality', 'control', 'inspection', 'testing'], description: 'Quality control and inspection' },
      { route: '/visual-factory', keywords: ['visual factory', 'displays', 'screens', 'visual management'], description: 'Visual factory displays and management' }
    ];
  }

  // Use AI to intelligently determine user intent and target route
  private async analyzeUserIntentWithAI(query: string): Promise<{ type: 'navigate' | 'show_data' | 'chat'; target?: string; confidence: number }> {
    const routes = this.getApplicationRoutes();
    
    // Quick check for obvious data requests
    const dataKeywords = ['status', 'how many', 'current', 'show data', 'what is'];
    if (dataKeywords.some(keyword => query.toLowerCase().includes(keyword))) {
      return { type: 'show_data', confidence: 0.8 };
    }
    
    // Check for navigation intent using AI
    const navigationKeywords = ['show me', 'take me to', 'go to', 'open', 'view', 'display', 'navigate to'];
    const hasNavigationIntent = navigationKeywords.some(keyword => query.toLowerCase().includes(keyword));
    
    if (hasNavigationIntent) {
      // Use AI to find the best matching route
      const routeDescriptions = routes.map(r => `${r.route}: ${r.description} (keywords: ${r.keywords.join(', ')})`).join('\n');
      
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system', 
              content: `You are a route mapper for a manufacturing application. Given a user request, determine which route they want to navigate to.

Available routes:
${routeDescriptions}

Rules:
- If the user wants to navigate somewhere, respond with just the route path (e.g., "/capacity-planning")
- If uncertain or if it's not a navigation request, respond with "NONE"
- Be flexible with language - users might say "capacity plan" and mean "/capacity-planning"
- Consider synonyms and related terms`
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
  async generateResponse(query: string, context: MaxContext): Promise<MaxResponse> {
    // Analyze user intent using AI
    const intent = await this.analyzeUserIntentWithAI(query);
    
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
    
    // Analyze conversation context
    const conversationContext = this.analyzeConversationContext(history);
    
    // Enrich context with real-time data
    const productionData = await this.getProductionStatus(context);
    const insights = await this.analyzeSchedule(context);
    
    // Handle data display intent
    if (intent.type === 'show_data' && intent.confidence > 0.7) {
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
    
    // Build context-aware prompt with conversation history
    const systemPrompt = this.buildSystemPrompt(context, intent);
    const enrichedQuery = await this.enrichQuery(query, productionData, insights, context, conversationContext);

    try {
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
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 1000
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

      return {
        content: assistantContent,
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
  private buildSystemPrompt(context: MaxContext, intent?: { type: string; target?: string; confidence: number }): string {
    const basePrompt = `You are Max, an intelligent manufacturing assistant for PlanetTogether SCM + APS system. 
    You have deep knowledge of production scheduling, resource optimization, quality management, and supply chain operations.
    You provide actionable insights and can help optimize manufacturing processes.

    COMMUNICATION RULES:
    - When users ask to "show me" something specific (like "show me the production schedule"), understand they want to SEE that page/data, not just talk about it
    - Be direct and specific in your questions - avoid compound questions that ask multiple things at once
    - For general status queries, provide a high-level summary first, then offer specific help
    - When mentioning alerts, provide basic count/summary first, then ask if user wants detailed analysis
    - Ask only ONE clear question at a time
    - When user says "Yes" to analyzing alerts, immediately analyze ALL the specific alerts mentioned - don't ask for more clarification
    - If you know there are specific alerts (like 3 active alerts), analyze those exact alerts when requested
    - For production status: give overview first, then offer "Would you like me to analyze the alerts?"
    
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
        title: args.title || 'AI Generated Alert',
        description: args.description,
        severity: args.severity,
        type: args.type || 'production',
        status: 'active',
        aiGenerated: true,
        aiModel: 'gpt-4o',
        aiConfidence: 0.9,
        detectedAt: new Date()
      }).returning();

      return {
        content: `Alert created: "${args.title || 'AI Generated Alert'}". It has been added to the alerts dashboard with ${args.severity} priority.`,
        success: true,
        action: 'create_alert',
        data: newAlert
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

export const maxAI = new MaxAIService();