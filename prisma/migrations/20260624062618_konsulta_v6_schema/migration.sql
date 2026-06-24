-- AlterTable
ALTER TABLE "Action" ADD COLUMN     "yakapCode" TEXT,
ADD COLUMN     "yakapDescription" TEXT,
ADD COLUMN     "yakapStatus" INTEGER;

-- AlterTable
ALTER TABLE "ClinicPatient" ADD COLUMN     "konsultaPackageType" TEXT,
ADD COLUMN     "konsultaWithConsent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ConsultationTicket" ADD COLUMN     "konsultaCoPay" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "HealthCondition" ADD COLUMN     "yakapCode" TEXT,
ADD COLUMN     "yakapDescription" TEXT,
ADD COLUMN     "yakapStatus" INTEGER;

-- AlterTable
ALTER TABLE "HeartStationProcedure" ADD COLUMN     "yakapCode" TEXT,
ADD COLUMN     "yakapDescription" TEXT,
ADD COLUMN     "yakapStatus" INTEGER;

-- AlterTable
ALTER TABLE "ImagingProcedure" ADD COLUMN     "yakapCode" TEXT,
ADD COLUMN     "yakapDescription" TEXT,
ADD COLUMN     "yakapStatus" INTEGER;

-- AlterTable
ALTER TABLE "Intervention" ADD COLUMN     "othRemarks" TEXT;

-- AlterTable
ALTER TABLE "LaboratoryProcedure" ADD COLUMN     "yakapCode" TEXT,
ADD COLUMN     "yakapDescription" TEXT,
ADD COLUMN     "yakapStatus" INTEGER;

-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN     "dispensedAt" TIMESTAMP(3),
ADD COLUMN     "dispensedBy" TEXT,
ADD COLUMN     "route" TEXT,
ADD COLUMN     "unitPrice" DECIMAL(10,2),
ADD COLUMN     "yakapCategory" TEXT,
ADD COLUMN     "yakapCode" TEXT,
ADD COLUMN     "yakapDescription" TEXT,
ADD COLUMN     "yakapRoute" TEXT,
ADD COLUMN     "yakapStatus" INTEGER;

-- AlterTable
ALTER TABLE "Vaccine" ADD COLUMN     "yakapCode" TEXT,
ADD COLUMN     "yakapDescription" TEXT,
ADD COLUMN     "yakapLibraryName" TEXT,
ADD COLUMN     "yakapStatus" INTEGER;

-- CreateTable
CREATE TABLE "KonsultaPeSkinExtremity" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KonsultaPeSkinExtremity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsultaPeHeent" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KonsultaPeHeent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsultaPeChest" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KonsultaPeChest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsultaPeHeart" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KonsultaPeHeart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsultaPeAbdomen" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KonsultaPeAbdomen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsultaPeNeuro" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KonsultaPeNeuro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsultaPeGenitourinary" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KonsultaPeGenitourinary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsultaPeDigitalRectal" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KonsultaPeDigitalRectal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsultaSignSymptom" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KonsultaSignSymptom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsultaChestXrayFinding" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KonsultaChestXrayFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsultaChestXrayObservation" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KonsultaChestXrayObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsultaMedicineReference" (
    "id" SERIAL NOT NULL,
    "drugCode" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,
    "brandName" TEXT,
    "saltDescription" TEXT,
    "strengthDescription" TEXT,
    "formDescription" TEXT,
    "unitDescription" TEXT,
    "packageDescription" TEXT,
    "category" TEXT,
    "route" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KonsultaMedicineReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsultaDiagnosticCategory" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KonsultaDiagnosticCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsultaDiagnosticResult" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "consultationTicketId" INTEGER,
    "clinicId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "referralFacility" TEXT,
    "labDate" TIMESTAMP(3),
    "dateAdded" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'D',
    "diagnosticLabFee" DECIMAL(10,2),
    "results" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KonsultaDiagnosticResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationKonsultaData" (
    "id" SERIAL NOT NULL,
    "consultationTicketId" INTEGER NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "illnessHistory" TEXT,
    "signsSymptomCodes" TEXT,
    "signsSymptomLabels" TEXT,
    "otherComplaint" TEXT,
    "painSite" TEXT,
    "diagnosticEntries" JSONB,
    "adviceRemarks" TEXT,
    "peSkinId" TEXT,
    "peHeentId" TEXT,
    "peChestId" TEXT,
    "peHeartId" TEXT,
    "peAbdomenId" TEXT,
    "peNeuroId" TEXT,
    "peGuId" TEXT,
    "peRectalId" TEXT,
    "peSkinRem" TEXT,
    "peHeentRem" TEXT,
    "peChestRem" TEXT,
    "peHeartRem" TEXT,
    "peAbdomenRem" TEXT,
    "peNeuroRem" TEXT,
    "peGuRem" TEXT,
    "peRectalRem" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationKonsultaData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsultaNcdQuestionnaire" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "consultationTicketId" INTEGER,
    "clinicId" INTEGER NOT NULL,
    "qid1Yn" TEXT,
    "qid2Yn" TEXT,
    "qid3Yn" TEXT,
    "qid4Yn" TEXT,
    "qid5Ynx" TEXT,
    "qid6Yn" TEXT,
    "qid7Yn" TEXT,
    "qid8Yn" TEXT,
    "qid9Yn" TEXT,
    "qid10Yn" TEXT,
    "qid11Yn" TEXT,
    "qid12Yn" TEXT,
    "qid13Yn" TEXT,
    "qid14Yn" TEXT,
    "qid15Yn" TEXT,
    "qid16Yn" TEXT,
    "qid17Abcde" TEXT,
    "qid18Yn" TEXT,
    "qid19Yn" TEXT,
    "qid19Fbsmg" TEXT,
    "qid19Fbsmmol" TEXT,
    "qid19Fbsdate" TIMESTAMP(3),
    "qid20Yn" TEXT,
    "qid20Choleval" TEXT,
    "qid20Choledate" TIMESTAMP(3),
    "qid21Yn" TEXT,
    "qid21Ketonval" TEXT,
    "qid21Ketondate" TIMESTAMP(3),
    "qid22Yn" TEXT,
    "qid22Proteinval" TEXT,
    "qid22Proteindate" TIMESTAMP(3),
    "qid23Yn" TEXT,
    "qid24Yn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KonsultaNcdQuestionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaPeSkinExtremity_code_key" ON "KonsultaPeSkinExtremity"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaPeHeent_code_key" ON "KonsultaPeHeent"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaPeChest_code_key" ON "KonsultaPeChest"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaPeHeart_code_key" ON "KonsultaPeHeart"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaPeAbdomen_code_key" ON "KonsultaPeAbdomen"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaPeNeuro_code_key" ON "KonsultaPeNeuro"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaPeGenitourinary_code_key" ON "KonsultaPeGenitourinary"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaPeDigitalRectal_code_key" ON "KonsultaPeDigitalRectal"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaSignSymptom_code_key" ON "KonsultaSignSymptom"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaChestXrayFinding_code_key" ON "KonsultaChestXrayFinding"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaChestXrayObservation_code_key" ON "KonsultaChestXrayObservation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaMedicineReference_drugCode_key" ON "KonsultaMedicineReference"("drugCode");

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaDiagnosticCategory_code_key" ON "KonsultaDiagnosticCategory"("code");

-- CreateIndex
CREATE INDEX "KonsultaDiagnosticResult_userId_clinicId_categoryId_idx" ON "KonsultaDiagnosticResult"("userId", "clinicId", "categoryId");

-- CreateIndex
CREATE INDEX "KonsultaDiagnosticResult_consultationTicketId_idx" ON "KonsultaDiagnosticResult"("consultationTicketId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationKonsultaData_consultationTicketId_key" ON "ConsultationKonsultaData"("consultationTicketId");

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaNcdQuestionnaire_userId_consultationTicketId_clinic_key" ON "KonsultaNcdQuestionnaire"("userId", "consultationTicketId", "clinicId");

-- AddForeignKey
ALTER TABLE "KonsultaDiagnosticResult" ADD CONSTRAINT "KonsultaDiagnosticResult_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KonsultaDiagnosticCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KonsultaDiagnosticResult" ADD CONSTRAINT "KonsultaDiagnosticResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KonsultaDiagnosticResult" ADD CONSTRAINT "KonsultaDiagnosticResult_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KonsultaDiagnosticResult" ADD CONSTRAINT "KonsultaDiagnosticResult_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationKonsultaData" ADD CONSTRAINT "ConsultationKonsultaData_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationKonsultaData" ADD CONSTRAINT "ConsultationKonsultaData_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KonsultaNcdQuestionnaire" ADD CONSTRAINT "KonsultaNcdQuestionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KonsultaNcdQuestionnaire" ADD CONSTRAINT "KonsultaNcdQuestionnaire_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KonsultaNcdQuestionnaire" ADD CONSTRAINT "KonsultaNcdQuestionnaire_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
