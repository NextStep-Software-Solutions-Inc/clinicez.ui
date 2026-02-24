-- CreateEnum
CREATE TYPE "FilePrivacy" AS ENUM ('PRIVATE', 'CLINIC', 'PUBLIC');

-- AlterTable FolderSetting: add privacy column
ALTER TABLE "FolderSetting" ADD COLUMN "privacy" "FilePrivacy" NOT NULL DEFAULT 'PRIVATE';

-- AlterTable FileSetting: add privacy column
ALTER TABLE "FileSetting" ADD COLUMN "privacy" "FilePrivacy" NOT NULL DEFAULT 'PRIVATE';

-- CreateTable FolderClinicShare
CREATE TABLE "FolderClinicShare" (
    "id" SERIAL NOT NULL,
    "folderSettingId" INTEGER NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FolderClinicShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable FileClinicShare
CREATE TABLE "FileClinicShare" (
    "id" SERIAL NOT NULL,
    "fileSettingId" INTEGER NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileClinicShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FolderClinicShare_folderSettingId_clinicId_key" ON "FolderClinicShare"("folderSettingId", "clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "FileClinicShare_fileSettingId_clinicId_key" ON "FileClinicShare"("fileSettingId", "clinicId");

-- AddForeignKey
ALTER TABLE "FolderClinicShare" ADD CONSTRAINT "FolderClinicShare_folderSettingId_fkey" FOREIGN KEY ("folderSettingId") REFERENCES "FolderSetting"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FolderClinicShare" ADD CONSTRAINT "FolderClinicShare_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FileClinicShare" ADD CONSTRAINT "FileClinicShare_fileSettingId_fkey" FOREIGN KEY ("fileSettingId") REFERENCES "FileSetting"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FileClinicShare" ADD CONSTRAINT "FileClinicShare_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
