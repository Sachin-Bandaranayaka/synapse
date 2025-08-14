-- CreateTable
CREATE TABLE "LeadBatch" (
    "id" TEXT NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "leadCount" INTEGER NOT NULL DEFAULT 0,
    "costPerLead" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "LeadBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCosts" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "leadCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "packagingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "printingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "returnCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCosts" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profitMargin" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "OrderCosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantCostConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "defaultPackagingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultPrintingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultReturnCost" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "TenantCostConfig_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LeadBatch" ADD CONSTRAINT "LeadBatch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadBatch" ADD CONSTRAINT "LeadBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCosts" ADD CONSTRAINT "OrderCosts_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantCostConfig" ADD CONSTRAINT "TenantCostConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "batchId" TEXT;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "LeadBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "LeadBatch_tenantId_idx" ON "LeadBatch"("tenantId");

-- CreateIndex
CREATE INDEX "LeadBatch_userId_idx" ON "LeadBatch"("userId");

-- CreateIndex
CREATE INDEX "LeadBatch_importedAt_idx" ON "LeadBatch"("importedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderCosts_orderId_key" ON "OrderCosts"("orderId");

-- CreateIndex
CREATE INDEX "OrderCosts_orderId_idx" ON "OrderCosts"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantCostConfig_tenantId_key" ON "TenantCostConfig"("tenantId");

-- CreateIndex
CREATE INDEX "TenantCostConfig_tenantId_idx" ON "TenantCostConfig"("tenantId");

-- CreateIndex
CREATE INDEX "Lead_batchId_idx" ON "Lead"("batchId");