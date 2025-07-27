import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { createSafeHandler, errorMiddleware, ValidationError, DatabaseError, NotFoundError, AuthenticationError } from "./error-handler";
import { 
  insertPlantSchema, insertCapabilitySchema, insertResourceSchema, insertProductionOrderSchema, insertPlannedOrderSchema, 
  insertOperationSchema, insertDependencySchema, insertResourceViewSchema,
  insertCustomTextLabelSchema, insertKanbanConfigSchema, insertReportConfigSchema,
  insertDashboardConfigSchema, insertScheduleScenarioSchema, insertScenarioOperationSchema,
  insertScenarioEvaluationSchema, insertScenarioDiscussionSchema,
  insertSystemUserSchema, insertSystemHealthSchema, insertSystemEnvironmentSchema,
  insertSystemUpgradeSchema, insertSystemAuditLogSchema, insertSystemSettingsSchema,
  insertCapacityPlanningScenarioSchema, insertStaffingPlanSchema, insertShiftPlanSchema,
  insertEquipmentPlanSchema, insertCapacityProjectionSchema,
  insertBusinessGoalSchema, insertGoalProgressSchema, insertGoalRiskSchema,
  insertGoalIssueSchema, insertGoalKpiSchema, insertGoalActionSchema,
  insertUserSchema, insertRoleSchema, insertPermissionSchema,
  insertUserRoleSchema, insertRolePermissionSchema,
  insertDemoTourParticipantSchema,
  insertVoiceRecordingsCacheSchema,
  insertDisruptionSchema, insertDisruptionActionSchema, insertDisruptionEscalationSchema,
  insertChatChannelSchema, insertChatMemberSchema, insertChatMessageSchema, insertChatReactionSchema,
  insertStockItemSchema, insertStockTransactionSchema, insertStockBalanceSchema,
  insertDemandForecastSchema, insertDemandDriverSchema, insertDemandHistorySchema,
  insertStockOptimizationScenarioSchema, insertOptimizationRecommendationSchema,
  insertFeedbackSchema, insertFeedbackCommentSchema, insertFeedbackVoteSchema,
  insertSystemIntegrationSchema, insertIntegrationJobSchema, insertIntegrationEventSchema,
  insertIntegrationMappingSchema, insertIntegrationTemplateSchema,
  insertWorkflowSchema, insertWorkflowTriggerSchema, insertWorkflowActionSchema,
  insertWorkflowActionMappingSchema, insertWorkflowExecutionSchema, insertWorkflowActionExecutionSchema,
  insertWorkflowMonitoringSchema,
  insertTourPromptTemplateSchema, insertTourPromptTemplateUsageSchema,
  insertCanvasContentSchema, insertCanvasSettingsSchema,
  insertErrorLogSchema, insertErrorReportSchema,
  insertPresentationSchema, insertPresentationSlideSchema, insertPresentationTourIntegrationSchema,
  insertPresentationLibrarySchema, insertPresentationAnalyticsSchema, insertPresentationAIContentSchema,
  insertCustomerJourneyStageSchema, insertManufacturingSegmentSchema, insertBuyerPersonaSchema,
  insertMarketingPageSchema, insertContentBlockSchema, insertCustomerStorySchema,
  insertLeadCaptureSchema, insertPageAnalyticsSchema, insertABTestSchema, insertEmailCampaignSchema,
  insertProductionPlanSchema, insertProductionTargetSchema, insertResourceAllocationSchema, insertProductionMilestoneSchema,
  insertShiftTemplateSchema, insertResourceShiftAssignmentSchema, insertShiftScenarioSchema, 
  insertHolidaySchema, insertResourceAbsenceSchema, insertShiftCoverageSchema, insertShiftUtilizationSchema,
  insertUnplannedDowntimeSchema, insertOvertimeShiftSchema, insertDowntimeActionSchema, insertShiftChangeRequestSchema,
  insertStrategyDocumentSchema, insertDevelopmentTaskSchema, insertTestSuiteSchema, insertTestCaseSchema, insertArchitectureComponentSchema,
  insertApiIntegrationSchema, insertApiMappingSchema, insertApiTestSchema, insertApiCredentialSchema, insertApiAuditLogSchema,
  insertSchedulingHistorySchema, insertSchedulingResultSchema, insertAlgorithmPerformanceSchema,
  insertRecipeSchema, insertRecipePhaseSchema, insertRecipeFormulaSchema, insertRecipeEquipmentSchema,
  insertVendorSchema, insertCustomerSchema,
  insertOptimizationScopeConfigSchema, insertOptimizationRunSchema,
  insertUserSecretSchema
} from "@shared/schema";
import { processAICommand, processShiftAIRequest, processShiftAssignmentAIRequest, transcribeAudio } from "./ai-agent";
import { emailService } from "./email";
import multer from "multer";
import session from "express-session";
import bcrypt from "bcryptjs";
import connectPg from "connect-pg-simple";
import OpenAI from "openai";
import crypto from "crypto";

// Session interface is declared in index.ts

// Session is now configured in index.ts

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  let userId = req.session?.userId;
  
  // Check for token in Authorization header if session fails
  if (!userId && req.headers.authorization) {
    const token = req.headers.authorization.replace('Bearer ', '');
    
    // Handle demo tokens
    if (token.startsWith('demo_')) {
      const tokenParts = token.split('_');
      if (tokenParts.length >= 3) {
        userId = tokenParts[1] + '_' + tokenParts[2]; // demo_exec, demo_prod, etc.
      }
    }
    // Extract user ID from regular token (format: user_ID_timestamp_random)
    else if (token.startsWith('user_')) {
      const tokenParts = token.split('_');
      if (tokenParts.length >= 2) {
        userId = parseInt(tokenParts[1]);
      }
    }
  }
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Add userId to request for use in route handlers
  req.user = { id: userId };
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware is configured in index.ts

  // Create trial account endpoint
  app.post("/api/auth/create-trial", async (req, res) => {
    try {
      const { email, companyName } = req.body;
      
      console.log("=== TRIAL ACCOUNT CREATION ===");
      console.log("Email:", email, "Company:", companyName);
      
      if (!email || !companyName) {
        return res.status(400).json({ 
          success: false,
          message: "Email and company name are required" 
        });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          message: "An account with this email already exists" 
        });
      }

      // Generate trial credentials
      const trialUsername = `trial_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const trialPassword = Math.random().toString(36).substring(2, 12);

      // Create trial user using correct schema fields (createUser will hash the password)
      const trialUser = await storage.createUser({
        username: trialUsername,
        email: email,
        passwordHash: trialPassword, // createUser method will hash this
        firstName: "Trial",
        lastName: "User",
        jobTitle: "Trial User",
        department: companyName
      });

      // Create trial onboarding data
      await storage.createCompanyOnboarding({
        companyName: companyName,
        industry: "trial",
        size: "small",
        primaryGoal: "trial-evaluation",
        features: ["production-scheduling"],
        completedSteps: ["welcome", "company", "features"],
        currentStep: "completed",
        teamMembers: 1,
        isCompleted: true,
        createdBy: trialUser.id
      });

      console.log("Trial account created successfully:", trialUsername);

      res.json({
        success: true,
        message: "Trial account created successfully",
        credentials: {
          username: trialUsername,
          password: trialPassword
        }
      });

    } catch (error) {
      console.error("Trial account creation error:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to create trial account" 
      });
    }
  });

  // Demo login route for prospective users
  app.post("/api/auth/demo-login", async (req, res) => {
    try {
      const { role } = req.body;
      
      console.log("=== DEMO LOGIN ===");
      console.log("Demo role:", role);
      
      if (!role) {
        return res.status(400).json({ message: "Demo role is required" });
      }

      // Demo user mapping for different roles
      const demoUsers = {
        'director': { id: 'demo_director', username: 'demo_director', role: 'Director' },
        'plant-manager': { id: 'demo_plant', username: 'demo_plant_manager', role: 'Plant Manager' },
        'production-scheduler': { id: 'demo_scheduler', username: 'demo_scheduler', role: 'Production Scheduler' },
        'it-administrator': { id: 'demo_it_admin', username: 'demo_it_admin', role: 'IT Administrator' },
        'systems-manager': { id: 'demo_systems', username: 'demo_systems_manager', role: 'Systems Manager' },
        'administrator': { id: 'demo_admin', username: 'demo_administrator', role: 'Administrator' },
        'shop-floor-operations': { id: 'demo_shop_floor', username: 'demo_shop_floor', role: 'Shop Floor Operations' },
        'data-analyst': { id: 'demo_analyst', username: 'demo_data_analyst', role: 'Data Analyst' },
        'trainer': { id: 'demo_trainer', username: 'demo_trainer', role: 'Trainer' },
        'it-systems-administrator': { id: 'demo_it_systems', username: 'demo_it_systems_admin', role: 'IT Systems Administrator' },
        'sales-representative': { id: 'demo_sales', username: 'demo_sales_rep', role: 'Sales Representative' },
        'customer-service-representative': { id: 'demo_customer_service', username: 'demo_customer_service', role: 'Customer Service Representative' },
        'support-engineer': { id: 'demo_support', username: 'demo_support_engineer', role: 'Support Engineer' },
        'supply-chain-planner': { id: 'demo_supply_chain', username: 'demo_supply_chain', role: 'Supply Chain Planner' },
        // Legacy mappings for backward compatibility
        'executive': { id: 'demo_director', username: 'demo_director', role: 'Director' },
        'production': { id: 'demo_scheduler', username: 'demo_scheduler', role: 'Production Scheduler' },
        'it-admin': { id: 'demo_it_admin', username: 'demo_it_admin', role: 'IT Administrator' }
      };

      const demoUser = demoUsers[role as keyof typeof demoUsers];
      if (!demoUser) {
        return res.status(400).json({ message: "Invalid demo role" });
      }

      // Create demo session without database lookup
      req.session.userId = demoUser.id;
      req.session.isDemo = true;
      req.session.demoRole = demoUser.role;
      
      // Generate demo auth token
      const demoToken = `demo_${demoUser.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      res.json({
        message: "Demo login successful",
        user: {
          id: demoUser.id,
          username: demoUser.username,
          email: `${demoUser.username}@demo.planettogether.com`,
          isActive: true,
          isDemo: true,
          role: demoUser.role
        },
        token: demoToken
      });
    } catch (error) {
      console.error("Demo login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Data import routes
  app.post('/api/data-import/bulk', requireAuth, async (req, res) => {
    try {
      const { type, data } = req.body;
      
      if (!type || !data || !Array.isArray(data)) {
        return res.status(400).json({ message: 'Invalid import data format' });
      }

      let results: any[] = [];
      
      switch (type) {
        case 'resources':
          for (const item of data) {
            const insertResource = insertResourceSchema.parse({
              name: item.name,
              type: item.type || 'Equipment',
              description: item.description || '',
              status: item.status || 'active'
            });
            const resource = await storage.createResource(insertResource);
            
            // Handle capabilities if provided
            if (item.capabilities) {
              const capabilityNames = item.capabilities.split(',').map((c: string) => c.trim());
              for (const capName of capabilityNames) {
                // Find or create capability
                let capability = await storage.getCapabilityByName(capName);
                if (!capability) {
                  const insertCap = insertCapabilitySchema.parse({
                    name: capName,
                    description: `Auto-created capability: ${capName}`,
                    category: 'general'
                  });
                  capability = await storage.createCapability(insertCap);
                }
                // Associate resource with capability
                await storage.addResourceCapability(resource.id, capability.id);
              }
            }
            results.push(resource);
          }
          break;
          
        case 'jobs':
          for (const item of data) {
            const insertJob = insertProductionOrderSchema.parse({
              orderNumber: `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name: item.name,
              customer: item.customer || '',
              priority: item.priority || 'medium',
              status: 'released',
              dueDate: item.dueDate ? new Date(item.dueDate) : null,
              quantity: item.quantity || 1,
              description: item.description || '',
              plantId: 1 // Default plant
            });
            const job = await storage.createProductionOrder(insertJob);
            results.push(job);
          }
          break;
          
        case 'capabilities':
          for (const item of data) {
            const insertCapability = insertCapabilitySchema.parse({
              name: item.name,
              description: item.description || '',
              category: item.category || 'general'
            });
            const capability = await storage.createCapability(insertCapability);
            results.push(capability);
          }
          break;
          
        case 'plants':
          for (const item of data) {
            const insertPlant = insertPlantSchema.parse({
              name: item.name,
              location: item.location || '',
              address: item.address || '',
              timezone: item.timezone || 'UTC'
            });
            const plant = await storage.createPlant(insertPlant);
            results.push(plant);
          }
          break;
          
        case 'users':
          for (const item of data) {
            // For user creation, we'll need to handle this differently since it involves authentication
            // For now, we'll create a simplified version or require admin privileges
            if (!req.user || req.user.id !== 6) { // Only trainer can create users for now
              return res.status(403).json({ message: 'Insufficient permissions to create users' });
            }
            
            const insertUser = insertUserSchema.parse({
              username: item.username,
              email: item.email || `${item.username}@company.com`,
              firstName: item.firstName || '',
              lastName: item.lastName || '',
              passwordHash: await bcrypt.hash('temporary123', 10) // Default temporary password
            });
            const user = await storage.createUser(insertUser);
            results.push({ ...user, passwordHash: undefined }); // Don't return password hash
          }
          break;
          
        case 'productionOrders':
          for (const item of data) {
            // Convert production orders from simplified import format
            const insertOrder = {
              orderNumber: item.orderNumber || `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name: item.name,
              description: item.description || '',
              customer: item.customer,
              priority: item.priority || 'medium',
              status: item.status || 'released',
              quantity: parseInt(item.quantity) || 1,
              dueDate: item.dueDate ? new Date(item.dueDate) : null,
              plantId: 1 // Default to first plant for import
            };
            const order = await storage.createProductionOrder(insertOrder);
            results.push(order);
          }
          break;

        case 'plannedOrders':
          for (const item of data) {
            // Convert planned orders from simplified import format
            const insertPlannedOrder = {
              plannedOrderNumber: item.plannedOrderNumber || `PLN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              itemNumber: item.itemNumber || item.name || 'ITEM-001',
              quantity: parseInt(item.quantity) || 1,
              requiredDate: item.requiredDate ? new Date(item.requiredDate) : new Date(),
              orderType: item.orderType || 'production',
              source: item.source || 'manual',
              status: item.status || 'firm',
              priority: item.priority || 'medium',
              plantId: 1 // Default to first plant for import
            };
            const plannedOrder = await storage.createPlannedOrder(insertPlannedOrder);
            results.push(plannedOrder);
          }
          break;

        case 'vendors':
          // Simple vendor storage for import (would need proper vendor table implementation)
          for (const item of data) {
            const vendor = {
              id: Date.now() + Math.floor(Math.random() * 1000),
              vendorNumber: item.vendorNumber || `V${Date.now()}`,
              vendorName: item.vendorName,
              vendorType: item.vendorType || 'supplier',
              contactName: item.contactName || '',
              contactEmail: item.contactEmail || '',
              contactPhone: item.contactPhone || '',
              address: item.address || '',
              city: item.city || '',
              state: item.state || '',
              zipCode: item.zipCode || '',
              country: item.country || 'US',
              paymentTerms: item.paymentTerms || 'net30',
              status: item.status || 'active'
            };
            results.push(vendor);
          }
          break;

        case 'customers':
          // Simple customer storage for import (would need proper customer table implementation)
          for (const item of data) {
            const customer = {
              id: Date.now() + Math.floor(Math.random() * 1000),
              customerNumber: item.customerNumber || `C${Date.now()}`,
              customerName: item.customerName,
              contactName: item.contactName || '',
              contactEmail: item.contactEmail || '',
              contactPhone: item.contactPhone || '',
              address: item.address || '',
              city: item.city || '',
              state: item.state || '',
              zipCode: item.zipCode || '',
              country: item.country || 'US',
              customerTier: item.customerTier || 'standard',
              status: item.status || 'active'
            };
            results.push(customer);
          }
          break;

        default:
          return res.status(400).json({ message: `Unsupported import type: ${type}` });
      }
      
      res.json({
        success: true,
        type,
        imported: results.length,
        data: results
      });
    } catch (error) {
      console.error('Data import error:', error);
      res.status(500).json({ message: 'Failed to import data', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // AI-powered sample data generation
  app.post('/api/data-import/generate-sample-data', requireAuth, async (req, res) => {
    try {
      const { prompt, companyInfo, selectedDataTypes, sampleSize = 'medium', deleteExistingData = false } = req.body;
      
      if (!prompt || !companyInfo || !selectedDataTypes) {
        return res.status(400).json({ error: 'Missing required fields: prompt, companyInfo, selectedDataTypes' });
      }

      // Delete existing master data if requested
      if (deleteExistingData) {
        console.log('Deleting existing master data before AI generation...');
        try {
          // Delete in proper order to handle foreign key constraints
          // Delete all dependent tables first, then core master data tables
          await db.execute(sql`DELETE FROM disruption_actions`);
          await db.execute(sql`DELETE FROM disruption_escalations`);
          await db.execute(sql`DELETE FROM disruptions`);
          await db.execute(sql`DELETE FROM dependencies`);
          await db.execute(sql`DELETE FROM scenario_operations`);
          await db.execute(sql`DELETE FROM scheduling_results`);
          await db.execute(sql`DELETE FROM algorithm_performance`);
          await db.execute(sql`DELETE FROM scheduling_history`);
          await db.execute(sql`DELETE FROM production_targets`);
          await db.execute(sql`DELETE FROM production_plans`);
          await db.execute(sql`DELETE FROM resource_absences`);
          await db.execute(sql`DELETE FROM resource_allocations`);
          await db.execute(sql`DELETE FROM resource_shift_assignments`);
          await db.execute(sql`DELETE FROM shift_templates`);
          await db.execute(sql`DELETE FROM holidays`);
          await db.execute(sql`DELETE FROM operations`);
          await db.execute(sql`DELETE FROM production_orders`);
          await db.execute(sql`DELETE FROM jobs WHERE id NOT IN (SELECT id FROM production_orders)`);
          await db.execute(sql`DELETE FROM resources`);
          await db.execute(sql`DELETE FROM plants`);
          
          console.log('Successfully deleted all existing master data via SQL');
        } catch (deleteError) {
          console.error('Error deleting existing master data:', deleteError);
          return res.status(500).json({ 
            error: 'Failed to delete existing master data', 
            details: deleteError.message 
          });
        }
      }

      // Industry-specific sample size configurations
      const getIndustryTypicalSizes = (industry: string) => {
        const industryLower = industry.toLowerCase();
        
        // Base configurations by industry - Per Plant Scaling
        if (industryLower.includes('automotive') || industryLower.includes('auto')) {
          return {
            small: { plants: { min: 1, max: 2 }, resourcesPerPlant: { min: 4, max: 6 }, capabilities: { min: 6, max: 10 }, ordersPerPlant: { min: 8, max: 12 }, operationsPerOrder: { min: 2, max: 4 } },
            medium: { plants: { min: 2, max: 4 }, resourcesPerPlant: { min: 5, max: 9 }, capabilities: { min: 12, max: 18 }, ordersPerPlant: { min: 10, max: 18 }, operationsPerOrder: { min: 3, max: 6 } },
            large: { plants: { min: 4, max: 8 }, resourcesPerPlant: { min: 6, max: 10 }, capabilities: { min: 20, max: 30 }, ordersPerPlant: { min: 12, max: 19 }, operationsPerOrder: { min: 4, max: 8 } }
          };
        } else if (industryLower.includes('pharmaceutical') || industryLower.includes('pharma')) {
          return {
            small: { plants: { min: 1, max: 2 }, resourcesPerPlant: { min: 8, max: 12 }, capabilities: { min: 15, max: 20 }, ordersPerPlant: { min: 25, max: 40 }, operationsPerOrder: { min: 4, max: 7 } },
            medium: { plants: { min: 2, max: 4 }, resourcesPerPlant: { min: 12, max: 18 }, capabilities: { min: 25, max: 35 }, ordersPerPlant: { min: 40, max: 65 }, operationsPerOrder: { min: 5, max: 8 } },
            large: { plants: { min: 4, max: 8 }, resourcesPerPlant: { min: 18, max: 25 }, capabilities: { min: 40, max: 60 }, ordersPerPlant: { min: 65, max: 100 }, operationsPerOrder: { min: 6, max: 10 } }
          };
        } else if (industryLower.includes('electronics') || industryLower.includes('semiconductor')) {
          return {
            small: { plants: { min: 1, max: 2 }, resourcesPerPlant: { min: 5, max: 8 }, capabilities: { min: 8, max: 12 }, ordersPerPlant: { min: 12, max: 20 }, operationsPerOrder: { min: 2, max: 4 } },
            medium: { plants: { min: 2, max: 4 }, resourcesPerPlant: { min: 6, max: 10 }, capabilities: { min: 15, max: 22 }, ordersPerPlant: { min: 15, max: 25 }, operationsPerOrder: { min: 3, max: 6 } },
            large: { plants: { min: 4, max: 7 }, resourcesPerPlant: { min: 9, max: 14 }, capabilities: { min: 25, max: 35 }, ordersPerPlant: { min: 21, max: 36 }, operationsPerOrder: { min: 4, max: 8 } }
          };
        } else if (industryLower.includes('food') || industryLower.includes('beverage')) {
          return {
            small: { plants: { min: 1, max: 2 }, resourcesPerPlant: { min: 2, max: 4 }, capabilities: { min: 5, max: 8 }, ordersPerPlant: { min: 10, max: 18 }, operationsPerOrder: { min: 2, max: 4 } },
            medium: { plants: { min: 2, max: 4 }, resourcesPerPlant: { min: 3, max: 5 }, capabilities: { min: 10, max: 15 }, ordersPerPlant: { min: 12, max: 20 }, operationsPerOrder: { min: 3, max: 6 } },
            large: { plants: { min: 3, max: 6 }, resourcesPerPlant: { min: 5, max: 8 }, capabilities: { min: 18, max: 25 }, ordersPerPlant: { min: 20, max: 30 }, operationsPerOrder: { min: 4, max: 8 } }
          };
        } else {
          // Generic manufacturing defaults
          return {
            small: { plants: { min: 1, max: 2 }, resourcesPerPlant: { min: 2, max: 3 }, capabilities: { min: 3, max: 5 }, ordersPerPlant: { min: 3, max: 5 }, operationsPerOrder: { min: 2, max: 4 } },
            medium: { plants: { min: 3, max: 5 }, resourcesPerPlant: { min: 2, max: 3 }, capabilities: { min: 5, max: 8 }, ordersPerPlant: { min: 4, max: 6 }, operationsPerOrder: { min: 3, max: 5 } },
            large: { plants: { min: 5, max: 10 }, resourcesPerPlant: { min: 2, max: 4 }, capabilities: { min: 8, max: 15 }, ordersPerPlant: { min: 3, max: 5 }, operationsPerOrder: { min: 3, max: 5 } }
          };
        }
      };

      const industryConfig = getIndustryTypicalSizes(companyInfo.industry || 'General Manufacturing');
      const config = industryConfig[sampleSize as keyof typeof industryConfig] || industryConfig.medium;

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const systemPrompt = `You are an expert manufacturing data specialist with deep knowledge of industry-specific production processes. Generate realistic sample data for a manufacturing ERP system based on the company information and requirements provided.

Company Information:
- Company Name: ${companyInfo.name}
- Industry: ${companyInfo.industry}
- Company Size: ${companyInfo.size}
- Number of Plants: ${companyInfo.numberOfPlants || '1'}
- Description: ${companyInfo.description}
${companyInfo.website ? `- Website: ${companyInfo.website}` : ''}
${companyInfo.products ? `- Main Products & Production Process: ${companyInfo.products}` : ''}

Sample Size: ${sampleSize.toUpperCase()} - Industry-typical volumes for ${companyInfo.industry}

Generate sample data for the following data types: ${selectedDataTypes.join(', ')}

For each data type, generate the following number of records:
${selectedDataTypes.map(type => {
  if (type === 'plants') {
    const typeConfig = config.plants;
    return `- plants: ${typeConfig.min}-${typeConfig.max} manufacturing facilities`;
  } else if (type === 'resources') {
    const typeConfig = config.resourcesPerPlant;
    return `- resources: ${typeConfig.min}-${typeConfig.max} resources PER PLANT (scale based on number of plants generated)`;
  } else if (type === 'productionOrders') {
    const typeConfig = config.ordersPerPlant;
    return `- productionOrders: ${typeConfig.min}-${typeConfig.max} production orders PER PLANT (scale based on number of plants generated)`;
  } else if (type === 'operations') {
    const typeConfig = config.operationsPerOrder;
    return `- operations: ${typeConfig.min}-${typeConfig.max} operations PER PRODUCTION ORDER (scale based on total orders)`;
  } else if (type === 'capabilities') {
    const typeConfig = config.capabilities;
    return `- capabilities: ${typeConfig.min}-${typeConfig.max} manufacturing capabilities (shared across all plants)`;
  } else {
    return `- ${type}: 3-5 records (default)`;
  }
}).join('\n')}

CRITICAL REQUIREMENTS:
1. Create capabilities that align with typical ${companyInfo.industry} production processes
2. Generate resources that require these specific capabilities (perfect matching)
3. Create operations for production orders that utilize the generated capabilities
4. Ensure operations follow realistic production sequences for ${companyInfo.industry}
5. Each capability should be used by at least one resource and required by at least one operation

INDUSTRY-SPECIFIC GUIDANCE:
${companyInfo.industry.toLowerCase().includes('automotive') ? `
For Automotive Industry:
- Capabilities: CNC Machining, Welding, Stamping, Assembly, Painting, Quality Inspection, Heat Treatment
- Resources: CNC Mills, Robotic Welders, Stamping Presses, Assembly Lines, Paint Booths, CMM Machines
- Operations: Part Machining → Welding → Assembly → Painting → Quality Check
- Products: Engine components, chassis parts, body panels, electronic assemblies` : ''}
${companyInfo.industry.toLowerCase().includes('pharmaceutical') ? `
For Pharmaceutical Industry:
- Capabilities: API Synthesis, Tablet Compression, Liquid Filling, Sterile Processing, Quality Testing, Packaging
- Resources: Reactors, Tablet Presses, Filling Lines, Cleanrooms, HPLC Equipment, Packaging Lines
- Operations: API Production → Formulation → Compression/Filling → Testing → Packaging
- Products: Tablets, injectable solutions, capsules, ointments` : ''}
${companyInfo.industry.toLowerCase().includes('electronics') ? `
For Electronics Industry:
- Capabilities: PCB Assembly, Surface Mount Technology, Testing, Programming, Final Assembly, Quality Control
- Resources: Pick & Place Machines, Reflow Ovens, ICT Testers, Programming Stations, Assembly Workstations
- Operations: PCB Assembly → Component Placement → Reflow → Testing → Programming → Final Assembly
- Products: Circuit boards, electronic modules, consumer devices, industrial controls` : ''}
${companyInfo.industry.toLowerCase().includes('food') || companyInfo.industry.toLowerCase().includes('beverage') ? `
For Food/Beverage Industry:
- Capabilities: Mixing, Cooking, Pasteurization, Packaging, Labeling, Quality Testing, Cold Storage
- Resources: Mixers, Ovens, Pasteurizers, Filling Lines, Labeling Machines, Lab Equipment, Cold Storage
- Operations: Ingredient Prep → Mixing → Cooking/Processing → Packaging → Quality Check → Storage
- Products: Packaged foods, beverages, frozen products, dairy items` : ''}

For each data type, provide:
1. Industry-specific authentic equipment and process names
2. Realistic production workflows that match ${companyInfo.industry} standards
3. Proper capability-resource-operation relationships
4. Scale appropriately per plant with specialized equipment per location
5. Use ${companyInfo.products ? `production processes based on: ${companyInfo.products}` : 'industry-standard production processes'}

IMPORTANT: Use these exact field names for each data type:

plants: { name, location, address, timezone }
capabilities: { name, description, category }
resources: { name, type, description, status }
productionOrders: { orderNumber, name, customer, priority, status, quantity, dueDate, description }
operations: { name, description, duration, requiredCapabilities }

ENSURE PERFECT ALIGNMENT:
- Every capability must be required by at least one operation
- Every resource must possess capabilities that are actually used in operations
- Operations should form logical production sequences for ${companyInfo.industry}
- Production orders should include realistic operations for their products

Return the result as a JSON object with the following structure:
{
  "summary": "Brief description of what was generated",
  "dataTypes": {
    "plants": [{ "name": "Plant Name", "location": "City, State", "address": "Full Address", "timezone": "America/New_York" }],
    "capabilities": [{ "name": "Capability Name", "description": "What this capability does", "category": "manufacturing" }],
    "resources": [{ "name": "Resource Name", "type": "Equipment", "description": "Resource description", "status": "active" }],
    "productionOrders": [{ "orderNumber": "PO-001", "name": "Order Name", "customer": "Customer Name", "priority": "high", "status": "released", "quantity": 100, "dueDate": "2024-01-15", "description": "Order description" }]
    // etc for each requested type
  },
  "totalRecords": 0,
  "recommendations": ["List of recommendations for using this data"]
}

Additional guidance for ${sampleSize} sample:
${sampleSize === 'small' ? `
- Create minimal but functional dataset for quick testing and evaluation
- Focus on core operations with essential resources and basic production flow
- Suitable for proof-of-concept and initial system exploration` : ''}
${sampleSize === 'medium' ? `
- Create balanced dataset that represents typical operations
- Include variety of resources, capabilities, and production scenarios
- Suitable for system evaluation and feature demonstration` : ''}
${sampleSize === 'large' ? `
- Create comprehensive dataset representing full-scale operations
- Include diverse resource types, complex production workflows, and multiple product lines
- Distribute resources realistically across all plants with proper specialization
- Suitable for performance testing and complete system evaluation` : ''}

Focus on manufacturing-relevant data that would be realistic for a ${companyInfo.industry} company of ${companyInfo.size} size operating ${companyInfo.numberOfPlants || '1'} plant(s).`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000
      });

      const generatedData = JSON.parse(response.choices[0].message.content);
      
      // Import the generated data
      const importResults = [];
      let totalImported = 0;

      for (const [dataType, records] of Object.entries(generatedData.dataTypes)) {
        if (Array.isArray(records) && records.length > 0) {
          try {
            let results = [];
            switch (dataType) {
              case 'plants':
                for (const item of records) {
                  const insertPlant = insertPlantSchema.parse({
                    name: item.name || item.plantName || item.facilityName || 'Unknown Plant',
                    location: item.location || '',
                    address: item.address || item.location || '',
                    timezone: item.timezone || 'UTC'
                  });
                  const plant = await storage.createPlant(insertPlant);
                  results.push(plant);
                }
                break;
              case 'capabilities':
                for (const item of records) {
                  const insertCapability = insertCapabilitySchema.parse({
                    name: item.name || item.capabilityName || item.skillName || item.process || 'Unknown Capability',
                    description: item.description || `${item.process || item.capability || 'Manufacturing'} capability`,
                    category: item.category || 'manufacturing'
                  });
                  try {
                    const capability = await storage.createCapability(insertCapability);
                    results.push(capability);
                  } catch (capabilityError: any) {
                    if (capabilityError.constraint === 'capabilities_name_unique') {
                      // Skip duplicate capability names
                      console.log(`Skipping duplicate capability: ${insertCapability.name}`);
                      continue;
                    }
                    throw capabilityError;
                  }
                }
                break;
              case 'resources':
                for (const item of records) {
                  const insertResource = insertResourceSchema.parse({
                    name: item.name || item.resourceName || item.equipmentName || item.description || 'Unknown Resource',
                    type: item.type || 'Equipment',
                    description: item.description || item.name || '',
                    status: item.status || 'active'
                  });
                  const resource = await storage.createResource(insertResource);
                  results.push(resource);
                }
                break;
              case 'operations':
                for (const item of records) {
                  // Find a production order to associate this operation with
                  const existingJobs = await storage.getJobs();
                  const randomJob = existingJobs[Math.floor(Math.random() * existingJobs.length)];
                  
                  if (randomJob) {
                    const insertOperation = insertOperationSchema.parse({
                      productionOrderId: randomJob.id,
                      name: item.name || item.operationName || 'Unknown Operation',
                      description: item.description || '',
                      duration: item.duration || 8,
                      requiredCapabilities: item.requiredCapabilities || []
                    });
                    const operation = await storage.createOperation(insertOperation);
                    results.push(operation);
                  }
                }
                break;
              case 'productionOrders':
                // Get all available plants for distribution
                const availablePlants = await storage.getPlants();
                console.log('Available plants for production orders:', availablePlants.map(p => ({ id: p.id, name: p.name })));
                
                if (availablePlants.length === 0) {
                  console.error('No plants available for production orders');
                  break;
                }
                
                for (let i = 0; i < records.length; i++) {
                  const item = records[i];
                  // Distribute production orders across available plants
                  const plantIndex = i % availablePlants.length;
                  const selectedPlant = availablePlants[plantIndex];
                  
                  console.log(`Assigning production order ${i + 1} to plant ${selectedPlant.id} (${selectedPlant.name})`);
                  
                  const insertJob = insertProductionOrderSchema.parse({
                    orderNumber: item.orderNumber || item.orderId || `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    name: item.name || item.orderName || item.product || 'Unknown Order',
                    customer: item.customer || '',
                    priority: item.priority || 'medium',
                    status: 'released',
                    dueDate: item.dueDate ? new Date(item.dueDate) : null,
                    quantity: item.quantity || 1,
                    description: item.description || '',
                    plantId: selectedPlant.id // Use actual plant ID with distribution
                  });
                  try {
                    const job = await storage.createProductionOrder(insertJob);
                    results.push(job);
                  } catch (orderError: any) {
                    if (orderError.constraint === 'production_orders_order_number_key') {
                      // Generate a unique order number and retry
                      const uniqueOrderNumber = `PO-AI-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                      console.log(`Duplicate order number ${insertJob.orderNumber}, retrying with ${uniqueOrderNumber}`);
                      const retryJob = { ...insertJob, orderNumber: uniqueOrderNumber };
                      const job = await storage.createProductionOrder(retryJob);
                      results.push(job);
                    } else {
                      throw orderError;
                    }
                  }
                }
                break;
              case 'vendors':
                for (const item of records) {
                  const insertVendor = insertVendorSchema.parse({
                    vendorNumber: item.vendorNumber || `V${Date.now()}`,
                    vendorName: item.vendorName,
                    vendorType: item.vendorType || 'supplier',
                    contactName: item.contactName || '',
                    contactEmail: item.contactEmail || '',
                    contactPhone: item.contactPhone || '',
                    address: item.address || '',
                    city: item.city || '',
                    state: item.state || '',
                    zipCode: item.zipCode || '',
                    country: item.country || 'US',
                    paymentTerms: item.paymentTerms || 'net30',
                    status: item.status || 'active'
                  });
                  const vendor = await storage.createVendor(insertVendor);
                  results.push(vendor);
                }
                break;
              case 'customers':
                for (const item of records) {
                  const insertCustomer = insertCustomerSchema.parse({
                    customerNumber: item.customerNumber || `C${Date.now()}`,
                    customerName: item.customerName,
                    contactName: item.contactName || '',
                    contactEmail: item.contactEmail || '',
                    contactPhone: item.contactPhone || '',
                    address: item.address || '',
                    city: item.city || '',
                    state: item.state || '',
                    zipCode: item.zipCode || '',
                    country: item.country || 'US',
                    customerTier: item.customerTier || 'standard',
                    status: item.status || 'active'
                  });
                  const customer = await storage.createCustomer(insertCustomer);
                  results.push(customer);
                }
                break;
              default:
                console.log(`Skipping unsupported data type: ${dataType}`);
                continue;
            }
            
            if (results.length > 0) {
              importResults.push({
                type: dataType,
                count: results.length,
                status: 'success'
              });
              totalImported += results.length;
            }
          } catch (importError) {
            console.error(`Error importing ${dataType}:`, importError);
            importResults.push({
              type: dataType,
              count: 0,
              status: 'error',
              error: importError.message
            });
          }
        }
      }

      res.json({
        success: true,
        summary: generatedData.summary,
        totalRecords: totalImported,
        importResults,
        recommendations: generatedData.recommendations || [],
        generatedData: generatedData.dataTypes
      });

    } catch (error) {
      console.error('AI sample data generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate sample data',
        details: error.message 
      });
    }
  });

  // AI-powered master data modification
  app.post('/api/data-import/modify-data', requireAuth, async (req, res) => {
    try {
      const { modificationPrompt } = req.body;
      
      if (!modificationPrompt) {
        return res.status(400).json({ error: 'Missing required field: modificationPrompt' });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Fetch current master data for analysis
      const [plants, resources, capabilities, jobs, operations] = await Promise.all([
        storage.getPlants(),
        storage.getResources(),
        storage.getCapabilities(),
        storage.getJobs(),
        storage.getOperations()
      ]);

      const currentData = {
        plants: plants.slice(0, 20), // Limit for context
        resources: resources.slice(0, 30),
        capabilities: capabilities.slice(0, 25),
        productionOrders: jobs.slice(0, 25),
        operations: operations.slice(0, 40)
      };

      const systemPrompt = `You are an expert manufacturing data analyst. Analyze the current master data and generate specific modifications based on the user's request.

Current Master Data Overview:
- Plants: ${plants.length} total (${plants.map(p => p.name).join(', ')})
- Resources: ${resources.length} total (types: ${[...new Set(resources.map(r => r.type))].join(', ')})
- Capabilities: ${capabilities.length} total (${capabilities.map(c => c.name).join(', ')})
- Production Orders: ${jobs.length} total (statuses: ${[...new Set(jobs.map(j => j.status))].join(', ')})
- Operations: ${operations.length} total

Current Data Sample:
${JSON.stringify(currentData, null, 2)}

Generate ONLY the specific modifications requested, preserving existing data relationships and integrity. Return the result in this exact JSON format:

{
  "modifications": [
    {
      "type": "plants|resources|capabilities|productionOrders|operations",
      "action": "create|update|delete",
      "records": [/* array of records to create/update with complete data */],
      "criteria": {/* for updates/deletes, specify matching criteria */},
      "description": "Human readable description of what was changed"
    }
  ],
  "summary": "Overall summary of all modifications",
  "affectedRecords": 0,
  "preservedData": true
}

Rules:
1. For CREATE: provide complete record data following existing schema
2. For UPDATE: provide partial records with id/criteria and fields to change
3. For DELETE: provide criteria to match records for deletion
4. Preserve all foreign key relationships and dependencies
5. Use realistic manufacturing data that fits the existing context
6. Be specific about quantities, priorities, statuses, and other business-relevant fields`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: modificationPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 3000
      });

      const modificationPlan = JSON.parse(response.choices[0].message.content);
      
      // Execute the modifications
      const modificationResults = [];
      let totalModified = 0;

      for (const modification of modificationPlan.modifications) {
        try {
          let results = [];
          
          switch (modification.type) {
            case 'plants':
              if (modification.action === 'create') {
                for (const record of modification.records) {
                  const insertPlant = insertPlantSchema.parse({
                    name: record.name,
                    location: record.location || '',
                    address: record.address || record.location || '',
                    timezone: record.timezone || 'UTC'
                  });
                  const plant = await storage.createPlant(insertPlant);
                  results.push(plant);
                }
              } else if (modification.action === 'update') {
                // Implementation for plant updates would go here
                console.log('Plant updates not yet implemented');
              }
              break;

            case 'resources':
              if (modification.action === 'create') {
                for (const record of modification.records) {
                  const insertResource = insertResourceSchema.parse({
                    name: record.name,
                    type: record.type || 'Equipment',
                    description: record.description || '',
                    status: record.status || 'active'
                  });
                  const resource = await storage.createResource(insertResource);
                  results.push(resource);
                }
              }
              break;

            case 'capabilities':
              if (modification.action === 'create') {
                for (const record of modification.records) {
                  const insertCapability = insertCapabilitySchema.parse({
                    name: record.name,
                    description: record.description || '',
                    category: record.category || 'manufacturing'
                  });
                  try {
                    const capability = await storage.createCapability(insertCapability);
                    results.push(capability);
                  } catch (capabilityError: any) {
                    if (capabilityError.constraint === 'capabilities_name_unique') {
                      console.log(`Skipping duplicate capability: ${insertCapability.name}`);
                      continue;
                    }
                    throw capabilityError;
                  }
                }
              }
              break;

            case 'productionOrders':
              if (modification.action === 'create') {
                for (const record of modification.records) {
                  const insertJob = insertProductionOrderSchema.parse({
                    orderNumber: record.orderNumber || `PO-MOD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    name: record.name,
                    customer: record.customer || '',
                    priority: record.priority || 'medium',
                    status: record.status || 'released',
                    dueDate: record.dueDate ? new Date(record.dueDate) : null,
                    quantity: record.quantity || 1,
                    description: record.description || '',
                    plantId: record.plantId || 1
                  });
                  const job = await storage.createProductionOrder(insertJob);
                  results.push(job);
                }
              } else if (modification.action === 'update') {
                // Update existing production orders based on criteria
                const existingJobs = await storage.getJobs();
                for (const record of modification.records) {
                  const jobsToUpdate = existingJobs.filter(job => {
                    if (modification.criteria?.status && job.status !== modification.criteria.status) return false;
                    if (modification.criteria?.priority && job.priority !== modification.criteria.priority) return false;
                    if (modification.criteria?.customer && job.customer !== modification.criteria.customer) return false;
                    return true;
                  });

                  for (const job of jobsToUpdate) {
                    const updateData: any = { ...job };
                    if (record.priority !== undefined) updateData.priority = record.priority;
                    if (record.status !== undefined) updateData.status = record.status;
                    if (record.quantity !== undefined) updateData.quantity = record.quantity;
                    if (record.dueDate !== undefined) updateData.dueDate = record.dueDate ? new Date(record.dueDate) : null;
                    
                    const updatedJob = await storage.updateProductionOrder(job.id, updateData);
                    results.push(updatedJob);
                  }
                }
              }
              break;

            case 'operations':
              if (modification.action === 'create') {
                for (const record of modification.records) {
                  // Find appropriate production order
                  const existingJobs = await storage.getJobs();
                  const targetJob = record.productionOrderId 
                    ? existingJobs.find(j => j.id === record.productionOrderId)
                    : existingJobs[Math.floor(Math.random() * existingJobs.length)];
                  
                  if (targetJob) {
                    const insertOperation = insertOperationSchema.parse({
                      productionOrderId: targetJob.id,
                      name: record.name,
                      description: record.description || '',
                      duration: record.duration || 8,
                      requiredCapabilities: record.requiredCapabilities || []
                    });
                    const operation = await storage.createOperation(insertOperation);
                    results.push(operation);
                  }
                }
              }
              break;

            default:
              console.log(`Unsupported modification type: ${modification.type}`);
              continue;
          }

          if (results.length > 0) {
            modificationResults.push({
              type: modification.type,
              action: modification.action,
              count: results.length,
              description: modification.description,
              status: 'success'
            });
            totalModified += results.length;
          }
        } catch (modError) {
          console.error(`Error executing modification for ${modification.type}:`, modError);
          modificationResults.push({
            type: modification.type,
            action: modification.action,
            count: 0,
            description: modification.description,
            status: 'error',
            error: modError.message
          });
        }
      }

      res.json({
        success: true,
        summary: modificationPlan.summary || 'Data modifications completed successfully',
        modifiedRecords: totalModified,
        modifiedTypes: [...new Set(modificationResults.map(r => r.type))],
        modifications: modificationResults,
        originalPlan: modificationPlan
      });

    } catch (error) {
      console.error('AI data modification error:', error);
      res.status(500).json({ 
        error: 'Failed to modify data',
        details: error.message 
      });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log("=== LOGIN DEBUG ===");
      console.log("Username:", username);
      console.log("Password length:", password ? password.length : 'undefined');
      console.log("Password:", password); // Temporary for debugging
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserWithRolesAndPermissions(username);
      if (!user) {
        console.log("User not found:", username);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("User found:", user.username, "ID:", user.id);
      console.log("Stored hash:", user.passwordHash);
      console.log("Comparing password:", password);
      
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      console.log("Password comparison result:", isValidPassword);
      
      if (!isValidPassword) {
        console.log("Password verification failed");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is disabled" });
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);
      
      // Generate a simple token and store user ID in session AND return token
      console.log("=== LOGIN SUCCESS ===");
      const token = `user_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      req.session.userId = user.id;
      req.session.token = token;
      
      // Force session save and return token
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        
        console.log("Session saved successfully with token:", token);
        console.log("Session ID:", req.sessionID);
        
        // Return user data with token
        const { passwordHash, ...userData } = user;
        res.json({ ...userData, token });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      console.log("=== AUTH CHECK ===");
      console.log("Session ID:", req.sessionID);
      console.log("Authorization header:", req.headers.authorization);
      console.log("Session userId:", req.session?.userId);
      
      let userId = req.session?.userId;
      let isDemo = req.session?.isDemo;
      
      // Check for token in Authorization header if session fails
      if (!userId && req.headers.authorization) {
        const token = req.headers.authorization.replace('Bearer ', '');
        console.log("Checking token:", token);
        
        // Handle demo tokens
        if (token.startsWith('demo_')) {
          isDemo = true;
          const tokenParts = token.split('_');
          if (tokenParts.length >= 3) {
            userId = tokenParts[1] + '_' + tokenParts[2]; // demo_exec, demo_prod, etc.
            console.log("Demo token userId:", userId);
          }
        }
        // Extract user ID from token (simple format: user_ID_timestamp_random)
        else if (token.startsWith('user_')) {
          const tokenParts = token.split('_');
          if (tokenParts.length >= 2) {
            userId = parseInt(tokenParts[1]);
            console.log("Token userId:", userId);
          }
        }
      }
      
      if (!userId) {
        console.log("No userId found, returning 401");
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Handle demo users
      if (isDemo || (typeof userId === 'string' && userId.startsWith('demo_'))) {
        const demoUsers = {
          'demo_director': { 
            id: 'demo_director', 
            username: 'demo_director', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Director',
            isActive: true,
            isDemo: true,
            role: 'Director',
            activeRole: { id: 'demo_director_role', name: 'Director' },
            permissions: ['business-goals-view', 'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view', 'presentation-system-view'],
            roles: [{ id: 'demo_director_role', name: 'Director' }]
          },
          'demo_plant': { 
            id: 'demo_plant', 
            username: 'demo_plant_manager', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Plant Manager',
            isActive: true,
            isDemo: true,
            role: 'Plant Manager',
            activeRole: { id: 'demo_plant_role', name: 'Plant Manager' },
            permissions: ['plant-manager-view', 'capacity-planning-view', 'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_plant_role', name: 'Plant Manager' }]
          },
          'demo_scheduler': { 
            id: 'demo_scheduler', 
            username: 'demo_scheduler', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Scheduler',
            isActive: true,
            isDemo: true,
            role: 'Production Scheduler',
            activeRole: { id: 'demo_scheduler_role', name: 'Production Scheduler' },
            permissions: ['schedule-view', 'boards-view', 'shop-floor-view', 'analytics-view', 'scheduling-optimizer-view', 'capacity-planning-view', 'business-goals-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_scheduler_role', name: 'Production Scheduler' }]
          },
          'demo_it_admin': { 
            id: 'demo_it_admin', 
            username: 'demo_it_admin', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'IT Admin',
            isActive: true,
            isDemo: true,
            role: 'IT Administrator',
            activeRole: { id: 'demo_it_admin_role', name: 'IT Administrator' },
            permissions: ['systems-management-view', 'role-management-view', 'user-management-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_it_admin_role', name: 'IT Administrator' }]
          },
          'demo_systems': { 
            id: 'demo_systems', 
            username: 'demo_systems_manager', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Systems Manager',
            isActive: true,
            activeRole: { id: 'demo_systems_role', name: 'Systems Manager' },
            permissions: ['systems-management-view', 'role-management-view', 'user-management-view', 'training-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_systems_role', name: 'Systems Manager' }]
          },
          'demo_admin': { 
            id: 'demo_admin', 
            username: 'demo_administrator', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Administrator',
            isActive: true,
            activeRole: { id: 'demo_admin_role', name: 'Administrator' },
            permissions: ['role-management-view', 'user-management-view', 'systems-management-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_admin_role', name: 'Administrator' }]
          },
          'demo_shop_floor': { 
            id: 'demo_shop_floor', 
            username: 'demo_shop_floor', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Shop Floor',
            isActive: true,
            activeRole: { id: 'demo_shop_floor_role', name: 'Shop Floor Operations' },
            permissions: ['shop-floor-view', 'operator-dashboard-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_shop_floor_role', name: 'Shop Floor Operations' }]
          },
          'demo_analyst': { 
            id: 'demo_analyst', 
            username: 'demo_data_analyst', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Data Analyst',
            isActive: true,
            activeRole: { id: 'demo_analyst_role', name: 'Data Analyst' },
            permissions: ['analytics-view', 'reports-view', 'business-goals-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_analyst_role', name: 'Data Analyst' }]
          },
          'demo_trainer': { 
            id: 'demo_trainer', 
            username: 'demo_trainer', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Trainer',
            isActive: true,
            isDemo: true,
            role: 'Trainer',
            activeRole: { id: 'demo_trainer_role', name: 'Trainer' },
            permissions: [
              'training-view', 'role-switching-permissions', 'analytics-view', 'reports-view',
              'schedule-view', 'business-goals-view', 'visual-factory-view', 
              'ai-assistant-view', 'feedback-view'
            ],
            roles: [{ id: 'demo_trainer_role', name: 'Trainer' }]
          },
          'demo_maintenance': { 
            id: 'demo_maintenance', 
            username: 'demo_maintenance', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Maintenance Tech',
            isActive: true,
            activeRole: { id: 'demo_maintenance_role', name: 'Maintenance Technician' },
            permissions: ['maintenance-planning-view', 'shop-floor-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_maintenance_role', name: 'Maintenance Technician' }]
          },
          // Legacy mappings for backward compatibility
          'demo_exec': { 
            id: 'demo_director', 
            username: 'demo_director', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Director',
            isActive: true,
            activeRole: { id: 'demo_director_role', name: 'Director' },
            permissions: ['business-goals-view', 'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_director_role', name: 'Director' }]
          },
          'demo_prod': { 
            id: 'demo_scheduler', 
            username: 'demo_scheduler', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Scheduler',
            isActive: true,
            activeRole: { id: 'demo_scheduler_role', name: 'Production Scheduler' },
            permissions: ['schedule-view', 'boards-view', 'shop-floor-view', 'analytics-view', 'scheduling-optimizer-view', 'capacity-planning-view', 'business-goals-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_scheduler_role', name: 'Production Scheduler' }]
          },
          'demo_it': { 
            id: 'demo_it_admin', 
            username: 'demo_it_admin', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'IT Admin',
            isActive: true,
            activeRole: { id: 'demo_it_admin_role', name: 'IT Administrator' },
            permissions: ['systems-management-view', 'role-management-view', 'user-management-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_it_admin_role', name: 'IT Administrator' }]
          },
          'demo_it_systems': { 
            id: 'demo_it_systems', 
            username: 'demo_it_systems_admin', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'IT Systems Admin',
            isActive: true,
            isDemo: true,
            role: 'IT Systems Administrator',
            activeRole: { id: 'demo_it_systems_role', name: 'IT Systems Administrator' },
            permissions: ['systems-management-view', 'role-management-view', 'user-management-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_it_systems_role', name: 'IT Systems Administrator' }]
          },
          'demo_sales': { 
            id: 'demo_sales', 
            username: 'demo_sales_rep', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Sales Rep',
            isActive: true,
            isDemo: true,
            role: 'Sales Representative',
            activeRole: { id: 'demo_sales_role', name: 'Sales Representative' },
            permissions: ['sales-view', 'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_sales_role', name: 'Sales Representative' }]
          },
          'demo_customer_service': { 
            id: 'demo_customer_service', 
            username: 'demo_customer_service', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Customer Service',
            isActive: true,
            isDemo: true,
            role: 'Customer Service Representative',
            activeRole: { id: 'demo_customer_service_role', name: 'Customer Service Representative' },
            permissions: ['customer-service-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_customer_service_role', name: 'Customer Service Representative' }]
          },
          'demo_support': { 
            id: 'demo_support', 
            username: 'demo_support_engineer', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Support Engineer',
            isActive: true,
            isDemo: true,
            role: 'Support Engineer',
            activeRole: { id: 'demo_support_role', name: 'Support Engineer' },
            permissions: ['help-view', 'systems-management-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_support_role', name: 'Support Engineer' }]
          },
          'demo_supply_chain': { 
            id: 'demo_supply_chain', 
            username: 'demo_supply_chain', 
            email: 'demo@planettogether.com', 
            firstName: 'Demo',
            lastName: 'Supply Chain Planner',
            isActive: true,
            isDemo: true,
            role: 'Supply Chain Planner',
            activeRole: { id: 'demo_supply_chain_role', name: 'Supply Chain Planner' },
            permissions: ['inventory-optimization-view', 'demand-forecasting-view', 'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
            roles: [{ id: 'demo_supply_chain_role', name: 'Supply Chain Planner' }]
          }
        };
        
        const demoUser = demoUsers[userId as keyof typeof demoUsers];
        if (demoUser) {
          console.log("Demo user found, returning demo data");
          return res.json(demoUser);
        }
      }

      const user = await storage.getUserWithRoles(userId);
      if (!user || !user.isActive) {
        console.log("User not found or inactive for userId:", userId);
        return res.status(401).json({ message: "User not found or inactive" });
      }

      console.log("User found, returning user data");
      const { passwordHash, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Plants - Enhanced with error handling
  app.get("/api/plants", requireAuth, createSafeHandler('Get Plants')(async (req, res) => {
    const plants = await storage.getPlants();
    if (!plants) {
      throw new DatabaseError('Failed to retrieve plants from database', {
        operation: 'Get Plants',
        endpoint: '/api/plants',
        userId: req.user?.id
      });
    }
    res.json(plants);
  }));

  app.get("/api/plants/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plant ID" });
      }
      const plant = await storage.getPlant(id);
      if (!plant) {
        return res.status(404).json({ error: "Plant not found" });
      }
      res.json(plant);
    } catch (error) {
      console.error("Error fetching plant:", error);
      res.status(500).json({ error: "Failed to fetch plant" });
    }
  });

  app.post("/api/plants", requireAuth, createSafeHandler('Create Plant')(async (req, res) => {
    const parseResult = insertPlantSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid plant data provided', {
        operation: 'Create Plant',
        endpoint: '/api/plants',
        userId: req.user?.id,
        requestData: req.body,
        additionalInfo: { validationErrors: parseResult.error.issues }
      });
    }
    
    const plant = await storage.createPlant(parseResult.data);
    if (!plant) {
      throw new DatabaseError('Failed to create plant in database', {
        operation: 'Create Plant',
        endpoint: '/api/plants',
        userId: req.user?.id,
        requestData: parseResult.data
      });
    }
    
    res.status(201).json(plant);
  }));

  app.put("/api/plants/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plant ID" });
      }
      const data = insertPlantSchema.partial().parse(req.body);
      const plant = await storage.updatePlant(id, data);
      if (!plant) {
        return res.status(404).json({ error: "Plant not found" });
      }
      res.json(plant);
    } catch (error: any) {
      console.error("Error updating plant:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/plants/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plant ID" });
      }
      const success = await storage.deletePlant(id);
      if (!success) {
        return res.status(404).json({ error: "Plant not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting plant:", error);
      res.status(500).json({ error: "Failed to delete plant" });
    }
  });

  app.get("/api/capabilities", async (req, res) => {
    try {
      const capabilities = await storage.getCapabilities();
      res.json(capabilities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch capabilities" });
    }
  });

  app.post("/api/capabilities", async (req, res) => {
    try {
      const capability = insertCapabilitySchema.parse(req.body);
      const newCapability = await storage.createCapability(capability);
      res.status(201).json(newCapability);
    } catch (error) {
      res.status(400).json({ message: "Invalid capability data" });
    }
  });

  // Resources
  app.get("/api/resources", async (req, res) => {
    try {
      const resources = await storage.getResources();
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  app.get("/api/resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resource = await storage.getResource(id);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.json(resource);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resource" });
    }
  });

  app.post("/api/resources", async (req, res) => {
    try {
      const resource = insertResourceSchema.parse(req.body);
      const newResource = await storage.createResource(resource);
      res.status(201).json(newResource);
    } catch (error) {
      res.status(400).json({ message: "Invalid resource data" });
    }
  });

  app.put("/api/resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resource = insertResourceSchema.partial().parse(req.body);
      const updatedResource = await storage.updateResource(id, resource);
      if (!updatedResource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.json(updatedResource);
    } catch (error) {
      res.status(400).json({ message: "Invalid resource data" });
    }
  });

  app.delete("/api/resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteResource(id);
      if (!deleted) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete resource" });
    }
  });

  // Update resource photo endpoint
  app.put("/api/resources/:id/photo", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { photo } = req.body;
      
      if (!photo) {
        return res.status(400).json({ message: "Photo data is required" });
      }
      
      const updatedResource = await storage.updateResource(id, { photo });
      if (!updatedResource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.json(updatedResource);
    } catch (error) {
      res.status(500).json({ message: "Failed to update resource photo" });
    }
  });

  // Production Orders (formerly Jobs) - Enhanced with error handling
  app.get("/api/production-orders", createSafeHandler('Get Production Orders')(async (req, res) => {
    const productionOrders = await storage.getProductionOrders();
    if (!productionOrders) {
      throw new DatabaseError('Failed to retrieve production orders from database', {
        operation: 'Get Production Orders',
        endpoint: '/api/production-orders',
        userId: req.user?.id
      });
    }
    res.json(productionOrders);
  }));

  // Keep old /api/jobs endpoint for backward compatibility
  app.get("/api/jobs", createSafeHandler('Get Jobs (Legacy)')(async (req, res) => {
    const productionOrders = await storage.getProductionOrders();
    if (!productionOrders) {
      throw new DatabaseError('Failed to retrieve production orders from database', {
        operation: 'Get Jobs (Legacy)',
        endpoint: '/api/jobs',
        userId: req.user?.id
      });
    }
    res.json(productionOrders);
  }));

  app.get("/api/production-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productionOrder = await storage.getProductionOrder(id);
      if (!productionOrder) {
        return res.status(404).json({ message: "Production order not found" });
      }
      res.json(productionOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch production order" });
    }
  });

  // Keep old /api/jobs/:id endpoint for backward compatibility
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productionOrder = await storage.getProductionOrder(id);
      if (!productionOrder) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(productionOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post("/api/production-orders", createSafeHandler('Create Production Order')(async (req, res) => {
    const parseResult = insertProductionOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid production order data provided', {
        operation: 'Create Production Order',
        endpoint: '/api/production-orders',
        userId: req.user?.id,
        requestData: req.body,
        additionalInfo: { validationErrors: parseResult.error.issues }
      });
    }
    
    const newProductionOrder = await storage.createProductionOrder(parseResult.data);
    if (!newProductionOrder) {
      throw new DatabaseError('Failed to create production order in database', {
        operation: 'Create Production Order',
        endpoint: '/api/production-orders',
        userId: req.user?.id,
        requestData: parseResult.data
      });
    }
    
    res.status(201).json(newProductionOrder);
  }));

  // Keep old /api/jobs endpoint for backward compatibility
  app.post("/api/jobs", createSafeHandler('Create Job (Legacy)')(async (req, res) => {
    const parseResult = insertProductionOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid job data provided', {
        operation: 'Create Job (Legacy)',
        endpoint: '/api/jobs',
        userId: req.user?.id,
        requestData: req.body,
        additionalInfo: { validationErrors: parseResult.error.issues }
      });
    }
    
    const newProductionOrder = await storage.createProductionOrder(parseResult.data);
    if (!newProductionOrder) {
      throw new DatabaseError('Failed to create job in database', {
        operation: 'Create Job (Legacy)',
        endpoint: '/api/jobs',
        userId: req.user?.id,
        requestData: parseResult.data
      });
    }
    
    res.status(201).json(newProductionOrder);
  }));

  app.put("/api/production-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productionOrder = insertProductionOrderSchema.partial().parse(req.body);
      const updatedProductionOrder = await storage.updateProductionOrder(id, productionOrder);
      if (!updatedProductionOrder) {
        return res.status(404).json({ message: "Production order not found" });
      }
      res.json(updatedProductionOrder);
    } catch (error) {
      res.status(400).json({ message: "Invalid production order data" });
    }
  });

  // Keep old /api/jobs/:id endpoint for backward compatibility
  app.put("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productionOrder = insertProductionOrderSchema.partial().parse(req.body);
      const updatedProductionOrder = await storage.updateProductionOrder(id, productionOrder);
      if (!updatedProductionOrder) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(updatedProductionOrder);
    } catch (error) {
      res.status(400).json({ message: "Invalid job data" });
    }
  });

  app.delete("/api/production-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProductionOrder(id);
      if (!deleted) {
        return res.status(404).json({ message: "Production order not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete production order" });
    }
  });

  // Keep old /api/jobs/:id endpoint for backward compatibility
  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProductionOrder(id);
      if (!deleted) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Operations
  app.get("/api/operations", async (req, res) => {
    try {
      const operations = await storage.getOperations();
      res.json(operations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch operations" });
    }
  });

  app.get("/api/production-orders/:productionOrderId/operations", async (req, res) => {
    try {
      const productionOrderId = parseInt(req.params.productionOrderId);
      const operations = await storage.getOperationsByProductionOrderId(productionOrderId);
      res.json(operations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch operations" });
    }
  });

  // Keep old /api/jobs/:jobId/operations endpoint for backward compatibility
  app.get("/api/jobs/:jobId/operations", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const operations = await storage.getOperationsByProductionOrderId(jobId);
      res.json(operations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch operations" });
    }
  });

  app.get("/api/operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const operation = await storage.getOperation(id);
      if (!operation) {
        return res.status(404).json({ message: "Operation not found" });
      }
      res.json(operation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch operation" });
    }
  });

  app.post("/api/operations", async (req, res) => {
    try {
      const operation = insertOperationSchema.parse(req.body);
      const newOperation = await storage.createOperation(operation);
      res.status(201).json(newOperation);
    } catch (error) {
      res.status(400).json({ message: "Invalid operation data" });
    }
  });

  app.put("/api/operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Handle the date conversion before validation
      const requestData = { ...req.body };
      
      if (requestData.startTime && typeof requestData.startTime === 'string') {
        requestData.startTime = new Date(requestData.startTime);
      }
      if (requestData.endTime && typeof requestData.endTime === 'string') {
        requestData.endTime = new Date(requestData.endTime);
      }
      
      const operation = insertOperationSchema.partial().parse(requestData);
      const updatedOperation = await storage.updateOperation(id, operation);
      if (!updatedOperation) {
        return res.status(404).json({ message: "Operation not found" });
      }
      res.json(updatedOperation);
    } catch (error: any) {
      console.error('Operation update error:', error);
      if (error.issues) {
        console.error('Validation errors:', error.issues);
        res.status(400).json({ message: "Invalid operation data", errors: error.issues });
      } else {
        res.status(400).json({ message: "Invalid operation data", error: error.message });
      }
    }
  });

  app.delete("/api/operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteOperation(id);
      if (!deleted) {
        return res.status(404).json({ message: "Operation not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete operation" });
    }
  });

  // Optimization flags for operations
  app.patch("/api/operations/:id/optimization-flags", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const flags = req.body;
      
      // Validate the optimization flags
      const validFlags = {
        isBottleneck: typeof flags.isBottleneck === 'boolean' ? flags.isBottleneck : undefined,
        isEarly: typeof flags.isEarly === 'boolean' ? flags.isEarly : undefined,
        isLate: typeof flags.isLate === 'boolean' ? flags.isLate : undefined,
        timeVarianceHours: typeof flags.timeVarianceHours === 'number' ? flags.timeVarianceHours : undefined,
        criticality: typeof flags.criticality === 'string' ? flags.criticality : undefined,
        optimizationNotes: typeof flags.optimizationNotes === 'string' ? flags.optimizationNotes : undefined,
      };

      // Remove undefined values
      Object.keys(validFlags).forEach(key => 
        validFlags[key as keyof typeof validFlags] === undefined && delete validFlags[key as keyof typeof validFlags]
      );

      const updatedOperation = await storage.updateOperationOptimizationFlags(id, validFlags);
      if (!updatedOperation) {
        return res.status(404).json({ message: "Operation not found" });
      }
      res.json(updatedOperation);
    } catch (error: any) {
      console.error('Optimization flags update error:', error);
      res.status(400).json({ message: "Invalid optimization flags data", error: error.message });
    }
  });

  // Dependencies
  app.get("/api/dependencies", async (req, res) => {
    try {
      const dependencies = await storage.getDependencies();
      res.json(dependencies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dependencies" });
    }
  });

  app.get("/api/operations/:operationId/dependencies", async (req, res) => {
    try {
      const operationId = parseInt(req.params.operationId);
      const dependencies = await storage.getDependenciesByOperationId(operationId);
      res.json(dependencies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dependencies" });
    }
  });

  app.post("/api/dependencies", async (req, res) => {
    try {
      const dependency = insertDependencySchema.parse(req.body);
      const newDependency = await storage.createDependency(dependency);
      res.status(201).json(newDependency);
    } catch (error) {
      res.status(400).json({ message: "Invalid dependency data" });
    }
  });

  app.delete("/api/dependencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDependency(id);
      if (!deleted) {
        return res.status(404).json({ message: "Dependency not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete dependency" });
    }
  });

  // Resource Views
  app.get("/api/resource-views", async (req, res) => {
    try {
      const resourceViews = await storage.getResourceViews();
      res.json(resourceViews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resource views" });
    }
  });

  app.get("/api/resource-views/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resourceView = await storage.getResourceView(id);
      if (!resourceView) {
        return res.status(404).json({ message: "Resource view not found" });
      }
      res.json(resourceView);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resource view" });
    }
  });

  app.post("/api/resource-views", async (req, res) => {
    try {
      const resourceView = insertResourceViewSchema.parse(req.body);
      const newResourceView = await storage.createResourceView(resourceView);
      res.status(201).json(newResourceView);
    } catch (error) {
      res.status(400).json({ message: "Invalid resource view data" });
    }
  });

  app.put("/api/resource-views/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resourceView = insertResourceViewSchema.partial().parse(req.body);
      const updatedResourceView = await storage.updateResourceView(id, resourceView);
      if (!updatedResourceView) {
        return res.status(404).json({ message: "Resource view not found" });
      }
      res.json(updatedResourceView);
    } catch (error) {
      res.status(400).json({ message: "Invalid resource view data" });
    }
  });

  app.delete("/api/resource-views/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteResourceView(id);
      if (!deleted) {
        return res.status(404).json({ message: "Resource view not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete resource view" });
    }
  });

  app.get("/api/resource-views/default", async (req, res) => {
    try {
      const defaultView = await storage.getDefaultResourceView();
      if (!defaultView) {
        return res.status(404).json({ message: "No default resource view found" });
      }
      res.json(defaultView);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch default resource view" });
    }
  });

  app.post("/api/resource-views/:id/set-default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.setDefaultResourceView(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to set default resource view" });
    }
  });

  // Metrics endpoint
  app.get("/api/metrics", async (req, res) => {
    try {
      const jobs = await storage.getJobs();
      const operations = await storage.getOperations();
      const resources = await storage.getResources();

      const activeJobs = jobs.filter(job => job.status === "active").length;
      const overdueOperations = operations.filter(op => 
        op.endTime && new Date(op.endTime) < new Date() && op.status !== "completed"
      ).length;

      // Calculate resource utilization
      const assignedOperations = operations.filter(op => op.assignedResourceId).length;
      const totalOperations = operations.length;
      const utilization = totalOperations > 0 ? Math.round((assignedOperations / totalOperations) * 100) : 0;

      // Calculate average lead time
      const completedOperations = operations.filter(op => op.status === "completed");
      const avgLeadTime = completedOperations.length > 0 
        ? completedOperations.reduce((sum, op) => sum + (op.duration || 0), 0) / completedOperations.length / 24
        : 0;

      const metrics = {
        activeJobs,
        utilization,
        overdueOperations,
        avgLeadTime: parseFloat(avgLeadTime.toFixed(1))
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate metrics" });
    }
  });

  // AI Integration Setup
  app.post("/api/ai/create-integration", async (req, res) => {
    try {
      const { description, systemType, requirements, dataMapping } = req.body;
      
      if (!description || !systemType) {
        return res.status(400).json({ message: "Description and system type are required" });
      }
      
      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const prompt = `Create a systems integration configuration for the following requirements:
      
System Type: ${systemType}
Description: ${description}
Requirements: ${requirements?.join(', ') || 'None specified'}

Generate a realistic integration configuration including:
1. Connection settings (endpoint, authentication method)
2. Data mapping configuration
3. Sync frequency and settings
4. Error handling and retry policies
5. Security settings

Provide the response as a JSON object with the following structure:
{
  "name": "Integration Name",
  "endpoint": "https://api.example.com/v1",
  "authentication": "OAuth 2.0 / API Key / Basic Auth",
  "syncFrequency": "Every X minutes/hours",
  "dataTypes": ["Orders", "Inventory", "etc"],
  "configuration": {
    "retryPolicy": "Exponential backoff",
    "timeout": "30 seconds",
    "batchSize": 1000
  },
  "dataMapping": {
    "sourceFields": ["field1", "field2"],
    "targetFields": ["targetField1", "targetField2"]
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert systems integration engineer. Create realistic, production-ready integration configurations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });

      const integrationConfig = JSON.parse(response.choices[0].message.content);
      
      // Add metadata
      integrationConfig.systemType = systemType;
      integrationConfig.status = 'configured';
      integrationConfig.createdAt = new Date().toISOString();
      
      res.json({
        success: true,
        message: `Successfully configured ${systemType} integration`,
        integration: integrationConfig,
        systemType
      });
      
    } catch (error) {
      console.error("AI Integration setup error:", error);
      
      const errorMessage = error.message || "Unknown error";
      const isQuotaError = errorMessage.includes('quota') || 
                          errorMessage.includes('limit') || 
                          errorMessage.includes('exceeded') ||
                          errorMessage.includes('insufficient_quota') ||
                          errorMessage.includes('rate_limit');
      
      if (isQuotaError) {
        res.status(429).json({ 
          message: "OpenAI quota exceeded",
          error: errorMessage,
          quotaExceeded: true
        });
      } else {
        res.status(500).json({ 
          message: "Failed to create AI integration",
          error: errorMessage
        });
      }
    }
  });

  // AI Agent routes
  const upload = multer();

  // AI Chat Assistant Route
  // AI Agent Text-to-Speech endpoint
  app.post("/api/ai-agent/tts", requireAuth, async (req, res) => {
    try {
      const { text, voice = 'alloy' } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const openai = await import('openai');
      const client = new openai.default({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await client.audio.speech.create({
        model: 'tts-1',
        voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
        input: text,
        speed: 1.0
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      
      // Return audio as base64 data URL for immediate playback
      const audioBase64 = buffer.toString('base64');
      const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
      
      res.json({ audioUrl });
    } catch (error) {
      console.error('TTS Error:', error);
      res.status(500).json({ error: 'Failed to generate speech' });
    }
  });

  // AI Agent Speech-to-Text (Whisper) endpoint
  app.post("/api/ai-agent/transcribe", requireAuth, upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        console.error('No audio file provided');
        return res.status(400).json({ error: 'Audio file is required', success: false });
      }

      console.log('Audio file received:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.buffer.length
      });

      // Check file size
      if (req.file.buffer.length < 1000) {
        console.error('Audio file too small:', req.file.buffer.length, 'bytes');
        return res.status(400).json({ error: 'Audio file too small', success: false });
      }

      const openai = await import('openai');
      const client = new openai.default({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Determine appropriate filename based on MIME type
      let filename = 'audio.webm';
      if (req.file.mimetype) {
        if (req.file.mimetype.includes('mp4')) filename = 'audio.mp4';
        else if (req.file.mimetype.includes('wav')) filename = 'audio.wav';
        else if (req.file.mimetype.includes('ogg')) filename = 'audio.ogg';
        else if (req.file.mimetype.includes('webm')) filename = 'audio.webm';
      }

      console.log('Creating File object with filename:', filename, 'mimetype:', req.file.mimetype);

      // Create a file-like object for OpenAI Whisper
      const audioFile = new File([req.file.buffer], filename, {
        type: req.file.mimetype || 'audio/webm'
      });

      console.log('Sending to Whisper API...');
      const transcription = await client.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
        response_format: 'json'
      });

      console.log('Whisper transcription successful:', transcription.text);
      res.json({ 
        text: transcription.text,
        success: true 
      });
    } catch (error) {
      console.error('Whisper transcription error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to transcribe audio',
        success: false 
      });
    }
  });

  // AI Agent Memory Management endpoints
  app.get("/api/ai-agent/memory", requireAuth, async (req, res) => {
    try {
      // Get stored memory and training data for the current user
      const memories = await storage.getAIMemories(req.user?.id || 'demo');
      const training = await storage.getAITrainingData(req.user?.id || 'demo');
      
      res.json({ memories, training });
    } catch (error) {
      console.error('Memory fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch memory data' });
    }
  });

  app.delete("/api/ai-agent/memory/:entryId", requireAuth, async (req, res) => {
    try {
      const { entryId } = req.params;
      await storage.deleteAIMemory(entryId, req.user?.id || 'demo');
      res.json({ success: true });
    } catch (error) {
      console.error('Memory delete error:', error);
      res.status(500).json({ error: 'Failed to delete memory entry' });
    }
  });

  app.put("/api/ai-agent/training/:entryId", requireAuth, async (req, res) => {
    try {
      const { entryId } = req.params;
      const { content } = req.body;
      await storage.updateAITraining(entryId, content, req.user?.id || 'demo');
      res.json({ success: true });
    } catch (error) {
      console.error('Training update error:', error);
      res.status(500).json({ error: 'Failed to update training data' });
    }
  });

  // Clear all AI memories
  app.post("/api/ai-agent/memory/clear", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id || 'demo';
      await storage.clearAllAIMemories(userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Memory clear error:', error);
      res.status(500).json({ error: 'Failed to clear memories' });
    }
  });

  // Helper function to generate default canvas content
  function generateDefaultCanvasContent(message: string): any {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('dashboard')) {
      return {
        type: 'create',
        items: [{
          id: `dashboard_${Date.now()}`,
          type: 'dashboard',
          title: 'Production Dashboard',
          content: {
            activeJobs: 12,
            efficiency: 94,
            pending: 8,
            issues: 2
          }
        }]
      };
    } else if (lowerMessage.includes('chart')) {
      return {
        type: 'create',
        items: [{
          id: `chart_${Date.now()}`,
          type: 'chart',
          title: 'Production Metrics Chart',
          content: {
            title: 'Weekly Production Trends',
            data: [85, 90, 88, 92, 89, 94, 91]
          }
        }]
      };
    } else if (lowerMessage.includes('table')) {
      return {
        type: 'create',
        items: [{
          id: `table_${Date.now()}`,
          type: 'table',
          title: 'Jobs Overview',
          content: {
            title: 'Current Production Jobs',
            rows: [
              { id: 1, name: 'Job #1234', status: 'In Progress', progress: 75 },
              { id: 2, name: 'Job #1235', status: 'Completed', progress: 100 },
              { id: 3, name: 'Job #1236', status: 'Pending', progress: 0 }
            ]
          }
        }]
      };
    } else {
      return {
        type: 'create',
        items: [{
          id: `interactive_${Date.now()}`,
          type: 'interactive',
          title: 'Interactive Widget',
          content: {
            title: 'Production Controls',
            sections: ['overview', 'details', 'actions']
          }
        }]
      };
    }
  }

  app.post("/api/ai-agent/chat", requireAuth, async (req, res) => {
    try {
      const { message, context, conversationHistory } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Use the enhanced AI agent system that properly handles canvas actions
      const agentResponse = await processAICommand(message, []);

      // Store this interaction in memory for learning
      await storage.storeAIMemory({
        userId: req.user?.id || 'demo',
        type: 'conversation',
        content: `User asked: "${message}" - Context: ${context?.page || 'unknown page'}`,
        timestamp: new Date().toISOString(),
        metadata: { page: context?.page, userRole: context?.user }
      });

      // Update training data based on user patterns
      await storage.updateAITrainingPattern({
        userId: req.user?.id || 'demo',
        category: 'workflow_pattern',
        pattern: `Frequently uses ${context?.page || 'unknown'} page for ${message.toLowerCase().includes('help') ? 'assistance' : 'operations'}`,
        confidence: 75,
        lastSeen: new Date().toISOString()
      });

      // Generate contextual insights based on the conversation
      const insights = await generateContextualInsights(context, message, agentResponse.message);

      res.json({ 
        message: agentResponse.message,
        canvasAction: agentResponse.canvasAction,
        data: agentResponse.data,
        actions: agentResponse.actions,
        insights,
        context: {
          page: context?.page,
          timestamp: new Date().toISOString(),
          confidence: 0.85
        }
      });

    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ 
        error: "Failed to process AI chat request",
        response: "I'm experiencing some technical difficulties. Please try again in a moment."
      });
    }
  });

  const generateContextualInsights = async (context: any, userMessage: string, aiResponse: string) => {
    const insights = [];
    
    // Generate insights based on page context
    switch (context?.page) {
      case '/':
        if (userMessage.toLowerCase().includes('efficiency') || userMessage.toLowerCase().includes('performance')) {
          insights.push({
            type: 'optimization',
            title: 'Performance Analysis',
            message: 'I can analyze your dashboard metrics to identify efficiency bottlenecks.',
            confidence: 0.9,
            actionable: true
          });
        }
        break;
      case '/analytics':
        insights.push({
          type: 'learning',
          title: 'Data Patterns',
          message: 'I notice patterns in your analytics data that could inform better scheduling decisions.',
          confidence: 0.8,
          actionable: true
        });
        break;
      case '/scheduling-optimizer':
        insights.push({
          type: 'suggestion',
          title: 'Scheduling Insights',
          message: 'Based on your current schedule, I can suggest 3 optimizations to reduce lead times.',
          confidence: 0.85,
          actionable: true
        });
        break;
    }

    return insights;
  };

  app.post("/api/ai-agent/command", requireAuth, async (req, res) => {
    try {
      const { command, attachments } = req.body;
      if (!command || typeof command !== "string") {
        return res.status(400).json({ message: "Command is required" });
      }
      
      const response = await processAICommand(command, attachments);
      res.json(response);
    } catch (error) {
      console.error("AI Agent command error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process AI command" 
      });
    }
  });

  // Enhanced AI collaborative algorithm development endpoint
  app.post('/api/ai-agent/collaborative-algorithm-development', requireAuth, async (req, res) => {
    try {
      const { message, sessionMessages, currentDraft, step } = req.body;

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Build comprehensive context for AI collaboration
      const systemPrompt = `You are an expert AI optimization algorithm development assistant. Your role is to collaboratively work with users to develop sophisticated manufacturing optimization algorithms through a structured 5-step process:

**Step 1: Problem Definition** - Understand the specific optimization challenge
**Step 2: Objective Clarification** - Define what metrics to optimize for
**Step 3: Constraint Analysis** - Identify limitations and requirements 
**Step 4: Algorithm Design** - Create the optimization logic and parameters
**Step 5: Testing Strategy** - Plan validation and performance testing

Current Step: ${step}/5

CONVERSATION GUIDELINES:
- Ask detailed, probing questions to understand requirements
- Be conversational and encouraging, but professional
- Guide the user through each step methodically
- Build upon previous responses in the conversation
- When moving to a new step, clearly indicate the transition
- Create algorithm drafts progressively as information is gathered
- Suggest specific optimization approaches based on the problem type

CURRENT CONTEXT:
${currentDraft ? `Current Algorithm Draft: ${JSON.stringify(currentDraft, null, 2)}` : 'No draft created yet'}

Previous conversation:
${sessionMessages.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

RESPONSE FORMAT:
Respond naturally in conversation, then include a JSON object at the end with:
{
  "nextStep": number (1-5, current step or next step),
  "algorithmDraft": { object with current algorithm being developed },
  "readyToFinalize": boolean (true when all 5 steps complete)
}

Manufacturing Context Available:
- Production scheduling algorithms
- Resource allocation optimization  
- Inventory management optimization
- Quality control optimization
- Capacity planning algorithms
- Setup time minimization
- Throughput maximization
- Cost optimization strategies`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const aiResponse = response.choices[0].message.content;
      
      // Try to extract JSON from response
      let responseData = {
        response: aiResponse,
        nextStep: step,
        algorithmDraft: currentDraft,
        readyToFinalize: false
      };

      try {
        // Look for JSON in the response
        const jsonMatch = aiResponse?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[0]);
          const textResponse = aiResponse?.replace(jsonMatch[0], '').trim();
          
          responseData = {
            response: textResponse || aiResponse || "",
            nextStep: jsonData.nextStep || step,
            algorithmDraft: jsonData.algorithmDraft || currentDraft,
            readyToFinalize: jsonData.readyToFinalize || false
          };
        }
      } catch (parseError) {
        console.log('No JSON found in AI response, using text only');
      }

      res.json(responseData);

    } catch (error) {
      console.error('AI collaboration error:', error);
      res.status(500).json({ error: 'Failed to process AI collaboration request', details: error.message });
    }
  });

  app.post("/api/ai-agent/voice", requireAuth, upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Audio file is required" });
      }
      
      const transcribedText = await transcribeAudio(req.file.buffer);
      res.json({ text: transcribedText });
    } catch (error) {
      console.error("Voice transcription error:", error);
      res.status(500).json({ 
        message: "Failed to transcribe audio" 
      });
    }
  });

  app.post("/api/ai-agent/upload-attachment", requireAuth, upload.single("attachment"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Attachment file is required" });
      }

      const attachment = {
        id: Date.now().toString(),
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        content: req.file.buffer.toString('base64')
      };

      res.json({ attachment });
    } catch (error) {
      console.error("Attachment upload error:", error);
      res.status(500).json({ 
        message: "Failed to upload attachment" 
      });
    }
  });

  // AI Image Generation
  app.post("/api/ai/generate-image", async (req, res) => {
    try {
      const { prompt, resourceId } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural", // DALL-E 3 doesn't have a "cartoon" style, but we can use prompt engineering
      });
      
      const imageUrl = response.data[0].url;
      
      // Fetch the image and convert to base64 to avoid CORS issues
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;
      
      res.json({ imageUrl: base64Image, resourceId });
    } catch (error) {
      console.error("AI Image generation error:", error);
      
      // Check if this is a quota/rate limit error
      const errorMessage = error.message || "Unknown error";
      const isQuotaError = errorMessage.includes('quota') || 
                          errorMessage.includes('limit') || 
                          errorMessage.includes('exceeded') ||
                          errorMessage.includes('insufficient_quota') ||
                          errorMessage.includes('rate_limit');
      
      if (isQuotaError) {
        res.status(429).json({ 
          message: "Quota exceeded",
          error: errorMessage,
          quotaExceeded: true
        });
      } else {
        res.status(500).json({ 
          message: "Failed to generate image",
          error: errorMessage
        });
      }
    }
  });

  // Custom Text Labels
  app.get("/api/custom-text-labels", async (req, res) => {
    try {
      const customTextLabels = await storage.getCustomTextLabels();
      res.json(customTextLabels);
    } catch (error) {
      console.error("Error fetching custom text labels:", error);
      res.status(500).json({ error: "Failed to fetch custom text labels" });
    }
  });

  app.post("/api/custom-text-labels", async (req, res) => {
    try {
      const validation = insertCustomTextLabelSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid custom text label data", details: validation.error.errors });
      }

      const customTextLabel = await storage.createCustomTextLabel(validation.data);
      res.status(201).json(customTextLabel);
    } catch (error) {
      console.error("Error creating custom text label:", error);
      res.status(500).json({ error: "Failed to create custom text label" });
    }
  });

  app.put("/api/custom-text-labels/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid custom text label ID" });
      }

      const validation = insertCustomTextLabelSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid custom text label data", details: validation.error.errors });
      }

      const customTextLabel = await storage.updateCustomTextLabel(id, validation.data);
      if (!customTextLabel) {
        return res.status(404).json({ error: "Custom text label not found" });
      }
      res.json(customTextLabel);
    } catch (error) {
      console.error("Error updating custom text label:", error);
      res.status(500).json({ error: "Failed to update custom text label" });
    }
  });

  app.delete("/api/custom-text-labels/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid custom text label ID" });
      }

      const success = await storage.deleteCustomTextLabel(id);
      if (!success) {
        return res.status(404).json({ error: "Custom text label not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting custom text label:", error);
      res.status(500).json({ error: "Failed to delete custom text label" });
    }
  });

  // Kanban Configurations
  app.get("/api/kanban-configs", async (req, res) => {
    try {
      const kanbanConfigs = await storage.getKanbanConfigs();
      res.json(kanbanConfigs);
    } catch (error) {
      console.error("Error fetching kanban configs:", error);
      res.status(500).json({ error: "Failed to fetch kanban configs" });
    }
  });

  app.post("/api/kanban-configs", async (req, res) => {
    try {
      const validation = insertKanbanConfigSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid kanban config data", details: validation.error.errors });
      }

      const kanbanConfig = await storage.createKanbanConfig(validation.data);
      res.status(201).json(kanbanConfig);
    } catch (error) {
      console.error("Error creating kanban config:", error);
      res.status(500).json({ error: "Failed to create kanban config" });
    }
  });

  app.put("/api/kanban-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid kanban config ID" });
      }

      const validation = insertKanbanConfigSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid kanban config data", details: validation.error.errors });
      }

      const kanbanConfig = await storage.updateKanbanConfig(id, validation.data);
      if (!kanbanConfig) {
        return res.status(404).json({ error: "Kanban config not found" });
      }
      res.json(kanbanConfig);
    } catch (error) {
      console.error("Error updating kanban config:", error);
      res.status(500).json({ error: "Failed to update kanban config" });
    }
  });

  app.delete("/api/kanban-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid kanban config ID" });
      }

      const kanbanConfig = await storage.deleteKanbanConfig(id);
      if (!kanbanConfig) {
        return res.status(404).json({ error: "Kanban config not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting kanban config:", error);
      res.status(500).json({ error: "Failed to delete kanban config" });
    }
  });

  app.post("/api/kanban-configs/:id/set-default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid kanban config ID" });
      }

      await storage.setDefaultKanbanConfig(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default kanban config:", error);
      res.status(500).json({ error: "Failed to set default kanban config" });
    }
  });

  // Report Configurations
  app.get("/api/report-configs", async (req, res) => {
    try {
      const configs = await storage.getReportConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching report configs:", error);
      res.status(500).json({ error: "Failed to fetch report configs" });
    }
  });

  app.get("/api/report-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid report config ID" });
      }

      const config = await storage.getReportConfig(id);
      if (!config) {
        return res.status(404).json({ error: "Report config not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error fetching report config:", error);
      res.status(500).json({ error: "Failed to fetch report config" });
    }
  });

  app.post("/api/report-configs", async (req, res) => {
    try {
      const config = insertReportConfigSchema.parse(req.body);
      const newConfig = await storage.createReportConfig(config);
      res.status(201).json(newConfig);
    } catch (error) {
      console.error("Error creating report config:", error);
      res.status(400).json({ error: "Invalid report config data" });
    }
  });

  app.put("/api/report-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid report config ID" });
      }

      const updateData = insertReportConfigSchema.partial().parse(req.body);
      const updatedConfig = await storage.updateReportConfig(id, updateData);
      if (!updatedConfig) {
        return res.status(404).json({ error: "Report config not found" });
      }
      res.json(updatedConfig);
    } catch (error) {
      console.error("Error updating report config:", error);
      res.status(400).json({ error: "Invalid report config data" });
    }
  });

  app.delete("/api/report-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid report config ID" });
      }

      const deleted = await storage.deleteReportConfig(id);
      if (!deleted) {
        return res.status(404).json({ error: "Report config not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting report config:", error);
      res.status(500).json({ error: "Failed to delete report config" });
    }
  });

  app.post("/api/report-configs/:id/set-default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid report config ID" });
      }

      await storage.setDefaultReportConfig(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default report config:", error);
      res.status(500).json({ error: "Failed to set default report config" });
    }
  });

  // Dashboard Configurations
  app.get("/api/dashboard-configs", async (req, res) => {
    try {
      const dashboards = await storage.getDashboardConfigs();
      res.json(dashboards);
    } catch (error) {
      console.error("Error fetching dashboard configs:", error);
      res.status(500).json({ error: "Failed to fetch dashboard configs" });
    }
  });

  app.get("/api/dashboard-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid dashboard config ID" });
      }

      const dashboard = await storage.getDashboardConfig(id);
      if (!dashboard) {
        return res.status(404).json({ error: "Dashboard config not found" });
      }
      res.json(dashboard);
    } catch (error) {
      console.error("Error fetching dashboard config:", error);
      res.status(500).json({ error: "Failed to fetch dashboard config" });
    }
  });

  app.post("/api/dashboard-configs", async (req, res) => {
    try {
      const dashboardData = insertDashboardConfigSchema.parse(req.body);
      const newDashboard = await storage.createDashboardConfig(dashboardData);
      res.status(201).json(newDashboard);
    } catch (error) {
      console.error("Error creating dashboard config:", error);
      res.status(400).json({ error: "Invalid dashboard config data" });
    }
  });

  app.put("/api/dashboard-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid dashboard config ID" });
      }

      const updateData = insertDashboardConfigSchema.partial().parse(req.body);
      const updatedDashboard = await storage.updateDashboardConfig(id, updateData);
      if (!updatedDashboard) {
        return res.status(404).json({ error: "Dashboard config not found" });
      }
      res.json(updatedDashboard);
    } catch (error) {
      console.error("Error updating dashboard config:", error);
      res.status(400).json({ error: "Invalid dashboard config data" });
    }
  });

  app.delete("/api/dashboard-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid dashboard config ID" });
      }

      const deleted = await storage.deleteDashboardConfig(id);
      if (!deleted) {
        return res.status(404).json({ error: "Dashboard config not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting dashboard config:", error);
      res.status(500).json({ error: "Failed to delete dashboard config" });
    }
  });

  app.post("/api/dashboard-configs/:id/set-default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid dashboard config ID" });
      }

      await storage.setDefaultDashboardConfig(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default dashboard config:", error);
      res.status(500).json({ error: "Failed to set default dashboard config" });
    }
  });

  // Feedback Management Routes
  app.get("/api/feedback", async (req, res) => {
    try {
      const feedback = await storage.getFeedback();
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  app.get("/api/feedback/stats", async (req, res) => {
    try {
      const stats = await storage.getFeedbackStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching feedback stats:", error);
      res.status(500).json({ error: "Failed to fetch feedback stats" });
    }
  });

  app.get("/api/feedback/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }
      
      const feedback = await storage.getFeedbackItem(id);
      if (!feedback) {
        return res.status(404).json({ error: "Feedback not found" });
      }
      
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  app.post("/api/feedback", async (req, res) => {
    try {
      const validatedData = insertFeedbackSchema.parse(req.body);
      const feedback = await storage.createFeedback(validatedData);
      res.json(feedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid feedback data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create feedback" });
    }
  });

  app.put("/api/feedback/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }

      const feedback = await storage.updateFeedback(id, req.body);
      if (!feedback) {
        return res.status(404).json({ error: "Feedback not found" });
      }

      res.json(feedback);
    } catch (error) {
      console.error("Error updating feedback:", error);
      res.status(500).json({ error: "Failed to update feedback" });
    }
  });

  app.delete("/api/feedback/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }

      const deleted = await storage.deleteFeedback(id);
      if (!deleted) {
        return res.status(404).json({ error: "Feedback not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting feedback:", error);
      res.status(500).json({ error: "Failed to delete feedback" });
    }
  });

  // Feedback Comments Routes
  app.get("/api/feedback/:id/comments", async (req, res) => {
    try {
      const feedbackId = parseInt(req.params.id);
      if (isNaN(feedbackId)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }

      const comments = await storage.getFeedbackComments(feedbackId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching feedback comments:", error);
      res.status(500).json({ error: "Failed to fetch feedback comments" });
    }
  });

  app.post("/api/feedback/:id/comments", async (req, res) => {
    try {
      const feedbackId = parseInt(req.params.id);
      if (isNaN(feedbackId)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }

      const commentData = {
        ...req.body,
        feedbackId
      };
      
      const validatedData = insertFeedbackCommentSchema.parse(commentData);
      const comment = await storage.createFeedbackComment(validatedData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating feedback comment:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid comment data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.delete("/api/feedback/comments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }

      const deleted = await storage.deleteFeedbackComment(id);
      if (!deleted) {
        return res.status(404).json({ error: "Comment not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Feedback Voting Routes
  app.get("/api/feedback/:id/votes", async (req, res) => {
    try {
      const feedbackId = parseInt(req.params.id);
      if (isNaN(feedbackId)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }

      const votes = await storage.getFeedbackVotes(feedbackId);
      res.json(votes);
    } catch (error) {
      console.error("Error fetching feedback votes:", error);
      res.status(500).json({ error: "Failed to fetch feedback votes" });
    }
  });

  app.post("/api/feedback/:id/vote", requireAuth, async (req, res) => {
    try {
      const feedbackId = parseInt(req.params.id);
      if (isNaN(feedbackId)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }

      const voteData = {
        feedbackId,
        userId: req.user.id,
        voteType: req.body.voteType
      };

      const validatedData = insertFeedbackVoteSchema.parse(voteData);
      const vote = await storage.voteFeedback(validatedData);
      res.json(vote);
    } catch (error) {
      console.error("Error voting on feedback:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid vote data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to vote on feedback" });
    }
  });

  app.delete("/api/feedback/:id/vote", requireAuth, async (req, res) => {
    try {
      const feedbackId = parseInt(req.params.id);
      if (isNaN(feedbackId)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
      }

      const removed = await storage.removeVote(req.user.id, feedbackId);
      if (!removed) {
        return res.status(404).json({ error: "Vote not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error removing vote:", error);
      res.status(500).json({ error: "Failed to remove vote" });
    }
  });

  // Canvas Content API routes
  app.get("/api/canvas/content/:sessionId", requireAuth, async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const userId = typeof req.user.id === 'string' ? parseInt(req.user.id.split('_')[1]) || 0 : req.user.id;

      const content = await storage.getCanvasContent(userId, sessionId);
      res.json(content);
    } catch (error) {
      console.error("Error fetching canvas content:", error);
      res.status(500).json({ error: "Failed to fetch canvas content" });
    }
  });

  app.post("/api/canvas/content", requireAuth, async (req, res) => {
    try {
      const userId = typeof req.user.id === 'string' ? parseInt(req.user.id.split('_')[1]) || 0 : req.user.id;
      
      const contentData = {
        ...req.body,
        userId
      };

      const validatedData = insertCanvasContentSchema.parse(contentData);
      const content = await storage.addCanvasContent(validatedData);
      res.json(content);
    } catch (error) {
      console.error("Error adding canvas content:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid content data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to add canvas content" });
    }
  });

  app.delete("/api/canvas/content/:sessionId", requireAuth, async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const userId = typeof req.user.id === 'string' ? parseInt(req.user.id.split('_')[1]) || 0 : req.user.id;

      const cleared = await storage.clearCanvasContent(userId, sessionId);
      res.json({ success: cleared });
    } catch (error) {
      console.error("Error clearing canvas content:", error);
      res.status(500).json({ error: "Failed to clear canvas content" });
    }
  });

  app.delete("/api/canvas/content/item/:id", requireAuth, async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);
      if (isNaN(contentId)) {
        return res.status(400).json({ error: "Invalid content ID" });
      }

      const deleted = await storage.deleteCanvasContent(contentId);
      if (!deleted) {
        return res.status(404).json({ error: "Content not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting canvas content:", error);
      res.status(500).json({ error: "Failed to delete canvas content" });
    }
  });

  app.put("/api/canvas/content/reorder", requireAuth, async (req, res) => {
    try {
      const { contentIds } = req.body;
      
      if (!Array.isArray(contentIds)) {
        return res.status(400).json({ error: "contentIds must be an array" });
      }

      const reordered = await storage.reorderCanvasContent(contentIds);
      res.json({ success: reordered });
    } catch (error) {
      console.error("Error reordering canvas content:", error);
      res.status(500).json({ error: "Failed to reorder canvas content" });
    }
  });

  // Canvas Settings API routes
  app.get("/api/canvas/settings/:sessionId", requireAuth, async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const userId = typeof req.user.id === 'string' ? parseInt(req.user.id.split('_')[1]) || 0 : req.user.id;

      const settings = await storage.getCanvasSettings(userId, sessionId);
      res.json(settings || { retentionDays: 7, autoClear: true, maxItems: 50 });
    } catch (error) {
      console.error("Error fetching canvas settings:", error);
      res.status(500).json({ error: "Failed to fetch canvas settings" });
    }
  });

  app.post("/api/canvas/settings", requireAuth, async (req, res) => {
    try {
      const userId = typeof req.user.id === 'string' ? parseInt(req.user.id.split('_')[1]) || 0 : req.user.id;
      
      const settingsData = {
        ...req.body,
        userId
      };

      const validatedData = insertCanvasSettingsSchema.parse(settingsData);
      const settings = await storage.upsertCanvasSettings(validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating canvas settings:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid settings data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update canvas settings" });
    }
  });

  app.post("/api/canvas/cleanup", async (req, res) => {
    try {
      const cleaned = await storage.cleanupExpiredCanvasContent();
      res.json({ success: cleaned });
    } catch (error) {
      console.error("Error cleaning up canvas content:", error);
      res.status(500).json({ error: "Failed to cleanup canvas content" });
    }
  });

  // Error Logging and Monitoring API routes
  app.post("/api/errors/log", async (req, res) => {
    try {
      const validatedData = insertErrorLogSchema.parse(req.body);
      const error = await storage.logError(validatedData);
      res.json(error);
    } catch (error) {
      console.error("Error logging error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid error data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to log error" });
    }
  });

  app.get("/api/errors/logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const resolved = req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined;
      const errors = await storage.getErrorLogs(limit, resolved);
      res.json(errors);
    } catch (error) {
      console.error("Error fetching error logs:", error);
      res.status(500).json({ error: "Failed to fetch error logs" });
    }
  });

  app.get("/api/errors/logs/:errorId", async (req, res) => {
    try {
      const error = await storage.getErrorLog(req.params.errorId);
      if (!error) {
        return res.status(404).json({ error: "Error log not found" });
      }
      res.json(error);
    } catch (error) {
      console.error("Error fetching error log:", error);
      res.status(500).json({ error: "Failed to fetch error log" });
    }
  });

  app.patch("/api/errors/logs/:errorId/resolve", async (req, res) => {
    try {
      const resolved = await storage.markErrorResolved(req.params.errorId);
      res.json({ success: resolved });
    } catch (error) {
      console.error("Error resolving error log:", error);
      res.status(500).json({ error: "Failed to resolve error log" });
    }
  });

  app.post("/api/errors/reports", async (req, res) => {
    try {
      const validatedData = insertErrorReportSchema.parse(req.body);
      const report = await storage.createErrorReport(validatedData);
      res.json(report);
    } catch (error) {
      console.error("Error creating error report:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid report data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create error report" });
    }
  });

  app.get("/api/errors/reports", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const reports = await storage.getErrorReports(status);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching error reports:", error);
      res.status(500).json({ error: "Failed to fetch error reports" });
    }
  });

  app.patch("/api/errors/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const report = await storage.updateErrorReport(id, updates);
      res.json(report);
    } catch (error) {
      console.error("Error updating error report:", error);
      res.status(500).json({ error: "Failed to update error report" });
    }
  });

  app.get("/api/system/health", async (req, res) => {
    try {
      const healthData = await storage.getSystemHealth();
      res.json(healthData);
    } catch (error) {
      console.error("Error fetching system health:", error);
      res.status(500).json({ error: "Failed to fetch system health" });
    }
  });

  app.post("/api/system/health", async (req, res) => {
    try {
      const validatedData = insertSystemHealthSchema.parse(req.body);
      const health = await storage.logSystemHealth(validatedData);
      res.json(health);
    } catch (error) {
      console.error("Error logging system health:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid health data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to log system health" });
    }
  });

  // Email API routes
  app.post("/api/email/send", async (req, res) => {
    try {
      const { to, subject, htmlBody, textBody, from } = req.body;
      
      if (!to || !subject || (!htmlBody && !textBody)) {
        return res.status(400).json({ 
          error: "Missing required fields: to, subject, and either htmlBody or textBody" 
        });
      }

      const success = await emailService.sendEmail({
        to,
        subject,
        htmlBody,
        textBody,
        from
      });

      if (success) {
        res.json({ success: true, message: "Email sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error) {
      console.error("Error in email send route:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.post("/api/email/order-confirmation", async (req, res) => {
    try {
      const { customerEmail, orderDetails } = req.body;
      
      if (!customerEmail || !orderDetails) {
        return res.status(400).json({ error: "Missing customerEmail or orderDetails" });
      }

      const success = await emailService.sendOrderConfirmation(customerEmail, orderDetails);

      if (success) {
        res.json({ success: true, message: "Order confirmation sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send order confirmation" });
      }
    } catch (error) {
      console.error("Error sending order confirmation:", error);
      res.status(500).json({ error: "Failed to send order confirmation" });
    }
  });

  app.post("/api/email/production-update", async (req, res) => {
    try {
      const { customerEmail, jobDetails } = req.body;
      
      if (!customerEmail || !jobDetails) {
        return res.status(400).json({ error: "Missing customerEmail or jobDetails" });
      }

      const success = await emailService.sendProductionStatusUpdate(customerEmail, jobDetails);

      if (success) {
        res.json({ success: true, message: "Production update sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send production update" });
      }
    } catch (error) {
      console.error("Error sending production update:", error);
      res.status(500).json({ error: "Failed to send production update" });
    }
  });

  app.post("/api/email/maintenance-alert", async (req, res) => {
    try {
      const { maintenanceTeamEmail, resourceDetails } = req.body;
      
      if (!maintenanceTeamEmail || !resourceDetails) {
        return res.status(400).json({ error: "Missing maintenanceTeamEmail or resourceDetails" });
      }

      const success = await emailService.sendMaintenanceAlert(maintenanceTeamEmail, resourceDetails);

      if (success) {
        res.json({ success: true, message: "Maintenance alert sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send maintenance alert" });
      }
    } catch (error) {
      console.error("Error sending maintenance alert:", error);
      res.status(500).json({ error: "Failed to send maintenance alert" });
    }
  });

  app.post("/api/email/operation-alert", async (req, res) => {
    try {
      const { operatorEmail, operationDetails } = req.body;
      
      if (!operatorEmail || !operationDetails) {
        return res.status(400).json({ error: "Missing operatorEmail or operationDetails" });
      }

      const success = await emailService.sendOperationAlert(operatorEmail, operationDetails);

      if (success) {
        res.json({ success: true, message: "Operation alert sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send operation alert" });
      }
    } catch (error) {
      console.error("Error sending operation alert:", error);
      res.status(500).json({ error: "Failed to send operation alert" });
    }
  });

  // Schedule Scenarios
  app.get("/api/schedule-scenarios", async (req, res) => {
    try {
      const scenarios = await storage.getScheduleScenarios();
      res.json(scenarios);
    } catch (error) {
      console.error("Error fetching schedule scenarios:", error);
      res.status(500).json({ error: "Failed to fetch schedule scenarios" });
    }
  });

  app.get("/api/schedule-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid schedule scenario ID" });
      }

      const scenario = await storage.getScheduleScenario(id);
      if (!scenario) {
        return res.status(404).json({ error: "Schedule scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      console.error("Error fetching schedule scenario:", error);
      res.status(500).json({ error: "Failed to fetch schedule scenario" });
    }
  });

  app.post("/api/schedule-scenarios", async (req, res) => {
    try {
      const validation = insertScheduleScenarioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid schedule scenario data", details: validation.error.errors });
      }

      const scenario = await storage.createScheduleScenario(validation.data);
      res.status(201).json(scenario);
    } catch (error) {
      console.error("Error creating schedule scenario:", error);
      res.status(500).json({ error: "Failed to create schedule scenario" });
    }
  });

  app.put("/api/schedule-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid schedule scenario ID" });
      }

      const validation = insertScheduleScenarioSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid schedule scenario data", details: validation.error.errors });
      }

      const scenario = await storage.updateScheduleScenario(id, validation.data);
      if (!scenario) {
        return res.status(404).json({ error: "Schedule scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      console.error("Error updating schedule scenario:", error);
      res.status(500).json({ error: "Failed to update schedule scenario" });
    }
  });

  app.delete("/api/schedule-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid schedule scenario ID" });
      }

      const success = await storage.deleteScheduleScenario(id);
      if (!success) {
        return res.status(404).json({ error: "Schedule scenario not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting schedule scenario:", error);
      res.status(500).json({ error: "Failed to delete schedule scenario" });
    }
  });

  // Scenario Operations
  app.get("/api/scenarios/:scenarioId/operations", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      if (isNaN(scenarioId)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const operations = await storage.getScenarioOperations(scenarioId);
      res.json(operations);
    } catch (error) {
      console.error("Error fetching scenario operations:", error);
      res.status(500).json({ error: "Failed to fetch scenario operations" });
    }
  });

  app.post("/api/scenarios/:scenarioId/operations", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      if (isNaN(scenarioId)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const validation = insertScenarioOperationSchema.safeParse({
        ...req.body,
        scenarioId
      });
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid scenario operation data", details: validation.error.errors });
      }

      const operation = await storage.createScenarioOperation(validation.data);
      res.status(201).json(operation);
    } catch (error) {
      console.error("Error creating scenario operation:", error);
      res.status(500).json({ error: "Failed to create scenario operation" });
    }
  });

  app.put("/api/scenario-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario operation ID" });
      }

      const validation = insertScenarioOperationSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid scenario operation data", details: validation.error.errors });
      }

      const operation = await storage.updateScenarioOperation(id, validation.data);
      if (!operation) {
        return res.status(404).json({ error: "Scenario operation not found" });
      }
      res.json(operation);
    } catch (error) {
      console.error("Error updating scenario operation:", error);
      res.status(500).json({ error: "Failed to update scenario operation" });
    }
  });

  app.delete("/api/scenario-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario operation ID" });
      }

      const success = await storage.deleteScenarioOperation(id);
      if (!success) {
        return res.status(404).json({ error: "Scenario operation not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scenario operation:", error);
      res.status(500).json({ error: "Failed to delete scenario operation" });
    }
  });

  // Scenario Evaluations
  app.get("/api/scenarios/:scenarioId/evaluations", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      if (isNaN(scenarioId)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const evaluations = await storage.getScenarioEvaluations(scenarioId);
      res.json(evaluations);
    } catch (error) {
      console.error("Error fetching scenario evaluations:", error);
      res.status(500).json({ error: "Failed to fetch scenario evaluations" });
    }
  });

  app.post("/api/scenarios/:scenarioId/evaluations", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      if (isNaN(scenarioId)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const validation = insertScenarioEvaluationSchema.safeParse({
        ...req.body,
        scenarioId
      });
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid scenario evaluation data", details: validation.error.errors });
      }

      const evaluation = await storage.createScenarioEvaluation(validation.data);
      res.status(201).json(evaluation);
    } catch (error) {
      console.error("Error creating scenario evaluation:", error);
      res.status(500).json({ error: "Failed to create scenario evaluation" });
    }
  });

  app.put("/api/scenario-evaluations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario evaluation ID" });
      }

      const validation = insertScenarioEvaluationSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid scenario evaluation data", details: validation.error.errors });
      }

      const evaluation = await storage.updateScenarioEvaluation(id, validation.data);
      if (!evaluation) {
        return res.status(404).json({ error: "Scenario evaluation not found" });
      }
      res.json(evaluation);
    } catch (error) {
      console.error("Error updating scenario evaluation:", error);
      res.status(500).json({ error: "Failed to update scenario evaluation" });
    }
  });

  app.delete("/api/scenario-evaluations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario evaluation ID" });
      }

      const success = await storage.deleteScenarioEvaluation(id);
      if (!success) {
        return res.status(404).json({ error: "Scenario evaluation not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scenario evaluation:", error);
      res.status(500).json({ error: "Failed to delete scenario evaluation" });
    }
  });

  // Scenario Discussions
  app.get("/api/scenarios/:scenarioId/discussions", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      if (isNaN(scenarioId)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const discussions = await storage.getScenarioDiscussions(scenarioId);
      res.json(discussions);
    } catch (error) {
      console.error("Error fetching scenario discussions:", error);
      res.status(500).json({ error: "Failed to fetch scenario discussions" });
    }
  });

  app.post("/api/scenarios/:scenarioId/discussions", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      if (isNaN(scenarioId)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const validation = insertScenarioDiscussionSchema.safeParse({
        ...req.body,
        scenarioId
      });
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid scenario discussion data", details: validation.error.errors });
      }

      const discussion = await storage.createScenarioDiscussion(validation.data);
      res.status(201).json(discussion);
    } catch (error) {
      console.error("Error creating scenario discussion:", error);
      res.status(500).json({ error: "Failed to create scenario discussion" });
    }
  });

  app.put("/api/scenario-discussions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario discussion ID" });
      }

      const validation = insertScenarioDiscussionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid scenario discussion data", details: validation.error.errors });
      }

      const discussion = await storage.updateScenarioDiscussion(id, validation.data);
      if (!discussion) {
        return res.status(404).json({ error: "Scenario discussion not found" });
      }
      res.json(discussion);
    } catch (error) {
      console.error("Error updating scenario discussion:", error);
      res.status(500).json({ error: "Failed to update scenario discussion" });
    }
  });

  app.delete("/api/scenario-discussions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario discussion ID" });
      }

      const success = await storage.deleteScenarioDiscussion(id);
      if (!success) {
        return res.status(404).json({ error: "Scenario discussion not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scenario discussion:", error);
      res.status(500).json({ error: "Failed to delete scenario discussion" });
    }
  });

  // System Management API Routes

  // System Users
  app.get("/api/system/users", async (req, res) => {
    try {
      const users = await storage.getSystemUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching system users:", error);
      res.status(500).json({ error: "Failed to fetch system users" });
    }
  });

  app.get("/api/system/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getSystemUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching system user:", error);
      res.status(500).json({ error: "Failed to fetch system user" });
    }
  });

  app.post("/api/system/users", async (req, res) => {
    try {
      const validation = insertSystemUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid user data", details: validation.error.errors });
      }

      const user = await storage.createSystemUser(validation.data);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating system user:", error);
      res.status(500).json({ error: "Failed to create system user" });
    }
  });

  app.put("/api/system/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const validation = insertSystemUserSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid user data", details: validation.error.errors });
      }

      const user = await storage.updateSystemUser(id, validation.data);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating system user:", error);
      res.status(500).json({ error: "Failed to update system user" });
    }
  });

  app.delete("/api/system/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const success = await storage.deleteSystemUser(id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting system user:", error);
      res.status(500).json({ error: "Failed to delete system user" });
    }
  });

  // System Health
  app.get("/api/system/health", async (req, res) => {
    try {
      const environment = req.query.environment as string | undefined;
      const health = await storage.getSystemHealth(environment);
      res.json(health);
    } catch (error) {
      console.error("Error fetching system health:", error);
      res.status(500).json({ error: "Failed to fetch system health" });
    }
  });

  app.post("/api/system/health", async (req, res) => {
    try {
      const validation = insertSystemHealthSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid health data", details: validation.error.errors });
      }

      const health = await storage.createSystemHealth(validation.data);
      res.status(201).json(health);
    } catch (error) {
      console.error("Error creating system health record:", error);
      res.status(500).json({ error: "Failed to create system health record" });
    }
  });

  // System Environments
  app.get("/api/system/environments", async (req, res) => {
    try {
      const environments = await storage.getSystemEnvironments();
      res.json(environments);
    } catch (error) {
      console.error("Error fetching system environments:", error);
      res.status(500).json({ error: "Failed to fetch system environments" });
    }
  });

  app.get("/api/system/environments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid environment ID" });
      }

      const environment = await storage.getSystemEnvironment(id);
      if (!environment) {
        return res.status(404).json({ error: "Environment not found" });
      }
      res.json(environment);
    } catch (error) {
      console.error("Error fetching system environment:", error);
      res.status(500).json({ error: "Failed to fetch system environment" });
    }
  });

  app.post("/api/system/environments", async (req, res) => {
    try {
      const validation = insertSystemEnvironmentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid environment data", details: validation.error.errors });
      }

      const environment = await storage.createSystemEnvironment(validation.data);
      res.status(201).json(environment);
    } catch (error) {
      console.error("Error creating system environment:", error);
      res.status(500).json({ error: "Failed to create system environment" });
    }
  });

  app.put("/api/system/environments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid environment ID" });
      }

      const validation = insertSystemEnvironmentSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid environment data", details: validation.error.errors });
      }

      const environment = await storage.updateSystemEnvironment(id, validation.data);
      if (!environment) {
        return res.status(404).json({ error: "Environment not found" });
      }
      res.json(environment);
    } catch (error) {
      console.error("Error updating system environment:", error);
      res.status(500).json({ error: "Failed to update system environment" });
    }
  });

  // System Upgrades
  app.get("/api/system/upgrades", async (req, res) => {
    try {
      const environment = req.query.environment as string | undefined;
      const upgrades = await storage.getSystemUpgrades(environment);
      res.json(upgrades);
    } catch (error) {
      console.error("Error fetching system upgrades:", error);
      res.status(500).json({ error: "Failed to fetch system upgrades" });
    }
  });

  app.post("/api/system/upgrades", async (req, res) => {
    try {
      const validation = insertSystemUpgradeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid upgrade data", details: validation.error.errors });
      }

      const upgrade = await storage.createSystemUpgrade(validation.data);
      res.status(201).json(upgrade);
    } catch (error) {
      console.error("Error creating system upgrade:", error);
      res.status(500).json({ error: "Failed to create system upgrade" });
    }
  });

  app.put("/api/system/upgrades/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid upgrade ID" });
      }

      const validation = insertSystemUpgradeSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid upgrade data", details: validation.error.errors });
      }

      const upgrade = await storage.updateSystemUpgrade(id, validation.data);
      if (!upgrade) {
        return res.status(404).json({ error: "Upgrade not found" });
      }
      res.json(upgrade);
    } catch (error) {
      console.error("Error updating system upgrade:", error);
      res.status(500).json({ error: "Failed to update system upgrade" });
    }
  });

  // System Audit Log
  app.get("/api/system/audit-log", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const resource = req.query.resource as string | undefined;
      const auditLog = await storage.getSystemAuditLog(userId, resource);
      res.json(auditLog);
    } catch (error) {
      console.error("Error fetching system audit log:", error);
      res.status(500).json({ error: "Failed to fetch system audit log" });
    }
  });

  app.post("/api/system/audit-log", async (req, res) => {
    try {
      const validation = insertSystemAuditLogSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid audit log data", details: validation.error.errors });
      }

      const auditLog = await storage.createSystemAuditLog(validation.data);
      res.status(201).json(auditLog);
    } catch (error) {
      console.error("Error creating system audit log:", error);
      res.status(500).json({ error: "Failed to create system audit log" });
    }
  });

  // System Settings
  app.get("/api/system/settings", async (req, res) => {
    try {
      const environment = req.query.environment as string | undefined;
      const category = req.query.category as string | undefined;
      const settings = await storage.getSystemSettings(environment, category);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ error: "Failed to fetch system settings" });
    }
  });

  app.post("/api/system/settings", async (req, res) => {
    try {
      const validation = insertSystemSettingsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid settings data", details: validation.error.errors });
      }

      const setting = await storage.createSystemSetting(validation.data);
      res.status(201).json(setting);
    } catch (error) {
      console.error("Error creating system setting:", error);
      res.status(500).json({ error: "Failed to create system setting" });
    }
  });

  app.put("/api/system/settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid setting ID" });
      }

      const validation = insertSystemSettingsSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid settings data", details: validation.error.errors });
      }

      const setting = await storage.updateSystemSetting(id, validation.data);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error updating system setting:", error);
      res.status(500).json({ error: "Failed to update system setting" });
    }
  });

  // Capacity Planning Scenarios
  app.get("/api/capacity-planning-scenarios", async (req, res) => {
    try {
      const scenarios = await storage.getCapacityPlanningScenarios();
      res.json(scenarios);
    } catch (error) {
      console.error("Error fetching capacity planning scenarios:", error);
      res.status(500).json({ error: "Failed to fetch capacity planning scenarios" });
    }
  });

  app.get("/api/capacity-planning-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const scenario = await storage.getCapacityPlanningScenario(id);
      if (!scenario) {
        return res.status(404).json({ error: "Capacity planning scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      console.error("Error fetching capacity planning scenario:", error);
      res.status(500).json({ error: "Failed to fetch capacity planning scenario" });
    }
  });

  app.post("/api/capacity-planning-scenarios", async (req, res) => {
    try {
      const validation = insertCapacityPlanningScenarioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid capacity planning scenario data", details: validation.error.errors });
      }

      // Convert date strings to Date objects
      const data = {
        ...validation.data,
        startDate: new Date(validation.data.startDate),
        endDate: new Date(validation.data.endDate)
      };

      const scenario = await storage.createCapacityPlanningScenario(data);
      res.status(201).json(scenario);
    } catch (error) {
      console.error("Error creating capacity planning scenario:", error);
      res.status(500).json({ error: "Failed to create capacity planning scenario" });
    }
  });

  app.put("/api/capacity-planning-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const validation = insertCapacityPlanningScenarioSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid capacity planning scenario data", details: validation.error.errors });
      }

      const scenario = await storage.updateCapacityPlanningScenario(id, validation.data);
      if (!scenario) {
        return res.status(404).json({ error: "Capacity planning scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      console.error("Error updating capacity planning scenario:", error);
      res.status(500).json({ error: "Failed to update capacity planning scenario" });
    }
  });

  app.delete("/api/capacity-planning-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const success = await storage.deleteCapacityPlanningScenario(id);
      if (!success) {
        return res.status(404).json({ error: "Capacity planning scenario not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting capacity planning scenario:", error);
      res.status(500).json({ error: "Failed to delete capacity planning scenario" });
    }
  });

  // Staffing Plans
  app.get("/api/staffing-plans", async (req, res) => {
    try {
      const scenarioId = req.query.scenarioId ? parseInt(req.query.scenarioId as string) : undefined;
      const plans = await storage.getStaffingPlans(scenarioId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching staffing plans:", error);
      res.status(500).json({ error: "Failed to fetch staffing plans" });
    }
  });

  app.get("/api/staffing-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const plan = await storage.getStaffingPlan(id);
      if (!plan) {
        return res.status(404).json({ error: "Staffing plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching staffing plan:", error);
      res.status(500).json({ error: "Failed to fetch staffing plan" });
    }
  });

  app.post("/api/staffing-plans", async (req, res) => {
    try {
      const validation = insertStaffingPlanSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid staffing plan data", details: validation.error.errors });
      }

      const plan = await storage.createStaffingPlan(validation.data);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating staffing plan:", error);
      res.status(500).json({ error: "Failed to create staffing plan" });
    }
  });

  app.put("/api/staffing-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const validation = insertStaffingPlanSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid staffing plan data", details: validation.error.errors });
      }

      const plan = await storage.updateStaffingPlan(id, validation.data);
      if (!plan) {
        return res.status(404).json({ error: "Staffing plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error updating staffing plan:", error);
      res.status(500).json({ error: "Failed to update staffing plan" });
    }
  });

  app.delete("/api/staffing-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const success = await storage.deleteStaffingPlan(id);
      if (!success) {
        return res.status(404).json({ error: "Staffing plan not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting staffing plan:", error);
      res.status(500).json({ error: "Failed to delete staffing plan" });
    }
  });

  // Shift Plans
  app.get("/api/shift-plans", async (req, res) => {
    try {
      const scenarioId = req.query.scenarioId ? parseInt(req.query.scenarioId as string) : undefined;
      const plans = await storage.getShiftPlans(scenarioId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching shift plans:", error);
      res.status(500).json({ error: "Failed to fetch shift plans" });
    }
  });

  app.get("/api/shift-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const plan = await storage.getShiftPlan(id);
      if (!plan) {
        return res.status(404).json({ error: "Shift plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching shift plan:", error);
      res.status(500).json({ error: "Failed to fetch shift plan" });
    }
  });

  app.post("/api/shift-plans", async (req, res) => {
    try {
      const validation = insertShiftPlanSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid shift plan data", details: validation.error.errors });
      }

      // Convert date strings to Date objects
      const data = {
        ...validation.data,
        effectiveDate: new Date(validation.data.effectiveDate),
        endDate: validation.data.endDate ? new Date(validation.data.endDate) : undefined
      };

      const plan = await storage.createShiftPlan(data);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating shift plan:", error);
      res.status(500).json({ error: "Failed to create shift plan" });
    }
  });

  app.put("/api/shift-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const validation = insertShiftPlanSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid shift plan data", details: validation.error.errors });
      }

      const plan = await storage.updateShiftPlan(id, validation.data);
      if (!plan) {
        return res.status(404).json({ error: "Shift plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error updating shift plan:", error);
      res.status(500).json({ error: "Failed to update shift plan" });
    }
  });

  app.delete("/api/shift-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const success = await storage.deleteShiftPlan(id);
      if (!success) {
        return res.status(404).json({ error: "Shift plan not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting shift plan:", error);
      res.status(500).json({ error: "Failed to delete shift plan" });
    }
  });

  // Equipment Plans
  app.get("/api/equipment-plans", async (req, res) => {
    try {
      const scenarioId = req.query.scenarioId ? parseInt(req.query.scenarioId as string) : undefined;
      const plans = await storage.getEquipmentPlans(scenarioId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching equipment plans:", error);
      res.status(500).json({ error: "Failed to fetch equipment plans" });
    }
  });

  app.get("/api/equipment-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const plan = await storage.getEquipmentPlan(id);
      if (!plan) {
        return res.status(404).json({ error: "Equipment plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching equipment plan:", error);
      res.status(500).json({ error: "Failed to fetch equipment plan" });
    }
  });

  app.post("/api/equipment-plans", async (req, res) => {
    try {
      const validation = insertEquipmentPlanSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid equipment plan data", details: validation.error.errors });
      }

      const plan = await storage.createEquipmentPlan(validation.data);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating equipment plan:", error);
      res.status(500).json({ error: "Failed to create equipment plan" });
    }
  });

  app.put("/api/equipment-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const validation = insertEquipmentPlanSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid equipment plan data", details: validation.error.errors });
      }

      const plan = await storage.updateEquipmentPlan(id, validation.data);
      if (!plan) {
        return res.status(404).json({ error: "Equipment plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error updating equipment plan:", error);
      res.status(500).json({ error: "Failed to update equipment plan" });
    }
  });

  app.delete("/api/equipment-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      const success = await storage.deleteEquipmentPlan(id);
      if (!success) {
        return res.status(404).json({ error: "Equipment plan not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting equipment plan:", error);
      res.status(500).json({ error: "Failed to delete equipment plan" });
    }
  });

  // Capacity Projections
  app.get("/api/capacity-projections", async (req, res) => {
    try {
      const scenarioId = req.query.scenarioId ? parseInt(req.query.scenarioId as string) : undefined;
      const projections = await storage.getCapacityProjections(scenarioId);
      res.json(projections);
    } catch (error) {
      console.error("Error fetching capacity projections:", error);
      res.status(500).json({ error: "Failed to fetch capacity projections" });
    }
  });

  app.get("/api/capacity-projections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid projection ID" });
      }

      const projection = await storage.getCapacityProjection(id);
      if (!projection) {
        return res.status(404).json({ error: "Capacity projection not found" });
      }
      res.json(projection);
    } catch (error) {
      console.error("Error fetching capacity projection:", error);
      res.status(500).json({ error: "Failed to fetch capacity projection" });
    }
  });

  app.post("/api/capacity-projections", async (req, res) => {
    try {
      const validation = insertCapacityProjectionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid capacity projection data", details: validation.error.errors });
      }

      // Convert date strings to Date objects
      const data = {
        ...validation.data,
        validFromDate: new Date(validation.data.validFromDate),
        validToDate: new Date(validation.data.validToDate)
      };

      const projection = await storage.createCapacityProjection(data);
      res.status(201).json(projection);
    } catch (error) {
      console.error("Error creating capacity projection:", error);
      res.status(500).json({ error: "Failed to create capacity projection" });
    }
  });

  app.put("/api/capacity-projections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid projection ID" });
      }

      const validation = insertCapacityProjectionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid capacity projection data", details: validation.error.errors });
      }

      const projection = await storage.updateCapacityProjection(id, validation.data);
      if (!projection) {
        return res.status(404).json({ error: "Capacity projection not found" });
      }
      res.json(projection);
    } catch (error) {
      console.error("Error updating capacity projection:", error);
      res.status(500).json({ error: "Failed to update capacity projection" });
    }
  });

  app.delete("/api/capacity-projections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid projection ID" });
      }

      const success = await storage.deleteCapacityProjection(id);
      if (!success) {
        return res.status(404).json({ error: "Capacity projection not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting capacity projection:", error);
      res.status(500).json({ error: "Failed to delete capacity projection" });
    }
  });

  // Business Goals
  app.get("/api/business-goals", async (req, res) => {
    try {
      const goals = await storage.getBusinessGoals();
      res.json(goals);
    } catch (error) {
      console.error("Error fetching business goals:", error);
      res.status(500).json({ error: "Failed to fetch business goals" });
    }
  });

  app.get("/api/business-goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }

      const goal = await storage.getBusinessGoal(id);
      if (!goal) {
        return res.status(404).json({ error: "Business goal not found" });
      }
      res.json(goal);
    } catch (error) {
      console.error("Error fetching business goal:", error);
      res.status(500).json({ error: "Failed to fetch business goal" });
    }
  });

  app.post("/api/business-goals", async (req, res) => {
    try {
      const validation = insertBusinessGoalSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid business goal data", details: validation.error.errors });
      }

      // Convert date strings to Date objects
      const data = {
        ...validation.data,
        startDate: new Date(validation.data.startDate),
        targetDate: new Date(validation.data.targetDate)
      };

      const goal = await storage.createBusinessGoal(data);
      res.status(201).json(goal);
    } catch (error) {
      console.error("Error creating business goal:", error);
      res.status(500).json({ error: "Failed to create business goal" });
    }
  });

  app.put("/api/business-goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }

      const validation = insertBusinessGoalSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid business goal data", details: validation.error.errors });
      }

      // Convert date strings to Date objects if present
      const data: any = { ...validation.data };
      if (data.startDate) data.startDate = new Date(data.startDate);
      if (data.targetDate) data.targetDate = new Date(data.targetDate);

      const goal = await storage.updateBusinessGoal(id, data);
      if (!goal) {
        return res.status(404).json({ error: "Business goal not found" });
      }
      res.json(goal);
    } catch (error) {
      console.error("Error updating business goal:", error);
      res.status(500).json({ error: "Failed to update business goal" });
    }
  });

  app.delete("/api/business-goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid goal ID" });
      }

      const success = await storage.deleteBusinessGoal(id);
      if (!success) {
        return res.status(404).json({ error: "Business goal not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting business goal:", error);
      res.status(500).json({ error: "Failed to delete business goal" });
    }
  });

  // Goal Progress
  app.get("/api/goal-progress", async (req, res) => {
    try {
      const goalId = req.query.goalId ? parseInt(req.query.goalId as string) : undefined;
      const progress = await storage.getGoalProgress(goalId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching goal progress:", error);
      res.status(500).json({ error: "Failed to fetch goal progress" });
    }
  });

  app.post("/api/goal-progress", async (req, res) => {
    try {
      const validation = insertGoalProgressSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid goal progress data", details: validation.error.errors });
      }

      const progress = await storage.createGoalProgress(validation.data);
      res.status(201).json(progress);
    } catch (error) {
      console.error("Error creating goal progress:", error);
      res.status(500).json({ error: "Failed to create goal progress" });
    }
  });

  // Goal Risks
  app.get("/api/goal-risks", async (req, res) => {
    try {
      const goalId = req.query.goalId ? parseInt(req.query.goalId as string) : undefined;
      const risks = await storage.getGoalRisks(goalId);
      res.json(risks);
    } catch (error) {
      console.error("Error fetching goal risks:", error);
      res.status(500).json({ error: "Failed to fetch goal risks" });
    }
  });

  app.post("/api/goal-risks", async (req, res) => {
    try {
      const validation = insertGoalRiskSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid goal risk data", details: validation.error.errors });
      }

      // Convert date strings to Date objects if present
      const data: any = { ...validation.data };
      if (data.mitigation_deadline) data.mitigation_deadline = new Date(data.mitigation_deadline);

      const risk = await storage.createGoalRisk(data);
      res.status(201).json(risk);
    } catch (error) {
      console.error("Error creating goal risk:", error);
      res.status(500).json({ error: "Failed to create goal risk" });
    }
  });

  // Goal Issues
  app.get("/api/goal-issues", async (req, res) => {
    try {
      const goalId = req.query.goalId ? parseInt(req.query.goalId as string) : undefined;
      const issues = await storage.getGoalIssues(goalId);
      res.json(issues);
    } catch (error) {
      console.error("Error fetching goal issues:", error);
      res.status(500).json({ error: "Failed to fetch goal issues" });
    }
  });

  app.post("/api/goal-issues", async (req, res) => {
    try {
      const validation = insertGoalIssueSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid goal issue data", details: validation.error.errors });
      }

      // Convert date strings to Date objects if present
      const data: any = { ...validation.data };
      if (data.estimatedResolutionDate) data.estimatedResolutionDate = new Date(data.estimatedResolutionDate);
      if (data.actualResolutionDate) data.actualResolutionDate = new Date(data.actualResolutionDate);

      const issue = await storage.createGoalIssue(data);
      res.status(201).json(issue);
    } catch (error) {
      console.error("Error creating goal issue:", error);
      res.status(500).json({ error: "Failed to create goal issue" });
    }
  });

  // Goal KPIs
  app.get("/api/goal-kpis", async (req, res) => {
    try {
      const goalId = req.query.goalId ? parseInt(req.query.goalId as string) : undefined;
      const kpis = await storage.getGoalKpis(goalId);
      res.json(kpis);
    } catch (error) {
      console.error("Error fetching goal KPIs:", error);
      res.status(500).json({ error: "Failed to fetch goal KPIs" });
    }
  });

  app.post("/api/goal-kpis", async (req, res) => {
    try {
      const validation = insertGoalKpiSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid goal KPI data", details: validation.error.errors });
      }

      const kpi = await storage.createGoalKpi(validation.data);
      res.status(201).json(kpi);
    } catch (error) {
      console.error("Error creating goal KPI:", error);
      res.status(500).json({ error: "Failed to create goal KPI" });
    }
  });

  // Goal Actions
  app.get("/api/goal-actions", async (req, res) => {
    try {
      const goalId = req.query.goalId ? parseInt(req.query.goalId as string) : undefined;
      const actions = await storage.getGoalActions(goalId);
      res.json(actions);
    } catch (error) {
      console.error("Error fetching goal actions:", error);
      res.status(500).json({ error: "Failed to fetch goal actions" });
    }
  });

  app.post("/api/goal-actions", async (req, res) => {
    try {
      const validation = insertGoalActionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid goal action data", details: validation.error.errors });
      }

      // Convert date strings to Date objects if present
      const data: any = { ...validation.data };
      if (data.startDate) data.startDate = new Date(data.startDate);
      if (data.targetDate) data.targetDate = new Date(data.targetDate);
      if (data.completedDate) data.completedDate = new Date(data.completedDate);

      const action = await storage.createGoalAction(data);
      res.status(201).json(action);
    } catch (error) {
      console.error("Error creating goal action:", error);
      res.status(500).json({ error: "Failed to create goal action" });
    }
  });

  // User Management API Routes

  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const user = await storage.authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error during authentication:", error);
      res.status(500).json({ error: "Failed to authenticate user" });
    }
  });

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/users-with-roles", async (req, res) => {
    try {
      const users = await storage.getUsersWithRoles();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users with roles:", error);
      res.status(500).json({ error: "Failed to fetch users with roles" });
    }
  });

  app.get("/api/users/:id/with-roles", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUserWithRoles(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user with roles:", error);
      res.status(500).json({ error: "Failed to fetch user with roles" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid user data", details: validation.error.errors });
      }

      const user = await storage.createUser(validation.data);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const validation = insertUserSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid user data", details: validation.error.errors });
      }

      const user = await storage.updateUser(id, validation.data);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Roles
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  // Get individual role by ID
  app.get("/api/roles/:roleId", async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const role = await storage.getRoleById(roleId);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });

  // Get all system roles for role demonstration (trainers only) - MUST be before /api/roles/:id
  app.get("/api/roles/all", async (req, res) => {
    try {
      console.log("=== ROLES/ALL ENDPOINT ===");
      console.log("Authorization header:", req.headers.authorization);
      console.log("Session userId:", req.session?.userId);
      
      let userId = req.session?.userId;
      
      // Check for token in Authorization header if session fails
      if (!userId && req.headers.authorization) {
        const token = req.headers.authorization.replace('Bearer ', '');
        console.log("Checking token:", token);
        
        // Extract user ID from token (simple format: user_ID_timestamp_random)
        const tokenParts = token.split('_');
        if (tokenParts.length >= 2 && tokenParts[0] === 'user') {
          userId = parseInt(tokenParts[1]);
          console.log("Token userId:", userId);
        }
      }
      
      if (!userId) {
        console.log("No userId found, returning 401");
        return res.status(401).json({ error: "Authentication required" });
      }

      console.log("Checking training permissions for userId:", userId);
      
      // Check if user's originally assigned roles have training permissions
      // This allows trainers/systems managers to access training features even while demonstrating other roles
      const userAssignedRoles = await storage.getUserRoles(userId);
      console.log("User assigned roles:", userAssignedRoles.map((r: any) => `${r.id}:${r.name}`));
      
      const hasTrainerRole = userAssignedRoles.some((role: any) => 
        role.name === 'Trainer' || role.name === 'Systems Manager'
      );
      console.log("Has trainer/systems manager role:", hasTrainerRole);
      
      if (!hasTrainerRole) {
        return res.status(403).json({ error: "User does not have role demonstration permissions" });
      }

      console.log("Fetching all roles with permission count...");
      const allRoles = await storage.getAllRolesWithPermissionCount();
      console.log("All roles fetched:", allRoles.length, "roles");
      res.json(allRoles);
    } catch (error) {
      console.error("Error fetching all roles:", error);
      res.status(500).json({ error: "Failed to fetch all roles" });
    }
  });

  app.get("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }

      const role = await storage.getRole(id);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({ error: "Failed to fetch role" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const validation = insertRoleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid role data", details: validation.error.errors });
      }

      const role = await storage.createRole(validation.data);
      res.status(201).json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ error: "Failed to create role" });
    }
  });

  app.put("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }

      const validation = insertRoleSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid role data", details: validation.error.errors });
      }

      const role = await storage.updateRole(id, validation.data);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  app.delete("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }

      const success = await storage.deleteRole(id);
      if (!success) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ error: "Failed to delete role" });
    }
  });

  // Permissions
  app.get("/api/permissions", async (req, res) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  app.get("/api/permissions/feature/:feature", async (req, res) => {
    try {
      const feature = req.params.feature;
      const permissions = await storage.getPermissionsByFeature(feature);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions by feature:", error);
      res.status(500).json({ error: "Failed to fetch permissions by feature" });
    }
  });

  app.post("/api/permissions", async (req, res) => {
    try {
      const validation = insertPermissionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid permission data", details: validation.error.errors });
      }

      const permission = await storage.createPermission(validation.data);
      res.status(201).json(permission);
    } catch (error) {
      console.error("Error creating permission:", error);
      res.status(500).json({ error: "Failed to create permission" });
    }
  });

  app.put("/api/permissions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid permission ID" });
      }

      const validation = insertPermissionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid permission data", details: validation.error.errors });
      }

      const permission = await storage.updatePermission(id, validation.data);
      if (!permission) {
        return res.status(404).json({ error: "Permission not found" });
      }
      res.json(permission);
    } catch (error) {
      console.error("Error updating permission:", error);
      res.status(500).json({ error: "Failed to update permission" });
    }
  });

  app.delete("/api/permissions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid permission ID" });
      }

      const success = await storage.deletePermission(id);
      if (!success) {
        return res.status(404).json({ error: "Permission not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting permission:", error);
      res.status(500).json({ error: "Failed to delete permission" });
    }
  });

  // User Role Assignment
  app.get("/api/users/:userId/roles", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const userRoles = await storage.getUserRoles(userId);
      res.json(userRoles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      res.status(500).json({ error: "Failed to fetch user roles" });
    }
  });

  app.post("/api/users/:userId/roles", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const validation = insertUserRoleSchema.safeParse({
        ...req.body,
        userId
      });
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid user role data", details: validation.error.errors });
      }

      const userRole = await storage.assignUserRole(validation.data);
      res.status(201).json(userRole);
    } catch (error) {
      console.error("Error assigning user role:", error);
      res.status(500).json({ error: "Failed to assign user role" });
    }
  });

  app.delete("/api/users/:userId/roles/:roleId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const roleId = parseInt(req.params.roleId);
      if (isNaN(userId) || isNaN(roleId)) {
        return res.status(400).json({ error: "Invalid user ID or role ID" });
      }

      const success = await storage.removeUserRole(userId, roleId);
      if (!success) {
        return res.status(404).json({ error: "User role assignment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing user role:", error);
      res.status(500).json({ error: "Failed to remove user role" });
    }
  });

  // Role Permission Assignment
  app.get("/api/roles/:roleId/permissions", async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      if (isNaN(roleId)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }

      const rolePermissions = await storage.getRolePermissions(roleId);
      res.json(rolePermissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ error: "Failed to fetch role permissions" });
    }
  });

  app.post("/api/roles/:roleId/permissions", async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      if (isNaN(roleId)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }

      const validation = insertRolePermissionSchema.safeParse({
        ...req.body,
        roleId
      });
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid role permission data", details: validation.error.errors });
      }

      const rolePermission = await storage.assignRolePermission(validation.data);
      res.status(201).json(rolePermission);
    } catch (error) {
      console.error("Error assigning role permission:", error);
      res.status(500).json({ error: "Failed to assign role permission" });
    }
  });

  app.delete("/api/roles/:roleId/permissions/:permissionId", async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const permissionId = parseInt(req.params.permissionId);
      if (isNaN(roleId) || isNaN(permissionId)) {
        return res.status(400).json({ error: "Invalid role ID or permission ID" });
      }

      const success = await storage.removeRolePermission(roleId, permissionId);
      if (!success) {
        return res.status(404).json({ error: "Role permission assignment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing role permission:", error);
      res.status(500).json({ error: "Failed to remove role permission" });
    }
  });

  // Permission Checking
  app.get("/api/users/:userId/permissions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ error: "Failed to fetch user permissions" });
    }
  });

  app.get("/api/users/:userId/permissions/check", async (req, res) => {
    try {
      const userIdParam = req.params.userId;
      const { feature, action } = req.query;
      
      if (!feature || !action) {
        return res.status(400).json({ error: "Feature and action are required" });
      }

      // Handle demo users
      if (typeof userIdParam === 'string' && userIdParam.startsWith('demo_')) {
        const demoPermissions = {
          'demo_support': ['help-view', 'systems-management-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
          'demo_director': ['business-goals-view', 'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
          'demo_plant': ['plant-manager-view', 'capacity-planning-view', 'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
          'demo_scheduler': ['schedule-view', 'boards-view', 'shop-floor-view', 'analytics-view', 'scheduling-optimizer-view', 'capacity-planning-view', 'business-goals-view', 'ai-assistant-view', 'feedback-view'],
          'demo_it_admin': ['systems-management-view', 'role-management-view', 'user-management-view', 'ai-assistant-view', 'feedback-view'],
          'demo_systems': ['systems-management-view', 'role-management-view', 'user-management-view', 'training-view', 'ai-assistant-view', 'feedback-view'],
          'demo_admin': ['role-management-view', 'user-management-view', 'systems-management-view', 'ai-assistant-view', 'feedback-view'],
          'demo_shop_floor': ['shop-floor-view', 'operator-dashboard-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
          'demo_analyst': ['analytics-view', 'reports-view', 'business-goals-view', 'ai-assistant-view', 'feedback-view'],
          'demo_trainer': ['training-view', 'role-switching-permissions', 'analytics-view', 'reports-view', 'schedule-view', 'business-goals-view', 'visual-factory-view', 'ai-assistant-view', 'feedback-view'],
          'demo_it_systems': ['systems-management-view', 'role-management-view', 'user-management-view', 'ai-assistant-view', 'feedback-view'],
          'demo_sales': ['sales-view', 'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
          'demo_customer_service': ['customer-service-view', 'reports-view', 'ai-assistant-view', 'feedback-view'],
          'demo_supply_chain': ['inventory-optimization-view', 'demand-forecasting-view', 'analytics-view', 'reports-view', 'ai-assistant-view', 'feedback-view']
        };
        
        const permissions = demoPermissions[userIdParam as keyof typeof demoPermissions];
        if (permissions) {
          const permissionKey = `${feature}-${action}`;
          const hasPermission = permissions.includes(permissionKey);
          return res.json({ hasPermission });
        }
      }

      const userId = parseInt(userIdParam);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const hasPermission = await storage.hasPermission(userId, feature as string, action as string);
      res.json({ hasPermission });
    } catch (error) {
      console.error("Error checking user permission:", error);
      res.status(500).json({ error: "Failed to check user permission" });
    }
  });

  // Role Management API routes
  app.get("/api/roles-management", async (req, res) => {
    try {
      const roles = await storage.getRolesWithPermissionsAndUserCount();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles for management:", error);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  app.post("/api/roles-management", async (req, res) => {
    try {
      const { name, description, permissions } = req.body;
      
      if (!name || !permissions || !Array.isArray(permissions)) {
        return res.status(400).json({ error: "Role name and permissions array are required" });
      }

      const role = await storage.createRoleWithPermissions({ name, description: description || "" }, permissions);
      res.status(201).json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ error: "Failed to create role" });
    }
  });

  app.patch("/api/roles-management/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }

      const { name, description, permissions } = req.body;
      
      if (!name || !permissions || !Array.isArray(permissions)) {
        return res.status(400).json({ error: "Role name and permissions array are required" });
      }

      const role = await storage.updateRoleWithPermissions(id, { name, description: description || "" }, permissions);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  app.delete("/api/roles-management/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }

      // Check if role has users assigned
      const roleWithUsers = await storage.getRoleWithUserCount(id);
      if (!roleWithUsers) {
        return res.status(404).json({ error: "Role not found" });
      }

      if (roleWithUsers.userCount > 0) {
        return res.status(400).json({ 
          error: `Cannot delete role. It is assigned to ${roleWithUsers.userCount} users.` 
        });
      }

      if (roleWithUsers.isSystemRole) {
        return res.status(400).json({ error: "Cannot delete system roles" });
      }

      const success = await storage.deleteRole(id);
      if (!success) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ error: "Failed to delete role" });
    }
  });

  // Role Switching API for Trainers and Systems Managers
  app.get("/api/users/:userId/available-roles", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Check if user's originally assigned roles include trainer or systems manager
      const userAssignedRoles = await storage.getUserRoles(userId);
      const hasTrainerRole = userAssignedRoles.some((role: any) => 
        role.name === 'Trainer' || role.name === 'Systems Manager'
      );
      if (!hasTrainerRole) {
        return res.status(403).json({ error: "User does not have role switching permissions" });
      }

      const userRoles = await storage.getUserRoles(userId);
      res.json(userRoles);
    } catch (error) {
      console.error("Error fetching available roles:", error);
      res.status(500).json({ error: "Failed to fetch available roles" });
    }
  });

  // Get assigned roles (all roles assigned to user - used for training mode detection)
  app.get("/api/users/:userId/assigned-roles", async (req, res) => {
    try {
      const userIdParam = req.params.userId;
      
      // Handle demo users
      if (typeof userIdParam === 'string' && userIdParam.startsWith('demo_')) {
        const demoRoles = {
          'demo_support': [{ id: 'demo_support_role', name: 'Support Engineer' }],
          'demo_director': [{ id: 'demo_director_role', name: 'Director' }],
          'demo_plant': [{ id: 'demo_plant_role', name: 'Plant Manager' }],
          'demo_scheduler': [{ id: 'demo_scheduler_role', name: 'Production Scheduler' }],
          'demo_it_admin': [{ id: 'demo_it_admin_role', name: 'IT Administrator' }],
          'demo_systems': [{ id: 'demo_systems_role', name: 'Systems Manager' }],
          'demo_admin': [{ id: 'demo_admin_role', name: 'Administrator' }],
          'demo_shop_floor': [{ id: 'demo_shop_floor_role', name: 'Shop Floor Operations' }],
          'demo_analyst': [{ id: 'demo_analyst_role', name: 'Data Analyst' }],
          'demo_trainer': [{ id: 'demo_trainer_role', name: 'Trainer' }],
          'demo_it_systems': [{ id: 'demo_it_systems_role', name: 'IT Systems Administrator' }],
          'demo_sales': [{ id: 'demo_sales_role', name: 'Sales Representative' }],
          'demo_customer_service': [{ id: 'demo_customer_service_role', name: 'Customer Service Representative' }],
          'demo_supply_chain': [{ id: 'demo_supply_chain_role', name: 'Supply Chain Planner' }]
        };
        
        const roles = demoRoles[userIdParam as keyof typeof demoRoles];
        if (roles) {
          return res.json(roles);
        }
      }

      const userId = parseInt(userIdParam);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Allow users to check their own assigned roles regardless of current active role
      // This is needed for training mode detection
      const roles = await storage.getUserRoles(userId);
      res.json(roles);
    } catch (error) {
      console.error("Error fetching assigned roles:", error);
      res.status(500).json({ error: "Failed to fetch assigned roles" });
    }
  });

  app.post("/api/users/:userId/switch-role", async (req, res) => {
    console.log(`=== ROLE SWITCH ENDPOINT HIT ===`);
    console.log(`Request body:`, req.body);
    console.log(`User ID param:`, req.params.userId);
    console.log(`Session userId:`, req.session?.userId);
    console.log(`Authorization header:`, req.headers.authorization);
    
    try {
      // First, authenticate the user (same logic as /api/auth/me)
      let authenticatedUserId = req.session?.userId;
      
      // Check for token in Authorization header if session fails
      if (!authenticatedUserId && req.headers.authorization) {
        const token = req.headers.authorization.replace('Bearer ', '');
        console.log("Checking token:", token);
        
        // Extract user ID from token (simple format: user_ID_timestamp_random)
        const tokenParts = token.split('_');
        if (tokenParts.length >= 2 && tokenParts[0] === 'user') {
          authenticatedUserId = parseInt(tokenParts[1]);
          console.log("Token userId:", authenticatedUserId);
        }
      }
      
      if (!authenticatedUserId) {
        console.log("No authenticated userId found, returning 401");
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const userId = parseInt(req.params.userId);
      const { roleId } = req.body;
      
      console.log(`Parsed User ID: ${userId}, Role ID: ${roleId}`);
      console.log(`Authenticated User ID: ${authenticatedUserId}`);
      
      // Ensure user can only switch their own role
      if (authenticatedUserId !== userId) {
        console.log(`User ${authenticatedUserId} trying to switch role for user ${userId} - denied`);
        return res.status(403).json({ error: "Can only switch your own role" });
      }
      
      if (isNaN(userId) || isNaN(roleId)) {
        console.log(`Invalid parameters: userId=${userId}, roleId=${roleId}`);
        return res.status(400).json({ error: "Invalid user ID or role ID" });
      }

      // Get user's originally assigned roles (not their current active role)
      const userAssignedRoles = await storage.getUserRoles(userId);
      console.log(`User assigned roles:`, userAssignedRoles.map((r: any) => `${r.id}:${r.name}`));
      
      const isReturningToAssignedRole = userAssignedRoles.some((role: any) => role.id === roleId);
      console.log(`Is returning to assigned role: ${isReturningToAssignedRole}`);
      
      if (isReturningToAssignedRole) {
        // Always allow returning to originally assigned roles (training mode exit)
        console.log(`✓ Allowing return to assigned role: ${roleId}`);
        const updatedUser = await storage.switchUserRole(userId, roleId);
        res.json(updatedUser);
        return;
      }

      // For switching to demonstration roles, check if user has trainer/systems manager assigned
      const hasTrainerRole = userAssignedRoles.some((role: any) => 
        role.name === 'Trainer' || role.name === 'Systems Manager'
      );
      console.log(`User has trainer/systems manager role: ${hasTrainerRole}`);
      
      if (!hasTrainerRole) {
        console.log(`✗ Denying role switch - no trainer permissions`);
        return res.status(403).json({ error: "User does not have role switching permissions" });
      }

      console.log(`✓ Allowing demonstration role switch to: ${roleId}`);
      // For training purposes, allow switching to any role without assignment check
      const updatedUser = await storage.switchUserRole(userId, roleId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error switching user role:", error);
      res.status(500).json({ error: "Failed to switch role" });
    }
  });

  app.get("/api/users/:userId/current-role", async (req, res) => {
    try {
      const userIdParam = req.params.userId;
      
      // Handle demo users
      if (typeof userIdParam === 'string' && userIdParam.startsWith('demo_')) {
        const demoUsers = {
          'demo_support': { id: 'demo_support_role', name: 'Support Engineer' },
          'demo_director': { id: 'demo_director_role', name: 'Director' },
          'demo_plant': { id: 'demo_plant_role', name: 'Plant Manager' },
          'demo_scheduler': { id: 'demo_scheduler_role', name: 'Production Scheduler' },
          'demo_it_admin': { id: 'demo_it_admin_role', name: 'IT Administrator' },
          'demo_systems': { id: 'demo_systems_role', name: 'Systems Manager' },
          'demo_admin': { id: 'demo_admin_role', name: 'Administrator' },
          'demo_shop_floor': { id: 'demo_shop_floor_role', name: 'Shop Floor Operations' },
          'demo_analyst': { id: 'demo_analyst_role', name: 'Data Analyst' },
          'demo_trainer': { id: 'demo_trainer_role', name: 'Trainer' },
          'demo_it_systems': { id: 'demo_it_systems_role', name: 'IT Systems Administrator' },
          'demo_sales': { id: 'demo_sales_role', name: 'Sales Representative' },
          'demo_customer_service': { id: 'demo_customer_service_role', name: 'Customer Service Representative' },
          'demo_supply_chain': { id: 'demo_supply_chain_role', name: 'Supply Chain Planner' }
        };
        
        const demoRole = demoUsers[userIdParam as keyof typeof demoUsers];
        if (demoRole) {
          return res.json(demoRole);
        }
      }

      const userId = parseInt(userIdParam);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const currentRole = await storage.getUserCurrentRole(userId);
      res.json(currentRole);
    } catch (error) {
      console.error("Error fetching current role:", error);
      res.status(500).json({ error: "Failed to fetch current role" });
    }
  });

  // Permissions grouped by feature for role management
  app.get("/api/permissions/grouped", async (req, res) => {
    try {
      const permissions = await storage.getPermissionsGroupedByFeature();
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching grouped permissions:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  // Optimization Studio API Routes
  // Optimization Algorithms
  app.get("/api/optimization/algorithms", async (req, res) => {
    try {
      const { category, status } = req.query;
      const algorithms = await storage.getOptimizationAlgorithms(
        category as string, 
        status as string
      );
      res.json(algorithms);
    } catch (error) {
      console.error("Error fetching optimization algorithms:", error);
      res.status(500).json({ error: "Failed to fetch optimization algorithms" });
    }
  });

  app.get("/api/optimization/algorithms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid algorithm ID" });
      }

      const algorithm = await storage.getOptimizationAlgorithm(id);
      if (!algorithm) {
        return res.status(404).json({ error: "Algorithm not found" });
      }
      res.json(algorithm);
    } catch (error) {
      console.error("Error fetching optimization algorithm:", error);
      res.status(500).json({ error: "Failed to fetch optimization algorithm" });
    }
  });

  app.post("/api/optimization/algorithms", requireAuth, async (req, res) => {
    try {
      const userId = typeof req.user.id === 'string' ? 1 : req.user.id; // Handle demo users
      
      const algorithmData = {
        ...req.body,
        createdBy: userId
      };

      const algorithm = await storage.createOptimizationAlgorithm(algorithmData);
      res.status(201).json(algorithm);
    } catch (error) {
      console.error("Error creating optimization algorithm:", error);
      res.status(500).json({ error: "Failed to create optimization algorithm" });
    }
  });

  app.put("/api/optimization/algorithms/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid algorithm ID" });
      }

      const algorithm = await storage.updateOptimizationAlgorithm(id, req.body);
      if (!algorithm) {
        return res.status(404).json({ error: "Algorithm not found" });
      }
      res.json(algorithm);
    } catch (error) {
      console.error("Error updating optimization algorithm:", error);
      res.status(500).json({ error: "Failed to update optimization algorithm" });
    }
  });

  app.delete("/api/optimization/algorithms/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid algorithm ID" });
      }

      const success = await storage.deleteOptimizationAlgorithm(id);
      if (!success) {
        return res.status(404).json({ error: "Algorithm not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting optimization algorithm:", error);
      res.status(500).json({ error: "Failed to delete optimization algorithm" });
    }
  });

  app.post("/api/optimization/algorithms/:id/approve", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = typeof req.user.id === 'string' ? 1 : req.user.id; // Handle demo users
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid algorithm ID" });
      }

      const algorithm = await storage.approveOptimizationAlgorithm(id, userId, req.body.comments);
      if (!algorithm) {
        return res.status(404).json({ error: "Algorithm not found" });
      }
      res.json(algorithm);
    } catch (error) {
      console.error("Error approving optimization algorithm:", error);
      res.status(500).json({ error: "Failed to approve optimization algorithm" });
    }
  });

  app.post("/api/optimization/algorithms/:id/deploy", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid algorithm ID" });
      }

      const { targetModule, environment } = req.body;
      const algorithm = await storage.deployOptimizationAlgorithm(id, targetModule, environment);
      if (!algorithm) {
        return res.status(404).json({ error: "Algorithm not found" });
      }
      res.json(algorithm);
    } catch (error) {
      console.error("Error deploying optimization algorithm:", error);
      res.status(500).json({ error: "Failed to deploy optimization algorithm" });
    }
  });

  app.get("/api/optimization/standard-algorithms", async (req, res) => {
    try {
      const { category } = req.query;
      const algorithms = await storage.getStandardAlgorithms(category as string);
      res.json(algorithms);
    } catch (error) {
      console.error("Error fetching standard algorithms:", error);
      res.status(500).json({ error: "Failed to fetch standard algorithms" });
    }
  });

  // Backwards Scheduling Algorithm
  app.post("/api/optimization/algorithms/backwards-scheduling/run", requireAuth, async (req, res) => {
    try {
      const { parameters, jobs, resources, operations } = req.body;
      
      // Input validation
      if (!parameters || !Array.isArray(jobs) || !Array.isArray(resources) || !Array.isArray(operations)) {
        return res.status(400).json({ error: "Invalid input data" });
      }

      // Backwards scheduling algorithm implementation
      const schedule = [];
      
      // Calculate frozen horizon date if enabled
      let frozenHorizonDate = null;
      if (parameters.frozenHorizonEnabled && parameters.frozenHorizonDays > 0) {
        frozenHorizonDate = new Date();
        frozenHorizonDate.setDate(frozenHorizonDate.getDate() + parameters.frozenHorizonDays);
      }
      
      // 1. Sort jobs by priority and due date
      const sortedJobs = [...jobs].sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const priorityDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      // 2. Process each job
      for (const job of sortedJobs) {
        const jobOperations = operations.filter(op => op.jobId === job.id);
        
        // Sort operations by sequence (reverse for backwards scheduling)
        const sortedOps = jobOperations.sort((a, b) => (b.sequence || 0) - (a.sequence || 0));
        
        let currentEndTime = new Date(job.dueDate);
        
        for (const operation of sortedOps) {
          // Check if operation is within frozen horizon
          if (frozenHorizonDate && operation.scheduledStartDate) {
            const operationStartDate = new Date(operation.scheduledStartDate);
            if (operationStartDate <= frozenHorizonDate) {
              // Operation is within frozen horizon - keep existing schedule
              const assignedResource = resources.find(r => r.id === operation.resourceId) || resources[0];
              schedule.push({
                operationId: operation.id,
                jobId: job.id,
                jobName: job.name,
                operationName: operation.name,
                resourceId: operation.resourceId || resources[0]?.id,
                resourceName: assignedResource?.name || 'Unknown Resource',
                startTime: operation.scheduledStartDate,
                endTime: operation.scheduledEndDate || new Date(operationStartDate.getTime() + (operation.estimatedDuration || 4) * 60 * 60 * 1000).toISOString(),
                duration: operation.estimatedDuration || 4,
                frozen: true
              });
              
              // Update current end time based on frozen operation
              currentEndTime = new Date(operation.scheduledStartDate);
              continue;
            }
          }
          
          // Find suitable resource
          const suitableResources = resources.filter(resource => {
            const resourceCapabilities = resource.capabilities || [];
            const requiredCapabilities = operation.requiredCapabilities || [];
            return requiredCapabilities.every(reqCap => 
              resourceCapabilities.some(resCap => resCap.id === reqCap.id || resCap.name === reqCap.name)
            );
          });

          if (suitableResources.length > 0) {
            // Select resource with lowest utilization
            const selectedResource = suitableResources[0];
            
            // Calculate operation duration (default 4 hours if not specified)
            const duration = operation.estimatedDuration || 4;
            
            // Calculate start time (end time minus duration)
            const startTime = new Date(currentEndTime.getTime() - (duration * 60 * 60 * 1000));
            
            // Apply buffer time
            const bufferHours = parameters.bufferTime || 0.5;
            const bufferedStartTime = new Date(startTime.getTime() - (bufferHours * 60 * 60 * 1000));
            
            // Adjust for working hours if needed
            let finalStartTime = bufferedStartTime;
            let finalEndTime = startTime;
            
            if (!parameters.allowOvertime) {
              // Adjust to working hours (simplified - just move to previous working day if needed)
              const workStart = parameters.workingHoursStart || 8;
              const workEnd = parameters.workingHoursEnd || 17;
              
              if (finalStartTime.getHours() < workStart) {
                const prevDay = new Date(finalStartTime);
                prevDay.setDate(prevDay.getDate() - 1);
                prevDay.setHours(workEnd - duration);
                finalStartTime = prevDay;
                finalEndTime = new Date(prevDay.getTime() + (duration * 60 * 60 * 1000));
              }
            }
            
            // Calculate optimization insights for this operation
            const dueDate = new Date(job.dueDate);
            const timeToDeadline = (dueDate.getTime() - finalEndTime.getTime()) / (1000 * 60 * 60); // hours
            const scheduleDeviation = Math.round(timeToDeadline);
            
            // Determine optimization flags
            let isEarly = false;
            let isLate = false;
            let isBottleneck = false;
            let criticality = 'normal';
            let optimizationNotes = '';
            
            // Early/Late detection
            if (timeToDeadline > 24) {
              isEarly = true;
              optimizationNotes = `Operation scheduled ${Math.round(timeToDeadline)} hours before job due date. Consider moving closer to deadline to reduce WIP inventory.`;
            } else if (timeToDeadline < 0) {
              isLate = true;
              optimizationNotes = `Operation scheduled ${Math.abs(Math.round(timeToDeadline))} hours after job due date. Requires immediate attention to meet delivery commitments.`;
            }
            
            // Bottleneck detection (simplified - based on resource utilization)
            const resourceScheduleCount = schedule.filter(s => s.resourceId === selectedResource.id).length;
            if (resourceScheduleCount >= 3) {
              isBottleneck = true;
              optimizationNotes += ` Resource ${selectedResource.name} is heavily utilized and may become a bottleneck.`;
            }
            
            // Criticality assessment
            if (job.priority === 'critical' || job.priority === 'high') {
              criticality = job.priority;
              optimizationNotes += ` High priority job requires careful monitoring and expedited processing.`;
            }
            
            schedule.push({
              operationId: operation.id,
              jobId: job.id,
              jobName: job.name,
              operationName: operation.name,
              resourceId: selectedResource.id,
              resourceName: selectedResource.name,
              startTime: finalStartTime.toISOString(),
              endTime: finalEndTime.toISOString(),
              duration: duration,
              frozen: false,
              optimizationFlags: {
                isEarly,
                isLate,
                isBottleneck,
                criticality,
                scheduleDeviation,
                optimizationNotes: optimizationNotes.trim()
              }
            });
            
            // Update current end time for next operation
            currentEndTime = finalStartTime;
          }
        }
      }

      // Calculate statistics
      const frozenOperations = schedule.filter(op => op.frozen).length;
      const rescheduledOperations = schedule.filter(op => !op.frozen).length;
      
      res.json({
        success: true,
        schedule: schedule,
        parameters: parameters,
        stats: {
          totalOperations: operations.length,
          scheduledOperations: schedule.length,
          jobsProcessed: sortedJobs.length,
          frozenOperations: frozenOperations,
          rescheduledOperations: rescheduledOperations
        }
      });
    } catch (error) {
      console.error("Error running backwards scheduling algorithm:", error);
      res.status(500).json({ error: "Failed to run backwards scheduling algorithm" });
    }
  });

  // Optimization Execute Endpoint
  app.post("/api/optimization/execute", requireAuth, async (req, res) => {
    try {
      const { algorithmId, parameters, scope } = req.body;
      
      if (!algorithmId) {
        return res.status(400).json({ error: "Algorithm ID is required" });
      }
      
      // Get algorithm details
      const algorithm = await storage.getOptimizationAlgorithm(algorithmId);
      if (!algorithm) {
        return res.status(404).json({ error: "Algorithm not found" });
      }
      
      if (algorithm.status !== 'approved') {
        return res.status(400).json({ error: "Algorithm must be approved before execution" });
      }
      
      // Get current jobs, operations, and resources for optimization
      const jobs = await storage.getJobs();
      const operations = await storage.getOperations();
      const resources = await storage.getResources();
      
      // Filter by scope if provided
      let filteredJobs = jobs;
      let filteredOperations = operations;
      let filteredResources = resources;
      
      if (scope?.jobIds && scope.jobIds.length > 0) {
        filteredJobs = jobs.filter(j => scope.jobIds.includes(j.id));
        filteredOperations = operations.filter(op => 
          filteredJobs.some(j => j.id === op.jobId)
        );
      }
      
      if (scope?.resourceIds && scope.resourceIds.length > 0) {
        filteredResources = resources.filter(r => scope.resourceIds.includes(r.id));
      }
      
      // Execute the specific algorithm based on its name
      let schedule = null;
      
      if (algorithm.name === 'backwards-scheduling-v1') {
        // Call the backwards scheduling algorithm
        const backwardsResponse = await fetch(`http://localhost:5000/api/optimization/algorithms/backwards-scheduling/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization || ''
          },
          body: JSON.stringify({
            parameters: parameters || {},
            jobs: filteredJobs,
            resources: filteredResources,
            operations: filteredOperations
          })
        });
        
        const backwardsResult = await backwardsResponse.json();
        if (backwardsResult.success) {
          schedule = backwardsResult.schedule;
        } else {
          throw new Error('Backwards scheduling failed');
        }
      } else {
        return res.status(400).json({ error: "Unsupported algorithm type" });
      }
      
      if (!schedule || schedule.length === 0) {
        return res.status(400).json({ error: "No schedule generated" });
      }
      
      // Update operations with scheduled start/end times and optimization flags
      for (const scheduledOp of schedule) {
        const operation = await storage.getOperation(scheduledOp.operationId);
        if (operation) {
          const updateData = {
            scheduledStartDate: new Date(scheduledOp.startTime),
            scheduledEndDate: new Date(scheduledOp.endTime),
            assignedResourceId: scheduledOp.resourceId
          };
          
          // Add optimization flags if present
          if (scheduledOp.optimizationFlags) {
            updateData.isEarly = scheduledOp.optimizationFlags.isEarly;
            updateData.isLate = scheduledOp.optimizationFlags.isLate;
            updateData.isBottleneck = scheduledOp.optimizationFlags.isBottleneck;
            updateData.criticality = scheduledOp.optimizationFlags.criticality;
            updateData.timeVarianceHours = scheduledOp.optimizationFlags.scheduleDeviation;
            updateData.optimizationNotes = scheduledOp.optimizationFlags.optimizationNotes;
          }
          
          await storage.updateOperation(scheduledOp.operationId, updateData);
        }
      }
      
      // Update jobs with calculated start/end dates
      const jobSchedules = new Map();
      for (const scheduledOp of schedule) {
        const operation = await storage.getOperation(scheduledOp.operationId);
        if (operation && operation.jobId) {
          if (!jobSchedules.has(operation.jobId)) {
            jobSchedules.set(operation.jobId, {
              earliest: new Date(scheduledOp.startTime),
              latest: new Date(scheduledOp.endTime)
            });
          } else {
            const existing = jobSchedules.get(operation.jobId);
            const startTime = new Date(scheduledOp.startTime);
            const endTime = new Date(scheduledOp.endTime);
            
            if (startTime < existing.earliest) {
              existing.earliest = startTime;
            }
            if (endTime > existing.latest) {
              existing.latest = endTime;
            }
          }
        }
      }
      
      // Update jobs with scheduled dates
      for (const [jobId, times] of jobSchedules.entries()) {
        await storage.updateJob(jobId, {
          scheduledStartDate: times.earliest,
          scheduledEndDate: times.latest
        });
      }
      
      res.json({
        success: true,
        message: "Optimization completed successfully",
        scheduledOperations: schedule.length,
        updatedJobs: jobSchedules.size,
        algorithm: algorithm.name,
        executionTime: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error executing optimization:", error);
      res.status(500).json({ error: "Failed to execute optimization" });
    }
  });

  // Algorithm Tests
  app.get("/api/optimization/tests", async (req, res) => {
    try {
      const { algorithmId, testType } = req.query;
      const tests = await storage.getAlgorithmTests(
        algorithmId ? parseInt(algorithmId as string) : undefined,
        testType as string
      );
      res.json(tests);
    } catch (error) {
      console.error("Error fetching algorithm tests:", error);
      res.status(500).json({ error: "Failed to fetch algorithm tests" });
    }
  });

  app.post("/api/optimization/tests", requireAuth, async (req, res) => {
    try {
      const userId = typeof req.user.id === 'string' ? 1 : req.user.id; // Handle demo users
      
      const testData = {
        ...req.body,
        createdBy: userId
      };

      const test = await storage.createAlgorithmTest(testData);
      res.status(201).json(test);
    } catch (error) {
      console.error("Error creating algorithm test:", error);
      res.status(500).json({ error: "Failed to create algorithm test" });
    }
  });

  app.post("/api/optimization/tests/:id/run", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid test ID" });
      }

      const { datasetType } = req.body;
      const test = await storage.runAlgorithmTest(id, datasetType);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }
      res.json(test);
    } catch (error) {
      console.error("Error running algorithm test:", error);
      res.status(500).json({ error: "Failed to run algorithm test" });
    }
  });

  // Algorithm Deployments
  app.get("/api/optimization/deployments", async (req, res) => {
    try {
      const { algorithmId, targetModule } = req.query;
      const deployments = await storage.getAlgorithmDeployments(
        algorithmId ? parseInt(algorithmId as string) : undefined,
        targetModule as string
      );
      res.json(deployments);
    } catch (error) {
      console.error("Error fetching algorithm deployments:", error);
      res.status(500).json({ error: "Failed to fetch algorithm deployments" });
    }
  });

  app.post("/api/optimization/deployments", requireAuth, async (req, res) => {
    try {
      const userId = typeof req.user.id === 'string' ? 1 : req.user.id; // Handle demo users
      
      const deploymentData = {
        ...req.body,
        deployedBy: userId
      };

      const deployment = await storage.createAlgorithmDeployment(deploymentData);
      res.status(201).json(deployment);
    } catch (error) {
      console.error("Error creating algorithm deployment:", error);
      res.status(500).json({ error: "Failed to create algorithm deployment" });
    }
  });

  app.post("/api/optimization/deployments/:id/activate", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid deployment ID" });
      }

      const deployment = await storage.activateDeployment(id);
      if (!deployment) {
        return res.status(404).json({ error: "Deployment not found" });
      }
      res.json(deployment);
    } catch (error) {
      console.error("Error activating deployment:", error);
      res.status(500).json({ error: "Failed to activate deployment" });
    }
  });

  app.post("/api/optimization/deployments/:id/rollback", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid deployment ID" });
      }

      const deployment = await storage.rollbackDeployment(id);
      if (!deployment) {
        return res.status(404).json({ error: "Deployment not found" });
      }
      res.json(deployment);
    } catch (error) {
      console.error("Error rolling back deployment:", error);
      res.status(500).json({ error: "Failed to rollback deployment" });
    }
  });

  // Extension Data
  app.get("/api/optimization/extension-data", async (req, res) => {
    try {
      const { algorithmId, entityType, entityId } = req.query;
      const data = await storage.getExtensionData(
        algorithmId ? parseInt(algorithmId as string) : undefined,
        entityType as string,
        entityId ? parseInt(entityId as string) : undefined
      );
      res.json(data);
    } catch (error) {
      console.error("Error fetching extension data:", error);
      res.status(500).json({ error: "Failed to fetch extension data" });
    }
  });

  app.post("/api/optimization/extension-data", requireAuth, async (req, res) => {
    try {
      const data = await storage.createExtensionData(req.body);
      res.status(201).json(data);
    } catch (error) {
      console.error("Error creating extension data:", error);
      res.status(500).json({ error: "Failed to create extension data" });
    }
  });

  app.put("/api/optimization/extension-data/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid extension data ID" });
      }

      const data = await storage.updateExtensionData(id, req.body);
      if (!data) {
        return res.status(404).json({ error: "Extension data not found" });
      }
      res.json(data);
    } catch (error) {
      console.error("Error updating extension data:", error);
      res.status(500).json({ error: "Failed to update extension data" });
    }
  });

  app.delete("/api/optimization/extension-data/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid extension data ID" });
      }

      const success = await storage.deleteExtensionData(id);
      if (!success) {
        return res.status(404).json({ error: "Extension data not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting extension data:", error);
      res.status(500).json({ error: "Failed to delete extension data" });
    }
  });

  app.get("/api/optimization/extension-data/entity/:entityType/:entityId", async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const entityIdNum = parseInt(entityId);
      if (isNaN(entityIdNum)) {
        return res.status(400).json({ error: "Invalid entity ID" });
      }

      const data = await storage.getExtensionDataByEntity(entityType, entityIdNum);
      res.json(data);
    } catch (error) {
      console.error("Error fetching extension data by entity:", error);
      res.status(500).json({ error: "Failed to fetch extension data by entity" });
    }
  });

  app.get("/api/optimization/extension-fields/:algorithmId", async (req, res) => {
    try {
      const algorithmId = parseInt(req.params.algorithmId);
      if (isNaN(algorithmId)) {
        return res.status(400).json({ error: "Invalid algorithm ID" });
      }

      const fields = await storage.getExtensionDataFields(algorithmId);
      res.json(fields);
    } catch (error) {
      console.error("Error fetching extension fields:", error);
      res.status(500).json({ error: "Failed to fetch extension fields" });
    }
  });

  // Visual Factory routes
  app.get('/api/visual-factory/displays', async (req, res) => {
    try {
      const displays = await storage.getVisualFactoryDisplays();
      res.json(displays);
    } catch (error) {
      console.error('Error fetching visual factory displays:', error);
      res.status(500).json({ error: 'Failed to fetch displays' });
    }
  });

  app.get('/api/visual-factory/displays/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const display = await storage.getVisualFactoryDisplay(id);
      if (!display) {
        return res.status(404).json({ error: 'Display not found' });
      }
      res.json(display);
    } catch (error) {
      console.error('Error fetching visual factory display:', error);
      res.status(500).json({ error: 'Failed to fetch display' });
    }
  });

  app.post('/api/visual-factory/displays', async (req, res) => {
    try {
      const display = await storage.createVisualFactoryDisplay(req.body);
      res.json(display);
    } catch (error) {
      console.error('Error creating visual factory display:', error);
      res.status(500).json({ error: 'Failed to create display' });
    }
  });

  app.put('/api/visual-factory/displays/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const display = await storage.updateVisualFactoryDisplay(id, req.body);
      if (!display) {
        return res.status(404).json({ error: 'Display not found' });
      }
      res.json(display);
    } catch (error) {
      console.error('Error updating visual factory display:', error);
      res.status(500).json({ error: 'Failed to update display' });
    }
  });

  app.delete('/api/visual-factory/displays/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteVisualFactoryDisplay(id);
      if (!success) {
        return res.status(404).json({ error: 'Display not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting visual factory display:', error);
      res.status(500).json({ error: 'Failed to delete display' });
    }
  });

  // AI-powered Visual Factory content generation
  app.post('/api/visual-factory/ai/generate-content', requireAuth, async (req, res) => {
    try {
      const { prompt, audience, location, displayType, includeRealTime } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      // Get current system data for context
      const jobs = await storage.getJobs();
      const operations = await storage.getOperations(); 
      const resources = await storage.getResources();
      
      // Create system context for AI
      const systemContext = `You are an AI assistant that creates engaging visual factory displays for manufacturing environments.
      
Current System Data:
- Active Jobs: ${jobs.length} (${jobs.filter(j => j.status === 'in-progress').length} in progress)
- Total Operations: ${operations.length} (${operations.filter(o => o.status === 'scheduled' || o.status === 'in-progress').length} active)
- Resources: ${resources.length} available

Context:
- Location: ${location || 'Manufacturing Floor'}
- Target Audience: ${audience || 'General'}
- Display Type: ${displayType || 'Large Screen Display'}
- Include Real-time Data: ${includeRealTime ? 'Yes' : 'No'}

Your task is to generate a visual factory display configuration that is:
1. Engaging and easy to read from a distance
2. Relevant to the target audience
3. Uses appropriate widgets and layouts
4. Includes valuable metrics and information
5. Optimized for cycling between different content types

Return a JSON response with this structure:
{
  "displayConfig": {
    "name": "Generated Display Name",
    "description": "Brief description of the display purpose",
    "audience": "${audience || 'general'}",
    "autoRotationInterval": 30,
    "widgets": [
      {
        "id": "unique-id",
        "type": "metrics|schedule|orders|alerts|progress|announcements|chart",
        "title": "Widget Title",
        "position": {"x": 0, "y": 0, "width": 4, "height": 2},
        "config": {},
        "priority": 1-10,
        "audienceRelevance": {"${audience || 'general'}": 10}
      }
    ]
  },
  "insights": "Brief explanation of why this configuration works well for the specified context"
}`;

      const openai = new (await import("openai")).default({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemContext },
          { role: "user", content: `Create a visual factory display for: ${prompt}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content);
      res.json(result);

    } catch (error) {
      console.error('Error generating AI content:', error);
      res.status(500).json({ error: 'Failed to generate AI content' });
    }
  });

  // Generate adaptive content based on current system state
  app.post('/api/visual-factory/ai/adaptive-content', requireAuth, async (req, res) => {
    try {
      const { displayId, timeOfDay, audience } = req.body;
      
      // Get current system metrics
      const jobs = await storage.getJobs();
      const operations = await storage.getOperations();
      const resources = await storage.getResources();
      
      // Calculate key metrics
      const activeJobs = jobs.filter(j => j.status === 'in-progress');
      const overdueJobs = jobs.filter(j => new Date(j.dueDate) < new Date() && j.status !== 'completed');
      const scheduledOps = operations.filter(o => o.status === 'scheduled');
      const inProgressOps = operations.filter(o => o.status === 'in-progress');
      
      // Determine priority content based on context
      let contentPriorities = [];
      
      if (overdueJobs.length > 0) {
        contentPriorities.push({
          type: 'urgent-orders',
          priority: 10,
          data: { overdueCount: overdueJobs.length }
        });
      }
      
      if (timeOfDay === 'morning' || timeOfDay === 'shift-start') {
        contentPriorities.push({
          type: 'daily-schedule',
          priority: 9,
          data: { scheduledCount: scheduledOps.length }
        });
      }
      
      if (audience === 'management' || audience === 'general') {
        contentPriorities.push({
          type: 'production-metrics',
          priority: 8,
          data: { 
            activeJobs: activeJobs.length,
            inProgressOps: inProgressOps.length,
            totalResources: resources.length
          }
        });
      }

      // Generate adaptive widget configuration
      const adaptiveWidgets = contentPriorities.map((content, index) => {
        const baseConfig = {
          id: `adaptive-${content.type}-${Date.now()}`,
          priority: content.priority,
          audienceRelevance: { [audience || 'general']: content.priority }
        };

        switch (content.type) {
          case 'urgent-orders':
            return {
              ...baseConfig,
              type: 'alerts',
              title: `🚨 Urgent: ${content.data.overdueCount} Overdue Orders`,
              position: { x: 0, y: 0, width: 6, height: 2 },
              config: { 
                alertLevel: 'critical',
                showCount: true,
                overdueJobs: content.data.overdueCount
              }
            };
          
          case 'daily-schedule':
            return {
              ...baseConfig,
              type: 'schedule',
              title: `Today's Production Schedule`,
              position: { x: 0, y: 2, width: 8, height: 4 },
              config: { 
                timeRange: 'today',
                showOperations: content.data.scheduledCount,
                highlightCurrent: true
              }
            };
            
          case 'production-metrics':
            return {
              ...baseConfig,
              type: 'metrics',
              title: 'Live Production Overview',
              position: { x: 8, y: 0, width: 4, height: 3 },
              config: {
                showJobs: true,
                activeJobs: content.data.activeJobs,
                inProgressOps: content.data.inProgressOps,
                totalResources: content.data.totalResources,
                refreshInterval: 30
              }
            };
            
          default:
            return {
              ...baseConfig,
              type: 'announcements',
              title: 'System Updates',
              position: { x: 6, y: 6, width: 6, height: 2 },
              config: { showLatest: true }
            };
        }
      });

      res.json({
        adaptiveContent: {
          widgets: adaptiveWidgets,
          recommendedInterval: overdueJobs.length > 0 ? 20 : 45,
          contextInfo: {
            timeOfDay,
            audience,
            urgentItems: overdueJobs.length,
            scheduledItems: scheduledOps.length
          }
        },
        insights: `Generated ${adaptiveWidgets.length} adaptive widgets based on current system state and ${audience} audience needs.`
      });

    } catch (error) {
      console.error('Error generating adaptive content:', error);
      res.status(500).json({ error: 'Failed to generate adaptive content' });
    }
  });

  // Get live data for Visual Factory displays
  app.get('/api/visual-factory/live-data', async (req, res) => {
    try {
      const { audience, metrics } = req.query;
      
      // Fetch all required data
      const [jobs, operations, resources] = await Promise.all([
        storage.getJobs(),
        storage.getOperations(),
        storage.getResources()
      ]);
      
      // Calculate real-time metrics
      const liveData = {
        timestamp: new Date().toISOString(),
        production: {
          activeJobs: jobs.filter(j => j.status === 'in-progress').length,
          completedJobs: jobs.filter(j => j.status === 'completed').length,
          totalJobs: jobs.length,
          overdueJobs: jobs.filter(j => new Date(j.dueDate) < new Date() && j.status !== 'completed').length
        },
        operations: {
          scheduled: operations.filter(o => o.status === 'scheduled').length,
          inProgress: operations.filter(o => o.status === 'in-progress').length,
          completed: operations.filter(o => o.status === 'completed').length,
          total: operations.length
        },
        resources: {
          available: resources.filter(r => r.isAvailable !== false).length,
          total: resources.length,
          utilizationRate: Math.round((operations.filter(o => o.status === 'in-progress').length / resources.length) * 100)
        },
        performance: {
          onTimeDelivery: Math.round(85 + Math.random() * 10), // Simulate live metric
          efficiency: Math.round(78 + Math.random() * 15),
          quality: Math.round(92 + Math.random() * 6)
        },
        alerts: {
          critical: jobs.filter(j => new Date(j.dueDate) < new Date() && j.status !== 'completed').length,
          warnings: Math.floor(Math.random() * 3),
          info: Math.floor(Math.random() * 5)
        }
      };
      
      res.json(liveData);
      
    } catch (error) {
      console.error('Error fetching live data:', error);
      res.status(500).json({ error: 'Failed to fetch live data' });
    }
  });

  // User Secrets Management API Routes
  app.get('/api/user-secrets', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const secrets = await storage.getUserSecrets(userId);
      
      // Don't send the encrypted values to the frontend for security
      const safeSecrets = secrets.map(secret => ({
        ...secret,
        encryptedValue: undefined // Remove the encrypted value
      }));
      
      res.json(safeSecrets);
    } catch (error) {
      console.error('Error fetching user secrets:', error);
      res.status(500).json({ error: 'Failed to fetch user secrets' });
    }
  });

  app.post('/api/user-secrets', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const validation = insertUserSecretSchema.safeParse({
        ...req.body,
        userId
      });
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid secret data', 
          details: validation.error.errors 
        });
      }

      // Simple encryption for demonstration - in production use proper encryption
      const encryptedValue = Buffer.from(validation.data.encryptedValue).toString('base64');
      
      const secret = await storage.createUserSecret({
        ...validation.data,
        encryptedValue
      });
      
      // Don't return the encrypted value
      const safeSecret = { ...secret, encryptedValue: undefined };
      res.status(201).json(safeSecret);
    } catch (error) {
      console.error('Error creating user secret:', error);
      res.status(500).json({ error: 'Failed to create user secret' });
    }
  });

  app.put('/api/user-secrets/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid secret ID' });
      }

      // Verify the secret belongs to the user
      const existingSecret = await storage.getUserSecret(id);
      if (!existingSecret || existingSecret.userId !== userId) {
        return res.status(404).json({ error: 'Secret not found' });
      }

      const updateData = { ...req.body };
      
      // If updating the value, encrypt it
      if (updateData.encryptedValue) {
        updateData.encryptedValue = Buffer.from(updateData.encryptedValue).toString('base64');
      }
      
      const updatedSecret = await storage.updateUserSecret(id, updateData);
      if (!updatedSecret) {
        return res.status(404).json({ error: 'Secret not found' });
      }
      
      // Don't return the encrypted value
      const safeSecret = { ...updatedSecret, encryptedValue: undefined };
      res.json(safeSecret);
    } catch (error) {
      console.error('Error updating user secret:', error);
      res.status(500).json({ error: 'Failed to update user secret' });
    }
  });

  app.delete('/api/user-secrets/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid secret ID' });
      }

      // Verify the secret belongs to the user
      const existingSecret = await storage.getUserSecret(id);
      if (!existingSecret || existingSecret.userId !== userId) {
        return res.status(404).json({ error: 'Secret not found' });
      }

      const success = await storage.deleteUserSecret(id);
      if (!success) {
        return res.status(404).json({ error: 'Secret not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user secret:', error);
      res.status(500).json({ error: 'Failed to delete user secret' });
    }
  });

  // Demo Tour Participants Routes
  app.get('/api/demo-tour-participants', async (req, res) => {
    try {
      const participants = await storage.getDemoTourParticipants();
      res.json(participants);
    } catch (error) {
      console.error('Error fetching demo tour participants:', error);
      res.status(500).json({ error: 'Failed to fetch demo tour participants' });
    }
  });

  app.get('/api/demo-tour-participants/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const participant = await storage.getDemoTourParticipant(id);
      if (!participant) {
        return res.status(404).json({ error: 'Demo tour participant not found' });
      }
      res.json(participant);
    } catch (error) {
      console.error('Error fetching demo tour participant:', error);
      res.status(500).json({ error: 'Failed to fetch demo tour participant' });
    }
  });

  app.get('/api/demo-tour-participants/email/:email', async (req, res) => {
    try {
      const email = req.params.email;
      const participant = await storage.getDemoTourParticipantByEmail(email);
      if (!participant) {
        return res.status(404).json({ error: 'Demo tour participant not found' });
      }
      res.json(participant);
    } catch (error) {
      console.error('Error fetching demo tour participant by email:', error);
      res.status(500).json({ error: 'Failed to fetch demo tour participant' });
    }
  });

  app.post('/api/demo-tour-participants', async (req, res) => {
    try {
      console.log('Creating demo tour participant with data:', req.body);
      const parsedData = insertDemoTourParticipantSchema.parse(req.body);
      console.log('Parsed data:', parsedData);
      const participant = await storage.createDemoTourParticipant(parsedData);
      console.log('Participant created successfully:', participant);
      res.status(201).json(participant);
    } catch (error) {
      console.error('Error creating demo tour participant:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      res.status(500).json({ error: 'Failed to create demo tour participant', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put('/api/demo-tour-participants/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsedData = insertDemoTourParticipantSchema.partial().parse(req.body);
      const participant = await storage.updateDemoTourParticipant(id, parsedData);
      if (!participant) {
        return res.status(404).json({ error: 'Demo tour participant not found' });
      }
      res.json(participant);
    } catch (error) {
      console.error('Error updating demo tour participant:', error);
      res.status(500).json({ error: 'Failed to update demo tour participant' });
    }
  });

  app.post('/api/demo-tour-participants/:id/complete', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { feedback } = req.body;
      const participant = await storage.completeDemoTour(id, feedback);
      if (!participant) {
        return res.status(404).json({ error: 'Demo tour participant not found' });
      }
      res.json(participant);
    } catch (error) {
      console.error('Error completing demo tour:', error);
      res.status(500).json({ error: 'Failed to complete demo tour' });
    }
  });

  app.post('/api/demo-tour-participants/:id/steps', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const step = req.body;
      const success = await storage.addTourStep(id, step);
      if (!success) {
        return res.status(404).json({ error: 'Demo tour participant not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error adding tour step:', error);
      res.status(500).json({ error: 'Failed to add tour step' });
    }
  });

  // Voice Recordings Cache API routes
  app.get('/api/voice-cache/:textHash', async (req, res) => {
    try {
      const textHash = req.params.textHash;
      const recording = await storage.getVoiceRecording(textHash);
      
      if (!recording) {
        return res.status(404).json({ error: 'Voice recording not found' });
      }

      // Update usage count
      await storage.updateVoiceRecordingUsage(recording.id);
      
      res.json({
        id: recording.id,
        audioData: recording.audioData,
        voice: recording.voice,
        duration: recording.duration,
        usageCount: recording.usageCount + 1
      });
    } catch (error) {
      console.error('Error fetching cached voice recording:', error);
      res.status(500).json({ error: 'Failed to fetch cached voice recording' });
    }
  });

  app.post('/api/voice-cache', async (req, res) => {
    try {
      const validation = insertVoiceRecordingsCacheSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid voice recording data', details: validation.error.errors });
      }

      // Create text hash for caching
      const textHash = crypto.createHash('sha256').update(validation.data.textHash).digest('hex');
      
      const recordingData = {
        ...validation.data,
        textHash,
        fileSize: Buffer.byteLength(validation.data.audioData, 'base64')
      };

      const recording = await storage.createVoiceRecording(recordingData);
      res.status(201).json(recording);
    } catch (error) {
      console.error('Error creating voice recording cache:', error);
      res.status(500).json({ error: 'Failed to create voice recording cache' });
    }
  });

  // Track active voice generation requests to prevent duplicates
  const activeVoiceRequests = new Map<string, Promise<Buffer>>();

  // AI Text-to-Speech endpoint with caching for high-quality voice generation
  app.post("/api/ai/text-to-speech", async (req, res) => {
    try {
      const { text, voice = "alloy", gender = "female", speed = 1.1, role = "demo", stepId = "", cacheOnly = false } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      // Create hash for cache lookup
      const cacheKey = `${text}-${voice}-${gender}-${speed}`;
      const textHash = crypto.createHash('sha256').update(cacheKey).digest('hex');

      // Check cache first - enable caching for permanent voice storage
      console.log(`Checking for existing voice generation or cache for hash: ${textHash}`);
      
      // If this exact request is already being processed, wait for it
      if (activeVoiceRequests.has(textHash)) {
        console.log(`Waiting for existing voice generation request: ${textHash}`);
        try {
          const buffer = await activeVoiceRequests.get(textHash)!;
          res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': buffer.length,
            'Cache-Control': 'public, max-age=7200',
            'X-Content-Type-Options': 'nosniff',
            'X-Voice-Cache': 'deduplicated'
          });
          return res.send(buffer);
        } catch (error) {
          console.error(`Error waiting for existing request: ${error}`);
          // If waiting failed, continue to generate new audio
        }
      }
      // Check database cache for existing recording
      const cachedRecording = await storage.getVoiceRecording(textHash);
      
      if (cachedRecording) {
        console.log(`Found cached recording, usage count: ${cachedRecording.usageCount || 0}`);
        await storage.updateVoiceRecordingUsage(cachedRecording.id);
        
        // Return cached audio
        const audioBuffer = Buffer.from(cachedRecording.audioData, 'base64');
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length,
          'Cache-Control': 'public, max-age=7200',
          'X-Content-Type-Options': 'nosniff',
          'X-Voice-Cache': 'hit'
        });
        return res.send(audioBuffer);
      }

      // If cacheOnly is true and no cached recording found, return error
      if (cacheOnly) {
        console.log(`Cache-only request but no cached recording found for hash: ${textHash}`);
        return res.status(404).json({ error: "No cached voice recording found for this text" });
      }

      // Map enhanced voice names to OpenAI voices and adjust speed
      const voiceMapping: { [key: string]: { voice: string, speedModifier: number } } = {
        'alloy': { voice: 'alloy', speedModifier: 1.0 }, // Neutral - Most popular American voice
        'nova': { voice: 'nova', speedModifier: 1.0 }, // Female - Clear American pronunciation  
        'fable': { voice: 'fable', speedModifier: 1.0 }, // Male - Top rated American voice
        'echo': { voice: 'echo', speedModifier: 1.0 }, // Male - Articulate American voice
        'onyx': { voice: 'onyx', speedModifier: 1.0 }, // Male - Deep American voice
        'shimmer': { voice: 'shimmer', speedModifier: 1.0 }, // Female - Bright American accent
        // British-style variations (Note: OpenAI TTS maintains American accent but with refined characteristics)
        'alloy-british': { voice: 'alloy', speedModifier: 0.92 }, // Alex - Neutral, Elegant style
        'nova-british': { voice: 'nova', speedModifier: 0.88 }, // Victoria - Female, Classic style  
        'fable-british': { voice: 'fable', speedModifier: 0.90 }, // William - Male, Distinguished style
        'echo-british': { voice: 'echo', speedModifier: 0.85 }, // James - Male, Refined style
        'onyx-british': { voice: 'onyx', speedModifier: 0.87 }, // Oliver - Male, Deep style
        'shimmer-british': { voice: 'shimmer', speedModifier: 0.93 }, // Emma - Female, Bright style
        // American variations
        'alloy-business': { voice: 'alloy', speedModifier: 0.95 }, // Professional American
        'nova-slow': { voice: 'nova', speedModifier: 0.8 }, // Gentle American
        'fable-fast': { voice: 'fable', speedModifier: 1.3 }, // Dynamic American
        'echo-calm': { voice: 'echo', speedModifier: 0.9 }, // Composed American
        'shimmer-energetic': { voice: 'shimmer', speedModifier: 1.2 } // Energetic American
      };

      const voiceConfig = voiceMapping[voice] || { voice: 'nova', speedModifier: 1.0 };
      const selectedVoice = voiceConfig.voice;
      const adjustedSpeed = speed * voiceConfig.speedModifier;

      // Generate new voice if not cached - create a promise to track this generation
      const voiceGenerationPromise = (async () => {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        console.log(`Generating AI speech for text: "${text.substring(0, 50)}..." using voice: ${selectedVoice}`);

        // Use faster tts-1 model for demo tours to reduce latency
        const model = text.length > 200 ? "tts-1-hd" : "tts-1";
        
        const mp3 = await openai.audio.speech.create({
          model: model,
          voice: selectedVoice as any,
          input: text,
          speed: Math.min(Math.max(adjustedSpeed, 0.25), 4.0)
        });

        return Buffer.from(await mp3.arrayBuffer());
      })();

      // Store the promise to prevent duplicate requests
      activeVoiceRequests.set(textHash, voiceGenerationPromise);
      
      const buffer = await voiceGenerationPromise;
      
      // Clean up the tracking once complete
      activeVoiceRequests.delete(textHash);
      
      // Cache the generated audio for future use
      try {
        const audioData = buffer.toString('base64');
        await storage.createVoiceRecording({
          textHash,
          role,
          stepId,
          voice: selectedVoice,
          audioData,
          fileSize: buffer.length,
          duration: null
        });
        console.log(`Cached new voice recording with hash: ${textHash}`);
      } catch (cacheError) {
        console.error('Error caching voice recording:', cacheError);
        // Continue even if caching fails
      }
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=7200',
        'X-Content-Type-Options': 'nosniff',
        'X-Voice-Cache': 'miss'
      });
      
      res.send(buffer);
    } catch (error) {
      // Clean up tracking on error
      try {
        const cacheKey = `${req.body.text}-${req.body.voice || "alloy"}-${req.body.gender || "female"}-${req.body.speed || 1.1}`;
        const errorTextHash = crypto.createHash('sha256').update(cacheKey).digest('hex');
        activeVoiceRequests.delete(errorTextHash);
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
      
      console.error("AI text-to-speech error:", error);
      res.status(500).json({ error: "Failed to generate AI speech" });
    }
  });

  // Pre-generate voice recordings for tour steps
  async function preGenerateVoiceRecordings(role: string, steps: any[]) {
    console.log(`Starting voice pre-generation for ${role} with ${steps.length} steps`);
    
    for (const step of steps) {
      if (step.voiceScript) {
        try {
          // Create enhanced narration text (same logic as in guided-tour.tsx)
          const enhancedText = createEngagingNarration(step, role);
          
          // Generate voice hash 
          const cacheKey = `${enhancedText}-nova-female-1.15`;
          const textHash = crypto.createHash('sha256').update(cacheKey).digest('hex');
          
          // Check if already cached
          const existingCache = await storage.getVoiceRecording(textHash);
          if (existingCache) {
            const stepId = step.id || step.stepId || 'unknown';
            console.log(`Voice already cached for step ${stepId}`);
            continue;
          }
          
          // Generate new voice recording
          const stepId = step.id || step.stepId || `step-${Math.random().toString(36).substr(2, 9)}`;
          console.log(`Generating voice for step: ${stepId}`);
          const audioBuffer = await generateTTSAudio(enhancedText, 'nova', 1.15);
          
          // Save to cache
          await storage.saveVoiceRecording({
            textHash,
            role,
            stepId: stepId,
            voice: 'nova',
            audioData: audioBuffer.toString('base64'),
            fileSize: audioBuffer.length,
            duration: Math.ceil(enhancedText.length * 50), // Estimate duration
          });
          
          console.log(`Successfully cached voice for step ${stepId}`);
        } catch (error) {
          const stepId = step.id || step.stepId || 'unknown';
          console.error(`Failed to pre-generate voice for step ${stepId}:`, error);
        }
      }
    }
    console.log(`Completed voice pre-generation for ${role}`);
  }
  
  // Create engaging narration with role-specific focus and varied openings
  function createEngagingNarration(stepData: any, role: string): string {
    if (stepData.voiceScript) {
      return stepData.voiceScript;
    }
    
    // Create role-specific opening based on common concerns
    const roleOpenings: {[key: string]: string} = {
      'production-scheduler': 'As a Production Scheduler, you know how critical efficient scheduling is.',
      'plant-manager': 'As a Plant Manager, you need complete visibility into operations.',
      'director': 'As a Director, strategic insights drive your decisions.',
      'systems-manager': 'As a Systems Manager, seamless integration is key.',
      'trainer': 'As a Trainer, comprehensive learning tools are essential.',
      'shop-floor-operations': 'As a Shop Floor operator, real-time information is crucial.'
    };

    // Varied engaging transition phrases to keep scripts fresh
    const transitionPhrases = [
      'Let me introduce you to',
      'Here\'s how you can use',
      'Now, let\'s explore',
      'Take a look at',
      'I\'d like to highlight',
      'Let\'s dive into',
      'Check out',
      'Here\'s a key feature:',
      'Notice how',
      'You\'ll find that',
      'This is where you can',
      'Pay attention to'
    ];
    
    const benefit = Array.isArray(stepData.benefits) && stepData.benefits.length > 0 
      ? stepData.benefits[0] 
      : stepData.description;
    
    const roleKey = role?.toLowerCase().replace(/\s+/g, '-') || 'user';
    const opening = roleOpenings[roleKey] || `Here's a powerful feature for your role:`;
    
    // Use hash of step title to consistently select the same transition phrase for each step
    const stepHash = stepData.title.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0);
    const selectedTransition = transitionPhrases[stepHash % transitionPhrases.length];
    
    return `${opening} ${selectedTransition} ${stepData.title}. ${stepData.description} This feature helps you ${benefit?.toLowerCase() || 'achieve better results'}.`;
  }
  
  // Generate TTS audio using OpenAI
  async function generateTTSAudio(text: string, voice: string = 'nova', speed: number = 1.15): Promise<Buffer> {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice as any,
      input: text,
      speed: speed,
      response_format: "mp3"
    });
    
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  }

  // Function to get accessible routes for a role
  async function getAccessibleRoutesForRole(roleId: number): Promise<{[key: string]: string}> {
    // Map routes to required permissions
    const routePermissions = {
      '/production-schedule': 'production-scheduling-view', // Main dashboard shows production schedule
      '/analytics': 'analytics-view', 
      '/reports': 'reports-view',
      '/max-ai-assistant': 'ai-assistant-view',
      '/boards': 'boards-view',
      '/shop-floor': 'shop-floor-view',
      '/operator-dashboard': 'operator-dashboard-view',
      '/maintenance': 'maintenance-view',
      '/optimize-orders': 'scheduling-optimizer-view',
      '/erp-import': 'erp-import-view',
      '/plant-manager-dashboard': 'plant-manager-view',
      '/systems-management-dashboard': 'systems-management-view',
      '/capacity-planning': 'capacity-planning-view',
      '/visual-factory': 'visual-factory-view',
      '/business-goals': 'business-goals-view',
      '/role-management': 'role-management-view',
      '/user-role-assignments-page': 'user-management-view',
      '/training': 'training-view',
      '/feedback': 'feedback-view'
    };

    // All system navigation paths
    const allSystemRoutes = {
      '/production-schedule': 'Production Schedule - Main production schedule view with Gantt chart',
      '/analytics': 'Analytics - Performance metrics and insights',
      '/reports': 'Reports - Production reporting and analysis',
      '/max-ai-assistant': 'Max AI Assistant - AI-powered manufacturing assistant',
      '/boards': 'Boards - Job and resource management boards',
      '/shop-floor': 'Shop Floor - Live floor status and resource monitoring',
      '/operator-dashboard': 'Operator Dashboard - Equipment operator interface',
      '/maintenance': 'Maintenance - Equipment maintenance management',
      '/optimize-orders': 'Optimize Orders - Intelligent scheduling optimizer',
      '/erp-import': 'ERP Import - External system data integration',
      '/plant-manager-dashboard': 'Plant Manager Dashboard - Overall plant operations management',
      '/systems-management-dashboard': 'Systems Management Dashboard - System configuration and settings',
      '/capacity-planning': 'Capacity Planning - Resource capacity analysis',
      '/visual-factory': 'Visual Factory - Large screen displays for manufacturing',
      '/business-goals': 'Business Goals - Strategic objectives and KPI tracking',
      '/role-management': 'Role Management - User roles and permissions',
      '/user-role-assignments-page': 'User Role Assignments - User assignments and access control',
      '/training': 'Training - Training modules and role demonstrations',
      '/feedback': 'Feedback - User feedback and suggestions'
    };

    try {
      // Get role by ID using storage interface  
      const role = await storage.getRole(roleId);
      
      if (!role) {
        console.log(`Role not found: ${roleId}, using default routes`);
        return { '/production-schedule': allSystemRoutes['/production-schedule'] }; // Fallback to dashboard only
      }

      // Get role permissions using storage interface
      const rolePermissionsList = await storage.getRolePermissions(role.id);
      const permissionFeatures = rolePermissionsList.map(p => p.feature);
      console.log(`Role ${role.name} has permissions for features:`, permissionFeatures);

      // Filter routes based on permissions
      const accessibleRoutes: {[key: string]: string} = {};
      
      for (const [route, description] of Object.entries(allSystemRoutes)) {
        const requiredPermission = (routePermissions as any)[route];
        
        if (requiredPermission) {
          // Extract feature from permission (e.g., 'production-scheduling-view' -> 'production-scheduling')
          const requiredFeature = requiredPermission.replace('-view', '');
          
          // Use flexible permission matching - check for exact match or related features
          const hasPermission = permissionFeatures.includes(requiredFeature) || 
            permissionFeatures.some(feature => {
              // Flexible matching for common cases
              if (requiredFeature.includes('scheduling') && (feature.includes('production-scheduling') || feature.includes('schedule'))) return true;
              if (requiredFeature.includes('optimization') && feature.includes('schedule-optimization')) return true;
              if (requiredFeature.includes('dashboard') && feature.includes('production-scheduling')) return true;
              if (requiredFeature.includes('analytics') && (feature.includes('reports') || feature.includes('analytics'))) return true;
              return false;
            });
          
          if (hasPermission) {
            accessibleRoutes[route] = description;
            console.log(`✓ Role ${role.name} can access ${route} (${requiredFeature})`);
          } else {
            console.log(`✗ Role ${role.name} cannot access ${route} (missing ${requiredFeature})`);
          }
        } else {
          // Routes without specific permission requirements
          accessibleRoutes[route] = description;
        }
      }

      console.log(`Final accessible routes for ${role.name}:`, Object.keys(accessibleRoutes));
      return accessibleRoutes;
      
    } catch (error) {
      console.error(`Error getting accessible routes for role ID ${roleId}:`, error);
      return { '/': allSystemRoutes['/'] }; // Fallback to dashboard only
    }
  }

  // AI Tour Generation endpoint
  app.post("/api/ai/generate-tour", async (req, res) => {
    try {
      const { roles, guidance, contentOnly, allowSystemInteraction = true } = req.body;
      if (!roles || !Array.isArray(roles)) {
        return res.status(400).json({ message: "Roles array is required" });
      }

      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Generate role-specific accessible routes
      const roleRoutes: {[role: string]: {[path: string]: string}} = {};
      
      for (const role of roles) {
        // Find role by exact name match (roles now use proper case)
        const roleRecord = await storage.getRoleByName(role);
        if (roleRecord) {
          roleRoutes[role] = await getAccessibleRoutesForRole(roleRecord.id);
        } else {
          console.log(`Role not found for display name: ${role}`);
          roleRoutes[role] = { '/': 'Dashboard - Main production schedule view' };
        }
      }

      let prompt = `Generate comprehensive guided tour content for PlanetTogether manufacturing system for these roles: ${roles.join(', ')}.

IMPORTANT: You MUST ONLY use navigation paths that are accessible to each specific role based on their permissions.

Role-specific accessible navigation paths:
${roles.map(role => {
  const accessibleRoutes = roleRoutes[role];
  return `${role}:\n${Object.entries(accessibleRoutes).map(([path, desc]) => `  - ${path} (${desc})`).join('\n')}`;
}).join('\n\n')}

MANDATORY FOR TRAINER ROLE: If generating a tour for the "Trainer" role, ALL tour steps MUST navigate to "/training" and MUST include tab targeting. DO NOT use other navigation paths for Trainer tours.

Required Trainer Tour Structure (EXACT FORMAT):
Step 1: {
  "stepName": "Training Modules Overview",
  "navigationPath": "/training", 
  "target": {"type": "tab", "tabId": "training-modules", "action": "click"},
  "description": "Explore comprehensive training modules...",
  "benefits": [...],
  "voiceScript": "..."
}
Step 2: {
  "stepName": "Role Demonstrations Hub",
  "navigationPath": "/training",
  "target": {"type": "tab", "tabId": "role-demonstrations", "action": "click"}, 
  "description": "Experience interactive role demonstrations...",
  "benefits": [...],
  "voiceScript": "..."
}
Step 3: {
  "stepName": "Tour Management Center", 
  "navigationPath": "/training",
  "target": {"type": "tab", "tabId": "tour-management", "action": "click"},
  "description": "Manage and customize guided tours...",
  "benefits": [...],
  "voiceScript": "..."
}
Step 4: {
  "stepName": "Training Resources Library",
  "navigationPath": "/training", 
  "target": {"type": "tab", "tabId": "training-resources", "action": "click"},
  "description": "Access extensive training materials...", 
  "benefits": [...],
  "voiceScript": "..."
}

ROLE-FOCUSED BENEFITS & MESSAGING GUIDELINES:
Create tours that deeply resonate with each role by emphasizing benefits that matter most to their daily responsibilities and business impact:

**Production Schedulers:** Focus on efficiency, time savings, and operational control
- Emphasize: "Reduce scheduling time by 60%", "Prevent costly production delays", "Optimize resource utilization"
- Language: "streamline your scheduling workflow", "eliminate manual planning headaches", "achieve on-time delivery targets"

**Plant Managers:** Focus on oversight, KPIs, and facility-wide performance  
- Emphasize: "Real-time visibility across all operations", "Improve OEE by 15%", "Reduce operational costs"
- Language: "monitor plant performance at a glance", "identify bottlenecks before they impact delivery", "maximize facility productivity"

**Directors:** Focus on strategic impact, ROI, and competitive advantage
- Emphasize: "Increase profit margins", "Strategic decision support", "Drive competitive advantage"
- Language: "accelerate business growth", "optimize capital investment", "achieve strategic manufacturing goals"

**Systems Managers:** Focus on system efficiency, integration, and technical capabilities
- Emphasize: "Seamless system integration", "Reduced IT overhead", "Enhanced data security"
- Language: "streamline system administration", "eliminate technical bottlenecks", "ensure reliable operations"

INTELLIGENT TOUR CREATION GUIDELINES:
1. Start each tour with a compelling value proposition specific to that role's primary concerns
2. Connect every feature to tangible business outcomes the role cares about
3. Use role-appropriate language and terminology (operational vs strategic vs technical)
4. Highlight pain points the role commonly faces and how features solve them
5. Quantify benefits with realistic metrics when possible (time savings, cost reduction, efficiency gains)

PERMISSION MATCHING RULES:
- Use flexible matching when interpreting user guidance - if user mentions "scheduling" look for routes with scheduling, optimization, or planning
- If user mentions "analytics" or "reports" look for reporting, analytics, or dashboard features
- Match user intent to available permissions rather than requiring exact terminology
- Prioritize the most relevant features for each role from their accessible routes

REQUIREMENTS:
1. NEVER include routes that are not listed for that specific role
2. Each role can ONLY visit the pages listed above for that role  
3. Tours must respect role-based access control permissions
4. Use ONLY the role-specific navigation paths listed for each role
5. Create 3-5 engaging tour steps per role covering their most important accessible features
6. MANDATORY: For Trainer role tours navigating to /training, ALWAYS include target property with tab targeting
7. IMPORTANT: End each tour by explaining this was a role-specific overview and encourage exploring other role perspectives

For each role, create:
1. 3-5 tour steps covering accessible features only
2. Engaging voice scripts for each step (2-3 sentences each)
3. Clear benefits for each feature (2-3 benefits per step)
4. Use ONLY the role-specific navigation paths listed for each role
5. Final step should mention this covers their role's key features and encourage multi-role exploration

Each tour step must have:
- navigationPath: One of the exact paths accessible to that role (from the role-specific list above)
- stepName: Brief descriptive title that resonates with the role (e.g., "Scheduling Efficiency Dashboard", "Strategic Performance Analytics", "System Integration Hub")
- description: Role-focused explanation connecting features to their daily work and challenges
- benefits: Array of 2-3 role-specific advantages using language and metrics that matter to them
- voiceScript: Compelling narration that speaks directly to their responsibilities and goals (2-3 sentences)
- target: (OPTIONAL) Enhanced navigation object for tab/section targeting with structure: {"type": "tab|section|element", "tabId": "identifier", "action": "click|highlight"}

CONTENT CREATION REQUIREMENTS:
1. **Role-Specific Language**: Use terminology and concepts familiar to each role
2. **Business Impact Focus**: Every benefit should tie to measurable business outcomes
3. **Pain Point Resolution**: Address common frustrations and challenges for each role
4. **Success Metrics**: Include realistic performance improvements (time, cost, quality, efficiency)
5. **Emotional Resonance**: Create excitement about solving real problems they face daily

TOUR CONCLUSION GUIDELINES:
- The final step should emphasize that this tour covered the most important features for their specific role
- Mention that PlanetTogether has many more features accessible to different roles (Production Schedulers, Plant Managers, Systems Managers, etc.)
- Encourage users to explore other role perspectives to see the full scope of the platform
- Make users aware that what they saw is role-specific and there's much more to discover
- Use language like "This tour showcased the key features for your role as a [Role Name]" and "Explore other roles to see additional capabilities"

Return JSON format with each role as a top-level key containing tourSteps array.`;

      // Add user guidance if provided
      if (guidance && guidance.trim()) {
        prompt += `\n\nAdditional instructions: ${guidance.trim()}`;
      }

      console.log("Sending prompt to AI (first 1000 chars):", prompt.substring(0, 1000));
      console.log("Roles being generated for:", roles);
      console.log("User guidance:", guidance || 'None');

      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Using latest model
        messages: [
          {
            role: "system",
            content: "You are a manufacturing software expert creating guided tours for different user roles. Focus on explaining benefits and features in ways that deeply resonate with each role's daily responsibilities, challenges, and success metrics. Create content that makes each viewer excited about solving their specific problems and achieving their goals. Use role-appropriate language, quantify benefits with realistic metrics, and connect every feature to tangible business impact."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      });

      let generatedContent = completion.choices[0].message.content || '';
      console.log("AI Raw Response Content:", generatedContent);
      
      // Extract JSON content from markdown code blocks if present
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        generatedContent = jsonMatch[1];
        console.log("Extracted JSON from markdown blocks:", generatedContent);
      }
      
      // Try to parse as JSON, fallback to text response if needed
      let tourData;
      try {
        tourData = JSON.parse(generatedContent);
        console.log("Successfully parsed AI tour data:", Object.keys(tourData));
        console.log("Tour data structure:", JSON.stringify(tourData, null, 2));
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError.message);
        console.error("Content to parse:", generatedContent);
        console.error("Content length:", generatedContent.length);
        console.error("First 500 chars:", generatedContent.substring(0, 500));
        tourData = { content: generatedContent, roles: roles };
      }

      // If contentOnly is true, just return the generated content without saving
      if (contentOnly) {
        // Process and structure the tour data for preview
        const processedTours = [];
        console.log("Available tour data keys:", Object.keys(tourData));
        for (const role of roles) {
          console.log(`Processing role: ${role}`);
          const roleKey = role.toLowerCase().replace(/\s+/g, '-');
          const roleKeyPascal = role.replace(/\s+/g, '');
          
          let roleTourData = null;
          if (tourData.roles && tourData.roles[role]) {
            console.log(`Found tour data via roles.${role}`);
            roleTourData = tourData.roles[role];
          } else if (tourData[roleKeyPascal]) {
            console.log(`Found tour data via ${roleKeyPascal}`);
            roleTourData = tourData[roleKeyPascal];
          } else if (tourData[roleKeyPascal + 'Tour']) {
            console.log(`Found tour data via ${roleKeyPascal}Tour`);
            roleTourData = tourData[roleKeyPascal + 'Tour'];
          } else if (tourData[role]) {
            console.log(`Found tour data via ${role}`);
            roleTourData = tourData[role];
          } else if (tourData[roleKey]) {
            console.log(`Found tour data via ${roleKey}`);
            roleTourData = tourData[roleKey];
          } else if (tourData.steps || tourData.tourSteps) {
            console.log(`Found tour data via direct steps`);
            roleTourData = tourData;
          } else {
            console.log(`No tour data found for role: ${role}. Tried keys: ${role}, ${roleKeyPascal}, ${roleKeyPascal}Tour, ${roleKey}, direct steps`);
          }
          
          console.log(`Role tour data for ${role}:`, JSON.stringify(roleTourData, null, 2));
          const steps = roleTourData?.steps || roleTourData?.tourSteps || [];
          console.log(`Steps found for ${role}:`, steps.length, "steps");
          if (steps && steps.length > 0) {
            console.log(`Adding tour for ${role} with ${steps.length} steps`);
            processedTours.push({
              role: role,
              steps: steps,
              totalSteps: steps.length,
              estimatedDuration: roleTourData?.estimatedDuration || "5 min",
              voiceScriptCount: steps.filter((s: any) => s.voiceScript).length
            });
          } else {
            console.log(`No steps found for ${role}. roleTourData keys:`, roleTourData ? Object.keys(roleTourData) : 'null');
          }
        }
        
        console.log('Sending response with processed tours:', JSON.stringify({
          success: true,
          tours: processedTours,
          contentOnly: true,
          message: `Tour content generated for ${roles.length} role(s) (preview only)`
        }, null, 2));
        
        return res.json({
          success: true,
          tours: processedTours,
          contentOnly: true,
          message: `Tour content generated for ${roles.length} role(s) (preview only)`
        });
      }

      // Save generated tours to database
      const savedTours = [];
      for (const role of roles) {
        const roleKey = role.toLowerCase().replace(/\s+/g, '-');
        const roleKeyPascal = role.replace(/\s+/g, ''); // ProductionScheduler format
        
        // Try different ways to access the tour data based on AI response format
        let roleTourData = null;
        
        // Check for nested roles structure (roles.Director.tourSteps)
        if (tourData.roles && tourData.roles[role]) {
          roleTourData = tourData.roles[role];
        }
        // Check for PascalCase key (ProductionScheduler)
        else if (tourData[roleKeyPascal]) {
          roleTourData = tourData[roleKeyPascal];
        }
        // Check for PascalCase key with "Tour" suffix (ProductionSchedulerTour)
        else if (tourData[roleKeyPascal + 'Tour']) {
          roleTourData = tourData[roleKeyPascal + 'Tour'];
        }
        // Check for direct role key with spaces
        else if (tourData[role]) {
          roleTourData = tourData[role];
        }
        // Check for lowercase-dash key
        else if (tourData[roleKey]) {
          roleTourData = tourData[roleKey];
        }
        // Fallback to using the whole tourData if it has steps directly
        else if (tourData.steps || tourData.tourSteps) {
          roleTourData = tourData;
        }
        else {
          console.log(`No role data found for ${role}. Available keys:`, Object.keys(tourData));
        }
        
        // Handle both 'steps' and 'tourSteps' property names
        const steps = roleTourData?.steps || roleTourData?.tourSteps || [];
        console.log(`Extracted ${steps.length} steps for ${role}`);
        
        if (steps && steps.length > 0) {
          try {
            // Get role ID for this role display name - use proper case name directly
            const roleRecord = await storage.getRoleByName(role);
            if (!roleRecord) {
              console.error(`Role not found for name: ${role}`);
              continue;
            }
            
            const tourRecord = await storage.upsertTour({
              roleId: roleRecord.id,
              roleDisplayName: role,
              tourData: {
                steps: steps,
                totalSteps: steps.length,
                estimatedDuration: roleTourData?.estimatedDuration || "5 min",
                voiceScriptCount: steps.filter((s: any) => s.voiceScript).length
              },
              isGenerated: true,
              allowSystemInteraction: allowSystemInteraction,
              createdBy: req.user?.id || 'system'
            });
            savedTours.push(tourRecord);
            console.log(`Successfully saved tour for ${role}:`, tourRecord.id);
            
            // Pre-generate voice recordings for all tour steps
            console.log(`Pre-generating voice recordings for ${role} tour...`);
            await preGenerateVoiceRecordings(role, steps);
          } catch (saveError) {
            console.error(`Error saving tour for ${role}:`, saveError);
          }
        } else {
          console.log(`No valid tour data found for ${role}`, { roleTourData, steps });
        }
      }

      // Validate generated tours
      const validationResults = await validateToursRoutes(savedTours);
      
      res.json({ 
        success: true,
        tourData,
        savedTours,
        validationResults,
        generatedFor: roles,
        message: `Tour content generated and saved for ${roles.length} role(s)`
      });

    } catch (error) {
      console.error("AI Tour generation error:", error);
      
      const errorMessage = error.message || "Unknown error";
      const isQuotaError = errorMessage.includes('quota') || 
                          errorMessage.includes('limit') || 
                          errorMessage.includes('exceeded');
      
      if (isQuotaError) {
        res.status(429).json({ 
          message: "AI quota exceeded",
          error: errorMessage,
          quotaExceeded: true
        });
      } else {
        res.status(500).json({ 
          message: "Failed to generate tour content",
          error: errorMessage
        });
      }
    }
  });

  // Save tour content with voice generation endpoint
  app.post("/api/tours", async (req, res) => {
    try {
      const { tourData, roleId, generateVoice, allowSystemInteraction = true } = req.body;
      
      if (!tourData || !roleId) {
        return res.status(400).json({ message: "Tour data and role ID are required" });
      }

      // Get role information
      const role = await storage.getRoleById(roleId);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      // Save or update the tour
      const tourRecord = await storage.upsertTour({
        roleId: roleId,
        roleDisplayName: role.name,
        tourData: {
          steps: tourData.steps,
          totalSteps: tourData.steps?.length || 0,
          estimatedDuration: tourData.estimatedDuration || "5 min",
          voiceScriptCount: tourData.steps?.filter((s: any) => s.voiceScript).length || 0
        },
        isGenerated: true,
        allowSystemInteraction: allowSystemInteraction,
        createdBy: req.user?.id || 'system'
      });

      // Generate voice recordings if requested
      if (generateVoice && tourData.steps?.length > 0) {
        console.log(`Generating voice recordings for ${role.name} tour...`);
        try {
          await preGenerateVoiceRecordings(role.name, tourData.steps);
        } catch (voiceError) {
          console.error(`Voice generation failed for ${role.name}:`, voiceError);
          // Don't fail the request if voice generation fails
        }
      }

      res.json({
        success: true,
        tour: tourRecord,
        voiceGenerated: generateVoice,
        message: `Tour saved for ${role.name}${generateVoice ? ' with voice generation started' : ''}`
      });

    } catch (error) {
      console.error("Error saving tour:", error);
      res.status(500).json({ 
        message: "Failed to save tour",
        error: error.message
      });
    }
  });

  // Enhanced function to validate tours comprehensively
  async function validateToursRoutes(tours: any[]): Promise<any> {
    const validationResults = {
      valid: [],
      invalid: [],
      criticalErrors: [],
      summary: {
        totalTours: tours.length,
        validTours: 0,
        invalidTours: 0,
        criticalErrors: 0,
        totalIssues: 0,
        validationCategories: {
          roleIdValidation: 0,
          tourDataStructure: 0,
          stepValidation: 0,
          routeAccessibility: 0,
          dataIntegrity: 0
        }
      }
    };

    // Get all valid roles for validation
    const allRoles = await storage.getRoles();
    const validRoleIds = allRoles.map(role => role.id);

    for (const tour of tours) {
      const tourValidation = {
        tourId: tour.id,
        role: tour.roleDisplayName,
        roleId: tour.roleId,
        issues: [],
        validSteps: [],
        invalidSteps: [],
        criticalErrors: []
      };

      // 1. CRITICAL: Role ID Validation
      if (!tour.roleId || !validRoleIds.includes(tour.roleId)) {
        const criticalError = {
          type: 'CRITICAL_ROLE_ID_INVALID',
          issue: `Tour references invalid role ID: ${tour.roleId}`,
          severity: 'CRITICAL',
          impact: 'Tour cannot function - will cause JavaScript errors',
          suggestion: `Update roleId to one of: ${validRoleIds.join(', ')}`
        };
        tourValidation.criticalErrors.push(criticalError);
        validationResults.summary.validationCategories.roleIdValidation++;
      }

      // 2. CRITICAL: Tour Data Structure Validation
      if (!tour.tourData) {
        const criticalError = {
          type: 'CRITICAL_NO_TOUR_DATA',
          issue: 'Tour has no tourData field',
          severity: 'CRITICAL',
          impact: 'Tour will not display any steps',
          suggestion: 'Regenerate tour with proper tour data structure'
        };
        tourValidation.criticalErrors.push(criticalError);
        validationResults.summary.validationCategories.tourDataStructure++;
      } else if (!tour.tourData.steps || !Array.isArray(tour.tourData.steps)) {
        const criticalError = {
          type: 'CRITICAL_NO_STEPS',
          issue: 'Tour data has no steps array',
          severity: 'CRITICAL',
          impact: 'Tour will not display any steps',
          suggestion: 'Regenerate tour with proper steps array'
        };
        tourValidation.criticalErrors.push(criticalError);
        validationResults.summary.validationCategories.tourDataStructure++;
      } else if (tour.tourData.steps.length === 0) {
        const criticalError = {
          type: 'CRITICAL_EMPTY_STEPS',
          issue: 'Tour has empty steps array',
          severity: 'CRITICAL',
          impact: 'Tour will show no content',
          suggestion: 'Regenerate tour with actual steps'
        };
        tourValidation.criticalErrors.push(criticalError);
        validationResults.summary.validationCategories.tourDataStructure++;
      }

      // 3. Role-based Route Accessibility (only if role ID is valid)
      if (validRoleIds.includes(tour.roleId)) {
        try {
          const roleAccessibleRoutes = await getAccessibleRoutesForRole(tour.roleId);
          const accessiblePaths = Object.keys(roleAccessibleRoutes);
          
          // Check each tour step for route accessibility
          if (tour.tourData && tour.tourData.steps && Array.isArray(tour.tourData.steps)) {
            for (let i = 0; i < tour.tourData.steps.length; i++) {
              const step = tour.tourData.steps[i];
              
              // 4. Step Structure Validation
              if (!step.stepName && !step.stepTitle && !step.title) {
                tourValidation.issues.push({
                  type: 'STEP_NO_TITLE',
                  stepIndex: i + 1,
                  issue: 'Step has no title/name',
                  severity: 'WARNING',
                  impact: 'Step will show generic title',
                  suggestion: 'Add stepName, stepTitle, or title field'
                });
                validationResults.summary.validationCategories.stepValidation++;
              }

              if (!step.description && !step.voiceScript) {
                tourValidation.issues.push({
                  type: 'STEP_NO_DESCRIPTION',
                  stepIndex: i + 1,
                  stepName: step.stepName || step.stepTitle || `Step ${i + 1}`,
                  issue: 'Step has no description or voice script',
                  severity: 'WARNING',
                  impact: 'Step will show generic description',
                  suggestion: 'Add description or voiceScript field'
                });
                validationResults.summary.validationCategories.stepValidation++;
              }

              // 5. Route Accessibility Validation
              const navigationPath = step.navigationPath;
              if (navigationPath && navigationPath !== "current") {
                if (accessiblePaths.includes(navigationPath)) {
                  tourValidation.validSteps.push({
                    stepIndex: i + 1,
                    stepName: step.stepName || step.stepTitle || `Step ${i + 1}`,
                    navigationPath,
                    status: 'valid'
                  });
                } else {
                  const issue = {
                    type: 'ROUTE_NOT_ACCESSIBLE',
                    stepIndex: i + 1,
                    stepName: step.stepName || step.stepTitle || `Step ${i + 1}`,
                    navigationPath,
                    issue: `Route '${navigationPath}' is not accessible to role '${tour.roleDisplayName}'`,
                    severity: 'ERROR',
                    impact: 'User will see access denied when clicking this step',
                    suggestion: `Replace with accessible route: ${accessiblePaths.slice(0, 3).join(', ')}`
                  };
                  
                  tourValidation.issues.push(issue);
                  tourValidation.invalidSteps.push(issue);
                  validationResults.summary.validationCategories.routeAccessibility++;
                }
              }
            }
          }
        } catch (error) {
          tourValidation.issues.push({
            type: 'ROLE_PERMISSION_CHECK_FAILED',
            issue: `Failed to check permissions for role ID ${tour.roleId}: ${error.message}`,
            severity: 'ERROR',
            impact: 'Cannot validate route accessibility',
            suggestion: 'Check role permissions in database'
          });
          validationResults.summary.validationCategories.roleIdValidation++;
        }
      }

      // 6. Data Integrity Validation
      if (!tour.roleDisplayName) {
        tourValidation.issues.push({
          type: 'MISSING_ROLE_DISPLAY_NAME',
          issue: 'Tour has no roleDisplayName',
          severity: 'WARNING',
          impact: 'Tour will show generic role name',
          suggestion: 'Add roleDisplayName field'
        });
        validationResults.summary.validationCategories.dataIntegrity++;
      }

      if (!tour.id) {
        const criticalError = {
          type: 'CRITICAL_NO_TOUR_ID',
          issue: 'Tour has no ID',
          severity: 'CRITICAL',
          impact: 'Tour cannot be referenced or updated',
          suggestion: 'Ensure tour has unique ID from database'
        };
        tourValidation.criticalErrors.push(criticalError);
        validationResults.summary.validationCategories.dataIntegrity++;
      }

      // Classify tour based on severity of issues
      if (tourValidation.criticalErrors.length > 0) {
        validationResults.criticalErrors.push(tourValidation);
        validationResults.summary.criticalErrors++;
        validationResults.summary.totalIssues += tourValidation.criticalErrors.length + tourValidation.issues.length;
      } else if (tourValidation.issues.length === 0) {
        validationResults.valid.push(tourValidation);
        validationResults.summary.validTours++;
      } else {
        validationResults.invalid.push(tourValidation);
        validationResults.summary.invalidTours++;
        validationResults.summary.totalIssues += tourValidation.issues.length;
      }
    }

    console.log(`Enhanced tour validation completed: ${validationResults.summary.validTours} valid, ${validationResults.summary.invalidTours} invalid, ${validationResults.summary.criticalErrors} critical errors`);
    return validationResults;
  }

  // AI Permission Generation - Preview
  app.post("/api/ai/generate-permissions-preview", requireAuth, async (req, res) => {
    try {
      const { roleIds, description = "" } = req.body;
      
      if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
        return res.status(400).json({ message: "Role IDs array is required" });
      }

      // Get the selected roles and existing permissions
      const roles = await storage.getRolesByIds(roleIds);
      if (!roles || roles.length === 0) {
        return res.status(404).json({ message: "No roles found for the provided IDs" });
      }

      const allPermissions = await storage.getAllPermissions();
      
      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Create role context for AI
      const roleContext = roles.map(role => ({
        name: role.name,
        description: role.description,
        currentPermissions: role.permissions?.map(p => p.name) || []
      }));

      const availablePermissions = allPermissions.map(p => ({
        name: p.name,
        feature: p.feature,
        action: p.action,
        description: p.description
      }));

      const hasSpecificInstructions = description.trim().length > 0;
      
      const prompt = hasSpecificInstructions 
        ? `You are a permission management assistant. Follow the user's specific instructions exactly.

Roles to modify:
${roleContext.map(r => `- ${r.name}: ${r.description || 'No description'}\n  Current permissions: ${r.currentPermissions.join(', ') || 'None'}`).join('\n')}

Available Permissions:
${availablePermissions.map(p => `- ${p.name}: ${p.description} (${p.feature}-${p.action})`).join('\n')}

User Instructions: ${description}

IMPORTANT RULES:
1. ONLY add the specific permissions mentioned in the user instructions
2. If the user says "add visual factory permission", only add visual-factory-view permission
3. If the user says "add visual factory and shop floor permissions", only add those two specific permissions
4. Do NOT add additional permissions beyond what the user specifically requested
5. Preserve existing permissions unless specifically told to remove them

Return a JSON object with this structure:
{
  "rolePermissions": {
    "RoleName": ["specific-permission-mentioned-by-user"]
  },
  "reasoning": "Added only the permissions specifically requested by the user",
  "summary": "Brief summary of what will be changed"
}`
        : `You are a permission management assistant. Recommend appropriate permissions based on role names and responsibilities.

Roles to analyze:
${roleContext.map(r => `- ${r.name}: ${r.description || 'No description'}\n  Current permissions: ${r.currentPermissions.join(', ') || 'None'}`).join('\n')}

Available Permissions:
${availablePermissions.map(p => `- ${p.name}: ${p.description} (${p.feature}-${p.action})`).join('\n')}

RULES for role-based recommendations:
1. Analyze each role name and determine what permissions are typically needed
2. Follow principle of least privilege - only essential permissions
3. Focus on view permissions primarily, add create/edit/delete only when clearly needed for the role
4. Consider manufacturing workflow and organizational hierarchy

Return a JSON object with this structure:
{
  "rolePermissions": {
    "RoleName": ["recommended-permission-1", "recommended-permission-2"]
  },
  "reasoning": "Explanation of why these permissions fit the role",
  "summary": "Brief summary of recommended changes"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a security and role management expert for manufacturing systems. Assign permissions thoughtfully based on job roles while maintaining security best practices."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      let generatedContent = completion.choices[0].message.content || '';
      
      // Extract JSON content from markdown code blocks if present
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        generatedContent = jsonMatch[1];
      }

      let aiResponse;
      try {
        aiResponse = JSON.parse(generatedContent);
      } catch (parseError) {
        console.error("Failed to parse AI permission response:", parseError);
        return res.status(500).json({ message: "AI generated invalid response format" });
      }

      // Generate preview of suggested permissions
      const permissionMap = new Map(allPermissions.map(p => [p.name, p.id]));
      const previewChanges = [];

      console.log("AI Response:", JSON.stringify(aiResponse, null, 2));
      console.log("Available permission names:", Array.from(permissionMap.keys()));

      for (const role of roles) {
        const suggestedPermissions = aiResponse.rolePermissions?.[role.name] || [];
        console.log(`Processing role ${role.name}, suggested permissions:`, suggestedPermissions);
        
        const permissionDetails = suggestedPermissions
          .map(permName => {
            // Try exact match first
            let id = permissionMap.get(permName);
            let resolvedName = permName;
            
            // If not found, try converting from colon format to dash format
            if (!id && permName.includes(':')) {
              const dashFormat = permName.replace(':', '-');
              id = permissionMap.get(dashFormat);
              if (id) {
                resolvedName = dashFormat;
                console.log(`Converted '${permName}' to '${dashFormat}': found`);
              }
            }
            
            // If still not found, try partial matching by feature name
            if (!id) {
              const featurePart = permName.split(':')[0] || permName.split('-')[0];
              const matchingPermissions = Array.from(permissionMap.keys()).filter(p => p.startsWith(featurePart));
              if (matchingPermissions.length > 0) {
                const viewPerm = matchingPermissions.find(p => p.endsWith('-view'));
                if (viewPerm) {
                  id = permissionMap.get(viewPerm);
                  resolvedName = viewPerm;
                  console.log(`Using view permission '${viewPerm}' for '${permName}'`);
                }
              }
            }
            
            return id ? { 
              originalName: permName, 
              resolvedName, 
              id,
              permission: allPermissions.find(p => p.id === id)
            } : null;
          })
          .filter(item => item !== null);

        if (permissionDetails.length > 0) {
          // Get current permissions for this role (use original role data from roles array which includes permissions)
          const currentPermissionIds = role.permissions?.map(p => p.id) || [];
          const newPermissionIds = permissionDetails.map(p => p.id);
          const actuallyNewPermissions = permissionDetails.filter(p => !currentPermissionIds.includes(p.id));
          
          previewChanges.push({
            roleName: role.name,
            roleId: role.id,
            currentPermissionCount: currentPermissionIds.length,
            newPermissions: actuallyNewPermissions,
            totalPermissionsAfter: Array.from(new Set([...currentPermissionIds, ...newPermissionIds])).length
          });
        }
      }

      res.json({ 
        success: true,
        preview: true,
        summary: aiResponse.summary || "Permission changes ready for review",
        reasoning: aiResponse.reasoning || "AI generated permission recommendations",
        changes: previewChanges,
        hasSpecificInstructions
      });

    } catch (error) {
      console.error("AI permission generation error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to generate permissions with AI" 
      });
    }
  });

  // AI Permission Generation - Apply Changes
  app.post("/api/ai/apply-permissions", requireAuth, async (req, res) => {
    try {
      const { changes } = req.body;
      
      if (!changes || !Array.isArray(changes) || changes.length === 0) {
        return res.status(400).json({ message: "Changes array is required" });
      }

      const appliedChanges = [];

      for (const change of changes) {
        if (change.newPermissions && change.newPermissions.length > 0) {
          // Pass new permissions to storage - it handles additive merging internally
          const newPermissionIds = change.newPermissions.map(p => p.id);
          
          await storage.updateRolePermissions(change.roleId, { permissions: newPermissionIds });
          appliedChanges.push({
            roleName: change.roleName,
            addedPermissions: change.newPermissions.map(p => p.resolvedName),
            addedCount: change.newPermissions.length
          });
          
          console.log(`Applied ${change.newPermissions.length} permissions to role ${change.roleName}`);
        }
      }

      res.json({ 
        success: true, 
        message: "Permissions applied successfully",
        appliedChanges,
        totalRolesModified: appliedChanges.length
      });

    } catch (error) {
      console.error("AI permission application error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to apply permission changes" 
      });
    }
  });

  // AI Role Creation
  app.post("/api/ai/create-role", requireAuth, async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Get all available permissions for context
      const allPermissions = await storage.getAllPermissions();
      const availablePermissions = allPermissions.map(p => ({
        name: p.name,
        feature: p.feature,
        action: p.action,
        description: p.description
      }));

      const systemPrompt = `You are an AI assistant that creates system roles based on user descriptions. 
      
Given a role description, you must:
1. Create an appropriate role name (e.g., "Quality Manager", "Marketing Coordinator") 
2. Write a clear role description
3. Select appropriate permissions from the available list

Available Permissions:
${availablePermissions.map(p => `- ${p.name}: ${p.description} (${p.feature}-${p.action})`).join('\n')}

IMPORTANT RULES:
1. Only select permissions that are actually available in the list above
2. Choose permissions that logically match the role's responsibilities
3. Be conservative - better to give fewer permissions that make sense than too many
4. Consider the principle of least privilege - give only what's needed for the role to function
5. For management roles, include appropriate view permissions but be careful with edit/delete permissions
6. For operational roles, focus on the specific features they need access to

Return a JSON object with this exact structure:
{
  "name": "Role Name",
  "description": "Clear description of what this role does",
  "permissions": ["permission-name-1", "permission-name-2"],
  "reasoning": "Brief explanation of why these permissions were selected"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      let roleData;
      try {
        roleData = JSON.parse(response.choices[0].message.content || "{}");
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        return res.status(500).json({ message: "AI returned invalid response format" });
      }

      // Validate required fields
      if (!roleData.name || !roleData.description || !Array.isArray(roleData.permissions)) {
        return res.status(500).json({ message: "AI response missing required fields" });
      }

      // Map permission names to IDs and validate they exist
      const permissionIds = [];
      for (const permissionName of roleData.permissions) {
        const permission = allPermissions.find(p => p.name === permissionName);
        if (permission) {
          permissionIds.push(permission.id);
        } else {
          console.warn(`Permission not found: ${permissionName}`);
        }
      }

      // Create the role with permissions
      const newRole = await storage.createRoleWithPermissions({
        name: roleData.name,
        description: roleData.description
      }, permissionIds);

      console.log(`AI created role: ${roleData.name} with ${permissionIds.length} permissions`);

      res.json({
        success: true,
        name: newRole.name,
        description: newRole.description,
        permissionCount: permissionIds.length,
        reasoning: roleData.reasoning,
        role: newRole
      });

    } catch (error) {
      console.error("AI role creation error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to create role with AI" 
      });
    }
  });

  // Tours API endpoints
  app.get("/api/tours", requireAuth, async (req, res) => {
    try {
      const tours = await storage.getTours();
      res.json(tours);
    } catch (error) {
      console.error("Error fetching tours:", error);
      res.status(500).json({ error: "Failed to fetch tours" });
    }
  });

  // Tour validation endpoint - MUST come before /api/tours/:id route
  app.get("/api/tours/validate", requireAuth, async (req, res) => {
    try {
      // Get all tours
      const allTours = await storage.getTours();
      
      // Validate all tours
      const validationResults = await validateToursRoutes(allTours);
      
      res.json({
        success: true,
        validation: validationResults,
        message: `Validated ${allTours.length} tours: ${validationResults.summary.validTours} valid, ${validationResults.summary.invalidTours} invalid`
      });
      
    } catch (error) {
      console.error("Error validating tours:", error);
      res.status(500).json({ 
        error: "Failed to validate tours",
        details: error.message 
      });
    }
  });

  app.get("/api/tours/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid tour ID" });
      }
      
      const tour = await storage.getTour(id);
      if (!tour) {
        return res.status(404).json({ error: "Tour not found" });
      }
      
      res.json(tour);
    } catch (error) {
      console.error("Error fetching tour:", error);
      res.status(500).json({ error: "Failed to fetch tour" });
    }
  });

  // Legacy endpoint for backwards compatibility (role name)
  app.get("/api/tours/role/:role", requireAuth, async (req, res) => {
    try {
      const roleName = req.params.role;
      
      // First get the role ID by role name  
      const role = await storage.getRoleByName(roleName);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      const tour = await storage.getTourByRoleId(role.id);
      
      if (!tour) {
        return res.status(404).json({ error: "Tour not found for role" });
      }
      
      res.json(tour);
    } catch (error) {
      console.error("Error fetching tour by role:", error);
      res.status(500).json({ error: "Failed to fetch tour" });
    }
  });

  // New standardized endpoint using role ID
  app.get("/api/tours/role-id/:roleId", requireAuth, async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      
      if (isNaN(roleId)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }
      
      const tour = await storage.getTourByRoleId(roleId);
      
      if (!tour) {
        return res.status(404).json({ error: "Tour not found for role" });
      }
      
      res.json(tour);
    } catch (error) {
      console.error("Error fetching tour by role ID:", error);
      res.status(500).json({ error: "Failed to fetch tour" });
    }
  });

  app.put("/api/tours/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid tour ID" });
      }
      
      const updatedTour = await storage.updateTour(id, req.body);
      if (!updatedTour) {
        return res.status(404).json({ error: "Tour not found" });
      }
      
      res.json(updatedTour);
    } catch (error) {
      console.error("Error updating tour:", error);
      res.status(500).json({ error: "Failed to update tour" });
    }
  });

  app.delete("/api/tours/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid tour ID" });
      }
      
      const deleted = await storage.deleteTour(id);
      if (!deleted) {
        return res.status(404).json({ error: "Tour not found" });
      }
      
      res.json({ message: "Tour deleted successfully" });
    } catch (error) {
      console.error("Error deleting tour:", error);
      res.status(500).json({ error: "Failed to delete tour" });
    }
  });

  // Tour Prompt Templates API endpoints
  app.get("/api/tour-prompt-templates", requireAuth, async (req, res) => {
    try {
      const { category, userId } = req.query;
      const templates = await storage.getTourPromptTemplates(
        category as string, 
        userId ? parseInt(userId as string) : undefined
      );
      res.json(templates);
    } catch (error) {
      console.error("Error fetching tour prompt templates:", error);
      res.status(500).json({ error: "Failed to fetch tour prompt templates" });
    }
  });

  app.get("/api/tour-prompt-templates/built-in", requireAuth, async (req, res) => {
    try {
      const templates = await storage.getBuiltInTourPromptTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching built-in templates:", error);
      res.status(500).json({ error: "Failed to fetch built-in templates" });
    }
  });

  app.get("/api/tour-prompt-templates/popular", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const templates = await storage.getPopularTourPromptTemplates(limit);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching popular templates:", error);
      res.status(500).json({ error: "Failed to fetch popular templates" });
    }
  });

  app.get("/api/tour-prompt-templates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }
      
      const template = await storage.getTourPromptTemplate(id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.get("/api/tour-prompt-templates/:id/stats", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }
      
      const stats = await storage.getTourPromptTemplateStats(id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching template stats:", error);
      res.status(500).json({ error: "Failed to fetch template stats" });
    }
  });

  app.post("/api/tour-prompt-templates", requireAuth, async (req, res) => {
    try {
      const templateData = insertTourPromptTemplateSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const template = await storage.createTourPromptTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  app.put("/api/tour-prompt-templates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }
      
      const templateData = {
        ...req.body,
        updatedBy: req.user.id
      };
      
      const template = await storage.updateTourPromptTemplate(id, templateData);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  app.delete("/api/tour-prompt-templates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }
      
      const deleted = await storage.deleteTourPromptTemplate(id);
      if (!deleted) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  app.post("/api/tour-prompt-templates/:id/use", requireAuth, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }
      
      const usageData = insertTourPromptTemplateUsageSchema.parse({
        ...req.body,
        templateId,
        userId: req.user.id
      });
      
      const usage = await storage.createTourPromptTemplateUsage(usageData);
      res.json(usage);
    } catch (error) {
      console.error("Error recording template usage:", error);
      res.status(500).json({ error: "Failed to record template usage" });
    }
  });

  app.post("/api/tour-prompt-templates/:id/rate", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }
      
      const { rating } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }
      
      await storage.rateTourPromptTemplate(id, rating);
      res.json({ message: "Template rated successfully" });
    } catch (error) {
      console.error("Error rating template:", error);
      res.status(500).json({ error: "Failed to rate template" });
    }
  });

  app.get("/api/tour-prompt-template-usage", requireAuth, async (req, res) => {
    try {
      const { templateId, userId } = req.query;
      const usage = await storage.getTourPromptTemplateUsage(
        templateId ? parseInt(templateId as string) : undefined,
        userId ? parseInt(userId as string) : undefined
      );
      res.json(usage);
    } catch (error) {
      console.error("Error fetching template usage:", error);
      res.status(500).json({ error: "Failed to fetch template usage" });
    }
  });

  // Voice generation for tours endpoint
  app.post('/api/tours/generate-voice', requireAuth, async (req, res) => {
    try {
      const { tours, options } = req.body;
      
      if (!tours || !Array.isArray(tours)) {
        return res.status(400).json({ error: 'Tours array is required' });
      }

      const results = {
        total: 0,
        generated: 0,
        cached: 0,
        errors: []
      };

      for (const tour of tours) {
        try {
          console.log(`Generating voice for tour: ${tour.roleDisplayName}`);
          
          if (!tour.tourData?.steps || !Array.isArray(tour.tourData.steps)) {
            console.log(`No steps found for tour: ${tour.roleDisplayName}`);
            continue;
          }

          for (const step of tour.tourData.steps) {
            results.total++;
            
            try {
              let voiceScript = step.voiceScript || step.description;
              
              // If user requested script regeneration, enhance with AI
              if (options.regenerateScript && options.userInstructions) {
                // Use OpenAI to enhance the script based on user instructions
                const OpenAI = (await import("openai")).default;
                const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                
                const enhancementResponse = await openai.chat.completions.create({
                  model: "gpt-4o",
                  messages: [{
                    role: "user",
                    content: `Transform this tour step into an engaging voice narration following these instructions: "${options.userInstructions}"
                    
Original step:
Title: ${step.title}
Description: ${step.description}
Benefits: ${step.benefits?.join(', ') || 'None'}
Role: ${tour.roleDisplayName}

Create a natural, conversational voice script that explains this feature to someone in the ${tour.roleDisplayName} role. Keep it under 30 seconds when spoken.`
                  }],
                  max_tokens: 200
                });
                
                voiceScript = enhancementResponse.choices[0]?.message?.content?.trim() || voiceScript;
              }
              
              // Generate voice hash with selected options
              const cacheKey = `${voiceScript}-${options.voice || 'nova'}-${options.gender || 'female'}-${options.speed || 1.0}`;
              const textHash = crypto.createHash('sha256').update(cacheKey).digest('hex');
              
              // Check if already cached
              const existingCache = await storage.getVoiceRecording(textHash);
              if (existingCache) {
                results.cached++;
                console.log(`Voice already cached for step ${step.id} in ${tour.roleDisplayName}`);
                continue;
              }
              
              // Generate new voice recording
              console.log(`Generating voice for step: ${step.id} in ${tour.roleDisplayName}`);
              const audioBuffer = await generateTTSAudio(
                voiceScript, 
                options.voice || 'nova', 
                options.speed || 1.0
              );
              
              // Save to cache
              await storage.saveVoiceRecording({
                textHash,
                role: tour.roleDisplayName,
                stepId: step.id,
                voice: options.voice || 'nova',
                audioData: audioBuffer.toString('base64'),
                fileSize: audioBuffer.length,
                duration: Math.ceil(voiceScript.length * 50), // Estimate duration
              });
              
              results.generated++;
              console.log(`Successfully generated and cached voice for step ${step.id} in ${tour.roleDisplayName}`);
              
            } catch (stepError) {
              console.error(`Error generating voice for step ${step.id} in ${tour.roleDisplayName}:`, stepError);
              results.errors.push({
                tour: tour.roleDisplayName,
                step: step.id,
                error: stepError.message
              });
            }
          }
          
        } catch (tourError) {
          console.error(`Error processing tour ${tour.roleDisplayName}:`, tourError);
          results.errors.push({
            tour: tour.roleDisplayName,
            error: tourError.message
          });
        }
      }
      
      console.log(`Voice generation completed: ${results.generated} generated, ${results.cached} cached, ${results.errors.length} errors`);
      
      res.json({
        success: true,
        message: `Voice generation completed: ${results.generated} new recordings generated, ${results.cached} already cached`,
        results
      });
      
    } catch (error) {
      console.error('Voice generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate voice recordings',
        details: error.message 
      });
    }
  });

  // Disruption Management API Routes
  
  // Disruptions
  app.get("/api/disruptions", async (req, res) => {
    try {
      const disruptions = await storage.getDisruptions();
      res.json(disruptions);
    } catch (error) {
      console.error("Error fetching disruptions:", error);
      res.status(500).json({ error: "Failed to fetch disruptions" });
    }
  });

  app.get("/api/disruptions/active", async (req, res) => {
    try {
      const disruptions = await storage.getActiveDisruptions();
      res.json(disruptions);
    } catch (error) {
      console.error("Error fetching active disruptions:", error);
      res.status(500).json({ error: "Failed to fetch active disruptions" });
    }
  });

  app.get("/api/disruptions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption ID" });
      }

      const disruption = await storage.getDisruption(id);
      if (!disruption) {
        return res.status(404).json({ error: "Disruption not found" });
      }
      res.json(disruption);
    } catch (error) {
      console.error("Error fetching disruption:", error);
      res.status(500).json({ error: "Failed to fetch disruption" });
    }
  });

  app.post("/api/disruptions", async (req, res) => {
    try {
      const validation = insertDisruptionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid disruption data", details: validation.error.errors });
      }

      const disruption = await storage.createDisruption(validation.data);
      res.status(201).json(disruption);
    } catch (error) {
      console.error("Error creating disruption:", error);
      res.status(500).json({ error: "Failed to create disruption" });
    }
  });

  app.put("/api/disruptions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption ID" });
      }

      const validation = insertDisruptionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid disruption data", details: validation.error.errors });
      }

      const disruption = await storage.updateDisruption(id, validation.data);
      if (!disruption) {
        return res.status(404).json({ error: "Disruption not found" });
      }
      res.json(disruption);
    } catch (error) {
      console.error("Error updating disruption:", error);
      res.status(500).json({ error: "Failed to update disruption" });
    }
  });

  app.delete("/api/disruptions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption ID" });
      }

      const success = await storage.deleteDisruption(id);
      if (!success) {
        return res.status(404).json({ error: "Disruption not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting disruption:", error);
      res.status(500).json({ error: "Failed to delete disruption" });
    }
  });

  // Disruption Actions
  app.get("/api/disruption-actions", async (req, res) => {
    try {
      const disruptionId = req.query.disruptionId ? parseInt(req.query.disruptionId as string) : undefined;
      const actions = await storage.getDisruptionActions(disruptionId);
      res.json(actions);
    } catch (error) {
      console.error("Error fetching disruption actions:", error);
      res.status(500).json({ error: "Failed to fetch disruption actions" });
    }
  });

  app.get("/api/disruption-actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption action ID" });
      }

      const action = await storage.getDisruptionAction(id);
      if (!action) {
        return res.status(404).json({ error: "Disruption action not found" });
      }
      res.json(action);
    } catch (error) {
      console.error("Error fetching disruption action:", error);
      res.status(500).json({ error: "Failed to fetch disruption action" });
    }
  });

  app.post("/api/disruption-actions", async (req, res) => {
    try {
      const validation = insertDisruptionActionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid disruption action data", details: validation.error.errors });
      }

      const action = await storage.createDisruptionAction(validation.data);
      res.status(201).json(action);
    } catch (error) {
      console.error("Error creating disruption action:", error);
      res.status(500).json({ error: "Failed to create disruption action" });
    }
  });

  app.put("/api/disruption-actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption action ID" });
      }

      const validation = insertDisruptionActionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid disruption action data", details: validation.error.errors });
      }

      const action = await storage.updateDisruptionAction(id, validation.data);
      if (!action) {
        return res.status(404).json({ error: "Disruption action not found" });
      }
      res.json(action);
    } catch (error) {
      console.error("Error updating disruption action:", error);
      res.status(500).json({ error: "Failed to update disruption action" });
    }
  });

  app.delete("/api/disruption-actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption action ID" });
      }

      const success = await storage.deleteDisruptionAction(id);
      if (!success) {
        return res.status(404).json({ error: "Disruption action not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting disruption action:", error);
      res.status(500).json({ error: "Failed to delete disruption action" });
    }
  });

  // Disruption Escalations
  app.get("/api/disruption-escalations", async (req, res) => {
    try {
      const disruptionId = req.query.disruptionId ? parseInt(req.query.disruptionId as string) : undefined;
      const escalations = await storage.getDisruptionEscalations(disruptionId);
      res.json(escalations);
    } catch (error) {
      console.error("Error fetching disruption escalations:", error);
      res.status(500).json({ error: "Failed to fetch disruption escalations" });
    }
  });

  app.get("/api/disruption-escalations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption escalation ID" });
      }

      const escalation = await storage.getDisruptionEscalation(id);
      if (!escalation) {
        return res.status(404).json({ error: "Disruption escalation not found" });
      }
      res.json(escalation);
    } catch (error) {
      console.error("Error fetching disruption escalation:", error);
      res.status(500).json({ error: "Failed to fetch disruption escalation" });
    }
  });

  app.post("/api/disruption-escalations", async (req, res) => {
    try {
      const validation = insertDisruptionEscalationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid disruption escalation data", details: validation.error.errors });
      }

      const escalation = await storage.createDisruptionEscalation(validation.data);
      res.status(201).json(escalation);
    } catch (error) {
      console.error("Error creating disruption escalation:", error);
      res.status(500).json({ error: "Failed to create disruption escalation" });
    }
  });

  app.put("/api/disruption-escalations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption escalation ID" });
      }

      const validation = insertDisruptionEscalationSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid disruption escalation data", details: validation.error.errors });
      }

      const escalation = await storage.updateDisruptionEscalation(id, validation.data);
      if (!escalation) {
        return res.status(404).json({ error: "Disruption escalation not found" });
      }
      res.json(escalation);
    } catch (error) {
      console.error("Error updating disruption escalation:", error);
      res.status(500).json({ error: "Failed to update disruption escalation" });
    }
  });

  app.delete("/api/disruption-escalations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid disruption escalation ID" });
      }

      const success = await storage.deleteDisruptionEscalation(id);
      if (!success) {
        return res.status(404).json({ error: "Disruption escalation not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting disruption escalation:", error);
      res.status(500).json({ error: "Failed to delete disruption escalation" });
    }
  });

  // User Profile and Preferences Routes
  app.get("/api/users/:userId/profile", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return profile fields only
      const profile = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        jobTitle: user.jobTitle,
        department: user.department,
        phoneNumber: user.phoneNumber,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      };
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  app.put("/api/users/:userId/profile", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const { avatar, jobTitle, department, phoneNumber } = req.body;
      const profile = { avatar, jobTitle, department, phoneNumber };

      const updatedUser = await storage.updateUserProfile(userId, profile);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatar: updatedUser.avatar,
        jobTitle: updatedUser.jobTitle,
        department: updatedUser.department,
        phoneNumber: updatedUser.phoneNumber,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt,
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });

  app.get("/api/users/:userId/preferences", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      let preferences = await storage.getUserPreferences(userId);
      if (!preferences) {
        // Create default preferences if they don't exist
        preferences = await storage.upsertUserPreferences({ userId });
      }

      res.json(preferences);
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ error: "Failed to fetch user preferences" });
    }
  });

  app.put("/api/users/:userId/preferences", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const preferences = await storage.upsertUserPreferences({
        userId,
        ...req.body
      });

      res.json(preferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ error: "Failed to update user preferences" });
    }
  });

  // Simplified user preferences endpoints for AI theme system
  app.get("/api/user-preferences/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      let preferences = await storage.getUserPreferences(userId);
      if (!preferences) {
        // Create default preferences if they don't exist
        preferences = await storage.upsertUserPreferences({ userId });
      }

      res.json(preferences);
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ error: "Failed to fetch user preferences" });
    }
  });

  app.put("/api/user-preferences", requireAuth, async (req, res) => {
    try {
      console.log("User preferences update request - User:", req.user);
      console.log("User preferences update request - Body:", req.body);
      
      const userId = req.user?.id;
      if (!userId) {
        console.error("No user ID found in request");
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      // Clean the request body to only include fields that should be updated
      const { id, createdAt, updatedAt, ...updateData } = req.body;
      
      const preferences = await storage.upsertUserPreferences({
        userId,
        ...updateData
      });

      console.log("User preferences updated successfully:", preferences);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ error: "Failed to update user preferences" });
    }
  });

  // Chat API routes
  // Get all channels for a user
  app.get("/api/chat/channels", requireAuth, async (req, res) => {
    try {
      const channels = await storage.getChatChannels(req.user.id);
      res.json(channels);
    } catch (error) {
      console.error("Error fetching channels:", error);
      res.status(500).json({ error: "Failed to fetch channels" });
    }
  });

  // Create a new channel
  app.post("/api/chat/channels", requireAuth, async (req, res) => {
    try {
      console.log("Channel creation request body:", req.body);
      console.log("User ID:", req.user.id);
      
      const channelData = insertChatChannelSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      console.log("Parsed channel data:", channelData);
      
      const channel = await storage.createChatChannel(channelData);
      res.status(201).json(channel);
    } catch (error) {
      console.error("Error creating channel:", error);
      if (error.name === 'ZodError') {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ 
          error: "Invalid channel data", 
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to create channel" });
      }
    }
  });

  // Get channel details with participants
  app.get("/api/chat/channels/:channelId", requireAuth, async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);
      if (isNaN(channelId)) {
        return res.status(400).json({ error: "Invalid channel ID" });
      }

      const channel = await storage.getChatChannel(channelId);
      if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
      }

      // Check if user is a participant
      const isParticipant = channel.participants.some(p => p.userId === req.user.id);
      if (!isParticipant) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(channel);
    } catch (error) {
      console.error("Error fetching channel:", error);
      res.status(500).json({ error: "Failed to fetch channel" });
    }
  });

  // Add participant to channel
  app.post("/api/chat/channels/:channelId/participants", requireAuth, async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);
      if (isNaN(channelId)) {
        return res.status(400).json({ error: "Invalid channel ID" });
      }

      const memberData = insertChatMemberSchema.parse({
        ...req.body,
        channelId,
        addedBy: req.user.id
      });
      
      const member = await storage.addChatMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding participant:", error);
      res.status(500).json({ error: "Failed to add participant" });
    }
  });

  // Remove participant from channel
  app.delete("/api/chat/channels/:channelId/participants/:userId", requireAuth, async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(channelId) || isNaN(userId)) {
        return res.status(400).json({ error: "Invalid channel ID or user ID" });
      }

      const success = await storage.removeChatMember(channelId, userId);
      if (!success) {
        return res.status(404).json({ error: "Participant not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error removing participant:", error);
      res.status(500).json({ error: "Failed to remove participant" });
    }
  });

  // Get messages for a channel
  app.get("/api/chat/channels/:channelId/messages", requireAuth, async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);
      if (isNaN(channelId)) {
        return res.status(400).json({ error: "Invalid channel ID" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const messages = await storage.getChatMessages(channelId, limit, offset);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send a message
  app.post("/api/chat/channels/:channelId/messages", requireAuth, async (req, res) => {
    try {
      const channelId = parseInt(req.params.channelId);
      if (isNaN(channelId)) {
        return res.status(400).json({ error: "Invalid channel ID" });
      }

      const messageData = insertChatMessageSchema.parse({
        ...req.body,
        channelId,
        senderId: req.user.id
      });

      const message = await storage.createChatMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Update a message
  app.patch("/api/chat/messages/:messageId", requireAuth, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      if (isNaN(messageId)) {
        return res.status(400).json({ error: "Invalid message ID" });
      }

      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      const message = await storage.updateChatMessage(messageId, { content, editedAt: new Date() });
      if (!message) {
        return res.status(404).json({ error: "Message not found or access denied" });
      }

      res.json(message);
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(500).json({ error: "Failed to update message" });
    }
  });

  // Delete a message
  app.delete("/api/chat/messages/:messageId", requireAuth, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      if (isNaN(messageId)) {
        return res.status(400).json({ error: "Invalid message ID" });
      }

      const success = await storage.deleteChatMessage(messageId);
      if (!success) {
        return res.status(404).json({ error: "Message not found or access denied" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  // Add reaction to message
  app.post("/api/chat/messages/:messageId/reactions", requireAuth, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      if (isNaN(messageId)) {
        return res.status(400).json({ error: "Invalid message ID" });
      }

      const reactionData = insertChatReactionSchema.parse({
        ...req.body,
        messageId,
        userId: req.user.id
      });

      const reaction = await storage.addChatReaction(reactionData);
      res.status(201).json(reaction);
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({ error: "Failed to add reaction" });
    }
  });

  // Remove reaction from message
  app.delete("/api/chat/messages/:messageId/reactions/:emoji", requireAuth, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const { emoji } = req.params;
      
      if (isNaN(messageId)) {
        return res.status(400).json({ error: "Invalid message ID" });
      }

      const success = await storage.removeChatReaction(messageId, req.user.id, emoji);
      if (!success) {
        return res.status(404).json({ error: "Reaction not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error removing reaction:", error);
      res.status(500).json({ error: "Failed to remove reaction" });
    }
  });

  // Search messages
  app.get("/api/chat/search", requireAuth, async (req, res) => {
    try {
      const { query, channelId } = req.query;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const messages = await storage.searchMessages(
        req.user.id, 
        query as string, 
        channelId ? parseInt(channelId as string) : undefined
      );
      
      res.json(messages);
    } catch (error) {
      console.error("Error searching messages:", error);
      res.status(500).json({ error: "Failed to search messages" });
    }
  });

  // Translation endpoints
  app.post("/api/chat/messages/:messageId/translate", requireAuth, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      if (isNaN(messageId)) {
        return res.status(400).json({ error: "Invalid message ID" });
      }

      const { targetLanguage } = req.body;
      if (!targetLanguage) {
        return res.status(400).json({ error: "Target language is required" });
      }

      const message = await storage.getChatMessage(messageId);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Check if translation already exists in cache
      const cachedTranslations = message.translations || {};
      if (cachedTranslations[targetLanguage]) {
        return res.json({ 
          translatedText: cachedTranslations[targetLanguage],
          fromCache: true 
        });
      }

      // Import translation service
      const { translateText, detectLanguage } = await import("./translation");

      // Detect source language if not stored
      let sourceLanguage = message.originalLanguage;
      if (!sourceLanguage || sourceLanguage === 'en') {
        sourceLanguage = await detectLanguage(message.content);
      }

      // Translate the message
      const translationResult = await translateText({
        text: message.content,
        sourceLanguage,
        targetLanguage
      });

      // Store the translation in the database
      await storage.updateMessageTranslation(messageId, targetLanguage, translationResult.translatedText);

      res.json({ 
        translatedText: translationResult.translatedText,
        fromCache: false 
      });
    } catch (error) {
      console.error("Error translating message:", error);
      res.status(500).json({ error: "Failed to translate message" });
    }
  });

  // Get available languages for translation
  app.get("/api/chat/languages", requireAuth, async (req, res) => {
    try {
      const { getAvailableLanguages } = await import("./translation");
      const languages = getAvailableLanguages();
      res.json(languages);
    } catch (error) {
      console.error("Error fetching languages:", error);
      res.status(500).json({ error: "Failed to fetch languages" });
    }
  });

  // Stock Management Routes
  app.get("/api/stock-items", requireAuth, async (req, res) => {
    try {
      const items = await storage.getStockItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching stock items:", error);
      res.status(500).json({ error: "Failed to fetch stock items" });
    }
  });

  app.get("/api/stock-items/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getStockItem(id);
      if (!item) {
        return res.status(404).json({ error: "Stock item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching stock item:", error);
      res.status(500).json({ error: "Failed to fetch stock item" });
    }
  });

  app.post("/api/stock-items", requireAuth, async (req, res) => {
    try {
      const data = insertStockItemSchema.parse(req.body);
      const item = await storage.createStockItem(data);
      res.json(item);
    } catch (error: any) {
      console.error("Error creating stock item:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/stock-items/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertStockItemSchema.partial().parse(req.body);
      const item = await storage.updateStockItem(id, data);
      if (!item) {
        return res.status(404).json({ error: "Stock item not found" });
      }
      res.json(item);
    } catch (error: any) {
      console.error("Error updating stock item:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/stock-items/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStockItem(id);
      if (!success) {
        return res.status(404).json({ error: "Stock item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting stock item:", error);
      res.status(500).json({ error: "Failed to delete stock item" });
    }
  });

  // Stock Transactions
  app.get("/api/stock-transactions", requireAuth, async (req, res) => {
    try {
      const itemId = req.query.itemId ? parseInt(req.query.itemId as string) : undefined;
      const transactions = await storage.getStockTransactions(itemId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching stock transactions:", error);
      res.status(500).json({ error: "Failed to fetch stock transactions" });
    }
  });

  app.post("/api/stock-transactions", requireAuth, async (req, res) => {
    try {
      const data = insertStockTransactionSchema.parse(req.body);
      const transaction = await storage.createStockTransaction(data);
      res.json(transaction);
    } catch (error: any) {
      console.error("Error creating stock transaction:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Stock Balances
  app.get("/api/stock-balances", requireAuth, async (req, res) => {
    try {
      const balances = await storage.getStockBalances();
      res.json(balances);
    } catch (error) {
      console.error("Error fetching stock balances:", error);
      res.status(500).json({ error: "Failed to fetch stock balances" });
    }
  });

  app.get("/api/inventory-balances/:itemId", requireAuth, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const location = req.query.location as string;
      const balance = await storage.getInventoryBalance(itemId, location);
      if (!balance) {
        return res.status(404).json({ error: "Inventory balance not found" });
      }
      res.json(balance);
    } catch (error) {
      console.error("Error fetching inventory balance:", error);
      res.status(500).json({ error: "Failed to fetch inventory balance" });
    }
  });

  app.put("/api/inventory-balances/:itemId", requireAuth, async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const location = req.query.location as string || '';
      const data = insertInventoryBalanceSchema.partial().parse(req.body);
      const balance = await storage.updateInventoryBalance(itemId, location, data);
      if (!balance) {
        return res.status(404).json({ error: "Inventory balance not found" });
      }
      res.json(balance);
    } catch (error: any) {
      console.error("Error updating inventory balance:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Demand Planning Routes  
  app.get("/api/demand-forecasts", requireAuth, async (req, res) => {
    try {
      const itemId = req.query.itemId ? parseInt(req.query.itemId as string) : undefined;
      const forecasts = await storage.getDemandForecasts(itemId);
      res.json(forecasts);
    } catch (error) {
      console.error("Error fetching demand forecasts:", error);
      res.status(500).json({ error: "Failed to fetch demand forecasts" });
    }
  });

  app.post("/api/demand-forecasts", requireAuth, async (req, res) => {
    try {
      const data = insertDemandForecastSchema.parse(req.body);
      const forecast = await storage.createDemandForecast(data);
      res.json(forecast);
    } catch (error: any) {
      console.error("Error creating demand forecast:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/demand-forecasts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertDemandForecastSchema.partial().parse(req.body);
      const forecast = await storage.updateDemandForecast(id, data);
      if (!forecast) {
        return res.status(404).json({ error: "Demand forecast not found" });
      }
      res.json(forecast);
    } catch (error: any) {
      console.error("Error updating demand forecast:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/demand-forecasts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDemandForecast(id);
      if (!success) {
        return res.status(404).json({ error: "Demand forecast not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting demand forecast:", error);
      res.status(500).json({ error: "Failed to delete demand forecast" });
    }
  });

  // Demand Drivers
  app.get("/api/demand-drivers", requireAuth, async (req, res) => {
    try {
      const drivers = await storage.getDemandDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching demand drivers:", error);
      res.status(500).json({ error: "Failed to fetch demand drivers" });
    }
  });

  app.post("/api/demand-drivers", requireAuth, async (req, res) => {
    try {
      const data = insertDemandDriverSchema.parse(req.body);
      const driver = await storage.createDemandDriver(data);
      res.json(driver);
    } catch (error: any) {
      console.error("Error creating demand driver:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/demand-drivers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertDemandDriverSchema.partial().parse(req.body);
      const driver = await storage.updateDemandDriver(id, data);
      if (!driver) {
        return res.status(404).json({ error: "Demand driver not found" });
      }
      res.json(driver);
    } catch (error: any) {
      console.error("Error updating demand driver:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/demand-drivers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDemandDriver(id);
      if (!success) {
        return res.status(404).json({ error: "Demand driver not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting demand driver:", error);
      res.status(500).json({ error: "Failed to delete demand driver" });
    }
  });

  // Demand History
  app.get("/api/demand-history", requireAuth, async (req, res) => {
    try {
      const itemId = req.query.itemId ? parseInt(req.query.itemId as string) : undefined;
      const history = await storage.getDemandHistory(itemId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching demand history:", error);
      res.status(500).json({ error: "Failed to fetch demand history" });
    }
  });

  app.post("/api/demand-history", requireAuth, async (req, res) => {
    try {
      const data = insertDemandHistorySchema.parse(req.body);
      const history = await storage.createDemandHistory(data);
      res.json(history);
    } catch (error: any) {
      console.error("Error creating demand history:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Stock Optimization Routes
  app.get("/api/stock-optimization-scenarios", requireAuth, async (req, res) => {
    try {
      const scenarios = await storage.getStockOptimizationScenarios();
      res.json(scenarios);
    } catch (error) {
      console.error("Error fetching stock optimization scenarios:", error);
      res.status(500).json({ error: "Failed to fetch stock optimization scenarios" });
    }
  });

  app.get("/api/stock-optimization-scenarios/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const scenario = await storage.getStockOptimizationScenario(id);
      if (!scenario) {
        return res.status(404).json({ error: "Stock optimization scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      console.error("Error fetching stock optimization scenario:", error);
      res.status(500).json({ error: "Failed to fetch stock optimization scenario" });
    }
  });

  app.post("/api/stock-optimization-scenarios", requireAuth, async (req, res) => {
    try {
      const data = insertStockOptimizationScenarioSchema.parse(req.body);
      const scenario = await storage.createStockOptimizationScenario(data);
      res.json(scenario);
    } catch (error: any) {
      console.error("Error creating stock optimization scenario:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/stock-optimization-scenarios/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertStockOptimizationScenarioSchema.partial().parse(req.body);
      const scenario = await storage.updateStockOptimizationScenario(id, data);
      if (!scenario) {
        return res.status(404).json({ error: "Stock optimization scenario not found" });
      }
      res.json(scenario);
    } catch (error: any) {
      console.error("Error updating stock optimization scenario:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/stock-optimization-scenarios/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStockOptimizationScenario(id);
      if (!success) {
        return res.status(404).json({ error: "Stock optimization scenario not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting stock optimization scenario:", error);
      res.status(500).json({ error: "Failed to delete stock optimization scenario" });
    }
  });

  // Optimization Recommendations
  app.get("/api/optimization-recommendations", requireAuth, async (req, res) => {
    try {
      const scenarioId = req.query.scenarioId ? parseInt(req.query.scenarioId as string) : undefined;
      const recommendations = await storage.getOptimizationRecommendations(scenarioId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching optimization recommendations:", error);
      res.status(500).json({ error: "Failed to fetch optimization recommendations" });
    }
  });

  app.post("/api/optimization-recommendations", requireAuth, async (req, res) => {
    try {
      const data = insertOptimizationRecommendationSchema.parse(req.body);
      const recommendation = await storage.createOptimizationRecommendation(data);
      res.json(recommendation);
    } catch (error: any) {
      console.error("Error creating optimization recommendation:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/optimization-recommendations/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertOptimizationRecommendationSchema.partial().parse(req.body);
      const recommendation = await storage.updateOptimizationRecommendation(id, data);
      if (!recommendation) {
        return res.status(404).json({ error: "Optimization recommendation not found" });
      }
      res.json(recommendation);
    } catch (error: any) {
      console.error("Error updating optimization recommendation:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/optimization-recommendations/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteOptimizationRecommendation(id);
      if (!success) {
        return res.status(404).json({ error: "Optimization recommendation not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting optimization recommendation:", error);
      res.status(500).json({ error: "Failed to delete optimization recommendation" });
    }
  });

  // Industry Templates API Routes
  app.get("/api/industry-templates", requireAuth, async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      
      if (category) {
        const templates = await storage.getIndustryTemplatesByCategory(category);
        res.json(templates);
      } else {
        const templates = await storage.getIndustryTemplates();
        res.json(templates);
      }
    } catch (error) {
      console.error("Error fetching industry templates:", error);
      res.status(500).json({ error: "Failed to fetch industry templates" });
    }
  });

  app.get("/api/industry-templates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }

      const template = await storage.getIndustryTemplate(id);
      if (!template) {
        return res.status(404).json({ error: "Industry template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching industry template:", error);
      res.status(500).json({ error: "Failed to fetch industry template" });
    }
  });

  app.post("/api/industry-templates", requireAuth, async (req, res) => {
    try {
      const template = await storage.createIndustryTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating industry template:", error);
      res.status(500).json({ error: "Failed to create industry template" });
    }
  });

  app.put("/api/industry-templates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }

      const template = await storage.updateIndustryTemplate(id, req.body);
      if (!template) {
        return res.status(404).json({ error: "Industry template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error updating industry template:", error);
      res.status(500).json({ error: "Failed to update industry template" });
    }
  });

  app.delete("/api/industry-templates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }

      const success = await storage.deleteIndustryTemplate(id);
      if (!success) {
        return res.status(404).json({ error: "Industry template not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting industry template:", error);
      res.status(500).json({ error: "Failed to delete industry template" });
    }
  });

  // User Industry Templates API Routes
  app.get("/api/users/:userId/industry-templates", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const templates = await storage.getUserIndustryTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching user industry templates:", error);
      res.status(500).json({ error: "Failed to fetch user industry templates" });
    }
  });

  app.get("/api/users/:userId/industry-templates/active", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const activeTemplate = await storage.getUserActiveTemplate(userId);
      if (!activeTemplate) {
        return res.status(404).json({ error: "No active template found" });
      }
      
      res.json(activeTemplate);
    } catch (error) {
      console.error("Error fetching active user template:", error);
      res.status(500).json({ error: "Failed to fetch active template" });
    }
  });

  app.post("/api/users/:userId/industry-templates/:templateId/apply", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const templateId = parseInt(req.params.templateId);
      
      if (isNaN(userId) || isNaN(templateId)) {
        return res.status(400).json({ error: "Invalid user ID or template ID" });
      }

      const { customizations } = req.body;
      
      const appliedTemplate = await storage.applyTemplateToUser(userId, templateId, customizations);
      res.json(appliedTemplate);
    } catch (error) {
      console.error("Error applying template to user:", error);
      res.status(500).json({ error: "Failed to apply template to user" });
    }
  });

  app.delete("/api/users/:userId/industry-templates/:templateId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const templateId = parseInt(req.params.templateId);
      
      if (isNaN(userId) || isNaN(templateId)) {
        return res.status(400).json({ error: "Invalid user ID or template ID" });
      }

      const success = await storage.removeTemplateFromUser(userId, templateId);
      if (!success) {
        return res.status(404).json({ error: "Template association not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing template from user:", error);
      res.status(500).json({ error: "Failed to remove template from user" });
    }
  });

  // AI-powered industry template generation
  app.post("/api/industry-templates/generate", requireAuth, async (req, res) => {
    try {
      const { industry, sourceUrl, sourcePrompt, createdBy } = req.body;
      
      if (!industry || !createdBy) {
        return res.status(400).json({ error: "Industry name and creator are required" });
      }

      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      let analysisPrompt = '';
      
      if (sourceUrl) {
        // Analyze website URL to generate industry template
        analysisPrompt = `Analyze the following website and create a comprehensive manufacturing industry template based on the company's industry and operations: ${sourceUrl}
        
        Create a detailed template configuration that includes:`;
      } else if (sourcePrompt) {
        // Use user-provided description
        analysisPrompt = `Based on this industry description, create a comprehensive manufacturing industry template: "${sourcePrompt}"
        
        Create a detailed template configuration that includes:`;
      } else {
        // Generic industry template
        analysisPrompt = `Create a comprehensive manufacturing industry template for "${industry}" industry.
        
        Create a detailed template configuration that includes:`;
      }

      analysisPrompt += `

      1. Analytics KPIs (5-8 relevant metrics with formulas, targets, and units)
      2. Dashboard widgets (4-6 widgets with specific configurations)
      3. Report templates (3-5 industry-specific reports)
      4. Visual Factory displays (3-4 display types with content)
      5. Shop Floor workstations and workflows
      6. Color scheme appropriate for the industry
      7. Keywords for search and categorization

      Return ONLY a valid JSON object with this exact structure:
      {
        "name": "Industry Name Manufacturing",
        "description": "Brief description of this industry template",
        "category": "industry_category",
        "keywords": ["keyword1", "keyword2", "keyword3"],
        "colorScheme": {
          "primary": "#hex",
          "secondary": "#hex", 
          "accent": "#hex",
          "background": "#hex",
          "text": "#hex"
        },
        "configurations": {
          "analytics": {
            "kpis": [
              {
                "name": "KPI Name",
                "description": "KPI description",
                "formula": "calculation formula",
                "target": 95,
                "unit": "unit"
              }
            ],
            "dashboards": [
              {
                "name": "Dashboard Name",
                "widgets": [
                  {
                    "type": "metric",
                    "title": "Widget Title",
                    "config": {}
                  }
                ]
              }
            ]
          },
          "reports": [
            {
              "name": "Report Name",
              "description": "Report description",
              "type": "operational",
              "schedule": "daily",
              "recipients": ["operations@company.com"],
              "template": {}
            }
          ],
          "visualFactory": {
            "displays": [
              {
                "name": "Display Name",
                "type": "kpi_dashboard",
                "content": {},
                "position": "main_floor",
                "settings": {}
              }
            ],
            "layouts": [
              {
                "name": "Main Floor Layout",
                "displays": ["display1", "display2"],
                "rotation": 30
              }
            ]
          },
          "shopFloor": {
            "workstations": [
              {
                "name": "Workstation Name",
                "type": "assembly",
                "capabilities": ["capability1", "capability2"],
                "layout": {}
              }
            ],
            "workflows": [
              {
                "name": "Workflow Name",
                "steps": [
                  {
                    "name": "Step Name",
                    "description": "Step description",
                    "requirements": ["requirement1"]
                  }
                ]
              }
            ]
          }
        }
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert in manufacturing operations and industry analysis. Generate comprehensive, realistic templates for manufacturing management systems."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3
      });

      let generatedContent = response.choices[0].message.content || '';
      
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        generatedContent = jsonMatch[1];
      }

      let templateData;
      try {
        templateData = JSON.parse(generatedContent);
      } catch (parseError) {
        console.error("Failed to parse AI template response:", parseError);
        return res.status(500).json({ message: "AI generated invalid template format" });
      }

      // Create the industry template
      const newTemplate = await storage.createIndustryTemplate({
        ...templateData,
        isAiGenerated: true,
        sourceUrl: sourceUrl || null,
        sourcePrompt: sourcePrompt || null,
        createdBy
      });

      res.json(newTemplate);
    } catch (error) {
      console.error("Error generating industry template:", error);
      res.status(500).json({ error: "Failed to generate industry template" });
    }
  });

  // Subscription and Payment Routes (for prospects)
  
  // Start free trial - creates trial account
  app.post("/api/start-trial", async (req, res) => {
    try {
      const { email, companyName } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Check if trial user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.json({ 
          success: true, 
          message: "Trial already active",
          trialUserId: existingUser.id 
        });
      }
      
      // Create trial user account
      const trialUser = await storage.createUser({
        username: email.split('@')[0] + '_trial',
        email: email,
        passwordHash: '', // No password for trial users
        isTrialUser: true,
        trialStartDate: new Date(),
        companyName: companyName || null
      });
      
      res.json({
        success: true,
        message: "Trial started successfully",
        trialUserId: trialUser.id,
        trialDays: 14
      });
      
    } catch (error) {
      console.error("Error starting trial:", error);
      res.status(500).json({ error: "Failed to start trial" });
    }
  });
  
  // Create Stripe checkout session for subscription
  app.post("/api/create-subscription", async (req, res) => {
    try {
      const { priceId, email } = req.body;
      
      if (!priceId || !email) {
        return res.status(400).json({ error: "Price ID and email are required" });
      }
      
      // Mock response for now - implement with Stripe when secret keys are available
      res.json({
        success: true,
        message: "Subscription checkout would be created here",
        checkoutUrl: "/pricing?success=true",
        mockData: {
          priceId,
          email,
          note: "Stripe integration requires STRIPE_SECRET_KEY to be configured"
        }
      });
      
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Account Management Routes
  app.get("/api/account", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const account = await storage.getAccountInfo(userId);
      
      if (!account) {
        // Create default account info for existing users
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        const defaultAccount = await storage.createAccountInfo({
          userId,
          companyName: user.email?.split('@')[1]?.split('.')[0] || "Your Company",
          subscriptionPlan: "starter",
          subscriptionStatus: "trial",
          currentUsers: 1,
          maxUsers: 5,
          billingCycle: "monthly",
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          totalAmount: 2900, // $29 in cents
          paymentMethod: {
            type: 'card',
            last4: '1234',
            brand: 'visa',
            expiryMonth: 12,
            expiryYear: 2025
          },
          features: [
            "Basic scheduling",
            "Standard reports", 
            "Email support",
            "Mobile app access"
          ],
          usage: {
            apiCalls: 1234,
            apiLimit: 10000,
            storage: 2.3,
            storageLimit: 5
          },
          billingAddress: {
            street: "123 Main Street",
            city: "San Francisco",
            state: "CA",
            zipCode: "94105",
            country: "United States"
          },
          contactInfo: {
            primaryEmail: user.email || "user@example.com",
            billingEmail: user.email || "billing@example.com",
            phone: "+1 (555) 123-4567"
          },
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
        });
        
        return res.json(defaultAccount);
      }
      
      res.json(account);
    } catch (error) {
      console.error("Error fetching account info:", error);
      res.status(500).json({ error: "Failed to fetch account information" });
    }
  });

  app.post("/api/account/upgrade", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { planId } = req.body;
      
      const planPrices = {
        starter: 2900, // $29
        professional: 8900, // $89
        enterprise: 24900, // $249
        custom: 0 // Contact for pricing
      };
      
      const planFeatures = {
        starter: ['Basic scheduling', 'Standard reports', 'Email support', 'Mobile app access'],
        professional: ['Advanced scheduling', 'Custom reports', 'Priority support', 'API access', 'Integration tools'],
        enterprise: ['All features', 'Custom integrations', 'Dedicated support', 'Advanced analytics', 'White-label options'],
        custom: ['Everything in Enterprise', 'Custom development', 'On-premise deployment', 'SLA guarantees']
      };
      
      const planLimits = {
        starter: { users: 5, apiLimit: 10000, storageLimit: 5 },
        professional: { users: 25, apiLimit: 50000, storageLimit: 25 },
        enterprise: { users: 100, apiLimit: 200000, storageLimit: 100 },
        custom: { users: -1, apiLimit: -1, storageLimit: -1 }
      };

      const updatedAccount = await storage.updateAccountInfo(userId, {
        subscriptionPlan: planId,
        subscriptionStatus: "active",
        totalAmount: planPrices[planId] || 0,
        maxUsers: planLimits[planId]?.users || 5,
        features: planFeatures[planId] || [],
        usage: {
          apiCalls: 0, // Reset usage on upgrade
          apiLimit: planLimits[planId]?.apiLimit || 10000,
          storage: 0,
          storageLimit: planLimits[planId]?.storageLimit || 5
        }
      });

      res.json(updatedAccount);
    } catch (error) {
      console.error("Error upgrading plan:", error);
      res.status(500).json({ error: "Failed to upgrade subscription plan" });
    }
  });

  app.put("/api/account/billing", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { paymentMethod, billingAddress, contactInfo } = req.body;

      const updatedAccount = await storage.updateAccountInfo(userId, {
        paymentMethod,
        billingAddress,
        contactInfo
      });

      res.json(updatedAccount);
    } catch (error) {
      console.error("Error updating billing info:", error);
      res.status(500).json({ error: "Failed to update billing information" });
    }
  });

  app.get("/api/account/billing-history", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const account = await storage.getAccountInfo(userId);
      
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      const billingHistory = await storage.getBillingHistory(account.id);
      res.json(billingHistory);
    } catch (error) {
      console.error("Error fetching billing history:", error);
      res.status(500).json({ error: "Failed to fetch billing history" });
    }
  });

  app.get("/api/account/usage", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { metricType } = req.query;
      const account = await storage.getAccountInfo(userId);
      
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      
      const usageMetrics = await storage.getUsageMetrics(account.id, metricType as string);
      res.json(usageMetrics);
    } catch (error) {
      console.error("Error fetching usage metrics:", error);
      res.status(500).json({ error: "Failed to fetch usage metrics" });
    }
  });

  app.get("/api/account/invoice/latest", requireAuth, async (req, res) => {
    try {
      // Mock PDF generation for now
      const pdfContent = `
        Invoice #INV-${Date.now()}
        
        Date: ${new Date().toLocaleDateString()}
        Due Date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
        
        Subscription: Professional Plan
        Amount: $89.00
        
        Thank you for your business!
      `;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
      res.send(Buffer.from(pdfContent, 'utf8'));
    } catch (error) {
      console.error("Error generating invoice:", error);
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  });

  // System Integrations API Routes
  app.get("/api/system-integrations", async (req, res) => {
    try {
      const integrations = await storage.getSystemIntegrations();
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching system integrations:", error);
      res.status(500).json({ error: "Failed to fetch system integrations" });
    }
  });

  app.get("/api/system-integrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid integration ID" });
      }

      const integration = await storage.getSystemIntegration(id);
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }
      res.json(integration);
    } catch (error) {
      console.error("Error fetching system integration:", error);
      res.status(500).json({ error: "Failed to fetch system integration" });
    }
  });

  app.post("/api/system-integrations", async (req, res) => {
    try {
      const validation = insertSystemIntegrationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid integration data", details: validation.error.errors });
      }

      const integration = await storage.createSystemIntegration(validation.data);
      res.status(201).json(integration);
    } catch (error) {
      console.error("Error creating system integration:", error);
      res.status(500).json({ error: "Failed to create system integration" });
    }
  });

  app.put("/api/system-integrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid integration ID" });
      }

      const validation = insertSystemIntegrationSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid integration data", details: validation.error.errors });
      }

      const integration = await storage.updateSystemIntegration(id, validation.data);
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }
      res.json(integration);
    } catch (error) {
      console.error("Error updating system integration:", error);
      res.status(500).json({ error: "Failed to update system integration" });
    }
  });

  app.delete("/api/system-integrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid integration ID" });
      }

      const success = await storage.deleteSystemIntegration(id);
      if (!success) {
        return res.status(404).json({ error: "Integration not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting system integration:", error);
      res.status(500).json({ error: "Failed to delete system integration" });
    }
  });

  app.post("/api/system-integrations/:id/test", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid integration ID" });
      }

      const result = await storage.testSystemIntegrationConnection(id);
      res.json(result);
    } catch (error) {
      console.error("Error testing system integration:", error);
      res.status(500).json({ error: "Failed to test system integration" });
    }
  });

  // Integration Data Flows API Routes
  app.get("/api/integration-data-flows", async (req, res) => {
    try {
      const integrationId = req.query.integrationId ? parseInt(req.query.integrationId as string) : undefined;
      const dataFlows = await storage.getIntegrationDataFlows(integrationId);
      res.json(dataFlows);
    } catch (error) {
      console.error("Error fetching integration data flows:", error);
      res.status(500).json({ error: "Failed to fetch integration data flows" });
    }
  });

  app.get("/api/integration-data-flows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid data flow ID" });
      }

      const dataFlow = await storage.getIntegrationDataFlow(id);
      if (!dataFlow) {
        return res.status(404).json({ error: "Data flow not found" });
      }
      res.json(dataFlow);
    } catch (error) {
      console.error("Error fetching integration data flow:", error);
      res.status(500).json({ error: "Failed to fetch integration data flow" });
    }
  });

  app.post("/api/integration-data-flows", async (req, res) => {
    try {
      const validation = insertIntegrationDataFlowSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid data flow data", details: validation.error.errors });
      }

      const dataFlow = await storage.createIntegrationDataFlow(validation.data);
      res.status(201).json(dataFlow);
    } catch (error) {
      console.error("Error creating integration data flow:", error);
      res.status(500).json({ error: "Failed to create integration data flow" });
    }
  });

  app.put("/api/integration-data-flows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid data flow ID" });
      }

      const validation = insertIntegrationDataFlowSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid data flow data", details: validation.error.errors });
      }

      const dataFlow = await storage.updateIntegrationDataFlow(id, validation.data);
      if (!dataFlow) {
        return res.status(404).json({ error: "Data flow not found" });
      }
      res.json(dataFlow);
    } catch (error) {
      console.error("Error updating integration data flow:", error);
      res.status(500).json({ error: "Failed to update integration data flow" });
    }
  });

  app.delete("/api/integration-data-flows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid data flow ID" });
      }

      const success = await storage.deleteIntegrationDataFlow(id);
      if (!success) {
        return res.status(404).json({ error: "Data flow not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting integration data flow:", error);
      res.status(500).json({ error: "Failed to delete integration data flow" });
    }
  });

  app.post("/api/integration-data-flows/:id/execute", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid data flow ID" });
      }

      const result = await storage.executeIntegrationDataFlow(id);
      res.json(result);
    } catch (error) {
      console.error("Error executing integration data flow:", error);
      res.status(500).json({ error: "Failed to execute integration data flow" });
    }
  });

  // Integration Execution Logs API Routes
  app.get("/api/integration-execution-logs", async (req, res) => {
    try {
      const dataFlowId = req.query.dataFlowId ? parseInt(req.query.dataFlowId as string) : undefined;
      const logs = await storage.getIntegrationExecutionLogs(dataFlowId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching integration execution logs:", error);
      res.status(500).json({ error: "Failed to fetch integration execution logs" });
    }
  });

  app.get("/api/integration-execution-logs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid execution log ID" });
      }

      const log = await storage.getIntegrationExecutionLog(id);
      if (!log) {
        return res.status(404).json({ error: "Execution log not found" });
      }
      res.json(log);
    } catch (error) {
      console.error("Error fetching integration execution log:", error);
      res.status(500).json({ error: "Failed to fetch integration execution log" });
    }
  });

  // Integration Data Mappings API Routes
  app.get("/api/integration-data-mappings", async (req, res) => {
    try {
      const dataFlowId = parseInt(req.query.dataFlowId as string);
      if (isNaN(dataFlowId)) {
        return res.status(400).json({ error: "dataFlowId is required" });
      }

      const mappings = await storage.getIntegrationDataMappings(dataFlowId);
      res.json(mappings);
    } catch (error) {
      console.error("Error fetching integration data mappings:", error);
      res.status(500).json({ error: "Failed to fetch integration data mappings" });
    }
  });

  app.post("/api/integration-data-mappings", async (req, res) => {
    try {
      const validation = insertIntegrationDataMappingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid data mapping data", details: validation.error.errors });
      }

      const mapping = await storage.createIntegrationDataMapping(validation.data);
      res.status(201).json(mapping);
    } catch (error) {
      console.error("Error creating integration data mapping:", error);
      res.status(500).json({ error: "Failed to create integration data mapping" });
    }
  });

  app.put("/api/integration-data-mappings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid data mapping ID" });
      }

      const validation = insertIntegrationDataMappingSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid data mapping data", details: validation.error.errors });
      }

      const mapping = await storage.updateIntegrationDataMapping(id, validation.data);
      if (!mapping) {
        return res.status(404).json({ error: "Data mapping not found" });
      }
      res.json(mapping);
    } catch (error) {
      console.error("Error updating integration data mapping:", error);
      res.status(500).json({ error: "Failed to update integration data mapping" });
    }
  });

  app.delete("/api/integration-data-mappings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid data mapping ID" });
      }

      const success = await storage.deleteIntegrationDataMapping(id);
      if (!success) {
        return res.status(404).json({ error: "Data mapping not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting integration data mapping:", error);
      res.status(500).json({ error: "Failed to delete integration data mapping" });
    }
  });

  // Integration Webhooks API Routes
  app.get("/api/integration-webhooks", async (req, res) => {
    try {
      const integrationId = req.query.integrationId ? parseInt(req.query.integrationId as string) : undefined;
      const webhooks = await storage.getIntegrationWebhooks(integrationId);
      res.json(webhooks);
    } catch (error) {
      console.error("Error fetching integration webhooks:", error);
      res.status(500).json({ error: "Failed to fetch integration webhooks" });
    }
  });

  app.post("/api/integration-webhooks", async (req, res) => {
    try {
      const validation = insertIntegrationWebhookSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid webhook data", details: validation.error.errors });
      }

      const webhook = await storage.createIntegrationWebhook(validation.data);
      res.status(201).json(webhook);
    } catch (error) {
      console.error("Error creating integration webhook:", error);
      res.status(500).json({ error: "Failed to create integration webhook" });
    }
  });

  app.put("/api/integration-webhooks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid webhook ID" });
      }

      const validation = insertIntegrationWebhookSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid webhook data", details: validation.error.errors });
      }

      const webhook = await storage.updateIntegrationWebhook(id, validation.data);
      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found" });
      }
      res.json(webhook);
    } catch (error) {
      console.error("Error updating integration webhook:", error);
      res.status(500).json({ error: "Failed to update integration webhook" });
    }
  });

  app.delete("/api/integration-webhooks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid webhook ID" });
      }

      const success = await storage.deleteIntegrationWebhook(id);
      if (!success) {
        return res.status(404).json({ error: "Webhook not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting integration webhook:", error);
      res.status(500).json({ error: "Failed to delete integration webhook" });
    }
  });

  app.post("/api/integration-webhooks/:id/trigger", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid webhook ID" });
      }

      const result = await storage.triggerIntegrationWebhook(id, req.body);
      res.json(result);
    } catch (error) {
      console.error("Error triggering integration webhook:", error);
      res.status(500).json({ error: "Failed to trigger integration webhook" });
    }
  });

  // Extension Studio API Routes
  app.get("/api/extensions", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const extensions = await storage.getExtensions(userId);
      res.json(extensions);
    } catch (error) {
      console.error("Error fetching extensions:", error);
      res.status(500).json({ error: "Failed to fetch extensions" });
    }
  });

  app.get("/api/extensions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid extension ID" });
      }

      const extension = await storage.getExtensionById(id);
      if (!extension) {
        return res.status(404).json({ error: "Extension not found" });
      }
      res.json(extension);
    } catch (error) {
      console.error("Error fetching extension:", error);
      res.status(500).json({ error: "Failed to fetch extension" });
    }
  });

  app.post("/api/extensions", async (req, res) => {
    try {
      const validation = insertExtensionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid extension data", details: validation.error.errors });
      }

      const extension = await storage.createExtension(validation.data);
      res.status(201).json(extension);
    } catch (error) {
      console.error("Error creating extension:", error);
      res.status(500).json({ error: "Failed to create extension" });
    }
  });

  app.put("/api/extensions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid extension ID" });
      }

      const validation = insertExtensionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid extension data", details: validation.error.errors });
      }

      const extension = await storage.updateExtension(id, validation.data);
      if (!extension) {
        return res.status(404).json({ error: "Extension not found" });
      }
      res.json(extension);
    } catch (error) {
      console.error("Error updating extension:", error);
      res.status(500).json({ error: "Failed to update extension" });
    }
  });

  app.delete("/api/extensions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid extension ID" });
      }

      const success = await storage.deleteExtension(id);
      if (!success) {
        return res.status(404).json({ error: "Extension not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting extension:", error);
      res.status(500).json({ error: "Failed to delete extension" });
    }
  });

  // Extension Files
  app.get("/api/extensions/:id/files", async (req, res) => {
    try {
      const extensionId = parseInt(req.params.id);
      if (isNaN(extensionId)) {
        return res.status(400).json({ error: "Invalid extension ID" });
      }

      const files = await storage.getExtensionFiles(extensionId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching extension files:", error);
      res.status(500).json({ error: "Failed to fetch extension files" });
    }
  });

  app.post("/api/extensions/:id/files", async (req, res) => {
    try {
      const extensionId = parseInt(req.params.id);
      if (isNaN(extensionId)) {
        return res.status(400).json({ error: "Invalid extension ID" });
      }

      const validation = insertExtensionFileSchema.safeParse({
        ...req.body,
        extensionId
      });
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid file data", details: validation.error.errors });
      }

      const file = await storage.createExtensionFile(validation.data);
      res.status(201).json(file);
    } catch (error) {
      console.error("Error creating extension file:", error);
      res.status(500).json({ error: "Failed to create extension file" });
    }
  });

  app.put("/api/extension-files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid file ID" });
      }

      const validation = insertExtensionFileSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid file data", details: validation.error.errors });
      }

      const file = await storage.updateExtensionFile(id, validation.data);
      if (!file) {
        return res.status(404).json({ error: "Extension file not found" });
      }
      res.json(file);
    } catch (error) {
      console.error("Error updating extension file:", error);
      res.status(500).json({ error: "Failed to update extension file" });
    }
  });

  app.delete("/api/extension-files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid file ID" });
      }

      const success = await storage.deleteExtensionFile(id);
      if (!success) {
        return res.status(404).json({ error: "Extension file not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting extension file:", error);
      res.status(500).json({ error: "Failed to delete extension file" });
    }
  });

  // Extension Marketplace
  app.get("/api/marketplace/extensions", async (req, res) => {
    try {
      const extensions = await storage.getMarketplaceExtensions();
      res.json(extensions);
    } catch (error) {
      console.error("Error fetching marketplace extensions:", error);
      res.status(500).json({ error: "Failed to fetch marketplace extensions" });
    }
  });

  // User Extensions (Installations)
  app.get("/api/users/:userId/extensions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const extensions = await storage.getUserExtensions(userId);
      res.json(extensions);
    } catch (error) {
      console.error("Error fetching user extensions:", error);
      res.status(500).json({ error: "Failed to fetch user extensions" });
    }
  });

  app.post("/api/extensions/:id/install", async (req, res) => {
    try {
      const extensionId = parseInt(req.params.id);
      if (isNaN(extensionId)) {
        return res.status(400).json({ error: "Invalid extension ID" });
      }

      const validation = insertExtensionInstallationSchema.safeParse({
        ...req.body,
        extensionId
      });
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid installation data", details: validation.error.errors });
      }

      const installation = await storage.createExtensionInstallation(validation.data);
      res.status(201).json(installation);
    } catch (error) {
      console.error("Error installing extension:", error);
      res.status(500).json({ error: "Failed to install extension" });
    }
  });

  // Workflow Automation API Routes
  app.get("/api/workflows", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const workflows = await storage.getWorkflows(userId);
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({ error: "Failed to fetch workflows" });
    }
  });

  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid workflow ID" });
      }

      const workflow = await storage.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      console.error("Error fetching workflow:", error);
      res.status(500).json({ error: "Failed to fetch workflow" });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const validation = insertWorkflowSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid workflow data", details: validation.error.errors });
      }

      const workflow = await storage.createWorkflow(validation.data);
      res.status(201).json(workflow);
    } catch (error) {
      console.error("Error creating workflow:", error);
      res.status(500).json({ error: "Failed to create workflow" });
    }
  });

  app.put("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid workflow ID" });
      }

      const validation = insertWorkflowSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid workflow data", details: validation.error.errors });
      }

      const workflow = await storage.updateWorkflow(id, validation.data);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      console.error("Error updating workflow:", error);
      res.status(500).json({ error: "Failed to update workflow" });
    }
  });

  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid workflow ID" });
      }

      const success = await storage.deleteWorkflow(id);
      if (!success) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting workflow:", error);
      res.status(500).json({ error: "Failed to delete workflow" });
    }
  });

  app.post("/api/workflows/:id/execute", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid workflow ID" });
      }

      const { context } = req.body;
      const execution = await storage.executeWorkflow(id, context);
      res.status(201).json(execution);
    } catch (error) {
      console.error("Error executing workflow:", error);
      res.status(500).json({ error: "Failed to execute workflow" });
    }
  });

  // Workflow Triggers
  app.get("/api/workflow-triggers", async (req, res) => {
    try {
      const workflowId = req.query.workflowId ? parseInt(req.query.workflowId as string) : undefined;
      const triggers = await storage.getWorkflowTriggers(workflowId);
      res.json(triggers);
    } catch (error) {
      console.error("Error fetching workflow triggers:", error);
      res.status(500).json({ error: "Failed to fetch workflow triggers" });
    }
  });

  app.get("/api/workflow-triggers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid trigger ID" });
      }

      const trigger = await storage.getWorkflowTrigger(id);
      if (!trigger) {
        return res.status(404).json({ error: "Workflow trigger not found" });
      }
      res.json(trigger);
    } catch (error) {
      console.error("Error fetching workflow trigger:", error);
      res.status(500).json({ error: "Failed to fetch workflow trigger" });
    }
  });

  app.post("/api/workflow-triggers", async (req, res) => {
    try {
      const validation = insertWorkflowTriggerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid trigger data", details: validation.error.errors });
      }

      const trigger = await storage.createWorkflowTrigger(validation.data);
      res.status(201).json(trigger);
    } catch (error) {
      console.error("Error creating workflow trigger:", error);
      res.status(500).json({ error: "Failed to create workflow trigger" });
    }
  });

  app.put("/api/workflow-triggers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid trigger ID" });
      }

      const validation = insertWorkflowTriggerSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid trigger data", details: validation.error.errors });
      }

      const trigger = await storage.updateWorkflowTrigger(id, validation.data);
      if (!trigger) {
        return res.status(404).json({ error: "Workflow trigger not found" });
      }
      res.json(trigger);
    } catch (error) {
      console.error("Error updating workflow trigger:", error);
      res.status(500).json({ error: "Failed to update workflow trigger" });
    }
  });

  app.delete("/api/workflow-triggers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid trigger ID" });
      }

      const success = await storage.deleteWorkflowTrigger(id);
      if (!success) {
        return res.status(404).json({ error: "Workflow trigger not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting workflow trigger:", error);
      res.status(500).json({ error: "Failed to delete workflow trigger" });
    }
  });

  // Workflow Actions
  app.get("/api/workflow-actions", async (req, res) => {
    try {
      const workflowId = req.query.workflowId ? parseInt(req.query.workflowId as string) : undefined;
      const actions = await storage.getWorkflowActions(workflowId);
      res.json(actions);
    } catch (error) {
      console.error("Error fetching workflow actions:", error);
      res.status(500).json({ error: "Failed to fetch workflow actions" });
    }
  });

  app.get("/api/workflow-actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid action ID" });
      }

      const action = await storage.getWorkflowAction(id);
      if (!action) {
        return res.status(404).json({ error: "Workflow action not found" });
      }
      res.json(action);
    } catch (error) {
      console.error("Error fetching workflow action:", error);
      res.status(500).json({ error: "Failed to fetch workflow action" });
    }
  });

  app.post("/api/workflow-actions", async (req, res) => {
    try {
      const validation = insertWorkflowActionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid action data", details: validation.error.errors });
      }

      const action = await storage.createWorkflowAction(validation.data);
      res.status(201).json(action);
    } catch (error) {
      console.error("Error creating workflow action:", error);
      res.status(500).json({ error: "Failed to create workflow action" });
    }
  });

  app.put("/api/workflow-actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid action ID" });
      }

      const validation = insertWorkflowActionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid action data", details: validation.error.errors });
      }

      const action = await storage.updateWorkflowAction(id, validation.data);
      if (!action) {
        return res.status(404).json({ error: "Workflow action not found" });
      }
      res.json(action);
    } catch (error) {
      console.error("Error updating workflow action:", error);
      res.status(500).json({ error: "Failed to update workflow action" });
    }
  });

  app.delete("/api/workflow-actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid action ID" });
      }

      const success = await storage.deleteWorkflowAction(id);
      if (!success) {
        return res.status(404).json({ error: "Workflow action not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting workflow action:", error);
      res.status(500).json({ error: "Failed to delete workflow action" });
    }
  });

  // Workflow Action Mappings
  app.get("/api/workflows/:workflowId/action-mappings", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.workflowId);
      if (isNaN(workflowId)) {
        return res.status(400).json({ error: "Invalid workflow ID" });
      }

      const mappings = await storage.getWorkflowActionMappings(workflowId);
      res.json(mappings);
    } catch (error) {
      console.error("Error fetching workflow action mappings:", error);
      res.status(500).json({ error: "Failed to fetch workflow action mappings" });
    }
  });

  app.post("/api/workflow-action-mappings", async (req, res) => {
    try {
      const validation = insertWorkflowActionMappingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid mapping data", details: validation.error.errors });
      }

      const mapping = await storage.createWorkflowActionMapping(validation.data);
      res.status(201).json(mapping);
    } catch (error) {
      console.error("Error creating workflow action mapping:", error);
      res.status(500).json({ error: "Failed to create workflow action mapping" });
    }
  });

  app.delete("/api/workflow-action-mappings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid mapping ID" });
      }

      const success = await storage.deleteWorkflowActionMapping(id);
      if (!success) {
        return res.status(404).json({ error: "Workflow action mapping not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting workflow action mapping:", error);
      res.status(500).json({ error: "Failed to delete workflow action mapping" });
    }
  });

  // Workflow Executions
  app.get("/api/workflow-executions", async (req, res) => {
    try {
      const workflowId = req.query.workflowId ? parseInt(req.query.workflowId as string) : undefined;
      const executions = await storage.getWorkflowExecutions(workflowId);
      res.json(executions);
    } catch (error) {
      console.error("Error fetching workflow executions:", error);
      res.status(500).json({ error: "Failed to fetch workflow executions" });
    }
  });

  app.get("/api/workflow-executions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid execution ID" });
      }

      const execution = await storage.getWorkflowExecution(id);
      if (!execution) {
        return res.status(404).json({ error: "Workflow execution not found" });
      }
      res.json(execution);
    } catch (error) {
      console.error("Error fetching workflow execution:", error);
      res.status(500).json({ error: "Failed to fetch workflow execution" });
    }
  });

  app.put("/api/workflow-executions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid execution ID" });
      }

      const validation = insertWorkflowExecutionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid execution data", details: validation.error.errors });
      }

      const execution = await storage.updateWorkflowExecution(id, validation.data);
      if (!execution) {
        return res.status(404).json({ error: "Workflow execution not found" });
      }
      res.json(execution);
    } catch (error) {
      console.error("Error updating workflow execution:", error);
      res.status(500).json({ error: "Failed to update workflow execution" });
    }
  });

  // Workflow Action Executions
  app.get("/api/workflow-executions/:executionId/actions", async (req, res) => {
    try {
      const executionId = parseInt(req.params.executionId);
      if (isNaN(executionId)) {
        return res.status(400).json({ error: "Invalid execution ID" });
      }

      const actionExecutions = await storage.getWorkflowActionExecutions(executionId);
      res.json(actionExecutions);
    } catch (error) {
      console.error("Error fetching workflow action executions:", error);
      res.status(500).json({ error: "Failed to fetch workflow action executions" });
    }
  });

  app.post("/api/workflow-action-executions", async (req, res) => {
    try {
      const validation = insertWorkflowActionExecutionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid action execution data", details: validation.error.errors });
      }

      const actionExecution = await storage.createWorkflowActionExecution(validation.data);
      res.status(201).json(actionExecution);
    } catch (error) {
      console.error("Error creating workflow action execution:", error);
      res.status(500).json({ error: "Failed to create workflow action execution" });
    }
  });

  app.put("/api/workflow-action-executions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid action execution ID" });
      }

      const validation = insertWorkflowActionExecutionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid action execution data", details: validation.error.errors });
      }

      const actionExecution = await storage.updateWorkflowActionExecution(id, validation.data);
      if (!actionExecution) {
        return res.status(404).json({ error: "Workflow action execution not found" });
      }
      res.json(actionExecution);
    } catch (error) {
      console.error("Error updating workflow action execution:", error);
      res.status(500).json({ error: "Failed to update workflow action execution" });
    }
  });

  // Workflow Monitoring
  app.get("/api/workflow-monitoring", async (req, res) => {
    try {
      const workflowId = req.query.workflowId ? parseInt(req.query.workflowId as string) : undefined;
      const monitoring = await storage.getWorkflowMonitoring(workflowId);
      res.json(monitoring);
    } catch (error) {
      console.error("Error fetching workflow monitoring:", error);
      res.status(500).json({ error: "Failed to fetch workflow monitoring" });
    }
  });

  app.post("/api/workflow-monitoring", async (req, res) => {
    try {
      const validation = insertWorkflowMonitoringSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid monitoring data", details: validation.error.errors });
      }

      const monitoring = await storage.createWorkflowMonitoring(validation.data);
      res.status(201).json(monitoring);
    } catch (error) {
      console.error("Error creating workflow monitoring:", error);
      res.status(500).json({ error: "Failed to create workflow monitoring" });
    }
  });

  app.put("/api/workflow-monitoring/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid monitoring ID" });
      }

      const validation = insertWorkflowMonitoringSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid monitoring data", details: validation.error.errors });
      }

      const monitoring = await storage.updateWorkflowMonitoring(id, validation.data);
      if (!monitoring) {
        return res.status(404).json({ error: "Workflow monitoring not found" });
      }
      res.json(monitoring);
    } catch (error) {
      console.error("Error updating workflow monitoring:", error);
      res.status(500).json({ error: "Failed to update workflow monitoring" });
    }
  });

  app.delete("/api/workflow-monitoring/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid monitoring ID" });
      }

      const success = await storage.deleteWorkflowMonitoring(id);
      if (!success) {
        return res.status(404).json({ error: "Workflow monitoring not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting workflow monitoring:", error);
      res.status(500).json({ error: "Failed to delete workflow monitoring" });
    }
  });

  // Presentation System API Endpoints
  
  // Presentations CRUD
  app.get("/api/presentations", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const presentations = await storage.getPresentations(userId);
      res.json(presentations);
    } catch (error) {
      console.error("Error getting presentations:", error);
      res.status(500).json({ error: "Failed to get presentations" });
    }
  });

  app.get("/api/presentations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid presentation ID" });
      }

      const presentation = await storage.getPresentation(id);
      if (!presentation) {
        return res.status(404).json({ error: "Presentation not found" });
      }
      res.json(presentation);
    } catch (error) {
      console.error("Error getting presentation:", error);
      res.status(500).json({ error: "Failed to get presentation" });
    }
  });

  app.post("/api/presentations", async (req, res) => {
    try {
      const validation = insertPresentationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid presentation data", details: validation.error.errors });
      }

      const presentation = await storage.createPresentation(validation.data);
      res.status(201).json(presentation);
    } catch (error) {
      console.error("Error creating presentation:", error);
      res.status(500).json({ error: "Failed to create presentation" });
    }
  });

  app.put("/api/presentations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid presentation ID" });
      }

      const validation = insertPresentationSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid presentation data", details: validation.error.errors });
      }

      const presentation = await storage.updatePresentation(id, validation.data);
      if (!presentation) {
        return res.status(404).json({ error: "Presentation not found" });
      }
      res.json(presentation);
    } catch (error) {
      console.error("Error updating presentation:", error);
      res.status(500).json({ error: "Failed to update presentation" });
    }
  });

  app.delete("/api/presentations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid presentation ID" });
      }

      const success = await storage.deletePresentation(id);
      if (!success) {
        return res.status(404).json({ error: "Presentation not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting presentation:", error);
      res.status(500).json({ error: "Failed to delete presentation" });
    }
  });

  // Presentation Slides CRUD
  app.get("/api/presentations/:presentationId/slides", async (req, res) => {
    try {
      const presentationId = parseInt(req.params.presentationId);
      if (isNaN(presentationId)) {
        return res.status(400).json({ error: "Invalid presentation ID" });
      }

      const slides = await storage.getPresentationSlides(presentationId);
      res.json(slides);
    } catch (error) {
      console.error("Error getting presentation slides:", error);
      res.status(500).json({ error: "Failed to get presentation slides" });
    }
  });

  app.post("/api/presentation-slides", async (req, res) => {
    try {
      const validation = insertPresentationSlideSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid slide data", details: validation.error.errors });
      }

      const slide = await storage.createPresentationSlide(validation.data);
      res.status(201).json(slide);
    } catch (error) {
      console.error("Error creating presentation slide:", error);
      res.status(500).json({ error: "Failed to create presentation slide" });
    }
  });

  app.put("/api/presentation-slides/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid slide ID" });
      }

      const validation = insertPresentationSlideSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid slide data", details: validation.error.errors });
      }

      const slide = await storage.updatePresentationSlide(id, validation.data);
      if (!slide) {
        return res.status(404).json({ error: "Presentation slide not found" });
      }
      res.json(slide);
    } catch (error) {
      console.error("Error updating presentation slide:", error);
      res.status(500).json({ error: "Failed to update presentation slide" });
    }
  });

  app.delete("/api/presentation-slides/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid slide ID" });
      }

      const success = await storage.deletePresentationSlide(id);
      if (!success) {
        return res.status(404).json({ error: "Presentation slide not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting presentation slide:", error);
      res.status(500).json({ error: "Failed to delete presentation slide" });
    }
  });

  // Presentation Library
  app.get("/api/presentation-library", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const library = await storage.getPresentationLibrary(category);
      res.json(library);
    } catch (error) {
      console.error("Error getting presentation library:", error);
      res.status(500).json({ error: "Failed to get presentation library" });
    }
  });

  app.post("/api/presentation-library", async (req, res) => {
    try {
      const validation = insertPresentationLibrarySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid library entry data", details: validation.error.errors });
      }

      const entry = await storage.createPresentationLibraryEntry(validation.data);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating presentation library entry:", error);
      res.status(500).json({ error: "Failed to create presentation library entry" });
    }
  });

  // Presentation Tour Integrations
  app.get("/api/presentation-tour-integrations", async (req, res) => {
    try {
      const presentationId = req.query.presentationId ? parseInt(req.query.presentationId as string) : undefined;
      const integrations = await storage.getPresentationTourIntegrations(presentationId);
      res.json(integrations);
    } catch (error) {
      console.error("Error getting presentation tour integrations:", error);
      res.status(500).json({ error: "Failed to get presentation tour integrations" });
    }
  });

  app.post("/api/presentation-tour-integrations", async (req, res) => {
    try {
      const validation = insertPresentationTourIntegrationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid integration data", details: validation.error.errors });
      }

      const integration = await storage.createPresentationTourIntegration(validation.data);
      res.status(201).json(integration);
    } catch (error) {
      console.error("Error creating presentation tour integration:", error);
      res.status(500).json({ error: "Failed to create presentation tour integration" });
    }
  });

  // Presentation Analytics
  app.get("/api/presentation-analytics", async (req, res) => {
    try {
      const presentationId = req.query.presentationId ? parseInt(req.query.presentationId as string) : undefined;
      const analytics = await storage.getPresentationAnalytics(presentationId);
      res.json(analytics);
    } catch (error) {
      console.error("Error getting presentation analytics:", error);
      res.status(500).json({ error: "Failed to get presentation analytics" });
    }
  });

  app.post("/api/presentation-analytics", async (req, res) => {
    try {
      const validation = insertPresentationAnalyticsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid analytics data", details: validation.error.errors });
      }

      const analytics = await storage.createPresentationAnalyticsEntry(validation.data);
      res.status(201).json(analytics);
    } catch (error) {
      console.error("Error creating presentation analytics entry:", error);
      res.status(500).json({ error: "Failed to create presentation analytics entry" });
    }
  });

  // Presentation AI Content
  app.get("/api/presentation-ai-content", async (req, res) => {
    try {
      const presentationId = req.query.presentationId ? parseInt(req.query.presentationId as string) : undefined;
      const content = await storage.getPresentationAIContent(presentationId);
      res.json(content);
    } catch (error) {
      console.error("Error getting presentation AI content:", error);
      res.status(500).json({ error: "Failed to get presentation AI content" });
    }
  });

  app.post("/api/presentation-ai-content", async (req, res) => {
    try {
      const validation = insertPresentationAIContentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid AI content data", details: validation.error.errors });
      }

      const content = await storage.createPresentationAIContent(validation.data);
      res.status(201).json(content);
    } catch (error) {
      console.error("Error creating presentation AI content:", error);
      res.status(500).json({ error: "Failed to create presentation AI content" });
    }
  });

  // AI Presentation Generation endpoint
  app.post("/api/presentations/generate-with-ai", requireAuth, async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Generate presentation content with AI
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant specialized in creating manufacturing presentations. 
            Generate a structured presentation based on the user's requirements. 
            Respond with a JSON object containing:
            - title: A compelling presentation title
            - description: A brief description of the presentation
            - category: One of: Sales, Training, Executive, Technical, Marketing, Operations
            - audience: Target audience description
            - estimatedDuration: Duration in minutes (number)
            - tags: Array of relevant tags
            - targetRoles: Array of job roles this presentation targets
            - slides: Array of slide objects with title and content
            
            Make the content specific to manufacturing and production optimization.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const aiContent = JSON.parse(response.choices[0].message.content);

      // Create the presentation in the database
      const presentationData = {
        title: aiContent.title,
        description: aiContent.description,
        category: aiContent.category,
        audience: aiContent.audience,
        createdBy: typeof req.user.id === 'string' ? parseInt(req.user.id.split('_')[1]) || 1 : req.user.id,
        estimatedDuration: aiContent.estimatedDuration || 30,
        tags: aiContent.tags || [],
        targetRoles: aiContent.targetRoles || [],
        isTemplate: false,
        isPublic: false,
        customization: {
          aiGenerated: true,
          originalPrompt: prompt,
          slides: aiContent.slides || []
        }
      };

      const validation = insertPresentationSchema.safeParse(presentationData);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid presentation data generated", details: validation.error.errors });
      }

      const presentation = await storage.createPresentation(validation.data);
      
      res.status(201).json({
        success: true,
        presentation,
        message: "AI presentation generated successfully"
      });

    } catch (error) {
      console.error("Error generating AI presentation:", error);
      res.status(500).json({ error: "Failed to generate presentation with AI" });
    }
  });

  // Presentation Studio API Routes
  // Materials Management
  app.get("/api/presentation-materials", async (req, res) => {
    try {
      const presentationId = req.query.presentationId ? parseInt(req.query.presentationId as string) : undefined;
      const materials = await storage.getPresentationMaterials(presentationId);
      res.json(materials);
    } catch (error) {
      console.error("Error getting presentation materials:", error);
      res.status(500).json({ error: "Failed to get presentation materials" });
    }
  });

  app.get("/api/presentation-materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid material ID" });
      }

      const material = await storage.getPresentationMaterial(id);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json(material);
    } catch (error) {
      console.error("Error getting presentation material:", error);
      res.status(500).json({ error: "Failed to get presentation material" });
    }
  });

  app.post("/api/presentation-materials", async (req, res) => {
    try {
      const validation = insertPresentationMaterialSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid material data", details: validation.error.errors });
      }

      const material = await storage.createPresentationMaterial(validation.data);
      res.status(201).json(material);
    } catch (error) {
      console.error("Error creating presentation material:", error);
      res.status(500).json({ error: "Failed to create presentation material" });
    }
  });

  app.put("/api/presentation-materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid material ID" });
      }

      const validation = insertPresentationMaterialSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid material data", details: validation.error.errors });
      }

      const material = await storage.updatePresentationMaterial(id, validation.data);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json(material);
    } catch (error) {
      console.error("Error updating presentation material:", error);
      res.status(500).json({ error: "Failed to update presentation material" });
    }
  });

  app.delete("/api/presentation-materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid material ID" });
      }

      const success = await storage.deletePresentationMaterial(id);
      if (!success) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting presentation material:", error);
      res.status(500).json({ error: "Failed to delete presentation material" });
    }
  });

  // Content Suggestions
  app.get("/api/presentation-suggestions", async (req, res) => {
    try {
      const presentationId = req.query.presentationId ? parseInt(req.query.presentationId as string) : undefined;
      const suggestions = await storage.getPresentationContentSuggestions(presentationId);
      res.json(suggestions);
    } catch (error) {
      console.error("Error getting presentation suggestions:", error);
      res.status(500).json({ error: "Failed to get presentation suggestions" });
    }
  });

  app.post("/api/presentation-suggestions", async (req, res) => {
    try {
      const validation = insertPresentationContentSuggestionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid suggestion data", details: validation.error.errors });
      }

      const suggestion = await storage.createPresentationContentSuggestion(validation.data);
      res.status(201).json(suggestion);
    } catch (error) {
      console.error("Error creating presentation suggestion:", error);
      res.status(500).json({ error: "Failed to create presentation suggestion" });
    }
  });

  app.put("/api/presentation-suggestions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid suggestion ID" });
      }

      const validation = insertPresentationContentSuggestionSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid suggestion data", details: validation.error.errors });
      }

      const suggestion = await storage.updatePresentationContentSuggestion(id, validation.data);
      if (!suggestion) {
        return res.status(404).json({ error: "Suggestion not found" });
      }
      res.json(suggestion);
    } catch (error) {
      console.error("Error updating presentation suggestion:", error);
      res.status(500).json({ error: "Failed to update presentation suggestion" });
    }
  });

  app.delete("/api/presentation-suggestions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid suggestion ID" });
      }

      const success = await storage.deletePresentationContentSuggestion(id);
      if (!success) {
        return res.status(404).json({ error: "Suggestion not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting presentation suggestion:", error);
      res.status(500).json({ error: "Failed to delete presentation suggestion" });
    }
  });

  // Presentation Projects
  app.get("/api/presentation-projects", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const projects = await storage.getPresentationProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error getting presentation projects:", error);
      res.status(500).json({ error: "Failed to get presentation projects" });
    }
  });

  app.get("/api/presentation-projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const project = await storage.getPresentationProject(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error getting presentation project:", error);
      res.status(500).json({ error: "Failed to get presentation project" });
    }
  });

  // Presentation Projects CRUD
  app.get("/api/presentation-projects", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const projects = await storage.getPresentationProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error getting presentation projects:", error);
      res.status(500).json({ error: "Failed to get presentation projects" });
    }
  });

  app.post("/api/presentation-projects", async (req, res) => {
    try {
      const validation = insertPresentationProjectSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid project data", details: validation.error.errors });
      }

      const project = await storage.createPresentationProject(validation.data);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating presentation project:", error);
      res.status(500).json({ error: "Failed to create presentation project" });
    }
  });

  app.put("/api/presentation-projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const validation = insertPresentationProjectSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid project data", details: validation.error.errors });
      }

      const project = await storage.updatePresentationProject(id, validation.data);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error updating presentation project:", error);
      res.status(500).json({ error: "Failed to update presentation project" });
    }
  });

  app.delete("/api/presentation-projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const success = await storage.deletePresentationProject(id);
      if (!success) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting presentation project:", error);
      res.status(500).json({ error: "Failed to delete presentation project" });
    }
  });

  // Web content extraction endpoint
  app.post("/api/presentation-studio/extract-web-content", requireAuth, async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      // Fetch content from the URL
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PresentationStudio/1.0)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Extract metadata and content
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;
      
      const descMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i);
      const description = descMatch ? descMatch[1] : "";
      
      // Extract headings for key points
      const headingMatches = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi);
      const keyPoints = headingMatches ? headingMatches.slice(0, 10).map(h => h.replace(/<[^>]*>/g, '').trim()) : [];
      
      // Clean text content
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000);

      const content = {
        title,
        description,
        url,
        extractedText: textContent,
        keyPoints,
        domain: new URL(url).hostname,
        extractedAt: new Date().toISOString()
      };

      // Create material entry
      const materialData = {
        title: `Web Content: ${title}`,
        type: "web_content",
        content: content,
        fileUrl: url,
        metadata: {
          sourceUrl: url,
          extractedAt: new Date().toISOString(),
          contentType: "web_page",
          domain: new URL(url).hostname
        },
        tags: ["web-content", "extracted", new URL(url).hostname],
        uploadedBy: req.user.username || "system"
      };

      const material = await storage.createPresentationMaterial(materialData);
      
      res.json({
        success: true,
        title,
        insights: keyPoints.length + (description ? 1 : 0),
        material,
        keyPoints
      });
    } catch (error) {
      console.error("Error extracting web content:", error);
      res.status(500).json({ error: "Failed to extract web content. Please check the URL and try again." });
    }
  });

  // AI-powered Material Analysis and Suggestions
  app.post("/api/presentation-studio/ai/analyze-material", requireAuth, async (req, res) => {
    try {
      const { materialContent, presentationType, targetAudience } = req.body;
      
      if (!materialContent || !presentationType) {
        return res.status(400).json({ error: "Material content and presentation type are required" });
      }

      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const analysisPrompt = `You are an AI assistant specialized in analyzing presentation materials and providing suggestions for optimal usage.

      Material Content: ${JSON.stringify(materialContent)}
      Presentation Type: ${presentationType}
      Target Audience: ${targetAudience || 'General'}

      Analyze this material and provide structured feedback in JSON format:
      {
        "relevanceScore": 1-10,
        "qualityScore": 1-10,
        "bestSlideTypes": ["title", "content", "data", "testimonial", "case-study"],
        "suggestedUsage": "How to best use this material in the presentation",
        "contentGaps": ["List of additional content that would complement this material"],
        "improvementSuggestions": ["Ways to enhance this material"],
        "keyStrengths": ["What makes this material valuable"],
        "targetSlidePosition": "beginning|middle|end|multiple"
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert presentation consultant specializing in manufacturing and business presentations." },
          { role: "user", content: analysisPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      res.json(analysis);

    } catch (error) {
      console.error('Error analyzing material:', error);
      res.status(500).json({ error: 'Failed to analyze material' });
    }
  });

  app.post("/api/presentation-studio/ai/suggest-materials", requireAuth, async (req, res) => {
    try {
      const { presentationType, targetAudience, existingMaterials, objectives } = req.body;
      
      if (!presentationType) {
        return res.status(400).json({ error: "Presentation type is required" });
      }

      // Import OpenAI dynamically
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const suggestionPrompt = `You are an AI assistant specialized in creating ENGAGING, VISUAL, WEBSITE-LIKE presentations that EXCITE users and drive software adoption. AVOID boring PowerPoint-style slides.

      Presentation Type: ${presentationType}
      Target Audience: ${targetAudience || 'General'}
      Objectives: ${objectives ? JSON.stringify(objectives) : 'Not specified'}
      Existing Materials: ${existingMaterials ? JSON.stringify(existingMaterials) : 'None'}

      Create materials for a modern, exciting presentation that looks like an engaging website, not traditional slides. Focus on visual storytelling, minimal text, and user excitement. Respond in JSON format:
      {
        "criticalMaterials": [
          {
            "type": "hero_visual|customer_success_story|interactive_demo|visual_comparison|transformation_story|roi_calculator",
            "title": "Engaging material title",
            "description": "Why this visual/interactive material creates excitement",
            "priority": "high|medium|low",
            "visualRequirements": "Specific visual elements needed (images, icons, animations)",
            "engagementFactor": "How this material excites and persuades users"
          }
        ],
        "visualDesignStyle": "Modern, clean, website-like with bold visuals and minimal text",
        "excitementElements": ["Interactive elements that create user engagement"],
        "persuasionStrategy": "How to structure content for maximum software adoption impact"
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert in creating EXCITING, VISUAL presentations that look like modern websites. You specialize in driving software adoption through engaging, non-boring presentation design that uses bold visuals, minimal text, and interactive elements." },
          { role: "user", content: suggestionPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 1500
      });

      const suggestions = JSON.parse(response.choices[0].message.content);
      res.json(suggestions);

    } catch (error) {
      console.error('Error generating material suggestions:', error);
      res.status(500).json({ error: 'Failed to generate material suggestions' });
    }
  });

  // AI-Powered Modern Presentation Generation
  app.post("/api/presentation-studio/generate-modern-presentation", requireAuth, async (req, res) => {
    try {
      const { projectId, presentationType, targetAudience, objectives, keyMessage, brandGuidelines, materials, customPrompt } = req.body;
      
      if (!projectId || !presentationType) {
        return res.status(400).json({ error: "Project ID and presentation type are required" });
      }

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Use custom prompt if provided, otherwise use default
      const modernPresentationPrompt = customPrompt || `You are an expert in creating EXCITING, VISUAL, WEBSITE-LIKE presentations that drive software adoption. Create a modern presentation that looks like an engaging website, NOT traditional PowerPoint slides.

      CRITICAL REQUIREMENTS:
      - Create presentations that EXCITE users and make them want to use the software
      - Use BOLD VISUALS, diverse imagery, and minimal text
      - Design like a modern website with interactive elements
      - Focus on user engagement and persuasion for software adoption
      - Avoid boring, text-heavy, traditional slide formats

      Project Details:
      Presentation Type: ${presentationType}
      Target Audience: ${targetAudience || 'Manufacturing professionals'}
      Objectives: ${objectives || 'Drive software adoption'}
      Key Message: ${keyMessage || 'Transform your manufacturing operations'}
      Brand Guidelines: ${brandGuidelines || 'Professional, modern, technology-focused'}
      Available Materials: ${materials ? JSON.stringify(materials) : 'Standard manufacturing content'}

      Generate a complete modern presentation structure in JSON format:
      {
        "title": "Engaging presentation title",
        "subtitle": "Compelling subtitle that creates excitement",
        "designTheme": {
          "primaryColor": "#color-hex",
          "accentColor": "#color-hex", 
          "style": "modern-website|sleek-tech|bold-industrial",
          "typography": "clean-sans|modern-display",
          "layout": "website-style|card-based|full-screen-visuals"
        },
        "slides": [
          {
            "id": 1,
            "type": "hero_splash|problem_story|solution_showcase|transformation_demo|social_proof|call_to_action",
            "title": "Bold, engaging slide title",
            "layout": "full_screen_visual|split_visual_text|card_grid|interactive_demo",
            "content": {
              "mainText": "Minimal, powerful text that excites",
              "visualElements": [
                {
                  "type": "hero_image|icon_grid|before_after|customer_photo|product_screenshot",
                  "description": "Specific visual element needed",
                  "placement": "background|foreground|overlay",
                  "size": "full_screen|large|medium"
                }
              ],
              "interactiveElements": ["hover_effects|click_reveals|animated_counters|progress_bars"],
              "callouts": ["Key benefit or statistic that creates excitement"],
              "emotionalTriggers": ["Specific elements that make users excited about the software"]
            },
            "engagementFactors": ["What makes this slide exciting and persuasive"],
            "userJourney": "How this slide moves users toward software adoption"
          }
        ],
        "visualAssets": [
          {
            "type": "hero_images|customer_photos|product_screenshots|infographic_elements|icon_sets",
            "description": "Specific visual asset needed",
            "purpose": "How this asset creates excitement and drives adoption",
            "placement": "Which slides use this asset"
          }
        ],
        "engagementStrategy": {
          "openingHook": "How to immediately grab attention",
          "excitementBuilders": ["Elements that create user excitement throughout"],
          "persuasionFlow": "How slides build toward software adoption decision",
          "closingAction": "Strong call-to-action that drives software trial/purchase"
        }
      }

      Create ${Math.max(5, Math.min(12, Math.floor(Math.random() * 8) + 5))} slides that tell a compelling story and drive software adoption.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are a world-class presentation designer who creates EXCITING, VISUAL presentations that look like modern websites. You specialize in driving software adoption through engaging design that uses bold visuals, minimal text, and interactive elements. You NEVER create boring PowerPoint-style presentations." 
          },
          { role: "user", content: modernPresentationPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 4000
      });

      const presentationData = JSON.parse(response.choices[0].message.content);
      
      // Store the generated presentation in the database
      const presentation = await storage.createPresentation({
        title: presentationData.title,
        description: presentationData.subtitle,
        content: JSON.stringify(presentationData),
        authorId: req.user.id,
        status: "draft",
        tags: [presentationType, "ai-generated", "modern-design"],
        metadata: {
          designTheme: presentationData.designTheme,
          engagementStrategy: presentationData.engagementStrategy,
          generatedAt: new Date().toISOString(),
          projectId: projectId
        }
      });

      res.json({
        presentation,
        designData: presentationData,
        message: "Modern, engaging presentation generated successfully"
      });

    } catch (error) {
      console.error('Error generating modern presentation:', error);
      res.status(500).json({ error: 'Failed to generate modern presentation' });
    }
  });

  // Marketing System API Routes

  // Customer Journey Stages
  app.get("/api/marketing/customer-journey-stages", async (req, res) => {
    try {
      const stages = await storage.getCustomerJourneyStages();
      res.json(stages);
    } catch (error) {
      console.error("Error fetching customer journey stages:", error);
      res.status(500).json({ error: "Failed to fetch customer journey stages" });
    }
  });

  app.get("/api/marketing/customer-journey-stages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid stage ID" });
      }

      const stage = await storage.getCustomerJourneyStage(id);
      if (!stage) {
        return res.status(404).json({ error: "Customer journey stage not found" });
      }
      res.json(stage);
    } catch (error) {
      console.error("Error fetching customer journey stage:", error);
      res.status(500).json({ error: "Failed to fetch customer journey stage" });
    }
  });

  app.post("/api/marketing/customer-journey-stages", async (req, res) => {
    try {
      const validation = insertCustomerJourneyStageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid stage data", details: validation.error.errors });
      }

      const stage = await storage.createCustomerJourneyStage(validation.data);
      res.status(201).json(stage);
    } catch (error) {
      console.error("Error creating customer journey stage:", error);
      res.status(500).json({ error: "Failed to create customer journey stage" });
    }
  });

  app.put("/api/marketing/customer-journey-stages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid stage ID" });
      }

      const validation = insertCustomerJourneyStageSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid stage data", details: validation.error.errors });
      }

      const stage = await storage.updateCustomerJourneyStage(id, validation.data);
      if (!stage) {
        return res.status(404).json({ error: "Customer journey stage not found" });
      }
      res.json(stage);
    } catch (error) {
      console.error("Error updating customer journey stage:", error);
      res.status(500).json({ error: "Failed to update customer journey stage" });
    }
  });

  // Manufacturing Segments
  app.get("/api/marketing/manufacturing-segments", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const segments = type ? 
        await storage.getManufacturingSegmentsByType(type) : 
        await storage.getManufacturingSegments();
      res.json(segments);
    } catch (error) {
      console.error("Error fetching manufacturing segments:", error);
      res.status(500).json({ error: "Failed to fetch manufacturing segments" });
    }
  });

  app.post("/api/marketing/manufacturing-segments", async (req, res) => {
    try {
      const validation = insertManufacturingSegmentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid segment data", details: validation.error.errors });
      }

      const segment = await storage.createManufacturingSegment(validation.data);
      res.status(201).json(segment);
    } catch (error) {
      console.error("Error creating manufacturing segment:", error);
      res.status(500).json({ error: "Failed to create manufacturing segment" });
    }
  });

  app.put("/api/marketing/manufacturing-segments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid segment ID" });
      }

      const validation = insertManufacturingSegmentSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid segment data", details: validation.error.errors });
      }

      const segment = await storage.updateManufacturingSegment(id, validation.data);
      if (!segment) {
        return res.status(404).json({ error: "Manufacturing segment not found" });
      }
      res.json(segment);
    } catch (error) {
      console.error("Error updating manufacturing segment:", error);
      res.status(500).json({ error: "Failed to update manufacturing segment" });
    }
  });

  // Buyer Personas
  app.get("/api/marketing/buyer-personas", async (req, res) => {
    try {
      const roleType = req.query.roleType as string | undefined;
      const personas = roleType ? 
        await storage.getBuyerPersonasByRole(roleType) : 
        await storage.getBuyerPersonas();
      res.json(personas);
    } catch (error) {
      console.error("Error fetching buyer personas:", error);
      res.status(500).json({ error: "Failed to fetch buyer personas" });
    }
  });

  app.post("/api/marketing/buyer-personas", async (req, res) => {
    try {
      const validation = insertBuyerPersonaSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid persona data", details: validation.error.errors });
      }

      const persona = await storage.createBuyerPersona(validation.data);
      res.status(201).json(persona);
    } catch (error) {
      console.error("Error creating buyer persona:", error);
      res.status(500).json({ error: "Failed to create buyer persona" });
    }
  });

  app.put("/api/marketing/buyer-personas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid persona ID" });
      }

      const validation = insertBuyerPersonaSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid persona data", details: validation.error.errors });
      }

      const persona = await storage.updateBuyerPersona(id, validation.data);
      if (!persona) {
        return res.status(404).json({ error: "Buyer persona not found" });
      }
      res.json(persona);
    } catch (error) {
      console.error("Error updating buyer persona:", error);
      res.status(500).json({ error: "Failed to update buyer persona" });
    }
  });

  // Marketing Pages
  app.get("/api/marketing/pages", async (req, res) => {
    try {
      const stageId = req.query.stageId ? parseInt(req.query.stageId as string) : undefined;
      const language = req.query.language as string | undefined;
      const pages = await storage.getMarketingPages(stageId, language);
      res.json(pages);
    } catch (error) {
      console.error("Error fetching marketing pages:", error);
      res.status(500).json({ error: "Failed to fetch marketing pages" });
    }
  });

  app.get("/api/marketing/pages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid page ID" });
      }

      const page = await storage.getMarketingPage(id);
      if (!page) {
        return res.status(404).json({ error: "Marketing page not found" });
      }
      res.json(page);
    } catch (error) {
      console.error("Error fetching marketing page:", error);
      res.status(500).json({ error: "Failed to fetch marketing page" });
    }
  });

  app.get("/api/marketing/pages/slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const language = req.query.language as string | undefined;
      
      const page = await storage.getMarketingPageBySlug(slug, language);
      if (!page) {
        return res.status(404).json({ error: "Marketing page not found" });
      }
      res.json(page);
    } catch (error) {
      console.error("Error fetching marketing page by slug:", error);
      res.status(500).json({ error: "Failed to fetch marketing page" });
    }
  });

  app.post("/api/marketing/pages", async (req, res) => {
    try {
      const validation = insertMarketingPageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid page data", details: validation.error.errors });
      }

      const page = await storage.createMarketingPage(validation.data);
      res.status(201).json(page);
    } catch (error) {
      console.error("Error creating marketing page:", error);
      res.status(500).json({ error: "Failed to create marketing page" });
    }
  });

  app.put("/api/marketing/pages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid page ID" });
      }

      const validation = insertMarketingPageSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid page data", details: validation.error.errors });
      }

      const page = await storage.updateMarketingPage(id, validation.data);
      if (!page) {
        return res.status(404).json({ error: "Marketing page not found" });
      }
      res.json(page);
    } catch (error) {
      console.error("Error updating marketing page:", error);
      res.status(500).json({ error: "Failed to update marketing page" });
    }
  });

  app.delete("/api/marketing/pages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid page ID" });
      }

      const success = await storage.deleteMarketingPage(id);
      if (!success) {
        return res.status(404).json({ error: "Marketing page not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting marketing page:", error);
      res.status(500).json({ error: "Failed to delete marketing page" });
    }
  });

  // Content Blocks
  app.get("/api/marketing/content-blocks", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const language = req.query.language as string | undefined;
      const blocks = await storage.getContentBlocks(category, language);
      res.json(blocks);
    } catch (error) {
      console.error("Error fetching content blocks:", error);
      res.status(500).json({ error: "Failed to fetch content blocks" });
    }
  });

  app.get("/api/marketing/content-blocks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid block ID" });
      }

      const block = await storage.getContentBlock(id);
      if (!block) {
        return res.status(404).json({ error: "Content block not found" });
      }
      res.json(block);
    } catch (error) {
      console.error("Error fetching content block:", error);
      res.status(500).json({ error: "Failed to fetch content block" });
    }
  });

  app.post("/api/marketing/content-blocks", async (req, res) => {
    try {
      const validation = insertContentBlockSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid block data", details: validation.error.errors });
      }

      const block = await storage.createContentBlock(validation.data);
      res.status(201).json(block);
    } catch (error) {
      console.error("Error creating content block:", error);
      res.status(500).json({ error: "Failed to create content block" });
    }
  });

  app.put("/api/marketing/content-blocks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid block ID" });
      }

      const validation = insertContentBlockSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid block data", details: validation.error.errors });
      }

      const block = await storage.updateContentBlock(id, validation.data);
      if (!block) {
        return res.status(404).json({ error: "Content block not found" });
      }
      res.json(block);
    } catch (error) {
      console.error("Error updating content block:", error);
      res.status(500).json({ error: "Failed to update content block" });
    }
  });

  app.post("/api/marketing/content-blocks/:id/increment-usage", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid block ID" });
      }

      await storage.incrementContentBlockUsage(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error incrementing content block usage:", error);
      res.status(500).json({ error: "Failed to increment content block usage" });
    }
  });

  // Customer Stories
  app.get("/api/marketing/customer-stories", async (req, res) => {
    try {
      const industry = req.query.industry as string | undefined;
      const language = req.query.language as string | undefined;
      const stories = await storage.getCustomerStories(industry, language);
      res.json(stories);
    } catch (error) {
      console.error("Error fetching customer stories:", error);
      res.status(500).json({ error: "Failed to fetch customer stories" });
    }
  });

  app.get("/api/marketing/customer-stories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid story ID" });
      }

      const story = await storage.getCustomerStory(id);
      if (!story) {
        return res.status(404).json({ error: "Customer story not found" });
      }
      res.json(story);
    } catch (error) {
      console.error("Error fetching customer story:", error);
      res.status(500).json({ error: "Failed to fetch customer story" });
    }
  });

  app.post("/api/marketing/customer-stories", async (req, res) => {
    try {
      const validation = insertCustomerStorySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid story data", details: validation.error.errors });
      }

      const story = await storage.createCustomerStory(validation.data);
      res.status(201).json(story);
    } catch (error) {
      console.error("Error creating customer story:", error);
      res.status(500).json({ error: "Failed to create customer story" });
    }
  });

  app.put("/api/marketing/customer-stories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid story ID" });
      }

      const validation = insertCustomerStorySchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid story data", details: validation.error.errors });
      }

      const story = await storage.updateCustomerStory(id, validation.data);
      if (!story) {
        return res.status(404).json({ error: "Customer story not found" });
      }
      res.json(story);
    } catch (error) {
      console.error("Error updating customer story:", error);
      res.status(500).json({ error: "Failed to update customer story" });
    }
  });

  // Lead Captures
  app.get("/api/marketing/leads", async (req, res) => {
    try {
      const pageId = req.query.pageId ? parseInt(req.query.pageId as string) : undefined;
      const stage = req.query.stage as string | undefined;
      const leads = await storage.getLeadCaptures(pageId, stage);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/marketing/leads/email/:email", async (req, res) => {
    try {
      const email = req.params.email;
      const leads = await storage.getLeadsByEmail(email);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads by email:", error);
      res.status(500).json({ error: "Failed to fetch leads by email" });
    }
  });

  app.post("/api/marketing/leads", async (req, res) => {
    try {
      const validation = insertLeadCaptureSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid lead data", details: validation.error.errors });
      }

      const lead = await storage.createLeadCapture(validation.data);
      res.status(201).json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  app.put("/api/marketing/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid lead ID" });
      }

      const validation = insertLeadCaptureSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid lead data", details: validation.error.errors });
      }

      const lead = await storage.updateLeadCapture(id, validation.data);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  // Page Analytics
  app.get("/api/marketing/analytics/:pageId", async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      if (isNaN(pageId)) {
        return res.status(400).json({ error: "Invalid page ID" });
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const analytics = await storage.getPageAnalytics(pageId, startDate, endDate);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching page analytics:", error);
      res.status(500).json({ error: "Failed to fetch page analytics" });
    }
  });

  app.post("/api/marketing/analytics", async (req, res) => {
    try {
      const validation = insertPageAnalyticsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid analytics data", details: validation.error.errors });
      }

      const analytics = await storage.createPageAnalytics(validation.data);
      res.status(201).json(analytics);
    } catch (error) {
      console.error("Error creating page analytics:", error);
      res.status(500).json({ error: "Failed to create page analytics" });
    }
  });

  app.put("/api/marketing/analytics/:pageId/:date", async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      const date = new Date(req.params.date);
      
      if (isNaN(pageId) || isNaN(date.getTime())) {
        return res.status(400).json({ error: "Invalid page ID or date" });
      }

      const validation = insertPageAnalyticsSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid analytics data", details: validation.error.errors });
      }

      const analytics = await storage.updatePageAnalytics(pageId, date, validation.data);
      if (!analytics) {
        return res.status(404).json({ error: "Page analytics not found" });
      }
      res.json(analytics);
    } catch (error) {
      console.error("Error updating page analytics:", error);
      res.status(500).json({ error: "Failed to update page analytics" });
    }
  });

  // A/B Tests
  app.get("/api/marketing/ab-tests", async (req, res) => {
    try {
      const pageId = req.query.pageId ? parseInt(req.query.pageId as string) : undefined;
      const tests = await storage.getABTests(pageId);
      res.json(tests);
    } catch (error) {
      console.error("Error fetching A/B tests:", error);
      res.status(500).json({ error: "Failed to fetch A/B tests" });
    }
  });

  app.get("/api/marketing/ab-tests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid test ID" });
      }

      const test = await storage.getABTest(id);
      if (!test) {
        return res.status(404).json({ error: "A/B test not found" });
      }
      res.json(test);
    } catch (error) {
      console.error("Error fetching A/B test:", error);
      res.status(500).json({ error: "Failed to fetch A/B test" });
    }
  });

  app.post("/api/marketing/ab-tests", async (req, res) => {
    try {
      const validation = insertABTestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid test data", details: validation.error.errors });
      }

      const test = await storage.createABTest(validation.data);
      res.status(201).json(test);
    } catch (error) {
      console.error("Error creating A/B test:", error);
      res.status(500).json({ error: "Failed to create A/B test" });
    }
  });

  app.put("/api/marketing/ab-tests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid test ID" });
      }

      const validation = insertABTestSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid test data", details: validation.error.errors });
      }

      const test = await storage.updateABTest(id, validation.data);
      if (!test) {
        return res.status(404).json({ error: "A/B test not found" });
      }
      res.json(test);
    } catch (error) {
      console.error("Error updating A/B test:", error);
      res.status(500).json({ error: "Failed to update A/B test" });
    }
  });

  // Email Campaigns
  app.get("/api/marketing/email-campaigns", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const language = req.query.language as string | undefined;
      const campaigns = await storage.getEmailCampaigns(status, language);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching email campaigns:", error);
      res.status(500).json({ error: "Failed to fetch email campaigns" });
    }
  });

  app.get("/api/marketing/email-campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      const campaign = await storage.getEmailCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: "Email campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching email campaign:", error);
      res.status(500).json({ error: "Failed to fetch email campaign" });
    }
  });

  app.post("/api/marketing/email-campaigns", async (req, res) => {
    try {
      const validation = insertEmailCampaignSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid campaign data", details: validation.error.errors });
      }

      const campaign = await storage.createEmailCampaign(validation.data);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating email campaign:", error);
      res.status(500).json({ error: "Failed to create email campaign" });
    }
  });

  app.put("/api/marketing/email-campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      const validation = insertEmailCampaignSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid campaign data", details: validation.error.errors });
      }

      const campaign = await storage.updateEmailCampaign(id, validation.data);
      if (!campaign) {
        return res.status(404).json({ error: "Email campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error updating email campaign:", error);
      res.status(500).json({ error: "Failed to update email campaign" });
    }
  });

  app.put("/api/marketing/email-campaigns/:id/stats", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }

      const { sentCount, openRate, clickRate, conversionRate, unsubscribeRate } = req.body;
      
      const campaign = await storage.updateEmailCampaignStats(id, {
        sentCount,
        openRate,
        clickRate,
        conversionRate,
        unsubscribeRate
      });
      
      if (!campaign) {
        return res.status(404).json({ error: "Email campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error updating email campaign stats:", error);
      res.status(500).json({ error: "Failed to update email campaign stats" });
    }
  });

  // Production Planning API Routes
  
  // Production Plans
  app.get("/api/production-plans", requireAuth, async (req, res) => {
    try {
      const plantId = req.query.plantId ? parseInt(req.query.plantId as string) : undefined;
      const plans = await storage.getProductionPlans(plantId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching production plans:", error);
      res.status(500).json({ error: "Failed to fetch production plans" });
    }
  });

  app.get("/api/production-plans/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await storage.getProductionPlan(id);
      if (!plan) {
        return res.status(404).json({ error: "Production plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching production plan:", error);
      res.status(500).json({ error: "Failed to fetch production plan" });
    }
  });

  app.post("/api/production-plans", requireAuth, async (req, res) => {
    try {
      const planData = insertProductionPlanSchema.parse(req.body);
      const plan = await storage.createProductionPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating production plan:", error);
      res.status(500).json({ error: "Failed to create production plan" });
    }
  });

  app.patch("/api/production-plans/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const plan = await storage.updateProductionPlan(id, updates);
      if (!plan) {
        return res.status(404).json({ error: "Production plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error updating production plan:", error);
      res.status(500).json({ error: "Failed to update production plan" });
    }
  });

  app.patch("/api/production-plans/:id/approve", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { approvedBy } = req.body;
      const plan = await storage.approveProductionPlan(id, approvedBy);
      if (!plan) {
        return res.status(404).json({ error: "Production plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error approving production plan:", error);
      res.status(500).json({ error: "Failed to approve production plan" });
    }
  });

  app.delete("/api/production-plans/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProductionPlan(id);
      if (!success) {
        return res.status(404).json({ error: "Production plan not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting production plan:", error);
      res.status(500).json({ error: "Failed to delete production plan" });
    }
  });

  // Production Targets
  app.get("/api/production-targets", requireAuth, async (req, res) => {
    try {
      const planId = req.query.planId ? parseInt(req.query.planId as string) : undefined;
      const targets = await storage.getProductionTargets(planId);
      res.json(targets);
    } catch (error) {
      console.error("Error fetching production targets:", error);
      res.status(500).json({ error: "Failed to fetch production targets" });
    }
  });

  app.post("/api/production-targets", requireAuth, async (req, res) => {
    try {
      const targetData = insertProductionTargetSchema.parse(req.body);
      const target = await storage.createProductionTarget(targetData);
      res.status(201).json(target);
    } catch (error) {
      console.error("Error creating production target:", error);
      res.status(500).json({ error: "Failed to create production target" });
    }
  });

  app.patch("/api/production-targets/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const target = await storage.updateProductionTarget(id, updates);
      if (!target) {
        return res.status(404).json({ error: "Production target not found" });
      }
      res.json(target);
    } catch (error) {
      console.error("Error updating production target:", error);
      res.status(500).json({ error: "Failed to update production target" });
    }
  });

  // Resource Allocations
  app.get("/api/resource-allocations", requireAuth, async (req, res) => {
    try {
      const planId = req.query.planId ? parseInt(req.query.planId as string) : undefined;
      const allocations = await storage.getResourceAllocations(planId);
      res.json(allocations);
    } catch (error) {
      console.error("Error fetching resource allocations:", error);
      res.status(500).json({ error: "Failed to fetch resource allocations" });
    }
  });

  app.post("/api/resource-allocations", requireAuth, async (req, res) => {
    try {
      const allocationData = insertResourceAllocationSchema.parse(req.body);
      const allocation = await storage.createResourceAllocation(allocationData);
      res.status(201).json(allocation);
    } catch (error) {
      console.error("Error creating resource allocation:", error);
      res.status(500).json({ error: "Failed to create resource allocation" });
    }
  });

  app.patch("/api/resource-allocations/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const allocation = await storage.updateResourceAllocation(id, updates);
      if (!allocation) {
        return res.status(404).json({ error: "Resource allocation not found" });
      }
      res.json(allocation);
    } catch (error) {
      console.error("Error updating resource allocation:", error);
      res.status(500).json({ error: "Failed to update resource allocation" });
    }
  });

  // Production Milestones
  app.get("/api/production-milestones", requireAuth, async (req, res) => {
    try {
      const planId = req.query.planId ? parseInt(req.query.planId as string) : undefined;
      const milestones = await storage.getProductionMilestones(planId);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching production milestones:", error);
      res.status(500).json({ error: "Failed to fetch production milestones" });
    }
  });

  app.post("/api/production-milestones", requireAuth, async (req, res) => {
    try {
      const milestoneData = insertProductionMilestoneSchema.parse(req.body);
      const milestone = await storage.createProductionMilestone(milestoneData);
      res.status(201).json(milestone);
    } catch (error) {
      console.error("Error creating production milestone:", error);
      res.status(500).json({ error: "Failed to create production milestone" });
    }
  });

  app.patch("/api/production-milestones/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const milestone = await storage.updateProductionMilestone(id, updates);
      if (!milestone) {
        return res.status(404).json({ error: "Production milestone not found" });
      }
      res.json(milestone);
    } catch (error) {
      console.error("Error updating production milestone:", error);
      res.status(500).json({ error: "Failed to update production milestone" });
    }
  });

  app.patch("/api/production-milestones/:id/complete", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const milestone = await storage.markMilestoneComplete(id);
      if (!milestone) {
        return res.status(404).json({ error: "Production milestone not found" });
      }
      res.json(milestone);
    } catch (error) {
      console.error("Error completing production milestone:", error);
      res.status(500).json({ error: "Failed to complete production milestone" });
    }
  });

  // Optimization Scope Configuration API Routes
  
  // Get optimization scope configurations
  app.get("/api/optimization-scope-configs", async (req, res) => {
    try {
      const { category, userId } = req.query;
      const configs = await storage.getOptimizationScopeConfigs(
        category as string,
        userId ? parseInt(userId as string) : undefined
      );
      res.json(configs);
    } catch (error) {
      console.error("Error fetching optimization scope configurations:", error);
      res.status(500).json({ error: "Failed to fetch optimization scope configurations" });
    }
  });

  // Get single optimization scope configuration
  app.get("/api/optimization-scope-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const config = await storage.getOptimizationScopeConfig(id);
      if (!config) {
        return res.status(404).json({ error: "Optimization scope configuration not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error fetching optimization scope configuration:", error);
      res.status(500).json({ error: "Failed to fetch optimization scope configuration" });
    }
  });

  // Create optimization scope configuration
  app.post("/api/optimization-scope-configs", async (req, res) => {
    try {
      const validatedData = insertOptimizationScopeConfigSchema.parse(req.body);
      const config = await storage.createOptimizationScopeConfig(validatedData);
      res.status(201).json(config);
    } catch (error) {
      console.error("Error creating optimization scope configuration:", error);
      res.status(500).json({ error: "Failed to create optimization scope configuration" });
    }
  });

  // Update optimization scope configuration
  app.put("/api/optimization-scope-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const config = await storage.updateOptimizationScopeConfig(id, req.body);
      if (!config) {
        return res.status(404).json({ error: "Optimization scope configuration not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error updating optimization scope configuration:", error);
      res.status(500).json({ error: "Failed to update optimization scope configuration" });
    }
  });

  // Delete optimization scope configuration
  app.delete("/api/optimization-scope-configs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteOptimizationScopeConfig(id);
      if (!deleted) {
        return res.status(404).json({ error: "Optimization scope configuration not found" });
      }
      res.json({ message: "Optimization scope configuration deleted successfully" });
    } catch (error) {
      console.error("Error deleting optimization scope configuration:", error);
      res.status(500).json({ error: "Failed to delete optimization scope configuration" });
    }
  });

  // Get default optimization scope configuration for category
  app.get("/api/optimization-scope-configs/default/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const config = await storage.getDefaultOptimizationScopeConfig(category);
      if (!config) {
        return res.status(404).json({ error: "No default configuration found for category" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error fetching default optimization scope configuration:", error);
      res.status(500).json({ error: "Failed to fetch default optimization scope configuration" });
    }
  });

  // Set optimization scope configuration as default
  app.post("/api/optimization-scope-configs/:id/set-default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.setOptimizationScopeConfigAsDefault(id);
      res.json({ message: "Configuration set as default successfully" });
    } catch (error) {
      console.error("Error setting configuration as default:", error);
      res.status(500).json({ error: "Failed to set configuration as default" });
    }
  });

  // Duplicate optimization scope configuration
  app.post("/api/optimization-scope-configs/:id/duplicate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, userId } = req.body;
      
      if (!name || !userId) {
        return res.status(400).json({ error: "Name and userId are required" });
      }
      
      const duplicate = await storage.duplicateOptimizationScopeConfig(id, name, userId);
      res.status(201).json(duplicate);
    } catch (error) {
      console.error("Error duplicating optimization scope configuration:", error);
      res.status(500).json({ error: "Failed to duplicate optimization scope configuration" });
    }
  });

  // Optimization Run History API Routes
  
  // Get optimization runs
  app.get("/api/optimization-runs", async (req, res) => {
    try {
      const { userId, algorithmId } = req.query;
      const runs = await storage.getOptimizationRuns(
        userId ? parseInt(userId as string) : undefined,
        algorithmId ? parseInt(algorithmId as string) : undefined
      );
      res.json(runs);
    } catch (error) {
      console.error("Error fetching optimization runs:", error);
      res.status(500).json({ error: "Failed to fetch optimization runs" });
    }
  });

  // Get single optimization run
  app.get("/api/optimization-runs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const run = await storage.getOptimizationRun(id);
      if (!run) {
        return res.status(404).json({ error: "Optimization run not found" });
      }
      res.json(run);
    } catch (error) {
      console.error("Error fetching optimization run:", error);
      res.status(500).json({ error: "Failed to fetch optimization run" });
    }
  });

  // Create optimization run
  app.post("/api/optimization-runs", async (req, res) => {
    try {
      const validatedData = insertOptimizationRunSchema.parse(req.body);
      const run = await storage.createOptimizationRun(validatedData);
      res.status(201).json(run);
    } catch (error) {
      console.error("Error creating optimization run:", error);
      res.status(500).json({ error: "Failed to create optimization run" });
    }
  });

  // Update optimization run
  app.put("/api/optimization-runs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const run = await storage.updateOptimizationRun(id, req.body);
      if (!run) {
        return res.status(404).json({ error: "Optimization run not found" });
      }
      res.json(run);
    } catch (error) {
      console.error("Error updating optimization run:", error);
      res.status(500).json({ error: "Failed to update optimization run" });
    }
  });

  // Delete optimization run
  app.delete("/api/optimization-runs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteOptimizationRun(id);
      if (!deleted) {
        return res.status(404).json({ error: "Optimization run not found" });
      }
      res.json({ message: "Optimization run deleted successfully" });
    } catch (error) {
      console.error("Error deleting optimization run:", error);
      res.status(500).json({ error: "Failed to delete optimization run" });
    }
  });

  // Get optimization runs by status
  app.get("/api/optimization-runs/status/:status", async (req, res) => {
    try {
      const status = req.params.status;
      const runs = await storage.getOptimizationRunsByStatus(status);
      res.json(runs);
    } catch (error) {
      console.error("Error fetching optimization runs by status:", error);
      res.status(500).json({ error: "Failed to fetch optimization runs by status" });
    }
  });

  // Update optimization run status
  app.patch("/api/optimization-runs/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, error } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      
      const run = await storage.updateOptimizationRunStatus(id, status, error);
      if (!run) {
        return res.status(404).json({ error: "Optimization run not found" });
      }
      res.json(run);
    } catch (error) {
      console.error("Error updating optimization run status:", error);
      res.status(500).json({ error: "Failed to update optimization run status" });
    }
  });

  // Shift Management System API Endpoints
  
  // Shift Templates
  app.get("/api/shift-templates", async (req, res) => {
    try {
      const plantId = req.query.plantId ? parseInt(req.query.plantId as string) : undefined;
      const templates = await storage.getShiftTemplates(plantId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching shift templates:", error);
      res.status(500).json({ error: "Failed to fetch shift templates" });
    }
  });

  app.get("/api/shift-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }
      const template = await storage.getShiftTemplate(id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching shift template:", error);
      res.status(500).json({ error: "Failed to fetch shift template" });
    }
  });

  app.post("/api/shift-templates", requireAuth, async (req, res) => {
    try {
      const templateData = insertShiftTemplateSchema.parse(req.body);
      const template = await storage.createShiftTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating shift template:", error);
      res.status(500).json({ error: "Failed to create shift template" });
    }
  });

  app.put("/api/shift-templates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }
      const updates = insertShiftTemplateSchema.partial().parse(req.body);
      const template = await storage.updateShiftTemplate(id, updates);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error updating shift template:", error);
      res.status(500).json({ error: "Failed to update shift template" });
    }
  });

  app.delete("/api/shift-templates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }
      const success = await storage.deleteShiftTemplate(id);
      if (!success) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting shift template:", error);
      res.status(500).json({ error: "Failed to delete shift template" });
    }
  });

  // AI Shift Creation
  app.post("/api/shifts/ai-create", requireAuth, async (req, res) => {
    try {
      const { requirements } = req.body;
      
      if (!requirements || typeof requirements !== 'string') {
        return res.status(400).json({ error: "Requirements field is required" });
      }
      
      const aiResponse = await processShiftAIRequest(requirements);
      res.json(aiResponse);
    } catch (error) {
      console.error("Error processing AI shift request:", error);
      res.status(500).json({ error: "Failed to process AI shift request" });
    }
  });

  // Resource Shift Assignments
  app.get("/api/resource-shift-assignments", async (req, res) => {
    try {
      const resourceId = req.query.resourceId ? parseInt(req.query.resourceId as string) : undefined;
      const effectiveDate = req.query.effectiveDate ? new Date(req.query.effectiveDate as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      let assignments;
      if (startDate && endDate) {
        // Get assignments in date range
        assignments = await storage.getResourceShiftAssignments(resourceId, effectiveDate);
        // Filter by date range in application logic for simplicity
        assignments = assignments.filter(a => {
          const aDate = new Date(a.effectiveDate);
          return aDate >= startDate && aDate <= endDate;
        });
      } else {
        assignments = await storage.getResourceShiftAssignments(resourceId, effectiveDate);
      }
      
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching resource shift assignments:", error);
      res.status(500).json({ error: "Failed to fetch resource shift assignments" });
    }
  });

  app.post("/api/resource-shift-assignments", requireAuth, async (req, res) => {
    try {
      const assignmentData = insertResourceShiftAssignmentSchema.parse(req.body);
      const assignment = await storage.createResourceShiftAssignment(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating resource shift assignment:", error);
      res.status(500).json({ error: "Failed to create resource shift assignment" });
    }
  });

  app.put("/api/resource-shift-assignments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid assignment ID" });
      }
      const updates = insertResourceShiftAssignmentSchema.partial().parse(req.body);
      const assignment = await storage.updateResourceShiftAssignment(id, updates);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Error updating resource shift assignment:", error);
      res.status(500).json({ error: "Failed to update resource shift assignment" });
    }
  });

  // Holidays Management
  app.get("/api/holidays", async (req, res) => {
    try {
      const plantId = req.query.plantId ? parseInt(req.query.plantId as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      
      let holidays;
      if (year && month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        holidays = await storage.getHolidaysInDateRange(startDate, endDate, plantId);
      } else {
        holidays = await storage.getHolidays(plantId, year);
      }
      
      res.json(holidays);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      res.status(500).json({ error: "Failed to fetch holidays" });
    }
  });

  app.post("/api/holidays", requireAuth, async (req, res) => {
    try {
      const holidayData = insertHolidaySchema.parse(req.body);
      const holiday = await storage.createHoliday(holidayData);
      res.status(201).json(holiday);
    } catch (error) {
      console.error("Error creating holiday:", error);
      res.status(500).json({ error: "Failed to create holiday" });
    }
  });

  app.put("/api/holidays/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid holiday ID" });
      }
      const updates = insertHolidaySchema.partial().parse(req.body);
      const holiday = await storage.updateHoliday(id, updates);
      if (!holiday) {
        return res.status(404).json({ error: "Holiday not found" });
      }
      res.json(holiday);
    } catch (error) {
      console.error("Error updating holiday:", error);
      res.status(500).json({ error: "Failed to update holiday" });
    }
  });

  app.delete("/api/holidays/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid holiday ID" });
      }
      const success = await storage.deleteHoliday(id);
      if (!success) {
        return res.status(404).json({ error: "Holiday not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting holiday:", error);
      res.status(500).json({ error: "Failed to delete holiday" });
    }
  });

  // AI Shift Generation and Adjustment
  app.post("/api/shifts/ai-create", requireAuth, async (req, res) => {
    try {
      const { requirements, plantId, resources, existingShifts } = req.body;
      
      const aiResponse = await processShiftAIRequest({
        type: 'create',
        requirements,
        plantId,
        resources: resources || [],
        existingShifts: existingShifts || []
      });
      
      res.json(aiResponse);
    } catch (error) {
      console.error("Error creating AI shift:", error);
      res.status(500).json({ error: "Failed to create AI shift" });
    }
  });

  app.post("/api/shifts/ai-adjust", requireAuth, async (req, res) => {
    try {
      const { shiftId, adjustments, requirements, context } = req.body;
      
      const aiResponse = await processShiftAIRequest({
        type: 'adjust',
        shiftId,
        adjustments,
        requirements,
        context: context || {}
      });
      
      res.json(aiResponse);
    } catch (error) {
      console.error("Error adjusting AI shift:", error);
      res.status(500).json({ error: "Failed to adjust AI shift" });
    }
  });

  // AI Shift Assignment
  app.post("/api/shifts/ai-assign", requireAuth, async (req, res) => {
    try {
      const { requirements, templates, resources, plants } = req.body;
      
      if (!requirements || typeof requirements !== 'string') {
        return res.status(400).json({ error: "Requirements field is required" });
      }
      
      const aiResponse = await processShiftAssignmentAIRequest({
        requirements,
        templates: templates || [],
        resources: resources || [],
        plants: plants || []
      });
      
      res.json(aiResponse);
    } catch (error) {
      console.error("Error processing AI shift assignment:", error);
      res.status(500).json({ error: "Failed to process AI shift assignment" });
    }
  });

  // Unplanned Downtime Management
  app.get("/api/unplanned-downtime", async (req, res) => {
    try {
      const resourceId = req.query.resourceId ? parseInt(req.query.resourceId as string) : undefined;
      const status = req.query.status as string;
      const downtime = await storage.getUnplannedDowntime(resourceId, status);
      res.json(downtime);
    } catch (error) {
      console.error("Error fetching unplanned downtime:", error);
      res.status(500).json({ error: "Failed to fetch unplanned downtime" });
    }
  });

  app.post("/api/unplanned-downtime", requireAuth, async (req, res) => {
    try {
      const downtimeData = req.body;
      const downtime = await storage.createUnplannedDowntime(downtimeData);
      res.status(201).json(downtime);
    } catch (error) {
      console.error("Error creating unplanned downtime:", error);
      res.status(500).json({ error: "Failed to create unplanned downtime" });
    }
  });

  app.put("/api/unplanned-downtime/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid downtime ID" });
      }
      const updates = req.body;
      const downtime = await storage.updateUnplannedDowntime(id, updates);
      if (!downtime) {
        return res.status(404).json({ error: "Downtime not found" });
      }
      res.json(downtime);
    } catch (error) {
      console.error("Error updating unplanned downtime:", error);
      res.status(500).json({ error: "Failed to update unplanned downtime" });
    }
  });

  app.delete("/api/unplanned-downtime/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid downtime ID" });
      }
      const success = await storage.deleteUnplannedDowntime(id);
      if (!success) {
        return res.status(404).json({ error: "Downtime not found" });
      }
      res.json({ message: "Downtime deleted successfully" });
    } catch (error) {
      console.error("Error deleting unplanned downtime:", error);
      res.status(500).json({ error: "Failed to delete unplanned downtime" });
    }
  });

  // Overtime Shifts Management
  app.get("/api/overtime-shifts", async (req, res) => {
    try {
      const resourceId = req.query.resourceId ? parseInt(req.query.resourceId as string) : undefined;
      const status = req.query.status as string;
      const overtimeShifts = await storage.getOvertimeShifts(resourceId, status);
      res.json(overtimeShifts);
    } catch (error) {
      console.error("Error fetching overtime shifts:", error);
      res.status(500).json({ error: "Failed to fetch overtime shifts" });
    }
  });

  app.post("/api/overtime-shifts", requireAuth, async (req, res) => {
    try {
      const overtimeData = req.body;
      const overtime = await storage.createOvertimeShift(overtimeData);
      res.status(201).json(overtime);
    } catch (error) {
      console.error("Error creating overtime shift:", error);
      res.status(500).json({ error: "Failed to create overtime shift" });
    }
  });

  app.put("/api/overtime-shifts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid overtime shift ID" });
      }
      const updates = req.body;
      const overtime = await storage.updateOvertimeShift(id, updates);
      if (!overtime) {
        return res.status(404).json({ error: "Overtime shift not found" });
      }
      res.json(overtime);
    } catch (error) {
      console.error("Error updating overtime shift:", error);
      res.status(500).json({ error: "Failed to update overtime shift" });
    }
  });

  app.delete("/api/overtime-shifts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid overtime shift ID" });
      }
      const success = await storage.deleteOvertimeShift(id);
      if (!success) {
        return res.status(404).json({ error: "Overtime shift not found" });
      }
      res.json({ message: "Overtime shift deleted successfully" });
    } catch (error) {
      console.error("Error deleting overtime shift:", error);
      res.status(500).json({ error: "Failed to delete overtime shift" });
    }
  });

  // Downtime Actions Management
  app.get("/api/downtime-actions", async (req, res) => {
    try {
      const downtimeId = req.query.downtimeId ? parseInt(req.query.downtimeId as string) : undefined;
      const actions = await storage.getDowntimeActions(downtimeId);
      res.json(actions);
    } catch (error) {
      console.error("Error fetching downtime actions:", error);
      res.status(500).json({ error: "Failed to fetch downtime actions" });
    }
  });

  app.post("/api/downtime-actions", requireAuth, async (req, res) => {
    try {
      const actionData = req.body;
      const action = await storage.createDowntimeAction(actionData);
      res.status(201).json(action);
    } catch (error) {
      console.error("Error creating downtime action:", error);
      res.status(500).json({ error: "Failed to create downtime action" });
    }
  });

  app.put("/api/downtime-actions/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid action ID" });
      }
      const updates = req.body;
      const action = await storage.updateDowntimeAction(id, updates);
      if (!action) {
        return res.status(404).json({ error: "Action not found" });
      }
      res.json(action);
    } catch (error) {
      console.error("Error updating downtime action:", error);
      res.status(500).json({ error: "Failed to update downtime action" });
    }
  });

  app.post("/api/shifts/ai-optimize", requireAuth, async (req, res) => {
    try {
      const { shifts, constraints, objectives } = req.body;
      
      const aiResponse = await processShiftAIRequest({
        type: 'optimize',
        shifts: shifts || [],
        constraints: constraints || {},
        objectives: objectives || {}
      });
      
      res.json(aiResponse);
    } catch (error) {
      console.error("Error optimizing AI shifts:", error);
      res.status(500).json({ error: "Failed to optimize AI shifts" });
    }
  });

  // Resource Absences Management
  app.get("/api/resource-absences", async (req, res) => {
    try {
      const resourceId = req.query.resourceId ? parseInt(req.query.resourceId as string) : undefined;
      const status = req.query.status as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      let absences;
      if (startDate && endDate) {
        absences = await storage.getAbsencesInDateRange(startDate, endDate, resourceId);
      } else {
        absences = await storage.getResourceAbsences(resourceId, status);
      }
      
      res.json(absences);
    } catch (error) {
      console.error("Error fetching resource absences:", error);
      res.status(500).json({ error: "Failed to fetch resource absences" });
    }
  });

  app.post("/api/resource-absences", requireAuth, async (req, res) => {
    try {
      const absenceData = insertResourceAbsenceSchema.parse(req.body);
      const absence = await storage.createResourceAbsence(absenceData);
      res.status(201).json(absence);
    } catch (error) {
      console.error("Error creating resource absence:", error);
      res.status(500).json({ error: "Failed to create resource absence" });
    }
  });

  app.patch("/api/resource-absences/:id/approve", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid absence ID" });
      }
      const approvedBy = req.user?.id || 1; // Default to user 1 if no auth
      const absence = await storage.approveResourceAbsence(id, approvedBy);
      if (!absence) {
        return res.status(404).json({ error: "Absence not found" });
      }
      res.json(absence);
    } catch (error) {
      console.error("Error approving resource absence:", error);
      res.status(500).json({ error: "Failed to approve resource absence" });
    }
  });

  app.patch("/api/resource-absences/:id/deny", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid absence ID" });
      }
      const approvedBy = req.user?.id || 1;
      const { reason } = req.body;
      const absence = await storage.denyResourceAbsence(id, approvedBy, reason);
      if (!absence) {
        return res.status(404).json({ error: "Absence not found" });
      }
      res.json(absence);
    } catch (error) {
      console.error("Error denying resource absence:", error);
      res.status(500).json({ error: "Failed to deny resource absence" });
    }
  });

  // Shift Scenarios for Capacity Planning
  app.get("/api/shift-scenarios", async (req, res) => {
    try {
      const capacityScenarioId = req.query.capacityScenarioId ? parseInt(req.query.capacityScenarioId as string) : undefined;
      const scenarios = await storage.getShiftScenarios(capacityScenarioId);
      res.json(scenarios);
    } catch (error) {
      console.error("Error fetching shift scenarios:", error);
      res.status(500).json({ error: "Failed to fetch shift scenarios" });
    }
  });

  app.post("/api/shift-scenarios", requireAuth, async (req, res) => {
    try {
      const scenarioData = insertShiftScenarioSchema.parse(req.body);
      const scenario = await storage.createShiftScenario(scenarioData);
      res.status(201).json(scenario);
    } catch (error) {
      console.error("Error creating shift scenario:", error);
      res.status(500).json({ error: "Failed to create shift scenario" });
    }
  });

  app.post("/api/shift-scenarios/:id/simulate", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }
      const scenario = await storage.runShiftScenarioSimulation(id);
      res.json(scenario);
    } catch (error) {
      console.error("Error running shift scenario simulation:", error);
      res.status(500).json({ error: "Failed to run shift scenario simulation" });
    }
  });

  // Shift Utilization and Analytics
  app.get("/api/shift-utilization", async (req, res) => {
    try {
      const shiftTemplateId = req.query.shiftTemplateId ? parseInt(req.query.shiftTemplateId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const dateRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;
      const utilization = await storage.getShiftUtilization(shiftTemplateId, dateRange);
      res.json(utilization);
    } catch (error) {
      console.error("Error fetching shift utilization:", error);
      res.status(500).json({ error: "Failed to fetch shift utilization" });
    }
  });

  app.get("/api/shift-utilization/summary", async (req, res) => {
    try {
      const plantId = req.query.plantId ? parseInt(req.query.plantId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const dateRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;
      const summary = await storage.getShiftUtilizationSummary(plantId, dateRange);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching shift utilization summary:", error);
      res.status(500).json({ error: "Failed to fetch shift utilization summary" });
    }
  });

  // Unplanned Downtime Management
  app.get("/api/unplanned-downtime", async (req, res) => {
    try {
      const resourceId = req.query.resourceId ? parseInt(req.query.resourceId as string) : undefined;
      const status = req.query.status as string | undefined;
      const plantId = req.query.plantId ? parseInt(req.query.plantId as string) : undefined;
      
      const downtimes = await storage.getUnplannedDowntime(resourceId, status, plantId);
      res.json(downtimes);
    } catch (error) {
      console.error("Error fetching unplanned downtime:", error);
      res.status(500).json({ error: "Failed to fetch unplanned downtime" });
    }
  });

  app.post("/api/unplanned-downtime", requireAuth, async (req, res) => {
    try {
      const downtimeData = insertUnplannedDowntimeSchema.parse(req.body);
      const downtime = await storage.createUnplannedDowntime(downtimeData);
      res.status(201).json(downtime);
    } catch (error) {
      console.error("Error creating unplanned downtime:", error);
      res.status(500).json({ error: "Failed to create unplanned downtime" });
    }
  });

  app.put("/api/unplanned-downtime/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid downtime ID" });
      }
      const updates = insertUnplannedDowntimeSchema.partial().parse(req.body);
      const downtime = await storage.updateUnplannedDowntime(id, updates);
      if (!downtime) {
        return res.status(404).json({ error: "Downtime not found" });
      }
      res.json(downtime);
    } catch (error) {
      console.error("Error updating unplanned downtime:", error);
      res.status(500).json({ error: "Failed to update unplanned downtime" });
    }
  });

  app.delete("/api/unplanned-downtime/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid downtime ID" });
      }
      const success = await storage.deleteUnplannedDowntime(id);
      if (!success) {
        return res.status(404).json({ error: "Downtime not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting unplanned downtime:", error);
      res.status(500).json({ error: "Failed to delete unplanned downtime" });
    }
  });

  // Overtime Shift Management
  app.get("/api/overtime-shifts", async (req, res) => {
    try {
      const resourceId = req.query.resourceId ? parseInt(req.query.resourceId as string) : undefined;
      const status = req.query.status as string | undefined;
      const plantId = req.query.plantId ? parseInt(req.query.plantId as string) : undefined;
      
      const overtimeShifts = await storage.getOvertimeShifts(resourceId, status, plantId);
      res.json(overtimeShifts);
    } catch (error) {
      console.error("Error fetching overtime shifts:", error);
      res.status(500).json({ error: "Failed to fetch overtime shifts" });
    }
  });

  app.post("/api/overtime-shifts", requireAuth, async (req, res) => {
    try {
      const overtimeData = insertOvertimeShiftSchema.parse(req.body);
      const overtime = await storage.createOvertimeShift(overtimeData);
      res.status(201).json(overtime);
    } catch (error) {
      console.error("Error creating overtime shift:", error);
      res.status(500).json({ error: "Failed to create overtime shift" });
    }
  });

  app.put("/api/overtime-shifts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid overtime shift ID" });
      }
      const updates = insertOvertimeShiftSchema.partial().parse(req.body);
      const overtime = await storage.updateOvertimeShift(id, updates);
      if (!overtime) {
        return res.status(404).json({ error: "Overtime shift not found" });
      }
      res.json(overtime);
    } catch (error) {
      console.error("Error updating overtime shift:", error);
      res.status(500).json({ error: "Failed to update overtime shift" });
    }
  });

  app.delete("/api/overtime-shifts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid overtime shift ID" });
      }
      const success = await storage.deleteOvertimeShift(id);
      if (!success) {
        return res.status(404).json({ error: "Overtime shift not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting overtime shift:", error);
      res.status(500).json({ error: "Failed to delete overtime shift" });
    }
  });

  // Downtime Actions Management
  app.get("/api/downtime-actions", async (req, res) => {
    try {
      const downtimeId = req.query.downtimeId ? parseInt(req.query.downtimeId as string) : undefined;
      const assignedTo = req.query.assignedTo ? parseInt(req.query.assignedTo as string) : undefined;
      
      const actions = await storage.getDowntimeActions(downtimeId, assignedTo);
      res.json(actions);
    } catch (error) {
      console.error("Error fetching downtime actions:", error);
      res.status(500).json({ error: "Failed to fetch downtime actions" });
    }
  });

  app.post("/api/downtime-actions", requireAuth, async (req, res) => {
    try {
      const actionData = insertDowntimeActionSchema.parse(req.body);
      const action = await storage.createDowntimeAction(actionData);
      res.status(201).json(action);
    } catch (error) {
      console.error("Error creating downtime action:", error);
      res.status(500).json({ error: "Failed to create downtime action" });
    }
  });

  app.put("/api/downtime-actions/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid action ID" });
      }
      const updates = insertDowntimeActionSchema.partial().parse(req.body);
      const action = await storage.updateDowntimeAction(id, updates);
      if (!action) {
        return res.status(404).json({ error: "Downtime action not found" });
      }
      res.json(action);
    } catch (error) {
      console.error("Error updating downtime action:", error);
      res.status(500).json({ error: "Failed to update downtime action" });
    }
  });

  app.delete("/api/downtime-actions/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid action ID" });
      }
      const success = await storage.deleteDowntimeAction(id);
      if (!success) {
        return res.status(404).json({ error: "Downtime action not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting downtime action:", error);
      res.status(500).json({ error: "Failed to delete downtime action" });
    }
  });

  // Shift Change Requests Management
  app.get("/api/shift-change-requests", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const urgency = req.query.urgency as string | undefined;
      const plantId = req.query.plantId ? parseInt(req.query.plantId as string) : undefined;
      
      const requests = await storage.getShiftChangeRequests(status, urgency, plantId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching shift change requests:", error);
      res.status(500).json({ error: "Failed to fetch shift change requests" });
    }
  });

  app.post("/api/shift-change-requests", requireAuth, async (req, res) => {
    try {
      const requestData = insertShiftChangeRequestSchema.parse(req.body);
      const request = await storage.createShiftChangeRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating shift change request:", error);
      res.status(500).json({ error: "Failed to create shift change request" });
    }
  });

  app.put("/api/shift-change-requests/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid request ID" });
      }
      const updates = insertShiftChangeRequestSchema.partial().parse(req.body);
      const request = await storage.updateShiftChangeRequest(id, updates);
      if (!request) {
        return res.status(404).json({ error: "Shift change request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error updating shift change request:", error);
      res.status(500).json({ error: "Failed to update shift change request" });
    }
  });

  app.delete("/api/shift-change-requests/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid request ID" });
      }
      const success = await storage.deleteShiftChangeRequest(id);
      if (!success) {
        return res.status(404).json({ error: "Shift change request not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting shift change request:", error);
      res.status(500).json({ error: "Failed to delete shift change request" });
    }
  });

  // Production Scheduler's Cockpit API Routes
  app.get("/api/cockpit/layouts", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const layouts = await storage.getCockpitLayouts(userId);
      res.json(layouts);
    } catch (error) {
      console.error("Error fetching cockpit layouts:", error);
      res.status(500).json({ error: "Failed to fetch cockpit layouts" });
    }
  });

  app.get("/api/cockpit/layouts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid layout ID" });
      }
      const layout = await storage.getCockpitLayout(id);
      if (!layout) {
        return res.status(404).json({ error: "Layout not found" });
      }
      res.json(layout);
    } catch (error) {
      console.error("Error fetching cockpit layout:", error);
      res.status(500).json({ error: "Failed to fetch cockpit layout" });
    }
  });

  app.post("/api/cockpit/layouts", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const layoutData = { ...req.body, user_id: userId };
      const layout = await storage.createCockpitLayout(layoutData);
      res.status(201).json(layout);
    } catch (error) {
      console.error("Error creating cockpit layout:", error);
      res.status(500).json({ error: "Failed to create cockpit layout" });
    }
  });

  app.put("/api/cockpit/layouts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid layout ID" });
      }
      const layout = await storage.updateCockpitLayout(id, req.body);
      if (!layout) {
        return res.status(404).json({ error: "Layout not found" });
      }
      res.json(layout);
    } catch (error) {
      console.error("Error updating cockpit layout:", error);
      res.status(500).json({ error: "Failed to update cockpit layout" });
    }
  });

  app.delete("/api/cockpit/layouts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid layout ID" });
      }
      const success = await storage.deleteCockpitLayout(id);
      if (!success) {
        return res.status(404).json({ error: "Layout not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting cockpit layout:", error);
      res.status(500).json({ error: "Failed to delete cockpit layout" });
    }
  });

  app.get("/api/cockpit/widgets/:layoutId", requireAuth, async (req, res) => {
    try {
      const layoutId = parseInt(req.params.layoutId);
      if (isNaN(layoutId)) {
        return res.status(400).json({ error: "Invalid layout ID" });
      }
      const widgets = await storage.getCockpitWidgets(layoutId);
      res.json(widgets);
    } catch (error) {
      console.error("Error fetching cockpit widgets:", error);
      res.status(500).json({ error: "Failed to fetch cockpit widgets" });
    }
  });

  app.post("/api/cockpit/widgets", requireAuth, async (req, res) => {
    try {
      const widget = await storage.createCockpitWidget(req.body);
      res.status(201).json(widget);
    } catch (error) {
      console.error("Error creating cockpit widget:", error);
      res.status(500).json({ error: "Failed to create cockpit widget" });
    }
  });

  app.put("/api/cockpit/widgets/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid widget ID" });
      }
      const widget = await storage.updateCockpitWidget(id, req.body);
      if (!widget) {
        return res.status(404).json({ error: "Widget not found" });
      }
      res.json(widget);
    } catch (error) {
      console.error("Error updating cockpit widget:", error);
      res.status(500).json({ error: "Failed to update cockpit widget" });
    }
  });

  app.delete("/api/cockpit/widgets/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid widget ID" });
      }
      const success = await storage.deleteCockpitWidget(id);
      if (!success) {
        return res.status(404).json({ error: "Widget not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting cockpit widget:", error);
      res.status(500).json({ error: "Failed to delete cockpit widget" });
    }
  });

  app.get("/api/cockpit/alerts", requireAuth, async (req, res) => {
    try {
      const widgetId = req.query.widgetId ? parseInt(req.query.widgetId as string) : undefined;
      const alerts = await storage.getCockpitAlerts(widgetId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching cockpit alerts:", error);
      res.status(500).json({ error: "Failed to fetch cockpit alerts" });
    }
  });

  app.post("/api/cockpit/alerts", requireAuth, async (req, res) => {
    try {
      const alert = await storage.createCockpitAlert(req.body);
      res.status(201).json(alert);
    } catch (error) {
      console.error("Error creating cockpit alert:", error);
      res.status(500).json({ error: "Failed to create cockpit alert" });
    }
  });

  app.get("/api/cockpit/templates", async (req, res) => {
    try {
      const templates = await storage.getCockpitTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching cockpit templates:", error);
      res.status(500).json({ error: "Failed to fetch cockpit templates" });
    }
  });

  // AI-powered cockpit layout generation
  app.post("/api/cockpit/ai-generate-layout", requireAuth, async (req, res) => {
    try {
      const { description, role, industry, goals } = req.body;
      const userId = req.user!.id;

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Get current system data for context
      const jobs = await storage.getJobs();
      const resources = await storage.getResources();
      const metrics = {
        totalJobs: jobs.length,
        activeJobs: jobs.filter(j => j.status === 'active' || j.status === 'In-Progress').length,
        totalResources: resources.length,
        availableResources: resources.filter(r => r.status === 'active').length
      };

      const systemPrompt = `You are an expert production scheduler dashboard designer. Generate a comprehensive cockpit layout optimized for manufacturing production scheduling.

User Requirements:
- Description: ${description}
- Role: ${role}
- Industry: ${industry || 'Manufacturing'}
- Goals: ${goals}

Current System Context:
- Total Jobs: ${metrics.totalJobs}
- Active Jobs: ${metrics.activeJobs}
- Total Resources: ${metrics.totalResources}
- Available Resources: ${metrics.availableResources}

Generate a professional dashboard layout with 6-12 widgets optimized for production scheduling. Include widgets for:
1. Key production metrics (OEE, utilization, efficiency)
2. Job status overview (planned, active, completed, overdue)
3. Resource utilization charts
4. Schedule timeline view
5. Critical alerts and notifications
6. Real-time production targets vs actuals
7. Capacity planning indicators
8. Quality metrics dashboard

For each widget, specify:
- type: "metrics", "chart", "alerts", "schedule", "resources", "production", "kpi", or "activity"
- title: descriptive title
- sub_title: brief description
- position: {x, y, w, h} where x,y are grid coordinates, w,h are width/height in grid units
- configuration: widget-specific settings

Response must be valid JSON with this structure:
{
  "name": "Layout name",
  "description": "Layout description", 
  "theme": "professional",
  "widgets": [
    {
      "type": "metrics",
      "title": "Production KPIs",
      "sub_title": "Real-time performance indicators",
      "position": {"x": 0, "y": 0, "w": 4, "h": 3},
      "configuration": {"metrics": ["oee", "utilization", "efficiency"], "refreshRate": 30}
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a cockpit layout for: ${description}` }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const aiResult = JSON.parse(response.choices[0].message.content || "{}");

      // Create the layout with AI-generated data
      const layoutData = {
        name: aiResult.name || `AI Generated Layout - ${new Date().toLocaleDateString()}`,
        description: aiResult.description || description,
        theme: aiResult.theme || "professional",
        auto_refresh: true,
        refresh_interval: 30,
        grid_layout: {
          widgets: aiResult.widgets || []
        },
        user_id: userId,
        is_ai_generated: true
      };

      const layout = await storage.createCockpitLayout(layoutData);

      // Create individual widgets for the layout
      if (aiResult.widgets && Array.isArray(aiResult.widgets)) {
        const widgets = await Promise.all(
          aiResult.widgets.map(async (widget: any) => {
            const widgetData = {
              layout_id: layout.id,
              type: widget.type,
              title: widget.title,
              sub_title: widget.sub_title,
              position: JSON.stringify(widget.position),
              configuration: JSON.stringify(widget.configuration || {}),
              is_visible: true
            };
            return await storage.createCockpitWidget(widgetData);
          })
        );
        
        res.status(201).json({ layout, widgets });
      } else {
        res.status(201).json({ layout, widgets: [] });
      }

    } catch (error) {
      console.error("Error generating AI cockpit layout:", error);
      res.status(500).json({ error: "Failed to generate AI cockpit layout" });
    }
  });

  // AI-powered widget generation
  app.post("/api/cockpit/ai-generate-widget", requireAuth, async (req, res) => {
    try {
      const { layoutId, description, dataSource, visualizationType } = req.body;

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Get layout context
      const layout = await storage.getCockpitLayout(layoutId);
      const existingWidgets = await storage.getCockpitWidgets(layoutId);

      const systemPrompt = `You are an expert dashboard widget designer for manufacturing production systems. Generate a specific widget configuration based on user requirements.

Current Layout Context:
- Layout: ${layout?.name || 'Unknown'}
- Theme: ${layout?.theme || 'professional'}
- Existing Widgets: ${existingWidgets.length}

Widget Types Available:
- metrics: Key performance indicators and numerical data
- chart: Visual charts (pie, bar, line, gauge)
- alerts: Notifications and alert panels
- schedule: Timeline and scheduling views
- resources: Resource status and utilization
- production: Production status and progress
- kpi: KPI dashboards with targets
- activity: Activity feeds and logs

Generate a widget configuration that complements existing widgets and provides value for production scheduling.

Response must be valid JSON:
{
  "type": "chart",
  "title": "Widget Title",
  "sub_title": "Brief description",
  "position": {"x": 0, "y": 0, "w": 4, "h": 3},
  "configuration": {
    "chartType": "bar",
    "dataSource": "jobs",
    "metrics": ["count", "status"],
    "refreshRate": 30,
    "colors": ["#3b82f6", "#10b981", "#f59e0b"]
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a widget for: ${description}. Data source: ${dataSource}. Visualization: ${visualizationType}` }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const aiResult = JSON.parse(response.choices[0].message.content || "{}");

      // Find optimal position for new widget
      const gridWidth = 12;
      let bestPosition = { x: 0, y: 0, w: aiResult.position?.w || 4, h: aiResult.position?.h || 3 };
      
      // Simple grid placement logic
      const occupiedPositions = existingWidgets.map(w => {
        try {
          return typeof w.position === 'string' ? JSON.parse(w.position) : w.position;
        } catch {
          return { x: 0, y: 0, w: 4, h: 3 };
        }
      });

      let placed = false;
      for (let y = 0; y < 20 && !placed; y++) {
        for (let x = 0; x <= gridWidth - bestPosition.w && !placed; x++) {
          const conflicts = occupiedPositions.some(pos => 
            x < pos.x + pos.w && x + bestPosition.w > pos.x &&
            y < pos.y + pos.h && y + bestPosition.h > pos.y
          );
          if (!conflicts) {
            bestPosition.x = x;
            bestPosition.y = y;
            placed = true;
          }
        }
      }

      const widgetData = {
        layout_id: layoutId,
        type: aiResult.type || 'metrics',
        title: aiResult.title || 'AI Generated Widget',
        sub_title: aiResult.sub_title || description,
        position: JSON.stringify(bestPosition),
        configuration: JSON.stringify(aiResult.configuration || {}),
        is_visible: true
      };

      const widget = await storage.createCockpitWidget(widgetData);
      res.status(201).json(widget);

    } catch (error) {
      console.error("Error generating AI widget:", error);
      res.status(500).json({ error: "Failed to generate AI widget" });
    }
  });

  // Product Development API Endpoints
  
  // Strategy Documents
  app.get("/api/strategy-documents", requireAuth, async (req, res) => {
    try {
      const category = req.query.category as string;
      const documents = await storage.getStrategyDocuments(category);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching strategy documents:", error);
      res.status(500).json({ error: "Failed to fetch strategy documents" });
    }
  });

  app.get("/api/strategy-documents/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getStrategyDocument(id);
      if (!document) {
        return res.status(404).json({ error: "Strategy document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error fetching strategy document:", error);
      res.status(500).json({ error: "Failed to fetch strategy document" });
    }
  });

  app.post("/api/strategy-documents", requireAuth, async (req, res) => {
    try {
      const documentData = insertStrategyDocumentSchema.parse({
        ...req.body,
        createdBy: req.session.userId
      });
      const document = await storage.createStrategyDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating strategy document:", error);
      res.status(500).json({ error: "Failed to create strategy document" });
    }
  });

  app.put("/api/strategy-documents/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const document = await storage.updateStrategyDocument(id, updateData);
      if (!document) {
        return res.status(404).json({ error: "Strategy document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error updating strategy document:", error);
      res.status(500).json({ error: "Failed to update strategy document" });
    }
  });

  app.delete("/api/strategy-documents/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStrategyDocument(id);
      if (!success) {
        return res.status(404).json({ error: "Strategy document not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting strategy document:", error);
      res.status(500).json({ error: "Failed to delete strategy document" });
    }
  });

  // Development Tasks
  app.get("/api/development-tasks", requireAuth, async (req, res) => {
    try {
      const status = req.query.status as string;
      const phase = req.query.phase as string;
      const tasks = await storage.getDevelopmentTasks(status, phase);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching development tasks:", error);
      res.status(500).json({ error: "Failed to fetch development tasks" });
    }
  });

  app.get("/api/development-tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getDevelopmentTask(id);
      if (!task) {
        return res.status(404).json({ error: "Development task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching development task:", error);
      res.status(500).json({ error: "Failed to fetch development task" });
    }
  });

  app.post("/api/development-tasks", requireAuth, async (req, res) => {
    try {
      const taskData = insertDevelopmentTaskSchema.parse({
        ...req.body,
        createdBy: req.session.userId
      });
      const task = await storage.createDevelopmentTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating development task:", error);
      res.status(500).json({ error: "Failed to create development task" });
    }
  });

  app.put("/api/development-tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const task = await storage.updateDevelopmentTask(id, updateData);
      if (!task) {
        return res.status(404).json({ error: "Development task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating development task:", error);
      res.status(500).json({ error: "Failed to update development task" });
    }
  });

  app.delete("/api/development-tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDevelopmentTask(id);
      if (!success) {
        return res.status(404).json({ error: "Development task not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting development task:", error);
      res.status(500).json({ error: "Failed to delete development task" });
    }
  });

  // Test Suites
  app.get("/api/test-suites", requireAuth, async (req, res) => {
    try {
      const type = req.query.type as string;
      const status = req.query.status as string;
      const suites = await storage.getTestSuites(type, status);
      res.json(suites);
    } catch (error) {
      console.error("Error fetching test suites:", error);
      res.status(500).json({ error: "Failed to fetch test suites" });
    }
  });

  app.get("/api/test-suites/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const suite = await storage.getTestSuite(id);
      if (!suite) {
        return res.status(404).json({ error: "Test suite not found" });
      }
      res.json(suite);
    } catch (error) {
      console.error("Error fetching test suite:", error);
      res.status(500).json({ error: "Failed to fetch test suite" });
    }
  });

  app.post("/api/test-suites", requireAuth, async (req, res) => {
    try {
      const suiteData = insertTestSuiteSchema.parse({
        ...req.body,
        createdBy: req.session.userId
      });
      const suite = await storage.createTestSuite(suiteData);
      res.status(201).json(suite);
    } catch (error) {
      console.error("Error creating test suite:", error);
      res.status(500).json({ error: "Failed to create test suite" });
    }
  });

  app.put("/api/test-suites/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const suite = await storage.updateTestSuite(id, updateData);
      if (!suite) {
        return res.status(404).json({ error: "Test suite not found" });
      }
      res.json(suite);
    } catch (error) {
      console.error("Error updating test suite:", error);
      res.status(500).json({ error: "Failed to update test suite" });
    }
  });

  app.delete("/api/test-suites/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTestSuite(id);
      if (!success) {
        return res.status(404).json({ error: "Test suite not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting test suite:", error);
      res.status(500).json({ error: "Failed to delete test suite" });
    }
  });

  // Test Cases
  app.get("/api/test-cases", requireAuth, async (req, res) => {
    try {
      const suiteId = req.query.suiteId ? parseInt(req.query.suiteId as string) : undefined;
      const testCases = await storage.getTestCases(suiteId);
      res.json(testCases);
    } catch (error) {
      console.error("Error fetching test cases:", error);
      res.status(500).json({ error: "Failed to fetch test cases" });
    }
  });

  app.get("/api/test-cases/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const testCase = await storage.getTestCase(id);
      if (!testCase) {
        return res.status(404).json({ error: "Test case not found" });
      }
      res.json(testCase);
    } catch (error) {
      console.error("Error fetching test case:", error);
      res.status(500).json({ error: "Failed to fetch test case" });
    }
  });

  app.post("/api/test-cases", requireAuth, async (req, res) => {
    try {
      const testCaseData = insertTestCaseSchema.parse(req.body);
      const testCase = await storage.createTestCase(testCaseData);
      res.status(201).json(testCase);
    } catch (error) {
      console.error("Error creating test case:", error);
      res.status(500).json({ error: "Failed to create test case" });
    }
  });

  app.put("/api/test-cases/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const testCase = await storage.updateTestCase(id, updateData);
      if (!testCase) {
        return res.status(404).json({ error: "Test case not found" });
      }
      res.json(testCase);
    } catch (error) {
      console.error("Error updating test case:", error);
      res.status(500).json({ error: "Failed to update test case" });
    }
  });

  app.delete("/api/test-cases/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTestCase(id);
      if (!success) {
        return res.status(404).json({ error: "Test case not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting test case:", error);
      res.status(500).json({ error: "Failed to delete test case" });
    }
  });

  app.post("/api/test-cases/:id/run", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const testCase = await storage.runTestCase(id);
      if (!testCase) {
        return res.status(404).json({ error: "Test case not found" });
      }
      res.json(testCase);
    } catch (error) {
      console.error("Error running test case:", error);
      res.status(500).json({ error: "Failed to run test case" });
    }
  });

  // Architecture Components
  app.get("/api/architecture-components", requireAuth, async (req, res) => {
    try {
      const components = await storage.getArchitectureComponents();
      res.json(components);
    } catch (error) {
      console.error("Error fetching architecture components:", error);
      res.status(500).json({ error: "Failed to fetch architecture components" });
    }
  });

  app.get("/api/architecture-components/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const component = await storage.getArchitectureComponent(id);
      if (!component) {
        return res.status(404).json({ error: "Architecture component not found" });
      }
      res.json(component);
    } catch (error) {
      console.error("Error fetching architecture component:", error);
      res.status(500).json({ error: "Failed to fetch architecture component" });
    }
  });

  app.post("/api/architecture-components", requireAuth, async (req, res) => {
    try {
      const componentData = insertArchitectureComponentSchema.parse(req.body);
      const component = await storage.createArchitectureComponent(componentData);
      res.status(201).json(component);
    } catch (error) {
      console.error("Error creating architecture component:", error);
      res.status(500).json({ error: "Failed to create architecture component" });
    }
  });

  app.put("/api/architecture-components/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const component = await storage.updateArchitectureComponent(id, updateData);
      if (!component) {
        return res.status(404).json({ error: "Architecture component not found" });
      }
      res.json(component);
    } catch (error) {
      console.error("Error updating architecture component:", error);
      res.status(500).json({ error: "Failed to update architecture component" });
    }
  });

  app.delete("/api/architecture-components/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteArchitectureComponent(id);
      if (!success) {
        return res.status(404).json({ error: "Architecture component not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting architecture component:", error);
      res.status(500).json({ error: "Failed to delete architecture component" });
    }
  });

  // =================== API INTEGRATIONS ===================

  // API Integrations
  app.get("/api/integrations", createSafeHandler(async (req, res) => {
    const integrations = await storage.getApiIntegrations();
    res.json(integrations);
  }));

  app.get("/api/integrations/:id", createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid integration ID");
    }

    const integration = await storage.getApiIntegration(id);
    if (!integration) {
      throw new NotFoundError("Integration not found");
    }
    res.json(integration);
  }));

  app.post("/api/integrations", requireAuth, createSafeHandler(async (req, res) => {
    const validation = insertApiIntegrationSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError("Invalid integration data", validation.error.errors);
    }

    const integration = await storage.createApiIntegration(validation.data);
    res.status(201).json(integration);
  }));

  app.put("/api/integrations/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid integration ID");
    }

    const validation = insertApiIntegrationSchema.partial().safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError("Invalid integration data", validation.error.errors);
    }

    const integration = await storage.updateApiIntegration(id, validation.data);
    res.json(integration);
  }));

  app.delete("/api/integrations/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid integration ID");
    }

    await storage.deleteApiIntegration(id);
    res.json({ success: true });
  }));

  // AI Integration Generation
  app.post("/api/integrations/ai-generate", requireAuth, createSafeHandler(async (req, res) => {
    const { prompt, systemType, provider } = req.body;
    
    if (!prompt || !systemType || !provider) {
      throw new ValidationError("Missing required fields: prompt, systemType, provider");
    }

    const userId = req.session?.userId || req.user?.id;
    if (!userId) {
      throw new AuthenticationError("User not authenticated");
    }

    const integration = await storage.generateApiIntegrationWithAI(prompt, systemType, provider, userId);
    res.status(201).json(integration);
  }));

  // Connection Testing
  app.post("/api/integrations/:id/test", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid integration ID");
    }

    const result = await storage.testApiConnection(id);
    res.json(result);
  }));

  // Data Synchronization
  app.post("/api/integrations/:id/sync", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid integration ID");
    }

    const result = await storage.syncApiIntegration(id);
    res.json(result);
  }));

  // API Mappings
  app.get("/api/mappings", createSafeHandler(async (req, res) => {
    const integrationId = req.query.integrationId ? parseInt(req.query.integrationId as string) : undefined;
    const mappings = await storage.getApiMappings(integrationId);
    res.json(mappings);
  }));

  app.get("/api/mappings/:id", createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid mapping ID");
    }

    const mapping = await storage.getApiMapping(id);
    if (!mapping) {
      throw new NotFoundError("Mapping not found");
    }
    res.json(mapping);
  }));

  app.post("/api/mappings", requireAuth, createSafeHandler(async (req, res) => {
    const validation = insertApiMappingSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError("Invalid mapping data", validation.error.errors);
    }

    const mapping = await storage.createApiMapping(validation.data);
    res.status(201).json(mapping);
  }));

  app.put("/api/mappings/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid mapping ID");
    }

    const validation = insertApiMappingSchema.partial().safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError("Invalid mapping data", validation.error.errors);
    }

    const mapping = await storage.updateApiMapping(id, validation.data);
    res.json(mapping);
  }));

  app.delete("/api/mappings/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid mapping ID");
    }

    await storage.deleteApiMapping(id);
    res.json({ success: true });
  }));

  // AI Mapping Generation
  app.post("/api/mappings/ai-generate", requireAuth, createSafeHandler(async (req, res) => {
    const { integrationId, description } = req.body;
    
    if (!integrationId || !description) {
      throw new ValidationError("Missing required fields: integrationId, description");
    }

    const mapping = await storage.generateApiMappingWithAI(integrationId, description);
    res.status(201).json(mapping);
  }));

  // API Tests
  app.get("/api/tests", createSafeHandler(async (req, res) => {
    const integrationId = req.query.integrationId ? parseInt(req.query.integrationId as string) : undefined;
    const tests = await storage.getApiTests(integrationId);
    res.json(tests);
  }));

  app.get("/api/tests/:id", createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid test ID");
    }

    const test = await storage.getApiTest(id);
    if (!test) {
      throw new NotFoundError("Test not found");
    }
    res.json(test);
  }));

  app.post("/api/tests", requireAuth, createSafeHandler(async (req, res) => {
    const validation = insertApiTestSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError("Invalid test data", validation.error.errors);
    }

    const test = await storage.createApiTest(validation.data);
    res.status(201).json(test);
  }));

  app.post("/api/tests/:id/run", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid test ID");
    }

    const test = await storage.runApiTest(id);
    res.json(test);
  }));

  app.delete("/api/tests/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid test ID");
    }

    await storage.deleteApiTest(id);
    res.json({ success: true });
  }));

  // API Audit Logs
  app.get("/api/audit-logs", createSafeHandler(async (req, res) => {
    const integrationId = req.query.integrationId ? parseInt(req.query.integrationId as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    
    const logs = await storage.getApiAuditLogs(integrationId, limit);
    res.json(logs);
  }));

  // API Credentials
  app.get("/api/integrations/:integrationId/credentials", requireAuth, createSafeHandler(async (req, res) => {
    const integrationId = parseInt(req.params.integrationId);
    if (isNaN(integrationId)) {
      throw new ValidationError("Invalid integration ID");
    }

    const credentials = await storage.getApiCredentials(integrationId);
    res.json(credentials);
  }));

  app.post("/api/integrations/:integrationId/credentials", requireAuth, createSafeHandler(async (req, res) => {
    const integrationId = parseInt(req.params.integrationId);
    if (isNaN(integrationId)) {
      throw new ValidationError("Invalid integration ID");
    }

    const validation = insertApiCredentialSchema.safeParse({
      ...req.body,
      integrationId
    });
    if (!validation.success) {
      throw new ValidationError("Invalid credential data", validation.error.errors);
    }

    const credential = await storage.createApiCredential(validation.data);
    res.status(201).json(credential);
  }));

  app.put("/api/credentials/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid credential ID");
    }

    const validation = insertApiCredentialSchema.partial().safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError("Invalid credential data", validation.error.errors);
    }

    const credential = await storage.updateApiCredential(id, validation.data);
    res.json(credential);
  }));

  app.delete("/api/credentials/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid credential ID");
    }

    await storage.deleteApiCredential(id);
    res.json({ success: true });
  }));

  // Scheduling History Routes
  app.get("/api/scheduling-history", requireAuth, createSafeHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const algorithmType = req.query.algorithmType as string;
    const plantId = req.query.plantId ? parseInt(req.query.plantId as string) : undefined;
    
    const history = await storage.getSchedulingHistory(limit, algorithmType, plantId);
    res.json(history);
  }));

  app.get("/api/scheduling-history/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid scheduling history ID");
    }

    const history = await storage.getSchedulingHistoryById(id);
    if (!history) {
      throw new NotFoundError("Scheduling history not found");
    }
    res.json(history);
  }));

  app.post("/api/scheduling-history", requireAuth, createSafeHandler(async (req, res) => {
    const validation = insertSchedulingHistorySchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError("Invalid scheduling history data", validation.error.errors);
    }

    const history = await storage.createSchedulingHistory(validation.data);
    res.status(201).json(history);
  }));

  app.put("/api/scheduling-history/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid scheduling history ID");
    }

    const validation = insertSchedulingHistorySchema.partial().safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError("Invalid scheduling history data", validation.error.errors);
    }

    const history = await storage.updateSchedulingHistory(id, validation.data);
    if (!history) {
      throw new NotFoundError("Scheduling history not found");
    }
    res.json(history);
  }));

  app.delete("/api/scheduling-history/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid scheduling history ID");
    }

    const success = await storage.deleteSchedulingHistory(id);
    if (!success) {
      throw new NotFoundError("Scheduling history not found");
    }
    res.json({ success: true });
  }));

  app.get("/api/scheduling-history/user/:userId", requireAuth, createSafeHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      throw new ValidationError("Invalid user ID");
    }
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const history = await storage.getSchedulingHistoryByUser(userId, limit);
    res.json(history);
  }));

  app.get("/api/scheduling-history/:baselineId/compare/:comparisonId", requireAuth, createSafeHandler(async (req, res) => {
    const baselineId = parseInt(req.params.baselineId);
    const comparisonId = parseInt(req.params.comparisonId);
    
    if (isNaN(baselineId) || isNaN(comparisonId)) {
      throw new ValidationError("Invalid scheduling history IDs");
    }

    const comparison = await storage.getSchedulingHistoryComparison(baselineId, comparisonId);
    res.json(comparison);
  }));

  // Scheduling Results Routes
  app.get("/api/scheduling-history/:historyId/results", requireAuth, createSafeHandler(async (req, res) => {
    const historyId = parseInt(req.params.historyId);
    if (isNaN(historyId)) {
      throw new ValidationError("Invalid history ID");
    }

    const detailed = req.query.detailed === 'true';
    let results;
    
    if (detailed) {
      results = await storage.getSchedulingResultsWithDetails(historyId);
    } else {
      results = await storage.getSchedulingResults(historyId);
    }
    
    res.json(results);
  }));

  app.post("/api/scheduling-results", requireAuth, createSafeHandler(async (req, res) => {
    const validation = insertSchedulingResultSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError("Invalid scheduling result data", validation.error.errors);
    }

    const result = await storage.createSchedulingResult(validation.data);
    res.status(201).json(result);
  }));

  app.get("/api/operations/:operationId/scheduling-results", requireAuth, createSafeHandler(async (req, res) => {
    const operationId = parseInt(req.params.operationId);
    if (isNaN(operationId)) {
      throw new ValidationError("Invalid operation ID");
    }

    const results = await storage.getSchedulingResultsByOperation(operationId);
    res.json(results);
  }));

  // Algorithm Performance Routes
  app.get("/api/algorithm-performance", requireAuth, createSafeHandler(async (req, res) => {
    const algorithmName = req.query.algorithmName as string;
    const plantId = req.query.plantId ? parseInt(req.query.plantId as string) : undefined;
    
    const performance = await storage.getAlgorithmPerformance(algorithmName, plantId);
    res.json(performance);
  }));

  app.get("/api/algorithm-performance/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid algorithm performance ID");
    }

    const performance = await storage.getAlgorithmPerformanceById(id);
    if (!performance) {
      throw new NotFoundError("Algorithm performance not found");
    }
    res.json(performance);
  }));

  app.post("/api/algorithm-performance", requireAuth, createSafeHandler(async (req, res) => {
    const validation = insertAlgorithmPerformanceSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError("Invalid algorithm performance data", validation.error.errors);
    }

    const performance = await storage.createAlgorithmPerformance(validation.data);
    res.status(201).json(performance);
  }));

  app.put("/api/algorithm-performance/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid algorithm performance ID");
    }

    const validation = insertAlgorithmPerformanceSchema.partial().safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError("Invalid algorithm performance data", validation.error.errors);
    }

    const performance = await storage.updateAlgorithmPerformance(id, validation.data);
    if (!performance) {
      throw new NotFoundError("Algorithm performance not found");
    }
    res.json(performance);
  }));

  app.delete("/api/algorithm-performance/:id", requireAuth, createSafeHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid algorithm performance ID");
    }

    const success = await storage.deleteAlgorithmPerformance(id);
    if (!success) {
      throw new NotFoundError("Algorithm performance not found");
    }
    res.json({ success: true });
  }));

  app.get("/api/algorithm-performance/:algorithmName/trends", requireAuth, createSafeHandler(async (req, res) => {
    const algorithmName = req.params.algorithmName;
    const plantId = req.query.plantId ? parseInt(req.query.plantId as string) : undefined;
    const months = req.query.months ? parseInt(req.query.months as string) : 6;

    const trends = await storage.getAlgorithmPerformanceTrends(algorithmName, plantId, months);
    res.json(trends);
  }));

  // Onboarding Management Routes - Raw onboarding data for frontend
  app.get("/api/onboarding/status", requireAuth, createSafeHandler('onboarding-status')(async (req, res) => {
    const userId = req.user!.id;
    console.log('Onboarding status API called for user:', userId);
    
    const onboarding = await storage.getCompanyOnboarding(userId);
    console.log('Onboarding data found:', onboarding);
    
    if (!onboarding) {
      console.log('No onboarding data found, returning null');
      res.json(null);
      return;
    }
    res.json(onboarding);
  }));

  app.get("/api/onboarding/company/:userId", requireAuth, createSafeHandler('onboarding-get-by-user')(async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      throw new ValidationError("Invalid user ID", {
        operation: 'onboarding-get-by-user',
        endpoint: 'GET /api/onboarding/company/:userId',
        userId: req.user?.id,
        requestData: { userId }
      });
    }

    const onboarding = await storage.getCompanyOnboarding(userId);
    if (!onboarding) {
      res.status(404).json({ error: "No onboarding found for this company" });
      return;
    }
    res.json(onboarding);
  }));

  // Add initialize endpoint that frontend expects
  app.post("/api/onboarding/initialize", requireAuth, createSafeHandler('onboarding-initialize')(async (req, res) => {
    // Basic validation for required fields
    const { companyName, industry, size, description } = req.body;
    
    if (!companyName || !industry) {
      throw new ValidationError("Company name and industry are required", {
        operation: 'onboarding-initialize',
        endpoint: 'POST /api/onboarding/initialize',
        userId: req.user?.id,
        requestData: req.body,
        additionalInfo: { missingFields: ["companyName", "industry"] }
      });
    }

    const onboardingData = {
      companyName,
      industry,
      size: size || 'small',
      description: description || '',
      primaryGoal: 'improve-efficiency', // Default goal
      features: [],
      completedSteps: [],
      currentStep: 'welcome',
      teamMembers: 1,
      isCompleted: false,
      createdBy: req.user!.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const onboarding = await storage.createCompanyOnboarding(onboardingData);
    res.status(201).json(onboarding);
  }));

  app.post("/api/onboarding/company", requireAuth, createSafeHandler(async (req, res) => {
    // Basic validation for required fields
    const { companyName, industry, size, primaryGoal, features } = req.body;
    
    if (!companyName || !industry || !size || !primaryGoal || !features) {
      throw new ValidationError("Missing required onboarding fields", {
        operation: 'onboarding-company-create',
        endpoint: 'POST /api/onboarding/company',
        userId: req.user?.id,
        requestData: req.body,
        additionalInfo: { missingFields: ["companyName", "industry", "size", "primaryGoal", "features"] }
      });
    }

    const onboardingData = {
      companyName,
      industry,
      size,
      primaryGoal,
      features: Array.isArray(features) ? features : [],
      completedSteps: [],
      currentStep: 'welcome',
      teamMembers: 1,
      isCompleted: false,
      createdBy: req.user!.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const onboarding = await storage.createCompanyOnboarding(onboardingData);
    res.status(201).json(onboarding);
  }));

  app.put("/api/onboarding/company/:id", requireAuth, createSafeHandler('onboarding-company-update')(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid onboarding ID", {
        operation: 'onboarding-company-update',
        endpoint: 'PUT /api/onboarding/company/:id',
        userId: req.user?.id,
        requestData: { id, body: req.body }
      });
    }

    console.log('Updating onboarding record:', { id, body: req.body, userId: req.user?.id });
    
    const onboarding = await storage.updateCompanyOnboarding(id, req.body);
    if (!onboarding) {
      throw new NotFoundError("Onboarding not found", {
        operation: 'onboarding-company-update',
        endpoint: 'PUT /api/onboarding/company/:id',
        userId: req.user?.id,
        requestData: { id, body: req.body }
      });
    }
    
    console.log('Onboarding updated successfully:', onboarding.id);
    res.json(onboarding);
  }));

  app.get("/api/onboarding/progress/:userId/:companyOnboardingId", requireAuth, createSafeHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);
    const companyOnboardingId = parseInt(req.params.companyOnboardingId);
    
    if (isNaN(userId) || isNaN(companyOnboardingId)) {
      throw new ValidationError("Invalid user ID or onboarding ID");
    }

    const progress = await storage.getOnboardingProgress(userId, companyOnboardingId);
    res.json(progress);
  }));

  app.post("/api/onboarding/progress", requireAuth, createSafeHandler(async (req, res) => {
    const { userId, companyOnboardingId, step, status, data } = req.body;
    
    if (!userId || !companyOnboardingId || !step || !status) {
      throw new ValidationError("Missing required progress fields");
    }

    const progressData = {
      userId,
      companyOnboardingId,
      step,
      status,
      data: data || {},
      completedAt: status === 'completed' ? new Date() : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const progress = await storage.createOnboardingProgress(progressData);
    res.status(201).json(progress);
  }));

  app.put("/api/onboarding/progress/:userId/:step", requireAuth, createSafeHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);
    const step = req.params.step;
    
    if (isNaN(userId) || !step) {
      throw new ValidationError("Invalid user ID or step");
    }

    const progress = await storage.updateOnboardingProgress(userId, step, req.body);
    if (!progress) {
      throw new NotFoundError("Progress not found");
    }
    res.json(progress);
  }));

  app.get("/api/onboarding/team-status/:companyOnboardingId", requireAuth, createSafeHandler(async (req, res) => {
    const companyOnboardingId = parseInt(req.params.companyOnboardingId);
    
    if (isNaN(companyOnboardingId)) {
      throw new ValidationError("Invalid company onboarding ID");
    }

    const status = await storage.getTeamOnboardingStatus(companyOnboardingId);
    res.json(status);
  }));

  // Recipe Management
  app.get("/api/recipes", async (req, res) => {
    try {
      const plantId = req.query.plantId ? parseInt(req.query.plantId as string) : undefined;
      const recipes = await storage.getRecipes(plantId);
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid recipe ID" });
      }

      const recipe = await storage.getRecipe(id);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });

  app.post("/api/recipes", async (req, res) => {
    try {
      const validation = insertRecipeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid recipe data", details: validation.error.errors });
      }

      const recipe = await storage.createRecipe(validation.data);
      res.status(201).json(recipe);
    } catch (error) {
      console.error("Error creating recipe:", error);
      res.status(500).json({ error: "Failed to create recipe" });
    }
  });

  app.put("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid recipe ID" });
      }

      const validation = insertRecipeSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid recipe data", details: validation.error.errors });
      }

      const recipe = await storage.updateRecipe(id, validation.data);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      console.error("Error updating recipe:", error);
      res.status(500).json({ error: "Failed to update recipe" });
    }
  });

  app.delete("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid recipe ID" });
      }

      const success = await storage.deleteRecipe(id);
      if (!success) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ error: "Failed to delete recipe" });
    }
  });

  // Recipe Phases
  app.get("/api/recipe-phases", async (req, res) => {
    try {
      const recipeId = req.query.recipeId ? parseInt(req.query.recipeId as string) : undefined;
      
      const phases = await storage.getRecipePhases(recipeId);
      res.json(phases);
    } catch (error) {
      console.error("Error fetching recipe phases:", error);
      res.status(500).json({ error: "Failed to fetch recipe phases" });
    }
  });

  app.get("/api/recipes/:recipeId/phases", async (req, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      if (isNaN(recipeId)) {
        return res.status(400).json({ error: "Invalid recipe ID" });
      }

      const phases = await storage.getRecipePhases(recipeId);
      res.json(phases);
    } catch (error) {
      console.error("Error fetching recipe phases:", error);
      res.status(500).json({ error: "Failed to fetch recipe phases" });
    }
  });

  app.post("/api/recipe-phases", async (req, res) => {
    try {
      const validation = insertRecipePhaseSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid recipe phase data", details: validation.error.errors });
      }

      const phase = await storage.createRecipePhase(validation.data);
      res.status(201).json(phase);
    } catch (error) {
      console.error("Error creating recipe phase:", error);
      res.status(500).json({ error: "Failed to create recipe phase" });
    }
  });

  // Recipe Formulas
  app.get("/api/recipe-formulas", async (req, res) => {
    try {
      const recipeId = req.query.recipeId ? parseInt(req.query.recipeId as string) : undefined;
      const phaseId = req.query.phaseId ? parseInt(req.query.phaseId as string) : undefined;
      
      const formulas = await storage.getRecipeFormulas(recipeId, phaseId);
      res.json(formulas);
    } catch (error) {
      console.error("Error fetching recipe formulas:", error);
      res.status(500).json({ error: "Failed to fetch recipe formulas" });
    }
  });

  app.post("/api/recipe-formulas", async (req, res) => {
    try {
      const validation = insertRecipeFormulaSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid recipe formula data", details: validation.error.errors });
      }

      const formula = await storage.createRecipeFormula(validation.data);
      res.status(201).json(formula);
    } catch (error) {
      console.error("Error creating recipe formula:", error);
      res.status(500).json({ error: "Failed to create recipe formula" });
    }
  });

  // Recipe Equipment
  app.get("/api/recipe-equipment", async (req, res) => {
    try {
      const recipeId = req.query.recipeId ? parseInt(req.query.recipeId as string) : undefined;
      const phaseId = req.query.phaseId ? parseInt(req.query.phaseId as string) : undefined;
      
      const equipment = await storage.getRecipeEquipment(recipeId, phaseId);
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching recipe equipment:", error);
      res.status(500).json({ error: "Failed to fetch recipe equipment" });
    }
  });

  app.post("/api/recipe-equipment", async (req, res) => {
    try {
      const validation = insertRecipeEquipmentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid recipe equipment data", details: validation.error.errors });
      }

      const equipment = await storage.createRecipeEquipment(validation.data);
      res.status(201).json(equipment);
    } catch (error) {
      console.error("Error creating recipe equipment:", error);
      res.status(500).json({ error: "Failed to create recipe equipment" });
    }
  });

  // Vendor Management
  app.get("/api/vendors", async (req, res) => {
    try {
      const vendors = await storage.getVendors();
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ error: "Failed to fetch vendors" });
    }
  });

  app.get("/api/vendors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid vendor ID" });
      }

      const vendor = await storage.getVendor(id);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error fetching vendor:", error);
      res.status(500).json({ error: "Failed to fetch vendor" });
    }
  });

  app.post("/api/vendors", async (req, res) => {
    try {
      const validation = insertVendorSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid vendor data", details: validation.error.errors });
      }

      const vendor = await storage.createVendor(validation.data);
      res.status(201).json(vendor);
    } catch (error) {
      console.error("Error creating vendor:", error);
      res.status(500).json({ error: "Failed to create vendor" });
    }
  });

  app.put("/api/vendors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid vendor ID" });
      }

      const validation = insertVendorSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid vendor data", details: validation.error.errors });
      }

      const vendor = await storage.updateVendor(id, validation.data);
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error updating vendor:", error);
      res.status(500).json({ error: "Failed to update vendor" });
    }
  });

  app.delete("/api/vendors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid vendor ID" });
      }

      const deleted = await storage.deleteVendor(id);
      if (!deleted) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vendor:", error);
      res.status(500).json({ error: "Failed to delete vendor" });
    }
  });

  // Customer Management
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid customer ID" });
      }

      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validation = insertCustomerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid customer data", details: validation.error.errors });
      }

      const customer = await storage.createCustomer(validation.data);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid customer ID" });
      }

      const validation = insertCustomerSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid customer data", details: validation.error.errors });
      }

      const customer = await storage.updateCustomer(id, validation.data);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid customer ID" });
      }

      const deleted = await storage.deleteCustomer(id);
      if (!deleted) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // High-performance data management API endpoints for large datasets
  app.post("/api/data-management/:table", requireAuth, async (req, res) => {
    try {
      const { table } = req.params;
      const validTables = ['plants', 'resources', 'capabilities', 'production_orders', 'vendors', 'customers', 'stock_items'];
      
      if (!validTables.includes(table)) {
        return res.status(400).json({ error: `Invalid table: ${table}` });
      }
      
      const request = req.body;
      let response;
      
      // Route to appropriate method based on table name
      switch (table) {
        case 'plants':
          response = await storage.getPlantsWithPagination(request);
          break;
        case 'resources':
          response = await storage.getResourcesWithPagination(request);
          break;
        case 'capabilities':
          response = await storage.getCapabilitiesWithPagination(request);
          break;
        case 'production_orders':
          response = await storage.getProductionOrdersWithPagination(request);
          break;
        case 'vendors':
          response = await storage.getVendorsWithPagination(request);
          break;
        case 'customers':
          response = await storage.getCustomersWithPagination(request);
          break;
        case 'stock_items':
          response = await storage.getStockItemsWithPagination(request);
          break;
        default:
          return res.status(400).json({ error: `Unsupported table: ${table}` });
      }
      
      res.json(response);
    } catch (error) {
      console.error(`Error fetching paginated data for ${req.params.table}:`, error);
      res.status(500).json({ error: "Failed to fetch data" });
    }
  });

  app.put("/api/data-management/:table/bulk-update", requireAuth, async (req, res) => {
    try {
      const { table } = req.params;
      const validTables = ['plants', 'resources', 'capabilities', 'production_orders', 'vendors', 'customers', 'stock_items'];
      
      if (!validTables.includes(table)) {
        return res.status(400).json({ error: `Invalid table: ${table}` });
      }
      
      const updateRequest = req.body;
      
      if (!Array.isArray(updateRequest.updates) || updateRequest.updates.length === 0) {
        return res.status(400).json({ error: "Updates array is required and cannot be empty" });
      }
      
      const result = await storage.bulkUpdateRecords(table, updateRequest);
      res.json(result);
    } catch (error) {
      console.error(`Error bulk updating ${req.params.table}:`, error);
      res.status(500).json({ error: "Failed to bulk update records" });
    }
  });

  app.delete("/api/data-management/:table/bulk-delete", requireAuth, async (req, res) => {
    try {
      const { table } = req.params;
      const validTables = ['plants', 'resources', 'capabilities', 'production_orders', 'vendors', 'customers', 'stock_items'];
      
      if (!validTables.includes(table)) {
        return res.status(400).json({ error: `Invalid table: ${table}` });
      }
      
      const deleteRequest = req.body;
      
      if (!Array.isArray(deleteRequest.ids) || deleteRequest.ids.length === 0) {
        return res.status(400).json({ error: "IDs array is required and cannot be empty" });
      }
      
      const result = await storage.bulkDeleteRecords(table, deleteRequest);
      res.json(result);
    } catch (error) {
      console.error(`Error bulk deleting ${req.params.table}:`, error);
      res.status(500).json({ error: "Failed to bulk delete records" });
    }
  });

  // Generic search endpoint with autocomplete support
  app.get("/api/data-management/:table/search", requireAuth, async (req, res) => {
    try {
      const { table } = req.params;
      const { q, fields, limit = 10 } = req.query;
      
      const validTables = ['plants', 'resources', 'capabilities', 'production_orders', 'vendors', 'customers', 'stock_items'];
      
      if (!validTables.includes(table)) {
        return res.status(400).json({ error: `Invalid table: ${table}` });
      }
      
      if (!q || !fields) {
        return res.status(400).json({ error: "Query (q) and fields parameters are required" });
      }
      
      const searchFields = (fields as string).split(',');
      const limitNum = parseInt(limit as string);
      
      const request = {
        pagination: { page: 1, limit: limitNum },
        search: { query: q as string, fields: searchFields }
      };
      
      const response = await storage.getDataWithPagination(table, request);
      res.json(response.data);
    } catch (error) {
      console.error(`Error searching ${req.params.table}:`, error);
      res.status(500).json({ error: "Failed to search data" });
    }
  });

  const httpServer = createServer(app);
  // Add global error handling middleware at the end
  app.use(errorMiddleware);

  return httpServer;
}
