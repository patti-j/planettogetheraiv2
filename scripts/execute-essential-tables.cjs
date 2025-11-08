const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

async function setupEssentialTables() {
  // Force production environment
  process.env.NODE_ENV = 'production';
  
  const dbUrl = process.env.PRODUCTION_DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ PRODUCTION_DATABASE_URL is not set!');
    process.exit(1);
  }
  
  console.log('📦 Connecting to production database...');
  
  const sql = neon(dbUrl);
  
  try {
    // Read the SQL file
    const sqlCommands = fs.readFileSync('./scripts/essential-prod-tables.sql', 'utf8');
    
    // Execute the entire script as one command to avoid splitting issues
    console.log('🔧 Creating essential production tables...');
    
    await sql(sqlCommands);
    console.log('✅ Essential tables created successfully!');
    
    // Test the setup
    console.log('\n🔍 Verifying essential tables...');
    
    const dashboards = await sql`SELECT COUNT(*) as count FROM dashboards`;
    console.log(`✅ Dashboards table: ${dashboards[0].count} records`);
    
    const widgets = await sql`SELECT COUNT(*) as count FROM widgets`;
    console.log(`✅ Widgets table: ${widgets[0].count} records`);
    
    const prefs = await sql`SELECT COUNT(*) as count FROM user_preferences`;
    console.log(`✅ User preferences table: ${prefs[0].count} records`);
    
    const config = await sql`SELECT COUNT(*) as count FROM system_configuration`;
    console.log(`✅ System configuration: ${config[0].count} records`);
    
    // Verify users still exist
    const users = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`✅ Users table: ${users[0].count} users`);
    
    console.log('\n🎉 SUCCESS! Production database is ready!');
    console.log('\nThe application should now work when deployed.');
    console.log('Please redeploy (publish) the application to test.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

setupEssentialTables().catch(console.error);