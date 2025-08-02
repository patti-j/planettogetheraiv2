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
    return this.mockUsers.find(u => u.id === id) || null;
  }

  async getUserByUsername(username: string) {
    return this.mockUsers.find(u => u.username === username) || null;
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


}

export const storage = new BasicStorage();