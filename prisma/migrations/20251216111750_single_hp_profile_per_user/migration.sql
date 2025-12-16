-- Migration: Enforce single Healthcare Provider profile per user
-- This migration converts the system from allowing multiple HP profiles per user (one per type)
-- to allowing only a single HP profile per user.
-- FORCE DELETE: This will permanently delete duplicate HP profiles and their related data.

-- Create a temporary table to store the IDs of duplicate HP profiles to be deleted
CREATE TEMP TABLE hp_ids_to_delete AS
SELECT id FROM "HealthcareProvider"
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM "HealthcareProvider" 
    GROUP BY "userId"
);

-- Step 1: Delete or nullify references in tables that have FK constraints to HealthcareProvider
-- Tables with ON DELETE NO ACTION need to be handled manually

-- Delete AppointmentTag records referencing duplicate HPs
DELETE FROM "AppointmentTag" WHERE "healthcareProviderId" IN (SELECT id FROM hp_ids_to_delete);

-- Nullify UserPreference.defaultHpId references to duplicate HPs
UPDATE "UserPreference" SET "defaultHpId" = NULL WHERE "defaultHpId" IN (SELECT id FROM hp_ids_to_delete);

-- Delete UserVaccination records referencing duplicate HPs  
DELETE FROM "UserVaccination" WHERE "hpId" IN (SELECT id FROM hp_ids_to_delete);

-- Delete ReservedTimeSlot records referencing duplicate HPs
DELETE FROM "ReservedTimeSlot" WHERE "hpId" IN (SELECT id FROM hp_ids_to_delete);

-- Nullify AppointmentAttribute.preferredAppointee references to duplicate HPs
UPDATE "AppointmentAttribute" SET "preferredAppointee" = NULL WHERE "preferredAppointee" IN (SELECT id FROM hp_ids_to_delete);

-- Delete AppointmentRouting records referencing duplicate HPs
DELETE FROM "AppointmentRouting" WHERE "routedTo" IN (SELECT id FROM hp_ids_to_delete);

-- Delete ConsultationTicketHP records referencing duplicate HPs
DELETE FROM "ConsultationTicketHP" WHERE "hpId" IN (SELECT id FROM hp_ids_to_delete);

-- Delete ConsultationNote records referencing duplicate HPs
DELETE FROM "ConsultationNote" WHERE "hpId" IN (SELECT id FROM hp_ids_to_delete);

-- Delete Intervention records referencing duplicate HPs
DELETE FROM "Intervention" WHERE "hpId" IN (SELECT id FROM hp_ids_to_delete);

-- Delete Prescription records referencing duplicate HPs
DELETE FROM "Prescription" WHERE "hpId" IN (SELECT id FROM hp_ids_to_delete);

-- Delete Medication records referencing duplicate HPs
DELETE FROM "Medication" WHERE "hpId" IN (SELECT id FROM hp_ids_to_delete);

-- Delete ClinicMedicalCertificate records referencing duplicate HPs
DELETE FROM "ClinicMedicalCertificate" WHERE "hpId" IN (SELECT id FROM hp_ids_to_delete);

-- Delete ClinicImagingRequest records referencing duplicate HPs
DELETE FROM "ClinicImagingRequest" WHERE "hpId" IN (SELECT id FROM hp_ids_to_delete);

-- Delete ClinicLaboratoryRequest records referencing duplicate HPs
DELETE FROM "ClinicLaboratoryRequest" WHERE "hpId" IN (SELECT id FROM hp_ids_to_delete);

-- Step 2: Now delete the duplicate HealthcareProvider records
-- HPProfile and ProfessionalDetails will be cascade deleted automatically
DELETE FROM "HealthcareProvider" WHERE id IN (SELECT id FROM hp_ids_to_delete);

-- Clean up temp table
DROP TABLE hp_ids_to_delete;

-- Step 3: Drop the old unique constraint that allowed multiple HP profiles per user (one per type)
DROP INDEX IF EXISTS "HealthcareProvider_userId_hpTypeId_key";

-- Step 4: Create a unique index that enforces single HP profile per user
CREATE UNIQUE INDEX "HealthcareProvider_userId_key" ON "HealthcareProvider"("userId");
