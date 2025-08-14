// src/lib/__tests__/end-to-end-profit-flow.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProfitCalculationService } from '../profit-calculation';
import { CostTrackingService } from '../cost-tracking';
import { OrderStatus } from '@prisma/client';

/**
 * End-to-end integration tests for the complete profit calculation workflow
 * Tests the entire flow from lead import through order processing to reporting
 * Validates all requirements working together in realistic scenarios
 */
describe('End-to-End Profit Calculation Flow', () => {
  let profitService: ProfitCalculationService;
  let costService: CostTrackingService;

  const TENANT_ID = 'tenant-e2e-test';
  const USER_ID = 'user-e2e-test';

  beforeEach(() => {
    profitService = new ProfitCalculationService();
    costService = new CostTrackingService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Business Workflow', () => {
    it('should handle complete e-commerce business flow with profit tracking', async () => {
      /**
       * This test simulates a complete business workflow:
       * 1. Set up tenant cost defaults
       * 2. Import leads with acquisition costs
       * 3. Create products with cost prices
       * 4. Process orders with operational costs
       * 5. Handle returns with return costs
       * 6. Generate profit reports
       * 
       * Validates all requirements: 1.1-1.4, 2.1-2.4, 3.1-3.4, 4.1-4.4, 5.1-5.2, 6.1-6.3, 7.1-7.3, 8.1-8.3
       */

      // Step 1: Set up tenant cost configuration (Requirements 7.1, 7.2, 7.3)
      await costService.updateTenantCostConfig(TENANT_ID, {
        defaultPackagingCost: 4.50,
        defaultPrintingCost: 2.75,
        defaultReturnCost: 18.00
      });

      const tenantDefaults = await costService.getDefaultCosts(TENANT_ID);
      expect(tenantDefaults.packagingCost).toBe(4.50);
      expect(tenantDefaults.printingCost).toBe(2.75);
      expect(tenantDefaults.returnCost).toBe(18.00);

      // Step 2: Import leads with acquisition costs (Requirements 2.1, 2.2, 2.3)
      const leadBatch1 = await costService.createLeadBatch({
        totalCost: 500.00,
        leadCount: 50,
        tenantId: TENANT_ID,
        userId: USER_ID
      });

      const leadBatch2 = await costService.createLeadBatch({
        totalCost: 300.00,
        leadCount: 20,
        tenantId: TENANT_ID,
        userId: USER_ID
      });

      expect(leadBatch1.costPerLead).toBe(10.00);
      expect(leadBatch2.costPerLead).toBe(15.00);

      // Step 3: Mock product data with cost prices (Requirements 1.1, 1.2)
      const products = [
        {
          id: 'product-premium',
          name: 'Premium Widget',
          sellingPrice: 199.99,
          costPrice: 85.00
        },
        {
          id: 'product-standard',
          name: 'Standard Widget',
          sellingPrice: 99.99,
          costPrice: 45.00
        },
        {
          id: 'product-budget',
          name: 'Budget Widget',
          sellingPrice: 49.99,
          costPrice: 25.00
        }
      ];

      // Step 4: Process multiple orders with different scenarios
      const orderScenarios = [
        {
          // Scenario 1: Premium product, high-cost lead, custom costs, successful order
          orderId: 'order-premium-success',
          product: products[0],
          leadBatch: leadBatch2, // Higher cost per lead
          quantity: 1,
          discount: 20.00,
          customCosts: {
            packagingCost: 8.00, // Premium packaging
            printingCost: 5.00   // Premium printing
          },
          finalStatus: OrderStatus.DELIVERED,
          expectedRevenue: 179.99, // 199.99 - 20.00
          expectedProductCost: 85.00,
          expectedLeadCost: 15.00,
          expectedPackagingCost: 8.00,
          expectedPrintingCost: 5.00,
          expectedReturnCost: 0,
          expectedNetProfit: 66.99 // 179.99 - 85.00 - 15.00 - 8.00 - 5.00
        },
        {
          // Scenario 2: Standard product, low-cost lead, default costs, successful order
          orderId: 'order-standard-success',
          product: products[1],
          leadBatch: leadBatch1, // Lower cost per lead
          quantity: 2,
          discount: 0,
          customCosts: null, // Use defaults
          finalStatus: OrderStatus.DELIVERED,
          expectedRevenue: 199.98, // 99.99 * 2
          expectedProductCost: 90.00, // 45.00 * 2
          expectedLeadCost: 10.00,
          expectedPackagingCost: 4.50, // Default
          expectedPrintingCost: 2.75,  // Default
          expectedReturnCost: 0,
          expectedNetProfit: 92.73 // 199.98 - 90.00 - 10.00 - 4.50 - 2.75
        },
        {
          // Scenario 3: Budget product, returned order with return costs
          orderId: 'order-budget-returned',
          product: products[2],
          leadBatch: leadBatch1,
          quantity: 1,
          discount: 5.00,
          customCosts: {
            packagingCost: 3.00,
            printingCost: 2.00
          },
          finalStatus: OrderStatus.RETURNED,
          returnCost: 22.00, // Custom return cost
          expectedRevenue: 44.99, // 49.99 - 5.00
          expectedProductCost: 25.00,
          expectedLeadCost: 10.00,
          expectedPackagingCost: 3.00,
          expectedPrintingCost: 2.00,
          expectedReturnCost: 22.00,
          expectedNetProfit: -17.01 // 44.99 - 25.00 - 10.00 - 3.00 - 2.00 - 22.00 (loss)
        }
      ];

      // Mock database responses for each order scenario
      const mockOrders = orderScenarios.map(scenario => ({
        id: scenario.orderId,
        total: scenario.expectedRevenue,
        quantity: scenario.quantity,
        product: {
          id: scenario.product.id,
          name: scenario.product.name,
          costPrice: scenario.product.costPrice
        },
        lead: {
          batch: {
            id: scenario.leadBatch.batchId,
            costPerLead: scenario.leadBatch.costPerLead
          },
          assignedTo: USER_ID
        },
        costs: scenario.customCosts ? {
          packagingCost: scenario.customCosts.packagingCost,
          printingCost: scenario.customCosts.printingCost,
          returnCost: scenario.returnCost || 0
        } : null,
        status: scenario.finalStatus
      }));

      // Mock prisma client
      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: vi.fn(() => ({
          order: {
            findUnique: vi.fn().mockImplementation((params) => {
              const order = mockOrders.find(o => o.id === params.where.id);
              return Promise.resolve(order);
            }),
            findMany: vi.fn().mockResolvedValue(mockOrders)
          },
          orderCosts: {
            upsert: vi.fn().mockResolvedValue({})
          }
        })),
        prisma: {
          tenantCostConfig: {
            findUnique: vi.fn().mockResolvedValue({
              tenantId: TENANT_ID,
              defaultPackagingCost: 4.50,
              defaultPrintingCost: 2.75,
              defaultReturnCost: 18.00
            })
          }
        }
      }));

      // Step 5: Process each order and validate profit calculations
      const orderResults = [];

      for (const scenario of orderScenarios) {
        // Calculate initial profit
        let profitBreakdown = await profitService.calculateOrderProfit(scenario.orderId, TENANT_ID);

        // Validate initial calculations
        expect(profitBreakdown.revenue).toBe(scenario.expectedRevenue);
        expect(profitBreakdown.costs.product).toBe(scenario.expectedProductCost);
        expect(profitBreakdown.costs.lead).toBe(scenario.expectedLeadCost);
        
        if (scenario.customCosts) {
          expect(profitBreakdown.costs.packaging).toBe(scenario.expectedPackagingCost);
          expect(profitBreakdown.costs.printing).toBe(scenario.expectedPrintingCost);
        } else {
          expect(profitBreakdown.costs.packaging).toBe(tenantDefaults.packagingCost);
          expect(profitBreakdown.costs.printing).toBe(tenantDefaults.printingCost);
        }

        // Handle return scenario
        if (scenario.finalStatus === OrderStatus.RETURNED) {
          profitBreakdown = await profitService.recalculateOnStatusChange(
            scenario.orderId,
            OrderStatus.RETURNED,
            TENANT_ID,
            scenario.returnCost
          );

          expect(profitBreakdown.costs.return).toBe(scenario.expectedReturnCost);
          expect(profitBreakdown.isReturn).toBe(true);
        }

        // Validate final profit calculations
        expect(Math.round(profitBreakdown.netProfit * 100) / 100).toBe(scenario.expectedNetProfit);
        
        // Calculate expected profit margin
        const expectedMargin = scenario.expectedRevenue > 0 
          ? (scenario.expectedNetProfit / scenario.expectedRevenue) * 100 
          : 0;
        expect(Math.round(profitBreakdown.profitMargin * 100) / 100).toBe(Math.round(expectedMargin * 100) / 100);

        orderResults.push(profitBreakdown);
      }

      // Step 6: Generate comprehensive profit report (Requirements 6.1, 6.2, 6.3)
      const reportParams = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        period: 'monthly' as const,
        tenantId: TENANT_ID
      };

      const periodReport = await profitService.calculatePeriodProfit(reportParams, TENANT_ID);

      // Validate report summary
      const expectedTotalRevenue = orderResults.reduce((sum, order) => sum + order.revenue, 0);
      const expectedTotalCosts = orderResults.reduce((sum, order) => sum + order.costs.total, 0);
      const expectedNetProfit = orderResults.reduce((sum, order) => sum + order.netProfit, 0);

      expect(Math.round(periodReport.summary.totalRevenue * 100) / 100).toBe(Math.round(expectedTotalRevenue * 100) / 100);
      expect(Math.round(periodReport.summary.totalCosts * 100) / 100).toBe(Math.round(expectedTotalCosts * 100) / 100);
      expect(Math.round(periodReport.summary.netProfit * 100) / 100).toBe(Math.round(expectedNetProfit * 100) / 100);
      expect(periodReport.summary.orderCount).toBe(3);
      expect(periodReport.summary.returnCount).toBe(1);

      // Validate cost breakdown
      const expectedProductCosts = orderResults.reduce((sum, order) => sum + order.costs.product, 0);
      const expectedLeadCosts = orderResults.reduce((sum, order) => sum + order.costs.lead, 0);
      const expectedPackagingCosts = orderResults.reduce((sum, order) => sum + order.costs.packaging, 0);
      const expectedPrintingCosts = orderResults.reduce((sum, order) => sum + order.costs.printing, 0);
      const expectedReturnCosts = orderResults.reduce((sum, order) => sum + order.costs.return, 0);

      expect(periodReport.breakdown.productCosts).toBe(expectedProductCosts);
      expect(periodReport.breakdown.leadCosts).toBe(expectedLeadCosts);
      expect(periodReport.breakdown.packagingCosts).toBe(expectedPackagingCosts);
      expect(periodReport.breakdown.printingCosts).toBe(expectedPrintingCosts);
      expect(periodReport.breakdown.returnCosts).toBe(expectedReturnCosts);

      // Validate trends data
      expect(periodReport.trends).toBeInstanceOf(Array);
      expect(periodReport.trends.length).toBeGreaterThan(0);

      // Step 7: Test bulk operations for performance
      const allOrderIds = orderScenarios.map(s => s.orderId);
      const bulkProfits = await profitService.calculateMultipleOrderProfits(allOrderIds, TENANT_ID);

      expect(bulkProfits).toHaveLength(3);
      bulkProfits.forEach((profit, index) => {
        expect(profit.orderId).toBe(orderScenarios[index].orderId);
        expect(Math.round(profit.netProfit * 100) / 100).toBe(orderScenarios[index].expectedNetProfit);
      });

      // Step 8: Validate business insights
      const profitableOrders = orderResults.filter(order => order.netProfit > 0);
      const lossOrders = orderResults.filter(order => order.netProfit < 0);

      expect(profitableOrders).toHaveLength(2); // Premium and standard orders
      expect(lossOrders).toHaveLength(1); // Returned budget order

      // Calculate average profit margin for profitable orders
      const avgProfitMargin = profitableOrders.reduce((sum, order) => sum + order.profitMargin, 0) / profitableOrders.length;
      expect(avgProfitMargin).toBeGreaterThan(30); // Should have healthy margins

      // Validate return impact
      const returnOrder = orderResults.find(order => order.isReturn);
      expect(returnOrder?.netProfit).toBeLessThan(0); // Returns should show losses
      expect(returnOrder?.costs.return).toBeGreaterThan(0); // Return costs should be tracked
    });

    it('should handle complex multi-product order scenarios', async () => {
      // Test complex scenarios with multiple products, bulk orders, and mixed statuses
      
      const complexScenarios = [
        {
          // Bulk order with mixed products
          orderId: 'order-bulk-mixed',
          items: [
            { productId: 'product-a', costPrice: 30.00, quantity: 3, sellingPrice: 75.00 },
            { productId: 'product-b', costPrice: 20.00, quantity: 2, sellingPrice: 50.00 }
          ],
          leadCost: 12.00,
          operationalCosts: {
            packagingCost: 15.00, // Bulk packaging
            printingCost: 8.00    // Multiple items
          },
          discount: 25.00,
          status: OrderStatus.DELIVERED
        }
      ];

      // Calculate expected values for bulk order
      const bulkOrder = complexScenarios[0];
      const expectedRevenue = bulkOrder.items.reduce((sum, item) => 
        sum + (item.sellingPrice * item.quantity), 0) - bulkOrder.discount;
      const expectedProductCost = bulkOrder.items.reduce((sum, item) => 
        sum + (item.costPrice * item.quantity), 0);
      const expectedTotalCosts = expectedProductCost + bulkOrder.leadCost + 
        bulkOrder.operationalCosts.packagingCost + bulkOrder.operationalCosts.printingCost;
      const expectedNetProfit = expectedRevenue - expectedTotalCosts;

      // Mock the bulk order
      const mockBulkOrder = {
        id: bulkOrder.orderId,
        total: expectedRevenue,
        quantity: bulkOrder.items.reduce((sum, item) => sum + item.quantity, 0),
        product: {
          id: 'bulk-product-composite',
          costPrice: expectedProductCost / bulkOrder.items.reduce((sum, item) => sum + item.quantity, 0) // Average cost
        },
        lead: {
          batch: {
            id: 'batch-bulk',
            costPerLead: bulkOrder.leadCost
          },
          assignedTo: USER_ID
        },
        costs: {
          packagingCost: bulkOrder.operationalCosts.packagingCost,
          printingCost: bulkOrder.operationalCosts.printingCost,
          returnCost: 0
        },
        status: bulkOrder.status
      };

      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: vi.fn(() => ({
          order: {
            findUnique: vi.fn().mockResolvedValue(mockBulkOrder)
          },
          orderCosts: {
            upsert: vi.fn().mockResolvedValue({})
          }
        }))
      }));

      const bulkProfitBreakdown = await profitService.calculateOrderProfit(bulkOrder.orderId, TENANT_ID);

      expect(bulkProfitBreakdown.revenue).toBe(expectedRevenue);
      expect(bulkProfitBreakdown.costs.total).toBe(expectedTotalCosts);
      expect(Math.round(bulkProfitBreakdown.netProfit * 100) / 100).toBe(Math.round(expectedNetProfit * 100) / 100);
    });

    it('should handle seasonal and promotional scenarios', async () => {
      // Test seasonal pricing and promotional scenarios
      
      const promotionalScenarios = [
        {
          // Black Friday sale scenario
          orderId: 'order-black-friday',
          originalPrice: 299.99,
          salePrice: 199.99,
          costPrice: 120.00,
          leadCost: 25.00, // Higher marketing spend during sales
          packagingCost: 8.00,
          printingCost: 4.00,
          expectedProfit: 199.99 - 120.00 - 25.00 - 8.00 - 4.00 // 42.99
        },
        {
          // Clearance sale scenario (low margin)
          orderId: 'order-clearance',
          originalPrice: 149.99,
          salePrice: 79.99,
          costPrice: 75.00,
          leadCost: 8.00,
          packagingCost: 3.00,
          printingCost: 2.00,
          expectedProfit: 79.99 - 75.00 - 8.00 - 3.00 - 2.00 // -8.01 (loss)
        }
      ];

      for (const scenario of promotionalScenarios) {
        const mockPromotionalOrder = {
          id: scenario.orderId,
          total: scenario.salePrice,
          quantity: 1,
          product: {
            id: `product-${scenario.orderId}`,
            costPrice: scenario.costPrice
          },
          lead: {
            batch: {
              id: `batch-${scenario.orderId}`,
              costPerLead: scenario.leadCost
            },
            assignedTo: USER_ID
          },
          costs: {
            packagingCost: scenario.packagingCost,
            printingCost: scenario.printingCost,
            returnCost: 0
          },
          status: OrderStatus.CONFIRMED
        };

        vi.doMock('../prisma', () => ({
          getScopedPrismaClient: vi.fn(() => ({
            order: {
              findUnique: vi.fn().mockResolvedValue(mockPromotionalOrder)
            },
            orderCosts: {
              upsert: vi.fn().mockResolvedValue({})
            }
          }))
        }));

        const profitBreakdown = await profitService.calculateOrderProfit(scenario.orderId, TENANT_ID);
        expect(Math.round(profitBreakdown.netProfit * 100) / 100).toBe(scenario.expectedProfit);

        // Validate margin analysis for promotional orders
        if (scenario.expectedProfit < 0) {
          expect(profitBreakdown.profitMargin).toBeLessThan(0);
          expect(profitBreakdown.netProfit).toBeLessThan(0);
        } else {
          expect(profitBreakdown.profitMargin).toBeGreaterThan(0);
          expect(profitBreakdown.netProfit).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Real-World Edge Cases', () => {
    it('should handle partial returns and exchanges', async () => {
      // Test partial return scenarios
      
      const partialReturnOrder = {
        id: 'order-partial-return',
        originalTotal: 200.00,
        returnedAmount: 75.00, // Partial return
        quantity: 2,
        returnedQuantity: 1,
        product: {
          id: 'product-partial',
          costPrice: 40.00
        },
        lead: {
          batch: {
            id: 'batch-partial',
            costPerLead: 10.00
          },
          assignedTo: USER_ID
        },
        costs: {
          packagingCost: 6.00,
          printingCost: 4.00,
          returnCost: 12.00 // Return shipping for partial return
        },
        status: OrderStatus.PARTIALLY_RETURNED
      };

      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: vi.fn(() => ({
          order: {
            findUnique: vi.fn().mockResolvedValue(partialReturnOrder)
          },
          orderCosts: {
            upsert: vi.fn().mockResolvedValue({})
          }
        }))
      }));

      const profitBreakdown = await profitService.calculateOrderProfit('order-partial-return', TENANT_ID);

      // For partial returns, we still calculate based on original order but include return costs
      expect(profitBreakdown.revenue).toBe(200.00);
      expect(profitBreakdown.costs.product).toBe(80.00); // 40.00 * 2
      expect(profitBreakdown.costs.return).toBe(12.00);
      expect(profitBreakdown.netProfit).toBe(200.00 - 80.00 - 10.00 - 6.00 - 4.00 - 12.00); // 88.00
    });

    it('should handle subscription and recurring order scenarios', async () => {
      // Test recurring subscription orders
      
      const subscriptionOrders = [
        {
          id: 'subscription-month-1',
          subscriptionId: 'sub-123',
          monthlyRevenue: 29.99,
          productCost: 12.00,
          leadCost: 15.00, // Higher acquisition cost for subscription
          operationalCosts: 3.00
        },
        {
          id: 'subscription-month-2',
          subscriptionId: 'sub-123',
          monthlyRevenue: 29.99,
          productCost: 12.00,
          leadCost: 0, // No additional lead cost for retained customer
          operationalCosts: 3.00
        },
        {
          id: 'subscription-month-3',
          subscriptionId: 'sub-123',
          monthlyRevenue: 29.99,
          productCost: 12.00,
          leadCost: 0, // No additional lead cost for retained customer
          operationalCosts: 3.00
        }
      ];

      const subscriptionProfits = [];

      for (const subOrder of subscriptionOrders) {
        const mockSubOrder = {
          id: subOrder.id,
          total: subOrder.monthlyRevenue,
          quantity: 1,
          product: {
            id: 'product-subscription',
            costPrice: subOrder.productCost
          },
          lead: {
            batch: subOrder.leadCost > 0 ? {
              id: 'batch-subscription-acquisition',
              costPerLead: subOrder.leadCost
            } : null,
            assignedTo: USER_ID
          },
          costs: {
            packagingCost: subOrder.operationalCosts,
            printingCost: 0,
            returnCost: 0
          },
          status: OrderStatus.DELIVERED
        };

        vi.doMock('../prisma', () => ({
          getScopedPrismaClient: vi.fn(() => ({
            order: {
              findUnique: vi.fn().mockResolvedValue(mockSubOrder)
            },
            orderCosts: {
              upsert: vi.fn().mockResolvedValue({})
            }
          }))
        }));

        const profitBreakdown = await profitService.calculateOrderProfit(subOrder.id, TENANT_ID);
        subscriptionProfits.push(profitBreakdown);
      }

      // Validate subscription profit progression
      expect(subscriptionProfits[0].netProfit).toBeLessThan(subscriptionProfits[1].netProfit); // Month 1 has acquisition cost
      expect(subscriptionProfits[1].netProfit).toBe(subscriptionProfits[2].netProfit); // Months 2-3 should be equal

      // Calculate lifetime value
      const totalLifetimeProfit = subscriptionProfits.reduce((sum, profit) => sum + profit.netProfit, 0);
      expect(totalLifetimeProfit).toBeGreaterThan(0); // Should be profitable over time
    });

    it('should handle international orders with currency and shipping complexities', async () => {
      // Test international order scenarios with additional costs
      
      const internationalOrder = {
        id: 'order-international',
        baseRevenue: 150.00,
        currencyConversionFee: 3.75, // 2.5% conversion fee
        internationalShipping: 25.00,
        customsDuties: 12.00,
        productCost: 60.00,
        leadCost: 8.00,
        packagingCost: 8.00, // International packaging
        printingCost: 3.00,
        totalRevenue: 150.00 - 3.75 // Net after conversion fees
      };

      const mockInternationalOrder = {
        id: internationalOrder.id,
        total: internationalOrder.totalRevenue,
        quantity: 1,
        product: {
          id: 'product-international',
          costPrice: internationalOrder.productCost
        },
        lead: {
          batch: {
            id: 'batch-international',
            costPerLead: internationalOrder.leadCost
          },
          assignedTo: USER_ID
        },
        costs: {
          packagingCost: internationalOrder.packagingCost + internationalOrder.internationalShipping + internationalOrder.customsDuties,
          printingCost: internationalOrder.printingCost,
          returnCost: 0
        },
        status: OrderStatus.SHIPPED
      };

      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: vi.fn(() => ({
          order: {
            findUnique: vi.fn().mockResolvedValue(mockInternationalOrder)
          },
          orderCosts: {
            upsert: vi.fn().mockResolvedValue({})
          }
        }))
      }));

      const profitBreakdown = await profitService.calculateOrderProfit(internationalOrder.id, TENANT_ID);

      // Validate international order profit calculation includes all additional costs
      const expectedTotalCosts = internationalOrder.productCost + internationalOrder.leadCost + 
        internationalOrder.packagingCost + internationalOrder.internationalShipping + 
        internationalOrder.customsDuties + internationalOrder.printingCost;
      
      expect(profitBreakdown.costs.total).toBe(expectedTotalCosts);
      expect(profitBreakdown.netProfit).toBe(internationalOrder.totalRevenue - expectedTotalCosts);
    });
  });

  describe('Performance and Scalability Validation', () => {
    it('should handle high-volume order processing efficiently', async () => {
      // Test system performance with large order volumes
      
      const highVolumeOrderCount = 1000;
      const batchSize = 100;

      // Create mock high-volume orders
      const highVolumeOrders = Array.from({ length: highVolumeOrderCount }, (_, i) => ({
        id: `order-volume-${i}`,
        total: 100 + (i % 50),
        quantity: 1 + (i % 3),
        product: {
          id: `product-${i % 10}`,
          costPrice: 40 + (i % 20)
        },
        lead: {
          batch: {
            id: `batch-${i % 5}`,
            costPerLead: 5 + (i % 10)
          },
          assignedTo: USER_ID
        },
        costs: {
          packagingCost: 3 + (i % 3),
          printingCost: 2 + (i % 2),
          returnCost: i % 20 === 0 ? 15 : 0 // 5% return rate
        },
        status: i % 20 === 0 ? OrderStatus.RETURNED : OrderStatus.DELIVERED
      }));

      vi.doMock('../prisma', () => ({
        getScopedPrismaClient: vi.fn(() => ({
          order: {
            findUnique: vi.fn().mockImplementation((params) => {
              const order = highVolumeOrders.find(o => o.id === params.where.id);
              return Promise.resolve(order);
            }),
            findMany: vi.fn().mockResolvedValue(highVolumeOrders)
          },
          orderCosts: {
            upsert: vi.fn().mockResolvedValue({})
          }
        }))
      }));

      // Test batch processing performance
      const startTime = Date.now();
      
      // Process orders in batches
      const batchResults = [];
      for (let i = 0; i < highVolumeOrderCount; i += batchSize) {
        const batchOrderIds = highVolumeOrders
          .slice(i, i + batchSize)
          .map(order => order.id);
        
        const batchProfits = await profitService.calculateMultipleOrderProfits(batchOrderIds, TENANT_ID);
        batchResults.push(...batchProfits);
      }
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Validate performance metrics
      expect(batchResults).toHaveLength(highVolumeOrderCount);
      expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(processingTime / highVolumeOrderCount).toBeLessThan(30); // Less than 30ms per order

      // Validate accuracy of batch processing
      const totalRevenue = batchResults.reduce((sum, profit) => sum + profit.revenue, 0);
      const totalProfit = batchResults.reduce((sum, profit) => sum + profit.netProfit, 0);
      const returnCount = batchResults.filter(profit => profit.isReturn).length;

      expect(totalRevenue).toBeGreaterThan(0);
      expect(totalProfit).toBeGreaterThan(0); // Should be profitable overall
      expect(returnCount).toBe(Math.floor(highVolumeOrderCount / 20)); // 5% return rate
    });
  });
});