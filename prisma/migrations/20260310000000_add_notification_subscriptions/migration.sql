-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN "subscribedNotificationTypes" "NotificationType"[] NOT NULL DEFAULT ARRAY[]::"NotificationType"[];
