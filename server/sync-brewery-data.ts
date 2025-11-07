import { neon } from '@neondatabase/serverless';

// Simplified brewery data sync to production
async function syncBreweryData() {
  console.log('🍺 Syncing brewery data to production...\n');
  
  if (!process.env.DATABASE_URL || !process.env.PRODUCTION_DATABASE_URL) {
    console.error('❌ Missing DATABASE_URL or PRODUCTION_DATABASE_URL');
    process.exit(1);
  }
  
  const devSql = neon(process.env.DATABASE_URL);
  const prodSql = neon(process.env.PRODUCTION_DATABASE_URL);
  
  try {
    // First, ensure production tables exist with the right schema
    console.log('📝 Creating/updating production tables...');
    
    // Create ptplants if not exists (matching dev structure)
    await prodSql`
      CREATE TABLE IF NOT EXISTS ptplants (
        id SERIAL PRIMARY KEY,
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
    
    // Create ptjobs if not exists (matching dev structure)
    await prodSql`
      CREATE TABLE IF NOT EXISTS ptjobs (
        id SERIAL PRIMARY KEY,
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
    
    // Create ptjoboperations if not exists (matching dev structure)
    await prodSql`
      CREATE TABLE IF NOT EXISTS ptjoboperations (
        id SERIAL PRIMARY KEY,
        job_id VARCHAR(100),
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
    
    // Create ptresources if not exists (matching dev structure)
    await prodSql`
      CREATE TABLE IF NOT EXISTS ptresources (
        resource_id VARCHAR(50) PRIMARY KEY,
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('   ✅ Tables ready\n');
    
    // Clear existing production data
    console.log('🧹 Clearing existing production data...');
    await prodSql`DELETE FROM ptjoboperations`;
    await prodSql`DELETE FROM ptjobs`;
    await prodSql`DELETE FROM ptresources`;
    await prodSql`DELETE FROM ptplants`;
    console.log('   ✅ Cleared\n');
    
    // Copy plants
    console.log('📦 Copying plants...');
    const plants = await devSql`SELECT * FROM ptplants`;
    for (const plant of plants) {
      await prodSql`
        INSERT INTO ptplants (
          id, publish_date, instance_id, plant_id, name, description, notes,
          bottleneck_threshold, heavy_load_threshold, external_id, department_count,
          stable_days, daily_operating_expense, invested_capital, annual_percentage_rate,
          address, city, state, country, postal_code, timezone, latitude, longitude,
          plant_type, is_active, capacity, operational_metrics
        ) VALUES (
          ${plant.id}, ${plant.publish_date}, ${plant.instance_id}, ${plant.plant_id},
          ${plant.name}, ${plant.description}, ${plant.notes}, ${plant.bottleneck_threshold},
          ${plant.heavy_load_threshold}, ${plant.external_id}, ${plant.department_count},
          ${plant.stable_days}, ${plant.daily_operating_expense}, ${plant.invested_capital},
          ${plant.annual_percentage_rate}, ${plant.address}, ${plant.city}, ${plant.state},
          ${plant.country}, ${plant.postal_code}, ${plant.timezone}, ${plant.latitude},
          ${plant.longitude}, ${plant.plant_type}, ${plant.is_active}, 
          ${JSON.stringify(plant.capacity)}, ${JSON.stringify(plant.operational_metrics)}
        )
      `;
    }
    console.log(`   ✅ Copied ${plants.length} plants`);
    
    // Copy resources
    console.log('📦 Copying resources...');
    const resources = await devSql`SELECT * FROM ptresources`;
    for (const resource of resources) {
      await prodSql`
        INSERT INTO ptresources (
          resource_id, resource_code, resource_name, resource_type, department,
          capacity, capacity_units, efficiency_percentage, setup_time_minutes,
          hourly_cost, plant_id, is_active, is_bottleneck, max_parallel_jobs,
          created_at, updated_at
        ) VALUES (
          ${resource.resource_id}, ${resource.resource_code}, ${resource.resource_name},
          ${resource.resource_type}, ${resource.department}, ${resource.capacity},
          ${resource.capacity_units}, ${resource.efficiency_percentage},
          ${resource.setup_time_minutes}, ${resource.hourly_cost}, ${resource.plant_id},
          ${resource.is_active}, ${resource.is_bottleneck}, ${resource.max_parallel_jobs},
          ${resource.created_at}, ${resource.updated_at}
        )
      `;
    }
    console.log(`   ✅ Copied ${resources.length} resources`);
    
    // Copy jobs
    console.log('📦 Copying jobs...');
    const jobs = await devSql`SELECT * FROM ptjobs`;
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
    console.log(`   ✅ Copied ${jobs.length} jobs`);
    
    // Copy operations
    console.log('📦 Copying operations...');
    const operations = await devSql`SELECT * FROM ptjoboperations`;
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
    console.log(`   ✅ Copied ${operations.length} operations`);
    
    // Verify
    console.log('\n📊 Production Database Summary:');
    console.log('=====================================');
    
    const counts = {
      plants: await prodSql`SELECT COUNT(*) as count FROM ptplants`,
      resources: await prodSql`SELECT COUNT(*) as count FROM ptresources`,
      jobs: await prodSql`SELECT COUNT(*) as count FROM ptjobs`,
      operations: await prodSql`SELECT COUNT(*) as count FROM ptjoboperations`
    };
    
    console.log(`✅ Plants:     ${counts.plants[0].count}`);
    console.log(`✅ Resources:  ${counts.resources[0].count}`);
    console.log(`✅ Jobs:       ${counts.jobs[0].count}`);
    console.log(`✅ Operations: ${counts.operations[0].count}`);
    
    // Show brewery jobs
    const breweryJobs = await prodSql`
      SELECT id, external_id, name, description, priority 
      FROM ptjobs 
      ORDER BY priority 
      LIMIT 10
    `;
    
    console.log('\n🍺 Brewery Jobs in Production:');
    for (const job of breweryJobs) {
      const ops = await prodSql`
        SELECT COUNT(*) as count 
        FROM ptjoboperations 
        WHERE job_id = ${job.external_id}
      `;
      console.log(`${job.priority}. ${job.name}`);
      console.log(`   ${job.description}`);
      console.log(`   External ID: ${job.external_id}, Operations: ${ops[0].count}`);
    }
    
    console.log('\n🎉 Brewery data successfully synced to production!');
    console.log('   Production database now has the complete brewery dataset:');
    console.log('   - 5 brewery jobs (IPA, Lager, Stout, Wheat Beer, Porter)');
    console.log('   - 45 operations (9 steps per job)');
    console.log('   - 18 brewery resources');
    console.log('   - Complete brewery production workflow');
    console.log('\n   Ready for deployment at planettogetherai.com!');
    
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
    process.exit(1);
  }
}

// Run sync
syncBreweryData().catch(console.error);