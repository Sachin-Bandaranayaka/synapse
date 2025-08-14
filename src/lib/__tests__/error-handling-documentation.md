# Error Handling and Edge Cases Implementation

## Overview

This document describes the comprehensive error handling and edge case management system implemented for the profit calculation system. The implementation addresses Requirements 1.4, 2.4, 3.4, and 4.4 by providing robust error handling, validation, fallback mechanisms, and user-friendly error messages.

## Architecture

The error handling system consists of four main components:

1. **Custom Error Classes** (`src/lib/errors/profit-errors.ts`)
2. **Validation System** (`src/lib/validation/cost-validation.ts`)
3. **Fallback Mechanisms** (`src/lib/fallbacks/profit-fallbacks.ts`)
4. **Enhanced Service Layer** (Updated existing services)

## Custom Error Classes

### ProfitCalculationError
- **Purpose**: Handles profit calculation specific errors
- **Properties**: `code`, `orderId`, `tenantId`, `context`
- **Usage**: Thrown when profit calculations fail with specific error codes

### CostValidationError
- **Purpose**: Handles cost validation errors
- **Properties**: `field`, `value`, `constraints`
- **Usage**: Thrown when cost inputs fail validation

### DataIntegrityError
- **Purpose**: Handles data consistency issues
- **Properties**: `entityType`, `entityId`, `missingFields`
- **Usage**: Thrown when required data is missing or inconsistent

### BusinessRuleViolationError
- **Purpose**: Handles business rule violations
- **Properties**: `rule`, `context`
- **Usage**: Thrown when business rules are violated

### TenantConfigurationError
- **Purpose**: Handles tenant configuration issues
- **Properties**: `tenantId`, `configType`
- **Usage**: Thrown when tenant configuration is missing or invalid

## Error Codes

Standardized error codes for consistent error handling:

```typescript
export const ERROR_CODES = {
  // Validation errors
  NEGATIVE_COST: 'NEGATIVE_COST',
  INVALID_COST_RANGE: 'INVALID_COST_RANGE',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Data integrity errors
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  MISSING_COST_DATA: 'MISSING_COST_DATA',
  
  // Business rule violations
  RETURN_COST_ON_ACTIVE_ORDER: 'RETURN_COST_ON_ACTIVE_ORDER',
  EXCESSIVE_COST_AMOUNT: 'EXCESSIVE_COST_AMOUNT',
  
  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CALCULATION_OVERFLOW: 'CALCULATION_OVERFLOW',
} as const;
```

## Validation System

### Cost Value Validation

The `validateCostValue` function provides comprehensive validation for individual cost values:

- **Type checking**: Ensures values are numbers or convertible to numbers
- **Range validation**: Checks minimum and maximum values
- **Business rules**: Applies business-specific constraints
- **Warning generation**: Creates warnings for unusual but valid values

### Order Cost Validation

The `validateOrderCosts` function validates complete order cost structures:

- **Individual cost validation**: Validates each cost component
- **Business rule enforcement**: Ensures return costs only apply to returned orders
- **Cost ratio warnings**: Warns when costs are excessive relative to revenue

### Lead Batch Validation

The `validateLeadBatchCosts` function validates lead batch cost distribution:

- **Total cost validation**: Ensures total cost is valid
- **Lead count validation**: Ensures lead count is positive
- **Cost per lead calculation**: Automatically calculates and validates cost per lead

### Input Sanitization

The `sanitizeNumericInput` function safely converts various input types to numbers:

- **String conversion**: Handles currency-formatted strings
- **Invalid input handling**: Returns 0 for invalid inputs
- **Negative value protection**: Converts negative values to 0

## Fallback Mechanisms

### Profit Breakdown Fallback

When profit calculation fails, the system generates a fallback breakdown using:

- **Revenue estimation**: Uses order total if available
- **Cost estimation**: Uses industry-standard cost ratios
- **Warning generation**: Informs users about fallback usage

### Default Cost Fallback

When tenant configuration is missing, the system provides:

- **Industry standard costs**: Packaging ($5.00), Printing ($2.50), Return ($15.00)
- **Graceful degradation**: System continues to function with defaults
- **User notification**: Warns users to configure tenant-specific defaults

### Data Repair

The system can repair inconsistent cost data by:

- **Recalculating totals**: Fixes incorrect total cost calculations
- **Estimating missing costs**: Uses revenue-based estimation for missing product costs
- **Validation**: Ensures repaired data meets business rules

## Enhanced Service Layer

### ProfitCalculationService Enhancements

- **Input validation**: All inputs are validated before processing
- **Error recovery**: Attempts to recover from errors using fallbacks
- **Warning collection**: Collects and reports warnings throughout calculation
- **Context preservation**: Maintains error context for debugging

### CostTrackingService Enhancements

- **Validation integration**: Uses validation system for all cost operations
- **Error wrapping**: Wraps database errors with meaningful context
- **Fallback usage**: Uses fallbacks when configuration is missing

## API Layer Error Handling

### Enhanced Error Responses

API endpoints now return structured error responses:

```typescript
{
  error: "User-friendly error message",
  code: "ERROR_CODE",
  recoverable: true,
  details?: [...] // For validation errors
}
```

### Status Code Mapping

- **400**: Validation errors, invalid input
- **403**: Permission errors
- **404**: Resource not found
- **500**: System errors, calculation failures

## UI Component Error Handling

### ProfitBreakdownCard Enhancements

- **Specific error handling**: Different handling for 404, 403, and 500 errors
- **Data validation**: Validates response structure before using
- **User-friendly messages**: Shows appropriate messages for different error types

### OrderCostForm Enhancements

- **Client-side validation**: Validates inputs before sending to server
- **Real-time feedback**: Shows validation errors as user types
- **Warning display**: Shows warnings for unusual but valid values

## Warning System

### Warning Thresholds

The system defines warning thresholds for various scenarios:

```typescript
export const WARNING_THRESHOLDS = {
  HIGH_RETURN_COST: 1000,
  HIGH_PACKAGING_COST: 100,
  HIGH_PRINTING_COST: 50,
  LOW_PROFIT_MARGIN: 10,
  EXCESSIVE_COST_RATIO: 0.9,
} as const;
```

### Warning Messages

Contextual warning messages are generated for:

- **High costs**: When costs exceed typical ranges
- **Low profit margins**: When profitability is concerning
- **Data quality issues**: When data appears inconsistent

## Edge Cases Handled

### Numeric Edge Cases

- **Infinity and NaN**: Rejected with appropriate error messages
- **Very large numbers**: Handled up to `Number.MAX_SAFE_INTEGER`
- **Very small numbers**: Handled down to 0.01
- **Negative numbers**: Converted to 0 or rejected based on context

### String Input Edge Cases

- **Currency formatting**: "$1,234.56" → 1234.56
- **Empty strings**: "" → 0
- **Whitespace**: "   " → 0
- **Invalid strings**: "abc" → 0

### Business Logic Edge Cases

- **Zero revenue**: Handled gracefully, profit margin calculation skipped
- **Missing product costs**: Estimated based on revenue
- **Missing tenant configuration**: Uses system defaults
- **Order status transitions**: Validated against business rules

## Error Recovery Strategies

The system provides different recovery strategies based on error type:

### Recoverable Errors

- **Missing cost data**: Use fallback values
- **Invalid input**: Sanitize and retry
- **Configuration missing**: Use system defaults

### Non-recoverable Errors

- **Order not found**: Return 404 error
- **Permission denied**: Return 403 error
- **Critical system errors**: Log and return 500 error

## Testing

Comprehensive test coverage includes:

- **Unit tests**: For all validation functions and error classes
- **Integration tests**: For complete error handling flows
- **Edge case tests**: For boundary conditions and unusual inputs
- **Fallback tests**: For fallback mechanism functionality

## Usage Examples

### Handling Validation Errors

```typescript
try {
  const result = validateOrderCosts(costs);
  if (!result.isValid) {
    throw new CostValidationError(
      result.errors[0].message,
      'orderCosts',
      costs
    );
  }
} catch (error) {
  if (error instanceof CostValidationError) {
    return { error: getUserFriendlyErrorMessage(error) };
  }
  throw error;
}
```

### Using Fallbacks

```typescript
try {
  const breakdown = await calculateOrderProfit(orderId, tenantId);
  return breakdown;
} catch (error) {
  const recoveryStrategy = createErrorRecoveryStrategy(error);
  if (recoveryStrategy.fallbackAvailable) {
    const fallback = generateFallbackProfitBreakdown(context, error);
    return fallback.value;
  }
  throw error;
}
```

### Client-side Error Handling

```typescript
const response = await fetch('/api/orders/123/costs');
if (!response.ok) {
  const errorData = await response.json();
  if (response.status === 404) {
    setError('Order not found or you may not have access to it');
  } else {
    setError(errorData.error || 'Failed to fetch profit data');
  }
  return;
}
```

## Best Practices

1. **Always validate inputs** before processing
2. **Use specific error types** for different error categories
3. **Provide fallbacks** when possible to maintain system functionality
4. **Log errors with context** for debugging
5. **Show user-friendly messages** in the UI
6. **Test edge cases** thoroughly
7. **Document error scenarios** for maintenance

## Monitoring and Debugging

### Error Logging

All errors are logged with:

- **Error type and code**
- **Context information** (orderId, tenantId, etc.)
- **Stack traces** for debugging
- **User actions** that led to the error

### Warning Tracking

Warnings are logged to help identify:

- **Data quality issues**
- **Configuration problems**
- **Unusual usage patterns**

### Performance Impact

The error handling system is designed to have minimal performance impact:

- **Validation is fast** and only runs when needed
- **Fallbacks are cached** when possible
- **Error objects are lightweight**

## Future Enhancements

Potential improvements to the error handling system:

1. **Error analytics**: Track error patterns to identify systemic issues
2. **Automatic recovery**: More sophisticated automatic error recovery
3. **User guidance**: Contextual help based on error types
4. **Configuration validation**: Validate tenant configurations on save
5. **Batch error handling**: Handle errors in batch operations more efficiently

This comprehensive error handling system ensures the profit calculation system is robust, user-friendly, and maintainable while providing clear feedback to users and developers when issues occur.