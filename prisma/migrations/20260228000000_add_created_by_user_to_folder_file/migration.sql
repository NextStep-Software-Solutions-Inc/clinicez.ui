-- AlterTable: add createdByUserId to Folder
ALTER TABLE "Folder" ADD COLUMN IF NOT EXISTS "createdByUserId" INTEGER;

-- AlterTable: add createdByUserId to File
ALTER TABLE "File" ADD COLUMN IF NOT EXISTS "createdByUserId" INTEGER;

-- AddForeignKey: Folder.createdByUserId -> User.id
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: File.createdByUserId -> User.id
ALTER TABLE "File" ADD CONSTRAINT "File_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;
