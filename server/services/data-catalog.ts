import { db } from '../db';
import { sql } from 'drizzle-orm';

interface ColumnInfo {
  name: string;
  type: string;
  isNullable: boolean;
  defaultValue?: string;
  description?: string;
  sampleValues?: any[];
  distinctCount?: number;
}

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  rowCount?: number;
  description?: string;
  tags: string[];
}

interface DataCatalog {
  tables: TableInfo[];
  lastUpdated: Date;
}

export class DataCatalogService {
  private static instance: DataCatalogService;
  private catalog: DataCatalog | null = null;
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  static getInstance(): DataCatalogService {
    if (!DataCatalogService.instance) {
      DataCatalogService.instance = new DataCatalogService();
    }
    return DataCatalogService.instance;
  }

  // Get current catalog (cached or fresh)
  async getCatalog(): Promise<DataCatalog> {
    if (this.isCacheValid()) {
      return this.catalog!;
    }
    
    return await this.refreshCatalog();
  }

  // Check if cache is still valid
  private isCacheValid(): boolean {
    if (!this.catalog) return false;
    
    const now = new Date();
    const timeDiff = now.getTime() - this.catalog.lastUpdated.getTime();
    return timeDiff < this.cacheExpiry;
  }

  // Refresh catalog by discovering schema
  async refreshCatalog(): Promise<DataCatalog> {
    console.log('[DataCatalog] Refreshing catalog...');
    
    try {
      const tables = await this.discoverTables();
      
      this.catalog = {
        tables,
        lastUpdated: new Date()
      };
      
      console.log(`[DataCatalog] Discovered ${tables.length} tables`);
      return this.catalog;
      
    } catch (error) {
      console.error('[DataCatalog] Error refreshing catalog:', error);
      
      // Return empty catalog on error
      this.catalog = {
        tables: [],
        lastUpdated: new Date()
      };
      return this.catalog;
    }
  }

  // Discover all accessible tables and their schema
  private async discoverTables(): Promise<TableInfo[]> {
    // Get table names from information_schema
    const tablesResult = await db.execute(sql`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'drizzle_%'
      ORDER BY table_name
    `);

    const tables: TableInfo[] = [];

    for (const tableRow of tablesResult.rows) {
      const tableName = tableRow.table_name as string;
      
      try {
        const columns = await this.discoverColumns(tableName);
        const rowCount = await this.getRowCount(tableName);
        const tags = this.generateTableTags(tableName, columns);
        
        tables.push({
          name: tableName,
          columns,
          rowCount,
          description: this.generateTableDescription(tableName, columns),
          tags
        });
      } catch (error) {
        console.warn(`[DataCatalog] Error processing table ${tableName}:`, error);
      }
    }

    return tables;
  }

  // Discover columns for a specific table
  private async discoverColumns(tableName: string): Promise<ColumnInfo[]> {
    const columnsResult = await db.execute(sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns 
      WHERE table_name = ${tableName}
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    const columns: ColumnInfo[] = [];

    for (const colRow of columnsResult.rows) {
      const columnName = colRow.column_name as string;
      const dataType = colRow.data_type as string;
      
      try {
        const sampleValues = await this.getSampleValues(tableName, columnName);
        const distinctCount = await this.getDistinctCount(tableName, columnName);
        
        columns.push({
          name: columnName,
          type: dataType,
          isNullable: (colRow.is_nullable as string) === 'YES',
          defaultValue: colRow.column_default as string,
          sampleValues,
          distinctCount,
          description: this.generateColumnDescription(columnName, dataType, sampleValues)
        });
      } catch (error) {
        console.warn(`[DataCatalog] Error processing column ${tableName}.${columnName}:`, error);
        
        // Add basic column info even if sampling fails
        columns.push({
          name: columnName,
          type: dataType,
          isNullable: (colRow.is_nullable as string) === 'YES',
          defaultValue: colRow.column_default as string
        });
      }
    }

    return columns;
  }

  // Get sample values for a column
  private async getSampleValues(tableName: string, columnName: string): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT DISTINCT ${sql.identifier(columnName)}
        FROM ${sql.identifier(tableName)}
        WHERE ${sql.identifier(columnName)} IS NOT NULL
        ORDER BY ${sql.identifier(columnName)}
        LIMIT 10
      `);
      
      return result.rows.map(row => Object.values(row)[0]);
    } catch (error) {
      console.warn(`[DataCatalog] Error getting sample values for ${tableName}.${columnName}:`, error);
      return [];
    }
  }

  // Get approximate distinct count for a column
  private async getDistinctCount(tableName: string, columnName: string): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(DISTINCT ${sql.identifier(columnName)}) as count
        FROM ${sql.identifier(tableName)}
        WHERE ${sql.identifier(columnName)} IS NOT NULL
      `);
      
      return Number(result.rows[0]?.count) || 0;
    } catch (error) {
      console.warn(`[DataCatalog] Error getting distinct count for ${tableName}.${columnName}:`, error);
      return 0;
    }
  }

  // Get row count for a table
  private async getRowCount(tableName: string): Promise<number> {
    try {
      const result = await db.execute(sql`
        SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}
      `);
      
      return Number(result.rows[0]?.count) || 0;
    } catch (error) {
      console.warn(`[DataCatalog] Error getting row count for ${tableName}:`, error);
      return 0;
    }
  }

  // Generate semantic tags for tables
  private generateTableTags(tableName: string, columns: ColumnInfo[]): string[] {
    const tags: string[] = [];
    const name = tableName.toLowerCase();
    
    // Manufacturing domain tags
    if (name.includes('resource')) tags.push('resource', 'equipment');
    if (name.includes('job')) tags.push('job', 'production', 'order');
    if (name.includes('operation')) tags.push('operation', 'process', 'manufacturing');
    if (name.includes('plant')) tags.push('plant', 'facility', 'location');
    if (name.includes('material')) tags.push('material', 'inventory');
    if (name.includes('schedule')) tags.push('schedule', 'time', 'planning');
    
    // Column-based tags
    const columnNames = columns.map(c => c.name.toLowerCase()).join(' ');
    if (columnNames.includes('start') || columnNames.includes('end')) tags.push('time');
    if (columnNames.includes('quantity') || columnNames.includes('amount')) tags.push('quantity');
    if (columnNames.includes('priority')) tags.push('priority');
    if (columnNames.includes('status')) tags.push('status');
    
    return [...new Set(tags)]; // Remove duplicates
  }

  // Generate table description
  private generateTableDescription(tableName: string, columns: ColumnInfo[]): string {
    const name = tableName.toLowerCase();
    const keyColumns = columns.slice(0, 5).map(c => c.name).join(', ');
    
    if (name.includes('ptresource')) return `Manufacturing resources and equipment with columns: ${keyColumns}`;
    if (name.includes('ptjob')) return `Production jobs and orders with columns: ${keyColumns}`;
    if (name.includes('ptoperation')) return `Manufacturing operations with columns: ${keyColumns}`;
    
    return `Table with ${columns.length} columns: ${keyColumns}`;
  }

  // Generate column description
  private generateColumnDescription(columnName: string, dataType: string, sampleValues?: any[]): string {
    const name = columnName.toLowerCase();
    const samples = sampleValues && sampleValues.length > 0 ? ` (e.g., ${sampleValues.slice(0, 3).join(', ')})` : '';
    
    if (name.includes('id')) return `Identifier field${samples}`;
    if (name.includes('name')) return `Name field${samples}`;
    if (name.includes('plant')) return `Plant or facility reference${samples}`;
    if (name.includes('department')) return `Department reference${samples}`;
    if (name.includes('priority')) return `Priority level${samples}`;
    if (name.includes('status')) return `Status indicator${samples}`;
    if (name.includes('date') || name.includes('time')) return `Date/time field${samples}`;
    if (name.includes('quantity') || name.includes('amount')) return `Quantity or amount${samples}`;
    
    return `${dataType} field${samples}`;
  }

  // Get summary for AI consumption
  async summarizeForAI(): Promise<string> {
    const catalog = await this.getCatalog();
    
    const summary = catalog.tables.map(table => {
      const keyColumns = table.columns
        .filter(col => col.sampleValues && col.sampleValues.length > 0)
        .slice(0, 6)
        .map(col => `${col.name} (${col.type}, ${col.distinctCount} unique values)`)
        .join(', ');
      
      return `${table.name} (${table.rowCount} rows): ${keyColumns}`;
    }).join('\n');
    
    return `Available Data Tables:\n${summary}`;
  }

  // Find tables by semantic tags
  async findTablesByTags(tags: string[]): Promise<TableInfo[]> {
    const catalog = await this.getCatalog();
    
    return catalog.tables.filter(table => 
      tags.some(tag => table.tags.includes(tag.toLowerCase()))
    );
  }

  // Find columns by name pattern
  async findColumnsByName(pattern: string): Promise<{table: string, column: ColumnInfo}[]> {
    const catalog = await this.getCatalog();
    const results: {table: string, column: ColumnInfo}[] = [];
    
    for (const table of catalog.tables) {
      for (const column of table.columns) {
        if (column.name.toLowerCase().includes(pattern.toLowerCase())) {
          results.push({ table: table.name, column });
        }
      }
    }
    
    return results;
  }
}

export const dataCatalog = DataCatalogService.getInstance();