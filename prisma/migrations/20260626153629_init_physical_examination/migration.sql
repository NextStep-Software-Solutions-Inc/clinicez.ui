-- AlterTable
ALTER TABLE "VitalSign" ADD COLUMN     "consultationTicketId" INTEGER;

-- CreateTable
CREATE TABLE "PhysicalExamLibrary" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "libraryStatus" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PhysicalExamLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalExamination" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "consultationTicketId" INTEGER,
    "dateTaken" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generalSurveyId" TEXT,
    "generalSurveyRemarks" TEXT,
    "heentId" TEXT,
    "heentRemarks" TEXT,
    "chestId" TEXT,
    "chestRemarks" TEXT,
    "heartId" TEXT,
    "heartRemarks" TEXT,
    "abdomenId" TEXT,
    "abdomenRemarks" TEXT,
    "guId" TEXT,
    "guRemarks" TEXT,
    "skinId" TEXT,
    "skinRemarks" TEXT,
    "neuroId" TEXT,
    "neuroRemarks" TEXT,
    "rectalId" TEXT,
    "rectalRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PhysicalExamination_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalExamLibrary_category_code_key" ON "PhysicalExamLibrary"("category", "code");

-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalExamination" ADD CONSTRAINT "PhysicalExamination_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalExamination" ADD CONSTRAINT "PhysicalExamination_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
