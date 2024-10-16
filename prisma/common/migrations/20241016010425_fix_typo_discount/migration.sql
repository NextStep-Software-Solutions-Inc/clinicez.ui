/*
  Warnings:

  - You are about to drop the column `diconut` on the `Plan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "diconut",
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;
