-- Add total column
ALTER TABLE "Order" ADD COLUMN "total" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Update existing orders with calculated totals
UPDATE "Order" o
SET total = p.price * o.quantity
FROM "Product" p
WHERE o."productId" = p.id;

-- CreateIndex
CREATE INDEX "Lead_productCode_idx" ON "Lead"("productCode");

-- CreateIndex
CREATE INDEX "Lead_userId_idx" ON "Lead"("userId");

-- CreateIndex
CREATE INDEX "Order_productId_idx" ON "Order"("productId");

-- CreateIndex
CREATE INDEX "Order_leadId_idx" ON "Order"("leadId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Product_code_idx" ON "Product"("code");

-- CreateIndex
CREATE INDEX "StockAdjustment_productId_idx" ON "StockAdjustment"("productId");

-- CreateIndex
CREATE INDEX "StockAdjustment_userId_idx" ON "StockAdjustment"("userId");

-- CreateIndex
CREATE INDEX "TrackingUpdate_orderId_idx" ON "TrackingUpdate"("orderId");

-- CreateIndex
CREATE INDEX "TrackingUpdate_timestamp_idx" ON "TrackingUpdate"("timestamp");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
