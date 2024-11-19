/*
  Warnings:

  - You are about to drop the column `recieptCodeId` on the `ReceiptCodeClaim` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,receiptCodeId]` on the table `ReceiptCodeClaim` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `receiptCodeId` to the `ReceiptCodeClaim` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ReceiptCodeClaim" DROP CONSTRAINT "ReceiptCodeClaim_recieptCodeId_fkey";

-- DropIndex
DROP INDEX "ReceiptCodeClaim_userId_recieptCodeId_key";

-- AlterTable
ALTER TABLE "ReceiptCodeClaim" DROP COLUMN "recieptCodeId",
ADD COLUMN     "receiptCodeId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptCodeClaim_userId_receiptCodeId_key" ON "ReceiptCodeClaim"("userId", "receiptCodeId");

-- AddForeignKey
ALTER TABLE "ReceiptCodeClaim" ADD CONSTRAINT "ReceiptCodeClaim_receiptCodeId_fkey" FOREIGN KEY ("receiptCodeId") REFERENCES "ReceiptCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
