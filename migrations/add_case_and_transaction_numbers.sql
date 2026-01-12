-- Migration: Add Case Numbers and Transaction Numbers to All Resources
-- Date: 2026-01-12
-- Description: Adds persistent storage for case numbers and transaction numbers across clinical resources

-- =============================================================================
-- 1. USER MODEL (PHR) - Add case number for health assessments
-- =============================================================================
ALTER TABLE "public"."User" 
  ADD COLUMN IF NOT EXISTS "caseNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "caseNumberGeneratedAt" TIMESTAMP(3);

-- Add unique constraint for User.caseNumber
ALTER TABLE "public"."User" 
  ADD CONSTRAINT "User_caseNumber_key" UNIQUE ("caseNumber");

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS "User_caseNumber_idx" ON "public"."User"("caseNumber");

-- =============================================================================
-- 2. APPOINTMENT MODEL - Add case number to link with consultations
-- =============================================================================
ALTER TABLE "public"."Appointment" 
  ADD COLUMN IF NOT EXISTS "caseNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "caseNumberGeneratedAt" TIMESTAMP(3);

-- Add unique constraint for Appointment.caseNumber
ALTER TABLE "public"."Appointment" 
  ADD CONSTRAINT "Appointment_caseNumber_key" UNIQUE ("caseNumber");

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS "Appointment_caseNumber_idx" ON "public"."Appointment"("caseNumber");

-- =============================================================================
-- 3. CONSULTATION TICKET - Add EKAS transaction numbers
-- =============================================================================
ALTER TABLE "public"."ConsultationTicket" 
  ADD COLUMN IF NOT EXISTS "ekasTransactionNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "ekasAuthorizationCode" TEXT,
  ADD COLUMN IF NOT EXISTS "ekasTransactionGeneratedAt" TIMESTAMP(3);

-- Add unique constraint for ekasTransactionNumber
ALTER TABLE "public"."ConsultationTicket" 
  ADD CONSTRAINT "ConsultationTicket_ekasTransactionNumber_key" UNIQUE ("ekasTransactionNumber");

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS "ConsultationTicket_ekasTransactionNumber_idx" 
  ON "public"."ConsultationTicket"("ekasTransactionNumber");

-- =============================================================================
-- 4. PRESCRIPTION - Add transaction number
-- =============================================================================
ALTER TABLE "public"."Prescription" 
  ADD COLUMN IF NOT EXISTS "transactionNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "transactionGeneratedAt" TIMESTAMP(3);

-- Add unique constraint for Prescription.transactionNumber
ALTER TABLE "public"."Prescription" 
  ADD CONSTRAINT "Prescription_transactionNumber_key" UNIQUE ("transactionNumber");

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS "Prescription_transactionNumber_idx" 
  ON "public"."Prescription"("transactionNumber");

-- =============================================================================
-- 5. CLINIC MEDICAL CERTIFICATE - Add transaction number
-- =============================================================================
ALTER TABLE "public"."ClinicMedicalCertificate" 
  ADD COLUMN IF NOT EXISTS "transactionNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "transactionGeneratedAt" TIMESTAMP(3);

-- Add unique constraint for ClinicMedicalCertificate.transactionNumber
ALTER TABLE "public"."ClinicMedicalCertificate" 
  ADD CONSTRAINT "ClinicMedicalCertificate_transactionNumber_key" UNIQUE ("transactionNumber");

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS "ClinicMedicalCertificate_transactionNumber_idx" 
  ON "public"."ClinicMedicalCertificate"("transactionNumber");

-- =============================================================================
-- 6. CLINIC IMAGING REQUEST - Add transaction number
-- =============================================================================
ALTER TABLE "public"."ClinicImagingRequest" 
  ADD COLUMN IF NOT EXISTS "transactionNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "transactionGeneratedAt" TIMESTAMP(3);

-- Add unique constraint for ClinicImagingRequest.transactionNumber
ALTER TABLE "public"."ClinicImagingRequest" 
  ADD CONSTRAINT "ClinicImagingRequest_transactionNumber_key" UNIQUE ("transactionNumber");

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS "ClinicImagingRequest_transactionNumber_idx" 
  ON "public"."ClinicImagingRequest"("transactionNumber");

-- =============================================================================
-- 7. CLINIC LABORATORY REQUEST - Add transaction number
-- =============================================================================
ALTER TABLE "public"."ClinicLaboratoryRequest" 
  ADD COLUMN IF NOT EXISTS "transactionNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "transactionGeneratedAt" TIMESTAMP(3);

-- Add unique constraint for ClinicLaboratoryRequest.transactionNumber
ALTER TABLE "public"."ClinicLaboratoryRequest" 
  ADD CONSTRAINT "ClinicLaboratoryRequest_transactionNumber_key" UNIQUE ("transactionNumber");

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS "ClinicLaboratoryRequest_transactionNumber_idx" 
  ON "public"."ClinicLaboratoryRequest"("transactionNumber");

-- =============================================================================
-- 8. CLINIC REFERRAL SLIP - Add transaction number
-- =============================================================================
ALTER TABLE "public"."ClinicReferralSlip" 
  ADD COLUMN IF NOT EXISTS "transactionNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "transactionGeneratedAt" TIMESTAMP(3);

-- Add unique constraint for ClinicReferralSlip.transactionNumber
ALTER TABLE "public"."ClinicReferralSlip" 
  ADD CONSTRAINT "ClinicReferralSlip_transactionNumber_key" UNIQUE ("transactionNumber");

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS "ClinicReferralSlip_transactionNumber_idx" 
  ON "public"."ClinicReferralSlip"("transactionNumber");

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Summary of changes:
-- - User: Added caseNumber for PHR health assessments
-- - Appointment: Added caseNumber to link with consultations
-- - ConsultationTicket: Added ekasTransactionNumber and ekasAuthorizationCode
-- - Prescription: Added transactionNumber
-- - ClinicMedicalCertificate: Added transactionNumber
-- - ClinicImagingRequest: Added transactionNumber
-- - ClinicLaboratoryRequest: Added transactionNumber
-- - ClinicReferralSlip: Added transactionNumber
--
-- All fields are nullable to support existing records
-- All transaction/case numbers have unique constraints
-- All fields are indexed for fast lookups
-- =============================================================================
