import { Agent } from '@/types/agents';

// Core Agents Configuration - Updated with all 8 active agents
export const CORE_AGENTS: Agent[] = [
  {
    id: 'max',
    name: 'max',
    displayName: 'Max',
    description: 'System-wide orchestrator and coordinator for all manufacturing operations',
    icon: 'Sparkles',
    color: '#8B5CF6', // purple
    specialties: [
      'System coordination',
      'Cross-functional analysis',
      'Strategic insights',
      'Agent orchestration'
    ],
    capabilities: [
      {
        id: 'orchestrate',
        name: 'Agent Orchestration',
        description: 'Coordinate multiple agents for complex manufacturing scenarios',
        inputTypes: ['natural_language', 'multi_domain_query'],
        outputTypes: ['coordination_plan', 'agent_assignments'],
        requiresData: ['all_systems']
      },
      {
        id: 'analyze_holistic',
        name: 'Holistic Analysis',
        description: 'Provide system-wide insights across all manufacturing domains',
        inputTypes: ['system_state', 'kpi_data'],
        outputTypes: ['strategic_recommendations', 'performance_insights'],
        requiresData: ['ptjobs', 'ptresources', 'ptmanufacturingorders']
      }
    ],
    status: 'active',
    priority: 1,
    department: 'orchestration'
  },
  {
    id: 'production_scheduling',
    name: 'production_scheduling',
    displayName: 'Production Scheduling Agent',
    description: 'Expert in production scheduling optimization, PlanetTogether APS concepts, Bryntum scheduler features, bottleneck management, and resource allocation',
    icon: 'Calendar',
    color: '#10B981', // emerald
    specialties: [
      'Schedule optimization',
      'Bottleneck analysis',
      'Resource allocation',
      'Constraint management',
      'ASAP/ALAP algorithms',
      'PlanetTogether concepts',
      'Bryntum scheduler',
      'APS best practices',
      'Finite capacity planning',
      'Pegging and constraints'
    ],
    capabilities: [
      {
        id: 'optimize_schedule',
        name: 'Schedule Optimization',
        description: 'Generate optimized production schedules using advanced algorithms',
        inputTypes: ['jobs', 'resources', 'constraints'],
        outputTypes: ['optimized_schedule', 'gantt_chart'],
        requiresData: ['ptjobs', 'ptjoboperations', 'ptresources', 'ptjobresources']
      },
      {
        id: 'analyze_bottlenecks',
        name: 'Bottleneck Analysis',
        description: 'Identify and analyze production bottlenecks with solutions',
        inputTypes: ['current_schedule', 'resource_utilization'],
        outputTypes: ['bottleneck_report', 'improvement_recommendations'],
        requiresData: ['ptjobs', 'ptresources', 'ptjoboperations']
      },
      {
        id: 'pt_expertise',
        name: 'PlanetTogether Expertise',
        description: 'Deep knowledge of PlanetTogether features, pegging, what-if scenarios',
        inputTypes: ['scheduling_questions', 'pt_concepts'],
        outputTypes: ['explanations', 'best_practices'],
        requiresData: ['ptjobs', 'ptjoboperations', 'ptresources']
      },
      {
        id: 'bryntum_support',
        name: 'Bryntum Scheduler Support',
        description: 'Help with Bryntum Scheduler Pro features and configuration',
        inputTypes: ['scheduler_issues', 'feature_questions'],
        outputTypes: ['solutions', 'configuration_guidance'],
        requiresData: []
      }
    ],
    status: 'active',
    priority: 2,
    department: 'operations'
  },
  {
    id: 'shop_floor',
    name: 'shop_floor',
    displayName: 'Shop Floor Agent',
    description: 'Real-time shop floor monitoring, event response, and operational decision support',
    icon: 'Factory',
    color: '#F59E0B', // amber
    specialties: [
      'Real-time monitoring',
      'Event response',
      'Operator assistance',
      'Equipment status',
      'Production tracking'
    ],
    capabilities: [
      {
        id: 'monitor_realtime',
        name: 'Real-time Monitoring',
        description: 'Monitor shop floor activities and equipment status in real-time',
        inputTypes: ['sensor_data', 'operator_input'],
        outputTypes: ['status_dashboard', 'alerts'],
        requiresData: ['ptresources', 'ptjoboperations', 'ptjobactivities']
      },
      {
        id: 'respond_events',
        name: 'Event Response',
        description: 'Analyze and respond to shop floor events with actionable recommendations',
        inputTypes: ['events', 'alarms', 'status_changes'],
        outputTypes: ['response_plan', 'escalation_alerts'],
        requiresData: ['ptjobs', 'ptjoboperations', 'ptresources']
      }
    ],
    status: 'active',
    priority: 3,
    department: 'operations'
  },
  {
    id: 'quality_management',
    name: 'quality_management',
    displayName: 'Quality Management Agent',
    description: 'Quality control monitoring, compliance tracking, and quality improvement initiatives',
    icon: 'Shield',
    color: '#EF4444', // red
    specialties: [
      'Quality control',
      'Compliance monitoring',
      'Defect analysis',
      'SPC tracking',
      'Regulatory compliance'
    ],
    capabilities: [
      {
        id: 'monitor_quality',
        name: 'Quality Monitoring',
        description: 'Monitor quality metrics and identify quality issues in real-time',
        inputTypes: ['inspection_data', 'test_results'],
        outputTypes: ['quality_dashboard', 'quality_alerts'],
        requiresData: ['ptjobs', 'ptjoboperations', 'ptmanufacturingorders']
      },
      {
        id: 'compliance_check',
        name: 'Compliance Verification',
        description: 'Verify compliance with quality standards and regulations',
        inputTypes: ['process_data', 'documentation'],
        outputTypes: ['compliance_report', 'corrective_actions'],
        requiresData: ['ptjobs', 'ptmanufacturingorders']
      }
    ],
    status: 'active',
    priority: 4,
    department: 'operations'
  },
  {
    id: 'predictive_maintenance',
    name: 'predictive_maintenance',
    displayName: 'Predictive Maintenance',
    description: 'Predictive maintenance, equipment health monitoring, and failure prevention',
    icon: 'Wrench',
    color: '#F97316', // orange
    specialties: [
      'Predictive analytics',
      'Equipment health monitoring',
      'Failure prediction',
      'Maintenance optimization',
      'Downtime prevention'
    ],
    capabilities: [
      {
        id: 'predict_failures',
        name: 'Failure Prediction',
        description: 'Predict equipment failures before they occur',
        inputTypes: ['sensor_data', 'maintenance_history'],
        outputTypes: ['failure_predictions', 'maintenance_recommendations'],
        requiresData: ['ptresources', 'maintenance_logs']
      },
      {
        id: 'optimize_maintenance',
        name: 'Maintenance Optimization',
        description: 'Optimize maintenance schedules to minimize downtime',
        inputTypes: ['equipment_data', 'production_schedule'],
        outputTypes: ['maintenance_schedule', 'cost_analysis'],
        requiresData: ['ptjobs', 'ptresources']
      }
    ],
    status: 'active',
    priority: 5,
    department: 'operations'
  },
  {
    id: 'demand_management',
    name: 'demand_management',
    displayName: 'Demand Management',
    description: 'Demand forecasting, trend analysis, and market intelligence',
    icon: 'TrendingUp',
    color: '#3B82F6', // blue
    specialties: ['Demand forecasting', 'Trend analysis', 'Market intelligence'],
    capabilities: [
      {
        id: 'forecast_demand',
        name: 'Demand Forecasting',
        description: 'Predict future demand based on historical data and market trends',
        inputTypes: ['sales_history', 'market_data'],
        outputTypes: ['demand_forecast', 'confidence_intervals'],
        requiresData: ['sales_orders', 'market_trends']
      }
    ],
    status: 'active',
    priority: 6,
    department: 'planning'
  },
  {
    id: 'supply_plan',
    name: 'supply_plan',
    displayName: 'Supply Planning',
    description: 'Production planning, procurement, and subcontract management',
    icon: 'Package',
    color: '#06B6D4', // cyan
    specialties: ['Production planning', 'Procurement', 'Subcontract management'],
    capabilities: [
      {
        id: 'plan_supply',
        name: 'Supply Planning',
        description: 'Optimize supply chain and procurement strategies',
        inputTypes: ['demand_forecast', 'inventory_levels'],
        outputTypes: ['supply_plan', 'procurement_schedule'],
        requiresData: ['ptmanufacturingorders', 'inventory']
      }
    ],
    status: 'active',
    priority: 7,
    department: 'planning'
  },
  {
    id: 'inventory_planning',
    name: 'inventory_planning',
    displayName: 'Inventory Planning',
    description: 'Stock optimization, inventory management, and supply coordination',
    icon: 'Layers',
    color: '#84CC16', // lime
    specialties: ['Stock optimization', 'Inventory management', 'ABC analysis'],
    capabilities: [
      {
        id: 'optimize_inventory',
        name: 'Inventory Optimization',
        description: 'Optimize inventory levels and reduce carrying costs',
        inputTypes: ['inventory_data', 'demand_forecast'],
        outputTypes: ['inventory_plan', 'reorder_points'],
        requiresData: ['inventory', 'ptmanufacturingorders']
      }
    ],
    status: 'active',
    priority: 8,
    department: 'planning'
  }
];

// Extended Agents - Future Phases
export const EXTENDED_AGENTS: Agent[] = [
  {
    id: 'capacity_planning',
    name: 'capacity_planning',
    displayName: 'Capacity Planning Agent',
    description: 'Resource allocation, workforce planning, and capacity optimization',
    icon: 'Target',
    color: '#EC4899', // pink
    specialties: ['Resource allocation', 'Workforce planning', 'Capacity optimization'],
    capabilities: [],
    status: 'idle',
    priority: 8,
    department: 'planning'
  },
  {
    id: 'maintenance_planning',
    name: 'maintenance_planning',
    displayName: 'Maintenance Planning Agent',
    description: 'Predictive maintenance, equipment optimization, and maintenance scheduling',
    icon: 'Wrench',
    color: '#F97316', // orange
    specialties: ['Predictive maintenance', 'Equipment optimization', 'Maintenance scheduling'],
    capabilities: [],
    status: 'idle',
    priority: 9,
    department: 'operations'
  },
  {
    id: 'supply_chain',
    name: 'supply_chain',
    displayName: 'Supply Chain Agent',
    description: 'Supplier management, logistics optimization, and supply network coordination',
    icon: 'Truck',
    color: '#8B5A2B', // brown
    specialties: ['Supplier management', 'Logistics optimization', 'Supply network coordination'],
    capabilities: [],
    status: 'idle',
    priority: 10,
    department: 'support'
  },
  {
    id: 'sales_service',
    name: 'sales_service',
    displayName: 'Sales & Service Agent',
    description: 'Order management, customer updates, and service coordination',
    icon: 'User',
    color: '#6366F1', // indigo
    specialties: ['Order management', 'Customer updates', 'Service coordination'],
    capabilities: [],
    status: 'idle',
    priority: 11,
    department: 'support'
  },
  {
    id: 'cost_optimization',
    name: 'cost_optimization',
    displayName: 'Cost Optimization Agent',
    description: 'Financial analysis, cost reduction strategies, and ROI optimization',
    icon: 'DollarSign',
    color: '#059669', // emerald-600
    specialties: ['Financial analysis', 'Cost reduction', 'ROI optimization'],
    capabilities: [],
    status: 'idle',
    priority: 12,
    department: 'support'
  },
  {
    id: 'it_agent',
    name: 'it_agent',
    displayName: 'IT Agent',
    description: 'Technology support, system oversight, and digital infrastructure management',
    icon: 'Monitor',
    color: '#7C3AED', // violet
    specialties: ['Technology support', 'System oversight', 'Infrastructure management'],
    capabilities: [],
    status: 'idle',
    priority: 13,
    department: 'support'
  }
];

export const ALL_AGENTS = [...CORE_AGENTS, ...EXTENDED_AGENTS];

// Agent utility functions
export const getAgentById = (id: string): Agent | undefined => {
  return ALL_AGENTS.find(agent => agent.id === id);
};

export const getActiveAgents = (): Agent[] => {
  return ALL_AGENTS.filter(agent => agent.status === 'active');
};

export const getAgentsByDepartment = (department: string): Agent[] => {
  return ALL_AGENTS.filter(agent => agent.department === department);
};

export const isAgentAvailable = (agentId: string): boolean => {
  const agent = getAgentById(agentId);
  return agent ? agent.status === 'active' : false;
};