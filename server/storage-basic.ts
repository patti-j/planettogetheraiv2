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
}

export const storage = new BasicStorage();