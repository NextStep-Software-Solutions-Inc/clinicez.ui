-- AlterTable: move AI symptom analysis field from PreAssessmentNote to AppointmentAttribute
ALTER TABLE "AppointmentAttribute" ADD COLUMN IF NOT EXISTS "aiSymptomAnalysis" TEXT;
