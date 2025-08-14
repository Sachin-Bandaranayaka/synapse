// src/lib/profit-calculation.ts

import { getScopedPrismaClient, prisma as unscopedPrisma } from './prisma';
import { OrderStatus, Prisma } from '@prisma/client';
import { 
  ProfitCalculationError, 
  DataIntegrityError,
  ERROR_CODES,
  getUserFriendlyErrorMessage,
  createWarningMessage,
  WARNING_THRESHOLDS
} from './errors/profit-errors';
import { 
  validateOrderCosts, 
  validateProfitCalculationInputs,
  validateOrderStatusTransition,
  sanitizeNumericInput
} from './validation/cost-validation';
import { 
  generateFallbackProfitBreakdown,
  generateFallbackDefaultCosts,
  generateFallbackLeadCost,
  generateFallbackProductCost,
  repairInconsistentCostData,
  generateSafeProfitCalculation,
  createErrorRecoveryStrategy,
  FallbackContext
} from './fallbacks/profit-fallbacks';
import { profitCache } from './profit-cache';
import { profitPerformanceMonitor, withPerformanceMonitoring } from './profit-performance-monitor';

export interface ProfitBreakdown {
  orderId: string;
  revenue: number;
  costs: {
    product: number;
    lead: number;
    packaging: number;
    printing: number;
    return: number;
    total: number;
  };
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  isReturn: boolean;
}

export interface OrderCostUpdate {
  packagingCost?: number;
  printingCost?: number;
  returnCost?: number;
}

export interface PeriodProfitParams {
  startDate: Date;
  endDate: Date;
  period: string;
  productId?: string;
  userId?: string;
  status?: OrderStatus;
}

export interface PeriodProfitReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    orderCount: number;
    returnCount: number;
  };
  breakdown: {
    productCosts: number;
    leadCosts: number;
    packagingCosts: number;
    printingCosts: number;
    returnCosts: number;
  };
  trends: ProfitTrend[];
}

export interface ProfitTrend {
  date: string;
  revenue: number;
  costs: number;
  profit: number;
  orderCount: number;
}

export class ProfitCalculationService {
  /**
   * Calculate comprehensive profit breakdown for an order
   */
  async calculateOrderProfit(orderId: string, tenantId: string): Promise<ProfitBreakdown> {
    return withPerformanceMonitoring(
      'calculateOrderProfit',
      async () => {
        // Check cache first
        const cachedProfit = profitCache.getOrderProfit(orderId, tenantId);
        if (cachedProfit) {
          profitPerformanceMonitor.startTimer('calculateOrderProfit')({
            tenantId,
            orderId,
            cacheHit: true,
          });
          return cachedProfit;
        }

        const prisma = getScopedPrismaClient(tenantId);
        const context: FallbackContext = { orderId, tenantId };
        
        try {
      // Validate inputs
      if (!orderId || typeof orderId !== 'string') {
        throw new ProfitCalculationError(
          'Invalid order ID provided',
          ERROR_CODES.INVALID_DATA_TYPE,
          orderId,
          tenantId
        );
      }

      if (!tenantId || typeof tenantId !== 'string') {
        throw new ProfitCalculationError(
          'Invalid tenant ID provided',
          ERROR_CODES.INVALID_DATA_TYPE,
          orderId,
          tenantId
        );
      }

      // Get order with all related data needed for profit calculation
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          product: true,
          lead: {
            include: {
              batch: true
            }
          },
          costs: true
        }
      });

      if (!order) {
        throw new ProfitCalculationError(
          `Order ${orderId} not found`,
          ERROR_CODES.ORDER_NOT_FOUND,
          orderId,
          tenantId
        );
      }

      // Update context with order information
      context.orderStatus = order.status;
      context.orderTotal = order.total;
      context.productId = order.productId;
      context.leadId = order.leadId;

      // Validate and sanitize revenue
      const revenue = sanitizeNumericInput(order.total);
      if (revenue <= 0) {
        throw new ProfitCalculationError(
          'Order total must be greater than zero',
          ERROR_CODES.INVALID_COST_RANGE,
          orderId,
          tenantId,
          { orderTotal: order.total }
        );
      }

      // Calculate product cost with fallback
      let productCost = 0;
      const warnings: string[] = [];

      try {
        if (!order.product) {
          throw new DataIntegrityError(
            'Product information missing',
            'product',
            order.productId,
            ['product']
          );
        }

        productCost = sanitizeNumericInput(order.product.costPrice) * sanitizeNumericInput(order.quantity);
        
        if (order.product.costPrice === 0) {
          warnings.push('Product cost price is not set. Profit calculations may be inaccurate.');
        }
      } catch (error) {
        const fallback = generateFallbackProductCost(order.productId, revenue, order.quantity, error as Error);
        productCost = fallback.value;
        warnings.push(...fallback.warnings);
      }

      // Calculate lead cost with fallback
      let leadCost = 0;
      try {
        if (order.lead?.batch && order.lead.batch.costPerLead > 0) {
          leadCost = sanitizeNumericInput(order.lead.batch.costPerLead);
        }
      } catch (error) {
        const fallback = generateFallbackLeadCost(order.leadId, tenantId, error as Error);
        leadCost = fallback.value;
        warnings.push(...fallback.warnings);
      }

      // Get operational costs with validation and fallbacks
      let packagingCost = 0;
      let printingCost = 0;
      let returnCost = 0;

      if (order.costs) {
        // Validate existing costs
        const costValidation = validateOrderCosts({
          packagingCost: order.costs.packagingCost,
          printingCost: order.costs.printingCost,
          returnCost: order.costs.returnCost,
          orderStatus: order.status,
          orderTotal: revenue
        });

        if (!costValidation.isValid) {
          warnings.push('Some cost values were invalid and have been corrected.');
          warnings.push(...costValidation.errors.map(e => getUserFriendlyErrorMessage(e)));
        }

        warnings.push(...costValidation.warnings);
        
        packagingCost = costValidation.sanitizedCosts.packagingCost;
        printingCost = costValidation.sanitizedCosts.printingCost;
        returnCost = costValidation.sanitizedCosts.returnCost;
      } else {
        // Apply default costs if no specific costs are set
        try {
          const defaultCosts = await this.getDefaultCosts(tenantId);
          packagingCost = defaultCosts.packagingCost;
          printingCost = defaultCosts.printingCost;
          if (order.status === OrderStatus.RETURNED) {
            returnCost = defaultCosts.returnCost;
          }
        } catch (error) {
          const fallback = generateFallbackDefaultCosts(tenantId, error as Error);
          packagingCost = fallback.value.packagingCost;
          printingCost = fallback.value.printingCost;
          if (order.status === OrderStatus.RETURNED) {
            returnCost = fallback.value.returnCost;
          }
          warnings.push(...fallback.warnings);
        }
      }

      // Calculate total costs
      const totalCosts = productCost + leadCost + packagingCost + printingCost + returnCost;

      // Validate profit calculation inputs
      const profitValidation = validateProfitCalculationInputs(revenue, totalCosts);
      if (!profitValidation.isValid) {
        throw new ProfitCalculationError(
          'Invalid profit calculation inputs',
          ERROR_CODES.INCONSISTENT_CALCULATION,
          orderId,
          tenantId,
          { revenue, totalCosts, errors: profitValidation.errors }
        );
      }
      warnings.push(...profitValidation.warnings);

      // Calculate profits using safe calculation
      const safeCalculation = generateSafeProfitCalculation(revenue, {
        product: productCost,
        lead: leadCost,
        packaging: packagingCost,
        printing: printingCost,
        return: returnCost
      });

      warnings.push(...safeCalculation.warnings);

      const breakdown: ProfitBreakdown = {
        orderId,
        revenue,
        costs: {
          product: productCost,
          lead: leadCost,
          packaging: packagingCost,
          printing: printingCost,
          return: returnCost,
          total: totalCosts
        },
        grossProfit: safeCalculation.value.grossProfit,
        netProfit: safeCalculation.value.netProfit,
        profitMargin: safeCalculation.value.profitMargin,
        isReturn: order.status === OrderStatus.RETURNED
      };

      // Update or create OrderCosts record with calculated values
      try {
        await this.updateOrderCosts(orderId, tenantId, {
          productCost,
          leadCost,
          packagingCost,
          printingCost,
          returnCost,
          totalCosts,
          grossProfit: breakdown.grossProfit,
          netProfit: breakdown.netProfit,
          profitMargin: breakdown.profitMargin
        });
      } catch (error) {
        // Don't fail the entire calculation if cost record update fails
        console.warn(`Failed to update OrderCosts for ${orderId}:`, error);
        warnings.push('Cost record update failed. Calculation is still valid.');
      }

      // Log warnings if any
      if (warnings.length > 0) {
        console.warn(`Profit calculation warnings for order ${orderId}:`, warnings);
      }

      // Cache the result before returning
      profitCache.setOrderProfit(orderId, tenantId, breakdown);

      return breakdown;
        } catch (error) {
          console.error(`Error calculating profit for order ${orderId}:`, error);
          
          // Determine if we can provide a fallback
          const recoveryStrategy = createErrorRecoveryStrategy(error as Error);
          
          if (recoveryStrategy.fallbackAvailable) {
            console.warn(`Using fallback profit calculation for order ${orderId}`);
            const fallback = generateFallbackProfitBreakdown(context, error as Error);
            
            // Log the fallback usage
            console.warn(`Fallback profit breakdown used for order ${orderId}:`, {
              reason: fallback.fallbackReason,
              warnings: fallback.warnings
            });
            
            return fallback.value;
          }
          
          // Re-throw with enhanced error information
          if (error instanceof ProfitCalculationError) {
            throw error;
          }
          
          throw new ProfitCalculationError(
            `Failed to calculate profit for order ${orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ERROR_CODES.CALCULATION_OVERFLOW,
            orderId,
            tenantId,
            { originalError: error }
          );
        }
      },
      { tenantId, orderId, cacheHit: false }
    );
  }

  /**
   * Recalculate profit when order status changes
   */
  async recalculateOnStatusChange(orderId: string, newStatus: OrderStatus, tenantId: string, returnCost?: number): Promise<ProfitBreakdown> {
    const prisma = getScopedPrismaClient(tenantId);

    try {
      // Validate inputs
      if (!orderId || !newStatus || !tenantId) {
        throw new ProfitCalculationError(
          'Missing required parameters for status change recalculation',
          ERROR_CODES.MISSING_REQUIRED_FIELD,
          orderId,
          tenantId,
          { newStatus, returnCost }
        );
      }

      // Get current order status for validation
      const currentOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true }
      });

      if (!currentOrder) {
        throw new ProfitCalculationError(
          `Order ${orderId} not found`,
          ERROR_CODES.ORDER_NOT_FOUND,
          orderId,
          tenantId
        );
      }

      // Validate status transition
      const statusValidation = validateOrderStatusTransition(
        currentOrder.status,
        newStatus,
        returnCost !== undefined && returnCost > 0
      );

      if (!statusValidation.isValid) {
        throw new ProfitCalculationError(
          statusValidation.errors[0].message,
          ERROR_CODES.INVALID_ORDER_STATUS_TRANSITION,
          orderId,
          tenantId,
          { currentStatus: currentOrder.status, newStatus, returnCost }
        );
      }

      // Validate return cost if provided
      if (returnCost !== undefined) {
        const costValidation = validateOrderCosts({
          returnCost,
          orderStatus: newStatus
        });

        if (!costValidation.isValid) {
          throw new ProfitCalculationError(
            costValidation.errors[0].message,
            ERROR_CODES.INVALID_COST_RANGE,
            orderId,
            tenantId,
            { returnCost, newStatus }
          );
        }
      }

      // If status is changing to RETURNED, update return cost
      if (newStatus === OrderStatus.RETURNED) {
        let finalReturnCost = 0;
        
        if (returnCost !== undefined) {
          finalReturnCost = sanitizeNumericInput(returnCost);
        } else {
          try {
            finalReturnCost = await this.getDefaultReturnCost(tenantId);
          } catch (error) {
            const fallback = generateFallbackDefaultCosts(tenantId, error as Error);
            finalReturnCost = fallback.value.returnCost;
            console.warn(`Using fallback return cost for order ${orderId}:`, fallback.warnings);
          }
        }
        
        try {
          await prisma.orderCosts.upsert({
            where: { orderId },
            create: {
              orderId,
              returnCost: finalReturnCost,
              productCost: 0,
              leadCost: 0,
              packagingCost: 0,
              printingCost: 0,
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
          console.warn(`Failed to update return cost for order ${orderId}:`, error);
          // Continue with recalculation even if cost update fails
        }
      } else if ((currentOrder.status as string) === 'RETURNED' && (newStatus as string) !== 'RETURNED') {
        // Clear return cost when changing from RETURNED status
        try {
          await prisma.orderCosts.update({
            where: { orderId },
            data: { returnCost: 0 }
          });
        } catch (error) {
          console.warn(`Failed to clear return cost for order ${orderId}:`, error);
        }
      }

      // Recalculate profit with new status
      return await this.calculateOrderProfit(orderId, tenantId);
    } catch (error) {
      console.error(`Error recalculating profit for order ${orderId} status change:`, error);
      
      if (error instanceof ProfitCalculationError) {
        throw error;
      }
      
      throw new ProfitCalculationError(
        `Failed to recalculate profit for order ${orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.CALCULATION_OVERFLOW,
        orderId,
        tenantId,
        { newStatus, returnCost, originalError: error }
      );
    }
  }

  /**
   * Update order costs with manual adjustments
   */
  async updateOrderCostsManually(orderId: string, tenantId: string, costUpdates: OrderCostUpdate): Promise<ProfitBreakdown> {
    const prisma = getScopedPrismaClient(tenantId);

    try {
      // Validate inputs
      if (!orderId || !tenantId || !costUpdates) {
        throw new ProfitCalculationError(
          'Missing required parameters for cost update',
          ERROR_CODES.MISSING_REQUIRED_FIELD,
          orderId,
          tenantId,
          { costUpdates }
        );
      }

      // Get order information for validation
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true, total: true }
      });

      if (!order) {
        throw new ProfitCalculationError(
          `Order ${orderId} not found`,
          ERROR_CODES.ORDER_NOT_FOUND,
          orderId,
          tenantId
        );
      }

      // Validate cost updates
      const costValidation = validateOrderCosts({
        packagingCost: costUpdates.packagingCost,
        printingCost: costUpdates.printingCost,
        returnCost: costUpdates.returnCost,
        orderStatus: order.status,
        orderTotal: order.total
      });

      if (!costValidation.isValid) {
        throw new ProfitCalculationError(
          `Invalid cost values: ${costValidation.errors.map(e => e.message).join(', ')}`,
          ERROR_CODES.INVALID_COST_RANGE,
          orderId,
          tenantId,
          { costUpdates, errors: costValidation.errors }
        );
      }

      // Log warnings if any
      if (costValidation.warnings.length > 0) {
        console.warn(`Cost update warnings for order ${orderId}:`, costValidation.warnings);
      }

      // Sanitize cost values
      const sanitizedCosts = {
        packagingCost: costUpdates.packagingCost !== undefined ? sanitizeNumericInput(costUpdates.packagingCost) : undefined,
        printingCost: costUpdates.printingCost !== undefined ? sanitizeNumericInput(costUpdates.printingCost) : undefined,
        returnCost: costUpdates.returnCost !== undefined ? sanitizeNumericInput(costUpdates.returnCost) : undefined,
      };

      // Update the specific cost fields
      try {
        await prisma.orderCosts.upsert({
          where: { orderId },
          create: {
            orderId,
            packagingCost: sanitizedCosts.packagingCost || 0,
            printingCost: sanitizedCosts.printingCost || 0,
            returnCost: sanitizedCosts.returnCost || 0,
            productCost: 0,
            leadCost: 0,
            totalCosts: 0,
            grossProfit: 0,
            netProfit: 0,
            profitMargin: 0
          },
          update: {
            ...(sanitizedCosts.packagingCost !== undefined && { packagingCost: sanitizedCosts.packagingCost }),
            ...(sanitizedCosts.printingCost !== undefined && { printingCost: sanitizedCosts.printingCost }),
            ...(sanitizedCosts.returnCost !== undefined && { returnCost: sanitizedCosts.returnCost })
          }
        });
      } catch (error) {
        throw new ProfitCalculationError(
          'Failed to update cost records in database',
          ERROR_CODES.DATABASE_ERROR,
          orderId,
          tenantId,
          { costUpdates: sanitizedCosts, originalError: error }
        );
      }

      // Recalculate profit with updated costs
      return await this.calculateOrderProfit(orderId, tenantId);
    } catch (error) {
      console.error(`Error updating order costs for ${orderId}:`, error);
      
      if (error instanceof ProfitCalculationError) {
        throw error;
      }
      
      throw new ProfitCalculationError(
        `Failed to update order costs for ${orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.DATABASE_ERROR,
        orderId,
        tenantId,
        { costUpdates, originalError: error }
      );
    }
  }

  /**
   * Get default costs for a tenant with enhanced error handling
   */
  private async getDefaultCosts(tenantId: string): Promise<{ packagingCost: number; printingCost: number; returnCost: number }> {
    try {
      if (!tenantId) {
        throw new ProfitCalculationError(
          'Tenant ID is required to get default costs',
          ERROR_CODES.MISSING_REQUIRED_FIELD,
          undefined,
          tenantId
        );
      }

      // Check cache first
      const cachedCosts = profitCache.getDefaultCosts(tenantId);
      if (cachedCosts) {
        return cachedCosts;
      }

      const costConfig = await unscopedPrisma.tenantCostConfig.findUnique({
        where: { tenantId }
      });

      if (!costConfig) {
        console.warn(`No cost configuration found for tenant ${tenantId}, using fallback defaults`);
        const fallback = generateFallbackDefaultCosts(tenantId);
        return fallback.value;
      }

      // Validate and sanitize the configuration values
      const sanitizedCosts = {
        packagingCost: sanitizeNumericInput(costConfig.defaultPackagingCost),
        printingCost: sanitizeNumericInput(costConfig.defaultPrintingCost),
        returnCost: sanitizeNumericInput(costConfig.defaultReturnCost)
      };

      // Cache the result
      profitCache.setDefaultCosts(tenantId, sanitizedCosts);

      return sanitizedCosts;
    } catch (error) {
      console.error(`Error getting default costs for tenant ${tenantId}:`, error);
      
      // Use fallback costs
      const fallback = generateFallbackDefaultCosts(tenantId, error as Error);
      console.warn(`Using fallback default costs for tenant ${tenantId}:`, fallback.warnings);
      
      return fallback.value;
    }
  }

  /**
   * Update OrderCosts record with calculated values
   */
  private async updateOrderCosts(
    orderId: string, 
    tenantId: string, 
    costs: {
      productCost: number;
      leadCost: number;
      packagingCost: number;
      printingCost: number;
      returnCost: number;
      totalCosts: number;
      grossProfit: number;
      netProfit: number;
      profitMargin: number;
    }
  ): Promise<void> {
    const prisma = getScopedPrismaClient(tenantId);

    try {
      await prisma.orderCosts.upsert({
        where: { orderId },
        create: {
          orderId,
          ...costs
        },
        update: costs
      });
      
      // Invalidate cache after updating costs
      profitCache.invalidateOrderProfit(orderId, tenantId);
    } catch (error) {
      console.error(`Error updating OrderCosts for ${orderId}:`, error);
      // Don't throw here as this is a secondary operation
    }
  }

  /**
   * Validate cost inputs with enhanced validation
   */
  static validateCosts(costs: Partial<OrderCostUpdate>): void {
    if (!costs || typeof costs !== 'object') {
      throw new ProfitCalculationError(
        'Cost data must be provided as an object',
        ERROR_CODES.INVALID_DATA_TYPE,
        undefined,
        undefined,
        { costs }
      );
    }

    const costValidation = validateOrderCosts(costs);
    
    if (!costValidation.isValid) {
      throw new ProfitCalculationError(
        `Invalid cost values: ${costValidation.errors.map(e => e.message).join(', ')}`,
        ERROR_CODES.INVALID_COST_RANGE,
        undefined,
        undefined,
        { costs, errors: costValidation.errors }
      );
    }

    // Log warnings if any
    if (costValidation.warnings.length > 0) {
      console.warn('Cost validation warnings:', costValidation.warnings);
    }
  }

  /**
   * Validate return cost with business rules
   */
  private validateReturnCost(returnCost: number): void {
    if (returnCost < 0) {
      throw new Error('Return cost cannot be negative');
    }
    
    if (returnCost > 10000) {
      throw new Error('Return cost exceeds maximum allowed amount');
    }
    
    // Additional business rule: Return cost should be reasonable
    if (returnCost > 1000) {
      console.warn(`High return cost detected: $${returnCost}. Please verify this amount is correct.`);
    }
  }

  /**
   * Get default return cost for tenant
   */
  private async getDefaultReturnCost(tenantId: string): Promise<number> {
    try {
      const defaults = await this.getDefaultCosts(tenantId);
      return defaults.returnCost;
    } catch (error) {
      console.error(`Error getting default return cost for tenant ${tenantId}:`, error);
      return 0;
    }
  }

  /**
   * Get profit breakdown for multiple orders (for reporting)
   */
  async calculateMultipleOrderProfits(orderIds: string[], tenantId: string): Promise<ProfitBreakdown[]> {
    const results: ProfitBreakdown[] = [];
    
    for (const orderId of orderIds) {
      try {
        const breakdown = await this.calculateOrderProfit(orderId, tenantId);
        results.push(breakdown);
      } catch (error) {
        console.error(`Error calculating profit for order ${orderId}:`, error);
        // Continue with other orders, don't fail the entire batch
      }
    }
    
    return results;
  }

  /**
   * Calculate period-based profit with filters
   */
  async calculatePeriodProfit(params: PeriodProfitParams, tenantId: string): Promise<PeriodProfitReport> {
    return withPerformanceMonitoring(
      'calculatePeriodProfit',
      async () => {
        // Check cache first
        const cacheKey = profitCache.generateReportKey(
          tenantId,
          params.startDate,
          params.endDate,
          params.period,
          {
            productId: params.productId,
            userId: params.userId,
            status: params.status,
          }
        );
        
        const cachedReport = profitCache.getReport(cacheKey);
        if (cachedReport) {
          profitPerformanceMonitor.startTimer('calculatePeriodProfit')({
            tenantId,
            cacheHit: true,
          });
          return cachedReport;
        }

    const prisma = getScopedPrismaClient(tenantId);

    try {
      // Build optimized where clause for filtering
      const whereClause: any = {
        createdAt: {
          gte: params.startDate,
          lte: params.endDate,
        },
      };

      if (params.productId) {
        whereClause.productId = params.productId;
      }

      if (params.userId) {
        whereClause.userId = params.userId; // Direct user reference instead of nested lead query
      }

      if (params.status) {
        whereClause.status = params.status;
      }

      // Use optimized query with selective includes and proper indexing
      const orders = await prisma.order.findMany({
        where: whereClause,
        select: {
          id: true,
          createdAt: true,
          status: true,
          total: true,
          quantity: true,
          discount: true,
          product: {
            select: {
              costPrice: true,
            },
          },
          lead: {
            select: {
              batch: {
                select: {
                  costPerLead: true,
                },
              },
            },
          },
          costs: {
            select: {
              productCost: true,
              leadCost: true,
              packagingCost: true,
              printingCost: true,
              returnCost: true,
              totalCosts: true,
              grossProfit: true,
              netProfit: true,
              profitMargin: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Try to use pre-calculated costs from OrderCosts table when available
      const orderProfits: ProfitBreakdown[] = [];
      const ordersNeedingCalculation: typeof orders = [];

      for (const order of orders) {
        if (order.costs && order.costs.netProfit !== null) {
          // Use pre-calculated values
          orderProfits.push({
            orderId: order.id,
            revenue: order.total,
            costs: {
              product: order.costs.productCost,
              lead: order.costs.leadCost,
              packaging: order.costs.packagingCost,
              printing: order.costs.printingCost,
              return: order.costs.returnCost,
              total: order.costs.totalCosts,
            },
            grossProfit: order.costs.grossProfit,
            netProfit: order.costs.netProfit,
            profitMargin: order.costs.profitMargin,
            isReturn: order.status === OrderStatus.RETURNED,
          });
        } else {
          ordersNeedingCalculation.push(order);
        }
      }

      // Calculate profits for orders without pre-calculated costs
      if (ordersNeedingCalculation.length > 0) {
        const calculatedProfits = await Promise.all(
          ordersNeedingCalculation.map(async (order) => {
            try {
              return await this.calculateOrderProfit(order.id, tenantId);
            } catch (error) {
              console.error(`Error calculating profit for order ${order.id}:`, error);
              return null;
            }
          })
        );

        orderProfits.push(...calculatedProfits.filter(Boolean) as ProfitBreakdown[]);
      }

      // Calculate summary statistics
      const summary = {
        totalRevenue: orderProfits.reduce((sum, profit) => sum + profit.revenue, 0),
        totalCosts: orderProfits.reduce((sum, profit) => sum + profit.costs.total, 0),
        netProfit: orderProfits.reduce((sum, profit) => sum + profit.netProfit, 0),
        profitMargin: 0,
        orderCount: orderProfits.length,
        returnCount: orderProfits.filter(profit => profit.isReturn).length,
      };

      summary.profitMargin = summary.totalRevenue > 0 ? (summary.netProfit / summary.totalRevenue) * 100 : 0;

      // Calculate cost breakdown
      const breakdown = {
        productCosts: orderProfits.reduce((sum, profit) => sum + profit.costs.product, 0),
        leadCosts: orderProfits.reduce((sum, profit) => sum + profit.costs.lead, 0),
        packagingCosts: orderProfits.reduce((sum, profit) => sum + profit.costs.packaging, 0),
        printingCosts: orderProfits.reduce((sum, profit) => sum + profit.costs.printing, 0),
        returnCosts: orderProfits.reduce((sum, profit) => sum + profit.costs.return, 0),
      };

      // Generate trend data using optimized approach
      const trends = this.generateOptimizedTrendData(orders, orderProfits, params.period, params.startDate, params.endDate);

      const report: PeriodProfitReport = {
        period: {
          start: params.startDate,
          end: params.endDate,
        },
        summary,
        breakdown,
        trends,
      };

      // Cache the result
      profitCache.setReport(cacheKey, report);

      return report;
        } catch (error) {
          console.error('Error calculating period profit:', error);
          throw new Error(`Failed to calculate period profit: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      },
      { tenantId, recordCount: 0, cacheHit: false }
    );
  }

  /**
   * Generate trend data for profit reporting
   */
  private generateTrendData(
    orders: any[],
    profits: ProfitBreakdown[],
    period: string,
    startDate: Date,
    endDate: Date
  ): ProfitTrend[] {
    const trends: ProfitTrend[] = [];

    // Group data by date based on period
    const groupedData = new Map<string, {
      revenue: number;
      costs: number;
      profit: number;
      orderCount: number;
    }>();

    orders.forEach((order, index) => {
      const profit = profits[index];
      if (!profit) return;

      const orderDate = new Date(order.createdAt);
      let dateKey: string;

      switch (period) {
        case 'daily':
          dateKey = orderDate.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(orderDate);
          weekStart.setDate(orderDate.getDate() - orderDate.getDay());
          dateKey = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
        default:
          dateKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!groupedData.has(dateKey)) {
        groupedData.set(dateKey, {
          revenue: 0,
          costs: 0,
          profit: 0,
          orderCount: 0,
        });
      }

      const data = groupedData.get(dateKey)!;
      data.revenue += profit.revenue;
      data.costs += profit.costs.total;
      data.profit += profit.netProfit;
      data.orderCount += 1;
    });

    // Convert to array and sort by date
    for (const [date, data] of groupedData.entries()) {
      trends.push({
        date,
        ...data,
      });
    }

    trends.sort((a, b) => a.date.localeCompare(b.date));

    return trends;
  }

  /**
   * Generate optimized trend data using profit breakdown data directly
   */
  private generateOptimizedTrendData(
    orders: any[],
    profits: ProfitBreakdown[],
    period: string,
    startDate: Date,
    endDate: Date
  ): ProfitTrend[] {
    // Create a map for faster lookup
    const profitMap = new Map<string, ProfitBreakdown>();
    profits.forEach(profit => profitMap.set(profit.orderId, profit));

    // Group data by date based on period
    const groupedData = new Map<string, {
      revenue: number;
      costs: number;
      profit: number;
      orderCount: number;
    }>();

    orders.forEach((order) => {
      const profit = profitMap.get(order.id);
      if (!profit) return;

      const orderDate = new Date(order.createdAt);
      let dateKey: string;

      switch (period) {
        case 'daily':
          dateKey = orderDate.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(orderDate);
          weekStart.setDate(orderDate.getDate() - orderDate.getDay());
          dateKey = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
        default:
          dateKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!groupedData.has(dateKey)) {
        groupedData.set(dateKey, {
          revenue: 0,
          costs: 0,
          profit: 0,
          orderCount: 0,
        });
      }

      const data = groupedData.get(dateKey)!;
      data.revenue += profit.revenue;
      data.costs += profit.costs.total;
      data.profit += profit.netProfit;
      data.orderCount += 1;
    });

    // Convert to array and sort by date
    const trends: ProfitTrend[] = [];
    for (const [date, data] of groupedData.entries()) {
      trends.push({
        date,
        ...data,
      });
    }

    trends.sort((a, b) => a.date.localeCompare(b.date));

    return trends;
  }
}

// Export singleton instance
export const profitCalculationService = new ProfitCalculationService();