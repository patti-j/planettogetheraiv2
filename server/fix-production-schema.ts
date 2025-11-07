import { sql } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// This script creates missing tables in production database
async function fixProductionSchema() {
  if (!process.env.PRODUCTION_DATABASE_URL) {
    console.error('❌ PRODUCTION_DATABASE_URL is not set');
    process.exit(1);
  }
  
  console.log('🔧 Fixing production database schema...');
  
  const queryClient = neon(process.env.PRODUCTION_DATABASE_URL);
  const prodDb = drizzle(queryClient);
  
  try {
    // Drop and recreate recent_pages table to ensure proper schema
    console.log('📦 Setting up recent_pages table...');
    await prodDb.execute(sql`DROP TABLE IF EXISTS recent_pages CASCADE`);
    await prodDb.execute(sql`
      CREATE TABLE recent_pages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        page_name VARCHAR(255) NOT NULL,
        page_path VARCHAR(500) NOT NULL,
        icon VARCHAR(50),
        access_count INTEGER DEFAULT 1,
        last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, page_path)
      )
    `);
    console.log('✅ recent_pages table created');
    
    // Create indexes for recent_pages
    await prodDb.execute(sql`
      CREATE INDEX idx_recent_pages_user_id ON recent_pages(user_id)
    `);
    await prodDb.execute(sql`
      CREATE INDEX idx_recent_pages_last_accessed ON recent_pages(last_accessed DESC)
    `);
    console.log('✅ recent_pages indexes created');
    
    // Create agent_actions table if it doesn't exist
    console.log('📦 Creating agent_actions table...');
    await prodDb.execute(sql`
      CREATE TABLE IF NOT EXISTS agent_actions (
        id SERIAL PRIMARY KEY,
        action_type VARCHAR(100) NOT NULL,
        agent_name VARCHAR(100) NOT NULL,
        user_id INTEGER,
        context JSONB,
        result JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ agent_actions table created');
    
    // Create indexes for agent_actions
    await prodDb.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_agent_actions_agent_name ON agent_actions(agent_name)
    `);
    await prodDb.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_agent_actions_user_id ON agent_actions(user_id)
    `);
    await prodDb.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_agent_actions_created_at ON agent_actions(created_at DESC)
    `);
    console.log('✅ agent_actions indexes created');
    
    // Create ai_automation_rules table if it doesn't exist
    console.log('📦 Creating ai_automation_rules table...');
    await prodDb.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_automation_rules (
        id SERIAL PRIMARY KEY,
        recommendation_type VARCHAR(255) NOT NULL,
        action TEXT NOT NULL,
        enabled BOOLEAN DEFAULT false,
        priority INTEGER DEFAULT 0,
        conditions JSONB,
        actions JSONB,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_applied_at TIMESTAMP,
        times_applied INTEGER DEFAULT 0,
        UNIQUE(recommendation_type)
      )
    `);
    console.log('✅ ai_automation_rules table created');
    
    // Create hints table if it doesn't exist
    console.log('📦 Creating hints table...');
    await prodDb.execute(sql`
      CREATE TABLE IF NOT EXISTS hints (
        id SERIAL PRIMARY KEY,
        hint_key VARCHAR(100) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50),
        priority INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ hints table created');
    
    // Create user_hints table if it doesn't exist
    console.log('📦 Creating user_hints table...');
    await prodDb.execute(sql`
      CREATE TABLE IF NOT EXISTS user_hints (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        hint_id INTEGER NOT NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_dismissed BOOLEAN DEFAULT false,
        UNIQUE(user_id, hint_id)
      )
    `);
    console.log('✅ user_hints table created');
    
    // Create agent_activity_tracking table if it doesn't exist
    console.log('📦 Creating agent_activity_tracking table...');
    await prodDb.execute(sql`
      CREATE TABLE IF NOT EXISTS agent_activity_tracking (
        id SERIAL PRIMARY KEY,
        agent_id VARCHAR(50) NOT NULL,
        user_id INTEGER,
        session_id VARCHAR(100),
        activity_type VARCHAR(50) NOT NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ agent_activity_tracking table created');
    
    console.log('🎉 Production database schema update complete!');
    console.log('✅ All missing tables have been created');
    console.log('📌 Next step: Click the "Publish" button to deploy your application');
    
  } catch (error) {
    console.error('❌ Error updating production schema:', error);
    process.exit(1);
  }
}

// Run the fix
fixProductionSchema();