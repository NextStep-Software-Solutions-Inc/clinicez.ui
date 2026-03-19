-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN IF NOT EXISTS "preferences" JSONB;
