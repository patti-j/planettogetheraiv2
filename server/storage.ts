import { 
  users, roles, permissions, userRoles, rolePermissions, 
  companyOnboarding, userPreferences, recentPages,
  ptPlants, ptResources, ptJobOperations, ptManufacturingOrders,
  schedulingConversations, schedulingMessages,
  type User, type InsertUser, type Role, type Permission, type UserRole, type RolePermission,
  type CompanyOnboarding, type InsertCompanyOnboarding,
  type UserPreferences, type InsertUserPreferences,
  type RecentPage, type InsertRecentPage,
  type PtPlant, type PtResource, type PtJobOperation, type PtManufacturingOrder,
  type SchedulingConversation, type InsertSchedulingConversation,
  type SchedulingMessage, type InsertSchedulingMessage
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
  getResources(): Promise<PtResource[]>;
  getJobOperations(): Promise<PtJobOperation[]>;
  getManufacturingOrders(): Promise<PtManufacturingOrder[]>;
  
  // Advanced PT Data Access  
  getPtResourcesWithDetails(): Promise<any[]>;
  getPtOperationsWithDetails(): Promise<any[]>;
  getPtDependencies(): Promise<any[]>;
  getDiscreteOperations(limit?: number | null): Promise<any[]>;

  // Error logging
  logError(error: any): Promise<void>;
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

  async getResources(): Promise<PtResource[]> {
    try {
      // Use raw SQL to select only columns that actually exist in the database
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
          -- Order resources by brewery operational sequence
          WHEN LOWER(name) LIKE '%mill%' THEN 1
          WHEN LOWER(name) LIKE '%mash%' THEN 2  
          WHEN LOWER(name) LIKE '%lauter%' THEN 3
          WHEN LOWER(name) LIKE '%boil%' OR LOWER(name) LIKE '%kettle%' THEN 4
          WHEN LOWER(name) LIKE '%whirlpool%' THEN 5
          WHEN LOWER(name) LIKE '%cool%' THEN 6
          WHEN LOWER(name) LIKE '%ferment%' THEN 7
          -- Any other resources go after the main process
          ELSE 8
        END, name
        LIMIT 12
      `);
      return result.rows as any[];
    } catch (error) {
      console.error('Error fetching resources:', error);
      return [];
    }
  }

  async getJobOperations(): Promise<PtJobOperation[]> {
    try {
      return await db.select().from(ptJobOperations).orderBy(ptJobOperations.operationName);
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
      const operations = await db.select({
        id: ptJobOperations.id,
        operationId: ptJobOperations.operationId,
        manufacturingOrderId: ptJobOperations.manufacturingOrderId,
        plantId: ptJobOperations.plantId,
        name: ptJobOperations.operationName,
        description: ptJobOperations.description,
        resourceId: ptJobOperations.resourceId,
        startDate: ptJobOperations.startDate,
        endDate: ptJobOperations.endDate,
        duration: sql`COALESCE(${ptJobOperations.duration}, 60)`,
        setupTime: ptJobOperations.setupTime,
        processTime: ptJobOperations.processTime,
        teardownTime: ptJobOperations.teardownTime,
        queueTime: ptJobOperations.queueTime,
        moveTime: ptJobOperations.moveTime,
        waitTime: ptJobOperations.waitTime,
        sequenceNumber: ptJobOperations.sequenceNumber,
        workCenterName: ptJobOperations.workCenterName,
        status: ptJobOperations.status,
        actualStartDate: ptJobOperations.actualStartDate,
        actualEndDate: ptJobOperations.actualEndDate,
        percentDone: sql`CASE
          WHEN ${ptJobOperations.status} = 'completed' THEN 100
          WHEN ${ptJobOperations.status} = 'in_progress' THEN 50
          ELSE 0
        END`,
        priority: sql`CASE
          WHEN ${ptJobOperations.sequenceNumber} = 1 THEN 'Critical'
          WHEN ${ptJobOperations.sequenceNumber} <= 3 THEN 'High'
          WHEN ${ptJobOperations.sequenceNumber} <= 6 THEN 'Medium'
          ELSE 'Low'
        END`,
        isActive: ptJobOperations.isActive
      }).from(ptJobOperations)
        .orderBy(ptJobOperations.startDate, ptJobOperations.operationName);
      return operations;
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

  // Get discrete operations (from PT job operations) using PT Resource Capabilities table
  async getDiscreteOperations(limit?: number | null): Promise<any[]> {
    try {
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
          j.name as job_name,
          j.priority,
          j.need_date_time as due_date,
          -- Use PT Resource Capabilities to match operations to appropriate resources
          CASE 
            WHEN LOWER(jo.name) LIKE '%mill%' THEN (
              SELECT r.resource_id FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 1 AND r.active = true LIMIT 1
            )
            WHEN LOWER(jo.name) LIKE '%mash%' THEN (
              SELECT r.resource_id FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 2 AND r.active = true LIMIT 1
            )
            WHEN LOWER(jo.name) LIKE '%lauter%' THEN (
              SELECT r.resource_id FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 3 AND r.active = true LIMIT 1
            )
            WHEN LOWER(jo.name) LIKE '%boil%' THEN (
              SELECT r.resource_id FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 4 AND r.active = true LIMIT 1
            )
            WHEN LOWER(jo.name) LIKE '%ferment%' THEN (
              SELECT r.resource_id FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 5 AND r.active = true 
              ORDER BY r.id LIMIT 1
            )
            WHEN LOWER(jo.name) LIKE '%lager%' THEN (
              SELECT r.resource_id FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 5 AND r.active = true 
              ORDER BY r.id LIMIT 1
            )
            WHEN LOWER(jo.name) LIKE '%condition%' THEN (
              SELECT r.resource_id FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 6 AND r.active = true 
              ORDER BY r.id LIMIT 1
            )
            WHEN LOWER(jo.name) LIKE '%dry hop%' THEN (
              SELECT r.resource_id FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 7 AND r.active = true 
              ORDER BY r.id LIMIT 1
            )
            WHEN LOWER(jo.name) LIKE '%packag%' THEN (
              SELECT r.resource_id FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 8 AND r.active = true 
              ORDER BY r.id LIMIT 1
            )
            ELSE (
              SELECT r.resource_id FROM ptresources r WHERE r.active = true ORDER BY r.id LIMIT 1
            )
          END as matched_resource_id,
          -- Get the resource name using capabilities
          CASE 
            WHEN LOWER(jo.name) LIKE '%mill%' THEN (
              SELECT r.name FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 1 AND r.active = true LIMIT 1
            )
            WHEN LOWER(jo.name) LIKE '%mash%' THEN (
              SELECT r.name FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 2 AND r.active = true LIMIT 1
            )
            WHEN LOWER(jo.name) LIKE '%lauter%' THEN (
              SELECT r.name FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 3 AND r.active = true LIMIT 1
            )
            WHEN LOWER(jo.name) LIKE '%boil%' THEN (
              SELECT r.name FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 4 AND r.active = true LIMIT 1
            )
            WHEN LOWER(jo.name) LIKE '%ferment%' THEN (
              SELECT r.name FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 5 AND r.active = true 
              ORDER BY r.id LIMIT 1
            )
            WHEN LOWER(jo.name) LIKE '%lager%' THEN (
              SELECT r.name FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 5 AND r.active = true 
              ORDER BY r.id LIMIT 1
            )
            WHEN LOWER(jo.name) LIKE '%condition%' THEN (
              SELECT r.name FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 6 AND r.active = true 
              ORDER BY r.id LIMIT 1
            )
            WHEN LOWER(jo.name) LIKE '%dry hop%' THEN (
              SELECT r.name FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 7 AND r.active = true 
              ORDER BY r.id LIMIT 1
            )
            WHEN LOWER(jo.name) LIKE '%packag%' THEN (
              SELECT r.name FROM ptresources r 
              JOIN ptresourcecapabilities rc ON r.id = rc.resource_id 
              WHERE rc.capability_id = 8 AND r.active = true 
              ORDER BY r.id LIMIT 1
            )
            ELSE (
              SELECT r.name FROM ptresources r WHERE r.active = true ORDER BY r.id LIMIT 1
            )
          END as matched_resource_name
        FROM ptjoboperations jo
        LEFT JOIN ptjobs j ON jo.job_id = j.id
        WHERE jo.scheduled_start IS NOT NULL
        ORDER BY jo.scheduled_start, jo.id
        ${limit ? sql`LIMIT ${limit}` : sql``}
      `;
      
      const result = await db.execute(query);
      
      // Transform the operations for the scheduler with proper resource assignments
      return result.rows.map((op: any) => ({
        id: op.id,
        operationId: op.operation_id,
        jobId: op.job_id,
        name: op.operation_name || 'Operation',
        jobName: op.job_name,
        resourceId: op.matched_resource_id, // Use the intelligently matched resource
        resourceName: op.matched_resource_name, // Include resource name for display
        scheduledStart: op.scheduled_start,
        scheduledEnd: op.scheduled_end,
        priority: op.priority || 5,
        setupTime: op.setup_hours || 0,
        runTime: op.cycle_hrs || 0,
        teardownTime: op.post_processing_hours || 0,
        dueDate: op.due_date,
        percentFinished: op.percent_finished || 0
      }));
    } catch (error) {
      console.error('Error fetching discrete operations:', error);
      return [];
    }
  }

  // Error logging
  async logError(error: any): Promise<void> {
    console.error('System error:', error);
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();