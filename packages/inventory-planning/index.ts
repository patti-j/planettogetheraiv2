// Inventory Planning Module with Database Integration
import type { 
  InventoryPlanningContract,
  InventoryItem,
  ApiResponse
} from '../shared-components/contracts/module-contracts';
import { ptTables, checkDatabaseHealth } from '../shared-components/database';

class InventoryPlanningModule implements InventoryPlanningContract {
  private name = 'inventory-planning';
  private stockCallbacks: Array<(item: InventoryItem) => void> = [];
  private reorderCallbacks: Array<(alert: any) => void> = [];
  // Store inventory in memory (since no inventory tables exist)
  private inventoryItems: Map<number, InventoryItem> = new Map();
  private transactions: any[] = [];
  private nextItemId = 1;
  private pollingInterval: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    console.log('[InventoryPlanning] Module initializing...');
    
    // Check database connection
    const isHealthy = await checkDatabaseHealth();
    if (!isHealthy) {
      console.error('[InventoryPlanning] Database connection failed');
      throw new Error('Failed to connect to database');
    }
    
    console.log('[InventoryPlanning] Database connected successfully');
    
    // Initialize mock inventory data
    await this.initializeInventoryData();
    
    // Start polling for inventory changes
    this.startInventoryPolling();
    
    console.log('[InventoryPlanning] Module initialized');
  }

  async destroy(): Promise<void> {
    console.log('[InventoryPlanning] Module destroying...');
    
    // Stop polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.stockCallbacks = [];
    this.reorderCallbacks = [];
    this.inventoryItems.clear();
    this.transactions = [];
    console.log('[InventoryPlanning] Module destroyed');
  }

  // Inventory Management
  async getInventoryItems(plantId?: number): Promise<ApiResponse<InventoryItem[]>> {
    try {
      let items = Array.from(this.inventoryItems.values());
      
      if (plantId) {
        items = items.filter(item => item.plantId === plantId);
      }
      
      return { success: true, data: items };
    } catch (error) {
      console.error('[InventoryPlanning] Error fetching inventory:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch inventory' 
      };
    }
  }

  async updateInventoryLevel(itemId: number, quantity: number, reason: string): Promise<ApiResponse<InventoryItem>> {
    try {
      const item = this.inventoryItems.get(itemId);
      
      if (!item) {
        return { success: false, error: 'Item not found' };
      }
      
      const oldQuantity = item.quantityOnHand;
      item.quantityOnHand = quantity;
      item.updatedAt = new Date();
      
      // Record transaction
      const transaction = {
        id: this.transactions.length + 1,
        itemId,
        itemName: item.itemName,
        type: quantity > oldQuantity ? 'receipt' : 'issue',
        quantity: Math.abs(quantity - oldQuantity),
        reason,
        timestamp: new Date(),
        beforeQuantity: oldQuantity,
        afterQuantity: quantity
      };
      
      this.transactions.push(transaction);
      
      // Check for reorder alert
      if (quantity <= item.reorderPoint) {
        this.notifyReorderAlert({
          itemId,
          itemName: item.itemName,
          currentQuantity: quantity,
          reorderPoint: item.reorderPoint,
          reorderQuantity: item.reorderQuantity,
          message: `Low stock alert: ${item.itemName} has reached reorder point`,
          severity: quantity <= item.safetyStock ? 'critical' : 'warning',
          timestamp: new Date()
        });
      }
      
      // Notify stock change
      this.notifyStockChange(item);
      
      return { success: true, data: item };
    } catch (error) {
      console.error('[InventoryPlanning] Error updating inventory:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update inventory' 
      };
    }
  }

  async getInventoryTransactions(itemId?: number, dateRange?: any): Promise<ApiResponse<any[]>> {
    try {
      let transactions = [...this.transactions];
      
      if (itemId) {
        transactions = transactions.filter(t => t.itemId === itemId);
      }
      
      if (dateRange) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        transactions = transactions.filter(t => 
          t.timestamp >= start && t.timestamp <= end
        );
      }
      
      // Sort by timestamp descending
      transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      return { success: true, data: transactions };
    } catch (error) {
      console.error('[InventoryPlanning] Error fetching transactions:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch transactions' 
      };
    }
  }

  // Demand Forecasting
  async getDemandForecast(itemId: number, horizon: number): Promise<ApiResponse<any>> {
    try {
      const item = this.inventoryItems.get(itemId);
      
      if (!item) {
        return { success: false, error: 'Item not found' };
      }
      
      // Get historical consumption from transactions
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentTransactions = this.transactions.filter(t => 
        t.itemId === itemId && 
        t.type === 'issue' && 
        t.timestamp >= thirtyDaysAgo
      );
      
      // Calculate average daily consumption
      const totalConsumption = recentTransactions.reduce((sum, t) => sum + t.quantity, 0);
      const avgDailyConsumption = totalConsumption / 30;
      
      // Generate forecast
      const forecast = [];
      for (let i = 1; i <= horizon; i++) {
        const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
        forecast.push({
          date,
          predictedDemand: Math.round(avgDailyConsumption * (1 + Math.random() * 0.2 - 0.1)), // ±10% variation
          confidence: 0.85 - (i * 0.01) // Confidence decreases over time
        });
      }
      
      return { 
        success: true, 
        data: {
          itemId,
          itemName: item.itemName,
          horizon,
          avgDailyConsumption,
          forecast
        }
      };
    } catch (error) {
      console.error('[InventoryPlanning] Error generating forecast:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate forecast' 
      };
    }
  }

  async updateForecast(itemId: number, forecast: any[]): Promise<ApiResponse<any>> {
    // For now, just log the forecast update
    console.log(`[InventoryPlanning] Forecast updated for item ${itemId}:`, forecast);
    return { success: true, data: { itemId, forecast } };
  }

  // Stock Planning
  async getReorderRecommendations(plantId: number): Promise<ApiResponse<any[]>> {
    try {
      const items = Array.from(this.inventoryItems.values())
        .filter(item => item.plantId === plantId);
      
      const recommendations = [];
      
      for (const item of items) {
        if (item.quantityOnHand <= item.reorderPoint) {
          // Calculate lead time demand
          const forecast = await this.getDemandForecast(item.id, item.leadTimeDays || 7);
          const leadTimeDemand = forecast.data?.avgDailyConsumption * (item.leadTimeDays || 7);
          
          // Calculate recommended order quantity
          const recommendedQuantity = Math.max(
            item.reorderQuantity,
            leadTimeDemand + item.safetyStock - item.quantityOnHand
          );
          
          recommendations.push({
            itemId: item.id,
            itemName: item.itemName,
            currentQuantity: item.quantityOnHand,
            reorderPoint: item.reorderPoint,
            recommendedQuantity: Math.round(recommendedQuantity),
            urgency: item.quantityOnHand <= item.safetyStock ? 'critical' : 'normal',
            estimatedStockoutDays: item.quantityOnHand / (forecast.data?.avgDailyConsumption || 1)
          });
        }
      }
      
      // Sort by urgency
      recommendations.sort((a, b) => {
        if (a.urgency === 'critical' && b.urgency !== 'critical') return -1;
        if (b.urgency === 'critical' && a.urgency !== 'critical') return 1;
        return a.estimatedStockoutDays - b.estimatedStockoutDays;
      });
      
      return { success: true, data: recommendations };
    } catch (error) {
      console.error('[InventoryPlanning] Error generating recommendations:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate recommendations' 
      };
    }
  }

  async calculateSafetyStock(itemId: number): Promise<ApiResponse<number>> {
    try {
      const item = this.inventoryItems.get(itemId);
      
      if (!item) {
        return { success: false, error: 'Item not found' };
      }
      
      // Get forecast to calculate demand variability
      const forecast = await this.getDemandForecast(itemId, 30);
      const avgDemand = forecast.data?.avgDailyConsumption || 0;
      
      // Simple safety stock formula: (Max daily usage × Max lead time) - (Average daily usage × Average lead time)
      const maxDailyUsage = avgDemand * 1.5; // Assume 50% higher than average
      const maxLeadTime = (item.leadTimeDays || 7) * 1.2; // Assume 20% longer than average
      const avgLeadTime = item.leadTimeDays || 7;
      
      const safetyStock = Math.round(
        (maxDailyUsage * maxLeadTime) - (avgDemand * avgLeadTime)
      );
      
      // Update item safety stock
      item.safetyStock = safetyStock;
      item.updatedAt = new Date();
      
      return { success: true, data: safetyStock };
    } catch (error) {
      console.error('[InventoryPlanning] Error calculating safety stock:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to calculate safety stock' 
      };
    }
  }

  // Events
  onStockLevelChange(callback: (item: InventoryItem) => void): () => void {
    this.stockCallbacks.push(callback);
    return () => {
      const index = this.stockCallbacks.indexOf(callback);
      if (index > -1) this.stockCallbacks.splice(index, 1);
    };
  }

  onReorderAlert(callback: (alert: any) => void): () => void {
    this.reorderCallbacks.push(callback);
    return () => {
      const index = this.reorderCallbacks.indexOf(callback);
      if (index > -1) this.reorderCallbacks.splice(index, 1);
    };
  }

  // Private methods
  private async initializeInventoryData() {
    try {
      // Get manufacturing orders to create inventory items
      const orders = await ptTables.getManufacturingOrders();
      
      // Create inventory items based on unique items in orders
      const itemMap = new Map<string, any>();
      
      orders.forEach(order => {
        const itemName = order.itemName || 'Unknown Item';
        if (!itemMap.has(itemName)) {
          itemMap.set(itemName, {
            id: this.nextItemId++,
            itemName,
            itemNumber: `ITEM-${this.nextItemId}`,
            description: order.description || '',
            plantId: order.plantId,
            quantityOnHand: Math.round(Math.random() * 1000) + 100,
            quantityAvailable: Math.round(Math.random() * 800) + 50,
            quantityOnOrder: Math.round(Math.random() * 200),
            unitOfMeasure: order.unitOfMeasure || 'EA',
            unitCost: Math.random() * 100 + 10,
            reorderPoint: Math.round(Math.random() * 100) + 50,
            reorderQuantity: Math.round(Math.random() * 500) + 100,
            safetyStock: Math.round(Math.random() * 50) + 25,
            leadTimeDays: Math.round(Math.random() * 14) + 3,
            location: `WH-${Math.floor(Math.random() * 5) + 1}`,
            category: 'Raw Material',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      });
      
      // Add items to inventory
      itemMap.forEach(item => {
        this.inventoryItems.set(item.id, item);
      });
      
      console.log(`[InventoryPlanning] Initialized ${this.inventoryItems.size} inventory items`);
    } catch (error) {
      console.error('[InventoryPlanning] Error initializing inventory data:', error);
    }
  }

  private startInventoryPolling() {
    // Poll for inventory changes every 20 seconds
    this.pollingInterval = setInterval(async () => {
      try {
        // Simulate random inventory consumption
        const items = Array.from(this.inventoryItems.values());
        
        if (items.length > 0) {
          // Randomly select an item to consume
          const randomItem = items[Math.floor(Math.random() * items.length)];
          
          // Random consumption between 1-10 units
          const consumption = Math.floor(Math.random() * 10) + 1;
          
          if (randomItem.quantityOnHand > consumption) {
            await this.updateInventoryLevel(
              randomItem.id,
              randomItem.quantityOnHand - consumption,
              'Production consumption'
            );
          }
        }
      } catch (error) {
        console.error('[InventoryPlanning] Polling error:', error);
      }
    }, 20000);
  }

  private notifyStockChange(item: InventoryItem) {
    this.stockCallbacks.forEach(callback => {
      try {
        callback(item);
      } catch (error) {
        console.error('[InventoryPlanning] Error in stock callback:', error);
      }
    });
  }

  private notifyReorderAlert(alert: any) {
    this.reorderCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('[InventoryPlanning] Error in reorder callback:', error);
      }
    });
  }
}

// Export singleton instance
export const inventoryPlanningModule = new InventoryPlanningModule();
export default inventoryPlanningModule;