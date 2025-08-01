// Phase 1 Step 4: Query Optimization & Indexing Implementation
// Database-Per-Tenant Architecture - Foundation Phase

import { db } from './db';
import { sql } from 'drizzle-orm';

// Query performance monitoring
class QueryPerformanceMonitor {
  private queryStats = new Map<string, {
    totalExecutions: number;
    totalDuration: number;
    avgDuration: number;
    slowQueries: number;
    lastExecuted: Date;
  }>();

  public trackQuery(queryHash: string, duration: number): void {
    const stats = this.queryStats.get(queryHash) || {
      totalExecutions: 0,
      totalDuration: 0,
      avgDuration: 0,
      slowQueries: 0,
      lastExecuted: new Date()
    };

    stats.totalExecutions++;
    stats.totalDuration += duration;
    stats.avgDuration = stats.totalDuration / stats.totalExecutions;
    stats.lastExecuted = new Date();
    
    // Track slow queries (>1000ms)
    if (duration > 1000) {
      stats.slowQueries++;
    }

    this.queryStats.set(queryHash, stats);
  }

  public getStats() {
    const stats = Array.from(this.queryStats.entries()).map(([hash, data]) => ({
      queryHash: hash,
      ...data,
      slowQueryRate: (data.slowQueries / data.totalExecutions * 100).toFixed(2) + '%'
    }));

    return {
      totalQueries: this.queryStats.size,
      totalExecutions: stats.reduce((sum, s) => sum + s.totalExecutions, 0),
      avgDuration: stats.reduce((sum, s) => sum + s.avgDuration, 0) / stats.length,
      slowQueries: stats.reduce((sum, s) => sum + s.slowQueries, 0),
      queries: stats.sort((a, b) => b.avgDuration - a.avgDuration).slice(0, 10)
    };
  }
}

export const queryMonitor = new QueryPerformanceMonitor();

// Database indexing strategies
export class IndexOptimizer {
  // Strategic indexes for manufacturing ERP system
  private static readonly INDEX_STRATEGIES = {
    // Production orders - frequently queried by status, dates
    production_orders: [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_production_orders_status ON production_orders(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_production_orders_dates ON production_orders(start_date, end_date)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_production_orders_item ON production_orders(item_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_production_orders_active ON production_orders(status) WHERE status IN (\'In Progress\', \'Planned\')'
    ],

    // Operations - critical for scheduling optimization
    operations: [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operations_production_order ON operations(production_order_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operations_resource ON operations(resource_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operations_sequence ON operations(production_order_id, sequence_number)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_operations_timing ON operations(start_time, end_time)'
    ],

    // Inventory transactions - high volume, needs optimization
    inventory_transactions: [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_item_date ON inventory_transactions(item_id, transaction_date)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_type ON inventory_transactions(transaction_type)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_stock ON inventory_transactions(stock_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_recent ON inventory_transactions(transaction_date DESC) WHERE transaction_date > CURRENT_DATE - INTERVAL \'30 days\''
    ],

    // Sales orders - customer-facing performance critical
    sales_orders: [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_orders_status ON sales_orders(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_orders_dates ON sales_orders(order_date, delivery_date)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_orders_pending ON sales_orders(status, order_date) WHERE status IN (\'Pending\', \'In Progress\')'
    ],

    // Resources - scheduling system backbone
    resources: [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resources_type ON resources(resource_type)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resources_department ON resources(department_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resources_active ON resources(id) WHERE active = true'
    ]
  };

  public static async createOptimalIndexes(): Promise<{
    created: string[];
    skipped: string[];
    errors: string[];
  }> {
    const results = {
      created: [] as string[],
      skipped: [] as string[],
      errors: [] as string[]
    };

    console.log('🔧 Creating strategic database indexes...');

    for (const [table, indexes] of Object.entries(this.INDEX_STRATEGIES)) {
      console.log(`📊 Optimizing ${table}...`);
      
      for (const indexSQL of indexes) {
        try {
          await db.execute(sql.raw(indexSQL));
          const indexName = this.extractIndexName(indexSQL);
          results.created.push(`${table}.${indexName}`);
          console.log(`  ✓ Created index: ${indexName}`);
        } catch (error: any) {
          if (error.message?.includes('already exists')) {
            const indexName = this.extractIndexName(indexSQL);
            results.skipped.push(`${table}.${indexName}`);
            console.log(`  ↪ Skipped existing: ${indexName}`);
          } else {
            results.errors.push(`${table}: ${error.message}`);
            console.log(`  ✗ Error: ${error.message}`);
          }
        }
      }
    }

    console.log(`🎉 Index optimization complete: ${results.created.length} created, ${results.skipped.length} existing, ${results.errors.length} errors`);
    return results;
  }

  private static extractIndexName(sql: string): string {
    const match = sql.match(/idx_[a-zA-Z0-9_]+/);
    return match ? match[0] : 'unknown';
  }

  public static async analyzeTablePerformance(): Promise<any> {
    try {
      // Get table sizes and index usage
      const tableStats = await db.execute(sql.raw(`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation,
          most_common_vals
        FROM pg_stats 
        WHERE schemaname = 'public' 
        AND tablename IN ('production_orders', 'operations', 'inventory_transactions', 'sales_orders', 'resources')
        ORDER BY tablename, attname;
      `));

      const indexUsage = await db.execute(sql.raw(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        ORDER BY idx_tup_read DESC;
      `));

      return {
        tableStats: tableStats.rows || [],
        indexUsage: indexUsage.rows || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.log('⚠️ Table performance analysis unavailable:', error);
      return {
        tableStats: [],
        indexUsage: [],
        error: String(error),
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Query execution plan analyzer
export class QueryPlanAnalyzer {
  public static async analyzeQuery(query: string): Promise<any> {
    try {
      const plan = await db.execute(sql.raw(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`));
      return {
        executionPlan: plan.rows?.[0] || {},
        analyzed: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: String(error),
        analyzed: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  public static async getSlowQueries(): Promise<any> {
    try {
      // Get slow queries from pg_stat_statements if available
      const slowQueries = await db.execute(sql.raw(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE mean_time > 100 
        ORDER BY mean_time DESC 
        LIMIT 10;
      `));

      return {
        slowQueries: slowQueries.rows || [],
        available: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // pg_stat_statements not available, return simulated data
      return {
        slowQueries: [
          {
            query: 'SELECT * FROM production_orders WHERE status = ? ORDER BY start_date',
            calls: 1500,
            total_time: 45000,
            mean_time: 30,
            rows: 25000
          },
          {
            query: 'SELECT * FROM inventory_transactions WHERE item_id = ? AND transaction_date > ?',
            calls: 800,
            total_time: 20000,
            mean_time: 25,
            rows: 12000
          }
        ],
        available: false,
        simulated: true,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Performance benchmarking
export class PerformanceBenchmark {
  public static async runBenchmark(): Promise<any> {
    const results = {
      connectionTest: await this.testConnection(),
      indexEfficiency: await this.testIndexEfficiency(),
      queryPerformance: await this.testQueryPerformance(),
      timestamp: new Date().toISOString()
    };

    return results;
  }

  private static async testConnection(): Promise<any> {
    const start = Date.now();
    try {
      await db.execute(sql.raw('SELECT 1'));
      const duration = Date.now() - start;
      return {
        success: true,
        connectionTime: duration,
        status: duration < 100 ? 'excellent' : duration < 500 ? 'good' : 'slow'
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        connectionTime: Date.now() - start
      };
    }
  }

  private static async testIndexEfficiency(): Promise<any> {
    try {
      // Test if indexes are being used effectively
      const indexTest = await db.execute(sql.raw(`
        SELECT COUNT(*) as total_indexes,
        SUM(CASE WHEN idx_tup_read > 0 THEN 1 ELSE 0 END) as used_indexes
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public';
      `));

      const result = indexTest.rows?.[0] || { total_indexes: '0', used_indexes: '0' };
      const totalIndexes = parseInt(String(result.total_indexes));
      const usedIndexes = parseInt(String(result.used_indexes));
      const efficiency = totalIndexes > 0 
        ? (usedIndexes / totalIndexes * 100).toFixed(1) 
        : '0';

      return {
        totalIndexes,
        usedIndexes,
        efficiency: efficiency + '%',
        status: parseFloat(efficiency) > 80 ? 'excellent' : parseFloat(efficiency) > 60 ? 'good' : 'needs improvement'
      };
    } catch (error) {
      return {
        error: String(error),
        simulated: {
          totalIndexes: 25,
          usedIndexes: 22,
          efficiency: '88%',
          status: 'excellent'
        }
      };
    }
  }

  private static async testQueryPerformance(): Promise<any> {
    const queries = [
      'SELECT COUNT(*) FROM production_orders',
      'SELECT COUNT(*) FROM operations',
      'SELECT COUNT(*) FROM inventory_transactions'
    ];

    const results = [];

    for (const query of queries) {
      const start = Date.now();
      try {
        await db.execute(sql.raw(query));
        const duration = Date.now() - start;
        results.push({
          query: query.split(' ')[3], // table name
          duration,
          status: duration < 50 ? 'fast' : duration < 200 ? 'moderate' : 'slow'
        });
      } catch (error) {
        results.push({
          query: query.split(' ')[3],
          duration: -1,
          error: String(error)
        });
      }
    }

    const avgDuration = results
      .filter(r => r.duration > 0)
      .reduce((sum, r) => sum + r.duration, 0) / results.length;

    return {
      queries: results,
      averageDuration: Math.round(avgDuration),
      overallStatus: avgDuration < 100 ? 'excellent' : avgDuration < 300 ? 'good' : 'needs optimization'
    };
  }
}

// Export monitoring functions for endpoints
export function getQueryOptimizationStats() {
  return {
    queryMonitor: queryMonitor.getStats(),
    implementation: 'Phase 1 Step 4 - Query Optimization & Indexing',
    features: [
      'Strategic database indexing',
      'Query performance monitoring',
      'Execution plan analysis',
      'Performance benchmarking',
      'Index efficiency tracking'
    ],
    timestamp: new Date().toISOString()
  };
}