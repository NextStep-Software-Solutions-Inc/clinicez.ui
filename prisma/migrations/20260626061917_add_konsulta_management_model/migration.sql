-- AlterTable
ALTER TABLE "ConsultationTicket" ADD COLUMN     "konsultaAdvice" JSONB;

-- CreateTable
CREATE TABLE "KonsultaManagementCode" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "KonsultaManagementCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationManagement" (
    "id" TEXT NOT NULL,
    "consultationTicketId" INTEGER NOT NULL,
    "managementCodeId" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationManagement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsultationManagement_consultationTicketId_idx" ON "ConsultationManagement"("consultationTicketId");

-- AddForeignKey
ALTER TABLE "ConsultationManagement" ADD CONSTRAINT "ConsultationManagement_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationManagement" ADD CONSTRAINT "ConsultationManagement_managementCodeId_fkey" FOREIGN KEY ("managementCodeId") REFERENCES "KonsultaManagementCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
