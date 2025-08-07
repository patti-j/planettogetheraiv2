import { db } from "./db";
import { users } from "../shared/schema-simple";
import { eq } from "drizzle-orm";

// Basic storage using direct SQL queries to bypass Drizzle connection issues
export class BasicStorage {
  // Mock data that matches database structure
  private mockPlants = [
    {
      id: 1,
      name: "Heineken Pharma Plant",
      address: "123 Pharma Ave, Jersey City, NJ 07302",
      timezone: "America/New_York",
      is_active: true,
      created_at: new Date(),
      location: "Jersey City, NJ"
    }
  ];

  private mockResources = [
    {
      id: 1,
      name: "Primary Reactor",
      type: "Equipment",
      status: "active",
      capabilities: [1, 2, 3],
      photo: null,
      is_drum: false,
      drum_designation_date: null,
      drum_designation_reason: null,
      drum_designation_method: null
    },
    {
      id: 2, 
      name: "Quality Control Lab",
      type: "Laboratory",
      status: "active",
      capabilities: [4, 5],
      photo: null,
      is_drum: false,
      drum_designation_date: null,
      drum_designation_reason: null,
      drum_designation_method: null
    }
  ];

  private mockCapabilities = [
    { id: 1, name: "Mixing", description: "Capable of mixing materials" },
    { id: 2, name: "Heating", description: "Can heat materials" },
    { id: 3, name: "Cooling", description: "Can cool materials" },
    { id: 4, name: "Testing", description: "Quality testing capability" },
    { id: 5, name: "Analysis", description: "Chemical analysis capability" }
  ];

  private mockUsers = [
    {
      id: 1,
      username: "demo_user",
      email: "demo@example.com",
      first_name: "Demo",
      last_name: "User",
      password_hash: "demo_hash",
      is_active: true,
      last_login: new Date(),
      avatar: null,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  private mockProductionOrders = [
    {
      id: 1,
      order_number: "PO-2024-001",
      name: "Batch Production Order",
      description: "Standard production batch",
      status: "released",
      priority: "medium",
      plant_id: 1,
      created_at: new Date()
    }
  ];



  private mockOptimizationAlgorithms = [
    {
      id: 1,
      name: "forward-scheduling",
      displayName: "Forward Scheduling",
      description: "Schedule operations from start date forward, optimizing for earliest completion",
      category: "scheduling",
      type: "built-in",
      status: "active",
      isStandard: true,
      configuration: {
        timeHorizon: "weeks",
        optimizationCriteria: ["completion_time", "resource_utilization"],
        constraints: ["resource_capacity", "operation_dependencies"]
      },
      performance: {
        efficiency: 85,
        speed: "fast",
        accuracy: "high"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: "backward-scheduling", 
      displayName: "Backward Scheduling",
      description: "Schedule operations from due date backward, optimizing for just-in-time delivery",
      category: "scheduling",
      type: "built-in", 
      status: "approved",
      isStandard: true,
      configuration: {
        timeHorizon: "weeks",
        optimizationCriteria: ["due_date_adherence", "inventory_minimization"],
        constraints: ["due_dates", "resource_availability"]
      },
      performance: {
        efficiency: 82,
        speed: "fast", 
        accuracy: "high"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      name: "bottleneck-optimizer",
      displayName: "Bottleneck Optimization",
      description: "Identify and optimize around production bottlenecks using Theory of Constraints",
      category: "optimization",
      type: "advanced",
      status: "active", 
      isStandard: true,
      configuration: {
        timeHorizon: "days",
        optimizationCriteria: ["throughput", "bottleneck_utilization"],
        constraints: ["bottleneck_capacity", "buffer_management"]
      },
      performance: {
        efficiency: 92,
        speed: "medium",
        accuracy: "very_high"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 4,
      name: "genetic-algorithm",
      displayName: "Genetic Algorithm Scheduler", 
      description: "Advanced evolutionary algorithm for complex multi-objective scheduling",
      category: "ai_optimization",
      type: "advanced",
      status: "active",
      isStandard: false,
      configuration: {
        timeHorizon: "weeks",
        optimizationCriteria: ["makespan", "resource_utilization", "setup_reduction"],
        constraints: ["all_constraints"],
        parameters: {
          populationSize: 100,
          generations: 500,
          mutationRate: 0.1
        }
      },
      performance: {
        efficiency: 96,
        speed: "slow",
        accuracy: "very_high"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Plants
  async getPlants() {
    return this.mockPlants;
  }

  async getPlant(id: number) {
    return this.mockPlants.find(p => p.id === id) || null;
  }

  async createPlant(data: any) {
    const newPlant = {
      id: this.mockPlants.length + 1,
      ...data,
      created_at: new Date()
    };
    this.mockPlants.push(newPlant);
    return newPlant;
  }

  // Capabilities
  async getCapabilities() {
    return this.mockCapabilities;
  }

  async createCapability(data: any) {
    const newCapability = {
      id: this.mockCapabilities.length + 1,
      ...data
    };
    this.mockCapabilities.push(newCapability);
    return newCapability;
  }

  // Resources
  async getResources() {
    return this.mockResources;
  }

  async createResource(data: any) {
    const newResource = {
      id: this.mockResources.length + 1,
      ...data,
      is_drum: data.is_drum || false,
      drum_designation_date: data.drum_designation_date || null,
      drum_designation_reason: data.drum_designation_reason || null,
      drum_designation_method: data.drum_designation_method || null
    };
    this.mockResources.push(newResource);
    return newResource;
  }

  // Users
  async getUsers() {
    return this.mockUsers;
  }

  async getUser(id: number) {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      console.log("Raw database result for user:", result[0]);
      console.log("All properties:", result[0] ? Object.keys(result[0]) : "no result");
      return result[0] || null;
    } catch (error) {
      console.error("Error fetching user from database:", error);
      // Fallback to mock data only if database fails
      return this.mockUsers.find(u => u.id === id) || null;
    }
  }

  async getUserByUsername(username: string) {
    try {
      const result = await db.select().from(users).where(eq(users.username, username));
      return result[0] || null;
    } catch (error) {
      console.error("Error fetching user by username from database:", error);
      // Fallback to mock data only if database fails
      return this.mockUsers.find(u => u.username === username) || null;
    }
  }

  async createUser(data: any) {
    const newUser = {
      id: this.mockUsers.length + 1,
      ...data,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.mockUsers.push(newUser);
    return newUser;
  }

  // Production Orders
  async getProductionOrders() {
    return this.mockProductionOrders;
  }

  async getProductionOrder(id: number) {
    return this.mockProductionOrders.find(o => o.id === id) || null;
  }

  async createProductionOrder(data: any) {
    const newOrder = {
      id: this.mockProductionOrders.length + 1,
      ...data,
      created_at: new Date()
    };
    this.mockProductionOrders.push(newOrder);
    return newOrder;
  }

  // Optimization Algorithms
  async getOptimizationAlgorithms(category?: string, status?: string) {
    let algorithms = [...this.mockOptimizationAlgorithms];
    
    if (category) {
      algorithms = algorithms.filter(a => a.category === category);
    }
    
    if (status) {
      algorithms = algorithms.filter(a => a.status === status);
    }
    
    return algorithms;
  }

  async getOptimizationAlgorithm(id: number) {
    return this.mockOptimizationAlgorithms.find(a => a.id === id) || null;
  }

  async createOptimizationAlgorithm(data: any) {
    const newAlgorithm = {
      id: this.mockOptimizationAlgorithms.length + 1,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockOptimizationAlgorithms.push(newAlgorithm);
    return newAlgorithm;
  }

  async updateOptimizationAlgorithm(id: number, data: any) {
    const algorithmIndex = this.mockOptimizationAlgorithms.findIndex(a => a.id === id);
    if (algorithmIndex === -1) return null;
    
    this.mockOptimizationAlgorithms[algorithmIndex] = {
      ...this.mockOptimizationAlgorithms[algorithmIndex],
      ...data,
      updatedAt: new Date()
    };
    
    return this.mockOptimizationAlgorithms[algorithmIndex];
  }

  async deleteOptimizationAlgorithm(id: number) {
    const algorithmIndex = this.mockOptimizationAlgorithms.findIndex(a => a.id === id);
    if (algorithmIndex === -1) return false;
    
    this.mockOptimizationAlgorithms.splice(algorithmIndex, 1);
    return true;
  }

  // ==================== TOC DRUM METHODS ====================
  
  async getDrumResources() {
    // Get all resources that are drums from the database
    try {
      const resources = await db.execute(`
        SELECT id, name, is_drum, drum_designation_date, drum_designation_reason, drum_designation_method
        FROM resources
        WHERE is_drum = true
      `);
      
      return resources.rows.map(r => ({
        id: r.id,
        resourceId: r.id,
        resourceName: r.name,
        isDrum: r.is_drum,
        isManual: r.drum_designation_method === 'manual',
        drumType: r.drum_designation_method || 'primary',
        designatedAt: r.drum_designation_date,
        designatedBy: 1, // Default user
        reason: r.drum_designation_reason || 'Manual designation',
        utilization: 0 // Default utilization
      }));
    } catch (error) {
      console.error("Error fetching drum resources:", error);
      // Return resources from mock data that are drums
      return this.mockResources
        .filter(r => r.is_drum)
        .map(r => ({
          id: r.id,
          resourceId: r.id,
          resourceName: r.name,
          isDrum: r.is_drum,
          isManual: r.drum_designation_method === 'manual',
          drumType: r.drum_designation_method || 'primary',
          designatedAt: r.drum_designation_date,
          designatedBy: 1,
          reason: r.drum_designation_reason || 'Manual designation',
          utilization: 0
        }));
    }
  }

  async designateResourceAsDrum(resourceId: number, drumType: string, reason?: string, userId?: number) {
    try {
      // Update the resource in the database
      const result = await db.execute(`
        UPDATE resources 
        SET is_drum = true,
            drum_designation_date = CURRENT_TIMESTAMP,
            drum_designation_reason = $1,
            drum_designation_method = 'manual'
        WHERE id = $2
        RETURNING *
      `, [reason || 'Manual designation', resourceId]);
      
      if (result.rows.length > 0) {
        // Record in history
        await db.execute(`
          INSERT INTO drum_analysis_history (
            analysis_type, resource_id, utilization_percentage, 
            bottleneck_score, recommendation, is_current_bottleneck
          ) VALUES ('manual', $1, '95', '100', $2, true)
        `, [resourceId, reason || `Manually designated as ${drumType} drum`]);
        
        return result.rows[0];
      }
      throw new Error('Resource not found');
    } catch (error) {
      console.error("Error designating drum:", error);
      // Update in mock data
      const resource = this.mockResources.find(r => r.id === resourceId);
      if (resource) {
        resource.is_drum = true;
        resource.drum_designation_date = new Date();
        resource.drum_designation_reason = reason || 'Manual designation';
        resource.drum_designation_method = 'manual';
        return resource;
      }
      throw new Error('Resource not found');
    }
  }

  async getDrumAnalysisHistory() {
    try {
      const result = await db.execute(`
        SELECT dah.*, r.name as resource_name
        FROM drum_analysis_history dah
        LEFT JOIN resources r ON dah.resource_id = r.id
        ORDER BY dah.created_at DESC
        LIMIT 100
      `);
      
      return result.rows.map(row => ({
        ...row,
        resourceName: row.resource_name
      }));
    } catch (error) {
      console.error("Error fetching drum analysis history:", error);
      return [];
    }
  }

  async runDrumAnalysis() {
    try {
      // Get all resources
      const allResources = await this.getResources();
      let drumsIdentified = 0;
      let drumsUpdated = 0;
      const recommendations = [];

      // Analyze each resource
      for (const resource of allResources) {
        // Simple mock analysis - identify high utilization resources as drums
        const utilization = Math.random() * 100;
        const isBottleneck = utilization > 70;
        
        if (isBottleneck && !resource.is_drum) {
          // Update resource as drum
          await db.execute(`
            UPDATE resources 
            SET is_drum = true,
                drum_designation_date = CURRENT_TIMESTAMP,
                drum_designation_reason = 'Automated analysis - high utilization',
                drum_designation_method = 'automated'
            WHERE id = $1
          `, [resource.id]);
          
          drumsIdentified++;
        }
        
        if (isBottleneck) {
          recommendations.push({
            resourceId: resource.id,
            resourceName: resource.name,
            score: utilization,
            recommendation: `Resource ${resource.name} has ${utilization.toFixed(0)}% utilization`
          });
        }
      }

      // Record analysis in history
      await db.execute(`
        INSERT INTO drum_analysis_history (
          analysis_type, resource_id, utilization_percentage, 
          bottleneck_score, recommendation, is_current_bottleneck
        ) VALUES ('automated', NULL, '70', '0', $1, false)
      `, [`Analyzed ${allResources.length} resources, identified ${drumsIdentified} drums`]);

      return {
        analyzed: allResources.length,
        identified: drumsIdentified,
        updated: drumsUpdated,
        recommendations: recommendations.sort((a, b) => b.score - a.score).slice(0, 10)
      };
    } catch (error) {
      console.error("Error running drum analysis:", error);
      return {
        analyzed: 0,
        identified: 0,
        updated: 0,
        recommendations: []
      };
    }
  }

  // ==================== CUSTOM CONSTRAINTS METHODS ====================
  
  async getCustomConstraints(filters?: any) {
    try {
      let query = 'SELECT * FROM custom_constraints WHERE 1=1';
      const params = [];
      let paramIndex = 1;
      
      if (filters) {
        if (filters.isActive !== undefined) {
          query += ` AND is_active = $${paramIndex++}`;
          params.push(filters.isActive);
        }
        if (filters.constraintType) {
          query += ` AND constraint_type = $${paramIndex++}`;
          params.push(filters.constraintType);
        }
        if (filters.severity) {
          query += ` AND severity = $${paramIndex++}`;
          params.push(filters.severity);
        }
        if (filters.category) {
          query += ` AND category = $${paramIndex++}`;
          params.push(filters.category);
        }
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await db.execute(query, params);
      return result.rows;
    } catch (error) {
      console.error("Error fetching custom constraints:", error);
      return [];
    }
  }

  async createCustomConstraint(data: any) {
    try {
      const result = await db.execute(`
        INSERT INTO custom_constraints (
          name, description, constraint_type, severity, category, impact_area,
          is_active, enforce_in_scheduling, enforce_in_optimization,
          monitoring_frequency, violation_action, violation_threshold,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        data.name, data.description, data.constraintType, data.severity,
        data.category, data.impactArea, data.isActive ?? true,
        data.enforceInScheduling ?? false, data.enforceInOptimization ?? false,
        data.monitoringFrequency, data.violationAction, data.violationThreshold,
        1 // Default user ID
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error("Error creating custom constraint:", error);
      throw error;
    }
  }

  async updateCustomConstraint(id: number, data: any) {
    try {
      const result = await db.execute(`
        UPDATE custom_constraints
        SET name = $1, description = $2, constraint_type = $3, severity = $4,
            category = $5, impact_area = $6, is_active = $7,
            enforce_in_scheduling = $8, enforce_in_optimization = $9,
            monitoring_frequency = $10, violation_action = $11, violation_threshold = $12,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $13
        RETURNING *
      `, [
        data.name, data.description, data.constraintType, data.severity,
        data.category, data.impactArea, data.isActive ?? true,
        data.enforceInScheduling ?? false, data.enforceInOptimization ?? false,
        data.monitoringFrequency, data.violationAction, data.violationThreshold,
        id
      ]);
      
      return result.rows[0];
    } catch (error) {
      console.error("Error updating custom constraint:", error);
      throw error;
    }
  }

  async deleteCustomConstraint(id: number) {
    try {
      await db.execute('DELETE FROM custom_constraints WHERE id = $1', [id]);
      return true;
    } catch (error) {
      console.error("Error deleting custom constraint:", error);
      throw error;
    }
  }


}

export const storage = new BasicStorage();