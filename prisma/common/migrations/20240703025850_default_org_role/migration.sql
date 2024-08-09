-- CreateTable
CREATE TABLE "UserDefaultOrganizationRole" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserDefaultOrganizationRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDefaultOrganizationRole_userId_key" ON "UserDefaultOrganizationRole"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDefaultOrganizationRole_userId_organizationId_roleId_key" ON "UserDefaultOrganizationRole"("userId", "organizationId", "roleId");

-- AddForeignKey
ALTER TABLE "UserDefaultOrganizationRole" ADD CONSTRAINT "UserDefaultOrganizationRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultOrganizationRole" ADD CONSTRAINT "UserDefaultOrganizationRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultOrganizationRole" ADD CONSTRAINT "UserDefaultOrganizationRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "UserOrganizationRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
