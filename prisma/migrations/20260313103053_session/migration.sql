/*
  Warnings:

  - The values [SESSION_LOGIN,SESSION_LOGOUT,SESSION_REVOKED] on the enum `AuditAction` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'PERMISSION_GRANT', 'PERMISSION_REVOKE', 'STATUS_CHANGE', 'ONBOARDING', 'JOIN', 'LEAVE', 'CLAIM');
ALTER TABLE "AuditLog" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "public"."AuditAction_old";
COMMIT;
