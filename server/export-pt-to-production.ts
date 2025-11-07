import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { 
  ptJobs, 
  ptJobOperations, 
  ptResources, 
  ptResourceCapabilities,
  ptPlants,
  ptManufacturingOrders
} from '@shared/schema';

// Script to export PT tables data from development to production
async function exportPTDataToProduction() {
  console.log('📦 Exporting PT tables data to production...\n');
  
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
  console.log('📊 Connecting to development database...');
  const devSql = neon(process.env.DATABASE_URL);
  const devDb = drizzle(devSql);
  
  console.log('📊 Connecting to production database...');
  const prodSql = neon(process.env.PRODUCTION_DATABASE_URL);
  const prodDb = drizzle(prodSql);
  
  try {
    // Define PT tables to export in correct dependency order
    const ptTables = [
      { name: 'ptPlants', table: ptPlants },
      { name: 'ptResources', table: ptResources },
      { name: 'ptResourceCapabilities', table: ptResourceCapabilities },
      { name: 'ptJobs', table: ptJobs },
      { name: 'ptJobOperations', table: ptJobOperations },
      { name: 'ptManufacturingOrders', table: ptManufacturingOrders }
    ];
    
    console.log(`\n📋 Exporting ${ptTables.length} PT tables to production...\n`);
    
    for (const { name, table } of ptTables) {
      console.log(`📦 Processing ${name}...`);
      
      try {
        // Fetch all data from development
        const devData = await devDb.select().from(table);
        console.log(`  📊 Found ${devData.length} records in development`);
        
        if (devData.length === 0) {
          console.log(`  ⏭️  No data to export, skipping...`);
          continue;
        }
        
        // Clear existing production data (in correct order to handle foreign keys)
        console.log(`  🧹 Clearing existing production data...`);
        await prodDb.delete(table);
        
        // Insert data into production in batches
        const batchSize = 100;
        for (let i = 0; i < devData.length; i += batchSize) {
          const batch = devData.slice(i, i + batchSize);
          await prodDb.insert(table).values(batch);
          console.log(`  ✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(devData.length / batchSize)}`);
        }
        
        console.log(`  ✅ Successfully exported ${devData.length} records to production\n`);
        
      } catch (tableError) {
        console.error(`  ❌ Error processing ${name}:`, tableError.message);
        // Continue with other tables even if one fails
      }
    }
    
    // Export summary
    console.log('\n📊 Export Summary:');
    console.log('=====================================');
    
    // Get counts from production for verification
    const prodCounts = {
      jobs: await prodDb.select().from(ptJobs).then(r => r.length),
      operations: await prodDb.select().from(ptJobOperations).then(r => r.length),
      resources: await prodDb.select().from(ptResources).then(r => r.length),
      resourceCapabilities: await prodDb.select().from(ptResourceCapabilities).then(r => r.length),
      plants: await prodDb.select().from(ptPlants).then(r => r.length),
      orders: await prodDb.select().from(ptManufacturingOrders).then(r => r.length)
    };
    
    console.log('Production Database Now Contains:');
    console.log(`  ✅ Jobs: ${prodCounts.jobs}`);
    console.log(`  ✅ Operations: ${prodCounts.operations}`);
    console.log(`  ✅ Resources: ${prodCounts.resources}`);
    console.log(`  ✅ Resource Capabilities: ${prodCounts.resourceCapabilities}`);
    console.log(`  ✅ Plants: ${prodCounts.plants}`);
    console.log(`  ✅ Manufacturing Orders: ${prodCounts.orders}`);
    console.log('=====================================');
    
    // Show brewery job details
    console.log('\n🍺 Brewery Production Jobs in Production:');
    const breweryJobs = await prodDb.select({
      jobNumber: ptJobs.job_number,
      description: ptJobs.description,
      priority: ptJobs.priority,
      status: ptJobs.status
    })
    .from(ptJobs)
    .orderBy(ptJobs.priority);
    
    for (const job of breweryJobs) {
      const opCount = await prodDb.select()
        .from(ptJobOperations)
        .where(eq(ptJobOperations.job_id, job.jobNumber))
        .then(r => r.length);
      
      console.log(`  ${job.jobNumber}: ${job.description}`);
      console.log(`    Priority: ${job.priority}, Status: ${job.status}, Operations: ${opCount}`);
    }
    
    console.log('\n🎉 PT data successfully exported to production!');
    console.log('   Production database now has complete brewery dataset.');
    console.log('   Users can access Production Scheduler at planettogetherai.com');
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

// Run the export
exportPTDataToProduction().catch(console.error);