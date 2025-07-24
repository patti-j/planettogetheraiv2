import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { storage } from "./storage";
import { InsertJob, InsertOperation, InsertResource } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
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
}

export async function processAICommand(command: string, attachments?: AttachmentFile[]): Promise<AIAgentResponse> {
  try {
    // Get current system context
    const context = await getSystemContext();
    
    // Include live system data for AI responses
    const contextSummary = {
      jobCount: context.jobs.length,
      operationCount: context.operations.length,
      resourceCount: context.resources.length,
      capabilityCount: context.capabilities.length,
      allJobs: context.jobs.map(j => ({ id: j.id, name: j.name, status: j.status, customer: j.customer, priority: j.priority, dueDate: j.dueDate })),
      sampleResources: context.resources.slice(0, 5).map(r => ({ id: r.id, name: r.name, type: r.type })),
      sampleCapabilities: context.capabilities.slice(0, 5).map(c => ({ id: c.id, name: c.name }))
    };

    let aiResponse;

    // If attachments are present, use Anthropic for better document/image analysis
    if (attachments && attachments.length > 0) {
      aiResponse = await processCommandWithAttachments(command, attachments, contextSummary);
    } else {
      // Use GPT-4o for text-only commands
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `AI agent for manufacturing system with LIVE DATA ACCESS. Current system data:

LIVE DATA AVAILABLE:
- Total Jobs: ${contextSummary.jobCount}
- All Jobs: ${JSON.stringify(contextSummary.allJobs)}
- Total Operations: ${contextSummary.operationCount} 
- Total Resources: ${contextSummary.resourceCount}
- Sample Resources: ${JSON.stringify(contextSummary.sampleResources)}
- Total Capabilities: ${contextSummary.capabilityCount}
- Sample Capabilities: ${JSON.stringify(contextSummary.sampleCapabilities)}

IMPORTANT: You have access to real live manufacturing data. When users ask about jobs, operations, resources, or system status, use the provided live data above to give accurate answers. DO NOT say you don't have access - you have direct access to current system data.

Available actions: LIST_JOBS, LIST_OPERATIONS, LIST_RESOURCES, CREATE_JOB, CREATE_OPERATION, CREATE_RESOURCE, CREATE_KANBAN_BOARD, ANALYZE_LATE_JOBS, GET_STATUS, ANALYZE_DOCUMENT, ANALYZE_IMAGE, NAVIGATE_TO_PAGE, OPEN_DASHBOARD, CREATE_DASHBOARD, OPEN_GANTT_CHART, CREATE_ANALYTICS_WIDGET, TRIGGER_UI_ACTION, OPEN_ANALYTICS, OPEN_BOARDS, OPEN_REPORTS, SHOW_SCHEDULE_EVALUATION, MAXIMIZE_VIEW, MINIMIZE_VIEW, SHOW_CANVAS, CANVAS_CONTENT, and others.

UI Navigation Actions:
- NAVIGATE_TO_PAGE: Navigate to specific pages (dashboard, analytics, reports, scheduling-optimizer, etc.)
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

For CREATE_KANBAN_BOARD: parameters need name, description, viewType (jobs/operations), swimLaneField (status/priority/customer), filters (optional).

Canvas Guidelines:
- When user asks to show data in canvas or display lists/tables visually, use ADD_CANVAS_CONTENT action to automatically show and populate the canvas
- ADD_CANVAS_CONTENT displays data in the top portion of the screen above main content
- Perfect for: job lists, resource lists, operation tables, performance metrics, data visualizations
- Use ADD_CANVAS_CONTENT with parameters: {title: "descriptive title", type: "table", data: structured_data}
- Canvas automatically shows when content is added, no separate SHOW_CANVAS needed with ADD_CANVAS_CONTENT

Respond with JSON: {"action": "ACTION_NAME", "parameters": {...}, "message": "response"}`
          },
          {
            role: "user",
            content: command
          }
        ],
        response_format: { type: "json_object" }
      });

      aiResponse = JSON.parse(response.choices[0].message.content || "{}");
    }
    
    // Execute the determined action
    return await executeAction(aiResponse.action, aiResponse.parameters, aiResponse.message, context, attachments);
    
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

Available actions: CREATE_JOB, CREATE_OPERATION, CREATE_RESOURCE, CREATE_KANBAN_BOARD, ANALYZE_LATE_JOBS, GET_STATUS, ANALYZE_DOCUMENT, ANALYZE_IMAGE, NAVIGATE_TO_PAGE, OPEN_DASHBOARD, CREATE_DASHBOARD, OPEN_GANTT_CHART, CREATE_ANALYTICS_WIDGET, TRIGGER_UI_ACTION, OPEN_ANALYTICS, OPEN_BOARDS, OPEN_REPORTS, SHOW_SCHEDULE_EVALUATION, MAXIMIZE_VIEW, MINIMIZE_VIEW, SHOW_CANVAS, CANVAS_CONTENT, and others.

UI Navigation Actions:
- NAVIGATE_TO_PAGE: Navigate to specific pages (dashboard, analytics, reports, scheduling-optimizer, etc.)
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
  const [jobs, operations, resources, capabilities] = await Promise.all([
    storage.getJobs().then(jobs => jobs.slice(0, 10)), // Max 10 jobs for context
    storage.getOperations().then(ops => ops.slice(0, 20)), // Max 20 operations
    storage.getResources().then(res => res.slice(0, 10)), // Max 10 resources
    storage.getCapabilities()
  ]);

  return { jobs, operations, resources, capabilities };
}

async function executeAction(action: string, parameters: any, message: string, context?: SystemContext, attachments?: AttachmentFile[]): Promise<AIAgentResponse> {
  try {
    switch (action) {
      case "LIST_JOBS":
        const allJobs = await storage.getJobs();
        return {
          success: true,
          message: message || `Here are the active jobs in our system:\n\n${allJobs.map(job => `• ${job.name} (ID: ${job.id})\n  Customer: ${job.customer}\n  Priority: ${job.priority}\n  Status: ${job.status}\n  Due: ${job.dueDate ? new Date(job.dueDate).toLocaleDateString() : 'Not set'}`).join('\n\n')}`,
          data: allJobs,
          actions: ["LIST_JOBS"]
        };

      case "LIST_OPERATIONS":
        const allOperations = await storage.getOperations();
        return {
          success: true,
          message: message || `Here are the operations in our system:\n\n${allOperations.map(op => `• ${op.name} (ID: ${op.id})\n  Job ID: ${op.jobId}\n  Duration: ${op.duration}h\n  Status: ${op.status}`).join('\n\n')}`,
          data: allOperations,
          actions: ["LIST_OPERATIONS"]
        };

      case "LIST_RESOURCES":
        const allResources = await storage.getResources();
        return {
          success: true,
          message: message || `Here are the resources in our system:\n\n${allResources.map(res => `• ${res.name} (ID: ${res.id})\n  Type: ${res.type}\n  Status: ${res.status || 'Unknown'}`).join('\n\n')}`,
          data: allResources,
          actions: ["LIST_RESOURCES"]
        };

      case "CREATE_JOB":
        // Extract customer from various parameter names or from the command itself
        let customerName = parameters.customer || parameters.customerName;
        if (!customerName && parameters.name) {
          // Try to extract customer from job name if it contains "for [customer]"
          const forMatch = parameters.name.match(/for\s+(.+?)(?:\s+with|\s+due|\s*$)/i);
          if (forMatch) {
            customerName = forMatch[1];
          }
        }
        
        const jobData: InsertJob = {
          name: parameters.name || "New Job",
          description: parameters.description || null,
          customer: customerName || "Unknown Customer",
          plantId: parameters.plantId || 1, // Default to plant 1
          priority: parameters.priority || "medium",
          dueDate: parameters.dueDate ? new Date(parameters.dueDate) : null,
          status: "active"
        };
        const newJob = await storage.createJob(jobData);
        return {
          success: true,
          message: message || `Created job "${newJob.name}" successfully`,
          data: newJob,
          actions: ["CREATE_JOB"]
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
          assignedResourceId: parameters.resourceId
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
        const jobs = await storage.getJobs();
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
        const operations = await storage.getOperations();
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

      case "ANALYZE_LATE_JOBS":
        let analysisContext = context;
        if (!analysisContext) {
          analysisContext = await getSystemContext();
        }
        
        const today = new Date();
        const lateJobs = [];
        const lateOperations = [];
        
        // Analyze each job for lateness
        for (const job of analysisContext.jobs) {
          const jobDueDate = new Date(job.dueDate);
          const jobOperations = analysisContext.operations.filter(op => op.jobId === job.id);
          
          // Check if job is past due date
          if (today > jobDueDate) {
            const daysLate = Math.floor((today.getTime() - jobDueDate.getTime()) / (24 * 60 * 60 * 1000));
            lateJobs.push({
              ...job,
              daysLate,
              operations: jobOperations
            });
          }
          
          // Check for operations that are overdue
          for (const operation of jobOperations) {
            if (operation.endTime && new Date(operation.endTime) > jobDueDate) {
              const daysLate = Math.floor((new Date(operation.endTime).getTime() - jobDueDate.getTime()) / (24 * 60 * 60 * 1000));
              lateOperations.push({
                ...operation,
                jobName: job.name,
                daysLate
              });
            }
          }
        }
        
        let analysisMessage = "Late Jobs Analysis:\n\n";
        
        if (lateJobs.length === 0) {
          analysisMessage += "✅ No jobs are currently overdue.\n";
        } else {
          analysisMessage += `⚠️ ${lateJobs.length} job(s) are overdue:\n`;
          lateJobs.forEach(job => {
            analysisMessage += `• ${job.name} (${job.customer}) - ${job.daysLate} days late\n`;
            analysisMessage += `  Due: ${new Date(job.dueDate).toLocaleDateString()}\n`;
            analysisMessage += `  Operations: ${job.operations.length} total\n`;
          });
        }
        
        if (lateOperations.length > 0) {
          analysisMessage += `\n🔍 ${lateOperations.length} operation(s) completed late:\n`;
          lateOperations.forEach(op => {
            analysisMessage += `• ${op.name} (${op.jobName}) - ${op.daysLate} days late\n`;
          });
        }
        
        return {
          success: true,
          message: analysisMessage,
          data: {
            lateJobs,
            lateOperations,
            summary: {
              totalLateJobs: lateJobs.length,
              totalLateOperations: lateOperations.length,
              analysisDate: today.toISOString()
            }
          },
          actions: ["ANALYZE_LATE_JOBS"]
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
        // Navigate to a specific page in the application
        return {
          success: true,
          message: message || `Navigating to ${parameters.page || parameters.route} page`,
          data: { 
            page: parameters.page || parameters.route,
            path: parameters.path || `/${parameters.page || parameters.route}`
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
            page: "dashboard", // Production schedule is on dashboard
            path: "/dashboard",
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

      default:
        return {
          success: false,
          message: "I don't understand that command. Try asking me to create jobs, operations, resources, open pages, navigate to analytics, or analyze attached files.",
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
      
      const utilization = {};
      resources.forEach(resource => {
        const resourceOps = operations.filter(op => op.assignedResourceId === resource.id);
        const totalHours = resourceOps.reduce((sum, op) => sum + (op.duration || 0), 0);
        const workingHours = 8 * 5; // 40 hours per week
        
        if (!utilization[resource.type]) {
          utilization[resource.type] = { totalHours: 0, resourceCount: 0 };
        }
        utilization[resource.type].totalHours += totalHours;
        utilization[resource.type].resourceCount += 1;
      });
      
      Object.keys(utilization).forEach(type => {
        const data = utilization[type];
        utilization[type].averageUtilization = Math.round((data.totalHours / (data.resourceCount * workingHours)) * 100);
      });
      
      return utilization;
    },
    
    "jobs_by_priority": () => {
      if (!jobs) return {};
      
      const priorityCount = {};
      jobs.forEach(job => {
        const priority = job.priority || 'medium';
        priorityCount[priority] = (priorityCount[priority] || 0) + 1;
      });
      
      return priorityCount;
    },
    
    "completion_rate": () => {
      if (!jobs || jobs.length === 0) return 0;
      const completedJobs = jobs.filter(j => j.status === "completed").length;
      return Math.round((completedJobs / jobs.length) * 100);
    },
    
    "average_lead_time": () => {
      if (!jobs || !operations) return 0;
      
      const completedJobs = jobs.filter(j => j.status === "completed");
      if (completedJobs.length === 0) return 0;
      
      const totalLeadTime = completedJobs.reduce((sum, job) => {
        const jobOps = operations.filter(op => op.jobId === job.id);
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
  };
  
  // Check if the metric name matches a predefined calculation
  const metricName = parameters.metricName || parameters.name;
  if (metricName && calculations[metricName.toLowerCase().replace(/\s+/g, '_')]) {
    const result = calculations[metricName.toLowerCase().replace(/\s+/g, '_')]();
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
          customer: job.customer,
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