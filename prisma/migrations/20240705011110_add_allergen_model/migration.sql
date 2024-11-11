/*
  Warnings:

  - You are about to drop the column `allergen` on the `UserAllergy` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `UserAllergy` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `UserAllergy` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `UserAllergy` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserAllergy` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,allergenId]` on the table `UserAllergy` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `allergenId` to the `UserAllergy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserAllergy" DROP COLUMN "allergen",
DROP COLUMN "createdAt",
DROP COLUMN "deletedAt",
DROP COLUMN "isActive",
DROP COLUMN "updatedAt",
ADD COLUMN     "allergenId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Allergen" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Allergen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAllergy_userId_allergenId_key" ON "UserAllergy"("userId", "allergenId");

-- AddForeignKey
ALTER TABLE "UserAllergy" ADD CONSTRAINT "UserAllergy_allergenId_fkey" FOREIGN KEY ("allergenId") REFERENCES "Allergen"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
