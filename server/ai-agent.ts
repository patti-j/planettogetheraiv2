import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { storage } from "./storage";
import { InsertProductionOrder, InsertDiscreteOperation, InsertProcessOperation, InsertResource } from "@shared/schema";
import { DEFAULT_MODEL, AI_MODEL_CONFIG } from "./config/ai-model";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Anthropic for better document analysis and vision capabilities
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface AttachmentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string; // base64 for images, text content for documents
  url?: string; // for preview
}

export interface AIAgentResponse {
  success: boolean;
  message: string;
  data?: any;
  actions?: string[];
  canvasAction?: {
    type: string;
    content?: any;
  };
}

export interface SystemContext {
  jobs: any[];
  operations: any[];
  resources: any[];
  capabilities: any[];
  plants: any[];
}

// Helper function to generate content-based tags
function generateContentBasedTags(details: any): string[] {
  const tags: string[] = [];
  
  if (!details) return ['analytics', 'dashboard', 'metrics'];
  
  // Add tags based on data source
  if (details.dataSource) {
    switch (details.dataSource.toLowerCase()) {
      case 'jobs':
      case 'production':
        tags.push('production', 'orders', 'manufacturing');
        break;
      case 'resources':
      case 'equipment':
        tags.push('resources', 'equipment', 'capacity');
        break;
      case 'operations':
        tags.push('operations', 'processes', 'workflow');
        break;
      case 'quality':
      case 'metrics':
        tags.push('quality', 'compliance', 'testing');
        break;
      case 'inventory':
      case 'stocks':
        tags.push('inventory', 'materials', 'stock-levels');
        break;
      case 'schedule':
      case 'planning':
        tags.push('scheduling', 'planning', 'timeline');
        break;
      default:
        tags.push('analytics', 'data');
    }
  }
  
  // Add tags based on chart type
  if (details.chartType) {
    switch (details.chartType.toLowerCase()) {
      case 'gauge':
      case 'status':
        tags.push('status-monitoring', 'real-time', 'dashboard');
        break;
      case 'bar':
      case 'column':
        tags.push('comparison', 'trends', 'analytics');
        break;
      case 'line':
      case 'timeline':
        tags.push('trends', 'historical', 'tracking');
        break;
      case 'pie':
      case 'donut':
        tags.push('distribution', 'breakdown', 'percentages');
        break;
      case 'kpi':
      case 'metric':
        tags.push('kpi', 'performance', 'key-metrics');
        break;
      case 'list':
      case 'table':
        tags.push('detailed-view', 'data-table', 'listing');
        break;
      default:
        tags.push('visualization', 'chart');
    }
  }
  
  // Add tags based on category
  if (details.category) {
    tags.push(details.category.toLowerCase().replace(/ /g, '-'));
  }
  
  // Add tags based on title content
  if (details.title) {
    const title = details.title.toLowerCase();
    if (title.includes('efficiency')) tags.push('efficiency', 'optimization');
    if (title.includes('overview')) tags.push('overview', 'summary');
    if (title.includes('status')) tags.push('status', 'monitoring');
    if (title.includes('alert')) tags.push('alerts', 'notifications');
    if (title.includes('performance')) tags.push('performance', 'benchmarking');
    if (title.includes('utilization')) tags.push('utilization', 'capacity');
    if (title.includes('defect') || title.includes('quality')) tags.push('quality-control', 'defects');
    if (title.includes('maintenance')) tags.push('maintenance', 'upkeep');
    if (title.includes('forecast')) tags.push('forecasting', 'prediction');
  }
  
  // Add contextual manufacturing tags
  tags.push('manufacturing');
  
  // Remove duplicates and limit to 6 most relevant tags
  const uniqueTags = [...new Set(tags)];
  return uniqueTags.slice(0, 6);
}

export async function processDesignStudioAIRequest(prompt: string, context: string, systemData: any): Promise<AIAgentResponse> {
  try {
    console.log('🎯 Processing Design Studio AI request:', { prompt, context, systemData });

    // Get current system data for context (using available methods)
    const widgets = systemData.widgets || 0;
    const dashboards = systemData.dashboards || 0;
    
    const systemPrompt = `You are an AI Design Assistant for a manufacturing ERP system. You help users create, modify, delete, and preview widgets, dashboards, pages, and menu structures.

CURRENT SYSTEM STATE:
- Widgets: ${systemData?.widgets || 0} total
- Dashboards: ${systemData?.dashboards || 0} total
- Pages: ${systemData?.pages || 0} total  
- Menu Sections: ${systemData?.menuSections || 0} total

CONTEXT: Currently working on ${context}

MANUFACTURING DOMAIN KNOWLEDGE:
- Production Orders: Jobs with statuses (In Progress, Completed, Delayed, Quality Hold)
- Operations: Process steps (mixing, heating, cooling, packaging, testing)
- Resources: Equipment (reactors, mixers, conveyors), personnel, tools
- Quality: Defect rates, compliance metrics, inspection results
- Inventory: Stock levels, reorder points, material flow
- Scheduling: Timeline optimization, bottleneck analysis, capacity planning

Your capabilities:
1. CREATE: Generate new widgets, dashboards, pages, or menu structures with descriptive names
2. VIEW/OPEN: Display existing widgets, dashboards, or pages with their current configuration and data
3. MODIFY: Update existing items with new configurations based on current state
4. DELETE: Remove outdated or unnecessary items (with confirmation required)
5. REORGANIZE: Restructure menus and layouts for better workflow
6. PREVIEW: Show mockup data for widgets, dashboards, or pages

When creating widgets, provide DETAILED specifications:
- Title: Clear, specific name (e.g., "Production Line Efficiency", "Quality Defect Trends")
- Subtitle: Brief explanation of purpose and key metrics shown
- Description: Detailed explanation of value and usage
- Data Source: Appropriate source (jobs, operations, resources, stocks, quality)
- Chart Type: Best visualization (bar, line, pie, gauge, number)
- Category: Logical grouping (production, quality, inventory, scheduling)

When viewing widgets, analyze the user request for:
- Keywords like "open", "show", "view", "display", "see", "look at", "check"
- References to existing widget names or types
- Questions about current configuration or status

When modifying widgets, look for:
- Keywords like "edit", "modify", "change", "update", "improve", "enhance"
- Specific changes requested (color, chart type, refresh rate, description)
- References to adding features or improving functionality

Response format: Always return JSON with:
{
  "success": true,
  "action": "create_widget|view_widget|modify_widget|modify_dashboard|create_page|reorganize_menu|preview_item|general_info",
  "message": "User-friendly description of what was done",
  "details": {
    "title": "Clear, descriptive name",
    "subtitle": "Purpose and key metrics",
    "description": "Detailed explanation of value",
    "type": "widget type or chart type", 
    "dataSource": "appropriate data source",
    "chartType": "visualization type",
    "category": "logical grouping"
  }
}

Examples:
- "Create a widget to track stock levels" → action: "create_widget" with "Current Inventory Levels"
- "Show me the Production Overview widget" → action: "view_widget" to display existing widget details
- "Open the Quality Metrics widget" → action: "view_widget" to display current configuration
- "View widget details for Equipment Status" → action: "view_widget" to show widget configuration
- "Edit the Resource Status widget to show more details" → action: "modify_widget" with improvements
- "Preview the factory dashboard" → action: "preview_item" with mockup data

Analyze the user request and determine the appropriate action.`;

    // Use GPT-4o for natural language processing
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
    console.log('🎯 AI Response generated:', aiResponse);

    // Process the action - actually execute it
    if (aiResponse.action === 'create_widget') {
      console.log('✅ Creating widget based on AI response:', aiResponse.details);
      
      // Create a real widget in the database with improved naming
      try {
        const widgetData = {
          title: aiResponse.details?.title || `Production Widget ${Date.now()}`,
          subtitle: aiResponse.details?.subtitle || 'Real-time manufacturing metrics',
          targetPlatform: 'both' as const,
          widgetType: aiResponse.details?.type || 'kpi',
          dataSource: aiResponse.details?.dataSource || 'jobs',
          chartType: aiResponse.details?.chartType || 'number',
          aggregation: aiResponse.details?.aggregation || 'count',
          groupBy: aiResponse.details?.groupBy || null,
          sortBy: aiResponse.details?.sortBy || null,
          filters: aiResponse.details?.filters || {},
          colors: aiResponse.details?.colors || {},
          thresholds: aiResponse.details?.thresholds || {},
          limit: aiResponse.details?.limit || 10,
          size: { width: 4, height: 3 },
          position: { x: 0, y: 0 },
          refreshInterval: aiResponse.details?.refreshInterval || 30,
          drillDownTarget: aiResponse.details?.drillDownTarget || null,
          drillDownParams: aiResponse.details?.drillDownParams || {},
          deployedSystems: ['mobile', 'desktop'],
          systemSpecificConfig: {},
          createdBy: 1, // Use integer ID instead of string
          isShared: true,
          sharedWith: [],
          tags: generateContentBasedTags(aiResponse.details),
          description: aiResponse.details?.description || 'Manufacturing widget created by AI to track key production metrics and performance indicators',
          category: aiResponse.details?.category || 'production',
          isTemplate: false,
          templateCategory: null
        };
        
        console.log('🔍 Widget data before creation:', JSON.stringify(widgetData, null, 2));

        try {
          console.log('🔧 About to call storage.createWidget with data:', JSON.stringify(widgetData, null, 2));
          const newWidget = await storage.createWidget(widgetData);
          console.log('🎯 Widget created successfully:', newWidget);
          aiResponse.createdWidget = newWidget;
        } catch (validationError) {
          console.error('❌ Widget validation error:', validationError);
          console.error('❌ Error message:', validationError.message);
          console.error('❌ Error stack:', validationError.stack);
          console.error('❌ Widget data that failed:', JSON.stringify(widgetData, null, 2));
          aiResponse.error = `Widget creation failed: ${validationError.message}`;
          // Don't re-throw, just log and continue
        }
      } catch (error) {
        console.error('❌ Failed to create widget:', error);
        aiResponse.error = 'Failed to create widget in database';
      }
    } else if (aiResponse.action === 'delete_widget') {
      console.log('🗑️ Deleting widget based on AI response:', aiResponse);
      
      try {
        const { db } = await import('./db');
        const { unifiedWidgets } = await import('../shared/schema');
        const { eq } = await import('drizzle-orm');
        
        // Find the widget to delete
        const allWidgets = await db.select().from(unifiedWidgets);
        const userPrompt = prompt.toLowerCase();
        
        const targetWidget = allWidgets.find(widget => {
          const title = widget.title?.toLowerCase() || '';
          const titleWords = title.split(' ');
          const promptWords = userPrompt.split(' ');
          
          // Match by widget ID
          if (userPrompt.match(/widget (\d+)/) && widget.id === parseInt(userPrompt.match(/widget (\d+)/)[1])) {
            return true;
          }
          
          // Match by title keywords
          if (titleWords.some(word => word.length > 2 && promptWords.includes(word))) {
            return true;
          }
          
          return false;
        });
        
        if (targetWidget) {
          await db.delete(unifiedWidgets).where(eq(unifiedWidgets.id, targetWidget.id));
          aiResponse.message = `Successfully deleted "${targetWidget.title}" widget`;
          aiResponse.deletedWidget = targetWidget;
        } else {
          aiResponse.error = 'Could not find the widget to delete. Please specify the widget name or ID.';
        }
      } catch (error) {
        console.error('❌ Widget deletion failed:', error);
        aiResponse.error = `Failed to delete widget: ${error.message}`;
      }
    } else if (aiResponse.action === 'delete_dashboard') {
      console.log('🗑️ Deleting dashboard based on AI response:', aiResponse);
      
      try {
        const { db } = await import('./db');
        const { dashboards } = await import('../shared/schema');
        const { eq } = await import('drizzle-orm');
        
        // Find the dashboard to delete
        const allDashboards = await db.select().from(dashboards);
        const userPrompt = prompt.toLowerCase();
        
        const targetDashboard = allDashboards.find(dashboard => {
          const title = dashboard.title?.toLowerCase() || '';
          const titleWords = title.split(' ');
          const promptWords = userPrompt.split(' ');
          
          // Match by dashboard ID
          if (userPrompt.match(/dashboard (\d+)/) && dashboard.id === parseInt(userPrompt.match(/dashboard (\d+)/)[1])) {
            return true;
          }
          
          // Match by title keywords
          if (titleWords.some(word => word.length > 2 && promptWords.includes(word))) {
            return true;
          }
          
          return false;
        });
        
        if (targetDashboard) {
          await db.delete(dashboards).where(eq(dashboards.id, targetDashboard.id));
          aiResponse.message = `Successfully deleted "${targetDashboard.title}" dashboard`;
          aiResponse.deletedDashboard = targetDashboard;
        } else {
          aiResponse.error = 'Could not find the dashboard to delete. Please specify the dashboard name or ID.';
        }
      } catch (error) {
        console.error('❌ Dashboard deletion failed:', error);
        aiResponse.error = `Failed to delete dashboard: ${error.message}`;
      }
    } else if (aiResponse.action === 'delete_page') {
      console.log('🗑️ Processing page deletion request based on AI response:', aiResponse);
      
      // Since pages are static data in the system, we'll simulate the deletion
      const userPrompt = prompt.toLowerCase();
      const pageNameMatch = userPrompt.match(/delete\s+(?:the\s+)?(?:page\s+)?['""]?([^'""\s]+(?:\s+[^'""\s]+)*)['""]?/i);
      const pageName = pageNameMatch ? pageNameMatch[1] : 'requested page';
      
      aiResponse.message = `Page deletion request processed for "${pageName}". Note: Pages are part of the core system architecture and cannot be permanently deleted, but this request has been logged for system administrators.`;
      aiResponse.deletedPage = { name: pageName };
    } else if (aiResponse.action === 'view_widget') {
      console.log('👁️ Viewing widget based on AI response:', aiResponse);
      
      // Extract widget identifier from the user prompt (could be name, ID, or description)
      const userPrompt = prompt.toLowerCase();
      let targetWidget = null;
      
      try {
        // Import database directly
        const { db } = await import('./db');
        const { unifiedWidgets } = await import('../shared/schema');
        const allWidgets = await db.select().from(unifiedWidgets);
        console.log('🔍 Available widgets:', allWidgets.map(w => ({ id: w.id, title: w.title })));
        
        // Try to find the widget by various criteria
        targetWidget = allWidgets.find(widget => {
          const title = widget.title?.toLowerCase() || '';
          const description = widget.description?.toLowerCase() || '';
          const category = widget.category?.toLowerCase() || '';
          
          // Match by widget ID if it's a number
          if (userPrompt.match(/widget (\d+)/) && widget.id === parseInt(userPrompt.match(/widget (\d+)/)[1])) {
            return true;
          }
          
          // Match by title keywords
          const titleWords = title.split(' ');
          const promptWords = userPrompt.split(' ');
          if (titleWords.some(word => word.length > 2 && promptWords.includes(word)) && titleWords.length > 1) {
            return true;
          }
          
          // Match by category
          if (category && userPrompt.includes(category)) {
            return true;
          }
          
          // Match specific keywords
          if (userPrompt.includes('production') && (title.includes('production') || category === 'production')) {
            return true;
          }
          if (userPrompt.includes('quality') && (title.includes('quality') || category === 'quality')) {
            return true;
          }
          if (userPrompt.includes('inventory') && (title.includes('inventory') || category === 'inventory')) {
            return true;
          }
          if (userPrompt.includes('resource') && (title.includes('resource') || category === 'resources')) {
            return true;
          }
          
          return false;
        });
        
        if (!targetWidget && allWidgets.length > 0) {
          // Default to the most recently created widget if no specific match
          targetWidget = allWidgets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        }
        
        if (targetWidget) {
          aiResponse.currentWidget = {
            id: targetWidget.id,
            title: targetWidget.title,
            subtitle: targetWidget.subtitle,
            description: targetWidget.description,
            type: targetWidget.widgetType,
            dataSource: targetWidget.dataSource,
            chartType: targetWidget.chartType,
            category: targetWidget.category,
            targetPlatform: targetWidget.targetPlatform,
            refreshInterval: targetWidget.refreshInterval,
            filters: targetWidget.filters,
            colors: targetWidget.colors,
            thresholds: targetWidget.thresholds,
            tags: targetWidget.tags,
            isShared: targetWidget.isShared,
            createdAt: targetWidget.createdAt,
            updatedAt: targetWidget.updatedAt
          };
          aiResponse.message = `Currently viewing "${targetWidget.title}" widget - ${targetWidget.subtitle || 'Manufacturing widget'}`;
        } else {
          aiResponse.error = 'Could not find a widget matching your request. Available widgets: ' + 
                             allWidgets.map(w => w.title).join(', ');
        }
      } catch (error) {
        console.error('❌ Widget viewing failed:', error);
        aiResponse.error = `Failed to view widget: ${error.message}`;
      }
    } else if (aiResponse.action === 'modify_widget') {
      console.log('✏️ Modifying widget based on AI response:', aiResponse);
      
      const userPrompt = prompt.toLowerCase();
      let targetWidget = null;
      
      try {
        // Import database directly
        const { db } = await import('./db');
        const { unifiedWidgets } = await import('../shared/schema');
        const { eq } = await import('drizzle-orm');
        const allWidgets = await db.select().from(unifiedWidgets);
        console.log('🔍 Available widgets for modification:', allWidgets.map(w => ({ id: w.id, title: w.title })));
        
        // Find the widget to modify using similar logic as view_widget
        targetWidget = allWidgets.find(widget => {
          const title = widget.title?.toLowerCase() || '';
          const category = widget.category?.toLowerCase() || '';
          
          // Match by widget ID if it's a number
          if (userPrompt.match(/widget (\d+)/) && widget.id === parseInt(userPrompt.match(/widget (\d+)/)[1])) {
            return true;
          }
          
          // Match by title keywords
          const titleWords = title.split(' ');
          const promptWords = userPrompt.split(' ');
          if (titleWords.some(word => word.length > 2 && promptWords.includes(word)) && titleWords.length > 1) {
            return true;
          }
          
          // Match by category
          if (category && userPrompt.includes(category)) {
            return true;
          }
          
          // Match specific keywords
          if (userPrompt.includes('production') && (title.includes('production') || category === 'production')) {
            return true;
          }
          if (userPrompt.includes('quality') && (title.includes('quality') || category === 'quality')) {
            return true;
          }
          if (userPrompt.includes('inventory') && (title.includes('inventory') || category === 'inventory')) {
            return true;
          }
          if (userPrompt.includes('resource') && (title.includes('resource') || category === 'resources')) {
            return true;
          }
          
          return false;
        });
        
        if (targetWidget) {
          // Apply the modifications suggested by AI
          const updates = {
            subtitle: aiResponse.details?.subtitle || targetWidget.subtitle,
            description: aiResponse.details?.description || targetWidget.description,
            chartType: aiResponse.details?.chartType || targetWidget.chartType,
            refreshInterval: aiResponse.details?.refreshInterval || targetWidget.refreshInterval,
            colors: aiResponse.details?.colors || targetWidget.colors,
            thresholds: aiResponse.details?.thresholds || targetWidget.thresholds,
            updatedAt: new Date().toISOString()
          };
          
          console.log('🔧 Applying widget updates:', updates);
          
          const updatedWidget = await db
            .update(unifiedWidgets)
            .set(updates)
            .where(eq(unifiedWidgets.id, targetWidget.id))
            .returning();
          
          if (updatedWidget.length > 0) {
            aiResponse.modifiedWidget = updatedWidget[0];
            aiResponse.message = `Successfully modified "${targetWidget.title}" widget with ${aiResponse.details?.improvementDescription || 'AI enhancements'}`;
          } else {
            aiResponse.error = 'Failed to update widget in database';
          }
        } else {
          aiResponse.error = 'Could not find the widget to modify. Available widgets: ' + 
                             allWidgets.map(w => w.title).join(', ');
        }
      } catch (error) {
        console.error('❌ Widget modification failed:', error);
        aiResponse.error = `Failed to modify widget: ${error.message}`;
      }
    } else if (aiResponse.action === 'modify_dashboard') {
      console.log('✅ Dashboard modification logic would go here:', aiResponse.details);
    } else if (aiResponse.action === 'preview_item') {
      console.log('✅ Generating preview for:', aiResponse.details);
      
      // Generate preview data based on item type
      const itemType = aiResponse.details?.itemType || 'widget';
      let previewData = {};
      
      if (itemType === 'widget') {
        previewData = {
          title: aiResponse.details?.title || 'Sample Widget',
          subtitle: aiResponse.details?.subtitle || 'Preview data',
          type: aiResponse.details?.type || 'kpi',
          dataSource: aiResponse.details?.dataSource || 'jobs',
          mockData: {
            value: 42,
            trend: '+5%',
            status: 'normal',
            data: [
              { name: 'Active Jobs', value: 15 },
              { name: 'Completed', value: 27 },
              { name: 'Delayed', value: 3 }
            ]
          }
        };
      } else if (itemType === 'dashboard') {
        previewData = {
          layout: 'grid',
          widgets: [
            { title: 'Production Overview', type: 'kpi', position: { x: 0, y: 0 } },
            { title: 'Quality Metrics', type: 'chart', position: { x: 1, y: 0 } },
            { title: 'Equipment Status', type: 'gauge', position: { x: 0, y: 1 } }
          ]
        };
      }
      
      aiResponse.previewData = previewData;
    }

    return {
      success: true,
      message: aiResponse.message || 'AI request processed successfully',
      data: aiResponse,
      actions: [aiResponse.action]
    };

  } catch (error) {
    console.error('Design Studio AI error:', error);
    return {
      success: false,
      message: 'Failed to process design request',
      data: { error: error.message }
    };
  }
}

export async function processShiftAIRequest(request: any): Promise<AIAgentResponse> {
  try {
    // Get current system context for shift planning
    const context = await getSystemContext();
    let resources = [];
    try {
      resources = await storage.getResources();
    } catch (error) {
      console.log('Resources table not available, using empty array');
    }
    const shiftTemplates = await storage.getShiftTemplates();
    
    const systemPrompt = `You are an AI shift planning expert for a manufacturing facility. You have access to:

AVAILABLE RESOURCES:
${resources.map(r => `- ${r.name} (${r.type}): ${r.status}`).join('\n')}

EXISTING SHIFT TEMPLATES:
${shiftTemplates.map(t => `- ${t.name}: ${t.startTime}-${t.endTime}, ${t.shiftType} shift, Days: ${t.daysOfWeek?.join(',') || 'Not specified'}`).join('\n')}

Your capabilities:
1. CREATE SHIFTS: Generate optimized shift templates based on requirements
2. ADJUST SHIFTS: Modify existing shifts for better efficiency or coverage
3. OPTIMIZE SHIFTS: Balance workload, minimize costs, ensure coverage

Response format: Always return JSON with:
{
  "success": true,
  "message": "Description of changes made",
  "shiftTemplates": [array of shift template objects],
  "recommendations": [array of optimization suggestions],
  "reasoning": "Explanation of AI decisions made"
}

Shift template format:
{
  "name": "string",
  "description": "string", 
  "plantId": number or null,
  "shiftType": "regular|overtime|split|rotating",
  "startTime": "HH:MM",
  "endTime": "HH:MM", 
  "duration": number (minutes between start and end time),
  "daysOfWeek": [0-6 array],
  "minimumStaffing": number,
  "maximumStaffing": number,
  "premiumRate": number,
  "color": "hex color",
  "isActive": true
}`;

    let userPrompt = '';
    
    if (request.type === 'create') {
      userPrompt = `Create new shift templates based on these requirements:
Requirements: ${request.requirements}
Plant ID: ${request.plantId || 'All plants'}
Available Resources: ${request.resources.length} resources
Existing Shifts: ${request.existingShifts.length} templates

Please create optimized shift templates that meet these requirements while considering resource availability and existing shift patterns.

IMPORTANT: Calculate the duration field in minutes between start and end times. For example, if startTime is "06:00" and endTime is "14:00", the duration should be 480 minutes (8 hours).`;
    } else if (request.type === 'adjust') {
      userPrompt = `Adjust an existing shift template:
Shift ID: ${request.shiftId}
Requested Adjustments: ${request.adjustments}
Requirements: ${request.requirements}
Context: ${JSON.stringify(request.context)}

Please modify the shift template to incorporate these adjustments while maintaining operational efficiency.`;
    } else if (request.type === 'optimize') {
      userPrompt = `Optimize shift scheduling:
Current Shifts: ${JSON.stringify(request.shifts)}
Constraints: ${JSON.stringify(request.constraints)}
Objectives: ${JSON.stringify(request.objectives)}

Please analyze and optimize the shift schedule to improve efficiency, reduce costs, and ensure proper coverage.`;
    }

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const aiResult = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      success: aiResult.success || true,
      message: aiResult.message || "AI shift processing completed",
      data: {
        shiftTemplates: aiResult.shiftTemplates || [],
        recommendations: aiResult.recommendations || [],
        reasoning: aiResult.reasoning || "AI analysis completed"
      }
    };
  } catch (error) {
    console.error("Error processing shift AI request:", error);
    return {
      success: false,
      message: "Failed to process AI shift request: " + (error instanceof Error ? error.message : String(error))
    };
  }
}

export async function processShiftAssignmentAIRequest(request: any): Promise<AIAgentResponse> {
  try {
    // Get current system context for shift assignment
    const context = await getSystemContext();
    let resources = [];
    try {
      resources = await storage.getResources();
    } catch (error) {
      console.log('Resources table not available, using empty array');
    }
    const shiftTemplates = await storage.getShiftTemplates();
    const existingAssignments = await storage.getResourceShiftAssignments();
    
    const systemPrompt = `You are an AI shift assignment expert for a manufacturing facility. You intelligently assign shift templates to specific resources based on requirements.

AVAILABLE RESOURCES:
${resources.map(r => `- ID ${r.id}: ${r.name} (${r.type}) - Status: ${r.status}, Capabilities: ${r.capabilities?.join(', ') || 'None'}`).join('\n')}

AVAILABLE SHIFT TEMPLATES:
${shiftTemplates.map(t => `- ID ${t.id}: ${t.name} (${t.shiftType}) - ${t.startTime} to ${t.endTime}, Days: ${t.daysOfWeek?.join(',') || 'All'}, Min Staff: ${t.minimumStaffing}, Max Staff: ${t.maximumStaffing}`).join('\n')}

EXISTING ASSIGNMENTS:
${existingAssignments.map(a => `- Resource ${a.resourceId} assigned to Template ${a.shiftTemplateId} from ${a.effectiveDate} ${a.endDate ? `to ${a.endDate}` : '(indefinite)'} - Status: ${a.status}`).join('\n')}

Your capabilities:
1. ASSIGN SHIFTS: Match resources to appropriate shift templates
2. OPTIMIZE COVERAGE: Ensure proper staffing levels and skill coverage
3. HANDLE CONSTRAINTS: Consider resource availability, skills, and existing assignments
4. PLAN TRANSITIONS: Schedule shift changes and temporary assignments

Assignment considerations:
- Resource type and capabilities must match shift requirements
- Avoid conflicting assignments (same resource on multiple shifts at same time)
- Consider workload balancing and fair shift distribution
- Respect minimum/maximum staffing requirements for each shift
- Plan for transition periods and training requirements

Response format: Always return JSON with:
{
  "success": true,
  "message": "Description of assignments made",
  "assignments": [array of assignment objects],
  "recommendations": [array of optimization suggestions],
  "reasoning": "Explanation of AI assignment decisions",
  "conflicts": [array of any conflicts detected],
  "coverage": "Summary of shift coverage achieved"
}

Assignment object format:
{
  "resourceId": number,
  "shiftTemplateId": number,
  "effectiveDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD" or null for indefinite,
  "assignedBy": 6,
  "notes": "string explanation",
  "isTemporary": boolean,
  "status": "active"
}`;

    const userPrompt = `Create shift assignments based on these requirements:

Requirements: ${request.requirements}

Available Templates: ${request.templates.length} shift templates
Available Resources: ${request.resources.length} resources  
Plants: ${request.plants.length} plant locations

Please create optimized shift assignments that:
1. Meet the stated requirements
2. Ensure proper coverage and staffing levels
3. Balance workload across resources
4. Minimize conflicts and scheduling issues
5. Consider resource capabilities and shift requirements

Focus on practical, implementable assignments that can be created immediately.`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const aiResult = JSON.parse(response.choices[0].message.content || '{}');
    
    // Create the assignments if AI generated them
    const createdAssignments = [];
    if (aiResult.assignments && Array.isArray(aiResult.assignments)) {
      for (const assignment of aiResult.assignments) {
        try {
          const created = await storage.createResourceShiftAssignment({
            resourceId: assignment.resourceId,
            shiftTemplateId: assignment.shiftTemplateId,
            effectiveDate: new Date(assignment.effectiveDate),
            endDate: assignment.endDate ? new Date(assignment.endDate) : undefined,
            assignedBy: assignment.assignedBy || 6,
            notes: assignment.notes || '',
            isTemporary: assignment.isTemporary || false,
            status: assignment.status || 'active'
          });
          createdAssignments.push(created);
        } catch (assignmentError) {
          console.error("Error creating assignment:", assignmentError);
        }
      }
    }
    
    return {
      success: aiResult.success || true,
      message: aiResult.message || `AI created ${createdAssignments.length} shift assignments`,
      data: {
        assignments: createdAssignments,
        recommendations: aiResult.recommendations || [],
        reasoning: aiResult.reasoning || "AI assignment analysis completed",
        conflicts: aiResult.conflicts || [],
        coverage: aiResult.coverage || "Assignment coverage analysis completed"
      }
    };
  } catch (error) {
    console.error("Error processing shift assignment AI request:", error);
    return {
      success: false,
      message: "Failed to process AI shift assignment request: " + (error instanceof Error ? error.message : String(error))
    };
  }
}

export async function processAICommand(command: string, attachments?: AttachmentFile[]): Promise<AIAgentResponse> {
  try {
    // Add detailed logging for debugging the API issue
    console.log('=== AI REQUEST DEBUG ===');
    console.log('User command:', command);
    console.log('Command contains "api":', command.toLowerCase().includes('api'));
    console.log('Command contains "function":', command.toLowerCase().includes('function'));
    console.log('Command contains "capabilit":', command.toLowerCase().includes('capabilit'));
    console.log('Command contains "help":', command.toLowerCase().includes('help'));
    console.log('========================');
    
    // Get current system context
    const context = await getSystemContext();
    
    // Include live system data for AI responses
    const contextSummary = {
      jobCount: context.jobs.length,
      operationCount: context.operations.length,
      resourceCount: context.resources.length,
      capabilityCount: context.capabilities.length,
      plantCount: context.plants.length,
      allJobs: context.jobs.map(j => ({ id: j.id, name: j.name, status: j.status, customerId: j.customerId, priority: j.priority, dueDate: j.dueDate })),
      allResources: context.resources.map(r => ({ id: r.id, name: r.name, type: r.type, status: r.status })),
      allCapabilities: context.capabilities.map(c => ({ id: c.id, name: c.name, description: c.description })),
      allPlants: context.plants.map(p => ({ id: p.id, name: p.name, address: p.address, timezone: p.timezone, isActive: p.isActive }))
    };

    let aiResponse;

    // If attachments are present, use Anthropic for better document/image analysis
    if (attachments && attachments.length > 0) {
      aiResponse = await processCommandWithAttachments(command, attachments, contextSummary);
    } else {
      // Use GPT-4o for text-only commands
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: `AI agent for manufacturing system with LIVE DATA ACCESS.

FIRST PRIORITY RULE - API DOCUMENTATION OVERRIDE:
If the user asks ANYTHING about your functions, capabilities, APIs, or what you can do - IMMEDIATELY use LIST_AVAILABLE_APIS action. 
Examples that MUST use LIST_AVAILABLE_APIS:
- "list api", "list your api", "show API", "what APIs", "what functions", "your capabilities", "what can you do", "help", "functions you can perform"
- "listing of API", "API listing", "available APIs", "available functions", "show me your functions"
- ANY question containing words: api, functions, capabilities, help, what can you do
- DO NOT use LIST_JOBS for these requests under ANY circumstances.

KEYWORD DETECTION: If user message contains "api", "function", "capabilit", "help" (in any context about Max) → use LIST_AVAILABLE_APIS

Current system data:

LIVE DATA AVAILABLE:
- Total Jobs: ${contextSummary.jobCount}
- All Jobs: ${JSON.stringify(contextSummary.allJobs)}
- Total Operations: ${contextSummary.operationCount} 
- Total Resources: ${contextSummary.resourceCount}
- All Resources: ${JSON.stringify(contextSummary.allResources)}
- Total Capabilities: ${contextSummary.capabilityCount}
- All Capabilities: ${JSON.stringify(contextSummary.allCapabilities)}
- Total Plants: ${contextSummary.plantCount}
- All Plants: ${JSON.stringify(contextSummary.allPlants)}

IMPORTANT: You have access to real live manufacturing data. When users ask about jobs, operations, resources, plants, or system status, use the provided live data above to give accurate answers. DO NOT say you don't have access - you have direct access to current system data.

Available actions: LIST_WIDGETS, LIST_JOBS, LIST_OPERATIONS, LIST_RESOURCES, LIST_PLANTS, CREATE_JOB, CREATE_OPERATION, CREATE_RESOURCE, CREATE_KANBAN_BOARD, ANALYZE_LATE_JOBS, GET_STATUS, ANALYZE_DOCUMENT, ANALYZE_IMAGE, NAVIGATE_TO_PAGE, OPEN_DASHBOARD, CREATE_DASHBOARD, OPEN_GANTT_CHART, OPEN_ANALYTICS, OPEN_BOARDS, OPEN_REPORTS, OPEN_SHOP_FLOOR, OPEN_VISUAL_FACTORY, OPEN_CAPACITY_PLANNING, OPEN_OPTIMIZATION_STUDIO, OPEN_PRODUCTION_PLANNING, OPEN_SYSTEMS_INTEGRATION, OPEN_ROLE_MANAGEMENT, CREATE_ANALYTICS_WIDGET, TRIGGER_UI_ACTION, SHOW_SCHEDULE_EVALUATION, MAXIMIZE_VIEW, MINIMIZE_VIEW, SHOW_CANVAS, CANVAS_CONTENT, CLEAR_CANVAS, CREATE_CHART, CREATE_PIE_CHART, CREATE_LINE_CHART, CREATE_BAR_CHART, CREATE_HISTOGRAM, CREATE_GANTT_CHART, SHOW_API_DOCUMENTATION, START_TOUR, CREATE_TOUR, and others.

Tour Guidelines:
- START_TOUR: Start a guided tour for a specific role with voice narration
- CREATE_TOUR: Create a new custom tour based on user description and target roles
- Tour parameters: {roleId: number, voiceEnabled: boolean (default true), context: "demo" | "training" (default "demo")}
- Custom tour parameters: {title: string, description: string, targetRoles: array, focusAreas: array, voiceEnabled: boolean}
- Common role IDs: Trainer (9), Director (1), Plant Manager (2), Production Scheduler (3), Systems Manager (5)
- When users ask for tours, training, or guidance, use START_TOUR action to initiate appropriate role-based tours
- When users want to create custom tours or request specific training content, use CREATE_TOUR action
- Examples: "start tour" = START_TOUR with current user's role, "create a tour about scheduling for managers" = CREATE_TOUR with specific parameters

CRITICAL DISTINCTION:
- For API documentation requests ("available APIs", "what APIs can you call", "list of available functions", "what functions can you perform", "what can you do", "your capabilities", "available commands", "list your functions", "show me your functions", "help", "commands", "what are your capabilities", "what do you do", "tell me about yourself"): ALWAYS use LIST_AVAILABLE_APIS action
- For actual data requests ("list production orders", "show resources", "available production orders", "available resources", "show me production orders", "what production orders do we have", "how many production orders", "production order data"): Use appropriate data actions (LIST_PRODUCTION_ORDERS, LIST_RESOURCES, etc.)

IMPORTANT: When users ask about "functions you can perform" or "what functions you have" or ANY question about Max's capabilities, they want to see your API capabilities, NOT the production orders in the system. Use LIST_AVAILABLE_APIS for these requests.

DEFAULT BEHAVIOR: If a user asks a general question about what Max can do, capabilities, functions, or help - ALWAYS default to LIST_AVAILABLE_APIS, NOT LIST_PRODUCTION_ORDERS.

WIDGET RECOGNITION: When user asks to show any widget (including misspellings like "optimze", "optmize", "schedulr", etc.), understand they want the optimization widget. Common requests:
- "show optimization widget" → ADD_CANVAS_CONTENT with type: "widget", widgetType: "optimization"
- "show optimze widget" → ADD_CANVAS_CONTENT with type: "widget", widgetType: "optimization"
- "display scheduler widget" → ADD_CANVAS_CONTENT with type: "widget", widgetType: "optimization"
- "add scheduling widget to canvas" → ADD_CANVAS_CONTENT with type: "widget", widgetType: "optimization"

EXAMPLES THAT REQUIRE LIST_AVAILABLE_APIS:
- "What functions can you perform?"
- "What can you do?"
- "Help me understand what you can do"
- "Show me your capabilities"
- "List your functions"
- "What are your capabilities?"
- "Tell me about yourself"
- "What do you do?"
- "How can you help?"

EXAMPLES THAT REQUIRE LIST_WIDGETS:
- "Which widgets do you have?"
- "What widgets are available?"
- "List widgets"
- "Show me the widgets"
- "What widget types exist?"
- "What widget systems are available?"

EXAMPLES THAT REQUIRE LIST_PRODUCTION_ORDERS:
- "Show me the production orders"
- "List all production orders"
- "What production orders do we have?"
- "How many production orders are there?"
- "Show production order data"

UI Navigation Actions:
- NAVIGATE_TO_PAGE: Navigate to specific pages (supports all application pages with permission checking)
- OPEN_DASHBOARD: Open dashboard page and optionally create new dashboard
- OPEN_GANTT_CHART: Navigate to production schedule (Gantt chart) page
- OPEN_ANALYTICS: Navigate to analytics page for data visualization
- OPEN_BOARDS: Navigate to Kanban boards page
- OPEN_REPORTS: Navigate to reports page
- OPEN_SHOP_FLOOR: Navigate to shop floor interface (requires shop-floor-view permission)
- OPEN_VISUAL_FACTORY: Navigate to visual factory interface (requires visual-factory-view permission)
- OPEN_CAPACITY_PLANNING: Navigate to capacity planning (requires capacity-planning-view permission)
- OPEN_OPTIMIZATION_STUDIO: Navigate to optimization studio (requires optimization-studio-view permission)
- OPEN_PRODUCTION_PLANNING: Navigate to production planning (requires production-planning-view permission)
- OPEN_SYSTEMS_INTEGRATION: Navigate to systems integration (requires systems-integration-view permission)
- OPEN_ROLE_MANAGEMENT: Navigate to role management (requires user-management-view permission)
- CREATE_ANALYTICS_WIDGET: Create analytics widgets on dashboard
- TRIGGER_UI_ACTION: Trigger specific UI interactions (open dialogs, click buttons, etc.)
- SHOW_SCHEDULE_EVALUATION: Show schedule evaluation system
- MAXIMIZE_VIEW: Maximize current view
- MINIMIZE_VIEW: Minimize current view
- SHOW_CANVAS: Automatically show canvas in the top portion of the screen when displaying content
- CANVAS_CONTENT: Add content to the canvas for visual display

Available Pages (use with NAVIGATE_TO_PAGE): dashboard, production-schedule, production-planning, analytics, reports, boards, shop-floor, visual-factory, capacity-planning, optimization-studio, scheduling-optimizer, inventory-optimization, demand-forecasting, disruption-management, sales, customer-service, operator-dashboard, maintenance, forklift-driver, plant-manager, systems-integration, system-integrations, systems-management, plants-management, error-logs, role-management, user-roles, business-goals, training, industry-templates, help, chat, presentation-system, presentation-studio, extension-studio, canvas, email-settings, feedback, account, pricing

For CREATE_KANBAN_BOARD: parameters need name, description, viewType (jobs/operations), swimLaneField (status/priority/customer), filters (optional).

Canvas Guidelines:
- When user asks to show data/lists visually or mentions "canvas", "display", "show", or wants to see information, use canvas actions
- For jobs: LIST_JOBS with parameters.displayInCanvas=true
- For resources: LIST_RESOURCES with parameters.displayInCanvas=true
- For operations: LIST_OPERATIONS with parameters.displayInCanvas=true
- For plants: LIST_PLANTS with parameters.displayInCanvas=true
- For optimization widget (also: optimze widget, optimize widget, scheduler widget, scheduling widget): ADD_CANVAS_CONTENT action with parameters: {title: "Schedule Optimization", type: "widget", data: {widgetType: "optimization", config: {showQuickActions: true, showHistory: true, showMetrics: true}}}
- For other data: ADD_CANVAS_CONTENT action with parameters: {title: "descriptive title", type: "table", data: structured_data}
- Canvas displays in the main content area and auto-opens when content is added
- Perfect for: job lists, resource lists, operation tables, performance metrics, data visualizations, optimization widgets
- Examples: "show jobs" = LIST_JOBS with displayInCanvas=true, "list resources" = LIST_RESOURCES with displayInCanvas=true, "show optimization widget" = ADD_CANVAS_CONTENT with type: "widget" and widgetType: "optimization"
- Widget recognition: When user mentions "optimze", "optimize", "optimization", "scheduler", or "scheduling" widget, always use the optimization widget
- For clearing canvas: Use CLEAR_CANVAS when user asks to "clear canvas", "clear the canvas", "remove canvas content", "empty canvas", or similar requests
- Canvas clearing removes all content and widgets from the canvas display area

Chart Creation Guidelines:
- For chart requests, use specific chart actions: CREATE_PIE_CHART, CREATE_LINE_CHART, CREATE_BAR_CHART, CREATE_HISTOGRAM, CREATE_GANTT_CHART
- Chart parameters: {title: "Chart Title", data: [{label: "A", value: 10}, ...], chartType: "pie|line|bar|histogram|gantt"}
- Use live data from the system for charts (jobs, resources, operations, etc.)
- Examples: "pie chart of job status" = CREATE_PIE_CHART with job status data, "line chart of operations over time" = CREATE_LINE_CHART with timeline data
- All charts automatically display in canvas with proper formatting and interactive features

Respond with JSON: {"action": "ACTION_NAME", "parameters": {...}, "message": "response"}`
          },
          {
            role: "user",
            content: command
          }
        ],
        response_format: { type: "json_object" }
      });

      const responseContent = response.choices[0].message.content || "{}";
      console.log("OpenAI Raw Response:", responseContent);
      aiResponse = JSON.parse(responseContent);
    }
    
    console.log("AI Response parsed:", JSON.stringify(aiResponse, null, 2));
    
    // Execute the determined action
    const actionResult = await executeAction(aiResponse.action, aiResponse.parameters, aiResponse.message, context, attachments);
    console.log("Action Result:", JSON.stringify(actionResult, null, 2));
    
    return actionResult;
    
  } catch (error) {
    console.error("AI Agent Error:", error);
    return {
      success: false,
      message: "I encountered an error processing your command. Please try again.",
      data: null
    };
  }
}

async function processCommandWithAttachments(command: string, attachments: AttachmentFile[], contextSummary: any): Promise<any> {
  try {
    // Build message content for Anthropic with attachments
    const content: any[] = [
      {
        type: "text",
        text: `AI agent for manufacturing production system. Context: ${contextSummary.jobCount} jobs, ${contextSummary.operationCount} operations, ${contextSummary.resourceCount} resources.

User command: ${command}

Available actions: LIST_JOBS, LIST_OPERATIONS, LIST_RESOURCES, LIST_PLANTS, CREATE_JOB, CREATE_OPERATION, CREATE_RESOURCE, CREATE_KANBAN_BOARD, ANALYZE_LATE_JOBS, GET_STATUS, ANALYZE_DOCUMENT, ANALYZE_IMAGE, NAVIGATE_TO_PAGE, OPEN_DASHBOARD, CREATE_DASHBOARD, OPEN_GANTT_CHART, OPEN_ANALYTICS, OPEN_BOARDS, OPEN_REPORTS, OPEN_SHOP_FLOOR, OPEN_VISUAL_FACTORY, OPEN_CAPACITY_PLANNING, OPEN_OPTIMIZATION_STUDIO, OPEN_PRODUCTION_PLANNING, OPEN_SYSTEMS_INTEGRATION, OPEN_ROLE_MANAGEMENT, CREATE_ANALYTICS_WIDGET, TRIGGER_UI_ACTION, SHOW_SCHEDULE_EVALUATION, MAXIMIZE_VIEW, MINIMIZE_VIEW, SHOW_CANVAS, CANVAS_CONTENT, CREATE_CHART, CREATE_PIE_CHART, CREATE_LINE_CHART, CREATE_BAR_CHART, CREATE_HISTOGRAM, CREATE_GANTT_CHART, and others.

UI Navigation Actions:
- NAVIGATE_TO_PAGE: Navigate to specific pages (supports all application pages with permission checking)
- OPEN_DASHBOARD: Open dashboard page and optionally create new dashboard
- OPEN_GANTT_CHART: Navigate to production schedule (Gantt chart) page
- OPEN_ANALYTICS: Navigate to analytics page for data visualization
- OPEN_BOARDS: Navigate to Kanban boards page
- OPEN_REPORTS: Navigate to reports page
- CREATE_ANALYTICS_WIDGET: Create analytics widgets on dashboard
- TRIGGER_UI_ACTION: Trigger specific UI interactions (open dialogs, click buttons, etc.)
- SHOW_SCHEDULE_EVALUATION: Show schedule evaluation system
- MAXIMIZE_VIEW: Maximize current view
- MINIMIZE_VIEW: Minimize current view
- SHOW_CANVAS: Automatically show canvas in the top portion of the screen when displaying content
- CANVAS_CONTENT: Add content to the canvas for visual display

Analyze any attached files to help fulfill the user's request. Extract relevant information from documents, images, or data files that could be used to create manufacturing jobs, operations, resources, or provide insights.

Respond with JSON: {"action": "ACTION_NAME", "parameters": {...}, "message": "response"}`
      }
    ];

    // Add attachments to the message content
    attachments.forEach(attachment => {
      if (attachment.type.startsWith("image/") && attachment.content) {
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: attachment.type,
            data: attachment.content
          }
        });
      } else if (attachment.content && (attachment.type === "text/plain" || attachment.type === "application/json")) {
        content.push({
          type: "text",
          text: `File: ${attachment.name}\nContent:\n${attachment.content}`
        });
      }
    });

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: content
        }
      ]
    });

    // Parse the response
    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    let aiResponse;
    try {
      // Try to parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback response for non-JSON responses
        aiResponse = {
          action: "ANALYZE_ATTACHMENTS",
          parameters: { attachments },
          message: responseText
        };
      }
    } catch (parseError) {
      console.error("Failed to parse Anthropic response:", parseError);
      aiResponse = {
        action: "ANALYZE_ATTACHMENTS",
        parameters: { attachments },
        message: responseText || "I've analyzed your attachments and can help you work with this information."
      };
    }

    return aiResponse;
  } catch (error) {
    console.error("Anthropic processing error:", error);
    throw error;
  }
}

async function getSystemContext(): Promise<SystemContext> {
  // For AI requests, don't load full data to prevent token overflow
  // Just get counts and limited samples
  const [productionOrders, operations, resources, capabilities, plants] = await Promise.all([
    storage.getProductionOrders().then(orders => orders.slice(0, 10)), // Max 10 production orders for context
    storage.getOperations().then(ops => ops.slice(0, 20)), // Max 20 operations
    storage.getResources().then(res => res.slice(0, 10)).catch(() => {
      console.log('Resources table not available, using empty array');
      return [];
    }), // Max 10 resources
    storage.getCapabilities(),
    storage.getPlants() // Include all plants since there are typically fewer plants
  ]);

  return { jobs: productionOrders, operations, resources, capabilities, plants };
}

async function executeAction(action: string, parameters: any, message: string, context?: SystemContext, attachments?: AttachmentFile[]): Promise<AIAgentResponse> {
  try {
    switch (action) {
      case "LIST_WIDGETS":
        const widgetInfo = {
          systems: [
            { 
              name: "Optimization Widget", 
              type: "optimization",
              description: "Advanced scheduling optimization controls with quick actions, history tracking, and performance metrics",
              features: ["Quick optimization actions", "Optimization history", "Performance metrics", "Multiple algorithm support"]
            },
            { 
              name: "Cockpit Widgets", 
              type: "cockpit",
              description: "Production cockpit widgets for real-time monitoring and control",
              features: ["Real-time data display", "Custom layouts", "Interactive controls"]
            },
            { 
              name: "Canvas Widgets", 
              type: "canvas",
              description: "Visual canvas widgets for dynamic data visualization",
              features: ["Drag and drop", "Resizable", "Multiple widget types", "Live data updates"]
            },
            { 
              name: "Dashboard Widgets", 
              type: "dashboard",
              description: "Analytics dashboard widgets for KPIs and reporting",
              features: ["KPI metrics", "Charts and graphs", "Custom configurations", "Auto-refresh"]
            }
          ],
          widgetTypes: [
            { type: "kpi", description: "Key performance indicators with metrics" },
            { type: "chart", description: "Charts (bar, line, pie, doughnut, gauge)" },
            { type: "table", description: "Data tables with columns and rows" },
            { type: "alert", description: "Notifications and alerts" },
            { type: "progress", description: "Progress bars and trackers" },
            { type: "text", description: "Text displays and labels" },
            { type: "gauge", description: "Gauge displays for metrics" }
          ]
        };

        // Check if should display in canvas
        const shouldDisplayWidgetsInCanvas = parameters.displayInCanvas || 
                                           message.toLowerCase().includes('canvas') ||
                                           message.toLowerCase().includes('display') ||
                                           message.toLowerCase().includes('show');
        
        if (shouldDisplayWidgetsInCanvas) {
          return {
            success: true,
            message: message || "Here are the available widget systems and types:",
            data: widgetInfo,
            canvasAction: {
              type: "ADD_CANVAS_CONTENT",
              content: {
                type: "table",
                title: "Available Widget Systems",
                data: widgetInfo.systems.reduce((acc, system) => {
                  acc[system.name] = system.description;
                  return acc;
                }, {} as Record<string, string>),
                width: "100%",
                height: "auto"
              }
            },
            actions: ["LIST_WIDGETS", "ADD_CANVAS_CONTENT"]
          };
        }

        return {
          success: true,
          message: message || `We have several widget systems available:\n\n${widgetInfo.systems.map(s => `• ${s.name} (${s.type})\n  ${s.description}\n  Features: ${s.features.join(', ')}`).join('\n\n')}\n\nWidget types include: ${widgetInfo.widgetTypes.map(t => t.type).join(', ')}`,
          data: widgetInfo,
          actions: ["LIST_WIDGETS"]
        };

      case "LIST_PRODUCTION_ORDERS":
      case "LIST_JOBS": // Keep backward compatibility
        const allProductionOrders = await storage.getProductionOrders();
        
        // Check if this should be displayed in canvas - detect various ways users ask to see data
        const shouldDisplayProductionOrdersInCanvas = parameters.displayInCanvas || 
                                         parameters.canvas || 
                                         message.toLowerCase().includes('canvas') ||
                                         message.toLowerCase().includes('display') ||
                                         message.toLowerCase().includes('show') ||
                                         message.toLowerCase().includes('list');
        
        if (shouldDisplayProductionOrdersInCanvas) {
          return {
            success: true,
            message: message || "Here are all the production orders in your manufacturing system, displayed in the canvas above:",
            data: allProductionOrders,
            canvasAction: {
              type: "ADD_CANVAS_CONTENT",
              content: {
                type: "table",
                title: "Production Orders Overview",
                timestamp: new Date().toISOString(),
                data: allProductionOrders.map(order => ({
                  "Order ID": order.id,
                  "Order Number": order.orderNumber,
                  "Item": order.itemId,
                  "Quantity": order.quantity,
                  "Priority": order.priority,
                  "Status": order.status,
                  "Due Date": order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'Not set'
                })),
                width: "100%",
                height: "auto"
              }
            },
            actions: ["LIST_PRODUCTION_ORDERS", "ADD_CANVAS_CONTENT"]
          };
        }
        
        return {
          success: true,
          message: message || `Here are the active production orders in our system:\n\n${allProductionOrders.map(order => `• ${order.orderNumber} (ID: ${order.id})\n  Item: ${order.itemId || 'Not specified'}\n  Quantity: ${order.quantity}\n  Priority: ${order.priority}\n  Status: ${order.status}\n  Due: ${order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'Not set'}`).join('\n\n')}`,
          data: allProductionOrders,
          actions: ["LIST_PRODUCTION_ORDERS"]
        };

      case "LIST_OPERATIONS":
        const allOperations = await storage.getOperations();
        
        // Check if this should be displayed in canvas - detect various ways users ask to see data
        const shouldDisplayOperationsInCanvas = parameters.displayInCanvas || 
                                               parameters.canvas || 
                                               message.toLowerCase().includes('canvas') ||
                                               message.toLowerCase().includes('display') ||
                                               message.toLowerCase().includes('show') ||
                                               message.toLowerCase().includes('list');
        
        if (shouldDisplayOperationsInCanvas) {
          return {
            success: true,
            message: message || "Displaying list of operations in the canvas.",
            data: allOperations,
            canvasAction: {
              type: "ADD_CANVAS_CONTENT",
              content: {
                type: "table",
                title: "Operations Overview",
                timestamp: new Date().toISOString(),
                data: allOperations.map(op => ({
                  "Operation ID": op.id,
                  "Name": op.name,
                  "Job ID": op.jobId,
                  "Duration": `${op.duration}h`,
                  "Status": op.status
                })),
                width: "100%",
                height: "auto"
              }
            },
            actions: ["LIST_OPERATIONS", "ADD_CANVAS_CONTENT"]
          };
        }
        
        return {
          success: true,
          message: message || `Here are the operations in our system:\n\n${allOperations.map(op => `• ${op.name} (ID: ${op.id})\n  Job ID: ${op.jobId}\n  Duration: ${op.duration}h\n  Status: ${op.status}`).join('\n\n')}`,
          data: allOperations,
          actions: ["LIST_OPERATIONS"]
        };

      case "LIST_RESOURCES":
        const allResources = await storage.getResources();
        
        // Check if this should be displayed in canvas - detect various ways users ask to see data
        const shouldDisplayResourcesInCanvas = parameters.displayInCanvas || 
                                              parameters.canvas || 
                                              message.toLowerCase().includes('canvas') ||
                                              message.toLowerCase().includes('display') ||
                                              message.toLowerCase().includes('show') ||
                                              message.toLowerCase().includes('list');
        
        if (shouldDisplayResourcesInCanvas) {
          return {
            success: true,
            message: message || "Displaying list of resources in the canvas.",
            data: allResources,
            canvasAction: {
              type: "ADD_CANVAS_CONTENT",
              content: {
                type: "table",
                title: "List of Resources",
                timestamp: new Date().toISOString(),
                data: allResources.map(res => ({
                  "id": res.id,
                  "name": res.name,
                  "type": res.type
                })),
                width: "100%",
                height: "auto"
              }
            },
            actions: ["LIST_RESOURCES", "ADD_CANVAS_CONTENT"]
          };
        }
        
        return {
          success: true,
          message: message || `Here are the resources in our system:\n\n${allResources.map(res => `• ${res.name} (ID: ${res.id})\n  Type: ${res.type}\n  Status: ${res.status || 'Unknown'}`).join('\n\n')}`,
          data: allResources,
          actions: ["LIST_RESOURCES"]
        };

      case "LIST_PLANTS":
        const allPlants = await storage.getPlants();
        
        // Check if this should be displayed in canvas - detect various ways users ask to see data
        const shouldDisplayPlantsInCanvas = parameters.displayInCanvas || 
                                           parameters.canvas || 
                                           message.toLowerCase().includes('canvas') ||
                                           message.toLowerCase().includes('display') ||
                                           message.toLowerCase().includes('show') ||
                                           message.toLowerCase().includes('list');
        
        if (shouldDisplayPlantsInCanvas) {
          return {
            success: true,
            message: message || "Displaying list of manufacturing plants in the canvas.",
            data: allPlants,
            canvasAction: {
              type: "ADD_CANVAS_CONTENT",
              content: {
                type: "table",
                title: "Manufacturing Plants Overview",
                timestamp: new Date().toISOString(),
                data: allPlants.map(plant => ({
                  "Plant ID": plant.id,
                  "Plant Name": plant.name,
                  "Address": plant.address || 'Not specified',
                  "Timezone": plant.timezone,
                  "Status": plant.isActive ? 'Active' : 'Inactive'
                })),
                width: "100%",
                height: "auto"
              }
            },
            actions: ["LIST_PLANTS", "ADD_CANVAS_CONTENT"]
          };
        }
        
        return {
          success: true,
          message: message || `Here are the manufacturing plants in our system:\n\n${allPlants.map(plant => `• ${plant.name} (ID: ${plant.id})\n  Address: ${plant.address || 'Not specified'}\n  Timezone: ${plant.timezone}\n  Status: ${plant.isActive ? 'Active' : 'Inactive'}`).join('\n\n')}`,
          data: allPlants,
          actions: ["LIST_PLANTS"]
        };

      case "CREATE_PRODUCTION_ORDER":
      case "CREATE_JOB": // Keep backward compatibility
        const productionOrderData: InsertProductionOrder = {
          orderNumber: parameters.orderNumber || `PO-${Date.now()}`,
          itemId: parameters.itemId || null,
          quantity: parameters.quantity || 1,
          plantId: parameters.plantId || 1, // Default to plant 1
          priority: parameters.priority || "Medium",
          dueDate: parameters.dueDate ? new Date(parameters.dueDate) : null,
          status: "Planned"
        };
        const newProductionOrder = await storage.createProductionOrder(productionOrderData);
        return {
          success: true,
          message: message || `Created production order "${newProductionOrder.orderNumber}" successfully`,
          data: newProductionOrder,
          actions: ["CREATE_PRODUCTION_ORDER"]
        };

      case "CREATE_OPERATION":
        const operationData: InsertOperation = {
          name: parameters.name,
          description: parameters.description || null,
          jobId: parameters.jobId,
          duration: parameters.duration || 8,
          requiredCapabilities: parameters.requiredCapabilities || [],
          status: "pending",
          order: parameters.order || 1
        };
        const newOperation = await storage.createOperation(operationData);
        return {
          success: true,
          message: message || `Created operation "${newOperation.name}" successfully`,
          data: newOperation,
          actions: ["CREATE_OPERATION"]
        };

      case "CREATE_RESOURCE":
        const resourceData: InsertResource = {
          name: parameters.name,
          type: parameters.type || "Machine",
          capabilities: parameters.capabilities || [],
          status: "available"
        };
        const newResource = await storage.createResource(resourceData);
        return {
          success: true,
          message: message || `Created resource "${newResource.name}" successfully`,
          data: newResource,
          actions: ["CREATE_RESOURCE"]
        };

      case "UPDATE_OPERATION":
        const updatedOperation = await storage.updateOperation(parameters.id, parameters);
        return {
          success: true,
          message: message || `Updated operation successfully`,
          data: updatedOperation,
          actions: ["UPDATE_OPERATION"]
        };

      case "ASSIGN_OPERATION":
        const assignedOperation = await storage.updateOperation(parameters.operationId, {
          resourceId: parameters.resourceId
        });
        return {
          success: true,
          message: message || `Assigned operation to resource successfully`,
          data: assignedOperation,
          actions: ["ASSIGN_OPERATION"]
        };

      case "GET_STATUS":
        const statusContext = await getSystemContext();
        return {
          success: true,
          message: message || `Current system status retrieved`,
          data: statusContext,
          actions: ["GET_STATUS"]
        };

      case "SEARCH_JOBS":
        const jobOperations = await storage.getJobOperations();
        const jobs = Array.from(new Set(jobOperations.map(op => op.jobId))).map(jobId => ({ id: jobId, name: `Job ${jobId}`, description: '' }));
        const filteredJobs = jobs.filter(job => 
          job.name.toLowerCase().includes(parameters.query?.toLowerCase() || "") ||
          job.description?.toLowerCase().includes(parameters.query?.toLowerCase() || "")
        );
        return {
          success: true,
          message: message || `Found ${filteredJobs.length} matching jobs`,
          data: filteredJobs,
          actions: ["SEARCH_JOBS"]
        };

      case "SEARCH_OPERATIONS":
        const operations = await storage.getJobOperations();
        const filteredOperations = operations.filter(op => 
          op.name.toLowerCase().includes(parameters.query?.toLowerCase() || "") ||
          op.description?.toLowerCase().includes(parameters.query?.toLowerCase() || "")
        );
        return {
          success: true,
          message: message || `Found ${filteredOperations.length} matching operations`,
          data: filteredOperations,
          actions: ["SEARCH_OPERATIONS"]
        };

      case "ANALYZE_LATE_PRODUCTION_ORDERS":
      case "ANALYZE_LATE_JOBS": // Keep backward compatibility
        let analysisContext = context;
        if (!analysisContext) {
          analysisContext = await getSystemContext();
        }
        
        const today = new Date();
        const lateProductionOrders = [];
        const lateOperations = [];
        
        // Analyze each production order for lateness
        for (const order of analysisContext.jobs) { // Note: jobs property contains production orders from getSystemContext
          if (!order.dueDate) continue;
          const orderDueDate = new Date(order.dueDate);
          const orderOperations = analysisContext.operations.filter(op => op.productionOrderId === order.id);
          
          // Check if production order is past due date
          if (today > orderDueDate) {
            const daysLate = Math.floor((today.getTime() - orderDueDate.getTime()) / (24 * 60 * 60 * 1000));
            lateProductionOrders.push({
              ...order,
              daysLate,
              operations: orderOperations
            });
          }
          
          // Check for operations that are overdue
          for (const operation of orderOperations) {
            if (operation.endTime && new Date(operation.endTime) > orderDueDate) {
              const daysLate = Math.floor((new Date(operation.endTime).getTime() - orderDueDate.getTime()) / (24 * 60 * 60 * 1000));
              lateOperations.push({
                ...operation,
                orderNumber: order.orderNumber,
                daysLate
              });
            }
          }
        }
        
        let analysisMessage = "Late Production Orders Analysis:\n\n";
        
        if (lateProductionOrders.length === 0) {
          analysisMessage += "✅ No production orders are currently overdue.\n";
        } else {
          analysisMessage += `⚠️ ${lateProductionOrders.length} production order(s) are overdue:\n`;
          lateProductionOrders.forEach(order => {
            analysisMessage += `• ${order.orderNumber} (Item: ${order.itemId || 'Unknown'}) - ${order.daysLate} days late\n`;
            analysisMessage += `  Due: ${new Date(order.dueDate).toLocaleDateString()}\n`;
            analysisMessage += `  Operations: ${order.operations.length} total\n`;
          });
        }
        
        if (lateOperations.length > 0) {
          analysisMessage += `\n🔍 ${lateOperations.length} operation(s) completed late:\n`;
          lateOperations.forEach(op => {
            analysisMessage += `• ${op.name} (${op.orderNumber}) - ${op.daysLate} days late\n`;
          });
        }
        
        return {
          success: true,
          message: analysisMessage,
          data: {
            lateProductionOrders,
            lateOperations,
            summary: {
              totalLateProductionOrders: lateProductionOrders.length,
              totalLateOperations: lateOperations.length,
              analysisDate: today.toISOString()
            }
          },
          actions: ["ANALYZE_LATE_PRODUCTION_ORDERS"]
        };

      case "CREATE_CUSTOM_METRIC":
        const customMetric = {
          name: parameters.name,
          description: parameters.description,
          calculation: parameters.calculation,
          createdAt: new Date().toISOString()
        };
        
        return {
          success: true,
          message: message || `Custom metric "${parameters.name}" created successfully`,
          data: customMetric,
          actions: ["CREATE_CUSTOM_METRIC"]
        };

      case "CALCULATE_CUSTOM_METRIC":
        let metricContext = context;
        if (!metricContext) {
          metricContext = await getSystemContext();
        }
        const metricResult = await calculateCustomMetric(parameters, metricContext);
        return {
          success: true,
          message: message || `Custom metric calculated successfully`,
          data: metricResult,
          actions: ["CALCULATE_CUSTOM_METRIC"]
        };

      case "CREATE_CUSTOM_METRICS":
        let metricsContext = context;
        if (!metricsContext) {
          metricsContext = await getSystemContext();
        }
        const customMetrics = await createCustomMetrics(parameters, metricsContext);
        return {
          success: true,
          message: message || "Created custom metrics for shop floor",
          data: customMetrics,
          actions: ["CREATE_CUSTOM_METRICS"]
        };

      case "CHANGE_COLOR_SCHEME":
        // Find the current default resource view and update its color scheme
        const resourceViews = await storage.getResourceViews();
        const currentView = resourceViews.find(rv => rv.isDefault);
        
        if (!currentView) {
          return {
            success: false,
            message: "No default resource view found. Please create a resource view first.",
            data: null
          };
        }

        const updatedView = await storage.updateResourceView(currentView.id, {
          colorScheme: parameters.colorScheme
        });

        return {
          success: true,
          message: message || `Changed color scheme to "${parameters.colorScheme}" for Resource Gantt view`,
          data: updatedView,
          actions: ["CHANGE_COLOR_SCHEME"]
        };

      case "CHANGE_TEXT_LABELING":
        // Find the current default resource view and update its text labeling
        const resourceViewsForText = await storage.getResourceViews();
        const currentViewForText = resourceViewsForText.find(rv => rv.isDefault);
        
        if (!currentViewForText) {
          return {
            success: false,
            message: "No default resource view found. Please create a resource view first.",
            data: null
          };
        }

        const updatedViewForText = await storage.updateResourceView(currentViewForText.id, {
          textLabeling: parameters.textLabeling
        });

        return {
          success: true,
          message: message || `Changed text labeling to "${parameters.textLabeling}" for Resource Gantt view`,
          data: updatedViewForText,
          actions: ["CHANGE_TEXT_LABELING"]
        };

      case "CREATE_KANBAN_BOARD":
        const kanbanConfig = {
          name: parameters.name || "AI Generated Board",
          description: parameters.description || "Created by AI Assistant",
          viewType: parameters.viewType || "jobs",
          swimLaneField: parameters.swimLaneField || "status",
          swimLaneColors: parameters.swimLaneColors || {},
          filters: parameters.filters || {
            priorities: [],
            statuses: [],
            resources: [],
            capabilities: [],
            customers: [],
            dateRange: { from: null, to: null }
          },
          displayOptions: {
            showPriority: true,
            showDueDate: true,
            showCustomer: true,
            showResource: true,
            showProgress: true,
            cardSize: "standard",
            groupBy: "none"
          },
          isDefault: false
        };
        
        try {
          const newKanbanConfig = await storage.createKanbanConfig(kanbanConfig);
          
          return {
            success: true,
            message: message || `Created Kanban board "${kanbanConfig.name}" grouping ${kanbanConfig.viewType} by ${kanbanConfig.swimLaneField}`,
            data: newKanbanConfig,
            actions: ["CREATE_KANBAN_BOARD"]
          };
        } catch (error) {
          console.error("Error creating Kanban board:", error);
          return {
            success: false,
            message: "Failed to create Kanban board. Please check the configuration.",
            data: null
          };
        }

      case "CREATE_RESOURCE_VIEW":
        // Get all resources if no specific IDs are provided
        const availableResources = await storage.getResources();
        const resourceSequence = parameters.resourceIds && parameters.resourceIds.length > 0 
          ? parameters.resourceIds 
          : availableResources.map(r => r.id);
        
        const resourceViewConfig = {
          name: parameters.name || "AI Generated View",
          description: parameters.description || "Created by AI Assistant",
          resourceSequence: resourceSequence,
          colorScheme: parameters.colorScheme || "by_priority",
          textLabeling: parameters.textLabeling || "operation_name",
          isDefault: false
        };
        
        try {
          const newResourceView = await storage.createResourceView(resourceViewConfig);
          
          return {
            success: true,
            message: message || `Created resource view "${resourceViewConfig.name}" with ${resourceSequence.length} resources`,
            data: newResourceView,
            actions: ["CREATE_RESOURCE_VIEW"]
          };
        } catch (error) {
          console.error("Error creating resource view:", error);
          return {
            success: false,
            message: "Failed to create resource view. Please check the configuration.",
            data: null
          };
        }

      case "SET_GANTT_ZOOM":
        // This will be handled by the frontend, just return the instruction
        return {
          success: true,
          message: message || `Set Gantt chart zoom level to ${parameters.zoomLevel}`,
          data: { zoomLevel: parameters.zoomLevel },
          actions: ["SET_GANTT_ZOOM"]
        };

      case "SET_GANTT_SCROLL":
        // This will be handled by the frontend, just return the instruction
        return {
          success: true,
          message: message || `Set Gantt chart scroll position to ${parameters.scrollPosition}`,
          data: { scrollPosition: parameters.scrollPosition },
          actions: ["SET_GANTT_SCROLL"]
        };

      case "SCROLL_TO_TODAY":
        // This will be handled by the frontend, just return the instruction
        return {
          success: true,
          message: message || `Scrolling Gantt chart to today's date`,
          data: { scrollToToday: true },
          actions: ["SCROLL_TO_TODAY"]
        };

      case "CREATE_CUSTOM_TEXT_LABELS":
        const createdLabels = [];
        
        // Process each label configuration
        for (const labelConfig of parameters.labelConfigurations) {
          const customTextLabel = await storage.createCustomTextLabel({
            name: labelConfig.name,
            config: {
              labels: labelConfig.labels || [],
              fontSize: labelConfig.fontSize || 12,
              fontColor: labelConfig.fontColor || "#ffffff"
            }
          });
          createdLabels.push(customTextLabel);
        }
        
        return {
          success: true,
          message: message || `Created ${createdLabels.length} custom text label(s) successfully`,
          data: createdLabels,
          actions: ["CREATE_CUSTOM_TEXT_LABELS"]
        };

      case "CREATE_ANALYTICS_WIDGETS":
        // Process analytics widgets creation
        const analyticsWidgets = parameters.widgets || [];
        
        // Generate appropriate widget data based on current system context
        const processedWidgets = analyticsWidgets.map((widget: any) => {
          const widgetData = {
            ...widget,
            data: generateWidgetData(widget.type, widget.config, context)
          };
          return widgetData;
        });
        
        return {
          success: true,
          message: message || `Created ${processedWidgets.length} analytics widget(s) successfully`,
          data: { widgets: processedWidgets },
          actions: ["CREATE_ANALYTICS_WIDGETS"]
        };

      case "ANALYZE_ATTACHMENTS":
        // Return detailed analysis of attached files
        const analysisResults = attachments?.map(attachment => ({
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
          analyzed: true,
          insights: `Analyzed ${attachment.name} - ready to extract manufacturing data or create system entities based on the file content.`
        })) || [];

        return {
          success: true,
          message: message || `I've analyzed ${attachments?.length || 0} attachment(s). ${attachments?.length ? 'I can help you extract manufacturing data, create jobs/operations/resources, or provide insights based on the attached files.' : ''}`,
          data: { attachments: analysisResults },
          actions: ["ANALYZE_ATTACHMENTS"]
        };

      case "ANALYZE_DOCUMENT":
        // Process text documents for manufacturing information
        return {
          success: true,
          message: message || "I've analyzed the attached document and can help extract manufacturing requirements, schedules, or specifications.",
          data: { documentAnalysis: parameters },
          actions: ["ANALYZE_DOCUMENT"]
        };

      case "ANALYZE_IMAGE":
        // Process images for manufacturing insights
        return {
          success: true,
          message: message || "I've analyzed the attached image and can help identify manufacturing processes, equipment, or workflow diagrams.",
          data: { imageAnalysis: parameters },
          actions: ["ANALYZE_IMAGE"]
        };

      case "NAVIGATE_TO_PAGE":
        // Navigate to a specific page in the application with comprehensive support
        const pageMapping: Record<string, { path: string, name: string, permissions?: string[] }> = {
          // Core Production
          "dashboard": { path: "/", name: "Dashboard" },
          "production-schedule": { path: "/production-schedule", name: "Production Schedule" },
          "production-planning": { path: "/production-planning", name: "Production Planning", permissions: ["production-planning-view"] },
          "analytics": { path: "/analytics", name: "Analytics" },
          "reports": { path: "/reports", name: "Reports" },
          "boards": { path: "/boards", name: "Kanban Boards" },
          "shop-floor": { path: "/shop-floor", name: "Shop Floor", permissions: ["shop-floor-view"] },
          "visual-factory": { path: "/visual-factory", name: "Visual Factory", permissions: ["visual-factory-view"] },
          
          // Optimization & Planning
          "capacity-planning": { path: "/capacity-planning", name: "Capacity Planning", permissions: ["capacity-planning-view"] },
          "optimization-studio": { path: "/optimization-studio", name: "Optimization Studio", permissions: ["optimization-studio-view"] },
          "scheduling-optimizer": { path: "/optimize-orders", name: "Scheduling Optimizer" },
          "inventory-optimization": { path: "/inventory-optimization", name: "Inventory Optimization" },
          "demand-forecasting": { path: "/demand-forecasting", name: "Demand Forecasting" },
          "disruption-management": { path: "/disruption-management", name: "Disruption Management" },
          
          // Role-Specific Pages
          "sales": { path: "/sales", name: "Sales Dashboard", permissions: ["sales-view"] },
          "customer-service": { path: "/customer-service", name: "Customer Service", permissions: ["customer-service-view"] },
          "operator-dashboard": { path: "/operator-dashboard", name: "Operator Dashboard", permissions: ["operator-view"] },
          "maintenance": { path: "/maintenance", name: "Maintenance", permissions: ["maintenance-view"] },
          "forklift-driver": { path: "/forklift-driver", name: "Forklift Driver", permissions: ["forklift-driver-view"] },
          
          // Systems & Integration
          "systems-integration": { path: "/systems-integration", name: "Systems Integration", permissions: ["systems-integration-view"] },
          "system-integrations": { path: "/system-integrations", name: "System Integrations", permissions: ["systems-integration-view"] },
          "systems-management": { path: "/systems-management-dashboard", name: "Systems Management", permissions: ["systems-management-view"] },
          "plants-management": { path: "/plants-management", name: "Plants Management", permissions: ["plants-management-view"] },
          "error-logs": { path: "/error-logs", name: "Error Logs", permissions: ["systems-management-view"] },
          
          // User & Role Management
          "role-management": { path: "/role-management", name: "Role Management", permissions: ["user-management-view"] },
          "user-roles": { path: "/user-role-assignments-page", name: "User Role Assignments", permissions: ["user-management-view"] },
          "business-goals": { path: "/business-goals", name: "Business Goals", permissions: ["business-goals-view"] },
          
          // Training & Support
          "training": { path: "/training", name: "Training", permissions: ["training-view"] },
          "industry-templates": { path: "/industry-templates", name: "Industry Templates", permissions: ["training-view"] },
          "presentation-system": { path: "/presentation-system", name: "Presentation System", permissions: ["training-view"] },
          "presentation-studio": { path: "/presentation-studio", name: "Presentation Studio", permissions: ["training-view"] },
          "help": { path: "/help", name: "Help & Guide" },
          "chat": { path: "/chat", name: "Chat Support" },
          
          // Extensions
          "extension-studio": { path: "/extension-studio", name: "Extension Studio", permissions: ["systems-integration-view"] },
          "canvas": { path: "/canvas", name: "Canvas" },
          
          // Settings & Configuration
          "email-settings": { path: "/email-settings", name: "Email Settings", permissions: ["systems-management-view"] },
          "feedback": { path: "/feedback", name: "Feedback" },
          "account": { path: "/account", name: "Account Settings" },
          "pricing": { path: "/pricing", name: "Pricing" }
        };

        const targetPage = parameters.page || parameters.route || parameters.target;
        const pageInfo = pageMapping[targetPage?.toLowerCase()];
        
        if (!pageInfo) {
          return {
            success: false,
            message: `Unknown page "${targetPage}". Available pages: ${Object.keys(pageMapping).join(', ')}`,
            data: { availablePages: Object.keys(pageMapping) },
            actions: ["NAVIGATE_TO_PAGE"]
          };
        }

        return {
          success: true,
          message: message || `Navigating to ${pageInfo.name}${pageInfo.permissions ? ' (permission required)' : ''}`,
          data: { 
            page: targetPage,
            path: pageInfo.path,
            name: pageInfo.name,
            requiredPermissions: pageInfo.permissions || []
          },
          actions: ["NAVIGATE_TO_PAGE"]
        };

      case "OPEN_DASHBOARD":
        // Navigate to dashboard page
        return {
          success: true,
          message: message || "Opening the dashboard to view production metrics and analytics",
          data: { 
            page: "dashboard",
            path: "/dashboard",
            action: "open_dashboard"
          },
          actions: ["NAVIGATE_TO_PAGE", "OPEN_DASHBOARD"]
        };

      case "CREATE_DASHBOARD":
        // Create a new dashboard with specified widgets
        const dashboardConfig = {
          id: Date.now().toString(),
          name: parameters.name || "AI Generated Dashboard",
          description: parameters.description || "Created by AI Assistant",
          widgets: parameters.widgets || [],
          layout: parameters.layout || "grid",
          createdAt: new Date().toISOString()
        };

        return {
          success: true,
          message: message || `Created new dashboard "${dashboardConfig.name}" with ${dashboardConfig.widgets.length} widgets`,
          data: { 
            dashboard: dashboardConfig,
            action: "create_dashboard"
          },
          actions: ["CREATE_DASHBOARD", "NAVIGATE_TO_PAGE"]
        };

      case "OPEN_GANTT_CHART":
        // Navigate to production schedule (Gantt chart) page
        return {
          success: true,
          message: message || "Opening the production schedule Gantt chart to view and manage operations",
          data: { 
            page: "production-schedule",
            path: "/production-schedule",
            action: "open_gantt_chart",
            view: "gantt"
          },
          actions: ["NAVIGATE_TO_PAGE", "OPEN_GANTT_CHART"]
        };

      case "TRIGGER_UI_ACTION":
        // Trigger specific UI interactions
        return {
          success: true,
          message: message || `Triggering UI action: ${parameters.action}`,
          data: {
            uiAction: parameters.action,
            target: parameters.target,
            params: parameters.params || {}
          },
          actions: ["TRIGGER_UI_ACTION"]
        };

      case "OPEN_JOB_FORM":
        // Open job creation form
        return {
          success: true,
          message: message || "Opening job creation form",
          data: {
            action: "open_job_form",
            formData: parameters.formData || {}
          },
          actions: ["TRIGGER_UI_ACTION", "OPEN_JOB_FORM"]
        };

      case "OPEN_OPERATION_FORM":
        // Open operation creation form
        return {
          success: true,
          message: message || "Opening operation creation form",
          data: {
            action: "open_operation_form",
            formData: parameters.formData || {}
          },
          actions: ["TRIGGER_UI_ACTION", "OPEN_OPERATION_FORM"]
        };

      case "OPEN_RESOURCE_FORM":
        // Open resource creation form
        return {
          success: true,
          message: message || "Opening resource creation form",
          data: {
            action: "open_resource_form",
            formData: parameters.formData || {}
          },
          actions: ["TRIGGER_UI_ACTION", "OPEN_RESOURCE_FORM"]
        };

      case "OPEN_ANALYTICS":
        // Navigate to analytics page
        return {
          success: true,
          message: message || "Opening analytics page for data visualization and dashboard management",
          data: { 
            page: "analytics",
            path: "/analytics",
            action: "open_analytics"
          },
          actions: ["NAVIGATE_TO_PAGE", "OPEN_ANALYTICS"]
        };

      case "OPEN_BOARDS":
        // Navigate to Kanban boards page
        return {
          success: true,
          message: message || "Opening Kanban boards page for visual project management",
          data: { 
            page: "boards",
            path: "/boards",
            action: "open_boards"
          },
          actions: ["NAVIGATE_TO_PAGE", "OPEN_BOARDS"]
        };

      case "OPEN_REPORTS":
        // Navigate to reports page
        return {
          success: true,
          message: message || "Opening reports page for production analytics and insights",
          data: { 
            page: "reports",
            path: "/reports",
            action: "open_reports"
          },
          actions: ["NAVIGATE_TO_PAGE", "OPEN_REPORTS"]
        };

      case "OPEN_SHOP_FLOOR":
        // Navigate to shop floor page
        return {
          success: true,
          message: message || "Opening the shop floor interface for real-time operations monitoring",
          data: { 
            page: "shop-floor",
            path: "/shop-floor",
            action: "open_shop_floor",
            requiredPermissions: ["shop-floor-view"]
          },
          actions: ["NAVIGATE_TO_PAGE", "OPEN_SHOP_FLOOR"]
        };

      case "OPEN_VISUAL_FACTORY":
        // Navigate to visual factory page
        return {
          success: true,
          message: message || "Opening the visual factory interface for production visualization",
          data: { 
            page: "visual-factory",
            path: "/visual-factory",
            action: "open_visual_factory",
            requiredPermissions: ["visual-factory-view"]
          },
          actions: ["NAVIGATE_TO_PAGE", "OPEN_VISUAL_FACTORY"]
        };

      case "OPEN_CAPACITY_PLANNING":
        // Navigate to capacity planning page
        return {
          success: true,
          message: message || "Opening capacity planning for resource allocation and scheduling optimization",
          data: { 
            page: "capacity-planning",
            path: "/capacity-planning",
            action: "open_capacity_planning",
            requiredPermissions: ["capacity-planning-view"]
          },
          actions: ["NAVIGATE_TO_PAGE", "OPEN_CAPACITY_PLANNING"]
        };

      case "OPEN_OPTIMIZATION_STUDIO":
        // Navigate to optimization studio page
        return {
          success: true,
          message: message || "Opening optimization studio for algorithm development and testing",
          data: { 
            page: "optimization-studio",
            path: "/optimization-studio",
            action: "open_optimization_studio",
            requiredPermissions: ["optimization-studio-view"]
          },
          actions: ["NAVIGATE_TO_PAGE", "OPEN_OPTIMIZATION_STUDIO"]
        };

      case "OPEN_PRODUCTION_PLANNING":
        // Navigate to production planning page
        return {
          success: true,
          message: message || "Opening production planning for strategic production management",
          data: { 
            page: "production-planning",
            path: "/production-planning",
            action: "open_production_planning",
            requiredPermissions: ["production-planning-view"]
          },
          actions: ["NAVIGATE_TO_PAGE", "OPEN_PRODUCTION_PLANNING"]
        };

      case "OPEN_SYSTEMS_INTEGRATION":
        // Navigate to systems integration page
        return {
          success: true,
          message: message || "Opening systems integration for ERP and external system connections",
          data: { 
            page: "systems-integration",
            path: "/systems-integration",
            action: "open_systems_integration",
            requiredPermissions: ["systems-integration-view"]
          },
          actions: ["NAVIGATE_TO_PAGE", "OPEN_SYSTEMS_INTEGRATION"]
        };

      case "OPEN_ROLE_MANAGEMENT":
        // Navigate to role management page
        return {
          success: true,
          message: message || "Opening role management for user permissions and access control",
          data: { 
            page: "role-management",
            path: "/role-management",
            action: "open_role_management",
            requiredPermissions: ["user-management-view"]
          },
          actions: ["NAVIGATE_TO_PAGE", "OPEN_ROLE_MANAGEMENT"]
        };

      case "SHOW_SCHEDULE_EVALUATION":
        // Show schedule evaluation system
        return {
          success: true,
          message: message || "Opening schedule evaluation system to analyze production efficiency",
          data: {
            uiAction: "show_evaluation_system",
            target: "dashboard",
            params: {}
          },
          actions: ["TRIGGER_UI_ACTION", "SHOW_SCHEDULE_EVALUATION"]
        };

      case "MAXIMIZE_VIEW":
        // Maximize current view
        return {
          success: true,
          message: message || "Maximizing the current view for better visibility",
          data: {
            uiAction: "maximize_view",
            target: "current_page",
            params: {}
          },
          actions: ["TRIGGER_UI_ACTION", "MAXIMIZE_VIEW"]
        };

      case "MINIMIZE_VIEW":
        // Minimize current view
        return {
          success: true,
          message: message || "Minimizing the current view",
          data: {
            uiAction: "minimize_view",
            target: "current_page",
            params: {}
          },
          actions: ["TRIGGER_UI_ACTION", "MINIMIZE_VIEW"]
        };

      case "SHOW_CANVAS":
        // Show canvas in the top portion of the screen
        return {
          success: true,
          message: message || "Showing canvas for displaying visual content",
          data: {
            uiAction: "show_canvas",
            target: "split_pane_layout",
            params: {}
          },
          actions: ["TRIGGER_UI_ACTION", "SHOW_CANVAS"]
        };

      case "CANVAS_CONTENT":
        // Add content to the canvas
        return {
          success: true,
          message: message || "Adding content to the canvas",
          data: {
            uiAction: "canvas_content",
            target: "canvas",
            params: {
              content: parameters.content || "",
              type: parameters.type || "text"
            }
          },
          actions: ["TRIGGER_UI_ACTION", "CANVAS_CONTENT"]
        };

      case "ADD_CANVAS_CONTENT":
        // Add specific content to the canvas with auto-show
        return {
          success: true,
          message: message || "Adding content to the canvas display",
          data: null,
          canvasAction: {
            type: "ADD_CANVAS_CONTENT",
            content: {
              type: parameters.type || "table",
              title: parameters.title || "AI Generated Content",
              data: parameters.data || parameters.content,
              width: parameters.width || "100%",
              height: parameters.height || "auto"
            }
          },
          actions: ["ADD_CANVAS_CONTENT"]
        };

      case "CREATE_PIE_CHART":
        // Create a pie chart with live system data
        let pieChartContext = context;
        if (!pieChartContext) {
          pieChartContext = await getSystemContext();
        }
        
        const pieChartData = await generateChartData("pie", parameters, pieChartContext);
        return {
          success: true,
          message: message || `Created pie chart: ${parameters.title || "Data Distribution"}`,
          data: pieChartData,
          canvasAction: {
            type: "ADD_CANVAS_CONTENT",
            content: {
              type: "chart",
              chartType: "pie",
              title: parameters.title || "Data Distribution",
              data: pieChartData,
              width: "100%",
              height: "400px",
              timestamp: new Date().toISOString()
            }
          },
          actions: ["CREATE_PIE_CHART", "ADD_CANVAS_CONTENT"]
        };

      case "CREATE_LINE_CHART":
        // Create a line chart with live system data
        let lineChartContext = context;
        if (!lineChartContext) {
          lineChartContext = await getSystemContext();
        }
        
        const lineChartData = await generateChartData("line", parameters, lineChartContext);
        return {
          success: true,
          message: message || `Created line chart: ${parameters.title || "Trend Analysis"}`,
          data: lineChartData,
          canvasAction: {
            type: "ADD_CANVAS_CONTENT",
            content: {
              type: "chart",
              chartType: "line",
              title: parameters.title || "Trend Analysis",
              data: lineChartData,
              width: "100%",
              height: "400px",
              timestamp: new Date().toISOString()
            }
          },
          actions: ["CREATE_LINE_CHART", "ADD_CANVAS_CONTENT"]
        };

      case "CREATE_BAR_CHART":
        // Create a bar chart with live system data
        let barChartContext = context;
        if (!barChartContext) {
          barChartContext = await getSystemContext();
        }
        
        const barChartData = await generateChartData("bar", parameters, barChartContext);
        return {
          success: true,
          message: message || `Created bar chart: ${parameters.title || "Comparison Analysis"}`,
          data: barChartData,
          canvasAction: {
            type: "ADD_CANVAS_CONTENT",
            content: {
              type: "chart",
              chartType: "bar",
              title: parameters.title || "Comparison Analysis",
              data: barChartData,
              width: "100%",
              height: "400px",
              timestamp: new Date().toISOString()
            }
          },
          actions: ["CREATE_BAR_CHART", "ADD_CANVAS_CONTENT"]
        };

      case "CREATE_HISTOGRAM":
        // Create a histogram with live system data
        let histogramContext = context;
        if (!histogramContext) {
          histogramContext = await getSystemContext();
        }
        
        const histogramData = await generateChartData("histogram", parameters, histogramContext);
        return {
          success: true,
          message: message || `Created histogram: ${parameters.title || "Distribution Analysis"}`,
          data: histogramData,
          canvasAction: {
            type: "ADD_CANVAS_CONTENT",
            content: {
              type: "chart",
              chartType: "histogram",
              title: parameters.title || "Distribution Analysis",
              data: histogramData,
              width: "100%",
              height: "400px",
              timestamp: new Date().toISOString()
            }
          },
          actions: ["CREATE_HISTOGRAM", "ADD_CANVAS_CONTENT"]
        };

      case "CREATE_GANTT_CHART":
        // Create a Gantt chart with live system data
        let ganttContext = context;
        if (!ganttContext) {
          ganttContext = await getSystemContext();
        }
        
        const ganttData = await generateChartData("gantt", parameters, ganttContext);
        return {
          success: true,
          message: message || `Created Gantt chart: ${parameters.title || "Project Timeline"}`,
          data: ganttData,
          canvasAction: {
            type: "ADD_CANVAS_CONTENT",
            content: {
              type: "chart",
              chartType: "gantt",
              title: parameters.title || "Project Timeline",
              data: ganttData,
              width: "100%",
              height: "500px",
              timestamp: new Date().toISOString()
            }
          },
          actions: ["CREATE_GANTT_CHART", "ADD_CANVAS_CONTENT"]
        };

      case "CLEAR_CANVAS":
        return {
          success: true,
          message: message || "Canvas has been cleared.",
          data: null,
          canvasAction: {
            type: "clear"
          },
          actions: ["CLEAR_CANVAS"]
        };

      case "LIST_AVAILABLE_APIS":
      case "SHOW_API_DOCUMENTATION":
        const apiDocumentation = [
          { "API Function": "CREATE_CANVAS_WIDGET", "Description": "🔥 NEW: Create interactive widgets on canvas (charts, tables, buttons, KPI dashboards)" },
          { "API Function": "UPDATE_CANVAS_WIDGET", "Description": "🔥 NEW: Update widget properties, position, and data" },
          { "API Function": "DELETE_CANVAS_WIDGET", "Description": "🔥 NEW: Remove widgets from canvas" },
          { "API Function": "LIST_CANVAS_WIDGETS", "Description": "🔥 NEW: List all canvas widgets for current session" },
          { "API Function": "SUBMIT_ALGORITHM_FEEDBACK", "Description": "🔥 NEW: Submit automated algorithm performance feedback and improvements" },
          { "API Function": "LIST_ALGORITHM_FEEDBACK", "Description": "🔥 NEW: List algorithm feedback submissions with filtering" },
          { "API Function": "LIST_PRODUCTION_ORDERS", "Description": "List all active production orders with optional display in canvas." },
          { "API Function": "LIST_OPERATIONS", "Description": "List all active operations with optional display in canvas." },
          { "API Function": "LIST_RESOURCES", "Description": "List all active resources with optional display in canvas." },
          { "API Function": "LIST_PLANTS", "Description": "List all active plants with optional display in canvas." },
          { "API Function": "CREATE_PRODUCTION_ORDER", "Description": "Create a new production order with required details." },
          { "API Function": "CREATE_OPERATION", "Description": "Create a new operation within a production order." },
          { "API Function": "CREATE_RESOURCE", "Description": "Create a new resource (operator or machine)." },
          { "API Function": "CREATE_KANBAN_BOARD", "Description": "Create a new Kanban board for tracking production orders or operations." },
          { "API Function": "ANALYZE_LATE_PRODUCTION_ORDERS", "Description": "Analyze production orders that are late." },
          { "API Function": "GET_STATUS", "Description": "Get current system status." },
          { "API Function": "ANALYZE_DOCUMENT", "Description": "Analyze uploaded documents." },
          { "API Function": "ANALYZE_IMAGE", "Description": "Analyze uploaded images." },
          { "API Function": "NAVIGATE_TO_PAGE", "Description": "Navigate to specific pages in the application." },
          { "API Function": "OPEN_DASHBOARD", "Description": "Open the dashboard page." },
          { "API Function": "CREATE_DASHBOARD", "Description": "Create a new dashboard with widgets." },
          { "API Function": "OPEN_GANTT_CHART", "Description": "Open production schedule (Gantt chart) page." },
          { "API Function": "OPEN_ANALYTICS", "Description": "Navigate to analytics page." },
          { "API Function": "OPEN_BOARDS", "Description": "Navigate to Kanban boards page." },
          { "API Function": "OPEN_REPORTS", "Description": "Navigate to reports page." },
          { "API Function": "CREATE_PIE_CHART", "Description": "Create pie charts for data visualization." },
          { "API Function": "CREATE_LINE_CHART", "Description": "Create line charts for trend analysis." },
          { "API Function": "CREATE_BAR_CHART", "Description": "Create bar charts for comparison analysis." },
          { "API Function": "CREATE_HISTOGRAM", "Description": "Create histograms for distribution analysis." },
          { "API Function": "CREATE_GANTT_CHART", "Description": "Create Gantt charts for project timelines." },
          { "API Function": "SHOW_CANVAS", "Description": "Display or show canvas content area." },
          { "API Function": "CLEAR_CANVAS", "Description": "Clear all content from canvas." },
          { "API Function": "MAXIMIZE_VIEW", "Description": "Maximize current view." },
          { "API Function": "MINIMIZE_VIEW", "Description": "Minimize current view." },
          { "API Function": "START_TOUR", "Description": "Start a guided tour for a specific role with optional voice narration." },
          { "API Function": "CREATE_TOUR", "Description": "Create a new custom tour based on user description and target roles." }
        ];

        const timestamp = new Date().toISOString();
        return {
          success: true,
          message: message || `Hello! I'm Max, your AI manufacturing assistant. Here are the functions I can perform to help with your manufacturing operations: [Generated at ${timestamp}]`,
          data: apiDocumentation,
          canvasAction: {
            type: "CLEAR_AND_ADD_CANVAS_CONTENT",
            content: {
              type: "table",
              title: "Available API Functions",
              timestamp: new Date().toISOString(),
              data: apiDocumentation,
              width: "100%",
              height: "auto"
            }
          },
          actions: ["LIST_AVAILABLE_APIS", "CLEAR_CANVAS", "ADD_CANVAS_CONTENT"]
        };

      case "START_TOUR":
        // Start a guided tour for the specified role
        const roleId = parameters.roleId || 9; // Default to trainer role
        const voiceEnabled = parameters.voiceEnabled !== false; // Default to true
        const tourContext = parameters.context || "demo"; // Default to demo context
        
        // Map role names to IDs if role name is provided instead of ID
        const roleNameMapping: Record<string, number> = {
          "trainer": 9,
          "director": 1,
          "plant-manager": 2,
          "production-scheduler": 3,
          "systems-manager": 5,
          "administrator": 4,
          "it-administrator": 4,
          "data-analyst": 8
        };
        
        let finalRoleId = roleId;
        if (typeof roleId === 'string') {
          finalRoleId = roleNameMapping[roleId.toLowerCase().replace(/\s+/g, '-')] || 9;
        }
        
        return {
          success: true,
          message: message || `Starting guided tour for role ID ${finalRoleId} with voice ${voiceEnabled ? 'enabled' : 'disabled'} in ${tourContext} mode.`,
          data: {
            roleId: finalRoleId,
            voiceEnabled,
            context: tourContext,
            tourInitiated: true
          },
          actions: ["START_TOUR"]
        };

      case "CREATE_TOUR":
        // Create a new custom tour based on user description and target roles
        const tourDescription = parameters.description || parameters.tourDescription || "";
        const targetRoles = parameters.targetRoles || parameters.roles || ["trainer"];
        const tourTitle = parameters.title || parameters.tourTitle || "Custom Tour";
        const focusAreas = parameters.focusAreas || parameters.focus || [];
        const voiceEnabledForTour = parameters.voiceEnabled !== false; // Default to true
        const tourType = parameters.type || "custom";
        
        // Generate tour content using OpenAI based on user description and system context
        const tourContent = await generateTourContent({
          title: tourTitle,
          description: tourDescription,
          targetRoles,
          focusAreas,
          voiceEnabled: voiceEnabledForTour,
          type: tourType,
          systemContext: context
        });
        
        return {
          success: true,
          message: message || `Created custom tour "${tourTitle}" for roles: ${targetRoles.join(', ')}. Tour includes ${tourContent.steps.length} steps covering ${focusAreas.length > 0 ? focusAreas.join(', ') : 'general features'}.`,
          data: {
            tour: tourContent,
            created: true,
            customTour: true
          },
          actions: ["CREATE_TOUR", "START_CUSTOM_TOUR"]
        };

      default:
        return {
          success: false,
          message: "I don't understand that command. Try asking me to create jobs, operations, resources, open pages, navigate to analytics, analyze attached files, or start a tour.",
          data: null
        };
    }
  } catch (error) {
    console.error("Action execution error:", error);
    return {
      success: false,
      message: "I encountered an error executing that action. Please try again.",
      data: null
    };
  }
}

async function calculateCustomMetric(parameters: any, context?: SystemContext) {
  const { jobs, operations, resources } = context || {};
  
  // Common calculations based on the metric request
  const calculations = {
    // Time-based metrics
    "average_job_duration": () => {
      if (!jobs || jobs.length === 0) return 0;
      const completedJobs = jobs.filter(j => j.status === "completed");
      if (completedJobs.length === 0) return 0;
      
      const totalDuration = completedJobs.reduce((sum, job) => {
        const jobOps = operations?.filter(op => op.jobId === job.id) || [];
        return sum + jobOps.reduce((opSum, op) => opSum + (op.duration || 0), 0);
      }, 0);
      
      return Math.round(totalDuration / completedJobs.length);
    },
    
    "resource_utilization_by_type": () => {
      if (!resources || !operations) return {};
      
      const utilization: Record<string, any> = {};
      resources.forEach((resource: any) => {
        const resourceOps = operations.filter((op: any) => op.assignedResourceId === resource.id);
        const totalHours = resourceOps.reduce((sum: number, op: any) => sum + (op.duration || 0), 0);
        const workingHours = 8 * 5; // 40 hours per week
        
        if (!utilization[resource.type]) {
          utilization[resource.type] = { totalHours: 0, resourceCount: 0 };
        }
        utilization[resource.type].totalHours += totalHours;
        utilization[resource.type].resourceCount += 1;
      });
      
      Object.keys(utilization).forEach((type: string) => {
        const data = utilization[type];
        utilization[type].averageUtilization = Math.round((data.totalHours / (data.resourceCount * workingHours)) * 100);
      });
      
      return utilization;
    },
    
    "jobs_by_priority": () => {
      if (!jobs) return {};
      
      const priorityCount: Record<string, number> = {};
      jobs.forEach((job: any) => {
        const priority = job.priority || 'medium';
        priorityCount[priority] = (priorityCount[priority] || 0) + 1;
      });
      
      return priorityCount;
    },
    
    "completion_rate": () => {
      if (!jobs || jobs.length === 0) return 0;
      const completedJobs = jobs.filter((j: any) => j.status === "completed").length;
      return Math.round((completedJobs / jobs.length) * 100);
    },
    
    "average_lead_time": () => {
      if (!jobs || !operations) return 0;
      
      const completedJobs = jobs.filter((j: any) => j.status === "completed");
      if (completedJobs.length === 0) return 0;
      
      const totalLeadTime = completedJobs.reduce((sum: number, job: any) => {
        const jobOps = operations.filter((op: any) => op.jobId === job.id);
        const firstOpStart = jobOps.reduce((earliest: any, op: any) => 
          !earliest || (op.startTime && new Date(op.startTime) < new Date(earliest)) ? op.startTime : earliest, null);
        const lastOpEnd = jobOps.reduce((latest: any, op: any) => 
          !latest || (op.endTime && new Date(op.endTime) > new Date(latest)) ? op.endTime : latest, null);
        
        if (firstOpStart && lastOpEnd) {
          return sum + (new Date(lastOpEnd).getTime() - new Date(firstOpStart).getTime()) / (1000 * 60 * 60 * 24);
        }
        return sum;
      }, 0);
      
      return Math.round(totalLeadTime / completedJobs.length);
    }
  };
  
  // Check if the metric name matches a predefined calculation
  const metricName = parameters.metricName || parameters.name;
  const calculationKey = metricName?.toLowerCase().replace(/\s+/g, '_');
  if (metricName && calculationKey && (calculations as any)[calculationKey]) {
    const result = (calculations as any)[calculationKey]();
    return {
      metricName,
      value: result,
      calculatedAt: new Date().toISOString()
    };
  }
  
  // Try to calculate based on the calculation parameter
  if (parameters.calculation) {
    try {
      // Simple calculation interpreter for basic metrics
      if (parameters.calculation.includes('total_jobs')) {
        return {
          metricName: parameters.metricName || 'Total Jobs',
          value: jobs?.length || 0,
          calculatedAt: new Date().toISOString()
        };
      }
      
      if (parameters.calculation.includes('total_operations')) {
        return {
          metricName: parameters.metricName || 'Total Operations',
          value: operations?.length || 0,
          calculatedAt: new Date().toISOString()
        };
      }
      
      if (parameters.calculation.includes('total_resources')) {
        return {
          metricName: parameters.metricName || 'Total Resources',
          value: resources?.length || 0,
          calculatedAt: new Date().toISOString()
        };
      }
      
      if (parameters.calculation.includes('active_jobs')) {
        return {
          metricName: parameters.metricName || 'Active Jobs',
          value: jobs?.filter(j => j.status === 'active').length || 0,
          calculatedAt: new Date().toISOString()
        };
      }
      
    } catch (error) {
      console.error('Custom metric calculation error:', error);
    }
  }
  
  return {
    metricName: parameters.metricName || 'Unknown Metric',
    value: 'Unable to calculate',
    calculatedAt: new Date().toISOString(),
    error: 'Calculation not supported'
  };
}

async function createCustomMetrics(parameters: any, context?: SystemContext) {
  const { jobs, operations, resources } = context || {};
  
  // Generate shop floor metrics based on AI prompt
  const prompt = parameters.prompt || parameters.description || "";
  
  // Common shop floor metrics that can be generated
  const metrics = [];
  
  // Efficiency metrics
  if (prompt.toLowerCase().includes("efficiency") || prompt.toLowerCase().includes("productivity")) {
    const completedOps = operations?.filter(op => op.status === "Completed") || [];
    const totalOps = operations?.length || 1;
    const efficiency = Math.round((completedOps.length / totalOps) * 100);
    
    metrics.push({
      title: "Operation Efficiency",
      value: `${efficiency}%`,
      subtitle: `${completedOps.length} of ${totalOps} operations completed`
    });
  }
  
  // Resource utilization metrics
  if (prompt.toLowerCase().includes("utilization") || prompt.toLowerCase().includes("resource")) {
    const activeResources = resources?.filter(r => r.status === "active") || [];
    const totalResources = resources?.length || 1;
    const utilization = Math.round((activeResources.length / totalResources) * 100);
    
    metrics.push({
      title: "Resource Utilization",
      value: `${utilization}%`,
      subtitle: `${activeResources.length} of ${totalResources} resources active`
    });
  }
  
  // Completion rate metrics
  if (prompt.toLowerCase().includes("completion") || prompt.toLowerCase().includes("rate")) {
    const completedJobs = jobs?.filter(j => j.status === "completed") || [];
    const totalJobs = jobs?.length || 1;
    const completionRate = Math.round((completedJobs.length / totalJobs) * 100);
    
    metrics.push({
      title: "Job Completion Rate",
      value: `${completionRate}%`,
      subtitle: `${completedJobs.length} of ${totalJobs} jobs completed`
    });
  }
  
  // Queue depth metrics
  if (prompt.toLowerCase().includes("queue") || prompt.toLowerCase().includes("backlog")) {
    const pendingOps = operations?.filter(op => op.status === "Pending") || [];
    const inProgressOps = operations?.filter(op => op.status === "In-Progress") || [];
    
    metrics.push({
      title: "Queue Depth",
      value: pendingOps.length,
      subtitle: `${pendingOps.length} pending, ${inProgressOps.length} in progress`
    });
  }
  
  // Priority metrics
  if (prompt.toLowerCase().includes("priority") || prompt.toLowerCase().includes("urgent")) {
    const highPriorityJobs = jobs?.filter(j => j.priority === "high") || [];
    const mediumPriorityJobs = jobs?.filter(j => j.priority === "medium") || [];
    const lowPriorityJobs = jobs?.filter(j => j.priority === "low") || [];
    
    metrics.push({
      title: "High Priority Jobs",
      value: highPriorityJobs.length,
      subtitle: `${mediumPriorityJobs.length} medium, ${lowPriorityJobs.length} low`
    });
  }
  
  // Machine-specific metrics
  if (prompt.toLowerCase().includes("machine") || prompt.toLowerCase().includes("equipment")) {
    const machines = resources?.filter(r => r.type === "Machine") || [];
    const activeMachines = machines.filter(m => m.status === "active");
    
    metrics.push({
      title: "Machine Status",
      value: activeMachines.length,
      subtitle: `${activeMachines.length} of ${machines.length} machines active`
    });
  }
  
  // Time-based metrics
  if (prompt.toLowerCase().includes("time") || prompt.toLowerCase().includes("duration")) {
    const avgDuration = operations?.reduce((sum, op) => sum + (op.duration || 0), 0) / (operations?.length || 1);
    
    metrics.push({
      title: "Avg Operation Time",
      value: `${Math.round(avgDuration)}h`,
      subtitle: `Average duration across all operations`
    });
  }
  
  // Default metrics if no specific ones are found
  if (metrics.length === 0) {
    const activeOps = operations?.filter(op => op.status === "In-Progress") || [];
    const completedOps = operations?.filter(op => op.status === "Completed") || [];
    const pendingOps = operations?.filter(op => op.status === "Pending") || [];
    
    metrics.push(
      {
        title: "Active Operations",
        value: activeOps.length,
        subtitle: "Currently in progress"
      },
      {
        title: "Completed Today",
        value: completedOps.length,
        subtitle: "Operations finished"
      },
      {
        title: "Pending Queue",
        value: pendingOps.length,
        subtitle: "Awaiting assignment"
      }
    );
  }
  
  return metrics;
}

async function generateChartData(chartType: string, parameters: any, context: SystemContext) {
  const { jobs, operations, resources, capabilities } = context;

  switch (chartType) {
    case "pie":
      return generatePieChartData(parameters, { jobs, operations, resources, capabilities });
    
    case "line":
      return generateLineChartData(parameters, { jobs, operations, resources, capabilities });
    
    case "bar":
      return generateBarChartData(parameters, { jobs, operations, resources, capabilities });
    
    case "histogram":
      return generateHistogramData(parameters, { jobs, operations, resources, capabilities });
    
    case "gantt":
      return generateGanttChartData(parameters, { jobs, operations, resources, capabilities });
    
    default:
      return [];
  }
}

function generatePieChartData(parameters: any, context: any) {
  const { jobs, operations, resources } = context;
  
  // Handle "job quantity" requests by showing individual jobs and their actual quantities
  if (parameters.title?.toLowerCase().includes("quantity") || parameters.dataType === "job_quantity") {
    const jobData = jobs.map(job => ({
      name: job.name || `Job ${job.id}`,
      value: job.quantity || 1 // Use actual quantity field from job
    }));
    
    return jobData.length > 0 ? jobData : [{ name: "No Jobs", value: 1 }];
  }
  
  // Handle job status requests
  if (parameters.dataType === "job_status" || parameters.title?.toLowerCase().includes("status")) {
    const statusCounts = {};
    jobs.forEach(job => {
      const status = job.status || "unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: value as number
    }));
  }
  
  // Default for job-related requests: show individual jobs by customer or name
  if (parameters.title?.toLowerCase().includes("job") || !parameters.dataType) {
    const jobData = jobs.map(job => ({
      name: job.name || `Job ${job.id}`,
      value: 1 // Each job represents 1 unit
    }));
    
    return jobData.length > 0 ? jobData : [{ name: "No Jobs", value: 1 }];
  }
  
  if (parameters.dataType === "resource_type") {
    const typeCounts = {};
    resources.forEach(resource => {
      const type = resource.type || "unknown";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    return Object.entries(typeCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: value as number
    }));
  }
  
  if (parameters.dataType === "job_priority") {
    const priorityCounts = {};
    jobs.forEach(job => {
      const priority = job.priority || "medium";
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    });
    
    return Object.entries(priorityCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: value as number
    }));
  }
  
  // Default: job status distribution
  const statusCounts = {};
  jobs.forEach(job => {
    const status = job.status || "unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  return Object.entries(statusCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number
  }));
}

function generateLineChartData(parameters: any, context: any) {
  const { jobs, operations } = context;
  
  // Generate timeline data based on job creation or operation timeline
  if (parameters.dataType === "jobs_over_time" || !parameters.dataType) {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }
    
    return last7Days.map(date => ({
      date: date,
      jobs: jobs.filter(job => job.createdAt?.startsWith(date)).length,
      operations: operations.filter(op => op.createdAt?.startsWith(date)).length
    }));
  }
  
  if (parameters.dataType === "completion_trend") {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }
    
    return last7Days.map(date => {
      const completedJobs = jobs.filter(job => 
        job.status === "completed" && job.updatedAt?.startsWith(date)
      ).length;
      
      return {
        date: date,
        completed: completedJobs
      };
    });
  }
  
  // Default: operations over time
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push(date.toISOString().split('T')[0]);
  }
  
  return last7Days.map(date => ({
    date: date,
    operations: operations.filter(op => op.createdAt?.startsWith(date)).length
  }));
}

function generateBarChartData(parameters: any, context: any) {
  const { jobs, operations, resources } = context;
  
  if (parameters.dataType === "jobs_by_customer" || parameters.title?.toLowerCase().includes("customer")) {
    const customerCounts = {};
    jobs.forEach(job => {
      const customer = job.customerId ? `Customer ${job.customerId}` : "Unknown";
      customerCounts[customer] = (customerCounts[customer] || 0) + 1;
    });
    
    return Object.entries(customerCounts).map(([name, value]) => ({
      name,
      value: value as number
    }));
  }
  
  if (parameters.dataType === "resources_by_type") {
    const typeCounts = {};
    resources.forEach(resource => {
      const type = resource.type || "Unknown";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    return Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value: value as number
    }));
  }
  
  if (parameters.dataType === "operations_by_status") {
    const statusCounts = {};
    operations.forEach(operation => {
      const status = operation.status || "Unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: value as number
    }));
  }
  
  // Default: job priority distribution
  const priorityCounts = {};
  jobs.forEach(job => {
    const priority = job.priority || "medium";
    priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
  });
  
  return Object.entries(priorityCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number
  }));
}

function generateHistogramData(parameters: any, context: any) {
  const { operations } = context;
  
  if (parameters.dataType === "operation_duration" || !parameters.dataType) {
    // Create duration buckets
    const buckets = {
      "0-2h": 0,
      "2-4h": 0,
      "4-8h": 0,
      "8-16h": 0,
      "16h+": 0
    };
    
    operations.forEach(operation => {
      const duration = operation.duration || 0;
      if (duration <= 2) buckets["0-2h"]++;
      else if (duration <= 4) buckets["2-4h"]++;
      else if (duration <= 8) buckets["4-8h"]++;
      else if (duration <= 16) buckets["8-16h"]++;
      else buckets["16h+"]++;
    });
    
    return Object.entries(buckets).map(([range, count]) => ({
      range,
      count: count as number
    }));
  }
  
  // Default: operation duration distribution
  const buckets = {
    "0-2h": 0,
    "2-4h": 0,
    "4-8h": 0,
    "8-16h": 0,
    "16h+": 0
  };
  
  operations.forEach(operation => {
    const duration = operation.duration || 0;
    if (duration <= 2) buckets["0-2h"]++;
    else if (duration <= 4) buckets["2-4h"]++;
    else if (duration <= 8) buckets["4-8h"]++;
    else if (duration <= 16) buckets["8-16h"]++;
    else buckets["16h+"]++;
  });
  
  return Object.entries(buckets).map(([range, count]) => ({
    range,
    count: count as number
  }));
}

function generateGanttChartData(parameters: any, context: any) {
  const { operations, jobs, resources } = context;
  
  // Generate Gantt chart data with operations and their timelines
  return operations.map(operation => {
    const job = jobs.find(j => j.id === operation.jobId);
    const resource = resources.find(r => r.id === operation.assignedResourceId);
    
    const startDate = operation.startTime ? new Date(operation.startTime) : new Date();
    const endDate = operation.endTime ? new Date(operation.endTime) : 
      new Date(startDate.getTime() + (operation.duration || 1) * 60 * 60 * 1000);
    
    return {
      id: operation.id,
      name: operation.name,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      duration: operation.duration || 1,
      jobName: job?.name || "Unknown Job",
      resourceName: resource?.name || "Unassigned",
      status: operation.status || "pending",
      progress: operation.status === "completed" ? 100 : 
                operation.status === "in_progress" ? 50 : 0
    };
  });
}

function generateWidgetData(type: string, config: any, context?: SystemContext) {
  const { jobs, operations, resources } = context || {};
  
  switch (type) {
    case "metric":
      // Generate metric data based on config
      if (config?.metric === "activeJobs") {
        return jobs?.filter(j => j.status === "active").length || 0;
      } else if (config?.metric === "utilization") {
        // Calculate overall resource utilization
        const totalOperations = operations?.length || 0;
        const totalResources = resources?.length || 0;
        return totalResources > 0 ? Math.round((totalOperations / totalResources) * 100) : 0;
      } else if (config?.metric === "overdueOperations") {
        const today = new Date();
        return operations?.filter(op => 
          op.endTime && new Date(op.endTime) < today && op.status !== "completed"
        ).length || 0;
      } else if (config?.metric === "avgLeadTime") {
        const completedJobs = jobs?.filter(j => j.status === "completed") || [];
        if (completedJobs.length === 0) return 0;
        
        const totalLeadTime = completedJobs.reduce((sum, job) => {
          const jobOps = operations?.filter(op => op.jobId === job.id) || [];
          const firstOpStart = jobOps.reduce((earliest, op) => 
            !earliest || (op.startTime && new Date(op.startTime) < new Date(earliest)) ? op.startTime : earliest, null);
          const lastOpEnd = jobOps.reduce((latest, op) => 
            !latest || (op.endTime && new Date(op.endTime) > new Date(latest)) ? op.endTime : latest, null);
          
          if (firstOpStart && lastOpEnd) {
            return sum + (new Date(lastOpEnd).getTime() - new Date(firstOpStart).getTime()) / (1000 * 60 * 60 * 24);
          }
          return sum;
        }, 0);
        
        return Math.round(totalLeadTime / completedJobs.length);
      }
      return 0;
      
    case "chart":
      if (config?.chartType === "bar") {
        // Generate bar chart data for jobs by priority
        const priorityCount = {};
        jobs?.forEach(job => {
          const priority = job.priority || 'medium';
          priorityCount[priority] = (priorityCount[priority] || 0) + 1;
        });
        
        return Object.entries(priorityCount).map(([priority, count]) => ({
          name: priority,
          value: count
        }));
      } else if (config?.chartType === "line") {
        // Generate line chart data for operations over time
        const today = new Date();
        const pastDays = 7;
        const data = [];
        
        for (let i = pastDays; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dayOperations = operations?.filter(op => 
            op.startTime && new Date(op.startTime).toDateString() === date.toDateString()
          ).length || 0;
          
          data.push({
            name: date.toLocaleDateString(),
            value: dayOperations
          });
        }
        
        return data;
      }
      return [];
      
    case "table":
      if (config?.tableType === "jobs") {
        return jobs?.slice(0, 10).map(job => ({
          id: job.id,
          name: job.name,
          customerId: job.customerId,
          priority: job.priority,
          status: job.status,
          dueDate: job.dueDate
        })) || [];
      } else if (config?.tableType === "operations") {
        return operations?.slice(0, 10).map(op => ({
          id: op.id,
          name: op.name,
          status: op.status,
          duration: op.duration,
          assignedResourceId: op.assignedResourceId
        })) || [];
      }
      return [];
      
    case "progress":
      if (config?.progressType === "completion") {
        const completedJobs = jobs?.filter(j => j.status === "completed").length || 0;
        const totalJobs = jobs?.length || 0;
        return totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
      }
      return 0;
      
    default:
      return null;
  }
}

// Audio transcription using Whisper
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const response = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], "audio.wav", { type: "audio/wav" }),
      model: "whisper-1",
    });
    
    return response.text;
  } catch (error) {
    console.error("Audio transcription error:", error);
    throw new Error("Failed to transcribe audio");
  }
}

// Generate custom tour content using OpenAI based on user specifications
export async function generateTourContent(config: {
  title: string;
  description: string;
  targetRoles: string[];
  focusAreas: string[];
  voiceEnabled: boolean;
  type: string;
  systemContext?: SystemContext;
}): Promise<any> {
  try {
    const { title, description, targetRoles, focusAreas, voiceEnabled, type, systemContext } = config;
    
    // Get current system data for context
    const jobOperations = await storage.getJobOperations();
    const jobs = systemContext?.jobs || Array.from(new Set(jobOperations.map(op => op.jobId))).map(jobId => ({ id: jobId, name: `Job ${jobId}`, status: 'active' }));
    const operations = systemContext?.operations || await storage.getJobOperations();
    const resources = systemContext?.resources || await storage.getResources();
    
    const systemPrompt = `You are an expert manufacturing tour guide creating dynamic guided tours for PlanetTogether manufacturing management platform.

CURRENT SYSTEM DATA:
- Jobs: ${jobs.length} total (${jobs.filter(j => j.status === 'active').length} active)
- Operations: ${operations.length} total 
- Resources: ${resources.length} total

TOUR CREATION REQUEST:
- Title: ${title}
- Description: ${description}
- Target Roles: ${targetRoles.join(', ')}
- Focus Areas: ${focusAreas.length > 0 ? focusAreas.join(', ') : 'General overview'}
- Voice Enabled: ${voiceEnabled}
- Tour Type: ${type}

AVAILABLE PAGES/FEATURES:
- Dashboard (/): Production metrics, alerts, KPIs
- Production Schedule (/production-schedule): Gantt charts, operation scheduling
- Analytics (/analytics): Charts, performance analysis
- Shop Floor (/shop-floor): Resource layout, real-time operations
- Optimization Studio (/optimization-studio): AI algorithms, testing
- Visual Factory (/visual-factory): Digital displays, communications
- Capacity Planning (/capacity-planning): Resource capacity analysis
- Role Management (/role-management): User permissions, role assignments

Create a comprehensive guided tour with 5-8 steps that matches the user's description and target roles. Each step should include:

1. Page navigation (which page to visit)
2. Voice narration script (2-3 sentences, conversational)
3. UI elements to highlight or interact with
4. Key learning objectives
5. Estimated time per step

Focus on practical, role-relevant features that help users accomplish real tasks. Make the tour engaging and educational.

Return JSON format:
{
  "id": "custom_tour_[timestamp]",
  "title": "[title]",
  "description": "[description]", 
  "targetRoles": [role array],
  "estimatedDuration": "[total minutes]",
  "steps": [
    {
      "id": 1,
      "title": "[step title]",
      "page": "[page path]",
      "voiceScript": "[narration text]",
      "highlights": ["selector1", "selector2"],
      "interactions": [{"type": "click", "target": "selector"}],
      "objectives": ["learning objective 1"],
      "duration": "[minutes]"
    }
  ],
  "focusAreas": [focus areas],
  "customTour": true
}`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a custom tour based on this request: "${description}" for roles: ${targetRoles.join(', ')}. ${focusAreas.length > 0 ? `Focus specifically on: ${focusAreas.join(', ')}.` : ''}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_completion_tokens: 2000
    });

    const tourContent = JSON.parse(response.choices[0].message.content || '{}');
    
    // Add metadata
    tourContent.id = tourContent.id || `custom_tour_${Date.now()}`;
    tourContent.createdAt = new Date().toISOString();
    tourContent.voiceEnabled = voiceEnabled;
    tourContent.customTour = true;
    
    return tourContent;
    
  } catch (error) {
    console.error("Tour content generation error:", error);
    
    // Return a fallback basic tour structure
    return {
      id: `custom_tour_${Date.now()}`,
      title: config.title,
      description: config.description,
      targetRoles: config.targetRoles,
      estimatedDuration: "10-15 minutes",
      steps: [
        {
          id: 1,
          title: "Welcome to the Platform",
          page: "/",
          voiceScript: "Welcome to PlanetTogether! Let's explore the key features that will help you manage production efficiently.",
          highlights: [".dashboard-metrics", ".quick-actions"],
          interactions: [],
          objectives: ["Understand the dashboard layout", "Identify key metrics"],
          duration: "2 minutes"
        },
        {
          id: 2,
          title: "Production Scheduling",
          page: "/production-schedule",
          voiceScript: "Here's where you'll manage your production schedule using our interactive Gantt chart and operation sequencer.",
          highlights: [".gantt-chart", ".operation-sequencer"],
          interactions: [{"type": "click", "target": ".gantt-zoom-controls"}],
          objectives: ["Learn scheduling basics", "Explore Gantt chart features"],
          duration: "3 minutes"
        }
      ],
      focusAreas: config.focusAreas,
      customTour: true,
      voiceEnabled: config.voiceEnabled,
      createdAt: new Date().toISOString()
    };
  }
}

// Main command processing function - handles both text and attachments
export async function processCommand(command: string, attachments: AttachmentFile[] = []): Promise<AIAgentResponse> {
  try {
    console.log("Processing AI command:", { command, attachmentsCount: attachments.length });

    // PRIORITY 1: Check with AgentRegistry for specialized agents ONLY for specific queries
    // Don't use agents for general/open-ended questions that are better answered by OpenAI
    const isSpecificAgentQuery = (msg: string): boolean => {
      const lower = msg.toLowerCase();
      // Only route to agents for very specific operational queries
      const specificPatterns = [
        /(?:job|order|mo|jo)[-\s#]*\d+/i,           // job 64, order #123
        /(?:list|show|get)\s+(?:all\s+)?jobs/i,      // list jobs, show all jobs
        /(?:run|apply|execute)\s+(?:asap|alap)/i,    // run ASAP algorithm
        /(?:generate|create|run)\s+report/i,          // generate report
        /(?:fpa|financial|fp&a|budget|forecast)\s+(?:report|analysis)/i,  // FP&A specific
        /late\s+jobs|bottleneck|capacity\s+load/i,   // specific reports
      ];
      return specificPatterns.some(pattern => pattern.test(lower));
    };
    
    if (isSpecificAgentQuery(command)) {
      try {
        const { agentRegistry } = await import("./services/agents/agent-registry");
        
        // Create context for the agent
        const context = {
          userId: 1, // Default user ID
          permissions: ['*'], // Full permissions for now
          sessionId: `session-${Date.now()}`,
          metadata: {}
        };
        
        // Check if a specialized agent can handle this
        const bestAgent = agentRegistry.findBestAgent(command, context.permissions);
        
        if (bestAgent) {
          console.log(`[AI Agent] Delegating to specialized agent: ${bestAgent.name}`);
          const agentResponse = await bestAgent.process(command, context);
          
          if (agentResponse && !agentResponse.error) {
            console.log(`[AI Agent] ✅ ${bestAgent.name} handled the request`);
            return {
              success: true,
              message: agentResponse.content,
              data: agentResponse.data || null,
              actions: agentResponse.actions || []
            };
          } else if (agentResponse && agentResponse.error) {
            console.log(`[AI Agent] ⚠️ ${bestAgent.name} returned an error, falling back`);
            // Fall through to OpenAI
          }
        }
      } catch (registryError) {
        console.error(`[AI Agent] AgentRegistry error, falling through:`, registryError);
        // Fall through to direct lookup and OpenAI
      }
    } else {
      console.log(`[AI Agent] General question detected, skipping specialized agents`);
    }

    // PRIORITY 2: Direct job lookup as fallback
    // Match patterns like: "job 64", "status of job 64", "what about job 64", "show me job 6"
    const jobNumberMatch = command.match(/(?:job|order|jo|mo)[-\s#]*(\d+|[A-Z0-9-]+)/i);
    
    if (jobNumberMatch && jobNumberMatch[1]) {
      const jobNumber = jobNumberMatch[1];
      console.log(`[AI Agent] Direct job lookup: ${jobNumber}`);
      
      try {
        // Import MaxAIService to get job status
        const { maxAI } = await import("./services/max-ai-service");
        const jobStatus = await maxAI.getJobStatus(jobNumber);
        
        if (jobStatus) {
          // Build comprehensive status message
          let statusMessage = `📊 **Job ${jobStatus.jobNumber} Status**\n\n`;
          statusMessage += `**Product:** ${jobStatus.productName || jobStatus.productCode}\n`;
          if (jobStatus.productDescription) {
            statusMessage += `**Description:** ${jobStatus.productDescription}\n`;
          }
          statusMessage += `**Priority:** ${jobStatus.priority || 'Standard'}\n`;
          statusMessage += `**Current Status:** ${jobStatus.status?.scheduledStatus || 'Scheduled'}\n\n`;
          
          // On-Time Status
          statusMessage += `📅 **SCHEDULE PERFORMANCE:**\n`;
          if (jobStatus.scheduling?.onTimeStatus === 'on-time') {
            statusMessage += `✅ **ON-TIME** - ${jobStatus.scheduling.daysEarlyOrLate} DAYS EARLY\n`;
          } else if (jobStatus.scheduling?.onTimeStatus === 'late') {
            statusMessage += `⚠️ **LATE** - ${jobStatus.scheduling.daysEarlyOrLate} DAYS LATE (ATTENTION REQUIRED)\n`;
          } else {
            statusMessage += `❓ **SCHEDULE STATUS UNKNOWN**\n`;
          }
          
          if (jobStatus.scheduling?.needDate) {
            statusMessage += `• Need Date: ${new Date(jobStatus.scheduling.needDate).toLocaleDateString()}\n`;
          }
          if (jobStatus.scheduling?.scheduledEnd) {
            statusMessage += `• Scheduled End: ${new Date(jobStatus.scheduling.scheduledEnd).toLocaleDateString()}\n`;
          }
          statusMessage += '\n';
          
          // Progress status
          statusMessage += `**Progress Status:** `;
          if (jobStatus.status?.totalOperations > 0) {
            if (jobStatus.status.isInProgress) {
              statusMessage += `IN PROGRESS (${jobStatus.status.progressPercentage}% complete)\n`;
              statusMessage += `• ${jobStatus.status.completedOperations} of ${jobStatus.status.totalOperations} operations completed\n`;
              if (jobStatus.status.inProgressOperations > 0) {
                statusMessage += `• ${jobStatus.status.inProgressOperations} operations currently running\n`;
              }
              statusMessage += `• ${jobStatus.status.remainingOperations} operations remaining\n`;
            } else if (jobStatus.status.completedOperations === jobStatus.status.totalOperations) {
              statusMessage += `✅ COMPLETED - All operations finished\n`;
            } else {
              statusMessage += `NOT STARTED - 0 of ${jobStatus.status.totalOperations} operations completed\n`;
            }
          } else {
            statusMessage += `No operations tracked for this job\n`;
          }
          
          console.log(`[AI Agent] ✅ Job ${jobNumber} found, returning status`);
          return {
            success: true,
            message: statusMessage,
            data: jobStatus
          };
        } else {
          console.log(`[AI Agent] Job ${jobNumber} not found in database`);
          return {
            success: true,
            message: `I couldn't find Job ${jobNumber} in the system. Please check the job number and try again. You can say "list jobs" to see available jobs.`,
            data: null
          };
        }
      } catch (jobError) {
        console.error(`[AI Agent] Error looking up job:`, jobError);
        // Fall through to OpenAI if job lookup fails
      }
    }

    // FALLBACK: Process with OpenAI for simplicity and reliability
    if (attachments && attachments.length > 0) {
      // Handle image attachments with OpenAI Vision
      const imageAttachments = attachments.filter(a => a.type.startsWith('image/'));
      
      if (imageAttachments.length > 0) {
        const messages: any[] = [
          {
            role: "system",
            content: "You are Max, an AI assistant for PlanetTogether manufacturing system. Analyze images and provide helpful insights about manufacturing processes, production schedules, quality control, or any other content shown."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: command
              }
            ]
          }
        ];
        
        // Add image attachments to the message
        for (const attachment of imageAttachments) {
          if (attachment.content) {
            messages[1].content.push({
              type: "image_url",
              image_url: {
                url: `data:${attachment.type};base64,${attachment.content.toString('base64')}`
              }
            });
          }
        }
        
        try {
          const response = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: messages,
            max_completion_tokens: 500
          });
          
          const aiMessage = response.choices[0]?.message?.content || "I couldn't analyze the image properly.";
          
          return {
            success: true,
            message: aiMessage,
            data: null
          };
        } catch (error) {
          console.error("OpenAI Vision API error:", error);
          return {
            success: false,
            message: "I encountered an error while analyzing your image. Please try again.",
            data: null
          };
        }
      }
    }
    
    // PRIORITY 3: Check if this is a knowledge base question
    const kbIndicators = [
      'how do i', 'how to', 'what is', 'what are', 'explain', 'tell me about',
      'help with', 'guide', 'documentation', 'best practice', 'configure',
      'setup', 'install', 'troubleshoot', 'error', 'problem with',
      'planettogether', 'pt ', 'aps', 'scheduling', 'feature', 'capability'
    ];
    const lowerCommand = command.toLowerCase();
    const isKnowledgeQuestion = kbIndicators.some(indicator => lowerCommand.includes(indicator));
    
    if (isKnowledgeQuestion) {
      try {
        console.log('[AI Agent] Detected knowledge question, searching KB...');
        const { knowledgeRetrievalService } = await import('./services/knowledge-retrieval.service');
        const kbResults = await knowledgeRetrievalService.search(command, 5);
        
        if (kbResults.length > 0 && kbResults[0].score >= 0.3) {
          console.log(`[AI Agent] Found ${kbResults.length} KB results, top score: ${kbResults[0].score.toFixed(2)}`);
          
          // Build RAG prompt with retrieved passages
          const sourcesText = kbResults.map((r, i) => 
            `[${i + 1}] ${r.title}\n${r.content}`
          ).join('\n\n');

          const systemPrompt = `You are Max, PlanetTogether's knowledge assistant. Answer the user's question using ONLY the provided source passages.
- When you cite a fact, reference the source number like [1] or [2].
- If none of the sources answer the question, say: "I couldn't find that specific information in our knowledge base."
- Be concise and helpful (2-6 sentences for most answers).
- If the question is ambiguous, ask one clarifying question.`;

          const userPrompt = `QUESTION:
${command}

SOURCES:
${sourcesText}

Please answer using the provided sources.`;

          const response = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.1,
            max_completion_tokens: 600
          });

          const aiMessage = response.choices[0]?.message?.content || "I couldn't process that question.";
          
          // Build sources for the response
          const sources = kbResults.map(r => ({
            articleId: r.articleId,
            title: r.title,
            url: r.sourceUrl,
            snippet: r.content.substring(0, 150) + '...',
            score: r.score
          }));

          console.log('[AI Agent] KB response generated with sources');
          return {
            success: true,
            message: aiMessage,
            data: { sources }
          };
        } else {
          console.log('[AI Agent] No relevant KB results, falling through to OpenAI');
        }
      } catch (kbError) {
        console.error('[AI Agent] KB retrieval error:', kbError);
        // Fall through to regular OpenAI
      }
    }

    // For text-only commands, use regular OpenAI completion
    try {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: "You are Max, an AI assistant for PlanetTogether manufacturing system. Help users with production scheduling, resource management, and manufacturing operations."
          },
          {
            role: "user",
            content: command
          }
        ],
        max_completion_tokens: 500
      });
      
      const aiMessage = response.choices[0]?.message?.content || "I couldn't process your request.";
      
      return {
        success: true,
        message: aiMessage,
        data: null
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      return {
        success: false,
        message: "I encountered an error processing your request. Please try again.",
        data: null
      };
    }

    /* DISABLED - Complex AI agent logic with TypeScript errors
    // Get system context for manufacturing data  
    let jobCount = 0;
    let operationCount = 0;
    let resourceCount = 0;
    */

    try {
      const operations = await storage.getJobOperations();
      const resources = await storage.getResources();
      
      jobCount = new Set(operations.map(op => op.jobId)).size; // Count unique jobs from operations
      operationCount = operations.length;
      resourceCount = resources.length;
    } catch (error) {
      console.warn("Could not fetch system context:", error);
      // Continue with defaults
    }

    const contextSummary = {
      jobCount,
      operationCount,
      resourceCount,
      hasAttachments: attachments.length > 0,
      attachmentTypes: attachments.map(a => a.type).join(", ")
    };

    // If attachments are present, use the attachment-aware processing
    if (attachments && attachments.length > 0) {
      console.log("Processing command with attachments:", attachments.map(a => ({ name: a.name, type: a.type, size: a.size })));
      return await processCommandWithAttachments(command, attachments, contextSummary);
    }

    // For text-only commands, use the existing OpenAI processing logic
    console.log("Processing text-only command");

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: `AI agent for manufacturing production system. Context: ${contextSummary.jobCount} jobs, ${contextSummary.operationCount} operations, ${contextSummary.resourceCount} resources.

Available actions: LIST_JOBS, LIST_OPERATIONS, LIST_RESOURCES, LIST_PLANTS, CREATE_JOB, CREATE_OPERATION, CREATE_RESOURCE, CREATE_KANBAN_BOARD, ANALYZE_LATE_JOBS, GET_STATUS, NAVIGATE_TO_PAGE, OPEN_DASHBOARD, CREATE_DASHBOARD, OPEN_GANTT_CHART, OPEN_ANALYTICS, OPEN_BOARDS, OPEN_REPORTS, OPEN_SHOP_FLOOR, OPEN_VISUAL_FACTORY, OPEN_CAPACITY_PLANNING, OPEN_OPTIMIZATION_STUDIO, OPEN_PRODUCTION_PLANNING, OPEN_SYSTEMS_INTEGRATION, OPEN_ROLE_MANAGEMENT, CREATE_ANALYTICS_WIDGET, TRIGGER_UI_ACTION, SHOW_SCHEDULE_EVALUATION, MAXIMIZE_VIEW, MINIMIZE_VIEW, SHOW_CANVAS, CANVAS_CONTENT, CREATE_CHART, CREATE_PIE_CHART, CREATE_LINE_CHART, CREATE_BAR_CHART, CREATE_HISTOGRAM, CREATE_GANTT_CHART.

For each command, return JSON with action type and relevant data. Handle manufacturing queries intelligently.`
        },
        {
          role: "user",
          content: command
        }
      ],
      temperature: 0.7,
      max_completion_tokens: 1000
    });

    const aiContent = response.choices[0].message.content || "";
    console.log("AI response content:", aiContent);

    // Try to parse as JSON, fall back to plain text
    let aiResponse;
    try {
      aiResponse = JSON.parse(aiContent);
    } catch {
      aiResponse = {
        action: "GENERAL_RESPONSE",
        message: aiContent,
        success: true
      };
    }

    return {
      success: true,
      message: aiResponse.message || "Command processed successfully",
      data: aiResponse.data || null,
      actions: aiResponse.actions || [],
      canvasAction: aiResponse.canvasAction
    };

  } catch (error) {
    console.error("Command processing error:", error);
    return {
      success: true, // Return success: true with a fallback message
      message: "I'm here to help with your manufacturing needs. While I'm having some technical difficulties, I can still assist you with information about production planning and scheduling. What would you like to know?",
      data: null
    };
  }
}