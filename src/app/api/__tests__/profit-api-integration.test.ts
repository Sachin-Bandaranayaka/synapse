// src/app/api/__tests__/profit-api-integration.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getProfitReport } from '../reports/profit/route';
import { GET as getOrderCosts, POST as updateOrderCosts } from '../orders/[orderId]/costs/route';
import { GET as getCostConfig, PUT as updateCostConfig } from '../tenant/cost-config/route';

/**
 * Integration tests for profit-related API endpoints
 * Tests complete API flows including authentication, authorization, and data processing
 */
describe('Profit API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Profit Reports API Integration', () => {
    it('should generate complete profit report with all filters', async () => {
      // Mock authentication
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-integration-test',
          role: 'ADMIN',
          id: 'user-123'
        },
      } as any);

      // Mock database with comprehensive test data
      const { getScopedPrismaClient } = await import('@/lib/prisma');
      const mockPrisma = {
        order: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'order-1',
              createdAt: new Date('2024-01-15'),
              total: 150.00,
              quantity: 1,
              status: 'CONFIRMED',
              productId: 'product-1',
              product: { 
                id: 'product-1', 
                name: 'Test Product 1',
                costPrice: 60.00
              },
              lead: { 
                userId: 'user-123',
                assignedTo: 'user-123',
                batch: {
                  id: 'batch-1',
                  costPerLead: 8.00
                }
              },
              costs: {
                packagingCost: 5.00,
                printingCost: 3.00,
                returnCost: 0,
                productCost: 60.00,
                leadCost: 8.00,
                totalCosts: 76.00,
                grossProfit: 90.00,
                netProfit: 74.00,
                profitMargin: 49.33
              }
            },
            {
              id: 'order-2',
              createdAt: new Date('2024-01-20'),
              total: 200.00,
              quantity: 2,
              status: 'RETURNED',
              productId: 'product-2',
              product: { 
                id: 'product-2', 
                name: 'Test Product 2',
                costPrice: 40.00
              },
              lead: { 
                userId: 'user-456',
                assignedTo: 'user-456',
                batch: {
                  id: 'batch-2',
                  costPerLead: 12.00
                }
              },
              costs: {
                packagingCost: 8.00,
                printingCost: 4.00,
                returnCost: 25.00,
                productCost: 80.00,
                leadCost: 12.00,
                totalCosts: 129.00,
                grossProfit: 120.00,
                netProfit: 71.00,
                profitMargin: 35.50
              }
            }
          ])
        }
      };
      vi.mocked(getScopedPrismaClient).mockReturnValue(mockPrisma as any);

      // Mock profit calculation service
      const { profitCalculationService } = await import('@/lib/profit-calculation');
      vi.mocked(profitCalculationService.calculateOrderProfit)
        .mockResolvedValueOnce({
          orderId: 'order-1',
          revenue: 150.00,
          costs: {
            product: 60.00,
            lead: 8.00,
            packaging: 5.00,
            printing: 3.00,
            return: 0,
            total: 76.00
          },
          grossProfit: 90.00,
          netProfit: 74.00,
          profitMargin: 49.33,
          isReturn: false
        })
        .mockResolvedValueOnce({
          orderId: 'order-2',
          revenue: 200.00,
          costs: {
            product: 80.00,
            lead: 12.00,
            packaging: 8.00,
            printing: 4.00,
            return: 25.00,
            total: 129.00
          },
          grossProfit: 120.00,
          netProfit: 71.00,
          profitMargin: 35.50,
          isReturn: true
        });

      // Test comprehensive report generation
      const request = new NextRequest(
        'http://localhost:3000/api/reports/profit?period=monthly&productId=product-1&userId=user-123'
      );
      const response = await getProfitReport(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      // Validate report structure
      expect(data).toHaveProperty('period');
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('breakdown');
      expect(data).toHaveProperty('trends');

      // Validate summary calculations
      expect(data.summary.totalRevenue).toBe(350.00);
      expect(data.summary.netProfit).toBe(145.00);
      expect(data.summary.orderCount).toBe(2);
      expect(data.summary.returnCount).toBe(1);

      // Validate cost breakdown
      expect(data.breakdown.productCosts).toBe(140.00);
      expect(data.breakdown.leadCosts).toBe(20.00);
      expect(data.breakdown.packagingCosts).toBe(13.00);
      expect(data.breakdown.printingCosts).toBe(7.00);
      expect(data.breakdown.returnCosts).toBe(25.00);

      // Validate trends data
      expect(data.trends).toBeInstanceOf(Array);
      expect(data.trends.length).toBeGreaterThan(0);
    });

    it('should handle custom date range filtering', async () => {
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-test',
          role: 'ADMIN',
        },
      } as any);

      const { getScopedPrismaClient } = await import('@/lib/prisma');
      const mockPrisma = {
        order: {
          findMany: vi.fn().mockResolvedValue([])
        }
      };
      vi.mocked(getScopedPrismaClient).mockReturnValue(mockPrisma as any);

      const request = new NextRequest(
        'http://localhost:3000/api/reports/profit?period=custom&startDate=2024-01-01&endDate=2024-01-31'
      );
      const response = await getProfitReport(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should enforce proper authorization for profit reports', async () => {
      // Test unauthorized access
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/reports/profit');
      const response = await getProfitReport(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');

      // Test insufficient permissions
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-test',
          role: 'TEAM_MEMBER', // Not admin
        },
      } as any);

      const response2 = await getProfitReport(request);
      expect(response2.status).toBe(403);
      const data2 = await response2.json();
      expect(data2.error).toBe('Forbidden');
    });
  });

  describe('Order Costs API Integration', () => {
    it('should retrieve and update order costs correctly', async () => {
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-test',
          role: 'ADMIN',
          permissions: ['EDIT_ORDERS']
        },
      } as any);

      // Mock profit calculation service
      const { profitCalculationService } = await import('@/lib/profit-calculation');
      vi.mocked(profitCalculationService.calculateOrderProfit).mockResolvedValue({
        orderId: 'order-123',
        revenue: 100.00,
        costs: {
          product: 40.00,
          lead: 5.00,
          packaging: 3.00,
          printing: 2.00,
          return: 0,
          total: 50.00
        },
        grossProfit: 60.00,
        netProfit: 50.00,
        profitMargin: 50.00,
        isReturn: false
      });

      // Test GET order costs
      const getRequest = new Request('http://localhost:3000/api/orders/order-123/costs');
      const getResponse = await getOrderCosts(
        getRequest,
        { params: Promise.resolve({ orderId: 'order-123' }) }
      );

      expect(getResponse.status).toBe(200);
      const getCostData = await getResponse.json();
      expect(getCostData.orderId).toBe('order-123');
      expect(getCostData.costs.total).toBe(50.00);

      // Test POST order cost update
      vi.mocked(profitCalculationService.updateOrderCostsManually).mockResolvedValue({
        orderId: 'order-123',
        revenue: 100.00,
        costs: {
          product: 40.00,
          lead: 5.00,
          packaging: 5.00, // Updated
          printing: 4.00,  // Updated
          return: 0,
          total: 54.00
        },
        grossProfit: 60.00,
        netProfit: 46.00,
        profitMargin: 46.00,
        isReturn: false
      });

      const postRequest = new Request('http://localhost:3000/api/orders/order-123/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packagingCost: 5.00,
          printingCost: 4.00
        })
      });

      const postResponse = await updateOrderCosts(
        postRequest,
        { params: Promise.resolve({ orderId: 'order-123' }) }
      );

      expect(postResponse.status).toBe(200);
      const postCostData = await postResponse.json();
      expect(postCostData.costs.packaging).toBe(5.00);
      expect(postCostData.costs.printing).toBe(4.00);
      expect(postCostData.netProfit).toBe(46.00);
    });

    it('should validate cost update inputs', async () => {
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-test',
          role: 'ADMIN',
          permissions: ['EDIT_ORDERS']
        },
      } as any);

      // Test invalid cost values
      const request = new Request('http://localhost:3000/api/orders/order-123/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packagingCost: -5.00, // Invalid negative cost
          printingCost: 'invalid' // Invalid type
        })
      });

      const response = await updateOrderCosts(
        request,
        { params: Promise.resolve({ orderId: 'order-123' }) }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid cost data');
      expect(data.details).toBeDefined();
    });
  });

  describe('Tenant Cost Configuration API Integration', () => {
    it('should manage tenant cost configuration correctly', async () => {
      const { getSession } = await import('@/lib/auth');
      vi.mocked(getSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-config-test',
          role: 'ADMIN'
        },
      } as any);

      // Mock cost tracking service
      const mockCostService = {
        getDefaultCosts: vi.fn().mockResolvedValue({
          packagingCost: 5.00,
          printingCost: 3.00,
          returnCost: 15.00
        }),
        updateTenantCostConfig: vi.fn().mockResolvedValue(undefined)
      };

      vi.doMock('@/lib/cost-tracking', () => ({
        CostTrackingService: vi.fn(() => mockCostService)
      }));

      // Test GET cost configuration
      const getRequest = new NextRequest('http://localhost:3000/api/tenant/cost-config');
      const getResponse = await getCostConfig(getRequest);

      expect(getResponse.status).toBe(200);
      const getConfigData = await getResponse.json();
      expect(getConfigData.packagingCost).toBe(5.00);
      expect(getConfigData.printingCost).toBe(3.00);
      expect(getConfigData.returnCost).toBe(15.00);

      // Test PUT cost configuration update
      const putRequest = new NextRequest('http://localhost:3000/api/tenant/cost-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultPackagingCost: 6.00,
          defaultPrintingCost: 4.00,
          defaultReturnCost: 18.00
        })
      });

      const putResponse = await updateCostConfig(putRequest);

      expect(putResponse.status).toBe(200);
      const putConfigData = await putResponse.json();
      expect(putConfigData.message).toBe('Cost configuration updated successfully');
      expect(mockCostService.updateTenantCostConfig).toHaveBeenCalledWith(
        'tenant-config-test',
        {
          defaultPackagingCost: 6.00,
          defaultPrintingCost: 4.00,
          defaultReturnCost: 18.00
        }
      );
    });

    it('should enforce admin-only access to cost configuration', async () => {
      const { getSession } = await import('@/lib/auth');
      
      // Test non-admin access
      vi.mocked(getSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-test',
          role: 'TEAM_MEMBER' // Not admin
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/tenant/cost-config');
      const response = await getCostConfig(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Forbidden');
    });

    it('should validate cost configuration inputs', async () => {
      const { getSession } = await import('@/lib/auth');
      vi.mocked(getSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-test',
          role: 'ADMIN'
        },
      } as any);

      // Test invalid configuration values
      const request = new NextRequest('http://localhost:3000/api/tenant/cost-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultPackagingCost: -5.00, // Invalid negative cost
          defaultPrintingCost: 'invalid', // Invalid type
          defaultReturnCost: null // Invalid null
        })
      });

      const response = await updateCostConfig(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid data');
      expect(data.details).toBeDefined();
    });
  });

  describe('Multi-Tenant API Isolation', () => {
    it('should isolate data between tenants in API calls', async () => {
      const { getServerSession } = await import('next-auth');
      const { getScopedPrismaClient } = await import('@/lib/prisma');

      // Test tenant A
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-a',
          role: 'ADMIN'
        },
      } as any);

      const mockPrismaA = {
        order: {
          findMany: vi.fn().mockResolvedValue([
            { id: 'order-a1', tenantId: 'tenant-a' }
          ])
        }
      };
      vi.mocked(getScopedPrismaClient).mockReturnValue(mockPrismaA as any);

      const requestA = new NextRequest('http://localhost:3000/api/reports/profit');
      const responseA = await getProfitReport(requestA);

      expect(responseA.status).toBe(200);
      expect(getScopedPrismaClient).toHaveBeenCalledWith('tenant-a');

      // Test tenant B
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-b',
          role: 'ADMIN'
        },
      } as any);

      const mockPrismaB = {
        order: {
          findMany: vi.fn().mockResolvedValue([
            { id: 'order-b1', tenantId: 'tenant-b' }
          ])
        }
      };
      vi.mocked(getScopedPrismaClient).mockReturnValue(mockPrismaB as any);

      const requestB = new NextRequest('http://localhost:3000/api/reports/profit');
      const responseB = await getProfitReport(requestB);

      expect(responseB.status).toBe(200);
      expect(getScopedPrismaClient).toHaveBeenCalledWith('tenant-b');

      // Verify different prisma clients were used
      expect(mockPrismaA.order.findMany).toHaveBeenCalled();
      expect(mockPrismaB.order.findMany).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle database errors gracefully', async () => {
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-test',
          role: 'ADMIN'
        },
      } as any);

      const { getScopedPrismaClient } = await import('@/lib/prisma');
      const mockPrisma = {
        order: {
          findMany: vi.fn().mockRejectedValue(new Error('Database connection failed'))
        }
      };
      vi.mocked(getScopedPrismaClient).mockReturnValue(mockPrisma as any);

      const request = new NextRequest('http://localhost:3000/api/reports/profit');
      const response = await getProfitReport(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to generate profit report');
    });

    it('should handle service errors in cost calculations', async () => {
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-test',
          role: 'ADMIN'
        },
      } as any);

      const { profitCalculationService } = await import('@/lib/profit-calculation');
      vi.mocked(profitCalculationService.calculateOrderProfit)
        .mockRejectedValue(new Error('Profit calculation failed'));

      const request = new Request('http://localhost:3000/api/orders/order-123/costs');
      const response = await getOrderCosts(
        request,
        { params: Promise.resolve({ orderId: 'order-123' }) }
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Profit calculation failed');
    });

    it('should handle malformed request data', async () => {
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-test',
          role: 'ADMIN',
          permissions: ['EDIT_ORDERS']
        },
      } as any);

      // Test malformed JSON
      const request = new Request('http://localhost:3000/api/orders/order-123/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      });

      const response = await updateOrderCosts(
        request,
        { params: Promise.resolve({ orderId: 'order-123' }) }
      );

      expect(response.status).toBe(500);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large dataset profit reports efficiently', async () => {
      const { getServerSession } = await import('next-auth');
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          tenantId: 'tenant-performance-test',
          role: 'ADMIN'
        },
      } as any);

      // Mock large dataset
      const largeOrderSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `order-${i}`,
        createdAt: new Date('2024-01-01'),
        total: 100 + i,
        quantity: 1,
        status: 'CONFIRMED',
        product: { 
          id: `product-${i}`, 
          name: `Product ${i}`,
          costPrice: 50 + (i % 10)
        },
        lead: { 
          userId: 'user-123',
          batch: {
            id: `batch-${i % 10}`,
            costPerLead: 5 + (i % 5)
          }
        },
        costs: {
          packagingCost: 3,
          printingCost: 2,
          returnCost: 0
        }
      }));

      const { getScopedPrismaClient } = await import('@/lib/prisma');
      const mockPrisma = {
        order: {
          findMany: vi.fn().mockResolvedValue(largeOrderSet)
        }
      };
      vi.mocked(getScopedPrismaClient).mockReturnValue(mockPrisma as any);

      const { profitCalculationService } = await import('@/lib/profit-calculation');
      vi.mocked(profitCalculationService.calculateOrderProfit)
        .mockImplementation(async (orderId) => ({
          orderId,
          revenue: 100,
          costs: {
            product: 50,
            lead: 5,
            packaging: 3,
            printing: 2,
            return: 0,
            total: 60
          },
          grossProfit: 50,
          netProfit: 40,
          profitMargin: 40,
          isReturn: false
        }));

      const startTime = Date.now();
      const request = new NextRequest('http://localhost:3000/api/reports/profit?period=monthly');
      const response = await getProfitReport(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      const data = await response.json();
      expect(data.summary.orderCount).toBe(1000);
    });
  });
});