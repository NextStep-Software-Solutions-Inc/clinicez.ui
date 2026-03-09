-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN IF NOT EXISTS "muteNotifications" BOOLEAN NOT NULL DEFAULT false;
