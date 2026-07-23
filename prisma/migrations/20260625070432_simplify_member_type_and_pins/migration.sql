/*
  Warnings:

  - You are about to drop the column `memberTypeId` on the `PhilHealthRecord` table. All the data in the column will be lost.
  - You are about to drop the `PhilHealthMemberType` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PhilHealthMemberType" DROP CONSTRAINT "PhilHealthMemberType_parentId_fkey";

-- DropForeignKey
ALTER TABLE "PhilHealthRecord" DROP CONSTRAINT "PhilHealthRecord_memberTypeId_fkey";

-- AlterTable
ALTER TABLE "PhilHealthKonsultaEnlistment" ADD COLUMN     "dependentPin" TEXT,
ADD COLUMN     "memberPin" TEXT;

-- AlterTable
ALTER TABLE "PhilHealthRecord" DROP COLUMN "memberTypeId",
ADD COLUMN     "dependentPin" TEXT,
ADD COLUMN     "memberType" TEXT NOT NULL DEFAULT 'MM';

-- DropTable
DROP TABLE "PhilHealthMemberType";

-- DropEnum
DROP TYPE "PhilHealthMemberCategory";
