import { Router } from 'express';
import sql from 'mssql';

const router = Router();

// Python ML service URL
// In production autoscale, the ML service cannot run on a separate port
// For development, it runs on localhost:8000
const ML_SERVICE_URL = process.env.NODE_ENV === 'production' 
  ? null  // ML service not available in autoscale deployment
  : 'http://localhost:8000';

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
    const { planningAreas, scenarios } = req.query;
    const pool = await sql.connect(getSqlConfig());
    
    // Safely escape identifiers
    const tableName = `[${schema}].[${table}]`;
    const columnName = `[${column}]`;
    
    // Build WHERE clause with filters
    let whereConditions = [`${columnName} IS NOT NULL`];
    
    // Add planning area filter ONLY if provided and not empty
    if (planningAreas && typeof planningAreas === 'string' && planningAreas.trim() !== '') {
      const planningAreaList = planningAreas.split(',').filter(area => area.trim() !== '');
      if (planningAreaList.length > 0) {
        const planningAreaCol = `[PlanningAreaName]`;
        const escapedAreas = planningAreaList.map(area => `'${area.replace(/'/g, "''")}'`).join(',');
        whereConditions.push(`${planningAreaCol} IN (${escapedAreas})`);
      }
    }
    
    // Add scenario filter ONLY if provided and not empty
    if (scenarios && typeof scenarios === 'string' && scenarios.trim() !== '') {
      const scenarioList = scenarios.split(',').filter(scenario => scenario.trim() !== '');
      if (scenarioList.length > 0) {
        const scenarioCol = `[ScenarioName]`;
        const escapedScenarios = scenarioList.map(scenario => `'${scenario.replace(/'/g, "''")}'`).join(',');
        whereConditions.push(`${scenarioCol} IN (${escapedScenarios})`);
      }
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const result = await pool.request().query(`
      SELECT DISTINCT TOP 1000 ${columnName} as item
      FROM ${tableName}
      WHERE ${whereClause}
      ORDER BY item
    `);
    
    const items = result.recordset.map(r => r.item);
    res.json(items);
  } catch (error: any) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get planning area and scenario combinations
router.get('/planning-scenario-combinations/:schema/:table', async (req, res) => {
  try {
    const { schema, table } = req.params;
    const pool = await sql.connect(getSqlConfig());
    
    // Check if columns exist first
    const columnsCheck = await pool.request()
      .input('schema', sql.VarChar, schema)
      .input('table', sql.VarChar, table)
      .query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @schema 
          AND TABLE_NAME = @table
          AND COLUMN_NAME IN ('PlanningAreaName', 'ScenarioName')
      `);
    
    const existingColumns = columnsCheck.recordset.map(r => r.COLUMN_NAME);
    
    // If both columns don't exist, return empty array
    if (!existingColumns.includes('PlanningAreaName') || !existingColumns.includes('ScenarioName')) {
      return res.json([]);
    }
    
    // Safely escape identifiers
    const tableName = `[${schema}].[${table}]`;
    
    const result = await pool.request().query(`
      SELECT DISTINCT 
        [PlanningAreaName] as planningArea,
        [ScenarioName] as scenario
      FROM ${tableName}
      WHERE [PlanningAreaName] IS NOT NULL 
        AND [ScenarioName] IS NOT NULL
      ORDER BY [PlanningAreaName], [ScenarioName]
    `);
    
    res.json(result.recordset);
  } catch (error: any) {
    console.error('Error fetching planning-scenario combinations:', error);
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

// Train model
router.post('/train', async (req, res) => {
  try {
    const { 
      schema, table, dateColumn, itemColumn, quantityColumn, selectedItems, modelType,
      planningAreaColumn, selectedPlanningAreas, scenarioColumn, selectedScenarios,
      hyperparameterTuning, forceRetrain
    } = req.body;
    
    // Support both single item (legacy) and multiple items
    const items = selectedItems || (req.body.selectedItem ? [req.body.selectedItem] : []);
    
    if (!schema || !table || !dateColumn || !itemColumn || !quantityColumn || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pool = await sql.connect(getSqlConfig());
    
    // Safely escape identifiers
    const tableName = `[${schema}].[${table}]`;
    const dateCol = `[${dateColumn}]`;
    const itemCol = `[${itemColumn}]`;
    const qtyCol = `[${quantityColumn}]`;
    
    // Fetch historical data for all selected items
    const itemsData: any = {};
    
    for (const item of items) {
      // Build WHERE clause with hierarchical filtering
      // Remove the ${qtyCol} IS NOT NULL filter to include all dates
      let whereConditions = [`${itemCol} = @item`, `${dateCol} IS NOT NULL`];
      
      // Add planning area filter
      if (planningAreaColumn && selectedPlanningAreas && selectedPlanningAreas.length > 0) {
        const planningAreaCol = `[${planningAreaColumn}]`;
        const planningAreaList = selectedPlanningAreas.map((area: string) => `'${area.replace(/'/g, "''")}'`).join(',');
        whereConditions.push(`${planningAreaCol} IN (${planningAreaList})`);
      }
      
      // Add scenario filter
      if (scenarioColumn && selectedScenarios && selectedScenarios.length > 0) {
        const scenarioCol = `[${scenarioColumn}]`;
        const scenarioList = selectedScenarios.map((scenario: string) => `'${scenario.replace(/'/g, "''")}'`).join(',');
        whereConditions.push(`${scenarioCol} IN (${scenarioList})`);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // Fetch historical data for this item, using ISNULL to convert NULL quantities to 0
      const result = await pool.request()
        .input('item', sql.VarChar, item)
        .query(`
          SELECT 
            ${dateCol} as date,
            SUM(ISNULL(CAST(${qtyCol} AS FLOAT), 0)) as value
          FROM ${tableName}
          WHERE ${whereClause}
          GROUP BY ${dateCol}
          ORDER BY ${dateCol}
        `);
      
      if (result.recordset.length > 0) {
        // Get min and max dates from the data
        const dates = result.recordset.map((r: any) => new Date(r.date));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        
        // Create a map for quick lookup of actual values
        const dataMap = new Map();
        result.recordset.forEach((r: any) => {
          const dateStr = new Date(r.date).toISOString().split('T')[0];
          dataMap.set(dateStr, r.value);
        });
        
        // Fill in all dates between min and max with zeros for missing days
        const filledData = [];
        const currentDate = new Date(minDate);
        
        while (currentDate <= maxDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          filledData.push({
            date: dateStr,
            value: dataMap.get(dateStr) || 0  // Use 0 for dates without data
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        itemsData[item] = filledData;
        console.log(`Loaded ${filledData.length} days of data for item ${item} (including ${filledData.filter(d => d.value === 0).length} zero-demand days)`);
      } else {
        console.log(`No data found for item: ${item}`);
      }
    }

    if (Object.keys(itemsData).length === 0) {
      return res.status(404).json({ error: 'No data found for any of the selected items' });
    }

    // Create unique model ID based on filters
    const modelId = `model_${selectedPlanningAreas?.join('_') || 'all'}_${selectedScenarios?.join('_') || 'all'}`;

    // Check if ML service is available
    if (!ML_SERVICE_URL) {
      return res.status(503).json({ 
        error: 'ML forecasting service is not available in production deployment. Please use development environment for ML training.' 
      });
    }

    // Call Python ML service to train models for all items
    const mlResponse = await fetch(`${ML_SERVICE_URL}/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelType: modelType || 'Random Forest',
        itemsData,  // Pass all items data
        modelId,
        // Database configuration for caching
        schema: schema,
        table: table,
        dateCol: dateColumn,
        itemCol: itemColumn,
        qtyCol: quantityColumn,
        // Filters and settings
        planningAreas: selectedPlanningAreas || [],
        scenarioNames: selectedScenarios || [],
        forecastDays: 30,
        hyperparameterTuning: hyperparameterTuning || false,
        // Cache control flag
        forceRetrain: forceRetrain || false
      })
    });

    if (!mlResponse.ok) {
      const error = await mlResponse.json();
      return res.status(mlResponse.status).json({ error: error.error || 'ML service error' });
    }

    const mlResult = await mlResponse.json();

    res.json({
      success: true,
      modelType: mlResult.modelType,
      overallMetrics: mlResult.overallMetrics,
      itemsResults: mlResult.itemsResults,
      totalItems: mlResult.totalItems,
      trainedItems: mlResult.trainedItems,
      trainedItemNames: mlResult.trainedItemNames,
      modelId,
      filters: {
        planningAreas: selectedPlanningAreas || [],
        scenarios: selectedScenarios || []
      }
    });

  } catch (error: any) {
    console.error('Error training model:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate forecast
router.post('/forecast', async (req, res) => {
  try {
    const { 
      schema, table, dateColumn, itemColumn, quantityColumn, selectedItems, forecastDays,
      modelType, modelId, planningAreaColumn, selectedPlanningAreas, scenarioColumn, selectedScenarios
    } = req.body;
    
    // Support both single item (legacy) and multiple items
    const items = selectedItems || (req.body.selectedItem ? [req.body.selectedItem] : []);
    
    if (!schema || !table || !dateColumn || !itemColumn || !quantityColumn || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Require modelId to ensure we use the trained model
    if (!modelId) {
      return res.status(400).json({ error: 'Model ID is required. Please train a model first.' });
    }

    const pool = await sql.connect(getSqlConfig());
    
    // Safely escape identifiers
    const tableName = `[${schema}].[${table}]`;
    const dateCol = `[${dateColumn}]`;
    const itemCol = `[${itemColumn}]`;
    const qtyCol = `[${quantityColumn}]`;
    
    // Fetch historical data for all selected items
    const itemsData: any = {};
    
    for (const item of items) {
      // Build WHERE clause with hierarchical filtering
      // Remove the ${qtyCol} IS NOT NULL filter to include all dates
      let whereConditions = [`${itemCol} = @item`, `${dateCol} IS NOT NULL`];
      
      // Add planning area filter
      if (planningAreaColumn && selectedPlanningAreas && selectedPlanningAreas.length > 0) {
        const planningAreaCol = `[${planningAreaColumn}]`;
        const planningAreaList = selectedPlanningAreas.map((area: string) => `'${area.replace(/'/g, "''")}'`).join(',');
        whereConditions.push(`${planningAreaCol} IN (${planningAreaList})`);
      }
      
      // Add scenario filter
      if (scenarioColumn && selectedScenarios && selectedScenarios.length > 0) {
        const scenarioCol = `[${scenarioColumn}]`;
        const scenarioList = selectedScenarios.map((scenario: string) => `'${scenario.replace(/'/g, "''")}'`).join(',');
        whereConditions.push(`${scenarioCol} IN (${scenarioList})`);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // Fetch historical data for this item, using ISNULL to convert NULL quantities to 0
      const result = await pool.request()
        .input('item', sql.VarChar, item)
        .query(`
          SELECT 
            ${dateCol} as date,
            SUM(ISNULL(CAST(${qtyCol} AS FLOAT), 0)) as value
          FROM ${tableName}
          WHERE ${whereClause}
          GROUP BY ${dateCol}
          ORDER BY ${dateCol}
        `);
      
      if (result.recordset.length > 0) {
        // Get min and max dates from the data
        const dates = result.recordset.map((r: any) => new Date(r.date));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        
        // Create a map for quick lookup of actual values
        const dataMap = new Map();
        result.recordset.forEach((r: any) => {
          const dateStr = new Date(r.date).toISOString().split('T')[0];
          dataMap.set(dateStr, r.value);
        });
        
        // Fill in all dates between min and max with zeros for missing days
        const filledData = [];
        const currentDate = new Date(minDate);
        
        while (currentDate <= maxDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          filledData.push({
            date: dateStr,
            value: dataMap.get(dateStr) || 0  // Use 0 for dates without data
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        itemsData[item] = filledData;
        console.log(`Loaded ${filledData.length} days of data for item ${item} (including ${filledData.filter(d => d.value === 0).length} zero-demand days)`);
      } else {
        console.log(`No historical data found for item: ${item}`);
      }
    }

    if (Object.keys(itemsData).length === 0) {
      return res.status(404).json({ error: 'No data found for any of the selected items' });
    }

    // Check if ML service is available
    if (!ML_SERVICE_URL) {
      return res.status(503).json({ 
        error: 'ML forecasting service is not available in production deployment. Please use development environment for ML forecasting.' 
      });
    }

    // Call Python ML service to generate forecast using the trained models
    const mlResponse = await fetch(`${ML_SERVICE_URL}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseModelId: modelId,  // Base model ID from training
        itemsData,  // Pass all items data
        forecastDays: forecastDays || 30,
        modelType: modelType || 'Random Forest',
        planningAreas: selectedPlanningAreas || [],
        scenarioNames: selectedScenarios || [],
        hyperparameterTuning: false
      })
    });

    if (!mlResponse.ok) {
      const error = await mlResponse.json();
      return res.status(mlResponse.status).json({ error: error.error || 'ML service error' });
    }

    const mlResult = await mlResponse.json();

    // Return multi-item forecast results
    res.json({
      success: true,
      overall: mlResult.overall,
      items: mlResult.items,
      totalItems: mlResult.totalItems,
      forecastedItems: mlResult.forecastedItems,
      forecastedItemNames: mlResult.forecastedItemNames,
      modelType: modelType,
      filters: {
        planningAreas: selectedPlanningAreas || [],
        scenarios: selectedScenarios || []
      }
    });

  } catch (error: any) {
    console.error('Error generating forecast:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
