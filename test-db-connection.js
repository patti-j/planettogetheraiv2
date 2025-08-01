import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

async function testConnection() {
  try {
    console.log('Testing direct database connection...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool);
    
    console.log('Pool created successfully');
    
    // Test raw query
    const result = await pool.query('SELECT COUNT(*) as count FROM plants');
    console.log('Raw query result:', result.rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

testConnection();