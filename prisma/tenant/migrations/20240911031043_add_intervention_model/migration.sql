-- CreateTable
CREATE TABLE "Intervention" (
    "id" SERIAL NOT NULL,
    "orgUid" TEXT NOT NULL,
    "hpId" INTEGER NOT NULL,
    "consultationRecordId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Intervention_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_consultationRecordId_fkey" FOREIGN KEY ("consultationRecordId") REFERENCES "ConsultationRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
