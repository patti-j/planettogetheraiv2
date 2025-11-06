import bcryptjs from 'bcryptjs';
import { db } from './db';
import { users, roles, userRoles, permissions, rolePermissions } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

export async function fixProductionPermissions() {
  // Only run in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔷 Skipping production permissions fix (not in production)');
    return;
  }

  try {
    console.log('🔧 Fixing production permissions for schedule access...');
    
    // Get Administrator role
    const adminRole = await db.select().from(roles)
      .where(eq(roles.name, 'Administrator'))
      .limit(1);
    
    if (adminRole.length === 0) {
      console.error('❌ Administrator role not found!');
      return;
    }
    
    // Get admin user for grantedBy
    const adminUser = await db.select().from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);
    
    const grantedById = adminUser.length > 0 ? adminUser[0].id : 1;
    
    // Ensure specific schedule permissions exist
    const schedulePermissions = [
      { feature: 'schedule', action: 'view', description: 'View production schedules' },
      { feature: 'schedule', action: 'edit', description: 'Edit production schedules' },
      { feature: 'schedule', action: 'manage', description: 'Manage production schedules' },
      { feature: 'production_scheduling', action: 'view', description: 'View production scheduling' },
      { feature: 'production_scheduling', action: 'edit', description: 'Edit production scheduling' },
      { feature: 'production_scheduling', action: 'manage', description: 'Manage production scheduling' }
    ];
    
    for (const perm of schedulePermissions) {
      try {
        // Check if permission exists
        let permission = await db.select().from(permissions)
          .where(and(
            eq(permissions.feature, perm.feature),
            eq(permissions.action, perm.action)
          ))
          .limit(1);
        
        if (permission.length === 0) {
          // Create permission
          console.log(`📝 Creating permission: ${perm.feature}:${perm.action}`);
          const [newPermission] = await db.insert(permissions).values({
            name: `${perm.feature}_${perm.action}`,
            feature: perm.feature,
            action: perm.action,
            description: perm.description
          }).returning();
          permission = [newPermission];
        }
        
        // Ensure permission is granted to Administrator role
        const existingGrant = await db.select().from(rolePermissions)
          .where(and(
            eq(rolePermissions.roleId, adminRole[0].id),
            eq(rolePermissions.permissionId, permission[0].id)
          ))
          .limit(1);
        
        if (existingGrant.length === 0) {
          console.log(`✅ Granting ${perm.feature}:${perm.action} to Administrator role`);
          await db.insert(rolePermissions).values({
            roleId: adminRole[0].id,
            permissionId: permission[0].id
          }).onConflictDoNothing();
        }
      } catch (error) {
        console.error(`❌ Error with permission ${perm.feature}:${perm.action}:`, error);
      }
    }
    
    // Ensure Patti and Jim have Administrator role
    const criticalUsers = ['patti', 'Jim'];
    
    for (const username of criticalUsers) {
      try {
        const user = await db.select().from(users)
          .where(eq(users.username, username))
          .limit(1);
        
        if (user.length > 0) {
          // Check if user has Administrator role
          const hasRole = await db.select().from(userRoles)
            .where(and(
              eq(userRoles.userId, user[0].id),
              eq(userRoles.roleId, adminRole[0].id)
            ))
            .limit(1);
          
          if (hasRole.length === 0) {
            console.log(`✅ Assigning Administrator role to ${username}`);
            await db.insert(userRoles).values({
              userId: user[0].id,
              roleId: adminRole[0].id
            }).onConflictDoNothing();
          } else {
            console.log(`✅ ${username} already has Administrator role`);
          }
        } else {
          console.log(`⚠️ User ${username} not found in database`);
        }
      } catch (error) {
        console.error(`❌ Error with user ${username}:`, error);
      }
    }
    
    console.log('✅ Production permissions fixed successfully');
    
  } catch (error) {
    console.error('❌ Error fixing production permissions:', error);
    // Don't throw - we don't want to crash the server
  }
}