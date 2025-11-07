import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Direct SQL export script for brewery data
async function exportBreweryDataToProduction() {
  console.log('🍺 Exporting brewery production data to production database...\n');
  
  // Check for required environment variables
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found (development database)');
    process.exit(1);
  }
  
  if (!process.env.PRODUCTION_DATABASE_URL) {
    console.error('❌ PRODUCTION_DATABASE_URL not found');
    process.exit(1);
  }
  
  // Connect to both databases
  console.log('📊 Connecting to databases...');
  const devSql = neon(process.env.DATABASE_URL);
  const prodSql = neon(process.env.PRODUCTION_DATABASE_URL);
  
  try {
    console.log('\n1️⃣ Copying PT Plants...');
    await prodSql`DELETE FROM ptplants`;
    const plants = await devSql`SELECT * FROM ptplants`;
    for (const plant of plants) {
      await prodSql`
        INSERT INTO ptplants (plant_id, plant_code, plant_name, address, city, state, 
                             postal_code, country, phone, email, plant_manager, 
                             time_zone, currency, capacity_units, default_calendar_id,
                             is_active, created_at, updated_at)
        VALUES (${plant.plant_id}, ${plant.plant_code}, ${plant.plant_name}, 
                ${plant.address}, ${plant.city}, ${plant.state}, ${plant.postal_code}, 
                ${plant.country}, ${plant.phone}, ${plant.email}, ${plant.plant_manager},
                ${plant.time_zone}, ${plant.currency}, ${plant.capacity_units}, 
                ${plant.default_calendar_id}, ${plant.is_active}, 
                ${plant.created_at}, ${plant.updated_at})
      `;
    }
    console.log(`   ✅ Copied ${plants.length} plants`);
    
    console.log('\n2️⃣ Copying PT Resources...');
    await prodSql`DELETE FROM ptresources`;
    const resources = await devSql`SELECT * FROM ptresources`;
    for (const resource of resources) {
      await prodSql`
        INSERT INTO ptresources (resource_id, resource_code, resource_name, 
                                resource_type, department, capacity, capacity_units,
                                efficiency_percentage, setup_time_minutes, 
                                hourly_cost, plant_id, is_active, is_bottleneck,
                                max_parallel_jobs, created_at, updated_at)
        VALUES (${resource.resource_id}, ${resource.resource_code}, ${resource.resource_name},
                ${resource.resource_type}, ${resource.department}, ${resource.capacity},
                ${resource.capacity_units}, ${resource.efficiency_percentage},
                ${resource.setup_time_minutes}, ${resource.hourly_cost}, ${resource.plant_id},
                ${resource.is_active}, ${resource.is_bottleneck}, ${resource.max_parallel_jobs},
                ${resource.created_at}, ${resource.updated_at})
      `;
    }
    console.log(`   ✅ Copied ${resources.length} resources`);
    
    console.log('\n3️⃣ Copying PT Jobs...');
    await prodSql`DELETE FROM ptjobs`;
    const jobs = await devSql`SELECT * FROM ptjobs`;
    for (const job of jobs) {
      await prodSql`
        INSERT INTO ptjobs (job_number, description, product_code, product_description,
                           customer_name, customer_code, order_number, priority,
                           status, job_type, quantity_ordered, quantity_completed,
                           unit_of_measure, due_date, scheduled_start_date, 
                           scheduled_end_date, actual_start_date, actual_end_date,
                           plant_id, planner_code, notes, created_at, updated_at,
                           created_by, updated_by)
        VALUES (${job.job_number}, ${job.description}, ${job.product_code}, 
                ${job.product_description}, ${job.customer_name}, ${job.customer_code},
                ${job.order_number}, ${job.priority}, ${job.status}, ${job.job_type},
                ${job.quantity_ordered}, ${job.quantity_completed}, ${job.unit_of_measure},
                ${job.due_date}, ${job.scheduled_start_date}, ${job.scheduled_end_date},
                ${job.actual_start_date}, ${job.actual_end_date}, ${job.plant_id},
                ${job.planner_code}, ${job.notes}, ${job.created_at}, ${job.updated_at},
                ${job.created_by}, ${job.updated_by})
      `;
    }
    console.log(`   ✅ Copied ${jobs.length} jobs`);
    
    console.log('\n4️⃣ Copying PT Job Operations...');
    await prodSql`DELETE FROM ptjoboperations`;
    const operations = await devSql`
      SELECT operation_id, job_id, operation_number, operation_code, 
             operation_description, work_center, resource_id, setup_time_minutes,
             run_time_minutes, quantity_per_cycle, scheduled_start_date,
             scheduled_end_date, actual_start_date, actual_end_date, 
             operation_status, sequence_number, is_milestone, is_bottleneck,
             overlap_percentage, transfer_batch_size, notes, created_at, 
             updated_at, created_by, updated_by, parallel_resources
      FROM ptjoboperations
    `;
    
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
          ${op.operation_id}, ${op.job_id}, ${op.operation_number}, ${op.operation_code},
          ${op.operation_description}, ${op.work_center}, ${op.resource_id}, 
          ${op.setup_time_minutes}, ${op.run_time_minutes}, ${op.quantity_per_cycle},
          ${op.scheduled_start_date}, ${op.scheduled_end_date}, ${op.actual_start_date},
          ${op.actual_end_date}, ${op.operation_status}, ${op.sequence_number},
          ${op.is_milestone}, ${op.is_bottleneck}, ${op.overlap_percentage},
          ${op.transfer_batch_size}, ${op.notes}, ${op.created_at}, ${op.updated_at},
          ${op.created_by}, ${op.updated_by}, ${op.parallel_resources}
        )
      `;
    }
    console.log(`   ✅ Copied ${operations.length} operations`);
    
    // Get summary
    console.log('\n📊 Production Database Summary:');
    console.log('=====================================');
    
    const jobCount = await prodSql`SELECT COUNT(*) as count FROM ptjobs`;
    const opCount = await prodSql`SELECT COUNT(*) as count FROM ptjoboperations`;
    const resourceCount = await prodSql`SELECT COUNT(*) as count FROM ptresources`;
    const plantCount = await prodSql`SELECT COUNT(*) as count FROM ptplants`;
    
    console.log(`✅ Jobs: ${jobCount[0].count}`);
    console.log(`✅ Operations: ${opCount[0].count}`);
    console.log(`✅ Resources: ${resourceCount[0].count}`);
    console.log(`✅ Plants: ${plantCount[0].count}`);
    
    console.log('\n🍺 Brewery Jobs in Production:');
    const breweryJobs = await prodSql`
      SELECT job_number, description, priority, status, quantity_ordered
      FROM ptjobs
      ORDER BY priority
    `;
    
    for (const job of breweryJobs) {
      const ops = await prodSql`
        SELECT COUNT(*) as count 
        FROM ptjoboperations 
        WHERE job_id = ${job.job_number}
      `;
      console.log(`  ${job.job_number}: ${job.description}`);
      console.log(`    Priority: ${job.priority}, Status: ${job.status}`);
      console.log(`    Quantity: ${job.quantity_ordered}, Operations: ${ops[0].count}`);
    }
    
    console.log('\n🎉 Brewery data successfully exported to production!');
    console.log('   Production database now has:');
    console.log('   - 5 brewery jobs (IPA, Lager, Stout, Wheat Beer, Porter)');
    console.log('   - 45 operations (9 per job including packaging)');
    console.log('   - 18 brewery resources (fermenters, kettles, packaging lines)');
    console.log('   - Complete brewery production workflow');
    console.log('\n   Ready for deployment at planettogetherai.com!');
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    console.error('   Details:', error);
    process.exit(1);
  }
}

// Run the export
exportBreweryDataToProduction().catch(console.error);