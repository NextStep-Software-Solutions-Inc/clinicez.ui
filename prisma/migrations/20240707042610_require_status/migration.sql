/*
  Warnings:

  - Made the column `status` on table `UserHealthCondition` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UserHealthCondition" ALTER COLUMN "status" SET NOT NULL;
