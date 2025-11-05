import * as fs from 'fs';
import * as path from 'path';
import { sql } from 'drizzle-orm';
import { db } from './db';
import * as schema from '@shared/schema';

/**
 * Export all development database data to SQL files
 * This script exports data from all tables for migration to production
 */

const EXPORT_DIR = path.join(process.cwd(), 'database-exports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

// Tables to export (in dependency order)
const TABLES_TO_EXPORT = [
  // Core system tables
  { name: 'permissions', table: schema.permissions },
  { name: 'roles', table: schema.roles },
  { name: 'role_permissions', table: schema.rolePermissions },
  
  // User tables
  { name: 'users', table: schema.users },
  { name: 'user_roles', table: schema.userRoles },
  { name: 'user_preferences', table: schema.userPreferences },
  
  // PT tables
  { name: 'ptresources', table: schema.ptResources },
  { name: 'ptjobs', table: schema.ptJobs },
  { name: 'ptjoboperations', table: schema.ptJobOperations },
  
  // Schedule versions
  { name: 'schedule_versions', table: schema.scheduleVersions },
  
  // Dashboard and UI
  { name: 'dashboards', table: schema.dashboards },
  { name: 'widgets', table: schema.widgets },
  { name: 'recent_pages', table: schema.recentPages },
  
  // AI and automation
  { name: 'agent_connections', table: schema.agentConnections },
  { name: 'agent_actions', table: schema.agentActions },
  { name: 'agent_metrics_hourly', table: schema.agentMetricsHourly },
  { name: 'agent_policies', table: schema.agentPolicies },
  { name: 'agent_recommendations', table: schema.agentRecommendations },
  { name: 'automation_rules', table: schema.automationRules },
  { name: 'automation_executions', table: schema.automationExecutions },
  
  // Chat and messages
  { name: 'max_chat_messages', table: schema.maxChatMessages },
  
  // Algorithms
  { name: 'algorithm_requirements', table: schema.algorithmRequirements },
  
  // Onboarding
  { name: 'company_onboarding', table: schema.companyOnboarding },
];

async function exportTable(tableName: string, table: any) {
  try {
    console.log(`📊 Exporting ${tableName}...`);
    
    // Get all data from the table
    const data = await db.select().from(table);
    
    if (data.length === 0) {
      console.log(`   ⚪ No data in ${tableName}`);
      return null;
    }
    
    // Generate INSERT statements
    const inserts: string[] = [];
    
    for (const row of data) {
      const columns = Object.keys(row);
      const values = columns.map(col => {
        const val = row[col];
        if (val === null) return 'NULL';
        if (val === undefined) return 'NULL';
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'number') return val.toString();
        if (val instanceof Date) return `'${val.toISOString()}'`;
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        // Escape single quotes in strings
        return `'${String(val).replace(/'/g, "''")}'`;
      });
      
      const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
      inserts.push(insertSQL);
    }
    
    console.log(`   ✅ Exported ${data.length} rows from ${tableName}`);
    return {
      tableName,
      rowCount: data.length,
      sql: inserts.join('\n')
    };
    
  } catch (error) {
    console.error(`   ❌ Error exporting ${tableName}:`, error);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting database export...\n');
  
  // Create export directory
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
  
  const exportResults: any[] = [];
  const allSQL: string[] = [];
  
  // Add header
  allSQL.push('-- PlanetTogether Development Database Export');
  allSQL.push(`-- Generated: ${new Date().toISOString()}`);
  allSQL.push('-- This file contains all development data for migration to production\n');
  
  // Export each table
  for (const { name, table } of TABLES_TO_EXPORT) {
    const result = await exportTable(name, table);
    if (result) {
      exportResults.push(result);
      allSQL.push(`\n-- Table: ${name} (${result.rowCount} rows)`);
      allSQL.push(result.sql);
    }
  }
  
  // Write combined SQL file
  const combinedFile = path.join(EXPORT_DIR, `full-export-${TIMESTAMP}.sql`);
  fs.writeFileSync(combinedFile, allSQL.join('\n'));
  
  // Write individual table files
  for (const result of exportResults) {
    const tableFile = path.join(EXPORT_DIR, `${result.tableName}-${TIMESTAMP}.sql`);
    fs.writeFileSync(tableFile, `-- Table: ${result.tableName}\n${result.sql}`);
  }
  
  // Write summary JSON
  const summary = {
    exportDate: new Date().toISOString(),
    tables: exportResults.map(r => ({
      name: r.tableName,
      rowCount: r.rowCount
    })),
    totalRows: exportResults.reduce((sum, r) => sum + r.rowCount, 0),
    files: {
      combined: combinedFile,
      individual: exportResults.map(r => `${r.tableName}-${TIMESTAMP}.sql`)
    }
  };
  
  const summaryFile = path.join(EXPORT_DIR, `export-summary-${TIMESTAMP}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  
  console.log('\n✅ Export complete!');
  console.log(`📁 Files saved to: ${EXPORT_DIR}`);
  console.log(`📊 Total tables exported: ${exportResults.length}`);
  console.log(`📈 Total rows exported: ${summary.totalRows}`);
  console.log('\nFiles created:');
  console.log(`  • Combined SQL: ${path.basename(combinedFile)}`);
  console.log(`  • Summary JSON: ${path.basename(summaryFile)}`);
  console.log(`  • Individual table files: ${exportResults.length} files`);
  
  process.exit(0);
}

// Run the export
main().catch(error => {
  console.error('❌ Export failed:', error);
  process.exit(1);
});