import { Router } from 'express';
import sql from 'mssql';

const router = Router();

// SQL Server connection config from environment variables
const getSqlConfig = () => ({
  server: process.env.SQL_SERVER || '',
  database: process.env.SQL_DATABASE || '',
  user: process.env.SQL_USERNAME || '',
  password: process.env.SQL_PASSWORD || '',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
});

// Get list of tables from SQL Server
router.get('/tables', async (req, res) => {
  try {
    const pool = await sql.connect(getSqlConfig());
    const result = await pool.request().query(`
      SELECT 
        TABLE_SCHEMA as [schema],
        TABLE_NAME as name
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);
    
    res.json(result.recordset);
  } catch (error: any) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get columns for a specific table
router.get('/columns/:schema/:table', async (req, res) => {
  try {
    const { schema, table } = req.params;
    const pool = await sql.connect(getSqlConfig());
    
    const result = await pool.request()
      .input('schema', sql.VarChar, schema)
      .input('table', sql.VarChar, table)
      .query(`
        SELECT 
          COLUMN_NAME as name,
          DATA_TYPE as type
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = @table
        ORDER BY ORDINAL_POSITION
      `);
    
    res.json(result.recordset);
  } catch (error: any) {
    console.error('Error fetching columns:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get distinct items from a column
router.get('/items/:schema/:table/:column', async (req, res) => {
  try {
    const { schema, table, column } = req.params;
    const pool = await sql.connect(getSqlConfig());
    
    // Safely escape identifiers
    const tableName = `[${schema}].[${table}]`;
    const columnName = `[${column}]`;
    
    const result = await pool.request().query(`
      SELECT DISTINCT TOP 1000 ${columnName} as item
      FROM ${tableName}
      WHERE ${columnName} IS NOT NULL
      ORDER BY ${columnName}
    `);
    
    const items = result.recordset.map(r => r.item);
    res.json(items);
  } catch (error: any) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple moving average forecast
function simpleMovingAverage(data: number[], window: number = 7): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(data[i]);
    } else {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
  }
  return result;
}

// Calculate MAPE (Mean Absolute Percentage Error)
function calculateMAPE(actual: number[], predicted: number[]): number {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== 0) {
      sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
      count++;
    }
  }
  return count > 0 ? (sum / count) * 100 : 0;
}

// Calculate RMSE (Root Mean Squared Error)
function calculateRMSE(actual: number[], predicted: number[]): number {
  let sum = 0;
  for (let i = 0; i < actual.length; i++) {
    sum += Math.pow(actual[i] - predicted[i], 2);
  }
  return Math.sqrt(sum / actual.length);
}

// Generate forecast
router.post('/forecast', async (req, res) => {
  try {
    const { schema, table, dateColumn, itemColumn, quantityColumn, selectedItem, forecastDays } = req.body;
    
    if (!schema || !table || !dateColumn || !itemColumn || !quantityColumn || !selectedItem) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pool = await sql.connect(getSqlConfig());
    
    // Safely escape identifiers
    const tableName = `[${schema}].[${table}]`;
    const dateCol = `[${dateColumn}]`;
    const itemCol = `[${itemColumn}]`;
    const qtyCol = `[${quantityColumn}]`;
    
    // Fetch historical data
    const result = await pool.request()
      .input('item', sql.VarChar, selectedItem)
      .query(`
        SELECT 
          ${dateCol} as date,
          SUM(CAST(${qtyCol} AS FLOAT)) as value
        FROM ${tableName}
        WHERE ${itemCol} = @item
          AND ${dateCol} IS NOT NULL
          AND ${qtyCol} IS NOT NULL
        GROUP BY ${dateCol}
        ORDER BY ${dateCol}
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'No data found for selected item' });
    }

    // Format historical data
    const historical = result.recordset.map((r: any) => ({
      date: new Date(r.date).toISOString().split('T')[0],
      value: r.value
    }));

    // Apply simple moving average for smoothing
    const values = historical.map((h: any) => h.value);
    const smoothed = simpleMovingAverage(values, Math.min(7, values.length));
    
    // Calculate metrics on historical data
    const mape = calculateMAPE(values, smoothed);
    const rmse = calculateRMSE(values, smoothed);

    // Generate forecast using last trend
    const lastDate = new Date(historical[historical.length - 1].date);
    const lastValue = smoothed[smoothed.length - 1];
    
    // Calculate simple trend from last 30 days or available data
    const trendWindow = Math.min(30, values.length);
    const trendValues = values.slice(-trendWindow);
    const avgChange = trendValues.length > 1 
      ? (trendValues[trendValues.length - 1] - trendValues[0]) / trendValues.length
      : 0;

    const forecast = [];
    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      
      const forecastValue = Math.max(0, lastValue + (avgChange * i));
      const stdDev = Math.sqrt(rmse);
      
      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        value: forecastValue,
        lower: Math.max(0, forecastValue - (1.96 * stdDev)),
        upper: forecastValue + (1.96 * stdDev)
      });
    }

    res.json({
      historical,
      forecast,
      metrics: {
        mape,
        rmse
      }
    });

  } catch (error: any) {
    console.error('Error generating forecast:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
