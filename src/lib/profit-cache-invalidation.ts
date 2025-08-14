// src/lib/profit-cache-invalidation.ts

import { profitCache } from './profit-cache';
import { OrderStatus } from '@prisma/client';

/**
 * Service to handle cache invalidation when profit-related data changes
 */
export class ProfitCacheInvalidationService {
  /**
   * Invalidate caches when an order is created
   */
  onOrderCreated(orderId: string, tenantId: string): void {
    // Invalidate reports for the tenant
    profitCache.invalidateReportsForTenant(tenantId);
  }

  /**
   * Invalidate caches when an order is updated
   */
  onOrderUpdated(orderId: string, tenantId: string, changes: {
    statusChanged?: boolean;
    totalChanged?: boolean;
    quantityChanged?: boolean;
    productChanged?: boolean;
  }): void {
    // Always invalidate the specific order's profit
    profitCache.invalidateOrderProfit(orderId, tenantId);

    // If significant changes occurred, invalidate reports
    if (changes.statusChanged || changes.totalChanged || changes.quantityChanged || changes.productChanged) {
      profitCache.invalidateReportsForTenant(tenantId);
    }
  }

  /**
   * Invalidate caches when order status changes
   */
  onOrderStatusChanged(orderId: string, tenantId: string, oldStatus: OrderStatus, newStatus: OrderStatus): void {
    // Invalidate the specific order's profit
    profitCache.invalidateOrderProfit(orderId, tenantId);

    // Status changes affect reports
    profitCache.invalidateReportsForTenant(tenantId);
  }

  /**
   * Invalidate caches when order costs are manually updated
   */
  onOrderCostsUpdated(orderId: string, tenantId: string): void {
    // Invalidate the specific order's profit
    profitCache.invalidateOrderProfit(orderId, tenantId);

    // Cost changes affect reports
    profitCache.invalidateReportsForTenant(tenantId);
  }

  /**
   * Invalidate caches when a product's cost price is updated
   */
  onProductCostPriceUpdated(productId: string, tenantId: string): void {
    // Product cost changes affect all orders using this product
    // For now, we'll invalidate all order profits for the tenant
    // In a more sophisticated implementation, we could track which orders use which products
    profitCache.invalidateReportsForTenant(tenantId);
    
    // We could also invalidate specific order profits if we had that mapping
    // This is a trade-off between complexity and cache efficiency
  }

  /**
   * Invalidate caches when tenant cost configuration is updated
   */
  onTenantCostConfigUpdated(tenantId: string): void {
    // Default cost changes affect all calculations for the tenant
    profitCache.invalidateDefaultCosts(tenantId);
    profitCache.invalidateReportsForTenant(tenantId);
  }

  /**
   * Invalidate caches when a lead batch is created or updated
   */
  onLeadBatchUpdated(batchId: string, tenantId: string): void {
    // Lead batch cost changes affect all orders from leads in that batch
    // For now, we'll invalidate all reports for the tenant
    profitCache.invalidateReportsForTenant(tenantId);
  }

  /**
   * Invalidate caches when leads are imported with costs
   */
  onLeadsImported(tenantId: string, leadIds: string[]): void {
    // New leads with costs affect future profit calculations
    profitCache.invalidateReportsForTenant(tenantId);
  }

  /**
   * Invalidate caches when an order is deleted
   */
  onOrderDeleted(orderId: string, tenantId: string): void {
    // Remove the specific order from cache
    profitCache.invalidateOrderProfit(orderId, tenantId);

    // Deletion affects reports
    profitCache.invalidateReportsForTenant(tenantId);
  }

  /**
   * Bulk invalidation for data migrations or bulk operations
   */
  onBulkDataChange(tenantId: string): void {
    // Clear all caches for the tenant
    profitCache.invalidateReportsForTenant(tenantId);
    
    // Also clear default costs cache for the tenant
    profitCache.invalidateDefaultCosts(tenantId);
  }

  /**
   * Scheduled cache cleanup (can be called by a cron job)
   */
  performScheduledCleanup(): void {
    profitCache.cleanExpired();
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return profitCache.getStats();
  }
}

// Export singleton instance
export const profitCacheInvalidation = new ProfitCacheInvalidationService();