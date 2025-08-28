import { db } from './db';
import { sql } from 'drizzle-orm';
import { kanbanConfigs } from '@shared/schema';

async function seedOperations() {
  console.log('🌱 Seeding production operations...');
  
  // Create sample kanban board configuration for production jobs
  const sampleKanbanConfig = {
    name: "Production Jobs Board",
    description: "Kanban board for tracking production orders by status",
    viewType: "jobs",
    swimLaneField: "status",
    swimLaneColors: {
      "released": "#3b82f6", // Blue
      "in_progress": "#f59e0b", // Amber  
      "completed": "#10b981", // Green
      "cancelled": "#ef4444" // Red
    },
    filters: {
      priorities: [],
      statuses: ["released", "in_progress", "completed"],
      resources: [],
      capabilities: [],
      customers: [],
      dateRange: {
        from: null,
        to: null
      }
    },
    displayOptions: {
      showPriority: true,
      showDueDate: true,
      showCustomer: true,
      showResource: true,
      showProgress: true,
      cardSize: "standard" as const,
      groupBy: "none" as const
    },
    cardOrdering: {},
    isDefault: true
  };

  await db.insert(kanbanConfigs).values(sampleKanbanConfig).onConflictDoNothing();
  
  console.log('✅ Kanban board configuration created');
}

seedOperations().catch(console.error);
  