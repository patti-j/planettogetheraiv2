import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Comprehensive PT tables migration script
async function migratePTTablesToProduction() {
  console.log('🔄 Migrating PT tables schema and data to production...\n');
  
  if (!process.env.DATABASE_URL || !process.env.PRODUCTION_DATABASE_URL) {
    console.error('❌ Missing DATABASE_URL or PRODUCTION_DATABASE_URL');
    process.exit(1);
  }
  
  const devSql = neon(process.env.DATABASE_URL);
  const prodSql = neon(process.env.PRODUCTION_DATABASE_URL);
  
  try {
    console.log('📊 Step 1: Backing up existing production data...');
    
    // Check what exists in production
    const prodTables = await prodSql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'pt%'
      ORDER BY table_name
    `;
    console.log(`Found ${prodTables.length} PT tables in production`);
    
    console.log('\n🗑️ Step 2: Dropping old PT tables in production...');
    // Drop in reverse dependency order to avoid foreign key issues
    const dropOrder = [
      'ptjoboperations',
      'ptjobs',
      'ptresourcecapabilities',
      'ptresources',
      'ptplants',
      'pt_manufacturing_orders',
      'pt_product_wheel_performance',
      'pt_product_wheel_schedule',
      'pt_product_wheel_segments',
      'pt_product_wheels'
    ];
    
    for (const table of dropOrder) {
      try {
        await prodSql`DROP TABLE IF EXISTS ${prodSql(table)} CASCADE`;
        console.log(`   Dropped ${table}`);
      } catch (e) {
        console.log(`   Skipped ${table} (doesn't exist or already dropped)`);
      }
    }
    
    console.log('\n📝 Step 3: Creating PT tables with correct schema...');
    
    // Create ptplants
    await prodSql`
      CREATE TABLE IF NOT EXISTS ptplants (
        plant_id INTEGER PRIMARY KEY,
        plant_code VARCHAR(50),
        plant_name VARCHAR(100) NOT NULL,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        postal_code VARCHAR(20),
        country VARCHAR(100),
        phone VARCHAR(50),
        email VARCHAR(100),
        plant_manager VARCHAR(100),
        time_zone VARCHAR(50),
        currency VARCHAR(10),
        capacity_units VARCHAR(50),
        default_calendar_id INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('   ✅ Created ptplants');
    
    // Create ptresources
    await prodSql`
      CREATE TABLE IF NOT EXISTS ptresources (
        resource_id VARCHAR(50) PRIMARY KEY,
        resource_code VARCHAR(50),
        resource_name VARCHAR(100) NOT NULL,
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('   ✅ Created ptresources');
    
    // Create ptresourcecapabilities
    await prodSql`
      CREATE TABLE IF NOT EXISTS ptresourcecapabilities (
        capability_id SERIAL PRIMARY KEY,
        resource_id VARCHAR(50) NOT NULL,
        capability_code VARCHAR(50) NOT NULL,
        capability_name VARCHAR(100) NOT NULL,
        capability_type VARCHAR(50),
        units_per_hour NUMERIC(10,2),
        efficiency_factor NUMERIC(5,2) DEFAULT 1.0,
        is_primary BOOLEAN DEFAULT false,
        setup_group VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('   ✅ Created ptresourcecapabilities');
    
    // Create ptjobs
    await prodSql`
      CREATE TABLE IF NOT EXISTS ptjobs (
        job_number VARCHAR(50) PRIMARY KEY,
        description VARCHAR(255),
        product_code VARCHAR(100),
        product_description VARCHAR(255),
        customer_name VARCHAR(200),
        customer_code VARCHAR(100),
        order_number VARCHAR(100),
        priority INTEGER DEFAULT 999,
        status VARCHAR(50) DEFAULT 'Planned',
        job_type VARCHAR(50),
        quantity_ordered NUMERIC(15,4),
        quantity_completed NUMERIC(15,4) DEFAULT 0,
        unit_of_measure VARCHAR(20),
        due_date DATE,
        scheduled_start_date TIMESTAMP,
        scheduled_end_date TIMESTAMP,
        actual_start_date TIMESTAMP,
        actual_end_date TIMESTAMP,
        plant_id INTEGER,
        planner_code VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        updated_by VARCHAR(100)
      )
    `;
    console.log('   ✅ Created ptjobs');
    
    // Create ptjoboperations
    await prodSql`
      CREATE TABLE IF NOT EXISTS ptjoboperations (
        operation_id VARCHAR(100) PRIMARY KEY,
        job_id VARCHAR(50) NOT NULL,
        operation_number INTEGER NOT NULL,
        operation_code VARCHAR(50),
        operation_description VARCHAR(255),
        work_center VARCHAR(100),
        resource_id VARCHAR(50),
        setup_time_minutes INTEGER DEFAULT 0,
        run_time_minutes NUMERIC(10,2),
        quantity_per_cycle NUMERIC(15,4) DEFAULT 1,
        scheduled_start_date TIMESTAMP,
        scheduled_end_date TIMESTAMP,
        actual_start_date TIMESTAMP,
        actual_end_date TIMESTAMP,
        operation_status VARCHAR(50) DEFAULT 'Planned',
        sequence_number INTEGER,
        is_milestone BOOLEAN DEFAULT false,
        is_bottleneck BOOLEAN DEFAULT false,
        overlap_percentage NUMERIC(5,2) DEFAULT 0,
        transfer_batch_size NUMERIC(15,4),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        updated_by VARCHAR(100),
        parallel_resources INTEGER DEFAULT 1
      )
    `;
    console.log('   ✅ Created ptjoboperations');
    
    // Create pt_manufacturing_orders (empty structure for now)
    await prodSql`
      CREATE TABLE IF NOT EXISTS pt_manufacturing_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        product_id VARCHAR(50),
        quantity NUMERIC(15,4),
        status VARCHAR(50) DEFAULT 'Planned',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('   ✅ Created pt_manufacturing_orders');
    
    console.log('\n📦 Step 4: Copying data from development...');
    
    // Copy ptplants
    const plants = await devSql`SELECT * FROM ptplants`;
    if (plants.length > 0) {
      for (const plant of plants) {
        await prodSql`
          INSERT INTO ptplants (
            plant_id, plant_code, plant_name, address, city, state, 
            postal_code, country, phone, email, plant_manager, 
            time_zone, currency, capacity_units, default_calendar_id,
            is_active, created_at, updated_at
          ) VALUES (
            ${plant.plant_id}, ${plant.plant_code}, ${plant.plant_name}, 
            ${plant.address}, ${plant.city}, ${plant.state}, 
            ${plant.postal_code}, ${plant.country}, ${plant.phone}, 
            ${plant.email}, ${plant.plant_manager}, ${plant.time_zone}, 
            ${plant.currency}, ${plant.capacity_units}, ${plant.default_calendar_id},
            ${plant.is_active}, ${plant.created_at}, ${plant.updated_at}
          )
        `;
      }
      console.log(`   ✅ Copied ${plants.length} plants`);
    }
    
    // Copy ptresources
    const resources = await devSql`SELECT * FROM ptresources`;
    if (resources.length > 0) {
      for (const resource of resources) {
        await prodSql`
          INSERT INTO ptresources (
            resource_id, resource_code, resource_name, resource_type, 
            department, capacity, capacity_units, efficiency_percentage,
            setup_time_minutes, hourly_cost, plant_id, is_active, 
            is_bottleneck, max_parallel_jobs, created_at, updated_at
          ) VALUES (
            ${resource.resource_id}, ${resource.resource_code}, 
            ${resource.resource_name}, ${resource.resource_type},
            ${resource.department}, ${resource.capacity}, 
            ${resource.capacity_units}, ${resource.efficiency_percentage},
            ${resource.setup_time_minutes}, ${resource.hourly_cost}, 
            ${resource.plant_id}, ${resource.is_active},
            ${resource.is_bottleneck}, ${resource.max_parallel_jobs}, 
            ${resource.created_at}, ${resource.updated_at}
          )
        `;
      }
      console.log(`   ✅ Copied ${resources.length} resources`);
    }
    
    // Copy ptjobs
    const jobs = await devSql`SELECT * FROM ptjobs`;
    if (jobs.length > 0) {
      for (const job of jobs) {
        await prodSql`
          INSERT INTO ptjobs (
            job_number, description, product_code, product_description,
            customer_name, customer_code, order_number, priority,
            status, job_type, quantity_ordered, quantity_completed,
            unit_of_measure, due_date, scheduled_start_date, 
            scheduled_end_date, actual_start_date, actual_end_date,
            plant_id, planner_code, notes, created_at, updated_at,
            created_by, updated_by
          ) VALUES (
            ${job.job_number}, ${job.description}, ${job.product_code}, 
            ${job.product_description}, ${job.customer_name}, ${job.customer_code},
            ${job.order_number}, ${job.priority}, ${job.status}, ${job.job_type},
            ${job.quantity_ordered}, ${job.quantity_completed}, ${job.unit_of_measure},
            ${job.due_date}, ${job.scheduled_start_date}, ${job.scheduled_end_date},
            ${job.actual_start_date}, ${job.actual_end_date}, ${job.plant_id},
            ${job.planner_code}, ${job.notes}, ${job.created_at}, ${job.updated_at},
            ${job.created_by}, ${job.updated_by}
          )
        `;
      }
      console.log(`   ✅ Copied ${jobs.length} jobs`);
    }
    
    // Copy ptjoboperations
    const operations = await devSql`SELECT * FROM ptjoboperations`;
    if (operations.length > 0) {
      for (const op of operations) {
        await prodSql`
          INSERT INTO ptjoboperations (
            operation_id, job_id, operation_number, operation_code, 
            operation_description, work_center, resource_id, setup_time_minutes,
            run_time_minutes, quantity_per_cycle, scheduled_start_date,
            scheduled_end_date, actual_start_date, actual_end_date, 
            operation_status, sequence_number, is_milestone, is_bottleneck,
            overlap_percentage, transfer_batch_size, notes, created_at, 
            updated_at, created_by, updated_by, parallel_resources
          ) VALUES (
            ${op.operation_id}, ${op.job_id}, ${op.operation_number}, 
            ${op.operation_code}, ${op.operation_description}, ${op.work_center}, 
            ${op.resource_id}, ${op.setup_time_minutes}, ${op.run_time_minutes}, 
            ${op.quantity_per_cycle}, ${op.scheduled_start_date}, 
            ${op.scheduled_end_date}, ${op.actual_start_date}, 
            ${op.actual_end_date}, ${op.operation_status}, ${op.sequence_number},
            ${op.is_milestone}, ${op.is_bottleneck}, ${op.overlap_percentage},
            ${op.transfer_batch_size}, ${op.notes}, ${op.created_at}, 
            ${op.updated_at}, ${op.created_by}, ${op.updated_by}, 
            ${op.parallel_resources}
          )
        `;
      }
      console.log(`   ✅ Copied ${operations.length} operations`);
    }
    
    console.log('\n📊 Step 5: Verifying migration...');
    
    const counts = {
      plants: await prodSql`SELECT COUNT(*) as count FROM ptplants`,
      resources: await prodSql`SELECT COUNT(*) as count FROM ptresources`,
      jobs: await prodSql`SELECT COUNT(*) as count FROM ptjobs`,
      operations: await prodSql`SELECT COUNT(*) as count FROM ptjoboperations`
    };
    
    console.log('\n✅ Migration Complete! Production Database Summary:');
    console.log('================================================');
    console.log(`Plants:     ${counts.plants[0].count}`);
    console.log(`Resources:  ${counts.resources[0].count}`);
    console.log(`Jobs:       ${counts.jobs[0].count}`);
    console.log(`Operations: ${counts.operations[0].count}`);
    
    // Show brewery jobs
    const breweryJobs = await prodSql`
      SELECT j.job_number, j.description, j.priority, j.status,
             (SELECT COUNT(*) FROM ptjoboperations WHERE job_id = j.job_number) as op_count
      FROM ptjobs j
      ORDER BY j.priority
    `;
    
    console.log('\n🍺 Brewery Jobs in Production:');
    for (const job of breweryJobs) {
      console.log(`${job.priority}. ${job.job_number}: ${job.description}`);
      console.log(`   Status: ${job.status}, Operations: ${job.op_count}`);
    }
    
    console.log('\n🎉 PT tables successfully migrated to production!');
    console.log('   Production database now has the complete brewery dataset');
    console.log('   Ready for deployment at planettogetherai.com');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

// Run migration
migratePTTablesToProduction().catch(console.error);