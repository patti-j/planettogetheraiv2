import Redis from 'ioredis';

// Redis configuration for Phase 1 scaling implementation
const redisConfig: Redis.RedisOptions = {
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxLoadingTimeout: 5000,
  lazyConnect: true,
  // Connection pool settings for scaling
  family: 4,
  keepAlive: true,
  connectTimeout: 5000,
  commandTimeout: 5000,
};

// Create Redis instance with fallback handling
const redis = new Redis(redisConfig);

// In-memory fallback cache for when Redis is unavailable
class InMemoryCache {
  private cache = new Map<string, { value: string; expires: number }>();

  async set(key: string, value: string, ttl: number = 3600): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + (ttl * 1000)
    });
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    keys.forEach(key => {
      if (this.cache.delete(key)) deleted++;
    });
    return deleted;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  getSize(): number {
    return this.cache.size;
  }
}

const memoryCache = new InMemoryCache();

// Redis connection monitoring
redis.on('connect', () => {
  console.log('🔗 Redis: Connected to Redis server');
});

redis.on('ready', () => {
  console.log('✅ Redis: Client ready for operations');
});

redis.on('error', (err) => {
  console.error('❌ Redis: Connection error:', err.message);
});

redis.on('close', () => {
  console.log('🔌 Redis: Connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis: Attempting to reconnect...');
});

// Cache utility functions for Phase 1 implementation
export class CacheManager {
  private redis: Redis;
  private fallback: InMemoryCache;
  private redisAvailable: boolean = false;

  constructor() {
    this.redis = redis;
    this.fallback = memoryCache;
    this.checkRedisConnection();
  }

  private async checkRedisConnection(): Promise<void> {
    try {
      await this.redis.ping();
      this.redisAvailable = true;
      console.log('✅ Redis: Using Redis server for caching');
    } catch (error) {
      this.redisAvailable = false;
      console.log('⚠️  Redis: Using in-memory fallback cache');
    }
  }

  private async getCache() {
    if (this.redisAvailable) {
      try {
        await this.redis.ping();
        return this.redis;
      } catch (error) {
        console.log('🔄 Redis: Switching to fallback cache');
        this.redisAvailable = false;
        return this.fallback;
      }
    }
    return this.fallback;
  }

  // Session caching for improved performance
  async setSession(sessionId: string, sessionData: any, ttl: number = 3600): Promise<void> {
    try {
      const cache = await this.getCache();
      if (cache === this.fallback) {
        await cache.set(`session:${sessionId}`, JSON.stringify(sessionData), ttl);
      } else {
        await (cache as Redis).setex(`session:${sessionId}`, ttl, JSON.stringify(sessionData));
      }
      console.log(`📝 Cache: Session cached for ${sessionId}`);
    } catch (error) {
      console.error('Cache session set error:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<any | null> {
    try {
      const cache = await this.getCache();
      const data = await cache.get(`session:${sessionId}`);
      if (data) {
        console.log(`📖 Cache: Session retrieved for ${sessionId}`);
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Cache session get error:', error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const cache = await this.getCache();
      await cache.del(`session:${sessionId}`);
      console.log(`🗑️ Cache: Session deleted for ${sessionId}`);
    } catch (error) {
      console.error('Cache session delete error:', error);
    }
  }

  // Query result caching for performance optimization
  async cacheQueryResult(key: string, data: any, ttl: number = 300): Promise<void> {
    try {
      const cache = await this.getCache();
      if (cache === this.fallback) {
        await cache.set(`query:${key}`, JSON.stringify(data), ttl);
      } else {
        await (cache as Redis).setex(`query:${key}`, ttl, JSON.stringify(data));
      }
      console.log(`💾 Cache: Query result cached for key ${key}`);
    } catch (error) {
      console.error('Cache query cache error:', error);
    }
  }

  async getCachedQuery(key: string): Promise<any | null> {
    try {
      const cache = await this.getCache();
      const data = await cache.get(`query:${key}`);
      if (data) {
        console.log(`⚡ Cache: Cache hit for query ${key}`);
        return JSON.parse(data);
      }
      console.log(`❌ Cache: Cache miss for query ${key}`);
      return null;
    } catch (error) {
      console.error('Cache query get error:', error);
      return null;
    }
  }

  async invalidateCache(pattern: string): Promise<void> {
    try {
      const cache = await this.getCache();
      const keys = await cache.keys(`query:${pattern}*`);
      if (keys.length > 0) {
        await cache.del(...keys);
        console.log(`🧹 Cache: Invalidated ${keys.length} cache entries for pattern ${pattern}`);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      await this.redis.del(`session:${sessionId}`);
      console.log(`🗑️ Redis: Session deleted for ${sessionId}`);
    } catch (error) {
      console.error('Redis session delete error:', error);
    }
  }

  // Query result caching for performance optimization
  async cacheQueryResult(key: string, data: any, ttl: number = 300): Promise<void> {
    try {
      await this.redis.setex(`query:${key}`, ttl, JSON.stringify(data));
      console.log(`💾 Redis: Query result cached for key ${key}`);
    } catch (error) {
      console.error('Redis query cache error:', error);
    }
  }

  async getCachedQuery(key: string): Promise<any | null> {
    try {
      const data = await this.redis.get(`query:${key}`);
      if (data) {
        console.log(`⚡ Redis: Cache hit for query ${key}`);
        return JSON.parse(data);
      }
      console.log(`❌ Redis: Cache miss for query ${key}`);
      return null;
    } catch (error) {
      console.error('Redis query get error:', error);
      return null;
    }
  }

  async invalidateCache(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`query:${pattern}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`🧹 Redis: Invalidated ${keys.length} cache entries for pattern ${pattern}`);
      }
    } catch (error) {
      console.error('Redis cache invalidation error:', error);
    }
  }

  // System metrics for monitoring
  async getMetrics(): Promise<any> {
    try {
      if (this.redisAvailable) {
        const info = await this.redis.info();
        const keyspace = await this.redis.info('keyspace');
        const memory = await this.redis.info('memory');
        const clients = await this.redis.info('clients');
        
        return {
          connected: this.redis.status === 'ready',
          type: 'redis',
          uptime: this.extractInfoValue(info, 'uptime_in_seconds'),
          totalConnections: this.extractInfoValue(clients, 'total_connections_received'),
          connectedClients: this.extractInfoValue(clients, 'connected_clients'),
          usedMemory: this.extractInfoValue(memory, 'used_memory_human'),
          totalKeys: this.getTotalKeys(keyspace),
          hitRate: await this.calculateHitRate()
        };
      } else {
        return {
          connected: true,
          type: 'in-memory',
          uptime: 'N/A',
          totalConnections: 'N/A',
          connectedClients: 'N/A',
          usedMemory: 'N/A',
          totalKeys: this.fallback.getSize(),
          hitRate: 'N/A'
        };
      }
    } catch (error) {
      console.error('Cache metrics error:', error);
      return { connected: false, error: String(error) };
    }
  }

  private extractInfoValue(info: string, key: string): string {
    const match = info.match(new RegExp(`${key}:(.+)`));
    return match ? match[1].trim() : 'unknown';
  }

  private getTotalKeys(keyspace: string): number {
    const match = keyspace.match(/keys=(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private async calculateHitRate(): Promise<number> {
    try {
      const stats = await this.redis.info('stats');
      const hits = this.extractInfoValue(stats, 'keyspace_hits');
      const misses = this.extractInfoValue(stats, 'keyspace_misses');
      const totalRequests = parseInt(hits) + parseInt(misses);
      return totalRequests > 0 ? (parseInt(hits) / totalRequests) * 100 : 0;
    } catch {
      return 0;
    }
  }

  // Health check for monitoring
  async healthCheck(): Promise<{ status: string; latency?: number; error?: string; type?: string }> {
    try {
      const cache = await this.getCache();
      const start = Date.now();
      await cache.ping();
      const latency = Date.now() - start;
      return { 
        status: 'healthy', 
        latency, 
        type: cache === this.fallback ? 'in-memory' : 'redis' 
      };
    } catch (error) {
      return { status: 'unhealthy', error: String(error) };
    }
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
export default redis;