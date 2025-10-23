import { db } from "./server/db";
import { 
  plantKpiTargets, 
  plantKpiPerformance, 
  autonomousOptimization,
  ptPlants 
} from "@shared/schema";
import { sql } from "drizzle-orm";

async function seedKpiData() {
  console.log("🌱 Starting KPI data seed...");

  try {
    // First, get existing plants
    const plants = await db.select().from(ptPlants);
    
    if (plants.length === 0) {
      console.log("⚠️  No plants found. Creating sample plants first...");
      
      // Create sample plants
      const samplePlants = [
        { 
          name: "Main Manufacturing Facility", 
          location: "Chicago, IL",
          timezone: "America/Chicago",
          currency: "USD",
          isActive: true
        },
        { 
          name: "West Coast Production", 
          location: "Los Angeles, CA",
          timezone: "America/Los_Angeles", 
          currency: "USD",
          isActive: true
        },
        { 
          name: "Southeast Assembly Plant", 
          location: "Atlanta, GA",
          timezone: "America/New_York",
          currency: "USD",
          isActive: true
        }
      ];
      
      const insertedPlants = await db.insert(ptPlants)
        .values(samplePlants)
        .returning();
      
      console.log(`✅ Created ${insertedPlants.length} sample plants`);
    }
    
    // Get all plants (including any we just created)
    const allPlants = await db.select().from(ptPlants);
    
    // Clear existing KPI data to avoid duplicates
    await db.delete(plantKpiPerformance);
    await db.delete(autonomousOptimization);
    await db.delete(plantKpiTargets);
    console.log("🧹 Cleared existing KPI data");
    
    // Create KPI targets for each plant
    const kpiTargets = [];
    
    for (const plant of allPlants) {
      kpiTargets.push(
        {
          plantId: plant.id,
          kpiName: "Overall Equipment Effectiveness (OEE)",
          kpiType: "oee",
          targetValue: "85",
          unitOfMeasure: "%",
          weight: "25",
          isActive: true,
          description: "Measures the overall effectiveness of equipment considering availability, performance, and quality",
          excellentThreshold: "0.95",
          goodThreshold: "0.85",
          warningThreshold: "0.75"
        },
        {
          plantId: plant.id,
          kpiName: "On-Time Delivery Rate",
          kpiType: "delivery",
          targetValue: "95",
          unitOfMeasure: "%",
          weight: "20",
          isActive: true,
          description: "Percentage of orders delivered on or before the promised date",
          excellentThreshold: "0.98",
          goodThreshold: "0.95",
          warningThreshold: "0.90"
        },
        {
          plantId: plant.id,
          kpiName: "Production Throughput",
          kpiType: "throughput",
          targetValue: "1000",
          unitOfMeasure: "units/day",
          weight: "15",
          isActive: true,
          description: "Daily production output in units",
          excellentThreshold: "1.10",
          goodThreshold: "0.95",
          warningThreshold: "0.85"
        },
        {
          plantId: plant.id,
          kpiName: "Quality Pass Rate",
          kpiType: "quality",
          targetValue: "98",
          unitOfMeasure: "%",
          weight: "20",
          isActive: true,
          description: "Percentage of products passing quality inspection on first attempt",
          excellentThreshold: "0.99",
          goodThreshold: "0.97",
          warningThreshold: "0.95"
        },
        {
          plantId: plant.id,
          kpiName: "Cost Per Unit",
          kpiType: "cost",
          targetValue: "50",
          unitOfMeasure: "$",
          weight: "10",
          isActive: true,
          description: "Average cost to produce one unit of product",
          excellentThreshold: "0.90",  // Lower is better for cost
          goodThreshold: "1.00",
          warningThreshold: "1.10"
        },
        {
          plantId: plant.id,
          kpiName: "Safety Incident Rate",
          kpiType: "safety",
          targetValue: "0.5",
          unitOfMeasure: "incidents/month",
          weight: "10",
          isActive: true,
          description: "Number of safety incidents per month",
          excellentThreshold: "0.50",  // Lower is better
          goodThreshold: "1.00",
          warningThreshold: "2.00"
        }
      );
    }
    
    const insertedKpiTargets = await db.insert(plantKpiTargets)
      .values(kpiTargets)
      .returning();
    
    console.log(`✅ Created ${insertedKpiTargets.length} KPI targets`);
    
    // Create historical performance data for each KPI target
    const performanceData = [];
    const today = new Date();
    
    for (const kpiTarget of insertedKpiTargets) {
      // Create 30 days of historical data
      for (let i = 29; i >= 0; i--) {
        const measurementDate = new Date(today);
        measurementDate.setDate(today.getDate() - i);
        
        // Generate realistic performance data with some variation
        const basePerformance = 0.85 + (Math.random() * 0.25); // Between 0.85 and 1.10
        const actualValue = parseFloat(kpiTarget.targetValue) * basePerformance;
        const performanceRatio = actualValue / parseFloat(kpiTarget.targetValue);
        
        let performanceGrade = "Critical";
        if (performanceRatio >= parseFloat(kpiTarget.excellentThreshold)) {
          performanceGrade = "Excellent";
        } else if (performanceRatio >= parseFloat(kpiTarget.goodThreshold)) {
          performanceGrade = "Good";
        } else if (performanceRatio >= parseFloat(kpiTarget.warningThreshold)) {
          performanceGrade = "Warning";
        }
        
        // Add some trend to the data (generally improving over time)
        const trendFactor = 1 + (i * 0.002);
        const trendedValue = actualValue * trendFactor;
        
        performanceData.push({
          plantKpiTargetId: kpiTarget.id,
          measurementDate: measurementDate,
          actualValue: trendedValue.toFixed(2),
          targetValue: kpiTarget.targetValue,
          performanceRatio: (trendedValue / parseFloat(kpiTarget.targetValue)).toFixed(3),
          performanceGrade: performanceGrade,
          trendDirection: i > 0 ? (Math.random() > 0.6 ? "up" : Math.random() > 0.3 ? "stable" : "down") : "stable",
          percentageChange: i > 0 ? ((Math.random() * 10) - 5).toFixed(2) : "0",
          notes: i === 0 ? "Latest measurement" : null,
          dataSource: Math.random() > 0.2 ? "system" : "manual"
        });
      }
    }
    
    // Insert in batches to avoid too large queries
    const batchSize = 100;
    for (let i = 0; i < performanceData.length; i += batchSize) {
      const batch = performanceData.slice(i, i + batchSize);
      await db.insert(plantKpiPerformance).values(batch);
    }
    
    console.log(`✅ Created ${performanceData.length} KPI performance records`);
    
    // Create autonomous optimization configurations
    const optimizationConfigs = [];
    
    for (const plant of allPlants) {
      // Get the KPI targets for this plant
      const plantKpis = insertedKpiTargets.filter(kpi => kpi.plantId === plant.id);
      const targetKpiIds = plantKpis.map(kpi => kpi.id);
      
      optimizationConfigs.push({
        name: `${plant.name} - Production Optimization`,
        description: `Autonomous optimization configuration for ${plant.name} focusing on maximizing overall production efficiency`,
        plantId: plant.id,
        isEnabled: Math.random() > 0.3,  // 70% chance of being enabled
        optimizationObjective: "maximize_weighted_kpis",
        targetKpiIds: targetKpiIds.slice(0, 3), // Focus on first 3 KPIs
        allowedAlgorithms: ["ASAP", "ALAP", "CRITICAL_PATH", "LEVEL_RESOURCES"],
        currentAlgorithm: "ASAP",
        autoAlgorithmSelection: true,
        enableParameterTuning: true,
        learningMode: "adaptive",
        performanceThreshold: "0.85",
        evaluationPeriodMinutes: 60,
        lastOptimizationAt: new Date(today.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000)), // Within last week
        totalOptimizations: Math.floor(Math.random() * 100) + 50,
        successfulOptimizations: Math.floor(Math.random() * 80) + 40,
        lastPerformanceScore: (0.75 + Math.random() * 0.20).toFixed(2),
        learningHistory: JSON.stringify({
          history: [
            { date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), score: 0.82 },
            { date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), score: 0.85 },
            { date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), score: 0.88 },
            { date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), score: 0.91 }
          ]
        }),
        parameterHistory: JSON.stringify({
          parameters: [
            { algorithm: "ASAP", bufferTime: 30, priority: "throughput" },
            { algorithm: "CRITICAL_PATH", bufferTime: 45, priority: "oee" }
          ]
        })
      });
      
      // Add a second optimization config for some plants
      if (Math.random() > 0.5) {
        optimizationConfigs.push({
          name: `${plant.name} - Quality Focus`,
          description: `Quality-focused optimization for ${plant.name} prioritizing defect reduction`,
          plantId: plant.id,
          isEnabled: false,
          optimizationObjective: "minimize_defects",
          targetKpiIds: plantKpis.filter(kpi => kpi.kpiType === "quality").map(kpi => kpi.id),
          allowedAlgorithms: ["CRITICAL_PATH", "DRUM_TOC"],
          currentAlgorithm: "CRITICAL_PATH",
          autoAlgorithmSelection: false,
          enableParameterTuning: true,
          learningMode: "conservative",
          performanceThreshold: "0.90",
          evaluationPeriodMinutes: 120,
          totalOptimizations: Math.floor(Math.random() * 50),
          successfulOptimizations: Math.floor(Math.random() * 40),
          lastPerformanceScore: (0.70 + Math.random() * 0.25).toFixed(2)
        });
      }
    }
    
    const insertedOptimizations = await db.insert(autonomousOptimization)
      .values(optimizationConfigs)
      .returning();
    
    console.log(`✅ Created ${insertedOptimizations.length} autonomous optimization configurations`);
    
    console.log("\n🎉 KPI data seeding completed successfully!");
    console.log(`
Summary:
- Plants: ${allPlants.length}
- KPI Targets: ${insertedKpiTargets.length}
- Performance Records: ${performanceData.length}
- Optimization Configs: ${insertedOptimizations.length}
    `);
    
  } catch (error) {
    console.error("❌ Error seeding KPI data:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the seed function
seedKpiData().catch(console.error);