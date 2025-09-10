// PlanetTogether Module Federation Bootstrap
// Dynamic registration of all modules with lazy loading

import { federationRegistry, createModuleFactory } from './federation-registry';
import type {
  CorePlatformContract,
  AgentSystemContract,
  ProductionSchedulingContract,
  ShopFloorContract,
  QualityManagementContract,
  InventoryPlanningContract,
  AnalyticsReportingContract
} from './shared-components/contracts/module-contracts';

// Module dependency graph
const MODULE_DEPENDENCIES: Record<string, string[]> = {
  '@planettogether/shared-components': [],
  '@planettogether/core-platform': ['@planettogether/shared-components'],
  '@planettogether/agent-system': ['@planettogether/core-platform'],
  '@planettogether/production-scheduling': ['@planettogether/core-platform'],
  '@planettogether/shop-floor': ['@planettogether/production-scheduling'],
  '@planettogether/quality-management': ['@planettogether/shop-floor'],
  '@planettogether/inventory-planning': ['@planettogether/production-scheduling'],
  '@planettogether/analytics-reporting': [
    '@planettogether/quality-management',
    '@planettogether/inventory-planning'
  ]
};

// Bootstrap function to register all modules
export async function bootstrapFederation(): Promise<void> {
  console.log('[Bootstrap] Starting module federation bootstrap...');
  
  try {
    // Register Core Platform Module
    federationRegistry.register({
      metadata: {
        id: '@planettogether/core-platform',
        name: 'Core Platform',
        version: '1.0.0',
        dependencies: MODULE_DEPENDENCIES['@planettogether/core-platform'],
        contract: 'CorePlatformContract'
      },
      factory: createModuleFactory(async () => {
        const { corePlatformModule } = await import('./core-platform/CorePlatformModule');
        return corePlatformModule;
      })
    });

    // Register Agent System Module
    federationRegistry.register({
      metadata: {
        id: '@planettogether/agent-system',
        name: 'Agent System',
        version: '1.0.0',
        dependencies: MODULE_DEPENDENCIES['@planettogether/agent-system'],
        contract: 'AgentSystemContract'
      },
      factory: createModuleFactory(async () => {
        const { agentSystemModule } = await import('./agent-system/AgentSystemModule');
        return agentSystemModule;
      })
    });

    // Register Production Scheduling Module
    federationRegistry.register({
      metadata: {
        id: '@planettogether/production-scheduling',
        name: 'Production Scheduling',
        version: '1.0.0',
        dependencies: MODULE_DEPENDENCIES['@planettogether/production-scheduling'],
        contract: 'ProductionSchedulingContract'
      },
      factory: createModuleFactory(async () => {
        const { productionSchedulingModule } = await import('./production-scheduling');
        return productionSchedulingModule;
      })
    });

    // Register Shop Floor Module
    federationRegistry.register({
      metadata: {
        id: '@planettogether/shop-floor',
        name: 'Shop Floor',
        version: '1.0.0',
        dependencies: MODULE_DEPENDENCIES['@planettogether/shop-floor'],
        contract: 'ShopFloorContract'
      },
      factory: createModuleFactory(async () => {
        const { shopFloorModule } = await import('./shop-floor');
        return shopFloorModule;
      })
    });

    // Register Quality Management Module
    federationRegistry.register({
      metadata: {
        id: '@planettogether/quality-management',
        name: 'Quality Management',
        version: '1.0.0',
        dependencies: MODULE_DEPENDENCIES['@planettogether/quality-management'],
        contract: 'QualityManagementContract'
      },
      factory: createModuleFactory(async () => {
        const { qualityManagementModule } = await import('./quality-management');
        return qualityManagementModule;
      })
    });

    // Register Inventory Planning Module
    federationRegistry.register({
      metadata: {
        id: '@planettogether/inventory-planning',
        name: 'Inventory Planning',
        version: '1.0.0',
        dependencies: MODULE_DEPENDENCIES['@planettogether/inventory-planning'],
        contract: 'InventoryPlanningContract'
      },
      factory: createModuleFactory(async () => {
        const { inventoryPlanningModule } = await import('./inventory-planning');
        return inventoryPlanningModule;
      })
    });

    // Register Analytics Reporting Module
    federationRegistry.register({
      metadata: {
        id: '@planettogether/analytics-reporting',
        name: 'Analytics Reporting',
        version: '1.0.0',
        dependencies: MODULE_DEPENDENCIES['@planettogether/analytics-reporting'],
        contract: 'AnalyticsReportingContract'
      },
      factory: createModuleFactory(async () => {
        const { analyticsReportingModule } = await import('./analytics-reporting');
        return analyticsReportingModule;
      })
    });

    // Register Shared Components Module (stub for now)
    federationRegistry.register({
      metadata: {
        id: '@planettogether/shared-components',
        name: 'Shared Components',
        version: '1.0.0',
        dependencies: [],
        contract: 'SharedComponentsContract'
      },
      factory: createModuleFactory(async () => {
        // Stub implementation
        return {
          getAvailableComponents: () => [],
          renderComponent: () => null,
          getThemeColors: () => ({}),
          getComponentStyles: () => ({}),
          formatDate: (date: Date) => date.toLocaleDateString(),
          formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
          formatDuration: (minutes: number) => `${minutes} min`,
          exportToExcel: () => {},
          exportToPDF: () => {},
          initialize: async () => {},
          destroy: async () => {}
        };
      })
    });

    console.log('[Bootstrap] All modules registered successfully');
    
    // Initialize all modules in dependency order
    await federationRegistry.initializeAllModules();
    
    // Setup inter-module communication
    await setupInterModuleCommunication();
    
    console.log('[Bootstrap] Module federation bootstrap complete');
  } catch (error) {
    console.error('[Bootstrap] Failed to bootstrap federation:', error);
    throw error;
  }
}

// Setup inter-module communication and event flows
async function setupInterModuleCommunication(): Promise<void> {
  console.log('[Bootstrap] Setting up inter-module communication...');
  
  try {
    // Get module instances
    const schedulingModule = await federationRegistry.getModule<ProductionSchedulingContract>(
      '@planettogether/production-scheduling'
    );
    const shopFloorModule = await federationRegistry.getModule<ShopFloorContract>(
      '@planettogether/shop-floor'
    );
    const qualityModule = await federationRegistry.getModule<QualityManagementContract>(
      '@planettogether/quality-management'
    );
    const inventoryModule = await federationRegistry.getModule<InventoryPlanningContract>(
      '@planettogether/inventory-planning'
    );
    const analyticsModule = await federationRegistry.getModule<AnalyticsReportingContract>(
      '@planettogether/analytics-reporting'
    );

    // Connect Production Scheduling → Shop Floor
    schedulingModule.onJobStatusChange((job) => {
      console.log('[Bootstrap] Job status changed, notifying shop floor:', job.jobId);
      federationRegistry.emit('job:statusChanged', job, '@planettogether/shop-floor');
    });

    schedulingModule.onScheduleUpdate((schedule) => {
      console.log('[Bootstrap] Schedule updated, broadcasting to all modules');
      federationRegistry.broadcast({ type: 'schedule:updated', data: schedule });
    });

    // Connect Shop Floor → Quality Management
    shopFloorModule.onOperationStatusChange((operation) => {
      console.log('[Bootstrap] Operation status changed, notifying quality:', operation.operationId);
      if (operation.status === 'completed') {
        federationRegistry.emit('operation:readyForInspection', operation, '@planettogether/quality-management');
      }
    });

    // Connect Quality Management → Analytics
    qualityModule.onQualityAlert((alert) => {
      console.log('[Bootstrap] Quality alert raised, notifying analytics:', alert);
      federationRegistry.emit('quality:alert', alert, '@planettogether/analytics-reporting');
    });

    qualityModule.onInspectionComplete((inspection) => {
      console.log('[Bootstrap] Inspection complete, updating metrics');
      federationRegistry.emit('quality:inspectionComplete', inspection, '@planettogether/analytics-reporting');
    });

    // Connect Inventory Planning → Production Scheduling
    inventoryModule.onStockLevelChange((item) => {
      console.log('[Bootstrap] Stock level changed, checking production impact:', item.itemId);
      if (item.currentStock < item.minimumStock) {
        federationRegistry.emit('inventory:lowStock', item, '@planettogether/production-scheduling');
      }
    });

    inventoryModule.onReorderAlert((alert) => {
      console.log('[Bootstrap] Reorder alert, notifying scheduling:', alert);
      federationRegistry.emit('inventory:reorderRequired', alert, '@planettogether/production-scheduling');
    });

    // Setup global event listeners
    federationRegistry.subscribe('module:ready', (payload) => {
      console.log(`[Bootstrap] Module ${payload.moduleId} is ready`);
    });

    federationRegistry.subscribe('module:error', (payload) => {
      console.error(`[Bootstrap] Module error in ${payload.moduleId}:`, payload.error);
    });

    console.log('[Bootstrap] Inter-module communication setup complete');
  } catch (error) {
    console.error('[Bootstrap] Failed to setup inter-module communication:', error);
    throw error;
  }
}

// Helper function to get typed module instances
export async function getModule<T>(moduleId: string): Promise<T> {
  return federationRegistry.getModule<T>(moduleId);
}

// Helper to check module status
export function getModuleStatus(): Record<string, any> {
  return federationRegistry.getModuleStatus();
}

// Graceful shutdown
export async function shutdownFederation(): Promise<void> {
  console.log('[Bootstrap] Shutting down module federation...');
  await federationRegistry.shutdown();
  console.log('[Bootstrap] Module federation shutdown complete');
}

// Auto-bootstrap if this is the main module
if (typeof window !== 'undefined' && (window as any).__FEDERATION_BOOTSTRAP__) {
  bootstrapFederation().catch(error => {
    console.error('[Bootstrap] Auto-bootstrap failed:', error);
  });
}