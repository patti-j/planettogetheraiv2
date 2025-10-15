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
    sortOrder: 'asc' | 'desc' = 'asc'
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
      
      // Build WHERE clause for search
      let whereClause = '';
      if (searchTerm && schema.length > 0) {
        const searchConditions = schema
          .filter(col => ['varchar', 'nvarchar', 'char', 'nchar', 'text', 'ntext'].includes(col.dataType.toLowerCase()))
          .map(col => `CAST([${col.columnName}] AS NVARCHAR(MAX)) LIKE @searchTerm`)
          .join(' OR ');
        
        if (searchConditions) {
          whereClause = `WHERE ${searchConditions}`;
        }
      }

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

  async closePool(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      console.log('SQL Server connection pool closed');
    }
  }
}

export const sqlServerService = new SQLServerService();
