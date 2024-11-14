/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ClinicMemberPermission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ClinicMemberPermission` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `OrgMemberPermission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `OrgMemberPermission` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `UserPermission` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `UserPermission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserPermission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClinicMemberPermission" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "OrgMemberPermission" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "UserPermission" DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "updatedAt";

-- CreateTable
CREATE TABLE "ClinicPatient" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "patientId" INTEGER NOT NULL,

    CONSTRAINT "ClinicPatient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicPatientPermission" (
    "id" SERIAL NOT NULL,
    "clinicPatientId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicPatientPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicPatient_clinicId_patientId_key" ON "ClinicPatient"("clinicId", "patientId");

-- AddForeignKey
ALTER TABLE "ClinicPatient" ADD CONSTRAINT "ClinicPatient_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicPatient" ADD CONSTRAINT "ClinicPatient_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicPatientPermission" ADD CONSTRAINT "ClinicPatientPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicPatientPermission" ADD CONSTRAINT "ClinicPatientPermission_clinicPatientId_fkey" FOREIGN KEY ("clinicPatientId") REFERENCES "ClinicPatient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
