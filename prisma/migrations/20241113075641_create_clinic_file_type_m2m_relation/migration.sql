/*
  Warnings:

  - You are about to drop the `FileTypeAttribute` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FileTypeAttribute" DROP CONSTRAINT "FileTypeAttribute_fileTypeId_fkey";

-- DropForeignKey
ALTER TABLE "FileTypeAttribute" DROP CONSTRAINT "FileTypeAttribute_scopeClinicId_fkey";

-- DropTable
DROP TABLE "FileTypeAttribute";

-- CreateTable
CREATE TABLE "ClinicFileType" (
    "id" SERIAL NOT NULL,
    "fileTypeId" INTEGER NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "validityDays" INTEGER NOT NULL DEFAULT 0,
    "dateTakenRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ClinicFileType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicFileType_fileTypeId_clinicId_key" ON "ClinicFileType"("fileTypeId", "clinicId");

-- AddForeignKey
ALTER TABLE "ClinicFileType" ADD CONSTRAINT "ClinicFileType_fileTypeId_fkey" FOREIGN KEY ("fileTypeId") REFERENCES "FileType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicFileType" ADD CONSTRAINT "ClinicFileType_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
