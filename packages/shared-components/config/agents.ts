// Shared Agent Configuration
export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  inputTypes: string[];
  outputTypes: string[];
  requiresData: string[];
}

export interface Agent {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  specialties: string[];
  capabilities: AgentCapability[];
  status: 'active' | 'inactive' | 'busy' | 'error';
  priority: number;
  department: string;
}

// Core Agents Configuration - Centralized source of truth
export const MANUFACTURING_AGENTS: Agent[] = [
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
    description: 'Optimize production schedules, manage bottlenecks, and coordinate resource allocation',
    icon: 'Calendar',
    color: '#10B981', // emerald
    specialties: [
      'Schedule optimization',
      'Bottleneck analysis',
      'Resource allocation',
      'Constraint management',
      'ASAP/ALAP algorithms'
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
        description: 'Monitor quality metrics and compliance in real-time',
        inputTypes: ['quality_data', 'inspection_results'],
        outputTypes: ['quality_dashboard', 'compliance_report'],
        requiresData: ['ptjobs', 'quality_inspections', 'compliance_data']
      },
      {
        id: 'analyze_defects',
        name: 'Defect Analysis',
        description: 'Analyze defect patterns and recommend corrective actions',
        inputTypes: ['defect_data', 'process_parameters'],
        outputTypes: ['defect_analysis', 'corrective_actions'],
        requiresData: ['quality_inspections', 'ptjoboperations']
      }
    ],
    status: 'active',
    priority: 4,
    department: 'quality'
  },
  // Phase 2 agents (inactive by default)
  {
    id: 'inventory_planning',
    name: 'inventory_planning',
    displayName: 'Inventory Planning Agent',
    description: 'Demand forecasting, inventory optimization, and supply chain coordination',
    icon: 'Package',
    color: '#3B82F6', // blue
    specialties: ['Demand forecasting', 'Inventory optimization', 'Supply chain'],
    capabilities: [],
    status: 'inactive',
    priority: 5,
    department: 'supply_chain'
  },
  {
    id: 'demand_management',
    name: 'demand_management',
    displayName: 'Demand Management Agent',
    description: 'Customer demand analysis and demand-supply alignment',
    icon: 'TrendingUp',
    color: '#06B6D4', // cyan
    specialties: ['Demand analysis', 'Customer insights', 'Market trends'],
    capabilities: [],
    status: 'inactive',
    priority: 6,
    department: 'sales'
  },
  {
    id: 'supply_plan',
    name: 'supply_plan',
    displayName: 'Supply Plan Agent',
    description: 'Supply planning, procurement optimization, and supplier coordination',
    icon: 'Truck',
    color: '#8B5CF6', // purple
    specialties: ['Supply planning', 'Procurement', 'Supplier management'],
    capabilities: [],
    status: 'inactive',
    priority: 7,
    department: 'supply_chain'
  },
  {
    id: 'capacity_planning',
    name: 'capacity_planning',
    displayName: 'Capacity Planning Agent',
    description: 'Resource capacity analysis, expansion planning, and utilization optimization',
    icon: 'Briefcase',
    color: '#F59E0B', // amber
    specialties: ['Capacity analysis', 'Resource planning', 'Utilization optimization'],
    capabilities: [],
    status: 'inactive',
    priority: 8,
    department: 'operations'
  },
  {
    id: 'maintenance_planning',
    name: 'maintenance_planning',
    displayName: 'Maintenance Planning Agent',
    description: 'Predictive maintenance, asset management, and maintenance scheduling',
    icon: 'Wrench',
    color: '#EF4444', // red
    specialties: ['Predictive maintenance', 'Asset management', 'Maintenance scheduling'],
    capabilities: [],
    status: 'inactive',
    priority: 9,
    department: 'maintenance'
  },
  {
    id: 'supply_chain',
    name: 'supply_chain',
    displayName: 'Supply Chain Agent',
    description: 'End-to-end supply chain optimization and logistics coordination',
    icon: 'Network',
    color: '#10B981', // emerald
    specialties: ['Supply chain optimization', 'Logistics', 'Distribution'],
    capabilities: [],
    status: 'inactive',
    priority: 10,
    department: 'supply_chain'
  },
  {
    id: 'sales_service',
    name: 'sales_service',
    displayName: 'Sales & Service Agent',
    description: 'Customer relationship management and service optimization',
    icon: 'Users',
    color: '#3B82F6', // blue
    specialties: ['Customer management', 'Service optimization', 'Sales support'],
    capabilities: [],
    status: 'inactive',
    priority: 11,
    department: 'sales'
  },
  {
    id: 'cost_optimization',
    name: 'cost_optimization',
    displayName: 'Cost Optimization Agent',
    description: 'Financial optimization, cost analysis, and profitability enhancement',
    icon: 'DollarSign',
    color: '#059669', // emerald
    specialties: ['Cost analysis', 'Financial optimization', 'Profitability'],
    capabilities: [],
    status: 'inactive',
    priority: 12,
    department: 'finance'
  },
  {
    id: 'it_systems',
    name: 'it_systems',
    displayName: 'IT Systems Agent',
    description: 'System integration, data management, and technology optimization',
    icon: 'Server',
    color: '#6366F1', // indigo
    specialties: ['System integration', 'Data management', 'Technology optimization'],
    capabilities: [],
    status: 'inactive',
    priority: 13,
    department: 'technology'
  }
];

// Helper functions
export function getAgentById(agentId: string): Agent | undefined {
  return MANUFACTURING_AGENTS.find(agent => agent.id === agentId);
}

export function getActiveAgents(): Agent[] {
  return MANUFACTURING_AGENTS.filter(agent => agent.status === 'active');
}

export function getAgentsByDepartment(department: string): Agent[] {
  return MANUFACTURING_AGENTS.filter(agent => agent.department === department);
}

export function getAgentWelcomeMessage(agent: Agent): string {
  switch (agent.id) {
    case 'max':
      return "Hello! I'm Max, your system-wide coordinator. I can help orchestrate multiple agents and provide holistic insights across all manufacturing operations.";
    case 'production_scheduling':
      return "Hello! I'm your Production Scheduling Agent. I specialize in optimizing schedules, analyzing bottlenecks, and coordinating resource allocation.";
    case 'shop_floor':
      return "Hello! I'm your Shop Floor Agent. I monitor real-time operations, respond to events, and assist operators with decision support.";
    case 'quality_management':
      return "Hello! I'm your Quality Management Agent. I monitor quality metrics, track compliance, and analyze defect patterns.";
    default:
      return `Hello! I'm ${agent.displayName}. I'm currently in development and will be available soon.`;
  }
}