// src/lib/validation/cost-validation.ts

import { 
  CostValidationError, 
  BusinessRuleViolationError,
  ERROR_CODES,
  WARNING_THRESHOLDS,
  createWarningMessage
} from '../errors/profit-errors';
import { OrderStatus } from '@prisma/client';

/**
 * Comprehensive cost validation utilities
 * Requirement 1.4, 2.4, 3.4, 4.4: Add validation for negative costs and invalid data scenarios
 */

export interface CostValidationResult {
  isValid: boolean;
  errors: CostValidationError[];
  warnings: string[];
  sanitizedValue?: number;
}

export interface OrderCostValidationInput {
  packagingCost?: number;
  printingCost?: number;
  returnCost?: number;
  orderStatus?: OrderStatus;
  orderTotal?: number;
}

export interface LeadBatchValidationInput {
  totalCost: number;
  leadCount: number;
}

export interface TenantConfigValidationInput {
  defaultPackagingCost?: number;
  defaultPrintingCost?: number;
  defaultReturnCost?: number;
}

export interface ProductCostValidationInput {
  costPrice: number;
  sellingPrice?: number;
}

/**
 * Validate individual cost value
 */
export function validateCostValue(
  value: any,
  fieldName: string,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    allowZero?: boolean;
  } = {}
): CostValidationResult {
  const errors: CostValidationError[] = [];
  const warnings: string[] = [];
  
  // Check if value is provided when required
  if (options.required && (value === undefined || value === null)) {
    errors.push(new CostValidationError(
      `${fieldName} is required`,
      fieldName,
      value,
      { required: true }
    ));
    return { isValid: false, errors, warnings };
  }
  
  // If value is not provided and not required, return valid with zero
  if (value === undefined || value === null) {
    return { isValid: true, errors, warnings, sanitizedValue: 0 };
  }
  
  // Check data type
  if (typeof value !== 'number' && typeof value !== 'string') {
    errors.push(new CostValidationError(
      `${fieldName} must be a number`,
      fieldName,
      value,
      { expectedType: 'number' }
    ));
    return { isValid: false, errors, warnings };
  }
  
  // Convert to number if string
  let numValue: number;
  if (typeof value === 'string') {
    numValue = parseFloat(value);
    if (isNaN(numValue)) {
      errors.push(new CostValidationError(
        `${fieldName} must be a valid number`,
        fieldName,
        value,
        { expectedType: 'number' }
      ));
      return { isValid: false, errors, warnings };
    }
  } else {
    numValue = value;
  }
  
  // Check for infinite or NaN values
  if (!isFinite(numValue)) {
    errors.push(new CostValidationError(
      `${fieldName} must be a finite number`,
      fieldName,
      value,
      { mustBeFinite: true }
    ));
    return { isValid: false, errors, warnings };
  }
  
  // Check minimum value (default is 0 unless allowZero is false)
  const minValue = options.min !== undefined ? options.min : (options.allowZero === false ? 0.01 : 0);
  if (numValue < minValue) {
    errors.push(new CostValidationError(
      `${fieldName} cannot be less than ${minValue}`,
      fieldName,
      value,
      { min: minValue }
    ));
    return { isValid: false, errors, warnings };
  }
  
  // Check maximum value
  if (options.max !== undefined && numValue > options.max) {
    errors.push(new CostValidationError(
      `${fieldName} cannot be greater than ${options.max}`,
      fieldName,
      value,
      { max: options.max }
    ));
    return { isValid: false, errors, warnings };
  }
  
  // Generate warnings for unusually high values
  if (fieldName.toLowerCase().includes('return') && numValue > WARNING_THRESHOLDS.HIGH_RETURN_COST) {
    warnings.push(createWarningMessage('HIGH_RETURN_COST', numValue));
  } else if (fieldName.toLowerCase().includes('packaging') && numValue > WARNING_THRESHOLDS.HIGH_PACKAGING_COST) {
    warnings.push(createWarningMessage('HIGH_PACKAGING_COST', numValue));
  } else if (fieldName.toLowerCase().includes('printing') && numValue > WARNING_THRESHOLDS.HIGH_PRINTING_COST) {
    warnings.push(createWarningMessage('HIGH_PRINTING_COST', numValue));
  } else if (fieldName.toLowerCase().includes('lead') && numValue > WARNING_THRESHOLDS.HIGH_LEAD_COST) {
    warnings.push(createWarningMessage('HIGH_LEAD_COST', numValue));
  }
  
  return { isValid: true, errors, warnings, sanitizedValue: numValue };
}

/**
 * Validate order cost inputs
 */
export function validateOrderCosts(input: OrderCostValidationInput): {
  isValid: boolean;
  errors: CostValidationError[];
  warnings: string[];
  sanitizedCosts: {
    packagingCost: number;
    printingCost: number;
    returnCost: number;
  };
} {
  const errors: CostValidationError[] = [];
  const warnings: string[] = [];
  const sanitizedCosts = {
    packagingCost: 0,
    printingCost: 0,
    returnCost: 0,
  };
  
  // Validate packaging cost
  if (input.packagingCost !== undefined) {
    const packagingResult = validateCostValue(input.packagingCost, 'packagingCost', { max: 1000 });
    errors.push(...packagingResult.errors);
    warnings.push(...packagingResult.warnings);
    if (packagingResult.isValid && packagingResult.sanitizedValue !== undefined) {
      sanitizedCosts.packagingCost = packagingResult.sanitizedValue;
    }
  }
  
  // Validate printing cost
  if (input.printingCost !== undefined) {
    const printingResult = validateCostValue(input.printingCost, 'printingCost', { max: 500 });
    errors.push(...printingResult.errors);
    warnings.push(...printingResult.warnings);
    if (printingResult.isValid && printingResult.sanitizedValue !== undefined) {
      sanitizedCosts.printingCost = printingResult.sanitizedValue;
    }
  }
  
  // Validate return cost
  if (input.returnCost !== undefined) {
    const returnResult = validateCostValue(input.returnCost, 'returnCost', { max: 2000 });
    errors.push(...returnResult.errors);
    warnings.push(...returnResult.warnings);
    if (returnResult.isValid && returnResult.sanitizedValue !== undefined) {
      sanitizedCosts.returnCost = returnResult.sanitizedValue;
    }
    
    // Business rule: Return cost should only be applied to returned orders
    if (input.orderStatus && input.orderStatus !== OrderStatus.RETURNED && sanitizedCosts.returnCost > 0) {
      errors.push(new CostValidationError(
        'Return cost can only be applied to returned orders',
        'returnCost',
        input.returnCost,
        { orderStatus: input.orderStatus }
      ));
    }
  }
  
  // Validate total cost ratio if order total is provided
  if (input.orderTotal && input.orderTotal > 0) {
    const totalCosts = sanitizedCosts.packagingCost + sanitizedCosts.printingCost + sanitizedCosts.returnCost;
    const costRatio = totalCosts / input.orderTotal;
    
    if (costRatio > WARNING_THRESHOLDS.EXCESSIVE_COST_RATIO) {
      warnings.push(createWarningMessage('EXCESSIVE_COST_RATIO', costRatio));
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedCosts,
  };
}

/**
 * Validate lead batch cost inputs
 */
export function validateLeadBatchCosts(input: LeadBatchValidationInput): {
  isValid: boolean;
  errors: CostValidationError[];
  warnings: string[];
  sanitizedValues: {
    totalCost: number;
    leadCount: number;
    costPerLead: number;
  };
} {
  const errors: CostValidationError[] = [];
  const warnings: string[] = [];
  
  // Validate total cost
  const totalCostResult = validateCostValue(input.totalCost, 'totalCost', { 
    required: true, 
    max: 100000 
  });
  errors.push(...totalCostResult.errors);
  warnings.push(...totalCostResult.warnings);
  
  // Validate lead count
  const leadCountResult = validateCostValue(input.leadCount, 'leadCount', { 
    required: true, 
    min: 1, 
    max: 10000,
    allowZero: false 
  });
  errors.push(...leadCountResult.errors);
  warnings.push(...leadCountResult.warnings);
  
  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
      sanitizedValues: {
        totalCost: 0,
        leadCount: 0,
        costPerLead: 0,
      },
    };
  }
  
  const sanitizedTotalCost = totalCostResult.sanitizedValue!;
  const sanitizedLeadCount = leadCountResult.sanitizedValue!;
  const costPerLead = sanitizedTotalCost / sanitizedLeadCount;
  
  // Warn about high cost per lead
  if (costPerLead > WARNING_THRESHOLDS.HIGH_LEAD_COST) {
    warnings.push(createWarningMessage('HIGH_LEAD_COST', costPerLead));
  }
  
  return {
    isValid: true,
    errors,
    warnings,
    sanitizedValues: {
      totalCost: sanitizedTotalCost,
      leadCount: sanitizedLeadCount,
      costPerLead,
    },
  };
}

/**
 * Validate tenant cost configuration
 */
export function validateTenantCostConfig(input: TenantConfigValidationInput): {
  isValid: boolean;
  errors: CostValidationError[];
  warnings: string[];
  sanitizedConfig: {
    defaultPackagingCost: number;
    defaultPrintingCost: number;
    defaultReturnCost: number;
  };
} {
  const errors: CostValidationError[] = [];
  const warnings: string[] = [];
  const sanitizedConfig = {
    defaultPackagingCost: 0,
    defaultPrintingCost: 0,
    defaultReturnCost: 0,
  };
  
  // Validate default packaging cost
  if (input.defaultPackagingCost !== undefined) {
    const result = validateCostValue(input.defaultPackagingCost, 'defaultPackagingCost', { max: 1000 });
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    if (result.isValid && result.sanitizedValue !== undefined) {
      sanitizedConfig.defaultPackagingCost = result.sanitizedValue;
    }
  }
  
  // Validate default printing cost
  if (input.defaultPrintingCost !== undefined) {
    const result = validateCostValue(input.defaultPrintingCost, 'defaultPrintingCost', { max: 500 });
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    if (result.isValid && result.sanitizedValue !== undefined) {
      sanitizedConfig.defaultPrintingCost = result.sanitizedValue;
    }
  }
  
  // Validate default return cost
  if (input.defaultReturnCost !== undefined) {
    const result = validateCostValue(input.defaultReturnCost, 'defaultReturnCost', { max: 2000 });
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    if (result.isValid && result.sanitizedValue !== undefined) {
      sanitizedConfig.defaultReturnCost = result.sanitizedValue;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedConfig,
  };
}

/**
 * Validate product cost inputs
 */
export function validateProductCosts(input: ProductCostValidationInput): {
  isValid: boolean;
  errors: CostValidationError[];
  warnings: string[];
  sanitizedValues: {
    costPrice: number;
    markup?: number;
  };
} {
  const errors: CostValidationError[] = [];
  const warnings: string[] = [];
  
  // Validate cost price
  const costPriceResult = validateCostValue(input.costPrice, 'costPrice', { 
    required: true, 
    max: 50000 
  });
  errors.push(...costPriceResult.errors);
  warnings.push(...costPriceResult.warnings);
  
  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
      sanitizedValues: { costPrice: 0 },
    };
  }
  
  const sanitizedCostPrice = costPriceResult.sanitizedValue!;
  const sanitizedValues: { costPrice: number; markup?: number } = {
    costPrice: sanitizedCostPrice,
  };
  
  // Calculate markup if selling price is provided
  if (input.sellingPrice && input.sellingPrice > 0 && sanitizedCostPrice > 0) {
    const markup = ((input.sellingPrice - sanitizedCostPrice) / sanitizedCostPrice) * 100;
    sanitizedValues.markup = markup;
    
    // Warn about low markup
    if (markup < 50) {
      warnings.push(`Product markup of ${markup.toFixed(1)}% is relatively low. Consider reviewing pricing strategy.`);
    }
  }
  
  return {
    isValid: true,
    errors,
    warnings,
    sanitizedValues,
  };
}

/**
 * Validate profit calculation inputs
 */
export function validateProfitCalculationInputs(
  revenue: number,
  totalCosts: number
): {
  isValid: boolean;
  errors: CostValidationError[];
  warnings: string[];
  canCalculateMargin: boolean;
} {
  const errors: CostValidationError[] = [];
  const warnings: string[] = [];
  
  // Validate revenue
  const revenueResult = validateCostValue(revenue, 'revenue', { 
    required: true, 
    allowZero: false 
  });
  errors.push(...revenueResult.errors);
  
  // Validate total costs
  const costsResult = validateCostValue(totalCosts, 'totalCosts', { 
    required: true 
  });
  errors.push(...costsResult.errors);
  
  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
      canCalculateMargin: false,
    };
  }
  
  const canCalculateMargin = revenue > 0;
  
  if (!canCalculateMargin) {
    warnings.push('Cannot calculate profit margin with zero revenue');
  }
  
  // Calculate profit margin for warnings
  if (canCalculateMargin) {
    const netProfit = revenue - totalCosts;
    const profitMargin = (netProfit / revenue) * 100;
    
    if (profitMargin < WARNING_THRESHOLDS.NEGATIVE_PROFIT_MARGIN) {
      warnings.push(createWarningMessage('NEGATIVE_PROFIT_MARGIN', profitMargin));
    } else if (profitMargin < WARNING_THRESHOLDS.LOW_PROFIT_MARGIN) {
      warnings.push(createWarningMessage('LOW_PROFIT_MARGIN', profitMargin));
    }
  }
  
  return {
    isValid: true,
    errors,
    warnings,
    canCalculateMargin,
  };
}

/**
 * Sanitize and validate numeric input from user forms
 */
export function sanitizeNumericInput(value: any): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  if (typeof value === 'number') {
    return isFinite(value) ? Math.max(0, value) : 0;
  }
  
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isFinite(parsed) ? Math.max(0, parsed) : 0;
  }
  
  return 0;
}

/**
 * Validate business rules for order status transitions
 */
export function validateOrderStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  hasReturnCost: boolean = false
): {
  isValid: boolean;
  errors: BusinessRuleViolationError[];
  warnings: string[];
} {
  const errors: BusinessRuleViolationError[] = [];
  const warnings: string[] = [];
  
  // Return cost should only be applied when transitioning to RETURNED status
  if (hasReturnCost && newStatus !== OrderStatus.RETURNED) {
    errors.push(new BusinessRuleViolationError(
      'Return cost can only be applied when marking order as returned',
      'RETURN_COST_ON_ACTIVE_ORDER',
      { currentStatus, newStatus, hasReturnCost }
    ));
  }
  
  // Warn about status transitions that might affect profit calculations
  if (currentStatus === OrderStatus.RETURNED && newStatus !== OrderStatus.RETURNED) {
    warnings.push('Changing status from RETURNED may affect profit calculations. Return costs will be recalculated.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}