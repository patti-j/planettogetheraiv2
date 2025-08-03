import { db } from "./db";
import { 
  users, plants, resources, unifiedWidgets,
  type InsertUser, type InsertPlant, type InsertResource, type InsertUnifiedWidget
} from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  console.log("Starting database seeding...");

  try {
    // Check if data already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    // Create sample users
    const sampleUsers: InsertUser[] = [
      {
        id: 1,
        username: "admin",
        email: "admin@company.com",
        fullName: "System Administrator",
        role: "admin",
        hashedPassword: "$2a$12$K4u7FP/p9rKJ8R9JlAO3..Wg3k4XJZY1JCqGFpfIiGm.iA2eIp.4O", // "admin123"
        isActive: true
      },
      {
        id: 2,
        username: "production_manager",
        email: "pm@company.com",
        fullName: "Production Manager",
        role: "production_manager",
        hashedPassword: "$2a$12$K4u7FP/p9rKJ8R9JlAO3..Wg3k4XJZY1JCqGFpfIiGm.iA2eIp.4O", // "admin123"
        isActive: true
      }
    ];

    for (const user of sampleUsers) {
      await db.insert(users).values(user);
    }
    console.log("✓ Created sample users");

    // Create sample plants
    const samplePlants: InsertPlant[] = [
      {
        id: 1,
        name: "Main Production Plant",
        location: "Austin, TX",
        address: "1234 Industrial Blvd, Austin, TX 78744",
        timezone: "America/Chicago",
        isActive: true
      },
      {
        id: 2,
        name: "Secondary Plant",
        location: "Dallas, TX",
        address: "5678 Manufacturing Dr, Dallas, TX 75201",
        timezone: "America/Chicago",
        isActive: true
      }
    ];

    for (const plant of samplePlants) {
      await db.insert(plants).values(plant);
    }
    console.log("✓ Created sample plants");

    // Create sample resources
    const sampleResources: InsertResource[] = [
      {
        id: 1,
        name: "CNC Machine 1",
        type: "machining_center",
        status: "active",
        capabilities: [1, 2, 3], // machining, drilling, milling
        isDrum: false
      },
      {
        id: 2,
        name: "Assembly Line A",
        type: "assembly_line",
        status: "active",
        capabilities: [4, 5], // assembly, packaging
        isDrum: true,
        drumDesignationDate: new Date(),
        drumDesignationReason: "Highest utilization and bottleneck",
        drumDesignationMethod: "automated"
      },
      {
        id: 3,
        name: "Quality Station 1",
        type: "inspection",
        status: "active",
        capabilities: [6], // quality_control
        isDrum: false
      }
    ];

    for (const resource of sampleResources) {
      await db.insert(resources).values(resource);
    }
    console.log("✓ Created sample resources");

    // Create sample widgets
    const sampleWidgets: InsertUnifiedWidget[] = [
      {
        title: "Production Overview",
        targetPlatform: "both",
        widgetType: "kpi",
        dataSource: "jobs",
        chartType: "number",
        aggregation: "count",
        size: { width: 300, height: 200 },
        position: { x: 0, y: 0 },
        createdBy: 1,
        category: "production",
        description: "Overview of production metrics"
      },
      {
        title: "Equipment Status",
        targetPlatform: "both",
        widgetType: "chart",
        dataSource: "resources",
        chartType: "bar",
        aggregation: "count",
        groupBy: "status",
        size: { width: 300, height: 200 },
        position: { x: 320, y: 0 },
        createdBy: 1,
        category: "equipment",
        description: "Current status of all equipment"
      },
      {
        title: "Quality Metrics",
        targetPlatform: "both",
        widgetType: "gauge",
        dataSource: "metrics",
        chartType: "gauge",
        aggregation: "avg",
        size: { width: 300, height: 200 },
        position: { x: 0, y: 220 },
        createdBy: 1,
        category: "quality",
        description: "Real-time quality metrics"
      },
      {
        title: "Mobile Production Status",
        targetPlatform: "mobile",
        widgetType: "list",
        dataSource: "jobs",
        aggregation: "count",
        size: { width: 350, height: 400 },
        position: { x: 0, y: 0 },
        createdBy: 1,
        category: "production",
        description: "Mobile-optimized production status"
      }
    ];

    for (const widget of sampleWidgets) {
      await db.insert(unifiedWidgets).values(widget);
    }
    console.log("✓ Created sample widgets");

    console.log("Database seeding completed successfully!");

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await seedDatabase();
  process.exit(0);
}