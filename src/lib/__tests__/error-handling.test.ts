// src/lib/__tests__/error-handling.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  ProfitCalculationError, 
  CostValidationError,
  DataIntegrityError,
  BusinessRuleViolationError,
  TenantConfigurationError,
  ERROR_CODES,
  getUserFriendlyErrorMessage,
  isRecoverableError,
  createWarningMessage
} from '../errors/profit-errors';
import { 
  validateCostValue,
  validateOrderCosts,
  validateLeadBatchCosts,
  validateTenantCostConfig,
  validateProductCosts,
  validateProfitCalculationInputs,
  validateOrderStatusTransition,
  sanitizeNumericInput
} from '../validation/cost-validation';
import { 
  generateFallbackProfitBreakdown,
  generateFallbackDefaultCosts,
  generateFallbackLeadCost,
  generateFallbackProductCost,
  repairInconsistentCostData,
  generateSafeProfitCalculation,
  createErrorRecoveryStrategy
} from '../fallbacks/profit-fallbacks';
import { OrderStatus } from '@prisma/client';

describe('Error Handling System', () => {
  describe('Custom Error Classes', () => {
    it('should create ProfitCalculationError with proper properties', () => {
      const error = new ProfitCalculationError(
        'Test error',
        ERROR_CODES.ORDER_NOT_FOUND,
        'order-123',
        'tenant-456',
        { test: 'context' }
      );

      expect(error.name).toBe('ProfitCalculationError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ERROR_CODES.ORDER_NOT_FOUND);
      expect(error.orderId).toBe('order-123');
      expect(error.tenantId).toBe('tenant-456');
      expect(error.context).toEqual({ test: 'context' });
    });

    it('should create CostValidationError with field information', () => {
      const error = new CostValidationError(
        'Invalid cost',
        'packagingCost',
        -5,
        { min: 0 }
      );

      expect(error.name).toBe('CostValidationError');
      expect(error.field).toBe('packagingCost');
      expect(error.value).toBe(-5);
      expect(error.constraints).toEqual({ min: 0 });
    });

    it('should provide user-friendly error messages', () => {
      const error = new ProfitCalculationError(
        'Technical error',
        ERROR_CODES.NEGATIVE_COST,
        'order-123'
      );

      const friendlyMessage = getUserFriendlyErrorMessage(error);
      expect(friendlyMessage).toBe('Cost values cannot be negative. Please enter a positive amount.');
    });

    it('should determine if errors are recoverable', () => {
      const recoverableError = new ProfitCalculationError(
        'Missing data',
        ERROR_CODES.MISSING_COST_DATA,
        'order-123'
      );

      const nonRecoverableError = new ProfitCalculationError(
        'Order not found',
        ERROR_CODES.ORDER_NOT_FOUND,
        'order-123'
      );

      expect(isRecoverableError(recoverableError)).toBe(true);
      expect(isRecoverableError(nonRecoverableError)).toBe(false);
    });
  });

  describe('Cost Validation', () => {
    describe('validateCostValue', () => {
      it('should validate positive numbers', () => {
        const result = validateCostValue(10.50, 'testCost');
        expect(result.isValid).toBe(true);
        expect(result.sanitizedValue).toBe(10.50);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject negative numbers', () => {
        const result = validateCostValue(-5, 'testCost');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain('cannot be less than');
      });

      it('should handle string inputs', () => {
        const result = validateCostValue('15.75', 'testCost');
        expect(result.isValid).toBe(true);
        expect(result.sanitizedValue).toBe(15.75);
      });

      it('should reject invalid string inputs', () => {
        const result = validateCostValue('invalid', 'testCost');
        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toContain('must be a valid number');
      });

      it('should generate warnings for high values', () => {
        const result = validateCostValue(2000, 'returnCost');
        expect(result.isValid).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0]).toContain('unusually high');
      });

      it('should handle required fields', () => {
        const result = validateCostValue(undefined, 'requiredCost', { required: true });
        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toContain('is required');
      });

      it('should handle max value constraints', () => {
        const result = validateCostValue(1500, 'testCost', { max: 1000 });
        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toContain('cannot be greater than');
      });
    });

    describe('validateOrderCosts', () => {
      it('should validate valid order costs', () => {
        const result = validateOrderCosts({
          packagingCost: 10,
          printingCost: 5,
          returnCost: 15
        });

        expect(result.isValid).toBe(true);
        expect(result.sanitizedCosts.packagingCost).toBe(10);
        expect(result.sanitizedCosts.printingCost).toBe(5);
        expect(result.sanitizedCosts.returnCost).toBe(15);
      });

      it('should reject return cost on non-returned orders', () => {
        const result = validateOrderCosts({
          returnCost: 15,
          orderStatus: OrderStatus.CONFIRMED
        });

        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toContain('only be applied to returned orders');
      });

      it('should warn about excessive cost ratios', () => {
        const result = validateOrderCosts({
          packagingCost: 80,
          printingCost: 20,
          orderTotal: 100
        });

        expect(result.isValid).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0]).toContain('very high');
      });
    });

    describe('validateLeadBatchCosts', () => {
      it('should validate valid lead batch costs', () => {
        const result = validateLeadBatchCosts({
          totalCost: 1000,
          leadCount: 50
        });

        expect(result.isValid).toBe(true);
        expect(result.sanitizedValues.totalCost).toBe(1000);
        expect(result.sanitizedValues.leadCount).toBe(50);
        expect(result.sanitizedValues.costPerLead).toBe(20);
      });

      it('should reject zero lead count', () => {
        const result = validateLeadBatchCosts({
          totalCost: 1000,
          leadCount: 0
        });

        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toContain('cannot be less than');
      });

      it('should warn about high cost per lead', () => {
        const result = validateLeadBatchCosts({
          totalCost: 30000,
          leadCount: 50
        });

        expect(result.isValid).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0]).toContain('unusually high');
      });
    });

    describe('sanitizeNumericInput', () => {
      it('should sanitize various input types', () => {
        expect(sanitizeNumericInput(10)).toBe(10);
        expect(sanitizeNumericInput('15.5')).toBe(15.5);
        expect(sanitizeNumericInput('$25.00')).toBe(25);
        expect(sanitizeNumericInput(null)).toBe(0);
        expect(sanitizeNumericInput(undefined)).toBe(0);
        expect(sanitizeNumericInput('')).toBe(0);
        expect(sanitizeNumericInput('invalid')).toBe(0);
        expect(sanitizeNumericInput(-5)).toBe(0); // Negative values become 0
        expect(sanitizeNumericInput(Infinity)).toBe(0); // Invalid numbers become 0
      });
    });
  });

  describe('Fallback Mechanisms', () => {
    describe('generateFallbackProfitBreakdown', () => {
      it('should generate fallback profit breakdown', () => {
        const context = {
          orderId: 'order-123',
          tenantId: 'tenant-456',
          orderTotal: 100,
          orderStatus: OrderStatus.CONFIRMED
        };

        const error = new Error('Calculation failed');
        const result = generateFallbackProfitBreakdown(context, error);

        expect(result.usedFallback).toBe(true);
        expect(result.value.orderId).toBe('order-123');
        expect(result.value.revenue).toBe(100);
        expect(result.value.costs.total).toBeGreaterThan(0);
        expect(result.warnings).toHaveLength(2);
      });
    });

    describe('generateFallbackDefaultCosts', () => {
      it('should generate fallback default costs', () => {
        const result = generateFallbackDefaultCosts('tenant-123');

        expect(result.usedFallback).toBe(true);
        expect(result.value.packagingCost).toBe(5.00);
        expect(result.value.printingCost).toBe(2.50);
        expect(result.value.returnCost).toBe(15.00);
        expect(result.warnings).toHaveLength(1);
      });
    });

    describe('repairInconsistentCostData', () => {
      it('should repair inconsistent cost data', () => {
        const inconsistentCosts = {
          productCost: 50,
          leadCost: 10,
          packagingCost: 5,
          printingCost: 3,
          returnCost: 0,
          totalCosts: 100 // Incorrect total
        };

        const result = repairInconsistentCostData('order-123', inconsistentCosts, 200);

        expect(result.usedFallback).toBe(true);
        expect(result.value.totalCosts).toBe(68); // Correct total
        expect(result.warnings).toContain('Total cost mismatch detected. Recalculated from individual costs.');
      });

      it('should estimate missing product cost', () => {
        const costsWithoutProduct = {
          productCost: 0,
          leadCost: 10,
          packagingCost: 5,
          printingCost: 3,
          returnCost: 0
        };

        const result = repairInconsistentCostData('order-123', costsWithoutProduct, 100);

        expect(result.value.productCost).toBe(60); // 60% of revenue
        expect(result.warnings).toContain('Product cost was missing. Estimated as $60.00 based on revenue.');
      });
    });

    describe('generateSafeProfitCalculation', () => {
      it('should generate safe profit calculation', () => {
        const result = generateSafeProfitCalculation(100, {
          product: 60,
          lead: 10,
          packaging: 5,
          printing: 3,
          return: 0
        });

        expect(result.value.totalCosts).toBe(78);
        expect(result.value.grossProfit).toBe(40);
        expect(result.value.netProfit).toBe(22);
        expect(result.value.profitMargin).toBe(22);
      });

      it('should handle zero revenue', () => {
        const result = generateSafeProfitCalculation(0, {
          product: 60,
          lead: 10
        });

        expect(result.value.profitMargin).toBe(0);
        expect(result.warnings).toContain('Cannot calculate profit margin with zero revenue');
      });

      it('should warn about losses', () => {
        const result = generateSafeProfitCalculation(50, {
          product: 60,
          lead: 10
        });

        expect(result.value.netProfit).toBe(-20);
        expect(result.warnings).toContain('Total costs exceed revenue. This order is operating at a loss.');
      });
    });

    describe('createErrorRecoveryStrategy', () => {
      it('should create recovery strategy for different error types', () => {
        const orderNotFoundError = new ProfitCalculationError(
          'Order not found',
          ERROR_CODES.ORDER_NOT_FOUND,
          'order-123'
        );

        const missingDataError = new ProfitCalculationError(
          'Missing cost data',
          ERROR_CODES.MISSING_COST_DATA,
          'order-123'
        );

        const orderNotFoundStrategy = createErrorRecoveryStrategy(orderNotFoundError);
        const missingDataStrategy = createErrorRecoveryStrategy(missingDataError);

        expect(orderNotFoundStrategy.canRecover).toBe(false);
        expect(orderNotFoundStrategy.fallbackAvailable).toBe(false);

        expect(missingDataStrategy.canRecover).toBe(true);
        expect(missingDataStrategy.fallbackAvailable).toBe(true);
        expect(missingDataStrategy.userAction).toContain('Review and update cost information');
      });
    });
  });

  describe('Warning Messages', () => {
    it('should create appropriate warning messages', () => {
      const highReturnCostWarning = createWarningMessage('HIGH_RETURN_COST', 1500);
      expect(highReturnCostWarning).toContain('Return cost of $1500.00 is unusually high');

      const lowProfitMarginWarning = createWarningMessage('LOW_PROFIT_MARGIN', 5.5);
      expect(lowProfitMarginWarning).toContain('Profit margin of 5.5% is below recommended levels');

      const negativeProfitWarning = createWarningMessage('NEGATIVE_PROFIT_MARGIN', -10.2);
      expect(negativeProfitWarning).toContain('This order is operating at a loss with -10.2% margin');

      const excessiveCostRatioWarning = createWarningMessage('EXCESSIVE_COST_RATIO', 0.95);
      expect(excessiveCostRatioWarning).toContain('Costs represent 95.0% of revenue, which is very high');
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely large numbers', () => {
      const result = validateCostValue(Number.MAX_SAFE_INTEGER, 'testCost');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle very small positive numbers', () => {
      const result = validateCostValue(0.01, 'testCost');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(0.01);
    });

    it('should handle infinity and NaN', () => {
      const infinityResult = validateCostValue(Infinity, 'testCost');
      expect(infinityResult.isValid).toBe(false);
      expect(infinityResult.errors[0].message).toContain('must be a finite number');

      const nanResult = validateCostValue(NaN, 'testCost');
      expect(nanResult.isValid).toBe(false);
      expect(nanResult.errors[0].message).toContain('must be a finite number');
    });

    it('should handle empty and whitespace strings', () => {
      expect(sanitizeNumericInput('')).toBe(0);
      expect(sanitizeNumericInput('   ')).toBe(0);
      expect(sanitizeNumericInput('\t\n')).toBe(0);
    });

    it('should handle currency-formatted strings', () => {
      expect(sanitizeNumericInput('$1,234.56')).toBe(1234.56);
      expect(sanitizeNumericInput('€500.00')).toBe(500);
      expect(sanitizeNumericInput('1,000.50')).toBe(1000.50);
    });
  });

  describe('Business Rule Validation', () => {
    it('should validate order status transitions', () => {
      // Valid transition
      const validTransition = validateOrderStatusTransition(
        OrderStatus.CONFIRMED,
        OrderStatus.RETURNED,
        true
      );
      expect(validTransition.isValid).toBe(true);

      // Invalid transition - return cost on non-returned order
      const invalidTransition = validateOrderStatusTransition(
        OrderStatus.CONFIRMED,
        OrderStatus.SHIPPED,
        true
      );
      expect(invalidTransition.isValid).toBe(false);
      expect(invalidTransition.errors[0].message).toContain('Return cost can only be applied when marking order as returned');
    });

    it('should warn about status changes affecting profit calculations', () => {
      const transition = validateOrderStatusTransition(
        OrderStatus.RETURNED,
        OrderStatus.CONFIRMED,
        false
      );
      expect(transition.isValid).toBe(true);
      expect(transition.warnings).toContain('Changing status from RETURNED may affect profit calculations. Return costs will be recalculated.');
    });
  });
});

describe('Integration Error Handling', () => {
  it('should handle complete error flow from validation to fallback', async () => {
    // Simulate a complete error handling flow
    const invalidCosts = {
      packagingCost: -5, // Invalid negative cost
      printingCost: 'invalid', // Invalid string
      returnCost: 50000 // Excessive amount
    };

    // Validation should catch these errors
    const validation = validateOrderCosts(invalidCosts as any);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);

    // If validation fails, we should use fallbacks
    const fallbackCosts = generateFallbackDefaultCosts('tenant-123');
    expect(fallbackCosts.usedFallback).toBe(true);
    expect(fallbackCosts.value.packagingCost).toBeGreaterThan(0);
    expect(fallbackCosts.value.printingCost).toBeGreaterThan(0);
    expect(fallbackCosts.value.returnCost).toBeGreaterThan(0);
  });

  it('should provide comprehensive error context for debugging', () => {
    const error = new ProfitCalculationError(
      'Complex calculation error',
      ERROR_CODES.INCONSISTENT_CALCULATION,
      'order-123',
      'tenant-456',
      {
        revenue: 100,
        costs: { product: 60, lead: 10, packaging: 5 },
        calculationStep: 'profit_margin',
        timestamp: new Date().toISOString()
      }
    );

    expect(error.context).toHaveProperty('revenue');
    expect(error.context).toHaveProperty('costs');
    expect(error.context).toHaveProperty('calculationStep');
    expect(error.context).toHaveProperty('timestamp');
  });
});