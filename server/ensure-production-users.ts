import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as schema from '@shared/schema';

// This script ensures Patti and Jim have full Administrator access in production
async function ensureProductionUsers() {
  console.log('🔒 Ensuring production users have full Administrator access...\n');
  
  // Use PRODUCTION_DATABASE_URL for production database
  const productionDbUrl = process.env.PRODUCTION_DATABASE_URL;
  if (!productionDbUrl) {
    console.error('❌ PRODUCTION_DATABASE_URL not found in environment variables');
    process.exit(1);
  }
  
  console.log('📊 Connecting to production database...');
  const sql = neon(productionDbUrl);
  const db = drizzle(sql, { schema });
  
  // Define users to ensure exist with full access
  const usersToEnsure = [
    {
      username: 'patti',
      email: 'patti@planettogether.com',
      firstName: 'Patti',
      lastName: 'Admin',
      password: 'password123',
      jobTitle: 'System Administrator',
      department: 'IT'
    },
    {
      username: 'Jim',
      email: 'jim@planettogether.com', 
      firstName: 'Jim',
      lastName: 'Admin',
      password: 'planettogether',
      jobTitle: 'System Administrator',
      department: 'IT'
    },
    {
      username: 'admin',
      email: 'admin@planettogether.com',
      firstName: 'Admin',
      lastName: 'User',
      password: 'admin123',
      jobTitle: 'System Administrator',
      department: 'IT'
    }
  ];
  
  try {
    // First, ensure Administrator role exists
    console.log('\n🔍 Checking Administrator role...');
    const [adminRole] = await db.select()
      .from(schema.roles)
      .where(eq(schema.roles.name, 'Administrator'))
      .limit(1);
    
    let roleId: number;
    if (!adminRole) {
      console.log('⚠️  Administrator role not found, creating...');
      const [newRole] = await db.insert(schema.roles)
        .values({
          name: 'Administrator',
          description: 'Full system access with all permissions',
          isActive: true,
          isSystemRole: true
        })
        .returning();
      roleId = newRole.id;
      console.log('✅ Administrator role created with ID:', roleId);
    } else {
      roleId = adminRole.id;
      console.log('✅ Administrator role exists with ID:', roleId);
    }
    
    // Process each user
    for (const userData of usersToEnsure) {
      console.log(`\n👤 Processing user: ${userData.username}`);
      
      // Check if user exists
      const [existingUser] = await db.select()
        .from(schema.users)
        .where(eq(schema.users.username, userData.username))
        .limit(1);
      
      let userId: number;
      
      if (!existingUser) {
        // Create user
        console.log(`  ⚠️  User ${userData.username} not found, creating...`);
        const passwordHash = await bcrypt.hash(userData.password, 10);
        
        const [newUser] = await db.insert(schema.users)
          .values({
            username: userData.username,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            passwordHash: passwordHash,
            isActive: true,
            activeRoleId: roleId,
            jobTitle: userData.jobTitle,
            department: userData.department
          })
          .returning();
        
        userId = newUser.id;
        console.log(`  ✅ User ${userData.username} created with ID:`, userId);
      } else {
        userId = existingUser.id;
        
        // Update user to ensure they're active with Administrator role
        const passwordHash = await bcrypt.hash(userData.password, 10);
        await db.update(schema.users)
          .set({
            passwordHash: passwordHash,
            isActive: true,
            activeRoleId: roleId,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            jobTitle: userData.jobTitle,
            department: userData.department
          })
          .where(eq(schema.users.id, userId));
        
        console.log(`  ✅ User ${userData.username} updated with Administrator role`);
      }
      
      // Ensure user has Administrator role assignment
      const [existingUserRole] = await db.select()
        .from(schema.userRoles)
        .where(and(
          eq(schema.userRoles.userId, userId),
          eq(schema.userRoles.roleId, roleId)
        ))
        .limit(1);
      
      if (!existingUserRole) {
        await db.insert(schema.userRoles)
          .values({
            userId: userId,
            roleId: roleId,
            assignedBy: userId
          });
        console.log(`  ✅ Administrator role assigned to ${userData.username}`);
      } else {
        console.log(`  ✅ ${userData.username} already has Administrator role`);
      }
    }
    
    // Ensure all permissions exist for Administrator role
    console.log('\n🔓 Ensuring Administrator role has all permissions...');
    
    // Get all permissions
    const allPermissions = await db.select()
      .from(schema.permissions);
    
    console.log(`  Found ${allPermissions.length} total permissions in system`);
    
    // Get existing role permissions
    const existingRolePermissions = await db.select()
      .from(schema.rolePermissions)
      .where(eq(schema.rolePermissions.roleId, roleId));
    
    const existingPermissionIds = new Set(existingRolePermissions.map(rp => rp.permissionId));
    
    // Add missing permissions
    let addedCount = 0;
    for (const permission of allPermissions) {
      if (!existingPermissionIds.has(permission.id)) {
        await db.insert(schema.rolePermissions)
          .values({
            roleId: roleId,
            permissionId: permission.id
          });
        addedCount++;
      }
    }
    
    if (addedCount > 0) {
      console.log(`  ✅ Added ${addedCount} missing permissions to Administrator role`);
    } else {
      console.log('  ✅ Administrator role already has all permissions');
    }
    
    // Summary
    console.log('\n📊 Production User Summary:');
    console.log('================================');
    for (const userData of usersToEnsure) {
      console.log(`✅ ${userData.username}:`);
      console.log(`   - Username: ${userData.username}`);
      console.log(`   - Password: ${userData.password}`);
      console.log(`   - Email: ${userData.email}`);
      console.log(`   - Role: Administrator (Full Access)`);
    }
    console.log('================================');
    
    console.log('\n🎉 Production users successfully configured with full Administrator access!');
    console.log('   All users can now login to planettogetherai.com with their credentials.');
    
  } catch (error) {
    console.error('❌ Error ensuring production users:', error);
    process.exit(1);
  }
}

// Run the script
ensureProductionUsers().catch(console.error);