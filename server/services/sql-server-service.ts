import sql from 'mssql';

interface SQLServerConfig {
  server: string;
  database: string;
  user: string;
  password: string;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
}

interface TableColumn {
  columnName: string;
  dataType: string;
  isNullable: string;
  maxLength: number | null;
}

class SQLServerService {
  private pool: sql.ConnectionPool | null = null;
  private config: SQLServerConfig;
  private schemaCache: Map<string, TableColumn[]> = new Map();
  private schemaCacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.config = {
      server: process.env.SQL_SERVER || '',
      database: process.env.SQL_DATABASE || '',
      user: process.env.SQL_USERNAME || '',
      password: process.env.SQL_PASSWORD || '',
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
    };
  }

  async getPool(): Promise<sql.ConnectionPool> {
    if (!this.pool) {
      this.pool = await sql.connect(this.config);
      console.log('✅ SQL Server connection pool created');
    }
    return this.pool;
  }

  async listTables(): Promise<Array<{ tableName: string; schemaName: string }>> {
    try {
      const pool = await this.getPool();
      const result = await pool.request().query(`
        SELECT 
          TABLE_SCHEMA as schemaName,
          TABLE_NAME as tableName
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error listing tables:', error);
      throw new Error('Failed to list tables from SQL Server');
    }
  }

  async getTableSchema(schemaName: string, tableName: string): Promise<Array<{
    columnName: string;
    dataType: string;
    isNullable: string;
    maxLength: number | null;
  }>> {
    const cacheKey = `${schemaName}.${tableName}`;
    const now = Date.now();
    
    // Check cache first
    const cached = this.schemaCache.get(cacheKey);
    const cacheExpiry = this.schemaCacheExpiry.get(cacheKey);
    
    if (cached && cacheExpiry && cacheExpiry > now) {
      console.log(`✅ Schema cache hit for ${cacheKey}`);
      return cached;
    }
    
    try {
      const pool = await this.getPool();
      const result = await pool.request()
        .input('schemaName', sql.NVarChar, schemaName)
        .input('tableName', sql.NVarChar, tableName)
        .query(`
          SELECT 
            COLUMN_NAME as columnName,
            DATA_TYPE as dataType,
            IS_NULLABLE as isNullable,
            CHARACTER_MAXIMUM_LENGTH as maxLength
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = @schemaName AND TABLE_NAME = @tableName
          ORDER BY ORDINAL_POSITION
        `);
      
      // Store in cache
      this.schemaCache.set(cacheKey, result.recordset);
      this.schemaCacheExpiry.set(cacheKey, now + this.CACHE_TTL);
      console.log(`✅ Schema cached for ${cacheKey}`);
      
      return result.recordset;
    } catch (error) {
      console.error('Error getting table schema:', error);
      throw new Error('Failed to get table schema from SQL Server');
    }
  }

  async getTableData(
    schemaName: string,
    tableName: string,
    page: number = 1,
    pageSize: number = 10,
    searchTerm: string = '',
    sortBy: string = '',
    sortOrder: 'asc' | 'desc' = 'asc',
    filters: Record<string, string> = {}
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      const pool = await this.getPool();
      const offset = (page - 1) * pageSize;

      // Validate table and schema names to prevent SQL injection
      const validatedSchema = schemaName.replace(/[^a-zA-Z0-9_]/g, '');
      const validatedTable = tableName.replace(/[^a-zA-Z0-9_]/g, '');
      
      // Get table schema to build search conditions
      const schema = await this.getTableSchema(validatedSchema, validatedTable);
      const columns = schema.map(col => `[${col.columnName}]`).join(', ');
      
      // Build WHERE clause for search and filters
      let whereConditions: string[] = [];
      
      // Add search term conditions
      if (searchTerm && schema.length > 0) {
        const searchConditions = schema
          .filter(col => ['varchar', 'nvarchar', 'char', 'nchar', 'text', 'ntext'].includes(col.dataType.toLowerCase()))
          .map(col => `CAST([${col.columnName}] AS NVARCHAR(MAX)) LIKE @searchTerm`)
          .join(' OR ');
        
        if (searchConditions) {
          whereConditions.push(`(${searchConditions})`);
        }
      }
      
      // Add column filter conditions with LIKE for partial matching
      Object.entries(filters).forEach(([column, value]) => {
        if (value) {
          // Validate column exists in schema
          const columnExists = schema.some(col => col.columnName === column);
          if (columnExists) {
            // Use LIKE for partial matching
            whereConditions.push(`CAST([${column}] AS NVARCHAR(MAX)) LIKE @filter_${column}`);
          }
        }
      });
      
      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // Validate and build ORDER BY clause
      let orderByClause = '';
      if (sortBy) {
        const validatedSortBy = sortBy.replace(/[^a-zA-Z0-9_]/g, '');
        const validatedSortOrder = sortOrder === 'desc' ? 'DESC' : 'ASC';
        
        // Check if column exists
        const columnExists = schema.some(col => col.columnName === validatedSortBy);
        if (columnExists) {
          orderByClause = `ORDER BY [${validatedSortBy}] ${validatedSortOrder}`;
        }
      }
      
      // Default order by first column if no sort specified
      if (!orderByClause && schema.length > 0) {
        orderByClause = `ORDER BY [${schema[0].columnName}] ASC`;
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM [${validatedSchema}].[${validatedTable}]
        ${whereClause}
      `;

      const countRequest = pool.request();
      if (searchTerm) {
        countRequest.input('searchTerm', sql.NVarChar, `%${searchTerm}%`);
      }
      
      // Add filter parameters with wildcards for partial matching
      Object.entries(filters).forEach(([column, value]) => {
        if (value) {
          countRequest.input(`filter_${column}`, sql.NVarChar, `%${value}%`);
        }
      });
      
      const countResult = await countRequest.query(countQuery);
      const total = countResult.recordset[0].total;

      // Get paginated data
      const dataQuery = `
        SELECT ${columns}
        FROM [${validatedSchema}].[${validatedTable}]
        ${whereClause}
        ${orderByClause}
        OFFSET @offset ROWS
        FETCH NEXT @pageSize ROWS ONLY
      `;

      const dataRequest = pool.request()
        .input('offset', sql.Int, offset)
        .input('pageSize', sql.Int, pageSize);
      
      if (searchTerm) {
        dataRequest.input('searchTerm', sql.NVarChar, `%${searchTerm}%`);
      }
      
      // Add filter parameters with wildcards for partial matching
      Object.entries(filters).forEach(([column, value]) => {
        if (value) {
          dataRequest.input(`filter_${column}`, sql.NVarChar, `%${value}%`);
        }
      });

      const dataResult = await dataRequest.query(dataQuery);
      const totalPages = Math.ceil(total / pageSize);

      return {
        items: dataResult.recordset,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error('Error getting table data:', error);
      throw new Error('Failed to get table data from SQL Server');
    }
  }

  async getTableTotals(
    schemaName: string, 
    tableName: string, 
    numericColumns: string[],
    searchTerm: string = '',
    filters: Record<string, string> = {}
  ): Promise<Record<string, any>> {
    try {
      const pool = await this.getPool();
      
      // Validate schema and table names
      const validatedSchema = this.validateIdentifier(schemaName);
      const validatedTable = this.validateIdentifier(tableName);
      
      // Get table schema for building the WHERE clause
      const schema = await this.getTableSchema(validatedSchema, validatedTable);
      
      // Build WHERE clause for search and filters
      let whereConditions: string[] = [];
      
      if (searchTerm) {
        const searchableColumns = schema
          .filter(col => ['nvarchar', 'varchar', 'char', 'text'].some(type => 
            col.dataType.toLowerCase().includes(type)
          ))
          .map(col => `[${col.columnName}] LIKE @searchTerm`);
        
        if (searchableColumns.length > 0) {
          whereConditions.push(`(${searchableColumns.join(' OR ')})`);
        }
      }
      
      // Add filter conditions with LIKE for partial matching
      Object.entries(filters).forEach(([column, value]) => {
        if (value) {
          // Use LIKE for partial matching to be consistent with getTableData
          whereConditions.push(`CAST([${column}] AS NVARCHAR(MAX)) LIKE @filter_${column}`);
        }
      });
      
      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';
      
      // Build SELECT clause with SUM aggregations
      const selectClauses = numericColumns.map(col => 
        `SUM(CAST([${col}] AS FLOAT)) as [${col}]`
      );
      
      if (selectClauses.length === 0) {
        return {};
      }
      
      const query = `
        SELECT ${selectClauses.join(', ')}
        FROM [${validatedSchema}].[${validatedTable}]
        ${whereClause}
      `;
      
      const request = pool.request();
      
      if (searchTerm) {
        request.input('searchTerm', sql.NVarChar, `%${searchTerm}%`);
      }
      
      Object.entries(filters).forEach(([column, value]) => {
        if (value) {
          // Use wildcards for partial matching
          request.input(`filter_${column}`, sql.NVarChar, `%${value}%`);
        }
      });
      
      const result = await request.query(query);
      return result.recordset[0] || {};
    } catch (error) {
      console.error('Error getting table totals:', error);
      throw new Error('Failed to calculate table totals');
    }
  }

  async getGroupedData(
    schemaName: string,
    tableName: string,
    groupByColumns: string[],
    aggregations: Record<string, 'sum' | 'avg' | 'count' | 'min' | 'max'>,
    searchTerm: string = '',
    filters: Record<string, string> = {},
    sortBy: string = '',
    sortOrder: 'asc' | 'desc' = 'asc',
    page: number = 1,
    pageSize: number = 50
  ): Promise<any> {
    try {
      const pool = await this.getPool();
      
      // Validate schema and table names
      const validatedSchema = this.validateIdentifier(schemaName);
      const validatedTable = this.validateIdentifier(tableName);
      
      // Get table schema
      const schema = await this.getTableSchema(validatedSchema, validatedTable);
      
      // Build WHERE clause
      let whereConditions: string[] = [];
      
      if (searchTerm) {
        const searchableColumns = schema
          .filter(col => ['nvarchar', 'varchar', 'char', 'text'].some(type => 
            col.dataType.toLowerCase().includes(type)
          ))
          .map(col => `[${col.columnName}] LIKE @searchTerm`);
        
        if (searchableColumns.length > 0) {
          whereConditions.push(`(${searchableColumns.join(' OR ')})`);
        }
      }
      
      Object.entries(filters).forEach(([column, value]) => {
        if (value) {
          // Use LIKE for partial matching to be consistent with other methods
          whereConditions.push(`CAST([${column}] AS NVARCHAR(MAX)) LIKE @filter_${column}`);
        }
      });
      
      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';
      
      // Build GROUP BY clause
      const groupByClause = groupByColumns.map(col => `[${col}]`).join(', ');
      
      // Build SELECT clause with aggregations
      const selectClauses = [
        ...groupByColumns.map(col => `[${col}]`),
        ...Object.entries(aggregations).map(([col, aggType]) => {
          switch (aggType) {
            case 'sum':
              return `SUM(CAST([${col}] AS FLOAT)) as [${col}_sum]`;
            case 'avg':
              return `AVG(CAST([${col}] AS FLOAT)) as [${col}_avg]`;
            case 'count':
              return `COUNT([${col}]) as [${col}_count]`;
            case 'min':
              return `MIN([${col}]) as [${col}_min]`;
            case 'max':
              return `MAX([${col}]) as [${col}_max]`;
            default:
              return `SUM(CAST([${col}] AS FLOAT)) as [${col}_sum]`;
          }
        })
      ];
      
      // Build ORDER BY clause
      const orderByClause = sortBy 
        ? `ORDER BY [${sortBy}] ${sortOrder.toUpperCase()}`
        : groupByColumns.length > 0
        ? `ORDER BY ${groupByColumns.map(col => `[${col}]`).join(', ')}`
        : '';
      
      // Calculate offset
      const offset = (page - 1) * pageSize;
      
      // Get count of groups
      const countQuery = `
        SELECT COUNT(*) as total FROM (
          SELECT ${groupByColumns.map(col => `[${col}]`).join(', ')}
          FROM [${validatedSchema}].[${validatedTable}]
          ${whereClause}
          GROUP BY ${groupByClause}
        ) as grouped
      `;
      
      const countRequest = pool.request();
      if (searchTerm) {
        countRequest.input('searchTerm', sql.NVarChar, `%${searchTerm}%`);
      }
      Object.entries(filters).forEach(([column, value]) => {
        if (value) {
          countRequest.input(`filter_${column}`, sql.NVarChar, `%${value}%`);
        }
      });
      
      const countResult = await countRequest.query(countQuery);
      const total = countResult.recordset[0].total;
      
      // Get grouped data
      const dataQuery = `
        SELECT ${selectClauses.join(', ')}
        FROM [${validatedSchema}].[${validatedTable}]
        ${whereClause}
        GROUP BY ${groupByClause}
        ${orderByClause}
        OFFSET @offset ROWS
        FETCH NEXT @pageSize ROWS ONLY
      `;
      
      const dataRequest = pool.request()
        .input('offset', sql.Int, offset)
        .input('pageSize', sql.Int, pageSize);
      
      if (searchTerm) {
        dataRequest.input('searchTerm', sql.NVarChar, `%${searchTerm}%`);
      }
      Object.entries(filters).forEach(([column, value]) => {
        if (value) {
          dataRequest.input(`filter_${column}`, sql.NVarChar, `%${value}%`);
        }
      });
      
      const dataResult = await dataRequest.query(dataQuery);
      const totalPages = Math.ceil(total / pageSize);
      
      // Transform results into grouped format
      const groups = dataResult.recordset.map(row => {
        const groupValues: Record<string, any> = {};
        const aggregates: Record<string, any> = {};
        
        groupByColumns.forEach(col => {
          groupValues[col] = row[col];
        });
        
        Object.keys(aggregations).forEach(col => {
          const aggType = aggregations[col];
          aggregates[col] = row[`${col}_${aggType}`];
        });
        
        return {
          groupKey: groupByColumns.map(col => row[col]).join('_'),
          groupValues,
          aggregates,
          items: [], // Items would be fetched separately if needed
          expanded: false
        };
      });
      
      return {
        groups,
        total,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      console.error('Error getting grouped data:', error);
      throw new Error('Failed to get grouped data');
    }
  }
  
  private validateIdentifier(identifier: string): string {
    // Basic validation to prevent SQL injection
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
      throw new Error(`Invalid identifier: ${identifier}`);
    }
    return identifier;
  }

  async closePool(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      console.log('SQL Server connection pool closed');
    }
  }
}

export const sqlServerService = new SQLServerService();
