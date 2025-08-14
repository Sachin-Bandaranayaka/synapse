// src/lib/__tests__/cost-tracking.test.ts

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CostTrackingService, LeadBatchParams, OrderCostUpdate, TenantCostConfigUpdate } from '../cost-tracking';
import { getScopedPrismaClient, prisma as unscopedPrisma } from '../prisma';

// Mock the prisma clients
vi.mock('../prisma', () => ({
  getScopedPrismaClient: vi.fn(),
  prisma: {
    leadBatch: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    tenantCostConfig: {
      findUnique: vi.fn(),
      upsert: vi.fn()
    }
  }
}));

describe('CostTrackingService', () => {
  let costTrackingService: CostTrackingService;
  let mockScopedPrisma: any;
  let mockUnscopedPrisma: any;

  beforeEach(() => {
    costTrackingService = new CostTrackingService();
    
    // Setup mock scoped prisma client
    mockScopedPrisma = {
      orderCosts: {
        findUnique: vi.fn(),
        create: vi.fn(),
        upsert: vi.fn(),
        findMany: vi.fn()
      }
    };
    
    // Setup mock unscoped prisma client
    mockUnscopedPrisma = unscopedPrisma as any;
    
    (getScopedPrismaClient as any).mockReturnValue(mockScopedPrisma);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createLeadBatch', () => {
    it('should create a lead batch with correct cost distribution', async () => {
      // Arrange
      const params: LeadBatchParams = {
        totalCost: 100,
        leadCount: 10,
        tenantId: 'tenant-1',
        userId: 'user-1'
      };

      const mockBatch = {
        id: 'batch-1',
        totalCost: 100,
        leadCount: 10,
        costPerLead: 10,
        importedAt: new Date('2024-01-01')
      };

      mockUnscopedPrisma.leadBatch.create.mockResolvedValue(mockBatch);

      // Act
      const result = await costTrackingService.createLeadBatch(params);

      // Assert
      expect(mockUnscopedPrisma.leadBatch.create).toHaveBeenCalledWith({
        data: {
          totalCost: 100,
          leadCount: 10,
          costPerLead: 10,
          tenantId: 'tenant-1',
          userId: 'user-1'
        }
      });

      expect(result).toEqual({
        batchId: 'batch-1',
        totalCost: 100,
        leadCount: 10,
        costPerLead: 10,
        importDate: new Date('2024-01-01')
      });
    });

    it('should handle zero cost correctly', async () => {
      // Arrange
      const params: LeadBatchParams = {
        totalCost: 0,
        leadCount: 5,
        tenantId: 'tenant-1',
        userId: 'user-1'
      };

      const mockBatch = {
        id: 'batch-1',
        totalCost: 0,
        leadCount: 5,
        costPerLead: 0,
        importedAt: new Date('2024-01-01')
      };

      mockUnscopedPrisma.leadBatch.create.mockResolvedValue(mockBatch);

      // Act
      const result = await costTrackingService.createLeadBatch(params);

      // Assert
      expect(result.costPerLead).toBe(0);
    });

    it('should throw error for negative total cost', async () => {
      // Arrange
      const params: LeadBatchParams = {
        totalCost: -50,
        leadCount: 10,
        tenantId: 'tenant-1',
        userId: 'user-1'
      };

      // Act & Assert
      await expect(costTrackingService.createLeadBatch(params)).rejects.toThrow('Total cost cannot be negative');
    });

    it('should throw error for zero or negative lead count', async () => {
      // Arrange
      const params: LeadBatchParams = {
        totalCost: 100,
        leadCount: 0,
        tenantId: 'tenant-1',
        userId: 'user-1'
      };

      // Act & Assert
      await expect(costTrackingService.createLeadBatch(params)).rejects.toThrow('Lead count must be greater than zero');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const params: LeadBatchParams = {
        totalCost: 100,
        leadCount: 10,
        tenantId: 'tenant-1',
        userId: 'user-1'
      };

      mockUnscopedPrisma.leadBatch.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(costTrackingService.createLeadBatch(params)).rejects.toThrow('Failed to create lead batch: Database error');
    });
  });

  describe('updateLeadBatchCost', () => {
    it('should update lead batch cost and recalculate cost per lead', async () => {
      // Arrange
      const batchId = 'batch-1';
      const newTotalCost = 150;
      const tenantId = 'tenant-1';

      const existingBatch = {
        id: 'batch-1',
        leadCount: 10,
        totalCost: 100,
        costPerLead: 10
      };

      const updatedBatch = {
        id: 'batch-1',
        totalCost: 150,
        leadCount: 10,
        costPerLead: 15,
        importedAt: new Date('2024-01-01')
      };

      mockUnscopedPrisma.leadBatch.findFirst.mockResolvedValue(existingBatch);
      mockUnscopedPrisma.leadBatch.update.mockResolvedValue(updatedBatch);

      // Act
      const result = await costTrackingService.updateLeadBatchCost(batchId, newTotalCost, tenantId);

      // Assert
      expect(mockUnscopedPrisma.leadBatch.update).toHaveBeenCalledWith({
        where: { id: batchId },
        data: {
          totalCost: 150,
          costPerLead: 15
        }
      });

      expect(result.costPerLead).toBe(15);
    });

    it('should throw error for non-existent batch', async () => {
      // Arrange
      mockUnscopedPrisma.leadBatch.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(costTrackingService.updateLeadBatchCost('batch-1', 100, 'tenant-1'))
        .rejects.toThrow('Lead batch batch-1 not found for tenant tenant-1');
    });
  });

  describe('getDefaultCosts', () => {
    it('should return tenant default costs', async () => {
      // Arrange
      const tenantId = 'tenant-1';
      const mockConfig = {
        defaultPackagingCost: 5,
        defaultPrintingCost: 3,
        defaultReturnCost: 10
      };

      mockUnscopedPrisma.tenantCostConfig.findUnique.mockResolvedValue(mockConfig);

      // Act
      const result = await costTrackingService.getDefaultCosts(tenantId);

      // Assert
      expect(result).toEqual({
        packagingCost: 5,
        printingCost: 3,
        returnCost: 10
      });
    });

    it('should return zero costs when no config exists', async () => {
      // Arrange
      mockUnscopedPrisma.tenantCostConfig.findUnique.mockResolvedValue(null);

      // Act
      const result = await costTrackingService.getDefaultCosts('tenant-1');

      // Assert
      expect(result).toEqual({
        packagingCost: 0,
        printingCost: 0,
        returnCost: 0
      });
    });

    it('should handle database errors and return zero costs', async () => {
      // Arrange
      mockUnscopedPrisma.tenantCostConfig.findUnique.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await costTrackingService.getDefaultCosts('tenant-1');

      // Assert
      expect(result).toEqual({
        packagingCost: 0,
        printingCost: 0,
        returnCost: 0
      });
    });
  });

  describe('applyDefaultCostsToOrder', () => {
    it('should apply default costs to order when no costs exist', async () => {
      // Arrange
      const orderId = 'order-1';
      const tenantId = 'tenant-1';

      mockScopedPrisma.orderCosts.findUnique.mockResolvedValue(null);
      mockUnscopedPrisma.tenantCostConfig.findUnique.mockResolvedValue({
        defaultPackagingCost: 5,
        defaultPrintingCost: 3,
        defaultReturnCost: 10
      });

      // Act
      await costTrackingService.applyDefaultCostsToOrder(orderId, tenantId);

      // Assert
      expect(mockScopedPrisma.orderCosts.create).toHaveBeenCalledWith({
        data: {
          orderId,
          packagingCost: 5,
          printingCost: 3,
          returnCost: 0,
          productCost: 0,
          leadCost: 0,
          totalCosts: 0,
          grossProfit: 0,
          netProfit: 0,
          profitMargin: 0
        }
      });
    });

    it('should not apply costs if order already has costs', async () => {
      // Arrange
      const orderId = 'order-1';
      const tenantId = 'tenant-1';

      mockScopedPrisma.orderCosts.findUnique.mockResolvedValue({
        id: 'cost-1',
        orderId,
        packagingCost: 10
      });

      // Act
      await costTrackingService.applyDefaultCostsToOrder(orderId, tenantId);

      // Assert
      expect(mockScopedPrisma.orderCosts.create).not.toHaveBeenCalled();
    });
  });

  describe('updateOrderCosts', () => {
    it('should update order costs with valid inputs', async () => {
      // Arrange
      const orderId = 'order-1';
      const tenantId = 'tenant-1';
      const costUpdates: OrderCostUpdate = {
        packagingCost: 8,
        printingCost: 4
      };

      // Act
      await costTrackingService.updateOrderCosts(orderId, tenantId, costUpdates);

      // Assert
      expect(mockScopedPrisma.orderCosts.upsert).toHaveBeenCalledWith({
        where: { orderId },
        create: {
          orderId,
          packagingCost: 8,
          printingCost: 4,
          returnCost: 0,
          productCost: 0,
          leadCost: 0,
          totalCosts: 0,
          grossProfit: 0,
          netProfit: 0,
          profitMargin: 0
        },
        update: {
          packagingCost: 8,
          printingCost: 4
        }
      });
    });

    it('should throw error for negative costs', async () => {
      // Arrange
      const costUpdates: OrderCostUpdate = {
        packagingCost: -5
      };

      // Act & Assert
      await expect(costTrackingService.updateOrderCosts('order-1', 'tenant-1', costUpdates))
        .rejects.toThrow('Invalid cost values: Packaging cost cannot be negative');
    });
  });

  describe('processReturnCosts', () => {
    it('should process return costs with provided cost', async () => {
      // Arrange
      const orderId = 'order-1';
      const tenantId = 'tenant-1';
      const returnCost = 15;

      // Act
      await costTrackingService.processReturnCosts(orderId, tenantId, returnCost);

      // Assert
      expect(mockScopedPrisma.orderCosts.upsert).toHaveBeenCalledWith({
        where: { orderId },
        create: {
          orderId,
          returnCost: 15,
          packagingCost: 0,
          printingCost: 0,
          productCost: 0,
          leadCost: 0,
          totalCosts: 0,
          grossProfit: 0,
          netProfit: 0,
          profitMargin: 0
        },
        update: {
          returnCost: 15
        }
      });
    });

    it('should use default return cost when none provided', async () => {
      // Arrange
      const orderId = 'order-1';
      const tenantId = 'tenant-1';

      mockUnscopedPrisma.tenantCostConfig.findUnique.mockResolvedValue({
        defaultReturnCost: 12
      });

      // Act
      await costTrackingService.processReturnCosts(orderId, tenantId);

      // Assert
      expect(mockScopedPrisma.orderCosts.upsert).toHaveBeenCalledWith({
        where: { orderId },
        create: expect.objectContaining({
          returnCost: 12
        }),
        update: {
          returnCost: 12
        }
      });
    });

    it('should throw error for negative return cost', async () => {
      // Act & Assert
      await expect(costTrackingService.processReturnCosts('order-1', 'tenant-1', -10))
        .rejects.toThrow('Return cost cannot be negative');
    });
  });

  describe('updateTenantCostConfig', () => {
    it('should update tenant cost configuration', async () => {
      // Arrange
      const tenantId = 'tenant-1';
      const config: TenantCostConfigUpdate = {
        defaultPackagingCost: 6,
        defaultPrintingCost: 4,
        defaultReturnCost: 12
      };

      // Act
      await costTrackingService.updateTenantCostConfig(tenantId, config);

      // Assert
      expect(mockUnscopedPrisma.tenantCostConfig.upsert).toHaveBeenCalledWith({
        where: { tenantId },
        create: {
          tenantId,
          defaultPackagingCost: 6,
          defaultPrintingCost: 4,
          defaultReturnCost: 12
        },
        update: {
          defaultPackagingCost: 6,
          defaultPrintingCost: 4,
          defaultReturnCost: 12
        }
      });
    });

    it('should throw error for negative default costs', async () => {
      // Arrange
      const config: TenantCostConfigUpdate = {
        defaultPackagingCost: -5
      };

      // Act & Assert
      await expect(costTrackingService.updateTenantCostConfig('tenant-1', config))
        .rejects.toThrow('Invalid cost configuration: Default packaging cost cannot be negative');
    });
  });

  describe('getLeadBatch', () => {
    it('should return lead batch information', async () => {
      // Arrange
      const batchId = 'batch-1';
      const tenantId = 'tenant-1';
      const mockBatch = {
        id: 'batch-1',
        totalCost: 100,
        leadCount: 10,
        costPerLead: 10,
        importedAt: new Date('2024-01-01')
      };

      mockUnscopedPrisma.leadBatch.findFirst.mockResolvedValue(mockBatch);

      // Act
      const result = await costTrackingService.getLeadBatch(batchId, tenantId);

      // Assert
      expect(result).toEqual({
        batchId: 'batch-1',
        totalCost: 100,
        leadCount: 10,
        costPerLead: 10,
        importDate: new Date('2024-01-01')
      });
    });

    it('should return null for non-existent batch', async () => {
      // Arrange
      mockUnscopedPrisma.leadBatch.findFirst.mockResolvedValue(null);

      // Act
      const result = await costTrackingService.getLeadBatch('batch-1', 'tenant-1');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getLeadBatches', () => {
    it('should return list of lead batches for tenant', async () => {
      // Arrange
      const tenantId = 'tenant-1';
      const mockBatches = [
        {
          id: 'batch-1',
          totalCost: 100,
          leadCount: 10,
          costPerLead: 10,
          importedAt: new Date('2024-01-01')
        },
        {
          id: 'batch-2',
          totalCost: 200,
          leadCount: 20,
          costPerLead: 10,
          importedAt: new Date('2024-01-02')
        }
      ];

      mockUnscopedPrisma.leadBatch.findMany.mockResolvedValue(mockBatches);

      // Act
      const result = await costTrackingService.getLeadBatches(tenantId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].batchId).toBe('batch-1');
      expect(result[1].batchId).toBe('batch-2');
    });

    it('should handle pagination parameters', async () => {
      // Arrange
      const tenantId = 'tenant-1';
      const limit = 10;
      const offset = 5;

      mockUnscopedPrisma.leadBatch.findMany.mockResolvedValue([]);

      // Act
      await costTrackingService.getLeadBatches(tenantId, limit, offset);

      // Assert
      expect(mockUnscopedPrisma.leadBatch.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: { importedAt: 'desc' },
        take: limit,
        skip: offset
      });
    });
  });

  describe('deleteLeadBatch', () => {
    it('should delete lead batch when no associated leads exist', async () => {
      // Arrange
      const batchId = 'batch-1';
      const tenantId = 'tenant-1';
      const mockBatch = {
        id: 'batch-1',
        tenantId: 'tenant-1',
        leads: []
      };

      mockUnscopedPrisma.leadBatch.findFirst.mockResolvedValue(mockBatch);

      // Act
      await costTrackingService.deleteLeadBatch(batchId, tenantId);

      // Assert
      expect(mockUnscopedPrisma.leadBatch.delete).toHaveBeenCalledWith({
        where: { id: batchId }
      });
    });

    it('should throw error when batch has associated leads', async () => {
      // Arrange
      const batchId = 'batch-1';
      const tenantId = 'tenant-1';
      const mockBatch = {
        id: 'batch-1',
        tenantId: 'tenant-1',
        leads: [{ id: 'lead-1' }]
      };

      mockUnscopedPrisma.leadBatch.findFirst.mockResolvedValue(mockBatch);

      // Act & Assert
      await expect(costTrackingService.deleteLeadBatch(batchId, tenantId))
        .rejects.toThrow('Cannot delete lead batch batch-1 as it has associated leads');
    });

    it('should throw error for non-existent batch', async () => {
      // Arrange
      mockUnscopedPrisma.leadBatch.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(costTrackingService.deleteLeadBatch('batch-1', 'tenant-1'))
        .rejects.toThrow('Lead batch batch-1 not found for tenant tenant-1');
    });
  });

  describe('calculateBatchCosts', () => {
    it('should calculate total costs for multiple orders', async () => {
      // Arrange
      const orderIds = ['order-1', 'order-2'];
      const tenantId = 'tenant-1';
      const mockCosts = [
        { orderId: 'order-1', totalCosts: 25 },
        { orderId: 'order-2', totalCosts: 30 }
      ];

      mockScopedPrisma.orderCosts.findMany.mockResolvedValue(mockCosts);

      // Act
      const result = await costTrackingService.calculateBatchCosts(orderIds, tenantId);

      // Assert
      expect(result).toEqual(mockCosts);
      expect(mockScopedPrisma.orderCosts.findMany).toHaveBeenCalledWith({
        where: {
          orderId: { in: orderIds }
        },
        select: {
          orderId: true,
          totalCosts: true
        }
      });
    });
  });
});