import { db } from './db';
import * as schema from '@shared/schema';
import * as bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Production Database Seed Script
 * This script initializes essential data in the production database
 * It's designed to be idempotent - safe to run multiple times
 */

console.log('🌱 Starting production database seeding...\n');

async function seedPermissions() {
  console.log('📋 Checking permissions...');
  
  const existingPermissions = await db.select().from(schema.permissions);
  
  if (existingPermissions.length > 0) {
    console.log('   ✅ Permissions already exist');
    return;
  }
  
  const permissions = [
    // Production Schedule
    { name: 'View Production Schedule', feature: 'production_schedule', action: 'view' },
    { name: 'Edit Production Schedule', feature: 'production_schedule', action: 'edit' },
    { name: 'Delete Production Schedule', feature: 'production_schedule', action: 'delete' },
    { name: 'Export Production Schedule', feature: 'production_schedule', action: 'export' },
    
    // Inventory
    { name: 'View Inventory', feature: 'inventory', action: 'view' },
    { name: 'Edit Inventory', feature: 'inventory', action: 'edit' },
    { name: 'Delete Inventory', feature: 'inventory', action: 'delete' },
    
    // Labor Planning
    { name: 'View Labor Planning', feature: 'labor_planning', action: 'view' },
    { name: 'Edit Labor Planning', feature: 'labor_planning', action: 'edit' },
    
    // Production Planning
    { name: 'View Production Planning', feature: 'production_planning', action: 'view' },
    { name: 'Edit Production Planning', feature: 'production_planning', action: 'edit' },
    
    // Administration
    { name: 'Manage Users', feature: 'admin', action: 'manage_users' },
    { name: 'Manage Roles', feature: 'admin', action: 'manage_roles' },
    { name: 'View System Settings', feature: 'admin', action: 'view_settings' },
    { name: 'Edit System Settings', feature: 'admin', action: 'edit_settings' },
    
    // Reports
    { name: 'View Reports', feature: 'reports', action: 'view' },
    { name: 'Export Reports', feature: 'reports', action: 'export' },
    
    // AI Features
    { name: 'Use AI Features', feature: 'ai', action: 'use' },
    { name: 'Configure AI', feature: 'ai', action: 'configure' },
  ];
  
  await db.insert(schema.permissions).values(permissions);
  console.log(`   ✅ Created ${permissions.length} permissions`);
}

async function seedRoles() {
  console.log('👥 Checking roles...');
  
  const existingRoles = await db.select().from(schema.roles);
  
  if (existingRoles.length > 0) {
    console.log('   ✅ Roles already exist');
    return existingRoles;
  }
  
  const roles = [
    {
      name: 'Administrator',
      description: 'Full system access',
      isActive: true,
      isSystemRole: true
    },
    {
      name: 'Production Manager',
      description: 'Manage production schedules and operations',
      isActive: true,
      isSystemRole: true
    },
    {
      name: 'Planner',
      description: 'Create and modify production plans',
      isActive: true,
      isSystemRole: true
    },
    {
      name: 'Viewer',
      description: 'Read-only access to system',
      isActive: true,
      isSystemRole: true
    }
  ];
  
  const insertedRoles = await db.insert(schema.roles).values(roles).returning();
  console.log(`   ✅ Created ${insertedRoles.length} roles`);
  
  // Assign permissions to Administrator role
  const adminRole = insertedRoles.find(r => r.name === 'Administrator');
  if (adminRole) {
    const allPermissions = await db.select().from(schema.permissions);
    const rolePermissions = allPermissions.map(p => ({
      roleId: adminRole.id,
      permissionId: p.id
    }));
    
    if (rolePermissions.length > 0) {
      await db.insert(schema.rolePermissions).values(rolePermissions);
      console.log(`   ✅ Assigned ${rolePermissions.length} permissions to Administrator role`);
    }
  }
  
  // Assign permissions to Production Manager
  const prodManagerRole = insertedRoles.find(r => r.name === 'Production Manager');
  if (prodManagerRole) {
    const prodPermissions = await db
      .select()
      .from(schema.permissions)
      .where(
        sql`${schema.permissions.feature} IN ('production_schedule', 'inventory', 'labor_planning', 'production_planning', 'reports', 'ai')`
      );
    
    const rolePermissions = prodPermissions.map(p => ({
      roleId: prodManagerRole.id,
      permissionId: p.id
    }));
    
    if (rolePermissions.length > 0) {
      await db.insert(schema.rolePermissions).values(rolePermissions);
      console.log(`   ✅ Assigned ${rolePermissions.length} permissions to Production Manager role`);
    }
  }
  
  return insertedRoles;
}

async function seedUsers(roles: any[]) {
  console.log('👤 Checking users...');
  
  // Check if admin user exists
  const existingAdmin = await db
    .select()
    .from(schema.users)
    .where(sql`${schema.users.username} = 'admin'`)
    .limit(1);
  
  if (existingAdmin.length > 0) {
    console.log('   ✅ Admin user already exists');
    return;
  }
  
  const adminRole = roles.find(r => r.name === 'Administrator');
  if (!adminRole) {
    console.error('   ❌ Administrator role not found');
    return;
  }
  
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = {
    username: 'admin',
    email: 'admin@planettogether.com',
    firstName: 'System',
    lastName: 'Administrator',
    passwordHash: hashedPassword,
    isActive: true,
    activeRoleId: adminRole.id,
    jobTitle: 'System Administrator',
    department: 'IT'
  };
  
  const [insertedAdmin] = await db.insert(schema.users).values(adminUser).returning();
  console.log('   ✅ Created admin user (username: admin, password: admin123)');
  
  // Assign Administrator role to admin user
  await db.insert(schema.userRoles).values({
    userId: insertedAdmin.id,
    roleId: adminRole.id,
    assignedBy: insertedAdmin.id
  });
  console.log('   ✅ Assigned Administrator role to admin user');
  
  // Create AI Agent user
  const agentUser = {
    username: 'AI_Agent',
    email: 'ai@planettogether.com',
    firstName: 'Production Scheduling',
    lastName: 'Assistant',
    passwordHash: await bcrypt.hash(crypto.randomUUID(), 10), // Random password for security
    isActive: true,
    activeRoleId: adminRole.id,
    jobTitle: 'AI Assistant',
    department: 'System'
  };
  
  const [insertedAgent] = await db.insert(schema.users).values(agentUser).returning();
  console.log('   ✅ Created AI Agent user');
  
  // Assign Administrator role to AI Agent
  await db.insert(schema.userRoles).values({
    userId: insertedAgent.id,
    roleId: adminRole.id,
    assignedBy: insertedAdmin.id
  });
}

async function seedResources() {
  console.log('🏭 Checking resources...');
  
  // Use raw SQL to check for existing resources to avoid schema mismatch
  const existingResources = await db.execute(sql`SELECT COUNT(*) as count FROM ptresources`);
  
  if (existingResources.rows[0].count > 0) {
    console.log('   ✅ Resources already exist');
    return;
  }
  
  // Sample resources for a manufacturing facility (using actual database column names)
  const resources = [
    // Brewing Equipment
    { 
      name: 'Grain Mill', 
      description: 'Grain milling equipment', 
      capacity_type: 'Units/Hour', 
      active: true,
      plant_id: 1,
      publish_date: new Date(),
      instance_id: crypto.randomUUID()
    },
    { 
      name: 'Mash Tun 1', 
      description: 'Mashing vessel', 
      capacity_type: 'Gallons', 
      active: true,
      plant_id: 1,
      publish_date: new Date(),
      instance_id: crypto.randomUUID()
    },
    { 
      name: 'Lauter Tun', 
      description: 'Lautering vessel', 
      capacity_type: 'Gallons', 
      active: true,
      plant_id: 1,
      publish_date: new Date(),
      instance_id: crypto.randomUUID()
    },
    { 
      name: 'Brew Kettle', 
      description: 'Boiling vessel', 
      capacity_type: 'Gallons', 
      active: true,
      plant_id: 1,
      publish_date: new Date(),
      instance_id: crypto.randomUUID()
    },
    { 
      name: 'Fermenter Tank 1', 
      description: 'Primary fermentation', 
      capacity_type: 'Gallons', 
      active: true,
      tank: true,
      plant_id: 1,
      publish_date: new Date(),
      instance_id: crypto.randomUUID()
    },
    { 
      name: 'Fermenter Tank 2', 
      description: 'Primary fermentation', 
      capacity_type: 'Gallons', 
      active: true,
      tank: true,
      plant_id: 1,
      publish_date: new Date(),
      instance_id: crypto.randomUUID()
    },
    { 
      name: 'Fermenter Tank 3', 
      description: 'Primary fermentation', 
      capacity_type: 'Gallons', 
      active: true,
      tank: true,
      plant_id: 1,
      publish_date: new Date(),
      instance_id: crypto.randomUUID()
    },
    { 
      name: 'Bright Tank 1', 
      description: 'Conditioning tank', 
      capacity_type: 'Gallons', 
      active: true,
      tank: true,
      plant_id: 1,
      publish_date: new Date(),
      instance_id: crypto.randomUUID()
    },
    { 
      name: 'Bright Tank 2', 
      description: 'Conditioning tank', 
      capacity_type: 'Gallons', 
      active: true,
      tank: true,
      plant_id: 1,
      publish_date: new Date(),
      instance_id: crypto.randomUUID()
    },
    
    // Packaging Lines
    { 
      name: 'Bottle Filler Line', 
      description: 'Bottle filling equipment', 
      capacity_type: 'Bottles/Hour', 
      active: true,
      plant_id: 1,
      publish_date: new Date(),
      instance_id: crypto.randomUUID()
    },
    { 
      name: 'Can Filler Line', 
      description: 'Can filling equipment', 
      capacity_type: 'Cans/Hour', 
      active: true,
      plant_id: 1,
      publish_date: new Date(),
      instance_id: crypto.randomUUID()
    },
    
    // Quality Control
    { 
      name: 'QC Lab', 
      description: 'Quality control laboratory', 
      capacity_type: 'Samples/Day', 
      active: true,
      plant_id: 1,
      publish_date: new Date(),
      instance_id: crypto.randomUUID()
    },
  ];
  
  // Use raw SQL to insert resources with only the columns that exist in the database
  for (const resource of resources) {
    await db.execute(sql`
      INSERT INTO ptresources (
        name, 
        description, 
        capacity_type, 
        active, 
        tank,
        plant_id, 
        publish_date, 
        instance_id
      ) 
      VALUES (
        ${resource.name}, 
        ${resource.description}, 
        ${resource.capacity_type}, 
        ${resource.active},
        ${resource.tank || false},
        ${resource.plant_id}, 
        ${resource.publish_date}, 
        ${resource.instance_id}
      )
    `);
  }
  console.log(`   ✅ Created ${resources.length} resources`);
}

async function seedSampleJobs() {
  console.log('📦 Checking sample jobs...');
  
  // Use raw SQL to check for existing jobs to avoid schema mismatch
  const existingJobs = await db.execute(sql`SELECT COUNT(*) as count FROM ptjobs`);
  
  if (existingJobs.rows[0].count > 0) {
    console.log('   ✅ Jobs already exist');
    return;
  }
  
  // Sample production jobs
  const jobs = [
    {
      name: 'IPA Batch 2024-001',
      description: 'India Pale Ale production batch',
      priority: 1,
      quantity: 500,
      quantityUom: 'Gallons',
      needDateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      scheduledStatus: 'Not Started',
      percentComplete: 0
    },
    {
      name: 'Lager Batch 2024-002',
      description: 'Premium Lager production batch',
      priority: 2,
      quantity: 750,
      quantityUom: 'Gallons',
      needDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      scheduledStatus: 'Not Started',
      percentComplete: 0
    },
    {
      name: 'Wheat Beer 2024-003',
      description: 'Wheat Beer production batch',
      priority: 3,
      quantity: 400,
      quantityUom: 'Gallons',
      needDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      scheduledStatus: 'Not Started',
      percentComplete: 0
    }
  ];
  
  const insertedJobs = await db.insert(schema.ptJobs).values(jobs).returning();
  console.log(`   ✅ Created ${insertedJobs.length} sample jobs`);
  
  // Add operations for each job
  // Use raw SQL to select resources to avoid schema mismatch
  const resourcesResult = await db.execute(sql`SELECT id, name FROM ptresources`);
  const resourceMap = new Map(resourcesResult.rows.map(r => [r.name, r.id]));
  
  for (const job of insertedJobs) {
    const operations = [
      {
        job_id: job.id,
        name: `Milling - ${job.name}`,
        description: 'Grain milling preparation',
        sequence_number: 10,
        cycle_hrs: 2,
        setup_hours: 0.5,
        scheduled_start: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        scheduled_end: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000),
        percent_finished: 0
      },
      {
        job_id: job.id,
        name: `Mashing - ${job.name}`,
        description: 'Mashing process',
        sequence_number: 20,
        cycle_hrs: 3,
        setup_hours: 0.5,
        scheduled_start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        scheduled_end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3.5 * 60 * 60 * 1000),
        percent_finished: 0
      },
      {
        job_id: job.id,
        name: `Lautering - ${job.name}`,
        description: 'Wort separation',
        sequence_number: 30,
        cycle_hrs: 2,
        setup_hours: 0.25,
        scheduled_start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        scheduled_end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 6.25 * 60 * 60 * 1000),
        percent_finished: 0
      },
      {
        job_id: job.id,
        name: `Boiling - ${job.name}`,
        description: 'Wort boiling and hop addition',
        sequence_number: 40,
        cycle_hrs: 2,
        setup_hours: 0.25,
        scheduled_start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        scheduled_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2.25 * 60 * 60 * 1000),
        percent_finished: 0
      },
      {
        job_id: job.id,
        name: `Fermentation - ${job.name}`,
        description: 'Primary fermentation process',
        sequence_number: 50,
        cycle_hrs: 168, // 7 days
        setup_hours: 1,
        scheduled_start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        scheduled_end: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        percent_finished: 0
      },
      {
        job_id: job.id,
        name: `Conditioning - ${job.name}`,
        description: 'Beer conditioning and clarification',
        sequence_number: 60,
        cycle_hrs: 72, // 3 days
        setup_hours: 0.5,
        scheduled_start: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
        scheduled_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 0.5 * 60 * 60 * 1000),
        percent_finished: 0
      },
      {
        job_id: job.id,
        name: `Packaging - ${job.name}`,
        description: 'Bottling and packaging',
        sequence_number: 70,
        cycle_hrs: 4,
        setup_hours: 1,
        scheduled_start: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
        scheduled_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        percent_finished: 0
      }
    ];
    
    const insertedOps = await db.insert(schema.ptJobOperations).values(operations).returning();
    
    // Note: ptjobresources and ptdependencies tables don't exist in the current schema
    // These would need to be created if resource assignments and dependencies are needed
  }
  
  console.log('   ✅ Created operations and dependencies for sample jobs');
}

async function main() {
  try {
    // Check if we're in production environment
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!isProduction) {
      console.log('⚠️  Warning: Running production seed in development mode');
      console.log('   Set NODE_ENV=production to run in production mode\n');
    }
    
    // Run seed functions in order
    await seedPermissions();
    const roles = await seedRoles();
    await seedUsers(roles);
    await seedResources();
    await seedSampleJobs();
    
    console.log('\n✅ Production database seeding complete!');
    console.log('\n📝 Default credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('\n⚠️  Remember to change the admin password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seed
main();