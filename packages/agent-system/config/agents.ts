// Agent Configuration - Simplified for federation
export interface Agent {
  id: string;
  displayName: string;
  specialization: string;
  icon: string;
  color: string;
  status: 'active' | 'inactive' | 'busy' | 'error';
  capabilities: string[];
}

export const MANUFACTURING_AGENTS: Agent[] = [
  {
    id: 'max',
    displayName: 'Max AI Assistant',
    specialization: 'General Manufacturing Intelligence',
    icon: '✨',
    color: '#3B82F6',
    status: 'active',
    capabilities: ['general_inquiry', 'data_analysis', 'report_generation']
  },
  {
    id: 'production_scheduling',
    displayName: 'Production Scheduling Agent',
    specialization: 'Advanced Production Planning & Scheduling',
    icon: '📊',
    color: '#059669',
    status: 'active',
    capabilities: ['production_planning', 'resource_optimization', 'schedule_analysis']
  },
  {
    id: 'inventory_planning',
    displayName: 'Inventory Planning Agent',
    specialization: 'Inventory Optimization & Demand Forecasting',
    icon: '📦',
    color: '#DC2626',
    status: 'active',
    capabilities: ['inventory_analysis', 'demand_forecasting', 'stock_optimization']
  }
];

export function getAgentWelcomeMessage(agent: Agent): string {
  const welcomeMessages: Record<string, string> = {
    max: "Hello! I'm Max, your AI assistant for manufacturing operations. I can help you with data analysis, generate reports, and answer questions about your production systems.",
    production_scheduling: "Hi! I'm your Production Scheduling specialist. I can optimize production schedules, analyze resource utilization, and help resolve scheduling conflicts.",
    inventory_planning: "Hello! I'm your Inventory Planning expert. I can analyze inventory levels, forecast demand, and optimize stock levels across your facilities."
  };
  
  return welcomeMessages[agent.id] || `Hello! I'm ${agent.displayName}, ready to assist you with ${agent.specialization.toLowerCase()}.`;
}