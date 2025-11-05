#!/usr/bin/env tsx
import { db } from './db';
import { sql } from 'drizzle-orm';

console.log('🔍 Production Environment Check\n');
console.log('Environment:', process.env.NODE_ENV);
console.log('Database URL exists:', !!process.env.DATABASE_URL);
console.log('Session Secret exists:', !!process.env.SESSION_SECRET);
console.log('OpenAI Key exists:', !!process.env.OPENAI_API_KEY);

async function checkDatabase() {
  try {
    console.log('\n📊 Checking database connection...');
    
    // Test basic connection
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection successful');
    
    // Check for essential tables
    const tables = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log(`\n📋 Found ${tables.rows.length} tables in database`);
    
    // Check for critical data
    const checks = [
      { table: 'permissions', query: sql`SELECT COUNT(*) as count FROM permissions` },
      { table: 'roles', query: sql`SELECT COUNT(*) as count FROM roles` },
      { table: 'users', query: sql`SELECT COUNT(*) as count FROM users` },
      { table: 'ptresources', query: sql`SELECT COUNT(*) as count FROM ptresources` },
      { table: 'ptjobs', query: sql`SELECT COUNT(*) as count FROM ptjobs` }
    ];
    
    console.log('\n🔍 Checking essential data:');
    for (const check of checks) {
      try {
        const result = await db.execute(check.query);
        const count = result.rows[0].count;
        const status = count > 0 ? '✅' : '⚠️';
        console.log(`  ${status} ${check.table}: ${count} records`);
      } catch (error) {
        console.log(`  ❌ ${check.table}: Table not found or error`);
      }
    }
    
    // Check for admin user
    try {
      const adminResult = await db.execute(sql`
        SELECT username FROM users WHERE username = 'admin'
      `);
      if (adminResult.rows.length > 0) {
        console.log('\n✅ Admin user exists');
      } else {
        console.log('\n⚠️  Admin user not found - run: npm run db:seed:production');
      }
    } catch (error) {
      console.log('\n❌ Could not check for admin user');
    }
    
  } catch (error) {
    console.error('\n❌ Database check failed:', error);
    console.log('\n💡 Suggestions:');
    console.log('   1. Ensure DATABASE_URL is set correctly for production');
    console.log('   2. Run: npm run db:push --force');
    console.log('   3. Run: npm run db:seed:production');
  }
}

checkDatabase()
  .then(() => {
    console.log('\n✅ Production check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Production check failed:', error);
    process.exit(1);
  });