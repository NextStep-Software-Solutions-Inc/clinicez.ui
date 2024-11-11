/*
  Warnings:

  - Changed the type of `role` on the `UserOrganization` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "UserOrganization" DROP COLUMN "role",
ADD COLUMN     "role" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "UserOrganizationRole" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserOrganizationRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserOrganizationRole_orgId_name_key" ON "UserOrganizationRole"("orgId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UserOrganization_userId_organizationId_role_key" ON "UserOrganization"("userId", "organizationId", "role");

-- AddForeignKey
ALTER TABLE "UserOrganization" ADD CONSTRAINT "UserOrganization_role_fkey" FOREIGN KEY ("role") REFERENCES "UserOrganizationRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrganizationRole" ADD CONSTRAINT "UserOrganizationRole_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
