/*
  Warnings:

  - Added the required column `orgUid` to the `PreConsultationNote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PreConsultationNote" ADD COLUMN     "orgUid" TEXT NOT NULL;
