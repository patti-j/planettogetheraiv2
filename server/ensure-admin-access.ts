import bcryptjs from 'bcryptjs';
import { db } from './db';
import { users, roles, userRoles, permissions, rolePermissions } from '../shared/schema';
import { eq, sql, and } from 'drizzle-orm';

export async function ensureAdminAccess() {
  try {
    console.log('🔧 Ensuring admin user has full access...');
    
    // First, verify the database tables exist
    try {
      const tableCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'users'
        ) as exists
      `);
      
      const tableExists = tableCheck.rows?.[0]?.exists;
      if (!tableExists) {
        console.log('⏳ Database tables not ready yet, skipping admin setup (will retry on next startup)');
        return;
      }
    } catch (tableCheckError) {
      console.log('⏳ Database not ready for admin setup, skipping (will retry on next startup)');
      return;
    }
    
    // 1. Check if admin user exists, create if not
    let adminUser = await db.select().from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);
    
    if (adminUser.length === 0) {
      console.log('📝 Creating admin user...');
      const hashedPassword = await bcryptjs.hash('admin123', 10);
      
      const [newAdminUser] = await db.insert(users).values({
        username: 'admin',
        email: 'admin@planettogether.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        lastLogin: null
      }).returning();
      
      adminUser = [newAdminUser];
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user exists');
      
      // Update password to ensure it's admin123
      const hashedPassword = await bcryptjs.hash('admin123', 10);
      await db.update(users)
        .set({ 
          passwordHash: hashedPassword,
          isActive: true 
        })
        .where(eq(users.id, adminUser[0].id));
      console.log('✅ Admin password reset to admin123');
    }
    
    // 2. Check/create Administrator role
    let adminRole = await db.select().from(roles)
      .where(eq(roles.name, 'Administrator'))
      .limit(1);
    
    if (adminRole.length === 0) {
      console.log('📝 Creating Administrator role...');
      const [newRole] = await db.insert(roles).values({
        name: 'Administrator',
        description: 'System administrator with full access',
        isActive: true,
        isSystemRole: true
      }).returning();
      adminRole = [newRole];
      console.log('✅ Administrator role created');
    } else {
      console.log('✅ Administrator role exists');
      
      // Ensure it's active
      await db.update(roles)
        .set({ isActive: true })
        .where(eq(roles.id, adminRole[0].id));
    }
    
    // 3. Check if admin user has Administrator role
    const existingUserRole = await db.select().from(userRoles)
      .where(and(
        eq(userRoles.userId, adminUser[0].id),
        eq(userRoles.roleId, adminRole[0].id)
      ))
      .limit(1);
    
    if (existingUserRole.length === 0) {
      console.log('📝 Assigning Administrator role to admin user...');
      await db.insert(userRoles).values({
        userId: adminUser[0].id,
        roleId: adminRole[0].id,
        assignedBy: adminUser[0].id
      });
      console.log('✅ Administrator role assigned to admin user');
    } else {
      console.log('✅ Admin user already has Administrator role');
    }
    
    // NOTE: Permissions are created by production-permissions-fix.ts to keep this fast
    console.log('✅ Admin role configured (permissions handled separately)')
    
    // 5. Also ensure Jim user exists with admin access
    let jimUser = await db.select().from(users)
      .where(eq(users.username, 'Jim'))
      .limit(1);
    
    if (jimUser.length === 0) {
      console.log('📝 Creating Jim user...');
      const jimPassword = await bcryptjs.hash('planettogether', 10);
      const [newJimUser] = await db.insert(users).values({
        username: 'Jim',
        email: 'jim.cerra@planettogether.com',
        passwordHash: jimPassword,
        firstName: 'Jim',
        lastName: 'Cerra',
        isActive: true,
        createdAt: new Date(),
        lastLogin: null
      }).returning();
      
      // Assign admin role to Jim
      await db.insert(userRoles).values({
        userId: newJimUser.id,
        roleId: adminRole[0].id,
        assignedBy: adminUser[0].id
      }).onConflictDoNothing();
      
      console.log('✅ Jim user created with admin access');
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('✅ ADMIN ACCESS CONFIRMED');
    console.log('═══════════════════════════════════════════');
    console.log('📌 Admin Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    console.log('📌 Jim Credentials:');
    console.log('   Username: Jim');
    console.log('   Password: planettogether');
    console.log('');
    console.log('Both users have full Administrator access');
    console.log('═══════════════════════════════════════════');
    
  } catch (error: any) {
    // Don't crash the server if admin setup fails - log and continue
    console.error('⚠️ Warning: Admin access setup encountered an issue:', error?.message || error);
    console.log('The server will continue starting. Admin setup will retry on next restart.');
    // Don't throw - allow server to start anyway
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureAdminAccess().then(() => {
    console.log('✅ Admin access setup complete');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Failed to set up admin access:', error);
    process.exit(1);
  });
}