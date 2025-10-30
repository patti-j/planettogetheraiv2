import bcryptjs from "bcryptjs";
import { db } from "./db";
import { users, roles, permissions, userRoles, rolePermissions } from "@shared/schema";
import { eq, and } from "drizzle-orm";

async function setupPouriaAdmin() {
  try {
    console.log("🚀 Starting Pouria admin user setup...");

    // 1. Hash the password
    const passwordHash = await bcryptjs.hash("4920", 10);
    console.log("✅ Password hashed successfully");

    // 2. Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.username, "Pouria"))
      .limit(1);

    let userId: number;
    
    if (existingUser.length > 0) {
      // Update existing user's password
      console.log("🔄 User 'Pouria' already exists, updating password...");
      await db.update(users)
        .set({ 
          passwordHash,
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(users.username, "Pouria"));
      userId = existingUser[0].id;
    } else {
      // Create new user
      console.log("➕ Creating new user 'Pouria'...");
      const [newUser] = await db.insert(users)
        .values({
          username: "Pouria",
          email: "pouria@admin.com",
          firstName: "Pouria",
          lastName: "Admin",
          passwordHash,
          isActive: true,
          jobTitle: "System Administrator",
          department: "IT",
        })
        .returning();
      userId = newUser.id;
      console.log(`✅ User created with ID: ${userId}`);
    }

    // 3. Create or get Administrator role
    let adminRole = await db.select()
      .from(roles)
      .where(eq(roles.name, "Administrator"))
      .limit(1);

    let roleId: number;
    
    if (adminRole.length === 0) {
      console.log("➕ Creating Administrator role...");
      const [newRole] = await db.insert(roles)
        .values({
          name: "Administrator",
          description: "Full system access with all permissions",
          isActive: true,
          isSystemRole: true
        })
        .returning();
      roleId = newRole.id;
      console.log(`✅ Administrator role created with ID: ${roleId}`);
    } else {
      roleId = adminRole[0].id;
      console.log(`✔️ Administrator role already exists with ID: ${roleId}`);
    }

    // 4. Get all existing permissions
    const allPermissions = await db.select().from(permissions);
    
    if (allPermissions.length === 0) {
      // Create essential permissions if none exist
      console.log("➕ Creating essential permissions...");
      const permissionsToCreate = [
        // User management
        { name: "users.view", feature: "users", action: "view", description: "View users" },
        { name: "users.create", feature: "users", action: "create", description: "Create users" },
        { name: "users.edit", feature: "users", action: "edit", description: "Edit users" },
        { name: "users.delete", feature: "users", action: "delete", description: "Delete users" },
        
        // Role management
        { name: "roles.view", feature: "roles", action: "view", description: "View roles" },
        { name: "roles.create", feature: "roles", action: "create", description: "Create roles" },
        { name: "roles.edit", feature: "roles", action: "edit", description: "Edit roles" },
        { name: "roles.delete", feature: "roles", action: "delete", description: "Delete roles" },
        
        // Dashboard management
        { name: "dashboards.view", feature: "dashboards", action: "view", description: "View dashboards" },
        { name: "dashboards.create", feature: "dashboards", action: "create", description: "Create dashboards" },
        { name: "dashboards.edit", feature: "dashboards", action: "edit", description: "Edit dashboards" },
        { name: "dashboards.delete", feature: "dashboards", action: "delete", description: "Delete dashboards" },
        
        // System administration
        { name: "system.admin", feature: "system", action: "admin", description: "Full system administration" },
        { name: "system.config", feature: "system", action: "config", description: "System configuration" },
        { name: "system.monitoring", feature: "system", action: "monitoring", description: "System monitoring" },
        
        // API access
        { name: "api.full", feature: "api", action: "full", description: "Full API access" },
        
        // Data management
        { name: "data.view", feature: "data", action: "view", description: "View all data" },
        { name: "data.edit", feature: "data", action: "edit", description: "Edit all data" },
        { name: "data.delete", feature: "data", action: "delete", description: "Delete data" },
        { name: "data.export", feature: "data", action: "export", description: "Export data" },
      ];
      
      const createdPermissions = await db.insert(permissions)
        .values(permissionsToCreate)
        .returning();
      
      console.log(`✅ Created ${createdPermissions.length} essential permissions`);
      allPermissions.push(...createdPermissions);
    }

    // 5. Assign all permissions to the Administrator role
    console.log(`🔐 Assigning ${allPermissions.length} permissions to Administrator role...`);
    
    for (const permission of allPermissions) {
      // Check if permission is already assigned
      const existing = await db.select()
        .from(rolePermissions)
        .where(and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permission.id)
        ))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(rolePermissions)
          .values({
            roleId,
            permissionId: permission.id
          });
      }
    }
    console.log("✅ All permissions assigned to Administrator role");

    // 6. Assign Administrator role to Pouria
    const existingUserRole = await db.select()
      .from(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, roleId)
      ))
      .limit(1);
    
    if (existingUserRole.length === 0) {
      console.log("👤 Assigning Administrator role to user Pouria...");
      await db.insert(userRoles)
        .values({
          userId,
          roleId,
          assignedBy: userId // Self-assigned
        });
      console.log("✅ Administrator role assigned to Pouria");
    } else {
      console.log("✔️ Pouria already has Administrator role");
    }

    // 7. Set the active role for the user
    await db.update(users)
      .set({ 
        activeRoleId: roleId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    console.log("\n🎉 SUCCESS! Pouria admin setup completed!");
    console.log("📝 Login credentials:");
    console.log("   Username: Pouria");
    console.log("   Password: 4920");
    console.log("   Role: Administrator (Full permissions)");
    console.log("\n✨ The user now has full system access with all permissions!");

  } catch (error) {
    console.error("❌ Error setting up Pouria admin:", error);
    process.exit(1);
  }
}

// Run the setup
setupPouriaAdmin()
  .then(() => {
    console.log("\n✅ Setup script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Setup script failed:", error);
    process.exit(1);
  });