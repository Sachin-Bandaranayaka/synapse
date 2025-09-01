import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DateRangeFilter } from '../date-range-filter';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { vi, beforeEach, describe, it, expect } from 'vitest';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

const mockPush = vi.fn();
let mockSearchParams: URLSearchParams;

beforeEach(() => {
  mockSearchParams = new URLSearchParams();
  (useRouter as any).mockReturnValue({
    push: mockPush,
  });
  (useSearchParams as any).mockReturnValue(mockSearchParams);
  mockPush.mockClear();
});

describe('DateRangeFilter', () => {
  it('renders with default text when no date range is selected', () => {
    render(<DateRangeFilter />);
    expect(screen.getByText('All dates')).toBeInTheDocument();
  });

  it('displays predefined date range shortcuts when opened', () => {
    render(<DateRangeFilter />);
    
    // Open the dropdown
    fireEvent.click(screen.getByText('All dates'));
    
    // Check that all predefined shortcuts are present
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    expect(screen.getByText('This month')).toBeInTheDocument();
    expect(screen.getByText('Last month')).toBeInTheDocument();
  });

  it('applies correct date range when "Today" preset is selected', () => {
    render(<DateRangeFilter />);
    
    // Open dropdown and click Today
    fireEvent.click(screen.getByText('All dates'));
    fireEvent.click(screen.getByText('Today'));
    
    const today = format(new Date(), 'yyyy-MM-dd');
    expect(mockPush).toHaveBeenCalledWith(
      `/orders?startDate=${today}&endDate=${today}&preset=today`
    );
  });

  it('applies correct date range when "Last 7 days" preset is selected', () => {
    render(<DateRangeFilter />);
    
    // Open dropdown and click Last 7 days
    fireEvent.click(screen.getByText('All dates'));
    fireEvent.click(screen.getByText('Last 7 days'));
    
    const startDate = format(subDays(new Date(), 6), 'yyyy-MM-dd');
    const endDate = format(new Date(), 'yyyy-MM-dd');
    expect(mockPush).toHaveBeenCalledWith(
      `/orders?startDate=${startDate}&endDate=${endDate}&preset=last7days`
    );
  });

  it('applies correct date range when "This month" preset is selected', () => {
    render(<DateRangeFilter />);
    
    // Open dropdown and click This month
    fireEvent.click(screen.getByText('All dates'));
    fireEvent.click(screen.getByText('This month'));
    
    const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    expect(mockPush).toHaveBeenCalledWith(
      `/orders?startDate=${startDate}&endDate=${endDate}&preset=thismonth`
    );
  });

  it('displays preset name when preset is active from URL', () => {
    // Mock URL params with active preset
    mockSearchParams.set('preset', 'today');
    mockSearchParams.set('startDate', format(new Date(), 'yyyy-MM-dd'));
    mockSearchParams.set('endDate', format(new Date(), 'yyyy-MM-dd'));
    
    render(<DateRangeFilter />);
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('clears preset when custom date is manually entered', () => {
    render(<DateRangeFilter />);
    
    // Open dropdown and manually set a custom date
    fireEvent.click(screen.getByText('All dates'));
    const startDateInput = screen.getByLabelText('Start Date');
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
    
    // Apply the filter
    fireEvent.click(screen.getByText('Apply'));
    
    // Should not include preset parameter when using custom dates
    const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0];
    expect(lastCall).toContain('startDate=2024-01-01');
    expect(lastCall).not.toContain('preset=');
  });

  it('preserves existing URL parameters when applying date range', () => {
    // Set up existing parameters
    mockSearchParams.set('query', 'test-search');
    mockSearchParams.set('sort', 'createdAt:desc');
    mockSearchParams.set('profitFilter', 'profitable');
    
    render(<DateRangeFilter />);
    
    // Apply a date range
    fireEvent.click(screen.getByText('All dates'));
    fireEvent.click(screen.getByText('Today'));
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0];
    
    // Should preserve existing parameters
    expect(lastCall).toContain('query=test-search');
    expect(lastCall).toContain('sort=createdAt%3Adesc');
    expect(lastCall).toContain('profitFilter=profitable');
    // And add date parameters
    expect(lastCall).toContain(`startDate=${today}`);
    expect(lastCall).toContain(`endDate=${today}`);
    expect(lastCall).toContain('preset=today');
  });

  it('clears date range parameters when clear is clicked', () => {
    // Set up existing date parameters
    mockSearchParams.set('startDate', '2024-01-01');
    mockSearchParams.set('endDate', '2024-01-31');
    mockSearchParams.set('preset', 'thismonth');
    mockSearchParams.set('query', 'test-search'); // Other parameter to preserve
    
    render(<DateRangeFilter />);
    
    // Open dropdown and click clear
    fireEvent.click(screen.getByText('This month')); // Button shows preset name
    fireEvent.click(screen.getByText('Clear'));
    
    const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0];
    
    // Should preserve other parameters but remove date parameters
    expect(lastCall).toContain('query=test-search');
    expect(lastCall).not.toContain('startDate=');
    expect(lastCall).not.toContain('endDate=');
    expect(lastCall).not.toContain('preset=');
  });

  it('displays custom date range in button text', () => {
    // Mock URL params with custom date range
    mockSearchParams.set('startDate', '2024-01-01');
    mockSearchParams.set('endDate', '2024-01-31');
    
    render(<DateRangeFilter />);
    
    // Should display the date range in short format
    expect(screen.getByText(/Jan 1 - Jan 31/)).toBeInTheDocument();
  });

  it('displays single date when start and end are the same', () => {
    // Mock URL params with same start and end date
    mockSearchParams.set('startDate', '2024-01-01');
    mockSearchParams.set('endDate', '2024-01-01');
    
    render(<DateRangeFilter />);
    
    // Should display single date in standard format
    expect(screen.getByText(/1\/1\/2024/)).toBeInTheDocument();
  });

  it('validates date range before applying filter', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<DateRangeFilter />);
    
    // Open the filter
    fireEvent.click(screen.getByText('All dates'));
    
    // Set invalid date range (start date after end date)
    const startDateInput = screen.getByLabelText('Start Date');
    const endDateInput = screen.getByLabelText('End Date');
    
    fireEvent.change(startDateInput, { target: { value: '2024-01-31' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-01' } });
    
    // Try to apply the filter
    fireEvent.click(screen.getByText('Apply'));
    
    // Should log validation error and not navigate
    expect(consoleSpy).toHaveBeenCalledWith('Invalid date range:', 'Start date must be before or equal to end date');
    expect(mockPush).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('shows clear button when date filter is active', () => {
    // Mock URL params with active date filter
    mockSearchParams.set('startDate', '2024-01-01');
    mockSearchParams.set('endDate', '2024-01-31');
    
    render(<DateRangeFilter />);
    
    // Should show clear button when filter is active
    const clearButton = screen.getByTitle('Clear date filter');
    expect(clearButton).toBeInTheDocument();
    
    // Click clear button should clear the filter
    fireEvent.click(clearButton);
    expect(mockPush).toHaveBeenCalledWith('/orders');
  });

  it('shows different button styling when filter is active', () => {
    // Test inactive state
    const { rerender } = render(<DateRangeFilter />);
    const inactiveButton = screen.getByText('All dates').closest('button');
    expect(inactiveButton).toHaveClass('bg-gray-700');
    
    // Mock active state
    mockSearchParams.set('preset', 'today');
    mockSearchParams.set('startDate', format(new Date(), 'yyyy-MM-dd'));
    mockSearchParams.set('endDate', format(new Date(), 'yyyy-MM-dd'));
    
    rerender(<DateRangeFilter />);
    const activeButton = screen.getByText('Today').closest('button');
    expect(activeButton).toHaveClass('bg-indigo-600');
  });

  it('shows tooltip with current filter status', () => {
    // Test default tooltip
    render(<DateRangeFilter />);
    const button = screen.getByText('All dates').closest('button');
    expect(button).toHaveAttribute('title', 'Click to filter orders by date range');
    
    // Test with active preset
    mockSearchParams.set('preset', 'today');
    mockSearchParams.set('startDate', format(new Date(), 'yyyy-MM-dd'));
    mockSearchParams.set('endDate', format(new Date(), 'yyyy-MM-dd'));
    
    const { rerender } = render(<DateRangeFilter />);
    rerender(<DateRangeFilter />);
    
    const activeButton = screen.getByText('Today').closest('button');
    const today = new Date().toLocaleDateString();
    expect(activeButton).toHaveAttribute('title', `Today: ${today} - ${today}`);
  });
});