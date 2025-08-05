// Phase 2 Step 4: Message Queuing & Inter-Service Communication
// Infrastructure Scaling - Real-time Updates & Event-Driven Architecture

import { cacheManager } from './redis';

// Message types for manufacturing ERP
export enum MessageType {
  PRODUCTION_UPDATE = 'production_update',
  INVENTORY_CHANGE = 'inventory_change',
  QUALITY_ALERT = 'quality_alert',
  RESOURCE_STATUS = 'resource_status',
  SCHEDULE_CHANGE = 'schedule_change',
  SYSTEM_NOTIFICATION = 'system_notification',
  USER_ACTION = 'user_action',
  MAINTENANCE_ALERT = 'maintenance_alert'
}

// Message priority levels
export enum MessagePriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4
}

// Message interface
export interface Message {
  id: string;
  type: MessageType;
  priority: MessagePriority;
  channel: string;
  data: any;
  timestamp: Date;
  sender?: string;
  recipients?: string[];
  persistent: boolean;
  ttl?: number; // time to live in seconds
}

// Subscription interface
interface Subscription {
  channel: string;
  callback: (message: Message) => void;
  filter?: (message: Message) => boolean;
}

// Message queue manager
export class MessageQueueManager {
  private subscriptions = new Map<string, Subscription[]>();
  private messageHistory = new Map<string, Message[]>();
  private readonly MAX_HISTORY = 1000;

  constructor() {
    console.log('📨 Message Queue: Real-time messaging system initialized');
  }

  // Publish message to a channel
  public async publish(
    channel: string,
    type: MessageType,
    data: any,
    priority: MessagePriority = MessagePriority.NORMAL,
    options: {
      sender?: string;
      recipients?: string[];
      persistent?: boolean;
      ttl?: number;
    } = {}
  ): Promise<string> {
    const message: Message = {
      id: this.generateMessageId(),
      type,
      priority,
      channel,
      data,
      timestamp: new Date(),
      sender: options.sender,
      recipients: options.recipients,
      persistent: options.persistent || false,
      ttl: options.ttl
    };

    // Store message in history if persistent
    if (message.persistent) {
      await this.storeMessage(message);
    }

    // Add to in-memory history
    this.addToHistory(channel, message);

    // Deliver to subscribers
    await this.deliverMessage(message);

    console.log(`📤 Message Queue: Published ${type} to ${channel} (Priority: ${priority})`);
    return message.id;
  }

  // Subscribe to a channel
  public subscribe(
    channel: string,
    callback: (message: Message) => void,
    filter?: (message: Message) => boolean
  ): string {
    const subscription: Subscription = {
      channel,
      callback,
      filter
    };

    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, []);
    }

    this.subscriptions.get(channel)!.push(subscription);
    
    const subscriptionId = this.generateSubscriptionId();
    console.log(`📬 Message Queue: Subscribed to ${channel}`);
    
    return subscriptionId;
  }

  // Unsubscribe from a channel
  public unsubscribe(channel: string, callback: (message: Message) => void): boolean {
    const subscriptions = this.subscriptions.get(channel);
    if (!subscriptions) return false;

    const index = subscriptions.findIndex(sub => sub.callback === callback);
    if (index === -1) return false;

    subscriptions.splice(index, 1);
    
    if (subscriptions.length === 0) {
      this.subscriptions.delete(channel);
    }

    console.log(`📭 Message Queue: Unsubscribed from ${channel}`);
    return true;
  }

  // Get message history for a channel
  public getHistory(channel: string, limit: number = 50): Message[] {
    const history = this.messageHistory.get(channel) || [];
    return history.slice(-limit).reverse();
  }

  // Get all active channels
  public getChannels(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  // Get subscription count for a channel
  public getSubscriberCount(channel: string): number {
    return this.subscriptions.get(channel)?.length || 0;
  }

  // Deliver message to subscribers
  private async deliverMessage(message: Message): Promise<void> {
    const subscriptions = this.subscriptions.get(message.channel);
    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    const deliveryPromises = subscriptions.map(async (subscription) => {
      try {
        // Apply filter if exists
        if (subscription.filter && !subscription.filter(message)) {
          return;
        }

        // Check if message is for specific recipients
        if (message.recipients && message.recipients.length > 0) {
          // Only deliver if subscription matches recipient criteria
          // For now, we'll deliver to all subscribers
        }

        // Deliver message
        subscription.callback(message);
        
      } catch (error) {
        console.error(`Message delivery error for ${message.channel}:`, error);
      }
    });

    await Promise.all(deliveryPromises);
  }

  // Store persistent message
  private async storeMessage(message: Message): Promise<void> {
    try {
      const key = `message:${message.channel}:${message.id}`;
      await cacheManager.cacheQueryResult(key, message, message.ttl || 86400); // 24 hours default
    } catch (error) {
      console.error('Failed to store persistent message:', error);
    }
  }

  // Add message to in-memory history
  private addToHistory(channel: string, message: Message): void {
    if (!this.messageHistory.has(channel)) {
      this.messageHistory.set(channel, []);
    }

    const history = this.messageHistory.get(channel)!;
    history.push(message);

    // Maintain history limit
    if (history.length > this.MAX_HISTORY) {
      history.splice(0, history.length - this.MAX_HISTORY);
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Get system statistics
  public getStats(): {
    channels: number;
    totalSubscriptions: number;
    messagesInHistory: number;
    channelStats: Array<{ channel: string; subscribers: number; messages: number }>;
  } {
    const channelStats = Array.from(this.subscriptions.keys()).map(channel => ({
      channel,
      subscribers: this.getSubscriberCount(channel),
      messages: this.messageHistory.get(channel)?.length || 0
    }));

    return {
      channels: this.subscriptions.size,
      totalSubscriptions: Array.from(this.subscriptions.values())
        .reduce((total, subs) => total + subs.length, 0),
      messagesInHistory: Array.from(this.messageHistory.values())
        .reduce((total, history) => total + history.length, 0),
      channelStats
    };
  }
}

// Specific messaging services for manufacturing
export class ManufacturingMessageService {
  constructor(private messageQueue: MessageQueueManager) {}

  // Production status updates
  public publishProductionUpdate(data: {
    orderId: number;
    status: string;
    progress: number;
    estimatedCompletion?: Date;
  }): Promise<string> {
    return this.messageQueue.publish(
      'production.updates',
      MessageType.PRODUCTION_UPDATE,
      data,
      MessagePriority.HIGH,
      { persistent: true }
    );
  }

  // Inventory level changes
  public publishInventoryChange(data: {
    itemId: number;
    previousLevel: number;
    newLevel: number;
    threshold?: number;
    location?: string;
  }): Promise<string> {
    const priority = data.newLevel <= (data.threshold || 0) 
      ? MessagePriority.CRITICAL 
      : MessagePriority.NORMAL;

    return this.messageQueue.publish(
      'inventory.changes',
      MessageType.INVENTORY_CHANGE,
      data,
      priority,
      { persistent: true }
    );
  }

  // Quality alerts
  public publishQualityAlert(data: {
    testId: number;
    productId: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    actionRequired?: string;
  }): Promise<string> {
    const priorityMap = {
      low: MessagePriority.LOW,
      medium: MessagePriority.NORMAL,
      high: MessagePriority.HIGH,
      critical: MessagePriority.CRITICAL
    };

    return this.messageQueue.publish(
      'quality.alerts',
      MessageType.QUALITY_ALERT,
      data,
      priorityMap[data.severity],
      { persistent: true }
    );
  }

  // Resource status updates
  public publishResourceStatus(data: {
    resourceId: number;
    status: 'available' | 'busy' | 'maintenance' | 'offline';
    utilizationPercent?: number;
    nextAvailable?: Date;
  }): Promise<string> {
    const priority = data.status === 'offline' 
      ? MessagePriority.HIGH 
      : MessagePriority.NORMAL;

    return this.messageQueue.publish(
      'resources.status',
      MessageType.RESOURCE_STATUS,
      data,
      priority
    );
  }

  // Schedule changes
  public publishScheduleChange(data: {
    type: 'added' | 'modified' | 'cancelled';
    orderId: number;
    originalDate?: Date;
    newDate?: Date;
    reason?: string;
  }): Promise<string> {
    return this.messageQueue.publish(
      'schedule.changes',
      MessageType.SCHEDULE_CHANGE,
      data,
      MessagePriority.HIGH,
      { persistent: true }
    );
  }

  // System notifications
  public publishSystemNotification(data: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    targetUsers?: string[];
    actionUrl?: string;
  }): Promise<string> {
    const priorityMap = {
      info: MessagePriority.LOW,
      success: MessagePriority.NORMAL,
      warning: MessagePriority.HIGH,
      error: MessagePriority.CRITICAL
    };

    return this.messageQueue.publish(
      'system.notifications',
      MessageType.SYSTEM_NOTIFICATION,
      data,
      priorityMap[data.type],
      { recipients: data.targetUsers }
    );
  }
}

// Real-time dashboard service
export class DashboardUpdateService {
  constructor(private messageQueue: MessageQueueManager) {
    this.setupDashboardChannels();
  }

  private setupDashboardChannels(): void {
    // Subscribe to various data changes to update dashboards
    this.messageQueue.subscribe('production.updates', (message) => {
      this.broadcastDashboardUpdate('production-dashboard', message.data);
    });

    this.messageQueue.subscribe('inventory.changes', (message) => {
      this.broadcastDashboardUpdate('inventory-dashboard', message.data);
    });

    this.messageQueue.subscribe('quality.alerts', (message) => {
      this.broadcastDashboardUpdate('quality-dashboard', message.data);
    });

    this.messageQueue.subscribe('resources.status', (message) => {
      this.broadcastDashboardUpdate('resource-dashboard', message.data);
    });
  }

  private async broadcastDashboardUpdate(dashboard: string, data: any): Promise<void> {
    await this.messageQueue.publish(
      `dashboard.${dashboard}`,
      MessageType.SYSTEM_NOTIFICATION,
      {
        type: 'dashboard_update',
        dashboard,
        data,
        timestamp: new Date()
      },
      MessagePriority.NORMAL
    );
  }

  // Subscribe to dashboard updates
  public subscribeToDashboard(
    dashboard: string, 
    callback: (data: any) => void
  ): string {
    return this.messageQueue.subscribe(
      `dashboard.${dashboard}`,
      (message) => callback(message.data),
      (message) => message.data.type === 'dashboard_update'
    );
  }
}

// Export singleton instances
export const messageQueueManager = new MessageQueueManager();
export const manufacturingMessageService = new ManufacturingMessageService(messageQueueManager);
export const dashboardUpdateService = new DashboardUpdateService(messageQueueManager);