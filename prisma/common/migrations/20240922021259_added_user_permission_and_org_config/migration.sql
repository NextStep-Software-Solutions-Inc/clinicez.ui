-- AlterTable
ALTER TABLE "OrganizationSetting" ADD COLUMN     "enableAppointment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableConsultation" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "OrgAppointmentConfig" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "maxAppointmentsPerClient" INTEGER NOT NULL DEFAULT 0,
    "lastPerClientIntervalReses" DATE,
    "perClientResetInterval" INTEGER NOT NULL DEFAULT 0,
    "maxAppointmentsPerDay" INTEGER NOT NULL DEFAULT 0,
    "lastPerDayIntervalReset" DATE,
    "perDayResetInterval" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrgAppointmentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgAppointmentTab" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "appointmentTabId" INTEGER NOT NULL,

    CONSTRAINT "OrgAppointmentTab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentTab" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AppointmentTab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgUserPermission" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgUserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgAppointmentConfig_orgId_key" ON "OrgAppointmentConfig"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgAppointmentTab_orgId_appointmentTabId_key" ON "OrgAppointmentTab"("orgId", "appointmentTabId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentTab_name_key" ON "AppointmentTab"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OrgUserPermission_orgId_userId_permissionId_key" ON "OrgUserPermission"("orgId", "userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- AddForeignKey
ALTER TABLE "OrgAppointmentConfig" ADD CONSTRAINT "OrgAppointmentConfig_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgAppointmentTab" ADD CONSTRAINT "OrgAppointmentTab_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgAppointmentTab" ADD CONSTRAINT "OrgAppointmentTab_appointmentTabId_fkey" FOREIGN KEY ("appointmentTabId") REFERENCES "AppointmentTab"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgUserPermission" ADD CONSTRAINT "OrgUserPermission_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgUserPermission" ADD CONSTRAINT "OrgUserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgUserPermission" ADD CONSTRAINT "OrgUserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
