-- AlterTable OrganizationRole: add canAccessDashboard flag
ALTER TABLE "OrganizationRole" ADD COLUMN IF NOT EXISTS "canAccessDashboard" BOOLEAN NOT NULL DEFAULT false;
