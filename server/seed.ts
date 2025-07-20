import { db } from "./db";
import { capabilities, resources, jobs, operations, users, roles, permissions, userRoles, rolePermissions } from "@shared/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  console.log("Seeding database...");

  // Check if data already exists
  const existingCapabilities = await db.select().from(capabilities).limit(1);
  const existingUsers = await db.select().from(users).limit(1);
  
  if (existingCapabilities.length > 0 && existingUsers.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }
  
  // Skip production data seeding if it already exists but seed user management
  const shouldSeedProduction = existingCapabilities.length === 0;

  if (shouldSeedProduction) {
    // Insert capabilities
    const capabilityData = [
      { name: "CNC Machining", description: "Computer numerical control machining operations" },
      { name: "Welding", description: "Arc welding and metal joining processes" },
      { name: "Assembly", description: "Component assembly and integration" },
      { name: "Quality Control", description: "Inspection and testing procedures" },
      { name: "Packaging", description: "Product packaging and labeling" }
    ];

    await db.insert(capabilities).values(capabilityData);

    // Insert resources
    const resourceData = [
      { name: "CNC-001", type: "Machine", status: "active", capabilities: [1] },
      { name: "CNC-002", type: "Machine", status: "active", capabilities: [1] },
      { name: "Welder-001", type: "Operator", status: "active", capabilities: [2] },
      { name: "Assembly-001", type: "Operator", status: "active", capabilities: [3] },
      { name: "QC-001", type: "Operator", status: "active", capabilities: [4] },
      { name: "Packaging-001", type: "Operator", status: "active", capabilities: [5] }
    ];

    await db.insert(resources).values(resourceData);

    // Insert jobs
    const jobData = [
      { 
        name: "Widget Assembly - Batch A", 
        customer: "Tech Corp", 
        priority: "high", 
        dueDate: new Date("2024-12-31"), 
        status: "active" 
      },
      { 
        name: "Motor Housing Production", 
        customer: "AutoParts Inc", 
        priority: "medium", 
        dueDate: new Date("2024-12-25"), 
        status: "active" 
      }
    ];

    await db.insert(jobs).values(jobData);

    // Insert operations
    const operationData = [
      {
        jobId: 1,
        name: "CNC Machining",
        description: "Machine widget base components",
        duration: 4,
        status: "active",
        requiredCapabilities: [1],
        order: 1,
        assignedResourceId: 1
      },
      {
        jobId: 1,
        name: "Welding",
        description: "Weld component joints",
        duration: 2,
        status: "pending",
        requiredCapabilities: [2],
        order: 2,
        assignedResourceId: 3
      },
      {
        jobId: 1,
        name: "Assembly",
        description: "Final widget assembly",
        duration: 3,
        status: "pending",
        requiredCapabilities: [3],
        order: 3,
        assignedResourceId: 4
      },
      {
        jobId: 2,
        name: "Housing Machining",
        description: "Machine motor housing",
        duration: 6,
        status: "active",
        requiredCapabilities: [1],
        order: 1,
        assignedResourceId: 2
      },
      {
        jobId: 2,
        name: "Quality Check",
        description: "Inspect housing dimensions",
        duration: 1,
        status: "pending",
        requiredCapabilities: [4],
        order: 2,
        assignedResourceId: 5
      }
    ];

    await db.insert(operations).values(operationData);
  }

  // Seed User Management System (only if users don't exist)
  if (existingUsers.length === 0) {
    // Insert default roles
  const roleData = [
    { 
      name: "Director", 
      description: "Executive leadership with access to strategic planning and business goals" 
    },
    { 
      name: "Plant Manager", 
      description: "Factory operations oversight with capacity planning and strategic resource management" 
    },
    { 
      name: "Production Scheduler", 
      description: "Production planning, scheduling optimization, and resource allocation" 
    },
    { 
      name: "IT Administrator", 
      description: "System management, user administration, and technical infrastructure" 
    },
    {
      name: "Systems Manager",
      description: "IT systems oversight, security management, and infrastructure monitoring"
    }
  ];

  const insertedRoles = await db.insert(roles).values(roleData).onConflictDoUpdate({
    target: roles.name,
    set: {
      description: sql`excluded.description`,
      isActive: sql`excluded.is_active`,
    }
  }).returning();

  // Insert permissions for different features
  const permissionData = [
    // Business Goals (Directors)
    { name: "business-goals-view", feature: "business-goals", action: "view", description: "View business goals and strategic objectives" },
    { name: "business-goals-create", feature: "business-goals", action: "create", description: "Create new business goals" },
    { name: "business-goals-edit", feature: "business-goals", action: "edit", description: "Edit existing business goals" },
    { name: "business-goals-delete", feature: "business-goals", action: "delete", description: "Delete business goals" },
    
    // Capacity Planning (Plant Managers)
    { name: "capacity-planning-view", feature: "capacity-planning", action: "view", description: "View capacity planning scenarios" },
    { name: "capacity-planning-create", feature: "capacity-planning", action: "create", description: "Create capacity planning scenarios" },
    { name: "capacity-planning-edit", feature: "capacity-planning", action: "edit", description: "Edit capacity planning scenarios" },
    { name: "capacity-planning-delete", feature: "capacity-planning", action: "delete", description: "Delete capacity planning scenarios" },
    
    // Production Scheduling (Schedulers)
    { name: "production-scheduling-view", feature: "production-scheduling", action: "view", description: "View production schedules and Gantt charts" },
    { name: "production-scheduling-create", feature: "production-scheduling", action: "create", description: "Create production jobs and operations" },
    { name: "production-scheduling-edit", feature: "production-scheduling", action: "edit", description: "Edit production schedules and assignments" },
    { name: "production-scheduling-delete", feature: "production-scheduling", action: "delete", description: "Delete production jobs and operations" },
    
    // Systems Management (IT Administrators & Systems Managers)
    { name: "systems-management-view", feature: "systems-management", action: "view", description: "View system health and configurations" },
    { name: "systems-management-create", feature: "systems-management", action: "create", description: "Create system configurations" },
    { name: "systems-management-edit", feature: "systems-management", action: "edit", description: "Edit system settings and configurations" },
    { name: "systems-management-delete", feature: "systems-management", action: "delete", description: "Delete system configurations" },
    
    // User Management (IT Administrators)
    { name: "user-management-view", feature: "user-management", action: "view", description: "View users and role assignments" },
    { name: "user-management-create", feature: "user-management", action: "create", description: "Create new users and assign roles" },
    { name: "user-management-edit", feature: "user-management", action: "edit", description: "Edit user profiles and role assignments" },
    { name: "user-management-delete", feature: "user-management", action: "delete", description: "Delete users and revoke access" },
    
    // Reports and Analytics (All roles can view, create varies)
    { name: "reports-view", feature: "reports", action: "view", description: "View reports and analytics dashboards" },
    { name: "reports-create", feature: "reports", action: "create", description: "Create custom reports and analytics" },
    { name: "reports-edit", feature: "reports", action: "edit", description: "Edit report configurations" },
    { name: "reports-delete", feature: "reports", action: "delete", description: "Delete custom reports" }
  ];

  const insertedPermissions = await db.insert(permissions).values(permissionData).onConflictDoUpdate({
    target: permissions.name,
    set: {
      feature: sql`excluded.feature`,
      action: sql`excluded.action`,
      description: sql`excluded.description`,
    }
  }).returning();

  // Assign permissions to roles
  const rolePermissionData = [
    // Director permissions (Business Goals + Reports)
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "business-goals" && p.action === "view")!.id },
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "business-goals" && p.action === "create")!.id },
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "business-goals" && p.action === "edit")!.id },
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "business-goals" && p.action === "delete")!.id },
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "view")!.id },
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "create")!.id },
    
    // Plant Manager permissions (Capacity Planning + Production Scheduling + Reports)
    { roleId: insertedRoles[1].id, permissionId: insertedPermissions.find(p => p.feature === "capacity-planning" && p.action === "view")!.id },
    { roleId: insertedRoles[1].id, permissionId: insertedPermissions.find(p => p.feature === "capacity-planning" && p.action === "create")!.id },
    { roleId: insertedRoles[1].id, permissionId: insertedPermissions.find(p => p.feature === "capacity-planning" && p.action === "edit")!.id },
    { roleId: insertedRoles[1].id, permissionId: insertedPermissions.find(p => p.feature === "capacity-planning" && p.action === "delete")!.id },
    { roleId: insertedRoles[1].id, permissionId: insertedPermissions.find(p => p.feature === "production-scheduling" && p.action === "view")!.id },
    { roleId: insertedRoles[1].id, permissionId: insertedPermissions.find(p => p.feature === "production-scheduling" && p.action === "edit")!.id },
    { roleId: insertedRoles[1].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "view")!.id },
    { roleId: insertedRoles[1].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "create")!.id },
    
    // Production Scheduler permissions (Production Scheduling + Reports)
    { roleId: insertedRoles[2].id, permissionId: insertedPermissions.find(p => p.feature === "production-scheduling" && p.action === "view")!.id },
    { roleId: insertedRoles[2].id, permissionId: insertedPermissions.find(p => p.feature === "production-scheduling" && p.action === "create")!.id },
    { roleId: insertedRoles[2].id, permissionId: insertedPermissions.find(p => p.feature === "production-scheduling" && p.action === "edit")!.id },
    { roleId: insertedRoles[2].id, permissionId: insertedPermissions.find(p => p.feature === "production-scheduling" && p.action === "delete")!.id },
    { roleId: insertedRoles[2].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "view")!.id },
    { roleId: insertedRoles[2].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "create")!.id },
    
    // IT Administrator permissions (User Management + Systems Management + Reports)
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "user-management" && p.action === "view")!.id },
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "user-management" && p.action === "create")!.id },
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "user-management" && p.action === "edit")!.id },
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "user-management" && p.action === "delete")!.id },
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "view")!.id },
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "create")!.id },
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "edit")!.id },
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "delete")!.id },
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "view")!.id },
    
    // Systems Manager permissions (Systems Management + Reports)
    { roleId: insertedRoles[4].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "view")!.id },
    { roleId: insertedRoles[4].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "create")!.id },
    { roleId: insertedRoles[4].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "edit")!.id },
    { roleId: insertedRoles[4].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "delete")!.id },
    { roleId: insertedRoles[4].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "view")!.id }
  ];

  await db.insert(rolePermissions).values(rolePermissionData).onConflictDoNothing();

  // Create default users with hashed passwords
  const hashedPassword = await bcrypt.hash("password123", 12);
  
  const userData = [
    {
      username: "director",
      email: "director@planettogether.com",
      firstName: "Sarah",
      lastName: "Johnson",
      passwordHash: hashedPassword,
      isActive: true
    },
    {
      username: "plant_manager",
      email: "manager@planettogether.com",
      firstName: "Mike",
      lastName: "Chen",
      passwordHash: hashedPassword,
      isActive: true
    },
    {
      username: "scheduler",
      email: "scheduler@planettogether.com",
      firstName: "Emily",
      lastName: "Rodriguez",
      passwordHash: hashedPassword,
      isActive: true
    },
    {
      username: "admin",
      email: "admin@planettogether.com",
      firstName: "David",
      lastName: "Kim",
      passwordHash: hashedPassword,
      isActive: true
    },
    {
      username: "sysmanager",
      email: "systems@planettogether.com",
      firstName: "Alex",
      lastName: "Thompson",
      passwordHash: hashedPassword,
      isActive: true
    }
  ];

  const insertedUsers = await db.insert(users).values(userData).onConflictDoUpdate({
    target: users.username,
    set: {
      email: sql`excluded.email`,
      firstName: sql`excluded.first_name`,
      lastName: sql`excluded.last_name`,
      passwordHash: sql`excluded.password_hash`,
      isActive: sql`excluded.is_active`,
    }
  }).returning();

  // Assign roles to users
  const userRoleData = [
    { userId: insertedUsers[0].id, roleId: insertedRoles[0].id }, // Director
    { userId: insertedUsers[1].id, roleId: insertedRoles[1].id }, // Plant Manager
    { userId: insertedUsers[2].id, roleId: insertedRoles[2].id }, // Production Scheduler
    { userId: insertedUsers[3].id, roleId: insertedRoles[3].id }, // IT Administrator
    { userId: insertedUsers[4].id, roleId: insertedRoles[4].id }, // Systems Manager
  ];

  await db.insert(userRoles).values(userRoleData).onConflictDoNothing();

    console.log("User management system seeded!");
    console.log("Default users created:");
    console.log("- director / password123 (Business Goals access)");
    console.log("- plant_manager / password123 (Capacity Planning + Production access)");
    console.log("- scheduler / password123 (Production Scheduling access)");
    console.log("- admin / password123 (User Management + Systems access)");
    console.log("- sysmanager / password123 (Systems Management access)");
  }

  console.log("Database seeding completed!");
}