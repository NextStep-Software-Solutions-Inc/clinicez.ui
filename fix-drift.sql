-- DropForeignKey
ALTER TABLE "KonsultaBatch" DROP CONSTRAINT "KonsultaBatch_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "KonsultaBatch" DROP CONSTRAINT "KonsultaBatch_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "KonsultaEntry" DROP CONSTRAINT "KonsultaEntry_batchId_fkey";

-- DropForeignKey
ALTER TABLE "KonsultaEntry" DROP CONSTRAINT "KonsultaEntry_patientUserId_fkey";

-- DropIndex
DROP INDEX "ClinicPatient_clinicId_konsultaEffYear_konsultaRegistration_idx";

-- DropIndex
DROP INDEX "ConsultationTicket_konsultaHciCaseNo_idx";

-- DropIndex
DROP INDEX "ConsultationTicket_konsultaHciCaseNo_key";

-- DropIndex
DROP INDEX "ConsultationTicket_konsultaHciTransNo_idx";

-- DropIndex
DROP INDEX "ConsultationTicket_konsultaHciTransNo_key";

-- AlterTable
ALTER TABLE "ClinicImagingRequestProcedure" ADD COLUMN     "bodyPart" TEXT,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "ClinicPatient" DROP COLUMN "konsultaEffYear",
DROP COLUMN "konsultaMemberPin",
DROP COLUMN "konsultaPatientType",
DROP COLUMN "konsultaRegisteredAt",
DROP COLUMN "konsultaRegistrationCheckedAt",
DROP COLUMN "konsultaRegistrationResult",
DROP COLUMN "konsultaRegistrationStatus",
DROP COLUMN "konsultaUnenrolledAt";

-- AlterTable
ALTER TABLE "ClinicSetting" DROP COLUMN "konsultaCipherKey",
DROP COLUMN "konsultaPassword",
DROP COLUMN "konsultaUsername",
DROP COLUMN "pmccNumber",
ADD COLUMN     "philhealthYakapPassword" TEXT,
ADD COLUMN     "philhealthYakapPmccNumber" TEXT,
ADD COLUMN     "philhealthYakapUsername" TEXT;

-- AlterTable
ALTER TABLE "ConsultationTicket" DROP COLUMN "konsultaAtc",
DROP COLUMN "konsultaAtcValidatedAt",
DROP COLUMN "konsultaAtcValidationResult",
DROP COLUMN "konsultaAtcValidationStatus",
DROP COLUMN "konsultaHciCaseNo",
DROP COLUMN "konsultaHciTransNo";

-- AlterTable
ALTER TABLE "PhilHealthRecord" DROP COLUMN "pinVerificationResult",
DROP COLUMN "pinVerificationStatus",
DROP COLUMN "pinVerifiedAt";

-- DropTable
DROP TABLE "KonsultaBatch";

-- DropTable
DROP TABLE "KonsultaEntry";

-- DropEnum
DROP TYPE "KonsultaBatchStatus";

