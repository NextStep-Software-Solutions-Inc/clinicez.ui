-- Convert NotificationType from a PostgreSQL enum to a plain text column.
-- This eliminates the need for ALTER TYPE migrations when adding new
-- notification types; type safety is now enforced at the application layer.

-- 1. Convert Notification.type (enum → text)
ALTER TABLE "Notification"
  ALTER COLUMN "type" TYPE TEXT
  USING "type"::TEXT;

-- 2. Drop the enum-typed DEFAULT on subscribedNotificationTypes before
--    converting the column; the default expression depends on the enum type
--    and PostgreSQL will refuse to drop the type while the default exists.
ALTER TABLE "UserPreference"
  ALTER COLUMN "subscribedNotificationTypes" DROP DEFAULT;

-- 3. Convert UserPreference.subscribedNotificationTypes (enum[] → text[])
ALTER TABLE "UserPreference"
  ALTER COLUMN "subscribedNotificationTypes" TYPE TEXT[]
  USING "subscribedNotificationTypes"::TEXT[];

-- 4. Re-apply an equivalent plain text[] default (empty array)
ALTER TABLE "UserPreference"
  ALTER COLUMN "subscribedNotificationTypes" SET DEFAULT ARRAY[]::TEXT[];

-- 5. Drop the now-unused enum type
DROP TYPE IF EXISTS "NotificationType";
