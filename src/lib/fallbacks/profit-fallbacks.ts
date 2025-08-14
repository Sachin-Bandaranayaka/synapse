// src/lib/fallbacks/profit-fallbacks.ts

import { ProfitBreakdown } from '../profit-calculation';
import { DefaultCosts } from '../cost-tracking';
import { 
  ProfitCalculationError, 
  DataIntegrityError,
  TenantConfigurationError,
  ERROR_CODES 
} from '../errors/profit-errors';
import { OrderStatus } from '@prisma/client';

/**
 * Fallback mechanisms for missing cost data and calculation failures
 * Requirement 1.4, 2.4, 3.4, 4.4: Create fallback mechanisms for missing cost data
 */

export interface FallbackContext {
  orderId: string;
  tenantId: string;
  orderStatus?: OrderStatus;
  orderTotal?: number;
  productId?: string;
  leadId?: string;
}

export interface FallbackResult<T> {
  value: T;
  usedFallback: boolean;
  fallbackReason: string;
  warnings: string[];
}

/**
 * Generate fallback profit breakdown when calculation fails
 */
export function generateFallbackProfitBreakdown(
  context: FallbackContext,
  error: Error
): FallbackResult<ProfitBreakdown> {
  const warnings: string[] = [];
  const fallbackReason = `Profit calculation failed: ${error.message}`;
  
  warnings.push('Unable to calculate accurate profit breakdown. Using estimated values.');
  warnings.push('Please review and update cost information when possible.');
  
  // Create basic fallback breakdown
  const revenue = context.orderTotal || 0;
  const estimatedCosts = estimateCostsFromRevenue(revenue);
  
  const fallbackBreakdown: ProfitBreakdown = {
    orderId: context.orderId,
    revenue,
    costs: {
      product: estimatedCosts.product,
      lead: estimatedCosts.lead,
      packaging: estimatedCosts.packaging,
      printing: estimatedCosts.printing,
      return: context.orderStatus === OrderStatus.RETURNED ? estimatedCosts.return : 0,
      total: estimatedCosts.total,
    },
    grossProfit: revenue - estimatedCosts.product,
    netProfit: revenue - estimatedCosts.total,
    profitMargin: revenue > 0 ? ((revenue - estimatedCosts.total) / revenue) * 100 : 0,
    isReturn: context.orderStatus === OrderStatus.RETURNED,
  };
  
  return {
    value: fallbackBreakdown,
    usedFallback: true,
    fallbackReason,
    warnings,
  };
}

/**
 * Generate fallback default costs when tenant configuration is missing
 */
export function generateFallbackDefaultCosts(
  tenantId: string,
  error?: Error
): FallbackResult<DefaultCosts> {
  const warnings: string[] = [];
  const fallbackReason = error 
    ? `Tenant configuration error: ${error.message}`
    : 'Tenant cost configuration not found';
  
  warnings.push('Using system default costs. Please configure tenant-specific defaults.');
  
  // Industry-standard fallback costs
  const fallbackCosts: DefaultCosts = {
    packagingCost: 5.00,   // Standard packaging cost
    printingCost: 2.50,    // Standard printing cost
    returnCost: 15.00,     // Standard return shipping cost
  };
  
  return {
    value: fallbackCosts,
    usedFallback: true,
    fallbackReason,
    warnings,
  };
}

/**
 * Generate fallback cost per lead when batch information is missing
 */
export function generateFallbackLeadCost(
  leadId: string,
  tenantId: string,
  error?: Error
): FallbackResult<number> {
  const warnings: string[] = [];
  const fallbackReason = error 
    ? `Lead batch error: ${error.message}`
    : 'Lead batch information not found';
  
  warnings.push('Lead acquisition cost unavailable. Using estimated cost.');
  warnings.push('Consider updating lead batch information for accurate profit calculations.');
  
  // Use industry average lead cost as fallback
  const fallbackLeadCost = 25.00; // Average lead acquisition cost
  
  return {
    value: fallbackLeadCost,
    usedFallback: true,
    fallbackReason,
    warnings,
  };
}

/**
 * Generate fallback product cost when product information is missing
 */
export function generateFallbackProductCost(
  productId: string,
  orderTotal: number,
  quantity: number = 1,
  error?: Error
): FallbackResult<number> {
  const warnings: string[] = [];
  const fallbackReason = error 
    ? `Product cost error: ${error.message}`
    : 'Product cost information not found';
  
  warnings.push('Product cost unavailable. Using estimated cost based on order total.');
  warnings.push('Please update product cost information for accurate profit calculations.');
  
  // Estimate product cost as 60% of order total (typical cost ratio)
  const estimatedCostRatio = 0.60;
  const fallbackProductCost = (orderTotal * estimatedCostRatio) / quantity;
  
  return {
    value: Math.max(0, fallbackProductCost),
    usedFallback: true,
    fallbackReason,
    warnings,
  };
}

/**
 * Estimate costs from revenue using industry averages
 */
function estimateCostsFromRevenue(revenue: number): {
  product: number;
  lead: number;
  packaging: number;
  printing: number;
  return: number;
  total: number;
} {
  // Industry-standard cost ratios
  const costRatios = {
    product: 0.60,    // 60% of revenue
    lead: 0.05,       // 5% of revenue
    packaging: 0.02,  // 2% of revenue
    printing: 0.01,   // 1% of revenue
    return: 0.03,     // 3% of revenue (when applicable)
  };
  
  const costs = {
    product: revenue * costRatios.product,
    lead: revenue * costRatios.lead,
    packaging: revenue * costRatios.packaging,
    printing: revenue * costRatios.printing,
    return: revenue * costRatios.return,
    total: 0,
  };
  
  costs.total = costs.product + costs.lead + costs.packaging + costs.printing;
  
  return costs;
}

/**
 * Repair inconsistent cost data
 */
export function repairInconsistentCostData(
  orderId: string,
  costs: {
    productCost?: number;
    leadCost?: number;
    packagingCost?: number;
    printingCost?: number;
    returnCost?: number;
    totalCosts?: number;
  },
  revenue: number
): FallbackResult<{
  productCost: number;
  leadCost: number;
  packagingCost: number;
  printingCost: number;
  returnCost: number;
  totalCosts: number;
}> {
  const warnings: string[] = [];
  const fallbackReason = 'Inconsistent cost data detected and repaired';
  
  // Sanitize individual costs
  const sanitizedCosts = {
    productCost: Math.max(0, costs.productCost || 0),
    leadCost: Math.max(0, costs.leadCost || 0),
    packagingCost: Math.max(0, costs.packagingCost || 0),
    printingCost: Math.max(0, costs.printingCost || 0),
    returnCost: Math.max(0, costs.returnCost || 0),
    totalCosts: 0,
  };
  
  // Recalculate total costs
  const calculatedTotal = sanitizedCosts.productCost + 
                         sanitizedCosts.leadCost + 
                         sanitizedCosts.packagingCost + 
                         sanitizedCosts.printingCost + 
                         sanitizedCosts.returnCost;
  
  // Check if provided total matches calculated total
  const providedTotal = costs.totalCosts || 0;
  const totalDifference = Math.abs(calculatedTotal - providedTotal);
  
  if (totalDifference > 0.01) { // Allow for small rounding differences
    warnings.push(`Total cost mismatch detected. Recalculated from individual costs.`);
    warnings.push(`Previous total: $${providedTotal.toFixed(2)}, Corrected total: $${calculatedTotal.toFixed(2)}`);
  }
  
  sanitizedCosts.totalCosts = calculatedTotal;
  
  // Validate costs against revenue
  if (calculatedTotal > revenue * 1.5) { // Costs shouldn't exceed 150% of revenue typically
    warnings.push(`Total costs (${calculatedTotal.toFixed(2)}) seem high relative to revenue (${revenue.toFixed(2)}). Please verify.`);
  }
  
  // Check for missing product cost (most critical)
  if (sanitizedCosts.productCost === 0 && revenue > 0) {
    const estimatedProductCost = revenue * 0.60; // Estimate as 60% of revenue
    sanitizedCosts.productCost = estimatedProductCost;
    sanitizedCosts.totalCosts = sanitizedCosts.leadCost + 
                               sanitizedCosts.packagingCost + 
                               sanitizedCosts.printingCost + 
                               sanitizedCosts.returnCost + 
                               estimatedProductCost;
    warnings.push(`Product cost was missing. Estimated as $${estimatedProductCost.toFixed(2)} based on revenue.`);
  }
  
  return {
    value: sanitizedCosts,
    usedFallback: warnings.length > 0,
    fallbackReason: warnings.length > 0 ? fallbackReason : 'No repairs needed',
    warnings,
  };
}

/**
 * Handle database connection failures with cached data
 */
export function handleDatabaseFailure<T>(
  operation: string,
  cachedData?: T,
  error?: Error
): FallbackResult<T | null> {
  const warnings: string[] = [];
  const fallbackReason = `Database operation failed: ${operation}`;
  
  if (error) {
    warnings.push(`Database error: ${error.message}`);
  }
  
  if (cachedData) {
    warnings.push('Using cached data. Information may not be current.');
    return {
      value: cachedData,
      usedFallback: true,
      fallbackReason,
      warnings,
    };
  }
  
  warnings.push('No cached data available. Operation failed.');
  return {
    value: null,
    usedFallback: true,
    fallbackReason,
    warnings,
  };
}

/**
 * Generate safe profit calculation when inputs are invalid
 */
export function generateSafeProfitCalculation(
  revenue: number,
  costs: Partial<{
    product: number;
    lead: number;
    packaging: number;
    printing: number;
    return: number;
  }> = {}
): FallbackResult<{
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  totalCosts: number;
}> {
  const warnings: string[] = [];
  const fallbackReason = 'Safe calculation with validated inputs';
  
  // Sanitize inputs
  const safeRevenue = Math.max(0, revenue || 0);
  const safeCosts = {
    product: Math.max(0, costs.product || 0),
    lead: Math.max(0, costs.lead || 0),
    packaging: Math.max(0, costs.packaging || 0),
    printing: Math.max(0, costs.printing || 0),
    return: Math.max(0, costs.return || 0),
  };
  
  const totalCosts = safeCosts.product + safeCosts.lead + safeCosts.packaging + safeCosts.printing + safeCosts.return;
  const grossProfit = safeRevenue - safeCosts.product;
  const netProfit = safeRevenue - totalCosts;
  
  let profitMargin = 0;
  if (safeRevenue > 0) {
    profitMargin = (netProfit / safeRevenue) * 100;
  } else {
    warnings.push('Cannot calculate profit margin with zero revenue');
  }
  
  // Check for potential issues
  if (totalCosts > safeRevenue) {
    warnings.push('Total costs exceed revenue. This order is operating at a loss.');
  }
  
  if (safeRevenue === 0 && totalCosts > 0) {
    warnings.push('Order has costs but no revenue. Please verify order data.');
  }
  
  return {
    value: {
      grossProfit,
      netProfit,
      profitMargin,
      totalCosts,
    },
    usedFallback: warnings.length > 0,
    fallbackReason: warnings.length > 0 ? fallbackReason : 'Normal calculation',
    warnings,
  };
}

/**
 * Create error recovery strategy based on error type
 */
export function createErrorRecoveryStrategy(error: Error): {
  canRecover: boolean;
  recoveryAction: string;
  fallbackAvailable: boolean;
  userAction?: string;
} {
  if (error instanceof ProfitCalculationError) {
    switch (error.code) {
      case ERROR_CODES.ORDER_NOT_FOUND:
        return {
          canRecover: false,
          recoveryAction: 'Order verification required',
          fallbackAvailable: false,
          userAction: 'Please verify the order exists and you have access to it.',
        };
      
      case ERROR_CODES.MISSING_COST_DATA:
        return {
          canRecover: true,
          recoveryAction: 'Use estimated costs',
          fallbackAvailable: true,
          userAction: 'Review and update cost information when possible.',
        };
      
      case ERROR_CODES.DIVISION_BY_ZERO:
        return {
          canRecover: true,
          recoveryAction: 'Skip margin calculation',
          fallbackAvailable: true,
          userAction: 'Ensure order has a valid total amount.',
        };
      
      default:
        return {
          canRecover: true,
          recoveryAction: 'Use fallback calculation',
          fallbackAvailable: true,
          userAction: 'Please try again or contact support if the issue persists.',
        };
    }
  }
  
  if (error instanceof DataIntegrityError) {
    return {
      canRecover: true,
      recoveryAction: 'Repair data inconsistencies',
      fallbackAvailable: true,
      userAction: 'Data has been automatically repaired. Please review the results.',
    };
  }
  
  if (error instanceof TenantConfigurationError) {
    return {
      canRecover: true,
      recoveryAction: 'Use system defaults',
      fallbackAvailable: true,
      userAction: 'Please configure tenant-specific cost defaults in settings.',
    };
  }
  
  // Generic error recovery
  return {
    canRecover: true,
    recoveryAction: 'Use safe fallback',
    fallbackAvailable: true,
    userAction: 'An error occurred. Please try again or contact support.',
  };
}