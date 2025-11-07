#!/usr/bin/env tsx
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../shared/schema-simple';
import * as alertsSchema from '../shared/alerts-schema';
import * as timeTrackingSchema from '../shared/time-tracking-schema';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';

// Force production environment
process.env.NODE_ENV = 'production';

async function setupProductionDatabase() {
  console.log('🚀 Starting production database setup...');
  
  // Get production database URL
  const productionDbUrl = process.env.PRODUCTION_DATABASE_URL;
  if (!productionDbUrl) {
    throw new Error('PRODUCTION_DATABASE_URL environment variable is required');
  }

  console.log('📦 Connecting to production database...');
  
  // Create connection
  const sql_connection = neon(productionDbUrl);
  const db = drizzle(sql_connection, {
    schema: { ...schema, ...alertsSchema, ...timeTrackingSchema }
  });

  try {
    console.log('🔧 Creating initial tables and data...');
    
    // Create Administrator role
    console.log('Creating Administrator role...');
    const adminRole = await db.insert(schema.roles).values({
      name: 'Administrator',
      description: 'Full system access',
      isActive: true,
      isSystemRole: true,
    }).onConflictDoNothing().returning();
    
    const roleId = adminRole[0]?.id || 1;
    console.log(`Administrator role ID: ${roleId}`);
    
    // Create users with hashed passwords
    console.log('Creating users...');
    const users = [
      {
        username: 'patti',
        email: 'patti@planettogether.com',
        firstName: 'Patti',
        lastName: 'User',
        passwordHash: await bcrypt.hash('password123', 10),
        isActive: true,
        activeRoleId: roleId,
      },
      {
        username: 'Jim',
        email: 'jim@planettogether.com',
        firstName: 'Jim',
        lastName: 'User',
        passwordHash: await bcrypt.hash('planettogether', 10),
        isActive: true,
        activeRoleId: roleId,
      },
      {
        username: 'admin',
        email: 'admin@planettogether.com',
        firstName: 'Admin',
        lastName: 'User',
        passwordHash: await bcrypt.hash('admin123', 10),
        isActive: true,
        activeRoleId: roleId,
      }
    ];

    for (const user of users) {
      const existingUser = await db.select().from(schema.users).where(
        sql`username = ${user.username}`
      ).limit(1);

      if (existingUser.length === 0) {
        const newUser = await db.insert(schema.users).values(user).returning();
        console.log(`Created user: ${user.username} (ID: ${newUser[0].id})`);
        
        // Assign role to user
        await db.insert(schema.userRoles).values({
          userId: newUser[0].id,
          roleId: roleId,
        }).onConflictDoNothing();
        console.log(`Assigned Administrator role to ${user.username}`);
      } else {
        console.log(`User ${user.username} already exists`);
      }
    }
    
    // Create basic permissions for common features
    console.log('Creating permissions...');
    const features = ['dashboard', 'production', 'inventory', 'reports', 'settings'];
    const actions = ['view', 'create', 'update', 'delete', 'execute', 'export'];
    
    for (const feature of features) {
      for (const action of actions) {
        const permission = await db.insert(schema.permissions).values({
          name: `${feature}:${action}`,
          feature,
          action,
          description: `${action} ${feature}`
        }).onConflictDoNothing().returning();
        
        if (permission[0]) {
          // Grant all permissions to Administrator role
          await db.insert(schema.rolePermissions).values({
            roleId: roleId,
            permissionId: permission[0].id
          }).onConflictDoNothing();
        }
      }
    }
    console.log('Permissions created and assigned to Administrator role');
    
    // Test the connection
    console.log('Testing database connection...');
    const result = await db.execute(sql`SELECT COUNT(*) FROM users`);
    console.log(`Total users in production database: ${result[0].count}`);
    
    console.log('✅ Production database setup complete!');
    console.log('Users created:');
    console.log('  - patti (password: password123)');
    console.log('  - Jim (password: planettogether)');  
    console.log('  - admin (password: admin123)');
    
  } catch (error) {
    console.error('❌ Error setting up production database:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the setup
setupProductionDatabase().catch(console.error);