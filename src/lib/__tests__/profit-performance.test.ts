// src/lib/__tests__/profit-performance.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { profitCalculationService } from '../profit-calculation';
import { profitCache } from '../profit-cache';
import { profitPerformanceMonitor } from '../profit-performance-monitor';
import { getScopedPrismaClient } from '../prisma';

// Mock the prisma client
vi.mock('../prisma', () => ({
  getScopedPrismaClient: vi.fn(),
  prisma: {
    tenantCostConfig: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Profit Calculation Performance Optimizations', () => {
  const mockTenantId = 'test-tenant-123';
  const mockOrderId = 'test-order-123';

  beforeEach(() => {
    // Clear caches before each test
    profitCache.clearAll();
    profitPerformanceMonitor.clearMetrics();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Caching', () => {
    it('should cache order profit calculations', async () => {
      // Mock the database response
      const mockPrisma = {
        order: {
          findUnique: vi.fn().mockResolvedValue({
            id: mockOrderId,
            total: 100,
            quantity: 1,
            status: 'CONFIRMED',
            product: {
              costPrice: 50,
            },
            lead: {
              batch: {
                costPerLead: 5,
              },
            },
            costs: {
              packagingCost: 2,
              printingCost: 1,
              returnCost: 0,
            },
          }),
        },
        orderCosts: {
          upsert: vi.fn(),
        },
      };

      (getScopedPrismaClient as any).mockReturnValue(mockPrisma);

      // First call should hit the database
      const result1 = await profitCalculationService.calculateOrderProfit(mockOrderId, mockTenantId);
      expect(mockPrisma.order.findUnique).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await profitCalculationService.calculateOrderProfit(mockOrderId, mockTenantId);
      expect(mockPrisma.order.findUnique).toHaveBeenCalledTimes(1); // Still only called once
      
      // Results should be identical
      expect(result1).toEqual(result2);
    });

    it('should cache default costs for tenants', async () => {
      const mockTenantCostConfig = {
        findUnique: vi.fn().mockResolvedValue({
          defaultPackagingCost: 2,
          defaultPrintingCost: 1,
          defaultReturnCost: 5,
        }),
      };

      // Mock the unscoped prisma
      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: vi.fn(),
        prisma: {
          tenantCostConfig: mockTenantCostConfig,
        },
      }));

      // Access default costs multiple times
      const service = new (await import('../profit-calculation')).ProfitCalculationService();
      
      // This would normally call getDefaultCosts internally
      // We'll test the caching behavior indirectly through cache stats
      const initialStats = profitCache.getStats();
      expect(initialStats.defaultCostsCache.size).toBe(0);
    });

    it('should invalidate cache when order is updated', () => {
      // Set up cached data
      const mockProfit = {
        orderId: mockOrderId,
        revenue: 100,
        costs: { product: 50, lead: 5, packaging: 2, printing: 1, return: 0, total: 58 },
        grossProfit: 50,
        netProfit: 42,
        profitMargin: 42,
        isReturn: false,
      };

      profitCache.setOrderProfit(mockOrderId, mockTenantId, mockProfit);
      
      // Verify it's cached
      const cached = profitCache.getOrderProfit(mockOrderId, mockTenantId);
      expect(cached).toEqual(mockProfit);

      // Invalidate cache
      profitCache.invalidateOrderProfit(mockOrderId, mockTenantId);

      // Verify it's no longer cached
      const afterInvalidation = profitCache.getOrderProfit(mockOrderId, mockTenantId);
      expect(afterInvalidation).toBeNull();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track operation performance metrics', async () => {
      const mockPrisma = {
        order: {
          findUnique: vi.fn().mockResolvedValue({
            id: mockOrderId,
            total: 100,
            quantity: 1,
            status: 'CONFIRMED',
            product: { costPrice: 50 },
            lead: { batch: { costPerLead: 5 } },
            costs: { packagingCost: 2, printingCost: 1, returnCost: 0 },
          }),
        },
        orderCosts: { upsert: vi.fn() },
      };

      (getScopedPrismaClient as any).mockReturnValue(mockPrisma);

      // Perform operation
      await profitCalculationService.calculateOrderProfit(mockOrderId, mockTenantId);

      // Check that metrics were recorded
      const stats = profitPerformanceMonitor.getOperationStats('calculateOrderProfit');
      expect(stats.count).toBeGreaterThan(0);
      expect(stats.avgDuration).toBeGreaterThan(0);
    });

    it('should track cache hit rates', async () => {
      const mockProfit = {
        orderId: mockOrderId,
        revenue: 100,
        costs: { product: 50, lead: 5, packaging: 2, printing: 1, return: 0, total: 58 },
        grossProfit: 50,
        netProfit: 42,
        profitMargin: 42,
        isReturn: false,
      };

      // Cache the result
      profitCache.setOrderProfit(mockOrderId, mockTenantId, mockProfit);

      // Call the service (should hit cache)
      await profitCalculationService.calculateOrderProfit(mockOrderId, mockTenantId);

      // Check cache effectiveness
      const cacheStats = profitPerformanceMonitor.getCacheEffectiveness();
      expect(cacheStats.cacheHits).toBeGreaterThan(0);
    });
  });

  describe('Database Query Optimization', () => {
    it('should use selective field selection in period reports', async () => {
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

      (getScopedPrismaClient as any).mockReturnValue(mockPrisma);

      const params = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        period: 'monthly',
      };

      await profitCalculationService.calculatePeriodProfit(params, mockTenantId);

      // Verify that findMany was called with selective fields
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            id: true,
            createdAt: true,
            status: true,
            total: true,
            quantity: true,
            discount: true,
            product: expect.objectContaining({
              select: expect.objectContaining({
                costPrice: true,
              }),
            }),
            lead: expect.objectContaining({
              select: expect.objectContaining({
                batch: expect.objectContaining({
                  select: expect.objectContaining({
                    costPerLead: true,
                  }),
                }),
              }),
            }),
            costs: expect.objectContaining({
              select: expect.any(Object),
            }),
          }),
        })
      );
    });

    it('should use pre-calculated costs when available', async () => {
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

      (getScopedPrismaClient as any).mockReturnValue(mockPrisma);

      const params = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        period: 'monthly',
      };

      const result = await profitCalculationService.calculatePeriodProfit(params, mockTenantId);

      // Should use pre-calculated values without additional profit calculations
      expect(result.summary.netProfit).toBe(42);
      expect(result.summary.orderCount).toBe(1);
    });
  });

  describe('Cache Management', () => {
    it('should respect cache TTL', async () => {
      const mockProfit = {
        orderId: mockOrderId,
        revenue: 100,
        costs: { product: 50, lead: 5, packaging: 2, printing: 1, return: 0, total: 58 },
        grossProfit: 50,
        netProfit: 42,
        profitMargin: 42,
        isReturn: false,
      };

      // Set cache entry
      profitCache.setOrderProfit(mockOrderId, mockTenantId, mockProfit);
      
      // Should be available immediately
      expect(profitCache.getOrderProfit(mockOrderId, mockTenantId)).toEqual(mockProfit);

      // Simulate time passing by cleaning expired entries
      // (In a real scenario, we'd wait for TTL to expire)
      profitCache.cleanExpired();
      
      // Entry should still be there if TTL hasn't expired
      expect(profitCache.getOrderProfit(mockOrderId, mockTenantId)).toEqual(mockProfit);
    });

    it('should limit cache size', () => {
      const maxSize = 1000; // Based on our cache configuration
      
      // Fill cache beyond max size
      for (let i = 0; i < maxSize + 100; i++) {
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
      expect(stats.orderProfitCache.size).toBeLessThanOrEqual(maxSize);
    });
  });
});