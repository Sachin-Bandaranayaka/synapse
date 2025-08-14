// src/lib/__tests__/profit-system-integration.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProfitCalculationService } from '../profit-calculation';
import { CostTrackingService } from '../cost-tracking';
import { OrderStatus } from '@prisma/client';

/**
 * Comprehensive integration tests for the complete profit calculation system
 * Tests the full flow from lead import with costs through order processing to profit reporting
 * Validates multi-tenant isolation and all requirements
 */
describe('Profit System Integration Tests', () => {
  let profitService: ProfitCalculationService;
  let costService: CostTrackingService;

  // Mock tenant IDs for multi-tenant testing
  const TENANT_A = 'tenant-a-123';
  const TENANT_B = 'tenant-b-456';
  const USER_ID = 'user-123';

  beforeEach(() => {
    profitService = new ProfitCalculationService();
    costService = new CostTrackingService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Profit Calculation Flow', () => {
    it('should handle complete order lifecycle with all cost components', async () => {
      // This test validates Requirements 1.1, 2.2, 3.1, 3.2, 4.1, 5.1
      
      // Step 1: Create lead batch with acquisition costs (Requirement 2.2)
      const leadBatch = await costService.createLeadBatch({
        totalCost: 100,
        leadCount: 10,
        tenantId: TENANT_A,
        userId: USER_ID
      });

      expect(leadBatch.costPerLead).toBe(10);
      expect(leadBatch.totalCost).toBe(100);
      expect(leadBatch.leadCount).toBe(10);

      // Step 2: Set up tenant default costs (Requirement 7.1, 7.2)
      await costService.updateTenantCostConfig(TENANT_A, {
        defaultPackagingCost: 5,
        defaultPrintingCost: 3,
        defaultReturnCost: 15
      });

      const defaultCosts = await costService.getDefaultCosts(TENANT_A);
      expect(defaultCosts.packagingCost).toBe(5);
      expect(defaultCosts.printingCost).toBe(3);
      expect(defaultCosts.returnCost).toBe(15);

      // Step 3: Mock order data with product cost (Requirement 1.1)
      const mockOrderData = {
        id: 'order-123',
        total: 89.99, // Revenue after discount
        quantity: 1,
        product: {
          id: 'product-123',
          costPrice: 35.00 // Product cost price
        },
        lead: {
          batch: leadBatch,
          assignedTo: USER_ID
        },
        costs: null, // Will use defaults
        status: OrderStatus.CONFIRMED
      };

      // Mock the database calls
      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: vi.fn(() => ({
          order: {
            findUnique: vi.fn().mockResolvedValue(mockOrderData)
          },
          orderCosts: {
            upsert: vi.fn().mockResolvedValue({})
          }
        })),
        prisma: {
          tenantCostConfig: {
            findUnique: vi.fn().mockResolvedValue({
              tenantId: TENANT_A,
              defaultPackagingCost: 5,
              defaultPrintingCost: 3,
              defaultReturnCost: 15
            })
          }
        }
      }));

      // Step 4: Calculate profit breakdown (Requirement 5.1)
      const profitBreakdown = await profitService.calculateOrderProfit('order-123', TENANT_A);

      // Validate profit calculations
      expect(profitBreakdown.revenue).toBe(89.99);
      expect(profitBreakdown.costs.product).toBe(35.00);
      expect(profitBreakdown.costs.lead).toBe(10.00);
      expect(profitBreakdown.costs.packaging).toBe(5.00);
      expect(profitBreakdown.costs.printing).toBe(3.00);
      expect(profitBreakdown.costs.return).toBe(0); // Not returned yet
      expect(profitBreakdown.costs.total).toBe(53.00);
      expect(profitBreakdown.grossProfit).toBe(54.99);
      expect(profitBreakdown.netProfit).toBe(36.99);
      expect(Math.round(profitBreakdown.profitMargin)).toBe(41);

      // Step 5: Process return with return costs (Requirement 4.1, 4.2)
      const returnProfitBreakdown = await profitService.recalculateOnStatusChange(
        'order-123',
        OrderStatus.RETURNED,
        TENANT_A,
        20 // Custom return cost
      );

      expect(returnProfitBreakdown.costs.return).toBe(20);
      expect(returnProfitBreakdown.costs.total).toBe(73.00);
      expect(returnProfitBreakdown.netProfit).toBe(16.99);
      expect(returnProfitBreakdown.isReturn).toBe(true);
    });

    it('should handle manual cost adjustments correctly', async () => {
      // Test Requirement 3.1, 3.3 - manual cost updates
      
      const mockOrder = {
        id: 'order-456',
        total: 150.00,
        quantity: 2,
        product: {
          id: 'product-456',
          costPrice: 25.00
        },
        lead: {
          batch: null, // No lead cost
          assignedTo: USER_ID
        },
        costs: {
          packagingCost: 8,
          printingCost: 4,
          returnCost: 0
        },
        status: OrderStatus.CONFIRMED
      };

      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: vi.fn(() => ({
          order: {
            findUnique: vi.fn().mockResolvedValue(mockOrder)
          },
          orderCosts: {
            upsert: vi.fn().mockResolvedValue({})
          }
        }))
      }));

      // Calculate initial profit
      const initialProfit = await profitService.calculateOrderProfit('order-456', TENANT_A);
      expect(initialProfit.costs.packaging).toBe(8);
      expect(initialProfit.costs.printing).toBe(4);

      // Update costs manually
      const updatedProfit = await profitService.updateOrderCostsManually('order-456', TENANT_A, {
        packagingCost: 12,
        printingCost: 6
      });

      expect(updatedProfit.costs.packaging).toBe(12);
      expect(updatedProfit.costs.printing).toBe(6);
      // Verify profit recalculation
      expect(updatedProfit.netProfit).toBeLessThan(initialProfit.netProfit);
    });
  });

  describe('Multi-Tenant Cost Isolation', () => {
    it('should maintain cost isolation between tenants', async () => {
      // Test Requirement 7.1, 7.2 - tenant-specific configurations
      
      // Set different default costs for each tenant
      await costService.updateTenantCostConfig(TENANT_A, {
        defaultPackagingCost: 5,
        defaultPrintingCost: 3,
        defaultReturnCost: 15
      });

      await costService.updateTenantCostConfig(TENANT_B, {
        defaultPackagingCost: 8,
        defaultPrintingCost: 5,
        defaultReturnCost: 20
      });

      // Verify isolation
      const costsA = await costService.getDefaultCosts(TENANT_A);
      const costsB = await costService.getDefaultCosts(TENANT_B);

      expect(costsA.packagingCost).toBe(5);
      expect(costsA.printingCost).toBe(3);
      expect(costsA.returnCost).toBe(15);

      expect(costsB.packagingCost).toBe(8);
      expect(costsB.printingCost).toBe(5);
      expect(costsB.returnCost).toBe(20);

      // Verify they are different
      expect(costsA.packagingCost).not.toBe(costsB.packagingCost);
      expect(costsA.printingCost).not.toBe(costsB.printingCost);
      expect(costsA.returnCost).not.toBe(costsB.returnCost);
    });

    it('should isolate lead batch costs between tenants', async () => {
      // Test Requirement 2.1, 2.2 - lead batch isolation
      
      // Create lead batches for different tenants
      const batchA = await costService.createLeadBatch({
        totalCost: 200,
        leadCount: 20,
        tenantId: TENANT_A,
        userId: USER_ID
      });

      const batchB = await costService.createLeadBatch({
        totalCost: 300,
        leadCount: 15,
        tenantId: TENANT_B,
        userId: USER_ID
      });

      expect(batchA.costPerLead).toBe(10);
      expect(batchB.costPerLead).toBe(20);

      // Verify tenant isolation
      const batchesA = await costService.getLeadBatches(TENANT_A);
      const batchesB = await costService.getLeadBatches(TENANT_B);

      expect(batchesA.length).toBe(1);
      expect(batchesB.length).toBe(1);
      expect(batchesA[0].batchId).toBe(batchA.batchId);
      expect(batchesB[0].batchId).toBe(batchB.batchId);
      expect(batchesA[0].batchId).not.toBe(batchesB[0].batchId);
    });
  });

  describe('Profit Recalculation Triggers', () => {
    it('should recalculate profit accurately when order status changes', async () => {
      // Test Requirement 4.2, 4.3 - profit recalculation on status changes
      
      const mockOrder = {
        id: 'order-789',
        total: 100.00,
        quantity: 1,
        product: {
          id: 'product-789',
          costPrice: 40.00
        },
        lead: {
          batch: {
            id: 'batch-123',
            costPerLead: 8
          },
          assignedTo: USER_ID
        },
        costs: {
          packagingCost: 5,
          printingCost: 3,
          returnCost: 0
        },
        status: OrderStatus.CONFIRMED
      };

      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: vi.fn(() => ({
          order: {
            findUnique: vi.fn().mockResolvedValue(mockOrder)
          },
          orderCosts: {
            upsert: vi.fn().mockResolvedValue({})
          }
        }))
      }));

      // Initial profit calculation
      const initialProfit = await profitService.calculateOrderProfit('order-789', TENANT_A);
      expect(initialProfit.costs.return).toBe(0);
      expect(initialProfit.netProfit).toBe(44); // 100 - 40 - 8 - 5 - 3 = 44

      // Change status to returned
      mockOrder.status = OrderStatus.RETURNED;
      mockOrder.costs.returnCost = 18;

      const returnProfit = await profitService.recalculateOnStatusChange(
        'order-789',
        OrderStatus.RETURNED,
        TENANT_A,
        18
      );

      expect(returnProfit.costs.return).toBe(18);
      expect(returnProfit.netProfit).toBe(26); // 100 - 40 - 8 - 5 - 3 - 18 = 26
      expect(returnProfit.isReturn).toBe(true);
      expect(returnProfit.profitMargin).toBe(26); // 26/100 * 100 = 26%
    });

    it('should handle multiple status changes correctly', async () => {
      // Test complex status change scenarios
      
      const mockOrder = {
        id: 'order-multi',
        total: 200.00,
        quantity: 1,
        product: {
          id: 'product-multi',
          costPrice: 80.00
        },
        lead: {
          batch: {
            id: 'batch-multi',
            costPerLead: 15
          },
          assignedTo: USER_ID
        },
        costs: {
          packagingCost: 10,
          printingCost: 5,
          returnCost: 0
        },
        status: OrderStatus.PENDING
      };

      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: vi.fn(() => ({
          order: {
            findUnique: vi.fn().mockResolvedValue(mockOrder)
          },
          orderCosts: {
            upsert: vi.fn().mockResolvedValue({})
          }
        }))
      }));

      // PENDING -> CONFIRMED
      mockOrder.status = OrderStatus.CONFIRMED;
      const confirmedProfit = await profitService.recalculateOnStatusChange(
        'order-multi',
        OrderStatus.CONFIRMED,
        TENANT_A
      );
      expect(confirmedProfit.netProfit).toBe(90); // 200 - 80 - 15 - 10 - 5 = 90

      // CONFIRMED -> SHIPPED
      mockOrder.status = OrderStatus.SHIPPED;
      const shippedProfit = await profitService.recalculateOnStatusChange(
        'order-multi',
        OrderStatus.SHIPPED,
        TENANT_A
      );
      expect(shippedProfit.netProfit).toBe(90); // Same as confirmed

      // SHIPPED -> RETURNED
      mockOrder.status = OrderStatus.RETURNED;
      mockOrder.costs.returnCost = 25;
      const returnedProfit = await profitService.recalculateOnStatusChange(
        'order-multi',
        OrderStatus.RETURNED,
        TENANT_A,
        25
      );
      expect(returnedProfit.netProfit).toBe(65); // 200 - 80 - 15 - 10 - 5 - 25 = 65
      expect(returnedProfit.isReturn).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero and negative cost scenarios', async () => {
      // Test Requirement 1.4, 2.4, 3.4, 4.4 - edge cases
      
      // Test zero costs
      const zeroCostBatch = await costService.createLeadBatch({
        totalCost: 0,
        leadCount: 5,
        tenantId: TENANT_A,
        userId: USER_ID
      });
      expect(zeroCostBatch.costPerLead).toBe(0);

      // Test negative cost validation
      await expect(costService.createLeadBatch({
        totalCost: -100,
        leadCount: 5,
        tenantId: TENANT_A,
        userId: USER_ID
      })).rejects.toThrow('Total cost cannot be negative');

      // Test zero lead count
      await expect(costService.createLeadBatch({
        totalCost: 100,
        leadCount: 0,
        tenantId: TENANT_A,
        userId: USER_ID
      })).rejects.toThrow('Lead count must be greater than zero');

      // Test negative cost updates
      await expect(costService.updateOrderCosts('order-123', TENANT_A, {
        packagingCost: -5
      })).rejects.toThrow('Invalid cost values: Packaging cost cannot be negative');
    });

    it('should handle missing data gracefully', async () => {
      // Test fallback mechanisms for missing cost data
      
      const mockOrderWithMissingData = {
        id: 'order-missing',
        total: 50.00,
        quantity: 1,
        product: {
          id: 'product-missing',
          costPrice: 0 // No cost price set
        },
        lead: {
          batch: null, // No lead batch
          assignedTo: USER_ID
        },
        costs: null, // No costs set
        status: OrderStatus.CONFIRMED
      };

      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: vi.fn(() => ({
          order: {
            findUnique: vi.fn().mockResolvedValue(mockOrderWithMissingData)
          },
          orderCosts: {
            upsert: vi.fn().mockResolvedValue({})
          }
        })),
        prisma: {
          tenantCostConfig: {
            findUnique: vi.fn().mockResolvedValue(null) // No default costs
          }
        }
      }));

      const profit = await profitService.calculateOrderProfit('order-missing', TENANT_A);
      
      expect(profit.costs.product).toBe(0);
      expect(profit.costs.lead).toBe(0);
      expect(profit.costs.packaging).toBe(0);
      expect(profit.costs.printing).toBe(0);
      expect(profit.costs.return).toBe(0);
      expect(profit.netProfit).toBe(50); // All revenue since no costs
    });

    it('should handle high-value cost scenarios', async () => {
      // Test very large cost values
      
      const highValueBatch = await costService.createLeadBatch({
        totalCost: 999999.99,
        leadCount: 1,
        tenantId: TENANT_A,
        userId: USER_ID
      });
      expect(highValueBatch.costPerLead).toBe(999999.99);

      // Test high return cost validation
      const mockHighCostOrder = {
        id: 'order-high-cost',
        total: 1000000.00,
        quantity: 1,
        product: {
          id: 'product-high-cost',
          costPrice: 500000.00
        },
        lead: {
          batch: highValueBatch,
          assignedTo: USER_ID
        },
        costs: {
          packagingCost: 100000,
          printingCost: 50000,
          returnCost: 0
        },
        status: OrderStatus.CONFIRMED
      };

      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: vi.fn(() => ({
          order: {
            findUnique: vi.fn().mockResolvedValue(mockHighCostOrder)
          },
          orderCosts: {
            upsert: vi.fn().mockResolvedValue({})
          }
        }))
      }));

      const highCostProfit = await profitService.calculateOrderProfit('order-high-cost', TENANT_A);
      expect(highCostProfit.revenue).toBe(1000000.00);
      expect(highCostProfit.costs.total).toBe(1649999.99); // Sum of all costs
      expect(highCostProfit.netProfit).toBeLessThan(0); // Loss scenario
    });
  });

  describe('Bulk Operations and Performance', () => {
    it('should handle multiple order profit calculations efficiently', async () => {
      // Test bulk profit calculations for reporting
      
      const orderIds = ['order-1', 'order-2', 'order-3', 'order-4', 'order-5'];
      
      // Mock multiple orders
      const mockOrders = orderIds.map((id, index) => ({
        id,
        total: 100 + (index * 10),
        quantity: 1,
        product: {
          id: `product-${index}`,
          costPrice: 30 + (index * 5)
        },
        lead: {
          batch: {
            id: `batch-${index}`,
            costPerLead: 5 + index
          },
          assignedTo: USER_ID
        },
        costs: {
          packagingCost: 3 + index,
          printingCost: 2 + index,
          returnCost: 0
        },
        status: OrderStatus.CONFIRMED
      }));

      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: vi.fn(() => ({
          order: {
            findUnique: vi.fn().mockImplementation((params) => {
              const order = mockOrders.find(o => o.id === params.where.id);
              return Promise.resolve(order);
            })
          },
          orderCosts: {
            upsert: vi.fn().mockResolvedValue({})
          }
        }))
      }));

      const startTime = Date.now();
      const profits = await profitService.calculateMultipleOrderProfits(orderIds, TENANT_A);
      const endTime = Date.now();

      expect(profits).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

      // Verify calculations for each order
      profits.forEach((profit, index) => {
        expect(profit.orderId).toBe(orderIds[index]);
        expect(profit.revenue).toBe(100 + (index * 10));
        expect(profit.costs.product).toBe(30 + (index * 5));
        expect(profit.costs.lead).toBe(5 + index);
      });
    });

    it('should handle batch cost calculations for reporting', async () => {
      // Test batch cost calculations
      
      const orderIds = ['batch-order-1', 'batch-order-2', 'batch-order-3'];
      
      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: vi.fn(() => ({
          orderCosts: {
            findMany: vi.fn().mockResolvedValue([
              { orderId: 'batch-order-1', totalCosts: 45.50 },
              { orderId: 'batch-order-2', totalCosts: 52.75 },
              { orderId: 'batch-order-3', totalCosts: 38.25 }
            ])
          }
        }))
      }));

      const batchCosts = await costService.calculateBatchCosts(orderIds, TENANT_A);
      
      expect(batchCosts).toHaveLength(3);
      expect(batchCosts[0].totalCosts).toBe(45.50);
      expect(batchCosts[1].totalCosts).toBe(52.75);
      expect(batchCosts[2].totalCosts).toBe(38.25);
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain data consistency across related entities', async () => {
      // Test data consistency between orders, costs, and lead batches
      
      const leadBatch = await costService.createLeadBatch({
        totalCost: 150,
        leadCount: 15,
        tenantId: TENANT_A,
        userId: USER_ID
      });

      // Update batch cost and verify consistency
      const updatedBatch = await costService.updateLeadBatchCost(
        leadBatch.batchId,
        200,
        TENANT_A
      );

      expect(updatedBatch.totalCost).toBe(200);
      expect(updatedBatch.costPerLead).toBe(200 / 15);
      expect(updatedBatch.leadCount).toBe(15); // Should remain unchanged

      // Verify batch retrieval
      const retrievedBatch = await costService.getLeadBatch(leadBatch.batchId, TENANT_A);
      expect(retrievedBatch?.totalCost).toBe(200);
      expect(retrievedBatch?.costPerLead).toBe(200 / 15);
    });

    it('should validate business rules consistently', async () => {
      // Test business rule validation across the system
      
      // Test cost validation
      expect(() => ProfitCalculationService.validateCosts({
        packagingCost: -1,
        printingCost: -2,
        returnCost: -3
      })).toThrow('Invalid cost values: Packaging cost cannot be negative, Printing cost cannot be negative, Return cost cannot be negative');

      // Test valid costs pass validation
      expect(() => ProfitCalculationService.validateCosts({
        packagingCost: 5.99,
        printingCost: 3.50,
        returnCost: 12.25
      })).not.toThrow();

      // Test tenant cost config validation
      await expect(costService.updateTenantCostConfig(TENANT_A, {
        defaultPackagingCost: -5
      })).rejects.toThrow('Invalid cost configuration: Default packaging cost cannot be negative');
    });
  });
});