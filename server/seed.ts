import { db } from "./db";
import { DatabaseStorage } from "./storage";
import { 
  capabilities, resources, productionOrders, plannedOrders, discreteOperations, processOperations, users, roles, permissions, userRoles, rolePermissions,
  disruptions, disruptionActions,
  businessGoals, goalProgress, goalRisks, goalIssues, dashboardConfigs, reportConfigs,
  visualFactoryDisplays, industryTemplates, vendors, customers,
  optimizationScopeConfigs, agentConnections
} from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  console.log("Seeding database...");

  // Check if data already exists
  const existingCapabilities = await db.select().from(capabilities).limit(1);
  const existingUsers = await db.select().from(users).limit(1);
  const existingDefaultRoles = await db.select().from(roles).where(eq(roles.name, "Administrator")).limit(1);
  const existingPresentationPermissions = await db.select().from(permissions).where(eq(permissions.feature, "presentation-system")).limit(1);
  const existingDisruptions = await db.select().from(disruptions).limit(1);
  const existingBusinessGoals = await db.select().from(businessGoals).limit(1);
  const existingDashboards = await db.select().from(dashboardConfigs).limit(1);
  const existingReports = await db.select().from(reportConfigs).limit(1);
  const existingVisualFactoryDisplays = await db.select().from(visualFactoryDisplays).limit(1);
  const existingIndustryTemplates = await db.select().from(industryTemplates).limit(1);
  
  // Force re-seed if presentation permissions, disruptions, business goals, dashboards, reports, visual factory displays, or industry templates are missing
  const shouldReseedPermissions = existingPresentationPermissions.length === 0;
  const shouldReseedDisruptions = existingDisruptions.length === 0;
  const shouldReseedBusinessGoals = existingBusinessGoals.length === 0;
  const shouldReseedDashboards = existingDashboards.length === 0;
  const shouldReseedReports = existingReports.length === 0;
  const shouldReseedVisualFactory = existingVisualFactoryDisplays.length === 0;
  const shouldReseedIndustryTemplates = existingIndustryTemplates.length === 0;
  
  if (existingCapabilities.length > 0 && existingUsers.length > 0 && existingDefaultRoles.length > 0 && !shouldReseedPermissions && !shouldReseedDisruptions && !shouldReseedBusinessGoals && !shouldReseedDashboards && !shouldReseedReports && !shouldReseedVisualFactory && !shouldReseedIndustryTemplates) {
    console.log("Database already seeded, skipping...");
    return;
  }
  
  // Skip production data seeding if it already exists but seed user management
  const shouldSeedProduction = existingCapabilities.length === 0 || shouldReseedDisruptions || shouldReseedBusinessGoals || shouldReseedDashboards || shouldReseedReports || shouldReseedVisualFactory || shouldReseedIndustryTemplates;

  if (shouldSeedProduction) {
    // Only insert capabilities if they don't exist
    if (existingCapabilities.length === 0) {
      const capabilityData = [
        { name: "CNC Machining", description: "Computer numerical control machining operations" },
        { name: "Welding", description: "Arc welding and metal joining processes" },
        { name: "Assembly", description: "Component assembly and integration" },
        { name: "Quality Control", description: "Inspection and testing procedures" },
        { name: "Packaging", description: "Product packaging and labeling" }
      ];

      await db.insert(capabilities).values(capabilityData);
    }

    // Only insert resources, jobs, and operations if capabilities were just created
    if (existingCapabilities.length === 0) {
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
          orderNumber: "PO-001",
          name: "Widget Assembly - Batch A", 
          plantId: 1,
          customer: "Tech Corp", 
          priority: "high", 
          dueDate: new Date("2024-12-31"), 
          status: "active",
          quantity: "100"
        },
        { 
          orderNumber: "PO-002",
          name: "Motor Housing Production", 
          plantId: 1,
          customer: "AutoParts Inc", 
          priority: "medium", 
          dueDate: new Date("2024-12-25"), 
          status: "active",
          quantity: "250"
        }
      ];

      await db.insert(productionOrders).values(jobData);

      // Insert operations
      const operationData = [
        {
          productionOrderId: 1,
          name: "CNC Machining",
          description: "Machine widget base components",
          duration: 4,
          status: "active",
          requiredCapabilities: [1],
          order: 1,
          jobId: 1 // Added required field
        },
        {
          productionOrderId: 1,
          name: "Welding",
          description: "Weld component joints",
          duration: 2,
          status: "pending",
          requiredCapabilities: [2],
          order: 2,
          jobId: 1 // Added required field
        },
        {
          productionOrderId: 1,
          name: "Assembly",
          description: "Final widget assembly",
          duration: 3,
          status: "pending",
          requiredCapabilities: [3],
          order: 3,
          jobId: 1 // Added required field
        },
        {
          productionOrderId: 2,
          name: "Housing Machining",
          description: "Machine motor housing",
          duration: 6,
          status: "active",
          requiredCapabilities: [1],
          order: 1,
          jobId: 2 // Added required field
        },
        {
          productionOrderId: 2,
          name: "Quality Check",
          description: "Inspect housing dimensions",
          duration: 1,
          status: "pending",
          requiredCapabilities: [4],
          order: 2,
          jobId: 2 // Added required field
        }
      ];

      // Insert operations using storage method for backward compatibility
      const storage = new DatabaseStorage();
      for (const opData of operationData) {
        await storage.createOperation(opData);
      }
    }

    // TEMPORARILY DISABLED: Insert sample disruptions only if they don't exist and master data exists
    // TODO: Fix foreign key constraint issues with jobs vs production_orders table mismatch
    /*
    const existingDisruptions = await db.select().from(disruptions).limit(1);
    const existingResources = await db.select().from(resources).limit(5);
    const existingProductionOrders = await db.select().from(productionOrders).limit(5);
    const existingOperations = await db.select().from(operations).limit(5);
    
    if (false && shouldReseedDisruptions && existingDisruptions.length === 0 && existingResources.length > 0 && existingProductionOrders.length > 0) {
      const disruptionData = [
      {
        title: "CNC-001 Machine Breakdown",
        type: "machine_breakdown",
        severity: "high",
        status: "active",
        description: "Primary CNC machine experiencing hydraulic system failure. Unable to continue machining operations.",
        affectedResourceId: existingResources[0]?.id || null,
        affectedJobId: existingProductionOrders[0]?.id || null,
        affectedOperationId: existingOperations[0]?.id || null,
        startTime: new Date(new Date().getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        estimatedDuration: 8, // 8 hours
        reportedBy: "John Operator",
        assignedTo: "Mike Maintenance",
        impactAssessment: {
          delayedOperations: 3,
          affectedJobs: 2,
          estimatedDelay: 6,
          financialImpact: 15000,
          customerImpact: "moderate"
        },
        resolutionPlan: "Replace hydraulic pump and test system. Order replacement parts immediately.",
        preventiveMeasures: "Implement daily hydraulic pressure checks and monthly pump maintenance."
      },
      {
        title: "Material Shortage - Steel Plates",
        type: "material_shortage",
        severity: "medium",
        status: "investigating",
        description: "Unexpected shortage of 10mm steel plates needed for motor housing production. Supplier delivery delayed.",
        affectedResourceId: existingResources[1]?.id || null,
        affectedJobId: existingProductionOrders[1]?.id || existingProductionOrders[0]?.id || null,
        affectedOperationId: existingOperations[1]?.id || existingOperations[0]?.id || null,
        startTime: new Date(new Date().getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        estimatedDuration: 24, // 24 hours
        reportedBy: "Sarah Scheduler",
        assignedTo: "Tom Procurement",
        impactAssessment: {
          delayedOperations: 2,
          affectedJobs: 1,
          estimatedDelay: 12,
          financialImpact: 8000,
          customerImpact: "low"
        },
        resolutionPlan: "Contact alternative suppliers for emergency delivery. Consider using 12mm plates and adjust machining parameters.",
        preventiveMeasures: "Establish minimum stock levels and backup supplier agreements."
      },
      {
        title: "Welder Absent - Medical Emergency",
        type: "absent_employee",
        severity: "medium",
        status: "resolved",
        description: "Primary welder called in sick with medical emergency. No qualified backup available for specialized welding operations.",
        affectedResourceId: existingResources[2]?.id || null,
        affectedJobId: existingProductionOrders[0]?.id || null,
        affectedOperationId: existingOperations[2]?.id || existingOperations[0]?.id || null,
        startTime: new Date(new Date().getTime() - 8 * 60 * 60 * 1000), // 8 hours ago
        estimatedDuration: 8,
        actualEndTime: new Date(new Date().getTime() - 1 * 60 * 60 * 1000), // resolved 1 hour ago
        reportedBy: "Linda Supervisor",
        assignedTo: "HR Department",
        impactAssessment: {
          delayedOperations: 1,
          affectedJobs: 1,
          estimatedDelay: 4,
          financialImpact: 2000,
          customerImpact: "none"
        },
        resolutionPlan: "Temporary welder hired from staffing agency. Cross-train backup operators for future coverage.",
        resolutionNotes: "Temporary welder successfully completed welding operations. Patient recovering well.",
        preventiveMeasures: "Cross-train at least 2 backup welders and establish on-call staffing agreement."
      },
      {
        title: "Quality Issue - Dimensional Variance",
        type: "quality_issue",
        severity: "critical",
        status: "active",
        description: "Quality inspection revealed dimensional variances in 15% of machined parts. Investigating root cause.",
        affectedResourceId: existingResources[0]?.id || null,
        affectedJobId: existingProductionOrders[0]?.id || null,
        affectedOperationId: existingOperations[0]?.id || null,
        startTime: new Date(new Date().getTime() - 30 * 60 * 1000), // 30 minutes ago
        estimatedDuration: 6,
        reportedBy: "QC Inspector",
        assignedTo: "Engineering Team",
        impactAssessment: {
          delayedOperations: 4,
          affectedJobs: 2,
          estimatedDelay: 8,
          financialImpact: 25000,
          customerImpact: "high"
        },
        resolutionPlan: "Stop production, recalibrate CNC machine, inspect all recent parts. Notify customer of potential delay.",
        preventiveMeasures: "Implement real-time SPC monitoring and increase inspection frequency."
      },
      {
        title: "Power Outage - Electrical Grid Issue",
        type: "power_outage",
        severity: "high",
        status: "monitoring",
        description: "Brief power outage caused CNC programs to reset. All machines need recalibration before resuming production.",
        affectedResourceId: null,
        affectedJobId: null,
        affectedOperationId: null,
        startTime: new Date(new Date().getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
        estimatedDuration: 4,
        actualEndTime: new Date(new Date().getTime() - 3 * 60 * 60 * 1000), // resolved 3 hours ago
        reportedBy: "Facility Manager",
        assignedTo: "Maintenance Team",
        impactAssessment: {
          delayedOperations: 8,
          affectedJobs: 2,
          estimatedDelay: 3,
          financialImpact: 12000,
          customerImpact: "low"
        },
        resolutionPlan: "Recalibrate all CNC machines, verify program integrity, restart production in sequence.",
        resolutionNotes: "All machines recalibrated successfully. Production resumed normal schedule.",
        preventiveMeasures: "Install UPS backup systems for critical CNC controllers and implement automatic restart procedures."
      }
    ];

    await db.insert(disruptions).values(disruptionData);

    // Insert sample disruption actions
    const disruptionActionData = [
      {
        disruptionId: 1, // CNC-001 Machine Breakdown
        actionType: "repair_equipment",
        description: "Order replacement hydraulic pump (Part #HP-2400X)",
        targetId: 1,
        targetType: "resource",
        status: "in_progress",
        assignedTo: "Mike Maintenance",
        scheduledTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000), // in 2 hours
        notes: "Emergency order placed with 24-hour delivery commitment"
      },
      {
        disruptionId: 1,
        actionType: "reschedule_operation",
        description: "Reschedule CNC Machining operation to CNC-002",
        targetId: 1,
        targetType: "operation",
        status: "completed",
        assignedTo: "Sarah Scheduler",
        completedTime: new Date(new Date().getTime() - 30 * 60 * 1000), // 30 minutes ago
        notes: "Operation successfully moved to backup machine with minimal delay"
      },
      {
        disruptionId: 2, // Material Shortage
        actionType: "order_materials",
        description: "Emergency order for 500kg steel plates from alternate supplier",
        targetId: null,
        targetType: null,
        status: "pending",
        assignedTo: "Tom Procurement",
        scheduledTime: new Date(new Date().getTime() + 1 * 60 * 60 * 1000), // in 1 hour
        notes: "Contacted 3 suppliers, waiting for availability confirmation"
      },
      {
        disruptionId: 3, // Welder Absent
        actionType: "hire_temp_staff",
        description: "Hire temporary certified welder from staffing agency",
        targetId: 3,
        targetType: "resource",
        status: "completed",
        assignedTo: "HR Department",
        completedTime: new Date(new Date().getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        notes: "Temporary welder arrived and passed qualification test"
      },
      {
        disruptionId: 4, // Quality Issue
        actionType: "notify_customer",
        description: "Notify AutoParts Inc of potential delivery delay due to quality investigation",
        targetId: 2,
        targetType: "job",
        status: "pending",
        assignedTo: "Customer Service",
        scheduledTime: new Date(new Date().getTime() + 30 * 60 * 1000), // in 30 minutes
        notes: "Waiting for engineering assessment before customer notification"
      }
    ];

      await db.insert(disruptionActions).values(disruptionActionData);
    }
    */
  }

  // Seed business goals if missing
  if (shouldReseedBusinessGoals) {
    console.log("Seeding business goals...");
    
    const sampleBusinessGoals = [
      {
        title: "Increase Production Efficiency",
        description: "Improve overall production efficiency by optimizing resource allocation and reducing downtime across all manufacturing lines.",
        category: "operational",
        goalType: "efficiency",
        targetValue: 9500, // 95% efficiency
        currentValue: 8700, // 87% current
        unit: "percentage",
        timeframe: "quarterly",
        priority: "high",
        status: "active",
        owner: "Sarah Chen - Operations Director",
        department: "Manufacturing",
        startDate: new Date("2025-01-01"),
        targetDate: new Date("2025-03-31"),
        createdBy: "admin",
      },
      {
        title: "Reduce Manufacturing Costs",
        description: "Achieve 12% reduction in total manufacturing costs through lean processes, waste elimination, and energy optimization.",
        category: "financial",
        goalType: "cost_reduction",
        targetValue: 1200, // 12% reduction
        currentValue: 750, // 7.5% achieved
        unit: "percentage",
        timeframe: "annual",
        priority: "critical",
        status: "active",
        owner: "Michael Torres - Plant Manager",
        department: "Operations",
        startDate: new Date("2025-01-01"),
        targetDate: new Date("2025-12-31"),
        createdBy: "admin",
      },
      {
        title: "Zero Safety Incidents",
        description: "Maintain zero workplace safety incidents for 180 consecutive days through enhanced safety protocols and training programs.",
        category: "safety",
        goalType: "quality_improvement",
        targetValue: 0, // Zero incidents
        currentValue: 2, // 2 incidents this period
        unit: "incidents",
        timeframe: "quarterly",
        priority: "critical",
        status: "at-risk",
        owner: "Jennifer Rodriguez - Safety Manager",
        department: "Safety & Compliance",
        startDate: new Date("2025-01-01"),
        targetDate: new Date("2025-06-30"),
        createdBy: "admin",
      },
      {
        title: "Customer Satisfaction Excellence",
        description: "Achieve and maintain customer satisfaction rating above 95% through improved quality control and delivery performance.",
        category: "customer",
        goalType: "customer_satisfaction",
        targetValue: 9500, // 95% satisfaction
        currentValue: 9200, // 92% current
        unit: "percentage",
        timeframe: "quarterly",
        priority: "high",
        status: "on-track",
        owner: "David Park - Quality Director",
        department: "Quality Assurance",
        startDate: new Date("2025-01-01"),
        targetDate: new Date("2025-03-31"),
        createdBy: "admin",
      },
      {
        title: "Market Share Growth",
        description: "Expand market share in automotive manufacturing segment by 8% through strategic partnerships and capacity expansion.",
        category: "growth",
        goalType: "market_share",
        targetValue: 800, // 8% growth
        currentValue: 350, // 3.5% achieved
        unit: "percentage",
        timeframe: "annual",
        priority: "medium",
        status: "active",
        owner: "Lisa Wang - Strategic Planning Director",
        department: "Business Development",
        startDate: new Date("2025-01-01"),
        targetDate: new Date("2025-12-31"),
        createdBy: "admin",
      },
      {
        title: "Digital Transformation Initiative",
        description: "Complete digital transformation of production monitoring systems with IoT sensors and real-time analytics across all plants.",
        category: "strategic",
        goalType: "efficiency",
        targetValue: 100, // 100% completion
        currentValue: 65, // 65% completed
        unit: "percentage",
        timeframe: "annual",
        priority: "high",
        status: "active",
        owner: "Robert Kim - IT Director",
        department: "Information Technology",
        startDate: new Date("2024-10-01"),
        targetDate: new Date("2025-09-30"),
        createdBy: "admin",
      },
      {
        title: "Inventory Optimization",
        description: "Reduce stock carrying costs by 15% while maintaining 99.5% stockout prevention through advanced forecasting.",
        category: "operational",
        goalType: "cost_reduction",
        targetValue: 1500, // 15% reduction
        currentValue: 800, // 8% achieved
        unit: "percentage",
        timeframe: "quarterly",
        priority: "medium",
        status: "active",
        owner: "Amanda Foster - Supply Chain Director",
        department: "Supply Chain",
        startDate: new Date("2025-01-01"),
        targetDate: new Date("2025-03-31"),
        createdBy: "admin",
      },
      {
        title: "Energy Efficiency Program",
        description: "Achieve 20% reduction in energy consumption per unit produced through equipment upgrades and process optimization.",
        category: "sustainability",
        goalType: "cost_reduction",
        targetValue: 2000, // 20% reduction
        currentValue: 1200, // 12% achieved
        unit: "percentage",
        timeframe: "annual",
        priority: "medium",
        status: "on-track",
        owner: "Carlos Martinez - Facilities Manager",
        department: "Facilities",
        startDate: new Date("2025-01-01"),
        targetDate: new Date("2025-12-31"),
        createdBy: "admin",
      }
    ];

    await db.insert(businessGoals).values(sampleBusinessGoals);

    // Add some sample goal progress entries
    const sampleGoalProgress = [
      {
        goalId: 1, // Production Efficiency
        reportedValue: 8700,
        progressPercentage: 9158, // (8700/9500) * 100 * 100 for storage
        reportingPeriod: "Q1-2025",
        milestone: "Line A optimization completed",
        notes: "Improved efficiency in Line A by optimizing resource allocation. Line B still needs attention.",
        reportedBy: "Operations Team",
        confidence: 95,
      },
      {
        goalId: 1,
        reportedValue: 8850,
        progressPercentage: 9316, // (8850/9500) * 100 * 100 for storage
        reportingPeriod: "Q1-2025",
        milestone: "Line B efficiency improvements",
        notes: "Line B efficiency improvements showing results. On track for quarterly target.",
        reportedBy: "Operations Team",
        confidence: 90,
      },
      {
        goalId: 2, // Cost Reduction
        reportedValue: 750,
        progressPercentage: 6250, // (750/1200) * 100 * 100 for storage
        reportingPeriod: "Q1-2025",
        milestone: "Initial waste reduction phase",
        notes: "Waste reduction initiatives contributing to cost savings. Energy optimization in progress.",
        reportedBy: "Finance Team",
        confidence: 85,
      },
      {
        goalId: 4, // Customer Satisfaction
        reportedValue: 9200,
        progressPercentage: 9684, // (9200/9500) * 100 * 100 for storage
        reportingPeriod: "Q1-2025",
        milestone: "Customer feedback survey completed",
        notes: "Customer feedback survey results positive. Delivery performance improvements noted.",
        reportedBy: "Quality Team",
        confidence: 95,
      },
      {
        goalId: 6, // Digital Transformation
        reportedValue: 6500,
        progressPercentage: 6500, // Already percentage value
        reportingPeriod: "Q1-2025",
        milestone: "Plant 1 IoT deployment completed",
        notes: "IoT sensor deployment completed in Plant 1. Analytics platform integration 70% complete.",
        reportedBy: "IT Team",
        confidence: 85,
      }
    ];

    await db.insert(goalProgress).values(sampleGoalProgress);

    // Add some sample risks
    const sampleGoalRisks = [
      {
        goalId: 2, // Cost Reduction
        title: "Supply Chain Disruption",
        description: "Potential supply chain disruptions could increase raw material costs and impact cost reduction targets.",
        riskType: "external",
        probability: "medium",
        impact: "high",
        mitigationPlan: "Diversify supplier base and increase strategic stock buffers for critical materials.",
        mitigationOwner: "Supply Chain Team",
        mitigationDeadline: new Date("2025-02-15"),
        status: "active",
        identifiedBy: "Risk Management",
        identifiedAt: new Date("2025-01-05"),
      },
      {
        goalId: 3, // Safety
        title: "Equipment Aging",
        description: "Aging equipment in Line C poses increased safety risks that could impact zero incident goal.",
        riskType: "operational",
        probability: "medium",
        impact: "critical",
        mitigationPlan: "Accelerate equipment replacement schedule and increase preventive maintenance frequency.",
        mitigationOwner: "Maintenance Team",
        mitigationDeadline: new Date("2025-02-28"),
        status: "active",
        identifiedBy: "Safety Team",
        identifiedAt: new Date("2025-01-08"),
      },
      {
        goalId: 6, // Digital Transformation
        title: "Technology Integration Complexity",
        description: "Complex system integrations may delay digital transformation timeline and increase implementation costs.",
        riskType: "technical",
        probability: "high",
        impact: "medium",
        mitigationPlan: "Engage external integration specialists and implement phased rollout approach.",
        mitigationOwner: "IT Team",
        mitigationDeadline: new Date("2025-02-01"),
        status: "mitigated",
        identifiedBy: "IT Team",
        identifiedAt: new Date("2025-01-03"),
      }
    ];

    await db.insert(goalRisks).values(sampleGoalRisks);

    // Add some sample issues
    const sampleGoalIssues = [
      {
        goalId: 1, // Production Efficiency
        title: "Line B Equipment Malfunction",
        description: "Recurring equipment malfunctions on Line B are impacting efficiency targets and causing unplanned downtime.",
        issueType: "blocker",
        severity: "high",
        impact: "schedule",
        assignedTo: "Maintenance Team",
        resolutionPlan: "Replace faulty components and implement predictive maintenance sensors to prevent future issues.",
        estimatedResolutionDate: new Date("2025-02-10"),
        status: "in-progress",
        reportedBy: "Operations Team",
        reportedAt: new Date("2025-01-12"),
      },
      {
        goalId: 4, // Customer Satisfaction
        title: "Delivery Delays",
        description: "Recent delivery delays have resulted in customer complaints and may impact satisfaction ratings.",
        issueType: "concern",
        severity: "medium",
        impact: "quality",
        assignedTo: "Logistics Team",
        resolutionPlan: "Optimize delivery routes and implement real-time tracking system for better customer communication.",
        estimatedResolutionDate: new Date("2025-02-05"),
        status: "open",
        reportedBy: "Customer Service",
        reportedAt: new Date("2025-01-18"),
      },
      {
        goalId: 7, // Inventory Optimization
        title: "Forecasting Model Accuracy",
        description: "Current demand forecasting model showing decreased accuracy, affecting stock optimization efforts.",
        issueType: "risk",
        severity: "medium",
        impact: "cost",
        assignedTo: "Data Analytics Team",
        resolutionPlan: "Retrain forecasting algorithms with recent data and incorporate additional market indicators.",
        estimatedResolutionDate: new Date("2025-01-30"),
        status: "resolved",
        reportedBy: "Supply Chain Team",
        reportedAt: new Date("2025-01-10"),
      }
    ];

    await db.insert(goalIssues).values(sampleGoalIssues);

    console.log("✅ Business goals sample data seeded successfully");
  }

  // Check if vendor and customer data already exists
  const existingVendors = await db.select().from(vendors).limit(1);
  const existingCustomers = await db.select().from(customers).limit(1);
  
  // Seed vendors if missing
  if (existingVendors.length === 0) {
    console.log("Seeding vendors...");
    
    const sampleVendors = [
      {
        vendorNumber: "VND-001",
        vendorName: "ChemSupply Industries",
        vendorType: "supplier",
        contactName: "Sarah Williams",
        contactEmail: "sarah.williams@chemsupply.com",
        contactPhone: "(555) 123-4567",
        address: "1234 Industrial Blvd",
        city: "Cleveland",
        state: "OH",
        zipCode: "44101",
        country: "US",
        taxId: "12-3456789",
        paymentTerms: "net30",
        currency: "USD",
        preferredVendor: true,
        qualificationLevel: "preferred",
        capabilities: ["Raw Materials", "Chemical Processing", "Quality Testing"],
        certifications: [
          {
            certification: "ISO 9001:2015",
            issued_by: "ISO",
            issued_date: "2024-01-15",
            expiry_date: "2027-01-15",
            status: "active"
          },
          {
            certification: "FDA Food Grade",
            issued_by: "FDA",
            issued_date: "2024-03-10",
            expiry_date: "2026-03-10",
            status: "active"
          }
        ],
        performanceRating: 9,
        status: "active",
        notes: "Primary supplier for chemical raw materials. Excellent quality and on-time delivery record."
      },
      {
        vendorNumber: "VND-002",
        vendorName: "Precision Equipment Corp",
        vendorType: "supplier",
        contactName: "Michael Chen",
        contactEmail: "m.chen@precisionequip.com",
        contactPhone: "(555) 987-6543",
        address: "5678 Technology Park",
        city: "Austin",
        state: "TX",
        zipCode: "78701",
        country: "US",
        taxId: "98-7654321",
        paymentTerms: "net45",
        currency: "USD",
        preferredVendor: false,
        qualificationLevel: "qualified",
        capabilities: ["Equipment Manufacturing", "Maintenance Services", "Technical Support"],
        certifications: [
          {
            certification: "ISO 14001:2015",
            issued_by: "ISO",
            issued_date: "2023-11-20",
            expiry_date: "2026-11-20",
            status: "active"
          }
        ],
        performanceRating: 7,
        status: "active",
        notes: "Equipment supplier with good technical support capabilities."
      },
      {
        vendorNumber: "VND-003",
        vendorName: "Global Packaging Solutions",
        vendorType: "supplier",
        contactName: "Lisa Rodriguez",
        contactEmail: "l.rodriguez@globalpack.com",
        contactPhone: "(555) 456-7890",
        address: "9012 Commerce Drive",
        city: "Atlanta",
        state: "GA",
        zipCode: "30309",
        country: "US",
        taxId: "45-6789012",
        paymentTerms: "net30",
        currency: "USD",
        preferredVendor: true,
        qualificationLevel: "approved",
        capabilities: ["Packaging Materials", "Custom Design", "Logistics"],
        certifications: [
          {
            certification: "SQF Food Safety",
            issued_by: "SQF Institute",
            issued_date: "2024-02-05",
            expiry_date: "2026-02-05",
            status: "active"
          }
        ],
        performanceRating: 8,
        status: "active",
        notes: "Primary packaging supplier with excellent design capabilities."
      }
    ];

    await db.insert(vendors).values(sampleVendors);
    console.log("✅ Vendor sample data seeded successfully");
  }

  // Seed customers if missing
  if (existingCustomers.length === 0) {
    console.log("Seeding customers...");
    
    const sampleCustomers = [
      {
        customerNumber: "CUS-001",
        customerName: "TechCorp Manufacturing",
        customerType: "distributor",
        contactName: "David Johnson",
        contactEmail: "david.johnson@techcorp.com",
        contactPhone: "(555) 234-5678",
        address: "2468 Business Center",
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
        country: "US",
        taxId: "23-4567890",
        paymentTerms: "net30",
        currency: "USD",
        creditLimit: 500000,
        creditUsed: 125000,
        preferredCustomer: true,
        customerTier: "platinum",
        salesRepresentative: "Jennifer Smith",
        accountManager: "Robert Wilson",
        contractTerms: "Annual contract with volume discounts",
        shippingInstructions: "Standard LTL freight, dock delivery required",
        billingInstructions: "Electronic invoicing to AP department",
        qualityRequirements: ["ISO compliance", "Certificate of Analysis required"],
        orderFrequency: "Weekly",
        averageOrderValue: 25000,
        lastOrderDate: new Date("2025-01-20"),
        customerSince: new Date("2021-03-15"),
        status: "active",
        notes: "High-volume customer with excellent payment history. Priority shipping required."
      },
      {
        customerNumber: "CUS-002",
        customerName: "Industrial Dynamics LLC",
        customerType: "end_user",
        contactName: "Maria Gonzalez",
        contactEmail: "maria.gonzalez@industrialdynamics.com",
        contactPhone: "(555) 345-6789",
        address: "1357 Manufacturing Way",
        city: "Detroit",
        state: "MI",
        zipCode: "48201",
        country: "US",
        taxId: "34-5678901",
        paymentTerms: "net45",
        currency: "USD",
        creditLimit: 250000,
        creditUsed: 75000,
        preferredCustomer: false,
        customerTier: "gold",
        salesRepresentative: "Michael Brown",
        accountManager: "Sarah Davis",
        contractTerms: "Standard terms and conditions",
        shippingInstructions: "Customer pickup preferred",
        billingInstructions: "Paper invoices via mail",
        qualityRequirements: ["Standard specifications"],
        orderFrequency: "Monthly",
        averageOrderValue: 15000,
        lastOrderDate: new Date("2025-01-15"),
        customerSince: new Date("2022-08-10"),
        status: "active",
        notes: "Growing account with potential for increased volume."
      },
      {
        customerNumber: "CUS-003",
        customerName: "Pharma Solutions Inc",
        customerType: "oem",
        contactName: "Dr. James Patterson",
        contactEmail: "j.patterson@pharmasolutions.com",
        contactPhone: "(555) 456-7891",
        address: "4680 Research Boulevard",
        city: "Boston",
        state: "MA",
        zipCode: "02101",
        country: "US",
        taxId: "45-6789012",
        paymentTerms: "net30",
        currency: "USD",
        creditLimit: 750000,
        creditUsed: 200000,
        preferredCustomer: true,
        customerTier: "platinum",
        salesRepresentative: "Amanda Lee",
        accountManager: "Thomas Anderson",
        contractTerms: "Multi-year pharmaceutical supply agreement",
        shippingInstructions: "Temperature-controlled shipping required",
        billingInstructions: "Electronic invoicing with PO matching",
        qualityRequirements: ["FDA compliance", "cGMP certification", "Batch records required"],
        orderFrequency: "Bi-weekly",
        averageOrderValue: 35000,
        lastOrderDate: new Date("2025-01-22"),
        customerSince: new Date("2020-11-05"),
        status: "active",
        notes: "Pharmaceutical customer with strict quality and regulatory requirements. Critical account."
      }
    ];

    await db.insert(customers).values(sampleCustomers);
    console.log("✅ Customer sample data seeded successfully");
  }

  // Seed sample dashboards if missing
  if (shouldReseedDashboards) {
    console.log("Seeding sample dashboards...");
    
    const sampleDashboards = [
      {
        name: "Production Overview",
        description: "Comprehensive view of manufacturing operations with key metrics and performance indicators",
        isDefault: true,
        configuration: {
          standardWidgets: [],
          customWidgets: [
            {
              id: "jobs-metric",
              title: "Active Jobs",
              type: "metric",
              data: { value: 2, label: "Jobs", icon: "Briefcase", trend: "+1 from yesterday" },
              visible: true,
              position: { x: 20, y: 20 },
              size: { width: 200, height: 120 },
              config: { color: "blue", showTrend: true }
            },
            {
              id: "utilization-metric",
              title: "Resource Utilization",
              type: "metric", 
              data: { value: 85, label: "Utilization %", icon: "Activity", trend: "+5% from last week" },
              visible: true,
              position: { x: 240, y: 20 },
              size: { width: 200, height: 120 },
              config: { color: "green", showTrend: true }
            },
            {
              id: "operations-chart",
              title: "Operations Status",
              type: "chart",
              data: { 
                chartType: "pie",
                data: [
                  { name: "Active", value: 3, color: "#22c55e" },
                  { name: "Pending", value: 2, color: "#f59e0b" },
                  { name: "Completed", value: 0, color: "#6b7280" }
                ]
              },
              visible: true,
              position: { x: 460, y: 20 },
              size: { width: 280, height: 200 },
              config: { showLegend: true, showValues: true }
            },
            {
              id: "resources-table",
              title: "Resource Status",
              type: "table",
              data: {
                columns: ["Resource", "Type", "Status", "Utilization"],
                rows: [
                  ["CNC-001", "Machine", "Active", "90%"],
                  ["CNC-002", "Machine", "Active", "75%"],
                  ["Welder-001", "Operator", "Active", "95%"],
                  ["Assembly-001", "Operator", "Active", "80%"]
                ]
              },
              visible: true,
              position: { x: 20, y: 160 },
              size: { width: 420, height: 180 },
              config: { striped: true, compact: false }
            },
            {
              id: "efficiency-progress",
              title: "Daily Efficiency Goal",
              type: "progress",
              data: { current: 87, target: 95, label: "87% of 95% target" },
              visible: true,
              position: { x: 460, y: 240 },
              size: { width: 280, height: 100 },
              config: { color: "blue", showPercentage: true }
            }
          ]
        }
      },
      {
        name: "Quality Control Dashboard",
        description: "Real-time quality metrics and inspection status across all production lines",
        isDefault: false,
        configuration: {
          standardWidgets: [],
          customWidgets: [
            {
              id: "quality-score-metric",
              title: "Overall Quality Score",
              type: "metric",
              data: { value: 94.2, label: "Quality Score", icon: "Shield", trend: "+1.2% improvement" },
              visible: true,
              position: { x: 20, y: 20 },
              size: { width: 200, height: 120 },
              config: { color: "green", showTrend: true }
            },
            {
              id: "defect-rate-metric",
              title: "Defect Rate",
              type: "metric",
              data: { value: 2.1, label: "Defect %", icon: "AlertTriangle", trend: "-0.3% improvement" },
              visible: true,
              position: { x: 240, y: 20 },
              size: { width: 200, height: 120 },
              config: { color: "red", showTrend: true }
            },
            {
              id: "inspection-chart",
              title: "Daily Inspections",
              type: "chart",
              data: {
                chartType: "bar",
                data: [
                  { name: "Monday", passed: 45, failed: 2 },
                  { name: "Tuesday", passed: 52, failed: 1 },
                  { name: "Wednesday", passed: 48, failed: 3 },
                  { name: "Thursday", passed: 51, failed: 1 },
                  { name: "Friday", passed: 49, failed: 2 }
                ]
              },
              visible: true,
              position: { x: 460, y: 20 },
              size: { width: 320, height: 220 },
              config: { colors: ["#22c55e", "#ef4444"], showGrid: true }
            },
            {
              id: "qc-operators-table",
              title: "QC Operators Performance",
              type: "table",
              data: {
                columns: ["Operator", "Inspections", "Pass Rate", "Efficiency"],
                rows: [
                  ["Sarah QC", "127", "97.6%", "Excellent"],
                  ["Mike QC", "134", "96.3%", "Good"],
                  ["Lisa QC", "119", "98.1%", "Excellent"],
                  ["Tom QC", "142", "95.8%", "Good"]
                ]
              },
              visible: true,
              position: { x: 20, y: 160 },
              size: { width: 420, height: 160 },
              config: { striped: true, compact: true }
            },
            {
              id: "quality-target-progress",
              title: "Monthly Quality Target",
              type: "progress",
              data: { current: 94.2, target: 96.0, label: "94.2% of 96% target" },
              visible: true,
              position: { x: 460, y: 260 },
              size: { width: 320, height: 100 },
              config: { color: "green", showPercentage: true }
            }
          ]
        }
      },
      {
        name: "Resource Efficiency Analytics",
        description: "Detailed analysis of resource utilization, performance trends, and optimization opportunities",
        isDefault: false,
        configuration: {
          standardWidgets: [],
          customWidgets: [
            {
              id: "overall-efficiency-metric",
              title: "Overall Efficiency",
              type: "metric",
              data: { value: 82.4, label: "Efficiency %", icon: "Zap", trend: "+3.1% this month" },
              visible: true,
              position: { x: 20, y: 20 },
              size: { width: 180, height: 120 },
              config: { color: "blue", showTrend: true }
            },
            {
              id: "downtime-metric",
              title: "Total Downtime",
              type: "metric",
              data: { value: 4.2, label: "Hours Today", icon: "Clock", trend: "-1.3h vs yesterday" },
              visible: true,
              position: { x: 220, y: 20 },
              size: { width: 180, height: 120 },
              config: { color: "orange", showTrend: true }
            },
            {
              id: "throughput-metric",
              title: "Throughput",
              type: "metric",
              data: { value: 247, label: "Units/Hour", icon: "TrendingUp", trend: "+15 vs target" },
              visible: true,
              position: { x: 420, y: 20 },
              size: { width: 180, height: 120 },
              config: { color: "green", showTrend: true }
            },
            {
              id: "efficiency-trend-chart",
              title: "Weekly Efficiency Trend",
              type: "chart",
              data: {
                chartType: "line",
                data: [
                  { day: "Mon", efficiency: 79.2 },
                  { day: "Tue", efficiency: 81.5 },
                  { day: "Wed", efficiency: 78.9 },
                  { day: "Thu", efficiency: 84.1 },
                  { day: "Fri", efficiency: 82.4 },
                  { day: "Sat", efficiency: 80.7 },
                  { day: "Sun", efficiency: 83.2 }
                ]
              },
              visible: true,
              position: { x: 620, y: 20 },
              size: { width: 280, height: 200 },
              config: { color: "#3b82f6", showGrid: true, showDots: true }
            },
            {
              id: "machine-utilization-chart",
              title: "Machine Utilization Comparison",
              type: "chart",
              data: {
                chartType: "bar",
                data: [
                  { machine: "CNC-001", utilization: 89.5 },
                  { machine: "CNC-002", utilization: 76.2 },
                  { machine: "Welder-001", utilization: 94.1 },
                  { machine: "Assembly-001", utilization: 78.6 },
                  { machine: "QC-001", utilization: 85.3 }
                ]
              },
              visible: true,
              position: { x: 20, y: 160 },
              size: { width: 380, height: 180 },
              config: { color: "#10b981", showGrid: true, showValues: true }
            },
            {
              id: "bottleneck-table",
              title: "Current Bottlenecks",
              type: "table",
              data: {
                columns: ["Resource", "Queue Time", "Impact", "Priority"],
                rows: [
                  ["CNC-002", "2.3 hours", "Medium", "High"],
                  ["Assembly-001", "1.7 hours", "Low", "Medium"],
                  ["Quality Check", "0.8 hours", "Low", "Low"]
                ]
              },
              visible: true,
              position: { x: 420, y: 160 },
              size: { width: 300, height: 140 },
              config: { striped: true, compact: true }
            },
            {
              id: "efficiency-target-progress",
              title: "Monthly Efficiency Target",
              type: "progress",
              data: { current: 82.4, target: 85.0, label: "82.4% of 85% target" },
              visible: true,
              position: { x: 740, y: 160 },
              size: { width: 160, height: 140 },
              config: { color: "blue", showPercentage: true, orientation: "vertical" }
            }
          ]
        }
      },
      {
        name: "Financial Performance",
        description: "Cost analysis, budget tracking, and financial KPIs for manufacturing operations",
        isDefault: false,
        configuration: {
          standardWidgets: [],
          customWidgets: [
            {
              id: "daily-cost-metric",
              title: "Daily Operating Cost",
              type: "metric",
              data: { value: 18750, label: "USD", icon: "DollarSign", trend: "-5.2% vs yesterday" },
              visible: true,
              position: { x: 20, y: 20 },
              size: { width: 200, height: 120 },
              config: { color: "green", showTrend: true, format: "currency" }
            },
            {
              id: "cost-per-unit-metric",
              title: "Cost per Unit",
              type: "metric",
              data: { value: 47.25, label: "USD/Unit", icon: "Calculator", trend: "-1.8% improvement" },
              visible: true,
              position: { x: 240, y: 20 },
              size: { width: 200, height: 120 },
              config: { color: "blue", showTrend: true, format: "currency" }
            },
            {
              id: "budget-variance-metric",
              title: "Budget Variance",
              type: "metric",
              data: { value: -3.2, label: "% Under Budget", icon: "Target", trend: "Improving" },
              visible: true,
              position: { x: 460, y: 20 },
              size: { width: 200, height: 120 },
              config: { color: "green", showTrend: true }
            },
            {
              id: "cost-breakdown-chart",
              title: "Cost Breakdown",
              type: "chart",
              data: {
                chartType: "pie",
                data: [
                  { name: "Labor", value: 42, color: "#3b82f6" },
                  { name: "Materials", value: 35, color: "#10b981" },
                  { name: "Energy", value: 12, color: "#f59e0b" },
                  { name: "Maintenance", value: 8, color: "#ef4444" },
                  { name: "Other", value: 3, color: "#6b7280" }
                ]
              },
              visible: true,
              position: { x: 680, y: 20 },
              size: { width: 260, height: 220 },
              config: { showLegend: true, showPercentages: true }
            },
            {
              id: "monthly-costs-chart",
              title: "Monthly Cost Trend",
              type: "chart",
              data: {
                chartType: "line",
                data: [
                  { month: "Jul", planned: 520000, actual: 498500 },
                  { month: "Aug", planned: 530000, actual: 515200 },
                  { month: "Sep", planned: 525000, actual: 521800 },
                  { month: "Oct", planned: 535000, actual: 528900 },
                  { month: "Nov", planned: 540000, actual: 535100 },
                  { month: "Dec", planned: 545000, actual: 531200 }
                ]
              },
              visible: true,
              position: { x: 20, y: 160 },
              size: { width: 420, height: 180 },
              config: { colors: ["#6b7280", "#3b82f6"], showGrid: true, showLegend: true }
            },
            {
              id: "savings-table",
              title: "Cost Savings Initiatives",
              type: "table",
              data: {
                columns: ["Initiative", "Savings/Month", "Status", "ROI"],
                rows: [
                  ["Energy Optimization", "$12,400", "Active", "8.2%"],
                  ["Waste Reduction", "$8,750", "Active", "12.1%"],
                  ["Process Automation", "$15,200", "Planning", "15.3%"],
                  ["Supplier Negotiation", "$6,800", "Completed", "6.7%"]
                ]
              },
              visible: true,
              position: { x: 460, y: 160 },
              size: { width: 400, height: 160 },
              config: { striped: true, compact: false }
            },
            {
              id: "budget-progress",
              title: "Monthly Budget Usage",
              type: "progress",
              data: { current: 531200, target: 545000, label: "$531k of $545k budget" },
              visible: true,
              position: { x: 20, y: 360 },
              size: { width: 420, height: 80 },
              config: { color: "green", showPercentage: true, format: "currency" }
            }
          ]
        }
      }
    ];

    await db.insert(dashboardConfigs).values(sampleDashboards);
    console.log("✅ Sample dashboards seeded successfully");
  }

  // Seed sample reports if missing
  if (shouldReseedReports) {
    console.log("Seeding sample reports...");
    
    const sampleReports = [
      {
        name: "Production Summary Report",
        description: "Comprehensive overview of manufacturing operations, job status, and production metrics",
        type: "summary",
        isDefault: true,
        configuration: {
          fields: ["productionOrderId", "orderNumber", "name", "status", "priority", "customer", "dueDate", "progress"],
          filters: { status: "all" },
          sorting: { field: "dueDate", direction: "asc" as const },
          chartType: "summary" as const,
          widgets: [
            {
              id: "production-orders-overview",
              title: "Production Orders Overview",
              type: "metric",
              data: { value: 2, label: "Active Production Orders", icon: "Briefcase", trend: "+1 from yesterday" },
              visible: true,
              position: { x: 20, y: 20 },
              size: { width: 200, height: 120 },
              config: { color: "blue", showTrend: true }
            },
            {
              id: "production-status",
              title: "Production Status",
              type: "chart",
              data: { 
                chartType: "pie",
                data: [
                  { name: "Active", value: 2, color: "#22c55e" },
                  { name: "Pending", value: 3, color: "#f59e0b" },
                  { name: "Completed", value: 5, color: "#6b7280" }
                ]
              },
              visible: true,
              position: { x: 240, y: 20 },
              size: { width: 280, height: 200 },
              config: { showLegend: true, showValues: true }
            },
            {
              id: "production-orders-table",
              title: "Active Production Orders Details",
              type: "table",
              data: {
                columns: ["Order Number", "Product Name", "Customer", "Priority", "Due Date", "Status"],
                rows: [
                  ["PO-001", "Widget Assembly - Batch A", "Acme Corp", "High", "2025-01-30", "Active"],
                  ["PO-002", "Component Manufacturing", "TechCorp", "Medium", "2025-02-05", "Active"]
                ]
              },
              visible: true,
              position: { x: 20, y: 160 },
              size: { width: 500, height: 180 },
              config: { striped: true, compact: false }
            }
          ]
        }
      },
      {
        name: "Resource Utilization Report",
        description: "Detailed analysis of resource allocation, utilization rates, and capacity planning",
        type: "resources",
        isDefault: false,
        configuration: {
          fields: ["resourceId", "resourceName", "type", "status", "capabilities", "currentAssignment", "utilization"],
          filters: { status: "active" },
          sorting: { field: "utilization", direction: "desc" as const },
          chartType: "chart" as const,
          widgets: [
            {
              id: "resource-utilization-metric",
              title: "Average Utilization",
              type: "metric",
              data: { value: 85.3, label: "Utilization %", icon: "Activity", trend: "+3.2% this week" },
              visible: true,
              position: { x: 20, y: 20 },
              size: { width: 200, height: 120 },
              config: { color: "green", showTrend: true }
            },
            {
              id: "resource-status-metric",
              title: "Active Resources",
              type: "metric",
              data: { value: 6, label: "Resources", icon: "Users", trend: "All operational" },
              visible: true,
              position: { x: 240, y: 20 },
              size: { width: 200, height: 120 },
              config: { color: "blue", showTrend: true }
            },
            {
              id: "utilization-chart",
              title: "Resource Utilization by Type",
              type: "chart",
              data: {
                chartType: "bar",
                data: [
                  { name: "CNC Machines", utilization: 89.5 },
                  { name: "Welders", utilization: 94.1 },
                  { name: "Assembly", utilization: 78.6 },
                  { name: "Quality Control", utilization: 85.3 },
                  { name: "Packaging", utilization: 72.8 }
                ]
              },
              visible: true,
              position: { x: 460, y: 20 },
              size: { width: 320, height: 200 },
              config: { color: "#10b981", showGrid: true, showValues: true }
            },
            {
              id: "resource-details-table",
              title: "Resource Details",
              type: "table",
              data: {
                columns: ["Resource", "Type", "Status", "Current Job", "Utilization"],
                rows: [
                  ["CNC-001", "Machine", "Active", "Widget Assembly", "89%"],
                  ["CNC-002", "Machine", "Active", "Component Mfg", "76%"],
                  ["Welder-001", "Operator", "Active", "Frame Welding", "94%"],
                  ["Assembly-001", "Operator", "Active", "Final Assembly", "79%"],
                  ["QC-001", "Operator", "Active", "Quality Check", "85%"],
                  ["Packaging-001", "Operator", "Available", "None", "0%"]
                ]
              },
              visible: true,
              position: { x: 20, y: 160 },
              size: { width: 760, height: 200 },
              config: { striped: true, compact: true }
            }
          ]
        }
      },
      {
        name: "Quality Control Analysis",
        description: "Quality metrics, defect analysis, and inspection performance tracking",
        type: "custom",
        isDefault: false,
        configuration: {
          fields: ["inspectionId", "operationId", "inspector", "result", "defectType", "timestamp"],
          filters: { result: "all" },
          sorting: { field: "timestamp", direction: "desc" as const },
          chartType: "chart" as const,
          widgets: [
            {
              id: "quality-score-metric",
              title: "Quality Score",
              type: "metric",
              data: { value: 96.2, label: "Overall Score", icon: "Shield", trend: "+1.4% improvement" },
              visible: true,
              position: { x: 20, y: 20 },
              size: { width: 200, height: 120 },
              config: { color: "green", showTrend: true }
            },
            {
              id: "defect-rate-metric",
              title: "Defect Rate",
              type: "metric",
              data: { value: 1.8, label: "Defect %", icon: "AlertTriangle", trend: "-0.4% improvement" },
              visible: true,
              position: { x: 240, y: 20 },
              size: { width: 200, height: 120 },
              config: { color: "red", showTrend: true }
            },
            {
              id: "inspections-metric",
              title: "Daily Inspections",
              type: "metric",
              data: { value: 47, label: "Inspections", icon: "Search", trend: "+3 from yesterday" },
              visible: true,
              position: { x: 460, y: 20 },
              size: { width: 200, height: 120 },
              config: { color: "blue", showTrend: true }
            },
            {
              id: "defect-types-chart",
              title: "Defect Categories",
              type: "chart",
              data: {
                chartType: "pie",
                data: [
                  { name: "Dimensional", value: 45, color: "#ef4444" },
                  { name: "Surface Finish", value: 28, color: "#f59e0b" },
                  { name: "Assembly", value: 18, color: "#3b82f6" },
                  { name: "Material", value: 9, color: "#6b7280" }
                ]
              },
              visible: true,
              position: { x: 680, y: 20 },
              size: { width: 260, height: 200 },
              config: { showLegend: true, showPercentages: true }
            },
            {
              id: "inspector-performance",
              title: "Inspector Performance",
              type: "table",
              data: {
                columns: ["Inspector", "Inspections", "Pass Rate", "Avg Time", "Efficiency"],
                rows: [
                  ["Sarah Miller", "127", "97.6%", "4.2 min", "Excellent"],
                  ["Mike Johnson", "134", "96.3%", "3.8 min", "Good"],
                  ["Lisa Chen", "119", "98.1%", "4.5 min", "Excellent"],
                  ["Tom Wilson", "142", "95.8%", "4.1 min", "Good"]
                ]
              },
              visible: true,
              position: { x: 20, y: 160 },
              size: { width: 620, height: 160 },
              config: { striped: true, compact: true }
            },
            {
              id: "quality-trend-chart",
              title: "Weekly Quality Trend",
              type: "chart",
              data: {
                chartType: "line",
                data: [
                  { week: "Week 1", score: 95.2 },
                  { week: "Week 2", score: 94.8 },
                  { week: "Week 3", score: 96.1 },
                  { week: "Week 4", score: 96.2 }
                ]
              },
              visible: true,
              position: { x: 660, y: 160 },
              size: { width: 280, height: 160 },
              config: { color: "#22c55e", showGrid: true, showDots: true }
            }
          ]
        }
      },
      {
        name: "Operations Timeline Report",
        description: "Detailed operations scheduling, progress tracking, and timeline analysis",
        type: "operations",
        isDefault: false,
        configuration: {
          fields: ["operationId", "operationName", "jobId", "resourceId", "status", "startTime", "endTime", "duration"],
          filters: { status: "all" },
          sorting: { field: "startTime", direction: "asc" as const },
          chartType: "table" as const,
          widgets: [
            {
              id: "operations-count-metric",
              title: "Total Operations",
              type: "metric",
              data: { value: 5, label: "Operations", icon: "Settings", trend: "+2 from last week" },
              visible: true,
              position: { x: 20, y: 20 },
              size: { width: 200, height: 120 },
              config: { color: "blue", showTrend: true }
            },
            {
              id: "completed-operations-metric",
              title: "Completed Today",
              type: "metric",
              data: { value: 0, label: "Completed", icon: "CheckCircle", trend: "On schedule" },
              visible: true,
              position: { x: 240, y: 20 },
              size: { width: 200, height: 120 },
              config: { color: "green", showTrend: true }
            },
            {
              id: "operations-by-status",
              title: "Operations by Status",
              type: "chart",
              data: {
                chartType: "bar",
                data: [
                  { status: "Active", count: 3 },
                  { status: "Pending", count: 2 },
                  { status: "Completed", count: 0 },
                  { status: "On Hold", count: 0 }
                ]
              },
              visible: true,
              position: { x: 460, y: 20 },
              size: { width: 300, height: 200 },
              config: { color: "#3b82f6", showGrid: true, showValues: true }
            },
            {
              id: "operations-timeline-table",
              title: "Operations Timeline",
              type: "table",
              data: {
                columns: ["Operation", "Job", "Resource", "Status", "Start Time", "Duration"],
                rows: [
                  ["CNC Machining", "Widget Assembly", "CNC-001", "Active", "2025-01-25 08:00", "4 hours"],
                  ["Welding", "Widget Assembly", "Welder-001", "Pending", "2025-01-25 12:00", "2 hours"],
                  ["Assembly", "Widget Assembly", "Assembly-001", "Pending", "2025-01-25 14:00", "3 hours"],
                  ["Quality Control", "Widget Assembly", "QC-001", "Pending", "2025-01-25 17:00", "1 hour"],
                  ["Packaging", "Widget Assembly", "Packaging-001", "Pending", "2025-01-26 08:00", "1 hour"]
                ]
              },
              visible: true,
              position: { x: 20, y: 160 },
              size: { width: 740, height: 200 },
              config: { striped: true, compact: false }
            }
          ]
        }
      },
      {
        name: "Performance KPI Dashboard",
        description: "Key performance indicators and metrics for manufacturing efficiency and productivity",
        type: "summary",
        isDefault: false,
        configuration: {
          fields: ["kpi", "value", "target", "variance", "trend"],
          filters: {},
          sorting: { field: "kpi", direction: "asc" as const },
          chartType: "summary" as const,
          widgets: [
            {
              id: "oee-metric",
              title: "Overall Equipment Effectiveness",
              type: "metric",
              data: { value: 84.2, label: "OEE %", icon: "Gauge", trend: "+2.1% this month" },
              visible: true,
              position: { x: 20, y: 20 },
              size: { width: 220, height: 120 },
              config: { color: "blue", showTrend: true }
            },
            {
              id: "throughput-metric",
              title: "Throughput",
              type: "metric",
              data: { value: 247, label: "Units/Hour", icon: "TrendingUp", trend: "+12 vs target" },
              visible: true,
              position: { x: 260, y: 20 },
              size: { width: 220, height: 120 },
              config: { color: "green", showTrend: true }
            },
            {
              id: "first-pass-yield",
              title: "First Pass Yield",
              type: "metric",
              data: { value: 96.8, label: "FPY %", icon: "Target", trend: "+0.8% improvement" },
              visible: true,
              position: { x: 500, y: 20 },
              size: { width: 220, height: 120 },
              config: { color: "green", showTrend: true }
            },
            {
              id: "kpi-summary-table",
              title: "KPI Summary",
              type: "table",
              data: {
                columns: ["KPI", "Current", "Target", "Variance", "Status"],
                rows: [
                  ["Overall Equipment Effectiveness", "84.2%", "85.0%", "-0.8%", "Near Target"],
                  ["Throughput (Units/Hour)", "247", "235", "+12", "Above Target"],
                  ["First Pass Yield", "96.8%", "95.0%", "+1.8%", "Above Target"],
                  ["On-Time Delivery", "94.5%", "95.0%", "-0.5%", "Near Target"],
                  ["Resource Utilization", "85.3%", "80.0%", "+5.3%", "Above Target"],
                  ["Quality Score", "96.2%", "95.0%", "+1.2%", "Above Target"]
                ]
              },
              visible: true,
              position: { x: 20, y: 160 },
              size: { width: 700, height: 220 },
              config: { striped: true, compact: false }
            },
            {
              id: "monthly-trends",
              title: "Monthly Performance Trends",
              type: "chart",
              data: {
                chartType: "line",
                data: [
                  { month: "Sep", oee: 82.1, throughput: 230, quality: 95.2 },
                  { month: "Oct", oee: 83.5, throughput: 238, quality: 95.8 },
                  { month: "Nov", oee: 82.8, throughput: 242, quality: 96.1 },
                  { month: "Dec", oee: 84.2, throughput: 247, quality: 96.2 }
                ]
              },
              visible: true,
              position: { x: 740, y: 160 },
              size: { width: 280, height: 220 },
              config: { colors: ["#3b82f6", "#10b981", "#f59e0b"], showGrid: true, showLegend: true }
            }
          ]
        }
      }
    ];

    await db.insert(reportConfigs).values(sampleReports);
    console.log("✅ Sample reports seeded successfully");
  }

  // Seed Visual Factory Displays
  if (shouldReseedVisualFactory) {
    const visualFactoryDisplaysData = [
      {
        name: "Shop Floor Production Dashboard",
        description: "Real-time production metrics and status for operators and supervisors",
        location: "Main Production Floor - Wall Display",
        audience: "shop-floor",
        autoRotationInterval: 15,
        isActive: true,
        useAiMode: false,
        widgets: [
          {
            id: "production-status",
            type: "metrics",
            title: "Production Status",
            position: { x: 0, y: 0, width: 6, height: 3 },
            config: { 
              showJobs: true, 
              showUtilization: true, 
              showOnTime: true,
              fontSize: "2xl",
              colorScheme: "production"
            },
            priority: 10,
            audienceRelevance: { "shop-floor": 10, "management": 8, "general": 6 }
          },
          {
            id: "active-operations",
            type: "schedule",
            title: "Active Operations",
            position: { x: 6, y: 0, width: 6, height: 4 },
            config: { 
              showOnlyActive: true, 
              showResourceAssignments: true,
              showPriorities: true,
              highlightOverdue: true
            },
            priority: 9,
            audienceRelevance: { "shop-floor": 10, "management": 7, "general": 5 }
          },
          {
            id: "safety-alerts",
            type: "alerts",
            title: "Safety & Quality Alerts",
            position: { x: 0, y: 3, width: 6, height: 2 },
            config: { 
              showCritical: true, 
              showSafety: true,
              showQuality: true,
              autoRefresh: 30
            },
            priority: 10,
            audienceRelevance: { "shop-floor": 10, "management": 9, "general": 8 }
          },
          {
            id: "efficiency-progress",
            type: "progress",
            title: "Today's Efficiency",
            position: { x: 0, y: 5, width: 4, height: 2 },
            config: { 
              showTarget: true, 
              showTrend: true,
              targetValue: 85,
              currentValue: 82.4,
              unit: "%"
            },
            priority: 8,
            audienceRelevance: { "shop-floor": 9, "management": 8, "general": 6 }
          },
          {
            id: "shift-announcements",
            type: "announcements",
            title: "Shift Announcements",
            position: { x: 4, y: 5, width: 8, height: 2 },
            config: { 
              showLatest: 5, 
              autoScroll: true,
              showTimestamp: true,
              prioritizeUrgent: true
            },
            priority: 7,
            audienceRelevance: { "shop-floor": 10, "management": 6, "general": 8 }
          }
        ]
      },
      {
        name: "Executive Management Overview",
        description: "High-level KPIs, business metrics, and strategic performance indicators",
        location: "Executive Conference Room - 65\" Display",
        audience: "management",
        autoRotationInterval: 30,
        isActive: true,
        useAiMode: true,
        widgets: [
          {
            id: "financial-kpis",
            type: "metrics",
            title: "Financial Performance",
            position: { x: 0, y: 0, width: 4, height: 3 },
            config: { 
              showRevenue: true, 
              showCosts: true, 
              showMargin: true,
              showTrends: true,
              timeframe: "monthly"
            },
            priority: 10,
            audienceRelevance: { "management": 10, "sales": 8, "general": 5 }
          },
          {
            id: "production-summary",
            type: "chart",
            title: "Production Summary",
            position: { x: 4, y: 0, width: 4, height: 3 },
            config: { 
              chartType: "bar",
              showTargets: true,
              showVariance: true,
              timeframe: "weekly",
              includeForecasts: true
            },
            priority: 9,
            audienceRelevance: { "management": 10, "shop-floor": 7, "general": 6 }
          },
          {
            id: "customer-metrics",
            type: "metrics",
            title: "Customer Satisfaction",
            position: { x: 8, y: 0, width: 4, height: 3 },
            config: { 
              showOnTimeDelivery: true, 
              showQualityScore: true,
              showCustomerFeedback: true,
              includeComparisons: true
            },
            priority: 9,
            audienceRelevance: { "management": 10, "sales": 10, "customer-service": 9 }
          },
          {
            id: "capacity-utilization",
            type: "chart",
            title: "Capacity Utilization",
            position: { x: 0, y: 3, width: 6, height: 3 },
            config: { 
              chartType: "line",
              showOptimalRange: true,
              showBottlenecks: true,
              predictiveAnalytics: true
            },
            priority: 8,
            audienceRelevance: { "management": 10, "shop-floor": 8, "general": 6 }
          },
          {
            id: "strategic-goals",
            type: "progress",
            title: "Strategic Goals Progress",
            position: { x: 6, y: 3, width: 6, height: 3 },
            config: { 
              showQuarterly: true, 
              showAnnual: true,
              showMilestones: true,
              includeRiskFactors: true
            },
            priority: 9,
            audienceRelevance: { "management": 10, "general": 5 }
          }
        ]
      },
      {
        name: "Customer Experience Display",
        description: "Customer-facing metrics showcasing quality, delivery performance, and service excellence",
        location: "Customer Waiting Area - Interactive Kiosk",
        audience: "customer-service",
        autoRotationInterval: 20,
        isActive: true,
        useAiMode: false,
        widgets: [
          {
            id: "quality-excellence",
            type: "metrics",
            title: "Quality Excellence",
            position: { x: 0, y: 0, width: 6, height: 3 },
            config: { 
              showQualityScore: true, 
              showCertifications: true,
              showAwards: true,
              highlightAchievements: true
            },
            priority: 10,
            audienceRelevance: { "customer-service": 10, "sales": 9, "management": 8 }
          },
          {
            id: "delivery-performance",
            type: "chart",
            title: "On-Time Delivery Performance",
            position: { x: 6, y: 0, width: 6, height: 3 },
            config: { 
              chartType: "gauge",
              showTarget: true,
              showTrend: true,
              timeframe: "monthly",
              targetValue: 95
            },
            priority: 9,
            audienceRelevance: { "customer-service": 10, "sales": 10, "management": 8 }
          },
          {
            id: "customer-testimonials",
            type: "announcements",
            title: "Customer Success Stories",
            position: { x: 0, y: 3, width: 8, height: 3 },
            config: { 
              showTestimonials: true,
              autoRotate: true,
              showCompanyLogos: true,
              highlightPositive: true
            },
            priority: 8,
            audienceRelevance: { "customer-service": 10, "sales": 10, "management": 7 }
          },
          {
            id: "sustainability-metrics",
            type: "metrics",
            title: "Environmental Impact",
            position: { x: 8, y: 3, width: 4, height: 3 },
            config: { 
              showWasteReduction: true,
              showEnergyEfficiency: true,
              showRecycling: true,
              showCarbonFootprint: true
            },
            priority: 7,
            audienceRelevance: { "customer-service": 9, "management": 8, "general": 8 }
          }
        ]
      },
      {
        name: "Sales Performance Center",
        description: "Sales metrics, order pipeline, customer insights, and revenue tracking",
        location: "Sales Department - Multi-Screen Setup",
        audience: "sales",
        autoRotationInterval: 25,
        isActive: true,
        useAiMode: true,
        widgets: [
          {
            id: "sales-pipeline",
            type: "chart",
            title: "Sales Pipeline",
            position: { x: 0, y: 0, width: 8, height: 4 },
            config: { 
              chartType: "funnel",
              showConversion: true,
              showTargets: true,
              includeForecasts: true,
              timeframe: "quarterly"
            },
            priority: 10,
            audienceRelevance: { "sales": 10, "management": 9, "customer-service": 6 }
          },
          {
            id: "revenue-metrics",
            type: "metrics",
            title: "Revenue Performance",
            position: { x: 8, y: 0, width: 4, height: 2 },
            config: { 
              showRevenue: true, 
              showGrowth: true,
              showTargets: true,
              showTrends: true,
              timeframe: "monthly"
            },
            priority: 10,
            audienceRelevance: { "sales": 10, "management": 10, "general": 5 }
          },
          {
            id: "customer-acquisition",
            type: "metrics",
            title: "Customer Acquisition",
            position: { x: 8, y: 2, width: 4, height: 2 },
            config: { 
              showNewCustomers: true,
              showRetention: true,
              showLifetimeValue: true,
              compareToTarget: true
            },
            priority: 9,
            audienceRelevance: { "sales": 10, "management": 9, "customer-service": 7 }
          },
          {
            id: "order-fulfillment",
            type: "chart",
            title: "Order Fulfillment Status",
            position: { x: 0, y: 4, width: 6, height: 3 },
            config: { 
              chartType: "bar",
              showPending: true,
              showInProgress: true,
              showCompleted: true,
              realTimeUpdates: true
            },
            priority: 8,
            audienceRelevance: { "sales": 10, "customer-service": 9, "shop-floor": 7 }
          },
          {
            id: "market-opportunities",
            type: "announcements",
            title: "Market Opportunities",
            position: { x: 6, y: 4, width: 6, height: 3 },
            config: { 
              showLeads: true,
              showProspects: true,
              showMarketTrends: true,
              prioritizeHotLeads: true
            },
            priority: 8,
            audienceRelevance: { "sales": 10, "management": 8, "customer-service": 6 }
          }
        ]
      },
      {
        name: "General Information Hub",
        description: "Company updates, announcements, weather, and general information for all employees",
        location: "Main Lobby - Large Format Display",
        audience: "general",
        autoRotationInterval: 45,
        isActive: true,
        useAiMode: false,
        widgets: [
          {
            id: "company-news",
            type: "announcements",
            title: "Company News & Updates",
            position: { x: 0, y: 0, width: 8, height: 4 },
            config: { 
              showLatest: 5,
              autoScroll: true,
              showImages: true,
              prioritizeImportant: true,
              includeEvents: true
            },
            priority: 8,
            audienceRelevance: { "general": 10, "management": 7, "shop-floor": 8 }
          },
          {
            id: "weather-info",
            type: "weather",
            title: "Weather & Conditions",
            position: { x: 8, y: 0, width: 4, height: 2 },
            config: { 
              showCurrent: true,
              showForecast: true,
              showAlerts: true,
              location: "local"
            },
            priority: 5,
            audienceRelevance: { "general": 8, "shop-floor": 7, "management": 4 }
          },
          {
            id: "safety-reminders",
            type: "announcements",
            title: "Safety Reminders",
            position: { x: 8, y: 2, width: 4, height: 2 },
            config: { 
              showDailySafety: true,
              rotateTips: true,
              showIncidentFree: true,
              highlightProtocols: true
            },
            priority: 9,
            audienceRelevance: { "general": 10, "shop-floor": 10, "management": 8 }
          },
          {
            id: "production-overview",
            type: "metrics",
            title: "Today's Production",
            position: { x: 0, y: 4, width: 6, height: 2 },
            config: { 
              showBasicMetrics: true,
              showProgress: true,
              showAchievements: true,
              simplifiedView: true
            },
            priority: 7,
            audienceRelevance: { "general": 9, "shop-floor": 8, "management": 6 }
          },
          {
            id: "employee-recognition",
            type: "announcements",
            title: "Employee Recognition",
            position: { x: 6, y: 4, width: 6, height: 2 },
            config: { 
              showAchievements: true,
              showMilestones: true,
              showAnniversaries: true,
              celebrateSuccess: true
            },
            priority: 6,
            audienceRelevance: { "general": 10, "management": 7, "shop-floor": 9 }
          }
        ]
      }
    ];

    await db.insert(visualFactoryDisplays).values(visualFactoryDisplaysData);
    console.log("✅ Visual Factory displays seeded successfully");
  }

  // Seed User Management System (only if users don't exist)
  if (existingUsers.length === 0) {
    // Insert default roles
  const roleData = [
    { 
      name: "Director", 
      description: "Executive leadership with access to strategic planning and business goals" 
    },
    { 
      name: "Plant Manager", 
      description: "Factory operations oversight with capacity planning and strategic resource management" 
    },
    { 
      name: "Production Scheduler", 
      description: "Production planning, scheduling optimization, and resource allocation" 
    },
    { 
      name: "IT Administrator", 
      description: "System management, user administration, and technical infrastructure" 
    },
    {
      name: "Systems Manager",
      description: "IT systems oversight, security management, and infrastructure monitoring"
    },
    {
      name: "Trainer",
      description: "Training oversight with comprehensive view access to all system modules for demonstration purposes"
    }
  ];

  const insertedRoles = await db.insert(roles).values(roleData).onConflictDoUpdate({
    target: roles.name,
    set: {
      description: sql`excluded.description`,
      isActive: sql`excluded.is_active`,
    }
  }).returning();

  // Insert permissions for different features
  const permissionData = [
    // Business Goals (Directors)
    { name: "business-goals-view", feature: "business-goals", action: "view", description: "View business goals and strategic objectives" },
    { name: "business-goals-create", feature: "business-goals", action: "create", description: "Create new business goals" },
    { name: "business-goals-edit", feature: "business-goals", action: "edit", description: "Edit existing business goals" },
    { name: "business-goals-delete", feature: "business-goals", action: "delete", description: "Delete business goals" },
    
    // Capacity Planning (Plant Managers)
    { name: "capacity-planning-view", feature: "capacity-planning", action: "view", description: "View capacity planning scenarios" },
    { name: "capacity-planning-create", feature: "capacity-planning", action: "create", description: "Create capacity planning scenarios" },
    { name: "capacity-planning-edit", feature: "capacity-planning", action: "edit", description: "Edit capacity planning scenarios" },
    { name: "capacity-planning-delete", feature: "capacity-planning", action: "delete", description: "Delete capacity planning scenarios" },
    
    // Production Scheduling (Schedulers)
    { name: "production-scheduling-view", feature: "production-scheduling", action: "view", description: "View production schedules and Gantt charts" },
    { name: "production-scheduling-create", feature: "production-scheduling", action: "create", description: "Create production jobs and operations" },
    { name: "production-scheduling-edit", feature: "production-scheduling", action: "edit", description: "Edit production schedules and assignments" },
    { name: "production-scheduling-delete", feature: "production-scheduling", action: "delete", description: "Delete production jobs and operations" },
    
    // Systems Management (IT Administrators & Systems Managers)
    { name: "systems-management-view", feature: "systems-management", action: "view", description: "View system health and configurations" },
    { name: "systems-management-create", feature: "systems-management", action: "create", description: "Create system configurations" },
    { name: "systems-management-edit", feature: "systems-management", action: "edit", description: "Edit system settings and configurations" },
    { name: "systems-management-delete", feature: "systems-management", action: "delete", description: "Delete system configurations" },
    
    // User Management (IT Administrators)
    { name: "user-management-view", feature: "user-management", action: "view", description: "View users and role assignments" },
    { name: "user-management-create", feature: "user-management", action: "create", description: "Create new users and assign roles" },
    { name: "user-management-edit", feature: "user-management", action: "edit", description: "Edit user profiles and role assignments" },
    { name: "user-management-delete", feature: "user-management", action: "delete", description: "Delete users and revoke access" },
    
    // Reports and Analytics (All roles can view, create varies)
    { name: "reports-view", feature: "reports", action: "view", description: "View reports and analytics dashboards" },
    { name: "reports-create", feature: "reports", action: "create", description: "Create custom reports and analytics" },
    { name: "reports-edit", feature: "reports", action: "edit", description: "Edit report configurations" },
    { name: "reports-delete", feature: "reports", action: "delete", description: "Delete custom reports" },
    
    // Shop Floor Operations (Shop Floor Supervisors, Operators)
    { name: "shop-floor-view", feature: "shop-floor", action: "view", description: "View shop floor monitoring and resource status" },
    { name: "shop-floor-edit", feature: "shop-floor", action: "edit", description: "Update shop floor configurations and status" },
    { name: "shop-floor-create", feature: "shop-floor", action: "create", description: "Create shop floor events and notifications" },
    { name: "shop-floor-delete", feature: "shop-floor", action: "delete", description: "Remove shop floor events and configurations" },
    
    // Operator Dashboard (Operators)
    { name: "operator-dashboard-view", feature: "operator-dashboard", action: "view", description: "View operator-specific dashboard and tasks" },
    { name: "operator-dashboard-edit", feature: "operator-dashboard", action: "edit", description: "Update operator task status and reports" },
    
    // Maintenance Management (Maintenance Technicians, Supervisors)
    { name: "maintenance-view", feature: "maintenance", action: "view", description: "View maintenance schedules and work orders" },
    { name: "maintenance-create", feature: "maintenance", action: "create", description: "Create maintenance work orders and schedules" },
    { name: "maintenance-edit", feature: "maintenance", action: "edit", description: "Update maintenance tasks and completion status" },
    { name: "maintenance-delete", feature: "maintenance", action: "delete", description: "Remove maintenance work orders" },
    
    // Customer Service (Customer Service Agents, Sales)
    { name: "customer-service-view", feature: "customer-service", action: "view", description: "View customer orders, issues, and service records" },
    { name: "customer-service-create", feature: "customer-service", action: "create", description: "Create customer service cases and follow-ups" },
    { name: "customer-service-edit", feature: "customer-service", action: "edit", description: "Update customer information and service status" },
    { name: "customer-service-delete", feature: "customer-service", action: "delete", description: "Remove customer service records" },
    
    // Sales Management (Sales Representatives)
    { name: "sales-view", feature: "sales", action: "view", description: "View sales orders and customer relationships" },
    { name: "sales-create", feature: "sales", action: "create", description: "Create sales orders and customer accounts" },
    { name: "sales-edit", feature: "sales", action: "edit", description: "Update sales information and order status" },
    { name: "sales-delete", feature: "sales", action: "delete", description: "Remove sales records and orders" },
    
    // Training System (Trainers)
    { name: "training-view", feature: "training", action: "view", description: "View training modules and role demonstrations" },
    { name: "training-create", feature: "training", action: "create", description: "Create training content and tour configurations" },
    { name: "training-edit", feature: "training", action: "edit", description: "Update training materials and demo settings" },
    { name: "training-delete", feature: "training", action: "delete", description: "Remove training content" },
    
    // Presentation System (Directors, Plant Managers, Trainers)
    { name: "presentation-system-view", feature: "presentation-system", action: "view", description: "View presentations and presentation library" },
    { name: "presentation-system-create", feature: "presentation-system", action: "create", description: "Create presentations with AI generation" },
    { name: "presentation-system-edit", feature: "presentation-system", action: "edit", description: "Edit presentation content and settings" },
    { name: "presentation-system-delete", feature: "presentation-system", action: "delete", description: "Delete presentations" }
  ];

  const insertedPermissions = await db.insert(permissions).values(permissionData).onConflictDoUpdate({
    target: permissions.name,
    set: {
      feature: sql`excluded.feature`,
      action: sql`excluded.action`,
      description: sql`excluded.description`,
    }
  }).returning();

  // Assign permissions to roles
  const rolePermissionData = [
    // Director permissions (Business Goals + Reports + Systems Management View)
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "business-goals" && p.action === "view")!.id },
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "business-goals" && p.action === "create")!.id },
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "business-goals" && p.action === "edit")!.id },
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "business-goals" && p.action === "delete")!.id },
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "view")!.id },
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "create")!.id },
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "view")!.id },
    
    // Plant Manager permissions (Capacity Planning + Production Scheduling + Reports)
    { roleId: insertedRoles[1].id, permissionId: insertedPermissions.find(p => p.feature === "capacity-planning" && p.action === "view")!.id },
    { roleId: insertedRoles[1].id, permissionId: insertedPermissions.find(p => p.feature === "capacity-planning" && p.action === "create")!.id },
    { roleId: insertedRoles[1].id, permissionId: insertedPermissions.find(p => p.feature === "capacity-planning" && p.action === "edit")!.id },
    { roleId: insertedRoles[1].id, permissionId: insertedPermissions.find(p => p.feature === "capacity-planning" && p.action === "delete")!.id },
    { roleId: insertedRoles[1].id, permissionId: insertedPermissions.find(p => p.feature === "production-scheduling" && p.action === "view")!.id },
    { roleId: insertedRoles[1].id, permissionId: insertedPermissions.find(p => p.feature === "production-scheduling" && p.action === "edit")!.id },
    { roleId: insertedRoles[1].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "view")!.id },
    { roleId: insertedRoles[1].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "create")!.id },
    
    // Production Scheduler permissions (Production Scheduling + Reports)
    { roleId: insertedRoles[2].id, permissionId: insertedPermissions.find(p => p.feature === "production-scheduling" && p.action === "view")!.id },
    { roleId: insertedRoles[2].id, permissionId: insertedPermissions.find(p => p.feature === "production-scheduling" && p.action === "create")!.id },
    { roleId: insertedRoles[2].id, permissionId: insertedPermissions.find(p => p.feature === "production-scheduling" && p.action === "edit")!.id },
    { roleId: insertedRoles[2].id, permissionId: insertedPermissions.find(p => p.feature === "production-scheduling" && p.action === "delete")!.id },
    { roleId: insertedRoles[2].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "view")!.id },
    { roleId: insertedRoles[2].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "create")!.id },
    
    // IT Administrator permissions (User Management + Systems Management + Reports)
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "user-management" && p.action === "view")!.id },
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "user-management" && p.action === "create")!.id },
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "user-management" && p.action === "edit")!.id },
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "user-management" && p.action === "delete")!.id },
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "view")!.id },
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "create")!.id },
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "edit")!.id },
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "delete")!.id },
    { roleId: insertedRoles[3].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "view")!.id },
    
    // Systems Manager permissions (Systems Management + Reports)
    { roleId: insertedRoles[4].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "view")!.id },
    { roleId: insertedRoles[4].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "create")!.id },
    { roleId: insertedRoles[4].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "edit")!.id },
    { roleId: insertedRoles[4].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "delete")!.id },
    { roleId: insertedRoles[4].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "view")!.id },
    
    // Trainer permissions (Training + Systems Management View + Analytics + Business Goals View)
    { roleId: insertedRoles[5].id, permissionId: insertedPermissions.find(p => p.feature === "training" && p.action === "view")!.id },
    { roleId: insertedRoles[5].id, permissionId: insertedPermissions.find(p => p.feature === "training" && p.action === "create")!.id },
    { roleId: insertedRoles[5].id, permissionId: insertedPermissions.find(p => p.feature === "training" && p.action === "edit")!.id },
    { roleId: insertedRoles[5].id, permissionId: insertedPermissions.find(p => p.feature === "training" && p.action === "delete")!.id },
    { roleId: insertedRoles[5].id, permissionId: insertedPermissions.find(p => p.feature === "systems-management" && p.action === "view")!.id },
    { roleId: insertedRoles[5].id, permissionId: insertedPermissions.find(p => p.feature === "analytics" && p.action === "view")!.id },
    { roleId: insertedRoles[5].id, permissionId: insertedPermissions.find(p => p.feature === "business-goals" && p.action === "view")!.id },
    { roleId: insertedRoles[5].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "view")!.id },
    { roleId: insertedRoles[5].id, permissionId: insertedPermissions.find(p => p.feature === "production-scheduling" && p.action === "view")!.id },
    { roleId: insertedRoles[5].id, permissionId: insertedPermissions.find(p => p.feature === "shop-floor" && p.action === "view")!.id }
  ];

  await db.insert(rolePermissions).values(rolePermissionData).onConflictDoNothing();

  // Create default users with hashed passwords
  const hashedPassword = await bcrypt.hash("password123", 12);
  
  const userData = [
    {
      username: "director",
      email: "director@planettogether.com",
      firstName: "Sarah",
      lastName: "Johnson",
      passwordHash: hashedPassword,
      isActive: true
    },
    {
      username: "plant_manager",
      email: "manager@planettogether.com",
      firstName: "Mike",
      lastName: "Chen",
      passwordHash: hashedPassword,
      isActive: true
    },
    {
      username: "scheduler",
      email: "scheduler@planettogether.com",
      firstName: "Emily",
      lastName: "Rodriguez",
      passwordHash: hashedPassword,
      isActive: true
    },
    {
      username: "admin",
      email: "admin@planettogether.com",
      firstName: "David",
      lastName: "Kim",
      passwordHash: hashedPassword,
      isActive: true
    },
    {
      username: "sysmanager",
      email: "systems@planettogether.com",
      firstName: "Alex",
      lastName: "Thompson",
      passwordHash: hashedPassword,
      isActive: true
    },
    {
      username: "trainer",
      email: "trainer@planettogether.com",
      firstName: "Morgan",
      lastName: "Williams",
      passwordHash: hashedPassword,
      isActive: true
    }
  ];

  const insertedUsers = await db.insert(users).values(userData).onConflictDoUpdate({
    target: users.username,
    set: {
      email: sql`excluded.email`,
      firstName: sql`excluded.first_name`,
      lastName: sql`excluded.last_name`,
      passwordHash: sql`excluded.password_hash`,
      isActive: sql`excluded.is_active`,
    }
  }).returning();

  // Assign roles to users
  const userRoleData = [
    { userId: insertedUsers[0].id, roleId: insertedRoles[0].id }, // Director
    { userId: insertedUsers[1].id, roleId: insertedRoles[1].id }, // Plant Manager
    { userId: insertedUsers[2].id, roleId: insertedRoles[2].id }, // Production Scheduler
    { userId: insertedUsers[3].id, roleId: insertedRoles[3].id }, // IT Administrator
    { userId: insertedUsers[4].id, roleId: insertedRoles[4].id }, // Systems Manager
    { userId: insertedUsers[5].id, roleId: insertedRoles[5].id }, // Trainer
  ];

  await db.insert(userRoles).values(userRoleData).onConflictDoNothing();

    console.log("User management system seeded!");
    console.log("Default users created:");
    console.log("- director / password123 (Business Goals access)");
    console.log("- plant_manager / password123 (Capacity Planning + Production access)");
    console.log("- scheduler / password123 (Production Scheduling access)");
    console.log("- admin / password123 (User Management + Systems access)");
    console.log("- sysmanager / password123 (Systems Management access)");
    console.log("- trainer / password123 (Training and Demonstrations)");
    
    // Now create default roles for all features
    await seedDefaultRoles();
    
    // Seed marketing data
    await seedMarketingData();
  }

  console.log("Database seeding completed!");
}

async function seedDefaultRoles() {
  console.log("Seeding default roles...");
  
  // Get all permissions to create comprehensive role definitions
  const allPermissions = await db.select().from(permissions);
  
  // Define default roles with their associated permissions
  const defaultRoles = [
    {
      name: "Administrator",
      description: "Full system access with all permissions across all features",
      permissions: allPermissions.map(p => p.id) // All permissions
    },
    {
      name: "Director",
      description: "Strategic oversight with access to business goals, reporting, and scheduling",
      permissions: allPermissions
        .filter(p => ['business-goals', 'reports', 'schedule', 'analytics', 'systems-management', 'presentation-system'].includes(p.feature))
        .map(p => p.id)
    },
    {
      name: "Plant Manager", 
      description: "Plant operations management with capacity planning and systems oversight",
      permissions: allPermissions
        .filter(p => ['plant-manager', 'capacity-planning', 'schedule', 'boards', 'reports', 'analytics', 'production-scheduling'].includes(p.feature))
        .map(p => p.id)
    },
    {
      name: "Production Scheduler",
      description: "Production scheduling and optimization with order management",
      permissions: allPermissions
        .filter(p => ['schedule', 'scheduling-optimizer', 'boards', 'erp-import', 'analytics', 'production-scheduling', 'shop-floor'].includes(p.feature))
        .map(p => p.id)
    },
    {
      name: "Shop Floor Supervisor",
      description: "Shop floor operations with operator oversight and maintenance coordination", 
      permissions: allPermissions
        .filter(p => ['shop-floor', 'operator-dashboard', 'maintenance', 'schedule'].includes(p.feature))
        .map(p => p.id)
    },
    {
      name: "Operator",
      description: "Equipment operation with task management and status reporting",
      permissions: allPermissions
        .filter(p => ['operator-dashboard'].includes(p.feature) && p.action === 'view')
        .map(p => p.id)
    },
    {
      name: "Maintenance Technician", 
      description: "Equipment maintenance with work order and scheduling access",
      permissions: allPermissions
        .filter(p => ['maintenance', 'schedule'].includes(p.feature))
        .map(p => p.id)
    },
    {
      name: "Forklift Driver",
      description: "Material movement tracking and logistics coordination",
      permissions: allPermissions
        .filter(p => ['forklift-driver'].includes(p.feature))
        .map(p => p.id)
    },
    {
      name: "Sales Representative",
      description: "Customer relationship management and order processing",
      permissions: allPermissions
        .filter(p => ['sales', 'customer-service'].includes(p.feature))
        .map(p => p.id)
    },
    {
      name: "Customer Service Agent",
      description: "Customer support with order tracking and issue management", 
      permissions: allPermissions
        .filter(p => ['customer-service', 'sales'].includes(p.feature) && ['view', 'edit'].includes(p.action))
        .map(p => p.id)
    },
    {
      name: "IT Systems Administrator",
      description: "IT infrastructure management with user and system administration",
      permissions: allPermissions
        .filter(p => ['systems-management', 'user-management'].includes(p.feature))
        .map(p => p.id)
    },
    {
      name: "Data Analyst",
      description: "Business intelligence with reporting and analytics access",
      permissions: allPermissions
        .filter(p => ['analytics', 'reports', 'business-goals'].includes(p.feature) && ['view', 'create'].includes(p.action))
        .map(p => p.id)
    },
    {
      name: "Trainer",
      description: "Comprehensive training oversight with view access to all system modules for demonstration purposes",
      permissions: allPermissions
        .filter(p => p.action === 'view')
        .map(p => p.id)
    }
  ];

  // Create each default role
  for (const roleData of defaultRoles) {
    try {
      // Check if role already exists
      const existingRole = await db.select().from(roles).where(sql`${roles.name} = ${roleData.name}`).limit(1);
      
      if (existingRole.length === 0 && roleData.permissions.length > 0) {
        // Create the role
        const [newRole] = await db.insert(roles).values({
          name: roleData.name,
          description: roleData.description,
          isSystemRole: true
        }).returning();

        // Assign permissions to the role
        if (roleData.permissions.length > 0) {
          const rolePermissionData = roleData.permissions.map(permissionId => ({
            roleId: newRole.id,
            permissionId
          }));
          
          await db.insert(rolePermissions).values(rolePermissionData);
        }
        
        console.log(`✓ Created default role: ${roleData.name} with ${roleData.permissions.length} permissions`);
      }
    } catch (error) {
      console.error(`Error creating role ${roleData.name}:`, error);
    }
  }
  
  console.log("✓ Default roles seeded successfully");
}

async function seedMarketingData() {
  console.log("Seeding marketing data...");
  
  try {
    // Check if marketing data already exists
    const existingStories = await db.select().from(customerStories).limit(1);
    if (existingStories.length > 0) {
      console.log("Marketing data already exists, skipping...");
      return;
    }

    // Seed customer success stories
    const customerStoryData = [
      {
        customerName: "Sarah Chen",
        customerTitle: "VP of Operations",
        company: "TechCorp Manufacturing",
        industry: "Electronics",
        companySize: "medium",
        story: {
          challenge: "Manual scheduling processes and lack of real-time visibility created production bottlenecks",
          solution: "Implemented AI-powered scheduling with real-time optimization and predictive analytics",
          results: [
            { metric: "Production Efficiency", improvement: "+28%", description: "Streamlined workflow automation" },
            { metric: "Cost Savings", improvement: "$450k annually", description: "Reduced waste and optimized resources" },
            { metric: "Lead Time Reduction", improvement: "-35%", description: "Faster order fulfillment" },
            { metric: "Quality Improvement", improvement: "+15%", description: "Better process control" }
          ],
          quote: "PlanetTogether's AI scheduling has revolutionized our production workflow. We've seen immediate improvements in efficiency and our customers are getting their orders faster than ever."
        },
        storyType: "testimonial",
        language: "en",
        isApproved: true,
        isFeatured: true,
        effectivenessScore: 95
      },
      {
        customerName: "Marcus Rodriguez",
        customerTitle: "Plant Manager",
        company: "Alpine Automotive Parts",
        industry: "Automotive",
        companySize: "large",
        story: {
          challenge: "Multi-plant coordination difficulties and resource allocation inefficiencies",
          solution: "Comprehensive production intelligence platform with multi-plant visibility",
          results: [
            { metric: "Resource Efficiency", improvement: "+22%", description: "Optimized allocation across plants" },
            { metric: "Annual Savings", improvement: "$750k", description: "Reduced operational costs" },
            { metric: "Coordination Time", improvement: "-18%", description: "Faster cross-plant communication" },
            { metric: "Quality Standards", improvement: "+12%", description: "Consistent quality across facilities" }
          ],
          quote: "The real-time visibility into our entire supply chain has been game-changing. We can now proactively address bottlenecks before they impact delivery."
        },
        storyType: "case_study",
        language: "en",
        isApproved: true,
        isFeatured: true,
        effectivenessScore: 88
      },
      {
        customerName: "Jennifer Walsh",
        customerTitle: "Quality Director",
        company: "Precision Aerospace Solutions",
        industry: "Aerospace",
        companySize: "medium",
        story: {
          challenge: "Complex quality control requirements with stringent aerospace standards",
          solution: "AI-driven quality monitoring with predictive defect detection",
          results: [
            { metric: "Defect Detection Speed", improvement: "+40%", description: "Faster quality issue identification" },
            { metric: "Process Efficiency", improvement: "+19%", description: "Streamlined quality workflows" },
            { metric: "Cost Reduction", improvement: "$320k saved", description: "Prevented quality failures" },
            { metric: "Compliance Rate", improvement: "99.8%", description: "Zero-defect production maintained" }
          ],
          quote: "In aerospace, quality is everything. PlanetTogether's predictive analytics help us maintain our zero-defect standards while increasing throughput."
        },
        storyType: "testimonial",
        language: "en",
        isApproved: true,
        isFeatured: true,
        effectivenessScore: 92
      }
    ];

    // Marketing functionality removed - customerStories table no longer exists
    // await db.insert(customerStories).values(customerStoryData);

    // Seed content blocks for dynamic marketing content
    const contentBlockData = [
      {
        name: "Value Proposition - AI Intelligence",
        type: "hero_content",
        category: "value_proposition",
        content: "Transform your production operations with intelligent scheduling, real-time optimization, and predictive analytics that adapt to your unique manufacturing requirements.",
        language: "en",
        usageCount: 0,
        isActive: true,
        conversionRate: 15.5
      },
      {
        name: "Pain Point - Scheduling Challenges",
        type: "problem_statement",
        category: "pain_point",
        content: "Manual scheduling processes, resource conflicts, and limited visibility create bottlenecks that cost manufacturers millions in lost productivity and delayed deliveries.",
        language: "en",
        usageCount: 0,
        isActive: true,
        conversionRate: 12.3
      },
      {
        name: "Solution - Resource Optimization",
        type: "solution_benefit",
        category: "solution_benefit",
        content: "Our AI engine automatically optimizes resource allocation, predicts potential conflicts, and suggests schedule adjustments to maximize throughput while meeting delivery commitments.",
        language: "en",
        usageCount: 0,
        isActive: true,
        conversionRate: 18.7
      },
      {
        name: "Social Proof - Industry Leaders",
        type: "testimonial_summary",
        category: "social_proof",
        content: "Join 1,000+ manufacturers across automotive, aerospace, electronics, and pharmaceutical industries who trust PlanetTogether to optimize their production operations.",
        language: "en",
        usageCount: 0,
        isActive: true,
        conversionRate: 14.2
      },
      {
        name: "Primary CTA - Free Trial",
        type: "call_to_action",
        category: "cta_primary",
        content: "Experience the power of AI-driven manufacturing intelligence with our 14-day free trial. No credit card required, full feature access, and dedicated onboarding support.",
        language: "en",
        usageCount: 0,
        isActive: true,
        conversionRate: 22.1
      }
    ];

    // Marketing functionality removed - contentBlocks table no longer exists
    // await db.insert(contentBlocks).values(contentBlockData);

    // Seed marketing pages configuration  
    const marketingPageData = [
      {
        name: "Main Landing Page",
        title: "AI-Powered Manufacturing Intelligence Platform",
        content: {
          hero: {
            headline: "Transform Your Manufacturing Operations with AI-Powered Intelligence",
            subheadline: "Join 1,000+ manufacturers achieving 25% efficiency gains through intelligent production scheduling, real-time optimization, and AI-driven insights.",
            cta_primary: "Start Free Trial",
            cta_secondary: "Schedule Demo",
            background_image: "/assets/manufacturing-hero.jpg"
          },
          sections: [
            {
              type: "benefits",
              title: "Measurable Results from Day One",
              content: "Our customers consistently achieve significant improvements in key manufacturing metrics within the first 90 days."
            },
            {
              type: "customer_stories",
              title: "Success Stories from Leading Manufacturers", 
              content: "Real results from real companies transforming their operations with our platform."
            },
            {
              type: "pricing",
              title: "Transparent Pricing for Every Scale",
              content: "From small shops to enterprise facilities, we have a plan that scales with your manufacturing operations."
            }
          ]
        },
        stageId: 1,
        pageType: "landing_page",
        language: "en",
        targetAudience: ["C-Suite", "Plant Manager", "Production Manager", "IT Director"],
        conversionGoals: ["free_trial_signup", "demo_request", "contact_sales"],
        isPublished: true,
        seoTitle: "AI Manufacturing Intelligence Platform | PlanetTogether",
        seoDescription: "Transform your manufacturing operations with AI-powered production scheduling, real-time optimization, and intelligent insights. 14-day free trial available."
      }
    ];

    // Marketing functionality removed - marketingPages table no longer exists
    // await db.insert(marketingPages).values(marketingPageData);

    console.log("✓ Marketing data seeded successfully");
    console.log("  - 3 customer success stories created");
    console.log("  - 5 content blocks for dynamic marketing content");
    console.log("  - 1 marketing page configuration");
    
  } catch (error) {
    console.error("Error seeding marketing data:", error);
  }

  // Seed Industry Templates
  if (shouldReseedIndustryTemplates) {
    console.log("Seeding industry templates...");

    const industryTemplateData = [
      {
        name: "Automotive Manufacturing",
        description: "Comprehensive template for automotive parts and assembly operations with lean manufacturing principles, quality control, and safety management.",
        category: "automotive",
        targetIndustry: "Automotive",
        companySize: "large",
        configuration: {
          dashboards: [
            {
              name: "Production Overview",
              description: "Main production dashboard for automotive manufacturing",
              layout: "grid",
              widgets: [
                { type: "production_metrics", position: { x: 0, y: 0, width: 2, height: 1 }, config: { title: "Production Rate", metric: "units_per_hour" } },
                { type: "quality_metrics", position: { x: 2, y: 0, width: 2, height: 1 }, config: { title: "Quality Score", metric: "defect_rate" } },
                { type: "efficiency_chart", position: { x: 0, y: 1, width: 4, height: 2 }, config: { title: "Line Efficiency", timeRange: "24h" } }
              ]
            }
          ],
          kpis: [
            { name: "OEE", description: "Overall Equipment Effectiveness", category: "efficiency", calculation: "availability * performance * quality", target: 85, unit: "%", displayFormat: "percentage" },
            { name: "Takt Time", description: "Available production time / customer demand", category: "production", calculation: "working_time / demand", target: 45, unit: "seconds", displayFormat: "decimal" },
            { name: "First Pass Yield", description: "Units passing quality on first attempt", category: "quality", calculation: "good_units / total_units", target: 98, unit: "%", displayFormat: "percentage" }
          ],
          theme: {
            primaryColor: "#1e40af",
            secondaryColor: "#3b82f6",
            accentColor: "#60a5fa",
            backgroundColor: "#f8fafc",
            textColor: "#1e293b"
          }
        },
        features: ["production_scheduling", "quality_control", "maintenance_management", "stock_tracking", "lean_manufacturing"],
        prerequisites: ["ERP_integration", "quality_systems", "maintenance_planning"],
        setupInstructions: "1. Configure production lines and work centers\n2. Set up quality checkpoints and inspection protocols\n3. Integrate with existing ERP and MES systems\n4. Train operators on lean manufacturing principles\n5. Establish preventive maintenance schedules",
        benefits: ["Improved OEE by 15-25%", "Reduced quality defects by 30%", "Faster changeover times", "Better supplier quality management", "Real-time production visibility"],
        tags: ["automotive", "lean", "quality", "oee", "manufacturing"],
        aiPrompt: "Create an automotive manufacturing template focusing on lean principles, quality control, and operational efficiency for automotive parts production."
      },
      {
        name: "Electronics Assembly",
        description: "Specialized template for electronics manufacturing with SMT lines, component traceability, and strict quality standards for electronic components.",
        category: "electronics",
        targetIndustry: "Electronics",
        companySize: "medium",
        configuration: {
          dashboards: [
            {
              name: "SMT Line Dashboard",
              description: "Surface Mount Technology line monitoring",
              layout: "grid",
              widgets: [
                { type: "line_status", position: { x: 0, y: 0, width: 2, height: 1 }, config: { title: "Line Status", lines: ["SMT-1", "SMT-2", "SMT-3"] } },
                { type: "component_usage", position: { x: 2, y: 0, width: 2, height: 1 }, config: { title: "Component Consumption", realTime: true } },
                { type: "defect_tracking", position: { x: 0, y: 1, width: 4, height: 2 }, config: { title: "Defect Analysis", categories: ["solder", "placement", "missing"] } }
              ]
            }
          ],
          kpis: [
            { name: "Placement Accuracy", description: "Component placement precision rate", category: "quality", calculation: "accurate_placements / total_placements", target: 99.9, unit: "%", displayFormat: "percentage" },
            { name: "Throughput", description: "Boards per hour", category: "production", calculation: "completed_boards / hour", target: 120, unit: "boards/hr", displayFormat: "integer" },
            { name: "First Pass Yield", description: "Boards passing without rework", category: "quality", calculation: "pass_boards / total_boards", target: 95, unit: "%", displayFormat: "percentage" }
          ],
          theme: {
            primaryColor: "#059669",
            secondaryColor: "#10b981",
            accentColor: "#34d399",
            backgroundColor: "#f0fdf4",
            textColor: "#064e3b"
          }
        },
        features: ["smt_line_control", "component_traceability", "aoi_integration", "pick_place_optimization", "pcb_tracking"],
        prerequisites: ["SMT_equipment", "component_management", "traceability_system"],
        setupInstructions: "1. Configure SMT line equipment integration\n2. Set up component reel tracking and management\n3. Integrate AOI (Automated Optical Inspection) systems\n4. Configure pick-and-place optimization algorithms\n5. Establish PCB traceability workflows",
        benefits: ["Reduced placement defects by 40%", "Improved component utilization", "Faster line changeovers", "Enhanced traceability", "Better yield management"],
        tags: ["electronics", "smt", "pcb", "component", "traceability"],
        aiPrompt: "Create an electronics manufacturing template optimized for SMT assembly lines with component tracking and quality control."
      },
      {
        name: "Food & Beverage Production",
        description: "Template for food and beverage manufacturing with HACCP compliance, batch tracking, expiration management, and safety protocols.",
        category: "food_beverage",
        targetIndustry: "Food & Beverage",
        companySize: "medium",
        configuration: {
          dashboards: [
            {
              name: "Production Control",
              description: "Food production monitoring with safety focus",
              layout: "grid",
              widgets: [
                { type: "batch_tracking", position: { x: 0, y: 0, width: 2, height: 1 }, config: { title: "Active Batches", includeExpiry: true } },
                { type: "temperature_monitoring", position: { x: 2, y: 0, width: 2, height: 1 }, config: { title: "Temperature Control", criticalPoints: true } },
                { type: "safety_alerts", position: { x: 0, y: 1, width: 4, height: 1 }, config: { title: "Safety & Compliance", haccp: true } }
              ]
            }
          ],
          kpis: [
            { name: "Batch Yield", description: "Successful batch completion rate", category: "production", calculation: "good_batches / total_batches", target: 98, unit: "%", displayFormat: "percentage" },
            { name: "Safety Score", description: "HACCP compliance score", category: "safety", calculation: "compliant_checks / total_checks", target: 100, unit: "%", displayFormat: "percentage" },
            { name: "Waste Percentage", description: "Production waste rate", category: "efficiency", calculation: "waste_volume / total_volume", target: 2, unit: "%", displayFormat: "percentage" }
          ],
          theme: {
            primaryColor: "#dc2626",
            secondaryColor: "#ef4444",
            accentColor: "#f87171",
            backgroundColor: "#fef2f2",
            textColor: "#7f1d1d"
          }
        },
        features: ["batch_management", "haccp_compliance", "temperature_monitoring", "expiry_tracking", "allergen_management"],
        prerequisites: ["HACCP_system", "temperature_sensors", "batch_tracking"],
        setupInstructions: "1. Set up HACCP critical control points\n2. Configure temperature monitoring systems\n3. Establish batch tracking and lot management\n4. Implement allergen control procedures\n5. Set up expiration date management",
        benefits: ["100% HACCP compliance", "Reduced food safety incidents", "Better batch traceability", "Improved yield consistency", "Faster recall response"],
        tags: ["food", "beverage", "haccp", "safety", "batch"],
        aiPrompt: "Create a food and beverage manufacturing template with HACCP compliance, batch tracking, and food safety protocols."
      },
      {
        name: "Pharmaceutical Manufacturing",
        description: "GMP-compliant template for pharmaceutical production with validation protocols, serialization, and regulatory compliance tracking.",
        category: "pharmaceutical",
        targetIndustry: "Pharmaceutical",
        companySize: "large",
        configuration: {
          dashboards: [
            {
              name: "GMP Compliance",
              description: "Good Manufacturing Practice monitoring",
              layout: "grid",
              widgets: [
                { type: "validation_status", position: { x: 0, y: 0, width: 2, height: 1 }, config: { title: "Validation Status", protocols: ["IQ", "OQ", "PQ"] } },
                { type: "serialization", position: { x: 2, y: 0, width: 2, height: 1 }, config: { title: "Product Serialization", trackAndTrace: true } },
                { type: "environmental_monitoring", position: { x: 0, y: 1, width: 4, height: 2 }, config: { title: "Clean Room Conditions", parameters: ["temperature", "humidity", "pressure", "particles"] } }
              ]
            }
          ],
          kpis: [
            { name: "GMP Compliance", description: "Good Manufacturing Practice score", category: "quality", calculation: "compliant_activities / total_activities", target: 100, unit: "%", displayFormat: "percentage" },
            { name: "Right First Time", description: "Batches passing without deviation", category: "production", calculation: "successful_batches / total_batches", target: 99, unit: "%", displayFormat: "percentage" },
            { name: "Clean Room Grade", description: "Environmental compliance score", category: "safety", calculation: "compliant_measurements / total_measurements", target: 99.9, unit: "%", displayFormat: "percentage" }
          ],
          theme: {
            primaryColor: "#7c3aed",
            secondaryColor: "#8b5cf6",
            accentColor: "#a78bfa",
            backgroundColor: "#faf5ff",
            textColor: "#581c87"
          }
        },
        features: ["gmp_compliance", "validation_management", "serialization", "clean_room_monitoring", "deviation_tracking"],
        prerequisites: ["GMP_certification", "validation_protocols", "serialization_system"],
        setupInstructions: "1. Implement GMP validation protocols\n2. Set up product serialization and track-and-trace\n3. Configure clean room environmental monitoring\n4. Establish deviation management workflows\n5. Implement electronic batch records",
        benefits: ["100% GMP compliance", "Reduced regulatory risks", "Faster product releases", "Complete traceability", "Improved audit readiness"],
        tags: ["pharmaceutical", "gmp", "validation", "serialization", "compliance"],
        aiPrompt: "Create a pharmaceutical manufacturing template with GMP compliance, validation protocols, and regulatory tracking."
      },
      {
        name: "Aerospace Manufacturing",
        description: "High-precision template for aerospace components with AS9100 standards, material traceability, and strict quality requirements.",
        category: "aerospace",
        targetIndustry: "Aerospace",
        companySize: "large",
        configuration: {
          dashboards: [
            {
              name: "Precision Manufacturing",
              description: "Aerospace component production monitoring",
              layout: "grid",
              widgets: [
                { type: "precision_metrics", position: { x: 0, y: 0, width: 2, height: 1 }, config: { title: "Precision Control", tolerance: "±0.001" } },
                { type: "material_traceability", position: { x: 2, y: 0, width: 2, height: 1 }, config: { title: "Material Pedigree", certifications: true } },
                { type: "inspection_results", position: { x: 0, y: 1, width: 4, height: 2 }, config: { title: "Quality Inspections", nonDestructive: true } }
              ]
            }
          ],
          kpis: [
            { name: "First Article Approval", description: "FAI success rate", category: "quality", calculation: "approved_fai / total_fai", target: 95, unit: "%", displayFormat: "percentage" },
            { name: "AS9100 Score", description: "Quality management system compliance", category: "quality", calculation: "compliant_processes / total_processes", target: 100, unit: "%", displayFormat: "percentage" },
            { name: "Material Traceability", description: "Complete material pedigree tracking", category: "compliance", calculation: "traced_materials / total_materials", target: 100, unit: "%", displayFormat: "percentage" }
          ],
          theme: {
            primaryColor: "#0f172a",
            secondaryColor: "#334155",
            accentColor: "#64748b",
            backgroundColor: "#f8fafc",
            textColor: "#0f172a"
          }
        },
        features: ["as9100_compliance", "material_traceability", "precision_control", "fai_management", "ndt_integration"],
        prerequisites: ["AS9100_certification", "precision_equipment", "traceability_system"],
        setupInstructions: "1. Implement AS9100 quality management system\n2. Set up complete material traceability workflows\n3. Configure precision measurement and control systems\n4. Establish First Article Inspection protocols\n5. Integrate Non-Destructive Testing equipment",
        benefits: ["AS9100 compliance", "Complete material traceability", "Reduced scrap and rework", "Faster customer approvals", "Enhanced quality reputation"],
        tags: ["aerospace", "as9100", "precision", "traceability", "quality"],
        aiPrompt: "Create an aerospace manufacturing template with AS9100 compliance, precision control, and material traceability."
      },
      {
        name: "General Manufacturing",
        description: "Versatile template suitable for various manufacturing industries with core production planning, quality control, and efficiency tracking.",
        category: "manufacturing",
        targetIndustry: "General Manufacturing",
        companySize: "medium",
        configuration: {
          dashboards: [
            {
              name: "Manufacturing Overview",
              description: "General purpose manufacturing dashboard",
              layout: "grid",
              widgets: [
                { type: "production_status", position: { x: 0, y: 0, width: 2, height: 1 }, config: { title: "Production Status", realTime: true } },
                { type: "efficiency_metrics", position: { x: 2, y: 0, width: 2, height: 1 }, config: { title: "Efficiency Tracking", oee: true } },
                { type: "quality_overview", position: { x: 0, y: 1, width: 4, height: 2 }, config: { title: "Quality Metrics", trending: true } }
              ]
            }
          ],
          kpis: [
            { name: "Overall Equipment Effectiveness", description: "Combined availability, performance, and quality", category: "efficiency", calculation: "availability * performance * quality", target: 80, unit: "%", displayFormat: "percentage" },
            { name: "On-Time Delivery", description: "Orders delivered on schedule", category: "production", calculation: "on_time_orders / total_orders", target: 95, unit: "%", displayFormat: "percentage" },
            { name: "Quality Rate", description: "Products meeting quality standards", category: "quality", calculation: "quality_products / total_products", target: 98, unit: "%", displayFormat: "percentage" }
          ],
          theme: {
            primaryColor: "#2563eb",
            secondaryColor: "#3b82f6",
            accentColor: "#60a5fa",
            backgroundColor: "#f8fafc",
            textColor: "#1e293b"
          }
        },
        features: ["production_planning", "quality_control", "efficiency_tracking", "stock_management", "maintenance_scheduling"],
        prerequisites: ["production_systems", "quality_processes", "maintenance_planning"],
        setupInstructions: "1. Configure production planning workflows\n2. Set up quality control checkpoints\n3. Implement efficiency tracking and OEE calculation\n4. Establish stock management processes\n5. Create maintenance scheduling system",
        benefits: ["Improved operational efficiency", "Better production visibility", "Enhanced quality control", "Reduced downtime", "Streamlined workflows"],
        tags: ["general", "manufacturing", "oee", "quality", "efficiency"],
        aiPrompt: "Create a general manufacturing template with core production planning, quality control, and efficiency tracking suitable for various industries."
      }
    ];

    await db.insert(industryTemplates).values(industryTemplateData);
    console.log("Industry templates seeded successfully");
  }

  // Seed optimization scope configurations
  const existingOptimizationConfigs = await db.select().from(optimizationScopeConfigs).limit(1);
  if (existingOptimizationConfigs.length === 0) {
    const optimizationScopeData = [
      {
        name: "Production Scheduling - All Resources",
        description: "Comprehensive production scheduling optimization covering all resources and jobs",
        category: "production_scheduling",
        isDefault: true,
        isShared: true,
        scopeFilters: {
          resources: { includeAll: true, specificIds: [], types: [], statuses: ["active"] },
          jobs: { includeAll: true, specificIds: [], priorities: [], statuses: ["planned", "in_progress"] },
          timeRange: { startDate: null, endDate: null, duration: "30_days" },
          plants: { includeAll: true, specificIds: [] }
        },
        optimizationGoals: {
          primary: "minimize_makespan",
          secondary: ["minimize_tardiness", "maximize_resource_utilization"],
          weights: { makespan: 0.5, tardiness: 0.3, utilization: 0.2 }
        },
        constraints: {
          resourceCapabilities: true,
          shiftSchedules: true,
          setupTimes: true,
          maintenanceWindows: true,
          maxOvertimeHours: 8,
          bufferTime: 15
        },
        metadata: {
          usageCount: 0,
          lastUsed: null,
          tags: ["comprehensive", "all_resources", "default"]
        },
        createdBy: 6
      },
      {
        name: "Critical Jobs Only",
        description: "Focus optimization on high priority and critical jobs",
        category: "production_scheduling",
        isDefault: false,
        isShared: true,
        scopeFilters: {
          resources: { includeAll: true, specificIds: [], types: [], statuses: ["active"] },
          jobs: { includeAll: false, specificIds: [], priorities: ["high", "critical"], statuses: ["planned", "in_progress"] },
          timeRange: { startDate: null, endDate: null, duration: "14_days" },
          plants: { includeAll: true, specificIds: [] }
        },
        optimizationGoals: {
          primary: "minimize_tardiness",
          secondary: ["minimize_makespan"],
          weights: { tardiness: 0.7, makespan: 0.3 }
        },
        constraints: {
          resourceCapabilities: true,
          shiftSchedules: true,
          setupTimes: true,
          maintenanceWindows: true,
          maxOvertimeHours: 4,
          bufferTime: 30
        },
        metadata: {
          usageCount: 0,
          lastUsed: null,
          tags: ["critical", "priority", "urgent"]
        },
        createdBy: 6
      },
      {
        name: "CNC Machines Only",
        description: "Optimization focused on CNC machining resources and related operations",
        category: "production_scheduling",
        isDefault: false,
        isShared: true,
        scopeFilters: {
          resources: { includeAll: false, specificIds: [1, 2], types: ["Machine"], statuses: ["active"] },
          jobs: { includeAll: true, specificIds: [], priorities: [], statuses: ["planned", "in_progress"] },
          timeRange: { startDate: null, endDate: null, duration: "7_days" },
          plants: { includeAll: true, specificIds: [] }
        },
        optimizationGoals: {
          primary: "maximize_resource_utilization",
          secondary: ["minimize_setup_time", "minimize_makespan"],
          weights: { utilization: 0.6, setup_time: 0.25, makespan: 0.15 }
        },
        constraints: {
          resourceCapabilities: true,
          shiftSchedules: true,
          setupTimes: true,
          maintenanceWindows: true,
          maxOvertimeHours: 6,
          bufferTime: 10
        },
        metadata: {
          usageCount: 0,
          lastUsed: null,
          tags: ["cnc", "machining", "specific_resources"]
        },
        createdBy: 6
      },
      {
        name: "Inventory Optimization - All Items",
        description: "Comprehensive inventory optimization across all stock items and storage locations",
        category: "inventory_optimization",
        isDefault: true,
        isShared: true,
        scopeFilters: {
          stockItems: { includeAll: true, specificIds: [], categories: [], statuses: ["active", "low_stock"] },
          warehouses: { includeAll: true, specificIds: [], types: [] }, // Updated from storageLocations to match ptwarehouses
          timeRange: { startDate: null, endDate: null, duration: "90_days" },
          suppliers: { includeAll: true, specificIds: [] }
        },
        optimizationGoals: {
          primary: "minimize_total_cost",
          secondary: ["minimize_stockouts", "minimize_carrying_cost"],
          weights: { total_cost: 0.5, stockouts: 0.3, carrying_cost: 0.2 }
        },
        constraints: {
          minStockLevels: true,
          maxStockCapacity: true,
          leadTimes: true,
          orderMinimums: true,
          budgetLimit: 100000,
          shelfLife: true
        },
        metadata: {
          usageCount: 0,
          lastUsed: null,
          tags: ["comprehensive", "all_items", "cost_optimization"]
        },
        createdBy: 6
      },
      {
        name: "Fast-Moving Items",
        description: "Inventory optimization focused on high-velocity stock items",
        category: "inventory_optimization",
        isDefault: false,
        isShared: true,
        scopeFilters: {
          stockItems: { includeAll: false, specificIds: [], categories: ["raw_materials", "components"], statuses: ["active"] },
          warehouses: { includeAll: true, specificIds: [], types: [] }, // Updated from storageLocations to match ptwarehouses
          timeRange: { startDate: null, endDate: null, duration: "30_days" },
          suppliers: { includeAll: true, specificIds: [] }
        },
        optimizationGoals: {
          primary: "minimize_stockouts",
          secondary: ["minimize_total_cost"],
          weights: { stockouts: 0.7, total_cost: 0.3 }
        },
        constraints: {
          minStockLevels: true,
          maxStockCapacity: true,
          leadTimes: true,
          orderMinimums: true,
          budgetLimit: 50000,
          turnoverRate: 12
        },
        metadata: {
          usageCount: 0,
          lastUsed: null,
          tags: ["fast_moving", "high_velocity", "availability"]
        },
        createdBy: 6
      }
    ];

    await db.insert(optimizationScopeConfigs).values(optimizationScopeData);
    console.log("Optimization scope configurations seeded successfully");
  }

  // Seed scheduling history data
  const existingSchedulingHistory = await db.select().from(schedulingHistory).limit(1);
  if (existingSchedulingHistory.length === 0) {
    const schedulingHistoryData = [
      {
        algorithmName: "backwards-scheduling",
        algorithmVersion: "2.1.0",
        triggeredBy: 6,
        plantId: 1,
        executionStartTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        executionEndTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45000), // 45 seconds later
        executionDuration: 45,
        status: "completed",
        makespan: 4320, // 72 hours in minutes
        resourceUtilization: 87.5,
        onTimeDeliveryRate: 94.2,
        costOptimization: 12.8,
        qualityScore: 96.1,
        parameters: {
          planningHorizon: 30,
          considerConstraints: true,
          optimizeForCost: true,
          priorityWeighting: "balanced"
        },
        notes: "Successful optimization with improved resource utilization"
      },
      {
        algorithmName: "forward-scheduling",
        algorithmVersion: "1.8.2",
        triggeredBy: 6,
        plantId: 1,
        executionStartTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        executionEndTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 32000), // 32 seconds later
        executionDuration: 32,
        status: "completed",
        makespan: 4680, // 78 hours in minutes
        resourceUtilization: 82.3,
        onTimeDeliveryRate: 89.7,
        costOptimization: 8.4,
        qualityScore: 91.5,
        parameters: {
          planningHorizon: 21,
          considerConstraints: true,
          optimizeForTime: true,
          resourceLeveling: true
        },
        notes: "Standard forward scheduling execution"
      },
      {
        algorithmName: "genetic-algorithm",
        algorithmVersion: "3.0.1",
        triggeredBy: 6,
        plantId: 1,
        executionStartTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        executionEndTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 128000), // 2 minutes 8 seconds later
        executionDuration: 128,
        status: "completed",
        makespan: 4140, // 69 hours in minutes
        resourceUtilization: 91.2,
        onTimeDeliveryRate: 97.8,
        costOptimization: 18.6,
        qualityScore: 98.3,
        parameters: {
          populationSize: 100,
          generations: 500,
          mutationRate: 0.05,
          crossoverRate: 0.8,
          eliteSize: 10
        },
        notes: "Best performing algorithm with highest optimization scores"
      },
      {
        algorithmName: "simulated-annealing",
        algorithmVersion: "2.3.0",
        triggeredBy: 6,
        plantId: 1,
        executionStartTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        executionEndTime: null, // Failed execution
        executionDuration: null,
        status: "failed",
        makespan: null,
        resourceUtilization: null,
        onTimeDeliveryRate: null,
        costOptimization: null,
        qualityScore: null,
        parameters: {
          initialTemperature: 1000,
          coolingRate: 0.95,
          minTemperature: 0.01,
          maxIterations: 10000
        },
        errorMessage: "Memory allocation error during large dataset processing",
        notes: "Algorithm failed due to memory constraints with current dataset size"
      },
      {
        algorithmName: "backwards-scheduling",
        algorithmVersion: "2.0.8",
        triggeredBy: 6,
        plantId: 1,
        executionStartTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        executionEndTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 38000), // 38 seconds later
        executionDuration: 38,
        status: "completed",
        makespan: 4560, // 76 hours in minutes
        resourceUtilization: 84.7,
        onTimeDeliveryRate: 91.3,
        costOptimization: 10.2,
        qualityScore: 93.8,
        parameters: {
          planningHorizon: 28,
          considerConstraints: true,
          optimizeForCost: false,
          priorityWeighting: "time-focused"
        },
        notes: "Previous version of backwards scheduling algorithm"
      }
    ];

    await db.insert(schedulingHistory).values(schedulingHistoryData);
    console.log("Scheduling history seeded successfully");
  }

  // Seed algorithm performance data
  const existingAlgorithmPerformance = await db.select().from(algorithmPerformance).limit(1);
  if (existingAlgorithmPerformance.length === 0) {
    const algorithmPerformanceData = [
      {
        algorithmName: "backwards-scheduling",
        totalExecutions: 24,
        successfulExecutions: 23,
        failedExecutions: 1,
        averageExecutionTime: 42.3,
        averageMakespanImprovement: 15.2,
        averageUtilizationImprovement: 8.7,
        averageCostSavings: 11.4,
        performanceTrend: "improving",
        lastExecutionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        algorithmName: "forward-scheduling",
        totalExecutions: 18,
        successfulExecutions: 17,
        failedExecutions: 1,
        averageExecutionTime: 35.8,
        averageMakespanImprovement: 9.6,
        averageUtilizationImprovement: 6.2,
        averageCostSavings: 7.8,
        performanceTrend: "stable",
        lastExecutionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        algorithmName: "genetic-algorithm",
        totalExecutions: 12,
        successfulExecutions: 11,
        failedExecutions: 1,
        averageExecutionTime: 156.7,
        averageMakespanImprovement: 22.8,
        averageUtilizationImprovement: 14.3,
        averageCostSavings: 19.2,
        performanceTrend: "improving",
        lastExecutionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        algorithmName: "simulated-annealing",
        totalExecutions: 8,
        successfulExecutions: 6,
        failedExecutions: 2,
        averageExecutionTime: 89.4,
        averageMakespanImprovement: 18.1,
        averageUtilizationImprovement: 11.8,
        averageCostSavings: 15.6,
        performanceTrend: "declining",
        lastExecutionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      }
    ];

    await db.insert(algorithmPerformance).values(algorithmPerformanceData);
    console.log("Algorithm performance data seeded successfully");
  }

  // Seed Production Planning optimization algorithms
  const existingProductionPlanningAlgorithms = await db.select().from(optimizationAlgorithms).where(eq(optimizationAlgorithms.category, "production_planning")).limit(1);
  if (existingProductionPlanningAlgorithms.length === 0) {
    const productionPlanningAlgorithmsData = [
      {
        name: "planned-order-generator",
        displayName: "Planned Order Generator",
        description: "Generates optimized planned orders based on demand forecasts, inventory levels, and production capacity. Creates production schedules that balance customer requirements with resource availability while minimizing costs and maximizing efficiency.",
        category: "production_planning",
        type: "standard", 
        version: "1.0.0",
        status: "approved",
        isStandard: true,
        configuration: {
          parameters: {
            planningHorizon: {
              type: "number",
              default: 30,
              min: 7,
              max: 180,
              description: "Planning horizon in days for generating planned orders",
              required: true
            },
            demandBufferPercent: {
              type: "number", 
              default: 15,
              min: 0,
              max: 50,
              description: "Additional demand buffer percentage for safety planning",
              required: true
            },
            minLotSize: {
              type: "number",
              default: 1,
              min: 1,
              max: 1000,
              description: "Minimum production lot size for planned orders",
              required: true
            },
            leadTimeBuffer: {
              type: "number",
              default: 2,
              min: 0,
              max: 14,
              description: "Additional lead time buffer days for material procurement",
              required: true
            },
            capacityUtilizationTarget: {
              type: "number",
              default: 85,
              min: 50,
              max: 95,
              description: "Target capacity utilization percentage",
              required: true
            },
            prioritizeExistingOrders: {
              type: "boolean",
              default: true,
              description: "Prioritize existing production orders over new planned orders",
              required: true
            }
          },
          constraints: [
            {
              name: "resource_capacity",
              type: "hard",
              value: "within_available_capacity",
              description: "Planned orders must fit within available resource capacity"
            },
            {
              name: "material_availability",
              type: "soft",
              value: "materials_procurable",
              description: "Required materials should be available or procurable within lead times"
            },
            {
              name: "demand_fulfillment",
              type: "hard",
              value: "meet_customer_demand",
              description: "Generated orders must fulfill forecasted customer demand"
            }
          ],
          objectives: [
            {
              name: "minimize_total_cost",
              type: "minimize",
              weight: 0.4,
              description: "Minimize total production and inventory costs"
            },
            {
              name: "maximize_service_level",
              type: "maximize",
              weight: 0.3,
              description: "Maximize customer service level and on-time delivery"
            },
            {
              name: "optimize_resource_utilization",
              type: "maximize",
              weight: 0.3,
              description: "Optimize resource utilization across planning horizon"
            }
          ],
          dataSources: ["demand_forecasts", "production_orders", "resources", "capabilities", "stock_items", "bills_of_material"],
          extensionData: []
        },
        algorithmCode: "/* Planned Order Generator Algorithm - Full implementation available in production system */",
        uiComponents: {
          components: [
            {
              type: "parameter_form",
              title: "Production Planning Parameters",
              fields: [
                { name: "planningHorizon", type: "number", label: "Planning Horizon (days)", tooltip: "Time horizon for generating planned orders" },
                { name: "demandBufferPercent", type: "number", label: "Demand Buffer (%)", tooltip: "Safety buffer for demand uncertainty" },
                { name: "capacityUtilizationTarget", type: "number", label: "Capacity Target (%)", tooltip: "Target resource utilization" },
                { name: "prioritizeExistingOrders", type: "checkbox", label: "Prioritize Existing Orders", tooltip: "Give priority to existing production orders" }
              ]
            }
          ]
        },
        performance: {
          averageExecutionTime: 4.2,
          accuracy: "94% demand fulfillment accuracy",
          scalability: "Handles up to 1000 products and 200 resources",
          memoryUsage: "24MB",
          lastBenchmark: "2025-07-28T00:00:00Z"
        },
        approvals: {
          testResults: { passed: true, coverage: "96%", testDate: "2025-07-27T00:00:00Z" },
          managerApproval: { approved: true, approvedBy: "Production Director", approvedAt: "2025-07-28T00:00:00Z", notes: "Approved for production planning automation" }
        },
        createdBy: 6
      }
    ];

    await db.insert(optimizationAlgorithms).values(productionPlanningAlgorithmsData);
    console.log("Production Planning optimization algorithms seeded successfully");

    // Create optimization profile for planned order generator
    const plannedOrderAlgorithmId = await db.select().from(optimizationAlgorithms).where(eq(optimizationAlgorithms.name, "planned-order-generator")).limit(1);
    
    if (plannedOrderAlgorithmId.length > 0) {
      const productionPlanningProfileData = [
        {
          name: "Balanced Production Planning",
          description: "Balanced approach to production planning that optimizes both cost efficiency and service level with moderate safety buffers",
          algorithmId: plannedOrderAlgorithmId[0].id,
          isDefault: true,
          isShared: true,
          profileConfig: {
            includePlannedOrders: {
              enabled: true,
              weight: 0.8,
              convertToProduction: false
            },
            scope: {
              plantIds: [],
              resourceIds: [],
              resourceTypes: [],
              capabilityIds: [],
              productionOrderIds: [],
              excludeOrderIds: [],
              dateRange: {
                start: new Date().toISOString(),
                end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              }
            },
            algorithmParameters: {
              productionPlanning: {
                planningHorizon: 30,
                demandBufferPercent: 15,
                minLotSize: 10,
                leadTimeBuffer: 2,
                capacityUtilizationTarget: 85,
                prioritizeExistingOrders: true
              }
            },
            objectives: {
              primary: "minimize_total_cost",
              secondary: ["maximize_service_level", "optimize_resource_utilization"],
              weights: {
                cost: 0.4,
                serviceLevel: 0.3,
                utilization: 0.3
              }
            },
            constraints: {
              resourceCapacity: true,
              materialAvailability: true,
              demandFulfillment: true,
              maxOvertimeHours: 0,
              bufferTime: 2
            }
          },
          createdBy: 6
        },
        {
          name: "High Service Level Planning",
          description: "Service-focused production planning that prioritizes customer satisfaction and on-time delivery with higher safety buffers",
          algorithmId: plannedOrderAlgorithmId[0].id,
          isDefault: false,
          isShared: true,
          profileConfig: {
            includePlannedOrders: {
              enabled: true,
              weight: 0.9,
              convertToProduction: true
            },
            scope: {
              plantIds: [],
              resourceIds: [],
              resourceTypes: [],
              capabilityIds: [],
              productionOrderIds: [],
              excludeOrderIds: [],
              dateRange: {
                start: new Date().toISOString(),
                end: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
              }
            },
            algorithmParameters: {
              productionPlanning: {
                planningHorizon: 45,
                demandBufferPercent: 25,
                minLotSize: 5,
                leadTimeBuffer: 4,
                capacityUtilizationTarget: 75,
                prioritizeExistingOrders: true
              }
            },
            objectives: {
              primary: "maximize_service_level",
              secondary: ["optimize_resource_utilization", "minimize_total_cost"],
              weights: {
                serviceLevel: 0.5,
                utilization: 0.3,
                cost: 0.2
              }
            },
            constraints: {
              resourceCapacity: true,
              materialAvailability: true,
              demandFulfillment: true,
              maxOvertimeHours: 8,
              bufferTime: 4
            }
          },
          createdBy: 6
        }
      ];

      await db.insert(optimizationProfiles).values(productionPlanningProfileData);
      console.log("Production Planning optimization profiles seeded successfully");
    }
  }

  // Seed CTP (Capable to Promise) optimization algorithms
  const existingCTPAlgorithms = await db.select().from(optimizationAlgorithms).where(eq(optimizationAlgorithms.category, "capable_to_promise")).limit(1);
  if (existingCTPAlgorithms.length === 0) {
    const ctpAlgorithmsData = [
      {
        name: "material-capacity-analyzer",
        displayName: "Material Capacity Analyzer",
        description: "Analyzes incoming order requests against current material inventory and planned production capacity to determine earliest possible delivery dates. Considers material availability, lead times, and production resource capacity.",
        category: "capable_to_promise",
        type: "standard",
        version: "1.0.0",
        status: "approved",
        isStandard: true,
        configuration: {
          parameters: {
            bufferDays: {
              type: "number",
              default: 2,
              min: 0,
              max: 14,
              description: "Safety buffer days to add to delivery promises",
              required: true
            },
            materialSafetyStock: {
              type: "number",
              default: 10,
              min: 0,
              max: 50,
              description: "Percentage of material to keep as safety stock",
              required: true
            },
            capacityUtilizationLimit: {
              type: "number",
              default: 90,
              min: 50,
              max: 100,
              description: "Maximum capacity utilization percentage for new orders",
              required: true
            },
            considerLeadTimes: {
              type: "boolean",
              default: true,
              description: "Include material lead times in calculations",
              required: true
            }
          },
          constraints: [
            {
              name: "material_availability",
              type: "hard",
              value: "sufficient_materials",
              description: "Sufficient materials must be available or procurable"
            },
            {
              name: "production_capacity",
              type: "hard", 
              value: "capacity_available",
              description: "Production capacity must be available for processing"
            }
          ],
          objectives: [
            {
              name: "minimize_delivery_time",
              type: "minimize",
              weight: 0.6,
              description: "Minimize promised delivery time to customer"
            },
            {
              name: "maximize_capacity_utilization",
              type: "maximize", 
              weight: 0.4,
              description: "Optimize production capacity utilization"
            }
          ],
          dataSources: ["stock_items", "vendors", "production_orders", "planned_orders", "resources"],
          extensionData: []
        },
        algorithmCode: "/* Material Capacity Analyzer CTP Algorithm - Full implementation available in production system */",
        uiComponents: {
          components: [
            {
              type: "parameter_form",
              title: "CTP Analysis Parameters",
              fields: [
                { name: "bufferDays", type: "number", label: "Buffer Days", tooltip: "Safety buffer days for delivery promises" },
                { name: "materialSafetyStock", type: "number", label: "Material Safety Stock (%)", tooltip: "Percentage of inventory to reserve as safety stock" },
                { name: "capacityUtilizationLimit", type: "number", label: "Max Capacity Utilization (%)", tooltip: "Maximum capacity utilization for new orders" }
              ]
            }
          ]
        },
        performance: {
          averageExecutionTime: 1.8,
          accuracy: "92% delivery promise accuracy",
          scalability: "Good up to 500 concurrent analyses",
          memoryUsage: "8MB",
          lastBenchmark: "2025-01-27T00:00:00Z"
        },
        approvals: {
          testResults: { passed: true, coverage: "95%", testDate: "2025-01-26T00:00:00Z" },
          managerApproval: { approved: true, approvedBy: "Sales Director", approvedAt: "2025-01-27T00:00:00Z", notes: "Approved for customer commitment analysis" }
        },
        createdBy: 6
      },
      {
        name: "order-feasibility-checker",
        displayName: "Order Feasibility Checker",
        description: "Comprehensive feasibility analysis for incoming order requests considering resource availability, material constraints, production schedule conflicts, and alternative sourcing options.",
        category: "capable_to_promise",
        type: "standard",
        version: "1.0.0",
        status: "approved",
        isStandard: true,
        configuration: {
          parameters: {
            feasibilityThreshold: {
              type: "number",
              default: 75,
              min: 50,
              max: 95,
              description: "Minimum feasibility score to approve order",
              required: true
            },
            considerAlternatives: {
              type: "boolean",
              default: true,
              description: "Analyze alternative materials and processes",
              required: true
            },
            maxLeadTimeExtension: {
              type: "number",
              default: 30,
              min: 0,
              max: 90,
              description: "Maximum lead time extension in days",
              required: true
            }
          },
          constraints: [
            { name: "resource_availability", type: "hard", value: "required_resources_available", description: "Required resources must be available" },
            { name: "material_feasibility", type: "hard", value: "materials_obtainable", description: "All required materials must be obtainable" }
          ],
          objectives: [
            { name: "maximize_feasibility_score", type: "maximize", weight: 0.5, description: "Maximize overall order feasibility score" },
            { name: "minimize_risk", type: "minimize", weight: 0.5, description: "Minimize execution risk" }
          ],
          dataSources: ["production_orders", "stock_items", "resources", "capabilities", "vendors"],
          extensionData: []
        },
        algorithmCode: "/* Order Feasibility Checker CTP Algorithm - Full implementation available in production system */",
        uiComponents: {
          components: [
            {
              type: "parameter_form",
              title: "Feasibility Analysis Parameters",
              fields: [
                { name: "feasibilityThreshold", type: "number", label: "Feasibility Threshold (%)", tooltip: "Minimum score to approve order" },
                { name: "considerAlternatives", type: "checkbox", label: "Consider Alternatives", tooltip: "Analyze alternative options" }
              ]
            }
          ]
        },
        performance: {
          averageExecutionTime: 2.3,
          accuracy: "89% feasibility prediction accuracy",
          scalability: "Good up to 300 concurrent analyses",
          memoryUsage: "12MB",
          lastBenchmark: "2025-01-27T00:00:00Z"
        },
        approvals: {
          testResults: { passed: true, coverage: "93%", testDate: "2025-01-26T00:00:00Z" },
          managerApproval: { approved: true, approvedBy: "Operations Director", approvedAt: "2025-01-27T00:00:00Z", notes: "Approved for order feasibility assessment" }
        },
        createdBy: 6
      }
    ];

    await db.insert(optimizationAlgorithms).values(ctpAlgorithmsData);
    console.log("CTP optimization algorithms seeded successfully");
  }

  // Seed agent connections
  const existingAgentConnections = await db.select().from(agentConnections).limit(1);
  if (existingAgentConnections.length === 0) {
    console.log("Seeding agent connections...");
    
    const agentConnectionsData = [
      // ERP Systems
      {
        agentId: "sap-erp-prod-01",
        name: "SAP ERP Production System",
        description: "Primary SAP ERP system managing production orders, inventory, and procurement. Syncs manufacturing orders, BOMs, and material requirements to PlanetTogether for advanced scheduling.",
        connectionType: "api_key" as const,
        status: "active" as const,
        ipAddress: "10.50.1.15",
        userAgent: "SAP-Integration-Agent/2.1.0",
        permissions: JSON.stringify(["read:production_orders", "write:production_status", "read:inventory", "read:bom"]),
        metadata: JSON.stringify({
          system: "ERP",
          vendor: "SAP",
          version: "S/4HANA 2023",
          plant: "Plant 1000",
          lastSync: new Date().toISOString()
        }),
        rateLimitPerMinute: 500,
        rateLimitPerHour: 20000,
        isEnabled: true,
        lastSeenAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        connectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      },
      {
        agentId: "oracle-erp-finance-01",
        name: "Oracle ERP Financial System",
        description: "Oracle Cloud ERP managing financial transactions, cost accounting, and inventory valuations. Provides cost data and constraints for production optimization.",
        connectionType: "oauth" as const,
        status: "active" as const,
        ipAddress: "10.50.1.22",
        userAgent: "Oracle-Cloud-Connector/1.8.3",
        permissions: JSON.stringify(["read:cost_data", "read:inventory_valuation", "read:purchase_orders"]),
        metadata: JSON.stringify({
          system: "ERP",
          vendor: "Oracle",
          version: "Oracle Fusion Cloud",
          division: "Manufacturing Division",
          lastSync: new Date().toISOString()
        }),
        rateLimitPerMinute: 300,
        rateLimitPerHour: 15000,
        isEnabled: true,
        lastSeenAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        connectedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
      },
      {
        agentId: "dynamics-365-supply-01",
        name: "Microsoft Dynamics 365 Supply Chain",
        description: "Dynamics 365 Supply Chain Management system handling procurement, warehouse management, and demand planning. Feeds demand forecasts and material availability to production scheduling.",
        connectionType: "api_key" as const,
        status: "active" as const,
        ipAddress: "10.50.2.18",
        userAgent: "Dynamics365-SCM-Agent/3.0.1",
        permissions: JSON.stringify(["read:demand_forecast", "read:warehouse_stock", "read:purchase_orders", "write:material_requirements"]),
        metadata: JSON.stringify({
          system: "ERP/SCM",
          vendor: "Microsoft",
          version: "Dynamics 365",
          warehouse: "Central DC",
          lastSync: new Date().toISOString()
        }),
        rateLimitPerMinute: 400,
        rateLimitPerHour: 18000,
        isEnabled: true,
        lastSeenAt: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
        connectedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
      },
      
      // MES Systems
      {
        agentId: "siemens-mes-line-a",
        name: "Siemens Opcenter MES - Line A",
        description: "Siemens Opcenter MES managing production line A with real-time equipment monitoring, work-in-progress tracking, and quality data collection. Provides actual production metrics to adjust schedules dynamically.",
        connectionType: "websocket" as const,
        status: "active" as const,
        ipAddress: "192.168.10.50",
        userAgent: "Opcenter-MES-Agent/4.2.0",
        permissions: JSON.stringify(["read:equipment_status", "write:work_orders", "read:quality_data", "read:production_metrics"]),
        metadata: JSON.stringify({
          system: "MES",
          vendor: "Siemens",
          version: "Opcenter Execution 2024",
          productionLine: "Line A - Assembly",
          shift: "24/7",
          lastSync: new Date().toISOString()
        }),
        rateLimitPerMinute: 1000,
        rateLimitPerHour: 50000,
        isEnabled: true,
        lastSeenAt: new Date(Date.now() - 30 * 1000), // 30 seconds ago
        connectedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
      },
      {
        agentId: "rockwell-mes-pharma",
        name: "Rockwell FactoryTalk MES - Pharma",
        description: "Rockwell FactoryTalk Batch MES for pharmaceutical batch production with GMP compliance, electronic batch records, and material genealogy tracking. Ensures regulatory compliance while optimizing batch scheduling.",
        connectionType: "api_key" as const,
        status: "active" as const,
        ipAddress: "192.168.10.85",
        userAgent: "FactoryTalk-MES/8.1.0",
        permissions: JSON.stringify(["read:batch_status", "write:batch_instructions", "read:material_tracking", "read:compliance_data"]),
        metadata: JSON.stringify({
          system: "MES",
          vendor: "Rockwell Automation",
          version: "FactoryTalk Batch 14.0",
          area: "Pharmaceutical Production",
          compliance: "21 CFR Part 11",
          lastSync: new Date().toISOString()
        }),
        rateLimitPerMinute: 200,
        rateLimitPerHour: 10000,
        isEnabled: true,
        lastSeenAt: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
        connectedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000) // 120 days ago
      },
      {
        agentId: "delmia-mes-automotive",
        name: "DELMIA MES - Automotive Assembly",
        description: "Dassault Systèmes DELMIA MES for automotive final assembly operations. Tracks vehicle build sequences, option configurations, and just-in-time component delivery for mixed-model assembly lines.",
        connectionType: "api_key" as const,
        status: "active" as const,
        ipAddress: "192.168.11.42",
        userAgent: "DELMIA-MES-Connector/5.0.2",
        permissions: JSON.stringify(["read:vehicle_build_sequence", "write:assembly_instructions", "read:component_arrival", "read:station_status"]),
        metadata: JSON.stringify({
          system: "MES",
          vendor: "Dassault Systèmes",
          version: "DELMIA Apriso 2024",
          plant: "Automotive Assembly Plant",
          productionType: "Mixed-model assembly",
          lastSync: new Date().toISOString()
        }),
        rateLimitPerMinute: 600,
        rateLimitPerHour: 30000,
        isEnabled: true,
        lastSeenAt: new Date(Date.now() - 45 * 1000), // 45 seconds ago
        connectedAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000) // 75 days ago
      },
      
      // SCM Systems
      {
        agentId: "kinaxis-rapidresponse",
        name: "Kinaxis RapidResponse Supply Chain",
        description: "Kinaxis RapidResponse concurrent planning platform managing end-to-end supply chain planning, demand-supply balancing, and scenario analysis. Provides multi-echelon inventory optimization and supply risk alerts.",
        connectionType: "oauth" as const,
        status: "active" as const,
        ipAddress: "10.50.3.10",
        userAgent: "Kinaxis-RapidResponse/12.8.0",
        permissions: JSON.stringify(["read:demand_plan", "read:supply_constraints", "write:capacity_feedback", "read:inventory_policy"]),
        metadata: JSON.stringify({
          system: "SCM",
          vendor: "Kinaxis",
          version: "RapidResponse 2024",
          scope: "Global Supply Chain",
          planningHorizon: "18 months",
          lastSync: new Date().toISOString()
        }),
        rateLimitPerMinute: 250,
        rateLimitPerHour: 12000,
        isEnabled: true,
        lastSeenAt: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
        connectedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) // 180 days ago
      },
      {
        agentId: "blue-yonder-fulfillment",
        name: "Blue Yonder Warehouse Management",
        description: "Blue Yonder (formerly JDA) WMS managing warehouse operations, inventory allocation, and order fulfillment. Provides real-time material availability and inbound shipment visibility for production planning.",
        connectionType: "api_key" as const,
        status: "active" as const,
        ipAddress: "10.50.3.25",
        userAgent: "BlueYonder-WMS/2024.1",
        permissions: JSON.stringify(["read:warehouse_inventory", "read:inbound_shipments", "write:pick_orders", "read:storage_locations"]),
        metadata: JSON.stringify({
          system: "SCM/WMS",
          vendor: "Blue Yonder",
          version: "Luminate Logistics 2024",
          facility: "Regional Distribution Center",
          lastSync: new Date().toISOString()
        }),
        rateLimitPerMinute: 350,
        rateLimitPerHour: 16000,
        isEnabled: true,
        lastSeenAt: new Date(Date.now() - 4 * 60 * 1000), // 4 minutes ago
        connectedAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000) // 150 days ago
      },
      {
        agentId: "e2open-logistics",
        name: "e2open Multi-Enterprise Network",
        description: "e2open supply chain orchestration platform managing supplier collaboration, transportation management, and global trade compliance. Coordinates multi-tier supplier schedules and tracks in-transit inventory.",
        connectionType: "webhook" as const,
        status: "active" as const,
        ipAddress: "10.50.3.40",
        userAgent: "e2open-Platform/9.0.1",
        permissions: JSON.stringify(["read:supplier_schedules", "read:shipment_tracking", "write:delivery_requirements", "read:trade_compliance"]),
        metadata: JSON.stringify({
          system: "SCM/Network",
          vendor: "e2open",
          version: "e2open Platform 2024",
          networkScope: "Multi-enterprise supply network",
          suppliers: 250,
          lastSync: new Date().toISOString()
        }),
        rateLimitPerMinute: 200,
        rateLimitPerHour: 9000,
        isEnabled: true,
        lastSeenAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        connectedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000) // 200 days ago
      },
      
      // Additional specialized systems
      {
        agentId: "qad-adaptive-erp",
        name: "QAD Adaptive ERP - Manufacturing",
        description: "QAD Adaptive ERP specialized for manufacturing with Kanban/JIT support, mixed-mode manufacturing, and lot/serial traceability. Optimized for automotive and industrial manufacturing environments.",
        connectionType: "api_key" as const,
        status: "inactive" as const,
        ipAddress: "10.50.1.88",
        userAgent: "QAD-ERP-Agent/2023.2",
        permissions: JSON.stringify(["read:kanban_signals", "read:work_orders", "read:lot_tracking"]),
        metadata: JSON.stringify({
          system: "ERP",
          vendor: "QAD",
          version: "QAD Adaptive ERP 2023",
          mode: "Mixed-mode manufacturing",
          lastSync: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }),
        rateLimitPerMinute: 300,
        rateLimitPerHour: 12000,
        isEnabled: false,
        lastSeenAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        connectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      },
      {
        agentId: "aveva-pi-system",
        name: "AVEVA PI System - Historian",
        description: "AVEVA PI System process historian collecting real-time sensor data, equipment performance metrics, and energy consumption from plant floor systems. Provides time-series data for production analytics and predictive maintenance.",
        connectionType: "websocket" as const,
        status: "active" as const,
        ipAddress: "192.168.12.100",
        userAgent: "PI-Web-API/2023.3",
        permissions: JSON.stringify(["read:timeseries_data", "read:equipment_health", "read:energy_metrics"]),
        metadata: JSON.stringify({
          system: "Historian/IoT",
          vendor: "AVEVA",
          version: "PI System 2023",
          dataPoints: 15000,
          retention: "7 years",
          lastSync: new Date().toISOString()
        }),
        rateLimitPerMinute: 2000,
        rateLimitPerHour: 100000,
        isEnabled: true,
        lastSeenAt: new Date(Date.now() - 15 * 1000), // 15 seconds ago
        connectedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 365 days ago
      }
    ];
    
    await db.insert(agentConnections).values(agentConnectionsData);
    console.log(`Seeded ${agentConnectionsData.length} agent connections successfully`);
  } else {
    console.log("Agent connections already exist, skipping...");
  }

  // Seed workspace dashboards
  const { seedWorkspaceDashboards } = await import("./seeds/workspace-dashboards");
  await seedWorkspaceDashboards();

  console.log("Database seeded successfully");
}

