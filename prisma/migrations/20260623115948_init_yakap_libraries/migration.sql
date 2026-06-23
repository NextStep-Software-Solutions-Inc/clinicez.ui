-- AlterTable
ALTER TABLE "ClinicSetting" ADD COLUMN     "konsultaCertificationId" TEXT;

-- CreateTable
CREATE TABLE "PhilHealthYakapLibrary" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "columns" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhilHealthYakapLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhilHealthYakapLibraryRow" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhilHealthYakapLibraryRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhilHealthYakapLibrary_name_key" ON "PhilHealthYakapLibrary"("name");

-- AddForeignKey
ALTER TABLE "PhilHealthYakapLibraryRow" ADD CONSTRAINT "PhilHealthYakapLibraryRow_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "PhilHealthYakapLibrary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
