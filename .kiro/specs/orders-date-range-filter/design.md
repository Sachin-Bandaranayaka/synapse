# Design Document

## Overview

The date range filter feature will add a new filtering component to the orders page that allows users to filter orders by creation date. The component will integrate seamlessly with the existing filter system (search, profit filters, and sorting) and provide both custom date selection and predefined date range shortcuts.

## Architecture

### Component Structure

```
OrdersClient (existing)
├── SearchOrders (existing)
├── ProfitFilter (existing) 
├── ProfitSortOptions (existing)
└── DateRangeFilter (new)
    ├── DateRangePicker (new)
    ├── PredefinedRanges (new)
    └── DateRangeDisplay (new)
```

### Data Flow

1. **URL Parameters**: Date range parameters (`startDate`, `endDate`) are stored in URL search params
2. **Server-Side Filtering**: The orders page server component reads date parameters and applies Prisma filters
3. **Client-Side State**: The DateRangeFilter component manages local state for date selection UI
4. **Navigation**: Router updates URL when date range changes, triggering server-side re-fetch

## Components and Interfaces

### DateRangeFilter Component

**Props Interface:**
```typescript
interface DateRangeFilterProps {
  // No props needed - reads from URL params directly
}
```

**Internal State:**
```typescript
interface DateRangeState {
  isOpen: boolean;
  tempStartDate: string | null;
  tempEndDate: string | null;
  selectedPreset: string | null;
}
```

### Predefined Date Ranges

```typescript
interface DateRangePreset {
  label: string;
  value: string;
  getDateRange: () => { startDate: string; endDate: string };
}

const DATE_PRESETS: DateRangePreset[] = [
  {
    label: 'Today',
    value: 'today',
    getDateRange: () => ({
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    })
  },
  {
    label: 'Yesterday', 
    value: 'yesterday',
    getDateRange: () => ({
      startDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
      endDate: format(subDays(new Date(), 1), 'yyyy-MM-dd')
    })
  },
  {
    label: 'Last 7 days',
    value: 'last7days',
    getDateRange: () => ({
      startDate: format(subDays(new Date(), 6), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    })
  },
  {
    label: 'Last 30 days',
    value: 'last30days', 
    getDateRange: () => ({
      startDate: format(subDays(new Date(), 29), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    })
  },
  {
    label: 'This month',
    value: 'thismonth',
    getDateRange: () => ({
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    })
  },
  {
    label: 'Last month',
    value: 'lastmonth',
    getDateRange: () => ({
      startDate: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
    })
  }
];
```

### Server-Side Integration

**Updated Prisma Where Clause:**
```typescript
const where: Prisma.OrderWhereInput = {
  ...(!canViewAll && user.role === 'TEAM_MEMBER' ? { userId: user.id } : {}),
  ...(searchQuery ? {
    OR: [
      { id: { contains: searchQuery, mode: 'insensitive' } },
      { customerName: { contains: searchQuery, mode: 'insensitive' } },
      { customerPhone: { contains: searchQuery, mode: 'insensitive' } },
      { product: { name: { contains: searchQuery, mode: 'insensitive' } } },
    ],
  } : {}),
  // NEW: Date range filtering
  ...(startDate || endDate ? {
    createdAt: {
      ...(startDate ? { gte: new Date(startDate + 'T00:00:00.000Z') } : {}),
      ...(endDate ? { lte: new Date(endDate + 'T23:59:59.999Z') } : {}),
    }
  } : {}),
};
```

## Data Models

No new database models are required. The feature uses the existing `Order.createdAt` timestamp field for filtering.

### URL Parameter Schema

```typescript
interface OrdersSearchParams {
  query?: string;           // existing
  sort?: string;           // existing  
  profitFilter?: string;   // existing
  startDate?: string;      // new - format: YYYY-MM-DD
  endDate?: string;        // new - format: YYYY-MM-DD
  preset?: string;         // new - predefined range identifier
}
```

## Error Handling

### Invalid Date Formats
- **Client-side validation**: Validate date inputs before applying filter
- **Server-side fallback**: Ignore invalid date parameters and log warnings
- **User feedback**: Show error message for invalid date selections

### Date Range Logic Errors
- **Start date after end date**: Automatically swap dates or show validation error
- **Future dates**: Allow future dates but show warning if no results
- **Very large ranges**: No restriction, but consider performance implications

### Network/Loading States
- **Loading indicator**: Show spinner while fetching filtered results
- **Error states**: Display error message if filtering fails
- **Empty states**: Show "No orders found for selected date range" message

## Testing Strategy

### Unit Tests
- **DateRangeFilter component**: Test date selection, preset selection, URL parameter handling
- **Date utility functions**: Test date range calculations and formatting
- **URL parameter parsing**: Test valid/invalid date parameter handling

### Integration Tests  
- **Filter combination**: Test date range with search, profit filters, and sorting
- **URL persistence**: Test that date range parameters persist across navigation
- **Server-side filtering**: Test Prisma query generation with date parameters

### End-to-End Tests
- **Complete user flow**: Select date range → see filtered results → navigate away → return with filters intact
- **Mobile responsiveness**: Test date picker and filter UI on mobile devices
- **Performance**: Test with large datasets and various date ranges

### Test Data Requirements
- Orders with various creation dates spanning multiple months
- Edge cases: orders created at midnight, different timezones
- Large datasets to test performance with date range queries

## Performance Considerations

### Database Indexing
- Ensure `createdAt` field has proper indexing for efficient date range queries
- Consider composite indexes if combining with other frequent filters

### Query Optimization
- Use database-level date filtering rather than application-level filtering
- Limit result sets appropriately to avoid memory issues

### Caching Strategy
- Consider caching common date range queries (e.g., "Last 30 days")
- Invalidate caches when new orders are created

## Accessibility

### Keyboard Navigation
- Date picker should be fully keyboard accessible
- Tab order should be logical through filter controls
- Escape key should close date picker dropdown

### Screen Reader Support
- Proper ARIA labels for date inputs and filter buttons
- Announce filter changes to screen readers
- Clear labeling of date range status

### Visual Design
- Sufficient color contrast for date picker elements
- Clear visual indication of selected dates and active filters
- Responsive design that works at various zoom levels