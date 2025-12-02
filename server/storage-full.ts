import { 
  ptPlants, ptResources, ptJobOperations, ptManufacturingOrders,
  users, roles, permissions, userRoles, rolePermissions, companyOnboarding, userPreferences, recentPages,
  // plantResources, resourceViews, customTextLabels, kanbanConfigs, reportConfigs, dashboardConfigs, departments,
  // productionOrders, ptJobs, ptCapabilities, ptMetrics,
  // recipes, PTvendors, customers, salesOrders, formulations, formulationDetails, materialRequirements,
  // bomProductOutputs,
  // scheduleScenarios, scenarioOperations, scenarioEvaluations, scenarioDiscussions,
  // systemUsers, systemHealth, systemEnvironments, systemUpgrades, systemAuditLog, systemSettings,
  // capacityPlanningScenarios, staffingPlans, shiftPlans, equipmentPlans, capacityProjections,
  // businessGoals, goalProgress, goalRisks, goalIssues, goalKpis, goalActions,
  // visualFactoryDisplays,
  // disruptions, disruptionActions, disruptionEscalations,
  // stockItems, stockTransactions, stockBalances, demandForecasts, demandDrivers, demandHistory, stockOptimizationScenarios, optimizationRecommendations,
  // systemIntegrations, integrationJobs, integrationEvents, integrationMappings, integrationTemplates,
  // type Capability, type Resource, type ResourceView, type CustomTextLabel, type KanbanConfig, type ReportConfig, type DashboardConfig, type Department,
  // type PTVendor, type Customer, type SalesOrder, type Formulation, type FormulationDetail, type MaterialRequirement,
  type BomProductOutput,
  type ScheduleScenario, type ScenarioOperation, type ScenarioEvaluation, type ScenarioDiscussion,
  type SystemUser, type SystemHealth, type SystemEnvironment, type SystemUpgrade, type SystemAuditLog, type SystemSettings,
  type CapacityPlanningScenario, type StaffingPlan, type ShiftPlan, type EquipmentPlan, type CapacityProjection,
  type BusinessGoal, type GoalProgress, type GoalRisk, type GoalIssue, type GoalKpi, type GoalAction,
  type User, type Role, type Permission, type UserRole, type RolePermission, type UserWithRoles,
  type Disruption, type DisruptionAction, type DisruptionEscalation,
  type StockItem, type StockTransaction, type StockBalance, type DemandForecast, type DemandDriver, type DemandHistory, type StockOptimizationScenario, type OptimizationRecommendation,
  type SystemIntegration, type IntegrationJob, type IntegrationEvent, type IntegrationMapping, type IntegrationTemplate,
  type Plant, type InsertPlant, type ProductionOrder, type InsertProductionOrder,
  type InsertCapability, type InsertResource,
  type PlantResource, type InsertPlantResource, type PlannedOrder, type InsertPlannedOrder,
  type ResourceRequirement, type InsertResourceRequirement, type ResourceRequirementAssignment, type InsertResourceRequirementAssignment,
  type ProductionVersion, type InsertProductionVersion, type ProductionVersionPhaseFormulationDetail, type InsertProductionVersionPhaseFormulationDetail,
  type ProductionVersionPhaseRecipeProductOutput, type InsertProductionVersionPhaseRecipeProductOutput,
  type MemoryBook, type InsertMemoryBook, type MemoryBookEntry, type InsertMemoryBookEntry,
  type MemoryBookCollaborator, type InsertMemoryBookCollaborator, type MemoryBookEntryHistory, type InsertMemoryBookEntryHistory,
  type MemoryBookUsage, type InsertMemoryBookUsage,
  type InsertResourceView, type InsertCustomTextLabel, type InsertKanbanConfig, type InsertReportConfig, type InsertDashboardConfig,
  type InsertPTVendor, type InsertCustomer, type InsertFormulation, type InsertFormulationDetail, type InsertMaterialRequirement,
  type InsertBomProductOutput,
  type InsertScheduleScenario, type InsertScenarioOperation, type InsertScenarioEvaluation, type InsertScenarioDiscussion,
  type InsertSystemUser, type InsertSystemHealth, type InsertSystemEnvironment, type InsertSystemUpgrade, type InsertSystemAuditLog, type InsertSystemSettings,
  type InsertCapacityPlanningScenario, type InsertStaffingPlan, type InsertShiftPlan, type InsertEquipmentPlan, type InsertCapacityProjection,
  type InsertBusinessGoal, type InsertGoalProgress, type InsertGoalRisk, type InsertGoalIssue, type InsertGoalKpi, type InsertGoalAction,
  type InsertUser, type InsertRole, type InsertPermission, type InsertUserRole, type InsertRolePermission,
  type VisualFactoryDisplay, type InsertVisualFactoryDisplay,
  type InsertDisruption, type InsertDisruptionAction, type InsertDisruptionEscalation,
  type InsertStockItem, type InsertStockTransaction, type InsertStockBalance, type InsertDemandForecast, type InsertDemandDriver, type InsertDemandHistory, type InsertStockOptimizationScenario, type InsertOptimizationRecommendation,
  type InsertSystemIntegration, type InsertIntegrationJob, type InsertIntegrationEvent, type InsertIntegrationMapping, type InsertIntegrationTemplate,
  demoTourParticipants, type DemoTourParticipant, type InsertDemoTourParticipant,
  voiceRecordingsCache, type VoiceRecordingsCache, type InsertVoiceRecordingsCache,
  tours, type Tour, type InsertTour,
  fieldComments, type FieldComment, type InsertFieldComment,
  tourPromptTemplates, tourPromptTemplateUsage, type TourPromptTemplate, type TourPromptTemplateUsage, type InsertTourPromptTemplate, type InsertTourPromptTemplateUsage,
  userPreferences, type UserPreferences, type InsertUserPreferences,
  userResourceAssignments, operationStatusReports, skipReasonTemplates,
  type UserResourceAssignment, type OperationStatusReport, type SkipReasonTemplate,
  chatChannels, chatMembers, chatMessages, chatReactions,
  type ChatChannel, type ChatMember, type ChatMessage, type ChatReaction,
  type InsertChatChannel, type InsertChatMember, type InsertChatMessage, type InsertChatReaction,
  feedback, feedbackComments, feedbackVotes,
  type Feedback, type FeedbackComment, type FeedbackVote,
  type InsertFeedback, type InsertFeedbackComment, type InsertFeedbackVote,
  algorithmFeedback, algorithmFeedbackComments, algorithmFeedbackVotes,
  type AlgorithmFeedback, type AlgorithmFeedbackComment, type AlgorithmFeedbackVote,
  type InsertAlgorithmFeedback, type InsertAlgorithmFeedbackComment, type InsertAlgorithmFeedbackVote,
  workflows, workflowTriggers, workflowActions, workflowActionMappings, workflowExecutions, workflowActionExecutions, workflowMonitoring,
  type Workflow, type WorkflowTrigger, type WorkflowAction, type WorkflowActionMapping, type WorkflowExecution, type WorkflowActionExecution, type WorkflowMonitoring,
  type InsertWorkflow, type InsertWorkflowTrigger, type InsertWorkflowAction, type InsertWorkflowActionMapping, type InsertWorkflowExecution, type InsertWorkflowActionExecution, type InsertWorkflowMonitoring,
  canvasContent, canvasSettings, canvasWidgets,
  type CanvasContent, type CanvasSettings, type CanvasWidget,
  type InsertCanvasContent, type InsertCanvasSettings, type InsertCanvasWidget,
  unifiedWidgets, widgetDeployments,
  type UnifiedWidget, type WidgetDeployment,
  type InsertUnifiedWidget, type InsertWidgetDeployment,
  aiMemories, aiMemoryTags, aiConversationContext,
  type AIMemory, type AIMemoryTag, type AIConversationContext,
  type InsertAIMemory, type InsertAIMemoryTag, type InsertAIConversationContext,
  demandChangeRequests, demandChangeComments, demandChangeApprovals, demandCollaborationSessions,
  type DemandChangeRequest, type DemandChangeComment, type DemandChangeApproval, type DemandCollaborationSession,
  type InsertDemandChangeRequest, type InsertDemandChangeComment, type InsertDemandChangeApproval, type InsertDemandCollaborationSession,
  workspaceDashboards, type WorkspaceDashboard, type InsertWorkspaceDashboard,
  errorLogs, errorReports,
  type ErrorLog, type ErrorReport,
  type InsertErrorLog, type InsertErrorReport,
  presentations, presentationSlides, presentationTourIntegrations, presentationLibrary, presentationAnalytics, presentationAIContent,
  presentationMaterials, presentationContentSuggestions, presentationProjects,
  type Presentation, type PresentationSlide, type PresentationTourIntegration, type PresentationLibrary, type PresentationAnalytics, type PresentationAIContent,
  type PresentationMaterial, type PresentationContentSuggestion, type PresentationProject,
  type InsertPresentation, type InsertPresentationSlide, type InsertPresentationTourIntegration, type InsertPresentationLibrary, type InsertPresentationAnalytics, type InsertPresentationAIContent,
  type InsertPresentationMaterial, type InsertPresentationContentSuggestion, type InsertPresentationProject,
  homeDashboardLayouts,
  // MRP Tables
  mrpRuns, mrpRequirements, mrpActionMessages, mrpPlanningParameters,
  smartKpiMeetings, smartKpiDefinitions, smartKpiTargets, smartKpiActuals, smartKpiImprovements, smartKpiAlerts,
  type SmartKpiMeeting, type SmartKpiDefinition, type SmartKpiTarget, type SmartKpiActual, type SmartKpiImprovement, type SmartKpiAlert,
  type InsertSmartKpiMeeting, type InsertSmartKpiDefinition, type InsertSmartKpiTarget, type InsertSmartKpiActual, type InsertSmartKpiImprovement, type InsertSmartKpiAlert,
  type HomeDashboardLayout, type InsertHomeDashboardLayout,

  // Extension Studio
  extensions, extensionFiles, extensionInstallations, extensionMarketplace, extensionReviews,
  type Extension, type ExtensionFile, type ExtensionInstallation, type ExtensionMarketplace, type ExtensionReview,
  type InsertExtension, type InsertExtensionFile, type InsertExtensionInstallation, type InsertExtensionMarketplace, type InsertExtensionReview,

  // Constraints Management System
  constraintCategories, constraints, constraintViolations, constraintExceptions,
  type ConstraintCategory, type Constraint, type ConstraintViolation, type ConstraintException,
  type InsertConstraintCategory, type InsertConstraint, type InsertConstraintViolation, type InsertConstraintException,

  // TOC Buffer Management System
  bufferDefinitions, bufferConsumption, bufferManagementHistory, bufferPolicies,
  type BufferDefinition, type BufferConsumption, type BufferManagementHistory, type BufferPolicy,
  type InsertBufferDefinition, type InsertBufferConsumption, type InsertBufferManagementHistory, type InsertBufferPolicy,

  productionPlans, productionTargets, resourceAllocations, productionMilestones,
  type ProductionPlan, type ProductionTarget, type ResourceAllocation, type ProductionMilestone,
  type InsertProductionPlan, type InsertProductionTarget, type InsertResourceAllocation, type InsertProductionMilestone,
  optimizationAlgorithms, algorithmTests, algorithmDeployments, extensionData, optimizationScopeConfigs, optimizationRuns, optimizationProfiles, profileUsageHistory,
  type OptimizationAlgorithm, type AlgorithmTest, type AlgorithmDeployment, type ExtensionData, type OptimizationScopeConfig, type OptimizationRun, type OptimizationProfile, type ProfileUsageHistory,
  type InsertOptimizationAlgorithm, type InsertAlgorithmTest, type InsertAlgorithmDeployment, type InsertExtensionData, type InsertOptimizationScopeConfig, type InsertOptimizationRun, type InsertOptimizationProfile, type InsertProfileUsageHistory,
  userSecrets, type UserSecret, type InsertUserSecret,
  industryTemplates, userIndustryTemplates, templateConfigurations,
  type IndustryTemplate, type UserIndustryTemplate, type TemplateConfiguration,
  type InsertIndustryTemplate, type InsertUserIndustryTemplate, type InsertTemplateConfiguration,
  
  // Playbook System
  playbooks, playbookCollaborators, playbookHistory, playbookUsage,
  type Playbook, type PlaybookCollaborator, type PlaybookUsage,
  type InsertPlaybook, type InsertPlaybookCollaborator, type InsertPlaybookUsage,
  
  // Max Chat Messages
  maxChatMessages, type MaxChatMessage, type InsertMaxChatMessage,
  type PtJob, type PtResource, type PtJobOperation, type PtManufacturingOrder, type PtCapability, type PtMetric,
  // Import PT Insert types
  type InsertPtPlant, type InsertPtResource, type InsertPtCapability, type InsertPtManufacturingOrder,
  shiftTemplates, resourceShiftAssignments, holidays, resourceAbsences, shiftScenarios, unplannedDowntime, overtimeShifts, downtimeActions, shiftChangeRequests,
  type ShiftTemplate, type ResourceShiftAssignment, type Holiday, type ResourceAbsence, type ShiftScenario, type UnplannedDowntime, type OvertimeShift, type DowntimeAction, type ShiftChangeRequest,
  type InsertShiftTemplate, type InsertResourceShiftAssignment, type InsertHoliday, type InsertResourceAbsence, type InsertShiftScenario, type InsertUnplannedDowntime, type InsertOvertimeShift, type InsertDowntimeAction, type InsertShiftChangeRequest,
  cockpitLayouts, cockpitWidgets, cockpitAlerts, cockpitTemplates,
  companyOnboarding, onboardingProgress,
  type CompanyOnboarding, type OnboardingProgress,
  type InsertCompanyOnboarding, type InsertOnboardingProgress,
  
  // Labor Planning
  employeeSkills, shiftAssignments, laborCapacityRequirements,
  employeeAvailability, employeePreferences, employeeMachineCertifications,
  
  // Integration Management
  integrations, integrationConnections, integrationSyncJobs, integrationFieldMappings, integrationLogs,
  shiftCapacityGaps,
  type EmployeeSkill, type ShiftAssignment, type LaborCapacityRequirement,
  type EmployeeAvailability, type EmployeePreference, type EmployeeMachineCertification,
  type ShiftCapacityGap,
  type Integration, type IntegrationConnection, type IntegrationSyncJob, type IntegrationFieldMapping, type IntegrationLog,
  type InsertIntegration, type InsertIntegrationConnection, type InsertIntegrationSyncJob, type InsertIntegrationFieldMapping, type InsertIntegrationLog,
  type InsertEmployeeSkill, type InsertShiftAssignment, type InsertLaborCapacityRequirement,
  type InsertEmployeeAvailability, type InsertEmployeePreference, type InsertEmployeeMachineCertification,
  type InsertShiftCapacityGap,
  apiIntegrations, apiMappings, apiTests, apiAuditLogs, apiCredentials,
  type ApiIntegration, type ApiMapping, type ApiTest, type ApiAuditLog, type ApiCredential,
  type InsertApiIntegration, type InsertApiMapping, type InsertApiTest, type InsertApiAuditLog, type InsertApiCredential,
  schedulingHistory, schedulingResults, algorithmPerformance,
  type SchedulingHistory, type SchedulingResult, type AlgorithmPerformance,
  type InsertSchedulingHistory, type InsertSchedulingResult, type InsertAlgorithmPerformance,
  // resourceRequirementBlocks: DELETED - replaced by ptjobresourceblocks
  // type ResourceRequirement, type ResourceRequirementAssignment, // type ResourceRequirementBlock: DELETED (removed as not available)
  alerts, alertComments, alertTemplates, alertTrainingData, alertSubscriptions,
  type Alert, type InsertAlert, type AlertComment, type InsertAlertComment,
  type AlertTemplate, type InsertAlertTemplate, type AlertTrainingData, type InsertAlertTrainingData,
  type AlertSubscription, type InsertAlertSubscription,
  // AI Schedule Recommendations
  userAuthorities, aiScheduleRecommendations, aiRecommendationFeedback,
  type AIScheduleRecommendation, type InsertAIScheduleRecommendation,
  type AIRecommendationFeedback, type InsertAIRecommendationFeedback,
  // type InsertResourceRequirement, type InsertResourceRequirementAssignment, // type InsertResourceRequirementBlock: DELETED (removed as not available)
  strategyDocuments, developmentTasks, testSuites, testCases, architectureComponents,
  type StrategyDocument, type DevelopmentTask, type TestSuite, type TestCase, type ArchitectureComponent,
  type InsertStrategyDocument, type InsertDevelopmentTask, type InsertTestSuite, type InsertTestCase, type InsertArchitectureComponent,
  type CockpitLayout, type CockpitWidget, type CockpitAlert, type CockpitTemplate,
  type InsertCockpitLayout, type InsertCockpitWidget, type InsertCockpitAlert, type InsertCockpitTemplate,
  
  // Master Production Schedule
  masterProductionSchedule, salesForecasts, availableToPromise,
  type MasterProductionSchedule, type SalesForecast, type AvailableToPromise,
  type InsertMasterProductionSchedule, type InsertSalesForecast, type InsertAvailableToPromise,
  
  // MRP Types
  type MrpRun, type MrpRequirement, type MrpActionMessage, type MrpPlanningParameters,
  type InsertMrpRun, type InsertMrpRequirement, type InsertMrpActionMessage, type InsertMrpPlanningParameters,
  
  // Missing table types that are referenced in the interface
  // accountInfo, billingHistory, usageMetrics, integrationDataFlow, integrationExecutionLog, integrationDataMapping, integrationWebhook,
  shiftCoverage, shiftUtilization,
  type AccountInfo, type BillingHistory, type UsageMetrics, type IntegrationDataFlow, type IntegrationExecutionLog, type IntegrationDataMapping, type IntegrationWebhook,
  type ShiftCoverage, type ShiftUtilization, type RecipeEquipment,
  type InsertAccountInfo, type InsertBillingHistory, type InsertUsageMetrics, type InsertIntegrationDataFlow, type InsertIntegrationExecutionLog, type InsertIntegrationDataMapping, type InsertIntegrationWebhook,
  type InsertShiftCoverage, type InsertShiftUtilization, type InsertRecipeEquipment,
  algorithmVersions,
  type AlgorithmVersion,
  type InsertAlgorithmVersion,
  plantAlgorithmDeployments,
  type PlantAlgorithmDeployment,
  type InsertPlantAlgorithmDeployment,
  algorithmApprovalWorkflows,
  type AlgorithmApprovalWorkflow,
  type InsertAlgorithmApprovalWorkflow,
  algorithmUsageLogs,
  type AlgorithmUsageLog,
  type InsertAlgorithmUsageLog,
  implementationProjects,
  type ImplementationProject,
  type InsertImplementationProject,
} from "@shared/schema";

// Import portal schemas
import {
  externalCompanies, externalUsers, portalSessions, portalPermissions, aiOnboardingProgress, portalActivityLog,
  type ExternalCompany, type ExternalUser, type PortalSession, type PortalPermission, type AiOnboardingProgress, type PortalActivityLog,
  type InsertExternalCompany, type InsertExternalUser, type InsertPortalSession, type InsertPortalPermission, type InsertAiOnboardingProgress, type InsertPortalActivityLog
} from "../portal/shared/schema";

// PT Publish types are already imported from @shared/schema above

// Import schedule-related types from schedule-schema
import {
  schedules, scheduleAssignments, scheduleDiscussions, scheduleApprovals, 
  scheduleComparisons, scheduleSnapshots, scheduleSubscriptions,
  type Schedule, type ScheduleAssignment, type ScheduleDiscussion, type ScheduleApproval,
  type ScheduleComparison, type ScheduleSnapshot, type ScheduleSubscription,
  type InsertSchedule, type InsertScheduleAssignment, type InsertScheduleDiscussion,
  type InsertScheduleApproval, type InsertScheduleComparison, type InsertScheduleSnapshot,
  type InsertScheduleSubscription
} from "@shared/schedule-schema";

import { db } from "./db";
import { eq, sql, desc, asc, or, and, count, isNull, isNotNull, lte, gte, gt, lt, like, ilike, ne, not, inArray, notInArray, avg, max, countDistinct } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Legacy Operation interface for backward compatibility - updated to match current schema
export interface Operation {
  id: number;
  name: string; // operationName from schema
  description?: string;
  duration?: number; // standardDuration for backward compatibility
  jobId?: number; // productionOrderId for backward compatibility (from processOperations)
  productionOrderId?: number; // Added for GanttChart compatibility
  order: number; // sequenceNumber 
  status: string;
  assignedResourceId?: number;
  startTime?: Date;
  endTime?: Date;
  // Additional fields from current schema
  routingId: number;
  operationName: string;
  standardDuration: number;
  actualDuration?: number;
  workCenterId?: number;
  priority: number;
  completionPercentage: number;
  qualityCheckRequired: boolean;
  qualityStatus: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Optional fields for backward compatibility
  isBottleneck?: boolean;
  isEarly?: boolean;
  isLate?: boolean;
  timeVarianceHours?: number;
  criticality?: string;
  optimizationNotes?: string;
}

// Legacy InsertOperation interface for backward compatibility - updated to match current schema
export interface InsertOperation {
  routingId: number;
  operationName: string;
  description?: string;
  standardDuration: number;
  status?: string;
  actualDuration?: number;
  startTime?: Date;
  endTime?: Date;
  sequenceNumber?: number;
  workCenterId?: number;
  priority?: number;
  completionPercentage?: number;
  qualityCheckRequired?: boolean;
  qualityStatus?: string;
  notes?: string;
  // Legacy fields for backward compatibility
  name?: string; // maps to operationName
  duration?: number; // maps to standardDuration
  jobId?: number; // For legacy API compatibility
  order?: number; // maps to sequenceNumber
  assignedResourceId?: number;
}

// Legacy DiscreteOperation type for backward compatibility with routes
// These map to PT Job Operations in the PT Publish tables
export type DiscreteOperation = {
  id: number;
  routingId?: number | null;
  productionOrderId?: number | null;
  operationName: string;
  description?: string | null;
  status?: string | null;
  standardDuration?: number | null;
  actualDuration?: number | null;
  startTime?: Date | null;
  endTime?: Date | null;
  sequenceNumber?: number | null;
  workCenterId?: number | null;
  priority?: number | null;
  completionPercentage?: number | null;
  qualityCheckRequired?: boolean | null;
  qualityStatus?: string | null;
  notes?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type InsertDiscreteOperation = Omit<DiscreteOperation, 'id' | 'createdAt' | 'updatedAt'>;

// Legacy ProcessOperation type for backward compatibility with routes
// These also map to PT Job Operations in the PT Publish tables
export type ProcessOperation = {
  id: number;
  recipeId?: number | null;
  productionOrderId?: number | null;
  operationName: string;
  description?: string | null;
  status?: string | null;
  phaseType?: string | null;
  standardDuration?: number | null;
  actualDuration?: number | null;
  targetTemperature?: number | null;
  actualTemperature?: number | null;
  targetPressure?: number | null;
  actualPressure?: number | null;
  targetPh?: number | null;
  actualPh?: number | null;
  agitationSpeed?: number | null;
  flowRate?: number | null;
  equipmentId?: number | null;
  startTime?: Date | null;
  endTime?: Date | null;
  sequenceNumber?: number | null;
  qualityCheckRequired?: boolean | null;
  qualityStatus?: string | null;
  batchSize?: number | null;
  actualYield?: number | null;
  notes?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type InsertProcessOperation = Omit<ProcessOperation, 'id' | 'createdAt' | 'updatedAt'>;

export interface IStorage {
  // Plants
  getPlants(): Promise<Plant[]>;
  getPlant(id: number): Promise<Plant | undefined>;
  createPlant(plant: InsertPlant): Promise<Plant>;
  updatePlant(id: number, plant: Partial<InsertPlant>): Promise<Plant | undefined>;
  deletePlant(id: number): Promise<boolean>;
  
  // Bulk operations
  deleteAllRecords(tableName: string): Promise<boolean>;
  
  // Departments
  getDepartments(): Promise<Department[]>;

  // Capabilities
  getCapabilities(): Promise<Capability[]>;
  getCapabilityByName(name: string): Promise<Capability | undefined>;
  createCapability(capability: InsertCapability): Promise<Capability>;
  addResourceCapability(resourceId: number, capabilityId: number): Promise<void>;
  
  // Resources
  getResources(): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined>;
  deleteResource(id: number): Promise<boolean>;
  
  // Plant Resources (Junction Table)
  getResourcesByPlantId(plantId: number): Promise<Resource[]>;
  getPlantsByResourceId(resourceId: number): Promise<Plant[]>;
  assignResourceToPlant(plantId: number, resourceId: number, isPrimary?: boolean): Promise<PlantResource>;
  removeResourceFromPlant(plantId: number, resourceId: number): Promise<boolean>;
  updatePlantResourceAssignment(plantId: number, resourceId: number, updates: Partial<InsertPlantResource>): Promise<PlantResource | undefined>;
  
  // Jobs (alias for Production Orders for legacy compatibility)
  getJobs(): Promise<ProductionOrder[]>;
  getJob(id: number): Promise<ProductionOrder | undefined>;
  createJob(job: InsertProductionOrder): Promise<ProductionOrder>;
  updateJob(id: number, job: Partial<InsertProductionOrder>): Promise<ProductionOrder | undefined>;
  deleteJob(id: number): Promise<boolean>;
  
  // Production Orders  
  getProductionOrders(): Promise<ProductionOrder[]>;
  getProductionOrder(id: number): Promise<ProductionOrder | undefined>;
  createProductionOrder(order: InsertProductionOrder): Promise<ProductionOrder>;
  updateProductionOrder(id: number, order: Partial<InsertProductionOrder>): Promise<ProductionOrder | undefined>;
  deleteProductionOrder(id: number): Promise<boolean>;
  
  // PT Publish Methods - Full CRUD operations for PT Publish tables
  getPtJobs(): Promise<PtJob[]>;
  getPtJob(jobId: number): Promise<PtJob | undefined>;
  createPtJob(job: Partial<PtJob>): Promise<PtJob>;
  updatePtJob(jobId: number, job: Partial<PtJob>): Promise<PtJob | undefined>;
  deletePtJob(jobId: number): Promise<boolean>;
  
  getPtManufacturingOrders(): Promise<PtManufacturingOrder[]>;
  getPtManufacturingOrder(orderId: number): Promise<PtManufacturingOrder | undefined>;
  createPtManufacturingOrder(order: Partial<PtManufacturingOrder>): Promise<PtManufacturingOrder>;
  updatePtManufacturingOrder(orderId: number, order: Partial<PtManufacturingOrder>): Promise<PtManufacturingOrder | undefined>;
  deletePtManufacturingOrder(orderId: number): Promise<boolean>;
  
  getPtJobOperations(): Promise<PtJobOperation[]>;
  getPtJobOperation(operationId: number): Promise<PtJobOperation | undefined>;
  createPtJobOperation(operation: Partial<PtJobOperation>): Promise<PtJobOperation>;
  updatePtJobOperation(operationId: number, operation: Partial<PtJobOperation>): Promise<PtJobOperation | undefined>;
  deletePtJobOperation(operationId: number): Promise<boolean>;
  
  getPtResources(): Promise<PtResource[]>;
  getPtResource(resourceId: number): Promise<PtResource | undefined>;
  createPtResource(resource: Partial<PtResource>): Promise<PtResource>;
  updatePtResource(resourceId: number, resource: Partial<PtResource>): Promise<PtResource | undefined>;
  deletePtResource(resourceId: number): Promise<boolean>;
  
  // PT Job Activities removed - not defined in schema
  
  // Planned Orders
  getPlannedOrders(): Promise<PlannedOrder[]>;
  getPlannedOrder(id: number): Promise<PlannedOrder | undefined>;
  createPlannedOrder(order: InsertPlannedOrder): Promise<PlannedOrder>;
  updatePlannedOrder(id: number, order: Partial<InsertPlannedOrder>): Promise<PlannedOrder | undefined>;
  deletePlannedOrder(id: number): Promise<boolean>;
  
  // Operations
  getOperations(): Promise<Operation[]>;
  getOperationsByProductionOrderId(productionOrderId: number): Promise<Operation[]>;
  getOperation(id: number): Promise<Operation | undefined>;
  createOperation(operation: InsertOperation): Promise<Operation>;
  updateOperation(id: number, operation: Partial<InsertOperation>): Promise<Operation | undefined>;
  deleteOperation(id: number): Promise<boolean>;
  rescheduleOperation(id: number, params: { resourceId: string; startDate: Date; endDate?: Date }): Promise<any>;

  // Discrete Operations (removed - using PT Publish tables)
  // Optimization flags
  updateOperationOptimizationFlags(id: number, flags: {
    isBottleneck?: boolean;
    isEarly?: boolean;
    isLate?: boolean;
    timeVarianceHours?: number;
    criticality?: string;
    optimizationNotes?: string;
  }): Promise<Operation | undefined>;
  
  // Dependencies - removed as we're using PT tables now
  // getDependencies(): Promise<Dependency[]>;
  // getDependenciesByOperationId(operationId: number): Promise<Dependency[]>;
  // createDependency(dependency: InsertDependency): Promise<Dependency>;
  // deleteDependency(id: number): Promise<boolean>;
  
  // Resource Requirements
  getResourceRequirements(): Promise<ResourceRequirement[]>;
  getResourceRequirementsByOperationId(operationId: number): Promise<ResourceRequirement[]>;
  getResourceRequirement(id: number): Promise<ResourceRequirement | undefined>;
  createResourceRequirement(requirement: InsertResourceRequirement): Promise<ResourceRequirement>;
  updateResourceRequirement(id: number, requirement: Partial<InsertResourceRequirement>): Promise<ResourceRequirement | undefined>;
  deleteResourceRequirement(id: number): Promise<boolean>;
  
  // Resource Requirement Assignments
  getResourceRequirementAssignments(): Promise<ResourceRequirementAssignment[]>;
  getResourceRequirementAssignmentsByRequirementId(requirementId: number): Promise<ResourceRequirementAssignment[]>;
  getResourceRequirementAssignmentsByResourceId(resourceId: number): Promise<ResourceRequirementAssignment[]>;
  getResourceRequirementAssignment(id: number): Promise<ResourceRequirementAssignment | undefined>;
  createResourceRequirementAssignment(assignment: InsertResourceRequirementAssignment): Promise<ResourceRequirementAssignment>;
  updateResourceRequirementAssignment(id: number, assignment: Partial<InsertResourceRequirementAssignment>): Promise<ResourceRequirementAssignment | undefined>;
  deleteResourceRequirementAssignment(id: number): Promise<boolean>;
  
  // Resource Views
  getResourceViews(): Promise<ResourceView[]>;
  getResourceView(id: number): Promise<ResourceView | undefined>;
  createResourceView(resourceView: InsertResourceView): Promise<ResourceView>;
  updateResourceView(id: number, resourceView: Partial<InsertResourceView>): Promise<ResourceView | undefined>;
  deleteResourceView(id: number): Promise<boolean>;
  getDefaultResourceView(): Promise<ResourceView | undefined>;
  setDefaultResourceView(id: number): Promise<void>;
  
  // Custom Text Labels
  getCustomTextLabels(): Promise<CustomTextLabel[]>;
  getCustomTextLabel(id: number): Promise<CustomTextLabel | undefined>;
  createCustomTextLabel(customTextLabel: InsertCustomTextLabel): Promise<CustomTextLabel>;
  updateCustomTextLabel(id: number, customTextLabel: Partial<InsertCustomTextLabel>): Promise<CustomTextLabel | undefined>;
  deleteCustomTextLabel(id: number): Promise<boolean>;
  
  // Kanban Configurations
  getKanbanConfigs(): Promise<KanbanConfig[]>;
  getKanbanConfig(id: number): Promise<KanbanConfig | undefined>;
  createKanbanConfig(kanbanConfig: InsertKanbanConfig): Promise<KanbanConfig>;
  updateKanbanConfig(id: number, kanbanConfig: Partial<InsertKanbanConfig>): Promise<KanbanConfig | undefined>;
  deleteKanbanConfig(id: number): Promise<boolean>;
  getDefaultKanbanConfig(): Promise<KanbanConfig | undefined>;
  setDefaultKanbanConfig(id: number): Promise<void>;
  
  // Report Configurations
  getReportConfigs(): Promise<ReportConfig[]>;
  getReportConfig(id: number): Promise<ReportConfig | undefined>;
  createReportConfig(reportConfig: InsertReportConfig): Promise<ReportConfig>;
  updateReportConfig(id: number, reportConfig: Partial<InsertReportConfig>): Promise<ReportConfig | undefined>;
  deleteReportConfig(id: number): Promise<boolean>;
  getDefaultReportConfig(): Promise<ReportConfig | undefined>;
  setDefaultReportConfig(id: number): Promise<void>;
  
  // Dashboard Configurations
  getDashboardConfigs(): Promise<DashboardConfig[]>;
  getDashboardConfig(id: number): Promise<DashboardConfig | undefined>;
  createDashboardConfig(dashboardConfig: InsertDashboardConfig): Promise<DashboardConfig>;
  updateDashboardConfig(id: number, dashboardConfig: Partial<InsertDashboardConfig>): Promise<DashboardConfig | undefined>;
  deleteDashboardConfig(id: number): Promise<boolean>;
  getDefaultDashboardConfig(): Promise<DashboardConfig | undefined>;
  setDefaultDashboardConfig(id: number): Promise<void>;

  // Schedule Scenarios
  getScheduleScenarios(): Promise<ScheduleScenario[]>;
  getScheduleScenario(id: number): Promise<ScheduleScenario | undefined>;
  createScheduleScenario(scenario: InsertScheduleScenario): Promise<ScheduleScenario>;
  updateScheduleScenario(id: number, scenario: Partial<InsertScheduleScenario>): Promise<ScheduleScenario | undefined>;
  deleteScheduleScenario(id: number): Promise<boolean>;

  // Scenario Operations
  getScenarioOperations(scenarioId: number): Promise<ScenarioOperation[]>;
  createScenarioOperation(operation: InsertScenarioOperation): Promise<ScenarioOperation>;
  updateScenarioOperation(id: number, operation: Partial<InsertScenarioOperation>): Promise<ScenarioOperation | undefined>;
  deleteScenarioOperation(id: number): Promise<boolean>;
  deleteScenarioOperationsByScenario(scenarioId: number): Promise<boolean>;

  // Scenario Evaluations
  getScenarioEvaluations(scenarioId: number): Promise<ScenarioEvaluation[]>;
  createScenarioEvaluation(evaluation: InsertScenarioEvaluation): Promise<ScenarioEvaluation>;
  updateScenarioEvaluation(id: number, evaluation: Partial<InsertScenarioEvaluation>): Promise<ScenarioEvaluation | undefined>;
  deleteScenarioEvaluation(id: number): Promise<boolean>;

  // Scenario Discussions
  getScenarioDiscussions(scenarioId: number): Promise<ScenarioDiscussion[]>;
  createScenarioDiscussion(discussion: InsertScenarioDiscussion): Promise<ScenarioDiscussion>;
  updateScenarioDiscussion(id: number, discussion: Partial<InsertScenarioDiscussion>): Promise<ScenarioDiscussion | undefined>;
  deleteScenarioDiscussion(id: number): Promise<boolean>;

  // System Users
  getSystemUsers(): Promise<SystemUser[]>;
  getSystemUser(id: number): Promise<SystemUser | undefined>;
  getSystemUserByUsername(username: string): Promise<SystemUser | undefined>;
  createSystemUser(user: InsertSystemUser): Promise<SystemUser>;
  updateSystemUser(id: number, user: Partial<InsertSystemUser>): Promise<SystemUser | undefined>;
  deleteSystemUser(id: number): Promise<boolean>;

  // System Health
  getSystemHealth(environment?: string): Promise<SystemHealth[]>;
  getSystemHealthByMetric(metricName: string, environment?: string): Promise<SystemHealth[]>;
  createSystemHealth(health: InsertSystemHealth): Promise<SystemHealth>;
  deleteSystemHealth(id: number): Promise<boolean>;

  // System Environments
  getSystemEnvironments(): Promise<SystemEnvironment[]>;
  getSystemEnvironment(id: number): Promise<SystemEnvironment | undefined>;
  getSystemEnvironmentByName(name: string): Promise<SystemEnvironment | undefined>;
  createSystemEnvironment(environment: InsertSystemEnvironment): Promise<SystemEnvironment>;
  updateSystemEnvironment(id: number, environment: Partial<InsertSystemEnvironment>): Promise<SystemEnvironment | undefined>;
  deleteSystemEnvironment(id: number): Promise<boolean>;

  // System Upgrades
  getSystemUpgrades(environment?: string): Promise<SystemUpgrade[]>;
  getSystemUpgrade(id: number): Promise<SystemUpgrade | undefined>;
  createSystemUpgrade(upgrade: InsertSystemUpgrade): Promise<SystemUpgrade>;
  updateSystemUpgrade(id: number, upgrade: Partial<InsertSystemUpgrade>): Promise<SystemUpgrade | undefined>;
  deleteSystemUpgrade(id: number): Promise<boolean>;

  // System Audit Log
  getSystemAuditLog(userId?: number, resource?: string): Promise<SystemAuditLog[]>;
  createSystemAuditLog(auditLog: InsertSystemAuditLog): Promise<SystemAuditLog>;
  deleteSystemAuditLog(id: number): Promise<boolean>;

  // System Settings
  getSystemSettings(environment?: string, category?: string): Promise<SystemSettings[]>;
  getSystemSetting(key: string, environment: string): Promise<SystemSettings | undefined>;
  createSystemSetting(setting: InsertSystemSettings): Promise<SystemSettings>;
  updateSystemSetting(id: number, setting: Partial<InsertSystemSettings>): Promise<SystemSettings | undefined>;
  deleteSystemSetting(id: number): Promise<boolean>;

  // Capacity Planning Scenarios
  getCapacityPlanningScenarios(): Promise<CapacityPlanningScenario[]>;
  getCapacityPlanningScenario(id: number): Promise<CapacityPlanningScenario | undefined>;
  createCapacityPlanningScenario(scenario: InsertCapacityPlanningScenario): Promise<CapacityPlanningScenario>;
  updateCapacityPlanningScenario(id: number, scenario: Partial<InsertCapacityPlanningScenario>): Promise<CapacityPlanningScenario | undefined>;
  deleteCapacityPlanningScenario(id: number): Promise<boolean>;

  // Staffing Plans
  getStaffingPlans(scenarioId?: number): Promise<StaffingPlan[]>;
  getStaffingPlan(id: number): Promise<StaffingPlan | undefined>;
  createStaffingPlan(plan: InsertStaffingPlan): Promise<StaffingPlan>;
  updateStaffingPlan(id: number, plan: Partial<InsertStaffingPlan>): Promise<StaffingPlan | undefined>;
  deleteStaffingPlan(id: number): Promise<boolean>;

  // Shift Plans
  getShiftPlans(scenarioId?: number): Promise<ShiftPlan[]>;
  getShiftPlan(id: number): Promise<ShiftPlan | undefined>;
  createShiftPlan(plan: InsertShiftPlan): Promise<ShiftPlan>;
  updateShiftPlan(id: number, plan: Partial<InsertShiftPlan>): Promise<ShiftPlan | undefined>;
  deleteShiftPlan(id: number): Promise<boolean>;

  // Equipment Plans
  getEquipmentPlans(scenarioId?: number): Promise<EquipmentPlan[]>;
  getEquipmentPlan(id: number): Promise<EquipmentPlan | undefined>;
  createEquipmentPlan(plan: InsertEquipmentPlan): Promise<EquipmentPlan>;
  updateEquipmentPlan(id: number, plan: Partial<InsertEquipmentPlan>): Promise<EquipmentPlan | undefined>;
  deleteEquipmentPlan(id: number): Promise<boolean>;

  // Capacity Projections
  getCapacityProjections(scenarioId?: number): Promise<CapacityProjection[]>;
  getCapacityProjection(id: number): Promise<CapacityProjection | undefined>;
  createCapacityProjection(projection: InsertCapacityProjection): Promise<CapacityProjection>;
  updateCapacityProjection(id: number, projection: Partial<InsertCapacityProjection>): Promise<CapacityProjection | undefined>;
  deleteCapacityProjection(id: number): Promise<boolean>;

  // Business Goals
  getBusinessGoals(): Promise<BusinessGoal[]>;
  getBusinessGoal(id: number): Promise<BusinessGoal | undefined>;
  createBusinessGoal(goal: InsertBusinessGoal): Promise<BusinessGoal>;
  updateBusinessGoal(id: number, goal: Partial<InsertBusinessGoal>): Promise<BusinessGoal | undefined>;
  deleteBusinessGoal(id: number): Promise<boolean>;

  // Goal Progress
  getGoalProgress(goalId?: number): Promise<GoalProgress[]>;
  getGoalProgressById(id: number): Promise<GoalProgress | undefined>;
  createGoalProgress(progress: InsertGoalProgress): Promise<GoalProgress>;
  updateGoalProgress(id: number, progress: Partial<InsertGoalProgress>): Promise<GoalProgress | undefined>;
  deleteGoalProgress(id: number): Promise<boolean>;

  // Goal Risks
  getGoalRisks(goalId?: number): Promise<GoalRisk[]>;
  getGoalRisk(id: number): Promise<GoalRisk | undefined>;
  createGoalRisk(risk: InsertGoalRisk): Promise<GoalRisk>;
  updateGoalRisk(id: number, risk: Partial<InsertGoalRisk>): Promise<GoalRisk | undefined>;
  deleteGoalRisk(id: number): Promise<boolean>;

  // Goal Issues
  getGoalIssues(goalId?: number): Promise<GoalIssue[]>;
  getGoalIssue(id: number): Promise<GoalIssue | undefined>;
  createGoalIssue(issue: InsertGoalIssue): Promise<GoalIssue>;
  updateGoalIssue(id: number, issue: Partial<InsertGoalIssue>): Promise<GoalIssue | undefined>;
  deleteGoalIssue(id: number): Promise<boolean>;

  // Goal KPIs
  getGoalKpis(goalId?: number): Promise<GoalKpi[]>;
  getGoalKpi(id: number): Promise<GoalKpi | undefined>;
  createGoalKpi(kpi: InsertGoalKpi): Promise<GoalKpi>;
  
  // Max Chat Messages
  getMaxChatMessages(userId: number): Promise<MaxChatMessage[]>;
  createMaxChatMessage(message: InsertMaxChatMessage): Promise<MaxChatMessage>;
  deleteMaxChatMessages(userId: number): Promise<boolean>;
  updateGoalKpi(id: number, kpi: Partial<InsertGoalKpi>): Promise<GoalKpi | undefined>;
  deleteGoalKpi(id: number): Promise<boolean>;

  // Goal Actions
  getGoalActions(goalId?: number): Promise<GoalAction[]>;
  getGoalAction(id: number): Promise<GoalAction | undefined>;
  createGoalAction(action: InsertGoalAction): Promise<GoalAction>;
  updateGoalAction(id: number, action: Partial<InsertGoalAction>): Promise<GoalAction | undefined>;
  deleteGoalAction(id: number): Promise<boolean>;

  // Disruption Management
  getDisruptions(): Promise<Disruption[]>;
  getActiveDisruptions(): Promise<Disruption[]>;
  getDisruption(id: number): Promise<Disruption | undefined>;
  createDisruption(disruption: InsertDisruption): Promise<Disruption>;
  updateDisruption(id: number, disruption: Partial<InsertDisruption>): Promise<Disruption | undefined>;
  deleteDisruption(id: number): Promise<boolean>;

  // Disruption Actions
  getDisruptionActions(disruptionId?: number): Promise<DisruptionAction[]>;
  getDisruptionAction(id: number): Promise<DisruptionAction | undefined>;
  createDisruptionAction(action: InsertDisruptionAction): Promise<DisruptionAction>;
  updateDisruptionAction(id: number, action: Partial<InsertDisruptionAction>): Promise<DisruptionAction | undefined>;
  deleteDisruptionAction(id: number): Promise<boolean>;

  // Disruption Escalations
  getDisruptionEscalations(disruptionId?: number): Promise<DisruptionEscalation[]>;
  getDisruptionEscalation(id: number): Promise<DisruptionEscalation | undefined>;
  createDisruptionEscalation(escalation: InsertDisruptionEscalation): Promise<DisruptionEscalation>;
  updateDisruptionEscalation(id: number, escalation: Partial<InsertDisruptionEscalation>): Promise<DisruptionEscalation | undefined>;
  deleteDisruptionEscalation(id: number): Promise<boolean>;

  // User Management
  getUsers(): Promise<User[]>;
  getUsersWithRoles(): Promise<UserWithRoles[]>;
  searchUsers(searchTerm: string, limit?: number): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserWithRoles(id: number): Promise<UserWithRoles | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  authenticateUser(username: string, password: string): Promise<UserWithRoles | null>;

  // User Resource Assignments
  getUserResourceAssignments(): Promise<UserResourceAssignment[]>;
  getUserResourceAssignmentsByUserId(userId: number): Promise<UserResourceAssignment[]>;
  getUserResourceAssignmentsByResourceId(resourceId: number): Promise<UserResourceAssignment[]>;
  createUserResourceAssignment(assignment: any): Promise<UserResourceAssignment>;
  updateUserResourceAssignment(id: number, assignment: any): Promise<UserResourceAssignment | undefined>;
  deleteUserResourceAssignment(id: number): Promise<boolean>;

  // Operation Status Reports
  getOperationStatusReports(): Promise<OperationStatusReport[]>;
  getOperationStatusReportsByOperationId(operationId: number): Promise<OperationStatusReport[]>;
  createOperationStatusReport(report: any): Promise<OperationStatusReport>;
  updateOperationStatusReport(id: number, report: any): Promise<OperationStatusReport | undefined>;
  deleteOperationStatusReport(id: number): Promise<boolean>;

  // Skip Reason Templates
  getSkipReasonTemplates(filters?: { category?: string; active?: boolean }): Promise<SkipReasonTemplate[]>;
  createSkipReasonTemplate(template: any): Promise<SkipReasonTemplate>;
  updateSkipReasonTemplate(id: number, template: any): Promise<SkipReasonTemplate | undefined>;
  deleteSkipReasonTemplate(id: number): Promise<boolean>;

  // Role Management
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  getRoleById(id: number): Promise<Role | null>;
  getRoleByName(name: string): Promise<Role | undefined>;
  getRolesByIds(roleIds: number[]): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined>;
  updateRolePermissions(roleId: number, data: { permissions: number[] }): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;

  // Permission Management
  getPermissions(): Promise<Permission[]>;
  getAllPermissions(): Promise<Permission[]>;
  getPermission(id: number): Promise<Permission | undefined>;
  getPermissionsByFeature(feature: string): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission | undefined>;
  deletePermission(id: number): Promise<boolean>;

  // User Role Assignment
  getUserRoles(userId: number): Promise<UserRole[]>;
  assignUserRole(userRole: InsertUserRole): Promise<UserRole>;
  removeUserRole(userId: number, roleId: number): Promise<boolean>;

  // Role Permission Assignment
  getRolePermissions(roleId: number): Promise<Permission[]>;
  assignRolePermission(rolePermission: InsertRolePermission): Promise<RolePermission>;
  removeRolePermission(roleId: number, permissionId: number): Promise<boolean>;

  // Permission Checking
  hasPermission(userId: number, feature: string, action: string): Promise<boolean>;
  getUserPermissions(userId: number): Promise<Permission[]>;
  
  // Authentication Methods
  getUserWithRolesAndPermissions(usernameOrId: string | number): Promise<UserWithRoles | undefined>;
  updateUserLastLogin(userId: number): Promise<void>;

  // Visual Factory Displays
  getVisualFactoryDisplays(): Promise<VisualFactoryDisplay[]>;
  getVisualFactoryDisplay(id: number): Promise<VisualFactoryDisplay | undefined>;
  createVisualFactoryDisplay(display: InsertVisualFactoryDisplay): Promise<VisualFactoryDisplay>;
  updateVisualFactoryDisplay(id: number, display: Partial<InsertVisualFactoryDisplay>): Promise<VisualFactoryDisplay | undefined>;
  deleteVisualFactoryDisplay(id: number): Promise<boolean>;

  // Demo Tour Participants
  getDemoTourParticipants(): Promise<DemoTourParticipant[]>;
  getDemoTourParticipant(id: number): Promise<DemoTourParticipant | undefined>;
  getDemoTourParticipantByEmail(email: string): Promise<DemoTourParticipant | undefined>;
  createDemoTourParticipant(participant: InsertDemoTourParticipant): Promise<DemoTourParticipant>;
  updateDemoTourParticipant(id: number, participant: Partial<InsertDemoTourParticipant>): Promise<DemoTourParticipant | undefined>;
  completeDemoTour(id: number, feedback?: string): Promise<DemoTourParticipant | undefined>;
  addTourStep(participantId: number, step: { stepId: string; stepTitle: string; roleId: string; completedAt: string; duration: number }): Promise<boolean>;

  // Voice Recordings Cache
  getVoiceRecording(textHash: string): Promise<VoiceRecordingsCache | undefined>;
  createVoiceRecording(recording: InsertVoiceRecordingsCache): Promise<VoiceRecordingsCache>;
  saveVoiceRecording(recording: InsertVoiceRecordingsCache): Promise<VoiceRecordingsCache>;
  updateVoiceRecordingUsage(id: number): Promise<void>;

  // AI Memory and Training Management
  getAIMemories(userId: string): Promise<any[]>;
  getAITrainingData(userId: string): Promise<any[]>;
  storeAIMemory(memory: any): Promise<void>;
  updateAITrainingPattern(pattern: any): Promise<void>;
  deleteAIMemory(entryId: string, userId: string): Promise<void>;
  updateAITraining(entryId: string, content: string, userId: string): Promise<void>;
  
  // Tours
  getTours(): Promise<Tour[]>;
  getTour(id: number): Promise<Tour | undefined>;
  getTourByRoleId(roleId: number): Promise<Tour | undefined>;
  createTour(tour: InsertTour): Promise<Tour>;
  updateTour(id: number, tour: Partial<InsertTour>): Promise<Tour | undefined>;
  deleteTour(id: number): Promise<boolean>;
  upsertTour(tour: InsertTour): Promise<Tour>;

  // Tour Prompt Templates
  getTourPromptTemplates(category?: string, userId?: number): Promise<TourPromptTemplate[]>;
  getTourPromptTemplate(id: number): Promise<TourPromptTemplate | undefined>;
  getTourPromptTemplateByName(name: string): Promise<TourPromptTemplate | undefined>;
  createTourPromptTemplate(template: InsertTourPromptTemplate): Promise<TourPromptTemplate>;
  updateTourPromptTemplate(id: number, template: Partial<InsertTourPromptTemplate>): Promise<TourPromptTemplate | undefined>;
  deleteTourPromptTemplate(id: number): Promise<boolean>;
  getBuiltInTourPromptTemplates(): Promise<TourPromptTemplate[]>;
  getPopularTourPromptTemplates(limit?: number): Promise<TourPromptTemplate[]>;
  updateTourPromptTemplateUsage(id: number): Promise<void>;
  rateTourPromptTemplate(id: number, rating: number): Promise<void>;

  // Tour Prompt Template Usage
  getTourPromptTemplateUsage(templateId?: number, userId?: number): Promise<TourPromptTemplateUsage[]>;
  createTourPromptTemplateUsage(usage: InsertTourPromptTemplateUsage): Promise<TourPromptTemplateUsage>;
  getTourPromptTemplateStats(templateId: number): Promise<{
    totalUsage: number;
    averageRating: number;
    lastUsed: Date | null;
    userCount: number;
  }>;

  // Chat System
  // Chat Channels
  getChatChannels(userId: number): Promise<ChatChannel[]>;
  getChatChannel(id: number): Promise<ChatChannel | undefined>;
  createChatChannel(channel: InsertChatChannel): Promise<ChatChannel>;
  updateChatChannel(id: number, channel: Partial<InsertChatChannel>): Promise<ChatChannel | undefined>;
  deleteChatChannel(id: number): Promise<boolean>;
  
  // Chat Members
  getChatMembers(channelId: number): Promise<ChatMember[]>;
  addChatMember(member: InsertChatMember): Promise<ChatMember>;
  removeChatMember(channelId: number, userId: number): Promise<boolean>;
  updateChatMemberRole(channelId: number, userId: number, role: string): Promise<ChatMember | undefined>;
  
  // Chat Messages
  getChatMessages(channelId: number, limit?: number, offset?: number): Promise<ChatMessage[]>;
  getChatMessage(id: number): Promise<ChatMessage | undefined>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  updateChatMessage(id: number, message: Partial<InsertChatMessage>): Promise<ChatMessage | undefined>;
  deleteChatMessage(id: number): Promise<boolean>;
  updateMessageTranslation(messageId: number, targetLanguage: string, translatedText: string): Promise<ChatMessage | undefined>;
  searchMessages(userId: number, query: string, channelId?: number): Promise<ChatMessage[]>;
  
  // Chat Reactions
  getChatReactions(messageId: number): Promise<ChatReaction[]>;
  addChatReaction(reaction: InsertChatReaction): Promise<ChatReaction>;
  removeChatReaction(messageId: number, userId: number, emoji: string): Promise<boolean>;
  
  // Direct Messages
  getOrCreateDirectChannel(user1Id: number, user2Id: number): Promise<ChatChannel>;
  
  // Contextual Chats
  getContextualChannel(contextType: string, contextId: number): Promise<ChatChannel | undefined>;
  createContextualChannel(contextType: string, contextId: number, name: string, createdBy: number): Promise<ChatChannel>;

  // Stock Management
  getStockItems(): Promise<StockItem[]>;
  getStockItem(id: number): Promise<StockItem | undefined>;
  getStockItemBySku(sku: string): Promise<StockItem | undefined>;
  createStockItem(item: InsertStockItem): Promise<StockItem>;
  updateStockItem(id: number, item: Partial<InsertStockItem>): Promise<StockItem | undefined>;
  deleteStockItem(id: number): Promise<boolean>;
  
  getStockTransactions(itemId?: number): Promise<StockTransaction[]>;
  createStockTransaction(transaction: InsertStockTransaction): Promise<StockTransaction>;
  
  getStockBalances(): Promise<StockBalance[]>;
  getStockBalance(itemId: number, location?: string): Promise<StockBalance | undefined>;
  updateStockBalance(itemId: number, location: string, balance: Partial<InsertStockBalance>): Promise<StockBalance | undefined>;
  
  // Demand Forecasting
  getDemandForecasts(stockId?: number): Promise<DemandForecast[]>;
  createDemandForecast(forecast: InsertDemandForecast): Promise<DemandForecast>;
  updateDemandForecast(id: number, forecast: Partial<InsertDemandForecast>): Promise<DemandForecast | undefined>;
  deleteDemandForecast(id: number): Promise<boolean>;
  
  getDemandDrivers(): Promise<DemandDriver[]>;
  createDemandDriver(driver: InsertDemandDriver): Promise<DemandDriver>;
  updateDemandDriver(id: number, driver: Partial<InsertDemandDriver>): Promise<DemandDriver | undefined>;
  deleteDemandDriver(id: number): Promise<boolean>;
  
  getDemandHistory(itemId?: number): Promise<DemandHistory[]>;
  createDemandHistory(history: InsertDemandHistory): Promise<DemandHistory>;
  
  // Stock Optimization
  getStockOptimizationScenarios(): Promise<StockOptimizationScenario[]>;
  getStockOptimizationScenario(id: number): Promise<StockOptimizationScenario | undefined>;
  createStockOptimizationScenario(scenario: InsertStockOptimizationScenario): Promise<StockOptimizationScenario>;
  updateStockOptimizationScenario(id: number, scenario: Partial<InsertStockOptimizationScenario>): Promise<StockOptimizationScenario | undefined>;
  deleteStockOptimizationScenario(id: number): Promise<boolean>;
  
  getOptimizationRecommendations(scenarioId?: number): Promise<OptimizationRecommendation[]>;
  createOptimizationRecommendation(recommendation: InsertOptimizationRecommendation): Promise<OptimizationRecommendation>;
  updateOptimizationRecommendation(id: number, recommendation: Partial<InsertOptimizationRecommendation>): Promise<OptimizationRecommendation | undefined>;
  deleteOptimizationRecommendation(id: number): Promise<boolean>;
  
  // Feedback Management
  getFeedback(): Promise<Feedback[]>;
  getFeedbackItem(id: number): Promise<Feedback | undefined>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedback(id: number, feedback: Partial<InsertFeedback>): Promise<Feedback | undefined>;
  deleteFeedback(id: number): Promise<boolean>;
  
  getFeedbackComments(feedbackId: number): Promise<FeedbackComment[]>;
  createFeedbackComment(comment: InsertFeedbackComment): Promise<FeedbackComment>;
  deleteFeedbackComment(id: number): Promise<boolean>;
  
  getFeedbackVotes(feedbackId: number): Promise<FeedbackVote[]>;
  voteFeedback(vote: InsertFeedbackVote): Promise<FeedbackVote>;
  removeVote(userId: number, feedbackId: number): Promise<boolean>;
  
  getFeedbackStats(): Promise<{
    totalSubmissions: number;
    openItems: number;
    completedItems: number;
    averageResponseTime: number;
    topCategories: { category: string; count: number }[];
    recentActivity: number;
  }>;

  // Canvas Content Management
  getCanvasContent(userId: number, sessionId: string): Promise<CanvasContent[]>;
  addCanvasContent(content: InsertCanvasContent): Promise<CanvasContent>;
  clearCanvasContent(userId: number, sessionId: string): Promise<boolean>;
  deleteCanvasContent(id: number): Promise<boolean>;
  reorderCanvasContent(contentIds: number[]): Promise<boolean>;
  cleanupExpiredCanvasContent(): Promise<boolean>;

  // Canvas Widget Management - for Max AI to display interactive widgets
  getCanvasWidgets(sessionId?: string, userId?: number): Promise<CanvasWidget[]>;
  getCanvasWidget(id: number): Promise<CanvasWidget | undefined>;
  createCanvasWidget(widget: InsertCanvasWidget): Promise<CanvasWidget>;
  updateCanvasWidget(id: number, updates: Partial<InsertCanvasWidget>): Promise<CanvasWidget | undefined>;
  deleteCanvasWidget(id: number): Promise<boolean>;
  clearCanvasWidgets(sessionId?: string, userId?: number): Promise<boolean>;
  hideCanvasWidget(id: number): Promise<boolean>;
  showCanvasWidget(id: number): Promise<boolean>;
  updateWidgetPosition(id: number, position: { x: number; y: number; width: number; height: number }): Promise<boolean>;

  // Analytics Widget Management - for universal widget creation
  createAnalyticsWidget(widget: any): Promise<any>;
  createDashboardWidget(widget: any): Promise<any>;

  // Constraints Management System
  // Constraint Categories
  getConstraintCategories(): Promise<ConstraintCategory[]>;
  getConstraintCategory(id: number): Promise<ConstraintCategory | undefined>;
  createConstraintCategory(category: InsertConstraintCategory): Promise<ConstraintCategory>;
  updateConstraintCategory(id: number, category: Partial<InsertConstraintCategory>): Promise<ConstraintCategory | undefined>;
  deleteConstraintCategory(id: number): Promise<boolean>;

  // Constraints
  getConstraints(categoryId?: number, scope?: string, isActive?: boolean): Promise<Constraint[]>;
  getConstraint(id: number): Promise<Constraint | undefined>;
  getConstraintsByEntity(entityType: string, entityId: number): Promise<Constraint[]>;
  createConstraint(constraint: InsertConstraint): Promise<Constraint>;
  updateConstraint(id: number, constraint: Partial<InsertConstraint>): Promise<Constraint | undefined>;
  deleteConstraint(id: number): Promise<boolean>;
  
  // Constraint Violations
  getConstraintViolations(constraintId?: number, status?: string): Promise<ConstraintViolation[]>;
  getConstraintViolation(id: number): Promise<ConstraintViolation | undefined>;
  getViolationsByEntity(entityType: string, entityId: number): Promise<ConstraintViolation[]>;
  createConstraintViolation(violation: InsertConstraintViolation): Promise<ConstraintViolation>;
  updateConstraintViolation(id: number, violation: Partial<InsertConstraintViolation>): Promise<ConstraintViolation | undefined>;
  resolveConstraintViolation(id: number, resolution: string, resolvedBy: number): Promise<ConstraintViolation | undefined>;
  waiveConstraintViolation(id: number, reason: string, approvedBy: number): Promise<ConstraintViolation | undefined>;
  
  // Constraint Exceptions
  getConstraintExceptions(constraintId?: number, isActive?: boolean): Promise<ConstraintException[]>;
  getConstraintException(id: number): Promise<ConstraintException | undefined>;
  createConstraintException(exception: InsertConstraintException): Promise<ConstraintException>;
  updateConstraintException(id: number, exception: Partial<InsertConstraintException>): Promise<ConstraintException | undefined>;
  deleteConstraintException(id: number): Promise<boolean>;
  
  // Constraint Monitoring and Evaluation
  evaluateConstraints(entityType: string, entityId: number, data: any): Promise<ConstraintViolation[]>;
  getConstraintViolationsSummary(): Promise<{
    total: number;
    critical: number;
    major: number;
    minor: number;
    open: number;
    resolved: number;
  }>;
  
  // TOC Drum Management
  updateResourceDrumStatus(resourceId: number, isDrum: boolean, reason: string, method: 'manual' | 'automated'): Promise<Resource>;
  getDrumAnalysisHistory(): Promise<any[]>;
  runDrumAnalysis(): Promise<{
    analyzed: number;
    identified: number;
    updated: number;
    recommendations: Array<{
      resourceId: number;
      resourceName: string;
      score: number;
      recommendation: string;
    }>;
  }>;
  getDrumResources(): Promise<any[]>;
  designateResourceAsDrum(resourceId: number, drumType: string, reason?: string, userId?: number): Promise<any>;
  
  // TOC Buffer Management
  // Buffer Definitions
  getBufferDefinitions(bufferType?: string, bufferCategory?: string, isActive?: boolean): Promise<BufferDefinition[]>;
  getBufferDefinition(id: number): Promise<BufferDefinition | undefined>;
  getBufferDefinitionsByLocation(entityType: string, entityId: number): Promise<BufferDefinition[]>;
  createBufferDefinition(buffer: InsertBufferDefinition): Promise<BufferDefinition>;
  updateBufferDefinition(id: number, buffer: Partial<InsertBufferDefinition>): Promise<BufferDefinition | undefined>;
  deleteBufferDefinition(id: number): Promise<boolean>;
  
  // Buffer Consumption
  getBufferConsumption(bufferDefinitionId?: number, currentZone?: string): Promise<BufferConsumption[]>;
  getLatestBufferConsumption(bufferDefinitionId: number): Promise<BufferConsumption | undefined>;
  createBufferConsumption(consumption: InsertBufferConsumption): Promise<BufferConsumption>;
  updateBufferConsumption(id: number, consumption: Partial<InsertBufferConsumption>): Promise<BufferConsumption | undefined>;
  updateBufferLevel(bufferDefinitionId: number, newLevel: number, consumingEntity?: { type: string; id: number }): Promise<BufferConsumption>;
  
  // Buffer Management History
  getBufferManagementHistory(bufferDefinitionId?: number, eventType?: string): Promise<BufferManagementHistory[]>;
  createBufferManagementHistory(history: InsertBufferManagementHistory): Promise<BufferManagementHistory>;
  
  // Buffer Policies
  getBufferPolicies(policyType?: string, isActive?: boolean): Promise<BufferPolicy[]>;
  getBufferPolicy(id: number): Promise<BufferPolicy | undefined>;
  createBufferPolicy(policy: InsertBufferPolicy): Promise<BufferPolicy>;
  updateBufferPolicy(id: number, policy: Partial<InsertBufferPolicy>): Promise<BufferPolicy | undefined>;
  deleteBufferPolicy(id: number): Promise<boolean>;
  
  // Buffer Analysis and Monitoring
  analyzeBufferHealth(bufferDefinitionId: number): Promise<{
    currentStatus: string;
    penetrationHistory: Array<{ timestamp: Date; penetration: number }>;
    recommendations: string[];
    projectedExhaustion: Date | null;
  }>;
  getBufferAlerts(): Promise<Array<{
    bufferId: number;
    bufferName: string;
    alertType: string;
    severity: string;
    message: string;
  }>>;
  
  // Canvas Settings Management
  getCanvasSettings(userId: number, sessionId: string): Promise<CanvasSettings | undefined>;
  upsertCanvasSettings(settings: InsertCanvasSettings): Promise<CanvasSettings>;
  updateCanvasSettings(userId: number, sessionId: string, settings: Partial<InsertCanvasSettings>): Promise<CanvasSettings | undefined>;

  // Home Dashboard Layout Management
  getHomeDashboardLayouts(userId: number): Promise<HomeDashboardLayout[]>;
  getHomeDashboardLayout(id: number): Promise<HomeDashboardLayout | undefined>;
  getDefaultHomeDashboardLayout(userId: number): Promise<HomeDashboardLayout | undefined>;
  createHomeDashboardLayout(layout: InsertHomeDashboardLayout): Promise<HomeDashboardLayout>;
  updateHomeDashboardLayout(id: number, layout: Partial<InsertHomeDashboardLayout>): Promise<HomeDashboardLayout | undefined>;
  deleteHomeDashboardLayout(id: number): Promise<boolean>;
  setDefaultHomeDashboardLayout(userId: number, layoutId: number): Promise<boolean>;

  // Workspace Dashboards
  getWorkspaceDashboard(pageIdentifier: string, plantId: number): Promise<WorkspaceDashboard | undefined>;
  getWorkspaceDashboardsByPlant(plantId: number): Promise<WorkspaceDashboard[]>;
  createWorkspaceDashboard(dashboard: InsertWorkspaceDashboard): Promise<WorkspaceDashboard>;
  updateWorkspaceDashboard(id: number, dashboard: Partial<InsertWorkspaceDashboard>): Promise<WorkspaceDashboard | undefined>;
  deleteWorkspaceDashboard(id: number): Promise<boolean>;

  // Master Production Schedule Management
  getMasterProductionSchedules(plantId?: number, itemNumber?: string, timePeriod?: 'daily' | 'weekly' | 'monthly' | 'quarterly', planningHorizon?: number): Promise<MasterProductionSchedule[]>;
  getMasterProductionSchedule(id: number): Promise<MasterProductionSchedule | undefined>;
  createMasterProductionSchedule(mps: InsertMasterProductionSchedule): Promise<MasterProductionSchedule>;
  updateMasterProductionSchedule(id: number, updates: Partial<InsertMasterProductionSchedule>): Promise<MasterProductionSchedule | undefined>;
  deleteMasterProductionSchedule(id: number): Promise<boolean>;
  publishMasterProductionSchedule(id: number, publishedBy: number): Promise<MasterProductionSchedule | undefined>;
  getMasterProductionSchedulesByPlanner(plannerId: number): Promise<MasterProductionSchedule[]>;

  // MRP (Material Requirements Planning) Management - New
  getMrpRuns(): Promise<MrpRun[]>;
  getMrpRun(id: number): Promise<MrpRun | undefined>;
  createMrpRun(run: InsertMrpRun): Promise<MrpRun>;
  updateMrpRun(id: number, updates: Partial<InsertMrpRun>): Promise<MrpRun | undefined>;
  deleteMrpRun(id: number): Promise<boolean>;

  getMrpRequirements(runId: number): Promise<MrpRequirement[]>;
  createMrpRequirement(requirement: InsertMrpRequirement): Promise<MrpRequirement>;

  getMrpActionMessages(runId: number): Promise<MrpActionMessage[]>;
  createMrpActionMessage(message: InsertMrpActionMessage): Promise<MrpActionMessage>;
  updateMrpActionMessage(id: number, updates: Partial<InsertMrpActionMessage>): Promise<MrpActionMessage | undefined>;

  // Master Production Schedule Management for MRP
  getMasterProductionSchedule(): Promise<MasterProductionSchedule[]>;
  createMasterProductionScheduleEntry(entry: InsertMasterProductionSchedule): Promise<MasterProductionSchedule>;
  updateMasterProductionScheduleEntry(id: number, updates: Partial<InsertMasterProductionSchedule>): Promise<MasterProductionSchedule | undefined>;
  deleteMasterProductionScheduleEntry(id: number): Promise<boolean>;

  // Sales Forecasts Management
  getSalesForecasts(plantId?: number, itemNumber?: string, timePeriod?: 'daily' | 'weekly' | 'monthly' | 'quarterly'): Promise<SalesForecast[]>;
  getSalesForecast(id: number): Promise<SalesForecast | undefined>;
  createSalesForecast(forecast: InsertSalesForecast): Promise<SalesForecast>;
  updateSalesForecast(id: number, updates: Partial<InsertSalesForecast>): Promise<SalesForecast | undefined>;
  deleteSalesForecast(id: number): Promise<boolean>;
  getForecastAccuracy(itemNumber: string, plantId: number, periodMonths?: number): Promise<{ accuracy: number; error: number; }>;

  // Available to Promise Management
  getAvailableToPromise(itemNumber: string, plantId: number): Promise<AvailableToPromise | undefined>;
  calculateAvailableToPromise(itemNumber: string, plantId: number): Promise<AvailableToPromise>;
  updateAvailableToPromise(id: number, updates: Partial<InsertAvailableToPromise>): Promise<AvailableToPromise | undefined>;

  // Error Logging and Monitoring
  logError(errorData: InsertErrorLog): Promise<ErrorLog>;
  getErrorLogs(limit?: number, resolved?: boolean): Promise<ErrorLog[]>;
  getErrorLog(errorId: string): Promise<ErrorLog | undefined>;
  markErrorResolved(errorId: string): Promise<boolean>;
  
  createErrorReport(report: InsertErrorReport): Promise<ErrorReport>;
  getErrorReports(status?: string): Promise<ErrorReport[]>;
  updateErrorReport(id: number, updates: Partial<InsertErrorReport>): Promise<ErrorReport | undefined>;
  
  getSystemHealth(): Promise<SystemHealth[]>;
  logSystemHealth(healthData: InsertSystemHealth): Promise<SystemHealth>;

  // External Portal Methods
  // Company Management
  getExternalCompanies(type?: string): Promise<ExternalCompany[]>;
  getExternalCompany(id: string): Promise<ExternalCompany | undefined>;
  getExternalCompanyByErpLink(erpLinkId: string): Promise<ExternalCompany | undefined>;
  createExternalCompany(company: InsertExternalCompany): Promise<ExternalCompany>;
  updateExternalCompany(id: string, updates: Partial<InsertExternalCompany>): Promise<ExternalCompany | undefined>;
  deleteExternalCompany(id: string): Promise<boolean>;
  
  // External User Management
  getExternalUsers(companyId?: string): Promise<ExternalUser[]>;
  getExternalUser(id: string): Promise<ExternalUser | undefined>;
  getExternalUserByEmail(email: string): Promise<ExternalUser | undefined>;
  createExternalUser(user: Omit<InsertExternalUser, 'confirmPassword'> & { password: string }): Promise<ExternalUser>;
  updateExternalUser(id: string, updates: Partial<InsertExternalUser>): Promise<ExternalUser | undefined>;
  deleteExternalUser(id: string): Promise<boolean>;
  authenticateExternalUser(email: string, password: string): Promise<ExternalUser | null>;
  
  // Portal Session Management
  createPortalSession(session: InsertPortalSession): Promise<PortalSession>;
  getPortalSession(token: string): Promise<PortalSession | undefined>;
  getPortalSessionsByUser(userId: string): Promise<PortalSession[]>;
  updatePortalSession(id: string, updates: Partial<InsertPortalSession>): Promise<PortalSession | undefined>;
  deletePortalSession(token: string): Promise<boolean>;
  cleanupExpiredPortalSessions(): Promise<number>;
  
  // Portal Permissions Management
  getPortalPermissions(userId?: string, companyId?: string): Promise<PortalPermission[]>;
  getPortalPermission(id: string): Promise<PortalPermission | undefined>;
  createPortalPermission(permission: InsertPortalPermission): Promise<PortalPermission>;
  updatePortalPermission(id: string, updates: Partial<InsertPortalPermission>): Promise<PortalPermission | undefined>;
  deletePortalPermission(id: string): Promise<boolean>;
  
  // Portal Data Access Methods
  getPurchaseOrdersByCompany(companyId: string): Promise<any[]>;
  getDeliveriesByCompany(companyId: string): Promise<any[]>;
  getInventoryByCompany(companyId: string): Promise<any[]>;
  checkPortalPermission(userId: string, resourceType: string, action: string): Promise<boolean>;
  
  // Integration Management
  getIntegrations(category?: string, status?: string): Promise<Integration[]>;
  getIntegration(id: number): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: number, updates: Partial<InsertIntegration>): Promise<Integration | undefined>;
  deleteIntegration(id: number): Promise<boolean>;
  
  // Integration Connections
  getIntegrationConnections(plantId?: number, integrationId?: number): Promise<IntegrationConnection[]>;
  getIntegrationConnection(id: number): Promise<IntegrationConnection | undefined>;
  createIntegrationConnection(connection: InsertIntegrationConnection): Promise<IntegrationConnection>;
  updateIntegrationConnection(id: number, updates: Partial<InsertIntegrationConnection>): Promise<IntegrationConnection | undefined>;
  deleteIntegrationConnection(id: number): Promise<boolean>;
  testIntegrationConnection(id: number): Promise<{ success: boolean; message?: string }>;
  
  // Integration Sync Jobs
  getIntegrationSyncJobs(connectionId?: number, status?: string): Promise<IntegrationSyncJob[]>;
  getIntegrationSyncJob(id: number): Promise<IntegrationSyncJob | undefined>;
  createIntegrationSyncJob(job: InsertIntegrationSyncJob): Promise<IntegrationSyncJob>;
  updateIntegrationSyncJob(id: number, updates: Partial<InsertIntegrationSyncJob>): Promise<IntegrationSyncJob | undefined>;
  runIntegrationSync(connectionId: number, entityType?: string): Promise<IntegrationSyncJob>;
  
  // Integration Field Mappings
  getIntegrationFieldMappings(connectionId: number, entityType?: string): Promise<IntegrationFieldMapping[]>;
  createIntegrationFieldMapping(mapping: InsertIntegrationFieldMapping): Promise<IntegrationFieldMapping>;
  updateIntegrationFieldMapping(id: number, updates: Partial<InsertIntegrationFieldMapping>): Promise<IntegrationFieldMapping | undefined>;
  deleteIntegrationFieldMapping(id: number): Promise<boolean>;
  
  // Integration Logs
  getIntegrationLogs(connectionId?: number, syncJobId?: number, logLevel?: string): Promise<IntegrationLog[]>;
  createIntegrationLog(log: InsertIntegrationLog): Promise<IntegrationLog>;
  
  // AI Onboarding Progress
  getAiOnboardingProgress(userId?: string, companyId?: string): Promise<AiOnboardingProgress[]>;
  getAiOnboardingProgressById(id: string): Promise<AiOnboardingProgress | undefined>;
  createAiOnboardingProgress(progress: InsertAiOnboardingProgress): Promise<AiOnboardingProgress>;
  updateAiOnboardingProgress(id: string, updates: Partial<InsertAiOnboardingProgress>): Promise<AiOnboardingProgress | undefined>;
  
  // Portal Activity Logging
  logPortalActivity(activity: InsertPortalActivityLog): Promise<PortalActivityLog>;
  getPortalActivityLogs(filters?: { userId?: string; companyId?: string; action?: string; limit?: number }): Promise<PortalActivityLog[]>;

  // Smart KPI Management System
  // Smart KPI Meetings
  getSmartKpiMeetings(organizerId?: number, meetingType?: string): Promise<SmartKpiMeeting[]>;
  getSmartKpiMeeting(id: number): Promise<SmartKpiMeeting | undefined>;
  createSmartKpiMeeting(meeting: InsertSmartKpiMeeting): Promise<SmartKpiMeeting>;
  updateSmartKpiMeeting(id: number, meeting: Partial<InsertSmartKpiMeeting>): Promise<SmartKpiMeeting | undefined>;
  deleteSmartKpiMeeting(id: number): Promise<boolean>;
  
  // Smart KPI Definitions
  getSmartKpiDefinitions(category?: string, businessStrategy?: string, isActive?: boolean): Promise<SmartKpiDefinition[]>;
  getSmartKpiDefinition(id: number): Promise<SmartKpiDefinition | undefined>;
  createSmartKpiDefinition(definition: InsertSmartKpiDefinition): Promise<SmartKpiDefinition>;
  updateSmartKpiDefinition(id: number, definition: Partial<InsertSmartKpiDefinition>): Promise<SmartKpiDefinition | undefined>;
  deleteSmartKpiDefinition(id: number): Promise<boolean>;
  
  // Smart KPI Targets
  getSmartKpiTargets(kpiDefinitionId?: number, targetPeriod?: string, status?: string): Promise<SmartKpiTarget[]>;
  getSmartKpiTarget(id: number): Promise<SmartKpiTarget | undefined>;
  createSmartKpiTarget(target: InsertSmartKpiTarget): Promise<SmartKpiTarget>;
  updateSmartKpiTarget(id: number, target: Partial<InsertSmartKpiTarget>): Promise<SmartKpiTarget | undefined>;
  deleteSmartKpiTarget(id: number): Promise<boolean>;
  
  // Smart KPI Actuals
  getSmartKpiActuals(kpiDefinitionId?: number, startDate?: Date, endDate?: Date): Promise<SmartKpiActual[]>;
  getSmartKpiActual(id: number): Promise<SmartKpiActual | undefined>;
  createSmartKpiActual(actual: InsertSmartKpiActual): Promise<SmartKpiActual>;
  updateSmartKpiActual(id: number, actual: Partial<InsertSmartKpiActual>): Promise<SmartKpiActual | undefined>;
  deleteSmartKpiActual(id: number): Promise<boolean>;
  validateSmartKpiActual(id: number, validatedBy: number): Promise<SmartKpiActual | undefined>;
  
  // Smart KPI Improvements
  getSmartKpiImprovements(kpiDefinitionId?: number, status?: string, priority?: string): Promise<SmartKpiImprovement[]>;
  getSmartKpiImprovement(id: number): Promise<SmartKpiImprovement | undefined>;
  createSmartKpiImprovement(improvement: InsertSmartKpiImprovement): Promise<SmartKpiImprovement>;
  updateSmartKpiImprovement(id: number, improvement: Partial<InsertSmartKpiImprovement>): Promise<SmartKpiImprovement | undefined>;
  deleteSmartKpiImprovement(id: number): Promise<boolean>;
  
  // Smart KPI Alerts
  getSmartKpiAlerts(kpiDefinitionId?: number, severity?: string, status?: string): Promise<SmartKpiAlert[]>;
  getSmartKpiAlert(id: number): Promise<SmartKpiAlert | undefined>;
  createSmartKpiAlert(alert: InsertSmartKpiAlert): Promise<SmartKpiAlert>;
  updateSmartKpiAlert(id: number, alert: Partial<InsertSmartKpiAlert>): Promise<SmartKpiAlert | undefined>;
  acknowledgeSmartKpiAlert(id: number, acknowledgedBy: number): Promise<SmartKpiAlert | undefined>;
  resolveSmartKpiAlert(id: number, resolution: string, resolvedBy: number): Promise<SmartKpiAlert | undefined>;
  
  // Smart KPI Analytics
  getKpiPerformanceAnalysis(kpiDefinitionId: number, timeRange: { start: Date; end: Date }): Promise<{
    currentValue: number;
    targetValue: number;
    performanceGap: number;
    trend: 'improving' | 'declining' | 'stable';
    projectedTarget: boolean;
    recommendations: string[];
  }>;
  
  getKpiDashboardData(userId: number): Promise<{
    activeKpis: number;
    criticalAlerts: number;
    improvementsInProgress: number;
    targetAchievement: number;
    kpisByCategory: Array<{ category: string; count: number; avgPerformance: number }>;
    recentMeetings: SmartKpiMeeting[];
    urgentActions: Array<{ type: string; description: string; dueDate: Date }>;
  }>;

  // Industry Templates Management
  getIndustryTemplates(): Promise<IndustryTemplate[]>;
  getIndustryTemplate(id: number): Promise<IndustryTemplate | undefined>;
  getIndustryTemplatesByCategory(category: string): Promise<IndustryTemplate[]>;
  createIndustryTemplate(template: InsertIndustryTemplate): Promise<IndustryTemplate>;
  updateIndustryTemplate(id: number, template: Partial<InsertIndustryTemplate>): Promise<IndustryTemplate | undefined>;
  deleteIndustryTemplate(id: number): Promise<boolean>;
  
  getUserIndustryTemplates(userId: number): Promise<UserIndustryTemplate[]>;
  getUserActiveTemplate(userId: number): Promise<UserIndustryTemplate | undefined>;
  applyTemplateToUser(userId: number, templateId: number, customizations?: any): Promise<UserIndustryTemplate>;
  removeTemplateFromUser(userId: number, templateId: number): Promise<boolean>;
  updateUserTemplateCustomizations(userId: number, templateId: number, customizations: any): Promise<UserIndustryTemplate | undefined>;
  
  getTemplateConfigurations(templateId?: number): Promise<TemplateConfiguration[]>;
  getTemplateConfigurationsByType(templateId: number, type: string): Promise<TemplateConfiguration[]>;
  createTemplateConfiguration(config: InsertTemplateConfiguration): Promise<TemplateConfiguration>;
  updateTemplateConfiguration(id: number, config: Partial<InsertTemplateConfiguration>): Promise<TemplateConfiguration | undefined>;
  deleteTemplateConfiguration(id: number): Promise<boolean>;

  // Account Management
  getAccountInfo(userId: number): Promise<AccountInfo | undefined>;
  createAccountInfo(account: InsertAccountInfo): Promise<AccountInfo>;
  updateAccountInfo(userId: number, account: Partial<InsertAccountInfo>): Promise<AccountInfo | undefined>;
  
  getBillingHistory(accountId: number): Promise<BillingHistory[]>;
  createBillingHistory(billing: InsertBillingHistory): Promise<BillingHistory>;
  
  getUsageMetrics(accountId: number, metricType?: string): Promise<UsageMetrics[]>;
  createUsageMetric(usage: InsertUsageMetrics): Promise<UsageMetrics>;
  updateUsageMetric(accountId: number, metricType: string, value: number): Promise<UsageMetrics | undefined>;

  // System Integrations Management
  getSystemIntegrations(): Promise<SystemIntegration[]>;
  getSystemIntegration(id: number): Promise<SystemIntegration | undefined>;
  createSystemIntegration(integration: InsertSystemIntegration): Promise<SystemIntegration>;
  updateSystemIntegration(id: number, integration: Partial<InsertSystemIntegration>): Promise<SystemIntegration | undefined>;
  deleteSystemIntegration(id: number): Promise<boolean>;
  testSystemIntegrationConnection(id: number): Promise<{ success: boolean; error?: string }>;
  updateSystemIntegrationHealth(id: number, health: string): Promise<SystemIntegration | undefined>;

  // Integration Data Flows
  getIntegrationDataFlows(integrationId?: number): Promise<IntegrationDataFlow[]>;
  getIntegrationDataFlow(id: number): Promise<IntegrationDataFlow | undefined>;
  createIntegrationDataFlow(dataFlow: InsertIntegrationDataFlow): Promise<IntegrationDataFlow>;
  updateIntegrationDataFlow(id: number, dataFlow: Partial<InsertIntegrationDataFlow>): Promise<IntegrationDataFlow | undefined>;
  deleteIntegrationDataFlow(id: number): Promise<boolean>;
  executeIntegrationDataFlow(id: number): Promise<{ success: boolean; executionId: string; error?: string }>;

  // Integration Execution Logs
  getIntegrationExecutionLogs(dataFlowId?: number): Promise<IntegrationExecutionLog[]>;
  getIntegrationExecutionLog(id: number): Promise<IntegrationExecutionLog | undefined>;
  createIntegrationExecutionLog(log: InsertIntegrationExecutionLog): Promise<IntegrationExecutionLog>;
  updateIntegrationExecutionLog(id: number, log: Partial<InsertIntegrationExecutionLog>): Promise<IntegrationExecutionLog | undefined>;

  // Integration Data Mappings
  getIntegrationDataMappings(dataFlowId: number): Promise<IntegrationDataMapping[]>;
  getIntegrationDataMapping(id: number): Promise<IntegrationDataMapping | undefined>;
  createIntegrationDataMapping(mapping: InsertIntegrationDataMapping): Promise<IntegrationDataMapping>;
  updateIntegrationDataMapping(id: number, mapping: Partial<InsertIntegrationDataMapping>): Promise<IntegrationDataMapping | undefined>;
  deleteIntegrationDataMapping(id: number): Promise<boolean>;

  // Integration Webhooks
  getIntegrationWebhooks(integrationId?: number): Promise<IntegrationWebhook[]>;
  getIntegrationWebhook(id: number): Promise<IntegrationWebhook | undefined>;
  createIntegrationWebhook(webhook: InsertIntegrationWebhook): Promise<IntegrationWebhook>;
  updateIntegrationWebhook(id: number, webhook: Partial<InsertIntegrationWebhook>): Promise<IntegrationWebhook | undefined>;
  deleteIntegrationWebhook(id: number): Promise<boolean>;
  triggerIntegrationWebhook(id: number, payload: any): Promise<{ success: boolean; error?: string }>;

  // Plant Management
  createPlant(plant: InsertPlant): Promise<Plant>;
  getPlants(): Promise<Plant[]>;
  getPlantById(id: number): Promise<Plant | null>;
  updatePlant(id: number, updates: Partial<InsertPlant>): Promise<Plant | null>;
  deletePlant(id: number): Promise<boolean>;

  // Extension Studio
  createExtension(extension: InsertExtension): Promise<Extension>;
  getExtensions(userId?: number): Promise<Extension[]>;
  getExtensionById(id: number): Promise<Extension | null>;
  updateExtension(id: number, updates: Partial<InsertExtension>): Promise<Extension | null>;
  deleteExtension(id: number): Promise<boolean>;
  
  createExtensionFile(file: InsertExtensionFile): Promise<ExtensionFile>;
  getExtensionFiles(extensionId: number): Promise<ExtensionFile[]>;
  updateExtensionFile(id: number, updates: Partial<InsertExtensionFile>): Promise<ExtensionFile | null>;
  deleteExtensionFile(id: number): Promise<boolean>;
  
  createExtensionInstallation(installation: InsertExtensionInstallation): Promise<ExtensionInstallation>;
  getUserExtensions(userId: number): Promise<ExtensionInstallation[]>;
  updateExtensionInstallation(id: number, updates: Partial<InsertExtensionInstallation>): Promise<ExtensionInstallation | null>;
  deleteExtensionInstallation(id: number): Promise<boolean>;
  
  getMarketplaceExtensions(): Promise<(Extension & ExtensionMarketplace)[]>;
  createExtensionMarketplace(marketplace: InsertExtensionMarketplace): Promise<ExtensionMarketplace>;
  updateExtensionMarketplace(extensionId: number, updates: Partial<InsertExtensionMarketplace>): Promise<ExtensionMarketplace | null>;
  
  createExtensionReview(review: InsertExtensionReview): Promise<ExtensionReview>;
  getExtensionReviews(extensionId: number): Promise<ExtensionReview[]>;

  // Workflow Automation
  getWorkflows(userId?: number): Promise<Workflow[]>;
  getWorkflow(id: number): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: number): Promise<boolean>;
  executeWorkflow(id: number, context?: any): Promise<WorkflowExecution>;

  getWorkflowTriggers(workflowId?: number): Promise<WorkflowTrigger[]>;

  // Shift Management System
  // Shift Templates
  getShiftTemplates(plantId?: number): Promise<ShiftTemplate[]>;
  getShiftTemplate(id: number): Promise<ShiftTemplate | undefined>;
  createShiftTemplate(template: InsertShiftTemplate): Promise<ShiftTemplate>;
  updateShiftTemplate(id: number, template: Partial<InsertShiftTemplate>): Promise<ShiftTemplate | undefined>;
  deleteShiftTemplate(id: number): Promise<boolean>;
  getActiveShiftTemplates(plantId?: number): Promise<ShiftTemplate[]>;

  // Resource Shift Assignments
  getResourceShiftAssignments(resourceId?: number, effectiveDate?: Date): Promise<ResourceShiftAssignment[]>;
  getResourceShiftAssignment(id: number): Promise<ResourceShiftAssignment | undefined>;
  createResourceShiftAssignment(assignment: InsertResourceShiftAssignment): Promise<ResourceShiftAssignment>;
  updateResourceShiftAssignment(id: number, assignment: Partial<InsertResourceShiftAssignment>): Promise<ResourceShiftAssignment | undefined>;
  deleteResourceShiftAssignment(id: number): Promise<boolean>;
  getActiveResourceShiftAssignments(resourceId: number, date?: Date): Promise<ResourceShiftAssignment[]>;
  getResourcesOnShift(shiftTemplateId: number, date: Date): Promise<ResourceShiftAssignment[]>;

  // Shift Scenarios for Capacity Planning
  getShiftScenarios(capacityScenarioId?: number): Promise<ShiftScenario[]>;
  getShiftScenario(id: number): Promise<ShiftScenario | undefined>;
  createShiftScenario(scenario: InsertShiftScenario): Promise<ShiftScenario>;
  updateShiftScenario(id: number, scenario: Partial<InsertShiftScenario>): Promise<ShiftScenario | undefined>;
  deleteShiftScenario(id: number): Promise<boolean>;
  runShiftScenarioSimulation(scenarioId: number): Promise<ShiftScenario>;

  // Holiday Management
  getHolidays(plantId?: number, year?: number): Promise<Holiday[]>;
  getHoliday(id: number): Promise<Holiday | undefined>;
  createHoliday(holiday: InsertHoliday): Promise<Holiday>;
  updateHoliday(id: number, holiday: Partial<InsertHoliday>): Promise<Holiday | undefined>;
  deleteHoliday(id: number): Promise<boolean>;
  getHolidaysInDateRange(startDate: Date, endDate: Date, plantId?: number): Promise<Holiday[]>;
  isHoliday(date: Date, plantId?: number): Promise<boolean>;

  // Resource Absence Management
  getResourceAbsences(resourceId?: number, status?: string): Promise<ResourceAbsence[]>;
  getResourceAbsence(id: number): Promise<ResourceAbsence | undefined>;
  createResourceAbsence(absence: InsertResourceAbsence): Promise<ResourceAbsence>;
  updateResourceAbsence(id: number, absence: Partial<InsertResourceAbsence>): Promise<ResourceAbsence | undefined>;
  deleteResourceAbsence(id: number): Promise<boolean>;
  getAbsencesInDateRange(startDate: Date, endDate: Date, resourceId?: number): Promise<ResourceAbsence[]>;
  approveResourceAbsence(id: number, approvedBy: number): Promise<ResourceAbsence | undefined>;
  denyResourceAbsence(id: number, approvedBy: number, reason?: string): Promise<ResourceAbsence | undefined>;

  // Shift Coverage Management
  getShiftCoverage(absenceId?: number, date?: Date): Promise<ShiftCoverage[]>;
  getShiftCoverageItem(id: number): Promise<ShiftCoverage | undefined>;
  createShiftCoverage(coverage: InsertShiftCoverage): Promise<ShiftCoverage>;
  updateShiftCoverage(id: number, coverage: Partial<InsertShiftCoverage>): Promise<ShiftCoverage | undefined>;
  deleteShiftCoverage(id: number): Promise<boolean>;
  findAvailableCoverageResources(shiftTemplateId: number, date: Date): Promise<Resource[]>;
  arrangeShiftCoverage(absenceId: number, coveringResourceId: number, arrangedBy: number): Promise<ShiftCoverage>;

  // Shift Utilization Tracking
  getShiftUtilization(shiftTemplateId?: number, dateRange?: { start: Date; end: Date }): Promise<ShiftUtilization[]>;
  getShiftUtilizationItem(id: number): Promise<ShiftUtilization | undefined>;
  createShiftUtilization(utilization: InsertShiftUtilization): Promise<ShiftUtilization>;
  updateShiftUtilization(id: number, utilization: Partial<InsertShiftUtilization>): Promise<ShiftUtilization | undefined>;
  deleteShiftUtilization(id: number): Promise<boolean>;
  calculateShiftMetrics(shiftTemplateId: number, date: Date): Promise<ShiftUtilization>;
  getShiftUtilizationSummary(plantId?: number, dateRange?: { start: Date; end: Date }): Promise<{
    averageUtilization: number;
    averageAbsenteeRate: number;
    totalOvertimeHours: number;
    totalDowntimeMinutes: number;
    averageQualityScore: number;
    totalSafetyIncidents: number;
  }>;
  getWorkflowTrigger(id: number): Promise<WorkflowTrigger | undefined>;
  createWorkflowTrigger(trigger: InsertWorkflowTrigger): Promise<WorkflowTrigger>;
  updateWorkflowTrigger(id: number, trigger: Partial<InsertWorkflowTrigger>): Promise<WorkflowTrigger | undefined>;
  deleteWorkflowTrigger(id: number): Promise<boolean>;

  getWorkflowActions(workflowId?: number): Promise<WorkflowAction[]>;
  getWorkflowAction(id: number): Promise<WorkflowAction | undefined>;
  createWorkflowAction(action: InsertWorkflowAction): Promise<WorkflowAction>;
  updateWorkflowAction(id: number, action: Partial<InsertWorkflowAction>): Promise<WorkflowAction | undefined>;
  deleteWorkflowAction(id: number): Promise<boolean>;

  getWorkflowActionMappings(workflowId: number): Promise<WorkflowActionMapping[]>;
  createWorkflowActionMapping(mapping: InsertWorkflowActionMapping): Promise<WorkflowActionMapping>;
  deleteWorkflowActionMapping(id: number): Promise<boolean>;

  getWorkflowExecutions(workflowId?: number): Promise<WorkflowExecution[]>;
  getWorkflowExecution(id: number): Promise<WorkflowExecution | undefined>;
  updateWorkflowExecution(id: number, execution: Partial<InsertWorkflowExecution>): Promise<WorkflowExecution | undefined>;

  getWorkflowActionExecutions(executionId: number): Promise<WorkflowActionExecution[]>;
  createWorkflowActionExecution(execution: InsertWorkflowActionExecution): Promise<WorkflowActionExecution>;
  updateWorkflowActionExecution(id: number, execution: Partial<InsertWorkflowActionExecution>): Promise<WorkflowActionExecution | undefined>;

  getWorkflowMonitoring(workflowId?: number): Promise<WorkflowMonitoring[]>;
  createWorkflowMonitoring(monitoring: InsertWorkflowMonitoring): Promise<WorkflowMonitoring>;
  updateWorkflowMonitoring(id: number, monitoring: Partial<InsertWorkflowMonitoring>): Promise<WorkflowMonitoring | undefined>;
  deleteWorkflowMonitoring(id: number): Promise<boolean>;

  // AI Memory Management
  getAIMemories(userId: string): Promise<any[]>;
  storeAIMemory(memory: any): Promise<void>;
  deleteAIMemory(entryId: string, userId: string): Promise<void>;
  updateAITraining(entryId: string, content: string, userId: string): Promise<void>;
  
  // Data Validation
  runDataValidation(): Promise<any>;
  updateAITrainingPattern(pattern: any): Promise<void>;
  clearAllAIMemories(userId: string): Promise<void>;
  getAIMemoryStats(userId: string): Promise<{
    totalMemories: number;
    memoryTypes: Record<string, number>;
    avgConfidence: number;
    recentActivity: number;
  }>;

  // Presentation System
  getPresentations(userId?: number): Promise<Presentation[]>;
  getPresentation(id: number): Promise<Presentation | undefined>;
  createPresentation(presentation: InsertPresentation): Promise<Presentation>;
  updatePresentation(id: number, updates: Partial<InsertPresentation>): Promise<Presentation | undefined>;
  deletePresentation(id: number): Promise<boolean>;

  getPresentationSlides(presentationId: number): Promise<PresentationSlide[]>;
  getPresentationSlide(id: number): Promise<PresentationSlide | undefined>;
  createPresentationSlide(slide: InsertPresentationSlide): Promise<PresentationSlide>;
  updatePresentationSlide(id: number, updates: Partial<InsertPresentationSlide>): Promise<PresentationSlide | undefined>;
  deletePresentationSlide(id: number): Promise<boolean>;

  getPresentationLibrary(category?: string): Promise<PresentationLibrary[]>;
  createPresentationLibraryEntry(entry: InsertPresentationLibrary): Promise<PresentationLibrary>;
  updatePresentationLibraryEntry(id: number, updates: Partial<InsertPresentationLibrary>): Promise<PresentationLibrary | undefined>;

  // Presentation Studio - Materials Management
  getPresentationMaterials(presentationId?: number): Promise<PresentationMaterial[]>;
  getPresentationMaterial(id: number): Promise<PresentationMaterial | undefined>;
  createPresentationMaterial(material: InsertPresentationMaterial): Promise<PresentationMaterial>;
  updatePresentationMaterial(id: number, updates: Partial<InsertPresentationMaterial>): Promise<PresentationMaterial | undefined>;
  deletePresentationMaterial(id: number): Promise<boolean>;

  // Presentation Studio - Content Suggestions
  getPresentationContentSuggestions(presentationId?: number): Promise<PresentationContentSuggestion[]>;
  createPresentationContentSuggestion(suggestion: InsertPresentationContentSuggestion): Promise<PresentationContentSuggestion>;
  updatePresentationContentSuggestion(id: number, updates: Partial<InsertPresentationContentSuggestion>): Promise<PresentationContentSuggestion | undefined>;
  deletePresentationContentSuggestion(id: number): Promise<boolean>;

  // Presentation Studio - Project Management
  getPresentationProjects(userId?: number): Promise<PresentationProject[]>;
  getPresentationProject(id: number): Promise<PresentationProject | undefined>;
  createPresentationProject(project: InsertPresentationProject): Promise<PresentationProject>;
  updatePresentationProject(id: number, updates: Partial<InsertPresentationProject>): Promise<PresentationProject | undefined>;
  deletePresentationProject(id: number): Promise<boolean>;




  getPresentationTourIntegrations(presentationId?: number): Promise<PresentationTourIntegration[]>;
  createPresentationTourIntegration(integration: InsertPresentationTourIntegration): Promise<PresentationTourIntegration>;
  deletePresentationTourIntegration(id: number): Promise<boolean>;

  getPresentationAnalytics(presentationId?: number): Promise<PresentationAnalytics[]>;
  createPresentationAnalyticsEntry(entry: InsertPresentationAnalytics): Promise<PresentationAnalytics>;

  getPresentationAIContent(presentationId?: number): Promise<PresentationAIContent[]>;
  createPresentationAIContent(content: InsertPresentationAIContent): Promise<PresentationAIContent>;

  // Presentation Studio - Materials Management
  getPresentationMaterials(presentationId?: number): Promise<PresentationMaterial[]>;
  getPresentationMaterial(id: number): Promise<PresentationMaterial | undefined>;
  createPresentationMaterial(material: InsertPresentationMaterial): Promise<PresentationMaterial>;
  updatePresentationMaterial(id: number, updates: Partial<InsertPresentationMaterial>): Promise<PresentationMaterial | undefined>;
  deletePresentationMaterial(id: number): Promise<boolean>;

  // Presentation Studio - Content Suggestions
  getPresentationContentSuggestions(presentationId?: number): Promise<PresentationContentSuggestion[]>;
  createPresentationContentSuggestion(suggestion: InsertPresentationContentSuggestion): Promise<PresentationContentSuggestion>;
  updatePresentationContentSuggestion(id: number, updates: Partial<InsertPresentationContentSuggestion>): Promise<PresentationContentSuggestion | undefined>;
  deletePresentationContentSuggestion(id: number): Promise<boolean>;

  // Presentation Studio - Project Management
  getPresentationProjects(userId?: number): Promise<PresentationProject[]>;
  getPresentationProject(id: number): Promise<PresentationProject | undefined>;
  createPresentationProject(project: InsertPresentationProject): Promise<PresentationProject>;
  updatePresentationProject(id: number, updates: Partial<InsertPresentationProject>): Promise<PresentationProject | undefined>;
  deletePresentationProject(id: number): Promise<boolean>;

  // Production Planning System
  // Production Plans
  getProductionPlans(plantId?: number): Promise<ProductionPlan[]>;
  getProductionPlan(id: number): Promise<ProductionPlan | undefined>;
  createProductionPlan(plan: InsertProductionPlan): Promise<ProductionPlan>;
  updateProductionPlan(id: number, updates: Partial<InsertProductionPlan>): Promise<ProductionPlan | undefined>;
  deleteProductionPlan(id: number): Promise<boolean>;
  approveProductionPlan(id: number, approvedBy: string): Promise<ProductionPlan | undefined>;

  // Production Targets
  getProductionTargets(planId?: number): Promise<ProductionTarget[]>;
  getProductionTarget(id: number): Promise<ProductionTarget | undefined>;
  createProductionTarget(target: InsertProductionTarget): Promise<ProductionTarget>;
  updateProductionTarget(id: number, updates: Partial<InsertProductionTarget>): Promise<ProductionTarget | undefined>;
  deleteProductionTarget(id: number): Promise<boolean>;

  // Resource Allocations
  getResourceAllocations(planId?: number): Promise<ResourceAllocation[]>;
  getResourceAllocation(id: number): Promise<ResourceAllocation | undefined>;
  createResourceAllocation(allocation: InsertResourceAllocation): Promise<ResourceAllocation>;
  updateResourceAllocation(id: number, updates: Partial<InsertResourceAllocation>): Promise<ResourceAllocation | undefined>;
  deleteResourceAllocation(id: number): Promise<boolean>;

  // Production Milestones
  getProductionMilestones(planId?: number): Promise<ProductionMilestone[]>;
  getProductionMilestone(id: number): Promise<ProductionMilestone | undefined>;
  createProductionMilestone(milestone: InsertProductionMilestone): Promise<ProductionMilestone>;
  updateProductionMilestone(id: number, updates: Partial<InsertProductionMilestone>): Promise<ProductionMilestone | undefined>;
  deleteProductionMilestone(id: number): Promise<boolean>;
  markMilestoneComplete(id: number): Promise<ProductionMilestone | undefined>;

  // Optimization Studio - Algorithm Management
  getOptimizationAlgorithms(category?: string, status?: string): Promise<OptimizationAlgorithm[]>;
  getOptimizationAlgorithm(id: number): Promise<OptimizationAlgorithm | undefined>;
  createOptimizationAlgorithm(algorithm: InsertOptimizationAlgorithm): Promise<OptimizationAlgorithm>;
  updateOptimizationAlgorithm(id: number, updates: Partial<InsertOptimizationAlgorithm>): Promise<OptimizationAlgorithm | undefined>;
  deleteOptimizationAlgorithm(id: number): Promise<boolean>;
  approveOptimizationAlgorithm(id: number, approvedBy: number, comments?: string): Promise<OptimizationAlgorithm | undefined>;
  deployOptimizationAlgorithm(id: number, targetModule: string, environment: string): Promise<OptimizationAlgorithm | undefined>;
  getStandardAlgorithms(category?: string): Promise<OptimizationAlgorithm[]>;
  getDerivedAlgorithms(baseId: number): Promise<OptimizationAlgorithm[]>;

  // Optimization Studio - Algorithm Testing
  getAlgorithmTests(algorithmId?: number, testType?: string): Promise<AlgorithmTest[]>;
  getAlgorithmTest(id: number): Promise<AlgorithmTest | undefined>;
  createAlgorithmTest(test: InsertAlgorithmTest): Promise<AlgorithmTest>;
  updateAlgorithmTest(id: number, updates: Partial<InsertAlgorithmTest>): Promise<AlgorithmTest | undefined>;
  deleteAlgorithmTest(id: number): Promise<boolean>;
  runAlgorithmTest(id: number, datasetType: string): Promise<AlgorithmTest | undefined>;
  getTestResults(algorithmId: number): Promise<AlgorithmTest[]>;

  // Optimization Studio - Algorithm Deployments
  getAlgorithmDeployments(algorithmId?: number, targetModule?: string): Promise<AlgorithmDeployment[]>;
  getAlgorithmDeployment(id: number): Promise<AlgorithmDeployment | undefined>;
  createAlgorithmDeployment(deployment: InsertAlgorithmDeployment): Promise<AlgorithmDeployment>;
  updateAlgorithmDeployment(id: number, updates: Partial<InsertAlgorithmDeployment>): Promise<AlgorithmDeployment | undefined>;
  deleteAlgorithmDeployment(id: number): Promise<boolean>;
  activateDeployment(id: number): Promise<AlgorithmDeployment | undefined>;
  rollbackDeployment(id: number): Promise<AlgorithmDeployment | undefined>;
  updateDeploymentHealth(id: number, metrics: Record<string, number>): Promise<AlgorithmDeployment | undefined>;

  // Optimization Studio - Extension Data Management
  getExtensionData(algorithmId?: number, entityType?: string, entityId?: number): Promise<ExtensionData[]>;
  getExtensionDataItem(id: number): Promise<ExtensionData | undefined>;
  createExtensionData(data: InsertExtensionData): Promise<ExtensionData>;
  updateExtensionData(id: number, updates: Partial<InsertExtensionData>): Promise<ExtensionData | undefined>;
  deleteExtensionData(id: number): Promise<boolean>;
  getExtensionDataByEntity(entityType: string, entityId: number): Promise<ExtensionData[]>;
  getExtensionDataFields(algorithmId: number): Promise<{ entityType: string; fields: string[] }[]>;

  // Optimization Scope Configuration Management
  getOptimizationScopeConfigs(category?: string, userId?: number): Promise<OptimizationScopeConfig[]>;
  getOptimizationScopeConfig(id: number): Promise<OptimizationScopeConfig | undefined>;
  createOptimizationScopeConfig(config: InsertOptimizationScopeConfig): Promise<OptimizationScopeConfig>;
  updateOptimizationScopeConfig(id: number, updates: Partial<InsertOptimizationScopeConfig>): Promise<OptimizationScopeConfig | undefined>;
  deleteOptimizationScopeConfig(id: number): Promise<boolean>;

  // High-performance data management for large datasets
  getDataWithPagination<T>(table: string, request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<T>>;
  bulkUpdateRecords<T>(table: string, updates: import("@shared/data-management-types").BulkUpdateRequest<T>): Promise<{ success: boolean; updated: number; errors: any[] }>;
  bulkDeleteRecords(table: string, request: import("@shared/data-management-types").BulkDeleteRequest): Promise<{ success: boolean; deleted: number; errors: any[] }>;
  
  // Specialized pagination methods for each data type
  getPlantsWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<Plant>>;
  getResourcesWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<Resource>>;
  getCapabilitiesWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<Capability>>;
  getProductionOrdersWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<ProductionOrder>>;
  getVendorsWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<PTVendor>>;
  getCustomersWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<Customer>>;
  getStockItemsWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<StockItem>>;
  getDefaultOptimizationScopeConfig(category: string): Promise<OptimizationScopeConfig | undefined>;
  setOptimizationScopeConfigAsDefault(id: number): Promise<void>;
  duplicateOptimizationScopeConfig(id: number, newName: string, userId: number): Promise<OptimizationScopeConfig>;
  
  // Optimization Run History Management
  getOptimizationRuns(userId?: number, algorithmId?: number): Promise<OptimizationRun[]>;
  getOptimizationRun(id: number): Promise<OptimizationRun | undefined>;
  createOptimizationRun(run: InsertOptimizationRun): Promise<OptimizationRun>;
  updateOptimizationRun(id: number, updates: Partial<InsertOptimizationRun>): Promise<OptimizationRun | undefined>;
  deleteOptimizationRun(id: number): Promise<boolean>;
  getOptimizationRunsByStatus(status: string): Promise<OptimizationRun[]>;
  updateOptimizationRunStatus(id: number, status: string, error?: string): Promise<OptimizationRun | undefined>;

  // Optimization Profiles Management - Algorithm-specific execution configurations
  getOptimizationProfiles(algorithmId?: number, userId?: number): Promise<OptimizationProfile[]>;
  getOptimizationProfile(id: number): Promise<OptimizationProfile | undefined>;
  createOptimizationProfile(profile: InsertOptimizationProfile): Promise<OptimizationProfile>;
  updateOptimizationProfile(id: number, updates: Partial<InsertOptimizationProfile>): Promise<OptimizationProfile | undefined>;
  deleteOptimizationProfile(id: number): Promise<boolean>;
  getDefaultOptimizationProfile(algorithmId: number): Promise<OptimizationProfile | undefined>;
  setOptimizationProfileAsDefault(id: number): Promise<void>;
  duplicateOptimizationProfile(id: number, newName: string, userId: number): Promise<OptimizationProfile>;
  getSharedOptimizationProfiles(algorithmId: number): Promise<OptimizationProfile[]>;
  validateOptimizationProfile(profile: OptimizationProfile): Promise<{ isValid: boolean; errors: string[] }>;

  // Profile Usage History Management
  getProfileUsageHistory(profileId?: number, userId?: number): Promise<ProfileUsageHistory[]>;
  createProfileUsageHistory(usage: InsertProfileUsageHistory): Promise<ProfileUsageHistory>;
  getProfileUsageStats(profileId: number): Promise<{
    totalUsage: number;
    averageExecutionTime: number;
    successRate: number;
    lastUsed: Date | null;
    userCount: number;
  }>;

  // Field Comments Management
  getFieldComments(tableName?: string): Promise<FieldComment[]>;
  getFieldComment(tableName: string, columnName: string): Promise<FieldComment | undefined>;
  createFieldComment(comment: InsertFieldComment): Promise<FieldComment>;
  updateFieldComment(tableName: string, columnName: string, updates: Partial<InsertFieldComment>): Promise<FieldComment | undefined>;
  deleteFieldComment(tableName: string, columnName: string): Promise<boolean>;

  // Product Development
  // Strategy Documents
  getStrategyDocuments(category?: string): Promise<StrategyDocument[]>;
  getStrategyDocument(id: number): Promise<StrategyDocument | undefined>;
  createStrategyDocument(document: InsertStrategyDocument): Promise<StrategyDocument>;
  updateStrategyDocument(id: number, document: Partial<InsertStrategyDocument>): Promise<StrategyDocument | undefined>;
  deleteStrategyDocument(id: number): Promise<boolean>;

  // Development Tasks
  getDevelopmentTasks(status?: string, phase?: string): Promise<DevelopmentTask[]>;
  getDevelopmentTask(id: number): Promise<DevelopmentTask | undefined>;
  createDevelopmentTask(task: InsertDevelopmentTask): Promise<DevelopmentTask>;
  updateDevelopmentTask(id: number, task: Partial<InsertDevelopmentTask>): Promise<DevelopmentTask | undefined>;
  deleteDevelopmentTask(id: number): Promise<boolean>;

  // Test Suites
  getTestSuites(type?: string, status?: string): Promise<TestSuite[]>;
  getTestSuite(id: number): Promise<TestSuite | undefined>;
  createTestSuite(suite: InsertTestSuite): Promise<TestSuite>;
  updateTestSuite(id: number, suite: Partial<InsertTestSuite>): Promise<TestSuite | undefined>;
  deleteTestSuite(id: number): Promise<boolean>;

  // Test Cases
  getTestCases(suiteId?: number): Promise<TestCase[]>;
  getTestCase(id: number): Promise<TestCase | undefined>;
  createTestCase(testCase: InsertTestCase): Promise<TestCase>;
  updateTestCase(id: number, testCase: Partial<InsertTestCase>): Promise<TestCase | undefined>;
  deleteTestCase(id: number): Promise<boolean>;
  runTestCase(id: number): Promise<TestCase | undefined>;

  // Architecture Components
  getArchitectureComponents(): Promise<ArchitectureComponent[]>;
  getArchitectureComponent(id: number): Promise<ArchitectureComponent | undefined>;
  createArchitectureComponent(component: InsertArchitectureComponent): Promise<ArchitectureComponent>;
  updateArchitectureComponent(id: number, component: Partial<InsertArchitectureComponent>): Promise<ArchitectureComponent | undefined>;
  deleteArchitectureComponent(id: number): Promise<boolean>;

  // API Integrations
  createApiIntegration(integration: InsertApiIntegration): Promise<ApiIntegration>;
  getApiIntegrations(): Promise<ApiIntegration[]>;
  getApiIntegration(id: number): Promise<ApiIntegration | undefined>;
  updateApiIntegration(id: number, updates: Partial<ApiIntegration>): Promise<ApiIntegration>;
  deleteApiIntegration(id: number): Promise<void>;
  generateApiIntegrationWithAI(prompt: string, systemType: string, provider: string, userId: number): Promise<ApiIntegration>;
  testApiConnection(id: number): Promise<{ success: boolean; message: string; responseTime?: number }>;
  syncApiIntegration(id: number): Promise<{ success: boolean; recordsProcessed: number; message: string }>;

  // API Mappings
  createApiMapping(mapping: InsertApiMapping): Promise<ApiMapping>;
  getApiMappings(integrationId?: number): Promise<ApiMapping[]>;
  getApiMapping(id: number): Promise<ApiMapping | undefined>;
  updateApiMapping(id: number, updates: Partial<ApiMapping>): Promise<ApiMapping>;
  deleteApiMapping(id: number): Promise<void>;
  generateApiMappingWithAI(integrationId: number, description: string): Promise<ApiMapping>;

  // API Tests
  createApiTest(test: InsertApiTest): Promise<ApiTest>;
  getApiTests(integrationId?: number): Promise<ApiTest[]>;
  getApiTest(id: number): Promise<ApiTest | undefined>;
  runApiTest(id: number): Promise<ApiTest>;
  deleteApiTest(id: number): Promise<void>;

  // API Audit Logs
  createApiAuditLog(log: InsertApiAuditLog): Promise<ApiAuditLog>;
  getApiAuditLogs(integrationId?: number, limit?: number): Promise<ApiAuditLog[]>;

  // API Credentials
  createApiCredential(credential: InsertApiCredential): Promise<ApiCredential>;
  getApiCredentials(integrationId: number): Promise<ApiCredential[]>;
  updateApiCredential(id: number, updates: Partial<ApiCredential>): Promise<ApiCredential>;
  deleteApiCredential(id: number): Promise<void>;

  // Scheduling History
  getSchedulingHistory(limit?: number, algorithmType?: string, plantId?: number): Promise<SchedulingHistory[]>;
  getSchedulingHistoryById(id: number): Promise<SchedulingHistory | undefined>;
  createSchedulingHistory(history: InsertSchedulingHistory): Promise<SchedulingHistory>;
  updateSchedulingHistory(id: number, updates: Partial<InsertSchedulingHistory>): Promise<SchedulingHistory | undefined>;
  deleteSchedulingHistory(id: number): Promise<boolean>;
  getSchedulingHistoryByUser(userId: number, limit?: number): Promise<SchedulingHistory[]>;
  getSchedulingHistoryComparison(baselineId: number, comparisonId: number): Promise<{ baseline: SchedulingHistory; comparison: SchedulingHistory; improvements: any }>;

  // Scheduling Results
  getSchedulingResults(historyId: number): Promise<SchedulingResult[]>;
  createSchedulingResult(result: InsertSchedulingResult): Promise<SchedulingResult>;
  getSchedulingResultsByOperation(operationId: number): Promise<SchedulingResult[]>;
  getSchedulingResultsWithDetails(historyId: number): Promise<(SchedulingResult & { jobName?: string; operationName?: string; resourceName?: string })[]>;

  // Algorithm Performance
  getAlgorithmPerformance(algorithmName?: string, plantId?: number): Promise<AlgorithmPerformance[]>;
  getAlgorithmPerformanceById(id: number): Promise<AlgorithmPerformance | undefined>;
  createAlgorithmPerformance(performance: InsertAlgorithmPerformance): Promise<AlgorithmPerformance>;
  updateAlgorithmPerformance(id: number, updates: Partial<InsertAlgorithmPerformance>): Promise<AlgorithmPerformance | undefined>;
  deleteAlgorithmPerformance(id: number): Promise<boolean>;
  getAlgorithmPerformanceTrends(algorithmName: string, plantId?: number, months?: number): Promise<AlgorithmPerformance[]>;

  // Recipe Management - Commented out, replaced with PT Publish tables
  /*
  getRecipes(plantId?: number): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | undefined>;
  getRecipeByNumber(recipeNumber: string): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: number): Promise<boolean>;

  // Bills of Material Management
  getBillsOfMaterial(): Promise<any[]>;
  
  // Routings Management  
  getRoutings(): Promise<any[]>;
  
  // Production Versions Management
  getProductionVersions(): Promise<ProductionVersion[]>;

  // Recipe Phases
  getRecipePhases(recipeId: number): Promise<RecipePhase[]>;
  getRecipePhase(id: number): Promise<RecipePhase | undefined>;
  createRecipePhase(phase: InsertRecipePhase): Promise<RecipePhase>;
  updateRecipePhase(id: number, phase: Partial<InsertRecipePhase>): Promise<RecipePhase | undefined>;
  deleteRecipePhase(id: number): Promise<boolean>;

  // Recipe Formulas
  getRecipeFormulas(recipeId?: number, phaseId?: number): Promise<RecipeFormula[]>;
  getRecipeFormula(id: number): Promise<RecipeFormula | undefined>;
  createRecipeFormula(formula: InsertRecipeFormula): Promise<RecipeFormula>;
  updateRecipeFormula(id: number, formula: Partial<InsertRecipeFormula>): Promise<RecipeFormula | undefined>;
  deleteRecipeFormula(id: number): Promise<boolean>;

  // Recipe Product Outputs
  getRecipeProductOutputs(recipeId?: number): Promise<RecipeProductOutput[]>;
  getRecipeProductOutput(id: number): Promise<RecipeProductOutput | undefined>;
  createRecipeProductOutput(output: InsertRecipeProductOutput): Promise<RecipeProductOutput>;
  updateRecipeProductOutput(id: number, output: Partial<InsertRecipeProductOutput>): Promise<RecipeProductOutput | undefined>;
  deleteRecipeProductOutput(id: number): Promise<boolean>;

  // Recipe Equipment
  getRecipeEquipment(recipeId?: number, phaseId?: number): Promise<RecipeEquipment[]>;
  getRecipeEquipmentItem(id: number): Promise<RecipeEquipment | undefined>;
  createRecipeEquipment(equipment: InsertRecipeEquipment): Promise<RecipeEquipment>;
  updateRecipeEquipment(id: number, equipment: Partial<InsertRecipeEquipment>): Promise<RecipeEquipment | undefined>;
  deleteRecipeEquipment(id: number): Promise<boolean>;
  */

  // Production Versions
  getProductionVersions(plantId?: number): Promise<ProductionVersion[]>;
  getProductionVersion(id: number): Promise<ProductionVersion | undefined>;
  getProductionVersionByNumber(versionNumber: string, itemNumber: string, plantId: number): Promise<ProductionVersion | undefined>;
  createProductionVersion(version: InsertProductionVersion): Promise<ProductionVersion>;
  updateProductionVersion(id: number, version: Partial<InsertProductionVersion>): Promise<ProductionVersion | undefined>;
  deleteProductionVersion(id: number): Promise<boolean>;

  // Vendors - Commented out, replaced with PT Publish tables
  /*
  getVendors(): Promise<PTVendor[]>;
  getVendor(id: number): Promise<PTVendor | undefined>;
  createVendor(vendor: InsertPTVendor): Promise<PTVendor>;
  updateVendor(id: number, vendor: Partial<InsertPTVendor>): Promise<PTVendor | undefined>;
  deleteVendor(id: number): Promise<boolean>;
  */

  // Formulations
  getFormulations(): Promise<Formulation[]>;
  getFormulation(id: number): Promise<Formulation | undefined>;
  getFormulationByNumber(formulationNumber: string): Promise<Formulation | undefined>;
  createFormulation(formulation: InsertFormulation): Promise<Formulation>;
  updateFormulation(id: number, formulation: Partial<InsertFormulation>): Promise<Formulation | undefined>;
  deleteFormulation(id: number): Promise<boolean>;
  getFormulationsByVendor(vendorId: number): Promise<Formulation[]>;

  // Formulation Details
  getFormulationDetails(formulationId?: number): Promise<FormulationDetail[]>;
  getFormulationDetail(id: number): Promise<FormulationDetail | undefined>;
  createFormulationDetail(detail: InsertFormulationDetail): Promise<FormulationDetail>;
  updateFormulationDetail(id: number, detail: Partial<InsertFormulationDetail>): Promise<FormulationDetail | undefined>;
  deleteFormulationDetail(id: number): Promise<boolean>;
  getFormulationDetailsByFormulation(formulationId: number): Promise<FormulationDetail[]>;
  getFormulationDetailsByItem(itemId: number): Promise<FormulationDetail[]>;

  // Production Version Phase Formulation Details Junction
  getProductionVersionPhaseFormulationDetails(productionVersionId?: number): Promise<ProductionVersionPhaseFormulationDetail[]>;
  getProductionVersionPhaseFormulationDetail(id: number): Promise<ProductionVersionPhaseFormulationDetail | undefined>;
  createProductionVersionPhaseFormulationDetail(assignment: InsertProductionVersionPhaseFormulationDetail): Promise<ProductionVersionPhaseFormulationDetail>;
  updateProductionVersionPhaseFormulationDetail(id: number, assignment: Partial<InsertProductionVersionPhaseFormulationDetail>): Promise<ProductionVersionPhaseFormulationDetail | undefined>;
  deleteProductionVersionPhaseFormulationDetail(id: number): Promise<boolean>;
  getProductionVersionPhaseFormulationDetailsByProductionVersion(productionVersionId: number): Promise<ProductionVersionPhaseFormulationDetail[]>;
  getProductionVersionPhaseFormulationDetailsByRecipePhase(recipePhaseId: number): Promise<ProductionVersionPhaseFormulationDetail[]>;
  getProductionVersionPhaseFormulationDetailsByFormulationDetail(formulationDetailId: number): Promise<ProductionVersionPhaseFormulationDetail[]>;

  // Production Version Phase Material Requirements (removed - using PT Publish tables)

  // Material Requirements - dual relationship with formulations and BOMs
  getMaterialRequirements(): Promise<MaterialRequirement[]>;
  getMaterialRequirement(id: number): Promise<MaterialRequirement | undefined>;
  createMaterialRequirement(requirement: InsertMaterialRequirement): Promise<MaterialRequirement>;
  updateMaterialRequirement(id: number, requirement: Partial<InsertMaterialRequirement>): Promise<MaterialRequirement | undefined>;
  deleteMaterialRequirement(id: number): Promise<boolean>;
  getMaterialRequirementsByFormulation(formulationId: number): Promise<MaterialRequirement[]>;
  getMaterialRequirementsByBom(bomId: number): Promise<MaterialRequirement[]>;
  getMaterialRequirementsByItem(itemId: number): Promise<MaterialRequirement[]>;

  // Production Version Phase BOM Product Output (removed - using PT Publish tables)

  // Production Version Phase Recipe Product Output Junction Table
  getProductionVersionPhaseRecipeProductOutputs(): Promise<ProductionVersionPhaseRecipeProductOutput[]>;
  getProductionVersionPhaseRecipeProductOutput(id: number): Promise<ProductionVersionPhaseRecipeProductOutput | undefined>;
  createProductionVersionPhaseRecipeProductOutput(assignment: InsertProductionVersionPhaseRecipeProductOutput): Promise<ProductionVersionPhaseRecipeProductOutput>;
  updateProductionVersionPhaseRecipeProductOutput(id: number, assignment: Partial<InsertProductionVersionPhaseRecipeProductOutput>): Promise<ProductionVersionPhaseRecipeProductOutput | undefined>;
  deleteProductionVersionPhaseRecipeProductOutput(id: number): Promise<boolean>;
  getProductionVersionPhaseRecipeProductOutputsByProductionVersion(productionVersionId: number): Promise<ProductionVersionPhaseRecipeProductOutput[]>;
  getProductionVersionPhaseRecipeProductOutputsByPhase(recipePhaseId: number): Promise<ProductionVersionPhaseRecipeProductOutput[]>;
  getProductionVersionPhaseRecipeProductOutputsByRecipeOutput(recipeProductOutputId: number): Promise<ProductionVersionPhaseRecipeProductOutput[]>;

    // BOM Product Outputs  
  getBomProductOutputs(): Promise<BomProductOutput[]>;
  getBomProductOutput(id: number): Promise<BomProductOutput | undefined>;
  createBomProductOutput(output: InsertBomProductOutput): Promise<BomProductOutput>;
  updateBomProductOutput(id: number, output: Partial<InsertBomProductOutput>): Promise<BomProductOutput | undefined>;
  deleteBomProductOutput(id: number): Promise<boolean>;
  getBomProductOutputsByBom(bomId: number): Promise<BomProductOutput[]>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  // High-performance data management for large datasets
  getDataWithPagination<T>(
    table: string,
    request: import("@shared/data-management-types").DataRequest
  ): Promise<import("@shared/data-management-types").DataResponse<T>>;

  bulkUpdateRecords<T>(
    table: string,
    updates: import("@shared/data-management-types").BulkUpdateRequest<T>
  ): Promise<{ success: boolean; updated: number; errors: any[] }>;

  bulkDeleteRecords(
    table: string,
    request: import("@shared/data-management-types").BulkDeleteRequest
  ): Promise<{ success: boolean; deleted: number; errors: any[] }>;

  // Enhanced data type methods with pagination support
  getPlantsWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<Plant>>;
  getResourcesWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<Resource>>;
  getCapabilitiesWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<Capability>>;
  getProductionOrdersWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<ProductionOrder>>;
  getOperationsWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<Operation>>;
  getVendorsWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<PTVendor>>;
  getCustomersWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<Customer>>;
  getStockItemsWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<StockItem>>;
  
  // User Secrets Management
  getUserSecrets(userId: string): Promise<UserSecret[]>;
  getUserSecret(id: number): Promise<UserSecret | undefined>;
  getUserSecretByKey(userId: string, key: string): Promise<UserSecret | undefined>;
  createUserSecret(secret: InsertUserSecret): Promise<UserSecret>;
  updateUserSecret(id: number, secret: Partial<InsertUserSecret>): Promise<UserSecret | undefined>;
  deleteUserSecret(id: number): Promise<boolean>;
  updateSecretLastUsed(id: number): Promise<void>;

  // Discrete Operation Phases (removed - using PT Publish tables)
  // Discrete Operation Phase Resource Requirements (removed - using PT Publish tables)

  // Algorithm Feedback Management
  getAlgorithmFeedback(filters?: { algorithmName?: string; status?: string; severity?: string; category?: string; submittedBy?: number; plantId?: number }): Promise<AlgorithmFeedback[]>;
  getAlgorithmFeedbackById(id: number): Promise<AlgorithmFeedback | undefined>;
  createAlgorithmFeedback(feedback: InsertAlgorithmFeedback): Promise<AlgorithmFeedback>;
  updateAlgorithmFeedback(id: number, updates: Partial<InsertAlgorithmFeedback>): Promise<AlgorithmFeedback | undefined>;
  deleteAlgorithmFeedback(id: number): Promise<boolean>;
  getAlgorithmFeedbackByAlgorithm(algorithmName: string, algorithmVersion?: string): Promise<AlgorithmFeedback[]>;
  getAlgorithmFeedbackByExecution(schedulingHistoryId?: number, algorithmPerformanceId?: number, optimizationRunId?: number): Promise<AlgorithmFeedback[]>;
  assignAlgorithmFeedback(id: number, assignedTo: number): Promise<AlgorithmFeedback | undefined>;
  resolveAlgorithmFeedback(id: number, resolvedBy: number, resolutionNotes: string): Promise<AlgorithmFeedback | undefined>;
  updateImplementationStatus(id: number, status: string, notes?: string, version?: string): Promise<AlgorithmFeedback | undefined>;

  // Algorithm Feedback Comments
  getAlgorithmFeedbackComments(feedbackId: number): Promise<AlgorithmFeedbackComment[]>;
  getAlgorithmFeedbackComment(id: number): Promise<AlgorithmFeedbackComment | undefined>;
  createAlgorithmFeedbackComment(comment: InsertAlgorithmFeedbackComment): Promise<AlgorithmFeedbackComment>;
  updateAlgorithmFeedbackComment(id: number, updates: Partial<InsertAlgorithmFeedbackComment>): Promise<AlgorithmFeedbackComment | undefined>;
  deleteAlgorithmFeedbackComment(id: number): Promise<boolean>;

  // Algorithm Feedback Voting
  getAlgorithmFeedbackVotes(feedbackId: number): Promise<AlgorithmFeedbackVote[]>;
  voteAlgorithmFeedback(feedbackId: number, userId: number, voteType: 'upvote' | 'downvote'): Promise<AlgorithmFeedbackVote>;
  removeAlgorithmFeedbackVote(feedbackId: number, userId: number): Promise<boolean>;
  getAlgorithmFeedbackVoteCounts(feedbackId: number): Promise<{ upvotes: number; downvotes: number }>;

  // Alerts
  getAlerts(): Promise<Alert[]>;

  // Sales Orders
  getSalesOrders(): Promise<SalesOrder[]>;
  getSalesOrder(id: number): Promise<SalesOrder | undefined>;
  searchSalesOrdersByNumber(searchTerm: string): Promise<SalesOrder[]>;
  searchSalesOrdersByCustomer(searchTerm: string): Promise<SalesOrder[]>;
  searchSalesOrdersByProduct(searchTerm: string): Promise<SalesOrder[]>;
  
  // Database Schema
  getDatabaseSchema(): Promise<any[]>;

  // Smart KPI Management System
  // Collaborative Demand Management
  // Demand Change Requests
  getDemandChangeRequests(status?: string, requestType?: string): Promise<DemandChangeRequest[]>;
  getDemandChangeRequest(id: number): Promise<DemandChangeRequest | undefined>;
  createDemandChangeRequest(request: InsertDemandChangeRequest): Promise<DemandChangeRequest>;
  updateDemandChangeRequest(id: number, request: Partial<InsertDemandChangeRequest>): Promise<DemandChangeRequest | undefined>;
  deleteDemandChangeRequest(id: number): Promise<boolean>;
  
  // Demand Change Comments
  getDemandChangeComments(requestId: number): Promise<DemandChangeComment[]>;
  createDemandChangeComment(comment: InsertDemandChangeComment): Promise<DemandChangeComment>;
  updateDemandChangeComment(id: number, comment: Partial<InsertDemandChangeComment>): Promise<DemandChangeComment | undefined>;
  deleteDemandChangeComment(id: number): Promise<boolean>;
  
  // Demand Change Approvals
  getDemandChangeApprovals(requestId: number): Promise<DemandChangeApproval[]>;
  createDemandChangeApproval(approval: InsertDemandChangeApproval): Promise<DemandChangeApproval>;
  updateDemandChangeApproval(id: number, approval: Partial<InsertDemandChangeApproval>): Promise<DemandChangeApproval | undefined>;
  deleteDemandChangeApproval(id: number): Promise<boolean>;
  
  // Demand Collaboration Sessions
  getDemandCollaborationSessions(organizerId?: number, status?: string): Promise<DemandCollaborationSession[]>;
  getDemandCollaborationSession(id: number): Promise<DemandCollaborationSession | undefined>;
  createDemandCollaborationSession(session: InsertDemandCollaborationSession): Promise<DemandCollaborationSession>;
  updateDemandCollaborationSession(id: number, session: Partial<InsertDemandCollaborationSession>): Promise<DemandCollaborationSession | undefined>;
  deleteDemandCollaborationSession(id: number): Promise<boolean>;

  // Alerts System
  getAlerts(filters?: { 
    severity?: string; 
    status?: string; 
    type?: string;
    plantId?: number;
    departmentId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Alert[]>;
  getAlert(id: number): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: number, alert: Partial<InsertAlert>): Promise<Alert | undefined>;
  deleteAlert(id: number): Promise<boolean>;
  acknowledgeAlert(id: number, userId: number, comment?: string): Promise<Alert | undefined>;
  resolveAlert(id: number, userId: number, resolution: string, rootCause?: string): Promise<Alert | undefined>;
  escalateAlert(id: number, userId: number, escalatedTo: number, reason?: string): Promise<Alert | undefined>;
  dismissAlert(id: number, userId: number, reason?: string): Promise<Alert | undefined>;
  
  // Alert Comments
  getAlertComments(alertId: number): Promise<AlertComment[]>;
  createAlertComment(comment: InsertAlertComment): Promise<AlertComment>;
  
  // Alert Templates
  getAlertTemplates(type?: string, isActive?: boolean): Promise<AlertTemplate[]>;
  getAlertTemplate(id: number): Promise<AlertTemplate | undefined>;
  createAlertTemplate(template: InsertAlertTemplate): Promise<AlertTemplate>;
  updateAlertTemplate(id: number, template: Partial<InsertAlertTemplate>): Promise<AlertTemplate | undefined>;
  deleteAlertTemplate(id: number): Promise<boolean>;
  
  // Alert Training Data
  createAlertTrainingData(data: InsertAlertTrainingData): Promise<AlertTrainingData>;
  getAlertTrainingData(alertId?: number): Promise<AlertTrainingData[]>;
  
  // Alert Subscriptions
  getAlertSubscriptions(userId: number): Promise<AlertSubscription | undefined>;
  createOrUpdateAlertSubscription(subscription: InsertAlertSubscription): Promise<AlertSubscription>;
  
  // Alert Statistics
  getAlertStats(filters?: {
    plantId?: number;
    departmentId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    avgResolutionTime: number;
    trendsLastWeek: Array<{ date: string; count: number }>;
  }>;

  // Implementation Projects
  getImplementationProjects(): Promise<ImplementationProject[]>;
  getImplementationProject(id: number): Promise<ImplementationProject | undefined>;
  createImplementationProject(project: any): Promise<ImplementationProject>;
  updateImplementationProject(id: number, project: any): Promise<ImplementationProject | undefined>;
  deleteImplementationProject(id: number): Promise<boolean>;

  // Memory Book System - Max AI's collaborative knowledge base
  getMemoryBooks(scope?: string, plantId?: number, userId?: number): Promise<MemoryBook[]>;
  getMemoryBook(id: number): Promise<MemoryBook | undefined>;
  createMemoryBook(book: InsertMemoryBook): Promise<MemoryBook>;
  updateMemoryBook(id: number, updates: Partial<InsertMemoryBook>): Promise<MemoryBook | undefined>;
  deleteMemoryBook(id: number): Promise<boolean>;
  
  // Memory Book Entries
  getMemoryBookEntries(memoryBookId?: number, category?: string, searchTerm?: string): Promise<MemoryBookEntry[]>;
  getMemoryBookEntry(id: number): Promise<MemoryBookEntry | undefined>;
  createMemoryBookEntry(entry: InsertMemoryBookEntry): Promise<MemoryBookEntry>;
  updateMemoryBookEntry(id: number, updates: Partial<InsertMemoryBookEntry>): Promise<MemoryBookEntry | undefined>;
  deleteMemoryBookEntry(id: number): Promise<boolean>;
  searchMemoryBookEntries(searchTerm: string, memoryBookId?: number): Promise<MemoryBookEntry[]>;
  
  // Memory Book Collaborators
  getMemoryBookCollaborators(memoryBookId: number): Promise<MemoryBookCollaborator[]>;
  addMemoryBookCollaborator(collaborator: InsertMemoryBookCollaborator): Promise<MemoryBookCollaborator>;
  updateMemoryBookCollaboratorPermission(id: number, permission: string): Promise<MemoryBookCollaborator | undefined>;
  removeMemoryBookCollaborator(id: number): Promise<boolean>;
  
  // Memory Book Entry History
  getMemoryBookEntryHistory(entryId: number): Promise<MemoryBookEntryHistory[]>;
  createMemoryBookEntryHistory(history: InsertMemoryBookEntryHistory): Promise<MemoryBookEntryHistory>;
  
  // Memory Book Usage Analytics
  recordMemoryBookUsage(usage: InsertMemoryBookUsage): Promise<MemoryBookUsage>;
  getMemoryBookUsageStats(entryId?: number): Promise<{
    totalViews: number;
    totalApplications: number;
    averageEffectiveness: number;
    recentUsage: number;
  }>;
}

export class MemStorage implements Partial<IStorage> {
  private capabilities: Map<number, Capability> = new Map();
  private resources: Map<number, Resource> = new Map();
  private jobs: Map<number, ProductionOrder> = new Map();
  // Note: DiscreteOperation type no longer exists - using PT tables instead
  // private operations: Map<number, DiscreteOperation> = new Map();
  // private dependencies: Map<number, Dependency> = new Map();
  private resourceViews: Map<number, ResourceView> = new Map();
  
  private currentCapabilityId = 1;
  private currentResourceId = 1;
  private currentJobId = 1;
  private currentOperationId = 1;
  // private currentDependencyId = 1;
  private currentResourceViewId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Default capabilities
    const defaultCapabilities = [
      { name: "CNC Machine", description: "Computer Numerical Control machining" },
      { name: "Welding", description: "Metal welding operations" },
      { name: "Assembly", description: "Component assembly operations" },
      { name: "Quality Control", description: "Inspection and testing" },
      { name: "Painting", description: "Surface finishing operations" },
    ];

    defaultCapabilities.forEach(cap => {
      const capability: Capability = { 
        id: this.currentCapabilityId++,
        publishDate: new Date(),
        instanceId: "default-instance",
        name: cap.name,
        description: cap.description || null,
        notes: null,
        externalId: null,
        capabilityId: this.currentCapabilityId - 1
      };
      this.capabilities.set(capability.id, capability);
    });

    // Default resources
    const defaultResources = [
      { name: "CNC-001", resourceType: "Machine" },
      { name: "CNC-002", resourceType: "Machine" },
      { name: "WLD-001", resourceType: "Welding Station" },
      { name: "ASM-001", resourceType: "Assembly Station" },
      { name: "QC-001", resourceType: "Quality Station" },
    ];

    defaultResources.forEach(res => {
      const resource: Resource = { 
        id: this.currentResourceId++, 
        publishDate: new Date(),
        instanceId: "default-instance",
        plantId: 1,
        departmentId: 1,
        resourceId: this.currentResourceId - 1,
        name: res.name,
        description: res.name + " - " + res.resourceType,
        notes: null,
        externalId: null,
        attributesSummary: null,
        setupHours: "0",
        bottleneck: false,
        bufferHours: "0",
        capacityType: "finite",
        drum: false,
        overtimeHourlyCost: "0",
        standardHourlyCost: "0",
        experimentalDispatcher: null,
        normalDispatcher: null,
        workcenter: null,
        canOffload: false,
        canPreemptMaterials: false,
        canPreemptPredecessors: false,
        canWorkOvertime: false,
        compatibilityGroup: null,
        cycleEfficiencyMultiplier: "1",
        headStartHours: "0",
        postActivityRestHours: "0",
        stage: 1,
        transferHours: "0",
        consecutiveSetupTimes: false,
        maxSameSetupHours: "0",
        setupEfficiencyMultiplier: "1",
        setupIncluded: null,
        useOperationSetupTime: false,
        active: true,
        sameCell: false,
        currentProductSetup: null,
        currentSetupCode: null,
        currentSetupNumber: "0",
        resourceType: res.resourceType || null,
        alwaysShowPostProcessing: false,
        attributeCodeTableName: null,
        bottleneckPercent: "0",
        bufferHrs: "0",
        cellName: null,
        disallowDragAndDrops: false,
        excludeFromGantts: false,
        experimentalOptimizeRule: null,
        ganttRowHeightFactor: 1,
        headStartDays: "0",
        imageFileName: null,
        maxQty: "0",
        maxQtyPerCycle: "0",
        maxSameSetupHrs: "0",
        minQty: "0",
        minQtyPerCycle: "0",
        nbrCapabilities: 0,
        normalOptimizeRule: null,
        overlappingOnlineIntervals: 0,
        sequential: false,
        setupCodeTableName: null,
        setupHrs: "0",
        shopViewUsersCount: 0,
        transferHrs: "0",
        workcenterExternalId: null,
        maxVolume: "0"
      };
      this.resources.set(resource.id, resource);
    });

    // Add some sample jobs and operations
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample jobs
    const sampleJobs = [
      {
        name: "Widget Assembly - Batch A",
        customer: "Tech Corp",
        description: "Assembly of 500 widgets for Q1 delivery",
        priority: "high",
        status: "active",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        name: "Motor Housing Production",
        customer: "AutoParts Inc",
        description: "CNC machining of 100 motor housings",
        priority: "medium",
        status: "planned",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
    ];

    sampleJobs.forEach(jobData => {
      const job: ProductionOrder = {
        id: this.currentJobId++,
        orderNumber: `PO-${Date.now()}`,
        name: jobData.name,
        description: jobData.description,
        customerId: null,
        parentOrderId: null,
        orderCategory: "normal",
        priority: jobData.priority,
        status: jobData.status,
        quantity: "1",
        dueDate: jobData.dueDate,

        actualStartDate: null,
        actualEndDate: null,
        itemNumber: null,
        salesOrderId: null,
        productionVersionId: null,
        plantId: 1,
        wipValue: "0",
        actualLaborHours: "0",
        actualMaterialCost: "0",
        actualOverheadCost: "0",
        standardCost: "0",
        costVariance: "0",
        laborRateVariance: "0",
        materialPriceVariance: "0",
        yieldQuantity: "0",
        scrapQuantity: "0",
        reworkQuantity: "0",
        goodQuantity: "0",
        yieldPercentage: "0",
        scrapPercentage: "0",
        reworkPercentage: "0",
        qualityGrade: "A",
        setupTimePlanned: "0",
        setupTimeActual: "0",
        runTimePlanned: "0",
        runTimeActual: "0",
        cleanupTimePlanned: "0",
        cleanupTimeActual: "0",
        totalTimePlanned: "0",
        totalTimeActual: "0",
        batchNumber: null,
        lotNumber: null,
        campaignNumber: null,
        productionLine: null,
        shiftNumber: null,
        operatorId: null,
        supervisorId: null,
        equipmentUsed: [],
        completionPercentage: "0",
        lastOperationCompletedId: null,
        nextOperationDueId: null,
        bottleneckResourceId: null,
        downtimeMinutes: "0",
        efficiencyPercentage: "100",
        oeePercentage: "0",
        firstPassYield: "0",
        inspectionStatus: "pending",
        certificateOfAnalysis: {},
        deviationReports: [],
        correctiveActions: [],
        batchRecordComplete: false,
        releaseApproved: false,
        releaseApprovedBy: null,
        releaseDate: null,
        createdAt: new Date(),
      };
      this.jobs.set(job.id, job);
    });

    // Sample operations for the first job
    const sampleOperations = [
      {
        jobId: 1,
        name: "CNC Machining",
        description: "Machine widget base components",
        status: "in-progress",
        duration: 16,
        requiredCapabilities: [1], // CNC Machine
        assignedResourceId: 1,
        order: 1,
        startTime: new Date(),
        endTime: new Date(Date.now() + 16 * 60 * 60 * 1000),
      },
      {
        jobId: 1,
        name: "Welding",
        description: "Weld frame components",
        status: "planned",
        duration: 8,
        requiredCapabilities: [2], // Welding
        assignedResourceId: 3,
        order: 2,
        startTime: new Date(Date.now() + 16 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        jobId: 1,
        name: "Final Assembly",
        description: "Assemble all components",
        status: "planned",
        duration: 12,
        requiredCapabilities: [3], // Assembly
        assignedResourceId: 4,
        order: 3,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 36 * 60 * 60 * 1000),
      },
      {
        jobId: 1,
        name: "Quality Check",
        description: "Final inspection and testing",
        status: "planned",
        duration: 4,
        requiredCapabilities: [4], // Quality Control
        assignedResourceId: 5,
        order: 4,
        startTime: new Date(Date.now() + 36 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 40 * 60 * 60 * 1000),
      },
    ];

    // Sample operations are now handled by PT Publish tables - removing legacy code
    // sampleOperations.forEach(opData => {
    //   const operation: Operation = {
    //     id: this.currentOperationId++,
    //     jobId: opData.jobId,
    //     name: opData.name,
    //     description: opData.description,
    //     status: opData.status,
    //     duration: opData.duration,
    //     startTime: opData.startTime,
    //     endTime: opData.endTime,
    //     order: opData.order,
    //   };
    //   this.operations.set(operation.id, operation);
    // });
  }

  // Capabilities
  async getCapabilities(): Promise<Capability[]> {
    return Array.from(this.capabilities.values());
  }

  async createCapability(capability: InsertCapability): Promise<Capability> {
    const [newCapability] = await db.insert(ptCapabilities).values(capability).returning();
    return newCapability;
  }

  // Resources
  async getResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  async getResource(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(ptResources).values(resource).returning();
    return newResource;
  }

  async updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined> {
    const existing = this.resources.get(id);
    if (!existing) return undefined;
    
    const updated: Resource = { ...existing, ...resource };
    this.resources.set(id, updated);
    return updated;
  }

  async deleteResource(id: number): Promise<boolean> {
    return this.resources.delete(id);
  }

  // Operations - REDIRECTED TO PT PUBLISH TABLES
  async getOperations(): Promise<Operation[]> {
    console.log("getOperations: Redirecting to PT Publish Job Operations table");
    
    try {
      // Get operations from PT Publish tables
      const ptOperations = await db
        .select()
        .from(ptJobOperations)
        .orderBy(asc(ptJobOperations.id));
      
      console.log("PT Publish operations count:", ptOperations.length);
      
      // Map PT Publish Job Operations to Operation format for backward compatibility
      const mappedOps: Operation[] = ptOperations.map(op => ({
        id: op.id,
        name: op.name || `Operation ${op.id}`,
        description: op.description,
        duration: Number(op.setupHours || 1),
        jobId: Number(op.jobId),
        productionOrderId: Number(op.jobId),
        order: Number(op.id || 0),
        status: op.setupHours === "100" ? 'completed' : 
                op.setupHours && op.setupHours !== "0" ? 'in_progress' : 'planned',
        assignedResourceId: null, // Not available in PT operations
        startTime: op.scheduledStart ? new Date(op.scheduledStart) : null,
        endTime: op.scheduledEnd ? new Date(op.scheduledEnd) : null,
        routingId: null,
        operationName: op.name || `Operation ${op.id}`,
        standardDuration: Number(op.setupHours || 1),
        actualDuration: null,
        workCenterId: null,
        priority: op.locked === true ? 5 : 3,
        completionPercentage: Number(op.setupRunHours || 0),
        qualityCheckRequired: false,
        qualityStatus: null,
        notes: op.notes || null,
        createdAt: op.publishDate || new Date(),
        updatedAt: op.publishDate || new Date()
      } as Operation));
      
      console.log("Successfully mapped PT operations, total:", mappedOps.length);
      return mappedOps;
    } catch (error) {
      console.error("Error in PT Publish getOperations:", error);
      console.error("Error stack:", error.stack);
      return [];
    }
  }



  async deleteOperation(id: number): Promise<boolean> {
    // Delete operation from PT table
    const result = await db.delete(ptJobOperations)
      .where(eq(ptJobOperations.id, id));
    return result.rowCount > 0;
  }

  // Dependencies - removed as we're using PT tables now
  // async getDependencies(): Promise<Dependency[]> {
  //   return await db.select().from(dependencies);
  // }

  // async getDependenciesByOperationId(operationId: number): Promise<Dependency[]> {
  //   return await db.select().from(dependencies)
  //     .where(or(
  //       eq(dependencies.fromDiscreteOperationId, operationId),
  //       eq(dependencies.toDiscreteOperationId, operationId)
  //     ));
  // }

  // async createDependency(dependency: InsertDependency): Promise<Dependency> {
  //   const [newDependency] = await db.insert(dependencies).values(dependency).returning();
  //   return newDependency;
  // }

  // async deleteDependency(id: number): Promise<boolean> {
  //   const result = await db.delete(dependencies).where(eq(dependencies.id, id));
  //   return result.rowCount > 0;
  // }

  async getResourceViews(): Promise<ResourceView[]> {
    return await db.select().from(resourceViews);
  }

  async getResourceView(id: number): Promise<ResourceView | undefined> {
    const [view] = await db.select().from(resourceViews).where(eq(resourceViews.id, id));
    return view;
  }

  async createResourceView(resourceView: InsertResourceView): Promise<ResourceView> {
    const [newResourceView] = await db.insert(resourceViews).values(resourceView).returning();
    return newResourceView;
  }

  async updateResourceView(id: number, resourceView: Partial<InsertResourceView>): Promise<ResourceView | undefined> {
    const [updated] = await db.update(resourceViews)
      .set(resourceView)
      .where(eq(resourceViews.id, id))
      .returning();
    return updated;
  }

  async deleteResourceView(id: number): Promise<boolean> {
    const result = await db.delete(resourceViews).where(eq(resourceViews.id, id));
    return result.rowCount > 0;
  }

  async getDefaultResourceView(): Promise<ResourceView | undefined> {
    const [view] = await db.select().from(resourceViews).where(eq(resourceViews.isDefault, true));
    return view;
  }

  async setDefaultResourceView(id: number): Promise<void> {
    // First, set all existing views to non-default
    await db.update(resourceViews).set({ isDefault: false });
    
    // Then set the specified view as default
    await db.update(resourceViews).set({ isDefault: true }).where(eq(resourceViews.id, id));
  }
}

export class DatabaseStorage {
  // Cache for database schema to avoid repeated expensive queries
  private schemaCache: { data: any[]; timestamp: number } | null = null;
  private readonly SCHEMA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Expose db for WidgetStorage
  get db() {
    return db;
  }
  // Plants
  async getPlants(): Promise<Plant[]> {
    try {
      console.log('Getting plants from database...');
      const result = await db.select().from(ptPlants);
      console.log('Raw query result:', result?.length || 0, 'plants found');
      
      // Transform the result to include computed location field
      const transformedResult = result.map((plant: any) => ({
        ...plant,
        location: plant.city && plant.state 
          ? `${plant.city}, ${plant.state}`
          : plant.city || plant.country || 'Location not specified'
      })) as Plant[];
      
      console.log('Transformed result:', transformedResult?.length || 0, 'plants transformed');
      return transformedResult;
    } catch (error) {
      console.error('Error in getPlants():', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  async getPlant(id: number): Promise<Plant | undefined> {
    const result = await db.select().from(ptPlants).where(eq(ptPlants.id, id)).limit(1);
    return result[0];
  }

  async createPlant(plant: InsertPlant): Promise<Plant> {
    const result = await db.insert(ptPlants).values(plant).returning();
    return result[0];
  }

  async updatePlant(id: number, plant: Partial<InsertPlant>): Promise<Plant | undefined> {
    const result = await db.update(ptPlants).set(plant).where(eq(ptPlants.id, id)).returning();
    return result[0];
  }

  async deletePlant(id: number): Promise<boolean> {
    const result = await db.delete(ptPlants).where(eq(ptPlants.id, id));
    return (result.rowCount || 0) > 0;
  }


  // Departments
  async getDepartments(): Promise<Department[]> {
    const result = await db.select().from(departments).orderBy(asc(departments.name));
    return result;
  }

  async getCapabilities(): Promise<Capability[]> {
    // Using PT Capabilities table (aliased as capabilities in schema)
    const result = await db.select().from(ptCapabilities).orderBy(asc(ptCapabilities.name));
    return result || [];
  }

  async createCapability(capability: InsertCapability): Promise<Capability> {
    const [newCapability] = await db
      .insert(capabilities)
      .values(capability)
      .returning();
    return newCapability;
  }

  async getCapabilityByName(name: string): Promise<Capability | undefined> {
    const [capability] = await db.select().from(ptCapabilities).where(eq(ptCapabilities.name, name));
    return capability || undefined;
  }

  async addResourceCapability(resourceId: number, capabilityId: number): Promise<void> {
    // Check if the relationship already exists to avoid duplicates
    const existing = await db.select()
      .from(ptResources)
      .where(eq(ptResources.id, resourceId));
    
    if (existing.length > 0) {
      const resource = existing[0];
      const currentCapabilities = resource.capabilities as number[] || [];
      
      if (!currentCapabilities.includes(capabilityId)) {
        currentCapabilities.push(capabilityId);
        await db.update(ptResources)
          .set({ capabilities: currentCapabilities })
          .where(eq(ptResources.id, resourceId));
      }
    }
  }

  // Operations - REDIRECTED TO PT PUBLISH TABLES
  async getOperations(): Promise<Operation[]> {
    console.log("getOperations: Redirecting to PT Publish Job Operations table");
    
    try {
      // Get operations from PT Publish tables using raw SQL to avoid column mapping issues
      // Join with departments to get work_center_id based on external_id
      const result = await db.execute(sql`
        SELECT 
          jo.id,
          jo.job_id,
          jo.operation_id,
          jo.name,
          jo.description,
          jo.scheduled_start,
          jo.scheduled_end,
          jo.setup_hours,
          jo.run_hrs,
          jo.post_processing_hours,
          jo.notes,
          jo.publish_date,
          jo.scheduled_primary_work_center_external_id,
          jo.scheduled_resource_id,
          COALESCE(jo.scheduled_resource_id, d.department_id::integer) as work_center_id,
          d.name as department_name
        FROM "ptjoboperations" jo
        LEFT JOIN "ptdepartments" d 
          ON jo.scheduled_primary_work_center_external_id = d.external_id
        ORDER BY jo.id ASC
      `);
      
      const ptOperations = result.rows || [];
      
      console.log("PT Publish operations count:", ptOperations.length);
      if (ptOperations.length > 0) {
        console.log("First operation sample:", ptOperations[0]);
      }
      
      // Map PT Publish Job Operations to Operation format for backward compatibility
      const mappedOps: Operation[] = ptOperations.map(op => ({
        id: op.id,
        name: op.name || `Operation ${op.operation_id}`,
        description: op.description,
        duration: Number(op.setup_hours || 1) * 60, // Convert hours to minutes
        jobId: Number(op.job_id),
        productionOrderId: Number(op.job_id), // Map job_id to production_order_id
        order: op.id, // Use id as order since sequence_number doesn't exist
        status: 'planned' as const, // Default status
        assignedResourceId: op.scheduled_resource_id ? Number(op.scheduled_resource_id) : null, // Use scheduled_resource_id if available
        startTime: op.scheduled_start ? new Date(op.scheduled_start) : null,
        endTime: op.scheduled_end ? new Date(op.scheduled_end) : null,
        routingId: null,
        operationName: op.name || `Operation ${op.operation_id}`,
        standardDuration: Number(op.setup_hours || 1) * 60,
        actualDuration: null,
        workCenterId: op.work_center_id ? Number(op.work_center_id) : null, // Now using department_id from joined ptdepartments table
        priority: 3,
        completionPercentage: 0,
        qualityCheckRequired: false,
        qualityStatus: null,
        notes: op.notes || null,
        createdAt: op.publish_date || new Date(),
        updatedAt: op.publish_date || new Date()
      } as Operation));
      
      console.log("Successfully mapped PT operations, total:", mappedOps.length);
      return mappedOps;
    } catch (error) {
      console.error("Error in PT Publish getOperations:", error);
      console.error("Error stack:", error.stack);
      return [];
    }
  }

  async getResources(): Promise<Resource[]> {
    console.log("getResources: Redirecting to PT Publish Resources table");
    
    try {
      // Get resources from PT Publish Resources table using raw SQL to avoid column issues
      const result = await db.execute(sql`
        SELECT resource_id, name, department_name, plant_name, active, speed_factor, bottleneck, publish_date
        FROM ptResources
        WHERE instance_id = 'BREW-SIM-001'
        ORDER BY name ASC
      `);
      
      const ptResources = result.rows as any[];
      console.log("PT Resources count:", ptResources.length);
      
      // Map PT Publish Resources to Resource format for backward compatibility
      return ptResources.map(res => ({
        id: Number(res.resource_id),
        name: res.name || `Resource ${res.resource_id}`,
        type: res.department_name || 'machine', // Use department name as type
        status: res.active ? 'active' : 'inactive',
        capabilities: null, // PT resources don't have capabilities array
        capacity: null, // Not available in PT resources
        efficiency: res.speed_factor ? Number(res.speed_factor) * 100 : null,
        costPerHour: null, // Not available in PT resources
        maintenanceSchedule: null, // Not available in PT resources
        location: res.plant_name || null,
        createdAt: res.publish_date || new Date(),
        updatedAt: res.publish_date || new Date()
      } as Resource));
    } catch (error) {
      console.error("Error fetching PT resources:", error);
      // Fallback to empty array if error
      return [];
    }
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(ptResources).where(eq(ptResources.id, id));
    return resource || undefined;
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db
      .insert(resources)
      .values(resource)
      .returning();
    return newResource;
  }

  async updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined> {
    const [updatedResource] = await db
      .update(resources)
      .set(resource)
      .where(eq(ptResources.id, id))
      .returning();
    return updatedResource || undefined;
  }

  async deleteResource(id: number): Promise<boolean> {
    // First remove all plant-resource associations
    await db.delete(plantResources).where(eq(plantResources.resourceId, id));
    
    const result = await db.delete(ptResources).where(eq(ptResources.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Plant Resources (Junction Table)
  async getResourcesByPlantId(plantId: number): Promise<Resource[]> {
    const result = await db
      .select({ resource: resources })
      .from(plantResources)
      .innerJoin(resources, eq(plantResources.resourceId, resources.id))
      .where(eq(plantResources.plantId, plantId));
    
    return result.map(r => r.resource);
  }

  async getPlantsByResourceId(resourceId: number): Promise<Plant[]> {
    const result = await db
      .select({ plant: ptPlants })
      .from(plantResources)
      .innerJoin(ptPlants, eq(plantResources.plantId, ptPlants.id))
      .where(eq(plantResources.resourceId, resourceId));
    
    return result.map(r => r.plant);
  }

  async assignResourceToPlant(plantId: number, resourceId: number, isPrimary: boolean = true): Promise<PlantResource> {
    const [assignment] = await db
      .insert(plantResources)
      .values({ plantId, resourceId, isPrimary })
      .returning();
    return assignment;
  }

  async removeResourceFromPlant(plantId: number, resourceId: number): Promise<boolean> {
    const result = await db
      .delete(plantResources)
      .where(and(
        eq(plantResources.plantId, plantId),
        eq(plantResources.resourceId, resourceId)
      ));
    return (result.rowCount || 0) > 0;
  }

  async updatePlantResourceAssignment(plantId: number, resourceId: number, updates: Partial<InsertPlantResource>): Promise<PlantResource | undefined> {
    const [updated] = await db
      .update(plantResources)
      .set(updates)
      .where(and(
        eq(plantResources.plantId, plantId),
        eq(plantResources.resourceId, resourceId)
      ))
      .returning();
    return updated || undefined;
  }

  async getJobs(): Promise<any[]> {
    console.log("getJobs: Using working ptjobs table");
    
    try {
      // Get jobs directly from ptjobs table (the working table with 49 records)
      const result = await this.db.execute(sql`
        SELECT 
          id,
          job_id,
          order_number,
          name,
          description,
          priority,
          scheduled_start_date_time as start_date,
          scheduled_end_date_time as due_date,
          product,
          qty,
          publish_date
        FROM ptjobs
        ORDER BY order_number ASC
      `);
      
      console.log(`PT Jobs count: ${result.rows.length}`);
      
      return result.rows.map((row: any) => ({
        id: parseInt(row.id) || 0,
        orderNumber: row.order_number || '',
        name: row.name || `Job ${row.id}`,
        description: row.description || '',
        status: 'active',
        startDate: row.start_date,
        dueDate: row.due_date,
        priority: row.priority,
        product: row.product,
        quantity: row.qty,
        publishDate: row.publish_date
      }));
      
    } catch (error) {
      console.error('Error fetching jobs from ptjobs table:', error);
      return [];
    }
  }

  async getJob(id: number): Promise<ProductionOrder | undefined> {
    const [job] = await db.select().from(productionOrders).where(eq(productionOrders.id, id));
    return job || undefined;
  }

  async createJob(job: InsertProductionOrder): Promise<ProductionOrder> {
    const [newJob] = await db
      .insert(productionOrders)
      .values(job)
      .returning();
    return newJob;
  }

  async updateJob(id: number, job: Partial<InsertProductionOrder>): Promise<ProductionOrder | undefined> {
    const [updatedJob] = await db
      .update(productionOrders)
      .set(job)
      .where(eq(productionOrders.id, id))
      .returning();
    return updatedJob || undefined;
  }

  async deleteJob(id: number): Promise<boolean> {
    // Note: PT Job Operations are managed separately in PT tables
    // We only delete the production order here
    
    const result = await db.delete(productionOrders).where(eq(productionOrders.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Production Orders - REDIRECTED TO PT PUBLISH TABLES
  async getProductionOrders(): Promise<ProductionOrder[]> {
    console.log("getProductionOrders: Fetching from production_orders table");
    
    try {
      // Get production orders from the local production_orders table
      const orders = await db
        .select()
        .from(productionOrders)
        .orderBy(asc(productionOrders.dueDate));
      
      // Map orders to ProductionOrder format
      const mappedOrders: ProductionOrder[] = orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.order_number || `PO-${order.id}`,
        name: order.name || order.product_name || 'Unknown Order',
        description: order.description || '',
        customerId: null,
        parentOrderId: null,
        orderCategory: 'normal',
        priority: 'medium',
        status: order.scheduled_start && new Date(order.scheduled_start) < new Date() ? 'in_progress' : 'released',
        quantity: order.quantity || '1',
        dueDate: order.due_date ? new Date(order.due_date) : null,
        actualStartDate: order.actual_start_date ? new Date(order.actual_start_date) : null,
        actualEndDate: order.actual_end_date ? new Date(order.actual_end_date) : null,
        itemNumber: order.product_name,
        salesOrderId: null,
        productionVersionId: null,
        plantId: order.plant_id || 1,
        wipValue: '0',
        actualLaborHours: '0',
        actualMaterialCost: '0',
        actualOverheadCost: '0',
        standardCost: '0',
        costVariance: '0',
        laborRateVariance: '0',
        materialPriceVariance: '0',
        yieldQuantity: '0',
        scrapQuantity: '0',
        reworkQuantity: '0',
        goodQuantity: order.quantity || '0',
        yieldPercentage: '100',
        scrapPercentage: '0',
        reworkPercentage: '0',
        qualityGrade: 'A',
        setupTimePlanned: '0',
        setupTimeActual: '0',
        runTimePlanned: '0',
        runTimeActual: '0',
        cleanupTimePlanned: '0',
        cleanupTimeActual: '0',
        totalTimePlanned: '0',
        totalTimeActual: '0',
        batchNumber: null,
        lotNumber: null,
        campaignNumber: null,
        productionLine: null,
        shiftNumber: null,
        operatorId: null,
        supervisorId: null,
        equipmentUsed: [],
        completionPercentage: '0',
        lastOperationCompletedId: null,
        nextOperationDueId: null,
        bottleneckResourceId: null,
        downtimeMinutes: '0',
        efficiencyPercentage: '100',
        oeePercentage: '0',
        firstPassYield: '0',
        inspectionStatus: 'pending',
        certificateOfAnalysis: {},
        deviationReports: null,
        correctiveActions: null,
        batchRecordComplete: false,
        releaseApproved: false,
        releaseApprovedBy: null,
        releaseDate: null,
        createdAt: order.created_at || new Date()
      }));
      
      console.log("Successfully fetched PT Manufacturing Orders, total:", mappedOrders.length);
      return mappedOrders;
    } catch (error) {
      console.error("Failed to fetch production orders:", error.message);
      return [];
    }
  }

  async getProductionOrder(id: number): Promise<ProductionOrder | undefined> {
    const [order] = await db.select().from(productionOrders).where(eq(productionOrders.id, id));
    return order || undefined;
  }

  async createProductionOrder(order: InsertProductionOrder): Promise<ProductionOrder> {
    const [newOrder] = await db
      .insert(productionOrders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updateProductionOrder(id: number, order: Partial<InsertProductionOrder>): Promise<ProductionOrder | undefined> {
    const [updatedOrder] = await db
      .update(productionOrders)
      .set(order)
      .where(eq(productionOrders.id, id))
      .returning();
    return updatedOrder || undefined;
  }

  async deleteProductionOrder(id: number): Promise<boolean> {
    const result = await db.delete(productionOrders).where(eq(productionOrders.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Planned Orders CRUD Operations
  async getPlannedOrders(): Promise<any[]> {
    return await db.select().from(ptPlannedOrders).orderBy(desc(ptPlannedOrders.createdAt));
  }

  async getPlannedOrder(id: number): Promise<any | undefined> {
    const [order] = await db
      .select()
      .from(ptPlannedOrders)
      .where(eq(ptPlannedOrders.id, id));
    return order || undefined;
  }

  async createPlannedOrder(order: any): Promise<any> {
    const [newOrder] = await db
      .insert(ptPlannedOrders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updatePlannedOrder(id: number, order: any): Promise<any | undefined> {
    const [updatedOrder] = await db
      .update(ptPlannedOrders)
      .set(order)
      .where(eq(ptPlannedOrders.id, id))
      .returning();
    return updatedOrder || undefined;
  }

  async deletePlannedOrder(id: number): Promise<boolean> {
    const result = await db.delete(ptPlannedOrders).where(eq(ptPlannedOrders.id, id));
    return (result.rowCount || 0) > 0;
  }

  // PT Publish Methods - Reading from PT Publish tables
  async getPtJobs(): Promise<any[]> {
    console.log("getPtJobs: Using working ptjobs table");
    // Get data directly from ptjobs table (the working table with 49 records)
    const jobs = await db
      .select()
      .from(ptJobs)
      .orderBy(asc(ptJobs.orderNumber));
    
    console.log(`PT Jobs from storage: ${jobs.length}`);
    
    // Map ptjobs to job format
    return jobs.map(job => ({
      jobId: job.jobId,
      name: job.name,
      product: job.product,
      description: job.description,
      quantity: job.qty,
      needDateTime: job.needDateTime,
      scheduledStart: job.scheduledStartDateTime,
      scheduledEnd: job.scheduledEndDateTime,
      orderNumber: job.orderNumber,
      priority: job.priority,
      publishDate: job.publishDate
    }));
  }

  async getPtManufacturingOrders(): Promise<PtManufacturingOrder[]> {
    // Return all PT manufacturing orders
    return await db
      .select()
      .from(ptManufacturingOrders)
      .orderBy(asc(ptManufacturingOrders.manufacturingOrderId));
  }

  async getPtJobOperations(): Promise<PtJobOperation[]> {
    const latestPublish = await db
      .select({ maxDate: sql`MAX(publish_date)`.as('maxDate') })
      .from(ptJobOperations)
      .limit(1);
    
    const publishDate = latestPublish[0]?.maxDate;
    if (!publishDate) {
      return [];
    }

    return await db
      .select()
      .from(ptJobOperations)
      .where(eq(ptJobOperations.publishDate, new Date(publishDate)))
      .orderBy(asc(ptJobOperations.sequenceNumber));
  }

  async getPtResources(): Promise<PtResource[]> {
    // Return all PT resources ordered by name
    return await db
      .select()
      .from(ptResources)
      .orderBy(asc(ptResources.name));
  }

  async getPtJobActivities(): Promise<PtJobActivity[]> {
    const latestPublish = await db
      .select({ maxDate: sql`MAX(publish_date)`.as('maxDate') })
      .from(ptJobActivities)
      .limit(1);
    
    const publishDate = latestPublish[0]?.maxDate;
    if (!publishDate) {
      return [];
    }

    return await db
      .select()
      .from(ptJobActivities)
      .where(eq(ptJobActivities.publishDate, new Date(publishDate)))
      .orderBy(asc(ptJobActivities.scheduledStart));
  }

  // PT Publish CRUD Operations - CREATE, UPDATE, DELETE

  // PT Publish Jobs CRUD
  async getPtJob(jobId: number): Promise<PtJob | undefined> {
    const result = await db
      .select()
      .from(ptJobs)
      .where(eq(ptJobs.jobId, jobId))
      .limit(1);
    return result[0];
  }

  async createPtJob(job: Partial<PtJob>): Promise<PtJob> {
    // Extract non-date fields
    const { publishDate, entryDate, needDateTime, scheduledStartDateTime, scheduledEndDateTime, ...otherFields } = job;
    
    const [newJob] = await db.insert(ptJobs).values({
      ...otherFields,
      publishDate: publishDate ? new Date(publishDate as any) : new Date(),
      entryDate: entryDate ? new Date(entryDate as any) : new Date(),
      needDateTime: needDateTime ? new Date(needDateTime as any) : undefined,
      scheduledStartDateTime: scheduledStartDateTime ? new Date(scheduledStartDateTime as any) : undefined,
      scheduledEndDateTime: scheduledEndDateTime ? new Date(scheduledEndDateTime as any) : undefined,
      instanceId: job.instanceId || 'DEFAULT-INSTANCE'
    }).returning();
    return newJob;
  }

  async updatePtJob(jobId: number, job: Partial<PtJob>): Promise<PtJob | undefined> {
    const [updated] = await db
      .update(ptJobs)
      .set(job)
      .where(eq(ptJobs.jobId, jobId))
      .returning();
    return updated;
  }

  async deletePtJob(jobId: number): Promise<boolean> {
    const result = await db
      .delete(ptJobs)
      .where(eq(ptJobs.jobId, jobId));
    return result.rowCount > 0;
  }

  // PT Publish Manufacturing Orders CRUD
  async getPtManufacturingOrder(orderId: number): Promise<PtManufacturingOrder | undefined> {
    const result = await db
      .select()
      .from(ptManufacturingOrders)
      .where(eq(ptManufacturingOrders.manufacturingOrderId, orderId))
      .limit(1);
    return result[0];
  }

  async createPtManufacturingOrder(order: Partial<PtManufacturingOrder>): Promise<PtManufacturingOrder> {
    // Extract date fields separately
    const { publishDate, releaseDate, dueDate, ...otherFields } = order;
    
    // Only include fields that match the actual table schema
    const validFields = {
      manufacturingOrderId: otherFields.manufacturingOrderId,
      jobId: otherFields.jobId,
      moNumber: otherFields.moNumber || otherFields.orderNumber,
      itemId: otherFields.itemId,
      quantity: otherFields.quantity,
      status: otherFields.status,
      priority: otherFields.priority,
      notes: otherFields.notes,
    };
    
    const [newOrder] = await db.insert(ptManufacturingOrders).values({
      ...validFields,
      publishDate: publishDate ? new Date(publishDate as any) : new Date(),
      releaseDate: releaseDate ? new Date(releaseDate as any) : undefined,
      dueDate: dueDate ? new Date(dueDate as any) : undefined,
      instanceId: order.instanceId || 'DEFAULT-INSTANCE'
    }).returning();
    return newOrder;
  }

  async updatePtManufacturingOrder(orderId: number, order: Partial<PtManufacturingOrder>): Promise<PtManufacturingOrder | undefined> {
    const [updated] = await db
      .update(ptManufacturingOrders)
      .set(order)
      .where(eq(ptManufacturingOrders.manufacturingOrderId, orderId))
      .returning();
    return updated;
  }

  async deletePtManufacturingOrder(orderId: number): Promise<boolean> {
    const result = await db
      .delete(ptManufacturingOrders)
      .where(eq(ptManufacturingOrders.manufacturingOrderId, orderId));
    return result.rowCount > 0;
  }

  // PT Publish Job Operations CRUD
  async getPtJobOperation(operationId: number): Promise<PtJobOperation | undefined> {
    const result = await db
      .select()
      .from(ptJobOperations)
      .where(eq(ptJobOperations.jobOperationId, operationId))
      .limit(1);
    return result[0];
  }

  async createPtJobOperation(operation: Partial<PtJobOperation>): Promise<PtJobOperation> {
    const [newOperation] = await db.insert(ptJobOperations).values({
      ...operation,
      publishDate: operation.publishDate || new Date()
    }).returning();
    return newOperation;
  }

  async updatePtJobOperation(operationId: number, operation: Partial<PtJobOperation>): Promise<PtJobOperation | undefined> {
    const [updated] = await db
      .update(ptJobOperations)
      .set(operation)
      .where(eq(ptJobOperations.jobOperationId, operationId))
      .returning();
    return updated;
  }

  async deletePtJobOperation(operationId: number): Promise<boolean> {
    const result = await db
      .delete(ptJobOperations)
      .where(eq(ptJobOperations.jobOperationId, operationId));
    return result.rowCount > 0;
  }

  // PT Publish Resources CRUD
  async getPtResource(resourceId: number): Promise<PtResource | undefined> {
    const result = await db
      .select()
      .from(ptResources)
      .where(eq(ptResources.resourceId, resourceId))
      .limit(1);
    return result[0];
  }

  async createPtResource(resource: Partial<PtResource>): Promise<PtResource> {
    // Extract date field and only include valid fields for the table
    const { publishDate, ...otherFields } = resource;
    
    // Remove any fields that don't exist in the table
    const { 
      resource_type, 
      resource_group, 
      capacity_per_hour,
      efficiency_percent,
      utilization_percent,
      cost_per_hour,
      setup_cost_per_hour,
      finite_capacity,
      can_run_multiple_jobs,
      max_jobs_parallel,
      priority,
      color_code,
      available,
      down_reason,
      ...validFields 
    } = otherFields as any;
    
    const [newResource] = await db.insert(ptResources).values({
      ...validFields,
      publishDate: publishDate ? new Date(publishDate as any) : new Date(),
      instanceId: resource.instanceId || 'DEFAULT-INSTANCE',
      plantId: resource.plantId || 1,
      departmentId: resource.departmentId || 1,
      resourceId: resource.resourceId
    }).returning();
    return newResource;
  }

  async updatePtResource(resourceId: number, resource: Partial<PtResource>): Promise<PtResource | undefined> {
    const [updated] = await db
      .update(ptResources)
      .set(resource)
      .where(eq(ptResources.resourceId, resourceId))
      .returning();
    return updated;
  }

  async deletePtResource(resourceId: number): Promise<boolean> {
    const result = await db
      .delete(ptResources)
      .where(eq(ptResources.resourceId, resourceId));
    return result.rowCount > 0;
  }

  // PT Publish Job Activities CRUD
  async getPtJobActivity(activityId: number): Promise<PtJobActivity | undefined> {
    const result = await db
      .select()
      .from(ptJobActivities)
      .where(eq(ptJobActivities.jobActivityId, activityId))
      .limit(1);
    return result[0];
  }

  async createPtJobActivity(activity: Partial<PtJobActivity>): Promise<PtJobActivity> {
    const [newActivity] = await db.insert(ptJobActivities).values({
      ...activity,
      publishDate: activity.publishDate || new Date()
    }).returning();
    return newActivity;
  }

  async updatePtJobActivity(activityId: number, activity: Partial<PtJobActivity>): Promise<PtJobActivity | undefined> {
    const [updated] = await db
      .update(ptJobActivities)
      .set(activity)
      .where(eq(ptJobActivities.jobActivityId, activityId))
      .returning();
    return updated;
  }

  async deletePtJobActivity(activityId: number): Promise<boolean> {
    const result = await db
      .delete(ptJobActivities)
      .where(eq(ptJobActivities.jobActivityId, activityId));
    return result.rowCount > 0;
  }



  async getOperationsByJobId(jobId: number): Promise<Operation[]> {
    return this.getOperationsByProductionOrderId(jobId);
  }

  async getOperationsByProductionOrderId(productionOrderId: number): Promise<Operation[]> {
    // Get operations from PT Publish tables  
    const ptOps = await db.select().from(ptJobOperations).where(eq(ptJobOperations.jobId, productionOrderId));
    
    // Convert to the legacy Operation interface for backwards compatibility
    const combinedOps: Operation[] = ptOps.map(op => ({
      id: op.id,
      name: op.name || `Operation ${op.operationId}`,
      description: op.description,
      duration: parseFloat(op.cycleHrs || '60'), // Convert hours to minutes
      jobId: Number(op.jobId),
      productionOrderId: Number(op.jobId),
      order: Number(op.sequenceNumber || 0),
      status: op.percentFinished === 100 ? 'completed' : 
              op.percentFinished > 0 ? 'in_progress' : 'planned',
      assignedResourceId: op.defaultResourceId,
      startTime: op.scheduledStart,
      endTime: op.scheduledEnd,
      routingId: op.routingId,
      operationName: op.name,
      standardDuration: parseFloat(op.cycleHrs || '60'),
      actualDuration: parseFloat(op.actualCycleHrs || '0') || null,
      workCenterId: op.defaultResourceId,
      priority: op.priority || 3,
      completionPercentage: op.percentFinished || 0,
      qualityCheckRequired: op.qualityCheckRequired || false,
      qualityStatus: op.qualityCheckStatus,
      notes: op.notes,
      createdAt: op.publishDate || new Date(),
      updatedAt: op.publishDate || new Date()
    } as Operation));
    
    return combinedOps;
  }

  async getOperation(id: number): Promise<Operation | undefined> {
    // Get operation from PT Publish table
    const [ptOp] = await db.select().from(ptJobOperations).where(eq(ptJobOperations.id, id));
    if (ptOp) {
      return {
        id: ptOp.id,
        name: ptOp.name || `Operation ${ptOp.operationId}`,
        description: ptOp.description,
        duration: parseFloat(ptOp.cycleHrs || '60'), // Convert hours to minutes
        jobId: Number(ptOp.jobId),
        productionOrderId: Number(ptOp.jobId),
        order: Number(ptOp.sequenceNumber || 0),
        status: ptOp.percentFinished === 100 ? 'completed' : 
                ptOp.percentFinished > 0 ? 'in_progress' : 'planned',
        assignedResourceId: ptOp.defaultResourceId,
        startTime: ptOp.scheduledStart,
        endTime: ptOp.scheduledEnd,
        routingId: ptOp.routingId,
        operationName: ptOp.name,
        standardDuration: parseFloat(ptOp.cycleHrs || '60'),
        actualDuration: parseFloat(ptOp.actualCycleHrs || '0') || null,
        workCenterId: ptOp.defaultResourceId,
        priority: ptOp.priority || 3,
        completionPercentage: ptOp.percentFinished || 0,
        qualityCheckRequired: ptOp.qualityCheckRequired || false,
        qualityStatus: ptOp.qualityCheckStatus,
        notes: ptOp.notes,
        createdAt: ptOp.publishDate || new Date(),
        updatedAt: ptOp.publishDate || new Date()
      } as Operation;
    }
    
    return undefined;
  }

  // Create operation - using PT Publish tables
  async createOperation(operation: InsertOperation): Promise<Operation> {
    // Map to PT Job Operations structure
    const ptOp = {
      jobId: operation.jobId || operation.productionOrderId || 1,
      operationId: `OP-${Date.now()}`,
      name: operation.name,
      description: operation.description,
      cycleHrs: String(operation.duration || 60),
      sequenceNumber: operation.order || 1,
      percentFinished: operation.status === 'completed' ? 100 : 0,
      scheduledStart: operation.startTime,
      scheduledEnd: operation.endTime,
      defaultResourceId: operation.assignedResourceId,
      routingId: operation.routingId,
      priority: operation.priority || 3,
      notes: operation.notes,
      publishDate: new Date()
    };
    
    const [newOp] = await db.insert(ptJobOperations).values(ptOp).returning();
    return {
      id: newOp.id,
      name: newOp.name || `Operation ${newOp.operationId}`,
      description: newOp.description,
      duration: parseFloat(newOp.cycleHrs || '60'),
      jobId: Number(newOp.jobId),
      productionOrderId: Number(newOp.jobId),
      order: Number(newOp.sequenceNumber || 0),
      status: newOp.percentFinished === 100 ? 'completed' : 
              newOp.percentFinished > 0 ? 'in_progress' : 'planned',
      assignedResourceId: newOp.defaultResourceId,
      startTime: newOp.scheduledStart,
      endTime: newOp.scheduledEnd,
      routingId: newOp.routingId,
      operationName: newOp.name,
      standardDuration: parseFloat(newOp.cycleHrs || '60'),
      actualDuration: parseFloat(newOp.actualCycleHrs || '0') || null,
      workCenterId: newOp.defaultResourceId,
      priority: newOp.priority || 3,
      completionPercentage: newOp.percentFinished || 0,
      qualityCheckRequired: newOp.qualityCheckRequired || false,
      qualityStatus: newOp.qualityCheckStatus,
      notes: newOp.notes,
      createdAt: newOp.publishDate || new Date(),
      updatedAt: newOp.publishDate || new Date()
    } as Operation;
  }

  // Simple Bryntum operation update - just update the scheduled times
  async updateBryntumOperation(id: number, updates: {
    assignedResourceId?: number;
    startTime?: string;
    endTime?: string;
  }): Promise<void> {
    try {
      // Update operation schedule in ptjoboperations table
      const updateData: any = {};
      
      if (updates.startTime) {
        updateData.scheduled_start = updates.startTime;
      }
      if (updates.endTime) {
        updateData.scheduled_end = updates.endTime;
      }
      
      if (Object.keys(updateData).length > 0) {
        await db.update(ptJobOperations)
          .set(updateData)
          .where(eq(ptJobOperations.id, id));
      }
      
      // If resource is being reassigned, update in ptjobresources
      if (updates.assignedResourceId) {
        // The ptjobresources table has default_resource_id field
        await db.execute(sql`
          UPDATE ptjobresources 
          SET default_resource_id = ${updates.assignedResourceId}
          WHERE operation_id = ${id}
        `);
      }
    } catch (error) {
      console.error('Error updating Bryntum operation:', error);
      throw error;
    }
  }

  // Update operation - using PT Publish tables
  async updateOperation(id: number, operation: Partial<InsertOperation> | any): Promise<Operation | undefined> {
    // Update in PT Job Operations table
    const updateData: any = {};
    
    // Handle both formats - old Operation format and new Bryntum format
    if (operation.assignedResourceId !== undefined) {
      // This is coming from Bryntum drag-drop - need to update in ptjobresources table
      // We'll handle resource assignment separately
    }
    if (operation.startTime !== undefined) {
      updateData.scheduled_start = operation.startTime;
    }
    if (operation.endTime !== undefined) {
      updateData.scheduled_end = operation.endTime;
    }
    
    // Handle standard operation fields
    if (operation.name !== undefined) updateData.name = operation.name;
    if (operation.description !== undefined) updateData.description = operation.description;
    if (operation.duration !== undefined) updateData.cycleHrs = String(operation.duration);
    if (operation.order !== undefined) updateData.sequenceNumber = operation.order;
    if (operation.status !== undefined) {
      updateData.percentFinished = operation.status === 'completed' ? 100 : 
                                   operation.status === 'in_progress' ? 50 : 0;
    }
    if (operation.routingId !== undefined) updateData.routingId = operation.routingId;
    if (operation.priority !== undefined) updateData.priority = operation.priority;
    if (operation.notes !== undefined) updateData.notes = operation.notes;
    
    updateData.publishDate = new Date();
    
    const [updated] = await db.update(ptJobOperations)
      .set(updateData)
      .where(eq(ptJobOperations.id, id))
      .returning();
    
    if (updated) {
      return {
        id: updated.id,
        name: updated.name || `Operation ${updated.operationId}`,
        description: updated.description,
        duration: parseFloat(updated.cycleHrs || '60'),
        jobId: Number(updated.jobId),
        productionOrderId: Number(updated.jobId),
        order: Number(updated.sequenceNumber || 0),
        status: updated.percentFinished === 100 ? 'completed' : 
                updated.percentFinished > 0 ? 'in_progress' : 'planned',
        assignedResourceId: updated.defaultResourceId,
        startTime: updated.scheduledStart,
        endTime: updated.scheduledEnd,
        routingId: updated.routingId,
        operationName: updated.name,
        standardDuration: parseFloat(updated.cycleHrs || '60'),
        actualDuration: parseFloat(updated.actualCycleHrs || '0') || null,
        workCenterId: updated.defaultResourceId,
        priority: updated.priority || 3,
        completionPercentage: updated.percentFinished || 0,
        qualityCheckRequired: updated.qualityCheckRequired || false,
        qualityStatus: updated.qualityCheckStatus,
        notes: updated.notes,
        createdAt: updated.publishDate || new Date(),
        updatedAt: updated.publishDate || new Date()
      } as Operation;
    }
    
    return undefined;
  }

  async rescheduleOperation(id: number, params: { resourceId: string; startDate: Date; endDate?: Date }): Promise<any> {
    console.log('Reschedule operation called:', { id, params });
    
    try {
      // First, check if this is a PT Job Operation
      const [ptOperation] = await db
        .select()
        .from(ptJobOperations)
        .where(eq(ptJobOperations.id, id));
      
      if (ptOperation) {
        console.log('Found PT operation to reschedule:', ptOperation.name);
        
        // Calculate end time if not provided and we have duration
        let endTime = params.endDate;
        if (!endTime && ptOperation.cycleHrs) {
          const durationMs = parseFloat(ptOperation.cycleHrs) * 60 * 60 * 1000; // Convert hours to milliseconds
          endTime = new Date(params.startDate.getTime() + durationMs);
        }
        
        // Find the resource by external_id to get the resource ID
        const [resource] = await db
          .select()
          .from(ptResources)
          .where(eq(ptResources.externalId, params.resourceId));
        
        if (!resource) {
          console.error('Resource not found for external_id:', params.resourceId);
          return {
            id,
            success: false,
            error: 'Resource not found'
          };
        }
        
        // Update the PT job operation
        const [updatedPtOp] = await db
          .update(ptJobOperations)
          .set({
            scheduledStart: params.startDate,
            scheduledEnd: endTime,
            defaultResourceId: resource.id
          })
          .where(eq(ptJobOperations.id, id))
          .returning();
        
        // Also update the related job activities if they exist
        const jobActivities = await db
          .select()
          .from(ptJobActivities)
          .where(eq(ptJobActivities.operationId, id));
        
        for (const activity of jobActivities) {
          await db
            .update(ptJobActivities)
            .set({
              scheduledStartDate: params.startDate,
              scheduledEndDate: endTime
            })
            .where(eq(ptJobActivities.jobActivityId, activity.jobActivityId));
        }
        
        // Update job resources assignment
        await db
          .update(ptJobResources)
          .set({
            defaultResourceId: resource.id
          })
          .where(eq(ptJobResources.operationId, id));
        
        console.log('Successfully rescheduled PT operation');
        return {
          id,
          startTime: params.startDate,
          endTime,
          resourceId: params.resourceId,
          success: true,
          operation: updatedPtOp
        };
      }
      
      // Fallback: Try to update legacy operation tables
      const operation = await this.getOperation(id);
      if (operation) {
        console.log('Found legacy operation to reschedule:', operation.name);
        
        // Calculate end time if not provided and we have duration
        let endTime = params.endDate;
        if (!endTime && operation.duration) {
          endTime = new Date(params.startDate.getTime() + operation.duration * 60 * 1000);
        }
        
        const updated = await this.updateOperation(id, {
          startTime: params.startDate,
          endTime,
          assignedResourceId: params.resourceId
        });
        
        if (updated) {
          console.log('Successfully rescheduled legacy operation');
          return {
            id,
            startTime: params.startDate,
            endTime,
            resourceId: params.resourceId,
            success: true
          };
        }
      }
      
      console.log('Failed to reschedule operation - not found in any table');
      return {
        id,
        success: false,
        error: 'Operation not found'
      };
    } catch (error) {
      console.error('Error in rescheduleOperation:', error);
      return {
        id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // New discrete operations methods - REDIRECTED TO PT PUBLISH TABLES
  async getDiscreteOperations(): Promise<DiscreteOperation[]> {
    console.log("getDiscreteOperations: Redirecting to PT Publish Job Operations table");
    
    // Get operations from PT Publish tables (filter for discrete type)
    const ptOperations = await db
      .select()
      .from(ptJobOperations)
      .orderBy(asc(ptJobOperations.sequenceNumber));
    
    // Map PT Publish Job Operations to DiscreteOperation format
    return ptOperations.map(op => ({
      id: op.id,
      routingId: op.routingId || null,
      productionOrderId: Number(op.jobId),
      operationName: op.name || `Operation ${op.operationId}`,
      description: op.description,
      status: op.percentFinished === 100 ? 'completed' : 
              op.percentFinished > 0 ? 'in_progress' : 'planned',
      standardDuration: Number(op.cycleHrs || 1),
      actualDuration: Number(op.actualCycleHrs || null),
      startTime: op.scheduledStart ? new Date(op.scheduledStart) : null,
      endTime: op.scheduledEnd ? new Date(op.scheduledEnd) : null,
      sequenceNumber: Number(op.sequenceNumber || 0),
      workCenterId: op.defaultResourceId || null,
      priority: op.priority || 3,
      completionPercentage: Number(op.percentFinished || 0),
      qualityCheckRequired: op.qualityCheckRequired || false,
      qualityStatus: op.qualityCheckStatus || null,
      notes: op.notes || null,
      createdAt: op.publishDate || new Date(),
      updatedAt: op.publishDate || new Date()
    } as DiscreteOperation));
  }

  async getDiscreteOperation(id: number): Promise<DiscreteOperation | undefined> {
    // Get from PT Publish table
    const [ptOp] = await db.select().from(ptJobOperations).where(eq(ptJobOperations.id, id));
    if (!ptOp) return undefined;
    
    return {
      id: ptOp.id,
      routingId: ptOp.routingId || null,
      productionOrderId: Number(ptOp.jobId),
      operationName: ptOp.name || `Operation ${ptOp.operationId}`,
      description: ptOp.description,
      status: ptOp.percentFinished === 100 ? 'completed' : 
              ptOp.percentFinished > 0 ? 'in_progress' : 'planned',
      standardDuration: Number(ptOp.cycleHrs || 1),
      actualDuration: Number(ptOp.actualCycleHrs || null),
      startTime: ptOp.scheduledStart ? new Date(ptOp.scheduledStart) : null,
      endTime: ptOp.scheduledEnd ? new Date(ptOp.scheduledEnd) : null,
      sequenceNumber: Number(ptOp.sequenceNumber || 0),
      workCenterId: ptOp.defaultResourceId || null,
      priority: ptOp.priority || 3,
      completionPercentage: Number(ptOp.percentFinished || 0),
      qualityCheckRequired: ptOp.qualityCheckRequired || false,
      qualityStatus: ptOp.qualityCheckStatus || null,
      notes: ptOp.notes || null,
      createdAt: ptOp.publishDate || new Date(),
      updatedAt: ptOp.publishDate || new Date()
    } as DiscreteOperation;
  }

  async createDiscreteOperation(operation: InsertDiscreteOperation): Promise<DiscreteOperation> {
    // Create in PT Publish table
    const ptOp = {
      jobId: operation.productionOrderId || 1,
      operationId: `OP-${Date.now()}`,
      name: operation.operationName,
      description: operation.description,
      cycleHrs: String(operation.standardDuration || 1),
      sequenceNumber: operation.sequenceNumber || 1,
      percentFinished: operation.status === 'completed' ? 100 : 
                      operation.status === 'in_progress' ? 50 : 0,
      scheduledStart: operation.startTime,
      scheduledEnd: operation.endTime,
      defaultResourceId: operation.workCenterId,
      routingId: operation.routingId,
      priority: operation.priority || 3,
      notes: operation.notes,
      qualityCheckRequired: operation.qualityCheckRequired,
      qualityCheckStatus: operation.qualityStatus,
      publishDate: new Date()
    };
    
    const [newOp] = await db.insert(ptJobOperations).values(ptOp).returning();
    return this.getDiscreteOperation(newOp.id);
  }

  async updateDiscreteOperation(id: number, operation: Partial<InsertDiscreteOperation>): Promise<DiscreteOperation | undefined> {
    console.log(`Storage: Updating discrete operation ${id} with:`, operation);
    
    // Update in PT Publish table
    const updateData: any = {};
    
    if (operation.operationName !== undefined) updateData.name = operation.operationName;
    if (operation.description !== undefined) updateData.description = operation.description;
    if (operation.standardDuration !== undefined) updateData.cycleHrs = String(operation.standardDuration);
    if (operation.sequenceNumber !== undefined) updateData.sequenceNumber = operation.sequenceNumber;
    if (operation.status !== undefined) {
      updateData.percentFinished = operation.status === 'completed' ? 100 : 
                                   operation.status === 'in_progress' ? 50 : 0;
    }
    if (operation.startTime !== undefined) updateData.scheduledStart = operation.startTime;
    if (operation.endTime !== undefined) updateData.scheduledEnd = operation.endTime;
    if (operation.workCenterId !== undefined) updateData.defaultResourceId = operation.workCenterId;
    if (operation.routingId !== undefined) updateData.routingId = operation.routingId;
    if (operation.priority !== undefined) updateData.priority = operation.priority;
    if (operation.notes !== undefined) updateData.notes = operation.notes;
    if (operation.qualityCheckRequired !== undefined) updateData.qualityCheckRequired = operation.qualityCheckRequired;
    if (operation.qualityStatus !== undefined) updateData.qualityCheckStatus = operation.qualityStatus;
    
    updateData.publishDate = new Date();
    
    const [updated] = await db.update(ptJobOperations)
      .set(updateData)
      .where(eq(ptJobOperations.id, id))
      .returning();
    
    console.log(`Storage: Updated operation result:`, updated);
    
    // Verify the update was actually persisted
    const verification = await this.getDiscreteOperation(id);
    console.log(`Storage: Verification after update:`, verification);
    
    return updated || undefined;
  }

  async deleteDiscreteOperation(id: number): Promise<boolean> {
    // Removed - discrete operations now managed via PT Publish tables
    const result = await db.delete(ptJobOperations).where(eq(ptJobOperations.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Discrete Operation Phases and Resource Requirements methods - REMOVED (using PT Publish tables)

  // New process operations methods - REDIRECTED TO PT PUBLISH TABLES
  async getProcessOperations(): Promise<ProcessOperation[]> {
    console.log("getProcessOperations: Redirecting to PT Publish Job Operations table");
    
    // Get operations from PT Publish tables (filter for process type if available)
    const ptOperations = await db
      .select()
      .from(ptJobOperations)
      .orderBy(asc(ptJobOperations.sequenceNumber));
    
    // Map PT Publish Job Operations to ProcessOperation format
    return ptOperations.map(op => ({
      id: op.id,
      routingId: op.routingId || null,
      productionOrderId: Number(op.jobId),
      recipeId: op.recipeId || null,
      recipePhaseId: op.recipePhaseId || null,
      operationName: op.name || `Operation ${op.operationId}`,
      description: op.description,
      status: op.percentFinished === 100 ? 'completed' : 
              op.percentFinished > 0 ? 'in_progress' : 'planned',
      standardDuration: Number(op.cycleHrs || 1),
      actualDuration: Number(op.actualCycleHrs || null),
      startTime: op.scheduledStart ? new Date(op.scheduledStart) : null,
      endTime: op.scheduledEnd ? new Date(op.scheduledEnd) : null,
      sequenceNumber: Number(op.sequenceNumber || 0),
      workCenterId: op.defaultResourceId || null,
      priority: op.priority || 3,
      completionPercentage: Number(op.percentFinished || 0),
      qualityCheckRequired: op.qualityCheckRequired || false,
      qualityStatus: op.qualityCheckStatus || null,
      notes: op.notes || null,
      createdAt: op.publishDate || new Date(),
      updatedAt: op.publishDate || new Date()
    } as ProcessOperation));
  }

  async getProcessOperation(id: number): Promise<ProcessOperation | undefined> {
    // Get from PT Publish table
    const [ptOp] = await db.select().from(ptJobOperations).where(eq(ptJobOperations.id, id));
    if (!ptOp) return undefined;
    
    return {
      id: ptOp.id,
      productionOrderId: Number(ptOp.jobId),
      operationName: ptOp.name || `Operation ${ptOp.operationId}`,
      description: ptOp.description,
      status: ptOp.percentFinished === 100 ? 'completed' : 
              ptOp.percentFinished > 0 ? 'in_progress' : 'planned',
      standardDuration: Number(ptOp.cycleHrs || 1),
      actualDuration: Number(ptOp.actualCycleHrs || null),
      startTime: ptOp.scheduledStart ? new Date(ptOp.scheduledStart) : null,
      endTime: ptOp.scheduledEnd ? new Date(ptOp.scheduledEnd) : null,
      sequenceNumber: Number(ptOp.sequenceNumber || 0),
      assignedResourceId: ptOp.defaultResourceId || null,
      priority: ptOp.priority || 3,
      completionPercentage: Number(ptOp.percentFinished || 0),
      recipeRequired: false,
      recipeId: null,
      recipePhaseId: null,
      notes: ptOp.notes || null,
      createdAt: ptOp.publishDate || new Date(),
      updatedAt: ptOp.publishDate || new Date()
    } as ProcessOperation;
  }

  async createProcessOperation(operation: InsertProcessOperation): Promise<ProcessOperation> {
    // Create in PT Publish table
    const ptOp = {
      jobId: operation.productionOrderId || 1,
      operationId: `OP-${Date.now()}`,
      name: operation.operationName,
      description: operation.description,
      cycleHrs: String(operation.standardDuration || 1),
      sequenceNumber: operation.sequenceNumber || 1,
      percentFinished: operation.status === 'completed' ? 100 : 
                      operation.status === 'in_progress' ? 50 : 0,
      scheduledStart: operation.startTime,
      scheduledEnd: operation.endTime,
      defaultResourceId: operation.assignedResourceId,
      priority: operation.priority || 3,
      notes: operation.notes,
      publishDate: new Date()
    };
    
    const [newOp] = await db.insert(ptJobOperations).values(ptOp).returning();
    return this.getProcessOperation(newOp.id);
  }

  async updateProcessOperation(id: number, operation: Partial<InsertProcessOperation>): Promise<ProcessOperation | undefined> {
    // Update in PT Publish table
    const updateData: any = {};
    
    if (operation.operationName !== undefined) updateData.name = operation.operationName;
    if (operation.description !== undefined) updateData.description = operation.description;
    if (operation.standardDuration !== undefined) updateData.cycleHrs = String(operation.standardDuration);
    if (operation.sequenceNumber !== undefined) updateData.sequenceNumber = operation.sequenceNumber;
    if (operation.status !== undefined) {
      updateData.percentFinished = operation.status === 'completed' ? 100 : 
                                   operation.status === 'in_progress' ? 50 : 0;
    }
    if (operation.startTime !== undefined) updateData.scheduledStart = operation.startTime;
    if (operation.endTime !== undefined) updateData.scheduledEnd = operation.endTime;
    if (operation.assignedResourceId !== undefined) updateData.defaultResourceId = operation.assignedResourceId;
    if (operation.priority !== undefined) updateData.priority = operation.priority;
    if (operation.notes !== undefined) updateData.notes = operation.notes;
    
    updateData.publishDate = new Date();
    
    const [updated] = await db.update(ptJobOperations)
      .set(updateData)
      .where(eq(ptJobOperations.id, id))
      .returning();
    
    return updated ? this.getProcessOperation(id) : undefined;
  }

  async deleteProcessOperation(id: number): Promise<boolean> {
    const result = await db.delete(ptJobOperations).where(eq(ptJobOperations.id, id));
    return (result.rowCount || 0) > 0;
  }



  async updateOperationOptimizationFlags(id: number, flags: {
    isBottleneck?: boolean;
    isEarly?: boolean;
    isLate?: boolean;
    timeVarianceHours?: number;
    criticality?: string;
    optimizationNotes?: string;
  }): Promise<Operation | undefined> {
    // Update optimization flags in PT Job Operations table
    const updateData: any = {};
    
    if (flags.isBottleneck !== undefined) updateData.isBottleneck = flags.isBottleneck;
    if (flags.isEarly !== undefined) updateData.isEarly = flags.isEarly;
    if (flags.isLate !== undefined) updateData.isLate = flags.isLate;
    if (flags.timeVarianceHours !== undefined) updateData.timeVarianceHours = String(flags.timeVarianceHours);
    if (flags.criticality !== undefined) updateData.criticality = flags.criticality;
    if (flags.optimizationNotes !== undefined) updateData.notes = flags.optimizationNotes;
    
    updateData.publishDate = new Date();
    
    const [updated] = await db
      .update(ptJobOperations)
      .set(updateData)
      .where(eq(ptJobOperations.id, id))
      .returning();
      
    if (updated) {
      return this.getOperation(id);
    }
    return undefined;
  }

  // Dependencies - removed as we're using PT tables now
  // async getDependencies(): Promise<Dependency[]> {
  //   return await db.select().from(dependencies);
  // }

  // async getDependenciesByOperationId(operationId: number): Promise<Dependency[]> {
  //   return await db.select().from(dependencies).where(
  //     eq(dependencies.fromOperationId, operationId)
  //   );
  // }

  // async createDependency(dependency: InsertDependency): Promise<Dependency> {
  //   const [newDependency] = await db
  //     .insert(dependencies)
  //     .values(dependency)
  //     .returning();
  //   return newDependency;
  // }

  // async deleteDependency(id: number): Promise<boolean> {
  //   const result = await db.delete(dependencies).where(eq(dependencies.id, id));
  //   return (result.rowCount || 0) > 0;
  // }

  // Resource Requirements methods
  async getResourceRequirements(): Promise<ResourceRequirement[]> {
    return await db.select().from(resourceRequirements);
  }

  async getResourceRequirementsByOperationId(operationId: number): Promise<ResourceRequirement[]> {
    return await db.select().from(resourceRequirements)
      .where(eq(resourceRequirements.operationId, operationId))
      .orderBy(asc(resourceRequirements.priority), asc(resourceRequirements.requirementType));
  }

  async getResourceRequirement(id: number): Promise<ResourceRequirement | undefined> {
    const [requirement] = await db.select().from(resourceRequirements)
      .where(eq(resourceRequirements.id, id));
    return requirement || undefined;
  }

  async createResourceRequirement(requirement: InsertResourceRequirement): Promise<ResourceRequirement> {
    const [newRequirement] = await db.insert(resourceRequirements)
      .values(requirement)
      .returning();
    return newRequirement;
  }

  async updateResourceRequirement(id: number, requirement: Partial<InsertResourceRequirement>): Promise<ResourceRequirement | undefined> {
    const [updatedRequirement] = await db.update(resourceRequirements)
      .set(requirement)
      .where(eq(resourceRequirements.id, id))
      .returning();
    return updatedRequirement || undefined;
  }

  async deleteResourceRequirement(id: number): Promise<boolean> {
    // First delete any assignments for this requirement
    await db.delete(resourceRequirementAssignments)
      .where(eq(resourceRequirementAssignments.requirementId, id));
    
    // Then delete the requirement itself
    const result = await db.delete(resourceRequirements)
      .where(eq(resourceRequirements.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Resource Requirement Assignments methods
  async getResourceRequirementAssignments(): Promise<ResourceRequirementAssignment[]> {
    return await db.select().from(resourceRequirementAssignments);
  }

  async getResourceRequirementAssignmentsByRequirementId(requirementId: number): Promise<ResourceRequirementAssignment[]> {
    return await db.select().from(resourceRequirementAssignments)
      .where(eq(resourceRequirementAssignments.requirementId, requirementId))
      .orderBy(asc(resourceRequirementAssignments.plannedStartTime));
  }

  async getResourceRequirementAssignmentsByResourceId(resourceId: number): Promise<ResourceRequirementAssignment[]> {
    return await db.select().from(resourceRequirementAssignments)
      .where(eq(resourceRequirementAssignments.assignedResourceId, resourceId))
      .orderBy(asc(resourceRequirementAssignments.plannedStartTime));
  }

  async getResourceRequirementAssignment(id: number): Promise<ResourceRequirementAssignment | undefined> {
    const [assignment] = await db.select().from(resourceRequirementAssignments)
      .where(eq(resourceRequirementAssignments.id, id));
    return assignment || undefined;
  }

  async createResourceRequirementAssignment(assignment: InsertResourceRequirementAssignment): Promise<ResourceRequirementAssignment> {
    const [newAssignment] = await db.insert(resourceRequirementAssignments)
      .values(assignment)
      .returning();
    return newAssignment;
  }

  async updateResourceRequirementAssignment(id: number, assignment: Partial<InsertResourceRequirementAssignment>): Promise<ResourceRequirementAssignment | undefined> {
    const [updatedAssignment] = await db.update(resourceRequirementAssignments)
      .set(assignment)
      .where(eq(resourceRequirementAssignments.id, id))
      .returning();
    return updatedAssignment || undefined;
  }

  async deleteResourceRequirementAssignment(id: number): Promise<boolean> {
    const result = await db.delete(resourceRequirementAssignments)
      .where(eq(resourceRequirementAssignments.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Resource Requirement Blocks methods - DELETED: replaced by ptjobresourceblocks

  async getResourceViews(): Promise<ResourceView[]> {
    return await db.select().from(resourceViews);
  }

  async getResourceView(id: number): Promise<ResourceView | undefined> {
    const [resourceView] = await db.select().from(resourceViews).where(eq(resourceViews.id, id));
    return resourceView || undefined;
  }

  async createResourceView(resourceView: InsertResourceView): Promise<ResourceView> {
    const [newResourceView] = await db
      .insert(resourceViews)
      .values(resourceView)
      .returning();
    return newResourceView;
  }

  async updateResourceView(id: number, resourceView: Partial<InsertResourceView>): Promise<ResourceView | undefined> {
    const [updatedResourceView] = await db
      .update(resourceViews)
      .set(resourceView)
      .where(eq(resourceViews.id, id))
      .returning();
    return updatedResourceView || undefined;
  }

  async deleteResourceView(id: number): Promise<boolean> {
    const result = await db.delete(resourceViews).where(eq(resourceViews.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getDefaultResourceView(): Promise<ResourceView | undefined> {
    const [defaultView] = await db.select().from(resourceViews).where(eq(resourceViews.isDefault, true));
    return defaultView || undefined;
  }

  async setDefaultResourceView(id: number): Promise<void> {
    // First, set all existing views to non-default
    await db.update(resourceViews).set({ isDefault: false });
    
    // Then set the specified view as default
    await db.update(resourceViews).set({ isDefault: true }).where(eq(resourceViews.id, id));
  }

  // Custom Text Labels
  async getCustomTextLabels(): Promise<CustomTextLabel[]> {
    return await db.select().from(customTextLabels);
  }

  async getCustomTextLabel(id: number): Promise<CustomTextLabel | undefined> {
    const [customTextLabel] = await db.select().from(customTextLabels).where(eq(customTextLabels.id, id));
    return customTextLabel || undefined;
  }

  async createCustomTextLabel(customTextLabel: InsertCustomTextLabel): Promise<CustomTextLabel> {
    const [newCustomTextLabel] = await db
      .insert(customTextLabels)
      .values(customTextLabel)
      .returning();
    return newCustomTextLabel;
  }

  async updateCustomTextLabel(id: number, customTextLabel: Partial<InsertCustomTextLabel>): Promise<CustomTextLabel | undefined> {
    const [updatedCustomTextLabel] = await db
      .update(customTextLabels)
      .set(customTextLabel)
      .where(eq(customTextLabels.id, id))
      .returning();
    return updatedCustomTextLabel || undefined;
  }

  async deleteCustomTextLabel(id: number): Promise<boolean> {
    const result = await db.delete(customTextLabels).where(eq(customTextLabels.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Kanban Configurations
  async getKanbanConfigs(): Promise<KanbanConfig[]> {
    return await db.select().from(kanbanConfigs);
  }

  async getKanbanConfig(id: number): Promise<KanbanConfig | undefined> {
    const [kanbanConfig] = await db.select().from(kanbanConfigs).where(eq(kanbanConfigs.id, id));
    return kanbanConfig || undefined;
  }

  async createKanbanConfig(kanbanConfig: InsertKanbanConfig): Promise<KanbanConfig> {
    const [newKanbanConfig] = await db
      .insert(kanbanConfigs)
      .values(kanbanConfig)
      .returning();
    return newKanbanConfig;
  }

  async updateKanbanConfig(id: number, kanbanConfig: Partial<InsertKanbanConfig>): Promise<KanbanConfig | undefined> {
    const [updatedKanbanConfig] = await db
      .update(kanbanConfigs)
      .set(kanbanConfig)
      .where(eq(kanbanConfigs.id, id))
      .returning();
    return updatedKanbanConfig || undefined;
  }

  async deleteKanbanConfig(id: number): Promise<boolean> {
    const result = await db.delete(kanbanConfigs).where(eq(kanbanConfigs.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getDefaultKanbanConfig(): Promise<KanbanConfig | undefined> {
    const [defaultConfig] = await db.select().from(kanbanConfigs).where(eq(kanbanConfigs.isDefault, true));
    return defaultConfig || undefined;
  }

  async setDefaultKanbanConfig(id: number): Promise<void> {
    // First, set all existing configs to non-default
    await db.update(kanbanConfigs).set({ isDefault: false });
    
    // Then set the specified config as default
    await db.update(kanbanConfigs).set({ isDefault: true }).where(eq(kanbanConfigs.id, id));
  }

  async getReportConfigs(): Promise<ReportConfig[]> {
    return await db.select().from(reportConfigs);
  }

  async getReportConfig(id: number): Promise<ReportConfig | undefined> {
    const [config] = await db.select().from(reportConfigs).where(eq(reportConfigs.id, id));
    return config || undefined;
  }

  async createReportConfig(reportConfig: InsertReportConfig): Promise<ReportConfig> {
    const [config] = await db
      .insert(reportConfigs)
      .values(reportConfig)
      .returning();
    return config;
  }

  async updateReportConfig(id: number, reportConfig: Partial<InsertReportConfig>): Promise<ReportConfig | undefined> {
    const [config] = await db
      .update(reportConfigs)
      .set(reportConfig)
      .where(eq(reportConfigs.id, id))
      .returning();
    return config || undefined;
  }

  async deleteReportConfig(id: number): Promise<boolean> {
    const result = await db
      .delete(reportConfigs)
      .where(eq(reportConfigs.id, id));
    return result.rowCount > 0;
  }

  async getDefaultReportConfig(): Promise<ReportConfig | undefined> {
    const [config] = await db.select().from(reportConfigs).where(eq(reportConfigs.isDefault, true));
    return config || undefined;
  }

  async setDefaultReportConfig(id: number): Promise<void> {
    // First, set all existing configs to non-default
    await db.update(reportConfigs).set({ isDefault: false });
    
    // Then set the specified config as default
    await db.update(reportConfigs).set({ isDefault: true }).where(eq(reportConfigs.id, id));
  }

  async getDashboardConfigs(): Promise<DashboardConfig[]> {
    return await db.select().from(dashboardConfigs);
  }

  async getDashboardConfig(id: number): Promise<DashboardConfig | undefined> {
    const [config] = await db.select().from(dashboardConfigs).where(eq(dashboardConfigs.id, id));
    return config || undefined;
  }

  async createDashboardConfig(dashboardConfig: InsertDashboardConfig): Promise<DashboardConfig> {
    const [config] = await db
      .insert(dashboardConfigs)
      .values(dashboardConfig)
      .returning();
    return config;
  }

  async updateDashboardConfig(id: number, dashboardConfig: Partial<InsertDashboardConfig>): Promise<DashboardConfig | undefined> {
    const [config] = await db
      .update(dashboardConfigs)
      .set(dashboardConfig)
      .where(eq(dashboardConfigs.id, id))
      .returning();
    return config || undefined;
  }

  async deleteDashboardConfig(id: number): Promise<boolean> {
    const result = await db
      .delete(dashboardConfigs)
      .where(eq(dashboardConfigs.id, id));
    return result.rowCount > 0;
  }

  async getDefaultDashboardConfig(): Promise<DashboardConfig | undefined> {
    const [config] = await db.select().from(dashboardConfigs).where(eq(dashboardConfigs.isDefault, true));
    return config || undefined;
  }

  async setDefaultDashboardConfig(id: number): Promise<void> {
    // First, set all existing configs to non-default
    await db.update(dashboardConfigs).set({ isDefault: false });
    
    // Then set the specified config as default
    await db.update(dashboardConfigs).set({ isDefault: true }).where(eq(dashboardConfigs.id, id));
  }

  // User Resource Assignments
  async getUserResourceAssignments(userId?: number): Promise<any[]> {
    const query = db.select({
      id: userResourceAssignments.id,
      userId: userResourceAssignments.userId,
      resourceId: userResourceAssignments.resourceId,
      assignedBy: userResourceAssignments.assignedBy,
      assignedAt: userResourceAssignments.assignedAt,
      revokedAt: userResourceAssignments.revokedAt,
      revokedBy: userResourceAssignments.revokedBy,
      canSkipOperations: userResourceAssignments.canSkipOperations,
      scheduleVisibilityDays: userResourceAssignments.scheduleVisibilityDays,
      notes: userResourceAssignments.notes,
      isActive: userResourceAssignments.isActive,
      createdAt: userResourceAssignments.createdAt,
      updatedAt: userResourceAssignments.updatedAt,
      resource: {
        id: resources.id,
        name: resources.name,
        type: resources.type
      },
      user: {
        id: users.id,
        username: users.username,
        email: users.email
      }
    })
    .from(userResourceAssignments)
    .leftJoin(resources, eq(userResourceAssignments.resourceId, resources.id))
    .leftJoin(users, eq(userResourceAssignments.userId, users.id));

    if (userId) {
      query.where(eq(userResourceAssignments.userId, userId));
    }

    return await query;
  }

  async createUserResourceAssignment(assignment: any): Promise<any> {
    const [newAssignment] = await db
      .insert(userResourceAssignments)
      .values(assignment)
      .returning();
    return newAssignment;
  }

  async updateUserResourceAssignment(id: number, assignment: any): Promise<any> {
    const [updatedAssignment] = await db
      .update(userResourceAssignments)
      .set(assignment)
      .where(eq(userResourceAssignments.id, id))
      .returning();
    return updatedAssignment;
  }

  async deleteUserResourceAssignment(id: number): Promise<boolean> {
    const result = await db.delete(userResourceAssignments).where(eq(userResourceAssignments.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Operation Status Reports
  async getOperationStatusReports(operationId?: number): Promise<any[]> {
    const query = db.select().from(operationStatusReports);
    
    if (operationId) {
      query.where(eq(operationStatusReports.ptJobOperationId, operationId));
    }

    return await query;
  }

  async createOperationStatusReport(report: any): Promise<any> {
    const [newReport] = await db
      .insert(operationStatusReports)
      .values(report)
      .returning();
    return newReport;
  }

  async updateOperationStatusReport(id: number, report: any): Promise<any> {
    const [updatedReport] = await db
      .update(operationStatusReports)
      .set(report)
      .where(eq(operationStatusReports.id, id))
      .returning();
    return updatedReport;
  }

  async deleteOperationStatusReport(id: number): Promise<boolean> {
    const result = await db.delete(operationStatusReports).where(eq(operationStatusReports.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Skip Reason Templates
  async getSkipReasonTemplates(): Promise<any[]> {
    return await db.select().from(skipReasonTemplates).where(eq(skipReasonTemplates.isActive, true));
  }

  // Schedule Scenarios
  async getScheduleScenarios(): Promise<ScheduleScenario[]> {
    return await db.select().from(scheduleScenarios);
  }

  async getScheduleScenario(id: number): Promise<ScheduleScenario | undefined> {
    const [scenario] = await db.select().from(scheduleScenarios).where(eq(scheduleScenarios.id, id));
    return scenario || undefined;
  }

  async createScheduleScenario(scenario: InsertScheduleScenario): Promise<ScheduleScenario> {
    const [newScenario] = await db
      .insert(scheduleScenarios)
      .values(scenario)
      .returning();
    return newScenario;
  }

  async updateScheduleScenario(id: number, scenario: Partial<InsertScheduleScenario>): Promise<ScheduleScenario | undefined> {
    const [updatedScenario] = await db
      .update(scheduleScenarios)
      .set(scenario)
      .where(eq(scheduleScenarios.id, id))
      .returning();
    return updatedScenario || undefined;
  }

  async deleteScheduleScenario(id: number): Promise<boolean> {
    // First delete associated scenario operations, evaluations, and discussions
    await db.delete(scenarioOperations).where(eq(scenarioOperations.scenarioId, id));
    await db.delete(scenarioEvaluations).where(eq(scenarioEvaluations.scenarioId, id));
    await db.delete(scenarioDiscussions).where(eq(scenarioDiscussions.scenarioId, id));
    
    const result = await db.delete(scheduleScenarios).where(eq(scheduleScenarios.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Scenario Operations
  async getScenarioOperations(scenarioId: number): Promise<ScenarioOperation[]> {
    return await db.select().from(scenarioOperations).where(eq(scenarioOperations.scenarioId, scenarioId));
  }

  async createScenarioOperation(operation: InsertScenarioOperation): Promise<ScenarioOperation> {
    const [newOperation] = await db
      .insert(scenarioOperations)
      .values(operation)
      .returning();
    return newOperation;
  }

  async updateScenarioOperation(id: number, operation: Partial<InsertScenarioOperation>): Promise<ScenarioOperation | undefined> {
    const [updatedOperation] = await db
      .update(scenarioOperations)
      .set(operation)
      .where(eq(scenarioOperations.id, id))
      .returning();
    return updatedOperation || undefined;
  }

  async deleteScenarioOperation(id: number): Promise<boolean> {
    const result = await db.delete(scenarioOperations).where(eq(scenarioOperations.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteScenarioOperationsByScenario(scenarioId: number): Promise<boolean> {
    const result = await db.delete(scenarioOperations).where(eq(scenarioOperations.scenarioId, scenarioId));
    return (result.rowCount || 0) > 0;
  }

  // Scenario Evaluations
  async getScenarioEvaluations(scenarioId: number): Promise<ScenarioEvaluation[]> {
    return await db.select().from(scenarioEvaluations).where(eq(scenarioEvaluations.scenarioId, scenarioId));
  }

  async createScenarioEvaluation(evaluation: InsertScenarioEvaluation): Promise<ScenarioEvaluation> {
    const [newEvaluation] = await db
      .insert(scenarioEvaluations)
      .values(evaluation)
      .returning();
    return newEvaluation;
  }

  async updateScenarioEvaluation(id: number, evaluation: Partial<InsertScenarioEvaluation>): Promise<ScenarioEvaluation | undefined> {
    const [updatedEvaluation] = await db
      .update(scenarioEvaluations)
      .set(evaluation)
      .where(eq(scenarioEvaluations.id, id))
      .returning();
    return updatedEvaluation || undefined;
  }

  async deleteScenarioEvaluation(id: number): Promise<boolean> {
    const result = await db.delete(scenarioEvaluations).where(eq(scenarioEvaluations.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Scenario Discussions
  async getScenarioDiscussions(scenarioId: number): Promise<ScenarioDiscussion[]> {
    return await db.select().from(scenarioDiscussions).where(eq(scenarioDiscussions.scenarioId, scenarioId));
  }

  async createScenarioDiscussion(discussion: InsertScenarioDiscussion): Promise<ScenarioDiscussion> {
    const [newDiscussion] = await db
      .insert(scenarioDiscussions)
      .values(discussion)
      .returning();
    return newDiscussion;
  }

  async updateScenarioDiscussion(id: number, discussion: Partial<InsertScenarioDiscussion>): Promise<ScenarioDiscussion | undefined> {
    const [updatedDiscussion] = await db
      .update(scenarioDiscussions)
      .set(discussion)
      .where(eq(scenarioDiscussions.id, id))
      .returning();
    return updatedDiscussion || undefined;
  }

  async deleteScenarioDiscussion(id: number): Promise<boolean> {
    const result = await db.delete(scenarioDiscussions).where(eq(scenarioDiscussions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // System Users
  async getSystemUsers(): Promise<SystemUser[]> {
    return await db.select().from(systemUsers);
  }

  async getSystemUser(id: number): Promise<SystemUser | undefined> {
    const [user] = await db.select().from(systemUsers).where(eq(systemUsers.id, id));
    return user || undefined;
  }

  async getSystemUserByUsername(username: string): Promise<SystemUser | undefined> {
    const [user] = await db.select().from(systemUsers).where(eq(systemUsers.username, username));
    return user || undefined;
  }

  async createSystemUser(user: InsertSystemUser): Promise<SystemUser> {
    const [newUser] = await db
      .insert(systemUsers)
      .values(user)
      .returning();
    return newUser;
  }

  async updateSystemUser(id: number, user: Partial<InsertSystemUser>): Promise<SystemUser | undefined> {
    const [updatedUser] = await db
      .update(systemUsers)
      .set(user)
      .where(eq(systemUsers.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async deleteSystemUser(id: number): Promise<boolean> {
    const result = await db.delete(systemUsers).where(eq(systemUsers.id, id));
    return (result.rowCount || 0) > 0;
  }

  // System Health
  async getSystemHealth(environment?: string): Promise<SystemHealth[]> {
    if (environment) {
      return await db.select().from(systemHealth).where(eq(systemHealth.environment, environment));
    }
    return await db.select().from(systemHealth);
  }

  async getSystemHealthByMetric(metricName: string, environment?: string): Promise<SystemHealth[]> {
    let query = db.select().from(systemHealth).where(eq(systemHealth.metricName, metricName));
    if (environment) {
      query = query.where(eq(systemHealth.environment, environment));
    }
    return await query;
  }

  async createSystemHealth(health: InsertSystemHealth): Promise<SystemHealth> {
    const [newHealth] = await db
      .insert(systemHealth)
      .values(health)
      .returning();
    return newHealth;
  }

  async deleteSystemHealth(id: number): Promise<boolean> {
    const result = await db.delete(systemHealth).where(eq(systemHealth.id, id));
    return (result.rowCount || 0) > 0;
  }

  // System Environments
  async getSystemEnvironments(): Promise<SystemEnvironment[]> {
    return await db.select().from(systemEnvironments);
  }

  async getSystemEnvironment(id: number): Promise<SystemEnvironment | undefined> {
    const [environment] = await db.select().from(systemEnvironments).where(eq(systemEnvironments.id, id));
    return environment || undefined;
  }

  async getSystemEnvironmentByName(name: string): Promise<SystemEnvironment | undefined> {
    const [environment] = await db.select().from(systemEnvironments).where(eq(systemEnvironments.name, name));
    return environment || undefined;
  }

  async createSystemEnvironment(environment: InsertSystemEnvironment): Promise<SystemEnvironment> {
    const [newEnvironment] = await db
      .insert(systemEnvironments)
      .values(environment)
      .returning();
    return newEnvironment;
  }

  async updateSystemEnvironment(id: number, environment: Partial<InsertSystemEnvironment>): Promise<SystemEnvironment | undefined> {
    const [updatedEnvironment] = await db
      .update(systemEnvironments)
      .set(environment)
      .where(eq(systemEnvironments.id, id))
      .returning();
    return updatedEnvironment || undefined;
  }

  async deleteSystemEnvironment(id: number): Promise<boolean> {
    const result = await db.delete(systemEnvironments).where(eq(systemEnvironments.id, id));
    return (result.rowCount || 0) > 0;
  }

  // System Upgrades
  async getSystemUpgrades(environment?: string): Promise<SystemUpgrade[]> {
    if (environment) {
      return await db.select().from(systemUpgrades).where(eq(systemUpgrades.environment, environment));
    }
    return await db.select().from(systemUpgrades);
  }

  async getSystemUpgrade(id: number): Promise<SystemUpgrade | undefined> {
    const [upgrade] = await db.select().from(systemUpgrades).where(eq(systemUpgrades.id, id));
    return upgrade || undefined;
  }

  async createSystemUpgrade(upgrade: InsertSystemUpgrade): Promise<SystemUpgrade> {
    const [newUpgrade] = await db
      .insert(systemUpgrades)
      .values(upgrade)
      .returning();
    return newUpgrade;
  }

  async updateSystemUpgrade(id: number, upgrade: Partial<InsertSystemUpgrade>): Promise<SystemUpgrade | undefined> {
    const [updatedUpgrade] = await db
      .update(systemUpgrades)
      .set(upgrade)
      .where(eq(systemUpgrades.id, id))
      .returning();
    return updatedUpgrade || undefined;
  }

  async deleteSystemUpgrade(id: number): Promise<boolean> {
    const result = await db.delete(systemUpgrades).where(eq(systemUpgrades.id, id));
    return (result.rowCount || 0) > 0;
  }

  // System Audit Log
  async getSystemAuditLog(userId?: number, resource?: string): Promise<SystemAuditLog[]> {
    let query = db.select().from(systemAuditLog);
    if (userId) {
      query = query.where(eq(systemAuditLog.userId, userId));
    }
    if (resource) {
      query = query.where(eq(systemAuditLog.resource, resource));
    }
    return await query;
  }

  async createSystemAuditLog(auditLog: InsertSystemAuditLog): Promise<SystemAuditLog> {
    const [newAuditLog] = await db
      .insert(systemAuditLog)
      .values(auditLog)
      .returning();
    return newAuditLog;
  }

  async deleteSystemAuditLog(id: number): Promise<boolean> {
    const result = await db.delete(systemAuditLog).where(eq(systemAuditLog.id, id));
    return (result.rowCount || 0) > 0;
  }

  // System Settings
  async getSystemSettings(environment?: string, category?: string): Promise<SystemSettings[]> {
    let query = db.select().from(systemSettings);
    if (environment) {
      query = query.where(eq(systemSettings.environment, environment));
    }
    if (category) {
      query = query.where(eq(systemSettings.category, category));
    }
    return await query;
  }

  async getSystemSetting(key: string, environment: string): Promise<SystemSettings | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .where(eq(systemSettings.environment, environment));
    return setting || undefined;
  }

  async createSystemSetting(setting: InsertSystemSettings): Promise<SystemSettings> {
    const [newSetting] = await db
      .insert(systemSettings)
      .values(setting)
      .returning();
    return newSetting;
  }

  async updateSystemSetting(id: number, setting: Partial<InsertSystemSettings>): Promise<SystemSettings | undefined> {
    const [updatedSetting] = await db
      .update(systemSettings)
      .set(setting)
      .where(eq(systemSettings.id, id))
      .returning();
    return updatedSetting || undefined;
  }

  async deleteSystemSetting(id: number): Promise<boolean> {
    const result = await db.delete(systemSettings).where(eq(systemSettings.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Capacity Planning Scenarios
  async getCapacityPlanningScenarios(): Promise<CapacityPlanningScenario[]> {
    return await db.select().from(capacityPlanningScenarios);
  }

  async getCapacityPlanningScenario(id: number): Promise<CapacityPlanningScenario | undefined> {
    const [scenario] = await db
      .select()
      .from(capacityPlanningScenarios)
      .where(eq(capacityPlanningScenarios.id, id));
    return scenario || undefined;
  }

  async createCapacityPlanningScenario(scenario: InsertCapacityPlanningScenario): Promise<CapacityPlanningScenario> {
    const [newScenario] = await db
      .insert(capacityPlanningScenarios)
      .values(scenario)
      .returning();
    return newScenario;
  }

  async updateCapacityPlanningScenario(id: number, scenario: Partial<InsertCapacityPlanningScenario>): Promise<CapacityPlanningScenario | undefined> {
    const [updatedScenario] = await db
      .update(capacityPlanningScenarios)
      .set(scenario)
      .where(eq(capacityPlanningScenarios.id, id))
      .returning();
    return updatedScenario || undefined;
  }

  async deleteCapacityPlanningScenario(id: number): Promise<boolean> {
    const result = await db.delete(capacityPlanningScenarios).where(eq(capacityPlanningScenarios.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Staffing Plans
  async getStaffingPlans(scenarioId?: number): Promise<StaffingPlan[]> {
    let query = db.select().from(staffingPlans);
    if (scenarioId) {
      query = query.where(eq(staffingPlans.scenarioId, scenarioId));
    }
    return await query;
  }

  async getStaffingPlan(id: number): Promise<StaffingPlan | undefined> {
    const [plan] = await db
      .select()
      .from(staffingPlans)
      .where(eq(staffingPlans.id, id));
    return plan || undefined;
  }

  async createStaffingPlan(plan: InsertStaffingPlan): Promise<StaffingPlan> {
    const [newPlan] = await db
      .insert(staffingPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async updateStaffingPlan(id: number, plan: Partial<InsertStaffingPlan>): Promise<StaffingPlan | undefined> {
    const [updatedPlan] = await db
      .update(staffingPlans)
      .set(plan)
      .where(eq(staffingPlans.id, id))
      .returning();
    return updatedPlan || undefined;
  }

  async deleteStaffingPlan(id: number): Promise<boolean> {
    const result = await db.delete(staffingPlans).where(eq(staffingPlans.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Shift Plans
  async getShiftPlans(scenarioId?: number): Promise<ShiftPlan[]> {
    let query = db.select().from(shiftPlans);
    if (scenarioId) {
      query = query.where(eq(shiftPlans.scenarioId, scenarioId));
    }
    return await query;
  }

  async getShiftPlan(id: number): Promise<ShiftPlan | undefined> {
    const [plan] = await db
      .select()
      .from(shiftPlans)
      .where(eq(shiftPlans.id, id));
    return plan || undefined;
  }

  async createShiftPlan(plan: InsertShiftPlan): Promise<ShiftPlan> {
    const [newPlan] = await db
      .insert(shiftPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async updateShiftPlan(id: number, plan: Partial<InsertShiftPlan>): Promise<ShiftPlan | undefined> {
    const [updatedPlan] = await db
      .update(shiftPlans)
      .set(plan)
      .where(eq(shiftPlans.id, id))
      .returning();
    return updatedPlan || undefined;
  }

  async deleteShiftPlan(id: number): Promise<boolean> {
    const result = await db.delete(shiftPlans).where(eq(shiftPlans.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Equipment Plans
  async getEquipmentPlans(scenarioId?: number): Promise<EquipmentPlan[]> {
    let query = db.select().from(equipmentPlans);
    if (scenarioId) {
      query = query.where(eq(equipmentPlans.scenarioId, scenarioId));
    }
    return await query;
  }

  async getEquipmentPlan(id: number): Promise<EquipmentPlan | undefined> {
    const [plan] = await db
      .select()
      .from(equipmentPlans)
      .where(eq(equipmentPlans.id, id));
    return plan || undefined;
  }

  async createEquipmentPlan(plan: InsertEquipmentPlan): Promise<EquipmentPlan> {
    const [newPlan] = await db
      .insert(equipmentPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async updateEquipmentPlan(id: number, plan: Partial<InsertEquipmentPlan>): Promise<EquipmentPlan | undefined> {
    const [updatedPlan] = await db
      .update(equipmentPlans)
      .set(plan)
      .where(eq(equipmentPlans.id, id))
      .returning();
    return updatedPlan || undefined;
  }

  async deleteEquipmentPlan(id: number): Promise<boolean> {
    const result = await db.delete(equipmentPlans).where(eq(equipmentPlans.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Capacity Projections
  async getCapacityProjections(scenarioId?: number): Promise<CapacityProjection[]> {
    let query = db.select().from(capacityProjections);
    if (scenarioId) {
      query = query.where(eq(capacityProjections.scenarioId, scenarioId));
    }
    return await query;
  }

  async getCapacityProjection(id: number): Promise<CapacityProjection | undefined> {
    const [projection] = await db
      .select()
      .from(capacityProjections)
      .where(eq(capacityProjections.id, id));
    return projection || undefined;
  }

  async createCapacityProjection(projection: InsertCapacityProjection): Promise<CapacityProjection> {
    const [newProjection] = await db
      .insert(capacityProjections)
      .values(projection)
      .returning();
    return newProjection;
  }

  async updateCapacityProjection(id: number, projection: Partial<InsertCapacityProjection>): Promise<CapacityProjection | undefined> {
    const [updatedProjection] = await db
      .update(capacityProjections)
      .set(projection)
      .where(eq(capacityProjections.id, id))
      .returning();
    return updatedProjection || undefined;
  }

  async deleteCapacityProjection(id: number): Promise<boolean> {
    const result = await db.delete(capacityProjections).where(eq(capacityProjections.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Business Goals
  async getBusinessGoals(): Promise<BusinessGoal[]> {
    return await db.select().from(businessGoals);
  }

  async getBusinessGoal(id: number): Promise<BusinessGoal | undefined> {
    const [goal] = await db
      .select()
      .from(businessGoals)
      .where(eq(businessGoals.id, id));
    return goal || undefined;
  }

  async createBusinessGoal(goal: InsertBusinessGoal): Promise<BusinessGoal> {
    const [newGoal] = await db
      .insert(businessGoals)
      .values(goal)
      .returning();
    return newGoal;
  }

  async updateBusinessGoal(id: number, goal: Partial<InsertBusinessGoal>): Promise<BusinessGoal | undefined> {
    const [updatedGoal] = await db
      .update(businessGoals)
      .set(goal)
      .where(eq(businessGoals.id, id))
      .returning();
    return updatedGoal || undefined;
  }

  async deleteBusinessGoal(id: number): Promise<boolean> {
    const result = await db.delete(businessGoals).where(eq(businessGoals.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Goal Progress
  async getGoalProgress(goalId?: number): Promise<GoalProgress[]> {
    let query = db.select().from(goalProgress);
    if (goalId) {
      query = query.where(eq(goalProgress.goalId, goalId));
    }
    return await query;
  }

  async getGoalProgressById(id: number): Promise<GoalProgress | undefined> {
    const [progress] = await db
      .select()
      .from(goalProgress)
      .where(eq(goalProgress.id, id));
    return progress || undefined;
  }

  async createGoalProgress(progress: InsertGoalProgress): Promise<GoalProgress> {
    const [newProgress] = await db
      .insert(goalProgress)
      .values(progress)
      .returning();
    return newProgress;
  }

  async updateGoalProgress(id: number, progress: Partial<InsertGoalProgress>): Promise<GoalProgress | undefined> {
    const [updatedProgress] = await db
      .update(goalProgress)
      .set(progress)
      .where(eq(goalProgress.id, id))
      .returning();
    return updatedProgress || undefined;
  }

  async deleteGoalProgress(id: number): Promise<boolean> {
    const result = await db.delete(goalProgress).where(eq(goalProgress.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Goal Risks
  async getGoalRisks(goalId?: number): Promise<GoalRisk[]> {
    let query = db.select().from(goalRisks);
    if (goalId) {
      query = query.where(eq(goalRisks.goalId, goalId));
    }
    return await query;
  }

  async getGoalRisk(id: number): Promise<GoalRisk | undefined> {
    const [risk] = await db
      .select()
      .from(goalRisks)
      .where(eq(goalRisks.id, id));
    return risk || undefined;
  }

  async createGoalRisk(risk: InsertGoalRisk): Promise<GoalRisk> {
    const [newRisk] = await db
      .insert(goalRisks)
      .values(risk)
      .returning();
    return newRisk;
  }

  async updateGoalRisk(id: number, risk: Partial<InsertGoalRisk>): Promise<GoalRisk | undefined> {
    const [updatedRisk] = await db
      .update(goalRisks)
      .set(risk)
      .where(eq(goalRisks.id, id))
      .returning();
    return updatedRisk || undefined;
  }

  async deleteGoalRisk(id: number): Promise<boolean> {
    const result = await db.delete(goalRisks).where(eq(goalRisks.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Goal Issues
  async getGoalIssues(goalId?: number): Promise<GoalIssue[]> {
    let query = db.select().from(goalIssues);
    if (goalId) {
      query = query.where(eq(goalIssues.goalId, goalId));
    }
    return await query;
  }

  async getGoalIssue(id: number): Promise<GoalIssue | undefined> {
    const [issue] = await db
      .select()
      .from(goalIssues)
      .where(eq(goalIssues.id, id));
    return issue || undefined;
  }

  async createGoalIssue(issue: InsertGoalIssue): Promise<GoalIssue> {
    const [newIssue] = await db
      .insert(goalIssues)
      .values(issue)
      .returning();
    return newIssue;
  }

  async updateGoalIssue(id: number, issue: Partial<InsertGoalIssue>): Promise<GoalIssue | undefined> {
    const [updatedIssue] = await db
      .update(goalIssues)
      .set(issue)
      .where(eq(goalIssues.id, id))
      .returning();
    return updatedIssue || undefined;
  }

  async deleteGoalIssue(id: number): Promise<boolean> {
    const result = await db.delete(goalIssues).where(eq(goalIssues.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Goal KPIs
  async getGoalKpis(goalId?: number): Promise<GoalKpi[]> {
    let query = db.select().from(goalKpis);
    if (goalId) {
      query = query.where(eq(goalKpis.goalId, goalId));
    }
    return await query;
  }

  async getGoalKpi(id: number): Promise<GoalKpi | undefined> {
    const [kpi] = await db
      .select()
      .from(goalKpis)
      .where(eq(goalKpis.id, id));
    return kpi || undefined;
  }

  async createGoalKpi(kpi: InsertGoalKpi): Promise<GoalKpi> {
    const [newKpi] = await db
      .insert(goalKpis)
      .values(kpi)
      .returning();
    return newKpi;
  }

  async updateGoalKpi(id: number, kpi: Partial<InsertGoalKpi>): Promise<GoalKpi | undefined> {
    const [updatedKpi] = await db
      .update(goalKpis)
      .set(kpi)
      .where(eq(goalKpis.id, id))
      .returning();
    return updatedKpi || undefined;
  }

  async deleteGoalKpi(id: number): Promise<boolean> {
    const result = await db.delete(goalKpis).where(eq(goalKpis.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Goal Actions
  async getGoalActions(goalId?: number): Promise<GoalAction[]> {
    let query = db.select().from(goalActions);
    if (goalId) {
      query = query.where(eq(goalActions.goalId, goalId));
    }
    return await query;
  }

  async getGoalAction(id: number): Promise<GoalAction | undefined> {
    const [action] = await db
      .select()
      .from(goalActions)
      .where(eq(goalActions.id, id));
    return action || undefined;
  }

  async createGoalAction(action: InsertGoalAction): Promise<GoalAction> {
    const [newAction] = await db
      .insert(goalActions)
      .values(action)
      .returning();
    return newAction;
  }

  async updateGoalAction(id: number, action: Partial<InsertGoalAction>): Promise<GoalAction | undefined> {
    const [updatedAction] = await db
      .update(goalActions)
      .set(action)
      .where(eq(goalActions.id, id))
      .returning();
    return updatedAction || undefined;
  }

  async deleteGoalAction(id: number): Promise<boolean> {
    const result = await db.delete(goalActions).where(eq(goalActions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Data Map Relationships
  async getDataRelationships(objectType: string, objectId: number): Promise<any[]> {
    try {
      const relationships: any[] = [];

      switch (objectType) {
        case 'plants':
          // Find all resources in this plant via junction table
          const plantResourceMappings = await db
            .select({
              resource: resources,
              plantResource: plantResources
            })
            .from(plantResources)
            .innerJoin(resources, eq(plantResources.resourceId, resources.id))
            .where(eq(plantResources.plantId, objectId));
          
          plantResourceMappings.forEach(({ resource, plantResource }) => {
            relationships.push({
              from: { id: objectId, type: 'plants' },
              to: { ...resource, type: 'resources' },
              relationshipType: 'contains',
              description: `Plant contains resource${plantResource.isPrimary ? ' (Primary)' : ''}`
            });
          });

          // Find all production orders for this plant
          const plantOrders = await db
            .select()
            .from(productionOrders)
            .where(eq(productionOrders.plantId, objectId));
          
          plantOrders.forEach(order => {
            relationships.push({
              from: { id: objectId, type: 'plants' },
              to: { ...order, type: 'productionOrders' },
              relationshipType: 'schedules',
              description: 'Plant schedules production order'
            });
          });
          break;

        case 'resources':
          // Find the plants this resource belongs to via junction table
          const resourceData = await db
            .select()
            .from(ptResources)
            .where(eq(ptResources.id, objectId))
            .limit(1);
            
          const resourcePlantMappings = await db
            .select({
              plant: plants,
              plantResource: plantResources
            })
            .from(plantResources)
            .innerJoin(plants, eq(plantResources.plantId, plants.id))
            .where(eq(plantResources.resourceId, objectId));
            
          resourcePlantMappings.forEach(({ plant, plantResource }) => {
            relationships.push({
              from: { ...resourceData[0], type: 'resources' },
              to: { ...plant, type: 'plants' },
              relationshipType: 'belongs_to',
              description: `Resource belongs to plant${plantResource.isPrimary ? ' (Primary)' : ''}`
            });
          });

          // Find PT Job Operations that use this resource
          const resourceOperations = await db
            .select()
            .from(ptJobOperations)
            .where(eq(ptJobOperations.setupResourceId, objectId));
          
          resourceOperations.forEach(operation => {
            relationships.push({
              from: { ...resourceData[0], type: 'resources' },
              to: { ...operation, type: 'ptJobOperations' },
              relationshipType: 'performs',
              description: 'Resource performs operation'
            });
          });
          break;

        case 'productionOrders':
          // Find PT Job Operations for this production order
          // Note: PT Job Operations are linked through ptJobs table
          const orderData = await db
            .select()
            .from(productionOrders)
            .where(eq(productionOrders.id, objectId))
            .limit(1);
          
          if (orderData[0]) {
            // Get PT Job Operations via the job mapping
            const ptJobOps = await db
              .select()
              .from(ptJobOperations)
              .where(eq(ptJobOperations.jobId, String(objectId)));
            
            ptJobOps.forEach(operation => {
              relationships.push({
                from: { id: objectId, type: 'productionOrders' },
                to: { ...operation, type: 'ptJobOperations' },
                relationshipType: 'includes',
                description: 'Production order includes operation'
              });
            });
          }

          // Find the plant for this production order (reuse orderData from above)
          if (orderData[0]?.plantId) {
            const plant = await db
              .select()
              .from(ptPlants)
              .where(eq(ptPlants.id, orderData[0].plantId))
              .limit(1);
            
            if (plant[0]) {
              relationships.push({
                from: { ...orderData[0], type: 'productionOrders' },
                to: { ...plant[0], type: 'plants' },
                relationshipType: 'scheduled_at',
                description: 'Production order scheduled at plant'
              });
            }
          }
          break;

        case 'ptJobOperations':
          // Find the production order this PT Job Operation belongs to
          const operationData = await db
            .select()
            .from(ptJobOperations)
            .where(eq(ptJobOperations.id, objectId))
            .limit(1);
          
          if (operationData[0]?.jobId) {
            // PT Job Operations are linked to jobs via jobId
            const order = await db
              .select()
              .from(productionOrders)
              .where(eq(productionOrders.id, Number(operationData[0].jobId)))
              .limit(1);
            
            if (order[0]) {
              relationships.push({
                from: { ...operationData[0], type: 'ptJobOperations' },
                to: { ...order[0], type: 'productionOrders' },
                relationshipType: 'part_of',
                description: 'Operation is part of production order'
              });
            }
          }

          // Find the resource that performs this operation
          if (operationData[0]?.setupResourceId) {
            const resource = await db
              .select()
              .from(ptResources)
              .where(eq(ptResources.id, operationData[0].setupResourceId))
              .limit(1);
            
            if (resource[0]) {
              relationships.push({
                from: { ...operationData[0], type: 'operations' },
                to: { ...resource[0], type: 'resources' },
                relationshipType: 'uses',
                description: 'Operation uses resource'
              });
            }
          }
          break;

        case 'productionVersions':
          // Find related recipes (BOMs are linked through routing operations, not directly per SAP standards)
          const versionData = await db
            .select()
            .from(productionVersions)
            .where(eq(productionVersions.id, objectId))
            .limit(1);
          
          if (versionData[0]?.recipeId) {
            const recipe = await db
              .select()
              .from(recipes)
              .where(eq(recipes.id, versionData[0].recipeId))
              .limit(1);
            
            if (recipe[0]) {
              relationships.push({
                from: { ...versionData[0], type: 'productionVersions' },
                to: { ...recipe[0], type: 'recipes' },
                relationshipType: 'uses',
                description: 'Production version uses recipe'
              });
            }
          }
          break;

        default:
          // For other types, return empty relationships for now
          break;
      }

      return relationships;
    } catch (error) {
      console.error('Error getting data relationships:', error);
      return [];
    }
  }

  // Missing getter methods for data map functionality
  async getBillsOfMaterial(): Promise<any[]> {
    try {
      return await db.select().from(billsOfMaterial);
    } catch (error) {
      console.error('Error fetching bills of material:', error);
      return [];
    }
  }

  async getRoutings(): Promise<any[]> {
    try {
      return await db.select().from(routings);
    } catch (error) {
      console.error('Error fetching routings:', error);
      return [];
    }
  }

  async getRecipes(): Promise<any[]> {
    try {
      return await db.select().from(recipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }
  }

  async getVendors(): Promise<any[]> {
    try {
      return await db.select().from(PTvendors);
    } catch (error) {
      console.error('Error fetching PTvendors:', error);
      return [];
    }
  }

  async getCustomers(): Promise<any[]> {
    try {
      return await db.select().from(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  // Database Schema Analysis - Optimized with bulk queries and caching
  async getDatabaseSchema(): Promise<any[]> {
    try {
      // Check cache first
      const now = Date.now();
      if (this.schemaCache && (now - this.schemaCache.timestamp) < this.SCHEMA_CACHE_TTL) {
        console.log('Returning cached schema data');
        return this.schemaCache.data;
      }

      console.log('Fetching fresh schema data...');
      // Get all table names in one query
      const tablesQuery = await db.execute(sql`
        SELECT 
          t.table_name,
          obj_description(c.oid) as table_comment
        FROM information_schema.tables t
        LEFT JOIN pg_class c ON c.relname = t.table_name
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
      `);

      // Get all columns for all tables in one query
      const allColumnsQuery = await db.execute(sql`
        SELECT 
          c.table_name,
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          c.ordinal_position,
          CASE WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY' ELSE NULL END as constraint_type
        FROM information_schema.columns c
        LEFT JOIN information_schema.key_column_usage pk 
          ON c.table_name = pk.table_name AND c.column_name = pk.column_name
          AND pk.constraint_name LIKE '%_pkey'
        WHERE c.table_schema = 'public'
        ORDER BY c.table_name, c.ordinal_position
      `);

      // Get all foreign keys for all tables in one query
      const allForeignKeysQuery = await db.execute(sql`
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public'
      `);

      // Get all relationships for all tables in one query
      const allRelationshipsQuery = await db.execute(sql`
        SELECT 
          tc.table_name,
          tc.constraint_type,
          kcu.column_name as from_column,
          ccu.table_name as to_table,
          ccu.column_name as to_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
      `);

      // Build lookup maps for fast access
      const columnsByTable = new Map<string, any[]>();
      const foreignKeysByTable = new Map<string, Map<string, any>>();
      const relationshipsByTable = new Map<string, any[]>();

      // Process columns
      allColumnsQuery.rows.forEach((col: any) => {
        if (!columnsByTable.has(col.table_name)) {
          columnsByTable.set(col.table_name, []);
        }
        columnsByTable.get(col.table_name)!.push(col);
      });

      // Process foreign keys
      allForeignKeysQuery.rows.forEach((fk: any) => {
        if (!foreignKeysByTable.has(fk.table_name)) {
          foreignKeysByTable.set(fk.table_name, new Map());
        }
        foreignKeysByTable.get(fk.table_name)!.set(fk.column_name, {
          table: fk.foreign_table_name,
          column: fk.foreign_column_name
        });
      });

      // Process relationships with proper cardinality detection
      allRelationshipsQuery.rows.forEach((rel: any) => {
        if (!relationshipsByTable.has(rel.table_name)) {
          relationshipsByTable.set(rel.table_name, []);
        }
        
        // Determine relationship cardinality based on foreign key direction
        // When a table has a foreign key to another table, it's the "many" side
        // The referenced table is the "one" side
        // So from the perspective of the table with the foreign key, it's many-to-one
        const relationshipType = 'many-to-one' as const;
        
        relationshipsByTable.get(rel.table_name)!.push({
          type: relationshipType,
          fromTable: rel.table_name,
          fromColumn: rel.from_column,
          toTable: rel.to_table,
          toColumn: rel.to_column,
          description: `${rel.table_name}.${rel.from_column} → ${rel.to_table}.${rel.to_column}`
        });
        
        // Also add the reverse relationship for the referenced table (one-to-many)
        if (!relationshipsByTable.has(rel.to_table)) {
          relationshipsByTable.set(rel.to_table, []);
        }
        
        relationshipsByTable.get(rel.to_table)!.push({
          type: 'one-to-many' as const,
          fromTable: rel.to_table,
          fromColumn: rel.to_column,
          toTable: rel.table_name,
          toColumn: rel.from_column,
          description: `${rel.to_table}.${rel.to_column} ← ${rel.table_name}.${rel.from_column}`
        });
      });

      // Build final table objects
      const tables = [];
      
      for (const tableRow of tablesQuery.rows) {
        const tableName = tableRow.table_name as string;
        
        // Get columns for this table
        const tableColumns = columnsByTable.get(tableName) || [];
        const tableForeignKeys = foreignKeysByTable.get(tableName) || new Map();
        
        const columns = tableColumns.map((col: any) => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          primaryKey: col.constraint_type === 'PRIMARY KEY',
          foreignKey: tableForeignKeys.get(col.column_name),
          defaultValue: col.column_default
        }));

        // Get relationships for this table
        const relationships = relationshipsByTable.get(tableName) || [];

        // Add manual relationship definitions for JSONB-based connections
        const manualRelationships = this.getManualRelationships(tableName);
        relationships.push(...manualRelationships);

        // Categorize tables based on naming patterns and known structure
        const category = this.categorizeTable(tableName);
        const description = this.getTableDescription(tableName);

        tables.push({
          name: tableName,
          columns,
          relationships,
          description,
          category
        });
      }

      // Cache the results
      this.schemaCache = {
        data: tables,
        timestamp: now
      };

      console.log(`Schema data fetched: ${tables.length} tables in ${Date.now() - now}ms`);
      return tables;
    } catch (error) {
      console.error('Error getting database schema:', error);
      return [];
    }
  }

  private getManualRelationships(tableName: string): Array<{
    type: 'one-to-many' | 'many-to-many';
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
    description: string;
  }> {
    const relationships = [];
    
    // Resources-Capabilities relationship (JSONB array in resources table)
    if (tableName === 'resources') {
      relationships.push({
        type: 'many-to-many' as const,
        fromTable: 'resources',
        fromColumn: 'capabilities',
        toTable: 'capabilities',
        toColumn: 'id',
        description: 'resources.capabilities → capabilities.id (JSONB array)'
      });
    }
    
    // Operations-Capabilities relationship (JSONB array in operations table)
    if (tableName === 'operations') {
      relationships.push({
        type: 'many-to-many' as const,
        fromTable: 'operations',
        fromColumn: 'required_capabilities',
        toTable: 'capabilities',
        toColumn: 'id',
        description: 'operations.required_capabilities → capabilities.id (JSONB array)'
      });
    }
    
    // Resource Requirements-Resources relationships
    if (tableName === 'resource_requirements') {
      relationships.push({
        type: 'many-to-many' as const,
        fromTable: 'resource_requirements',
        fromColumn: 'eligible_resource_ids',
        toTable: 'resources',
        toColumn: 'id',
        description: 'resource_requirements.eligible_resource_ids → resources.id (JSONB array)'
      });
      relationships.push({
        type: 'many-to-many' as const,
        fromTable: 'resource_requirements',
        fromColumn: 'required_capabilities',
        toTable: 'capabilities',
        toColumn: 'id',
        description: 'resource_requirements.required_capabilities → capabilities.id (JSONB array)'
      });
    }
    
    // Add more JSONB-based relationships as needed
    // Bill of Materials items relationship (JSONB array)
    if (tableName === 'bills_of_materials') {
      relationships.push({
        type: 'one-to-many' as const,
        fromTable: 'bills_of_materials',
        fromColumn: 'items',
        toTable: 'bom_items',
        toColumn: 'bom_id',
        description: 'bills_of_materials.items → bom_items.bom_id (JSONB structure)'
      });
    }
    
    return relationships;
  }

  private categorizeTable(tableName: string): string {
    // Manufacturing core entities
    if (['plants', 'resources', 'capabilities', 'operations', 'production_orders', 'routings', 'bills_of_material', 'recipes', 'production_versions'].includes(tableName)) {
      return 'Core Manufacturing';
    }
    
    // Organization
    if (['departments', 'work_centers', 'employees', 'users', 'roles', 'permissions'].includes(tableName)) {
      return 'Organization';
    }
    
    // Products & Inventory
    if (['items', 'storage_locations', 'inventory', 'inventory_lots', 'stock_items', 'stock_transactions', 'stock_balances'].includes(tableName)) {
      return 'Products & Inventory';
    }
    
    // Business Partners
    if (['PTvendors', 'customers'].includes(tableName)) {
      return 'Business Partners';
    }
    
    // Sales & Orders
    if (['sales_orders', 'purchase_orders', 'transfer_orders', 'forecasts', 'planned_orders'].includes(tableName)) {
      return 'Sales & Orders';
    }
    
    // Manufacturing Planning
    if (['shift_templates', 'resource_shift_assignments', 'capacity_planning_scenarios', 'production_plans', 'production_targets'].includes(tableName)) {
      return 'Manufacturing Planning';
    }
    
    // System Management
    if (['system_users', 'system_health', 'system_environments', 'system_upgrades', 'system_audit_logs', 'system_settings', 'error_logs'].includes(tableName)) {
      return 'System Management';
    }
    
    // Communication & Collaboration
    if (['chat_channels', 'chat_messages', 'feedback', 'disruptions'].includes(tableName)) {
      return 'Communication';
    }
    
    // AI & Optimization
    if (['optimization_profiles', 'scheduling_history', 'algorithm_performance', 'optimization_runs'].includes(tableName)) {
      return 'AI & Optimization';
    }
    
    // Default category
    return 'System Data';
  }

  private getTableDescription(tableName: string): string {
    const descriptions: Record<string, string> = {
      plants: 'Manufacturing facilities and production sites',
      resources: 'Production equipment, machines, and manufacturing resources',
      capabilities: 'Skills and abilities that resources can perform',
      operations: 'Individual manufacturing steps and processes',
      production_orders: 'Orders for manufacturing specific products',
      routings: 'Step-by-step manufacturing process definitions',
      bills_of_material: 'Product structure and component relationships',
      recipes: 'Process manufacturing formulations and procedures',
      production_versions: 'Links between products, routings, and BOMs/recipes',
      departments: 'Organizational departments and divisions',
      work_centers: 'Specific production work areas',
      employees: 'Workforce and personnel information',
      users: 'System users and authentication data',
      roles: 'User roles and access levels',
      permissions: 'System permissions and security settings',
      items: 'Products, materials, and inventory items',
      storage_locations: 'Warehouse locations and storage areas',
      inventory: 'Current inventory levels and stock data',
      PTvendors: 'Suppliers and vendor information',
      customers: 'Customer data and contact information',
      sales_orders: 'Customer orders and sales data',
      purchase_orders: 'Procurement orders and purchasing data',
      shift_templates: 'Work shift patterns and schedules',
      resource_shift_assignments: 'Assignment of resources to specific shifts',
      capacity_planning_scenarios: 'What-if capacity planning scenarios',
      production_plans: 'High-level production planning data',
      optimization_profiles: 'Saved optimization algorithm configurations',
      scheduling_history: 'Historical scheduling execution data',
      disruptions: 'Production disruptions and incidents',
      feedback: 'User feedback and improvement suggestions'
    };
    
    return descriptions[tableName] || 'System data table';
  }

  // User Management
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async searchUsers(searchTerm: string, limit: number = 10): Promise<User[]> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(
          sql`LOWER(${users.username}) LIKE ${`%${searchTerm}%`} OR 
              LOWER(${users.firstName}) LIKE ${`%${searchTerm}%`} OR 
              LOWER(${users.lastName}) LIKE ${`%${searchTerm}%`} OR 
              LOWER(CONCAT(${users.firstName}, ' ', ${users.lastName})) LIKE ${`%${searchTerm}%`}`
        )
        .limit(limit);
      return result;
    } catch (error) {
      console.error("Error searching users:", error);
      throw new Error("Failed to search users");
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user || undefined;
  }

  async getUsersWithRoles(): Promise<UserWithRoles[]> {
    const allUsers = await this.getUsers();
    
    // Get all user roles with associated role and permission data
    const userRolesList = await db
      .select({
        userId: userRoles.userId,
        role: roles,
        permission: permissions,
      })
      .from(userRoles)
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id));

    // Group roles by user ID
    const userRolesMap = new Map<number, Map<number, Role & { permissions: Permission[] }>>();
    
    userRolesList.forEach(({ userId, role, permission }) => {
      if (!role) return;
      
      if (!userRolesMap.has(userId)) {
        userRolesMap.set(userId, new Map());
      }
      
      const userRoles = userRolesMap.get(userId)!;
      if (!userRoles.has(role.id)) {
        userRoles.set(role.id, { ...role, permissions: [] });
      }
      
      if (permission) {
        userRoles.get(role.id)!.permissions.push(permission);
      }
    });

    // Combine users with their roles
    return allUsers.map(user => ({
      ...user,
      roles: Array.from(userRolesMap.get(user.id)?.values() || []),
    }));
  }

  async getUserWithRoles(id: number): Promise<UserWithRoles | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    let userRolesList;

    if (user.activeRoleId) {
      // If user has an active role, fetch that specific role directly (for demo/training modes)
      userRolesList = await db
        .select({
          role: roles,
          permission: permissions,
        })
        .from(roles)
        .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(roles.id, user.activeRoleId));
    } else {
      // Otherwise return all assigned roles for backward compatibility
      userRolesList = await db
        .select({
          role: roles,
          permission: permissions,
        })
        .from(userRoles)
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(userRoles.userId, id));
    }

    const rolesMap = new Map<number, Role & { permissions: Permission[] }>();
    
    userRolesList.forEach(({ role, permission }) => {
      if (!role) return;
      
      if (!rolesMap.has(role.id)) {
        rolesMap.set(role.id, { ...role, permissions: [] });
      }
      
      if (permission) {
        rolesMap.get(role.id)!.permissions.push(permission);
      }
    });

    // Determine current role
    let currentRole = null;
    if (user.activeRoleId) {
      // Find the active role from the fetched roles
      const activeRole = Array.from(rolesMap.values()).find(role => role.id === user.activeRoleId);
      if (activeRole) {
        currentRole = { id: activeRole.id, name: activeRole.name };
      }
    }

    return {
      ...user,
      roles: Array.from(rolesMap.values()),
      currentRole,
    };
  }

  async createUser(user: InsertUser): Promise<User> {
    // Password should already be hashed when passed to this function
    const [newUser] = await db
      .insert(users)
      .values(user)
      .returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const updateData = { ...user };
    
    // Hash password if it's being updated
    if (updateData.passwordHash) {
      updateData.passwordHash = await bcrypt.hash(updateData.passwordHash, 12);
    }
    
    const [updatedUser] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  // User Resource Assignments
  async getUserResourceAssignments(): Promise<UserResourceAssignment[]> {
    return await db.select().from(userResourceAssignments);
  }

  async getUserResourceAssignmentsByUserId(userId: number): Promise<UserResourceAssignment[]> {
    return await db
      .select()
      .from(userResourceAssignments)
      .where(eq(userResourceAssignments.userId, userId));
  }

  async getUserResourceAssignmentsByResourceId(resourceId: number): Promise<UserResourceAssignment[]> {
    return await db
      .select()
      .from(userResourceAssignments)
      .where(eq(userResourceAssignments.resourceId, resourceId));
  }

  async createUserResourceAssignment(assignment: any): Promise<UserResourceAssignment> {
    const [newAssignment] = await db
      .insert(userResourceAssignments)
      .values(assignment)
      .returning();
    return newAssignment;
  }

  async updateUserResourceAssignment(id: number, assignment: any): Promise<UserResourceAssignment | undefined> {
    const [updatedAssignment] = await db
      .update(userResourceAssignments)
      .set({ ...assignment, updatedAt: new Date() })
      .where(eq(userResourceAssignments.id, id))
      .returning();
    return updatedAssignment || undefined;
  }

  async deleteUserResourceAssignment(id: number): Promise<boolean> {
    const result = await db.delete(userResourceAssignments).where(eq(userResourceAssignments.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Operation Status Reports
  async getOperationStatusReports(): Promise<OperationStatusReport[]> {
    return await db.select().from(operationStatusReports);
  }

  async getOperationStatusReportsByOperationId(operationId: number): Promise<OperationStatusReport[]> {
    return await db
      .select()
      .from(operationStatusReports)
      .where(eq(operationStatusReports.discreteOperationId, operationId));
  }

  async createOperationStatusReport(report: any): Promise<OperationStatusReport> {
    const [newReport] = await db
      .insert(operationStatusReports)
      .values(report)
      .returning();
    return newReport;
  }

  async updateOperationStatusReport(id: number, report: any): Promise<OperationStatusReport | undefined> {
    const [updatedReport] = await db
      .update(operationStatusReports)
      .set({ ...report, updatedAt: new Date() })
      .where(eq(operationStatusReports.id, id))
      .returning();
    return updatedReport || undefined;
  }

  async deleteOperationStatusReport(id: number): Promise<boolean> {
    const result = await db.delete(operationStatusReports).where(eq(operationStatusReports.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Skip Reason Templates
  async getSkipReasonTemplates(filters?: { category?: string; active?: boolean }): Promise<SkipReasonTemplate[]> {
    let query = db.select().from(skipReasonTemplates);
    
    if (filters?.category) {
      query = query.where(eq(skipReasonTemplates.category, filters.category));
    }
    
    if (filters?.active !== undefined) {
      query = query.where(eq(skipReasonTemplates.isActive, filters.active));
    }
    
    return await query;
  }

  async createSkipReasonTemplate(template: any): Promise<SkipReasonTemplate> {
    const [newTemplate] = await db
      .insert(skipReasonTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateSkipReasonTemplate(id: number, template: any): Promise<SkipReasonTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(skipReasonTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(skipReasonTemplates.id, id))
      .returning();
    return updatedTemplate || undefined;
  }

  async deleteSkipReasonTemplate(id: number): Promise<boolean> {
    const result = await db.delete(skipReasonTemplates).where(eq(skipReasonTemplates.id, id));
    return (result.rowCount || 0) > 0;
  }

  async authenticateUser(username: string, password: string): Promise<UserWithRoles | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;

    // Update last login
    await this.updateUser(user.id, { lastLogin: new Date() });

    return await this.getUserWithRoles(user.id) || null;
  }

  // Role Management
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, id));
    return role || undefined;
  }

  async getRoleById(id: number): Promise<Role | null> {
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, id));
    return role || null;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, name));
    return role || undefined;
  }

  async getRolesByIds(roleIds: number[]): Promise<Role[]> {
    if (roleIds.length === 0) return [];
    return await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isSystemRole: roles.isSystemRole,
        createdAt: roles.createdAt,
        permissions: sql<Permission[]>`
          json_agg(
            json_build_object(
              'id', permissions.id,
              'name', permissions.name,
              'feature', permissions.feature,
              'action', permissions.action,
              'description', permissions.description
            )
          ) FILTER (WHERE permissions.id IS NOT NULL)
        `
      })
      .from(roles)
      .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(inArray(roles.id, roleIds))
      .groupBy(roles.id);
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db
      .insert(roles)
      .values(role)
      .returning();
    return newRole;
  }

  async updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined> {
    const [updatedRole] = await db
      .update(roles)
      .set(role)
      .where(eq(roles.id, id))
      .returning();
    return updatedRole || undefined;
  }

  async updateRolePermissions(roleId: number, data: { permissions: number[] }): Promise<Role | undefined> {
    // Get current permissions for this role
    const currentPermissions = await db.select({ permissionId: rolePermissions.permissionId })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
    
    const currentPermissionIds = currentPermissions.map(p => p.permissionId);
    
    // Find new permissions to add (not already present)
    const newPermissions = data.permissions.filter(permId => !currentPermissionIds.includes(permId));
    
    // Add only new permissions
    if (newPermissions.length > 0) {
      await db.insert(rolePermissions).values(
        newPermissions.map(permissionId => ({
          roleId,
          permissionId
        }))
      );
      console.log(`Added ${newPermissions.length} new permissions to role ${roleId}:`, newPermissions);
    } else {
      console.log(`No new permissions to add to role ${roleId} - all permissions already exist`);
    }
    
    // Return the updated role
    return await this.getRole(roleId);
  }

  async deleteRole(id: number): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Permission Management
  async getPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions);
  }

  async getAllPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions);
  }

  async getPermission(id: number): Promise<Permission | undefined> {
    const [permission] = await db
      .select()
      .from(permissions)
      .where(eq(permissions.id, id));
    return permission || undefined;
  }

  async getPermissionsByFeature(feature: string): Promise<Permission[]> {
    return await db
      .select()
      .from(permissions)
      .where(eq(permissions.feature, feature));
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const [newPermission] = await db
      .insert(permissions)
      .values(permission)
      .returning();
    return newPermission;
  }

  async updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission | undefined> {
    const [updatedPermission] = await db
      .update(permissions)
      .set(permission)
      .where(eq(permissions.id, id))
      .returning();
    return updatedPermission || undefined;
  }

  async deletePermission(id: number): Promise<boolean> {
    const result = await db.delete(permissions).where(eq(permissions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // User Role Assignment
  async getUserRoles(userId: number): Promise<UserRole[]> {
    return await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId));
  }

  async assignUserRole(userRole: InsertUserRole): Promise<UserRole> {
    const [newUserRole] = await db
      .insert(userRoles)
      .values(userRole)
      .returning();
    return newUserRole;
  }

  async removeUserRole(userId: number, roleId: number): Promise<boolean> {
    const result = await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
    return (result.rowCount || 0) > 0;
  }

  // Role Permission Assignment
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const results = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        feature: permissions.feature,
        action: permissions.action,
        description: permissions.description
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));
    
    return results;
  }

  async assignRolePermission(rolePermission: InsertRolePermission): Promise<RolePermission> {
    const [newRolePermission] = await db
      .insert(rolePermissions)
      .values(rolePermission)
      .returning();
    return newRolePermission;
  }

  async removeRolePermission(roleId: number, permissionId: number): Promise<boolean> {
    const result = await db
      .delete(rolePermissions)
      .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)));
    return (result.rowCount || 0) > 0;
  }

  // Permission Checking
  async hasPermission(userId: number, feature: string, action: string): Promise<boolean> {
    const userWithRoles = await this.getUserWithRoles(userId);
    if (!userWithRoles) return false;

    return userWithRoles.roles.some(role =>
      role.permissions.some(permission =>
        permission.feature === feature && permission.action === action
      )
    );
  }

  async getUserPermissions(userId: number): Promise<Permission[]> {
    const userWithRoles = await this.getUserWithRoles(userId);
    if (!userWithRoles) return [];

    const allPermissions = userWithRoles.roles.flatMap(role => role.permissions);
    
    // Remove duplicates
    const uniquePermissions = allPermissions.filter((permission, index, self) =>
      index === self.findIndex(p => p.id === permission.id)
    );

    return uniquePermissions;
  }

  // Authentication Methods
  async getUserWithRolesAndPermissions(usernameOrId: string | number): Promise<UserWithRoles | undefined> {
    if (typeof usernameOrId === 'string') {
      return await this.getUserWithRolesByUsername(usernameOrId);
    } else {
      return await this.getUserWithRoles(usernameOrId);
    }
  }

  async updateUserLastLogin(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, userId));
  }

  private async getUserWithRolesByUsername(usernameOrEmail: string): Promise<UserWithRoles | undefined> {
    // Make username and email lookup case-insensitive - support both username and email login
    const [user] = await db.select().from(users).where(
      or(
        sql`LOWER(${users.username}) = LOWER(${usernameOrEmail})`,
        sql`LOWER(${users.email}) = LOWER(${usernameOrEmail})`
      )
    );
    if (!user) return undefined;

    return await this.getUserWithRoles(user.id);
  }

  // Role Management Methods
  async getRolesWithPermissionsAndUserCount() {
    try {
      const rolesData = await db.select().from(roles).orderBy(roles.name);

      const rolesWithPermissions = await Promise.all(rolesData.map(async (role) => {
        // Get permissions for this role
        const permissionsData = await db
          .select()
          .from(permissions)
          .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
          .where(eq(rolePermissions.roleId, role.id));

        // Get user count for this role
        const userCountResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(userRoles)
          .where(eq(userRoles.roleId, role.id));
        
        const rawCount = userCountResult[0]?.count;
        const userCount = parseInt(String(rawCount)) || 0;
        
        // Debug logging for large user counts
        if (userCount > 100) {
          console.log(`DEBUG: Role ${role.name} has suspiciously high user count:`, {
            roleId: role.id,
            rawCount,
            userCount,
            userCountResult
          });
        }

        return {
          ...role,
          permissions: permissionsData.map(p => p.permissions),
          userCount,
        };
      }));

      return rolesWithPermissions;
    } catch (error) {
      console.error('Error in getRolesWithPermissionsAndUserCount:', error);
      throw error;
    }
  }

  async createRoleWithPermissions(roleData: { name: string; description: string }, permissionIds: number[]) {
    const result = await db.transaction(async (tx) => {
      // Create the role
      const [newRole] = await tx
        .insert(roles)
        .values({
          name: roleData.name,
          description: roleData.description,
          isSystemRole: false,
        })
        .returning();

      // Assign permissions to the role
      if (permissionIds.length > 0) {
        const rolePermissionData = permissionIds.map(permissionId => ({
          roleId: newRole.id,
          permissionId,
        }));

        await tx.insert(rolePermissions).values(rolePermissionData);
      }

      // Get the complete role with permissions
      const permissionsData = await tx
        .select({
          id: permissions.id,
          name: permissions.name,
          feature: permissions.feature,
          action: permissions.action,
          description: permissions.description,
        })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .where(eq(rolePermissions.roleId, newRole.id));

      return {
        ...newRole,
        permissions: permissionsData,
        userCount: 0,
      };
    });

    return result;
  }

  async updateRoleWithPermissions(roleId: number, roleData: { name: string; description: string }, permissionIds: number[]) {
    const result = await db.transaction(async (tx) => {
      // Update the role
      const [updatedRole] = await tx
        .update(roles)
        .set({
          name: roleData.name,
          description: roleData.description,
          updatedAt: new Date(),
        })
        .where(eq(roles.id, roleId))
        .returning();

      if (!updatedRole) {
        return null;
      }

      // Remove existing permissions
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

      // Assign new permissions
      if (permissionIds.length > 0) {
        const rolePermissionData = permissionIds.map(permissionId => ({
          roleId,
          permissionId,
        }));

        await tx.insert(rolePermissions).values(rolePermissionData);
      }

      // Get the complete role with permissions
      const permissionsData = await tx
        .select({
          id: permissions.id,
          name: permissions.name,
          feature: permissions.feature,
          action: permissions.action,
          description: permissions.description,
        })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .where(eq(rolePermissions.roleId, roleId));

      // Get user count
      const userCountResult = await tx
        .select({ count: sql<number>`count(*)` })
        .from(userRoles)
        .where(eq(userRoles.roleId, roleId));
      
      const userCount = userCountResult[0]?.count || 0;

      return {
        ...updatedRole,
        permissions: permissionsData,
        userCount,
      };
    });

    return result;
  }

  async getRoleWithUserCount(roleId: number) {
    const roleData = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isSystemRole: roles.isSystemRole,
      })
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (roleData.length === 0) {
      return null;
    }

    const role = roleData[0];

    // Get user count
    const userCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userRoles)
      .where(eq(userRoles.roleId, roleId));
    
    const userCount = userCountResult[0]?.count || 0;

    return {
      ...role,
      userCount,
    };
  }

  async deleteRole(roleId: number): Promise<boolean> {
    const result = await db.transaction(async (tx) => {
      // Remove role permissions first
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      
      // Remove user role assignments
      await tx.delete(userRoles).where(eq(userRoles.roleId, roleId));
      
      // Delete the role
      const deleteResult = await tx.delete(roles).where(eq(roles.id, roleId));
      return (deleteResult.rowCount || 0) > 0;
    });
    
    return result;
  }

  async getPermissionsGroupedByFeature() {
    const allPermissions = await db
      .select()
      .from(permissions)
      .orderBy(permissions.feature, permissions.action);

    const groupedPermissions = allPermissions.reduce((groups, permission) => {
      const existingGroup = groups.find(g => g.feature === permission.feature);
      if (existingGroup) {
        existingGroup.permissions.push(permission);
      } else {
        groups.push({
          feature: permission.feature,
          permissions: [permission],
        });
      }
      return groups;
    }, [] as Array<{ feature: string; permissions: any[] }>);

    return groupedPermissions;
  }

  // Role Switching Methods
  async switchUserRole(userId: number, roleId: number) {
    const [updatedUser] = await db
      .update(users)
      .set({ activeRoleId: roleId })
      .where(eq(users.id, userId))
      .returning();
    
    return await this.getUserWithRoles(userId);
  }

  async getUserCurrentRole(userId: number) {
    const [user] = await db
      .select({
        activeRoleId: users.activeRoleId
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user?.activeRoleId) {
      return null;
    }

    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, user.activeRoleId));

    return role || null;
  }

  async getUserRoles(userId: number) {
    const userRolesData = await db
      .select()
      .from(roles)
      .innerJoin(userRoles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.userId, userId))
      .orderBy(roles.name);

    return userRolesData.map(ur => ur.roles);
  }

  async getAllRolesWithPermissionCount() {
    const rolesData = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        permissionCount: sql<number>`count(${permissions.id})`.as('permission_count')
      })
      .from(roles)
      .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .groupBy(roles.id, roles.name, roles.description)
      .orderBy(roles.name);

    return rolesData;
  }

  // Visual Factory Displays
  async getVisualFactoryDisplays(): Promise<VisualFactoryDisplay[]> {
    return await db.select().from(visualFactoryDisplays).orderBy(desc(visualFactoryDisplays.createdAt));
  }

  async getVisualFactoryDisplay(id: number): Promise<VisualFactoryDisplay | undefined> {
    const [display] = await db.select().from(visualFactoryDisplays).where(eq(visualFactoryDisplays.id, id));
    return display;
  }

  async createVisualFactoryDisplay(display: InsertVisualFactoryDisplay): Promise<VisualFactoryDisplay> {
    const [newDisplay] = await db.insert(visualFactoryDisplays).values(display).returning();
    return newDisplay;
  }

  async updateVisualFactoryDisplay(id: number, display: Partial<InsertVisualFactoryDisplay>): Promise<VisualFactoryDisplay | undefined> {
    const [updatedDisplay] = await db
      .update(visualFactoryDisplays)
      .set({ ...display, updatedAt: new Date() })
      .where(eq(visualFactoryDisplays.id, id))
      .returning();
    return updatedDisplay;
  }

  async deleteVisualFactoryDisplay(id: number): Promise<boolean> {
    const result = await db.delete(visualFactoryDisplays).where(eq(visualFactoryDisplays.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Demo Tour Participants
  async getDemoTourParticipants(): Promise<DemoTourParticipant[]> {
    return await db.select().from(demoTourParticipants).orderBy(desc(demoTourParticipants.createdAt));
  }

  async getDemoTourParticipant(id: number): Promise<DemoTourParticipant | undefined> {
    const [participant] = await db.select().from(demoTourParticipants).where(eq(demoTourParticipants.id, id));
    return participant;
  }

  async getDemoTourParticipantByEmail(email: string): Promise<DemoTourParticipant | undefined> {
    const [participant] = await db.select().from(demoTourParticipants).where(eq(demoTourParticipants.email, email));
    return participant;
  }

  async createDemoTourParticipant(participant: InsertDemoTourParticipant): Promise<DemoTourParticipant> {
    const [newParticipant] = await db.insert(demoTourParticipants).values(participant).returning();
    return newParticipant;
  }

  async updateDemoTourParticipant(id: number, participant: Partial<InsertDemoTourParticipant>): Promise<DemoTourParticipant | undefined> {
    const [updatedParticipant] = await db
      .update(demoTourParticipants)
      .set({ ...participant, updatedAt: new Date() })
      .where(eq(demoTourParticipants.id, id))
      .returning();
    return updatedParticipant;
  }

  async completeDemoTour(id: number, feedback?: string): Promise<DemoTourParticipant | undefined> {
    const [updatedParticipant] = await db
      .update(demoTourParticipants)
      .set({ 
        isCompleted: true, 
        tourCompletedAt: new Date(),
        feedback: feedback || undefined,
        updatedAt: new Date() 
      })
      .where(eq(demoTourParticipants.id, id))
      .returning();
    return updatedParticipant;
  }

  async addTourStep(participantId: number, step: { stepId: string; stepTitle: string; roleId: string; completedAt: string; duration: number }): Promise<boolean> {
    // Get current participant
    const participant = await this.getDemoTourParticipant(participantId);
    if (!participant) return false;

    // Add new step to existing steps
    const currentSteps = participant.tourSteps || [];
    const updatedSteps = [...currentSteps, step];

    // Update participant with new steps
    const result = await db
      .update(demoTourParticipants)
      .set({ 
        tourSteps: updatedSteps,
        updatedAt: new Date() 
      })
      .where(eq(demoTourParticipants.id, participantId));

    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Voice Recordings Cache
  async getVoiceRecording(textHash: string): Promise<VoiceRecordingsCache | undefined> {
    const [recording] = await db.select().from(voiceRecordingsCache).where(eq(voiceRecordingsCache.textHash, textHash));
    return recording;
  }

  async createVoiceRecording(recording: InsertVoiceRecordingsCache): Promise<VoiceRecordingsCache> {
    const [newRecording] = await db.insert(voiceRecordingsCache).values(recording).returning();
    return newRecording;
  }

  async updateVoiceRecordingUsage(id: number): Promise<void> {
    await db
      .update(voiceRecordingsCache)
      .set({ 
        usageCount: sql`${voiceRecordingsCache.usageCount} + 1`,
        lastUsedAt: new Date()
      })
      .where(eq(voiceRecordingsCache.id, id));
  }

  async saveVoiceRecording(recording: InsertVoiceRecordingsCache): Promise<VoiceRecordingsCache> {
    return this.createVoiceRecording(recording);
  }

  // Tours methods
  async getTours(): Promise<Tour[]> {
    return await db.select().from(tours).orderBy(asc(tours.roleDisplayName));
  }

  async getTour(id: number): Promise<Tour | undefined> {
    const [tour] = await db.select().from(tours).where(eq(tours.id, id));
    return tour;
  }

  async getTourByRoleId(roleId: number): Promise<Tour | undefined> {
    const [tour] = await db.select().from(tours).where(eq(tours.roleId, roleId));
    return tour;
  }

  async createTour(tour: InsertTour): Promise<Tour> {
    const [newTour] = await db.insert(tours).values(tour).returning();
    return newTour;
  }

  async updateTour(id: number, tour: Partial<InsertTour>): Promise<Tour | undefined> {
    const [updatedTour] = await db
      .update(tours)
      .set({ ...tour, updatedAt: new Date() })
      .where(eq(tours.id, id))
      .returning();
    return updatedTour;
  }

  async deleteTour(id: number): Promise<boolean> {
    const result = await db.delete(tours).where(eq(tours.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async upsertTour(tour: InsertTour): Promise<Tour> {
    // Check if tour already exists for this role
    const existingTour = await this.getTourByRoleId(tour.roleId);
    
    if (existingTour) {
      // Update existing tour
      const [updatedTour] = await db
        .update(tours)
        .set({ ...tour, updatedAt: new Date() })
        .where(eq(tours.roleId, tour.roleId))
        .returning();
      return updatedTour;
    } else {
      // Create new tour
      const [newTour] = await db.insert(tours).values(tour).returning();
      return newTour;
    }
  }

  // Tour Prompt Templates methods
  async getTourPromptTemplates(category?: string, userId?: number): Promise<TourPromptTemplate[]> {
    let query = db.select().from(tourPromptTemplates).where(eq(tourPromptTemplates.isActive, true));
    
    if (category) {
      query = query.where(eq(tourPromptTemplates.category, category));
    }
    
    if (userId) {
      query = query.where(or(
        eq(tourPromptTemplates.isBuiltIn, true),
        eq(tourPromptTemplates.createdBy, userId)
      ));
    }
    
    return await query.orderBy(desc(tourPromptTemplates.usageCount), desc(tourPromptTemplates.rating));
  }

  async getTourPromptTemplate(id: number): Promise<TourPromptTemplate | undefined> {
    const [template] = await db.select().from(tourPromptTemplates).where(
      and(eq(tourPromptTemplates.id, id), eq(tourPromptTemplates.isActive, true))
    );
    return template;
  }

  async getTourPromptTemplateByName(name: string): Promise<TourPromptTemplate | undefined> {
    const [template] = await db.select().from(tourPromptTemplates).where(
      and(eq(tourPromptTemplates.name, name), eq(tourPromptTemplates.isActive, true))
    );
    return template;
  }

  async createTourPromptTemplate(template: InsertTourPromptTemplate): Promise<TourPromptTemplate> {
    const [newTemplate] = await db.insert(tourPromptTemplates).values({
      ...template,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newTemplate;
  }

  async updateTourPromptTemplate(id: number, template: Partial<InsertTourPromptTemplate>): Promise<TourPromptTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(tourPromptTemplates)
      .set({ 
        ...template, 
        updatedAt: new Date(),
        updatedBy: template.updatedBy 
      })
      .where(eq(tourPromptTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteTourPromptTemplate(id: number): Promise<boolean> {
    // Soft delete by setting isActive to false
    const result = await db
      .update(tourPromptTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(tourPromptTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getBuiltInTourPromptTemplates(): Promise<TourPromptTemplate[]> {
    return await db.select().from(tourPromptTemplates).where(
      and(eq(tourPromptTemplates.isBuiltIn, true), eq(tourPromptTemplates.isActive, true))
    ).orderBy(desc(tourPromptTemplates.usageCount));
  }

  async getPopularTourPromptTemplates(limit: number = 10): Promise<TourPromptTemplate[]> {
    return await db.select().from(tourPromptTemplates).where(
      eq(tourPromptTemplates.isActive, true)
    ).orderBy(
      desc(tourPromptTemplates.usageCount), 
      desc(tourPromptTemplates.rating)
    ).limit(limit);
  }

  async updateTourPromptTemplateUsage(id: number): Promise<void> {
    await db
      .update(tourPromptTemplates)
      .set({ 
        usageCount: sql`${tourPromptTemplates.usageCount} + 1`,
        lastUsed: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tourPromptTemplates.id, id));
  }

  async rateTourPromptTemplate(id: number, rating: number): Promise<void> {
    await db
      .update(tourPromptTemplates)
      .set({ 
        rating: Math.max(1, Math.min(5, rating)), // Ensure rating is 1-5
        updatedAt: new Date()
      })
      .where(eq(tourPromptTemplates.id, id));
  }

  // Tour Prompt Template Usage methods
  async getTourPromptTemplateUsage(templateId?: number, userId?: number): Promise<TourPromptTemplateUsage[]> {
    let query = db.select().from(tourPromptTemplateUsage);
    
    if (templateId) {
      query = query.where(eq(tourPromptTemplateUsage.templateId, templateId));
    }
    
    if (userId) {
      query = query.where(eq(tourPromptTemplateUsage.userId, userId));
    }
    
    return await query.orderBy(desc(tourPromptTemplateUsage.createdAt));
  }

  async createTourPromptTemplateUsage(usage: InsertTourPromptTemplateUsage): Promise<TourPromptTemplateUsage> {
    const [newUsage] = await db.insert(tourPromptTemplateUsage).values({
      ...usage,
      createdAt: new Date()
    }).returning();
    
    // Update template usage count
    await this.updateTourPromptTemplateUsage(usage.templateId);
    
    return newUsage;
  }

  async getTourPromptTemplateStats(templateId: number): Promise<{
    totalUsage: number;
    averageRating: number;
    lastUsed: Date | null;
    userCount: number;
  }> {
    const usageStats = await db
      .select({
        totalUsage: count(tourPromptTemplateUsage.id),
        averageRating: sql`AVG(${tourPromptTemplateUsage.satisfactionRating})`,
        userCount: sql`COUNT(DISTINCT ${tourPromptTemplateUsage.userId})`
      })
      .from(tourPromptTemplateUsage)
      .where(eq(tourPromptTemplateUsage.templateId, templateId));

    const template = await this.getTourPromptTemplate(templateId);
    
    return {
      totalUsage: usageStats[0]?.totalUsage || 0,
      averageRating: parseFloat(usageStats[0]?.averageRating as string) || 0,
      lastUsed: template?.lastUsed || null,
      userCount: usageStats[0]?.userCount || 0
    };
  }

  // Disruption Management Implementation
  async getDisruptions(): Promise<Disruption[]> {
    return await db.select().from(disruptions).orderBy(desc(disruptions.createdAt));
  }

  async getActiveDisruptions(): Promise<Disruption[]> {
    return await db.select()
      .from(disruptions)
      .where(eq(disruptions.status, 'active'))
      .orderBy(desc(disruptions.severity), desc(disruptions.createdAt));
  }

  async getDisruption(id: number): Promise<Disruption | undefined> {
    const [disruption] = await db.select().from(disruptions).where(eq(disruptions.id, id));
    return disruption;
  }

  async createDisruption(disruption: InsertDisruption): Promise<Disruption> {
    const [newDisruption] = await db.insert(disruptions).values({
      ...disruption,
      startTime: typeof disruption.startTime === 'string' ? new Date(disruption.startTime) : disruption.startTime,
      actualEndTime: disruption.actualEndTime 
        ? (typeof disruption.actualEndTime === 'string' ? new Date(disruption.actualEndTime) : disruption.actualEndTime)
        : undefined
    }).returning();
    return newDisruption;
  }

  async updateDisruption(id: number, disruption: Partial<InsertDisruption>): Promise<Disruption | undefined> {
    const updateData: any = { ...disruption, updatedAt: new Date() };
    
    if (disruption.startTime) {
      updateData.startTime = typeof disruption.startTime === 'string' ? new Date(disruption.startTime) : disruption.startTime;
    }
    if (disruption.actualEndTime) {
      updateData.actualEndTime = typeof disruption.actualEndTime === 'string' ? new Date(disruption.actualEndTime) : disruption.actualEndTime;
    }

    const [updatedDisruption] = await db
      .update(disruptions)
      .set(updateData)
      .where(eq(disruptions.id, id))
      .returning();
    return updatedDisruption;
  }

  async deleteDisruption(id: number): Promise<boolean> {
    const result = await db.delete(disruptions).where(eq(disruptions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Disruption Actions Implementation
  async getDisruptionActions(disruptionId?: number): Promise<DisruptionAction[]> {
    const query = db.select().from(disruptionActions);
    if (disruptionId) {
      return await query.where(eq(disruptionActions.disruptionId, disruptionId)).orderBy(desc(disruptionActions.createdAt));
    }
    return await query.orderBy(desc(disruptionActions.createdAt));
  }

  async getDisruptionAction(id: number): Promise<DisruptionAction | undefined> {
    const [action] = await db.select().from(disruptionActions).where(eq(disruptionActions.id, id));
    return action;
  }

  async createDisruptionAction(action: InsertDisruptionAction): Promise<DisruptionAction> {
    const [newAction] = await db.insert(disruptionActions).values({
      ...action,
      scheduledTime: action.scheduledTime 
        ? (typeof action.scheduledTime === 'string' ? new Date(action.scheduledTime) : action.scheduledTime)
        : undefined,
      completedTime: action.completedTime 
        ? (typeof action.completedTime === 'string' ? new Date(action.completedTime) : action.completedTime)
        : undefined
    }).returning();
    return newAction;
  }

  async updateDisruptionAction(id: number, action: Partial<InsertDisruptionAction>): Promise<DisruptionAction | undefined> {
    const updateData: any = { ...action };
    
    if (action.scheduledTime) {
      updateData.scheduledTime = typeof action.scheduledTime === 'string' ? new Date(action.scheduledTime) : action.scheduledTime;
    }
    if (action.completedTime) {
      updateData.completedTime = typeof action.completedTime === 'string' ? new Date(action.completedTime) : action.completedTime;
    }

    const [updatedAction] = await db
      .update(disruptionActions)
      .set(updateData)
      .where(eq(disruptionActions.id, id))
      .returning();
    return updatedAction;
  }

  async deleteDisruptionAction(id: number): Promise<boolean> {
    const result = await db.delete(disruptionActions).where(eq(disruptionActions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Disruption Escalations Implementation
  async getDisruptionEscalations(disruptionId?: number): Promise<DisruptionEscalation[]> {
    const query = db.select().from(disruptionEscalations);
    if (disruptionId) {
      return await query.where(eq(disruptionEscalations.disruptionId, disruptionId)).orderBy(desc(disruptionEscalations.createdAt));
    }
    return await query.orderBy(desc(disruptionEscalations.createdAt));
  }

  async getDisruptionEscalation(id: number): Promise<DisruptionEscalation | undefined> {
    const [escalation] = await db.select().from(disruptionEscalations).where(eq(disruptionEscalations.id, id));
    return escalation;
  }

  async createDisruptionEscalation(escalation: InsertDisruptionEscalation): Promise<DisruptionEscalation> {
    const [newEscalation] = await db.insert(disruptionEscalations).values({
      ...escalation,
      expectedResponse: escalation.expectedResponse 
        ? (typeof escalation.expectedResponse === 'string' ? new Date(escalation.expectedResponse) : escalation.expectedResponse)
        : undefined,
      actualResponse: escalation.actualResponse 
        ? (typeof escalation.actualResponse === 'string' ? new Date(escalation.actualResponse) : escalation.actualResponse)
        : undefined
    }).returning();
    return newEscalation;
  }

  async updateDisruptionEscalation(id: number, escalation: Partial<InsertDisruptionEscalation>): Promise<DisruptionEscalation | undefined> {
    const updateData: any = { ...escalation };
    
    if (escalation.expectedResponse) {
      updateData.expectedResponse = typeof escalation.expectedResponse === 'string' ? new Date(escalation.expectedResponse) : escalation.expectedResponse;
    }
    if (escalation.actualResponse) {
      updateData.actualResponse = typeof escalation.actualResponse === 'string' ? new Date(escalation.actualResponse) : escalation.actualResponse;
    }

    const [updatedEscalation] = await db
      .update(disruptionEscalations)
      .set(updateData)
      .where(eq(disruptionEscalations.id, id))
      .returning();
    return updatedEscalation;
  }

  async deleteDisruptionEscalation(id: number): Promise<boolean> {
    const result = await db.delete(disruptionEscalations).where(eq(disruptionEscalations.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // User Preferences Operations
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [preferences] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return preferences || undefined;
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [newPreferences] = await db
      .insert(userPreferences)
      .values(preferences)
      .returning();
    return newPreferences;
  }

  async updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const [updatedPreferences] = await db
      .update(userPreferences)
      .set({ ...preferences, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return updatedPreferences || undefined;
  }

  async upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [upsertedPreferences] = await db
      .insert(userPreferences)
      .values(preferences)
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upsertedPreferences;
  }

  // User Profile Operations
  async updateUserProfile(userId: number, profile: { 
    avatar?: string; 
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
    jobTitle?: string; 
    department?: string; 
    phoneNumber?: string; 
  }): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        ...profile,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }

  // Chat System Implementations

  // Chat Channels
  async getChatChannels(userId: number): Promise<ChatChannel[]> {
    const results = await db
      .select({
        id: chatChannels.id,
        name: chatChannels.name,
        type: chatChannels.type,
        description: chatChannels.description,
        contextType: chatChannels.contextType,
        contextId: chatChannels.contextId,
        isPrivate: chatChannels.isPrivate,
        createdBy: chatChannels.createdBy,
        createdAt: chatChannels.createdAt,
        updatedAt: chatChannels.updatedAt,
        lastMessageAt: chatChannels.lastMessageAt,
      })
      .from(chatChannels)
      .innerJoin(chatMembers, eq(chatChannels.id, chatMembers.channelId))
      .where(eq(chatMembers.userId, userId))
      .orderBy(desc(chatChannels.createdAt));
    
    return results;
  }

  async getChatChannel(id: number): Promise<ChatChannel | undefined> {
    const [channel] = await db.select().from(chatChannels).where(eq(chatChannels.id, id));
    return channel || undefined;
  }

  async createChatChannel(channel: InsertChatChannel): Promise<ChatChannel> {
    const [newChannel] = await db.insert(chatChannels).values(channel).returning();
    
    // Automatically add the creator as an owner member
    await db.insert(chatMembers).values({
      channelId: newChannel.id,
      userId: channel.createdBy,
      role: 'owner',
    });
    
    return newChannel;
  }

  async updateChatChannel(id: number, channel: Partial<InsertChatChannel>): Promise<ChatChannel | undefined> {
    const [updatedChannel] = await db
      .update(chatChannels)
      .set({ ...channel, updatedAt: new Date() })
      .where(eq(chatChannels.id, id))
      .returning();
    return updatedChannel || undefined;
  }

  async deleteChatChannel(id: number): Promise<boolean> {
    const result = await db.delete(chatChannels).where(eq(chatChannels.id, id));
    return result.rowCount > 0;
  }

  // Chat Members
  async getChatMembers(channelId: number): Promise<ChatMember[]> {
    return await db.select().from(chatMembers).where(eq(chatMembers.channelId, channelId));
  }

  async addChatMember(member: InsertChatMember): Promise<ChatMember> {
    const [newMember] = await db.insert(chatMembers).values(member).returning();
    return newMember;
  }

  async removeChatMember(channelId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(chatMembers)
      .where(and(eq(chatMembers.channelId, channelId), eq(chatMembers.userId, userId)));
    return result.rowCount > 0;
  }

  async updateChatMemberRole(channelId: number, userId: number, role: string): Promise<ChatMember | undefined> {
    const [updatedMember] = await db
      .update(chatMembers)
      .set({ role })
      .where(and(eq(chatMembers.channelId, channelId), eq(chatMembers.userId, userId)))
      .returning();
    return updatedMember || undefined;
  }

  // Chat Messages
  async getChatMessages(channelId: number, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.channelId, channelId), isNull(chatMessages.deletedAt)))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    const [message] = await db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.id, id), isNull(chatMessages.deletedAt)));
    return message || undefined;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    
    // Update the channel's lastMessageAt timestamp
    await db
      .update(chatChannels)
      .set({ lastMessageAt: new Date() })
      .where(eq(chatChannels.id, message.channelId));
    
    return newMessage;
  }

  async updateChatMessage(id: number, message: Partial<InsertChatMessage>): Promise<ChatMessage | undefined> {
    const [updatedMessage] = await db
      .update(chatMessages)
      .set({ ...message, isEdited: true, editedAt: new Date() })
      .where(eq(chatMessages.id, id))
      .returning();
    return updatedMessage || undefined;
  }

  async deleteChatMessage(id: number): Promise<boolean> {
    const [deletedMessage] = await db
      .update(chatMessages)
      .set({ deletedAt: new Date() })
      .where(eq(chatMessages.id, id))
      .returning();
    return !!deletedMessage;
  }

  async updateMessageTranslation(messageId: number, targetLanguage: string, translatedText: string): Promise<ChatMessage | undefined> {
    const message = await this.getChatMessage(messageId);
    if (!message) return undefined;

    const currentTranslations = message.translations || {};
    const updatedTranslations = {
      ...currentTranslations,
      [targetLanguage]: translatedText
    };

    const [updatedMessage] = await db
      .update(chatMessages)
      .set({ translations: updatedTranslations })
      .where(eq(chatMessages.id, messageId))
      .returning();
    
    return updatedMessage || undefined;
  }

  async searchMessages(userId: number, query: string, channelId?: number): Promise<ChatMessage[]> {
    const whereConditions = [
      isNull(chatMessages.deletedAt),
      ilike(chatMessages.content, `%${query}%`)
    ];

    if (channelId) {
      whereConditions.push(eq(chatMessages.channelId, channelId));
    }

    // First get channels the user is a member of
    const userChannels = await db
      .select({ channelId: chatMembers.channelId })
      .from(chatMembers)
      .where(eq(chatMembers.userId, userId));

    const userChannelIds = userChannels.map(c => c.channelId);
    
    if (userChannelIds.length === 0) {
      return [];
    }

    if (!channelId) {
      whereConditions.push(inArray(chatMessages.channelId, userChannelIds));
    }

    return await db
      .select()
      .from(chatMessages)
      .where(and(...whereConditions))
      .orderBy(desc(chatMessages.createdAt))
      .limit(50);
  }

  // Chat Reactions
  async getChatReactions(messageId: number): Promise<ChatReaction[]> {
    return await db.select().from(chatReactions).where(eq(chatReactions.messageId, messageId));
  }

  async addChatReaction(reaction: InsertChatReaction): Promise<ChatReaction> {
    const [newReaction] = await db.insert(chatReactions).values(reaction).returning();
    return newReaction;
  }

  async removeChatReaction(messageId: number, userId: number, emoji: string): Promise<boolean> {
    const result = await db
      .delete(chatReactions)
      .where(
        and(
          eq(chatReactions.messageId, messageId),
          eq(chatReactions.userId, userId),
          eq(chatReactions.emoji, emoji)
        )
      );
    return result.rowCount > 0;
  }

  // Direct Messages
  async getOrCreateDirectChannel(user1Id: number, user2Id: number): Promise<ChatChannel> {
    // First try to find existing direct message channel between these users
    const existingChannel = await db
      .select({ channel: chatChannels })
      .from(chatChannels)
      .innerJoin(chatMembers, eq(chatChannels.id, chatMembers.channelId))
      .where(
        and(
          eq(chatChannels.type, 'direct'),
          or(
            and(eq(chatMembers.userId, user1Id)),
            and(eq(chatMembers.userId, user2Id))
          )
        )
      )
      .groupBy(chatChannels.id)
      .having(sql`count(distinct ${chatMembers.userId}) = 2`);

    if (existingChannel.length > 0) {
      return existingChannel[0].channel;
    }

    // Create new direct message channel
    const [newChannel] = await db
      .insert(chatChannels)
      .values({
        name: `Direct Message`,
        type: 'direct',
        isPrivate: true,
        createdBy: user1Id,
      })
      .returning();

    // Add both users as members
    await db.insert(chatMembers).values([
      { channelId: newChannel.id, userId: user1Id, role: 'member' },
      { channelId: newChannel.id, userId: user2Id, role: 'member' },
    ]);

    return newChannel;
  }

  // Contextual Chats
  async getContextualChannel(contextType: string, contextId: number): Promise<ChatChannel | undefined> {
    const [channel] = await db
      .select()
      .from(chatChannels)
      .where(
        and(
          eq(chatChannels.type, 'contextual'),
          eq(chatChannels.contextType, contextType),
          eq(chatChannels.contextId, contextId)
        )
      );
    return channel || undefined;
  }

  async createContextualChannel(contextType: string, contextId: number, name: string, createdBy: number): Promise<ChatChannel> {
    const [newChannel] = await db
      .insert(chatChannels)
      .values({
        name,
        type: 'contextual',
        contextType,
        contextId,
        isPrivate: false,
        createdBy,
      })
      .returning();

    // Add creator as owner
    await db.insert(chatMembers).values({
      channelId: newChannel.id,
      userId: createdBy,
      role: 'owner',
    });

    return newChannel;
  }

  // Stock Management
  async getStockItems(): Promise<StockItem[]> {
    return await db.select().from(stockItems).orderBy(asc(stockItems.name));
  }

  async getStockItem(id: number): Promise<StockItem | undefined> {
    const [item] = await db.select().from(stockItems).where(eq(stockItems.id, id));
    return item || undefined;
  }

  async getStockItemBySku(sku: string): Promise<StockItem | undefined> {
    const [item] = await db.select().from(stockItems).where(eq(stockItems.sku, sku));
    return item || undefined;
  }

  async createStockItem(item: InsertStockItem): Promise<StockItem> {
    const [newItem] = await db.insert(stockItems).values(item).returning();
    return newItem;
  }

  async updateStockItem(id: number, item: Partial<InsertStockItem>): Promise<StockItem | undefined> {
    const [updatedItem] = await db
      .update(stockItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(stockItems.id, id))
      .returning();
    return updatedItem || undefined;
  }

  async deleteStockItem(id: number): Promise<boolean> {
    const result = await db.delete(stockItems).where(eq(stockItems.id, id));
    return result.rowCount! > 0;
  }

  async getStockTransactions(itemId?: number): Promise<StockTransaction[]> {
    if (itemId) {
      return await db.select().from(stockTransactions)
        .where(eq(stockTransactions.itemId, itemId))
        .orderBy(desc(stockTransactions.createdAt));
    }
    return await db.select().from(stockTransactions).orderBy(desc(stockTransactions.createdAt));
  }

  async createStockTransaction(transaction: InsertStockTransaction): Promise<StockTransaction> {
    const [newTransaction] = await db.insert(stockTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getStockBalances(): Promise<StockBalance[]> {
    return await db.select().from(stockBalances).orderBy(asc(stockBalances.itemId));
  }

  async getStockBalance(itemId: number, location?: string): Promise<StockBalance | undefined> {
    let query = db.select().from(stockBalances).where(eq(stockBalances.itemId, itemId));
    if (location) {
      query = query.where(eq(stockBalances.location, location));
    }
    const [balance] = await query;
    return balance || undefined;
  }

  async updateStockBalance(itemId: number, location: string, balance: Partial<InsertStockBalance>): Promise<StockBalance | undefined> {
    const [updatedBalance] = await db
      .update(stockBalances)
      .set({ ...balance, updatedAt: new Date() })
      .where(and(eq(stockBalances.itemId, itemId), eq(stockBalances.location, location)))
      .returning();
    return updatedBalance || undefined;
  }

  // Demand Forecasting
  async getDemandForecasts(stockId?: number): Promise<DemandForecast[]> {
    if (stockId) {
      return await db.select().from(demandForecasts)
        .where(eq(demandForecasts.stockId, stockId))
        .orderBy(desc(demandForecasts.forecastDate));
    }
    return await db.select().from(demandForecasts).orderBy(desc(demandForecasts.forecastDate));
  }

  async createDemandForecast(forecast: InsertDemandForecast): Promise<DemandForecast> {
    const [newForecast] = await db.insert(demandForecasts).values(forecast).returning();
    return newForecast;
  }

  async updateDemandForecast(id: number, forecast: Partial<InsertDemandForecast>): Promise<DemandForecast | undefined> {
    const [updatedForecast] = await db
      .update(demandForecasts)
      .set({ ...forecast, updatedAt: new Date() })
      .where(eq(demandForecasts.id, id))
      .returning();
    return updatedForecast || undefined;
  }

  async deleteDemandForecast(id: number): Promise<boolean> {
    const result = await db.delete(demandForecasts).where(eq(demandForecasts.id, id));
    return result.rowCount! > 0;
  }

  async getDemandDrivers(): Promise<DemandDriver[]> {
    return await db.select().from(demandDrivers).orderBy(asc(demandDrivers.name));
  }

  async createDemandDriver(driver: InsertDemandDriver): Promise<DemandDriver> {
    const [newDriver] = await db.insert(demandDrivers).values(driver).returning();
    return newDriver;
  }

  async updateDemandDriver(id: number, driver: Partial<InsertDemandDriver>): Promise<DemandDriver | undefined> {
    const [updatedDriver] = await db
      .update(demandDrivers)
      .set(driver)
      .where(eq(demandDrivers.id, id))
      .returning();
    return updatedDriver || undefined;
  }

  async deleteDemandDriver(id: number): Promise<boolean> {
    const result = await db.delete(demandDrivers).where(eq(demandDrivers.id, id));
    return result.rowCount! > 0;
  }

  async getDemandHistory(itemId?: number): Promise<DemandHistory[]> {
    if (itemId) {
      return await db.select().from(demandHistory)
        .where(eq(demandHistory.itemId, itemId))
        .orderBy(desc(demandHistory.period));
    }
    return await db.select().from(demandHistory).orderBy(desc(demandHistory.period));
  }

  async createDemandHistory(history: InsertDemandHistory): Promise<DemandHistory> {
    const [newHistory] = await db.insert(demandHistory).values(history).returning();
    return newHistory;
  }

  // Stock Optimization
  async getStockOptimizationScenarios(): Promise<StockOptimizationScenario[]> {
    return await db.select().from(stockOptimizationScenarios).orderBy(desc(stockOptimizationScenarios.createdAt));
  }

  async getStockOptimizationScenario(id: number): Promise<StockOptimizationScenario | undefined> {
    const [scenario] = await db.select().from(stockOptimizationScenarios).where(eq(stockOptimizationScenarios.id, id));
    return scenario || undefined;
  }

  async createStockOptimizationScenario(scenario: InsertStockOptimizationScenario): Promise<StockOptimizationScenario> {
    const [newScenario] = await db.insert(stockOptimizationScenarios).values(scenario).returning();
    return newScenario;
  }

  async updateStockOptimizationScenario(id: number, scenario: Partial<InsertStockOptimizationScenario>): Promise<StockOptimizationScenario | undefined> {
    const [updatedScenario] = await db
      .update(stockOptimizationScenarios)
      .set({ ...scenario, updatedAt: new Date() })
      .where(eq(stockOptimizationScenarios.id, id))
      .returning();
    return updatedScenario || undefined;
  }

  async deleteStockOptimizationScenario(id: number): Promise<boolean> {
    const result = await db.delete(stockOptimizationScenarios).where(eq(stockOptimizationScenarios.id, id));
    return result.rowCount! > 0;
  }

  async getOptimizationRecommendations(scenarioId?: number): Promise<OptimizationRecommendation[]> {
    if (scenarioId) {
      return await db.select().from(optimizationRecommendations)
        .where(eq(optimizationRecommendations.scenarioId, scenarioId))
        .orderBy(desc(optimizationRecommendations.createdAt));
    }
    return await db.select().from(optimizationRecommendations).orderBy(desc(optimizationRecommendations.createdAt));
  }

  async createOptimizationRecommendation(recommendation: InsertOptimizationRecommendation): Promise<OptimizationRecommendation> {
    const [newRecommendation] = await db.insert(optimizationRecommendations).values(recommendation).returning();
    return newRecommendation;
  }

  async updateOptimizationRecommendation(id: number, recommendation: Partial<InsertOptimizationRecommendation>): Promise<OptimizationRecommendation | undefined> {
    const [updatedRecommendation] = await db
      .update(optimizationRecommendations)
      .set(recommendation)
      .where(eq(optimizationRecommendations.id, id))
      .returning();
    return updatedRecommendation || undefined;
  }

  async deleteOptimizationRecommendation(id: number): Promise<boolean> {
    const result = await db.delete(optimizationRecommendations).where(eq(optimizationRecommendations.id, id));
    return result.rowCount! > 0;
  }

  // Feedback Management
  async getFeedback(): Promise<Feedback[]> {
    return await db.select().from(feedback).orderBy(desc(feedback.createdAt));
  }

  async getFeedbackItem(id: number): Promise<Feedback | undefined> {
    const [feedbackItem] = await db.select().from(feedback).where(eq(feedback.id, id));
    return feedbackItem || undefined;
  }

  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db.insert(feedback).values(feedbackData).returning();
    return newFeedback;
  }

  async updateFeedback(id: number, feedbackData: Partial<InsertFeedback>): Promise<Feedback | undefined> {
    const [updatedFeedback] = await db
      .update(feedback)
      .set({ ...feedbackData, updatedAt: new Date() })
      .where(eq(feedback.id, id))
      .returning();
    return updatedFeedback || undefined;
  }

  async deleteFeedback(id: number): Promise<boolean> {
    const result = await db.delete(feedback).where(eq(feedback.id, id));
    return result.rowCount! > 0;
  }

  async getFeedbackComments(feedbackId: number): Promise<FeedbackComment[]> {
    return await db.select().from(feedbackComments)
      .where(eq(feedbackComments.feedbackId, feedbackId))
      .orderBy(desc(feedbackComments.createdAt));
  }

  async createFeedbackComment(comment: InsertFeedbackComment): Promise<FeedbackComment> {
    const [newComment] = await db.insert(feedbackComments).values(comment).returning();
    return newComment;
  }

  async deleteFeedbackComment(id: number): Promise<boolean> {
    const result = await db.delete(feedbackComments).where(eq(feedbackComments.id, id));
    return result.rowCount! > 0;
  }

  async getFeedbackVotes(feedbackId: number): Promise<FeedbackVote[]> {
    return await db.select().from(feedbackVotes)
      .where(eq(feedbackVotes.feedbackId, feedbackId))
      .orderBy(desc(feedbackVotes.createdAt));
  }

  async voteFeedback(vote: InsertFeedbackVote): Promise<FeedbackVote> {
    // Handle upserting - if user already voted, update their vote
    const existingVote = await db.select().from(feedbackVotes)
      .where(eq(feedbackVotes.userId, vote.userId))
      .where(eq(feedbackVotes.feedbackId, vote.feedbackId));
    
    if (existingVote.length > 0) {
      const [updatedVote] = await db
        .update(feedbackVotes)
        .set({ voteType: vote.voteType })
        .where(eq(feedbackVotes.id, existingVote[0].id))
        .returning();
      return updatedVote;
    }
    
    const [newVote] = await db.insert(feedbackVotes).values(vote).returning();
    return newVote;
  }

  async removeVote(userId: number, feedbackId: number): Promise<boolean> {
    const result = await db.delete(feedbackVotes)
      .where(eq(feedbackVotes.userId, userId))
      .where(eq(feedbackVotes.feedbackId, feedbackId));
    return result.rowCount! > 0;
  }

  async getFeedbackStats(): Promise<{
    totalSubmissions: number;
    openItems: number;
    completedItems: number;
    averageResponseTime: number;
    topCategories: { category: string; count: number }[];
    recentActivity: number;
  }> {
    // Get total submissions
    const totalSubmissions = await db.select({ count: count() }).from(feedback);
    
    // Get open and completed items
    const openItems = await db.select({ count: count() }).from(feedback)
      .where(ne(feedback.status, 'resolved'));
    const completedItems = await db.select({ count: count() }).from(feedback)
      .where(eq(feedback.status, 'resolved'));
    
    // Get top categories
    const categories = await db.select({
      category: feedback.category,
      count: count()
    }).from(feedback).groupBy(feedback.category);
    
    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = await db.select({ count: count() }).from(feedback)
      .where(gte(feedback.createdAt, sevenDaysAgo));
    
    return {
      totalSubmissions: totalSubmissions[0].count,
      openItems: openItems[0].count,
      completedItems: completedItems[0].count,
      averageResponseTime: 2.5, // Mock for now - would need actual calculation
      topCategories: categories.map(c => ({ category: c.category, count: c.count })),
      recentActivity: recentActivity[0].count
    };
  }

  // Industry Templates Management
  async getIndustryTemplates(): Promise<IndustryTemplate[]> {
    return await db.select().from(industryTemplates)
      .where(eq(industryTemplates.isActive, true))
      .orderBy(desc(industryTemplates.usageCount), asc(industryTemplates.name));
  }

  async getIndustryTemplate(id: number): Promise<IndustryTemplate | undefined> {
    const [template] = await db.select().from(industryTemplates)
      .where(eq(industryTemplates.id, id));
    return template;
  }

  async getIndustryTemplatesByCategory(category: string): Promise<IndustryTemplate[]> {
    return await db.select().from(industryTemplates)
      .where(and(eq(industryTemplates.category, category), eq(industryTemplates.isActive, true)))
      .orderBy(desc(industryTemplates.usageCount), asc(industryTemplates.name));
  }

  async createIndustryTemplate(template: InsertIndustryTemplate): Promise<IndustryTemplate> {
    const [newTemplate] = await db.insert(industryTemplates).values(template).returning();
    return newTemplate;
  }

  async updateIndustryTemplate(id: number, template: Partial<InsertIndustryTemplate>): Promise<IndustryTemplate | undefined> {
    const [updated] = await db.update(industryTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(industryTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteIndustryTemplate(id: number): Promise<boolean> {
    const result = await db.delete(industryTemplates)
      .where(eq(industryTemplates.id, id));
    return result.rowCount! > 0;
  }

  async getUserIndustryTemplates(userId: number): Promise<UserIndustryTemplate[]> {
    return await db.select().from(userIndustryTemplates)
      .where(eq(userIndustryTemplates.userId, userId))
      .orderBy(desc(userIndustryTemplates.appliedAt));
  }

  async getUserActiveTemplate(userId: number): Promise<UserIndustryTemplate | undefined> {
    const [activeTemplate] = await db.select().from(userIndustryTemplates)
      .where(and(eq(userIndustryTemplates.userId, userId), eq(userIndustryTemplates.isActive, true)));
    return activeTemplate;
  }

  async applyTemplateToUser(userId: number, templateId: number, customizations: any = {}): Promise<UserIndustryTemplate> {
    // First, deactivate any existing active templates for this user
    await db.update(userIndustryTemplates)
      .set({ isActive: false })
      .where(eq(userIndustryTemplates.userId, userId));

    // Check if user already has this template
    const [existingTemplate] = await db.select().from(userIndustryTemplates)
      .where(and(eq(userIndustryTemplates.userId, userId), eq(userIndustryTemplates.templateId, templateId)));

    if (existingTemplate) {
      // Reactivate existing template
      const [updated] = await db.update(userIndustryTemplates)
        .set({ 
          isActive: true, 
          customizations, 
          appliedAt: new Date() 
        })
        .where(eq(userIndustryTemplates.id, existingTemplate.id))
        .returning();
      
      // Increment usage count
      await db.update(industryTemplates)
        .set({ usageCount: sql`${industryTemplates.usageCount} + 1` })
        .where(eq(industryTemplates.id, templateId));
      
      return updated;
    } else {
      // Create new template association
      const [newAssociation] = await db.insert(userIndustryTemplates)
        .values({
          userId,
          templateId,
          isActive: true,
          customizations
        })
        .returning();

      // Increment usage count
      await db.update(industryTemplates)
        .set({ usageCount: sql`${industryTemplates.usageCount} + 1` })
        .where(eq(industryTemplates.id, templateId));

      return newAssociation;
    }
  }

  async removeTemplateFromUser(userId: number, templateId: number): Promise<boolean> {
    const result = await db.delete(userIndustryTemplates)
      .where(and(eq(userIndustryTemplates.userId, userId), eq(userIndustryTemplates.templateId, templateId)));
    return result.rowCount! > 0;
  }

  async updateUserTemplateCustomizations(userId: number, templateId: number, customizations: any): Promise<UserIndustryTemplate | undefined> {
    const [updated] = await db.update(userIndustryTemplates)
      .set({ customizations })
      .where(and(eq(userIndustryTemplates.userId, userId), eq(userIndustryTemplates.templateId, templateId)))
      .returning();
    return updated;
  }

  async getTemplateConfigurations(templateId?: number): Promise<TemplateConfiguration[]> {
    if (templateId) {
      return await db.select().from(templateConfigurations)
        .where(eq(templateConfigurations.templateId, templateId))
        .orderBy(asc(templateConfigurations.configurationType), asc(templateConfigurations.configurationName));
    }
    return await db.select().from(templateConfigurations)
      .orderBy(asc(templateConfigurations.templateId), asc(templateConfigurations.configurationType));
  }

  async getTemplateConfigurationsByType(templateId: number, type: string): Promise<TemplateConfiguration[]> {
    return await db.select().from(templateConfigurations)
      .where(and(eq(templateConfigurations.templateId, templateId), eq(templateConfigurations.configurationType, type)))
      .orderBy(asc(templateConfigurations.configurationName));
  }

  async createTemplateConfiguration(config: InsertTemplateConfiguration): Promise<TemplateConfiguration> {
    const [newConfig] = await db.insert(templateConfigurations).values(config).returning();
    return newConfig;
  }

  async updateTemplateConfiguration(id: number, config: Partial<InsertTemplateConfiguration>): Promise<TemplateConfiguration | undefined> {
    const [updated] = await db.update(templateConfigurations)
      .set(config)
      .where(eq(templateConfigurations.id, id))
      .returning();
    return updated;
  }

  async deleteTemplateConfiguration(id: number): Promise<boolean> {
    const result = await db.delete(templateConfigurations)
      .where(eq(templateConfigurations.id, id));
    return result.rowCount! > 0;
  }

  // Account Management Implementation
  async getAccountInfo(userId: number): Promise<AccountInfo | undefined> {
    const [account] = await db.select().from(accountInfo)
      .where(eq(accountInfo.userId, userId));
    return account;
  }

  async createAccountInfo(account: InsertAccountInfo): Promise<AccountInfo> {
    const [newAccount] = await db.insert(accountInfo).values(account).returning();
    return newAccount;
  }

  async updateAccountInfo(userId: number, account: Partial<InsertAccountInfo>): Promise<AccountInfo | undefined> {
    const [updated] = await db.update(accountInfo)
      .set({ ...account, updatedAt: new Date() })
      .where(eq(accountInfo.userId, userId))
      .returning();
    return updated;
  }

  async getBillingHistory(accountId: number): Promise<BillingHistory[]> {
    return await db.select().from(billingHistory)
      .where(eq(billingHistory.accountId, accountId))
      .orderBy(desc(billingHistory.createdAt));
  }

  async createBillingHistory(billing: InsertBillingHistory): Promise<BillingHistory> {
    const [newBilling] = await db.insert(billingHistory).values(billing).returning();
    return newBilling;
  }

  async getUsageMetrics(accountId: number, metricType?: string): Promise<UsageMetrics[]> {
    let query = db.select().from(usageMetrics).where(eq(usageMetrics.accountId, accountId));
    
    if (metricType) {
      query = query.where(and(eq(usageMetrics.accountId, accountId), eq(usageMetrics.metricType, metricType)));
    }
    
    return await query.orderBy(desc(usageMetrics.recordedAt));
  }

  async createUsageMetric(usage: InsertUsageMetrics): Promise<UsageMetrics> {
    const [newUsage] = await db.insert(usageMetrics).values(usage).returning();
    return newUsage;
  }

  async updateUsageMetric(accountId: number, metricType: string, value: number): Promise<UsageMetrics | undefined> {
    // First try to update existing metric for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [existing] = await db.select().from(usageMetrics)
      .where(and(
        eq(usageMetrics.accountId, accountId),
        eq(usageMetrics.metricType, metricType),
        gte(usageMetrics.recordedAt, today),
        lte(usageMetrics.recordedAt, tomorrow)
      ));

    if (existing) {
      const [updated] = await db.update(usageMetrics)
        .set({ value })
        .where(eq(usageMetrics.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new metric entry
      const [newMetric] = await db.insert(usageMetrics)
        .values({
          accountId,
          metricType,
          value,
          period: 'daily',
          recordedAt: new Date()
        })
        .returning();
      return newMetric;
    }
  }

  // System Integrations Implementation
  async getSystemIntegrations(): Promise<SystemIntegration[]> {
    return await db.select().from(systemIntegrations)
      .orderBy(desc(systemIntegrations.createdAt));
  }

  async getSystemIntegration(id: number): Promise<SystemIntegration | undefined> {
    const [integration] = await db.select().from(systemIntegrations)
      .where(eq(systemIntegrations.id, id));
    return integration;
  }

  async createSystemIntegration(integration: InsertSystemIntegration): Promise<SystemIntegration> {
    const [newIntegration] = await db.insert(systemIntegrations).values(integration).returning();
    return newIntegration;
  }

  async updateSystemIntegration(id: number, integration: Partial<InsertSystemIntegration>): Promise<SystemIntegration | undefined> {
    const [updated] = await db.update(systemIntegrations)
      .set({ ...integration, updatedAt: new Date() })
      .where(eq(systemIntegrations.id, id))
      .returning();
    return updated;
  }

  async deleteSystemIntegration(id: number): Promise<boolean> {
    const result = await db.delete(systemIntegrations)
      .where(eq(systemIntegrations.id, id));
    return result.rowCount! > 0;
  }

  async testSystemIntegrationConnection(id: number): Promise<{ success: boolean; error?: string }> {
    // Implementation would depend on the integration type and configuration
    // For now, return a mock response
    const integration = await this.getSystemIntegration(id);
    if (!integration) {
      return { success: false, error: 'Integration not found' };
    }
    
    // Update last tested timestamp
    await this.updateSystemIntegration(id, { lastTested: new Date() });
    
    // Mock test result - in real implementation would actually test the connection
    return { success: integration.status === 'active' };
  }

  async updateSystemIntegrationHealth(id: number, health: string): Promise<SystemIntegration | undefined> {
    return await this.updateSystemIntegration(id, { healthStatus: health });
  }

  // Integration Data Flows Implementation
  async getIntegrationDataFlows(integrationId?: number): Promise<IntegrationDataFlow[]> {
    let query = db.select().from(integrationDataFlows);
    if (integrationId) {
      query = query.where(eq(integrationDataFlows.integrationId, integrationId));
    }
    return await query.orderBy(desc(integrationDataFlows.createdAt));
  }

  async getIntegrationDataFlow(id: number): Promise<IntegrationDataFlow | undefined> {
    const [dataFlow] = await db.select().from(integrationDataFlows)
      .where(eq(integrationDataFlows.id, id));
    return dataFlow;
  }

  async createIntegrationDataFlow(dataFlow: InsertIntegrationDataFlow): Promise<IntegrationDataFlow> {
    const [newDataFlow] = await db.insert(integrationDataFlows).values(dataFlow).returning();
    return newDataFlow;
  }

  async updateIntegrationDataFlow(id: number, dataFlow: Partial<InsertIntegrationDataFlow>): Promise<IntegrationDataFlow | undefined> {
    const [updated] = await db.update(integrationDataFlows)
      .set({ ...dataFlow, updatedAt: new Date() })
      .where(eq(integrationDataFlows.id, id))
      .returning();
    return updated;
  }

  async deleteIntegrationDataFlow(id: number): Promise<boolean> {
    const result = await db.delete(integrationDataFlows)
      .where(eq(integrationDataFlows.id, id));
    return result.rowCount! > 0;
  }

  async executeIntegrationDataFlow(id: number): Promise<{ success: boolean; executionId: string; error?: string }> {
    const dataFlow = await this.getIntegrationDataFlow(id);
    if (!dataFlow) {
      return { success: false, executionId: '', error: 'Data flow not found' };
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create execution log
    await this.createIntegrationExecutionLog({
      dataFlowId: id,
      executionId,
      status: 'started'
    });

    // Mock execution - in real implementation would actually execute the data flow
    const success = Math.random() > 0.2; // 80% success rate for demo
    
    // Update execution log
    await db.update(integrationExecutionLogs)
      .set({
        status: success ? 'completed' : 'failed',
        completedAt: new Date(),
        recordsProcessed: success ? Math.floor(Math.random() * 1000) : 0,
        recordsSucceeded: success ? Math.floor(Math.random() * 1000) : 0,
        errorMessage: success ? undefined : 'Mock execution error for demo'
      })
      .where(eq(integrationExecutionLogs.executionId, executionId));

    return { success, executionId, error: success ? undefined : 'Execution failed' };
  }

  // Integration Execution Logs Implementation
  async getIntegrationExecutionLogs(dataFlowId?: number): Promise<IntegrationExecutionLog[]> {
    let query = db.select().from(integrationExecutionLogs);
    if (dataFlowId) {
      query = query.where(eq(integrationExecutionLogs.dataFlowId, dataFlowId));
    }
    return await query.orderBy(desc(integrationExecutionLogs.startedAt));
  }

  async getIntegrationExecutionLog(id: number): Promise<IntegrationExecutionLog | undefined> {
    const [log] = await db.select().from(integrationExecutionLogs)
      .where(eq(integrationExecutionLogs.id, id));
    return log;
  }

  async createIntegrationExecutionLog(log: InsertIntegrationExecutionLog): Promise<IntegrationExecutionLog> {
    const [newLog] = await db.insert(integrationExecutionLogs).values(log).returning();
    return newLog;
  }

  async updateIntegrationExecutionLog(id: number, log: Partial<InsertIntegrationExecutionLog>): Promise<IntegrationExecutionLog | undefined> {
    const [updated] = await db.update(integrationExecutionLogs)
      .set(log)
      .where(eq(integrationExecutionLogs.id, id))
      .returning();
    return updated;
  }

  // Integration Data Mappings Implementation
  async getIntegrationDataMappings(dataFlowId: number): Promise<IntegrationDataMapping[]> {
    return await db.select().from(integrationDataMappings)
      .where(eq(integrationDataMappings.dataFlowId, dataFlowId))
      .orderBy(asc(integrationDataMappings.sourceField));
  }

  async getIntegrationDataMapping(id: number): Promise<IntegrationDataMapping | undefined> {
    const [mapping] = await db.select().from(integrationDataMappings)
      .where(eq(integrationDataMappings.id, id));
    return mapping;
  }

  async createIntegrationDataMapping(mapping: InsertIntegrationDataMapping): Promise<IntegrationDataMapping> {
    const [newMapping] = await db.insert(integrationDataMappings).values(mapping).returning();
    return newMapping;
  }

  async updateIntegrationDataMapping(id: number, mapping: Partial<InsertIntegrationDataMapping>): Promise<IntegrationDataMapping | undefined> {
    const [updated] = await db.update(integrationDataMappings)
      .set({ ...mapping, updatedAt: new Date() })
      .where(eq(integrationDataMappings.id, id))
      .returning();
    return updated;
  }

  async deleteIntegrationDataMapping(id: number): Promise<boolean> {
    const result = await db.delete(integrationDataMappings)
      .where(eq(integrationDataMappings.id, id));
    return result.rowCount! > 0;
  }

  // Integration Webhooks Implementation
  async getIntegrationWebhooks(integrationId?: number): Promise<IntegrationWebhook[]> {
    let query = db.select().from(integrationWebhooks);
    if (integrationId) {
      query = query.where(eq(integrationWebhooks.integrationId, integrationId));
    }
    return await query.orderBy(desc(integrationWebhooks.createdAt));
  }

  async getIntegrationWebhook(id: number): Promise<IntegrationWebhook | undefined> {
    const [webhook] = await db.select().from(integrationWebhooks)
      .where(eq(integrationWebhooks.id, id));
    return webhook;
  }

  async createIntegrationWebhook(webhook: InsertIntegrationWebhook): Promise<IntegrationWebhook> {
    const [newWebhook] = await db.insert(integrationWebhooks).values(webhook).returning();
    return newWebhook;
  }

  async updateIntegrationWebhook(id: number, webhook: Partial<InsertIntegrationWebhook>): Promise<IntegrationWebhook | undefined> {
    const [updated] = await db.update(integrationWebhooks)
      .set({ ...webhook, updatedAt: new Date() })
      .where(eq(integrationWebhooks.id, id))
      .returning();
    return updated;
  }

  async deleteIntegrationWebhook(id: number): Promise<boolean> {
    const result = await db.delete(integrationWebhooks)
      .where(eq(integrationWebhooks.id, id));
    return result.rowCount! > 0;
  }

  async triggerIntegrationWebhook(id: number, payload: any): Promise<{ success: boolean; error?: string }> {
    const webhook = await this.getIntegrationWebhook(id);
    if (!webhook || !webhook.isActive) {
      return { success: false, error: 'Webhook not found or inactive' };
    }

    // Update last triggered timestamp
    await this.updateIntegrationWebhook(id, { lastTriggered: new Date() });

    // Mock webhook execution - in real implementation would make HTTP request
    const success = Math.random() > 0.1; // 90% success rate for demo
    
    if (success) {
      await this.updateIntegrationWebhook(id, { 
        successCount: (webhook.successCount || 0) + 1 
      });
    } else {
      await this.updateIntegrationWebhook(id, { 
        failureCount: (webhook.failureCount || 0) + 1 
      });
    }

    return { success, error: success ? undefined : 'Webhook execution failed' };
  }

  // AI Memory and Training Management implementation
  async getAIMemories(userId: string): Promise<any[]> {
    const memories = await this.db
      .select({
        id: aiMemories.id,
        type: aiMemories.type,
        category: aiMemories.category,
        content: aiMemories.content,
        context: aiMemories.context,
        confidence: aiMemories.confidence,
        importance: aiMemories.importance,
        source: aiMemories.source,
        lastAccessed: aiMemories.lastAccessed,
        accessCount: aiMemories.accessCount,
        isActive: aiMemories.isActive,
        createdAt: aiMemories.createdAt,
        updatedAt: aiMemories.updatedAt,
      })
      .from(aiMemories)
      .where(and(eq(aiMemories.userId, userId), eq(aiMemories.isActive, true)))
      .orderBy(desc(aiMemories.lastAccessed));

    return memories.map(memory => ({
      id: memory.id.toString(),
      type: memory.type,
      category: memory.category,
      content: memory.content,
      context: memory.context,
      confidence: memory.confidence,
      importance: memory.importance,
      source: memory.source,
      timestamp: memory.createdAt?.toISOString(),
      lastAccessed: memory.lastAccessed?.toISOString(),
      accessCount: memory.accessCount,
      metadata: {
        ...memory.context,
        confidence: memory.confidence,
        importance: memory.importance,
        source: memory.source
      }
    }));
  }

  async getAITrainingData(userId: string): Promise<any[]> {
    // Return AI training patterns for user
    return [
      {
        id: 't1',
        category: 'workflow_pattern',
        pattern: 'Frequently uses dashboard page for assistance',
        confidence: 75,
        lastSeen: new Date().toISOString()
      },
      {
        id: 't2',
        category: 'optimization_preference', 
        pattern: 'Prefers efficiency-focused suggestions over cost optimization',
        confidence: 88,
        lastSeen: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 't3',
        category: 'communication_style',
        pattern: 'Responds well to detailed explanations with specific metrics',
        confidence: 82,
        lastSeen: new Date(Date.now() - 172800000).toISOString()
      }
    ];
  }

  async storeAIMemory(memory: any): Promise<void> {
    const insertData: InsertAIMemory = {
      userId: memory.userId,
      type: memory.type || 'conversation',
      category: memory.category || 'general',
      content: memory.content,
      context: memory.context || {},
      confidence: memory.confidence || 50,
      importance: memory.importance || 'medium',
      source: memory.source || 'chat',
      expiresAt: memory.expiresAt ? new Date(memory.expiresAt) : undefined,
    };

    const [insertedMemory] = await db
      .insert(aiMemories)
      .values(insertData)
      .returning();

    // Add tags if provided
    if (memory.tags && Array.isArray(memory.tags)) {
      const tagInserts = memory.tags.map((tag: string) => ({
        memoryId: insertedMemory.id,
        tag: tag.trim(),
      }));
      
      if (tagInserts.length > 0) {
        await db.insert(aiMemoryTags).values(tagInserts);
      }
    }

    console.log('Stored AI memory:', insertedMemory.id);
  }

  async updateAITrainingPattern(pattern: any): Promise<void> {
    // Update AI training pattern (this could store conversation context updates)
    if (pattern.userId && pattern.sessionId) {
      await db
        .insert(aiConversationContext)
        .values({
          userId: pattern.userId,
          sessionId: pattern.sessionId,
          conversationSummary: pattern.summary || '',
          topics: pattern.topics || [],
          keyInsights: pattern.insights || [],
          userGoals: pattern.goals || [],
          preferredInteractionStyle: pattern.interactionStyle || 'conversational'
        })
        .onConflictDoUpdate({
          target: [aiConversationContext.userId, aiConversationContext.sessionId],
          set: {
            conversationSummary: pattern.summary || '',
            topics: pattern.topics || [],
            keyInsights: pattern.insights || [],
            userGoals: pattern.goals || [],
            preferredInteractionStyle: pattern.interactionStyle || 'conversational',
            totalMessages: sql`${aiConversationContext.totalMessages} + 1`,
            lastInteraction: new Date(),
            updatedAt: new Date()
          }
        });
    }
    console.log('Updated AI training pattern:', pattern);
  }

  async deleteAIMemory(entryId: string, userId: string): Promise<void> {
    const memoryId = parseInt(entryId);
    
    // First delete associated tags
    await db
      .delete(aiMemoryTags)
      .where(eq(aiMemoryTags.memoryId, memoryId));
    
    // Then delete the memory entry (with user verification for security)
    await db
      .delete(aiMemories)
      .where(and(eq(aiMemories.id, memoryId), eq(aiMemories.userId, userId)));
    
    console.log('Deleted AI memory:', entryId, 'for user:', userId);
  }

  async clearAllAIMemories(userId: string): Promise<void> {
    // Get all memory IDs for this user first to delete associated tags
    const userMemories = await db
      .select({ id: aiMemories.id })
      .from(aiMemories)
      .where(eq(aiMemories.userId, userId));
    
    // Delete all associated tags one by one
    for (const memory of userMemories) {
      await db
        .delete(aiMemoryTags)
        .where(eq(aiMemoryTags.memoryId, memory.id));
    }
    
    // Delete all memories for this user
    const result = await db
      .delete(aiMemories)
      .where(eq(aiMemories.userId, userId));
    
    // Clear conversation context as well
    await db
      .delete(aiConversationContext)
      .where(eq(aiConversationContext.userId, userId));
    
    console.log('Cleared all AI memories for user:', userId, 'Count:', result.rowCount || 0);
  }

  async updateAITraining(entryId: string, content: string, userId: string): Promise<void> {
    const memoryId = parseInt(entryId);
    
    await db
      .update(aiMemories)
      .set({
        content: content,
        updatedAt: new Date(),
      })
      .where(and(eq(aiMemories.id, memoryId), eq(aiMemories.userId, userId)));
    
    console.log('Updated AI memory:', entryId, 'for user:', userId);
  }

  async getAIMemoryStats(userId: string): Promise<{
    totalMemories: number;
    memoryTypes: Record<string, number>;
    avgConfidence: number;
    recentActivity: number;
  }> {
    const memories = await db
      .select({
        type: aiMemories.type,
        confidence: aiMemories.confidence,
        createdAt: aiMemories.createdAt,
      })
      .from(aiMemories)
      .where(and(eq(aiMemories.userId, userId), eq(aiMemories.isActive, true)));

    const totalMemories = memories.length;
    const memoryTypes: Record<string, number> = {};
    let totalConfidence = 0;
    let recentActivity = 0;

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    memories.forEach(memory => {
      // Count by type
      memoryTypes[memory.type] = (memoryTypes[memory.type] || 0) + 1;
      
      // Sum confidence
      totalConfidence += memory.confidence || 0;
      
      // Count recent activity
      if (memory.createdAt && memory.createdAt > oneWeekAgo) {
        recentActivity++;
      }
    });

    return {
      totalMemories,
      memoryTypes,
      avgConfidence: totalMemories > 0 ? Math.round(totalConfidence / totalMemories) : 0,
      recentActivity
    };
  }

  // Plant Management Implementation removed - using PT Publish tables implementation above

  async deleteAllRecords(tableName: string): Promise<boolean> {
    try {
      const tableMap: Record<string, any> = {
        'stockItems': stockItems,
        'items': stockItems,
        'resources': resources, 
        'customers': customers,
        'vendors': vendors,
        'suppliers': vendors,
        'capabilities': capabilities,
        'workCenters': workCenters,
        'routings': routings,
        'billsOfMaterial': billsOfMaterial,
        'recipes': recipes,
        'sales-orders': salesOrders,
        'salesOrders': salesOrders,
        'jobs': ptJobs,
        'ptJobs': ptJobs
      };

      const table = tableMap[tableName];
      if (!table) {
        console.warn(`[deleteAllRecords] Unknown table: ${tableName}`);
        return false;
      }

      const result = await db.delete(table);
      console.log(`[deleteAllRecords] Deleted all records from ${tableName}, count: ${result.rowCount}`);
      return true;
    } catch (error) {
      console.error(`[deleteAllRecords] Error deleting records from ${tableName}:`, error);
      return false;
    }
  }

  // Extension Studio Implementation
  async createExtension(extension: InsertExtension): Promise<Extension> {
    const [newExtension] = await db.insert(extensions).values(extension).returning();
    return newExtension;
  }

  async getExtensions(userId?: number): Promise<Extension[]> {
    let query = db.select().from(extensions);
    if (userId) {
      query = query.where(eq(extensions.createdBy, userId));
    }
    return await query.orderBy(desc(extensions.lastUpdated));
  }

  async getExtensionById(id: number): Promise<Extension | null> {
    const [extension] = await db.select().from(extensions).where(eq(extensions.id, id));
    return extension || null;
  }

  async updateExtension(id: number, updates: Partial<InsertExtension>): Promise<Extension | null> {
    const [updatedExtension] = await db
      .update(extensions)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(extensions.id, id))
      .returning();
    return updatedExtension || null;
  }

  async deleteExtension(id: number): Promise<boolean> {
    const result = await db.delete(extensions).where(eq(extensions.id, id));
    return result.rowCount! > 0;
  }

  // Extension Files
  async createExtensionFile(file: InsertExtensionFile): Promise<ExtensionFile> {
    const [newFile] = await db.insert(extensionFiles).values(file).returning();
    return newFile;
  }

  async getExtensionFiles(extensionId: number): Promise<ExtensionFile[]> {
    return await db
      .select()
      .from(extensionFiles)
      .where(eq(extensionFiles.extensionId, extensionId))
      .orderBy(asc(extensionFiles.filepath));
  }

  async updateExtensionFile(id: number, updates: Partial<InsertExtensionFile>): Promise<ExtensionFile | null> {
    const [updatedFile] = await db
      .update(extensionFiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(extensionFiles.id, id))
      .returning();
    return updatedFile || null;
  }

  async deleteExtensionFile(id: number): Promise<boolean> {
    const result = await db.delete(extensionFiles).where(eq(extensionFiles.id, id));
    return result.rowCount! > 0;
  }

  // Extension Installations
  async createExtensionInstallation(installation: InsertExtensionInstallation): Promise<ExtensionInstallation> {
    const [newInstallation] = await db.insert(extensionInstallations).values(installation).returning();
    return newInstallation;
  }

  async getUserExtensions(userId: number): Promise<ExtensionInstallation[]> {
    return await db
      .select()
      .from(extensionInstallations)
      .where(eq(extensionInstallations.userId, userId))
      .orderBy(desc(extensionInstallations.installedAt));
  }

  async updateExtensionInstallation(id: number, updates: Partial<InsertExtensionInstallation>): Promise<ExtensionInstallation | null> {
    const [updatedInstallation] = await db
      .update(extensionInstallations)
      .set(updates)
      .where(eq(extensionInstallations.id, id))
      .returning();
    return updatedInstallation || null;
  }

  async deleteExtensionInstallation(id: number): Promise<boolean> {
    const result = await db.delete(extensionInstallations).where(eq(extensionInstallations.id, id));
    return result.rowCount! > 0;
  }

  // Extension Marketplace
  async getMarketplaceExtensions(): Promise<(Extension & ExtensionMarketplace)[]> {
    return await db
      .select()
      .from(extensions)
      .innerJoin(extensionMarketplace, eq(extensions.id, extensionMarketplace.extensionId))
      .where(eq(extensions.status, 'published'))
      .orderBy(desc(extensionMarketplace.featured), desc(extensions.rating));
  }

  async createExtensionMarketplace(marketplace: InsertExtensionMarketplace): Promise<ExtensionMarketplace> {
    const [newMarketplace] = await db.insert(extensionMarketplace).values(marketplace).returning();
    return newMarketplace;
  }

  async updateExtensionMarketplace(extensionId: number, updates: Partial<InsertExtensionMarketplace>): Promise<ExtensionMarketplace | null> {
    const [updatedMarketplace] = await db
      .update(extensionMarketplace)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(extensionMarketplace.extensionId, extensionId))
      .returning();
    return updatedMarketplace || null;
  }

  // Extension Reviews
  async createExtensionReview(review: InsertExtensionReview): Promise<ExtensionReview> {
    const [newReview] = await db.insert(extensionReviews).values(review).returning();
    return newReview;
  }

  async getExtensionReviews(extensionId: number): Promise<ExtensionReview[]> {
    return await db
      .select()
      .from(extensionReviews)
      .where(eq(extensionReviews.extensionId, extensionId))
      .orderBy(desc(extensionReviews.createdAt));
  }

  // Workflow Automation Implementation
  async getWorkflows(userId?: number): Promise<Workflow[]> {
    let query = db.select().from(workflows);
    if (userId) {
      query = query.where(eq(workflows.createdBy, userId));
    }
    return await query.orderBy(desc(workflows.createdAt));
  }

  async getWorkflow(id: number): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow;
  }

  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const [newWorkflow] = await db.insert(workflows).values(workflow).returning();
    return newWorkflow;
  }

  async updateWorkflow(id: number, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const [updatedWorkflow] = await db
      .update(workflows)
      .set({ ...workflow, updatedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning();
    return updatedWorkflow;
  }

  async deleteWorkflow(id: number): Promise<boolean> {
    const result = await db.delete(workflows).where(eq(workflows.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async executeWorkflow(id: number, context?: any): Promise<WorkflowExecution> {
    const workflow = await this.getWorkflow(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }

    // Create execution record
    const execution = await db.insert(workflowExecutions).values({
      workflowId: id,
      status: 'running',
      context: context || {},
      startTime: new Date(),
    }).returning();

    // Update workflow stats
    await db
      .update(workflows)
      .set({
        executionCount: sql`${workflows.executionCount} + 1`,
        lastExecuted: new Date(),
      })
      .where(eq(workflows.id, id));

    return execution[0];
  }

  // Workflow Triggers
  async getWorkflowTriggers(workflowId?: number): Promise<WorkflowTrigger[]> {
    let query = db.select().from(workflowTriggers);
    if (workflowId) {
      query = query.where(eq(workflowTriggers.workflowId, workflowId));
    }
    return await query.orderBy(desc(workflowTriggers.createdAt));
  }

  async getWorkflowTrigger(id: number): Promise<WorkflowTrigger | undefined> {
    const [trigger] = await db.select().from(workflowTriggers).where(eq(workflowTriggers.id, id));
    return trigger;
  }

  async createWorkflowTrigger(trigger: InsertWorkflowTrigger): Promise<WorkflowTrigger> {
    const [newTrigger] = await db.insert(workflowTriggers).values(trigger).returning();
    return newTrigger;
  }

  async updateWorkflowTrigger(id: number, trigger: Partial<InsertWorkflowTrigger>): Promise<WorkflowTrigger | undefined> {
    const [updatedTrigger] = await db
      .update(workflowTriggers)
      .set({ ...trigger, updatedAt: new Date() })
      .where(eq(workflowTriggers.id, id))
      .returning();
    return updatedTrigger;
  }

  async deleteWorkflowTrigger(id: number): Promise<boolean> {
    const result = await db.delete(workflowTriggers).where(eq(workflowTriggers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Workflow Actions
  async getWorkflowActions(workflowId?: number): Promise<WorkflowAction[]> {
    let query = db.select().from(workflowActions);
    if (workflowId) {
      // Get actions for a specific workflow through the mapping table
      return await db
        .select()
        .from(workflowActions)
        .innerJoin(workflowActionMappings, eq(workflowActions.id, workflowActionMappings.actionId))
        .where(eq(workflowActionMappings.workflowId, workflowId))
        .orderBy(asc(workflowActionMappings.executionOrder));
    }
    return await query.orderBy(desc(workflowActions.createdAt));
  }

  async getWorkflowAction(id: number): Promise<WorkflowAction | undefined> {
    const [action] = await db.select().from(workflowActions).where(eq(workflowActions.id, id));
    return action;
  }

  async createWorkflowAction(action: InsertWorkflowAction): Promise<WorkflowAction> {
    const [newAction] = await db.insert(workflowActions).values(action).returning();
    return newAction;
  }

  async updateWorkflowAction(id: number, action: Partial<InsertWorkflowAction>): Promise<WorkflowAction | undefined> {
    const [updatedAction] = await db
      .update(workflowActions)
      .set({ ...action, updatedAt: new Date() })
      .where(eq(workflowActions.id, id))
      .returning();
    return updatedAction;
  }

  async deleteWorkflowAction(id: number): Promise<boolean> {
    const result = await db.delete(workflowActions).where(eq(workflowActions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Workflow Action Mappings
  async getWorkflowActionMappings(workflowId: number): Promise<WorkflowActionMapping[]> {
    return await db
      .select()
      .from(workflowActionMappings)
      .where(eq(workflowActionMappings.workflowId, workflowId))
      .orderBy(asc(workflowActionMappings.executionOrder));
  }

  async createWorkflowActionMapping(mapping: InsertWorkflowActionMapping): Promise<WorkflowActionMapping> {
    const [newMapping] = await db.insert(workflowActionMappings).values(mapping).returning();
    return newMapping;
  }

  async deleteWorkflowActionMapping(id: number): Promise<boolean> {
    const result = await db.delete(workflowActionMappings).where(eq(workflowActionMappings.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Workflow Executions
  async getWorkflowExecutions(workflowId?: number): Promise<WorkflowExecution[]> {
    let query = db.select().from(workflowExecutions);
    if (workflowId) {
      query = query.where(eq(workflowExecutions.workflowId, workflowId));
    }
    return await query.orderBy(desc(workflowExecutions.startTime));
  }

  async getWorkflowExecution(id: number): Promise<WorkflowExecution | undefined> {
    const [execution] = await db.select().from(workflowExecutions).where(eq(workflowExecutions.id, id));
    return execution;
  }

  async updateWorkflowExecution(id: number, execution: Partial<InsertWorkflowExecution>): Promise<WorkflowExecution | undefined> {
    const [updatedExecution] = await db
      .update(workflowExecutions)
      .set(execution)
      .where(eq(workflowExecutions.id, id))
      .returning();
    return updatedExecution;
  }

  // Workflow Action Executions
  async getWorkflowActionExecutions(executionId: number): Promise<WorkflowActionExecution[]> {
    return await db
      .select()
      .from(workflowActionExecutions)
      .where(eq(workflowActionExecutions.workflowExecutionId, executionId))
      .orderBy(asc(workflowActionExecutions.executionOrder));
  }

  async createWorkflowActionExecution(execution: InsertWorkflowActionExecution): Promise<WorkflowActionExecution> {
    const [newExecution] = await db.insert(workflowActionExecutions).values(execution).returning();
    return newExecution;
  }

  async updateWorkflowActionExecution(id: number, execution: Partial<InsertWorkflowActionExecution>): Promise<WorkflowActionExecution | undefined> {
    const [updatedExecution] = await db
      .update(workflowActionExecutions)
      .set(execution)
      .where(eq(workflowActionExecutions.id, id))
      .returning();
    return updatedExecution;
  }

  // Workflow Monitoring
  async getWorkflowMonitoring(workflowId?: number): Promise<WorkflowMonitoring[]> {
    let query = db.select().from(workflowMonitoring);
    if (workflowId) {
      query = query.where(eq(workflowMonitoring.workflowId, workflowId));
    }
    return await query.orderBy(desc(workflowMonitoring.createdAt));
  }

  async createWorkflowMonitoring(monitoring: InsertWorkflowMonitoring): Promise<WorkflowMonitoring> {
    const [newMonitoring] = await db.insert(workflowMonitoring).values(monitoring).returning();
    return newMonitoring;
  }

  async updateWorkflowMonitoring(id: number, monitoring: Partial<InsertWorkflowMonitoring>): Promise<WorkflowMonitoring | undefined> {
    const [updatedMonitoring] = await db
      .update(workflowMonitoring)
      .set({ ...monitoring, updatedAt: new Date() })
      .where(eq(workflowMonitoring.id, id))
      .returning();
    return updatedMonitoring;
  }

  async deleteWorkflowMonitoring(id: number): Promise<boolean> {
    const result = await db.delete(workflowMonitoring).where(eq(workflowMonitoring.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Canvas Content Management
  async getCanvasContent(userId: number, sessionId: string): Promise<CanvasContent[]> {
    return await db
      .select()
      .from(canvasContent)
      .where(and(
        eq(canvasContent.userId, userId),
        eq(canvasContent.sessionId, sessionId),
        eq(canvasContent.isVisible, true)
      ))
      .orderBy(desc(canvasContent.displayOrder), desc(canvasContent.createdAt));
  }

  async addCanvasContent(content: InsertCanvasContent): Promise<CanvasContent> {
    // Get current highest display order for this user/session
    const maxOrderResult = await db
      .select({ maxOrder: sql<number>`max(${canvasContent.displayOrder})` })
      .from(canvasContent)
      .where(and(
        eq(canvasContent.userId, content.userId),
        eq(canvasContent.sessionId, content.sessionId)
      ));

    const maxOrder = maxOrderResult[0]?.maxOrder || 0;
    
    // Insert new content with incremented display order
    const [newContent] = await db
      .insert(canvasContent)
      .values({
        ...content,
        displayOrder: maxOrder + 1
      })
      .returning();

    return newContent;
  }

  async clearCanvasContent(userId: number, sessionId: string): Promise<boolean> {
    const result = await db
      .update(canvasContent)
      .set({ isVisible: false })
      .where(and(
        eq(canvasContent.userId, userId),
        eq(canvasContent.sessionId, sessionId)
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteCanvasContent(id: number): Promise<boolean> {
    const result = await db.delete(canvasContent).where(eq(canvasContent.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async reorderCanvasContent(contentIds: number[]): Promise<boolean> {
    try {
      // Update display orders based on the array order
      for (let i = 0; i < contentIds.length; i++) {
        await db
          .update(canvasContent)
          .set({ displayOrder: i + 1 })
          .where(eq(canvasContent.id, contentIds[i]));
      }
      return true;
    } catch (error) {
      console.error('Error reordering canvas content:', error);
      return false;
    }
  }

  async cleanupExpiredCanvasContent(): Promise<boolean> {
    try {
      // Get all canvas settings to check retention policies
      const settings = await db.select().from(canvasSettings);
      
      for (const setting of settings) {
        if (setting.autoClear && setting.retentionDays > 0) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - setting.retentionDays);
          
          await db
            .update(canvasContent)
            .set({ isVisible: false })
            .where(and(
              eq(canvasContent.userId, setting.userId),
              eq(canvasContent.sessionId, setting.sessionId),
              lte(canvasContent.createdAt, cutoffDate)
            ));
        }
      }
      return true;
    } catch (error) {
      console.error('Error cleaning up expired canvas content:', error);
      return false;
    }
  }

  // Canvas Settings Management
  async getCanvasSettings(userId: number, sessionId: string): Promise<CanvasSettings | undefined> {
    const [settings] = await db
      .select()
      .from(canvasSettings)
      .where(and(
        eq(canvasSettings.userId, userId),
        eq(canvasSettings.sessionId, sessionId)
      ));
    return settings;
  }

  async upsertCanvasSettings(settings: InsertCanvasSettings): Promise<CanvasSettings> {
    const [result] = await db
      .insert(canvasSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: [canvasSettings.userId, canvasSettings.sessionId],
        set: {
          retentionDays: settings.retentionDays,
          autoClear: settings.autoClear,
          maxItems: settings.maxItems,
          updatedAt: new Date()
        }
      })
      .returning();
    return result;
  }

  async updateCanvasSettings(userId: number, sessionId: string, settings: Partial<InsertCanvasSettings>): Promise<CanvasSettings | undefined> {
    const [updatedSettings] = await db
      .update(canvasSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(and(
        eq(canvasSettings.userId, userId),
        eq(canvasSettings.sessionId, sessionId)
      ))
      .returning();
    return updatedSettings;
  }

  // Canvas Widget Management - for Max AI to display interactive widgets
  async getCanvasWidgets(sessionId?: string, userId?: number): Promise<CanvasWidget[]> {
    let query = db.select().from(canvasWidgets).where(eq(canvasWidgets.isVisible, true));
    
    if (sessionId) {
      query = query.where(eq(canvasWidgets.sessionId, sessionId));
    }
    if (userId) {
      query = query.where(eq(canvasWidgets.userId, userId));
    }
    
    return await query.orderBy(desc(canvasWidgets.createdAt));
  }

  async getCanvasWidget(id: number): Promise<CanvasWidget | undefined> {
    const [widget] = await db
      .select()
      .from(canvasWidgets)
      .where(eq(canvasWidgets.id, id));
    return widget;
  }

  async createCanvasWidget(widget: InsertCanvasWidget): Promise<CanvasWidget> {
    const [newWidget] = await db
      .insert(canvasWidgets)
      .values({
        ...widget,
        updatedAt: new Date()
      })
      .returning();
    return newWidget;
  }

  async updateCanvasWidget(id: number, updates: Partial<InsertCanvasWidget>): Promise<CanvasWidget | undefined> {
    const [updatedWidget] = await db
      .update(canvasWidgets)
      .set({ 
        ...updates, 
        updatedAt: new Date() 
      })
      .where(eq(canvasWidgets.id, id))
      .returning();
    return updatedWidget;
  }

  async deleteCanvasWidget(id: number): Promise<boolean> {
    const result = await db.delete(canvasWidgets).where(eq(canvasWidgets.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async clearCanvasWidgets(sessionId?: string, userId?: number): Promise<boolean> {
    let whereConditions = [];
    
    if (sessionId) {
      whereConditions.push(eq(canvasWidgets.sessionId, sessionId));
    }
    if (userId) {
      whereConditions.push(eq(canvasWidgets.userId, userId));
    }
    
    if (whereConditions.length === 0) {
      return false; // Prevent clearing all widgets without criteria
    }
    
    const result = await db
      .update(canvasWidgets)
      .set({ isVisible: false, updatedAt: new Date() })
      .where(and(...whereConditions));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async hideCanvasWidget(id: number): Promise<boolean> {
    const result = await db
      .update(canvasWidgets)
      .set({ isVisible: false, updatedAt: new Date() })
      .where(eq(canvasWidgets.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async showCanvasWidget(id: number): Promise<boolean> {
    const result = await db
      .update(canvasWidgets)
      .set({ isVisible: true, updatedAt: new Date() })
      .where(eq(canvasWidgets.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateWidgetPosition(id: number, position: { x: number; y: number; width: number; height: number }): Promise<boolean> {
    const result = await db
      .update(canvasWidgets)
      .set({ 
        position: position,
        updatedAt: new Date() 
      })
      .where(eq(canvasWidgets.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Error Logging and Monitoring Implementation
  async logError(errorData: InsertErrorLog): Promise<ErrorLog> {
    const [error] = await db
      .insert(errorLogs)
      .values(errorData)
      .returning();
    return error;
  }

  async getErrorLogs(limit: number = 100, resolved?: boolean): Promise<ErrorLog[]> {
    let query = db.select().from(errorLogs);
    
    if (resolved !== undefined) {
      query = query.where(eq(errorLogs.resolved, resolved));
    }
    
    return await query
      .orderBy(desc(errorLogs.timestamp))
      .limit(limit);
  }

  async getErrorLog(errorId: string): Promise<ErrorLog | undefined> {
    const [error] = await db
      .select()
      .from(errorLogs)
      .where(eq(errorLogs.errorId, errorId));
    return error;
  }

  async markErrorResolved(errorId: string): Promise<boolean> {
    const result = await db
      .update(errorLogs)
      .set({ resolved: true })
      .where(eq(errorLogs.errorId, errorId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async createErrorReport(report: InsertErrorReport): Promise<ErrorReport> {
    const [errorReport] = await db
      .insert(errorReports)
      .values(report)
      .returning();
    return errorReport;
  }

  async getErrorReports(status?: string): Promise<ErrorReport[]> {
    let query = db.select().from(errorReports);
    
    if (status) {
      query = query.where(eq(errorReports.status, status));
    }
    
    return await query.orderBy(desc(errorReports.createdAt));
  }

  async updateErrorReport(id: number, updates: Partial<InsertErrorReport>): Promise<ErrorReport | undefined> {
    const [updatedReport] = await db
      .update(errorReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(errorReports.id, id))
      .returning();
    return updatedReport;
  }

  async getSystemHealth(): Promise<SystemHealth[]> {
    return await db
      .select()
      .from(systemHealth)
      .orderBy(desc(systemHealth.timestamp))
      .limit(100);
  }

  async logSystemHealth(healthData: InsertSystemHealth): Promise<SystemHealth> {
    const [health] = await db
      .insert(systemHealth)
      .values(healthData)
      .returning();
    return health;
  }

  // Smart KPI Management System Implementation
  
  // Smart KPI Meetings
  async getSmartKpiMeetings(organizerId?: number, meetingType?: string): Promise<SmartKpiMeeting[]> {
    let query = db.select().from(smartKpiMeetings);
    const conditions: any[] = [];
    
    if (organizerId !== undefined) {
      conditions.push(eq(smartKpiMeetings.organizerId, organizerId));
    }
    if (meetingType) {
      conditions.push(eq(smartKpiMeetings.meetingType, meetingType));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(smartKpiMeetings.scheduledDate));
  }

  async getSmartKpiMeeting(id: number): Promise<SmartKpiMeeting | undefined> {
    const [meeting] = await db
      .select()
      .from(smartKpiMeetings)
      .where(eq(smartKpiMeetings.id, id));
    return meeting || undefined;
  }

  async createSmartKpiMeeting(meeting: InsertSmartKpiMeeting): Promise<SmartKpiMeeting> {
    const [newMeeting] = await db
      .insert(smartKpiMeetings)
      .values(meeting)
      .returning();
    return newMeeting;
  }

  async updateSmartKpiMeeting(id: number, meeting: Partial<InsertSmartKpiMeeting>): Promise<SmartKpiMeeting | undefined> {
    const [updatedMeeting] = await db
      .update(smartKpiMeetings)
      .set({ ...meeting, updatedAt: new Date() })
      .where(eq(smartKpiMeetings.id, id))
      .returning();
    return updatedMeeting || undefined;
  }

  async deleteSmartKpiMeeting(id: number): Promise<boolean> {
    const result = await db
      .delete(smartKpiMeetings)
      .where(eq(smartKpiMeetings.id, id));
    return result.rowCount > 0;
  }

  // Smart KPI Definitions
  async getSmartKpiDefinitions(category?: string, businessStrategy?: string, isActive?: boolean): Promise<SmartKpiDefinition[]> {
    console.log("[STORAGE] getSmartKpiDefinitions called with:", { category, businessStrategy, isActive });
    
    try {
      let query = db.select().from(smartKpiDefinitions);
      const conditions: any[] = [];
      
      if (category) {
        conditions.push(eq(smartKpiDefinitions.category, category));
      }
      if (businessStrategy) {
        conditions.push(eq(smartKpiDefinitions.businessStrategy, businessStrategy));
      }
      if (isActive !== undefined) {
        conditions.push(eq(smartKpiDefinitions.isActive, isActive));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      console.log("[STORAGE] Executing query...");
      const result = await query.orderBy(smartKpiDefinitions.name);
      console.log("[STORAGE] Query completed, found:", result.length, "definitions");
      return result;
    } catch (error) {
      console.error("[STORAGE] Error in getSmartKpiDefinitions:", error);
      throw error;
    }
  }

  async getSmartKpiDefinition(id: number): Promise<SmartKpiDefinition | undefined> {
    const [definition] = await db
      .select()
      .from(smartKpiDefinitions)
      .where(eq(smartKpiDefinitions.id, id));
    return definition || undefined;
  }

  async createSmartKpiDefinition(definition: InsertSmartKpiDefinition): Promise<SmartKpiDefinition> {
    const [newDefinition] = await db
      .insert(smartKpiDefinitions)
      .values(definition)
      .returning();
    return newDefinition;
  }

  async updateSmartKpiDefinition(id: number, definition: Partial<InsertSmartKpiDefinition>): Promise<SmartKpiDefinition | undefined> {
    const [updatedDefinition] = await db
      .update(smartKpiDefinitions)
      .set({ ...definition, updatedAt: new Date() })
      .where(eq(smartKpiDefinitions.id, id))
      .returning();
    return updatedDefinition || undefined;
  }

  async deleteSmartKpiDefinition(id: number): Promise<boolean> {
    const result = await db
      .delete(smartKpiDefinitions)
      .where(eq(smartKpiDefinitions.id, id));
    return result.rowCount > 0;
  }

  // Smart KPI Targets
  async getSmartKpiTargets(kpiDefinitionId?: number, targetPeriod?: string, status?: string): Promise<SmartKpiTarget[]> {
    let query = db.select().from(smartKpiTargets);
    const conditions: any[] = [];
    
    if (kpiDefinitionId !== undefined) {
      conditions.push(eq(smartKpiTargets.kpiDefinitionId, kpiDefinitionId));
    }
    if (targetPeriod) {
      conditions.push(eq(smartKpiTargets.targetPeriod, targetPeriod));
    }
    if (status) {
      conditions.push(eq(smartKpiTargets.status, status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(smartKpiTargets.periodStartDate));
  }

  async getSmartKpiTarget(id: number): Promise<SmartKpiTarget | undefined> {
    const [target] = await db
      .select()
      .from(smartKpiTargets)
      .where(eq(smartKpiTargets.id, id));
    return target || undefined;
  }

  async createSmartKpiTarget(target: InsertSmartKpiTarget): Promise<SmartKpiTarget> {
    const [newTarget] = await db
      .insert(smartKpiTargets)
      .values(target)
      .returning();
    return newTarget;
  }

  async updateSmartKpiTarget(id: number, target: Partial<InsertSmartKpiTarget>): Promise<SmartKpiTarget | undefined> {
    const [updatedTarget] = await db
      .update(smartKpiTargets)
      .set({ ...target, updatedAt: new Date() })
      .where(eq(smartKpiTargets.id, id))
      .returning();
    return updatedTarget || undefined;
  }

  async deleteSmartKpiTarget(id: number): Promise<boolean> {
    const result = await db
      .delete(smartKpiTargets)
      .where(eq(smartKpiTargets.id, id));
    return result.rowCount > 0;
  }

  // Smart KPI Actuals
  async getSmartKpiActuals(kpiDefinitionId?: number, startDate?: Date, endDate?: Date): Promise<SmartKpiActual[]> {
    let query = db.select().from(smartKpiActuals);
    const conditions: any[] = [];
    
    if (kpiDefinitionId !== undefined) {
      conditions.push(eq(smartKpiActuals.kpiDefinitionId, kpiDefinitionId));
    }
    if (startDate) {
      conditions.push(gte(smartKpiActuals.measurementDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(smartKpiActuals.measurementDate, endDate));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(smartKpiActuals.measurementDate));
  }

  async getSmartKpiActual(id: number): Promise<SmartKpiActual | undefined> {
    const [actual] = await db
      .select()
      .from(smartKpiActuals)
      .where(eq(smartKpiActuals.id, id));
    return actual || undefined;
  }

  async createSmartKpiActual(actual: InsertSmartKpiActual): Promise<SmartKpiActual> {
    const [newActual] = await db
      .insert(smartKpiActuals)
      .values(actual)
      .returning();
    return newActual;
  }

  async updateSmartKpiActual(id: number, actual: Partial<InsertSmartKpiActual>): Promise<SmartKpiActual | undefined> {
    const [updatedActual] = await db
      .update(smartKpiActuals)
      .set({ ...actual, updatedAt: new Date() })
      .where(eq(smartKpiActuals.id, id))
      .returning();
    return updatedActual || undefined;
  }

  async deleteSmartKpiActual(id: number): Promise<boolean> {
    const result = await db
      .delete(smartKpiActuals)
      .where(eq(smartKpiActuals.id, id));
    return result.rowCount > 0;
  }

  async validateSmartKpiActual(id: number, validatedBy: number): Promise<SmartKpiActual | undefined> {
    const [validated] = await db
      .update(smartKpiActuals)
      .set({ 
        isValidated: true, 
        validatedBy, 
        validatedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(smartKpiActuals.id, id))
      .returning();
    return validated || undefined;
  }

  // Smart KPI Improvements
  async getSmartKpiImprovements(kpiDefinitionId?: number, status?: string, priority?: string): Promise<SmartKpiImprovement[]> {
    let query = db.select().from(smartKpiImprovements);
    const conditions: any[] = [];
    
    if (kpiDefinitionId !== undefined) {
      conditions.push(eq(smartKpiImprovements.kpiDefinitionId, kpiDefinitionId));
    }
    if (status) {
      conditions.push(eq(smartKpiImprovements.status, status));
    }
    if (priority) {
      conditions.push(eq(smartKpiImprovements.priority, priority));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(smartKpiImprovements.identifiedDate));
  }

  async getSmartKpiImprovement(id: number): Promise<SmartKpiImprovement | undefined> {
    const [improvement] = await db
      .select()
      .from(smartKpiImprovements)
      .where(eq(smartKpiImprovements.id, id));
    return improvement || undefined;
  }

  async createSmartKpiImprovement(improvement: InsertSmartKpiImprovement): Promise<SmartKpiImprovement> {
    const [newImprovement] = await db
      .insert(smartKpiImprovements)
      .values(improvement)
      .returning();
    return newImprovement;
  }

  async updateSmartKpiImprovement(id: number, improvement: Partial<InsertSmartKpiImprovement>): Promise<SmartKpiImprovement | undefined> {
    const [updatedImprovement] = await db
      .update(smartKpiImprovements)
      .set({ ...improvement, updatedAt: new Date() })
      .where(eq(smartKpiImprovements.id, id))
      .returning();
    return updatedImprovement || undefined;
  }

  async deleteSmartKpiImprovement(id: number): Promise<boolean> {
    const result = await db
      .delete(smartKpiImprovements)
      .where(eq(smartKpiImprovements.id, id));
    return result.rowCount > 0;
  }

  // Smart KPI Alerts
  async getSmartKpiAlerts(kpiDefinitionId?: number, severity?: string, status?: string): Promise<SmartKpiAlert[]> {
    let query = db.select().from(smartKpiAlerts);
    const conditions: any[] = [];
    
    if (kpiDefinitionId !== undefined) {
      conditions.push(eq(smartKpiAlerts.kpiDefinitionId, kpiDefinitionId));
    }
    if (severity) {
      conditions.push(eq(smartKpiAlerts.severity, severity));
    }
    if (status) {
      conditions.push(eq(smartKpiAlerts.status, status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(smartKpiAlerts.triggeredAt));
  }

  async getSmartKpiAlert(id: number): Promise<SmartKpiAlert | undefined> {
    const [alert] = await db
      .select()
      .from(smartKpiAlerts)
      .where(eq(smartKpiAlerts.id, id));
    return alert || undefined;
  }

  async createSmartKpiAlert(alert: InsertSmartKpiAlert): Promise<SmartKpiAlert> {
    const [newAlert] = await db
      .insert(smartKpiAlerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async updateSmartKpiAlert(id: number, alert: Partial<InsertSmartKpiAlert>): Promise<SmartKpiAlert | undefined> {
    const [updatedAlert] = await db
      .update(smartKpiAlerts)
      .set({ ...alert, updatedAt: new Date() })
      .where(eq(smartKpiAlerts.id, id))
      .returning();
    return updatedAlert || undefined;
  }

  async acknowledgeSmartKpiAlert(id: number, acknowledgedBy: number): Promise<SmartKpiAlert | undefined> {
    const [acknowledged] = await db
      .update(smartKpiAlerts)
      .set({ 
        status: 'acknowledged',
        acknowledgedBy, 
        acknowledgedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(smartKpiAlerts.id, id))
      .returning();
    return acknowledged || undefined;
  }

  async resolveSmartKpiAlert(id: number, resolution: string, resolvedBy: number): Promise<SmartKpiAlert | undefined> {
    const [resolved] = await db
      .update(smartKpiAlerts)
      .set({ 
        status: 'resolved',
        resolution,
        resolvedBy, 
        resolvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(smartKpiAlerts.id, id))
      .returning();
    return resolved || undefined;
  }

  // Smart KPI Analytics
  async getKpiPerformanceAnalysis(kpiDefinitionId: number, timeRange: { start: Date; end: Date }): Promise<{
    currentValue: number;
    targetValue: number;
    performanceGap: number;
    trend: 'improving' | 'declining' | 'stable';
    projectedTarget: boolean;
    recommendations: string[];
  }> {
    // Get recent actuals
    const actuals = await db
      .select()
      .from(smartKpiActuals)
      .where(
        and(
          eq(smartKpiActuals.kpiDefinitionId, kpiDefinitionId),
          gte(smartKpiActuals.measurementDate, timeRange.start),
          lte(smartKpiActuals.measurementDate, timeRange.end)
        )
      )
      .orderBy(desc(smartKpiActuals.measurementDate))
      .limit(10);

    // Get current target
    const [target] = await db
      .select()
      .from(smartKpiTargets)
      .where(
        and(
          eq(smartKpiTargets.kpiDefinitionId, kpiDefinitionId),
          eq(smartKpiTargets.status, 'active')
        )
      )
      .orderBy(desc(smartKpiTargets.periodStartDate))
      .limit(1);

    if (actuals.length === 0) {
      return {
        currentValue: 0,
        targetValue: target?.targetValue || 0,
        performanceGap: 0,
        trend: 'stable',
        projectedTarget: false,
        recommendations: ['No recent data available for analysis']
      };
    }

    const currentValue = actuals[0].actualValue;
    const targetValue = target?.targetValue || 0;
    const performanceGap = ((currentValue - targetValue) / targetValue) * 100;

    // Calculate trend
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (actuals.length >= 2) {
      const recent = actuals.slice(0, 3).map(a => a.actualValue);
      const older = actuals.slice(3, 6).map(a => a.actualValue);
      
      if (recent.length >= 2 && older.length >= 2) {
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        
        if (recentAvg > olderAvg * 1.02) trend = 'improving';
        else if (recentAvg < olderAvg * 0.98) trend = 'declining';
      }
    }

    const projectedTarget = Math.abs(performanceGap) <= 5; // Within 5% of target

    // Generate recommendations
    const recommendations: string[] = [];
    if (performanceGap < -10) {
      recommendations.push('Performance significantly below target - immediate action required');
    } else if (performanceGap < 0) {
      recommendations.push('Performance below target - implement improvement plan');
    } else if (performanceGap > 10) {
      recommendations.push('Performance exceeding target - consider raising targets');
    }

    if (trend === 'declining') {
      recommendations.push('Declining trend detected - investigate root causes');
    } else if (trend === 'improving') {
      recommendations.push('Positive trend - maintain current improvements');
    }

    return {
      currentValue,
      targetValue,
      performanceGap,
      trend,
      projectedTarget,
      recommendations
    };
  }

  async getKpiDashboardData(userId: number): Promise<{
    activeKpis: number;
    criticalAlerts: number;
    improvementsInProgress: number;
    targetAchievement: number;
    kpisByCategory: Array<{ category: string; count: number; avgPerformance: number }>;
    recentMeetings: SmartKpiMeeting[];
    urgentActions: Array<{ type: string; description: string; dueDate: Date }>;
  }> {
    // Get active KPIs count
    const [activeKpisResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(smartKpiDefinitions)
      .where(eq(smartKpiDefinitions.isActive, true));
    const activeKpis = activeKpisResult?.count || 0;

    // Get critical alerts count
    const [criticalAlertsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(smartKpiAlerts)
      .where(
        and(
          eq(smartKpiAlerts.severity, 'critical'),
          eq(smartKpiAlerts.status, 'open')
        )
      );
    const criticalAlerts = criticalAlertsResult?.count || 0;

    // Get improvements in progress count
    const [improvementsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(smartKpiImprovements)
      .where(eq(smartKpiImprovements.status, 'in_progress'));
    const improvementsInProgress = improvementsResult?.count || 0;

    // Calculate target achievement (simplified)
    const targetAchievement = activeKpis > 0 ? Math.round(75 + Math.random() * 20) : 0;

    // Get KPIs by category
    const kpisByCategory = await db
      .select({
        category: smartKpiDefinitions.category,
        count: sql<number>`count(*)`,
        avgPerformance: sql<number>`75 + random() * 20` // Simplified calculation
      })
      .from(smartKpiDefinitions)
      .where(eq(smartKpiDefinitions.isActive, true))
      .groupBy(smartKpiDefinitions.category);

    // Get recent meetings
    const recentMeetings = await db
      .select()
      .from(smartKpiMeetings)
      .orderBy(desc(smartKpiMeetings.scheduledDate))
      .limit(5);

    // Get urgent actions (simplified)
    const urgentActions = [
      {
        type: 'KPI Alert',
        description: 'First Pass Yield below threshold',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      },
      {
        type: 'Improvement Plan',
        description: 'Complete predictive maintenance implementation',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next week
      }
    ];

    return {
      activeKpis,
      criticalAlerts,
      improvementsInProgress,
      targetAchievement,
      kpisByCategory,
      recentMeetings,
      urgentActions
    };
  }

  // Presentation System Implementation
  async getPresentations(userId?: number): Promise<Presentation[]> {
    let query = db.select({
      id: presentations.id,
      title: presentations.title,
      description: presentations.description,
      category: presentations.category,
      audience: presentations.audience,
      createdBy: presentations.createdBy,
      isTemplate: presentations.isTemplate,
      isPublic: presentations.isPublic,
      tags: presentations.tags,
      thumbnail: presentations.thumbnail,
      estimatedDuration: presentations.estimatedDuration,
      targetRoles: presentations.targetRoles,
      customization: presentations.customization,
      createdAt: presentations.createdAt,
      updatedAt: presentations.updatedAt,
      creatorUsername: users.username,
    }).from(presentations).leftJoin(users, eq(presentations.createdBy, users.id));
    
    if (userId) {
      query = query.where(eq(presentations.createdBy, userId));
    }
    return await query.orderBy(desc(presentations.createdAt));
  }

  async getPresentation(id: number): Promise<Presentation | undefined> {
    const [presentation] = await db.select().from(presentations).where(eq(presentations.id, id));
    return presentation;
  }

  async createPresentation(presentation: InsertPresentation): Promise<Presentation> {
    const [newPresentation] = await db.insert(presentations).values(presentation).returning();
    return newPresentation;
  }

  async updatePresentation(id: number, updates: Partial<InsertPresentation>): Promise<Presentation | undefined> {
    const [updated] = await db
      .update(presentations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(presentations.id, id))
      .returning();
    return updated;
  }

  async deletePresentation(id: number): Promise<boolean> {
    const result = await db.delete(presentations).where(eq(presentations.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getPresentationSlides(presentationId: number): Promise<PresentationSlide[]> {
    return await db
      .select()
      .from(presentationSlides)
      .where(eq(presentationSlides.presentationId, presentationId))
      .orderBy(asc(presentationSlides.slideOrder));
  }

  async getPresentationSlide(id: number): Promise<PresentationSlide | undefined> {
    const [slide] = await db.select().from(presentationSlides).where(eq(presentationSlides.id, id));
    return slide;
  }

  async createPresentationSlide(slide: InsertPresentationSlide): Promise<PresentationSlide> {
    const [newSlide] = await db.insert(presentationSlides).values(slide).returning();
    return newSlide;
  }

  async updatePresentationSlide(id: number, updates: Partial<InsertPresentationSlide>): Promise<PresentationSlide | undefined> {
    const [updated] = await db
      .update(presentationSlides)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(presentationSlides.id, id))
      .returning();
    return updated;
  }

  async deletePresentationSlide(id: number): Promise<boolean> {
    const result = await db.delete(presentationSlides).where(eq(presentationSlides.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getPresentationLibrary(category?: string): Promise<PresentationLibrary[]> {
    let query = db.select().from(presentationLibrary);
    if (category) {
      query = query.where(eq(presentationLibrary.category, category));
    }
    return await query.orderBy(desc(presentationLibrary.createdAt));
  }

  async createPresentationLibraryEntry(entry: InsertPresentationLibrary): Promise<PresentationLibrary> {
    const [newEntry] = await db.insert(presentationLibrary).values(entry).returning();
    return newEntry;
  }

  async updatePresentationLibraryEntry(id: number, updates: Partial<InsertPresentationLibrary>): Promise<PresentationLibrary | undefined> {
    const [updated] = await db
      .update(presentationLibrary)
      .set(updates)
      .where(eq(presentationLibrary.id, id))
      .returning();
    return updated;
  }

  async getPresentationTourIntegrations(presentationId?: number): Promise<PresentationTourIntegration[]> {
    let query = db.select().from(presentationTourIntegrations);
    if (presentationId) {
      query = query.where(eq(presentationTourIntegrations.presentationId, presentationId));
    }
    return await query.orderBy(desc(presentationTourIntegrations.createdAt));
  }

  async createPresentationTourIntegration(integration: InsertPresentationTourIntegration): Promise<PresentationTourIntegration> {
    const [newIntegration] = await db.insert(presentationTourIntegrations).values(integration).returning();
    return newIntegration;
  }

  async deletePresentationTourIntegration(id: number): Promise<boolean> {
    const result = await db.delete(presentationTourIntegrations).where(eq(presentationTourIntegrations.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getPresentationAnalytics(presentationId?: number): Promise<PresentationAnalytics[]> {
    let query = db.select().from(presentationAnalytics);
    if (presentationId) {
      query = query.where(eq(presentationAnalytics.presentationId, presentationId));
    }
    return await query.orderBy(desc(presentationAnalytics.createdAt));
  }

  async createPresentationAnalyticsEntry(entry: InsertPresentationAnalytics): Promise<PresentationAnalytics> {
    const [newEntry] = await db.insert(presentationAnalytics).values(entry).returning();
    return newEntry;
  }

  async getPresentationAIContent(presentationId?: number): Promise<PresentationAIContent[]> {
    let query = db.select().from(presentationAIContent);
    if (presentationId) {
      query = query.where(eq(presentationAIContent.presentationId, presentationId));
    }
    return await query.orderBy(desc(presentationAIContent.createdAt));
  }

  async createPresentationAIContent(content: InsertPresentationAIContent): Promise<PresentationAIContent> {
    const [newContent] = await db.insert(presentationAIContent).values(content).returning();
    return newContent;
  }

  // Presentation Studio - Materials Management Implementation
  async getPresentationMaterials(presentationId?: number): Promise<PresentationMaterial[]> {
    let query = db.select().from(presentationMaterials);
    if (presentationId) {
      query = query.where(eq(presentationMaterials.presentationId, presentationId));
    }
    return await query.orderBy(desc(presentationMaterials.createdAt));
  }

  async getPresentationMaterial(id: number): Promise<PresentationMaterial | undefined> {
    const [material] = await db.select().from(presentationMaterials).where(eq(presentationMaterials.id, id));
    return material;
  }

  async createPresentationMaterial(material: InsertPresentationMaterial): Promise<PresentationMaterial> {
    const [newMaterial] = await db.insert(presentationMaterials).values(material).returning();
    return newMaterial;
  }

  async updatePresentationMaterial(id: number, updates: Partial<InsertPresentationMaterial>): Promise<PresentationMaterial | undefined> {
    const [updated] = await db
      .update(presentationMaterials)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(presentationMaterials.id, id))
      .returning();
    return updated;
  }

  async deletePresentationMaterial(id: number): Promise<boolean> {
    const result = await db.delete(presentationMaterials).where(eq(presentationMaterials.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Presentation Studio - Content Suggestions Implementation
  async getPresentationContentSuggestions(presentationId?: number): Promise<PresentationContentSuggestion[]> {
    let query = db.select().from(presentationContentSuggestions);
    if (presentationId) {
      query = query.where(eq(presentationContentSuggestions.presentationId, presentationId));
    }
    return await query.orderBy(desc(presentationContentSuggestions.createdAt));
  }

  async createPresentationContentSuggestion(suggestion: InsertPresentationContentSuggestion): Promise<PresentationContentSuggestion> {
    const [newSuggestion] = await db.insert(presentationContentSuggestions).values(suggestion).returning();
    return newSuggestion;
  }

  async updatePresentationContentSuggestion(id: number, updates: Partial<InsertPresentationContentSuggestion>): Promise<PresentationContentSuggestion | undefined> {
    const [updated] = await db
      .update(presentationContentSuggestions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(presentationContentSuggestions.id, id))
      .returning();
    return updated;
  }

  async deletePresentationContentSuggestion(id: number): Promise<boolean> {
    const result = await db.delete(presentationContentSuggestions).where(eq(presentationContentSuggestions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Presentation Studio - Project Management Implementation
  async getPresentationProjects(userId?: number): Promise<PresentationProject[]> {
    let query = db.select().from(presentationProjects);
    if (userId) {
      query = query.where(eq(presentationProjects.createdBy, userId));
    }
    return await query.orderBy(desc(presentationProjects.createdAt));
  }

  async getPresentationProject(id: number): Promise<PresentationProject | undefined> {
    const [project] = await db.select().from(presentationProjects).where(eq(presentationProjects.id, id));
    return project;
  }

  async createPresentationProject(project: InsertPresentationProject): Promise<PresentationProject> {
    const [newProject] = await db.insert(presentationProjects).values(project).returning();
    return newProject;
  }

  async updatePresentationProject(id: number, updates: Partial<InsertPresentationProject>): Promise<PresentationProject | undefined> {
    const [updated] = await db
      .update(presentationProjects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(presentationProjects.id, id))
      .returning();
    return updated;
  }

  async deletePresentationProject(id: number): Promise<boolean> {
    const result = await db.delete(presentationProjects).where(eq(presentationProjects.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  // Marketing System Implementation
  
  // Customer Journey Stages



  // Production Planning System Implementation
  // Production Plans
  async getProductionPlans(plantId?: number): Promise<ProductionPlan[]> {
    let query = db.select().from(productionPlans);
    
    if (plantId) {
      query = query.where(eq(productionPlans.plantId, plantId));
    }
    
    return await query.orderBy(desc(productionPlans.createdAt));
  }

  async getProductionPlan(id: number): Promise<ProductionPlan | undefined> {
    const [plan] = await db.select().from(productionPlans)
      .where(eq(productionPlans.id, id));
    return plan;
  }

  async createProductionPlan(plan: InsertProductionPlan): Promise<ProductionPlan> {
    const [newPlan] = await db.insert(productionPlans).values(plan).returning();
    return newPlan;
  }

  async updateProductionPlan(id: number, updates: Partial<InsertProductionPlan>): Promise<ProductionPlan | undefined> {
    const [updated] = await db.update(productionPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(productionPlans.id, id))
      .returning();
    return updated;
  }

  async deleteProductionPlan(id: number): Promise<boolean> {
    const result = await db.delete(productionPlans).where(eq(productionPlans.id, id));
    return result.rowCount > 0;
  }

  async approveProductionPlan(id: number, approvedBy: string): Promise<ProductionPlan | undefined> {
    const [updated] = await db.update(productionPlans)
      .set({ 
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(productionPlans.id, id))
      .returning();
    return updated;
  }

  // Production Targets
  async getProductionTargets(planId?: number): Promise<ProductionTarget[]> {
    let query = db.select().from(productionTargets);
    
    if (planId) {
      query = query.where(eq(productionTargets.planId, planId));
    }
    
    return await query.orderBy(asc(productionTargets.targetStartDate));
  }

  async getProductionTarget(id: number): Promise<ProductionTarget | undefined> {
    const [target] = await db.select().from(productionTargets)
      .where(eq(productionTargets.id, id));
    return target;
  }

  async createProductionTarget(target: InsertProductionTarget): Promise<ProductionTarget> {
    const [newTarget] = await db.insert(productionTargets).values(target).returning();
    return newTarget;
  }

  async updateProductionTarget(id: number, updates: Partial<InsertProductionTarget>): Promise<ProductionTarget | undefined> {
    const [updated] = await db.update(productionTargets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(productionTargets.id, id))
      .returning();
    return updated;
  }

  async deleteProductionTarget(id: number): Promise<boolean> {
    const result = await db.delete(productionTargets).where(eq(productionTargets.id, id));
    return result.rowCount > 0;
  }

  // Resource Allocations
  async getResourceAllocations(planId?: number): Promise<ResourceAllocation[]> {
    let query = db.select().from(resourceAllocations);
    
    if (planId) {
      query = query.where(eq(resourceAllocations.planId, planId));
    }
    
    return await query.orderBy(asc(resourceAllocations.startDate));
  }

  async getResourceAllocation(id: number): Promise<ResourceAllocation | undefined> {
    const [allocation] = await db.select().from(resourceAllocations)
      .where(eq(resourceAllocations.id, id));
    return allocation;
  }

  async createResourceAllocation(allocation: InsertResourceAllocation): Promise<ResourceAllocation> {
    const [newAllocation] = await db.insert(resourceAllocations).values(allocation).returning();
    return newAllocation;
  }

  async updateResourceAllocation(id: number, updates: Partial<InsertResourceAllocation>): Promise<ResourceAllocation | undefined> {
    const [updated] = await db.update(resourceAllocations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(resourceAllocations.id, id))
      .returning();
    return updated;
  }

  async deleteResourceAllocation(id: number): Promise<boolean> {
    const result = await db.delete(resourceAllocations).where(eq(resourceAllocations.id, id));
    return result.rowCount > 0;
  }

  // Production Milestones
  async getProductionMilestones(planId?: number): Promise<ProductionMilestone[]> {
    let query = db.select().from(productionMilestones);
    
    if (planId) {
      query = query.where(eq(productionMilestones.planId, planId));
    }
    
    return await query.orderBy(asc(productionMilestones.targetDate));
  }

  async getProductionMilestone(id: number): Promise<ProductionMilestone | undefined> {
    const [milestone] = await db.select().from(productionMilestones)
      .where(eq(productionMilestones.id, id));
    return milestone;
  }

  async createProductionMilestone(milestone: InsertProductionMilestone): Promise<ProductionMilestone> {
    const [newMilestone] = await db.insert(productionMilestones).values(milestone).returning();
    return newMilestone;
  }

  async updateProductionMilestone(id: number, updates: Partial<InsertProductionMilestone>): Promise<ProductionMilestone | undefined> {
    const [updated] = await db.update(productionMilestones)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(productionMilestones.id, id))
      .returning();
    return updated;
  }

  async deleteProductionMilestone(id: number): Promise<boolean> {
    const result = await db.delete(productionMilestones).where(eq(productionMilestones.id, id));
    return result.rowCount > 0;
  }

  async markMilestoneComplete(id: number): Promise<ProductionMilestone | undefined> {
    const [updated] = await db.update(productionMilestones)
      .set({ 
        status: 'completed',
        actualDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(productionMilestones.id, id))
      .returning();
    return updated;
  }

  // Optimization Studio - Algorithm Management Implementation
  async getOptimizationAlgorithms(category?: string, status?: string): Promise<OptimizationAlgorithm[]> {
    let query = db.select().from(optimizationAlgorithms);
    
    const conditions = [];
    if (category) conditions.push(eq(optimizationAlgorithms.category, category));
    if (status) conditions.push(eq(optimizationAlgorithms.status, status));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(optimizationAlgorithms.createdAt));
  }

  async getOptimizationAlgorithm(id: number): Promise<OptimizationAlgorithm | undefined> {
    const [algorithm] = await db.select().from(optimizationAlgorithms)
      .where(eq(optimizationAlgorithms.id, id));
    return algorithm;
  }

  async createOptimizationAlgorithm(algorithm: InsertOptimizationAlgorithm): Promise<OptimizationAlgorithm> {
    const [newAlgorithm] = await db.insert(optimizationAlgorithms).values(algorithm).returning();
    return newAlgorithm;
  }

  async updateOptimizationAlgorithm(id: number, updates: Partial<InsertOptimizationAlgorithm>): Promise<OptimizationAlgorithm | undefined> {
    const [updated] = await db.update(optimizationAlgorithms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(optimizationAlgorithms.id, id))
      .returning();
    return updated;
  }

  async deleteOptimizationAlgorithm(id: number): Promise<boolean> {
    const result = await db.delete(optimizationAlgorithms).where(eq(optimizationAlgorithms.id, id));
    return result.rowCount > 0;
  }

  async approveOptimizationAlgorithm(id: number, approvedBy: number, comments?: string): Promise<OptimizationAlgorithm | undefined> {
    const [updated] = await db.update(optimizationAlgorithms)
      .set({
        status: 'approved',
        approvals: {
          approved: true,
          approvedBy,
          approvedAt: new Date(),
          comments: comments || '',
          requiredPermissions: []
        },
        updatedAt: new Date()
      })
      .where(eq(optimizationAlgorithms.id, id))
      .returning();
    return updated;
  }

  async deployOptimizationAlgorithm(id: number, targetModule: string, environment: string): Promise<OptimizationAlgorithm | undefined> {
    // Create deployment record
    await db.insert(algorithmDeployments).values({
      algorithmId: id,
      targetModule,
      environment,
      version: '1.0.0',
      status: 'active',
      deployedBy: 1 // This should come from the authenticated user
    });

    // Update algorithm status
    const [updated] = await db.update(optimizationAlgorithms)
      .set({
        status: 'deployed',
        updatedAt: new Date()
      })
      .where(eq(optimizationAlgorithms.id, id))
      .returning();
    return updated;
  }

  async getStandardAlgorithms(category?: string): Promise<OptimizationAlgorithm[]> {
    let query = db.select().from(optimizationAlgorithms)
      .where(eq(optimizationAlgorithms.isStandard, true));
    
    if (category) {
      query = query.where(and(
        eq(optimizationAlgorithms.isStandard, true),
        eq(optimizationAlgorithms.category, category)
      ));
    }
    
    return await query.orderBy(asc(optimizationAlgorithms.name));
  }

  async getDerivedAlgorithms(baseId: number): Promise<OptimizationAlgorithm[]> {
    return await db.select().from(optimizationAlgorithms)
      .where(eq(optimizationAlgorithms.baseAlgorithmId, baseId))
      .orderBy(desc(optimizationAlgorithms.createdAt));
  }

  // Optimization Studio - Algorithm Testing Implementation
  async getAlgorithmTests(algorithmId?: number, testType?: string): Promise<AlgorithmTest[]> {
    let query = db.select().from(algorithmTests);
    
    const conditions = [];
    if (algorithmId) conditions.push(eq(algorithmTests.algorithmId, algorithmId));
    if (testType) conditions.push(eq(algorithmTests.testType, testType));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(algorithmTests.createdAt));
  }

  async getAlgorithmTest(id: number): Promise<AlgorithmTest | undefined> {
    const [test] = await db.select().from(algorithmTests)
      .where(eq(algorithmTests.id, id));
    return test;
  }

  async createAlgorithmTest(test: InsertAlgorithmTest): Promise<AlgorithmTest> {
    const [newTest] = await db.insert(algorithmTests).values(test).returning();
    return newTest;
  }

  async updateAlgorithmTest(id: number, updates: Partial<InsertAlgorithmTest>): Promise<AlgorithmTest | undefined> {
    const [updated] = await db.update(algorithmTests)
      .set(updates)
      .where(eq(algorithmTests.id, id))
      .returning();
    return updated;
  }

  async deleteAlgorithmTest(id: number): Promise<boolean> {
    const result = await db.delete(algorithmTests).where(eq(algorithmTests.id, id));
    return result.rowCount > 0;
  }

  async runAlgorithmTest(id: number, datasetType: string): Promise<AlgorithmTest | undefined> {
    // This would integrate with actual algorithm execution
    const testResults = {
      executionTime: Math.random() * 1000,
      accuracy: 0.85 + Math.random() * 0.15,
      performance: Math.random() * 100,
      errors: [],
      datasetType
    };

    const [updated] = await db.update(algorithmTests)
      .set({
        results: testResults
      })
      .where(eq(algorithmTests.id, id))
      .returning();
    return updated;
  }

  async getTestResults(algorithmId: number): Promise<AlgorithmTest[]> {
    return await db.select().from(algorithmTests)
      .where(and(
        eq(algorithmTests.algorithmId, algorithmId),
        isNotNull(algorithmTests.results)
      ))
      .orderBy(desc(algorithmTests.createdAt));
  }

  // Optimization Studio - Algorithm Deployments Implementation
  async getAlgorithmDeployments(algorithmId?: number, targetModule?: string): Promise<AlgorithmDeployment[]> {
    let query = db.select().from(algorithmDeployments);
    
    const conditions = [];
    if (algorithmId) conditions.push(eq(algorithmDeployments.algorithmId, algorithmId));
    if (targetModule) conditions.push(eq(algorithmDeployments.targetModule, targetModule));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(algorithmDeployments.deployedAt));
  }

  async getAlgorithmDeployment(id: number): Promise<AlgorithmDeployment | undefined> {
    const [deployment] = await db.select().from(algorithmDeployments)
      .where(eq(algorithmDeployments.id, id));
    return deployment;
  }

  async createAlgorithmDeployment(deployment: InsertAlgorithmDeployment): Promise<AlgorithmDeployment> {
    const [newDeployment] = await db.insert(algorithmDeployments).values(deployment).returning();
    return newDeployment;
  }

  async updateAlgorithmDeployment(id: number, updates: Partial<InsertAlgorithmDeployment>): Promise<AlgorithmDeployment | undefined> {
    const [updated] = await db.update(algorithmDeployments)
      .set(updates)
      .where(eq(algorithmDeployments.id, id))
      .returning();
    return updated;
  }

  async deleteAlgorithmDeployment(id: number): Promise<boolean> {
    const result = await db.delete(algorithmDeployments).where(eq(algorithmDeployments.id, id));
    return result.rowCount > 0;
  }

  async activateDeployment(id: number): Promise<AlgorithmDeployment | undefined> {
    const [updated] = await db.update(algorithmDeployments)
      .set({
        status: 'active',
        lastHealthCheck: new Date()
      })
      .where(eq(algorithmDeployments.id, id))
      .returning();
    return updated;
  }

  async rollbackDeployment(id: number): Promise<AlgorithmDeployment | undefined> {
    const [updated] = await db.update(algorithmDeployments)
      .set({
        status: 'rolled_back',
        lastHealthCheck: new Date()
      })
      .where(eq(algorithmDeployments.id, id))
      .returning();
    return updated;
  }

  async updateDeploymentHealth(id: number, metrics: Record<string, number>): Promise<AlgorithmDeployment | undefined> {
    const [updated] = await db.update(algorithmDeployments)
      .set({
        metrics,
        lastHealthCheck: new Date()
      })
      .where(eq(algorithmDeployments.id, id))
      .returning();
    return updated;
  }

  // Optimization Studio - Extension Data Management Implementation
  async getExtensionData(algorithmId?: number, entityType?: string, entityId?: number): Promise<ExtensionData[]> {
    let query = db.select().from(extensionData);
    
    const conditions = [];
    if (algorithmId) conditions.push(eq(extensionData.algorithmId, algorithmId));
    if (entityType) conditions.push(eq(extensionData.entityType, entityType));
    if (entityId) conditions.push(eq(extensionData.entityId, entityId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(extensionData.createdAt));
  }

  async getExtensionDataItem(id: number): Promise<ExtensionData | undefined> {
    const [data] = await db.select().from(extensionData)
      .where(eq(extensionData.id, id));
    return data;
  }

  async createExtensionData(data: InsertExtensionData): Promise<ExtensionData> {
    const [newData] = await db.insert(extensionData).values(data).returning();
    return newData;
  }

  async updateExtensionData(id: number, updates: Partial<InsertExtensionData>): Promise<ExtensionData | undefined> {
    const [updated] = await db.update(extensionData)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(extensionData.id, id))
      .returning();
    return updated;
  }

  async deleteExtensionData(id: number): Promise<boolean> {
    const result = await db.delete(extensionData).where(eq(extensionData.id, id));
    return result.rowCount > 0;
  }

  async getExtensionDataByEntity(entityType: string, entityId: number): Promise<ExtensionData[]> {
    return await db.select().from(extensionData)
      .where(and(
        eq(extensionData.entityType, entityType),
        eq(extensionData.entityId, entityId)
      ))
      .orderBy(asc(extensionData.fieldName));
  }

  async getExtensionDataFields(algorithmId: number): Promise<{ entityType: string; fields: string[] }[]> {
    const results = await db.select({
      entityType: extensionData.entityType,
      fieldName: extensionData.fieldName
    })
    .from(extensionData)
    .where(eq(extensionData.algorithmId, algorithmId))
    .groupBy(extensionData.entityType, extensionData.fieldName);

    const grouped = results.reduce((acc, curr) => {
      if (!acc[curr.entityType]) {
        acc[curr.entityType] = [];
      }
      acc[curr.entityType].push(curr.fieldName);
      return acc;
    }, {} as Record<string, string[]>);

    return Object.entries(grouped).map(([entityType, fields]) => ({
      entityType,
      fields
    }));
  }

  // Optimization Scope Configuration Management Implementation
  async getOptimizationScopeConfigs(category?: string, userId?: number): Promise<OptimizationScopeConfig[]> {
    let query = db.select().from(optimizationScopeConfigs);
    
    const conditions = [];
    if (category) conditions.push(eq(optimizationScopeConfigs.category, category));
    if (userId) conditions.push(eq(optimizationScopeConfigs.createdBy, userId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(optimizationScopeConfigs.isDefault), asc(optimizationScopeConfigs.name));
  }

  async getOptimizationScopeConfig(id: number): Promise<OptimizationScopeConfig | undefined> {
    const [config] = await db.select().from(optimizationScopeConfigs).where(eq(optimizationScopeConfigs.id, id));
    return config;
  }

  async createOptimizationScopeConfig(config: InsertOptimizationScopeConfig): Promise<OptimizationScopeConfig> {
    const [newConfig] = await db
      .insert(optimizationScopeConfigs)
      .values({
        ...config,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newConfig;
  }

  async updateOptimizationScopeConfig(id: number, updates: Partial<InsertOptimizationScopeConfig>): Promise<OptimizationScopeConfig | undefined> {
    const [updated] = await db
      .update(optimizationScopeConfigs)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(optimizationScopeConfigs.id, id))
      .returning();
    return updated;
  }

  async deleteOptimizationScopeConfig(id: number): Promise<boolean> {
    const result = await db.delete(optimizationScopeConfigs).where(eq(optimizationScopeConfigs.id, id));
    return result.rowCount > 0;
  }

  async getDefaultOptimizationScopeConfig(category: string): Promise<OptimizationScopeConfig | undefined> {
    const [config] = await db.select()
      .from(optimizationScopeConfigs)
      .where(and(
        eq(optimizationScopeConfigs.category, category),
        eq(optimizationScopeConfigs.isDefault, true)
      ))
      .limit(1);
    return config;
  }

  async setOptimizationScopeConfigAsDefault(id: number): Promise<void> {
    // First get the config to determine its category
    const config = await this.getOptimizationScopeConfig(id);
    if (!config) return;

    // Remove default flag from all configs in this category
    await db.update(optimizationScopeConfigs)
      .set({ isDefault: false })
      .where(eq(optimizationScopeConfigs.category, config.category));

    // Set the specified config as default
    await db.update(optimizationScopeConfigs)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(optimizationScopeConfigs.id, id));
  }

  async duplicateOptimizationScopeConfig(id: number, newName: string, userId: number): Promise<OptimizationScopeConfig> {
    const original = await this.getOptimizationScopeConfig(id);
    if (!original) throw new Error("Optimization scope configuration not found");

    const duplicate: InsertOptimizationScopeConfig = {
      name: newName,
      description: original.description ? `Copy of ${original.description}` : `Copy of ${original.name}`,
      category: original.category,
      isDefault: false,
      isShared: false,
      scopeFilters: original.scopeFilters,
      optimizationGoals: original.optimizationGoals,
      constraints: original.constraints,
      metadata: {
        ...original.metadata,
        usageCount: 0,
        lastUsed: undefined
      },
      createdBy: userId
    };

    return await this.createOptimizationScopeConfig(duplicate);
  }

  // Optimization Run History Management Implementation
  async getOptimizationRuns(userId?: number, algorithmId?: number): Promise<OptimizationRun[]> {
    let query = db.select().from(optimizationRuns);
    
    const conditions = [];
    if (userId) conditions.push(eq(optimizationRuns.createdBy, userId));
    if (algorithmId) conditions.push(eq(optimizationRuns.algorithmId, algorithmId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(optimizationRuns.createdAt));
  }

  async getOptimizationRun(id: number): Promise<OptimizationRun | undefined> {
    const [run] = await db.select().from(optimizationRuns).where(eq(optimizationRuns.id, id));
    return run;
  }

  async createOptimizationRun(run: InsertOptimizationRun): Promise<OptimizationRun> {
    const [newRun] = await db
      .insert(optimizationRuns)
      .values({
        ...run,
        createdAt: new Date()
      })
      .returning();
    return newRun;
  }

  async updateOptimizationRun(id: number, updates: Partial<InsertOptimizationRun>): Promise<OptimizationRun | undefined> {
    const [updated] = await db
      .update(optimizationRuns)
      .set(updates)
      .where(eq(optimizationRuns.id, id))
      .returning();
    return updated;
  }

  async deleteOptimizationRun(id: number): Promise<boolean> {
    const result = await db.delete(optimizationRuns).where(eq(optimizationRuns.id, id));
    return result.rowCount > 0;
  }

  async getOptimizationRunsByStatus(status: string): Promise<OptimizationRun[]> {
    return await db.select()
      .from(optimizationRuns)
      .where(eq(optimizationRuns.status, status))
      .orderBy(desc(optimizationRuns.createdAt));
  }

  async updateOptimizationRunStatus(id: number, status: string, error?: string): Promise<OptimizationRun | undefined> {
    const updates: Partial<InsertOptimizationRun> = { status };
    
    if (status === 'running' && !error) {
      updates.startTime = new Date();
    } else if (status === 'completed' || status === 'failed') {
      updates.endTime = new Date();
    }
    
    if (error) {
      updates.error = error;
    }
    
    return await this.updateOptimizationRun(id, updates);
  }

  // Optimization Profiles Management - Algorithm-specific execution configurations
  async getOptimizationProfiles(algorithmId?: number, userId?: number): Promise<OptimizationProfile[]> {
    let query = db.select().from(optimizationProfiles);
    
    const conditions = [];
    if (algorithmId) conditions.push(eq(optimizationProfiles.algorithmId, algorithmId));
    if (userId) conditions.push(eq(optimizationProfiles.createdBy, userId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(optimizationProfiles.createdAt));
  }

  async getOptimizationProfile(id: number): Promise<OptimizationProfile | undefined> {
    const [profile] = await db.select()
      .from(optimizationProfiles)
      .where(eq(optimizationProfiles.id, id));
    return profile;
  }

  async createOptimizationProfile(profile: InsertOptimizationProfile): Promise<OptimizationProfile> {
    const [newProfile] = await db
      .insert(optimizationProfiles)
      .values({
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newProfile;
  }

  async updateOptimizationProfile(id: number, updates: Partial<InsertOptimizationProfile>): Promise<OptimizationProfile | undefined> {
    const [updated] = await db
      .update(optimizationProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(optimizationProfiles.id, id))
      .returning();
    return updated;
  }

  async deleteOptimizationProfile(id: number): Promise<boolean> {
    const result = await db.delete(optimizationProfiles).where(eq(optimizationProfiles.id, id));
    return result.rowCount > 0;
  }

  async getDefaultOptimizationProfile(algorithmId: number): Promise<OptimizationProfile | undefined> {
    const [profile] = await db.select()
      .from(optimizationProfiles)
      .where(and(
        eq(optimizationProfiles.algorithmId, algorithmId),
        eq(optimizationProfiles.isDefault, true)
      ));
    return profile;
  }

  async setOptimizationProfileAsDefault(id: number): Promise<void> {
    // First get the profile to know which algorithm
    const profile = await this.getOptimizationProfile(id);
    if (!profile) return;

    // Remove default from all profiles for this algorithm
    await db.update(optimizationProfiles)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(optimizationProfiles.algorithmId, profile.algorithmId));

    // Set this profile as default
    await db.update(optimizationProfiles)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(optimizationProfiles.id, id));
  }

  async duplicateOptimizationProfile(id: number, newName: string, userId: number): Promise<OptimizationProfile> {
    const originalProfile = await this.getOptimizationProfile(id);
    if (!originalProfile) {
      throw new Error('Profile not found');
    }

    const duplicatedProfile = {
      name: newName,
      algorithmId: originalProfile.algorithmId,
      description: `Copy of ${originalProfile.name}`,
      configuration: originalProfile.configuration,
      isDefault: false,
      isShared: false,
      createdBy: userId
    };

    return await this.createOptimizationProfile(duplicatedProfile);
  }

  async getSharedOptimizationProfiles(algorithmId: number): Promise<OptimizationProfile[]> {
    return await db.select()
      .from(optimizationProfiles)
      .where(and(
        eq(optimizationProfiles.algorithmId, algorithmId),
        eq(optimizationProfiles.isShared, true)
      ))
      .orderBy(desc(optimizationProfiles.createdAt));
  }

  async validateOptimizationProfile(profile: OptimizationProfile): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic validation
    if (!profile.name || profile.name.trim().length === 0) {
      errors.push('Profile name is required');
    }

    if (!profile.algorithmId) {
      errors.push('Algorithm ID is required');
    }

    // Validate configuration structure
    if (!profile.configuration || typeof profile.configuration !== 'object') {
      errors.push('Configuration must be a valid object');
    } else {
      // Algorithm-specific validation would go here
      // Each algorithm can define its own validation rules
      const config = profile.configuration as any;
      
      // Example: validate common parameters
      if (config.plannedOrdersWeight !== undefined) {
        if (typeof config.plannedOrdersWeight !== 'number' || config.plannedOrdersWeight < 0 || config.plannedOrdersWeight > 1) {
          errors.push('Planned orders weight must be a number between 0 and 1');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Profile Usage History Management
  async getProfileUsageHistory(profileId?: number, userId?: number): Promise<ProfileUsageHistory[]> {
    let query = db.select().from(profileUsageHistory);
    
    const conditions = [];
    if (profileId) conditions.push(eq(profileUsageHistory.profileId, profileId));
    if (userId) conditions.push(eq(profileUsageHistory.userId, userId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(profileUsageHistory.createdAt));
  }

  async createProfileUsageHistory(usage: InsertProfileUsageHistory): Promise<ProfileUsageHistory> {
    const [newUsage] = await db
      .insert(profileUsageHistory)
      .values({
        ...usage,
        createdAt: new Date()
      })
      .returning();
    return newUsage;
  }

  async getProfileUsageStats(profileId: number): Promise<{
    totalUsage: number;
    averageExecutionTime: number;
    successRate: number;
    lastUsed: Date | null;
    userCount: number;
  }> {
    try {
      const stats = await db.select({
        totalUsage: count(),
        lastUsed: max(profileUsageHistory.createdAt),
        userCount: countDistinct(profileUsageHistory.usedBy)
      })
      .from(profileUsageHistory)
      .where(eq(profileUsageHistory.profileId, profileId));

      const result = stats[0];

      return {
        totalUsage: result.totalUsage || 0,
        averageExecutionTime: 0, // Would need to parse from executionResults JSON
        successRate: 100, // Assume success for now, would need to analyze executionResults
        lastUsed: result.lastUsed,
        userCount: result.userCount || 0
      };
    } catch (error) {
      console.error('Error in getProfileUsageStats:', error);
      throw error;
    }
  }

  // Comprehensive Shift Management System Implementation
  
  // Shift Templates Management
  async getShiftTemplates(plantId?: number): Promise<ShiftTemplate[]> {
    let query = db.select().from(shiftTemplates);
    
    if (plantId) {
      query = query.where(eq(shiftTemplates.plantId, plantId));
    }
    
    return await query.orderBy(asc(shiftTemplates.name));
  }

  async getShiftTemplate(id: number): Promise<ShiftTemplate | undefined> {
    const [template] = await db
      .select()
      .from(shiftTemplates)
      .where(eq(shiftTemplates.id, id));
    return template;
  }

  async createShiftTemplate(templateData: InsertShiftTemplate): Promise<ShiftTemplate> {
    const [template] = await db
      .insert(shiftTemplates)
      .values(templateData)
      .returning();
    return template;
  }

  async updateShiftTemplate(id: number, updates: Partial<InsertShiftTemplate>): Promise<ShiftTemplate | undefined> {
    const [template] = await db
      .update(shiftTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(shiftTemplates.id, id))
      .returning();
    return template;
  }

  async deleteShiftTemplate(id: number): Promise<boolean> {
    const result = await db.delete(shiftTemplates).where(eq(shiftTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Resource Shift Assignments Management
  async getResourceShiftAssignments(resourceId?: number, effectiveDate?: Date): Promise<ResourceShiftAssignment[]> {
    let query = db.select().from(resourceShiftAssignments);
    
    if (resourceId) {
      query = query.where(eq(resourceShiftAssignments.resourceId, resourceId));
    }
    
    if (effectiveDate) {
      query = query.where(
        and(
          lte(resourceShiftAssignments.effectiveDate, effectiveDate),
          or(
            isNull(resourceShiftAssignments.endDate),
            gte(resourceShiftAssignments.endDate, effectiveDate)
          )
        )
      );
    }
    
    return await query.orderBy(asc(resourceShiftAssignments.effectiveDate));
  }

  async createResourceShiftAssignment(assignmentData: InsertResourceShiftAssignment): Promise<ResourceShiftAssignment> {
    const [assignment] = await db
      .insert(resourceShiftAssignments)
      .values(assignmentData)
      .returning();
    return assignment;
  }

  async updateResourceShiftAssignment(id: number, updates: Partial<InsertResourceShiftAssignment>): Promise<ResourceShiftAssignment | undefined> {
    const [assignment] = await db
      .update(resourceShiftAssignments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(resourceShiftAssignments.id, id))
      .returning();
    return assignment;
  }

  // Holidays Management
  async getHolidays(plantId?: number, year?: number): Promise<Holiday[]> {
    let query = db.select().from(holidays);
    
    const conditions = [];
    if (plantId) {
      conditions.push(eq(holidays.plantId, plantId));
    }
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      conditions.push(
        and(
          gte(holidays.date, startDate),
          lte(holidays.date, endDate)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(asc(holidays.date));
  }

  async getHolidaysInDateRange(startDate: Date, endDate: Date, plantId?: number): Promise<Holiday[]> {
    let query = db
      .select()
      .from(holidays)
      .where(
        and(
          gte(holidays.date, startDate),
          lte(holidays.date, endDate)
        )
      );
    
    if (plantId) {
      query = query.where(
        and(
          gte(holidays.date, startDate),
          lte(holidays.date, endDate),
          eq(holidays.plantId, plantId)
        )
      );
    }
    
    return await query.orderBy(asc(holidays.date));
  }

  async createHoliday(holidayData: InsertHoliday): Promise<Holiday> {
    const [holiday] = await db
      .insert(holidays)
      .values(holidayData)
      .returning();
    return holiday;
  }

  async updateHoliday(id: number, updates: Partial<InsertHoliday>): Promise<Holiday | undefined> {
    const [holiday] = await db
      .update(holidays)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(holidays.id, id))
      .returning();
    return holiday;
  }

  async deleteHoliday(id: number): Promise<boolean> {
    const result = await db.delete(holidays).where(eq(holidays.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Resource Absences Management
  async getResourceAbsences(resourceId?: number, status?: string): Promise<ResourceAbsence[]> {
    let query = db
      .select({
        id: resourceAbsences.id,
        resourceId: resourceAbsences.resourceId,
        startDate: resourceAbsences.startDate,
        endDate: resourceAbsences.endDate,
        reason: resourceAbsences.reason,
        status: resourceAbsences.status,
        requestedBy: resourceAbsences.requestedBy,
        approvedBy: resourceAbsences.approvedBy,
        approvedAt: resourceAbsences.approvedAt,
        notes: resourceAbsences.notes,
        createdAt: resourceAbsences.createdAt,
        updatedAt: resourceAbsences.updatedAt,
        // Include resource name
        resourceName: resources.name
      })
      .from(resourceAbsences)
      .leftJoin(resources, eq(resourceAbsences.resourceId, resources.id));
    
    const conditions = [];
    if (resourceId) {
      conditions.push(eq(resourceAbsences.resourceId, resourceId));
    }
    if (status) {
      conditions.push(eq(resourceAbsences.status, status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(resourceAbsences.createdAt));
  }

  async getAbsencesInDateRange(startDate: Date, endDate: Date, resourceId?: number): Promise<ResourceAbsence[]> {
    let query = db
      .select({
        id: resourceAbsences.id,
        resourceId: resourceAbsences.resourceId,
        startDate: resourceAbsences.startDate,
        endDate: resourceAbsences.endDate,
        reason: resourceAbsences.reason,
        status: resourceAbsences.status,
        requestedBy: resourceAbsences.requestedBy,
        approvedBy: resourceAbsences.approvedBy,
        approvedAt: resourceAbsences.approvedAt,
        notes: resourceAbsences.notes,
        createdAt: resourceAbsences.createdAt,
        updatedAt: resourceAbsences.updatedAt,
        resourceName: resources.name
      })
      .from(resourceAbsences)
      .leftJoin(resources, eq(resourceAbsences.resourceId, resources.id))
      .where(
        and(
          lte(resourceAbsences.startDate, endDate),
          gte(resourceAbsences.endDate, startDate)
        )
      );
    
    if (resourceId) {
      query = query.where(
        and(
          lte(resourceAbsences.startDate, endDate),
          gte(resourceAbsences.endDate, startDate),
          eq(resourceAbsences.resourceId, resourceId)
        )
      );
    }
    
    return await query.orderBy(asc(resourceAbsences.startDate));
  }

  async createResourceAbsence(absenceData: InsertResourceAbsence): Promise<ResourceAbsence> {
    const [absence] = await db
      .insert(resourceAbsences)
      .values(absenceData)
      .returning();
    return absence;
  }

  async approveResourceAbsence(id: number, approvedBy: number): Promise<ResourceAbsence | undefined> {
    const [absence] = await db
      .update(resourceAbsences)
      .set({
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(resourceAbsences.id, id))
      .returning();
    return absence;
  }

  async denyResourceAbsence(id: number, approvedBy: number, reason?: string): Promise<ResourceAbsence | undefined> {
    const [absence] = await db
      .update(resourceAbsences)
      .set({
        status: 'denied',
        approvedBy,
        approvedAt: new Date(),
        notes: reason,
        updatedAt: new Date()
      })
      .where(eq(resourceAbsences.id, id))
      .returning();
    return absence;
  }

  // Shift Scenarios for Capacity Planning
  async getShiftScenarios(capacityScenarioId?: number): Promise<ShiftScenario[]> {
    let query = db.select().from(shiftScenarios);
    
    if (capacityScenarioId) {
      query = query.where(eq(shiftScenarios.capacityScenarioId, capacityScenarioId));
    }
    
    return await query.orderBy(desc(shiftScenarios.createdAt));
  }

  async createShiftScenario(scenarioData: InsertShiftScenario): Promise<ShiftScenario> {
    const [scenario] = await db
      .insert(shiftScenarios)
      .values(scenarioData)
      .returning();
    return scenario;
  }

  async runShiftScenarioSimulation(id: number): Promise<ShiftScenario | undefined> {
    // Simple simulation - in a real system this would be much more complex
    const simulationResults = {
      totalCapacity: Math.floor(Math.random() * 1000) + 500,
      utilizationRate: Math.floor(Math.random() * 40) + 60, // 60-100%
      bottlenecks: ['Station A', 'Quality Control'],
      recommendations: ['Add weekend shift', 'Cross-train operators']
    };
    
    const [scenario] = await db
      .update(shiftScenarios)
      .set({
        status: 'completed',
        results: simulationResults,
        updatedAt: new Date()
      })
      .where(eq(shiftScenarios.id, id))
      .returning();
    
    return scenario;
  }

  // Shift Utilization and Analytics
  async getShiftUtilization(shiftTemplateId?: number, dateRange?: { start: Date; end: Date }): Promise<any[]> {
    // This would normally calculate actual utilization from production data
    // For now, return sample data structure
    return [
      {
        shiftTemplateId: shiftTemplateId || 1,
        date: new Date().toISOString().split('T')[0],
        plannedHours: 8,
        actualHours: 7.5,
        utilizationRate: 93.75,
        efficiency: 89.2,
        resourceCount: 5
      }
    ];
  }

  async getShiftUtilizationSummary(plantId?: number, dateRange?: { start: Date; end: Date }): Promise<any> {
    // This would normally aggregate utilization data across all shifts
    // For now, return sample summary data
    return {
      totalPlannedHours: 320,
      totalActualHours: 298,
      averageUtilization: 93.1,
      averageEfficiency: 87.8,
      activeShifts: 4,
      totalResources: 20,
      period: dateRange ? `${dateRange.start.toDateString()} to ${dateRange.end.toDateString()}` : 'Current week'
    };
  }

  // Unplanned Downtime Management
  async getUnplannedDowntime(resourceId?: number, status?: string, plantId?: number): Promise<UnplannedDowntime[]> {
    let query = db
      .select({
        id: unplannedDowntime.id,
        resourceId: unplannedDowntime.resourceId,
        downtimeType: unplannedDowntime.downtimeType,
        severity: unplannedDowntime.severity,
        status: unplannedDowntime.status,
        title: unplannedDowntime.title,
        description: unplannedDowntime.description,
        startTime: unplannedDowntime.startTime,
        estimatedEndTime: unplannedDowntime.estimatedEndTime,
        actualEndTime: unplannedDowntime.actualEndTime,
        reportedBy: unplannedDowntime.reportedBy,
        assignedTo: unplannedDowntime.assignedTo,
        estimatedCost: unplannedDowntime.estimatedCost,
        actualCost: unplannedDowntime.actualCost,
        impactedOperations: unplannedDowntime.impactedOperations,
        rootCause: unplannedDowntime.rootCause,
        resolution: unplannedDowntime.resolution,
        preventiveMeasures: unplannedDowntime.preventiveMeasures,
        partsRequired: unplannedDowntime.partsRequired,
        laborHours: unplannedDowntime.laborHours,
        downtimeMinutes: unplannedDowntime.downtimeMinutes,
        isRecurring: unplannedDowntime.isRecurring,
        lastOccurrence: unplannedDowntime.lastOccurrence,
        priority: unplannedDowntime.priority,
        plantId: unplannedDowntime.plantId,
        createdAt: unplannedDowntime.createdAt,
        updatedAt: unplannedDowntime.updatedAt,
        // Include resource and user names
        resourceName: resources.name,
        reportedByName: sql<string>`reported_user.first_name || ' ' || reported_user.last_name`,
        assignedToName: sql<string>`assigned_user.first_name || ' ' || assigned_user.last_name`
      })
      .from(unplannedDowntime)
      .leftJoin(resources, eq(unplannedDowntime.resourceId, resources.id))
      .leftJoin(users.as('reported_user'), eq(unplannedDowntime.reportedBy, users.id))
      .leftJoin(users.as('assigned_user'), eq(unplannedDowntime.assignedTo, users.id));
    
    const conditions = [];
    if (resourceId) conditions.push(eq(unplannedDowntime.resourceId, resourceId));
    if (status) conditions.push(eq(unplannedDowntime.status, status));
    if (plantId) conditions.push(eq(unplannedDowntime.plantId, plantId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(unplannedDowntime.createdAt));
  }

  async createUnplannedDowntime(downtimeData: InsertUnplannedDowntime): Promise<UnplannedDowntime> {
    const [downtime] = await db
      .insert(unplannedDowntime)
      .values(downtimeData)
      .returning();
    return downtime;
  }

  async updateUnplannedDowntime(id: number, updates: Partial<InsertUnplannedDowntime>): Promise<UnplannedDowntime | undefined> {
    const [downtime] = await db
      .update(unplannedDowntime)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(unplannedDowntime.id, id))
      .returning();
    return downtime;
  }

  async deleteUnplannedDowntime(id: number): Promise<boolean> {
    const result = await db.delete(unplannedDowntime).where(eq(unplannedDowntime.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Overtime Shift Management
  async getOvertimeShifts(resourceId?: number, status?: string, plantId?: number): Promise<OvertimeShift[]> {
    let query = db
      .select({
        id: overtimeShifts.id,
        resourceId: overtimeShifts.resourceId,
        shiftTemplateId: overtimeShifts.shiftTemplateId,
        overtimeType: overtimeShifts.overtimeType,
        reason: overtimeShifts.reason,
        status: overtimeShifts.status,
        startTime: overtimeShifts.startTime,
        endTime: overtimeShifts.endTime,
        actualStartTime: overtimeShifts.actualStartTime,
        actualEndTime: overtimeShifts.actualEndTime,
        approvedBy: overtimeShifts.approvedBy,
        requestedBy: overtimeShifts.requestedBy,
        hourlyRate: overtimeShifts.hourlyRate,
        premiumMultiplier: overtimeShifts.premiumMultiplier,
        estimatedCost: overtimeShifts.estimatedCost,
        actualCost: overtimeShifts.actualCost,
        assignedOperations: overtimeShifts.assignedOperations,
        coveringFor: overtimeShifts.coveringFor,
        downtimeId: overtimeShifts.downtimeId,
        notes: overtimeShifts.notes,
        isEmergency: overtimeShifts.isEmergency,
        autoApproved: overtimeShifts.autoApproved,
        plantId: overtimeShifts.plantId,
        createdAt: overtimeShifts.createdAt,
        updatedAt: overtimeShifts.updatedAt,
        // Include resource and user names
        resourceName: resources.name,
        shiftTemplateName: shiftTemplates.name,
        requestedByName: sql<string>`requested_user.first_name || ' ' || requested_user.last_name`,
        approvedByName: sql<string>`approved_user.first_name || ' ' || approved_user.last_name`
      })
      .from(overtimeShifts)
      .leftJoin(resources, eq(overtimeShifts.resourceId, resources.id))
      .leftJoin(shiftTemplates, eq(overtimeShifts.shiftTemplateId, shiftTemplates.id))
      .leftJoin(users.as('requested_user'), eq(overtimeShifts.requestedBy, users.id))
      .leftJoin(users.as('approved_user'), eq(overtimeShifts.approvedBy, users.id));
    
    const conditions = [];
    if (resourceId) conditions.push(eq(overtimeShifts.resourceId, resourceId));
    if (status) conditions.push(eq(overtimeShifts.status, status));
    if (plantId) conditions.push(eq(overtimeShifts.plantId, plantId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(overtimeShifts.createdAt));
  }

  async createOvertimeShift(overtimeData: InsertOvertimeShift): Promise<OvertimeShift> {
    const [overtime] = await db
      .insert(overtimeShifts)
      .values(overtimeData)
      .returning();
    return overtime;
  }

  async updateOvertimeShift(id: number, updates: Partial<InsertOvertimeShift>): Promise<OvertimeShift | undefined> {
    const [overtime] = await db
      .update(overtimeShifts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(overtimeShifts.id, id))
      .returning();
    return overtime;
  }

  async deleteOvertimeShift(id: number): Promise<boolean> {
    const result = await db.delete(overtimeShifts).where(eq(overtimeShifts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Downtime Actions Management
  async getDowntimeActions(downtimeId?: number, assignedTo?: number): Promise<DowntimeAction[]> {
    let query = db
      .select({
        id: downtimeActions.id,
        downtimeId: downtimeActions.downtimeId,
        actionType: downtimeActions.actionType,
        actionTitle: downtimeActions.actionTitle,
        description: downtimeActions.description,
        assignedTo: downtimeActions.assignedTo,
        status: downtimeActions.status,
        priority: downtimeActions.priority,
        estimatedDuration: downtimeActions.estimatedDuration,
        actualDuration: downtimeActions.actualDuration,
        dueDate: downtimeActions.dueDate,
        startedAt: downtimeActions.startedAt,
        completedAt: downtimeActions.completedAt,
        notes: downtimeActions.notes,
        skillsRequired: downtimeActions.skillsRequired,
        toolsRequired: downtimeActions.toolsRequired,
        cost: downtimeActions.cost,
        createdAt: downtimeActions.createdAt,
        updatedAt: downtimeActions.updatedAt,
        // Include user name
        assignedToName: sql<string>`users.first_name || ' ' || users.last_name`
      })
      .from(downtimeActions)
      .leftJoin(users, eq(downtimeActions.assignedTo, users.id));
    
    const conditions = [];
    if (downtimeId) conditions.push(eq(downtimeActions.downtimeId, downtimeId));
    if (assignedTo) conditions.push(eq(downtimeActions.assignedTo, assignedTo));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(asc(downtimeActions.dueDate));
  }

  async createDowntimeAction(actionData: InsertDowntimeAction): Promise<DowntimeAction> {
    const [action] = await db
      .insert(downtimeActions)
      .values(actionData)
      .returning();
    return action;
  }

  async updateDowntimeAction(id: number, updates: Partial<InsertDowntimeAction>): Promise<DowntimeAction | undefined> {
    const [action] = await db
      .update(downtimeActions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(downtimeActions.id, id))
      .returning();
    return action;
  }

  async deleteDowntimeAction(id: number): Promise<boolean> {
    const result = await db.delete(downtimeActions).where(eq(downtimeActions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Shift Change Requests Management
  async getShiftChangeRequests(status?: string, urgency?: string, plantId?: number): Promise<ShiftChangeRequest[]> {
    let query = db
      .select({
        id: shiftChangeRequests.id,
        originalResourceId: shiftChangeRequests.originalResourceId,
        replacementResourceId: shiftChangeRequests.replacementResourceId,
        shiftDate: shiftChangeRequests.shiftDate,
        shiftTemplateId: shiftChangeRequests.shiftTemplateId,
        requestType: shiftChangeRequests.requestType,
        reason: shiftChangeRequests.reason,
        status: shiftChangeRequests.status,
        urgency: shiftChangeRequests.urgency,
        requestedBy: shiftChangeRequests.requestedBy,
        approvedBy: shiftChangeRequests.approvedBy,
        downtimeId: shiftChangeRequests.downtimeId,
        estimatedCoverage: shiftChangeRequests.estimatedCoverage,
        skillsRequired: shiftChangeRequests.skillsRequired,
        notes: shiftChangeRequests.notes,
        plantId: shiftChangeRequests.plantId,
        createdAt: shiftChangeRequests.createdAt,
        updatedAt: shiftChangeRequests.updatedAt,
        // Include resource and user names
        originalResourceName: sql<string>`original_resource.name`,
        replacementResourceName: sql<string>`replacement_resource.name`,
        shiftTemplateName: shiftTemplates.name,
        requestedByName: sql<string>`requested_user.first_name || ' ' || requested_user.last_name`,
        approvedByName: sql<string>`approved_user.first_name || ' ' || approved_user.last_name`
      })
      .from(shiftChangeRequests)
      .leftJoin(resources.as('original_resource'), eq(shiftChangeRequests.originalResourceId, resources.id))
      .leftJoin(resources.as('replacement_resource'), eq(shiftChangeRequests.replacementResourceId, resources.id))
      .leftJoin(shiftTemplates, eq(shiftChangeRequests.shiftTemplateId, shiftTemplates.id))
      .leftJoin(users.as('requested_user'), eq(shiftChangeRequests.requestedBy, users.id))
      .leftJoin(users.as('approved_user'), eq(shiftChangeRequests.approvedBy, users.id));
    
    const conditions = [];
    if (status) conditions.push(eq(shiftChangeRequests.status, status));
    if (urgency) conditions.push(eq(shiftChangeRequests.urgency, urgency));
    if (plantId) conditions.push(eq(shiftChangeRequests.plantId, plantId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(shiftChangeRequests.createdAt));
  }

  async createShiftChangeRequest(requestData: InsertShiftChangeRequest): Promise<ShiftChangeRequest> {
    const [request] = await db
      .insert(shiftChangeRequests)
      .values(requestData)
      .returning();
    return request;
  }

  async updateShiftChangeRequest(id: number, updates: Partial<InsertShiftChangeRequest>): Promise<ShiftChangeRequest | undefined> {
    const [request] = await db
      .update(shiftChangeRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(shiftChangeRequests.id, id))
      .returning();
    return request;
  }

  async deleteShiftChangeRequest(id: number): Promise<boolean> {
    const result = await db.delete(shiftChangeRequests).where(eq(shiftChangeRequests.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Unplanned Downtime Management
  async getUnplannedDowntime(resourceId?: number, status?: string): Promise<UnplannedDowntime[]> {
    let query = db.select().from(unplannedDowntime);
    
    if (resourceId) {
      query = query.where(eq(unplannedDowntime.resourceId, resourceId));
    }
    
    if (status) {
      query = query.where(eq(unplannedDowntime.status, status));
    }
    
    return await query.orderBy(desc(unplannedDowntime.startTime));
  }

  async createUnplannedDowntime(downtimeData: InsertUnplannedDowntime): Promise<UnplannedDowntime> {
    const [downtime] = await db
      .insert(unplannedDowntime)
      .values(downtimeData)
      .returning();
    return downtime;
  }

  async updateUnplannedDowntime(id: number, updates: Partial<InsertUnplannedDowntime>): Promise<UnplannedDowntime | undefined> {
    const [downtime] = await db
      .update(unplannedDowntime)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(unplannedDowntime.id, id))
      .returning();
    return downtime;
  }

  async deleteUnplannedDowntime(id: number): Promise<boolean> {
    const result = await db.delete(unplannedDowntime).where(eq(unplannedDowntime.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Overtime Shifts Management
  async getOvertimeShifts(resourceId?: number, status?: string): Promise<OvertimeShift[]> {
    let query = db.select().from(overtimeShifts);
    
    if (resourceId) {
      query = query.where(eq(overtimeShifts.resourceId, resourceId));
    }
    
    if (status) {
      query = query.where(eq(overtimeShifts.status, status));
    }
    
    return await query.orderBy(desc(overtimeShifts.startTime));
  }

  async createOvertimeShift(overtimeData: InsertOvertimeShift): Promise<OvertimeShift> {
    const [overtime] = await db
      .insert(overtimeShifts)
      .values(overtimeData)
      .returning();
    return overtime;
  }

  async updateOvertimeShift(id: number, updates: Partial<InsertOvertimeShift>): Promise<OvertimeShift | undefined> {
    const [overtime] = await db
      .update(overtimeShifts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(overtimeShifts.id, id))
      .returning();
    return overtime;
  }

  async deleteOvertimeShift(id: number): Promise<boolean> {
    const result = await db.delete(overtimeShifts).where(eq(overtimeShifts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Downtime Actions Management
  async getDowntimeActions(downtimeId?: number): Promise<DowntimeAction[]> {
    let query = db.select().from(downtimeActions);
    
    if (downtimeId) {
      query = query.where(eq(downtimeActions.downtimeId, downtimeId));
    }
    
    return await query.orderBy(desc(downtimeActions.createdAt));
  }

  async createDowntimeAction(actionData: InsertDowntimeAction): Promise<DowntimeAction> {
    const [action] = await db
      .insert(downtimeActions)
      .values(actionData)
      .returning();
    return action;
  }

  async updateDowntimeAction(id: number, updates: Partial<InsertDowntimeAction>): Promise<DowntimeAction | undefined> {
    const [action] = await db
      .update(downtimeActions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(downtimeActions.id, id))
      .returning();
    return action;
  }

  // Data Validation Methods
  async runDataValidation(): Promise<any> {
    const startTime = Date.now();
    const issues: any[] = [];

    try {
      // 1. Check operations with missing required capabilities
      try {
        const operationsIssues = await this.validateOperationsCapabilities();
        issues.push(...operationsIssues);
      } catch (error) {
        console.error('Operations validation error:', error);
      }

      // 2. Check resources without active capabilities  
      try {
        const resourcesIssues = await this.validateResourcesCapabilities();
        issues.push(...resourcesIssues);
      } catch (error) {
        console.error('Resources validation error:', error);
      }

      // 3. Check production orders with invalid references
      try {
        const productionOrderIssues = await this.validateProductionOrders();
        issues.push(...productionOrderIssues);
      } catch (error) {
        console.error('Production orders validation error:', error);
      }

      // 4. Check data integrity and consistency
      try {
        const integrityIssues = await this.validateDataIntegrity();
        issues.push(...integrityIssues);
      } catch (error) {
        console.error('Data integrity validation error:', error);
      }

      // 5. Check relationship validation between entities
      try {
        const relationshipIssues = await this.validateRelationships();
        issues.push(...relationshipIssues);
      } catch (error) {
        console.error('Relationships validation error:', error);
      }

      // 6. Check scheduling and timeline conflicts
      try {
        const schedulingIssues = await this.validateSchedulingConflicts();
        issues.push(...schedulingIssues);
      } catch (error) {
        console.error('Scheduling validation error:', error);
      }

      // 7. Check active resources have shift assignments with working hours
      try {
        const shiftAssignmentIssues = await this.validateResourceShiftAssignments();
        issues.push(...shiftAssignmentIssues);
      } catch (error) {
        console.error('Resource shift assignment validation error:', error);
      }

      const executionTime = Date.now() - startTime;
      
      // Calculate summary statistics
      const criticalIssues = issues.filter(i => i.severity === 'critical').length;
      const warnings = issues.filter(i => i.severity === 'warning').length;
      const infoItems = issues.filter(i => i.severity === 'info').length;
      
      // Calculate data integrity score (100 - penalty for issues)
      let dataIntegrityScore = 90; // Default fallback score
      try {
        const totalRecords = await this.getTotalRecordsCount();
        const totalAffected = issues.reduce((sum, issue) => sum + (issue.affectedRecords || 0), 0);
        
        if (totalRecords > 0) {
          dataIntegrityScore = Math.max(0, Math.min(100, 
            100 - (criticalIssues * 10) - (warnings * 3) - (infoItems * 1) - Math.floor((totalAffected / totalRecords) * 20)
          ));
        } else {
          dataIntegrityScore = Math.max(0, Math.min(100, 
            100 - (criticalIssues * 10) - (warnings * 3) - (infoItems * 1)
          ));
        }
      } catch (error) {
        console.error('Error calculating data integrity score:', error);
        // Calculate score without record ratio if total count fails
        dataIntegrityScore = Math.max(0, Math.min(100, 
          100 - (criticalIssues * 10) - (warnings * 3) - (infoItems * 1)
        ));
      }

      return {
        summary: {
          totalChecks: 7,
          criticalIssues,
          warnings,
          infoItems,
          dataIntegrityScore
        },
        issues,
        executionTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Data validation error:', error);
      throw new Error('Failed to run data validation');
    }
  }

  private async validateOperationsCapabilities(): Promise<any[]> {
    const issues: any[] = [];
    
    // Get all capabilities for reference
    const allCapabilities = await db.select({
      id: capabilities.id,
      name: capabilities.name
    }).from(ptCapabilities);
    
    const capabilityMap = new Map(allCapabilities.map(cap => [cap.id, cap.name]));
    
    // Get all operations that require capabilities
    const operationsWithCapabilities = await db
      .select({
        id: operations.id,
        name: operations.name,
        productionOrderId: operations.productionOrderId,
        requiredCapabilities: operations.requiredCapabilities,
        status: operations.status
      })
      .from(operations)
      .where(sql`jsonb_array_length(${operations.requiredCapabilities}) > 0`);

    // Get production order info for context
    const productionOrders = await db.select({
      id: productionOrders.id,
      name: productionOrders.name,
      orderNumber: productionOrders.orderNumber
    }).from(productionOrders);
    
    const productionOrderMap = new Map(productionOrders.map(po => [po.id, po]));

    // Get all active resources with their capabilities
    const activeResourcesWithCapabilities = await db
      .select({
        id: resources.id,
        name: resources.name,
        type: resources.type,
        capabilities: resources.capabilities
      })
      .from(ptResources)
      .where(eq(ptResources.status, 'active'));

    for (const operation of operationsWithCapabilities) {
      if (!operation.requiredCapabilities || operation.requiredCapabilities.length === 0) continue;

      // Find resources that have ALL required capabilities
      const suitableResources = activeResourcesWithCapabilities.filter(resource => {
        if (!resource.capabilities || resource.capabilities.length === 0) return false;
        return operation.requiredCapabilities.every(reqCap => 
          resource.capabilities.includes(reqCap)
        );
      });

      if (suitableResources.length === 0) {
        // Get capability names for better readability
        const requiredCapabilityNames = operation.requiredCapabilities
          .map(capId => capabilityMap.get(capId) || `Unknown (${capId})`)
          .join(', ');

        // Get production order context
        const productionOrder = productionOrderMap.get(operation.productionOrderId);
        const operationContext = productionOrder 
          ? `${productionOrder.name} (${productionOrder.orderNumber})`
          : `Production Order ${operation.productionOrderId}`;

        // Find which specific capabilities are missing from all resources
        const missingCapabilities = operation.requiredCapabilities.filter(reqCap => {
          return !activeResourcesWithCapabilities.some(resource => 
            resource.capabilities && resource.capabilities.includes(reqCap)
          );
        });

        const partiallyAvailableCapabilities = operation.requiredCapabilities.filter(reqCap => {
          return activeResourcesWithCapabilities.some(resource => 
            resource.capabilities && resource.capabilities.includes(reqCap)
          ) && !suitableResources.some(resource => 
            resource.capabilities && resource.capabilities.includes(reqCap)
          );
        });

        let detailedDescription = `Operation requires capabilities that no active resources possess, preventing scheduling and execution.`;
        
        if (missingCapabilities.length > 0) {
          const missingCapNames = missingCapabilities
            .map(capId => capabilityMap.get(capId) || `Unknown (${capId})`)
            .join(', ');
          detailedDescription += ` Missing capabilities: ${missingCapNames}.`;
        }

        if (partiallyAvailableCapabilities.length > 0) {
          const partialCapNames = partiallyAvailableCapabilities
            .map(capId => capabilityMap.get(capId) || `Unknown (${capId})`)
            .join(', ');
          detailedDescription += ` Some capabilities exist but no single resource has all requirements: ${partialCapNames}.`;
        }

        issues.push({
          id: `operation-capabilities-${operation.id}`,
          severity: 'critical',
          category: 'Scheduling',
          title: `Operation "${operation.name}" cannot be scheduled - no suitable resources`,
          description: detailedDescription,
          affectedRecords: 1,
          details: [{
            name: operation.name,
            description: `From ${operationContext} | Required: ${requiredCapabilityNames} | Status: ${operation.status || 'planned'}`
          }],
          recommendation: missingCapabilities.length > 0 
            ? `Add active resources with missing capabilities: ${missingCapabilities.map(capId => capabilityMap.get(capId)).join(', ')}.`
            : 'Ensure at least one active resource has all required capabilities, or split operation into multiple steps.'
        });
      }
    }

    return issues;
  }

  private async validateResourcesCapabilities(): Promise<any[]> {
    const issues: any[] = [];

    // Get all active resources without capabilities
    const resourcesWithoutCapabilities = await db
      .select({
        id: resources.id,
        name: resources.name,
        type: resources.type,
        capabilities: resources.capabilities
      })
      .from(ptResources)
      .where(and(
        eq(ptResources.status, 'active'),
        or(
          sql`${resources.capabilities} IS NULL`,
          sql`jsonb_array_length(${resources.capabilities}) = 0`
        )
      ));

    if (resourcesWithoutCapabilities.length > 0) {
      issues.push({
        id: 'resources-no-capabilities',
        severity: 'warning',
        category: 'Resources',
        title: `${resourcesWithoutCapabilities.length} active resources have no capabilities`,
        description: 'Resources without capabilities cannot be assigned to operations that require specific skills.',
        affectedRecords: resourcesWithoutCapabilities.length,
        details: resourcesWithoutCapabilities.map(resource => ({
          name: resource.name,
          description: `Type: ${resource.type}`
        })),
        recommendation: 'Assign appropriate capabilities to these resources or set them to inactive if not needed.'
      });
    }

    return issues;
  }

  private async validateProductionOrders(): Promise<any[]> {
    const issues: any[] = [];

    // Check production orders with invalid plant references
    const ordersWithInvalidPlants = await db
      .select({
        id: productionOrders.id,
        orderNumber: productionOrders.orderNumber,
        name: productionOrders.name,
        plantId: productionOrders.plantId
      })
      .from(productionOrders)
      .leftJoin(plants, eq(productionOrders.plantId, plants.id))
      .where(isNull(plants.id));

    if (ordersWithInvalidPlants.length > 0) {
      issues.push({
        id: 'production-orders-invalid-plants',
        severity: 'critical',
        category: 'Production Orders',
        title: `${ordersWithInvalidPlants.length} production orders reference invalid plants`,
        description: 'Production orders cannot be executed without valid plant references.',
        affectedRecords: ordersWithInvalidPlants.length,
        details: ordersWithInvalidPlants.map(order => ({
          name: `${order.orderNumber} - ${order.name}`,
          description: `Invalid plant ID: ${order.plantId}`
        })),
        recommendation: 'Update production orders to reference valid plants or create the missing plants.'
      });
    }

    // Check production orders without operations
    const ordersWithoutOperations = await db
      .select({
        id: productionOrders.id,
        orderNumber: productionOrders.orderNumber,
        name: productionOrders.name
      })
      .from(productionOrders)
      .leftJoin(operations, eq(productionOrders.id, operations.productionOrderId))
      .where(isNull(operations.id))
      .groupBy(productionOrders.id, productionOrders.orderNumber, productionOrders.name);

    if (ordersWithoutOperations.length > 0) {
      issues.push({
        id: 'production-orders-no-operations',
        severity: 'warning',
        category: 'Production Orders',
        title: `${ordersWithoutOperations.length} production orders have no operations`,
        description: 'Production orders without operations cannot be scheduled or executed.',
        affectedRecords: ordersWithoutOperations.length,
        details: ordersWithoutOperations.map(order => ({
          name: `${order.orderNumber} - ${order.name}`,
          description: 'No operations defined for this order'
        })),
        recommendation: 'Add operations to these production orders or mark them as cancelled if not needed.'
      });
    }

    return issues;
  }

  private async validateDataIntegrity(): Promise<any[]> {
    const issues: any[] = [];

    // Check for duplicate resource names within same plant
    const duplicateResources = await db
      .select({
        name: resources.name,
        plantId: resources.plantId,
        count: sql<number>`count(*)`.as('count')
      })
      .from(ptResources)
      .where(eq(ptResources.status, 'active'))
      .groupBy(resources.name, resources.plantId)
      .having(sql`count(*) > 1`);

    if (duplicateResources.length > 0) {
      issues.push({
        id: 'duplicate-resource-names',
        severity: 'warning',
        category: 'Data Integrity',
        title: `${duplicateResources.length} resource names are duplicated within plants`,
        description: 'Duplicate resource names can cause confusion in scheduling and reporting.',
        affectedRecords: duplicateResources.reduce((sum, item) => sum + item.count, 0),
        details: duplicateResources.map(item => ({
          name: item.name,
          description: `${item.count} resources with same name in plant ${item.plantId}`
        })),
        recommendation: 'Rename duplicate resources to have unique names within each plant.'
      });
    }

    // Check for operations with invalid capability references
    const operationsWithInvalidCapabilities = await db
      .select({
        id: operations.id,
        name: operations.name,
        requiredCapabilities: operations.requiredCapabilities
      })
      .from(operations)
      .where(sql`jsonb_array_length(${operations.requiredCapabilities}) > 0`);

    const allCapabilities = await db.select({ id: capabilities.id }).from(ptCapabilities);
    const validCapabilityIds = new Set(allCapabilities.map(c => c.id));

    const invalidCapabilityOperations = operationsWithInvalidCapabilities.filter(op => {
      if (!op.requiredCapabilities) return false;
      return op.requiredCapabilities.some(capId => !validCapabilityIds.has(capId));
    });

    if (invalidCapabilityOperations.length > 0) {
      issues.push({
        id: 'operations-invalid-capabilities',
        severity: 'critical',
        category: 'Data Integrity',
        title: `${invalidCapabilityOperations.length} operations reference invalid capabilities`,
        description: 'Operations cannot be scheduled with invalid capability references.',
        affectedRecords: invalidCapabilityOperations.length,
        details: invalidCapabilityOperations.map(op => ({
          name: op.name,
          description: 'Contains references to non-existent capabilities'
        })),
        recommendation: 'Remove invalid capability references or create the missing capabilities.'
      });
    }

    return issues;
  }

  private async validateRelationships(): Promise<any[]> {
    const issues: any[] = [];

    // Check for plants with no resources
    const plantsWithoutResources = await db
      .select({
        id: plants.id,
        name: plants.name
      })
      .from(ptPlants)
      .leftJoin(resources, eq(ptPlants.id, resources.plantId))
      .where(and(eq(ptPlants.isActive, true), isNull(resources.id)))
      .groupBy(plants.id, plants.name);

    if (plantsWithoutResources.length > 0) {
      issues.push({
        id: 'plants-no-resources',
        severity: 'info',
        category: 'Relationships',
        title: `${plantsWithoutResources.length} active plants have no resources`,
        description: 'Plants without resources cannot execute production orders.',
        affectedRecords: plantsWithoutResources.length,
        details: plantsWithoutResources.map(plant => ({
          name: plant.name,
          description: 'No resources assigned to this plant'
        })),
        recommendation: 'Add resources to these plants or set them as inactive if not operational.'
      });
    }

    return issues;
  }

  private async validateSchedulingConflicts(): Promise<any[]> {
    const issues: any[] = [];

    // Check for production orders with due dates in the past
    const overduePO = await db
      .select({
        id: productionOrders.id,
        orderNumber: productionOrders.orderNumber,
        name: productionOrders.name,
        dueDate: productionOrders.dueDate
      })
      .from(productionOrders)
      .where(and(
        lt(productionOrders.dueDate, new Date()),
        notInArray(productionOrders.status, ['completed', 'cancelled'])
      ));

    if (overduePO.length > 0) {
      issues.push({
        id: 'overdue-production-orders',
        severity: 'warning',
        category: 'Scheduling',
        title: `${overduePO.length} production orders are overdue`,
        description: 'Production orders with past due dates require immediate attention.',
        affectedRecords: overduePO.length,
        details: overduePO.map(order => ({
          name: `${order.orderNumber} - ${order.name}`,
          description: `Due: ${order.dueDate?.toISOString().split('T')[0]}`
        })),
        recommendation: 'Review and reschedule overdue production orders or update their status.'
      });
    }

    return issues;
  }

  private async validateResourceShiftAssignments(): Promise<any[]> {
    const issues: any[] = [];

    // Check for active resources without shift assignments
    const resourcesWithoutShifts = await db
      .select({
        id: resources.id,
        name: resources.name,
        plantId: resources.plantId,
        status: resources.status
      })
      .from(ptResources)
      .leftJoin(resourceShiftAssignments, eq(ptResources.id, resourceShiftAssignments.resourceId))
      .where(and(
        eq(ptResources.status, 'active'),
        isNull(resourceShiftAssignments.resourceId)
      ))
      .groupBy(resources.id, resources.name, resources.plantId, resources.status);

    if (resourcesWithoutShifts.length > 0) {
      issues.push({
        id: 'resources-no-shift-assignments',
        severity: 'critical',
        category: 'Shift Management',
        title: `${resourcesWithoutShifts.length} active resources have no shift assignments`,
        description: 'Active resources must have shift assignments with working hours to be scheduled for production.',
        affectedRecords: resourcesWithoutShifts.length,
        details: resourcesWithoutShifts.map(resource => ({
          name: resource.name,
          description: `Resource ID ${resource.id} in Plant ${resource.plantId} has no shift assignments`
        })),
        recommendation: 'Assign shift templates to these resources or change their status to inactive if not operational.'
      });
    }

    // Check for resources with shift assignments but no working hours
    const resourcesWithZeroHours = await db
      .select({
        resourceId: resourceShiftAssignments.resourceId,
        resourceName: resources.name,
        shiftTemplateName: shiftTemplates.name,
        startTime: shiftTemplates.startTime,
        endTime: shiftTemplates.endTime
      })
      .from(resourceShiftAssignments)
      .innerJoin(resources, eq(resourceShiftAssignments.resourceId, resources.id))
      .innerJoin(shiftTemplates, eq(resourceShiftAssignments.shiftTemplateId, shiftTemplates.id))
      .where(and(
        eq(ptResources.status, 'active'),
        or(
          isNull(shiftTemplates.startTime),
          isNull(shiftTemplates.endTime),
          eq(shiftTemplates.startTime, shiftTemplates.endTime)
        )
      ));

    if (resourcesWithZeroHours.length > 0) {
      issues.push({
        id: 'resources-zero-working-hours',
        severity: 'warning',
        category: 'Shift Management',
        title: `${resourcesWithZeroHours.length} active resources have shift assignments with no working hours`,
        description: 'Resources with zero working hours cannot be effectively scheduled for production tasks.',
        affectedRecords: resourcesWithZeroHours.length,
        details: resourcesWithZeroHours.map(resource => ({
          name: resource.resourceName,
          description: `Assigned to shift template "${resource.shiftTemplateName}" with ${resource.startTime || 'undefined'} - ${resource.endTime || 'undefined'} hours`
        })),
        recommendation: 'Update shift templates to include proper start and end times, or assign different shift templates with working hours.'
      });
    }

    return issues;
  }

  private async getTotalRecordsCount(): Promise<number> {
    const counts = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(ptPlants),
      db.select({ count: sql<number>`count(*)` }).from(ptResources),
      db.select({ count: sql<number>`count(*)` }).from(ptCapabilities),
      db.select({ count: sql<number>`count(*)` }).from(productionOrders),
      db.select({ count: sql<number>`count(*)` }).from(operations)
    ]);
    
    return counts.reduce((total, result) => total + result[0].count, 0);
  }

  // Production Scheduler's Cockpit Methods
  async getCockpitLayouts(userId: number): Promise<any[]> {
    return await db
      .select()
      .from(cockpitLayouts)
      .where(or(eq(cockpitLayouts.userId, userId), eq(cockpitLayouts.isShared, true)))
      .orderBy(desc(cockpitLayouts.isDefault), asc(cockpitLayouts.name));
  }

  async getCockpitLayout(id: number): Promise<any | undefined> {
    const [layout] = await db
      .select()
      .from(cockpitLayouts)
      .where(eq(cockpitLayouts.id, id));
    return layout || undefined;
  }

  async createCockpitLayout(layout: any): Promise<any> {
    const [newLayout] = await db
      .insert(cockpitLayouts)
      .values(layout)
      .returning();
    return newLayout;
  }

  async updateCockpitLayout(id: number, layout: any): Promise<any | undefined> {
    const [updatedLayout] = await db
      .update(cockpitLayouts)
      .set({ ...layout, updatedAt: new Date() })
      .where(eq(cockpitLayouts.id, id))
      .returning();
    return updatedLayout || undefined;
  }

  async deleteCockpitLayout(id: number): Promise<boolean> {
    const result = await db.delete(cockpitLayouts).where(eq(cockpitLayouts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getCockpitWidgets(layoutId: number): Promise<any[]> {
    return await db
      .select()
      .from(cockpitWidgets)
      .where(and(eq(cockpitWidgets.layoutId, layoutId), eq(cockpitWidgets.isVisible, true)))
      .orderBy(asc(cockpitWidgets.createdAt));
  }

  async createCockpitWidget(widget: any): Promise<any> {
    const [newWidget] = await db
      .insert(cockpitWidgets)
      .values(widget)
      .returning();
    return newWidget;
  }

  async updateCockpitWidget(id: number, widget: any): Promise<any | undefined> {
    const [updatedWidget] = await db
      .update(cockpitWidgets)
      .set({ ...widget, updatedAt: new Date() })
      .where(eq(cockpitWidgets.id, id))
      .returning();
    return updatedWidget || undefined;
  }

  async deleteCockpitWidget(id: number): Promise<boolean> {
    const result = await db.delete(cockpitWidgets).where(eq(cockpitWidgets.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getCockpitAlerts(widgetId?: number): Promise<any[]> {
    let query = db.select().from(cockpitAlerts);
    if (widgetId) {
      query = query.where(eq(cockpitAlerts.widgetId, widgetId));
    }
    return await query.orderBy(desc(cockpitAlerts.createdAt));
  }

  async createAnalyticsWidget(widget: any): Promise<any> {
    // For analytics widgets, we'll store them in canvas_widgets with a special type
    const canvasWidget = {
      ...widget,
      sessionId: 'analytics',
      type: widget.type || 'analytics',
      userId: widget.userId || 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.createCanvasWidget(canvasWidget);
  }

  async createDashboardWidget(widget: any): Promise<any> {
    // For dashboard widgets, we'll store them in canvas_widgets with a special type
    const canvasWidget = {
      ...widget,
      sessionId: 'dashboard',
      type: widget.type || 'dashboard',
      userId: widget.userId || 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.createCanvasWidget(canvasWidget);
  }

  async createCockpitAlert(alert: any): Promise<any> {
    const [newAlert] = await db
      .insert(cockpitAlerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async updateCockpitAlert(id: number, alert: any): Promise<any | undefined> {
    const [updatedAlert] = await db
      .update(cockpitAlerts)
      .set(alert)
      .where(eq(cockpitAlerts.id, id))
      .returning();
    return updatedAlert || undefined;
  }

  async getCockpitTemplates(): Promise<any[]> {
    return await db
      .select()
      .from(cockpitTemplates)
      .orderBy(desc(cockpitTemplates.isOfficial), desc(cockpitTemplates.usageCount), asc(cockpitTemplates.name));
  }

  async createCockpitTemplate(template: any): Promise<any> {
    const [newTemplate] = await db
      .insert(cockpitTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  // Product Development Implementation
  // Strategy Documents
  async getStrategyDocuments(category?: string): Promise<StrategyDocument[]> {
    let query = db.select().from(strategyDocuments);
    if (category) {
      query = query.where(eq(strategyDocuments.category, category));
    }
    return await query.orderBy(desc(strategyDocuments.updatedAt));
  }

  async getStrategyDocument(id: number): Promise<StrategyDocument | undefined> {
    const [document] = await db.select().from(strategyDocuments).where(eq(strategyDocuments.id, id));
    return document || undefined;
  }

  async createStrategyDocument(document: InsertStrategyDocument): Promise<StrategyDocument> {
    const [newDocument] = await db
      .insert(strategyDocuments)
      .values(document)
      .returning();
    return newDocument;
  }

  async updateStrategyDocument(id: number, document: Partial<InsertStrategyDocument>): Promise<StrategyDocument | undefined> {
    const [updatedDocument] = await db
      .update(strategyDocuments)
      .set({ ...document, updatedAt: new Date() })
      .where(eq(strategyDocuments.id, id))
      .returning();
    return updatedDocument || undefined;
  }

  async deleteStrategyDocument(id: number): Promise<boolean> {
    const result = await db.delete(strategyDocuments).where(eq(strategyDocuments.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Development Tasks
  async getDevelopmentTasks(status?: string, phase?: string): Promise<DevelopmentTask[]> {
    let query = db.select().from(developmentTasks);
    const conditions = [];
    if (status) conditions.push(eq(developmentTasks.status, status));
    if (phase) conditions.push(eq(developmentTasks.phase, phase));
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    return await query.orderBy(desc(developmentTasks.updatedAt));
  }

  async getDevelopmentTask(id: number): Promise<DevelopmentTask | undefined> {
    const [task] = await db.select().from(developmentTasks).where(eq(developmentTasks.id, id));
    return task || undefined;
  }

  async createDevelopmentTask(task: InsertDevelopmentTask): Promise<DevelopmentTask> {
    const [newTask] = await db
      .insert(developmentTasks)
      .values(task)
      .returning();
    return newTask;
  }

  async updateDevelopmentTask(id: number, task: Partial<InsertDevelopmentTask>): Promise<DevelopmentTask | undefined> {
    const [updatedTask] = await db
      .update(developmentTasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(developmentTasks.id, id))
      .returning();
    return updatedTask || undefined;
  }

  async deleteDevelopmentTask(id: number): Promise<boolean> {
    const result = await db.delete(developmentTasks).where(eq(developmentTasks.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Test Suites
  async getTestSuites(type?: string, status?: string): Promise<TestSuite[]> {
    let query = db.select().from(testSuites);
    const conditions = [];
    if (type) conditions.push(eq(testSuites.type, type));
    if (status) conditions.push(eq(testSuites.status, status));
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    return await query.orderBy(desc(testSuites.updatedAt));
  }

  async getTestSuite(id: number): Promise<TestSuite | undefined> {
    const [suite] = await db.select().from(testSuites).where(eq(testSuites.id, id));
    return suite || undefined;
  }

  async createTestSuite(suite: InsertTestSuite): Promise<TestSuite> {
    const [newSuite] = await db
      .insert(testSuites)
      .values(suite)
      .returning();
    return newSuite;
  }

  async updateTestSuite(id: number, suite: Partial<InsertTestSuite>): Promise<TestSuite | undefined> {
    const [updatedSuite] = await db
      .update(testSuites)
      .set({ ...suite, updatedAt: new Date() })
      .where(eq(testSuites.id, id))
      .returning();
    return updatedSuite || undefined;
  }

  async deleteTestSuite(id: number): Promise<boolean> {
    const result = await db.delete(testSuites).where(eq(testSuites.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Test Cases
  async getTestCases(suiteId?: number): Promise<TestCase[]> {
    let query = db.select().from(testCases);
    if (suiteId) {
      query = query.where(eq(testCases.suiteId, suiteId));
    }
    return await query.orderBy(asc(testCases.order), desc(testCases.createdAt));
  }

  async getTestCase(id: number): Promise<TestCase | undefined> {
    const [testCase] = await db.select().from(testCases).where(eq(testCases.id, id));
    return testCase || undefined;
  }

  async createTestCase(testCase: InsertTestCase): Promise<TestCase> {
    const [newTestCase] = await db
      .insert(testCases)
      .values(testCase)
      .returning();
    return newTestCase;
  }

  async updateTestCase(id: number, testCase: Partial<InsertTestCase>): Promise<TestCase | undefined> {
    const [updatedTestCase] = await db
      .update(testCases)
      .set(testCase)
      .where(eq(testCases.id, id))
      .returning();
    return updatedTestCase || undefined;
  }

  async deleteTestCase(id: number): Promise<boolean> {
    const result = await db.delete(testCases).where(eq(testCases.id, id));
    return (result.rowCount || 0) > 0;
  }

  async runTestCase(id: number): Promise<TestCase | undefined> {
    const [updatedTestCase] = await db
      .update(testCases)
      .set({ 
        status: 'passed',
        lastRun: new Date(),
        executionTime: Math.floor(Math.random() * 5000) + 100 // Simulate execution time
      })
      .where(eq(testCases.id, id))
      .returning();
    return updatedTestCase || undefined;
  }

  // Architecture Components
  async getArchitectureComponents(): Promise<ArchitectureComponent[]> {
    return await db.select().from(architectureComponents).orderBy(asc(architectureComponents.name));
  }

  async getArchitectureComponent(id: number): Promise<ArchitectureComponent | undefined> {
    const [component] = await db.select().from(architectureComponents).where(eq(architectureComponents.id, id));
    return component || undefined;
  }

  async createArchitectureComponent(component: InsertArchitectureComponent): Promise<ArchitectureComponent> {
    const [newComponent] = await db
      .insert(architectureComponents)
      .values(component)
      .returning();
    return newComponent;
  }

  async updateArchitectureComponent(id: number, component: Partial<InsertArchitectureComponent>): Promise<ArchitectureComponent | undefined> {
    const [updatedComponent] = await db
      .update(architectureComponents)
      .set({ ...component, updatedAt: new Date() })
      .where(eq(architectureComponents.id, id))
      .returning();
    return updatedComponent || undefined;
  }

  async deleteArchitectureComponent(id: number): Promise<boolean> {
    const result = await db.delete(architectureComponents).where(eq(architectureComponents.id, id));
    return (result.rowCount || 0) > 0;
  }

  // =================== API INTEGRATIONS ===================

  async createApiIntegration(integration: InsertApiIntegration): Promise<ApiIntegration> {
    try {
      const [result] = await db.insert(apiIntegrations).values(integration).returning();
      return result;
    } catch (error) {
      console.error('Error creating API integration:', error);
      throw error;
    }
  }

  async getApiIntegrations(): Promise<ApiIntegration[]> {
    try {
      return await db.select().from(apiIntegrations).orderBy(apiIntegrations.name);
    } catch (error) {
      console.error('Error getting API integrations:', error);
      throw error;
    }
  }

  async getApiIntegration(id: number): Promise<ApiIntegration | undefined> {
    try {
      const [result] = await db.select().from(apiIntegrations).where(eq(apiIntegrations.id, id));
      return result;
    } catch (error) {
      console.error('Error getting API integration:', error);
      throw error;
    }
  }

  async updateApiIntegration(id: number, updates: Partial<ApiIntegration>): Promise<ApiIntegration> {
    try {
      const [result] = await db
        .update(apiIntegrations)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(apiIntegrations.id, id))
        .returning();
      
      if (!result) {
        throw new Error(`API integration with id ${id} not found`);
      }
      
      return result;
    } catch (error) {
      console.error('Error updating API integration:', error);
      throw error;
    }
  }

  async deleteApiIntegration(id: number): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        // Delete related data first
        await tx.delete(apiMappings).where(eq(apiMappings.integrationId, id));
        await tx.delete(apiTests).where(eq(apiTests.integrationId, id));
        await tx.delete(apiAuditLogs).where(eq(apiAuditLogs.integrationId, id));
        await tx.delete(apiCredentials).where(eq(apiCredentials.integrationId, id));
        
        // Delete the integration
        await tx.delete(apiIntegrations).where(eq(apiIntegrations.id, id));
      });
    } catch (error) {
      console.error('Error deleting API integration:', error);
      throw error;
    }
  }

  async generateApiIntegrationWithAI(prompt: string, systemType: string, provider: string, userId: number): Promise<ApiIntegration> {
    try {
      const baseConfig = {
        name: `AI Generated ${provider} ${systemType.toUpperCase()} Integration`,
        description: `AI-generated integration for ${provider} ${systemType} system based on: ${prompt}`,
        systemType,
        provider,
        status: 'inactive' as const,
        healthStatus: 'unknown' as const,
        isAiGenerated: true,
        endpoint: `https://api.${provider.toLowerCase()}.com/v1`,
        authType: 'api_key' as const,
        authConfig: {},
        headers: { 'Content-Type': 'application/json' },
        requestConfig: { timeout: 30000, retries: 3, retryDelay: 1000 },
        dataTypes: this.getSystemTypeDataTypes(systemType),
        capabilities: ['read', 'write'],
        tags: ['integration', 'api', systemType, provider.toLowerCase(), 'automation'],
        metadata: { aiPrompt: prompt },
        createdBy: userId,
      };

      return await this.createApiIntegration(baseConfig);
    } catch (error) {
      console.error('Error generating API integration with AI:', error);
      throw error;
    }
  }

  private getSystemTypeDataTypes(systemType: string): string[] {
    const dataTypeMap: Record<string, string[]> = {
      'erp': ['orders', 'inventory', 'customers', 'suppliers', 'financials'],
      'crm': ['customers', 'leads', 'opportunities', 'contacts'],
      'wms': ['inventory', 'storage_locations', 'shipments', 'receiving'],
      'mes': ['production_orders', 'work_orders', 'quality_data', 'equipment_status'],
      'scada': ['sensor_data', 'equipment_status', 'alarms', 'historical_data'],
      'iot': ['sensor_readings', 'device_status', 'telemetry', 'alerts'],
      'custom': ['data']
    };
    return dataTypeMap[systemType] || ['data'];
  }

  async testApiConnection(id: number): Promise<{ success: boolean; message: string; responseTime?: number }> {
    try {
      const integration = await this.getApiIntegration(id);
      if (!integration) {
        return { success: false, message: 'Integration not found' };
      }

      const startTime = Date.now();
      const simulatedDelay = Math.random() * 2000 + 500; // 500-2500ms
      await new Promise(resolve => setTimeout(resolve, simulatedDelay));
      
      const responseTime = Date.now() - startTime;
      const success = Math.random() > 0.1; // 90% success rate for demo
      
      await this.updateApiIntegration(id, { 
        healthStatus: success ? 'healthy' : 'unhealthy',
        lastSync: new Date()
      });

      await this.createApiAuditLog({
        integrationId: id,
        operation: 'test',
        method: 'GET',
        endpoint: integration.endpoint,
        statusCode: success ? 200 : 500,
        responseTime,
        success,
        errorMessage: success ? undefined : 'Connection test failed',
        userId: integration.createdBy || undefined,
      });

      return {
        success,
        message: success ? 'Connection successful' : 'Connection failed - please check credentials and endpoint',
        responseTime
      };
    } catch (error) {
      console.error('Error testing API connection:', error);
      return { success: false, message: 'Test failed due to internal error' };
    }
  }

  async syncApiIntegration(id: number): Promise<{ success: boolean; recordsProcessed: number; message: string }> {
    try {
      const integration = await this.getApiIntegration(id);
      if (!integration) {
        return { success: false, recordsProcessed: 0, message: 'Integration not found' };
      }

      const recordsProcessed = Math.floor(Math.random() * 1000) + 100;
      const success = Math.random() > 0.05; // 95% success rate
      
      await this.updateApiIntegration(id, {
        lastSync: new Date(),
        nextSync: new Date(Date.now() + 60 * 60 * 1000), // Next hour
        successCount: integration.successCount + (success ? 1 : 0),
        errorCount: integration.errorCount + (success ? 0 : 1),
        totalRequests: integration.totalRequests + 1,
      });

      await this.createApiAuditLog({
        integrationId: id,
        operation: 'sync',
        method: 'POST',
        endpoint: integration.endpoint + '/sync',
        statusCode: success ? 200 : 500,
        responseTime: Math.random() * 5000 + 1000,
        success,
        recordsProcessed: success ? recordsProcessed : 0,
        errorMessage: success ? undefined : 'Sync operation failed',
        userId: integration.createdBy || undefined,
      });

      return {
        success,
        recordsProcessed: success ? recordsProcessed : 0,
        message: success ? `Successfully synced ${recordsProcessed} records` : 'Sync operation failed'
      };
    } catch (error) {
      console.error('Error syncing API integration:', error);
      return { success: false, recordsProcessed: 0, message: 'Sync failed due to internal error' };
    }
  }

  // =================== API MAPPINGS ===================

  async createApiMapping(mapping: InsertApiMapping): Promise<ApiMapping> {
    try {
      const [result] = await db.insert(apiMappings).values(mapping).returning();
      return result;
    } catch (error) {
      console.error('Error creating API mapping:', error);
      throw error;
    }
  }

  async getApiMappings(integrationId?: number): Promise<ApiMapping[]> {
    try {
      let query = db.select().from(apiMappings);
      if (integrationId) {
        query = query.where(eq(apiMappings.integrationId, integrationId));
      }
      return await query.orderBy(apiMappings.name);
    } catch (error) {
      console.error('Error getting API mappings:', error);
      throw error;
    }
  }

  async getApiMapping(id: number): Promise<ApiMapping | undefined> {
    try {
      const [result] = await db.select().from(apiMappings).where(eq(apiMappings.id, id));
      return result;
    } catch (error) {
      console.error('Error getting API mapping:', error);
      throw error;
    }
  }

  async updateApiMapping(id: number, updates: Partial<ApiMapping>): Promise<ApiMapping> {
    try {
      const [result] = await db
        .update(apiMappings)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(apiMappings.id, id))
        .returning();
      
      if (!result) {
        throw new Error(`API mapping with id ${id} not found`);
      }
      
      return result;
    } catch (error) {
      console.error('Error updating API mapping:', error);
      throw error;
    }
  }

  async deleteApiMapping(id: number): Promise<void> {
    try {
      await db.delete(apiMappings).where(eq(apiMappings.id, id));
    } catch (error) {
      console.error('Error deleting API mapping:', error);
      throw error;
    }
  }

  async generateApiMappingWithAI(integrationId: number, description: string): Promise<ApiMapping> {
    try {
      const integration = await this.getApiIntegration(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      const mapping = {
        integrationId,
        name: `AI Generated Mapping - ${description}`,
        direction: 'bidirectional' as const,
        sourceSystem: 'external',
        sourceTable: integration.systemType + '_data',
        targetTable: 'jobs', // Default to jobs table
        fieldMappings: [
          { sourceField: 'id', targetField: 'id', isRequired: true },
          { sourceField: 'name', targetField: 'name', isRequired: true },
          { sourceField: 'status', targetField: 'status', isRequired: false },
        ],
        transformationRules: {
          conditions: [
            { field: 'status', operator: 'equals', value: 'active', action: 'map_to_active' }
          ]
        },
        filters: {
          conditions: [
            { field: 'status', operator: 'not_equals', value: 'deleted' }
          ]
        },
        isAiGenerated: true,
      };

      return await this.createApiMapping(mapping);
    } catch (error) {
      console.error('Error generating API mapping with AI:', error);
      throw error;
    }
  }

  // =================== API TESTS ===================

  async createApiTest(test: InsertApiTest): Promise<ApiTest> {
    try {
      const [result] = await db.insert(apiTests).values(test).returning();
      return result;
    } catch (error) {
      console.error('Error creating API test:', error);
      throw error;
    }
  }

  async getApiTests(integrationId?: number): Promise<ApiTest[]> {
    try {
      let query = db.select().from(apiTests);
      if (integrationId) {
        query = query.where(eq(apiTests.integrationId, integrationId));
      }
      return await query.orderBy(apiTests.createdAt);
    } catch (error) {
      console.error('Error getting API tests:', error);
      throw error;
    }
  }

  async getApiTest(id: number): Promise<ApiTest | undefined> {
    try {
      const [result] = await db.select().from(apiTests).where(eq(apiTests.id, id));
      return result;
    } catch (error) {
      console.error('Error getting API test:', error);
      throw error;
    }
  }

  async runApiTest(id: number): Promise<ApiTest> {
    try {
      const test = await this.getApiTest(id);
      if (!test) {
        throw new Error('Test not found');
      }

      const integration = await this.getApiIntegration(test.integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      const duration = Math.random() * 3000 + 500; // 500-3500ms
      await new Promise(resolve => setTimeout(resolve, duration));
      
      const success = Math.random() > 0.15; // 85% success rate
      const status = success ? 'passed' : 'failed';
      
      const mockResponse = {
        status: success ? 200 : 400,
        statusText: success ? 'OK' : 'Bad Request',
        headers: { 'content-type': 'application/json' },
        data: success ? { result: 'success', data: [] } : { error: 'Test failed' },
        responseTime: duration
      };

      const [updatedTest] = await db
        .update(apiTests)
        .set({
          status,
          response: mockResponse,
          actualResult: mockResponse.data,
          errorMessage: success ? undefined : 'Test execution failed',
          duration: Math.round(duration),
          runAt: new Date()
        })
        .where(eq(apiTests.id, id))
        .returning();

      return updatedTest;
    } catch (error) {
      console.error('Error running API test:', error);
      throw error;
    }
  }

  async deleteApiTest(id: number): Promise<void> {
    try {
      await db.delete(apiTests).where(eq(apiTests.id, id));
    } catch (error) {
      console.error('Error deleting API test:', error);
      throw error;
    }
  }

  // =================== API AUDIT LOGS ===================

  async createApiAuditLog(log: InsertApiAuditLog): Promise<ApiAuditLog> {
    try {
      const [result] = await db.insert(apiAuditLogs).values(log).returning();
      return result;
    } catch (error) {
      console.error('Error creating API audit log:', error);
      throw error;
    }
  }

  async getApiAuditLogs(integrationId?: number, limit = 100): Promise<ApiAuditLog[]> {
    try {
      let query = db.select().from(apiAuditLogs);
      if (integrationId) {
        query = query.where(eq(apiAuditLogs.integrationId, integrationId));
      }
      return await query
        .orderBy(desc(apiAuditLogs.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Error getting API audit logs:', error);
      throw error;
    }
  }

  // =================== API CREDENTIALS ===================

  async createApiCredential(credential: InsertApiCredential): Promise<ApiCredential> {
    try {
      const [result] = await db.insert(apiCredentials).values(credential).returning();
      return result;
    } catch (error) {
      console.error('Error creating API credential:', error);
      throw error;
    }
  }

  async getApiCredentials(integrationId: number): Promise<ApiCredential[]> {
    try {
      return await db
        .select()
        .from(apiCredentials)
        .where(eq(apiCredentials.integrationId, integrationId))
        .orderBy(apiCredentials.name);
    } catch (error) {
      console.error('Error getting API credentials:', error);
      throw error;
    }
  }

  async updateApiCredential(id: number, updates: Partial<ApiCredential>): Promise<ApiCredential> {
    try {
      const [result] = await db
        .update(apiCredentials)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(apiCredentials.id, id))
        .returning();
      
      if (!result) {
        throw new Error(`API credential with id ${id} not found`);
      }
      
      return result;
    } catch (error) {
      console.error('Error updating API credential:', error);
      throw error;
    }
  }

  async deleteApiCredential(id: number): Promise<void> {
    try {
      await db.delete(apiCredentials).where(eq(apiCredentials.id, id));
    } catch (error) {
      console.error('Error deleting API credential:', error);
      throw error;
    }
  }

  // Scheduling History Methods
  async getSchedulingHistory(limit = 50, algorithmType?: string, plantId?: number): Promise<SchedulingHistory[]> {
    try {
      let query = db.select().from(schedulingHistory);
      
      const conditions = [];
      if (algorithmType) {
        conditions.push(eq(schedulingHistory.algorithmName, algorithmType));
      }
      if (plantId) {
        conditions.push(eq(schedulingHistory.plantId, plantId));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      return await query
        .orderBy(desc(schedulingHistory.startTime))
        .limit(limit);
    } catch (error) {
      console.error('Error getting scheduling history:', error);
      throw error;
    }
  }

  async getSchedulingHistoryById(id: number): Promise<SchedulingHistory | undefined> {
    try {
      const [result] = await db
        .select()
        .from(schedulingHistory)
        .where(eq(schedulingHistory.id, id));
      return result;
    } catch (error) {
      console.error('Error getting scheduling history by id:', error);
      throw error;
    }
  }

  async createSchedulingHistory(history: InsertSchedulingHistory): Promise<SchedulingHistory> {
    try {
      const [result] = await db
        .insert(schedulingHistory)
        .values(history)
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating scheduling history:', error);
      throw error;
    }
  }

  async updateSchedulingHistory(id: number, updates: Partial<InsertSchedulingHistory>): Promise<SchedulingHistory | undefined> {
    try {
      const [result] = await db
        .update(schedulingHistory)
        .set(updates)
        .where(eq(schedulingHistory.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating scheduling history:', error);
      throw error;
    }
  }

  async deleteSchedulingHistory(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(schedulingHistory)
        .where(eq(schedulingHistory.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting scheduling history:', error);
      throw error;
    }
  }

  async getSchedulingHistoryByUser(userId: number, limit = 20): Promise<SchedulingHistory[]> {
    try {
      return await db
        .select()
        .from(schedulingHistory)
        .where(eq(schedulingHistory.triggeredBy, userId))
        .orderBy(desc(schedulingHistory.executionStartTime))
        .limit(limit);
    } catch (error) {
      console.error('Error getting scheduling history by user:', error);
      throw error;
    }
  }

  async getSchedulingHistoryComparison(baselineId: number, comparisonId: number): Promise<{ baseline: SchedulingHistory; comparison: SchedulingHistory; improvements: any }> {
    try {
      const [baseline] = await db
        .select()
        .from(schedulingHistory)
        .where(eq(schedulingHistory.id, baselineId));
      
      const [comparison] = await db
        .select()
        .from(schedulingHistory)
        .where(eq(schedulingHistory.id, comparisonId));
      
      if (!baseline || !comparison) {
        throw new Error('One or both scheduling history records not found');
      }

      // Calculate improvements
      const improvements = {
        makespanImprovement: baseline.makespan && comparison.makespan 
          ? ((baseline.makespan - comparison.makespan) / baseline.makespan) * 100 
          : null,
        utilizationImprovement: baseline.resourceUtilization && comparison.resourceUtilization
          ? comparison.resourceUtilization - baseline.resourceUtilization
          : null,
        onTimeDeliveryImprovement: baseline.onTimeDeliveryRate && comparison.onTimeDeliveryRate
          ? comparison.onTimeDeliveryRate - baseline.onTimeDeliveryRate
          : null,
        executionTimeComparison: baseline.executionDuration && comparison.executionDuration
          ? comparison.executionDuration - baseline.executionDuration
          : null
      };

      return { baseline, comparison, improvements };
    } catch (error) {
      console.error('Error getting scheduling history comparison:', error);
      throw error;
    }
  }

  // Scheduling Results Methods
  async getSchedulingResults(historyId: number): Promise<SchedulingResult[]> {
    try {
      return await db
        .select()
        .from(schedulingResults)
        .where(eq(schedulingResults.historyId, historyId))
        .orderBy(schedulingResults.scheduledStartTime);
    } catch (error) {
      console.error('Error getting scheduling results:', error);
      throw error;
    }
  }

  async createSchedulingResult(result: InsertSchedulingResult): Promise<SchedulingResult> {
    try {
      const [created] = await db
        .insert(schedulingResults)
        .values(result)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating scheduling result:', error);
      throw error;
    }
  }

  async getSchedulingResultsByOperation(operationId: number): Promise<SchedulingResult[]> {
    try {
      return await db
        .select()
        .from(schedulingResults)
        .where(eq(schedulingResults.operationId, operationId))
        .orderBy(desc(schedulingResults.id));
    } catch (error) {
      console.error('Error getting scheduling results by operation:', error);
      throw error;
    }
  }

  async getSchedulingResultsWithDetails(historyId: number): Promise<(SchedulingResult & { jobName?: string; operationName?: string; resourceName?: string })[]> {
    try {
      const results = await db
        .select({
          id: schedulingResults.id,
          historyId: schedulingResults.historyId,
          operationId: schedulingResults.operationId,
          jobId: schedulingResults.jobId,
          resourceId: schedulingResults.resourceId,
          scheduledStartTime: schedulingResults.scheduledStartTime,
          scheduledEndTime: schedulingResults.scheduledEndTime,
          originalStartTime: schedulingResults.originalStartTime,
          originalEndTime: schedulingResults.originalEndTime,
          setupTime: schedulingResults.setupTime,
          processTime: schedulingResults.processTime,
          queueTime: schedulingResults.queueTime,
          moveTime: schedulingResults.moveTime,
          waitTime: schedulingResults.waitTime,
          utilizationImprovement: schedulingResults.utilizationImprovement,
          costImpact: schedulingResults.costImpact,
          qualityImpact: schedulingResults.qualityImpact,
          jobName: jobs.name,
          operationName: operations.name,
          resourceName: resources.name,
        })
        .from(schedulingResults)
        .leftJoin(jobs, eq(schedulingResults.jobId, jobs.id))
        .leftJoin(operations, eq(schedulingResults.operationId, operations.id))
        .leftJoin(resources, eq(schedulingResults.resourceId, resources.id))
        .where(eq(schedulingResults.historyId, historyId))
        .orderBy(schedulingResults.scheduledStartTime);

      return results;
    } catch (error) {
      console.error('Error getting scheduling results with details:', error);
      throw error;
    }
  }

  // Algorithm Performance Methods
  async getAlgorithmPerformance(algorithmName?: string, plantId?: number): Promise<AlgorithmPerformance[]> {
    try {
      let query = db.select().from(algorithmPerformance);
      
      const conditions = [];
      if (algorithmName) {
        conditions.push(eq(algorithmPerformance.algorithmName, algorithmName));
      }
      if (plantId) {
        conditions.push(eq(algorithmPerformance.plantId, plantId));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      return await query.orderBy(desc(algorithmPerformance.lastUpdated));
    } catch (error) {
      console.error('Error getting algorithm performance:', error);
      throw error;
    }
  }

  async getAlgorithmPerformanceById(id: number): Promise<AlgorithmPerformance | undefined> {
    try {
      const [result] = await db
        .select()
        .from(algorithmPerformance)
        .where(eq(algorithmPerformance.id, id));
      return result;
    } catch (error) {
      console.error('Error getting algorithm performance by id:', error);
      throw error;
    }
  }

  async createAlgorithmPerformance(performance: InsertAlgorithmPerformance): Promise<AlgorithmPerformance> {
    try {
      const [result] = await db
        .insert(algorithmPerformance)
        .values(performance)
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating algorithm performance:', error);
      throw error;
    }
  }

  async updateAlgorithmPerformance(id: number, updates: Partial<InsertAlgorithmPerformance>): Promise<AlgorithmPerformance | undefined> {
    try {
      const [result] = await db
        .update(algorithmPerformance)
        .set({ ...updates, lastUpdated: new Date() })
        .where(eq(algorithmPerformance.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating algorithm performance:', error);
      throw error;
    }
  }

  async deleteAlgorithmPerformance(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(algorithmPerformance)
        .where(eq(algorithmPerformance.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting algorithm performance:', error);
      throw error;
    }
  }

  async getAlgorithmPerformanceTrends(algorithmName: string, plantId?: number, months = 6): Promise<AlgorithmPerformance[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);
      
      let query = db
        .select()
        .from(algorithmPerformance)
        .where(
          and(
            eq(algorithmPerformance.algorithmName, algorithmName),
            gte(algorithmPerformance.lastUpdated, cutoffDate)
          )
        );
      
      if (plantId) {
        query = query.where(
          and(
            eq(algorithmPerformance.algorithmName, algorithmName),
            eq(algorithmPerformance.plantId, plantId),
            gte(algorithmPerformance.lastUpdated, cutoffDate)
          )
        );
      }
      
      return await query.orderBy(algorithmPerformance.lastUpdated);
    } catch (error) {
      console.error('Error getting algorithm performance trends:', error);
      throw error;
    }
  }

  // Onboarding Management Implementation
  async getCompanyOnboarding(userId: number | string): Promise<CompanyOnboarding | undefined> {
    try {
      // Handle demo users (string IDs) - return mock onboarding data
      if (typeof userId === 'string' && userId.startsWith('demo_')) {
        console.log('Demo user detected, returning mock onboarding data for:', userId);
        return {
          id: 1,
          companyName: userId === 'demo_director' ? 'Demo Manufacturing Corp' : 'Demo Company',
          industry: 'food_production',
          size: 'medium',
          description: 'A demo manufacturing company for testing purposes',
          primaryGoal: 'improve-efficiency',
          selectedFeatures: ['production-scheduling', 'shop-floor', 'analytics'],
          completedSteps: ['welcome', 'company-info', 'features'],
          currentStep: 'complete',
          teamMembers: 5,
          isCompleted: true,
          createdBy: 1, // Use integer for database compatibility
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        } as CompanyOnboarding;
      }

      // Handle regular users (numeric IDs)
      const numericUserId = typeof userId === 'string' ? parseInt(userId) : userId;
      if (isNaN(numericUserId)) {
        console.log('Invalid user ID provided:', userId);
        return undefined;
      }

      const [onboarding] = await db
        .select()
        .from(companyOnboarding)
        .where(eq(companyOnboarding.createdBy, numericUserId))
        .orderBy(desc(companyOnboarding.createdAt))
        .limit(1);
      return onboarding;
    } catch (error) {
      console.error('Error getting company onboarding:', error);
      throw error;
    }
  }

  async createCompanyOnboarding(data: InsertCompanyOnboarding): Promise<CompanyOnboarding> {
    try {
      // Handle demo users - return mock data without database insertion
      if (typeof data.createdBy === 'string' && data.createdBy.startsWith('demo_')) {
        console.log('Demo user detected, returning mock onboarding creation for:', data.createdBy);
        return {
          id: 1,
          companyName: data.companyName || 'Demo Manufacturing Corp',
          industry: data.industry || 'food_production',
          size: data.size || 'medium',
          description: data.description || 'A demo manufacturing company for testing purposes',
          primaryGoal: data.primaryGoal || 'improve-efficiency',
          selectedFeatures: data.selectedFeatures || ['production-scheduling', 'shop-floor', 'analytics'],
          completedSteps: data.completedSteps || ['welcome'],
          currentStep: data.currentStep || 'company-info',
          teamMembers: data.teamMembers || 5,
          isCompleted: data.isCompleted || false,
          createdBy: 1, // Use integer for database compatibility
          createdAt: new Date(),
          updatedAt: new Date()
        } as CompanyOnboarding;
      }

      // Handle regular users - ensure createdBy is numeric
      const processedData = {
        ...data,
        createdBy: typeof data.createdBy === 'string' ? parseInt(data.createdBy) : data.createdBy
      };

      if (isNaN(processedData.createdBy)) {
        throw new Error(`Invalid createdBy ID: ${data.createdBy}`);
      }

      const [newOnboarding] = await db
        .insert(companyOnboarding)
        .values(processedData)
        .returning();
      return newOnboarding;
    } catch (error) {
      console.error('Error creating company onboarding:', error);
      throw error;
    }
  }

  async updateCompanyOnboarding(id: number, data: Partial<InsertCompanyOnboarding>): Promise<CompanyOnboarding | undefined> {
    try {
      console.log('Updating company onboarding in database:', { id, data });
      
      // Handle demo users - return mock updated data
      if (typeof data.createdBy === 'string' && data.createdBy.startsWith('demo_')) {
        console.log('Demo user detected, returning mock onboarding update for:', data.createdBy);
        return {
          id: id,
          companyName: data.companyName || 'Demo Manufacturing Corp',
          industry: data.industry || 'food_production',
          size: data.size || 'medium',
          description: data.description || 'A demo manufacturing company for testing purposes',
          primaryGoal: data.primaryGoal || 'improve-efficiency',
          selectedFeatures: data.selectedFeatures || ['production-scheduling', 'shop-floor', 'analytics'],
          completedSteps: data.completedSteps || ['welcome', 'company-info'],
          currentStep: data.currentStep || 'features',
          teamMembers: data.teamMembers || 5,
          isCompleted: data.isCompleted || false,
          createdBy: 1, // Use integer for database compatibility
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date()
        } as CompanyOnboarding;
      }

      // Process createdBy for regular users
      const processedData = { ...data };
      if (data.createdBy && typeof data.createdBy === 'string') {
        processedData.createdBy = parseInt(data.createdBy);
        if (isNaN(processedData.createdBy)) {
          throw new Error(`Invalid createdBy ID: ${data.createdBy}`);
        }
      }
      
      const [updated] = await db
        .update(companyOnboarding)
        .set({ ...processedData, updatedAt: new Date() })
        .where(eq(companyOnboarding.id, id))
        .returning();
      
      console.log('Database update result:', updated ? 'success' : 'no rows affected');
      return updated;
    } catch (error) {
      console.error('Error updating company onboarding:', error);
      throw error;
    }
  }

  async getOnboardingProgress(userId: number, companyOnboardingId: number): Promise<OnboardingProgress[]> {
    try {
      return await db
        .select()
        .from(onboardingProgress)
        .where(
          and(
            eq(onboardingProgress.userId, userId),
            eq(onboardingProgress.companyOnboardingId, companyOnboardingId)
          )
        );
    } catch (error) {
      console.error('Error getting onboarding progress:', error);
      throw error;
    }
  }

  async createOnboardingProgress(data: InsertOnboardingProgress): Promise<OnboardingProgress> {
    try {
      const [newProgress] = await db
        .insert(onboardingProgress)
        .values(data)
        .returning();
      return newProgress;
    } catch (error) {
      console.error('Error creating onboarding progress:', error);
      throw error;
    }
  }

  async updateOnboardingProgress(userId: number, step: string, data: Partial<InsertOnboardingProgress>): Promise<OnboardingProgress | undefined> {
    try {
      const [updated] = await db
        .update(onboardingProgress)
        .set(data)
        .where(
          and(
            eq(onboardingProgress.userId, userId),
            eq(onboardingProgress.step, step)
          )
        )
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating onboarding progress:', error);
      throw error;
    }
  }

  async getTeamOnboardingStatus(companyOnboardingId: number): Promise<{ teamMembers: number; completedSteps: string[] }> {
    try {
      const onboarding = await db
        .select()
        .from(companyOnboarding)
        .where(eq(companyOnboarding.id, companyOnboardingId))
        .limit(1);

      if (!onboarding.length) {
        return { teamMembers: 0, completedSteps: [] };
      }

      const progressCount = await db
        .select({ count: sql<number>`count(distinct ${onboardingProgress.userId})` })
        .from(onboardingProgress)
        .where(eq(onboardingProgress.companyOnboardingId, companyOnboardingId));

      return {
        teamMembers: progressCount[0]?.count || 1,
        completedSteps: onboarding[0].completedSteps || []
      };
    } catch (error) {
      console.error('Error getting team onboarding status:', error);
      throw error;
    }
  }

  // Recipe Management
  async getRecipes(plantId?: number): Promise<Recipe[]> {
    const conditions: any[] = [];
    if (plantId) {
      conditions.push(eq(recipes.plantId, plantId));
    }
    
    const query = conditions.length > 0 
      ? db.select().from(recipes).where(and(...conditions))
      : db.select().from(recipes);
      
    return await query;
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe || undefined;
  }

  async getRecipeByNumber(recipeNumber: string): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.recipeNumber, recipeNumber));
    return recipe || undefined;
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [newRecipe] = await db.insert(recipes).values(recipe).returning();
    return newRecipe;
  }

  async updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const [updated] = await db.update(recipes)
      .set({ ...recipe, updatedAt: new Date() })
      .where(eq(recipes.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRecipe(id: number): Promise<boolean> {
    // Delete related data first
    await db.delete(recipePhases).where(eq(recipePhases.recipeId, id));
    await db.delete(recipeFormulas).where(eq(recipeFormulas.recipeId, id));
    await db.delete(recipeEquipment).where(eq(recipeEquipment.recipeId, id));
    
    const result = await db.delete(recipes).where(eq(recipes.id, id));
    return result.rowCount > 0;
  }

  // Recipe Phases
  async getRecipePhases(recipeId?: number): Promise<RecipePhase[]> {
    try {
      if (recipeId) {
        return await db.select().from(recipePhases)
          .where(eq(recipePhases.recipeId, recipeId))
          .orderBy(recipePhases.phaseOrder);
      } else {
        return await db.select().from(recipePhases);
      }
    } catch (error) {
      console.error('Error in getRecipePhases:', error);
      throw error;
    }
  }

  async getRecipePhase(id: number): Promise<RecipePhase | undefined> {
    const [phase] = await db.select().from(recipePhases).where(eq(recipePhases.id, id));
    return phase || undefined;
  }

  async createRecipePhase(phase: InsertRecipePhase): Promise<RecipePhase> {
    const [newPhase] = await db.insert(recipePhases).values(phase).returning();
    return newPhase;
  }

  async updateRecipePhase(id: number, phase: Partial<InsertRecipePhase>): Promise<RecipePhase | undefined> {
    const [updated] = await db.update(recipePhases)
      .set({ ...phase, updatedAt: new Date() })
      .where(eq(recipePhases.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRecipePhase(id: number): Promise<boolean> {
    // Delete related formulas and equipment first
    await db.delete(recipeFormulas).where(eq(recipeFormulas.phaseId, id));
    await db.delete(recipeEquipment).where(eq(recipeEquipment.phaseId, id));
    
    const result = await db.delete(recipePhases).where(eq(recipePhases.id, id));
    return result.rowCount > 0;
  }

  // Recipe Formulas
  async getRecipeFormulas(recipeId?: number, phaseId?: number): Promise<RecipeFormula[]> {
    const conditions: any[] = [];
    if (recipeId) {
      conditions.push(eq(recipeFormulas.recipeId, recipeId));
    }
    if (phaseId) {
      conditions.push(eq(recipeFormulas.phaseId, phaseId));
    }
    
    const query = conditions.length > 0 
      ? db.select().from(recipeFormulas).where(and(...conditions))
      : db.select().from(recipeFormulas);
      
    return await query;
  }

  async getRecipeFormula(id: number): Promise<RecipeFormula | undefined> {
    const [formula] = await db.select().from(recipeFormulas).where(eq(recipeFormulas.id, id));
    return formula || undefined;
  }

  async createRecipeFormula(formula: InsertRecipeFormula): Promise<RecipeFormula> {
    const [newFormula] = await db.insert(recipeFormulas).values(formula).returning();
    return newFormula;
  }

  async updateRecipeFormula(id: number, formula: Partial<InsertRecipeFormula>): Promise<RecipeFormula | undefined> {
    const [updated] = await db.update(recipeFormulas)
      .set({ ...formula, updatedAt: new Date() })
      .where(eq(recipeFormulas.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRecipeFormula(id: number): Promise<boolean> {
    const result = await db.delete(recipeFormulas).where(eq(recipeFormulas.id, id));
    return result.rowCount > 0;
  }

  // Recipe Product Outputs
  async getRecipeProductOutputs(recipeId?: number): Promise<RecipeProductOutput[]> {
    if (recipeId) {
      return await db.select().from(recipeProductOutputs)
        .where(eq(recipeProductOutputs.recipeId, recipeId))
        .orderBy(recipeProductOutputs.sortOrder, recipeProductOutputs.id);
    }
    return await db.select().from(recipeProductOutputs).orderBy(recipeProductOutputs.sortOrder, recipeProductOutputs.id);
  }

  async getRecipeProductOutput(id: number): Promise<RecipeProductOutput | undefined> {
    const [output] = await db.select().from(recipeProductOutputs).where(eq(recipeProductOutputs.id, id));
    return output || undefined;
  }

  async createRecipeProductOutput(output: InsertRecipeProductOutput): Promise<RecipeProductOutput> {
    const [newOutput] = await db.insert(recipeProductOutputs).values(output).returning();
    return newOutput;
  }

  async updateRecipeProductOutput(id: number, output: Partial<InsertRecipeProductOutput>): Promise<RecipeProductOutput | undefined> {
    const [updated] = await db.update(recipeProductOutputs)
      .set({ ...output, updatedAt: new Date() })
      .where(eq(recipeProductOutputs.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRecipeProductOutput(id: number): Promise<boolean> {
    const result = await db.delete(recipeProductOutputs).where(eq(recipeProductOutputs.id, id));
    return result.rowCount > 0;
  }

  // Recipe Equipment
  async getRecipeEquipment(recipeId?: number, phaseId?: number): Promise<RecipeEquipment[]> {
    const conditions: any[] = [];
    if (recipeId) {
      conditions.push(eq(recipeEquipment.recipeId, recipeId));
    }
    if (phaseId) {
      conditions.push(eq(recipeEquipment.phaseId, phaseId));
    }
    
    const query = conditions.length > 0 
      ? db.select().from(recipeEquipment).where(and(...conditions))
      : db.select().from(recipeEquipment);
      
    return await query;
  }

  async getRecipeEquipmentItem(id: number): Promise<RecipeEquipment | undefined> {
    const [equipment] = await db.select().from(recipeEquipment).where(eq(recipeEquipment.id, id));
    return equipment || undefined;
  }

  async createRecipeEquipment(equipment: InsertRecipeEquipment): Promise<RecipeEquipment> {
    const [newEquipment] = await db.insert(recipeEquipment).values(equipment).returning();
    return newEquipment;
  }

  async updateRecipeEquipment(id: number, equipment: Partial<InsertRecipeEquipment>): Promise<RecipeEquipment | undefined> {
    const [updated] = await db.update(recipeEquipment)
      .set({ ...equipment, updatedAt: new Date() })
      .where(eq(recipeEquipment.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRecipeEquipment(id: number): Promise<boolean> {
    const result = await db.delete(recipeEquipment).where(eq(recipeEquipment.id, id));
    return result.rowCount > 0;
  }

  // Bills of Material Management
  async getBillsOfMaterial(): Promise<any[]> {
    return await db.select().from(billsOfMaterial);
  }
  
  // Routings Management  
  async getRoutings(): Promise<any[]> {
    return await db.select().from(routings);
  }

  // COMMENTED OUT: Production Versions - productionVersions table and types not defined
  /*
  async getProductionVersions(plantId?: number): Promise<ProductionVersion[]> {
    const conditions: any[] = [];
    if (plantId) {
      conditions.push(eq(productionVersions.plantId, plantId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(productionVersions).where(and(...conditions)).orderBy(productionVersions.versionNumber);
    }
    return await db.select().from(productionVersions).orderBy(productionVersions.versionNumber);
  }

  async getProductionVersion(id: number): Promise<ProductionVersion | undefined> {
    const [version] = await db.select().from(productionVersions).where(eq(productionVersions.id, id));
    return version || undefined;
  }

  async getProductionVersionByNumber(versionNumber: string, itemNumber: string, plantId: number): Promise<ProductionVersion | undefined> {
    const [version] = await db.select().from(productionVersions)
      .where(and(
        eq(productionVersions.versionNumber, versionNumber),
        eq(productionVersions.itemNumber, itemNumber),
        eq(productionVersions.plantId, plantId)
      ));
    return version || undefined;
  }

  async createProductionVersion(version: InsertProductionVersion): Promise<ProductionVersion> {
    const [newVersion] = await db.insert(productionVersions).values(version).returning();
    return newVersion;
  }

  async updateProductionVersion(id: number, version: Partial<InsertProductionVersion>): Promise<ProductionVersion | undefined> {
    const [updated] = await db.update(productionVersions)
      .set({ ...version, updatedAt: new Date() })
      .where(eq(productionVersions.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProductionVersion(id: number): Promise<boolean> {
    const result = await db.delete(productionVersions).where(eq(productionVersions.id, id));
    return result.rowCount > 0;
  }
  */

  // Vendors
  async getVendors(): Promise<PTVendor[]> {
    return await db.select().from(PTvendors).orderBy(PTvendors.vendorName);
  }

  async getVendor(id: number): Promise<PTVendor | undefined> {
    const [vendor] = await db.select().from(PTvendors).where(eq(PTvendors.id, id));
    return vendor || undefined;
  }

  async createVendor(vendor: InsertPTVendor): Promise<PTVendor> {
    const [newVendor] = await db.insert(PTvendors).values(vendor).returning();
    return newVendor;
  }

  async updateVendor(id: number, vendor: Partial<InsertPTVendor>): Promise<PTVendor | undefined> {
    const [updated] = await db.update(PTvendors)
      .set({ ...vendor, updatedAt: new Date() })
      .where(eq(PTvendors.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteVendor(id: number): Promise<boolean> {
    const result = await db.delete(PTvendors).where(eq(PTvendors.id, id));
    return result.rowCount > 0;
  }

  // Formulations
  async getFormulations(): Promise<Formulation[]> {
    return await db.select().from(formulations).orderBy(asc(formulations.formulationNumber));
  }

  async getFormulation(id: number): Promise<Formulation | undefined> {
    const [formulation] = await db.select().from(formulations).where(eq(formulations.id, id));
    return formulation || undefined;
  }

  async getFormulationByNumber(formulationNumber: string): Promise<Formulation | undefined> {
    const [formulation] = await db.select().from(formulations).where(eq(formulations.formulationNumber, formulationNumber));
    return formulation || undefined;
  }

  async createFormulation(formulation: InsertFormulation): Promise<Formulation> {
    const [newFormulation] = await db
      .insert(formulations)
      .values(formulation)
      .returning();
    return newFormulation;
  }

  async updateFormulation(id: number, formulation: Partial<InsertFormulation>): Promise<Formulation | undefined> {
    const [updatedFormulation] = await db
      .update(formulations)
      .set({ ...formulation, updatedAt: new Date() })
      .where(eq(formulations.id, id))
      .returning();
    return updatedFormulation || undefined;
  }

  async deleteFormulation(id: number): Promise<boolean> {
    const result = await db.delete(formulations).where(eq(formulations.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getFormulationsByVendor(vendorId: number): Promise<Formulation[]> {
    return await db.select().from(formulations).where(eq(formulations.preferredVendorId, vendorId));
  }

  // Formulation Details CRUD operations
  async getFormulationDetails(formulationId?: number): Promise<FormulationDetail[]> {
    let query = db.select().from(formulationDetails);
    
    if (formulationId) {
      query = query.where(eq(formulationDetails.formulationId, formulationId));
    }
    
    return await query.orderBy(formulationDetails.category, formulationDetails.detailName);
  }

  async getFormulationDetail(id: number): Promise<FormulationDetail | undefined> {
    const [detail] = await db
      .select()
      .from(formulationDetails)
      .where(eq(formulationDetails.id, id));
    return detail;
  }

  async createFormulationDetail(detail: InsertFormulationDetail): Promise<FormulationDetail> {
    const [newDetail] = await db
      .insert(formulationDetails)
      .values(detail)
      .returning();
    return newDetail;
  }

  async updateFormulationDetail(id: number, detail: Partial<InsertFormulationDetail>): Promise<FormulationDetail | undefined> {
    const [updatedDetail] = await db
      .update(formulationDetails)
      .set({ ...detail, updatedAt: new Date() })
      .where(eq(formulationDetails.id, id))
      .returning();
    return updatedDetail;
  }

  async deleteFormulationDetail(id: number): Promise<boolean> {
    const result = await db
      .delete(formulationDetails)
      .where(eq(formulationDetails.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getFormulationDetailsByFormulation(formulationId: number): Promise<FormulationDetail[]> {
    return await db
      .select()
      .from(formulationDetails)
      .where(eq(formulationDetails.formulationId, formulationId))
      .orderBy(formulationDetails.category, formulationDetails.detailName);
  }

  async getFormulationDetailsByItem(itemId: number): Promise<FormulationDetail[]> {
    return await db
      .select()
      .from(formulationDetails)
      .where(eq(formulationDetails.itemId, itemId))
      .orderBy(formulationDetails.category, formulationDetails.detailName);
  }

  // Production Version Phase Formulation Details Junction Methods
  async getProductionVersionPhaseFormulationDetails(productionVersionId?: number): Promise<ProductionVersionPhaseFormulationDetail[]> {
    let query = db.select().from(productionVersionPhaseFormulationDetails);
    
    if (productionVersionId) {
      query = query.where(eq(productionVersionPhaseFormulationDetails.productionVersionId, productionVersionId));
    }
    
    return await query.orderBy(productionVersionPhaseFormulationDetails.id);
  }

  async getProductionVersionPhaseFormulationDetail(id: number): Promise<ProductionVersionPhaseFormulationDetail | undefined> {
    const [result] = await db
      .select()
      .from(productionVersionPhaseFormulationDetails)
      .where(eq(productionVersionPhaseFormulationDetails.id, id));
    return result;
  }

  async createProductionVersionPhaseFormulationDetail(assignment: InsertProductionVersionPhaseFormulationDetail): Promise<ProductionVersionPhaseFormulationDetail> {
    const [result] = await db
      .insert(productionVersionPhaseFormulationDetails)
      .values(assignment)
      .returning();
    return result;
  }

  async updateProductionVersionPhaseFormulationDetail(id: number, assignment: Partial<InsertProductionVersionPhaseFormulationDetail>): Promise<ProductionVersionPhaseFormulationDetail | undefined> {
    const [result] = await db
      .update(productionVersionPhaseFormulationDetails)
      .set(assignment)
      .where(eq(productionVersionPhaseFormulationDetails.id, id))
      .returning();
    return result;
  }

  async deleteProductionVersionPhaseFormulationDetail(id: number): Promise<boolean> {
    const result = await db
      .delete(productionVersionPhaseFormulationDetails)
      .where(eq(productionVersionPhaseFormulationDetails.id, id));
    return result.rowCount > 0;
  }

  async getProductionVersionPhaseFormulationDetailsByProductionVersion(productionVersionId: number): Promise<ProductionVersionPhaseFormulationDetail[]> {
    return await db
      .select()
      .from(productionVersionPhaseFormulationDetails)
      .where(eq(productionVersionPhaseFormulationDetails.productionVersionId, productionVersionId))
      .orderBy(productionVersionPhaseFormulationDetails.id);
  }

  async getProductionVersionPhaseFormulationDetailsByRecipePhase(recipePhaseId: number): Promise<ProductionVersionPhaseFormulationDetail[]> {
    return await db
      .select()
      .from(productionVersionPhaseFormulationDetails)
      .where(eq(productionVersionPhaseFormulationDetails.recipePhaseId, recipePhaseId))
      .orderBy(productionVersionPhaseFormulationDetails.id);
  }

  async getProductionVersionPhaseFormulationDetailsByFormulationDetail(formulationDetailId: number): Promise<ProductionVersionPhaseFormulationDetail[]> {
    return await db
      .select()
      .from(productionVersionPhaseFormulationDetails)
      .where(eq(productionVersionPhaseFormulationDetails.formulationDetailId, formulationDetailId))
      .orderBy(productionVersionPhaseFormulationDetails.id);
  }

  // Production Version Phase Material Requirements - REMOVED (tables deleted, using PT Publish tables)

  // Material Requirements - dual relationship with formulations and BOMs
  async getMaterialRequirements(): Promise<MaterialRequirement[]> {
    return await db.select().from(materialRequirements).orderBy(materialRequirements.requirementName);
  }

  async getMaterialRequirement(id: number): Promise<MaterialRequirement | undefined> {
    const [requirement] = await db.select().from(materialRequirements).where(eq(materialRequirements.id, id));
    return requirement || undefined;
  }

  async createMaterialRequirement(requirement: InsertMaterialRequirement): Promise<MaterialRequirement> {
    const [newRequirement] = await db.insert(materialRequirements).values(requirement).returning();
    return newRequirement;
  }

  async updateMaterialRequirement(id: number, requirement: Partial<InsertMaterialRequirement>): Promise<MaterialRequirement | undefined> {
    const [updated] = await db.update(materialRequirements)
      .set({ ...requirement, updatedAt: new Date() })
      .where(eq(materialRequirements.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMaterialRequirement(id: number): Promise<boolean> {
    const result = await db.delete(materialRequirements).where(eq(materialRequirements.id, id));
    return result.rowCount > 0;
  }

  async getMaterialRequirementsByFormulation(formulationId: number): Promise<MaterialRequirement[]> {
    return await db
      .select()
      .from(materialRequirements)
      .where(eq(materialRequirements.formulationId, formulationId))
      .orderBy(materialRequirements.requirementName);
  }

  async getMaterialRequirementsByBom(bomId: number): Promise<MaterialRequirement[]> {
    return await db
      .select()
      .from(materialRequirements)
      .where(eq(materialRequirements.bomId, bomId))
      .orderBy(materialRequirements.requirementName);
  }

  async getMaterialRequirementsByItem(itemId: number): Promise<MaterialRequirement[]> {
    return await db
      .select()
      .from(materialRequirements)
      .where(eq(materialRequirements.itemId, itemId))
      .orderBy(materialRequirements.requirementName);
  }

  // Production Version Phase BOM Product Output - REMOVED (tables deleted, using PT Publish tables)

  // Production Version Phase Recipe Product Output Junction Table  
  async getProductionVersionPhaseRecipeProductOutputs(): Promise<ProductionVersionPhaseRecipeProductOutput[]> {
    return await db.select().from(productionVersionPhaseRecipeProductOutputs);
  }

  async getProductionVersionPhaseRecipeProductOutput(id: number): Promise<ProductionVersionPhaseRecipeProductOutput | undefined> {
    const [result] = await db.select().from(productionVersionPhaseRecipeProductOutputs)
      .where(eq(productionVersionPhaseRecipeProductOutputs.id, id));
    return result || undefined;
  }

  async createProductionVersionPhaseRecipeProductOutput(assignment: InsertProductionVersionPhaseRecipeProductOutput): Promise<ProductionVersionPhaseRecipeProductOutput> {
    const [newAssignment] = await db.insert(productionVersionPhaseRecipeProductOutputs).values(assignment).returning();
    return newAssignment;
  }

  async updateProductionVersionPhaseRecipeProductOutput(id: number, assignment: Partial<InsertProductionVersionPhaseRecipeProductOutput>): Promise<ProductionVersionPhaseRecipeProductOutput | undefined> {
    const [updated] = await db.update(productionVersionPhaseRecipeProductOutputs)
      .set({ ...assignment, updatedAt: new Date() })
      .where(eq(productionVersionPhaseRecipeProductOutputs.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProductionVersionPhaseRecipeProductOutput(id: number): Promise<boolean> {
    const result = await db.delete(productionVersionPhaseRecipeProductOutputs)  
      .where(eq(productionVersionPhaseRecipeProductOutputs.id, id));
    return result.rowCount > 0;
  }

  async getProductionVersionPhaseRecipeProductOutputsByProductionVersion(productionVersionId: number): Promise<ProductionVersionPhaseRecipeProductOutput[]> {
    return await db.select().from(productionVersionPhaseRecipeProductOutputs)
      .where(eq(productionVersionPhaseRecipeProductOutputs.productionVersionId, productionVersionId));
  }

  async getProductionVersionPhaseRecipeProductOutputsByPhase(recipePhaseId: number): Promise<ProductionVersionPhaseRecipeProductOutput[]> {
    return await db.select().from(productionVersionPhaseRecipeProductOutputs)
      .where(eq(productionVersionPhaseRecipeProductOutputs.recipePhaseId, recipePhaseId));
  }

  async getProductionVersionPhaseRecipeProductOutputsByRecipeOutput(recipeProductOutputId: number): Promise<ProductionVersionPhaseRecipeProductOutput[]> {
    return await db.select().from(productionVersionPhaseRecipeProductOutputs)
      .where(eq(productionVersionPhaseRecipeProductOutputs.recipeProductOutputId, recipeProductOutputId));
  }

  // BOM Product Outputs
  async getBomProductOutputs(): Promise<BomProductOutput[]> {
    return await db.select().from(bomProductOutputs);
  }

  async getBomProductOutput(id: number): Promise<BomProductOutput | undefined> {
    const [output] = await db.select().from(bomProductOutputs).where(eq(bomProductOutputs.id, id));
    return output || undefined;
  }

  async createBomProductOutput(output: InsertBomProductOutput): Promise<BomProductOutput> {
    const [newOutput] = await db.insert(bomProductOutputs).values(output).returning();
    return newOutput;
  }

  async updateBomProductOutput(id: number, output: Partial<InsertBomProductOutput>): Promise<BomProductOutput | undefined> {
    const [updated] = await db.update(bomProductOutputs)
      .set({ ...output, updatedAt: new Date() })
      .where(eq(bomProductOutputs.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBomProductOutput(id: number): Promise<boolean> {
    const result = await db.delete(bomProductOutputs).where(eq(bomProductOutputs.id, id));
    return result.rowCount > 0;
  }

  async getBomProductOutputsByBom(bomId: number): Promise<BomProductOutput[]> {
    return await db
      .select()
      .from(bomProductOutputs)
      .where(eq(bomProductOutputs.bomId, bomId))
      .orderBy(bomProductOutputs.sortOrder, bomProductOutputs.id);
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(customers.customerName);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return result.rowCount > 0;
  }

  // High-performance data management implementation for large datasets
  async getDataWithPagination<T>(
    table: string,
    request: import("@shared/data-management-types").DataRequest
  ): Promise<import("@shared/data-management-types").DataResponse<T>> {
    const startTime = Date.now();
    const { pagination, search, filters, sort } = request;
    
    // Get the table schema based on table name
    const tableMap: Record<string, any> = {
      plants,
      resources,
      capabilities,
      production_orders: productionOrders,
      operations: discreteOperations,
      vendors,
      customers,
      stock_items: stockItems
    };
    
    const dbTable = tableMap[table];
    if (!dbTable) {
      throw new Error(`Table ${table} not supported`);
    }

    // Build base query
    let query = db.select().from(dbTable);
    let countQuery = db.select({ count: sql<number>`count(*)::int` }).from(dbTable);

    // Collect all conditions to apply at once
    const allConditions = [];

    // Apply search filters
    if (search?.query && search.fields) {
      const searchConditions = search.fields.map(field => 
        ilike(dbTable[field], `%${search.query}%`)
      );
      const searchCondition = or(...searchConditions);
      allConditions.push(searchCondition);
    }

    // Apply filters
    if (filters && filters.length > 0) {
      const filterConditions = filters.map(filter => {
        const field = dbTable[filter.field];
        switch (filter.operator) {
          case 'eq': return eq(field, filter.value);
          case 'ne': return ne(field, filter.value);
          case 'gt': return gt(field, filter.value);
          case 'gte': return gte(field, filter.value);
          case 'lt': return lt(field, filter.value);
          case 'lte': return lte(field, filter.value);
          case 'contains': return ilike(field, `%${filter.value}%`);
          case 'starts_with': return ilike(field, `${filter.value}%`);
          case 'ends_with': return ilike(field, `%${filter.value}`);
          case 'in': return inArray(field, filter.value);
          case 'not_in': return not(inArray(field, filter.value));
          default: return eq(field, filter.value);
        }
      });
      allConditions.push(...filterConditions);
    }

    // Apply all conditions at once if any exist
    if (allConditions.length > 0) {
      const finalCondition = allConditions.length === 1 ? allConditions[0] : and(...allConditions);
      query = query.where(finalCondition);
      countQuery = countQuery.where(finalCondition);
    }

    // Apply sorting
    if (sort && sort.length > 0) {
      const sortConditions = sort.map(s => {
        const field = dbTable[s.field];
        return s.direction === 'desc' ? desc(field) : asc(field);
      });
      query = query.orderBy(...sortConditions);
    }

    // Get total count
    const [{ count: total }] = await countQuery;

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query = query.limit(pagination.limit).offset(offset);

    // Execute query
    const data = await query;

    const queryTime = Date.now() - startTime;
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      data: data as T[],
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        offset,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1
      },
      meta: {
        queryTime,
        cacheHit: false
      }
    };
  }

  async bulkUpdateRecords<T>(
    table: string,
    updates: import("@shared/data-management-types").BulkUpdateRequest<T>
  ): Promise<{ success: boolean; updated: number; errors: any[] }> {
    const tableMap: Record<string, any> = {
      plants,
      resources,
      capabilities,
      production_orders: productionOrders,
      vendors,
      customers,
      stock_items: stockItems
    };
    
    const dbTable = tableMap[table];
    if (!dbTable) {
      throw new Error(`Table ${table} not supported`);
    }

    const errors: any[] = [];
    let updated = 0;

    // Process updates in batches
    for (const update of updates.updates) {
      try {
        const result = await db
          .update(dbTable)
          .set({ ...update.data, updatedAt: new Date() })
          .where(eq(dbTable.id, update.id));
        
        if (result.rowCount && result.rowCount > 0) {
          updated++;
        }
      } catch (error) {
        errors.push({ id: update.id, error: error.message });
      }
    }

    return {
      success: errors.length === 0,
      updated,
      errors
    };
  }

  async bulkDeleteRecords(
    table: string,
    request: import("@shared/data-management-types").BulkDeleteRequest
  ): Promise<{ success: boolean; deleted: number; errors: any[] }> {
    const tableMap: Record<string, any> = {
      plants,
      resources,
      capabilities,
      production_orders: productionOrders,
      vendors,
      customers,
      stock_items: stockItems
    };
    
    const dbTable = tableMap[table];
    if (!dbTable) {
      throw new Error(`Table ${table} not supported`);
    }

    const errors: any[] = [];
    let deleted = 0;

    // Process deletions in batches
    for (const id of request.ids) {
      try {
        const result = await db.delete(dbTable).where(eq(dbTable.id, id));
        
        if (result.rowCount && result.rowCount > 0) {
          deleted++;
        }
      } catch (error) {
        errors.push({ id, error: error.message });
      }
    }

    return {
      success: errors.length === 0,
      deleted,
      errors
    };
  }

  // Enhanced pagination methods for specific data types
  async getPlantsWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<Plant>> {
    return this.getDataWithPagination<Plant>('plants', request);
  }

  async getResourcesWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<Resource>> {
    return this.getDataWithPagination<Resource>('resources', request);
  }

  async getCapabilitiesWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<Capability>> {
    return this.getDataWithPagination<Capability>('capabilities', request);
  }

  async getProductionOrdersWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<ProductionOrder>> {
    return this.getDataWithPagination<ProductionOrder>('production_orders', request);
  }

  async getOperationsWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<Operation>> {
    return this.getDataWithPagination<Operation>('operations', request);
  }

  async getVendorsWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<PTVendor>> {
    return this.getDataWithPagination<PTVendor>('ptvendors', request);
  }

  async getCustomersWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<Customer>> {
    return this.getDataWithPagination<Customer>('customers', request);
  }

  async getStockItemsWithPagination(request: import("@shared/data-management-types").DataRequest): Promise<import("@shared/data-management-types").DataResponse<StockItem>> {
    return this.getDataWithPagination<StockItem>('stock_items', request);
  }

  // User Secrets Management - for secure storage of API keys and sensitive data
  async getUserSecrets(userId: string): Promise<UserSecret[]> {
    return await db.select().from(userSecrets)
      .where(eq(userSecrets.userId, userId))
      .orderBy(userSecrets.category, userSecrets.name);
  }

  async getUserSecret(id: number): Promise<UserSecret | undefined> {
    const [secret] = await db.select().from(userSecrets)
      .where(eq(userSecrets.id, id));
    return secret;
  }

  async getUserSecretByKey(userId: string, key: string): Promise<UserSecret | undefined> {
    const [secret] = await db.select().from(userSecrets)
      .where(and(eq(userSecrets.userId, userId), eq(userSecrets.key, key)));
    return secret;
  }

  async createUserSecret(secret: InsertUserSecret): Promise<UserSecret> {
    const [newSecret] = await db.insert(userSecrets)
      .values(secret)
      .returning();
    return newSecret;
  }

  async updateUserSecret(id: number, secret: Partial<InsertUserSecret>): Promise<UserSecret | undefined> {
    const [updatedSecret] = await db.update(userSecrets)
      .set({ 
        ...secret, 
        updatedAt: new Date() 
      })
      .where(eq(userSecrets.id, id))
      .returning();
    return updatedSecret;
  }

  async deleteUserSecret(id: number): Promise<boolean> {
    const result = await db.delete(userSecrets)
      .where(eq(userSecrets.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateSecretLastUsed(id: number): Promise<void> {
    await db.update(userSecrets)
      .set({ lastUsed: new Date() })
      .where(eq(userSecrets.id, id));
  }

  // Algorithm Feedback Management
  async getAlgorithmFeedback(filters?: { algorithmName?: string; status?: string; severity?: string; category?: string; submittedBy?: number; plantId?: number }): Promise<AlgorithmFeedback[]> {
    let query = db.select().from(algorithmFeedback);
    
    const conditions = [];
    if (filters?.algorithmName) conditions.push(eq(algorithmFeedback.algorithmName, filters.algorithmName));
    if (filters?.status) conditions.push(eq(algorithmFeedback.status, filters.status));
    if (filters?.severity) conditions.push(eq(algorithmFeedback.severity, filters.severity));
    if (filters?.category) conditions.push(eq(algorithmFeedback.category, filters.category));
    if (filters?.submittedBy) conditions.push(eq(algorithmFeedback.submittedBy, filters.submittedBy));
    if (filters?.plantId) conditions.push(eq(algorithmFeedback.plantId, filters.plantId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(algorithmFeedback.createdAt));
  }

  async getAlgorithmFeedbackById(id: number): Promise<AlgorithmFeedback | undefined> {
    const [feedback] = await db.select().from(algorithmFeedback)
      .where(eq(algorithmFeedback.id, id));
    
    if (feedback) {
      // Update last viewed timestamp
      await db.update(algorithmFeedback)
        .set({ lastViewedAt: new Date() })
        .where(eq(algorithmFeedback.id, id));
    }
    
    return feedback || undefined;
  }

  async createAlgorithmFeedback(feedback: InsertAlgorithmFeedback): Promise<AlgorithmFeedback> {
    const [newFeedback] = await db.insert(algorithmFeedback)
      .values(feedback)
      .returning();
    return newFeedback;
  }

  async updateAlgorithmFeedback(id: number, updates: Partial<InsertAlgorithmFeedback>): Promise<AlgorithmFeedback | undefined> {
    const [updatedFeedback] = await db.update(algorithmFeedback)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(algorithmFeedback.id, id))
      .returning();
    return updatedFeedback || undefined;
  }

  async deleteAlgorithmFeedback(id: number): Promise<boolean> {
    const result = await db.delete(algorithmFeedback)
      .where(eq(algorithmFeedback.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getAlgorithmFeedbackByAlgorithm(algorithmName: string, algorithmVersion?: string): Promise<AlgorithmFeedback[]> {
    let query = db.select().from(algorithmFeedback)
      .where(eq(algorithmFeedback.algorithmName, algorithmName));
    
    if (algorithmVersion) {
      query = query.where(eq(algorithmFeedback.algorithmVersion, algorithmVersion));
    }
    
    return await query.orderBy(desc(algorithmFeedback.createdAt));
  }

  async getAlgorithmFeedbackByExecution(schedulingHistoryId?: number, algorithmPerformanceId?: number, optimizationRunId?: number): Promise<AlgorithmFeedback[]> {
    const conditions = [];
    if (schedulingHistoryId) conditions.push(eq(algorithmFeedback.schedulingHistoryId, schedulingHistoryId));
    if (algorithmPerformanceId) conditions.push(eq(algorithmFeedback.algorithmPerformanceId, algorithmPerformanceId));
    if (optimizationRunId) conditions.push(eq(algorithmFeedback.optimizationRunId, optimizationRunId));
    
    if (conditions.length === 0) return [];
    
    return await db.select().from(algorithmFeedback)
      .where(or(...conditions))
      .orderBy(desc(algorithmFeedback.createdAt));
  }

  async assignAlgorithmFeedback(id: number, assignedTo: number): Promise<AlgorithmFeedback | undefined> {
    const [updatedFeedback] = await db.update(algorithmFeedback)
      .set({ 
        assignedTo,
        status: 'in_progress',
        updatedAt: new Date()
      })
      .where(eq(algorithmFeedback.id, id))
      .returning();
    return updatedFeedback || undefined;
  }

  async resolveAlgorithmFeedback(id: number, resolvedBy: number, resolutionNotes: string): Promise<AlgorithmFeedback | undefined> {
    const [updatedFeedback] = await db.update(algorithmFeedback)
      .set({ 
        resolvedBy,
        resolutionNotes,
        resolvedAt: new Date(),
        status: 'resolved',
        updatedAt: new Date()
      })
      .where(eq(algorithmFeedback.id, id))
      .returning();
    return updatedFeedback || undefined;
  }

  async updateImplementationStatus(id: number, status: string, notes?: string, version?: string): Promise<AlgorithmFeedback | undefined> {
    const updates: any = { 
      implementationStatus: status,
      updatedAt: new Date()
    };
    
    if (notes) updates.implementationNotes = notes;
    if (version) updates.implementedInVersion = version;
    
    const [updatedFeedback] = await db.update(algorithmFeedback)
      .set(updates)
      .where(eq(algorithmFeedback.id, id))
      .returning();
    return updatedFeedback || undefined;
  }

  // Algorithm Feedback Comments
  async getAlgorithmFeedbackComments(feedbackId: number): Promise<AlgorithmFeedbackComment[]> {
    return await db.select().from(algorithmFeedbackComments)
      .where(eq(algorithmFeedbackComments.feedbackId, feedbackId))
      .orderBy(asc(algorithmFeedbackComments.createdAt));
  }

  async getAlgorithmFeedbackComment(id: number): Promise<AlgorithmFeedbackComment | undefined> {
    const [comment] = await db.select().from(algorithmFeedbackComments)
      .where(eq(algorithmFeedbackComments.id, id));
    return comment || undefined;
  }

  async createAlgorithmFeedbackComment(comment: InsertAlgorithmFeedbackComment): Promise<AlgorithmFeedbackComment> {
    const [newComment] = await db.insert(algorithmFeedbackComments)
      .values(comment)
      .returning();
    return newComment;
  }

  async updateAlgorithmFeedbackComment(id: number, updates: Partial<InsertAlgorithmFeedbackComment>): Promise<AlgorithmFeedbackComment | undefined> {
    const [updatedComment] = await db.update(algorithmFeedbackComments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(algorithmFeedbackComments.id, id))
      .returning();
    return updatedComment || undefined;
  }

  async deleteAlgorithmFeedbackComment(id: number): Promise<boolean> {
    const result = await db.delete(algorithmFeedbackComments)
      .where(eq(algorithmFeedbackComments.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Algorithm Feedback Voting
  async getAlgorithmFeedbackVotes(feedbackId: number): Promise<AlgorithmFeedbackVote[]> {
    return await db.select().from(algorithmFeedbackVotes)
      .where(eq(algorithmFeedbackVotes.feedbackId, feedbackId))
      .orderBy(desc(algorithmFeedbackVotes.createdAt));
  }

  async voteAlgorithmFeedback(feedbackId: number, userId: number, voteType: 'upvote' | 'downvote'): Promise<AlgorithmFeedbackVote> {
    // Remove existing vote if any
    await db.delete(algorithmFeedbackVotes)
      .where(and(
        eq(algorithmFeedbackVotes.feedbackId, feedbackId),
        eq(algorithmFeedbackVotes.userId, userId)
      ));
    
    // Add new vote
    const [vote] = await db.insert(algorithmFeedbackVotes)
      .values({ feedbackId, userId, voteType })
      .returning();
    
    // Update vote counts on feedback record
    const voteCounts = await this.getAlgorithmFeedbackVoteCounts(feedbackId);
    await db.update(algorithmFeedback)
      .set({ 
        upvotes: voteCounts.upvotes,
        downvotes: voteCounts.downvotes,
        updatedAt: new Date()
      })
      .where(eq(algorithmFeedback.id, feedbackId));
    
    return vote;
  }

  async removeAlgorithmFeedbackVote(feedbackId: number, userId: number): Promise<boolean> {
    const result = await db.delete(algorithmFeedbackVotes)
      .where(and(
        eq(algorithmFeedbackVotes.feedbackId, feedbackId),
        eq(algorithmFeedbackVotes.userId, userId)
      ));
    
    // Update vote counts on feedback record
    const voteCounts = await this.getAlgorithmFeedbackVoteCounts(feedbackId);
    await db.update(algorithmFeedback)
      .set({ 
        upvotes: voteCounts.upvotes,
        downvotes: voteCounts.downvotes,
        updatedAt: new Date()
      })
      .where(eq(algorithmFeedback.id, feedbackId));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getAlgorithmFeedbackVoteCounts(feedbackId: number): Promise<{ upvotes: number; downvotes: number }> {
    const votes = await db.select().from(algorithmFeedbackVotes)
      .where(eq(algorithmFeedbackVotes.feedbackId, feedbackId));
    
    const upvotes = votes.filter(v => v.voteType === 'upvote').length;
    const downvotes = votes.filter(v => v.voteType === 'downvote').length;
    
    return { upvotes, downvotes };
  }

  // Field Comments Management
  async getFieldComments(tableName?: string): Promise<FieldComment[]> {
    let query = db.select().from(fieldComments);
    
    if (tableName) {
      query = query.where(eq(fieldComments.tableName, tableName));
    }
    
    return await query.orderBy(asc(fieldComments.tableName), asc(fieldComments.columnName));
  }

  async getFieldComment(tableName: string, columnName: string): Promise<FieldComment | undefined> {
    const [comment] = await db
      .select()
      .from(fieldComments)
      .where(and(
        eq(fieldComments.tableName, tableName),
        eq(fieldComments.columnName, columnName)
      ));
    return comment;
  }

  async createFieldComment(comment: InsertFieldComment): Promise<FieldComment> {
    const [newComment] = await db
      .insert(fieldComments)
      .values({
        ...comment,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newComment;
  }

  async updateFieldComment(tableName: string, columnName: string, updates: Partial<InsertFieldComment>): Promise<FieldComment | undefined> {
    const [comment] = await db
      .update(fieldComments)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(and(
        eq(fieldComments.tableName, tableName),
        eq(fieldComments.columnName, columnName)
      ))
      .returning();
    return comment;
  }

  async deleteFieldComment(tableName: string, columnName: string): Promise<boolean> {
    const result = await db.delete(fieldComments)
      .where(and(
        eq(fieldComments.tableName, tableName),
        eq(fieldComments.columnName, columnName)
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ==================== CONSTRAINTS MANAGEMENT IMPLEMENTATION ====================

  // Constraint Categories
  async getConstraintCategories(): Promise<ConstraintCategory[]> {
    return await db.select().from(constraintCategories)
      .where(eq(constraintCategories.isActive, true))
      .orderBy(constraintCategories.name);
  }

  async getConstraintCategory(id: number): Promise<ConstraintCategory | undefined> {
    const [category] = await db.select().from(constraintCategories)
      .where(eq(constraintCategories.id, id));
    return category || undefined;
  }

  async createConstraintCategory(category: InsertConstraintCategory): Promise<ConstraintCategory> {
    const [newCategory] = await db.insert(constraintCategories).values(category).returning();
    return newCategory;
  }

  async updateConstraintCategory(id: number, category: Partial<InsertConstraintCategory>): Promise<ConstraintCategory | undefined> {
    const [updated] = await db.update(constraintCategories)
      .set(category)
      .where(eq(constraintCategories.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteConstraintCategory(id: number): Promise<boolean> {
    const result = await db.delete(constraintCategories).where(eq(constraintCategories.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Constraints
  async getConstraints(categoryId?: number, scope?: string, isActive?: boolean): Promise<Constraint[]> {
    let query = db.select().from(constraints);
    
    const conditions: any[] = [];
    if (categoryId !== undefined) conditions.push(eq(constraints.categoryId, categoryId));
    if (scope !== undefined) conditions.push(eq(constraints.scope, scope));
    if (isActive !== undefined) conditions.push(eq(constraints.isActive, isActive));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(constraints.priority, constraints.name);
  }

  async getConstraint(id: number): Promise<Constraint | undefined> {
    const [constraint] = await db.select().from(constraints)
      .where(eq(constraints.id, id));
    return constraint || undefined;
  }

  async getConstraintsByEntity(entityType: string, entityId: number): Promise<Constraint[]> {
    const conditions: any[] = [eq(constraints.isActive, true)];
    
    // Add entity-specific conditions based on scope
    if (entityType === 'plant') {
      conditions.push(
        or(
          eq(constraints.scope, 'global'),
          eq(constraints.scope, 'plant'),
          eq(constraints.applicableToPlantId, entityId)
        )
      );
    } else if (entityType === 'resource') {
      conditions.push(
        or(
          eq(constraints.scope, 'global'),
          eq(constraints.scope, 'resource'),
          eq(constraints.applicableToResourceId, entityId)
        )
      );
    } else if (entityType === 'item') {
      conditions.push(
        or(
          eq(constraints.scope, 'global'),
          eq(constraints.scope, 'item'),
          eq(constraints.applicableToItemId, entityId)
        )
      );
    }
    
    return await db.select().from(constraints)
      .where(and(...conditions))
      .orderBy(constraints.severityLevel, constraints.priority);
  }

  async createConstraint(constraint: InsertConstraint): Promise<Constraint> {
    const [newConstraint] = await db.insert(constraints).values(constraint).returning();
    return newConstraint;
  }

  async updateConstraint(id: number, constraint: Partial<InsertConstraint>): Promise<Constraint | undefined> {
    const [updated] = await db.update(constraints)
      .set({
        ...constraint,
        updatedAt: new Date(),
      })
      .where(eq(constraints.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteConstraint(id: number): Promise<boolean> {
    const result = await db.delete(constraints).where(eq(constraints.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Constraint Violations
  async getConstraintViolations(constraintId?: number, status?: string): Promise<ConstraintViolation[]> {
    let query = db.select().from(constraintViolations);
    
    const conditions: any[] = [];
    if (constraintId !== undefined) conditions.push(eq(constraintViolations.constraintId, constraintId));
    if (status !== undefined) conditions.push(eq(constraintViolations.status, status));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(constraintViolations.violationTimestamp));
  }

  async getConstraintViolation(id: number): Promise<ConstraintViolation | undefined> {
    const [violation] = await db.select().from(constraintViolations)
      .where(eq(constraintViolations.id, id));
    return violation || undefined;
  }

  async getViolationsByEntity(entityType: string, entityId: number): Promise<ConstraintViolation[]> {
    return await db.select().from(constraintViolations)
      .where(
        and(
          eq(constraintViolations.violationEntityType, entityType),
          eq(constraintViolations.violationEntityId, entityId)
        )
      )
      .orderBy(desc(constraintViolations.violationTimestamp));
  }

  async createConstraintViolation(violation: InsertConstraintViolation): Promise<ConstraintViolation> {
    const [newViolation] = await db.insert(constraintViolations).values(violation).returning();
    return newViolation;
  }

  async updateConstraintViolation(id: number, violation: Partial<InsertConstraintViolation>): Promise<ConstraintViolation | undefined> {
    const [updated] = await db.update(constraintViolations)
      .set({
        ...violation,
        updatedAt: new Date(),
      })
      .where(eq(constraintViolations.id, id))
      .returning();
    return updated || undefined;
  }

  async resolveConstraintViolation(id: number, resolution: string, resolvedBy: number): Promise<ConstraintViolation | undefined> {
    const [updated] = await db.update(constraintViolations)
      .set({
        status: 'resolved',
        resolution,
        resolvedBy,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(constraintViolations.id, id))
      .returning();
    return updated || undefined;
  }

  async waiveConstraintViolation(id: number, reason: string, approvedBy: number): Promise<ConstraintViolation | undefined> {
    const [updated] = await db.update(constraintViolations)
      .set({
        status: 'waived',
        waiverReason: reason,
        waiverApprovedBy: approvedBy,
        updatedAt: new Date(),
      })
      .where(eq(constraintViolations.id, id))
      .returning();
    return updated || undefined;
  }

  // Constraint Exceptions
  async getConstraintExceptions(constraintId?: number, isActive?: boolean): Promise<ConstraintException[]> {
    let query = db.select().from(constraintExceptions);
    
    const conditions: any[] = [];
    if (constraintId !== undefined) conditions.push(eq(constraintExceptions.constraintId, constraintId));
    if (isActive !== undefined) conditions.push(eq(constraintExceptions.isActive, isActive));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(constraintExceptions.createdAt));
  }

  async getConstraintException(id: number): Promise<ConstraintException | undefined> {
    const [exception] = await db.select().from(constraintExceptions)
      .where(eq(constraintExceptions.id, id));
    return exception || undefined;
  }

  async createConstraintException(exception: InsertConstraintException): Promise<ConstraintException> {
    const [newException] = await db.insert(constraintExceptions).values(exception).returning();
    return newException;
  }

  async updateConstraintException(id: number, exception: Partial<InsertConstraintException>): Promise<ConstraintException | undefined> {
    const [updated] = await db.update(constraintExceptions)
      .set(exception)
      .where(eq(constraintExceptions.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteConstraintException(id: number): Promise<boolean> {
    const result = await db.delete(constraintExceptions).where(eq(constraintExceptions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Constraint Monitoring and Evaluation
  async evaluateConstraints(entityType: string, entityId: number, data: any): Promise<ConstraintViolation[]> {
    // Get applicable constraints for the entity
    const applicableConstraints = await this.getConstraintsByEntity(entityType, entityId);
    const violations: ConstraintViolation[] = [];

    // Evaluate each constraint against the provided data
    for (const constraint of applicableConstraints) {
      const rule = constraint.constraintRule;
      if (!rule) continue;

      let violated = false;
      let violationValue: any;
      let expectedValue: any = rule.value;

      // Extract the field value from data
      const fieldValue = this.extractFieldValue(data, rule.field);
      violationValue = fieldValue;

      // Evaluate based on operator
      switch (rule.operator) {
        case '=':
          violated = fieldValue != rule.value;
          break;
        case '!=':
          violated = fieldValue == rule.value;
          break;
        case '<':
          violated = fieldValue >= rule.value;
          break;
        case '>':
          violated = fieldValue <= rule.value;
          break;
        case '<=':
          violated = fieldValue > rule.value;
          break;
        case '>=':
          violated = fieldValue < rule.value;
          break;
        case 'between':
          if (Array.isArray(rule.value) && rule.value.length === 2) {
            violated = fieldValue < rule.value[0] || fieldValue > rule.value[1];
          }
          break;
        case 'in':
          if (Array.isArray(rule.value)) {
            violated = !rule.value.includes(fieldValue);
          }
          break;
        case 'not_in':
          if (Array.isArray(rule.value)) {
            violated = rule.value.includes(fieldValue);
          }
          break;
      }

      // If constraint is violated, create violation record
      if (violated) {
        const severity = constraint.severityLevel === 'hard' ? 'critical' : 
                        constraint.priority === 'high' ? 'major' : 'minor';

        const violation = await this.createConstraintViolation({
          constraintId: constraint.id,
          violationEntityType: entityType,
          violationEntityId: entityId,
          violationValue,
          expectedValue,
          violationSeverity: severity,
          impactDescription: `Constraint "${constraint.name}" violated: ${rule.field} ${rule.operator} ${expectedValue}, actual value: ${violationValue}`,
        });

        violations.push(violation);
      }
    }

    return violations;
  }

  private extractFieldValue(data: any, field: string): any {
    // Handle nested field paths like "resource.capacity" or "schedule.duration"
    const fieldPath = field.split('.');
    let value = data;
    
    for (const key of fieldPath) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  async getConstraintViolationsSummary(): Promise<{
    total: number;
    critical: number;
    major: number;
    minor: number;
    open: number;
    resolved: number;
  }> {
    const allViolations = await db.select().from(constraintViolations);
    
    const summary = {
      total: allViolations.length,
      critical: allViolations.filter(v => v.violationSeverity === 'critical').length,
      major: allViolations.filter(v => v.violationSeverity === 'major').length,
      minor: allViolations.filter(v => v.violationSeverity === 'minor').length,
      open: allViolations.filter(v => v.status === 'open').length,
      resolved: allViolations.filter(v => v.status === 'resolved').length,
    };

    return summary;
  }

  // TOC Drum Management Implementation
  async updateResourceDrumStatus(
    resourceId: number, 
    isDrum: boolean, 
    reason: string, 
    method: 'manual' | 'automated'
  ): Promise<Resource> {
    // Update the resource drum status
    const [updatedResource] = await db
      .update(resources)
      .set({ 
        isDrum,
        drumUpdatedAt: new Date(),
        drumUpdatedBy: method === 'manual' ? 'User' : 'System'
      })
      .where(eq(ptResources.id, resourceId))
      .returning();

    if (!updatedResource) {
      throw new Error('Resource not found');
    }

    // Record the drum designation change in history
    await db.insert(drumAnalysisHistory).values({
      analysisType: method,
      resourcesAnalyzed: 1,
      drumsIdentified: isDrum ? 1 : 0,
      drumsUpdated: 1,
      analysisMetrics: {
        resourceId,
        resourceName: updatedResource.name,
        isDrum,
        reason,
        method
      },
      recommendations: [{
        resourceId,
        resourceName: updatedResource.name,
        score: isDrum ? 100 : 0,
        recommendation: reason
      }],
      performedBy: method === 'manual' ? 'User' : 'System',
      analysisStatus: 'completed'
    });

    return updatedResource;
  }

  async getDrumAnalysisHistory(): Promise<any[]> {
    return await db
      .select()
      .from(drumAnalysisHistory)
      .orderBy(desc(drumAnalysisHistory.createdAt))
      .limit(100);
  }

  async getDrumAnalysisHistory(): Promise<any[]> {
    const analysis = await db
      .select({
        id: drumAnalysisHistory.id,
        analysisDate: drumAnalysisHistory.analysisDate,
        analysisType: drumAnalysisHistory.analysisType,
        analyzedBy: sql`1`.as('analyzedBy'),
        drumResourceId: drumAnalysisHistory.resourceId,
        resourceName: resources.name,
        bottleneckScore: drumAnalysisHistory.bottleneckScore,
        utilizationPercent: drumAnalysisHistory.utilizationPercentage,
        operationCount: sql`0`.as('operationCount'),
        totalDuration: sql`0`.as('totalDuration'),
        recommendations: drumAnalysisHistory.recommendation
      })
      .from(drumAnalysisHistory)
      .leftJoin(resources, eq(drumAnalysisHistory.resourceId, resources.id))
      .orderBy(desc(drumAnalysisHistory.analysisDate))
      .limit(50);

    return analysis;
  }

  async runDrumAnalysis(): Promise<{
    analyzed: number;
    identified: number;
    updated: number;
    recommendations: Array<{
      resourceId: number;
      resourceName: string;
      score: number;
      recommendation: string;
    }>;
  }> {
    // Get all resources
    const allResources = await db.select().from(ptResources);
    
    // Get resource utilization data
    const resourceUtilization = await db
      .select({
        resourceId: operations.resourceId,
        operationCount: sql`count(*)`.as('operationCount'),
        totalDuration: sql`sum(operations.duration)`.as('totalDuration'),
        avgDuration: sql`avg(operations.duration)`.as('avgDuration')
      })
      .from(operations)
      .where(isNotNull(operations.resourceId))
      .groupBy(operations.resourceId);

    // Map utilization data
    const utilizationMap = new Map(
      resourceUtilization.map(u => [u.resourceId, u])
    );

    // Analyze each resource
    const recommendations: Array<{
      resourceId: number;
      resourceName: string;
      score: number;
      recommendation: string;
    }> = [];

    let drumsIdentified = 0;
    let drumsUpdated = 0;

    for (const resource of allResources) {
      const utilization = utilizationMap.get(resource.id);
      let score = 0;
      let recommendation = '';

      if (utilization) {
        // Calculate bottleneck score based on utilization metrics
        const opCount = Number(utilization.operationCount) || 0;
        const totalDur = Number(utilization.totalDuration) || 0;
        const avgDur = Number(utilization.avgDuration) || 0;

        // High operation count indicates potential bottleneck
        if (opCount > 50) score += 30;
        else if (opCount > 20) score += 20;
        else if (opCount > 10) score += 10;

        // Long average duration indicates potential bottleneck
        if (avgDur > 120) score += 40;
        else if (avgDur > 60) score += 30;
        else if (avgDur > 30) score += 20;

        // Total duration utilization
        if (totalDur > 1000) score += 30;
        else if (totalDur > 500) score += 20;
        else if (totalDur > 100) score += 10;

        // Generate recommendation
        if (score >= 70) {
          recommendation = `High bottleneck score (${score}): ${opCount} operations, ${avgDur.toFixed(0)}min avg duration`;
          drumsIdentified++;
          
          // Update resource as drum if score is high enough
          if (!resource.isDrum && score >= 70) {
            await db
              .update(resources)
              .set({ 
                isDrum: true,
                drumDesignationDate: new Date(),
                drumDesignationReason: `High bottleneck score (${score})`,
                drumDesignationMethod: 'automated'
              })
              .where(eq(ptResources.id, resource.id));
            drumsUpdated++;
          }
        } else if (score >= 50) {
          recommendation = `Moderate utilization (score: ${score}): Monitor for potential constraints`;
        } else {
          recommendation = `Low utilization (score: ${score}): Not a bottleneck`;
          
          // Remove drum designation if score is too low
          if (resource.isDrum && score < 30) {
            await db
              .update(resources)
              .set({ 
                isDrum: false,
                drumDesignationDate: new Date(),
                drumDesignationReason: `Low bottleneck score (${score})`,
                drumDesignationMethod: 'automated'
              })
              .where(eq(ptResources.id, resource.id));
            drumsUpdated++;
          }
        }
      } else {
        recommendation = 'No utilization data available';
      }

      recommendations.push({
        resourceId: resource.id,
        resourceName: resource.name,
        score,
        recommendation
      });
    }

    // Record analysis in history
    await db.insert(drumAnalysisHistory).values({
      analysisType: 'automated',
      resourceId: null, // No specific resource for bulk analysis
      utilizationPercentage: '70',
      bottleneckScore: '0',
      recommendation: `Analyzed ${allResources.length} resources, identified ${drumsIdentified} drums`,
      isCurrentBottleneck: false
    });

    return {
      analyzed: allResources.length,
      identified: drumsIdentified,
      updated: drumsUpdated,
      recommendations: recommendations.sort((a, b) => b.score - a.score).slice(0, 10)
    };
  }

  async getDrumResources(): Promise<any[]> {
    // Get all resources that are designated as drums
    const drumResources = await db
      .select({
        id: resources.id,
        resourceId: resources.id,
        resourceName: resources.name,
        isDrum: resources.isDrum,
        isManual: sql`CASE WHEN ${resources.drumDesignationMethod} = 'manual' THEN true ELSE false END`.as('isManual'),
        drumType: sql`COALESCE(${resources.drumDesignationMethod}, 'primary')`.as('drumType'),
        designatedAt: resources.drumDesignationDate,
        designatedBy: sql`1`.as('designatedBy'), // Default user
        reason: sql`COALESCE(${resources.drumDesignationReason}, 'Manual designation')`.as('reason'),
        utilization: sql`COALESCE(${resources.utilization}, 0)`.as('utilization')
      })
      .from(ptResources)
      .where(eq(ptResources.isDrum, true));

    return drumResources;
  }

  async designateResourceAsDrum(resourceId: number, drumType: string, reason?: string, userId?: number): Promise<any> {
    // Update the resource as a drum
    const [updatedResource] = await db
      .update(resources)
      .set({ 
        isDrum: true,
        drumDesignationDate: new Date(),
        drumDesignationReason: reason || 'Manual designation',
        drumDesignationMethod: 'manual'
      })
      .where(eq(ptResources.id, resourceId))
      .returning();

    if (!updatedResource) {
      throw new Error('Resource not found');
    }

    // Record the drum designation in history
    await db.insert(drumAnalysisHistory).values({
      analysisType: 'manual',
      resourceId: resourceId,
      utilizationPercentage: '95',
      bottleneckScore: '100',
      recommendation: reason || `Manually designated as ${drumType} drum`,
      isCurrentBottleneck: true
    });

    return {
      id: updatedResource.id,
      resourceId: updatedResource.id,
      resourceName: updatedResource.name,
      isDrum: true,
      isManual: true,
      drumType,
      designatedAt: updatedResource.drumDesignationDate,
      designatedBy: userId || 1,
      reason: reason || 'Manual designation'
    };
  }

  // TOC Buffer Management Implementation
  // Buffer Definitions
  async getBufferDefinitions(bufferType?: string, bufferCategory?: string, isActive?: boolean): Promise<BufferDefinition[]> {
    let query = db.select().from(bufferDefinitions);
    
    const conditions: any[] = [];
    if (bufferType) conditions.push(eq(bufferDefinitions.bufferType, bufferType));
    if (bufferCategory) conditions.push(eq(bufferDefinitions.bufferCategory, bufferCategory));
    if (isActive !== undefined) conditions.push(eq(bufferDefinitions.isActive, isActive));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query;
  }

  async getBufferDefinition(id: number): Promise<BufferDefinition | undefined> {
    const [buffer] = await db.select().from(bufferDefinitions).where(eq(bufferDefinitions.id, id));
    return buffer || undefined;
  }

  async getBufferDefinitionsByLocation(entityType: string, entityId: number): Promise<BufferDefinition[]> {
    return await db.select().from(bufferDefinitions)
      .where(
        and(
          eq(bufferDefinitions.locationEntityType, entityType),
          eq(bufferDefinitions.locationEntityId, entityId)
        )
      );
  }

  async createBufferDefinition(buffer: InsertBufferDefinition): Promise<BufferDefinition> {
    const [newBuffer] = await db.insert(bufferDefinitions).values(buffer).returning();
    return newBuffer;
  }

  async updateBufferDefinition(id: number, buffer: Partial<InsertBufferDefinition>): Promise<BufferDefinition | undefined> {
    const [updated] = await db.update(bufferDefinitions)
      .set({
        ...buffer,
        updatedAt: new Date(),
      })
      .where(eq(bufferDefinitions.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBufferDefinition(id: number): Promise<boolean> {
    const result = await db.delete(bufferDefinitions).where(eq(bufferDefinitions.id, id));
    return result.rowCount > 0;
  }

  // Buffer Consumption
  async getBufferConsumption(bufferDefinitionId?: number, currentZone?: string): Promise<BufferConsumption[]> {
    let query = db.select().from(bufferConsumption);
    
    const conditions: any[] = [];
    if (bufferDefinitionId) conditions.push(eq(bufferConsumption.bufferDefinitionId, bufferDefinitionId));
    if (currentZone) conditions.push(eq(bufferConsumption.currentZone, currentZone));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(bufferConsumption.measurementTimestamp));
  }

  async getLatestBufferConsumption(bufferDefinitionId: number): Promise<BufferConsumption | undefined> {
    const [latest] = await db.select().from(bufferConsumption)
      .where(eq(bufferConsumption.bufferDefinitionId, bufferDefinitionId))
      .orderBy(desc(bufferConsumption.measurementTimestamp))
      .limit(1);
    return latest || undefined;
  }

  async createBufferConsumption(consumption: InsertBufferConsumption): Promise<BufferConsumption> {
    const [newConsumption] = await db.insert(bufferConsumption).values(consumption).returning();
    return newConsumption;
  }

  async updateBufferConsumption(id: number, consumption: Partial<InsertBufferConsumption>): Promise<BufferConsumption | undefined> {
    const [updated] = await db.update(bufferConsumption)
      .set(consumption)
      .where(eq(bufferConsumption.id, id))
      .returning();
    return updated || undefined;
  }

  // Custom Constraints Management for TOC
  async getCustomConstraints(filters?: { 
    isActive?: boolean; 
    constraintType?: string; 
    severity?: string; 
    category?: string 
  }): Promise<CustomConstraint[]> {
    let query = db.select().from(customConstraints);
    
    const conditions: any[] = [];
    if (filters?.isActive !== undefined) conditions.push(eq(customConstraints.isActive, filters.isActive));
    if (filters?.constraintType) conditions.push(eq(customConstraints.constraintType, filters.constraintType));
    if (filters?.severity) conditions.push(eq(customConstraints.severity, filters.severity));
    if (filters?.category) conditions.push(eq(customConstraints.category, filters.category));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(customConstraints.createdAt));
  }

  async getCustomConstraint(id: number): Promise<CustomConstraint | undefined> {
    const [constraint] = await db.select().from(customConstraints).where(eq(customConstraints.id, id));
    return constraint || undefined;
  }

  async createCustomConstraint(constraint: InsertCustomConstraint): Promise<CustomConstraint> {
    const [newConstraint] = await db.insert(customConstraints).values(constraint).returning();
    return newConstraint;
  }

  async updateCustomConstraint(id: number, constraint: Partial<InsertCustomConstraint>): Promise<CustomConstraint | undefined> {
    const [updated] = await db.update(customConstraints)
      .set({
        ...constraint,
        updatedAt: new Date(),
      })
      .where(eq(customConstraints.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCustomConstraint(id: number): Promise<boolean> {
    const result = await db.delete(customConstraints).where(eq(customConstraints.id, id));
    return result.rowCount > 0;
  }

  async recordConstraintViolation(constraintId: number): Promise<void> {
    await db.update(customConstraints)
      .set({
        currentViolationCount: sql`${customConstraints.currentViolationCount} + 1`,
        lastViolationDate: new Date(),
      })
      .where(eq(customConstraints.id, constraintId));
  }

  async updateBufferLevel(
    bufferDefinitionId: number, 
    newLevel: number, 
    consumingEntity?: { type: string; id: number }
  ): Promise<BufferConsumption> {
    // Get buffer definition to calculate zones
    const buffer = await this.getBufferDefinition(bufferDefinitionId);
    if (!buffer) throw new Error('Buffer definition not found');

    const targetSize = Number(buffer.targetSize);
    const redZone = Number(buffer.redZonePercent) / 100;
    const yellowZone = Number(buffer.yellowZonePercent) / 100;
    
    // Calculate current zone
    const levelPercent = newLevel / targetSize;
    let currentZone: string;
    let alertStatus = 'normal';
    let penetrationIntoRed = 0;

    if (levelPercent <= redZone) {
      currentZone = 'red';
      alertStatus = 'critical';
      penetrationIntoRed = ((redZone - levelPercent) / redZone) * 100;
    } else if (levelPercent <= redZone + yellowZone) {
      currentZone = 'yellow';
      alertStatus = 'warning';
    } else {
      currentZone = 'green';
    }

    // Get previous consumption to calculate rate
    const previousConsumption = await this.getLatestBufferConsumption(bufferDefinitionId);
    let consumptionRate = 0;
    
    if (previousConsumption) {
      const timeDiff = Date.now() - new Date(previousConsumption.measurementTimestamp).getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      if (hoursDiff > 0) {
        consumptionRate = (Number(previousConsumption.currentLevel) - newLevel) / hoursDiff;
      }
    }

    // Create new consumption record
    const newConsumption = await this.createBufferConsumption({
      bufferDefinitionId,
      currentLevel: newLevel,
      currentZone,
      consumptionRate,
      consumingEntityType: consumingEntity?.type,
      consumingEntityId: consumingEntity?.id,
      penetrationIntoRed,
      alertStatus,
      actionRequired: alertStatus === 'critical' ? 'Expedite replenishment' : 
                     alertStatus === 'warning' ? 'Monitor closely' : null,
    });

    // Record event in history if zone changed
    if (previousConsumption && previousConsumption.currentZone !== currentZone) {
      await this.createBufferManagementHistory({
        bufferDefinitionId,
        eventType: 'penetration',
        eventDescription: `Buffer zone changed from ${previousConsumption.currentZone} to ${currentZone}`,
        levelBefore: previousConsumption.currentLevel,
        levelAfter: newLevel,
        zoneBefore: previousConsumption.currentZone,
        zoneAfter: currentZone,
        impactSeverity: currentZone === 'red' ? 'critical' : currentZone === 'yellow' ? 'medium' : 'low',
      });
    }

    return newConsumption;
  }

  // Buffer Management History
  async getBufferManagementHistory(bufferDefinitionId?: number, eventType?: string): Promise<BufferManagementHistory[]> {
    let query = db.select().from(bufferManagementHistory);
    
    const conditions: any[] = [];
    if (bufferDefinitionId) conditions.push(eq(bufferManagementHistory.bufferDefinitionId, bufferDefinitionId));
    if (eventType) conditions.push(eq(bufferManagementHistory.eventType, eventType));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(bufferManagementHistory.eventTimestamp));
  }

  async createBufferManagementHistory(history: InsertBufferManagementHistory): Promise<BufferManagementHistory> {
    const [newHistory] = await db.insert(bufferManagementHistory).values(history).returning();
    return newHistory;
  }

  // Buffer Policies
  async getBufferPolicies(policyType?: string, isActive?: boolean): Promise<BufferPolicy[]> {
    let query = db.select().from(bufferPolicies);
    
    const conditions: any[] = [];
    if (policyType) conditions.push(eq(bufferPolicies.policyType, policyType));
    if (isActive !== undefined) conditions.push(eq(bufferPolicies.isActive, isActive));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query;
  }

  async getBufferPolicy(id: number): Promise<BufferPolicy | undefined> {
    const [policy] = await db.select().from(bufferPolicies).where(eq(bufferPolicies.id, id));
    return policy || undefined;
  }

  async createBufferPolicy(policy: InsertBufferPolicy): Promise<BufferPolicy> {
    const [newPolicy] = await db.insert(bufferPolicies).values(policy).returning();
    return newPolicy;
  }

  async updateBufferPolicy(id: number, policy: Partial<InsertBufferPolicy>): Promise<BufferPolicy | undefined> {
    const [updated] = await db.update(bufferPolicies)
      .set({
        ...policy,
        updatedAt: new Date(),
      })
      .where(eq(bufferPolicies.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBufferPolicy(id: number): Promise<boolean> {
    const result = await db.delete(bufferPolicies).where(eq(bufferPolicies.id, id));
    return result.rowCount > 0;
  }

  // Buffer Analysis and Monitoring
  async analyzeBufferHealth(bufferDefinitionId: number): Promise<{
    currentStatus: string;
    penetrationHistory: Array<{ timestamp: Date; penetration: number }>;
    recommendations: string[];
    projectedExhaustion: Date | null;
  }> {
    // Get recent consumption history
    const consumptionHistory = await db.select().from(bufferConsumption)
      .where(eq(bufferConsumption.bufferDefinitionId, bufferDefinitionId))
      .orderBy(desc(bufferConsumption.measurementTimestamp))
      .limit(100);

    if (consumptionHistory.length === 0) {
      return {
        currentStatus: 'No data available',
        penetrationHistory: [],
        recommendations: ['Start monitoring buffer consumption'],
        projectedExhaustion: null,
      };
    }

    const latest = consumptionHistory[0];
    const currentStatus = `Zone: ${latest.currentZone}, Level: ${latest.currentLevel}, Alert: ${latest.alertStatus}`;

    // Calculate penetration history
    const penetrationHistory = consumptionHistory
      .filter(c => c.penetrationIntoRed && Number(c.penetrationIntoRed) > 0)
      .map(c => ({
        timestamp: new Date(c.measurementTimestamp),
        penetration: Number(c.penetrationIntoRed),
      }));

    // Generate recommendations
    const recommendations: string[] = [];
    if (latest.currentZone === 'red') {
      recommendations.push('URGENT: Expedite replenishment immediately');
      recommendations.push('Review and adjust buffer size if red zone penetrations are frequent');
    } else if (latest.currentZone === 'yellow') {
      recommendations.push('Monitor consumption closely');
      recommendations.push('Prepare for potential replenishment');
    }

    // Calculate projected exhaustion
    let projectedExhaustion: Date | null = null;
    if (latest.consumptionRate && Number(latest.consumptionRate) > 0) {
      const hoursToExhaustion = Number(latest.currentLevel) / Number(latest.consumptionRate);
      projectedExhaustion = new Date(Date.now() + hoursToExhaustion * 60 * 60 * 1000);
    }

    return {
      currentStatus,
      penetrationHistory,
      recommendations,
      projectedExhaustion,
    };
  }

  async getBufferAlerts(): Promise<Array<{
    bufferId: number;
    bufferName: string;
    alertType: string;
    severity: string;
    message: string;
  }>> {
    // Get all buffers with critical or warning status
    const criticalBuffers = await db.select({
      bufferId: bufferDefinitions.id,
      bufferName: bufferDefinitions.name,
      alertStatus: bufferConsumption.alertStatus,
      currentZone: bufferConsumption.currentZone,
      currentLevel: bufferConsumption.currentLevel,
      penetrationIntoRed: bufferConsumption.penetrationIntoRed,
    })
    .from(bufferConsumption)
    .innerJoin(bufferDefinitions, eq(bufferConsumption.bufferDefinitionId, bufferDefinitions.id))
    .where(
      and(
        inArray(bufferConsumption.alertStatus, ['warning', 'critical', 'emergency']),
        eq(bufferDefinitions.isActive, true)
      )
    );

    return criticalBuffers.map(buffer => ({
      bufferId: buffer.bufferId,
      bufferName: buffer.bufferName,
      alertType: buffer.currentZone === 'red' ? 'penetration' : 'warning',
      severity: buffer.alertStatus,
      message: buffer.currentZone === 'red' 
        ? `Buffer in RED zone with ${buffer.penetrationIntoRed?.toFixed(1)}% penetration`
        : `Buffer in ${buffer.currentZone.toUpperCase()} zone - monitoring required`,
    }));
  }

  // Alerts
  async getAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).orderBy(alerts.createdAt);
  }

  // Sales Orders
  async getSalesOrders(): Promise<SalesOrder[]> {
    return await db.select().from(salesOrders).orderBy(salesOrders.orderNumber);
  }

  async getSalesOrder(id: number): Promise<SalesOrder | undefined> {
    const [order] = await db.select()
      .from(salesOrders)
      .leftJoin(customers, eq(salesOrders.customerId, customers.id))
      .where(eq(salesOrders.id, id))
      .limit(1);
    
    if (!order) return undefined;

    return {
      ...order.sales_orders,
      customerName: order.customers?.customerName,
    };
  }

  async searchSalesOrdersByNumber(searchTerm: string): Promise<SalesOrder[]> {
    const orders = await db.select()
      .from(salesOrders)
      .leftJoin(customers, eq(salesOrders.customerId, customers.id))
      .where(ilike(salesOrders.orderNumber, `%${searchTerm}%`))
      .limit(20);

    return orders.map(order => ({
      ...order.sales_orders,
      customerName: order.customers?.customerName,
    }));
  }

  async searchSalesOrdersByCustomer(searchTerm: string): Promise<SalesOrder[]> {
    const orders = await db.select()
      .from(salesOrders)
      .leftJoin(customers, eq(salesOrders.customerId, customers.id))
      .where(ilike(customers.customerName, `%${searchTerm}%`))
      .limit(20);

    return orders.map(order => ({
      ...order.sales_orders,
      customerName: order.customers?.customerName,
    }));
  }

  async searchSalesOrdersByProduct(searchTerm: string): Promise<SalesOrder[]> {
    // Since product info is in sales order lines, this would require joining with sales order lines
    // For now, return empty array as this would need the item/product table structure
    return [];
  }

  // Database Schema
  async getDatabaseSchema(): Promise<any[]> {
    // Check cache first
    if (this.schemaCache && Date.now() - this.schemaCache.timestamp < this.SCHEMA_CACHE_TTL) {
      return this.schemaCache.data;
    }

    try {
      // Query PostgreSQL information schema to get all tables with their columns
      const tablesResult = await db.execute(sql`
        SELECT 
          t.table_name,
          t.table_schema
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
      `);

      const columnsResult = await db.execute(sql`
        SELECT 
          c.table_name,
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
        ORDER BY c.table_name, c.ordinal_position
      `);

      // Get primary keys
      const primaryKeysResult = await db.execute(sql`
        SELECT 
          tc.table_name,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
      `);

      // Get foreign keys
      const foreignKeysResult = await db.execute(sql`
        SELECT
          tc.table_name as from_table,
          kcu.column_name as from_column,
          ccu.table_name as to_table,
          ccu.column_name as to_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
      `);

      // Process the results to build schema structure
      const tables = tablesResult.rows;
      const columns = columnsResult.rows;
      const primaryKeys = primaryKeysResult.rows;
      const foreignKeys = foreignKeysResult.rows;

      // Build a set of primary key columns
      const primaryKeySet = new Set<string>();
      primaryKeys.forEach((pk: any) => {
        primaryKeySet.add(`${pk.table_name}.${pk.column_name}`);
      });

      // Build foreign key map
      const foreignKeyMap = new Map<string, any>();
      foreignKeys.forEach((fk: any) => {
        const key = `${fk.from_table}.${fk.from_column}`;
        foreignKeyMap.set(key, {
          table: fk.to_table,
          column: fk.to_column
        });
      });

      // Build a map of tables with their columns
      const schemaMap = new Map<string, any>();

      // Initialize tables
      tables.forEach((table: any) => {
        const tableName = table.table_name;
        const category = this.categorizeTable(tableName);
        
        schemaMap.set(tableName, {
          name: tableName,
          category,
          description: `Table for ${this.humanizeTableName(tableName)}`,
          columns: [],
          relationships: []
        });
      });

      // Add columns to tables
      columns.forEach((col: any) => {
        const table = schemaMap.get(col.table_name);
        if (table) {
          const columnKey = `${col.table_name}.${col.column_name}`;
          const isPrimaryKey = primaryKeySet.has(columnKey);
          const foreignKey = foreignKeyMap.get(columnKey);
          
          table.columns.push({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            primaryKey: isPrimaryKey,
            defaultValue: col.column_default,
            foreignKey: foreignKey
          });
        }
      });

      // Add relationships based on foreign keys (both outgoing and incoming)
      foreignKeys.forEach((fk: any) => {
        const fromTable = schemaMap.get(fk.from_table);
        const toTable = schemaMap.get(fk.to_table);
        
        // Add outgoing relationship (from table has foreign key)
        if (fromTable) {
          fromTable.relationships.push({
            type: 'many-to-one',
            fromTable: fk.from_table,
            fromColumn: fk.from_column,
            toTable: fk.to_table,
            toColumn: fk.to_column,
            description: `${fk.from_table}.${fk.from_column} references ${fk.to_table}.${fk.to_column}`
          });
        }
        
        // Add incoming relationship (to table is referenced by foreign key)
        if (toTable) {
          toTable.relationships.push({
            type: 'one-to-many',
            fromTable: fk.to_table,
            fromColumn: fk.to_column,
            toTable: fk.from_table,
            toColumn: fk.from_column,
            description: `${fk.to_table}.${fk.to_column} is referenced by ${fk.from_table}.${fk.from_column}`
          });
        }
      });

      const schemaArray = Array.from(schemaMap.values());

      // Cache the result
      this.schemaCache = {
        data: schemaArray,
        timestamp: Date.now()
      };

      console.log(`getDatabaseSchema: Returning ${schemaArray.length} tables`);
      return schemaArray;
    } catch (error) {
      console.error('Error fetching database schema:', error);
      // Return a basic schema if the query fails
      return this.getBasicSchema();
    }
  }

  private categorizeTable(tableName: string): string {
    const categories: Record<string, string[]> = {
      'Core Manufacturing': ['plants', 'resources', 'capabilities', 'plant_resources'],
      'Production Management': ['production_orders', 'operations', 'production_versions', 'planned_orders', 'discrete_operations', 'discrete_operation_phases', 'process_operations'],
      'Materials & Inventory': ['items', 'bills_of_material', 'bom_items', 'recipes', 'recipe_phases', 'stock_items', 'stock_balances', 'stock_transactions'],
      'Planning & Scheduling': ['production_plans', 'production_targets', 'scheduling_history', 'scheduling_results', 'schedule_scenarios'],
      'Business Partners': ['customers', 'vendors', 'sales_orders', 'purchase_orders'],
      'Quality & Compliance': ['quality_tests', 'quality_results', 'inspections', 'non_conformances'],
      'User Management': ['users', 'roles', 'permissions', 'user_roles', 'role_permissions', 'user_preferences'],
      'System Integration': ['system_integrations', 'integration_jobs', 'integration_events', 'api_credentials'],
      'Analytics & Reporting': ['reports', 'dashboards', 'metrics', 'kpi_definitions', 'report_configs', 'dashboard_configs'],
      'Constraints & TOC': ['constraints', 'constraint_categories', 'constraint_violations', 'buffer_definitions', 'buffer_consumption'],
      'Shift Management': ['shift_templates', 'shift_plans', 'resource_shift_assignments', 'overtime_shifts'],
      'Optimization': ['optimization_algorithms', 'optimization_profiles', 'optimization_runs', 'algorithm_performance'],
      'Communication': ['chat_channels', 'chat_messages', 'feedback', 'disruptions', 'disruption_actions'],
      'Visual Factory': ['visual_factory_displays', 'cockpit_layouts', 'cockpit_widgets', 'unified_widgets'],
      'Extensions': ['extensions', 'extension_files', 'extension_installations', 'extension_marketplace'],
      'Presentations': ['presentations', 'presentation_slides', 'presentation_projects'],
      'AI & Tours': ['tours', 'tour_prompt_templates', 'ai_memories', 'ai_conversation_context'],
      'Workflow': ['workflows', 'workflow_triggers', 'workflow_actions', 'workflow_executions'],
      'System': ['system_users', 'system_health', 'system_settings', 'system_audit_log', 'error_logs']
    };

    for (const [category, tables] of Object.entries(categories)) {
      if (tables.includes(tableName)) {
        return category;
      }
    }
    return 'Other';
  }

  private humanizeTableName(tableName: string): string {
    return tableName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getBasicSchema(): any[] {
    // Fallback basic schema if the database query fails
    return [
      {
        name: 'users',
        category: 'User Management',
        description: 'User accounts and authentication',
        columns: [
          { name: 'id', type: 'integer', primaryKey: true },
          { name: 'username', type: 'varchar' },
          { name: 'email', type: 'varchar' }
        ],
        relationships: []
      },
      {
        name: 'production_orders',
        category: 'Production Management',
        description: 'Production orders and manufacturing jobs',
        columns: [
          { name: 'id', type: 'integer', primaryKey: true },
          { name: 'order_number', type: 'varchar' },
          { name: 'name', type: 'varchar' }
        ],
        relationships: []
      }
    ];
  }

  // Widget management methods
  async getWidgets(): Promise<UnifiedWidget[]> {
    return await db.select().from(unifiedWidgets).where(eq(unifiedWidgets.isActive, true));
  }

  async getWidget(id: number): Promise<UnifiedWidget | undefined> {
    const [widget] = await db.select().from(unifiedWidgets).where(eq(unifiedWidgets.id, id));
    return widget || undefined;
  }

  async getWidgetsByPlatform(platform: string): Promise<UnifiedWidget[]> {
    return await db.select().from(unifiedWidgets)
      .where(
        and(
          eq(unifiedWidgets.isActive, true),
          or(
            eq(unifiedWidgets.targetPlatform, platform),
            eq(unifiedWidgets.targetPlatform, 'both')
          )
        )
      );
  }

  async getWidgetsByCategory(category: string): Promise<UnifiedWidget[]> {
    return await db.select().from(unifiedWidgets)
      .where(
        and(
          eq(unifiedWidgets.isActive, true),
          eq(unifiedWidgets.category, category)
        )
      );
  }

  async createWidget(widget: InsertUnifiedWidget): Promise<UnifiedWidget> {
    const [newWidget] = await db.insert(unifiedWidgets).values(widget).returning();
    return newWidget;
  }

  async updateWidget(id: number, widget: Partial<InsertUnifiedWidget>): Promise<UnifiedWidget | undefined> {
    const [updated] = await db.update(unifiedWidgets)
      .set({ ...widget, updatedAt: new Date() })
      .where(eq(unifiedWidgets.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteWidget(id: number): Promise<boolean> {
    const [updated] = await db.update(unifiedWidgets)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(unifiedWidgets.id, id))
      .returning();
    return !!updated;
  }

  async seedMobileWidgets(): Promise<void> {
    // Check if widgets already exist
    const existingWidgets = await db.select().from(unifiedWidgets).limit(1);
    if (existingWidgets.length > 0) {
      console.log('Widgets already seeded, skipping...');
      return;
    }

    const demoUserId = 1; // Default demo user ID
    const widgetsToSeed: InsertUnifiedWidget[] = [
      {
        title: "Production Overview",
        subtitle: "Real-time production metrics",
        targetPlatform: "both",
        widgetType: "production-metrics",
        dataSource: "production-orders",
        chartType: "number",
        aggregation: "count",
        size: { width: 4, height: 3 },
        position: { x: 0, y: 0 },
        deployedSystems: ["mobile", "cockpit"],
        createdBy: demoUserId,
        category: "production",
        description: "Overview of production metrics including output, efficiency, and quality"
      },
      {
        title: "Equipment Status",
        subtitle: "Real-time equipment monitoring",
        targetPlatform: "both",
        widgetType: "equipment-status",
        dataSource: "resources",
        chartType: "gauge",
        size: { width: 4, height: 3 },
        position: { x: 4, y: 0 },
        deployedSystems: ["mobile", "cockpit"],
        createdBy: demoUserId,
        category: "equipment",
        description: "Monitor equipment status and availability"
      },
      {
        title: "Quality Metrics",
        subtitle: "Quality control dashboard",
        targetPlatform: "both",
        widgetType: "quality-dashboard",
        dataSource: "production-orders",
        chartType: "bar",
        size: { width: 4, height: 3 },
        position: { x: 8, y: 0 },
        deployedSystems: ["mobile", "canvas"],
        createdBy: demoUserId,
        category: "quality",
        description: "Track quality metrics and test results"
      },
      {
        title: "Inventory Levels",
        subtitle: "Stock monitoring",
        targetPlatform: "both",
        widgetType: "inventory-tracking",
        dataSource: "stock-items",
        chartType: "line",
        size: { width: 4, height: 3 },
        position: { x: 0, y: 3 },
        deployedSystems: ["mobile", "canvas"],
        createdBy: demoUserId,
        category: "inventory",
        description: "Monitor inventory levels and material availability"
      },
      {
        title: "Schedule Gantt",
        subtitle: "Production scheduling",
        targetPlatform: "both",
        widgetType: "gantt-chart",
        dataSource: "operations",
        chartType: "timeline",
        size: { width: 8, height: 4 },
        position: { x: 4, y: 3 },
        deployedSystems: ["mobile", "cockpit"],
        createdBy: demoUserId,
        category: "scheduling",
        description: "Visual production schedule and resource allocation"
      },
      {
        title: "Operation Sequencer",
        subtitle: "Operation management",
        targetPlatform: "both",
        widgetType: "operation-sequencer",
        dataSource: "operations",
        chartType: "list",
        size: { width: 6, height: 4 },
        position: { x: 0, y: 7 },
        deployedSystems: ["mobile", "cockpit"],
        createdBy: demoUserId,
        category: "operations",
        description: "Manage and sequence production operations"
      },
      {
        title: "ATP/CTP Calculator",
        subtitle: "Available to promise",
        targetPlatform: "both",
        widgetType: "atp-ctp",
        dataSource: "production-orders",
        chartType: "table",
        size: { width: 6, height: 4 },
        position: { x: 6, y: 7 },
        deployedSystems: ["mobile", "cockpit"],
        createdBy: demoUserId,
        category: "planning",
        description: "Calculate available to promise and capable to promise"
      },
      {
        title: "Schedule Optimizer",
        subtitle: "AI-powered optimization",
        targetPlatform: "both",
        widgetType: "schedule-optimizer",
        dataSource: "operations",
        chartType: "gauge",
        size: { width: 4, height: 3 },
        position: { x: 0, y: 11 },
        deployedSystems: ["mobile", "cockpit"],
        createdBy: demoUserId,
        category: "optimization",
        description: "Optimize production schedules using AI algorithms"
      },
      {
        title: "Production Order Status",
        subtitle: "Order tracking",
        targetPlatform: "both",
        widgetType: "production-order-status",
        dataSource: "production-orders",
        chartType: "progress",
        size: { width: 4, height: 3 },
        position: { x: 4, y: 11 },
        deployedSystems: ["mobile", "cockpit"],
        createdBy: demoUserId,
        category: "production",
        description: "Track production order progress and status"
      },
      {
        title: "Operation Dispatch",
        subtitle: "Work order dispatch",
        targetPlatform: "both",
        widgetType: "operation-dispatch",
        dataSource: "operations",
        chartType: "list",
        size: { width: 4, height: 3 },
        position: { x: 8, y: 11 },
        deployedSystems: ["mobile", "cockpit"],
        createdBy: demoUserId,
        category: "operations",
        description: "Dispatch and manage work orders"
      }
    ];

    await db.insert(unifiedWidgets).values(widgetsToSeed);
    console.log(`Seeded ${widgetsToSeed.length} mobile widgets`);
  }

  // ==================== HOME DASHBOARD LAYOUTS IMPLEMENTATION ====================
  
  async getHomeDashboardLayouts(userId: number): Promise<HomeDashboardLayout[]> {
    return await db.select()
      .from(homeDashboardLayouts)
      .where(eq(homeDashboardLayouts.userId, userId))
      .orderBy(homeDashboardLayouts.isDefault, homeDashboardLayouts.name);
  }

  async getHomeDashboardLayout(id: number): Promise<HomeDashboardLayout | undefined> {
    const [layout] = await db.select()
      .from(homeDashboardLayouts)
      .where(eq(homeDashboardLayouts.id, id));
    return layout || undefined;
  }

  async getDefaultHomeDashboardLayout(userId: number): Promise<HomeDashboardLayout | undefined> {
    const [layout] = await db.select()
      .from(homeDashboardLayouts)
      .where(
        and(
          eq(homeDashboardLayouts.userId, userId),
          eq(homeDashboardLayouts.isDefault, true)
        )
      );
    return layout || undefined;
  }

  async createHomeDashboardLayout(layout: InsertHomeDashboardLayout): Promise<HomeDashboardLayout> {
    // If this is being set as default, unset any existing default for this user
    if (layout.isDefault) {
      await db.update(homeDashboardLayouts)
        .set({ isDefault: false })
        .where(
          and(
            eq(homeDashboardLayouts.userId, layout.userId),
            eq(homeDashboardLayouts.isDefault, true)
          )
        );
    }

    const [newLayout] = await db.insert(homeDashboardLayouts)
      .values(layout)
      .returning();
    return newLayout;
  }

  async updateHomeDashboardLayout(id: number, layout: Partial<InsertHomeDashboardLayout>): Promise<HomeDashboardLayout | undefined> {
    // If this is being set as default, unset any existing default for this user
    if (layout.isDefault) {
      const existingLayout = await this.getHomeDashboardLayout(id);
      if (existingLayout) {
        await db.update(homeDashboardLayouts)
          .set({ isDefault: false })
          .where(
            and(
              eq(homeDashboardLayouts.userId, existingLayout.userId),
              eq(homeDashboardLayouts.isDefault, true),
              ne(homeDashboardLayouts.id, id)
            )
          );
      }
    }

    const [updated] = await db.update(homeDashboardLayouts)
      .set({ ...layout, updatedAt: new Date() })
      .where(eq(homeDashboardLayouts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteHomeDashboardLayout(id: number): Promise<boolean> {
    const result = await db.delete(homeDashboardLayouts)
      .where(eq(homeDashboardLayouts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async setDefaultHomeDashboardLayout(userId: number, layoutId: number): Promise<boolean> {
    try {
      // First unset any existing default for this user
      await db.update(homeDashboardLayouts)
        .set({ isDefault: false })
        .where(
          and(
            eq(homeDashboardLayouts.userId, userId),
            eq(homeDashboardLayouts.isDefault, true)
          )
        );

      // Set the new default
      const [updated] = await db.update(homeDashboardLayouts)
        .set({ isDefault: true })
        .where(
          and(
            eq(homeDashboardLayouts.id, layoutId),
            eq(homeDashboardLayouts.userId, userId)
          )
        )
        .returning();

      return !!updated;
    } catch (error) {
      console.error('Error setting default home dashboard layout:', error);
      return false;
    }
  }

  // ==================== WORKSPACE DASHBOARD IMPLEMENTATION ====================

  async getWorkspaceDashboard(pageIdentifier: string, plantId: number): Promise<WorkspaceDashboard | undefined> {
    const [dashboard] = await db.select()
      .from(workspaceDashboards)
      .where(
        and(
          eq(workspaceDashboards.pageIdentifier, pageIdentifier),
          eq(workspaceDashboards.plantId, plantId),
          eq(workspaceDashboards.isActive, true)
        )
      );
    return dashboard || undefined;
  }

  async getWorkspaceDashboardsByPlant(plantId: number): Promise<WorkspaceDashboard[]> {
    return await db.select()
      .from(workspaceDashboards)
      .where(
        and(
          eq(workspaceDashboards.plantId, plantId),
          eq(workspaceDashboards.isActive, true)
        )
      )
      .orderBy(workspaceDashboards.pageIdentifier);
  }

  async createWorkspaceDashboard(dashboard: InsertWorkspaceDashboard): Promise<WorkspaceDashboard> {
    const [created] = await db.insert(workspaceDashboards)
      .values(dashboard)
      .returning();
    return created;
  }

  async updateWorkspaceDashboard(id: number, dashboard: Partial<InsertWorkspaceDashboard>): Promise<WorkspaceDashboard | undefined> {
    const [updated] = await db.update(workspaceDashboards)
      .set(dashboard)
      .where(eq(workspaceDashboards.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteWorkspaceDashboard(id: number): Promise<boolean> {
    const result = await db.delete(workspaceDashboards)
      .where(eq(workspaceDashboards.id, id));
    return result.rowCount > 0;
  }

  // ==================== MASTER PRODUCTION SCHEDULE IMPLEMENTATION ====================
  
  async getMasterProductionSchedules(plantId?: number, itemNumber?: string, timePeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'weekly', planningHorizon: number = 26): Promise<MasterProductionSchedule[]> {
    let query = db.select().from(masterProductionSchedule);
    
    if (plantId || itemNumber) {
      const conditions: any[] = [];
      if (plantId) conditions.push(eq(masterProductionSchedule.plantId, plantId));
      if (itemNumber) conditions.push(eq(masterProductionSchedule.itemNumber, itemNumber));
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(masterProductionSchedule.itemNumber, masterProductionSchedule.createdAt);
  }

  async getMasterProductionSchedule(id: number): Promise<MasterProductionSchedule | undefined> {
    const [mps] = await db.select()
      .from(masterProductionSchedule)
      .where(eq(masterProductionSchedule.id, id));
    return mps || undefined;
  }

  async createMasterProductionSchedule(mps: InsertMasterProductionSchedule): Promise<MasterProductionSchedule> {
    const [newMps] = await db.insert(masterProductionSchedule)
      .values(mps)
      .returning();
    return newMps;
  }

  async updateMasterProductionSchedule(id: number, updates: Partial<InsertMasterProductionSchedule>): Promise<MasterProductionSchedule | undefined> {
    const [updated] = await db.update(masterProductionSchedule)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(masterProductionSchedule.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMasterProductionSchedule(id: number): Promise<boolean> {
    const result = await db.delete(masterProductionSchedule)
      .where(eq(masterProductionSchedule.id, id));
    return (result.rowCount || 0) > 0;
  }

  async publishMasterProductionSchedule(id: number, publishedBy: number): Promise<MasterProductionSchedule | undefined> {
    const [published] = await db.update(masterProductionSchedule)
      .set({ 
        isPublished: true, 
        publishedAt: new Date(), 
        publishedBy: publishedBy,
        updatedAt: new Date()
      })
      .where(eq(masterProductionSchedule.id, id))
      .returning();
    return published || undefined;
  }

  async getMasterProductionSchedulesByPlanner(plannerId: number): Promise<MasterProductionSchedule[]> {
    return await db.select()
      .from(masterProductionSchedule)
      .where(eq(masterProductionSchedule.plannerId, plannerId))
      .orderBy(masterProductionSchedule.itemNumber);
  }

  // ==================== SALES FORECASTS IMPLEMENTATION ====================

  async getSalesForecasts(plantId?: number, itemNumber?: string, timePeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'weekly'): Promise<SalesForecast[]> {
    let query = db.select().from(salesForecasts);
    
    if (plantId || itemNumber) {
      const conditions: any[] = [];
      if (plantId) conditions.push(eq(salesForecasts.plantId, plantId));
      if (itemNumber) conditions.push(eq(salesForecasts.itemNumber, itemNumber));
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(salesForecasts.itemNumber, salesForecasts.createdAt);
  }

  async getSalesForecast(id: number): Promise<SalesForecast | undefined> {
    const [forecast] = await db.select()
      .from(salesForecasts)
      .where(eq(salesForecasts.id, id));
    return forecast || undefined;
  }

  async createSalesForecast(forecast: InsertSalesForecast): Promise<SalesForecast> {
    const [newForecast] = await db.insert(salesForecasts)
      .values(forecast)
      .returning();
    return newForecast;
  }

  async updateSalesForecast(id: number, updates: Partial<InsertSalesForecast>): Promise<SalesForecast | undefined> {
    const [updated] = await db.update(salesForecasts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(salesForecasts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteSalesForecast(id: number): Promise<boolean> {
    const result = await db.delete(salesForecasts)
      .where(eq(salesForecasts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getForecastAccuracy(itemNumber: string, plantId: number, periodMonths: number = 12): Promise<{ accuracy: number; error: number; }> {
    // This would be implemented with more complex queries to calculate forecast accuracy
    // For now, return sample data
    return {
      accuracy: 85.5,
      error: 14.5
    };
  }

  // ==================== AVAILABLE TO PROMISE IMPLEMENTATION ====================

  async getAvailableToPromise(itemNumber: string, plantId: number): Promise<AvailableToPromise | undefined> {
    const [atp] = await db.select()
      .from(availableToPromise)
      .where(
        and(
          eq(availableToPromise.itemNumber, itemNumber),
          eq(availableToPromise.plantId, plantId)
        )
      );
    return atp || undefined;
  }

  async calculateAvailableToPromise(itemNumber: string, plantId: number): Promise<AvailableToPromise> {
    // This is a complex calculation that would involve:
    // 1. Current inventory levels
    // 2. Scheduled receipts from production orders
    // 3. Planned order receipts from MPS
    // 4. Committed sales orders
    // 5. Safety stock requirements
    
    // For now, create a basic ATP record
    const atpData = {
      itemNumber,
      plantId,
      atpData: [],
      atpRules: {
        includeForecastInAtp: true,
        safetyStockProtected: true,
        enableBackorderSatisfaction: false,
        atpFence: 7,
        planningFence: 30,
        demandFence: 7
      },
      lastCalculatedAt: new Date(),
      calculationTrigger: "manual" as const
    };

    const [newAtp] = await db.insert(availableToPromise)
      .values(atpData)
      .returning();
    return newAtp;
  }

  async updateAvailableToPromise(id: number, updates: Partial<InsertAvailableToPromise>): Promise<AvailableToPromise | undefined> {
    const [updated] = await db.update(availableToPromise)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(availableToPromise.id, id))
      .returning();
    return updated || undefined;
  }
  // MRP (Material Requirements Planning) Implementation
  async getMrpRuns(): Promise<MrpRun[]> {
    const runs = await this.db
      .select()
      .from(mrpRuns)
      .orderBy(desc(mrpRuns.createdAt));
    return runs;
  }

  async getMrpRun(id: number): Promise<MrpRun | undefined> {
    const [run] = await this.db
      .select()
      .from(mrpRuns)
      .where(eq(mrpRuns.id, id));
    return run;
  }

  async createMrpRun(run: InsertMrpRun): Promise<MrpRun> {
    const [newRun] = await this.db
      .insert(mrpRuns)
      .values(run)
      .returning();
    return newRun;
  }

  async updateMrpRun(id: number, updates: Partial<InsertMrpRun>): Promise<MrpRun | undefined> {
    const [updatedRun] = await this.db
      .update(mrpRuns)
      .set(updates)
      .where(eq(mrpRuns.id, id))
      .returning();
    return updatedRun;
  }

  async deleteMrpRun(id: number): Promise<boolean> {
    const result = await this.db
      .delete(mrpRuns)
      .where(eq(mrpRuns.id, id));
    return result.rowCount > 0;
  }

  async getMrpRequirements(runId: number): Promise<MrpRequirement[]> {
    const requirements = await this.db
      .select()
      .from(mrpRequirements)
      .where(eq(mrpRequirements.mrpRunId, runId))
      .orderBy(mrpRequirements.itemNumber);
    return requirements;
  }

  async createMrpRequirement(requirement: InsertMrpRequirement): Promise<MrpRequirement> {
    const [newRequirement] = await this.db
      .insert(mrpRequirements)
      .values(requirement)
      .returning();
    return newRequirement;
  }

  async getMrpActionMessages(runId: number): Promise<MrpActionMessage[]> {
    const messages = await this.db
      .select()
      .from(mrpActionMessages)
      .where(eq(mrpActionMessages.mrpRunId, runId))
      .orderBy(desc(mrpActionMessages.priority), mrpActionMessages.itemNumber);
    return messages;
  }

  async createMrpActionMessage(message: InsertMrpActionMessage): Promise<MrpActionMessage> {
    const [newMessage] = await this.db
      .insert(mrpActionMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async updateMrpActionMessage(id: number, updates: Partial<InsertMrpActionMessage>): Promise<MrpActionMessage | undefined> {
    const [updatedMessage] = await this.db
      .update(mrpActionMessages)
      .set(updates)
      .where(eq(mrpActionMessages.id, id))
      .returning();
    return updatedMessage;
  }

  // Master Production Schedule Management for MRP
  async getMasterProductionSchedule(): Promise<MasterProductionSchedule[]> {
    const schedule = await this.db
      .select()
      .from(masterProductionSchedule)
      .orderBy(masterProductionSchedule.weekEndingDate, masterProductionSchedule.itemNumber);
    return schedule;
  }

  async createMasterProductionScheduleEntry(entry: InsertMasterProductionSchedule): Promise<MasterProductionSchedule> {
    const [newEntry] = await this.db
      .insert(masterProductionSchedule)
      .values(entry)
      .returning();
    return newEntry;
  }

  async updateMasterProductionScheduleEntry(id: number, updates: Partial<InsertMasterProductionSchedule>): Promise<MasterProductionSchedule | undefined> {
    const [updatedEntry] = await this.db
      .update(masterProductionSchedule)
      .set(updates)
      .where(eq(masterProductionSchedule.id, id))
      .returning();
    return updatedEntry;
  }

  async deleteMasterProductionScheduleEntry(id: number): Promise<boolean> {
    const result = await this.db
      .delete(masterProductionSchedule)
      .where(eq(masterProductionSchedule.id, id));
    return result.rowCount > 0;
  }

  // Collaborative Demand Management Implementation
  async getDemandChangeRequests(status?: string, requestType?: string): Promise<DemandChangeRequest[]> {
    let query = this.db.select().from(demandChangeRequests);
    
    if (status || requestType) {
      const conditions = [];
      if (status) conditions.push(eq(demandChangeRequests.status, status));
      if (requestType) conditions.push(eq(demandChangeRequests.requestType, requestType));
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(demandChangeRequests.createdAt));
  }

  async getDemandChangeRequest(id: number): Promise<DemandChangeRequest | undefined> {
    const [request] = await this.db
      .select()
      .from(demandChangeRequests)
      .where(eq(demandChangeRequests.id, id));
    return request;
  }

  async createDemandChangeRequest(request: InsertDemandChangeRequest): Promise<DemandChangeRequest> {
    // Generate request number
    const count = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(demandChangeRequests);
    
    const requestNumber = `DCR-${new Date().getFullYear()}-${String(count[0].count + 1).padStart(3, '0')}`;

    const [newRequest] = await this.db
      .insert(demandChangeRequests)
      .values({ ...request, requestNumber })
      .returning();
    return newRequest;
  }

  async updateDemandChangeRequest(id: number, request: Partial<InsertDemandChangeRequest>): Promise<DemandChangeRequest | undefined> {
    const [updatedRequest] = await this.db
      .update(demandChangeRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(demandChangeRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async deleteDemandChangeRequest(id: number): Promise<boolean> {
    const result = await this.db
      .delete(demandChangeRequests)
      .where(eq(demandChangeRequests.id, id));
    return result.rowCount > 0;
  }

  // Demand Change Comments
  async getDemandChangeComments(requestId: number): Promise<DemandChangeComment[]> {
    return this.db
      .select()
      .from(demandChangeComments)
      .where(eq(demandChangeComments.requestId, requestId))
      .orderBy(asc(demandChangeComments.createdAt));
  }

  async createDemandChangeComment(comment: InsertDemandChangeComment): Promise<DemandChangeComment> {
    const [newComment] = await this.db
      .insert(demandChangeComments)
      .values(comment)
      .returning();
    return newComment;
  }

  async updateDemandChangeComment(id: number, comment: Partial<InsertDemandChangeComment>): Promise<DemandChangeComment | undefined> {
    const [updatedComment] = await this.db
      .update(demandChangeComments)
      .set(comment)
      .where(eq(demandChangeComments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteDemandChangeComment(id: number): Promise<boolean> {
    const result = await this.db
      .delete(demandChangeComments)
      .where(eq(demandChangeComments.id, id));
    return result.rowCount > 0;
  }

  // Demand Change Approvals
  async getDemandChangeApprovals(requestId: number): Promise<DemandChangeApproval[]> {
    return this.db
      .select()
      .from(demandChangeApprovals)
      .where(eq(demandChangeApprovals.requestId, requestId))
      .orderBy(asc(demandChangeApprovals.orderSequence));
  }

  async createDemandChangeApproval(approval: InsertDemandChangeApproval): Promise<DemandChangeApproval> {
    const [newApproval] = await this.db
      .insert(demandChangeApprovals)
      .values(approval)
      .returning();
    return newApproval;
  }

  async updateDemandChangeApproval(id: number, approval: Partial<InsertDemandChangeApproval>): Promise<DemandChangeApproval | undefined> {
    const [updatedApproval] = await this.db
      .update(demandChangeApprovals)
      .set(approval)
      .where(eq(demandChangeApprovals.id, id))
      .returning();
    return updatedApproval;
  }

  async deleteDemandChangeApproval(id: number): Promise<boolean> {
    const result = await this.db
      .delete(demandChangeApprovals)
      .where(eq(demandChangeApprovals.id, id));
    return result.rowCount > 0;
  }

  // Demand Collaboration Sessions
  async getDemandCollaborationSessions(organizerId?: number, status?: string): Promise<DemandCollaborationSession[]> {
    let query = this.db.select().from(demandCollaborationSessions);
    
    if (organizerId || status) {
      const conditions = [];
      if (organizerId) conditions.push(eq(demandCollaborationSessions.organizer, organizerId));
      if (status) conditions.push(eq(demandCollaborationSessions.status, status));
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(demandCollaborationSessions.scheduledStart));
  }

  async getDemandCollaborationSession(id: number): Promise<DemandCollaborationSession | undefined> {
    const [session] = await this.db
      .select()
      .from(demandCollaborationSessions)
      .where(eq(demandCollaborationSessions.id, id));
    return session;
  }

  async createDemandCollaborationSession(session: InsertDemandCollaborationSession): Promise<DemandCollaborationSession> {
    const [newSession] = await this.db
      .insert(demandCollaborationSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async updateDemandCollaborationSession(id: number, session: Partial<InsertDemandCollaborationSession>): Promise<DemandCollaborationSession | undefined> {
    const [updatedSession] = await this.db
      .update(demandCollaborationSessions)
      .set({ ...session, updatedAt: new Date() })
      .where(eq(demandCollaborationSessions.id, id))
      .returning();
    return updatedSession;
  }

  async deleteDemandCollaborationSession(id: number): Promise<boolean> {
    const result = await this.db
      .delete(demandCollaborationSessions)
      .where(eq(demandCollaborationSessions.id, id));
    return result.rowCount > 0;
  }

  // Widget methods for mobile compatibility
  async getMobileCompatibleWidgets(): Promise<UnifiedWidget[]> {
    return await this.db
      .select()
      .from(unifiedWidgets)
      .where(
        or(
          eq(unifiedWidgets.targetPlatform, 'mobile'),
          eq(unifiedWidgets.targetPlatform, 'both')
        )
      )
      .orderBy(desc(unifiedWidgets.createdAt));
  }

  async getAllWidgets(): Promise<UnifiedWidget[]> {
    return await this.db
      .select()
      .from(unifiedWidgets)
      .orderBy(desc(unifiedWidgets.createdAt));
  }

  async getWidgetById(id: number): Promise<UnifiedWidget | null> {
    const [widget] = await this.db
      .select()
      .from(unifiedWidgets)
      .where(eq(unifiedWidgets.id, id));
    return widget || null;
  }

  async getWidgetsByCategory(category: string): Promise<UnifiedWidget[]> {
    return await this.db
      .select()
      .from(unifiedWidgets)
      .where(eq(unifiedWidgets.category, category))
      .orderBy(desc(unifiedWidgets.createdAt));
  }

  async getWidgetsByPlatform(platform: 'mobile' | 'desktop' | 'both'): Promise<UnifiedWidget[]> {
    return await this.db
      .select()
      .from(unifiedWidgets)
      .where(eq(unifiedWidgets.targetPlatform, platform))
      .orderBy(desc(unifiedWidgets.createdAt));
  }

  // External Portal Methods Implementation
  // Company Management
  async getExternalCompanies(type?: string): Promise<ExternalCompany[]> {
    let query = this.db.select().from(externalCompanies);
    if (type) {
      query = query.where(eq(externalCompanies.type, type));
    }
    return await query.orderBy(desc(externalCompanies.createdAt));
  }

  async getExternalCompany(id: string): Promise<ExternalCompany | undefined> {
    const [company] = await this.db
      .select()
      .from(externalCompanies)
      .where(eq(externalCompanies.id, id));
    return company;
  }

  async getExternalCompanyByErpLink(erpLinkId: string): Promise<ExternalCompany | undefined> {
    const [company] = await this.db
      .select()
      .from(externalCompanies)
      .where(eq(externalCompanies.erpLinkId, erpLinkId));
    return company;
  }

  async createExternalCompany(company: InsertExternalCompany): Promise<ExternalCompany> {
    const [newCompany] = await this.db
      .insert(externalCompanies)
      .values(company)
      .returning();
    return newCompany;
  }

  async updateExternalCompany(id: string, updates: Partial<InsertExternalCompany>): Promise<ExternalCompany | undefined> {
    const [updated] = await this.db
      .update(externalCompanies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalCompanies.id, id))
      .returning();
    return updated;
  }

  async deleteExternalCompany(id: string): Promise<boolean> {
    const result = await this.db
      .delete(externalCompanies)
      .where(eq(externalCompanies.id, id));
    return result.rowCount > 0;
  }

  // External User Management
  async getExternalUsers(companyId?: string): Promise<ExternalUser[]> {
    let query = this.db.select().from(externalUsers);
    if (companyId) {
      query = query.where(eq(externalUsers.companyId, companyId));
    }
    return await query.orderBy(desc(externalUsers.createdAt));
  }

  async getExternalUser(id: string): Promise<ExternalUser | undefined> {
    const [user] = await this.db
      .select()
      .from(externalUsers)
      .where(eq(externalUsers.id, id));
    return user;
  }

  async getExternalUserByEmail(email: string): Promise<ExternalUser | undefined> {
    // Make email comparison case-insensitive
    const [user] = await this.db
      .select()
      .from(externalUsers)
      .where(sql`LOWER(${externalUsers.email}) = LOWER(${email})`);
    return user;
  }

  async createExternalUser(user: Omit<InsertExternalUser, 'confirmPassword'> & { password: string }): Promise<ExternalUser> {
    const { password, ...userData } = user;
    const passwordHash = await bcrypt.hash(password, 10);
    
    const [newUser] = await this.db
      .insert(externalUsers)
      .values({
        ...userData,
        passwordHash,
      })
      .returning();
    return newUser;
  }

  async updateExternalUser(id: string, updates: Partial<InsertExternalUser>): Promise<ExternalUser | undefined> {
    const [updated] = await this.db
      .update(externalUsers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(externalUsers.id, id))
      .returning();
    return updated;
  }

  async deleteExternalUser(id: string): Promise<boolean> {
    const result = await this.db
      .delete(externalUsers)
      .where(eq(externalUsers.id, id));
    return result.rowCount > 0;
  }

  async authenticateExternalUser(email: string, password: string): Promise<ExternalUser | null> {
    // Email is already normalized to lowercase from the route
    const user = await this.getExternalUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;
    
    // Update last login
    await this.db
      .update(externalUsers)
      .set({ lastLogin: new Date() })
      .where(eq(externalUsers.id, user.id));
    
    return user;
  }

  // Portal Session Management
  async createPortalSession(session: InsertPortalSession): Promise<PortalSession> {
    const [newSession] = await this.db
      .insert(portalSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getPortalSession(token: string): Promise<PortalSession | undefined> {
    const [session] = await this.db
      .select()
      .from(portalSessions)
      .where(eq(portalSessions.token, token));
    return session;
  }

  async getPortalSessionsByUser(userId: string): Promise<PortalSession[]> {
    return await this.db
      .select()
      .from(portalSessions)
      .where(eq(portalSessions.userId, userId))
      .orderBy(desc(portalSessions.createdAt));
  }

  async updatePortalSession(id: string, updates: Partial<InsertPortalSession>): Promise<PortalSession | undefined> {
    const [updated] = await this.db
      .update(portalSessions)
      .set({ ...updates, lastActivityAt: new Date() })
      .where(eq(portalSessions.id, id))
      .returning();
    return updated;
  }

  async deletePortalSession(token: string): Promise<boolean> {
    const result = await this.db
      .delete(portalSessions)
      .where(eq(portalSessions.token, token));
    return result.rowCount > 0;
  }

  async cleanupExpiredPortalSessions(): Promise<number> {
    const result = await this.db
      .delete(portalSessions)
      .where(lt(portalSessions.expiresAt, new Date()));
    return result.rowCount || 0;
  }
  
  // Portal Data Access Methods
  async getPurchaseOrdersByCompany(companyId: string): Promise<any[]> {
    // Return sample purchase orders for now
    // In production, this would query actual purchase order tables
    return [
      {
        id: '1',
        orderNumber: 'PO-2025-001',
        supplierName: 'Acme Suppliers Inc',
        customerName: 'PlanetTogether Manufacturing',
        status: 'confirmed',
        orderDate: new Date('2025-01-15').toISOString(),
        deliveryDate: new Date('2025-01-22').toISOString(),
        totalAmount: 25000,
        currency: 'USD',
        itemCount: 5,
        priority: 'high',
        shippingAddress: '123 Manufacturing Ave, Industrial City, IC 12345',
        paymentTerms: 'Net 30',
        items: []
      },
      {
        id: '2',
        orderNumber: 'PO-2025-002',
        supplierName: 'Acme Suppliers Inc',
        customerName: 'PlanetTogether Manufacturing',
        status: 'pending',
        orderDate: new Date('2025-01-18').toISOString(),
        deliveryDate: new Date('2025-01-25').toISOString(),
        totalAmount: 15000,
        currency: 'USD',
        itemCount: 3,
        priority: 'normal',
        shippingAddress: '123 Manufacturing Ave, Industrial City, IC 12345',
        paymentTerms: 'Net 30',
        items: []
      },
      {
        id: '3',
        orderNumber: 'PO-2025-003',
        supplierName: 'Acme Suppliers Inc',
        customerName: 'PlanetTogether Manufacturing',
        status: 'in_transit',
        orderDate: new Date('2025-01-10').toISOString(),
        deliveryDate: new Date('2025-01-20').toISOString(),
        totalAmount: 45000,
        currency: 'USD',
        itemCount: 8,
        priority: 'urgent',
        shippingAddress: '123 Manufacturing Ave, Industrial City, IC 12345',
        paymentTerms: 'Net 15',
        items: []
      }
    ];
  }
  
  async getDeliveriesByCompany(companyId: string): Promise<any[]> {
    // Return sample deliveries for now
    return [
      {
        id: '1',
        deliveryNumber: 'DLV-2025-001',
        orderNumber: 'PO-2025-001',
        status: 'in_transit',
        origin: 'Acme Warehouse - Chicago',
        destination: 'PlanetTogether Facility - Detroit',
        currentLocation: 'Distribution Center - Toledo',
        estimatedDelivery: new Date('2025-01-22').toISOString(),
        carrier: 'Express Logistics Inc',
        trackingNumber: 'TRK123456789',
        items: 5,
        weight: 500,
        weightUnit: 'kg',
        progress: 65,
        events: [
          {
            id: '1',
            timestamp: new Date('2025-01-20T10:00:00').toISOString(),
            location: 'Distribution Center - Toledo',
            status: 'In Transit',
            description: 'Package arrived at distribution center'
          },
          {
            id: '2',
            timestamp: new Date('2025-01-19T15:00:00').toISOString(),
            location: 'Acme Warehouse - Chicago',
            status: 'Dispatched',
            description: 'Package left origin facility'
          }
        ]
      },
      {
        id: '2',
        deliveryNumber: 'DLV-2025-002',
        orderNumber: 'PO-2024-098',
        status: 'delivered',
        origin: 'Acme Warehouse - Chicago',
        destination: 'PlanetTogether Facility - Detroit',
        currentLocation: 'PlanetTogether Facility - Detroit',
        estimatedDelivery: new Date('2025-01-15').toISOString(),
        actualDelivery: new Date('2025-01-15').toISOString(),
        carrier: 'Fast Freight Solutions',
        trackingNumber: 'TRK987654321',
        items: 3,
        weight: 250,
        weightUnit: 'kg',
        progress: 100,
        events: []
      }
    ];
  }
  
  async getInventoryByCompany(companyId: string): Promise<any[]> {
    // Return sample inventory items for now
    return [
      {
        id: '1',
        itemCode: 'RAW-001',
        description: 'Steel Sheets - Grade A',
        category: 'raw_materials',
        currentStock: 500,
        availableStock: 400,
        reservedStock: 100,
        incomingStock: 200,
        unit: 'sheets',
        minLevel: 100,
        maxLevel: 1000,
        reorderPoint: 150,
        lastRestocked: new Date('2025-01-10').toISOString(),
        warehouse: 'Main Warehouse - Section A',
        supplier: 'Acme Suppliers Inc',
        unitCost: 45.50,
        totalValue: 22750,
        stockStatus: 'healthy',
        trend: 'up',
        trendPercentage: 12
      },
      {
        id: '2',
        itemCode: 'COMP-015',
        description: 'Aluminum Brackets - Type B',
        category: 'components',
        currentStock: 75,
        availableStock: 50,
        reservedStock: 25,
        incomingStock: 100,
        unit: 'pcs',
        minLevel: 50,
        maxLevel: 500,
        reorderPoint: 75,
        lastRestocked: new Date('2025-01-05').toISOString(),
        warehouse: 'Main Warehouse - Section B',
        supplier: 'Acme Suppliers Inc',
        unitCost: 12.75,
        totalValue: 956.25,
        stockStatus: 'low',
        trend: 'down',
        trendPercentage: -8
      },
      {
        id: '3',
        itemCode: 'PKG-008',
        description: 'Cardboard Boxes - Large',
        category: 'packaging',
        currentStock: 1200,
        availableStock: 1000,
        reservedStock: 200,
        incomingStock: 0,
        unit: 'boxes',
        minLevel: 200,
        maxLevel: 1500,
        reorderPoint: 300,
        lastRestocked: new Date('2025-01-12').toISOString(),
        warehouse: 'Packaging Storage',
        supplier: 'Acme Suppliers Inc',
        unitCost: 2.50,
        totalValue: 3000,
        stockStatus: 'healthy',
        trend: 'stable',
        trendPercentage: 0
      }
    ];
  }

  // Portal Permissions Management
  async getPortalPermissions(userId?: string, companyId?: string): Promise<PortalPermission[]> {
    let query = this.db.select().from(portalPermissions);
    const conditions = [];
    if (userId) conditions.push(eq(portalPermissions.userId, userId));
    if (companyId) conditions.push(eq(portalPermissions.companyId, companyId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    return await query.orderBy(desc(portalPermissions.createdAt));
  }

  async getPortalPermission(id: string): Promise<PortalPermission | undefined> {
    const [permission] = await this.db
      .select()
      .from(portalPermissions)
      .where(eq(portalPermissions.id, id));
    return permission;
  }

  async createPortalPermission(permission: InsertPortalPermission): Promise<PortalPermission> {
    const [newPermission] = await this.db
      .insert(portalPermissions)
      .values(permission)
      .returning();
    return newPermission;
  }

  async updatePortalPermission(id: string, updates: Partial<InsertPortalPermission>): Promise<PortalPermission | undefined> {
    const [updated] = await this.db
      .update(portalPermissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(portalPermissions.id, id))
      .returning();
    return updated;
  }

  async deletePortalPermission(id: string): Promise<boolean> {
    const result = await this.db
      .delete(portalPermissions)
      .where(eq(portalPermissions.id, id));
    return result.rowCount > 0;
  }

  async checkPortalPermission(userId: string, resourceType: string, action: string): Promise<boolean> {
    const permissions = await this.getPortalPermissions(userId);
    return permissions.some(p => 
      p.resourceType === resourceType && 
      p.actions && 
      (p.actions as string[]).includes(action)
    );
  }

  // AI Onboarding Progress
  async getAiOnboardingProgress(userId?: string, companyId?: string): Promise<AiOnboardingProgress[]> {
    let query = this.db.select().from(aiOnboardingProgress);
    const conditions = [];
    if (userId) conditions.push(eq(aiOnboardingProgress.userId, userId));
    if (companyId) conditions.push(eq(aiOnboardingProgress.companyId, companyId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    return await query.orderBy(desc(aiOnboardingProgress.startedAt));
  }

  async getAiOnboardingProgressById(id: string): Promise<AiOnboardingProgress | undefined> {
    const [progress] = await this.db
      .select()
      .from(aiOnboardingProgress)
      .where(eq(aiOnboardingProgress.id, id));
    return progress;
  }

  async createAiOnboardingProgress(progress: InsertAiOnboardingProgress): Promise<AiOnboardingProgress> {
    const [newProgress] = await this.db
      .insert(aiOnboardingProgress)
      .values(progress)
      .returning();
    return newProgress;
  }

  async updateAiOnboardingProgress(id: string, updates: Partial<InsertAiOnboardingProgress>): Promise<AiOnboardingProgress | undefined> {
    const [updated] = await this.db
      .update(aiOnboardingProgress)
      .set({ ...updates, lastInteractionAt: new Date() })
      .where(eq(aiOnboardingProgress.id, id))
      .returning();
    return updated;
  }

  // Portal Activity Logging
  async logPortalActivity(activity: InsertPortalActivityLog): Promise<PortalActivityLog> {
    const [logged] = await this.db
      .insert(portalActivityLog)
      .values(activity)
      .returning();
    return logged;
  }

  async getPortalActivityLogs(filters?: { userId?: string; companyId?: string; action?: string; limit?: number }): Promise<PortalActivityLog[]> {
    let query = this.db.select().from(portalActivityLog);
    const conditions = [];
    
    if (filters?.userId) conditions.push(eq(portalActivityLog.userId, filters.userId));
    if (filters?.companyId) conditions.push(eq(portalActivityLog.companyId, filters.companyId));
    if (filters?.action) conditions.push(eq(portalActivityLog.action, filters.action));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.orderBy(desc(portalActivityLog.timestamp));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    return await query;
  }

  // Implementation Projects
  async getImplementationProjects(): Promise<ImplementationProject[]> {
    return await this.db
      .select()
      .from(implementationProjects)
      .orderBy(desc(implementationProjects.createdAt));
  }

  async getImplementationProject(id: number): Promise<ImplementationProject | undefined> {
    const [project] = await this.db
      .select()
      .from(implementationProjects)
      .where(eq(implementationProjects.id, id));
    return project;
  }

  async createImplementationProject(project: InsertImplementationProject): Promise<ImplementationProject> {
    const [newProject] = await this.db
      .insert(implementationProjects)
      .values(project)
      .returning();
    return newProject;
  }

  async updateImplementationProject(id: number, updates: Partial<InsertImplementationProject>): Promise<ImplementationProject | undefined> {
    const [updated] = await this.db
      .update(implementationProjects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(implementationProjects.id, id))
      .returning();
    return updated;
  }

  async deleteImplementationProject(id: number): Promise<boolean> {
    const result = await this.db
      .delete(implementationProjects)
      .where(eq(implementationProjects.id, id));
    return result.rowCount > 0;
  }

  // AI Memory System Implementation (adapted from Memory Books)
  async getMemoryBooks(scope?: string, plantId?: number, userId?: number): Promise<any[]> {
    let query = this.db.select().from(aiMemories);
    const conditions = [];
    
    if (scope) conditions.push(eq(aiMemories.category, scope));
    if (userId) {
      conditions.push(eq(aiMemories.userId, userId.toString()));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query
      .where(eq(aiMemories.isActive, true))
      .orderBy(desc(aiMemories.updatedAt));
  }

  async getMemoryBook(id: number): Promise<any | undefined> {
    const [memory] = await this.db
      .select()
      .from(aiMemories)
      .where(eq(aiMemories.id, id));
    return memory;
  }

  async createMemoryBook(book: any): Promise<any> {
    const memoryData = {
      userId: book.createdBy?.toString() || '1',
      type: 'knowledge',
      category: book.scope || 'general',
      content: book.content,
      context: {
        title: book.title,
        tags: book.tags || [],
        metadata: {}
      },
      confidence: 80,
      importance: 'medium',
      source: 'manual'
    };
    
    const [newMemory] = await this.db
      .insert(aiMemories)
      .values(memoryData)
      .returning();
    return newMemory;
  }

  async updateMemoryBook(id: number, updates: any): Promise<any | undefined> {
    const [updated] = await this.db
      .update(aiMemories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiMemories.id, id))
      .returning();
    return updated;
  }

  async deleteMemoryBook(id: number): Promise<boolean> {
    const result = await this.db
      .update(aiMemories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(aiMemories.id, id));
    return result.rowCount > 0;
  }

  // Memory Book Entries
  async getMemoryBookEntries(memoryBookId?: number, category?: string, searchTerm?: string): Promise<MemoryBookEntry[]> {
    let query = this.db.select().from(memoryBookEntries);
    const conditions = [];
    
    if (memoryBookId) conditions.push(eq(memoryBookEntries.memoryBookId, memoryBookId));
    if (category) conditions.push(eq(memoryBookEntries.category, category));
    if (searchTerm) {
      conditions.push(or(
        ilike(memoryBookEntries.title, `%${searchTerm}%`),
        ilike(memoryBookEntries.content, `%${searchTerm}%`)
      ));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query
      .where(eq(memoryBookEntries.isArchived, false))
      .orderBy(desc(memoryBookEntries.updatedAt));
  }

  async getMemoryBookEntry(id: number): Promise<MemoryBookEntry | undefined> {
    const [entry] = await this.db
      .select()
      .from(memoryBookEntries)
      .where(eq(memoryBookEntries.id, id));
    return entry;
  }

  async createMemoryBookEntry(entry: InsertMemoryBookEntry): Promise<MemoryBookEntry> {
    const [newEntry] = await this.db
      .insert(memoryBookEntries)
      .values(entry)
      .returning();
    
    // Record the creation in history
    await this.createMemoryBookEntryHistory({
      entryId: newEntry.id,
      newContent: newEntry.content,
      changeType: 'created',
      changeDescription: 'Initial entry creation',
      editedBy: newEntry.createdBy
    });
    
    return newEntry;
  }

  async updateMemoryBookEntry(id: number, updates: Partial<InsertMemoryBookEntry>): Promise<MemoryBookEntry | undefined> {
    // Get current entry for history
    const currentEntry = await this.getMemoryBookEntry(id);
    if (!currentEntry) return undefined;
    
    const [updated] = await this.db
      .update(memoryBookEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(memoryBookEntries.id, id))
      .returning();
    
    // Record the change in history
    if (updated && updates.content) {
      await this.createMemoryBookEntryHistory({
        entryId: id,
        previousContent: currentEntry.content,
        newContent: updates.content,
        changeType: 'updated',
        changeDescription: 'Content updated',
        editedBy: updates.lastEditedBy || currentEntry.createdBy
      });
    }
    
    return updated;
  }

  async deleteMemoryBookEntry(id: number): Promise<boolean> {
    const result = await this.db
      .update(memoryBookEntries)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(eq(memoryBookEntries.id, id));
    return result.rowCount > 0;
  }

  async searchMemoryBookEntries(searchTerm: string, memoryBookId?: number): Promise<MemoryBookEntry[]> {
    let query = this.db
      .select()
      .from(memoryBookEntries)
      .where(and(
        eq(memoryBookEntries.isArchived, false),
        or(
          ilike(memoryBookEntries.title, `%${searchTerm}%`),
          ilike(memoryBookEntries.content, `%${searchTerm}%`)
        )
      ));
    
    if (memoryBookId) {
      query = query.where(eq(memoryBookEntries.memoryBookId, memoryBookId));
    }
    
    return await query.orderBy(desc(memoryBookEntries.updatedAt));
  }

  // Memory Book Collaborators
  async getMemoryBookCollaborators(memoryBookId: number): Promise<MemoryBookCollaborator[]> {
    return await this.db
      .select()
      .from(memoryBookCollaborators)
      .where(eq(memoryBookCollaborators.memoryBookId, memoryBookId))
      .orderBy(desc(memoryBookCollaborators.addedAt));
  }

  async addMemoryBookCollaborator(collaborator: InsertMemoryBookCollaborator): Promise<MemoryBookCollaborator> {
    const [newCollaborator] = await this.db
      .insert(memoryBookCollaborators)
      .values(collaborator)
      .returning();
    return newCollaborator;
  }

  async updateMemoryBookCollaboratorPermission(id: number, permission: string): Promise<MemoryBookCollaborator | undefined> {
    const [updated] = await this.db
      .update(memoryBookCollaborators)
      .set({ permission })
      .where(eq(memoryBookCollaborators.id, id))
      .returning();
    return updated;
  }

  async removeMemoryBookCollaborator(id: number): Promise<boolean> {
    const result = await this.db
      .delete(memoryBookCollaborators)
      .where(eq(memoryBookCollaborators.id, id));
    return result.rowCount > 0;
  }

  // Memory Book Entry History
  async getMemoryBookEntryHistory(entryId: number): Promise<MemoryBookEntryHistory[]> {
    return await this.db
      .select()
      .from(memoryBookEntryHistory)
      .where(eq(memoryBookEntryHistory.entryId, entryId))
      .orderBy(desc(memoryBookEntryHistory.editedAt));
  }

  async createMemoryBookEntryHistory(history: InsertMemoryBookEntryHistory): Promise<MemoryBookEntryHistory> {
    const [newHistory] = await this.db
      .insert(memoryBookEntryHistory)
      .values(history)
      .returning();
    return newHistory;
  }

  // Memory Book Usage Analytics
  async recordMemoryBookUsage(usage: InsertMemoryBookUsage): Promise<MemoryBookUsage> {
    const [newUsage] = await this.db
      .insert(memoryBookUsage)
      .values(usage)
      .returning();
    return newUsage;
  }

  async getMemoryBookUsageStats(entryId?: number): Promise<{
    totalViews: number;
    totalApplications: number;
    averageEffectiveness: number;
    recentUsage: number;
  }> {
    let query = this.db.select().from(memoryBookUsage);
    
    if (entryId) {
      query = query.where(eq(memoryBookUsage.entryId, entryId));
    }
    
    const usageData = await query;
    
    const totalViews = usageData.filter(u => u.actionType === 'viewed').length;
    const totalApplications = usageData.filter(u => u.actionType === 'applied').length;
    const effectivenessRatings = usageData
      .filter(u => u.effectivenessRating !== null)
      .map(u => u.effectivenessRating!);
    const averageEffectiveness = effectivenessRatings.length > 0 
      ? effectivenessRatings.reduce((a, b) => a + b, 0) / effectivenessRatings.length 
      : 0;
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentUsage = usageData.filter(u => u.usedAt && u.usedAt > weekAgo).length;
    
    return {
      totalViews,
      totalApplications,
      averageEffectiveness,
      recentUsage
    };
  }

  // AI Insights Implementation
  async getAIInsights(days = 7): Promise<any[]> {
    console.log('🔍 Storage.getAIInsights called with days:', days);
    const timestamp = new Date().toISOString();
    const baseTime = Date.now();
    
    // Return sample insights for the AI Insights page
    return [
      {
        id: `insight_${baseTime}_1`,
        type: 'optimization',
        title: 'Brewing Sequence Optimization Opportunity',
        description: 'Current scheduling leaves 2.3 hours of idle time on Brew Kettle 2. Optimizing sequence could improve throughput by 12%.',
        priority: 'high',
        timestamp,
        source: 'scheduling_optimizer',
        category: 'production',
        status: 'new',
        actionable: true,
        impact: 'Increase daily production by 480 liters',
        recommendation: 'Reschedule Pale Ale brewing to start 2 hours earlier',
        confidence: 89,
        affected_areas: ['Brew Kettle 2', 'Fermentation Tank 1'],
        estimated_savings: 1200,
        implementation_time: '15 minutes',
        related_insights: []
      },
      {
        id: `insight_${baseTime}_2`,
        type: 'quality',
        title: 'Temperature Variance Alert',
        description: 'Fermentation temperatures in Tank 3 showing 0.8°C variance from optimal range, potentially affecting flavor profile.',
        priority: 'medium',
        timestamp,
        source: 'quality_monitor',
        category: 'quality',
        status: 'new',
        actionable: true,
        impact: 'Prevent potential batch quality issues',
        recommendation: 'Calibrate temperature sensors and check insulation',
        confidence: 92,
        affected_areas: ['Fermentation Tank 3'],
        estimated_savings: 850,
        implementation_time: '45 minutes',
        related_insights: []
      },
      {
        id: `insight_${baseTime}_3`,
        type: 'maintenance',
        title: 'Pump Performance Degradation',
        description: 'Transfer Pump P-102 showing 15% decrease in flow rate over past week. Preventive maintenance recommended.',
        priority: 'medium',
        timestamp,
        source: 'predictive_maintenance',
        category: 'maintenance',
        status: 'new',
        actionable: true,
        impact: 'Prevent unplanned downtime',
        recommendation: 'Schedule pump inspection during next maintenance window',
        confidence: 87,
        affected_areas: ['Transfer Pump P-102'],
        estimated_savings: 3200,
        implementation_time: '2 hours',
        related_insights: []
      },
      {
        id: `insight_${baseTime}_4`,
        type: 'inventory',
        title: 'Raw Material Stock Optimization',
        description: 'Hops inventory shows opportunity to reduce carrying costs while maintaining production schedule.',
        priority: 'low',
        timestamp,
        source: 'inventory_optimizer',
        category: 'supply_chain',
        status: 'new',
        actionable: true,
        impact: 'Reduce inventory carrying costs',
        recommendation: 'Adjust next hops delivery by 3 days',
        confidence: 76,
        affected_areas: ['Raw Materials Warehouse'],
        estimated_savings: 420,
        implementation_time: '10 minutes',
        related_insights: []
      }
    ];
  }


  // Max Chat Messages implementation
  async getMaxChatMessages(userId: number): Promise<MaxChatMessage[]> {
    return await db
      .select()
      .from(maxChatMessages)
      .where(eq(maxChatMessages.userId, userId))
      .orderBy(maxChatMessages.createdAt);
  }

  async createMaxChatMessage(message: InsertMaxChatMessage): Promise<MaxChatMessage> {
    const [newMessage] = await db
      .insert(maxChatMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async deleteMaxChatMessages(userId: number): Promise<boolean> {
    const result = await db
      .delete(maxChatMessages)
      .where(eq(maxChatMessages.userId, userId));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
