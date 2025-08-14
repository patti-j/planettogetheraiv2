import express from 'express';
import { DatabaseStorage } from '../storage';
import { exportManufacturingDataToPT } from '../pt-export-utility';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Export manufacturing data to PT format
router.post('/export-to-pt', authenticateToken, async (req, res) => {
  try {
    const {
      includeHistoricalData = true,
      dateRangeStart,
      dateRangeEnd,
      plantIds,
      orderStatusFilter = ['planned', 'released', 'in_progress'],
      exportFormat = 'sql'
    } = req.body;

    console.log('🚀 Starting PT export request...');
    
    const options = {
      includeHistoricalData,
      dateRangeStart: dateRangeStart ? new Date(dateRangeStart) : undefined,
      dateRangeEnd: dateRangeEnd ? new Date(dateRangeEnd) : undefined,
      plantIds,
      orderStatusFilter,
      exportFormat
    };

    const storage = new DatabaseStorage();
    const result = await exportManufacturingDataToPT(storage, options);

    if (result.success) {
      console.log(`✅ PT export completed: ${result.recordsProcessed} records in ${result.duration}ms`);
      res.json({
        success: true,
        message: 'Manufacturing data successfully exported to PT format',
        recordsProcessed: result.recordsProcessed,
        duration: result.duration,
        exportSummary: {
          totalRecords: result.recordsProcessed,
          exportTime: `${(result.duration / 1000).toFixed(2)}s`,
          format: exportFormat,
          dateRange: dateRangeStart && dateRangeEnd ? {
            start: dateRangeStart,
            end: dateRangeEnd
          } : 'All data'
        }
      });
    } else {
      console.error('❌ PT export failed:', result.errors);
      res.status(500).json({
        success: false,
        message: 'PT export failed',
        errors: result.errors,
        recordsProcessed: result.recordsProcessed
      });
    }

  } catch (error) {
    console.error('❌ PT export API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during PT export',
      error: error.message
    });
  }
});

// Get PT export status and record counts
router.get('/export-status', authenticateToken, async (req, res) => {
  try {
    const storage = new DatabaseStorage();
    
    // Get current record counts from PT tables
    const ptTables = [
      'pt_plants',
      'pt_resources', 
      'pt_capabilities',
      'pt_items',
      'pt_routings',
      'pt_orders',
      'pt_operations'
    ];

    const recordCounts: Record<string, number> = {};
    
    for (const table of ptTables) {
      try {
        const result = await storage.executeQuery(`SELECT COUNT(*) as count FROM ${table}`);
        recordCounts[table] = parseInt(result[0]?.count || '0');
      } catch (error) {
        recordCounts[table] = 0; // Table might not exist yet
      }
    }

    // Get last export timestamp
    const lastExport = await storage.executeQuery(`
      SELECT created_at 
      FROM pt_plants 
      ORDER BY created_at DESC 
      LIMIT 1
    `).catch(() => []);

    res.json({
      success: true,
      ptTableCounts: recordCounts,
      totalPTRecords: Object.values(recordCounts).reduce((sum, count) => sum + count, 0),
      lastExportDate: lastExport[0]?.created_at || null,
      exportReady: recordCounts.pt_plants > 0
    });

  } catch (error) {
    console.error('❌ PT export status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get PT export status',
      error: error.message
    });
  }
});

// Clear PT tables (for testing/reset)
router.delete('/clear-pt-data', authenticateToken, async (req, res) => {
  try {
    const storage = new DatabaseStorage();
    
    const ptTables = [
      'pt_operations',
      'pt_orders',
      'pt_routing_operations', 
      'pt_routings',
      'pt_items',
      'pt_capabilities',
      'pt_resources',
      'pt_plants'
    ];

    let deletedRecords = 0;
    
    for (const table of ptTables) {
      try {
        const result = await storage.executeQuery(`DELETE FROM ${table}`);
        console.log(`🗑️ Cleared ${table}`);
      } catch (error) {
        console.warn(`⚠️ Could not clear ${table}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: 'PT data cleared successfully',
      clearedTables: ptTables
    });

  } catch (error) {
    console.error('❌ PT data clear error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear PT data',
      error: error.message
    });
  }
});

export default router;