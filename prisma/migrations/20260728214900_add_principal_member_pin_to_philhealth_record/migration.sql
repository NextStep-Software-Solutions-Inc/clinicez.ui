-- AlterTable
ALTER TABLE "PhilHealthRecord" ADD COLUMN IF NOT EXISTS "principalMemberPin" TEXT;
ALTER TABLE "PhilHealthRecord" DROP COLUMN IF EXISTS "dependentPin";
