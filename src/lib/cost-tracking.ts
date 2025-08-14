// src/lib/cost-tracking.ts

import { getScopedPrismaClient, prisma as unscopedPrisma } from './prisma';
import { Prisma } from '@prisma/client';
import { 
  ProfitCalculationError, 
  CostValidationError,
  DataIntegrityError,
  ERROR_CODES,
  getUserFriendlyErrorMessage
} from './errors/profit-errors';
import { 
  validateLeadBatchCosts,
  validateOrderCosts,
  validateTenantCostConfig,
  sanitizeNumericInput
} from './validation/cost-validation';
import { 
  generateFallbackDefaultCosts,
  repairInconsistentCostData,
  createErrorRecoveryStrategy
} from './fallbacks/profit-fallbacks';

export interface LeadBatchParams {
  totalCost: number;
  leadCount: number;
  tenantId: string;
  userId: string;
}

export interface LeadBatchCost {
  batchId: string;
  totalCost: number;
  leadCount: number;
  costPerLead: number;
  importDate: Date;
}

export interface DefaultCosts {
  packagingCost: number;
  printingCost: number;
  returnCost: number;
}

export interface OrderCostUpdate {
  packagingCost?: number;
  printingCost?: number;
  returnCost?: number;
}

export interface TenantCostConfigUpdate {
  defaultPackagingCost?: number;
  defaultPrintingCost?: number;
  defaultReturnCost?: number;
}

export class CostTrackingService {
  /**
   * Create a lead batch with cost distribution
   * Requirement 2.2: Calculate cost per lead when leads are imported with a cost
   */
  async createLeadBatch(params: LeadBatchParams): Promise<LeadBatchCost> {
    const { totalCost, leadCount, tenantId, userId } = params;

    try {
      // Validate inputs
      if (!tenantId || !userId) {
        throw new CostValidationError(
          'Tenant ID and User ID are required',
          'tenantId,userId',
          { tenantId, userId }
        );
      }

      // Validate lead batch costs
      const validation = validateLeadBatchCosts({ totalCost, leadCount });
      
      if (!validation.isValid) {
        throw new CostValidationError(
          `Invalid lead batch parameters: ${validation.errors.map(e => e.message).join(', ')}`,
          'leadBatch',
          { totalCost, leadCount },
          { errors: validation.errors }
        );
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Lead batch creation warnings:', validation.warnings);
      }

      const sanitizedValues = validation.sanitizedValues;

      const leadBatch = await unscopedPrisma.leadBatch.create({
        data: {
          totalCost: sanitizedValues.totalCost,
          leadCount: sanitizedValues.leadCount,
          costPerLead: sanitizedValues.costPerLead,
          tenantId,
          userId
        }
      });

      return {
        batchId: leadBatch.id,
        totalCost: leadBatch.totalCost,
        leadCount: leadBatch.leadCount,
        costPerLead: leadBatch.costPerLead,
        importDate: leadBatch.importedAt
      };
    } catch (error) {
      console.error('Error creating lead batch:', error);
      
      if (error instanceof CostValidationError) {
        throw error;
      }
      
      throw new ProfitCalculationError(
        `Failed to create lead batch: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.DATABASE_ERROR,
        undefined,
        tenantId,
        { params, originalError: error }
      );
    }
  }

  /**
   * Update lead batch cost distribution
   */
  async updateLeadBatchCost(batchId: string, totalCost: number, tenantId: string): Promise<LeadBatchCost> {
    if (totalCost < 0) {
      throw new Error('Total cost cannot be negative');
    }

    try {
      const existingBatch = await unscopedPrisma.leadBatch.findFirst({
        where: { 
          id: batchId,
          tenantId 
        }
      });

      if (!existingBatch) {
        throw new Error(`Lead batch ${batchId} not found for tenant ${tenantId}`);
      }

      const costPerLead = existingBatch.leadCount > 0 ? totalCost / existingBatch.leadCount : 0;

      const updatedBatch = await unscopedPrisma.leadBatch.update({
        where: { id: batchId },
        data: {
          totalCost,
          costPerLead
        }
      });

      return {
        batchId: updatedBatch.id,
        totalCost: updatedBatch.totalCost,
        leadCount: updatedBatch.leadCount,
        costPerLead: updatedBatch.costPerLead,
        importDate: updatedBatch.importedAt
      };
    } catch (error) {
      console.error(`Error updating lead batch ${batchId}:`, error);
      throw new Error(`Failed to update lead batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get default costs for a tenant
   * Requirement 7.2: Apply default cost values per tenant
   */
  async getDefaultCosts(tenantId: string): Promise<DefaultCosts> {
    try {
      const costConfig = await unscopedPrisma.tenantCostConfig.findUnique({
        where: { tenantId }
      });

      return {
        packagingCost: costConfig?.defaultPackagingCost || 0,
        printingCost: costConfig?.defaultPrintingCost || 0,
        returnCost: costConfig?.defaultReturnCost || 0
      };
    } catch (error) {
      console.error(`Error getting default costs for tenant ${tenantId}:`, error);
      // Return zero costs as fallback
      return {
        packagingCost: 0,
        printingCost: 0,
        returnCost: 0
      };
    }
  }

  /**
   * Apply default costs from tenant configuration to an order
   * Requirement 3.1: Use configurable default values per tenant when no costs are specified
   */
  async applyDefaultCostsToOrder(orderId: string, tenantId: string): Promise<void> {
    const prisma = getScopedPrismaClient(tenantId);

    try {
      // Check if order already has costs defined
      const existingCosts = await prisma.orderCosts.findUnique({
        where: { orderId }
      });

      // Only apply defaults if no costs exist yet
      if (!existingCosts) {
        const defaultCosts = await this.getDefaultCosts(tenantId);

        await prisma.orderCosts.create({
          data: {
            orderId,
            packagingCost: defaultCosts.packagingCost,
            printingCost: defaultCosts.printingCost,
            returnCost: 0, // Return cost is only applied when order is actually returned
            productCost: 0, // Will be calculated by profit service
            leadCost: 0, // Will be calculated by profit service
            totalCosts: 0, // Will be calculated by profit service
            grossProfit: 0, // Will be calculated by profit service
            netProfit: 0, // Will be calculated by profit service
            profitMargin: 0 // Will be calculated by profit service
          }
        });
      }
    } catch (error) {
      console.error(`Error applying default costs to order ${orderId}:`, error);
      throw new Error(`Failed to apply default costs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update order costs with manual adjustments
   * Requirement 3.1: Provide fields to enter packaging cost and printing cost
   */
  async updateOrderCosts(orderId: string, tenantId: string, costUpdates: OrderCostUpdate): Promise<void> {
    const prisma = getScopedPrismaClient(tenantId);

    // Validate cost inputs
    this.validateCostInputs(costUpdates);

    try {
      await prisma.orderCosts.upsert({
        where: { orderId },
        create: {
          orderId,
          packagingCost: costUpdates.packagingCost || 0,
          printingCost: costUpdates.printingCost || 0,
          returnCost: costUpdates.returnCost || 0,
          productCost: 0,
          leadCost: 0,
          totalCosts: 0,
          grossProfit: 0,
          netProfit: 0,
          profitMargin: 0
        },
        update: {
          ...(costUpdates.packagingCost !== undefined && { packagingCost: costUpdates.packagingCost }),
          ...(costUpdates.printingCost !== undefined && { printingCost: costUpdates.printingCost }),
          ...(costUpdates.returnCost !== undefined && { returnCost: costUpdates.returnCost })
        }
      });
    } catch (error) {
      console.error(`Error updating order costs for ${orderId}:`, error);
      throw new Error(`Failed to update order costs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process return costs when an order is marked as returned
   * Requirement 4.1: Prompt for return shipping cost when marking order as returned
   */
  async processReturnCosts(orderId: string, tenantId: string, returnCost?: number): Promise<void> {
    const prisma = getScopedPrismaClient(tenantId);

    try {
      // If no return cost provided, use default
      let finalReturnCost = returnCost;
      if (finalReturnCost === undefined) {
        const defaultCosts = await this.getDefaultCosts(tenantId);
        finalReturnCost = defaultCosts.returnCost;
      }

      // Validate return cost
      if (finalReturnCost < 0) {
        throw new Error('Return cost cannot be negative');
      }

      // Update or create order costs with return cost
      await prisma.orderCosts.upsert({
        where: { orderId },
        create: {
          orderId,
          returnCost: finalReturnCost,
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
          returnCost: finalReturnCost
        }
      });
    } catch (error) {
      console.error(`Error processing return costs for order ${orderId}:`, error);
      throw new Error(`Failed to process return costs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update tenant cost configuration
   * Requirement 7.1: Provide fields for default costs per tenant
   */
  async updateTenantCostConfig(tenantId: string, config: TenantCostConfigUpdate): Promise<void> {
    // Validate cost inputs
    this.validateTenantCostConfig(config);

    try {
      await unscopedPrisma.tenantCostConfig.upsert({
        where: { tenantId },
        create: {
          tenantId,
          defaultPackagingCost: config.defaultPackagingCost || 0,
          defaultPrintingCost: config.defaultPrintingCost || 0,
          defaultReturnCost: config.defaultReturnCost || 0
        },
        update: {
          ...(config.defaultPackagingCost !== undefined && { defaultPackagingCost: config.defaultPackagingCost }),
          ...(config.defaultPrintingCost !== undefined && { defaultPrintingCost: config.defaultPrintingCost }),
          ...(config.defaultReturnCost !== undefined && { defaultReturnCost: config.defaultReturnCost })
        }
      });
    } catch (error) {
      console.error(`Error updating tenant cost config for ${tenantId}:`, error);
      throw new Error(`Failed to update tenant cost configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get lead batch information including cost distribution
   */
  async getLeadBatch(batchId: string, tenantId: string): Promise<LeadBatchCost | null> {
    try {
      const batch = await unscopedPrisma.leadBatch.findFirst({
        where: { 
          id: batchId,
          tenantId 
        }
      });

      if (!batch) {
        return null;
      }

      return {
        batchId: batch.id,
        totalCost: batch.totalCost,
        leadCount: batch.leadCount,
        costPerLead: batch.costPerLead,
        importDate: batch.importedAt
      };
    } catch (error) {
      console.error(`Error getting lead batch ${batchId}:`, error);
      throw new Error(`Failed to get lead batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all lead batches for a tenant
   */
  async getLeadBatches(tenantId: string, limit?: number, offset?: number): Promise<LeadBatchCost[]> {
    try {
      const batches = await unscopedPrisma.leadBatch.findMany({
        where: { tenantId },
        orderBy: { importedAt: 'desc' },
        take: limit,
        skip: offset
      });

      return batches.map(batch => ({
        batchId: batch.id,
        totalCost: batch.totalCost,
        leadCount: batch.leadCount,
        costPerLead: batch.costPerLead,
        importDate: batch.importedAt
      }));
    } catch (error) {
      console.error(`Error getting lead batches for tenant ${tenantId}:`, error);
      throw new Error(`Failed to get lead batches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get order costs for a specific order
   */
  async getOrderCosts(orderId: string, tenantId: string): Promise<any> {
    const prisma = getScopedPrismaClient(tenantId);

    try {
      const costs = await prisma.orderCosts.findUnique({
        where: { orderId }
      });

      return costs;
    } catch (error) {
      console.error(`Error getting order costs for ${orderId}:`, error);
      throw new Error(`Failed to get order costs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate cost inputs
   */
  private validateCostInputs(costs: OrderCostUpdate): void {
    const errors: string[] = [];

    if (costs.packagingCost !== undefined && costs.packagingCost < 0) {
      errors.push('Packaging cost cannot be negative');
    }
    if (costs.printingCost !== undefined && costs.printingCost < 0) {
      errors.push('Printing cost cannot be negative');
    }
    if (costs.returnCost !== undefined && costs.returnCost < 0) {
      errors.push('Return cost cannot be negative');
    }

    if (errors.length > 0) {
      throw new Error(`Invalid cost values: ${errors.join(', ')}`);
    }
  }

  /**
   * Validate tenant cost configuration
   */
  private validateTenantCostConfig(config: TenantCostConfigUpdate): void {
    const errors: string[] = [];

    if (config.defaultPackagingCost !== undefined && config.defaultPackagingCost < 0) {
      errors.push('Default packaging cost cannot be negative');
    }
    if (config.defaultPrintingCost !== undefined && config.defaultPrintingCost < 0) {
      errors.push('Default printing cost cannot be negative');
    }
    if (config.defaultReturnCost !== undefined && config.defaultReturnCost < 0) {
      errors.push('Default return cost cannot be negative');
    }

    if (errors.length > 0) {
      throw new Error(`Invalid cost configuration: ${errors.join(', ')}`);
    }
  }

  /**
   * Calculate total costs for multiple orders (for reporting)
   */
  async calculateBatchCosts(orderIds: string[], tenantId: string): Promise<{ orderId: string; totalCosts: number }[]> {
    const prisma = getScopedPrismaClient(tenantId);

    try {
      const costs = await prisma.orderCosts.findMany({
        where: {
          orderId: { in: orderIds }
        },
        select: {
          orderId: true,
          totalCosts: true
        }
      });

      return costs;
    } catch (error) {
      console.error(`Error calculating batch costs for tenant ${tenantId}:`, error);
      throw new Error(`Failed to calculate batch costs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete lead batch (for cleanup operations)
   */
  async deleteLeadBatch(batchId: string, tenantId: string): Promise<void> {
    try {
      // First check if batch exists and belongs to tenant
      const batch = await unscopedPrisma.leadBatch.findFirst({
        where: { 
          id: batchId,
          tenantId 
        },
        include: {
          leads: true
        }
      });

      if (!batch) {
        throw new Error(`Lead batch ${batchId} not found for tenant ${tenantId}`);
      }

      // Check if batch has associated leads
      if (batch.leads.length > 0) {
        throw new Error(`Cannot delete lead batch ${batchId} as it has associated leads`);
      }

      await unscopedPrisma.leadBatch.delete({
        where: { id: batchId }
      });
    } catch (error) {
      console.error(`Error deleting lead batch ${batchId}:`, error);
      throw new Error(`Failed to delete lead batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const costTrackingService = new CostTrackingService();