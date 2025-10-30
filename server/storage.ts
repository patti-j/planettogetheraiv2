import { 
  users, roles, permissions, userRoles, rolePermissions, 
  companyOnboarding, userPreferences, recentPages,
  ptPlants, ptResources, ptJobs, ptJobOperations, ptManufacturingOrders,
  schedulingConversations, schedulingMessages, savedSchedules,
  widgets,
  agentConnections, agentActions, agentMetricsHourly, agentPolicies, agentAlerts,
  ptProductWheels, ptProductWheelSegments, ptProductWheelSchedule, ptProductWheelPerformance,
  calendars, maintenancePeriods,
  plantKpiTargets, plantKpiPerformance, autonomousOptimization,
  // Optimization Studio tables
  optimizationAlgorithms, optimizationProfiles,
  algorithmTests, algorithmDeployments, algorithmFeedback,
  algorithmFeedbackComments, algorithmFeedbackVotes,
  algorithmGovernanceApprovals,
  // Algorithm Requirements tables
  algorithmRequirements, algorithmRequirementAssociations, algorithmRequirementValidations,
  type User, type InsertUser, type Role, type Permission, type UserRole, type RolePermission,
  type CompanyOnboarding, type InsertCompanyOnboarding,
  type UserPreferences, type InsertUserPreferences,
  type RecentPage, type InsertRecentPage,
  type PtPlant, type PtResource, type PtJobOperation, type PtManufacturingOrder,
  type SchedulingConversation, type InsertSchedulingConversation,
  type SchedulingMessage, type InsertSchedulingMessage,
  type SavedSchedule, type InsertSavedSchedule,
  type Widget, type InsertWidget,
  type PtProductWheel, type InsertPtProductWheel,
  type PtProductWheelSegment, type InsertPtProductWheelSegment,
  type PtProductWheelSchedule, type InsertPtProductWheelSchedule,
  type PtProductWheelPerformance, type InsertPtProductWheelPerformance,
  type Calendar, type InsertCalendar,
  type MaintenancePeriod, type InsertMaintenancePeriod,
  type PlantKpiTarget, type InsertPlantKpiTarget,
  type PlantKpiPerformance, type InsertPlantKpiPerformance,
  type AutonomousOptimization, type InsertAutonomousOptimization,
  // Optimization Studio types
  type OptimizationAlgorithm, type InsertOptimizationAlgorithm,
  type OptimizationProfile, type InsertOptimizationProfile,
  type AlgorithmTest, type InsertAlgorithmTest,
  type AlgorithmDeployment, type InsertAlgorithmDeployment,
  type AlgorithmFeedback, type InsertAlgorithmFeedback,
  type AlgorithmGovernanceApproval, type InsertAlgorithmGovernanceApproval,
  // Algorithm Requirements types
  type AlgorithmRequirement, type InsertAlgorithmRequirement,
  type AlgorithmRequirementAssociation, type InsertAlgorithmRequirementAssociation,
  type AlgorithmRequirementValidation, type InsertAlgorithmRequirementValidation,
  // Master Data types
  items, capabilities,
  type Item, type InsertItem,
  type Capability, type InsertCapability,
  // Saved Forecasts types
  savedForecasts,
  type SavedForecast, type InsertSavedForecast,
  // Workflow Automation types
  workflows, workflowSteps, workflowExecutions, workflowTemplates, workflowLogs,
  type Workflow, type InsertWorkflow,
  type WorkflowStep, type InsertWorkflowStep,
  type WorkflowExecution, type InsertWorkflowExecution,
  type WorkflowTemplate, type InsertWorkflowTemplate,
  type WorkflowLog, type InsertWorkflowLog,
  // ATP/CTP Reservation types
  atpCtpReservations, atpCtpMaterialReservations, atpCtpResourceReservations,
  atpCtpReservationHistory, atpCtpAvailabilitySnapshots,
  type AtpCtpReservation, type InsertAtpCtpReservation,
  type AtpCtpMaterialReservation, type InsertAtpCtpMaterialReservation,
  type AtpCtpResourceReservation, type InsertAtpCtpResourceReservation,
  type AtpCtpReservationHistory, type InsertAtpCtpReservationHistory,
  type AtpCtpAvailabilitySnapshot, type InsertAtpCtpAvailabilitySnapshot
} from "@shared/schema";
import { eq, and, desc, sql, ilike } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User Management
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsernameOrEmail(identifier: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Role Management
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  createRole(role: any): Promise<Role>;
  updateRole(id: number, role: any): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;

  // Permission Management
  getPermissions(): Promise<Permission[]>;
  getPermission(id: number): Promise<Permission | undefined>;
  createPermission(permission: any): Promise<Permission>;
  updatePermission(id: number, permission: any): Promise<Permission | undefined>;
  deletePermission(id: number): Promise<boolean>;

  // User Role Management
  getUserRoles(userId: number): Promise<any[]>;
  createUserRole(userRole: any): Promise<any>;
  deleteUserRole(userId: number, roleId: number): Promise<boolean>;

  // Role Permission Management
  getRolePermissions(roleId: number): Promise<RolePermission[]>;
  createRolePermission(rolePermission: any): Promise<RolePermission>;
  deleteRolePermission(roleId: number, permissionId: number): Promise<boolean>;

  // Company Onboarding
  getCompanyOnboarding(userId?: number): Promise<CompanyOnboarding | undefined>;
  createCompanyOnboarding(data: InsertCompanyOnboarding): Promise<CompanyOnboarding>;
  updateCompanyOnboarding(id: number, data: Partial<InsertCompanyOnboarding>): Promise<CompanyOnboarding | undefined>;

  // User Preferences
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(data: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, data: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;

  // Recent Pages
  saveRecentPage(data: InsertRecentPage): Promise<void>;
  getRecentPages(userId: number): Promise<RecentPage[]>;

  // Scheduling Conversations
  createSchedulingConversation(data: InsertSchedulingConversation): Promise<SchedulingConversation>;
  getSchedulingConversations(userId: number): Promise<SchedulingConversation[]>;
  addSchedulingMessage(data: InsertSchedulingMessage): Promise<SchedulingMessage>;
  getSchedulingMessages(conversationId: number): Promise<SchedulingMessage[]>;
  deleteSchedulingConversation(id: number): Promise<boolean>;

  // Basic PT Table Access
  getPlants(): Promise<PtPlant[]>;
  getResources(planningArea?: string): Promise<PtResource[]>;
  getJobs(): Promise<any[]>;
  getJobOperations(): Promise<PtJobOperation[]>;
  getManufacturingOrders(): Promise<PtManufacturingOrder[]>;
  
  // Master Data Management
  getItems(): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, item: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
  
  getCapabilities(): Promise<Capability[]>;
  getCapability(id: number): Promise<Capability | undefined>;
  createCapability(capability: InsertCapability): Promise<Capability>;
  updateCapability(id: number, capability: Partial<InsertCapability>): Promise<Capability | undefined>;
  deleteCapability(id: number): Promise<boolean>;
  
  // Advanced PT Data Access  
  getPtResourcesWithDetails(): Promise<any[]>;
  getPtOperationsWithDetails(): Promise<any[]>;
  getPtDependencies(): Promise<any[]>;
  getDiscreteOperations(limit?: number | null): Promise<any[]>;

  // Saved Schedules
  createSavedSchedule(data: InsertSavedSchedule): Promise<SavedSchedule>;
  getSavedSchedules(userId: number): Promise<SavedSchedule[]>;
  getSavedSchedule(id: number, userId: number): Promise<SavedSchedule | undefined>;
  updateSavedSchedule(id: number, userId: number, data: Partial<InsertSavedSchedule>): Promise<SavedSchedule | undefined>;
  deleteSavedSchedule(id: number, userId: number): Promise<boolean>;

  // Canvas Widgets  
  createCanvasWidget(data: Partial<InsertWidget>): Promise<Widget>;
  
  // Error logging
  logError(error: any): Promise<void>;
  
  // Agent Monitoring Methods
  getAgentConnections(filters?: { status?: string; connectionType?: string }): Promise<any[]>;
  getAgentConnectionById(id: number): Promise<any | null>;
  createAgentConnection(data: any): Promise<any>;
  updateAgentConnection(id: number, data: any): Promise<any>;
  deleteAgentConnection(id: number): Promise<void>;
  
  // Agent Actions
  getAgentActions(agentConnectionId?: number, limit?: number, offset?: number): Promise<any[]>;
  createAgentAction(data: any): Promise<any>;
  getAgentActionsBySessionId(sessionId: string): Promise<any[]>;
  
  // Agent Metrics
  getAgentMetrics(agentConnectionId: number, startTime?: Date, endTime?: Date): Promise<any[]>;
  createAgentMetrics(data: any): Promise<any>;
  
  // Agent Policies
  getAgentPolicies(agentConnectionId: number): Promise<any[]>;
  createAgentPolicy(data: any): Promise<any>;
  updateAgentPolicy(id: number, data: any): Promise<any>;
  deleteAgentPolicy(id: number): Promise<void>;
  
  // Agent Alerts
  getAgentAlerts(agentConnectionId?: number, acknowledged?: boolean): Promise<any[]>;
  createAgentAlert(data: any): Promise<any>;
  acknowledgeAgentAlert(id: number, userId: number): Promise<any>;
  
  // Product Wheel Management
  createProductWheel(data: InsertPtProductWheel): Promise<PtProductWheel>;
  getProductWheels(plantId?: number): Promise<PtProductWheel[]>;
  getProductWheel(id: number): Promise<PtProductWheel | undefined>;
  updateProductWheel(id: number, data: Partial<InsertPtProductWheel>): Promise<PtProductWheel | undefined>;
  deleteProductWheel(id: number): Promise<boolean>;
  
  // Product Wheel Segments
  createWheelSegment(data: InsertPtProductWheelSegment): Promise<PtProductWheelSegment>;
  getWheelSegments(wheelId: number): Promise<PtProductWheelSegment[]>;
  updateWheelSegment(id: number, data: Partial<InsertPtProductWheelSegment>): Promise<PtProductWheelSegment | undefined>;
  deleteWheelSegment(id: number): Promise<boolean>;
  reorderWheelSegments(wheelId: number, segments: { id: number; sequenceNumber: number }[]): Promise<boolean>;
  
  // Product Wheel Schedule
  createWheelSchedule(data: InsertPtProductWheelSchedule): Promise<PtProductWheelSchedule>;
  getWheelSchedules(wheelId: number): Promise<PtProductWheelSchedule[]>;
  getCurrentWheelSchedule(wheelId: number): Promise<PtProductWheelSchedule | undefined>;
  updateWheelSchedule(id: number, data: Partial<InsertPtProductWheelSchedule>): Promise<PtProductWheelSchedule | undefined>;
  
  // Product Wheel Performance
  recordWheelPerformance(data: InsertPtProductWheelPerformance): Promise<PtProductWheelPerformance>;
  getWheelPerformance(wheelId: number, startDate?: Date, endDate?: Date): Promise<PtProductWheelPerformance[]>;
  
  // Calendar Management
  createCalendar(data: InsertCalendar): Promise<Calendar>;
  getCalendars(filters?: { resourceId?: number; jobId?: number; plantId?: number }): Promise<Calendar[]>;
  getCalendar(id: number): Promise<Calendar | undefined>;
  getDefaultCalendar(): Promise<Calendar | undefined>;
  updateCalendar(id: number, data: Partial<InsertCalendar>): Promise<Calendar | undefined>;
  deleteCalendar(id: number): Promise<boolean>;
  assignCalendarToResource(resourceId: number, calendarId: number): Promise<boolean>;
  assignCalendarToJob(jobId: number, calendarId: number): Promise<boolean>;
  
  // Maintenance Periods
  createMaintenancePeriod(data: InsertMaintenancePeriod): Promise<MaintenancePeriod>;
  getMaintenancePeriods(filters?: { resourceId?: number; jobId?: number; plantId?: number; calendarId?: number }): Promise<MaintenancePeriod[]>;
  getMaintenancePeriod(id: number): Promise<MaintenancePeriod | undefined>;
  getActiveMaintenancePeriods(date: Date): Promise<MaintenancePeriod[]>;
  updateMaintenancePeriod(id: number, data: Partial<InsertMaintenancePeriod>): Promise<MaintenancePeriod | undefined>;
  deleteMaintenancePeriod(id: number): Promise<boolean>;

  // Plant KPI Targets
  createPlantKpiTarget(data: InsertPlantKpiTarget): Promise<PlantKpiTarget>;
  getPlantKpiTargets(plantId?: number): Promise<PlantKpiTarget[]>;
  getPlantKpiTarget(id: number): Promise<PlantKpiTarget | undefined>;
  updatePlantKpiTarget(id: number, data: Partial<InsertPlantKpiTarget>): Promise<PlantKpiTarget | undefined>;
  deletePlantKpiTarget(id: number): Promise<boolean>;

  // Plant KPI Performance
  createPlantKpiPerformance(data: InsertPlantKpiPerformance): Promise<PlantKpiPerformance>;
  getPlantKpiPerformance(filters?: { plantKpiTargetId?: number; startDate?: Date; endDate?: Date }): Promise<PlantKpiPerformance[]>;
  getLatestKpiPerformance(plantKpiTargetId: number): Promise<PlantKpiPerformance | undefined>;
  updatePlantKpiPerformance(id: number, data: Partial<InsertPlantKpiPerformance>): Promise<PlantKpiPerformance | undefined>;
  deletePlantKpiPerformance(id: number): Promise<boolean>;

  // Autonomous Optimization
  createAutonomousOptimization(data: InsertAutonomousOptimization): Promise<AutonomousOptimization>;
  getAutonomousOptimizations(plantId?: number): Promise<AutonomousOptimization[]>;
  getAutonomousOptimization(id: number): Promise<AutonomousOptimization | undefined>;
  updateAutonomousOptimization(id: number, data: Partial<InsertAutonomousOptimization>): Promise<AutonomousOptimization | undefined>;
  deleteAutonomousOptimization(id: number): Promise<boolean>;

  // Workflow Management
  createWorkflow(data: any): Promise<any>;
  getWorkflows(filters?: { category?: string; status?: string }): Promise<any[]>;
  getWorkflow(id: number): Promise<any | undefined>;
  updateWorkflow(id: number, data: any): Promise<any | undefined>;
  deleteWorkflow(id: number): Promise<boolean>;
  
  // Workflow Executions
  createWorkflowExecution(data: any): Promise<any>;
  getWorkflowExecutions(workflowId?: number): Promise<any[]>;
  getWorkflowExecution(id: number): Promise<any | undefined>;
  updateWorkflowExecution(id: number, data: any): Promise<any | undefined>;
  
  // Workflow Templates
  getWorkflowTemplates(category?: string): Promise<any[]>;
  getWorkflowTemplate(id: number): Promise<any | undefined>;
  createWorkflowTemplate(data: any): Promise<any>;
  
  // Workflow Triggers - Scheduled, Event-based, and Metric-based Execution
  getWorkflowTriggers(workflowId: number): Promise<any[]>;
  getWorkflowTrigger(id: number): Promise<any | undefined>;
  createWorkflowTrigger(data: any): Promise<any>;
  updateWorkflowTrigger(id: number, data: any): Promise<any | undefined>;
  deleteWorkflowTrigger(id: number): Promise<boolean>;
  getWorkflowTriggerExecutions(triggerId: number, limit?: number, offset?: number): Promise<any[]>;
  
  // Saved Forecasts
  getSavedForecasts(userId: number): Promise<SavedForecast[]>;
  getSavedForecast(id: number): Promise<SavedForecast | undefined>;
  createSavedForecast(data: InsertSavedForecast): Promise<SavedForecast>;
  updateSavedForecast(id: number, data: Partial<InsertSavedForecast>): Promise<SavedForecast | undefined>;
  deleteSavedForecast(id: number): Promise<boolean>;

  // Optimization Studio
  getOptimizationAlgorithms(category?: string, status?: string): Promise<OptimizationAlgorithm[]>;
  getStandardAlgorithms(): Promise<OptimizationAlgorithm[]>;
  getAlgorithmTests(): Promise<AlgorithmTest[]>;
  getAlgorithmDeployments(): Promise<AlgorithmDeployment[]>;
  getAlgorithmFeedback(): Promise<AlgorithmFeedback[]>;
  getGovernanceApprovals(): Promise<AlgorithmGovernanceApproval[]>;
  getGovernanceDeployments(): Promise<any[]>;
  createOptimizationAlgorithm(algorithm: InsertOptimizationAlgorithm): Promise<OptimizationAlgorithm>;
  updateOptimizationAlgorithm(id: number, data: Partial<InsertOptimizationAlgorithm>): Promise<OptimizationAlgorithm | undefined>;
  createAlgorithmTest(test: InsertAlgorithmTest): Promise<AlgorithmTest>;
  createAlgorithmFeedback(feedback: InsertAlgorithmFeedback): Promise<AlgorithmFeedback>;
  createGovernanceApproval(approval: InsertAlgorithmGovernanceApproval): Promise<AlgorithmGovernanceApproval>;

  // Algorithm Requirements Management
  getAlgorithmRequirements(filters?: { requirementType?: string; category?: string; priority?: string }): Promise<AlgorithmRequirement[]>;
  getAlgorithmRequirement(id: number): Promise<AlgorithmRequirement | undefined>;
  createAlgorithmRequirement(data: InsertAlgorithmRequirement): Promise<AlgorithmRequirement>;
  updateAlgorithmRequirement(id: number, data: Partial<InsertAlgorithmRequirement>): Promise<AlgorithmRequirement | undefined>;
  deleteAlgorithmRequirement(id: number): Promise<boolean>;

  // Algorithm Requirement Associations
  getAlgorithmRequirementAssociations(algorithmId?: number, requirementId?: number): Promise<AlgorithmRequirementAssociation[]>;
  createAlgorithmRequirementAssociation(data: InsertAlgorithmRequirementAssociation): Promise<AlgorithmRequirementAssociation>;
  updateAlgorithmRequirementAssociation(id: number, data: Partial<InsertAlgorithmRequirementAssociation>): Promise<AlgorithmRequirementAssociation | undefined>;
  deleteAlgorithmRequirementAssociation(id: number): Promise<boolean>;

  // Algorithm Requirement Validations  
  getAlgorithmRequirementValidations(filters?: { algorithmId?: number; requirementId?: number; testRunId?: number; validationStatus?: string }): Promise<AlgorithmRequirementValidation[]>;
  createAlgorithmRequirementValidation(data: InsertAlgorithmRequirementValidation): Promise<AlgorithmRequirementValidation>;
  getLatestValidations(algorithmId: number): Promise<AlgorithmRequirementValidation[]>;

  // ATP/CTP Reservation System
  // Main Reservations
  getAtpCtpReservations(filters?: { status?: string; type?: string; startDate?: Date; endDate?: Date }): Promise<AtpCtpReservation[]>;
  getAtpCtpReservation(id: number): Promise<AtpCtpReservation | undefined>;
  createAtpCtpReservation(data: InsertAtpCtpReservation): Promise<AtpCtpReservation>;
  updateAtpCtpReservation(id: number, data: Partial<InsertAtpCtpReservation>): Promise<AtpCtpReservation | undefined>;
  cancelAtpCtpReservation(id: number, userId: number, reason?: string): Promise<boolean>;
  
  // Material Reservations
  getMaterialReservations(reservationId: number): Promise<AtpCtpMaterialReservation[]>;
  createMaterialReservation(data: InsertAtpCtpMaterialReservation): Promise<AtpCtpMaterialReservation>;
  updateMaterialReservation(id: number, data: Partial<InsertAtpCtpMaterialReservation>): Promise<AtpCtpMaterialReservation | undefined>;
  checkMaterialAvailability(itemId: number, quantity: number, startDate: Date, endDate: Date): Promise<boolean>;
  
  // Resource Reservations
  getResourceReservations(reservationId: number): Promise<AtpCtpResourceReservation[]>;
  createResourceReservation(data: InsertAtpCtpResourceReservation): Promise<AtpCtpResourceReservation>;
  updateResourceReservation(id: number, data: Partial<InsertAtpCtpResourceReservation>): Promise<AtpCtpResourceReservation | undefined>;
  checkResourceAvailability(resourceId: number, startTime: Date, endTime: Date): Promise<boolean>;
  detectResourceConflicts(resourceId: number, startTime: Date, endTime: Date, excludeReservationId?: number): Promise<number[]>;
  
  // Reservation History
  getReservationHistory(reservationId: number): Promise<AtpCtpReservationHistory[]>;
  createReservationHistory(data: InsertAtpCtpReservationHistory): Promise<AtpCtpReservationHistory>;
  
  // Availability Snapshots
  getAvailabilitySnapshots(entityType: string, entityId: number, startDate?: Date, endDate?: Date): Promise<AtpCtpAvailabilitySnapshot[]>;
  createAvailabilitySnapshot(data: InsertAtpCtpAvailabilitySnapshot): Promise<AtpCtpAvailabilitySnapshot>;
  updateAvailabilitySnapshots(entityType: string, entityId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User Management
  async getUsers(): Promise<User[]> {
    try {
      return await db.select().from(users).orderBy(users.username);
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  async getUserByUsernameOrEmail(identifier: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users)
        .where(sql`LOWER(${users.username}) = LOWER(${identifier}) or LOWER(${users.email}) = LOWER(${identifier})`);
      return user || undefined;
    } catch (error) {
      console.error('Error fetching user by identifier:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const [updated] = await db.update(users)
        .set({ ...user, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Role Management
  async getRoles(): Promise<Role[]> {
    try {
      return await db.select().from(roles).orderBy(roles.name);
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  }

  async getRole(id: number): Promise<Role | undefined> {
    try {
      const [role] = await db.select().from(roles).where(eq(roles.id, id));
      return role || undefined;
    } catch (error) {
      console.error('Error fetching role:', error);
      return undefined;
    }
  }

  async createRole(role: any): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async updateRole(id: number, role: any): Promise<Role | undefined> {
    try {
      const [updated] = await db.update(roles)
        .set(role)
        .where(eq(roles.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating role:', error);
      return undefined;
    }
  }

  async deleteRole(id: number): Promise<boolean> {
    try {
      const result = await db.delete(roles).where(eq(roles.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting role:', error);
      return false;
    }
  }

  // Permission Management
  async getPermissions(): Promise<Permission[]> {
    try {
      return await db.select().from(permissions).orderBy(permissions.name);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }
  }

  async getPermission(id: number): Promise<Permission | undefined> {
    try {
      const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
      return permission || undefined;
    } catch (error) {
      console.error('Error fetching permission:', error);
      return undefined;
    }
  }

  async createPermission(permission: any): Promise<Permission> {
    const [newPermission] = await db.insert(permissions).values(permission).returning();
    return newPermission;
  }

  async updatePermission(id: number, permission: any): Promise<Permission | undefined> {
    try {
      const { id: _, ...updateData } = permission;
      const [updatedPermission] = await db
        .update(permissions)
        .set(updateData)
        .where(eq(permissions.id, id))
        .returning();
      return updatedPermission || undefined;
    } catch (error) {
      console.error('Error updating permission:', error);
      return undefined;
    }
  }

  async deletePermission(id: number): Promise<boolean> {
    try {
      const result = await db.delete(permissions).where(eq(permissions.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting permission:', error);
      return false;
    }
  }

  // User Role Management
  async getUserRoles(userId: number): Promise<any[]> {
    try {
      const roles = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
      return roles;
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
  }

  async createUserRole(userRole: any): Promise<any> {
    const [newUserRole] = await db.insert(userRoles).values(userRole).returning();
    return newUserRole;
  }

  async deleteUserRole(userId: number, roleId: number): Promise<boolean> {
    try {
      const result = await db.delete(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting user role:', error);
      return false;
    }
  }

  // Role Permission Management
  async getRolePermissions(roleId: number): Promise<RolePermission[]> {
    try {
      return await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      return [];
    }
  }

  async createRolePermission(rolePermission: any): Promise<RolePermission> {
    const [newRolePermission] = await db.insert(rolePermissions).values(rolePermission).returning();
    return newRolePermission;
  }

  async deleteRolePermission(roleId: number, permissionId: number): Promise<boolean> {
    try {
      const result = await db.delete(rolePermissions)
        .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting role permission:', error);
      return false;
    }
  }

  // Company Onboarding
  async getCompanyOnboarding(userId?: number): Promise<CompanyOnboarding | undefined> {
    try {
      const query = db.select().from(companyOnboarding);
      if (userId) {
        const [onboarding] = await query.where(eq(companyOnboarding.userId, userId));
        return onboarding || undefined;
      } else {
        const [onboarding] = await query.limit(1);
        return onboarding || undefined;
      }
    } catch (error) {
      console.error('Error fetching company onboarding:', error);
      return undefined;
    }
  }

  async createCompanyOnboarding(data: InsertCompanyOnboarding): Promise<CompanyOnboarding> {
    const [newOnboarding] = await db.insert(companyOnboarding).values(data).returning();
    return newOnboarding;
  }

  async updateCompanyOnboarding(id: number, data: Partial<InsertCompanyOnboarding>): Promise<CompanyOnboarding | undefined> {
    try {
      const [updated] = await db.update(companyOnboarding)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(companyOnboarding.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating company onboarding:', error);
      return undefined;
    }
  }

  // User Preferences
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    try {
      const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
      return prefs || undefined;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return undefined;
    }
  }

  async createUserPreferences(data: InsertUserPreferences): Promise<UserPreferences> {
    const [newPrefs] = await db.insert(userPreferences).values(data).returning();
    return newPrefs;
  }

  async updateUserPreferences(userId: number, data: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    try {
      const [updated] = await db.update(userPreferences)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return undefined;
    }
  }

  // Recent Pages
  async saveRecentPage(data: InsertRecentPage): Promise<void> {
    try {
      // Convert visitedAt to Date if it's a string
      const pageData = {
        ...data,
        visitedAt: data.visitedAt ? new Date(data.visitedAt) : new Date()
      };
      await db.insert(recentPages).values(pageData);
    } catch (error) {
      console.error('Error saving recent page:', error);
    }
  }

  async getRecentPages(userId: number): Promise<RecentPage[]> {
    try {
      return await db.select().from(recentPages)
        .where(eq(recentPages.userId, userId))
        .orderBy(desc(recentPages.visitedAt))
        .limit(20);
    } catch (error) {
      console.error('Error fetching recent pages:', error);
      return [];
    }
  }

  // Scheduling Conversations
  async createSchedulingConversation(data: InsertSchedulingConversation): Promise<SchedulingConversation> {
    const [conversation] = await db.insert(schedulingConversations).values(data).returning();
    return conversation;
  }

  async getSchedulingConversations(userId: number): Promise<SchedulingConversation[]> {
    try {
      return await db.select().from(schedulingConversations)
        .where(eq(schedulingConversations.userId, userId))
        .orderBy(desc(schedulingConversations.createdAt));
    } catch (error) {
      console.error('Error fetching scheduling conversations:', error);
      return [];
    }
  }

  async addSchedulingMessage(data: InsertSchedulingMessage): Promise<SchedulingMessage> {
    const [message] = await db.insert(schedulingMessages).values(data).returning();
    return message;
  }

  async getSchedulingMessages(conversationId: number): Promise<SchedulingMessage[]> {
    try {
      return await db.select().from(schedulingMessages)
        .where(eq(schedulingMessages.conversationId, conversationId))
        .orderBy(schedulingMessages.createdAt);
    } catch (error) {
      console.error('Error fetching scheduling messages:', error);
      return [];
    }
  }

  async deleteSchedulingConversation(id: number): Promise<boolean> {
    try {
      // First delete all messages
      await db.delete(schedulingMessages)
        .where(eq(schedulingMessages.conversationId, id));
      
      // Then delete the conversation
      const result = await db.delete(schedulingConversations)
        .where(eq(schedulingConversations.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting scheduling conversation:', error);
      return false;
    }
  }

  // Basic PT Table Access
  async getPlants(): Promise<PtPlant[]> {
    try {
      return await db.select().from(ptPlants).orderBy(ptPlants.name);
    } catch (error) {
      console.error('Error fetching plants:', error);
      return [];
    }
  }

  async getResources(planningArea?: string): Promise<PtResource[]> {
    try {
      // Use parameterized query to prevent SQL injection
      let query;
      if (planningArea && planningArea !== 'all') {
        // Use sql template literal with proper parameter binding
        query = sql`
          SELECT 
            id,
            publish_date,
            instance_id,
            plant_id,
            department_id,
            resource_id,
            name,
            description,
            notes,
            external_id,
            plant_name,
            department_name,
            planning_area,
            active as is_active,
            bottleneck,
            buffer_hours,
            capacity_type,
            hourly_cost as standard_hourly_cost,
            setup_cost as overtime_hourly_cost,
            tank as drum,
            -- Set defaults for missing schema fields
            'equipment' as resource_type,
            100.0 as capacity,
            24.0 as available_hours,
            '1.0' as efficiency,
            now() as created_at,
            now() as updated_at
          FROM ptresources 
          WHERE active = true AND planning_area = ${planningArea}
          ORDER BY CASE 
            -- Order resources by brewery operational sequence with grouping
            -- 1. MILLING (top)
            WHEN LOWER(name) LIKE '%mill%' THEN 1
            -- 2. MASHING
            WHEN LOWER(name) LIKE '%mash%' THEN 2  
            -- 3. LAUTERING
            WHEN LOWER(name) LIKE '%lauter%' THEN 3
            -- 4. BOILING/KETTLE
            WHEN LOWER(name) LIKE '%boil%' OR LOWER(name) LIKE '%kettle%' THEN 4
            -- 5. WHIRLPOOL
            WHEN LOWER(name) LIKE '%whirlpool%' THEN 5
            -- 6. COOLING
            WHEN LOWER(name) LIKE '%cool%' THEN 6
            -- 7. ALL FERMENTATION TANKS (grouped together)
            WHEN LOWER(name) LIKE '%ferment%' THEN 7
            -- 8. ALL BRIGHT/CONDITIONING TANKS (grouped together)
            WHEN LOWER(name) LIKE '%bright%' OR LOWER(name) LIKE '%condition%' THEN 8
            -- 9. PASTEURIZATION
            WHEN LOWER(name) LIKE '%pasteur%' THEN 9
            -- 10. ALL PACKAGING/FILLING (bottling and canning grouped together)
            WHEN LOWER(name) LIKE '%bottle%' OR LOWER(name) LIKE '%can%' OR LOWER(name) LIKE '%filler%' OR LOWER(name) LIKE '%packag%' THEN 10
            -- 11. Any other resources
            ELSE 11
          END, 
          -- Secondary sort by name to ensure consistent ordering within each group
          name
          LIMIT 12
        `;
      } else {
        // No planning area filter - show all active resources
        query = sql`
          SELECT 
            id,
            publish_date,
            instance_id,
            plant_id,
            department_id,
            resource_id,
            name,
            description,
            notes,
            external_id,
            plant_name,
            department_name,
            planning_area,
            active as is_active,
            bottleneck,
            buffer_hours,
            capacity_type,
            hourly_cost as standard_hourly_cost,
            setup_cost as overtime_hourly_cost,
            tank as drum,
            -- Set defaults for missing schema fields
            'equipment' as resource_type,
            100.0 as capacity,
            24.0 as available_hours,
            '1.0' as efficiency,
            now() as created_at,
            now() as updated_at
          FROM ptresources 
          WHERE active = true
          ORDER BY CASE 
            -- Order resources by brewery operational sequence with grouping
            -- 1. MILLING (top)
            WHEN LOWER(name) LIKE '%mill%' THEN 1
            -- 2. MASHING
            WHEN LOWER(name) LIKE '%mash%' THEN 2  
            -- 3. LAUTERING
            WHEN LOWER(name) LIKE '%lauter%' THEN 3
            -- 4. BOILING/KETTLE
            WHEN LOWER(name) LIKE '%boil%' OR LOWER(name) LIKE '%kettle%' THEN 4
            -- 5. WHIRLPOOL
            WHEN LOWER(name) LIKE '%whirlpool%' THEN 5
            -- 6. COOLING
            WHEN LOWER(name) LIKE '%cool%' THEN 6
            -- 7. ALL FERMENTATION TANKS (grouped together)
            WHEN LOWER(name) LIKE '%ferment%' THEN 7
            -- 8. ALL BRIGHT/CONDITIONING TANKS (grouped together)
            WHEN LOWER(name) LIKE '%bright%' OR LOWER(name) LIKE '%condition%' THEN 8
            -- 9. PASTEURIZATION
            WHEN LOWER(name) LIKE '%pasteur%' THEN 9
            -- 10. ALL PACKAGING/FILLING (bottling and canning grouped together)
            WHEN LOWER(name) LIKE '%bottle%' OR LOWER(name) LIKE '%can%' OR LOWER(name) LIKE '%filler%' OR LOWER(name) LIKE '%packag%' THEN 10
            -- 11. Any other resources
            ELSE 11
          END, 
          -- Secondary sort by name to ensure consistent ordering within each group
          name
          LIMIT 12
        `;
      }
      
      const result = await db.execute(query);
      return result.rows as any[];
    } catch (error) {
      console.error('Error fetching resources:', error);
      return [];
    }
  }

  // Legacy method without planning area filter (for backwards compatibility)
  async _getResourcesLegacy(): Promise<PtResource[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          id,
          publish_date,
          instance_id,
          plant_id,
          department_id,
          resource_id,
          name,
          description,
          notes,
          external_id,
          plant_name,
          department_name,
          planning_area,
          active as is_active,
          bottleneck,
          buffer_hours,
          capacity_type,
          hourly_cost as standard_hourly_cost,
          setup_cost as overtime_hourly_cost,
          tank as drum,
          -- Set defaults for missing schema fields
          'equipment' as resource_type,
          100.0 as capacity,
          24.0 as available_hours,
          '1.0' as efficiency,
          now() as created_at,
          now() as updated_at
        FROM ptresources 
        WHERE active = true
        ORDER BY CASE 
          -- Order resources by brewery operational sequence with grouping
          -- 1. MILLING (top)
          WHEN LOWER(name) LIKE '%mill%' THEN 1
          -- 2. MASHING
          WHEN LOWER(name) LIKE '%mash%' THEN 2  
          -- 3. LAUTERING
          WHEN LOWER(name) LIKE '%lauter%' THEN 3
          -- 4. BOILING/KETTLE
          WHEN LOWER(name) LIKE '%boil%' OR LOWER(name) LIKE '%kettle%' THEN 4
          -- 5. WHIRLPOOL
          WHEN LOWER(name) LIKE '%whirlpool%' THEN 5
          -- 6. COOLING
          WHEN LOWER(name) LIKE '%cool%' THEN 6
          -- 7. ALL FERMENTATION TANKS (grouped together)
          WHEN LOWER(name) LIKE '%ferment%' THEN 7
          -- 8. ALL BRIGHT/CONDITIONING TANKS (grouped together)
          WHEN LOWER(name) LIKE '%bright%' OR LOWER(name) LIKE '%condition%' THEN 8
          -- 9. PASTEURIZATION
          WHEN LOWER(name) LIKE '%pasteur%' THEN 9
          -- 10. ALL PACKAGING/FILLING (bottling and canning grouped together)
          WHEN LOWER(name) LIKE '%bottle%' OR LOWER(name) LIKE '%can%' OR LOWER(name) LIKE '%filler%' OR LOWER(name) LIKE '%packag%' THEN 10
          -- 11. Any other resources
          ELSE 11
        END, 
        -- Secondary sort by name to ensure consistent ordering within each group
        name
        LIMIT 12
      `);
      return result.rows as any[];
    } catch (error) {
      console.error('Error fetching resources:', error);
      return [];
    }
  }

  async getJobs(): Promise<any[]> {
    try {
      return await db.select().from(ptJobs).orderBy(ptJobs.name);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }
  }

  async getJobOperations(): Promise<PtJobOperation[]> {
    try {
      return await db.select().from(ptJobOperations).orderBy(ptJobOperations.name);
    } catch (error) {
      console.error('Error fetching job operations:', error);
      return [];
    }
  }

  async getManufacturingOrders(): Promise<PtManufacturingOrder[]> {
    try {
      // Use raw SQL since schema doesn't match actual database structure
      const result = await db.execute(sql`
        SELECT * FROM ptmanufacturingorders 
        ORDER BY name
      `);
      return result.rows as any[];
    } catch (error) {
      console.error('Error fetching manufacturing orders:', error);
      return [];
    }
  }

  // Advanced PT Data Access
  async getPtResourcesWithDetails(): Promise<any[]> {
    try {
      const resources = await db.select({
        id: ptResources.id,
        resourceId: ptResources.resourceId, 
        name: ptResources.name,
        description: ptResources.description,
        category: ptResources.resourceType,
        capacity: sql`COALESCE(${ptResources.capacity}, 100)`,
        efficiency: sql`COALESCE(${ptResources.efficiency}, 1) * 100`,
        isBottleneck: ptResources.bottleneck,
        plantId: ptResources.plantId,
        departmentId: ptResources.departmentId,
        active: ptResources.isActive,
        bufferHours: ptResources.bufferHours,
        availableHours: ptResources.availableHours,
        capacityType: ptResources.capacityType,
        overtimeHourlyCost: ptResources.overtimeHourlyCost,
        standardHourlyCost: ptResources.standardHourlyCost
      }).from(ptResources)
        .where(sql`${ptResources.isActive} = true OR ${ptResources.isActive} IS NULL`)
        .orderBy(ptResources.name);
      return resources;
    } catch (error) {
      console.error('Error fetching PT resources with details:', error);
      return [];
    }
  }

  async getPtOperationsWithDetails(): Promise<any[]> {
    try {
      // Use raw SQL since the minimal schema doesn't have all the columns
      const result = await db.execute(sql`
        SELECT 
          jo.id,
          jo.operation_id as "operationId",
          jo.job_id as "jobId",
          jo.name,
          jo.description,
          jo.scheduled_start as "startDate",
          jo.scheduled_end as "endDate",
          COALESCE(EXTRACT(EPOCH FROM (jo.scheduled_end - jo.scheduled_start)) / 60, 60) as duration,
          jo.setup_hours as "setupTime",
          jo.cycle_hrs as "processTime",
          jo.post_processing_hours as "teardownTime",
          0 as "queueTime",
          0 as "moveTime",
          0 as "waitTime",
          ROW_NUMBER() OVER (PARTITION BY jo.job_id ORDER BY jo.scheduled_start, jo.id) as "sequenceNumber",
          'Work Center' as "workCenterName",
          CASE
            WHEN jo.percent_finished >= 100 THEN 'completed'
            WHEN jo.percent_finished > 0 THEN 'in_progress'
            ELSE 'pending'
          END as status,
          jo.scheduled_start as "actualStartDate",
          jo.scheduled_end as "actualEndDate",
          COALESCE(jo.percent_finished, 0) as "percentDone",
          CASE
            WHEN ROW_NUMBER() OVER (PARTITION BY jo.job_id ORDER BY jo.scheduled_start) = 1 THEN 'Critical'
            WHEN ROW_NUMBER() OVER (PARTITION BY jo.job_id ORDER BY jo.scheduled_start) <= 3 THEN 'High'
            WHEN ROW_NUMBER() OVER (PARTITION BY jo.job_id ORDER BY jo.scheduled_start) <= 6 THEN 'Medium'
            ELSE 'Low'
          END as priority,
          true as "isActive",
          -- PERT fields
          jo.time_optimistic as "timeOptimistic",
          jo.time_most_likely as "timeMostLikely",
          jo.time_pessimistic as "timePessimistic",
          jo.time_expected as "timeExpected",
          jo.time_variance as "timeVariance",
          jo.time_std_dev as "timeStdDev"
        FROM ptjoboperations jo
        ORDER BY jo.scheduled_start, jo.name
      `);
      return result.rows as any[];
    } catch (error) {
      console.error('Error fetching PT operations with details:', error);
      return [];
    }
  }

  async getPtDependencies(): Promise<any[]> {
    try {
      // Generate dependencies based on operation scheduling within jobs
      // Use raw SQL since schema doesn't match actual database structure
      const result = await db.execute(sql`
        SELECT jo.id as operation_id, jo.job_id, jo.name as operation_name, 
               jo.scheduled_start, jo.scheduled_end
        FROM ptjoboperations jo
        WHERE jo.job_id IS NOT NULL 
          AND jo.scheduled_start IS NOT NULL
        ORDER BY jo.job_id, jo.scheduled_start, jo.id
      `);
      const operations = result.rows;
      
      const dependencies = [];
      const orderGroups = new Map();
      
      // Group operations by job (manufacturing order)
      for (const op of operations) {
        if (!orderGroups.has(op.job_id)) {
          orderGroups.set(op.job_id, []);
        }
        orderGroups.get(op.job_id).push(op);
      }
      
      // Create dependencies between sequential operations
      for (const [orderId, ops] of orderGroups) {
        const sortedOps = ops.sort((a: any, b: any) => {
          // Sort by scheduled_start first, then by operation_id
          const aStart = new Date(a.scheduled_start || 0).getTime();
          const bStart = new Date(b.scheduled_start || 0).getTime();
          return aStart - bStart || a.operation_id - b.operation_id;
        });
        for (let i = 0; i < sortedOps.length - 1; i++) {
          dependencies.push({
            id: `dep-${sortedOps[i].operation_id}-${sortedOps[i + 1].operation_id}`,
            fromEvent: `event-${sortedOps[i].operation_id}`,
            toEvent: `event-${sortedOps[i + 1].operation_id}`,
            type: 2, // Finish-to-Start dependency
            lag: 0,
            lagUnit: 'minute'
          });
        }
      }
      
      return dependencies;
    } catch (error) {
      console.error('Error fetching PT dependencies:', error);
      return [];
    }
  }

  // Get discrete operations (from PT job operations) using actual resource assignments from ptjobresources
  async getDiscreteOperations(limit?: number | null): Promise<any[]> {
    try {
      // Fetch operations with their actual resource assignments from ptjobresources table
      const query = sql`
        SELECT 
          jo.id,
          jo.operation_id,
          jo.job_id,
          jo.name as operation_name,
          jo.description,
          jo.scheduled_start,
          jo.scheduled_end,
          jo.percent_finished,
          jo.setup_hours,
          jo.cycle_hrs,
          jo.post_processing_hours,
          jo.constraint_type,
          jo.constraint_date,
          jo.sequence_number, -- CRITICAL: Add sequence_number for ALAP scheduling
          j.name as job_name,
          j.priority,
          j.need_date_time as due_date,
          jr.default_resource_id as resource_external_id,
          r.id as resource_id,
          r.name as resource_name
        FROM ptjoboperations jo
        LEFT JOIN ptjobs j ON jo.job_id = j.id
        LEFT JOIN ptjobresources jr ON jo.id = jr.operation_id
        LEFT JOIN ptresources r ON jr.default_resource_id = r.external_id
        WHERE jo.scheduled_start IS NOT NULL
        ORDER BY jo.scheduled_start, jo.id
        ${limit ? sql`LIMIT ${limit}` : sql``}
      `;
      
      const result = await db.execute(query);
      
      // Transform the operations for the scheduler using actual resource assignments
      return result.rows.map((op: any) => ({
        id: op.id,
        operationId: op.operation_id,
        jobId: op.job_id,
        name: op.operation_name || 'Operation',
        jobName: op.job_name,
        sequenceNumber: op.sequence_number || 0, // CRITICAL: Include sequence_number for ALAP scheduling
        resourceId: op.resource_id || null, // Use the actual assigned resource from ptjobresources
        resourceName: op.resource_name || 'Unassigned', // Include resource name for display
        resourceExternalId: op.resource_external_id, // Keep external ID for reference
        scheduledStart: op.scheduled_start,
        scheduledEnd: op.scheduled_end,
        priority: op.priority || 5,
        jobPriority: op.priority || 5, // CRITICAL FIX: Add jobPriority field for frontend scheduler
        setupTime: op.setup_hours || 0,
        runTime: op.cycle_hrs || 0,
        teardownTime: op.post_processing_hours || 0,
        dueDate: op.due_date,
        percentFinished: op.percent_finished || 0,
        constraintType: op.constraint_type,
        constraintDate: op.constraint_date
      }));
    } catch (error) {
      console.error('Error fetching discrete operations:', error);
      return [];
    }
  }

  // Saved Schedules
  async createSavedSchedule(data: InsertSavedSchedule): Promise<SavedSchedule> {
    try {
      const [schedule] = await db.insert(savedSchedules).values(data).returning();
      return schedule;
    } catch (error) {
      console.error('Error creating saved schedule:', error);
      throw error;
    }
  }

  async getSavedSchedules(userId: number): Promise<SavedSchedule[]> {
    try {
      return await db.select()
        .from(savedSchedules)
        .where(and(eq(savedSchedules.userId, userId), eq(savedSchedules.isActive, true)))
        .orderBy(desc(savedSchedules.updatedAt));
    } catch (error) {
      console.error('Error fetching saved schedules:', error);
      return [];
    }
  }

  async getSavedSchedule(id: number, userId: number): Promise<SavedSchedule | undefined> {
    try {
      const [schedule] = await db.select()
        .from(savedSchedules)
        .where(and(
          eq(savedSchedules.id, id), 
          eq(savedSchedules.userId, userId),
          eq(savedSchedules.isActive, true)
        ));
      return schedule || undefined;
    } catch (error) {
      console.error('Error fetching saved schedule:', error);
      return undefined;
    }
  }

  async updateSavedSchedule(id: number, userId: number, data: Partial<InsertSavedSchedule>): Promise<SavedSchedule | undefined> {
    try {
      const [updated] = await db.update(savedSchedules)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(savedSchedules.id, id),
          eq(savedSchedules.userId, userId)
        ))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating saved schedule:', error);
      return undefined;
    }
  }

  async deleteSavedSchedule(id: number, userId: number): Promise<boolean> {
    try {
      const result = await db.update(savedSchedules)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(
          eq(savedSchedules.id, id),
          eq(savedSchedules.userId, userId)
        ));
      return true;
    } catch (error) {
      console.error('Error deleting saved schedule:', error);
      return false;
    }
  }

  // Canvas Widgets
  async createCanvasWidget(data: Partial<InsertWidget>): Promise<Widget> {
    try {
      // Set default values for required fields
      const widgetData = {
        dashboardId: data.dashboardId || 1, // Default dashboard
        type: data.type || 'chart',
        title: data.title || 'Untitled Widget',
        position: data.position || { x: 0, y: 0, w: 6, h: 4 },
        config: data.config || {},
        isActive: data.isActive !== undefined ? data.isActive : true
      };
      
      const [widget] = await db.insert(widgets).values(widgetData).returning();
      console.log(`[Storage] Canvas widget created with ID: ${widget.id}`);
      return widget;
    } catch (error) {
      console.error('Error creating canvas widget:', error);
      throw error;
    }
  }

  // Error logging
  async logError(error: any): Promise<void> {
    console.error('System error:', error);
  }

  // Agent Monitoring Methods Implementation
  async getAgentConnections(filters?: { status?: string; connectionType?: string }): Promise<any[]> {
    try {
      let query = db.select().from(agentConnections);
      
      if (filters) {
        const conditions = [];
        if (filters.status) {
          conditions.push(eq(agentConnections.status, filters.status as any));
        }
        if (filters.connectionType) {
          conditions.push(eq(agentConnections.connectionType, filters.connectionType as any));
        }
        if (conditions.length > 0) {
          query = query.where(and(...conditions)) as any;
        }
      }
      
      return await query;
    } catch (error) {
      console.error('Error fetching agent connections:', error);
      return [];
    }
  }

  async getAgentConnectionById(id: number): Promise<any | null> {
    try {
      const [connection] = await db.select().from(agentConnections).where(eq(agentConnections.id, id));
      return connection || null;
    } catch (error) {
      console.error('Error fetching agent connection by id:', error);
      return null;
    }
  }

  async createAgentConnection(data: any): Promise<any> {
    try {
      const [connection] = await db.insert(agentConnections).values(data).returning();
      return connection;
    } catch (error) {
      console.error('Error creating agent connection:', error);
      throw error;
    }
  }

  async updateAgentConnection(id: number, data: any): Promise<any> {
    try {
      const [updated] = await db.update(agentConnections)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(agentConnections.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating agent connection:', error);
      throw error;
    }
  }

  async deleteAgentConnection(id: number): Promise<void> {
    try {
      await db.delete(agentConnections).where(eq(agentConnections.id, id));
    } catch (error) {
      console.error('Error deleting agent connection:', error);
      throw error;
    }
  }

  // Agent Actions
  async getAgentActions(agentConnectionId?: number, limit = 100, offset = 0): Promise<any[]> {
    try {
      let query = db.select().from(agentActions);
      
      if (agentConnectionId) {
        query = query.where(eq(agentActions.agentConnectionId, agentConnectionId)) as any;
      }
      
      query = query.orderBy(desc(agentActions.timestamp)).limit(limit).offset(offset) as any;
      return await query;
    } catch (error) {
      console.error('Error fetching agent actions:', error);
      return [];
    }
  }

  async createAgentAction(data: any): Promise<any> {
    try {
      const [action] = await db.insert(agentActions).values(data).returning();
      return action;
    } catch (error) {
      console.error('Error creating agent action:', error);
      throw error;
    }
  }

  async getAgentActionsBySessionId(sessionId: string): Promise<any[]> {
    try {
      return await db.select().from(agentActions)
        .where(eq(agentActions.sessionId, sessionId))
        .orderBy(agentActions.timestamp);
    } catch (error) {
      console.error('Error fetching agent actions by session:', error);
      return [];
    }
  }

  // Agent Metrics
  async getAgentMetrics(agentConnectionId: number, startTime?: Date, endTime?: Date): Promise<any[]> {
    try {
      const conditions = [eq(agentMetricsHourly.agentConnectionId, agentConnectionId)];
      
      if (startTime && endTime) {
        conditions.push(sql`${agentMetricsHourly.hourTimestamp} >= ${startTime}`);
        conditions.push(sql`${agentMetricsHourly.hourTimestamp} <= ${endTime}`);
      }
      
      return await db.select().from(agentMetricsHourly)
        .where(and(...conditions))
        .orderBy(desc(agentMetricsHourly.hourTimestamp));
    } catch (error) {
      console.error('Error fetching agent metrics:', error);
      return [];
    }
  }

  async createAgentMetrics(data: any): Promise<any> {
    try {
      const [metrics] = await db.insert(agentMetricsHourly).values(data).returning();
      return metrics;
    } catch (error) {
      console.error('Error creating agent metrics:', error);
      throw error;
    }
  }

  // Agent Policies
  async getAgentPolicies(agentConnectionId: number): Promise<any[]> {
    try {
      return await db.select().from(agentPolicies)
        .where(eq(agentPolicies.agentConnectionId, agentConnectionId))
        .orderBy(desc(agentPolicies.createdAt));
    } catch (error) {
      console.error('Error fetching agent policies:', error);
      return [];
    }
  }

  async createAgentPolicy(data: any): Promise<any> {
    try {
      const [policy] = await db.insert(agentPolicies).values(data).returning();
      return policy;
    } catch (error) {
      console.error('Error creating agent policy:', error);
      throw error;
    }
  }

  async updateAgentPolicy(id: number, data: any): Promise<any> {
    try {
      const [updated] = await db.update(agentPolicies)
        .set(data)
        .where(eq(agentPolicies.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating agent policy:', error);
      throw error;
    }
  }

  async deleteAgentPolicy(id: number): Promise<void> {
    try {
      await db.delete(agentPolicies).where(eq(agentPolicies.id, id));
    } catch (error) {
      console.error('Error deleting agent policy:', error);
      throw error;
    }
  }

  // Agent Alerts
  async getAgentAlerts(agentConnectionId?: number, acknowledged?: boolean): Promise<any[]> {
    try {
      let query = db.select().from(agentAlerts);
      const conditions = [];
      
      if (agentConnectionId) {
        conditions.push(eq(agentAlerts.agentConnectionId, agentConnectionId));
      }
      if (acknowledged !== undefined) {
        conditions.push(eq(agentAlerts.isAcknowledged, acknowledged));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      return await query.orderBy(desc(agentAlerts.createdAt));
    } catch (error) {
      console.error('Error fetching agent alerts:', error);
      return [];
    }
  }

  async createAgentAlert(data: any): Promise<any> {
    try {
      const [alert] = await db.insert(agentAlerts).values(data).returning();
      return alert;
    } catch (error) {
      console.error('Error creating agent alert:', error);
      throw error;
    }
  }

  async acknowledgeAgentAlert(id: number, userId: number): Promise<any> {
    try {
      const [updated] = await db.update(agentAlerts)
        .set({
          isAcknowledged: true,
          acknowledgedBy: userId,
          acknowledgedAt: new Date()
        })
        .where(eq(agentAlerts.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error acknowledging agent alert:', error);
      throw error;
    }
  }
  
  // Product Wheel Management
  async createProductWheel(data: InsertPtProductWheel): Promise<PtProductWheel> {
    try {
      const [wheel] = await db.insert(ptProductWheels).values(data).returning();
      return wheel;
    } catch (error) {
      console.error('Error creating product wheel:', error);
      throw error;
    }
  }

  async getProductWheels(plantId?: number): Promise<PtProductWheel[]> {
    try {
      let query = db.select().from(ptProductWheels);
      
      if (plantId) {
        query = query.where(eq(ptProductWheels.plantId, plantId)) as any;
      }
      
      return await query.orderBy(desc(ptProductWheels.createdAt));
    } catch (error) {
      console.error('Error fetching product wheels:', error);
      return [];
    }
  }

  async getProductWheel(id: number): Promise<PtProductWheel | undefined> {
    try {
      const [wheel] = await db.select()
        .from(ptProductWheels)
        .where(eq(ptProductWheels.id, id));
      return wheel;
    } catch (error) {
      console.error('Error fetching product wheel:', error);
      return undefined;
    }
  }

  async updateProductWheel(id: number, data: Partial<InsertPtProductWheel>): Promise<PtProductWheel | undefined> {
    try {
      const [updated] = await db.update(ptProductWheels)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(ptProductWheels.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating product wheel:', error);
      return undefined;
    }
  }

  async deleteProductWheel(id: number): Promise<boolean> {
    try {
      await db.delete(ptProductWheels).where(eq(ptProductWheels.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting product wheel:', error);
      return false;
    }
  }

  // Product Wheel Segments
  async createWheelSegment(data: InsertPtProductWheelSegment): Promise<PtProductWheelSegment> {
    try {
      const [segment] = await db.insert(ptProductWheelSegments).values(data).returning();
      return segment;
    } catch (error) {
      console.error('Error creating wheel segment:', error);
      throw error;
    }
  }

  async getWheelSegments(wheelId: number): Promise<PtProductWheelSegment[]> {
    try {
      return await db.select()
        .from(ptProductWheelSegments)
        .where(eq(ptProductWheelSegments.wheelId, wheelId))
        .orderBy(ptProductWheelSegments.sequenceNumber);
    } catch (error) {
      console.error('Error fetching wheel segments:', error);
      return [];
    }
  }

  async updateWheelSegment(id: number, data: Partial<InsertPtProductWheelSegment>): Promise<PtProductWheelSegment | undefined> {
    try {
      const [updated] = await db.update(ptProductWheelSegments)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(ptProductWheelSegments.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating wheel segment:', error);
      return undefined;
    }
  }

  async deleteWheelSegment(id: number): Promise<boolean> {
    try {
      await db.delete(ptProductWheelSegments).where(eq(ptProductWheelSegments.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting wheel segment:', error);
      return false;
    }
  }

  async reorderWheelSegments(wheelId: number, segments: { id: number; sequenceNumber: number }[]): Promise<boolean> {
    try {
      // Update all segments in a transaction
      await db.transaction(async (tx) => {
        for (const segment of segments) {
          await tx.update(ptProductWheelSegments)
            .set({ sequenceNumber: segment.sequenceNumber, updatedAt: new Date() })
            .where(and(
              eq(ptProductWheelSegments.id, segment.id),
              eq(ptProductWheelSegments.wheelId, wheelId)
            ));
        }
      });
      return true;
    } catch (error) {
      console.error('Error reordering wheel segments:', error);
      return false;
    }
  }

  // Product Wheel Schedule
  async createWheelSchedule(data: InsertPtProductWheelSchedule): Promise<PtProductWheelSchedule> {
    try {
      const [schedule] = await db.insert(ptProductWheelSchedule).values(data).returning();
      return schedule;
    } catch (error) {
      console.error('Error creating wheel schedule:', error);
      throw error;
    }
  }

  async getWheelSchedules(wheelId: number): Promise<PtProductWheelSchedule[]> {
    try {
      return await db.select()
        .from(ptProductWheelSchedule)
        .where(eq(ptProductWheelSchedule.wheelId, wheelId))
        .orderBy(desc(ptProductWheelSchedule.plannedStartDate));
    } catch (error) {
      console.error('Error fetching wheel schedules:', error);
      return [];
    }
  }

  async getCurrentWheelSchedule(wheelId: number): Promise<PtProductWheelSchedule | undefined> {
    try {
      const [schedule] = await db.select()
        .from(ptProductWheelSchedule)
        .where(and(
          eq(ptProductWheelSchedule.wheelId, wheelId),
          eq(ptProductWheelSchedule.status, 'in_progress')
        ));
      return schedule;
    } catch (error) {
      console.error('Error fetching current wheel schedule:', error);
      return undefined;
    }
  }

  async updateWheelSchedule(id: number, data: Partial<InsertPtProductWheelSchedule>): Promise<PtProductWheelSchedule | undefined> {
    try {
      const [updated] = await db.update(ptProductWheelSchedule)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(ptProductWheelSchedule.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating wheel schedule:', error);
      return undefined;
    }
  }

  // Product Wheel Performance
  async recordWheelPerformance(data: InsertPtProductWheelPerformance): Promise<PtProductWheelPerformance> {
    try {
      const [performance] = await db.insert(ptProductWheelPerformance).values(data).returning();
      return performance;
    } catch (error) {
      console.error('Error recording wheel performance:', error);
      throw error;
    }
  }

  async getWheelPerformance(wheelId: number, startDate?: Date, endDate?: Date): Promise<PtProductWheelPerformance[]> {
    try {
      const conditions = [eq(ptProductWheelPerformance.wheelId, wheelId)];
      
      if (startDate) {
        conditions.push(sql`${ptProductWheelPerformance.metricDate} >= ${startDate}`);
      }
      
      if (endDate) {
        conditions.push(sql`${ptProductWheelPerformance.metricDate} <= ${endDate}`);
      }
      
      return await db.select()
        .from(ptProductWheelPerformance)
        .where(and(...conditions))
        .orderBy(desc(ptProductWheelPerformance.metricDate));
    } catch (error) {
      console.error('Error fetching wheel performance:', error);
      return [];
    }
  }

  // Calendar Management
  async createCalendar(data: InsertCalendar): Promise<Calendar> {
    try {
      const [calendar] = await db.insert(calendars).values(data).returning();
      return calendar;
    } catch (error) {
      console.error('Error creating calendar:', error);
      throw error;
    }
  }

  async getCalendars(filters?: { resourceId?: number; jobId?: number; plantId?: number }): Promise<Calendar[]> {
    try {
      const conditions = [eq(calendars.isActive, true)];
      
      if (filters?.resourceId) {
        conditions.push(eq(calendars.resourceId, filters.resourceId));
      }
      if (filters?.jobId) {
        conditions.push(eq(calendars.jobId, filters.jobId));
      }
      if (filters?.plantId) {
        conditions.push(eq(calendars.plantId, filters.plantId));
      }
      
      return await db.select()
        .from(calendars)
        .where(and(...conditions))
        .orderBy(calendars.name);
    } catch (error) {
      console.error('Error fetching calendars:', error);
      return [];
    }
  }

  async getCalendar(id: number): Promise<Calendar | undefined> {
    try {
      const [calendar] = await db.select().from(calendars).where(eq(calendars.id, id));
      return calendar;
    } catch (error) {
      console.error('Error fetching calendar:', error);
      return undefined;
    }
  }

  async getDefaultCalendar(): Promise<Calendar | undefined> {
    try {
      const [calendar] = await db.select()
        .from(calendars)
        .where(and(eq(calendars.isDefault, true), eq(calendars.isActive, true)));
      return calendar;
    } catch (error) {
      console.error('Error fetching default calendar:', error);
      return undefined;
    }
  }

  async updateCalendar(id: number, data: Partial<InsertCalendar>): Promise<Calendar | undefined> {
    try {
      const [updated] = await db.update(calendars)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(calendars.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating calendar:', error);
      return undefined;
    }
  }

  async deleteCalendar(id: number): Promise<boolean> {
    try {
      // Soft delete by setting isActive to false
      const [deleted] = await db.update(calendars)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(calendars.id, id))
        .returning();
      return !!deleted;
    } catch (error) {
      console.error('Error deleting calendar:', error);
      return false;
    }
  }

  async assignCalendarToResource(resourceId: number, calendarId: number): Promise<boolean> {
    try {
      // First clear any existing calendar assignment for this resource
      await db.update(calendars)
        .set({ resourceId: null, updatedAt: new Date() })
        .where(eq(calendars.resourceId, resourceId));
      
      // Then assign the new calendar
      const [updated] = await db.update(calendars)
        .set({ resourceId, updatedAt: new Date() })
        .where(eq(calendars.id, calendarId))
        .returning();
      
      return !!updated;
    } catch (error) {
      console.error('Error assigning calendar to resource:', error);
      return false;
    }
  }

  async assignCalendarToJob(jobId: number, calendarId: number): Promise<boolean> {
    try {
      // First clear any existing calendar assignment for this job
      await db.update(calendars)
        .set({ jobId: null, updatedAt: new Date() })
        .where(eq(calendars.jobId, jobId));
      
      // Then assign the new calendar
      const [updated] = await db.update(calendars)
        .set({ jobId, updatedAt: new Date() })
        .where(eq(calendars.id, calendarId))
        .returning();
      
      return !!updated;
    } catch (error) {
      console.error('Error assigning calendar to job:', error);
      return false;
    }
  }

  // Maintenance Periods
  async createMaintenancePeriod(data: InsertMaintenancePeriod): Promise<MaintenancePeriod> {
    try {
      const [period] = await db.insert(maintenancePeriods).values(data).returning();
      return period;
    } catch (error) {
      console.error('Error creating maintenance period:', error);
      throw error;
    }
  }

  async getMaintenancePeriods(filters?: { resourceId?: number; jobId?: number; plantId?: number; calendarId?: number }): Promise<MaintenancePeriod[]> {
    try {
      const conditions = [eq(maintenancePeriods.isActive, true)];
      
      if (filters?.resourceId) {
        conditions.push(eq(maintenancePeriods.resourceId, filters.resourceId));
      }
      if (filters?.jobId) {
        conditions.push(eq(maintenancePeriods.jobId, filters.jobId));
      }
      if (filters?.plantId) {
        conditions.push(eq(maintenancePeriods.plantId, filters.plantId));
      }
      if (filters?.calendarId) {
        conditions.push(eq(maintenancePeriods.calendarId, filters.calendarId));
      }
      
      return await db.select()
        .from(maintenancePeriods)
        .where(and(...conditions))
        .orderBy(maintenancePeriods.startDate);
    } catch (error) {
      console.error('Error fetching maintenance periods:', error);
      return [];
    }
  }

  async getMaintenancePeriod(id: number): Promise<MaintenancePeriod | undefined> {
    try {
      const [period] = await db.select().from(maintenancePeriods).where(eq(maintenancePeriods.id, id));
      return period;
    } catch (error) {
      console.error('Error fetching maintenance period:', error);
      return undefined;
    }
  }

  async getActiveMaintenancePeriods(date: Date): Promise<MaintenancePeriod[]> {
    try {
      const periods = await db.select()
        .from(maintenancePeriods)
        .where(
          and(
            eq(maintenancePeriods.isActive, true),
            sql`${maintenancePeriods.startDate} <= ${date}`,
            sql`${maintenancePeriods.endDate} >= ${date}`
          )
        )
        .orderBy(maintenancePeriods.startDate);
      
      return periods;
    } catch (error) {
      console.error('Error fetching active maintenance periods:', error);
      return [];
    }
  }

  async updateMaintenancePeriod(id: number, data: Partial<InsertMaintenancePeriod>): Promise<MaintenancePeriod | undefined> {
    try {
      const [updated] = await db.update(maintenancePeriods)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(maintenancePeriods.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating maintenance period:', error);
      return undefined;
    }
  }

  async deleteMaintenancePeriod(id: number): Promise<boolean> {
    try {
      // Soft delete by setting isActive to false
      const [deleted] = await db.update(maintenancePeriods)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(maintenancePeriods.id, id))
        .returning();
      return !!deleted;
    } catch (error) {
      console.error('Error deleting maintenance period:', error);
      return false;
    }
  }

  // ============================================
  // Optimization Studio Methods
  // ============================================

  async getOptimizationAlgorithms(category?: string, status?: string): Promise<OptimizationAlgorithm[]> {
    try {
      let query = db.select().from(optimizationAlgorithms);
      
      const conditions = [];
      if (category) conditions.push(eq(optimizationAlgorithms.category, category));
      if (status) conditions.push(eq(optimizationAlgorithms.status, status));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      return await query.orderBy(desc(optimizationAlgorithms.createdAt));
    } catch (error) {
      console.error('Error fetching optimization algorithms:', error);
      return [];
    }
  }

  async getStandardAlgorithms(): Promise<OptimizationAlgorithm[]> {
    try {
      return await db.select()
        .from(optimizationAlgorithms)
        .where(eq(optimizationAlgorithms.isStandard, true))
        .orderBy(desc(optimizationAlgorithms.createdAt));
    } catch (error) {
      console.error('Error fetching standard algorithms:', error);
      return [];
    }
  }

  async getAlgorithmTests(): Promise<AlgorithmTest[]> {
    try {
      return await db.select()
        .from(algorithmTests)
        .orderBy(desc(algorithmTests.createdAt));
    } catch (error) {
      console.error('Error fetching algorithm tests:', error);
      return [];
    }
  }

  async getAlgorithmDeployments(): Promise<AlgorithmDeployment[]> {
    try {
      return await db.select()
        .from(algorithmDeployments)
        .orderBy(desc(algorithmDeployments.deployedAt));
    } catch (error) {
      console.error('Error fetching deployments:', error);
      return [];
    }
  }

  async getAlgorithmFeedback(): Promise<AlgorithmFeedback[]> {
    try {
      return await db.select()
        .from(algorithmFeedback)
        .orderBy(desc(algorithmFeedback.createdAt));
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return [];
    }
  }

  async getAlgorithmVersions(): Promise<any[]> {
    // Version tracking not implemented yet
    return [];
  }

  async getGovernanceApprovals(): Promise<AlgorithmGovernanceApproval[]> {
    try {
      return await db.select()
        .from(algorithmGovernanceApprovals)
        .orderBy(desc(algorithmGovernanceApprovals.approvedAt));
    } catch (error) {
      console.error('Error fetching approvals:', error);
      return [];
    }
  }

  async getGovernanceDeployments(): Promise<any[]> {
    // Governance deployments not implemented yet
    return [];
  }

  async createOptimizationAlgorithm(algorithm: InsertOptimizationAlgorithm): Promise<OptimizationAlgorithm> {
    try {
      const [created] = await db.insert(optimizationAlgorithms)
        .values(algorithm)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating algorithm:', error);
      throw error;
    }
  }

  async updateOptimizationAlgorithm(id: number, data: Partial<InsertOptimizationAlgorithm>): Promise<OptimizationAlgorithm | undefined> {
    try {
      const [updated] = await db.update(optimizationAlgorithms)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(optimizationAlgorithms.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating algorithm:', error);
      return undefined;
    }
  }

  async createAlgorithmDeployment(deployment: InsertAlgorithmDeployment): Promise<AlgorithmDeployment> {
    try {
      const [created] = await db.insert(algorithmDeployments)
        .values(deployment)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating deployment:', error);
      throw error;
    }
  }

  async createAlgorithmTest(test: InsertAlgorithmTest): Promise<AlgorithmTest> {
    try {
      const [created] = await db.insert(algorithmTests)
        .values(test)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating test:', error);
      throw error;
    }
  }

  async createAlgorithmFeedback(feedback: InsertAlgorithmFeedback): Promise<AlgorithmFeedback> {
    try {
      const [created] = await db.insert(algorithmFeedback)
        .values(feedback)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  }

  async createGovernanceApproval(approval: InsertAlgorithmGovernanceApproval): Promise<AlgorithmGovernanceApproval> {
    try {
      const [created] = await db.insert(algorithmGovernanceApprovals)
        .values(approval)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating approval:', error);
      throw error;
    }
  }

  // ============================================
  // Algorithm Requirements Management Methods
  // ============================================

  async getAlgorithmRequirements(filters?: { requirementType?: string; category?: string; priority?: string }): Promise<AlgorithmRequirement[]> {
    try {
      let query = db.select().from(algorithmRequirements);
      
      const conditions = [];
      if (filters?.requirementType) conditions.push(eq(algorithmRequirements.requirementType, filters.requirementType));
      if (filters?.category) conditions.push(eq(algorithmRequirements.category, filters.category));
      if (filters?.priority) conditions.push(eq(algorithmRequirements.priority, filters.priority));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      return await query.orderBy(desc(algorithmRequirements.createdAt));
    } catch (error) {
      console.error('Error fetching algorithm requirements:', error);
      return [];
    }
  }

  async getAlgorithmRequirement(id: number): Promise<AlgorithmRequirement | undefined> {
    try {
      const [requirement] = await db.select()
        .from(algorithmRequirements)
        .where(eq(algorithmRequirements.id, id));
      return requirement || undefined;
    } catch (error) {
      console.error('Error fetching algorithm requirement:', error);
      return undefined;
    }
  }

  async createAlgorithmRequirement(data: InsertAlgorithmRequirement): Promise<AlgorithmRequirement> {
    try {
      const [created] = await db.insert(algorithmRequirements)
        .values(data)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating algorithm requirement:', error);
      throw error;
    }
  }

  async updateAlgorithmRequirement(id: number, data: Partial<InsertAlgorithmRequirement>): Promise<AlgorithmRequirement | undefined> {
    try {
      const [updated] = await db.update(algorithmRequirements)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(algorithmRequirements.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating algorithm requirement:', error);
      return undefined;
    }
  }

  async deleteAlgorithmRequirement(id: number): Promise<boolean> {
    try {
      const result = await db.delete(algorithmRequirements)
        .where(eq(algorithmRequirements.id, id));
      return result.count > 0;
    } catch (error) {
      console.error('Error deleting algorithm requirement:', error);
      return false;
    }
  }

  // Algorithm Requirement Associations

  async getAlgorithmRequirementAssociations(algorithmId?: number, requirementId?: number): Promise<AlgorithmRequirementAssociation[]> {
    try {
      let query = db.select().from(algorithmRequirementAssociations);
      
      const conditions = [];
      if (algorithmId) conditions.push(eq(algorithmRequirementAssociations.algorithmId, algorithmId));
      if (requirementId) conditions.push(eq(algorithmRequirementAssociations.requirementId, requirementId));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      return await query.orderBy(desc(algorithmRequirementAssociations.associatedAt));
    } catch (error) {
      console.error('Error fetching algorithm requirement associations:', error);
      return [];
    }
  }

  async createAlgorithmRequirementAssociation(data: InsertAlgorithmRequirementAssociation): Promise<AlgorithmRequirementAssociation> {
    try {
      const [created] = await db.insert(algorithmRequirementAssociations)
        .values(data)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating algorithm requirement association:', error);
      throw error;
    }
  }

  async updateAlgorithmRequirementAssociation(id: number, data: Partial<InsertAlgorithmRequirementAssociation>): Promise<AlgorithmRequirementAssociation | undefined> {
    try {
      const [updated] = await db.update(algorithmRequirementAssociations)
        .set(data)
        .where(eq(algorithmRequirementAssociations.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating algorithm requirement association:', error);
      return undefined;
    }
  }

  async deleteAlgorithmRequirementAssociation(id: number): Promise<boolean> {
    try {
      const result = await db.delete(algorithmRequirementAssociations)
        .where(eq(algorithmRequirementAssociations.id, id));
      return result.count > 0;
    } catch (error) {
      console.error('Error deleting algorithm requirement association:', error);
      return false;
    }
  }

  // Algorithm Requirement Validations

  async getAlgorithmRequirementValidations(filters?: { algorithmId?: number; requirementId?: number; testRunId?: number; validationStatus?: string }): Promise<AlgorithmRequirementValidation[]> {
    try {
      let query = db.select().from(algorithmRequirementValidations);
      
      const conditions = [];
      if (filters?.algorithmId) conditions.push(eq(algorithmRequirementValidations.algorithmId, filters.algorithmId));
      if (filters?.requirementId) conditions.push(eq(algorithmRequirementValidations.requirementId, filters.requirementId));
      if (filters?.testRunId) conditions.push(eq(algorithmRequirementValidations.testRunId, filters.testRunId));
      if (filters?.validationStatus) conditions.push(eq(algorithmRequirementValidations.validationStatus, filters.validationStatus));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      return await query.orderBy(desc(algorithmRequirementValidations.validatedAt));
    } catch (error) {
      console.error('Error fetching algorithm requirement validations:', error);
      return [];
    }
  }

  async createAlgorithmRequirementValidation(data: InsertAlgorithmRequirementValidation): Promise<AlgorithmRequirementValidation> {
    try {
      const [created] = await db.insert(algorithmRequirementValidations)
        .values(data)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating algorithm requirement validation:', error);
      throw error;
    }
  }

  async getLatestValidations(algorithmId: number): Promise<AlgorithmRequirementValidation[]> {
    try {
      // Get the latest validation for each requirement for this algorithm
      const validations = await db.select()
        .from(algorithmRequirementValidations)
        .where(eq(algorithmRequirementValidations.algorithmId, algorithmId))
        .orderBy(desc(algorithmRequirementValidations.validatedAt));
      
      // Group by requirementId and get the latest one for each
      const latestMap = new Map<number, AlgorithmRequirementValidation>();
      for (const validation of validations) {
        if (!latestMap.has(validation.requirementId)) {
          latestMap.set(validation.requirementId, validation);
        }
      }
      
      return Array.from(latestMap.values());
    } catch (error) {
      console.error('Error fetching latest validations:', error);
      return [];
    }
  }

  // Items Management
  async getItems(): Promise<Item[]> {
    try {
      return await db.select().from(items).orderBy(items.itemName);
    } catch (error) {
      console.error('Error fetching items:', error);
      return [];
    }
  }

  async getItem(id: number): Promise<Item | undefined> {
    try {
      const [item] = await db.select().from(items).where(eq(items.id, id));
      return item || undefined;
    } catch (error) {
      console.error('Error fetching item:', error);
      return undefined;
    }
  }

  async createItem(item: InsertItem): Promise<Item> {
    try {
      const [newItem] = await db.insert(items).values(item).returning();
      return newItem;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  async updateItem(id: number, item: Partial<InsertItem>): Promise<Item | undefined> {
    try {
      const [updated] = await db.update(items)
        .set({ ...item, updatedAt: new Date() })
        .where(eq(items.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating item:', error);
      return undefined;
    }
  }

  async deleteItem(id: number): Promise<boolean> {
    try {
      const result = await db.delete(items).where(eq(items.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting item:', error);
      return false;
    }
  }

  // Capabilities Management
  async getCapabilities(): Promise<Capability[]> {
    try {
      return await db.select().from(capabilities).orderBy(capabilities.name);
    } catch (error) {
      console.error('Error fetching capabilities:', error);
      return [];
    }
  }

  async getCapability(id: number): Promise<Capability | undefined> {
    try {
      const [capability] = await db.select().from(capabilities).where(eq(capabilities.id, id));
      return capability || undefined;
    } catch (error) {
      console.error('Error fetching capability:', error);
      return undefined;
    }
  }

  async createCapability(capability: InsertCapability): Promise<Capability> {
    try {
      const [newCapability] = await db.insert(capabilities).values(capability).returning();
      return newCapability;
    } catch (error) {
      console.error('Error creating capability:', error);
      throw error;
    }
  }

  async updateCapability(id: number, capability: Partial<InsertCapability>): Promise<Capability | undefined> {
    try {
      const [updated] = await db.update(capabilities)
        .set({ ...capability, updatedAt: new Date() })
        .where(eq(capabilities.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating capability:', error);
      return undefined;
    }
  }

  async deleteCapability(id: number): Promise<boolean> {
    try {
      const result = await db.delete(capabilities).where(eq(capabilities.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting capability:', error);
      return false;
    }
  }

  // Plant KPI Targets
  async createPlantKpiTarget(data: InsertPlantKpiTarget): Promise<PlantKpiTarget> {
    try {
      const [target] = await db.insert(plantKpiTargets).values(data).returning();
      return target;
    } catch (error) {
      console.error('Error creating plant KPI target:', error);
      throw error;
    }
  }

  async getPlantKpiTargets(plantId?: number): Promise<PlantKpiTarget[]> {
    try {
      if (plantId) {
        return await db.select()
          .from(plantKpiTargets)
          .where(eq(plantKpiTargets.plantId, plantId))
          .orderBy(desc(plantKpiTargets.weight));
      }
      return await db.select()
        .from(plantKpiTargets)
        .orderBy(desc(plantKpiTargets.weight));
    } catch (error) {
      console.error('Error fetching plant KPI targets:', error);
      return [];
    }
  }

  async getPlantKpiTarget(id: number): Promise<PlantKpiTarget | undefined> {
    try {
      const [target] = await db.select()
        .from(plantKpiTargets)
        .where(eq(plantKpiTargets.id, id));
      return target || undefined;
    } catch (error) {
      console.error('Error fetching plant KPI target:', error);
      return undefined;
    }
  }

  async updatePlantKpiTarget(id: number, data: Partial<InsertPlantKpiTarget>): Promise<PlantKpiTarget | undefined> {
    try {
      const [updated] = await db.update(plantKpiTargets)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(plantKpiTargets.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating plant KPI target:', error);
      return undefined;
    }
  }

  async deletePlantKpiTarget(id: number): Promise<boolean> {
    try {
      const result = await db.delete(plantKpiTargets)
        .where(eq(plantKpiTargets.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting plant KPI target:', error);
      return false;
    }
  }

  // Plant KPI Performance
  async createPlantKpiPerformance(data: InsertPlantKpiPerformance): Promise<PlantKpiPerformance> {
    try {
      const [performance] = await db.insert(plantKpiPerformance).values(data).returning();
      return performance;
    } catch (error) {
      console.error('Error creating plant KPI performance:', error);
      throw error;
    }
  }

  async getPlantKpiPerformance(filters?: { plantKpiTargetId?: number; startDate?: Date; endDate?: Date }): Promise<PlantKpiPerformance[]> {
    try {
      let query = db.select().from(plantKpiPerformance);
      
      if (filters?.plantKpiTargetId) {
        query = query.where(eq(plantKpiPerformance.plantKpiTargetId, filters.plantKpiTargetId));
      }
      
      if (filters?.startDate) {
        query = query.where(sql`${plantKpiPerformance.measurementDate} >= ${filters.startDate}`);
      }
      
      if (filters?.endDate) {
        query = query.where(sql`${plantKpiPerformance.measurementDate} <= ${filters.endDate}`);
      }
      
      return await query.orderBy(desc(plantKpiPerformance.measurementDate));
    } catch (error) {
      console.error('Error fetching plant KPI performance:', error);
      return [];
    }
  }

  async getLatestKpiPerformance(plantKpiTargetId: number): Promise<PlantKpiPerformance | undefined> {
    try {
      const [performance] = await db.select()
        .from(plantKpiPerformance)
        .where(eq(plantKpiPerformance.plantKpiTargetId, plantKpiTargetId))
        .orderBy(desc(plantKpiPerformance.measurementDate))
        .limit(1);
      return performance || undefined;
    } catch (error) {
      console.error('Error fetching latest KPI performance:', error);
      return undefined;
    }
  }

  async updatePlantKpiPerformance(id: number, data: Partial<InsertPlantKpiPerformance>): Promise<PlantKpiPerformance | undefined> {
    try {
      const [updated] = await db.update(plantKpiPerformance)
        .set(data)
        .where(eq(plantKpiPerformance.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating plant KPI performance:', error);
      return undefined;
    }
  }

  async deletePlantKpiPerformance(id: number): Promise<boolean> {
    try {
      const result = await db.delete(plantKpiPerformance)
        .where(eq(plantKpiPerformance.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting plant KPI performance:', error);
      return false;
    }
  }

  // Autonomous Optimization
  async createAutonomousOptimization(data: InsertAutonomousOptimization): Promise<AutonomousOptimization> {
    try {
      const [optimization] = await db.insert(autonomousOptimization).values(data).returning();
      return optimization;
    } catch (error) {
      console.error('Error creating autonomous optimization:', error);
      throw error;
    }
  }

  async getAutonomousOptimizations(plantId?: number): Promise<AutonomousOptimization[]> {
    try {
      if (plantId) {
        return await db.select()
          .from(autonomousOptimization)
          .where(eq(autonomousOptimization.plantId, plantId))
          .orderBy(desc(autonomousOptimization.createdAt));
      }
      return await db.select()
        .from(autonomousOptimization)
        .orderBy(desc(autonomousOptimization.createdAt));
    } catch (error) {
      console.error('Error fetching autonomous optimizations:', error);
      return [];
    }
  }

  async getAutonomousOptimization(id: number): Promise<AutonomousOptimization | undefined> {
    try {
      const [optimization] = await db.select()
        .from(autonomousOptimization)
        .where(eq(autonomousOptimization.id, id));
      return optimization || undefined;
    } catch (error) {
      console.error('Error fetching autonomous optimization:', error);
      return undefined;
    }
  }

  async updateAutonomousOptimization(id: number, data: Partial<InsertAutonomousOptimization>): Promise<AutonomousOptimization | undefined> {
    try {
      const [updated] = await db.update(autonomousOptimization)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(autonomousOptimization.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating autonomous optimization:', error);
      return undefined;
    }
  }

  async deleteAutonomousOptimization(id: number): Promise<boolean> {
    try {
      const result = await db.delete(autonomousOptimization)
        .where(eq(autonomousOptimization.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting autonomous optimization:', error);
      return false;
    }
  }

  // Workflow Management
  async createWorkflow(data: any): Promise<any> {
    try {
      // For now, return mock data - actual implementation will use workflow tables
      return {
        id: Date.now(),
        ...data,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  async getWorkflows(filters?: { category?: string; status?: string }): Promise<any[]> {
    try {
      // Return mock data for now
      return [
        {
          id: 1,
          name: 'Daily Production Report',
          description: 'Automatically generate and distribute daily production reports',
          category: 'manufacturing',
          status: 'active',
          triggerType: 'schedule',
          cronExpression: '0 9 * * *',
          aiEnabled: true,
          executionCount: 245,
          tags: ['reporting', 'production']
        },
        {
          id: 2,
          name: 'Quality Alert Response',
          description: 'Respond to quality issues with automated escalation and remediation',
          category: 'quality',
          status: 'active',
          triggerType: 'event',
          aiEnabled: true,
          executionCount: 189,
          tags: ['quality', 'alerts']
        },
        {
          id: 3,
          name: 'Maintenance Schedule',
          description: 'Schedule and track preventive maintenance activities',
          category: 'maintenance',
          status: 'draft',
          triggerType: 'schedule',
          cronExpression: '0 0 * * 1',
          aiEnabled: false,
          executionCount: 0,
          tags: ['maintenance']
        }
      ].filter(w => {
        if (filters?.category && w.category !== filters.category) return false;
        if (filters?.status && w.status !== filters.status) return false;
        return true;
      });
    } catch (error) {
      console.error('Error fetching workflows:', error);
      return [];
    }
  }

  async getWorkflow(id: number): Promise<any | undefined> {
    const workflows = await this.getWorkflows();
    return workflows.find(w => w.id === id);
  }

  async updateWorkflow(id: number, data: any): Promise<any | undefined> {
    try {
      return {
        id,
        ...data,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error updating workflow:', error);
      return undefined;
    }
  }

  async deleteWorkflow(id: number): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      return false;
    }
  }

  // Workflow Executions
  async createWorkflowExecution(data: any): Promise<any> {
    try {
      return {
        id: Date.now(),
        executionId: `exec-${Date.now()}`,
        ...data,
        status: 'running',
        startedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating workflow execution:', error);
      throw error;
    }
  }

  async getWorkflowExecutions(workflowId?: number): Promise<any[]> {
    try {
      return [
        {
          id: 1,
          executionId: 'exec-1',
          workflowId: 1,
          workflowName: 'Daily Production Report',
          status: 'completed',
          startedAt: new Date('2025-10-28T09:00:00'),
          completedAt: new Date('2025-10-28T09:00:45'),
          duration: 45,
          triggeredBy: 'schedule'
        },
        {
          id: 2,
          executionId: 'exec-2',
          workflowId: 2,
          workflowName: 'Quality Alert Response',
          status: 'running',
          startedAt: new Date('2025-10-28T13:30:00'),
          triggeredBy: 'event'
        }
      ].filter(e => !workflowId || e.workflowId === workflowId);
    } catch (error) {
      console.error('Error fetching workflow executions:', error);
      return [];
    }
  }

  async getWorkflowExecution(id: number): Promise<any | undefined> {
    const executions = await this.getWorkflowExecutions();
    return executions.find(e => e.id === id);
  }

  async updateWorkflowExecution(id: number, data: any): Promise<any | undefined> {
    try {
      return {
        id,
        ...data,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error updating workflow execution:', error);
      return undefined;
    }
  }

  // Workflow Templates
  async getWorkflowTemplates(category?: string): Promise<any[]> {
    try {
      return [
        {
          id: 1,
          name: 'Daily Production Report',
          description: 'Automatically generate and distribute daily production reports',
          category: 'reporting',
          usageCount: 245
        },
        {
          id: 2,
          name: 'Quality Alert Response',
          description: 'Respond to quality issues with automated escalation and remediation',
          category: 'quality',
          usageCount: 189
        },
        {
          id: 3,
          name: 'Maintenance Schedule',
          description: 'Schedule and track preventive maintenance activities',
          category: 'maintenance',
          usageCount: 156
        },
        {
          id: 4,
          name: 'Inventory Reorder',
          description: 'Automatically reorder materials when stock reaches threshold',
          category: 'inventory',
          usageCount: 312
        }
      ].filter(t => !category || t.category === category);
    } catch (error) {
      console.error('Error fetching workflow templates:', error);
      return [];
    }
  }

  async getWorkflowTemplate(id: number): Promise<any | undefined> {
    const templates = await this.getWorkflowTemplates();
    return templates.find(t => t.id === id);
  }

  async createWorkflowTemplate(data: any): Promise<any> {
    try {
      return {
        id: Date.now(),
        ...data,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error creating workflow template:', error);
      throw error;
    }
  }
  
  // Workflow Triggers Implementation - Scheduled, Event-based, and Metric-based Execution
  async getWorkflowTriggers(workflowId: number): Promise<any[]> {
    try {
      const result = await db.select()
        .from(workflowTriggers)
        .where(eq(workflowTriggers.workflowId, workflowId))
        .orderBy(desc(workflowTriggers.createdAt));
      return result;
    } catch (error) {
      console.error('Error fetching workflow triggers:', error);
      return [];
    }
  }

  async getWorkflowTrigger(id: number): Promise<any | undefined> {
    try {
      const result = await db.select()
        .from(workflowTriggers)
        .where(eq(workflowTriggers.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching workflow trigger:', error);
      return undefined;
    }
  }

  async createWorkflowTrigger(data: any): Promise<any> {
    try {
      const result = await db.insert(workflowTriggers)
        .values(data)
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating workflow trigger:', error);
      throw error;
    }
  }

  async updateWorkflowTrigger(id: number, data: any): Promise<any | undefined> {
    try {
      const result = await db.update(workflowTriggers)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(workflowTriggers.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating workflow trigger:', error);
      return undefined;
    }
  }

  async deleteWorkflowTrigger(id: number): Promise<boolean> {
    try {
      await db.delete(workflowTriggers)
        .where(eq(workflowTriggers.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting workflow trigger:', error);
      return false;
    }
  }

  async getWorkflowTriggerExecutions(triggerId: number, limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const result = await db.select()
        .from(workflowTriggerExecutions)
        .where(eq(workflowTriggerExecutions.triggerId, triggerId))
        .orderBy(desc(workflowTriggerExecutions.executedAt))
        .limit(limit)
        .offset(offset);
      return result;
    } catch (error) {
      console.error('Error fetching workflow trigger executions:', error);
      return [];
    }
  }
  
  // Saved Forecasts Implementation
  async getSavedForecasts(userId: number): Promise<SavedForecast[]> {
    try {
      return await db.select()
        .from(savedForecasts)
        .where(and(
          eq(savedForecasts.userId, userId),
          eq(savedForecasts.isActive, true)
        ))
        .orderBy(desc(savedForecasts.createdAt));
    } catch (error) {
      console.error('Error fetching saved forecasts:', error);
      return [];
    }
  }

  async getSavedForecast(id: number): Promise<SavedForecast | undefined> {
    try {
      const result = await db.select()
        .from(savedForecasts)
        .where(eq(savedForecasts.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching saved forecast:', error);
      return undefined;
    }
  }

  async createSavedForecast(data: InsertSavedForecast): Promise<SavedForecast> {
    try {
      const result = await db.insert(savedForecasts)
        .values(data)
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating saved forecast:', error);
      throw error;
    }
  }

  async updateSavedForecast(id: number, data: Partial<InsertSavedForecast>): Promise<SavedForecast | undefined> {
    try {
      const result = await db.update(savedForecasts)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(savedForecasts.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating saved forecast:', error);
      return undefined;
    }
  }

  async deleteSavedForecast(id: number): Promise<boolean> {
    try {
      // Soft delete by setting isActive to false
      const result = await db.update(savedForecasts)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(savedForecasts.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting saved forecast:', error);
      return false;
    }
  }

  // ============================================
  // ATP/CTP Reservation System Implementation
  // ============================================

  // Main Reservations
  async getAtpCtpReservations(filters?: { 
    status?: string; 
    type?: string; 
    startDate?: Date; 
    endDate?: Date 
  }): Promise<AtpCtpReservation[]> {
    try {
      let query = db.select().from(atpCtpReservations);
      
      const conditions = [];
      if (filters?.status) {
        conditions.push(eq(atpCtpReservations.status, filters.status as any));
      }
      if (filters?.type) {
        conditions.push(eq(atpCtpReservations.type, filters.type as any));
      }
      if (filters?.startDate) {
        conditions.push(sql`${atpCtpReservations.startDate} >= ${filters.startDate}`);
      }
      if (filters?.endDate) {
        conditions.push(sql`${atpCtpReservations.endDate} <= ${filters.endDate}`);
      }
      
      if (conditions.length > 0) {
        const result = await db.select()
          .from(atpCtpReservations)
          .where(and(...conditions))
          .orderBy(desc(atpCtpReservations.createdAt));
        return result;
      }
      
      return await query.orderBy(desc(atpCtpReservations.createdAt));
    } catch (error) {
      console.error('Error fetching ATP/CTP reservations:', error);
      return [];
    }
  }

  async getAtpCtpReservation(id: number): Promise<AtpCtpReservation | undefined> {
    try {
      const [result] = await db.select()
        .from(atpCtpReservations)
        .where(eq(atpCtpReservations.id, id));
      return result;
    } catch (error) {
      console.error('Error fetching ATP/CTP reservation:', error);
      return undefined;
    }
  }

  async createAtpCtpReservation(data: InsertAtpCtpReservation): Promise<AtpCtpReservation> {
    try {
      // Generate unique reservation number
      const reservationNumber = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const [result] = await db.insert(atpCtpReservations)
        .values({
          ...data,
          reservationNumber
        })
        .returning();
      
      // Create history entry
      await this.createReservationHistory({
        reservationId: result.id,
        action: 'created',
        newStatus: result.status,
        changedBy: data.requestedBy,
        snapshotData: result
      });
      
      return result;
    } catch (error) {
      console.error('Error creating ATP/CTP reservation:', error);
      throw error;
    }
  }

  async updateAtpCtpReservation(id: number, data: Partial<InsertAtpCtpReservation>): Promise<AtpCtpReservation | undefined> {
    try {
      const previous = await this.getAtpCtpReservation(id);
      if (!previous) return undefined;
      
      const [result] = await db.update(atpCtpReservations)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(atpCtpReservations.id, id))
        .returning();
      
      // Create history entry if status changed
      if (data.status && data.status !== previous.status) {
        await this.createReservationHistory({
          reservationId: id,
          action: 'modified',
          previousStatus: previous.status,
          newStatus: data.status,
          changedBy: data.confirmedBy || data.requestedBy,
          snapshotData: result
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error updating ATP/CTP reservation:', error);
      return undefined;
    }
  }

  async cancelAtpCtpReservation(id: number, userId: number, reason?: string): Promise<boolean> {
    try {
      const previous = await this.getAtpCtpReservation(id);
      if (!previous) return false;
      
      const [result] = await db.update(atpCtpReservations)
        .set({
          status: 'cancelled',
          cancelledBy: userId,
          cancelledAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(atpCtpReservations.id, id))
        .returning();
      
      if (result) {
        await this.createReservationHistory({
          reservationId: id,
          action: 'cancelled',
          previousStatus: previous.status,
          newStatus: 'cancelled',
          changedBy: userId,
          changeReason: reason,
          snapshotData: result
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error cancelling ATP/CTP reservation:', error);
      return false;
    }
  }

  // Material Reservations
  async getMaterialReservations(reservationId: number): Promise<AtpCtpMaterialReservation[]> {
    try {
      return await db.select()
        .from(atpCtpMaterialReservations)
        .where(eq(atpCtpMaterialReservations.reservationId, reservationId))
        .orderBy(atpCtpMaterialReservations.id);
    } catch (error) {
      console.error('Error fetching material reservations:', error);
      return [];
    }
  }

  async createMaterialReservation(data: InsertAtpCtpMaterialReservation): Promise<AtpCtpMaterialReservation> {
    try {
      const [result] = await db.insert(atpCtpMaterialReservations)
        .values(data)
        .returning();
      
      // Update availability snapshots
      if (data.itemId) {
        await this.updateAvailabilitySnapshots('material', data.itemId);
      }
      
      return result;
    } catch (error) {
      console.error('Error creating material reservation:', error);
      throw error;
    }
  }

  async updateMaterialReservation(id: number, data: Partial<InsertAtpCtpMaterialReservation>): Promise<AtpCtpMaterialReservation | undefined> {
    try {
      const [result] = await db.update(atpCtpMaterialReservations)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(atpCtpMaterialReservations.id, id))
        .returning();
      
      // Update availability snapshots
      if (result && result.itemId) {
        await this.updateAvailabilitySnapshots('material', result.itemId);
      }
      
      return result;
    } catch (error) {
      console.error('Error updating material reservation:', error);
      return undefined;
    }
  }

  async checkMaterialAvailability(itemId: number, quantity: number, startDate: Date, endDate: Date): Promise<boolean> {
    try {
      // Check existing reservations for the item in the date range
      const existingReservations = await db.select()
        .from(atpCtpMaterialReservations)
        .innerJoin(atpCtpReservations, eq(atpCtpMaterialReservations.reservationId, atpCtpReservations.id))
        .where(and(
          eq(atpCtpMaterialReservations.itemId, itemId),
          sql`${atpCtpReservations.status} IN ('confirmed', 'active')`,
          sql`${atpCtpReservations.startDate} <= ${endDate}`,
          sql`${atpCtpReservations.endDate} >= ${startDate}`
        ));
      
      // Calculate total reserved quantity
      const totalReserved = existingReservations.reduce((sum, res) => {
        return sum + parseFloat(res.atp_ctp_material_reservations.reservedQuantity?.toString() || '0');
      }, 0);
      
      // For now, we'll return true if there are no conflicting reservations
      // In a real system, you'd check against actual inventory levels
      return totalReserved === 0 || totalReserved + quantity <= 1000; // Placeholder limit
    } catch (error) {
      console.error('Error checking material availability:', error);
      return false;
    }
  }

  // Resource Reservations  
  async getResourceReservations(reservationId: number): Promise<AtpCtpResourceReservation[]> {
    try {
      return await db.select()
        .from(atpCtpResourceReservations)
        .where(eq(atpCtpResourceReservations.reservationId, reservationId))
        .orderBy(atpCtpResourceReservations.id);
    } catch (error) {
      console.error('Error fetching resource reservations:', error);
      return [];
    }
  }

  async createResourceReservation(data: InsertAtpCtpResourceReservation): Promise<AtpCtpResourceReservation> {
    try {
      // Check for conflicts before creating
      const conflicts = await this.detectResourceConflicts(
        data.resourceId || 0,
        data.startTime,
        data.endTime
      );
      
      const [result] = await db.insert(atpCtpResourceReservations)
        .values({
          ...data,
          hasConflict: conflicts.length > 0,
          conflictingReservations: conflicts
        })
        .returning();
      
      // Update availability snapshots
      if (data.resourceId) {
        await this.updateAvailabilitySnapshots('resource', data.resourceId);
      }
      
      return result;
    } catch (error) {
      console.error('Error creating resource reservation:', error);
      throw error;
    }
  }

  async updateResourceReservation(id: number, data: Partial<InsertAtpCtpResourceReservation>): Promise<AtpCtpResourceReservation | undefined> {
    try {
      const [existing] = await db.select()
        .from(atpCtpResourceReservations)
        .where(eq(atpCtpResourceReservations.id, id));
      
      if (!existing) return undefined;
      
      // Check for conflicts if time changed
      let conflicts: number[] = [];
      if (data.startTime || data.endTime) {
        conflicts = await this.detectResourceConflicts(
          data.resourceId || existing.resourceId || 0,
          data.startTime || existing.startTime,
          data.endTime || existing.endTime,
          existing.reservationId
        );
      }
      
      const [result] = await db.update(atpCtpResourceReservations)
        .set({
          ...data,
          hasConflict: conflicts.length > 0,
          conflictingReservations: conflicts,
          updatedAt: new Date()
        })
        .where(eq(atpCtpResourceReservations.id, id))
        .returning();
      
      // Update availability snapshots
      if (result && result.resourceId) {
        await this.updateAvailabilitySnapshots('resource', result.resourceId);
      }
      
      return result;
    } catch (error) {
      console.error('Error updating resource reservation:', error);
      return undefined;
    }
  }

  async checkResourceAvailability(resourceId: number, startTime: Date, endTime: Date): Promise<boolean> {
    try {
      const conflicts = await this.detectResourceConflicts(resourceId, startTime, endTime);
      return conflicts.length === 0;
    } catch (error) {
      console.error('Error checking resource availability:', error);
      return false;
    }
  }

  async detectResourceConflicts(
    resourceId: number, 
    startTime: Date, 
    endTime: Date, 
    excludeReservationId?: number
  ): Promise<number[]> {
    try {
      const conditions = [
        eq(atpCtpResourceReservations.resourceId, resourceId),
        sql`${atpCtpResourceReservations.startTime} < ${endTime}`,
        sql`${atpCtpResourceReservations.endTime} > ${startTime}`
      ];
      
      if (excludeReservationId) {
        conditions.push(sql`${atpCtpResourceReservations.reservationId} != ${excludeReservationId}`);
      }
      
      const conflicts = await db.select()
        .from(atpCtpResourceReservations)
        .innerJoin(atpCtpReservations, eq(atpCtpResourceReservations.reservationId, atpCtpReservations.id))
        .where(and(
          ...conditions,
          sql`${atpCtpReservations.status} IN ('confirmed', 'active')`
        ));
      
      return conflicts.map(c => c.atp_ctp_reservations.id);
    } catch (error) {
      console.error('Error detecting resource conflicts:', error);
      return [];
    }
  }

  // Reservation History
  async getReservationHistory(reservationId: number): Promise<AtpCtpReservationHistory[]> {
    try {
      return await db.select()
        .from(atpCtpReservationHistory)
        .where(eq(atpCtpReservationHistory.reservationId, reservationId))
        .orderBy(desc(atpCtpReservationHistory.timestamp));
    } catch (error) {
      console.error('Error fetching reservation history:', error);
      return [];
    }
  }

  async createReservationHistory(data: InsertAtpCtpReservationHistory): Promise<AtpCtpReservationHistory> {
    try {
      const [result] = await db.insert(atpCtpReservationHistory)
        .values(data)
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating reservation history:', error);
      throw error;
    }
  }

  // Availability Snapshots
  async getAvailabilitySnapshots(
    entityType: string, 
    entityId: number, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<AtpCtpAvailabilitySnapshot[]> {
    try {
      const conditions = [
        eq(atpCtpAvailabilitySnapshots.entityType, entityType),
        eq(atpCtpAvailabilitySnapshots.entityId, entityId)
      ];
      
      if (startDate) {
        conditions.push(sql`${atpCtpAvailabilitySnapshots.snapshotDate} >= ${startDate}`);
      }
      if (endDate) {
        conditions.push(sql`${atpCtpAvailabilitySnapshots.snapshotDate} <= ${endDate}`);
      }
      
      return await db.select()
        .from(atpCtpAvailabilitySnapshots)
        .where(and(...conditions))
        .orderBy(desc(atpCtpAvailabilitySnapshots.snapshotDate));
    } catch (error) {
      console.error('Error fetching availability snapshots:', error);
      return [];
    }
  }

  async createAvailabilitySnapshot(data: InsertAtpCtpAvailabilitySnapshot): Promise<AtpCtpAvailabilitySnapshot> {
    try {
      const [result] = await db.insert(atpCtpAvailabilitySnapshots)
        .values(data)
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating availability snapshot:', error);
      throw error;
    }
  }

  async updateAvailabilitySnapshots(entityType: string, entityId: number): Promise<void> {
    try {
      // Calculate current availability based on reservations
      const now = new Date();
      
      if (entityType === 'material') {
        // Get all active material reservations for this item
        const reservations = await db.select()
          .from(atpCtpMaterialReservations)
          .innerJoin(atpCtpReservations, eq(atpCtpMaterialReservations.reservationId, atpCtpReservations.id))
          .where(and(
            eq(atpCtpMaterialReservations.itemId, entityId),
            sql`${atpCtpReservations.status} IN ('confirmed', 'active')`,
            sql`${atpCtpReservations.endDate} >= ${now}`
          ));
        
        // Calculate total reserved quantity
        const totalReserved = reservations.reduce((sum, res) => {
          return sum + parseFloat(res.atp_ctp_material_reservations.reservedQuantity?.toString() || '0');
        }, 0);
        
        // Create snapshot
        await this.createAvailabilitySnapshot({
          entityType: 'material',
          entityId,
          snapshotDate: now,
          reservedQuantity: totalReserved.toString(),
          futureReservations: reservations.map(r => ({
            reservationId: r.atp_ctp_reservations.id,
            quantity: r.atp_ctp_material_reservations.reservedQuantity,
            startDate: r.atp_ctp_reservations.startDate,
            endDate: r.atp_ctp_reservations.endDate
          }))
        });
      } else if (entityType === 'resource') {
        // Get all active resource reservations
        const reservations = await db.select()
          .from(atpCtpResourceReservations)
          .innerJoin(atpCtpReservations, eq(atpCtpResourceReservations.reservationId, atpCtpReservations.id))
          .where(and(
            eq(atpCtpResourceReservations.resourceId, entityId),
            sql`${atpCtpReservations.status} IN ('confirmed', 'active')`,
            sql`${atpCtpResourceReservations.endTime} >= ${now}`
          ));
        
        // Calculate utilization
        const totalMinutes = reservations.reduce((sum, res) => {
          return sum + (res.atp_ctp_resource_reservations.durationMinutes || 0);
        }, 0);
        
        const utilization = Math.min((totalMinutes / (8 * 60)) * 100, 100); // Assuming 8 hour day
        
        // Create snapshot
        await this.createAvailabilitySnapshot({
          entityType: 'resource',
          entityId,
          snapshotDate: now,
          reservedCapacity: totalMinutes.toString(),
          utilization: utilization.toString(),
          futureReservations: reservations.map(r => ({
            reservationId: r.atp_ctp_reservations.id,
            startTime: r.atp_ctp_resource_reservations.startTime,
            endTime: r.atp_ctp_resource_reservations.endTime,
            duration: r.atp_ctp_resource_reservations.durationMinutes
          }))
        });
      }
    } catch (error) {
      console.error('Error updating availability snapshots:', error);
    }
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();