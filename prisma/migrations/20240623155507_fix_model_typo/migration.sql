/*
  Warnings:

  - You are about to drop the `RecieptCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RecieptCodeClaim` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ReceiptCodeStatus" AS ENUM ('UNUSED', 'USED', 'EXPIRED');

-- DropForeignKey
ALTER TABLE "RecieptCodeClaim" DROP CONSTRAINT "RecieptCodeClaim_recieptCodeId_fkey";

-- DropForeignKey
ALTER TABLE "RecieptCodeClaim" DROP CONSTRAINT "RecieptCodeClaim_userId_fkey";

-- DropTable
DROP TABLE "RecieptCode";

-- DropTable
DROP TABLE "RecieptCodeClaim";

-- DropEnum
DROP TYPE "RecieptCodeStatus";

-- CreateTable
CREATE TABLE "ReceiptCode" (
    "id" SERIAL NOT NULL,
    "coverage" "Coverage" NOT NULL,
    "code" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "ReceiptCodeStatus" NOT NULL DEFAULT 'UNUSED',
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReceiptCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptCodeClaim" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "recieptCodeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReceiptCodeClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptCode_code_key" ON "ReceiptCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptCodeClaim_userId_recieptCodeId_key" ON "ReceiptCodeClaim"("userId", "recieptCodeId");

-- AddForeignKey
ALTER TABLE "ReceiptCodeClaim" ADD CONSTRAINT "ReceiptCodeClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptCodeClaim" ADD CONSTRAINT "ReceiptCodeClaim_recieptCodeId_fkey" FOREIGN KEY ("recieptCodeId") REFERENCES "ReceiptCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
