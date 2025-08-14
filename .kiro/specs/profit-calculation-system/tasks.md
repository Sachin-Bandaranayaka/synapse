# Implementation Plan

- [x] 1. Database Schema Updates
  - Update Prisma schema to add new cost-related tables and fields
  - Create migration files for LeadBatch, OrderCosts, and TenantCostConfig models
  - Add costPrice field to Product model and batchId to Lead model
  - _Requirements: 1.1, 2.2, 3.3, 4.1, 7.1_

- [ ] 2. Core Profit Calculation Service
  - Create ProfitCalculationService class with order profit calculation logic
  - Implement calculateOrderProfit method that computes all cost components
  - Add profit recalculation logic for status changes (especially returns)
  - Write unit tests for profit calculation edge cases and scenarios
  - _Requirements: 1.3, 3.2, 4.2, 5.1_

- [x] 3. Cost Tracking Service Implementation
  - Create CostTrackingService class for managing cost data
  - Implement lead batch cost distribution logic
  - Add methods for applying tenant default costs to orders
  - Create return cost processing functionality
  - Write unit tests for cost tracking operations
  - _Requirements: 2.2, 3.1, 4.1, 7.2_

- [x] 4. Enhanced Product Management
  - Update product creation/edit forms to include cost price field
  - Modify product API endpoints to handle cost price data
  - Update product validation schema to include cost price
  - Add cost price display to product list and detail views
  - _Requirements: 1.1, 1.2_

- [x] 5. Lead Import with Batch Costing
  - Enhance lead import API to accept total cost parameter
  - Create LeadBatch records during import with cost distribution
  - Update lead import UI to include cost input field
  - Add cost per lead calculation and display
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 6. Order Cost Management
  - Create OrderCosts model and associated API endpoints
  - Add cost input fields to order creation/confirmation forms
  - Implement automatic cost calculation using defaults and lead costs
  - Create order cost update functionality for manual adjustments
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 7. Return Cost Processing
  - Add return cost input modal to order status update flow
  - Implement return cost calculation and profit impact logic
  - Update order status change API to handle return costs
  - Create return cost validation and business rules
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 8. Tenant Cost Configuration
  - Create TenantCostConfig API endpoints for CRUD operations
  - Build cost configuration form component for tenant settings
  - Implement default cost application logic in order processing
  - Add cost configuration to tenant settings page
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 9. Profit Breakdown Display Component
  - Create ProfitBreakdownCard component showing detailed cost breakdown
  - Implement profit visualization with charts and percentages
  - Add profit breakdown to order detail pages
  - Create responsive design for mobile and desktop views
  - _Requirements: 5.1, 5.2_

- [x] 10. Profit Reporting System
  - Create profit reports API endpoints with filtering and date ranges
  - Build ProfitReportsPage component with interactive filters
  - Implement period-based profit calculations (daily, weekly, monthly)
  - Add profit trend charts and summary statistics
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 11. Data Export Functionality
  - Add CSV/Excel export capabilities to profit reports
  - Implement export API endpoints with proper data formatting
  - Create export UI controls and download functionality
  - Add export progress indicators and error handling
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 12. Integration Testing and Validation
  - Write integration tests for complete profit calculation flow
  - Test multi-tenant cost isolation and calculations
  - Validate profit recalculation triggers and accuracy
  - Test export functionality with various data sets
  - _Requirements: All requirements validation_

- [x] 13. Performance Optimization
  - Implement caching for frequently accessed profit calculations
  - Optimize database queries for profit reporting
  - Add database indexes for cost-related queries
  - Test and optimize report generation performance
  - _Requirements: 6.2, 8.3_

- [x] 14. Error Handling and Edge Cases
  - Implement comprehensive error handling for profit calculations
  - Add validation for negative costs and invalid data scenarios
  - Create fallback mechanisms for missing cost data
  - Add user-friendly error messages and warnings
  - _Requirements: 1.4, 2.4, 3.4, 4.4_

- [x] 15. UI/UX Enhancements
  - Add profit indicators to order lists and dashboards
  - Create profit alerts for low-margin or loss-making orders
  - Implement profit-based filtering and sorting options
  - Add tooltips and help text for cost-related fields
  - _Requirements: 5.1, 5.2_

- [ ] 16. Documentation and Migration
  - Create database migration scripts for production deployment
  - Write API documentation for new profit-related endpoints
  - Create user guide for cost tracking and profit analysis features
  - Prepare data migration scripts for existing orders
  - _Requirements: All requirements implementation support_