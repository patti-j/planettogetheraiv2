import OpenAI from "openai";
import { storage } from "./storage";
import { InsertJob, InsertOperation, InsertResource } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AIAgentResponse {
  success: boolean;
  message: string;
  data?: any;
  actions?: string[];
}

export interface SystemContext {
  jobs: any[];
  operations: any[];
  resources: any[];
  capabilities: any[];
}

export async function processAICommand(command: string): Promise<AIAgentResponse> {
  try {
    // Get current system context
    const context = await getSystemContext();
    
    // Use GPT-4o to interpret the command and determine actions
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI agent for a manufacturing production scheduling system. 
          
Current system state:
- Jobs: ${JSON.stringify(context.jobs, null, 2)}
- Operations: ${JSON.stringify(context.operations, null, 2)}
- Resources: ${JSON.stringify(context.resources, null, 2)}
- Capabilities: ${JSON.stringify(context.capabilities, null, 2)}

You can perform these actions:
1. CREATE_JOB - Create a new production job
2. CREATE_OPERATION - Create a new operation for a job
3. CREATE_RESOURCE - Create a new resource
4. UPDATE_OPERATION - Update an existing operation
5. ASSIGN_OPERATION - Assign an operation to a resource
6. GET_STATUS - Get current system status
7. SEARCH_JOBS - Search for jobs by criteria
8. SEARCH_OPERATIONS - Search for operations by criteria
9. ANALYZE_LATE_JOBS - Analyze which jobs are late and provide detailed information
10. CREATE_CUSTOM_METRIC - Create a custom metric for tracking specific KPIs
11. CALCULATE_CUSTOM_METRIC - Calculate and return custom metrics values
12. CHANGE_COLOR_SCHEME - Change the color scheme for Resource Gantt blocks
13. CHANGE_TEXT_LABELING - Change the text labeling for Resource Gantt blocks
14. CREATE_KANBAN_BOARD - Create a Kanban board configuration based on user description
15. CREATE_RESOURCE_VIEW - Create a resource Gantt view configuration based on user description
16. SET_GANTT_ZOOM - Set the zoom level for the Resource Gantt chart
17. SET_GANTT_SCROLL - Set the scroll position for the Resource Gantt chart
18. SCROLL_TO_TODAY - Scroll the Gantt chart to show today's date
19. CREATE_CUSTOM_TEXT_LABELS - Create custom text labels based on user description
20. CREATE_ANALYTICS_WIDGETS - Create analytics widgets for reports and dashboards

Respond with JSON in this format:
{
  "action": "ACTION_NAME",
  "parameters": { /* action parameters */ },
  "message": "Human-readable response message"
}

For CREATE_JOB, parameters should include: name, description, customer, priority, dueDate
For CREATE_OPERATION, parameters should include: name, description, jobId, duration, requiredCapabilities
For CREATE_RESOURCE, parameters should include: name, type, capabilities
For UPDATE_OPERATION, parameters should include: id, and fields to update
For ASSIGN_OPERATION, parameters should include: operationId, resourceId
For ANALYZE_LATE_JOBS, no parameters needed - analyze current jobs and operations to determine which are late
For CREATE_CUSTOM_METRIC, parameters should include: name, description, calculation (formula or logic)
For CALCULATE_CUSTOM_METRIC, parameters should include: metricName or calculation logic
For CREATE_CUSTOM_TEXT_LABELS, parameters should include: labelConfigurations (array of label objects with name and field configurations)
For CHANGE_COLOR_SCHEME, parameters should include: colorScheme (by_job, by_priority, by_status, by_operation_type, by_resource)
For CHANGE_TEXT_LABELING, parameters should include: textLabeling (operation_name, job_name, both, duration, progress, none)
For CREATE_KANBAN_BOARD, parameters should include: name, description, viewType (jobs/operations), swimLaneField (status/priority/customer/assignedResourceId), filters (optional)
For CREATE_RESOURCE_VIEW, parameters should include: name, description, resourceIds (array of resource IDs to include), colorScheme (optional), textLabeling (optional)
For SET_GANTT_ZOOM, parameters should include: zoomLevel (hour/day/week/month)
For SET_GANTT_SCROLL, parameters should include: scrollPosition (percentage 0-100 or time-based like "2024-01-15")
For SCROLL_TO_TODAY, no parameters needed - scroll to today's date on the timeline
For CREATE_ANALYTICS_WIDGETS, parameters should include: widgets (array of widget objects with title, type, data, config)

When analyzing late jobs, provide specific information about:
- Which jobs are late and by how much
- Current status of operations
- Impact on production schedule
- Recommended actions

Be helpful and interpret natural language commands into appropriate actions. When asked about late jobs, overdue operations, or scheduling issues, use ANALYZE_LATE_JOBS to provide detailed analysis.`
        },
        {
          role: "user",
          content: command
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiResponse = JSON.parse(response.choices[0].message.content || "{}");
    
    // Execute the determined action
    return await executeAction(aiResponse.action, aiResponse.parameters, aiResponse.message, context);
    
  } catch (error) {
    console.error("AI Agent Error:", error);
    return {
      success: false,
      message: "I encountered an error processing your command. Please try again.",
      data: null
    };
  }
}

async function getSystemContext(): Promise<SystemContext> {
  const [jobs, operations, resources, capabilities] = await Promise.all([
    storage.getJobs(),
    storage.getOperations(),
    storage.getResources(),
    storage.getCapabilities()
  ]);

  return { jobs, operations, resources, capabilities };
}

async function executeAction(action: string, parameters: any, message: string, context?: SystemContext): Promise<AIAgentResponse> {
  try {
    switch (action) {
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
        const allResources = await storage.getResources();
        const resourceSequence = parameters.resourceIds && parameters.resourceIds.length > 0 
          ? parameters.resourceIds 
          : allResources.map(r => r.id);
        
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

      default:
        return {
          success: false,
          message: "I don't understand that command. Try asking me to create jobs, operations, or resources.",
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