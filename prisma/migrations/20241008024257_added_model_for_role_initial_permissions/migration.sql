-- CreateTable
CREATE TABLE "OrgRoleInitialPermission" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "orgRoleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "OrgRoleInitialPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgRoleInitialPermission_orgId_orgRoleId_permissionId_key" ON "OrgRoleInitialPermission"("orgId", "orgRoleId", "permissionId");

-- AddForeignKey
ALTER TABLE "OrgRoleInitialPermission" ADD CONSTRAINT "OrgRoleInitialPermission_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgRoleInitialPermission" ADD CONSTRAINT "OrgRoleInitialPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgRoleInitialPermission" ADD CONSTRAINT "OrgRoleInitialPermission_orgRoleId_fkey" FOREIGN KEY ("orgRoleId") REFERENCES "UserOrganizationRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
