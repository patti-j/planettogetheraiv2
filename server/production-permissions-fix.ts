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
    console.log('🔧 Ensuring production users have Administrator access...');
    
    // Get Administrator role
    const adminRole = await db.select().from(roles)
      .where(eq(roles.name, 'Administrator'))
      .limit(1);
    
    if (adminRole.length === 0) {
      console.error('❌ Administrator role not found!');
      return;
    }
    
    // Ensure Patti and Jim have Administrator role (fast operation)
    const criticalUsers = ['patti', 'Jim'];
    
    for (const username of criticalUsers) {
      try {
        const user = await db.select().from(users)
          .where(eq(users.username, username))
          .limit(1);
        
        if (user.length > 0) {
          // Ensure user has Administrator role
          await db.insert(userRoles).values({
            userId: user[0].id,
            roleId: adminRole[0].id
          }).onConflictDoNothing();
          
          console.log(`✅ ${username} has Administrator role`);
        } else {
          console.log(`⚠️ User ${username} not found in database`);
        }
      } catch (error) {
        console.error(`❌ Error with user ${username}:`, error);
      }
    }
    
    console.log('✅ Production user access ensured (permissions created on first login)');
    
  } catch (error) {
    console.error('❌ Error ensuring production user access:', error);
    // Don't throw - we don't want to crash the server
  }
}