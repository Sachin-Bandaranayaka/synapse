// src/lib/errors/profit-errors.ts

/**
 * Custom error classes for profit calculation system
 * Requirement 1.4, 2.4, 3.4, 4.4: Comprehensive error handling
 */

export class ProfitCalculationError extends Error {
  public readonly code: string;
  public readonly orderId?: string;
  public readonly tenantId?: string;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    orderId?: string,
    tenantId?: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ProfitCalculationError';
    this.code = code;
    this.orderId = orderId;
    this.tenantId = tenantId;
    this.context = context;
  }
}

export class CostValidationError extends Error {
  public readonly code: string;
  public readonly field: string;
  public readonly value: any;
  public readonly constraints: Record<string, any>;

  constructor(
    message: string,
    field: string,
    value: any,
    constraints: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'CostValidationError';
    this.code = 'COST_VALIDATION_ERROR';
    this.field = field;
    this.value = value;
    this.constraints = constraints;
  }
}

export class DataIntegrityError extends Error {
  public readonly code: string;
  public readonly entityType: string;
  public readonly entityId: string;
  public readonly missingFields: string[];

  constructor(
    message: string,
    entityType: string,
    entityId: string,
    missingFields: string[] = []
  ) {
    super(message);
    this.name = 'DataIntegrityError';
    this.code = 'DATA_INTEGRITY_ERROR';
    this.entityType = entityType;
    this.entityId = entityId;
    this.missingFields = missingFields;
  }
}

export class BusinessRuleViolationError extends Error {
  public readonly code: string;
  public readonly rule: string;
  public readonly context: Record<string, any>;

  constructor(
    message: string,
    rule: string,
    context: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'BusinessRuleViolationError';
    this.code = 'BUSINESS_RULE_VIOLATION';
    this.rule = rule;
    this.context = context;
  }
}

export class TenantConfigurationError extends Error {
  public readonly code: string;
  public readonly tenantId: string;
  public readonly configType: string;

  constructor(
    message: string,
    tenantId: string,
    configType: string
  ) {
    super(message);
    this.name = 'TenantConfigurationError';
    this.code = 'TENANT_CONFIG_ERROR';
    this.tenantId = tenantId;
    this.configType = configType;
  }
}

// Error codes for consistent error handling
export const ERROR_CODES = {
  // Validation errors
  NEGATIVE_COST: 'NEGATIVE_COST',
  INVALID_COST_RANGE: 'INVALID_COST_RANGE',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_DATA_TYPE: 'INVALID_DATA_TYPE',
  
  // Data integrity errors
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  LEAD_BATCH_NOT_FOUND: 'LEAD_BATCH_NOT_FOUND',
  MISSING_COST_DATA: 'MISSING_COST_DATA',
  ORPHANED_COST_RECORD: 'ORPHANED_COST_RECORD',
  
  // Business rule violations
  RETURN_COST_ON_ACTIVE_ORDER: 'RETURN_COST_ON_ACTIVE_ORDER',
  EXCESSIVE_COST_AMOUNT: 'EXCESSIVE_COST_AMOUNT',
  INVALID_ORDER_STATUS_TRANSITION: 'INVALID_ORDER_STATUS_TRANSITION',
  LEAD_BATCH_ALREADY_PROCESSED: 'LEAD_BATCH_ALREADY_PROCESSED',
  
  // Calculation errors
  DIVISION_BY_ZERO: 'DIVISION_BY_ZERO',
  CALCULATION_OVERFLOW: 'CALCULATION_OVERFLOW',
  INCONSISTENT_CALCULATION: 'INCONSISTENT_CALCULATION',
  
  // Configuration errors
  MISSING_TENANT_CONFIG: 'MISSING_TENANT_CONFIG',
  INVALID_DEFAULT_COSTS: 'INVALID_DEFAULT_COSTS',
  
  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const;

// User-friendly error messages
export const ERROR_MESSAGES = {
  [ERROR_CODES.NEGATIVE_COST]: 'Cost values cannot be negative. Please enter a positive amount.',
  [ERROR_CODES.INVALID_COST_RANGE]: 'Cost amount is outside the acceptable range. Please verify the amount.',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Required information is missing. Please fill in all required fields.',
  [ERROR_CODES.INVALID_DATA_TYPE]: 'Invalid data format. Please enter a valid number.',
  
  [ERROR_CODES.ORDER_NOT_FOUND]: 'Order not found. The order may have been deleted or you may not have access to it.',
  [ERROR_CODES.PRODUCT_NOT_FOUND]: 'Product information is missing. Please ensure the product exists.',
  [ERROR_CODES.LEAD_BATCH_NOT_FOUND]: 'Lead batch information not found. The batch may have been deleted.',
  [ERROR_CODES.MISSING_COST_DATA]: 'Cost information is incomplete. Using default values where possible.',
  [ERROR_CODES.ORPHANED_COST_RECORD]: 'Cost data is inconsistent. Please refresh and try again.',
  
  [ERROR_CODES.RETURN_COST_ON_ACTIVE_ORDER]: 'Return costs can only be applied to returned orders.',
  [ERROR_CODES.EXCESSIVE_COST_AMOUNT]: 'Cost amount seems unusually high. Please verify the amount is correct.',
  [ERROR_CODES.INVALID_ORDER_STATUS_TRANSITION]: 'Invalid order status change. Please check the order status.',
  [ERROR_CODES.LEAD_BATCH_ALREADY_PROCESSED]: 'This lead batch has already been processed and cannot be modified.',
  
  [ERROR_CODES.DIVISION_BY_ZERO]: 'Cannot calculate percentage with zero revenue. Please check the order total.',
  [ERROR_CODES.CALCULATION_OVERFLOW]: 'Calculation result is too large. Please check your input values.',
  [ERROR_CODES.INCONSISTENT_CALCULATION]: 'Calculation results are inconsistent. Please refresh and try again.',
  
  [ERROR_CODES.MISSING_TENANT_CONFIG]: 'Default cost configuration is missing. Please contact your administrator.',
  [ERROR_CODES.INVALID_DEFAULT_COSTS]: 'Default cost configuration is invalid. Please update your settings.',
  
  [ERROR_CODES.DATABASE_ERROR]: 'Database error occurred. Please try again later.',
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'External service is temporarily unavailable. Please try again later.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Operation timed out. Please try again.',
} as const;

// Warning thresholds for business rules
export const WARNING_THRESHOLDS = {
  HIGH_RETURN_COST: 1000,
  HIGH_PACKAGING_COST: 100,
  HIGH_PRINTING_COST: 50,
  HIGH_LEAD_COST: 500,
  LOW_PROFIT_MARGIN: 10,
  NEGATIVE_PROFIT_MARGIN: 0,
  EXCESSIVE_COST_RATIO: 0.9, // 90% of revenue
} as const;

// Helper function to get user-friendly error message
export function getUserFriendlyErrorMessage(error: Error): string {
  if (error instanceof ProfitCalculationError || 
      error instanceof CostValidationError || 
      error instanceof DataIntegrityError || 
      error instanceof BusinessRuleViolationError || 
      error instanceof TenantConfigurationError) {
    
    const code = error.code as keyof typeof ERROR_MESSAGES;
    return ERROR_MESSAGES[code] || error.message;
  }
  
  return error.message || 'An unexpected error occurred. Please try again.';
}

// Helper function to determine if error is recoverable
export function isRecoverableError(error: Error): boolean {
  if (error instanceof ProfitCalculationError) {
    const recoverableCodes = [
      ERROR_CODES.MISSING_COST_DATA,
      ERROR_CODES.MISSING_TENANT_CONFIG,
      ERROR_CODES.TIMEOUT_ERROR,
    ];
    return recoverableCodes.includes(error.code as any);
  }
  
  if (error instanceof CostValidationError) {
    return true; // User can correct validation errors
  }
  
  return false;
}

// Helper function to create warning messages
export function createWarningMessage(type: string, value: number, context?: Record<string, any>): string {
  switch (type) {
    case 'HIGH_RETURN_COST':
      return `Return cost of $${value.toFixed(2)} is unusually high. Please verify this amount is correct.`;
    case 'HIGH_PACKAGING_COST':
      return `Packaging cost of $${value.toFixed(2)} is higher than typical. Please review if this is accurate.`;
    case 'HIGH_PRINTING_COST':
      return `Printing cost of $${value.toFixed(2)} is higher than typical. Please review if this is accurate.`;
    case 'HIGH_LEAD_COST':
      return `Lead acquisition cost of $${value.toFixed(2)} is unusually high. Please verify this amount.`;
    case 'LOW_PROFIT_MARGIN':
      return `Profit margin of ${value.toFixed(1)}% is below recommended levels. Consider reviewing costs or pricing.`;
    case 'NEGATIVE_PROFIT_MARGIN':
      return `This order is operating at a loss with ${value.toFixed(1)}% margin. Review costs and pricing urgently.`;
    case 'EXCESSIVE_COST_RATIO':
      return `Costs represent ${(value * 100).toFixed(1)}% of revenue, which is very high. Review cost structure.`;
    default:
      return `Warning: ${type} - Value: ${value}`;
  }
}