/*
  Warnings:

  - Added the required column `status` to the `UserPlan` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserPlanStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_HOLD', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "UserPlan" ADD COLUMN     "status" "UserPlanStatus" NOT NULL;
