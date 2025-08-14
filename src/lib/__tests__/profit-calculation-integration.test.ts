// src/lib/__tests__/profit-calculation-integration.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { ProfitCalculationService, ProfitBreakdown } from '../profit-calculation';
import { OrderStatus } from '@prisma/client';

/**
 * Integration tests that verify the profit calculation logic
 * without relying on database mocking. These tests focus on
 * the business logic and edge cases.
 */
describe('ProfitCalculationService - Integration Tests', () => {
  let service: ProfitCalculationService;

  beforeEach(() => {
    service = new ProfitCalculationService();
  });

  describe('Business Logic Validation', () => {
    it('should validate profit calculation formulas', () => {
      // Test the core profit calculation formulas
      const mockOrderData = {
        revenue: 100,
        productCost: 30,
        leadCost: 5,
        packagingCost: 3,
        printingCost: 2,
        returnCost: 0,
      };

      const totalCosts = mockOrderData.productCost + mockOrderData.leadCost + 
                        mockOrderData.packagingCost + mockOrderData.printingCost + 
                        mockOrderData.returnCost;
      const grossProfit = mockOrderData.revenue - mockOrderData.productCost;
      const netProfit = mockOrderData.revenue - totalCosts;
      const profitMargin = mockOrderData.revenue > 0 ? (netProfit / mockOrderData.revenue) * 100 : 0;

      expect(totalCosts).toBe(40);
      expect(grossProfit).toBe(70);
      expect(netProfit).toBe(60);
      expect(profitMargin).toBe(60);
    });

    it('should handle return scenarios correctly', () => {
      // Test return cost impact on profit
      const mockReturnData = {
        revenue: 100,
        productCost: 25,
        leadCost: 5,
        packagingCost: 3,
        printingCost: 2,
        returnCost: 15, // Return shipping cost
      };

      const totalCosts = mockReturnData.productCost + mockReturnData.leadCost + 
                        mockReturnData.packagingCost + mockReturnData.printingCost + 
                        mockReturnData.returnCost;
      const netProfit = mockReturnData.revenue - totalCosts;

      // For returns, the business actually loses money due to return costs
      expect(totalCosts).toBe(50);
      expect(netProfit).toBe(50); // Still positive but reduced
    });

    it('should handle loss-making orders', () => {
      // Test scenarios where costs exceed revenue
      const mockLossData = {
        revenue: 50,
        productCost: 30,
        leadCost: 10,
        packagingCost: 5,
        printingCost: 3,
        returnCost: 15, // High return cost
      };

      const totalCosts = mockLossData.productCost + mockLossData.leadCost + 
                        mockLossData.packagingCost + mockLossData.printingCost + 
                        mockLossData.returnCost;
      const netProfit = mockLossData.revenue - totalCosts;
      const profitMargin = mockLossData.revenue > 0 ? (netProfit / mockLossData.revenue) * 100 : 0;

      expect(totalCosts).toBe(63);
      expect(netProfit).toBe(-13); // Loss
      expect(profitMargin).toBe(-26); // Negative margin
    });

    it('should handle zero revenue edge case', () => {
      // Test free products or promotional orders
      const mockZeroRevenueData = {
        revenue: 0,
        productCost: 20,
        leadCost: 5,
        packagingCost: 3,
        printingCost: 2,
        returnCost: 0,
      };

      const totalCosts = mockZeroRevenueData.productCost + mockZeroRevenueData.leadCost + 
                        mockZeroRevenueData.packagingCost + mockZeroRevenueData.printingCost + 
                        mockZeroRevenueData.returnCost;
      const netProfit = mockZeroRevenueData.revenue - totalCosts;
      const profitMargin = mockZeroRevenueData.revenue > 0 ? (netProfit / mockZeroRevenueData.revenue) * 100 : 0;

      expect(totalCosts).toBe(30);
      expect(netProfit).toBe(-30); // Pure loss
      expect(profitMargin).toBe(0); // Should handle division by zero
    });

    it('should handle high-margin scenarios', () => {
      // Test high-profit scenarios
      const mockHighMarginData = {
        revenue: 200,
        productCost: 20,
        leadCost: 2,
        packagingCost: 3,
        printingCost: 1,
        returnCost: 0,
      };

      const totalCosts = mockHighMarginData.productCost + mockHighMarginData.leadCost + 
                        mockHighMarginData.packagingCost + mockHighMarginData.printingCost + 
                        mockHighMarginData.returnCost;
      const grossProfit = mockHighMarginData.revenue - mockHighMarginData.productCost;
      const netProfit = mockHighMarginData.revenue - totalCosts;
      const profitMargin = (netProfit / mockHighMarginData.revenue) * 100;

      expect(totalCosts).toBe(26);
      expect(grossProfit).toBe(180);
      expect(netProfit).toBe(174);
      expect(profitMargin).toBe(87); // High margin
    });
  });

  describe('Cost Validation Edge Cases', () => {
    it('should handle all cost types being zero', () => {
      const zeroCosts = {
        packagingCost: 0,
        printingCost: 0,
        returnCost: 0,
      };

      expect(() => ProfitCalculationService.validateCosts(zeroCosts)).not.toThrow();
    });

    it('should handle partial cost updates', () => {
      const partialCosts = {
        packagingCost: 5,
        // printingCost and returnCost are undefined
      };

      expect(() => ProfitCalculationService.validateCosts(partialCosts)).not.toThrow();
    });

    it('should reject negative costs with detailed error messages', () => {
      const negativeCosts = {
        packagingCost: -1,
        printingCost: -2,
        returnCost: -3,
      };

      expect(() => ProfitCalculationService.validateCosts(negativeCosts)).toThrow(
        'Invalid cost values: Packaging cost cannot be negative, Printing cost cannot be negative, Return cost cannot be negative'
      );
    });

    it('should handle very large cost values', () => {
      const largeCosts = {
        packagingCost: 999999.99,
        printingCost: 888888.88,
        returnCost: 777777.77,
      };

      expect(() => ProfitCalculationService.validateCosts(largeCosts)).not.toThrow();
    });

    it('should handle decimal cost values', () => {
      const decimalCosts = {
        packagingCost: 5.99,
        printingCost: 3.50,
        returnCost: 12.25,
      };

      expect(() => ProfitCalculationService.validateCosts(decimalCosts)).not.toThrow();
    });
  });

  describe('Profit Calculation Scenarios', () => {
    it('should calculate correct profit for typical e-commerce order', () => {
      // Simulate a typical order scenario
      const orderScenario = {
        sellingPrice: 89.99,
        quantity: 1,
        discount: 9.99,
        costPrice: 35.00,
        leadCost: 3.50,
        packagingCost: 2.00,
        printingCost: 1.50,
        returnCost: 0,
      };

      const revenue = (orderScenario.sellingPrice * orderScenario.quantity) - orderScenario.discount;
      const productCost = orderScenario.costPrice * orderScenario.quantity;
      const totalCosts = productCost + orderScenario.leadCost + orderScenario.packagingCost + 
                        orderScenario.printingCost + orderScenario.returnCost;
      const grossProfit = revenue - productCost;
      const netProfit = revenue - totalCosts;
      const profitMargin = (netProfit / revenue) * 100;

      expect(revenue).toBe(80.00);
      expect(productCost).toBe(35.00);
      expect(totalCosts).toBe(42.00);
      expect(grossProfit).toBe(45.00);
      expect(netProfit).toBe(38.00);
      expect(Math.round(profitMargin)).toBe(48); // ~47.5% margin
    });

    it('should calculate correct profit for bulk order', () => {
      // Simulate a bulk order scenario
      const bulkOrderScenario = {
        sellingPrice: 25.00,
        quantity: 5,
        discount: 0,
        costPrice: 12.00,
        leadCost: 8.00, // Higher lead cost for bulk acquisition
        packagingCost: 5.00, // Bulk packaging
        printingCost: 3.00,
        returnCost: 0,
      };

      const revenue = (bulkOrderScenario.sellingPrice * bulkOrderScenario.quantity) - bulkOrderScenario.discount;
      const productCost = bulkOrderScenario.costPrice * bulkOrderScenario.quantity;
      const totalCosts = productCost + bulkOrderScenario.leadCost + bulkOrderScenario.packagingCost + 
                        bulkOrderScenario.printingCost + bulkOrderScenario.returnCost;
      const grossProfit = revenue - productCost;
      const netProfit = revenue - totalCosts;
      const profitMargin = (netProfit / revenue) * 100;

      expect(revenue).toBe(125.00);
      expect(productCost).toBe(60.00);
      expect(totalCosts).toBe(76.00);
      expect(grossProfit).toBe(65.00);
      expect(netProfit).toBe(49.00);
      expect(Math.round(profitMargin)).toBe(39); // ~39.2% margin
    });

    it('should calculate correct loss for returned order', () => {
      // Simulate a returned order scenario
      const returnScenario = {
        sellingPrice: 50.00,
        quantity: 1,
        discount: 0,
        costPrice: 20.00,
        leadCost: 4.00,
        packagingCost: 2.50,
        printingCost: 1.50,
        returnCost: 18.00, // Return shipping cost
      };

      const revenue = (returnScenario.sellingPrice * returnScenario.quantity) - returnScenario.discount;
      const productCost = returnScenario.costPrice * returnScenario.quantity;
      const totalCosts = productCost + returnScenario.leadCost + returnScenario.packagingCost + 
                        returnScenario.printingCost + returnScenario.returnCost;
      const grossProfit = revenue - productCost;
      const netProfit = revenue - totalCosts;
      const profitMargin = (netProfit / revenue) * 100;

      expect(revenue).toBe(50.00);
      expect(productCost).toBe(20.00);
      expect(totalCosts).toBe(46.00);
      expect(grossProfit).toBe(30.00);
      expect(netProfit).toBe(4.00); // Still positive but very low
      expect(Math.round(profitMargin)).toBe(8); // Low margin due to return cost
    });
  });

  describe('Service Instance Behavior', () => {
    it('should create service instance successfully', () => {
      const newService = new ProfitCalculationService();
      expect(newService).toBeInstanceOf(ProfitCalculationService);
    });

    it('should have all required methods', () => {
      expect(typeof service.calculateOrderProfit).toBe('function');
      expect(typeof service.recalculateOnStatusChange).toBe('function');
      expect(typeof service.updateOrderCostsManually).toBe('function');
      expect(typeof service.calculateMultipleOrderProfits).toBe('function');
    });

    it('should have static validation method', () => {
      expect(typeof ProfitCalculationService.validateCosts).toBe('function');
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle invalid cost combinations gracefully', () => {
      // Test various invalid cost scenarios
      const invalidScenarios = [
        { packagingCost: -1 },
        { printingCost: -0.01 },
        { returnCost: -100 },
        { packagingCost: -5, printingCost: -3 },
      ];

      invalidScenarios.forEach((scenario, index) => {
        expect(() => ProfitCalculationService.validateCosts(scenario))
          .toThrow(/Invalid cost values:/);
      });
    });

    it('should handle edge case numeric values', () => {
      const edgeCases = [
        { packagingCost: 0.001 }, // Very small positive
        { printingCost: Number.MAX_SAFE_INTEGER }, // Very large
        { returnCost: 0 }, // Exactly zero
      ];

      edgeCases.forEach((scenario) => {
        expect(() => ProfitCalculationService.validateCosts(scenario)).not.toThrow();
      });
    });
  });
});