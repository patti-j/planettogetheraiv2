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
  plants: any[];
}

export async function processShiftAIRequest(request: any): Promise<AIAgentResponse> {
  try {
    // Get current system context for shift planning
    const context = await getSystemContext();
    const resources = await storage.getResources();
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

Please create optimized shift templates that meet these requirements while considering resource availability and existing shift patterns.`;
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
      model: "gpt-4o",
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
      message: "Failed to process AI shift request: " + error.message
    };
  }
}

export async function processShiftAssignmentAIRequest(request: any): Promise<AIAgentResponse> {
  try {
    // Get current system context for shift assignment
    const context = await getSystemContext();
    const resources = await storage.getResources();
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
      model: "gpt-4o",
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
            endDate: assignment.endDate ? new Date(assignment.endDate) : null,
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
      message: "Failed to process AI shift assignment request: " + error.message
    };
  }
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
      plantCount: context.plants.length,
      allJobs: context.jobs.map(j => ({ id: j.id, name: j.name, status: j.status, customer: j.customer, priority: j.priority, dueDate: j.dueDate })),
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
- All Resources: ${JSON.stringify(contextSummary.allResources)}
- Total Capabilities: ${contextSummary.capabilityCount}
- All Capabilities: ${JSON.stringify(contextSummary.allCapabilities)}
- Total Plants: ${contextSummary.plantCount}
- All Plants: ${JSON.stringify(contextSummary.allPlants)}

IMPORTANT: You have access to real live manufacturing data. When users ask about jobs, operations, resources, plants, or system status, use the provided live data above to give accurate answers. DO NOT say you don't have access - you have direct access to current system data.

Available actions: LIST_JOBS, LIST_OPERATIONS, LIST_RESOURCES, LIST_PLANTS, CREATE_JOB, CREATE_OPERATION, CREATE_RESOURCE, CREATE_KANBAN_BOARD, ANALYZE_LATE_JOBS, GET_STATUS, ANALYZE_DOCUMENT, ANALYZE_IMAGE, NAVIGATE_TO_PAGE, OPEN_DASHBOARD, CREATE_DASHBOARD, OPEN_GANTT_CHART, OPEN_ANALYTICS, OPEN_BOARDS, OPEN_REPORTS, OPEN_SHOP_FLOOR, OPEN_VISUAL_FACTORY, OPEN_CAPACITY_PLANNING, OPEN_OPTIMIZATION_STUDIO, OPEN_PRODUCTION_PLANNING, OPEN_SYSTEMS_INTEGRATION, OPEN_ROLE_MANAGEMENT, CREATE_ANALYTICS_WIDGET, TRIGGER_UI_ACTION, SHOW_SCHEDULE_EVALUATION, MAXIMIZE_VIEW, MINIMIZE_VIEW, SHOW_CANVAS, CANVAS_CONTENT, CLEAR_CANVAS, CREATE_CHART, CREATE_PIE_CHART, CREATE_LINE_CHART, CREATE_BAR_CHART, CREATE_HISTOGRAM, CREATE_GANTT_CHART, SHOW_API_DOCUMENTATION, and others.

CRITICAL DISTINCTION:
- For API documentation requests ("available APIs", "what APIs can you call", "list of available functions", "what can you do", "your capabilities", "available commands"): Use LIST_AVAILABLE_APIS action
- For actual data requests ("list jobs", "show resources", "available jobs", "available resources"): Use appropriate data actions (LIST_JOBS, LIST_RESOURCES, etc.)

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
- For other data: ADD_CANVAS_CONTENT action with parameters: {title: "descriptive title", type: "table", data: structured_data}
- Canvas displays in the main content area and auto-opens when content is added
- Perfect for: job lists, resource lists, operation tables, performance metrics, data visualizations
- Examples: "show jobs" = LIST_JOBS with displayInCanvas=true, "list resources" = LIST_RESOURCES with displayInCanvas=true
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
  const [jobs, operations, resources, capabilities, plants] = await Promise.all([
    storage.getJobs().then(jobs => jobs.slice(0, 10)), // Max 10 jobs for context
    storage.getOperations().then(ops => ops.slice(0, 20)), // Max 20 operations
    storage.getResources().then(res => res.slice(0, 10)), // Max 10 resources
    storage.getCapabilities(),
    storage.getPlants() // Include all plants since there are typically fewer plants
  ]);

  return { jobs, operations, resources, capabilities, plants };
}

async function executeAction(action: string, parameters: any, message: string, context?: SystemContext, attachments?: AttachmentFile[]): Promise<AIAgentResponse> {
  try {
    switch (action) {
      case "LIST_JOBS":
        const allJobs = await storage.getJobs();
        
        // Check if this should be displayed in canvas - detect various ways users ask to see data
        const shouldDisplayJobsInCanvas = parameters.displayInCanvas || 
                                         parameters.canvas || 
                                         message.toLowerCase().includes('canvas') ||
                                         message.toLowerCase().includes('display') ||
                                         message.toLowerCase().includes('show') ||
                                         message.toLowerCase().includes('list');
        
        if (shouldDisplayJobsInCanvas) {
          return {
            success: true,
            message: message || "Here are all the jobs in your manufacturing system, displayed in the canvas above:",
            data: allJobs,
            canvasAction: {
              type: "ADD_CANVAS_CONTENT",
              content: {
                type: "table",
                title: "Manufacturing Jobs Overview",
                timestamp: new Date().toISOString(),
                data: allJobs.map(job => ({
                  "Job ID": job.id,
                  "Job Name": job.name,
                  "Customer": job.customer,
                  "Priority": job.priority,
                  "Status": job.status,
                  "Due Date": job.dueDate ? new Date(job.dueDate).toLocaleDateString() : 'Not set'
                })),
                width: "100%",
                height: "auto"
              }
            },
            actions: ["LIST_JOBS", "ADD_CANVAS_CONTENT"]
          };
        }
        
        return {
          success: true,
          message: message || `Here are the active jobs in our system:\n\n${allJobs.map(job => `• ${job.name} (ID: ${job.id})\n  Customer: ${job.customer}\n  Priority: ${job.priority}\n  Status: ${job.status}\n  Due: ${job.dueDate ? new Date(job.dueDate).toLocaleDateString() : 'Not set'}`).join('\n\n')}`,
          data: allJobs,
          actions: ["LIST_JOBS"]
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
          "plant-manager": { path: "/plant-manager-dashboard", name: "Plant Manager Dashboard", permissions: ["plant-manager-view"] },
          
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
          { "API Function": "LIST_JOBS", "Description": "List all active jobs with optional display in canvas." },
          { "API Function": "LIST_OPERATIONS", "Description": "List all active operations with optional display in canvas." },
          { "API Function": "LIST_RESOURCES", "Description": "List all active resources with optional display in canvas." },
          { "API Function": "LIST_PLANTS", "Description": "List all active plants with optional display in canvas." },
          { "API Function": "CREATE_JOB", "Description": "Create a new job with required details." },
          { "API Function": "CREATE_OPERATION", "Description": "Create a new operation within a job." },
          { "API Function": "CREATE_RESOURCE", "Description": "Create a new resource (operator or machine)." },
          { "API Function": "CREATE_KANBAN_BOARD", "Description": "Create a new Kanban board for tracking jobs or operations." },
          { "API Function": "ANALYZE_LATE_JOBS", "Description": "Analyze jobs that are late." },
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
          { "API Function": "MINIMIZE_VIEW", "Description": "Minimize current view." }
        ];

        return {
          success: true,
          message: message || "Here are the API functions I have access to:",
          data: apiDocumentation,
          canvasAction: {
            type: "ADD_CANVAS_CONTENT",
            content: {
              type: "table",
              title: "Available API Functions",
              timestamp: new Date().toISOString(),
              data: apiDocumentation,
              width: "100%",
              height: "auto"
            }
          },
          actions: ["LIST_AVAILABLE_APIS", "ADD_CANVAS_CONTENT"]
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
      const customer = job.customer || "Unknown";
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