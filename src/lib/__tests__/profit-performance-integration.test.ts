// src/lib/__tests__/profit-performance-integration.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { profitCalculationService } from '../profit-calculation';
import { profitCache } from '../profit-cache';
import { profitPerformanceMonitor } from '../profit-performance-monitor';
import { profitCacheInvalidation } from '../profit-cache-invalidation';

describe('Profit Performance Integration Tests', () => {
  const mockTenantId = 'test-tenant-123';

  beforeEach(() => {
    profitCache.clearAll();
    profitPerformanceMonitor.clearMetrics();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-End Performance Optimization', () => {
    it('should demonstrate performance improvements with caching', async () => {
      // Mock data for consistent testing
      const mockOrders = Array.from({ length: 100 }, (_, i) => ({
        id: `order-${i}`,
        createdAt: new Date(2024, 0, i + 1),
        status: 'CONFIRMED',
        total: 100 + i,
        quantity: 1,
        discount: 0,
        product: { costPrice: 50 },
        lead: { batch: { costPerLead: 5 } },
        costs: {
          productCost: 50,
          leadCost: 5,
          packagingCost: 2,
          printingCost: 1,
          returnCost: 0,
          totalCosts: 58,
          grossProfit: 50,
          netProfit: 42 + i,
          profitMargin: (42 + i) / (100 + i) * 100,
        },
      }));

      // Mock the database to return our test data
      const mockPrisma = {
        order: {
          findMany: vi.fn().mockResolvedValue(mockOrders),
        },
      };

      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: () => mockPrisma,
      }));

      const params = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        period: 'monthly',
      };

      // First call - should be slow (cache miss)
      const startTime1 = performance.now();
      const result1 = await profitCalculationService.calculatePeriodProfit(params, mockTenantId);
      const duration1 = performance.now() - startTime1;

      // Second call - should be fast (cache hit)
      const startTime2 = performance.now();
      const result2 = await profitCalculationService.calculatePeriodProfit(params, mockTenantId);
      const duration2 = performance.now() - startTime2;

      // Verify results are identical
      expect(result1).toEqual(result2);

      // Verify second call was significantly faster (cache hit)
      expect(duration2).toBeLessThan(duration1 * 0.1); // At least 10x faster

      // Verify cache effectiveness
      const cacheStats = profitPerformanceMonitor.getCacheEffectiveness();
      expect(cacheStats.hitRate).toBeGreaterThan(0);
    });

    it('should handle cache invalidation correctly', async () => {
      const orderId = 'test-order-123';
      const mockProfit = {
        orderId,
        revenue: 100,
        costs: { product: 50, lead: 5, packaging: 2, printing: 1, return: 0, total: 58 },
        grossProfit: 50,
        netProfit: 42,
        profitMargin: 42,
        isReturn: false,
      };

      // Cache the profit
      profitCache.setOrderProfit(orderId, mockTenantId, mockProfit);
      expect(profitCache.getOrderProfit(orderId, mockTenantId)).toEqual(mockProfit);

      // Simulate order update
      profitCacheInvalidation.onOrderUpdated(orderId, mockTenantId, {
        statusChanged: true,
      });

      // Verify cache was invalidated
      expect(profitCache.getOrderProfit(orderId, mockTenantId)).toBeNull();
    });

    it('should optimize database queries for large datasets', async () => {
      // Create a large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `order-${i}`,
        createdAt: new Date(2024, 0, (i % 30) + 1),
        status: i % 10 === 0 ? 'RETURNED' : 'CONFIRMED',
        total: 100 + (i % 100),
        quantity: 1,
        discount: 0,
        product: { costPrice: 50 },
        lead: { batch: { costPerLead: 5 } },
        costs: {
          productCost: 50,
          leadCost: 5,
          packagingCost: 2,
          printingCost: 1,
          returnCost: i % 10 === 0 ? 10 : 0,
          totalCosts: i % 10 === 0 ? 68 : 58,
          grossProfit: 50,
          netProfit: i % 10 === 0 ? 32 : 42,
          profitMargin: i % 10 === 0 ? 32 : 42,
        },
      }));

      const mockPrisma = {
        order: {
          findMany: vi.fn().mockResolvedValue(largeDataset),
        },
      };

      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: () => mockPrisma,
      }));

      const params = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        period: 'daily',
      };

      const startTime = performance.now();
      const result = await profitCalculationService.calculatePeriodProfit(params, mockTenantId);
      const duration = performance.now() - startTime;

      // Verify the query used selective fields
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.any(Object),
        })
      );

      // Verify results are correct
      expect(result.summary.orderCount).toBe(1000);
      expect(result.summary.returnCount).toBe(100); // 10% returns
      expect(result.trends.length).toBeGreaterThan(0);

      // Performance should be reasonable even for large datasets
      expect(duration).toBeLessThan(1000); // Less than 1 second
    });
  });

  describe('Cache Management', () => {
    it('should handle cache size limits', () => {
      const maxEntries = 50;
      
      // Fill cache beyond reasonable size
      for (let i = 0; i < maxEntries + 10; i++) {
        const mockProfit = {
          orderId: `order-${i}`,
          revenue: 100,
          costs: { product: 50, lead: 5, packaging: 2, printing: 1, return: 0, total: 58 },
          grossProfit: 50,
          netProfit: 42,
          profitMargin: 42,
          isReturn: false,
        };
        profitCache.setOrderProfit(`order-${i}`, mockTenantId, mockProfit);
      }

      const stats = profitCache.getStats();
      
      // Cache should manage size appropriately
      expect(stats.orderProfitCache.size).toBeLessThanOrEqual(stats.orderProfitCache.maxSize);
    });

    it('should clean expired entries', () => {
      const mockProfit = {
        orderId: 'test-order',
        revenue: 100,
        costs: { product: 50, lead: 5, packaging: 2, printing: 1, return: 0, total: 58 },
        grossProfit: 50,
        netProfit: 42,
        profitMargin: 42,
        isReturn: false,
      };

      profitCache.setOrderProfit('test-order', mockTenantId, mockProfit);
      
      // Verify entry exists
      expect(profitCache.getOrderProfit('test-order', mockTenantId)).toEqual(mockProfit);

      // Clean expired entries (this would normally be time-based)
      profitCache.cleanExpired();
      
      // Entry should still exist if not expired
      expect(profitCache.getOrderProfit('test-order', mockTenantId)).toEqual(mockProfit);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track comprehensive performance metrics', async () => {
      const mockPrisma = {
        order: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'order1',
              createdAt: new Date(),
              status: 'CONFIRMED',
              total: 100,
              quantity: 1,
              discount: 0,
              product: { costPrice: 50 },
              lead: { batch: { costPerLead: 5 } },
              costs: {
                productCost: 50,
                leadCost: 5,
                packagingCost: 2,
                printingCost: 1,
                returnCost: 0,
                totalCosts: 58,
                grossProfit: 50,
                netProfit: 42,
                profitMargin: 42,
              },
            },
          ]),
        },
      };

      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: () => mockPrisma,
      }));

      // Perform multiple operations
      const params = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        period: 'monthly',
      };

      await profitCalculationService.calculatePeriodProfit(params, mockTenantId);
      await profitCalculationService.calculatePeriodProfit(params, mockTenantId); // Cache hit

      // Check performance metrics
      const overallStats = profitPerformanceMonitor.getOverallStats();
      expect(overallStats.totalOperations).toBeGreaterThan(0);
      expect(overallStats.avgDuration).toBeGreaterThan(0);

      const cacheStats = profitPerformanceMonitor.getCacheEffectiveness();
      expect(cacheStats.totalRequests).toBeGreaterThan(0);
      expect(cacheStats.hitRate).toBeGreaterThan(0);
    });

    it('should identify slow operations', async () => {
      // Mock a slow operation
      const slowMockPrisma = {
        order: {
          findMany: vi.fn().mockImplementation(() => 
            new Promise(resolve => 
              setTimeout(() => resolve([]), 1100) // Simulate 1.1 second delay
            )
          ),
        },
      };

      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: () => slowMockPrisma,
      }));

      const params = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        period: 'monthly',
      };

      await profitCalculationService.calculatePeriodProfit(params, mockTenantId);

      const stats = profitPerformanceMonitor.getOverallStats();
      expect(stats.slowOperations).toBeGreaterThan(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle mixed cache hits and misses efficiently', async () => {
      // Pre-populate some cache entries
      for (let i = 0; i < 5; i++) {
        const mockProfit = {
          orderId: `cached-order-${i}`,
          revenue: 100,
          costs: { product: 50, lead: 5, packaging: 2, printing: 1, return: 0, total: 58 },
          grossProfit: 50,
          netProfit: 42,
          profitMargin: 42,
          isReturn: false,
        };
        profitCache.setOrderProfit(`cached-order-${i}`, mockTenantId, mockProfit);
      }

      // Mock database with mix of cached and non-cached orders
      const mixedOrders = [
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `cached-order-${i}`,
          createdAt: new Date(),
          status: 'CONFIRMED',
          total: 100,
          quantity: 1,
          discount: 0,
          product: { costPrice: 50 },
          lead: { batch: { costPerLead: 5 } },
          costs: null, // Will use cached values
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `new-order-${i}`,
          createdAt: new Date(),
          status: 'CONFIRMED',
          total: 100,
          quantity: 1,
          discount: 0,
          product: { costPrice: 50 },
          lead: { batch: { costPerLead: 5 } },
          costs: {
            productCost: 50,
            leadCost: 5,
            packagingCost: 2,
            printingCost: 1,
            returnCost: 0,
            totalCosts: 58,
            grossProfit: 50,
            netProfit: 42,
            profitMargin: 42,
          },
        })),
      ];

      const mockPrisma = {
        order: {
          findMany: vi.fn().mockResolvedValue(mixedOrders),
        },
      };

      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: () => mockPrisma,
      }));

      const params = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        period: 'monthly',
      };

      const result = await profitCalculationService.calculatePeriodProfit(params, mockTenantId);

      // Should handle both cached and non-cached orders
      expect(result.summary.orderCount).toBe(10);
      expect(result.summary.netProfit).toBe(420); // 10 orders * 42 profit each
    });
  });
});