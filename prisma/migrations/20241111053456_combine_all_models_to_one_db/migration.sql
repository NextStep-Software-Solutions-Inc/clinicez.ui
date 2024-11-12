/*
  Warnings:

  - You are about to drop the column `scopeOrgId` on the `FileTypeAttribute` table. All the data in the column will be lost.
  - You are about to drop the column `validUntil` on the `FileTypeAttribute` table. All the data in the column will be lost.
  - You are about to drop the column `scopeOrgId` on the `FolderSetting` table. All the data in the column will be lost.
  - You are about to drop the column `cover` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `orgId` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `picture` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `enableAppointment` on the `OrganizationSetting` table. All the data in the column will be lost.
  - You are about to drop the column `enableConsultation` on the `OrganizationSetting` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `Tenant` table. All the data in the column will be lost.
  - The `status` column on the `UserHealthCondition` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `userOrgAppointmentWhitelistId` on the `WhitelistFilter` table. All the data in the column will be lost.
  - You are about to drop the `OrgAppointmentConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrgAppointmentTab` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrgConsultationConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrgRoleAppointmentTab` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrgUserPermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrgYearLevel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserOrgAppointmentWhitelist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserOrganization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserOrganizationRole` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[fileTypeId,scopeClincId]` on the table `FileTypeAttribute` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orgUid]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantUid]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userClinicAppointmentWhitelistId,filterId,value]` on the table `WhitelistFilter` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orgUid` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantUid` to the `Tenant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userClinicAppointmentWhitelistId` to the `WhitelistFilter` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FileTypeAttribute" DROP CONSTRAINT "FileTypeAttribute_scopeOrgId_fkey";

-- DropForeignKey
ALTER TABLE "FolderSetting" DROP CONSTRAINT "FolderSetting_scopeOrgId_fkey";

-- DropForeignKey
ALTER TABLE "OrgAppointmentConfig" DROP CONSTRAINT "OrgAppointmentConfig_orgId_fkey";

-- DropForeignKey
ALTER TABLE "OrgAppointmentTab" DROP CONSTRAINT "OrgAppointmentTab_appointmentTabId_fkey";

-- DropForeignKey
ALTER TABLE "OrgAppointmentTab" DROP CONSTRAINT "OrgAppointmentTab_orgId_fkey";

-- DropForeignKey
ALTER TABLE "OrgConsultationConfig" DROP CONSTRAINT "OrgConsultationConfig_noteTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "OrgConsultationConfig" DROP CONSTRAINT "OrgConsultationConfig_orgId_fkey";

-- DropForeignKey
ALTER TABLE "OrgRoleAppointmentTab" DROP CONSTRAINT "OrgRoleAppointmentTab_orgAppointmentTabId_fkey";

-- DropForeignKey
ALTER TABLE "OrgRoleAppointmentTab" DROP CONSTRAINT "OrgRoleAppointmentTab_orgRoleId_fkey";

-- DropForeignKey
ALTER TABLE "OrgRoleInitialPermission" DROP CONSTRAINT "OrgRoleInitialPermission_orgRoleId_fkey";

-- DropForeignKey
ALTER TABLE "OrgUserPermission" DROP CONSTRAINT "OrgUserPermission_orgId_fkey";

-- DropForeignKey
ALTER TABLE "OrgUserPermission" DROP CONSTRAINT "OrgUserPermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "OrgUserPermission" DROP CONSTRAINT "OrgUserPermission_userId_fkey";

-- DropForeignKey
ALTER TABLE "OrgYearLevel" DROP CONSTRAINT "OrgYearLevel_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "UserDefaultOrganizationRole" DROP CONSTRAINT "UserDefaultOrganizationRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "UserEmploymentRecord" DROP CONSTRAINT "UserEmploymentRecord_userOrganizationRoleId_fkey";

-- DropForeignKey
ALTER TABLE "UserOrgAppointmentWhitelist" DROP CONSTRAINT "UserOrgAppointmentWhitelist_orgId_fkey";

-- DropForeignKey
ALTER TABLE "UserOrgAppointmentWhitelist" DROP CONSTRAINT "UserOrgAppointmentWhitelist_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserOrganization" DROP CONSTRAINT "UserOrganization_acceptedBy_fkey";

-- DropForeignKey
ALTER TABLE "UserOrganization" DROP CONSTRAINT "UserOrganization_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "UserOrganization" DROP CONSTRAINT "UserOrganization_role_fkey";

-- DropForeignKey
ALTER TABLE "UserOrganization" DROP CONSTRAINT "UserOrganization_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserOrganizationRole" DROP CONSTRAINT "UserOrganizationRole_orgId_fkey";

-- DropForeignKey
ALTER TABLE "UserStudentRecord" DROP CONSTRAINT "UserStudentRecord_userOrganizationRoleId_fkey";

-- DropForeignKey
ALTER TABLE "UserStudentRecord" DROP CONSTRAINT "UserStudentRecord_yearLevel_fkey";

-- DropForeignKey
ALTER TABLE "WhitelistFilter" DROP CONSTRAINT "WhitelistFilter_userOrgAppointmentWhitelistId_fkey";

-- DropIndex
DROP INDEX "FileTypeAttribute_fileTypeId_scopeOrgId_key";

-- DropIndex
DROP INDEX "Organization_orgId_key";

-- DropIndex
DROP INDEX "Tenant_tenantId_key";

-- DropIndex
DROP INDEX "WhitelistFilter_userOrgAppointmentWhitelistId_filterId_valu_key";

-- AlterTable
ALTER TABLE "FileTypeAttribute" DROP COLUMN "scopeOrgId",
DROP COLUMN "validUntil",
ADD COLUMN     "scopeClincId" INTEGER,
ADD COLUMN     "validityDays" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "FolderSetting" DROP COLUMN "scopeOrgId",
ADD COLUMN     "scopeClincId" INTEGER;

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "cover",
DROP COLUMN "orgId",
DROP COLUMN "picture",
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "orgUid" TEXT NOT NULL,
ADD COLUMN     "privacyPolicyUrl" TEXT,
ADD COLUMN     "termsAndConditionsUrl" TEXT;

-- AlterTable
ALTER TABLE "OrganizationProgram" ADD COLUMN     "major" TEXT;

-- AlterTable
ALTER TABLE "OrganizationSetting" DROP COLUMN "enableAppointment",
DROP COLUMN "enableConsultation";

-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "discount",
ADD COLUMN     "firstPaymentDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "tenantId",
ADD COLUMN     "tenantUid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserHealthCondition" DROP COLUMN "status",
ADD COLUMN     "status" TEXT DEFAULT 'UNRESOLVED';

-- AlterTable
ALTER TABLE "UserSchedule" ALTER COLUMN "startTime" SET DATA TYPE TEXT,
ALTER COLUMN "endTime" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "UserVaccination" ADD COLUMN     "hpId" INTEGER;

-- AlterTable
ALTER TABLE "WhitelistFilter" DROP COLUMN "userOrgAppointmentWhitelistId",
ADD COLUMN     "userClinicAppointmentWhitelistId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "OrgAppointmentConfig";

-- DropTable
DROP TABLE "OrgAppointmentTab";

-- DropTable
DROP TABLE "OrgConsultationConfig";

-- DropTable
DROP TABLE "OrgRoleAppointmentTab";

-- DropTable
DROP TABLE "OrgUserPermission";

-- DropTable
DROP TABLE "OrgYearLevel";

-- DropTable
DROP TABLE "UserOrgAppointmentWhitelist";

-- DropTable
DROP TABLE "UserOrganization";

-- DropTable
DROP TABLE "UserOrganizationRole";

-- DropEnum
DROP TYPE "HealthConditionStatus";

-- DropEnum
DROP TYPE "UserOrganizationStatus";

-- CreateTable
CREATE TABLE "OrgMemberPermission" (
    "id" SERIAL NOT NULL,
    "orgMemberId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgMemberPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicMemberPermission" (
    "id" SERIAL NOT NULL,
    "clinicMemberId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicMemberPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "acceptedAt" DATE,
    "acceptedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "role" INTEGER NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationRole" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "OrganizationRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationYearLevel" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrganizationYearLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserClinicAppointmentWhitelist" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "UserClinicAppointmentWhitelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clinic" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clinicUid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customUrl" TEXT,
    "email" TEXT,
    "privacyPolicyUrl" TEXT,
    "termsAndConditionsUrl" TEXT,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicSetting" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "sendEmailNotification" BOOLEAN NOT NULL DEFAULT true,
    "emailToClinicOnly" BOOLEAN NOT NULL DEFAULT false,
    "enableAppointment" BOOLEAN NOT NULL DEFAULT true,
    "enableConsultation" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ClinicSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicMember" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ClinicMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicOrganization" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ClinicOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicMemberRole" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ClinicMemberRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentConfig" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "maxAppointmentsPerClient" INTEGER NOT NULL DEFAULT 0,
    "lastPerClientIntervalReset" DATE,
    "perClientResetInterval" INTEGER NOT NULL DEFAULT 0,
    "maxAppointmentsPerDay" INTEGER NOT NULL DEFAULT 0,
    "lastPerDayIntervalReset" DATE,
    "privacyPolicyUrl" TEXT,
    "termsAndConditionsUrl" TEXT,

    CONSTRAINT "AppointmentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationConfig" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "noteTemplateId" INTEGER NOT NULL,

    CONSTRAINT "ConsultationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicAppointmentTab" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "appointmentTabId" INTEGER NOT NULL,

    CONSTRAINT "ClinicAppointmentTab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicRoleAppointmentTab" (
    "id" SERIAL NOT NULL,
    "clinicRoleId" INTEGER NOT NULL,
    "clinicAppointmentTabId" INTEGER NOT NULL,
    "organizationRoleId" INTEGER,

    CONSTRAINT "ClinicRoleAppointmentTab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "complaint" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentAttachment" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "AppointmentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentRequester" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "AppointmentRequester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentAttribute" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "maxDuration" INTEGER NOT NULL DEFAULT 30,
    "date" DATE,
    "timeStart" TEXT,
    "timeEnd" TEXT,
    "modeId" INTEGER NOT NULL,
    "typeId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "receivedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "rescheduledAt" TIMESTAMP(3),
    "rescheduledBy" TEXT,
    "rescheduledReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "preferredAppointee" TEXT,
    "eventId" TEXT DEFAULT '',
    "meetingUrl" TEXT DEFAULT '',

    CONSTRAINT "AppointmentAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentType" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AppointmentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentTypeAttribute" (
    "id" SERIAL NOT NULL,
    "appointmentTypeId" INTEGER NOT NULL,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reminders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duration" INTEGER NOT NULL DEFAULT 30,
    "durationPadding" INTEGER NOT NULL DEFAULT 0,
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resources" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "AppointmentTypeAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentMode" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AppointmentMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentRouting" (
    "id" SERIAL NOT NULL,
    "routingCode" TEXT NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "routedBy" INTEGER NOT NULL,
    "routedTo" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amendment" TEXT,
    "amendedAt" TIMESTAMP(3),
    "amendedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentRouting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAttribute" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reminders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duration" INTEGER NOT NULL DEFAULT 30,
    "durationPadding" INTEGER NOT NULL DEFAULT 0,
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resources" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "ServiceAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationTicket" (
    "id" SERIAL NOT NULL,
    "systemId" INTEGER NOT NULL,
    "appointmentId" INTEGER,
    "clinicId" INTEGER NOT NULL,
    "subject" TEXT DEFAULT '',
    "hpId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ConsultationTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationTicketHP" (
    "id" SERIAL NOT NULL,
    "consultationTicketId" INTEGER NOT NULL,
    "hpId" INTEGER NOT NULL,

    CONSTRAINT "ConsultationTicketHP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationTicketAttribute" (
    "id" SERIAL NOT NULL,
    "consultationTicketId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "noteTemplateId" INTEGER NOT NULL,
    "allowOtherHPToAddVitals" BOOLEAN NOT NULL DEFAULT false,
    "allowPatientToAddVitals" BOOLEAN NOT NULL DEFAULT false,
    "whitelistEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "ConsultationTicketAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "System" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "System_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationNote" (
    "id" SERIAL NOT NULL,
    "consultationTicketId" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "hpId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "showOnPatient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreAssessmentNote" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "assessment" TEXT NOT NULL,
    "homeInstructions" TEXT,
    "remarks" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreAssessmentNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreAssessmentNoteAttribute" (
    "id" SERIAL NOT NULL,
    "preAssessmentNoteId" INTEGER NOT NULL,
    "whitelistEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "PreAssessmentNoteAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intervention" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "hpId" INTEGER NOT NULL,
    "consultationTicketId" INTEGER NOT NULL,
    "actionId" INTEGER NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Intervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "medicationId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "hpId" INTEGER NOT NULL,
    "name" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dateArchived" TIMESTAMP(3),

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drug" (
    "id" SERIAL NOT NULL,
    "brandName" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,

    CONSTRAINT "Drug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "hpId" INTEGER NOT NULL,
    "patientId" INTEGER NOT NULL,
    "consultationTicketId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationDrug" (
    "id" SERIAL NOT NULL,
    "medicationId" INTEGER NOT NULL,
    "drugId" INTEGER NOT NULL,
    "isGeneric" BOOLEAN NOT NULL DEFAULT false,
    "dosage" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT,
    "notes" TEXT,
    "daysCount" INTEGER,

    CONSTRAINT "MedicationDrug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplateType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "DocumentTemplateType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicPrescriptionSetting" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "prescriptionTemplateId" INTEGER,

    CONSTRAINT "ClinicPrescriptionSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_userId_organizationId_role_key" ON "OrganizationMember"("userId", "organizationId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationRole_orgId_name_key" ON "OrganizationRole"("orgId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UserClinicAppointmentWhitelist_userId_clinicId_key" ON "UserClinicAppointmentWhitelist"("userId", "clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_clinicUid_key" ON "Clinic"("clinicUid");

-- CreateIndex
CREATE INDEX "clinic_index" ON "Clinic"("tenantId", "clinicUid");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicSetting_clinicId_key" ON "ClinicSetting"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicMember_clinicId_userId_roleId_key" ON "ClinicMember"("clinicId", "userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicOrganization_clinicId_organizationId_key" ON "ClinicOrganization"("clinicId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicMemberRole_clinicId_name_key" ON "ClinicMemberRole"("clinicId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentConfig_clinicId_key" ON "AppointmentConfig"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationConfig_clinicId_key" ON "ConsultationConfig"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicAppointmentTab_clinicId_appointmentTabId_key" ON "ClinicAppointmentTab"("clinicId", "appointmentTabId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicRoleAppointmentTab_clinicRoleId_clinicAppointmentTabI_key" ON "ClinicRoleAppointmentTab"("clinicRoleId", "clinicAppointmentTabId");

-- CreateIndex
CREATE INDEX "clinic_appointment_index" ON "Appointment"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentRequester_appointmentId_userId_key" ON "AppointmentRequester"("appointmentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentAttribute_appointmentId_key" ON "AppointmentAttribute"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentTypeAttribute_appointmentTypeId_key" ON "AppointmentTypeAttribute"("appointmentTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentRouting_routingCode_key" ON "AppointmentRouting"("routingCode");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentRouting_appointmentId_routedTo_key" ON "AppointmentRouting"("appointmentId", "routedTo");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAttribute_serviceId_key" ON "ServiceAttribute"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationTicketHP_consultationTicketId_hpId_key" ON "ConsultationTicketHP"("consultationTicketId", "hpId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationTicketAttribute_consultationTicketId_key" ON "ConsultationTicketAttribute"("consultationTicketId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationNote_consultationTicketId_section_hpId_key" ON "ConsultationNote"("consultationTicketId", "section", "hpId");

-- CreateIndex
CREATE UNIQUE INDEX "PreAssessmentNote_appointmentId_createdBy_key" ON "PreAssessmentNote"("appointmentId", "createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "PreAssessmentNoteAttribute_preAssessmentNoteId_key" ON "PreAssessmentNoteAttribute"("preAssessmentNoteId");

-- CreateIndex
CREATE INDEX "prescription_index" ON "Prescription"("clinicId", "medicationId", "templateId");

-- CreateIndex
CREATE INDEX "medication_index" ON "Medication"("patientId", "hpId", "consultationTicketId");

-- CreateIndex
CREATE UNIQUE INDEX "FileTypeAttribute_fileTypeId_scopeClincId_key" ON "FileTypeAttribute"("fileTypeId", "scopeClincId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_orgUid_key" ON "Organization"("orgUid");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_tenantUid_key" ON "Tenant"("tenantUid");

-- CreateIndex
CREATE UNIQUE INDEX "WhitelistFilter_userClinicAppointmentWhitelistId_filterId_v_key" ON "WhitelistFilter"("userClinicAppointmentWhitelistId", "filterId", "value");

-- AddForeignKey
ALTER TABLE "OrgMemberPermission" ADD CONSTRAINT "OrgMemberPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgMemberPermission" ADD CONSTRAINT "OrgMemberPermission_orgMemberId_fkey" FOREIGN KEY ("orgMemberId") REFERENCES "OrganizationMember"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMemberPermission" ADD CONSTRAINT "ClinicMemberPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMemberPermission" ADD CONSTRAINT "ClinicMemberPermission_clinicMemberId_fkey" FOREIGN KEY ("clinicMemberId") REFERENCES "ClinicMember"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgRoleInitialPermission" ADD CONSTRAINT "OrgRoleInitialPermission_orgRoleId_fkey" FOREIGN KEY ("orgRoleId") REFERENCES "OrganizationRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_acceptedBy_fkey" FOREIGN KEY ("acceptedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_role_fkey" FOREIGN KEY ("role") REFERENCES "OrganizationRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationRole" ADD CONSTRAINT "OrganizationRole_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultOrganizationRole" ADD CONSTRAINT "UserDefaultOrganizationRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "OrganizationRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FolderSetting" ADD CONSTRAINT "FolderSetting_scopeClincId_fkey" FOREIGN KEY ("scopeClincId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FileTypeAttribute" ADD CONSTRAINT "FileTypeAttribute_scopeClincId_fkey" FOREIGN KEY ("scopeClincId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserVaccination" ADD CONSTRAINT "UserVaccination_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationYearLevel" ADD CONSTRAINT "OrganizationYearLevel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_userOrganizationRoleId_fkey" FOREIGN KEY ("userOrganizationRoleId") REFERENCES "OrganizationRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_yearLevel_fkey" FOREIGN KEY ("yearLevel") REFERENCES "OrganizationYearLevel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserClinicAppointmentWhitelist" ADD CONSTRAINT "UserClinicAppointmentWhitelist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserClinicAppointmentWhitelist" ADD CONSTRAINT "UserClinicAppointmentWhitelist_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WhitelistFilter" ADD CONSTRAINT "WhitelistFilter_userClinicAppointmentWhitelistId_fkey" FOREIGN KEY ("userClinicAppointmentWhitelistId") REFERENCES "UserClinicAppointmentWhitelist"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_userOrganizationRoleId_fkey" FOREIGN KEY ("userOrganizationRoleId") REFERENCES "OrganizationRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clinic" ADD CONSTRAINT "Clinic_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicSetting" ADD CONSTRAINT "ClinicSetting_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMember" ADD CONSTRAINT "ClinicMember_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMember" ADD CONSTRAINT "ClinicMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMember" ADD CONSTRAINT "ClinicMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ClinicMemberRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicOrganization" ADD CONSTRAINT "ClinicOrganization_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicOrganization" ADD CONSTRAINT "ClinicOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMemberRole" ADD CONSTRAINT "ClinicMemberRole_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentConfig" ADD CONSTRAINT "AppointmentConfig_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationConfig" ADD CONSTRAINT "ConsultationConfig_noteTemplateId_fkey" FOREIGN KEY ("noteTemplateId") REFERENCES "NoteTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationConfig" ADD CONSTRAINT "ConsultationConfig_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicAppointmentTab" ADD CONSTRAINT "ClinicAppointmentTab_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicAppointmentTab" ADD CONSTRAINT "ClinicAppointmentTab_appointmentTabId_fkey" FOREIGN KEY ("appointmentTabId") REFERENCES "AppointmentTab"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicRoleAppointmentTab" ADD CONSTRAINT "ClinicRoleAppointmentTab_clinicRoleId_fkey" FOREIGN KEY ("clinicRoleId") REFERENCES "ClinicMemberRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicRoleAppointmentTab" ADD CONSTRAINT "ClinicRoleAppointmentTab_clinicAppointmentTabId_fkey" FOREIGN KEY ("clinicAppointmentTabId") REFERENCES "ClinicAppointmentTab"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicRoleAppointmentTab" ADD CONSTRAINT "ClinicRoleAppointmentTab_organizationRoleId_fkey" FOREIGN KEY ("organizationRoleId") REFERENCES "OrganizationRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttachment" ADD CONSTRAINT "AppointmentAttachment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequester" ADD CONSTRAINT "AppointmentRequester_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequester" ADD CONSTRAINT "AppointmentRequester_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_modeId_fkey" FOREIGN KEY ("modeId") REFERENCES "AppointmentMode"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "AppointmentType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentType" ADD CONSTRAINT "AppointmentType_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentTypeAttribute" ADD CONSTRAINT "AppointmentTypeAttribute_appointmentTypeId_fkey" FOREIGN KEY ("appointmentTypeId") REFERENCES "AppointmentType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentMode" ADD CONSTRAINT "AppointmentMode_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentRouting" ADD CONSTRAINT "AppointmentRouting_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentRouting" ADD CONSTRAINT "AppointmentRouting_routedBy_fkey" FOREIGN KEY ("routedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentRouting" ADD CONSTRAINT "AppointmentRouting_routedTo_fkey" FOREIGN KEY ("routedTo") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentRouting" ADD CONSTRAINT "AppointmentRouting_amendedBy_fkey" FOREIGN KEY ("amendedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ServiceAttribute" ADD CONSTRAINT "ServiceAttribute_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicket" ADD CONSTRAINT "ConsultationTicket_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicket" ADD CONSTRAINT "ConsultationTicket_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicket" ADD CONSTRAINT "ConsultationTicket_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicket" ADD CONSTRAINT "ConsultationTicket_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicketHP" ADD CONSTRAINT "ConsultationTicketHP_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicketHP" ADD CONSTRAINT "ConsultationTicketHP_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicketAttribute" ADD CONSTRAINT "ConsultationTicketAttribute_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicketAttribute" ADD CONSTRAINT "ConsultationTicketAttribute_noteTemplateId_fkey" FOREIGN KEY ("noteTemplateId") REFERENCES "NoteTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "System" ADD CONSTRAINT "System_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationNote" ADD CONSTRAINT "ConsultationNote_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationNote" ADD CONSTRAINT "ConsultationNote_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreAssessmentNote" ADD CONSTRAINT "PreAssessmentNote_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PreAssessmentNote" ADD CONSTRAINT "PreAssessmentNote_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PreAssessmentNoteAttribute" ADD CONSTRAINT "PreAssessmentNoteAttribute_preAssessmentNoteId_fkey" FOREIGN KEY ("preAssessmentNoteId") REFERENCES "PreAssessmentNote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationDrug" ADD CONSTRAINT "MedicationDrug_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationDrug" ADD CONSTRAINT "MedicationDrug_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_type_fkey" FOREIGN KEY ("type") REFERENCES "DocumentTemplateType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicPrescriptionSetting" ADD CONSTRAINT "ClinicPrescriptionSetting_prescriptionTemplateId_fkey" FOREIGN KEY ("prescriptionTemplateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
