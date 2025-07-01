-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "invoicePrinted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "number" SERIAL NOT NULL;
