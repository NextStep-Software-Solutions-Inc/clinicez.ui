/*
  Warnings:

  - A unique constraint covering the columns `[userId,organizationId,role]` on the table `UserOrganization` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserOrganization_userId_organizationId_role_key" ON "UserOrganization"("userId", "organizationId", "role");
