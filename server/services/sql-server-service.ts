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
    filters: Record<string, string> = {},
    distinct: boolean = false,
    selectedColumns: string[] = [],
    aggregationTypes: Record<string, 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none'> = {}
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
      
      // Detect numeric columns for aggregation
      const numericTypes = ['int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric', 'float', 'real', 'money', 'smallmoney'];
      const numericColumns = schema.filter(col => 
        numericTypes.some(type => col.dataType.toLowerCase().includes(type))
      ).map(col => col.columnName);
      
      const textColumns = schema.filter(col => 
        !numericTypes.some(type => col.dataType.toLowerCase().includes(type))
      ).map(col => col.columnName);
      
      // Build column list based on whether we're using aggregation
      let columns: string;
      let groupByColumns: string[] = [];
      
      if (distinct && selectedColumns.length > 0) {
        // When distinct is enabled, use GROUP BY with aggregation for numeric columns
        const selectedTextCols = selectedColumns.filter(col => textColumns.includes(col));
        const selectedNumericCols = selectedColumns.filter(col => numericColumns.includes(col));
        
        groupByColumns = selectedTextCols;
        
        // Build SELECT clause with aggregations
        const selectParts = [];
        
        // Add text columns (grouped)
        selectedTextCols.forEach(col => {
          selectParts.push(`[${col}]`);
        });
        
        // Add numeric columns with aggregation
        selectedNumericCols.forEach(col => {
          const aggType = aggregationTypes[col] || 'sum'; // Default to SUM
          if (aggType === 'none') {
            // Don't aggregate, treat as group by column
            selectParts.push(`[${col}]`);
            groupByColumns.push(col);
          } else {
            selectParts.push(`${aggType.toUpperCase()}([${col}]) as [${col}]`);
          }
        });
        
        columns = selectParts.join(', ');
      } else if (selectedColumns.length > 0) {
        // Regular column selection without aggregation
        columns = selectedColumns.filter(col => schema.some(s => s.columnName === col))
          .map(col => `[${col}]`).join(', ');
      } else {
        // All columns
        if (distinct) {
          // When distinct with no column selection, group by text columns and aggregate numeric ones
          groupByColumns = textColumns;
          
          const selectParts = [];
          textColumns.forEach(col => {
            selectParts.push(`[${col}]`);
          });
          
          numericColumns.forEach(col => {
            const aggType = aggregationTypes[col] || 'sum';
            if (aggType === 'none') {
              // Don't aggregate, treat as group by column
              selectParts.push(`[${col}]`);
              groupByColumns.push(col);
            } else {
              selectParts.push(`${aggType.toUpperCase()}([${col}]) as [${col}]`);
            }
          });
          
          columns = selectParts.join(', ');
        } else {
          columns = schema.map(col => `[${col.columnName}]`).join(', ');
        }
      }
      
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
        
        // Check if column exists in schema
        const columnExists = schema.some(col => col.columnName === validatedSortBy);
        
        // When using distinct with GROUP BY, check if column is in selected columns and groupByColumns
        if (distinct && groupByColumns.length > 0) {
          const isInSelectedColumns = selectedColumns.includes(validatedSortBy);
          const isInGroupBy = groupByColumns.includes(validatedSortBy);
          
          // Only allow ORDER BY for columns that are either in GROUP BY or aggregated (and selected)
          if (columnExists && isInSelectedColumns && (isInGroupBy || numericColumns.includes(validatedSortBy))) {
            orderByClause = `ORDER BY [${validatedSortBy}] ${validatedSortOrder}`;
          }
        } else if (columnExists) {
          // For non-aggregated queries, just check if column exists
          orderByClause = `ORDER BY [${validatedSortBy}] ${validatedSortOrder}`;
        }
      }
      
      // Build GROUP BY clause for aggregation
      const groupByClause = distinct && groupByColumns.length > 0
        ? `GROUP BY ${groupByColumns.map(col => `[${col}]`).join(', ')}`
        : '';
      
      // Default ORDER BY for pagination (SQL Server requires ORDER BY with OFFSET/FETCH)
      if (!orderByClause) {
        if (distinct && groupByColumns.length > 0) {
          // For aggregated queries, use first GROUP BY column
          orderByClause = `ORDER BY [${groupByColumns[0]}] ASC`;
        } else if (selectedColumns.length > 0) {
          // Use first selected column
          orderByClause = `ORDER BY [${selectedColumns[0]}] ASC`;
        } else if (schema.length > 0) {
          // Fallback to first schema column
          orderByClause = `ORDER BY [${schema[0].columnName}] ASC`;
        }
      }

      // Get total count
      let countQuery: string;
      if (distinct && groupByColumns.length > 0) {
        // Count grouped results
        countQuery = `
          SELECT COUNT(*) as total
          FROM (
            SELECT ${groupByColumns.map(col => `[${col}]`).join(', ')}
            FROM [${validatedSchema}].[${validatedTable}]
            ${whereClause}
            ${groupByClause}
          ) AS GroupedCount
        `;
      } else if (distinct) {
        // Fallback to DISTINCT if no grouping columns (shouldn't happen normally)
        countQuery = `
          SELECT COUNT(*) as total
          FROM (
            SELECT DISTINCT ${columns}
            FROM [${validatedSchema}].[${validatedTable}]
            ${whereClause}
          ) AS DistinctCount
        `;
      } else {
        // Regular count
        countQuery = `
          SELECT COUNT(*) as total
          FROM [${validatedSchema}].[${validatedTable}]
          ${whereClause}
        `;
      }

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
      let dataQuery: string;
      if (distinct && groupByColumns.length > 0) {
        // Use GROUP BY with aggregation
        dataQuery = `
          SELECT ${columns}
          FROM [${validatedSchema}].[${validatedTable}]
          ${whereClause}
          ${groupByClause}
          ${orderByClause}
          OFFSET @offset ROWS
          FETCH NEXT @pageSize ROWS ONLY
        `;
      } else if (distinct) {
        // Fallback to DISTINCT
        dataQuery = `
          SELECT DISTINCT ${columns}
          FROM [${validatedSchema}].[${validatedTable}]
          ${whereClause}
          ${orderByClause}
          OFFSET @offset ROWS
          FETCH NEXT @pageSize ROWS ONLY
        `;
      } else {
        // Regular query
        dataQuery = `
          SELECT ${columns}
          FROM [${validatedSchema}].[${validatedTable}]
          ${whereClause}
          ${orderByClause}
          OFFSET @offset ROWS
          FETCH NEXT @pageSize ROWS ONLY
        `;
      }

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
