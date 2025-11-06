#!/usr/bin/env tsx
/**
 * Production Setup Script: Ensure Patti and Jim have full access
 * This script ensures that users 'patti' and 'Jim' have full Administrator access
 * in the production environment with all permissions.
 * 
 * Run this script in production after deployment:
 * npx tsx scripts/database/ensure-production-users-access.ts
 */

import { db } from '../../server/db';
import { users, roles, userRoles, permissions, rolePermissions } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const PROD_PASSWORD = process.env.PRODUCTION_SETUP_KEY || 'SecureProductionPassword123!';

async function ensureProductionUsersAccess() {
  console.log('🚀 Starting production user access setup...');
  console.log('Environment:', process.env.NODE_ENV || 'development');

  try {
    // Step 1: Get or create Administrator role
    console.log('\n📋 Step 1: Checking Administrator role...');
    let adminRole = await db.select().from(roles)
      .where(eq(roles.name, 'Administrator'))
      .limit(1)
      .then(rows => rows[0]);

    if (!adminRole) {
      console.log('Creating Administrator role...');
      const [newRole] = await db.insert(roles).values({
        name: 'Administrator',
        description: 'Full system access with all permissions',
        isActive: true,
        isSystemRole: true
      }).returning();
      adminRole = newRole;
      console.log('✅ Administrator role created');
    } else {
      console.log('✅ Administrator role already exists');
    }

    // Step 2: Get all permissions
    console.log('\n📋 Step 2: Fetching all permissions...');
    const allPermissions = await db.select().from(permissions);
    console.log(`Found ${allPermissions.length} permissions`);

    // Step 3: Grant all permissions to Administrator role
    console.log('\n📋 Step 3: Granting all permissions to Administrator role...');
    for (const permission of allPermissions) {
      const existingGrant = await db.select()
        .from(rolePermissions)
        .where(and(
          eq(rolePermissions.roleId, adminRole.id),
          eq(rolePermissions.permissionId, permission.id)
        ))
        .limit(1)
        .then(rows => rows[0]);

      if (!existingGrant) {
        await db.insert(rolePermissions).values({
          roleId: adminRole.id,
          permissionId: permission.id,
          grantedAt: new Date()
        });
        console.log(`  ✅ Granted: ${permission.feature} - ${permission.action}`);
      }
    }

    // Step 4: Define production users
    const productionUsers = [
      {
        username: 'patti',
        email: 'patti@planettogether.com',
        firstName: 'Patti',
        lastName: 'Admin',
        jobTitle: 'System Administrator',
        department: 'Administration'
      },
      {
        username: 'Jim',
        email: 'jim@planettogether.com',
        firstName: 'Jim',
        lastName: 'Admin',
        jobTitle: 'System Administrator',
        department: 'Administration'
      }
    ];

    // Step 5: Create or update users
    console.log('\n📋 Step 4: Setting up production users...');
    const passwordHash = await bcrypt.hash(PROD_PASSWORD, 10);

    for (const userData of productionUsers) {
      console.log(`\nProcessing user: ${userData.username}`);
      
      // Check if user exists
      let user = await db.select().from(users)
        .where(eq(users.username, userData.username))
        .limit(1)
        .then(rows => rows[0]);

      if (!user) {
        console.log(`  Creating user ${userData.username}...`);
        const [newUser] = await db.insert(users).values({
          ...userData,
          passwordHash,
          isActive: true,
          activeRoleId: adminRole.id
        }).returning();
        user = newUser;
        console.log(`  ✅ User ${userData.username} created`);
      } else {
        console.log(`  User ${userData.username} already exists, updating...`);
        // Update user to ensure they're active and have correct role
        await db.update(users)
          .set({
            isActive: true,
            activeRoleId: adminRole.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            jobTitle: userData.jobTitle,
            department: userData.department
          })
          .where(eq(users.id, user.id));
        console.log(`  ✅ User ${userData.username} updated`);
      }

      // Step 6: Assign Administrator role to user
      console.log(`  Checking role assignment for ${userData.username}...`);
      const existingRole = await db.select()
        .from(userRoles)
        .where(and(
          eq(userRoles.userId, user.id),
          eq(userRoles.roleId, adminRole.id)
        ))
        .limit(1)
        .then(rows => rows[0]);

      if (!existingRole) {
        await db.insert(userRoles).values({
          userId: user.id,
          roleId: adminRole.id,
          assignedAt: new Date(),
          assignedBy: 1 // System assignment
        });
        console.log(`  ✅ Administrator role assigned to ${userData.username}`);
      } else {
        console.log(`  ✅ ${userData.username} already has Administrator role`);
      }
    }

    // Step 7: Verify access
    console.log('\n📋 Step 5: Verifying user access...');
    for (const userData of productionUsers) {
      const user = await db.select().from(users)
        .where(eq(users.username, userData.username))
        .limit(1)
        .then(rows => rows[0]);

      if (user) {
        const userRoleCount = await db.select()
          .from(userRoles)
          .where(eq(userRoles.userId, user.id))
          .then(rows => rows.length);

        const effectivePermissions = await db.select({
          feature: permissions.feature,
          action: permissions.action
        })
          .from(userRoles)
          .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(userRoles.userId, user.id));

        console.log(`\n✅ ${userData.username}:`);
        console.log(`  - User ID: ${user.id}`);
        console.log(`  - Active: ${user.isActive}`);
        console.log(`  - Roles: ${userRoleCount}`);
        console.log(`  - Permissions: ${effectivePermissions.length}`);
        console.log(`  - Has full access: ${effectivePermissions.length >= allPermissions.length ? 'YES ✅' : 'NO ⚠️'}`);
      }
    }

    console.log('\n');
    console.log('=' .repeat(60));
    console.log('✅ PRODUCTION USER ACCESS SETUP COMPLETE!');
    console.log('=' .repeat(60));
    console.log('\nUsers with full Administrator access:');
    console.log('  • patti');
    console.log('  • Jim');
    console.log('\nTo set custom production password:');
    console.log('  PRODUCTION_SETUP_KEY=YourSecurePassword npx tsx scripts/database/ensure-production-users-access.ts');
    console.log('\nIMPORTANT: Change the default password after first login!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Error setting up production users:', error);
    process.exit(1);
  }
}

// Run the script
ensureProductionUsersAccess()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });