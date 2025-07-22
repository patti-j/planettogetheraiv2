import { 
  capabilities, resources, jobs, operations, dependencies, resourceViews, customTextLabels, kanbanConfigs, reportConfigs, dashboardConfigs,
  scheduleScenarios, scenarioOperations, scenarioEvaluations, scenarioDiscussions,
  systemUsers, systemHealth, systemEnvironments, systemUpgrades, systemAuditLog, systemSettings,
  capacityPlanningScenarios, staffingPlans, shiftPlans, equipmentPlans, capacityProjections,
  businessGoals, goalProgress, goalRisks, goalIssues, goalKpis, goalActions,
  users, roles, permissions, userRoles, rolePermissions, visualFactoryDisplays,
  disruptions, disruptionActions, disruptionEscalations,
  type Capability, type Resource, type Job, type Operation, type Dependency, type ResourceView, type CustomTextLabel, type KanbanConfig, type ReportConfig, type DashboardConfig,
  type ScheduleScenario, type ScenarioOperation, type ScenarioEvaluation, type ScenarioDiscussion,
  type SystemUser, type SystemHealth, type SystemEnvironment, type SystemUpgrade, type SystemAuditLog, type SystemSettings,
  type CapacityPlanningScenario, type StaffingPlan, type ShiftPlan, type EquipmentPlan, type CapacityProjection,
  type BusinessGoal, type GoalProgress, type GoalRisk, type GoalIssue, type GoalKpi, type GoalAction,
  type User, type Role, type Permission, type UserRole, type RolePermission, type UserWithRoles,
  type Disruption, type DisruptionAction, type DisruptionEscalation,
  type InsertCapability, type InsertResource, type InsertJob, 
  type InsertOperation, type InsertDependency, type InsertResourceView, type InsertCustomTextLabel, type InsertKanbanConfig, type InsertReportConfig, type InsertDashboardConfig,
  type InsertScheduleScenario, type InsertScenarioOperation, type InsertScenarioEvaluation, type InsertScenarioDiscussion,
  type InsertSystemUser, type InsertSystemHealth, type InsertSystemEnvironment, type InsertSystemUpgrade, type InsertSystemAuditLog, type InsertSystemSettings,
  type InsertCapacityPlanningScenario, type InsertStaffingPlan, type InsertShiftPlan, type InsertEquipmentPlan, type InsertCapacityProjection,
  type InsertBusinessGoal, type InsertGoalProgress, type InsertGoalRisk, type InsertGoalIssue, type InsertGoalKpi, type InsertGoalAction,
  type InsertUser, type InsertRole, type InsertPermission, type InsertUserRole, type InsertRolePermission,
  type VisualFactoryDisplay, type InsertVisualFactoryDisplay,
  type InsertDisruption, type InsertDisruptionAction, type InsertDisruptionEscalation,
  demoTourParticipants, type DemoTourParticipant, type InsertDemoTourParticipant,
  voiceRecordingsCache, type VoiceRecordingsCache, type InsertVoiceRecordingsCache,
  tours, type Tour, type InsertTour,
  userPreferences, type UserPreferences, type InsertUserPreferences
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, asc, or, and, count, isNull, isNotNull, lte, gte, like, ne, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
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
  
  // Tours
  getTours(): Promise<Tour[]>;
  getTour(id: number): Promise<Tour | undefined>;
  getTourByRoleId(roleId: number): Promise<Tour | undefined>;
  createTour(tour: InsertTour): Promise<Tour>;
  updateTour(id: number, tour: Partial<InsertTour>): Promise<Tour | undefined>;
  deleteTour(id: number): Promise<boolean>;
  upsertTour(tour: InsertTour): Promise<Tour>;
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

    return {
      ...user,
      roles: Array.from(rolesMap.values()),
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
          .select({ count: sql<number>`count(*)` })
          .from(userRoles)
          .where(eq(userRoles.roleId, role.id));
        
        const userCount = userCountResult[0]?.count || 0;

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
}

export const storage = new DatabaseStorage();
