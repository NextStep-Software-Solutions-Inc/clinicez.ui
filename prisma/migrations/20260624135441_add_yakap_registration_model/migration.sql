-- CreateTable
CREATE TABLE "YakapRegistration" (
    "id" SERIAL NOT NULL,
    "clinicPatientId" INTEGER NOT NULL,
    "effYear" TEXT NOT NULL,
    "patientType" TEXT,
    "patientPin" TEXT,
    "memberPin" TEXT,
    "registrationStatus" TEXT,
    "registeredAt" TIMESTAMP(3),
    "registrationCheckedAt" TIMESTAMP(3),
    "registrationResult" JSONB,
    "unEnrolledAt" TIMESTAMP(3),
    "withConsent" BOOLEAN NOT NULL DEFAULT false,
    "packageType" TEXT,
    "hciCaseNo" TEXT,
    "hciEnlistmentTransNo" TEXT,
    "hciProfilingTransNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YakapRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YakapRegistration_clinicPatientId_idx" ON "YakapRegistration"("clinicPatientId");
CREATE INDEX "YakapRegistration_effYear_idx" ON "YakapRegistration"("effYear");
CREATE INDEX "YakapRegistration_clinicPatientId_effYear_registrationStatu_idx" ON "YakapRegistration"("clinicPatientId", "effYear", "registrationStatus");
CREATE UNIQUE INDEX "YakapRegistration_clinicPatientId_effYear_key" ON "YakapRegistration"("clinicPatientId", "effYear");

-- AddForeignKey
ALTER TABLE "YakapRegistration" ADD CONSTRAINT "YakapRegistration_clinicPatientId_fkey" FOREIGN KEY ("clinicPatientId") REFERENCES "ClinicPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Copy/migrate existing yearly enlistment/profiling data from ClinicPatient to YakapRegistration
INSERT INTO "YakapRegistration" (
  "clinicPatientId",
  "effYear",
  "patientType",
  "patientPin",
  "memberPin",
  "registrationStatus",
  "registeredAt",
  "registrationCheckedAt",
  "registrationResult",
  "unEnrolledAt",
  "withConsent",
  "packageType",
  "hciCaseNo",
  "hciEnlistmentTransNo",
  "hciProfilingTransNo",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  COALESCE("konsultaEffYear", '2026'),
  "konsultaPatientType",
  "konsultaPatientPin",
  "konsultaMemberPin",
  "konsultaRegistrationStatus",
  "konsultaRegisteredAt",
  "konsultaRegistrationCheckedAt",
  "konsultaRegistrationResult",
  "konsultaUnenrolledAt",
  COALESCE("konsultaWithConsent", false),
  "konsultaPackageType",
  "konsultaHciCaseNo",
  "konsultaHciTransNo",
  "konsultaHciProfilingTransNo",
  COALESCE("createdAt", NOW()),
  COALESCE("updatedAt", NOW())
FROM "ClinicPatient"
WHERE "konsultaRegistrationStatus" IS NOT NULL 
   OR "konsultaHciCaseNo" IS NOT NULL 
   OR "konsultaHciTransNo" IS NOT NULL 
   OR "konsultaHciProfilingTransNo" IS NOT NULL;

-- Drop index on ClinicPatient
DROP INDEX IF EXISTS "ClinicPatient_clinicId_konsultaEffYear_konsultaRegistration_idx";

-- Rename the snapshot PIN columns on ClinicPatient
ALTER TABLE "ClinicPatient" RENAME COLUMN "konsultaPatientPin" TO "patientPin";
ALTER TABLE "ClinicPatient" RENAME COLUMN "konsultaMemberPin" TO "memberPin";

-- Drop the other year-specific columns from ClinicPatient
ALTER TABLE "ClinicPatient" DROP COLUMN IF EXISTS "konsultaPatientType";
ALTER TABLE "ClinicPatient" DROP COLUMN IF EXISTS "konsultaEffYear";
ALTER TABLE "ClinicPatient" DROP COLUMN IF EXISTS "konsultaRegistrationStatus";
ALTER TABLE "ClinicPatient" DROP COLUMN IF EXISTS "konsultaRegisteredAt";
ALTER TABLE "ClinicPatient" DROP COLUMN IF EXISTS "konsultaRegistrationCheckedAt";
ALTER TABLE "ClinicPatient" DROP COLUMN IF EXISTS "konsultaRegistrationResult";
ALTER TABLE "ClinicPatient" DROP COLUMN IF EXISTS "konsultaUnenrolledAt";
ALTER TABLE "ClinicPatient" DROP COLUMN IF EXISTS "konsultaWithConsent";
ALTER TABLE "ClinicPatient" DROP COLUMN IF EXISTS "konsultaPackageType";
ALTER TABLE "ClinicPatient" DROP COLUMN IF EXISTS "konsultaHciCaseNo";
ALTER TABLE "ClinicPatient" DROP COLUMN IF EXISTS "konsultaHciTransNo";
ALTER TABLE "ClinicPatient" DROP COLUMN IF EXISTS "konsultaHciProfilingTransNo";

