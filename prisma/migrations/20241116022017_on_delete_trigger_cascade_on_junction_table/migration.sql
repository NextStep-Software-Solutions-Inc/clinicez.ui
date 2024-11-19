/*
  Warnings:

  - Made the column `prescriptionTemplateId` on table `ClinicPrescriptionSetting` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "AppointmentAttachment" DROP CONSTRAINT "AppointmentAttachment_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "AppointmentAttribute" DROP CONSTRAINT "AppointmentAttribute_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "AppointmentConfig" DROP CONSTRAINT "AppointmentConfig_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "AppointmentMode" DROP CONSTRAINT "AppointmentMode_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "AppointmentRouting" DROP CONSTRAINT "AppointmentRouting_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "AppointmentType" DROP CONSTRAINT "AppointmentType_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "AppointmentTypeAttribute" DROP CONSTRAINT "AppointmentTypeAttribute_appointmentTypeId_fkey";

-- DropForeignKey
ALTER TABLE "Clinic" DROP CONSTRAINT "Clinic_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicAppointmentTab" DROP CONSTRAINT "ClinicAppointmentTab_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicMember" DROP CONSTRAINT "ClinicMember_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicMemberPermission" DROP CONSTRAINT "ClinicMemberPermission_clinicMemberId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicMemberPermission" DROP CONSTRAINT "ClinicMemberPermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicMemberRole" DROP CONSTRAINT "ClinicMemberRole_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicOrganization" DROP CONSTRAINT "ClinicOrganization_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicOrganization" DROP CONSTRAINT "ClinicOrganization_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicPatientPermission" DROP CONSTRAINT "ClinicPatientPermission_clinicPatientId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicRoleAppointmentTab" DROP CONSTRAINT "ClinicRoleAppointmentTab_clinicAppointmentTabId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicRoleAppointmentTab" DROP CONSTRAINT "ClinicRoleAppointmentTab_clinicRoleId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicRoleInitialPermission" DROP CONSTRAINT "ClinicRoleInitialPermission_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicRoleInitialPermission" DROP CONSTRAINT "ClinicRoleInitialPermission_clinicRoleId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicRoleInitialPermission" DROP CONSTRAINT "ClinicRoleInitialPermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicSetting" DROP CONSTRAINT "ClinicSetting_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "ConsultationConfig" DROP CONSTRAINT "ConsultationConfig_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "ConsultationNote" DROP CONSTRAINT "ConsultationNote_consultationTicketId_fkey";

-- DropForeignKey
ALTER TABLE "ConsultationNote" DROP CONSTRAINT "ConsultationNote_hpId_fkey";

-- DropForeignKey
ALTER TABLE "ConsultationTicket" DROP CONSTRAINT "ConsultationTicket_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "ConsultationTicketAttribute" DROP CONSTRAINT "ConsultationTicketAttribute_consultationTicketId_fkey";

-- DropForeignKey
ALTER TABLE "ConsultationTicketHP" DROP CONSTRAINT "ConsultationTicketHP_consultationTicketId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentTemplate" DROP CONSTRAINT "DocumentTemplate_type_fkey";

-- DropForeignKey
ALTER TABLE "HPProfile" DROP CONSTRAINT "HPProfile_healthcareProviderId_fkey";

-- DropForeignKey
ALTER TABLE "HealthcareProvider" DROP CONSTRAINT "HealthcareProvider_userId_fkey";

-- DropForeignKey
ALTER TABLE "Intervention" DROP CONSTRAINT "Intervention_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "Medication" DROP CONSTRAINT "Medication_consultationTicketId_fkey";

-- DropForeignKey
ALTER TABLE "MedicationDrug" DROP CONSTRAINT "MedicationDrug_drugId_fkey";

-- DropForeignKey
ALTER TABLE "MedicationDrug" DROP CONSTRAINT "MedicationDrug_medicationId_fkey";

-- DropForeignKey
ALTER TABLE "NoteSection" DROP CONSTRAINT "NoteSection_noteTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "OrgMemberPermission" DROP CONSTRAINT "OrgMemberPermission_orgMemberId_fkey";

-- DropForeignKey
ALTER TABLE "OrgMemberPermission" DROP CONSTRAINT "OrgMemberPermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "OrgRoleInitialPermission" DROP CONSTRAINT "OrgRoleInitialPermission_orgId_fkey";

-- DropForeignKey
ALTER TABLE "OrgRoleInitialPermission" DROP CONSTRAINT "OrgRoleInitialPermission_orgRoleId_fkey";

-- DropForeignKey
ALTER TABLE "OrgRoleInitialPermission" DROP CONSTRAINT "OrgRoleInitialPermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationCollege" DROP CONSTRAINT "OrganizationCollege_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationDepartment" DROP CONSTRAINT "OrganizationDepartment_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMember" DROP CONSTRAINT "OrganizationMember_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMember" DROP CONSTRAINT "OrganizationMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationOffice" DROP CONSTRAINT "OrganizationOffice_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationProgram" DROP CONSTRAINT "OrganizationProgram_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationRole" DROP CONSTRAINT "OrganizationRole_orgId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationYearLevel" DROP CONSTRAINT "OrganizationYearLevel_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "PreAssessmentNoteAttribute" DROP CONSTRAINT "PreAssessmentNoteAttribute_preAssessmentNoteId_fkey";

-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_medicationId_fkey";

-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_templateId_fkey";

-- DropForeignKey
ALTER TABLE "ProfessionalDetails" DROP CONSTRAINT "ProfessionalDetails_healthcareProverId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceAttribute" DROP CONSTRAINT "ServiceAttribute_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceCategory" DROP CONSTRAINT "ServiceCategory_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "SocialLink" DROP CONSTRAINT "SocialLink_userId_fkey";

-- DropForeignKey
ALTER TABLE "System" DROP CONSTRAINT "System_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "UserClinicAppointmentWhitelist" DROP CONSTRAINT "UserClinicAppointmentWhitelist_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserDefaultClinicRole" DROP CONSTRAINT "UserDefaultClinicRole_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "UserDefaultClinicRole" DROP CONSTRAINT "UserDefaultClinicRole_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserDefaultOrganization" DROP CONSTRAINT "UserDefaultOrganization_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "UserDefaultOrganization" DROP CONSTRAINT "UserDefaultOrganization_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserDefaultOrganizationRole" DROP CONSTRAINT "UserDefaultOrganizationRole_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "UserDefaultOrganizationRole" DROP CONSTRAINT "UserDefaultOrganizationRole_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserDefaultTenant" DROP CONSTRAINT "UserDefaultTenant_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "UserDefaultTenant" DROP CONSTRAINT "UserDefaultTenant_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserEmploymentRecord" DROP CONSTRAINT "UserEmploymentRecord_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserEmploymentRecord" DROP CONSTRAINT "UserEmploymentRecord_userOrganizationRoleId_fkey";

-- DropForeignKey
ALTER TABLE "UserPermission" DROP CONSTRAINT "UserPermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "UserPermission" DROP CONSTRAINT "UserPermission_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserPlan" DROP CONSTRAINT "UserPlan_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreference" DROP CONSTRAINT "UserPreference_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserSchedule" DROP CONSTRAINT "UserSchedule_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserStudentRecord" DROP CONSTRAINT "UserStudentRecord_userId_fkey";

-- DropForeignKey
ALTER TABLE "VaccineAttribute" DROP CONSTRAINT "VaccineAttribute_vaccineId_fkey";

-- DropForeignKey
ALTER TABLE "VaccineDose" DROP CONSTRAINT "VaccineDose_doseId_fkey";

-- DropForeignKey
ALTER TABLE "VaccineDose" DROP CONSTRAINT "VaccineDose_vaccineId_fkey";

-- DropForeignKey
ALTER TABLE "VaccineRoute" DROP CONSTRAINT "VaccineRoute_routeId_fkey";

-- DropForeignKey
ALTER TABLE "VaccineRoute" DROP CONSTRAINT "VaccineRoute_vaccineId_fkey";

-- DropForeignKey
ALTER TABLE "WhitelistFilter" DROP CONSTRAINT "WhitelistFilter_filterId_fkey";

-- DropForeignKey
ALTER TABLE "WhitelistFilter" DROP CONSTRAINT "WhitelistFilter_userClinicAppointmentWhitelistId_fkey";

-- AlterTable
ALTER TABLE "ClinicPrescriptionSetting" ALTER COLUMN "prescriptionTemplateId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ClinicPatientPermission" ADD CONSTRAINT "ClinicPatientPermission_clinicPatientId_fkey" FOREIGN KEY ("clinicPatientId") REFERENCES "ClinicPatient"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgMemberPermission" ADD CONSTRAINT "OrgMemberPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgMemberPermission" ADD CONSTRAINT "OrgMemberPermission_orgMemberId_fkey" FOREIGN KEY ("orgMemberId") REFERENCES "OrganizationMember"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMemberPermission" ADD CONSTRAINT "ClinicMemberPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMemberPermission" ADD CONSTRAINT "ClinicMemberPermission_clinicMemberId_fkey" FOREIGN KEY ("clinicMemberId") REFERENCES "ClinicMember"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgRoleInitialPermission" ADD CONSTRAINT "OrgRoleInitialPermission_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgRoleInitialPermission" ADD CONSTRAINT "OrgRoleInitialPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgRoleInitialPermission" ADD CONSTRAINT "OrgRoleInitialPermission_orgRoleId_fkey" FOREIGN KEY ("orgRoleId") REFERENCES "OrganizationRole"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicRoleInitialPermission" ADD CONSTRAINT "ClinicRoleInitialPermission_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicRoleInitialPermission" ADD CONSTRAINT "ClinicRoleInitialPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicRoleInitialPermission" ADD CONSTRAINT "ClinicRoleInitialPermission_clinicRoleId_fkey" FOREIGN KEY ("clinicRoleId") REFERENCES "ClinicMemberRole"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationRole" ADD CONSTRAINT "OrganizationRole_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserPlan" ADD CONSTRAINT "UserPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "HealthcareProvider" ADD CONSTRAINT "HealthcareProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "HPProfile" ADD CONSTRAINT "HPProfile_healthcareProviderId_fkey" FOREIGN KEY ("healthcareProviderId") REFERENCES "HealthcareProvider"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProfessionalDetails" ADD CONSTRAINT "ProfessionalDetails_healthcareProverId_fkey" FOREIGN KEY ("healthcareProverId") REFERENCES "HealthcareProvider"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultOrganization" ADD CONSTRAINT "UserDefaultOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultOrganization" ADD CONSTRAINT "UserDefaultOrganization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultOrganizationRole" ADD CONSTRAINT "UserDefaultOrganizationRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultOrganizationRole" ADD CONSTRAINT "UserDefaultOrganizationRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultClinicRole" ADD CONSTRAINT "UserDefaultClinicRole_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultClinicRole" ADD CONSTRAINT "UserDefaultClinicRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultTenant" ADD CONSTRAINT "UserDefaultTenant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultTenant" ADD CONSTRAINT "UserDefaultTenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SocialLink" ADD CONSTRAINT "SocialLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VaccineAttribute" ADD CONSTRAINT "VaccineAttribute_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "Vaccine"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VaccineRoute" ADD CONSTRAINT "VaccineRoute_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VaccineRoute" ADD CONSTRAINT "VaccineRoute_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "Vaccine"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VaccineDose" ADD CONSTRAINT "VaccineDose_doseId_fkey" FOREIGN KEY ("doseId") REFERENCES "Dose"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VaccineDose" ADD CONSTRAINT "VaccineDose_vaccineId_fkey" FOREIGN KEY ("vaccineId") REFERENCES "Vaccine"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationDepartment" ADD CONSTRAINT "OrganizationDepartment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationProgram" ADD CONSTRAINT "OrganizationProgram_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationCollege" ADD CONSTRAINT "OrganizationCollege_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationYearLevel" ADD CONSTRAINT "OrganizationYearLevel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserClinicAppointmentWhitelist" ADD CONSTRAINT "UserClinicAppointmentWhitelist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WhitelistFilter" ADD CONSTRAINT "WhitelistFilter_filterId_fkey" FOREIGN KEY ("filterId") REFERENCES "Filter"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WhitelistFilter" ADD CONSTRAINT "WhitelistFilter_userClinicAppointmentWhitelistId_fkey" FOREIGN KEY ("userClinicAppointmentWhitelistId") REFERENCES "UserClinicAppointmentWhitelist"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationOffice" ADD CONSTRAINT "OrganizationOffice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_userOrganizationRoleId_fkey" FOREIGN KEY ("userOrganizationRoleId") REFERENCES "OrganizationRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserSchedule" ADD CONSTRAINT "UserSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Clinic" ADD CONSTRAINT "Clinic_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicSetting" ADD CONSTRAINT "ClinicSetting_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMember" ADD CONSTRAINT "ClinicMember_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicOrganization" ADD CONSTRAINT "ClinicOrganization_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicOrganization" ADD CONSTRAINT "ClinicOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMemberRole" ADD CONSTRAINT "ClinicMemberRole_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentConfig" ADD CONSTRAINT "AppointmentConfig_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationConfig" ADD CONSTRAINT "ConsultationConfig_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "NoteSection" ADD CONSTRAINT "NoteSection_noteTemplateId_fkey" FOREIGN KEY ("noteTemplateId") REFERENCES "NoteTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicAppointmentTab" ADD CONSTRAINT "ClinicAppointmentTab_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicRoleAppointmentTab" ADD CONSTRAINT "ClinicRoleAppointmentTab_clinicRoleId_fkey" FOREIGN KEY ("clinicRoleId") REFERENCES "ClinicMemberRole"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicRoleAppointmentTab" ADD CONSTRAINT "ClinicRoleAppointmentTab_clinicAppointmentTabId_fkey" FOREIGN KEY ("clinicAppointmentTabId") REFERENCES "ClinicAppointmentTab"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttachment" ADD CONSTRAINT "AppointmentAttachment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentType" ADD CONSTRAINT "AppointmentType_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentTypeAttribute" ADD CONSTRAINT "AppointmentTypeAttribute_appointmentTypeId_fkey" FOREIGN KEY ("appointmentTypeId") REFERENCES "AppointmentType"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentMode" ADD CONSTRAINT "AppointmentMode_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentRouting" ADD CONSTRAINT "AppointmentRouting_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ServiceAttribute" ADD CONSTRAINT "ServiceAttribute_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicket" ADD CONSTRAINT "ConsultationTicket_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicketHP" ADD CONSTRAINT "ConsultationTicketHP_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationTicketAttribute" ADD CONSTRAINT "ConsultationTicketAttribute_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "System" ADD CONSTRAINT "System_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationNote" ADD CONSTRAINT "ConsultationNote_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConsultationNote" ADD CONSTRAINT "ConsultationNote_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PreAssessmentNoteAttribute" ADD CONSTRAINT "PreAssessmentNoteAttribute_preAssessmentNoteId_fkey" FOREIGN KEY ("preAssessmentNoteId") REFERENCES "PreAssessmentNote"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MedicationDrug" ADD CONSTRAINT "MedicationDrug_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MedicationDrug" ADD CONSTRAINT "MedicationDrug_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_type_fkey" FOREIGN KEY ("type") REFERENCES "DocumentTemplateType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
