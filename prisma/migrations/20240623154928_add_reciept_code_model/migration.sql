-- CreateEnum
CREATE TYPE "Coverage" AS ENUM ('ALL', 'TENANT', 'HEALTHCARE_PROVIDER');

-- CreateEnum
CREATE TYPE "RecieptCodeStatus" AS ENUM ('UNUSED', 'USED', 'EXPIRED');

-- CreateTable
CREATE TABLE "RecieptCode" (
    "id" SERIAL NOT NULL,
    "coverage" "Coverage" NOT NULL,
    "code" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "RecieptCodeStatus" NOT NULL DEFAULT 'UNUSED',
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RecieptCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecieptCodeClaim" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "recieptCodeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RecieptCodeClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecieptCode_code_key" ON "RecieptCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RecieptCodeClaim_userId_recieptCodeId_key" ON "RecieptCodeClaim"("userId", "recieptCodeId");

-- AddForeignKey
ALTER TABLE "RecieptCodeClaim" ADD CONSTRAINT "RecieptCodeClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecieptCodeClaim" ADD CONSTRAINT "RecieptCodeClaim_recieptCodeId_fkey" FOREIGN KEY ("recieptCodeId") REFERENCES "RecieptCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
