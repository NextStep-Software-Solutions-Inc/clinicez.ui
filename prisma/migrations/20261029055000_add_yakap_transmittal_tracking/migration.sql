-- AlterTable
ALTER TABLE "PhilHealthKonsultaEnlistment" ADD COLUMN     "isProfileTransmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileBatchId" TEXT,
ADD COLUMN     "profileTransmittalNo" TEXT,
ADD COLUMN     "profileTransmittedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ConsultationTicket" ADD COLUMN     "isKonsultaTransmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "konsultaBatchId" TEXT,
ADD COLUMN     "konsultaTransmittalNo" TEXT,
ADD COLUMN     "konsultaTransmittedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PhilHealthKonsultaEnlistment_isProfileTransmitted_idx" ON "PhilHealthKonsultaEnlistment"("isProfileTransmitted");

-- CreateIndex
CREATE INDEX "PhilHealthKonsultaEnlistment_profileTransmittalNo_idx" ON "PhilHealthKonsultaEnlistment"("profileTransmittalNo");

-- CreateIndex
CREATE INDEX "ConsultationTicket_isKonsultaTransmitted_idx" ON "ConsultationTicket"("isKonsultaTransmitted");

-- CreateIndex
CREATE INDEX "ConsultationTicket_konsultaTransmittalNo_idx" ON "ConsultationTicket"("konsultaTransmittalNo");

-- AddForeignKey
ALTER TABLE "PhilHealthKonsultaEnlistment" ADD CONSTRAINT "PhilHealthKonsultaEnlistment_profileBatchId_fkey" FOREIGN KEY ("profileBatchId") REFERENCES "KonsultaBatchReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationTicket" ADD CONSTRAINT "ConsultationTicket_konsultaBatchId_fkey" FOREIGN KEY ("konsultaBatchId") REFERENCES "KonsultaBatchReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
