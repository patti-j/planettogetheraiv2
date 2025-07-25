import { db } from "./db";
import { 
  capabilities, resources, jobs, operations, users, roles, permissions, userRoles, rolePermissions,
  customerStories, contentBlocks, marketingPages, leadCaptures, disruptions, disruptionActions,
  businessGoals, goalProgress, goalRisks, goalIssues, dashboardConfigs, reportConfigs,
  visualFactoryDisplays
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
  
  // Force re-seed if presentation permissions, disruptions, business goals, dashboards, reports, or visual factory displays are missing
  const shouldReseedPermissions = existingPresentationPermissions.length === 0;
  const shouldReseedDisruptions = existingDisruptions.length === 0;
  const shouldReseedBusinessGoals = existingBusinessGoals.length === 0;
  const shouldReseedDashboards = existingDashboards.length === 0;
  const shouldReseedReports = existingReports.length === 0;
  const shouldReseedVisualFactory = existingVisualFactoryDisplays.length === 0;
  
  if (existingCapabilities.length > 0 && existingUsers.length > 0 && existingDefaultRoles.length > 0 && !shouldReseedPermissions && !shouldReseedDisruptions && !shouldReseedBusinessGoals && !shouldReseedDashboards && !shouldReseedReports && !shouldReseedVisualFactory) {
    console.log("Database already seeded, skipping...");
    return;
  }
  
  // Skip production data seeding if it already exists but seed user management
  const shouldSeedProduction = existingCapabilities.length === 0 || shouldReseedDisruptions || shouldReseedBusinessGoals || shouldReseedDashboards || shouldReseedReports || shouldReseedVisualFactory;

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
          fields: ["jobId", "jobName", "status", "priority", "customer", "dueDate", "progress"],
          filters: { status: "all" },
          sorting: { field: "dueDate", direction: "asc" as const },
          chartType: "summary" as const,
          widgets: [
            {
              id: "jobs-overview",
              title: "Jobs Overview",
              type: "metric",
              data: { value: 2, label: "Active Jobs", icon: "Briefcase", trend: "+1 from yesterday" },
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
              id: "jobs-table",
              title: "Active Jobs Details",
              type: "table",
              data: {
                columns: ["Job Name", "Customer", "Priority", "Due Date", "Status"],
                rows: [
                  ["Widget Assembly - Batch A", "Acme Corp", "High", "2025-01-30", "Active"],
                  ["Component Manufacturing", "TechCorp", "Medium", "2025-02-05", "Active"]
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