import { db } from "./db";
import { capabilities, resources, jobs, operations } from "@shared/schema";

export async function seedDatabase() {
  console.log("Seeding database...");

  // Check if data already exists
  const existingCapabilities = await db.select().from(capabilities).limit(1);
  if (existingCapabilities.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  // Insert capabilities
  const capabilityData = [
    { name: "CNC Machining", description: "Computer numerical control machining operations" },
    { name: "Welding", description: "Arc welding and metal joining processes" },
    { name: "Assembly", description: "Component assembly and integration" },
    { name: "Quality Control", description: "Inspection and testing procedures" },
    { name: "Packaging", description: "Product packaging and labeling" }
  ];

  await db.insert(capabilities).values(capabilityData);

  // Insert resources
  const resourceData = [
    { name: "CNC-001", type: "Machine", status: "active", capabilities: [1] },
    { name: "CNC-002", type: "Machine", status: "active", capabilities: [1] },
    { name: "Welder-001", type: "Operator", status: "active", capabilities: [2] },
    { name: "Assembly-001", type: "Operator", status: "active", capabilities: [3] },
    { name: "QC-001", type: "Operator", status: "active", capabilities: [4] },
    { name: "Packaging-001", type: "Operator", status: "active", capabilities: [5] }
  ];

  await db.insert(resources).values(resourceData);

  // Insert jobs
  const jobData = [
    { 
      name: "Widget Assembly - Batch A", 
      customer: "Tech Corp", 
      priority: "high", 
      dueDate: new Date("2024-12-31"), 
      status: "active" 
    },
    { 
      name: "Motor Housing Production", 
      customer: "AutoParts Inc", 
      priority: "medium", 
      dueDate: new Date("2024-12-25"), 
      status: "active" 
    }
  ];

  await db.insert(jobs).values(jobData);

  // Insert operations
  const operationData = [
    {
      jobId: 1,
      name: "CNC Machining",
      description: "Machine widget base components",
      duration: 4,
      status: "active",
      requiredCapabilities: [1],
      order: 1,
      assignedResourceId: 1
    },
    {
      jobId: 1,
      name: "Welding",
      description: "Weld component joints",
      duration: 2,
      status: "pending",
      requiredCapabilities: [2],
      order: 2,
      assignedResourceId: 3
    },
    {
      jobId: 1,
      name: "Assembly",
      description: "Final widget assembly",
      duration: 3,
      status: "pending",
      requiredCapabilities: [3],
      order: 3,
      assignedResourceId: 4
    },
    {
      jobId: 2,
      name: "Housing Machining",
      description: "Machine motor housing",
      duration: 6,
      status: "active",
      requiredCapabilities: [1],
      order: 1,
      assignedResourceId: 2
    },
    {
      jobId: 2,
      name: "Quality Check",
      description: "Inspect housing dimensions",
      duration: 1,
      status: "pending",
      requiredCapabilities: [4],
      order: 2,
      assignedResourceId: 5
    }
  ];

  await db.insert(operations).values(operationData);

  console.log("Database seeding completed!");
}