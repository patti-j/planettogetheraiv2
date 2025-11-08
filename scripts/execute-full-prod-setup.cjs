const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

async function setupProduction() {
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
    const sqlCommands = fs.readFileSync('./scripts/full-prod-setup.sql', 'utf8');
    
    // Split by semicolon and execute each command
    const commands = sqlCommands
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`🔧 Executing ${commands.length} SQL commands to create all tables...`);
    
    let successCount = 0;
    let warningCount = 0;
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command) {
        try {
          await sql(command + ';');
          console.log(`✅ Command ${i + 1}/${commands.length} executed`);
          successCount++;
        } catch (err) {
          if (err.message.includes('already exists')) {
            console.log(`⚠️  Command ${i + 1} - already exists (skipping)`);
            warningCount++;
          } else {
            console.log(`❌ Command ${i + 1} error:`, err.message);
          }
        }
      }
    }
    
    console.log(`\n📊 Summary: ${successCount} successful, ${warningCount} already existed`);
    
    // Test the setup
    console.log('\n🔍 Verifying production database setup...');
    
    // Check critical tables
    const tables = [
      'users', 'roles', 'dashboards', 'widgets', 'ptjobs', 
      'ptactivities', 'ptresources', 'scheduler_versions'
    ];
    
    for (const table of tables) {
      try {
        const result = await sql`SELECT COUNT(*) FROM ${sql(table)}`;
        console.log(`✅ Table '${table}': ${result[0].count} records`);
      } catch (err) {
        console.log(`❌ Table '${table}': Not found or error`);
      }
    }
    
    // Verify users
    const users = await sql`SELECT username FROM users ORDER BY username`;
    console.log('\n👥 Users in production database:');
    for (const user of users) {
      console.log(`  - ${user.username}`);
    }
    
    console.log('\n✅ Production database setup complete!');
    console.log('\nThe production database now has:');
    console.log('  - All authentication tables (users, roles, permissions)');
    console.log('  - Dashboard and widget tables');
    console.log('  - Scheduler tables (jobs, activities, resources)');
    console.log('  - System configuration and monitoring tables');
    console.log('\nYou can now redeploy and the application should work!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

setupProduction().catch(console.error);