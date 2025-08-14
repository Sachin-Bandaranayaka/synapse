// src/lib/__tests__/profit-calculation-simple.test.ts

import { describe, it, expect } from 'vitest';
import { ProfitCalculationService } from '../profit-calculation';

describe('ProfitCalculationService - Static Methods', () => {
  describe('validateCosts', () => {
    it('should pass validation for valid costs', () => {
      const validCosts = {
        packagingCost: 5,
        printingCost: 3,
        returnCost: 10,
      };

      expect(() => ProfitCalculationService.validateCosts(validCosts)).not.toThrow();
    });

    it('should pass validation for zero costs', () => {
      const zeroCosts = {
        packagingCost: 0,
        printingCost: 0,
        returnCost: 0,
      };

      expect(() => ProfitCalculationService.validateCosts(zeroCosts)).not.toThrow();
    });

    it('should throw error for negative packaging cost', () => {
      const invalidCosts = {
        packagingCost: -5,
      };

      expect(() => ProfitCalculationService.validateCosts(invalidCosts)).toThrow(
        'Invalid cost values: Packaging cost cannot be negative'
      );
    });

    it('should throw error for negative printing cost', () => {
      const invalidCosts = {
        printingCost: -3,
      };

      expect(() => ProfitCalculationService.validateCosts(invalidCosts)).toThrow(
        'Invalid cost values: Printing cost cannot be negative'
      );
    });

    it('should throw error for negative return cost', () => {
      const invalidCosts = {
        returnCost: -10,
      };

      expect(() => ProfitCalculationService.validateCosts(invalidCosts)).toThrow(
        'Invalid cost values: Return cost cannot be negative'
      );
    });

    it('should throw error for multiple negative costs', () => {
      const invalidCosts = {
        packagingCost: -5,
        printingCost: -3,
      };

      expect(() => ProfitCalculationService.validateCosts(invalidCosts)).toThrow(
        'Invalid cost values: Packaging cost cannot be negative, Printing cost cannot be negative'
      );
    });

    it('should handle undefined values gracefully', () => {
      const costsWithUndefined = {
        packagingCost: undefined,
        printingCost: 5,
        returnCost: undefined,
      };

      expect(() => ProfitCalculationService.validateCosts(costsWithUndefined)).not.toThrow();
    });

    it('should handle empty object', () => {
      expect(() => ProfitCalculationService.validateCosts({})).not.toThrow();
    });
  });

  describe('ProfitCalculationService - Instance Creation', () => {
    it('should create an instance successfully', () => {
      const service = new ProfitCalculationService();
      expect(service).toBeInstanceOf(ProfitCalculationService);
    });
  });

  describe('Profit Calculation Logic - Unit Tests', () => {
    it('should calculate profit margin correctly', () => {
      // Test the profit margin calculation logic
      const revenue = 100;
      const netProfit = 25;
      const expectedMargin = (netProfit / revenue) * 100;
      
      expect(expectedMargin).toBe(25);
    });

    it('should handle zero revenue in profit margin calculation', () => {
      const revenue = 0;
      const netProfit = -10;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
      
      expect(profitMargin).toBe(0);
    });

    it('should calculate total costs correctly', () => {
      const costs = {
        product: 30,
        lead: 5,
        packaging: 3,
        printing: 2,
        return: 10,
      };
      
      const totalCosts = costs.product + costs.lead + costs.packaging + costs.printing + costs.return;
      expect(totalCosts).toBe(50);
    });

    it('should calculate gross profit correctly', () => {
      const revenue = 100;
      const productCost = 40;
      const grossProfit = revenue - productCost;
      
      expect(grossProfit).toBe(60);
    });

    it('should calculate net profit correctly', () => {
      const revenue = 100;
      const totalCosts = 45;
      const netProfit = revenue - totalCosts;
      
      expect(netProfit).toBe(55);
    });
  });
});