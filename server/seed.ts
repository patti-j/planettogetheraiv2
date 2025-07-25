import { db } from "./db";
import { 
  capabilities, resources, jobs, operations, users, roles, permissions, userRoles, rolePermissions,
  customerStories, contentBlocks, marketingPages, leadCaptures, disruptions, disruptionActions,
  businessGoals, goalProgress, goalRisks, goalIssues
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
  
  // Force re-seed if presentation permissions, disruptions, or business goals are missing
  const shouldReseedPermissions = existingPresentationPermissions.length === 0;
  const shouldReseedDisruptions = existingDisruptions.length === 0;
  const shouldReseedBusinessGoals = existingBusinessGoals.length === 0;
  
  if (existingCapabilities.length > 0 && existingUsers.length > 0 && existingDefaultRoles.length > 0 && !shouldReseedPermissions && !shouldReseedDisruptions && !shouldReseedBusinessGoals) {
    console.log("Database already seeded, skipping...");
    return;
  }
  
  // Skip production data seeding if it already exists but seed user management
  const shouldSeedProduction = existingCapabilities.length === 0 || shouldReseedDisruptions || shouldReseedBusinessGoals;

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
          name: "Widget Assembly - Batch A", 
          plantId: 1,
          customer: "Tech Corp", 
          priority: "high", 
          dueDate: new Date("2024-12-31"), 
          status: "active",
          quantity: 100
        },
        { 
          name: "Motor Housing Production", 
          plantId: 1,
          customer: "AutoParts Inc", 
          priority: "medium", 
          dueDate: new Date("2024-12-25"), 
          status: "active",
          quantity: 250
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
    }

    // Insert sample disruptions only if they don't exist
    if (shouldReseedDisruptions) {
      const disruptionData = [
      {
        title: "CNC-001 Machine Breakdown",
        type: "machine_breakdown",
        severity: "high",
        status: "active",
        description: "Primary CNC machine experiencing hydraulic system failure. Unable to continue machining operations.",
        affectedResourceId: 1,
        affectedJobId: 1,
        affectedOperationId: 1,
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
        affectedResourceId: 2,
        affectedJobId: 2,
        affectedOperationId: 4,
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
        affectedResourceId: 3,
        affectedJobId: 1,
        affectedOperationId: 2,
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
        affectedResourceId: 1,
        affectedJobId: 1,
        affectedOperationId: 1,
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
        description: "Reduce inventory carrying costs by 15% while maintaining 99.5% stockout prevention through advanced forecasting.",
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
        mitigationPlan: "Diversify supplier base and increase strategic inventory buffers for critical materials.",
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
        description: "Current demand forecasting model showing decreased accuracy, affecting inventory optimization efforts.",
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
    // Director permissions (Business Goals + Reports)
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "business-goals" && p.action === "view")!.id },
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "business-goals" && p.action === "create")!.id },
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "business-goals" && p.action === "edit")!.id },
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "business-goals" && p.action === "delete")!.id },
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "view")!.id },
    { roleId: insertedRoles[0].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "create")!.id },
    
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
    { roleId: insertedRoles[4].id, permissionId: insertedPermissions.find(p => p.feature === "reports" && p.action === "view")!.id }
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
    { userId: insertedUsers[5].id, roleId: insertedRoles[4].id }, // Trainer (using Systems Manager role for now)
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
        .filter(p => ['business-goals', 'reports', 'schedule', 'analytics'].includes(p.feature))
        .map(p => p.id)
    },
    {
      name: "Plant Manager", 
      description: "Plant operations management with capacity planning and systems oversight",
      permissions: allPermissions
        .filter(p => ['plant-manager', 'capacity-planning', 'schedule', 'boards', 'reports', 'analytics'].includes(p.feature))
        .map(p => p.id)
    },
    {
      name: "Production Scheduler",
      description: "Production scheduling and optimization with order management",
      permissions: allPermissions
        .filter(p => ['schedule', 'scheduling-optimizer', 'boards', 'erp-import', 'analytics'].includes(p.feature))
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

    await db.insert(customerStories).values(customerStoryData);

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

    await db.insert(contentBlocks).values(contentBlockData);

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

    await db.insert(marketingPages).values(marketingPageData);

    console.log("✓ Marketing data seeded successfully");
    console.log("  - 3 customer success stories created");
    console.log("  - 5 content blocks for dynamic marketing content");
    console.log("  - 1 marketing page configuration");
    
  } catch (error) {
    console.error("Error seeding marketing data:", error);
  }
}