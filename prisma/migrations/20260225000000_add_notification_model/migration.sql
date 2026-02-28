-- Create NotificationType enum
CREATE TYPE "NotificationType" AS ENUM (
  'APPOINTMENT_CREATED',
  'APPOINTMENT_CONFIRMED',
  'APPOINTMENT_CANCELLED',
  'APPOINTMENT_REJECTED',
  'APPOINTMENT_COMPLETED',
  'APPOINTMENT_RESCHEDULED',
  'APPOINTMENT_RECEIVED',
  'CONSULTATION_STARTED',
  'CONSULTATION_COMPLETED',
  'DIAGNOSTIC_ISSUED',
  'PRESCRIPTION_ISSUED',
  'MEDICAL_CERTIFICATE_ISSUED',
  'REFERRAL_ISSUED',
  'ORG_MEMBERSHIP_APPLIED',
  'ORG_MEMBERSHIP_APPROVED',
  'ORG_MEMBERSHIP_REJECTED',
  'ORG_MEMBERSHIP_SUSPENDED',
  'ORG_MEMBERSHIP_DEACTIVATED',
  'FILE_SHARED'
);

-- Create Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
  "id"        SERIAL PRIMARY KEY,
  "userId"    INTEGER NOT NULL,
  "type"      "NotificationType" NOT NULL,
  "title"     TEXT NOT NULL,
  "message"   TEXT NOT NULL,
  "link"      TEXT,
  "isRead"    BOOLEAN NOT NULL DEFAULT false,
  "metadata"  JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt"    TIMESTAMP(3)
);

-- Foreign key: Notification → User
ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- Indexes for performant queries
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx"
  ON "Notification"("userId", "isRead");

CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx"
  ON "Notification"("userId", "createdAt");
