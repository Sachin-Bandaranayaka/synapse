// src/lib/profit-cache.ts

import { ProfitBreakdown, PeriodProfitReport } from './profit-calculation';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface ProfitCacheConfig {
  orderProfitTTL: number; // TTL for individual order profit calculations
  reportTTL: number; // TTL for profit reports
  maxCacheSize: number; // Maximum number of entries to keep in memory
}

class ProfitCache {
  private orderProfitCache = new Map<string, CacheEntry<ProfitBreakdown>>();
  private reportCache = new Map<string, CacheEntry<PeriodProfitReport>>();
  private defaultCostsCache = new Map<string, CacheEntry<{ packagingCost: number; printingCost: number; returnCost: number }>>();
  
  private config: ProfitCacheConfig = {
    orderProfitTTL: 5 * 60 * 1000, // 5 minutes for order profits
    reportTTL: 15 * 60 * 1000, // 15 minutes for reports
    maxCacheSize: 1000, // Maximum 1000 entries per cache
  };

  /**
   * Get cached order profit breakdown
   */
  getOrderProfit(orderId: string, tenantId: string): ProfitBreakdown | null {
    const key = `${tenantId}:${orderId}`;
    const entry = this.orderProfitCache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if entry has expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.orderProfitCache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Cache order profit breakdown
   */
  setOrderProfit(orderId: string, tenantId: string, profit: ProfitBreakdown): void {
    const key = `${tenantId}:${orderId}`;
    
    // Implement LRU eviction if cache is full
    if (this.orderProfitCache.size >= this.config.maxCacheSize) {
      this.evictOldestEntries(this.orderProfitCache, Math.floor(this.config.maxCacheSize * 0.1));
    }
    
    this.orderProfitCache.set(key, {
      data: profit,
      timestamp: Date.now(),
      ttl: this.config.orderProfitTTL,
    });
  }

  /**
   * Get cached profit report
   */
  getReport(reportKey: string): PeriodProfitReport | null {
    const entry = this.reportCache.get(reportKey);
    
    if (!entry) {
      return null;
    }
    
    // Check if entry has expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.reportCache.delete(reportKey);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Cache profit report
   */
  setReport(reportKey: string, report: PeriodProfitReport): void {
    // Implement LRU eviction if cache is full
    if (this.reportCache.size >= this.config.maxCacheSize) {
      this.evictOldestEntries(this.reportCache, Math.floor(this.config.maxCacheSize * 0.1));
    }
    
    this.reportCache.set(reportKey, {
      data: report,
      timestamp: Date.now(),
      ttl: this.config.reportTTL,
    });
  }

  /**
   * Get cached default costs for tenant
   */
  getDefaultCosts(tenantId: string): { packagingCost: number; printingCost: number; returnCost: number } | null {
    const entry = this.defaultCostsCache.get(tenantId);
    
    if (!entry) {
      return null;
    }
    
    // Default costs have longer TTL (30 minutes) as they change less frequently
    if (Date.now() > entry.timestamp + (30 * 60 * 1000)) {
      this.defaultCostsCache.delete(tenantId);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Cache default costs for tenant
   */
  setDefaultCosts(tenantId: string, costs: { packagingCost: number; printingCost: number; returnCost: number }): void {
    this.defaultCostsCache.set(tenantId, {
      data: costs,
      timestamp: Date.now(),
      ttl: 30 * 60 * 1000, // 30 minutes
    });
  }

  /**
   * Invalidate order profit cache when order is updated
   */
  invalidateOrderProfit(orderId: string, tenantId: string): void {
    const key = `${tenantId}:${orderId}`;
    this.orderProfitCache.delete(key);
    
    // Also invalidate related reports (this is a simple approach - could be more sophisticated)
    this.invalidateReportsForTenant(tenantId);
  }

  /**
   * Invalidate all reports for a tenant
   */
  invalidateReportsForTenant(tenantId: string): void {
    // Remove all report cache entries that contain this tenant
    for (const [key, _] of this.reportCache.entries()) {
      if (key.includes(tenantId)) {
        this.reportCache.delete(key);
      }
    }
  }

  /**
   * Invalidate default costs cache when tenant config is updated
   */
  invalidateDefaultCosts(tenantId: string): void {
    this.defaultCostsCache.delete(tenantId);
    // Also invalidate order profits as they depend on default costs
    this.invalidateOrderProfitsForTenant(tenantId);
  }

  /**
   * Invalidate all order profits for a tenant
   */
  private invalidateOrderProfitsForTenant(tenantId: string): void {
    for (const [key, _] of this.orderProfitCache.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        this.orderProfitCache.delete(key);
      }
    }
  }

  /**
   * Generate cache key for profit reports
   */
  generateReportKey(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    period: string,
    filters: {
      productId?: string;
      userId?: string;
      status?: string;
    } = {}
  ): string {
    const filterStr = Object.entries(filters)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}:${value}`)
      .sort()
      .join(',');
    
    return `${tenantId}:${startDate.toISOString()}:${endDate.toISOString()}:${period}:${filterStr}`;
  }

  /**
   * Evict oldest entries from cache
   */
  private evictOldestEntries<T>(cache: Map<string, CacheEntry<T>>, count: number): void {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      cache.delete(entries[i][0]);
    }
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.orderProfitCache.clear();
    this.reportCache.clear();
    this.defaultCostsCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      orderProfitCache: {
        size: this.orderProfitCache.size,
        maxSize: this.config.maxCacheSize,
      },
      reportCache: {
        size: this.reportCache.size,
        maxSize: this.config.maxCacheSize,
      },
      defaultCostsCache: {
        size: this.defaultCostsCache.size,
      },
    };
  }

  /**
   * Clean expired entries from all caches
   */
  cleanExpired(): void {
    const now = Date.now();
    
    // Clean order profit cache
    for (const [key, entry] of this.orderProfitCache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.orderProfitCache.delete(key);
      }
    }
    
    // Clean report cache
    for (const [key, entry] of this.reportCache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.reportCache.delete(key);
      }
    }
    
    // Clean default costs cache
    for (const [key, entry] of this.defaultCostsCache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.defaultCostsCache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const profitCache = new ProfitCache();

// Set up periodic cleanup of expired entries
if (typeof window === 'undefined') {
  // Only run cleanup on server side
  setInterval(() => {
    profitCache.cleanExpired();
  }, 5 * 60 * 1000); // Clean every 5 minutes
}