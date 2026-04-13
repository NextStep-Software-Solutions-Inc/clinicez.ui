-- AlterTable
ALTER TABLE "OrganizationRole" ADD COLUMN IF NOT EXISTS "requirementSettings" JSONB NOT NULL DEFAULT '{}';
