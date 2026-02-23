-- AlterTable ClinicRole: add canAccessDashboard flag
ALTER TABLE "ClinicRole" ADD COLUMN IF NOT EXISTS "canAccessDashboard" BOOLEAN NOT NULL DEFAULT false;
