-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "referredById" TEXT;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
