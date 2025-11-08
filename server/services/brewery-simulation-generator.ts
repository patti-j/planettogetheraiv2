import { db } from '../db';
import { sql } from 'drizzle-orm';

// Brewery-specific product types for Heineken
const BEER_PRODUCTS = [
  { name: 'Heineken Original', sku: 'HKN-001', batchSize: 10000, unit: 'liters', brewTime: 14 },
  { name: 'Heineken 0.0', sku: 'HKN-002', batchSize: 8000, unit: 'liters', brewTime: 12 },
  { name: 'Heineken Silver', sku: 'HKN-003', batchSize: 12000, unit: 'liters', brewTime: 10 },
  { name: 'Amstel Light', sku: 'AMS-001', batchSize: 8000, unit: 'liters', brewTime: 12 },
  { name: 'Amstel Lager', sku: 'AMS-002', batchSize: 10000, unit: 'liters', brewTime: 14 },
  { name: 'Dos Equis Lager', sku: 'DEQ-001', batchSize: 6000, unit: 'liters', brewTime: 13 },
  { name: 'Tecate Original', sku: 'TEC-001', batchSize: 7000, unit: 'liters', brewTime: 11 },
  { name: 'Newcastle Brown Ale', sku: 'NCB-001', batchSize: 5000, unit: 'liters', brewTime: 16 },
  { name: 'Moretti', sku: 'MOR-001', batchSize: 6000, unit: 'liters', brewTime: 15 },
  { name: 'Tiger Beer', sku: 'TIG-001', batchSize: 9000, unit: 'liters', brewTime: 13 }
];

// Brewery production stages - More uniform durations for better display
const BREWING_STAGES = [
  { name: 'Milling', duration: 8, resourceType: 'Grain Mill' },
  { name: 'Mashing', duration: 12, resourceType: 'Mash Tun' },
  { name: 'Lautering', duration: 10, resourceType: 'Lauter Tun' },
  { name: 'Boiling', duration: 8, resourceType: 'Brew Kettle' },
  { name: 'Whirlpool', duration: 6, resourceType: 'Whirlpool' },
  { name: 'Cooling', duration: 6, resourceType: 'Heat Exchanger' },
  { name: 'Fermentation', duration: 24, resourceType: 'Fermentation Tank' }, // Reduced from 7 days for display
  { name: 'Maturation', duration: 24, resourceType: 'Maturation Tank' }, // Reduced from 14 days for display
  { name: 'Filtration', duration: 10, resourceType: 'Filter' },
  { name: 'Carbonation', duration: 8, resourceType: 'Bright Tank' },
  { name: 'Packaging', duration: 16, resourceType: 'Packaging Line' },
  { name: 'Quality Testing', duration: 12, resourceType: 'Lab' }
];

// Brewery resources/equipment
const BREWERY_RESOURCES = [
  { name: 'Grain Mill 1', type: 'Grain Mill', capacity: 2000, unit: 'kg/hour' },
  { name: 'Grain Mill 2', type: 'Grain Mill', capacity: 2500, unit: 'kg/hour' },
  { name: 'Mash Tun 1', type: 'Mash Tun', capacity: 15000, unit: 'liters' },
  { name: 'Mash Tun 2', type: 'Mash Tun', capacity: 20000, unit: 'liters' },
  { name: 'Lauter Tun 1', type: 'Lauter Tun', capacity: 15000, unit: 'liters' },
  { name: 'Brew Kettle 1', type: 'Brew Kettle', capacity: 20000, unit: 'liters' },
  { name: 'Brew Kettle 2', type: 'Brew Kettle', capacity: 25000, unit: 'liters' },
  { name: 'Whirlpool Tank 1', type: 'Whirlpool', capacity: 20000, unit: 'liters' },
  { name: 'Heat Exchanger 1', type: 'Heat Exchanger', capacity: 1000, unit: 'liters/min' },
  { name: 'Fermentation Tank 1', type: 'Fermentation Tank', capacity: 30000, unit: 'liters' },
  { name: 'Fermentation Tank 2', type: 'Fermentation Tank', capacity: 30000, unit: 'liters' },
  { name: 'Fermentation Tank 3', type: 'Fermentation Tank', capacity: 40000, unit: 'liters' },
  { name: 'Fermentation Tank 4', type: 'Fermentation Tank', capacity: 40000, unit: 'liters' },
  { name: 'Maturation Tank 1', type: 'Maturation Tank', capacity: 30000, unit: 'liters' },
  { name: 'Maturation Tank 2', type: 'Maturation Tank', capacity: 30000, unit: 'liters' },
  { name: 'Maturation Tank 3', type: 'Maturation Tank', capacity: 40000, unit: 'liters' },
  { name: 'Filter System 1', type: 'Filter', capacity: 500, unit: 'liters/min' },
  { name: 'Bright Tank 1', type: 'Bright Tank', capacity: 25000, unit: 'liters' },
  { name: 'Bright Tank 2', type: 'Bright Tank', capacity: 25000, unit: 'liters' },
  { name: 'Packaging Line 1', type: 'Packaging Line', capacity: 1000, unit: 'bottles/min' },
  { name: 'Packaging Line 2', type: 'Packaging Line', capacity: 1500, unit: 'bottles/min' },
  { name: 'Packaging Line 3', type: 'Packaging Line', capacity: 800, unit: 'cans/min' },
  { name: 'Quality Lab 1', type: 'Lab', capacity: 10, unit: 'samples/hour' }
];

// Customer orders for brewery
const CUSTOMER_ORDERS = [
  { customer: 'Walmart Distribution', priority: 'High', region: 'North America' },
  { customer: 'Tesco UK', priority: 'High', region: 'Europe' },
  { customer: 'Carrefour France', priority: 'Medium', region: 'Europe' },
  { customer: 'Metro Germany', priority: 'Medium', region: 'Europe' },
  { customer: 'Kroger Stores', priority: 'High', region: 'North America' },
  { customer: 'Costco Wholesale', priority: 'High', region: 'North America' },
  { customer: 'Albert Heijn', priority: 'Medium', region: 'Europe' },
  { customer: 'AEON Japan', priority: 'Low', region: 'Asia' },
  { customer: 'Coles Australia', priority: 'Low', region: 'Australia' },
  { customer: 'Stadium Events Ltd', priority: 'Urgent', region: 'North America' }
];

export async function generateBrewerySimulationData() {
  console.log('🍺 Starting brewery simulation data generation...');

  try {
    // Clear existing PT tables data
    await db.execute(sql`TRUNCATE TABLE ptdepartments CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ptplants CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ptresources CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ptmanufacturingorders CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ptjobs CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ptjoboperations CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ptjobactivities CASCADE`);
    await db.execute(sql`TRUNCATE TABLE ptjobresources CASCADE`);

    // 1. Create brewery plants
    const plants = [
      { id: 1, external_id: 'PLANT-AMS-01', name: 'Amsterdam Brewery', description: 'Main European production facility' },
      { id: 2, external_id: 'PLANT-MIL-01', name: 'Milwaukee Brewery', description: 'North American production facility' },
      { id: 3, external_id: 'PLANT-MEX-01', name: 'Mexico City Brewery', description: 'Latin America production facility' },
      { id: 4, external_id: 'PLANT-SIN-01', name: 'Singapore Brewery', description: 'Asia Pacific production facility' },
      { id: 5, external_id: 'PLANT-JOH-01', name: 'Johannesburg Brewery', description: 'Africa production facility' }
    ];

    for (const plant of plants) {
      await db.execute(sql`
        INSERT INTO ptplants (id, external_id, name, description, plant_type, is_active, publish_date, instance_id, plant_id)
        VALUES (${plant.id}, ${plant.external_id}, ${plant.name}, ${plant.description}, 'manufacturing', true, NOW(), 'BREW-SIM-001', ${plant.id})
      `);
    }

    // 2. Create departments for each plant
    const departments = [
      { name: 'Brewing Operations', description: 'Main brewing production department' },
      { name: 'Packaging', description: 'Bottling and packaging department' },
      { name: 'Quality Control', description: 'Quality assurance and testing' },
      { name: 'Maintenance', description: 'Equipment maintenance department' }
    ];

    let deptId = 1;
    for (const plant of plants) {
      for (const dept of departments) {
        await db.execute(sql`
          INSERT INTO ptdepartments (id, department_id, name, description, publish_date, instance_id, plant_id)
          VALUES (${deptId}, ${deptId}, ${dept.name}, ${dept.description}, NOW(), 'BREW-SIM-001', ${plant.id})
        `);
        deptId++;
      }
    }

    // 3. Create brewery resources (equipment)
    // Define deployment order for each resource type based on production flow
    const getDeploymentOrder = (resourceType: string): number => {
      const orderMap: { [key: string]: number } = {
        'Grain Mill': 10,           // 1. Milling
        'Mash Tun': 20,             // 2. Mashing
        'Lauter Tun': 30,           // 3. Lautering
        'Brew Kettle': 40,          // 4. Boiling
        'Whirlpool': 50,            // 5. Whirlpool
        'Heat Exchanger': 60,       // 6. Cooling
        'Fermentation Tank': 70,    // 7. Fermentation
        'Maturation Tank': 80,      // 8. Maturation
        'Filter': 90,               // 9. Filtration
        'Bright Tank': 100,         // 10. Bright/Conditioning
        'Packaging Line': 110,      // 11. Packaging
        'Lab': 120                  // 12. Quality Control
      };
      return orderMap[resourceType] || 999;
    };

    let resourceId = 1;
    for (const plant of plants.slice(0, 2)) { // Focus on first 2 plants for detailed scheduling
      for (const resource of BREWERY_RESOURCES) {
        // Assign department based on resource type with proper brewery equipment classification
        let departmentOffset = (plant.id - 1) * 4; // Each plant has 4 departments
        let departmentId = departmentOffset + 1; // Default to Brewing Operations
        
        // Brewery Operations (Department 1): Core brewing equipment
        const brewingEquipment = ['Grain Mill', 'Mash Tun', 'Lauter Tun', 'Brew Kettle', 'Whirlpool', 'Heat Exchanger', 'Fermentation Tank', 'Maturation Tank', 'Filter', 'Bright Tank'];
        
        // Packaging (Department 2): Packaging and bottling lines
        const packagingEquipment = ['Packaging Line'];
        
        // Quality Control (Department 3): Testing and lab equipment
        const qualityEquipment = ['Lab'];
        
        // Maintenance (Department 4): Maintenance and support equipment
        const maintenanceEquipment = ['Maintenance', 'Cleaning', 'CIP'];
        
        if (packagingEquipment.includes(resource.type)) {
          departmentId = departmentOffset + 2; // Packaging department
        } else if (qualityEquipment.includes(resource.type)) {
          departmentId = departmentOffset + 3; // Quality Control department
        } else if (maintenanceEquipment.includes(resource.type)) {
          departmentId = departmentOffset + 4; // Maintenance department
        } else if (brewingEquipment.includes(resource.type)) {
          departmentId = departmentOffset + 1; // Brewing Operations (explicit)
        }
        // All other equipment defaults to Brewing Operations
        
        // Get deployment order for this resource type
        const deploymentOrder = getDeploymentOrder(resource.type);
        
        await db.execute(sql`
          INSERT INTO ptresources (id, external_id, name, description, plant_id, active, publish_date, instance_id, department_id, resource_id, deployment_order)
          VALUES (
            ${resourceId}, 
            ${`RES-${plant.external_id}-${resourceId.toString().padStart(3, '0')}`},
            ${resource.name},
            ${`${resource.type} - Capacity: ${resource.capacity} ${resource.unit}`},
            ${plant.id},
            true,
            NOW(),
            'BREW-SIM-001',
            ${departmentId}, 
            ${resourceId},
            ${deploymentOrder}
          )
        `);
        resourceId++;
      }
    }

    // Build a resource mapping for operations
    const resourceMapping: { [plantId: number]: { [resourceType: string]: number[] } } = {};
    let mappingResourceId = 1;
    for (const plant of plants.slice(0, 2)) {
      resourceMapping[plant.id] = {};
      for (const resource of BREWERY_RESOURCES) {
        if (!resourceMapping[plant.id][resource.type]) {
          resourceMapping[plant.id][resource.type] = [];
        }
        resourceMapping[plant.id][resource.type].push(mappingResourceId);
        mappingResourceId++;
      }
    }

    // 3. Generate manufacturing orders and jobs
    const startDate = new Date();
    startDate.setHours(6, 0, 0, 0); // Start at 6 AM today
    let moId = 1;
    let jobId = 1;
    let operationId = 1;
    let activityId = 1;
    let jobResourceId = 1;

    // Generate 3 weeks of production orders
    for (let weekOffset = 0; weekOffset < 3; weekOffset++) {
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + (weekOffset * 7) + dayOffset);
        
        // Skip weekends for new orders (but existing orders can run through weekends)
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          continue;
        }

        // Generate 2-4 production orders per day
        const ordersPerDay = Math.floor(Math.random() * 3) + 2;
        
        for (let orderNum = 0; orderNum < ordersPerDay; orderNum++) {
          const product = BEER_PRODUCTS[Math.floor(Math.random() * BEER_PRODUCTS.length)];
          const customer = CUSTOMER_ORDERS[Math.floor(Math.random() * CUSTOMER_ORDERS.length)];
          const plantIndex = Math.floor(Math.random() * 2); // Use first 2 plants
          const plant = plants[plantIndex];
          
          // Calculate batch size with some variation
          const batchMultiplier = 1 + (Math.random() * 0.5 - 0.25); // ±25% variation
          const batchSize = Math.floor(product.batchSize * batchMultiplier);
          
          // Create manufacturing order
          const moExternalId = `MO-${currentDate.getFullYear()}-${moId.toString().padStart(5, '0')}`;
          const dueDate = new Date(currentDate);
          dueDate.setDate(dueDate.getDate() + product.brewTime + Math.floor(Math.random() * 7)); // Add some buffer
          
          // Create job FIRST (before manufacturing order, due to foreign key constraint)
          const jobExternalId = `JOB-${product.sku}-${jobId.toString().padStart(5, '0')}`;
          const jobPriority = customer.priority === 'Urgent' ? 10 : customer.priority === 'High' ? 8 : customer.priority === 'Medium' ? 5 : 3;
          
          await db.execute(sql`
            INSERT INTO ptjobs (
              id, external_id, description,
              need_date_time, 
              priority, scheduled, publish_date, instance_id, job_id
            )
            VALUES (
              ${jobId},
              ${jobExternalId},
              ${`Brewing ${batchSize} liters of ${product.name}`},
              ${dueDate.toISOString()},
              ${jobPriority},
              true,
              NOW(),
              'BREW-SIM-001',
              ${jobId}
            )
          `);

          // Now create manufacturing order (after job exists)
          await db.execute(sql`
            INSERT INTO ptmanufacturingorders (
              id, external_id, name, description, 
              scheduled_start, scheduled_end, publish_date, instance_id, job_id, manufacturing_order_id,
              required_qty, expected_finish_qty, product_name
            )
            VALUES (
              ${moId},
              ${moExternalId},
              ${`${product.name} - ${customer.customer}`},
              ${`Batch production of ${batchSize} liters for ${customer.customer} (${customer.region})`},
              ${currentDate.toISOString()},
              ${dueDate.toISOString()},
              NOW(),
              'BREW-SIM-001',
              ${jobId},
              ${moId},
              ${batchSize},
              ${batchSize},
              ${product.name}
            )
          `);

          // Create operations for each brewing stage
          let operationStartDate = new Date(currentDate);
          operationStartDate.setHours(6 + orderNum * 2, 0, 0, 0); // Stagger start times
          
          for (let stageIndex = 0; stageIndex < BREWING_STAGES.length; stageIndex++) {
            const stage = BREWING_STAGES[stageIndex];
            const operationExternalId = `OP-${jobExternalId}-${(stageIndex + 1).toString().padStart(2, '0')}`;
            
            // Calculate operation end date
            const operationEndDate = new Date(operationStartDate);
            operationEndDate.setHours(operationEndDate.getHours() + stage.duration);
            
            // Determine status based on dates
            let operationStatus = 'Not Started';
            let percentComplete = 0;
            const now = new Date();
            
            if (operationEndDate < now) {
              operationStatus = 'Completed';
              percentComplete = 100;
            } else if (operationStartDate < now && operationEndDate > now) {
              operationStatus = 'In Progress';
              const totalDuration = operationEndDate.getTime() - operationStartDate.getTime();
              const elapsed = now.getTime() - operationStartDate.getTime();
              percentComplete = Math.floor((elapsed / totalDuration) * 100);
            }
            
            await db.execute(sql`
              INSERT INTO ptjoboperations (
                id, external_id, name, description,
                job_id, manufacturing_order_id,
                operation_id, required_finish_qty,
                cycle_hrs, setup_hours, post_processing_hours,
                scheduled_start, scheduled_end,
                commit_start_date, commit_end_date,
                on_hold, output_name, percent_finished,
                publish_date, instance_id
              )
              VALUES (
                ${operationId},
                ${operationExternalId},
                ${stage.name},
                ${`${stage.name} process for ${product.name}`},
                ${jobId},
                ${moId},
                ${operationId},
                ${batchSize},
                ${stage.duration},
                ${stage.duration < 2 ? 0.5 : 1},
                ${stage.name === 'Packaging' ? 2 : stage.name === 'Quality Testing' ? 1 : 0},
                ${operationStartDate.toISOString()},
                ${operationEndDate.toISOString()},
                ${operationStartDate.toISOString()},
                ${operationEndDate.toISOString()},
                false,
                ${stage.name === 'Packaging' ? `Packaged ${product.name}` : `${stage.name} Output`},
                ${percentComplete},
                NOW(),
                'BREW-SIM-001'
              )
            `);

            // Create activity for this operation
            await db.execute(sql`
              INSERT INTO ptjobactivities (
                id, external_id, operation_id,
                production_status, comments,
                scheduled_start_date, scheduled_end_date,
                publish_date, instance_id, job_id, manufacturing_order_id, activity_id
              )
              VALUES (
                ${activityId},
                ${`ACT-${operationExternalId}`},
                ${operationId},
                ${operationStatus},
                ${`${stage.name} activity for batch ${moExternalId}`},
                ${operationStartDate.toISOString()},
                ${operationEndDate.toISOString()},
                NOW(),
                'BREW-SIM-001',
                ${jobId},
                ${moId},
                ${activityId}
              )
            `);

            // Assign resource to this operation using the resource mapping
            const availableResources = resourceMapping[plant.id]?.[stage.resourceType];
            if (availableResources && availableResources.length > 0) {
              const selectedResourceId = availableResources[Math.floor(Math.random() * availableResources.length)];
              
              await db.execute(sql`
                INSERT INTO ptjobresources (
                  id, operation_id, default_resource_id,
                  is_primary, publish_date, instance_id, job_id, manufacturing_order_id, resource_requirement_id
                )
                VALUES (
                  ${jobResourceId},
                  ${operationId},
                  ${selectedResourceId},
                  true,
                  NOW(),
                  'BREW-SIM-001',
                  ${jobId},
                  ${moId},
                  ${jobResourceId}
                )
              `);
              jobResourceId++;
            } else {
              console.warn(`⚠️ No suitable resource found for operation ${stage.name} (resourceType: ${stage.resourceType}) in plant ${plant.id}`);
            }

            // Update start date for next operation
            operationStartDate = new Date(operationEndDate);
            operationId++;
            activityId++;
          }

          moId++;
          jobId++;
        }
      }
    }

    // Add some maintenance and cleaning operations
    for (let i = 0; i < 5; i++) {
      const maintenanceDate = new Date(startDate);
      maintenanceDate.setDate(maintenanceDate.getDate() + i * 4); // Every 4 days
      maintenanceDate.setHours(22, 0, 0, 0); // Late evening maintenance
      
      const moExternalId = `MO-MAINT-${moId.toString().padStart(5, '0')}`;
      const maintenanceEndDate = new Date(maintenanceDate);
      maintenanceEndDate.setHours(maintenanceEndDate.getHours() + 4); // 4 hours maintenance
      
      // Create job FIRST (before manufacturing order, due to foreign key constraint)
      const jobExternalId = `JOB-MAINT-${jobId.toString().padStart(5, '0')}`;
      
      await db.execute(sql`
        INSERT INTO ptjobs (
          id, external_id, description,
          need_date_time,
          priority, scheduled, publish_date, instance_id, job_id
        )
        VALUES (
          ${jobId},
          ${jobExternalId},
          ${'Equipment cleaning and maintenance'},
          ${maintenanceDate.toISOString()},
          ${7},
          true,
          NOW(),
          'BREW-SIM-001',
          ${jobId}
        )
      `);

      // Now create manufacturing order (after job exists)
      await db.execute(sql`
        INSERT INTO ptmanufacturingorders (
          id, external_id, name, description,
          scheduled_start, scheduled_end, publish_date, instance_id, job_id, manufacturing_order_id,
          required_qty, expected_finish_qty
        )
        VALUES (
          ${moId},
          ${moExternalId},
          ${'Equipment Maintenance'},
          ${'Scheduled maintenance and cleaning'},
          ${maintenanceDate.toISOString()},
          ${maintenanceEndDate.toISOString()},
          NOW(),
          'BREW-SIM-001',
          ${jobId},
          ${moId},
          ${0},
          ${0}
        )
      `);

      // Create maintenance operation
      
      await db.execute(sql`
        INSERT INTO ptjoboperations (
          id, external_id, name, description,
          job_id, manufacturing_order_id,
          operation_id, required_finish_qty,
          cycle_hrs, setup_hours, post_processing_hours,
          scheduled_start, scheduled_end,
          commit_start_date, commit_end_date,
          on_hold, output_name, percent_finished,
          publish_date, instance_id
        )
        VALUES (
          ${operationId},
          ${`OP-${jobExternalId}-01`},
          ${'Equipment Maintenance'},
          ${'Clean and maintain brewing equipment'},
          ${jobId},
          ${moId},
          ${operationId},
          ${0},
          ${4},
          ${0.5},
          ${0.5},
          ${maintenanceDate.toISOString()},
          ${maintenanceEndDate.toISOString()},
          ${maintenanceDate.toISOString()},
          ${maintenanceEndDate.toISOString()},
          false,
          ${'Maintenance Complete'},
          ${0},
          NOW(),
          'BREW-SIM-001'
        )
      `);

      operationId++;
      moId++;
      jobId++;
    }

    console.log('✅ Brewery simulation data generated successfully!');
    console.log(`📊 Created: ${plants.length} plants, ${resourceId - 1} resources, ${moId - 1} manufacturing orders, ${jobId - 1} jobs, ${operationId - 1} operations`);
    
    return {
      success: true,
      stats: {
        plants: plants.length,
        resources: resourceId - 1,
        manufacturingOrders: moId - 1,
        jobs: jobId - 1,
        operations: operationId - 1,
        activities: activityId - 1,
        jobResources: jobResourceId - 1
      }
    };

  } catch (error) {
    console.error('❌ Error generating brewery simulation data:', error);
    throw error;
  }
}

// Helper function to get current brewery production status
export async function getBreweryProductionStatus() {
  try {
    const result = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT mo.id) as total_orders,
        COUNT(DISTINCT j.id) as total_jobs,
        COUNT(DISTINCT jo.id) as total_operations,
        COUNT(DISTINCT CASE WHEN j.scheduled_status = 'in_progress' THEN j.id END) as jobs_in_progress,
        COUNT(DISTINCT CASE WHEN j.scheduled_status = 'completed' THEN j.id END) as jobs_completed,
        COUNT(DISTINCT CASE WHEN jo.percent_finished = 100 THEN jo.id END) as operations_completed,
        COUNT(DISTINCT CASE WHEN jo.percent_finished > 0 AND jo.percent_finished < 100 THEN jo.id END) as operations_in_progress
      FROM ptmanufacturingorders mo
      LEFT JOIN ptjobs j ON j.manufacturing_order_id = mo.id
      LEFT JOIN ptjoboperations jo ON jo.job_id = j.id
    `);

    return result.rows[0];
  } catch (error) {
    console.error('Error getting brewery production status:', error);
    return null;
  }
}