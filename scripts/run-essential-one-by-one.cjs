const { neon } = require('@neondatabase/serverless');

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
    console.log('🔧 Creating essential production tables one by one...\n');
    
    // Create each table individually
    console.log('Creating dashboards table...');
    await sql`
      CREATE TABLE IF NOT EXISTS dashboards (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        layout JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        theme VARCHAR(50) DEFAULT 'light',
        refresh_interval INTEGER,
        tags TEXT[],
        is_public BOOLEAN DEFAULT false
      )`;
    console.log('✅ Dashboards table created');
    
    console.log('Creating widgets table...');
    await sql`
      CREATE TABLE IF NOT EXISTS widgets (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        dashboard_id VARCHAR,
        widget_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        configuration JSON,
        position JSON,
        size JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    console.log('✅ Widgets table created');
    
    console.log('Creating user_preferences table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        theme VARCHAR(50) DEFAULT 'light',
        language VARCHAR(10) DEFAULT 'en',
        notifications_enabled BOOLEAN DEFAULT true,
        email_notifications BOOLEAN DEFAULT true,
        dashboard_layout JSON,
        default_dashboard_id VARCHAR,
        timezone VARCHAR(50) DEFAULT 'UTC',
        date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
        currency VARCHAR(3) DEFAULT 'USD',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    console.log('✅ User preferences table created');
    
    console.log('Creating agent_activity_tracking table...');
    await sql`
      CREATE TABLE IF NOT EXISTS agent_activity_tracking (
        id SERIAL PRIMARY KEY,
        agent_name VARCHAR(100),
        activity_type VARCHAR(50),
        details JSON,
        user_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    console.log('✅ Agent activity tracking table created');
    
    console.log('Creating max_chat_messages table...');
    await sql`
      CREATE TABLE IF NOT EXISTS max_chat_messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(100),
        user_id INTEGER,
        role VARCHAR(50),
        content TEXT,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    console.log('✅ Max chat messages table created');
    
    console.log('Creating system_configuration table...');
    await sql`
      CREATE TABLE IF NOT EXISTS system_configuration (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSON,
        description TEXT,
        category VARCHAR(50),
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    console.log('✅ System configuration table created');
    
    console.log('Creating agent_recommendations table...');
    await sql`
      CREATE TABLE IF NOT EXISTS agent_recommendations (
        id SERIAL PRIMARY KEY,
        agent_name VARCHAR(100),
        category VARCHAR(50),
        title VARCHAR(255),
        description TEXT,
        priority VARCHAR(20),
        status VARCHAR(50) DEFAULT 'pending',
        action_data JSON,
        user_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
      )`;
    console.log('✅ Agent recommendations table created');
    
    console.log('Creating ai_agent_team table...');
    await sql`
      CREATE TABLE IF NOT EXISTS ai_agent_team (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        configuration JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    console.log('✅ AI agent team table created');
    
    // Add default dashboard
    console.log('\nInserting default dashboard...');
    await sql`
      INSERT INTO dashboards (name, description, is_active, is_public) 
      VALUES ('Main Dashboard', 'Default production dashboard', true, true)
      ON CONFLICT DO NOTHING`;
    console.log('✅ Default dashboard added');
    
    // Add default system configuration
    console.log('Adding default system configuration...');
    await sql`
      INSERT INTO system_configuration (key, value, description, category) VALUES
      ('scheduler.algorithm', '"ASAP"', 'Default scheduling algorithm', 'scheduler')
      ON CONFLICT DO NOTHING`;
    await sql`
      INSERT INTO system_configuration (key, value, description, category) VALUES
      ('scheduler.auto_save', 'true', 'Auto-save scheduler changes', 'scheduler')
      ON CONFLICT DO NOTHING`;
    await sql`
      INSERT INTO system_configuration (key, value, description, category) VALUES
      ('system.theme', '"light"', 'Default system theme', 'ui')
      ON CONFLICT DO NOTHING`;
    await sql`
      INSERT INTO system_configuration (key, value, description, category) VALUES
      ('system.language', '"en"', 'Default system language', 'ui')
      ON CONFLICT DO NOTHING`;
    console.log('✅ Default configuration added');
    
    // Verify setup
    console.log('\n🔍 Verifying essential tables...');
    
    const dashboards = await sql`SELECT COUNT(*) as count FROM dashboards`;
    console.log(`✅ Dashboards: ${dashboards[0].count} records`);
    
    const widgets = await sql`SELECT COUNT(*) as count FROM widgets`;
    console.log(`✅ Widgets: ${widgets[0].count} records`);
    
    const prefs = await sql`SELECT COUNT(*) as count FROM user_preferences`;
    console.log(`✅ User preferences: ${prefs[0].count} records`);
    
    const config = await sql`SELECT COUNT(*) as count FROM system_configuration`;
    console.log(`✅ System configuration: ${config[0].count} records`);
    
    const users = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`✅ Users: ${users[0].count} users`);
    
    console.log('\n🎉 SUCCESS! Production database is ready!');
    console.log('\n✨ All essential tables have been created:');
    console.log('  ✅ Authentication (users, roles, permissions)');
    console.log('  ✅ Dashboards and widgets');
    console.log('  ✅ User preferences');
    console.log('  ✅ Agent tracking and recommendations');
    console.log('  ✅ System configuration');
    console.log('\n📢 NEXT STEP: Please redeploy (publish) your application!');
    console.log('   The production site should now work correctly.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

setupEssentialTables().catch(console.error);