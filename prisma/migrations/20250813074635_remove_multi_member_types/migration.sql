/*
  Warnings:

  - You are about to drop the `PhilHealthRecordMemberType` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."PhilHealthRecordMemberType" DROP CONSTRAINT "PhilHealthRecordMemberType_memberTypeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PhilHealthRecordMemberType" DROP CONSTRAINT "PhilHealthRecordMemberType_philHealthRecordId_fkey";

-- DropTable
DROP TABLE "public"."PhilHealthRecordMemberType";
