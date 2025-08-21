import { db } from '../db';
import { workspaceDashboards, plants, users } from '../../shared/schema';
import type { InsertWorkspaceDashboard } from '../../shared/schema';

// Sample workspace dashboards for different user roles
const sampleWorkspaceDashboards: Omit<InsertWorkspaceDashboard, 'plantId' | 'createdBy'>[] = [
  // Production Scheduler Dashboard
  {
    pageIdentifier: 'production-schedule',
    name: 'Production Scheduler Workspace',
    description: 'Optimized workspace for production scheduling and resource management',
    isActive: true,
    configuration: {
      layout: {
        type: 'grid',
        columns: 12,
        gap: 16,
        padding: 20
      },
      widgets: [
        {
          id: 'schedule-overview',
          type: 'chart',
          title: 'Schedule Overview',
          subtitle: 'Current production schedule status',
          position: { x: 0, y: 0, w: 6, h: 2 },
          configuration: {
            dataSource: 'production_orders',
            chartType: 'gantt',
            refreshInterval: 30000,
            customConfig: {
              showCriticalPath: true,
              showResourceConflicts: true,
              enableDragDrop: true
            }
          },
          isVisible: true
        },
        {
          id: 'resource-utilization',
          type: 'metric',
          title: 'Resource Utilization',
          subtitle: 'Current resource capacity usage',
          position: { x: 6, y: 0, w: 3, h: 2 },
          configuration: {
            dataSource: 'resources',
            metrics: ['utilization_percentage', 'available_capacity'],
            aggregation: 'average',
            refreshInterval: 15000,
            thresholds: [
              { value: 90, color: 'red', label: 'Critical' },
              { value: 75, color: 'yellow', label: 'High' },
              { value: 50, color: 'green', label: 'Normal' }
            ]
          },
          isVisible: true
        },
        {
          id: 'bottleneck-analysis',
          type: 'alert',
          title: 'Bottleneck Alerts',
          subtitle: 'Current production bottlenecks',
          position: { x: 9, y: 0, w: 3, h: 2 },
          configuration: {
            dataSource: 'bottleneck_analysis',
            filters: { severity: ['critical', 'high'] },
            refreshInterval: 60000
          },
          isVisible: true
        },
        {
          id: 'schedule-kpis',
          type: 'kpi',
          title: 'Schedule Performance',
          position: { x: 0, y: 2, w: 12, h: 1 },
          configuration: {
            dataSource: 'schedule_metrics',
            metrics: ['on_time_delivery', 'schedule_adherence', 'changeover_efficiency', 'capacity_utilization'],
            refreshInterval: 30000
          },
          isVisible: true
        }
      ],
      refreshInterval: 30000,
      autoRefresh: true,
      theme: 'professional'
    },
    isShared: true,
    sharedWithRoles: ['Scheduler', 'Production Manager', 'Planner']
  },

  // Plant Manager Dashboard
  {
    pageIdentifier: 'plant-overview',
    name: 'Plant Manager Executive Dashboard',
    description: 'High-level overview of plant operations and performance',
    isActive: true,
    configuration: {
      layout: {
        type: 'grid',
        columns: 12,
        gap: 20,
        padding: 24
      },
      widgets: [
        {
          id: 'plant-oee',
          type: 'metric',
          title: 'Overall Equipment Effectiveness',
          position: { x: 0, y: 0, w: 3, h: 2 },
          configuration: {
            dataSource: 'oee_metrics',
            metrics: ['overall_oee', 'availability', 'performance', 'quality'],
            aggregation: 'weighted_average',
            refreshInterval: 60000,
            thresholds: [
              { value: 85, color: 'green', label: 'World Class' },
              { value: 65, color: 'yellow', label: 'Average' },
              { value: 0, color: 'red', label: 'Below Average' }
            ]
          },
          isVisible: true
        },
        {
          id: 'production-output',
          type: 'chart',
          title: 'Production Output Trends',
          subtitle: 'Daily production vs targets',
          position: { x: 3, y: 0, w: 6, h: 2 },
          configuration: {
            dataSource: 'production_metrics',
            chartType: 'line',
            metrics: ['actual_output', 'planned_output', 'quality_output'],
            refreshInterval: 300000
          },
          isVisible: true
        },
        {
          id: 'cost-analysis',
          type: 'chart',
          title: 'Cost Performance',
          subtitle: 'Cost variance analysis',
          position: { x: 9, y: 0, w: 3, h: 2 },
          configuration: {
            dataSource: 'cost_metrics',
            chartType: 'waterfall',
            metrics: ['material_cost', 'labor_cost', 'overhead_cost', 'total_variance'],
            refreshInterval: 3600000
          },
          isVisible: true
        },
        {
          id: 'safety-metrics',
          type: 'kpi',
          title: 'Safety & Compliance',
          position: { x: 0, y: 2, w: 6, h: 1 },
          configuration: {
            dataSource: 'safety_metrics',
            metrics: ['days_without_incident', 'near_misses', 'safety_observations', 'compliance_score'],
            refreshInterval: 3600000
          },
          isVisible: true
        },
        {
          id: 'critical-alerts',
          type: 'alert',
          title: 'Critical Issues',
          position: { x: 6, y: 2, w: 6, h: 1 },
          configuration: {
            dataSource: 'alerts',
            filters: { severity: ['critical'], status: ['active', 'escalated'] },
            refreshInterval: 30000
          },
          isVisible: true
        }
      ],
      refreshInterval: 60000,
      autoRefresh: true,
      theme: 'executive'
    },
    isShared: true,
    sharedWithRoles: ['Plant Manager', 'Executive', 'Director']
  },

  // Quality Control Dashboard
  {
    pageIdentifier: 'quality-control',
    name: 'Quality Control Workspace',
    description: 'Quality monitoring and control dashboard',
    isActive: true,
    configuration: {
      layout: {
        type: 'grid',
        columns: 12,
        gap: 16,
        padding: 20
      },
      widgets: [
        {
          id: 'quality-trends',
          type: 'chart',
          title: 'Quality Trends',
          subtitle: 'First pass yield and defect rates',
          position: { x: 0, y: 0, w: 8, h: 2 },
          configuration: {
            dataSource: 'quality_metrics',
            chartType: 'combo',
            metrics: ['first_pass_yield', 'defect_rate', 'rework_rate'],
            refreshInterval: 60000
          },
          isVisible: true
        },
        {
          id: 'spc-charts',
          type: 'chart',
          title: 'Statistical Process Control',
          subtitle: 'Control charts for critical parameters',
          position: { x: 8, y: 0, w: 4, h: 2 },
          configuration: {
            dataSource: 'spc_data',
            chartType: 'control_chart',
            metrics: ['measurement_value', 'ucl', 'lcl', 'mean'],
            refreshInterval: 30000
          },
          isVisible: true
        },
        {
          id: 'inspection-queue',
          type: 'table',
          title: 'Pending Inspections',
          position: { x: 0, y: 2, w: 6, h: 2 },
          configuration: {
            dataSource: 'inspection_queue',
            filters: { status: 'pending' },
            refreshInterval: 60000
          },
          isVisible: true
        },
        {
          id: 'quality-alerts',
          type: 'alert',
          title: 'Quality Alerts',
          position: { x: 6, y: 2, w: 6, h: 2 },
          configuration: {
            dataSource: 'quality_alerts',
            filters: { type: 'quality_issue' },
            refreshInterval: 30000
          },
          isVisible: true
        }
      ],
      refreshInterval: 60000,
      autoRefresh: true,
      theme: 'quality'
    },
    isShared: true,
    sharedWithRoles: ['Quality Manager', 'Quality Inspector', 'QA Lead']
  },

  // Maintenance Supervisor Dashboard
  {
    pageIdentifier: 'maintenance',
    name: 'Maintenance Supervisor Dashboard',
    description: 'Equipment maintenance and reliability monitoring',
    isActive: true,
    configuration: {
      layout: {
        type: 'grid',
        columns: 12,
        gap: 16,
        padding: 20
      },
      widgets: [
        {
          id: 'equipment-status',
          type: 'table',
          title: 'Equipment Status',
          subtitle: 'Real-time equipment health',
          position: { x: 0, y: 0, w: 6, h: 2 },
          configuration: {
            dataSource: 'equipment_status',
            refreshInterval: 15000,
            customConfig: {
              showHealthIndicator: true,
              showMaintenanceSchedule: true
            }
          },
          isVisible: true
        },
        {
          id: 'maintenance-schedule',
          type: 'chart',
          title: 'Maintenance Schedule',
          subtitle: 'Planned vs actual maintenance',
          position: { x: 6, y: 0, w: 6, h: 2 },
          configuration: {
            dataSource: 'maintenance_schedule',
            chartType: 'timeline',
            refreshInterval: 300000
          },
          isVisible: true
        },
        {
          id: 'mtbf-mttr',
          type: 'kpi',
          title: 'Reliability Metrics',
          position: { x: 0, y: 2, w: 12, h: 1 },
          configuration: {
            dataSource: 'reliability_metrics',
            metrics: ['mtbf', 'mttr', 'availability', 'maintenance_cost'],
            refreshInterval: 3600000
          },
          isVisible: true
        },
        {
          id: 'breakdown-alerts',
          type: 'alert',
          title: 'Breakdown Alerts',
          position: { x: 0, y: 3, w: 12, h: 1 },
          configuration: {
            dataSource: 'maintenance_alerts',
            filters: { type: 'breakdown', status: 'active' },
            refreshInterval: 30000
          },
          isVisible: true
        }
      ],
      refreshInterval: 60000,
      autoRefresh: true,
      theme: 'maintenance'
    },
    isShared: true,
    sharedWithRoles: ['Maintenance Supervisor', 'Maintenance Technician', 'Reliability Engineer']
  },

  // Inventory Manager Dashboard
  {
    pageIdentifier: 'inventory',
    name: 'Inventory Manager Dashboard',
    description: 'Inventory levels and material flow monitoring',
    isActive: true,
    configuration: {
      layout: {
        type: 'grid',
        columns: 12,
        gap: 16,
        padding: 20
      },
      widgets: [
        {
          id: 'inventory-levels',
          type: 'chart',
          title: 'Inventory Levels',
          subtitle: 'Current stock by category',
          position: { x: 0, y: 0, w: 6, h: 2 },
          configuration: {
            dataSource: 'inventory_levels',
            chartType: 'bar',
            metrics: ['on_hand', 'safety_stock', 'reorder_point'],
            refreshInterval: 300000
          },
          isVisible: true
        },
        {
          id: 'material-flow',
          type: 'chart',
          title: 'Material Flow',
          subtitle: 'Inbound and outbound materials',
          position: { x: 6, y: 0, w: 6, h: 2 },
          configuration: {
            dataSource: 'material_flow',
            chartType: 'area',
            metrics: ['receipts', 'issues', 'net_flow'],
            refreshInterval: 300000
          },
          isVisible: true
        },
        {
          id: 'stockout-risk',
          type: 'alert',
          title: 'Stockout Risk',
          subtitle: 'Items at risk of stockout',
          position: { x: 0, y: 2, w: 4, h: 2 },
          configuration: {
            dataSource: 'inventory_alerts',
            filters: { type: 'stockout_risk' },
            refreshInterval: 60000
          },
          isVisible: true
        },
        {
          id: 'inventory-turns',
          type: 'metric',
          title: 'Inventory Turnover',
          position: { x: 4, y: 2, w: 4, h: 2 },
          configuration: {
            dataSource: 'inventory_metrics',
            metrics: ['turnover_ratio', 'days_on_hand'],
            refreshInterval: 3600000
          },
          isVisible: true
        },
        {
          id: 'aging-analysis',
          type: 'table',
          title: 'Aging Analysis',
          position: { x: 8, y: 2, w: 4, h: 2 },
          configuration: {
            dataSource: 'inventory_aging',
            refreshInterval: 3600000
          },
          isVisible: true
        }
      ],
      refreshInterval: 300000,
      autoRefresh: true,
      theme: 'inventory'
    },
    isShared: true,
    sharedWithRoles: ['Inventory Manager', 'Warehouse Manager', 'Supply Chain Manager']
  },

  // Production Operator Dashboard
  {
    pageIdentifier: 'operator-workstation',
    name: 'Operator Workstation',
    description: 'Simplified dashboard for production operators',
    isActive: true,
    configuration: {
      layout: {
        type: 'flex',
        columns: 2,
        gap: 20,
        padding: 16
      },
      widgets: [
        {
          id: 'current-job',
          type: 'custom',
          title: 'Current Job',
          position: { x: 0, y: 0, w: 2, h: 1 },
          configuration: {
            dataSource: 'current_job',
            customConfig: {
              showInstructions: true,
              showDrawings: true,
              showQualitySpecs: true
            },
            refreshInterval: 30000
          },
          isVisible: true
        },
        {
          id: 'job-progress',
          type: 'progress',
          title: 'Job Progress',
          position: { x: 0, y: 1, w: 1, h: 1 },
          configuration: {
            dataSource: 'job_progress',
            metrics: ['completion_percentage', 'pieces_completed', 'pieces_remaining'],
            refreshInterval: 15000
          },
          isVisible: true
        },
        {
          id: 'quality-checks',
          type: 'table',
          title: 'Quality Checkpoints',
          position: { x: 1, y: 1, w: 1, h: 1 },
          configuration: {
            dataSource: 'quality_checkpoints',
            refreshInterval: 60000
          },
          isVisible: true
        },
        {
          id: 'machine-status',
          type: 'metric',
          title: 'Machine Status',
          position: { x: 0, y: 2, w: 2, h: 1 },
          configuration: {
            dataSource: 'machine_status',
            metrics: ['status', 'speed', 'temperature', 'pressure'],
            refreshInterval: 5000
          },
          isVisible: true
        }
      ],
      refreshInterval: 30000,
      autoRefresh: true,
      theme: 'operator'
    },
    isShared: true,
    sharedWithRoles: ['Operator', 'Machine Operator', 'Production Worker']
  }
];

export async function seedWorkspaceDashboards() {
  try {
    console.log('Seeding workspace dashboards...');

    // Get the first plant and admin user for seeding
    const [plant] = await db.select().from(plants).limit(1);
    const [adminUser] = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);

    if (!plant || !adminUser) {
      console.log('No plant or admin user found. Skipping workspace dashboard seeding.');
      return;
    }

    // Insert sample workspace dashboards
    for (const dashboard of sampleWorkspaceDashboards) {
      const existingDashboard = await db
        .select()
        .from(workspaceDashboards)
        .where(
          and(
            eq(workspaceDashboards.pageIdentifier, dashboard.pageIdentifier),
            eq(workspaceDashboards.plantId, plant.id)
          )
        )
        .limit(1);

      if (existingDashboard.length === 0) {
        await db.insert(workspaceDashboards).values({
          ...dashboard,
          plantId: plant.id,
          createdBy: adminUser.id
        });
        console.log(`Created workspace dashboard: ${dashboard.name}`);
      }
    }

    // Create additional dashboards for other plants if they exist
    const allPlants = await db.select().from(plants);
    
    if (allPlants.length > 1) {
      // Create a subset of dashboards for other plants
      const essentialDashboards = sampleWorkspaceDashboards.slice(0, 3); // First 3 dashboards
      
      for (let i = 1; i < allPlants.length; i++) {
        const currentPlant = allPlants[i];
        
        for (const dashboard of essentialDashboards) {
          const existingDashboard = await db
            .select()
            .from(workspaceDashboards)
            .where(
              and(
                eq(workspaceDashboards.pageIdentifier, dashboard.pageIdentifier),
                eq(workspaceDashboards.plantId, currentPlant.id)
              )
            )
            .limit(1);

          if (existingDashboard.length === 0) {
            await db.insert(workspaceDashboards).values({
              ...dashboard,
              plantId: currentPlant.id,
              createdBy: adminUser.id,
              name: `${dashboard.name} - ${currentPlant.name}`
            });
            console.log(`Created workspace dashboard for plant ${currentPlant.name}: ${dashboard.name}`);
          }
        }
      }
    }

    console.log('Workspace dashboards seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding workspace dashboards:', error);
    throw error;
  }
}

// Import necessary functions
import { eq, and } from 'drizzle-orm';