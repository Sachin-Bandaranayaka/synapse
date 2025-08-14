/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProfitBreakdownCard } from '../profit-breakdown';

// Mock the chart components
vi.mock('@/components/charts/pie-chart', () => ({
  default: ({ title }: { title: string }) => <div data-testid="pie-chart">{title}</div>
}));

vi.mock('@/components/charts/bar-chart', () => ({
  default: ({ title }: { title: string }) => <div data-testid="bar-chart">{title}</div>
}));

// Mock fetch
global.fetch = vi.fn();

const mockProfitBreakdown = {
  orderId: 'test-order-id',
  revenue: 1000,
  costs: {
    product: 400,
    lead: 50,
    packaging: 25,
    printing: 15,
    return: 0,
    total: 490
  },
  grossProfit: 600,
  netProfit: 510,
  profitMargin: 51.0,
  isReturn: false
};

const mockReturnedOrderBreakdown = {
  ...mockProfitBreakdown,
  costs: {
    ...mockProfitBreakdown.costs,
    return: 30,
    total: 520
  },
  netProfit: 480,
  profitMargin: 48.0,
  isReturn: true
};

describe('ProfitBreakdownCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<ProfitBreakdownCard orderId="test-order" />);
    
    expect(screen.getByTestId('profit-breakdown-loading')).toBeInTheDocument();
  });

  it('renders error state when fetch fails', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));
    
    render(<ProfitBreakdownCard orderId="test-order" />);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('renders profit breakdown with all key metrics', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProfitBreakdown)
    });
    
    render(<ProfitBreakdownCard orderId="test-order" />);
    
    await waitFor(() => {
      expect(screen.getByText('Profit Analysis')).toBeInTheDocument();
    });

    // Check key metrics
    expect(screen.getByText('$1,000.00')).toBeInTheDocument(); // Revenue
    expect(screen.getByText('$490.00')).toBeInTheDocument(); // Total Costs
    expect(screen.getByText('$510.00')).toBeInTheDocument(); // Net Profit
    expect(screen.getByText('51.0%')).toBeInTheDocument(); // Profit Margin
  });

  it('shows profit status badge correctly', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProfitBreakdown)
    });
    
    render(<ProfitBreakdownCard orderId="test-order" />);
    
    await waitFor(() => {
      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });
  });

  it('shows returned order badge when order is returned', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockReturnedOrderBreakdown)
    });
    
    render(<ProfitBreakdownCard orderId="test-order" />);
    
    await waitFor(() => {
      expect(screen.getByText('RETURNED')).toBeInTheDocument();
    });
  });

  it('renders detailed breakdown in tabs', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProfitBreakdown)
    });
    
    render(<ProfitBreakdownCard orderId="test-order" showDetails={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Cost Analysis')).toBeInTheDocument();
      expect(screen.getByText('Comparison')).toBeInTheDocument();
    });

    // Check detailed cost breakdown
    expect(screen.getByText('Product Cost')).toBeInTheDocument();
    expect(screen.getByText('Lead Acquisition')).toBeInTheDocument();
    expect(screen.getByText('Packaging')).toBeInTheDocument();
    expect(screen.getByText('Printing')).toBeInTheDocument();
  });

  it('hides details when showDetails is false', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProfitBreakdown)
    });
    
    render(<ProfitBreakdownCard orderId="test-order" showDetails={false} />);
    
    await waitFor(() => {
      expect(screen.getByText('Profit Analysis')).toBeInTheDocument();
    });

    // Should not show tabs
    expect(screen.queryByText('Breakdown')).not.toBeInTheDocument();
    expect(screen.queryByText('Cost Analysis')).not.toBeInTheDocument();
  });

  it('formats currency correctly', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProfitBreakdown)
    });
    
    render(<ProfitBreakdownCard orderId="test-order" />);
    
    await waitFor(() => {
      // Check that currency is formatted with $ and commas
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      expect(screen.getByText('$510.00')).toBeInTheDocument();
    });
  });

  it('shows profit color coding correctly', async () => {
    const lossBreakdown = {
      ...mockProfitBreakdown,
      netProfit: -100,
      profitMargin: -10.0
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(lossBreakdown)
    });
    
    render(<ProfitBreakdownCard orderId="test-order" />);
    
    await waitFor(() => {
      expect(screen.getByText('Loss')).toBeInTheDocument();
    });
  });

  it('calls the correct API endpoint', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProfitBreakdown)
    });
    
    render(<ProfitBreakdownCard orderId="test-order-123" />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/orders/test-order-123/costs');
    });
  });

  it('shows low profit margin warning', async () => {
    const lowMarginBreakdown = {
      ...mockProfitBreakdown,
      netProfit: 50,
      profitMargin: 5.0
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(lowMarginBreakdown)
    });
    
    render(<ProfitBreakdownCard orderId="test-order" />);
    
    await waitFor(() => {
      expect(screen.getByText('Low Profit Margin')).toBeInTheDocument();
      expect(screen.getByText('Consider reviewing costs or pricing to improve profitability.')).toBeInTheDocument();
    });
  });
});