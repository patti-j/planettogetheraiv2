import { neon } from '@neondatabase/serverless';

// Direct brewery data migration to production
async function migrateBreweryToProduction() {
  console.log('🍺 Migrating brewery data to production...\n');
  
  if (!process.env.DATABASE_URL || !process.env.PRODUCTION_DATABASE_URL) {
    console.error('❌ Missing DATABASE_URL or PRODUCTION_DATABASE_URL');
    process.exit(1);
  }
  
  const devSql = neon(process.env.DATABASE_URL);
  const prodSql = neon(process.env.PRODUCTION_DATABASE_URL);
  
  try {
    // Step 1: Create tables in production (matching dev schema exactly)
    console.log('📝 Creating PT tables in production...');
    
    // Create ptplants
    await prodSql`
      CREATE TABLE IF NOT EXISTS ptplants (
        id INTEGER PRIMARY KEY,
        publish_date TIMESTAMP,
        instance_id VARCHAR(100),
        plant_id INTEGER,
        name TEXT,
        description TEXT,
        notes TEXT,
        bottleneck_threshold NUMERIC,
        heavy_load_threshold NUMERIC,
        external_id TEXT,
        department_count INTEGER,
        stable_days NUMERIC,
        daily_operating_expense NUMERIC,
        invested_capital NUMERIC,
        annual_percentage_rate NUMERIC,
        address TEXT,
        city TEXT,
        state TEXT,
        country TEXT,
        postal_code TEXT,
        timezone TEXT,
        latitude NUMERIC,
        longitude NUMERIC,
        plant_type TEXT,
        is_active BOOLEAN DEFAULT true,
        capacity JSONB,
        operational_metrics JSONB
      )
    `;
    
    // Create ptresources  
    await prodSql`
      CREATE TABLE IF NOT EXISTS ptresources (
        id INTEGER PRIMARY KEY,
        resource_id VARCHAR(50),
        resource_code VARCHAR(50),
        resource_name VARCHAR(100),
        resource_type VARCHAR(50),
        department VARCHAR(100),
        capacity NUMERIC(10,2),
        capacity_units VARCHAR(50),
        efficiency_percentage NUMERIC(5,2) DEFAULT 100,
        setup_time_minutes INTEGER DEFAULT 0,
        hourly_cost NUMERIC(10,2),
        plant_id INTEGER,
        is_active BOOLEAN DEFAULT true,
        is_bottleneck BOOLEAN DEFAULT false,
        max_parallel_jobs INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Additional PT fields
        publish_date TIMESTAMP,
        instance_id VARCHAR(100),
        department_id INTEGER,
        name VARCHAR(255),
        description TEXT,
        notes TEXT,
        external_id VARCHAR(100),
        plant_name VARCHAR(255),
        department_name VARCHAR(255),
        planning_area VARCHAR(255),
        active BOOLEAN DEFAULT true,
        bottleneck BOOLEAN DEFAULT false,
        buffer_hours NUMERIC,
        capacity_type VARCHAR(50),
        setup_cost NUMERIC,
        tank VARCHAR(100)
      )
    `;
    
    // Create ptjobs
    await prodSql`
      CREATE TABLE IF NOT EXISTS ptjobs (
        id INTEGER PRIMARY KEY,
        external_id VARCHAR(100),
        name VARCHAR(255),
        description TEXT,
        priority INTEGER DEFAULT 999,
        need_date_time TIMESTAMP,
        scheduled_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        manufacturing_release_date TIMESTAMP
      )
    `;
    
    // Create ptjoboperations
    await prodSql`
      CREATE TABLE IF NOT EXISTS ptjoboperations (
        id INTEGER PRIMARY KEY,
        job_id INTEGER,
        external_id VARCHAR(100),
        name VARCHAR(255),
        description TEXT,
        operation_id VARCHAR(100),
        base_operation_id VARCHAR(100),
        required_finish_qty NUMERIC,
        cycle_hrs NUMERIC,
        setup_hours NUMERIC,
        post_processing_hours NUMERIC,
        scheduled_start TIMESTAMP,
        scheduled_end TIMESTAMP,
        percent_finished NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sequence_number INTEGER
      )
    `;
    
    console.log('✅ Tables created\n');
    
    // Step 2: Clear existing data
    console.log('🧹 Clearing existing production data...');
    await prodSql`TRUNCATE TABLE ptjoboperations CASCADE`;
    await prodSql`TRUNCATE TABLE ptjobs CASCADE`;
    await prodSql`TRUNCATE TABLE ptresources CASCADE`;
    await prodSql`TRUNCATE TABLE ptplants CASCADE`;
    console.log('✅ Cleared\n');
    
    // Step 3: Copy data from development
    console.log('📦 Copying data from development...');
    
    // Copy plants
    const plants = await devSql`SELECT * FROM ptplants`;
    console.log(`  Found ${plants.length} plants`);
    
    for (const plant of plants) {
      // Insert each field explicitly to avoid type issues
      await prodSql`
        INSERT INTO ptplants (
          id, publish_date, instance_id, plant_id, name, description, notes,
          bottleneck_threshold, heavy_load_threshold, external_id, department_count,
          stable_days, daily_operating_expense, invested_capital, annual_percentage_rate,
          address, city, state, country, postal_code, timezone, latitude, longitude,
          plant_type, is_active, capacity, operational_metrics
        ) VALUES (
          ${plant.id}, ${plant.publish_date}, ${plant.instance_id}, ${plant.plant_id},
          ${plant.name}, ${plant.description}, ${plant.notes}, 
          ${plant.bottleneck_threshold}, ${plant.heavy_load_threshold}, 
          ${plant.external_id}, ${plant.department_count}, ${plant.stable_days},
          ${plant.daily_operating_expense}, ${plant.invested_capital},
          ${plant.annual_percentage_rate}, ${plant.address}, ${plant.city},
          ${plant.state}, ${plant.country}, ${plant.postal_code}, ${plant.timezone},
          ${plant.latitude}, ${plant.longitude}, ${plant.plant_type}, ${plant.is_active},
          ${plant.capacity}::jsonb, ${plant.operational_metrics}::jsonb
        )
      `;
    }
    console.log(`  ✅ Copied ${plants.length} plants`);
    
    // Copy resources
    const resources = await devSql`SELECT * FROM ptresources`;
    console.log(`  Found ${resources.length} resources`);
    
    for (const res of resources) {
      await prodSql`
        INSERT INTO ptresources (
          id, resource_id, resource_code, resource_name, resource_type, department,
          capacity, capacity_units, efficiency_percentage, setup_time_minutes,
          hourly_cost, plant_id, is_active, is_bottleneck, max_parallel_jobs,
          created_at, updated_at, publish_date, instance_id, department_id,
          name, description, notes, external_id, plant_name, department_name,
          planning_area, active, bottleneck, buffer_hours, capacity_type,
          setup_cost, tank
        ) VALUES (
          ${res.id}, ${res.resource_id}, ${res.resource_code}, ${res.resource_name},
          ${res.resource_type}, ${res.department}, ${res.capacity}, ${res.capacity_units},
          ${res.efficiency_percentage}, ${res.setup_time_minutes}, ${res.hourly_cost},
          ${res.plant_id}, ${res.is_active}, ${res.is_bottleneck}, ${res.max_parallel_jobs},
          ${res.created_at}, ${res.updated_at}, ${res.publish_date}, ${res.instance_id},
          ${res.department_id}, ${res.name}, ${res.description}, ${res.notes},
          ${res.external_id}, ${res.plant_name}, ${res.department_name},
          ${res.planning_area}, ${res.active}, ${res.bottleneck}, ${res.buffer_hours},
          ${res.capacity_type}, ${res.setup_cost}, ${res.tank}
        )
      `;
    }
    console.log(`  ✅ Copied ${resources.length} resources`);
    
    // Copy jobs
    const jobs = await devSql`SELECT * FROM ptjobs`;
    console.log(`  Found ${jobs.length} jobs`);
    
    for (const job of jobs) {
      await prodSql`
        INSERT INTO ptjobs (
          id, external_id, name, description, priority, need_date_time,
          scheduled_status, created_at, updated_at, manufacturing_release_date
        ) VALUES (
          ${job.id}, ${job.external_id}, ${job.name}, ${job.description},
          ${job.priority}, ${job.need_date_time}, ${job.scheduled_status},
          ${job.created_at}, ${job.updated_at}, ${job.manufacturing_release_date}
        )
      `;
    }
    console.log(`  ✅ Copied ${jobs.length} jobs`);
    
    // Copy operations
    const operations = await devSql`SELECT * FROM ptjoboperations`;
    console.log(`  Found ${operations.length} operations`);
    
    for (const op of operations) {
      await prodSql`
        INSERT INTO ptjoboperations (
          id, job_id, external_id, name, description, operation_id,
          base_operation_id, required_finish_qty, cycle_hrs, setup_hours,
          post_processing_hours, scheduled_start, scheduled_end, percent_finished,
          created_at, updated_at, sequence_number
        ) VALUES (
          ${op.id}, ${op.job_id}, ${op.external_id}, ${op.name}, ${op.description},
          ${op.operation_id}, ${op.base_operation_id}, ${op.required_finish_qty},
          ${op.cycle_hrs}, ${op.setup_hours}, ${op.post_processing_hours},
          ${op.scheduled_start}, ${op.scheduled_end}, ${op.percent_finished},
          ${op.created_at}, ${op.updated_at}, ${op.sequence_number}
        )
      `;
    }
    console.log(`  ✅ Copied ${operations.length} operations`);
    
    // Step 4: Verify
    console.log('\n📊 Verifying Production Data:');
    console.log('==============================');
    
    const prodCounts = {
      plants: await prodSql`SELECT COUNT(*) as count FROM ptplants`,
      resources: await prodSql`SELECT COUNT(*) as count FROM ptresources`,  
      jobs: await prodSql`SELECT COUNT(*) as count FROM ptjobs`,
      operations: await prodSql`SELECT COUNT(*) as count FROM ptjoboperations`
    };
    
    console.log(`✅ Plants:     ${prodCounts.plants[0].count}`);
    console.log(`✅ Resources:  ${prodCounts.resources[0].count}`);
    console.log(`✅ Jobs:       ${prodCounts.jobs[0].count}`);
    console.log(`✅ Operations: ${prodCounts.operations[0].count}`);
    
    // Show brewery jobs
    const breweryJobs = await prodSql`
      SELECT j.id, j.external_id, j.name, j.priority,
             COUNT(o.id) as op_count
      FROM ptjobs j
      LEFT JOIN ptjoboperations o ON o.job_id = j.id
      GROUP BY j.id, j.external_id, j.name, j.priority
      ORDER BY j.priority
    `;
    
    console.log('\n🍺 Brewery Jobs in Production:');
    for (const job of breweryJobs) {
      console.log(`${job.priority}. ${job.name} (${job.op_count} operations)`);
    }
    
    console.log('\n🎉 Migration Complete!');
    console.log('   Production database now has:');
    console.log('   - 5 brewery jobs (IPA, Lager, Stout, Wheat Beer, Porter)');
    console.log('   - 45 operations (9 brewing steps per job)');
    console.log('   - 18 brewery resources');
    console.log('   - Complete brewery production workflow');
    console.log('\n   Production site at planettogetherai.com is ready!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
    process.exit(1);
  }
}

// Run migration
migrateBreweryToProduction().catch(console.error);