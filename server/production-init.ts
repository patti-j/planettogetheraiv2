import { db } from './db';
import { users, roles, permissions, userRoles, rolePermissions } from '@shared/schema';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';

/**
 * Production initialization script
 * Ensures Patti and Jim have full Administrator access
 * This runs automatically when the production server starts
 */
export async function ensureProductionUsersAccess() {
  try {
    console.log('🔧 Ensuring production users have proper access...');
    
    // Check if we're in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('⚠️ Not in production environment, skipping production user setup');
      return;
    }

    // Ensure Administrator role exists
    const adminRole = await db.select().from(roles)
      .where(sql`${roles.name} = 'Administrator'`)
      .limit(1);
    
    let adminRoleId = 1;
    if (adminRole.length === 0) {
      await db.insert(roles).values({
        id: 1,
        name: 'Administrator',
        description: 'Full system administrator with all permissions',
        isActive: true,
        isSystemRole: true
      }).onConflictDoNothing();
    }

    // Hash password for users
    const passwordHash = await bcrypt.hash('password123', 10);
    
    // Ensure Patti exists with Administrator role
    const pattiExists = await db.select().from(users)
      .where(sql`${users.username} = 'patti'`)
      .limit(1);
    
    if (pattiExists.length === 0) {
      await db.insert(users).values({
        username: 'patti',
        email: 'patti@planettogether.com',
        firstName: 'Patti',
        lastName: 'User',
        passwordHash,
        isActive: true,
        activeRoleId: adminRoleId
      });
      console.log('✅ Created user: patti');
    } else {
      // Update to ensure Administrator role
      await db.update(users)
        .set({ activeRoleId: adminRoleId, isActive: true })
        .where(sql`${users.username} = 'patti'`);
      console.log('✅ Updated user: patti');
    }
    
    // Ensure Jim exists with Administrator role
    const jimExists = await db.select().from(users)
      .where(sql`${users.username} = 'Jim'`)
      .limit(1);
    
    if (jimExists.length === 0) {
      await db.insert(users).values({
        username: 'Jim',
        email: 'jim@planettogether.com',
        firstName: 'Jim',
        lastName: 'User',
        passwordHash,
        isActive: true,
        activeRoleId: adminRoleId
      });
      console.log('✅ Created user: Jim');
    } else {
      // Update to ensure Administrator role
      await db.update(users)
        .set({ activeRoleId: adminRoleId, isActive: true })
        .where(sql`${users.username} = 'Jim'`);
      console.log('✅ Updated user: Jim');
    }
    
    // Get user IDs
    const [patti, jim] = await Promise.all([
      db.select().from(users).where(sql`${users.username} = 'patti'`).limit(1),
      db.select().from(users).where(sql`${users.username} = 'Jim'`).limit(1)
    ]);
    
    if (patti[0] && jim[0]) {
      // Ensure both users have Administrator role assigned
      const userRoleAssignments = [
        { userId: patti[0].id, roleId: adminRoleId, assignedBy: 1 },
        { userId: jim[0].id, roleId: adminRoleId, assignedBy: 1 }
      ];
      
      for (const assignment of userRoleAssignments) {
        await db.insert(userRoles)
          .values(assignment)
          .onConflictDoNothing();
      }
      
      console.log('✅ Ensured Administrator role assignments for Patti and Jim');
    }
    
    // Ensure all required permissions exist
    const schedulePermissions = [
      { name: 'schedule.view', feature: 'schedule', action: 'view', description: 'View production schedule' },
      { name: 'schedule.create', feature: 'schedule', action: 'create', description: 'Create production schedules' },
      { name: 'schedule.update', feature: 'schedule', action: 'update', description: 'Update production schedules' },
      { name: 'schedule.delete', feature: 'schedule', action: 'delete', description: 'Delete production schedules' },
      { name: 'schedule.execute', feature: 'schedule', action: 'execute', description: 'Execute scheduling algorithms' }
    ];
    
    for (const perm of schedulePermissions) {
      await db.insert(permissions)
        .values(perm)
        .onConflictDoNothing();
    }
    
    // Grant all permissions to Administrator role
    const allPermissions = await db.select().from(permissions);
    for (const perm of allPermissions) {
      await db.insert(rolePermissions)
        .values({
          roleId: adminRoleId,
          permissionId: perm.id
        })
        .onConflictDoNothing();
    }
    
    console.log('✅ Production users Patti and Jim have been configured with full Administrator access');
    console.log('📋 Login credentials:');
    console.log('   - Username: patti | Password: password123');
    console.log('   - Username: Jim | Password: password123');
    
  } catch (error) {
    console.error('❌ Error setting up production users:', error);
    // Don't throw - allow server to start even if user setup fails
  }
}