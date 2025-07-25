import { 
  plants, capabilities, resources, jobs, operations, dependencies, resourceViews, customTextLabels, kanbanConfigs, reportConfigs, dashboardConfigs,
  scheduleScenarios, scenarioOperations, scenarioEvaluations, scenarioDiscussions,
  systemUsers, systemHealth, systemEnvironments, systemUpgrades, systemAuditLog, systemSettings,
  capacityPlanningScenarios, staffingPlans, shiftPlans, equipmentPlans, capacityProjections,
  businessGoals, goalProgress, goalRisks, goalIssues, goalKpis, goalActions,
  users, roles, permissions, userRoles, rolePermissions, visualFactoryDisplays,
  disruptions, disruptionActions, disruptionEscalations,
  inventoryItems, inventoryTransactions, inventoryBalances, demandForecasts, demandDrivers, demandHistory, inventoryOptimizationScenarios, optimizationRecommendations,
  systemIntegrations, integrationJobs, integrationEvents, integrationMappings, integrationTemplates,
  type Plant, type Capability, type Resource, type Job, type Operation, type Dependency, type ResourceView, type CustomTextLabel, type KanbanConfig, type ReportConfig, type DashboardConfig,
  type ScheduleScenario, type ScenarioOperation, type ScenarioEvaluation, type ScenarioDiscussion,
  type SystemUser, type SystemHealth, type SystemEnvironment, type SystemUpgrade, type SystemAuditLog, type SystemSettings,
  type CapacityPlanningScenario, type StaffingPlan, type ShiftPlan, type EquipmentPlan, type CapacityProjection,
  type BusinessGoal, type GoalProgress, type GoalRisk, type GoalIssue, type GoalKpi, type GoalAction,
  type User, type Role, type Permission, type UserRole, type RolePermission, type UserWithRoles,
  type Disruption, type DisruptionAction, type DisruptionEscalation,
  type InventoryItem, type InventoryTransaction, type InventoryBalance, type DemandForecast, type DemandDriver, type DemandHistory, type InventoryOptimizationScenario, type OptimizationRecommendation,
  type SystemIntegration, type IntegrationJob, type IntegrationEvent, type IntegrationMapping, type IntegrationTemplate,
  type InsertPlant, type InsertCapability, type InsertResource, type InsertJob, 
  type InsertOperation, type InsertDependency, type InsertResourceView, type InsertCustomTextLabel, type InsertKanbanConfig, type InsertReportConfig, type InsertDashboardConfig,
  type InsertScheduleScenario, type InsertScenarioOperation, type InsertScenarioEvaluation, type InsertScenarioDiscussion,
  type InsertSystemUser, type InsertSystemHealth, type InsertSystemEnvironment, type InsertSystemUpgrade, type InsertSystemAuditLog, type InsertSystemSettings,
  type InsertCapacityPlanningScenario, type InsertStaffingPlan, type InsertShiftPlan, type InsertEquipmentPlan, type InsertCapacityProjection,
  type InsertBusinessGoal, type InsertGoalProgress, type InsertGoalRisk, type InsertGoalIssue, type InsertGoalKpi, type InsertGoalAction,
  type InsertUser, type InsertRole, type InsertPermission, type InsertUserRole, type InsertRolePermission,
  type VisualFactoryDisplay, type InsertVisualFactoryDisplay,
  type InsertDisruption, type InsertDisruptionAction, type InsertDisruptionEscalation,
  type InsertInventoryItem, type InsertInventoryTransaction, type InsertInventoryBalance, type InsertDemandForecast, type InsertDemandDriver, type InsertDemandHistory, type InsertInventoryOptimizationScenario, type InsertOptimizationRecommendation,
  type InsertSystemIntegration, type InsertIntegrationJob, type InsertIntegrationEvent, type InsertIntegrationMapping, type InsertIntegrationTemplate,
  demoTourParticipants, type DemoTourParticipant, type InsertDemoTourParticipant,
  voiceRecordingsCache, type VoiceRecordingsCache, type InsertVoiceRecordingsCache,
  tours, type Tour, type InsertTour,
  tourPromptTemplates, tourPromptTemplateUsage, type TourPromptTemplate, type TourPromptTemplateUsage, type InsertTourPromptTemplate, type InsertTourPromptTemplateUsage,
  userPreferences, type UserPreferences, type InsertUserPreferences,
  chatChannels, chatMembers, chatMessages, chatReactions,
  type ChatChannel, type ChatMember, type ChatMessage, type ChatReaction,
  type InsertChatChannel, type InsertChatMember, type InsertChatMessage, type InsertChatReaction,
  feedback, feedbackComments, feedbackVotes,
  type Feedback, type FeedbackComment, type FeedbackVote,
  type InsertFeedback, type InsertFeedbackComment, type InsertFeedbackVote,
  workflows, workflowTriggers, workflowActions, workflowActionMappings, workflowExecutions, workflowActionExecutions, workflowMonitoring,
  type Workflow, type WorkflowTrigger, type WorkflowAction, type WorkflowActionMapping, type WorkflowExecution, type WorkflowActionExecution, type WorkflowMonitoring,
  type InsertWorkflow, type InsertWorkflowTrigger, type InsertWorkflowAction, type InsertWorkflowActionMapping, type InsertWorkflowExecution, type InsertWorkflowActionExecution, type InsertWorkflowMonitoring,
  canvasContent, canvasSettings,
  type CanvasContent, type CanvasSettings,
  type InsertCanvasContent, type InsertCanvasSettings,
  aiMemories, aiMemoryTags, aiConversationContext,
  type AIMemory, type AIMemoryTag, type AIConversationContext,
  type InsertAIMemory, type InsertAIMemoryTag, type InsertAIConversationContext,
  errorLogs, errorReports,
  type ErrorLog, type ErrorReport,
  type InsertErrorLog, type InsertErrorReport,
  presentations, presentationSlides, presentationTourIntegrations, presentationLibrary, presentationAnalytics, presentationAIContent,
  presentationMaterials, presentationContentSuggestions, presentationProjects,
  type Presentation, type PresentationSlide, type PresentationTourIntegration, type PresentationLibrary, type PresentationAnalytics, type PresentationAIContent,
  type PresentationMaterial, type PresentationContentSuggestion, type PresentationProject,
  type InsertPresentation, type InsertPresentationSlide, type InsertPresentationTourIntegration, type InsertPresentationLibrary, type InsertPresentationAnalytics, type InsertPresentationAIContent,
  type InsertPresentationMaterial, type InsertPresentationContentSuggestion, type InsertPresentationProject,
  customerJourneyStages, manufacturingSegments, buyerPersonas, marketingPages, contentBlocks, customerStories, leadCaptures, pageAnalytics, abTests, emailCampaigns,
  type CustomerJourneyStage, type ManufacturingSegment, type BuyerPersona, type MarketingPage, type ContentBlock, type CustomerStory, type LeadCapture, type PageAnalytics, type ABTest, type EmailCampaign,
  type InsertCustomerJourneyStage, type InsertManufacturingSegment, type InsertBuyerPersona, type InsertMarketingPage, type InsertContentBlock, type InsertCustomerStory, type InsertLeadCapture, type InsertPageAnalytics, type InsertABTest, type InsertEmailCampaign,
  productionPlans, productionTargets, resourceAllocations, productionMilestones,
  type ProductionPlan, type ProductionTarget, type ResourceAllocation, type ProductionMilestone,
  type InsertProductionPlan, type InsertProductionTarget, type InsertResourceAllocation, type InsertProductionMilestone,
  optimizationAlgorithms, algorithmTests, algorithmDeployments, extensionData,
  type OptimizationAlgorithm, type AlgorithmTest, type AlgorithmDeployment, type ExtensionData,
  type InsertOptimizationAlgorithm, type InsertAlgorithmTest, type InsertAlgorithmDeployment, type InsertExtensionData,
  industryTemplates, userIndustryTemplates, templateConfigurations,
  type IndustryTemplate, type UserIndustryTemplate, type TemplateConfiguration,
  type InsertIndustryTemplate, type InsertUserIndustryTemplate, type InsertTemplateConfiguration,
  shiftTemplates, resourceShiftAssignments, holidays, resourceAbsences, shiftScenarios,
  type ShiftTemplate, type ResourceShiftAssignment, type Holiday, type ResourceAbsence, type ShiftScenario,
  type InsertShiftTemplate, type InsertResourceShiftAssignment, type InsertHoliday, type InsertResourceAbsence, type InsertShiftScenario,
  // accountInfo, billingHistory, usageMetrics,
  // type AccountInfo, type BillingHistory, type UsageMetrics,
  // type InsertAccountInfo, type InsertBillingHistory, type InsertUsageMetrics
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, asc, or, and, count, isNull, isNotNull, lte, gte, like, ilike, ne, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Plants
  getPlants(): Promise<Plant[]>;
  getPlant(id: number): Promise<Plant | undefined>;
  createPlant(plant: InsertPlant): Promise<Plant>;
  updatePlant(id: number, plant: Partial<InsertPlant>): Promise<Plant | undefined>;
  deletePlant(id: number): Promise<boolean>;

  // Capabilities
  getCapabilities(): Promise<Capability[]>;
  createCapability(capability: InsertCapability): Promise<Capability>;
  
  // Resources
  getResources(): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource | undefined>;
  deleteResource(id: number): Promise<boolean>;
  
  // Jobs
  getJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;
  
  // Operations
  getOperations(): Promise<Operation[]>;
  getOperationsByJobId(jobId: number): Promise<Operation[]>;
  getOperation(id: number): Promise<Operation | undefined>;
  createOperation(operation: InsertOperation): Promise<Operation>;
  updateOperation(id: number, operation: Partial<InsertOperation>): Promise<Operation | undefined>;
  deleteOperation(id: number): Promise<boolean>;
  
  // Dependencies
  getDependencies(): Promise<Dependency[]>;
  getDependenciesByOperationId(operationId: number): Promise<Dependency[]>;
  createDependency(dependency: InsertDependency): Promise<Dependency>;
  deleteDependency(id: number): Promise<boolean>;
  
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
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserWithRoles(id: number): Promise<UserWithRoles | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  authenticateUser(username: string, password: string): Promise<UserWithRoles | null>;

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

  // Inventory Management
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  getInventoryItemBySku(sku: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  
  getInventoryTransactions(itemId?: number): Promise<InventoryTransaction[]>;
  createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction>;
  
  getInventoryBalances(): Promise<InventoryBalance[]>;
  getInventoryBalance(itemId: number, location?: string): Promise<InventoryBalance | undefined>;
  updateInventoryBalance(itemId: number, location: string, balance: Partial<InsertInventoryBalance>): Promise<InventoryBalance | undefined>;
  
  // Demand Forecasting
  getDemandForecasts(itemId?: number): Promise<DemandForecast[]>;
  createDemandForecast(forecast: InsertDemandForecast): Promise<DemandForecast>;
  updateDemandForecast(id: number, forecast: Partial<InsertDemandForecast>): Promise<DemandForecast | undefined>;
  deleteDemandForecast(id: number): Promise<boolean>;
  
  getDemandDrivers(): Promise<DemandDriver[]>;
  createDemandDriver(driver: InsertDemandDriver): Promise<DemandDriver>;
  updateDemandDriver(id: number, driver: Partial<InsertDemandDriver>): Promise<DemandDriver | undefined>;
  deleteDemandDriver(id: number): Promise<boolean>;
  
  getDemandHistory(itemId?: number): Promise<DemandHistory[]>;
  createDemandHistory(history: InsertDemandHistory): Promise<DemandHistory>;
  
  // Inventory Optimization
  getInventoryOptimizationScenarios(): Promise<InventoryOptimizationScenario[]>;
  getInventoryOptimizationScenario(id: number): Promise<InventoryOptimizationScenario | undefined>;
  createInventoryOptimizationScenario(scenario: InsertInventoryOptimizationScenario): Promise<InventoryOptimizationScenario>;
  updateInventoryOptimizationScenario(id: number, scenario: Partial<InsertInventoryOptimizationScenario>): Promise<InventoryOptimizationScenario | undefined>;
  deleteInventoryOptimizationScenario(id: number): Promise<boolean>;
  
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
  
  // Canvas Settings Management
  getCanvasSettings(userId: number, sessionId: string): Promise<CanvasSettings | undefined>;
  upsertCanvasSettings(settings: InsertCanvasSettings): Promise<CanvasSettings>;
  updateCanvasSettings(userId: number, sessionId: string, settings: Partial<InsertCanvasSettings>): Promise<CanvasSettings | undefined>;

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

  // Customer Journey Marketing System
  // Customer Journey Stages
  getCustomerJourneyStages(): Promise<CustomerJourneyStage[]>;
  getCustomerJourneyStage(id: number): Promise<CustomerJourneyStage | undefined>;
  createCustomerJourneyStage(stage: InsertCustomerJourneyStage): Promise<CustomerJourneyStage>;
  updateCustomerJourneyStage(id: number, updates: Partial<InsertCustomerJourneyStage>): Promise<CustomerJourneyStage | undefined>;
  deleteCustomerJourneyStage(id: number): Promise<boolean>;

  // Manufacturing Segments
  getManufacturingSegments(type?: string): Promise<ManufacturingSegment[]>;
  getManufacturingSegment(id: number): Promise<ManufacturingSegment | undefined>;
  createManufacturingSegment(segment: InsertManufacturingSegment): Promise<ManufacturingSegment>;
  updateManufacturingSegment(id: number, updates: Partial<InsertManufacturingSegment>): Promise<ManufacturingSegment | undefined>;
  deleteManufacturingSegment(id: number): Promise<boolean>;

  // Buyer Personas
  getBuyerPersonas(roleType?: string, department?: string): Promise<BuyerPersona[]>;
  getBuyerPersona(id: number): Promise<BuyerPersona | undefined>;
  createBuyerPersona(persona: InsertBuyerPersona): Promise<BuyerPersona>;
  updateBuyerPersona(id: number, updates: Partial<InsertBuyerPersona>): Promise<BuyerPersona | undefined>;
  deleteBuyerPersona(id: number): Promise<boolean>;

  // Marketing Pages
  getMarketingPages(language?: string, stageId?: number): Promise<MarketingPage[]>;
  getMarketingPage(id: number): Promise<MarketingPage | undefined>;
  getMarketingPageBySlug(slug: string, language?: string): Promise<MarketingPage | undefined>;
  createMarketingPage(page: InsertMarketingPage): Promise<MarketingPage>;
  updateMarketingPage(id: number, updates: Partial<InsertMarketingPage>): Promise<MarketingPage | undefined>;
  deleteMarketingPage(id: number): Promise<boolean>;
  publishMarketingPage(id: number): Promise<MarketingPage | undefined>;

  // Content Blocks
  getContentBlocks(type?: string, category?: string, language?: string): Promise<ContentBlock[]>;
  getContentBlock(id: number): Promise<ContentBlock | undefined>;
  createContentBlock(block: InsertContentBlock): Promise<ContentBlock>;
  updateContentBlock(id: number, updates: Partial<InsertContentBlock>): Promise<ContentBlock | undefined>;
  deleteContentBlock(id: number): Promise<boolean>;

  // Customer Stories
  getCustomerStories(industry?: string, storyType?: string, language?: string): Promise<CustomerStory[]>;
  getCustomerStory(id: number): Promise<CustomerStory | undefined>;
  createCustomerStory(story: InsertCustomerStory): Promise<CustomerStory>;
  updateCustomerStory(id: number, updates: Partial<InsertCustomerStory>): Promise<CustomerStory | undefined>;
  deleteCustomerStory(id: number): Promise<boolean>;
  approveCustomerStory(id: number): Promise<CustomerStory | undefined>;

  // Lead Captures
  getLeadCaptures(pageId?: number, dateRange?: { from: Date; to: Date }): Promise<LeadCapture[]>;
  getLeadCapture(id: number): Promise<LeadCapture | undefined>;
  createLeadCapture(lead: InsertLeadCapture): Promise<LeadCapture>;
  updateLeadCapture(id: number, updates: Partial<InsertLeadCapture>): Promise<LeadCapture | undefined>;
  deleteLeadCapture(id: number): Promise<boolean>;
  getLeadsByEmail(email: string): Promise<LeadCapture[]>;
  updateLeadScore(id: number, score: number): Promise<LeadCapture | undefined>;

  // Page Analytics
  getPageAnalytics(pageId?: number, dateRange?: { from: Date; to: Date }): Promise<PageAnalytics[]>;
  getPageAnalyticsByDate(pageId: number, date: Date): Promise<PageAnalytics | undefined>;
  createPageAnalytics(analytics: InsertPageAnalytics): Promise<PageAnalytics>;
  updatePageAnalytics(pageId: number, date: Date, updates: Partial<InsertPageAnalytics>): Promise<PageAnalytics | undefined>;
  getTopPerformingPages(limit?: number): Promise<(PageAnalytics & { page: MarketingPage })[]>;

  // A/B Tests
  getABTests(pageId?: number, status?: string): Promise<ABTest[]>;
  getABTest(id: number): Promise<ABTest | undefined>;
  createABTest(test: InsertABTest): Promise<ABTest>;
  updateABTest(id: number, updates: Partial<InsertABTest>): Promise<ABTest | undefined>;
  deleteABTest(id: number): Promise<boolean>;
  startABTest(id: number): Promise<ABTest | undefined>;
  endABTest(id: number): Promise<ABTest | undefined>;

  // Email Campaigns
  getEmailCampaigns(type?: string, language?: string): Promise<EmailCampaign[]>;
  getEmailCampaign(id: number): Promise<EmailCampaign | undefined>;
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  updateEmailCampaign(id: number, updates: Partial<InsertEmailCampaign>): Promise<EmailCampaign | undefined>;
  deleteEmailCampaign(id: number): Promise<boolean>;
  sendEmailCampaign(id: number): Promise<EmailCampaign | undefined>;

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
}

export class MemStorage implements IStorage {
  private capabilities: Map<number, Capability> = new Map();
  private resources: Map<number, Resource> = new Map();
  private jobs: Map<number, Job> = new Map();
  private operations: Map<number, Operation> = new Map();
  private dependencies: Map<number, Dependency> = new Map();
  private resourceViews: Map<number, ResourceView> = new Map();
  
  private currentCapabilityId = 1;
  private currentResourceId = 1;
  private currentJobId = 1;
  private currentOperationId = 1;
  private currentDependencyId = 1;
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
        name: cap.name,
        description: cap.description || null
      };
      this.capabilities.set(capability.id, capability);
    });

    // Default resources
    const defaultResources = [
      { name: "CNC-001", type: "Machine", status: "active", capabilities: [1] },
      { name: "CNC-002", type: "Machine", status: "active", capabilities: [1] },
      { name: "WLD-001", type: "Welding Station", status: "active", capabilities: [2] },
      { name: "ASM-001", type: "Assembly Station", status: "active", capabilities: [3] },
      { name: "QC-001", type: "Quality Station", status: "active", capabilities: [4] },
    ];

    defaultResources.forEach(res => {
      const resource: Resource = { 
        id: this.currentResourceId++, 
        name: res.name,
        type: res.type,
        status: res.status || "active",
        capabilities: res.capabilities as number[]
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
      const job: Job = {
        id: this.currentJobId++,
        name: jobData.name,
        customer: jobData.customer,
        description: jobData.description,
        priority: jobData.priority,
        status: jobData.status,
        dueDate: jobData.dueDate,
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

    sampleOperations.forEach(opData => {
      const operation: Operation = {
        id: this.currentOperationId++,
        jobId: opData.jobId,
        name: opData.name,
        description: opData.description,
        status: opData.status,
        duration: opData.duration,
        requiredCapabilities: opData.requiredCapabilities,
        assignedResourceId: opData.assignedResourceId,
        startTime: opData.startTime,
        endTime: opData.endTime,
        order: opData.order,
      };
      this.operations.set(operation.id, operation);
    });
  }

  // Capabilities
  async getCapabilities(): Promise<Capability[]> {
    return Array.from(this.capabilities.values());
  }

  async createCapability(capability: InsertCapability): Promise<Capability> {
    const newCapability: Capability = { 
      id: this.currentCapabilityId++, 
      name: capability.name,
      description: capability.description || null
    };
    this.capabilities.set(newCapability.id, newCapability);
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
    const newResource: Resource = { 
      id: this.currentResourceId++, 
      name: resource.name,
      type: resource.type,
      status: resource.status || "active",
      capabilities: (resource.capabilities as number[]) || null
    };
    this.resources.set(newResource.id, newResource);
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

  // Jobs
  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(job: InsertJob): Promise<Job> {
    const newJob: Job = { 
      id: this.currentJobId++, 
      name: job.name,
      description: job.description || null,
      customer: job.customer,
      priority: job.priority || "medium",
      status: job.status || "planned",
      dueDate: job.dueDate || null,
      createdAt: new Date()
    };
    this.jobs.set(newJob.id, newJob);
    return newJob;
  }

  async updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined> {
    const existing = this.jobs.get(id);
    if (!existing) return undefined;
    
    const updated: Job = { ...existing, ...job };
    this.jobs.set(id, updated);
    return updated;
  }

  async deleteJob(id: number): Promise<boolean> {
    // Also delete associated operations
    const operationsToDelete = Array.from(this.operations.values())
      .filter(op => op.jobId === id);
    
    operationsToDelete.forEach(op => {
      this.operations.delete(op.id);
    });
    
    return this.jobs.delete(id);
  }

  // Operations
  async getOperations(): Promise<Operation[]> {
    return Array.from(this.operations.values());
  }

  async getOperationsByJobId(jobId: number): Promise<Operation[]> {
    return Array.from(this.operations.values())
      .filter(op => op.jobId === jobId)
      .sort((a, b) => a.order - b.order);
  }

  async getOperation(id: number): Promise<Operation | undefined> {
    return this.operations.get(id);
  }

  async createOperation(operation: InsertOperation): Promise<Operation> {
    const newOperation: Operation = { 
      id: this.currentOperationId++, 
      jobId: operation.jobId,
      name: operation.name,
      description: operation.description || null,
      status: operation.status || "planned",
      duration: operation.duration,
      requiredCapabilities: (operation.requiredCapabilities as number[]) || null,
      assignedResourceId: operation.assignedResourceId || null,
      startTime: operation.startTime || null,
      endTime: operation.endTime || null,
      order: operation.order || 0
    };
    this.operations.set(newOperation.id, newOperation);
    return newOperation;
  }

  async updateOperation(id: number, operation: Partial<InsertOperation>): Promise<Operation | undefined> {
    const existing = this.operations.get(id);
    if (!existing) return undefined;
    
    const updated: Operation = { ...existing, ...operation };
    this.operations.set(id, updated);
    return updated;
  }

  async deleteOperation(id: number): Promise<boolean> {
    // Also delete associated dependencies
    const dependenciesToDelete = Array.from(this.dependencies.values())
      .filter(dep => dep.fromOperationId === id || dep.toOperationId === id);
    
    dependenciesToDelete.forEach(dep => {
      this.dependencies.delete(dep.id);
    });
    
    return this.operations.delete(id);
  }

  // Dependencies
  async getDependencies(): Promise<Dependency[]> {
    return Array.from(this.dependencies.values());
  }

  async getDependenciesByOperationId(operationId: number): Promise<Dependency[]> {
    return Array.from(this.dependencies.values())
      .filter(dep => dep.fromOperationId === operationId || dep.toOperationId === operationId);
  }

  async createDependency(dependency: InsertDependency): Promise<Dependency> {
    const newDependency: Dependency = { id: this.currentDependencyId++, ...dependency };
    this.dependencies.set(newDependency.id, newDependency);
    return newDependency;
  }

  async deleteDependency(id: number): Promise<boolean> {
    return this.dependencies.delete(id);
  }

  async getResourceViews(): Promise<ResourceView[]> {
    return Array.from(this.resourceViews.values());
  }

  async getResourceView(id: number): Promise<ResourceView | undefined> {
    return this.resourceViews.get(id);
  }

  async createResourceView(resourceView: InsertResourceView): Promise<ResourceView> {
    const newResourceView: ResourceView = { 
      id: this.currentResourceViewId++, 
      ...resourceView,
      createdAt: new Date()
    };
    this.resourceViews.set(newResourceView.id, newResourceView);
    return newResourceView;
  }

  async updateResourceView(id: number, resourceView: Partial<InsertResourceView>): Promise<ResourceView | undefined> {
    const existing = this.resourceViews.get(id);
    if (!existing) return undefined;
    
    const updated: ResourceView = { ...existing, ...resourceView };
    this.resourceViews.set(id, updated);
    return updated;
  }

  async deleteResourceView(id: number): Promise<boolean> {
    return this.resourceViews.delete(id);
  }

  async getDefaultResourceView(): Promise<ResourceView | undefined> {
    return Array.from(this.resourceViews.values()).find(view => view.isDefault);
  }

  async setDefaultResourceView(id: number): Promise<void> {
    // First, set all existing views to non-default
    Array.from(this.resourceViews.values()).forEach(view => {
      view.isDefault = false;
      this.resourceViews.set(view.id, view);
    });
    
    // Then set the specified view as default
    const view = this.resourceViews.get(id);
    if (view) {
      view.isDefault = true;
      this.resourceViews.set(id, view);
    }
  }
}

export class DatabaseStorage implements IStorage {
  // Plants
  async getPlants(): Promise<Plant[]> {
    return await db.select().from(plants).orderBy(asc(plants.name));
  }

  async getPlant(id: number): Promise<Plant | undefined> {
    const result = await db.select().from(plants).where(eq(plants.id, id)).limit(1);
    return result[0];
  }

  async createPlant(plant: InsertPlant): Promise<Plant> {
    const result = await db.insert(plants).values(plant).returning();
    return result[0];
  }

  async updatePlant(id: number, plant: Partial<InsertPlant>): Promise<Plant | undefined> {
    const result = await db.update(plants).set(plant).where(eq(plants.id, id)).returning();
    return result[0];
  }

  async deletePlant(id: number): Promise<boolean> {
    const result = await db.delete(plants).where(eq(plants.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getCapabilities(): Promise<Capability[]> {
    return await db.select().from(capabilities);
  }

  async createCapability(capability: InsertCapability): Promise<Capability> {
    const [newCapability] = await db
      .insert(capabilities)
      .values(capability)
      .returning();
    return newCapability;
  }

  async getResources(): Promise<Resource[]> {
    return await db.select().from(resources);
  }

  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
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
      .where(eq(resources.id, id))
      .returning();
    return updatedResource || undefined;
  }

  async deleteResource(id: number): Promise<boolean> {
    const result = await db.delete(resources).where(eq(resources.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db
      .insert(jobs)
      .values(job)
      .returning();
    return newJob;
  }

  async updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined> {
    const [updatedJob] = await db
      .update(jobs)
      .set(job)
      .where(eq(jobs.id, id))
      .returning();
    return updatedJob || undefined;
  }

  async deleteJob(id: number): Promise<boolean> {
    // First delete associated operations
    await db.delete(operations).where(eq(operations.jobId, id));
    
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getOperations(): Promise<Operation[]> {
    return await db.select().from(operations);
  }

  async getOperationsByJobId(jobId: number): Promise<Operation[]> {
    return await db.select().from(operations).where(eq(operations.jobId, jobId));
  }

  async getOperation(id: number): Promise<Operation | undefined> {
    const [operation] = await db.select().from(operations).where(eq(operations.id, id));
    return operation || undefined;
  }

  async createOperation(operation: InsertOperation): Promise<Operation> {
    const [newOperation] = await db
      .insert(operations)
      .values(operation)
      .returning();
    return newOperation;
  }

  async updateOperation(id: number, operation: Partial<InsertOperation>): Promise<Operation | undefined> {
    const [updatedOperation] = await db
      .update(operations)
      .set(operation)
      .where(eq(operations.id, id))
      .returning();
    return updatedOperation || undefined;
  }

  async deleteOperation(id: number): Promise<boolean> {
    // First delete associated dependencies
    await db.delete(dependencies).where(eq(dependencies.fromOperationId, id));
    await db.delete(dependencies).where(eq(dependencies.toOperationId, id));
    
    const result = await db.delete(operations).where(eq(operations.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getDependencies(): Promise<Dependency[]> {
    return await db.select().from(dependencies);
  }

  async getDependenciesByOperationId(operationId: number): Promise<Dependency[]> {
    return await db.select().from(dependencies).where(
      eq(dependencies.fromOperationId, operationId)
    );
  }

  async createDependency(dependency: InsertDependency): Promise<Dependency> {
    const [newDependency] = await db
      .insert(dependencies)
      .values(dependency)
      .returning();
    return newDependency;
  }

  async deleteDependency(id: number): Promise<boolean> {
    const result = await db.delete(dependencies).where(eq(dependencies.id, id));
    return (result.rowCount || 0) > 0;
  }

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

  // User Management
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
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
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(user.passwordHash, 12);
    const userWithHashedPassword = { ...user, passwordHash: hashedPassword };
    
    const [newUser] = await db
      .insert(users)
      .values(userWithHashedPassword)
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

  private async getUserWithRolesByUsername(username: string): Promise<UserWithRoles | undefined> {
    // Make username lookup case-insensitive
    const [user] = await db.select().from(users).where(sql`LOWER(${users.username}) = LOWER(${username})`);
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
  async updateUserProfile(userId: number, profile: { avatar?: string; jobTitle?: string; department?: string; phoneNumber?: string; }): Promise<User | undefined> {
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

  // Inventory Management
  async getInventoryItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems).orderBy(asc(inventoryItems.name));
  }

  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item || undefined;
  }

  async getInventoryItemBySku(sku: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.sku, sku));
    return item || undefined;
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [newItem] = await db.insert(inventoryItems).values(item).returning();
    return newItem;
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    return updatedItem || undefined;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    const result = await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
    return result.rowCount! > 0;
  }

  async getInventoryTransactions(itemId?: number): Promise<InventoryTransaction[]> {
    if (itemId) {
      return await db.select().from(inventoryTransactions)
        .where(eq(inventoryTransactions.itemId, itemId))
        .orderBy(desc(inventoryTransactions.createdAt));
    }
    return await db.select().from(inventoryTransactions).orderBy(desc(inventoryTransactions.createdAt));
  }

  async createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    const [newTransaction] = await db.insert(inventoryTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getInventoryBalances(): Promise<InventoryBalance[]> {
    return await db.select().from(inventoryBalances).orderBy(asc(inventoryBalances.itemId));
  }

  async getInventoryBalance(itemId: number, location?: string): Promise<InventoryBalance | undefined> {
    let query = db.select().from(inventoryBalances).where(eq(inventoryBalances.itemId, itemId));
    if (location) {
      query = query.where(eq(inventoryBalances.location, location));
    }
    const [balance] = await query;
    return balance || undefined;
  }

  async updateInventoryBalance(itemId: number, location: string, balance: Partial<InsertInventoryBalance>): Promise<InventoryBalance | undefined> {
    const [updatedBalance] = await db
      .update(inventoryBalances)
      .set({ ...balance, updatedAt: new Date() })
      .where(and(eq(inventoryBalances.itemId, itemId), eq(inventoryBalances.location, location)))
      .returning();
    return updatedBalance || undefined;
  }

  // Demand Forecasting
  async getDemandForecasts(itemId?: number): Promise<DemandForecast[]> {
    if (itemId) {
      return await db.select().from(demandForecasts)
        .where(eq(demandForecasts.itemId, itemId))
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

  // Inventory Optimization
  async getInventoryOptimizationScenarios(): Promise<InventoryOptimizationScenario[]> {
    return await db.select().from(inventoryOptimizationScenarios).orderBy(desc(inventoryOptimizationScenarios.createdAt));
  }

  async getInventoryOptimizationScenario(id: number): Promise<InventoryOptimizationScenario | undefined> {
    const [scenario] = await db.select().from(inventoryOptimizationScenarios).where(eq(inventoryOptimizationScenarios.id, id));
    return scenario || undefined;
  }

  async createInventoryOptimizationScenario(scenario: InsertInventoryOptimizationScenario): Promise<InventoryOptimizationScenario> {
    const [newScenario] = await db.insert(inventoryOptimizationScenarios).values(scenario).returning();
    return newScenario;
  }

  async updateInventoryOptimizationScenario(id: number, scenario: Partial<InsertInventoryOptimizationScenario>): Promise<InventoryOptimizationScenario | undefined> {
    const [updatedScenario] = await db
      .update(inventoryOptimizationScenarios)
      .set({ ...scenario, updatedAt: new Date() })
      .where(eq(inventoryOptimizationScenarios.id, id))
      .returning();
    return updatedScenario || undefined;
  }

  async deleteInventoryOptimizationScenario(id: number): Promise<boolean> {
    const result = await db.delete(inventoryOptimizationScenarios).where(eq(inventoryOptimizationScenarios.id, id));
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

  // Plant Management Implementation
  async createPlant(plant: InsertPlant): Promise<Plant> {
    const [newPlant] = await db.insert(plants).values(plant).returning();
    return newPlant;
  }

  async getPlants(): Promise<Plant[]> {
    return await db.select().from(plants).orderBy(asc(plants.name));
  }

  async getPlantById(id: number): Promise<Plant | null> {
    const [plant] = await db.select().from(plants).where(eq(plants.id, id));
    return plant || null;
  }

  async updatePlant(id: number, updates: Partial<InsertPlant>): Promise<Plant | null> {
    const [updatedPlant] = await db
      .update(plants)
      .set(updates)
      .where(eq(plants.id, id))
      .returning();
    return updatedPlant || null;
  }

  async deletePlant(id: number): Promise<boolean> {
    const result = await db.delete(plants).where(eq(plants.id, id));
    return result.rowCount! > 0;
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
  async getCustomerJourneyStages(): Promise<CustomerJourneyStage[]> {
    return await db.select().from(customerJourneyStages)
      .where(eq(customerJourneyStages.isActive, true))
      .orderBy(asc(customerJourneyStages.orderIndex));
  }

  async getCustomerJourneyStage(id: number): Promise<CustomerJourneyStage | undefined> {
    const [stage] = await db.select().from(customerJourneyStages)
      .where(eq(customerJourneyStages.id, id));
    return stage;
  }

  async createCustomerJourneyStage(stage: InsertCustomerJourneyStage): Promise<CustomerJourneyStage> {
    const [newStage] = await db.insert(customerJourneyStages).values(stage).returning();
    return newStage;
  }

  async updateCustomerJourneyStage(id: number, stage: Partial<InsertCustomerJourneyStage>): Promise<CustomerJourneyStage | undefined> {
    const [updated] = await db.update(customerJourneyStages)
      .set(stage)
      .where(eq(customerJourneyStages.id, id))
      .returning();
    return updated;
  }

  // Manufacturing Segments
  async getManufacturingSegments(): Promise<ManufacturingSegment[]> {
    return await db.select().from(manufacturingSegments)
      .where(eq(manufacturingSegments.isActive, true))
      .orderBy(asc(manufacturingSegments.name));
  }

  async getManufacturingSegmentsByType(type: string): Promise<ManufacturingSegment[]> {
    return await db.select().from(manufacturingSegments)
      .where(and(eq(manufacturingSegments.type, type), eq(manufacturingSegments.isActive, true)))
      .orderBy(asc(manufacturingSegments.name));
  }

  async createManufacturingSegment(segment: InsertManufacturingSegment): Promise<ManufacturingSegment> {
    const [newSegment] = await db.insert(manufacturingSegments).values(segment).returning();
    return newSegment;
  }

  async updateManufacturingSegment(id: number, segment: Partial<InsertManufacturingSegment>): Promise<ManufacturingSegment | undefined> {
    const [updated] = await db.update(manufacturingSegments)
      .set(segment)
      .where(eq(manufacturingSegments.id, id))
      .returning();
    return updated;
  }

  // Buyer Personas
  async getBuyerPersonas(): Promise<BuyerPersona[]> {
    return await db.select().from(buyerPersonas)
      .where(eq(buyerPersonas.isActive, true))
      .orderBy(asc(buyerPersonas.name));
  }

  async getBuyerPersonasByRole(roleType: string): Promise<BuyerPersona[]> {
    return await db.select().from(buyerPersonas)
      .where(and(eq(buyerPersonas.roleType, roleType), eq(buyerPersonas.isActive, true)))
      .orderBy(asc(buyerPersonas.name));
  }

  async createBuyerPersona(persona: InsertBuyerPersona): Promise<BuyerPersona> {
    const [newPersona] = await db.insert(buyerPersonas).values(persona).returning();
    return newPersona;
  }

  async updateBuyerPersona(id: number, persona: Partial<InsertBuyerPersona>): Promise<BuyerPersona | undefined> {
    const [updated] = await db.update(buyerPersonas)
      .set(persona)
      .where(eq(buyerPersonas.id, id))
      .returning();
    return updated;
  }

  // Marketing Pages
  async getMarketingPages(stageId?: number, language?: string): Promise<MarketingPage[]> {
    let query = db.select().from(marketingPages);
    
    const conditions = [];
    if (stageId) conditions.push(eq(marketingPages.stageId, stageId));
    if (language) conditions.push(eq(marketingPages.language, language));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(marketingPages.createdAt));
  }

  async getMarketingPage(id: number): Promise<MarketingPage | undefined> {
    const [page] = await db.select().from(marketingPages)
      .where(eq(marketingPages.id, id));
    return page;
  }

  async getMarketingPageBySlug(slug: string, language?: string): Promise<MarketingPage | undefined> {
    const conditions = [eq(marketingPages.slug, slug)];
    if (language) conditions.push(eq(marketingPages.language, language));
    
    const [page] = await db.select().from(marketingPages)
      .where(and(...conditions));
    return page;
  }

  async createMarketingPage(page: InsertMarketingPage): Promise<MarketingPage> {
    const [newPage] = await db.insert(marketingPages).values(page).returning();
    return newPage;
  }

  async updateMarketingPage(id: number, page: Partial<InsertMarketingPage>): Promise<MarketingPage | undefined> {
    const [updated] = await db.update(marketingPages)
      .set({ ...page, updatedAt: new Date() })
      .where(eq(marketingPages.id, id))
      .returning();
    return updated;
  }

  async deleteMarketingPage(id: number): Promise<boolean> {
    const result = await db.delete(marketingPages)
      .where(eq(marketingPages.id, id));
    return result.rowCount! > 0;
  }

  // Content Blocks
  async getContentBlocks(category?: string, language?: string): Promise<ContentBlock[]> {
    let query = db.select().from(contentBlocks)
      .where(eq(contentBlocks.isActive, true));
    
    const conditions = [eq(contentBlocks.isActive, true)];
    if (category) conditions.push(eq(contentBlocks.category, category));
    if (language) conditions.push(eq(contentBlocks.language, language));
    
    if (conditions.length > 1) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(contentBlocks.usageCount), desc(contentBlocks.createdAt));
  }

  async getContentBlock(id: number): Promise<ContentBlock | undefined> {
    const [block] = await db.select().from(contentBlocks)
      .where(eq(contentBlocks.id, id));
    return block;
  }

  async createContentBlock(block: InsertContentBlock): Promise<ContentBlock> {
    const [newBlock] = await db.insert(contentBlocks).values(block).returning();
    return newBlock;
  }

  async updateContentBlock(id: number, block: Partial<InsertContentBlock>): Promise<ContentBlock | undefined> {
    const [updated] = await db.update(contentBlocks)
      .set({ ...block, updatedAt: new Date() })
      .where(eq(contentBlocks.id, id))
      .returning();
    return updated;
  }

  async incrementContentBlockUsage(id: number): Promise<void> {
    await db.update(contentBlocks)
      .set({ usageCount: sql`${contentBlocks.usageCount} + 1` })
      .where(eq(contentBlocks.id, id));
  }

  // Customer Stories
  async getCustomerStories(industry?: string, language?: string): Promise<CustomerStory[]> {
    let query = db.select().from(customerStories)
      .where(eq(customerStories.isApproved, true));
    
    const conditions = [eq(customerStories.isApproved, true)];
    if (industry) conditions.push(eq(customerStories.industry, industry));
    if (language) conditions.push(eq(customerStories.language, language));
    
    if (conditions.length > 1) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(customerStories.isFeatured), desc(customerStories.effectivenessScore));
  }

  async getCustomerStory(id: number): Promise<CustomerStory | undefined> {
    const [story] = await db.select().from(customerStories)
      .where(eq(customerStories.id, id));
    return story;
  }

  async createCustomerStory(story: InsertCustomerStory): Promise<CustomerStory> {
    const [newStory] = await db.insert(customerStories).values(story).returning();
    return newStory;
  }

  async updateCustomerStory(id: number, story: Partial<InsertCustomerStory>): Promise<CustomerStory | undefined> {
    const [updated] = await db.update(customerStories)
      .set({ ...story, updatedAt: new Date() })
      .where(eq(customerStories.id, id))
      .returning();
    return updated;
  }

  // Lead Captures
  async createLeadCapture(lead: InsertLeadCapture): Promise<LeadCapture> {
    const [newLead] = await db.insert(leadCaptures).values(lead).returning();
    return newLead;
  }

  async getLeadCaptures(pageId?: number, stage?: string): Promise<LeadCapture[]> {
    let query = db.select().from(leadCaptures);
    
    const conditions = [];
    if (pageId) conditions.push(eq(leadCaptures.pageId, pageId));
    if (stage) conditions.push(eq(leadCaptures.stage, stage));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(leadCaptures.createdAt));
  }

  async updateLeadCapture(id: number, lead: Partial<InsertLeadCapture>): Promise<LeadCapture | undefined> {
    const [updated] = await db.update(leadCaptures)
      .set({ ...lead, updatedAt: new Date() })
      .where(eq(leadCaptures.id, id))
      .returning();
    return updated;
  }

  async getLeadsByEmail(email: string): Promise<LeadCapture[]> {
    return await db.select().from(leadCaptures)
      .where(eq(leadCaptures.email, email))
      .orderBy(desc(leadCaptures.createdAt));
  }

  // Page Analytics
  async getPageAnalytics(pageId: number, startDate?: Date, endDate?: Date): Promise<PageAnalytics[]> {
    let query = db.select().from(pageAnalytics)
      .where(eq(pageAnalytics.pageId, pageId));
    
    if (startDate && endDate) {
      query = query.where(and(
        eq(pageAnalytics.pageId, pageId),
        gte(pageAnalytics.date, startDate),
        lte(pageAnalytics.date, endDate)
      ));
    }
    
    return await query.orderBy(desc(pageAnalytics.date));
  }

  async createPageAnalytics(analytics: InsertPageAnalytics): Promise<PageAnalytics> {
    const [newAnalytics] = await db.insert(pageAnalytics).values(analytics).returning();
    return newAnalytics;
  }

  async updatePageAnalytics(pageId: number, date: Date, analytics: Partial<InsertPageAnalytics>): Promise<PageAnalytics | undefined> {
    const [updated] = await db.update(pageAnalytics)
      .set(analytics)
      .where(and(eq(pageAnalytics.pageId, pageId), eq(pageAnalytics.date, date)))
      .returning();
    return updated;
  }

  // A/B Tests
  async getABTests(pageId?: number): Promise<ABTest[]> {
    let query = db.select().from(abTests);
    if (pageId) {
      query = query.where(eq(abTests.pageId, pageId));
    }
    return await query.orderBy(desc(abTests.createdAt));
  }

  async getABTest(id: number): Promise<ABTest | undefined> {
    const [test] = await db.select().from(abTests)
      .where(eq(abTests.id, id));
    return test;
  }

  async createABTest(test: InsertABTest): Promise<ABTest> {
    const [newTest] = await db.insert(abTests).values(test).returning();
    return newTest;
  }

  async updateABTest(id: number, test: Partial<InsertABTest>): Promise<ABTest | undefined> {
    const [updated] = await db.update(abTests)
      .set({ ...test, updatedAt: new Date() })
      .where(eq(abTests.id, id))
      .returning();
    return updated;
  }

  // Email Campaigns
  async getEmailCampaigns(status?: string, language?: string): Promise<EmailCampaign[]> {
    let query = db.select().from(emailCampaigns);
    
    const conditions = [];
    if (status) conditions.push(eq(emailCampaigns.status, status));
    if (language) conditions.push(eq(emailCampaigns.language, language));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(emailCampaigns.createdAt));
  }

  async getEmailCampaign(id: number): Promise<EmailCampaign | undefined> {
    const [campaign] = await db.select().from(emailCampaigns)
      .where(eq(emailCampaigns.id, id));
    return campaign;
  }

  async createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const [newCampaign] = await db.insert(emailCampaigns).values(campaign).returning();
    return newCampaign;
  }

  async updateEmailCampaign(id: number, campaign: Partial<InsertEmailCampaign>): Promise<EmailCampaign | undefined> {
    const [updated] = await db.update(emailCampaigns)
      .set({ ...campaign, updatedAt: new Date() })
      .where(eq(emailCampaigns.id, id))
      .returning();
    return updated;
  }

  async updateEmailCampaignStats(id: number, stats: {
    sentCount?: number;
    openRate?: number;
    clickRate?: number;
    conversionRate?: number;
    unsubscribeRate?: number;
  }): Promise<EmailCampaign | undefined> {
    const [updated] = await db.update(emailCampaigns)
      .set({ ...stats, updatedAt: new Date() })
      .where(eq(emailCampaigns.id, id))
      .returning();
    return updated;
  }

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
    let query = db
      .select({
        id: resourceShiftAssignments.id,
        resourceId: resourceShiftAssignments.resourceId,
        shiftTemplateId: resourceShiftAssignments.shiftTemplateId,
        effectiveDate: resourceShiftAssignments.effectiveDate,
        endDate: resourceShiftAssignments.endDate,
        isActive: resourceShiftAssignments.isActive,
        createdAt: resourceShiftAssignments.createdAt,
        updatedAt: resourceShiftAssignments.updatedAt,
        // Include related data
        resourceName: resources.name,
        shiftTemplateName: shiftTemplates.name,
        startTime: shiftTemplates.startTime,
        endTime: shiftTemplates.endTime
      })
      .from(resourceShiftAssignments)
      .leftJoin(resources, eq(resourceShiftAssignments.resourceId, resources.id))
      .leftJoin(shiftTemplates, eq(resourceShiftAssignments.shiftTemplateId, shiftTemplates.id));
    
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
}

export const storage = new DatabaseStorage();
