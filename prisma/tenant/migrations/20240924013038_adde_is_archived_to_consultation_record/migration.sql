-- AlterTable
ALTER TABLE "ConsultationRecord" ADD COLUMN     "hpId" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;
