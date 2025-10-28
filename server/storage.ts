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
  // Master Data types
  items, capabilities,
  type Item, type InsertItem,
  type Capability, type InsertCapability
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
}

// Export singleton instance
export const storage = new DatabaseStorage();