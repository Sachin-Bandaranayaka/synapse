# Profit Calculation Service Tests

This directory contains comprehensive tests for the ProfitCalculationService implementation.

## Test Files

### `profit-calculation-simple.test.ts`
- Tests static validation methods
- Tests service instantiation
- Tests core profit calculation formulas
- 14 test cases covering basic functionality

### `profit-calculation-integration.test.ts`
- Tests business logic scenarios
- Tests edge cases and error handling
- Tests realistic e-commerce scenarios
- 18 test cases covering complex scenarios

## Test Coverage

The tests cover:

✅ **Core Functionality**
- Profit margin calculations
- Cost validation
- Service instantiation
- Method availability

✅ **Business Logic**
- Standard order profit calculation
- Return order handling
- Loss-making order scenarios
- High-margin scenarios
- Bulk order calculations

✅ **Edge Cases**
- Zero revenue handling
- Negative cost validation
- Large numeric values
- Decimal precision
- Partial cost updates

✅ **Error Handling**
- Invalid cost combinations
- Boundary value testing
- Graceful error messages

## Running Tests

```bash
# Run all profit calculation tests
npm run test:run -- src/lib/__tests__/profit-calculation-*.test.ts

# Run specific test file
npm run test:run -- src/lib/__tests__/profit-calculation-simple.test.ts
```

## Test Results

- **Total Tests**: 32
- **Passing**: 32 ✅
- **Failing**: 0 ❌
- **Coverage**: Core business logic and edge cases

The tests validate that the ProfitCalculationService correctly implements all profit calculation requirements and handles edge cases appropriately.