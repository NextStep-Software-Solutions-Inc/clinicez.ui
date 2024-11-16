/*
  Warnings:

  - You are about to drop the `ClinicMemberRole` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ClinicMember" DROP CONSTRAINT "ClinicMember_roleId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicMemberRole" DROP CONSTRAINT "ClinicMemberRole_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicRoleAppointmentTab" DROP CONSTRAINT "ClinicRoleAppointmentTab_clinicRoleId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicRoleInitialPermission" DROP CONSTRAINT "ClinicRoleInitialPermission_clinicRoleId_fkey";

-- DropForeignKey
ALTER TABLE "UserDefaultClinicRole" DROP CONSTRAINT "UserDefaultClinicRole_roleId_fkey";

-- DropTable
DROP TABLE "ClinicMemberRole";

-- CreateTable
CREATE TABLE "ClinicRole" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clinicId" INTEGER,

    CONSTRAINT "ClinicRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicRole_name_key" ON "ClinicRole"("name");

-- AddForeignKey
ALTER TABLE "ClinicRoleInitialPermission" ADD CONSTRAINT "ClinicRoleInitialPermission_clinicRoleId_fkey" FOREIGN KEY ("clinicRoleId") REFERENCES "ClinicRole"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultClinicRole" ADD CONSTRAINT "UserDefaultClinicRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ClinicRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMember" ADD CONSTRAINT "ClinicMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ClinicRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicRole" ADD CONSTRAINT "ClinicRole_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicRoleAppointmentTab" ADD CONSTRAINT "ClinicRoleAppointmentTab_clinicRoleId_fkey" FOREIGN KEY ("clinicRoleId") REFERENCES "ClinicRole"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
