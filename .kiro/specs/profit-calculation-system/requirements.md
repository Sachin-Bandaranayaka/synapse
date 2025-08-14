# Requirements Document

## Introduction

This feature implements a comprehensive profit calculation system that tracks costs at multiple levels to provide accurate profit analysis per order, lead batch, and time period. The system will track product costs, lead acquisition costs, packaging/printing expenses, and return costs to calculate true profitability across the business.

## Requirements

### Requirement 1

**User Story:** As a business owner, I want to track the cost price of products, so that I can calculate the gross profit margin on each sale.

#### Acceptance Criteria

1. WHEN creating or editing a product THEN the system SHALL provide a field to enter the cost price
2. WHEN displaying product information THEN the system SHALL show both selling price and cost price
3. WHEN calculating profit THEN the system SHALL use (selling price - cost price) * quantity as the base profit calculation
4. IF no cost price is provided THEN the system SHALL treat cost price as 0 and show a warning

### Requirement 2

**User Story:** As a marketing manager, I want to track lead acquisition costs per batch, so that I can calculate the cost per lead and factor it into profit calculations.

#### Acceptance Criteria

1. WHEN importing leads THEN the system SHALL provide a field to enter the total cost spent on acquiring these leads
2. WHEN leads are imported with a cost THEN the system SHALL automatically calculate cost per lead (total cost / number of leads)
3. WHEN a lead is converted to an order THEN the system SHALL associate the lead cost with that order
4. IF leads are imported without cost information THEN the system SHALL treat lead cost as 0

### Requirement 3

**User Story:** As an operations manager, I want to track packaging and printing costs per order, so that I can include operational expenses in profit calculations.

#### Acceptance Criteria

1. WHEN creating or confirming an order THEN the system SHALL provide fields to enter packaging cost and printing cost
2. WHEN calculating order profit THEN the system SHALL subtract packaging and printing costs from the gross profit
3. WHEN no packaging/printing costs are specified THEN the system SHALL use configurable default values per tenant
4. WHEN displaying order details THEN the system SHALL show all cost components separately

### Requirement 4

**User Story:** As a customer service manager, I want to track return costs when processing returns, so that I can calculate the actual loss from returned orders.

#### Acceptance Criteria

1. WHEN marking an order as returned THEN the system SHALL prompt for the return shipping cost
2. WHEN processing a return THEN the system SHALL calculate the total loss including original costs (product cost + lead cost + packaging cost + return shipping cost)
3. WHEN a return is processed THEN the system SHALL update the profit calculation to reflect the loss
4. IF return shipping cost is not provided THEN the system SHALL use a configurable default return cost

### Requirement 5

**User Story:** As a business analyst, I want to view detailed profit breakdowns per order, so that I can understand the profitability of individual transactions.

#### Acceptance Criteria

1. WHEN viewing an order THEN the system SHALL display a profit breakdown showing:
   - Revenue (selling price * quantity - discount)
   - Product cost (cost price * quantity)
   - Lead acquisition cost
   - Packaging cost
   - Printing cost
   - Return cost (if applicable)
   - Net profit/loss
2. WHEN the order status changes THEN the system SHALL recalculate profit automatically
3. WHEN displaying the breakdown THEN the system SHALL show both absolute values and percentages

### Requirement 6

**User Story:** As a business owner, I want to view profit reports by time period, so that I can analyze business performance over weeks, months, and custom date ranges.

#### Acceptance Criteria

1. WHEN accessing profit reports THEN the system SHALL provide options for daily, weekly, monthly, and custom date range views
2. WHEN generating reports THEN the system SHALL show:
   - Total revenue
   - Total costs (broken down by category)
   - Net profit
   - Profit margin percentage
   - Number of orders and returns
3. WHEN viewing period reports THEN the system SHALL include impact of returns processed during that period
4. WHEN filtering reports THEN the system SHALL allow filtering by product, user, or order status

### Requirement 7

**User Story:** As a system administrator, I want to configure default cost values per tenant, so that I can streamline data entry and ensure consistent cost tracking.

#### Acceptance Criteria

1. WHEN accessing tenant settings THEN the system SHALL provide fields for:
   - Default packaging cost per order
   - Default printing cost per order
   - Default return shipping cost
2. WHEN creating new orders THEN the system SHALL pre-populate with default cost values
3. WHEN defaults are updated THEN the system SHALL only apply to new orders, not existing ones
4. IF no defaults are set THEN the system SHALL use zero values and show warnings

### Requirement 8

**User Story:** As a data analyst, I want to export profit data, so that I can perform advanced analysis in external tools.

#### Acceptance Criteria

1. WHEN viewing profit reports THEN the system SHALL provide export options for CSV and Excel formats
2. WHEN exporting data THEN the system SHALL include all cost components and calculated fields
3. WHEN exporting THEN the system SHALL respect current filters and date ranges
4. WHEN export is complete THEN the system SHALL provide download link or email the file