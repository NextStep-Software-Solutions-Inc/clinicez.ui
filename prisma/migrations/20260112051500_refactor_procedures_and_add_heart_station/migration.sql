-- ==========================================
-- Medical Procedures Refactoring Migration
-- ==========================================
-- This migration:
-- 1. Renames ImagingDiagnostic -> ImagingProcedure
-- 2. Renames LaboratoryDiagnostic -> LaboratoryProcedure
-- 3. Adds HeartStationProcedure master table
-- 4. Creates clinic-level procedure tables
-- 5. Creates junction tables for requests
-- 6. Adds ProcedureUsageHistory table
-- 7. Adds ClinicHeartStationRequest table
-- 8. Migrates existing data

-- Step 1: Rename master diagnostic tables to procedure tables
ALTER TABLE "ImagingDiagnostic" RENAME TO "ImagingProcedure";
ALTER TABLE "LaboratoryDiagnostic" RENAME TO "LaboratoryProcedure";

-- Step 2: Add timestamps to master procedure tables
ALTER TABLE "ImagingProcedure" 
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "LaboratoryProcedure" 
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 3: Rename unique constraints on master procedure tables
ALTER INDEX "unique_imaging_diagnostic" RENAME TO "unique_imaging_procedure";
ALTER INDEX "unique_laboratory_diagnostic" RENAME TO "unique_laboratory_procedure";

-- Step 4: Create HeartStationProcedure master table
CREATE TABLE "HeartStationProcedure" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeartStationProcedure_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "unique_heart_station_procedure" ON "HeartStationProcedure"("name", "category");

-- Step 5: Create clinic-level procedure tables
CREATE TABLE "ClinicImagingProcedure" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "masterProcedureId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicImagingProcedure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicLaboratoryProcedure" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "masterProcedureId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicLaboratoryProcedure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicHeartStationProcedure" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "masterProcedureId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicHeartStationProcedure_pkey" PRIMARY KEY ("id")
);

-- Step 6: Create indexes and constraints for clinic procedures
CREATE UNIQUE INDEX "unique_clinic_imaging_procedure" ON "ClinicImagingProcedure"("clinicId", "name");
CREATE INDEX "ClinicImagingProcedure_clinicId_idx" ON "ClinicImagingProcedure"("clinicId");

CREATE UNIQUE INDEX "unique_clinic_laboratory_procedure" ON "ClinicLaboratoryProcedure"("clinicId", "name");
CREATE INDEX "ClinicLaboratoryProcedure_clinicId_idx" ON "ClinicLaboratoryProcedure"("clinicId");

CREATE UNIQUE INDEX "unique_clinic_heart_station_procedure" ON "ClinicHeartStationProcedure"("clinicId", "name");
CREATE INDEX "ClinicHeartStationProcedure_clinicId_idx" ON "ClinicHeartStationProcedure"("clinicId");

-- Step 7: Add foreign key constraints for clinic procedures
ALTER TABLE "ClinicImagingProcedure" ADD CONSTRAINT "ClinicImagingProcedure_clinicId_fkey" 
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "ClinicImagingProcedure" ADD CONSTRAINT "ClinicImagingProcedure_masterProcedureId_fkey" 
  FOREIGN KEY ("masterProcedureId") REFERENCES "ImagingProcedure"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "ClinicLaboratoryProcedure" ADD CONSTRAINT "ClinicLaboratoryProcedure_clinicId_fkey" 
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "ClinicLaboratoryProcedure" ADD CONSTRAINT "ClinicLaboratoryProcedure_masterProcedureId_fkey" 
  FOREIGN KEY ("masterProcedureId") REFERENCES "LaboratoryProcedure"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "ClinicHeartStationProcedure" ADD CONSTRAINT "ClinicHeartStationProcedure_clinicId_fkey" 
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "ClinicHeartStationProcedure" ADD CONSTRAINT "ClinicHeartStationProcedure_masterProcedureId_fkey" 
  FOREIGN KEY ("masterProcedureId") REFERENCES "HeartStationProcedure"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Step 8: Migrate existing data - Create clinic procedures from existing diagnostic data
-- For Imaging: Create clinic procedures for each clinic that has used imaging diagnostics
INSERT INTO "ClinicImagingProcedure" ("clinicId", "masterProcedureId", "name", "description", "isActive", "createdAt", "updatedAt")
SELECT DISTINCT 
  cir."clinicId",
  ird."imagingDiagnosticId" as "masterProcedureId",
  ip."name",
  ip."description",
  ip."isActive",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "ClinicImagingRequestDiagnostic" ird
JOIN "ClinicImagingRequest" cir ON ird."clinicImagingRequestId" = cir."id"
JOIN "ImagingProcedure" ip ON ird."imagingDiagnosticId" = ip."id"
ON CONFLICT ("clinicId", "name") DO NOTHING;

-- For Laboratory: Create clinic procedures for each clinic that has used laboratory diagnostics
INSERT INTO "ClinicLaboratoryProcedure" ("clinicId", "masterProcedureId", "name", "description", "isActive", "createdAt", "updatedAt")
SELECT DISTINCT 
  clr."clinicId",
  lrd."laboratoryDiagnosticId" as "masterProcedureId",
  lp."name",
  lp."description",
  lp."isActive",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "ClinicLaboratoryRequestDiagnostic" lrd
JOIN "ClinicLaboratoryRequest" clr ON lrd."clinicLaboratoryRequestId" = clr."id"
JOIN "LaboratoryProcedure" lp ON lrd."laboratoryDiagnosticId" = lp."id"
ON CONFLICT ("clinicId", "name") DO NOTHING;

-- Step 9: Create new junction tables
CREATE TABLE "ClinicImagingRequestProcedure" (
    "id" SERIAL NOT NULL,
    "clinicImagingRequestId" INTEGER NOT NULL,
    "clinicImagingProcedureId" INTEGER NOT NULL,

    CONSTRAINT "ClinicImagingRequestProcedure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicLaboratoryRequestProcedure" (
    "id" SERIAL NOT NULL,
    "clinicLaboratoryRequestId" INTEGER NOT NULL,
    "clinicLaboratoryProcedureId" INTEGER NOT NULL,

    CONSTRAINT "ClinicLaboratoryRequestProcedure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicHeartStationRequestProcedure" (
    "id" SERIAL NOT NULL,
    "clinicHeartStationRequestId" INTEGER NOT NULL,
    "clinicHeartStationProcedureId" INTEGER NOT NULL,

    CONSTRAINT "ClinicHeartStationRequestProcedure_pkey" PRIMARY KEY ("id")
);

-- Step 10: Create unique constraints on junction tables
CREATE UNIQUE INDEX "unique_clinic_imaging_request_procedure" ON "ClinicImagingRequestProcedure"("clinicImagingRequestId", "clinicImagingProcedureId");
CREATE UNIQUE INDEX "unique_clinic_laboratory_request_procedure" ON "ClinicLaboratoryRequestProcedure"("clinicLaboratoryRequestId", "clinicLaboratoryProcedureId");
CREATE UNIQUE INDEX "unique_clinic_heart_station_request_procedure" ON "ClinicHeartStationRequestProcedure"("clinicHeartStationRequestId", "clinicHeartStationProcedureId");

-- Step 11: Add foreign key constraints for junction tables
ALTER TABLE "ClinicImagingRequestProcedure" ADD CONSTRAINT "ClinicImagingRequestProcedure_clinicImagingRequestId_fkey" 
  FOREIGN KEY ("clinicImagingRequestId") REFERENCES "ClinicImagingRequest"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "ClinicImagingRequestProcedure" ADD CONSTRAINT "ClinicImagingRequestProcedure_clinicImagingProcedureId_fkey" 
  FOREIGN KEY ("clinicImagingProcedureId") REFERENCES "ClinicImagingProcedure"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "ClinicLaboratoryRequestProcedure" ADD CONSTRAINT "ClinicLaboratoryRequestProcedure_clinicLaboratoryRequestId_fkey" 
  FOREIGN KEY ("clinicLaboratoryRequestId") REFERENCES "ClinicLaboratoryRequest"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "ClinicLaboratoryRequestProcedure" ADD CONSTRAINT "ClinicLaboratoryRequestProcedure_clinicLaboratoryProcedureId_fkey" 
  FOREIGN KEY ("clinicLaboratoryProcedureId") REFERENCES "ClinicLaboratoryProcedure"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "ClinicHeartStationRequestProcedure" ADD CONSTRAINT "ClinicHeartStationRequestProcedure_clinicHeartStationRequestId_fkey" 
  FOREIGN KEY ("clinicHeartStationRequestId") REFERENCES "ClinicHeartStationRequest"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "ClinicHeartStationRequestProcedure" ADD CONSTRAINT "ClinicHeartStationRequestProcedure_clinicHeartStationProcedureId_fkey" 
  FOREIGN KEY ("clinicHeartStationProcedureId") REFERENCES "ClinicHeartStationProcedure"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Step 12: Migrate existing junction table data
INSERT INTO "ClinicImagingRequestProcedure" ("clinicImagingRequestId", "clinicImagingProcedureId")
SELECT 
  ird."clinicImagingRequestId",
  cip."id" as "clinicImagingProcedureId"
FROM "ClinicImagingRequestDiagnostic" ird
JOIN "ClinicImagingRequest" cir ON ird."clinicImagingRequestId" = cir."id"
JOIN "ImagingProcedure" ip ON ird."imagingDiagnosticId" = ip."id"
JOIN "ClinicImagingProcedure" cip ON cip."clinicId" = cir."clinicId" AND cip."masterProcedureId" = ip."id"
ON CONFLICT DO NOTHING;

INSERT INTO "ClinicLaboratoryRequestProcedure" ("clinicLaboratoryRequestId", "clinicLaboratoryProcedureId")
SELECT 
  lrd."clinicLaboratoryRequestId",
  clp."id" as "clinicLaboratoryProcedureId"
FROM "ClinicLaboratoryRequestDiagnostic" lrd
JOIN "ClinicLaboratoryRequest" clr ON lrd."clinicLaboratoryRequestId" = clr."id"
JOIN "LaboratoryProcedure" lp ON lrd."laboratoryDiagnosticId" = lp."id"
JOIN "ClinicLaboratoryProcedure" clp ON clp."clinicId" = clr."clinicId" AND clp."masterProcedureId" = lp."id"
ON CONFLICT DO NOTHING;

-- Step 13: Drop old junction tables
DROP TABLE "ClinicImagingRequestDiagnostic";
DROP TABLE "ClinicLaboratoryRequestDiagnostic";

-- Step 14: Create ProcedureUsageHistory table
CREATE TABLE "ProcedureUsageHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "procedureType" TEXT NOT NULL,
    "procedureId" INTEGER NOT NULL,
    "procedureName" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcedureUsageHistory_pkey" PRIMARY KEY ("id")
);

-- Step 15: Create indexes for ProcedureUsageHistory
CREATE INDEX "ProcedureUsageHistory_userId_clinicId_procedureType_idx" ON "ProcedureUsageHistory"("userId", "clinicId", "procedureType");
CREATE INDEX "ProcedureUsageHistory_usedAt_idx" ON "ProcedureUsageHistory"("usedAt");

-- Step 16: Add foreign key constraints for ProcedureUsageHistory
ALTER TABLE "ProcedureUsageHistory" ADD CONSTRAINT "ProcedureUsageHistory_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "ProcedureUsageHistory" ADD CONSTRAINT "ProcedureUsageHistory_clinicId_fkey" 
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Step 17: Create ClinicHeartStationRequest table
CREATE TABLE "ClinicHeartStationRequest" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "documentTemplateId" INTEGER NOT NULL,
    "clinicPatientId" INTEGER NOT NULL,
    "hpId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "history" TEXT,
    "impression" TEXT,
    "reason" TEXT,
    "updatedBy" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "serialNumber" TEXT NOT NULL,
    "consultationTicketId" INTEGER NOT NULL,

    CONSTRAINT "ClinicHeartStationRequest_pkey" PRIMARY KEY ("id")
);

-- Step 18: Create indexes and constraints for ClinicHeartStationRequest
CREATE UNIQUE INDEX "ClinicHeartStationRequest_serialNumber_key" ON "ClinicHeartStationRequest"("serialNumber");

ALTER TABLE "ClinicHeartStationRequest" ADD CONSTRAINT "ClinicHeartStationRequest_clinicId_fkey" 
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "ClinicHeartStationRequest" ADD CONSTRAINT "ClinicHeartStationRequest_clinicPatientId_fkey" 
  FOREIGN KEY ("clinicPatientId") REFERENCES "ClinicPatient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "ClinicHeartStationRequest" ADD CONSTRAINT "ClinicHeartStationRequest_consultationTicketId_fkey" 
  FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "ClinicHeartStationRequest" ADD CONSTRAINT "ClinicHeartStationRequest_createdBy_fkey" 
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "ClinicHeartStationRequest" ADD CONSTRAINT "ClinicHeartStationRequest_deletedBy_fkey" 
  FOREIGN KEY ("deletedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "ClinicHeartStationRequest" ADD CONSTRAINT "ClinicHeartStationRequest_documentTemplateId_fkey" 
  FOREIGN KEY ("documentTemplateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "ClinicHeartStationRequest" ADD CONSTRAINT "ClinicHeartStationRequest_hpId_fkey" 
  FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "ClinicHeartStationRequest" ADD CONSTRAINT "ClinicHeartStationRequest_updatedBy_fkey" 
  FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Migration complete
