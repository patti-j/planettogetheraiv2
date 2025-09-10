// Quality Management Module with Database Integration
import type { 
  QualityManagementContract,
  QualityInspection,
  KPIMetric,
  ApiResponse
} from '../shared-components/contracts/module-contracts';
import { ptTables, checkDatabaseHealth } from '../shared-components/database';

class QualityManagementModule implements QualityManagementContract {
  private name = 'quality-management';
  private alertCallbacks: Array<(alert: any) => void> = [];
  private inspectionCallbacks: Array<(inspection: QualityInspection) => void> = [];
  // Store inspections in memory (since no quality tables exist)
  private inspections: Map<number, QualityInspection> = new Map();
  private nextInspectionId = 1;

  async initialize(): Promise<void> {
    console.log('[QualityManagement] Module initializing...');
    
    // Check database connection
    const isHealthy = await checkDatabaseHealth();
    if (!isHealthy) {
      console.error('[QualityManagement] Database connection failed');
      throw new Error('Failed to connect to database');
    }
    
    console.log('[QualityManagement] Database connected successfully');
    console.log('[QualityManagement] Module initialized');
  }

  async destroy(): Promise<void> {
    console.log('[QualityManagement] Module destroying...');
    this.alertCallbacks = [];
    this.inspectionCallbacks = [];
    this.inspections.clear();
    console.log('[QualityManagement] Module destroyed');
  }

  // Inspection Management
  async getInspections(filters?: any): Promise<ApiResponse<QualityInspection[]>> {
    try {
      // Filter inspections from memory store
      let inspections = Array.from(this.inspections.values());
      
      if (filters) {
        if (filters.operationId) {
          inspections = inspections.filter(i => i.operationId === filters.operationId);
        }
        if (filters.status) {
          inspections = inspections.filter(i => i.status === filters.status);
        }
        if (filters.dateRange) {
          const start = new Date(filters.dateRange.start);
          const end = new Date(filters.dateRange.end);
          inspections = inspections.filter(i => 
            i.inspectionDate >= start && i.inspectionDate <= end
          );
        }
      }
      
      return { success: true, data: inspections };
    } catch (error) {
      console.error('[QualityManagement] Error fetching inspections:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch inspections' 
      };
    }
  }

  async createInspection(inspection: Omit<QualityInspection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<QualityInspection>> {
    try {
      const newInspection: QualityInspection = {
        ...inspection,
        id: this.nextInspectionId++,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.inspections.set(newInspection.id, newInspection);
      
      // Notify listeners
      if (inspection.status === 'completed') {
        this.notifyInspectionComplete(newInspection);
      }
      
      console.log('[QualityManagement] Inspection created:', newInspection.id);
      
      return { success: true, data: newInspection };
    } catch (error) {
      console.error('[QualityManagement] Error creating inspection:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create inspection' 
      };
    }
  }

  async updateInspectionResults(inspectionId: number, results: any[]): Promise<ApiResponse<QualityInspection>> {
    try {
      const inspection = this.inspections.get(inspectionId);
      
      if (!inspection) {
        return { success: false, error: 'Inspection not found' };
      }
      
      // Update inspection results
      inspection.results = results;
      inspection.status = 'completed';
      inspection.updatedAt = new Date();
      
      // Check for defects
      const hasDefects = results.some(r => r.passed === false);
      if (hasDefects) {
        this.notifyQualityAlert({
          inspectionId,
          operationId: inspection.operationId,
          message: 'Quality defects detected',
          severity: 'high',
          timestamp: new Date()
        });
      }
      
      // Notify completion
      this.notifyInspectionComplete(inspection);
      
      return { success: true, data: inspection };
    } catch (error) {
      console.error('[QualityManagement] Error updating inspection:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update inspection' 
      };
    }
  }

  // Quality Standards
  async getQualityStandards(itemType?: string): Promise<ApiResponse<any[]>> {
    try {
      // Return mock quality standards (would be from database in production)
      const standards = [
        {
          id: 1,
          name: 'Dimensional Tolerance',
          itemType: itemType || 'general',
          minValue: 0.95,
          maxValue: 1.05,
          unit: 'ratio',
          critical: true
        },
        {
          id: 2,
          name: 'Surface Finish',
          itemType: itemType || 'general',
          minValue: 0.8,
          maxValue: 1.2,
          unit: 'Ra',
          critical: false
        },
        {
          id: 3,
          name: 'Material Hardness',
          itemType: itemType || 'general',
          minValue: 55,
          maxValue: 65,
          unit: 'HRC',
          critical: true
        }
      ];
      
      return { success: true, data: standards };
    } catch (error) {
      console.error('[QualityManagement] Error fetching standards:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch standards' 
      };
    }
  }

  async validateQuality(operationId: number, measurements: any[]): Promise<ApiResponse<any>> {
    try {
      const standards = await this.getQualityStandards();
      if (!standards.success) {
        return { success: false, error: 'Failed to fetch standards' };
      }
      
      const validationResults = measurements.map(measurement => {
        const standard = standards.data?.find(s => s.name === measurement.name);
        if (!standard) {
          return { name: measurement.name, passed: true, reason: 'No standard defined' };
        }
        
        const passed = measurement.value >= standard.minValue && 
                      measurement.value <= standard.maxValue;
        
        return {
          name: measurement.name,
          value: measurement.value,
          passed,
          minValue: standard.minValue,
          maxValue: standard.maxValue,
          critical: standard.critical,
          reason: passed ? 'Within tolerance' : `Out of tolerance (${measurement.value})`
        };
      });
      
      const allPassed = validationResults.every(r => r.passed);
      
      return { 
        success: true, 
        data: {
          operationId,
          passed: allPassed,
          results: validationResults,
          timestamp: new Date()
        }
      };
    } catch (error) {
      console.error('[QualityManagement] Error validating quality:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to validate quality' 
      };
    }
  }

  // Quality Analytics
  async getQualityMetrics(plantId: number, dateRange: any): Promise<ApiResponse<KPIMetric[]>> {
    try {
      // Get operations from database
      const operations = await ptTables.getJobOperations({
        plantId,
        dateRange: {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        }
      });
      
      // Get inspections for the period
      const inspections = Array.from(this.inspections.values()).filter(i => 
        i.inspectionDate >= new Date(dateRange.start) && 
        i.inspectionDate <= new Date(dateRange.end)
      );
      
      // Calculate quality metrics
      const totalOperations = operations.length;
      const completedOperations = operations.filter(o => o.status === 'completed').length;
      const totalInspections = inspections.length;
      const passedInspections = inspections.filter(i => i.status === 'passed').length;
      const failedInspections = inspections.filter(i => i.status === 'failed').length;
      
      const metrics: KPIMetric[] = [
        {
          id: 'quality-rate',
          name: 'Quality Rate',
          value: totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 100,
          unit: '%',
          target: 98,
          trend: 'stable',
          category: 'quality',
          timestamp: new Date()
        },
        {
          id: 'first-pass-yield',
          name: 'First Pass Yield',
          value: completedOperations > 0 ? (passedInspections / completedOperations) * 100 : 0,
          unit: '%',
          target: 95,
          trend: 'up',
          category: 'quality',
          timestamp: new Date()
        },
        {
          id: 'defect-rate',
          name: 'Defect Rate',
          value: totalInspections > 0 ? (failedInspections / totalInspections) * 100 : 0,
          unit: '%',
          target: 2,
          trend: 'down',
          category: 'quality',
          timestamp: new Date()
        },
        {
          id: 'inspection-coverage',
          name: 'Inspection Coverage',
          value: completedOperations > 0 ? (totalInspections / completedOperations) * 100 : 0,
          unit: '%',
          target: 100,
          trend: 'stable',
          category: 'quality',
          timestamp: new Date()
        }
      ];
      
      return { success: true, data: metrics };
    } catch (error) {
      console.error('[QualityManagement] Error calculating metrics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to calculate metrics' 
      };
    }
  }

  async getDefectAnalysis(dateRange: any): Promise<ApiResponse<any>> {
    try {
      // Get failed inspections
      const failedInspections = Array.from(this.inspections.values()).filter(i => 
        i.status === 'failed' &&
        i.inspectionDate >= new Date(dateRange.start) && 
        i.inspectionDate <= new Date(dateRange.end)
      );
      
      // Analyze defect patterns
      const defectTypes = new Map<string, number>();
      const defectsByOperation = new Map<number, number>();
      
      failedInspections.forEach(inspection => {
        // Count defect types
        if (inspection.results) {
          inspection.results.forEach((result: any) => {
            if (!result.passed) {
              const count = defectTypes.get(result.name) || 0;
              defectTypes.set(result.name, count + 1);
            }
          });
        }
        
        // Count by operation
        const opCount = defectsByOperation.get(inspection.operationId) || 0;
        defectsByOperation.set(inspection.operationId, opCount + 1);
      });
      
      // Convert to arrays for response
      const topDefects = Array.from(defectTypes.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      const problematicOperations = Array.from(defectsByOperation.entries())
        .map(([operationId, count]) => ({ operationId, defectCount: count }))
        .sort((a, b) => b.defectCount - a.defectCount)
        .slice(0, 5);
      
      return { 
        success: true, 
        data: {
          totalDefects: failedInspections.length,
          topDefects,
          problematicOperations,
          defectRate: (failedInspections.length / Array.from(this.inspections.values()).length) * 100,
          dateRange
        }
      };
    } catch (error) {
      console.error('[QualityManagement] Error analyzing defects:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to analyze defects' 
      };
    }
  }

  // Events
  onQualityAlert(callback: (alert: any) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) this.alertCallbacks.splice(index, 1);
    };
  }

  onInspectionComplete(callback: (inspection: QualityInspection) => void): () => void {
    this.inspectionCallbacks.push(callback);
    return () => {
      const index = this.inspectionCallbacks.indexOf(callback);
      if (index > -1) this.inspectionCallbacks.splice(index, 1);
    };
  }
  // Private methods
  private notifyQualityAlert(alert: any) {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('[QualityManagement] Error in alert callback:', error);
      }
    });
  }

  private notifyInspectionComplete(inspection: QualityInspection) {
    this.inspectionCallbacks.forEach(callback => {
      try {
        callback(inspection);
      } catch (error) {
        console.error('[QualityManagement] Error in inspection callback:', error);
      }
    });
  }
}

// Export singleton instance
export const qualityManagementModule = new QualityManagementModule();
export default qualityManagementModule;