-- Add performance indexes for profit calculation queries

-- Index for Order queries by date range and tenant (most common profit report query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_tenantId_createdAt_status_idx" ON "Order"("tenantId", "createdAt", "status");

-- Index for Order queries by product and date (product-specific profit reports)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_productId_createdAt_idx" ON "Order"("productId", "createdAt");

-- Index for Order queries by user and date (user-specific profit reports)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- Composite index for OrderCosts queries (profit calculations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "OrderCosts_orderId_netProfit_idx" ON "OrderCosts"("orderId", "netProfit");

-- Index for LeadBatch queries by tenant and date (lead cost analysis)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "LeadBatch_tenantId_importedAt_idx" ON "LeadBatch"("tenantId", "importedAt");

-- Index for Lead queries by batch and tenant (lead cost distribution)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Lead_batchId_tenantId_idx" ON "Lead"("batchId", "tenantId");

-- Index for Product queries by tenant and cost price (cost analysis)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_tenantId_costPrice_idx" ON "Product"("tenantId", "costPrice");

-- Partial index for orders with costs (only index orders that have cost records)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_with_costs_idx" ON "Order"("tenantId", "createdAt") 
WHERE EXISTS (SELECT 1 FROM "OrderCosts" WHERE "OrderCosts"."orderId" = "Order"."id");

-- Index for profit margin analysis (orders with high/low margins)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "OrderCosts_profitMargin_idx" ON "OrderCosts"("profitMargin") 
WHERE "profitMargin" IS NOT NULL;

-- Index for return cost analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS "OrderCosts_returnCost_idx" ON "OrderCosts"("returnCost") 
WHERE "returnCost" > 0;