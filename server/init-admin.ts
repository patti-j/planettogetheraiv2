import bcryptjs from 'bcryptjs';
import { db } from './db';
import { users, roles, userRoles } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

export async function initializeAdminUser() {
  try {
    console.log('🔧 Checking for admin user...');
    
    // Check if any users exist
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length === 0) {
      console.log('📝 No users found. Creating default admin user...');
      
      // Create default admin user
      const hashedPassword = await bcryptjs.hash('Admin@2024!', 10);
      
      const [adminUser] = await db.insert(users).values({
        username: 'admin',
        email: 'admin@planettogether.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        lastLogin: null
      }).returning();
      
      console.log('✅ Admin user created:', adminUser.username);
      
      // Check/create Administrator role
      let adminRole = await db.select().from(roles)
        .where(eq(roles.name, 'Administrator'))
        .limit(1);
      
      if (adminRole.length === 0) {
        const [newRole] = await db.insert(roles).values({
          name: 'Administrator',
          description: 'System administrator with full access',
          isActive: true,
          isSystemRole: true
        }).returning();
        adminRole = [newRole];
      }
      
      // Assign admin role to user
      await db.insert(userRoles).values({
        userId: adminUser.id,
        roleId: adminRole[0].id,
        assignedBy: adminUser.id
      });
      
      console.log('✅ Administrator role assigned to admin user');
      console.log('');
      console.log('═══════════════════════════════════════════');
      console.log('📌 DEFAULT ADMIN CREDENTIALS:');
      console.log('   Username: admin');
      console.log('   Password: Admin@2024!');
      console.log('═══════════════════════════════════════════');
      console.log('');
      console.log('⚠️  IMPORTANT: Change this password after first login!');
      
      // Also create Jim user for consistency
      const jimPassword = await bcryptjs.hash('planettogether', 10);
      const [jimUser] = await db.insert(users).values({
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
        userId: jimUser.id,
        roleId: adminRole[0].id,
        assignedBy: adminUser.id
      });
      
      console.log('✅ Jim user also created with admin access');
      console.log('   Username: Jim');
      console.log('   Password: planettogether');
      
    } else {
      console.log('✅ Users already exist. Skipping admin initialization.');
      
      // Still check if Jim exists and create if not
      const jimExists = await db.select().from(users)
        .where(eq(users.username, 'Jim'))
        .limit(1);
      
      if (jimExists.length === 0) {
        console.log('📝 Creating Jim user...');
        
        const jimPassword = await bcryptjs.hash('planettogether', 10);
        const [jimUser] = await db.insert(users).values({
          username: 'Jim',
          email: 'jim.cerra@planettogether.com',
          passwordHash: jimPassword,
          firstName: 'Jim',
          lastName: 'Cerra',
          isActive: true,
          createdAt: new Date(),
          lastLogin: null
        }).returning();
        
        // Get admin role
        const adminRole = await db.select().from(roles)
          .where(eq(roles.name, 'Administrator'))
          .limit(1);
        
        if (adminRole.length > 0) {
          await db.insert(userRoles).values({
            userId: jimUser.id,
            roleId: adminRole[0].id,
            assignedBy: 1 // Assuming admin user ID is 1
          });
          
          console.log('✅ Jim user created with admin access');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error initializing admin user:', error);
    // Don't throw - allow app to continue even if admin init fails
  }
}