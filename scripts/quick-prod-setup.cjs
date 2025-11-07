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
    const sqlCommands = fs.readFileSync('./scripts/init-production-db.sql', 'utf8');
    
    // Split by semicolon and execute each command
    const commands = sqlCommands
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`🔧 Executing ${commands.length} SQL commands...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command) {
        try {
          await sql(command + ';');
          console.log(`✅ Command ${i + 1}/${commands.length} executed`);
        } catch (err) {
          console.log(`⚠️  Command ${i + 1} warning:`, err.message);
          // Continue even if some commands fail (e.g., tables already exist)
        }
      }
    }
    
    // Test the setup
    console.log('\n🔍 Verifying setup...');
    const userCount = await sql`SELECT COUNT(*) FROM users`;
    console.log(`Users in database: ${userCount[0].count}`);
    
    const users = await sql`SELECT username FROM users ORDER BY username`;
    console.log('Users created:');
    for (const user of users) {
      console.log(`  - ${user.username}`);
    }
    
    console.log('\n✅ Production database setup complete!');
    console.log('\nYou can now log in with:');
    console.log('  - Username: patti, Password: password123');
    console.log('  - Username: Jim, Password: planettogether');
    console.log('  - Username: admin, Password: admin123');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

setupProduction().catch(console.error);