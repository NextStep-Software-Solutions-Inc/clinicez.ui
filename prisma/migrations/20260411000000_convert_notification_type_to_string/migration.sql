-- Convert NotificationType from a PostgreSQL enum to a plain text column.
-- This eliminates the need for ALTER TYPE migrations when adding new
-- notification types; type safety is now enforced at the application layer.

-- 1. Convert Notification.type (enum → text)
ALTER TABLE "Notification"
  ALTER COLUMN "type" TYPE TEXT
  USING "type"::TEXT;

-- 2. Convert UserPreference.subscribedNotificationTypes (enum[] → text[])
ALTER TABLE "UserPreference"
  ALTER COLUMN "subscribedNotificationTypes" TYPE TEXT[]
  USING "subscribedNotificationTypes"::TEXT[];

-- 3. Drop the now-unused enum type
DROP TYPE IF EXISTS "NotificationType";
