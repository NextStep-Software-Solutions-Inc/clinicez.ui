/*
  Warnings:

  - You are about to drop the `ImagingRequestDiagnostic` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ImagingRequestDiagnostic" DROP CONSTRAINT "ImagingRequestDiagnostic_clinicImagingRequestId_fkey";

-- DropForeignKey
ALTER TABLE "ImagingRequestDiagnostic" DROP CONSTRAINT "ImagingRequestDiagnostic_imagingDiagnosticId_fkey";

-- DropTable
DROP TABLE "ImagingRequestDiagnostic";

-- CreateTable
CREATE TABLE "ClinicImagingRequestDiagnostic" (
    "id" SERIAL NOT NULL,
    "clinicImagingRequestId" INTEGER NOT NULL,
    "imagingDiagnosticId" INTEGER NOT NULL,

    CONSTRAINT "ClinicImagingRequestDiagnostic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicImagingRequestDiagnostic_clinicImagingRequestId_imagi_key" ON "ClinicImagingRequestDiagnostic"("clinicImagingRequestId", "imagingDiagnosticId");

-- AddForeignKey
ALTER TABLE "ClinicImagingRequestDiagnostic" ADD CONSTRAINT "ClinicImagingRequestDiagnostic_clinicImagingRequestId_fkey" FOREIGN KEY ("clinicImagingRequestId") REFERENCES "ClinicImagingRequest"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicImagingRequestDiagnostic" ADD CONSTRAINT "ClinicImagingRequestDiagnostic_imagingDiagnosticId_fkey" FOREIGN KEY ("imagingDiagnosticId") REFERENCES "ImagingDiagnostic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
