-- CreateTable
CREATE TABLE "ClinicRoleInitialPermission" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "clinicRoleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "ClinicRoleInitialPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicRoleInitialPermission_clinicId_clinicRoleId_permissio_key" ON "ClinicRoleInitialPermission"("clinicId", "clinicRoleId", "permissionId");

-- AddForeignKey
ALTER TABLE "ClinicRoleInitialPermission" ADD CONSTRAINT "ClinicRoleInitialPermission_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicRoleInitialPermission" ADD CONSTRAINT "ClinicRoleInitialPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicRoleInitialPermission" ADD CONSTRAINT "ClinicRoleInitialPermission_clinicRoleId_fkey" FOREIGN KEY ("clinicRoleId") REFERENCES "ClinicMemberRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
