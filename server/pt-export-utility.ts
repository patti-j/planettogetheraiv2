import { DatabaseStorage } from './storage';
import { format } from 'date-fns';

interface PTExportOptions {
  includeHistoricalData: boolean;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  plantIds?: number[];
  orderStatusFilter?: string[];
  exportFormat: 'sql' | 'csv' | 'json';
}

interface PTExportResult {
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  exportPath?: string;
  duration: number;
}

export class PTExportUtility {
  constructor(private storage: DatabaseStorage) {}

  async exportToPlanetTogether(options: PTExportOptions): Promise<PTExportResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsProcessed = 0;

    try {
      console.log('🚀 Starting PT Export Process...');
      
      // 1. Export Plants (Simple mapping)
      await this.exportPlants();
      recordsProcessed += await this.getRecordCount('pt_plants');

      // 2. Export Resources (Medium complexity)
      await this.exportResources();
      recordsProcessed += await this.getRecordCount('pt_resources');

      // 3. Export Capabilities
      await this.exportCapabilities();
      recordsProcessed += await this.getRecordCount('pt_capabilities');

      // 4. Export Items from Production Versions (Complex)
      await this.exportItems();
      recordsProcessed += await this.getRecordCount('pt_items');

      // 5. Export Routings from Recipes (Very Complex)
      await this.exportRoutings();
      recordsProcessed += await this.getRecordCount('pt_routings');

      // 6. Export Orders (Complex - status mapping)
      await this.exportOrders(options);
      recordsProcessed += await this.getRecordCount('pt_orders');

      // 7. Export Operations (Complex - time calculations)
      await this.exportOperations();
      recordsProcessed += await this.getRecordCount('pt_operations');

      // 8. Generate missing setup tables (Derived data)
      await this.generateSetupTables();
      
      console.log('✅ PT Export completed successfully');
      
      return {
        success: true,
        recordsProcessed,
        errors,
        duration: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ PT Export failed:', error);
      errors.push(`Export failed: ${error.message}`);
      
      return {
        success: false,
        recordsProcessed,
        errors,
        duration: Date.now() - startTime
      };
    }
  }

  // Simple mapping - Plants
  private async exportPlants(): Promise<void> {
    console.log('📍 Exporting Plants...');
    
    const plants = await this.storage.executeQuery(`
      SELECT 
        id,
        name,
        location,
        address,
        city,
        state,
        country,
        timezone,
        is_active
      FROM plants 
      WHERE is_active = true
    `);

    for (const plant of plants) {
      await this.storage.executeQuery(`
        INSERT INTO pt_plants (
          external_id,
          name,
          description,
          address,
          city,
          state,
          country,
          time_zone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (external_id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          country = EXCLUDED.country,
          time_zone = EXCLUDED.time_zone
      `, [
        `PLANT_${plant.id}`,
        plant.name,
        plant.location,
        plant.address,
        plant.city,
        plant.state,
        plant.country,
        plant.timezone
      ]);
    }
  }

  // Medium complexity - Resources with capabilities
  private async exportResources(): Promise<void> {
    console.log('🏭 Exporting Resources...');
    
    const resources = await this.storage.executeQuery(`
      SELECT 
        r.id,
        r.name,
        r.type,
        r.status,
        r.capabilities,
        pr.plant_id,
        p.name as plant_name
      FROM resources r
      LEFT JOIN plant_resources pr ON r.id = pr.resource_id
      LEFT JOIN plants p ON pr.plant_id = p.id
      WHERE r.status = 'active'
    `);

    for (const resource of resources) {
      // Map resource types to PT format
      const ptResourceType = this.mapResourceType(resource.type);
      
      await this.storage.executeQuery(`
        INSERT INTO pt_resources (
          plant_external_id,
          department_external_id,
          external_id,
          name,
          description,
          resource_type,
          can_be_split,
          can_be_helped,
          capacity_type,
          efficiency_percentage
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (plant_external_id, department_external_id, external_id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          resource_type = EXCLUDED.resource_type
      `, [
        `PLANT_${resource.plant_id || 1}`,
        'PRODUCTION', // Default department
        `RES_${resource.id}`,
        resource.name,
        `${resource.type} - ${resource.plant_name || 'Main Plant'}`,
        ptResourceType,
        'true', // Can be split
        'true', // Can be helped
        'Finite', // Capacity type
        100 // Efficiency percentage
      ]);
    }
  }

  // Simple mapping - Capabilities
  private async exportCapabilities(): Promise<void> {
    console.log('💪 Exporting Capabilities...');
    
    const capabilities = await this.storage.executeQuery(`
      SELECT 
        id,
        name,
        description,
        type,
        is_active
      FROM capabilities 
      WHERE is_active = true
    `);

    for (const capability of capabilities) {
      await this.storage.executeQuery(`
        INSERT INTO pt_capabilities (
          external_id,
          name,
          description,
          capability_type
        ) VALUES ($1, $2, $3, $4)
        ON CONFLICT (external_id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description
      `, [
        `CAP_${capability.id}`,
        capability.name,
        capability.description,
        capability.type || 'Skill'
      ]);
    }
  }

  // Complex mapping - Items from production versions and recipes
  private async exportItems(): Promise<void> {
    console.log('📦 Exporting Items...');
    
    const items = await this.storage.executeQuery(`
      SELECT DISTINCT
        pv.id as version_id,
        pv.item_number,
        pv.item_description,
        pv.version_number,
        pv.is_active,
        pv.plant_id,
        r.id as recipe_id,
        r.name as recipe_name,
        r.recipe_type,
        r.batch_size,
        r.yield_quantity
      FROM production_versions pv
      LEFT JOIN recipes r ON pv.recipe_id = r.id
      WHERE pv.is_active = true
    `);

    for (const item of items) {
      await this.storage.executeQuery(`
        INSERT INTO pt_items (
          plant_external_id,
          external_id,
          name,
          description,
          item_type,
          uom,
          active,
          routing_external_id,
          default_lot_size,
          planning_time_fence
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (plant_external_id, external_id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          active = EXCLUDED.active
      `, [
        `PLANT_${item.plant_id}`,
        `${item.item_number}_V${item.version_number}`,
        item.item_number,
        item.item_description,
        item.recipe_type || 'Manufactured',
        'EA', // Default unit of measure
        item.is_active,
        `ROUTE_${item.recipe_id}`,
        item.batch_size || 1,
        7 // Default planning time fence in days
      ]);
    }
  }

  // Very complex mapping - Routings from recipes and operations
  private async exportRoutings(): Promise<void> {
    console.log('🗺️ Exporting Routings...');
    
    const routings = await this.storage.executeQuery(`
      SELECT 
        r.id,
        r.name,
        r.recipe_type,
        r.version_number,
        r.is_active,
        r.plant_id,
        COUNT(ro.id) as operation_count
      FROM recipes r
      LEFT JOIN recipe_operations ro ON r.id = ro.recipe_id
      WHERE r.is_active = true
      GROUP BY r.id, r.name, r.recipe_type, r.version_number, r.is_active, r.plant_id
    `);

    for (const routing of routings) {
      await this.storage.executeQuery(`
        INSERT INTO pt_routings (
          plant_external_id,
          external_id,
          name,
          description,
          routing_type,
          active,
          version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (plant_external_id, external_id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          active = EXCLUDED.active
      `, [
        `PLANT_${routing.plant_id}`,
        `ROUTE_${routing.id}`,
        routing.name,
        `${routing.recipe_type} routing with ${routing.operation_count} operations`,
        routing.recipe_type || 'Production',
        routing.is_active,
        routing.version_number
      ]);

      // Export routing operations
      await this.exportRoutingOperations(routing.id);
    }
  }

  private async exportRoutingOperations(recipeId: number): Promise<void> {
    const operations = await this.storage.executeQuery(`
      SELECT 
        ro.id,
        ro.recipe_id,
        ro.operation_name,
        ro.description,
        ro.sequence_number,
        ro.setup_time_minutes,
        ro.run_time_per_unit_seconds,
        ro.cleanup_time_minutes,
        ro.minimum_transfer_quantity,
        ro.operation_type,
        r.plant_id
      FROM recipe_operations ro
      JOIN recipes r ON ro.recipe_id = r.id
      WHERE ro.recipe_id = $1
      ORDER BY ro.sequence_number
    `, [recipeId]);

    for (const operation of operations) {
      await this.storage.executeQuery(`
        INSERT INTO pt_routing_operations (
          plant_external_id,
          routing_external_id,
          external_id,
          name,
          description,
          sequence_number,
          setup_minutes,
          run_minutes_per_unit,
          cleanup_minutes,
          minimum_transfer_quantity,
          operation_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (plant_external_id, routing_external_id, external_id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          sequence_number = EXCLUDED.sequence_number
      `, [
        `PLANT_${operation.plant_id}`,
        `ROUTE_${operation.recipe_id}`,
        `OP_${operation.id}`,
        operation.operation_name,
        operation.description,
        operation.sequence_number,
        operation.setup_time_minutes || 0,
        (operation.run_time_per_unit_seconds || 0) / 60, // Convert to minutes
        operation.cleanup_time_minutes || 0,
        operation.minimum_transfer_quantity || 1,
        operation.operation_type || 'Process'
      ]);
    }
  }

  // Complex mapping - Orders with status translation
  private async exportOrders(options: PTExportOptions): Promise<void> {
    console.log('📋 Exporting Orders...');
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (options.orderStatusFilter?.length) {
      whereClause += ` AND po.status = ANY($${params.length + 1})`;
      params.push(options.orderStatusFilter);
    }

    if (options.dateRangeStart) {
      whereClause += ` AND po.due_date >= $${params.length + 1}`;
      params.push(options.dateRangeStart);
    }

    if (options.dateRangeEnd) {
      whereClause += ` AND po.due_date <= $${params.length + 1}`;
      params.push(options.dateRangeEnd);
    }

    const orders = await this.storage.executeQuery(`
      SELECT 
        po.id,
        po.order_number,
        po.name,
        po.description,
        po.status,
        po.priority,
        po.quantity,
        po.due_date,
        po.item_number,
        po.plant_id,
        pv.recipe_id
      FROM production_orders po
      LEFT JOIN production_versions pv ON po.production_version_id = pv.id
      ${whereClause}
      ORDER BY po.due_date
    `, params);

    for (const order of orders) {
      const ptStatus = this.mapOrderStatus(order.status);
      const ptPriority = this.mapOrderPriority(order.priority);

      await this.storage.executeQuery(`
        INSERT INTO pt_orders (
          plant_external_id,
          external_id,
          name,
          description,
          item_external_id,
          routing_external_id,
          quantity,
          due_date,
          order_status,
          priority,
          order_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (plant_external_id, external_id) DO UPDATE SET
          name = EXCLUDED.name,
          quantity = EXCLUDED.quantity,
          due_date = EXCLUDED.due_date,
          order_status = EXCLUDED.order_status
      `, [
        `PLANT_${order.plant_id}`,
        order.order_number,
        order.name,
        order.description,
        order.item_number,
        `ROUTE_${order.recipe_id}`,
        order.quantity,
        order.due_date,
        ptStatus,
        ptPriority,
        'Production'
      ]);
    }
  }

  // Complex mapping - Operations with timing calculations
  private async exportOperations(): Promise<void> {
    console.log('⚙️ Exporting Operations...');
    
    const operations = await this.storage.executeQuery(`
      SELECT 
        do.id,
        do.operation_name,
        do.status,
        do.standard_duration,
        do.actual_duration,
        do.start_time,
        do.end_time,
        do.sequence_number,
        do.priority,
        do.completion_percentage,
        po.order_number,
        po.plant_id,
        r.name as resource_name
      FROM discrete_operations do
      LEFT JOIN production_orders po ON do.production_order_id = po.id
      LEFT JOIN resources r ON do.work_center_id = r.id
      WHERE do.status IN ('scheduled', 'in_progress', 'completed')
    `);

    for (const operation of operations) {
      const ptStatus = this.mapOperationStatus(operation.status);
      
      await this.storage.executeQuery(`
        INSERT INTO pt_operations (
          plant_external_id,
          order_external_id,
          routing_external_id,
          routing_operation_external_id,
          external_id,
          name,
          operation_status,
          sequence_number,
          planned_start_date,
          planned_end_date,
          actual_start_date,
          actual_end_date,
          setup_duration_minutes,
          run_duration_minutes,
          quantity_completed,
          quantity_scrapped
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (plant_external_id, external_id) DO UPDATE SET
          operation_status = EXCLUDED.operation_status,
          actual_start_date = EXCLUDED.actual_start_date,
          actual_end_date = EXCLUDED.actual_end_date
      `, [
        `PLANT_${operation.plant_id}`,
        operation.order_number,
        'ROUTE_DEFAULT', // Would need to be calculated from recipe
        `OP_${operation.id}`,
        `DISCRETE_OP_${operation.id}`,
        operation.operation_name,
        ptStatus,
        operation.sequence_number,
        operation.start_time,
        operation.end_time,
        operation.actual_start_date,
        operation.actual_end_date,
        0, // Setup duration
        operation.standard_duration || 0,
        operation.completion_percentage || 0,
        0 // Quantity scrapped
      ]);
    }
  }

  // Generate derived setup tables from existing data
  private async generateSetupTables(): Promise<void> {
    console.log('🔧 Generating Setup Tables...');
    
    // Create basic setup table from operation attributes
    await this.storage.executeQuery(`
      INSERT INTO pt_setup_tables (name, description)
      VALUES ('DEFAULT_SETUP', 'Generated setup table from recipe operations')
      ON CONFLICT (name) DO NOTHING
    `);

    // Generate setup matrix from recipe operations
    const setupData = await this.storage.executeQuery(`
      SELECT DISTINCT
        ro1.operation_name as from_operation,
        ro2.operation_name as to_operation,
        COALESCE(ro2.setup_time_minutes, 30) as setup_minutes
      FROM recipe_operations ro1
      CROSS JOIN recipe_operations ro2
      WHERE ro1.recipe_id = ro2.recipe_id
        AND ro1.sequence_number < ro2.sequence_number
      ORDER BY ro1.operation_name, ro2.operation_name
    `);

    for (const setup of setupData) {
      await this.storage.executeQuery(`
        INSERT INTO pt_setup_table_from_to (
          table_name,
          from_external_id,
          to_external_id,
          setup_minutes,
          setup_cost
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (table_name, from_external_id, to_external_id) DO UPDATE SET
          setup_minutes = EXCLUDED.setup_minutes
      `, [
        'DEFAULT_SETUP',
        setup.from_operation,
        setup.to_operation,
        setup.setup_minutes,
        setup.setup_minutes * 1.50 // Estimated cost per minute
      ]);
    }
  }

  // Helper methods for status mapping
  private mapResourceType(type: string): string {
    const typeMap: Record<string, string> = {
      'assembly_line': 'Production Line',
      'mixer': 'Mixing Equipment',
      'packaging_line': 'Packaging Line',
      'quality_lab': 'Quality Control',
      'storage_tank': 'Storage',
      'reactor': 'Process Equipment'
    };
    return typeMap[type] || 'General Equipment';
  }

  private mapOrderStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'planned': 'Planned',
      'released': 'Released',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'on_hold': 'On Hold',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || 'Planned';
  }

  private mapOrderPriority(priority: number): string {
    if (priority >= 9) return 'Critical';
    if (priority >= 7) return 'High';
    if (priority >= 5) return 'Medium';
    if (priority >= 3) return 'Low';
    return 'Normal';
  }

  private mapOperationStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'scheduled': 'Scheduled',
      'in_progress': 'In Progress', 
      'completed': 'Completed',
      'on_hold': 'On Hold',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || 'Scheduled';
  }

  private async getRecordCount(tableName: string): Promise<number> {
    const result = await this.storage.executeQuery(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result[0]?.count || '0');
  }
}

// Export function to be called from API
export async function exportManufacturingDataToPT(
  storage: DatabaseStorage,
  options: PTExportOptions = {
    includeHistoricalData: true,
    exportFormat: 'sql',
    orderStatusFilter: ['planned', 'released', 'in_progress']
  }
): Promise<PTExportResult> {
  const exporter = new PTExportUtility(storage);
  return await exporter.exportToPlanetTogether(options);
}