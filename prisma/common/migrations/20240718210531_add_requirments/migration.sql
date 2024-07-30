-- AlterTable
ALTER TABLE "UserOrganizationRole" ADD COLUMN     "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[];
