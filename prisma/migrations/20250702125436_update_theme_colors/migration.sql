/*
  Warnings:

  - You are about to drop the column `primaryColor` on the `Tenant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "primaryColor",
ADD COLUMN     "backgroundColor" TEXT,
ADD COLUMN     "cardColor" TEXT,
ADD COLUMN     "fontColor" TEXT;
