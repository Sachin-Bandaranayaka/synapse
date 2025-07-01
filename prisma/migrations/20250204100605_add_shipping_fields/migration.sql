/*
  Warnings:

  - You are about to drop the column `courier` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceUrl` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `qrCode` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingId` on the `Order` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ShippingProvider" AS ENUM ('FARDA_EXPRESS', 'TRANS_EXPRESS', 'SL_POST');

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "courier",
DROP COLUMN "invoiceUrl",
DROP COLUMN "qrCode",
DROP COLUMN "shippingId",
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "shippingProvider" "ShippingProvider",
ADD COLUMN     "trackingNumber" TEXT;
