-- CreateTable
CREATE TABLE "OrgRoleAppointmentTab" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "appointmentTabId" INTEGER NOT NULL,

    CONSTRAINT "OrgRoleAppointmentTab_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgRoleAppointmentTab_orgId_roleId_appointmentTabId_key" ON "OrgRoleAppointmentTab"("orgId", "roleId", "appointmentTabId");

-- AddForeignKey
ALTER TABLE "OrgRoleAppointmentTab" ADD CONSTRAINT "OrgRoleAppointmentTab_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgRoleAppointmentTab" ADD CONSTRAINT "OrgRoleAppointmentTab_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "UserOrganizationRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgRoleAppointmentTab" ADD CONSTRAINT "OrgRoleAppointmentTab_appointmentTabId_fkey" FOREIGN KEY ("appointmentTabId") REFERENCES "AppointmentTab"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
