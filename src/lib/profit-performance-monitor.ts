// src/lib/profit-performance-monitor.ts

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  tenantId?: string;
  orderId?: string;
  cacheHit?: boolean;
  recordCount?: number;
}

class ProfitPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics in memory

  /**
   * Start timing an operation
   */
  startTimer(operation: string): () => PerformanceMetric {
    const startTime = performance.now();
    
    return (metadata: Partial<PerformanceMetric> = {}) => {
      const duration = performance.now() - startTime;
      const metric: PerformanceMetric = {
        operation,
        duration,
        timestamp: Date.now(),
        ...metadata,
      };
      
      this.recordMetric(metric);
      return metric;
    };
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    // Log slow operations
    if (metric.duration > 1000) { // More than 1 second
      console.warn(`Slow profit operation detected:`, {
        operation: metric.operation,
        duration: `${metric.duration.toFixed(2)}ms`,
        tenantId: metric.tenantId,
        orderId: metric.orderId,
        cacheHit: metric.cacheHit,
      });
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getOperationStats(operation: string, timeWindowMs: number = 60000): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    cacheHitRate: number;
    slowOperations: number;
  } {
    const cutoff = Date.now() - timeWindowMs;
    const relevantMetrics = this.metrics.filter(
      m => m.operation === operation && m.timestamp > cutoff
    );
    
    if (relevantMetrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        cacheHitRate: 0,
        slowOperations: 0,
      };
    }
    
    const durations = relevantMetrics.map(m => m.duration);
    const cacheHits = relevantMetrics.filter(m => m.cacheHit === true).length;
    const slowOps = relevantMetrics.filter(m => m.duration > 1000).length;
    
    return {
      count: relevantMetrics.length,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      cacheHitRate: relevantMetrics.length > 0 ? (cacheHits / relevantMetrics.length) * 100 : 0,
      slowOperations: slowOps,
    };
  }

  /**
   * Get overall performance summary
   */
  getOverallStats(timeWindowMs: number = 60000): {
    totalOperations: number;
    avgDuration: number;
    cacheHitRate: number;
    slowOperations: number;
    operationBreakdown: Record<string, number>;
  } {
    const cutoff = Date.now() - timeWindowMs;
    const relevantMetrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    if (relevantMetrics.length === 0) {
      return {
        totalOperations: 0,
        avgDuration: 0,
        cacheHitRate: 0,
        slowOperations: 0,
        operationBreakdown: {},
      };
    }
    
    const durations = relevantMetrics.map(m => m.duration);
    const cacheHits = relevantMetrics.filter(m => m.cacheHit === true).length;
    const slowOps = relevantMetrics.filter(m => m.duration > 1000).length;
    
    // Count operations by type
    const operationBreakdown: Record<string, number> = {};
    relevantMetrics.forEach(m => {
      operationBreakdown[m.operation] = (operationBreakdown[m.operation] || 0) + 1;
    });
    
    return {
      totalOperations: relevantMetrics.length,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      cacheHitRate: (cacheHits / relevantMetrics.length) * 100,
      slowOperations: slowOps,
      operationBreakdown,
    };
  }

  /**
   * Get cache effectiveness metrics
   */
  getCacheEffectiveness(timeWindowMs: number = 60000): {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    avgHitDuration: number;
    avgMissDuration: number;
    timeSaved: number;
  } {
    const cutoff = Date.now() - timeWindowMs;
    const relevantMetrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    const hits = relevantMetrics.filter(m => m.cacheHit === true);
    const misses = relevantMetrics.filter(m => m.cacheHit === false);
    
    const avgHitDuration = hits.length > 0 
      ? hits.reduce((sum, m) => sum + m.duration, 0) / hits.length 
      : 0;
    
    const avgMissDuration = misses.length > 0 
      ? misses.reduce((sum, m) => sum + m.duration, 0) / misses.length 
      : 0;
    
    // Estimate time saved by caching (assuming cache misses represent the "real" calculation time)
    const timeSaved = hits.length * Math.max(0, avgMissDuration - avgHitDuration);
    
    return {
      totalRequests: relevantMetrics.length,
      cacheHits: hits.length,
      cacheMisses: misses.length,
      hitRate: relevantMetrics.length > 0 ? (hits.length / relevantMetrics.length) * 100 : 0,
      avgHitDuration,
      avgMissDuration,
      timeSaved,
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(timeWindowMs?: number): PerformanceMetric[] {
    if (!timeWindowMs) {
      return [...this.metrics];
    }
    
    const cutoff = Date.now() - timeWindowMs;
    return this.metrics.filter(m => m.timestamp > cutoff);
  }
}

// Export singleton instance
export const profitPerformanceMonitor = new ProfitPerformanceMonitor();

// Utility function to wrap async operations with performance monitoring
export function withPerformanceMonitoring<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata: Partial<PerformanceMetric> = {}
): Promise<T> {
  const endTimer = profitPerformanceMonitor.startTimer(operation);
  
  return fn()
    .then(result => {
      endTimer(metadata);
      return result;
    })
    .catch(error => {
      endTimer({ ...metadata, error: true });
      throw error;
    });
}