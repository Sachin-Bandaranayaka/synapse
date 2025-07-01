-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerEmail" TEXT;

-- CreateTable
CREATE TABLE "TrackingUpdate" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingUpdate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TrackingUpdate" ADD CONSTRAINT "TrackingUpdate_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
