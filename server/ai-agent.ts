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

Respond with JSON in this format:
{
  "action": "ACTION_NAME",
  "parameters": { /* action parameters */ },
  "message": "Human-readable response message"
}

For CREATE_JOB, parameters should include: name, description, customerName, priority, dueDate
For CREATE_OPERATION, parameters should include: name, description, jobId, duration, requiredCapabilities
For CREATE_RESOURCE, parameters should include: name, type, capabilities
For UPDATE_OPERATION, parameters should include: id, and fields to update
For ASSIGN_OPERATION, parameters should include: operationId, resourceId
For ANALYZE_LATE_JOBS, no parameters needed - analyze current jobs and operations to determine which are late

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
        const jobData: InsertJob = {
          name: parameters.name,
          description: parameters.description || null,
          customerName: parameters.customerName || null,
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
        const context = await getSystemContext();
        return {
          success: true,
          message: message || `Current system status retrieved`,
          data: context,
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
        if (!context) {
          const freshContext = await getSystemContext();
          context = freshContext;
        }
        
        const today = new Date();
        const lateJobs = [];
        const lateOperations = [];
        
        // Analyze each job for lateness
        for (const job of context.jobs) {
          const jobDueDate = new Date(job.dueDate);
          const jobOperations = context.operations.filter(op => op.jobId === job.id);
          
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
            analysisMessage += `• ${job.name} (${job.customerName}) - ${job.daysLate} days late\n`;
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