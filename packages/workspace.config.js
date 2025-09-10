// PlanetTogether Workspace Configuration
// Defines the modular federation workspace structure

module.exports = {
  name: 'planettogether-federation',
  version: '1.0.0',
  
  // Package Manager Configuration
  packageManager: 'npm',
  
  // Workspace Structure
  workspaces: [
    'packages/*',
    'client',
    'server'
  ],
  
  // Module Federation Configuration
  federation: {
    shared: {
      // Shared React dependencies
      react: {
        singleton: true,
        eager: true,
        requiredVersion: '^18.0.0'
      },
      'react-dom': {
        singleton: true,
        eager: true,
        requiredVersion: '^18.0.0'
      },
      
      // Shared UI libraries
      '@radix-ui/react-slot': {
        singleton: true
      },
      'lucide-react': {
        singleton: true
      },
      
      // Shared utilities
      'date-fns': {
        singleton: true
      },
      'zod': {
        singleton: true
      }
    },
    
    // Module Remotes Configuration
    remotes: {
      'core-platform': '@planettogether/core-platform',
      'agent-system': '@planettogether/agent-system',
      'production-scheduling': '@planettogether/production-scheduling',
      'shop-floor': '@planettogether/shop-floor',
      'quality-management': '@planettogether/quality-management',
      'inventory-planning': '@planettogether/inventory-planning',
      'analytics-reporting': '@planettogether/analytics-reporting',
      'shared-components': '@planettogether/shared-components'
    },
    
    // Module Exposes Configuration
    exposes: {
      // Core Platform
      './CoreAuth': './packages/core-platform/services/auth.ts',
      './CoreNavigation': './packages/core-platform/services/navigation.ts',
      
      // Agent System
      './AgentManager': './packages/agent-system/agents/index.ts',
      './AgentComponents': './packages/agent-system/components/index.ts',
      
      // Production Scheduling
      './SchedulerComponents': './packages/production-scheduling/components/index.ts',
      './SchedulingAlgorithms': './packages/production-scheduling/algorithms/index.ts',
      
      // Shop Floor
      './ShopFloorComponents': './packages/shop-floor/components/index.ts',
      './RealtimeServices': './packages/shop-floor/realtime/index.ts',
      
      // Quality Management
      './QualityComponents': './packages/quality-management/components/index.ts',
      './QualityValidation': './packages/quality-management/validation/index.ts',
      
      // Inventory Planning
      './InventoryComponents': './packages/inventory-planning/components/index.ts',
      './ForecastingServices': './packages/inventory-planning/forecasting/index.ts',
      
      // Analytics
      './AnalyticsComponents': './packages/analytics-reporting/components/index.ts',
      './ChartComponents': './packages/analytics-reporting/charts/index.ts',
      './ExportServices': './packages/analytics-reporting/export/index.ts',
      
      // Shared Components
      './SharedTypes': './packages/shared-components/types/index.ts',
      './SharedComponents': './packages/shared-components/components/index.ts',
      './SharedUtils': './packages/shared-components/utils/index.ts'
    }
  },
  
  // Build Configuration
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: true,
    
    // Module-specific build settings
    modules: {
      'core-platform': {
        entry: './packages/core-platform/index.ts',
        library: 'CorePlatform',
        format: 'esm'
      },
      'agent-system': {
        entry: './packages/agent-system/index.ts',
        library: 'AgentSystem',
        format: 'esm'
      },
      'production-scheduling': {
        entry: './packages/production-scheduling/index.ts',
        library: 'ProductionScheduling',
        format: 'esm'
      },
      'shop-floor': {
        entry: './packages/shop-floor/index.ts',
        library: 'ShopFloor',
        format: 'esm'
      },
      'quality-management': {
        entry: './packages/quality-management/index.ts',
        library: 'QualityManagement',
        format: 'esm'
      },
      'inventory-planning': {
        entry: './packages/inventory-planning/index.ts',
        library: 'InventoryPlanning',
        format: 'esm'
      },
      'analytics-reporting': {
        entry: './packages/analytics-reporting/index.ts',
        library: 'AnalyticsReporting',
        format: 'esm'
      },
      'shared-components': {
        entry: './packages/shared-components/index.ts',
        library: 'SharedComponents',
        format: 'esm'
      }
    }
  },
  
  // Development Configuration
  dev: {
    port: 5001,
    hot: true,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  },
  
  // Testing Configuration
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  },
  
  // Linting Configuration
  lint: {
    extends: [
      '@typescript-eslint/recommended',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended'
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/react-in-jsx-scope': 'off'
    }
  },
  
  // Deployment Configuration
  deploy: {
    strategy: 'micro-frontends',
    registry: 'npm',
    domains: {
      production: 'https://app.planettogether.com',
      staging: 'https://staging.planettogether.com',
      development: 'http://localhost:5000'
    }
  }
};