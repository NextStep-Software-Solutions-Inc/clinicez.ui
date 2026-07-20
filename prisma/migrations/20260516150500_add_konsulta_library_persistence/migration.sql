-- CreateTable
CREATE TABLE IF NOT EXISTS "PhilHealthKonsultaLibraryItem" (
    "id" SERIAL NOT NULL,
    "domainKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sourceFileName" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL,
    "rowSignature" TEXT NOT NULL,
    "externalCode" TEXT,
    "displayLabel" TEXT NOT NULL,
    "normalizedCode" TEXT,
    "normalizedLabel" TEXT NOT NULL,
    "libraryStatus" TEXT,
    "metadata" JSONB,
    "rawRow" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhilHealthKonsultaLibraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ClinicKonsultaLibraryItem" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "domainKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "internalCode" TEXT,
    "displayLabel" TEXT NOT NULL,
    "normalizedCode" TEXT,
    "normalizedLabel" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'CUSTOM',
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seededFromReferenceId" INTEGER,

    CONSTRAINT "ClinicKonsultaLibraryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ClinicKonsultaLibraryMapping" (
    "id" SERIAL NOT NULL,
    "clinicLibraryItemId" INTEGER NOT NULL,
    "philHealthReferenceItemId" INTEGER,
    "mappingStatus" TEXT NOT NULL DEFAULT 'UNMAPPED',
    "mappingNotes" TEXT,
    "mappedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicKonsultaLibraryMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PhilHealthKonsultaLibraryItem_rowSignature_key" ON "PhilHealthKonsultaLibraryItem"("rowSignature");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhilHealthKonsultaLibraryItem_domainKey_normalizedCode_idx" ON "PhilHealthKonsultaLibraryItem"("domainKey", "normalizedCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhilHealthKonsultaLibraryItem_domainKey_normalizedLabel_idx" ON "PhilHealthKonsultaLibraryItem"("domainKey", "normalizedLabel");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhilHealthKonsultaLibraryItem_sourceFileName_idx" ON "PhilHealthKonsultaLibraryItem"("sourceFileName");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ClinicKonsultaLibraryItem_clinicId_domainKey_idx" ON "ClinicKonsultaLibraryItem"("clinicId", "domainKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ClinicKonsultaLibraryItem_clinicId_domainKey_normalizedCode_idx" ON "ClinicKonsultaLibraryItem"("clinicId", "domainKey", "normalizedCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ClinicKonsultaLibraryItem_clinicId_domainKey_normalizedLabe_idx" ON "ClinicKonsultaLibraryItem"("clinicId", "domainKey", "normalizedLabel");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "unique_clinic_konsulta_library_item" ON "ClinicKonsultaLibraryItem"("clinicId", "domainKey", "normalizedCode", "normalizedLabel");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ClinicKonsultaLibraryMapping_clinicLibraryItemId_key" ON "ClinicKonsultaLibraryMapping"("clinicLibraryItemId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ClinicKonsultaLibraryMapping_mappingStatus_idx" ON "ClinicKonsultaLibraryMapping"("mappingStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ClinicKonsultaLibraryMapping_philHealthReferenceItemId_idx" ON "ClinicKonsultaLibraryMapping"("philHealthReferenceItemId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ClinicKonsultaLibraryItem_clinicId_fkey'
    ) THEN
        ALTER TABLE "ClinicKonsultaLibraryItem"
        ADD CONSTRAINT "ClinicKonsultaLibraryItem_clinicId_fkey"
        FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ClinicKonsultaLibraryItem_seededFromReferenceId_fkey'
    ) THEN
        ALTER TABLE "ClinicKonsultaLibraryItem"
        ADD CONSTRAINT "ClinicKonsultaLibraryItem_seededFromReferenceId_fkey"
        FOREIGN KEY ("seededFromReferenceId") REFERENCES "PhilHealthKonsultaLibraryItem"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ClinicKonsultaLibraryMapping_clinicLibraryItemId_fkey'
    ) THEN
        ALTER TABLE "ClinicKonsultaLibraryMapping"
        ADD CONSTRAINT "ClinicKonsultaLibraryMapping_clinicLibraryItemId_fkey"
        FOREIGN KEY ("clinicLibraryItemId") REFERENCES "ClinicKonsultaLibraryItem"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ClinicKonsultaLibraryMapping_philHealthReferenceItemId_fkey'
    ) THEN
        ALTER TABLE "ClinicKonsultaLibraryMapping"
        ADD CONSTRAINT "ClinicKonsultaLibraryMapping_philHealthReferenceItemId_fkey"
        FOREIGN KEY ("philHealthReferenceItemId") REFERENCES "PhilHealthKonsultaLibraryItem"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;
